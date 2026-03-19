// @ts-nocheck
/**
 * MicroSessionService
 *
 * V18: Sistema de micro-sesiones TCC - versiones cortas (1-3 minutos)
 * de tÃ©cnicas terapÃ©uticas para momentos de baja energÃ­a o poco tiempo.
 *
 * Las micro-sesiones son intervenciones TCC simplificadas que:
 * - Duran 1-3 minutos mÃ¡ximo
 * - Requieren mÃ­nima energÃ­a cognitiva
 * - Pueden hacerse en cualquier momento
 * - Generan momentum para tÃ©cnicas mÃ¡s profundas
 */

import type {
  TCCTechnique,
  ThoughtEmotion,
  MoodLevel,
  RouteType,
} from '../db/database';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Tipo de micro-sesiÃ³n
 */
export type MicroSessionType =
  | 'breathing'           // RespiraciÃ³n consciente (1 min)
  | 'grounding'           // TÃ©cnica 5-4-3-2-1 (2 min)
  | 'quick_reframe'       // Reencuadre rÃ¡pido (2 min)
  | 'body_scan'           // Escaneo corporal breve (2 min)
  | 'gratitude'           // Gratitud rÃ¡pida (1 min)
  | 'self_compassion'     // Frase de autocompasiÃ³n (1 min)
  | 'micro_exposure'      // Micro-exposiciÃ³n (1 min)
  | 'thought_defusion'    // DefusiÃ³n de pensamiento (1 min)
  | 'values_check'        // Chequeo de valores (1 min)
  | 'opposite_action';    // AcciÃ³n opuesta (2 min)

/**
 * DefiniciÃ³n de una micro-sesiÃ³n
 */
export interface MicroSessionDefinition {
  type: MicroSessionType;
  name: string;
  description: string;
  durationSeconds: number;
  emoji: string;

  /** TÃ©cnica TCC padre de la que deriva */
  parentTechnique: TCCTechnique;

  /** Emociones para las que es efectiva */
  effectiveFor: ThoughtEmotion[];

  /** Estados de Ã¡nimo recomendados */
  suitableForMoods: MoodLevel[];

  /** Rutas donde es Ãºtil */
  suitableForRoutes: RouteType[];

  /** Nivel de energÃ­a requerido (1=muy bajo, 5=alto) */
  energyRequired: 1 | 2 | 3 | 4 | 5;

  /** Instrucciones paso a paso */
  steps: MicroSessionStep[];

  /** Puntos base por completar */
  basePoints: number;

  /** Mensaje de cierre */
  closingMessage: string;
}

/**
 * Paso de una micro-sesiÃ³n
 */
export interface MicroSessionStep {
  instruction: string;
  durationSeconds: number;
  type: 'action' | 'prompt' | 'reflection' | 'breathing' | 'visualization';
  optional?: boolean;
}

/**
 * SesiÃ³n en progreso
 */
export interface MicroSessionInProgress {
  sessionType: MicroSessionType;
  startedAt: Date;
  currentStep: number;
  responses?: Record<number, string>;
  moodBefore?: MoodLevel;
}

/**
 * Resultado de una micro-sesiÃ³n completada
 */
export interface MicroSessionResult {
  sessionType: MicroSessionType;
  completedAt: Date;
  durationSeconds: number;
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  moodChange?: number;
  pointsEarned: number;
  responses?: Record<number, string>;
  userRating?: 1 | 2 | 3 | 4 | 5;
}

// ============================================================================
// DEFINICIONES DE MICRO-SESIONES
// ============================================================================

export const MICRO_SESSIONS: Record<MicroSessionType, MicroSessionDefinition> = {
  breathing: {
    type: 'breathing',
    name: 'RespiraciÃ³n 4-7-8',
    description: 'TÃ©cnica de respiraciÃ³n para calmar el sistema nervioso',
    durationSeconds: 60,
    emoji: 'ðŸŒ¬ï¸',
    parentTechnique: 'relaxation',
    effectiveFor: ['anxious', 'overwhelmed', 'angry', 'frustrated'],
    suitableForMoods: ['very_bad', 'bad', 'neutral', 'good', 'very_good'],
    suitableForRoutes: ['overwhelmed', 'hardtostart', 'tengoalgodeenergia', 'good'],
    energyRequired: 1,
    basePoints: 5,
    steps: [
      { instruction: 'Inhala por la nariz contando hasta 4', durationSeconds: 4, type: 'breathing' },
      { instruction: 'MantÃ©n el aire contando hasta 7', durationSeconds: 7, type: 'breathing' },
      { instruction: 'Exhala por la boca contando hasta 8', durationSeconds: 8, type: 'breathing' },
      { instruction: 'Repite: Inhala (4)', durationSeconds: 4, type: 'breathing' },
      { instruction: 'MantÃ©n (7)', durationSeconds: 7, type: 'breathing' },
      { instruction: 'Exhala (8)', durationSeconds: 8, type: 'breathing' },
      { instruction: 'Una vez mÃ¡s: Inhala (4)', durationSeconds: 4, type: 'breathing' },
      { instruction: 'MantÃ©n (7)', durationSeconds: 7, type: 'breathing' },
      { instruction: 'Exhala lentamente (8)', durationSeconds: 8, type: 'breathing' },
    ],
    closingMessage: 'Has activado tu respuesta de relajaciÃ³n. TÃ³mate un momento para notar cÃ³mo te sientes.',
  },

  grounding: {
    type: 'grounding',
    name: 'Anclaje 5-4-3-2-1',
    description: 'TÃ©cnica de grounding para volver al presente',
    durationSeconds: 120,
    emoji: 'ðŸŒ³',
    parentTechnique: 'relaxation',
    effectiveFor: ['anxious', 'overwhelmed', 'hopeless'],
    suitableForMoods: ['very_bad', 'bad', 'neutral'],
    suitableForRoutes: ['overwhelmed', 'hardtostart'],
    energyRequired: 2,
    basePoints: 8,
    steps: [
      { instruction: 'Observa 5 cosas que puedes VER a tu alrededor', durationSeconds: 20, type: 'action' },
      { instruction: 'Identifica 4 cosas que puedes TOCAR', durationSeconds: 20, type: 'action' },
      { instruction: 'Escucha 3 sonidos que puedes OÃR', durationSeconds: 20, type: 'action' },
      { instruction: 'Nota 2 cosas que puedes OLER', durationSeconds: 20, type: 'action' },
      { instruction: 'Identifica 1 cosa que puedes SABOREAR', durationSeconds: 15, type: 'action' },
      { instruction: 'Respira profundo. EstÃ¡s aquÃ­, en el presente.', durationSeconds: 10, type: 'reflection' },
    ],
    closingMessage: 'Bien hecho. Has regresado al momento presente. La ansiedad es temporal.',
  },

  quick_reframe: {
    type: 'quick_reframe',
    name: 'Reencuadre RÃ¡pido',
    description: 'VersiÃ³n express del detective de pensamientos',
    durationSeconds: 120,
    emoji: 'ðŸ”„',
    parentTechnique: 'cognitive_restructuring',
    effectiveFor: ['anxious', 'sad', 'guilty', 'frustrated'],
    suitableForMoods: ['bad', 'neutral', 'good'],
    suitableForRoutes: ['hardtostart', 'tengoalgodeenergia'],
    energyRequired: 3,
    basePoints: 10,
    steps: [
      { instruction: 'Â¿CuÃ¡l es el pensamiento que te molesta?', durationSeconds: 20, type: 'prompt' },
      { instruction: 'Â¿Este pensamiento es un hecho o una interpretaciÃ³n?', durationSeconds: 15, type: 'reflection' },
      { instruction: 'Â¿QuÃ© le dirÃ­as a un amigo con este pensamiento?', durationSeconds: 25, type: 'prompt' },
      { instruction: 'Reformula el pensamiento de forma mÃ¡s equilibrada', durationSeconds: 30, type: 'prompt' },
      { instruction: 'Respira y reconoce tu esfuerzo', durationSeconds: 10, type: 'breathing' },
    ],
    closingMessage: 'Has practicado ver las cosas desde otra perspectiva. Eso requiere valentÃ­a.',
  },

  body_scan: {
    type: 'body_scan',
    name: 'Escaneo Corporal Express',
    description: 'Breve reconocimiento de sensaciones corporales',
    durationSeconds: 90,
    emoji: 'ðŸ§˜',
    parentTechnique: 'relaxation',
    effectiveFor: ['anxious', 'overwhelmed', 'angry'],
    suitableForMoods: ['very_bad', 'bad', 'neutral'],
    suitableForRoutes: ['overwhelmed', 'hardtostart'],
    energyRequired: 1,
    basePoints: 6,
    steps: [
      { instruction: 'Cierra los ojos. Nota cÃ³mo sientes los pies', durationSeconds: 10, type: 'visualization' },
      { instruction: 'Sube la atenciÃ³n a las piernas y caderas', durationSeconds: 10, type: 'visualization' },
      { instruction: 'Observa tu abdomen y espalda baja', durationSeconds: 10, type: 'visualization' },
      { instruction: 'Nota tu pecho y hombros', durationSeconds: 10, type: 'visualization' },
      { instruction: 'Siente tus brazos y manos', durationSeconds: 10, type: 'visualization' },
      { instruction: 'Observa tu cuello y cabeza', durationSeconds: 10, type: 'visualization' },
      { instruction: 'Siente todo tu cuerpo como un todo', durationSeconds: 15, type: 'visualization' },
      { instruction: 'Abre los ojos lentamente', durationSeconds: 5, type: 'action' },
    ],
    closingMessage: 'Has conectado con tu cuerpo. Esta consciencia te ayuda a regular tus emociones.',
  },

  gratitude: {
    type: 'gratitude',
    name: 'Gratitud RÃ¡pida',
    description: 'Reconocer algo positivo en tu dÃ­a',
    durationSeconds: 60,
    emoji: 'ðŸ™',
    parentTechnique: 'behavioral_activation',
    effectiveFor: ['sad', 'hopeless', 'guilty'],
    suitableForMoods: ['bad', 'neutral', 'good', 'very_good'],
    suitableForRoutes: ['hardtostart', 'tengoalgodeenergia', 'good'],
    energyRequired: 2,
    basePoints: 5,
    steps: [
      { instruction: 'Piensa en UNA cosa buena de hoy, por pequeÃ±a que sea', durationSeconds: 20, type: 'prompt' },
      { instruction: 'Â¿Por quÃ© esa cosa es significativa para ti?', durationSeconds: 20, type: 'reflection' },
      { instruction: 'TÃ³mate un momento para sentir agradecimiento', durationSeconds: 15, type: 'reflection' },
    ],
    closingMessage: 'Reconocer lo bueno, incluso en dÃ­as difÃ­ciles, fortalece tu resiliencia.',
  },

  self_compassion: {
    type: 'self_compassion',
    name: 'Momento de AutocompasiÃ³n',
    description: 'Breve prÃ¡ctica de amabilidad hacia ti mismo',
    durationSeconds: 60,
    emoji: 'ðŸ’š',
    parentTechnique: 'self_compassion',
    effectiveFor: ['guilty', 'ashamed', 'sad', 'frustrated'],
    suitableForMoods: ['very_bad', 'bad', 'neutral'],
    suitableForRoutes: ['overwhelmed', 'hardtostart'],
    energyRequired: 1,
    basePoints: 6,
    steps: [
      { instruction: 'Reconoce: "Este es un momento difÃ­cil"', durationSeconds: 10, type: 'action' },
      { instruction: 'Recuerda: "El sufrimiento es parte de ser humano"', durationSeconds: 10, type: 'reflection' },
      { instruction: 'Pon una mano en tu corazÃ³n', durationSeconds: 5, type: 'action' },
      { instruction: 'Dite: "Que pueda ser amable conmigo mismo/a"', durationSeconds: 15, type: 'action' },
      { instruction: 'Respira con esa intenciÃ³n de bondad', durationSeconds: 15, type: 'breathing' },
    ],
    closingMessage: 'Mereces la misma compasiÃ³n que darÃ­as a alguien que quieres.',
  },

  micro_exposure: {
    type: 'micro_exposure',
    name: 'Micro-ExposiciÃ³n',
    description: 'PequeÃ±o paso hacia algo que evitas',
    durationSeconds: 60,
    emoji: 'ðŸŽ¯',
    parentTechnique: 'gradual_exposure',
    effectiveFor: ['anxious', 'overwhelmed'],
    suitableForMoods: ['neutral', 'good'],
    suitableForRoutes: ['tengoalgodeenergia', 'good'],
    energyRequired: 3,
    basePoints: 10,
    steps: [
      { instruction: 'Piensa en algo que has estado evitando', durationSeconds: 10, type: 'prompt' },
      { instruction: 'Â¿CuÃ¡l es el paso MÃS PEQUEÃ‘O que podrÃ­as dar?', durationSeconds: 15, type: 'prompt' },
      { instruction: 'ImagÃ­nate dando ese paso. Â¿CÃ³mo se siente?', durationSeconds: 15, type: 'visualization' },
      { instruction: 'Â¿Puedes comprometerte a intentarlo hoy?', durationSeconds: 10, type: 'reflection' },
    ],
    closingMessage: 'Cada pequeÃ±o paso cuenta. La valentÃ­a no es ausencia de miedo, sino actuar a pesar de Ã©l.',
  },

  thought_defusion: {
    type: 'thought_defusion',
    name: 'DefusiÃ³n de Pensamiento',
    description: 'Separarte de un pensamiento negativo',
    durationSeconds: 60,
    emoji: 'â˜ï¸',
    parentTechnique: 'cognitive_restructuring',
    effectiveFor: ['anxious', 'sad', 'guilty', 'hopeless'],
    suitableForMoods: ['very_bad', 'bad', 'neutral'],
    suitableForRoutes: ['overwhelmed', 'hardtostart'],
    energyRequired: 2,
    basePoints: 7,
    steps: [
      { instruction: 'Identifica el pensamiento negativo', durationSeconds: 10, type: 'prompt' },
      { instruction: 'AÃ±ade "Estoy notando que tengo el pensamiento de que..."', durationSeconds: 15, type: 'action' },
      { instruction: 'RepÃ­telo en voz de dibujo animado (mentalmente)', durationSeconds: 15, type: 'action' },
      { instruction: 'Observa: el pensamiento es solo palabras, no la realidad', durationSeconds: 15, type: 'reflection' },
    ],
    closingMessage: 'Los pensamientos van y vienen como nubes. No tienes que creer todo lo que piensas.',
  },

  values_check: {
    type: 'values_check',
    name: 'Chequeo de Valores',
    description: 'Reconectar con lo que importa',
    durationSeconds: 60,
    emoji: 'â­',
    parentTechnique: 'behavioral_activation',
    effectiveFor: ['hopeless', 'sad', 'frustrated'],
    suitableForMoods: ['bad', 'neutral', 'good'],
    suitableForRoutes: ['hardtostart', 'tengoalgodeenergia'],
    energyRequired: 2,
    basePoints: 6,
    steps: [
      { instruction: 'Â¿QuÃ© es importante para ti en la vida?', durationSeconds: 15, type: 'prompt' },
      { instruction: 'Â¿Hay algo pequeÃ±o que puedas hacer hoy que honre ese valor?', durationSeconds: 20, type: 'prompt' },
      { instruction: 'Visualiza cÃ³mo te sentirÃ­as al hacerlo', durationSeconds: 15, type: 'visualization' },
    ],
    closingMessage: 'Vivir segÃºn tus valores, incluso en pequeÃ±as acciones, da significado a cada dÃ­a.',
  },

  opposite_action: {
    type: 'opposite_action',
    name: 'AcciÃ³n Opuesta',
    description: 'Actuar de forma contraria a la emociÃ³n',
    durationSeconds: 90,
    emoji: 'ðŸ”€',
    parentTechnique: 'behavioral_activation',
    effectiveFor: ['sad', 'anxious', 'angry', 'guilty'],
    suitableForMoods: ['very_bad', 'bad', 'neutral'],
    suitableForRoutes: ['overwhelmed', 'hardtostart'],
    energyRequired: 3,
    basePoints: 10,
    steps: [
      { instruction: 'Â¿QuÃ© emociÃ³n difÃ­cil sientes ahora?', durationSeconds: 10, type: 'prompt' },
      { instruction: 'Â¿QuÃ© te impulsa a hacer esa emociÃ³n?', durationSeconds: 15, type: 'reflection' },
      { instruction: 'Â¿CuÃ¡l serÃ­a la acciÃ³n OPUESTA?', durationSeconds: 15, type: 'prompt' },
      { instruction: 'Haz una versiÃ³n pequeÃ±a de la acciÃ³n opuesta', durationSeconds: 30, type: 'action' },
      { instruction: 'Nota cÃ³mo cambiÃ³ tu estado', durationSeconds: 10, type: 'reflection' },
    ],
    closingMessage: 'A veces, cambiar lo que hacemos cambia cÃ³mo nos sentimos. Bien hecho.',
  },
};

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

/**
 * Obtiene micro-sesiones recomendadas para el contexto actual
 */
export function getRecommendedMicroSessions(context: {
  mood?: MoodLevel;
  emotion?: ThoughtEmotion;
  route?: RouteType;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  availableSeconds?: number;
}): MicroSessionDefinition[] {
  const sessions = Object.values(MICRO_SESSIONS);

  // Filtrar por tiempo disponible
  let filtered = context.availableSeconds
    ? sessions.filter(s => s.durationSeconds <= context.availableSeconds!)
    : sessions;

  // Filtrar por energÃ­a disponible
  if (context.energyLevel) {
    filtered = filtered.filter(s => s.energyRequired <= context.energyLevel!);
  }

  // Ordenar por relevancia
  const scored = filtered.map(session => {
    let score = 0;

    // Match con emociÃ³n
    if (context.emotion && session.effectiveFor.includes(context.emotion)) {
      score += 30;
    }

    // Match con mood
    if (context.mood && session.suitableForMoods.includes(context.mood)) {
      score += 20;
    }

    // Match con ruta
    if (context.route && session.suitableForRoutes.includes(context.route)) {
      score += 15;
    }

    // Bonus por bajo requerimiento de energÃ­a cuando hay baja energÃ­a
    if (context.energyLevel && context.energyLevel <= 2 && session.energyRequired <= 2) {
      score += 10;
    }

    return { session, score };
  });

  // Ordenar por score y retornar
  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.session);
}

/**
 * Obtiene una micro-sesiÃ³n por tipo
 */
export function getMicroSession(type: MicroSessionType): MicroSessionDefinition {
  return MICRO_SESSIONS[type];
}

/**
 * Obtiene todas las micro-sesiones disponibles
 */
export function getAllMicroSessions(): MicroSessionDefinition[] {
  return Object.values(MICRO_SESSIONS);
}

/**
 * Obtiene micro-sesiones por tÃ©cnica padre
 */
export function getMicroSessionsByParentTechnique(
  technique: TCCTechnique
): MicroSessionDefinition[] {
  return Object.values(MICRO_SESSIONS).filter(s => s.parentTechnique === technique);
}

/**
 * Calcula los puntos ganados por una micro-sesiÃ³n
 */
export function calculateMicroSessionPoints(
  sessionType: MicroSessionType,
  result: {
    completed: boolean;
    moodChange?: number;
    userRating?: 1 | 2 | 3 | 4 | 5;
    durationSeconds: number;
  }
): { points: number; bonuses: string[] } {
  const session = MICRO_SESSIONS[sessionType];
  let points = 0;
  const bonuses: string[] = [];

  if (!result.completed) {
    // Puntos parciales por intentar
    points = Math.floor(session.basePoints * 0.3);
    bonuses.push('Puntos por intentarlo');
    return { points, bonuses };
  }

  // Puntos base
  points = session.basePoints;
  bonuses.push(`${session.name} completada`);

  // Bonus por mejora de Ã¡nimo
  if (result.moodChange && result.moodChange > 0) {
    const moodBonus = result.moodChange * 2;
    points += moodBonus;
    bonuses.push(`+${moodBonus} por mejora de Ã¡nimo`);
  }

  // Bonus por rating alto
  if (result.userRating && result.userRating >= 4) {
    const ratingBonus = result.userRating === 5 ? 5 : 3;
    points += ratingBonus;
    bonuses.push(`+${ratingBonus} por sesiÃ³n efectiva`);
  }

  return { points, bonuses };
}

/**
 * Genera un mensaje motivacional basado en la micro-sesiÃ³n completada
 */
export function getCompletionMessage(sessionType: MicroSessionType): string {
  const session = MICRO_SESSIONS[sessionType];
  return session.closingMessage;
}

/**
 * Sugiere la siguiente micro-sesiÃ³n basada en la anterior
 */
export function suggestNextMicroSession(
  previousSession: MicroSessionType,
  context: {
    mood?: MoodLevel;
    emotion?: ThoughtEmotion;
  }
): MicroSessionDefinition | null {
  const previous = MICRO_SESSIONS[previousSession];

  // Buscar sesiones complementarias
  const complementary: Record<MicroSessionType, MicroSessionType[]> = {
    breathing: ['body_scan', 'grounding'],
    grounding: ['breathing', 'self_compassion'],
    quick_reframe: ['thought_defusion', 'values_check'],
    body_scan: ['breathing', 'self_compassion'],
    gratitude: ['values_check', 'self_compassion'],
    self_compassion: ['gratitude', 'breathing'],
    micro_exposure: ['breathing', 'self_compassion'],
    thought_defusion: ['quick_reframe', 'self_compassion'],
    values_check: ['gratitude', 'opposite_action'],
    opposite_action: ['values_check', 'breathing'],
  };

  const suggestions = complementary[previousSession];
  if (!suggestions || suggestions.length === 0) return null;

  // Filtrar por contexto actual
  const candidates = suggestions
    .map(type => MICRO_SESSIONS[type])
    .filter(session => {
      if (context.mood && !session.suitableForMoods.includes(context.mood)) {
        return false;
      }
      if (context.emotion && !session.effectiveFor.includes(context.emotion)) {
        return false;
      }
      return true;
    });

  return candidates[0] || MICRO_SESSIONS[suggestions[0]];
}

/**
 * Obtiene estadÃ­sticas de uso de micro-sesiones
 * (Esta funciÃ³n se conectarÃ­a con la base de datos en implementaciÃ³n real)
 */
export function getMicroSessionCategories(): Array<{
  category: string;
  emoji: string;
  sessions: MicroSessionType[];
  description: string;
}> {
  return [
    {
      category: 'Calma RÃ¡pida',
      emoji: 'ðŸŒŠ',
      sessions: ['breathing', 'grounding', 'body_scan'],
      description: 'Para cuando necesitas reducir la ansiedad rÃ¡pidamente',
    },
    {
      category: 'Cambio de Perspectiva',
      emoji: 'ðŸ’¡',
      sessions: ['quick_reframe', 'thought_defusion', 'values_check'],
      description: 'Para cuando los pensamientos te atrapan',
    },
    {
      category: 'AutocompasiÃ³n',
      emoji: 'ðŸ’š',
      sessions: ['self_compassion', 'gratitude'],
      description: 'Para cuando necesitas ser amable contigo',
    },
    {
      category: 'ActivaciÃ³n',
      emoji: 'âš¡',
      sessions: ['micro_exposure', 'opposite_action'],
      description: 'Para romper ciclos de evitaciÃ³n',
    },
  ];
}

// Tipos exportados inline arriba (export type ...)
