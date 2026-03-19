import type {
  FunctionalSequence,
  IntegratedCaseFormulation,
} from './sequenceTypes';
import type { KeyBehavior } from './KeyBehaviorIdentifier';
import type { InterventionPlan } from './interventionPlanTypes';
import { identifyKeyBehaviors } from './KeyBehaviorIdentifier';

export type UserMoodSelection = 'overwhelmed' | 'hardtostart' | 'tengoalgodeenergia' | 'good';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type FRETimeSlot =
  | 'early_morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late_night';

export type EffortLevel = 'very_low' | 'low' | 'medium' | 'high' | 'micro';

export interface RecommendationRequest {
  userId: string;
  emotionalState: UserMoodSelection;
  energyLevel: EnergyLevel;
  currentFRETimeSlot: FRETimeSlot;
  formulation?: IntegratedCaseFormulation;
  recentSequences?: FunctionalSequence[];
  availableTasks: AvailableTask[];
  confirmedKeyBehaviors?: KeyBehavior[];
  /** C5 FIXED: Plan activo para alinear recomendaciones con objetivos intermedios */
  activePlan?: InterventionPlan;
}

export interface AvailableTask {
  id: string;
  title: string;
  category: string;
  room?: string;
  estimatedMinutes: number;
  effortLevel: EffortLevel;
  isMicroTask: boolean;
  requiresDecisions: boolean;
  tags?: string[];
}

export type ClinicalMode = 'protection' | 'activation' | 'intervention' | 'construction';

export interface Recommendation {
  task: AvailableTask;
  score: number;
  hasFunctionalBasis: boolean;
  functionalRationale?: string;
  targetKeyBehavior?: KeyBehavior;
  therapeuticPrinciple: string;
  adaptedDifficulty: 'very_low' | 'low' | 'medium' | 'high';
}

export interface RecommendationResult {
  mode: ClinicalMode;
  dataLevel: 'full' | 'partial' | 'cold';
  recommendations: Recommendation[];
  keyBehaviors: KeyBehavior[];
  modeExplanation: string;
  showFunctionalContext: boolean;
}

export function generateRecommendations(
  request: RecommendationRequest,
  maxResults = 5
): RecommendationResult {
  const mode = determineClinicalMode(request.emotionalState, request.energyLevel);
  const dataLevel = assessDataLevel(request.formulation, request.confirmedKeyBehaviors);

  const keyBehaviors =
    dataLevel !== 'cold' && request.formulation
      ? identifyKeyBehaviors(request.formulation, request.recentSequences || [])
      : [];

  const allKeyBehaviors = mergeKeyBehaviors(keyBehaviors, request.confirmedKeyBehaviors || []);
  const scoredTasks = scoreAllTasks(
    request.availableTasks,
    mode,
    dataLevel,
    allKeyBehaviors,
    request
  );

  scoredTasks.sort((a, b) => b.score - a.score);
  const recommendations = scoredTasks.slice(0, maxResults);
  const showFunctionalContext = shouldShowFunctionalContext(mode, dataLevel, recommendations);

  return {
    mode,
    dataLevel,
    recommendations,
    keyBehaviors: allKeyBehaviors,
    modeExplanation: getModeExplanation(mode),
    showFunctionalContext,
  };
}

function determineClinicalMode(emotionalState: UserMoodSelection, energyLevel: EnergyLevel): ClinicalMode {
  if (emotionalState === 'overwhelmed') return 'protection';
  if (energyLevel <= 1) return 'protection';

  if (emotionalState === 'hardtostart') {
    return energyLevel <= 2 ? 'protection' : 'activation';
  }
  if (emotionalState === 'tengoalgodeenergia') {
    return energyLevel >= 4 ? 'construction' : 'intervention';
  }
  if (emotionalState === 'good') {
    return energyLevel >= 3 ? 'construction' : 'intervention';
  }
  return 'intervention';
}

function assessDataLevel(
  formulation?: IntegratedCaseFormulation,
  confirmedKeyBehaviors?: KeyBehavior[]
): 'full' | 'partial' | 'cold' {
  if ((confirmedKeyBehaviors || []).length > 0) return 'full';
  if (!formulation) return 'cold';

  const chains = formulation.functionalRelationships.consolidatedChains || [];
  if (!chains.length) return 'cold';

  const strongChains = chains.filter((c) => (c.averageConfidence || 0) >= 60);
  if (strongChains.length >= 2) return 'full';
  return 'partial';
}

function scoreAllTasks(
  tasks: AvailableTask[],
  mode: ClinicalMode,
  dataLevel: 'full' | 'partial' | 'cold',
  keyBehaviors: KeyBehavior[],
  request: RecommendationRequest
): Recommendation[] {
  return tasks.map((task) => scoreTask(task, mode, dataLevel, keyBehaviors, request));
}

function scoreTask(
  task: AvailableTask,
  mode: ClinicalMode,
  dataLevel: 'full' | 'partial' | 'cold',
  keyBehaviors: KeyBehavior[],
  request: RecommendationRequest
): Recommendation {
  let score = 0;
  let hasFunctionalBasis = false;
  let functionalRationale: string | undefined;
  let targetKeyBehavior: KeyBehavior | undefined;
  let therapeuticPrinciple = '';

  const modeScore = scoreByClinicalMode(task, mode);
  score += modeScore.score;
  therapeuticPrinciple = modeScore.principle;

  if (dataLevel !== 'cold' && keyBehaviors.length > 0) {
    const functionalScore = scoreByFunctionalAnalysis(task, keyBehaviors, mode);
    if (functionalScore.score > 0) {
      score += functionalScore.score;
      hasFunctionalBasis = true;
      functionalRationale = functionalScore.rationale;
      targetKeyBehavior = functionalScore.matchedKeyBehavior;
      if (functionalScore.score > modeScore.score * 0.5) {
        therapeuticPrinciple = functionalScore.principle;
      }
    }
  }

  score += scoreByContext(task, request);

  // C5 FIXED: Si hay plan activo, bonus score por alineación con objetivos intermedios
  if (request.activePlan) {
    const planAlignmentBonus = scoreByPlanAlignment(task, request.activePlan);
    score += planAlignmentBonus;

    if (planAlignmentBonus > 0) {
      functionalRationale = (functionalRationale || '') + 
        ' [Alineada con objetivos activos del plan]';
    }
  }

  const adaptedDifficulty = adaptDifficulty(task.effortLevel, mode);

  return {
    task,
    score: clamp(score, 0, 100),
    hasFunctionalBasis,
    functionalRationale,
    targetKeyBehavior,
    therapeuticPrinciple,
    adaptedDifficulty,
  };
}

/**
 * C5 FIXED: Calcula bonus score si la tarea está alineada con
 * objetivos intermedios activos del plan. Esto asegura que las
 * recomendaciones diarias guideen hacia los objetivos acordados.
 */
function scoreByPlanAlignment(task: AvailableTask, plan: InterventionPlan): number {
  let bonus = 0;

  for (const finalObj of plan.finalObjectives) {
    // Solo considerar objetivos que están activos o en progreso
    if (finalObj.status !== 'active') continue;

    for (const intermediateObj of finalObj.intermediateObjectives) {
      // Solo intermedios activos
      if (intermediateObj.status !== 'active') continue;

      // Extraer technique del intermedio para comparar con task
      if (intermediateObj.technique?.technique) {
        const techniqueName = intermediateObj.technique.technique.toLowerCase();
        const taskTitle = task.title.toLowerCase();
        const taskCategory = (task.category || '').toLowerCase();

        // Coincidencia directa o parcial en nombre/categoría
        if (
          taskTitle.includes(techniqueName) ||
          techniqueName.includes(taskTitle) ||
          taskCategory.includes(techniqueName) ||
          techniqueName.includes(taskCategory)
        ) {
          bonus += 15; // Bonus significativo por alineación
        }
      }

      // También matchear por scope de métrica (room, taskCategory)
      if (intermediateObj.successCriterion.scope) {
        const scope = intermediateObj.successCriterion.scope;
        const taskMatches =
          (scope.room && task.room === scope.room) ||
          (scope.taskCategory && task.category === scope.taskCategory);

        if (taskMatches) {
          bonus += 10; // Bonus por matching de scope
        }
      }
    }
  }

  return clamp(bonus, 0, 30); // Máximo 30 puntos de bonus
}

function scoreByClinicalMode(
  task: AvailableTask,
  mode: ClinicalMode
): { score: number; principle: string } {
  const effort = normalizeEffort(task.effortLevel);
  switch (mode) {
    case 'protection': {
      let score = 0;
      if (task.isMicroTask || effort === 'very_low') score += 30;
      if (effort === 'very_low') score += 25;
      else if (effort === 'low') score += 10;
      else score -= 20;
      if (!task.requiresDecisions) score += 15;
      if (task.estimatedMinutes <= 5) score += 10;
      else if (task.estimatedMinutes > 15) score -= 15;
      return {
        score,
        principle: 'Proteccion: un paso minimo es suficiente.',
      };
    }
    case 'activation': {
      let score = 0;
      if (effort === 'low') score += 25;
      else if (effort === 'very_low') score += 20;
      else if (effort === 'medium') score += 5;
      else score -= 15;
      if (task.isMicroTask) score += 15;
      if (!task.requiresDecisions) score += 10;
      if (task.estimatedMinutes <= 10) score += 10;
      return {
        score,
        principle: 'Activacion conductual: la energia sigue a la accion.',
      };
    }
    case 'intervention': {
      let score = 0;
      if (effort === 'medium') score += 20;
      else if (effort === 'low') score += 15;
      else if (effort === 'high') score += 5;
      else score += 10;
      if (task.estimatedMinutes >= 10 && task.estimatedMinutes <= 30) score += 10;
      return {
        score,
        principle: 'Intervencion funcional: enfocar alto impacto.',
      };
    }
    case 'construction': {
      let score = 0;
      if (effort === 'medium') score += 20;
      else if (effort === 'high') score += 15;
      else if (effort === 'low') score += 10;
      if (task.estimatedMinutes >= 15) score += 10;
      return {
        score,
        principle: 'Construccion: consolidar cambios con energia disponible.',
      };
    }
  }
}

function scoreByFunctionalAnalysis(
  task: AvailableTask,
  keyBehaviors: KeyBehavior[],
  mode: ClinicalMode
): {
  score: number;
  rationale: string;
  principle: string;
  matchedKeyBehavior?: KeyBehavior;
} {
  let bestMatch: { score: number; rationale: string; keyBehavior: KeyBehavior } | null = null;

  for (const kb of keyBehaviors) {
    const matchScore = calculateTaskKeyBehaviorMatch(task, kb, mode);
    if (matchScore.score > 0 && (!bestMatch || matchScore.score > bestMatch.score)) {
      bestMatch = { score: matchScore.score, rationale: matchScore.rationale, keyBehavior: kb };
    }
  }

  if (!bestMatch) return { score: 0, rationale: '', principle: '' };

  const validationMultiplier =
    bestMatch.keyBehavior.validation.status === 'confirmed'
      ? 1
      : bestMatch.keyBehavior.validation.status === 'proposed'
        ? 0.6
        : 0.3;

  const modeMultiplier =
    mode === 'protection' ? 0.2 : mode === 'activation' ? 0.6 : mode === 'intervention' ? 1 : 0.8;

  const finalScore = bestMatch.score * validationMultiplier * modeMultiplier;

  return {
    score: finalScore,
    rationale: bestMatch.rationale,
    principle: `Conducta clave: ${bestMatch.keyBehavior.name}`,
    matchedKeyBehavior: bestMatch.keyBehavior,
  };
}

function calculateTaskKeyBehaviorMatch(
  task: AvailableTask,
  kb: KeyBehavior,
  mode: ClinicalMode
): { score: number; rationale: string } {
  let score = 0;
  const reasons: string[] = [];

  if (kb.context.typicalCategories.includes(task.category)) {
    score += 20;
    reasons.push('misma categoria que el patron');
  }
  if (task.room && kb.context.typicalRooms.includes(task.room)) {
    score += 10;
    reasons.push('mismo espacio');
  }

  const directTarget = kb.targetableWith.find(
    (t) => t.taskCategory === task.category && (!t.room || t.room === task.room)
  );
  if (directTarget) {
    score += 25;
    reasons.push(directTarget.interventionRationale);
    if (normalizeEffort(task.effortLevel) === directTarget.recommendedDifficulty) {
      score += 10;
    }
  }

  score += kb.priorityScore * 0.15;
  const effort = normalizeEffort(task.effortLevel);
  if (mode === 'protection' && effort !== 'very_low' && effort !== 'low') score *= 0.3;
  if (mode === 'activation' && effort === 'high') score *= 0.2;

  const rationale = reasons.length
    ? `Esta tarea trabaja un patron identificado: ${reasons[0]}`
    : '';
  return { score, rationale };
}

function scoreByContext(task: AvailableTask, request: RecommendationRequest): number {
  let score = 0;
  const timeAffinity = getTimeAffinity(task.category, request.currentFRETimeSlot);
  score += timeAffinity * 5;
  score += getEnergyMatch(normalizeEffort(task.effortLevel), request.energyLevel) * 3;
  return score;
}

function shouldShowFunctionalContext(
  mode: ClinicalMode,
  dataLevel: 'full' | 'partial' | 'cold',
  recommendations: Recommendation[]
): boolean {
  if (mode === 'protection') return false;
  if (dataLevel === 'cold') return false;
  const hasAnyFunctional = recommendations.some((r) => r.hasFunctionalBasis);
  if (!hasAnyFunctional) return false;
  if (dataLevel === 'partial') {
    return recommendations.some(
      (r) => r.hasFunctionalBasis && (r.targetKeyBehavior?.priorityScore || 0) >= 50
    );
  }
  return true;
}

function mergeKeyBehaviors(identified: KeyBehavior[], confirmed: KeyBehavior[]): KeyBehavior[] {
  const merged = [...confirmed];
  for (const kb of identified) {
    const alreadyConfirmed = confirmed.some((c) => c.sourceChainId === kb.sourceChainId);
    if (!alreadyConfirmed) merged.push(kb);
  }
  return merged;
}

function adaptDifficulty(
  original: EffortLevel,
  mode: ClinicalMode
): 'very_low' | 'low' | 'medium' | 'high' {
  const levels: Array<'very_low' | 'low' | 'medium' | 'high'> = ['very_low', 'low', 'medium', 'high'];
  const normalized = normalizeEffort(original);
  const idx = levels.indexOf(normalized);

  switch (mode) {
    case 'protection':
      return levels[Math.max(0, idx - 2)];
    case 'activation':
      return levels[Math.max(0, idx - 1)];
    case 'intervention':
      return normalized;
    case 'construction':
      return levels[Math.min(levels.length - 1, idx + 1)];
  }
}

function getModeExplanation(mode: ClinicalMode): string {
  switch (mode) {
    case 'protection':
      return 'Modo proteccion: hoy priorizamos lo mas pequeno y facil.';
    case 'activation':
      return 'Un paso pequeno puede destrabar la inercia.';
    case 'intervention':
      return 'Hay energia para trabajar en tareas de impacto.';
    case 'construction':
      return 'Buen momento para consolidar y prevenir recaidas.';
  }
}

function getTimeAffinity(category: string, timeSlot: FRETimeSlot): number {
  const affinities: Record<string, Partial<Record<FRETimeSlot, number>>> = {
    cleaning: { morning: 2, midday: 1, afternoon: 0, evening: -1, night: -2 },
    organizing: { morning: 1, midday: 1, afternoon: 2, evening: 0, night: -1 },
    shopping: { morning: 2, midday: 1, afternoon: 1, evening: -1, night: -2 },
    maintenance: { morning: 1, midday: 2, afternoon: 1, evening: -1, night: -2 },
  };
  return affinities[category]?.[timeSlot] ?? 0;
}

function getEnergyMatch(
  effort: 'very_low' | 'low' | 'medium' | 'high',
  energy: EnergyLevel
): number {
  const effortMap: Record<string, number> = { very_low: 1, low: 2, medium: 3, high: 4 };
  const effortLevel = effortMap[effort];
  const diff = Math.abs(energy - effortLevel);
  if (diff === 0) return 3;
  if (diff === 1) return 1;
  if (diff === 2) return -1;
  return -3;
}

function normalizeEffort(effort: EffortLevel): 'very_low' | 'low' | 'medium' | 'high' {
  if (effort === 'micro' || effort === 'very_low') return 'very_low';
  return effort;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getColdStartExplanation(): string {
  return (
    'Estamos aprendiendo tus patrones. Por ahora, las recomendaciones se basan en tu estado actual. ' +
    'Con el tiempo, seran mas personalizadas.'
  );
}
