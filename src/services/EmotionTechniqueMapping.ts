// @ts-nocheck
/**
 * Mapeo de Emociones a TÃ©cnicas TCC
 *
 * Este servicio garantiza que cada emociÃ³n tenga tÃ©cnicas TCC apropiadas
 * y proporciona validaciÃ³n de completitud del sistema.
 */

import type { ThoughtEmotion, TCCTechnique, CognitivePattern } from '../db/database';

// ============================================================================
// TIPOS
// ============================================================================

export type ApproachStyle = 'gentle' | 'action' | 'cognitive' | 'somatic';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface EmotionTechniqueMapping {
  emotion: ThoughtEmotion;

  // TÃ©cnicas primarias (mÃ¡s efectivas para esta emociÃ³n)
  primaryTechniques: TCCTechnique[];

  // TÃ©cnicas secundarias (Ãºtiles pero no las mÃ¡s indicadas)
  secondaryTechniques: TCCTechnique[];

  // TÃ©cnicas a evitar cuando esta emociÃ³n estÃ¡ presente
  avoidTechniques: TCCTechnique[];

  // Patrones cognitivos comÃºnmente asociados
  relatedPatterns: CognitivePattern[];

  // Nivel de urgencia (afecta priorizaciÃ³n)
  urgencyLevel: UrgencyLevel;

  // Mensaje de validaciÃ³n especÃ­fico
  validationMessage: string;

  // Enfoque recomendado
  approachStyle: ApproachStyle;
}

// ============================================================================
// MAPEO COMPLETO DE EMOCIONES A TÃ‰CNICAS
// ============================================================================

export const EMOTION_TECHNIQUE_MAP: Record<ThoughtEmotion, EmotionTechniqueMapping> = {

  anxious: {
    emotion: 'anxious',
    primaryTechniques: ['gradual_exposure', 'mindful_breathing', 'distress_tolerance_tipp'],
    secondaryTechniques: ['cognitive_defusion', 'acceptance_willingness', 'mindfulness_observation'],
    avoidTechniques: ['problem_solving'], // Puede aumentar rumiaciÃ³n
    relatedPatterns: ['fortune_telling', 'magnification', 'overgeneralization'],
    urgencyLevel: 'high',
    validationMessage: 'La ansiedad es incÃ³moda pero no peligrosa. Podemos ir paso a paso.',
    approachStyle: 'somatic', // Primero calmar el cuerpo
  },

  overwhelmed: {
    emotion: 'overwhelmed',
    primaryTechniques: ['micro_tasks', 'present_moment_anchor', 'distress_tolerance_tipp'],
    secondaryTechniques: ['acceptance_willingness', 'body_scan', 'mindfulness_observation'],
    avoidTechniques: ['problem_solving', 'functional_analysis'], // Demasiado cognitivo
    relatedPatterns: ['magnification', 'all_or_nothing', 'mental_filter', 'overgeneralization'],
    urgencyLevel: 'high',
    validationMessage: 'Cuando todo parece demasiado, una sola cosa pequeÃ±a es suficiente.',
    approachStyle: 'gentle',
  },

  sad: {
    emotion: 'sad',
    primaryTechniques: ['behavioral_activation', 'activity_scheduling', 'self_compassion'],
    secondaryTechniques: ['micro_tasks', 'momentum_building', 'cognitive_restructuring'],
    avoidTechniques: [], // La tristeza generalmente puede tolerar cualquier tÃ©cnica
    relatedPatterns: ['all_or_nothing', 'emotional_reasoning', 'labeling', 'mental_filter'],
    urgencyLevel: 'medium',
    validationMessage: 'La tristeza es vÃ¡lida. A veces moverse un poco ayuda.',
    approachStyle: 'action', // La acciÃ³n puede mejorar el Ã¡nimo
  },

  frustrated: {
    emotion: 'frustrated',
    primaryTechniques: ['behavioral_activation', 'problem_solving', 'emotion_regulation_opposite_action'],
    secondaryTechniques: ['relaxation', 'cognitive_restructuring', 'distress_tolerance_tipp'],
    avoidTechniques: ['self_compassion'], // Puede sentirse condescendiente
    relatedPatterns: ['should_statements', 'all_or_nothing', 'labeling', 'mental_filter'],
    urgencyLevel: 'medium',
    validationMessage: 'La frustraciÃ³n tiene energÃ­a. Vamos a usarla a tu favor.',
    approachStyle: 'action',
  },

  guilty: {
    emotion: 'guilty',
    primaryTechniques: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'],
    secondaryTechniques: ['chain_analysis', 'micro_tasks', 'interpersonal_effectiveness_dear_man'],
    avoidTechniques: [],
    relatedPatterns: ['should_statements', 'personalization', 'magnification', 'disqualifying_positive'],
    urgencyLevel: 'medium',
    validationMessage: 'La culpa te dice que algo te importa. No te define.',
    approachStyle: 'cognitive',
  },

  hopeless: {
    emotion: 'hopeless',
    primaryTechniques: ['committed_action', 'behavioral_activation', 'self_compassion'],
    secondaryTechniques: ['values_clarification', 'momentum_building', 'activity_scheduling'],
    avoidTechniques: ['problem_solving', 'cognitive_restructuring'], // Muy demandantes
    relatedPatterns: ['fortune_telling', 'overgeneralization', 'labeling', 'mental_filter'],
    urgencyLevel: 'high',
    validationMessage: 'La desesperanza miente. Un pequeÃ±o paso puede cambiar la perspectiva.',
    approachStyle: 'gentle',
  },

  angry: {
    emotion: 'angry',
    primaryTechniques: ['urge_surfing', 'distress_tolerance_tipp', 'emotion_regulation_opposite_action'],
    secondaryTechniques: ['mindful_breathing', 'interpersonal_effectiveness_dear_man', 'cognitive_restructuring'],
    avoidTechniques: ['self_compassion'], // Puede ser contraproducente en el momento
    relatedPatterns: ['should_statements', 'mind_reading', 'personalization'],
    urgencyLevel: 'medium',
    validationMessage: 'El enojo tiene un mensaje. EscuchÃ©moslo y luego decidamos.',
    approachStyle: 'somatic', // Primero regular el cuerpo
  },

  ashamed: {
    emotion: 'ashamed',
    primaryTechniques: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'],
    secondaryTechniques: ['self_as_context', 'mindfulness_observation', 'present_moment_anchor'],
    avoidTechniques: ['functional_analysis'], // Puede intensificar el escrutinio
    relatedPatterns: ['labeling', 'mind_reading', 'personalization', 'magnification'],
    urgencyLevel: 'high',
    validationMessage: 'La vergÃ¼enza es dolorosa pero no te define. Mereces compasiÃ³n.',
    approachStyle: 'gentle',
  },
};

// ============================================================================
// VALIDACIÃ“N DE COMPLETITUD
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  coverage: {
    emotionsCovered: number;
    emotionsTotal: number;
    techniquesCovered: number;
    techniquesTotal: number;
  };
}

/**
 * Valida que todas las emociones tengan mapeo a tÃ©cnicas
 * y que no haya inconsistencias
 */
export function validateEmotionTechniqueMappings(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allEmotions: ThoughtEmotion[] = [
    'anxious', 'sad', 'frustrated', 'guilty',
    'overwhelmed', 'angry', 'hopeless', 'ashamed'
  ];

  const allTechniques: TCCTechnique[] = [
    'behavioral_activation', 'gradual_exposure', 'cognitive_restructuring',
    'activity_scheduling', 'functional_analysis', 'micro_tasks',
    'momentum_building', 'self_compassion', 'problem_solving', 'relaxation',
    'chain_analysis', 'distress_tolerance_tipp',
    'emotion_regulation_opposite_action', 'interpersonal_effectiveness_dear_man',
    'cognitive_defusion', 'acceptance_willingness',
    'values_clarification', 'committed_action', 'self_as_context',
    'mindful_breathing', 'body_scan', 'urge_surfing', 'present_moment_anchor'
  ];

  const coveredEmotions = new Set<ThoughtEmotion>();
  const techniqueUsage = new Map<TCCTechnique, number>();

  // Inicializar contadores de tÃ©cnicas
  allTechniques.forEach(t => techniqueUsage.set(t, 0));

  // Validar cada emociÃ³n
  for (const emotion of allEmotions) {
    const mapping = EMOTION_TECHNIQUE_MAP[emotion];

    if (!mapping) {
      errors.push(`FALTA MAPEO: EmociÃ³n "${emotion}" no tiene tÃ©cnicas asignadas`);
      continue;
    }

    coveredEmotions.add(emotion);

    // Verificar que tiene al menos una tÃ©cnica primaria
    if (!mapping.primaryTechniques || mapping.primaryTechniques.length === 0) {
      errors.push(`ERROR: EmociÃ³n "${emotion}" no tiene tÃ©cnicas primarias`);
    }

    // Verificar que no hay tÃ©cnicas repetidas entre primary y secondary
    const overlap = mapping.primaryTechniques.filter(
      t => mapping.secondaryTechniques.includes(t)
    );
    if (overlap.length > 0) {
      warnings.push(
        `DUPLICADO: EmociÃ³n "${emotion}" tiene tÃ©cnicas en primary y secondary: ${overlap.join(', ')}`
      );
    }

    // Verificar que las tÃ©cnicas a evitar no estÃ¡n en las recomendadas
    const conflictAvoid = mapping.avoidTechniques.filter(
      t => mapping.primaryTechniques.includes(t) || mapping.secondaryTechniques.includes(t)
    );
    if (conflictAvoid.length > 0) {
      errors.push(
        `CONFLICTO: EmociÃ³n "${emotion}" evita tÃ©cnicas que tambiÃ©n recomienda: ${conflictAvoid.join(', ')}`
      );
    }

    // Contar uso de tÃ©cnicas
    mapping.primaryTechniques.forEach(t => {
      techniqueUsage.set(t, (techniqueUsage.get(t) || 0) + 2); // Peso doble para primarias
    });
    mapping.secondaryTechniques.forEach(t => {
      techniqueUsage.set(t, (techniqueUsage.get(t) || 0) + 1);
    });
  }

  // Verificar que todas las tÃ©cnicas son usadas al menos una vez
  for (const [technique, count] of techniqueUsage.entries()) {
    if (count === 0) {
      warnings.push(`HUÃ‰RFANA: TÃ©cnica "${technique}" no estÃ¡ recomendada para ninguna emociÃ³n`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    coverage: {
      emotionsCovered: coveredEmotions.size,
      emotionsTotal: allEmotions.length,
      techniquesCovered: Array.from(techniqueUsage.values()).filter(v => v > 0).length,
      techniquesTotal: allTechniques.length,
    }
  };
}

// ============================================================================
// HELPERS PARA INTEGRACIÃ“N CON TCCENGINE
// ============================================================================

/**
 * Obtiene el mapeo de tÃ©cnicas para una emociÃ³n dada
 */
export function getEmotionTechniqueMapping(
  emotion: ThoughtEmotion
): EmotionTechniqueMapping | null {
  return EMOTION_TECHNIQUE_MAP[emotion] || null;
}

/**
 * Obtiene las tÃ©cnicas primarias recomendadas para una emociÃ³n
 */
export function getPrimaryTechniquesForEmotion(
  emotion: ThoughtEmotion
): TCCTechnique[] {
  const mapping = EMOTION_TECHNIQUE_MAP[emotion];
  return mapping?.primaryTechniques || [];
}

/**
 * Verifica si una tÃ©cnica debe evitarse para una emociÃ³n dada
 */
export function shouldAvoidTechnique(
  technique: TCCTechnique,
  emotion: ThoughtEmotion
): boolean {
  const mapping = EMOTION_TECHNIQUE_MAP[emotion];
  return mapping?.avoidTechniques.includes(technique) || false;
}

/**
 * Obtiene el estilo de aproximaciÃ³n recomendado para una emociÃ³n
 */
export function getApproachStyleForEmotion(
  emotion: ThoughtEmotion
): ApproachStyle {
  const mapping = EMOTION_TECHNIQUE_MAP[emotion];
  return mapping?.approachStyle || 'gentle';
}

/**
 * Obtiene mensaje de validaciÃ³n para una emociÃ³n
 */
export function getValidationMessageForEmotion(
  emotion: ThoughtEmotion
): string {
  const mapping = EMOTION_TECHNIQUE_MAP[emotion];
  return mapping?.validationMessage || 'Tus sentimientos son vÃ¡lidos.';
}

/**
 * Calcula el score de una tÃ©cnica para una emociÃ³n dada
 * Usado para integrar con el motor de selecciÃ³n
 */
export function calculateTechniqueScoreForEmotion(
  technique: TCCTechnique,
  emotion: ThoughtEmotion
): number {
  const mapping = EMOTION_TECHNIQUE_MAP[emotion];

  if (!mapping) return 0;

  // TÃ©cnica primaria: score alto
  if (mapping.primaryTechniques.includes(technique)) {
    return 8;
  }

  // TÃ©cnica secundaria: score moderado
  if (mapping.secondaryTechniques.includes(technique)) {
    return 4;
  }

  // TÃ©cnica a evitar: penalizaciÃ³n
  if (mapping.avoidTechniques.includes(technique)) {
    return -10;
  }

  // TÃ©cnica neutral
  return 0;
}

/**
 * Obtiene bonus/penalizaciÃ³n de estilo de aproximaciÃ³n
 */
export function getApproachStyleBonus(
  technique: TCCTechnique,
  approachStyle: ApproachStyle
): number {
  const styleBonus: Record<ApproachStyle, Record<TCCTechnique, number>> = {
    somatic: {
      relaxation: 5,
      gradual_exposure: 2,
      cognitive_restructuring: -3,
      behavioral_activation: 0,
      activity_scheduling: 0,
      functional_analysis: -2,
      micro_tasks: 1,
      momentum_building: 0,
      self_compassion: 2,
      problem_solving: -3,
    },
    gentle: {
      micro_tasks: 4,
      self_compassion: 4,
      relaxation: 3,
      behavioral_activation: 1,
      gradual_exposure: 2,
      momentum_building: 2,
      activity_scheduling: 1,
      cognitive_restructuring: -2,
      functional_analysis: -3,
      problem_solving: -4,
    },
    action: {
      behavioral_activation: 5,
      micro_tasks: 3,
      momentum_building: 3,
      problem_solving: 2,
      activity_scheduling: 2,
      gradual_exposure: 1,
      relaxation: -1,
      self_compassion: -1,
      cognitive_restructuring: 0,
      functional_analysis: 0,
    },
    cognitive: {
      cognitive_restructuring: 5,
      functional_analysis: 3,
      self_compassion: 2,
      behavioral_activation: 1,
      activity_scheduling: 1,
      micro_tasks: 0,
      problem_solving: 2,
      gradual_exposure: 0,
      momentum_building: 0,
      relaxation: 0,
    },
  };

  return styleBonus[approachStyle]?.[technique] ?? 0;
}

// ============================================================================
// DETECCIÃ“N DE EMOCIÃ“N DESDE MOOD - MEJORA #3: MATRIZ PROBABILÃSTICA
// ============================================================================

import type { MoodLevel } from '../db/database';

/**
 * Matriz probabilÃ­stica 5Ã—8 que mapea cada MoodLevel a probabilidades
 * de cada emociÃ³n. Las probabilidades suman 1.0 para cada mood.
 *
 * MEJORA #3: En lugar de un mapeo 1:1 (que no tiene sentido, ej: goodâ†’anxious),
 * usamos una distribuciÃ³n probabilÃ­stica que refleja la realidad:
 * - Con mood "good", es poco probable sentir hopeless, pero posible estar anxious
 * - Con mood "very_bad", hay alta probabilidad de hopeless/sad, baja de frustrated
 */
export const MOOD_EMOTION_MATRIX: Record<MoodLevel, Record<ThoughtEmotion, number>> = {
  very_bad: {
    hopeless: 0.35,     // Alta probabilidad
    sad: 0.25,          // ComÃºn
    overwhelmed: 0.20,  // Frecuente
    anxious: 0.08,      // Posible
    guilty: 0.05,       // Menos comÃºn
    ashamed: 0.04,      // Menos comÃºn
    frustrated: 0.02,   // Raro (frustraciÃ³n implica mÃ¡s energÃ­a)
    angry: 0.01,        // Raro
  },
  bad: {
    sad: 0.28,          // MÃ¡s comÃºn
    anxious: 0.22,      // Muy frecuente
    overwhelmed: 0.18,  // Frecuente
    frustrated: 0.12,   // Moderado
    guilty: 0.08,       // Presente
    hopeless: 0.06,     // Posible pero menos que very_bad
    ashamed: 0.04,      // Menos comÃºn
    angry: 0.02,        // Posible
  },
  neutral: {
    anxious: 0.25,      // La ansiedad puede coexistir con mood neutral
    frustrated: 0.25,   // FrustraciÃ³n moderada
    overwhelmed: 0.18,  // Puede estar abrumado pero "funcionando"
    sad: 0.12,          // Tristeza suave
    guilty: 0.10,       // Culpa presente
    angry: 0.05,        // IrritaciÃ³n
    hopeless: 0.03,     // Poco probable
    ashamed: 0.02,      // Raro
  },
  good: {
    anxious: 0.35,      // La ansiedad puede existir con buen Ã¡nimo
    frustrated: 0.25,   // Puede estar bien pero frustrado con algo
    guilty: 0.15,       // Culpa por no hacer algo a pesar de estar bien
    overwhelmed: 0.10,  // Menos probable
    angry: 0.08,        // IrritaciÃ³n pasajera
    sad: 0.04,          // Poco probable
    ashamed: 0.02,      // Raro
    hopeless: 0.01,     // Muy raro
  },
  very_good: {
    anxious: 0.40,      // Ansiedad anticipatoria incluso estando bien
    frustrated: 0.25,   // Puede querer hacer mÃ¡s
    guilty: 0.15,       // "DeberÃ­a aprovechar mÃ¡s"
    angry: 0.10,        // IndignaciÃ³n por injusticias
    overwhelmed: 0.05,  // Poco probable
    sad: 0.03,          // Raro
    ashamed: 0.01,      // Muy raro
    hopeless: 0.01,     // Casi nunca
  },
};

/**
 * Resultado de la inferencia de emociÃ³n
 */
export interface EmotionInferenceResult {
  /** EmociÃ³n mÃ¡s probable */
  primaryEmotion: ThoughtEmotion;
  /** Probabilidad de la emociÃ³n primaria (0-1) */
  primaryProbability: number;
  /** Segunda emociÃ³n mÃ¡s probable */
  secondaryEmotion: ThoughtEmotion;
  /** Probabilidad de la emociÃ³n secundaria */
  secondaryProbability: number;
  /** DistribuciÃ³n completa de probabilidades */
  distribution: Record<ThoughtEmotion, number>;
  /** Confianza en la inferencia (mayor si hay contexto) */
  confidence: number;
}

/**
 * Modificadores de probabilidad basados en barreras detectadas.
 * Estos valores se suman a las probabilidades base y luego se renormalizan.
 */
const BARRIER_EMOTION_MODIFIERS: Record<string, Partial<Record<ThoughtEmotion, number>>> = {
  anxiety: { anxious: 0.40, overwhelmed: 0.15 },
  overwhelm: { overwhelmed: 0.45, anxious: 0.10 },
  guilt: { guilty: 0.45, ashamed: 0.10 },
  frustration: { frustrated: 0.40, angry: 0.15 },
  low_energy: { sad: 0.30, hopeless: 0.20 },
  procrastination: { anxious: 0.25, guilty: 0.20, overwhelmed: 0.10 },
  avoidance: { anxious: 0.30, overwhelmed: 0.15 },
  perfectionism_paralysis: { anxious: 0.30, ashamed: 0.15, frustrated: 0.10 },
  all_or_nothing: { frustrated: 0.20, anxious: 0.15 },
  catastrophizing: { anxious: 0.35, hopeless: 0.15 },
  should_statements: { guilty: 0.30, frustrated: 0.20 },
  decision_fatigue: { overwhelmed: 0.35, frustrated: 0.15 },
  messy_environment: { overwhelmed: 0.30, anxious: 0.15 },
  lack_of_time: { anxious: 0.25, overwhelmed: 0.25 },
};

/**
 * Modificadores basados en palabras clave en el pensamiento reciente
 */
const THOUGHT_KEYWORD_MODIFIERS: Array<{
  keywords: string[];
  modifiers: Partial<Record<ThoughtEmotion, number>>;
}> = [
  {
    keywords: ['no puedo', 'imposible', 'nunca', 'sin salida'],
    modifiers: { hopeless: 0.30, overwhelmed: 0.15 },
  },
  {
    keywords: ['preocupado', 'nervioso', 'miedo', 'quÃ© pasarÃ¡'],
    modifiers: { anxious: 0.35 },
  },
  {
    keywords: ['culpa', 'deberÃ­a', 'tendrÃ­a', 'fallÃ©'],
    modifiers: { guilty: 0.30, ashamed: 0.10 },
  },
  {
    keywords: ['triste', 'solo', 'vacÃ­o', 'pÃ©rdida'],
    modifiers: { sad: 0.35, hopeless: 0.10 },
  },
  {
    keywords: ['enojado', 'furioso', 'injusto', 'rabia'],
    modifiers: { angry: 0.35, frustrated: 0.15 },
  },
  {
    keywords: ['demasiado', 'abrumado', 'caos', 'mucho'],
    modifiers: { overwhelmed: 0.35, anxious: 0.10 },
  },
  {
    keywords: ['frustrado', 'harto', 'cansado de'],
    modifiers: { frustrated: 0.35, angry: 0.10 },
  },
  {
    keywords: ['vergÃ¼enza', 'humillaciÃ³n', 'ridÃ­culo'],
    modifiers: { ashamed: 0.40, guilty: 0.10 },
  },
];

/**
 * Normaliza un objeto de probabilidades para que sumen 1.0
 */
function normalizeDistribution(
  distribution: Record<ThoughtEmotion, number>
): Record<ThoughtEmotion, number> {
  const total = Object.values(distribution).reduce((sum, p) => sum + p, 0);

  if (total === 0) {
    // DistribuciÃ³n uniforme si todo es 0
    const emotions = Object.keys(distribution) as ThoughtEmotion[];
    const uniform = 1 / emotions.length;
    return Object.fromEntries(emotions.map(e => [e, uniform])) as Record<ThoughtEmotion, number>;
  }

  const normalized: Record<ThoughtEmotion, number> = {} as Record<ThoughtEmotion, number>;
  for (const [emotion, prob] of Object.entries(distribution)) {
    normalized[emotion as ThoughtEmotion] = Math.max(0, prob) / total;
  }

  return normalized;
}

/**
 * Infiere la emociÃ³n mÃ¡s probable basÃ¡ndose en mood y contexto.
 * MEJORA #3: Usa matriz probabilÃ­stica en lugar de mapeo 1:1.
 *
 * @returns Resultado completo con distribuciÃ³n de probabilidades
 */
export function inferEmotionFromMoodAdvanced(
  mood: MoodLevel,
  context?: {
    recentThought?: string;
    barrier?: string;
  }
): EmotionInferenceResult {
  // 1. Empezar con la distribuciÃ³n base del mood
  const baseDistribution = { ...MOOD_EMOTION_MATRIX[mood] };
  let confidence = 0.5; // Confianza base sin contexto

  // 2. Aplicar modificadores de barrera si existe
  if (context?.barrier && BARRIER_EMOTION_MODIFIERS[context.barrier]) {
    const modifiers = BARRIER_EMOTION_MODIFIERS[context.barrier];
    for (const [emotion, modifier] of Object.entries(modifiers)) {
      baseDistribution[emotion as ThoughtEmotion] += modifier;
    }
    confidence += 0.25; // Aumentar confianza con contexto de barrera
  }

  // 3. Aplicar modificadores de pensamiento si existe
  if (context?.recentThought) {
    const normalizedThought = context.recentThought.toLowerCase();

    for (const { keywords, modifiers } of THOUGHT_KEYWORD_MODIFIERS) {
      const matchCount = keywords.filter(kw => normalizedThought.includes(kw)).length;
      if (matchCount > 0) {
        // Aplicar modificador proporcional al nÃºmero de matches
        const multiplier = Math.min(matchCount, 2); // Cap en 2x
        for (const [emotion, modifier] of Object.entries(modifiers)) {
          baseDistribution[emotion as ThoughtEmotion] += modifier * multiplier;
        }
        confidence += 0.1 * matchCount; // Aumentar confianza por cada match
      }
    }
  }

  // 4. Normalizar la distribuciÃ³n
  const normalizedDistribution = normalizeDistribution(baseDistribution);

  // 5. Encontrar las dos emociones mÃ¡s probables
  const sortedEmotions = (Object.entries(normalizedDistribution) as [ThoughtEmotion, number][])
    .sort((a, b) => b[1] - a[1]);

  const [primaryEmotion, primaryProbability] = sortedEmotions[0];
  const [secondaryEmotion, secondaryProbability] = sortedEmotions[1];

  return {
    primaryEmotion,
    primaryProbability,
    secondaryEmotion,
    secondaryProbability,
    distribution: normalizedDistribution,
    confidence: Math.min(confidence, 1), // Cap en 1.0
  };
}

/**
 * VersiÃ³n simplificada que solo retorna la emociÃ³n mÃ¡s probable.
 * Mantiene compatibilidad con el cÃ³digo existente.
 *
 * MEJORA #3: Ahora usa la matriz probabilÃ­stica internamente.
 */
export function inferEmotionFromMood(
  mood: MoodLevel,
  context?: {
    recentThought?: string;
    barrier?: string;
  }
): ThoughtEmotion {
  const result = inferEmotionFromMoodAdvanced(mood, context);
  return result.primaryEmotion;
}

/**
 * Obtiene la distribuciÃ³n completa de probabilidades para un mood
 */
export function getEmotionProbabilities(
  mood: MoodLevel,
  context?: {
    recentThought?: string;
    barrier?: string;
  }
): Record<ThoughtEmotion, number> {
  const result = inferEmotionFromMoodAdvanced(mood, context);
  return result.distribution;
}

/**
 * Verifica si una emociÃ³n es probable dado el mood
 * (probabilidad > umbral)
 */
export function isEmotionLikely(
  emotion: ThoughtEmotion,
  mood: MoodLevel,
  threshold: number = 0.15
): boolean {
  const distribution = MOOD_EMOTION_MATRIX[mood];
  return distribution[emotion] >= threshold;
}

// ============================================================================
// EXPORTAR CONSTANTES PARA TESTING
// ============================================================================

export const ALL_EMOTIONS: ThoughtEmotion[] = [
  'anxious', 'sad', 'frustrated', 'guilty',
  'overwhelmed', 'angry', 'hopeless', 'ashamed'
];

export const ALL_TECHNIQUES: TCCTechnique[] = [
  'behavioral_activation', 'gradual_exposure', 'cognitive_restructuring',
  'activity_scheduling', 'functional_analysis', 'micro_tasks',
  'momentum_building', 'self_compassion', 'problem_solving', 'relaxation'
];
