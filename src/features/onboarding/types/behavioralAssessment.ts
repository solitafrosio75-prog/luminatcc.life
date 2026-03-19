// @ts-nocheck
/**
 * EvaluaciÃ³n Conductual Inicial (Bloque B del Onboarding)
 *
 * Complementa el perfil TCC existente (Bloque A) con datos
 * topogrÃ¡ficos y funcionales del problema conductual.
 *
 * Basado en el paradigma de evaluaciÃ³n conductual:
 * - ParÃ¡metros de la conducta problema (frecuencia, duraciÃ³n)
 * - Antecedentes tÃ­picos (quÃ© dispara la evitaciÃ³n)
 * - Consecuencias tÃ­picas (quÃ© mantiene el ciclo)
 * - Contexto de generalizaciÃ³n
 *
 * Referencia: Ruiz, DÃ­az y Villalobos - Manual de TÃ©cnicas de
 * IntervenciÃ³n Cognitivo Conductuales, Cap. 2, pp. 108-133
 */

import type { TCCTechnique } from '../../../db/database';

// ============================================================================
// TIPOS DE RESPUESTA
// ============================================================================

export type ProblemFrequency = 'daily' | 'several_weekly' | 'weekly' | 'occasionally';
export type ProblemDuration = 'months' | '1_2_years' | 'years' | 'always';
export type TypicalAntecedent = 'see_mess' | 'think_about_all' | 'tired' | 'after_conflict' | 'no_clear_trigger';
export type AvoidanceBehavior = 'phone' | 'sleep' | 'other_tasks' | 'ruminate' | 'nothing';
export type PostAvoidanceFeeling = 'relief' | 'guilt' | 'frustration' | 'nothing_feeling' | 'anxiety';
export type GeneralizationContext = 'home_only' | 'home_and_work' | 'everything' | 'unsure';

// ============================================================================
// INTERFAZ DE EVALUACIÃ“N CONDUCTUAL
// ============================================================================

/**
 * Datos recogidos en el Bloque B del onboarding.
 * Se almacena una vez y se usa como referencia declarada
 * para contrastar con datos detectados automÃ¡ticamente.
 */
export interface BehavioralAssessment {
  id?: number;
  userId: string;

  // === TOPOGRÃFICO ===
  problemFrequency: ProblemFrequency;
  problemDuration: ProblemDuration;

  // === FUNCIONAL (primera aproximaciÃ³n) ===
  typicalAntecedents: TypicalAntecedent[];       // multi-select
  avoidanceBehaviors: AvoidanceBehavior[];        // multi-select
  postAvoidanceFeelings: PostAvoidanceFeeling[];  // multi-select

  // === CONTEXTUAL ===
  generalization: GeneralizationContext;

  // === METADATA ===
  createdAt: Date;
}

// ============================================================================
// HIPÃ“TESIS FUNCIONAL INICIAL
// ============================================================================

export type HypothesisStatus = 'initial' | 'validated' | 'revised';
export type StartLevel = 'micro_only' | 'micro_and_low' | 'standard';

export interface FunctionalHypothesisAntecedent {
  type: 'internal' | 'external';
  description: string;
  source: 'declared' | 'detected' | 'both';
}

export interface FunctionalHypothesisConsequence {
  type: 'positive_reinforcement' | 'negative_reinforcement' | 'punishment';
  description: string;
  source: 'declared' | 'detected' | 'both';
}

/**
 * HipÃ³tesis funcional generada automÃ¡ticamente a partir de
 * los datos del Bloque A (UserTCCProfile) + Bloque B (BehavioralAssessment).
 *
 * Es la primera formulaciÃ³n del caso, que la lÃ­nea base (Capa 2)
 * validarÃ¡ o revisarÃ¡ con datos conductuales reales.
 */
export interface FunctionalHypothesis {
  id?: number;
  userId: string;
  version: number;

  // Conducta problema principal
  targetBehavior: string;

  // Antecedentes mÃ¡s probables
  likelyAntecedents: FunctionalHypothesisAntecedent[];

  // Consecuencias que mantienen el ciclo
  maintainingConsequences: FunctionalHypothesisConsequence[];

  // EstimaciÃ³n de fuerza del patrÃ³n (1-5)
  // Calculado: duraciÃ³n Ã— frecuencia
  estimatedPatternStrength: 1 | 2 | 3 | 4 | 5;

  // TÃ©cnicas TCC recomendadas (priorizadas)
  recommendedTechniques: TCCTechnique[];

  // Nivel de intervenciÃ³n sugerido
  suggestedStartLevel: StartLevel;

  // Narrativa simple del ciclo para mostrar al usuario
  cycleNarrative: string;

  // Metadata
  status: HypothesisStatus;
  generatedAt: Date;
  lastValidated?: Date;
}

// ============================================================================
// OPCIONES DE PREGUNTAS DEL BLOQUE B
// ============================================================================

/**
 * OpciÃ³n para preguntas del Bloque B.
 * Extiende el formato de TCCQuestionOption existente
 * para soportar multi-select.
 */
export interface BehavioralQuestionOption {
  value: string;
  icon: string;
  label: string;
  subtitle: string;
  tccNote: string;
}

export interface BehavioralQuestion {
  id: string;
  question: string;
  subtitle: string;
  type: 'single_select' | 'multi_select';
  options: BehavioralQuestionOption[];
  /** MÃ­nimo de opciones requeridas (para multi_select) */
  minSelections?: number;
  /** MÃ¡ximo de opciones permitidas (para multi_select) */
  maxSelections?: number;
}

// ============================================================================
// B1: PARÃMETROS DE LA CONDUCTA PROBLEMA
// ============================================================================

export const PROBLEM_FREQUENCY_OPTIONS: BehavioralQuestionOption[] = [
  {
    value: 'daily',
    icon: 'ðŸ“…',
    label: 'Casi todos los dÃ­as',
    subtitle: 'Es una lucha constante',
    tccNote: 'La frecuencia diaria indica un patrÃ³n muy establecido. Empezaremos con micro-cambios consistentes que rompan el ciclo poco a poco.',
  },
  {
    value: 'several_weekly',
    icon: 'ðŸ“†',
    label: 'Varias veces por semana',
    subtitle: 'Algunos dÃ­as puedo, otros no',
    tccNote: 'Hay dÃ­as donde lo consigues â€” eso significa que tienes las habilidades. Vamos a identificar quÃ© diferencia los dÃ­as buenos de los malos.',
  },
  {
    value: 'weekly',
    icon: 'ðŸ—“ï¸',
    label: 'Una vez por semana',
    subtitle: 'Se acumula y explota',
    tccNote: 'El patrÃ³n de acumulaciÃ³n-explosiÃ³n es muy comÃºn. Tareas pequeÃ±as y frecuentes lo previenen mejor que sesiones largas esporÃ¡dicas.',
  },
  {
    value: 'occasionally',
    icon: 'ðŸŒ¤ï¸',
    label: 'De vez en cuando',
    subtitle: 'Solo cuando estoy mal',
    tccNote: 'Parece estar ligado a tu estado emocional. Vamos a fortalecer tus estrategias para los dÃ­as difÃ­ciles.',
  },
];

export const PROBLEM_DURATION_OPTIONS: BehavioralQuestionOption[] = [
  {
    value: 'months',
    icon: 'ðŸŒ±',
    label: 'Unos meses',
    subtitle: 'Es relativamente reciente',
    tccNote: 'Un patrÃ³n reciente es mÃ¡s fÃ¡cil de cambiar. EstÃ¡s a tiempo de que no se cronifique.',
  },
  {
    value: '1_2_years',
    icon: 'ðŸŒ¿',
    label: '1-2 aÃ±os',
    subtitle: 'Ya lleva un tiempo',
    tccNote: 'El patrÃ³n se estÃ¡ consolidando, pero aÃºn es muy modificable con intervenciÃ³n consistente.',
  },
  {
    value: 'years',
    icon: 'ðŸŒ³',
    label: 'Varios aÃ±os',
    subtitle: 'Llevo mucho con esto',
    tccNote: 'Los patrones arraigados requieren paciencia, pero se pueden cambiar. La clave es ir muy gradual.',
  },
  {
    value: 'always',
    icon: 'ðŸ”ï¸',
    label: 'Siempre ha sido asÃ­',
    subtitle: 'No recuerdo que fuera diferente',
    tccNote: 'Cuando algo "siempre" ha sido asÃ­, a veces creemos que no puede cambiar. Pero el cerebro es plÃ¡stico a cualquier edad.',
  },
];

// ============================================================================
// B2: ANTECEDENTES TÃPICOS
// ============================================================================

export const TYPICAL_ANTECEDENT_OPTIONS: BehavioralQuestionOption[] = [
  {
    value: 'see_mess',
    icon: 'ðŸ‘€',
    label: 'Veo el desorden y me abrumo',
    subtitle: 'El estÃ­mulo visual me paraliza',
    tccNote: 'El estÃ­mulo visual dispara una respuesta emocional automÃ¡tica. Trabajaremos con tareas en espacios pequeÃ±os y contenidos para reducir esa activaciÃ³n.',
  },
  {
    value: 'think_about_all',
    icon: 'ðŸ§ ',
    label: 'Pienso en TODO lo que hay que hacer',
    subtitle: 'La lista mental me aplasta',
    tccNote: 'Eso es un patrÃ³n cognitivo "todo-o-nada". El truco es entrenar tu cerebro para pensar en UNA sola cosa a la vez.',
  },
  {
    value: 'tired',
    icon: 'ðŸ˜´',
    label: 'Estoy cansado/a fÃ­sica o mentalmente',
    subtitle: 'No tengo energÃ­a para nada',
    tccNote: 'Tu cuerpo te estÃ¡ dando informaciÃ³n vÃ¡lida. Vamos a adaptar las tareas a tu energÃ­a real, no a la ideal.',
  },
  {
    value: 'after_conflict',
    icon: 'ðŸ’”',
    label: 'DespuÃ©s de un dÃ­a difÃ­cil o discusiÃ³n',
    subtitle: 'Los eventos emocionales me vacÃ­an',
    tccNote: 'Los eventos emocionales agotan tu capacidad de autorregulaciÃ³n. En esos momentos, tareas mÃ­nimas son la respuesta mÃ¡s inteligente.',
  },
  {
    value: 'no_clear_trigger',
    icon: 'ðŸŒ«ï¸',
    label: 'No sÃ©, simplemente no puedo',
    subtitle: 'No identifico un disparador claro',
    tccNote: 'A veces el antecedente no es obvio a simple vista. El registro diario nos ayudarÃ¡ a detectar patrones que ahora mismo son invisibles.',
  },
];

// ============================================================================
// B3: CONSECUENCIAS TÃPICAS
// ============================================================================

export const AVOIDANCE_BEHAVIOR_OPTIONS: BehavioralQuestionOption[] = [
  {
    value: 'phone',
    icon: 'ðŸ“±',
    label: 'Reviso el telÃ©fono / redes',
    subtitle: 'Me pierdo scrolleando',
    tccNote: 'Las pantallas ofrecen estimulaciÃ³n inmediata sin esfuerzo â€” refuerzo positivo potente. Identificar este patrÃ³n es el primer paso para manejarlo.',
  },
  {
    value: 'sleep',
    icon: 'ðŸ›Œ',
    label: 'Duermo o descanso',
    subtitle: 'Me echo en la cama o el sofÃ¡',
    tccNote: 'Dormir puede ser una necesidad real o un escape. Con el tiempo aprenderemos a distinguir cuÃ¡ndo es cada cosa.',
  },
  {
    value: 'other_tasks',
    icon: 'ðŸ”„',
    label: 'Hago otras cosas "mÃ¡s urgentes"',
    subtitle: 'Siempre hay algo que parece mÃ¡s importante',
    tccNote: 'Eso se llama "procrastinaciÃ³n productiva" â€” estÃ¡s activo/a pero evitando lo importante. Reconocerla es tener poder sobre ella.',
  },
  {
    value: 'ruminate',
    icon: 'ðŸ’­',
    label: 'Me quedo pensando en lo que deberÃ­a hacer',
    subtitle: 'Planeo pero no actÃºo',
    tccNote: 'La rumiaciÃ³n es inacciÃ³n disfrazada de planificaciÃ³n. Una micro-tarea de 2 minutos la interrumpe mÃ¡s efectivamente que cualquier plan.',
  },
  {
    value: 'nothing',
    icon: 'ðŸ§Š',
    label: 'Me quedo paralizado/a',
    subtitle: 'No hago nada, ni lo bueno ni lo malo',
    tccNote: 'La parÃ¡lisis es una respuesta de tu sistema nervioso ante la sobrecarga, no un defecto de carÃ¡cter. Se puede trabajar.',
  },
];

export const POST_AVOIDANCE_FEELING_OPTIONS: BehavioralQuestionOption[] = [
  {
    value: 'relief',
    icon: 'ðŸ˜®â€ðŸ’¨',
    label: 'Alivio momentÃ¡neo',
    subtitle: 'Al menos no tengo que enfrentarlo ahora',
    tccNote: 'El alivio inmediato es el combustible que alimenta la evitaciÃ³n. Es refuerzo negativo: evitas el malestar y tu cerebro aprende a repetirlo.',
  },
  {
    value: 'guilt',
    icon: 'ðŸ˜”',
    label: 'Culpa',
    subtitle: '"DeberÃ­a haberlo hecho"',
    tccNote: 'La culpa indica que te importa, y eso es informaciÃ³n valiosa. Vamos a usar esa energÃ­a para actuar en vez de para castigarte.',
  },
  {
    value: 'frustration',
    icon: 'ðŸ˜¤',
    label: 'FrustraciÃ³n conmigo mismo/a',
    subtitle: '"Â¿Por quÃ© no puedo simplemente hacerlo?"',
    tccNote: 'Esa frustraciÃ³n a menudo viene de expectativas poco realistas. Ajustar las expectativas no es rendirse â€” es ser estratÃ©gico/a.',
  },
  {
    value: 'nothing_feeling',
    icon: 'ðŸ˜',
    label: 'Nada en particular',
    subtitle: 'No le doy muchas vueltas',
    tccNote: 'La ausencia de malestar post-evitaciÃ³n puede indicar que el patrÃ³n estÃ¡ muy normalizado. Eso no es malo â€” simplemente significa que el cambio vendrÃ¡ mÃ¡s de la acciÃ³n que de la emociÃ³n.',
  },
  {
    value: 'anxiety',
    icon: 'ðŸ˜°',
    label: 'MÃ¡s ansiedad que antes',
    subtitle: 'Ahora me preocupo mÃ¡s por lo acumulado',
    tccNote: 'Evitar genera mÃ¡s ansiedad a medio plazo â€” un ciclo que se autoalimenta. La activaciÃ³n conductual es la salida mÃ¡s efectiva.',
  },
];

// ============================================================================
// B4: CONTEXTO DE GENERALIZACIÃ“N
// ============================================================================

export const GENERALIZATION_OPTIONS: BehavioralQuestionOption[] = [
  {
    value: 'home_only',
    icon: 'ðŸ ',
    label: 'Solo con tareas del hogar',
    subtitle: 'En otras Ã¡reas funciono bien',
    tccNote: 'Algo especÃ­fico del contexto "hogar" activa la evitaciÃ³n. Las habilidades que tienes en otras Ã¡reas nos dan pistas de quÃ© funciona para ti.',
  },
  {
    value: 'home_and_work',
    icon: 'ðŸ’¼',
    label: 'TambiÃ©n en el trabajo o estudios',
    subtitle: 'Procrastino en varias Ã¡reas',
    tccNote: 'El patrÃ³n es mÃ¡s amplio. Lo bueno es que las habilidades que desarrolles aquÃ­ con las tareas del hogar te servirÃ¡n directamente en otras Ã¡reas.',
  },
  {
    value: 'everything',
    icon: 'ðŸŒ',
    label: 'Me pasa con casi todo',
    subtitle: 'Es un patrÃ³n general en mi vida',
    tccNote: 'Esto sugiere un patrÃ³n transversal. Empezar por el hogar es estratÃ©gico porque los resultados son tangibles y visibles, lo cual genera momentum.',
  },
  {
    value: 'unsure',
    icon: 'ðŸ¤”',
    label: 'No estoy seguro/a',
    subtitle: 'No lo he pensado mucho',
    tccNote: 'EstÃ¡ bien no saberlo ahora. Con el uso de la app iremos descubriendo si el patrÃ³n es especÃ­fico del hogar o mÃ¡s amplio.',
  },
];

// ============================================================================
// ARRAY DE PREGUNTAS DEL BLOQUE B
// ============================================================================

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: 'problemFrequency',
    question: 'Â¿Con quÃ© frecuencia sientes que tu casa estÃ¡ fuera de control?',
    subtitle: 'Esto nos ayuda a calibrar la intensidad del apoyo',
    type: 'single_select',
    options: PROBLEM_FREQUENCY_OPTIONS,
  },
  {
    id: 'problemDuration',
    question: 'Â¿CuÃ¡nto tiempo llevas luchando con esto?',
    subtitle: 'Los patrones recientes se abordan diferente a los crÃ³nicos',
    type: 'single_select',
    options: PROBLEM_DURATION_OPTIONS,
  },
  {
    id: 'typicalAntecedents',
    question: 'Cuando evitas una tarea del hogar, Â¿quÃ© suele pasar justo antes?',
    subtitle: 'Puedes elegir varias opciones',
    type: 'multi_select',
    minSelections: 1,
    maxSelections: 3,
    options: TYPICAL_ANTECEDENT_OPTIONS,
  },
  {
    id: 'avoidanceBehaviors',
    question: 'Cuando postergas una tarea, Â¿quÃ© haces en su lugar?',
    subtitle: 'Puedes elegir varias opciones',
    type: 'multi_select',
    minSelections: 1,
    maxSelections: 3,
    options: AVOIDANCE_BEHAVIOR_OPTIONS,
  },
  {
    id: 'postAvoidanceFeelings',
    question: 'Â¿CÃ³mo te sientes despuÃ©s de no haber hecho la tarea?',
    subtitle: 'Puedes elegir varias opciones',
    type: 'multi_select',
    minSelections: 1,
    maxSelections: 3,
    options: POST_AVOIDANCE_FEELING_OPTIONS,
  },
  {
    id: 'generalization',
    question: 'Â¿Esta dificultad es solo con el hogar?',
    subtitle: 'Nos ayuda a entender el alcance del patrÃ³n',
    type: 'single_select',
    options: GENERALIZATION_OPTIONS,
  },
];
