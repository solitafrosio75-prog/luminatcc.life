// ============================================================================
// ValidationDecisionEngine.ts - Decide cuando presentar validacion
// ============================================================================
//
// Principios:
// - Maximo 2 validaciones por semana (no abrumar)
// - Nunca cuando el usuario esta en estado emocional muy bajo
// - Siempre con opcion "Ahora no" sin consecuencias
// - Si rechaza 3 consecutivas, reducir frecuencia
// - Priorizar patrones nuevos sobre patrones conocidos
// ============================================================================

import {
  FunctionalSequence,
  ValidationDecision,
  ConsolidatedChain,
  type ValidationTrigger,
  type EmotionalState,
  type SequenceValidationPrompt,
  type ValidationOption,
} from './sequenceTypes';

export interface UserValidationState {
  validationsThisWeek?: number;
  lastValidationDate?: Date;
  consecutiveRejections?: number;
  totalValidationsPresented?: number;
  totalValidationsAccepted?: number;
  currentEmotionalState?: EmotionalState;
  pendingCount?: number;
  answeredLast7Days?: number;
  dismissedLast7Days?: number;
  lastPresentedAt?: Date;
}

export interface ValidationPresentationDecision extends ValidationDecision {
  reason?: string;
  validation?: SequenceValidationPrompt;
}

export function shouldPresentValidation(
  userState: UserValidationState,
  recentSequences: FunctionalSequence[],
  existingChains: ConsolidatedChain[],
  contextTrigger?: 'weekly_reflection' | 'post_barrier'
): ValidationPresentationDecision {
  const normalized = normalizeUserState(userState);

  if (normalized.currentEmotionalState === 'overwhelmed') {
    return noValidation('Usuario está abrumado');
  }

  if (normalized.validationsThisWeek >= 2 && contextTrigger !== 'weekly_reflection') {
    return noValidation('Límite semanal alcanzado');
  }

  if (normalized.consecutiveRejections >= 3 && !contextTrigger) {
    return noValidation('Demasiados rechazos consecutivos');
  }

  if (normalized.lastValidationDate && !contextTrigger) {
    const daysSinceLastValidation = daysBetween(normalized.lastValidationDate, new Date());
    if (daysSinceLastValidation < 2) {
      return noValidation('Cooldown de 2 días activo');
    }
  }

  if (contextTrigger === 'weekly_reflection') {
    const candidate = selectBestCandidate(recentSequences, existingChains, 'weekly');
    if (candidate) {
      return asPresentationDecision(buildDecision(candidate, 'weekly_reflection', 'medium'), 'weekly_reflection_prompt');
    }
  }

  if (contextTrigger === 'post_barrier') {
    const recentBarriers = recentSequences.filter(
      (s) => s.source.type === 'barrier_log' && isRecent(s.timestamp, 30)
    );
    if (recentBarriers.length > 0 && normalized.currentEmotionalState !== 'low_energy') {
      const candidate = recentBarriers[recentBarriers.length - 1];
      if (candidate.confidence.score >= 35) {
        return asPresentationDecision(
          buildDecision(candidate, 'post_significant_barrier', 'low'),
          'post_barrier_prompt'
        );
      }
    }
  }

  const newPattern = detectNewPattern(recentSequences, existingChains);
  if (newPattern) {
    return asPresentationDecision(
      buildDecision(newPattern.bestCandidate, 'new_pattern_detected', 'high'),
      'new_pattern_prompt'
    );
  }

  const unvalidatedEnriched = recentSequences
    .filter(
      (s) =>
        s.confidence.level === 'enriched' &&
        s.confidence.score >= 55 &&
        !s.validation?.shownToUser
    )
    .sort((a, b) => b.confidence.score - a.confidence.score);
  if (unvalidatedEnriched.length > 0) {
    return asPresentationDecision(
      buildDecision(unvalidatedEnriched[0], 'high_enrichment_unvalidated', 'low'),
      'high_enrichment_prompt'
    );
  }

  const changingPattern = detectChangingPattern(recentSequences, existingChains);
  if (changingPattern) {
    return asPresentationDecision(
      buildDecision(changingPattern, 'pattern_changing', 'medium'),
      'pattern_change_prompt'
    );
  }

  return noValidation('No hay triggers activos');
}

function selectBestCandidate(
  sequences: FunctionalSequence[],
  _chains: ConsolidatedChain[],
  context: 'weekly' | 'general'
): FunctionalSequence | undefined {
  if (context === 'weekly') {
    const lastWeek = sequences.filter((s) => isRecent(s.timestamp, 7 * 24 * 60));
    return lastWeek
      .filter((s) => !s.validation?.shownToUser)
      .sort((a, b) => b.confidence.score - a.confidence.score)[0];
  }
  return sequences
    .filter((s) => !s.validation?.shownToUser && s.confidence.score >= 40)
    .sort((a, b) => b.confidence.score - a.confidence.score)[0];
}

interface NewPatternResult {
  bestCandidate: FunctionalSequence;
  similarCount: number;
}

function detectNewPattern(
  sequences: FunctionalSequence[],
  existingChains: ConsolidatedChain[]
): NewPatternResult | undefined {
  const recentSeqs = sequences.filter((s) => isRecent(s.timestamp, 7 * 24 * 60));
  const groups = new Map<string, FunctionalSequence[]>();
  for (const seq of recentSeqs) {
    const key = `${seq.behavior.type || 'other'}_${seq.antecedent.timeOfDay || 'unknown'}_${seq.behavior.context?.taskCategory || 'none'}`;
    const group = groups.get(key) || [];
    group.push(seq);
    groups.set(key, group);
  }

  for (const [, group] of groups) {
    if (group.length < 3) continue;
    const behaviorType = group[0].behavior.type;
    const alreadyKnown = existingChains.some(
      (chain) =>
        chain.typicalBehavior?.type === behaviorType &&
        chain.sequenceIds.some((id) => group.some((s) => s.id === id))
    );
    if (alreadyKnown) continue;

    const bestCandidate = [...group].sort((a, b) => b.confidence.score - a.confidence.score)[0];
    return { bestCandidate, similarCount: group.length };
  }

  return undefined;
}

function detectChangingPattern(
  sequences: FunctionalSequence[],
  chains: ConsolidatedChain[]
): FunctionalSequence | undefined {
  for (const chain of chains) {
    const chainSeqs = sequences
      .filter((s) => chain.sequenceIds.includes(s.id || -1))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (chainSeqs.length < 5) continue;
    const recent = chainSeqs.slice(0, 3);
    const older = chainSeqs.slice(3);
    const recentTargetRatio = recent.filter((s) => s.behavior.valence === 'target').length / recent.length;
    const olderTargetRatio = older.filter((s) => s.behavior.valence === 'target').length / older.length;

    if (Math.abs(recentTargetRatio - olderTargetRatio) > 0.4) {
      return recent.find((s) => !s.validation?.shownToUser) || recent[0];
    }
  }
  return undefined;
}

function buildDecision(
  sequence: FunctionalSequence,
  trigger: ValidationTrigger,
  priority: 'low' | 'medium' | 'high'
): ValidationDecision {
  return {
    shouldPresent: true,
    trigger,
    sequence,
    priority,
    presentation: buildPresentation(sequence, trigger),
  };
}

function buildPresentation(
  seq: FunctionalSequence,
  trigger: ValidationTrigger
): NonNullable<ValidationDecision['presentation']> {
  const titles: Record<ValidationTrigger, string> = {
    new_pattern_detected: 'He notado un patrón nuevo',
    pattern_changing: 'Algo parece estar cambiando',
    high_enrichment_unvalidated: '¿Te suena esto?',
    weekly_reflection: 'Tu patrón más frecuente esta semana',
    post_significant_barrier: '¿Quieres entender qué pasó?',
  };
  return {
    title: titles[trigger],
    narrativeA: buildNarrativeA(seq),
    narrativeB: buildNarrativeB(seq),
    narrativeC: buildNarrativeC(seq),
  };
}

function buildNarrativeA(seq: FunctionalSequence): string {
  const parts: string[] = [];
  const timeMap: Record<string, string> = {
    early_morning: 'de madrugada',
    morning: 'por las mañanas',
    afternoon: 'por las tardes',
    evening: 'por las noches',
    night: 'de noche',
  };
  if (seq.antecedent.timeOfDay) parts.push(timeMap[seq.antecedent.timeOfDay] || '');

  const stateMap: Record<string, string> = {
    good: 'sintiéndote bien',
    okay: 'en estado neutral',
    low_energy: 'cuando tu energía está baja',
    overwhelmed: 'cuando te sientes abrumado/a',
  };
  const emotionalState = seq.antecedent.internalState?.emotionalState;
  if (emotionalState) parts.push(stateMap[emotionalState] || '');

  const mainTrigger = seq.antecedent.triggers?.[0];
  if (mainTrigger) parts.push(mainTrigger.description.toLowerCase());
  return `${parts.filter(Boolean).join(', ')}...`;
}

function buildNarrativeB(seq: FunctionalSequence): string {
  const behaviorMap: Record<string, string> = {
    avoidance: 'tiendes a evitar la tarea',
    escape: 'abandonas la tarea que empezaste',
    procrastination: 'postergas la tarea para después',
    completion: 'logras completar la tarea',
    approach: 'enfrentas la tarea gradualmente',
    coping: 'usas una estrategia de afrontamiento',
    partial_completion: 'completas parte de la tarea',
  };

  let narrative = behaviorMap[seq.behavior.type || ''] || seq.behavior.description || 'actúas de cierta forma';
  if (seq.behavior.context?.taskCategory) {
    narrative += ` (especialmente tareas de ${seq.behavior.context.taskCategory})`;
  }
  return `...${narrative}`;
}

function buildNarrativeC(seq: FunctionalSequence): string {
  const parts: string[] = [];
  const immediate = getImmediateObject(seq);
  if (immediate?.relief) parts.push('sientes alivio momentáneo');
  if (immediate?.emotionalChange) {
    const { from, to } = immediate.emotionalChange;
    if (from && to) {
      if (to > from) parts.push('tu ánimo mejora');
      else if (to < from) parts.push('tu ánimo baja');
    }
  }
  if (seq.consequence.shortTerm?.cascadeEffect) parts.push('pero después tiendes a evitar más cosas');
  if (seq.consequence.reinforcement?.type === 'negative_reinforcement') parts.push('lo cual refuerza el patrón');
  if (parts.length === 0) return '...y las consecuencias aún no están claras';
  return `...${parts.join(', pero ')}`;
}

function noValidation(reason: string): ValidationPresentationDecision {
  return {
    shouldPresent: false,
    priority: 'low',
    reason,
    presentation: { title: '', narrativeA: '', narrativeB: '', narrativeC: '' },
  };
}

function isRecent(date: Date, minutesAgo: number): boolean {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  return diffMs <= minutesAgo * 60 * 1000;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (24 * 60 * 60 * 1000);
}

export function processValidationResult(
  sequence: FunctionalSequence,
  result: 'accepted' | 'adjusted' | 'rejected',
  adjustments?: {
    antecedentChanged?: boolean;
    behaviorChanged?: boolean;
    consequenceChanged?: boolean;
    notes?: string;
  }
): FunctionalSequence {
  const updated = structuredClone(sequence);
  const now = new Date();

  if (!updated.validation) updated.validation = { shownToUser: false };
  updated.validation.shownToUser = true;
  updated.validation.shownAt = now;
  updated.updatedAt = now;

  const components = ensureConfidenceComponents(updated);
  if (result === 'accepted') {
    updated.validation.userValidated = true;
    updated.validation.validatedAt = now;
    components.antecedent = Math.min(100, components.antecedent + 20);
    components.behavior = Math.min(100, components.behavior + 10);
    components.consequence = Math.min(100, components.consequence + 20);
    updated.confidence.score = calculateConfidence(components);
    updated.confidence.level = 'validated';
  } else if (result === 'adjusted' && adjustments) {
    updated.validation.userValidated = true;
    updated.validation.validatedAt = now;
    updated.validation.userAdjustments = {
      antecedentChanged: adjustments.antecedentChanged || false,
      behaviorChanged: adjustments.behaviorChanged || false,
      consequenceChanged: adjustments.consequenceChanged || false,
      notes: adjustments.notes,
    };
    components.antecedent = Math.min(
      100,
      components.antecedent + (adjustments.antecedentChanged ? 10 : 20)
    );
    components.consequence = Math.min(
      100,
      components.consequence + (adjustments.consequenceChanged ? 10 : 20)
    );
    updated.confidence.score = calculateConfidence(components);
    updated.confidence.level = 'validated';
  } else if (result === 'rejected') {
    updated.validation.userValidated = false;
  }

  return updated;
}

function normalizeUserState(userState: UserValidationState) {
  const validationsThisWeek =
    userState.validationsThisWeek ??
    (userState.answeredLast7Days || 0) + (userState.dismissedLast7Days || 0);

  const consecutiveRejections = userState.consecutiveRejections ?? Math.min(3, userState.dismissedLast7Days || 0);
  const lastValidationDate = userState.lastValidationDate ?? userState.lastPresentedAt;

  return {
    validationsThisWeek,
    lastValidationDate,
    consecutiveRejections,
    currentEmotionalState: userState.currentEmotionalState,
  };
}

function asPresentationDecision(
  decision: ValidationDecision,
  reason: string
): ValidationPresentationDecision {
  return {
    ...decision,
    reason,
    validation: decision.shouldPresent && decision.sequence
      ? toValidationPrompt(decision.sequence, decision)
      : undefined,
  };
}

function toValidationPrompt(
  sequence: FunctionalSequence,
  decision: ValidationDecision
): SequenceValidationPrompt {
  const options: ValidationOption[] = [
    { id: 'yes', label: 'Si, correcto', value: 'yes' },
    { id: 'partial', label: 'Parcialmente', value: 'partial' },
    { id: 'no', label: 'No', value: 'no' },
    { id: 'later', label: 'Ahora no', value: 'later' },
  ];

  const question = decision.presentation?.title
    ? `${decision.presentation.title}\n${decision.presentation.narrativeA} ${decision.presentation.narrativeB} ${decision.presentation.narrativeC}`
    : '¿Esto representa bien lo que ocurrió?';

  return {
    id: `validation_${sequence.id || Date.now()}`,
    userId: sequence.userId,
    sequenceId: String(sequence.id || ''),
    createdAt: new Date(),
    status: 'pending',
    priority: decision.priority || 'medium',
    questionType: 'confidence_check',
    question,
    options,
    confidenceBefore: normalizeConfidenceToPromptScale(sequence.confidence.score),
  };
}

function normalizeConfidenceToPromptScale(score: number): number {
  if (score <= 1) return score;
  return Math.max(0, Math.min(1, score / 100));
}

function getImmediateObject(
  seq: FunctionalSequence
): { relief?: boolean; emotionalChange?: { from?: number; to?: number; relief: boolean } } | undefined {
  if (!seq.consequence.immediate || typeof seq.consequence.immediate === 'string') return undefined;
  return seq.consequence.immediate;
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

function calculateConfidence(components: { antecedent: number; behavior: number; consequence: number }): number {
  return Math.round(
    components.behavior * 0.4 + components.antecedent * 0.35 + components.consequence * 0.25
  );
}
