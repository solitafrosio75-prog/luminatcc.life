// @ts-nocheck
import { db } from '../db/database';
import type { UserPatterns, UserTCCProfile, ActivityLog, RouteType, MoodLevel } from '../db/database';

/**
 * âœ… V7: Sistema de aprendizaje automÃ¡tico de patrones de usuario
 * Actualiza UserPatterns (datos detectados) despuÃ©s de cada tarea
 * UserTCCProfile permanece inmutable excepto para tÃ©cnicas efectivas y tips
 */
export class UserPatternsLearningService {

  /**
   * Actualiza los patrones del usuario despuÃ©s de completar una tarea
   */
  static async updateAfterTaskCompletion(
    userId: string,
    activityLog: ActivityLog,
    taskCategory: string,
    taskDuration: number,
    taskWasMicroTask: boolean,
    emotionalRoute: RouteType
  ): Promise<void> {
    // âœ… V7: Obtener o crear UserPatterns (datos detectados)
    let patterns = await db.userPatterns.get(userId);

    if (!patterns) {
      // Inicializar patterns si no existen
      patterns = {
        userId,
        preferredTaskTypes: [],
        avoidedTaskTypes: [],
        successfulTimeSlots: {},
        taskDurations: [],
        totalPointsEarned: 0,
        totalTasksCompleted: 0,
        consistencyScore: 0,
        lastUpdated: new Date(),
      };
    }

    // âœ… V7: Actualizar contador de tareas completadas
    if (activityLog.completed) {
      patterns.totalTasksCompleted += 1;
    }

    // 1. Actualizar preferencias de tareas (DETECTADAS)
    if (activityLog.completed && activityLog.moodImprovement && activityLog.moodImprovement > 0) {
      // La tarea mejorÃ³ el mood â†’ agregar a preferidas
      if (!patterns.preferredTaskTypes.includes(taskCategory)) {
        patterns.preferredTaskTypes.push(taskCategory);
      }
    } else if (!activityLog.completed) {
      // La tarea fue abandonada â†’ agregar a evitadas
      if (!patterns.avoidedTaskTypes.includes(taskCategory)) {
        patterns.avoidedTaskTypes.push(taskCategory);
      }
    }

    // 2. Actualizar patrÃ³n de energÃ­a DETECTADO
    const timeOfDay = this.getTimeOfDay();

    if (activityLog.completed && activityLog.moodImprovement && activityLog.moodImprovement >= 0) {
      // Incrementar contador de Ã©xitos en este horario
      patterns.successfulTimeSlots[timeOfDay] =
        (patterns.successfulTimeSlots[timeOfDay] || 0) + 1;

      // Recalcular mejor momento del dÃ­a
      const slots = Object.entries(patterns.successfulTimeSlots);
      if (slots.length > 0) {
        slots.sort((a, b) => b[1] - a[1]);

        // Solo actualizar si hay suficientes datos (al menos 3 Ã©xitos)
        if (slots[0][1] >= 3) {
          patterns.detectedEnergyPeakTime = slots[0][0] as 'morning' | 'afternoon' | 'evening';
        }
      }
    }

    // 3. Actualizar duraciÃ³n preferida
    if (activityLog.completed && activityLog.actualMinutes) {
      patterns.taskDurations.push(activityLog.actualMinutes);

      // Mantener solo Ãºltimas 20 duraciones
      if (patterns.taskDurations.length > 20) {
        patterns.taskDurations = patterns.taskDurations.slice(-20);
      }

      // Calcular mediana si hay suficientes datos
      if (patterns.taskDurations.length >= 5) {
        patterns.preferredTaskDuration = this.calculateMedian(patterns.taskDurations);
      }
    }

    // 4. Calcular consistency score (0-100)
    const last7Days = await this.getActiveDaysInLastWeek(userId);
    patterns.consistencyScore = Math.round((last7Days / 7) * 100);

    // 5. Actualizar timestamp
    patterns.lastUpdated = new Date();

    // âœ… V7: Guardar patterns actualizados
    await db.userPatterns.put(patterns);

    // ========================================
    // ACTUALIZACIÃ“N DE TCC PROFILE (OPCIONAL)
    // ========================================
    // Solo actualizamos tÃ©cnicas efectivas y tips personalizados
    // El resto del perfil TCC permanece inmutable
    const tccProfile = await db.userTCCProfiles
      .where('userId')
      .equals(userId)
      .first();

    if (tccProfile) {
      // Detectar tÃ©cnicas TCC efectivas
      if (activityLog.completed && activityLog.moodImprovement && activityLog.moodImprovement >= 2) {
        // Tarea completada con mejora significativa de mood (2+ puntos)

        if (taskWasMicroTask && !tccProfile.effectiveTechniques.includes('micro_tasks')) {
          tccProfile.effectiveTechniques.push('micro_tasks');
        }

        if (taskDuration >= 20 && !tccProfile.effectiveTechniques.includes('time_blocking')) {
          tccProfile.effectiveTechniques.push('time_blocking');
        }

        // Si el usuario completÃ³ 3+ tareas seguidas, momentum building funciona
        const recentLogs = await db.activityLogs
          .where('userId')
          .equals(userId)
          .reverse()
          .limit(3)
          .toArray();

        if (recentLogs.every(log => log.completed) && !tccProfile.effectiveTechniques.includes('momentum_building')) {
          tccProfile.effectiveTechniques.push('momentum_building');
        }

        // âœ… V9: Detectar si activaciÃ³n conductual general es efectiva
        // Si la mejora de mood es consistente (3+ veces seguidas), activaciÃ³n conductual funciona
        const recentWithImprovement = await db.activityLogs
          .where('userId')
          .equals(userId)
          .reverse()
          .limit(5)
          .toArray();

        const improvementCount = recentWithImprovement.filter(
          log => log.completed && log.moodImprovement && log.moodImprovement > 0
        ).length;

        if (improvementCount >= 3 && !tccProfile.effectiveTechniques.includes('behavioral_activation')) {
          tccProfile.effectiveTechniques.push('behavioral_activation');
          console.log(`âœ… TÃ©cnica detectada: behavioral_activation (${improvementCount}/5 con mejora)`);
        }
      }

      // âœ… V9: Detectar exposiciÃ³n gradual efectiva
      await this.checkExposureEffectiveness(userId, tccProfile);

      // âœ… V9: Detectar reestructuraciÃ³n cognitiva efectiva
      await this.checkCognitiveReframeEffectiveness(userId, tccProfile);

      // Generar tips personalizados
      tccProfile.customTips = await this.generateCustomTips(tccProfile, patterns, emotionalRoute);
      tccProfile.lastUpdated = new Date();

      // Guardar perfil TCC actualizado
      await db.userTCCProfiles.put(tccProfile);
    }
  }

  /**
   * Genera tips TCC personalizados segÃºn el perfil y patrones detectados
   */
  private static async generateCustomTips(
    tccProfile: UserTCCProfile,
    patterns: UserPatterns,
    currentRoute: RouteType
  ): Promise<string[]> {
    const tips: string[] = [];

    // âœ… V7: Detectar contradicciones entre declarado vs. detectado
    if (tccProfile.reportedEnergyPeakTime !== 'variable' && patterns.detectedEnergyPeakTime) {
      if (tccProfile.reportedEnergyPeakTime !== patterns.detectedEnergyPeakTime) {
        const detectedLabel = this.getTimeOfDayLabel(patterns.detectedEnergyPeakTime);
        const totalSuccesses = patterns.successfulTimeSlots[patterns.detectedEnergyPeakTime] || 0;

        if (totalSuccesses >= 5) {
          tips.push(`He notado que completas mÃ¡s tareas en las ${detectedLabel}. Â¿QuizÃ¡s ese es tu mejor momento?`);
        }
      }
    }

    // Tips segÃºn consistency score
    if (patterns.consistencyScore > 80) {
      tips.push(`Tu consistencia estÃ¡ en ${patterns.consistencyScore}%. Los hÃ¡bitos se estÃ¡n consolidando.`);
    } else if (patterns.consistencyScore < 30) {
      tips.push('La consistencia es mÃ¡s importante que la intensidad. Mejor 5 min diarios que 2 horas un dÃ­a.');
    }

    // Tips segÃºn tÃ©cnicas efectivas
    if (tccProfile.effectiveTechniques.includes('micro_tasks') && currentRoute === 'overwhelmed') {
      tips.push('Las micro-tareas te han funcionado. Vamos con algo de 2 minutos o menos.');
    }

    if (tccProfile.effectiveTechniques.includes('momentum_building')) {
      tips.push('Construir momentum (tarea tras tarea) te funciona. Intenta hacer 2-3 seguidas si puedes.');
    }

    // Tips segÃºn barrera emocional
    if (tccProfile.emotionalBarrier === 'anxiety' && currentRoute === 'overwhelmed') {
      tips.push('La acciÃ³n reduce la ansiedad mÃ¡s efectivamente que la planificaciÃ³n. Empieza antes de sentirte "listo/a".');
    } else if (tccProfile.emotionalBarrier === 'guilt') {
      tips.push('No estÃ¡s siendo flojo/a. Tu cerebro necesita compasiÃ³n, no crÃ­tica.');
    } else if (tccProfile.emotionalBarrier === 'frustration') {
      tips.push('El cambio sostenible es lento. Celebra los pequeÃ±os avances, aunque parezcan insignificantes.');
    }

    // Limitar a 3 tips mÃ¡ximo
    return tips.slice(0, 3);
  }

  /**
   * Calcula cuÃ¡ntos dÃ­as distintos el usuario hizo tareas en la Ãºltima semana
   */
  private static async getActiveDaysInLastWeek(userId: string): Promise<number> {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const logs = await db.activityLogs
      .where('userId')
      .equals(userId)
      .filter(log => log.startTime >= last7Days && log.completed)
      .toArray();

    // Contar dÃ­as Ãºnicos
    const uniqueDays = new Set(
      logs.map(log => log.startTime.toISOString().split('T')[0])
    );

    return uniqueDays.size;
  }

  /**
   * Calcula la mediana de un array de nÃºmeros
   */
  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    return sorted[mid];
  }

  /**
   * Obtiene el momento del dÃ­a actual
   */
  private static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Convierte time of day a etiqueta en espaÃ±ol
   */
  private static getTimeOfDayLabel(time: 'morning' | 'afternoon' | 'evening'): string {
    const labels = {
      morning: 'maÃ±anas',
      afternoon: 'tardes',
      evening: 'noches'
    };
    return labels[time];
  }

  // ========================================
  // âœ… V9: DETECCIÃ“N DE TÃ‰CNICAS TCC ADICIONALES
  // ========================================

  /**
   * Verifica si la exposiciÃ³n gradual estÃ¡ siendo efectiva
   */
  private static async checkExposureEffectiveness(
    userId: string,
    tccProfile: any
  ): Promise<void> {
    if (tccProfile.effectiveTechniques.includes('gradual_exposure')) {
      return; // Ya detectada
    }

    try {
      const exposureRecords = await db.exposureProgress
        .where('userId')
        .equals(userId)
        .toArray();

      // Si completÃ³ al menos 2 espacios hasta nivel 'act' o 'complete'
      const successfulExposures = exposureRecords.filter(
        e => e.completedLevels.includes('act') || e.completedLevels.includes('complete')
      );

      if (successfulExposures.length >= 2) {
        tccProfile.effectiveTechniques.push('gradual_exposure');
        console.log(`âœ… TÃ©cnica detectada: gradual_exposure (${successfulExposures.length} espacios)`);
      }
    } catch (error) {
      // Tabla puede no existir aÃºn
      console.log('Exposure progress table not yet available');
    }
  }

  /**
   * Verifica si la reestructuraciÃ³n cognitiva estÃ¡ siendo efectiva
   */
  private static async checkCognitiveReframeEffectiveness(
    userId: string,
    tccProfile: any
  ): Promise<void> {
    if (tccProfile.effectiveTechniques.includes('cognitive_restructuring')) {
      return; // Ya detectada
    }

    try {
      const reframeLogs = await db.cognitiveRefameLogs
        .where('userId')
        .equals(userId)
        .toArray();

      // Si aceptÃ³ reframes y reportÃ³ que ayudaron al menos 3 veces
      const helpfulReframes = reframeLogs.filter(
        log => log.userResponse === 'accepted' && log.helpedAfterAction === true
      );

      if (helpfulReframes.length >= 3) {
        tccProfile.effectiveTechniques.push('cognitive_restructuring');
        console.log(`âœ… TÃ©cnica detectada: cognitive_restructuring (${helpfulReframes.length} reframes Ãºtiles)`);
      }
    } catch (error) {
      // Tabla puede no existir aÃºn
      console.log('Cognitive reframe logs table not yet available');
    }
  }

  /**
   * âœ… V9: Registra un intento de exposiciÃ³n gradual
   */
  static async logExposureAttempt(
    userId: string,
    space: string,
    level: string,
    wasSuccessful: boolean,
    feeling: 'better' | 'same' | 'worse'
  ): Promise<void> {
    try {
      let progress = await db.exposureProgress
        .where('[userId+space]')
        .equals([userId, space])
        .first();

      if (!progress) {
        // Crear nuevo registro
        progress = {
          userId,
          space,
          currentLevel: level as any,
          successCountAtLevel: 0,
          completedLevels: [],
          totalAttempts: 0,
          totalSuccesses: 0,
          startedAt: new Date()
        };
      }

      progress.totalAttempts++;
      progress.lastAttempt = new Date();

      if (wasSuccessful || feeling === 'better' || feeling === 'same') {
        progress.totalSuccesses++;
        progress.successCountAtLevel++;
        progress.lastSuccess = new Date();

        // Agregar a niveles completados si no estÃ¡
        if (!progress.completedLevels.includes(level as any)) {
          progress.completedLevels.push(level as any);
        }
      }

      await db.exposureProgress.put(progress);
      console.log(`âœ… Exposure logged: ${space} - ${level} (success: ${wasSuccessful})`);
    } catch (error) {
      console.error('Error logging exposure:', error);
    }
  }

  /**
   * âœ… V9: Registra un uso de reestructuraciÃ³n cognitiva
   */
  static async logCognitiveReframe(
    userId: string,
    thoughtId: string,
    pattern: string,
    originalThought: string,
    reframeShown: string,
    actionSuggested: string,
    userResponse: 'accepted' | 'dismissed' | 'tried_another',
    barrier?: string
  ): Promise<void> {
    try {
      await db.cognitiveRefameLogs.add({
        userId,
        timestamp: new Date(),
        thoughtId,
        pattern: pattern as any,
        originalThought,
        reframeShown,
        actionSuggested,
        userResponse,
        barrier
      });
      console.log(`âœ… Cognitive reframe logged: ${thoughtId} (${userResponse})`);
    } catch (error) {
      console.error('Error logging cognitive reframe:', error);
    }
  }

  /**
   * âœ… V9: Actualiza si un reframe ayudÃ³ despuÃ©s de la acciÃ³n
   */
  static async updateReframeEffectiveness(
    logId: number,
    helped: boolean
  ): Promise<void> {
    try {
      await db.cognitiveRefameLogs.update(logId, {
        helpedAfterAction: helped
      });
    } catch (error) {
      console.error('Error updating reframe effectiveness:', error);
    }
  }

  /**
   * âœ… V7: Resetea los patrones del usuario (Ãºtil para testing)
   */
  static async resetPatterns(userId: string): Promise<void> {
    const patterns = await db.userPatterns.get(userId);

    if (patterns) {
      // Resetear solo datos detectados
      patterns.preferredTaskTypes = [];
      patterns.avoidedTaskTypes = [];
      patterns.successfulTimeSlots = {};
      patterns.taskDurations = [];
      patterns.totalPointsEarned = 0;
      patterns.totalTasksCompleted = 0;
      patterns.consistencyScore = 0;
      patterns.detectedEnergyPeakTime = undefined;
      patterns.preferredTaskDuration = undefined;
      patterns.lastUpdated = new Date();

      await db.userPatterns.put(patterns);
    }

    // Resetear solo tÃ©cnicas efectivas y tips del TCC profile
    const tccProfile = await db.userTCCProfiles
      .where('userId')
      .equals(userId)
      .first();

    if (tccProfile) {
      tccProfile.effectiveTechniques = [];
      tccProfile.customTips = [];
      tccProfile.lastUpdated = new Date();

      await db.userTCCProfiles.put(tccProfile);
    }
  }
}
