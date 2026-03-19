/**
 * patternProcessor.ts — Motor Principal de Análisis de Patrones
 *
 * Procesa patrones clínicos después de cada sesión:
 * 1. Analiza coherencia con creencia nuclear inicial
 * 2. Detecta distorsiones cognitivas emergentes
 * 3. Calcula cambio clínicamente significativo
 * 4. Genera alertas críticas
 * 5. Sugiere técnicas para próxima sesión
 *
 * Todos los análisis se documentan en PatientFolder.patternAnalysisLog[]
 * para que el terapeuta tenga retroalimentación continua.
 *
 * Principios:
 * - Funciones puras (sin side-effects)
 * - Determinístico (mismo input → mismo output)
 * - Auditable (cada decisión tiene evidencia)
 * - Testeables en aislamiento
 */

import type {
  PatternAnalysisResult,
  SessionData,
  CoherenceAnalysis,
  DistortionIdentification,
  NarrativeAnalysis,
  ChangeIndicators,
  ClinicalAlert,
  SessionSuggestion,
  CognitivDistortion,
} from './patternTypes';
import type { InterviewReport } from '@/features/patient/patientStore';

// ============================================================================
// Cognitive Distortions Knowledge Base (placeholder)
// ============================================================================

const COGNITIVE_DISTORTIONS: CognitivDistortion[] = [
  {
    id: 'dc_01_catastrofizacion',
    name: 'Catastrofización',
    definition: 'Anticipar lo peor sin evidencia. Convertir lo probable en inevitable.',
    example: '"Voy a fallar → me despedirán → perderé mi casa"',
    pattern_indicators: ['si entonces', 'lo peor', 'nunca', 'siempre'],
    intervention: 'Análisis de evidencia: ¿probabilidad real? ¿qué pasó antes?',
    severity: 'high',
  },
  {
    id: 'dc_02_lectura_mental',
    name: 'Lectura de la mente',
    definition: 'Asumir que otros piensan lo peor sin confirmación.',
    example: '"Ella no responde → está molesta conmigo"',
    pattern_indicators: ['seguro que', 'sé que', 'debe estar'],
    intervention: 'Prueba de realidad: ¿podrías preguntarle?',
    severity: 'moderate',
  },
  {
    id: 'dc_03_generalizacion',
    name: 'Generalización excesiva',
    definition: 'Un evento negativo se convierte en patrón permanente.',
    example: '"Cometí error → siempre arruino todo"',
    pattern_indicators: ['siempre', 'nunca', 'jamás'],
    intervention: 'Contrapruebas: ¿excepciones a esta regla?',
    severity: 'moderate',
  },
  {
    id: 'dc_09_sesgo_confirmatorio',
    name: 'Sesgo confirmatorio',
    definition: 'Buscar evidencia solo de creencias negativas.',
    example: '"No merezco amor. Ese rechazo lo prueba. Ignoro que 3 me aman."',
    pattern_indicators: ['eso demuestra', 'como ves', 'lo sabía'],
    intervention: 'Registro de evidencia positiva y negativa',
    severity: 'high',
  },
  {
    id: 'dc_06_etiquetacion',
    name: 'Etiquetación',
    definition: 'Reducir identidad a un error puntual.',
    example: '"Cometí error → soy un fracaso"',
    pattern_indicators: ['soy un', 'soy incapaz', 'soy...'],
    intervention: 'Flexibilización: tú eres una persona que comete errores',
    severity: 'high',
  },
];

// ============================================================================
// Analyzers (Pure Functions)
// ============================================================================

/**
 * Analiza si el patrón observado en la sesión es coherente
 * con la creencia nuclear inicial identificada en Primer Encuentro
 */
function analyzeCoherence(
  baselineBeliefs: string[],
  coreBeliefEvidence: string[],
  sessionTranscript: string,
  baselineHypothesis: string
): CoherenceAnalysis {
  const evidence: string[] = [];
  const contradictions: string[] = [];
  let coherenceScore = 50; // baseline

  // Buscar reafirmación de la creencia en la sesión
  for (const phrase of coreBeliefEvidence) {
    if (sessionTranscript.toLowerCase().includes(phrase.toLowerCase())) {
      evidence.push(`Reafirmación: "${phrase}" aparece en sesión`);
      coherenceScore += 10;
    }
  }

  // Buscar patrones de evitación (comportamientos que mantienen creencia)
  const avoidanceKeywords = ['me fui', 'decidí no ir', 'no pude', 'escape', 'evité'];
  for (const keyword of avoidanceKeywords) {
    if (sessionTranscript.toLowerCase().includes(keyword)) {
      evidence.push(`Patrón de evitación: "${keyword}" → comportamiento mantiene creencia`);
      coherenceScore += 5;
    }
  }

  // Buscar signos de cambio (contradicciones)
  const changeKeywords = ['intenté', 'traté de', 'me atreví', 'participé', 'logré'];
  for (const keyword of changeKeywords) {
    if (sessionTranscript.toLowerCase().includes(keyword)) {
      contradictions.push(`Signo positivo: "${keyword}" → comportamiento contradice creencia`);
      coherenceScore -= 5; // reduce coherencia (cambio positivo)
    }
  }

  const isCoherent = coherenceScore > 60;

  return {
    isCoherent,
    evidence,
    contradictions,
    coherenceScore: Math.max(0, Math.min(100, coherenceScore)),
    clinicalNote: isCoherent
      ? `Patrón coherente con hipótesis inicial. La creencia mantiene el ciclo conductual.`
      : `Signos de cambio: el paciente está desafiando la creencia (comportamiento > cognición).`,
  };
}

/**
 * Detecta distorsiones cognitivas en el transcript de la sesión
 * buscando patrones de lenguaje que coinciden con la base de conocimiento
 */
function detectDistortions(sessionTranscript: string, distortionDb: CognitivDistortion[]): DistortionIdentification[] {
  const detected: DistortionIdentification[] = [];

  for (const distortion of distortionDb) {
    const evidence: string[] = [];

    // Buscar indicadores de patrón en el transcript
    for (const indicator of distortion.pattern_indicators) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = sessionTranscript.match(regex);
      if (matches) {
        // Extraer contexto alrededor del match (simple regex-based)
        const regex2 = new RegExp(`[^.!?]{0,50}${indicator}[^.!?]{0,50}`, 'gi');
        const contextMatches = sessionTranscript.match(regex2);
        if (contextMatches) {
          evidence.push(...contextMatches.slice(0, 2)); // primeros 2 matches
        }
      }
    }

    // Si hay evidencia, agregar a detected
    if (evidence.length > 0) {
      detected.push({
        distortionId: distortion.id,
        name: distortion.name,
        severity: distortion.severity,
        evidence: evidence.map(e => e.trim()),
        pattern: distortion.definition,
      });
    }
  }

  // Ordenar por severidad (high → moderate → low)
  return detected.sort((a, b) => {
    const severityOrder = { high: 0, moderate: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Analiza la narrativa: ¿el paciente se abre más o se retrae?
 * Se basa en longitud de respuestas, tono emocional, rapport
 */
function analyzeNarrative(
  sessionTranscript: string,
  rapportScore?: number,
  emotionalTone?: string
): NarrativeAnalysis {
  // Dividir por turnos (simple: split por "Terapeuta:" y "Paciente:")
  const patientTurns = sessionTranscript.split(/Paciente:|Patient:/i).slice(1);
  const responseLengths = patientTurns.map(turn => turn.trim().length);

  let trend: 'expanding' | 'contracting' | 'stable' | 'unknown' = 'stable';

  if (responseLengths.length >= 3) {
    const first = responseLengths[0] || 0;
    const last = responseLengths[responseLengths.length - 1] || 0;
    const mid = responseLengths[Math.floor(responseLengths.length / 2)] || 0;

    if (last > mid && mid > first) trend = 'expanding';
    else if (first > mid && mid > last) trend = 'contracting';
  }

  return {
    trend,
    emotionalTone: emotionalTone || 'neutral',
    rapportScore: rapportScore ?? 50,
    keyPhrases: [], // placeholder: sería extractKeyPhrases(sessionTranscript)
    comparisonWithPrevious: null, // requeriría dato de sesión anterior
  };
}

/**
 * Calcula cambio clínicamente significativo usando RCI Jacobson-Truax
 */
function calculateChangeIndicators(
  previousBDI: number | null,
  currentBDI: number | null,
  sessionType: string
): ChangeIndicators {
  // Parámetros BDI-II (Sanz 2003)
  const BDI_II_SD = 9.7;
  const BDI_II_RELIABILITY = 0.93;
  const BDI_II_SE_DIFF = BDI_II_SD * Math.sqrt(2 * (1 - BDI_II_RELIABILITY));
  const RCI_THRESHOLD = 1.96;

  let bdiChange = null;
  if (currentBDI !== null) {
    const change = previousBDI !== null ? currentBDI - previousBDI : 0;
    const rci = previousBDI !== null ? change / BDI_II_SE_DIFF : undefined;
    const clinicallySignificant = rci !== undefined && Math.abs(rci) >= RCI_THRESHOLD;

    bdiChange = {
      previous: previousBDI,
      current: currentBDI,
      change,
      rci,
      direction:
        change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      interpretation:
        previousBDI === null
          ? `Baseline BDI-II: ${currentBDI} (sin comparación previa)`
          : clinicallySignificant
          ? `Cambio significativo (RCI=${rci?.toFixed(2)})`
          : `Sin cambio significativo en sesión ${sessionType.split('_')[1]} (esperado)`,
    };
  }

  return {
    bdi: bdiChange,
    bads: null,
    das: null,
    phq9: null,
    otherInventories: {},
    overallTrend: bdiChange?.direction === 'down' ? 'improving' : bdiChange?.direction === 'up' ? 'deteriorating' : 'stable',
    clinicallySignificant: bdiChange ? Math.abs(bdiChange.rci ?? 0) >= RCI_THRESHOLD : false,
  };
}

/**
 * Genera alertas críticas basadas en el análisis
 */
function generateAlerts(
  coherence: CoherenceAnalysis,
  distortions: DistortionIdentification[],
  changeIndicators: ChangeIndicators,
  sessionTranscript: string
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Alerta: Deterioro rápido
  if (changeIndicators.bdi?.direction === 'up' && changeIndicators.bdi?.rci !== undefined && changeIndicators.bdi.rci > 1.96) {
    alerts.push({
      type: 'rapid_deterioration',
      severity: 'high',
      message: `Deterioro significativo en BDI-II (RCI=${changeIndicators.bdi.rci.toFixed(2)})`,
      evidence: [`BDI anterior: ${changeIndicators.bdi.previous}`, `BDI actual: ${changeIndicators.bdi.current}`],
      recommendedAction: 'Revisar factores externos, seguridad del paciente, necesidad de derivación',
    });
  }

  // Alerta: Crisis ideation
  if (sessionTranscript.toLowerCase().includes('suicid') || sessionTranscript.toLowerCase().includes('quiero morir')) {
    alerts.push({
      type: 'crisis_ideation',
      severity: 'critical',
      message: 'Ideación suicida detectada en sesión',
      evidence: [sessionTranscript.substring(0, 100)],
      recommendedAction: 'Activar protocolo de crisis. Evaluación de riesgo inmediata.',
    });
  }

  // Alerta: Resistencia terapéutica
  if (
    sessionTranscript.toLowerCase().includes('no puedo') ||
    sessionTranscript.toLowerCase().includes('no funciona')
  ) {
    if (coherence.evidence.some(e => e.includes('evitación'))) {
      alerts.push({
        type: 'therapeutic_resistance',
        severity: 'moderate',
        message: 'Evitación conductual activa: paciente escapa ante ansiedad/tareas',
        evidence: coherence.evidence.filter(e => e.includes('evitación')),
        recommendedAction: 'Validar resistencia, reducir gradualmente la exposición, reforzar alianza',
      });
    }
  }

  // Alerta: Múltiples distorsiones de alta severidad
  const highSeverityCount = distortions.filter(d => d.severity === 'high').length;
  if (highSeverityCount >= 2) {
    alerts.push({
      type: 'new_symptom',
      severity: 'moderate',
      message: `${highSeverityCount} distorsiones cognitivas de alta severidad identificadas`,
      evidence: distortions.filter(d => d.severity === 'high').map(d => d.name),
      recommendedAction: 'Priorizar reestructuración cognitiva. Considerar Thought Records para siguiente sesión.',
    });
  }

  return alerts;
}

/**
 * Genera sugerencias específicas para la próxima sesión
 * basadas en patrones identificados
 */
function generateSuggestions(
  coherence: CoherenceAnalysis,
  distortions: DistortionIdentification[],
  changeIndicators: ChangeIndicators,
  alerts: ClinicalAlert[]
): SessionSuggestion[] {
  const suggestions: SessionSuggestion[] = [];

  // Sugerencia 1: Si hay mucha evitación → behavioral activation intensiva
  if (coherence.evidence.some(e => e.includes('evitación'))) {
    suggestions.push({
      technique: 'Behavioral Activation + Exposición Gradual',
      rationale: 'El patrón de evitación es el mecanismo principal que mantiene la creencia negativa',
      priority: 'high',
      steps: [
        'Revisar tareas de activación completadas',
        'Aumentar gradualmente duración o dificultad',
        'Registrar cambios emocionales (validar: ansiedad ↓ con exposición)',
      ],
      linkedTo: { patternType: 'avoidance_maintenance' },
    });
  }

  // Sugerencia 2: Si hay lectura mental / sesgo confirmatorio → thought records
  const highSeverityDistortions = distortions.filter(d => d.severity === 'high');
  if (highSeverityDistortions.some(d => d.id === 'dc_02_lectura_mental' || d.id === 'dc_09_sesgo_confirmatorio')) {
    suggestions.push({
      technique: 'Thought Record 5-7 columnas',
      rationale: 'Ayudar al paciente a identificar la distorsión cognitiva y buscar evidencia alternativa',
      priority: 'high',
      steps: [
        'Situación: situación que activa el pensamiento',
        'Pensamiento automático: la lectura mental específica',
        'Evidencia que apoya / contradice',
        'Pensamiento alternativo',
        'Resultado: cómo cambió la emoción',
      ],
      linkedTo: { distortionId: 'dc_02_lectura_mental' },
    });
  }

  // Sugerencia 3: Si hay mejora → reforzar y consolidar
  if (changeIndicators.overallTrend === 'improving' && changeIndicators.clinicallySignificant) {
    suggestions.push({
      technique: 'Consolidación de Ganancias',
      rationale: 'El paciente está mejorando. Reforzar qué está funcionando y prevenir recaída.',
      priority: 'medium',
      steps: [
        '¿Qué comportamiento cambió? → reforzar',
        '¿Qué pensamiento desafiaste? → recordar',
        'Plan de prevención de recaída: anticipar triggers',
      ],
    });
  }

  // Sugerencia 4: Si hay deterioro → escalonar intervención
  if (changeIndicators.overallTrend === 'deteriorating') {
    suggestions.push({
      technique: 'Evaluación y Escalonamiento',
      rationale: 'El paciente está empeorando. Revisar factores externos, medicación, necesidad de apoyo adicional.',
      priority: 'high',
      steps: [
        'Revisar cambios en vida: estrés, pérdidas, cambios médicos',
        'Evaluar adherencia a plan terapéutico',
        'Considerar derivación a psiquiatría o intensificar frecuencia de sesiones',
      ],
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// Orquestador Principal
// ============================================================================

/**
 * Analiza los patrones de una sesión completada
 * y retorna resultado estructurado para documentación en carpeta del paciente
 */
export async function analyzeSessionPatterns(
  sessionData: SessionData,
  interviewReport: InterviewReport,
  previousBDI: number | null
): Promise<PatternAnalysisResult> {
  // 1. Análisis de Coherencia
  const coherence = analyzeCoherence(
    interviewReport.patientView.problemList,
    interviewReport.therapistView.coreBeliefEvidence,
    sessionData.transcript,
    interviewReport.therapistView.hypothesis
  );

  // 2. Detección de Distorsiones
  const distortions = detectDistortions(sessionData.transcript, COGNITIVE_DISTORTIONS);

  // 3. Análisis de Narrativa
  const narrative = analyzeNarrative(
    sessionData.transcript,
    sessionData.rapportScore,
    sessionData.emotionalTone
  );

  // 4. Cálculo de Cambio
  const currentBDI = sessionData.inventoriesAdministered.find(i => i.inventario === 'BDI-II')?.puntuacion ?? null;
  const changeIndicators = calculateChangeIndicators(previousBDI, currentBDI, sessionData.type);

  // 5. Generación de Alertas
  const alerts = generateAlerts(coherence, distortions, changeIndicators, sessionData.transcript);

  // 6. Sugerencias para próxima sesión
  const suggestions = generateSuggestions(coherence, distortions, changeIndicators, alerts);

  // 7. Hipótesis actualizada
  const updatedHypothesis = coherence.isCoherent
    ? `${interviewReport.therapistView.hypothesis} [SESIÓN ${sessionData.number}: PATRÓN REAFIRMADO]`
    : `${interviewReport.therapistView.hypothesis} [SESIÓN ${sessionData.number}: SIGNOS DE CAMBIO - continuar con técnica]`;

  // 8. Síntesis para documentación
  const summaryForFolder = `
### Sesión ${sessionData.number} (${sessionData.type.toUpperCase()}) — Análisis de Patrones

**Coherencia del patrón:** ${coherence.coherenceScore}/100
- ${coherence.isCoherent ? '✓ Patrón mantiene la lógica inicial' : '✓ Signos de cambio positivo'}
- ${coherence.evidence.join('\n- ')}
${coherence.contradictions.length > 0 ? `- **Contradiciones:** ${coherence.contradictions.join(', ')}` : ''}

**Distorsiones identificadas:** ${distortions.length > 0 ? distortions.map(d => `${d.name} (${d.severity})`).join(', ') : 'Ninguna'}

**Cambio en BDI-II:**
${changeIndicators.bdi?.interpretation || 'Sin dato de BDI-II'}

**Alertas:** ${alerts.length > 0 ? alerts.map(a => `⚠️ ${a.type}: ${a.message}`).join('\n') : 'Ninguna'}

**Próxima sesión:** ${suggestions.map(s => `- ${s.technique} (${s.rationale.substring(0, 50)}...)`).join('\n')}
`;

  return {
    sessionNumber: sessionData.number,
    sessionType: sessionData.type,
    analyzedAt: Date.now(),
    coherenceAnalysis: coherence,
    distortionsIdentified: distortions,
    narrativeAnalysis: narrative,
    changeIndicators,
    alerts,
    suggestions,
    updatedHypothesis,
    summaryForFolder,
  };
}

// ============================================================================
// Helper: Formatear para documentación en carpeta
// ============================================================================

export function formatPatternAnalysisForFolder(result: PatternAnalysisResult): string {
  return result.summaryForFolder;
}
