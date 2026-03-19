// @ts-nocheck
import type { TaskRecommendationRequest, PersonalizedTask, UserContext } from '../shared/types/taskRecommendation';
import type { EmotionalState, Task, UserTCCProfile } from '../db/database';
import type { Barrier } from '../features/home/types';
import { db } from '../db/database';

export type { TaskRecommendation } from '../shared/types/taskRecommendation';

interface ScoredTask extends Task {
  score: number;
}

export class TaskRecommendationService {

  static async getRecommendation(request: TaskRecommendationRequest): Promise<PersonalizedTask> {
    // 0. Obtener perfil TCC y patterns del usuario (si existen)
    const tccProfile = await db.userTCCProfiles
      .where('userId')
      .equals(request.userContext.userId)
      .first();

    // ✅ V7: Obtener patterns (datos detectados automáticamente)
    const patterns = await db.userPatterns.get(request.userContext.userId);

    // 1. Obtener pool de tareas base según estado + barrera
    const baseTasks = await this.getTaskPool(request.emotionalState, request.barrier);

    // 2. Filtrar por disponibilidad (habitaciones del usuario)
    const availableTasks = baseTasks.filter(task =>
      !task.room || task.room === 'any' || request.userContext.rooms.includes(task.room)
    );

    // 3. Aplicar preferencias y filtros TCC
    let filteredTasks = availableTasks.filter(task =>
      !request.userContext.preferences.avoidances.includes(task.category)
    );

    // 3.1 Filtrar según perfil TCC (si existe)
    if (tccProfile) {
      filteredTasks = this.applyTCCFilters(filteredTasks, tccProfile, request.emotionalState);
    }

    // 4. Priorizar según contexto, perfil TCC y patterns
    const scoredTasks = filteredTasks.map(task => ({
      ...task,
      score: this.calculateScore(task, request.userContext, tccProfile, patterns)
    }));

    // 5. Seleccionar mejor opción
    const sortedTasks = scoredTasks.sort((a, b) => b.score - a.score);
    const bestTask = sortedTasks[0];

    // 6. Si no hay tareas disponibles, retornar tarea genérica
    if (!bestTask) {
      return this.getFallbackTask(request);
    }

    // 7. Personalizar explicación TCC (con perfil si existe)
    const explanation = this.generateExplanation(request, tccProfile);
    const reasoning = this.generateReasoning(request, tccProfile, patterns);
    const tccPrinciple = this.getTCCPrinciple(request, tccProfile);

    // 8. Crear alternativas (siguientes 2-3 mejores tareas)
    const alternatives: PersonalizedTask[] = sortedTasks
      .slice(1, 4)
      .map(task => this.taskToPersonalizedTask(task, request, explanation, reasoning, tccPrinciple));

    return {
      id: bestTask.id,
      title: bestTask.title,
      description: bestTask.description,
      duration: bestTask.estimatedMinutes,
      effort: bestTask.effortLevel === 'micro' ? 'low' : bestTask.effortLevel as 'low' | 'medium' | 'high',
      room: bestTask.room,
      type: bestTask.category,

      // Personalización
      explanation,
      reasoning,
      tccPrinciple,

      // Metadata
      score: bestTask.score,
      alternatives
    };
  }

  private static taskToPersonalizedTask(
    task: ScoredTask,
    request: TaskRecommendationRequest,
    explanation: string,
    reasoning: string[],
    tccPrinciple: string
  ): PersonalizedTask {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      duration: task.estimatedMinutes,
      effort: task.effortLevel === 'micro' ? 'low' : task.effortLevel as 'low' | 'medium' | 'high',
      room: task.room,
      type: task.category,
      explanation,
      reasoning,
      tccPrinciple,
      score: task.score,
      alternatives: []
    };
  }

  private static async getTaskPool(emotionalState: EmotionalState, barrier: Barrier | string): Promise<Task[]> {
    // Filtrar tareas de la base de datos según estado emocional y barrera
    let tasks: Task[] = [];

    if (emotionalState === 'overwhelmed') {
      // Micro-tareas + bajo esfuerzo
      tasks = await db.tasks
        .filter(t =>
          (t.isMicroTask || t.effortLevel === 'low') &&
          !t.requiresDecisions &&
          t.estimatedMinutes <= 3
        )
        .toArray();
    } else if (emotionalState === 'hardtostart') {
      // Micro-tareas + bajo esfuerzo
      tasks = await db.tasks
        .filter(t =>
          (t.isMicroTask || t.effortLevel === 'low') &&
          t.estimatedMinutes <= 10
        )
        .toArray();
    } else if (emotionalState === 'tengoalgodeenergia') {
      // Excluir alto esfuerzo, priorizar medio impacto
      tasks = await db.tasks
        .filter(t =>
          t.effortLevel !== 'high' &&
          t.impactLevel !== 'low'
        )
        .toArray();
    } else if (emotionalState === 'good') {
      // Todas las tareas disponibles
      tasks = await db.tasks.toArray();
    }

    return tasks;
  }

  private static calculateScore(
    task: Task,
    context: UserContext,
    tccProfile?: UserTCCProfile,
    patterns?: any // ✅ V7: Añadir patterns
  ): number {
    let score = 0;

    // Momentum bonus (misma habitación que última tarea)
    if (task.room && context.lastTask && task.room === context.lastTask.room) {
      score += 30;
    }

    // Novedad bonus (habitación no tocada hoy)
    // TODO: Implementar cuando tengamos acceso a completedTasks con detalles
    // const roomTouchedToday = context.completedTasks
    //   .filter(t => isToday(t.completedAt))
    //   .some(t => t.room === task.room);
    // if (!roomTouchedToday) {
    //   score += 20;
    // }

    // Preferencia del usuario
    if (context.preferences.taskTypes.includes(task.category)) {
      score += 25;
    }

    // Tiempo disponible
    if (context.availableTime && task.estimatedMinutes <= context.availableTime) {
      score += 15;
    }

    // Ubicación actual (si está en la habitación)
    if (task.room && task.room === context.currentLocation) {
      score += 40;  // ¡Sin fricción de movimiento!
    }

    // Patrón de energía
    const energyNow = context.energyPatterns.find(p =>
      p.time === context.timeOfDay
    );
    if (energyNow?.level === 'high' && task.effortLevel === 'high') {
      score += 20;
    }

    // Evita repetición (no la misma tarea 2 veces seguidas)
    if (context.lastTask && context.lastTask.type === task.category) {
      score -= 50;
    }

    // Bonus por micro-tareas
    if (task.isMicroTask) {
      score += 10;
    }

    // Bonus por impacto alto
    if (task.impactLevel === 'high') {
      score += 15;
    }

    // ========================================
    // BONUS BASADOS EN PERFIL TCC
    // ========================================
    if (tccProfile) {
      // Alinear con estilo de trabajo declarado
      if (tccProfile.workStyle === 'micro' && task.isMicroTask) {
        score += 35; // Usuario prefiere micro-tareas
      } else if (tccProfile.workStyle === 'blocks' && task.estimatedMinutes >= 20) {
        score += 30; // Usuario prefiere bloques largos
      }

      // Alinear con dificultad principal
      if (tccProfile.mainDifficulty === 'decisions' && !task.requiresDecisions) {
        score += 25; // Usuario lucha con decisiones, priorizar tareas predefinidas
      } else if (tccProfile.mainDifficulty === 'energy' && task.isMicroTask) {
        score += 20; // Baja energía = micro-tareas
      }

      // Bonus si la técnica TCC asociada ha sido efectiva
      if (task.isMicroTask && tccProfile.effectiveTechniques.includes('micro_tasks')) {
        score += 25;
      }
    }

    // ========================================
    // ✅ V7: BONUS BASADOS EN PATTERNS (datos detectados)
    // ========================================
    if (patterns) {
      // Bonus si la tarea está en preferredTaskTypes aprendidos
      if (patterns.preferredTaskTypes?.includes(task.category)) {
        score += 30;
      }

      // Penalizar tareas que el usuario evita
      if (patterns.avoidedTaskTypes?.includes(task.category)) {
        score -= 40;
      }

      // Alinear con patrón de energía DETECTADO (lo que realmente hace el usuario)
      if (patterns.detectedEnergyPeakTime === context.timeOfDay && task.effortLevel !== 'micro') {
        score += 20; // Es su mejor momento del día detectado
      }
    }

    return score;
  }

  // ========================================
  // MÉTODOS PARA PERFIL TCC
  // ========================================

  /**
   * Aplica filtros según el perfil TCC del usuario
   */
  private static applyTCCFilters(
    tasks: Task[],
    profile: UserTCCProfile,
    emotionalState: EmotionalState
  ): Task[] {
    let filtered = tasks;

    // Si el usuario tiene ansiedad/abrumamiento, eliminar tareas complejas
    if (profile.emotionalBarrier === 'anxiety' && emotionalState === 'overwhelmed') {
      filtered = filtered.filter(t => !t.requiresDecisions && t.estimatedMinutes <= 5);
    }

    // Si tiene problema con desapego, evitar tareas de "organizing" que implican decisiones
    if (profile.mainDifficulty === 'accumulation') {
      filtered = filtered.filter(t => !(t.category === 'organizing' && t.requiresDecisions));
    }

    // Si tiene problema de energía, priorizar micro-tareas en estados de baja energía
    if (profile.mainDifficulty === 'energy' && (emotionalState === 'overwhelmed' || emotionalState === 'hardtostart')) {
      filtered = filtered.filter(t => t.isMicroTask || t.effortLevel === 'low');
    }

    return filtered;
  }

  private static getFallbackTask(request: TaskRecommendationRequest): PersonalizedTask {
    return {
      id: `fallback-${Date.now()}`,
      title: 'Tarea rápida de organización',
      description: 'Guarda 3 objetos que estén fuera de su lugar',
      duration: 5,
      effort: 'low',
      type: 'organizing',
      explanation: this.generateExplanation(request),
      reasoning: this.generateReasoning(request),
      tccPrinciple: this.getTCCPrinciple(request),
      score: 0,
      alternatives: []
    };
  }

  private static generateExplanation(request: TaskRecommendationRequest, tccProfile?: UserTCCProfile): string {
    const { emotionalState, userContext } = request;
    const parts: string[] = [];

    // Explicación base según estado emocional
    switch (emotionalState) {
      case 'overwhelmed':
        parts.push('Esta tarea es pequeña y manejable. Te ayudará a reducir la sensación de abrumamiento sin agotarte más.');
        break;
      case 'hardtostart':
        parts.push('Esta tarea requiere muy poca energía inicial. Perfecta para cuando cuesta empezar.');
        break;
      case 'tengoalgodeenergia':
        parts.push('Tienes energía disponible. Esta tarea aprovecha ese momentum para lograr algo significativo.');
        break;
      case 'good':
        parts.push('Estás en un buen estado. Esta tarea te ayuda a mantener tu espacio organizado sin esfuerzo extra.');
        break;
    }

    // ========================================
    // PERSONALIZACIÓN CON PERFIL TCC
    // ========================================
    if (tccProfile) {
      // Mensaje según dificultad principal
      if (tccProfile.mainDifficulty === 'decisions') {
        parts.push('Esta tarea está predefinida, no requiere decisiones difíciles de tu parte.');
      } else if (tccProfile.mainDifficulty === 'energy' && emotionalState !== 'good') {
        parts.push('Es una micro-tarea diseñada para tu nivel de energía actual.');
      } else if (tccProfile.mainDifficulty === 'maintenance') {
        parts.push('Una tarea preventiva que evita que el desorden se acumule.');
      }

      // Mensaje según barrera emocional
      if (tccProfile.emotionalBarrier === 'anxiety') {
        parts.push('Recuerda: la acción reduce la ansiedad, no esperes a "sentirte listo/a".');
      } else if (tccProfile.emotionalBarrier === 'guilt') {
        parts.push('No hay juicio aquí. Estás haciendo lo que puedes, y eso es suficiente.');
      }

      // Tips personalizados del sistema de aprendizaje
      if (tccProfile.customTips.length > 0) {
        parts.push(tccProfile.customTips[0]); // Mostrar el tip más relevante
      }
    }

    // Personalización basada en historial del usuario
    if (userContext.completedToday > 0) {
      parts.push(`Ya completaste ${userContext.completedToday} tarea${userContext.completedToday > 1 ? 's' : ''} hoy. ¡Vas muy bien!`);
    }

    if (userContext.lastTask) {
      parts.push(`Tu última tarea fue en ${this.getRoomName(userContext.lastTask.room)}.`);
    }

    // Contexto de tiempo
    if (userContext.timeOfDay === 'morning') {
      parts.push('Las mañanas son perfectas para establecer el tono del día.');
    } else if (userContext.timeOfDay === 'evening') {
      parts.push('Una pequeña victoria antes de terminar el día te ayudará a dormir mejor.');
    }

    return parts.join(' ');
  }

  private static getRoomName(room: string): string {
    const roomNames: Record<string, string> = {
      kitchen: 'la cocina',
      bedroom: 'el dormitorio',
      bathroom: 'el baño',
      living_room: 'la sala',
      dining_room: 'el comedor'
    };
    return roomNames[room] || room;
  }

  private static generateReasoning(request: TaskRecommendationRequest, tccProfile?: UserTCCProfile, patterns?: any): string[] {
    const reasoning: string[] = [];
    const { emotionalState, userContext } = request;

    // Basado en estado emocional
    if (emotionalState === 'overwhelmed') {
      reasoning.push('Micro-tareas reducen la carga cognitiva');
      reasoning.push('Completar algo pequeño activa tu sistema de recompensa');
    } else if (emotionalState === 'hardtostart') {
      reasoning.push('Tareas de bajo esfuerzo reducen la resistencia inicial');
      reasoning.push('La acción genera energía, no al revés');
    } else if (emotionalState === 'tengoalgodeenergia') {
      reasoning.push('Tu energía física está disponible para tareas de mayor esfuerzo');
      reasoning.push('Aprovecha este estado óptimo mientras dure');
    } else if (emotionalState === 'good') {
      reasoning.push('Mantenimiento preventivo es más fácil que limpieza reactiva');
      reasoning.push('Rutinas consistentes liberan espacio mental');
    }

    // Basado en historial del usuario
    if (userContext.recentSuccesses) {
      reasoning.push('El momentum de éxitos previos facilita la siguiente tarea');
    }

    if (userContext.completedToday === 0) {
      reasoning.push('La primera tarea del día establece un precedente positivo');
    } else if (userContext.completedToday >= 3) {
      reasoning.push('Ya has demostrado consistencia hoy, una más consolidará el hábito');
    }

    // Basado en tiempo disponible
    if (userContext.availableTime < 15) {
      reasoning.push('Tarea corta que se ajusta a tu tiempo disponible');
    } else if (userContext.availableTime > 30) {
      reasoning.push('Tienes tiempo suficiente para una tarea más completa');
    }

    // Basado en ubicación actual
    if (userContext.currentLocation) {
      reasoning.push(`Estás en ${this.getRoomName(userContext.currentLocation)}, ideal para continuar aquí`);
    }

    // Basado en hora del día
    if (userContext.timeOfDay === 'morning') {
      reasoning.push('Los niveles de energía matutina son óptimos para tareas físicas');
    } else if (userContext.timeOfDay === 'afternoon') {
      reasoning.push('La tarde es buen momento para tareas de mantenimiento');
    } else if (userContext.timeOfDay === 'evening') {
      reasoning.push('Tareas ligeras de cierre ayudan a preparar el espacio para mañana');
    }

    // ========================================
    // RAZONAMIENTO CON PERFIL TCC
    // ========================================
    if (tccProfile) {
      // Agregar insights según técnicas efectivas
      if (tccProfile.effectiveTechniques.includes('micro_tasks')) {
        reasoning.push('Las micro-tareas han funcionado bien para ti en el pasado');
      }
      if (tccProfile.effectiveTechniques.includes('momentum_building')) {
        reasoning.push('Construir momentum con tareas sucesivas maximiza tu productividad');
      }

      // ✅ V7: Mencionar patrón detectado vs. declarado (comparar TCC vs Patterns)
      if (patterns?.detectedEnergyPeakTime === userContext.timeOfDay) {
        reasoning.push(`Este horario coincide con tu pico de energía detectado - es tu momento óptimo`);
      } else if (tccProfile.reportedEnergyPeakTime === userContext.timeOfDay) {
        reasoning.push(`Dijiste que este es tu mejor horario - veamos si funciona`);
      }

      // ✅ V7: Consistency score (ahora en patterns)
      if (patterns?.consistencyScore && patterns.consistencyScore > 70) {
        reasoning.push('Tu consistencia reciente demuestra que los hábitos se están consolidando');
      }
    }

    return reasoning;
  }

  private static getTCCPrinciple(request: TaskRecommendationRequest, tccProfile?: UserTCCProfile): string {
    const { emotionalState } = request;

    // Si hay perfil TCC, usar principios más específicos
    if (tccProfile) {
      // Principio según barrera emocional + estado actual
      if (tccProfile.emotionalBarrier === 'anxiety' && emotionalState === 'overwhelmed') {
        return 'Exposición Gradual: Pequeñas acciones reducen la ansiedad progresivamente';
      } else if (tccProfile.emotionalBarrier === 'guilt') {
        return 'Autocompasión: Trátate con la misma amabilidad que tratarías a un amigo';
      } else if (tccProfile.mainDifficulty === 'decisions') {
        return 'Simplificación Cognitiva: Eliminar decisiones reduce la parálisis';
      } else if (tccProfile.mainDifficulty === 'energy') {
        return 'Activación Conductual: La energía sigue a la acción, no la precede';
      } else if (tccProfile.mainDifficulty === 'maintenance' && emotionalState === 'good') {
        return 'Prevención de Recaídas: Mantener es más fácil que recuperar';
      }
    }

    // Principios por defecto según estado emocional
    switch (emotionalState) {
      case 'overwhelmed':
        return 'Activación Conductual: La acción precede a la motivación';
      case 'hardtostart':
        return 'Gradualismo: Pequeños pasos reducen la resistencia';
      case 'tengoalgodeenergia':
        return 'Aprovechamiento de recursos: Usa la energía cuando esté disponible';
      case 'good':
        return 'Mantenimiento: Prevenir es más fácil que remediar';
      default:
        return 'Acción basada en valores: Alinea tareas con tus objetivos';
    }
  }
}
