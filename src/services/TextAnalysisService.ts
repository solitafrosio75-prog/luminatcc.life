// @ts-nocheck
/**
 * TextAnalysisService
 *
 * Servicio de análisis de texto para detectar emociones, patrones cognitivos
 * y barreras a partir de lo que el usuario escribe.
 *
 * Utiliza detección basada en keywords y patrones para:
 * - Identificar emociones predominantes
 * - Detectar patrones cognitivos disfuncionales
 * - Identificar barreras específicas
 * - Recomendar técnicas TCC apropiadas
 */

import type {
  ThoughtEmotion,
  MoodLevel,
  TCCTechnique,
  CognitivePattern,
  UnifiedBarrier,
} from '../db/database';

import {
  detectBarriersFromText,
  UNIFIED_BARRIERS,
  TCC_TECHNIQUES_INFO,
} from './TCCEngine';
import { logCrisisEvent } from '../db/operations/crisisOperations';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Resultado del análisis de texto
 */
export interface TextAnalysisResult {
  // Emociones detectadas
  emotions: Array<{
    emotion: ThoughtEmotion;
    confidence: number;
    keywords: string[];
  }>;

  // Emoción predominante
  primaryEmotion: ThoughtEmotion | null;

  // Nivel de ánimo inferido
  inferredMood: MoodLevel;

  // Patrones cognitivos detectados
  cognitivePatterns: Array<{
    pattern: CognitivePattern;
    confidence: number;
    evidence: string[];
  }>;

  // Barreras detectadas
  barriers: UnifiedBarrier[];

  // Técnicas TCC recomendadas (ordenadas por relevancia)
  recommendedTechniques: Array<{
    technique: TCCTechnique;
    reason: string;
    priority: number;
    estimatedMinutes: number;
  }>;

  // Mensaje de validación empática
  validationMessage: string;

  // Preguntas de seguimiento sugeridas
  followUpQuestions: string[];

  // Nivel de urgencia/intensidad (1-5)
  intensityLevel: 1 | 2 | 3 | 4 | 5;

  // Banderas de seguridad
  safetyFlags: {
    needsSupport: boolean;
    suggestProfessional: boolean;
    keywords: string[];
  };
}

// ============================================================================
// KEYWORDS DE EMOCIONES
// ============================================================================

const EMOTION_KEYWORDS: Record<ThoughtEmotion, string[]> = {
  anxious: [
    'ansioso', 'ansiedad', 'nervioso', 'preocupado', 'preocupación', 'miedo',
    'temor', 'inquieto', 'tenso', 'agitado', 'pánico', 'angustia', 'angustiado',
    'estresado', 'estrés', 'no puedo parar de pensar', 'pensamientos acelerados',
    'me da miedo', 'temo que', 'y si', 'catastrófico', 'terrible', 'horrible',
  ],
  sad: [
    'triste', 'tristeza', 'deprimido', 'depresión', 'vacío', 'solo', 'soledad',
    'llorar', 'lloro', 'desesperanza', 'sin ganas', 'apatía', 'desanimado',
    'decaído', 'melancólico', 'abatido', 'desconsolado', 'pena', 'dolor',
    'pérdida', 'extraño', 'echo de menos', 'nada me importa',
  ],
  frustrated: [
    'frustrado', 'frustración', 'harto', 'cansado de', 'irritado', 'irritación',
    'molesto', 'fastidiado', 'exasperado', 'impaciente', 'desesperado',
    'no funciona', 'no avanza', 'siempre igual', 'otra vez', 'no sirve',
  ],
  guilty: [
    'culpable', 'culpa', 'debería', 'tendría que', 'no debí', 'me arrepiento',
    'arrepentimiento', 'fallé', 'decepcioné', 'no cumplí', 'mal por',
    'responsable', 'es mi culpa', 'por mi culpa',
  ],
  overwhelmed: [
    'abrumado', 'abruma', 'demasiado', 'no puedo con todo', 'mucho',
    'sobrepasado', 'desbordado', 'caos', 'desorden', 'no sé por dónde empezar',
    'todo a la vez', 'mil cosas', 'no doy abasto', 'agotador',
  ],
  angry: [
    'enojado', 'enojo', 'rabia', 'ira', 'furioso', 'furia', 'odio',
    'indignado', 'injusto', 'no es justo', 'me enfada', 'bronca',
    'cabreado', 'enfurecido',
  ],
  hopeless: [
    'sin esperanza', 'desesperanzado', 'no tiene sentido', 'para qué',
    'nada va a cambiar', 'siempre será así', 'no hay solución', 'rendido',
    'abandonar', 'tirar la toalla', 'no vale la pena', 'inútil',
  ],
  ashamed: [
    'vergüenza', 'avergonzado', 'humillado', 'humillación', 'ridículo',
    'me da pena', 'qué pensarán', 'qué dirán', 'juzgado', 'expuesto',
    'inadecuado', 'inferior', 'no soy suficiente',
  ],
};

// ============================================================================
// KEYWORDS DE PATRONES COGNITIVOS
// ============================================================================

// Patrones cognitivos según database.ts:
// all_or_nothing, fortune_telling, magnification, should_statements,
// emotional_reasoning, mind_reading, mental_filter, disqualifying_positive,
// personalization, labeling, overgeneralization

const COGNITIVE_PATTERN_KEYWORDS: Record<CognitivePattern, string[]> = {
  all_or_nothing: [
    'siempre', 'nunca', 'todo', 'nada', 'completamente', 'totalmente',
    'perfecto', 'desastre total', 'arruinado', '100%', 'absoluto',
  ],
  magnification: [
    'terrible', 'horrible', 'catástrofe', 'desastre', 'el peor',
    'no sobreviviré', 'será fatal', 'devastador', 'arruinará',
    'es enorme', 'es gigante', 'es lo peor', 'es demasiado grande',
    'es imposible', 'nunca podré', 'es inmenso',
  ],
  mind_reading: [
    'seguro que piensa', 'sé que creen', 'piensan que', 'creen que soy',
    'me ve como', 'me considera', 'deben pensar',
  ],
  fortune_telling: [
    'va a salir mal', 'seguro que', 'esto terminará', 'sé que pasará',
    'nunca voy a', 'siempre va a', 'es inevitable',
  ],
  catastrophizing: [
    'catástrofe', 'todo se va a', 'el peor escenario', 'no hay vuelta atrás',
    'arruinar todo', 'se acaba el mundo', 'destruirá',
  ],
  emotional_reasoning: [
    'me siento, entonces', 'si me siento así', 'como me siento',
    'porque siento', 'lo siento así que',
  ],
  should_statements: [
    'debería', 'tendría que', 'debo', 'tengo que', 'no debería',
    'hay que', 'es obligatorio', 'tenía que',
  ],
  labeling: [
    'soy un', 'soy una', 'soy idiota', 'soy inútil', 'soy un fracaso',
    'soy patético', 'soy un desastre', 'soy malo',
  ],
  personalization: [
    'es mi culpa', 'por mi culpa', 'yo causé', 'si yo hubiera',
    'es por mí', 'me lo merezco', 'yo hice que',
  ],
  overgeneralization: [
    'siempre me pasa', 'nunca puedo', 'todo el mundo', 'nadie',
    'esto siempre', 'otra vez igual', 'como siempre',
  ],
  mental_filter: [
    'solo veo', 'lo único que', 'nada más importa', 'todo lo demás',
    'pero esto', 'sin embargo', 'a pesar de todo',
    'no es para tanto', 'no importa', 'da igual', 'no cuenta',
  ],
  disqualifying_positive: [
    'sí, pero', 'no cuenta porque', 'fue suerte', 'cualquiera',
    'no significa nada', 'eso no vale',
  ],
};

// ============================================================================
// KEYWORDS DE SEGURIDAD
// ============================================================================

const SAFETY_KEYWORDS = [
  'suicid', 'matarme', 'no quiero vivir', 'acabar con todo',
  'desaparecer', 'no despertar', 'hacerme daño', 'autolesion',
  'cortarme', 'no vale la pena vivir',
];

// ============================================================================
// MENSAJES DE VALIDACIÓN
// ============================================================================

const VALIDATION_MESSAGES: Record<ThoughtEmotion, string[]> = {
  anxious: [
    'La ansiedad que sientes es real y válida. Vamos a trabajar juntos para manejarla.',
    'Es comprensible sentir nerviosismo. Tu mente está tratando de protegerte.',
    'La ansiedad es incómoda pero temporal. Tienes herramientas para atravesarla.',
  ],
  sad: [
    'La tristeza es parte de la experiencia humana. Está bien sentirse así.',
    'Tus sentimientos son válidos. No tienes que estar bien todo el tiempo.',
    'La tristeza también pasa. Mientras tanto, sé gentil contigo.',
  ],
  frustrated: [
    'La frustración indica que algo te importa. Esa energía puede ser útil.',
    'Es normal sentir frustración cuando las cosas no salen como esperamos.',
    'Tu frustración es comprensible. Veamos qué podemos hacer al respecto.',
  ],
  guilty: [
    'Sentir culpa muestra que te importa hacer las cosas bien. Eso es valioso.',
    'La culpa puede ser una guía, pero no tiene que definirte.',
    'Todos cometemos errores. Lo importante es qué hacemos ahora.',
  ],
  overwhelmed: [
    'Sentirse abrumado es una respuesta normal ante mucho. No tienes que hacerlo todo.',
    'Cuando todo parece demasiado, un solo paso pequeño es suficiente.',
    'El abrumamiento disminuye cuando dividimos las cosas en partes manejables.',
  ],
  angry: [
    'El enojo es una emoción válida que te dice que algo no está bien.',
    'Tu enojo tiene sentido. Veamos qué hay detrás de él.',
    'La ira puede ser energía para el cambio cuando se canaliza bien.',
  ],
  hopeless: [
    'Aunque ahora se sienta sin salida, los sentimientos no son hechos.',
    'La desesperanza es una emoción, no una predicción del futuro.',
    'Cuando todo parece oscuro, un pequeño paso puede hacer diferencia.',
  ],
  ashamed: [
    'La vergüenza es una de las emociones más difíciles. No estás solo/a en esto.',
    'Todos tenemos momentos de vergüenza. No te define como persona.',
    'La vulnerabilidad no es debilidad. Es parte de ser humano.',
  ],
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

/**
 * Analiza texto libre del usuario y detecta emociones, patrones y barreras
 */
export function analyzeText(text: string): TextAnalysisResult {
  const normalizedText = text.toLowerCase();

  // 1. Detectar emociones
  const emotions = detectEmotions(normalizedText);
  const primaryEmotion = emotions.length > 0 ? emotions[0].emotion : null;

  // 2. Inferir nivel de ánimo
  const inferredMood = inferMoodLevel(emotions, normalizedText);

  // 3. Detectar patrones cognitivos
  const cognitivePatterns = detectCognitivePatterns(normalizedText);

  // 4. Detectar barreras (usando la función existente del TCCEngine)
  const barriers = detectBarriersFromText(text);

  // 5. Calcular nivel de intensidad
  const intensityLevel = calculateIntensity(emotions, cognitivePatterns, normalizedText);

  // 6. Verificar banderas de seguridad
  const safetyFlags = checkSafetyFlags(normalizedText);

  // 7. Generar recomendaciones de técnicas
  const recommendedTechniques = generateTechniqueRecommendations(
    emotions,
    cognitivePatterns,
    barriers,
    intensityLevel
  );

  // 8. Seleccionar mensaje de validación
  const validationMessage = selectValidationMessage(primaryEmotion, barriers);

  // 9. Generar preguntas de seguimiento
  const followUpQuestions = generateFollowUpQuestions(
    primaryEmotion,
    cognitivePatterns,
    barriers
  );

  return {
    emotions,
    primaryEmotion,
    inferredMood,
    cognitivePatterns,
    barriers,
    recommendedTechniques,
    validationMessage,
    followUpQuestions,
    intensityLevel,
    safetyFlags,
  };
}

// ============================================================================
// FUNCIONES DE DETECCIÓN
// ============================================================================

function detectEmotions(text: string): TextAnalysisResult['emotions'] {
  const results: TextAnalysisResult['emotions'] = [];

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    const foundKeywords = keywords.filter(kw => text.includes(kw));
    if (foundKeywords.length > 0) {
      const confidence = Math.min(foundKeywords.length / 3, 1); // Max 1.0
      results.push({
        emotion: emotion as ThoughtEmotion,
        confidence,
        keywords: foundKeywords,
      });
    }
  }

  // Ordenar por confianza
  return results.sort((a, b) => b.confidence - a.confidence);
}

function detectCognitivePatterns(text: string): TextAnalysisResult['cognitivePatterns'] {
  const results: TextAnalysisResult['cognitivePatterns'] = [];

  for (const [pattern, keywords] of Object.entries(COGNITIVE_PATTERN_KEYWORDS)) {
    const foundKeywords = keywords.filter(kw => text.includes(kw));
    if (foundKeywords.length > 0) {
      const confidence = Math.min(foundKeywords.length / 2, 1);
      results.push({
        pattern: pattern as CognitivePattern,
        confidence,
        evidence: foundKeywords,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

function inferMoodLevel(
  emotions: TextAnalysisResult['emotions'],
  text: string
): MoodLevel {
  if (emotions.length === 0) return 'neutral';

  const primaryEmotion = emotions[0].emotion;
  const confidence = emotions[0].confidence;

  // Emociones negativas intensas → muy mal
  if (['hopeless', 'overwhelmed'].includes(primaryEmotion) && confidence > 0.5) {
    return 'very_bad';
  }

  // Emociones negativas moderadas → mal
  if (['anxious', 'sad', 'guilty', 'ashamed'].includes(primaryEmotion)) {
    return confidence > 0.5 ? 'bad' : 'neutral';
  }

  // Frustración/enojo → depende de intensidad
  if (['frustrated', 'angry'].includes(primaryEmotion)) {
    return confidence > 0.7 ? 'bad' : 'neutral';
  }

  return 'neutral';
}

function calculateIntensity(
  emotions: TextAnalysisResult['emotions'],
  patterns: TextAnalysisResult['cognitivePatterns'],
  text: string
): 1 | 2 | 3 | 4 | 5 {
  let score = 2; // Base

  // Más emociones detectadas = más intensidad
  score += Math.min(emotions.length * 0.5, 1);

  // Alta confianza en emoción principal
  if (emotions[0]?.confidence > 0.7) score += 1;

  // Patrones cognitivos aumentan intensidad
  score += Math.min(patterns.length * 0.3, 1);

  // Texto más largo puede indicar más necesidad de expresarse
  if (text.length > 200) score += 0.5;

  // Signos de exclamación o mayúsculas
  if (/!{2,}/.test(text) || /[A-Z]{3,}/.test(text)) score += 0.5;

  return Math.min(Math.max(Math.round(score), 1), 5) as 1 | 2 | 3 | 4 | 5;
}

function checkSafetyFlags(text: string): TextAnalysisResult['safetyFlags'] {
  const foundKeywords = SAFETY_KEYWORDS.filter(kw => text.includes(kw));

  return {
    needsSupport: foundKeywords.length > 0,
    suggestProfessional: foundKeywords.length > 0,
    keywords: foundKeywords,
  };
}

/**
 * Persiste una alerta de seguridad para tracking clínico.
 * A-03: Migrado de localStorage a IndexedDB (crisisAnalytics) para resiliencia
 * y consistencia con el resto de datos clínicos.
 */
export async function persistSafetyAlert(
  userId: string,
  safetyFlags: TextAnalysisResult['safetyFlags'],
  contextSnippet?: string,
): Promise<void> {
  if (!safetyFlags.needsSupport) return;
  try {
    await logCrisisEvent({
      userId,
      eventType: 'detection',
      metadata: {
        triggers: safetyFlags.keywords,
        severity: safetyFlags.keywords.length >= 2 ? 'severe' : 'moderate',
        interventionTriggered: safetyFlags.suggestProfessional,
      },
    });
  } catch (err) {
    // Fallback: si IndexedDB falla, intentar localStorage como respaldo
    try {
      const key = `homeflow_safety_alerts_${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
      existing.push({
        timestamp: new Date().toISOString(),
        keywords: safetyFlags.keywords,
        context: contextSnippet?.substring(0, 200),
      });
      if (existing.length > 50) existing.splice(0, existing.length - 50);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // Silenciar — no se puede persistir en ningún store
    }
    console.error('Failed to persist safety alert to IndexedDB, used localStorage fallback:', err);
  }
}

// ============================================================================
// GENERACIÓN DE RECOMENDACIONES
// ============================================================================

function generateTechniqueRecommendations(
  emotions: TextAnalysisResult['emotions'],
  patterns: TextAnalysisResult['cognitivePatterns'],
  barriers: UnifiedBarrier[],
  intensity: number
): TextAnalysisResult['recommendedTechniques'] {
  const techniqueScores: Record<TCCTechnique, { score: number; reasons: string[] }> = {
    behavioral_activation: { score: 0, reasons: [] },
    gradual_exposure: { score: 0, reasons: [] },
    cognitive_restructuring: { score: 0, reasons: [] },
    activity_scheduling: { score: 0, reasons: [] },
    functional_analysis: { score: 0, reasons: [] },
    micro_tasks: { score: 0, reasons: [] },
    momentum_building: { score: 0, reasons: [] },
    self_compassion: { score: 0, reasons: [] },
    problem_solving: { score: 0, reasons: [] },
    relaxation: { score: 0, reasons: [] },
  };

  // Puntuar basado en emociones
  for (const { emotion, confidence } of emotions) {
    switch (emotion) {
      case 'anxious':
        techniqueScores.relaxation.score += 3 * confidence;
        techniqueScores.relaxation.reasons.push('Ayuda a calmar la ansiedad');
        techniqueScores.gradual_exposure.score += 2 * confidence;
        techniqueScores.cognitive_restructuring.score += 2 * confidence;
        break;
      case 'sad':
      case 'hopeless':
        techniqueScores.behavioral_activation.score += 3 * confidence;
        techniqueScores.behavioral_activation.reasons.push('La acción mejora el ánimo');
        techniqueScores.self_compassion.score += 2 * confidence;
        techniqueScores.activity_scheduling.score += 2 * confidence;
        break;
      case 'frustrated':
      case 'angry':
        techniqueScores.problem_solving.score += 3 * confidence;
        techniqueScores.problem_solving.reasons.push('Canaliza la energía en soluciones');
        techniqueScores.relaxation.score += 2 * confidence;
        break;
      case 'guilty':
      case 'ashamed':
        techniqueScores.self_compassion.score += 3 * confidence;
        techniqueScores.self_compassion.reasons.push('Cultiva amabilidad hacia ti');
        techniqueScores.cognitive_restructuring.score += 2 * confidence;
        break;
      case 'overwhelmed':
        techniqueScores.micro_tasks.score += 3 * confidence;
        techniqueScores.micro_tasks.reasons.push('Divide lo grande en pequeño');
        techniqueScores.activity_scheduling.score += 2 * confidence;
        break;
    }
  }

  // Puntuar basado en patrones cognitivos
  for (const { pattern, confidence } of patterns) {
    if (['all_or_nothing', 'magnification', 'should_statements', 'labeling'].includes(pattern)) {
      techniqueScores.cognitive_restructuring.score += 3 * confidence;
      techniqueScores.cognitive_restructuring.reasons.push('Examina patrones de pensamiento');
    }
    if (['fortune_telling', 'mind_reading'].includes(pattern)) {
      techniqueScores.functional_analysis.score += 2 * confidence;
      techniqueScores.functional_analysis.reasons.push('Analiza la conexión pensamiento-emoción');
    }
  }

  // Puntuar basado en barreras
  for (const barrier of barriers) {
    for (const tech of barrier.recommendedTechniques) {
      if (techniqueScores[tech]) {
        techniqueScores[tech].score += 2;
        techniqueScores[tech].reasons.push(`Efectivo para ${barrier.name.toLowerCase()}`);
      }
    }
  }

  // Si intensidad alta, priorizar técnicas rápidas
  if (intensity >= 4) {
    techniqueScores.relaxation.score += 2;
    techniqueScores.micro_tasks.score += 2;
  }

  // Convertir a array ordenado
  const results: TextAnalysisResult['recommendedTechniques'] = [];

  for (const [technique, { score, reasons }] of Object.entries(techniqueScores)) {
    if (score > 0) {
      const info = TCC_TECHNIQUES_INFO[technique as TCCTechnique];
      results.push({
        technique: technique as TCCTechnique,
        reason: reasons[0] || 'Recomendado para tu situación',
        priority: score,
        estimatedMinutes: info?.durationMinutes || 5,
      });
    }
  }

  return results.sort((a, b) => b.priority - a.priority).slice(0, 4);
}

function selectValidationMessage(
  primaryEmotion: ThoughtEmotion | null,
  barriers: UnifiedBarrier[]
): string {
  // Primero intentar mensaje de barrera
  if (barriers.length > 0 && barriers[0].validationMessages.length > 0) {
    const messages = barriers[0].validationMessages;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Luego mensaje de emoción
  if (primaryEmotion && VALIDATION_MESSAGES[primaryEmotion]) {
    const messages = VALIDATION_MESSAGES[primaryEmotion];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Mensaje genérico
  return 'Gracias por compartir cómo te sientes. Estás dando un paso importante al expresarlo.';
}

function generateFollowUpQuestions(
  primaryEmotion: ThoughtEmotion | null,
  patterns: TextAnalysisResult['cognitivePatterns'],
  barriers: UnifiedBarrier[]
): string[] {
  const questions: string[] = [];

  // Pregunta basada en emoción
  if (primaryEmotion) {
    switch (primaryEmotion) {
      case 'anxious':
        questions.push('¿Qué es lo peor que crees que podría pasar?');
        break;
      case 'sad':
        questions.push('¿Hay algo pequeño que solía darte algo de alegría?');
        break;
      case 'overwhelmed':
        questions.push('Si pudieras hacer solo UNA cosa, ¿cuál sería?');
        break;
      case 'frustrated':
        questions.push('¿Qué necesitarías para que esto mejorara?');
        break;
      case 'guilty':
        questions.push('¿Qué te dirías a ti mismo si fueras tu mejor amigo?');
        break;
    }
  }

  // Pregunta basada en patrón cognitivo
  if (patterns.length > 0) {
    const topPattern = patterns[0].pattern;
    if (topPattern === 'magnification') {
      questions.push('¿Cuál sería un resultado más realista?');
    } else if (topPattern === 'all_or_nothing') {
      questions.push('¿Hay algún punto intermedio que no estés viendo?');
    }
  }

  // Pregunta basada en barrera
  if (barriers.length > 0) {
    questions.push(barriers[0].detectionQuestions[0]);
  }

  return questions.slice(0, 3);
}

// ============================================================================
// EXPORTAR
// ============================================================================

export {
  EMOTION_KEYWORDS,
  COGNITIVE_PATTERN_KEYWORDS,
  VALIDATION_MESSAGES,
};
