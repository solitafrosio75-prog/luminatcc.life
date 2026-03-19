// Evaluador ético-normativo genérico (multi-técnica)
// Recibe estado clínico del paciente y devuelve restricciones, alertas y criterios de derivación.
// Funciona con cualquier técnica (AC, RC, etc.) usando matching basado en señales clínicas,
// no IDs de regla hardcodeados.

import { EthicalRule, EthicalEvaluation, DereferralCriterion } from './ethical.types';
import type { CriticalItemAlert } from '../inventories/types/inventory_types';

export type EthicalEvaluatorInput = {
    // Estado clínico relevante (señales compartidas AC + RC + extensibles)
    riesgo_suicida?: boolean;
    psicosis_activa?: boolean;
    bipolar_sin_estabilizacion?: boolean;
    consumo_severo?: boolean;
    /** RC: contraindicación rc_ci_02 — compromete memoria de trabajo y razonamiento */
    deterioro_cognitivo?: boolean;

    /**
     * Alertas críticas del motor de inventarios (BDI-II, PHQ-9).
     * Fuente de verdad única para señales de seguridad del paciente.
     * Cada alerta incluye item_id, value, domain_descriptor y urgency.
     */
    critical_alerts?: CriticalItemAlert[];

    /**
     * @deprecated Usar critical_alerts en su lugar.
     * Valor bruto del ítem 9 del BDI-II. Mantenido para backward compatibility.
     */
    bdi_ii_item9?: number;

    banderas_seguridad?: string[];
    senales_alarma?: string[];
};

export type EthicalEvaluatorOutput = EthicalEvaluation & {
    criterios_derivacion: DereferralCriterion[];
};

// ============================================================================
// Signal-based matching — multi-técnica
// ============================================================================

/**
 * Mapeo de keywords en `condicion` (texto del profile JSON) → campo en EthicalEvaluatorInput.
 * Soporta AC (ac_ci_01..03), RC (rc_ci_01..03) y futuras técnicas sin cambios.
 *
 * Cada regla del profile JSON tiene un campo `condicion` en español.
 * Este mapeo extrae la señal clínica del texto para matchear contra el input.
 */
const CONDITION_SIGNAL_MAP: Record<string, keyof EthicalEvaluatorInput> = {
    'riesgo suicida': 'riesgo_suicida',
    'psicosis': 'psicosis_activa',
    'bipolar': 'bipolar_sin_estabilizacion',
    'deterioro cognitivo': 'deterioro_cognitivo',
};

/**
 * Mapeo de criterios de derivación → campo en EthicalEvaluatorInput.
 * Incluye variantes usadas por distintas técnicas (AC y RC usan
 * terminología ligeramente diferente en sus profiles).
 */
const CRITERIA_SIGNAL_MAP: Record<string, keyof EthicalEvaluatorInput> = {
    'riesgo_suicida_alto': 'riesgo_suicida',
    'sintomas_psicoticos_activos': 'psicosis_activa',
    'sintomas_psicoticos_no_controlados': 'psicosis_activa',       // variante RC
    'sospecha_de_episodio_maniaco': 'bipolar_sin_estabilizacion',
    'consumo_severo_no_controlado': 'consumo_severo',
    'consumo_agudo_de_sustancias': 'consumo_severo',               // variante RC
};

/**
 * Determina si una regla ética aplica al estado clínico actual.
 * Busca keywords de CONDITION_SIGNAL_MAP en el campo `condicion` de la regla
 * y verifica si la señal correspondiente está activa en el input.
 */
function matchesCondition(regla: EthicalRule, input: EthicalEvaluatorInput): boolean {
    const condicionLower = regla.condicion.toLowerCase();
    for (const [keyword, signalKey] of Object.entries(CONDITION_SIGNAL_MAP)) {
        if (condicionLower.includes(keyword) && input[signalKey]) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// Evaluador principal
// ============================================================================

/**
 * Evaluador ético-normativo genérico (multi-técnica).
 * Recibe el estado clínico del paciente y determina restricciones, alertas y criterios de derivación.
 *
 * Funciona con reglas de cualquier técnica (AC, RC, etc.) gracias al
 * matching basado en señales clínicas (CONDITION_SIGNAL_MAP).
 *
 * @param input Estado clínico del paciente
 * @param reglas Reglas éticas (contraindicaciones del profile de la técnica)
 * @param criterios Criterios de derivación obligatoria
 * @returns Evaluación ética completa
 */
export function evaluateEthics(
    input: EthicalEvaluatorInput,
    reglas: EthicalRule[],
    criterios: DereferralCriterion[]
): EthicalEvaluatorOutput {
    // Lógica clínica: filtrar reglas aplicables via signal-based matching
    const reglas_aplicadas = reglas.filter(regla => matchesCondition(regla, input));

    // Detectar señales de alarma
    const senales_alarma = [...(input.senales_alarma || [])];

    // ── Fuente de verdad: critical_alerts del motor de inventarios ──
    // El engine genera alertas con 3 niveles de urgencia (moderate/high/critical).
    // Todas se propagan como señales de alarma; urgency high/critical
    // también activan riesgo_suicida si no estaba ya marcado.
    if (input.critical_alerts && input.critical_alerts.length > 0) {
        for (const alert of input.critical_alerts) {
            if (alert.urgency === 'critical') {
                senales_alarma.push(
                    `EMERGENCIA: ${alert.domain_descriptor} (valor ${alert.value}, urgencia crítica)`
                );
            } else if (alert.urgency === 'high') {
                senales_alarma.push(
                    `ALERTA ALTA: ${alert.domain_descriptor} (valor ${alert.value})`
                );
            } else {
                senales_alarma.push(
                    `Alerta: ${alert.domain_descriptor} (valor ${alert.value})`
                );
            }
        }
    } else if (input.bdi_ii_item9 !== undefined && input.bdi_ii_item9 >= 1) {
        // Fallback deprecated: compatible con código que aún pase bdi_ii_item9
        // Nota: ahora sincronizado con el engine — alerta desde valor 1, no 2
        senales_alarma.push(`Puntuación BDI-II ítem 9 = ${input.bdi_ii_item9}`);
    }

    // Detectar banderas de seguridad
    const banderas_seguridad = input.banderas_seguridad || [];

    // Determinar criterios de derivación — via signal-based matching
    const criterios_derivacion = criterios.filter(criterio => {
        const signalKey = CRITERIA_SIGNAL_MAP[criterio.criterio];
        return signalKey ? !!input[signalKey] : false;
    });

    // Resultado global
    let resultado: EthicalEvaluation['resultado'] = 'permitido';
    let mensaje_clinico = 'No se detectan restricciones éticas.';
    if (reglas_aplicadas.some(r => r.tipo === 'absoluta') || criterios_derivacion.length > 0) {
        resultado = 'derivacion';
        mensaje_clinico = 'Derivación obligatoria por contraindicación absoluta o criterio de crisis.';
    } else if (reglas_aplicadas.some(r => r.tipo === 'relativa')) {
        resultado = 'restringido';
        mensaje_clinico = 'Intervención restringida por contraindicación relativa. Requiere supervisión.';
    }

    return {
        reglas_aplicadas,
        senales_alarma,
        banderas_seguridad,
        resultado,
        mensaje_clinico,
        criterios_derivacion
    };
}
