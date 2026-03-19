/**
 * Obtiene el último registro clínico relevante para construir el mensaje terapéutico.
 * Prioridad: última sesión completada > último síntoma activo > motivo de consulta.
 */
import { db, type Session } from './database';

export async function getLatestClinicalMessage(patientId?: string): Promise<string> {
    let patientRecordId: number | undefined;
    if (patientId) {
        const patientRecord = await db.patientRecords.where('patientId').equals(patientId).first();
        patientRecordId = patientRecord?.id;
    }

    // 1. Última sesión completada (filtered by patient if provided)
    let completedSessions: Session[];
    if (patientRecordId) {
        completedSessions = await db.sessions
            .where('patientId').equals(patientRecordId)
            .filter(s => s.status === 'completed')
            .sortBy('startedAt');
    } else {
        completedSessions = await db.sessions
            .orderBy('startedAt')
            .filter(s => s.status === 'completed')
            .toArray();
    }
    const lastSession = completedSessions.length ? completedSessions[completedSessions.length - 1] : undefined;
    if (lastSession && lastSession.sessionNote) {
        return lastSession.sessionNote;
    }

    // 2. Último síntoma activo (symptomEntries lack patientId — scoped via session if needed)
    const lastSymptom = await db.symptomEntries.orderBy('lastUpdatedAt').reverse().filter(s => s.status === 'active').first();
    if (lastSymptom && lastSymptom.description) {
        return `Síntoma actual: ${lastSymptom.description}`;
    }

    // 3. Motivo de consulta (desde PatientRecord, que es la fuente de verdad de intake)
    if (patientId) {
        const patientRecord = await db.patientRecords.where('patientId').equals(patientId).first();
        if (patientRecord?.mainReasonText) {
            return `Motivo de consulta: ${patientRecord.mainReasonText}`;
        }
    }

    // 4. Fallback
    return 'No hay registro clínico reciente.';
}
