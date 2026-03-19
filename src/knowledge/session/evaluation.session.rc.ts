/**
 * evaluation.session.rc.ts — Flujo de sesión de evaluación de progreso (fase 6 RC)
 *
 * Calcula significancia del cambio (convicción en PA), matchea obstáculos contra
 * barreras KB RC, evalúa efectividad de la técnica cognitiva seleccionada.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';

// ============================================================================
// Tipos
// ============================================================================

export interface EvaluationRCInput {
    baselineConviction: number;     // 0-100 (convicción en PA al inicio)
    currentConviction: number;      // 0-100 (convicción actual)
    baselineIntensity: number;      // 0-10 SUDs
    currentIntensity: number;       // 0-10 SUDs
    whatChanged: string;            // "¿Qué cambió?"
    obstaclesFound: string;         // Obstáculos encontrados
    wantsToRepeat: boolean | null;  // ¿Quiere repetir técnica?
    selectedTechnique: string;      // Técnica utilizada (ej: diálogo socrático)
}

export type ConvictionChangeSignificance = 'significant' | 'moderate' | 'minimal' | 'no-change' | 'worsened';

export interface ConvictionChangeResult {
    baselineConviction: number;
    currentConviction: number;
    difference: number;
    significance: ConvictionChangeSignificance;
    interpretation: string;
}

export interface EvaluationRCResult {
    convictionChange: ConvictionChangeResult;
    sudsChange: { baseline: number; current: number; difference: number };
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
 * Evalúa la significancia del cambio en convicción de PA (0-100).
 *
 * Criterios clínicos (RC):
 *   ≥ 30 puntos de reducción = significativo
 *   ≥ 20 puntos = moderado
 *   ≥ 10 puntos = mínimo
 *   0-9 puntos  = sin cambio
 *   < 0          = empeoramiento (convicción aumentó)
 */
function evaluateConvictionChange(
    baseline: number,
    current: number,
): { significance: ConvictionChangeSignificance; interpretation: string } {
    const difference = baseline - current;

    if (difference >= 30) {
        return {
            significance: 'significant',
            interpretation: `Reducción significativa de convicción: ${difference} puntos (${baseline}% → ${current}%). El pensamiento alternativo está consolidándose.`,
        };
    }
    if (difference >= 20) {
        return {
            significance: 'moderate',
            interpretation: `Reducción moderada de convicción: ${difference} puntos (${baseline}% → ${current}%). Tendencia positiva en flexibilidad cognitiva.`,
        };
    }
    if (difference >= 10) {
        return {
            significance: 'minimal',
            interpretation: `Reducción mínima de convicción: ${difference} puntos (${baseline}% → ${current}%). Monitorear evolución.`,
        };
    }
    if (difference >= 0) {
        return {
            significance: 'no-change',
            interpretation: `Sin cambio significativo en convicción (${baseline}% → ${current}%). Considerar ajuste de estrategia cognitiva.`,
        };
    }
    return {
        significance: 'worsened',
        interpretation: `Aumento de convicción en PA: +${Math.abs(difference)} puntos (${baseline}% → ${current}%). Requiere revisión del enfoque.`,
    };
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de evaluación de progreso RC (fase 6).
 *
 * Pasos:
 *   1. Calcular cambio de convicción en PA
 *   2. Calcular cambio SUDs
 *   3. Matchear obstáculos contra barreras del KB RC
 *   4. Evaluar efectividad de la técnica cognitiva
 *   5. Generar recomendación de ajuste
 *   6. Validación ética via orchestrateSession()
 */
export async function runEvaluationSessionRC(
    context: SessionContext,
    input: EvaluationRCInput,
): Promise<EvaluationRCResult> {
    // 1. Calcular cambio de convicción
    const { significance, interpretation } = evaluateConvictionChange(
        input.baselineConviction,
        input.currentConviction,
    );

    const convictionChange: ConvictionChangeResult = {
        baselineConviction: input.baselineConviction,
        currentConviction: input.currentConviction,
        difference: input.baselineConviction - input.currentConviction,
        significance,
        interpretation,
    };

    // 2. Cambio SUDs
    const sudsChange = {
        baseline: input.baselineIntensity,
        current: input.currentIntensity,
        difference: input.baselineIntensity - input.currentIntensity,
    };

    // 3. Matchear obstáculos contra barreras del KB RC
    let barrierMatches: Array<{ nombre: string; estrategia_manejo: string }> = [];
    if (input.obstaclesFound.trim().length > 0) {
        try {
            const barrerasKB = await loadKBData<BarrerasKB>('rc', KBArea.BARRERAS);
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

    // 4. Evaluar efectividad de la técnica cognitiva
    let techniqueEffectiveness: string;
    if (significance === 'significant' || significance === 'moderate') {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" muestra efectividad en reducción de convicción. ${input.wantsToRepeat ? 'El paciente desea continuar.' : 'Evaluar variaciones o técnicas complementarias.'}`;
    } else if (significance === 'no-change') {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" no ha generado cambio en convicción. Considerar diálogo socrático más profundo o experimentos conductuales.`;
    } else if (significance === 'worsened') {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" coincide con aumento de convicción en PA. Revisión urgente: ¿se activó una creencia nuclear protectora?`;
    } else {
        techniqueEffectiveness = `La técnica "${input.selectedTechnique}" muestra cambio mínimo en convicción. Mantener y monitorear con registro de 7 columnas.`;
    }

    // 5. Generar recomendación de ajuste
    let adjustmentRecommendation: string;
    switch (significance) {
        case 'significant':
            adjustmentRecommendation = 'Mantener estrategia actual. Avanzar a trabajo con supuestos intermedios o creencias nucleares.';
            break;
        case 'moderate':
            adjustmentRecommendation = 'Continuar con la técnica. Introducir experimentos conductuales para consolidar el cambio cognitivo.';
            break;
        case 'minimal':
            adjustmentRecommendation = 'Revisar barreras al cambio cognitivo. Considerar descatastrofización o continuo cognitivo.';
            break;
        case 'no-change':
            adjustmentRecommendation = 'Reformular la conceptualización. Explorar si la distorsión objetivo es la correcta. Considerar experimentos conductuales.';
            break;
        case 'worsened':
            adjustmentRecommendation = 'Revisión urgente. Evaluar si se activó esquema nuclear. Considerar retroceder a psicoeducación o cambiar enfoque a AC.';
            break;
    }

    // 6. Validación ética via orchestrateSession()
    const salida = await orchestrateSession({ ...context, techniqueId: 'rc' });

    return {
        convictionChange,
        sudsChange,
        barrierMatches,
        techniqueEffectiveness,
        adjustmentRecommendation,
        salida,
    };
}
