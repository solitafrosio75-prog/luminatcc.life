/**
 * intermediate.session.ac.ts — Flujo de sesión intermedia (sesión 5 AC)
 *
 * Revisión de tareas, re-administración BDI-II, análisis TRAPs/TRACs,
 * ajuste de actividades, manejo de barreras con datos del KB.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { KBArea } from '../types/technique.types';
import { ChangeAnalysis } from '../patient/change.analysis';
import { analyzeSessionPatterns } from '../patient/patternProcessor';
import { usePatientStore } from '@/features/patient/patientStore';

// ============================================================================
// Tipos
// ============================================================================

export interface IntermediateSessionResult {
    revisionTareas: string;
    bdiComparacion: {
        baseline: number;
        followup: number;
        tendencia: string;
        cambioClinico: string;
        interpretacion: string;
    };
    traps: string[];
    tracs: string[];
    ajusteActividades: string;
    barreras: string[];
    barrerasKBMatch: Array<{ nombre: string; estrategia_manejo: string }>;
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
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de sesión intermedia AC (sesión 5).
 *
 * Pasos:
 *   1. Revisión de tareas
 *   2. Re-administración BDI-II y comparación Jacobson-Truax
 *   3. Análisis de TRAPs identificados → conversión a TRACs
 *   4. Ajuste de programación de actividades
 *   5. Manejo de barreras (con datos del KB)
 *   6. Validación ética via orchestrateSession()
 */
export async function runIntermediateSessionAC(
    context: SessionContext,
    changeAnalyses: ChangeAnalysis[],
    traps: string[],
    barreras: string[],
): Promise<IntermediateSessionResult> {
    // 1. Revisión de tareas
    const revisionTareas = 'Se revisan registros ABC y actividades P/D. Se detectan tareas cumplidas y pendientes.';

    // 2. Re-administración BDI-II y comparación
    const lastChange = changeAnalyses.slice(-1)[0];
    const interpretacion = lastChange
        ? `Tendencia: ${lastChange.tendencia}. Cambio clínico: ${lastChange.cambioClinico}.`
        : 'Sin datos.';

    // 3. Análisis de TRAPs → TRACs
    const tracs = traps.map(t => `TRAC derivado de ${t}`);

    // 4. Ajuste de programación de actividades
    const ajusteActividades =
        lastChange && lastChange.tendencia === 'empeora'
            ? 'Se refuerza programación de actividades gratificantes.'
            : 'Se mantiene programación actual, se revisan barreras.';

    // 5. Manejo de barreras — enriquecer con datos del KB
    let barrerasKBMatch: Array<{ nombre: string; estrategia_manejo: string }> = [];
    try {
        const barrerasKB = await loadKBData<BarrerasKB>('ac', KBArea.BARRERAS);
        // Matchear barreras reportadas contra catálogo KB
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
    const salida = await orchestrateSession(context);

    // 7. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 6,
                type: 'ac_6' as const,
                transcript: `Sesión intermedia: revisión de tareas, BDI cambio=${interpretacion}, TRAPs/TRACs identificados, ajuste de actividades`,
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
                sessionNumber: 6,
                sessionType: 'ac_6' as const,
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
        revisionTareas,
        bdiComparacion: {
            baseline: lastChange?.baseline ?? 0,
            followup: lastChange?.followup ?? 0,
            tendencia: lastChange?.tendencia ?? 'sin datos',
            cambioClinico: lastChange?.cambioClinico ?? 'sin datos',
            interpretacion,
        },
        traps,
        tracs,
        ajusteActividades,
        barreras,
        barrerasKBMatch,
        salida,
    };
}
