// @ts-nocheck
/**
 * TCC Decision Tree - Ãrbol de Decisiones Consolidado
 *
 * FASE 1 MEJORA: Consolida la relaciÃ³n entre:
 * - Barreras (lo que bloquea al usuario)
 * - Emociones (lo que siente)
 * - TÃ©cnicas (lo que puede ayudar)
 *
 * Este archivo es la ÃšNICA FUENTE DE VERDAD para estas relaciones.
 * TCCEngine y EmotionTechniqueMapping deben usar estas definiciones.
 */

import type {
  TCCTechnique,
  ThoughtEmotion,
  CognitivePattern,
  MoodLevel,
} from '../db/database';

// ============================================================================
// TIPOS
// ============================================================================

export type BarrierId = keyof typeof BARRIER_DEFINITIONS;
export type BarrierCategory = 'cognitive' | 'emotional' | 'behavioral' | 'physical' | 'environmental';
export type ApproachStyle = 'gentle' | 'action' | 'cognitive' | 'somatic';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface BarrierDefinition {
  id: BarrierId;
  name: string;
  description: string;
  category: BarrierCategory;
  emoji: string;
  color: string;

  /** Indicadores textuales para detecciÃ³n */
  indicators: readonly string[];

  /** Emociones comÃºnmente asociadas (ordenadas por probabilidad) */
  associatedEmotions: readonly ThoughtEmotion[];

  /** TÃ©cnicas recomendadas (ordenadas por efectividad) */
  recommendedTechniques: readonly TCCTechnique[];

  /** TÃ©cnicas a evitar con esta barrera */
  avoidTechniques: readonly TCCTechnique[];

  /** Patrones cognitivos relacionados */
  relatedPatterns: readonly CognitivePattern[];

  /** Nivel de urgencia para intervenciÃ³n */
  urgency: UrgencyLevel;

  /** Estilo de aproximaciÃ³n recomendado */
  approachStyle: ApproachStyle;

  /** Mensaje de validaciÃ³n para el usuario */
  validationMessage: string;

  /** Preguntas de detecciÃ³n */
  detectionQuestions: readonly string[];
}

export interface EmotionDefinition {
  emotion: ThoughtEmotion;
  name: string;
  description: string;
  emoji: string;

  /** TÃ©cnicas primarias (mÃ¡s efectivas) */
  primaryTechniques: TCCTechnique[];

  /** TÃ©cnicas secundarias (Ãºtiles pero no las mejores) */
  secondaryTechniques: TCCTechnique[];

  /** TÃ©cnicas a evitar */
  avoidTechniques: TCCTechnique[];

  /** Patrones cognitivos comÃºnmente asociados */
  relatedPatterns: CognitivePattern[];

  /** Nivel de urgencia */
  urgency: UrgencyLevel;

  /** Estilo de aproximaciÃ³n */
  approachStyle: ApproachStyle;

  /** Mensaje de validaciÃ³n */
  validationMessage: string;

  /** Barreras comÃºnmente asociadas */
  associatedBarriers: BarrierId[];
}

export interface TechniqueDefinition {
  technique: TCCTechnique;
  name: string;
  description: string;
  emoji: string;

  /** DuraciÃ³n estimada en minutos */
  durationMinutes: number;

  /** Â¿Requiere alta energÃ­a? */
  requiresHighEnergy: boolean;

  /** CategorÃ­as de barreras donde es mÃ¡s efectiva */
  bestForBarrierCategories: BarrierCategory[];

  /** Emociones donde es mÃ¡s efectiva */
  bestForEmotions: ThoughtEmotion[];

  /** Emociones donde NO es recomendada */
  avoidForEmotions: ThoughtEmotion[];

  /** Ruta en la app */
  route: string;

  /** Puntos base por completar */
  basePoints: number;
}

// ============================================================================
// DEFINICIONES DE BARRERAS
// ============================================================================

export const BARRIER_DEFINITIONS = {
  // === BARRERAS COGNITIVAS ===
  all_or_nothing: {
    id: 'all_or_nothing' as const,
    name: 'Pensamiento Todo o Nada',
    description: 'Ves las cosas en blanco y negro, sin matices',
    category: 'cognitive' as const,
    emoji: 'âš«âšª',
    color: 'purple',
    indicators: ['perfecto', 'nunca', 'siempre', 'todo', 'nada', 'completamente'],
    associatedEmotions: ['frustrated', 'anxious', 'guilty'] as ThoughtEmotion[],
    recommendedTechniques: ['cognitive_restructuring', 'gradual_exposure', 'micro_tasks'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['all_or_nothing'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'cognitive' as const,
    validationMessage: 'Es normal querer hacer las cosas bien. El progreso tambiÃ©n cuenta.',
    detectionQuestions: ['Â¿Sientes que si no lo haces perfecto, no vale la pena?'],
  },

  catastrophizing: {
    id: 'catastrophizing' as const,
    name: 'CatastrofizaciÃ³n',
    description: 'Imaginas el peor escenario posible',
    category: 'cognitive' as const,
    emoji: 'ðŸŒ‹',
    color: 'red',
    indicators: ['desastre', 'terrible', 'horrible', 'no puedo', 'imposible'],
    associatedEmotions: ['anxious', 'hopeless', 'overwhelmed'] as ThoughtEmotion[],
    recommendedTechniques: ['cognitive_restructuring', 'functional_analysis', 'problem_solving'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['fortune_telling', 'magnification'] as CognitivePattern[],
    urgency: 'high' as const,
    approachStyle: 'cognitive' as const,
    validationMessage: 'Los pensamientos catastrÃ³ficos son molestos pero no predicen el futuro.',
    detectionQuestions: ['Â¿EstÃ¡s imaginando que todo saldrÃ¡ muy mal?'],
  },

  should_statements: {
    id: 'should_statements' as const,
    name: 'Autoexigencia RÃ­gida',
    description: 'Te impones reglas muy estrictas',
    category: 'cognitive' as const,
    emoji: 'ðŸ“',
    color: 'orange',
    indicators: ['deberÃ­a', 'tendrÃ­a que', 'debo', 'tengo que', 'no deberÃ­a'],
    associatedEmotions: ['guilty', 'frustrated', 'ashamed'] as ThoughtEmotion[],
    recommendedTechniques: ['cognitive_restructuring', 'self_compassion', 'behavioral_activation'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['should_statements'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'cognitive' as const,
    validationMessage: 'Ser amable contigo mismo no es debilidad, es sabidurÃ­a.',
    detectionQuestions: ['Â¿Te estÃ¡s exigiendo mÃ¡s de lo razonable?'],
  },

  // === BARRERAS EMOCIONALES ===
  anxiety: {
    id: 'anxiety' as const,
    name: 'Ansiedad',
    description: 'Sientes nerviosismo o preocupaciÃ³n intensa',
    category: 'emotional' as const,
    emoji: 'ðŸ˜°',
    color: 'yellow',
    indicators: ['nervioso', 'preocupado', 'ansioso', 'agobiado', 'inquieto'],
    associatedEmotions: ['anxious', 'overwhelmed'] as ThoughtEmotion[],
    recommendedTechniques: ['gradual_exposure', 'relaxation', 'micro_tasks', 'behavioral_activation'] as TCCTechnique[],
    avoidTechniques: ['problem_solving'] as TCCTechnique[],
    relatedPatterns: ['fortune_telling', 'magnification', 'overgeneralization'] as CognitivePattern[],
    urgency: 'high' as const,
    approachStyle: 'somatic' as const,
    validationMessage: 'La ansiedad es incÃ³moda pero no peligrosa. Puedes actuar con ella presente.',
    detectionQuestions: ['Â¿Sientes tensiÃ³n o nerviosismo al pensar en la tarea?'],
  },

  guilt: {
    id: 'guilt' as const,
    name: 'Culpa',
    description: 'Te sientes mal por no haber hecho algo',
    category: 'emotional' as const,
    emoji: 'ðŸ˜”',
    color: 'blue',
    indicators: ['culpable', 'mal', 'debÃ­', 'no hice', 'fallÃ©'],
    associatedEmotions: ['guilty', 'ashamed', 'sad'] as ThoughtEmotion[],
    recommendedTechniques: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['should_statements', 'personalization'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'La culpa te dice que algo te importa. Ahora puedes elegir quÃ© hacer.',
    detectionQuestions: ['Â¿Te sientes culpable por cosas pendientes?'],
  },

  overwhelm: {
    id: 'overwhelm' as const,
    name: 'Abrumamiento',
    description: 'Sientes que es demasiado',
    category: 'emotional' as const,
    emoji: 'ðŸŒŠ',
    color: 'blue',
    indicators: ['demasiado', 'abrumado', 'no puedo', 'mucho', 'caos'],
    associatedEmotions: ['overwhelmed', 'anxious', 'hopeless'] as ThoughtEmotion[],
    recommendedTechniques: ['micro_tasks', 'activity_scheduling', 'problem_solving', 'gradual_exposure'] as TCCTechnique[],
    avoidTechniques: ['functional_analysis', 'cognitive_restructuring'] as TCCTechnique[],
    relatedPatterns: ['magnification', 'all_or_nothing', 'mental_filter'] as CognitivePattern[],
    urgency: 'high' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'Cuando todo parece mucho, una sola cosa pequeÃ±a es suficiente.',
    detectionQuestions: ['Â¿Sientes que hay demasiado por hacer?'],
  },

  frustration: {
    id: 'frustration' as const,
    name: 'FrustraciÃ³n',
    description: 'Sientes irritaciÃ³n o enojo',
    category: 'emotional' as const,
    emoji: 'ðŸ˜¤',
    color: 'orange',
    indicators: ['frustrado', 'enojado', 'molesto', 'harto', 'cansado de'],
    associatedEmotions: ['frustrated', 'angry'] as ThoughtEmotion[],
    recommendedTechniques: ['behavioral_activation', 'problem_solving', 'relaxation'] as TCCTechnique[],
    avoidTechniques: ['self_compassion'] as TCCTechnique[],
    relatedPatterns: ['should_statements', 'all_or_nothing', 'labeling'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'action' as const,
    validationMessage: 'La frustraciÃ³n es energÃ­a. Vamos a usarla a tu favor.',
    detectionQuestions: ['Â¿Te sientes frustrado con la situaciÃ³n?'],
  },

  hopelessness: {
    id: 'hopelessness' as const,
    name: 'Desesperanza',
    description: 'Sientes que nada va a mejorar',
    category: 'emotional' as const,
    emoji: 'ðŸ•³ï¸',
    color: 'gray',
    indicators: ['sin esperanza', 'no tiene sentido', 'para quÃ©', 'da igual', 'nunca'],
    associatedEmotions: ['hopeless', 'sad'] as ThoughtEmotion[],
    recommendedTechniques: ['micro_tasks', 'behavioral_activation', 'self_compassion'] as TCCTechnique[],
    avoidTechniques: ['problem_solving', 'cognitive_restructuring'] as TCCTechnique[],
    relatedPatterns: ['fortune_telling', 'overgeneralization', 'labeling'] as CognitivePattern[],
    urgency: 'critical' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'La desesperanza miente. Un pequeÃ±o paso puede cambiar la perspectiva.',
    detectionQuestions: ['Â¿Sientes que nada de lo que hagas va a servir?'],
  },

  // === BARRERAS CONDUCTUALES ===
  avoidance: {
    id: 'avoidance' as const,
    name: 'EvitaciÃ³n',
    description: 'Tiendes a evitar o postergar',
    category: 'behavioral' as const,
    emoji: 'ðŸ™ˆ',
    color: 'gray',
    indicators: ['despuÃ©s', 'luego', 'maÃ±ana', 'no ahora', 'evito'],
    associatedEmotions: ['anxious', 'overwhelmed'] as ThoughtEmotion[],
    recommendedTechniques: ['behavioral_activation', 'gradual_exposure', 'functional_analysis'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['fortune_telling', 'emotional_reasoning'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'action' as const,
    validationMessage: 'Evitar es humano. Dar un pequeÃ±o paso rompe el ciclo.',
    detectionQuestions: ['Â¿Has estado evitando esta tarea?'],
  },

  procrastination: {
    id: 'procrastination' as const,
    name: 'ProcrastinaciÃ³n',
    description: 'Postergas a pesar de querer hacerlo',
    category: 'behavioral' as const,
    emoji: 'â°',
    color: 'orange',
    indicators: ['procrastino', 'postergando', 'deberÃ­a haber', 'llevo dÃ­as'],
    associatedEmotions: ['guilty', 'anxious', 'frustrated'] as ThoughtEmotion[],
    recommendedTechniques: ['behavioral_activation', 'micro_tasks', 'momentum_building', 'activity_scheduling'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['emotional_reasoning', 'all_or_nothing'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'action' as const,
    validationMessage: 'La procrastinaciÃ³n no es pereza, es una forma de manejar emociones difÃ­ciles.',
    detectionQuestions: ['Â¿Llevas tiempo postergando esto?'],
  },

  perfectionism_paralysis: {
    id: 'perfectionism_paralysis' as const,
    name: 'ParÃ¡lisis por Perfeccionismo',
    description: 'No empiezas porque no puedes hacerlo perfecto',
    category: 'behavioral' as const,
    emoji: 'âœ¨',
    color: 'purple',
    indicators: ['perfecto', 'bien', 'correcto', 'como debe ser'],
    associatedEmotions: ['anxious', 'ashamed', 'frustrated'] as ThoughtEmotion[],
    recommendedTechniques: ['micro_tasks', 'gradual_exposure', 'cognitive_restructuring'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['all_or_nothing', 'should_statements'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'Hecho es mejor que perfecto. Siempre puedes mejorar despuÃ©s.',
    detectionQuestions: ['Â¿No empiezas porque no puedes hacerlo perfecto?'],
  },

  // === BARRERAS FÃSICAS/ENERGÃ‰TICAS ===
  low_energy: {
    id: 'low_energy' as const,
    name: 'Baja EnergÃ­a',
    description: 'Te sientes sin fuerzas fÃ­sicas',
    category: 'physical' as const,
    emoji: 'ðŸ”‹',
    color: 'gray',
    indicators: ['cansado', 'agotado', 'sin energÃ­a', 'exhausto'],
    associatedEmotions: ['sad', 'hopeless'] as ThoughtEmotion[],
    recommendedTechniques: ['micro_tasks', 'activity_scheduling', 'self_compassion'] as TCCTechnique[],
    avoidTechniques: ['problem_solving'] as TCCTechnique[],
    relatedPatterns: ['emotional_reasoning'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'Tu cuerpo necesita respeto. Una micro-tarea es suficiente hoy.',
    detectionQuestions: ['Â¿Tu cuerpo se siente cansado?'],
  },

  decision_fatigue: {
    id: 'decision_fatigue' as const,
    name: 'Fatiga de Decisiones',
    description: 'EstÃ¡s agotado de tomar decisiones',
    category: 'physical' as const,
    emoji: 'ðŸ¤¯',
    color: 'purple',
    indicators: ['no sÃ© quÃ©', 'no puedo decidir', 'cualquier cosa'],
    associatedEmotions: ['overwhelmed', 'frustrated'] as ThoughtEmotion[],
    recommendedTechniques: ['activity_scheduling', 'micro_tasks', 'momentum_building'] as TCCTechnique[],
    avoidTechniques: ['problem_solving'] as TCCTechnique[],
    relatedPatterns: ['all_or_nothing'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'Cuando decidir es difÃ­cil, te darÃ© opciones claras.',
    detectionQuestions: ['Â¿Te cuesta decidir quÃ© hacer primero?'],
  },

  // === BARRERAS AMBIENTALES ===
  messy_environment: {
    id: 'messy_environment' as const,
    name: 'Entorno Desordenado',
    description: 'El desorden te paraliza',
    category: 'environmental' as const,
    emoji: 'ðŸŒªï¸',
    color: 'brown',
    indicators: ['caos', 'desorden', 'no sÃ© por dÃ³nde', 'todo estÃ¡'],
    associatedEmotions: ['overwhelmed', 'anxious'] as ThoughtEmotion[],
    recommendedTechniques: ['gradual_exposure', 'micro_tasks', 'momentum_building'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['magnification', 'all_or_nothing'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'gentle' as const,
    validationMessage: 'El desorden no se creÃ³ en un dÃ­a y no tiene que irse en uno.',
    detectionQuestions: ['Â¿El desorden te abruma visualmente?'],
  },

  lack_of_time: {
    id: 'lack_of_time' as const,
    name: 'Falta de Tiempo',
    description: 'Sientes que no tienes tiempo',
    category: 'environmental' as const,
    emoji: 'âŒ›',
    color: 'blue',
    indicators: ['no tengo tiempo', 'estoy ocupado', 'no me da'],
    associatedEmotions: ['anxious', 'overwhelmed', 'frustrated'] as ThoughtEmotion[],
    recommendedTechniques: ['micro_tasks', 'activity_scheduling', 'problem_solving'] as TCCTechnique[],
    avoidTechniques: [] as TCCTechnique[],
    relatedPatterns: ['all_or_nothing', 'fortune_telling'] as CognitivePattern[],
    urgency: 'medium' as const,
    approachStyle: 'action' as const,
    validationMessage: '5 minutos es tiempo. Empecemos por ahÃ­.',
    detectionQuestions: ['Â¿Sientes que no tienes tiempo suficiente?'],
  },
} as const;

// ============================================================================
// DEFINICIONES DE EMOCIONES
// ============================================================================

export const EMOTION_DEFINITIONS: Record<ThoughtEmotion, EmotionDefinition> = {
  anxious: {
    emotion: 'anxious',
    name: 'Ansiedad',
    description: 'Nerviosismo, preocupaciÃ³n, inquietud',
    emoji: 'ðŸ˜°',
    primaryTechniques: ['gradual_exposure', 'relaxation', 'micro_tasks'],
    secondaryTechniques: ['cognitive_restructuring', 'activity_scheduling', 'self_compassion'],
    avoidTechniques: ['problem_solving'],
    relatedPatterns: ['fortune_telling', 'magnification', 'overgeneralization'],
    urgency: 'high',
    approachStyle: 'somatic',
    validationMessage: 'La ansiedad es incÃ³moda pero no peligrosa. Podemos ir paso a paso.',
    associatedBarriers: ['anxiety', 'catastrophizing', 'avoidance'],
  },

  overwhelmed: {
    emotion: 'overwhelmed',
    name: 'Abrumamiento',
    description: 'SensaciÃ³n de que todo es demasiado',
    emoji: 'ðŸŒŠ',
    primaryTechniques: ['micro_tasks', 'activity_scheduling', 'relaxation'],
    secondaryTechniques: ['gradual_exposure', 'momentum_building', 'self_compassion'],
    avoidTechniques: ['problem_solving', 'functional_analysis'],
    relatedPatterns: ['magnification', 'all_or_nothing', 'mental_filter'],
    urgency: 'high',
    approachStyle: 'gentle',
    validationMessage: 'Cuando todo parece demasiado, una sola cosa pequeÃ±a es suficiente.',
    associatedBarriers: ['overwhelm', 'messy_environment', 'decision_fatigue'],
  },

  sad: {
    emotion: 'sad',
    name: 'Tristeza',
    description: 'MelancolÃ­a, desÃ¡nimo',
    emoji: 'ðŸ˜¢',
    primaryTechniques: ['behavioral_activation', 'activity_scheduling', 'self_compassion'],
    secondaryTechniques: ['micro_tasks', 'momentum_building', 'cognitive_restructuring'],
    avoidTechniques: [],
    relatedPatterns: ['all_or_nothing', 'emotional_reasoning', 'labeling', 'mental_filter'],
    urgency: 'medium',
    approachStyle: 'action',
    validationMessage: 'La tristeza es vÃ¡lida. A veces moverse un poco ayuda.',
    associatedBarriers: ['low_energy', 'hopelessness'],
  },

  frustrated: {
    emotion: 'frustrated',
    name: 'FrustraciÃ³n',
    description: 'IrritaciÃ³n por obstÃ¡culos',
    emoji: 'ðŸ˜¤',
    primaryTechniques: ['behavioral_activation', 'problem_solving', 'micro_tasks'],
    secondaryTechniques: ['relaxation', 'cognitive_restructuring', 'momentum_building'],
    avoidTechniques: ['self_compassion'],
    relatedPatterns: ['should_statements', 'all_or_nothing', 'labeling'],
    urgency: 'medium',
    approachStyle: 'action',
    validationMessage: 'La frustraciÃ³n tiene energÃ­a. Vamos a usarla a tu favor.',
    associatedBarriers: ['frustration', 'procrastination', 'all_or_nothing'],
  },

  guilty: {
    emotion: 'guilty',
    name: 'Culpa',
    description: 'Sentirse mal por algo hecho o no hecho',
    emoji: 'ðŸ˜”',
    primaryTechniques: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'],
    secondaryTechniques: ['functional_analysis', 'micro_tasks', 'activity_scheduling'],
    avoidTechniques: [],
    relatedPatterns: ['should_statements', 'personalization', 'magnification'],
    urgency: 'medium',
    approachStyle: 'cognitive',
    validationMessage: 'La culpa te dice que algo te importa. No te define.',
    associatedBarriers: ['guilt', 'should_statements', 'procrastination'],
  },

  hopeless: {
    emotion: 'hopeless',
    name: 'Desesperanza',
    description: 'SensaciÃ³n de que nada mejorarÃ¡',
    emoji: 'ðŸ•³ï¸',
    primaryTechniques: ['micro_tasks', 'behavioral_activation', 'self_compassion'],
    secondaryTechniques: ['momentum_building', 'gradual_exposure', 'activity_scheduling'],
    avoidTechniques: ['problem_solving', 'cognitive_restructuring'],
    relatedPatterns: ['fortune_telling', 'overgeneralization', 'labeling'],
    urgency: 'critical',
    approachStyle: 'gentle',
    validationMessage: 'La desesperanza miente. Un pequeÃ±o paso puede cambiar la perspectiva.',
    associatedBarriers: ['hopelessness', 'catastrophizing'],
  },

  angry: {
    emotion: 'angry',
    name: 'Enojo',
    description: 'Ira, rabia, indignaciÃ³n',
    emoji: 'ðŸ˜ ',
    primaryTechniques: ['relaxation', 'behavioral_activation', 'problem_solving'],
    secondaryTechniques: ['cognitive_restructuring', 'micro_tasks', 'activity_scheduling'],
    avoidTechniques: ['self_compassion'],
    relatedPatterns: ['should_statements', 'mind_reading', 'personalization'],
    urgency: 'medium',
    approachStyle: 'somatic',
    validationMessage: 'El enojo tiene un mensaje. EscuchÃ©moslo y luego decidamos.',
    associatedBarriers: ['frustration'],
  },

  ashamed: {
    emotion: 'ashamed',
    name: 'VergÃ¼enza',
    description: 'Sentirse expuesto, humillado',
    emoji: 'ðŸ˜³',
    primaryTechniques: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'],
    secondaryTechniques: ['micro_tasks', 'gradual_exposure', 'momentum_building'],
    avoidTechniques: ['functional_analysis'],
    relatedPatterns: ['labeling', 'mind_reading', 'personalization', 'magnification'],
    urgency: 'high',
    approachStyle: 'gentle',
    validationMessage: 'La vergÃ¼enza es dolorosa pero no te define. Mereces compasiÃ³n.',
    associatedBarriers: ['guilt', 'perfectionism_paralysis'],
  },
};

// ============================================================================
// DEFINICIONES DE TÃ‰CNICAS
// ============================================================================

export const TECHNIQUE_DEFINITIONS: Record<TCCTechnique, TechniqueDefinition> = {
  behavioral_activation: {
    technique: 'behavioral_activation',
    name: 'ActivaciÃ³n Conductual',
    description: 'La acciÃ³n genera motivaciÃ³n, no al revÃ©s',
    emoji: 'ðŸš€',
    durationMinutes: 5,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['emotional', 'behavioral'],
    bestForEmotions: ['sad', 'frustrated', 'hopeless'],
    avoidForEmotions: [],
    route: '/task/execute',
    basePoints: 20,
  },

  gradual_exposure: {
    technique: 'gradual_exposure',
    name: 'ExposiciÃ³n Gradual',
    description: 'Enfrentar gradualmente lo que evitas',
    emoji: 'ðŸªœ',
    durationMinutes: 10,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['emotional', 'behavioral', 'environmental'],
    bestForEmotions: ['anxious', 'overwhelmed'],
    avoidForEmotions: ['hopeless'],
    route: '/workshop/exposure',
    basePoints: 25,
  },

  cognitive_restructuring: {
    technique: 'cognitive_restructuring',
    name: 'Detective de Pensamientos',
    description: 'Investigar y transformar pensamientos negativos',
    emoji: 'ðŸ”',
    durationMinutes: 10,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['cognitive'],
    bestForEmotions: ['guilty', 'ashamed', 'anxious'],
    avoidForEmotions: ['hopeless', 'overwhelmed'],
    route: '/library/detective',
    basePoints: 45,
  },

  activity_scheduling: {
    technique: 'activity_scheduling',
    name: 'Planificar Actividades',
    description: 'Organizar el dÃ­a reduce la carga mental',
    emoji: 'ðŸ“…',
    durationMinutes: 5,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['behavioral', 'environmental', 'physical'],
    bestForEmotions: ['overwhelmed', 'sad'],
    avoidForEmotions: [],
    route: '/workshop/schedule',
    basePoints: 20,
  },

  functional_analysis: {
    technique: 'functional_analysis',
    name: 'AnÃ¡lisis ABC',
    description: 'Entender quÃ© dispara y mantiene el comportamiento',
    emoji: 'ðŸ”¬',
    durationMinutes: 8,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['behavioral', 'cognitive'],
    bestForEmotions: ['frustrated', 'guilty'],
    avoidForEmotions: ['overwhelmed', 'ashamed'],
    route: '/library/analysis',
    basePoints: 65,
  },

  micro_tasks: {
    technique: 'micro_tasks',
    name: 'Micro-Tareas',
    description: 'Tareas de 2-5 minutos para crear momentum',
    emoji: 'âœ¨',
    durationMinutes: 3,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['emotional', 'behavioral', 'physical'],
    bestForEmotions: ['overwhelmed', 'hopeless', 'anxious'],
    avoidForEmotions: [],
    route: '/task/execute',
    basePoints: 8,
  },

  momentum_building: {
    technique: 'momentum_building',
    name: 'Construir Momentum',
    description: 'Empezar con lo mÃ¡s fÃ¡cil',
    emoji: 'ðŸŽ¯',
    durationMinutes: 5,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['behavioral', 'physical'],
    bestForEmotions: ['frustrated', 'hopeless'],
    avoidForEmotions: [],
    route: '/task/execute',
    basePoints: 10,
  },

  self_compassion: {
    technique: 'self_compassion',
    name: 'Auto-CompasiÃ³n',
    description: 'Tratarte con la amabilidad que darÃ­as a un amigo',
    emoji: 'ðŸ’š',
    durationMinutes: 3,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['emotional', 'cognitive'],
    bestForEmotions: ['guilty', 'ashamed', 'hopeless', 'sad'],
    avoidForEmotions: ['frustrated', 'angry'],
    route: '/library/compassion',
    basePoints: 15,
  },

  problem_solving: {
    technique: 'problem_solving',
    name: 'ResoluciÃ³n de Problemas',
    description: 'Dividir el problema en pasos manejables',
    emoji: 'ðŸ§©',
    durationMinutes: 10,
    requiresHighEnergy: true,
    bestForBarrierCategories: ['environmental', 'behavioral'],
    bestForEmotions: ['frustrated'],
    avoidForEmotions: ['overwhelmed', 'hopeless', 'anxious'],
    route: '/workshop/problem-solving',
    basePoints: 40,
  },

  relaxation: {
    technique: 'relaxation',
    name: 'TÃ©cnicas de RelajaciÃ³n',
    description: 'Calmar el cuerpo para calmar la mente',
    emoji: 'ðŸ§˜',
    durationMinutes: 5,
    requiresHighEnergy: false,
    bestForBarrierCategories: ['emotional', 'physical'],
    bestForEmotions: ['anxious', 'angry', 'overwhelmed'],
    avoidForEmotions: [],
    route: '/relax',
    basePoints: 10,
  },
};

// ============================================================================
// FUNCIONES DE CONSULTA
// ============================================================================

/**
 * Obtiene la definiciÃ³n de una barrera por ID
 */
export function getBarrier(barrierId: BarrierId): BarrierDefinition {
  return BARRIER_DEFINITIONS[barrierId];
}

/**
 * Obtiene la definiciÃ³n de una emociÃ³n
 */
export function getEmotion(emotion: ThoughtEmotion): EmotionDefinition {
  return EMOTION_DEFINITIONS[emotion];
}

/**
 * Obtiene la definiciÃ³n de una tÃ©cnica
 */
export function getTechnique(technique: TCCTechnique): TechniqueDefinition {
  return TECHNIQUE_DEFINITIONS[technique];
}

/**
 * Obtiene las tÃ©cnicas recomendadas para una barrera
 */
export function getTechniquesForBarrier(barrierId: BarrierId): TCCTechnique[] {
  return BARRIER_DEFINITIONS[barrierId]?.recommendedTechniques || [];
}

/**
 * Obtiene las tÃ©cnicas recomendadas para una emociÃ³n
 */
export function getTechniquesForEmotion(emotion: ThoughtEmotion): TCCTechnique[] {
  const def = EMOTION_DEFINITIONS[emotion];
  return [...def.primaryTechniques, ...def.secondaryTechniques];
}

/**
 * Obtiene las emociones asociadas a una barrera
 */
export function getEmotionsForBarrier(barrierId: BarrierId): ThoughtEmotion[] {
  return BARRIER_DEFINITIONS[barrierId]?.associatedEmotions || [];
}

/**
 * Obtiene las barreras asociadas a una emociÃ³n
 */
export function getBarriersForEmotion(emotion: ThoughtEmotion): BarrierId[] {
  return EMOTION_DEFINITIONS[emotion]?.associatedBarriers || [];
}

/**
 * Verifica si una tÃ©cnica debe evitarse para una emociÃ³n
 */
export function shouldAvoidTechnique(technique: TCCTechnique, emotion: ThoughtEmotion): boolean {
  return EMOTION_DEFINITIONS[emotion]?.avoidTechniques.includes(technique) || false;
}

/**
 * Detecta barreras basÃ¡ndose en texto
 */
export function detectBarriersFromText(text: string): BarrierId[] {
  const normalizedText = text.toLowerCase();
  const detectedBarriers: { id: BarrierId; matchCount: number }[] = [];

  for (const [id, barrier] of Object.entries(BARRIER_DEFINITIONS)) {
    const matchCount = barrier.indicators.filter(indicator =>
      normalizedText.includes(indicator.toLowerCase())
    ).length;

    if (matchCount > 0) {
      detectedBarriers.push({ id: id as BarrierId, matchCount });
    }
  }

  // Ordenar por nÃºmero de matches
  return detectedBarriers
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(b => b.id);
}

/**
 * Obtiene la mejor tÃ©cnica para un contexto dado
 */
export function getBestTechnique(context: {
  barrier?: BarrierId;
  emotion?: ThoughtEmotion;
  energy?: 'low' | 'medium' | 'high';
  availableMinutes?: number;
}): { technique: TCCTechnique; reason: string; confidence: number } {
  const scores: Map<TCCTechnique, number> = new Map();
  const reasons: Map<TCCTechnique, string[]> = new Map();

  // Inicializar scores
  for (const technique of Object.keys(TECHNIQUE_DEFINITIONS) as TCCTechnique[]) {
    scores.set(technique, 50); // Base neutral
    reasons.set(technique, []);
  }

  // Score por barrera
  if (context.barrier) {
    const barrier = BARRIER_DEFINITIONS[context.barrier];
    barrier.recommendedTechniques.forEach((technique, index) => {
      const bonus = 30 - index * 5; // Primera: +30, segunda: +25, etc.
      scores.set(technique, (scores.get(technique) || 0) + bonus);
      reasons.get(technique)?.push(`recomendada para ${barrier.name.toLowerCase()}`);
    });

    barrier.avoidTechniques.forEach(technique => {
      scores.set(technique, (scores.get(technique) || 0) - 40);
    });
  }

  // Score por emociÃ³n
  if (context.emotion) {
    const emotion = EMOTION_DEFINITIONS[context.emotion];
    emotion.primaryTechniques.forEach((technique, index) => {
      const bonus = 25 - index * 5;
      scores.set(technique, (scores.get(technique) || 0) + bonus);
      reasons.get(technique)?.push(`efectiva para ${emotion.name.toLowerCase()}`);
    });

    emotion.secondaryTechniques.forEach(technique => {
      scores.set(technique, (scores.get(technique) || 0) + 10);
    });

    emotion.avoidTechniques.forEach(technique => {
      scores.set(technique, (scores.get(technique) || 0) - 35);
    });
  }

  // Score por energÃ­a
  if (context.energy === 'low') {
    for (const [technique, def] of Object.entries(TECHNIQUE_DEFINITIONS)) {
      if (def.requiresHighEnergy) {
        scores.set(technique as TCCTechnique, (scores.get(technique as TCCTechnique) || 0) - 25);
      } else if (technique === 'micro_tasks' || technique === 'self_compassion') {
        scores.set(technique as TCCTechnique, (scores.get(technique as TCCTechnique) || 0) + 15);
        reasons.get(technique as TCCTechnique)?.push('requiere poca energÃ­a');
      }
    }
  }

  // Score por tiempo disponible
  if (context.availableMinutes !== undefined) {
    for (const [technique, def] of Object.entries(TECHNIQUE_DEFINITIONS)) {
      if (def.durationMinutes <= context.availableMinutes) {
        scores.set(technique as TCCTechnique, (scores.get(technique as TCCTechnique) || 0) + 10);
      } else {
        scores.set(technique as TCCTechnique, (scores.get(technique as TCCTechnique) || 0) - 15);
      }
    }
  }

  // Encontrar la mejor tÃ©cnica
  let bestTechnique: TCCTechnique = 'micro_tasks';
  let bestScore = 0;

  for (const [technique, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestTechnique = technique;
    }
  }

  const techniqueReasons = reasons.get(bestTechnique) || [];
  const reason = techniqueReasons.length > 0
    ? techniqueReasons.join(' y ')
    : 'tÃ©cnica versÃ¡til para tu situaciÃ³n';

  return {
    technique: bestTechnique,
    reason,
    confidence: Math.min(bestScore / 100, 1),
  };
}

/**
 * Obtiene todas las barreras de una categorÃ­a
 */
export function getBarriersByCategory(category: BarrierCategory): BarrierDefinition[] {
  return Object.values(BARRIER_DEFINITIONS).filter(b => b.category === category);
}

/**
 * Obtiene la matriz de compatibilidad EmociÃ³nâ†”TÃ©cnica
 */
export function getEmotionTechniqueMatrix(): Map<ThoughtEmotion, Map<TCCTechnique, 'primary' | 'secondary' | 'avoid' | 'neutral'>> {
  const matrix = new Map<ThoughtEmotion, Map<TCCTechnique, 'primary' | 'secondary' | 'avoid' | 'neutral'>>();

  for (const [emotion, def] of Object.entries(EMOTION_DEFINITIONS)) {
    const techniqueMap = new Map<TCCTechnique, 'primary' | 'secondary' | 'avoid' | 'neutral'>();

    for (const technique of Object.keys(TECHNIQUE_DEFINITIONS) as TCCTechnique[]) {
      if (def.primaryTechniques.includes(technique)) {
        techniqueMap.set(technique, 'primary');
      } else if (def.secondaryTechniques.includes(technique)) {
        techniqueMap.set(technique, 'secondary');
      } else if (def.avoidTechniques.includes(technique)) {
        techniqueMap.set(technique, 'avoid');
      } else {
        techniqueMap.set(technique, 'neutral');
      }
    }

    matrix.set(emotion as ThoughtEmotion, techniqueMap);
  }

  return matrix;
}

// ============================================================================
// EXPORTS PARA COMPATIBILIDAD
// ============================================================================

export { BARRIER_DEFINITIONS as UNIFIED_BARRIERS };
export { EMOTION_DEFINITIONS as EMOTION_TECHNIQUE_MAP };
export { TECHNIQUE_DEFINITIONS as TCC_TECHNIQUES_INFO };
