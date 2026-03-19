import type { MetricType } from './interventionPlanTypes';
import type { BaselineSnapshotDB } from '../../db/database';
import { db } from '../../db/database';
import { DEFAULT_FUNCTIONAL_NORMS, type FunctionalNorms } from './ChangeEvaluator';

export interface FunctionalNormsOptions {
  minSamplesPerMetric?: number;
  minDataPoints?: number;
  minValidityScore?: number;
  maxSnapshots?: number;
}

interface MetricAggregate {
  values: number[];
  fallbackStdDev?: number;
}

/**
 * Calcula normas funcionales desde baselineSnapshots reales.
 * Devuelve solo las metricas con suficientes muestras.
 */
export async function computeFunctionalNormsFromBaselines(
  options: FunctionalNormsOptions = {}
): Promise<FunctionalNorms> {
  const {
    minSamplesPerMetric = 12,
    minDataPoints = 5,
    minValidityScore = 0.7,
    maxSnapshots,
  } = options;

  const rawSnapshots = await getUsableBaselines();
  const snapshots = trimSnapshots(rawSnapshots, maxSnapshots);

  const aggregates = new Map<MetricType, MetricAggregate>();

  for (const snapshot of snapshots) {
    for (const [metricKey, metricSnapshot] of Object.entries(snapshot.metricsData)) {
      const metric = metricKey as MetricType;
      if (!metricSnapshot || metricSnapshot.dataPoints < minDataPoints) continue;

      const entry = aggregates.get(metric) ?? { values: [] };
      entry.values.push(metricSnapshot.mean);
      entry.fallbackStdDev = metricSnapshot.stdDev;
      aggregates.set(metric, entry);
    }
  }

  const norms: FunctionalNorms = {};

  for (const [metric, aggregate] of aggregates.entries()) {
    if (aggregate.values.length < minSamplesPerMetric) continue;

    const mean = aggregate.values.reduce((sum, value) => sum + value, 0) / aggregate.values.length;
    const sd = calculateStdDev(aggregate.values, mean, aggregate.fallbackStdDev);

    norms[metric] = {
      mean: round(mean, 2),
      sd: round(sd, 2),
    };
  }

  if (Object.keys(norms).length === 0) return {};

  return norms;

  async function getUsableBaselines(): Promise<BaselineSnapshotDB[]> {
    const all = await db.baselineSnapshots.toArray();
    return all.filter((snapshot) => {
      const valid = snapshot.validityData?.isValid ?? false;
      const scoreOk = (snapshot.validityData?.dataQualityScore ?? 0) >= minValidityScore * 100;
      return snapshot.usableForClinicalSignificance && valid && scoreOk;
    });
  }
}

/**
 * Devuelve normas funcionales combinando defaults con datos reales.
 */
export async function resolveFunctionalNorms(
  options: FunctionalNormsOptions = {}
): Promise<FunctionalNorms> {
  const derived = await computeFunctionalNormsFromBaselines(options);
  return {
    ...DEFAULT_FUNCTIONAL_NORMS,
    ...derived,
  };
}

function trimSnapshots(
  snapshots: BaselineSnapshotDB[],
  maxSnapshots?: number
): BaselineSnapshotDB[] {
  if (!maxSnapshots || snapshots.length <= maxSnapshots) return snapshots;

  return [...snapshots]
    .sort((a, b) => new Date(b.frozenAt).getTime() - new Date(a.frozenAt).getTime())
    .slice(0, maxSnapshots);
}

function calculateStdDev(values: number[], mean: number, fallback?: number): number {
  if (values.length < 2) return fallback ?? 0;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
