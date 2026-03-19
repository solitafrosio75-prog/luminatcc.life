// ═══════════════════════════════════════════════════════════════════
// ChangeEvaluator.ts — Evaluación del Cambio con Significación Clínica
// ═══════════════════════════════════════════════════════════════════
//
// "El criterio para determinar el éxito de una intervención varía
//  si se adopta un criterio clínico (significación clínica) basado
//  en el funcionamiento adecuado del paciente, o experimental
//  (significación estadística) medido a través de criterios
//  estadísticos. Ambos criterios tienen relevancia y es aconsejable
//  su utilización conjunta."
//  — Ruiz, Díaz & Villalobos, p. 136
//
// Implementa:
// 1. Índice de Cambio Confiable (Jacobson & Truax, 1991)
//    RC = (X_post - X_pre) / SE_diff
//    Donde SE_diff = SD_pre * sqrt(2 * (1 - r_xx))
//    Si |RC| > 1.96, el cambio es estadísticamente confiable (p < .05)
//
// 2. Significación Clínica (Jacobson, Follette & Revenstorf, 1984)
//    ¿El usuario pasó de rango disfuncional a funcional?
//    Criterio C: punto de corte = (SD_func * M_dys + SD_dys * M_func) / (SD_func + SD_dys)
//
// 3. Comparación pre/post con métricas equivalentes
//    Misma métrica, mismo scope, mismo instrumento
//
// Referencia: Manual TCC, Cap. 2, pp. 136-137
// ═══════════════════════════════════════════════════════════════════

import type {
  MetricType,
  MetricScope,
  MetricUnit,
  InterventionPlan,
  FinalObjective,
  IntermediateObjective,
} from './interventionPlanTypes';

import type {
  BaselineSnapshot,
  BaselineMetricRecord,
} from './BaselineCollector';

import { getBaselineValue } from './BaselineCollector';

import type { FunctionalSequence } from './sequenceTypes';

import { computeMetric, filterByScope, isHigherBetter, calculateStandardDeviation } from './MetricEngine';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface ChangeReport {
  /** ID del reporte */
  id: string;

  /** Momento de la evaluación */
  evaluationMoment: 'intra_treatment' | 'post_treatment' | 'follow_up';

  /** Fecha de generación */
  generatedAt: Date;

  /** Período post (contra el que se compara) */
  postPeriod: {
    startDate: Date;
    endDate: Date;
    durationDays: number;
  };

  /** Comparaciones métrica por métrica */
  metricComparisons: MetricComparison[];

  /** Comparaciones por objetivo del plan */
  objectiveComparisons: ObjectiveComparison[];

  /** Resumen global */
  globalSummary: GlobalChangeSummary;

  /** Baseline usado como referencia */
  baselineSnapshotId: string;
}

export interface MetricComparison {
  metric: MetricType;
  scope: MetricScope;
  unit: MetricUnit;

  /** Valores de línea base */
  baseline: {
    mean: number;
    sd: number;
    n: number;
  };

  /** Valores actuales (post) */
  current: {
    mean: number;
    sd: number;
    n: number;
  };

  /** Cambio absoluto (current.mean - baseline.mean) */
  absoluteChange: number;

  /** Cambio porcentual respecto a baseline */
  percentChange: number;

  /** Dirección del cambio (en términos de mejoría) */
  changeDirection: 'improved' | 'worsened' | 'unchanged';

  /** Índice de Cambio Confiable (Jacobson & Truax) */
  reliableChangeIndex: ReliableChangeResult;

  /** Significación clínica */
  clinicalSignificance: ClinicalSignificanceResult;

  /** Tamaño del efecto (Cohen's d) */
  effectSize: EffectSizeResult;
}

export interface ReliableChangeResult {
  /** Valor del RC */
  rcValue: number;

  /** ¿Es confiable? (|RC| > 1.96) */
  isReliable: boolean;

  /** Error estándar de la diferencia */
  seDiff: number;

  /** Fiabilidad estimada del instrumento */
  reliabilityEstimate: number;

  /** Interpretación legible */
  interpretation: string;
}

export interface ClinicalSignificanceResult {
  /** ¿Se puede calcular? (requiere datos normativos) */
  calculable: boolean;

  /** ¿Se alcanzó significación clínica? */
  achieved: boolean;

  /** Punto de corte funcional/disfuncional */
  cutoff?: number;

  /** Categoría de cambio */
  category: ChangeCategory;

  /** Interpretación legible */
  interpretation: string;
}

/**
 * Categorías de cambio clínico (Jacobson & Truax, 1991):
 * - recovered: cambio confiable + pasó a rango funcional
 * - improved: cambio confiable en dirección positiva
 * - unchanged: sin cambio confiable
 * - deteriorated: cambio confiable en dirección negativa
 */
export type ChangeCategory = 'recovered' | 'improved' | 'unchanged' | 'deteriorated';

export interface EffectSizeResult {
  /** Cohen's d */
  cohensD: number;

  /** Magnitud (Cohen, 1988) */
  magnitude: 'negligible' | 'small' | 'medium' | 'large' | 'very_large';

  /** Interpretación */
  interpretation: string;
}

export interface ObjectiveComparison {
  /** ID del objetivo final */
  finalObjectiveId: string;
  description: string;

  /** Criterio de éxito */
  targetValue: number;

  /** Valor de línea base */
  baselineValue: number;

  /** Valor actual */
  currentValue: number;

  /** ¿Se cumplió el criterio? */
  criterionMet: boolean;

  /** Índice de cambio confiable para este objetivo */
  reliableChange: ReliableChangeResult;

  /** % de avance */
  progressPercent: number;

  /** Estado */
  status: 'achieved_reliably' | 'achieved_not_reliable' | 'progressing' | 'no_change' | 'worsened';
}

export interface GlobalChangeSummary {
  /** Métricas que mejoraron confiablemente */
  reliablyImproved: number;
  /** Métricas sin cambio */
  unchanged: number;
  /** Métricas que empeoraron */
  deteriorated: number;
  /** Total de métricas evaluadas */
  totalMetrics: number;

  /** Tamaño de efecto promedio (solo de las que cambiaron) */
  averageEffectSize: number;

  /** Veredicto global */
  overallVerdict: 'significant_improvement' | 'moderate_improvement' | 'minimal_change' | 'mixed' | 'deterioration';

  /** Resumen legible para el usuario */
  userFacingSummary: string;

  /** Resumen técnico */
  technicalSummary: string;
}

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

interface ChangeEvaluationConfig {
  /** Umbral de RC para considerar cambio confiable (default: 1.96 = p < .05) */
  rcThreshold: number;

  /**
   * Fiabilidad estimada del "instrumento" (nuestras métricas automáticas).
   * En evaluación conductual formal se usa test-retest reliability.
   * Para métricas automáticas de la app, estimamos conservadoramente.
   * Rango: 0-1, donde 1 = perfectamente fiable.
   */
  defaultReliability: number;

  /**
   * Valores normativos "funcionales" para calcular significación clínica.
   * En contexto clínico vendrían de población normativa.
   * En HomeFlow los derivamos de los usuarios que funcionan bien.
   * Si no hay datos, no se calcula significación clínica.
   */
  functionalNorms?: FunctionalNorms;
}

export interface FunctionalNorms {
  [metric: string]: {
    mean: number;
    sd: number;
  };
}

/** Normas funcionales por defecto para el contexto de HomeFlow.
 * Estimaciones conservadoras para población "funcional" en tareas domésticas.
 * Favorecen no declarar cambio clínicamente significativo a menos que sea evidente.
 */
export const DEFAULT_FUNCTIONAL_NORMS: FunctionalNorms = {
  // Conductuales (registro automático)
  avoidance_rate: { mean: 15, sd: 10 },        // Evita ~15% de tareas propuestas
  completion_rate: { mean: 75, sd: 15 },        // Completa ~75%
  completion_frequency: { mean: 5, sd: 2 },     // ~5 tareas/semana completadas
  avoidance_frequency: { mean: 1, sd: 1 },      // ~1 evitación/semana
  cascade_frequency: { mean: 8, sd: 6 },        // ~8% de secuencias con cascada (MetricEngine retorna %)
  days_active: { mean: 5, sd: 1.5 },            // 5 de 7 días activo
  exposure_tolerance: { mean: 20, sd: 8 },      // 20 min promedio
  downsizing_rate: { mean: 20, sd: 12 },        // ~20% reducen alcance de tarea
  // Afectivas (auto-reporte)
  average_mood_post_task: { mean: 3.5, sd: 0.8 }, // Escala 1-5
  mood_improvement: { mean: 0.5, sd: 0.5 },     // Mejora media post-tarea
  // Cognitivas (mixtas)
  technique_usage: { mean: 3, sd: 2 },          // ~3 usos/semana
  technique_effectiveness: { mean: 60, sd: 20 }, // ~60% efectividad reportada
  cognitive_reframe_success: { mean: 50, sd: 20 }, // ~50% éxito en re-encuadre
  chain_strength: { mean: 40, sd: 15 },         // ~40% fuerza de cadena funcional
};

const DEFAULT_CONFIG: ChangeEvaluationConfig = {
  rcThreshold: 1.96,
  defaultReliability: 0.75, // Conservador para métricas automáticas
};

/** Fiabilidad diferenciada por fuente de dato (Jacobson & Truax).
 * Automáticas: alta (registro del sistema, no auto-reporte).
 * Afectivas: moderada (auto-reporte subjetivo).
 * Cognitivas: moderada-baja (mixta, semi-automática).
 */
const RELIABILITY_BY_METRIC: Partial<Record<MetricType, number>> = {
  // Conductuales automáticas
  avoidance_rate: 0.92,
  completion_rate: 0.92,
  completion_frequency: 0.92,
  avoidance_frequency: 0.92,
  cascade_frequency: 0.88,         // Detección automática, algo inferida
  days_active: 0.95,               // Binario, casi perfecto
  exposure_tolerance: 0.85,        // Temporal, algo de variabilidad
  downsizing_rate: 0.88,           // Detección automática
  // Afectivas auto-reporte
  average_mood_post_task: 0.70,    // Auto-reporte, estado subjetivo
  mood_improvement: 0.65,          // Diferencia de auto-reportes
  // Cognitivas mixtas
  technique_usage: 0.78,           // Registro semi-automático
  technique_effectiveness: 0.72,   // Auto-reporte de efectividad
  cognitive_reframe_success: 0.70, // Auto-reporte + análisis textual
  chain_strength: 0.80,            // Computado de múltiples fuentes
};

// ═══════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════

/**
 * Genera un reporte completo de cambio comparando línea base vs estado actual.
 *
 * Usa las MISMAS métricas y scopes que se capturaron en la línea base,
 * garantizando equivalencia de medida.
 */
export function evaluateChange(
  baseline: BaselineSnapshot,
  currentSequences: FunctionalSequence[],
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  plan?: InterventionPlan,
  config: ChangeEvaluationConfig = DEFAULT_CONFIG
): ChangeReport {
  const postPeriodDays = Math.ceil(
    (currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Filtrar secuencias al período actual
  const periodSequences = currentSequences.filter(
    s => s.timestamp >= currentPeriodStart && s.timestamp <= currentPeriodEnd
  );

  // Comparar cada métrica de la línea base
  const metricComparisons: MetricComparison[] = [];

  for (const baseRecord of baseline.metrics) {
    const comparison = compareMetric(
      baseRecord,
      periodSequences,
      currentPeriodStart,
      postPeriodDays,
      config
    );
    if (comparison) {
      metricComparisons.push(comparison);
    }
  }

  // Comparar por objetivo del plan (si existe)
  const objectiveComparisons = plan
    ? compareObjectives(plan, baseline, periodSequences, currentPeriodStart, postPeriodDays, config)
    : [];

  // Resumen global
  const globalSummary = generateGlobalSummary(metricComparisons, objectiveComparisons);

  return {
    id: `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    evaluationMoment: plan?.status === 'completed' ? 'post_treatment' : 'intra_treatment',
    generatedAt: new Date(),
    postPeriod: {
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
      durationDays: postPeriodDays,
    },
    metricComparisons,
    objectiveComparisons,
    globalSummary,
    baselineSnapshotId: baseline.id,
  };
}

// ═══════════════════════════════════════════════
// COMPARACIÓN POR MÉTRICA
// ═══════════════════════════════════════════════

function compareMetric(
  baseRecord: BaselineMetricRecord,
  currentSequences: FunctionalSequence[],
  periodStart: Date,
  periodDays: number,
  config: ChangeEvaluationConfig
): MetricComparison | null {
  // Filtrar secuencias por scope
  const scoped = filterByScope(currentSequences, baseRecord.scope);

  if (scoped.length < 3) return null; // Insuficientes datos post

  // Calcular estadísticos del período actual
  const currentValues = calculateCurrentValues(baseRecord.metric, scoped, periodStart, periodDays);
  const validValues = currentValues.filter(v => !isNaN(v));

  if (validValues.length < 3) return null;

  const currentMean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const currentSD = calcSD(validValues);

  const baseMean = baseRecord.statistics.mean;
  const baseSD = baseRecord.statistics.standardDeviation;
  const baseN = baseRecord.statistics.validMeasurements;

  // Cambio absoluto y porcentual
  const absoluteChange = currentMean - baseMean;
  const percentChange = baseMean !== 0
    ? ((currentMean - baseMean) / Math.abs(baseMean)) * 100
    : 0;

  // Determinar dirección de mejoría según tipo de métrica
  const isImprovementMetric = isHigherBetter(baseRecord.metric);
  let changeDirection: 'improved' | 'worsened' | 'unchanged';

  if (Math.abs(absoluteChange) < baseSD * 0.1) {
    changeDirection = 'unchanged';
  } else if (isImprovementMetric) {
    changeDirection = absoluteChange > 0 ? 'improved' : 'worsened';
  } else {
    changeDirection = absoluteChange < 0 ? 'improved' : 'worsened';
  }

  // Índice de Cambio Confiable
  const reliability = getReliabilityForMetric(baseRecord.metric, config);
  const reliableChangeIndex = calculateReliableChange(
    baseMean,
    currentMean,
    baseSD,
    reliability,
    config.rcThreshold,
    isImprovementMetric
  );

  // Significación clínica
  const clinicalSignificance = calculateClinicalSignificance(
    baseRecord.metric,
    baseMean,
    baseSD,
    currentMean,
    reliableChangeIndex.isReliable,
    changeDirection,
    config
  );

  // Tamaño del efecto
  const effectSize = calculateEffectSize(baseMean, currentMean, baseSD);

  return {
    metric: baseRecord.metric,
    scope: baseRecord.scope,
    unit: baseRecord.unit,
    baseline: { mean: baseMean, sd: baseSD, n: baseN },
    current: { mean: round(currentMean, 2), sd: round(currentSD, 2), n: validValues.length },
    absoluteChange: round(absoluteChange, 2),
    percentChange: round(percentChange, 1),
    changeDirection,
    reliableChangeIndex,
    clinicalSignificance,
    effectSize,
  };
}

function getReliabilityForMetric(
  metric: MetricType,
  config: ChangeEvaluationConfig
): number {
  return RELIABILITY_BY_METRIC[metric] ?? config.defaultReliability;
}

// ═══════════════════════════════════════════════
// ÍNDICE DE CAMBIO CONFIABLE (Jacobson & Truax, 1991)
// ═══════════════════════════════════════════════

function calculateReliableChange(
  preMean: number,
  postMean: number,
  preSD: number,
  reliability: number,
  threshold: number,
  isHigherBetter: boolean
): ReliableChangeResult {
  // SE_diff = SD_pre * sqrt(2 * (1 - r_xx))
  // Donde r_xx es la fiabilidad test-retest
  const seDiff = preSD * Math.sqrt(2 * (1 - reliability));

  // RC = (X_post - X_pre) / SE_diff
  const rcValue = seDiff > 0 ? (postMean - preMean) / seDiff : 0;

  const isReliable = Math.abs(rcValue) > threshold;

  // Interpretación
  let interpretation: string;
  if (!isReliable) {
    interpretation = 'El cambio observado no supera la variabilidad normal — no podemos afirmar que sea un cambio real.';
  } else if ((isHigherBetter && rcValue > 0) || (!isHigherBetter && rcValue < 0)) {
    interpretation = `Cambio confiable en dirección positiva (RC = ${round(rcValue, 2)}). Este cambio supera la variabilidad esperada.`;
  } else {
    interpretation = `Cambio confiable en dirección negativa (RC = ${round(rcValue, 2)}). Indica un empeoramiento real.`;
  }

  return {
    rcValue: round(rcValue, 3),
    isReliable,
    seDiff: round(seDiff, 3),
    reliabilityEstimate: reliability,
    interpretation,
  };
}

// ═══════════════════════════════════════════════
// SIGNIFICACIÓN CLÍNICA (Jacobson et al., 1984)
// ═══════════════════════════════════════════════

function calculateClinicalSignificance(
  metric: MetricType,
  baseMean: number,
  baseSD: number,
  currentMean: number,
  isReliableChange: boolean,
  changeDirection: 'improved' | 'worsened' | 'unchanged',
  config: ChangeEvaluationConfig
): ClinicalSignificanceResult {
  const norms = {
    ...DEFAULT_FUNCTIONAL_NORMS,
    ...(config.functionalNorms || {}),
  };
  const norm = norms[metric];

  if (!norm) {
    return {
      calculable: false,
      achieved: false,
      category: isReliableChange
        ? (changeDirection === 'improved' ? 'improved' : 'deteriorated')
        : 'unchanged',
      interpretation: 'No hay datos normativos para calcular significación clínica en esta métrica.',
    };
  }

  // Criterio C de Jacobson: punto de corte entre distribución funcional y disfuncional
  // cutoff = (SD_func * M_dys + SD_dys * M_func) / (SD_func + SD_dys)
  const cutoff = (norm.sd * baseMean + baseSD * norm.mean) / (norm.sd + baseSD);

  // ¿El usuario pasó de un lado al otro del cutoff?
  const isHigher = isHigherBetter(metric);
  let crossedCutoff: boolean;

  if (isHigher) {
    // Para métricas donde más es mejor: funcional = por encima del cutoff
    crossedCutoff = baseMean < cutoff && currentMean >= cutoff;
  } else {
    // Para métricas donde menos es mejor: funcional = por debajo del cutoff
    crossedCutoff = baseMean > cutoff && currentMean <= cutoff;
  }

  // Categorización de Jacobson
  let category: ChangeCategory;
  if (isReliableChange && crossedCutoff) {
    category = 'recovered';
  } else if (isReliableChange && changeDirection === 'improved') {
    category = 'improved';
  } else if (isReliableChange && changeDirection === 'worsened') {
    category = 'deteriorated';
  } else {
    category = 'unchanged';
  }

  // Interpretación
  const interpretations: Record<ChangeCategory, string> = {
    recovered: '¡Cambio clínicamente significativo! Has pasado de un funcionamiento problemático a uno funcional en esta área.',
    improved: 'Mejoría real y confiable, aunque todavía hay margen para seguir avanzando hacia un funcionamiento plenamente funcional.',
    unchanged: 'Sin cambios significativos en esta área. Esto puede indicar que la estrategia actual necesita ajuste.',
    deteriorated: 'Se observa un empeoramiento confiable. Es importante revisar qué está pasando y ajustar el enfoque.',
  };

  return {
    calculable: true,
    achieved: category === 'recovered',
    cutoff: round(cutoff, 2),
    category,
    interpretation: interpretations[category],
  };
}

// ═══════════════════════════════════════════════
// TAMAÑO DEL EFECTO (Cohen's d)
// ═══════════════════════════════════════════════

function calculateEffectSize(
  preMean: number,
  postMean: number,
  preSD: number
): EffectSizeResult {
  const cohensD = preSD > 0
    ? (postMean - preMean) / preSD
    : 0;

  const absd = Math.abs(cohensD);

  let magnitude: EffectSizeResult['magnitude'];
  if (absd < 0.2) magnitude = 'negligible';
  else if (absd < 0.5) magnitude = 'small';
  else if (absd < 0.8) magnitude = 'medium';
  else if (absd < 1.2) magnitude = 'large';
  else magnitude = 'very_large';

  const directionWord = cohensD > 0 ? 'aumento' : cohensD < 0 ? 'disminución' : 'sin cambio';

  return {
    cohensD: round(cohensD, 3),
    magnitude,
    interpretation: `Efecto ${magnitude} (d = ${round(cohensD, 2)}): ${directionWord} de ${round(absd, 1)} desviaciones estándar respecto a la línea base.`,
  };
}

// ═══════════════════════════════════════════════
// COMPARACIÓN POR OBJETIVOS DEL PLAN
// ═══════════════════════════════════════════════

function compareObjectives(
  plan: InterventionPlan,
  baseline: BaselineSnapshot,
  currentSequences: FunctionalSequence[],
  periodStart: Date,
  periodDays: number,
  config: ChangeEvaluationConfig
): ObjectiveComparison[] {
  const comparisons: ObjectiveComparison[] = [];

  for (const finalObj of plan.finalObjectives) {
    if (finalObj.status === 'removed') continue;

    const criterion = finalObj.successCriterion;

    // Obtener valor de línea base para esta métrica + scope
    const baseValue = getBaselineValue(baseline, criterion.metric, criterion.scope);
    if (!baseValue) continue;

    // Medir valor actual
    const scoped = filterByScope(currentSequences, criterion.scope);
    const currentValues = calculateCurrentValues(criterion.metric, scoped, periodStart, periodDays);
    const validCurrent = currentValues.filter(v => !isNaN(v));

    if (validCurrent.length < 3) continue;

    const currentMean = validCurrent.reduce((a, b) => a + b, 0) / validCurrent.length;

    // Calcular RC
    const isHigher = isHigherBetter(criterion.metric);
    const reliability = getReliabilityForMetric(criterion.metric, config);
    const reliableChange = calculateReliableChange(
      baseValue.mean,
      currentMean,
      baseValue.sd,
      reliability,
      config.rcThreshold,
      isHigher
    );

    // ¿Se cumplió el criterio del plan?
    const criterionMet = criterion.direction === 'decrease'
      ? currentMean <= criterion.target
      : currentMean >= criterion.target;

    // Progreso
    const totalDistance = Math.abs(criterion.target - baseValue.mean);
    const currentDistance = Math.abs(currentMean - baseValue.mean);
    const goingRight = criterion.direction === 'decrease'
      ? currentMean < baseValue.mean
      : currentMean > baseValue.mean;
    const progressPercent = totalDistance > 0 && goingRight
      ? Math.min(100, (currentDistance / totalDistance) * 100)
      : 0;

    // Estado
    let status: ObjectiveComparison['status'];
    if (criterionMet && reliableChange.isReliable) {
      status = 'achieved_reliably';
    } else if (criterionMet && !reliableChange.isReliable) {
      status = 'achieved_not_reliable';
    } else if (reliableChange.isReliable && goingRight) {
      status = 'progressing';
    } else if (reliableChange.isReliable && !goingRight) {
      status = 'worsened';
    } else {
      status = 'no_change';
    }

    comparisons.push({
      finalObjectiveId: finalObj.id,
      description: finalObj.description,
      targetValue: criterion.target,
      baselineValue: round(baseValue.mean, 2),
      currentValue: round(currentMean, 2),
      criterionMet,
      reliableChange,
      progressPercent: round(progressPercent, 1),
      status,
    });
  }

  return comparisons;
}

// ═══════════════════════════════════════════════
// RESUMEN GLOBAL
// ═══════════════════════════════════════════════

function generateGlobalSummary(
  metricComparisons: MetricComparison[],
  objectiveComparisons: ObjectiveComparison[]
): GlobalChangeSummary {
  const reliablyImproved = metricComparisons.filter(
    m => m.reliableChangeIndex.isReliable && m.changeDirection === 'improved'
  ).length;

  const deteriorated = metricComparisons.filter(
    m => m.reliableChangeIndex.isReliable && m.changeDirection === 'worsened'
  ).length;

  const unchanged = metricComparisons.length - reliablyImproved - deteriorated;

  // Tamaño de efecto promedio (solo de las que cambiaron confiablemente)
  const changedMetrics = metricComparisons.filter(m => m.reliableChangeIndex.isReliable);
  const averageEffectSize = changedMetrics.length > 0
    ? changedMetrics.reduce((sum, m) => sum + Math.abs(m.effectSize.cohensD), 0) / changedMetrics.length
    : 0;

  // Veredicto
  let overallVerdict: GlobalChangeSummary['overallVerdict'];
  const total = metricComparisons.length;

  if (total === 0) {
    overallVerdict = 'minimal_change';
  } else if (reliablyImproved / total >= 0.5 && deteriorated === 0) {
    overallVerdict = 'significant_improvement';
  } else if (reliablyImproved > deteriorated && reliablyImproved / total >= 0.3) {
    overallVerdict = 'moderate_improvement';
  } else if (deteriorated > reliablyImproved) {
    overallVerdict = 'deterioration';
  } else if (reliablyImproved > 0 && deteriorated > 0) {
    overallVerdict = 'mixed';
  } else {
    overallVerdict = 'minimal_change';
  }

  // Resumen legible
  const userFacingSummary = generateUserFacingSummary(
    overallVerdict,
    reliablyImproved,
    unchanged,
    deteriorated,
    objectiveComparisons
  );

  // Resumen técnico
  const technicalSummary =
    `${reliablyImproved}/${total} métricas con cambio confiable positivo ` +
    `(RC > ${1.96}), ${deteriorated} deterioradas, ${unchanged} sin cambio. ` +
    `Efecto promedio d = ${round(averageEffectSize, 2)}.`;

  return {
    reliablyImproved,
    unchanged,
    deteriorated,
    totalMetrics: total,
    averageEffectSize: round(averageEffectSize, 3),
    overallVerdict,
    userFacingSummary,
    technicalSummary,
  };
}

function generateUserFacingSummary(
  verdict: GlobalChangeSummary['overallVerdict'],
  improved: number,
  unchanged: number,
  deteriorated: number,
  objectiveComparisons: ObjectiveComparison[]
): string {
  const achieved = objectiveComparisons.filter(o => o.status === 'achieved_reliably').length;
  const totalObj = objectiveComparisons.length;

  switch (verdict) {
    case 'significant_improvement':
      return achieved > 0
        ? `Los datos muestran mejoría real y confiable en ${improved} áreas. ` +
          `Has alcanzado ${achieved} de ${totalObj} objetivos de forma estadísticamente verificable — ` +
          `no es solo tu percepción, el cambio es medible.`
        : `Los datos muestran mejoría real en ${improved} áreas. ` +
          `El cambio que estás haciendo supera la variabilidad normal — es un avance genuino.`;

    case 'moderate_improvement':
      return `Hay mejoría confiable en ${improved} áreas, aunque ${unchanged} se mantienen sin cambio significativo. ` +
        `El progreso es real, y seguir trabajando probablemente ampliará los resultados.`;

    case 'minimal_change':
      return `Los datos aún no muestran cambios que superen la variabilidad normal. ` +
        `Esto no significa que no haya esfuerzo — a veces el cambio conductual necesita más tiempo para reflejarse en los números.`;

    case 'mixed':
      return `Los resultados son mixtos: ${improved} áreas mejoraron pero ${deteriorated} empeoraron. ` +
        `Esto sugiere que podríamos reenfocaar la estrategia para proteger las áreas vulnerables.`;

    case 'deterioration':
      return `Los datos muestran dificultades en ${deteriorated} áreas. ` +
        `Esto es información valiosa — nos ayuda a entender qué no está funcionando y ajustar el enfoque. ` +
        `Las recaídas son parte normal del proceso de cambio.`;
  }
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function calculateCurrentValues(
  metric: MetricType,
  sequences: FunctionalSequence[],
  startDate: Date,
  periodDays: number
): number[] {
  const values: number[] = [];

  for (let day = 0; day < periodDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    const dateStr = dayDate.toISOString().substring(0, 10);

    const daySeqs = sequences.filter(
      s => s.timestamp.toISOString().substring(0, 10) === dateStr
    );

    if (daySeqs.length === 0) {
      values.push(NaN);
      continue;
    }

    values.push(computeMetricValue(metric, daySeqs));
  }

  return values;
}

function computeMetricValue(metric: MetricType, seqs: FunctionalSequence[]): number {
  // Delegada a MetricEngine para mantener fuente única
  return computeMetric(metric, seqs, { granularity: 'daily' });
}

// isHigherBetter ahora viene de MetricEngine.ts — elimina duplicación
// Este archivo ya no debe implementarla localmente

// filterByScope ahora viene de MetricEngine.ts — elimina duplicación
// Este archivo ya no debe implementarla localmente

function calcSD(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (n - 1));
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
