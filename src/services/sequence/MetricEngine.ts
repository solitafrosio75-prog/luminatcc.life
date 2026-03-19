// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════
// MetricEngine.ts — Motor Único de Computación de Métricas
// ═══════════════════════════════════════════════════════════════════
//
// Consolidación de la lógica de cálculo de métricas que estaba
// duplicada en 4 archivos diferentes:
// - InterventionPlanEvaluator.ts
// - BaselineCollector.ts
// - ChangeEvaluator.ts
// - FollowUpMonitor.ts
//
// A continuación hay UNA fuente de verdad para:
// 1. Cálculo de valores métricos (computeMetric)
// 2. Filtrado por scope (filterByScope)
// 3. Dirección de mejora (isHigherBetter)
//
// Todos los archivos deben importar de aquí.
//
// ═══════════════════════════════════════════════════════════════════

import type { FunctionalSequence, SequenceConsequence } from './sequenceTypes';
import { moodToNumber } from '../../db/database';
function getMoodPair(consequence: SequenceConsequence): { before?: number; after?: number } | null {
  const immediate = consequence.immediate;
  if (!immediate || typeof immediate !== 'object') return null;

  const details = immediate as {
    moodBefore?: number;
    moodAfter?: number;
    emotionalChange?: { from?: Parameters<typeof moodToNumber>[0]; to?: Parameters<typeof moodToNumber>[0] };
  };

  const before = typeof details.moodBefore === 'number'
    ? details.moodBefore
    : details.emotionalChange?.from
      ? moodToNumber(details.emotionalChange.from)
      : undefined;

  const after = typeof details.moodAfter === 'number'
    ? details.moodAfter
    : details.emotionalChange?.to
      ? moodToNumber(details.emotionalChange.to)
      : undefined;

  if (before === undefined && after === undefined) return null;
  return { before, after };
}
import type { MetricType, MetricScope } from './interventionPlanTypes';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface MetricComputeOptions {
  /** Granularidad: 'daily' retorna valor del día, 'weekly' retorna frecuencia/semana */
  granularity?: 'daily' | 'weekly';

  /** Para weekly: número de días a promediar (default: 7) */
  periodDays?: number;

  /** Período de corte para filtrar secuencias antiguas */
  cutoffDate?: Date;
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: computeMetric
// ─────────────────────────────────────────────

/**
 * Calcula el valor de una métrica específica desde secuencias funcionales.
 *
 * Maneja ambas granularidades (diaria y semanal) y normaliza las unidades.
 * Esta es la ÚNICA función que debería usarse para computación de métricas.
 *
 * @param metric Tipo de métrica a calcular
 * @param sequences Secuencias funcionales a analizar
 * @param options Opciones de cálculo (granularidad, período, etc.)
 * @returns Valor numérico de la métrica (NaN si no hay datos)
 */
export function computeMetric(
  metric: MetricType,
  sequences: FunctionalSequence[],
  options: MetricComputeOptions = {}
): number {
  const { granularity = 'daily', periodDays = 7, cutoffDate } = options;

  if (sequences.length === 0) return NaN;

  // Filtrar secuencias por fecha si se proporciona cutoff
  let filtered = sequences;
  if (cutoffDate) {
    filtered = sequences.filter(s => s.timestamp >= cutoffDate);
  }

  if (filtered.length === 0) return NaN;

  if (granularity === 'daily') {
    return computeMetricDaily(metric, filtered);
  } else {
    // weekly: promediar los valores diarios
    return computeMetricWeekly(metric, filtered, periodDays);
  }
}

/**
 * Calcula valor de una métrica para UN DÍA (agregado de todas las secuencias ese día).
 * Se usa en BaselineCollector, ChangeEvaluator cuando se agrega por día.
 * @private
 */
function computeMetricDaily(metric: MetricType, sequences: FunctionalSequence[]): number {
  const total = sequences.length;
  if (total === 0) return NaN;

  const problems = sequences.filter(s => s.behavior.valence === 'problem').length;
  const targets = sequences.filter(s => s.behavior.valence === 'target').length;

  switch (metric) {
    case 'avoidance_rate':
      return (problems / total) * 100;

    case 'completion_rate':
      return (targets / total) * 100;

    case 'completion_frequency':
      // Retorna recuento absoluto (será el usuario el que decida si promediar en semanas)
      return targets;

    case 'avoidance_frequency':
      return problems;

    case 'cascade_frequency': {
      const cascades = sequences.filter(s => s.consequence.shortTerm?.cascadeEffect).length;
      return total > 0 ? (cascades / total) * 100 : 0;
    }

    case 'average_mood_post_task': {
      const moods = sequences
        .map(s => getMoodPair(s.consequence))
        .filter((pair): pair is { before?: number; after: number } => typeof pair?.after === 'number')
        .map(pair => pair.after);
      return moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : NaN;
    }

    case 'mood_improvement': {
      const pairs = sequences
        .map(s => getMoodPair(s.consequence))
        .filter((pair): pair is { before: number; after: number } =>
          typeof pair?.before === 'number' && typeof pair?.after === 'number'
        );

      if (pairs.length === 0) return NaN;

      const avgBefore = pairs.reduce((a, b) => a + b.before, 0) / pairs.length;
      const avgAfter = pairs.reduce((a, b) => a + b.after, 0) / pairs.length;

      return avgAfter - avgBefore;
    }

    case 'exposure_tolerance': {
      const durations = sequences
        .filter(s => s.behavior.topography?.duration)
        .map(s => s.behavior.topography!.duration!);
      return durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : NaN;
    }

    case 'days_active':
      return targets > 0 ? 1 : 0; // Binario: 1 si hubo actividad, 0 sino

    case 'technique_usage': {
      // Contar secuencias con fuente de tecnica o practica guiada
      const withTechnique = sequences.filter(s =>
        s.source.type === 'thought_record' || s.source.type === 'exposure_attempt'
      ).length;
      return (withTechnique / total) * 100;
    }

    case 'technique_effectiveness': {
      // Mejora de mood en secuencias con técnica
      const withTechnique = sequences.filter(s =>
        s.source.type === 'thought_record' || s.source.type === 'exposure_attempt'
      );
      if (withTechnique.length === 0) return NaN;

      const improvements = withTechnique
        .map(s => getMoodPair(s.consequence))
        .filter((pair): pair is { before: number; after: number } =>
          typeof pair?.before === 'number' && typeof pair?.after === 'number'
        )
        .map(pair => pair.after - pair.before);

      return improvements.length > 0
        ? improvements.reduce((a, b) => a + b, 0) / improvements.length
        : NaN;
    }

    case 'cognitive_reframe_success': {
      // Secuencias con reframe cognitivo exitoso (moodAfter > moodBefore)
      const withReframe = sequences.filter(s => s.source.type === 'thought_record');
      if (withReframe.length === 0) return NaN;

      const successful = withReframe.filter(
        (s) => {
          const pair = getMoodPair(s.consequence);
          return typeof pair?.before === 'number' && typeof pair?.after === 'number'
            ? pair.after > pair.before
            : false;
        }
      ).length;

      return (successful / withReframe.length) * 100;
    }

    case 'downsizing_rate': {
      const downsized = sequences.filter(s => s.source.type === 'task_downsized').length;
      return total > 0 ? (downsized / total) * 100 : 0;
    }

    case 'chain_strength':
      // Placeholder: requiere análisis de red más complejo
      return NaN;

    default:
      return NaN;
  }
}

/**
 * Calcula valor de una métrica para UN PERÍODO (promedio semanal).
 * Agregación: calcula valores diarios y luego los promedia/suma según la métrica.
 * @private
 */
function computeMetricWeekly(
  metric: MetricType,
  sequences: FunctionalSequence[],
  periodDays: number
): number {
  // Agrupar por día
  const dayMap = new Map<string, FunctionalSequence[]>();

  for (const seq of sequences) {
    const dateStr = seq.timestamp.toISOString().substring(0, 10);
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, []);
    }
    dayMap.get(dateStr)!.push(seq);
  }

  const dailyValues: number[] = [];

  for (const [, daySequences] of dayMap.entries()) {
    const value = computeMetricDaily(metric, daySequences);
    if (!isNaN(value)) {
      dailyValues.push(value);
    }
  }

  if (dailyValues.length === 0) return NaN;

  // Diferentes métricas se "promedian" de diferentes formas
  // Las de frecuencia se SUMAN (porque es count_per_week)
  // Las de rate se promedian (porque es porcentaje)

  switch (metric) {
    case 'completion_frequency':
    case 'avoidance_frequency':
      // Suma: si hay 2 completaciones el lunes y 3 el martes, en la semana hay 5
      return dailyValues.reduce((a, b) => a + b, 0);

    case 'days_active':
      // Suma: cuántos días hubo actividad
      return dailyValues.reduce((a, b) => a + b, 0);

    case 'avoidance_rate':
    case 'completion_rate':
    case 'cascade_frequency':
    case 'technique_usage':
    case 'technique_effectiveness':
    case 'cognitive_reframe_success':
    case 'downsizing_rate':
      // Promedio: son porcentajes, no suman
      return dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;

    case 'average_mood_post_task':
    case 'mood_improvement':
    case 'exposure_tolerance':
      // Promedio: son valores continuos
      return dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;

    default:
      return NaN;
  }
}

// ─────────────────────────────────────────────
// FUNCIÓN: filterByScope
// ─────────────────────────────────────────────

/**
 * Filtra secuencias que coinciden con el scope especificado.
 * ÚNICA IMPLEMENTACIÓN — elimina 4 copias del código original.
 *
 * @param sequences Todas las secuencias
 * @param scope Filtros a aplicar (taskCategory, room, behaviorType, chainId)
 * @returns Secuencias que cumplen el scope
 */
export function filterByScope(
  sequences: FunctionalSequence[],
  scope: MetricScope
): FunctionalSequence[] {
  return sequences.filter(s => {
    // Filtro por categoría de tarea
    if (scope.taskCategory && s.behavior.context?.taskCategory !== scope.taskCategory) {
      return false;
    }

    // Filtro por habitación
    if (scope.room && s.behavior.context?.taskRoom !== scope.room) {
      return false;
    }

    // Filtro por tipo de comportamiento
    if (scope.behaviorType && s.behavior.type !== scope.behaviorType) {
      return false;
    }

    // NUEVO: Filtro por ID de cadena funcional
    const sourceChainId = (s.source as { sourceChainId?: number }).sourceChainId;
    if (scope.chainId && sourceChainId !== scope.chainId) {
      return false;
    }

    return true;
  });
}

// ─────────────────────────────────────────────
// FUNCIÓN: isHigherBetter
// ─────────────────────────────────────────────

/**
 * Determina la dirección de mejora de una métrica.
 * ÚNICA IMPLEMENTACIÓN — elimina 2 copias del código original.
 *
 * @param metric Tipo de métrica
 * @returns true si valores más altos = mejora, false si valores más bajos = mejora
 */
export function isHigherBetter(metric: MetricType): boolean {
  switch (metric) {
    // Métricas donde MAYOR es MEJOR
    case 'completion_rate':
    case 'completion_frequency':
    case 'average_mood_post_task':
    case 'mood_improvement':
    case 'technique_usage':
    case 'technique_effectiveness':
    case 'exposure_tolerance':
    case 'cognitive_reframe_success':
    case 'days_active':
      return true;

    // Métricas donde MENOR es MEJOR
    case 'avoidance_rate':
    case 'avoidance_frequency':
    case 'cascade_frequency':
    case 'chain_strength':
    case 'downsizing_rate':
      return false;

    // Default: conservative, asume que mayor es mejor
    // (se puede ajustar o generar warning)
    default:
      return true;
  }
}

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

/**
 * Calcula la desviación estándar de un array de números.
 * Se usa en estadísticos descriptivos.
 */
export function calculateStandardDeviation(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (n - 1));
}

/**
 * Calcula el coeficiente de variación (DE / media).
 * Indicador de estabilidad: CV < 0.30 = estable, CV > 0.30 = variable.
 */
export function calculateCoefficientOfVariation(values: number[]): number {
  const validValues = values.filter(v => !isNaN(v) && v !== 0);
  if (validValues.length < 2) return NaN;

  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  if (mean === 0) return NaN;

  const sd = calculateStandardDeviation(validValues);
  return sd / Math.abs(mean);
}

/**
 * Redondea un número a X decimales.
 */
export function roundTo(value: number, decimals: number): number {
  if (isNaN(value)) return NaN;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
