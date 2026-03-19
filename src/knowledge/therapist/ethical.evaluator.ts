// Evaluador ético para el submódulo normativo TCC
// Implementa la lógica de evaluación ética sobre el estado del paciente
// Conexión con CriticalAlert, criterios de derivación y situaciones de atención humana

import { EthicalRule, EthicalEvaluation, DereferralCriterion } from './ethical.types';

// Estado clínico del paciente (simplificado)
export interface PatientState {
    id: string;
    edad: number;
    sexo: 'M' | 'F' | 'X';
    inventarios: Record<string, any>; // Ej: { bdi_ii: { total: 18, item9: 2 } }
    sintomas: string[]; // Ej: ['ideación suicida', 'psicosis activa']
    contexto: string;
    fecha: string;
}

// Resultado de la evaluación ética
export interface EthicalAssessmentResult {
    restricciones: EthicalEvaluation[];
    alertas: CriticalAlert[];
    derivaciones: DereferralCriterion[];
    requiereAtencionHumana: boolean;
}

// CriticalAlert: definición mínima para integración
export interface CriticalAlert {
    domain: string;
    level: 'warning' | 'urgent' | 'emergency';
    message: string;
    triggeredBy: string;
}

// Evaluador principal
export function evaluateEthics(
    patient: PatientState,
    ethicalRules: EthicalRule[],
    dereferralCriteria: DereferralCriterion[],
): EthicalAssessmentResult {
    const restricciones: EthicalEvaluation[] = [];
    const alertas: CriticalAlert[] = [];
    const derivaciones: DereferralCriterion[] = [];
    let requiereAtencionHumana = false;

    // Evaluar reglas éticas
    for (const rule of ethicalRules) {
        const matched = rule.criteria.filter(c =>
            patient.sintomas.includes(c) || patient.contexto.includes(c)
        );
        if (matched.length > 0) {
            restricciones.push({
                ruleId: rule.id,
                matchedCriteria: matched,
                alertLevel: rule.severity === 'derivación' ? 'derivación' : rule.severity === 'alerta_crisis' ? 'crisis' : 'precaución',
                message: rule.description,
                timestamp: patient.fecha,
            });
            if (rule.severity === 'alerta_crisis' || rule.severity === 'derivación') {
                requiereAtencionHumana = true;
            }
        }
    }

    // Evaluar criterios de derivación obligatoria
    for (const criterion of dereferralCriteria) {
        if (patient.sintomas.includes(criterion.trigger)) {
            derivaciones.push(criterion);
            requiereAtencionHumana = true;
        }
    }

    // Detectar alertas críticas desde inventarios
    if (patient.inventarios.bdi_ii && patient.inventarios.bdi_ii.item9 >= 2) {
        alertas.push({
            domain: 'suicidio',
            level: 'emergency',
            message: 'Ideación suicida activa detectada (BDI-II ítem 9)',
            triggeredBy: 'bdi_ii.item9',
        });
        requiereAtencionHumana = true;
    }

    // Otras situaciones de atención humana
    if (patient.sintomas.includes('psicosis activa') || patient.sintomas.includes('autolesión')) {
        alertas.push({
            domain: 'crisis',
            level: 'urgent',
            message: 'Situación de crisis detectada',
            triggeredBy: 'sintomas',
        });
        requiereAtencionHumana = true;
    }

    return {
        restricciones,
        alertas,
        derivaciones,
        requiereAtencionHumana,
    };
}

// Para integración: cargar reglas desde ac_profile.json y protocolo_crisis.json
// Los criterios pueden mapearse a términos del glosario DSM-5
