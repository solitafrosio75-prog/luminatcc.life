// @ts-nocheck
/**
 * PersonalAnalyticsService
 *
 * V18: Sistema de analytics personal para visualizar progreso,
 * patrones y efectividad de tÃ©cnicas TCC.
 *
 * Este servicio proporciona:
 * - MÃ©tricas de progreso semanal/mensual
 * - AnÃ¡lisis de tÃ©cnicas mÃ¡s efectivas
 * - Patrones temporales de uso
 * - EvoluciÃ³n de creencias (experimentos)
 * - Insights personalizados
 * - Reportes de progreso
 */

import {
  db,
  type TCCTechnique,
  type ThoughtEmotion,
  type MoodLevel,
  moodToNumber,
} from '../db/database';

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, format, isWithinInterval, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * PerÃ­odo de tiempo para anÃ¡lisis
 */
export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Resumen de actividad del perÃ­odo
 */
export interface ActivitySummary {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;

  // Contadores
  totalSessions: number;
  completedSessions: number;
  totalPoints: number;

  // Desglose por tÃ©cnica
  techniqueCounts: Record<TCCTechnique, number>;

  // Tiempo invertido (minutos)
  totalMinutes: number;

  // Racha
  currentStreak: number;
  longestStreak: number;

  // ComparaciÃ³n con perÃ­odo anterior
  comparison?: {
    sessionsChange: number;      // Porcentaje
    pointsChange: number;        // Porcentaje
    completionRateChange: number;// Puntos porcentuales
  };
}

/**
 * MÃ©tricas de efectividad
 */
export interface EffectivenessMetrics {
  // Por tÃ©cnica
  techniqueEffectiveness: Array<{
    technique: TCCTechnique;
    timesUsed: number;
    completionRate: number;       // 0-100
    avgMoodImprovement: number;   // -4 a +4
    avgUserRating: number;        // 1-5
    effectivenessScore: number;   // 0-100 calculado
  }>;

  // Por emociÃ³n
  emotionProgress: Array<{
    emotion: ThoughtEmotion;
    timesAddressed: number;
    avgMoodImprovement: number;
    mostEffectiveTechnique: TCCTechnique | null;
  }>;

  // Mejor tÃ©cnica general
  mostEffectiveTechnique: TCCTechnique | null;
  leastEffectiveTechnique: TCCTechnique | null;
}

/**
 * Patrones temporales
 */
export interface TemporalPatterns {
  // Por hora del dÃ­a
  hourlyActivity: Array<{
    hour: number;
    sessions: number;
    successRate: number;
    avgMoodImprovement: number;
  }>;

  // Por dÃ­a de la semana
  weekdayActivity: Array<{
    day: number;            // 0=domingo
    dayName: string;
    sessions: number;
    successRate: number;
  }>;

  // Mejores momentos
  peakHours: number[];
  peakDays: number[];

  // Momentos a evitar
  lowPerformanceHours: number[];
}

/**
 * Progreso de creencias (experimentos conductuales)
 */
export interface BeliefProgress {
  totalExperiments: number;
  completedExperiments: number;

  // Cambio promedio de creencia
  averageBeliefChange: number;

  // Creencias mÃ¡s trabajadas
  topBeliefs: Array<{
    belief: string;
    initialLevel: number;
    currentLevel: number;
    change: number;
    experimentsCount: number;
  }>;

  // Tipos de predicciÃ³n mÃ¡s comunes
  predictionTypeDistribution: Record<string, number>;
}

/**
 * Insight personalizado
 */
export interface PersonalInsight {
  id: string;
  type: 'achievement' | 'pattern' | 'recommendation' | 'warning' | 'celebration';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  emoji: string;
  actionLabel?: string;
  actionRoute?: string;
  data?: Record<string, unknown>;
}

/**
 * Reporte de progreso completo
 */
export interface ProgressReport {
  generatedAt: Date;
  period: AnalyticsPeriod;
  userId: string;

  summary: ActivitySummary;
  effectiveness: EffectivenessMetrics;
  temporalPatterns: TemporalPatterns;
  beliefProgress: BeliefProgress;
  insights: PersonalInsight[];

  // PuntuaciÃ³n general de bienestar (0-100)
  overallWellnessScore: number;

  // Tendencia (mejorando, estable, declinando)
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// FUNCIONES DE ANÃLISIS
// ============================================================================

/**
 * Obtiene el resumen de actividad para un perÃ­odo
 */
export async function getActivitySummary(
  userId: string,
  period: AnalyticsPeriod = 'week'
): Promise<ActivitySummary> {
  const { startDate, endDate } = getPeriodDates(period);
  const previousPeriod = getPreviousPeriodDates(period);

  // Obtener todos los logs de intervenciÃ³n
  const logs = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .and(log => {
      const logDate = new Date(log.timestamp);
      return isWithinInterval(logDate, { start: startDate, end: endDate });
    })
    .toArray();

  // Obtener logs del perÃ­odo anterior para comparaciÃ³n
  const previousLogs = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .and(log => {
      const logDate = new Date(log.timestamp);
      return isWithinInterval(logDate, { start: previousPeriod.startDate, end: previousPeriod.endDate });
    })
    .toArray();

  // Calcular contadores
  const totalSessions = logs.length;
  const completedSessions = logs.filter(l => l.completed).length;

  // Desglose por tÃ©cnica
  const techniqueCounts: Record<TCCTechnique, number> = {} as Record<TCCTechnique, number>;
  for (const log of logs) {
    techniqueCounts[log.technique] = (techniqueCounts[log.technique] || 0) + 1;
  }

  // Tiempo total (estimado basado en tÃ©cnica - 5 min promedio por sesiÃ³n)
  const totalMinutes = logs.length * 5;

  // Puntos totales (estimado: 10 puntos por sesiÃ³n completada, 3 por intentada)
  const totalPoints = logs.reduce((sum, log) => sum + (log.completed ? 10 : 3), 0);

  // Obtener racha
  const userProgress = await db.userProgress.get(userId);
  const currentStreak = userProgress?.currentStreak || 0;
  const longestStreak = userProgress?.longestStreak || 0;

  // Calcular comparaciÃ³n
  const previousTotal = previousLogs.length;
  const previousCompleted = previousLogs.filter(l => l.completed).length;
  const previousPoints = previousLogs.reduce((sum, log) => sum + (log.completed ? 10 : 3), 0);

  const comparison = previousTotal > 0 ? {
    sessionsChange: ((totalSessions - previousTotal) / previousTotal) * 100,
    pointsChange: previousPoints > 0 ? ((totalPoints - previousPoints) / previousPoints) * 100 : 100,
    completionRateChange: previousTotal > 0
      ? (completedSessions / totalSessions * 100) - (previousCompleted / previousTotal * 100)
      : 0,
  } : undefined;

  return {
    period,
    startDate,
    endDate,
    totalSessions,
    completedSessions,
    totalPoints,
    techniqueCounts,
    totalMinutes,
    currentStreak,
    longestStreak,
    comparison,
  };
}

/**
 * Obtiene mÃ©tricas de efectividad
 */
export async function getEffectivenessMetrics(
  userId: string,
  period: AnalyticsPeriod = 'month'
): Promise<EffectivenessMetrics> {
  const { startDate, endDate } = getPeriodDates(period);

  // Obtener effectiveness profiles
  const effectivenessRecords = await db.userTechniqueEffectiveness
    .where('userId')
    .equals(userId)
    .toArray();

  // Calcular efectividad por tÃ©cnica
  const techniqueEffectiveness = effectivenessRecords
    .filter(e => e.timesUsed > 0)
    .map(e => ({
      technique: e.technique,
      timesUsed: e.timesUsed,
      completionRate: e.timesUsed > 0 ? (e.timesCompleted / e.timesUsed) * 100 : 0,
      avgMoodImprovement: e.avgMoodImprovement,
      avgUserRating: e.avgUserRating,
      effectivenessScore: e.recommendationScore,
    }))
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore);

  // Obtener ThoughtRecords para anÃ¡lisis por emociÃ³n
  const thoughtRecords = await db.thoughtRecords
    .where('userId')
    .equals(userId)
    .and(record => {
      const recordDate = new Date(record.timestamp);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    })
    .toArray();

  // Agrupar por emociÃ³n usando ThoughtRecords
  const emotionGroups: Record<string, { count: number; moodImprovements: number[]; techniques: Record<string, number> }> = {};

  for (const record of thoughtRecords) {
    if (!record.emotion) continue;

    if (!emotionGroups[record.emotion]) {
      emotionGroups[record.emotion] = { count: 0, moodImprovements: [], techniques: {} };
    }

    emotionGroups[record.emotion].count++;

    // Los ThoughtRecords son reestructuraciÃ³n cognitiva
    if (record.status === 'reframed') {
      emotionGroups[record.emotion].techniques['cognitive_restructuring'] =
        (emotionGroups[record.emotion].techniques['cognitive_restructuring'] || 0) + 1;

      // Estimar mejora basada en el proceso completado
      emotionGroups[record.emotion].moodImprovements.push(1); // +1 por sesiÃ³n completada
    }
  }

  const emotionProgress = Object.entries(emotionGroups).map(([emotion, data]) => {
    const avgImprovement = data.moodImprovements.length > 0
      ? data.moodImprovements.reduce((a, b) => a + b, 0) / data.moodImprovements.length
      : 0;

    const mostEffective = Object.entries(data.techniques)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as TCCTechnique || null;

    return {
      emotion: emotion as ThoughtEmotion,
      timesAddressed: data.count,
      avgMoodImprovement: avgImprovement,
      mostEffectiveTechnique: mostEffective,
    };
  });

  return {
    techniqueEffectiveness,
    emotionProgress,
    mostEffectiveTechnique: techniqueEffectiveness[0]?.technique || null,
    leastEffectiveTechnique: techniqueEffectiveness[techniqueEffectiveness.length - 1]?.technique || null,
  };
}

/**
 * Obtiene patrones temporales
 */
export async function getTemporalPatterns(
  userId: string,
  period: AnalyticsPeriod = 'month'
): Promise<TemporalPatterns> {
  const { startDate, endDate } = getPeriodDates(period);

  const logs = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .and(log => {
      const logDate = new Date(log.timestamp);
      return isWithinInterval(logDate, { start: startDate, end: endDate });
    })
    .toArray();

  // Agrupar por hora
  const hourlyData: Record<number, { total: number; completed: number; moodImprovements: number[] }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { total: 0, completed: 0, moodImprovements: [] };
  }

  // Agrupar por dÃ­a de la semana
  const weekdayData: Record<number, { total: number; completed: number }> = {};
  for (let d = 0; d < 7; d++) {
    weekdayData[d] = { total: 0, completed: 0 };
  }

  for (const log of logs) {
    const date = new Date(log.timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    hourlyData[hour].total++;
    weekdayData[day].total++;

    if (log.completed) {
      hourlyData[hour].completed++;
      weekdayData[day].completed++;

      if (log.moodBefore && log.moodAfter) {
        const improvement = moodToNumber(log.moodAfter) - moodToNumber(log.moodBefore);
        hourlyData[hour].moodImprovements.push(improvement);
      }
    }
  }

  // Formatear datos horarios
  const hourlyActivity = Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    sessions: data.total,
    successRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    avgMoodImprovement: data.moodImprovements.length > 0
      ? data.moodImprovements.reduce((a, b) => a + b, 0) / data.moodImprovements.length
      : 0,
  }));

  // Formatear datos por dÃ­a
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'MiÃ©rcoles', 'Jueves', 'Viernes', 'SÃ¡bado'];
  const weekdayActivity = Object.entries(weekdayData).map(([day, data]) => ({
    day: parseInt(day),
    dayName: dayNames[parseInt(day)],
    sessions: data.total,
    successRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
  }));

  // Encontrar picos
  const peakHours = hourlyActivity
    .filter(h => h.sessions >= 3 && h.successRate > 60)
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 3)
    .map(h => h.hour);

  const peakDays = weekdayActivity
    .filter(d => d.sessions >= 2 && d.successRate > 50)
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 3)
    .map(d => d.day);

  // Horas de bajo rendimiento
  const lowPerformanceHours = hourlyActivity
    .filter(h => h.sessions >= 2 && h.successRate < 40)
    .map(h => h.hour);

  return {
    hourlyActivity,
    weekdayActivity,
    peakHours,
    peakDays,
    lowPerformanceHours,
  };
}

/**
 * Obtiene el progreso en creencias (experimentos conductuales)
 */
export async function getBeliefProgress(userId: string): Promise<BeliefProgress> {
  const experiments = await db.behavioralExperiments
    .where('userId')
    .equals(userId)
    .toArray();

  const completed = experiments.filter(e => e.status === 'completed');

  // Cambio promedio
  const beliefChanges = completed
    .filter(e => e.beliefChange !== undefined)
    .map(e => Math.abs(e.beliefChange!));

  const averageBeliefChange = beliefChanges.length > 0
    ? beliefChanges.reduce((a, b) => a + b, 0) / beliefChanges.length
    : 0;

  // Obtener historiales de creencias
  const beliefHistories = await db.beliefTrackingHistory
    .where('userId')
    .equals(userId)
    .toArray();

  const topBeliefs = beliefHistories
    .map(h => ({
      belief: h.beliefText,
      initialLevel: h.history[0]?.level || 50,
      currentLevel: h.currentLevel,
      change: h.totalChange,
      experimentsCount: h.experimentIds.length,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  // DistribuciÃ³n de tipos de predicciÃ³n
  const predictionTypeDistribution: Record<string, number> = {};
  for (const exp of experiments) {
    predictionTypeDistribution[exp.predictionType] =
      (predictionTypeDistribution[exp.predictionType] || 0) + 1;
  }

  return {
    totalExperiments: experiments.length,
    completedExperiments: completed.length,
    averageBeliefChange,
    topBeliefs,
    predictionTypeDistribution,
  };
}

/**
 * Genera insights personalizados
 */
export async function generateInsights(
  userId: string,
  summary: ActivitySummary,
  effectiveness: EffectivenessMetrics,
  patterns: TemporalPatterns
): Promise<PersonalInsight[]> {
  const insights: PersonalInsight[] = [];

  // 1. Insight de racha
  if (summary.currentStreak >= 7) {
    insights.push({
      id: 'streak_7',
      type: 'celebration',
      priority: 'high',
      title: 'Â¡Una semana seguida!',
      description: `Llevas ${summary.currentStreak} dÃ­as consecutivos cuidando de tu bienestar. Â¡Eso es admirable!`,
      emoji: 'ðŸ”¥',
    });
  } else if (summary.currentStreak >= 3) {
    insights.push({
      id: 'streak_3',
      type: 'achievement',
      priority: 'medium',
      title: 'Racha en crecimiento',
      description: `${summary.currentStreak} dÃ­as seguidos. Â¡Sigue asÃ­!`,
      emoji: 'â­',
    });
  }

  // 2. Insight de tÃ©cnica mÃ¡s efectiva
  if (effectiveness.mostEffectiveTechnique) {
    const topTech = effectiveness.techniqueEffectiveness[0];
    if (topTech && topTech.avgMoodImprovement > 0.5) {
      insights.push({
        id: 'top_technique',
        type: 'pattern',
        priority: 'medium',
        title: `Tu tÃ©cnica estrella`,
        description: `${getTechniqueName(topTech.technique)} te ha funcionado especialmente bien, con un promedio de +${topTech.avgMoodImprovement.toFixed(1)} en tu estado de Ã¡nimo.`,
        emoji: 'ðŸ’«',
        actionLabel: 'Practicar',
        actionRoute: `/technique/${topTech.technique}`,
      });
    }
  }

  // 3. Insight de hora Ã³ptima
  if (patterns.peakHours.length > 0) {
    const bestHour = patterns.peakHours[0];
    insights.push({
      id: 'peak_hour',
      type: 'pattern',
      priority: 'low',
      title: 'Tu mejor momento',
      description: `Las ${bestHour}:00 parece ser tu hora mÃ¡s productiva. Considera programar actividades importantes a esa hora.`,
      emoji: 'â°',
    });
  }

  // 4. Insight de mejora comparativa
  if (summary.comparison) {
    if (summary.comparison.sessionsChange > 20) {
      insights.push({
        id: 'sessions_increase',
        type: 'celebration',
        priority: 'medium',
        title: 'Â¡MÃ¡s activo que antes!',
        description: `Has aumentado tu actividad un ${Math.round(summary.comparison.sessionsChange)}% respecto al perÃ­odo anterior.`,
        emoji: 'ðŸ“ˆ',
      });
    } else if (summary.comparison.sessionsChange < -30) {
      insights.push({
        id: 'sessions_decrease',
        type: 'recommendation',
        priority: 'medium',
        title: 'Retomemos el ritmo',
        description: 'Tu actividad ha bajado Ãºltimamente. Â¿QuÃ© tal empezar con una micro-sesiÃ³n de 1 minuto?',
        emoji: 'ðŸ’ª',
        actionLabel: 'Micro-sesiÃ³n',
        actionRoute: '/micro-session',
      });
    }
  }

  // 5. Insight de emociÃ³n mÃ¡s trabajada
  if (effectiveness.emotionProgress.length > 0) {
    const topEmotion = effectiveness.emotionProgress[0];
    if (topEmotion.timesAddressed >= 5) {
      insights.push({
        id: 'top_emotion',
        type: 'pattern',
        priority: 'low',
        title: 'Trabajando con tu emociÃ³n',
        description: `Has abordado la ${getEmotionName(topEmotion.emotion)} ${topEmotion.timesAddressed} veces. ${topEmotion.avgMoodImprovement > 0 ? 'Â¡Y con buenos resultados!' : 'Sigue explorando lo que funciona para ti.'}`,
        emoji: 'ðŸŽ¯',
      });
    }
  }

  // 6. Insight de puntos
  if (summary.totalPoints >= 100) {
    insights.push({
      id: 'points_milestone',
      type: 'celebration',
      priority: 'low',
      title: 'Â¡100+ puntos!',
      description: `Has acumulado ${summary.totalPoints} puntos este perÃ­odo. Â¡Tu esfuerzo suma!`,
      emoji: 'ðŸ†',
    });
  }

  // Ordenar por prioridad
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

/**
 * Genera un reporte de progreso completo
 */
export async function generateProgressReport(
  userId: string,
  period: AnalyticsPeriod = 'week'
): Promise<ProgressReport> {
  const [summary, effectiveness, patterns, beliefProgress] = await Promise.all([
    getActivitySummary(userId, period),
    getEffectivenessMetrics(userId, period),
    getTemporalPatterns(userId, period),
    getBeliefProgress(userId),
  ]);

  const insights = await generateInsights(userId, summary, effectiveness, patterns);

  // Calcular wellness score (0-100)
  const overallWellnessScore = calculateWellnessScore(summary, effectiveness);

  // Determinar tendencia
  const trend = determineTrend(summary);

  return {
    generatedAt: new Date(),
    period,
    userId,
    summary,
    effectiveness,
    temporalPatterns: patterns,
    beliefProgress,
    insights,
    overallWellnessScore,
    trend,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getPeriodDates(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (period) {
    case 'week':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case 'quarter':
      return {
        startDate: subDays(now, 90),
        endDate: now,
      };
    case 'year':
      return {
        startDate: subDays(now, 365),
        endDate: now,
      };
    case 'all':
      return {
        startDate: new Date(2020, 0, 1),
        endDate: now,
      };
  }
}

function getPreviousPeriodDates(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
  const current = getPeriodDates(period);
  const duration = differenceInDays(current.endDate, current.startDate);

  return {
    startDate: subDays(current.startDate, duration + 1),
    endDate: subDays(current.startDate, 1),
  };
}

function calculateWellnessScore(
  summary: ActivitySummary,
  effectiveness: EffectivenessMetrics
): number {
  let score = 50; // Base

  // Factor de actividad (+0 a +20)
  const activityScore = Math.min(summary.totalSessions * 2, 20);
  score += activityScore;

  // Factor de completitud (+0 a +15)
  const completionRate = summary.totalSessions > 0
    ? summary.completedSessions / summary.totalSessions
    : 0;
  score += completionRate * 15;

  // Factor de racha (+0 a +10)
  const streakScore = Math.min(summary.currentStreak * 2, 10);
  score += streakScore;

  // Factor de efectividad (+0 a +5)
  if (effectiveness.techniqueEffectiveness.length > 0) {
    const avgEffectiveness = effectiveness.techniqueEffectiveness
      .reduce((sum, t) => sum + t.effectivenessScore, 0) / effectiveness.techniqueEffectiveness.length;
    score += (avgEffectiveness / 100) * 5;
  }

  return Math.min(Math.round(score), 100);
}

function determineTrend(summary: ActivitySummary): 'improving' | 'stable' | 'declining' {
  if (!summary.comparison) return 'stable';

  const { sessionsChange, completionRateChange } = summary.comparison;

  if (sessionsChange > 10 && completionRateChange >= 0) return 'improving';
  if (sessionsChange < -10 || completionRateChange < -10) return 'declining';
  return 'stable';
}

function getTechniqueName(technique: TCCTechnique): string {
  const names: Record<TCCTechnique, string> = {
    behavioral_activation: 'ActivaciÃ³n Conductual',
    gradual_exposure: 'ExposiciÃ³n Gradual',
    cognitive_restructuring: 'Detective de Pensamientos',
    activity_scheduling: 'PlanificaciÃ³n de Actividades',
    functional_analysis: 'AnÃ¡lisis ABC',
    micro_tasks: 'Micro-tareas',
    momentum_building: 'Construir Momentum',
    self_compassion: 'AutocompasiÃ³n',
    problem_solving: 'ResoluciÃ³n de Problemas',
    relaxation: 'RelajaciÃ³n',
  };
  return names[technique] || technique;
}

function getEmotionName(emotion: ThoughtEmotion): string {
  const names: Record<ThoughtEmotion, string> = {
    anxious: 'ansiedad',
    sad: 'tristeza',
    frustrated: 'frustraciÃ³n',
    guilty: 'culpa',
    overwhelmed: 'agobio',
    angry: 'enojo',
    hopeless: 'desesperanza',
    ashamed: 'vergÃ¼enza',
  };
  return names[emotion] || emotion;
}

// ============================================================================
// FUNCIONES DE EXPORTACIÃ“N DE DATOS
// ============================================================================

/**
 * Exporta el reporte en formato texto plano
 */
export function exportReportAsText(report: ProgressReport): string {
  const lines: string[] = [];

  lines.push('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  lines.push('         REPORTE DE PROGRESO PERSONAL       ');
  lines.push('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  lines.push('');
  lines.push(`Generado: ${format(report.generatedAt, "d 'de' MMMM 'de' yyyy", { locale: es })}`);
  lines.push(`PerÃ­odo: ${report.period}`);
  lines.push('');

  lines.push('ðŸ“Š RESUMEN DE ACTIVIDAD');
  lines.push('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  lines.push(`â€¢ Sesiones totales: ${report.summary.totalSessions}`);
  lines.push(`â€¢ Completadas: ${report.summary.completedSessions}`);
  lines.push(`â€¢ Puntos ganados: ${report.summary.totalPoints}`);
  lines.push(`â€¢ Tiempo invertido: ${report.summary.totalMinutes} minutos`);
  lines.push(`â€¢ Racha actual: ${report.summary.currentStreak} dÃ­as`);
  lines.push('');

  lines.push('ðŸŽ¯ TÃ‰CNICAS MÃS EFECTIVAS');
  lines.push('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  for (const tech of report.effectiveness.techniqueEffectiveness.slice(0, 3)) {
    lines.push(`â€¢ ${getTechniqueName(tech.technique)}: ${tech.effectivenessScore}/100`);
  }
  lines.push('');

  lines.push('ðŸ’¡ INSIGHTS PERSONALIZADOS');
  lines.push('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  for (const insight of report.insights.slice(0, 5)) {
    lines.push(`${insight.emoji} ${insight.title}`);
    lines.push(`   ${insight.description}`);
    lines.push('');
  }

  lines.push('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  lines.push(`PuntuaciÃ³n de Bienestar: ${report.overallWellnessScore}/100`);
  lines.push(`Tendencia: ${report.trend === 'improving' ? 'ðŸ“ˆ Mejorando' : report.trend === 'declining' ? 'ðŸ“‰ Declinando' : 'âž¡ï¸ Estable'}`);
  lines.push('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

  return lines.join('\n');
}

/**
 * Obtiene un resumen rÃ¡pido para mostrar en el dashboard
 */
export async function getQuickDashboardStats(userId: string): Promise<{
  todayPoints: number;
  weeklyPoints: number;
  weeklyGoal: number;
  weeklyProgress: number;
  currentStreak: number;
  lastActivity: string | null;
  topTechnique: TCCTechnique | null;
  wellnessScore: number;
}> {
  const userProgress = await db.userProgress.get(userId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Puntos de hoy
  const todayLogs = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .and(log => new Date(log.timestamp) >= todayStart)
    .toArray();

  const todayPoints = todayLogs.reduce((sum, log) => sum + (log.completed ? 10 : 3), 0);

  // Ãšltima actividad
  const lastLog = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .last();

  const lastActivity = lastLog
    ? format(new Date(lastLog.timestamp), "d 'de' MMMM, HH:mm", { locale: es })
    : null;

  // TÃ©cnica mÃ¡s usada
  const effectiveness = await getEffectivenessMetrics(userId, 'month');

  // Wellness score rÃ¡pido
  const summary = await getActivitySummary(userId, 'week');
  const wellnessScore = calculateWellnessScore(summary, effectiveness);

  return {
    todayPoints,
    weeklyPoints: userProgress?.weeklyPoints || 0,
    weeklyGoal: userProgress?.weeklyGoal || 100,
    weeklyProgress: userProgress?.weeklyGoal
      ? Math.min((userProgress.weeklyPoints / userProgress.weeklyGoal) * 100, 100)
      : 0,
    currentStreak: userProgress?.currentStreak || 0,
    lastActivity,
    topTechnique: effectiveness.mostEffectiveTechnique,
    wellnessScore,
  };
}
