/**
 * Base de datos clínica de tcc-lab
 *
 * Implementación con Dexie.js sobre IndexedDB.
 * Todo el almacenamiento es local — sin servidor, sin red.
 *
 * Arquitectura de 4 capas:
 *   Capa 1 — Identidad y contexto clínico
 *   Capa 2 — Sesión y protocolo (la sesión es la unidad central)
 *   Capa 3 — Registros clínicos (inmutables, append-only)
 *   Capa 4 — Aprendizaje y efectividad (cache calculado)
 *
 * Principios:
 *   - Los registros clínicos (ABCRecord, AutomaticThoughtRecord) NO se editan.
 *     Las correcciones se hacen añadiendo un nuevo registro con amendedFrom.
 *   - Los patrones se calculan con queries, no se guardan en tablas separadas.
 *   - Multi-paciente: patientId vincula sesiones y perfil clínico a cada paciente.
 *   - SUDs 0-100 como escala estándar de intensidad.
 */

import Dexie, { type Table } from 'dexie';
import type {
  SUDs,
  ProtocolPhase,
  ClinicalEmotion,
  CognitiveDistortion,
  TCCTechnique,
  BehaviorType,
  ConsequenceType,
  GoalStatus,
} from './types';

// ============================================================================
// CAPA 1: IDENTIDAD Y CONTEXTO CLÍNICO
// ============================================================================

/**
 * Perfil clínico de un paciente.
 * Una fila por patientRecordId — estado del protocolo terapéutico.
 *
 * Los datos de admisión e intake (chiefComplaint, areasAffected, etc.)
 * viven exclusivamente en PatientRecord.
 */
export interface ClinicalProfile {
  id?: number;
  patientRecordId: number;    // FK to patientRecords.id

  createdAt: Date;
  lastActiveAt: Date;

  // === BASELINE GLOBAL (capturado al inicio, fijo para siempre) ===
  baselineSUDs?: SUDs;         // Intensidad media declarada al inicio (0-100)
  baselineFunctionalImpairment?: 'minimal' | 'mild' | 'moderate' | 'severe' | 'very_severe';
  baselineCapturedAt?: Date;

  // === ESTADO DEL PROCESO ===
  currentPhase: ProtocolPhase;
  phaseStartedAt: Date;
  sessionCountByPhase: Partial<Record<ProtocolPhase, number>>;
}

/**
 * Inventario de síntomas específicos.
 * Cada síntoma es una fila. Si cambia, se marca como 'resolved' y se crea uno nuevo.
 * Esto preserva la historia y permite calcular reducción de síntomas.
 */
export interface SymptomEntry {
  id?: number;

  // Descripción
  description: string;               // "Palpitaciones antes de hablar en público"
  emotionCategory: ClinicalEmotion;

  // Parámetros al registrar (inmutables)
  intensityAtOnset: SUDs;
  frequencyAtOnset: 'daily' | 'several_weekly' | 'weekly' | 'occasional';
  durationAtOnset: string;           // "15-20 minutos"

  // Estado actual (actualizable)
  currentIntensity: SUDs;
  currentFrequency: 'daily' | 'several_weekly' | 'weekly' | 'occasional' | 'remitted';

  // Trazabilidad
  capturedAt: Date;
  capturedInSessionId?: number;
  lastUpdatedAt: Date;
  status: 'active' | 'improved' | 'resolved' | 'worsened';

  // Vinculación a objetivo SMART (si aplica)
  linkedGoalId?: number;

  // Notas cronológicas de cambios (no se borra historial)
  updateNotes: string[];
}

// ============================================================================
// CAPA 2: SESIÓN Y PROTOCOLO
// ============================================================================

/**
 * La sesión es la unidad central de tcc-lab.
 * Todo registro clínico pertenece a una sesión.
 * Una sesión puede ser una práctica de 10 minutos o una evaluación de 60.
 */
export interface Session {
  id?: number;
  patientId: number;           // FK to patientRecords.id

  // Tipo y fase
  type:
    | 'intake'               // Primera sesión de evaluación
    | 'assessment'           // Evaluación ABC
    | 'psychoeducation'      // Sesión educativa
    | 'goal_setting'         // Definición de objetivos SMART
    | 'technique_practice'   // Práctica de técnica específica
    | 'change_evaluation'    // Evaluación de progreso vs baseline
    | 'followup'             // Seguimiento
    | 'free';                // Sesión libre (no estructurada)

  phase: ProtocolPhase;
  technique?: TCCTechnique;  // Para sesiones de type='technique_practice'

  // Temporalidad
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;

  // Momento del día (para patrones temporales)
  timeOfDay: 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=domingo

  // Estado emocional de la sesión
  sudsAtStart?: SUDs;
  sudsAtEnd?: SUDs;
  dominantEmotionAtStart?: ClinicalEmotion;

  // Estado
  status: 'active' | 'completed' | 'abandoned';

  // Nota libre de cierre
  sessionNote?: string;
}

/**
 * Registro de módulos de psicoeducación completados.
 * La psicoeducación (Fase 3) es fundamental para que el resto del protocolo tenga sentido.
 */
export interface PsychoeducationLog {
  id?: number;
  sessionId: number;
  completedAt: Date;

  module:
    | 'cognitive_model'       // Situación → Pensamiento → Emoción → Conducta
    | 'cognitive_distortions' // Las 12 distorsiones cognitivas
    | 'abc_model'             // Antecedente → Conducta → Consecuencia
    | 'exposure_rationale'    // Por qué la exposición funciona
    | 'behavioral_activation' // Ciclo inactividad-depresión
    | 'anxiety_cycle'         // Ciclo de evitación
    | 'maintenance_factors';  // Qué mantiene el problema

  comprehensionRating: 1 | 2 | 3 | 4 | 5;
  questionAsked?: string;
  personalInsight?: string;
}

// ============================================================================
// CAPA 3: REGISTROS CLÍNICOS
// ============================================================================

/**
 * Registro ABC completo — Antecedente, Conducta, Consecuencia.
 *
 * INMUTABLE: nunca se edita. Si hay corrección, se crea un nuevo registro
 * con amendedFrom apuntando al original.
 *
 * Los campos de búsqueda frecuente se desnormalizan al nivel raíz
 * porque Dexie no indexa campos anidados.
 */
export interface ABCRecord {
  id?: number;
  sessionId: number;
  capturedAt: Date;

  linkedSymptomId?: number;

  // Campos desnormalizados para índices
  antecedentEmotion: ClinicalEmotion;
  sudsAtAntecedent: SUDs;
  behaviorType: BehaviorType;
  consequenceType: ConsequenceType;

  // === A: ANTECEDENTE ===
  antecedent: {
    situationDescription: string;
    location?: string;
    timeContext?: string;
    personsInvolved?: string;
    internalTrigger?: string;
    suds: SUDs;
    emotion: ClinicalEmotion;
  };

  // === B: CONDUCTA ===
  behavior: {
    description: string;
    type: BehaviorType;
    durationMinutes?: number;
    intensityRating: 1 | 2 | 3 | 4 | 5;
    wasPlanned: boolean;
  };

  // === C: CONSECUENCIA ===
  consequence: {
    immediateDescription: string;
    immediateEmotion: ClinicalEmotion;
    immediateSUDs: SUDs;
    consequenceType: ConsequenceType;
    reliefObtained: boolean;
    delayedDescription?: string;
    delayedEmotion?: ClinicalEmotion;
    delayedSUDs?: SUDs;
  };

  // Análisis (opcional, completado por el usuario)
  analysis?: {
    behaviorFunction?: string;
    maintenanceFactors?: string[];
    breakingPoints?: string[];
    alternativeBehavior?: string;
  };

  cognitiveDistortionsDetected: CognitiveDistortion[];

  // Inmutabilidad
  isAmendment: boolean;
  amendedFrom?: number;
}

/**
 * Pensamiento automático tal como apareció — sin editar, sin procesar.
 *
 * INMUTABLE. Se complementa con CognitiveRestructuringRecord.
 * Separar el pensamiento bruto de la reestructuración permite ver
 * cuánto cambió la creencia a lo largo del proceso.
 */
export interface AutomaticThoughtRecord {
  id?: number;
  sessionId: number;
  capturedAt: Date;

  linkedABCRecordId?: number;

  // El pensamiento tal como llegó
  thoughtText: string;
  situationThatTriggered: string;

  // Campos raíz para índices
  emotion: ClinicalEmotion;
  emotionIntensity: SUDs;

  detectedDistortions: CognitiveDistortion[];
  detectionConfidence?: 'low' | 'medium' | 'high';

  // Inmutabilidad
  isAmendment: boolean;
  amendedFrom?: number;
}

/**
 * Reestructuración cognitiva sobre un pensamiento automático.
 *
 * Un mismo pensamiento puede reestructurarse varias veces.
 * La creencia en el pensamiento original debería disminuir con cada iteración.
 */
export interface CognitiveRestructuringRecord {
  id?: number;
  sessionId: number;
  completedAt: Date;

  automaticThoughtRecordId: number;

  socraticDialogue?: {
    evidenceFor: string;
    evidenceAgainst: string;
    alternativeExplanation: string;
    worstCase: string;
    worstCaseCoping: string;
    friendPerspective: string;
  };

  alternativeThought: string;
  beliefInAlternative: number;       // 0-100
  beliefInOriginalAfter: number;     // 0-100

  emotionAfter: ClinicalEmotion;
  emotionIntensityAfter: SUDs;

  distortionsAddressed: CognitiveDistortion[];

  effectivenessRating: 1 | 2 | 3 | 4 | 5;
  feltBetter: boolean;

  actionPlanned?: string;
  actionCompleted?: boolean;
}

/**
 * Objetivo terapéutico SMART con baseline explícito.
 * La diferencia baseline→actual medida en GoalProgressEntry ES el cambio clínico.
 */
export interface TherapeuticGoal {
  id?: number;
  createdAt: Date;
  sessionId: number;

  goalText: string;

  smart: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };

  targetBehavior: string;
  linkedSymptomId?: number;

  baseline: {
    capturedAt: Date;
    value: number;
    unit: string;
    description: string;
  };

  target: {
    value: number;
    unit: string;
    deadline: Date;
  };

  status: GoalStatus;
  achievedAt?: Date;
  revisedNotes?: string;

  assignedTechniques: TCCTechnique[];
}

/**
 * Medición periódica de un objetivo terapéutico.
 * La curva de estas mediciones a lo largo del tiempo ES el cambio clínico.
 */
export interface GoalProgressEntry {
  id?: number;
  goalId: number;
  sessionId: number;
  measuredAt: Date;

  currentValue: number;
  unit: string;

  userNarrative?: string;
  perceivedDifficulty: 1 | 2 | 3 | 4 | 5;

  changeFromBaseline: number;
  percentChangeFromBaseline: number;
}

/**
 * Registro de cada ejecución de una técnica TCC.
 *
 * La tabla más importante para el aprendizaje adaptativo:
 * qué técnicas reducen más los SUDs para ESTE usuario,
 * en qué momentos, y para qué emociones.
 */
export interface TechniqueExecution {
  id?: number;
  sessionId: number;
  executedAt: Date;

  technique: TCCTechnique;
  variant?: string;

  // Contexto (desnormalizado para índices)
  emotionAtStart: ClinicalEmotion;
  sudsAtStart: SUDs;
  hourOfDay: number;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  durationMinutes: number;
  completed: boolean;
  completionPercentage?: number;
  abandonedReason?: string;

  sudsAtEnd?: SUDs;
  emotionAtEnd?: ClinicalEmotion;
  sudsChange?: number;           // sudsAtEnd - sudsAtStart (negativo = mejora)

  effectivenessRating?: 1 | 2 | 3 | 4 | 5;
  wouldRepeat?: boolean;
  userNote?: string;

  linkedABCRecordId?: number;
  linkedThoughtRecordId?: number;
  linkedGoalId?: number;
  linkedExposureStepId?: string;
}

/**
 * Jerarquía de exposición gradual.
 *
 * REGLA CLÍNICA CRÍTICA: Un paso solo puede marcarse como 'available'
 * si el anterior está en 'completed'. La exposición desordenada
 * puede empeorar la condición del paciente.
 */
export interface ExposureHierarchy {
  id?: number;
  createdAt: Date;
  sessionId: number;
  linkedGoalId?: number;

  targetBehavior: string;
  rationale?: string;

  status: 'active' | 'paused' | 'completed' | 'abandoned';
  currentStepIndex: number;
  completedAt?: Date;

  totalAttempts: number;
  totalSuccesses: number;
  averageSUDsReduction: number;

  steps: Array<{
    id: string;
    order: number;
    description: string;
    predictedSUDs: SUDs;
    successCriteria: {
      minSuccessfulAttempts: number;
      maxSUDsAtSuccess: SUDs;
    };
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    completedAt?: Date;
    attempts: Array<{
      attemptAt: Date;
      sessionId: number;
      sudsBeforeAttempt: SUDs;
      sudsAfterAttempt: SUDs;
      completed: boolean;
      notes?: string;
      copingStrategiesUsed?: string[];
    }>;
  }>;
}

/**
 * Registro de seguimiento (Fase 7).
 * Captura el estado actual vs baseline para calcular cambio clínicamente significativo.
 */
export interface FollowUpEntry {
  id?: number;
  sessionId: number;
  recordedAt: Date;
  weekNumber: number;

  currentSUDs: SUDs;
  perceivedProgress:
    | 'much_worse' | 'worse' | 'same'
    | 'slightly_better' | 'better' | 'much_better';

  baselineSUDsReference: SUDs;
  sudsChangeFromBaseline: number;
  percentChangeFromBaseline: number;

  techniquesStillUsing: TCCTechnique[];
  techniqueFrequency: 'daily' | 'several_weekly' | 'weekly' | 'rarely' | 'not_using';

  relapseRiskSigns?: string[];
  relapsePreventionPlan?: string;

  whatIsWorkingWell?: string;
  mainChallenge?: string;
  nextSteps?: string;
}

// ============================================================================
// CAPA 4: APRENDIZAJE Y EFECTIVIDAD
// ============================================================================

/**
 * Cache de efectividad de técnicas.
 * NUNCA es fuente de verdad — se regenera desde TechniqueExecution.
 */
export interface TechniqueEffectivenessCache {
  id: TCCTechnique;

  totalExecutions: number;
  completedExecutions: number;
  completionRate: number;

  averageSUDsChange: number;
  medianSUDsChange: number;
  stdDevSUDsChange: number;

  averageEffectivenessRating: number;
  percentWouldRepeat: number;

  bestHoursOfDay: number[];
  bestDaysOfWeek: number[];

  mostEffectiveForEmotions: Array<{
    emotion: ClinicalEmotion;
    averageSUDsChange: number;
  }>;

  lastCalculatedAt: Date;
  basedOnExecutionCount: number;
  recommendationScore: number;
}

// ============================================================================
// TIPOS ADICIONALES PARA SECUENCIAS
// ============================================================================

export interface BaselineSnapshotDB {
  id?: number;
  capturedAt: Date;
  frozenAt: Date;
  metricsData: Record<string, {
    dataPoints: number;
    mean: number;
    stdDev: number;
  }>;
  validityData?: {
    isValid: boolean;
    dataQualityScore: number;
  };
  usableForClinicalSignificance: boolean;
}

export type CognitivePattern = CognitiveDistortion;

export type TimeSlot =
  | 'early_morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night';

export const TIME_SLOT_RANGES: Record<TimeSlot, { start: number; end: number; label: string }> = {
  early_morning: { start: 5, end: 8, label: 'madrugada' },
  morning: { start: 8, end: 12, label: 'manana' },
  midday: { start: 12, end: 15, label: 'mediodia' },
  afternoon: { start: 15, end: 19, label: 'tarde' },
  evening: { start: 19, end: 23, label: 'noche' },
  // Cubre tramo nocturno que cruza medianoche (23:00 a 05:00)
  night: { start: 23, end: 24, label: 'noche profunda' },
};

// ============================================================================
// CAPA 5: HISTORIAL DE CONVERSACIONES
// ============================================================================

/**
 * Origen de la conversación — de qué módulo proviene.
 */
export type ConversationSource =
  | 'interview'          // Entrevista clínica
  | 'emotional_chat'     // Chat emocional
  | 'primer_encuentro'   // Primer encuentro
  | 'session_intake'     // Sesión TCC - fase intake
  | 'session_other'      // Sesión TCC - otras fases
  | 'free';              // Conversación libre

/**
 * Una conversación completa guardada.
 * Cada vez que se completa (o se abandona) un flujo conversacional,
 * se persiste aquí para poder revisarla después.
 */
export interface Conversation {
  id?: number;
  patientId?: string;          // Optional FK to patientRecords.patientId
  source: ConversationSource;
  title: string;               // Resumen breve o primera frase del usuario
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
  messageCount: number;
  /** Extracto del motivo de consulta o tema principal */
  summary?: string;
  /** Datos clínicos asociados (hipótesis, alertas, etc.) */
  clinicalSnapshot?: Record<string, unknown>;
}

/**
 * Un mensaje individual dentro de una conversación.
 * Append-only: los mensajes nunca se editan.
 */
export interface ConversationMessage {
  id?: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  /** Metadatos opcionales (señales clínicas, chips seleccionados, etc.) */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CAPA 6: REGISTRO DE PACIENTES
// ============================================================================

/**
 * Registro de un paciente en el sistema.
 * Indexado por patientId (PAC-AAAAMMDD-xxxx).
 * Es editable — los datos de registro pueden actualizarse desde el módulo terapeuta.
 */
export interface PatientRecord {
  id?: number;
  patientId: string;         // PAC-AAAAMMDD-xxxx — clave de búsqueda principal
  createdAt: Date;
  lastUpdatedAt: Date;

  alias: string;
  birthDate: string;
  age: number;
  gender: string;
  phone?: string;
  email?: string;
  initialContact: string;

  referralSource: string | null;
  referralNotes: string;

  previousTreatment: boolean | null;
  previousTreatmentNotes: string;

  currentMedication: boolean | null;
  currentMedicationNotes: string;

  affectedAreas: string[];   // JSON-serialized array (Dexie no indexa arrays)

  interviewCompleted: boolean;
  interviewCompletedAt: Date | null;

  // Phase 2 — Contexto social (opcionales)
  livingWith?: string | null;
  workStatus?: string | null;
  socialSupportLevel?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Phase 3 — Historia clínica (opcionales)
  isFirstTherapy?: boolean | null;
  previousTherapyNotes?: string;
  psychiatricTreatment?: boolean | null;
  psychiatricNotes?: string;
  familyMentalHealth?: boolean | null;
  familyMentalHealthNotes?: string;

  // Phase 4 — Estado actual (opcionales)
  mainReasonCategories?: string[];   // Multi-selección de motivos
  mainReasonText?: string;
  symptomGroups?: string[];
  distressLevel?: number | null;
  mainGoal?: string | null;
  mainGoalText?: string;

  // Safety gate
  safetyCheckPassed?: boolean;
  safetyCheckAt?: Date | null;
}

export class TCCLabDatabase extends Dexie {
  // Capa 1
  clinicalProfile!:               Table<ClinicalProfile>;
  symptomEntries!:                 Table<SymptomEntry>;

  // Capa 2
  sessions!:                       Table<Session>;
  psychoeducationLogs!:            Table<PsychoeducationLog>;

  // Capa 3
  abcRecords!:                     Table<ABCRecord>;
  automaticThoughtRecords!:        Table<AutomaticThoughtRecord>;
  cognitiveRestructuringRecords!:  Table<CognitiveRestructuringRecord>;
  therapeuticGoals!:               Table<TherapeuticGoal>;
  goalProgressEntries!:            Table<GoalProgressEntry>;
  techniqueExecutions!:            Table<TechniqueExecution>;
  exposureHierarchies!:            Table<ExposureHierarchy>;
  followUpEntries!:                Table<FollowUpEntry>;

  // Capa 4
  techniqueEffectivenessCache!:    Table<TechniqueEffectivenessCache>;
  baselineSnapshots!:              Table<BaselineSnapshotDB>;

  // Capa 5 — Historial
  conversations!:                  Table<Conversation>;
  conversationMessages!:           Table<ConversationMessage>;

  // Capa 6 — Pacientes
  patientRecords!:                 Table<PatientRecord>;

  constructor() {
    super('tcc-lab-db');

    this.version(1).stores({
      // --- CAPA 1 ---
      clinicalProfile:
        '++id, lastActiveAt, currentPhase',

      symptomEntries:
        '++id, capturedAt, emotionCategory, status, capturedInSessionId, linkedGoalId',

      // --- CAPA 2 ---
      sessions:
        '++id, startedAt, phase, type, technique, status, timeOfDay, dayOfWeek',

      psychoeducationLogs:
        '++id, sessionId, completedAt, module',

      // --- CAPA 3 ---
      abcRecords:
        '++id, capturedAt, sessionId, linkedSymptomId, ' +
        'antecedentEmotion, sudsAtAntecedent, behaviorType, consequenceType, isAmendment',

      automaticThoughtRecords:
        '++id, capturedAt, sessionId, linkedABCRecordId, ' +
        'emotion, emotionIntensity, isAmendment',

      cognitiveRestructuringRecords:
        '++id, completedAt, sessionId, automaticThoughtRecordId, ' +
        'emotionIntensityAfter, effectivenessRating',

      therapeuticGoals:
        '++id, createdAt, sessionId, status, linkedSymptomId',

      goalProgressEntries:
        '++id, measuredAt, goalId, sessionId',

      techniqueExecutions:
        '++id, executedAt, sessionId, technique, emotionAtStart, ' +
        'sudsAtStart, sudsChange, completed, hourOfDay, dayOfWeek',

      exposureHierarchies:
        '++id, createdAt, sessionId, linkedGoalId, status',

      followUpEntries:
        '++id, recordedAt, sessionId, weekNumber, currentSUDs, perceivedProgress',

      // --- CAPA 4 ---
      techniqueEffectivenessCache:
        'id, recommendationScore, lastCalculatedAt',
    });

    // Version 2 adds the baselineSnapshots table.
    this.version(2).stores({
      baselineSnapshots:
        '++id, capturedAt, usableForClinicalSignificance',
    });

    // Version 3 adds the conversation history tables.
    this.version(3).stores({
      conversations:
        '++id, source, startedAt, endedAt',
      conversationMessages:
        '++id, conversationId, timestamp',
    });

    // Version 4 adds the patient registry.
    this.version(4).stores({
      patientRecords:
        '++id, patientId, createdAt, lastUpdatedAt, interviewCompleted',
    });

    // Version 5 adds Phase 2-4 registration fields (indexed for clinical queries).
    this.version(5).stores({
      patientRecords:
        '++id, patientId, createdAt, interviewCompleted, livingWith, workStatus, safetyCheckPassed',
    });

    // Version 6 adds contact fields + multi-reason.
    this.version(6).stores({
      patientRecords:
        '++id, patientId, createdAt, interviewCompleted, livingWith, workStatus, safetyCheckPassed, phone, email',
    });

    // Version 7: Multi-patient support — patientId FK on Session, ClinicalProfile, Conversation.
    this.version(7).stores({
      sessions: '++id, patientId, startedAt, phase, type, technique, status, timeOfDay, dayOfWeek',
      clinicalProfile: '++id, patientRecordId, lastActiveAt, currentPhase',
    }).upgrade(tx => {
      // Sesiones legacy → paciente 1
      tx.table('sessions').toCollection().modify(s => {
        if (!s.patientId) s.patientId = 1;
      });
      // ClinicalProfile legacy → vinculado al primer PatientRecord
      tx.table('clinicalProfile').toCollection().modify(p => {
        if (!p.patientRecordId) p.patientRecordId = 1;
      });
    });

    // Version 8: Normalizar distressLevel de 0–10 a 0–100 (SUDs estándar)
    // + limpiar campos duplicados de ClinicalProfile (alias, previousTreatment, intakeCompleted)
    this.version(8).stores({}).upgrade(tx => {
      tx.table('patientRecords').toCollection().modify(r => {
        if (r.distressLevel != null && r.distressLevel <= 10) {
          r.distressLevel = r.distressLevel * 10;
        }
      });
      tx.table('clinicalProfile').toCollection().modify(p => {
        delete p.alias;
        delete p.previousTreatment;
        delete p.previousTreatmentNotes;
        delete p.intakeCompleted;
      });
    });

    // Version 9: Mover campos de intake de ClinicalProfile → PatientRecord
    // chiefComplaint → mainReasonText, areasAffected → affectedAreas (ya existen)
    // problemOnset, problemFrequency, problemDuration → eliminados (nunca se populaban)
    this.version(9).stores({}).upgrade(tx => {
      tx.table('clinicalProfile').toCollection().modify(p => {
        delete p.chiefComplaint;
        delete p.problemOnset;
        delete p.problemFrequency;
        delete p.problemDuration;
        delete p.areasAffected;
      });
    });
  }
}

export const db = new TCCLabDatabase();

// ============================================================================
// HELPERS DE INICIALIZACIÓN Y SESIÓN
// ============================================================================

/**
 * Obtiene o crea el perfil clínico para un paciente dado.
 */
export async function getOrCreateProfile(patientId: string): Promise<ClinicalProfile> {
  // Find the patient record to get its id
  const patientRecord = await db.patientRecords.where('patientId').equals(patientId).first();
  if (!patientRecord) {
    throw new Error(`Patient record not found for patientId: ${patientId}`);
  }
  const patientRecordId = patientRecord.id!;

  const existing = await db.clinicalProfile.where('patientRecordId').equals(patientRecordId).first();
  if (existing) return existing;

  const now = new Date();
  const newProfile: ClinicalProfile = {
    patientRecordId,
    createdAt: now,
    lastActiveAt: now,
    currentPhase: 'intake',
    phaseStartedAt: now,
    sessionCountByPhase: {},
  };

  const id = await db.clinicalProfile.add(newProfile);
  return (await db.clinicalProfile.get(id))!;
}

/** Actualiza la actividad reciente. Llamar al abrir la app. */
export async function touchLastActive(patientId: string): Promise<void> {
  const patientRecord = await db.patientRecords.where('patientId').equals(patientId).first();
  if (!patientRecord?.id) return;

  const profile = await db.clinicalProfile.where('patientRecordId').equals(patientRecord.id).first();
  if (profile?.id != null) {
    await db.clinicalProfile.update(profile.id, { lastActiveAt: new Date() });
  }
}

/** Detecta el momento del día actual. */
export function getCurrentTimeOfDay(): Session['timeOfDay'] {
  const h = new Date().getHours();
  if (h >= 5  && h < 8)  return 'early_morning';
  if (h >= 8  && h < 12) return 'morning';
  if (h >= 12 && h < 14) return 'midday';
  if (h >= 14 && h < 18) return 'afternoon';
  if (h >= 18 && h < 21) return 'evening';
  return 'night';
}

/**
 * Crea una nueva sesión y la devuelve con su ID asignado.
 */
export async function createSession(
  patientId: string,
  type: Session['type'],
  phase: ProtocolPhase,
  options?: {
    technique?: TCCTechnique;
    sudsAtStart?: SUDs;
    dominantEmotionAtStart?: ClinicalEmotion;
  }
): Promise<Session & { id: number }> {
  const patientRecord = await db.patientRecords.where('patientId').equals(patientId).first();
  if (!patientRecord) {
    throw new Error(`Patient record not found for patientId: ${patientId}`);
  }
  const patientRecordId = patientRecord.id!;

  const now = new Date();
  const session: Session = {
    patientId: patientRecordId,
    type,
    phase,
    technique: options?.technique,
    startedAt: now,
    timeOfDay: getCurrentTimeOfDay(),
    dayOfWeek: now.getDay() as Session['dayOfWeek'],
    sudsAtStart: options?.sudsAtStart,
    dominantEmotionAtStart: options?.dominantEmotionAtStart,
    status: 'active',
  };

  const id = await db.sessions.add(session);

  const profile = await db.clinicalProfile.where('patientRecordId').equals(patientRecordId).first();
  if (profile?.id != null) {
    const counts = { ...profile.sessionCountByPhase };
    counts[phase] = (counts[phase] ?? 0) + 1;
    await db.clinicalProfile.update(profile.id, {
      sessionCountByPhase: counts,
      lastActiveAt: now,
    });
  }

  return { ...session, id: id as number };
}

/**
 * Cierra una sesión registrando duración y estado emocional final.
 */
export async function closeSession(
  sessionId: number,
  options?: {
    sudsAtEnd?: SUDs;
    sessionNote?: string;
    status?: 'completed' | 'abandoned';
  }
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  const endedAt = new Date();
  const durationMinutes = Math.round(
    (endedAt.getTime() - session.startedAt.getTime()) / 60000
  );

  await db.sessions.update(sessionId, {
    endedAt,
    durationMinutes,
    sudsAtEnd: options?.sudsAtEnd,
    sessionNote: options?.sessionNote,
    status: options?.status ?? 'completed',
  });
}
// database.ts — añadir a ClinicalProfile
export interface PatientRecord {
  // ... lo que ya tienes
  isActive?: boolean;  // Solo uno puede ser true a la vez
}