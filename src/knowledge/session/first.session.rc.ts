/**
 * first.session.rc.ts — Flujo de primera sesión (sesión 1 RC)
 *
 * Secuencia clínica: evaluación, inventario, psicoeducación modelo cognitivo, tarea.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 * Carga contenido de psicoeducación desde el KB (area_01_conocimiento, técnica 'rc').
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

export interface FirstSessionRCResult {
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
// Tipo KB (forma del JSON area_01_conocimiento RC)
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
 * Implementa el flujo de la primera sesión RC.
 *
 * Pasos:
 *   1. Presentación y motivo de consulta
 *   2. Administración BDI-II (usa último registro del paciente)
 *   3. Psicoeducación sobre modelo cognitivo (cargada desde KB RC)
 *   4. Asignación de tarea de registro de pensamientos
 *   5. Feedback y cierre
 *   6. Validación ética via orchestrateSession() con techniqueId='rc'
 */
export async function runFirstSessionRC(context: SessionContext): Promise<FirstSessionRCResult> {
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

    // 3. Psicoeducación — cargar modelo cognitivo desde KB RC con fallback
    let psicoeducacion: string;
    try {
        const conocimiento = await loadKBData<ConocimientoKB>('rc', KBArea.CONOCIMIENTO);
        psicoeducacion = conocimiento.fundamentos_teoricos?.mecanismo_de_cambio
            ?? 'La RC opera identificando pensamientos automáticos negativos y evaluándolos mediante evidencia.';
    } catch {
        psicoeducacion = 'La Reestructuración Cognitiva se basa en el modelo cognitivo: no son los eventos los que generan malestar, sino la interpretación que hacemos de ellos.';
    }

    // 4. Asignación de registro de pensamientos automáticos (3 columnas)
    const tareaAsignada = 'Registro de pensamientos automáticos de 3 columnas: Situación → Pensamiento → Emoción (con intensidad 0-100).';

    // 5. Feedback y cierre
    const feedback = 'Gracias por tu participación. El registro de pensamientos nos permitirá identificar patrones cognitivos en la próxima sesión.';

    // 6. Orquestador real — validación ética + decisión clínica (con perfil RC)
    const salida = await orchestrateSession({ ...context, techniqueId: 'rc' });

    // 7. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 1,
                type: 'rc_1' as const,
                transcript: `Presentación RC: ${presentacion}\nMotivo: ${motivoConsulta}\nPsicoeducación: ${psicoeducacion}`,
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
                null
            );

            const logEntry = {
                sessionNumber: 1,
                sessionType: 'rc_1' as const,
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
