// ═══════════════════════════════════════════════════════════════════
// InterventionPlanEvaluator.ts — Evaluador de Progreso del Plan
// ═══════════════════════════════════════════════════════════════════
//
// Fase 6 del proceso: "Evaluación del cambio"
//
// "La evaluación de los avances terapéuticos es conveniente hacerla
//  sesión a sesión, de forma paralela al tratamiento; de esta forma
//  se comprobará si se van cumpliendo los objetivos programados.
//  Si no fuese así, será necesario volver sobre los pasos anteriores
//  y modificar la técnica empleada, la secuencia de intervención,
//  las metas terapéuticas o las hipótesis."
//  — Ruiz, Díaz & Villalobos, p. 135
//
// Funcionalidad:
// 1. Medir valores actuales de cada métrica desde los datos reales
// 2. Comparar contra criterios de éxito
// 3. Emitir veredicto (achieved/progressing/stalled/regressing)
// 4. Tomar decisión (advance/extend/adjust/change_technique)
// 5. Generar resumen legible para weekly_reflection
// ═══════════════════════════════════════════════════════════════════

import type { FunctionalSequence } from './sequenceTypes';

import type {
  InterventionPlan,
  FinalObjective,
  IntermediateObjective,
  MeasurableCriterion,
  ProgressSnapshot,
  ObjectiveEvaluation,
  EvaluationVerdict,
  EvaluationDecision,
  PlanProgress,
  MetricType,
  MetricUnit,
} from './interventionPlanTypes';

import { computeMetric, filterByScope } from './MetricEngine';

// ─────────────────────────────────────────────
// Tipos de entrada
// ─────────────────────────────────────────────

export interface EvaluationInput {
  plan: InterventionPlan;
  recentSequences: FunctionalSequence[];
  /** Período a evaluar (default: última semana) */
  evaluationPeriodDays?: number;
  /** ¿El usuario participa en esta evaluación? (weekly reflection) */
  userParticipating?: boolean;
}

// ─────────────────────────────────────────────
// Tipos de salida
// ─────────────────────────────────────────────

export interface EvaluationResult {
  /** Plan actualizado con las evaluaciones */
  updatedPlan: InterventionPlan;

  /** Resúmenes por objetivo (para mostrar en UI) */
  objectiveSummaries: ObjectiveSummary[];

  /** Resumen global del plan */
  planSummary: PlanSummary;

  /** ¿Hay cambios que requieren atención del usuario? */
  requiresUserAttention: boolean;

  /** Decisiones automáticas tomadas */
  autoDecisions: AutoDecision[];
}

export interface ObjectiveSummary {
  objectiveId: string;
  parentFinalId: string;
  description: string;
  isIntermediate: boolean;

  /** Valor anterior → valor actual */
  previousValue: number;
  currentValue: number;

  /** Target */
  targetValue: number;

  /** Progreso visual (0-100%) */
  progressPercentage: number;

  /** Veredicto legible */
  verdict: EvaluationVerdict;
  verdictMessage: string;

  /** Decisión tomada/propuesta */
  decision: EvaluationDecision;
  decisionMessage: string;

  /** ¿Celebrar? */
  celebrate: boolean;
}

export interface PlanSummary {
  overallProgress: PlanProgress;
  weekNumber: number;
  highlights: string[];
  concerns: string[];
  nextSteps: string[];
}

export interface AutoDecision {
  objectiveId: string;
  decision: EvaluationDecision;
  reason: string;
  requiresConfirmation: boolean;
}

// ═══════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════

/**
 * Evalúa el progreso de todo el plan contra los datos reales.
 *
 * Se invoca típicamente durante la weekly_reflection.
 */
export function evaluatePlan(input: EvaluationInput): EvaluationResult {
  const { plan, recentSequences, evaluationPeriodDays = 7, userParticipating = false } = input;

  const updatedPlan = deepClonePlan(plan);
  const summaries: ObjectiveSummary[] = [];
  const autoDecisions: AutoDecision[] = [];

  // Evaluar cada objetivo final
  for (const finalObj of updatedPlan.finalObjectives) {
    if (finalObj.status !== 'active' && finalObj.status !== 'accepted') continue;

    // Evaluar cada objetivo intermedio activo
    for (const intermediate of finalObj.intermediateObjectives) {
      if (!isEvaluable(intermediate)) continue;

      const result = evaluateObjective(
        intermediate,
        recentSequences,
        evaluationPeriodDays,
        userParticipating
      );

      // Actualizar el intermedio
      intermediate.currentProgress = result.progress;
      intermediate.evaluations.push(result.evaluation);

      // Aplicar decisión
      const decision = determineDecision(intermediate, result, finalObj);
      applyDecision(intermediate, decision, finalObj, updatedPlan);

      summaries.push(buildSummary(intermediate, finalObj.id, result, decision));

      if (decision.decision !== 'continue') {
        autoDecisions.push({
          objectiveId: intermediate.id,
          decision: decision.decision,
          reason: decision.reason,
          requiresConfirmation: decision.requiresConfirmation,
        });
      }
    }

    // Evaluar si el objetivo final se cumplió
    evaluateFinalObjective(finalObj, recentSequences, evaluationPeriodDays);
  }

  // Actualizar progreso global
  updatedPlan.overallProgress = calculatePlanProgress(updatedPlan);
  updatedPlan.lastEvaluatedAt = new Date();
  updatedPlan.updatedAt = new Date();

  // Verificar si el plan completo está logrado
  if (updatedPlan.overallProgress.finalsAchieved === updatedPlan.overallProgress.finalsTotal &&
      updatedPlan.overallProgress.finalsTotal > 0) {
    updatedPlan.status = 'completed';
    updatedPlan.completedAt = new Date();
  }

  const planSummary = buildPlanSummary(updatedPlan, summaries);

  return {
    updatedPlan,
    objectiveSummaries: summaries,
    planSummary,
    requiresUserAttention: autoDecisions.some(d => d.requiresConfirmation),
    autoDecisions,
  };
}

// ═══════════════════════════════════════════════
// EVALUACIÓN POR OBJETIVO
// ═══════════════════════════════════════════════

interface ObjectiveResult {
  progress: ProgressSnapshot;
  evaluation: ObjectiveEvaluation;
}

function evaluateObjective(
  objective: IntermediateObjective,
  sequences: FunctionalSequence[],
  periodDays: number,
  userParticipating: boolean
): ObjectiveResult {
  const criterion = objective.successCriterion;
  const previousValue = objective.currentProgress.currentValue;

  // Medir valor actual
  const currentValue = measureMetric(criterion, sequences, periodDays);

  // Calcular progreso
  const progress = calculateProgress(criterion, currentValue, previousValue);

  // Determinar veredicto
  const criterionMet = isCriterionMet(criterion, currentValue);
  const verdict = determineVerdict(criterion, currentValue, previousValue, criterionMet);

  const evaluation: ObjectiveEvaluation = {
    evaluatedAt: new Date(),
    measuredValue: currentValue,
    criterionMet,
    verdict,
    decision: 'continue', // Se actualiza después por determineDecision
    userParticipated: userParticipating,
  };

  return { progress, evaluation };
}

// ═══════════════════════════════════════════════
// MEDICIÓN DE MÉTRICAS
// ═══════════════════════════════════════════════

function measureMetric(
  criterion: MeasurableCriterion,
  sequences: FunctionalSequence[],
  periodDays: number
): number {
  // Usar MetricEngine unificado con granularidad semanal
  const scoped = filterByScope(sequences, criterion.scope);

  if (scoped.length === 0) {
    // Sin datos → NaN para marcar insufficient_data
    return NaN;
  }

  // computeMetric con granularidad semanal normaliza automáticamente
  // (suma para frecuencias, promedia para porcentajes)
  const value = computeMetric(criterion.metric, scoped, {
    granularity: 'weekly',
    periodDays,
  });

  return isNaN(value) ? NaN : value;
}

// filterByScope ahora viene de MetricEngine.ts — elimina 4 copias del código
// Este archivo ya no debe implementarla localmente

// ═══════════════════════════════════════════════
// CÁLCULO DE PROGRESO
// ═══════════════════════════════════════════════

function calculateProgress(
  criterion: MeasurableCriterion,
  currentValue: number,
  previousValue: number
): ProgressSnapshot {
  if (isNaN(currentValue) || isNaN(previousValue)) {
    return {
      currentValue,
      progressPercentage: 0,
      trend: 'insufficient_data',
      measuredAt: new Date(),
      rateOfChange: 0,
      projectedCompletionDate: undefined,
    };
  }

  const totalDistance = Math.abs(criterion.target - criterion.baseline);
  const currentDistance = Math.abs(currentValue - criterion.baseline);

  let progressPercentage = totalDistance > 0
    ? (currentDistance / totalDistance) * 100
    : 0;

  // Si la dirección es correcta, el progreso es positivo
  const goingRightDirection = criterion.direction === 'decrease'
    ? currentValue < criterion.baseline
    : currentValue > criterion.baseline;

  if (!goingRightDirection) progressPercentage = 0;

  // Cap at 100
  progressPercentage = Math.min(100, Math.max(0, progressPercentage));

  // Tendencia
  const diff = currentValue - previousValue;
  const significantChange = Math.abs(diff) >= (totalDistance * 0.05); // 5% del rango
  let trend: ProgressSnapshot['trend'] = 'insufficient_data';

  if (significantChange) {
    const improving = criterion.direction === 'decrease' ? diff < 0 : diff > 0;
    trend = improving ? 'improving' : 'worsening';
  } else {
    trend = 'stable';
  }

  // Rate of change (unidades por semana)
  const rateOfChange = diff; // Simplificado: evaluación semanal

  // Proyección
  let projectedCompletionDate: Date | undefined;
  if (trend === 'improving' && rateOfChange !== 0) {
    const remaining = criterion.direction === 'decrease'
      ? currentValue - criterion.target
      : criterion.target - currentValue;
    const weeksRemaining = Math.abs(remaining / rateOfChange);
    if (weeksRemaining > 0 && weeksRemaining < 52) {
      projectedCompletionDate = new Date();
      projectedCompletionDate.setDate(
        projectedCompletionDate.getDate() + Math.round(weeksRemaining * 7)
      );
    }
  }

  return {
    currentValue: Math.round(currentValue * 10) / 10,
    progressPercentage: Math.round(progressPercentage),
    trend,
    measuredAt: new Date(),
    rateOfChange: Math.round(rateOfChange * 10) / 10,
    projectedCompletionDate,
  };
}

function isCriterionMet(criterion: MeasurableCriterion, value: number): boolean {
  if (criterion.direction === 'decrease') {
    return value <= criterion.target;
  } else {
    return value >= criterion.target;
  }
}

// ═══════════════════════════════════════════════
// VEREDICTOS Y DECISIONES
// ═══════════════════════════════════════════════

function determineVerdict(
  criterion: MeasurableCriterion,
  currentValue: number,
  previousValue: number,
  criterionMet: boolean
): EvaluationVerdict {
  if (isNaN(currentValue) || isNaN(previousValue)) return 'insufficient_data';
  if (criterionMet) return 'achieved';

  const diff = currentValue - previousValue;
  const significantChange = Math.abs(diff) >= criterion.clinicalSignificanceThreshold * 0.3;

  if (!significantChange) return 'stalled';

  const improving = criterion.direction === 'decrease' ? diff < 0 : diff > 0;
  return improving ? 'progressing' : 'regressing';
}

interface DecisionResult {
  decision: EvaluationDecision;
  reason: string;
  requiresConfirmation: boolean;
}

function determineDecision(
  objective: IntermediateObjective,
  result: ObjectiveResult,
  finalObj: FinalObjective
): DecisionResult {
  const verdict = result.evaluation.verdict;
  const evaluationCount = objective.evaluations.length + 1; // +1 for current

  // ─── ACHIEVED ───
  if (verdict === 'achieved') {
    // ¿Hay siguiente intermedio?
    const nextIntermediate = finalObj.intermediateObjectives.find(io =>
      io.order === objective.order + 1 && io.status === 'proposed'
    );

    if (nextIntermediate) {
      return {
        decision: 'advance_next_intermediate',
        reason: `¡Objetivo cumplido! Avanzando al siguiente paso.`,
        requiresConfirmation: false,
      };
    } else {
      return {
        decision: 'advance_achieved',
        reason: `¡Todos los objetivos intermedios cumplidos!`,
        requiresConfirmation: false,
      };
    }
  }

  // ─── PROGRESSING ───
  if (verdict === 'progressing') {
    return {
      decision: 'continue',
      reason: 'Hay progreso. Seguir con el plan actual.',
      requiresConfirmation: false,
    };
  }

  // ─── STALLED ───
  if (verdict === 'stalled') {
    if (evaluationCount >= 3) {
      // 3 evaluaciones sin progreso → sugerir cambio
      return {
        decision: 'change_technique',
        reason: `Sin progreso en ${evaluationCount} evaluaciones. Podría ayudar cambiar de estrategia.`,
        requiresConfirmation: true,
      };
    } else if (evaluationCount >= 2) {
      // 2 sin progreso → preguntar antes de extender
      return {
        decision: 'extend_timeframe',
        reason: 'Llevamos dos semanas sin avance. ¿Quieres darnos más tiempo o prefieres ajustar la estrategia?',
        requiresConfirmation: true,
      };
    } else {
      return {
        decision: 'continue',
        reason: 'Primera evaluación sin cambio — es normal al inicio.',
        requiresConfirmation: false,
      };
    }
  }

  // ─── REGRESSING ───
  if (verdict === 'regressing') {
    if (evaluationCount >= 2) {
      // Empeorando más de una vez → ajustar target
      return {
        decision: 'adjust_target_easier',
        reason: 'El objetivo puede ser demasiado ambicioso ahora mismo. ¿Ajustamos a algo más alcanzable?',
        requiresConfirmation: true,
      };
    } else {
      return {
        decision: 'continue',
        reason: 'Un retroceso puntual no es un patrón. Las recaídas son normales y esperables.',
        requiresConfirmation: false,
      };
    }
  }

  // ─── INSUFFICIENT DATA ───
  return {
    decision: 'continue',
    reason: 'No hay datos suficientes aún para evaluar.',
    requiresConfirmation: false,
  };
}

// ═══════════════════════════════════════════════
// APLICACIÓN DE DECISIONES
// ═══════════════════════════════════════════════

function applyDecision(
  objective: IntermediateObjective,
  decision: DecisionResult,
  finalObj: FinalObjective,
  plan: InterventionPlan
): void {
  // Registrar decisión en la evaluación más reciente
  const lastEval = objective.evaluations[objective.evaluations.length - 1];
  if (lastEval) lastEval.decision = decision.decision;

  switch (decision.decision) {
    case 'advance_next_intermediate': {
      objective.status = 'achieved';
      // Activar siguiente
      const next = finalObj.intermediateObjectives.find(io =>
        io.order === objective.order + 1
      );
      if (next) {
        next.status = 'active';
        next.timeframe.startDate = new Date();
        if (next.timeframe.estimatedWeeks) {
          next.timeframe.targetDate = new Date();
          next.timeframe.targetDate.setDate(
            next.timeframe.targetDate.getDate() + next.timeframe.estimatedWeeks * 7
          );
        }
      }
      break;
    }

    case 'advance_achieved': {
      objective.status = 'achieved';
      // Verificar si el final está cumplido (se chequea en evaluateFinalObjective)
      break;
    }

    case 'extend_timeframe': {
      if (!decision.requiresConfirmation && objective.timeframe.targetDate) {
        // Extender 1 semana solo si no requiere confirmación
        objective.timeframe.targetDate = new Date(objective.timeframe.targetDate);
        objective.timeframe.targetDate.setDate(
          objective.timeframe.targetDate.getDate() + 7
        );
        objective.timeframe.estimatedWeeks += 1;
      }
      break;
    }

    case 'adjust_target_easier': {
      if (!decision.requiresConfirmation) {
        // Solo ajustar automáticamente si no requiere confirmación
        const criterion = objective.successCriterion;
        if (criterion.direction === 'decrease') {
          criterion.target = Math.round(criterion.target * 1.2); // 20% más permisivo
        } else {
          criterion.target = Math.round(criterion.target * 0.8); // 20% menos exigente
        }
        objective.status = 'adjusted';
      }
      // Si requiere confirmación, se deja como propuesta para el usuario
      break;
    }

    case 'change_technique': {
      // Se deja como propuesta — el usuario decide en weekly reflection
      break;
    }

    case 'pause_objective': {
      objective.status = 'not_achieved';
      break;
    }

    default:
      // 'continue', 'remove_objective' — no changes automáticos
      break;
  }
}

// ═══════════════════════════════════════════════
// EVALUACIÓN DE OBJETIVO FINAL
// ═══════════════════════════════════════════════

function evaluateFinalObjective(
  finalObj: FinalObjective,
  sequences: FunctionalSequence[],
  periodDays: number
): void {
  // Medir criterio final directamente
  const currentValue = measureMetric(finalObj.successCriterion, sequences, periodDays);
  const criterionMet = isCriterionMet(finalObj.successCriterion, currentValue);

  // Actualizar progreso
  finalObj.currentProgress = calculateProgress(
    finalObj.successCriterion,
    currentValue,
    finalObj.currentProgress.currentValue
  );

  // Verificar si todos los intermedios están achieved
  const allIntermediatesAchieved = finalObj.intermediateObjectives
    .every(io => io.status === 'achieved');

  if (criterionMet && allIntermediatesAchieved) {
    finalObj.status = 'achieved';
  } else if (finalObj.status === 'proposed' || finalObj.status === 'accepted') {
    // Activar primer intermedio si el final fue aceptado
    const firstIntermediate = finalObj.intermediateObjectives.find(io => io.order === 1);
    if (firstIntermediate && firstIntermediate.status === 'proposed') {
      firstIntermediate.status = 'active';
      firstIntermediate.timeframe.startDate = new Date();
      if (firstIntermediate.timeframe.estimatedWeeks) {
        firstIntermediate.timeframe.targetDate = new Date();
        firstIntermediate.timeframe.targetDate.setDate(
          firstIntermediate.timeframe.targetDate.getDate() +
          firstIntermediate.timeframe.estimatedWeeks * 7
        );
      }
    }
    finalObj.status = 'active';
  }
}

// ═══════════════════════════════════════════════
// GENERACIÓN DE RESÚMENES (PARA UI)
// ═══════════════════════════════════════════════

function buildSummary(
  objective: IntermediateObjective,
  parentFinalId: string,
  result: ObjectiveResult,
  decision: DecisionResult
): ObjectiveSummary {
  const criterion = objective.successCriterion;
  const previous = objective.currentProgress.currentValue;
  const current = result.progress.currentValue;

  return {
    objectiveId: objective.id,
    parentFinalId,
    description: objective.description,
    isIntermediate: true,
    previousValue: previous,
    currentValue: current,
    targetValue: criterion.target,
    progressPercentage: result.progress.progressPercentage,
    verdict: result.evaluation.verdict,
    verdictMessage: getVerdictMessage(result.evaluation.verdict, criterion, current),
    decision: decision.decision,
    decisionMessage: decision.reason,
    celebrate: result.evaluation.verdict === 'achieved',
  };
}

function getVerdictMessage(
  verdict: EvaluationVerdict,
  criterion: MeasurableCriterion,
  currentValue: number
): string {
  const unit = formatUnit(criterion.unit);

  switch (verdict) {
    case 'achieved':
      return `🎉 ¡Objetivo alcanzado! Has llegado a ${formatValue(currentValue, criterion.unit)}${unit}`;
    case 'progressing':
      return `📈 Vas por buen camino: ${formatValue(currentValue, criterion.unit)}${unit} (meta: ${formatValue(criterion.target, criterion.unit)}${unit})`;
    case 'stalled':
      return `➡️ Sin cambios significativos esta semana: ${formatValue(currentValue, criterion.unit)}${unit}`;
    case 'regressing':
      return `📉 Esta semana fue más difícil: ${formatValue(currentValue, criterion.unit)}${unit}. Las recaídas son parte del proceso.`;
    case 'insufficient_data':
      return `📊 Todavía no hay datos suficientes para evaluar este objetivo.`;
  }
}

function buildPlanSummary(
  plan: InterventionPlan,
  summaries: ObjectiveSummary[]
): PlanSummary {
  const progress = plan.overallProgress;

  const weeksActive = plan.activatedAt
    ? Math.ceil((Date.now() - plan.activatedAt.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;

  const highlights: string[] = [];
  const concerns: string[] = [];
  const nextSteps: string[] = [];

  // Highlights
  const achieved = summaries.filter(s => s.verdict === 'achieved');
  if (achieved.length > 0) {
    highlights.push(`¡${achieved.length} objetivo(s) cumplido(s) esta semana!`);
  }

  const progressing = summaries.filter(s => s.verdict === 'progressing');
  if (progressing.length > 0) {
    highlights.push(`${progressing.length} objetivo(s) avanzando bien`);
  }

  // Concerns
  const regressing = summaries.filter(s => s.verdict === 'regressing');
  if (regressing.length > 0) {
    concerns.push(`${regressing.length} área(s) con retroceso — revisemos la estrategia`);
  }

  const stalled = summaries.filter(s => s.verdict === 'stalled');
  if (stalled.length >= 2) {
    concerns.push(`${stalled.length} objetivos sin avance — podríamos ajustar el enfoque`);
  }

  // Next steps
  const activeIntermediates = summaries.filter(
    s => s.decision === 'continue' && s.verdict !== 'achieved'
  );
  if (activeIntermediates.length > 0) {
    nextSteps.push(`Seguir trabajando en: ${activeIntermediates[0].description}`);
  }

  const newlyActivated = summaries.filter(s => s.decision === 'advance_next_intermediate');
  if (newlyActivated.length > 0) {
    nextSteps.push(`Nuevo paso desbloqueado — listo para el siguiente nivel`);
  }

  return {
    overallProgress: {
      ...progress,
      weeksActive,
    },
    weekNumber: weeksActive,
    highlights,
    concerns,
    nextSteps,
  };
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function isEvaluable(objective: IntermediateObjective): boolean {
  return objective.status === 'active' ||
    (objective.status === 'accepted' && objective.timeframe.startDate !== undefined);
}

function calculatePlanProgress(plan: InterventionPlan): PlanProgress {
  let intermediatesCompleted = 0;
  let intermediatesTotal = 0;
  let finalsAchieved = 0;
  const finalsTotal = plan.finalObjectives.length;

  for (const fo of plan.finalObjectives) {
    if (fo.status === 'achieved') finalsAchieved++;
    for (const io of fo.intermediateObjectives) {
      intermediatesTotal++;
      if (io.status === 'achieved') intermediatesCompleted++;
    }
  }

  // Tendencia global
  const allEvals = plan.finalObjectives.flatMap(fo =>
    fo.intermediateObjectives.flatMap(io => io.evaluations)
  );
  const recentEvals = allEvals.filter(e => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return e.evaluatedAt > weekAgo;
  });

  let overallTrend: PlanProgress['overallTrend'] = 'stable';
  if (recentEvals.length > 0) {
    const verdicts = recentEvals.map(e => e.verdict);
    const improving = verdicts.filter(v => v === 'achieved' || v === 'progressing').length;
    const worsening = verdicts.filter(v => v === 'regressing').length;

    if (improving > worsening * 2) overallTrend = 'improving';
    else if (worsening > improving) overallTrend = 'worsening';
    else if (improving > 0 && worsening > 0) overallTrend = 'mixed';
  }

  // Adherencia
  const expectedEvals = intermediatesTotal; // 1 per active intermediate per week
  const evaluationAdherence = expectedEvals > 0
    ? Math.min(100, (recentEvals.length / expectedEvals) * 100)
    : 0;

  return {
    intermediatesCompleted,
    intermediatesTotal,
    finalsAchieved,
    finalsTotal,
    overallTrend,
    weeksActive: 0, // Updated in buildPlanSummary
    evaluationAdherence,
  };
}

function formatValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'percentage':
      return `${Math.round(value)}%`;
    case 'count_per_week':
      return `${value.toFixed(1)}/sem`;
    case 'count_per_day':
      return `${value.toFixed(1)}/día`;
    case 'minutes':
      return `${Math.round(value)} min`;
    case 'score_1_5':
      return `${value.toFixed(1)}/5`;
    case 'score_0_100':
      return `${Math.round(value)}/100`;
    case 'days_per_week':
      return `${value.toFixed(1)} días/sem`;
    default:
      return `${value}`;
  }
}

function formatUnit(unit: MetricUnit): string {
  // Las unidades ya se formatean en formatValue, esto es por si se necesita aparte
  return '';
}

function deepClonePlan(plan: InterventionPlan): InterventionPlan {
  return JSON.parse(JSON.stringify(plan));
}
