/**
 * goals.session.rc.ts — Flujo de sesión de objetivos (fase 4 RC)
 *
 * Validación SMART, alineación con trabajo de creencias nucleares,
 * identificación de distorsiones objetivo. Carga datos de KB RC.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';

// ============================================================================
// Tipos
// ============================================================================

export interface GoalsSessionRCInput {
    primaryObjective: string;       // Objetivo principal
    shortTermGoals: string[];       // Objetivos intermedios (2-4 semanas)
    measurableIndicator: string;    // "¿Cómo sabremos que mejoraste?"
    startConviction: number;        // Baseline convicción PA (0-100)
    targetConviction: number;       // Meta de reducción convicción (0-100)
    targetedDistortions: string[];  // Distorsiones objetivo del tratamiento
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

export interface GoalsSessionRCResult {
    smartValidation: SMARTValidation;
    targetedDistortions: string[];
    convictionReduction: {
        from: number;
        to: number;
        percentReduction: number;
    };
    therapeuticObjectives: string[];
    beliefWorkTargets: string[];
    salida: SessionOutput;
}

// ============================================================================
// Tipos KB
// ============================================================================

interface ObjetivosKB {
    objetivos_terapeuticos: Array<{ objetivo: string; descripcion: string }>;
}

interface CreenciasKB {
    categorias: Array<{
        nombre: string;
        descripcion: string;
        creencias_ejemplo: string[];
        supuestos_intermedios: string[];
        estrategias_modificacion: string[];
    }>;
}

// ============================================================================
// Helpers
// ============================================================================

function validateSMART(input: GoalsSessionRCInput): SMARTValidation {
    const specific = input.primaryObjective.length > 10 && input.shortTermGoals.length > 0;
    const measurable = input.measurableIndicator.length > 5 &&
        input.startConviction > 0 && input.targetConviction >= 0;

    // Achievable: la reducción de convicción es realista (no más del 70%)
    const reductionRatio = input.startConviction > 0
        ? (input.startConviction - input.targetConviction) / input.startConviction
        : 0;
    const achievable = reductionRatio <= 0.7 && reductionRatio > 0;

    const relevant = input.primaryObjective.length > 5;
    const timeBound = input.shortTermGoals.length >= 1;

    const criteria = [specific, measurable, achievable, relevant, timeBound];
    const score = criteria.filter(Boolean).length;

    let feedback: string;
    if (!achievable && input.startConviction > 0) {
        feedback = 'Objetivos parcialmente formulados. La reducción de convicción propuesta supera el 70% y puede no ser realista a corto plazo.';
    } else if (score >= 4) {
        feedback = 'Objetivos bien formulados. Cumplen criterios SMART para trabajo cognitivo.';
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
 * Implementa el flujo de establecimiento de objetivos RC (fase 4).
 *
 * Pasos:
 *   1. Validar criterios SMART
 *   2. Calcular reducción de convicción
 *   3. Cargar objetivos terapéuticos y creencias nucleares desde KB RC
 *   4. Identificar targets de trabajo de creencias
 *   5. Validación ética via orchestrateSession()
 */
export async function runGoalsSessionRC(
    context: SessionContext,
    input: GoalsSessionRCInput,
): Promise<GoalsSessionRCResult> {
    // 1. Validar criterios SMART
    const smartValidation = validateSMART(input);

    // 2. Calcular reducción de convicción
    const percentReduction = input.startConviction > 0
        ? Math.round(((input.startConviction - input.targetConviction) / input.startConviction) * 100)
        : 0;

    const convictionReduction = {
        from: input.startConviction,
        to: input.targetConviction,
        percentReduction,
    };

    // 3. Cargar objetivos terapéuticos y creencias nucleares desde KB RC
    let therapeuticObjectives: string[] = [];
    let beliefWorkTargets: string[] = [];

    try {
        const objetivosKB = await loadKBData<ObjetivosKB>('rc', KBArea.OBJETIVOS_CLINICOS);
        therapeuticObjectives = objetivosKB.objetivos_terapeuticos.map(o => o.objetivo);
    } catch {
        // Fallback
    }

    try {
        const creenciasKB = await loadKBData<CreenciasKB>('rc', KBArea.RC_CREENCIAS_NUCLEARES);
        // Matchear objetivo del paciente con categorías de creencias
        const objectiveLower = input.primaryObjective.toLowerCase();
        beliefWorkTargets = creenciasKB.categorias
            .filter(c =>
                objectiveLower.includes(c.nombre.toLowerCase().split(' ')[0]) ||
                c.creencias_ejemplo.some(ce => objectiveLower.includes(ce.toLowerCase().split(' ')[0]))
            )
            .flatMap(c => c.estrategias_modificacion);
    } catch {
        // Fallback
    }

    // 4. Validación ética via orchestrateSession()
    const salida = await orchestrateSession({ ...context, techniqueId: 'rc' });

    return {
        smartValidation,
        targetedDistortions: input.targetedDistortions,
        convictionReduction,
        therapeuticObjectives,
        beliefWorkTargets,
        salida,
    };
}
