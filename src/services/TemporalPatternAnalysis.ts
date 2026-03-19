// @ts-nocheck
/**
 * Sistema de ContextualizaciÃ³n Temporal
 *
 * Analiza patrones de comportamiento, emociones y efectividad de tÃ©cnicas
 * segÃºn el momento del dÃ­a, dÃ­a de la semana y otros factores temporales.
 *
 * Responde preguntas como:
 * - Â¿El usuario procrastina mÃ¡s por las noches?
 * - Â¿La ansiedad es peor en las maÃ±anas?
 * - Â¿QuÃ© tÃ©cnicas funcionan mejor en cada momento?
 */

import {
  db,
  TimeSlot,
  TIME_SLOT_RANGES,
  TCCTechnique,
  MoodLevel,
  EnergyLevel,
  TCCInterventionLog,
  BehavioralActivationLog,
  ThoughtEmotion,
  CognitivePattern,
} from '../db/database';

// ============================================================================
// TIPOS
// ============================================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type DayType = 'weekday' | 'weekend';

export interface TemporalContext {
  timeSlot: TimeSlot;
  dayOfWeek: DayOfWeek;
  dayType: DayType;
  hour: number;
}

export interface TimeSlotStats {
  timeSlot: TimeSlot;

  // Emociones predominantes
  dominantEmotions: Array<{ emotion: ThoughtEmotion; frequency: number }>;
  avgMood: number;  // 1-5
  avgEnergy: number; // 1-4

  // Barreras frecuentes
  commonBarriers: Array<{ barrierId: string; frequency: number }>;

  // Comportamientos
  procrastinationRate: number;  // 0-1
  avoidanceRate: number;        // 0-1
  taskCompletionRate: number;   // 0-1

  // Patrones cognitivos
  commonPatterns: Array<{ pattern: CognitivePattern; frequency: number }>;

  // TÃ©cnicas
  techniqueEffectiveness: Record<TCCTechnique, {
    timesUsed: number;
    avgMoodImprovement: number;
    completionRate: number;
  }>;

  // Metadata
  sampleSize: number;
}

export interface TemporalProfile {
  userId: string;

  // EstadÃ­sticas por TimeSlot
  byTimeSlot: Record<TimeSlot, TimeSlotStats>;

  // EstadÃ­sticas por dÃ­a de la semana
  byDayOfWeek: Record<DayOfWeek, {
    avgMood: number;
    avgEnergy: number;
    taskCompletionRate: number;
    sampleSize: number;
  }>;

  // Patrones detectados
  patterns: TemporalPattern[];

  // Recomendaciones personalizadas
  recommendations: TemporalRecommendation[];

  // Metadata
  lastUpdated: Date;
  totalDataPoints: number;
}

export interface TemporalPattern {
  id: string;
  type: 'procrastination' | 'anxiety' | 'low_energy' | 'avoidance' | 'productivity' | 'mood_dip';
  description: string;

  // CuÃ¡ndo ocurre
  timeSlots: TimeSlot[];
  daysOfWeek?: DayOfWeek[];

  // MÃ©tricas
  frequency: number;  // Veces detectado
  confidence: number; // 0-1

  // Insight
  insight: string;
  suggestedIntervention: string;
}

export interface TemporalRecommendation {
  timeSlot: TimeSlot;
  recommendations: Array<{
    technique: TCCTechnique;
    reason: string;
    expectedEffectiveness: number;
  }>;
  warnings?: Array<{
    issue: string;
    suggestion: string;
  }>;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene el contexto temporal actual
 */
export function getCurrentTemporalContext(): TemporalContext {
  const now = new Date();
  const hour = now.getHours();
  const dayIndex = now.getDay();

  const dayMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayMap[dayIndex];

  let timeSlot: TimeSlot = 'morning';
  for (const [slot, range] of Object.entries(TIME_SLOT_RANGES)) {
    if (hour >= range.start && hour < range.end) {
      timeSlot = slot as TimeSlot;
      break;
    }
  }

  return {
    timeSlot,
    dayOfWeek,
    dayType: dayIndex === 0 || dayIndex === 6 ? 'weekend' : 'weekday',
    hour,
  };
}

/**
 * Extrae TimeSlot de una fecha
 */
export function getTimeSlotFromDate(date: Date): TimeSlot {
  const hour = date.getHours();

  for (const [slot, range] of Object.entries(TIME_SLOT_RANGES)) {
    if (hour >= range.start && hour < range.end) {
      return slot as TimeSlot;
    }
  }

  return 'night'; // Default para horas despuÃ©s de medianoche
}

/**
 * Extrae dÃ­a de la semana de una fecha
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const dayMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayMap[date.getDay()];
}

// ============================================================================
// ANÃLISIS DE DATOS
// ============================================================================

/**
 * Obtiene estadÃ­sticas por TimeSlot
 */
async function getTimeSlotStats(
  userId: string,
  timeSlot: TimeSlot,
  daysBack: number = 30
): Promise<TimeSlotStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Obtener logs de intervenciones para este timeSlot
  const interventionLogs = await db.tccInterventionLogs
    .where('userId')
    .equals(userId)
    .filter(log =>
      log.timestamp >= startDate &&
      log.context.timeOfDay === timeSlot
    )
    .toArray();

  // Obtener logs de activaciÃ³n conductual
  const activationLogs = await db.behavioralActivationLogs
    .where('userId')
    .equals(userId)
    .filter(log =>
      log.timestamp >= startDate &&
      getTimeSlotFromDate(log.timestamp) === timeSlot
    )
    .toArray();

  // Calcular mood promedio
  const moodValues: Record<MoodLevel, number> = {
    very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5
  };

  const energyValues: Record<EnergyLevel, number> = {
    very_low: 1, low: 2, medium: 3, high: 4, very_high: 4
  };

  // EstadÃ­sticas de mood/energy
  let totalMood = 0;
  let totalEnergy = 0;
  let moodCount = 0;
  let energyCount = 0;

  interventionLogs.forEach(log => {
    if (log.context.mood) {
      totalMood += moodValues[log.context.mood];
      moodCount++;
    }
    if (log.context.energy) {
      totalEnergy += energyValues[log.context.energy];
      energyCount++;
    }
  });

  activationLogs.forEach(log => {
    if (log.preActionMood) {
      totalMood += moodValues[log.preActionMood];
      moodCount++;
    }
    if (log.preActionEnergy) {
      const energyMap: Record<string, number> = {
        very_low: 1, low: 2, medium: 3, high: 4
      };
      totalEnergy += energyMap[log.preActionEnergy] || 2;
      energyCount++;
    }
  });

  // Contar barreras
  const barrierCounts: Record<string, number> = {};
  interventionLogs.forEach(log => {
    if (log.context.barrier) {
      barrierCounts[log.context.barrier] = (barrierCounts[log.context.barrier] || 0) + 1;
    }
  });

  // Calcular efectividad de tÃ©cnicas
  const techniqueStats: Record<TCCTechnique, { uses: number; improvements: number[]; completions: number }> = {} as any;

  const allTechniques: TCCTechnique[] = [
    'behavioral_activation', 'gradual_exposure', 'cognitive_restructuring',
    'activity_scheduling', 'functional_analysis', 'micro_tasks',
    'momentum_building', 'self_compassion', 'problem_solving', 'relaxation',
    'chain_analysis', 'distress_tolerance_tipp',
    'emotion_regulation_opposite_action', 'interpersonal_effectiveness_dear_man',
    'cognitive_defusion', 'acceptance_willingness',
    'values_clarification', 'committed_action', 'self_as_context',
    'mindful_breathing', 'body_scan', 'urge_surfing', 'present_moment_anchor'
  ];

  allTechniques.forEach(t => {
    techniqueStats[t] = { uses: 0, improvements: [], completions: 0 };
  });

  interventionLogs.forEach(log => {
    const stats = techniqueStats[log.technique];
    if (stats) {
      stats.uses++;
      if (log.completed) stats.completions++;
      if (log.moodAfter && log.moodBefore) {
        const improvement = moodValues[log.moodAfter] - moodValues[log.moodBefore];
        stats.improvements.push(improvement);
      }
    }
  });

  // Calcular tasas de comportamiento
  const behaviorCounts = { procrastination: 0, avoidance: 0, total: 0 };

  // Obtener anÃ¡lisis funcionales
  const funcAnalyses = await db.functionalAnalysis
    .where('userId')
    .equals(userId)
    .filter(a =>
      a.timestamp >= startDate &&
      a.antecedent.timeOfDay === timeSlot
    )
    .toArray();

  funcAnalyses.forEach(a => {
    behaviorCounts.total++;
    if (a.behavior.type === 'procrastination') behaviorCounts.procrastination++;
    if (a.behavior.type === 'avoidance') behaviorCounts.avoidance++;
  });

  // Task completion rate
  const completedTasks = activationLogs.filter(l => l.completed).length;
  const totalTasks = activationLogs.length;

  return {
    timeSlot,
    dominantEmotions: [], // Se calcula desde thought records
    avgMood: moodCount > 0 ? totalMood / moodCount : 3,
    avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 2,
    commonBarriers: Object.entries(barrierCounts)
      .map(([id, freq]) => ({ barrierId: id, frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5),
    procrastinationRate: behaviorCounts.total > 0
      ? behaviorCounts.procrastination / behaviorCounts.total
      : 0,
    avoidanceRate: behaviorCounts.total > 0
      ? behaviorCounts.avoidance / behaviorCounts.total
      : 0,
    taskCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    commonPatterns: [],
    techniqueEffectiveness: Object.fromEntries(
      Object.entries(techniqueStats).map(([technique, stats]) => [
        technique,
        {
          timesUsed: stats.uses,
          avgMoodImprovement: stats.improvements.length > 0
            ? stats.improvements.reduce((a, b) => a + b, 0) / stats.improvements.length
            : 0,
          completionRate: stats.uses > 0 ? stats.completions / stats.uses : 0,
        }
      ])
    ) as Record<TCCTechnique, { timesUsed: number; avgMoodImprovement: number; completionRate: number }>,
    sampleSize: interventionLogs.length + activationLogs.length,
  };
}

// ============================================================================
// DETECCIÃ“N DE PATRONES
// ============================================================================

/**
 * Detecta patrones temporales en los datos del usuario
 */
async function detectTemporalPatterns(
  userId: string,
  timeSlotStats: Record<TimeSlot, TimeSlotStats>
): Promise<TemporalPattern[]> {
  const patterns: TemporalPattern[] = [];

  const timeSlots: TimeSlot[] = ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'];

  // 1. Detectar picos de procrastinaciÃ³n
  const procrastinationBySlot = timeSlots.map(slot => ({
    slot,
    rate: timeSlotStats[slot]?.procrastinationRate || 0,
    sample: timeSlotStats[slot]?.sampleSize || 0,
  })).filter(s => s.sample >= 3);

  const avgProcrastination = procrastinationBySlot.length > 0
    ? procrastinationBySlot.reduce((sum, s) => sum + s.rate, 0) / procrastinationBySlot.length
    : 0;

  const highProcrastinationSlots = procrastinationBySlot
    .filter(s => s.rate > avgProcrastination * 1.5 && s.rate > 0.3)
    .map(s => s.slot);

  if (highProcrastinationSlots.length > 0) {
    const slotLabels = highProcrastinationSlots.map(s => TIME_SLOT_RANGES[s].label).join(', ');
    patterns.push({
      id: 'procrastination_peak',
      type: 'procrastination',
      description: `Tiendes a procrastinar mÃ¡s durante: ${slotLabels}`,
      timeSlots: highProcrastinationSlots,
      frequency: highProcrastinationSlots.length,
      confidence: Math.min(avgProcrastination * 2, 0.9),
      insight: 'La procrastinaciÃ³n suele aumentar cuando la energÃ­a baja o la tarea parece muy grande.',
      suggestedIntervention: 'Programa tareas importantes en otros momentos del dÃ­a, o usa micro-tareas en estos horarios.',
    });
  }

  // 2. Detectar bajones de Ã¡nimo
  const moodBySlot = timeSlots.map(slot => ({
    slot,
    mood: timeSlotStats[slot]?.avgMood || 3,
    sample: timeSlotStats[slot]?.sampleSize || 0,
  })).filter(s => s.sample >= 3);

  const avgMood = moodBySlot.length > 0
    ? moodBySlot.reduce((sum, s) => sum + s.mood, 0) / moodBySlot.length
    : 3;

  const lowMoodSlots = moodBySlot
    .filter(s => s.mood < avgMood - 0.5 && s.mood < 2.5)
    .map(s => s.slot);

  if (lowMoodSlots.length > 0) {
    const slotLabels = lowMoodSlots.map(s => TIME_SLOT_RANGES[s].label).join(', ');
    patterns.push({
      id: 'mood_dip',
      type: 'mood_dip',
      description: `Tu Ã¡nimo tiende a bajar durante: ${slotLabels}`,
      timeSlots: lowMoodSlots,
      frequency: lowMoodSlots.length,
      confidence: 0.7,
      insight: 'Los bajones de Ã¡nimo en ciertos momentos pueden estar relacionados con fatiga, hambre o patrones de sueÃ±o.',
      suggestedIntervention: 'Considera actividades de auto-cuidado o micro-tareas gratificantes en estos momentos.',
    });
  }

  // 3. Detectar picos de energÃ­a baja
  const energyBySlot = timeSlots.map(slot => ({
    slot,
    energy: timeSlotStats[slot]?.avgEnergy || 2,
    sample: timeSlotStats[slot]?.sampleSize || 0,
  })).filter(s => s.sample >= 3);

  const lowEnergySlots = energyBySlot
    .filter(s => s.energy < 2)
    .map(s => s.slot);

  if (lowEnergySlots.length > 0) {
    const slotLabels = lowEnergySlots.map(s => TIME_SLOT_RANGES[s].label).join(', ');
    patterns.push({
      id: 'low_energy_pattern',
      type: 'low_energy',
      description: `Tu energÃ­a suele estar baja durante: ${slotLabels}`,
      timeSlots: lowEnergySlots,
      frequency: lowEnergySlots.length,
      confidence: 0.75,
      insight: 'La energÃ­a baja recurrente puede indicar necesidad de descanso, alimentaciÃ³n o pausas activas.',
      suggestedIntervention: 'Reserva tareas de bajo esfuerzo para estos momentos o considera una micro-siesta.',
    });
  }

  // 4. Detectar momentos de alta productividad
  const productivityBySlot = timeSlots.map(slot => ({
    slot,
    rate: timeSlotStats[slot]?.taskCompletionRate || 0,
    sample: timeSlotStats[slot]?.sampleSize || 0,
  })).filter(s => s.sample >= 3);

  const avgProductivity = productivityBySlot.length > 0
    ? productivityBySlot.reduce((sum, s) => sum + s.rate, 0) / productivityBySlot.length
    : 0;

  const highProductivitySlots = productivityBySlot
    .filter(s => s.rate > avgProductivity * 1.3 && s.rate > 0.6)
    .map(s => s.slot);

  if (highProductivitySlots.length > 0) {
    const slotLabels = highProductivitySlots.map(s => TIME_SLOT_RANGES[s].label).join(', ');
    patterns.push({
      id: 'productivity_peak',
      type: 'productivity',
      description: `Eres mÃ¡s productivo/a durante: ${slotLabels}`,
      timeSlots: highProductivitySlots,
      frequency: highProductivitySlots.length,
      confidence: 0.8,
      insight: 'Â¡Aprovecha estos momentos! Tu cerebro estÃ¡ mÃ¡s dispuesto a completar tareas.',
      suggestedIntervention: 'Programa las tareas mÃ¡s importantes o desafiantes en estos horarios.',
    });
  }

  // 5. Detectar picos de evitaciÃ³n
  const avoidanceBySlot = timeSlots.map(slot => ({
    slot,
    rate: timeSlotStats[slot]?.avoidanceRate || 0,
    sample: timeSlotStats[slot]?.sampleSize || 0,
  })).filter(s => s.sample >= 3);

  const highAvoidanceSlots = avoidanceBySlot
    .filter(s => s.rate > 0.4)
    .map(s => s.slot);

  if (highAvoidanceSlots.length > 0) {
    const slotLabels = highAvoidanceSlots.map(s => TIME_SLOT_RANGES[s].label).join(', ');
    patterns.push({
      id: 'avoidance_pattern',
      type: 'avoidance',
      description: `La evitaciÃ³n es mÃ¡s frecuente durante: ${slotLabels}`,
      timeSlots: highAvoidanceSlots,
      frequency: highAvoidanceSlots.length,
      confidence: 0.7,
      insight: 'La evitaciÃ³n suele aumentar cuando la ansiedad sube o cuando el dÃ­a avanza sin haber comenzado.',
      suggestedIntervention: 'Usa exposiciÃ³n gradual o micro-tareas para romper el ciclo de evitaciÃ³n.',
    });
  }

  return patterns;
}

// ============================================================================
// RECOMENDACIONES
// ============================================================================

/**
 * Genera recomendaciones personalizadas por TimeSlot
 */
function generateTemporalRecommendations(
  timeSlotStats: Record<TimeSlot, TimeSlotStats>,
  patterns: TemporalPattern[]
): TemporalRecommendation[] {
  const recommendations: TemporalRecommendation[] = [];

  const timeSlots: TimeSlot[] = ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'];

  for (const slot of timeSlots) {
    const stats = timeSlotStats[slot];
    if (!stats || stats.sampleSize < 2) continue;

    const slotRecs: TemporalRecommendation = {
      timeSlot: slot,
      recommendations: [],
      warnings: [],
    };

    // Encontrar tÃ©cnicas mÃ¡s efectivas para este slot
    const effectiveTechniques = Object.entries(stats.techniqueEffectiveness)
      .filter(([_, data]) => data.timesUsed >= 2)
      .sort((a, b) => b[1].avgMoodImprovement - a[1].avgMoodImprovement)
      .slice(0, 3);

    for (const [technique, data] of effectiveTechniques) {
      if (data.avgMoodImprovement > 0) {
        slotRecs.recommendations.push({
          technique: technique as TCCTechnique,
          reason: `Esta tÃ©cnica ha mejorado tu Ã¡nimo ${data.avgMoodImprovement.toFixed(1)} puntos en promedio durante ${TIME_SLOT_RANGES[slot].label}`,
          expectedEffectiveness: Math.min(data.avgMoodImprovement / 2, 1),
        });
      }
    }

    // Agregar warnings basados en patrones
    const relevantPatterns = patterns.filter(p => p.timeSlots.includes(slot));

    for (const pattern of relevantPatterns) {
      if (pattern.type === 'procrastination') {
        slotRecs.warnings?.push({
          issue: 'Alta tendencia a procrastinar',
          suggestion: 'Empieza con una micro-tarea de 2 minutos',
        });
      }
      if (pattern.type === 'low_energy') {
        slotRecs.warnings?.push({
          issue: 'EnergÃ­a tÃ­picamente baja',
          suggestion: 'Elige tareas de bajo esfuerzo o toma un descanso primero',
        });
      }
      if (pattern.type === 'mood_dip') {
        slotRecs.warnings?.push({
          issue: 'Tu Ã¡nimo suele bajar',
          suggestion: 'Considera auto-compasiÃ³n o una actividad agradable',
        });
      }
    }

    // Si hay recomendaciones o warnings, agregar
    if (slotRecs.recommendations.length > 0 || (slotRecs.warnings && slotRecs.warnings.length > 0)) {
      recommendations.push(slotRecs);
    }
  }

  return recommendations;
}

// ============================================================================
// API PRINCIPAL
// ============================================================================

/**
 * Genera el perfil temporal completo del usuario
 */
export async function generateTemporalProfile(
  userId: string,
  daysBack: number = 30
): Promise<TemporalProfile> {
  const timeSlots: TimeSlot[] = ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'];
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Obtener stats por TimeSlot
  const byTimeSlot: Record<TimeSlot, TimeSlotStats> = {} as any;
  let totalDataPoints = 0;

  for (const slot of timeSlots) {
    byTimeSlot[slot] = await getTimeSlotStats(userId, slot, daysBack);
    totalDataPoints += byTimeSlot[slot].sampleSize;
  }

  // Obtener stats por dÃ­a de la semana
  const byDayOfWeek: Record<DayOfWeek, { avgMood: number; avgEnergy: number; taskCompletionRate: number; sampleSize: number }> = {} as any;

  for (const day of days) {
    // Por ahora, inicializar con valores por defecto
    // TODO: Implementar anÃ¡lisis detallado por dÃ­a
    byDayOfWeek[day] = {
      avgMood: 3,
      avgEnergy: 2.5,
      taskCompletionRate: 0.5,
      sampleSize: 0,
    };
  }

  // Detectar patrones
  const patterns = await detectTemporalPatterns(userId, byTimeSlot);

  // Generar recomendaciones
  const recommendations = generateTemporalRecommendations(byTimeSlot, patterns);

  return {
    userId,
    byTimeSlot,
    byDayOfWeek,
    patterns,
    recommendations,
    lastUpdated: new Date(),
    totalDataPoints,
  };
}

/**
 * Obtiene recomendaciones para el momento actual
 */
export async function getCurrentTimeRecommendations(
  userId: string
): Promise<{
  context: TemporalContext;
  recommendations: Array<{
    technique: TCCTechnique;
    reason: string;
    confidence: number;
  }>;
  warnings: Array<{ issue: string; suggestion: string }>;
  insights: string[];
}> {
  const context = getCurrentTemporalContext();
  const profile = await generateTemporalProfile(userId, 30);

  // Encontrar recomendaciones para este slot
  const slotRec = profile.recommendations.find(r => r.timeSlot === context.timeSlot);

  // Encontrar patrones relevantes
  const relevantPatterns = profile.patterns.filter(p =>
    p.timeSlots.includes(context.timeSlot)
  );

  const insights = relevantPatterns.map(p => p.insight);

  return {
    context,
    recommendations: slotRec?.recommendations.map(r => ({
      technique: r.technique,
      reason: r.reason,
      confidence: r.expectedEffectiveness,
    })) || [],
    warnings: slotRec?.warnings || [],
    insights,
  };
}

/**
 * Obtiene el mejor momento para una tÃ©cnica especÃ­fica
 */
export async function getBestTimeForTechnique(
  userId: string,
  technique: TCCTechnique
): Promise<{
  bestTimeSlots: TimeSlot[];
  worstTimeSlots: TimeSlot[];
  reason: string;
}> {
  const profile = await generateTemporalProfile(userId, 30);

  const timeSlots: TimeSlot[] = ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'];

  const effectivenessBySlot = timeSlots
    .map(slot => ({
      slot,
      effectiveness: profile.byTimeSlot[slot]?.techniqueEffectiveness[technique]?.avgMoodImprovement || 0,
      uses: profile.byTimeSlot[slot]?.techniqueEffectiveness[technique]?.timesUsed || 0,
    }))
    .filter(s => s.uses >= 2)
    .sort((a, b) => b.effectiveness - a.effectiveness);

  if (effectivenessBySlot.length === 0) {
    return {
      bestTimeSlots: ['morning', 'afternoon'],
      worstTimeSlots: [],
      reason: 'AÃºn no hay suficientes datos. Prueba esta tÃ©cnica en diferentes momentos.',
    };
  }

  const bestSlots = effectivenessBySlot
    .filter(s => s.effectiveness > 0)
    .slice(0, 2)
    .map(s => s.slot);

  const worstSlots = effectivenessBySlot
    .filter(s => s.effectiveness <= 0)
    .slice(-2)
    .map(s => s.slot);

  const bestLabels = bestSlots.map(s => TIME_SLOT_RANGES[s].label).join(', ');

  return {
    bestTimeSlots: bestSlots.length > 0 ? bestSlots : ['morning'],
    worstTimeSlots: worstSlots,
    reason: bestSlots.length > 0
      ? `Esta tÃ©cnica funciona mejor durante: ${bestLabels}`
      : 'Prueba en diferentes momentos para descubrir cuÃ¡ndo funciona mejor.',
  };
}

/**
 * Verifica si hay patrones problemÃ¡ticos actuales
 */
export async function checkCurrentTimeWarnings(
  userId: string
): Promise<{
  hasWarnings: boolean;
  warnings: Array<{
    type: string;
    message: string;
    suggestion: string;
  }>;
}> {
  const context = getCurrentTemporalContext();
  const profile = await generateTemporalProfile(userId, 30);

  const warnings: Array<{ type: string; message: string; suggestion: string }> = [];

  // Buscar patrones que aplican ahora
  for (const pattern of profile.patterns) {
    if (pattern.timeSlots.includes(context.timeSlot)) {
      warnings.push({
        type: pattern.type,
        message: pattern.description,
        suggestion: pattern.suggestedIntervention,
      });
    }
  }

  return {
    hasWarnings: warnings.length > 0,
    warnings,
  };
}
