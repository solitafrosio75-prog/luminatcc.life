import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AffectValence } from '../interview/interviewStore';
import { AFFECT_LABELS } from '../interview/interviewStore';

// ── Session phase ─────────────────────────────────────────────────────────────

export type TherapistPhase =
  | 'check_in'            // Cómo llegaste hoy / estado emocional inicial
  | 'agenda'              // Establecer objetivos de la sesión
  | 'homework_review'     // Revisar tarea de sesión anterior
  | 'main_work'           // Trabajo terapéutico central
  | 'summary'             // Síntesis e integración de insights
  | 'homework_assignment' // Asignación de tarea intersesión
  | 'closure'             // Cierre cálido
  | 'crisis';             // Contención de crisis

// ── CBT Techniques ────────────────────────────────────────────────────────────

export type TherapyTechnique =
  | 'exploracion'            // Exploración empática abierta
  | 'socratica'              // Diálogo socrático / descubrimiento guiado
  | 'reestructuracion'       // Reestructuración cognitiva
  | 'activacion_conductual'  // Activación conductual (AC)
  | 'exposicion'             // Exposición (EPR)
  | 'defusion_act'           // Defusión cognitiva (ACT)
  | 'validacion_dbt'         // Validación dialéctica (DBT)
  | 'experimento_conductual' // Experimento conductual
  | 'psicoeducacion'         // Psicoeducación del modelo
  | 'analisis_funcional';    // Análisis ABC funcional

// ── Cognitive distortions ─────────────────────────────────────────────────────

export type CognitiveDistortion =
  | 'catastrofizacion'
  | 'pensamiento_dicotomico'
  | 'abstraccion_selectiva'
  | 'generalizacion'
  | 'descalificacion'
  | 'lectura_mental'
  | 'adivinanza'
  | 'magnificacion'
  | 'razonamiento_emocional'
  | 'deberia'
  | 'etiquetacion'
  | 'personalizacion';

// ── Message ───────────────────────────────────────────────────────────────────

export interface TherapistMessage {
  id: string;
  role: 'sys' | 'usr';
  timestamp: number;
  text: string;
  signal?: { color: string; text: string };
  fromChip?: boolean;
}

// ── Affect entry ──────────────────────────────────────────────────────────────

export interface AffectEntry {
  timestamp: number;
  valence: AffectValence;
  label: string;
  phase: TherapistPhase;
  turnNumber: number;
}

// ── Session goal ──────────────────────────────────────────────────────────────

export interface SessionGoal {
  id: string;
  text: string;
  completed: boolean;
}

// ── Detected distortion ───────────────────────────────────────────────────────

export interface DistortionRecord {
  distortion: CognitiveDistortion;
  thought: string;
  turnNumber: number;
}

// ── Knowledge base entry ──────────────────────────────────────────────────────
// Entradas de la biblioteca clínica del terapeuta.
// isBuiltIn: true  → pre-cargadas, sólo-lectura, no se pueden borrar.
// isBuiltIn: false → agregadas por el usuario, persisten en localStorage.
// Los datos de las entradas built-in viven en knowledgeData.ts (no en el store).

export type KnowledgeCategory =
  | 'distorsiones_cognitivas'
  | 'tecnicas_tcc'
  | 'modelos_teoricos'
  | 'evaluacion'
  | 'diagnostico'
  | 'habilidades_terapeuticas'
  | 'investigacion'
  | 'otro';

export interface KnowledgeEntry {
  id:         string;
  category:   KnowledgeCategory;
  title:      string;
  summary:    string;      // 1-2 oraciones — vista compacta de la card
  content:    string;      // texto completo con formato propio (secciones en MAYÚSCULAS, →, •)
  tags:       string[];
  source?:    string;
  isBuiltIn:  boolean;
  addedAt:    number;      // ms epoch — 0 para built-ins
}

// ── Custom capability ─────────────────────────────────────────────────────────
// Persiste entre sesiones — representa extensiones al repertorio del terapeuta.

export type CustomCapabilityCategory =
  | 'tecnica'
  | 'modelo'
  | 'protocolo'
  | 'habilidad'
  | 'herramienta'
  | 'conocimiento';

export interface CustomCapability {
  id:          string;
  category:    CustomCapabilityCategory;
  name:        string;
  description: string;
  addedAt:     number;
}

// ── Past session summary ──────────────────────────────────────────────────────

export interface PastSession {
  sessionNumber: number;
  date: string;
  rapport: number;
  techniquesUsed: string[];
  goalsAchieved: number;
  totalMessages: number;
  crisisDetected: boolean;
}

// ── Full store interface ──────────────────────────────────────────────────────

interface TherapistState {
  // Session metadata
  sessionNumber: number;
  sessionStartedAt: number;
  pastSessions: PastSession[];

  // Conversation
  messages: TherapistMessage[];
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];

  // Session state
  phase: TherapistPhase;
  activeTechnique: TherapyTechnique | null;

  // Emotional tracking
  rapportScore: number;
  emotionalTone: string;
  emotionalIntensity: number;
  affectHistory: AffectEntry[];
  lastAffectValence: AffectValence | null;

  // Clinical tracking
  detectedDistortions: DistortionRecord[];
  sessionGoals: SessionGoal[];
  capturedThoughts: string[];

  // Homework
  currentHomework: string | null;
  homeworkReviewed: boolean;

  // Crisis
  crisisDetected: boolean;

  // Active session technique (linked to TechniqueProfile.id)
  sessionTechniqueId: string | null;
  sessionTechniqueStep: number;          // 0-based index of the active step

  // Custom capabilities (persisten entre sesiones)
  customCapabilities: CustomCapability[];

  // Actions ──────────────────────────────────────────────────────────────────
  addMessage: (msg: TherapistMessage) => void;
  addToHistory: (role: 'user' | 'assistant', content: string) => void;

  setPhase: (phase: TherapistPhase) => void;
  setActiveTechnique: (technique: TherapyTechnique | null) => void;

  setRapportScore: (score: number) => void;
  setEmotionalTone: (tone: string) => void;
  setEmotionalIntensity: (intensity: number) => void;

  addAffectEntry: (valence: AffectValence) => void;
  setLastAffectValence: (v: AffectValence | null) => void;

  addDistortion: (record: DistortionRecord) => void;
  addSessionGoal: (text: string) => void;
  toggleGoal: (id: string) => void;
  addCapturedThought: (thought: string) => void;

  setCurrentHomework: (homework: string | null) => void;
  setHomeworkReviewed: (reviewed: boolean) => void;

  setCrisisDetected: (detected: boolean) => void;

  setSessionTechnique: (techniqueId: string | null) => void;
  setSessionTechniqueStep: (step: number) => void;
  advanceSessionTechniqueStep: () => void;

  addCustomCapability: (cap: Omit<CustomCapability, 'id' | 'addedAt'>) => void;
  removeCustomCapability: (id: string) => void;

  // Knowledge base (user-added entries — built-ins live in knowledgeData.ts)
  userKnowledge: KnowledgeEntry[];
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'isBuiltIn' | 'addedAt'>) => void;
  removeKnowledgeEntry: (id: string) => void;

  startNewSession: () => void;
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState = {
  sessionNumber:    1,
  sessionStartedAt: Date.now(),
  pastSessions:     [] as PastSession[],
  messages:            [] as TherapistMessage[],
  conversationHistory: [] as { role: 'user' | 'assistant'; content: string }[],
  phase:           'check_in' as TherapistPhase,
  activeTechnique: null as TherapyTechnique | null,
  rapportScore:       0,
  emotionalTone:      'unknown',
  emotionalIntensity: 0,
  affectHistory:      [] as AffectEntry[],
  lastAffectValence:  null as AffectValence | null,
  detectedDistortions: [] as DistortionRecord[],
  sessionGoals:        [] as SessionGoal[],
  capturedThoughts:    [] as string[],
  currentHomework:  null as string | null,
  homeworkReviewed: false,
  crisisDetected:   false,
  sessionTechniqueId:   null as string | null,
  sessionTechniqueStep: 0,
  customCapabilities: [] as CustomCapability[],
  userKnowledge:      [] as KnowledgeEntry[],
};

// ── Store ──────────────────────────────────────────────────────────────────────

export const useTherapistStore = create<TherapistState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      addToHistory: (role, content) =>
        set((s) => ({ conversationHistory: [...s.conversationHistory, { role, content }] })),

      setPhase: (phase) => set({ phase }),
      setActiveTechnique: (technique) => set({ activeTechnique: technique }),

      setRapportScore: (score) => set({ rapportScore: score }),
      setEmotionalTone: (tone) => set({ emotionalTone: tone }),
      setEmotionalIntensity: (intensity) => set({ emotionalIntensity: intensity }),

      addAffectEntry: (valence) =>
        set((s) => {
          const turnNumber = s.conversationHistory.filter((m) => m.role === 'user').length;
          const entry: AffectEntry = {
            timestamp: Date.now(),
            valence,
            label: AFFECT_LABELS[valence],
            phase: s.phase,
            turnNumber,
          };
          return { affectHistory: [...s.affectHistory, entry], lastAffectValence: valence };
        }),

      setLastAffectValence: (v) => set({ lastAffectValence: v }),

      addDistortion: (record) =>
        set((s) => ({ detectedDistortions: [...s.detectedDistortions, record] })),

      addSessionGoal: (text) =>
        set((s) => ({
          sessionGoals: [
            ...s.sessionGoals,
            { id: Math.random().toString(36).slice(2), text, completed: false },
          ],
        })),

      toggleGoal: (id) =>
        set((s) => ({
          sessionGoals: s.sessionGoals.map((g) =>
            g.id === id ? { ...g, completed: !g.completed } : g,
          ),
        })),

      addCapturedThought: (thought) =>
        set((s) => ({ capturedThoughts: [...s.capturedThoughts, thought].slice(-10) })),

      setCurrentHomework: (homework) => set({ currentHomework: homework }),
      setHomeworkReviewed: (reviewed) => set({ homeworkReviewed: reviewed }),

      setCrisisDetected: (detected) => set({ crisisDetected: detected }),

      // Session technique panel
      setSessionTechnique: (techniqueId) =>
        set({ sessionTechniqueId: techniqueId, sessionTechniqueStep: 0 }),
      setSessionTechniqueStep: (step) => set({ sessionTechniqueStep: step }),
      advanceSessionTechniqueStep: () =>
        set((s) => ({ sessionTechniqueStep: s.sessionTechniqueStep + 1 })),

      // Capacidades personalizadas — persisten entre sesiones
      addCustomCapability: (cap) =>
        set((s) => ({
          customCapabilities: [
            ...s.customCapabilities,
            { ...cap, id: Math.random().toString(36).slice(2), addedAt: Date.now() },
          ],
        })),

      removeCustomCapability: (id) =>
        set((s) => ({
          customCapabilities: s.customCapabilities.filter((c) => c.id !== id),
        })),

      // Knowledge base — sólo entradas de usuario (isBuiltIn:false)
      addKnowledgeEntry: (entry) =>
        set((s) => ({
          userKnowledge: [
            ...s.userKnowledge,
            { ...entry, id: Math.random().toString(36).slice(2), isBuiltIn: false, addedAt: Date.now() },
          ],
        })),

      removeKnowledgeEntry: (id) =>
        set((s) => ({
          userKnowledge: s.userKnowledge.filter((e) => e.id !== id),
        })),

      // Archiva la sesión actual y abre una nueva
      // customCapabilities NO se resetean — son parte del perfil permanente del terapeuta
      startNewSession: () =>
        set((s) => {
          const past: PastSession = {
            sessionNumber: s.sessionNumber,
            date:          new Date(s.sessionStartedAt).toISOString().split('T')[0],
            rapport:       s.rapportScore,
            techniquesUsed: s.activeTechnique ? [s.activeTechnique] : [],
            goalsAchieved: s.sessionGoals.filter((g) => g.completed).length,
            totalMessages: s.messages.length,
            crisisDetected: s.crisisDetected,
          };
          return {
            pastSessions:    [...s.pastSessions, past],
            sessionNumber:   s.sessionNumber + 1,
            sessionStartedAt: Date.now(),
            messages:            [],
            conversationHistory: [],
            phase:           'check_in' as TherapistPhase,
            activeTechnique: null,
            rapportScore:    0,
            sessionGoals:    [],
            capturedThoughts: [],
            homeworkReviewed: false,
            crisisDetected:  false,
            emotionalTone:   'unknown',
            emotionalIntensity: 0,
            affectHistory:   [],
            lastAffectValence: null,
            detectedDistortions: [],
            currentHomework: null,
            sessionTechniqueId:   null,
            sessionTechniqueStep: 0,
            // customCapabilities: s.customCapabilities  ← ya persiste al no incluirlo aquí
          };
        }),

      reset: () => set({ ...initialState, sessionStartedAt: Date.now() }),

      // Satisfy TypeScript: get is used implicitly by Zustand
      ...({} as { _get: typeof get }),
    }),
    {
      name: 'homeflow-therapist-v1',
      partialize: (s) => ({
        sessionNumber:       s.sessionNumber,
        sessionStartedAt:    s.sessionStartedAt,
        pastSessions:        s.pastSessions,
        messages:            s.messages,
        conversationHistory: s.conversationHistory,
        phase:               s.phase,
        rapportScore:        s.rapportScore,
        affectHistory:       s.affectHistory,
        detectedDistortions: s.detectedDistortions,
        sessionGoals:        s.sessionGoals,
        capturedThoughts:    s.capturedThoughts,
        currentHomework:     s.currentHomework,
        homeworkReviewed:    s.homeworkReviewed,
        crisisDetected:      s.crisisDetected,
        emotionalTone:       s.emotionalTone,
        activeTechnique:      s.activeTechnique,
        sessionTechniqueId:   s.sessionTechniqueId,
        sessionTechniqueStep: s.sessionTechniqueStep,
        customCapabilities:   s.customCapabilities,
        userKnowledge:        s.userKnowledge,
      }),
    },
  ),
);
