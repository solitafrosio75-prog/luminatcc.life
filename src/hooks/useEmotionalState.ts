/**
 * useEmotionalState - React hook for tracking and responding to emotional states
 * Provides real-time emotional feedback and interface adaptations
 */

import { useState, useEffect, useCallback } from 'react';
import { EmotionalProfile } from '../services/EmotionDetectionService';
import { InterfaceAdaptations } from '../services/PersonalizationService';

export interface EmotionalStateReturn {
  // Current emotional state
  currentEmotion: EmotionalProfile;
  dominantEmotion: string;
  emotionalIntensity: number;
  valence: number;
  arousal: number;
  
  // Emotional history
  emotionalHistory: EmotionalProfile[];
  emotionalTrends: {
    trend: 'improving' | 'declining' | 'stable';
    change: number;
    direction: 'positive' | 'negative' | 'neutral';
  };
  
  // Interface adaptations
  interfaceAdaptations: InterfaceAdaptations;
  
  // Methods
  updateEmotionalState: (newEmotion: EmotionalProfile) => void;
  clearHistory: () => void;
  getEmotionalSummary: () => string;
}

export interface EmotionalStateConfig {
  historySize?: number;
  enableTrendAnalysis?: boolean;
  enableInterfaceAdaptation?: boolean;
  updateThreshold?: number; // Minimum change to trigger updates
}

const DEFAULT_CONFIG: EmotionalStateConfig = {
  historySize: 10,
  enableTrendAnalysis: true,
  enableInterfaceAdaptation: true,
  updateThreshold: 0.1
};

export const useEmotionalState = (
  initialEmotion?: EmotionalProfile,
  config: EmotionalStateConfig = {}
): EmotionalStateReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalProfile>(
    initialEmotion || getDefaultEmotionalProfile()
  );
  const [emotionalHistory, setEmotionalHistory] = useState<EmotionalProfile[]>(
    initialEmotion ? [initialEmotion] : []
  );
  const [interfaceAdaptations, setInterfaceAdaptations] = useState<InterfaceAdaptations>(
    getDefaultInterfaceAdaptations()
  );

  // Calculate derived emotional metrics
  const dominantEmotion = getDominantEmotion(currentEmotion);
  const emotionalIntensity = getEmotionalIntensity(currentEmotion);
  const valence = currentEmotion.valence;
  const arousal = currentEmotion.arousal;

  // Calculate emotional trends
  const emotionalTrends = calculateEmotionalTrends(emotionalHistory);

  // Update emotional state
  const updateEmotionalState = useCallback((newEmotion: EmotionalProfile) => {
    // Check if change is significant enough to trigger update
    const change = calculateEmotionalChange(currentEmotion, newEmotion);
    if (change < mergedConfig.updateThreshold!) {
      return;
    }

    setCurrentEmotion(newEmotion);

    // Update history
    setEmotionalHistory(prev => {
      const newHistory = [...prev, newEmotion];
      return newHistory.slice(-mergedConfig.historySize!);
    });

    // Update interface adaptations if enabled
    if (mergedConfig.enableInterfaceAdaptation) {
      const adaptations = calculateInterfaceAdaptations(newEmotion);
      setInterfaceAdaptations(adaptations);
      applyInterfaceAdaptations(adaptations);
    }
  }, [currentEmotion, mergedConfig]);

  // Clear emotional history
  const clearHistory = useCallback(() => {
    setEmotionalHistory([]);
  }, []);

  // Get emotional summary
  const getEmotionalSummary = useCallback((): string => {
    if (emotionalIntensity > 0.7) {
      return valence > 0 ? 'Feeling very positive and engaged' : 'Feeling intense negative emotions';
    } else if (emotionalIntensity > 0.4) {
      return valence > 0 ? 'Feeling moderately positive' : 'Feeling somewhat down';
    } else {
      return valence > 0 ? 'Feeling mildly positive' : 'Feeling neutral or slightly negative';
    }
  }, [emotionalIntensity, valence]);

  return {
    // Current emotional state
    currentEmotion,
    dominantEmotion,
    emotionalIntensity,
    valence,
    arousal,
    
    // Emotional history
    emotionalHistory,
    emotionalTrends,
    
    // Interface adaptations
    interfaceAdaptations,
    
    // Methods
    updateEmotionalState,
    clearHistory,
    getEmotionalSummary
  };
};

// Helper functions

function getDefaultEmotionalProfile(): EmotionalProfile {
  return {
    joy: 0.3,
    sadness: 0.1,
    anger: 0.1,
    fear: 0.1,
    disgust: 0.05,
    surprise: 0.2,
    contempt: 0.05,
    trust: 0.4,
    anticipation: 0.2,
    valence: 0.2,
    arousal: 0.3,
    dominance: 0.4,
    confidence: 0.5
  };
}

function getDefaultInterfaceAdaptations(): InterfaceAdaptations {
  return {
    colorScheme: 'adaptive',
    typography: 'comfortable',
    animationLevel: 'moderate',
    layoutDensity: 'balanced',
    emotionalIndicators: true
  };
}

function getDominantEmotion(profile: EmotionalProfile): string {
  const emotions = Object.entries(profile)
    .filter(([key]) => !['valence', 'arousal', 'dominance', 'confidence'].includes(key))
    .sort(([, a], [, b]) => b - a);
  
  return emotions[0]?.[0] || 'neutral';
}

function getEmotionalIntensity(profile: EmotionalProfile): number {
  const emotions = Object.values(profile)
    .filter((_, index) => index < 9); // First 9 are emotions
  
  return Math.max(...emotions);
}

function calculateEmotionalChange(oldEmotion: EmotionalProfile, newEmotion: EmotionalProfile): number {
  let totalChange = 0;
  const keys = Object.keys(oldEmotion) as (keyof EmotionalProfile)[];
  
  for (const key of keys) {
    totalChange += Math.abs(oldEmotion[key] - newEmotion[key]);
  }
  
  return totalChange / keys.length;
}

function calculateEmotionalTrends(history: EmotionalProfile[]): {
  trend: 'improving' | 'declining' | 'stable';
  change: number;
  direction: 'positive' | 'negative' | 'neutral';
} {
  if (history.length < 2) {
    return { trend: 'stable', change: 0, direction: 'neutral' };
  }

  const recent = history.slice(-3); // Last 3 emotions
  const older = history.slice(-6, -3); // 3 emotions before that

  if (older.length === 0) {
    return { trend: 'stable', change: 0, direction: 'neutral' };
  }

  const recentAvg = recent.reduce((sum, emotion) => sum + emotion.valence, 0) / recent.length;
  const olderAvg = older.reduce((sum, emotion) => sum + emotion.valence, 0) / older.length;
  const change = recentAvg - olderAvg;

  let trend: 'improving' | 'declining' | 'stable';
  let direction: 'positive' | 'negative' | 'neutral';

  if (Math.abs(change) < 0.1) {
    trend = 'stable';
    direction = 'neutral';
  } else if (change > 0) {
    trend = 'improving';
    direction = 'positive';
  } else {
    trend = 'declining';
    direction = 'negative';
  }

  return { trend, change, direction };
}

function calculateInterfaceAdaptations(emotion: EmotionalProfile): InterfaceAdaptations {
  return {
    colorScheme: emotion.valence > 0.3 ? 'warm' : emotion.valence < -0.3 ? 'cool' : 'adaptive',
    typography: emotion.arousal > 0.7 ? 'spacious' : 'comfortable',
    animationLevel: emotion.valence > 0.5 && emotion.arousal > 0.5 ? 'expressive' : 
                   emotion.valence < -0.3 ? 'minimal' : 'moderate',
    layoutDensity: emotion.arousal > 0.7 ? 'focused' : 'balanced',
    emotionalIndicators: true
  };
}

function applyInterfaceAdaptations(adaptations: InterfaceAdaptations): void {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--color-scheme', adaptations.colorScheme);
  root.style.setProperty('--typography-scale', adaptations.typography);
  root.style.setProperty('--animation-level', adaptations.animationLevel);
  root.style.setProperty('--layout-density', adaptations.layoutDensity);
  
  // Toggle emotional indicators
  root.classList.toggle('emotional-indicators', adaptations.emotionalIndicators);
  
  // Add emotion-specific classes
  root.classList.remove('emotion-positive', 'emotion-negative', 'emotion-neutral');
  if (adaptations.colorScheme === 'warm') {
    root.classList.add('emotion-positive');
  } else if (adaptations.colorScheme === 'cool') {
    root.classList.add('emotion-negative');
  } else {
    root.classList.add('emotion-neutral');
  }
}
