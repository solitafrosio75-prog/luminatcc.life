/**
 * patternTypes.ts — Tipos para Pattern Analysis System
 *
 * Define la estructura de datos para análisis continuo de patrones
 * clínicos sesión por sesión, con documentación en carpeta del paciente.
 *
 * Principios:
 * - Inmutable (no se modifica, solo se agrega al log)
 * - Semántico (cada campo tiene significado clínico)
 * - Auditable (trazabilidad completa de decisiones)
 */

// ============================================================================
// Análisis de Coherencia
// ============================================================================

export interface CoherenceAnalysis {
  /** ¿El patrón observado es coherente con creencia nuclear inicial? */
  isCoherent: boolean;

  /** Evidencia que apoya la coherencia (frases literales del paciente) */
  evidence: string[];

  /** Contradicciones o signos de cambio */
  contradictions: string[];

  /** Score de coherencia 0-100 (100 = perfectamente coherente con hipótesis inicial) */
  coherenceScore: number;

  /** Narrativa interpretativa para el terapeuta */
  clinicalNote: string;
}

// ============================================================================
// Detección de Distorsiones Cognitivas
// ============================================================================

export interface DistortionIdentification {
  /** ID de la distorsión en knowledge base */
  distortionId: string;

  /** Nombre legible: "Catastrofización", "Lectura de la mente", etc. */
  name: string;

  /** Severidad: cómo interfiere con el funcionamiento */
  severity: 'low' | 'moderate' | 'high';

  /** Frases literales del paciente que evidencian la distorsión */
  evidence: string[];

  /** Patrón subyacente identificado */
  pattern: string;
}

// ============================================================================
// Análisis de Narrativa y Tono
// ============================================================================

export interface NarrativeAnalysis {
  /** Trend: ¿el paciente abre más o se retrae? */
  trend: 'expanding' | 'contracting' | 'stable' | 'unknown';

  /** Tono emocional en esta sesión */
  emotionalTone: string; // 'distressed' | 'guarded' | 'analytical' | 'open' | 'neutral'

  /** Rapport score (0-100) en esta sesión */
  rapportScore: number;

  /** Frases clave extraídas de la sesión */
  keyPhrases: string[];

  /** Comparativa con sesión anterior */
  comparisonWithPrevious: {
    rapportChange: 'improved' | 'declined' | 'stable';
    toneChange: 'more_open' | 'more_guarded' | 'stable';
    narrativeChange: 'expanding' | 'contracting' | 'stable';
  } | null;
}

// ============================================================================
// Indicadores de Cambio (Clínicamente Significativo)
// ============================================================================

export interface ChangeIndicators {
  /** BDI-II: análisis de cambio confiable (RCI Jacobson-Truax) */
  bdi: InventoryChange | null;

  /** BADS: Behavioral Activation for Depression Scale */
  bads: InventoryChange | null;

  /** DAS: Dysfunctional Attitudes Scale */
  das: InventoryChange | null;

  /** PHQ-9: si fue administrado */
  phq9: InventoryChange | null;

  /** Otros inventarios */
  otherInventories: Record<string, InventoryChange>;

  /** Tendencia general basada en inventarios */
  overallTrend: 'improving' | 'deteriorating' | 'stable';

  /** ¿Hay cambio clínicamente significativo? (RCI >= 1.96) */
  clinicallySignificant: boolean;
}

export interface InventoryChange {
  previous: number | null;
  current: number;
  change: number; // current - previous
  rci?: number; // Reliable Change Index
  direction: 'up' | 'down' | 'stable';
  interpretation: string; // "Leve mejora" | "Sin cambio esperado en sesión 2"
}

// ============================================================================
// Alertas Clínicas Dinámicas
// ============================================================================

export interface ClinicalAlert {
  /** Tipo de alerta */
  type:
    | 'crisis_ideation' // Emergencia de ideación suicida
    | 'rapid_deterioration' // Cambio negativo rápido
    | 'therapeutic_resistance' // Paciente rechaza intervención
    | 'new_symptom' // Síntoma emergente preocupante
    | 'trauma_disclosure' // Revelación traumática
    | 'substance_abuse' // Indicios de abuso
    | 'medical_referral_needed' // Necesidad de derivación médica
    | 'low_engagement'; // Baja adherencia

  /** Severidad clínica */
  severity: 'low' | 'moderate' | 'high' | 'critical';

  /** Mensaje para el terapeuta */
  message: string;

  /** Evidencia que respalda la alerta */
  evidence: string[];

  /** Acción recomendada */
  recommendedAction: string;
}

// ============================================================================
// Sugerencias Dinámicas para Próxima Sesión
// ============================================================================

export interface SessionSuggestion {
  /** Técnica recomendada (ej: "Behavioral Activation", "Thought Record") */
  technique: string;

  /** Por qué es relevante basado en esta sesión */
  rationale: string;

  /** Prioridad dentro de la sesión */
  priority: 'high' | 'medium' | 'low';

  /** Pasos concretos */
  steps?: string[];

  /** Vinculación a distorsión/patrón específico */
  linkedTo?: {
    distortionId?: string;
    patternType?: string;
  };
}

// ============================================================================
// Resultado Completo del Análisis de Patrones
// ============================================================================

export interface PatternAnalysisResult {
  /** Identificación de la sesión */
  sessionNumber: number;
  sessionType: 'ac_1' | 'ac_2' | 'ac_3' | 'ac_4' | 'ac_5' | 'ac_6' | 'ac_7' | 'rc_1' | 'rc_2' | 'rc_3' | 'followup';
  analyzedAt: number; // timestamp ms

  // ── Análisis Clínico ────────────────────────────────────────────────────
  coherenceAnalysis: CoherenceAnalysis;
  distortionsIdentified: DistortionIdentification[];
  narrativeAnalysis: NarrativeAnalysis;
  changeIndicators: ChangeIndicators;
  alerts: ClinicalAlert[];

  // ── Sugerencias para próxima sesión ─────────────────────────────────────
  suggestions: SessionSuggestion[];

  // ── Hipótesis actualizada ───────────────────────────────────────────────
  updatedHypothesis: string; // Reformulación de la hipótesis clínica después de esta sesión

  // ── Documentación en carpeta ────────────────────────────────────────────
  summaryForFolder: string; // Síntesis legible para terapeuta (markdown)
}

// ============================================================================
// Entrada al PatternProcessor
// ============================================================================

export interface SessionData {
  /** Identificación */
  number: number;
  type: 'ac_1' | 'ac_2' | 'ac_3' | 'ac_4' | 'ac_5' | 'ac_6' | 'ac_7' | 'rc_1' | 'rc_2' | 'rc_3' | 'followup';

  /** Transcripción completa de la sesión */
  transcript: string;

  /** Evaluaciones administradas en esta sesión */
  inventoriesAdministered: Array<{
    inventario: string;
    puntuacion: number;
    alertaCritica?: boolean;
  }>;

  /** Tareas asignadas y completadas */
  homework: {
    assigned: string[];
    completed: string[];
    resistance?: string;
  };

  /** Notas clínicas del terapeuta (observaciones) */
  therapistObservations?: string;

  /** Contexto: qué técnica se usó */
  techniqueUsed?: string;

  /** Indicadores cualitativos */
  rapportScore?: number;
  emotionalTone?: string;
}

// ============================================================================
// Log Persistente en PatientFolder
// ============================================================================

export interface PatternAnalysisLogEntry {
  sessionNumber: number;
  sessionType: string;
  analyzedAt: number;

  /** Análisis completo */
  analysis: PatternAnalysisResult;

  /** Acciones para el terapeuta (extracted from suggestions) */
  therapistActionItems: string[];

  /** Preparación para próxima sesión */
  nextSessionSuggestions: string[];

  /** Flag: ¿fue revisado por el terapeuta? */
  reviewedByTherapist?: boolean;
  reviewedAt?: number;
}

// ============================================================================
// Tipos auxiliares
// ============================================================================

export type CognitivDistortion = {
  id: string;
  name: string;
  definition: string;
  example: string;
  pattern_indicators: string[];
  intervention: string;
  severity: 'low' | 'moderate' | 'high';
};
