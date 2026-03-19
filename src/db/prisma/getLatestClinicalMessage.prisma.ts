/**
 * getLatestClinicalMessage.prisma — Versión Prisma/SQLite
 *
 * Obtiene el último registro clínico relevante para construir el mensaje terapéutico.
 * Cascada de prioridad:
 *   1. Nota de la última sesión completada
 *   2. Descripción del último síntoma activo
 *   3. Motivo de consulta del perfil clínico
 *   4. Fallback genérico
 *
 * La lógica es idéntica a src/db/getLatestClinicalMessage.ts (Dexie),
 * pero usa PrismaClient con queries SQL optimizadas (findFirst + orderBy
 * en lugar del patrón Dexie orderBy().reverse().filter().first()).
 */

import { prisma } from './client';

export async function getLatestClinicalMessagePrisma(): Promise<string> {
    // 1. Última sesión completada con nota
    const lastSession = await prisma.session.findFirst({
        where: {
            status: 'completed',
            sessionNote: { not: null },
        },
        orderBy: { endedAt: 'desc' },
        select: { sessionNote: true },
    });
    if (lastSession?.sessionNote) {
        return lastSession.sessionNote;
    }

    // 2. Último síntoma activo
    const lastSymptom = await prisma.symptomEntry.findFirst({
        where: { status: 'active' },
        orderBy: { lastUpdatedAt: 'desc' },
        select: { description: true },
    });
    if (lastSymptom?.description) {
        return `Síntoma actual: ${lastSymptom.description}`;
    }

    // 3. Motivo de consulta del perfil clínico (singleton id=1)
    const profile = await prisma.clinicalProfile.findFirst({
        where: { id: 1 },
        select: { chiefComplaint: true },
    });
    if (profile?.chiefComplaint) {
        return `Motivo de consulta: ${profile.chiefComplaint}`;
    }

    // 4. Fallback
    return 'No hay registro clínico reciente.';
}
