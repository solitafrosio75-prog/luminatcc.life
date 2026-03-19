// ============================================================================
// sequenceTypes.ts - Tipos del sistema ABC como Esqueleto
// ============================================================================
//
// La FunctionalSequence es la UNIDAD ATOMICA de toda la comprension
// terapeutica del usuario. Cada evento conductual genera una.
// La formulacion del caso se CONSTRUYE desde secuencias acumuladas.
// ============================================================================

// -----------------------------------------------------------------------------
// Re-exports de tipos canónicos desde database.ts
// -----------------------------------------------------------------------------

import type { CognitivePattern as _CognitivePattern, TimeSlot as _TimeSlot } from '../../db/database';
export type CognitivePattern = _CognitivePattern;
export type TimeSlot = _TimeSlot;

// -----------------------------------------------------------------------------
// Tipos propios de secuencias (no duplicados en database.ts)
// -----------------------------------------------------------------------------

export type EmotionalState = 'good' | 'okay' | 'low_energy' | 'overwhelmed';
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type Trend = 'improving' | 'stable' | 'worsening';

export type BehaviorFunction =
  | 'escape_discomfort'
  | 'avoid_failure'
  | 'avoid_judgment'
  | 'maintain_control'
  | 'reduce_anxiety'
  | 'preserve_energy'
  | 'delay_decision'
  | 'seek_comfort'
  | 'protect_self_esteem';

export type ReinforcementType =
  | 'positive_reinforcement'
  | 'negative_reinforcement'
  | 'automatic_positive'
  | 'automatic_negative';

export type BehaviorType =
  | 'avoidance'
  | 'procrastination'
  | 'escape'
  | 'compulsion'
  | 'completion'
  | 'partial_completion'
  | 'approach'
  | 'coping'
  | 'other';

export type TCCTechnique =
  | 'micro_tasks'
  | 'behavioral_activation'
  | 'cognitive_restructuring'
  | 'exposure_gradual'
  | 'problem_solving'
  | 'stimulus_control'
  | 'self_reinforcement'
  | 'relaxation'
  | 'mindfulness'
  | 'activity_scheduling'
  | 'thought_record'
  | 'behavioral_experiment';

// -----------------------------------------------------------------------------
// SEQUENCE SOURCE & CONFIDENCE
// -----------------------------------------------------------------------------

export type SequenceSourceType =
  | 'barrier_log'
  | 'task_completion'
  | 'task_abandonment'
  | 'task_refusal'
  | 'task_downsized'
  | 'day_skipped'
  | 'weekly_reflection'
  | 'user_initiated'
  | 'thought_record'
  | 'exposure_attempt'
  | 'manual';

export type ConfidenceLevel = 'inferred' | 'enriched' | 'validated' | 'explicit' | 'low' | 'medium' | 'high';
export type TriggerType = 'cognitive' | 'emotional' | 'environmental' | 'physical' | 'social' | 'temporal';
export type DataSource = 'inferred' | 'detected' | 'declared';

export interface SequenceSource {
  type: SequenceSourceType;
  sourceId?: number | string;
  enrichmentSources: Array<{
    table: string;
    id: number;
    addedAt: Date;
  }>;
}

export interface ConfidenceScore {
  level: ConfidenceLevel;
  score: number;
  rationale?: string;
  components?: {
    antecedent: number;
    behavior: number;
    consequence: number;
  };
}

// --- A: Antecedente ----------------------------------------------------------

export interface SequenceAntecedent {
  situation?: string;
  internalTrigger?: string;
  externalTrigger?: string;
  context?: string;
  source?: DataSource | 'event' | 'inferred' | 'user_validated';
  timeOfDay?: TimeSlot;
  dayOfWeek?: number;
  internalState?: {
    emotionalState?: EmotionalState;
    energyLevel?: number;
    reportedMood?: MoodLevel;
  };
  triggers?: Array<{
    type: TriggerType;
    description: string;
    source: DataSource;
  }>;
  cognitivePatterns?: CognitivePattern[];
  remoteContext?: {
    recentStressors?: string[];
    sleepQuality?: 'poor' | 'ok' | 'good';
    dayOverallMood?: MoodLevel;
  };
}

// --- B: Conducta -------------------------------------------------------------

export interface SequenceBehavior {
  label?: string;
  actionType?: string;
  intensity?: number;
  durationMinutes?: number;
  description?: string;
  type?: BehaviorType;
  valence?: 'problem' | 'target' | 'neutral';
  context?: {
    taskId?: string;
    taskCategory?: string;
    taskRoom?: string;
    taskDifficulty?: string;
    taskName?: string;
  };
  topography?: {
    duration?: number;
    intensity?: 1 | 2 | 3 | 4 | 5;
    automaticity?: 1 | 2 | 3 | 4 | 5;
    effortRequired?: 1 | 2 | 3 | 4 | 5;
  };
  detectedFunction?: {
    primary: BehaviorFunction;
    secondary?: BehaviorFunction;
    confidence: number;
  };
}

// --- C: Consecuencia ---------------------------------------------------------

export interface SequenceConsequence {
  immediate?: {
    relief?: boolean;
    emotionalChange?: {
      from?: MoodLevel;
      to?: MoodLevel;
      relief: boolean;
      reliefLevel?: 1 | 2 | 3 | 4 | 5;
    };
    description?: string;
  } | string;
  source?: DataSource | 'event' | 'inferred' | 'user_validated';
  shortTermRelief?: boolean;
  longTermCost?: string;
  moodShift?: number;
  shortTerm?: {
    moodTrend?: 'improved' | 'stable' | 'worsened';
    nextActionTaken?: string;
    cascadeEffect?: boolean;
  };
  reinforcement?: {
    type: ReinforcementType;
    strength: 1 | 2 | 3 | 4 | 5;
    isImmediate: boolean;
    whatIsGainedOrAvoided: string;
  };
}

// --- Analisis de ciclo -------------------------------------------------------

export interface CycleAnalysis {
  belongsToPatternId?: string;
  cyclePosition?: 'trigger' | 'escalation' | 'behavior' | 'relief' | 'guilt';
  interventionApplied?: {
    technique: TCCTechnique;
    result: 'helped' | 'partial' | 'not_helpful' | 'not_tried';
  };
}

// --- Validacion --------------------------------------------------------------

export interface SequenceValidation {
  // Modelo nuevo (embedded)
  shownToUser?: boolean;
  shownAt?: Date;
  userValidated?: boolean;
  validatedAt?: Date;
  userAdjustments?: {
    antecedentChanged: boolean;
    behaviorChanged: boolean;
    consequenceChanged: boolean;
    notes?: string;
  };

  // Compatibilidad temporal (prompt model)
  id?: string;
  userId?: string;
  sequenceId?: string;
  createdAt?: Date;
  expiresAt?: Date;
  status?: 'pending' | 'answered' | 'skipped' | 'expired';
  priority?: 'low' | 'medium' | 'high';
  questionType?:
    | 'antecedent_disambiguation'
    | 'behavior_clarification'
    | 'consequence_confirmation'
    | 'confidence_check';
  question?: string;
  options?: ValidationOption[];
  selectedOptionId?: string;
  freeTextAnswer?: string;
  answeredAt?: Date;
  confidenceBefore?: number;
  confidenceAfter?: number;
}

// --- LA SECUENCIA COMPLETA ---------------------------------------------------

export interface FunctionalSequence {
  id?: number;
  userId: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  status?: 'detected' | 'enriched' | 'validated' | 'discarded';
  source: SequenceSource;
  confidence: ConfidenceScore;
  eventType?: SequenceEventType;
  eventId?: string | number;
  antecedent: SequenceAntecedent;
  behavior: SequenceBehavior;
  consequence: SequenceConsequence;
  cycleAnalysis?: CycleAnalysis;
  validation: SequenceValidation;
  inferredMaintainingFactors?: string[];
  tags?: string[];
  sourceRefs?: SequenceSourceRef[];
  processedInFormulationVersion?: number;
}

// -----------------------------------------------------------------------------
// CONSOLIDATED CHAIN - Patron recurrente
// -----------------------------------------------------------------------------

export interface BreakingPoint {
  where: 'before_trigger' | 'at_trigger' | 'during' | 'after';
  intervention: string;
  technique: TCCTechnique;
  timesTriedByUser: number;
  effectiveness: number;
}

export interface ConsolidatedChain {
  id?: number;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  chainKey?: string;
  label?: string;
  typicalAntecedents?: Array<{
    description: string;
    frequency: number;
    source: DataSource;
  }>;
  typicalBehavior?: {
    description: string;
    type: BehaviorType;
    function: BehaviorFunction;
  };
  typicalConsequences?: {
    immediate: string;
    reinforcementType: ReinforcementType;
    longTermEffect: string;
  };
  metrics: {
    occurrences: number;
    firstSeen?: Date;
    lastSeen: Date;
    trend?: Trend;
    strengthScore?: number;
    avgConfidenceScore?: number;
  };
  breakingPoints?: BreakingPoint[];
  sequenceIds: number[];
  averageConfidence?: number;
}

// -----------------------------------------------------------------------------
// CHAIN INTERACTION
// -----------------------------------------------------------------------------

export interface ChainInteraction {
  fromChainId: string;
  toChainId: string;
  relationship: 'triggers' | 'inhibits' | 'cooccurs';
  description: string;
  confidence: number;
}

// -----------------------------------------------------------------------------
// INTEGRATED CASE FORMULATION
// -----------------------------------------------------------------------------

export interface BehaviorMapEntry {
  id: string;
  description: string;
  type: BehaviorType;
  frequency: { current: string; baseline?: string; trend: Trend };
  sequenceCount: number;
}

export interface ProblemBehaviorEntry extends BehaviorMapEntry {
  averageIntensity: number;
  contexts: string[];
}

export interface TargetBehaviorEntry extends BehaviorMapEntry {
  bestContexts: string[];
}

export interface MaintainingFactor {
  factor: string;
  type: 'cognitive' | 'emotional' | 'behavioral' | 'environmental' | 'social';
  weight: number;
  addressedBy?: TCCTechnique;
}

export interface ProtectiveFactor {
  factor: string;
  source: string;
  impact: number;
}

export interface DeclaredVsDetectedComparison {
  aspect: string;
  declared: string;
  detected: string;
  alignment: 'aligned' | 'partial' | 'divergent';
  insight: string;
}

export interface IntegratedCaseFormulation {
  id?: number;
  userId: string;
  version: number;
  generatedAt: Date;
  sequencesProcessed?: number;
  totalSequences?: number;
  confidenceScore?: number;
  summary?: string;
  dominantAntecedents?: string[];
  dominantBehaviors?: string[];
  dominantConsequences?: string[];
  interventionTargets?: Array<{
    id: string;
    focus: 'antecedent' | 'behavior' | 'consequence';
    description: string;
    suggestedTechniques: string[];
    supportingSequenceIds: string[];
  }>;
  evidenceSequenceIds?: number[];
  behaviorMap?: {
    problemBehaviors: ProblemBehaviorEntry[];
    targetBehaviors: TargetBehaviorEntry[];
  };
  functionalRelationships: {
    consolidatedChains: ConsolidatedChain[];
    chainInteractions?: ChainInteraction[];
  };
  cognitiveProfile?: {
    predominantPatterns: Array<{
      pattern: CognitivePattern;
      frequency: number;
      linkedChainIds: string[];
      successfulReframes: number;
      trend: Trend;
    }>;
    inferredBeliefs: Array<{
      belief: string;
      supportingPatterns: CognitivePattern[];
      confidence: number;
    }>;
  };
  maintenanceCycle?: {
    narrative: string;
    strength: number;
    trend: Trend;
    maintainingFactors: MaintainingFactor[];
    protectiveFactors: ProtectiveFactor[];
  };
  progress?: {
    overallTrend: Trend;
    vsBaseline: {
      taskCompletion: { baseline: number; current: number };
      avoidanceRate: { baseline: number; current: number };
      averageMood: { baseline: number; current: number };
      cycleStrength: { baseline: number; current: number };
    };
    effectiveTechniques: Array<{
      technique: TCCTechnique;
      timesUsed: number;
      averageImpact: number;
      bestContext: string;
    }>;
    attentionNeeded: Array<{
      area: string;
      reason: string;
      suggestedAction: string;
    }>;
  };
  declaredVsDetected?: {
    comparisons: DeclaredVsDetectedComparison[];
  };
}

// -----------------------------------------------------------------------------
// VALIDATION DECISION
// -----------------------------------------------------------------------------

export type ValidationTrigger =
  | 'new_pattern_detected'
  | 'pattern_changing'
  | 'high_enrichment_unvalidated'
  | 'weekly_reflection'
  | 'post_significant_barrier';

export interface ValidationDecision {
  shouldPresent?: boolean;
  shouldAsk?: boolean;
  reason?: string;
  questionType?:
    | 'antecedent_disambiguation'
    | 'behavior_clarification'
    | 'consequence_confirmation'
    | 'confidence_check';
  question?: string;
  options?: ValidationOption[];
  expiresInHours?: number;
  trigger?: ValidationTrigger;
  sequence?: FunctionalSequence;
  priority?: 'low' | 'medium' | 'high';
  presentation?: {
    title: string;
    narrativeA: string;
    narrativeB: string;
    narrativeC: string;
  };
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

export function getTimeSlot(date: Date): TimeSlot {
  const hour = date.getHours();
  if (hour < 7) return 'early_morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function createEmptySequence(
  userId: string,
  sourceType: SequenceSourceType,
  sourceId?: number
): FunctionalSequence {
  const now = new Date();
  return {
    userId,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
    source: { type: sourceType, sourceId, enrichmentSources: [] },
    confidence: {
      level: 'inferred',
      score: 20,
      components: { antecedent: 20, behavior: 50, consequence: 10 },
    },
    antecedent: {
      situation: '',
      timeOfDay: getTimeSlot(now),
      dayOfWeek: now.getDay(),
      internalState: {},
      triggers: [],
      cognitivePatterns: [],
    },
    behavior: {
      description: '',
      type: 'other',
      valence: 'neutral',
      topography: {},
    },
    consequence: { immediate: { relief: false } },
    validation: { shownToUser: false },
  };
}

export function calculateGlobalConfidence(
  components: ConfidenceScore['components']
): number {
  if (!components) return 0;
  return Math.round(
    components.behavior * 0.4 +
    components.antecedent * 0.35 +
    components.consequence * 0.25
  );
}

export function determineConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 85) return 'explicit';
  if (score >= 65) return 'validated';
  if (score >= 45) return 'enriched';
  return 'inferred';
}

// -----------------------------------------------------------------------------
// Compatibilidad temporal del motor actual (migracion en progreso)
// -----------------------------------------------------------------------------

export type SequenceEventType =
  | 'task_started'
  | 'task_completed'
  | 'task_abandoned'
  | 'barrier_logged'
  | 'thought_recorded'
  | 'day_skipped'
  | 'manual_abc'
  | 'formulation_feedback';

export interface SequenceSourceRef {
  table: string;
  id: string | number;
  field?: string;
}

export interface SequenceEvent {
  id: string;
  userId: string;
  type: SequenceEventType;
  timestamp: Date;
  route?: 'overwhelmed' | 'hardtostart' | 'tengoalgodeenergia' | 'good';
  moodBefore?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  moodAfter?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  barrierType?: string;
  behaviorLabel?: string;
  antecedentHint?: string;
  consequenceHint?: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
  sourceRefs?: SequenceSourceRef[];
}

export interface BarrierLogEvent {
  id: string | number;
  userId: string;
  timestamp: Date;
  context: string;
  taskId?: string;
  taskCategory?: string;
  taskRoom?: string;
  taskName?: string;
  taskDifficulty?: string;
  emotionalState?: string;
  energyLevel?: number;
  reportedBarrier?: string;
}

export interface TaskCompletionEvent {
  id: string | number;
  userId: string;
  timestamp: Date;
  taskId: string;
  taskCategory?: string;
  taskRoom?: string;
  taskName?: string;
  taskDifficulty?: string;
  durationMinutes?: number;
  moodBefore?: number;
  moodAfter?: number;
  emotionalState?: string;
  energyLevel?: number;
  wasDownsized?: boolean;
}

export interface ThoughtRecordEvent {
  id: string | number;
  userId: string;
  timestamp: Date;
  situation: string;
  automaticThought: string;
  emotion?: string;
  emotionIntensityBefore?: number;
  emotionIntensityAfter?: number;
  cognitivePattern?: string;
  alternativeThought?: string;
  linkedTaskId?: string;
}

export interface DaySkippedEvent {
  userId: string;
  date: Date;
  lastCheckInState?: string;
  lastCheckInEnergy?: number;
  daysSinceLastActivity: number;
}

export interface ValidationOption {
  id: string;
  label: string;
  value: string;
}

export interface SequenceValidationPrompt {
  id: string;
  userId: string;
  sequenceId: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'pending' | 'answered' | 'skipped' | 'expired';
  priority: 'low' | 'medium' | 'high';
  questionType:
    | 'antecedent_disambiguation'
    | 'behavior_clarification'
    | 'consequence_confirmation'
    | 'confidence_check';
  question: string;
  options: ValidationOption[];
  selectedOptionId?: string;
  freeTextAnswer?: string;
  answeredAt?: Date;
  confidenceBefore: number;
  confidenceAfter?: number;
}

export interface FormulationTarget {
  id: string;
  focus: 'antecedent' | 'behavior' | 'consequence';
  description: string;
  suggestedTechniques: string[];
  supportingSequenceIds: string[];
}

export interface EnrichmentInput {
  recentBarrierTypes?: string[];
  routeHistory?: Array<'overwhelmed' | 'hardtostart' | 'tengoalgodeenergia' | 'good'>;
  hypothesisHints?: string[];
}

export interface EnrichmentTimeWindows {
  dailyCheckIn: { start: Date; end: Date };
  thoughtRecords: { start: Date; end: Date };
  subsequentActivity: { start: Date; end: Date };
}

export interface EnrichmentContext {
  dailyCheckIn?: {
    emotionalState?: string;
    energyLevel?: number;
  };
  nearbyThoughtRecords: Array<{
    id: number | string;
    cognitivePattern?: string;
    emotion?: string;
    timestamp?: Date;
  }>;
  subsequentActivities: Array<{
    id: string | number;
    completed?: boolean;
    moodImprovement?: number;
    timestamp?: Date;
  }>;
  historicalPattern?: {
    repeatedFactors: string[];
    suggestedValence?: 'problem' | 'target' | 'neutral';
  };
}
