// @ts-nocheck
/**
 * AnÃ¡lisis Funcional Profundo (ABC Extendido)
 *
 * Extiende el anÃ¡lisis funcional bÃ¡sico con:
 * - Consecuencias a largo plazo (quÃ© mantiene el ciclo)
 * - Refuerzos positivos/negativos identificados
 * - FunciÃ³n del comportamiento (Â¿quÃ© logra la evitaciÃ³n?)
 * - ConexiÃ³n con pensamientos automÃ¡ticos
 * - Cadenas conductuales completas
 *
 * Basado en el modelo de AnÃ¡lisis Funcional de la TCC de tercera generaciÃ³n.
 */

import {
  db,
  FunctionalAnalysis,
  TCCTechnique,
  CognitivePattern,
  ThoughtEmotion,
  TimeSlot,
} from '../db/database';

// ============================================================================
// TIPOS EXTENDIDOS
// ============================================================================

/**
 * Tipo de refuerzo que mantiene el comportamiento
 */
export type ReinforcementType =
  | 'positive_reinforcement'    // Gano algo agradable
  | 'negative_reinforcement'    // Evito algo desagradable
  | 'automatic_positive'        // SensaciÃ³n fÃ­sica agradable
  | 'automatic_negative';       // Alivio de sensaciÃ³n desagradable

/**
 * FunciÃ³n que cumple el comportamiento
 */
export type BehaviorFunction =
  | 'escape_discomfort'         // Escapar de malestar
  | 'avoid_failure'             // Evitar fallar
  | 'avoid_judgment'            // Evitar juicio de otros
  | 'maintain_control'          // Mantener sensaciÃ³n de control
  | 'reduce_anxiety'            // Reducir ansiedad
  | 'preserve_energy'           // Preservar energÃ­a
  | 'delay_decision'            // Postergar decisiÃ³n
  | 'seek_comfort'              // Buscar comodidad inmediata
  | 'protect_self_esteem';      // Proteger autoestima

/**
 * AnÃ¡lisis Funcional Profundo - ExtensiÃ³n del ABC bÃ¡sico
 */
export interface DeepFunctionalAnalysis {
  // Referencia al anÃ¡lisis bÃ¡sico
  basicAnalysisId?: number;
  userId: string;
  timestamp: Date;

  // ============================================
  // A - ANTECEDENTE EXPANDIDO
  // ============================================
  antecedent: {
    // SituaciÃ³n externa
    situation: string;
    location?: string;
    timeOfDay?: TimeSlot;
    peopleInvolved?: string[];

    // Disparadores internos
    internalTriggers: {
      thoughts: string[];              // Pensamientos automÃ¡ticos
      emotions: ThoughtEmotion[];      // Emociones presentes
      physicalSensations: string[];    // Sensaciones fÃ­sicas
      urges: string[];                 // Urgencias/impulsos
    };

    // Disparadores externos
    externalTriggers: {
      events: string[];                // Eventos externos
      cues: string[];                  // SeÃ±ales ambientales
      socialPressure?: string;         // PresiÃ³n social
    };

    // Patrones cognitivos detectados
    cognitivePatterns: CognitivePattern[];

    // Contexto previo
    precedingEvents?: string;          // Â¿QuÃ© pasÃ³ justo antes?
    recentStressors?: string[];        // Estresores recientes
  };

  // ============================================
  // B - COMPORTAMIENTO DETALLADO
  // ============================================
  behavior: {
    description: string;
    type: 'avoidance' | 'procrastination' | 'escape' | 'compulsion' | 'other';

    // CaracterÃ­sticas del comportamiento
    duration?: number;                  // Minutos
    intensity: 1 | 2 | 3 | 4 | 5;
    frequency?: 'rarely' | 'sometimes' | 'often' | 'very_often';

    // Comportamientos asociados
    chainBehaviors?: string[];          // Cadena de comportamientos
    alternativeAttempted?: string;      // Â¿IntentÃ³ algo diferente?
    automaticity: 1 | 2 | 3 | 4 | 5;    // QuÃ© tan automÃ¡tico fue
  };

  // ============================================
  // C - CONSECUENCIAS MULTINIVEL
  // ============================================
  consequences: {
    // Inmediatas (segundos a minutos)
    immediate: {
      emotionalChange: {
        before: ThoughtEmotion[];
        after: ThoughtEmotion[];
        relief: boolean;
        reliefLevel?: 1 | 2 | 3 | 4 | 5;
      };
      physicalChange?: string;
      thoughtChange?: string;
    };

    // A corto plazo (horas a un dÃ­a)
    shortTerm: {
      emotionalState: string;
      taskStatus: 'postponed' | 'partial' | 'avoided' | 'completed';
      secondaryProblems?: string[];
      guilt?: boolean;
      relief?: boolean;
    };

    // A largo plazo (dÃ­as a semanas)
    longTerm: {
      patternStrengthened: boolean;     // Â¿Se reforzÃ³ el patrÃ³n?
      skillsLost?: string[];            // Habilidades que se pierden
      opportunitiesMissed?: string[];   // Oportunidades perdidas
      relationshipImpact?: string;      // Impacto en relaciones
      selfImageImpact?: string;         // Impacto en autoimagen
      anxietyIncrease?: boolean;        // Â¿AumentÃ³ la ansiedad base?
    };
  };

  // ============================================
  // ANÃLISIS DE REFUERZO
  // ============================================
  reinforcement: {
    type: ReinforcementType;
    description: string;

    // Â¿QuÃ© gana el usuario?
    whatIsGained: string[];

    // Â¿QuÃ© evita el usuario?
    whatIsAvoided: string[];

    // Potencia del refuerzo
    strength: 1 | 2 | 3 | 4 | 5;

    // Â¿El refuerzo es inmediato?
    isImmediate: boolean;
  };

  // ============================================
  // FUNCIÃ“N DEL COMPORTAMIENTO
  // ============================================
  behaviorFunction: {
    primaryFunction: BehaviorFunction;
    secondaryFunctions?: BehaviorFunction[];

    // AnÃ¡lisis profundo
    whatDoesItProtectFrom: string;      // Â¿De quÃ© protege?
    whatDoesItProvide: string;          // Â¿QuÃ© proporciona?
    hiddenNeed: string;                 // Necesidad subyacente

    // Alternativas funcionales
    alternativeWaysToMeetNeed: string[];
  };

  // ============================================
  // CONEXIÃ“N PENSAMIENTO-COMPORTAMIENTO
  // ============================================
  cognitiveLink: {
    // Pensamientos automÃ¡ticos clave
    automaticThoughts: Array<{
      thought: string;
      believability: 1 | 2 | 3 | 4 | 5;  // QuÃ© tan creÃ­ble parece
      pattern?: CognitivePattern;
    }>;

    // Creencias subyacentes
    underlyingBeliefs?: string[];

    // Reglas/Suposiciones
    rules?: string[];                    // "Si... entonces..."

    // Pensamientos alternativos generados
    alternativeThoughts?: Array<{
      original: string;
      alternative: string;
      helpfulness: 1 | 2 | 3 | 4 | 5;
    }>;
  };

  // ============================================
  // CICLO DE MANTENIMIENTO
  // ============================================
  maintenanceCycle: {
    // Factores que mantienen el ciclo
    maintainingFactors: Array<{
      factor: string;
      type: 'cognitive' | 'emotional' | 'behavioral' | 'environmental' | 'social';
      strength: 1 | 2 | 3 | 4 | 5;
    }>;

    // Puntos de intervenciÃ³n
    interventionPoints: Array<{
      point: 'before_trigger' | 'at_trigger' | 'during_behavior' | 'after_behavior';
      intervention: string;
      difficulty: 1 | 2 | 3 | 4 | 5;
      technique?: TCCTechnique;
    }>;

    // PredicciÃ³n
    predictedOutcomeIfContinues: string;
    predictedOutcomeIfChanges: string;
  };

  // ============================================
  // INTERVENCIÃ“N SUGERIDA
  // ============================================
  suggestedInterventions: Array<{
    technique: TCCTechnique;
    reason: string;
    targetedFactor: string;             // QuÃ© factor aborda
    priority: 1 | 2 | 3;
    steps?: string[];
  }>;

  // Metadata
  analysisDepth: 'basic' | 'intermediate' | 'deep';
  completedSections: string[];
}

// ============================================================================
// INFORMACIÃ“N DE REFERENCIA
// ============================================================================

export const REINFORCEMENT_INFO: Record<ReinforcementType, {
  name: string;
  description: string;
  example: string;
  emoji: string;
}> = {
  positive_reinforcement: {
    name: 'Refuerzo Positivo',
    description: 'Ganas algo agradable como resultado del comportamiento',
    example: 'Procrastinar te da tiempo para algo mÃ¡s divertido',
    emoji: 'ðŸŽ',
  },
  negative_reinforcement: {
    name: 'Refuerzo Negativo',
    description: 'Evitas algo desagradable como resultado del comportamiento',
    example: 'Evitar la tarea te libra de la ansiedad de hacerla',
    emoji: 'ðŸ›¡ï¸',
  },
  automatic_positive: {
    name: 'Refuerzo AutomÃ¡tico Positivo',
    description: 'El comportamiento produce sensaciones fÃ­sicas agradables',
    example: 'Quedarte en el sofÃ¡ se siente cÃ³modo y relajante',
    emoji: 'ðŸ˜Œ',
  },
  automatic_negative: {
    name: 'Refuerzo AutomÃ¡tico Negativo',
    description: 'El comportamiento alivia sensaciones fÃ­sicas desagradables',
    example: 'Evitar reduce la tensiÃ³n fÃ­sica de la ansiedad',
    emoji: 'ðŸ’¨',
  },
};

export const BEHAVIOR_FUNCTION_INFO: Record<BehaviorFunction, {
  name: string;
  description: string;
  underlyingNeed: string;
  alternativeStrategies: string[];
  relatedTechniques: TCCTechnique[];
}> = {
  escape_discomfort: {
    name: 'Escapar del Malestar',
    description: 'El comportamiento te aleja de una situaciÃ³n o sensaciÃ³n incÃ³moda',
    underlyingNeed: 'Necesidad de regulaciÃ³n emocional',
    alternativeStrategies: [
      'Tolerar el malestar gradualmente',
      'TÃ©cnicas de relajaciÃ³n',
      'ExposiciÃ³n gradual',
    ],
    relatedTechniques: ['gradual_exposure', 'relaxation', 'self_compassion'],
  },
  avoid_failure: {
    name: 'Evitar el Fracaso',
    description: 'El comportamiento previene la posibilidad de fallar',
    underlyingNeed: 'Necesidad de competencia y logro',
    alternativeStrategies: [
      'Redefinir el Ã©xito como intentar',
      'Dividir en pasos pequeÃ±os',
      'Celebrar el proceso, no solo el resultado',
    ],
    relatedTechniques: ['cognitive_restructuring', 'micro_tasks', 'momentum_building'],
  },
  avoid_judgment: {
    name: 'Evitar el Juicio',
    description: 'El comportamiento te protege de la evaluaciÃ³n de otros',
    underlyingNeed: 'Necesidad de aceptaciÃ³n y pertenencia',
    alternativeStrategies: [
      'Cuestionar las suposiciones sobre lo que otros piensan',
      'Practicar auto-compasiÃ³n',
      'ExposiciÃ³n gradual a situaciones sociales',
    ],
    relatedTechniques: ['cognitive_restructuring', 'self_compassion', 'gradual_exposure'],
  },
  maintain_control: {
    name: 'Mantener el Control',
    description: 'El comportamiento te da sensaciÃ³n de control sobre la situaciÃ³n',
    underlyingNeed: 'Necesidad de autonomÃ­a y predictibilidad',
    alternativeStrategies: [
      'Identificar quÃ© SÃ puedes controlar',
      'Aceptar la incertidumbre',
      'Planificar lo planificable',
    ],
    relatedTechniques: ['activity_scheduling', 'problem_solving', 'cognitive_restructuring'],
  },
  reduce_anxiety: {
    name: 'Reducir la Ansiedad',
    description: 'El comportamiento disminuye la ansiedad a corto plazo',
    underlyingNeed: 'Necesidad de seguridad emocional',
    alternativeStrategies: [
      'ExposiciÃ³n gradual',
      'TÃ©cnicas de relajaciÃ³n',
      'ReestructuraciÃ³n cognitiva de amenazas',
    ],
    relatedTechniques: ['gradual_exposure', 'relaxation', 'cognitive_restructuring'],
  },
  preserve_energy: {
    name: 'Preservar EnergÃ­a',
    description: 'El comportamiento conserva recursos fÃ­sicos o mentales',
    underlyingNeed: 'Necesidad de descanso y recuperaciÃ³n',
    alternativeStrategies: [
      'Micro-tareas de bajo esfuerzo',
      'Descansos programados',
      'PriorizaciÃ³n efectiva',
    ],
    relatedTechniques: ['micro_tasks', 'activity_scheduling', 'self_compassion'],
  },
  delay_decision: {
    name: 'Postergar la DecisiÃ³n',
    description: 'El comportamiento evita tener que decidir',
    underlyingNeed: 'Necesidad de certeza antes de actuar',
    alternativeStrategies: [
      'Decisiones "suficientemente buenas"',
      'Establecer lÃ­mites de tiempo para decidir',
      'Aceptar la imperfecciÃ³n',
    ],
    relatedTechniques: ['problem_solving', 'cognitive_restructuring', 'behavioral_activation'],
  },
  seek_comfort: {
    name: 'Buscar Comodidad',
    description: 'El comportamiento te lleva a algo agradable ahora',
    underlyingNeed: 'Necesidad de placer y bienestar',
    alternativeStrategies: [
      'Recompensas despuÃ©s de tareas',
      'Hacer la tarea mÃ¡s agradable',
      'ActivaciÃ³n conductual con actividades placenteras',
    ],
    relatedTechniques: ['behavioral_activation', 'activity_scheduling', 'micro_tasks'],
  },
  protect_self_esteem: {
    name: 'Proteger la Autoestima',
    description: 'El comportamiento evita confirmar creencias negativas sobre ti',
    underlyingNeed: 'Necesidad de valor propio',
    alternativeStrategies: [
      'Separar identidad de acciones',
      'Auto-compasiÃ³n',
      'Evidencia contra creencias negativas',
    ],
    relatedTechniques: ['self_compassion', 'cognitive_restructuring', 'behavioral_activation'],
  },
};

// ============================================================================
// OPERACIONES
// ============================================================================

/**
 * Crea un anÃ¡lisis funcional profundo
 */
export async function createDeepFunctionalAnalysis(
  analysis: Omit<DeepFunctionalAnalysis, 'timestamp'>
): Promise<number> {
  // Crear el anÃ¡lisis bÃ¡sico primero si no existe
  let basicAnalysisId = analysis.basicAnalysisId;

  if (!basicAnalysisId) {
    const basicAnalysis: Omit<FunctionalAnalysis, 'id'> = {
      userId: analysis.userId,
      timestamp: new Date(),
      antecedent: {
        situation: analysis.antecedent.situation,
        location: analysis.antecedent.location,
        timeOfDay: analysis.antecedent.timeOfDay,
        internalTrigger: analysis.antecedent.internalTriggers.thoughts[0],
        externalTrigger: analysis.antecedent.externalTriggers.events[0],
      },
      behavior: {
        description: analysis.behavior.description,
        type: analysis.behavior.type,
        duration: analysis.behavior.duration,
        intensity: analysis.behavior.intensity,
      },
      consequence: {
        shortTerm: {
          feeling: analysis.consequences.shortTerm.emotionalState,
          relief: analysis.consequences.immediate.emotionalChange.relief,
          reliefLevel: analysis.consequences.immediate.emotionalChange.reliefLevel,
        },
        longTerm: {
          feeling: analysis.maintenanceCycle.predictedOutcomeIfContinues,
          problemWorsened: analysis.consequences.longTerm.patternStrengthened,
        },
      },
      insights: {
        patternIdentified: analysis.maintenanceCycle.maintainingFactors[0]?.factor,
        maintainingFactors: analysis.maintenanceCycle.maintainingFactors.map(f => f.factor),
        alternativeBehaviors: analysis.behaviorFunction.alternativeWaysToMeetNeed,
      },
    };

    basicAnalysisId = await db.functionalAnalysis.add(basicAnalysis);
  }

  // TODO: Guardar el anÃ¡lisis profundo en una tabla separada
  // Por ahora retornamos el ID del anÃ¡lisis bÃ¡sico
  return basicAnalysisId as number;
}

/**
 * Analiza un comportamiento y sugiere su funciÃ³n
 */
export function analyzeBehaviorFunction(
  behaviorType: string,
  immediateRelief: boolean,
  automaticThoughts: string[]
): {
  suggestedFunction: BehaviorFunction;
  confidence: number;
  reasoning: string;
} {
  // AnÃ¡lisis basado en el tipo de comportamiento
  const functionsByBehavior: Record<string, BehaviorFunction[]> = {
    avoidance: ['escape_discomfort', 'reduce_anxiety', 'avoid_failure'],
    procrastination: ['seek_comfort', 'avoid_failure', 'delay_decision'],
    escape: ['escape_discomfort', 'reduce_anxiety', 'protect_self_esteem'],
    compulsion: ['reduce_anxiety', 'maintain_control', 'escape_discomfort'],
  };

  const possibleFunctions = functionsByBehavior[behaviorType] || ['escape_discomfort'];

  // Analizar pensamientos para refinar
  let suggestedFunction = possibleFunctions[0];
  let confidence = 0.5;
  let reasoning = 'Basado en el tipo de comportamiento.';

  // Buscar pistas en los pensamientos
  const thoughtsLower = automaticThoughts.map(t => t.toLowerCase()).join(' ');

  if (thoughtsLower.includes('fallar') || thoughtsLower.includes('fracaso')) {
    suggestedFunction = 'avoid_failure';
    confidence = 0.8;
    reasoning = 'Detectado miedo al fracaso en los pensamientos.';
  } else if (thoughtsLower.includes('pensar') || thoughtsLower.includes('juzgar')) {
    suggestedFunction = 'avoid_judgment';
    confidence = 0.8;
    reasoning = 'Detectada preocupaciÃ³n por el juicio de otros.';
  } else if (thoughtsLower.includes('energÃ­a') || thoughtsLower.includes('cansado')) {
    suggestedFunction = 'preserve_energy';
    confidence = 0.75;
    reasoning = 'Detectada preocupaciÃ³n por la energÃ­a.';
  } else if (thoughtsLower.includes('ansiedad') || thoughtsLower.includes('nervioso')) {
    suggestedFunction = 'reduce_anxiety';
    confidence = 0.8;
    reasoning = 'Detectada ansiedad como factor principal.';
  } else if (immediateRelief) {
    suggestedFunction = 'escape_discomfort';
    confidence = 0.7;
    reasoning = 'El alivio inmediato sugiere escape del malestar.';
  }

  return { suggestedFunction, confidence, reasoning };
}

/**
 * Identifica el tipo de refuerzo
 */
export function identifyReinforcementType(
  relief: boolean,
  gainedSomething: boolean,
  physicalRelief: boolean
): {
  type: ReinforcementType;
  explanation: string;
} {
  if (gainedSomething && !relief) {
    return {
      type: 'positive_reinforcement',
      explanation: 'El comportamiento te dio algo agradable (tiempo, diversiÃ³n, etc.)',
    };
  }

  if (relief && !physicalRelief) {
    return {
      type: 'negative_reinforcement',
      explanation: 'El comportamiento te liberÃ³ de algo desagradable (estrÃ©s, presiÃ³n, etc.)',
    };
  }

  if (physicalRelief) {
    return {
      type: 'automatic_negative',
      explanation: 'El comportamiento aliviÃ³ sensaciones fÃ­sicas desagradables',
    };
  }

  return {
    type: 'automatic_positive',
    explanation: 'El comportamiento produjo sensaciones agradables de comodidad',
  };
}

/**
 * Genera puntos de intervenciÃ³n basados en el anÃ¡lisis
 */
export function generateInterventionPoints(
  analysis: DeepFunctionalAnalysis
): Array<{
  point: 'before_trigger' | 'at_trigger' | 'during_behavior' | 'after_behavior';
  intervention: string;
  technique: TCCTechnique;
  rationale: string;
}> {
  const interventions: Array<{
    point: 'before_trigger' | 'at_trigger' | 'during_behavior' | 'after_behavior';
    intervention: string;
    technique: TCCTechnique;
    rationale: string;
  }> = [];

  const functionInfo = BEHAVIOR_FUNCTION_INFO[analysis.behaviorFunction.primaryFunction];

  // 1. ANTES DEL DISPARADOR
  if (analysis.antecedent.cognitivePatterns.length > 0) {
    interventions.push({
      point: 'before_trigger',
      intervention: 'Identificar y cuestionar pensamientos anticipatorios',
      technique: 'cognitive_restructuring',
      rationale: 'Los patrones cognitivos detectados pueden abordarse antes de que disparen el comportamiento',
    });
  }

  if (analysis.antecedent.recentStressors && analysis.antecedent.recentStressors.length > 0) {
    interventions.push({
      point: 'before_trigger',
      intervention: 'Planificar momentos de autocuidado y gestiÃ³n del estrÃ©s',
      technique: 'activity_scheduling',
      rationale: 'Reducir el estrÃ©s base disminuye la vulnerabilidad al comportamiento',
    });
  }

  // 2. EN EL MOMENTO DEL DISPARADOR
  interventions.push({
    point: 'at_trigger',
    intervention: 'Usar una micro-tarea de 2 minutos para romper la inercia',
    technique: 'micro_tasks',
    rationale: 'Actuar antes de que el comportamiento problemÃ¡tico se active',
  });

  if (analysis.antecedent.internalTriggers.physicalSensations.length > 0) {
    interventions.push({
      point: 'at_trigger',
      intervention: 'Aplicar tÃ©cnicas de relajaciÃ³n rÃ¡pida (respiraciÃ³n 4-7-8)',
      technique: 'relaxation',
      rationale: 'Calmar el cuerpo puede prevenir la cascada hacia el comportamiento',
    });
  }

  // 3. DURANTE EL COMPORTAMIENTO
  if (analysis.behavior.automaticity >= 3) {
    interventions.push({
      point: 'during_behavior',
      intervention: 'Practicar "pausar y notar" - interrumpir el patrÃ³n automÃ¡tico',
      technique: 'self_compassion',
      rationale: 'El comportamiento es muy automÃ¡tico; necesita consciencia sin juicio',
    });
  }

  // 4. DESPUÃ‰S DEL COMPORTAMIENTO
  interventions.push({
    point: 'after_behavior',
    intervention: 'Registrar el ABC completo para aprender del episodio',
    technique: 'functional_analysis',
    rationale: 'El autoconocimiento es clave para el cambio a largo plazo',
  });

  // Agregar tÃ©cnicas especÃ­ficas de la funciÃ³n
  for (const technique of functionInfo.relatedTechniques.slice(0, 2)) {
    if (!interventions.some(i => i.technique === technique)) {
      interventions.push({
        point: 'at_trigger',
        intervention: functionInfo.alternativeStrategies[0] || 'Aplicar estrategia alternativa',
        technique,
        rationale: `Esta tÃ©cnica aborda directamente la funciÃ³n "${functionInfo.name}"`,
      });
    }
  }

  return interventions;
}

/**
 * Analiza el ciclo de mantenimiento
 */
export function analyzeMaintenanceCycle(
  analysis: Partial<DeepFunctionalAnalysis>
): {
  cycleStrength: 1 | 2 | 3 | 4 | 5;
  mainFactors: string[];
  breakingPoints: string[];
  prognosis: string;
} {
  let cycleStrength = 1;
  const mainFactors: string[] = [];
  const breakingPoints: string[] = [];

  // Evaluar factores de mantenimiento
  if (analysis.consequences?.immediate.emotionalChange.relief) {
    cycleStrength += 1;
    mainFactors.push('Alivio inmediato refuerza el comportamiento');
  }

  if (analysis.reinforcement?.isImmediate) {
    cycleStrength += 1;
    mainFactors.push('El refuerzo es inmediato y potente');
  }

  if (analysis.behavior?.automaticity && analysis.behavior.automaticity >= 4) {
    cycleStrength += 1;
    mainFactors.push('El comportamiento es muy automÃ¡tico');
  }

  if (analysis.consequences?.longTerm.patternStrengthened) {
    cycleStrength += 1;
    mainFactors.push('El patrÃ³n se fortalece con cada repeticiÃ³n');
  }

  // Identificar puntos de ruptura
  if (analysis.antecedent?.cognitivePatterns && analysis.antecedent.cognitivePatterns.length > 0) {
    breakingPoints.push('Cuestionar los pensamientos automÃ¡ticos antes de actuar');
  }

  if (analysis.behaviorFunction?.alternativeWaysToMeetNeed) {
    breakingPoints.push('Usar alternativas que satisfagan la misma necesidad');
  }

  breakingPoints.push('Planificar respuestas diferentes para los disparadores conocidos');
  breakingPoints.push('Reducir el impacto del refuerzo (tolerar el malestar gradualmente)');

  // PronÃ³stico
  let prognosis: string;
  if (cycleStrength >= 4) {
    prognosis = 'Este patrÃ³n estÃ¡ bien establecido. RequerirÃ¡ esfuerzo consistente, pero puede cambiar.';
  } else if (cycleStrength >= 3) {
    prognosis = 'El patrÃ³n tiene fuerza moderada. Con intervenciÃ³n regular, verÃ¡s cambios en semanas.';
  } else {
    prognosis = 'El patrÃ³n no estÃ¡ fuertemente establecido. PequeÃ±os cambios pueden tener gran impacto.';
  }

  return {
    cycleStrength: Math.min(cycleStrength, 5) as 1 | 2 | 3 | 4 | 5,
    mainFactors,
    breakingPoints,
    prognosis,
  };
}

/**
 * Resultado de detecciÃ³n de un patrÃ³n cognitivo con confianza
 */
export interface PatternDetection {
  pattern: CognitivePattern;
  confidence: number;  // 0-100
  matchedKeywords: string[];
  reframe: string;
}

/**
 * ConfiguraciÃ³n mejorada de patrones con pesos y contexto
 */
const PATTERN_CONFIG: Record<CognitivePattern, {
  keywords: Array<{ text: string; weight: number; isPhrase?: boolean }>;
  negativeContext?: string[];  // Palabras que reducen confianza si estÃ¡n cerca
  reframe: string;
  baseConfidence: number;  // Confianza mÃ­nima al detectar
}> = {
  all_or_nothing: {
    keywords: [
      { text: 'nunca', weight: 1.0 },
      { text: 'siempre', weight: 1.0 },
      { text: 'todo o nada', weight: 1.5, isPhrase: true },
      { text: 'completamente', weight: 0.8 },
      { text: 'perfecto', weight: 0.9 },
      { text: 'todo', weight: 0.5 },  // MÃ¡s comÃºn, menos peso
      { text: 'nada', weight: 0.7 },
      { text: 'absoluto', weight: 0.9 },
    ],
    negativeContext: ['a veces', 'quizÃ¡s', 'tal vez', 'parcialmente'],
    reframe: 'El progreso parcial tambiÃ©n cuenta. No tiene que ser perfecto.',
    baseConfidence: 35,
  },
  fortune_telling: {
    keywords: [
      { text: 'va a salir mal', weight: 1.5, isPhrase: true },
      { text: 'seguro que va a', weight: 1.5, isPhrase: true },
      { text: 'no va a funcionar', weight: 1.5, isPhrase: true },
      { text: 'seguro que', weight: 1.0 },
      { text: 'va a fallar', weight: 1.3, isPhrase: true },
      { text: 'terminarÃ¡ mal', weight: 1.3, isPhrase: true },
      { text: 'serÃ¡ un desastre', weight: 1.4, isPhrase: true },
    ],
    reframe: 'No puedes predecir el futuro. Solo puedes intentarlo.',
    baseConfidence: 40,
  },
  catastrophizing: {
    keywords: [
      { text: 'catÃ¡strofe', weight: 1.5 },
      { text: 'todo se va a', weight: 1.4, isPhrase: true },
      { text: 'el peor', weight: 1.2 },
      { text: 'arruinar', weight: 1.0 },
      { text: 'destruir', weight: 1.0 },
      { text: 'no hay vuelta atrÃ¡s', weight: 1.5, isPhrase: true },
    ],
    reframe: 'Lo peor casi nunca ocurre. Lo mÃ¡s probable es algo manejable.',
    baseConfidence: 38,
  },
  magnification: {
    keywords: [
      { text: 'terrible', weight: 1.0 },
      { text: 'horrible', weight: 1.0 },
      { text: 'catÃ¡strofe', weight: 1.2 },
      { text: 'catastrÃ³fico', weight: 1.2 },
      { text: 'imposible', weight: 0.9 },
      { text: 'insoportable', weight: 1.1 },
      { text: 'devastador', weight: 1.2 },
      { text: 'el peor', weight: 1.0, isPhrase: true },
      { text: 'lo peor que', weight: 1.3, isPhrase: true },
    ],
    negativeContext: ['no es tan', 'tampoco es', 'exagero'],
    reframe: 'Esto es difÃ­cil, pero no es una catÃ¡strofe. Puedes manejarlo.',
    baseConfidence: 40,
  },
  should_statements: {
    keywords: [
      { text: 'deberÃ­a', weight: 1.0 },
      { text: 'tendrÃ­a que', weight: 1.0 },
      { text: 'debo', weight: 0.9 },
      { text: 'tengo que', weight: 0.8 },
      { text: 'debÃ­ haber', weight: 1.1, isPhrase: true },
      { text: 'no deberÃ­a', weight: 1.0 },
    ],
    negativeContext: ['me gustarÃ­a', 'prefiero', 'elijo'],
    reframe: 'Cambiar "deberÃ­a" por "me gustarÃ­a" reduce la presiÃ³n.',
    baseConfidence: 35,
  },
  emotional_reasoning: {
    keywords: [
      { text: 'me siento', weight: 0.6 },  // Muy comÃºn, bajo peso
      { text: 'siento que soy', weight: 1.2, isPhrase: true },
      { text: 'parece que todo', weight: 1.0, isPhrase: true },
      { text: 'si me siento asÃ­ es porque', weight: 1.5, isPhrase: true },
      { text: 'como me siento mal entonces', weight: 1.5, isPhrase: true },
    ],
    reframe: 'Sentirlo no lo hace verdad. Las emociones son informaciÃ³n, no hechos.',
    baseConfidence: 30,
  },
  mind_reading: {
    keywords: [
      { text: 'piensan que', weight: 1.0 },
      { text: 'creen que soy', weight: 1.2, isPhrase: true },
      { text: 'van a pensar', weight: 1.0 },
      { text: 'seguro piensa', weight: 1.1, isPhrase: true },
      { text: 'deben creer', weight: 1.0, isPhrase: true },
      { text: 'todos creen', weight: 1.1, isPhrase: true },
    ],
    reframe: 'No puedes leer mentes. Solo puedes preguntar o aceptar la incertidumbre.',
    baseConfidence: 40,
  },
  mental_filter: {
    keywords: [
      { text: 'solo veo lo malo', weight: 1.5, isPhrase: true },
      { text: 'nada estÃ¡ bien', weight: 1.3, isPhrase: true },
      { text: 'todo estÃ¡ mal', weight: 1.3, isPhrase: true },
      { text: 'solo lo negativo', weight: 1.4, isPhrase: true },
      { text: 'no hay nada bueno', weight: 1.4, isPhrase: true },
    ],
    reframe: 'Â¿QuÃ© cosas sÃ­ estÃ¡n bien que no estÃ¡s viendo?',
    baseConfidence: 45,
  },
  disqualifying_positive: {
    keywords: [
      { text: 'sÃ­ pero', weight: 1.0, isPhrase: true },
      { text: 'no cuenta', weight: 1.2 },
      { text: 'no es suficiente', weight: 1.0, isPhrase: true },
      { text: 'eso no vale', weight: 1.1, isPhrase: true },
      { text: 'da igual porque', weight: 1.2, isPhrase: true },
      { text: 'pero igual', weight: 0.9, isPhrase: true },
    ],
    reframe: 'Cada paso cuenta. No necesitas invalidar tus logros.',
    baseConfidence: 35,
  },
  personalization: {
    keywords: [
      { text: 'es mi culpa', weight: 1.3, isPhrase: true },
      { text: 'por mi culpa', weight: 1.3, isPhrase: true },
      { text: 'soy responsable de todo', weight: 1.5, isPhrase: true },
      { text: 'si yo hubiera', weight: 1.0, isPhrase: true },
      { text: 'todo es por mÃ­', weight: 1.4, isPhrase: true },
    ],
    reframe: 'Las situaciones tienen mÃºltiples causas. No todo depende de ti.',
    baseConfidence: 45,
  },
  labeling: {
    keywords: [
      { text: 'soy un fracaso', weight: 1.5, isPhrase: true },
      { text: 'soy un desastre', weight: 1.5, isPhrase: true },
      { text: 'soy un inÃºtil', weight: 1.5, isPhrase: true },
      { text: 'soy una persona', weight: 0.7, isPhrase: true },  // Depende del contexto
      { text: 'no sirvo para', weight: 1.3, isPhrase: true },
      { text: 'soy patÃ©tico', weight: 1.4 },
      { text: 'soy un perdedor', weight: 1.5, isPhrase: true },
    ],
    negativeContext: ['no soy', 'ya no soy'],
    reframe: 'TÃº no eres tus acciones. Las acciones cambian.',
    baseConfidence: 50,
  },
  overgeneralization: {
    keywords: [
      { text: 'siempre me pasa', weight: 1.4, isPhrase: true },
      { text: 'nunca puedo', weight: 1.3, isPhrase: true },
      { text: 'jamÃ¡s logro', weight: 1.3, isPhrase: true },
      { text: 'todos los dÃ­as', weight: 0.8, isPhrase: true },
      { text: 'cada vez que', weight: 0.7, isPhrase: true },
      { text: 'siempre es igual', weight: 1.2, isPhrase: true },
      { text: 'nunca cambia nada', weight: 1.4, isPhrase: true },
    ],
    negativeContext: ['a veces', 'en esta ocasiÃ³n', 'hoy'],
    reframe: 'Un evento no define todos los eventos. "A veces" es mÃ¡s preciso.',
    baseConfidence: 40,
  },
};

/**
 * Detecta patrones cognitivos con confianza escalada
 *
 * La confianza se calcula basÃ¡ndose en:
 * 1. NÃºmero de keywords encontrados (mÃ¡s = mayor confianza)
 * 2. Peso de cada keyword (frases completas > palabras sueltas)
 * 3. Presencia de contexto negativo (reduce confianza)
 * 4. PosiciÃ³n en el pensamiento (inicio = mayor peso)
 */
export function detectCognitivePatterns(
  thought: string
): PatternDetection[] {
  const lowerThought = thought.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const detections: PatternDetection[] = [];

  for (const [patternKey, config] of Object.entries(PATTERN_CONFIG)) {
    const pattern = patternKey as CognitivePattern;
    const matchedKeywords: string[] = [];
    let totalWeight = 0;

    // Buscar keywords
    for (const kw of config.keywords) {
      const kwNormalized = kw.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (lowerThought.includes(kwNormalized)) {
        matchedKeywords.push(kw.text);

        // Bonus por posiciÃ³n al inicio del pensamiento
        const positionBonus = lowerThought.indexOf(kwNormalized) < 20 ? 0.2 : 0;

        // Bonus por ser frase completa
        const phraseBonus = kw.isPhrase ? 0.3 : 0;

        totalWeight += kw.weight + positionBonus + phraseBonus;
      }
    }

    if (matchedKeywords.length === 0) continue;

    // PenalizaciÃ³n por contexto negativo
    let negativePenalty = 0;
    if (config.negativeContext) {
      for (const neg of config.negativeContext) {
        if (lowerThought.includes(neg.toLowerCase())) {
          negativePenalty += 15;  // -15% por cada contexto negativo
        }
      }
    }

    // Calcular confianza final
    // Base + (peso acumulado Ã— 15) - penalizaciones, con mÃ¡ximo de 95
    let confidence = config.baseConfidence + (totalWeight * 15) - negativePenalty;

    // Bonus por mÃºltiples keywords del mismo patrÃ³n
    if (matchedKeywords.length >= 2) {
      confidence += 10;
    }
    if (matchedKeywords.length >= 3) {
      confidence += 10;
    }

    // Limitar entre 20 y 95
    confidence = Math.max(20, Math.min(95, Math.round(confidence)));

    detections.push({
      pattern,
      confidence,
      matchedKeywords,
      reframe: config.reframe,
    });
  }

  // Ordenar por confianza descendente
  return detections.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Conecta pensamientos con patrones cognitivos (versiÃ³n mejorada)
 * Mantiene compatibilidad con la API anterior
 */
export function linkThoughtsToPatterns(
  thoughts: string[]
): Array<{
  thought: string;
  patterns: CognitivePattern[];
  reframe: string;
  patternDetails?: PatternDetection[];  // Nuevo: detalles con confianza
}> {
  const results: Array<{
    thought: string;
    patterns: CognitivePattern[];
    reframe: string;
    patternDetails?: PatternDetection[];
  }> = [];

  for (const thought of thoughts) {
    const detections = detectCognitivePatterns(thought);

    // Filtrar solo patrones con confianza >= 40%
    const significantPatterns = detections.filter(d => d.confidence >= 40);

    const patterns = significantPatterns.map(d => d.pattern);
    const reframe = significantPatterns[0]?.reframe ||
      'Considera: Â¿Hay otra forma de ver esta situaciÃ³n?';

    results.push({
      thought,
      patterns,
      reframe,
      patternDetails: detections,  // Incluir todos para anÃ¡lisis
    });
  }

  return results;
}

/**
 * Genera un resumen del anÃ¡lisis para el usuario
 */
export function generateAnalysisSummary(
  analysis: DeepFunctionalAnalysis
): {
  whatHappened: string;
  whyItHappened: string;
  whatMaintainsIt: string;
  howToChange: string[];
  keyInsight: string;
} {
  const functionInfo = BEHAVIOR_FUNCTION_INFO[analysis.behaviorFunction.primaryFunction];
  const reinforcementInfo = REINFORCEMENT_INFO[analysis.reinforcement.type];

  const whatHappened = `Ante ${analysis.antecedent.situation}, respondiste con ${analysis.behavior.description}.`;

  const whyItHappened = `Este comportamiento cumple la funciÃ³n de "${functionInfo.name}": ${functionInfo.description}. ` +
    `La necesidad subyacente es: ${functionInfo.underlyingNeed}.`;

  const whatMaintainsIt = `Lo que mantiene este patrÃ³n es ${reinforcementInfo.name.toLowerCase()}: ` +
    `${analysis.reinforcement.description}. ` +
    (analysis.consequences.longTerm.patternStrengthened
      ? 'Cada vez que esto ocurre, el patrÃ³n se fortalece.'
      : 'El patrÃ³n aÃºn no estÃ¡ muy establecido.');

  const howToChange = [
    ...functionInfo.alternativeStrategies.slice(0, 2),
    ...(analysis.cognitiveLink.alternativeThoughts?.slice(0, 1).map(t => t.alternative) || []),
  ];

  const keyInsight = `Tu comportamiento intenta ${analysis.behaviorFunction.whatDoesItProvide}. ` +
    `Hay otras formas de conseguir esto sin las consecuencias negativas a largo plazo.`;

  return {
    whatHappened,
    whyItHappened,
    whatMaintainsIt,
    howToChange,
    keyInsight,
  };
}
