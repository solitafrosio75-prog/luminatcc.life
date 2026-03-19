/**
 * PersonalizationService - Creates adaptive experiences based on user patterns and emotional context
 * Implements Norman's reflective level of emotional design
 * Builds long-term relationships through meaningful personalization
 */

import { EmotionalProfile } from './EmotionDetectionService';
import { UserProfile, HumanizationElements } from './TrustBuildingService';

export interface InteractionPattern {
  timeOfDay: number;
  dayOfWeek: number;
  sessionDuration: number;
  interactionType: string;
  emotionalState: EmotionalProfile;
  responseQuality: number; // 0 to 1
  timestamp: Date;
}

export interface PersonalizationProfile {
  userId: string;
  preferences: UserPreferences;
  patterns: InteractionPattern[];
  adaptations: InterfaceAdaptations;
  sharedExperiences: SharedExperience[];
  reflectiveMeanings: ReflectiveMeaning[];
}

export interface UserPreferences {
  communicationStyle: 'direct' | 'gentle' | 'enthusiastic';
  informationDensity: 'minimal' | 'moderate' | 'detailed';
  visualComplexity: 'simple' | 'moderate' | 'rich';
  emotionalSupport: 'low' | 'medium' | 'high';
  pacing: 'fast' | 'moderate' | 'slow';
}

export interface InterfaceAdaptations {
  colorScheme: 'warm' | 'cool' | 'neutral' | 'adaptive';
  typography: 'compact' | 'comfortable' | 'spacious';
  animationLevel: 'minimal' | 'moderate' | 'expressive';
  layoutDensity: 'focused' | 'balanced' | 'comprehensive';
  emotionalIndicators: boolean;
}

export interface SharedExperience {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  emotionalContext: EmotionalProfile;
  significance: number; // 0 to 1
  tags: string[];
}

export interface ReflectiveMeaning {
  id: string;
  theme: string;
  personalSignificance: string;
  associatedEmotions: string[];
  creationDate: Date;
  reinforcementCount: number;
}

export interface PersonalizedContent {
  message: string;
  adaptations: Partial<InterfaceAdaptations>;
  timing: {
    deliveryTime: Date;
    urgency: 'low' | 'medium' | 'high';
    context: string;
  };
  reflectiveElement?: ReflectiveMeaning;
}

class PersonalizationService {
  private personalizationProfiles: Map<string, PersonalizationProfile> = new Map();
  private learningEngine: LearningEngine;
  private userMemory: UserMemory;

  constructor() {
    this.learningEngine = new LearningEngine();
    this.userMemory = new UserMemory();
  }

  /**
   * Analyze interaction history to learn user patterns
   * Location: 5a
   */
  public async analyzeInteractionHistory(userId: string): Promise<InteractionPattern[]> {
    const profile = this.getPersonalizationProfile(userId);
    
    // Location: learningEngine.process()
    const processedPatterns = await this.learningEngine.process(profile.patterns);
    
    // Location: extractPatterns()
    const extractedPatterns = this.extractPatterns(processedPatterns);
    
    // Update profile with new insights
    profile.patterns = extractedPatterns;
    this.personalizationProfiles.set(userId, profile);
    
    return extractedPatterns;
  }

  /**
   * Adapt interface based on current emotional context
   * Location: 5b
   */
  public adaptInterfaceToEmotionalContext(
    userId: string,
    currentEmotionalState: EmotionalProfile,
    userPreferences: UserPreferences
  ): InterfaceAdaptations {
    const profile = this.getPersonalizationProfile(userId);
    
    // Get current emotional state
    const emotionalContext = currentEmotionalState;
    
    // Get user preferences
    const preferences = userPreferences;
    
    // Calculate adaptations
    const adaptations = this.calculateAdaptations(emotionalContext, preferences, profile);
    
    // Apply adaptations to interface
    this.applyInterfaceAdaptations(adaptations);
    
    return adaptations;
  }

  /**
   * Create shared experiences to build relationship history
   * Location: 5c
   */
  public createSharedExperience(
    userId: string,
    title: string,
    description: string,
    emotionalContext: EmotionalProfile,
    significance: number = 0.5
  ): SharedExperience {
    const profile = this.getPersonalizationProfile(userId);
    
    // Load user memory
    const userMemory = this.userMemory.load(userId);
    
    // Merge with current context
    const mergedContext = this.mergeCurrentContext(userMemory, emotionalContext);
    
    const experience: SharedExperience = {
      id: this.generateExperienceId(),
      title,
      description,
      timestamp: new Date(),
      emotionalContext: mergedContext,
      significance,
      tags: this.generateExperienceTags(mergedContext, title)
    };
    
    // Add to profile
    profile.sharedExperiences.push(experience);
    
    // Update user memory
    this.userMemory.save(userId, experience);
    
    this.personalizationProfiles.set(userId, profile);
    
    return experience;
  }

  /**
   * Deliver reflective meaning at Norman's reflective level
   * Location: 5d
   */
  public async deliverReflectiveMeaning(
    userId: string,
    currentContext: string
  ): Promise<PersonalizedContent> {
    const profile = this.getPersonalizationProfile(userId);
    
    // Generate personalized content
    const personalizedContent = this.generatePersonalizedContent(profile, currentContext);
    
    // Map to user journey
    const journeyMappedContent = this.mapToUserJourney(personalizedContent, profile);
    
    return journeyMappedContent;
  }

  private getPersonalizationProfile(userId: string): PersonalizationProfile {
    if (!this.personalizationProfiles.has(userId)) {
      this.personalizationProfiles.set(userId, {
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
      });
    }
    
    return this.personalizationProfiles.get(userId)!;
  }

  private extractPatterns(patterns: InteractionPattern[]): InteractionPattern[] {
    // Analyze patterns for insights
    const timePatterns = this.analyzeTimePatterns(patterns);
    const emotionalPatterns = this.analyzeEmotionalPatterns(patterns);
    const interactionPatterns = this.analyzeInteractionPatterns(patterns);
    
    // Combine and prioritize significant patterns
    return [...timePatterns, ...emotionalPatterns, ...interactionPatterns]
      .sort((a, b) => b.responseQuality - a.responseQuality)
      .slice(0, 50); // Keep top 50 patterns
  }

  private analyzeTimePatterns(patterns: InteractionPattern[]): InteractionPattern[] {
    // Group by time of day and day of week
    const timeGroups = patterns.reduce((groups, pattern) => {
      const key = `${pattern.timeOfDay}-${pattern.dayOfWeek}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pattern);
      return groups;
    }, {} as Record<string, InteractionPattern[]>);
    
    // Find most successful times
    return Object.values(timeGroups)
      .map(group => group.reduce((best, current) => 
        current.responseQuality > best.responseQuality ? current : best
      ))
      .filter(pattern => pattern.responseQuality > 0.7);
  }

  private analyzeEmotionalPatterns(patterns: InteractionPattern[]): InteractionPattern[] {
    // Find patterns where user was most responsive
    return patterns
      .filter(pattern => pattern.emotionalState.valence > 0.3)
      .filter(pattern => pattern.responseQuality > 0.7);
  }

  private analyzeInteractionPatterns(patterns: InteractionPattern[]): InteractionPattern[] {
    // Find most successful interaction types
    const interactionGroups = patterns.reduce((groups, pattern) => {
      if (!groups[pattern.interactionType]) groups[pattern.interactionType] = [];
      groups[pattern.interactionType].push(pattern);
      return groups;
    }, {} as Record<string, InteractionPattern[]>);
    
    return Object.values(interactionGroups)
      .map(group => group.reduce((best, current) => 
        current.responseQuality > best.responseQuality ? current : best
      ));
  }

  private calculateAdaptations(
    emotionalContext: EmotionalProfile,
    preferences: UserPreferences,
    profile: PersonalizationProfile
  ): InterfaceAdaptations {
    const adaptations: InterfaceAdaptations = {
      colorScheme: this.adaptColorScheme(emotionalContext, preferences),
      typography: this.adaptTypography(emotionalContext, preferences),
      animationLevel: this.adaptAnimationLevel(emotionalContext, preferences),
      layoutDensity: this.adaptLayoutDensity(emotionalContext, preferences),
      emotionalIndicators: preferences.emotionalSupport !== 'low'
    };
    
    // Update profile
    profile.adaptations = { ...profile.adaptations, ...adaptations };
    
    return adaptations;
  }

  private adaptColorScheme(
    emotionalContext: EmotionalProfile,
    preferences: UserPreferences
  ): 'warm' | 'cool' | 'neutral' | 'adaptive' {
    if (emotionalContext.valence > 0.3) return 'warm';
    if (emotionalContext.valence < -0.3) return 'cool';
    return 'adaptive';
  }

  private adaptTypography(
    emotionalContext: EmotionalProfile,
    preferences: UserPreferences
  ): 'compact' | 'comfortable' | 'spacious' {
    if (emotionalContext.arousal > 0.7) return 'spacious';
    if (preferences.informationDensity === 'minimal') return 'comfortable';
    return 'comfortable';
  }

  private adaptAnimationLevel(
    emotionalContext: EmotionalProfile,
    preferences: UserPreferences
  ): 'minimal' | 'moderate' | 'expressive' {
    if (emotionalContext.valence > 0.5 && emotionalContext.arousal > 0.5) return 'expressive';
    if (emotionalContext.valence < -0.3) return 'minimal';
    return 'moderate';
  }

  private adaptLayoutDensity(
    emotionalContext: EmotionalProfile,
    preferences: UserPreferences
  ): 'focused' | 'balanced' | 'comprehensive' {
    if (emotionalContext.arousal > 0.7) return 'focused';
    if (preferences.informationDensity === 'detailed') return 'comprehensive';
    return 'balanced';
  }

  private applyInterfaceAdaptations(adaptations: InterfaceAdaptations): void {
    const root = document.documentElement;
    
    // Apply CSS custom properties for adaptations
    root.style.setProperty('--color-scheme', adaptations.colorScheme);
    root.style.setProperty('--typography-scale', adaptations.typography);
    root.style.setProperty('--animation-level', adaptations.animationLevel);
    root.style.setProperty('--layout-density', adaptations.layoutDensity);
    
    // Toggle emotional indicators
    root.classList.toggle('emotional-indicators', adaptations.emotionalIndicators);
  }

  private mergeCurrentContext(
    userMemory: SharedExperience[],
    emotionalContext: EmotionalProfile
  ): EmotionalProfile {
    // Blend current emotional state with historical patterns
    if (userMemory.length === 0) return emotionalContext;
    
    const recentExperiences = userMemory.slice(-5);
    const avgEmotionalContext = this.averageEmotionalProfiles(
      recentExperiences.map(exp => exp.emotionalContext)
    );
    
    // Weight current context more heavily
    return this.blendEmotionalProfiles(emotionalContext, avgEmotionalContext, 0.7);
  }

  private averageEmotionalProfiles(profiles: EmotionalProfile[]): EmotionalProfile {
    const avg: EmotionalProfile = {
      joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0,
      surprise: 0, contempt: 0, trust: 0, anticipation: 0,
      valence: 0, arousal: 0, dominance: 0, confidence: 0
    };
    
    profiles.forEach(profile => {
      Object.keys(avg).forEach(key => {
        avg[key as keyof EmotionalProfile] += profile[key as keyof EmotionalProfile];
      });
    });
    
    const count = profiles.length;
    Object.keys(avg).forEach(key => {
      avg[key as keyof EmotionalProfile] /= count;
    });
    
    return avg;
  }

  private blendEmotionalProfiles(
    primary: EmotionalProfile,
    secondary: EmotionalProfile,
    primaryWeight: number
  ): EmotionalProfile {
    const secondaryWeight = 1 - primaryWeight;
    const blended: EmotionalProfile = {} as EmotionalProfile;
    
    Object.keys(primary).forEach(key => {
      blended[key as keyof EmotionalProfile] = 
        primary[key as keyof EmotionalProfile] * primaryWeight +
        secondary[key as keyof EmotionalProfile] * secondaryWeight;
    });
    
    return blended;
  }

  private generateExperienceId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExperienceTags(
    emotionalContext: EmotionalProfile,
    title: string
  ): string[] {
    const tags: string[] = [];
    
    // Add emotion-based tags
    if (emotionalContext.joy > 0.5) tags.push('positive');
    if (emotionalContext.sadness > 0.5) tags.push('emotional');
    if (emotionalContext.trust > 0.5) tags.push('trust-building');
    
    // Add content-based tags
    const titleWords = title.toLowerCase().split(/\s+/);
    if (titleWords.includes('success')) tags.push('achievement');
    if (titleWords.includes('challenge')) tags.push('growth');
    if (titleWords.includes('learning')) tags.push('educational');
    
    return tags;
  }

  private generatePersonalizedContent(
    profile: PersonalizationProfile,
    currentContext: string
  ): PersonalizedContent {
    // Find relevant shared experiences
    const relevantExperiences = profile.sharedExperiences.filter(exp => 
      exp.significance > 0.6 && exp.tags.some(tag => 
        currentContext.toLowerCase().includes(tag)
      )
    );
    
    // Generate reflective message
    const message = this.generateReflectiveMessage(relevantExperiences, currentContext);
    
    return {
      message,
      adaptations: profile.adaptations,
      timing: {
        deliveryTime: new Date(),
        urgency: 'medium',
        context: currentContext
      }
    };
  }

  private generateReflectiveMessage(
    experiences: SharedExperience[],
    context: string
  ): string {
    if (experiences.length === 0) {
      return "I'm here to support you on your journey.";
    }
    
    const mostRelevant = experiences[0];
    const timeAgo = this.getTimeAgo(mostRelevant.timestamp);
    
    return `I remember when we ${mostRelevant.title.toLowerCase()} ${timeAgo}. That experience shows how much you've grown.`;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  private mapToUserJourney(
    content: PersonalizedContent,
    profile: PersonalizationProfile
  ): PersonalizedContent {
    // Add reflective element if available
    const relevantMeaning = profile.reflectiveMeanings.find(meaning =>
      content.message.toLowerCase().includes(meaning.theme.toLowerCase())
    );
    
    if (relevantMeaning) {
      content.reflectiveElement = relevantMeaning;
    }
    
    return content;
  }
}

// Supporting classes
class LearningEngine {
  public async process(patterns: InteractionPattern[]): Promise<InteractionPattern[]> {
    // Simulate machine learning processing
    // In real implementation, this would use ML algorithms to identify patterns
    return patterns;
  }
}

class UserMemory {
  private memories: Map<string, SharedExperience[]> = new Map();
  
  public load(userId: string): SharedExperience[] {
    return this.memories.get(userId) || [];
  }
  
  public save(userId: string, experience: SharedExperience): void {
    if (!this.memories.has(userId)) {
      this.memories.set(userId, []);
    }
    
    const memories = this.memories.get(userId)!;
    memories.push(experience);
    
    // Keep only last 100 memories
    if (memories.length > 100) {
      this.memories.set(userId, memories.slice(-100));
    }
  }
}

export const personalizationService = new PersonalizationService();
