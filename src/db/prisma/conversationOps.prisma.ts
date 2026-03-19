/**
 * conversationOps.prisma — Operaciones CRUD para conversaciones via Prisma/SQLite
 *
 * API idéntica a src/db/conversationOps.ts (Dexie), pero usando PrismaClient.
 * Diseñado para entornos Node.js: tests, scripts, futuro backend.
 *
 * Todas las operaciones son append-only:
 * - Las conversaciones se crean y se cierran, nunca se editan.
 * - Los mensajes se añaden, nunca se modifican.
 */

import { prisma } from './client';
import type { Prisma } from '@prisma/client';

// ============================================================================
// Tipos re-exportados para no depender de database.ts en contexto Prisma
// ============================================================================

export type ConversationSource =
    | 'interview'
    | 'emotional_chat'
    | 'primer_encuentro'
    | 'session_intake'
    | 'session_other'
    | 'free';

export type MessageRole = 'user' | 'assistant' | 'system';

// ============================================================================
// CREAR Y CERRAR CONVERSACIONES
// ============================================================================

/**
 * Inicia una nueva conversación y devuelve su ID.
 */
export async function startConversation(
    source: ConversationSource,
    title: string,
): Promise<number> {
    const conversation = await prisma.conversation.create({
        data: {
            source,
            title,
            startedAt: new Date(),
            messageCount: 0,
        },
    });
    return conversation.id;
}

/**
 * Cierra una conversación registrando duración, resumen y snapshot clínico.
 */
export async function closeConversation(
    conversationId: number,
    options?: {
        summary?: string;
        clinicalSnapshot?: Prisma.InputJsonValue;
    },
): Promise<void> {
    const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conv) return;

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - conv.startedAt.getTime();
    const messageCount = await prisma.conversationMessage.count({
        where: { conversationId },
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            endedAt,
            durationMs,
            messageCount,
            summary: options?.summary,
            clinicalSnapshot: options?.clinicalSnapshot ?? undefined,
        },
    });
}

// ============================================================================
// MENSAJES
// ============================================================================

/**
 * Añade un mensaje a una conversación existente.
 */
export async function addConversationMessage(
    conversationId: number,
    role: MessageRole,
    text: string,
    metadata?: Prisma.InputJsonValue,
): Promise<number> {
    const message = await prisma.conversationMessage.create({
        data: {
            conversationId,
            role,
            text,
            timestamp: new Date(),
            metadata: metadata ?? undefined,
        },
    });

    // Actualizar contador
    const count = await prisma.conversationMessage.count({
        where: { conversationId },
    });
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { messageCount: count },
    });

    return message.id;
}

/**
 * Persiste un array completo de mensajes de una sola vez.
 * Ideal para guardar una conversación ya finalizada (ej: al cerrar la entrevista).
 */
export async function bulkAddMessages(
    conversationId: number,
    messages: Array<{
        role: MessageRole;
        text: string;
        timestamp?: Date;
        metadata?: Prisma.InputJsonValue;
    }>,
): Promise<void> {
    // Prisma createMany es más eficiente que crear uno por uno
    await prisma.conversationMessage.createMany({
        data: messages.map((m, i) => ({
            conversationId,
            role: m.role,
            text: m.text,
            timestamp: m.timestamp ?? new Date(Date.now() + i),
            metadata: m.metadata ?? undefined,
        })),
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { messageCount: messages.length },
    });
}

// ============================================================================
// QUERIES DE LECTURA
// ============================================================================

/**
 * Obtiene todas las conversaciones, ordenadas por fecha descendente.
 */
export async function getAllConversations() {
    return prisma.conversation.findMany({
        orderBy: { startedAt: 'desc' },
    });
}

/**
 * Obtiene conversaciones filtradas por fuente.
 */
export async function getConversationsBySource(source: ConversationSource) {
    return prisma.conversation.findMany({
        where: { source },
        orderBy: { startedAt: 'desc' },
    });
}

/**
 * Obtiene todos los mensajes de una conversación, ordenados cronológicamente.
 */
export async function getConversationMessages(conversationId: number) {
    return prisma.conversationMessage.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
    });
}

/**
 * Obtiene una conversación por ID.
 */
export async function getConversation(id: number) {
    return prisma.conversation.findUnique({ where: { id } });
}

/**
 * Cuenta el total de conversaciones almacenadas.
 */
export async function getConversationCount(): Promise<number> {
    return prisma.conversation.count();
}

/**
 * Elimina una conversación y todos sus mensajes.
 * Usa onDelete: Cascade definido en el schema para los mensajes.
 */
export async function deleteConversation(conversationId: number): Promise<void> {
    // El cascade en el schema Prisma elimina los mensajes automáticamente
    await prisma.conversation.delete({
        where: { id: conversationId },
    });
}

/**
 * Guarda la entrevista actual completa como una conversación.
 * Recibe los datos directamente para no depender de stores de Zustand.
 */
export async function saveInterviewAsConversation(data: {
    startedAt: number;
    messages: Array<{ role: 'sys' | 'usr'; text: string; timestamp: number }>;
    hypothesis: string | null;
    chiefComplaint?: string;
    clinicalAlerts?: Record<string, unknown>;
    bdiScore?: number;
    baiScore?: number;
}): Promise<number> {
    const title =
        data.chiefComplaint?.slice(0, 80) ||
        data.messages.find((m) => m.role === 'usr')?.text.slice(0, 80) ||
        'Entrevista clínica';

    const convId = await startConversation('interview', title);

    const mapped = data.messages.map((m) => ({
        role: (m.role === 'usr' ? 'user' : 'assistant') as MessageRole,
        text: m.text,
        timestamp: new Date(m.timestamp),
    }));

    await bulkAddMessages(convId, mapped);

    await closeConversation(convId, {
        summary: data.hypothesis ?? undefined,
        clinicalSnapshot: {
            clinicalAlerts: data.clinicalAlerts ?? null,
            bdiScore: data.bdiScore ?? null,
            baiScore: data.baiScore ?? null,
        } as Prisma.InputJsonValue,
    });

    return convId;
}
