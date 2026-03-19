/**
 * sessionFlowDispatcher — Dispatcher multi-técnica para flujos de sesión
 *
 * Resuelve qué flujo ejecutar (AC o RC) según el perfil clínico del paciente.
 * Cada fase tiene un adapter que transforma los datos comunes del UI a los
 * shapes específicos de cada técnica.
 *
 * Decisión de diseño: Los screens solo conocen los datos del UI (intensidad 0-10,
 * patrones cognitivos como strings). El dispatcher encapsula:
 *   1. Resolución de técnica (clinicalProfile → 'ac' | 'rc')
 *   2. Transformación de escalas (SUDs 0-10 → Conviction 0-100 para RC)
 *   3. Renombrado de campos (traps → distortions, abc → cognitive, etc.)
 *
 * Proxy SUDs→Conviction (intensity * 10): Imperfecto pero clínicamente aceptable
 * para el lab. La intensidad emocional correlaciona con la convicción en el
 * pensamiento automático (Beck, 1979).
 */

import type { SessionContext } from '../../../knowledge/session/session.orchestrator';
import type { BDIProfileAnalysis } from '../../../knowledge/inventories/engines/bdi_ii.engine';
import type { TechniqueId } from '../../../knowledge/types/technique.types';

// ── Flujos AC ─────────────────────────────────────────────────────────────────
import {
    runAssessmentSessionAC,
    type AssessmentSessionInput,
    type AssessmentSessionResult,
} from '../../../knowledge/session/assessment.session.ac';
import {
    runPsychoeducationSessionAC,
    type PsychoeducationSessionInput,
    type PsychoeducationSessionResult,
} from '../../../knowledge/session/psychoeducation.session.ac';
import {
    runGoalsSessionAC,
    type GoalsSessionInput,
    type GoalsSessionResult,
} from '../../../knowledge/session/goals.session.ac';
import {
    runEvaluationSessionAC,
    type EvaluationSessionInput,
    type EvaluationSessionResult,
} from '../../../knowledge/session/evaluation.session.ac';
import {
    runFollowUpSessionAC,
    type FollowUpSessionInput,
    type FollowUpSessionResult,
} from '../../../knowledge/session/followup.session.ac';

// ── Flujos RC ─────────────────────────────────────────────────────────────────
import {
    runAssessmentSessionRC,
    type CognitiveAssessmentInput,
    type CognitiveAssessmentResult,
} from '../../../knowledge/session/assessment.session.rc';
import {
    runPsychoeducationSessionRC,
    type PsychoeducationRCInput,
    type PsychoeducationRCResult,
} from '../../../knowledge/session/psychoeducation.session.rc';
import {
    runGoalsSessionRC,
    type GoalsSessionRCInput,
    type GoalsSessionRCResult,
} from '../../../knowledge/session/goals.session.rc';
import {
    runEvaluationSessionRC,
    type EvaluationRCInput,
    type EvaluationRCResult,
} from '../../../knowledge/session/evaluation.session.rc';
import {
    runFollowUpSessionRC,
    type FollowUpRCInput,
    type FollowUpRCResult,
} from '../../../knowledge/session/followup.session.rc';

// ============================================================================
// Helper: Resolución de técnica activa
// ============================================================================

/**
 * Determina la técnica activa desde el perfil clínico.
 * Default: 'ac' (Activación Conductual) — backward-compatible.
 */
export function getActiveTechnique(
    clinicalProfile: BDIProfileAnalysis | null,
): TechniqueId {
    return clinicalProfile?.primaryTechnique === 'rc' ? 'rc' : 'ac';
}

// ============================================================================
// Tipos comunes del UI (lo que las screens recopilan)
// ============================================================================

/** Datos comunes de assessment — capturados por AssessmentScreen */
export interface CommonAssessmentInput {
    situationContext: string;
    automaticThought: string;
    behavioralResponse: string;
    consequences: string;
    cognitivePatterns: string[];
    avoidanceBehaviors: string[];
    functionalImpact: string;
    baselineIntensity: number;  // 0-10 SUDs
    emotionCategory?: string;   // Para RC: mapear a emotionalResponse
}

/** Datos comunes de psicoeducación — capturados por PsychoeducationScreen */
export interface CommonPsychoeducationInput {
    modelExplained: boolean;
    connectionMade: boolean;
    patientReaction: string;
    abcData?: {
        antecedent: string;
        behavior: string;
        consequence: string;
    };
}

/** Datos comunes de objetivos — capturados por GoalsScreen */
export interface CommonGoalsInput {
    primaryObjective: string;
    shortTermGoals: string[];
    measurableIndicator: string;
    startIntensity: number;     // 0-10 SUDs
    targetIntensity: number;    // 0-10 SUDs
}

/** Datos comunes de evaluación — capturados por EvaluationScreen */
export interface CommonEvaluationInput {
    baselineIntensity: number;  // 0-10 SUDs
    currentIntensity: number;   // 0-10 SUDs
    whatChanged: string;
    obstaclesFound: string;
    wantsToRepeat: boolean | null;
    selectedTechnique: string;
}

/** Datos comunes de seguimiento — capturados por FollowUpScreen */
export interface CommonFollowUpInput {
    sessionSummary: {
        mainComplaint: string;
        baselineIntensity: number;  // 0-10 SUDs
        currentIntensity: number;   // 0-10 SUDs
        selectedTechnique: string;
        primaryObjective: string;
        trapsIdentified: number;
        comprehensionLevel: string;
    };
}

// ============================================================================
// Tipos de resultado (union AC | RC)
// ============================================================================

export type AssessmentFlowResult = AssessmentSessionResult | CognitiveAssessmentResult;
export type PsychoeducationFlowResult = PsychoeducationSessionResult | PsychoeducationRCResult;
export type GoalsFlowResult = GoalsSessionResult | GoalsSessionRCResult;
export type EvaluationFlowResult = EvaluationSessionResult | EvaluationRCResult;
export type FollowUpFlowResult = FollowUpSessionResult | FollowUpRCResult;

// Re-export result types para que las screens puedan importar desde aquí
export type {
    AssessmentSessionResult,
    CognitiveAssessmentResult,
    PsychoeducationSessionResult,
    PsychoeducationRCResult,
    GoalsSessionResult,
    GoalsSessionRCResult,
    EvaluationSessionResult,
    EvaluationRCResult,
    FollowUpSessionResult,
    FollowUpRCResult,
};

// ============================================================================
// Dispatcher: Assessment (Fase 2)
// ============================================================================

/**
 * Dispatcher para flujo de evaluación/assessment.
 *
 * AC: Análisis funcional ABC (antecedente → conducta → consecuencia)
 * RC: Conceptualización cognitiva (situación → PA → emoción → distorsión → convicción)
 *
 * Adapter RC: intensity*10 → emotionIntensity/beliefConviction (0-100)
 */
export async function dispatchAssessmentFlow(
    context: SessionContext,
    input: CommonAssessmentInput,
    clinicalProfile: BDIProfileAnalysis | null,
): Promise<AssessmentFlowResult> {
    const technique = getActiveTechnique(clinicalProfile);

    if (technique === 'rc') {
        const rcInput: CognitiveAssessmentInput = {
            situationContext: input.situationContext,
            automaticThought: input.automaticThought,
            emotionalResponse: input.emotionCategory ?? 'malestar',
            emotionIntensity: input.baselineIntensity * 10,
            cognitiveDistortions: input.cognitivePatterns,
            beliefConviction: input.baselineIntensity * 10,
            behavioralConsequence: input.behavioralResponse,
        };
        return runAssessmentSessionRC(context, rcInput);
    }

    // AC: los datos del UI coinciden exactamente con AssessmentSessionInput
    const acInput: AssessmentSessionInput = {
        situationContext: input.situationContext,
        automaticThought: input.automaticThought,
        behavioralResponse: input.behavioralResponse,
        consequences: input.consequences,
        cognitivePatterns: input.cognitivePatterns,
        avoidanceBehaviors: input.avoidanceBehaviors,
        functionalImpact: input.functionalImpact,
        baselineIntensity: input.baselineIntensity,
    };
    return runAssessmentSessionAC(context, acInput);
}

// ============================================================================
// Dispatcher: Psychoeducation (Fase 3)
// ============================================================================

/**
 * Dispatcher para flujo de psicoeducación.
 *
 * AC: Modelo ABC (antecedente → conducta → consecuencia)
 * RC: Modelo cognitivo de Beck (PA → supuestos → creencias nucleares)
 *
 * Adapter RC: abcData → cognitiveData (renombrado de campos)
 */
export async function dispatchPsychoeducationFlow(
    context: SessionContext,
    input: CommonPsychoeducationInput,
    clinicalProfile: BDIProfileAnalysis | null,
): Promise<PsychoeducationFlowResult> {
    const technique = getActiveTechnique(clinicalProfile);

    if (technique === 'rc') {
        const rcInput: PsychoeducationRCInput = {
            modelExplained: input.modelExplained,
            connectionMade: input.connectionMade,
            patientReaction: input.patientReaction,
            cognitiveData: input.abcData
                ? {
                    automaticThought: input.abcData.antecedent,
                    emotion: input.abcData.consequence,
                    distortion: input.abcData.behavior,
                }
                : undefined,
        };
        return runPsychoeducationSessionRC(context, rcInput);
    }

    // AC: los datos del UI coinciden exactamente con PsychoeducationSessionInput
    const acInput: PsychoeducationSessionInput = {
        modelExplained: input.modelExplained,
        connectionMade: input.connectionMade,
        patientReaction: input.patientReaction,
        abcData: input.abcData,
    };
    return runPsychoeducationSessionAC(context, acInput);
}

// ============================================================================
// Dispatcher: Goals (Fase 4)
// ============================================================================

/**
 * Dispatcher para flujo de objetivos.
 *
 * AC: Objetivos con baseline de intensidad SUDs (0-10)
 * RC: Objetivos con baseline de convicción (0-100) + distorsiones objetivo
 *
 * Adapter RC: intensity*10 → conviction, cognitivePatterns → targetedDistortions
 */
export async function dispatchGoalsFlow(
    context: SessionContext,
    input: CommonGoalsInput,
    clinicalProfile: BDIProfileAnalysis | null,
    cognitivePatterns?: string[],
): Promise<GoalsFlowResult> {
    const technique = getActiveTechnique(clinicalProfile);

    if (technique === 'rc') {
        const rcInput: GoalsSessionRCInput = {
            primaryObjective: input.primaryObjective,
            shortTermGoals: input.shortTermGoals,
            measurableIndicator: input.measurableIndicator,
            startConviction: input.startIntensity * 10,
            targetConviction: input.targetIntensity * 10,
            targetedDistortions: cognitivePatterns ?? [],
        };
        return runGoalsSessionRC(context, rcInput);
    }

    // AC: los datos del UI coinciden exactamente con GoalsSessionInput
    const acInput: GoalsSessionInput = {
        primaryObjective: input.primaryObjective,
        shortTermGoals: input.shortTermGoals,
        measurableIndicator: input.measurableIndicator,
        startIntensity: input.startIntensity,
        targetIntensity: input.targetIntensity,
    };
    return runGoalsSessionAC(context, acInput);
}

// ============================================================================
// Dispatcher: Evaluation (Fase 6)
// ============================================================================

/**
 * Dispatcher para flujo de evaluación de progreso.
 *
 * AC: Cambio en intensidad SUDs (0-10) + barreras + efectividad técnica
 * RC: Cambio en convicción (0-100) + SUDs + barreras + efectividad técnica
 *
 * Adapter RC: RC es superset de AC — añade campos de convicción
 */
export async function dispatchEvaluationFlow(
    context: SessionContext,
    input: CommonEvaluationInput,
    clinicalProfile: BDIProfileAnalysis | null,
): Promise<EvaluationFlowResult> {
    const technique = getActiveTechnique(clinicalProfile);

    if (technique === 'rc') {
        const rcInput: EvaluationRCInput = {
            baselineConviction: input.baselineIntensity * 10,
            currentConviction: input.currentIntensity * 10,
            baselineIntensity: input.baselineIntensity,
            currentIntensity: input.currentIntensity,
            whatChanged: input.whatChanged,
            obstaclesFound: input.obstaclesFound,
            wantsToRepeat: input.wantsToRepeat,
            selectedTechnique: input.selectedTechnique,
        };
        return runEvaluationSessionRC(context, rcInput);
    }

    // AC: los datos del UI coinciden exactamente con EvaluationSessionInput
    const acInput: EvaluationSessionInput = {
        baselineIntensity: input.baselineIntensity,
        currentIntensity: input.currentIntensity,
        whatChanged: input.whatChanged,
        obstaclesFound: input.obstaclesFound,
        wantsToRepeat: input.wantsToRepeat,
        selectedTechnique: input.selectedTechnique,
    };
    return runEvaluationSessionAC(context, acInput);
}

// ============================================================================
// Dispatcher: FollowUp (Fase 7)
// ============================================================================

/**
 * Dispatcher para flujo de seguimiento/cierre.
 *
 * AC: Resumen con traps identificados
 * RC: Resumen con conviction baseline/current + distorsiones identificadas
 *
 * Adapter RC: traps→distortions, añade campos conviction
 */
export async function dispatchFollowUpFlow(
    context: SessionContext,
    input: CommonFollowUpInput,
    clinicalProfile: BDIProfileAnalysis | null,
    cognitivePatterns?: string[],
): Promise<FollowUpFlowResult> {
    const technique = getActiveTechnique(clinicalProfile);

    if (technique === 'rc') {
        const rcInput: FollowUpRCInput = {
            sessionSummary: {
                mainComplaint: input.sessionSummary.mainComplaint,
                baselineConviction: input.sessionSummary.baselineIntensity * 10,
                currentConviction: input.sessionSummary.currentIntensity * 10,
                baselineIntensity: input.sessionSummary.baselineIntensity,
                currentIntensity: input.sessionSummary.currentIntensity,
                selectedTechnique: input.sessionSummary.selectedTechnique,
                primaryObjective: input.sessionSummary.primaryObjective,
                distortionsIdentified: cognitivePatterns?.length
                    ?? input.sessionSummary.trapsIdentified,
                comprehensionLevel: input.sessionSummary.comprehensionLevel,
            },
        };
        return runFollowUpSessionRC(context, rcInput);
    }

    // AC: los datos del UI coinciden exactamente con FollowUpSessionInput
    const acInput: FollowUpSessionInput = {
        sessionSummary: input.sessionSummary,
    };
    return runFollowUpSessionAC(context, acInput);
}
