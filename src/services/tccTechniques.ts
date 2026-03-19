// @ts-nocheck
/**
 * ============================================================================
 * TÃ‰CNICAS TCC ADICIONALES PARA HOMEFLOW
 * ============================================================================
 *
 * Este archivo implementa tres tÃ©cnicas TCC de forma natural y no medicalizada:
 *
 * 1. EXPOSICIÃ“N GRADUAL - JerarquÃ­a de pasos para espacios que generan ansiedad
 * 2. REESTRUCTURACIÃ“N COGNITIVA - Identificar y responder a pensamientos que bloquean
 * 3. ACTIVACIÃ“N CONDUCTUAL GENERAL - Ciclo acciÃ³n â†’ emociÃ³n con seguimiento
 */

import type { Barrier } from '../features/home/types';
import type { MoodLevel, RouteType } from '../db/database';

// ============================================================================
// 1. EXPOSICIÃ“N GRADUAL
// ============================================================================
// Para usuarios con ansiedad ante ciertos espacios o tareas.
// ProgresiÃ³n: Mirar â†’ Acercarse â†’ Tocar/Mover â†’ Completar

export type ExposureLevel = 'observe' | 'approach' | 'touch' | 'act' | 'complete';

export interface ExposureStep {
  level: ExposureLevel;
  instruction: string;
  duration: string;
  encouragement: string;
  nextPrompt: string;
}

export interface ExposureHierarchy {
  targetSpace: string;
  currentLevel: ExposureLevel;
  completedLevels: ExposureLevel[];
  successCount: number; // Veces completado este nivel
  lastAttempt?: Date;
}

/**
 * Genera los pasos de exposiciÃ³n gradual para un espacio especÃ­fico
 */
export function getExposureSteps(space: string): ExposureStep[] {
  const spaceName = getSpaceFriendlyName(space);

  return [
    {
      level: 'observe',
      instruction: `Solo mira ${spaceName} desde donde estÃ¡s. No tienes que hacer nada mÃ¡s.`,
      duration: '30 segundos',
      encouragement: 'Solo observar ya es un paso. Tu cerebro se estÃ¡ acostumbrando.',
      nextPrompt: 'Â¿Quieres acercarte un poco?'
    },
    {
      level: 'approach',
      instruction: `AcÃ©rcate a ${spaceName}. QuÃ©date ahÃ­ un momento.`,
      duration: '1 minuto',
      encouragement: 'Estar presente sin actuar reduce la ansiedad con el tiempo.',
      nextPrompt: 'Â¿Te animas a tocar o mover algo pequeÃ±o?'
    },
    {
      level: 'touch',
      instruction: `Toca o mueve UN solo objeto en ${spaceName}. Solo uno.`,
      duration: '1-2 minutos',
      encouragement: 'Cada pequeÃ±a acciÃ³n le demuestra a tu cerebro que es seguro.',
      nextPrompt: 'Â¿Quieres hacer una micro-tarea aquÃ­?'
    },
    {
      level: 'act',
      instruction: `Haz una micro-tarea de 2 minutos en ${spaceName}.`,
      duration: '2 minutos',
      encouragement: 'Ya estÃ¡s actuando. La ansiedad baja cuando actuamos.',
      nextPrompt: 'Â¿Completamos algo mÃ¡s?'
    },
    {
      level: 'complete',
      instruction: `Completa una tarea pequeÃ±a en ${spaceName}.`,
      duration: '5-10 minutos',
      encouragement: 'Â¡Lo lograste! Has completado el ciclo de exposiciÃ³n.',
      nextPrompt: 'Â¿CÃ³mo te sientes ahora comparado con antes?'
    }
  ];
}

/**
 * Determina el siguiente nivel de exposiciÃ³n basado en el progreso
 */
export function getNextExposureLevel(
  current: ExposureLevel,
  wasSuccessful: boolean,
  successCount: number
): ExposureLevel {
  const levels: ExposureLevel[] = ['observe', 'approach', 'touch', 'act', 'complete'];
  const currentIndex = levels.indexOf(current);

  if (!wasSuccessful) {
    // Si no fue exitoso, mantener o bajar un nivel
    return currentIndex > 0 ? levels[currentIndex - 1] : current;
  }

  // Necesita 2-3 Ã©xitos para avanzar (reduce ansiedad de forma gradual)
  const successesNeeded = current === 'observe' ? 2 : 3;

  if (successCount >= successesNeeded && currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }

  return current;
}

/**
 * Genera mensaje de validaciÃ³n para exposiciÃ³n
 */
export function getExposureValidation(level: ExposureLevel, feeling: 'better' | 'same' | 'worse'): string {
  const messages = {
    observe: {
      better: 'Observar sin actuar ya redujo algo de ansiedad. Eso es el inicio.',
      same: 'Mantener la calma mientras observas es un logro. La ansiedad irÃ¡ bajando.',
      worse: 'Es normal sentir mÃ¡s ansiedad al principio. Esto se llama "pico de ansiedad" y baja con prÃ¡ctica.'
    },
    approach: {
      better: 'Acercarte sin huir le enseÃ±a a tu cerebro que es seguro.',
      same: 'Quedarte ahÃ­ aunque no se sienta cÃ³modo es valentÃ­a.',
      worse: 'La ansiedad puede subir antes de bajar. Eso es parte del proceso.'
    },
    touch: {
      better: 'Tocar algo pequeÃ±o rompe la barrera. Ya no es solo en tu mente.',
      same: 'Cada contacto reduce el poder que este espacio tiene sobre ti.',
      worse: 'Sentir mÃ¡s es seÃ±al de que estÃ¡s enfrentando algo importante.'
    },
    act: {
      better: 'La acciÃ³n genera cambio real. Tu cerebro estÃ¡ aprendiendo.',
      same: 'Actuar aunque no se sienta bien es la definiciÃ³n de coraje.',
      worse: 'Has actuado a pesar de la incomodidad. Eso es mÃ¡s de lo que hacÃ­as antes.'
    },
    complete: {
      better: 'Â¡Completaste el ciclo! Tu tolerancia a la ansiedad ha crecido.',
      same: 'Completar tareas difÃ­ciles construye confianza con el tiempo.',
      worse: 'Terminaste algo que te costaba. Eso merece reconocimiento.'
    }
  };

  return messages[level][feeling];
}

// ============================================================================
// 2. REESTRUCTURACIÃ“N COGNITIVA
// ============================================================================
// Identificar pensamientos que bloquean y ofrecer respuestas alternativas.
// NO es terapia, es "reencuadre" prÃ¡ctico y accesible.

export interface BlockingThought {
  id: string;
  thought: string;           // El pensamiento que bloquea
  pattern: CognitivePattern; // PatrÃ³n cognitivo
  response: string;          // Respuesta alternativa
  action: string;            // AcciÃ³n sugerida
  emoji: string;
}

export type CognitivePattern =
  | 'all_or_nothing'      // "Tiene que estar perfecto o no vale la pena"
  | 'fortune_telling'     // "No voy a poder"
  | 'magnification'       // "Es demasiado"
  | 'should_statements'   // "DeberÃ­a poder hacerlo"
  | 'emotional_reasoning' // "No me siento motivado, asÃ­ que no puedo"
  | 'mind_reading';       // "Los demÃ¡s piensan que soy un desastre"

/**
 * Pensamientos bloqueantes comunes y sus respuestas
 */
export const BLOCKING_THOUGHTS: BlockingThought[] = [
  // ALL OR NOTHING
  {
    id: 'perfect_or_nothing',
    thought: 'Si no lo hago perfecto, no vale la pena empezar',
    pattern: 'all_or_nothing',
    response: 'Hecho es mejor que perfecto. El 50% de algo es infinitamente mÃ¡s que el 100% de nada.',
    action: 'Haz solo el nivel bÃ¡sico. Eso ya es un logro.',
    emoji: 'ðŸŽ¯'
  },
  {
    id: 'all_at_once',
    thought: 'Tengo que limpiar todo o no sirve de nada',
    pattern: 'all_or_nothing',
    response: 'Cada pequeÃ±a mejora suma. Una superficie limpia es mejor que ninguna.',
    action: 'Elige UNA sola cosa. Solo una.',
    emoji: '1ï¸âƒ£'
  },

  // FORTUNE TELLING
  {
    id: 'cant_do_it',
    thought: 'No voy a poder terminarlo',
    pattern: 'fortune_telling',
    response: 'No puedes saber el futuro. Lo que sÃ­ sabes es que no has empezado.',
    action: 'Empieza con 2 minutos. Solo 2.',
    emoji: 'ðŸ”®'
  },
  {
    id: 'will_fail',
    thought: 'Siempre empiezo y nunca termino',
    pattern: 'fortune_telling',
    response: 'El pasado no determina el futuro. Esta vez es diferente porque tienes apoyo.',
    action: 'Define "terminar" como algo muy pequeÃ±o.',
    emoji: 'ðŸ”„'
  },

  // MAGNIFICATION
  {
    id: 'too_much',
    thought: 'Es demasiado, no puedo con todo esto',
    pattern: 'magnification',
    response: 'Tu cerebro estÃ¡ magnificando. No tienes que hacer "todo", solo UNA cosa.',
    action: 'Ignora el resto. Elige una micro-tarea de 2 minutos.',
    emoji: 'ðŸ”'
  },
  {
    id: 'overwhelming',
    thought: 'El desorden es incontrolable',
    pattern: 'magnification',
    response: 'Lo que parece un monstruo es solo muchas cosas pequeÃ±as juntas.',
    action: 'Mira solo 1 metro cuadrado. Solo eso existe ahora.',
    emoji: 'ðŸ“¦'
  },

  // SHOULD STATEMENTS
  {
    id: 'should_be_easy',
    thought: 'DeberÃ­a ser capaz de mantener mi casa ordenada',
    pattern: 'should_statements',
    response: '"DeberÃ­a" es una palabra que genera culpa, no acciÃ³n. Cambia por "quiero intentar".',
    action: 'Suelta el "deberÃ­a". Haz lo que puedas hoy.',
    emoji: 'ðŸ’­'
  },
  {
    id: 'others_can',
    thought: 'Otros pueden, Â¿por quÃ© yo no?',
    pattern: 'should_statements',
    response: 'Cada persona tiene sus batallas. Compararte no ayuda, actuar sÃ­.',
    action: 'EnfÃ³cate en TU siguiente paso, no en los demÃ¡s.',
    emoji: 'ðŸ‘¤'
  },

  // EMOTIONAL REASONING
  {
    id: 'not_motivated',
    thought: 'No estoy motivado/a, asÃ­ que no puedo hacerlo',
    pattern: 'emotional_reasoning',
    response: 'La motivaciÃ³n NO precede a la acciÃ³n. La acciÃ³n GENERA motivaciÃ³n.',
    action: 'ActÃºa sin ganas. La energÃ­a viene despuÃ©s.',
    emoji: 'âš¡'
  },
  {
    id: 'dont_feel_like_it',
    thought: 'Cuando me sienta con ganas, lo harÃ©',
    pattern: 'emotional_reasoning',
    response: 'Esperar "sentirse listo" es una trampa. La acciÃ³n crea el sentimiento.',
    action: 'Empieza ahora, aunque sea 1 minuto.',
    emoji: 'ðŸš€'
  },

  // MIND READING
  {
    id: 'judge_me',
    thought: 'Si alguien ve mi casa, pensarÃ¡ que soy un desastre',
    pattern: 'mind_reading',
    response: 'No puedes leer mentes. La mayorÃ­a estÃ¡ demasiado ocupada con sus propios problemas.',
    action: 'Hazlo por ti, no por lo que otros piensen.',
    emoji: 'ðŸ§ '
  }
];

/**
 * Detecta el pensamiento bloqueante mÃ¡s probable segÃºn la barrera
 */
export function detectBlockingThought(barrier: Barrier): BlockingThought[] {
  const thoughtsByBarrier: Record<string, string[]> = {
    'anxiety': ['too_much', 'overwhelming', 'cant_do_it'],
    'too_much': ['too_much', 'all_at_once', 'overwhelming'],
    'not_perfect_time': ['perfect_or_nothing', 'should_be_easy'],
    'no_energy': ['not_motivated', 'dont_feel_like_it', 'will_fail'],
    'lack_energy': ['not_motivated', 'dont_feel_like_it'],
    'lack_motivation': ['not_motivated', 'dont_feel_like_it', 'cant_do_it'],
    'dont_know_first': ['all_at_once', 'too_much', 'will_fail'],
    'lack_time': ['all_at_once', 'perfect_or_nothing']
  };

  const thoughtIds = thoughtsByBarrier[barrier] || ['not_motivated', 'too_much'];
  return BLOCKING_THOUGHTS.filter(t => thoughtIds.includes(t.id));
}

/**
 * Genera una intervenciÃ³n de reestructuraciÃ³n cognitiva
 */
export function getCognitiveReframe(barrier: Barrier): {
  possibleThought: string;
  pattern: string;
  reframe: string;
  action: string;
} {
  const thoughts = detectBlockingThought(barrier);
  const selected = thoughts[Math.floor(Math.random() * thoughts.length)];

  const patternNames: Record<CognitivePattern, string> = {
    'all_or_nothing': 'Pensamiento todo-o-nada',
    'fortune_telling': 'Adivinar el futuro',
    'magnification': 'MagnificaciÃ³n',
    'should_statements': 'Exigencias ("deberÃ­a")',
    'emotional_reasoning': 'Razonamiento emocional',
    'mind_reading': 'Leer la mente'
  };

  return {
    possibleThought: selected.thought,
    pattern: patternNames[selected.pattern],
    reframe: selected.response,
    action: selected.action
  };
}

// ============================================================================
// 3. ACTIVACIÃ“N CONDUCTUAL GENERAL
// ============================================================================
// Sistema para trackear el ciclo: Estado inicial â†’ AcciÃ³n â†’ Estado final
// Refuerza que la acciÃ³n mejora el estado (aunque no siempre)

export interface BehavioralActivationLog {
  id: string;
  userId: string;
  timestamp: Date;

  // Estado PRE-acciÃ³n
  preActionMood: MoodLevel;
  preActionEnergy: 'very_low' | 'low' | 'medium' | 'high';
  preActionThought?: string; // Pensamiento antes de actuar (opcional)

  // La acciÃ³n
  actionType: 'micro_task' | 'exposure' | 'planned_activity';
  actionDescription: string;
  actionDuration: number; // minutos

  // Estado POST-acciÃ³n
  postActionMood?: MoodLevel;
  postActionEnergy?: 'very_low' | 'low' | 'medium' | 'high';
  postActionReflection?: string;

  // MÃ©tricas
  moodChange?: number; // -4 a +4
  energyChange?: number;
  completed: boolean;
}

export interface ActivationInsight {
  type: 'pattern' | 'encouragement' | 'learning';
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Genera insights basados en el historial de activaciÃ³n conductual
 */
export function generateActivationInsights(
  logs: BehavioralActivationLog[]
): ActivationInsight[] {
  const insights: ActivationInsight[] = [];

  if (logs.length < 3) {
    insights.push({
      type: 'encouragement',
      message: 'Cada registro nos ayuda a entender quÃ© funciona para ti. Â¡Sigue asÃ­!'
    });
    return insights;
  }

  // Calcular tasa de mejora
  const completedLogs = logs.filter(l => l.completed && l.moodChange !== undefined);
  const improvedCount = completedLogs.filter(l => l.moodChange! > 0).length;
  const improvementRate = completedLogs.length > 0
    ? Math.round((improvedCount / completedLogs.length) * 100)
    : 0;

  if (improvementRate >= 60) {
    insights.push({
      type: 'pattern',
      message: `El ${improvementRate}% de las veces que actÃºas, tu Ã¡nimo mejora. La acciÃ³n funciona para ti.`,
      data: { improvementRate }
    });
  }

  // Detectar mejor momento del dÃ­a
  const byTimeOfDay = groupByTimeOfDay(completedLogs);
  const bestTime = Object.entries(byTimeOfDay)
    .sort((a, b) => b[1].avgImprovement - a[1].avgImprovement)[0];

  if (bestTime && bestTime[1].avgImprovement > 0.5) {
    const timeLabels = { morning: 'maÃ±anas', afternoon: 'tardes', evening: 'noches' };
    insights.push({
      type: 'learning',
      message: `Tus ${timeLabels[bestTime[0] as keyof typeof timeLabels]} son especialmente productivas. Considera aprovecharlas.`,
      data: { bestTime: bestTime[0], avgImprovement: bestTime[1].avgImprovement }
    });
  }

  // Detectar tipo de tarea mÃ¡s efectiva
  const byActionType = groupByActionType(completedLogs);
  const bestAction = Object.entries(byActionType)
    .sort((a, b) => b[1].avgImprovement - a[1].avgImprovement)[0];

  if (bestAction && bestAction[1].avgImprovement > 0.3) {
    const actionLabels = {
      'micro_task': 'Las micro-tareas',
      'exposure': 'La exposiciÃ³n gradual',
      'planned_activity': 'Las actividades planificadas'
    };
    insights.push({
      type: 'pattern',
      message: `${actionLabels[bestAction[0] as keyof typeof actionLabels]} funcionan especialmente bien para ti.`,
      data: { bestAction: bestAction[0] }
    });
  }

  // Mensaje sobre consistencia
  const recentLogs = logs.filter(l =>
    l.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  if (recentLogs.length >= 5) {
    insights.push({
      type: 'encouragement',
      message: 'Â¡Gran consistencia esta semana! La regularidad es mÃ¡s importante que la intensidad.'
    });
  }

  return insights;
}

/**
 * Mensaje de refuerzo post-acciÃ³n basado en el cambio de estado
 */
export function getPostActionReinforcement(
  moodBefore: MoodLevel,
  moodAfter: MoodLevel,
  actionType: string
): string {
  const moodValues: Record<MoodLevel, number> = {
    'very_bad': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'very_good': 5
  };

  const change = moodValues[moodAfter] - moodValues[moodBefore];

  if (change >= 2) {
    return 'Â¡Gran mejora! Tu cerebro acaba de aprender que actuar ayuda. RecuÃ©rdalo.';
  } else if (change === 1) {
    return 'Mejoraste un poco. Eso es activaciÃ³n conductual en acciÃ³n.';
  } else if (change === 0) {
    return 'Tu Ã¡nimo se mantuvo, pero completaste algo. Eso cuenta.';
  } else if (change === -1) {
    return 'A veces actuar no mejora el Ã¡nimo inmediatamente. Pero hiciste algo, y eso importa.';
  } else {
    return 'Fue difÃ­cil, pero actuaste. A veces el cambio viene despuÃ©s, no durante.';
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getSpaceFriendlyName(space: string): string {
  const names: Record<string, string> = {
    'bedroom': 'el dormitorio',
    'bathroom': 'el baÃ±o',
    'kitchen': 'la cocina',
    'living_room': 'el salÃ³n',
    'dining_room': 'el comedor',
    'entrance': 'la entrada',
    'laundry': 'la zona de lavado',
    'office': 'el despacho',
    'garage': 'el garaje',
    'terrace': 'la terraza'
  };
  return names[space] || space;
}

function groupByTimeOfDay(logs: BehavioralActivationLog[]): Record<string, { count: number; avgImprovement: number }> {
  const groups: Record<string, { total: number; count: number }> = {
    morning: { total: 0, count: 0 },
    afternoon: { total: 0, count: 0 },
    evening: { total: 0, count: 0 }
  };

  for (const log of logs) {
    const hour = new Date(log.timestamp).getHours();
    let timeOfDay: string;
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    if (log.moodChange !== undefined) {
      groups[timeOfDay].total += log.moodChange;
      groups[timeOfDay].count++;
    }
  }

  const result: Record<string, { count: number; avgImprovement: number }> = {};
  for (const [key, value] of Object.entries(groups)) {
    result[key] = {
      count: value.count,
      avgImprovement: value.count > 0 ? value.total / value.count : 0
    };
  }
  return result;
}

function groupByActionType(logs: BehavioralActivationLog[]): Record<string, { count: number; avgImprovement: number }> {
  const groups: Record<string, { total: number; count: number }> = {};

  for (const log of logs) {
    if (!groups[log.actionType]) {
      groups[log.actionType] = { total: 0, count: 0 };
    }
    if (log.moodChange !== undefined) {
      groups[log.actionType].total += log.moodChange;
      groups[log.actionType].count++;
    }
  }

  const result: Record<string, { count: number; avgImprovement: number }> = {};
  for (const [key, value] of Object.entries(groups)) {
    result[key] = {
      count: value.count,
      avgImprovement: value.count > 0 ? value.total / value.count : 0
    };
  }
  return result;
}
