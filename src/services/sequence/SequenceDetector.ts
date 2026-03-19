// ============================================================================
// SequenceDetector.ts - Convierte eventos conductuales en secuencias
// ============================================================================
//
// PRINCIPIO: Todo evento conductual genera una FunctionalSequence.
// El detector NO filtra; esa decision se tomo explicitamente.
// La sintesis posterior decide que secuencias son relevantes para la formulacion.
//
// Cada funcion recibe datos crudos del evento y retorna una secuencia
// con nivel de confianza "inferred". El SequenceEnricher la mejora despues.
// ============================================================================

import {
  FunctionalSequence,
  createEmptySequence,
  getTimeSlot,
  calculateGlobalConfidence,
  determineConfidenceLevel,
  type EmotionalState,
  type MoodLevel,
  type BehaviorFunction,
  type BehaviorType,
  type ReinforcementType,
  type TriggerType,
  type DataSource,
} from './sequenceTypes';

// -----------------------------------------------------------------------------
// Interfaces de entrada (datos crudos del evento)
// -----------------------------------------------------------------------------

export interface BarrierLogEvent {
  id: number | string;
  userId: string;
  timestamp: Date;
  context: 'task_abandoned' | 'task_downsized' | 'task_refused' | 'day_skipped' | 'other';
  taskId?: string;
  taskCategory?: string;
  taskRoom?: string;
  taskName?: string;
  taskDifficulty?: string;
  emotionalState?: EmotionalState | string;
  energyLevel?: number;
  reportedBarrier?: string;
}

export interface TaskCompletionEvent {
  id: number | string;
  userId: string;
  timestamp: Date;
  taskId: string;
  taskCategory: string;
  taskRoom?: string;
  taskName: string;
  taskDifficulty: string;
  durationMinutes: number;
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  emotionalState?: EmotionalState | string;
  energyLevel?: number;
  wasDownsized?: boolean;
}

export interface TaskAbandonmentEvent {
  id: number | string;
  userId: string;
  timestamp: Date;
  taskId: string;
  taskCategory: string;
  taskRoom?: string;
  taskName: string;
  taskDifficulty: string;
  minutesBeforeAbandonment: number;
  moodBefore?: MoodLevel;
  moodAtAbandonment?: MoodLevel;
  emotionalState?: EmotionalState | string;
  energyLevel?: number;
  reason?: string;
}

export interface TaskRefusalEvent {
  id: number | string;
  userId: string;
  timestamp: Date;
  taskId: string;
  taskCategory: string;
  taskRoom?: string;
  taskName: string;
  taskDifficulty: string;
  emotionalState?: EmotionalState | string;
  energyLevel?: number;
}

export interface DaySkippedEvent {
  userId: string;
  date: Date;
  lastCheckInState?: EmotionalState;
  lastCheckInEnergy?: number;
  daysSinceLastActivity: number;
}

export interface ThoughtRecordEvent {
  id: number | string;
  userId: string;
  timestamp: Date;
  situation: string;
  automaticThought: string;
  emotion: string;
  emotionIntensityBefore: number;
  emotionIntensityAfter: number;
  cognitivePattern?: string;
  alternativeThought?: string;
  linkedTaskId?: string;
}

export interface ExposureAttemptEvent {
  id: number | string;
  userId: string;
  timestamp: Date;
  taskId: string;
  taskName: string;
  fearLevelBefore: number;
  fearLevelAfter: number;
  completed: boolean;
  durationMinutes: number;
  emotionalState?: EmotionalState | string;
}

// -----------------------------------------------------------------------------
// Funciones de deteccion
// -----------------------------------------------------------------------------

/**
 * Detecta secuencia desde un BarrierLog.
 * Fuente mas rica de datos conductuales problematicos.
 */
export function detectFromBarrierLog(event: BarrierLogEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'barrier_log', normalizeSourceId(event.id));
  seq.timestamp = event.timestamp;
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);

  // A
  seq.antecedent = {
    situation: buildBarrierSituation(event),
    timeOfDay: getTimeSlot(event.timestamp),
    dayOfWeek: event.timestamp.getDay(),
    internalState: {
      emotionalState: normalizedEmotionalState,
      energyLevel: event.energyLevel,
    },
    triggers: inferTriggersFromBarrier(event),
    cognitivePatterns: [],
  };

  // B
  const { type, valence } = mapBarrierContextToBehavior(event.context);
  seq.behavior = {
    description: buildBarrierBehaviorDescription(event),
    type,
    valence,
    context: {
      taskId: event.taskId,
      taskCategory: event.taskCategory,
      taskRoom: event.taskRoom,
      taskName: event.taskName,
      taskDifficulty: event.taskDifficulty,
    },
    topography: {},
    detectedFunction: inferFunctionFromBarrier(event),
  };

  // C
  seq.consequence = {
    immediate: {
      relief: event.context !== 'task_downsized',
      emotionalChange: {
        relief: event.context !== 'task_downsized',
        reliefLevel: event.context === 'task_abandoned' ? 3 : 2,
      },
      description: inferImmediateConsequence(event.context),
    },
    reinforcement: inferReinforcementFromBarrier(event),
  };

  // Confianza
  const components = {
    antecedent: event.energyLevel ? 45 : 30,
    behavior: 70,
    consequence: 20,
  };
  seq.confidence = {
    level: determineConfidenceLevel(calculateGlobalConfidence(components)),
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

/**
 * Detecta secuencia desde tarea completada.
 * Dato positivo esencial: muestra que FUNCIONA.
 */
export function detectFromTaskCompletion(event: TaskCompletionEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'task_completion', normalizeSourceId(event.id));
  seq.timestamp = event.timestamp;
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);

  seq.antecedent = {
    situation: `Completo tarea: ${event.taskName} (${event.taskCategory})`,
    timeOfDay: getTimeSlot(event.timestamp),
    dayOfWeek: event.timestamp.getDay(),
    internalState: {
      emotionalState: normalizedEmotionalState,
      energyLevel: event.energyLevel,
      reportedMood: event.moodBefore,
    },
    triggers: [],
    cognitivePatterns: [],
  };

  seq.behavior = {
    description: `Completo "${event.taskName}"`,
    type: event.wasDownsized ? 'partial_completion' : 'completion',
    valence: 'target',
    context: {
      taskId: event.taskId,
      taskCategory: event.taskCategory,
      taskRoom: event.taskRoom,
      taskDifficulty: event.taskDifficulty,
      taskName: event.taskName,
    },
    topography: {
      duration: event.durationMinutes,
      effortRequired: mapDifficultyToEffort(event.taskDifficulty),
    },
  };

  const hasMoodData = event.moodBefore != null && event.moodAfter != null;
  const moodImproved = hasMoodData && (event.moodAfter as number) > (event.moodBefore as number);

  seq.consequence = {
    immediate: {
      emotionalChange: hasMoodData
        ? {
            from: event.moodBefore,
            to: event.moodAfter,
            relief: false,
          }
        : undefined,
      description: moodImproved ? 'Mejoria de animo tras completar la tarea' : 'Tarea completada',
    },
    reinforcement: {
      type: 'positive_reinforcement',
      strength: moodImproved ? 4 : 2,
      isImmediate: true,
      whatIsGainedOrAvoided: 'Sensacion de logro, espacio ordenado',
    },
  };

  const components = {
    antecedent: normalizedEmotionalState ? 40 : 25,
    behavior: 90,
    consequence: hasMoodData ? 70 : 15,
  };
  seq.confidence = {
    level: determineConfidenceLevel(calculateGlobalConfidence(components)),
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

/**
 * Detecta secuencia desde tarea abandonada mid-ejecucion.
 * Escape (no avoidance): el usuario EMPEZO y luego paro.
 */
export function detectFromTaskAbandonment(event: TaskAbandonmentEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'task_abandonment', normalizeSourceId(event.id));
  seq.timestamp = event.timestamp;
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);

  seq.antecedent = {
    situation: `Abandono "${event.taskName}" despues de ${event.minutesBeforeAbandonment} min`,
    timeOfDay: getTimeSlot(event.timestamp),
    dayOfWeek: event.timestamp.getDay(),
    internalState: {
      emotionalState: normalizedEmotionalState,
      energyLevel: event.energyLevel,
      reportedMood: event.moodBefore,
    },
    triggers: event.reason
      ? [{ type: 'emotional' as TriggerType, description: event.reason, source: 'declared' as DataSource }]
      : [],
    cognitivePatterns: [],
  };

  seq.behavior = {
    description: `Abandono "${event.taskName}" tras ${event.minutesBeforeAbandonment} minutos`,
    type: 'escape',
    valence: 'problem',
    context: {
      taskId: event.taskId,
      taskCategory: event.taskCategory,
      taskRoom: event.taskRoom,
      taskDifficulty: event.taskDifficulty,
      taskName: event.taskName,
    },
    topography: { duration: event.minutesBeforeAbandonment },
    detectedFunction: { primary: 'escape_discomfort', confidence: 50 },
  };

  const hasMoodData = event.moodBefore != null && event.moodAtAbandonment != null;
  seq.consequence = {
    immediate: {
      emotionalChange: hasMoodData
        ? {
            from: event.moodBefore,
            to: event.moodAtAbandonment,
            relief: true,
            reliefLevel: 3,
          }
        : undefined,
      relief: true,
      description: 'Alivio por escapar de la tarea + posible frustracion',
    },
    reinforcement: {
      type: 'negative_reinforcement',
      strength: 3,
      isImmediate: true,
      whatIsGainedOrAvoided: 'Escapar del malestar durante la tarea',
    },
  };

  const components = {
    antecedent: event.reason ? 50 : 30,
    behavior: 85,
    consequence: hasMoodData ? 60 : 25,
  };
  seq.confidence = {
    level: determineConfidenceLevel(calculateGlobalConfidence(components)),
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

/**
 * Detecta secuencia desde rechazo de tarea (no la inicio).
 */
export function detectFromTaskRefusal(event: TaskRefusalEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'task_refusal', normalizeSourceId(event.id));
  seq.timestamp = event.timestamp;
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);

  seq.antecedent = {
    situation: `Rechazo tarea: ${event.taskName} (${event.taskCategory})`,
    timeOfDay: getTimeSlot(event.timestamp),
    dayOfWeek: event.timestamp.getDay(),
    internalState: {
      emotionalState: normalizedEmotionalState,
      energyLevel: event.energyLevel,
    },
    triggers: [
      {
        type: 'environmental' as TriggerType,
        description: `Se le presento "${event.taskName}" (dificultad: ${event.taskDifficulty})`,
        source: 'detected' as DataSource,
      },
    ],
    cognitivePatterns: [],
  };

  seq.behavior = {
    description: `Rechazo "${event.taskName}" sin iniciarla`,
    type: 'avoidance',
    valence: 'problem',
    context: {
      taskId: event.taskId,
      taskCategory: event.taskCategory,
      taskRoom: event.taskRoom,
      taskDifficulty: event.taskDifficulty,
      taskName: event.taskName,
    },
    topography: { duration: 0 },
    detectedFunction: { primary: inferFunctionFromRefusal(event), confidence: 40 },
  };

  seq.consequence = {
    immediate: {
      relief: true,
      emotionalChange: {
        relief: true,
        reliefLevel: 2,
      },
      description: 'Evito el inicio de la tarea',
    },
    reinforcement: {
      type: 'negative_reinforcement',
      strength: 2,
      isImmediate: true,
      whatIsGainedOrAvoided: 'No exponerse a la tarea',
    },
  };

  const components = { antecedent: 30, behavior: 75, consequence: 15 };
  seq.confidence = {
    level: determineConfidenceLevel(calculateGlobalConfidence(components)),
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

/**
 * Detecta secuencia desde dia sin actividad.
 * Confianza mas baja; casi todo es inferido.
 */
export function detectFromDaySkipped(event: DaySkippedEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'day_skipped');
  seq.timestamp = event.date;

  seq.antecedent = {
    situation: `Dia sin actividad (${event.daysSinceLastActivity} dias seguidos)`,
    timeOfDay: 'morning',
    dayOfWeek: event.date.getDay(),
    internalState: {
      emotionalState: event.lastCheckInState,
      energyLevel: event.lastCheckInEnergy,
    },
    triggers:
      event.daysSinceLastActivity > 2
        ? [
            {
              type: 'temporal' as TriggerType,
              description: 'Racha de inactividad prolongada',
              source: 'detected' as DataSource,
            },
          ]
        : [],
    cognitivePatterns: [],
  };

  seq.behavior = {
    description: 'No interactuo con la app en todo el dia',
    type: 'avoidance',
    valence: 'problem',
    topography: {},
  };

  seq.consequence = {
    immediate: {
      relief: false,
      description: 'Sin datos de consecuencia',
    },
  };

  const components = { antecedent: 15, behavior: 40, consequence: 5 };
  seq.confidence = {
    level: 'inferred',
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

/**
 * Detecta secuencia desde ThoughtRecord completado.
 * Conducta de coping; dato positivo con intensidad before/after medida.
 */
export function detectFromThoughtRecord(event: ThoughtRecordEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'thought_record', normalizeSourceId(event.id));
  seq.timestamp = event.timestamp;

  seq.antecedent = {
    situation: event.situation,
    timeOfDay: getTimeSlot(event.timestamp),
    dayOfWeek: event.timestamp.getDay(),
    internalState: {},
    triggers: [
      {
        type: 'cognitive' as TriggerType,
        description: event.automaticThought,
        source: 'declared' as DataSource,
      },
    ],
    cognitivePatterns: event.cognitivePattern ? [event.cognitivePattern as any] : [],
  };

  seq.behavior = {
    description: `Realizo registro de pensamientos: "${event.situation}"`,
    type: 'coping',
    valence: 'target',
    context: event.linkedTaskId ? { taskId: event.linkedTaskId } : undefined,
    topography: {},
  };

  const intensityReduced = event.emotionIntensityAfter < event.emotionIntensityBefore;
  const reduction = event.emotionIntensityBefore - event.emotionIntensityAfter;

  seq.consequence = {
    immediate: {
      emotionalChange: {
        from: toMoodLevelFromTenScale(event.emotionIntensityBefore),
        to: toMoodLevelFromTenScale(event.emotionIntensityAfter),
        relief: intensityReduced,
        reliefLevel: intensityReduced ? toReliefLevelFromDelta(reduction) : undefined,
      },
      description: intensityReduced
        ? `Intensidad emocional bajo de ${event.emotionIntensityBefore} a ${event.emotionIntensityAfter}/10`
        : 'La intensidad emocional no cambio significativamente',
    },
    reinforcement: intensityReduced
      ? {
          type: 'automatic_negative',
          strength: toReliefLevelFromDelta(reduction),
          isImmediate: true,
          whatIsGainedOrAvoided: 'Reduccion de malestar emocional a traves de reestructuracion',
        }
      : undefined,
  };

  const components = { antecedent: 75, behavior: 90, consequence: 65 };
  seq.confidence = {
    level: determineConfidenceLevel(calculateGlobalConfidence(components)),
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

/**
 * Detecta secuencia desde intento de exposicion gradual.
 */
export function detectFromExposureAttempt(event: ExposureAttemptEvent): FunctionalSequence {
  const seq = createEmptySequence(event.userId, 'exposure_attempt', normalizeSourceId(event.id));
  seq.timestamp = event.timestamp;
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);

  seq.antecedent = {
    situation: `Intento de exposicion: ${event.taskName}`,
    timeOfDay: getTimeSlot(event.timestamp),
    dayOfWeek: event.timestamp.getDay(),
    internalState: { emotionalState: normalizedEmotionalState },
    triggers: [
      {
        type: 'emotional' as TriggerType,
        description: `Nivel de miedo inicial: ${event.fearLevelBefore}/100`,
        source: 'declared' as DataSource,
      },
    ],
    cognitivePatterns: [],
  };

  seq.behavior = {
    description: event.completed
      ? `Completo exposicion: "${event.taskName}"`
      : `Intento exposicion pero no completo: "${event.taskName}"`,
    type: event.completed ? 'approach' : 'escape',
    valence: event.completed ? 'target' : 'problem',
    context: { taskId: event.taskId, taskName: event.taskName },
    topography: { duration: event.durationMinutes },
  };

  const fearReduced = event.fearLevelAfter < event.fearLevelBefore;
  seq.consequence = {
    immediate: {
      emotionalChange: {
        from: toMoodLevelFromHundredScale(event.fearLevelBefore),
        to: toMoodLevelFromHundredScale(event.fearLevelAfter),
        relief: fearReduced,
      },
      description: fearReduced
        ? `Miedo bajo de ${event.fearLevelBefore} a ${event.fearLevelAfter}/100`
        : 'Miedo se mantuvo o subio',
    },
    reinforcement:
      event.completed && fearReduced
        ? {
            type: 'automatic_negative',
            strength: 4,
            isImmediate: true,
            whatIsGainedOrAvoided: 'Reduccion de miedo por habituacion',
          }
        : undefined,
  };

  const components = { antecedent: 60, behavior: 85, consequence: 60 };
  seq.confidence = {
    level: determineConfidenceLevel(calculateGlobalConfidence(components)),
    score: calculateGlobalConfidence(components),
    components,
  };

  return seq;
}

// -----------------------------------------------------------------------------
// Auxiliares internas
// -----------------------------------------------------------------------------

function buildBarrierSituation(event: BarrierLogEvent): string {
  const parts: string[] = [];
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);
  const stateMap: Record<EmotionalState, string> = {
    good: 'sintiendose bien',
    okay: 'estado neutral',
    low_energy: 'con baja energia',
    overwhelmed: 'sintiendose abrumado/a',
  };
  if (normalizedEmotionalState) parts.push(stateMap[normalizedEmotionalState]);

  const timeMap: Record<string, string> = {
    early_morning: 'de madrugada',
    morning: 'por la manana',
    afternoon: 'por la tarde',
    evening: 'por la noche',
    night: 'de noche',
  };
  parts.push(timeMap[getTimeSlot(event.timestamp)]);

  if (event.taskName) {
    const contextMap: Record<BarrierLogEvent['context'], string> = {
      task_abandoned: `abandono "${event.taskName}"`,
      task_downsized: `redujo "${event.taskName}"`,
      task_refused: `rechazo "${event.taskName}"`,
      day_skipped: 'no realizo ninguna actividad',
      other: 'registro de barrera',
    };
    parts.push(contextMap[event.context]);
  }

  return parts.join(', ') || 'Situacion no especificada';
}

function buildBarrierBehaviorDescription(event: BarrierLogEvent): string {
  const map: Record<BarrierLogEvent['context'], string> = {
    task_abandoned: `Abandono la tarea "${event.taskName || 'sin nombre'}"`,
    task_downsized: `Redujo la dificultad de "${event.taskName || 'sin nombre'}"`,
    task_refused: `Rechazo realizar "${event.taskName || 'sin nombre'}"`,
    day_skipped: 'No realizo ninguna actividad durante el dia',
    other: `Registro de barrera${event.taskName ? ` en "${event.taskName}"` : ''}`,
  };
  return map[event.context];
}

function mapBarrierContextToBehavior(
  context: BarrierLogEvent['context']
): { type: BehaviorType; valence: 'problem' | 'target' | 'neutral' } {
  switch (context) {
    case 'task_abandoned':
      return { type: 'escape', valence: 'problem' };
    case 'task_refused':
      return { type: 'avoidance', valence: 'problem' };
    case 'task_downsized':
      return { type: 'coping', valence: 'neutral' };
    case 'day_skipped':
      return { type: 'avoidance', valence: 'problem' };
    default:
      return { type: 'other', valence: 'neutral' };
  }
}

function inferTriggersFromBarrier(event: BarrierLogEvent) {
  const triggers: Array<{ type: TriggerType; description: string; source: DataSource }> = [];
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);

  if (normalizedEmotionalState === 'overwhelmed') {
    triggers.push({ type: 'emotional', description: 'Sensacion de agobio', source: 'detected' });
  } else if (normalizedEmotionalState === 'low_energy') {
    triggers.push({ type: 'physical', description: 'Baja energia', source: 'detected' });
  }

  if (event.reportedBarrier) {
    triggers.push({ type: 'emotional', description: event.reportedBarrier, source: 'declared' });
  }

  const hour = event.timestamp.getHours();
  if (hour >= 21 || hour < 6) {
    triggers.push({ type: 'temporal', description: 'Hora tardia del dia', source: 'detected' });
  }

  return triggers;
}

function inferFunctionFromBarrier(
  event: BarrierLogEvent
): { primary: BehaviorFunction; confidence: number; secondary?: BehaviorFunction } | undefined {
  const normalizedEmotionalState = normalizeEmotionalState(event.emotionalState);
  if (normalizedEmotionalState === 'overwhelmed') {
    return { primary: 'escape_discomfort', secondary: 'reduce_anxiety', confidence: 45 };
  }
  if (normalizedEmotionalState === 'low_energy') {
    return { primary: 'preserve_energy', confidence: 40 };
  }
  if (event.context === 'task_refused') {
    return { primary: 'avoid_failure', secondary: 'protect_self_esteem', confidence: 35 };
  }
  return { primary: 'escape_discomfort', confidence: 25 };
}

function inferImmediateConsequence(context: BarrierLogEvent['context']): string {
  const map: Record<BarrierLogEvent['context'], string> = {
    task_abandoned: 'Alivio inmediato por dejar la tarea + probable frustracion posterior',
    task_refused: 'Evito el inicio de la tarea',
    task_downsized: 'Ajusto la tarea a su capacidad actual',
    day_skipped: 'Dia sin interaccion con el hogar',
    other: 'Se registro una barrera',
  };
  return map[context];
}

function inferReinforcementFromBarrier(event: BarrierLogEvent) {
  if (event.context === 'task_downsized') {
    return {
      type: 'positive_reinforcement' as ReinforcementType,
      strength: 2 as 1 | 2 | 3 | 4 | 5,
      isImmediate: true,
      whatIsGainedOrAvoided: 'Tarea mas manejable, sensacion de control',
    };
  }

  return {
    type: 'negative_reinforcement' as ReinforcementType,
    strength: (normalizeEmotionalState(event.emotionalState) === 'overwhelmed' ? 4 : 2) as 1 | 2 | 3 | 4 | 5,
    isImmediate: true,
    whatIsGainedOrAvoided:
      normalizeEmotionalState(event.emotionalState) === 'overwhelmed'
        ? 'Escapar de la sensacion de agobio'
        : 'Evitar el esfuerzo o malestar',
  };
}

function inferFunctionFromRefusal(event: TaskRefusalEvent): BehaviorFunction {
  if (event.energyLevel && event.energyLevel <= 2) return 'preserve_energy';
  if (normalizeEmotionalState(event.emotionalState) === 'overwhelmed') return 'escape_discomfort';
  if (event.taskDifficulty === 'high' || event.taskDifficulty === 'medium') return 'avoid_failure';
  return 'delay_decision';
}

function mapDifficultyToEffort(difficulty: string): 1 | 2 | 3 | 4 | 5 {
  const map: Record<string, 1 | 2 | 3 | 4 | 5> = {
    micro: 1,
    low: 2,
    medium: 3,
    high: 4,
    deep: 5,
  };
  return map[difficulty] || 3;
}

function toMoodLevelFromTenScale(value: number): MoodLevel {
  const v = Math.max(1, Math.min(5, Math.ceil(value / 2)));
  return v as MoodLevel;
}

function toMoodLevelFromHundredScale(value: number): MoodLevel {
  const v = Math.max(1, Math.min(5, Math.ceil(value / 20)));
  return v as MoodLevel;
}

function toReliefLevelFromDelta(delta: number): 1 | 2 | 3 | 4 | 5 {
  const v = Math.max(1, Math.min(5, Math.ceil(delta / 2)));
  return v as 1 | 2 | 3 | 4 | 5;
}

function normalizeEmotionalState(value?: string): EmotionalState | undefined {
  if (!value) return undefined;
  const map: Record<string, EmotionalState> = {
    good: 'good',
    okay: 'okay',
    low_energy: 'low_energy',
    overwhelmed: 'overwhelmed',
    hardtostart: 'overwhelmed',
    tengoalgodeenergia: 'okay',
    noenergy: 'low_energy',
    lowenergy: 'low_energy',
  };
  return map[value.toLowerCase()] || undefined;
}

function normalizeSourceId(value: number | string): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
