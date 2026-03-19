/**
 * Tipos para el submódulo ético-normativo AC
 * Prioridad: reglas duras, contraindicaciones, criterios de derivación
 *
 * Fuentes:
 * - Contraindicaciones: ac_profile.json
 * - Señales de alarma y pasos: protocolo_crisis.json
 * - Criterios de derivación: ac_profile.json, protocolo_crisis.json
 *
 * Referencias clínicas:
 * - Martell, Dimidjian & Herman-Dunn (2010). Behavioral Activation for Depression
 * - Dimidjian et al. (2006). Randomized trial of behavioral activation
 * - Ekers et al. (2014). Cochrane review behavioral activation
 *
 * Integración:
 * - Se conecta con el motor de inventarios (CriticalAlert)
 * - Activación automática del protocolo de crisis ante señales de alarma
 *
 * Ejemplo de flujo:
 * 1. Se evalúan las reglas éticas (contraindicaciones absolutas/relativas)
 * 2. Se detectan señales de alarma (protocolo_crisis)
 * 3. Se determina si procede derivación obligatoria
 * 4. Se genera un mensaje clínico para el terapeuta
 */

// -------------------
// Ejemplos de uso clínico
// -------------------

/**
 * Ejemplo de regla ética:
 * const regla: EthicalRule = {
 *   id: 'ac_ci_01',
 *   condicion: 'Riesgo suicida inminente',
 *   tipo: 'absoluta',
 *   razon_clinica: 'La prioridad es contención y seguridad inmediata antes de programar actividades.',
 *   alternativa_sugerida: 'Protocolo de crisis y estabilización intensiva'
 * };
 */

/**
 * Ejemplo de evaluación ética:
 * const evaluacion: EthicalEvaluation = {
 *   reglas_aplicadas: [regla],
 *   senales_alarma: ['Puntuación BDI-II ítem 9 >= 2'],
 *   banderas_seguridad: ['abandono total de autocuidado'],
 *   resultado: 'derivacion',
 *   mensaje_clinico: 'Derivación obligatoria por riesgo suicida. Activar protocolo de crisis.'
 * };
 */

/**
 * Ejemplo de criterio de derivación:
 * const criterio: DereferralCriterion = {
 *   criterio: 'riesgo_suicida_alto',
 *   fuente: 'ac_profile',
 *   descripcion: 'Paciente con ideación suicida activa y plan específico.'
 * };
 */

// Tipos para el submódulo ético-normativo AC
// Prioridad: reglas duras, contraindicaciones, criterios de derivación

export type EthicalRule = {
    /** ID única de la regla (ej: ac_ci_01) */
    id: string;
    /** Descripción clínica de la condición */
    condicion: string;
    /** Tipo de regla: 'absoluta' | 'relativa' */
    tipo: 'absoluta' | 'relativa';
    /** Razón clínica para la contraindicación */
    razon_clinica: string;
    /** Alternativa sugerida en caso de contraindicación */
    alternativa_sugerida?: string;
};

export type EthicalEvaluation = {
    /** Reglas aplicadas (EthicalRule) */
    reglas_aplicadas: EthicalRule[];
    /** Señales de alarma detectadas (protocolo_crisis) */
    senales_alarma: string[];
    /** Banderas de seguridad (AC profile) */
    banderas_seguridad?: string[];
    /** Resultado global: 'permitido' | 'restringido' | 'derivacion' */
    resultado: 'permitido' | 'restringido' | 'derivacion';
    /** Mensaje clínico para el terapeuta */
    mensaje_clinico: string;
};

export type DereferralCriterion = {
    /** Criterio de derivación obligatoria (AC profile) */
    criterio: string;
    /** Fuente del criterio — extensible a cualquier técnica */
    fuente: 'ac_profile' | 'rc_profile' | 'protocolo_crisis';
    /** Descripción clínica */
    descripcion?: string;
};

// Ejemplo de uso:
// const regla: EthicalRule = { ... };
// const evaluacion: EthicalEvaluation = { ... };
// const criterio: DereferralCriterion = { ... };
