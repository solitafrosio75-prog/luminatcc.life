/**
 * evaluation.session.ac.ts — Flujo de sesión de evaluación de progreso (fase 6 AC)
 *
 * Calcula significancia del cambio (SUDs), matchea obstáculos contra barreras KB,
 * evalúa efectividad de la técnica seleccionada.
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

export interface EvaluationSessionInput {
    baselineIntensity: number;      // 0-10 (del assessment)
    currentIntensity: number;       // 0-10 (actual)
    whatChanged: string;            // "¿Qué cambió?"
    obstaclesFound: string;         // Obstáculos encontrados
    wantsToRepeat: boolean | null;  // ¿Quiere repetir técnica?
    selectedTechnique: string;      // Técnica utilizada
}

export type ChangeSignificance = 'significant' | 'moderate' | 'minimal' | 'no-change' | 'worsened';

export interface ChangeAnalysisResult {
    baselineIntensity: number;
    currentIntensity: number;
    difference: number;
    significance: ChangeSignificance;
    interpretation: string;
}

export interface EvaluationSessionResult {
    changeAnalysis: ChangeAnalysisResult;
    barrierMatches: Array<{ nombre: string; estrategia_manejo: string }>;
    techniqueEffectiveness: string;
    adjustmentRecommendation: string;
    salida: SessionOutput;
}

// ============================================================================
// Tipo KB (forma del JSON area_09_barreras)
// ============================================================================

interface BarrerasKB {
    barreras: Array<{
        nombre: string;
        descripcion: string;
        ejemplo_paciente: string;
        estrategia_manejo: string;
    }>;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Evalúa la significancia del cambio usando escala SUDs (0-10).
 *
 * Criterios clínicos:
 *   ≥3 puntos de reducción = significativo
 *   ≥2 puntos = moderado
 *   ≥1 punto  = mínimo
 *   0 puntos  = sin cambio
 *   <0        = empeoramiento
 */
function evaluateChangeSignificance(baseline: number, current: number): { significance: ChangeSignificance; interpretation: string } {
    const difference = baseline - current;

    if (difference >= 3) {
        return {
            significance: 'significant',
            interpretation: `Reducción significativa de ${difference} puntos (${baseline} → ${current}). El cambio indica progreso clínico relevante.`,
        };
    }
    if (difference >= 2) {
        return {
            significance: 'moderate',
            interpretation: `Reducción moderada de ${difference} puntos (${baseline} → ${current}). Se observa tendencia positiva.`,
        };
    }
    if (difference >= 1) {
        return {
            significance: 'minimal',
            interpretation: `Reducción mínima de ${difference} punto(s) (${baseline} → ${current}). Monitorear evolución.`,
        };
    }
    if (difference === 0) {
        return {
            significance: 'no-change',
            interpretation: `Sin cambio (${baseline} → ${current}). Considerar ajuste de estrategia.`,
        };
    }
    return {
        significance: 'worsened',
        interpretation: `Empeoramiento de ${Math.abs(difference)} puntos (${baseline} → ${current}). Requiere revisión del plan.`,
    };
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de evaluación de progreso AC (fase 6).
 *
 * Pasos:
 *   1. Calcular significancia del cambio (SUDs)
 *   2. Matchear obstáculos contra barreras del KB
 *   3. Evaluar efectividad de la técnica
 *   4. Generar recomendación de ajuste
 *   5. Validación ética via orchestrateSession()
 */
export async function runEvaluationSessionAC(
    context: SessionContext,
    input: EvaluationSessionInput,
): Promise<EvaluationSessionResult> {
    // 1. Calcular significancia del cambio
    const { significance, interpretation } = evaluateChangeSignificance(
        input.baselineIntensity,
        input.currentIntensity,
    );

    const changeAnalysis: ChangeAnalysisResult = {
        baselineIntensity: input.baselineIntensity,
        currentIntensity: input.currentIntensity,
        difference: input.baselineIntensity - input.currentIntensity,
        significance,
        interpretation,
    };

    // 2. Matchear obstáculos contra barreras del KB
    let barrierMatches: Array<{ nombre: string; estrategia_manejo: string }> = [];
    if (input.obstaclesFound.trim().length > 0) {
        try {
            const barrerasKB = await loadKBData<BarrerasKB>('ac', KBArea.BARRERAS);
            const obstaclesLower = input.obstaclesFound.toLowerCase();
            barrierMatches = barrerasKB.barreras
                .filter(b =>
                    obstaclesLower.includes(b.nombre.toLowerCase().split(' ')[0]) ||
                    b.descripcion.toLowerCase().split(' ').some(word =>
                        word.length > 4 && obstaclesLower.includes(word)
                    )
                )
                .map(b => ({ nombre: b.nombre, estrategia_manejo: b.estrategia_manejo }));
        } catch {
            // Fallback si KB no disponible
        }
    }

    // 3. Evaluar efectividad de la técnica
    let techniqueEffectiveness: string;
    if (significance === 'significant' || significance === 'moderate') {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" muestra efectividad positiva. ${input.wantsToRepeat ? 'El paciente desea continuar.' : 'Evaluar variaciones.'}`;
    } else if (significance === 'no-change') {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" no ha generado cambio observable. Considerar ajuste o técnica alternativa.`;
    } else if (significance === 'worsened') {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" coincide con empeoramiento. Revisión urgente del plan terapéutico.`;
    } else {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" muestra cambio mínimo. Mantener y monitorear.`;
    }

    // 4. Generar recomendación de ajuste
    let adjustmentRecommendation: string;
    switch (significance) {
        case 'significant':
            adjustmentRecommendation = 'Mantener estrategia actual. Graduar hacia objetivos más ambiciosos.';
            break;
        case 'moderate':
            adjustmentRecommendation = 'Continuar con la técnica, incrementar frecuencia o intensidad de actividades.';
            break;
        case 'minimal':
            adjustmentRecommendation = 'Revisar barreras. Considerar actividades alternativas o complementarias.';
            break;
        case 'no-change':
            adjustmentRecommendation = 'Reformular plan. Explorar barreras no detectadas. Considerar técnica alternativa.';
            break;
        case 'worsened':
            adjustmentRecommendation = 'Revisión urgente. Evaluar factores de riesgo. Considerar derivación o cambio de enfoque.';
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
                number: 5,
                type: 'ac_5' as const,
                transcript: `Evaluación de progreso: cambio=${changeAnalysis.interpretation}, efectividad=${techniqueEffectiveness.rating}, recomendación=${adjustmentRecommendation}`,
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
                sessionNumber: 5,
                sessionType: 'ac_5' as const,
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
        changeAnalysis,
        barrierMatches,
        techniqueEffectiveness,
        adjustmentRecommendation,
        salida,
    };
}
