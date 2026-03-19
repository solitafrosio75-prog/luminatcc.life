/**
 * psychoeducation.session.ac.ts — Flujo de sesión de psicoeducación (fase 3 AC)
 *
 * Explicación del modelo AC, evaluación de comprensión, contenido desde KB.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';
import { analyzeSessionPatterns } from '../patient/patternProcessor';
import { usePatientStore } from '@/features/patient/patientStore';

// ============================================================================
// Tipos
// ============================================================================

export interface PsychoeducationSessionInput {
    modelExplained: boolean;        // Se explicó el modelo ABC
    connectionMade: boolean;        // Paciente conectó su situación con el modelo
    patientReaction: string;        // Reacción del paciente
    /** Datos ABC del assessment previo (si disponibles) */
    abcData?: {
        antecedent: string;
        behavior: string;
        consequence: string;
    };
}

export type ComprehensionLevel = 'strong' | 'partial' | 'weak';

export interface PsychoeducationSessionResult {
    modelContent: {
        definicion: string;
        mecanismoCambio: string;
        cicloDepresivo: string;
    };
    comprehensionLevel: ComprehensionLevel;
    connectionAssessment: string;
    nextStepRecommendation: string;
    salida: SessionOutput;
}

// ============================================================================
// Tipo KB (forma del JSON area_01_conocimiento)
// ============================================================================

interface ConocimientoKB {
    fundamentos_teoricos?: {
        definicion?: string;
        mecanismo_de_cambio?: string;
        modelo_explicativo?: string;
    };
}

// ============================================================================
// Helpers
// ============================================================================

function assessComprehension(input: PsychoeducationSessionInput): ComprehensionLevel {
    if (input.modelExplained && input.connectionMade) {
        return 'strong';
    }
    if (input.modelExplained || input.connectionMade) {
        return 'partial';
    }
    return 'weak';
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de psicoeducación AC (fase 3).
 *
 * Pasos:
 *   1. Cargar contenido del modelo AC desde KB
 *   2. Evaluar nivel de comprensión del paciente
 *   3. Generar evaluación de conexión con el modelo
 *   4. Recomendar siguiente paso según comprensión
 *   5. Validación ética via orchestrateSession()
 */
export async function runPsychoeducationSessionAC(
    context: SessionContext,
    input: PsychoeducationSessionInput,
): Promise<PsychoeducationSessionResult> {
    // 1. Cargar contenido del modelo AC desde KB
    let modelContent = {
        definicion: 'La Activación Conductual es un tratamiento estructurado para la depresión.',
        mecanismoCambio: 'El cambio conductual produce cambio emocional.',
        cicloDepresivo: 'Evento adverso → reducción de actividad → menor reforzamiento → peor ánimo → más retirada.',
    };

    try {
        const conocimiento = await loadKBData<ConocimientoKB>('ac', KBArea.CONOCIMIENTO);
        if (conocimiento.fundamentos_teoricos) {
            modelContent = {
                definicion: conocimiento.fundamentos_teoricos.definicion ?? modelContent.definicion,
                mecanismoCambio: conocimiento.fundamentos_teoricos.mecanismo_de_cambio ?? modelContent.mecanismoCambio,
                cicloDepresivo: conocimiento.fundamentos_teoricos.modelo_explicativo ?? modelContent.cicloDepresivo,
            };
        }
    } catch {
        // Fallback con contenido por defecto
    }

    // 2. Evaluar nivel de comprensión
    const comprehensionLevel = assessComprehension(input);

    // 3. Evaluación de conexión con el modelo
    let connectionAssessment: string;
    if (input.connectionMade && input.abcData) {
        connectionAssessment = `El paciente conectó su situación (${input.abcData.antecedent}) con el modelo AC. Comprensión sólida.`;
    } else if (input.connectionMade) {
        connectionAssessment = 'El paciente estableció conexión con el modelo AC a nivel general.';
    } else {
        connectionAssessment = `El paciente aún no conecta su experiencia con el modelo. Reacción: "${input.patientReaction}".`;
    }

    // 4. Recomendar siguiente paso según comprensión
    let nextStepRecommendation: string;
    switch (comprehensionLevel) {
        case 'strong':
            nextStepRecommendation = 'Avanzar a identificación de valores y programación de actividades.';
            break;
        case 'partial':
            nextStepRecommendation = 'Reforzar psicoeducación con ejemplos concretos del paciente antes de avanzar.';
            break;
        case 'weak':
            nextStepRecommendation = 'Repetir psicoeducación con analogías más simples. Considerar material visual de apoyo.';
            break;
    }

    // 5. Validación ética via orchestrateSession()
    const salida = await orchestrateSession(context);

    // 6. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 2,
                type: 'ac_2' as const,
                transcript: `Psicoeducación: ${modelContent.definicion}\nConexión: ${connectionAssessment}\nNivel de comprensión: ${comprehensionLevel}`,
                inventoriesAdministered: [],
                rapportScore: context.rapportScore,
                emotionalTone: context.estadoEmocional
            };

            const analysis = await analyzeSessionPatterns(
                sessionData,
                folder.interviewReport,
                null
            );

            const logEntry = {
                sessionNumber: 2,
                sessionType: 'ac_2' as const,
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
        modelContent,
        comprehensionLevel,
        connectionAssessment,
        nextStepRecommendation,
        salida,
    };
}
