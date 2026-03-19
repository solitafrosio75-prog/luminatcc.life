/**
 * scl_90_r.definition.ts — Definición administrable del SCL-90-R
 *
 * SCL-90-R: Symptom Checklist 90-Revised (Listado de Síntomas 90-Revisado)
 * Derogatis, L.R. (1977, 1994)
 *
 * Adaptación argentina: Casullo & Castro Solano (1999, 2008)
 * Baremos locales: Góngora & Castro Solano (2019) — población general AMBA
 *                  Bruno, Tisocco & Stover (2021) — población universitaria UBA
 *
 * 90 ítems · 9 dimensiones clínicas · 3 índices globales · 7 ítems adicionales
 * Escala Likert 0-4 (Nada / Muy Poco / Poco / Bastante / Mucho)
 * Marco temporal: última semana (7 días)
 *
 * Instrumento de SCREENING psicopatológico (alta sensibilidad, baja especificidad).
 * NO es instrumento diagnóstico. Identifica RIESGO, no confirma trastorno.
 *
 * NOTA: Los ítems son descriptores de dominio clínico, NO texto literal
 * del instrumento (por restricciones de copyright).
 */

import type { InventoryDefinition } from '../types/inventory_types';

// ── Opciones de respuesta compartidas (Likert 0-4) ───────────────────────
const LIKERT_0_4 = [
    { value: 0, label: 'Nada' },
    { value: 1, label: 'Muy poco' },
    { value: 2, label: 'Poco' },
    { value: 3, label: 'Bastante' },
    { value: 4, label: 'Mucho' },
] as const;

const opts = [...LIKERT_0_4];

export const SCL_90_R_DEFINITION: InventoryDefinition = {
    id: 'scl_90_r',
    name: 'Listado de Síntomas SCL-90-R',
    acronym: 'SCL-90-R',
    version: '1.0',
    purpose:
        'Evaluación amplia de sintomatología psicopatológica mediante screening de 9 ' +
        'dimensiones clínicas. Identifica riesgo psicopatológico, no confirma diagnóstico. ' +
        'El GSI (Índice Global de Severidad) es el mejor predictor de riesgo.',
    authors: 'Derogatis, L.R.',
    year: 1977,
    target_population: 'Adultos y adolescentes (13-65 años)',
    administration_time: '12-15 minutos',
    total_items: 90,
    response_format: 'likert_0_4',

    instructions_patient:
        'A continuación le presentamos una lista de problemas que tiene la gente. ' +
        'Lea cada uno de ellos y marque su respuesta pensando en cómo se sintió, ' +
        'en qué medida ese problema le ha preocupado o molestado durante la última ' +
        'semana (7 días). Tiene cinco posibilidades de respuesta: NADA – MUY POCO – ' +
        'POCO – BASTANTE – MUCHO. No hay respuestas buenas o malas: todas sirven. ' +
        'No deje frases sin responder.',
    instructions_clinician:
        'El SCL-90-R es un instrumento de SCREENING, no de diagnóstico. Administrar ' +
        'en evaluación inicial para formulación de caso. Riesgo = GSI ≥ T65 O ≥2 escalas ' +
        'clínicas ≥ T65. Los ítems marcados con Bastante/Mucho deben explorarse en ' +
        'entrevista para profundización clínica. Prestar atención especial a ítems ' +
        'adicionales (19, 44, 59, 60, 64, 66, 89) y al ítem 15 (ideación suicida).',

    // ── Ítems (90) ──────────────────────────────────────────────────────────
    // Agrupados por subescala. subscale_ids indica pertenencia.
    // Ítems que no pertenecen a ninguna dimensión = "adicionales" (sin subscale_ids).
    items: [
        // ── 1. Somatizaciones (SOM) — 12 ítems ─────────────────────────────
        { id: 1,  domain_descriptor: 'Cefaleas',                                              options: opts, subscale_ids: ['som'] },
        { id: 4,  domain_descriptor: 'Sensación de mareo o desmayo',                           options: opts, subscale_ids: ['som'] },
        { id: 12, domain_descriptor: 'Dolor precordial',                                       options: opts, subscale_ids: ['som'] },
        { id: 27, domain_descriptor: 'Dolor lumbar',                                           options: opts, subscale_ids: ['som'] },
        { id: 40, domain_descriptor: 'Náuseas o malestar gástrico',                            options: opts, subscale_ids: ['som'] },
        { id: 42, domain_descriptor: 'Calambres musculares',                                   options: opts, subscale_ids: ['som'] },
        { id: 48, domain_descriptor: 'Dificultad respiratoria',                                options: opts, subscale_ids: ['som'] },
        { id: 49, domain_descriptor: 'Ataques de frío o calor',                                options: opts, subscale_ids: ['som'] },
        { id: 52, domain_descriptor: 'Hormigueo corporal',                                     options: opts, subscale_ids: ['som'] },
        { id: 53, domain_descriptor: 'Nudo en la garganta',                                    options: opts, subscale_ids: ['som'] },
        { id: 56, domain_descriptor: 'Debilidad segmentaria',                                  options: opts, subscale_ids: ['som'] },
        { id: 58, domain_descriptor: 'Pesadez en extremidades',                                options: opts, subscale_ids: ['som'] },

        // ── 2. Obsesiones y Compulsiones (OBS) — 10 ítems ──────────────────
        { id: 3,  domain_descriptor: 'Pensamientos intrusivos desagradables',                   options: opts, subscale_ids: ['obs'] },
        { id: 9,  domain_descriptor: 'Dificultad para memorizar',                              options: opts, subscale_ids: ['obs'] },
        { id: 10, domain_descriptor: 'Preocupación por falta de motivación',                   options: opts, subscale_ids: ['obs'] },
        { id: 28, domain_descriptor: 'Dificultad para completar tareas',                       options: opts, subscale_ids: ['obs'] },
        { id: 38, domain_descriptor: 'Lentitud compulsiva para verificar',                     options: opts, subscale_ids: ['obs'] },
        { id: 45, domain_descriptor: 'Necesidad de verificar repetidamente',                   options: opts, subscale_ids: ['obs'] },
        { id: 46, domain_descriptor: 'Dificultad para decidir',                                options: opts, subscale_ids: ['obs'] },
        { id: 51, domain_descriptor: 'Mente en blanco',                                        options: opts, subscale_ids: ['obs'] },
        { id: 55, domain_descriptor: 'Dificultad de concentración',                            options: opts, subscale_ids: ['obs'] },
        { id: 65, domain_descriptor: 'Rituales repetitivos (contar, lavar, tocar)',             options: opts, subscale_ids: ['obs'] },

        // ── 3. Sensibilidad Interpersonal (SI) — 9 ítems ───────────────────
        { id: 6,  domain_descriptor: 'Tendencia a criticar a los demás',                       options: opts, subscale_ids: ['si'] },
        { id: 21, domain_descriptor: 'Incomodidad con personas del otro sexo',                  options: opts, subscale_ids: ['si'] },
        { id: 34, domain_descriptor: 'Susceptibilidad emocional',                              options: opts, subscale_ids: ['si'] },
        { id: 36, domain_descriptor: 'Sensación de incomprensión',                             options: opts, subscale_ids: ['si'] },
        { id: 37, domain_descriptor: 'Percepción de rechazo social',                           options: opts, subscale_ids: ['si'] },
        { id: 41, domain_descriptor: 'Sentimiento de inferioridad',                            options: opts, subscale_ids: ['si'] },
        { id: 61, domain_descriptor: 'Incomodidad al ser observado',                           options: opts, subscale_ids: ['si'] },
        { id: 69, domain_descriptor: 'Hipersensibilidad a la opinión ajena',                   options: opts, subscale_ids: ['si'] },
        { id: 73, domain_descriptor: 'Incomodidad al comer/beber en público',                  options: opts, subscale_ids: ['si'] },

        // ── 4. Depresión (DEP) — 13 ítems ──────────────────────────────────
        { id: 5,  domain_descriptor: 'Pérdida de interés sexual',                              options: opts, subscale_ids: ['dep'] },
        { id: 14, domain_descriptor: 'Falta de energía vital',                                 options: opts, subscale_ids: ['dep'] },
        { id: 15, domain_descriptor: 'Ideación suicida',                                       options: opts, subscale_ids: ['dep'], is_critical: true, critical_threshold: 1 },
        { id: 20, domain_descriptor: 'Llanto fácil',                                           options: opts, subscale_ids: ['dep'] },
        { id: 22, domain_descriptor: 'Sensación de estar atrapado',                            options: opts, subscale_ids: ['dep'] },
        { id: 26, domain_descriptor: 'Culpa excesiva',                                         options: opts, subscale_ids: ['dep'] },
        { id: 29, domain_descriptor: 'Soledad',                                                options: opts, subscale_ids: ['dep'] },
        { id: 30, domain_descriptor: 'Tristeza',                                               options: opts, subscale_ids: ['dep'] },
        { id: 31, domain_descriptor: 'Preocupación excesiva generalizada',                     options: opts, subscale_ids: ['dep'] },
        { id: 32, domain_descriptor: 'Desinterés generalizado',                                options: opts, subscale_ids: ['dep'] },
        { id: 54, domain_descriptor: 'Desesperanza sobre el futuro',                           options: opts, subscale_ids: ['dep'] },
        { id: 71, domain_descriptor: 'Sensación de esfuerzo excesivo para todo',               options: opts, subscale_ids: ['dep'] },
        { id: 79, domain_descriptor: 'Sentimiento de inutilidad',                              options: opts, subscale_ids: ['dep'] },

        // ── 5. Ansiedad (ANS) — 10 ítems ───────────────────────────────────
        { id: 2,  domain_descriptor: 'Nerviosismo general',                                    options: opts, subscale_ids: ['ans'] },
        { id: 17, domain_descriptor: 'Temblor corporal',                                       options: opts, subscale_ids: ['ans'] },
        { id: 23, domain_descriptor: 'Sustos repentinos sin razón',                            options: opts, subscale_ids: ['ans'] },
        { id: 33, domain_descriptor: 'Miedos inespecíficos',                                   options: opts, subscale_ids: ['ans'] },
        { id: 39, domain_descriptor: 'Taquicardia',                                            options: opts, subscale_ids: ['ans'] },
        { id: 57, domain_descriptor: 'Nerviosismo y agitación intensa',                        options: opts, subscale_ids: ['ans'] },
        { id: 72, domain_descriptor: 'Ataques de pánico',                                      options: opts, subscale_ids: ['ans'] },
        { id: 78, domain_descriptor: 'Inquietud motora',                                       options: opts, subscale_ids: ['ans'] },
        { id: 80, domain_descriptor: 'Anticipación de peligro',                                options: opts, subscale_ids: ['ans'] },
        { id: 86, domain_descriptor: 'Imágenes y pensamientos atemorizantes',                   options: opts, subscale_ids: ['ans'] },

        // ── 6. Hostilidad (HOS) — 6 ítems ──────────────────────────────────
        { id: 11, domain_descriptor: 'Irritabilidad',                                          options: opts, subscale_ids: ['hos'] },
        { id: 24, domain_descriptor: 'Explosiones de ira incontrolables',                      options: opts, subscale_ids: ['hos'] },
        { id: 63, domain_descriptor: 'Impulsos de agredir',                                    options: opts, subscale_ids: ['hos'] },
        { id: 67, domain_descriptor: 'Impulsos destructivos',                                  options: opts, subscale_ids: ['hos'] },
        { id: 74, domain_descriptor: 'Tendencia a discutir',                                   options: opts, subscale_ids: ['hos'] },
        { id: 81, domain_descriptor: 'Gritar o tirar cosas',                                   options: opts, subscale_ids: ['hos'] },

        // ── 7. Ansiedad Fóbica (FOB) — 7 ítems ─────────────────────────────
        { id: 13, domain_descriptor: 'Miedo a espacios abiertos o calles',                     options: opts, subscale_ids: ['fob'] },
        { id: 25, domain_descriptor: 'Miedo a salir solo de casa',                             options: opts, subscale_ids: ['fob'] },
        { id: 47, domain_descriptor: 'Miedo a transporte público',                             options: opts, subscale_ids: ['fob'] },
        { id: 50, domain_descriptor: 'Evitación fóbica de situaciones',                        options: opts, subscale_ids: ['fob'] },
        { id: 70, domain_descriptor: 'Incomodidad en aglomeraciones',                          options: opts, subscale_ids: ['fob'] },
        { id: 75, domain_descriptor: 'Nerviosismo al estar solo',                              options: opts, subscale_ids: ['fob'] },
        { id: 82, domain_descriptor: 'Miedo a desmayarse en público',                          options: opts, subscale_ids: ['fob'] },

        // ── 8. Ideación Paranoide (PAR) — 6 ítems ──────────────────────────
        { id: 8,  domain_descriptor: 'Atribución externa de culpa',                            options: opts, subscale_ids: ['par'] },
        { id: 18, domain_descriptor: 'Desconfianza generalizada',                              options: opts, subscale_ids: ['par'] },
        { id: 43, domain_descriptor: 'Sensación de ser vigilado o comentado',                   options: opts, subscale_ids: ['par'] },
        { id: 68, domain_descriptor: 'Ideas que otros no comprenden',                          options: opts, subscale_ids: ['par'] },
        { id: 76, domain_descriptor: 'Sensación de no ser valorado',                           options: opts, subscale_ids: ['par'] },
        { id: 83, domain_descriptor: 'Sensación de que se aprovechan de uno',                  options: opts, subscale_ids: ['par'] },

        // ── 9. Psicoticismo (PSIC) — 10 ítems ──────────────────────────────
        { id: 7,  domain_descriptor: 'Sensación de control externo del pensamiento',           options: opts, subscale_ids: ['psic'] },
        { id: 16, domain_descriptor: 'Alucinaciones auditivas',                                options: opts, subscale_ids: ['psic'] },
        { id: 35, domain_descriptor: 'Transparencia del pensamiento',                          options: opts, subscale_ids: ['psic'] },
        { id: 62, domain_descriptor: 'Pensamientos intrusivos egodistónicos',                   options: opts, subscale_ids: ['psic'] },
        { id: 77, domain_descriptor: 'Soledad existencial estando acompañado',                 options: opts, subscale_ids: ['psic'] },
        { id: 84, domain_descriptor: 'Pensamientos sexuales intrusivos',                       options: opts, subscale_ids: ['psic'] },
        { id: 85, domain_descriptor: 'Ideas de castigo merecido',                              options: opts, subscale_ids: ['psic'] },
        { id: 87, domain_descriptor: 'Sensación somática anormal (algo anda mal)',              options: opts, subscale_ids: ['psic'] },
        { id: 88, domain_descriptor: 'Alienación interpersonal',                               options: opts, subscale_ids: ['psic'] },
        { id: 90, domain_descriptor: 'Sensación de disfunción mental',                         options: opts, subscale_ids: ['psic'] },

        // ── Ítems adicionales (sin dimensión) — 7 ítems ────────────────────
        // Relevancia clínica per se — explorar en entrevista si Bastante/Mucho
        { id: 19, domain_descriptor: 'Pérdida de apetito',                                     options: opts, clinical_note: 'Ítem adicional: explorar en entrevista si ≥3' },
        { id: 44, domain_descriptor: 'Dificultades para dormir',                               options: opts, clinical_note: 'Ítem adicional: explorar en entrevista si ≥3' },
        { id: 59, domain_descriptor: 'Pensamientos sobre la muerte',                           options: opts, is_critical: true, critical_threshold: 2, clinical_note: 'Ítem adicional crítico: ideación de muerte. EXPLORAR siempre.' },
        { id: 60, domain_descriptor: 'Hiperfagia (comer en exceso)',                            options: opts, clinical_note: 'Ítem adicional: explorar en entrevista si ≥3' },
        { id: 64, domain_descriptor: 'Despertar precoz',                                       options: opts, clinical_note: 'Ítem adicional: explorar en entrevista si ≥3' },
        { id: 66, domain_descriptor: 'Sueño intranquilo',                                      options: opts, clinical_note: 'Ítem adicional: explorar en entrevista si ≥3' },
        { id: 89, domain_descriptor: 'Sentimiento de culpa',                                   options: opts, clinical_note: 'Ítem adicional: explorar en entrevista si ≥3' },
    ],

    // ── Subescalas (9 dimensiones clínicas) ──────────────────────────────────
    subscales: [
        {
            id: 'som',
            name: 'Somatizaciones',
            item_numbers: [1, 4, 12, 27, 40, 42, 48, 49, 52, 53, 56, 58],
            clinical_meaning:
                'Malestares relacionados con disfunciones corporales ' +
                '(cardiovasculares, gastrointestinales, respiratorias). ' +
                'Incluye equivalentes somáticos de ansiedad.',
        },
        {
            id: 'obs',
            name: 'Obsesiones y Compulsiones',
            item_numbers: [3, 9, 10, 28, 38, 45, 46, 51, 55, 65],
            clinical_meaning:
                'Pensamientos, acciones e impulsos vivenciados como imposibles de ' +
                'evitar o no deseados. Corresponde al síndrome obsesivo-compulsivo.',
        },
        {
            id: 'si',
            name: 'Sensibilidad Interpersonal',
            item_numbers: [6, 21, 34, 36, 37, 41, 61, 69, 73],
            clinical_meaning:
                'Sentimientos de inferioridad e inadecuación, especialmente al ' +
                'compararse con los demás.',
        },
        {
            id: 'dep',
            name: 'Depresión',
            item_numbers: [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79],
            clinical_meaning:
                'Manifestaciones clínicas del síndrome depresivo: ánimo disfórico, ' +
                'falta de motivación, baja energía, desesperanza, ideación suicida.',
        },
        {
            id: 'ans',
            name: 'Ansiedad',
            item_numbers: [2, 17, 23, 33, 39, 57, 72, 78, 80, 86],
            clinical_meaning:
                'Indicadores generales de ansiedad: nerviosismo, tensión, ' +
                'ataques de pánico, miedos inespecíficos.',
        },
        {
            id: 'hos',
            name: 'Hostilidad',
            item_numbers: [11, 24, 63, 67, 74, 81],
            clinical_meaning:
                'Pensamientos, sentimientos y acciones características de afectos ' +
                'negativos de enojo e ira.',
        },
        {
            id: 'fob',
            name: 'Ansiedad Fóbica',
            item_numbers: [13, 25, 47, 50, 70, 75, 82],
            clinical_meaning:
                'Respuestas persistentes de miedo irracional y desproporcionado ' +
                'a personas, lugares, objetos o situaciones. Agorafobia y fobias.',
        },
        {
            id: 'par',
            name: 'Ideación Paranoide',
            item_numbers: [8, 18, 43, 68, 76, 83],
            clinical_meaning:
                'Desórdenes del pensamiento paranoide: pensamiento proyectivo, ' +
                'suspicacia, sensación de ser observado.',
        },
        {
            id: 'psic',
            name: 'Psicoticismo',
            item_numbers: [7, 16, 35, 62, 77, 84, 85, 87, 88, 90],
            clinical_meaning:
                'Espectro de conductas psicóticas: soledad, estilo esquizoide, ' +
                'alucinaciones, control del pensamiento.',
        },
    ],

    // ── Niveles de severidad (basados en GSI bruto → T score) ────────────────
    // Estos rangos se aplican al GSI promedio bruto.
    // Baremo: Góngora & Castro Solano (2019), población general AMBA, N=2873
    // Criterio de riesgo: T ≥ 65 → GSI ≥ 1.32
    score_range: { min: 0, max: 360 }, // Suma total teórica: 90 × 4
    severity_levels: [
        {
            label: 'Sin riesgo psicopatológico',
            range_min: 0,
            range_max: 52,  // GSI promedio < 0.58 → T < 50
            color_code: 'green',
            clinical_implication: 'Sintomatología dentro de rango normativo.',
            action_suggested: 'No requiere intervención por sintomatología.',
        },
        {
            label: 'Malestar leve',
            range_min: 53,
            range_max: 97,  // GSI promedio 0.58-1.08 → T 50-60
            color_code: 'yellow',
            clinical_implication: 'Malestar psicológico moderado, dentro de lo esperable.',
            action_suggested: 'Monitorizar en entrevista. Explorar ítems elevados.',
        },
        {
            label: 'Riesgo psicopatológico',
            range_min: 98,
            range_max: 142, // GSI promedio 1.08-1.58 → T 60-70
            color_code: 'orange',
            clinical_implication: 'Malestar significativo. Posible patrón sintomático activo.',
            action_suggested: 'Profundizar en entrevista. Evaluar dimensiones elevadas.',
        },
        {
            label: 'Riesgo psicopatológico elevado',
            range_min: 143,
            range_max: 360, // GSI promedio ≥ 1.58 → T ≥ 70
            color_code: 'red',
            clinical_implication: 'Distrés psicológico severo. Alta probabilidad de patología activa.',
            action_suggested: 'Evaluación clínica urgente. Explorar dimensiones y derivar si necesario.',
        },
    ],

    // ── Ítems críticos ──────────────────────────────────────────────────────
    critical_items: [
        // Ítem 15: Ideación suicida (dimensión DEP)
        {
            item_number: 15,
            domain: 'suicidio',
            domain_descriptor: 'Ideación suicida directa — ítem 15 SCL-90-R',
            threshold: 1,
            alert_level: 'warning',
            protocol_action: 'Explorar en entrevista: plan, acceso a medios, red de soporte.',
            protocol_ref: 'protocolo_crisis',
        },
        {
            item_number: 15,
            domain: 'suicidio',
            domain_descriptor: 'Ideación suicida frecuente — ítem 15 SCL-90-R',
            threshold: 2,
            alert_level: 'urgent',
            protocol_action: 'ACTIVAR protocolo de crisis. Evaluar riesgo inminente.',
            protocol_ref: 'protocolo_crisis',
        },
        {
            item_number: 15,
            domain: 'suicidio',
            domain_descriptor: 'Ideación suicida severa — ítem 15 SCL-90-R',
            threshold: 3,
            alert_level: 'emergency',
            protocol_action: 'DERIVACIÓN INMEDIATA a urgencias. No dejar solo al paciente.',
            protocol_ref: 'protocolo_crisis',
        },
        // Ítem 59: Pensamientos sobre la muerte (ítem adicional)
        {
            item_number: 59,
            domain: 'muerte',
            domain_descriptor: 'Pensamientos de muerte — ítem adicional 59 SCL-90-R',
            threshold: 2,
            alert_level: 'warning',
            protocol_action: 'Explorar en entrevista: naturaleza de los pensamientos, pasividad vs. actividad.',
            protocol_ref: 'protocolo_crisis',
        },
        {
            item_number: 59,
            domain: 'muerte',
            domain_descriptor: 'Pensamientos de muerte intensos — ítem adicional 59 SCL-90-R',
            threshold: 3,
            alert_level: 'urgent',
            protocol_action: 'Evaluar diferencial con ítem 15 (suicidio). Considerar activar protocolo crisis.',
            protocol_ref: 'protocolo_crisis',
        },
        // Ítem 16: Alucinaciones auditivas (dimensión PSIC)
        {
            item_number: 16,
            domain: 'psicosis',
            domain_descriptor: 'Alucinaciones auditivas — ítem 16 SCL-90-R',
            threshold: 2,
            alert_level: 'urgent',
            protocol_action: 'Evaluar naturaleza de las voces. Considerar interconsulta psiquiátrica.',
        },
    ],

    // ── Criterios de validez ────────────────────────────────────────────────
    validity_criteria: [
        {
            id: 'val_incompleto',
            name: 'Administración incompleta',
            detection_rule: 'Menos de 72 ítems respondidos (< 80%)',
            threshold_description: 'Se requieren al menos 72/90 ítems para puntuación válida.',
            action_if_detected: 'Readministrar o solicitar completar los ítems omitidos.',
        },
        {
            id: 'val_aquiescencia',
            name: 'Sesgo de aquiescencia',
            detection_rule: '80+ ítems con misma respuesta',
            threshold_description: 'Patrón uniforme sugiere falta de compromiso con la tarea.',
            action_if_detected: 'Readministrar explorando comprensión de la consigna.',
        },
    ],

    // ── Cambio clínico (Jacobson-Truax para GSI promedio) ───────────────────
    clinical_change: {
        method: 'jacobson_truax',
        description:
            'Para el SCL-90-R, el cambio clínicamente significativo se evalúa sobre el GSI promedio. ' +
            'Parámetros: SD(GSI) = 0.50 (Góngora & Castro Solano, 2019, pob. general), ' +
            'r = 0.86 test-retest (Derogatis, 1994). ' +
            'SEdiff = 0.50 * √(2*(1-0.86)) ≈ 0.265. RCI = 1.96 * 0.265 ≈ 0.52. ' +
            'Punto de corte clínico: GSI ≥ 1.32 (T=65, baremo argentino).',
        reliable_change_index: 0.52,
        clinical_cutoff: 1.32,  // GSI promedio = T65 en baremo argentino
        minimal_important_difference: 0.40,
    },

    recommended_frequency: 'Evaluación inicial y cierre de tratamiento. Opcionalmente cada 3-6 meses.',
    recommended_sessions: 'Sesión de evaluación inicial (formulación de caso). Sesión de cierre.',
    complementary_instruments: ['bdi_ii', 'phq_9', 'bads'],

    technique_relevance: {
        ac: 'Dimensión DEP: seguimiento de síntomas diana. Dimensiones SOM/ANS: comorbilidad somática y ansiosa.',
        rc: 'Dimensiones DEP, OBS, SI: patrones cognitivos disfuncionales. FOB/ANS: comorbilidad ansiosa.',
        exposicion: 'Dimensiones FOB, ANS: línea base y progreso en exposición.',
        dbt: 'SI, HOS: regulación emocional. PSIC: síntomas disociativos o pensamiento desorganizado.',
        trec: 'OBS, DEP, ANS: activación emocional ligada a creencias irracionales.',
    },

    sources: [
        'Derogatis, L.R. (1977). SCL-90-R Administration, Scoring and Procedures Manual - II. Towson, MD: Clinical Psychometric Research.',
        'Derogatis, L.R. (1994). SCL-90-R: Administration, scoring, and procedures manual (3rd ed.). Minneapolis, MN: NCS Pearson.',
        'Casullo, M.M. & Castro Solano, A. (1999). Síntomas psicopatológicos en estudiantes adolescentes argentinos, aportaciones del SCL-90-R. Anuario de Investigaciones, 7, 147-157.',
        'Góngora, V. & Castro Solano, A. (2019). Baremos SCL-90-R, población general AMBA, N=2873.',
        'Bruno, F.E., Tisocco, F. & Stover, J.B. (2021). Sintomatología psicopatológica en estudiantes de UBA. Anuario de Investigaciones, 28(1), 409-416.',
        'Sánchez, R.O. & Ledesma, R.D. (2009). Análisis Psicométrico del SCL-90-R en Población Clínica. Revista Argentina de Clínica Psicológica, 18(3), 265-274.',
    ],
    copyright_note:
        'Los ítems son descriptores de dominio clínico, NO el texto literal del instrumento. ' +
        'El SCL-90-R es propiedad intelectual de Pearson/NCS. Para uso clínico se requiere adquirir ' +
        'los protocolos oficiales.',
};
