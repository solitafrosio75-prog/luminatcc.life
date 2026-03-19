/**
 * assessment.session.ac.ts — Flujo de sesión de evaluación (fase 2 AC)
 *
 * Análisis funcional ABC, detección de TRAPs, herramientas de evaluación del KB.
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

export interface AssessmentSessionInput {
    situationContext: string;       // Situación A (antecedente)
    automaticThought: string;       // Pensamiento automático
    behavioralResponse: string;     // Conducta B
    consequences: string;           // Consecuencia C
    cognitivePatterns: string[];    // Patrones cognitivos detectados
    avoidanceBehaviors: string[];   // Conductas de evitación
    functionalImpact: string;       // Impacto funcional
    baselineIntensity: number;      // 0-10 nivel de referencia
}

export interface ABCAnalysis {
    antecedent: string;
    behavior: string;
    consequence: string;
    functionalPattern: string;
}

export interface AssessmentSessionResult {
    abcAnalysis: ABCAnalysis;
    trapsIdentified: string[];
    evaluationTools: Array<{ id: string; nombre: string; cuando_usar: string }>;
    clinicalNote: string;
    salida: SessionOutput;
}

// ============================================================================
// Tipo KB (forma del JSON area_03_herramientas_evaluacion)
// ============================================================================

interface HerramientasKB {
    herramientas: Array<{
        id: string;
        nombre: string;
        tipo: string;
        proposito: string;
        cuando_usar: string;
    }>;
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de evaluación funcional AC (fase 2).
 *
 * Pasos:
 *   1. Construir análisis funcional ABC
 *   2. Detectar TRAPs (Trigger → Response → Avoidance Pattern)
 *   3. Cargar herramientas de evaluación desde KB
 *   4. Generar nota clínica
 *   5. Validación ética via orchestrateSession()
 */
export async function runAssessmentSessionAC(
    context: SessionContext,
    input: AssessmentSessionInput,
): Promise<AssessmentSessionResult> {
    // 1. Construir análisis funcional ABC
    const isAvoidance = input.avoidanceBehaviors.length > 0 ||
        input.behavioralResponse.toLowerCase().includes('evit') ||
        input.consequences.toLowerCase().includes('alivi');

    const functionalPattern = isAvoidance
        ? 'Patrón de evitación experiencial: la conducta se mantiene por reforzamiento negativo (alivio temporal).'
        : 'Patrón de afrontamiento activo: la conducta se orienta hacia la resolución.';

    const abcAnalysis: ABCAnalysis = {
        antecedent: input.situationContext,
        behavior: input.behavioralResponse,
        consequence: input.consequences,
        functionalPattern,
    };

    // 2. Detectar TRAPs (Trigger → Response → Avoidance Pattern)
    const trapsIdentified: string[] = [];
    if (isAvoidance) {
        trapsIdentified.push(
            `TRAP: ${input.situationContext} → ${input.behavioralResponse} → evitación/alivio temporal`
        );
    }
    for (const avoidance of input.avoidanceBehaviors) {
        trapsIdentified.push(`TRAP: Evitación detectada — "${avoidance}"`);
    }

    // 3. Cargar herramientas de evaluación desde KB
    let evaluationTools: Array<{ id: string; nombre: string; cuando_usar: string }> = [];
    try {
        const herramientas = await loadKBData<HerramientasKB>('ac', KBArea.HERRAMIENTAS_EVALUACION);
        evaluationTools = herramientas.herramientas
            .filter(h => h.tipo === 'registro' || h.tipo === 'inventario')
            .map(h => ({ id: h.id, nombre: h.nombre, cuando_usar: h.cuando_usar }));
    } catch {
        // Fallback si KB no disponible
    }

    // 4. Generar nota clínica
    const patternsSummary = input.cognitivePatterns.length > 0
        ? `Patrones cognitivos: ${input.cognitivePatterns.join(', ')}.`
        : 'Sin patrones cognitivos identificados.';

    const clinicalNote = [
        `Evaluación funcional completada. Intensidad baseline: ${input.baselineIntensity}/10.`,
        `Análisis ABC: A(${input.situationContext}) → B(${input.behavioralResponse}) → C(${input.consequences}).`,
        functionalPattern,
        patternsSummary,
        `TRAPs identificados: ${trapsIdentified.length}.`,
        `Impacto funcional: ${input.functionalImpact}.`,
    ].join(' ');

    // 5. Validación ética via orchestrateSession()
    const salida = await orchestrateSession(context);

    // 6. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 3,
                type: 'ac_3' as const,
                transcript: `Evaluación ABC: A(${input.situationContext}) → B(${input.behavioralResponse}) → C(${input.consequences}). ${clinicalNote}`,
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
                sessionNumber: 3,
                sessionType: 'ac_3' as const,
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
        abcAnalysis,
        trapsIdentified,
        evaluationTools,
        clinicalNote,
        salida,
    };
}
