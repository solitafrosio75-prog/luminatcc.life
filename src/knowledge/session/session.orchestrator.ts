/**
 * session.orchestrator.ts — Orquestador de sesión clínica TCC-Lab (multi-técnica)
 *
 * Prioridad clínica: Ético > Automonitoreo > Relacional > Decisión terapeuta
 *
 * Conecta los módulos reales:
 *   1. evaluateEthics() — evaluación ético-normativa (AC, RC, o cualquier técnica)
 *   2. ChangeAnalysis — análisis de cambio Jacobson-Truax
 *   3. deriveClinicalSeverity() + adaptTherapeuticLanguage() — severidad + comunicación
 *   4. selectRelationalSkill() — habilidad terapéutica relacional
 *
 * Soporta múltiples técnicas via `context.techniqueId`:
 *   - Carga perfil dinámicamente según técnica (AC, RC)
 *   - Usa evaluador ético genérico (signal-based matching)
 *   - Backward-compatible: techniqueId es optional, default = 'ac'
 */

import { Patient } from '../patient/patient.types';
import { ChangeAnalysis } from '../patient/change.analysis';
import type { CriticalItemAlert } from '../inventories/types/inventory_types';

// Módulo ético (genérico, multi-técnica)
import { evaluateEthics, type EthicalEvaluatorInput } from '../ac/ethical.evaluator';
import type { EthicalRule, DereferralCriterion } from '../ac/ethical.types';

// Módulo relacional + severidad
import { adaptTherapeuticLanguage } from '../therapist/adaptador.comunicacion';
import { deriveClinicalSeverity, snapshotFromBDIII } from '../therapist/severity.derivator';
import { selectRelationalSkill, type SelectorContext } from '../therapist/relational.selector';

// Protocolo de crisis
import { activarProtocoloCrisis, type CrisisSession } from '../therapist/crisis.protocol';
import { loadSharedData } from './kb-loader';
import { SharedArea } from '../types/technique.types';
import type { TechniqueId } from '../types/technique.types';

// Perfiles estáticos de técnicas (reglas éticas + criterios de derivación)
import acProfile from '../ac/profile/ac.profile.json';
import rcProfile from '../rc/profile/rc.profile.json';

// ============================================================================
// Tipos públicos
// ============================================================================

export interface SessionContext {
    paciente: Patient;
    ultimaSesion: number;
    estadoEmocional: SelectorContext['estadoEmocional'];
    fase: SelectorContext['fase'];
    inventarios: ChangeAnalysis[];
    alertaCrisis: boolean;
    /** Técnica activa para reglas éticas. Default: 'ac' (backward-compatible). */
    techniqueId?: TechniqueId;
}

/** Datos estructurados del protocolo de crisis (cuando se activa derivación) */
export interface CrisisProtocolOutput {
    crisisSession: CrisisSession;
    currentStepDetail: { paso: number; accion: string; detalle: string } | null;
    emergencyResources: Array<{ recurso: string; contacto: string }>;
    contraindications: string[];
    warningSignals: string[];
}

export interface SessionOutput {
    decisionTerapeuta: string;
    recursos: string[];
    mensaje: string;
    validacionEtica: string;
    salida: string;
    /** Presente solo cuando se activa el protocolo de crisis (resultado='derivacion') */
    crisisProtocol?: CrisisProtocolOutput;
}

// ============================================================================
// Resolución dinámica de perfil por técnica
// ============================================================================

interface TechniqueProfile {
    contraindicaciones: EthicalRule[];
    requiere_derivacion_si: string[];
}

/**
 * Resuelve el perfil clínico según la técnica.
 * Cada perfil contiene contraindicaciones (absoluta/relativa) y
 * criterios de derivación obligatoria.
 */
function getProfileForTechnique(techniqueId: TechniqueId = 'ac'): TechniqueProfile {
    switch (techniqueId) {
        case 'rc':
            return rcProfile as unknown as TechniqueProfile;
        case 'ac':
        default:
            return acProfile as unknown as TechniqueProfile;
    }
}

// ============================================================================
// Helpers internos
// ============================================================================

/**
 * Construye el input para el evaluador ético a partir del contexto de sesión.
 * Extrae señales clínicas del paciente y sus inventarios.
 *
 * Usa critical_alerts como fuente de verdad única para señales de seguridad.
 * Actualmente el modelo Patient solo tiene alertaCritica: boolean — cuando
 * evolucione a incluir CriticalItemAlert[], se pasarán directamente.
 */
function buildEthicalInput(context: SessionContext): EthicalEvaluatorInput {
    const bdiTimeline = context.paciente.inventarios.find(i => i.inventario === 'BDI-II');
    const lastBDI = bdiTimeline?.administraciones.slice(-1)[0];

    // Convertir la señal booleana del Patient model a CriticalItemAlert[]
    // hasta que el modelo evolucione para incluir alertas tipadas del engine
    const critical_alerts: CriticalItemAlert[] = [];
    if (lastBDI?.alertaCritica) {
        critical_alerts.push({
            item_id: 9,
            value: 2, // alertaCritica=true implica al menos valor 2
            domain_descriptor: 'pensamientos_suicidas',
            urgency: 'high',
        });
    }

    return {
        riesgo_suicida: context.alertaCrisis || (lastBDI?.alertaCritica ?? false),
        critical_alerts,
        senales_alarma: context.alertaCrisis ? ['Alerta de crisis activa'] : [],
    };
}

// ============================================================================
// Orquestador principal
// ============================================================================

/**
 * Orquesta una sesión clínica completa.
 *
 * Prioridad: Ético > Automonitoreo > Relacional > Decisión terapeuta.
 * Cada paso usa módulos reales (no mocks) para:
 *   1. Evaluar restricciones éticas y criterios de derivación (multi-técnica)
 *   2. Analizar tendencia clínica desde inventarios
 *   3. Derivar severidad y adaptar lenguaje terapéutico
 *   4. Seleccionar habilidad relacional apropiada
 */
export async function orchestrateSession(context: SessionContext): Promise<SessionOutput> {
    // ── Paso 0: Resolver perfil según técnica ─────────────────────────────
    const techniqueId = context.techniqueId ?? 'ac';
    const profile = getProfileForTechnique(techniqueId);

    const ethicalRules: EthicalRule[] = profile.contraindicaciones as EthicalRule[];
    const deferralCriteria: DereferralCriterion[] = profile.requiere_derivacion_si.map(
        (criterio: string) => ({
            criterio,
            fuente: `${techniqueId}_profile` as DereferralCriterion['fuente'],
        })
    );

    // ── Paso 1: Evaluación ética ──────────────────────────────────────────
    const ethicalInput = buildEthicalInput(context);
    const ethicalResult = evaluateEthics(ethicalInput, ethicalRules, deferralCriteria);

    if (ethicalResult.resultado === 'derivacion') {
        // Activar protocolo de crisis real con datos del KB
        const motivo = ethicalResult.criterios_derivacion.map(c => c.criterio).join(', ');
        const crisisSession = activarProtocoloCrisis(motivo);

        // Cargar protocolo de crisis desde shared KB (6 pasos, recursos, señales)
        let protocolData: {
            pasos_intervencion: Array<{ paso: number; accion: string; detalle: string }>;
            recursos_emergencia: Array<{ recurso: string; contacto: string }>;
            contraindicaciones: string[];
            senales_alarma: string[];
        } | null = null;

        try {
            protocolData = await loadSharedData(SharedArea.PROTOCOLO_CRISIS);
        } catch {
            // Fallback si el KB no está disponible (tests sin registry)
        }

        const firstStep = protocolData?.pasos_intervencion[0] ?? null;

        return {
            decisionTerapeuta: `Activar protocolo de crisis — Paso 1: ${firstStep?.accion ?? 'Evaluar riesgo inmediato'}`,
            recursos: protocolData
                ? protocolData.recursos_emergencia.map(r => `${r.recurso}: ${r.contacto}`)
                : ['protocolo_crisis.json'],
            mensaje: ethicalResult.mensaje_clinico,
            validacionEtica: `Derivación obligatoria: ${motivo}`,
            salida: 'Protocolo de crisis activado',
            crisisProtocol: {
                crisisSession,
                currentStepDetail: firstStep,
                emergencyResources: protocolData?.recursos_emergencia ?? [],
                contraindications: protocolData?.contraindicaciones ?? [],
                warningSignals: protocolData?.senales_alarma ?? [],
            },
        };
    }

    // ── Paso 2: Automonitoreo (análisis de cambio) ────────────────────────
    const cambio = context.inventarios.find(c => c.inventario === 'BDI-II');
    let decisionAuto = '';
    if (cambio) {
        if (cambio.tendencia === 'empeora') {
            decisionAuto = 'Reforzar monitoreo y ajustar plan';
        } else if (cambio.tendencia === 'mejora') {
            decisionAuto = 'Mantener estrategia, reforzar feedback positivo';
        } else {
            decisionAuto = 'Revisar barreras, mantener monitoreo';
        }
    }

    // ── Paso 3: Derivar severidad + adaptar mensaje ──────────────────────
    const bdiTimeline = context.paciente.inventarios.find(i => i.inventario === 'BDI-II');
    const lastBDI = bdiTimeline?.administraciones.slice(-1)[0];

    const inventorySnapshots = lastBDI
        ? [snapshotFromBDIII(
            lastBDI.puntuacion,
            '', // severityLabel se derivará desde puntuación por fallback
            new Date(lastBDI.fecha).getTime(),
        )]
        : [];

    const severityResult = deriveClinicalSeverity(inventorySnapshots);

    const selectorContext: SelectorContext = {
        fase: context.fase,
        estadoEmocional: context.estadoEmocional,
        tipoRespuesta: 'directa',
    };

    const mensajeBase = decisionAuto || 'Sesión en curso.';
    const adapted = adaptTherapeuticLanguage(mensajeBase, selectorContext, severityResult);

    // ── Paso 4: Selección de habilidad relacional ────────────────────────
    const skill = await selectRelationalSkill(
        selectorContext,
        severityResult.severidad,
        severityResult.alertasCriticas,
    );

    const decisionTerapeuta = skill
        ? `${decisionAuto ? decisionAuto + '. ' : ''}Habilidad relacional: ${skill.nombre}`
        : decisionAuto || 'Seleccionar técnica según perfil y fase terapéutica.';

    const recursos = ['psicoeducación', 'monitoreo actividad', 'feedback'];
    if (skill) recursos.push(`habilidad:${skill.id}`);

    // ── Paso 5: Validación ética final ───────────────────────────────────
    const validacionEtica = ethicalResult.resultado === 'restringido'
        ? `Restringido: ${ethicalResult.mensaje_clinico}`
        : ethicalResult.mensaje_clinico;

    // ── Paso 6: Salida ───────────────────────────────────────────────────
    return {
        decisionTerapeuta,
        recursos,
        mensaje: adapted.mensaje,
        validacionEtica,
        salida: decisionAuto || 'Sesión completada',
    };
}
