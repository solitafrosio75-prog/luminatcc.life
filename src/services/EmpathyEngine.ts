/**
 * EmpathyEngine — Creates emotionally intelligent responses.
 *
 * Generates responses that acknowledge and validate user feelings.
 * Implements empathetic communication strategies based on psychological research
 * and integrates Claude (Anthropic) for advanced empathy simulation via a secure
 * backend proxy.
 *
 * Architecture note:
 *   All calls to the Anthropic API are routed through /api/empathy (a server-side
 *   proxy) so the API key is NEVER included in the browser bundle.
 */

import { EmotionalProfile } from './EmotionDetectionService';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface EmpatheticResponse {
  message: string;
  validationType: 'acknowledgment' | 'validation' | 'support' | 'encouragement';
  emotionalTone: 'warm' | 'supportive' | 'understanding' | 'encouraging';
  /** Milliseconds delay for optimal emotional impact. */
  timing: number;
  confidence: number;
}

export interface ValidationStrategy {
  name: string;
  applicableEmotions: string[];
  responseTemplates: string[];
  timingDelay: { min: number; max: number };
}

export interface EmotionalContext {
  currentEmotion: string;
  intensity: number;
  valence: number;
  previousEmotions: string[];
  conversationHistory: string[];
  userPreferences: {
    communicationStyle: 'direct' | 'gentle' | 'enthusiastic';
    validationLevel: 'minimal' | 'moderate' | 'high';
  };
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface EmotionalState {
  primaryEmotion: string;
  intensity: number;
  valence: number;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Backend proxy endpoint — see vite.config.ts (dev) and api/empathy.ts (prod). */
const EMPATHY_API_ENDPOINT = '/api/empathy';

/** Claude model identifier. Update here when a new model version is released. */
const CLAUDE_MODEL = 'claude-3-5-haiku-20241022';

/** Maximum number of empathetic responses retained in the in-memory history. */
const MAX_RESPONSE_HISTORY = 50;

/** Maximum characters to include from user input in the AI prompt. */
const MAX_PROMPT_USER_INPUT_LENGTH = 500;

// ---------------------------------------------------------------------------
// EmpathyEngine class
// ---------------------------------------------------------------------------

class EmpathyEngine {
  private readonly validationStrategies: Map<string, ValidationStrategy>;
  private responseHistory: EmpatheticResponse[] = [];

  constructor() {
    this.validationStrategies = this.buildValidationStrategies();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Main entry point for generating empathetic responses.
   *
   * Flow:
   *   3a — Derive current emotional state from the profile
   *   3b — Select appropriate validation strategy
   *   3c — Generate validating message (AI-enhanced or rule-based)
   *   3d — Apply emotional timing
   */
  public async generateResponse(
    userInput: string,
    emotionalProfile: EmotionalProfile,
    context: EmotionalContext,
  ): Promise<EmpatheticResponse> {
    // 3a — Get Current Emotional State
    const currentEmotionalState = this.getCurrentEmotionalState(emotionalProfile);

    // 3b — Select Validation Strategy
    const strategy = this.selectValidationStrategy(currentEmotionalState, context);

    // 3c — Generate Validating Response with AI Enhancement
    const response = await this.generateValidatingResponse(
      userInput,
      strategy,
      currentEmotionalState,
      context,
    );

    // 3d — Deliver with Emotional Timing
    return this.deliverWithEmotionalTiming(response, currentEmotionalState);
  }

  /** Returns an immutable snapshot of the response history. */
  public getResponseHistory(): ReadonlyArray<Readonly<EmpatheticResponse>> {
    // Shallow-copy each object so callers cannot mutate internal state.
    return this.responseHistory.map((r) => ({ ...r }));
  }

  /** Adds a response to history, keeping at most MAX_RESPONSE_HISTORY entries. */
  public addToHistory(response: EmpatheticResponse): void {
    this.responseHistory.push(response);

    if (this.responseHistory.length > MAX_RESPONSE_HISTORY) {
      this.responseHistory = this.responseHistory.slice(-MAX_RESPONSE_HISTORY);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3a — Derive emotional state (synchronous — no I/O needed)
  // -------------------------------------------------------------------------

  private getCurrentEmotionalState(emotionalProfile: EmotionalProfile): EmotionalState {
    const NON_EMOTION_KEYS = new Set(['valence', 'arousal', 'dominance', 'confidence']);

    const emotions = (Object.entries(emotionalProfile) as Array<[string, number]>)
      .filter(([key]) => !NON_EMOTION_KEYS.has(key))
      .sort(([, a], [, b]) => b - a);

    return {
      primaryEmotion: emotions[0]?.[0] ?? 'neutral',
      intensity: emotions[0]?.[1] ?? 0,
      valence: emotionalProfile.valence,
      confidence: emotionalProfile.confidence,
    };
  }

  // -------------------------------------------------------------------------
  // Step 3b — Select validation strategy
  // -------------------------------------------------------------------------

  private selectValidationStrategy(
    emotionalState: EmotionalState,
    _context: EmotionalContext,
  ): ValidationStrategy {
    const { intensity, valence } = emotionalState;

    // High-intensity negative emotions need stronger validation
    if (intensity > 0.7 && valence < -0.3) {
      return this.getStrategy('strong_validation');
    }

    // Mild negative emotions get gentle acknowledgment
    if (valence < 0 && intensity <= 0.7) {
      return this.getStrategy('gentle_acknowledgment');
    }

    // Positive emotions get encouragement
    if (valence > 0.3) {
      return this.getStrategy('positive_encouragement');
    }

    // Neutral / ambiguous emotions get supportive engagement
    return this.getStrategy('supportive_engagement');
  }

  // -------------------------------------------------------------------------
  // Step 3c — Generate validating response
  // -------------------------------------------------------------------------

  private async generateValidatingResponse(
    userInput: string,
    strategy: ValidationStrategy,
    emotionalState: EmotionalState,
    context: EmotionalContext,
  ): Promise<Omit<EmpatheticResponse, 'timing'>> {
    // Try AI-enhanced empathy first
    const aiMessage = await this.requestEmpathyFromProxy(userInput, emotionalState, context);

    if (aiMessage !== null) {
      return {
        message: aiMessage,
        validationType: this.getValidationType(strategy),
        emotionalTone: this.getEmotionalTone(emotionalState),
        // AI responses get slightly higher confidence
        confidence: Math.min(emotionalState.intensity + 0.5, 1),
      };
    }

    // Fallback: rule-based approach
    const acknowledgment = this.createAcknowledgment(emotionalState);
    const validation = this.validateFeelings(emotionalState, strategy);
    const message = this.craftEmpatheticMessage(acknowledgment, validation, userInput);

    return {
      message,
      validationType: this.getValidationType(strategy),
      emotionalTone: this.getEmotionalTone(emotionalState),
      confidence: Math.min(emotionalState.intensity + 0.3, 1),
    };
  }

  // -------------------------------------------------------------------------
  // Step 3d — Apply emotional timing
  // -------------------------------------------------------------------------

  private deliverWithEmotionalTiming(
    response: Omit<EmpatheticResponse, 'timing'>,
    emotionalState: EmotionalState,
  ): EmpatheticResponse {
    return {
      ...response,
      timing: this.calculateOptimalTiming(emotionalState),
    };
  }

  // -------------------------------------------------------------------------
  // AI proxy call — routes through the server-side proxy
  // -------------------------------------------------------------------------

  /**
   * Requests an empathetic response from Claude via the /api/empathy proxy.
   *
   * Security: the actual Anthropic API key lives on the server; the browser only
   * ever talks to /api/empathy.  See vite.config.ts and api/empathy.ts.
   *
   * Prompt injection mitigation: userInput is stripped of angle-brackets and
   * truncated, then wrapped in delimited XML-like tags so the model can
   * distinguish user content from system instructions.
   *
   * Returns `null` on any error so callers can fall back gracefully.
   */
  private async requestEmpathyFromProxy(
    userInput: string,
    emotionalState: EmotionalState,
    context: EmotionalContext,
  ): Promise<string | null> {
    try {
      // Sanitize user input before embedding it in the structured prompt.
      // Removed characters:
      //   <>   — XML/HTML tag injection into the <patient_input> delimiter
      //   \n\r — newline injection that could forge additional prompt sections
      // Consecutive whitespace is collapsed and the result is trimmed so the
      // prompt structure remains intact even after sanitization.
      const sanitizedInput = userInput
        .replace(/[<>\n\r]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, MAX_PROMPT_USER_INPUT_LENGTH);

      const recentHistory = context.conversationHistory.slice(-3).join(' | ');

      const prompt =
        `Como terapeuta empático en terapia cognitivo-conductual, ` +
        `responde a la siguiente entrada del usuario:\n` +
        `<patient_input>${sanitizedInput}</patient_input>\n\n` +
        `Contexto emocional: ${emotionalState.primaryEmotion}.\n` +
        `Valida los sentimientos del usuario, fomenta la reciprocidad ` +
        `y promueve vínculos seguros basados en la Teoría del Apego.\n\n` +
        `Historial de conversación reciente: ${recentHistory}\n\n` +
        `Responde de manera empática, profesional y terapéutica. ` +
        `Mantén la respuesta concisa pero significativa.`;

      const response = await fetch(EMPATHY_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error(
          `[EmpathyEngine] Proxy returned ${response.status} ${response.statusText} — falling back`,
        );
        return null;
      }

      const data: unknown = await response.json();

      // Validate the response shape before accessing nested properties
      const content =
        data != null &&
        typeof data === 'object' &&
        'choices' in data &&
        Array.isArray((data as { choices: unknown[] }).choices) &&
        (data as { choices: unknown[] }).choices.length > 0
          ? (
              (data as { choices: Array<{ message?: { content?: unknown } }> })
                .choices[0]?.message?.content
            )
          : undefined;

      if (typeof content !== 'string' || content.trim() === '') {
        console.warn('[EmpathyEngine] Unexpected response shape from proxy:', data);
        return null;
      }

      return content;
    } catch (error) {
      console.error('[EmpathyEngine] Error calling empathy proxy:', error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Rule-based response helpers
  // -------------------------------------------------------------------------

  private createAcknowledgment(emotionalState: EmotionalState): string {
    const { primaryEmotion } = emotionalState;

    const acknowledgments: Record<string, string[]> = {
      joy: [
        "I can see you're feeling happy about this!",
        "That sounds wonderful!",
        "I love that you're feeling joyful!",
      ],
      sadness: [
        "I can see this is difficult for you.",
        "I understand this is bringing up sadness.",
        "I'm here with you in this difficult moment.",
      ],
      anger: [
        "I can see you're feeling frustrated.",
        "I understand why you'd feel angry about this.",
        "Your frustration makes complete sense.",
      ],
      fear: [
        "I can see this feels scary.",
        "I understand this feels overwhelming.",
        "It's okay to feel afraid in this situation.",
      ],
      surprise: [
        "Wow, that sounds surprising!",
        "I can see that caught you off guard.",
        "That must have been unexpected!",
      ],
      trust: [
        "I appreciate you sharing this with me.",
        "I'm glad you feel comfortable opening up.",
        "Thank you for trusting me with this.",
      ],
    };

    const candidates = acknowledgments[primaryEmotion] ?? acknowledgments['trust'];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private validateFeelings(
    emotionalState: EmotionalState,
    strategy: ValidationStrategy,
  ): string {
    const template =
      strategy.responseTemplates[
        Math.floor(Math.random() * strategy.responseTemplates.length)
      ];

    return template
      .replace('{emotion}', emotionalState.primaryEmotion)
      .replace('{intensity}', this.getIntensityDescriptor(emotionalState.intensity));
  }

  private craftEmpatheticMessage(
    acknowledgment: string,
    validation: string,
    userInput: string,
  ): string {
    return `${acknowledgment} ${validation} ${this.generateSupportiveFollowUp(userInput)}`;
  }

  private generateSupportiveFollowUp(_userInput: string): string {
    const followUps = [
      'How can I help you work through this?',
      'What would be most helpful right now?',
      "I'm here to support you through this.",
      "Let's figure this out together.",
      'What do you need from me in this moment?',
    ];

    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  // -------------------------------------------------------------------------
  // Tone / type helpers
  // -------------------------------------------------------------------------

  private getValidationType(strategy: ValidationStrategy): EmpatheticResponse['validationType'] {
    const typeMap: Record<string, EmpatheticResponse['validationType']> = {
      strong_validation: 'validation',
      gentle_acknowledgment: 'acknowledgment',
      positive_encouragement: 'encouragement',
      supportive_engagement: 'support',
    };

    return typeMap[strategy.name] ?? 'support';
  }

  private getEmotionalTone(
    emotionalState: Pick<EmotionalState, 'valence'>,
  ): EmpatheticResponse['emotionalTone'] {
    if (emotionalState.valence > 0.3) return 'encouraging';
    if (emotionalState.valence < -0.3) return 'supportive';
    return 'understanding';
  }

  private calculateOptimalTiming(
    emotionalState: Pick<EmotionalState, 'primaryEmotion' | 'intensity'>,
  ): number {
    const BASE_DELAY_MS = 800;

    // Higher intensity → slightly longer pause before responding
    const intensityMultiplier = 1 + emotionalState.intensity * 0.5;

    const emotionMultipliers: Record<string, number> = {
      sadness: 1.2, // More space for sad emotions
      anger: 0.8,   // Respond faster to anger
      fear: 1.1,    // Slightly more time for fear
      joy: 0.9,     // Quick response to positive emotions
      surprise: 0.7, // Quick response to surprises
    };

    const emotionMultiplier = emotionMultipliers[emotionalState.primaryEmotion] ?? 1;

    return Math.round(BASE_DELAY_MS * intensityMultiplier * emotionMultiplier);
  }

  private getIntensityDescriptor(intensity: number): string {
    if (intensity > 0.8) return 'very strong';
    if (intensity > 0.6) return 'strong';
    if (intensity > 0.4) return 'moderate';
    if (intensity > 0.2) return 'mild';
    return 'slight';
  }

  // -------------------------------------------------------------------------
  // Safe Map accessor — avoids non-null assertion crashes
  // -------------------------------------------------------------------------

  /**
   * Returns the named strategy or the `supportive_engagement` fallback.
   * Logs an error if the requested key is missing so it is immediately
   * visible during development.
   */
  private getStrategy(name: string): ValidationStrategy {
    const strategy = this.validationStrategies.get(name);
    if (strategy === undefined) {
      console.error(
        `[EmpathyEngine] Validation strategy '${name}' not found — using fallback.`,
      );
      return (
        this.validationStrategies.get('supportive_engagement') ??
        this.createDefaultStrategy()
      );
    }
    return strategy;
  }

  /** Emergency fallback strategy when the Map is empty. */
  private createDefaultStrategy(): ValidationStrategy {
    return {
      name: 'supportive_engagement',
      applicableEmotions: ['neutral'],
      responseTemplates: ["I'm here to listen and support you."],
      timingDelay: { min: 500, max: 900 },
    };
  }

  // -------------------------------------------------------------------------
  // Strategy initialisation
  // -------------------------------------------------------------------------

  private buildValidationStrategies(): Map<string, ValidationStrategy> {
    return new Map<string, ValidationStrategy>([
      [
        'strong_validation',
        {
          name: 'strong_validation',
          applicableEmotions: ['sadness', 'anger', 'fear'],
          responseTemplates: [
            'Your {emotion} is completely valid and understandable.',
            "It makes perfect sense that you're feeling {intensity} {emotion}.",
            'Anyone in your situation would feel {emotion} too.',
          ],
          timingDelay: { min: 1000, max: 1500 },
        },
      ],
      [
        'gentle_acknowledgment',
        {
          name: 'gentle_acknowledgment',
          applicableEmotions: ['sadness', 'fear', 'surprise'],
          responseTemplates: [
            "I notice you're feeling some {emotion}.",
            "I can sense a bit of {emotion} in what you're sharing.",
            "It sounds like there's some {emotion} coming up for you.",
          ],
          timingDelay: { min: 600, max: 1000 },
        },
      ],
      [
        'positive_encouragement',
        {
          name: 'positive_encouragement',
          applicableEmotions: ['joy', 'trust', 'anticipation'],
          responseTemplates: [
            "It's wonderful to see you feeling {emotion}!",
            'Your {emotion} is beautiful to witness.',
            "I love that you're experiencing {emotion} right now.",
          ],
          timingDelay: { min: 400, max: 800 },
        },
      ],
      [
        'supportive_engagement',
        {
          name: 'supportive_engagement',
          applicableEmotions: ['neutral', 'anticipation', 'trust'],
          responseTemplates: [
            "I'm here with you as you process this.",
            "Thank you for sharing what's on your mind.",
            "I'm here to listen and support you.",
          ],
          timingDelay: { min: 500, max: 900 },
        },
      ],
    ]);
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const empathyEngine = new EmpathyEngine();
