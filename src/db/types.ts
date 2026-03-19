/**
 * Tipos compartidos de la base de datos clínica de tcc-lab
 *
 * Principios de diseño:
 * - SUDs 0-100: escala clínica estándar (Subjective Units of Distress)
 * - Inmutabilidad: los registros clínicos no se editan, se agregan enmiendas
 * - La sesión es la unidad central: todo registro tiene sessionId
 * - Patrones = queries sobre registros, no tablas separadas
 */

// ============================================================================
// ESCALA SUDS
// ============================================================================

/**
 * Subjective Units of Distress Scale — 0 a 100
 * Estándar clínico para medir intensidad de malestar subjetivo.
 * 0 = ningún malestar, 100 = el peor malestar imaginable.
 * Equivalencia orientativa: 0-20 leve, 21-50 moderado, 51-80 alto, 81-100 severo.
 */
export type SUDs = number; // 0-100, siempre entero

/**
 * Convierte un valor 0–10 de UI a la escala SUDs estándar 0–100.
 * Uso: al capturar del slider → antes de almacenar.
 */
export function sudsFromUI(value010: number): SUDs {
  return Math.round(Math.min(100, Math.max(0, value010 * 10)));
}

/**
 * Convierte un valor SUDs 0–100 a la escala 0–10 para mostrar en UI.
 * Uso: al leer de store/DB → antes de mostrar en slider.
 */
export function sudsToUI(suds: SUDs): number {
  return Math.round(Math.min(10, Math.max(0, suds / 10)));
}

// ============================================================================
// FASES DEL PROTOCOLO TCC
// ============================================================================

/**
 * Las 7 fases del protocolo TCC estructurado,
 * adaptadas del flujo real terapeuta-paciente.
 */
export type ProtocolPhase =
  | 'intake'           // Fase 1: Motivo de consulta y síntomas
  | 'abc_assessment'   // Fase 2: Evaluación ABC (antecedente-conducta-consecuencia)
  | 'psychoeducation'  // Fase 3: Psicoeducación sobre el modelo cognitivo
  | 'smart_goals'      // Fase 4: Objetivos SMART y medibles
  | 'intervention'     // Fase 5: Práctica de técnicas TCC
  | 'change_eval'      // Fase 6: Evaluación de cambio vs baseline
  | 'followup';        // Fase 7: Seguimiento y prevención de recaídas

// ============================================================================
// EMOCIONES CLÍNICAS
// ============================================================================

/**
 * Emociones clínicamente relevantes.
 * Basado en los constructos emocionales del DSM-5 y las taxonomías de Beck.
 * Se usan como categorías primarias — el usuario siempre especifica también
 * la intensidad en SUDs.
 */
export type ClinicalEmotion =
  | 'anxiety'       // Ansiedad, nerviosismo, tensión
  | 'sadness'       // Tristeza, abatimiento, pena
  | 'anger'         // Rabia, ira, irritabilidad
  | 'guilt'         // Culpa, arrepentimiento
  | 'shame'         // Vergüenza, humillación
  | 'fear'          // Miedo concreto a algo
  | 'disgust'       // Asco, repulsión
  | 'hopelessness'  // Desesperanza, sin salida
  | 'frustration'   // Frustración, impotencia
  | 'loneliness'    // Soledad, aislamiento
  | 'emptiness'     // Vacío, anhedonia
  | 'overwhelm';    // Agobio, saturación, desbordamiento

// Etiquetas en español para mostrar en UI
export const EMOTION_LABELS: Record<ClinicalEmotion, string> = {
  anxiety:     'Ansiedad',
  sadness:     'Tristeza',
  anger:       'Rabia',
  guilt:       'Culpa',
  shame:       'Vergüenza',
  fear:        'Miedo',
  disgust:     'Asco',
  hopelessness:'Desesperanza',
  frustration: 'Frustración',
  loneliness:  'Soledad',
  emptiness:   'Vacío',
  overwhelm:   'Agobio',
};

// ============================================================================
// DISTORSIONES COGNITIVAS
// ============================================================================

/**
 * Las 12 distorsiones cognitivas de Beck y Burns.
 * Son los patrones de pensamiento automático disfuncionales.
 * Esta lista es la fuente de verdad — no se calculan en tabla aparte,
 * se extraen con queries sobre AutomaticThoughtRecord.
 */
export type CognitiveDistortion =
  | 'all_or_nothing'           // Todo o nada: blanco o negro
  | 'catastrophizing'          // Catastrofización: imaginar el peor escenario
  | 'mind_reading'             // Lectura de mente: asumir lo que piensan otros
  | 'fortune_telling'          // Predicción negativa: "sé que saldrá mal"
  | 'emotional_reasoning'      // Razonamiento emocional: "me siento mal, ergo algo es malo"
  | 'should_statements'        // Reglas rígidas: "debería", "tengo que"
  | 'labeling'                 // Etiquetado: "soy un fracasado"
  | 'personalization'          // Personalización: "es culpa mía"
  | 'mental_filter'            // Filtro mental: enfocarse solo en lo negativo
  | 'disqualifying_positive'   // Descalificar lo positivo: "fue suerte"
  | 'overgeneralization'       // Sobregeneralización: "siempre/nunca"
  | 'magnification';           // Magnificación: exagerar errores, minimizar logros

// Etiquetas y descripciones para UI
export const DISTORTION_INFO: Record<CognitiveDistortion, { label: string; description: string; example: string }> = {
  all_or_nothing: {
    label: 'Todo o nada',
    description: 'Ves las situaciones en blanco o negro, sin matices',
    example: '"Si no lo hago perfecto, soy un fracaso total"',
  },
  catastrophizing: {
    label: 'Catastrofización',
    description: 'Imaginas el peor escenario posible',
    example: '"Si me equivoco en la presentación, me despedirán"',
  },
  mind_reading: {
    label: 'Lectura de mente',
    description: 'Asumes que sabes lo que otros están pensando',
    example: '"Están pensando que soy incompetente"',
  },
  fortune_telling: {
    label: 'Predicción negativa',
    description: 'Predices que algo saldrá mal sin evidencia suficiente',
    example: '"Sé que no voy a poder con esto"',
  },
  emotional_reasoning: {
    label: 'Razonamiento emocional',
    description: 'Usas cómo te sientes como evidencia de cómo son las cosas',
    example: '"Me siento estúpido, por tanto soy estúpido"',
  },
  should_statements: {
    label: 'Reglas rígidas',
    description: 'Te impones reglas absolutas sobre cómo deberías ser o actuar',
    example: '"Debería poder con esto solo", "No debería sentirme así"',
  },
  labeling: {
    label: 'Etiquetado',
    description: 'Te defines a ti mismo o a otros por un error o rasgo',
    example: '"Soy un ansioso", "Soy un perdedor"',
  },
  personalization: {
    label: 'Personalización',
    description: 'Te atribuyes la responsabilidad de cosas que no dependen solo de ti',
    example: '"Si mi equipo falló es porque yo no lo hice bien"',
  },
  mental_filter: {
    label: 'Filtro mental',
    description: 'Te centras exclusivamente en los aspectos negativos',
    example: '"Recibí 9 comentarios positivos y uno negativo. Solo puedo pensar en el negativo"',
  },
  disqualifying_positive: {
    label: 'Descalificar lo positivo',
    description: 'Rechazas las experiencias positivas diciéndote que no cuentan',
    example: '"Lo hice bien pero fue suerte, no vale"',
  },
  overgeneralization: {
    label: 'Sobregeneralización',
    description: 'Sacas conclusiones generales de un solo evento',
    example: '"Siempre me pasa esto", "Nunca lo consigo"',
  },
  magnification: {
    label: 'Magnificación',
    description: 'Exageras los errores y minimizas los logros',
    example: '"Ese fallo fue horrible (fallo pequeño) / Eso fue nada (logro grande)"',
  },
};

// ============================================================================
// TÉCNICAS TCC
// ============================================================================

/**
 * Técnicas TCC disponibles en el sistema.
 * Cada técnica es un string literal para usarse como índice en Dexie
 * y como clave en objetos de efectividad.
 */
export type TCCTechnique =
  | 'cognitive_restructuring'        // Reestructuración cognitiva
  | 'behavioral_experiment'          // Experimento conductual
  | 'gradual_exposure'               // Exposición gradual
  | 'activity_scheduling'            // Programación de actividades
  | 'behavioral_activation'          // Activación conductual
  | 'problem_solving'                // Resolución de problemas
  | 'relaxation_breathing'           // Respiración diafragmática
  | 'relaxation_progressive_muscle'  // Relajación muscular progresiva
  | 'mindfulness_observation'        // Observación mindful (defusión)
  | 'mindful_breathing'              // Respiración consciente (Mindfulness)
  | 'body_scan'                      // Escaneo corporal (Mindfulness)
  | 'urge_surfing'                   // Surfear urgencias (Mindfulness)
  | 'present_moment_anchor'          // Anclaje al presente (Mindfulness)
  | 'self_compassion'                // Autocompasión
  | 'chain_analysis'                 // Análisis en cadena (DBT)
  | 'distress_tolerance_tipp'        // TIPP (DBT)
  | 'emotion_regulation_opposite_action' // Acción opuesta (DBT)
  | 'interpersonal_effectiveness_dear_man' // DEAR MAN (DBT)
  | 'cognitive_defusion'             // Defusión cognitiva (ACT)
  | 'acceptance_willingness'         // Aceptación y disposición (ACT)
  | 'values_clarification'           // Clarificación de valores (ACT)
  | 'committed_action'               // Acción comprometida (ACT)
  | 'self_as_context'                // Yo como contexto (ACT)
  | 'socratic_questioning'           // Cuestionamiento socrático
  | 'thought_record_abc'             // Registro de pensamientos ABC
  | 'worry_time'                     // Tiempo de preocupación
  | 'response_prevention';           // Prevención de respuesta

export const TECHNIQUE_INFO: Record<TCCTechnique, {
  label: string;
  description: string;
  bestFor: ClinicalEmotion[];
  estimatedMinutes: number;
  evidenceLevel: 'strong' | 'moderate' | 'emerging';
}> = {
  cognitive_restructuring: {
    label: 'Cuestionar el pensamiento',
    description: 'Examinar el pensamiento automático para ver si es tan cierto y absoluto como parece',
    bestFor: ['anxiety', 'sadness', 'guilt', 'shame'],
    estimatedMinutes: 20,
    evidenceLevel: 'strong',
  },
  behavioral_experiment: {
    label: 'Experimento conductual',
    description: 'Poner a prueba una creencia con una acción real y observar el resultado',
    bestFor: ['anxiety', 'fear', 'hopelessness'],
    estimatedMinutes: 30,
    evidenceLevel: 'strong',
  },
  gradual_exposure: {
    label: 'Exposición gradual',
    description: 'Enfrentarse poco a poco a lo que se evita, empezando por lo más fácil',
    bestFor: ['anxiety', 'fear'],
    estimatedMinutes: 25,
    evidenceLevel: 'strong',
  },
  activity_scheduling: {
    label: 'Programación de actividades',
    description: 'Planificar actividades significativas para estructurar el día',
    bestFor: ['sadness', 'emptiness', 'overwhelm'],
    estimatedMinutes: 15,
    evidenceLevel: 'strong',
  },
  behavioral_activation: {
    label: 'Activación conductual',
    description: 'Actuar antes de esperar motivación; la acción genera el estado emocional',
    bestFor: ['sadness', 'emptiness', 'hopelessness'],
    estimatedMinutes: 10,
    evidenceLevel: 'strong',
  },
  problem_solving: {
    label: 'Resolución de problemas',
    description: 'Abordar el problema real paso a paso con un método estructurado',
    bestFor: ['overwhelm', 'anxiety', 'frustration'],
    estimatedMinutes: 25,
    evidenceLevel: 'strong',
  },
  relaxation_breathing: {
    label: 'Respiración diafragmática',
    description: 'Activar el sistema nervioso parasimpático mediante respiración controlada',
    bestFor: ['anxiety', 'overwhelm', 'anger'],
    estimatedMinutes: 10,
    evidenceLevel: 'strong',
  },
  relaxation_progressive_muscle: {
    label: 'Relajación muscular progresiva',
    description: 'Tensar y liberar grupos musculares para reducir tensión física',
    bestFor: ['anxiety', 'overwhelm'],
    estimatedMinutes: 20,
    evidenceLevel: 'strong',
  },
  mindfulness_observation: {
    label: 'Observación sin juicio',
    description: 'Observar pensamientos y sensaciones sin fusionarse con ellos',
    bestFor: ['anxiety', 'overwhelm', 'sadness'],
    estimatedMinutes: 15,
    evidenceLevel: 'moderate',
  },
  mindful_breathing: {
    label: 'Respiración consciente',
    description: 'Usar la respiración como ancla atencional para regular activación',
    bestFor: ['anxiety', 'overwhelm', 'anger'],
    estimatedMinutes: 8,
    evidenceLevel: 'moderate',
  },
  body_scan: {
    label: 'Body scan',
    description: 'Recorrer el cuerpo con atención para detectar y liberar tensión',
    bestFor: ['anxiety', 'overwhelm', 'emptiness'],
    estimatedMinutes: 15,
    evidenceLevel: 'moderate',
  },
  urge_surfing: {
    label: 'Urge surfing',
    description: 'Observar el impulso sin actuar automáticamente hasta que descienda',
    bestFor: ['anxiety', 'anger', 'overwhelm'],
    estimatedMinutes: 10,
    evidenceLevel: 'moderate',
  },
  present_moment_anchor: {
    label: 'Anclaje al presente',
    description: 'Reorientar atención al aquí y ahora para cortar rumiación',
    bestFor: ['anxiety', 'overwhelm', 'sadness'],
    estimatedMinutes: 6,
    evidenceLevel: 'moderate',
  },
  self_compassion: {
    label: 'Autocompasión',
    description: 'Tratarse con la misma amabilidad que a un amigo que sufre',
    bestFor: ['guilt', 'shame', 'sadness'],
    estimatedMinutes: 20,
    evidenceLevel: 'moderate',
  },
  chain_analysis: {
    label: 'Análisis en cadena (DBT)',
    description: 'Descomponer la secuencia que llevó a la conducta problema para intervenir puntos críticos',
    bestFor: ['overwhelm', 'anger', 'guilt'],
    estimatedMinutes: 25,
    evidenceLevel: 'moderate',
  },
  distress_tolerance_tipp: {
    label: 'Tolerancia al malestar (TIPP)',
    description: 'Aplicar estrategias fisiológicas breves para bajar urgencia emocional intensa',
    bestFor: ['anxiety', 'anger', 'overwhelm'],
    estimatedMinutes: 10,
    evidenceLevel: 'moderate',
  },
  emotion_regulation_opposite_action: {
    label: 'Regulación emocional (acción opuesta)',
    description: 'Elegir una acción opuesta y funcional frente al impulso emocional desadaptativo',
    bestFor: ['anger', 'fear', 'shame'],
    estimatedMinutes: 15,
    evidenceLevel: 'moderate',
  },
  interpersonal_effectiveness_dear_man: {
    label: 'Efectividad interpersonal (DEAR MAN)',
    description: 'Pedir, negociar y establecer límites de forma clara y asertiva',
    bestFor: ['anger', 'guilt', 'shame'],
    estimatedMinutes: 20,
    evidenceLevel: 'moderate',
  },
  cognitive_defusion: {
    label: 'Defusión cognitiva (ACT)',
    description: 'Relacionarte con pensamientos como eventos mentales, no como hechos literales',
    bestFor: ['anxiety', 'overwhelm', 'shame'],
    estimatedMinutes: 12,
    evidenceLevel: 'moderate',
  },
  acceptance_willingness: {
    label: 'Aceptación y disposición (ACT)',
    description: 'Abrir espacio al malestar para actuar según valores en vez de evitar',
    bestFor: ['anxiety', 'overwhelm', 'hopelessness'],
    estimatedMinutes: 15,
    evidenceLevel: 'moderate',
  },
  values_clarification: {
    label: 'Clarificación de valores (ACT)',
    description: 'Definir direcciones vitales que orienten decisiones y acciones',
    bestFor: ['emptiness', 'hopelessness', 'sadness'],
    estimatedMinutes: 20,
    evidenceLevel: 'moderate',
  },
  committed_action: {
    label: 'Acción comprometida (ACT)',
    description: 'Traducir valores en acciones graduales y sostenibles',
    bestFor: ['sadness', 'hopelessness', 'overwhelm'],
    estimatedMinutes: 15,
    evidenceLevel: 'moderate',
  },
  self_as_context: {
    label: 'Yo como contexto (ACT)',
    description: 'Fortalecer la perspectiva observadora más allá del contenido mental',
    bestFor: ['shame', 'anxiety', 'overwhelm'],
    estimatedMinutes: 15,
    evidenceLevel: 'emerging',
  },
  socratic_questioning: {
    label: 'Cuestionamiento socrático',
    description: 'Hacerse preguntas que desafíen la certeza del pensamiento automático',
    bestFor: ['anxiety', 'guilt', 'sadness', 'anger'],
    estimatedMinutes: 15,
    evidenceLevel: 'strong',
  },
  thought_record_abc: {
    label: 'Registro de pensamientos A-B-C',
    description: 'Documentar la cadena situación → pensamiento → emoción → conducta',
    bestFor: ['anxiety', 'sadness', 'anger', 'guilt'],
    estimatedMinutes: 15,
    evidenceLevel: 'strong',
  },
  worry_time: {
    label: 'Tiempo de preocupación',
    description: 'Posponer las preocupaciones a un momento específico del día',
    bestFor: ['anxiety'],
    estimatedMinutes: 20,
    evidenceLevel: 'moderate',
  },
  response_prevention: {
    label: 'Prevención de respuesta',
    description: 'Resistir el impulso de la conducta de seguridad o compulsión',
    bestFor: ['anxiety', 'fear'],
    estimatedMinutes: 30,
    evidenceLevel: 'strong',
  },
};

// ============================================================================
// TIPOS DE CONDUCTA Y CONSECUENCIA (ABC)
// ============================================================================

/**
 * Tipo de conducta en el análisis funcional ABC.
 * La distinción más importante clínicamente es avoidance vs adaptive.
 */
export type BehaviorType =
  | 'avoidance'            // Evitar la situación temida
  | 'escape'               // Escapar de la situación una vez en ella
  | 'approach_problematic' // Acercarse de forma problemática (ej: agresión)
  | 'compulsion'           // Conducta compulsiva para reducir ansiedad
  | 'rumination'           // Darle vueltas al pensamiento sin resolver
  | 'reassurance_seeking'  // Buscar confirmación externa
  | 'safety_behavior'      // Conducta de seguridad que mantiene el miedo
  | 'adaptive';            // Conducta funcional y adaptativa

export const BEHAVIOR_LABELS: Record<BehaviorType, string> = {
  avoidance:            'Evitación',
  escape:               'Escape',
  approach_problematic: 'Aproximación problemática',
  compulsion:           'Compulsión',
  rumination:           'Rumiación',
  reassurance_seeking:  'Búsqueda de reaseguración',
  safety_behavior:      'Conducta de seguridad',
  adaptive:             'Conducta adaptativa',
};

/**
 * Tipo de consecuencia en el análisis funcional.
 * El refuerzo negativo (alivio por evitar) es el mantenedor
 * más frecuente en trastornos de ansiedad.
 */
export type ConsequenceType =
  | 'negative_reinforcement' // Alivio por evitar el estímulo temido
  | 'positive_reinforcement' // Recompensa al realizar la conducta
  | 'punishment'             // Consecuencia negativa
  | 'neutral';               // Sin consecuencia clara

// ============================================================================
// ESTADO DE OBJETIVOS
// ============================================================================

export type GoalStatus = 'active' | 'achieved' | 'revised' | 'abandoned';

// ============================================================================
// UTILIDADES DE SUDS
// ============================================================================

/**
 * Categoriza un valor SUDs en un nivel descriptivo para la UI.
 */
export function categorizeSUDs(suds: SUDs): {
  level: 'minimal' | 'mild' | 'moderate' | 'high' | 'severe';
  label: string;
  color: string;
} {
  if (suds <= 20) return { level: 'minimal',  label: 'Mínimo',    color: 'emerald' };
  if (suds <= 40) return { level: 'mild',     label: 'Leve',      color: 'green'   };
  if (suds <= 60) return { level: 'moderate', label: 'Moderado',  color: 'amber'   };
  if (suds <= 80) return { level: 'high',     label: 'Alto',      color: 'orange'  };
  return              { level: 'severe',   label: 'Severo',    color: 'red'     };
}

/**
 * Calcula si el cambio en SUDs es clínicamente significativo.
 * Criterio: reducción ≥ 20% del valor baseline.
 */
export function isClinicallySignificant(
  baselineSUDs: SUDs,
  currentSUDs: SUDs
): boolean {
  if (baselineSUDs === 0) return false;
  const percentChange = ((currentSUDs - baselineSUDs) / baselineSUDs) * 100;
  return percentChange <= -20; // Reducción del 20% o más
}

/**
 * Interpreta el cambio de SUDs en texto para mostrar al usuario.
 */
export function interpretSUDsChange(before: SUDs, after: SUDs): {
  label: string;
  direction: 'improved' | 'same' | 'worsened';
  percentChange: number;
} {
  const percentChange = before === 0 ? 0 : Math.round(((after - before) / before) * 100);

  if (percentChange <= -30) return { label: 'Mejora muy significativa', direction: 'improved', percentChange };
  if (percentChange <= -15) return { label: 'Mejora notable',           direction: 'improved', percentChange };
  if (percentChange <= -5)  return { label: 'Mejora leve',              direction: 'improved', percentChange };
  if (percentChange <= 5)   return { label: 'Sin cambio',               direction: 'same',     percentChange };
  if (percentChange <= 20)  return { label: 'Leve empeoramiento',       direction: 'worsened', percentChange };
  return                           { label: 'Empeoramiento notable',    direction: 'worsened', percentChange };
}
