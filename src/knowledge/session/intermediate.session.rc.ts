/**
 * intermediate.session.rc.ts — Flujo de sesión intermedia (sesión 5 RC)
 *
 * Revisión de registros de pensamiento, re-administración BDI-II,
 * análisis de distorsiones recurrentes, ajuste de técnica cognitiva,
 * manejo de barreras con datos del KB.
 *
 * A diferencia de AC (TRAPs/TRACs), RC revisa pensamientos automáticos
 * y distorsiones recurrentes para identificar supuestos intermedios.
 *
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';
import { ChangeAnalysis } from '../patient/change.analysis';

// ============================================================================
// Tipos
// ============================================================================

export interface IntermediateSessionRCResult {
    revisionTareas: string;
    bdiComparacion: {
        baseline: number;
        followup: number;
        tendencia: string;
        cambioClinico: string;
        interpretacion: string;
    };
    pensamientosRevisados: string[];
    distorsionesRecurrentes: string[];
    ajusteTecnica: string;
    barreras: string[];
    barrerasKBMatch: Array<{ nombre: string; estrategia_manejo: string }>;
    salida: SessionOutput;
}

// ============================================================================
// Tipo KB
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
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de sesión intermedia RC (sesión 5).
 *
 * Pasos:
 *   1. Revisión de registros de pensamiento
 *   2. Re-administración BDI-II y comparación Jacobson-Truax
 *   3. Análisis de distorsiones recurrentes
 *   4. Ajuste de técnica cognitiva según evolución
 *   5. Manejo de barreras (con datos del KB)
 *   6. Validación ética via orchestrateSession()
 */
export async function runIntermediateSessionRC(
    context: SessionContext,
    changeAnalyses: ChangeAnalysis[],
    pensamientos: string[],
    distorsionesRecurrentes: string[],
    barreras: string[],
): Promise<IntermediateSessionRCResult> {
    // 1. Revisión de registros de pensamiento
    const revisionTareas = `Se revisan ${pensamientos.length} registros de pensamientos automáticos. Se analizan patrones de distorsión y nivel de convicción.`;

    // 2. Re-administración BDI-II y comparación
    const lastChange = changeAnalyses.slice(-1)[0];
    const interpretacion = lastChange
        ? `Tendencia: ${lastChange.tendencia}. Cambio clínico: ${lastChange.cambioClinico}.`
        : 'Sin datos.';

    // 3. Análisis de distorsiones recurrentes
    // Las distorsiones recurrentes indican supuestos intermedios subyacentes
    const pensamientosRevisados = pensamientos.map(p =>
        `PA revisado: "${p}" — evaluado mediante diálogo socrático.`
    );

    // 4. Ajuste de técnica según evolución
    let ajusteTecnica: string;
    if (lastChange && lastChange.tendencia === 'empeora') {
        ajusteTecnica = 'Empeoramiento detectado. Retroceder a psicoeducación si es necesario. Considerar si se activó esquema nuclear. Evaluar derivación a AC como complemento.';
    } else if (distorsionesRecurrentes.length >= 3) {
        ajusteTecnica = 'Múltiples distorsiones recurrentes. Escalar de registro de 3 columnas a 7 columnas. Introducir experimentos conductuales para creencias resistentes.';
    } else if (lastChange && lastChange.tendencia === 'mejora') {
        ajusteTecnica = 'Evolución positiva. Mantener diálogo socrático. Considerar avanzar a trabajo con supuestos intermedios (reglas "Si...entonces").';
    } else {
        ajusteTecnica = 'Mantener registro de pensamientos y diálogo socrático. Revisar barreras al cambio cognitivo.';
    }

    // 5. Manejo de barreras — enriquecer con datos del KB RC
    let barrerasKBMatch: Array<{ nombre: string; estrategia_manejo: string }> = [];
    try {
        const barrerasKB = await loadKBData<BarrerasKB>('rc', KBArea.BARRERAS);
        barrerasKBMatch = barrerasKB.barreras
            .filter(bkb =>
                barreras.some(b =>
                    bkb.nombre.toLowerCase().includes(b.toLowerCase()) ||
                    b.toLowerCase().includes(bkb.nombre.toLowerCase().split(' ')[0])
                )
            )
            .map(bkb => ({ nombre: bkb.nombre, estrategia_manejo: bkb.estrategia_manejo }));
    } catch {
        // Fallback si KB no disponible
    }

    // 6. Orquestador real — validación ética + decisión clínica
    const salida = await orchestrateSession({ ...context, techniqueId: 'rc' });

    return {
        revisionTareas,
        bdiComparacion: {
            baseline: lastChange?.baseline ?? 0,
            followup: lastChange?.followup ?? 0,
            tendencia: lastChange?.tendencia ?? 'sin datos',
            cambioClinico: lastChange?.cambioClinico ?? 'sin datos',
            interpretacion,
        },
        pensamientosRevisados,
        distorsionesRecurrentes,
        ajusteTecnica,
        barreras,
        barrerasKBMatch,
        salida,
    };
}
