/**
 * bads.definition.ts — Definición estática del BADS
 *
 * Behavioral Activation for Depression Scale (BADS)
 * Kanter, J.W., Mulick, P.S., Busch, A.M., Berlin, K.S. & Martell, C.R. (2007)
 *
 * Adaptación española:
 * Barraca, J., Pérez-Álvarez, M. & Lozano-Bleda, J.H. (2011).
 * Rumiación, estilos de respuesta y activación conductual.
 * Ansiedad y Estrés, 17(1), 1–13.
 *
 * IMPORTANTE — Copyright y uso clínico:
 * Los ítems son DESCRIPTORES DE DOMINIO clínico derivados del constructo que
 * mide cada ítem. No reproducen el texto literal del BADS publicado. El BADS
 * original es de libre acceso (Kanter et al., 2007), pero la adaptación española
 * de Barraca et al. (2011) está sujeta a condiciones de uso académico.
 * Este archivo es para uso experimental en investigación de arquitectura.
 *
 * Estructura de scoring:
 * - 25 ítems, escala Likert 0-6 (0 = nada, 6 = completamente)
 * - 4 subescalas con ítems específicos
 * - Subescalas I (Activación) puntuación directa
 * - Subescalas II, III y IV puntuación INVERSA (6 - valor)
 * - Puntuación total: suma de subescalas ya invertidas
 * - A mayor puntuación total → mayor activación conductual (mejor)
 *
 * Uso en AC:
 * Administrar en sesiones 1, 5 y 10 para tracking de progreso.
 * Complementa al BDI-II: BDI-II mide síntomas depresivos,
 * BADS mide el mecanismo de cambio (activación vs. evitación).
 */

import type { InventoryDefinition } from '../types/inventory_types';

export const BADS_DEFINITION: InventoryDefinition = {
  id: 'bads',
  name: 'Escala de Activación Conductual para la Depresión',
  acronym: 'BADS',
  version: '1.0',
  purpose:
    'Medir los niveles de activación conductual y evitación específicamente relacionados ' +
    'con la depresión. A diferencia del BDI-II (que mide síntomas), el BADS mide el ' +
    'mecanismo de cambio de la AC: a mayor activación y menor evitación, mejor pronóstico.',
  target_population: 'Adultos con depresión o síntomas depresivos relevantes clínicamente',
  administration_time: '5-10 minutos',
  trace_sources: [
    'Kanter, J.W., Mulick, P.S., Busch, A.M., Berlin, K.S. & Martell, C.R. (2007). ' +
      'The Behavioral Activation for Depression Scale (BADS): Psychometric properties and factor structure. ' +
      'Journal of Psychopathology and Behavioral Assessment, 29(3), 191–202.',
    'Barraca, J., Pérez-Álvarez, M. & Lozano-Bleda, J.H. (2011). ' +
      'Rumiación, estilos de respuesta y activación conductual. ' +
      'Ansiedad y Estrés, 17(1), 1–13.',
    'Barraca, J. & Pérez-Álvarez, M. (2015). ' +
      'Activación Conductual para el tratamiento de la depresión. Síntesis.',
  ],
  copyright_note:
    'Los ítems son descriptores de dominio clínico derivados del constructo evaluado, ' +
    'no el texto literal del BADS. El instrumento original (Kanter et al., 2007) es de ' +
    'libre acceso. La adaptación española (Barraca et al., 2011) requiere autorización ' +
    'para uso clínico formal. Uso exclusivo en contexto experimental de investigación.',
  score_range: { min: 0, max: 150 },

  // ──────────────────────────────────────────────────────────────────────────
  // 25 ítems — escala Likert 0-6 en todos
  // Subescala I (Activación): ítems 1, 2, 10, 11 — puntuación directa
  // Subescala II (Evitación/Rumiación): ítems 3, 8, 9, 12, 13, 15, 16, 17 — inversa
  // Subescala III (Deterioro trabajo/estudios): ítems 4, 5, 14, 18 — inversa
  // Subescala IV (Deterioro social): ítems 6, 7, 19, 20, 21, 22, 23, 24, 25 — inversa
  // ──────────────────────────────────────────────────────────────────────────
  items: [
    // ── Subescala I: Activación (ítems 1, 2, 10, 11) ─────────────────────
    {
      id: 1,
      domain_descriptor: 'Realización de actividades habituales en el hogar',
      subscale: 'activacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 2,
      domain_descriptor: 'Participación en actividades de ocio y aficiones',
      subscale: 'activacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    // ── Subescala II: Evitación/Rumiación (ítems 3, 8, 9, 12, 13, 15, 16, 17) ──
    {
      id: 3,
      domain_descriptor: 'Quedarse en casa evitando actividades sociales o externas',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    // ── Subescala III: Deterioro trabajo/estudios (ítems 4, 5, 14, 18) ────
    {
      id: 4,
      domain_descriptor: 'Dificultad para completar tareas laborales o académicas',
      subscale: 'deterioro_trabajo',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 5,
      domain_descriptor: 'Reducción del rendimiento o productividad en el trabajo o estudios',
      subscale: 'deterioro_trabajo',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    // ── Subescala IV: Deterioro social (ítems 6, 7, 19-25) ───────────────
    {
      id: 6,
      domain_descriptor: 'Evitación de actividades sociales o de pareja',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 7,
      domain_descriptor: 'Aislamiento de amigos o familiares',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 8,
      domain_descriptor: 'Permanecer en cama o en el sofá más de lo necesario',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 9,
      domain_descriptor: 'Dedicar tiempo a rumiar o preocuparse sin actuar',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 10,
      domain_descriptor: 'Realización de actividades físicas o deportivas',
      subscale: 'activacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 11,
      domain_descriptor: 'Implicación en actividades con sentido o significado personal',
      subscale: 'activacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 12,
      domain_descriptor: 'Evitar situaciones que generan ansiedad o malestar',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 13,
      domain_descriptor: 'Pensamientos repetitivos sobre el pasado o el futuro sin acción',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 14,
      domain_descriptor: 'Ausencias, retrasos o incumplimientos laborales/académicos por estado de ánimo',
      subscale: 'deterioro_trabajo',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 15,
      domain_descriptor: 'Procrastinación de actividades importantes por falta de energía o motivación',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 16,
      domain_descriptor: 'Actividades de distracción para evitar pensamientos o sentimientos difíciles',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 17,
      domain_descriptor: 'Consumo de sustancias o conductas de escape para no sentir malestar',
      subscale: 'evitacion_rumiacion',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 18,
      domain_descriptor: 'Incapacidad para cumplir con responsabilidades básicas cotidianas',
      subscale: 'deterioro_trabajo',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 19,
      domain_descriptor: 'Rechazo a invitaciones sociales por falta de interés o energía',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 20,
      domain_descriptor: 'Deterioro de relaciones interpersonales cercanas por el estado de ánimo',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 21,
      domain_descriptor: 'Dificultad para iniciar o mantener conversaciones sociales',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 22,
      domain_descriptor: 'Reducción significativa de actividades de ocio compartidas',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 23,
      domain_descriptor: 'Sentimiento de carga para los demás o inhibición para pedir ayuda',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 24,
      domain_descriptor: 'Pérdida de interés en actividades sociales anteriormente disfrutadas',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
    {
      id: 25,
      domain_descriptor: 'Irritabilidad o conflictos interpersonales frecuentes',
      subscale: 'deterioro_social',
      options: [
        { value: 0, label: 'Nada en absoluto' },
        { value: 1, label: 'Muy poco' },
        { value: 2, label: 'Algo' },
        { value: 3, label: 'Moderadamente' },
        { value: 4, label: 'Bastante' },
        { value: 5, label: 'Mucho' },
        { value: 6, label: 'Completamente' },
      ],
      is_critical: false,
    },
  ],

  // ──────────────────────────────────────────────────────────────────────────
  // Puntos de corte totales
  // Nota: A mayor puntuación → mayor activación conductual (mejor pronóstico)
  // Puntos de corte basados en Kanter et al. (2007) y Barraca et al. (2011)
  // ──────────────────────────────────────────────────────────────────────────
  severity_levels: [
    {
      range_min: 0,
      range_max: 37,
      label: 'Activación muy baja',
      clinical_implication:
        'Nivel de activación críticamente bajo. Alta evitación y deterioro funcional. ' +
        'Iniciar AC con actividades de mínima dificultad. ' +
        'Priorizar estabilización antes de programación graduada.',
    },
    {
      range_min: 38,
      range_max: 75,
      label: 'Activación baja',
      clinical_implication:
        'Activación por debajo del rango funcional. Patrón de evitación activo. ' +
        'Implementar programación graduada de actividades. ' +
        'Revisar subescalas para identificar el área de mayor bloqueo.',
    },
    {
      range_min: 76,
      range_max: 112,
      label: 'Activación moderada',
      clinical_implication:
        'Activación en rango moderado. El paciente mantiene algunas conductas de aproximación. ' +
        'Consolidar y ampliar las áreas de activación existentes. ' +
        'Trabajar barreras en las subescalas con puntuación más baja.',
    },
    {
      range_min: 113,
      range_max: 150,
      label: 'Activación alta',
      clinical_implication:
        'Buen nivel de activación conductual. ' +
        'Evaluar si los niveles se mantienen o son episódicos. ' +
        'Fase de consolidación y prevención de recaídas.',
    },
  ],

  // ──────────────────────────────────────────────────────────────────────────
  // Subescalas
  // Subescala I (Activación): puntuación directa — ítems 1, 2, 10, 11
  //   Rango: 0-24 | Alta puntuación = mayor activación (bueno)
  // Subescala II (Evitación/Rumiación): puntuación inversa — ítems 3, 8, 9, 12, 13, 15, 16, 17
  //   Rango: 0-48 | Puntuación invertida: alta = menos evitación (bueno)
  // Subescala III (Deterioro trabajo): puntuación inversa — ítems 4, 5, 14, 18
  //   Rango: 0-24 | Puntuación invertida: alta = menos deterioro (bueno)
  // Subescala IV (Deterioro social): puntuación inversa — ítems 6, 7, 19-25
  //   Rango: 0-54 | Puntuación invertida: alta = menos deterioro social (bueno)
  // ──────────────────────────────────────────────────────────────────────────
  subscales: [
    {
      id: 'activacion',
      name: 'Activación',
      item_numbers: [1, 2, 10, 11],
      cutoffs: [
        { min: 0, max: 6, label: 'Muy baja', clinical_note: 'Muy poca conducta de aproximación. Prioridad máxima en AC.' },
        { min: 7, max: 12, label: 'Baja', clinical_note: 'Activación reducida. Identificar actividades con mayor valor reforzador.' },
        { min: 13, max: 18, label: 'Moderada', clinical_note: 'Activación parcial. Consolidar y ampliar.' },
        { min: 19, max: 24, label: 'Alta', clinical_note: 'Buen nivel de conductas de aproximación.' },
      ],
    },
    {
      id: 'evitacion_rumiacion',
      name: 'Evitación y Rumiación',
      item_numbers: [3, 8, 9, 12, 13, 15, 16, 17],
      cutoffs: [
        { min: 0, max: 12, label: 'Muy alta evitación', clinical_note: 'Patrón de evitación y rumiación severo. Identificar ciclos de evitación.' },
        { min: 13, max: 24, label: 'Evitación alta', clinical_note: 'Evitación significativa. Trabajar activación anti-evitación.' },
        { min: 25, max: 36, label: 'Evitación moderada', clinical_note: 'Evitación presente pero manejable. Reforzar conductas de aproximación.' },
        { min: 37, max: 48, label: 'Evitación baja', clinical_note: 'Poca evitación. Mantener y prevenir recaídas.' },
      ],
    },
    {
      id: 'deterioro_trabajo',
      name: 'Deterioro en el Trabajo o los Estudios',
      item_numbers: [4, 5, 14, 18],
      cutoffs: [
        { min: 0, max: 6, label: 'Deterioro grave', clinical_note: 'Funcionamiento laboral/académico muy comprometido.' },
        { min: 7, max: 12, label: 'Deterioro moderado', clinical_note: 'Impacto significativo en rendimiento laboral o académico.' },
        { min: 13, max: 18, label: 'Deterioro leve', clinical_note: 'Funcionamiento parcialmente preservado.' },
        { min: 19, max: 24, label: 'Sin deterioro', clinical_note: 'Área laboral/académica mantenida.' },
      ],
    },
    {
      id: 'deterioro_social',
      name: 'Deterioro en las Relaciones Sociales',
      item_numbers: [6, 7, 19, 20, 21, 22, 23, 24, 25],
      cutoffs: [
        { min: 0, max: 14, label: 'Deterioro grave', clinical_note: 'Aislamiento social marcado. Incluir actividades sociales graduadas como objetivo prioritario.' },
        { min: 15, max: 27, label: 'Deterioro moderado', clinical_note: 'Reducción importante de contacto social.' },
        { min: 28, max: 40, label: 'Deterioro leve', clinical_note: 'Relaciones sociales parcialmente mantenidas.' },
        { min: 41, max: 54, label: 'Sin deterioro', clinical_note: 'Funcionamiento social preservado.' },
      ],
    },
  ],

  // El BADS no tiene ítems de ideación suicida — sin ítems críticos
  critical_items: [],

  // ── CAMBIO CLÍNICO ──
  // No hay parámetros Jacobson-Truax publicados para el BADS.
  // Se usa MID (Minimal Important Difference) basado en benchmarks de Kanter (2009)
  // y la estructura de cutoffs por subescala.
  // MID total ≈ 15 puntos (10% del rango 0-150, equivalente a un nivel de cutoff).
  clinical_change: {
    method: 'MID (Minimal Important Difference)',
    description:
      'Cambio mínimo clínicamente relevante basado en benchmarks de Kanter et al. (2009). ' +
      'Sin parámetros Jacobson-Truax publicados. El MID total de 15 puntos corresponde ' +
      'aproximadamente a un cambio de nivel en la clasificación de activación.',
    minimal_important_difference: 15,
  },
};
