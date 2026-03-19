// ═══════════════════════════════════════════════════════════════════
// BaselineCollector.ts — Recolección Sistemática de Línea Base
// ═══════════════════════════════════════════════════════════════════
//
// En TCC, la línea base es el período de medición previo a la
// intervención que establece el nivel de funcionamiento del que
// se parte. Sin una línea base formal:
//   - No se puede calcular si el cambio es clínicamente significativo
//   - No se puede diferenciar mejoría real de variabilidad natural
//   - Los "targets" del plan son arbitrarios
//
// Este módulo:
// 1. Define un período formal de recolección (7-14 días)
// 2. Captura las MISMAS métricas que después se evaluarán
// 3. Calcula estadísticos de estabilidad (media, DE, tendencia)
// 4. Congela el snapshot como referencia inmutable
// 5. Determina si la línea base es válida para uso clínico
//
// Referencia: Ruiz, Díaz & Villalobos, Cap. 2 — Evaluación conductual
// Jacobson, Follette & Revenstorf (1984) — Clinical significance
// ═══════════════════════════════════════════════════════════════════

import type {
  FunctionalSequence,
  IntegratedCaseFormulation,
} from './sequenceTypes';

import type {
  MetricType,
  MetricUnit,
  MetricScope,
  MetricDataSource,
} from './interventionPlanTypes';

import { computeMetric, filterByScope } from './MetricEngine';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Snapshot congelado de línea base — referencia inmutable */
export interface BaselineSnapshot {
  id: string;
  userId: string;

  /** Período que cubre */
  period: {
    startDate: Date;
    endDate: Date;
    durationDays: number;
  };

  /** Métricas capturadas */
  metrics: BaselineMetricRecord[];

  /** Validez de la línea base */
  validity: BaselineValidity;

  /** Datos crudos: número de secuencias usadas */
  dataPoints: number;

  /** Timestamp de congelamiento */
  frozenAt: Date;

  /** Versión de formulación al momento de congelar */
  formulationVersion: number;

  /** ¿Se puede usar para calcular significación clínica? */
  usableForClinicalSignificance: boolean;
}

/** Una métrica individual dentro de la línea base */
export interface BaselineMetricRecord {
  /** Tipo de métrica (misma que se usa en MeasurableCriterion) */
  metric: MetricType;

  /** Alcance de la medición */
  scope: MetricScope;

  /** Estadísticos descriptivos */
  statistics: MetricStatistics;

  /** Valores diarios (para análisis de tendencia) */
  dailyValues: DailyMetricValue[];

  /** Fuente de datos */
  dataSource: MetricDataSource;

  /** Unidad */
  unit: MetricUnit;
}

export interface MetricStatistics {
  /** Media del período */
  mean: number;

  /** Mediana */
  median: number;

  /** Desviación estándar */
  standardDeviation: number;

  /** Mínimo y máximo */
  min: number;
  max: number;

  /** Rango intercuartílico */
  iqr: number;

  /** Coeficiente de variación (DE/media) — estabilidad */
  coefficientOfVariation: number;

  /** Tendencia: pendiente de regresión lineal sobre los días */
  trend: {
    slope: number;
    direction: 'increasing' | 'decreasing' | 'stable';
    /** ¿La tendencia es significativa? (|slope| > 0.5 * DE por día) */
    isSignificant: boolean;
  };

  /** N de mediciones válidas */
  validMeasurements: number;
}

export interface DailyMetricValue {
  date: string; // YYYY-MM-DD
  value: number;
  dataPoints: number; // Número de secuencias ese día
}

/** Validez de la línea base para uso clínico */
export interface BaselineValidity {
  /** ¿Es válida para usar? */
  isValid: boolean;

  /** Razones de invalidez (si aplica) */
  issues: BaselineIssue[];

  /** Nivel de confianza global (0-100) */
  confidence: number;

  /** Recomendación */
  recommendation: 'use' | 'use_with_caution' | 'extend_period' | 'recollect';
}

export type BaselineIssue =
  | { type: 'insufficient_data'; detail: string; severity: 'warning' | 'critical' }
  | { type: 'high_variability'; detail: string; severity: 'warning' | 'critical' }
  | { type: 'significant_trend'; detail: string; severity: 'warning' | 'critical' }
  | { type: 'too_short'; detail: string; severity: 'warning' | 'critical' }
  | { type: 'missing_days'; detail: string; severity: 'warning' | 'critical' };

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

export interface BaselineConfig {
  /** Duración mínima en días */
  minimumDays: number;
  /** Duración ideal en días */
  idealDays: number;
  /** Mínimo de puntos de datos por métrica */
  minimumDataPoints: number;
  /** Umbral de coeficiente de variación para considerar "estable" */
  stabilityThreshold: number;
  /** Métricas a capturar */
  metricsToCollect: MetricType[];
}

const DEFAULT_CONFIG: BaselineConfig = {
  minimumDays: 7,
  idealDays: 14,
  minimumDataPoints: 5,
  stabilityThreshold: 0.50, // CV < 0.50 = "estable suficiente"
  metricsToCollect: [
    'avoidance_rate',
    'completion_rate',
    'completion_frequency',
    'avoidance_frequency',
    'cascade_frequency',
    'average_mood_post_task',
    'exposure_tolerance',
    'days_active',
    'downsizing_rate',
    'technique_usage',
    'technique_effectiveness',
    'cognitive_reframe_success',
  ],
};

// ═══════════════════════════════════════════════
// FUNCIÓN PRINCIPAL: RECOLECTAR LÍNEA BASE
// ═══════════════════════════════════════════════

/**
 * Analiza las secuencias del período de línea base y genera
 * un BaselineSnapshot congelado.
 *
 * Este snapshot se usa después por:
 * - InterventionPlanGenerator → targets numéricos realistas
 * - ChangeEvaluator → comparación pre/post con significación clínica
 * - FollowUpMonitor → referencia para detectar recaídas
 *
 * @param sequences Secuencias del período de línea base
 * @param startDate Inicio del período
 * @param endDate Fin del período
 * @param formulation Formulación actual (para scope de métricas)
 * @param config Configuración (opcional)
 */
export function collectBaseline(
  userId: string,
  sequences: FunctionalSequence[],
  startDate: Date,
  endDate: Date,
  formulation: IntegratedCaseFormulation,
  config: BaselineConfig = DEFAULT_CONFIG
): BaselineSnapshot {
  const periodDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Filtrar secuencias al período
  const periodSequences = sequences.filter(
    s => s.timestamp >= startDate && s.timestamp <= endDate
  );

  // Extraer scopes relevantes desde la formulación
  const scopes = extractRelevantScopes(formulation);

  // Capturar cada métrica
  const metrics: BaselineMetricRecord[] = [];

  for (const metricType of config.metricsToCollect) {
    // Métrica global (sin scope específico)
    const globalRecord = measureBaselineMetric(
      metricType,
      periodSequences,
      {},
      startDate,
      endDate,
      periodDays
    );
    if (globalRecord.statistics.validMeasurements > 0) {
      metrics.push(globalRecord);
    }

    // Métricas por scope (categoría, habitación)
    for (const scope of scopes) {
      const scopedRecord = measureBaselineMetric(
        metricType,
        periodSequences,
        scope,
        startDate,
        endDate,
        periodDays
      );
      if (scopedRecord.statistics.validMeasurements >= 3) {
        metrics.push(scopedRecord);
      }
    }
  }

  // Validar la línea base
  const validity = validateBaseline(metrics, periodDays, periodSequences.length, config);

  return {
    id: `bl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    period: { startDate, endDate, durationDays: periodDays },
    metrics,
    validity,
    dataPoints: periodSequences.length,
    frozenAt: new Date(),
    formulationVersion: formulation.version,
    usableForClinicalSignificance:
      validity.isValid && metrics.some(m => m.statistics.validMeasurements >= 5),
  };
}

// ═══════════════════════════════════════════════
// MEDICIÓN DE MÉTRICAS PARA LÍNEA BASE
// ═══════════════════════════════════════════════

function measureBaselineMetric(
  metricType: MetricType,
  sequences: FunctionalSequence[],
  scope: MetricScope,
  startDate: Date,
  endDate: Date,
  periodDays: number
): BaselineMetricRecord {
  // Filtrar por scope
  const scoped = filterByScope(sequences, scope);

  // Calcular valores diarios
  const dailyValues = calculateDailyValues(metricType, scoped, startDate, periodDays);

  // Calcular estadísticos
  const statistics = calculateStatistics(dailyValues);

  return {
    metric: metricType,
    scope,
    statistics,
    dailyValues,
    dataSource: 'automatic_sequences',
    unit: getMetricUnit(metricType),
  };
}

function calculateDailyValues(
  metricType: MetricType,
  sequences: FunctionalSequence[],
  startDate: Date,
  periodDays: number
): DailyMetricValue[] {
  const dailyValues: DailyMetricValue[] = [];

  for (let day = 0; day < periodDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    const dateStr = dayDate.toISOString().substring(0, 10);

    const daySequences = sequences.filter(
      s => s.timestamp.toISOString().substring(0, 10) === dateStr
    );

    if (daySequences.length === 0) {
      // Día sin datos — registrar pero no incluir en cálculos
      dailyValues.push({ date: dateStr, value: NaN, dataPoints: 0 });
      continue;
    }

    const value = computeMetricForDay(metricType, daySequences);
    dailyValues.push({ date: dateStr, value, dataPoints: daySequences.length });
  }

  return dailyValues;
}

function computeMetricForDay(
  metricType: MetricType,
  daySequences: FunctionalSequence[]
): number {
  // Delegada a MetricEngine para mantener una única fuente de verdad
  return computeMetric(metricType, daySequences, { granularity: 'daily' });
}

// ═══════════════════════════════════════════════
// ESTADÍSTICOS DESCRIPTIVOS
// ═══════════════════════════════════════════════

function calculateStatistics(dailyValues: DailyMetricValue[]): MetricStatistics {
  // Filtrar NaN
  const validValues = dailyValues.filter(d => !isNaN(d.value));

  if (validValues.length === 0) {
    return emptyStatistics();
  }

  const values = validValues.map(d => d.value);
  const n = values.length;

  // Media
  const mean = values.reduce((a, b) => a + b, 0) / n;

  // Mediana
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Desviación estándar (muestra)
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = n > 1
    ? squaredDiffs.reduce((a, b) => a + b, 0) / (n - 1)
    : 0;
  const standardDeviation = Math.sqrt(variance);

  // Min, Max
  const min = sorted[0];
  const max = sorted[n - 1];

  // IQR
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // Coeficiente de variación
  const coefficientOfVariation = mean !== 0
    ? standardDeviation / Math.abs(mean)
    : standardDeviation > 0 ? Infinity : 0;

  // Tendencia (regresión lineal simple)
  const trend = calculateTrend(validValues, standardDeviation);

  return {
    mean: round(mean, 2),
    median: round(median, 2),
    standardDeviation: round(standardDeviation, 2),
    min: round(min, 2),
    max: round(max, 2),
    iqr: round(iqr, 2),
    coefficientOfVariation: round(coefficientOfVariation, 3),
    trend,
    validMeasurements: n,
  };
}

function calculateTrend(
  values: DailyMetricValue[],
  sd: number
): MetricStatistics['trend'] {
  const n = values.length;
  if (n < 3) {
    return { slope: 0, direction: 'stable', isSignificant: false };
  }

  // Regresión lineal: y = a + bx, donde x es el índice del día
  const xs = values.map((_, i) => i);
  const ys = values.map(d => d.value);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0
    ? (n * sumXY - sumX * sumY) / denominator
    : 0;

  // ¿Es significativa? Pendiente > 0.5 DE por día
  const significanceThreshold = sd * 0.5;
  const isSignificant = Math.abs(slope) > significanceThreshold;

  let direction: 'increasing' | 'decreasing' | 'stable';
  if (isSignificant) {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  } else {
    direction = 'stable';
  }

  return { slope: round(slope, 4), direction, isSignificant };
}

// ═══════════════════════════════════════════════
// VALIDACIÓN DE LÍNEA BASE
// ═══════════════════════════════════════════════

function validateBaseline(
  metrics: BaselineMetricRecord[],
  periodDays: number,
  totalDataPoints: number,
  config: BaselineConfig
): BaselineValidity {
  const issues: BaselineIssue[] = [];
  let confidence = 100;

  // 1. ¿Duración suficiente?
  if (periodDays < config.minimumDays) {
    issues.push({
      type: 'too_short',
      detail: `Período de ${periodDays} días — mínimo recomendado: ${config.minimumDays}`,
      severity: 'critical',
    });
    confidence -= 30;
  } else if (periodDays < config.idealDays) {
    issues.push({
      type: 'too_short',
      detail: `Período de ${periodDays} días — ideal: ${config.idealDays}`,
      severity: 'warning',
    });
    confidence -= 10;
  }

  // 2. ¿Suficientes datos?
  if (totalDataPoints < config.minimumDataPoints) {
    issues.push({
      type: 'insufficient_data',
      detail: `${totalDataPoints} secuencias — mínimo: ${config.minimumDataPoints}`,
      severity: 'critical',
    });
    confidence -= 30;
  }

  // 3. ¿Días faltantes?
  const primaryMetric = metrics.find(m => m.metric === 'avoidance_rate' || m.metric === 'completion_rate');
  if (primaryMetric) {
    const missingDays = primaryMetric.dailyValues.filter(d => isNaN(d.value)).length;
    const missingPercent = (missingDays / periodDays) * 100;
    if (missingPercent > 50) {
      issues.push({
        type: 'missing_days',
        detail: `${missingDays} de ${periodDays} días sin datos (${Math.round(missingPercent)}%)`,
        severity: 'critical',
      });
      confidence -= 25;
    } else if (missingPercent > 30) {
      issues.push({
        type: 'missing_days',
        detail: `${missingDays} de ${periodDays} días sin datos (${Math.round(missingPercent)}%)`,
        severity: 'warning',
      });
      confidence -= 10;
    }
  }

  // 4. ¿Estabilidad? (variabilidad excesiva)
  for (const metric of metrics) {
    if (metric.statistics.validMeasurements < 3) continue;

    if (metric.statistics.coefficientOfVariation > config.stabilityThreshold * 2) {
      issues.push({
        type: 'high_variability',
        detail: `${metric.metric}: CV=${metric.statistics.coefficientOfVariation.toFixed(2)} — variabilidad muy alta`,
        severity: 'critical',
      });
      confidence -= 15;
    } else if (metric.statistics.coefficientOfVariation > config.stabilityThreshold) {
      issues.push({
        type: 'high_variability',
        detail: `${metric.metric}: CV=${metric.statistics.coefficientOfVariation.toFixed(2)} — variabilidad moderada`,
        severity: 'warning',
      });
      confidence -= 5;
    }
  }

  // 5. ¿Tendencia significativa durante la línea base?
  // Si hay tendencia, la línea base NO es estable — el comportamiento ya está cambiando
  for (const metric of metrics) {
    if (metric.statistics.trend.isSignificant) {
      issues.push({
        type: 'significant_trend',
        detail: `${metric.metric}: tendencia ${metric.statistics.trend.direction} ` +
          `(pendiente: ${metric.statistics.trend.slope.toFixed(3)}/día) — ` +
          `el comportamiento ya está cambiando antes de intervenir`,
        severity: 'warning',
      });
      confidence -= 10;
    }
  }

  confidence = Math.max(0, Math.min(100, confidence));

  // Determinar recomendación
  const hasCritical = issues.some(i => i.severity === 'critical');
  let recommendation: BaselineValidity['recommendation'];

  if (hasCritical && confidence < 40) {
    recommendation = 'recollect';
  } else if (hasCritical) {
    recommendation = 'extend_period';
  } else if (confidence < 70) {
    recommendation = 'use_with_caution';
  } else {
    recommendation = 'use';
  }

  return {
    isValid: !hasCritical,
    issues,
    confidence,
    recommendation,
  };
}

// ═══════════════════════════════════════════════
// HELPERS PARA CONSULTAR LA LÍNEA BASE
// ═══════════════════════════════════════════════

/**
 * Obtiene el valor de línea base para una métrica + scope específicos.
 * Retorna media y DE para uso en significación clínica.
 */
export function getBaselineValue(
  baseline: BaselineSnapshot,
  metric: MetricType,
  scope?: MetricScope
): { mean: number; sd: number; n: number } | null {
  const record = baseline.metrics.find(m => {
    if (m.metric !== metric) return false;
    if (!scope) return Object.keys(m.scope).length === 0;
    // Match scope fields
    return (
      (!scope.taskCategory || m.scope.taskCategory === scope.taskCategory) &&
      (!scope.room || m.scope.room === scope.room) &&
      (!scope.behaviorType || m.scope.behaviorType === scope.behaviorType)
    );
  });

  if (!record) return null;

  return {
    mean: record.statistics.mean,
    sd: record.statistics.standardDeviation,
    n: record.statistics.validMeasurements,
  };
}

/**
 * Obtiene todos los valores diarios de una métrica para graficar.
 */
export function getBaselineDailyValues(
  baseline: BaselineSnapshot,
  metric: MetricType,
  scope?: MetricScope
): DailyMetricValue[] {
  const record = baseline.metrics.find(m => {
    if (m.metric !== metric) return false;
    if (!scope) return Object.keys(m.scope).length === 0;
    return (!scope.taskCategory || m.scope.taskCategory === scope.taskCategory);
  });

  return record?.dailyValues || [];
}

// ═══════════════════════════════════════════════
// UTILIDADES INTERNAS
// ═══════════════════════════════════════════════

// filterByScope ahora viene de MetricEngine.ts — elimina duplicación
// Este archivo ya no debe implementarla localmente

function extractRelevantScopes(
  formulation: IntegratedCaseFormulation
): MetricScope[] {
  const scopes: MetricScope[] = [];
  const seen = new Set<string>();

  for (const chain of formulation.functionalRelationships.consolidatedChains) {
    const behaviorContext = (chain.typicalBehavior as {
      context?: { taskCategory?: string; room?: string };
    } | undefined)?.context;

    // Scope por categoría
    if (behaviorContext?.taskCategory) {
      const key = `cat:${behaviorContext.taskCategory}`;
      if (!seen.has(key)) {
        scopes.push({ taskCategory: behaviorContext.taskCategory });
        seen.add(key);
      }
    }

    // Scope por categoría + habitación
    if (behaviorContext?.taskCategory && behaviorContext.room) {
      const key = `cat:${behaviorContext.taskCategory}:room:${behaviorContext.room}`;
      if (!seen.has(key)) {
        scopes.push({
          taskCategory: behaviorContext.taskCategory,
          room: behaviorContext.room,
        });
        seen.add(key);
      }
    }
  }

  return scopes;
}

function getMetricUnit(metric: MetricType): MetricUnit {
  switch (metric) {
    case 'avoidance_rate':
    case 'completion_rate':
    case 'cascade_frequency':
    case 'technique_effectiveness':
    case 'cognitive_reframe_success':
    case 'downsizing_rate':
      return 'percentage';
    case 'completion_frequency':
    case 'avoidance_frequency':
      return 'count_per_day';
    case 'exposure_tolerance':
      return 'minutes';
    case 'average_mood_post_task':
    case 'mood_improvement':
      return 'score_1_5';
    case 'chain_strength':
      return 'score_0_100';
    case 'days_active':
      return 'days_per_week';
    case 'technique_usage':
      return 'count_per_week';
    default:
      return 'score_0_100';
  }
}

function emptyStatistics(): MetricStatistics {
  return {
    mean: 0,
    median: 0,
    standardDeviation: 0,
    min: 0,
    max: 0,
    iqr: 0,
    coefficientOfVariation: 0,
    trend: { slope: 0, direction: 'stable', isSignificant: false },
    validMeasurements: 0,
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
