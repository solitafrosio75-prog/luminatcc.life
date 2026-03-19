// @ts-nocheck
// ...existing code...
import { create } from 'zustand';
import type { EmotionalState, OnboardingData } from '../db/database';
import type { FunctionalHypothesis } from '../features/onboarding/types/behavioralAssessment';
import { hasCompletedOnboarding as checkOnboarding, getOnboarding } from '../db/database';

export interface AppState {
  userId: string;
  emotionalState: EmotionalState | null;
  setEmotionalState: (state: EmotionalState) => void;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  onboardingData: Partial<OnboardingData>;
  dailyEmotionalState: EmotionalState | null;
  lastEmotionalCheckDate: Date | null;
  currentTaskId: string | null;
  isLoading: boolean;
  selectedHouseAvatar: number;
  soundEnabled: boolean;
  currentHypothesis: FunctionalHypothesis | null;
  currentHypothesisSummary: string | null;
  setUserId: (id: string) => void;
  setOnboardingStep: (step: number) => void;
  setOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
  setDailyEmotionalState: (state: EmotionalState) => void;
  setCurrentTaskId: (taskId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: () => void;
  loadOnboardingStatus: (userId: string) => Promise<void>;
  setSelectedHouseAvatar: (houseId: number) => void;
  toggleSound: () => void;
  setCurrentHypothesis: (hypothesis: FunctionalHypothesis | null) => void;
  setCurrentHypothesisSummary: (summary: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: '',
  emotionalState: null,
  onboardingData: {},
  hasCompletedOnboarding: false,
  onboardingStep: 0,
  dailyEmotionalState: null,
  lastEmotionalCheckDate: null,
  currentTaskId: null,
  isLoading: false,
  currentHypothesis: null,
  currentHypothesisSummary: null,
  selectedHouseAvatar: typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('selectedHouseAvatar') || '1')
    : 1,
  soundEnabled: typeof window !== 'undefined'
    ? localStorage.getItem('soundEnabled') !== 'false'
    : true,

  setEmotionalState: (state) => set({ emotionalState: state }),
  setUserId: (id) => set({ userId: id }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  setOnboardingData: (data) => set((state) => ({
    onboardingData: { ...state.onboardingData, ...data }
  })),
  resetOnboarding: () => set({ onboardingStep: 0, onboardingData: {} }),
  setDailyEmotionalState: (state) => set({
    dailyEmotionalState: state,
    lastEmotionalCheckDate: new Date(),
  }),
  setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
  setSelectedHouseAvatar: (houseId) => {
    localStorage.setItem('selectedHouseAvatar', houseId.toString());
    set({ selectedHouseAvatar: houseId });
  },
  toggleSound: () => set((state) => {
    const newValue = !state.soundEnabled;
    localStorage.setItem('soundEnabled', newValue.toString());
    return { soundEnabled: newValue };
  }),
  setCurrentHypothesis: (hypothesis) => set({ currentHypothesis: hypothesis }),
  setCurrentHypothesisSummary: (summary) => set({ currentHypothesisSummary: summary }),
  loadOnboardingStatus: async (userId: string) => {
    const completed = await checkOnboarding(userId);
    if (completed) {
      const data = await getOnboarding(userId);
      if (data) {
        set({
          hasCompletedOnboarding: true,
          emotionalState: data.emotionalState,
          onboardingData: data
        });
      }
    } else {
      set({ hasCompletedOnboarding: false });
    }
  },
}));
