// Análisis de cambio clínico para BDI-II
// Basado en Jacobson-Truax y criterios de tendencia

export interface ChangeAnalysis {
    inventario: 'BDI-II';
    baseline: number;
    followup: number;
    diferencia: number;
    tendencia: 'mejora' | 'estable' | 'empeora';
    cambioClinico: 'significativo' | 'no-significativo';
    criterioJacobsonTruax: boolean;
}

/**
 * Criterio Jacobson-Truax para BDI-II
 * - Cambio clínicamente significativo: diferencia >= 9 puntos
 * - Baseline >= 14 (depresión moderada)
 * - Followup <= 13 (depresión leve)
 */
export function analyzeChangeBDI(baseline: number, followup: number): ChangeAnalysis {
    const diferencia = followup - baseline;
    let tendencia: 'mejora' | 'estable' | 'empeora';
    if (diferencia < -2) tendencia = 'mejora';
    else if (diferencia > 2) tendencia = 'empeora';
    else tendencia = 'estable';

    // Jacobson-Truax: cambio >= 9 puntos y cruce de umbral
    const cambioClinico = Math.abs(diferencia) >= 9 ? 'significativo' : 'no-significativo';
    const criterioJacobsonTruax =
        baseline >= 14 && followup <= 13 && Math.abs(diferencia) >= 9;

    return {
        inventario: 'BDI-II',
        baseline,
        followup,
        diferencia,
        tendencia,
        cambioClinico,
        criterioJacobsonTruax,
    };
}

/**
 * Genera análisis de cambio entre administraciones de BDI-II
 * Recibe serie temporal, devuelve array de ChangeAnalysis
 */
export function generateChangeAnalysesBDI(timeline: Array<{ fecha: string; puntuacion: number }>): ChangeAnalysis[] {
    const analyses: ChangeAnalysis[] = [];
    for (let i = 1; i < timeline.length; i++) {
        const baseline = timeline[i - 1].puntuacion;
        const followup = timeline[i].puntuacion;
        analyses.push(analyzeChangeBDI(baseline, followup));
    }
    return analyses;
}
