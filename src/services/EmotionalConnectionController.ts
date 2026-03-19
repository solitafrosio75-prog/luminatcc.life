/**
 * EmotionalConnectionController - Main orchestrator for the Emotional Connection System
 * Coordinates all services to provide seamless emotional intelligence
 * Implements the complete flow from first impression to long-term personalization
 */

import { firstImpressionService, FirstImpressionMetrics } from './FirstImpressionService';
import { emotionDetectionService, EmotionalProfile, MultimodalInput } from './EmotionDetectionService';
import { empathyEngine, EmpatheticResponse, EmotionalContext } from './EmpathyEngine';
import { trustBuildingService, UserProfile, HumanizationElements } from './TrustBuildingService';
import { personalizationService, PersonalizationProfile, PersonalizedContent } from './PersonalizationService';

export interface UserSession {
  userId: string;
  startTime: Date;
  firstImpressionMetrics?: FirstImpressionMetrics;
  currentEmotionalState?: EmotionalProfile;
  userProfile?: UserProfile;
  personalizationProfile?: PersonalizationProfile;
  trustLevel: number;
  interactionCount: number;
}

export interface SystemResponse {
  empatheticResponse: EmpatheticResponse;
  personalizationAdaptations: PersonalizedContent;
  trustBuildingElements: HumanizationElements;
  timing: {
    firstImpressionTime: number;
    emotionDetectionTime: number;
    responseGenerationTime: number;
    totalTime: number;
  };
}

export interface EmotionalConnectionConfig {
  userId: string;
  enableFirstImpressionOptimization: boolean;
  enableEmotionDetection: boolean;
  enableTrustBuilding: boolean;
  enablePersonalization: boolean;
  multimodalInputs: {
    text: boolean;
    voice: boolean;
    video: boolean;
  };
}

class EmotionalConnectionController {
  private activeSessions: Map<string, UserSession> = new Map();
  private config: EmotionalConnectionConfig;

  constructor(config: EmotionalConnectionConfig) {
    this.config = config;
  }

  /**
   * Initialize a new user session with first impression optimization
   */
  public async initializeSession(userId: string): Promise<UserSession> {
    const session: UserSession = {
      userId,
      startTime: new Date(),
      trustLevel: 0.5,
      interactionCount: 0
    };

    // Start first impression optimization if enabled
    if (this.config.enableFirstImpressionOptimization) {
      await this.handleFirstImpression(session);
    }

    // Initialize user profiles
    session.userProfile = this.initializeUserProfile(userId);
    session.personalizationProfile = this.initializePersonalizationProfile(userId);

    this.activeSessions.set(userId, session);
    return session;
  }

  /**
   * Process user input through the complete emotional connection pipeline
   */
  public async processUserInput(
    userId: string,
    input: {
      text?: string;
      voiceBlob?: Blob;
      videoFrame?: ImageData;
      context?: string;
    }
  ): Promise<SystemResponse> {
    const session = this.activeSessions.get(userId);
    if (!session) {
      throw new Error(`No active session found for user ${userId}`);
    }

    const startTime = performance.now();

    // Step 1: Emotion Detection
    const emotionDetectionStart = performance.now();
    const emotionalProfile = await this.detectEmotions(input);
    const emotionDetectionTime = performance.now() - emotionDetectionStart;

    // Update session emotional state
    session.currentEmotionalState = emotionalProfile;
    session.interactionCount++;

    // Step 2: Generate Empathetic Response
    const responseGenerationStart = performance.now();
    const empatheticResponse = await this.generateEmpatheticResponse(
      input.text || '',
      emotionalProfile,
      session
    );
    const responseGenerationTime = performance.now() - responseGenerationStart;

    // Step 3: Trust Building
    const trustBuildingElements = await this.buildTrust(userId, emotionalProfile);

    // Step 4: Personalization
    const personalizationAdaptations = await this.personalizeExperience(
      userId,
      emotionalProfile,
      input.context || ''
    );

    // Update trust level
    session.trustLevel = trustBuildingService.getTrustLevel(userId);

    const totalTime = performance.now() - startTime;

    return {
      empatheticResponse,
      personalizationAdaptations,
      trustBuildingElements,
      timing: {
        firstImpressionTime: session.firstImpressionMetrics?.loadTime || 0,
        emotionDetectionTime,
        responseGenerationTime,
        totalTime
      }
    };
  }

  /**
   * Handle first impression optimization
   */
  private async handleFirstImpression(session: UserSession): Promise<void> {
    // Start impression timer
    firstImpressionService.startImpressionTimer();

    // Preload critical visual assets
    const criticalAssets = [
      { id: 'logo', url: '/logo.png', type: 'image' as const, priority: 'critical' as const, preload: true },
      { id: 'hero', url: '/hero-bg.jpg', type: 'image' as const, priority: 'critical' as const, preload: true },
      { id: 'avatar', url: '/default-avatar.png', type: 'image' as const, priority: 'critical' as const, preload: true }
    ];

    await firstImpressionService.preloadVisualAssets(criticalAssets);

    // Apply cognitive fluency optimizations
    firstImpressionService.optimizeCognitiveFluency({
      cleanDesignPatterns: true,
      legibleTypography: true,
      wellContrastedColors: true,
      intuitiveLayout: true
    });

    // Trigger visceral response
    firstImpressionService.triggerVisceralResponse();

    // Store metrics
    session.firstImpressionMetrics = firstImpressionService.getMetrics();
  }

  /**
   * Detect emotions from multimodal input
   */
  private async detectEmotions(input: {
    text?: string;
    voiceBlob?: Blob;
    videoFrame?: ImageData;
  }): Promise<EmotionalProfile> {
    if (!this.config.enableEmotionDetection) {
      return this.getDefaultEmotionalProfile();
    }

    const multimodalInput: MultimodalInput = {};

    if (input.text && this.config.multimodalInputs.text) {
      multimodalInput.text = {
        text: input.text,
        timestamp: Date.now(),
        context: 'user_input'
      };
    }

    if (input.voiceBlob && this.config.multimodalInputs.voice) {
      multimodalInput.voice = {
        audioBlob: input.voiceBlob,
        duration: 0, // Would be calculated from blob
        timestamp: Date.now()
      };
    }

    if (input.videoFrame && this.config.multimodalInputs.video) {
      multimodalInput.video = {
        videoFrame: input.videoFrame,
        timestamp: Date.now(),
        faceDetection: true
      };
    }

    return await emotionDetectionService.analyzeUserInput(multimodalInput);
  }

  /**
   * Generate empathetic response
   */
  private async generateEmpatheticResponse(
    text: string,
    emotionalProfile: EmotionalProfile,
    session: UserSession
  ): Promise<EmpatheticResponse> {
    const emotionalContext: EmotionalContext = {
      currentEmotion: this.getDominantEmotion(emotionalProfile),
      intensity: this.getEmotionalIntensity(emotionalProfile),
      valence: emotionalProfile.valence,
      previousEmotions: [], // Would track from session history
      conversationHistory: [], // Would track from session history
      userPreferences: {
        communicationStyle: 'gentle',
        validationLevel: 'moderate'
      }
    };

    const response = await empathyEngine.generateResponse(
      text,
      emotionalProfile,
      emotionalContext
    );

    // Add to response history
    empathyEngine.addToHistory(response);

    return response;
  }

  /**
   * Build trust through humanization
   */
  private async buildTrust(
    userId: string,
    emotionalProfile: EmotionalProfile
  ): Promise<HumanizationElements> {
    if (!this.config.enableTrustBuilding) {
      return this.getDefaultHumanizationElements();
    }

    // Apply humanization elements
    const humanizationElements = trustBuildingService.applyHumanizationElements(
      userId,
      'user_interaction'
    );

    // Trigger oxytocin response
    await trustBuildingService.triggerOxytocinResponse(
      userId,
      'empathetic',
      emotionalProfile
    );

    return humanizationElements;
  }

  /**
   * Personalize the experience
   */
  private async personalizeExperience(
    userId: string,
    emotionalProfile: EmotionalProfile,
    context: string
  ): Promise<PersonalizedContent> {
    if (!this.config.enablePersonalization) {
      return this.getDefaultPersonalizedContent();
    }

    // Analyze interaction history
    await personalizationService.analyzeInteractionHistory(userId);

    // Adapt interface to emotional context
    const adaptations = personalizationService.adaptInterfaceToEmotionalContext(
      userId,
      emotionalProfile,
      {
        communicationStyle: 'gentle',
        informationDensity: 'moderate',
        visualComplexity: 'moderate',
        emotionalSupport: 'medium',
        pacing: 'moderate'
      }
    );

    // Create shared experience
    personalizationService.createSharedExperience(
      userId,
      'Meaningful Interaction',
      context,
      emotionalProfile,
      0.7
    );

    // Deliver reflective meaning
    return await personalizationService.deliverReflectiveMeaning(userId, context);
  }

  private initializeUserProfile(userId: string): UserProfile {
    return {
      id: userId,
      userType: 'mixed',
      humanizationPreference: 'medium',
      trustLevel: 0.5,
      interactionCount: 0,
      lastInteraction: new Date(),
      personalityMatch: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5
      }
    };
  }

  private initializePersonalizationProfile(userId: string): PersonalizationProfile {
    return {
      userId,
      preferences: {
        communicationStyle: 'gentle',
        informationDensity: 'moderate',
        visualComplexity: 'moderate',
        emotionalSupport: 'medium',
        pacing: 'moderate'
      },
      patterns: [],
      adaptations: {
        colorScheme: 'adaptive',
        typography: 'comfortable',
        animationLevel: 'moderate',
        layoutDensity: 'balanced',
        emotionalIndicators: true
      },
      sharedExperiences: [],
      reflectiveMeanings: []
    };
  }

  private getDefaultEmotionalProfile(): EmotionalProfile {
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

  private getDefaultHumanizationElements(): HumanizationElements {
    return {
      persona: {
        name: 'Assistant',
        background: 'Digital support system',
        characteristics: ['helpful', 'professional'],
        voiceTone: 'professional'
      },
      communicationStyle: {
        formality: 'semi-formal',
        empathy: 'moderate',
        humor: 'none',
        personalization: 'generic'
      },
      personalityTraits: ['helpful', 'professional'],
      emotionalExpression: {
        frequency: 'occasional',
        intensity: 'subtle',
        types: ['empathy']
      }
    };
  }

  private getDefaultPersonalizedContent(): PersonalizedContent {
    return {
      message: 'I\'m here to help you.',
      adaptations: {
        colorScheme: 'adaptive',
        typography: 'comfortable',
        animationLevel: 'moderate',
        layoutDensity: 'balanced',
        emotionalIndicators: true
      },
      timing: {
        deliveryTime: new Date(),
        urgency: 'medium',
        context: 'default'
      }
    };
  }

  private getDominantEmotion(profile: EmotionalProfile): string {
    const emotions = Object.entries(profile)
      .filter(([key]) => !['valence', 'arousal', 'dominance', 'confidence'].includes(key))
      .sort(([, a], [, b]) => b - a);
    
    return emotions[0]?.[0] || 'neutral';
  }

  private getEmotionalIntensity(profile: EmotionalProfile): number {
    const emotions = Object.values(profile)
      .filter((_, index) => index < 9); // First 9 are emotions
    
    return Math.max(...emotions);
  }

  /**
   * Get current session information
   */
  public getSession(userId: string): UserSession | undefined {
    return this.activeSessions.get(userId);
  }

  /**
   * End user session and save data
   */
  public endSession(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session) {
      // Save session data to persistent storage
      this.saveSessionData(session);
      this.activeSessions.delete(userId);
    }
  }

  private saveSessionData(session: UserSession): void {
    // In a real implementation, this would save to database
    console.log('Saving session data:', {
      userId: session.userId,
      duration: Date.now() - session.startTime.getTime(),
      interactionCount: session.interactionCount,
      finalTrustLevel: session.trustLevel,
      firstImpressionMetrics: session.firstImpressionMetrics
    });
  }
}

export default EmotionalConnectionController;
