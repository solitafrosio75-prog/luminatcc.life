/**
 * TrustBuildingService - Builds long-term trust through humanization and oxytocin activation
 * Implements research-based strategies for creating emotional bonds with technology
 * Based on oxytocin research and human-computer relationship psychology
 */

import { EmotionalProfile } from './EmotionDetectionService';

export interface UserProfile {
  id: string;
  userType: 'social' | 'technical' | 'mixed';
  humanizationPreference: 'low' | 'medium' | 'high';
  trustLevel: number; // 0 to 1
  interactionCount: number;
  lastInteraction: Date;
  personalityMatch: PersonalityMatch;
}

export interface PersonalityMatch {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface HumanizationElements {
  persona: Persona;
  communicationStyle: CommunicationStyle;
  personalityTraits: string[];
  emotionalExpression: EmotionalExpression;
}

export interface Persona {
  name: string;
  avatar?: string;
  background: string;
  characteristics: string[];
  voiceTone: 'warm' | 'professional' | 'friendly' | 'enthusiastic';
}

export interface CommunicationStyle {
  formality: 'casual' | 'semi-formal' | 'formal';
  empathy: 'minimal' | 'moderate' | 'high';
  humor: 'none' | 'light' | 'playful';
  personalization: 'generic' | 'contextual' | 'deeply-personal';
}

export interface EmotionalExpression {
  frequency: 'rare' | 'occasional' | 'frequent';
  intensity: 'subtle' | 'moderate' | 'expressive';
  types: ('joy' | 'empathy' | 'excitement' | 'concern' | 'pride')[];
}

export interface TrustBuildingEvent {
  timestamp: Date;
  eventType: 'humanization' | 'reliability' | 'empathy' | 'personalization';
  oxytocinImpact: number; // -1 to 1
  trustChange: number; // -1 to 1
  context: string;
}

class TrustBuildingService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private trustHistory: Map<string, TrustBuildingEvent[]> = new Map();
  private humanizationStrategies: Map<string, HumanizationElements> = new Map();

  constructor() {
    this.initializeHumanizationStrategies();
  }

  /**
   * Calculate optimal humanization level for user
   * Location: 4a
   */
  public calculateHumanizationLevel(userId: string): HumanizationElements {
    const userProfile = this.getUserProfile(userId);
    const userType = this.determineUserType(userProfile);
    
    return this.selectHumanizationStrategy(userType, userProfile);
  }

  /**
   * Apply humanization elements to interaction
   * Location: 4b
   */
  public applyHumanizationElements(
    userId: string,
    context: string
  ): HumanizationElements {
    const humanization = this.calculateHumanizationLevel(userId);
    
    // Select persona based on user preferences
    const persona = this.selectPersona(humanization, userId);
    
    // Choose communication style
    const communicationStyle = this.chooseCommunicationStyle(humanization, userId);
    
    // Implement personality
    const personality = this.implementPersonality(humanization, userId);
    
    return {
      persona,
      communicationStyle,
      personalityTraits: personality,
      emotionalExpression: humanization.emotionalExpression
    };
  }

  /**
   * Trigger oxytocin response through humanized interaction
   * Location: 4c
   */
  public async triggerOxytocinResponse(
    userId: string,
    interactionType: 'humanized' | 'reliable' | 'empathetic',
    emotionalProfile: EmotionalProfile
  ): Promise<number> {
    const userProfile = this.getUserProfile(userId);
    const baseOxytocinResponse = this.calculateBaseOxytocinResponse(userProfile, interactionType);
    
    // Enhance response based on emotional connection
    const emotionalEnhancement = this.calculateEmotionalEnhancement(emotionalProfile, userProfile);
    
    // Calculate final oxytocin impact
    const oxytocinImpact = Math.min(baseOxytocinResponse + emotionalEnhancement, 1);
    
    // Record the trust building event
    this.recordTrustBuildingEvent(userId, {
      timestamp: new Date(),
      eventType: interactionType === 'humanized' ? 'humanization' : 
                 interactionType === 'empathetic' ? 'empathy' : 'reliability',
      oxytocinImpact,
      trustChange: oxytocinImpact * 0.1, // Trust builds more slowly
      context: `${interactionType} interaction`
    });
    
    return oxytocinImpact;
  }

  /**
   * Record trust building event for long-term relationship tracking
   * Location: 4d
   */
  public recordTrustBuildingEvent(userId: string, event: TrustBuildingEvent): void {
    if (!this.trustHistory.has(userId)) {
      this.trustHistory.set(userId, []);
    }
    
    const history = this.trustHistory.get(userId)!;
    history.push(event);
    
    // Update user's trust level
    this.updateTrustLevel(userId, event);
    
    // Keep only last 100 events
    if (history.length > 100) {
      this.trustHistory.set(userId, history.slice(-100));
    }
  }

  private getUserProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
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
      });
    }
    
    return this.userProfiles.get(userId)!;
  }

  private determineUserType(profile: UserProfile): 'social' | 'technical' | 'mixed' {
    // In a real implementation, this would analyze user behavior patterns
    // For now, we'll use the existing userType
    return profile.userType;
  }

  private selectHumanizationStrategy(
    userType: 'social' | 'technical' | 'mixed',
    profile: UserProfile
  ): HumanizationElements {
    // Social users respond better to humanization (oxytocin research)
    if (userType === 'social') {
      return this.humanizationStrategies.get('high_humanization')!;
    }
    
    // Technical users may prefer less humanization
    if (userType === 'technical') {
      return this.humanizationStrategies.get('low_humanization')!;
    }
    
    // Mixed users get balanced approach
    return this.humanizationStrategies.get('moderate_humanization')!;
  }

  private selectPersona(humanization: HumanizationElements, userId: string): Persona {
    const profile = this.getUserProfile(userId);
    
    // Adjust persona based on user trust level
    if (profile.trustLevel > 0.8) {
      return {
        name: 'Alex',
        background: 'Your trusted digital companion who\'s been helping you for a while',
        characteristics: ['empathetic', 'reliable', 'understanding', 'supportive'],
        voiceTone: 'warm'
      };
    } else if (profile.trustLevel > 0.5) {
      return {
        name: 'Sam',
        background: 'Your helpful digital assistant',
        characteristics: ['helpful', 'friendly', 'professional'],
        voiceTone: 'friendly'
      };
    } else {
      return {
        name: 'Assistant',
        background: 'Digital support system',
        characteristics: ['professional', 'efficient', 'helpful'],
        voiceTone: 'professional'
      };
    }
  }

  private chooseCommunicationStyle(
    humanization: HumanizationElements,
    userId: string
  ): CommunicationStyle {
    const profile = this.getUserProfile(userId);
    
    return {
      formality: profile.trustLevel > 0.7 ? 'casual' : 'semi-formal',
      empathy: humanization.personalityTraits.includes('empathetic') ? 'high' : 'moderate',
      humor: profile.trustLevel > 0.8 ? 'light' : 'none',
      personalization: profile.trustLevel > 0.6 ? 'contextual' : 'generic'
    };
  }

  private implementPersonality(humanization: HumanizationElements, userId: string): string[] {
    const profile = this.getUserProfile(userId);
    
    // Adapt personality based on trust level and user type
    let traits = [...humanization.personalityTraits];
    
    if (profile.trustLevel > 0.7) {
      traits.push('authentic', 'caring');
    }
    
    if (profile.userType === 'social') {
      traits.push('warm', 'understanding');
    } else if (profile.userType === 'technical') {
      traits.push('precise', 'logical');
    }
    
    return traits;
  }

  private calculateBaseOxytocinResponse(
    profile: UserProfile,
    interactionType: 'humanized' | 'reliable' | 'empathetic'
  ): number {
    const userTypeMultipliers = {
      social: { humanized: 0.8, reliable: 0.4, empathetic: 0.9 },
      technical: { humanized: 0.3, reliable: 0.7, empathetic: 0.5 },
      mixed: { humanized: 0.5, reliable: 0.6, empathetic: 0.7 }
    };
    
    const baseMultiplier = userTypeMultipliers[profile.userType][interactionType];
    
    // Adjust based on current trust level (higher trust = stronger oxytocin response)
    const trustMultiplier = 0.5 + (profile.trustLevel * 0.5);
    
    return baseMultiplier * trustMultiplier;
  }

  private calculateEmotionalEnhancement(
    emotionalProfile: EmotionalProfile,
    profile: UserProfile
  ): number {
    // Positive emotions enhance oxytocin response
    const positiveEmotions = emotionalProfile.joy + emotionalProfile.trust;
    const negativeEmotions = emotionalProfile.sadness + emotionalProfile.fear + emotionalProfile.anger;
    
    const emotionalBalance = (positiveEmotions - negativeEmotions) / 2;
    
    // Social users are more responsive to emotional connection
    const userMultiplier = profile.userType === 'social' ? 1.5 : 1.0;
    
    return Math.max(0, emotionalBalance * 0.3 * userMultiplier);
  }

  private updateTrustLevel(userId: string, event: TrustBuildingEvent): void {
    const profile = this.getUserProfile(userId);
    
    // Update trust level based on event
    profile.trustLevel = Math.max(0, Math.min(1, profile.trustLevel + event.trustChange));
    profile.interactionCount++;
    profile.lastInteraction = event.timestamp;
    
    this.userProfiles.set(userId, profile);
  }

  private initializeHumanizationStrategies(): void {
    this.humanizationStrategies.set('high_humanization', {
      persona: {
        name: 'Emma',
        background: 'Your caring digital companion',
        characteristics: ['empathetic', 'warm', 'understanding', 'supportive', 'authentic'],
        voiceTone: 'warm'
      },
      communicationStyle: {
        formality: 'casual',
        empathy: 'high',
        humor: 'light',
        personalization: 'deeply-personal'
      },
      personalityTraits: ['empathetic', 'caring', 'authentic', 'supportive'],
      emotionalExpression: {
        frequency: 'frequent',
        intensity: 'moderate',
        types: ['empathy', 'joy', 'concern']
      }
    });
    
    this.humanizationStrategies.set('moderate_humanization', {
      persona: {
        name: 'Alex',
        background: 'Your helpful digital assistant',
        characteristics: ['helpful', 'friendly', 'professional', 'reliable'],
        voiceTone: 'friendly'
      },
      communicationStyle: {
        formality: 'semi-formal',
        empathy: 'moderate',
        humor: 'none',
        personalization: 'contextual'
      },
      personalityTraits: ['helpful', 'reliable', 'professional'],
      emotionalExpression: {
        frequency: 'occasional',
        intensity: 'subtle',
        types: ['empathy', 'concern']
      }
    });
    
    this.humanizationStrategies.set('low_humanization', {
      persona: {
        name: 'System',
        background: 'Digital support interface',
        characteristics: ['efficient', 'accurate', 'helpful', 'professional'],
        voiceTone: 'professional'
      },
      communicationStyle: {
        formality: 'formal',
        empathy: 'minimal',
        humor: 'none',
        personalization: 'generic'
      },
      personalityTraits: ['efficient', 'accurate', 'professional'],
      emotionalExpression: {
        frequency: 'rare',
        intensity: 'subtle',
        types: ['concern']
      }
    });
  }

  /**
   * Get user's current trust level
   */
  public getTrustLevel(userId: string): number {
    return this.getUserProfile(userId).trustLevel;
  }

  /**
   * Get trust building history for user
   */
  public getTrustHistory(userId: string): TrustBuildingEvent[] {
    return this.trustHistory.get(userId) || [];
  }

  /**
   * Update user type based on observed behavior
   */
  public updateUserType(userId: string, userType: 'social' | 'technical' | 'mixed'): void {
    const profile = this.getUserProfile(userId);
    profile.userType = userType;
    this.userProfiles.set(userId, profile);
  }
}

export const trustBuildingService = new TrustBuildingService();
