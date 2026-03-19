/**
 * FirstImpressionService - Optimizes initial user encounters within the critical 50ms window
 * Based on Lindgaard et al. (2006) research on first impression formation
 * Implements Norman's visceral level of emotional design
 */

export interface FirstImpressionMetrics {
  loadTime: number;
  visualAppealScore: number;
  cognitiveFluencyScore: number;
  trustworthinessScore: number;
  overallImpression: number;
}

export interface VisualAsset {
  id: string;
  url: string;
  type: 'image' | 'icon' | 'animation';
  priority: 'critical' | 'important' | 'secondary';
  preload: boolean;
}

export interface CognitiveFluencyConfig {
  cleanDesignPatterns: boolean;
  legibleTypography: boolean;
  wellContrastedColors: boolean;
  intuitiveLayout: boolean;
}

class FirstImpressionService {
  private startTime: number = 0;
  private criticalWindow: number = 50; // milliseconds
  private visualAssets: Map<string, VisualAsset> = new Map();
  private metrics: FirstImpressionMetrics;

  constructor() {
    this.metrics = {
      loadTime: 0,
      visualAppealScore: 0,
      cognitiveFluencyScore: 0,
      trustworthinessScore: 0,
      overallImpression: 0
    };
  }

  /**
   * Start the impression timer - captures initial encounter timestamp
   * Location: 1a
   */
  public startImpressionTimer(): void {
    this.startTime = performance.now();
    console.log('First impression timer started - 50ms window begins');
  }

  /**
   * Load visual assets for immediate visual appeal
   * Location: 1b
   */
  public async preloadVisualAssets(assets: VisualAsset[]): Promise<void> {
    const criticalAssets = assets.filter(asset => asset.preload && asset.priority === 'critical');
    
    const preloadPromises = criticalAssets.map(asset => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.visualAssets.set(asset.id, asset);
          resolve();
        };
        // Always resolve on error so Promise.all never hangs if an asset is
        // unavailable (e.g. 404 during development or first deploy).
        img.onerror = () => {
          console.warn(`[FirstImpressionService] Failed to preload asset: ${asset.url}`);
          resolve();
        };
        img.src = asset.url;
      });
    });

    await Promise.all(preloadPromises);
    console.log(`Preloaded ${criticalAssets.length} critical visual assets`);
  }

  /**
   * Apply cognitive fluency principles to enhance perceived trustworthiness
   * Location: 1c
   */
  public optimizeCognitiveFluency(config: CognitiveFluencyConfig): void {
    let fluencyScore = 0;
    
    if (config.cleanDesignPatterns) fluencyScore += 25;
    if (config.legibleTypography) fluencyScore += 25;
    if (config.wellContrastedColors) fluencyScore += 25;
    if (config.intuitiveLayout) fluencyScore += 25;

    this.metrics.cognitiveFluencyScore = fluencyScore;
    
    // Apply fluency enhancements to DOM
    this.applyFluencyEnhancements(config);
    
    console.log(`Cognitive fluency optimized: ${fluencyScore}/100`);
  }

  /**
   * Trigger visceral response at Norman's visceral level
   * Location: 1d
   */
  public triggerVisceralResponse(): void {
    const currentTime = performance.now();
    const elapsedTime = currentTime - this.startTime;
    
    // Calculate scores based on performance and design
    this.metrics.loadTime = elapsedTime;
    this.metrics.visualAppealScore = this.calculateVisualAppealScore();
    this.metrics.trustworthinessScore = this.calculateTrustworthinessScore();
    this.metrics.overallImpression = this.calculateOverallImpression();

    // Activate emotional processing
    this.activateEmotionalProcessing();
    
    console.log(`First impression complete in ${elapsedTime}ms`);
    console.log('Visceral response triggered at Norman\'s visceral level');
  }

  private applyFluencyEnhancements(config: CognitiveFluencyConfig): void {
    const root = document.documentElement;
    
    if (config.legibleTypography) {
      root.style.setProperty('--font-size-base', '16px');
      root.style.setProperty('--line-height-base', '1.5');
    }
    
    if (config.wellContrastedColors) {
      root.style.setProperty('--contrast-ratio', '4.5');
    }
  }

  private calculateVisualAppealScore(): number {
    // Based on visual asset loading and aesthetic principles
    const assetScore = Math.min(this.visualAssets.size * 10, 50);
    const timeScore = Math.max(0, 50 - this.metrics.loadTime) / 50 * 50;
    return Math.round(assetScore + timeScore);
  }

  private calculateTrustworthinessScore(): number {
    // Based on cognitive fluency and performance
    const fluencyWeight = 0.6;
    const performanceWeight = 0.4;
    
    return Math.round(
      this.metrics.cognitiveFluencyScore * fluencyWeight +
      Math.max(0, 100 - this.metrics.loadTime) * performanceWeight
    );
  }

  private calculateOverallImpression(): number {
    return Math.round(
      (this.metrics.visualAppealScore * 0.3 +
       this.metrics.cognitiveFluencyScore * 0.3 +
       this.metrics.trustworthinessScore * 0.4)
    );
  }

  private activateEmotionalProcessing(): void {
    // Simulate visceral emotional response
    const body = document.body;
    body.classList.add('visceral-processing');
    
    // Add subtle micro-interaction to indicate processing
    setTimeout(() => {
      body.classList.remove('visceral-processing');
      body.classList.add('visceral-complete');
    }, 100);
  }

  /**
   * Get current first impression metrics
   */
  public getMetrics(): FirstImpressionMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if still within critical 50ms window
   */
  public isInCriticalWindow(): boolean {
    const elapsed = performance.now() - this.startTime;
    return elapsed < this.criticalWindow;
  }
}

export const firstImpressionService = new FirstImpressionService();
