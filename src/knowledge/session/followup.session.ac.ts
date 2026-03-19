/**
 * followup.session.ac.ts — Flujo de sesión de seguimiento (fase 7 AC)
 *
 * Compilación del resumen de sesión, plan de práctica basado en técnica y
 * protocolo, recursos de emergencia del KB. Cierre del ciclo terapéutico.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData } from './kb-loader';
import { loadSharedData } from './kb-loader';
import { KBArea, SharedArea } from '../types/technique.types';
import { analyzeSessionPatterns } from '../patient/patternProcessor';
import { usePatientStore } from '@/features/patient/patientStore';

// ============================================================================
// Tipos
// ============================================================================

export interface FollowUpSessionInput {
    /** Datos acumulados de la sesión */
    sessionSummary: {
        mainComplaint: string;
        baselineIntensity: number;
        currentIntensity: number;
        selectedTechnique: string;
        primaryObjective: string;
        trapsIdentified: number;
        comprehensionLevel: string;
    };
}

export interface PracticePlanItem {
    ejercicio: string;
    frecuencia: string;
    objetivo: string;
}

export interface FollowUpSessionResult {
    sessionSummary: string;
    practicePlan: PracticePlanItem[];
    warningSignals: string[];
    emergencyResources: Array<{ recurso: string; contacto: string }>;
    nextSessionGuidance: string;
    salida: SessionOutput;
}

// ============================================================================
// Tipos KB
// ============================================================================

interface EjerciciosKB {
    ejercicios: Array<{
        id: string;
        nombre: string;
        tipo: string;
        objetivo: string;
        frecuencia: string;
    }>;
}

interface EstructuraKB {
    bloques: Array<{
        nombre: string;
        sesiones: string;
        objetivos: string[];
        actividades_principales: string[];
    }>;
}

interface ProtocoloCrisisKB {
    senales_alarma: string[];
    recursos_emergencia: Array<{ recurso: string; contacto: string }>;
}

// ============================================================================
// Flujo principal
// ============================================================================

/**
 * Implementa el flujo de seguimiento y cierre AC (fase 7).
 *
 * Pasos:
 *   1. Compilar resumen de sesión
 *   2. Generar plan de práctica desde KB (ejercicios + estructura)
 *   3. Cargar señales de alarma y recursos de emergencia
 *   4. Determinar guía para la próxima sesión
 *   5. Validación ética via orchestrateSession()
 */
export async function runFollowUpSessionAC(
    context: SessionContext,
    input: FollowUpSessionInput,
): Promise<FollowUpSessionResult> {
    const { sessionSummary: data } = input;

    // 1. Compilar resumen de sesión
    const intensityChange = data.baselineIntensity - data.currentIntensity;
    const trend = intensityChange > 0 ? 'mejora' : intensityChange < 0 ? 'empeoramiento' : 'estable';

    const sessionSummary = [
        `Motivo de consulta: ${data.mainComplaint}.`,
        `Intensidad: ${data.baselineIntensity}/10 → ${data.currentIntensity}/10 (${trend}).`,
        `Técnica seleccionada: ${data.selectedTechnique}.`,
        `Objetivo: ${data.primaryObjective}.`,
        `TRAPs identificados: ${data.trapsIdentified}.`,
        `Nivel de comprensión del modelo: ${data.comprehensionLevel}.`,
    ].join(' ');

    // 2. Generar plan de práctica desde KB
    let practicePlan: PracticePlanItem[] = [];
    try {
        const ejerciciosKB = await loadKBData<EjerciciosKB>('ac', KBArea.EJERCICIOS_TAREAS);
        // Seleccionar ejercicios relevantes para la fase actual
        practicePlan = ejerciciosKB.ejercicios
            .filter(e => e.tipo === 'monitoreo' || e.tipo === 'programacion')
            .slice(0, 3)
            .map(e => ({
                ejercicio: e.nombre,
                frecuencia: e.frecuencia,
                objetivo: e.objetivo,
            }));
    } catch {
        // Fallback con plan básico
        practicePlan = [{
            ejercicio: 'Monitoreo de actividad diaria',
            frecuencia: 'Diario durante 7 días',
            objetivo: 'Registrar actividades y estado de ánimo',
        }];
    }

    // 3. Cargar señales de alarma y recursos de emergencia
    let warningSignals: string[] = [];
    let emergencyResources: Array<{ recurso: string; contacto: string }> = [];

    try {
        const protocolData = await loadSharedData<ProtocoloCrisisKB>(SharedArea.PROTOCOLO_CRISIS);
        warningSignals = protocolData.senales_alarma;
        emergencyResources = protocolData.recursos_emergencia;
    } catch {
        // Fallback con recursos básicos
        warningSignals = ['Empeoramiento súbito del ánimo', 'Ideación suicida'];
        emergencyResources = [{ recurso: 'Emergencias', contacto: '112' }];
    }

    // 4. Determinar guía para la próxima sesión
    let nextSessionGuidance: string;
    try {
        const estructuraKB = await loadKBData<EstructuraKB>('ac', KBArea.ESTRUCTURA_SESIONES);
        // Buscar el bloque correspondiente a la sesión actual
        const sessionNum = context.ultimaSesion;
        const nextBlock = estructuraKB.bloques.find(b => {
            const [start, end] = b.sesiones.split('-').map(Number);
            return sessionNum >= start && sessionNum <= (end || start);
        });
        nextSessionGuidance = nextBlock
            ? `Próxima sesión: Bloque "${nextBlock.nombre}". Objetivos: ${nextBlock.objetivos[0]}.`
            : 'Continuar con el plan de AC según evolución clínica.';
    } catch {
        nextSessionGuidance = 'Continuar con el plan de AC según evolución clínica.';
    }

    // 5. Validación ética via orchestrateSession()
    const salida = await orchestrateSession(context);

    // 6. PatternProcessor — Analizar patrones y documentar
    try {
        const { appendPatternLogEntry, getFolder } = usePatientStore();
        const folder = getFolder(context.paciente.patientId);

        if (folder?.interviewReport) {
            const sessionData = {
                number: 7,
                type: 'ac_7' as const,
                transcript: `Seguimiento y cierre: resumen de progreso, plan de práctica, señales de alerta, recursos de emergencia`,
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
                sessionNumber: 7,
                sessionType: 'ac_7' as const,
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
        sessionSummary,
        practicePlan,
        warningSignals,
        emergencyResources,
        nextSessionGuidance,
        salida,
    };
}
