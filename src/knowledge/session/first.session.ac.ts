/**
 * first.session.ac.ts — Flujo de primera sesión (sesión 1 AC)
 *
 * Secuencia clínica: evaluación, inventario, psicoeducación, tarea, feedback.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 * Carga contenido de psicoeducación desde el KB (area_01_conocimiento).
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';
import { BDI_II_DEFINITION } from '../inventories/definitions/bdi_ii_definition';
import { analyzeSessionPatterns } from '../patient/patternProcessor';
import { usePatientStore } from '@/features/patient/patientStore';

// ============================================================================
// Tipos
// ============================================================================

export interface FirstSessionResult {
    presentacion: string;
    motivoConsulta: string;
    bdiAdmin: {
        puntuacion: number;
        alertaCritica: boolean;
        interpretacion: string;
    };
    psicoeducacion: string;
    tareaAsignada: string;
    feedback: string;
    salida: SessionOutput;
}

// ============================================================================
// Tipo KB (forma del JSON area_01_conocimiento)
// ============================================================================

interface ConocimientoKB {
    fundamentos_teoricos?: {
        mecanismo_de_cambio?: string;
    };
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de la primera sesión AC.
 *
 * Pasos:
 *   1. Presentación y motivo de consulta
 *   2. Administración BDI-II (usa último registro del paciente)
 *   3. Psicoeducación sobre modelo AC (cargada desde KB)
 *   4. Asignación de tarea de monitoreo
 *   5. Feedback y cierre
 *   6. Validación ética via orchestrateSession()
 */
export async function runFirstSessionAC(context: SessionContext): Promise<FirstSessionResult> {
    // 1. Presentación y motivo de consulta
    const presentacion = `Bienvenido/a, ${context.paciente.profile.nombre}. Soy tu asistente terapéutico.`;
    const motivoConsulta = context.paciente.profile.motivoConsulta;

    // 2. Administración BDI-II (usar último registro)
    const bdiTimeline = context.paciente.inventarios.find(i => i.inventario === 'BDI-II');
    const lastBDI = bdiTimeline?.administraciones.slice(-1)[0];
    const puntuacion = lastBDI?.puntuacion ?? 0;
    const alertaCritica = lastBDI?.alertaCritica ?? false;
    const matchedLevel = BDI_II_DEFINITION.severity_levels.find(
        sl => puntuacion >= sl.range_min && puntuacion <= sl.range_max
    );
    let interpretacion = matchedLevel?.label ?? 'Sin datos.';
    if (alertaCritica) interpretacion += ' ¡Alerta crítica detectada!';

    // 3. Psicoeducación — cargar desde KB con fallback
    let psicoeducacion: string;
    try {
        const conocimiento = await loadKBData<ConocimientoKB>('ac', KBArea.CONOCIMIENTO);
        psicoeducacion = conocimiento.fundamentos_teoricos?.mecanismo_de_cambio
            ?? 'El modelo AC se basa en la relación entre actividad y estado de ánimo.';
    } catch {
        // Fallback si KB no disponible (tests sin registry)
        psicoeducacion = 'El modelo AC se basa en la Actividad y el Contexto. Te explicaremos cómo monitorear tu actividad para mejorar tu estado de ánimo.';
    }

    // 4. Asignación de monitoreo de actividad
    const tareaAsignada = 'Registrar actividades diarias durante la próxima semana.';

    // 5. Feedback y cierre
    const feedback = 'Gracias por tu participación. Recuerda que el monitoreo es clave para tu progreso.';

    // 6. Orquestador real — validación ética + decisión clínica
    const salida = await orchestrateSession(context);

    // 7. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const previousBDI = folder.interviewReport.therapistView.bdi.score;

            const sessionData = {
                number: 1,
                type: 'ac_1' as const,
                transcript: `Presentación: ${presentacion}\nMotivo: ${motivoConsulta}\nPsicoeducación: ${psicoeducacion}`,
                inventoriesAdministered: [{
                    inventario: 'BDI-II',
                    puntuacion: puntuacion || 0,
                    alertaCritica: alertaCritica
                }],
                rapportScore: context.rapportScore,
                emotionalTone: context.estadoEmocional
            };

            const analysis = await analyzeSessionPatterns(
                sessionData,
                folder.interviewReport,
                previousBDI
            );

            const logEntry = {
                sessionNumber: 1,
                sessionType: 'ac_1' as const,
                analyzedAt: Date.now(),
                analysis,
                therapistActionItems: analysis.alerts
                    .filter(a => a.severity === 'critical' || a.severity === 'high')
                    .map(a => `⚠️ ${a.recommendedAction}`),
                nextSessionSuggestions: analysis.suggestions
                    .map(s => `${s.technique} (${s.priority})`)
            };

            appendPatternLogEntry(context.paciente.patientId, logEntry);
        }
    } catch (error) {
        console.warn('[PatternProcessor] Error analyzing session patterns:', error);
    }

    return {
        presentacion,
        motivoConsulta,
        bdiAdmin: { puntuacion, alertaCritica, interpretacion },
        psicoeducacion,
        tareaAsignada,
        feedback,
        salida,
    };
}
