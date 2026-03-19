/**
 * followup.session.rc.ts — Flujo de sesión de seguimiento (fase 7 RC)
 *
 * Compilación del resumen de sesión, plan de práctica basado en técnicas
 * cognitivas, recursos de emergencia del KB. Cierre del ciclo terapéutico.
 * Usa el orquestador real para validación ética y decisiones clínicas.
 */

import { orchestrateSession, type SessionContext, type SessionOutput } from './session.orchestrator';
import { loadKBData, loadSharedData } from './kb-loader';
import { KBArea, SharedArea } from '../types/technique.types';

// ============================================================================
// Tipos
// ============================================================================

export interface FollowUpRCInput {
    /** Datos acumulados de la sesión */
    sessionSummary: {
        mainComplaint: string;
        baselineConviction: number;     // 0-100 convicción en PA al inicio
        currentConviction: number;      // 0-100 convicción actual
        baselineIntensity: number;      // 0-10 SUDs
        currentIntensity: number;       // 0-10 SUDs
        selectedTechnique: string;
        primaryObjective: string;
        distortionsIdentified: number;
        comprehensionLevel: string;
    };
}

export interface PracticePlanItem {
    ejercicio: string;
    frecuencia: string;
    objetivo: string;
}

export interface FollowUpRCResult {
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
 * Implementa el flujo de seguimiento y cierre RC (fase 7).
 *
 * Pasos:
 *   1. Compilar resumen de sesión
 *   2. Generar plan de práctica desde KB RC (ejercicios cognitivos)
 *   3. Cargar señales de alarma y recursos de emergencia
 *   4. Determinar guía para la próxima sesión
 *   5. Validación ética via orchestrateSession()
 */
export async function runFollowUpSessionRC(
    context: SessionContext,
    input: FollowUpRCInput,
): Promise<FollowUpRCResult> {
    const { sessionSummary: data } = input;

    // 1. Compilar resumen de sesión
    const convictionChange = data.baselineConviction - data.currentConviction;
    const intensityChange = data.baselineIntensity - data.currentIntensity;
    const trend = convictionChange > 0 ? 'reducción de convicción' : convictionChange < 0 ? 'aumento de convicción' : 'estable';

    const sessionSummary = [
        `Motivo de consulta: ${data.mainComplaint}.`,
        `Convicción en PA: ${data.baselineConviction}% → ${data.currentConviction}% (${trend}).`,
        `Intensidad emocional: ${data.baselineIntensity}/10 → ${data.currentIntensity}/10.`,
        `Técnica seleccionada: ${data.selectedTechnique}.`,
        `Objetivo: ${data.primaryObjective}.`,
        `Distorsiones identificadas: ${data.distortionsIdentified}.`,
        `Nivel de comprensión del modelo: ${data.comprehensionLevel}.`,
    ].join(' ');

    // 2. Generar plan de práctica desde KB RC
    let practicePlan: PracticePlanItem[] = [];
    try {
        const ejerciciosKB = await loadKBData<EjerciciosKB>('rc', KBArea.EJERCICIOS_TAREAS);
        practicePlan = ejerciciosKB.ejercicios
            .filter(e => e.tipo === 'autoregistro' || e.tipo === 'registro' || e.tipo === 'reestructuracion')
            .slice(0, 3)
            .map(e => ({
                ejercicio: e.nombre,
                frecuencia: e.frecuencia,
                objetivo: e.objetivo,
            }));
    } catch {
        // Fallback con plan básico de RC
        practicePlan = [{
            ejercicio: 'Registro de pensamientos automáticos (3 columnas)',
            frecuencia: 'Diario durante 7 días',
            objetivo: 'Identificar y registrar pensamientos automáticos con emoción asociada',
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
        warningSignals = ['Empeoramiento súbito del ánimo', 'Ideación suicida'];
        emergencyResources = [{ recurso: 'Emergencias', contacto: '112' }];
    }

    // 4. Determinar guía para la próxima sesión
    let nextSessionGuidance: string;
    try {
        const estructuraKB = await loadKBData<EstructuraKB>('rc', KBArea.ESTRUCTURA_SESIONES);
        const sessionNum = context.ultimaSesion;
        const nextBlock = estructuraKB.bloques.find(b => {
            const [start, end] = b.sesiones.split('-').map(Number);
            return sessionNum >= start && sessionNum <= (end || start);
        });
        nextSessionGuidance = nextBlock
            ? `Próxima sesión: Bloque "${nextBlock.nombre}". Objetivos: ${nextBlock.objetivos[0]}.`
            : 'Continuar con el plan de RC según evolución clínica.';
    } catch {
        nextSessionGuidance = 'Continuar con el plan de RC según evolución clínica.';
    }

    // 5. Validación ética via orchestrateSession()
    const salida = await orchestrateSession({ ...context, techniqueId: 'rc' });

    return {
        sessionSummary,
        practicePlan,
        warningSignals,
        emergencyResources,
        nextSessionGuidance,
        salida,
    };
}
