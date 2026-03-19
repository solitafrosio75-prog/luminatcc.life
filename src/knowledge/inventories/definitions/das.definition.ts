/**
 * das.definition.ts — Definición administrable de la DAS
 *
 * DAS: Escala de Actitudes Disfuncionales (Dysfunctional Attitudes Scale)
 * Weissman & Beck (1978)
 *
 * Adaptación española: Sanz, J. & Vázquez, C. (1993)
 * Versión: 35 ítems, escala Likert 0-4
 *
 * NOTA: Los ítems son descriptores de dominio clínico, no el texto literal
 * del instrumento (por restricciones de copyright).
 */

import type { InventoryDefinition } from '../types/inventory_types';

// ── Opciones de respuesta compartidas (Likert 0-4) ─────────────────────────
const LIKERT_0_4 = [
    { value: 0, label: 'Totalmente en desacuerdo' },
    { value: 1, label: 'Moderadamente en desacuerdo' },
    { value: 2, label: 'Dudoso' },
    { value: 3, label: 'Moderadamente de acuerdo' },
    { value: 4, label: 'Completamente de acuerdo' },
] as const;

const opts = [...LIKERT_0_4];

export const DAS_DEFINITION: InventoryDefinition = {
    id: 'das',
    name: 'Escala de Actitudes Disfuncionales',
    acronym: 'DAS',
    version: '1.0',
    purpose:
        'Evaluar actitudes y creencias disfuncionales subyacentes que pueden ' +
        'predisponer a trastornos depresivos. Instrumento central de la ' +
        'Reestructuración Cognitiva (RC) para medir esquemas cognitivos.',
    authors: 'Weissman, A.N. & Beck, A.T.',
    year: 1978,
    target_population: 'Adultos (población general y clínica)',
    administration_time: '10-15 minutos',
    total_items: 35,
    response_format: 'likert_0_4',

    instructions_patient:
        'Señale el grado de acuerdo con estas actitudes. Asegúrese de elegir ' +
        'solo una respuesta para cada frase. No hay respuestas acertadas ni ' +
        'equivocadas. Solo queremos saber lo que usted piensa acerca de estos temas.',
    instructions_clinician:
        'Administrar en fase de evaluación inicial (línea base cognitiva) y ' +
        'al cierre de tratamiento. La DAS mide creencias nucleares estables — ' +
        'el cambio es más lento que en medidas de estado (BDI-II, PHQ-9). ' +
        'Interpretar junto con ATQ-30 para un perfil cognitivo completo.',

    // ── Ítems ──────────────────────────────────────────────────────────────────
    // Agrupados por subescala. Todos puntúan en dirección disfuncional (direct).
    items: [
        // ── Subescala: Aprobación (ítems 1-5) ──────────────────────────────────
        { id: 1,  domain_descriptor: 'Vulnerabilidad a la crítica externa',                      options: opts, subscale_ids: ['aprobacion', 'dependencia'] },
        { id: 2,  domain_descriptor: 'Renuncia a intereses propios por aprobación',               options: opts, subscale_ids: ['aprobacion', 'dependencia'] },
        { id: 3,  domain_descriptor: 'Necesidad de aprobación para la felicidad',                 options: opts, subscale_ids: ['aprobacion', 'dependencia'] },
        { id: 4,  domain_descriptor: 'Sometimiento a expectativas ajenas',                        options: opts, subscale_ids: ['aprobacion', 'dependencia'] },
        { id: 5,  domain_descriptor: 'Valor personal dependiente de opinión ajena',               options: opts, subscale_ids: ['aprobacion', 'dependencia'] },

        // ── Subescala: Amor (ítems 6-10) ────────────────────────────────────────
        { id: 6,  domain_descriptor: 'Felicidad condicionada al amor',                            options: opts, subscale_ids: ['amor', 'dependencia'] },
        { id: 7,  domain_descriptor: 'Felicidad dependiente de aceptación social',                options: opts, subscale_ids: ['amor', 'dependencia'] },
        { id: 8,  domain_descriptor: 'Rechazo como prueba de error personal',                     options: opts, subscale_ids: ['amor', 'dependencia'] },
        { id: 9,  domain_descriptor: 'Amor no correspondido como indicador de desinterés',        options: opts, subscale_ids: ['amor', 'dependencia'] },
        { id: 10, domain_descriptor: 'Aislamiento social como fuente de infelicidad',             options: opts, subscale_ids: ['amor', 'dependencia'] },

        // ── Subescala: Logro (ítems 11-15) ──────────────────────────────────────
        { id: 11, domain_descriptor: 'Necesidad de destacar para tener dignidad',                 options: opts, subscale_ids: ['logro', 'logro_perfeccionismo'] },
        { id: 12, domain_descriptor: 'Productividad como condición del sentido vital',            options: opts, subscale_ids: ['logro', 'logro_perfeccionismo'] },
        { id: 13, domain_descriptor: 'Ideas como medida de dignidad personal',                    options: opts, subscale_ids: ['logro', 'logro_perfeccionismo'] },
        { id: 14, domain_descriptor: 'Comparación desfavorable como inferioridad',                options: opts, subscale_ids: ['logro', 'logro_perfeccionismo'] },
        { id: 15, domain_descriptor: 'Fracaso laboral como fracaso personal',                     options: opts, subscale_ids: ['logro', 'logro_perfeccionismo'] },

        // ── Subescala: Perfeccionismo (ítems 16-20) ─────────────────────────────
        { id: 16, domain_descriptor: 'Abandono ante la imperfección',                             options: opts, subscale_ids: ['perfeccionismo', 'logro_perfeccionismo'] },
        { id: 17, domain_descriptor: 'Vergüenza por mostrar debilidades',                         options: opts, subscale_ids: ['perfeccionismo', 'logro_perfeccionismo'] },
        { id: 18, domain_descriptor: 'Exigencia de excelencia universal',                         options: opts, subscale_ids: ['perfeccionismo', 'logro_perfeccionismo'] },
        { id: 19, domain_descriptor: 'Culpa obligatoria ante errores',                            options: opts, subscale_ids: ['perfeccionismo', 'logro_perfeccionismo'] },
        { id: 20, domain_descriptor: 'Metas elevadas como requisito de valía',                    options: opts, subscale_ids: ['perfeccionismo', 'logro_perfeccionismo'] },

        // ── Subescala: Derechos (ítems 21-25) ───────────────────────────────────
        { id: 21, domain_descriptor: 'Derecho a obtener lo que se cree merecer',                  options: opts, subscale_ids: ['derechos'] },
        { id: 22, domain_descriptor: 'Frustración inevitable ante obstáculos',                    options: opts, subscale_ids: ['derechos'] },
        { id: 23, domain_descriptor: 'Expectativa de reciprocidad obligada',                      options: opts, subscale_ids: ['derechos'] },
        { id: 24, domain_descriptor: 'Derecho al amor del cónyuge por méritos propios',           options: opts, subscale_ids: ['derechos'] },
        { id: 25, domain_descriptor: 'Expectativa de trato recíproco proporcional',               options: opts, subscale_ids: ['derechos'] },

        // ── Subescala: Omnipotencia (ítems 26-29) ───────────────────────────────
        { id: 26, domain_descriptor: 'Responsabilidad por conducta y sentimientos ajenos',        options: opts, subscale_ids: ['omnipotencia'] },
        { id: 27, domain_descriptor: 'Atribución de malestar ajeno a la propia crítica',          options: opts, subscale_ids: ['omnipotencia'] },
        { id: 28, domain_descriptor: 'Obligación de ayudar a todos como criterio de bondad',      options: opts, subscale_ids: ['omnipotencia'] },
        { id: 29, domain_descriptor: 'Responsabilidad parental por dificultades infantiles',      options: opts, subscale_ids: ['omnipotencia'] },

        // ── Subescala: Autonomía (ítems 30-35) ──────────────────────────────────
        { id: 30, domain_descriptor: 'Necesidad universal de agradar',                            options: opts, subscale_ids: ['autonomia', 'dependencia'] },
        { id: 31, domain_descriptor: 'Incapacidad percibida de control emocional',                options: opts, subscale_ids: ['autonomia'] },
        { id: 32, domain_descriptor: 'Inevitabilidad de emociones desagradables',                 options: opts, subscale_ids: ['autonomia'] },
        { id: 33, domain_descriptor: 'Locus de control externo del estado de ánimo',              options: opts, subscale_ids: ['autonomia'] },
        { id: 34, domain_descriptor: 'Felicidad dependiente de circunstancias externas',          options: opts, subscale_ids: ['autonomia'] },
        { id: 35, domain_descriptor: 'Éxito social como determinante de felicidad',               options: opts, subscale_ids: ['autonomia'] },
    ],

    // ── Subescalas ─────────────────────────────────────────────────────────────
    // 7 subescalas clásicas + 2 factores de segundo orden (Sanz & Vázquez, 1993)
    subscales: [
        // -- Subescalas clásicas (Weissman, 1978) --
        {
            id: 'aprobacion',
            name: 'Aprobación',
            item_numbers: [1, 2, 3, 4, 5],
            range_min: 0,
            range_max: 20,
            clinical_meaning:
                'Tendencia a juzgar la autoestima en función de la reacción de los demás.',
        },
        {
            id: 'amor',
            name: 'Amor',
            item_numbers: [6, 7, 8, 9, 10],
            range_min: 0,
            range_max: 20,
            clinical_meaning:
                'Tendencia a medir la valía y felicidad en función de ser amado o no.',
        },
        {
            id: 'logro',
            name: 'Logro',
            item_numbers: [11, 12, 13, 14, 15],
            range_min: 0,
            range_max: 20,
            clinical_meaning:
                'Sentido constreñido de autovalía centrado en trabajo y productividad.',
        },
        {
            id: 'perfeccionismo',
            name: 'Perfeccionismo',
            item_numbers: [16, 17, 18, 19, 20],
            range_min: 0,
            range_max: 20,
            clinical_meaning:
                'Establecimiento de criterios de rendimiento inflexibles y excesivamente altos.',
        },
        {
            id: 'derechos',
            name: 'Derechos',
            item_numbers: [21, 22, 23, 24, 25],
            range_min: 0,
            range_max: 20,
            clinical_meaning:
                'Creencia en el derecho inherente al éxito, amor y felicidad.',
        },
        {
            id: 'omnipotencia',
            name: 'Omnipotencia',
            item_numbers: [26, 27, 28, 29],
            range_min: 0,
            range_max: 16,
            clinical_meaning:
                'Focalización en el universo personal con responsabilidad excesiva sobre los demás.',
        },
        {
            id: 'autonomia',
            name: 'Autonomía',
            item_numbers: [30, 31, 32, 33, 34, 35],
            range_min: 0,
            range_max: 24,
            clinical_meaning:
                'Dificultad para encontrar felicidad internamente; locus de control externo.',
        },

        // -- Factores de segundo orden (Sanz & Vázquez, 1993) --
        {
            id: 'logro_perfeccionismo',
            name: 'Logro/Perfeccionismo (Factor 1)',
            item_numbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            range_min: 0,
            range_max: 40,
            clinical_meaning:
                'Factor principal de vulnerabilidad centrado en estándares de rendimiento. ' +
                'Asociado a personalidad autónoma/sociotrópica (Beck, 1983).',
        },
        {
            id: 'dependencia',
            name: 'Dependencia/Necesidad de Aprobación (Factor 2)',
            item_numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30],
            range_min: 0,
            range_max: 44,
            clinical_meaning:
                'Factor de vulnerabilidad centrado en la necesidad de aprobación y amor. ' +
                'Asociado a personalidad sociotrópica (Beck, 1983).',
        },
    ],

    // ── Puntuación total ──────────────────────────────────────────────────────
    score_range: { min: 0, max: 140 },

    // ── Niveles de severidad ──────────────────────────────────────────────────
    // Basados en normativa española (Sanz & Vázquez, 1993) convertida a escala 0-4
    severity_levels: [
        {
            label: 'Mínimo',
            range_min: 0,
            range_max: 35,
            color_code: 'green',
            clinical_implication: 'Creencias mayoritariamente adaptativas.',
            action_suggested: 'Sin intervención cognitiva específica necesaria.',
        },
        {
            label: 'Leve',
            range_min: 36,
            range_max: 70,
            color_code: 'yellow',
            clinical_implication:
                'Algunas actitudes disfuncionales presentes. Vulnerabilidad latente.',
            action_suggested:
                'Psicoeducación sobre distorsiones cognitivas. Monitorizar en seguimiento.',
        },
        {
            label: 'Moderado',
            range_min: 71,
            range_max: 105,
            color_code: 'orange',
            clinical_implication:
                'Actitudes disfuncionales significativas. Sistema de creencias rígido.',
            action_suggested:
                'Reestructuración cognitiva activa. Identificar creencias nucleares.',
        },
        {
            label: 'Severo',
            range_min: 106,
            range_max: 140,
            color_code: 'red',
            clinical_implication:
                'Sistema de creencias altamente disfuncional. Alto riesgo de recaída depresiva.',
            action_suggested:
                'RC intensiva. Trabajo con esquemas profundos. Considerar terapia de esquemas si no responde.',
        },
    ],

    // ── Ítems críticos ────────────────────────────────────────────────────────
    // La DAS no tiene ítems de riesgo vital (como suicidio).
    // Sin embargo, puntuaciones extremas en ciertas subescalas indican
    // vulnerabilidad cognitiva que debe monitorizarse.
    critical_items: [],

    // ── Criterios de validez ──────────────────────────────────────────────────
    validity_criteria: [
        {
            id: 'val_incompleto',
            name: 'Administración incompleta',
            detection_rule: 'Menos de 28 ítems respondidos (80%)',
            threshold_description:
                'Se requieren al menos 28 de 35 ítems para una puntuación válida.',
            action_if_detected: 'Readministrar o completar los ítems faltantes.',
        },
        {
            id: 'val_aquiescencia',
            name: 'Sesgo de aquiescencia',
            detection_rule: 'Más del 90% de respuestas idénticas',
            threshold_description:
                'Si 32+ ítems tienen la misma puntuación, posible patrón de respuesta aleatorio.',
            action_if_detected:
                'Explorar motivación del paciente. Considerar readministración.',
        },
    ],

    // ── Cambio clínico ────────────────────────────────────────────────────────
    // La DAS mide creencias estables (más trait que state).
    // El cambio esperado es más lento que en BDI-II o PHQ-9.
    clinical_change: {
        method: 'jacobson_truax',
        description:
            'Para la DAS-35, un cambio clínicamente significativo implica: ' +
            '(1) que la diferencia supere el RCI (Índice de Cambio Fiable), Y ' +
            '(2) que el paciente pase de rango disfuncional a adaptativo (<36). ' +
            'Parámetros: SD=18.0 (estimado Sanz & Vázquez, 1993, escala 0-4), ' +
            'r=0.73 test-retest (Sanz & Vázquez, 1993). ' +
            'SEdiff = 18.0 * √(2*(1−0.73)) ≈ 13.23. RCI threshold = 1.96.',
        reliable_change_index: 25.93, // SEdiff * 1.96 = 13.23 * 1.96
        clinical_cutoff: 36,
        minimal_important_difference: 14,
    },

    recommended_frequency: 'Pre/post tratamiento. Opcionalmente cada 4-8 semanas.',
    recommended_sessions: 'Evaluación inicial, mitad de tratamiento y cierre.',
    complementary_instruments: ['bdi_ii', 'phq_9'],

    technique_relevance: {
        rc: 'INSTRUMENTO CENTRAL de RC. Mide la línea base cognitiva (creencias nucleares) ' +
            'y el cambio en esquemas disfuncionales a lo largo del tratamiento.',
        ac: 'Complementario en AC. Identifica creencias que pueden dificultar la activación ' +
            'conductual (ej: "Si no puedo hacer algo bien, es mejor que lo deje").',
    },

    sources: [
        'Weissman, A.N. & Beck, A.T. (1978). Development and validation of the Dysfunctional Attitude Scale. Paper presented at the AERA annual meeting, Toronto.',
        'Sanz, J. & Vázquez, C. (1993). Adaptación española de la Escala de Actitudes Disfuncionales (DAS) de Weissman y Beck: propiedades clínicas y psicométricas. Clínica y Salud, 4(1), 51-66.',
        'Beck, A.T. (1979). Cognitive Therapy of Depression. Guilford Press.',
        'Beck, A.T. (1983). Cognitive therapy of depression: New perspectives. In P.J. Clayton & J.E. Barrett (Eds.), Treatment of depression: Old controversies and new approaches (pp. 265-290). Raven Press.',
    ],
    copyright_note:
        'Los ítems aquí son descriptores de dominio clínico, no texto literal del instrumento.',
};
