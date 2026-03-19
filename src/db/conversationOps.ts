/**
 * conversationOps — Operaciones CRUD para el historial de conversaciones
 *
 * Todas las operaciones son append-only:
 * - Las conversaciones se crean y se cierran, nunca se editan.
 * - Los mensajes se añaden, nunca se modifican.
 */

import { db } from './database';
import type {
  Conversation,
  ConversationMessage,
  ConversationSource,
} from './database';

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
  const conversation: Conversation = {
    source,
    title,
    startedAt: new Date(),
    messageCount: 0,
  };
  return (await db.conversations.add(conversation)) as number;
}

/**
 * Cierra una conversación registrando duración, resumen y snapshot clínico.
 */
export async function closeConversation(
  conversationId: number,
  options?: {
    summary?: string;
    clinicalSnapshot?: Record<string, unknown>;
  },
): Promise<void> {
  const conv = await db.conversations.get(conversationId);
  if (!conv) return;

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - conv.startedAt.getTime();
  const messageCount = await db.conversationMessages
    .where('conversationId')
    .equals(conversationId)
    .count();

  await db.conversations.update(conversationId, {
    endedAt,
    durationMs,
    messageCount,
    summary: options?.summary,
    clinicalSnapshot: options?.clinicalSnapshot,
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
  role: ConversationMessage['role'],
  text: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  const message: ConversationMessage = {
    conversationId,
    role,
    text,
    timestamp: new Date(),
    metadata,
  };
  const id = (await db.conversationMessages.add(message)) as number;

  // Actualizar contador
  const count = await db.conversationMessages
    .where('conversationId')
    .equals(conversationId)
    .count();
  await db.conversations.update(conversationId, { messageCount: count });

  return id;
}

/**
 * Persiste un array completo de mensajes de una sola vez.
 * Ideal para guardar una conversación ya finalizada (ej: al cerrar la entrevista).
 */
export async function bulkAddMessages(
  conversationId: number,
  messages: Array<{
    role: ConversationMessage['role'];
    text: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
  }>,
): Promise<void> {
  const records: ConversationMessage[] = messages.map((m, i) => ({
    conversationId,
    role: m.role,
    text: m.text,
    timestamp: m.timestamp ?? new Date(Date.now() + i),
    metadata: m.metadata,
  }));

  await db.conversationMessages.bulkAdd(records);

  await db.conversations.update(conversationId, {
    messageCount: records.length,
  });
}

// ============================================================================
// QUERIES DE LECTURA
// ============================================================================

/**
 * Obtiene todas las conversaciones, ordenadas por fecha descendente.
 */
export async function getAllConversations(): Promise<Conversation[]> {
  return db.conversations.orderBy('startedAt').reverse().toArray();
}

/**
 * Obtiene conversaciones filtradas por fuente.
 */
export async function getConversationsBySource(
  source: ConversationSource,
): Promise<Conversation[]> {
  return db.conversations
    .where('source')
    .equals(source)
    .reverse()
    .sortBy('startedAt');
}

/**
 * Obtiene todos los mensajes de una conversación, ordenados cronológicamente.
 */
export async function getConversationMessages(
  conversationId: number,
): Promise<ConversationMessage[]> {
  return db.conversationMessages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('timestamp');
}

/**
 * Obtiene una conversación por ID.
 */
export async function getConversation(
  id: number,
): Promise<Conversation | undefined> {
  return db.conversations.get(id);
}

/**
 * Cuenta el total de conversaciones almacenadas.
 */
export async function getConversationCount(): Promise<number> {
  return db.conversations.count();
}

/**
 * Elimina una conversación y todos sus mensajes.
 */
export async function deleteConversation(
  conversationId: number,
): Promise<void> {
  await db.transaction('rw', [db.conversations, db.conversationMessages], async () => {
    await db.conversationMessages
      .where('conversationId')
      .equals(conversationId)
      .delete();
    await db.conversations.delete(conversationId);
  });
}

/**
 * Guarda la entrevista actual completa del interviewStore como una conversación.
 * Recibe los datos directamente para no depender del store de Zustand.
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
    role: (m.role === 'usr' ? 'user' : 'assistant') as ConversationMessage['role'],
    text: m.text,
    timestamp: new Date(m.timestamp),
  }));

  await bulkAddMessages(convId, mapped);

  await closeConversation(convId, {
    summary: data.hypothesis ?? undefined,
    clinicalSnapshot: {
      clinicalAlerts: data.clinicalAlerts,
      bdiScore: data.bdiScore,
      baiScore: data.baiScore,
    },
  });

  return convId;
}
