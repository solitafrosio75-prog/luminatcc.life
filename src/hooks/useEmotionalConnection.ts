/**
 * useEmotionalConnection - React hook for integrating the Emotional Connection System
 * Provides easy access to all emotional intelligence features
 * Manages session lifecycle and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import EmotionalConnectionController, { 
  UserSession, 
  SystemResponse, 
  EmotionalConnectionConfig 
} from '../services/EmotionalConnectionController';

export interface UseEmotionalConnectionReturn {
  // Session management
  session: UserSession | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Interaction methods
  sendMessage: (text: string, context?: string) => Promise<SystemResponse>;
  sendVoiceInput: (audioBlob: Blob, context?: string) => Promise<SystemResponse>;
  sendVideoInput: (videoFrame: ImageData, context?: string) => Promise<SystemResponse>;
  
  // Session control
  initializeSession: (userId: string) => Promise<void>;
  endSession: () => void;
  
  // State access
  trustLevel: number;
  interactionCount: number;
  currentEmotionalState: any;
  firstImpressionMetrics: any;
}

export interface EmotionalConnectionHookConfig {
  userId?: string;
  autoInitialize?: boolean;
  enableFirstImpressionOptimization?: boolean;
  enableEmotionDetection?: boolean;
  enableTrustBuilding?: boolean;
  enablePersonalization?: boolean;
  multimodalInputs?: {
    text?: boolean;
    voice?: boolean;
    video?: boolean;
  };
}

const DEFAULT_CONFIG: EmotionalConnectionHookConfig = {
  autoInitialize: true,
  enableFirstImpressionOptimization: true,
  enableEmotionDetection: true,
  enableTrustBuilding: true,
  enablePersonalization: true,
  multimodalInputs: {
    text: true,
    voice: false,
    video: false
  }
};

export const useEmotionalConnection = (
  config: EmotionalConnectionHookConfig = {}
): UseEmotionalConnectionReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const controllerRef = useRef<EmotionalConnectionController | null>(null);

  // Ref that always mirrors the latest session — used in the cleanup function
  // to avoid a stale closure on `session` (which would always be null inside
  // a useEffect with [] deps).
  const sessionRef = useRef<UserSession | null>(null);

  const [session, setSession] = useState<UserSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep sessionRef in sync with the latest session state.
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Initialize controller
  useEffect(() => {
    const emotionalConfig: EmotionalConnectionConfig = {
      userId: mergedConfig.userId || 'anonymous',
      enableFirstImpressionOptimization: mergedConfig.enableFirstImpressionOptimization ?? true,
      enableEmotionDetection: mergedConfig.enableEmotionDetection ?? true,
      enableTrustBuilding: mergedConfig.enableTrustBuilding ?? true,
      enablePersonalization: mergedConfig.enablePersonalization ?? true,
      multimodalInputs: {
        text: mergedConfig.multimodalInputs?.text ?? true,
        voice: mergedConfig.multimodalInputs?.voice ?? false,
        video: mergedConfig.multimodalInputs?.video ?? false
      }
    };

    controllerRef.current = new EmotionalConnectionController(emotionalConfig);

    // Auto-initialize if enabled and userId is provided
    if (mergedConfig.autoInitialize && mergedConfig.userId) {
      initializeSession(mergedConfig.userId);
    }

    return () => {
      // Read from ref (not state) so the cleanup always has the current userId.
      if (sessionRef.current && controllerRef.current) {
        controllerRef.current.endSession(sessionRef.current.userId);
      }
    };
  }, []);

  const initializeSession = useCallback(async (userId: string) => {
    if (!controllerRef.current) {
      setError('Controller not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userSession = await controllerRef.current.initializeSession(userId);
      setSession(userSession);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    text: string, 
    context?: string
  ): Promise<SystemResponse> => {
    if (!controllerRef.current || !session) {
      throw new Error('Session not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await controllerRef.current.processUserInput(session.userId, {
        text,
        context
      });

      // Update session with new data
      const updatedSession = controllerRef.current.getSession(session.userId);
      if (updatedSession) {
        setSession(updatedSession);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const sendVoiceInput = useCallback(async (
    audioBlob: Blob, 
    context?: string
  ): Promise<SystemResponse> => {
    if (!controllerRef.current || !session) {
      throw new Error('Session not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await controllerRef.current.processUserInput(session.userId, {
        voiceBlob: audioBlob,
        context
      });

      const updatedSession = controllerRef.current.getSession(session.userId);
      if (updatedSession) {
        setSession(updatedSession);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process voice input';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const sendVideoInput = useCallback(async (
    videoFrame: ImageData, 
    context?: string
  ): Promise<SystemResponse> => {
    if (!controllerRef.current || !session) {
      throw new Error('Session not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await controllerRef.current.processUserInput(session.userId, {
        videoFrame,
        context
      });

      const updatedSession = controllerRef.current.getSession(session.userId);
      if (updatedSession) {
        setSession(updatedSession);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process video input';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const endSession = useCallback(() => {
    if (controllerRef.current && session) {
      controllerRef.current.endSession(session.userId);
      setSession(null);
      setIsInitialized(false);
    }
  }, [session]);

  // Computed values
  const trustLevel = session?.trustLevel ?? 0;
  const interactionCount = session?.interactionCount ?? 0;
  const currentEmotionalState = session?.currentEmotionalState;
  const firstImpressionMetrics = session?.firstImpressionMetrics;

  return {
    // Session management
    session,
    isInitialized,
    isLoading,
    error,
    
    // Interaction methods
    sendMessage,
    sendVoiceInput,
    sendVideoInput,
    
    // Session control
    initializeSession,
    endSession,
    
    // State access
    trustLevel,
    interactionCount,
    currentEmotionalState,
    firstImpressionMetrics
  };
};
