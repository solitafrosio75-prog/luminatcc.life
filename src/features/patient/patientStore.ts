/**
 * patientStore.ts
 *
 * Estado global de gestión de pacientes.
 * Persiste el paciente activo en memoria para que todos los módulos
 * (interview, therapist, session) puedan acceder al patientId sin
 * repetir queries a IndexedDB.
 *
 * La fuente de verdad es IndexedDB (PatientRecord en database.ts).
 * Este store es solo la capa de acceso rápido en runtime.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type PatientRecord } from '../../db/database';

// ── Migración de localStorage: homeflow-patients-v1 → tcc-lab-patients-v1 ────
// Se ejecuta una sola vez al importar este módulo, antes de que Zustand inicialice.
(() => {
  const OLD_KEY = 'homeflow-patients-v1';
  const NEW_KEY = 'tcc-lab-patients-v1';
  const old = localStorage.getItem(OLD_KEY);
  if (old && !localStorage.getItem(NEW_KEY)) {
    localStorage.setItem(NEW_KEY, old);
    localStorage.removeItem(OLD_KEY);
  }
})();

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type LifeArea =
  | 'trabajo'
  | 'pareja'
  | 'familia'
  | 'social'
  | 'salud'
  | 'economico'
  | 'academico'
  | 'otro';

export type ReferralSource =
  | 'autoderivacion'
  | 'medico'
  | 'psicologo'
  | 'pareja_familiar'
  | 'otro';

export type Gender = string; // Libre — sin opciones predefinidas

// ── Tipos Phase 2: Contexto social ────────────────────────────────────────────
export type LivingSituation = 'solo' | 'pareja' | 'familia' | 'compartido' | 'otro';
export type WorkStatus = 'empleado' | 'estudiante' | 'ambos' | 'desempleado' | 'jubilado' | 'licencia';
export type SocialSupport = 'fuerte' | 'moderado' | 'escaso';

// ── Tipos Phase 4: Estado actual ──────────────────────────────────────────────
export type MainReasonCategory = 'ansiedad' | 'animo' | 'relaciones' | 'autoestima' | 'duelo' | 'estres' | 'otro';
export type SymptomGroup =
  | 'animo_bajo'
  | 'nerviosismo'
  | 'problemas_sueno'
  | 'irritabilidad'
  | 'aislamiento'
  | 'cansancio'
  | 'concentracion'
  | 'apetito'
  | 'culpa'
  | 'desesperanza';
export type MainGoal = 'sentirme_mejor' | 'entender_que_pasa' | 'herramientas' | 'relaciones' | 'habitos' | 'otro';

/**
 * Datos de registro del paciente.
 * Se completan en PatientRegisterScreen y son editables desde el módulo terapeuta.
 */
export interface PatientRegistration {
  // ── Identificación ──────────────────────────────────────────────────────
  patientId: string;          // PAC-AAAAMMDD-xxxx — generado al registrar
  createdAt: number;          // ms epoch
  lastUpdatedAt: number;

  // ── Datos personales (obligatorios) ────────────────────────────────────
  alias: string;              // Nombre o como quiere llamarse en el sistema
  birthDate: string;          // ISO date string: "1990-03-15"
  age: number;                // Calculado automáticamente desde birthDate
  gender: Gender;
  phone: string;              // Teléfono móvil del paciente
  email: string;              // Email del paciente

  // ── Motivo de contacto inicial (obligatorio) ────────────────────────────
  initialContact: string;     // Lo que escribió antes de llegar — texto libre

  // ── Contexto clínico (opcional, editable) ──────────────────────────────
  referralSource: ReferralSource | null;
  referralNotes: string;      // "Derivado por Dr. García, médico clínico"

  previousTreatment: boolean | null;
  previousTreatmentNotes: string;

  currentMedication: boolean | null;
  currentMedicationNotes: string;

  affectedAreas: LifeArea[];  // Áreas de vida afectadas según el paciente

  // ── Phase 2: Contexto social (opcional) ──────────────────────────────────
  livingWith: LivingSituation | null;
  workStatus: WorkStatus | null;
  socialSupportLevel: SocialSupport | null;
  emergencyContactName: string;    // Nombre del contacto de confianza
  emergencyContactPhone: string;   // Teléfono del contacto de confianza

  // ── Phase 3: Historia clínica (opcional) ────────────────────────────────
  isFirstTherapy: boolean | null;
  previousTherapyNotes: string;
  psychiatricTreatment: boolean | null;
  psychiatricNotes: string;
  familyMentalHealth: boolean | null;
  familyMentalHealthNotes: string;

  // ── Phase 4: Estado actual (opcional) ───────────────────────────────────
  mainReasonCategories: MainReasonCategory[];   // Multi-selección — comorbilidad real
  mainReasonText: string;
  symptomGroups: SymptomGroup[];
  distressLevel: number | null;       // 0-100 SUDs (capturado como 0-10 en UI, multiplicado ×10)
  mainGoal: MainGoal | null;
  mainGoalText: string;

  // ── Safety gate ─────────────────────────────────────────────────────────
  safetyCheckPassed: boolean;
  safetyCheckAt: number | null;

  // ── Estado del proceso ──────────────────────────────────────────────────
  interviewCompleted: boolean;
  interviewCompletedAt: number | null;
  interviewReportSentAt: number | null;  // Cuándo se envió al módulo terapeuta
}

/**
 * Carpeta del paciente en el módulo terapeuta.
 * Se crea automáticamente al registrar un paciente nuevo.
 * Contiene el reporte de entrevista y el log de sesiones.
 */
export interface PatientFolder {
  patientId: string;
  createdAt: number;

  // Reporte de entrevista (enviado desde /interview)
  interviewReport: InterviewReport | null;

  // Notas del terapeuta (editables libremente)
  therapistNotes: string;

  // Log de sesiones posteriores (placeholder para futuro)
  sessionCount: number;
  lastSessionAt: number | null;

  // NEW: Pattern Analysis Log — análisis dinámico de patrones por sesión
  // Se agrega una entrada después de CADA sesión AC/RC
  patternAnalysisLog?: Array<{
    sessionNumber: number;
    sessionType: string;
    analyzedAt: number;
    analysis: {
      coherenceScore: number;
      distortionsIdentified: Array<{ name: string; severity: string }>;
      changeIndicators: { overallTrend: string };
      alerts: Array<{ type: string; severity: string; message: string }>;
      suggestions: Array<{ technique: string; priority: string }>;
    };
    therapistActionItems: string[];
    nextSessionSuggestions: string[];
  }>;
}

/**
 * Reporte clínico completo que se transfiere desde el módulo interview.
 * Contiene vista para el paciente y vista técnica para el terapeuta.
 */
export interface InterviewReport {
  patientId: string;
  generatedAt: number;
  interviewDurationMs: number;

  // ── Vista paciente (lenguaje accesible) ────────────────────────────────
  patientView: {
    mainMessage: string;          // Síntesis empática del mapa de situación
    problemList: string[];        // Lista de problemas en lenguaje simple
    connectingPattern: string;    // La creencia que conecta los problemas
    precipitant: string;          // Por qué consultó ahora
    strengths: string[];          // Recursos y fortalezas detectados
    nextSteps: string;            // Qué esperar de las próximas sesiones
    affectTrajectory: {
      trend: 'improving' | 'declining' | 'stable' | 'unknown';
      summary: string;
    };
  };

  // ── Vista terapeuta (técnica, formulación de caso Persons) ─────────────
  therapistView: {
    // Formulación de caso
    problemList: Array<{
      area: 'sintoma' | 'conducta' | 'area_vital';
      description: string;
      functionalImpact: string;
    }>;
    hypothesizedMechanism: string;      // Creencia nuclear hipotetizada
    coreBeliefEvidence: string[];       // Frases literales del paciente
    precipitants: string[];             // Factores precipitantes identificados
    learningHistory: string;            // Historia de aprendizaje breve
    functionalAnalysis: {
      antecedents: string[];
      behaviors: string[];
      consequences: string[];
    } | null;
    hypothesis: string;                 // Hipótesis clínica integradora

    // Inventarios
    bdi: { done: boolean; score: number; category: string; hasCritical: boolean };
    gad7: { done: boolean; score: number; category: string } | null;

    // Alertas
    clinicalAlerts: {
      riskFlag: boolean;
      crisisAlert: boolean;
      neurovegetative: boolean;
      socialDesirability: boolean;
    };

    // Métricas cualitativas
    rapportScore: number;
    emotionalTone: string;
    emotionalIntensity: number;
    detectedThemes: string[];
    narrativeTrend: string;
    turnCount: number;

    // Sugerencias para sesión 2
    session2Suggestions: string[];
  };

  // Transcripción completa
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

// ── Store interface ───────────────────────────────────────────────────────────

interface PatientState {
  // Paciente activo (el que está en proceso de entrevista/sesión)
  activePatient: PatientRegistration | null;

  // Carpetas de todos los pacientes registrados (módulo terapeuta)
  patientFolders: PatientFolder[];

  // Acciones
  registerPatient: (data: Omit<PatientRegistration,
    'patientId' | 'createdAt' | 'lastUpdatedAt' | 'age' |
    'interviewCompleted' | 'interviewCompletedAt' | 'interviewReportSentAt' |
    'livingWith' | 'workStatus' | 'socialSupportLevel' |
    'emergencyContactName' | 'emergencyContactPhone' |
    'isFirstTherapy' | 'previousTherapyNotes' | 'psychiatricTreatment' | 'psychiatricNotes' |
    'familyMentalHealth' | 'familyMentalHealthNotes' |
    'mainReasonCategories' | 'mainReasonText' | 'symptomGroups' | 'distressLevel' |
    'mainGoal' | 'mainGoalText' | 'safetyCheckPassed' | 'safetyCheckAt'
  > & Partial<Pick<PatientRegistration,
    'livingWith' | 'workStatus' | 'socialSupportLevel' |
    'emergencyContactName' | 'emergencyContactPhone' |
    'isFirstTherapy' | 'previousTherapyNotes' | 'psychiatricTreatment' | 'psychiatricNotes' |
    'familyMentalHealth' | 'familyMentalHealthNotes' |
    'mainReasonCategories' | 'mainReasonText' | 'symptomGroups' | 'distressLevel' |
    'mainGoal' | 'mainGoalText' | 'safetyCheckPassed' | 'safetyCheckAt'
  >>) => PatientRegistration;

  setActivePatient: (patient: PatientRegistration | null) => void;

  updatePatient: (patientId: string, updates: Partial<PatientRegistration>) => void;

  sendReportToFolder: (patientId: string, report: InterviewReport) => void;

  updateTherapistNotes: (patientId: string, notes: string) => void;

  getFolder: (patientId: string) => PatientFolder | undefined;

  markInterviewComplete: (patientId: string) => void;

  clearActivePatient: () => void;

  // NEW: Pattern Analysis Actions
  processSessionPatterns: (
    patientId: string,
    sessionData: {
      number: number;
      type: string;
      transcript: string;
      inventoriesAdministered: Array<{ inventario: string; puntuacion: number }>;
      rapportScore?: number;
      emotionalTone?: string;
    }
  ) => Promise<void>;

  appendPatternLogEntry: (
    patientId: string,
    entry: {
      sessionNumber: number;
      sessionType: string;
      analyzedAt: number;
      analysis: any;
      therapistActionItems: string[];
      nextSessionSuggestions: string[];
    }
  ) => void;

  getPatternHistory: (patientId: string) => any[];
}

// ── ID generator ──────────────────────────────────────────────────────────────

// ── Sync helper: propaga cambios de PatientRegistration a IndexedDB ──────────

function persistToIndexedDB(
  patientId: string,
  updates: Partial<PatientRegistration>,
): void {
  // Convertir campos epoch (number) → Date para compatibilidad con PatientRecord
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (
      (key === 'lastUpdatedAt' || key === 'createdAt') &&
      typeof value === 'number'
    ) {
      mapped[key] = new Date(value);
    } else if (
      (key === 'interviewCompletedAt' || key === 'safetyCheckAt') &&
      typeof value === 'number'
    ) {
      mapped[key] = new Date(value);
    } else if (key === 'interviewReportSentAt') {
      // interviewReportSentAt solo existe en Zustand, no en PatientRecord — skip
      continue;
    } else {
      mapped[key] = value;
    }
  }
  mapped.lastUpdatedAt = new Date();

  db.patientRecords
    .where('patientId')
    .equals(patientId)
    .modify(mapped as Partial<PatientRecord>)
    .catch((err) =>
      console.error('[patientStore] Error syncing to IndexedDB:', err),
    );
}

function generatePatientId(): string {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const rand  = Math.random().toString(36).slice(2, 6);
  return `PAC-${year}${month}${day}-${rand}`;
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      activePatient: null,
      patientFolders: [],

      registerPatient: (data) => {
        const now = Date.now();
        const patient: PatientRegistration = {
          // Defaults for Phase 2-4 fields (backward-compatible)
          livingWith: null,
          workStatus: null,
          socialSupportLevel: null,
          emergencyContactName: '',
          emergencyContactPhone: '',
          isFirstTherapy: null,
          previousTherapyNotes: '',
          psychiatricTreatment: null,
          psychiatricNotes: '',
          familyMentalHealth: null,
          familyMentalHealthNotes: '',
          mainReasonCategories: [],
          mainReasonText: '',
          symptomGroups: [],
          distressLevel: null,
          mainGoal: null,
          mainGoalText: '',
          safetyCheckPassed: false,
          safetyCheckAt: null,
          // Spread caller data (overrides defaults above when provided)
          ...data,
          // Computed fields (always override)
          patientId: generatePatientId(),
          createdAt: now,
          lastUpdatedAt: now,
          age: calculateAge(data.birthDate),
          interviewCompleted: false,
          interviewCompletedAt: null,
          interviewReportSentAt: null,
        };

        // Crear carpeta vacía en el módulo terapeuta
        const folder: PatientFolder = {
          patientId: patient.patientId,
          createdAt: now,
          interviewReport: null,
          therapistNotes: '',
          sessionCount: 0,
          lastSessionAt: null,
        };

        set((s) => ({
          activePatient: patient,
          patientFolders: [...s.patientFolders, folder],
        }));

        return patient;
      },

      setActivePatient: (patient) => set({ activePatient: patient }),

      updatePatient: (patientId, updates) => {
        set((s) => {
          const isActive = s.activePatient?.patientId === patientId;
          return {
            activePatient: isActive
              ? { ...s.activePatient!, ...updates, lastUpdatedAt: Date.now() }
              : s.activePatient,
          };
        });
        // Propagar a IndexedDB para mantener fuente de verdad sincronizada
        persistToIndexedDB(patientId, updates);
      },

      sendReportToFolder: (patientId, report) => {
        const now = Date.now();
        set((s) => ({
          patientFolders: s.patientFolders.map((f) =>
            f.patientId === patientId
              ? { ...f, interviewReport: report }
              : f,
          ),
          activePatient: s.activePatient?.patientId === patientId
            ? { ...s.activePatient, interviewReportSentAt: now, lastUpdatedAt: now }
            : s.activePatient,
        }));
        // interviewReportSentAt no existe en PatientRecord, pero lastUpdatedAt sí
        persistToIndexedDB(patientId, { lastUpdatedAt: now });
      },

      updateTherapistNotes: (patientId, notes) => {
        set((s) => ({
          patientFolders: s.patientFolders.map((f) =>
            f.patientId === patientId ? { ...f, therapistNotes: notes } : f,
          ),
        }));
      },

      getFolder: (patientId) => {
        return get().patientFolders.find((f) => f.patientId === patientId);
      },

      markInterviewComplete: (patientId) => {
        const now = Date.now();
        set((s) => ({
          activePatient: s.activePatient?.patientId === patientId
            ? {
                ...s.activePatient,
                interviewCompleted: true,
                interviewCompletedAt: now,
                lastUpdatedAt: now,
              }
            : s.activePatient,
        }));
        persistToIndexedDB(patientId, {
          interviewCompleted: true,
          interviewCompletedAt: now,
        });
      },

      clearActivePatient: () => set({ activePatient: null }),

      // ── NEW: Pattern Analysis Actions ─────────────────────────────────────
      processSessionPatterns: async (patientId, sessionData) => {
        // Importar funciones del PatternProcessor
        // NOTA: En implementación real, importar desde patternProcessorIntegration
        // import { processSessionPatterns } from '@knowledge/patient/patternProcessorIntegration';

        const folder = get().patientFolders.find((f) => f.patientId === patientId);
        if (!folder?.interviewReport) {
          console.warn(`[PatternProcessor] No InterviewReport found for patient ${patientId}`);
          return;
        }

        try {
          // Placeholder: En implementación real, llamar a processSessionPatterns()
          // const patternEntry = await processSessionPatterns(patientId, sessionData, (id) => folder);

          // Por ahora, solo loguear que se llamó
          console.log(`[PatternProcessor] Would analyze patterns for session ${sessionData.number}`);
        } catch (error) {
          console.error('[PatternProcessor] Error analyzing session patterns:', error);
        }
      },

      appendPatternLogEntry: (patientId, entry) => {
        set((s) => ({
          patientFolders: s.patientFolders.map((f) =>
            f.patientId === patientId
              ? {
                  ...f,
                  patternAnalysisLog: [...(f.patternAnalysisLog || []), entry],
                }
              : f
          ),
        }));
      },

      getPatternHistory: (patientId) => {
        const folder = get().patientFolders.find((f) => f.patientId === patientId);
        return folder?.patternAnalysisLog || [];
      },
    }),
    {
      name: 'tcc-lab-patients-v1',
      partialize: (s) => ({
        activePatient:  s.activePatient,
        patientFolders: s.patientFolders,
      }),
      // Migrar datos del nombre anterior del proyecto
      migrate: (persistedState: any) => {
        return persistedState;
      },
    },
  ),
);
