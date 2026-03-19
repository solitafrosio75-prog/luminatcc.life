// ═══════════════════════════════════════════════════════════════════
// FollowUpMonitor.ts — Monitoreo de Seguimiento Post-Intervención
// ═══════════════════════════════════════════════════════════════════
//
// "La evaluación durante el periodo de seguimiento tiene como
//  objetivo comprobar si la mejoría conseguida durante el proceso
//  de intervención se ha generalizado eficazmente a las situaciones
//  cotidianas del sujeto y se mantiene con el paso del tiempo."
//  — Ruiz, Díaz & Villalobos, p. 137
//
// El manual recomienda evaluaciones periódicas en los 12 meses
// siguientes a la finalización del tratamiento.
//
// Este módulo:
// 1. Compara estado actual vs mejor momento alcanzado (peak)
// 2. Compara estado actual vs línea base original
// 3. Detecta recaídas usando umbrales basados en RC de Jacobson
// 4. Genera alertas graduales (vigilancia → preocupación → intervención)
// 5. Propone acciones de mantenimiento o re-intervención
//
// Se activa cuando un plan pasa a status 'completed'.
// ═══════════════════════════════════════════════════════════════════

import type {
  MetricType,
  MetricScope,
  InterventionPlan,
  FinalObjective,
} from './interventionPlanTypes';

import type {
  BaselineSnapshot,
} from './BaselineCollector';

import { getBaselineValue } from './BaselineCollector';

import type { FunctionalSequence } from './sequenceTypes';

import { computeMetric, filterByScope, isHigherBetter } from './MetricEngine';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Estado de seguimiento de un plan completado */
export interface FollowUpState {
  id: string;
  userId: string;

  /** Plan que se completó */
  completedPlanId: string;

  /** Línea base original */
  baselineSnapshotId: string;

  /** Mejor nivel alcanzado durante la intervención (peak) */
  peakMetrics: PeakMetricRecord[];

  /** Historial de chequeos de seguimiento */
  checkups: FollowUpCheckup[];

  /** Estado global del seguimiento */
  status: FollowUpStatus;

  /** Configuración */
  config: FollowUpConfig;

  /** Timestamps */
  startedAt: Date;
  lastCheckupAt?: Date;
  closedAt?: Date;
}

export type FollowUpStatus =
  | 'active'           // Monitoreando activamente
  | 'stable'           // 3+ meses sin alertas → monitoreo menos frecuente
  | 'alert'            // Detectada tendencia preocupante
  | 'reintervention'   // Se recomendó re-intervención
  | 'closed';          // 12 meses sin problemas → seguimiento terminado

/** Mejor nivel alcanzado en una métrica durante intervención */
export interface PeakMetricRecord {
  metric: MetricType;
  scope: MetricScope;

  /** Mejor valor alcanzado */
  peakValue: number;

  /** Cuándo se alcanzó */
  peakDate: Date;

  /** Valor de línea base para referencia */
  baselineValue: number;
}

/** Un chequeo periódico de seguimiento */
export interface FollowUpCheckup {
  id: string;
  date: Date;

  /** Semana de seguimiento (desde completación del plan) */
  weekNumber: number;

  /** Comparaciones por métrica */
  metricResults: FollowUpMetricResult[];

  /** Alertas generadas */
  alerts: FollowUpAlert[];

  /** Veredicto global del chequeo */
  verdict: CheckupVerdict;

  /** Acciones recomendadas */
  recommendations: MaintenanceRecommendation[];
}

export interface FollowUpMetricResult {
  metric: MetricType;
  scope: MetricScope;

  /** Valor actual */
  currentValue: number;

  /** Valor peak (mejor logrado) */
  peakValue: number;

  /** Valor de línea base */
  baselineValue: number;

  /** ¿Cuánto se ha perdido respecto al peak? (0-100%) */
  peakLossPercent: number;

  /** ¿Sigue mejor que la línea base? */
  stillBetterThanBaseline: boolean;

  /** Nivel de retención de ganancias */
  retentionLevel: 'full' | 'partial' | 'minimal' | 'lost';
}

export interface FollowUpAlert {
  severity: 'watch' | 'concern' | 'action';
  metric: MetricType;
  message: string;

  /** ¿Cuántos chequeos consecutivos con esta alerta? */
  consecutiveOccurrences: number;
}

export type CheckupVerdict =
  | 'maintaining'        // Ganancias mantenidas
  | 'minor_fluctuation'  // Fluctuación normal, no preocupante
  | 'gradual_decline'    // Declive gradual — vigilar
  | 'significant_loss'   // Pérdida significativa — intervenir
  | 'full_relapse';      // Vuelta a niveles de línea base

export interface MaintenanceRecommendation {
  type: 'continue_monitoring' | 'booster_session' | 'reactivate_technique' | 'reopen_plan' | 'new_plan';
  description: string;
  urgency: 'low' | 'medium' | 'high';

  /** Si aplica, qué objetivo reactivar */
  relatedObjectiveId?: string;
}

export interface FollowUpConfig {
  /** Frecuencia de chequeos (semanas) */
  checkupFrequencyWeeks: number;

  /** Meses de seguimiento total */
  totalMonths: number;

  /** Umbral de pérdida respecto al peak para generar alerta 'watch' */
  watchThresholdPercent: number;

  /** Umbral de pérdida para 'concern' */
  concernThresholdPercent: number;

  /** Umbral de pérdida para 'action' */
  actionThresholdPercent: number;

  /** Chequeos consecutivos con 'concern' antes de recomendar re-intervención */
  concernCountForReintervention: number;
}

const DEFAULT_CONFIG: FollowUpConfig = {
  checkupFrequencyWeeks: 2,   // Cada 2 semanas inicialmente
  totalMonths: 12,
  watchThresholdPercent: 20,   // Perdió 20% de ganancia respecto al peak
  concernThresholdPercent: 40, // Perdió 40%
  actionThresholdPercent: 60,  // Perdió 60%
  concernCountForReintervention: 3, // 3 chequeos consecutivos con concern
};

// ═══════════════════════════════════════════════
// INICIALIZACIÓN DEL SEGUIMIENTO
// ═══════════════════════════════════════════════

/**
 * Inicia el seguimiento cuando un plan se completa.
 * Captura los peak metrics del plan para usarlos como referencia.
 */
export function initializeFollowUp(
  userId: string,
  completedPlan: InterventionPlan,
  baseline: BaselineSnapshot
): FollowUpState {
  const peakMetrics = extractPeakMetrics(completedPlan, baseline);

  return {
    id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    completedPlanId: completedPlan.id?.toString() || 'unknown',
    baselineSnapshotId: baseline.id,
    peakMetrics,
    checkups: [],
    status: 'active',
    config: DEFAULT_CONFIG,
    startedAt: new Date(),
  };
}

/**
 * Extrae los mejores valores alcanzados durante la intervención
 * desde el historial de evaluaciones del plan.
 */
function extractPeakMetrics(
  plan: InterventionPlan,
  baseline: BaselineSnapshot
): PeakMetricRecord[] {
  const peaks: PeakMetricRecord[] = [];

  for (const fo of plan.finalObjectives) {
    if (fo.status !== 'achieved') continue;

    const criterion = fo.successCriterion;
    const baseValue = getBaselineValue(baseline, criterion.metric, criterion.scope);
    if (!baseValue) continue;

    // Buscar el mejor valor real en todo el historial de evaluaciones
    const candidates: Array<{ value: number; date: Date }> = [];

    if (!isNaN(fo.currentProgress.currentValue)) {
      candidates.push({
        value: fo.currentProgress.currentValue,
        date: fo.currentProgress.measuredAt,
      });
    }

    for (const io of fo.intermediateObjectives) {
      for (const evaluation of io.evaluations) {
        if (!isNaN(evaluation.measuredValue)) {
          candidates.push({ value: evaluation.measuredValue, date: evaluation.evaluatedAt });
        }
      }
    }

    if (candidates.length === 0) continue;

    const compare = criterion.direction === 'decrease'
      ? (a: number, b: number) => a < b
      : (a: number, b: number) => a > b;

    let peak = candidates[0];
    for (const candidate of candidates.slice(1)) {
      if (compare(candidate.value, peak.value)) {
        peak = candidate;
      }
    }

    const peakValue = peak.value;
    const peakDate = peak.date;

    peaks.push({
      metric: criterion.metric,
      scope: criterion.scope,
      peakValue,
      peakDate,
      baselineValue: baseValue.mean,
    });
  }

  return peaks;
}

// ═══════════════════════════════════════════════
// CHEQUEO DE SEGUIMIENTO
// ═══════════════════════════════════════════════

/**
 * Ejecuta un chequeo de seguimiento periódico.
 * Compara estado actual contra peaks y línea base.
 */
export function runFollowUpCheckup(
  state: FollowUpState,
  currentSequences: FunctionalSequence[],
  periodDays: number = 14
): FollowUpState {
  const updated = deepClone(state);
  const now = new Date();

  const weekNumber = Math.ceil(
    (now.getTime() - updated.startedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  // Calcular resultados por métrica
  const metricResults: FollowUpMetricResult[] = [];

  for (const peak of updated.peakMetrics) {
    const result = evaluateMetricRetention(
      peak,
      currentSequences,
      periodDays
    );
    if (result) metricResults.push(result);
  }

  // Generar alertas
  const alerts = generateAlerts(metricResults, updated.checkups, updated.config);

  // Determinar veredicto
  const verdict = determineCheckupVerdict(metricResults, alerts);

  // Generar recomendaciones
  const recommendations = generateRecommendations(
    verdict,
    alerts,
    metricResults,
    updated
  );

  // Crear chequeo
  const checkup: FollowUpCheckup = {
    id: `fuc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: now,
    weekNumber,
    metricResults,
    alerts,
    verdict,
    recommendations,
  };

  updated.checkups.push(checkup);
  updated.lastCheckupAt = now;

  // Actualizar estado global
  updated.status = determineFollowUpStatus(updated, verdict);

  // ¿Cerrar seguimiento? (12 meses o estable por 3+ meses)
  const monthsActive = (now.getTime() - updated.startedAt.getTime()) / (30 * 24 * 60 * 60 * 1000);
  if (monthsActive >= updated.config.totalMonths && updated.status !== 'alert') {
    updated.status = 'closed';
    updated.closedAt = now;
  }

  // Ajustar frecuencia si está estable
  if (updated.status === 'stable' && updated.config.checkupFrequencyWeeks < 4) {
    updated.config.checkupFrequencyWeeks = 4; // Reducir a mensual
  }

  return updated;
}

// ═══════════════════════════════════════════════
// EVALUACIÓN DE RETENCIÓN POR MÉTRICA
// ═══════════════════════════════════════════════

function evaluateMetricRetention(
  peak: PeakMetricRecord,
  sequences: FunctionalSequence[],
  periodDays: number
): FollowUpMetricResult | null {
  const scoped = filterByScope(sequences, peak.scope);
  if (scoped.length < 3) return null;

  // Usar MetricEngine con granularidad semanal para mantener consistencia
  const currentValue = computeMetric(peak.metric, scoped, {
    granularity: 'weekly',
    periodDays,
  });
  if (isNaN(currentValue)) return null;

  // Calcular pérdida respecto al peak
  const totalGain = Math.abs(peak.peakValue - peak.baselineValue);
  const currentGainFromBaseline = peak.peakValue > peak.baselineValue
    ? currentValue - peak.baselineValue
    : peak.baselineValue - currentValue;

  const peakLossPercent = totalGain > 0
    ? Math.max(0, ((totalGain - Math.abs(currentGainFromBaseline)) / totalGain) * 100)
    : 0;

  // ¿Sigue mejor que la línea base?
  const isHigher = isHigherBetter(peak.metric);
  const stillBetter = isHigher
    ? currentValue > peak.baselineValue
    : currentValue < peak.baselineValue;

  // Nivel de retención
  let retentionLevel: FollowUpMetricResult['retentionLevel'];
  if (peakLossPercent <= 15) retentionLevel = 'full';
  else if (peakLossPercent <= 40) retentionLevel = 'partial';
  else if (stillBetter) retentionLevel = 'minimal';
  else retentionLevel = 'lost';

  return {
    metric: peak.metric,
    scope: peak.scope,
    currentValue: round(currentValue, 2),
    peakValue: peak.peakValue,
    baselineValue: peak.baselineValue,
    peakLossPercent: round(peakLossPercent, 1),
    stillBetterThanBaseline: stillBetter,
    retentionLevel,
  };
}

// ═══════════════════════════════════════════════
// ALERTAS
// ═══════════════════════════════════════════════

function generateAlerts(
  results: FollowUpMetricResult[],
  previousCheckups: FollowUpCheckup[],
  config: FollowUpConfig
): FollowUpAlert[] {
  const alerts: FollowUpAlert[] = [];

  for (const result of results) {
    // Contar ocurrencias consecutivas previas
    const consecutive = countConsecutiveAlerts(
      result.metric,
      previousCheckups
    );

    if (result.peakLossPercent >= config.actionThresholdPercent) {
      alerts.push({
        severity: 'action',
        metric: result.metric,
        message: result.stillBetterThanBaseline
          ? `${formatMetric(result.metric)}: has perdido más del ${Math.round(result.peakLossPercent)}% de la mejoría alcanzada, aunque sigues mejor que al inicio.`
          : `${formatMetric(result.metric)}: has vuelto a niveles cercanos a tu punto de partida. Podría ayudar reactivar la estrategia que funcionó.`,
        consecutiveOccurrences: consecutive + 1,
      });
    } else if (result.peakLossPercent >= config.concernThresholdPercent) {
      alerts.push({
        severity: 'concern',
        metric: result.metric,
        message: `${formatMetric(result.metric)}: se ha perdido algo de terreno (${Math.round(result.peakLossPercent)}% de la mejoría). Vale la pena estar atentos.`,
        consecutiveOccurrences: consecutive + 1,
      });
    } else if (result.peakLossPercent >= config.watchThresholdPercent) {
      alerts.push({
        severity: 'watch',
        metric: result.metric,
        message: `${formatMetric(result.metric)}: fluctuación menor. Es normal que haya variación semana a semana.`,
        consecutiveOccurrences: consecutive + 1,
      });
    }
  }

  return alerts;
}

function countConsecutiveAlerts(
  metric: MetricType,
  previousCheckups: FollowUpCheckup[]
): number {
  let count = 0;
  // Recorrer desde el más reciente hacia atrás
  for (let i = previousCheckups.length - 1; i >= 0; i--) {
    const hadAlert = previousCheckups[i].alerts.some(
      a => a.metric === metric && (a.severity === 'concern' || a.severity === 'action')
    );
    if (hadAlert) count++;
    else break;
  }
  return count;
}

// ═══════════════════════════════════════════════
// VEREDICTOS Y RECOMENDACIONES
// ═══════════════════════════════════════════════

function determineCheckupVerdict(
  results: FollowUpMetricResult[],
  alerts: FollowUpAlert[]
): CheckupVerdict {
  if (results.length === 0) return 'maintaining';

  const actionAlerts = alerts.filter(a => a.severity === 'action');
  const concernAlerts = alerts.filter(a => a.severity === 'concern');
  const lostMetrics = results.filter(r => r.retentionLevel === 'lost');
  const fullRetention = results.filter(r => r.retentionLevel === 'full');

  if (lostMetrics.length > 0 && lostMetrics.length >= results.length * 0.5) {
    return 'full_relapse';
  }
  if (actionAlerts.length > 0) {
    return 'significant_loss';
  }
  if (concernAlerts.length > 0) {
    return 'gradual_decline';
  }
  if (fullRetention.length >= results.length * 0.7) {
    return 'maintaining';
  }
  return 'minor_fluctuation';
}

function generateRecommendations(
  verdict: CheckupVerdict,
  alerts: FollowUpAlert[],
  results: FollowUpMetricResult[],
  state: FollowUpState
): MaintenanceRecommendation[] {
  const recommendations: MaintenanceRecommendation[] = [];

  switch (verdict) {
    case 'maintaining':
      recommendations.push({
        type: 'continue_monitoring',
        description: 'Todo va bien. Seguimos vigilando para asegurarnos de que los cambios se mantienen.',
        urgency: 'low',
      });
      break;

    case 'minor_fluctuation':
      recommendations.push({
        type: 'continue_monitoring',
        description: 'Las fluctuaciones son normales. Si persisten más de 2 semanas, revisaremos la estrategia.',
        urgency: 'low',
      });
      break;

    case 'gradual_decline': {
      // Buscar qué métricas están en declive
      const decliningMetrics = results.filter(r =>
        r.retentionLevel === 'partial' || r.retentionLevel === 'minimal'
      );

      recommendations.push({
        type: 'booster_session',
        description: `Hay un declive gradual en ${decliningMetrics.length} área(s). ` +
          `Una "sesión de refuerzo" — revisar las técnicas que funcionaron — podría ayudar a recuperar el terreno.`,
        urgency: 'medium',
      });

      // Si hay alertas concern consecutivas
      const persistentConcerns = alerts.filter(
        a => a.severity === 'concern' && a.consecutiveOccurrences >= 2
      );
      if (persistentConcerns.length > 0) {
        recommendations.push({
          type: 'reactivate_technique',
          description: `La técnica que usaste para ${formatMetric(persistentConcerns[0].metric)} ` +
            `podría necesitar reactivarse. ¿Quieres que la incluyamos de nuevo en las recomendaciones?`,
          urgency: 'medium',
        });
      }
      break;
    }

    case 'significant_loss': {
      const actionMetrics = alerts.filter(a => a.severity === 'action');

      if (actionMetrics.some(a => a.consecutiveOccurrences >= state.config.concernCountForReintervention)) {
        recommendations.push({
          type: 'reopen_plan',
          description: 'La pérdida de mejoría ha sido persistente. Recomendamos reactivar el plan ' +
            'de intervención con objetivos ajustados a tu situación actual.',
          urgency: 'high',
        });
      } else {
        recommendations.push({
          type: 'reactivate_technique',
          description: `Hay una pérdida importante en ${actionMetrics.length} área(s). ` +
            `Reactivar las técnicas que funcionaron podría ayudar antes de que necesitemos un plan nuevo.`,
          urgency: 'high',
        });
      }
      break;
    }

    case 'full_relapse':
      recommendations.push({
        type: 'new_plan',
        description: 'Los datos muestran una vuelta a los niveles iniciales. Esto no es un fracaso — ' +
          'es información que nos ayuda a diseñar una estrategia más robusta. ' +
          'Recomendamos crear un nuevo plan que incorpore lo que aprendimos.',
        urgency: 'high',
      });
      break;
  }

  return recommendations;
}

function determineFollowUpStatus(
  state: FollowUpState,
  latestVerdict: CheckupVerdict
): FollowUpStatus {
  // Si los últimos 6 chequeos fueron maintaining → stable
  const recentCheckups = state.checkups.slice(-6);
  const allMaintaining = recentCheckups.length >= 6 &&
    recentCheckups.every(c => c.verdict === 'maintaining' || c.verdict === 'minor_fluctuation');

  if (allMaintaining) return 'stable';

  if (latestVerdict === 'full_relapse' || latestVerdict === 'significant_loss') {
    // Verificar si hay recomendación de re-intervención
    const latest = state.checkups[state.checkups.length - 1];
    if (latest?.recommendations.some(r => r.type === 'reopen_plan' || r.type === 'new_plan')) {
      return 'reintervention';
    }
    return 'alert';
  }

  if (latestVerdict === 'gradual_decline') return 'alert';

  return 'active';
}

// ═══════════════════════════════════════════════
// RESUMEN PARA UI
// ═══════════════════════════════════════════════

export interface FollowUpSummaryForUI {
  /** Semanas desde completación */
  weeksSinceCompletion: number;

  /** Veredicto del último chequeo */
  latestVerdict: CheckupVerdict;

  /** Emoji y título */
  emoji: string;
  title: string;

  /** Retención por métrica (para gráfico) */
  retentionBars: {
    label: string;
    retentionPercent: number;
    level: FollowUpMetricResult['retentionLevel'];
  }[];

  /** Alertas activas */
  activeAlerts: FollowUpAlert[];

  /** Mensaje principal */
  message: string;
}

export function generateFollowUpSummary(state: FollowUpState): FollowUpSummaryForUI {
  const latest = state.checkups[state.checkups.length - 1];
  if (!latest) {
    return {
      weeksSinceCompletion: 0,
      latestVerdict: 'maintaining',
      emoji: '🌿',
      title: 'Seguimiento activo',
      retentionBars: [],
      activeAlerts: [],
      message: 'Tu plan se completó. Seguiremos monitoreando que los cambios se mantengan.',
    };
  }

  const weeksSinceCompletion = latest.weekNumber;

  const retentionBars = latest.metricResults.map(r => ({
    label: formatMetric(r.metric),
    retentionPercent: round(100 - r.peakLossPercent, 1),
    level: r.retentionLevel,
  }));

  const verdictUI = getVerdictUI(latest.verdict);

  return {
    weeksSinceCompletion,
    latestVerdict: latest.verdict,
    ...verdictUI,
    retentionBars,
    activeAlerts: latest.alerts.filter(a => a.severity !== 'watch'),
    message: getVerdictMessage(latest.verdict, weeksSinceCompletion),
  };
}

function getVerdictUI(verdict: CheckupVerdict): { emoji: string; title: string } {
  switch (verdict) {
    case 'maintaining': return { emoji: '🌿', title: 'Cambios mantenidos' };
    case 'minor_fluctuation': return { emoji: '🌤️', title: 'Fluctuación normal' };
    case 'gradual_decline': return { emoji: '🌥️', title: 'Algo de declive' };
    case 'significant_loss': return { emoji: '🌧️', title: 'Pérdida de terreno' };
    case 'full_relapse': return { emoji: '⛈️', title: 'Vuelta al inicio' };
  }
}

function getVerdictMessage(verdict: CheckupVerdict, weeks: number): string {
  switch (verdict) {
    case 'maintaining':
      return `Después de ${weeks} semanas, los cambios que lograste se mantienen firmes. Eso es evidencia de cambio real.`;
    case 'minor_fluctuation':
      return 'Hay algo de variación esta semana, pero es completamente normal. Los cambios a largo plazo no son lineales.';
    case 'gradual_decline':
      return 'Se ha perdido algo de terreno. Esto es una oportunidad para refrescar las estrategias que te funcionaron antes.';
    case 'significant_loss':
      return 'Ha habido una pérdida importante de las mejorías. No es un fracaso — es una señal de que necesitamos reforzar lo aprendido.';
    case 'full_relapse':
      return 'Los datos muestran una vuelta a los niveles iniciales. Las recaídas son parte del cambio conductual. Lo importante es que ya sabemos qué funciona — podemos reconstruir desde ahí.';
  }
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

// NOTA: computeMetric, isHigherBetter, filterByScope vienen de MetricEngine.ts
// Este archivo ya no implementa lógica de cálculo de métricas localmente

function formatMetric(metric: MetricType): string {
  const labels: Record<string, string> = {
    avoidance_rate: 'Tasa de evitación',
    completion_rate: 'Tasa de completación',
    completion_frequency: 'Frecuencia de completación',
    avoidance_frequency: 'Frecuencia de evitación',
    cascade_frequency: 'Cascadas de evitación',
    average_mood_post_task: 'Ánimo post-tarea',
    exposure_tolerance: 'Tolerancia a la tarea',
    days_active: 'Días activos',
    downsizing_rate: 'Uso de "algo más pequeño"',
  };
  return labels[metric] || metric;
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
