// Tipos para el submódulo ético-normativo TCC

/**
 * Regla ética dura: nunca se flexibiliza
 * Ejemplo: contraindicación absoluta, criterio de derivación, alerta de crisis
 */
export interface EthicalRule {
    id: string;
    name: string;
    description: string;
    source: 'ac_profile' | 'protocolo_crisis' | 'manual' | 'custom';
    severity: 'contraindicación' | 'alerta_crisis' | 'derivación' | 'precaución';
    criteria: string[]; // Criterios clínicos asociados (pueden ser términos del glosario)
}

/**
 * Resultado de la evaluación ética sobre el estado del paciente
 */
export interface EthicalEvaluation {
    ruleId: string;
    matchedCriteria: string[];
    alertLevel: 'bloqueo' | 'derivación' | 'crisis' | 'precaución';
    message: string;
    timestamp: string;
}

/**
 * Criterio de derivación obligatoria
 */
export interface DereferralCriterion {
    id: string;
    name: string;
    description: string;
    trigger: string; // Ejemplo: "ideación suicida", "psicosis activa"
    severity: 'derivación' | 'crisis';
}

// Para integración: los criterios pueden mapearse a términos del glosario.json
