import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Core types ────────────────────────────────────────────────────────────────

export type InventoryType = 'bdi' | 'bai';
export type BeckKey = 'symptoms' | 'history' | 'functioning' | 'personal' | 'strengths';
export type BeckStatus = 'pending' | 'partial' | 'done';
export type AnalysisStage = 'idle' | 'hypothesis' | 'abc' | 'history' | 'complete';
export type InterviewPhase =
  | 'opening'
  | 'exploration'
  | 'inventory'
  | 'beck_integration'
  | 'crisis_containment';

export interface ChatMessage {
  id: string;
  role: 'sys' | 'usr';
  timestamp: number;
  text: string;
  signal?: { color: string; text: string };
  /** Si el mensaje de usuario vino de un chip, guardamos cuál */
  fromChip?: boolean;
}

// ── Affect (selector emocional) ───────────────────────────────────────────────

/**
 * Escala de 1–5:
 *   1 = muy mal  (distressed)
 *   2 = mal      (guarded)
 *   3 = regular  (neutral)
 *   4 = bien     (analytical)
 *   5 = muy bien (open)
 */
export type AffectValence = 1 | 2 | 3 | 4 | 5;

export const AFFECT_LABELS: Record<AffectValence, string> = {
  1: 'muy mal',
  2: 'mal',
  3: 'regular',
  4: 'bien',
  5: 'muy bien',
};

export const AFFECT_TONE_MAP: Record<AffectValence, string> = {
  1: 'distressed',
  2: 'guarded',
  3: 'neutral',
  4: 'analytical',
  5: 'open',
};

export const AFFECT_INTENSITY_MAP: Record<AffectValence, number> = {
  1: 5,
  2: 3,
  3: 1,
  4: 0,
  5: 0,
};

export interface AffectEntry {
  timestamp: number;
  valence: AffectValence;
  label: string;
  phase: InterviewPhase;
  turnNumber: number;
}

// ── Beck coverage area ────────────────────────────────────────────────────────

export interface BeckAreaState {
  status: BeckStatus;
  mentionCount: number;
  keyPhrases: string[];
}

export type BeckState = Record<BeckKey, BeckAreaState>;

// ── Inventory readiness ───────────────────────────────────────────────────────

export interface InventoryReadiness {
  rapportEstablished: boolean;
  emotionalSufficient: boolean;
  beckMinimum: boolean;
  allMet: boolean;
}

// ── Clinical alerts ───────────────────────────────────────────────────────────

export interface ClinicalAlerts {
  riskFlag: boolean;
  crisisAlert: boolean;
  neurovegetative: boolean;
  socialDesirability: boolean;
}

// ── Inventory states ──────────────────────────────────────────────────────────

export interface BdiState {
  done: boolean;
  score: number;
  hasCritical: boolean;
  crisisAlert: boolean;
  itemAnswers: Record<number, number>;
}

export interface BaiState {
  done: boolean;
  score: number;
  itemAnswers: Record<number, number>;
}

// ── Session data export ───────────────────────────────────────────────────────

/**
 * Estructura completa de datos clínicos que se transfiere al sessionStore
 * y se puede persistir en backend al finalizar la entrevista.
 */
export interface InterviewSessionData {
  completedAt: number;
  durationMs: number;
  startedAt: number;
  chiefComplaint: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  beckCoverage: BeckState;
  affectHistory: AffectEntry[];
  /** Trayectoria afectiva: promedio por cuartil de la entrevista */
  affectTrajectory: { q1: number; q2: number; q3: number; q4: number } | null;
  bdi: BdiState;
  bai: BaiState;
  clinicalAlerts: ClinicalAlerts;
  hypothesis: string | null;
  functionalAnalysis: {
    antecedents: string[];
    behaviors: string[];
    consequences: string[];
  } | null;
  learningHistory: string | null;
  detectedThemes: string[];
  rapportScore: number;
  emotionalIntensity: number;
  emotionalTone: string;
  narrativeTrend: string;
  turnCount: number;
}

// ── Full store interface ──────────────────────────────────────────────────────

interface InterviewState {
  // Metadata
  startedAt: number;

  // UI / chat
  messages: ChatMessage[];

  // Clinical engine
  beck: BeckState;
  rapportScore: number;
  emotionalTone: string;
  emotionalIntensity: number;
  narrativeTrend: 'expanding' | 'contracting' | 'stable' | 'unknown';
  detectedThemes: string[];
  phase: InterviewPhase;

  // Affect tracking
  affectHistory: AffectEntry[];
  lastAffectValence: AffectValence | null;

  // Inventories
  bdi: BdiState;
  bai: BaiState;
  inventoryReadiness: InventoryReadiness;
  clinicalAlerts: ClinicalAlerts;
  inventoryTriggered: boolean;
  baiTriggered: boolean;
  currentInventory: InventoryType | null;

  // Output
  hypothesis: string | null;
  functionalAnalysis: {
    antecedents: string[];
    behaviors: string[];
    consequences: string[];
  } | null;
  learningHistory: string | null;
  isGeneratingHypothesis: boolean;
  analysisStage: AnalysisStage;

  // Raw history for LLM
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];

  // Crisis
  crisisDetected: boolean;

  // Actions ──────────────────────────────────────────────────────────────────
  addMessage: (msg: ChatMessage) => void;
  addToHistory: (role: 'user' | 'assistant', content: string) => void;
  setCurrentInventory: (type: InventoryType | null) => void;
  setPhase: (phase: InterviewPhase) => void;
  recordBeckMention: (key: BeckKey, phrase: string) => void;
  setRapportScore: (score: number) => void;
  setEmotionalTone: (tone: string) => void;
  setEmotionalIntensity: (intensity: number) => void;
  setNarrativeTrend: (trend: 'expanding' | 'contracting' | 'stable' | 'unknown') => void;
  setDetectedThemes: (themes: string[]) => void;
  setBdi: (state: Partial<BdiState>) => void;
  setBai: (state: Partial<BaiState>) => void;
  setHypothesis: (hypothesis: string) => void;
  setFunctionalAnalysis: (analysis: { antecedents: string[]; behaviors: string[]; consequences: string[] }) => void;
  setLearningHistory: (history: string) => void;
  setIsGeneratingHypothesis: (generating: boolean) => void;
  setAnalysisStage: (stage: AnalysisStage) => void;
  setInventoryTriggered: (triggered: boolean) => void;
  setBaiTriggered: (triggered: boolean) => void;
  refreshReadiness: () => void;
  setCrisisDetected: (detected: boolean) => void;
  updateClinicalAlerts: (alerts: Partial<ClinicalAlerts>) => void;

  /** Registra una selección afectiva del paciente */
  addAffectEntry: (valence: AffectValence) => void;
  setLastAffectValence: (v: AffectValence | null) => void;

  /** Computa y devuelve el paquete de datos clínicos completo */
  buildSessionData: () => InterviewSessionData;

  /** Limpia el store para iniciar una nueva entrevista */
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const emptyArea: BeckAreaState = { status: 'pending', mentionCount: 0, keyPhrases: [] };

const initialBeck: BeckState = {
  symptoms:    { ...emptyArea },
  history:     { ...emptyArea },
  functioning: { ...emptyArea },
  personal:    { ...emptyArea },
  strengths:   { ...emptyArea },
};

const initialState = {
  startedAt: Date.now(),
  messages: [],
  beck: initialBeck,
  rapportScore: 0,
  emotionalTone: 'unknown',
  emotionalIntensity: 0,
  narrativeTrend: 'unknown' as const,
  detectedThemes: [],
  phase: 'opening' as InterviewPhase,
  affectHistory: [],
  lastAffectValence: null,
  bdi:  { done: false, score: 0, hasCritical: false, crisisAlert: false, itemAnswers: {} },
  bai:  { done: false, score: 0, itemAnswers: {} },
  inventoryReadiness: {
    rapportEstablished: false,
    emotionalSufficient: false,
    beckMinimum: false,
    allMet: false,
  },
  clinicalAlerts: {
    riskFlag: false,
    crisisAlert: false,
    neurovegetative: false,
    socialDesirability: false,
  },
  inventoryTriggered: false,
  baiTriggered: false,
  currentInventory: null,
  hypothesis: null,
  functionalAnalysis: null,
  learningHistory: null,
  isGeneratingHypothesis: false,
  analysisStage: 'idle' as AnalysisStage,
  conversationHistory: [],
  crisisDetected: false,
};

// ── Affect trajectory helper ──────────────────────────────────────────────────

function computeAffectTrajectory(
  history: AffectEntry[],
): { q1: number; q2: number; q3: number; q4: number } | null {
  if (history.length < 4) return null;
  const n = history.length;
  const q = Math.floor(n / 4);
  const avg = (arr: AffectEntry[]) =>
    arr.reduce((s, e) => s + e.valence, 0) / (arr.length || 1);
  return {
    q1: avg(history.slice(0, q)),
    q2: avg(history.slice(q, q * 2)),
    q3: avg(history.slice(q * 2, q * 3)),
    q4: avg(history.slice(q * 3)),
  };
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Messages ────────────────────────────────────────────────────────────
      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      addToHistory: (role, content) =>
        set((s) => ({ conversationHistory: [...s.conversationHistory, { role, content }] })),

      // ── Phase & inventory ────────────────────────────────────────────────────
      setCurrentInventory: (type) => set({ currentInventory: type }),
      setPhase: (phase) => set({ phase }),
      setInventoryTriggered: (triggered) => set({ inventoryTriggered: triggered }),
      setBaiTriggered: (triggered) => set({ baiTriggered: triggered }),

      // ── Beck ─────────────────────────────────────────────────────────────────
      recordBeckMention: (key, phrase) =>
        set((s) => {
          const area     = s.beck[key];
          const newCount = area.mentionCount + 1;
          const newStatus: BeckStatus = newCount >= 2 ? 'done' : 'partial';
          const newPhrases = phrase.trim()
            ? [...area.keyPhrases, phrase.trim()].slice(-3)
            : area.keyPhrases;
          return {
            beck: {
              ...s.beck,
              [key]: { status: newStatus, mentionCount: newCount, keyPhrases: newPhrases },
            },
          };
        }),

      // ── Emotional state ──────────────────────────────────────────────────────
      setRapportScore: (score) => set({ rapportScore: score }),
      setEmotionalTone: (tone) => set({ emotionalTone: tone }),
      setEmotionalIntensity: (intensity) => set({ emotionalIntensity: intensity }),
      setNarrativeTrend: (trend) => set({ narrativeTrend: trend }),
      setDetectedThemes: (themes) => set({ detectedThemes: themes }),

      // ── Affect selector ──────────────────────────────────────────────────────
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
          return {
            affectHistory: [...s.affectHistory, entry],
            lastAffectValence: valence,
          };
        }),

      setLastAffectValence: (v) => set({ lastAffectValence: v }),

      // ── Inventories ──────────────────────────────────────────────────────────
      setBdi: (state) => set((s) => ({ bdi: { ...s.bdi, ...state } })),
      setBai: (state) => set((s) => ({ bai: { ...s.bai, ...state } })),
      setHypothesis: (hypothesis) => set({ hypothesis }),
      setFunctionalAnalysis: (analysis) => set({ functionalAnalysis: analysis }),
      setLearningHistory: (history) => set({ learningHistory: history }),
      setIsGeneratingHypothesis: (generating) => set({ isGeneratingHypothesis: generating }),
      setAnalysisStage: (stage) => set({ analysisStage: stage }),

      // ── Clinical alerts ──────────────────────────────────────────────────────
      updateClinicalAlerts: (alerts) =>
        set((s) => ({ clinicalAlerts: { ...s.clinicalAlerts, ...alerts } })),
      setCrisisDetected: (detected) => set({ crisisDetected: detected }),

      // ── Readiness ────────────────────────────────────────────────────────────
      refreshReadiness: () =>
        set((s) => {
          const rapportEstablished  = s.rapportScore >= 1.5;
          // Usamos el afecto auto-reportado si está disponible; si no, detectión textual
          const emotionalSufficient =
            s.lastAffectValence !== null
              ? s.lastAffectValence <= 2  // mal o muy mal → carga emocional suficiente
              : s.emotionalIntensity >= 2 || s.emotionalTone === 'distressed';
          const beckMinimum = Object.values(s.beck).filter((v) => v.status !== 'pending').length >= 2;
          const allMet      = rapportEstablished && emotionalSufficient && beckMinimum;
          return { inventoryReadiness: { rapportEstablished, emotionalSufficient, beckMinimum, allMet } };
        }),

      // ── Session data export ──────────────────────────────────────────────────
      buildSessionData: (): InterviewSessionData => {
        const s = get();
        const firstUser = s.conversationHistory.find((m) => m.role === 'user');
        return {
          completedAt: Date.now(),
          durationMs: Date.now() - s.startedAt,
          startedAt: s.startedAt,
          chiefComplaint: firstUser?.content.slice(0, 300) ?? '',
          conversationHistory: s.conversationHistory,
          beckCoverage: s.beck,
          affectHistory: s.affectHistory,
          affectTrajectory: computeAffectTrajectory(s.affectHistory),
          bdi: s.bdi,
          bai: s.bai,
          clinicalAlerts: s.clinicalAlerts,
          hypothesis: s.hypothesis,
          functionalAnalysis: s.functionalAnalysis,
          learningHistory: s.learningHistory,
          detectedThemes: s.detectedThemes,
          rapportScore: s.rapportScore,
          emotionalIntensity: s.emotionalIntensity,
          emotionalTone: s.emotionalTone,
          narrativeTrend: s.narrativeTrend,
          turnCount: s.conversationHistory.filter((m) => m.role === 'user').length,
        };
      },

      // ── Reset ────────────────────────────────────────────────────────────────
      reset: () => set({ ...initialState, startedAt: Date.now() }),
    }),
    {
      name: 'homeflow-interview-v2',
      // Solo persistimos datos clínicos — no estado de UI transitorio
      partialize: (s) => ({
        startedAt:           s.startedAt,
        messages:            s.messages,
        beck:                s.beck,
        bdi:                 s.bdi,
        bai:                 s.bai,
        affectHistory:       s.affectHistory,
        conversationHistory: s.conversationHistory,
        clinicalAlerts:      s.clinicalAlerts,
        hypothesis:          s.hypothesis,
        detectedThemes:      s.detectedThemes,
        rapportScore:        s.rapportScore,
        emotionalIntensity:  s.emotionalIntensity,
        emotionalTone:       s.emotionalTone,
        phase:               s.phase,
        inventoryTriggered:  s.inventoryTriggered,
        baiTriggered:        s.baiTriggered,
        crisisDetected:      s.crisisDetected,
      }),
    },
  ),
);
