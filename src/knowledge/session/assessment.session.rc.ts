/**
 * assessment.session.rc.ts — Flujo de sesión de evaluación cognitiva (fase 2 RC)
 *
 * Conceptualización cognitiva, detección de distorsiones, registro de pensamientos.
 * En vez del análisis funcional ABC (AC), RC hace conceptualización cognitiva:
 *   Situación → Pensamiento Automático → Emoción → Distorsión → Convicción.
 *
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

export interface CognitiveAssessmentInput {
    situationContext: string;           // Situación activadora
    automaticThought: string;           // Pensamiento automático
    emotionalResponse: string;          // Emoción y descripción
    emotionIntensity: number;           // 0-100 intensidad
    cognitiveDistortions: string[];     // Distorsiones detectadas (IDs del catálogo)
    beliefConviction: number;           // 0-100 convicción en PA
    behavioralConsequence: string;      // Conducta resultante
}

export interface DistortionMatch {
    id: string;
    nombre: string;
    pregunta_socratica: string;
}

export interface CognitiveConceptualization {
    activatingSituation: string;
    automaticThought: string;
    identifiedDistortions: DistortionMatch[];
    emotionalResponse: string;
    emotionIntensity: number;
    convictionLevel: number;
}

export interface CognitiveAssessmentResult {
    conceptualization: CognitiveConceptualization;
    distortionMatches: DistortionMatch[];
    evaluationTools: Array<{ id: string; nombre: string; cuando_usar: string }>;
    clinicalNote: string;
    salida: SessionOutput;
}

// ============================================================================
// Tipos KB
// ============================================================================

interface DistorsionesKB {
    distorsiones: Array<{
        id: string;
        nombre: string;
        definicion: string;
        ejemplo: string;
        pregunta_socratica: string;
        trastornos_asociados?: string[];
    }>;
}

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
 * Implementa el flujo de evaluación cognitiva RC (fase 2).
 *
 * Pasos:
 *   1. Construir conceptualización cognitiva
 *   2. Matchear distorsiones contra catálogo KB
 *   3. Cargar herramientas de evaluación desde KB
 *   4. Generar nota clínica
 *   5. Validación ética via orchestrateSession()
 */
export async function runAssessmentSessionRC(
    context: SessionContext,
    input: CognitiveAssessmentInput,
): Promise<CognitiveAssessmentResult> {
    // 1. Matchear distorsiones contra catálogo KB
    let distortionMatches: DistortionMatch[] = [];
    try {
        const distorsionesKB = await loadKBData<DistorsionesKB>('rc', KBArea.RC_DISTORSIONES_COGNITIVAS);
        distortionMatches = distorsionesKB.distorsiones
            .filter(d =>
                input.cognitiveDistortions.some(cd =>
                    cd.toLowerCase() === d.id.toLowerCase() ||
                    d.nombre.toLowerCase().includes(cd.toLowerCase()) ||
                    cd.toLowerCase().includes(d.id.toLowerCase().split('_')[0])
                )
            )
            .map(d => ({
                id: d.id,
                nombre: d.nombre,
                pregunta_socratica: d.pregunta_socratica,
            }));
    } catch {
        // Fallback si KB no disponible
    }

    // 2. Construir conceptualización cognitiva
    const conceptualization: CognitiveConceptualization = {
        activatingSituation: input.situationContext,
        automaticThought: input.automaticThought,
        identifiedDistortions: distortionMatches,
        emotionalResponse: input.emotionalResponse,
        emotionIntensity: input.emotionIntensity,
        convictionLevel: input.beliefConviction,
    };

    // 3. Cargar herramientas de evaluación desde KB
    let evaluationTools: Array<{ id: string; nombre: string; cuando_usar: string }> = [];
    try {
        const herramientas = await loadKBData<HerramientasKB>('rc', KBArea.HERRAMIENTAS_EVALUACION);
        evaluationTools = herramientas.herramientas
            .filter(h => h.tipo === 'autoregistro' || h.tipo === 'registro' || h.tipo === 'inventario')
            .map(h => ({ id: h.id, nombre: h.nombre, cuando_usar: h.cuando_usar }));
    } catch {
        // Fallback si KB no disponible
    }

    // 4. Generar nota clínica
    const distortionsSummary = distortionMatches.length > 0
        ? `Distorsiones cognitivas detectadas: ${distortionMatches.map(d => d.nombre).join(', ')}.`
        : 'Sin distorsiones cognitivas formalmente identificadas en el catálogo.';

    const clinicalNote = [
        `Evaluación cognitiva completada. Convicción en PA: ${input.beliefConviction}/100.`,
        `Situación activadora: "${input.situationContext}".`,
        `Pensamiento automático: "${input.automaticThought}".`,
        `Emoción: ${input.emotionalResponse} (intensidad: ${input.emotionIntensity}/100).`,
        distortionsSummary,
        `Conducta resultante: ${input.behavioralConsequence}.`,
    ].join(' ');

    // 5. Validación ética via orchestrateSession()
    const salida = await orchestrateSession({ ...context, techniqueId: 'rc' });

    // 6. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 2,
                type: 'rc_2' as const,
                transcript: `Conceptualización RC: Situación → PA(${input.automaticThought}) → Emoción(${input.emotionalResponse}) → Distorsiones(${distortionMatches.length}). ${clinicalNote}`,
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
                sessionType: 'rc_2' as const,
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
        conceptualization,
        distortionMatches,
        evaluationTools,
        clinicalNote,
        salida,
    };
}
