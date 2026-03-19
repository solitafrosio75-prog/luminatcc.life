// @ts-nocheck
/**
 * BehavioralExperimentService
 *
 * V18: Servicio para gestionar experimentos conductuales siguiendo
 * el protocolo TCC (Terapia Cognitivo-Conductual).
 *
 * Los experimentos conductuales son una técnica fundamental de la TCC
 * que permite a los usuarios:
 * 1. Identificar creencias/pensamientos automáticos a probar
 * 2. Diseñar un experimento estructurado
 * 3. Ejecutar el experimento de forma controlada
 * 4. Reflexionar sobre los resultados
 * 5. Actualizar las creencias basándose en evidencia real
 */

import type {
  BehavioralExperiment,
  BeliefTrackingHistory,
  ExperimentStatus,
  PredictionType,
  BeliefLevel,
  ThoughtEmotion,
  MoodLevel,
  ThoughtRecord,
  FunctionalAnalysis,
} from '../db/database';

import {
  createExperiment,
  getExperiment,
  getUserExperiments,
  updateExperiment,
  markExperimentReady,
  startExperimentExecution,
  completeExperimentExecution,
  completeExperimentReflection,
  abandonExperiment,
  getBeliefHistory,
  getAllBeliefHistories,
  getExperimentStats,
  suggestExperimentFromThoughtRecord,
  EXPERIMENT_POINTS,
} from '../db/operations/behavioralExperiments';

import { db } from '../db/database';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Paso del flujo de experimento
 */
export type ExperimentStep =
  | 'identify_belief'     // Identificar la creencia a probar
  | 'rate_belief'         // Calificar nivel de creencia (0-100%)
  | 'make_prediction'     // Hacer una predicción específica
  | 'design_experiment'   // Diseñar el experimento
  | 'anticipate_obstacles'// Anticipar obstáculos
  | 'execute'             // Ejecutar el experimento
  | 'record_outcome'      // Registrar el resultado
  | 'reflect'             // Reflexionar y aprender
  | 'update_belief';      // Actualizar nivel de creencia

/**
 * Contexto de creación de experimento
 */
export interface ExperimentContext {
  userId: string;
  source: 'thought_record' | 'functional_analysis' | 'manual' | 'suggestion';
  sourceId?: number;
  emotion?: ThoughtEmotion;
  barrier?: string;
}

/**
 * Guía paso a paso para el usuario
 */
export interface ExperimentGuidance {
  currentStep: ExperimentStep;
  stepNumber: number;
  totalSteps: number;
  instruction: string;
  example: string;
  tips: string[];
  nextAction: string;
}

/**
 * Plantilla de experimento sugerida
 */
export interface ExperimentTemplate {
  id: string;
  name: string;
  description: string;
  predictionType: PredictionType;
  beliefExample: string;
  experimentExample: string;
  suitableFor: ThoughtEmotion[];
  difficulty: 'low' | 'medium' | 'high';
}

// ============================================================================
// PLANTILLAS DE EXPERIMENTOS
// ============================================================================

export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: 'ask_for_help',
    name: 'Pedir ayuda',
    description: 'Experimento para probar creencias sobre pedir ayuda a otros',
    predictionType: 'rejection',
    beliefExample: 'Si pido ayuda, los demás pensarán que soy incompetente',
    experimentExample: 'Pediré ayuda con algo pequeño a alguien de confianza y observaré su reacción',
    suitableFor: ['anxious', 'ashamed', 'guilty'],
    difficulty: 'medium',
  },
  {
    id: 'express_opinion',
    name: 'Expresar una opinión',
    description: 'Experimento para probar creencias sobre expresar opiniones',
    predictionType: 'judgment',
    beliefExample: 'Si digo lo que pienso, los demás me rechazarán',
    experimentExample: 'Compartiré mi opinión sobre un tema en una conversación grupal',
    suitableFor: ['anxious', 'frustrated'],
    difficulty: 'medium',
  },
  {
    id: 'imperfect_task',
    name: 'Tarea imperfecta',
    description: 'Experimento para probar creencias perfeccionistas',
    predictionType: 'failure',
    beliefExample: 'Si no hago esto perfectamente, será un desastre',
    experimentExample: 'Entregaré una tarea al 80% de perfección y observaré las consecuencias reales',
    suitableFor: ['anxious', 'guilty', 'overwhelmed'],
    difficulty: 'low',
  },
  {
    id: 'face_feared_situation',
    name: 'Enfrentar situación temida',
    description: 'Experimento para probar predicciones catastróficas',
    predictionType: 'catastrophic',
    beliefExample: 'Si hago X, algo terrible pasará',
    experimentExample: 'Me expondré gradualmente a la situación temida en un entorno controlado',
    suitableFor: ['anxious', 'overwhelmed', 'hopeless'],
    difficulty: 'high',
  },
  {
    id: 'try_new_activity',
    name: 'Probar algo nuevo',
    description: 'Experimento para probar creencias de incapacidad',
    predictionType: 'inability',
    beliefExample: 'No soy capaz de hacer esto',
    experimentExample: 'Intentaré la actividad durante 10 minutos sin juzgar el resultado',
    suitableFor: ['sad', 'hopeless', 'frustrated'],
    difficulty: 'low',
  },
  {
    id: 'tolerate_emotion',
    name: 'Tolerar una emoción',
    description: 'Experimento para probar creencias sobre emociones',
    predictionType: 'emotional',
    beliefExample: 'Si me permito sentir esta emoción, no podré soportarlo',
    experimentExample: 'Me permitiré sentir la emoción durante 5 minutos observándola sin evitarla',
    suitableFor: ['anxious', 'sad', 'angry'],
    difficulty: 'medium',
  },
  {
    id: 'say_no',
    name: 'Decir que no',
    description: 'Experimento para probar creencias sobre poner límites',
    predictionType: 'rejection',
    beliefExample: 'Si digo que no, la otra persona se enojará y me rechazará',
    experimentExample: 'Rechazaré una petición pequeña de forma amable y observaré la reacción',
    suitableFor: ['anxious', 'guilty', 'overwhelmed'],
    difficulty: 'medium',
  },
  {
    id: 'make_mistake',
    name: 'Cometer un error',
    description: 'Experimento para probar creencias sobre errores',
    predictionType: 'judgment',
    beliefExample: 'Si cometo un error, todos pensarán mal de mí',
    experimentExample: 'Haré algo con la posibilidad de error y observaré las reacciones reales',
    suitableFor: ['anxious', 'ashamed', 'frustrated'],
    difficulty: 'low',
  },
];

// ============================================================================
// GUÍAS POR PASO
// ============================================================================

const STEP_GUIDANCE: Record<ExperimentStep, Omit<ExperimentGuidance, 'currentStep' | 'stepNumber' | 'totalSteps'>> = {
  identify_belief: {
    instruction: '¿Cuál es el pensamiento o creencia que quieres poner a prueba?',
    example: 'Por ejemplo: "Si pido ayuda, los demás pensarán que soy débil"',
    tips: [
      'Elige una creencia que te limite o cause malestar',
      'Sé específico sobre lo que crees que pasará',
      'Asegúrate de que sea algo que puedas probar',
    ],
    nextAction: 'Escribe tu pensamiento o creencia',
  },
  rate_belief: {
    instruction: '¿Qué tanto crees en este pensamiento ahora mismo?',
    example: 'Del 0% (no lo creo nada) al 100% (lo creo completamente)',
    tips: [
      'Sé honesto contigo mismo',
      'No hay respuestas correctas o incorrectas',
      'Este número te ayudará a medir el cambio después',
    ],
    nextAction: 'Arrastra el control para indicar tu nivel de creencia',
  },
  make_prediction: {
    instruction: '¿Qué predices que sucederá si tu creencia es cierta?',
    example: 'Por ejemplo: "La persona se burlará de mí o me ignorará"',
    tips: [
      'Haz tu predicción lo más específica posible',
      'Piensa en qué señales buscarías para confirmar tu predicción',
      'Incluye qué tan probable crees que es (0-100%)',
    ],
    nextAction: 'Escribe tu predicción específica',
  },
  design_experiment: {
    instruction: '¿Qué harás exactamente para probar esta creencia?',
    example: 'Por ejemplo: "Pediré ayuda a mi compañero con el informe esta semana"',
    tips: [
      'El experimento debe ser algo que puedas hacer pronto',
      'Elige algo desafiante pero no abrumador',
      'Sé muy específico sobre qué, cuándo y con quién',
    ],
    nextAction: 'Describe tu experimento en detalle',
  },
  anticipate_obstacles: {
    instruction: '¿Qué podría impedirte hacer el experimento?',
    example: 'Por ejemplo: "Podría posponer por miedo" o "La persona podría no estar disponible"',
    tips: [
      'Piensa en obstáculos internos (miedos, excusas)',
      'Piensa en obstáculos externos (tiempo, circunstancias)',
      'Para cada obstáculo, piensa en una estrategia',
    ],
    nextAction: 'Identifica posibles obstáculos y sus soluciones',
  },
  execute: {
    instruction: '¡Es hora de realizar el experimento!',
    example: 'Recuerda: el objetivo es recopilar información, no tener un resultado perfecto',
    tips: [
      'Es normal sentir ansiedad antes del experimento',
      'Observa lo que realmente sucede, no lo que esperabas',
      'No importa el resultado - siempre aprendes algo',
    ],
    nextAction: 'Realiza el experimento cuando estés listo',
  },
  record_outcome: {
    instruction: '¿Qué sucedió realmente?',
    example: 'Describe los hechos objetivos, no tus interpretaciones',
    tips: [
      'Enfócate en lo que observaste con tus sentidos',
      'Distingue hechos de interpretaciones',
      'Incluye cualquier resultado inesperado',
    ],
    nextAction: 'Describe el resultado del experimento',
  },
  reflect: {
    instruction: '¿Qué aprendiste de este experimento?',
    example: 'Por ejemplo: "Descubrí que las personas están más dispuestas a ayudar de lo que pensaba"',
    tips: [
      'Compara lo que predijiste con lo que sucedió',
      '¿Hubo algo que te sorprendió?',
      'Piensa en cómo esto cambia tu perspectiva',
    ],
    nextAction: 'Reflexiona sobre lo aprendido',
  },
  update_belief: {
    instruction: '¿Qué tanto crees ahora en tu pensamiento original?',
    example: 'Del 0% al 100% - compara con tu calificación inicial',
    tips: [
      'Considera toda la evidencia del experimento',
      'Está bien si tu creencia no cambió mucho',
      'Cada experimento aporta información valiosa',
    ],
    nextAction: 'Actualiza tu nivel de creencia',
  },
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtiene la guía para el paso actual del experimento
 */
export function getStepGuidance(step: ExperimentStep): ExperimentGuidance {
  const steps: ExperimentStep[] = [
    'identify_belief',
    'rate_belief',
    'make_prediction',
    'design_experiment',
    'anticipate_obstacles',
    'execute',
    'record_outcome',
    'reflect',
    'update_belief',
  ];

  const stepIndex = steps.indexOf(step);
  const guidance = STEP_GUIDANCE[step];

  return {
    currentStep: step,
    stepNumber: stepIndex + 1,
    totalSteps: steps.length,
    ...guidance,
  };
}

/**
 * Determina el paso actual basándose en el estado del experimento
 */
export function getCurrentStep(experiment: BehavioralExperiment): ExperimentStep {
  if (!experiment.beliefToTest) return 'identify_belief';
  if (experiment.beliefBefore === undefined) return 'rate_belief';
  if (!experiment.prediction) return 'make_prediction';
  if (!experiment.experimentDescription) return 'design_experiment';
  if (experiment.status === 'planning') return 'anticipate_obstacles';
  if (experiment.status === 'ready') return 'execute';
  if (!experiment.actualOutcome) return 'record_outcome';
  if (!experiment.learnings) return 'reflect';
  if (experiment.beliefAfter === undefined) return 'update_belief';
  return 'update_belief';
}

/**
 * Obtiene plantillas de experimentos recomendadas para una emoción
 */
export function getRecommendedTemplates(
  emotion?: ThoughtEmotion
): ExperimentTemplate[] {
  if (!emotion) return EXPERIMENT_TEMPLATES;

  // Priorizar plantillas que coincidan con la emoción
  return [...EXPERIMENT_TEMPLATES].sort((a, b) => {
    const aMatch = a.suitableFor.includes(emotion) ? 1 : 0;
    const bMatch = b.suitableFor.includes(emotion) ? 1 : 0;
    return bMatch - aMatch;
  });
}

/**
 * Crea un experimento a partir de una plantilla
 */
export async function createFromTemplate(
  context: ExperimentContext,
  template: ExperimentTemplate
): Promise<number> {
  const experiment = await createExperiment({
    userId: context.userId,
    beliefToTest: '',
    predictionType: template.predictionType,
    beliefBefore: 50,
    prediction: '',
    predictionProbability: 50,
    successCriteria: [],
    experimentDescription: '',
    emotion: context.emotion,
    barrier: context.barrier,
    linkedThoughtRecordId: context.source === 'thought_record' ? context.sourceId : undefined,
    linkedFunctionalAnalysisId: context.source === 'functional_analysis' ? context.sourceId : undefined,
  });

  return experiment;
}

/**
 * Crea un experimento desde un ThoughtRecord
 */
export async function createFromThoughtRecord(
  userId: string,
  thoughtRecordId: number
): Promise<number | null> {
  const suggestion = await suggestExperimentFromThoughtRecord(thoughtRecordId);
  if (!suggestion) return null;

  const experiment = await createExperiment({
    userId,
    beliefToTest: suggestion.beliefToTest,
    predictionType: suggestion.predictionType,
    beliefBefore: 70, // Valor inicial por defecto
    prediction: '',
    predictionProbability: 60,
    successCriteria: [],
    experimentDescription: suggestion.suggestedExperiment,
    emotion: suggestion.emotion,
    linkedThoughtRecordId: thoughtRecordId,
  });

  return experiment;
}

/**
 * Crea un experimento desde un FunctionalAnalysis
 */
export async function createFromFunctionalAnalysis(
  userId: string,
  analysisId: number
): Promise<number | null> {
  const analysis = await db.functionalAnalysis.get(analysisId);
  if (!analysis) return null;

  // Extraer creencia de diferentes fuentes del análisis
  let beliefToTest = 'Mi comportamiento tiene consecuencias negativas inevitables';

  // Intentar obtener de insights o antecedentes
  if (analysis.insights?.patternIdentified) {
    beliefToTest = analysis.insights.patternIdentified;
  } else if (analysis.antecedent.internalTrigger) {
    beliefToTest = analysis.antecedent.internalTrigger;
  } else if (analysis.consequence.shortTerm?.feeling) {
    beliefToTest = `Si hago esto, me sentiré ${analysis.consequence.shortTerm.feeling}`;
  }

  const experiment = await createExperiment({
    userId,
    beliefToTest,
    predictionType: 'catastrophic',
    beliefBefore: 70,
    prediction: '',
    predictionProbability: 60,
    successCriteria: [],
    experimentDescription: '',
    linkedFunctionalAnalysisId: analysisId,
  });

  return experiment;
}

/**
 * Valida si el experimento está listo para ejecutarse
 */
export function validateExperimentReadiness(experiment: BehavioralExperiment): {
  isReady: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Campos requeridos
  if (!experiment.beliefToTest) missingFields.push('Creencia a probar');
  if (experiment.beliefBefore === undefined) missingFields.push('Nivel de creencia inicial');
  if (!experiment.prediction) missingFields.push('Predicción específica');
  if (!experiment.experimentDescription) missingFields.push('Descripción del experimento');
  if (!experiment.successCriteria || experiment.successCriteria.length === 0) {
    missingFields.push('Criterios de éxito');
  }

  // Advertencias (no bloquean)
  if (!experiment.scheduledDate) {
    warnings.push('No has programado una fecha para el experimento');
  }
  if (!experiment.anticipatedObstacles || experiment.anticipatedObstacles.length === 0) {
    warnings.push('No has identificado posibles obstáculos');
  }
  if (!experiment.copingStrategies || experiment.copingStrategies.length === 0) {
    warnings.push('No has preparado estrategias de afrontamiento');
  }

  return {
    isReady: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Genera mensajes de apoyo basados en el estado del experimento
 */
export function getSupportMessage(experiment: BehavioralExperiment): string {
  const step = getCurrentStep(experiment);

  const messages: Record<ExperimentStep, string[]> = {
    identify_belief: [
      'Identificar tus pensamientos es el primer paso hacia el cambio.',
      'Tu valentía al explorar tus creencias ya es un logro.',
    ],
    rate_belief: [
      'Ser honesto contigo mismo requiere coraje.',
      'No hay calificación correcta o incorrecta.',
    ],
    make_prediction: [
      'Hacer predicciones claras te ayudará a evaluar los resultados.',
      'Tu mente está preparando el terreno para el aprendizaje.',
    ],
    design_experiment: [
      'Cada experimento es una oportunidad de descubrimiento.',
      'No busques la perfección, busca la información.',
    ],
    anticipate_obstacles: [
      'Anticipar dificultades te hace más fuerte.',
      'Prepararte para los retos es una forma de autocuidado.',
    ],
    execute: [
      '¡Ya diste el paso más importante: decidir actuar!',
      'El coraje no es ausencia de miedo, sino actuar a pesar de él.',
      'Cada experimento te acerca más a la verdad.',
    ],
    record_outcome: [
      'Observar sin juzgar es una habilidad poderosa.',
      'Cada resultado enseña algo valioso.',
    ],
    reflect: [
      'La reflexión convierte experiencias en sabiduría.',
      'Tu disposición a aprender es admirable.',
    ],
    update_belief: [
      'Actualizar creencias basándose en evidencia es fortaleza mental.',
      'Cada pequeño cambio en perspectiva es un gran logro.',
    ],
  };

  const stepMessages = messages[step];
  return stepMessages[Math.floor(Math.random() * stepMessages.length)];
}

/**
 * Calcula el progreso general del usuario en experimentos
 */
export async function getUserExperimentProgress(userId: string): Promise<{
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experimentsCompleted: number;
  averageBeliefChange: number;
  strongestArea: PredictionType | null;
  nextMilestone: { count: number; reward: string };
}> {
  const stats = await getExperimentStats(userId);

  // Determinar nivel
  let level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  if (stats.completedExperiments >= 50) level = 'expert';
  else if (stats.completedExperiments >= 25) level = 'advanced';
  else if (stats.completedExperiments >= 10) level = 'intermediate';
  else if (stats.completedExperiments >= 3) level = 'beginner';
  else level = 'novice';

  // Próximo hito
  const milestones = [
    { count: 3, reward: 'Insignia "Primer Paso"' },
    { count: 10, reward: 'Insignia "Explorador de Creencias"' },
    { count: 25, reward: 'Insignia "Científico Personal"' },
    { count: 50, reward: 'Insignia "Maestro Experimental"' },
  ];

  const nextMilestone = milestones.find(m => m.count > stats.completedExperiments)
    || { count: 100, reward: 'Insignia "Leyenda"' };

  return {
    level,
    experimentsCompleted: stats.completedExperiments,
    averageBeliefChange: stats.averageBeliefChange,
    strongestArea: stats.mostTestedPredictionType,
    nextMilestone,
  };
}

/**
 * Obtiene creencias que han cambiado significativamente
 */
export async function getTransformedBeliefs(userId: string): Promise<Array<{
  belief: string;
  initialLevel: BeliefLevel;
  currentLevel: BeliefLevel;
  totalChange: number;
  experimentsCount: number;
}>> {
  const histories = await getAllBeliefHistories(userId);

  return histories
    .filter(h => Math.abs(h.totalChange) >= 15) // Cambio significativo
    .map(h => ({
      belief: h.beliefText,
      initialLevel: h.history[0]?.level || 50,
      currentLevel: h.currentLevel,
      totalChange: h.totalChange,
      experimentsCount: h.experimentIds.length,
    }))
    .sort((a, b) => Math.abs(b.totalChange) - Math.abs(a.totalChange));
}

// ============================================================================
// EXPORTAR FUNCIONES DE DB OPERATIONS
// ============================================================================

export {
  createExperiment,
  getExperiment,
  getUserExperiments,
  updateExperiment,
  markExperimentReady,
  startExperimentExecution,
  completeExperimentExecution,
  completeExperimentReflection,
  abandonExperiment,
  getBeliefHistory,
  getAllBeliefHistories,
  getExperimentStats,
  suggestExperimentFromThoughtRecord,
  EXPERIMENT_POINTS,
};
