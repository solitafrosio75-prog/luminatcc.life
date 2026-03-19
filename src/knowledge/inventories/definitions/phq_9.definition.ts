/**
 * phq_9.definition.ts — Definición administrable del PHQ-9
 *
 * PHQ-9: Patient Health Questionnaire-9
 * Kroenke, Spitzer & Williams (2001)
 *
 * Adaptación española: López et al. (2013)
 *
 * NOTA: Los ítems son descriptores de dominio clínico, no el texto literal.
 * El PHQ-9 es de libre acceso para uso clínico y académico.
 */

import type { InventoryDefinition } from '../types/inventory_types';

export const PHQ_9_DEFINITION: InventoryDefinition = {
    id: 'phq_9',
    name: 'Cuestionario de Salud del Paciente-9',
    acronym: 'PHQ-9',
    version: '1.0',
    purpose: 'Evaluar la presencia y gravedad de síntomas depresivos en las últimas dos semanas',
    target_population: 'Adultos y adolescentes (13+)',
    administration_time: '2-5 minutos',
    score_range: { min: 0, max: 27 },
    items: [
        {
            id: 1,
            domain_descriptor: 'Ánimo deprimido',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 2,
            domain_descriptor: 'Pérdida de interés o placer',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 3,
            domain_descriptor: 'Dificultad para dormir o dormir demasiado',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 4,
            domain_descriptor: 'Cansancio o falta de energía',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 5,
            domain_descriptor: 'Pérdida de apetito o comer en exceso',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 6,
            domain_descriptor: 'Sentirse mal consigo mismo',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 7,
            domain_descriptor: 'Dificultad para concentrarse',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 8,
            domain_descriptor: 'Movimientos lentos o inquietud',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: false,
        },
        {
            id: 9,
            domain_descriptor: 'Pensamientos suicidas o de autolesión',
            options: [
                { value: 0, label: 'Nunca' },
                { value: 1, label: 'Varios días' },
                { value: 2, label: 'Más de la mitad de los días' },
                { value: 3, label: 'Casi todos los días' },
            ],
            is_critical: true,
        },
    ],
    severity_levels: [
        { label: 'Depresión mínima', range_min: 0, range_max: 4, color_code: 'green', clinical_implication: 'No hay depresión clínica.', action_suggested: 'Monitorizar si hay factores de riesgo.' },
        { label: 'Depresión leve', range_min: 5, range_max: 9, color_code: 'yellow', clinical_implication: 'Síntomas leves.', action_suggested: 'Intervención preventiva, psicoeducación.' },
        { label: 'Depresión moderada', range_min: 10, range_max: 14, color_code: 'orange', clinical_implication: 'Síntomas moderados.', action_suggested: 'AC, seguimiento clínico.' },
        { label: 'Depresión moderadamente grave', range_min: 15, range_max: 19, color_code: 'red', clinical_implication: 'Síntomas significativos.', action_suggested: 'AC intensiva, considerar medicación.' },
        { label: 'Depresión grave', range_min: 20, range_max: 27, color_code: 'red', clinical_implication: 'Síntomas graves, riesgo elevado.', action_suggested: 'Evaluar riesgo suicida, interconsulta psiquiátrica.' },
    ],
    critical_items: [
        { item_number: 9, domain: 'suicidio', threshold: 1, alert_level: 'warning', protocol_action: 'Explorar en sesión. Evaluar plan, acceso a medios.', protocol_ref: 'protocolo_crisis' },
        { item_number: 9, domain: 'suicidio', threshold: 2, alert_level: 'urgent', protocol_action: 'ACTIVAR PROTOCOLO DE CRISIS.', protocol_ref: 'protocolo_crisis' },
        { item_number: 9, domain: 'suicidio', threshold: 3, alert_level: 'emergency', protocol_action: 'Derivación inmediata a urgencias.', protocol_ref: 'protocolo_crisis' },
    ],
    validity_criteria: [
        { id: 'val_incompleto', name: 'Administración incompleta', detection_rule: 'Menos de 7 ítems respondidos', threshold_description: 'Se requieren al menos 7 ítems para validez.', action_if_detected: 'Readministrar o completar.' },
    ],
    clinical_change: {
        method: 'jacobson_truax',
        description:
            'Para el PHQ-9, un cambio clínicamente significativo implica: ' +
            '(1) que la diferencia supere el RCI (Índice de Cambio Fiable), Y ' +
            '(2) que el paciente pase de la distribución clínica a la normativa (<10). ' +
            'Parámetros: SD=5.6 (Kroenke et al., 2001), r=0.84 test-retest (Löwe et al., 2004). ' +
            'SEdiff = 5.6 * √(2*(1−0.84)) ≈ 3.17. RCI threshold = 1.96.',
        reliable_change_index: 6.21, // SEdiff * 1.96 = 3.17 * 1.96
        clinical_cutoff: 10,
        minimal_important_difference: 5,
    },
    recommended_frequency: 'Cada 2-4 semanas en seguimiento.',
    recommended_sessions: 'Sesiones de evaluación, inicio y cierre de tratamiento.',
    complementary_instruments: ['bdi_ii', 'bads'],
    technique_relevance: {
        ac: 'Detecta síntomas clave para AC. Ítems 2, 4, 5, 8 guían la programación de actividades.',
        rc: 'Ítems 6, 7 reflejan distorsiones cognitivas.',
        exposicion: 'Ítem 8 puede indicar ansiedad comórbida.',
    },
    sources: [
        'Kroenke, K., Spitzer, R.L. & Williams, J.B.W. (2001). The PHQ-9: Validity of a brief depression severity measure. Journal of General Internal Medicine, 16(9), 606-613.',
        'López, A., et al. (2013). Adaptación española del PHQ-9. Revista de Psiquiatría y Salud Mental, 6(2), 104-111.',
    ],
    copyright_note: 'El PHQ-9 es de libre acceso. Los ítems aquí son descriptores de dominio clínico.'
};
