// @ts-nocheck
/**
 * TCC Engine - Motor Central de Intervenciones
 *
 * Este servicio analiza el contexto del usuario y sugiere automÃ¡ticamente
 * la tÃ©cnica TCC mÃ¡s apropiada basÃ¡ndose en:
 * - Estado emocional actual
 * - Barreras detectadas
 * - Historial de efectividad
 * - Momento del dÃ­a
 * - Patrones de comportamiento
 *
 * Principio TCC: "La tÃ©cnica correcta en el momento correcto"
 */

import {
  db,
  TCCTechnique,
  BarrierCategory,
  UnifiedBarrier,
  MoodLevel,
  EnergyLevel,
  RouteType,
  TimeSlot,
  TIME_SLOT_RANGES,
  TCCInterventionLog,
  TCCEffectivenessProfile,
  CognitivePattern,
  ThoughtEmotion,
} from '../db/database';

import {
  EMOTION_TECHNIQUE_MAP,
  calculateTechniqueScoreForEmotion,
  getApproachStyleBonus,
  inferEmotionFromMood,
  getValidationMessageForEmotion,
  type EmotionTechniqueMapping,
  type ApproachStyle,
} from './EmotionTechniqueMapping';

import {
  getCurrentTimeRecommendations,
  checkCurrentTimeWarnings,
  type TemporalContext,
} from './TemporalPatternAnalysis';

import {
  BEHAVIOR_FUNCTION_INFO,
  type BehaviorFunction,
  analyzeBehaviorFunction,
  generateInterventionPoints,
  type DeepFunctionalAnalysis,
} from './DeepFunctionalAnalysis';
import { getV3GuidanceForEngineTechnique, ENGINE_TO_V3_MAP } from './tccEngineKnowledgeV3Bridge';

// ============================================================================
// BARRERAS UNIFICADAS - Base de conocimiento
// ============================================================================

export const UNIFIED_BARRIERS: Record<string, UnifiedBarrier> = {
  // === BARRERAS COGNITIVAS ===
  all_or_nothing: {
    id: 'all_or_nothing',
    category: 'cognitive',
    name: 'Pensamiento Todo o Nada',
    description: 'Ves las cosas en blanco y negro, sin matices',
    indicators: ['perfecto', 'nunca', 'siempre', 'todo', 'nada', 'completamente'],
    recommendedTechniques: [
      'cognitive_restructuring',
      'cognitive_defusion',
      'gradual_exposure',
      'micro_tasks',
    ],
    detectionQuestions: ['Â¿Sientes que si no lo haces perfecto, no vale la pena?'],
    validationMessages: ['Es normal querer hacer las cosas bien. El progreso tambiÃ©n cuenta.'],
    emoji: 'âš«âšª',
    color: 'purple',
  },
  catastrophizing: {
    id: 'catastrophizing',
    category: 'cognitive',
    name: 'CatastrofizaciÃ³n',
    description: 'Imaginas el peor escenario posible',
    indicators: ['desastre', 'terrible', 'horrible', 'no puedo', 'imposible'],
    recommendedTechniques: [
      'cognitive_restructuring',
      'cognitive_defusion',
      'acceptance_willingness',
      'functional_analysis',
      'problem_solving',
    ],
    detectionQuestions: ['Â¿EstÃ¡s imaginando que todo saldrÃ¡ muy mal?'],
    validationMessages: ['Los pensamientos catastrÃ³ficos son molestos pero no predicen el futuro.'],
    emoji: 'ðŸŒ‹',
    color: 'red',
  },
  should_statements: {
    id: 'should_statements',
    category: 'cognitive',
    name: 'Autoexigencia RÃ­gida',
    description: 'Te impones reglas muy estrictas',
    indicators: ['deberÃ­a', 'tendrÃ­a que', 'debo', 'tengo que', 'no deberÃ­a'],
    recommendedTechniques: [
      'cognitive_restructuring',
      'self_compassion',
      'emotion_regulation_opposite_action',
      'behavioral_activation',
    ],
    detectionQuestions: ['Â¿Te estÃ¡s exigiendo mÃ¡s de lo razonable?'],
    validationMessages: ['Ser amable contigo mismo no es debilidad, es sabidurÃ­a.'],
    emoji: 'ðŸ“',
    color: 'orange',
  },

  // === BARRERAS EMOCIONALES ===
  anxiety: {
    id: 'anxiety',
    category: 'emotional',
    name: 'Ansiedad',
    description: 'Sientes nerviosismo o preocupaciÃ³n intensa',
    indicators: ['nervioso', 'preocupado', 'ansioso', 'agobiado', 'inquieto'],
    recommendedTechniques: [
      'gradual_exposure',
      'distress_tolerance_tipp',
      'acceptance_willingness',
      'cognitive_defusion',
      'mindful_breathing',
      'relaxation',
      'mindfulness_observation',
      'micro_tasks',
      'behavioral_activation',
    ],
    detectionQuestions: ['Â¿Sientes tensiÃ³n o nerviosismo al pensar en la tarea?'],
    validationMessages: ['La ansiedad es incÃ³moda pero no peligrosa. Puedes actuar con ella presente.'],
    emoji: 'ðŸ˜°',
    color: 'yellow',
  },
  guilt: {
    id: 'guilt',
    category: 'emotional',
    name: 'Culpa',
    description: 'Te sientes mal por no haber hecho algo',
    indicators: ['culpable', 'mal', 'debÃ­', 'no hice', 'fallÃ©'],
    recommendedTechniques: [
      'self_compassion',
      'chain_analysis',
      'cognitive_restructuring',
      'interpersonal_effectiveness_dear_man',
      'behavioral_activation',
    ],
    detectionQuestions: ['Â¿Te sientes culpable por cosas pendientes?'],
    validationMessages: ['La culpa te dice que algo te importa. Ahora puedes elegir quÃ© hacer.'],
    emoji: 'ðŸ˜”',
    color: 'blue',
  },
  overwhelm: {
    id: 'overwhelm',
    category: 'emotional',
    name: 'Abrumamiento',
    description: 'Sientes que es demasiado',
    indicators: ['demasiado', 'abrumado', 'no puedo', 'mucho', 'caos'],
    recommendedTechniques: [
      'micro_tasks',
      'distress_tolerance_tipp',
      'acceptance_willingness',
      'committed_action',
      'present_moment_anchor',
      'activity_scheduling',
      'problem_solving',
      'gradual_exposure',
    ],
    detectionQuestions: ['Â¿Sientes que hay demasiado por hacer?'],
    validationMessages: ['Cuando todo parece mucho, una sola cosa pequeÃ±a es suficiente.'],
    emoji: 'ðŸŒŠ',
    color: 'blue',
  },
  frustration: {
    id: 'frustration',
    category: 'emotional',
    name: 'FrustraciÃ³n',
    description: 'Sientes irritaciÃ³n o enojo',
    indicators: ['frustrado', 'enojado', 'molesto', 'harto', 'cansado de'],
    recommendedTechniques: [
      'behavioral_activation',
      'emotion_regulation_opposite_action',
      'problem_solving',
      'distress_tolerance_tipp',
      'urge_surfing',
      'relaxation',
    ],
    detectionQuestions: ['Â¿Te sientes frustrado con la situaciÃ³n?'],
    validationMessages: ['La frustraciÃ³n es energÃ­a. Vamos a usarla a tu favor.'],
    emoji: 'ðŸ˜¤',
    color: 'orange',
  },

  // === BARRERAS CONDUCTUALES ===
  avoidance: {
    id: 'avoidance',
    category: 'behavioral',
    name: 'EvitaciÃ³n',
    description: 'Tiendes a evitar o postergar',
    indicators: ['despuÃ©s', 'luego', 'maÃ±ana', 'no ahora', 'evito'],
    recommendedTechniques: [
      'behavioral_activation',
      'gradual_exposure',
      'functional_analysis',
      'chain_analysis',
    ],
    detectionQuestions: ['Â¿Has estado evitando esta tarea?'],
    validationMessages: ['Evitar es humano. Dar un pequeÃ±o paso rompe el ciclo.'],
    emoji: 'ðŸ™ˆ',
    color: 'gray',
  },
  procrastination: {
    id: 'procrastination',
    category: 'behavioral',
    name: 'ProcrastinaciÃ³n',
    description: 'Postergas a pesar de querer hacerlo',
    indicators: ['procrastino', 'postergando', 'deberÃ­a haber', 'llevo dÃ­as'],
    recommendedTechniques: ['behavioral_activation', 'micro_tasks', 'momentum_building', 'activity_scheduling'],
    detectionQuestions: ['Â¿Llevas tiempo postergando esto?'],
    validationMessages: ['La procrastinaciÃ³n no es pereza, es una forma de manejar emociones difÃ­ciles.'],
    emoji: 'â°',
    color: 'orange',
  },
  perfectionism_paralysis: {
    id: 'perfectionism_paralysis',
    category: 'behavioral',
    name: 'ParÃ¡lisis por Perfeccionismo',
    description: 'No empiezas porque no puedes hacerlo perfecto',
    indicators: ['perfecto', 'bien', 'correcto', 'como debe ser'],
    recommendedTechniques: [
      'micro_tasks',
      'gradual_exposure',
      'cognitive_restructuring',
      'emotion_regulation_opposite_action',
    ],
    detectionQuestions: ['Â¿No empiezas porque no puedes hacerlo perfecto?'],
    validationMessages: ['Hecho es mejor que perfecto. Siempre puedes mejorar despuÃ©s.'],
    emoji: 'âœ¨',
    color: 'purple',
  },

  // === BARRERAS FÃSICAS/ENERGÃ‰TICAS ===
  low_energy: {
    id: 'low_energy',
    category: 'physical',
    name: 'Baja EnergÃ­a',
    description: 'Te sientes sin fuerzas fÃ­sicas',
    indicators: ['cansado', 'agotado', 'sin energÃ­a', 'exhausto'],
    recommendedTechniques: ['micro_tasks', 'body_scan', 'committed_action', 'activity_scheduling', 'self_compassion'],
    detectionQuestions: ['Â¿Tu cuerpo se siente cansado?'],
    validationMessages: ['Tu cuerpo necesita respeto. Una micro-tarea es suficiente hoy.'],
    emoji: 'ðŸ”‹',
    color: 'gray',
  },
  decision_fatigue: {
    id: 'decision_fatigue',
    category: 'physical',
    name: 'Fatiga de Decisiones',
    description: 'EstÃ¡s agotado de tomar decisiones',
    indicators: ['no sÃ© quÃ©', 'no puedo decidir', 'cualquier cosa'],
    recommendedTechniques: [
      'values_clarification',
      'present_moment_anchor',
      'activity_scheduling',
      'micro_tasks',
      'momentum_building',
    ],
    detectionQuestions: ['Â¿Te cuesta decidir quÃ© hacer primero?'],
    validationMessages: ['Cuando decidir es difÃ­cil, te darÃ© opciones claras.'],
    emoji: 'ðŸ¤¯',
    color: 'purple',
  },

  // === BARRERAS AMBIENTALES ===
  messy_environment: {
    id: 'messy_environment',
    category: 'environmental',
    name: 'Entorno Desordenado',
    description: 'El desorden te paraliza',
    indicators: ['caos', 'desorden', 'no sÃ© por dÃ³nde', 'todo estÃ¡'],
    recommendedTechniques: ['gradual_exposure', 'micro_tasks', 'momentum_building'],
    detectionQuestions: ['Â¿El desorden te abruma visualmente?'],
    validationMessages: ['El desorden no se creÃ³ en un dÃ­a y no tiene que irse en uno.'],
    emoji: 'ðŸŒªï¸',
    color: 'brown',
  },
  lack_of_time: {
    id: 'lack_of_time',
    category: 'environmental',
    name: 'Falta de Tiempo',
    description: 'Sientes que no tienes tiempo',
    indicators: ['no tengo tiempo', 'estoy ocupado', 'no me da'],
    recommendedTechniques: ['micro_tasks', 'committed_action', 'activity_scheduling', 'problem_solving'],
    detectionQuestions: ['Â¿Sientes que no tienes tiempo suficiente?'],
    validationMessages: ['5 minutos es tiempo. Empecemos por ahÃ­.'],
    emoji: 'âŒ›',
    color: 'blue',
  },
};

// ============================================================================
// TÃ‰CNICAS TCC - InformaciÃ³n y configuraciÃ³n
// ============================================================================

export const TCC_TECHNIQUES_INFO: Record<TCCTechnique, {
  name: string;
  description: string;
  emoji: string;
  durationMinutes: number;
  bestFor: BarrierCategory[];
  requiresHighEnergy: boolean;
  route: string;  // Ruta en la app
}> = {
  behavioral_activation: {
    name: 'ActivaciÃ³n Conductual',
    description: 'La acciÃ³n genera motivaciÃ³n, no al revÃ©s',
    emoji: 'ðŸš€',
    durationMinutes: 5,
    bestFor: ['emotional', 'behavioral'],
    requiresHighEnergy: false,
    route: '/task/execute',
  },
  gradual_exposure: {
    name: 'ExposiciÃ³n Gradual',
    description: 'Enfrentar gradualmente lo que evitas',
    emoji: 'ðŸªœ',
    durationMinutes: 10,
    bestFor: ['emotional', 'behavioral', 'environmental'],
    requiresHighEnergy: false,
    route: '/workshop/exposure',
  },
  cognitive_restructuring: {
    name: 'Detective de Pensamientos',
    description: 'Investigar y transformar pensamientos negativos',
    emoji: 'ðŸ”',
    durationMinutes: 10,
    bestFor: ['cognitive'],
    requiresHighEnergy: false,
    route: '/library/detective',
  },
  activity_scheduling: {
    name: 'Planificar Actividades',
    description: 'Organizar el dÃ­a reduce la carga mental',
    emoji: 'ðŸ“…',
    durationMinutes: 5,
    bestFor: ['behavioral', 'environmental', 'physical'],
    requiresHighEnergy: false,
    route: '/workshop/schedule',
  },
  functional_analysis: {
    name: 'AnÃ¡lisis ABC',
    description: 'Entender quÃ© dispara y mantiene el comportamiento',
    emoji: 'ðŸ”¬',
    durationMinutes: 8,
    bestFor: ['behavioral', 'cognitive'],
    requiresHighEnergy: false,
    route: '/library/analysis',
  },
  micro_tasks: {
    name: 'Micro-Tareas',
    description: 'Tareas de 2-5 minutos para crear momentum',
    emoji: 'âœ¨',
    durationMinutes: 3,
    bestFor: ['emotional', 'behavioral', 'physical'],
    requiresHighEnergy: false,
    route: '/task/execute',
  },
  momentum_building: {
    name: 'Construir Momentum',
    description: 'Empezar con lo mÃ¡s fÃ¡cil',
    emoji: 'ðŸŽ¯',
    durationMinutes: 5,
    bestFor: ['behavioral', 'physical'],
    requiresHighEnergy: false,
    route: '/task/execute',
  },
  self_compassion: {
    name: 'Auto-CompasiÃ³n',
    description: 'Tratarte con la amabilidad que darÃ­as a un amigo',
    emoji: 'ðŸ’š',
    durationMinutes: 3,
    bestFor: ['emotional', 'cognitive'],
    requiresHighEnergy: false,
    route: '/library/self-compassion',
  },
  mindfulness_observation: {
    name: 'Observacion Mindful',
    description: 'Observar pensamientos y sensaciones sin juicio ni fusion',
    emoji: '🧘',
    durationMinutes: 8,
    bestFor: ['emotional', 'cognitive'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  mindful_breathing: {
    name: 'Respiracion Consciente',
    description: 'Usar la respiracion como ancla para regular activacion y foco',
    emoji: '🌬️',
    durationMinutes: 5,
    bestFor: ['emotional', 'physical'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  body_scan: {
    name: 'Body Scan',
    description: 'Recorrer el cuerpo para detectar y modular tension',
    emoji: '🫁',
    durationMinutes: 10,
    bestFor: ['physical', 'emotional'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  urge_surfing: {
    name: 'Urge Surfing',
    description: 'Surfear impulsos sin responder automaticamente',
    emoji: '🌊',
    durationMinutes: 7,
    bestFor: ['emotional', 'behavioral'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  present_moment_anchor: {
    name: 'Anclaje al Presente',
    description: 'Reorientar la atencion al aqui y ahora para cortar rumiacion',
    emoji: '📍',
    durationMinutes: 4,
    bestFor: ['cognitive', 'emotional'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  chain_analysis: {
    name: 'Analisis en Cadena (DBT)',
    description: 'Entender secuencia, detonantes y consecuencias para cortar la conducta problema',
    emoji: '⛓️',
    durationMinutes: 12,
    bestFor: ['behavioral', 'emotional', 'cognitive'],
    requiresHighEnergy: true,
    route: '/library/analysis',
  },
  distress_tolerance_tipp: {
    name: 'Tolerancia al Malestar (TIPP)',
    description: 'Bajar activacion intensa con regulacion fisiologica breve',
    emoji: '🧊',
    durationMinutes: 5,
    bestFor: ['emotional', 'physical'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  emotion_regulation_opposite_action: {
    name: 'Accion Opuesta (DBT)',
    description: 'Responder con una accion funcional contraria al impulso emocional',
    emoji: '↔️',
    durationMinutes: 8,
    bestFor: ['emotional', 'behavioral'],
    requiresHighEnergy: false,
    route: '/workshop/problem-solving',
  },
  interpersonal_effectiveness_dear_man: {
    name: 'Efectividad Interpersonal (DEAR MAN)',
    description: 'Pedir, negociar y poner limites con claridad y respeto',
    emoji: '🗣️',
    durationMinutes: 10,
    bestFor: ['behavioral', 'cognitive'],
    requiresHighEnergy: false,
    route: '/library/analysis',
  },
  cognitive_defusion: {
    name: 'Defusion Cognitiva (ACT)',
    description: 'Observar pensamientos como eventos mentales para reducir fusion',
    emoji: '🪶',
    durationMinutes: 8,
    bestFor: ['cognitive', 'emotional'],
    requiresHighEnergy: false,
    route: '/library/detective',
  },
  acceptance_willingness: {
    name: 'Aceptacion y Disposicion (ACT)',
    description: 'Abrir espacio al malestar y elegir acciones con sentido',
    emoji: '🌬️',
    durationMinutes: 10,
    bestFor: ['emotional', 'behavioral'],
    requiresHighEnergy: false,
    route: '/relax',
  },
  values_clarification: {
    name: 'Clarificacion de Valores (ACT)',
    description: 'Definir direccion personal para priorizar decisiones y habitos',
    emoji: '🧭',
    durationMinutes: 12,
    bestFor: ['cognitive', 'behavioral'],
    requiresHighEnergy: false,
    route: '/workshop/schedule',
  },
  committed_action: {
    name: 'Accion Comprometida (ACT)',
    description: 'Convertir valores en acciones graduales y sostenibles',
    emoji: '👣',
    durationMinutes: 10,
    bestFor: ['behavioral', 'environmental'],
    requiresHighEnergy: false,
    route: '/task/execute',
  },
  self_as_context: {
    name: 'Yo como Contexto (ACT)',
    description: 'Tomar perspectiva observadora para flexibilizar la respuesta emocional',
    emoji: '🌄',
    durationMinutes: 10,
    bestFor: ['cognitive', 'emotional'],
    requiresHighEnergy: false,
    route: '/library/detective',
  },
  problem_solving: {
    name: 'ResoluciÃ³n de Problemas',
    description: 'Dividir el problema en pasos manejables',
    emoji: 'ðŸ§©',
    durationMinutes: 10,
    bestFor: ['environmental', 'behavioral'],
    requiresHighEnergy: true,
    route: '/workshop/problem-solving',
  },
  relaxation: {
    name: 'TÃ©cnicas de RelajaciÃ³n',
    description: 'Calmar el cuerpo para calmar la mente',
    emoji: 'ðŸ§˜',
    durationMinutes: 5,
    bestFor: ['emotional', 'physical'],
    requiresHighEnergy: false,
    route: '/relax',
  },
};

// ============================================================================
// CONTEXTO DE USUARIO
// ============================================================================

export interface UserContext {
  userId: string;
  currentMood: MoodLevel;
  currentEnergy: EnergyLevel;
  currentRoute: RouteType;
  timeOfDay: TimeSlot;
  detectedBarriers: string[];
  recentThought?: string;
  recentPatterns?: CognitivePattern[];
  availableMinutes?: number;
  // Nuevo: emociÃ³n explÃ­cita del usuario (si fue seleccionada)
  currentEmotion?: ThoughtEmotion;
  // A-04: VinculaciÃ³n al plan de intervenciÃ³n
  objectiveId?: string;
  // A-02: AnÃ¡lisis funcional profundo para enriquecer recomendaciones
  functionalAnalysis?: Partial<DeepFunctionalAnalysis>;
  // Perfil clÃ­nico BDI-II (detectClinicalProfile)
  clinicalProfile?: {
    primaryTechnique: 'ac' | 'rc';
    profile: 'cognitive' | 'behavioral' | 'mixed' | 'neurovegetative';
    rationale: string;
  };
}

// ============================================================================
// RESULTADO DE INTERVENCIÃ“N SUGERIDA
// ============================================================================

export interface InterventionSuggestion {
  technique: TCCTechnique;
  confidence: number;  // 0-1
  reason: string;
  barrier?: UnifiedBarrier;
  alternativeTechniques: TCCTechnique[];
  estimatedDuration: number;
  route: string;
  validationMessage: string;

  // A-04: Objetivo vinculado
  objectiveId?: string;
  // A-02: Puntos de intervenciÃ³n del anÃ¡lisis funcional
  interventionPoints?: Array<{ point: string; intervention: string; technique: string }>;
  // InformaciÃ³n temporal
  temporalWarnings?: Array<{ issue: string; suggestion: string }>;
  temporalInsight?: string;

  // Perfil clÃ­nico BDI-II
  clinicalProfileRecommendation?: string;

  // Integracion opcional con knowledge v3
  v3TechniqueId?: string;
  v3TechniqueName?: string;
  v3MappingStrategy?: 'direct' | 'approximate';
  v3MappingNote?: string;
  v3ProcedureHints?: Array<{
    procedureId: string;
    name: string;
    goal: string;
    intensity: string;
  }>;
  v3SafetyFlags?: string[];
}

// ============================================================================
// SISTEMA DE SCORING NORMALIZADO (MEJORA #2)
// ============================================================================

/**
 * ConfiguraciÃ³n de pesos para el sistema de scoring normalizado.
 * Todos los factores se normalizan a 0-10 antes de aplicar pesos.
 *
 * Total de pesos debe sumar 100%.
 */
export const SCORING_WEIGHTS = {
  /** Peso de las barreras detectadas */
  barriers: 0.28,            // 28% - Las barreras son el factor mÃ¡s importante

  /** Peso del mapeo emocional */
  emotion: 0.22,             // 22% - La emociÃ³n guÃ­a el enfoque

  /** Peso del perfil clÃ­nico BDI-II (AC vs RC) */
  clinicalProfile: 0.15,     // 15% - SeÃ±al basada en evidencia (Cuijpers 2019, Dimidjian 2006)

  /** Peso del historial de efectividad del usuario */
  historical: 0.12,          // 12% - Lo que ha funcionado antes

  /** Peso del contexto (energÃ­a, tiempo disponible) */
  context: 0.10,             // 10% - Factores situacionales

  /** Peso del estilo de aproximaciÃ³n */
  approachStyle: 0.08,       // 8% - Estilo complementario

  /** Peso de las recomendaciones temporales */
  temporal: 0.05,            // 5% - Patrones por hora/dÃ­a
} as const;

// VerificaciÃ³n en tiempo de compilaciÃ³n: los pesos deben sumar 1.0
const _totalWeight: 1.0 = (
  SCORING_WEIGHTS.barriers +
  SCORING_WEIGHTS.emotion +
  SCORING_WEIGHTS.clinicalProfile +
  SCORING_WEIGHTS.historical +
  SCORING_WEIGHTS.context +
  SCORING_WEIGHTS.approachStyle +
  SCORING_WEIGHTS.temporal
) as 1.0;

/**
 * Resultado del cÃ¡lculo de score normalizado
 */
interface NormalizedScoreResult {
  /** Score final (0-10) */
  finalScore: number;

  /** Desglose de cada componente (0-10) */
  components: {
    barriers: number;
    emotion: number;
    clinicalProfile: number;
    approachStyle: number;
    context: number;
    historical: number;
    temporal: number;
  };

  /** ContribuciÃ³n ponderada de cada componente */
  weightedContributions: {
    barriers: number;
    emotion: number;
    clinicalProfile: number;
    approachStyle: number;
    context: number;
    historical: number;
    temporal: number;
  };
}

/**
 * Calcula el score normalizado (0-10) para barreras
 */
function calculateBarrierScore(
  technique: TCCTechnique,
  barriers: UnifiedBarrier[]
): number {
  if (barriers.length === 0) return 5; // Neutral si no hay barreras

  let totalScore = 0;
  let maxPossibleScore = barriers.length * 10;

  for (const barrier of barriers) {
    const position = barrier.recommendedTechniques.indexOf(technique);
    if (position !== -1) {
      // Primera posiciÃ³n = 10, segunda = 8, tercera = 6, cuarta = 4, quinta+ = 2
      const positionScore = Math.max(10 - position * 2, 2);
      totalScore += positionScore;
    }
    // Si no estÃ¡ en las recomendaciones, suma 0
  }

  // Normalizar a 0-10
  return (totalScore / maxPossibleScore) * 10;
}

/**
 * Calcula el score normalizado (0-10) para emociÃ³n
 */
function calculateEmotionScore(
  technique: TCCTechnique,
  emotionMapping: EmotionTechniqueMapping | null
): number {
  if (!emotionMapping) return 5; // Neutral si no hay emociÃ³n

  // TÃ©cnica primaria: 10
  if (emotionMapping.primaryTechniques.includes(technique)) {
    return 10;
  }

  // TÃ©cnica secundaria: 6
  if (emotionMapping.secondaryTechniques.includes(technique)) {
    return 6;
  }

  // TÃ©cnica a evitar: 0
  if (emotionMapping.avoidTechniques.includes(technique)) {
    return 0;
  }

  // TÃ©cnica neutral: 4
  return 4;
}

/**
 * Calcula el score normalizado (0-10) para estilo de aproximaciÃ³n
 */
function calculateApproachStyleScore(
  technique: TCCTechnique,
  approachStyle: ApproachStyle | null
): number {
  if (!approachStyle) return 5; // Neutral

  const bonus = getApproachStyleBonus(technique, approachStyle);

  // El bonus original va de -4 a +5
  // Normalizamos: -4 â†’ 0, 0 â†’ 5.5, +5 â†’ 10
  return Math.max(0, Math.min(10, 5.5 + bonus));
}

/**
 * Calcula el score normalizado (0-10) para contexto
 */
function calculateContextScore(
  technique: TCCTechnique,
  context: UserContext
): number {
  let score = 5; // Base neutral

  const info = TCC_TECHNIQUES_INFO[technique];

  // Factor energÃ­a (-2 a +2)
  if (info.requiresHighEnergy) {
    if (context.currentEnergy === 'very_low') score -= 2;
    else if (context.currentEnergy === 'low') score -= 1.5;
    else if (context.currentEnergy === 'high') score += 1;
    else if (context.currentEnergy === 'very_high') score += 2;
  }

  // Factor tiempo disponible (-1 a +1.5)
  if (context.availableMinutes !== undefined) {
    if (info.durationMinutes <= context.availableMinutes) {
      // Bonus si la tÃ©cnica cabe en el tiempo disponible
      score += 1.5;
    } else {
      // PenalizaciÃ³n si no cabe
      score -= 1;
    }
  }

  // Factor momento del dÃ­a (-0.5 a +1.5)
  if (context.timeOfDay === 'night' || context.timeOfDay === 'early_morning') {
    if (technique === 'relaxation' || technique === 'self_compassion') {
      score += 1.5;
    } else if (info.requiresHighEnergy) {
      score -= 0.5;
    }
  }

  // Factor estado de Ã¡nimo (-0.5 a +1)
  if (context.currentMood === 'very_bad' || context.currentMood === 'bad') {
    if (technique === 'micro_tasks' || technique === 'self_compassion') {
      score += 1;
    } else if (info.requiresHighEnergy) {
      score -= 0.5;
    }
  }

  // Clamp a 0-10
  return Math.max(0, Math.min(10, score));
}

/**
 * Calcula el score normalizado (0-10) para historial
 */
function calculateHistoricalScore(
  technique: TCCTechnique,
  profile: TCCEffectivenessProfile | null
): number {
  if (!profile) return 5; // Neutral si no hay historial

  const techStats = profile.techniqueEffectiveness[technique];
  if (!techStats || techStats.timesUsed === 0) return 5; // Neutral

  // avgEffectivenessRating es 1-5, normalizamos a 0-10
  // TambiÃ©n consideramos completion rate
  const effectivenessNormalized = (techStats.avgEffectivenessRating - 1) * 2.5; // 1-5 â†’ 0-10
  const completionRate = techStats.timesUsed > 0
    ? techStats.timesCompleted / techStats.timesUsed
    : 0;

  // Combinar efectividad y completion rate
  return effectivenessNormalized * 0.7 + completionRate * 10 * 0.3;
}

/**
 * Calcula el score normalizado (0-10) para temporal
 */
function calculateTemporalScore(
  technique: TCCTechnique,
  temporalRecommendations: Array<{ technique: TCCTechnique; confidence: number }>
): number {
  if (temporalRecommendations.length === 0) return 5; // Neutral

  const rec = temporalRecommendations.find(r => r.technique === technique);
  if (!rec) return 4; // Ligeramente por debajo si no estÃ¡ recomendada

  // confidence es 0-1, normalizamos a 0-10
  return rec.confidence * 10;
}

/**
 * Calcula el score normalizado (0-10) para perfil clÃ­nico BDI-II.
 *
 * Usa ENGINE_TO_V3_MAP para determinar la familia de la tÃ©cnica (ac/rc/otra)
 * y la compara con la tÃ©cnica primaria recomendada por el perfil.
 *
 * Score asimÃ©trico:
 *   - RC→AC penalizaciÃ³n = 3 (mÃ¡s fuerte: AC poco Ãºtil en perfil cognitivo puro)
 *   - AC→RC penalizaciÃ³n = 4 (mÃ¡s suave: RC siempre tiene valor terapÃ©utico)
 */
export function calculateClinicalProfileScore(
  technique: TCCTechnique,
  clinicalProfile: UserContext['clinicalProfile']
): number {
  if (!clinicalProfile) return 5; // Neutral — no hay datos de perfil

  const v3Family = ENGINE_TO_V3_MAP[technique]; // 'ac' | 'rc' | 'exposicion' | ...

  if (clinicalProfile.primaryTechnique === 'rc') {
    if (v3Family === 'rc') return 9;   // Boost RC
    if (v3Family === 'ac') return 3;   // PenalizaciÃ³n leve AC
    return 5;                           // Neutral (mindfulness, dbt, etc.)
  }

  // primaryTechnique === 'ac'
  if (v3Family === 'ac') return 9;     // Boost AC
  if (v3Family === 'rc') return 4;     // PenalizaciÃ³n leve RC (RC sigue siendo Ãºtil)
  return 5;                             // Neutral
}

/**
 * Calcula el score total normalizado para una tÃ©cnica
 */
function calculateNormalizedScore(
  technique: TCCTechnique,
  barriers: UnifiedBarrier[],
  emotionMapping: EmotionTechniqueMapping | null,
  context: UserContext,
  profile: TCCEffectivenessProfile | null,
  temporalRecommendations: Array<{ technique: TCCTechnique; confidence: number }>,
  clinicalProfile: UserContext['clinicalProfile']
): NormalizedScoreResult {
  // Calcular cada componente (0-10)
  const components = {
    barriers: calculateBarrierScore(technique, barriers),
    emotion: calculateEmotionScore(technique, emotionMapping),
    clinicalProfile: calculateClinicalProfileScore(technique, clinicalProfile),
    approachStyle: calculateApproachStyleScore(technique, emotionMapping?.approachStyle || null),
    context: calculateContextScore(technique, context),
    historical: calculateHistoricalScore(technique, profile),
    temporal: calculateTemporalScore(technique, temporalRecommendations),
  };

  // Calcular contribuciones ponderadas
  const weightedContributions = {
    barriers: components.barriers * SCORING_WEIGHTS.barriers,
    emotion: components.emotion * SCORING_WEIGHTS.emotion,
    clinicalProfile: components.clinicalProfile * SCORING_WEIGHTS.clinicalProfile,
    approachStyle: components.approachStyle * SCORING_WEIGHTS.approachStyle,
    context: components.context * SCORING_WEIGHTS.context,
    historical: components.historical * SCORING_WEIGHTS.historical,
    temporal: components.temporal * SCORING_WEIGHTS.temporal,
  };

  // Score final (suma de contribuciones ponderadas, ya es 0-10)
  const finalScore =
    weightedContributions.barriers +
    weightedContributions.emotion +
    weightedContributions.clinicalProfile +
    weightedContributions.approachStyle +
    weightedContributions.context +
    weightedContributions.historical +
    weightedContributions.temporal;

  return {
    finalScore,
    components,
    weightedContributions,
  };
}

// ============================================================================
// MOTOR TCC PRINCIPAL
// ============================================================================

/**
 * Obtiene el TimeSlot actual basado en la hora
 */
export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();

  for (const [slot, range] of Object.entries(TIME_SLOT_RANGES)) {
    if (hour >= range.start && hour < range.end) {
      return slot as TimeSlot;
    }
  }

  return 'morning';
}

/**
 * Detecta barreras basÃ¡ndose en texto del usuario
 */
export function detectBarriersFromText(text: string): UnifiedBarrier[] {
  const normalizedText = text.toLowerCase();
  const detectedBarriers: UnifiedBarrier[] = [];

  for (const barrier of Object.values(UNIFIED_BARRIERS)) {
    const matchCount = barrier.indicators.filter(indicator =>
      normalizedText.includes(indicator.toLowerCase())
    ).length;

    if (matchCount > 0) {
      detectedBarriers.push(barrier);
    }
  }

  // Ordenar por nÃºmero de indicadores encontrados
  return detectedBarriers.sort((a, b) => {
    const aMatches = a.indicators.filter(i => normalizedText.includes(i.toLowerCase())).length;
    const bMatches = b.indicators.filter(i => normalizedText.includes(i.toLowerCase())).length;
    return bMatches - aMatches;
  });
}

/**
 * Detecta barreras basÃ¡ndose en la ruta seleccionada
 */
export function detectBarriersFromRoute(route: RouteType): UnifiedBarrier[] {
  const barriersByRoute: Record<RouteType, string[]> = {
    overwhelmed: ['overwhelm', 'anxiety', 'messy_environment', 'avoidance'],
    hardtostart: ['procrastination', 'avoidance', 'perfectionism_paralysis', 'decision_fatigue'],
    tengoalgodeenergia: ['decision_fatigue', 'lack_of_time'],
    good: [],
  };

  return barriersByRoute[route]
    .map(id => UNIFIED_BARRIERS[id])
    .filter(Boolean);
}

/**
 * Detecta barreras basÃ¡ndose en el nivel de energÃ­a
 */
export function detectBarriersFromEnergy(energy: EnergyLevel): UnifiedBarrier[] {
  if (energy === 'very_low' || energy === 'low') {
    return [UNIFIED_BARRIERS.low_energy];
  }
  return [];
}

/**
 * Obtiene el perfil de efectividad del usuario
 */
export async function getUserEffectivenessProfile(
  userId: string
): Promise<TCCEffectivenessProfile | null> {
  const profile = await db.tccEffectivenessProfiles.get(userId);
  return profile ?? null;
}

/**
 * FUNCIÃ“N PRINCIPAL: Selecciona la mejor intervenciÃ³n para el contexto
 *
 * MEJORA #2: Ahora usa sistema de scoring normalizado donde todos los
 * factores estÃ¡n en escala 0-10 con pesos explÃ­citos que suman 100%.
 */
export async function selectIntervention(
  context: UserContext
): Promise<InterventionSuggestion> {
  // 1. Recopilar todas las barreras detectadas
  const barriers: UnifiedBarrier[] = [];

  // Barreras explÃ­citas del contexto
  context.detectedBarriers.forEach(id => {
    if (UNIFIED_BARRIERS[id]) {
      barriers.push(UNIFIED_BARRIERS[id]);
    }
  });

  // Barreras por ruta
  barriers.push(...detectBarriersFromRoute(context.currentRoute));

  // Barreras por energÃ­a
  barriers.push(...detectBarriersFromEnergy(context.currentEnergy));

  // Barreras por texto reciente
  if (context.recentThought) {
    barriers.push(...detectBarriersFromText(context.recentThought));
  }

  // Eliminar duplicados
  const uniqueBarriers = Array.from(
    new Map(barriers.map(b => [b.id, b])).values()
  );

  // 2. Obtener perfil de efectividad del usuario
  const profile = await getUserEffectivenessProfile(context.userId);

  // 3. Determinar emociÃ³n actual
  const currentEmotion: ThoughtEmotion = context.currentEmotion ||
    inferEmotionFromMood(context.currentMood, {
      barrier: context.detectedBarriers[0],
    });

  // Obtener mapeo de emociÃ³n a tÃ©cnicas
  const emotionMapping = EMOTION_TECHNIQUE_MAP[currentEmotion] || null;

  // 4. Obtener contexto temporal y recomendaciones
  let temporalRecommendations: Array<{ technique: TCCTechnique; confidence: number }> = [];
  let temporalWarnings: Array<{ issue: string; suggestion: string }> = [];

  try {
    const timeRecs = await getCurrentTimeRecommendations(context.userId);
    temporalRecommendations = timeRecs.recommendations;
    temporalWarnings = timeRecs.warnings;
  } catch {
    // Si no hay datos temporales, continuar sin ellos
  }

  // 5. NUEVO: Calcular scores normalizados para cada tÃ©cnica
  const techniqueResults: Array<{
    technique: TCCTechnique;
    result: NormalizedScoreResult;
  }> = [];

  for (const technique of Object.keys(TCC_TECHNIQUES_INFO) as TCCTechnique[]) {
    const result = calculateNormalizedScore(
      technique,
      uniqueBarriers,
      emotionMapping,
      context,
      profile,
      temporalRecommendations,
      context.clinicalProfile
    );
    techniqueResults.push({ technique, result });
  }

  // 6. Ordenar por score final (0-10)
  techniqueResults.sort((a, b) => b.result.finalScore - a.result.finalScore);

  const bestResult = techniqueResults[0];
  const bestTechnique = bestResult.technique;
  const bestScore = bestResult.result.finalScore;

  // 7. Construir la sugerencia
  const primaryBarrier = uniqueBarriers[0] || null;
  const techniqueInfo = TCC_TECHNIQUES_INFO[bestTechnique];

  // Generar razÃ³n contextual con informaciÃ³n del score mÃ¡s alto
  let reason = '';
  const topContributor = getTopContributor(bestResult.result);

  if (topContributor === 'barriers' && primaryBarrier) {
    reason = `Basado en ${primaryBarrier.name.toLowerCase()}, `;
  } else if (topContributor === 'clinicalProfile' && context.clinicalProfile) {
    reason = `SegÃºn tu perfil clÃ­nico (BDI-II), `;
  } else if (topContributor === 'emotion' && emotionMapping) {
    reason = `${emotionMapping.validationMessage.split('.')[0]}. `;
  } else if (topContributor === 'historical') {
    reason = 'SegÃºn tu historial de efectividad, ';
  } else if (topContributor === 'temporal') {
    reason = 'En este momento del dÃ­a, ';
  } else if (context.currentRoute === 'overwhelmed') {
    reason = 'Cuando te sientes abrumado, ';
  } else if (context.currentRoute === 'hardtostart') {
    reason = 'Cuando cuesta empezar, ';
  } else {
    reason = 'En este momento, ';
  }

  reason += `${techniqueInfo.name.toLowerCase()} puede ayudarte a ${getActionVerb(bestTechnique)}.`;

  // Mensaje de validaciÃ³n con prioridad: barrera > emociÃ³n > default
  const validationMessage =
    primaryBarrier?.validationMessages[0] ||
    (emotionMapping ? getValidationMessageForEmotion(currentEmotion) : null) ||
    'Cada pequeÃ±o paso cuenta. EstÃ¡s haciendo algo por ti.';

  // Generar insight temporal si hay datos relevantes
  let temporalInsight: string | undefined;
  if (temporalRecommendations.length > 0) {
    const bestTemporalTechnique = temporalRecommendations[0];
    if (bestTemporalTechnique.technique === bestTechnique) {
      temporalInsight = `Esta tÃ©cnica ha funcionado especialmente bien para ti a esta hora.`;
    } else if (temporalRecommendations.some(r => r.technique === bestTechnique)) {
      temporalInsight = `Buen momento para esta tÃ©cnica segÃºn tu historial.`;
    }
  }

  // Calcular confianza normalizada (score ya estÃ¡ en 0-10)
  const confidence = bestScore / 10;

  // A-02: Enriquecer con anÃ¡lisis funcional profundo si hay datos disponibles
  let interventionPoints: Array<{ point: string; intervention: string; technique: string }> | undefined;
  if (context.functionalAnalysis) {
    try {
      const points = generateInterventionPoints(context.functionalAnalysis as DeepFunctionalAnalysis);
      if (points.length > 0) {
        interventionPoints = points.map(p => ({
          point: p.point,
          intervention: p.intervention,
          technique: p.technique,
        }));
      }
    } catch {
      // AnÃ¡lisis funcional incompleto â€” continuar sin puntos de intervenciÃ³n
    }
  }

  // Generar recomendaciÃ³n de perfil clÃ­nico si hay datos
  let clinicalProfileRecommendation: string | undefined;
  if (context.clinicalProfile) {
    const profileLabels: Record<string, string> = {
      cognitive: 'Perfil cognitivo',
      behavioral: 'Perfil conductual',
      mixed: 'Perfil mixto',
      neurovegetative: 'Perfil neurovegetativo',
    };
    const techniqueLabels: Record<string, string> = { ac: 'AC', rc: 'RC' };
    clinicalProfileRecommendation =
      `${profileLabels[context.clinicalProfile.profile]} â†' ${techniqueLabels[context.clinicalProfile.primaryTechnique]} recomendada`;
  }

  // Enriquecimiento opcional con knowledge v3 (si hay mapeo disponible)
  const v3Guidance = await getV3GuidanceForEngineTechnique(bestTechnique);

  return {
    technique: bestTechnique,
    confidence: Math.min(Math.max(confidence, 0), 1),
    reason,
    barrier: primaryBarrier || undefined,
    alternativeTechniques: techniqueResults.slice(1, 4).map(r => r.technique),
    estimatedDuration: techniqueInfo.durationMinutes,
    route: techniqueInfo.route,
    validationMessage,
    objectiveId: context.objectiveId,
    interventionPoints,
    temporalWarnings: temporalWarnings.length > 0 ? temporalWarnings : undefined,
    temporalInsight,
    clinicalProfileRecommendation,
    v3TechniqueId: v3Guidance?.v3TechniqueId,
    v3TechniqueName: v3Guidance?.techniqueName,
    v3MappingStrategy: v3Guidance?.mappingStrategy,
    v3MappingNote: v3Guidance?.mappingNote,
    v3ProcedureHints: v3Guidance?.procedureHints,
    v3SafetyFlags: v3Guidance?.safetyFlags,
  };
}

/**
 * Determina cuÃ¡l componente contribuyÃ³ mÃ¡s al score
 */
function getTopContributor(
  result: NormalizedScoreResult
): keyof NormalizedScoreResult['weightedContributions'] {
  const contributions = result.weightedContributions;
  let topKey: keyof typeof contributions = 'barriers';
  let topValue = contributions.barriers;

  for (const [key, value] of Object.entries(contributions)) {
    if (value > topValue) {
      topValue = value;
      topKey = key as keyof typeof contributions;
    }
  }

  return topKey;
}

function getActionVerb(technique: TCCTechnique): string {
  const verbs: Record<TCCTechnique, string> = {
    behavioral_activation: 'romper el ciclo de inactividad',
    gradual_exposure: 'enfrentar esto paso a paso',
    cognitive_restructuring: 'ver la situaciÃ³n desde otra perspectiva',
    activity_scheduling: 'organizar tu tiempo y reducir la incertidumbre',
    functional_analysis: 'entender quÃ© estÃ¡ pasando realmente',
    micro_tasks: 'crear momentum con algo pequeÃ±o',
    momentum_building: 'ganar confianza con un primer paso fÃ¡cil',
    self_compassion: 'tratarte con amabilidad',
    problem_solving: 'dividir el problema en partes manejables',
    relaxation: 'calmar tu cuerpo y mente',
  };
  return verbs[technique];
}

// ============================================================================
// REGISTRO Y APRENDIZAJE
// ============================================================================

/**
 * Registra una intervenciÃ³n y su resultado
 */
export async function logIntervention(
  userId: string,
  intervention: {
    technique: TCCTechnique;
    context: UserContext;
    completed: boolean;
    moodBefore: MoodLevel;
    moodAfter?: MoodLevel;
    effectivenessRating?: 1 | 2 | 3 | 4 | 5;
    suggestedByEngine: boolean;
    userChoseAlternative: boolean;
  }
): Promise<void> {
  const log: TCCInterventionLog = {
    userId,
    timestamp: new Date(),
    context: {
      route: intervention.context.currentRoute,
      barrier: intervention.context.detectedBarriers[0],
      mood: intervention.context.currentMood,
      energy: intervention.context.currentEnergy,
      timeOfDay: intervention.context.timeOfDay,
    },
    technique: intervention.technique,
    suggestedByEngine: intervention.suggestedByEngine,
    userChoseAlternative: intervention.userChoseAlternative,
    completed: intervention.completed,
    moodBefore: intervention.moodBefore,
    moodAfter: intervention.moodAfter,
    effectivenessRating: intervention.effectivenessRating,
  };

  await db.tccInterventionLogs.add(log);

  // Actualizar perfil de efectividad
  await updateEffectivenessProfile(userId, log);
}

/**
 * Actualiza el perfil de efectividad basÃ¡ndose en nuevos datos
 */
async function updateEffectivenessProfile(
  userId: string,
  newLog: TCCInterventionLog
): Promise<void> {
  let profile = await db.tccEffectivenessProfiles.get(userId);

  if (!profile) {
    // Crear perfil inicial
    profile = {
      userId,
      techniqueEffectiveness: {} as TCCEffectivenessProfile['techniqueEffectiveness'],
      barrierResponses: {},
      patterns: {
        bestTimeForInterventions: 'morning',
        preferredTechniqueStyle: 'action_first',
        avgSessionsToImprovement: 3,
        resistanceToNewTechniques: 'medium',
      },
      lastUpdated: new Date(),
    };

    // Inicializar todas las tÃ©cnicas
    for (const technique of Object.keys(TCC_TECHNIQUES_INFO) as TCCTechnique[]) {
      profile.techniqueEffectiveness[technique] = {
        timesUsed: 0,
        timesCompleted: 0,
        avgMoodImprovement: 0,
        avgEffectivenessRating: 0,
        bestContexts: [],
      };
    }
  }

  // Actualizar datos de la tÃ©cnica usada
  const techStats = profile.techniqueEffectiveness[newLog.technique];
  techStats.timesUsed++;

  if (newLog.completed) {
    techStats.timesCompleted++;
  }

  if (newLog.effectivenessRating) {
    const oldTotal = techStats.avgEffectivenessRating * (techStats.timesUsed - 1);
    techStats.avgEffectivenessRating = (oldTotal + newLog.effectivenessRating) / techStats.timesUsed;
  }

  if (newLog.moodAfter && newLog.moodBefore) {
    const moodValues: Record<MoodLevel, number> = {
      very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5,
    };
    const improvement = moodValues[newLog.moodAfter] - moodValues[newLog.moodBefore];
    const oldTotal = techStats.avgMoodImprovement * (techStats.timesUsed - 1);
    techStats.avgMoodImprovement = (oldTotal + improvement) / techStats.timesUsed;
  }

  profile.lastUpdated = new Date();

  await db.tccEffectivenessProfiles.put(profile);
}

// ============================================================================
// HELPERS PARA COMPONENTES
// ============================================================================

/**
 * Obtiene sugerencia rÃ¡pida para un componente
 */
export async function getQuickSuggestion(
  userId: string,
  route: RouteType,
  mood: MoodLevel,
  energy: EnergyLevel
): Promise<InterventionSuggestion> {
  const context: UserContext = {
    userId,
    currentMood: mood,
    currentEnergy: energy,
    currentRoute: route,
    timeOfDay: getCurrentTimeSlot(),
    detectedBarriers: [],
  };

  return selectIntervention(context);
}

/**
 * Obtiene las tÃ©cnicas mÃ¡s efectivas para el usuario
 */
export async function getUserTopTechniques(
  userId: string,
  limit: number = 3
): Promise<Array<{ technique: TCCTechnique; info: typeof TCC_TECHNIQUES_INFO[TCCTechnique]; effectiveness: number }>> {
  const profile = await getUserEffectivenessProfile(userId);

  if (!profile) {
    // Devolver tÃ©cnicas por defecto
    return ['micro_tasks', 'behavioral_activation', 'self_compassion'].map(t => ({
      technique: t as TCCTechnique,
      info: TCC_TECHNIQUES_INFO[t as TCCTechnique],
      effectiveness: 0,
    }));
  }

  return Object.entries(profile.techniqueEffectiveness)
    .filter(([, stats]) => stats.timesUsed > 0)
    .sort((a, b) => b[1].avgEffectivenessRating - a[1].avgEffectivenessRating)
    .slice(0, limit)
    .map(([technique, stats]) => ({
      technique: technique as TCCTechnique,
      info: TCC_TECHNIQUES_INFO[technique as TCCTechnique],
      effectiveness: stats.avgEffectivenessRating,
    }));
}

/**
 * Obtiene estadÃ­sticas generales del motor TCC
 */
export async function getTCCStats(userId: string): Promise<{
  totalInterventions: number;
  completionRate: number;
  avgMoodImprovement: number;
  mostEffectiveTechnique: TCCTechnique | null;
  mostCommonBarrier: string | null;
}> {
  const logs = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .toArray();

  if (logs.length === 0) {
    return {
      totalInterventions: 0,
      completionRate: 0,
      avgMoodImprovement: 0,
      mostEffectiveTechnique: null,
      mostCommonBarrier: null,
    };
  }

  const completed = logs.filter(l => l.completed).length;
  const completionRate = (completed / logs.length) * 100;

  // Calcular mejora de Ã¡nimo promedio
  const moodValues: Record<MoodLevel, number> = {
    very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5,
  };

  const improvements = logs
    .filter(l => l.moodAfter)
    .map(l => moodValues[l.moodAfter!] - moodValues[l.moodBefore]);

  const avgMoodImprovement = improvements.length > 0
    ? improvements.reduce((a, b) => a + b, 0) / improvements.length
    : 0;

  // TÃ©cnica mÃ¡s efectiva
  const techniqueRatings: Record<string, number[]> = {};
  logs.forEach(l => {
    if (l.effectivenessRating) {
      if (!techniqueRatings[l.technique]) {
        techniqueRatings[l.technique] = [];
      }
      techniqueRatings[l.technique].push(l.effectivenessRating);
    }
  });

  let mostEffectiveTechnique: TCCTechnique | null = null;
  let highestAvg = 0;

  for (const [technique, ratings] of Object.entries(techniqueRatings)) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    if (avg > highestAvg) {
      highestAvg = avg;
      mostEffectiveTechnique = technique as TCCTechnique;
    }
  }

  // Barrera mÃ¡s comÃºn
  const barrierCounts: Record<string, number> = {};
  logs.forEach(l => {
    if (l.context.barrier) {
      barrierCounts[l.context.barrier] = (barrierCounts[l.context.barrier] || 0) + 1;
    }
  });

  const mostCommonBarrier = Object.entries(barrierCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalInterventions: logs.length,
    completionRate: Math.round(completionRate),
    avgMoodImprovement: Math.round(avgMoodImprovement * 10) / 10,
    mostEffectiveTechnique,
    mostCommonBarrier,
  };
}
