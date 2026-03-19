/**
 * sessionStore — Estado global del protocolo TCC
 *
 * Modela el ciclo completo terapeuta-paciente:
 * intake → assessment → psychoeducation → goals → intervention → evaluation → followup
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BDIProfileAnalysis } from '../knowledge/inventories/engines/bdi_ii.engine';

// ============================================================================
// TIPOS
// ============================================================================

export type ProtocolPhase =
  | 'intake'           // 1. Motivo de consulta (presentación del problema)
  | 'assessment'       // 2. Evaluación psicológica (anamnesis + formulación)
  | 'psychoeducation'  // 3. Psicoeducación sobre el modelo TCC
  | 'goals'            // 4. Establecimiento de objetivos terapéuticos
  | 'intervention'     // 5. Intervención (técnicas según formulación)
  | 'evaluation'       // 6. Evaluación de progreso (baseline → cambio)
  | 'followup';        // 7. Prevención de recaídas / seguimiento

export type EmotionCategory =
  | 'anxiety' | 'depression' | 'anger' | 'guilt' | 'shame'
  | 'overwhelm' | 'numbness' | 'fear' | 'grief';

export interface IntakeData {
  mainComplaint: string;         // "¿Qué te trae aquí hoy?"
  sinceWhen: string;             // "¿Desde cuándo?"
  emotionCategory: EmotionCategory | null;
  intensityNow: number;          // 0-10 (SUDs adaptado)
  triggeredBy: string;           // "¿Qué lo desencadenó?"
}

export interface AssessmentData {
  automaticThought: string;      // El primer pensamiento
  situationContext: string;      // Situación A (antecedente)
  behavioralResponse: string;    // Conducta B
  consequences: string;          // Consecuencia C
  cognitivePatterns: string[];   // Patrones detectados
  avoidanceBehaviors: string[];  // Conductas de evitación
  functionalImpact: string;      // "¿Cómo afecta a tu vida diaria?"
  baselineIntensity: number;     // 0-10 — nivel de referencia
}

export interface PsychoeducationData {
  modelExplained: boolean;       // Se explicó el modelo ABC
  connectionMade: boolean;       // Paciente conectó su situación con el modelo
  patientReaction: string;       // "¿Qué te parece esta forma de verlo?"
}

export interface GoalsData {
  primaryObjective: string;      // Objetivo principal SMART
  shortTermGoals: string[];      // Objetivos intermedios (2-4 semanas)
  measurableIndicator: string;   // "¿Cómo sabremos que mejoraste?"
  startIntensity: number;        // Baseline registrado
  targetIntensity: number;       // Meta de reducción (0-10)
}

export interface EvaluationData {
  currentIntensity: number;      // 0-10 (post-intervención)
  whatChanged: string;           // "¿Qué notaste?"
  obstaclesFound: string;        // Obstáculos encontrados
  wantsToRepeat: boolean | null; // ¿Repetiría la técnica?
}

export interface SessionState {
  userId: string;
  currentPhase: ProtocolPhase;
  sessionStarted: boolean;
  sessionId: string | null;

  // Datos acumulados por fase
  intake: Partial<IntakeData>;
  assessment: Partial<AssessmentData>;
  psychoeducation: Partial<PsychoeducationData>;
  goals: Partial<GoalsData>;
  evaluation: Partial<EvaluationData>;
  selectedTechnique: string | null;
  interventionObjectiveId: string | null;

  // Perfil clínico BDI-II (computado por detectClinicalProfile)
  clinicalProfile: BDIProfileAnalysis | null;

  // Resultados de los flujos clínicos (output de cada session flow)
  flowResults: Record<string, unknown>;

  // Acciones
  setPhase: (phase: ProtocolPhase) => void;
  startSession: () => void;
  setIntake: (data: Partial<IntakeData>) => void;
  setAssessment: (data: Partial<AssessmentData>) => void;
  setPsychoeducation: (data: Partial<PsychoeducationData>) => void;
  setGoals: (data: Partial<GoalsData>) => void;
  setEvaluation: (data: Partial<EvaluationData>) => void;
  setSelectedTechnique: (technique: string) => void;
  setInterventionObjectiveId: (id: string) => void;
  setClinicalProfile: (profile: BDIProfileAnalysis) => void;
  setFlowResult: (phase: ProtocolPhase, result: unknown) => void;
  resetSession: () => void;
  advancePhase: () => void;
}

const PHASE_ORDER: ProtocolPhase[] = [
  'intake', 'assessment', 'psychoeducation', 'goals',
  'intervention', 'evaluation', 'followup'
];

// ============================================================================
// STORE
// ============================================================================

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      userId: 'lab-user',
      currentPhase: 'intake',
      sessionStarted: false,
      sessionId: null,

      intake: {},
      assessment: {},
      psychoeducation: {},
      goals: {},
      evaluation: {},
      selectedTechnique: null,
      interventionObjectiveId: null,
      clinicalProfile: null,
      flowResults: {},

      setPhase: (phase) => set({ currentPhase: phase }),

      startSession: () => set({
        sessionStarted: true,
        sessionId: `session-${Date.now()}`,
        currentPhase: 'intake',
      }),

      setIntake: (data) => set((s) => ({ intake: { ...s.intake, ...data } })),
      setAssessment: (data) => set((s) => ({ assessment: { ...s.assessment, ...data } })),
      setPsychoeducation: (data) => set((s) => ({ psychoeducation: { ...s.psychoeducation, ...data } })),
      setGoals: (data) => set((s) => ({ goals: { ...s.goals, ...data } })),
      setEvaluation: (data) => set((s) => ({ evaluation: { ...s.evaluation, ...data } })),

      setSelectedTechnique: (technique) => set({ selectedTechnique: technique }),
      setInterventionObjectiveId: (id) => set({ interventionObjectiveId: id }),
      setClinicalProfile: (profile) => set({ clinicalProfile: profile }),

      setFlowResult: (phase, result) => set((s) => ({
        flowResults: { ...s.flowResults, [phase]: result },
      })),

      advancePhase: () => {
        const { currentPhase } = get();
        const idx = PHASE_ORDER.indexOf(currentPhase);
        if (idx < PHASE_ORDER.length - 1) {
          set({ currentPhase: PHASE_ORDER[idx + 1] });
        }
      },

      resetSession: () => set({
        currentPhase: 'intake',
        sessionStarted: false,
        sessionId: null,
        intake: {},
        assessment: {},
        psychoeducation: {},
        goals: {},
        evaluation: {},
        selectedTechnique: null,
        interventionObjectiveId: null,
        clinicalProfile: null,
        flowResults: {},
      }),
    }),
    {
      name: 'tcc-lab-session',
      partialize: (s) => ({
        userId: s.userId,
        currentPhase: s.currentPhase,
        sessionStarted: s.sessionStarted,
        sessionId: s.sessionId,
        intake: s.intake,
        assessment: s.assessment,
        psychoeducation: s.psychoeducation,
        goals: s.goals,
        evaluation: s.evaluation,
        selectedTechnique: s.selectedTechnique,
        interventionObjectiveId: s.interventionObjectiveId,
        clinicalProfile: s.clinicalProfile,
        flowResults: s.flowResults,
      }),
    }
  )
);
