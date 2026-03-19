/**
 * bdi_ii.definition.ts — Definición administrable del BDI-II
 *
 * NOTA SOBRE COPYRIGHT: Los ítems NO reproducen el texto literal del
 * instrumento original (copyright de Pearson/Psychological Corporation).
 * En su lugar, cada ítem describe el DOMINIO CLÍNICO que evalúa y las
 * opciones de respuesta se expresan como DESCRIPTORES DE SEVERIDAD
 * genéricos. Para administración real, el sistema deberá presentar
 * los ítems originales bajo licencia adecuada.
 *
 * Los dominios, puntos de corte e interpretación clínica son
 * información publicada en la literatura científica.
 */

import type { InventoryDefinition } from '../types/inventory_types';

export const BDI_II_DEFINITION: InventoryDefinition = {
  id: 'bdi_ii',
  name: 'Inventario de Depresión de Beck',
  acronym: 'BDI-II',
  version: '2.0',
  authors: 'Beck, Steer & Brown',
  year: 1996,
  purpose: 'Evaluar la presencia y gravedad de síntomas depresivos en las últimas dos semanas',
  target_population: 'Adultos y adolescentes (13+)',
  administration_time: '5-10 minutos',
  total_items: 21,
  response_format: 'likert_0_3',

  instructions_patient:
    'Este cuestionario contiene grupos de afirmaciones. Por favor, lea cada grupo con atención y elija la afirmación que mejor describa cómo se ha sentido durante las últimas dos semanas, incluyendo hoy. Si varias afirmaciones de un grupo le parecen igualmente aplicables, elija la de mayor número.',

  instructions_clinician:
    'Administrar al inicio del tratamiento (línea base) y en cada sesión posterior. Revisar SIEMPRE el ítem 9 (ideación suicida) antes de cualquier otra interpretación. Si ítem 9 >= 2, activar protocolo de crisis. Considerar validez si todas las respuestas son 0 (deseabilidad social) o todas máximas (simulación/grito de ayuda). Cruzar siempre con observación clínica en sesión.',

  // ── ÍTEMS ──
  // Cada ítem describe el dominio clínico, NO el texto original.
  // Las opciones son descriptores de severidad genéricos.
  items: [
    {
      id:1,
      domain_descriptor:'tristeza',
      options: [
        { value: 0, label: 'Sin tristeza significativa' },
        { value: 1, label: 'Tristeza frecuente' },
        { value: 2, label: 'Tristeza persistente' },
        { value: 3, label: 'Tristeza o infelicidad insoportable' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:2,
      domain_descriptor:'pesimismo',
      options: [
        { value: 0, label: 'Sin desánimo sobre el futuro' },
        { value: 1, label: 'Más desanimado de lo habitual' },
        { value: 2, label: 'No espera que las cosas mejoren' },
        { value: 3, label: 'El futuro es desesperanzador' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:3,
      domain_descriptor:'fracaso',
      options: [
        { value: 0, label: 'Sin sensación de fracaso' },
        { value: 1, label: 'Ha fracasado más de lo debido' },
        { value: 2, label: 'Ve muchos fracasos al mirar atrás' },
        { value: 3, label: 'Se siente un fracaso total como persona' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:4,
      domain_descriptor:'pérdida_de_placer',
      options: [
        { value: 0, label: 'Disfruta de las cosas como siempre' },
        { value: 1, label: 'No disfruta tanto como antes' },
        { value: 2, label: 'Obtiene poco placer de las cosas' },
        { value: 3, label: 'No obtiene ningún placer' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
      clinical_note: 'Indicador clave de anhedonia. Alta puntuación aquí sugiere priorizar experimentos conductuales de "actuar como si" en AC.',
    },
    {
      id:5,
      domain_descriptor:'sentimientos_de_culpa',
      options: [
        { value: 0, label: 'Sin culpabilidad especial' },
        { value: 1, label: 'Se siente culpable por muchas cosas' },
        { value: 2, label: 'Culpabilidad frecuente' },
        { value: 3, label: 'Culpabilidad constante' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:6,
      domain_descriptor:'sentimiento_de_castigo',
      options: [
        { value: 0, label: 'No se siente castigado' },
        { value: 1, label: 'Siente que puede ser castigado' },
        { value: 2, label: 'Espera ser castigado' },
        { value: 3, label: 'Siente que está siendo castigado' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:7,
      domain_descriptor:'disconformidad_consigo_mismo',
      options: [
        { value: 0, label: 'Siente lo mismo que siempre sobre sí mismo' },
        { value: 1, label: 'Ha perdido confianza en sí mismo' },
        { value: 2, label: 'Está decepcionado consigo mismo' },
        { value: 3, label: 'No se gusta a sí mismo' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:8,
      domain_descriptor:'autocrítica',
      options: [
        { value: 0, label: 'No se critica más que de costumbre' },
        { value: 1, label: 'Más crítico consigo mismo' },
        { value: 2, label: 'Se critica por todos sus errores' },
        { value: 3, label: 'Se culpa por todo lo malo que sucede' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:9,
      domain_descriptor:'pensamientos_suicidas',
      options: [
        { value: 0, label: 'No tiene pensamientos de hacerse daño' },
        { value: 1, label: 'Pensamientos de suicidio, pero no los llevaría a cabo' },
        { value: 2, label: 'Desearía suicidarse' },
        { value: 3, label: 'Se suicidaría si tuviera oportunidad' },
      ],
      scoring_direction: 'direct',
      is_critical: true,
      subscale_ids: ['cognitivo_afectivo'],
      clinical_note: 'ÍTEM CRÍTICO DE SEGURIDAD. Revisar SIEMPRE antes que cualquier otro resultado. Puntuación >= 2 activa protocolo de crisis obligatoriamente.',
    },
    {
      id:10,
      domain_descriptor:'llanto',
      options: [
        { value: 0, label: 'No llora más que antes' },
        { value: 1, label: 'Llora más que antes' },
        { value: 2, label: 'Llora por cualquier cosa' },
        { value: 3, label: 'Quiere llorar pero no puede' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:11,
      domain_descriptor:'agitación',
      options: [
        { value: 0, label: 'No más inquieto que de costumbre' },
        { value: 1, label: 'Más inquieto de lo habitual' },
        { value: 2, label: 'Tan inquieto que le cuesta quedarse quieto' },
        { value: 3, label: 'Necesita moverse o hacer algo constantemente' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
    },
    {
      id:12,
      domain_descriptor:'pérdida_de_interés',
      options: [
        { value: 0, label: 'No ha perdido interés en otras personas o actividades' },
        { value: 1, label: 'Menos interesado en cosas o personas' },
        { value: 2, label: 'Ha perdido la mayor parte del interés' },
        { value: 3, label: 'Difícil interesarse por algo' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
      clinical_note: 'Junto con ítem 4 (placer), indicador principal de anhedonia. Si ambos puntúan alto, la AC debe incluir saboreo consciente y actividades novedosas.',
    },
    {
      id:13,
      domain_descriptor:'indecisión',
      options: [
        { value: 0, label: 'Toma decisiones como siempre' },
        { value: 1, label: 'Le cuesta más tomar decisiones' },
        { value: 2, label: 'Mucha más dificultad para decidir' },
        { value: 3, label: 'Dificultad extrema para tomar decisiones' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:14,
      domain_descriptor:'inutilidad',
      options: [
        { value: 0, label: 'No se siente sin valor' },
        { value: 1, label: 'No se considera tan valioso como antes' },
        { value: 2, label: 'Se siente menos valioso comparado con otros' },
        { value: 3, label: 'Se siente completamente sin valor' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:15,
      domain_descriptor:'pérdida_de_energía',
      options: [
        { value: 0, label: 'Tiene tanta energía como siempre' },
        { value: 1, label: 'Menos energía que antes' },
        { value: 2, label: 'No tiene suficiente energía para hacer mucho' },
        { value: 3, label: 'No tiene energía para hacer nada' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
      clinical_note: 'Ítem neurovegetativo. Alta puntuación aquí + ítems 16,18,19,20,21 altos sugiere componente biológico. Considerar interconsulta psiquiátrica.',
    },
    {
      id:16,
      domain_descriptor:'cambios_sueño',
      options: [
        { value: 0, label: 'Sin cambios en el patrón de sueño' },
        { value: 1, label: 'Duerme algo más o menos de lo habitual' },
        { value: 2, label: 'Duerme mucho más o menos de lo habitual' },
        { value: 3, label: 'Alteración severa del sueño' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
      clinical_note: 'Ítem neurovegetativo. En el BDI-II original tiene dos variantes (16a insomnio, 16b hipersomnia). Registrar dirección del cambio.',
    },
    {
      id:17,
      domain_descriptor:'irritabilidad',
      options: [
        { value: 0, label: 'No más irritable que de costumbre' },
        { value: 1, label: 'Más irritable que de costumbre' },
        { value: 2, label: 'Mucho más irritable de lo habitual' },
        { value: 3, label: 'Irritable todo el tiempo' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['cognitivo_afectivo'],
    },
    {
      id:18,
      domain_descriptor:'cambios_apetito',
      options: [
        { value: 0, label: 'Sin cambios en el apetito' },
        { value: 1, label: 'Apetito algo diferente de lo habitual' },
        { value: 2, label: 'Apetito mucho menor o mayor de lo habitual' },
        { value: 3, label: 'Alteración severa del apetito' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
      clinical_note: 'Ítem neurovegetativo. Como el ítem 16, tiene dos variantes (aumento/disminución). Registrar dirección.',
    },
    {
      id:19,
      domain_descriptor:'dificultad_concentración',
      options: [
        { value: 0, label: 'Puede concentrarse como siempre' },
        { value: 1, label: 'No puede concentrarse tan bien como antes' },
        { value: 2, label: 'Le cuesta mantener la mente en algo' },
        { value: 3, label: 'No puede concentrarse en nada' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
    },
    {
      id:20,
      domain_descriptor:'cansancio_fatiga',
      options: [
        { value: 0, label: 'No más cansado que de costumbre' },
        { value: 1, label: 'Se cansa más fácilmente' },
        { value: 2, label: 'Demasiado cansado para muchas cosas' },
        { value: 3, label: 'Demasiado cansado para hacer cualquier cosa' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
      clinical_note: 'Ítem neurovegetativo. En AC, alta fatiga no es contraindicación sino señal de empezar con microtareas de muy baja exigencia.',
    },
    {
      id:21,
      domain_descriptor:'pérdida_interés_sexual',
      options: [
        { value: 0, label: 'Sin cambio en el interés sexual' },
        { value: 1, label: 'Menos interesado que antes' },
        { value: 2, label: 'Mucho menos interesado' },
        { value: 3, label: 'Ha perdido completamente el interés' },
      ],
      scoring_direction: 'direct',
      is_critical: false,
      subscale_ids: ['somatico_rendimiento'],
    },
  ],

  // ── SUBESCALAS ──
  subscales: [
    {
      id: 'cognitivo_afectivo',
      name: 'Cognitivo-Afectivo',
      item_numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 17],
      scoring_direction: 'direct',
      range_min: 0,
      range_max: 39,
      clinical_meaning: 'Componentes cognitivos y emocionales de la depresión: tristeza, pesimismo, culpa, autocrítica, pérdida de placer, ideación suicida. Altas puntuaciones sugieren que RC puede complementar la AC.',
    },
    {
      id: 'somatico_rendimiento',
      name: 'Somático-Rendimiento',
      item_numbers: [11, 12, 15, 16, 18, 19, 20, 21],
      scoring_direction: 'direct',
      range_min: 0,
      range_max: 24,
      clinical_meaning: 'Componentes somáticos y de rendimiento: fatiga, sueño, apetito, concentración, agitación. Altas puntuaciones sugieren componente biológico. Considerar interconsulta psiquiátrica si predomina sobre cognitivo-afectivo.',
    },
  ],

  // ── PUNTUACIÓN TOTAL ──
  score_range: { min: 0, max: 63 },
  severity_levels: [
    {
      label: 'Depresión mínima',
      range_min: 0,
      range_max: 13,
      color_code: 'green',
      clinical_implication: 'Sintomatología depresiva dentro de rango normativo. El paciente puede estar en fase de mantenimiento o no presentar depresión clínica.',
      action_suggested: 'Si es línea base: reevaluar necesidad de AC. Si es post-tratamiento: consolidar prevención de recaídas.',
    },
    {
      label: 'Depresión leve',
      range_min: 14,
      range_max: 19,
      color_code: 'yellow',
      clinical_implication: 'Síntomas depresivos presentes pero con impacto funcional limitado. Puede beneficiarse de intervención preventiva.',
      action_suggested: 'AC con programación suave. Priorizar psicoeducación y establecimiento de rutinas. Monitorizar evolución.',
    },
    {
      label: 'Depresión moderada',
      range_min: 20,
      range_max: 28,
      color_code: 'orange',
      clinical_implication: 'Sintomatología depresiva significativa con impacto funcional claro. Indicación clara de intervención.',
      action_suggested: 'AC con protocolo completo. Programación graduada de actividades, análisis funcional, trabajo con valores. Evaluar necesidad de medicación coadyuvante.',
    },
    {
      label: 'Depresión grave',
      range_min: 29,
      range_max: 63,
      color_code: 'red',
      clinical_implication: 'Sintomatología depresiva severa con alto impacto funcional. Riesgo elevado de complicaciones.',
      action_suggested: 'AC intensiva con microtareas. Evaluar riesgo suicida. Considerar interconsulta psiquiátrica para medicación. Aumentar frecuencia de sesiones. Activar red de apoyo.',
    },
  ],

  // ── ÍTEMS CRÍTICOS ──
  critical_items: [
    {
      item_number: 9,
      domain: 'suicidio',
      domain_descriptor: 'suicidio',
      threshold: 1,
      alert_level: 'warning',
      protocol_action: 'Explorar en sesión. Evaluar plan, acceso a medios, intentos previos.',
      protocol_ref: 'protocolo_crisis',
    },
    {
      item_number: 9,
      domain: 'suicidio',
      domain_descriptor: 'suicidio',
      threshold: 2,
      alert_level: 'urgent',
      protocol_action: 'ACTIVAR PROTOCOLO DE CRISIS. Evaluación de riesgo inmediata. Plan de seguridad obligatorio.',
      protocol_ref: 'protocolo_crisis',
    },
    {
      item_number: 9,
      domain: 'suicidio',
      domain_descriptor: 'suicidio',
      threshold: 3,
      alert_level: 'emergency',
      protocol_action: 'EMERGENCIA. No dejar solo al paciente. Derivación inmediata a urgencias si riesgo inminente.',
      protocol_ref: 'protocolo_crisis',
    },
  ],

  // ── VALIDEZ ──
  validity_criteria: [
    {
      id: 'val_deseabilidad',
      name: 'Deseabilidad social',
      detection_rule: 'Todas las respuestas son 0 y la observación clínica contradice (ej: paciente llora en sesión pero niega síntomas)',
      threshold_description: 'Puntuación total = 0 con indicadores clínicos de depresión',
      action_if_detected: 'Explorar barreras a la honestidad. Reforzar confidencialidad. Considerar readministración tras fortalecer alianza.',
    },
    {
      id: 'val_simulacion',
      name: 'Posible simulación o grito de ayuda',
      detection_rule: 'Todas o casi todas las respuestas en valor máximo (3), especialmente si no coincide con presentación clínica',
      threshold_description: 'Puntuación >= 55 (más del 85% del máximo posible)',
      action_if_detected: 'No descartar automáticamente. Explorar motivación. Puede ser grito de ayuda legítimo. Siempre tomar en serio ítem 9.',
    },
    {
      id: 'val_inconsistencia',
      name: 'Inconsistencia interna',
      detection_rule: 'Contradicciones entre ítems relacionados (ej: ítem 4=0 "disfruta como siempre" pero ítem 12=3 "no se interesa por nada")',
      threshold_description: 'Diferencia >= 3 entre ítems del mismo dominio',
      action_if_detected: 'Revisar ítems específicos con el paciente. Puede indicar comprensión deficiente, ambivalencia o fluctuación rápida.',
    },
    {
      id: 'val_aquiescencia',
      name: 'Aquiescencia (tendencia a asentir)',
      detection_rule: 'Patrón uniforme de respuestas (ej: todos los ítems puntuados exactamente 2)',
      threshold_description: 'Desviación estándar de respuestas < 0.5',
      action_if_detected: 'Posible respuesta mecánica sin reflexión. Readministrar con más tiempo y explicación. Verificar comprensión lectora.',
    },
  ],

  // ── CAMBIO CLÍNICO ──
  clinical_change: {
    method: 'jacobson_truax',
    description: 'Para el BDI-II, un cambio clínicamente significativo implica: (1) que la diferencia supere el índice de cambio fiable (RCI), Y (2) que el paciente pase de la distribución clínica a la normativa.',
    reliable_change_index: 8.46,
    clinical_cutoff: 14,
    minimal_important_difference: 5,
  },

  // ── CONTEXTO DE USO ──
  recommended_frequency: 'Semanal durante tratamiento activo; mensual en mantenimiento',
  recommended_sessions: 'Todas las sesiones durante tratamiento activo (10-12 sesiones en AC)',
  complementary_instruments: ['bads', 'phq_9'],
  technique_relevance: {
    ac: 'Gold standard para monitoreo semanal en AC. Los ítems 4, 12 y 15 son indicadores directos del déficit de activación. El ítem 9 guía la seguridad.',
    rc: 'Los ítems 2, 3, 5, 7, 8, 14 reflejan distorsiones cognitivas abordables con reestructuración.',
    exposicion: 'El ítem 11 (agitación) puede indicar ansiedad comórbida que requiere exposición.',
  },

  // ── METADATOS ──
  sources: [
    'Beck, A.T., Steer, R.A. & Brown, G.K. (1996). Manual for the Beck Depression Inventory-II. San Antonio, TX: Psychological Corporation.',
    'Sanz, J., Perdigón, A.L. & Vázquez, C. (2003). Adaptación española del Inventario para la Depresión de Beck-II (BDI-II). Clínica y Salud, 14(3), 249-280.',
  ],
  copyright_note: 'El BDI-II es propiedad de Pearson Clinical. Los ítems aquí descritos son descriptores de dominio clínico, no el texto original del instrumento. Para uso clínico real se requiere licencia.',
};
