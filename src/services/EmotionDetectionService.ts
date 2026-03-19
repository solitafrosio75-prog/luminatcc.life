/**
 * EmotionDetectionService - Multimodal emotion analysis pipeline
 * Implements real-time emotion detection across text, voice, and visual inputs
 * Based on modern emotion recognition research and APIs like Imentiv
 */

export interface EmotionalProfile {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  disgust: number;
  surprise: number;
  contempt: number;
  trust: number;
  anticipation: number;
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  dominance: number; // 0 (submissive) to 1 (dominant)
  confidence: number; // 0 to 1
}

export interface TextEmotionInput {
  text: string;
  timestamp: number;
  context?: string;
}

export interface VoiceEmotionInput {
  audioBlob: Blob;
  duration: number;
  timestamp: number;
  speakerId?: string;
}

export interface VideoEmotionInput {
  videoFrame: ImageData;
  timestamp: number;
  faceDetection?: boolean;
}

export interface MultimodalInput {
  text?: TextEmotionInput;
  voice?: VoiceEmotionInput;
  video?: VideoEmotionInput;
}

/** Typed container that pairs a result with its modality so weights are
 *  applied correctly regardless of which channels are present. */
interface ModalityResult {
  modality: 'text' | 'voice' | 'video';
  data: EmotionalProfile;
}

class EmotionDetectionService {
  private textEmotionAPI: TextEmotionAnalyzer;
  private voiceEmotionAPI: VoiceEmotionAnalyzer;
  private videoEmotionAPI: VideoEmotionAnalyzer;
  private multimodalPipeline: MultimodalOrchestrator;

  constructor() {
    this.textEmotionAPI = new TextEmotionAnalyzer();
    this.voiceEmotionAPI = new VoiceEmotionAnalyzer();
    this.videoEmotionAPI = new VideoEmotionAnalyzer();
    this.multimodalPipeline = new MultimodalOrchestrator();
  }

  /**
   * Main entry point for emotion analysis
   * Location: analyzeUserInput() entry point
   */
  public async analyzeUserInput(input: MultimodalInput): Promise<EmotionalProfile> {
    const results: ModalityResult[] = [];

    // Process each available channel — tag each result with its modality so
    // weights are applied correctly regardless of which channels are present.
    if (input.text) {
      const textEmotions = await this.processTextChannel(input.text);
      results.push({ modality: 'text', data: textEmotions });
    }

    if (input.voice) {
      const voiceEmotions = await this.processVoiceChannel(input.voice);
      results.push({ modality: 'voice', data: voiceEmotions });
    }

    if (input.video) {
      const videoEmotions = await this.processVideoChannel(input.video);
      results.push({ modality: 'video', data: videoEmotions });
    }

    // Synthesize unified emotional profile
    return this.synthesizeEmotionalProfile(results);
  }

  /**
   * Process text channel for emotion detection
   * Location: processTextChannel()
   */
  private async processTextChannel(input: TextEmotionInput): Promise<EmotionalProfile> {
    // Location: 2a - Analyze Text Emotions
    return await this.textEmotionAPI.analyze(input.text, input.context);
  }

  /**
   * Process voice channel for emotion detection
   * Location: processVoiceChannel()
   */
  private async processVoiceChannel(input: VoiceEmotionInput): Promise<EmotionalProfile> {
    // Location: 2b - Process Vocal Cues
    return await this.voiceEmotionAPI.process(input.audioBlob, input.duration);
  }

  /**
   * Process video channel for emotion detection
   * Location: processVideoChannel()
   */
  private async processVideoChannel(input: VideoEmotionInput): Promise<EmotionalProfile> {
    // Location: 2c - Detect Facial Expressions
    return await this.videoEmotionAPI.detect(input.videoFrame, input.faceDetection);
  }

  /**
   * Synthesize multimodal emotional profile
   * Location: synthesizeEmotionalProfile()
   */
  private async synthesizeEmotionalProfile(results: ModalityResult[]): Promise<EmotionalProfile> {
    // Location: 2d - Combine multimodal data
    return this.multimodalPipeline.coordinateDetectionChannels(results);
  }
}

// Text Emotion Analysis Implementation
class TextEmotionAnalyzer {
  private emotionKeywords: Map<string, Partial<EmotionalProfile>> = new Map([
    ['happy', { joy: 0.8, valence: 0.7 }],
    ['sad', { sadness: 0.8, valence: -0.7 }],
    ['angry', { anger: 0.8, valence: -0.6, arousal: 0.7 }],
    ['fear', { fear: 0.8, arousal: 0.6, valence: -0.5 }],
    ['excited', { joy: 0.7, arousal: 0.8, valence: 0.6 }],
    ['frustrated', { anger: 0.6, disgust: 0.4, valence: -0.4 }],
    ['surprised', { surprise: 0.8, arousal: 0.5 }],
    ['love', { joy: 0.7, trust: 0.8, valence: 0.8 }],
    ['trust', { trust: 0.8, valence: 0.6 }],
    ['disgusted', { disgust: 0.8, valence: -0.7 }],
  ]);

  public async analyze(text: string, context?: string): Promise<EmotionalProfile> {
    const profile: EmotionalProfile = {
      joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0,
      surprise: 0, contempt: 0, trust: 0, anticipation: 0,
      valence: 0, arousal: 0, dominance: 0, confidence: 0
    };

    // Analyze text for emotional keywords
    const words = text.toLowerCase().split(/\s+/);
    let emotionCount = 0;

    for (const word of words) {
      const emotions = this.emotionKeywords.get(word);
      if (emotions) {
        Object.entries(emotions).forEach(([emotion, value]) => {
          profile[emotion as keyof EmotionalProfile] += value;
        });
        emotionCount++;
      }
    }

    // Normalize scores
    if (emotionCount > 0) {
      Object.keys(profile).forEach(emotion => {
        profile[emotion as keyof EmotionalProfile] /= emotionCount;
      });
    }

    // Calculate valence, arousal, dominance based on emotion mix
    profile.valence = (profile.joy + profile.trust - profile.sadness - profile.anger - profile.fear - profile.disgust) / 6;
    profile.arousal = (profile.anger + profile.fear + profile.surprise + profile.joy) / 4;
    profile.dominance = (profile.anger + profile.joy + profile.trust - profile.fear - profile.sadness) / 5;
    profile.confidence = Math.min(emotionCount / 10, 1);

    return profile;
  }
}

// Voice Emotion Analysis Implementation
class VoiceEmotionAnalyzer {
  public async process(audioBlob: Blob, duration: number): Promise<EmotionalProfile> {
    // Simulate voice emotion analysis
    // In real implementation, this would analyze pitch, tempo, volume, tonal changes
    const profile: EmotionalProfile = {
      joy: 0.3, sadness: 0.1, anger: 0.1, fear: 0.1, disgust: 0.05,
      surprise: 0.2, contempt: 0.05, trust: 0.4, anticipation: 0.2,
      valence: 0.2, arousal: 0.4, dominance: 0.3, confidence: 0.7
    };

    // Simulate analysis based on audio characteristics
    // Higher pitch might indicate excitement or fear
    // Faster tempo might indicate arousal
    // Louder volume might indicate confidence or anger

    return profile;
  }
}

// Video Emotion Analysis Implementation
class VideoEmotionAnalyzer {
  public async detect(frame: ImageData, faceDetection: boolean = true): Promise<EmotionalProfile> {
    // Simulate facial expression detection
    // In real implementation, this would use computer vision to detect:
    // - Micro-expressions
    // - Facial action units (AU)
    // - Eye gaze and pupil dilation
    // - Head pose and movements

    const profile: EmotionalProfile = {
      joy: 0.4, sadness: 0.1, anger: 0.05, fear: 0.1, disgust: 0.05,
      surprise: 0.3, contempt: 0.05, trust: 0.3, anticipation: 0.2,
      valence: 0.3, arousal: 0.3, dominance: 0.4, confidence: 0.8
    };

    return profile;
  }
}

// Multimodal Orchestrator
class MultimodalOrchestrator {
  /**
   * Coordinate detection channels and synthesize results
   * Location: multimodalPipeline orchestrator
   */
  public coordinateDetectionChannels(results: ModalityResult[]): EmotionalProfile {
    const synthesized: EmotionalProfile = {
      joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0,
      surprise: 0, contempt: 0, trust: 0, anticipation: 0,
      valence: 0, arousal: 0, dominance: 0, confidence: 0
    };

    if (results.length === 0) return synthesized;

    // Weight different modalities — each result is tagged with its modality
    // so weights are applied correctly even when not all channels are present.
    const weights: Record<ModalityResult['modality'], number> = {
      text: 0.4,
      voice: 0.3,
      video: 0.3,
    };

    let totalWeight = 0;
    results.forEach(({ modality, data }) => {
      const modalityWeight = weights[modality];

      Object.entries(data).forEach(([emotion, value]) => {
        synthesized[emotion as keyof EmotionalProfile] += (value || 0) * modalityWeight;
      });
      totalWeight += modalityWeight;
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      Object.keys(synthesized).forEach(emotion => {
        synthesized[emotion as keyof EmotionalProfile] /= totalWeight;
      });
    }

    // Calculate overall confidence based on consistency across modalities
    synthesized.confidence = this.calculateConsistency(results);

    return synthesized;
  }

  private calculateConsistency(results: ModalityResult[]): number {
    if (results.length < 2) return 0.7;

    // Calculate variance across modalities for each emotion
    let totalVariance = 0;
    const emotions: (keyof EmotionalProfile)[] = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'trust'];

    emotions.forEach(emotion => {
      const values = results.map(r => r.data[emotion] || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      totalVariance += variance;
    });

    // Convert variance to consistency score (lower variance = higher consistency)
    const maxVariance = 0.25; // Maximum possible variance for values in [0,1]
    const consistency = Math.max(0, 1 - (totalVariance / emotions.length) / maxVariance);

    return consistency;
  }
}

export const emotionDetectionService = new EmotionDetectionService();
// Note: types are already exported via their `export interface` declarations above.
// The redundant `export type { }` re-export has been removed to fix TS2300 conflicts.
