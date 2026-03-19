// ============================================================================
// SequenceEnricher.ts - Enriquece secuencias cruzando datos
// ============================================================================
//
// El enriquecimiento toma una secuencia 'inferred' y la mejora con:
// 1. Contexto temporal (check-in diario del mismo dia)
// 2. Datos cognitivos (ThoughtRecords cercanos en el tiempo)
// 3. Patrones historicos (secuencias pasadas similares)
// 4. Datos de actividad posterior (que hizo despues)
//
// Resultado: la confianza sube, y la secuencia pasa de 'inferred'
// a 'enriched' cuando cruza el umbral del 45%.
// ============================================================================

import {
  FunctionalSequence,
  calculateGlobalConfidence,
  determineConfidenceLevel,
  type CognitivePattern,
  type MoodLevel,
  type EmotionalState,
  type BehaviorFunction,
  type ReinforcementType,
} from './sequenceTypes';

// -----------------------------------------------------------------------------
// Interfaces de datos disponibles para cruce
// -----------------------------------------------------------------------------

/** Check-in diario del mismo dia */
export interface DailyCheckInData {
  id?: number;
  date?: Date;
  emotionalState?: EmotionalState | string;
  energyLevel?: number;
  motivationLevel?: number;
  sleepQuality?: 'poor' | 'ok' | 'good';
}

/** ThoughtRecord cercano en tiempo (+/-2 horas) */
export interface NearbyThoughtRecord {
  id: number | string;
  timestamp?: Date;
  situation?: string;
  automaticThought?: string;
  cognitivePattern?: CognitivePattern | string;
  emotionIntensityBefore?: number;
  emotionIntensityAfter?: number;
  linkedTaskId?: string;
}

/** Actividad que ocurrio despues de la secuencia (0-3 horas) */
export interface SubsequentActivity {
  id: number | string;
  timestamp?: Date;
  type?: 'task_completed' | 'task_abandoned' | 'task_refused' | 'checkin';
  completed?: boolean;
  taskName?: string;
  moodLevel?: MoodLevel;
  moodImprovement?: number;
}

/** Secuencias historicas similares del mismo usuario */
export interface HistoricalPattern {
  similarSequenceCount?: number;
  averageConsequence?: {
    reliefFrequency: number;
    moodWorsened: number;
    cascadeAvoidance: number;
  };
  mostCommonFunction?: BehaviorFunction;
  mostCommonReinforcement?: ReinforcementType;
  confidenceInPattern?: number;
  repeatedFactors?: string[];
  suggestedValence?: 'problem' | 'target' | 'neutral';
}

// -----------------------------------------------------------------------------
// Funcion principal de enriquecimiento
// -----------------------------------------------------------------------------

export interface EnrichmentContext {
  dailyCheckIn?: DailyCheckInData;
  nearbyThoughtRecords: NearbyThoughtRecord[];
  subsequentActivities: SubsequentActivity[];
  historicalPattern?: HistoricalPattern;
}

/**
 * Enriquece una secuencia con todos los datos contextuales disponibles.
 * Retorna una NUEVA secuencia (no muta la original).
 *
 * El enriquecimiento es aditivo: cada fuente de datos suma confianza
 * pero nunca reduce la existente.
 */
export function enrichSequence(
  sequence: FunctionalSequence,
  context: EnrichmentContext
): FunctionalSequence {
  let enriched = structuredClone(sequence);
  const now = new Date();

  if (context.dailyCheckIn) {
    enriched = enrichWithDailyCheckIn(enriched, context.dailyCheckIn);
  }

  if (context.nearbyThoughtRecords.length > 0) {
    enriched = enrichWithThoughtRecords(enriched, context.nearbyThoughtRecords);
  }

  if (context.subsequentActivities.length > 0) {
    enriched = enrichWithSubsequentActivity(enriched, context.subsequentActivities);
  }

  if (context.historicalPattern) {
    enriched = enrichWithHistoricalPattern(enriched, context.historicalPattern);
  }

  const components = ensureConfidenceComponents(enriched);
  enriched.confidence.score = calculateGlobalConfidence(components);
  enriched.confidence.level = determineConfidenceLevel(enriched.confidence.score);
  enriched.updatedAt = now;

  return enriched;
}

// -----------------------------------------------------------------------------
// Enriquecimiento por fuente
// -----------------------------------------------------------------------------

function enrichWithDailyCheckIn(
  seq: FunctionalSequence,
  checkIn: DailyCheckInData
): FunctionalSequence {
  if (!seq.antecedent.internalState) {
    seq.antecedent.internalState = {};
  }

  if (!seq.antecedent.internalState.emotionalState && checkIn.emotionalState) {
    seq.antecedent.internalState.emotionalState = normalizeEmotionalState(checkIn.emotionalState);
  }
  if (!seq.antecedent.internalState.energyLevel && checkIn.energyLevel != null) {
    seq.antecedent.internalState.energyLevel = checkIn.energyLevel;
  }

  if (checkIn.sleepQuality || checkIn.energyLevel != null) {
    seq.antecedent.remoteContext = {
      ...seq.antecedent.remoteContext,
      sleepQuality: checkIn.sleepQuality,
      dayOverallMood: checkIn.energyLevel != null ? toMoodLevel(checkIn.energyLevel) : seq.antecedent.remoteContext?.dayOverallMood,
    };
  }

  if (
    checkIn.energyLevel != null &&
    checkIn.energyLevel <= 2 &&
    seq.behavior.valence === 'problem' &&
    !getAntecedentTriggers(seq).some((t) => t.type === 'physical')
  ) {
    getAntecedentTriggers(seq).push({
      type: 'physical',
      description: `Energia del dia: ${checkIn.energyLevel}/5`,
      source: 'detected',
    });
  }

  if (checkIn.sleepQuality === 'poor' && seq.behavior.valence === 'problem') {
    getAntecedentTriggers(seq).push({
      type: 'physical',
      description: 'Mala calidad de sueno reportada',
      source: 'detected',
    });
  }

  const components = ensureConfidenceComponents(seq);
  components.antecedent = Math.min(100, components.antecedent + 15);

  if (typeof checkIn.id === 'number') {
    seq.source.enrichmentSources.push({
      table: 'dailyCheckIns',
      id: checkIn.id,
      addedAt: new Date(),
    });
  }

  return seq;
}

function enrichWithThoughtRecords(
  seq: FunctionalSequence,
  records: NearbyThoughtRecord[]
): FunctionalSequence {
  for (const record of records) {
    const isDirectMatch = Boolean(record.linkedTaskId && record.linkedTaskId === seq.behavior.context?.taskId);

    if (
      record.cognitivePattern &&
      !getCognitivePatterns(seq).includes(record.cognitivePattern as CognitivePattern)
    ) {
      getCognitivePatterns(seq).push(record.cognitivePattern as CognitivePattern);
    }

    if (
      record.automaticThought &&
      !getAntecedentTriggers(seq).some(
        (t) => t.type === 'cognitive' && t.description === record.automaticThought
      )
    ) {
      getAntecedentTriggers(seq).push({
        type: 'cognitive',
        description: record.automaticThought,
        source: isDirectMatch ? 'declared' : 'detected',
      });
    }

    const numericId = toNumberId(record.id);
    if (numericId != null) {
      seq.source.enrichmentSources.push({
        table: 'thoughtRecords',
        id: numericId,
        addedAt: new Date(),
      });
    }

    const components = ensureConfidenceComponents(seq);
    components.antecedent = Math.min(100, components.antecedent + (isDirectMatch ? 25 : 15));
  }

  return seq;
}

function enrichWithSubsequentActivity(
  seq: FunctionalSequence,
  activities: SubsequentActivity[]
): FunctionalSequence {
  if (activities.length === 0) return seq;

  const typed = activities.map((a) => ({
    ...a,
    type:
      a.type ||
      (a.completed === true ? 'task_completed' : a.completed === false ? 'task_abandoned' : 'checkin'),
  }));

  const completedAfter = typed.filter((a) => a.type === 'task_completed');
  const avoidedAfter = typed.filter(
    (a) => a.type === 'task_abandoned' || a.type === 'task_refused'
  );

  if (seq.behavior.valence === 'problem' && avoidedAfter.length > 0) {
    seq.consequence.shortTerm = {
      ...seq.consequence.shortTerm,
      cascadeEffect: true,
      moodTrend: 'worsened',
      nextActionTaken: `Evito ${avoidedAfter.length} tarea(s) mas despues`,
    };

    if (seq.consequence.reinforcement) {
      seq.consequence.reinforcement.strength = Math.min(
        5,
        seq.consequence.reinforcement.strength + 1
      ) as 1 | 2 | 3 | 4 | 5;
    }
  }

  if (seq.behavior.valence === 'problem' && completedAfter.length > 0) {
    seq.consequence.shortTerm = {
      ...seq.consequence.shortTerm,
      cascadeEffect: false,
      nextActionTaken: `Completo "${completedAfter[0].taskName || 'una tarea'}" despues`,
    };
  }

  if (seq.behavior.valence === 'target' && completedAfter.length > 0) {
    seq.consequence.shortTerm = {
      ...seq.consequence.shortTerm,
      moodTrend: 'improved',
      cascadeEffect: false,
      nextActionTaken: `Completo ${completedAfter.length} tarea(s) mas`,
    };
  }

  const subsequentMoods = typed
    .filter((a) => a.moodLevel != null)
    .map((a) => a.moodLevel as number);

  if (subsequentMoods.length > 0) {
    const avgMoodAfter = subsequentMoods.reduce((a, b) => a + b, 0) / subsequentMoods.length;
    const initialMood = seq.antecedent.internalState?.reportedMood;

    if (initialMood) {
      seq.consequence.shortTerm = {
        ...seq.consequence.shortTerm,
        moodTrend:
          avgMoodAfter > initialMood
            ? 'improved'
            : avgMoodAfter < initialMood
              ? 'worsened'
              : 'stable',
      };
    }
  }

  const components = ensureConfidenceComponents(seq);
  components.consequence = Math.min(100, components.consequence + 20);

  for (const activity of typed) {
    const numericId = toNumberId(activity.id);
    if (numericId != null) {
      seq.source.enrichmentSources.push({
        table: 'activityLogs',
        id: numericId,
        addedAt: new Date(),
      });
    }
  }

  return seq;
}

function enrichWithHistoricalPattern(
  seq: FunctionalSequence,
  pattern: HistoricalPattern
): FunctionalSequence {
  const historicalConfidence = pattern.confidenceInPattern ?? 0;
  const similarCount = pattern.similarSequenceCount ?? pattern.repeatedFactors?.length ?? 0;
  if (similarCount < 3 && historicalConfidence < 35) return seq;

  if (
    pattern.mostCommonFunction &&
    (!seq.behavior.detectedFunction || seq.behavior.detectedFunction.confidence < historicalConfidence)
  ) {
    seq.behavior.detectedFunction = {
      primary: pattern.mostCommonFunction,
      confidence: Math.min(80, historicalConfidence || 45),
    };
  }

  if (!seq.consequence.reinforcement && pattern.mostCommonReinforcement) {
    seq.consequence.reinforcement = {
      type: pattern.mostCommonReinforcement,
      strength: 3,
      isImmediate: true,
      whatIsGainedOrAvoided: inferReinforcementDescription(pattern.mostCommonReinforcement, seq.behavior.type || 'other'),
    };
  }

  if (!seq.consequence.shortTerm && pattern.averageConsequence) {
    seq.consequence.shortTerm = {
      cascadeEffect: pattern.averageConsequence.cascadeAvoidance > 0.5,
      moodTrend: pattern.averageConsequence.moodWorsened > 0.5 ? 'worsened' : 'stable',
    };
  }

  const components = ensureConfidenceComponents(seq);
  components.consequence = Math.min(
    100,
    components.consequence + Math.round((historicalConfidence || 30) * 0.3)
  );
  components.behavior = Math.min(
    100,
    components.behavior + Math.round((historicalConfidence || 30) * 0.15)
  );

  if (pattern.suggestedValence) {
    seq.behavior.valence = pattern.suggestedValence;
  }

  return seq;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function inferReinforcementDescription(
  type: ReinforcementType,
  behaviorType: string
): string {
  const descriptions: Record<ReinforcementType, Record<string, string>> = {
    negative_reinforcement: {
      avoidance: 'Evitar el malestar anticipado',
      escape: 'Escapar del malestar durante la tarea',
      procrastination: 'Posponer la incomodidad',
      default: 'Reducir un estado aversivo',
    },
    positive_reinforcement: {
      completion: 'Sensacion de logro y progreso',
      approach: 'Satisfaccion por enfrentar el reto',
      coping: 'Sensacion de control sobre la situacion',
      default: 'Obtener algo gratificante',
    },
    automatic_negative: {
      default: 'Reduccion automatica de tension',
    },
    automatic_positive: {
      default: 'Activacion positiva automatica',
    },
  };

  const typeDescriptions = descriptions[type];
  return typeDescriptions[behaviorType] || typeDescriptions.default || 'Refuerzo no especificado';
}

function ensureConfidenceComponents(seq: FunctionalSequence): {
  antecedent: number;
  behavior: number;
  consequence: number;
} {
  if (!seq.confidence.components) {
    seq.confidence.components = { antecedent: 20, behavior: 50, consequence: 10 };
  }
  return seq.confidence.components;
}

function toNumberId(value: number | string): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toMoodLevel(value: number): MoodLevel {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return v as MoodLevel;
}

function getImmediateObject(seq: FunctionalSequence): { relief?: boolean } | undefined {
  if (!seq.consequence.immediate || typeof seq.consequence.immediate === 'string') return undefined;
  return seq.consequence.immediate;
}

function getAntecedentTriggers(seq: FunctionalSequence): Array<{
  type: 'cognitive' | 'emotional' | 'environmental' | 'physical' | 'social' | 'temporal';
  description: string;
  source: 'inferred' | 'detected' | 'declared';
}> {
  if (!seq.antecedent.triggers) seq.antecedent.triggers = [];
  return seq.antecedent.triggers;
}

function getCognitivePatterns(seq: FunctionalSequence): CognitivePattern[] {
  if (!seq.antecedent.cognitivePatterns) seq.antecedent.cognitivePatterns = [];
  return seq.antecedent.cognitivePatterns;
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

// -----------------------------------------------------------------------------
// Funciones de consulta para obtener contexto
// -----------------------------------------------------------------------------

export function getEnrichmentTimeWindows(sequenceTimestamp: Date) {
  const seqTime = sequenceTimestamp.getTime();
  const hourMs = 60 * 60 * 1000;

  return {
    dailyCheckIn: {
      start: new Date(new Date(sequenceTimestamp).setHours(0, 0, 0, 0)),
      end: new Date(new Date(sequenceTimestamp).setHours(23, 59, 59, 999)),
    },
    thoughtRecords: {
      start: new Date(seqTime - 2 * hourMs),
      end: new Date(seqTime + 2 * hourMs),
    },
    subsequentActivity: {
      start: new Date(seqTime),
      end: new Date(seqTime + 3 * hourMs),
    },
    historicalPattern: {
      start: new Date(seqTime - 28 * 24 * hourMs),
      end: sequenceTimestamp,
    },
  };
}

export function areSequencesSimilar(
  a: FunctionalSequence,
  b: FunctionalSequence
): boolean {
  if (a.behavior.type !== b.behavior.type) return false;
  if (a.behavior.valence !== b.behavior.valence) return false;

  const timeSlots = ['early_morning', 'morning', 'afternoon', 'evening', 'night'];
  const aIdx = timeSlots.indexOf(a.antecedent.timeOfDay || 'afternoon');
  const bIdx = timeSlots.indexOf(b.antecedent.timeOfDay || 'afternoon');
  if (Math.abs(aIdx - bIdx) > 1) return false;

  const sameCategory =
    a.behavior.context?.taskCategory &&
    a.behavior.context.taskCategory === b.behavior.context?.taskCategory;
  const sameRoom =
    a.behavior.context?.taskRoom &&
    a.behavior.context.taskRoom === b.behavior.context?.taskRoom;

  if (a.behavior.context?.taskCategory && b.behavior.context?.taskCategory) {
    return Boolean(sameCategory || sameRoom);
  }

  return true;
}

export function buildHistoricalPattern(
  sequences: FunctionalSequence[]
): HistoricalPattern | undefined {
  if (sequences.length < 3) return undefined;

  const total = sequences.length;

  const reliefCount = sequences.filter((s) => getImmediateObject(s)?.relief).length;

  const cascadeCount = sequences.filter((s) => s.consequence.shortTerm?.cascadeEffect).length;

  const moodWorsenedCount = sequences.filter(
    (s) => s.consequence.shortTerm?.moodTrend === 'worsened'
  ).length;

  const functionCounts = new Map<BehaviorFunction, number>();
  for (const seq of sequences) {
    const fn = seq.behavior.detectedFunction?.primary;
    if (fn) functionCounts.set(fn, (functionCounts.get(fn) || 0) + 1);
  }
  const mostCommonFunction = [...functionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'escape_discomfort';

  const reinforcementCounts = new Map<ReinforcementType, number>();
  for (const seq of sequences) {
    const rt = seq.consequence.reinforcement?.type;
    if (rt) reinforcementCounts.set(rt, (reinforcementCounts.get(rt) || 0) + 1);
  }
  const mostCommonReinforcement =
    [...reinforcementCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'negative_reinforcement';

  return {
    similarSequenceCount: total,
    averageConsequence: {
      reliefFrequency: reliefCount / total,
      moodWorsened: moodWorsenedCount / total,
      cascadeAvoidance: cascadeCount / total,
    },
    mostCommonFunction,
    mostCommonReinforcement,
    confidenceInPattern: Math.min(90, 30 + total * 5),
  };
}
