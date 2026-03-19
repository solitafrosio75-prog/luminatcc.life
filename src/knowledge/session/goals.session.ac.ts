/**
 * goals.session.ac.ts — Flujo de sesión de objetivos (fase 4 AC)
 *
 * Validación SMART, alineación con valores, carga de objetivos terapéuticos y
 * áreas vitales desde KB. Usa el orquestador para validación ética.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';
import { analyzeSessionPatterns } from '../patient/patternProcessor';
import { usePatientStore } from '@/features/patient/patientStore';

// ============================================================================
// Tipos
// ============================================================================

export interface GoalsSessionInput {
    primaryObjective: string;       // Objetivo principal
    shortTermGoals: string[];       // Objetivos intermedios (2-4 semanas)
    measurableIndicator: string;    // "¿Cómo sabremos que mejoraste?"
    startIntensity: number;         // Baseline registrado (0-10)
    targetIntensity: number;        // Meta de reducción (0-10)
}

export interface SMARTValidation {
    specific: boolean;
    measurable: boolean;
    achievable: boolean;
    relevant: boolean;
    timeBound: boolean;
    score: number;                  // 0-5 (cuenta de criterios cumplidos)
    feedback: string;
}

export interface GoalsSessionResult {
    smartValidation: SMARTValidation;
    alignedValues: string[];
    intensityReduction: {
        from: number;
        to: number;
        percentReduction: number;
    };
    therapeuticObjectives: string[];
    salida: SessionOutput;
}

// ============================================================================
// Tipos KB
// ============================================================================

interface ValoresKB {
    objetivos_terapeuticos: Array<{ objetivo: string; descripcion: string }>;
    valores_nucleares: Array<{ valor: string; definicion: string }>;
}

interface AreasVitalesKB {
    areas_vitales: Array<{ nombre: string; descripcion: string }>;
}

// ============================================================================
// Helpers
// ============================================================================

function validateSMART(input: GoalsSessionInput): SMARTValidation {
    // Specific: tiene objetivo y al menos un short-term goal
    const specific = input.primaryObjective.length > 10 && input.shortTermGoals.length > 0;

    // Measurable: tiene indicador medible y rango de intensidad
    const measurable = input.measurableIndicator.length > 5 &&
        input.startIntensity > 0 && input.targetIntensity >= 0;

    // Achievable: la reducción de intensidad es realista (no más del 70%)
    const reductionRatio = input.startIntensity > 0
        ? (input.startIntensity - input.targetIntensity) / input.startIntensity
        : 0;
    const achievable = reductionRatio <= 0.7 && reductionRatio > 0;

    // Relevant: el objetivo tiene contenido sustancial
    const relevant = input.primaryObjective.length > 5;

    // Time-bound: tiene short-term goals (implica temporalidad)
    const timeBound = input.shortTermGoals.length >= 1;

    const criteria = [specific, measurable, achievable, relevant, timeBound];
    const score = criteria.filter(Boolean).length;

    let feedback: string;
    if (!achievable && input.startIntensity > 0) {
        feedback = 'Objetivos parcialmente formulados. Revisar criterios no cumplidos: la reducción de intensidad propuesta supera el 70% y puede no ser realista.';
    } else if (score >= 4) {
        feedback = 'Objetivos bien formulados. Cumplen criterios SMART.';
    } else if (score >= 2) {
        feedback = 'Objetivos parcialmente formulados. Revisar criterios no cumplidos.';
    } else {
        feedback = 'Objetivos requieren reformulación significativa para ser medibles y alcanzables.';
    }

    return { specific, measurable, achievable, relevant, timeBound, score, feedback };
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de establecimiento de objetivos AC (fase 4).
 *
 * Pasos:
 *   1. Validar criterios SMART
 *   2. Calcular reducción de intensidad
 *   3. Cargar valores y áreas vitales desde KB para alineación
 *   4. Identificar objetivos terapéuticos relevantes
 *   5. Validación ética via orchestrateSession()
 */
export async function runGoalsSessionAC(
    context: SessionContext,
    input: GoalsSessionInput,
): Promise<GoalsSessionResult> {
    // 1. Validar criterios SMART
    const smartValidation = validateSMART(input);

    // 2. Calcular reducción de intensidad
    const percentReduction = input.startIntensity > 0
        ? Math.round(((input.startIntensity - input.targetIntensity) / input.startIntensity) * 100)
        : 0;

    const intensityReduction = {
        from: input.startIntensity,
        to: input.targetIntensity,
        percentReduction,
    };

    // 3. Cargar valores y áreas vitales desde KB
    let alignedValues: string[] = [];
    let therapeuticObjectives: string[] = [];

    try {
        const valoresKB = await loadKBData<ValoresKB>('ac', KBArea.AC_VALORES_REFORZADORES);
        therapeuticObjectives = valoresKB.objetivos_terapeuticos.map(o => o.objetivo);

        // Matchear objetivo del paciente con valores nucleares
        const objectiveLower = input.primaryObjective.toLowerCase();
        alignedValues = valoresKB.valores_nucleares
            .filter(v =>
                objectiveLower.includes(v.valor.toLowerCase().split(' ')[0]) ||
                v.definicion.toLowerCase().includes(objectiveLower.split(' ')[0])
            )
            .map(v => v.valor);
    } catch {
        // Fallback
    }

    // Si no matcheó ningún valor, intentar con áreas vitales
    if (alignedValues.length === 0) {
        try {
            const areasKB = await loadKBData<AreasVitalesKB>('ac', KBArea.AC_AREAS_VITALES);
            const objectiveLower = input.primaryObjective.toLowerCase();
            alignedValues = areasKB.areas_vitales
                .filter(a => objectiveLower.includes(a.nombre.toLowerCase().split(' ')[0]))
                .map(a => a.nombre);
        } catch {
            // Fallback
        }
    }

    // 4. Validación ética via orchestrateSession()
    const salida = await orchestrateSession(context);

    // 5. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 4,
                type: 'ac_4' as const,
                transcript: `Objetivo primario: ${input.primaryObjective}. Valores alineados: ${alignedValues.join(', ')}. Reducción de intensidad: ${intensityReduction.percentReduction}%.`,
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
                sessionNumber: 4,
                sessionType: 'ac_4' as const,
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
        smartValidation,
        alignedValues,
        intensityReduction,
        therapeuticObjectives,
        salida,
    };
}
