/**
 * MultimodalEvaluationService - Sistema de evaluación multimodal para TCC
 * Implementa el proceso completo desde primera sesión hasta formulación de caso
 * Basado en el protocolo estructurado terapeuta-paciente
 */

import { EmotionalProfile } from './EmotionDetectionService';

export interface SessionData {
  sessionId: string;
  date: Date;
  phase: 'intake' | 'assessment' | 'psychoeducation' | 'goals' | 'intervention' | 'evaluation' | 'followup';
  duration: number;
  modalities: ('text' | 'voice' | 'video' | 'behavioral')[];
  emotionalProfile?: EmotionalProfile;
  behavioralData?: BehavioralData;
}

export interface BehavioralData {
  frequency: number; // veces por semana
  duration: number; // duración en minutos
  intensity: number; // escala 1-10
  context: string; // situación específica
  avoidanceLevel: number; // nivel de evitación 0-10
}

export interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  modalities: ('text' | 'voice' | 'video' | 'behavioral')[];
  inventory?: 'BDI' | 'BAI' | 'custom';
  scores: number[];
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
}

export interface CaseFormulation {
  // Componentes del modelo E-O-R-K-C
  antecedents: Antecedent[];
  behaviors: ProblemBehavior[];
  consequences: Consequence[];
  maintainingFactors: MaintainingFactor[];
  secondaryGains: SecondaryGain[];
  
  // Metas terapéuticas SMART
  goals: TherapeuticGoal[];
  
  // Estrategias seleccionadas
  strategies: InterventionStrategy[];
  
  // Recursos identificados
  resources: Resource[];
}

export interface Antecedent {
  id: string;
  description: string;
  frequency: 'siempre' | 'frecuentemente' | 'a_veces' | 'rara_vez' | 'nunca';
  triggers: string[];
}

export interface ProblemBehavior {
  id: string;
  description: string;
  category: 'cognitivo' | 'emocional' | 'conductual' | 'fisiologico';
  intensity: number; // 1-10
  duration: number; // minutos
}

export interface Consequence {
  id: string;
  description: string;
  type: 'positivo' | 'negativo' | 'neutro';
  immediacy: 'inmediato' | 'corto_plazo' | 'largo_plazo';
  impact: number; // 1-10
}

export interface MaintainingFactor {
  id: string;
  description: string;
  category: 'cognitivo' | 'emocional' | 'social' | 'biologico' | 'conductual';
  strength: number; // 1-10
}

export interface SecondaryGain {
  id: string;
  description: string;
  type: 'atencion' | 'evitacion' | 'control' | 'seguridad';
  significance: number; // 1-10
}

export interface TherapeuticGoal {
  id: string;
  description: string;
  category: 'conductual' | 'cognitivo' | 'emocional' | 'social';
  goalTarget: string; // qué se quiere lograr
  measurement: string; // cómo se medirá
  achievable: boolean;
  relevant: boolean;
  timeBound: Date;
  baseline: number;
  targetValue: number;
  progress: number; // 0-100
}

export interface InterventionStrategy {
  id: string;
  name: string;
  type: 'cognitivo' | 'conductual' | 'emocional' | 'social';
  description: string;
  rationale: string;
  implementation: string[];
  expectedOutcome: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'interno' | 'externo' | 'social' | 'profesional';
  availability: 'disponible' | 'limitado' | 'no_disponible';
  utilization: number; // porcentaje
}

export interface EvaluationMetrics {
  clinicalSignificance: number; // cambio clínicamente significativo
  reliabilityIndex: number; // índice de fiabilidad
  validityIndex: number; // índice de validez
  progressRate: number; // tasa de progreso
  adherenceLevel: number; // nivel de adherencia
  therapeuticAlliance: number; // alianza terapéutica
}

class MultimodalEvaluationService {
  private sessions: Map<string, SessionData[]> = new Map();
  private assessmentCategories: AssessmentCategory[] = [];
  private caseFormulation: CaseFormulation | null = null;
  private evaluationMetrics: EvaluationMetrics | null = null;

  constructor() {
    this.initializeAssessmentCategories();
  }

  /**
   * Fase 1: Primera sesión - Establecer vínculo y recoger datos básicos
   */
  public async conductIntakeSession(
    userId: string,
    modalities: ('text' | 'voice' | 'video' | 'behavioral')[],
    sociodemographicData: any,
    chiefComplaint: string
  ): Promise<SessionData> {
    const session: SessionData = {
      sessionId: this.generateSessionId(),
      date: new Date(),
      phase: 'intake',
      duration: 0,
      modalities,
      behavioralData: {
        frequency: 0,
        duration: 0,
        intensity: 0,
        context: chiefComplaint,
        avoidanceLevel: 0
      }
    };

    this.addSession(userId, session);
    
    // Establecer vínculo terapéutico
    await this.establishTherapeuticAlliance(userId, modalities);
    
    // Introducir autorregistros como tarea
    await this.assignSelfMonitoringTasks(userId, chiefComplaint);
    
    return session;
  }

  /**
   * Fases 2-4: Sesiones de evaluación completas
   */
  public async conductAssessmentSessions(
    userId: string,
    sessionCount: number = 3
  ): Promise<SessionData[]> {
    const sessions: SessionData[] = [];
    
    for (let i = 0; i < sessionCount; i++) {
      const session: SessionData = {
        sessionId: this.generateSessionId(),
        date: new Date(),
        phase: 'assessment',
        duration: 0,
        modalities: ['text', 'voice', 'video', 'behavioral'],
        emotionalProfile: await this.assessEmotionalState(userId),
        behavioralData: await this.collectBehavioralData(userId)
      };
      
      sessions.push(session);
      this.addSession(userId, session);
      
      // Aplicar inventarios estandarizados según presentación
      await this.applyStandardizedInventories(userId, session);
    }
    
    return sessions;
  }

  /**
   * Fase 5: Construir formulación de caso completa
   */
  public async constructCaseFormulation(
    userId: string,
    assessmentData: SessionData[]
  ): Promise<CaseFormulation> {
    // Integrar datos de todas las sesiones de evaluación
    const integratedData = this.integrateAssessmentData(assessmentData);
    
    // Construir formulación usando modelo E-O-R-K-C
    const formulation: CaseFormulation = {
      antecedents: this.identifyAntecedents(integratedData),
      behaviors: this.identifyProblemBehaviors(integratedData),
      consequences: this.identifyConsequences(integratedData),
      maintainingFactors: this.identifyMaintainingFactors(integratedData),
      secondaryGains: this.identifySecondaryGains(integratedData),
      goals: this.defineTherapeuticGoalsFromData(integratedData),
      strategies: this.selectInterventionStrategies(integratedData),
      resources: this.identifyResources(integratedData)
    };
    
    this.caseFormulation = formulation;
    return formulation;
  }

  /**
   * Fase 6: Definir metas terapéuticas SMART
   */
  public async defineTherapeuticGoals(
    userId: string,
    formulation: CaseFormulation
  ): Promise<TherapeuticGoal[]> {
    const goals: TherapeuticGoal[] = [];
    
    // Asegurar que las metas sean SMART
    const goalCategories = ['conductual', 'cognitivo', 'emocional', 'social'];
    
    for (const category of goalCategories) {
      const categoryGoals = formulation.goals.filter(g => g.category === category);
      
      for (const goal of categoryGoals) {
        // Validar criterios SMART
        const validatedGoal = this.validateSMARTGoal(goal);
        goals.push(validatedGoal);
      }
    }
    
    return goals;
  }

  /**
   * Fase 7: Evaluación periódica y ajuste del plan
   */
  public async conductPeriodicEvaluation(
    userId: string,
    interventionData: SessionData[]
  ): Promise<EvaluationMetrics> {
    // Medir cambio clínicamente significativo
    const clinicalSignificance = this.calculateClinicalSignificance(interventionData);
    
    // Calcular índices de fiabilidad y validez
    const reliabilityIndex = this.calculateReliabilityIndex(interventionData);
    const validityIndex = this.calculateValidityIndex(interventionData);
    
    // Evaluar progreso y adherencia
    const progressRate = this.calculateProgressRate(interventionData);
    const adherenceLevel = this.calculateAdherenceLevel(interventionData);
    
    // Medir alianza terapéutica
    const therapeuticAlliance = await this.assessTherapeuticAlliance(userId);
    
    const metrics: EvaluationMetrics = {
      clinicalSignificance,
      reliabilityIndex,
      validityIndex,
      progressRate,
      adherenceLevel,
      therapeuticAlliance
    };
    
    this.evaluationMetrics = metrics;
    
    // Ajustar plan si los datos lo justifican
    if (clinicalSignificance < 0.5 || reliabilityIndex < 0.7) {
      await this.adjustTreatmentPlan(userId, metrics);
    }
    
    return metrics;
  }

  /**
   * Identificar obstáculos previsibles
   */
  public identifyPredictableObstacles(
    userId: string,
    goals: TherapeuticGoal[]
  ): {
    obstacles: string[];
    resources: Resource[];
    mitigationStrategies: string[];
  } {
    const obstacles: string[] = [];
    const resources: Resource[] = [];
    const mitigationStrategies: string[] = [];
    
    // Análisis de barreras comunes en TCC
    const commonObstacles = [
      {
        obstacle: 'Falta de adherencia a tareas',
        resource: 'Recordatorios digitales',
        strategy: 'Simplificar autorregistros'
      },
      {
        obstacle: 'Dificultad con reestructuración cognitiva',
        resource: 'Aplicación de ejemplos concretos',
        strategy: 'Práctica gradual con ejercicios simples'
      },
      {
        obstacle: 'Resistencia emocional a la exposición',
        resource: 'Técnicas de relajación y mindfulness',
        strategy: 'Exposición gradual con manejo de ansiedad'
      },
      {
        obstacle: 'Pensamientos automáticos persistentes',
        resource: 'Registro de pensamientos',
        strategy: 'Técnicas de detención de pensamientos'
      }
    ];
    
    for (const item of commonObstacles) {
      obstacles.push(item.obstacle);
      resources.push({
        id: this.generateId(),
        name: item.resource,
        type: 'interno',
        availability: 'disponible',
        utilization: 0
      });
      mitigationStrategies.push(item.strategy);
    }
    
    return {
      obstacles,
      resources,
      mitigationStrategies
    };
  }

  /**
   * Identificar recursos necesarios
   */
  public identifyRequiredResources(
    formulation: CaseFormulation,
    goals: TherapeuticGoal[]
  ): Resource[] {
    const resources: Resource[] = [];
    
    // Recursos basados en la formulación
    if (formulation.antecedents.some(a => a.triggers.includes('social'))) {
      resources.push({
        id: this.generateId(),
        name: 'Habilidades sociales',
        type: 'externo',
        availability: 'limitado',
        utilization: 0
      });
    }
    
    if (formulation.behaviors.some(b => b.category === 'emocional')) {
      resources.push({
        id: this.generateId(),
        name: 'Técnicas de regulación emocional',
        type: 'interno',
        availability: 'disponible',
        utilization: 0
      });
    }
    
    // Recursos basados en las metas
    for (const goal of goals) {
      const goalResources = this.mapGoalToResources(goal);
      resources.push(...goalResources);
    }
    
    return resources;
  }

  /**
   * Establecer sistema de revisión de progreso
   */
  public establishProgressReviewSystem(
    userId: string,
    goals: TherapeuticGoal[],
    reviewInterval: number = 7 // días
  ): {
    reviewSchedule: Date[];
    monitoringTools: string[];
    adjustmentCriteria: string[];
  } {
    const reviewSchedule: Date[] = [];
    const now = new Date();
    
    // Generar fechas de revisión para las próximas 12 semanas
    for (let i = 1; i <= 12; i++) {
      const reviewDate = new Date(now);
      reviewDate.setDate(now.getDate() + (i * reviewInterval));
      reviewSchedule.push(reviewDate);
    }
    
    const monitoringTools = [
      'Autorregistros diarios',
      'Escala de humor BDI-II',
      'Registro de pensamientos automáticos',
      'Escala de ansiedad BAI',
      'Registro de exposiciones',
      'Evaluación de adherencia semanal'
    ];
    
    const adjustmentCriteria = [
      'Cambio < 20% en síntomas principales',
      'Adherencia < 70% en tareas asignadas',
      'Dificultad persistente en reestructuración cognitiva',
      'Resistencia a exposiciones graduadas',
      'Aumento de conductas de evitación',
      'Deterioro en funcionamiento diario',
      'Solicitud explícita de ajuste del plan'
    ];
    
    return {
      reviewSchedule,
      monitoringTools,
      adjustmentCriteria
    };
  }

  // Métodos privados de implementación
  
  private initializeAssessmentCategories(): void {
    this.assessmentCategories = [
      {
        id: 'depressive_symptoms',
        name: 'Síntomas depresivos',
        description: 'Evaluación de síntomas principales de depresión',
        modalities: ['text', 'voice', 'behavioral'],
        inventory: 'BDI',
        scores: [],
        severity: 'moderate'
      },
      {
        id: 'anxiety_symptoms',
        name: 'Síntomas de ansiedad',
        description: 'Evaluación de síntomas de ansiedad',
        modalities: ['text', 'voice', 'behavioral'],
        inventory: 'BAI',
        scores: [],
        severity: 'moderate'
      },
      {
        id: 'behavioral_patterns',
        name: 'Patrones conductuales',
        description: 'Análisis de conductas problema y mantenimiento',
        modalities: ['behavioral', 'text'],
        inventory: 'custom',
        scores: [],
        severity: 'mild'
      },
      {
        id: 'cognitive_distortions',
        name: 'Distorsiones cognitivas',
        description: 'Identificación de errores de pensamiento',
        modalities: ['text', 'voice'],
        inventory: 'custom',
        scores: [],
        severity: 'moderate'
      }
    ];
  }

  private async establishTherapeuticAlliance(
    userId: string,
    modalities: ('text' | 'voice' | 'video' | 'behavioral')[]
  ): Promise<void> {
    // Implementar estrategias de establecimiento de vínculo
    const allianceStrategies = {
      text: 'Comunicación empática y validación emocional',
      voice: 'Tono de voz tranquilo y ritmo pausado',
      video: 'Lenguaje corporal abierto y contacto visual',
      behavioral: 'Refuerzo positivo y consistencia'
    };
    
    console.log(`Estableciendo alianza terapéutica para ${userId} usando modalidades: ${modalities.join(', ')}`);
  }

  private async assignSelfMonitoringTasks(
    userId: string,
    chiefComplaint: string
  ): Promise<void> {
    const tasks = [
      'Registro diario de frecuencia y duración',
      'Escala de intensidad 1-10',
      'Identificación de situaciones desencadenantes',
      'Registro de conductas de evitación',
      'Autoevaluación semanal del progreso'
    ];
    
    console.log(`Asignando tareas de automonitoreo para: ${chiefComplaint}`);
  }

  private async applyStandardizedInventories(
    userId: string,
    session: SessionData
  ): Promise<void> {
    const applicableInventories = this.getApplicableInventories(session);
    
    for (const inventory of applicableInventories) {
      console.log(`Aplicando inventario ${inventory} en sesión ${session.sessionId}`);
    }
  }

  private getApplicableInventories(session: SessionData): string[] {
    const inventories: string[] = [];
    
    if (session.modalities.includes('text') || session.modalities.includes('voice')) {
      inventories.push('BDI-II', 'BAI');
    }
    
    if (session.modalities.includes('behavioral')) {
      inventories.push('Registro conductual');
    }
    
    return inventories;
  }

  private async assessEmotionalState(userId: string): Promise<any> {
    // Evaluación multimodal del estado emocional
    return {
      depression: 0.6,
      anxiety: 0.5,
      anger: 0.2,
      fear: 0.3,
      sadness: 0.7,
      joy: 0.1,
      trust: 0.4
    };
  }

  private async collectBehavioralData(userId: string): Promise<BehavioralData> {
    return {
      frequency: 3, // 3 veces por semana
      duration: 45, // 45 minutos
      intensity: 6, // escala 1-10
      context: 'Situaciones sociales',
      avoidanceLevel: 7 // escala 0-10
    };
  }

  private integrateAssessmentData(sessions: SessionData[]): any {
    return {
      totalSessions: sessions.length,
      modalitiesUsed: this.getModalitiesFrequency(sessions),
      averageEmotionalProfile: this.calculateAverageEmotionalProfile(sessions),
      behavioralPatterns: this.extractBehavioralPatterns(sessions),
      assessmentScores: this.compileAssessmentScores(sessions)
    };
  }

  private identifyAntecedents(data: any): Antecedent[] {
    return [
      {
        id: this.generateId(),
        description: 'Interacciones sociales evaluativas',
        frequency: 'frecuentemente',
        triggers: ['crítica social', 'juicio de otros', 'comparación']
      },
      {
        id: this.generateId(),
        description: 'Pensamientos automáticos negativos',
        frequency: 'siempre',
        triggers: ['fracaso', 'rechazo', 'crítica']
      }
    ];
  }

  private identifyProblemBehaviors(data: any): ProblemBehavior[] {
    return [
      {
        id: this.generateId(),
        description: 'Evitación de situaciones sociales',
        category: 'conductual',
        intensity: 8,
        duration: 120
      },
      {
        id: this.generateId(),
        description: 'Rumiación cognitiva',
        category: 'cognitivo',
        intensity: 7,
        duration: 60
      }
    ];
  }

  private identifyConsequences(data: any): Consequence[] {
    return [
      {
        id: this.generateId(),
        description: 'Alivio inmediato de la ansiedad',
        type: 'negativo',
        immediacy: 'inmediato',
        impact: 8
      },
      {
        id: this.generateId(),
        description: 'Mantenimiento del problema a largo plazo',
        type: 'negativo',
        immediacy: 'largo_plazo',
        impact: 9
      }
    ];
  }

  private identifyMaintainingFactors(data: any): MaintainingFactor[] {
    return [
      {
        id: this.generateId(),
        description: 'Creencias centrales sobre incompetencia social',
        category: 'cognitivo',
        strength: 8
      },
      {
        id: this.generateId(),
        description: 'Miedo al juicio y rechazo',
        category: 'emocional',
        strength: 7
      },
      {
        id: this.generateId(),
        description: 'Aislamiento social progresivo',
        category: 'social',
        strength: 6
      }
    ];
  }

  private identifySecondaryGains(data: any): SecondaryGain[] {
    return [
      {
        id: this.generateId(),
        description: 'Evitar el malestar de la ansiedad social',
        type: 'evitacion',
        significance: 8
      },
      {
        id: this.generateId(),
        description: 'Mantener control sobre situaciones sociales',
        type: 'control',
        significance: 7
      }
    ];
  }

  private defineTherapeuticGoalsFromData(data: any): TherapeuticGoal[] {
    return [
      {
        id: this.generateId(),
        description: 'Reducir evitación de situaciones sociales a 1 vez por semana',
        category: 'conductual',
        goalTarget: 'Exposición gradual',
        measurement: 'Registro de frecuencia semanal',
        achievable: true,
        relevant: true,
        timeBound: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        baseline: 7,
        targetValue: 1,
        progress: 0
      },
      {
        id: this.generateId(),
        description: 'Challenge 3 pensamientos automáticos por día',
        category: 'cognitivo',
        goalTarget: 'Reestructuración cognitiva',
        measurement: 'Registro de pensamientos',
        achievable: true,
        relevant: true,
        timeBound: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        baseline: 0,
        targetValue: 3,
        progress: 0
      }
    ];
  }

  private selectInterventionStrategies(data: any): InterventionStrategy[] {
    return [
      {
        id: this.generateId(),
        name: 'Reestructuración cognitiva',
        type: 'cognitivo',
        description: 'Identificar y modificar distorsiones cognitivas',
        rationale: 'Los pensamientos automáticos mantienen el problema',
        implementation: [
          'Registro de pensamientos',
          'Identificación de distorsiones',
          'Generación de pensamientos alternativos',
          'Experimentación conductual'
        ],
        expectedOutcome: 'Reducción de síntomas depresivos y ansiosos'
      },
      {
        id: this.generateId(),
        name: 'Exposición gradual',
        type: 'conductual',
        description: 'Enfrentar situaciones temidas de forma jerárquica',
        rationale: 'La evitación mantiene el miedo por evitación de refutación',
        implementation: [
          'Jerarquía de miedos',
          'Exposición sistemática',
          'Prevención de recaídas',
          'Manejo de ansiedad durante exposición'
        ],
        expectedOutcome: 'Reducción de la evitación y ansiedad'
      }
    ];
  }

  private identifyResources(data: any): Resource[] {
    return [
      {
        id: this.generateId(),
        name: 'Habilidades de comunicación asertiva',
        type: 'interno',
        availability: 'disponible',
        utilization: 0
      },
      {
        id: this.generateId(),
        name: 'Red de apoyo social',
        type: 'social',
        availability: 'limitado',
        utilization: 0
      },
      {
        id: this.generateId(),
        name: 'Psicoterapia individual',
        type: 'profesional',
        availability: 'disponible',
        utilization: 100
      }
    ];
  }

  private calculateClinicalSignificance(sessions: SessionData[]): number {
    // Índice de cambio clínicamente significativo (Jacobson & Truax)
    // Cambio confiable > 1.96 SD en medidas de síntomas
    const baselineScores = sessions.slice(0, 3).map(s => s.behavioralData?.intensity || 0);
    const currentScores = sessions.slice(-3).map(s => s.behavioralData?.intensity || 0);
    
    const baselineMean = baselineScores.reduce((a, b) => a + b, 0) / baselineScores.length;
    const currentMean = currentScores.reduce((a, b) => a + b, 0) / currentScores.length;
    
    const baselineSD = Math.sqrt(
      baselineScores.reduce((sum, score) => sum + Math.pow(score - baselineMean, 2), 0) / baselineScores.length
    );
    
    const changeIndex = (currentMean - baselineMean) / baselineSD;
    return Math.max(0, Math.min(1, changeIndex / 1.96)); // Normalizado a 0-1
  }

  private calculateReliabilityIndex(sessions: SessionData[]): number {
    // Consistencia en medidas y adherencia a protocolos
    const consistencyScore = this.calculateConsistencyScore(sessions);
    const adherenceScore = this.calculateProtocolAdherence(sessions);
    
    return (consistencyScore + adherenceScore) / 2;
  }

  private calculateValidityIndex(sessions: SessionData[]): number {
    // Correspondencia entre formulación y resultados observados
    const formulationAccuracy = this.assessFormulationAccuracy(sessions);
    const outcomePrediction = this.assessOutcomePrediction(sessions);
    
    return (formulationAccuracy + outcomePrediction) / 2;
  }

  private calculateProgressRate(sessions: SessionData[]): number {
    if (sessions.length < 2) return 0;
    
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    
    const initialIntensity = firstSession.behavioralData?.intensity || 0;
    const finalIntensity = lastSession.behavioralData?.intensity || 0;
    
    return Math.max(0, (initialIntensity - finalIntensity) / initialIntensity);
  }

  private calculateAdherenceLevel(sessions: SessionData[]): number {
    // Porcentaje de sesiones completadas vs asignadas
    const completedSessions = sessions.filter(s => s.duration > 0).length;
    return completedSessions / sessions.length;
  }

  private async assessTherapeuticAlliance(userId: string): Promise<number> {
    // Escala de alianza terapéutica (WAI-S)
    return 0.75; // Simulación de buena alianza
  }

  private async adjustTreatmentPlan(
    userId: string,
    metrics: EvaluationMetrics
  ): Promise<void> {
    console.log(`Ajustando plan de tratamiento para ${userId} basado en métricas:`, metrics);
    
    if (metrics.clinicalSignificance < 0.5) {
      console.log('Revisando formulación de caso - cambio no clínicamente significativo');
    }
    
    if (metrics.reliabilityIndex < 0.7) {
      console.log('Mejorando consistencia en evaluaciones');
    }
  }

  // Métodos auxiliares
  
  private addSession(userId: string, session: SessionData): void {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, []);
    }
    this.sessions.get(userId)!.push(session);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getModalitiesFrequency(sessions: SessionData[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    for (const session of sessions) {
      for (const modality of session.modalities) {
        frequency[modality] = (frequency[modality] || 0) + 1;
      }
    }
    
    return frequency;
  }

  private calculateAverageEmotionalProfile(sessions: SessionData[]): EmotionalProfile | {} {
    const profiles = sessions.filter(s => s.emotionalProfile).map(s => s.emotionalProfile!);
    
    if (profiles.length === 0) return {};
    
    const average: Partial<EmotionalProfile> = {};
    const keys = Object.keys(profiles[0]) as (keyof EmotionalProfile)[];
    
    for (const key of keys) {
      average[key] = profiles.reduce((sum, profile) => sum + (profile[key] ?? 0), 0) / profiles.length;
    }
    
    return average as EmotionalProfile;
  }

  private extractBehavioralPatterns(sessions: SessionData[]): any {
    const behavioralData = sessions.filter(s => s.behavioralData).map(s => s.behavioralData!);
    
    return {
      averageFrequency: behavioralData.reduce((sum, d) => sum + d.frequency, 0) / behavioralData.length,
      averageIntensity: behavioralData.reduce((sum, d) => sum + d.intensity, 0) / behavioralData.length,
      commonContexts: this.identifyCommonContexts(behavioralData),
      avoidanceTrends: this.analyzeAvoidanceTrends(behavioralData)
    };
  }

  private compileAssessmentScores(sessions: SessionData[]): Record<string, number[]> {
    const scores: Record<string, number[]> = {};
    
    for (const category of this.assessmentCategories) {
      scores[category.id] = category.scores;
    }
    
    return scores;
  }

  private identifyCommonContexts(behavioralData: BehavioralData[]): string[] {
    const contexts: Record<string, number> = {};
    
    for (const data of behavioralData) {
      contexts[data.context] = (contexts[data.context] || 0) + 1;
    }
    
    return Object.entries(contexts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([context]) => context);
  }

  private analyzeAvoidanceTrends(behavioralData: BehavioralData[]): {
    averageLevel: number;
    trend: 'improving' | 'stable' | 'worsening';
  } {
    const levels = behavioralData.map(d => d.avoidanceLevel);
    const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (levels.length >= 3) {
      const recent = levels.slice(-3);
      const earlier = levels.slice(-6, -3);
      
      const recentAvg = recent.reduce((sum, level) => sum + level, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, level) => sum + level, 0) / earlier.length;
      
      if (recentAvg < earlierAvg - 0.5) trend = 'improving';
      else if (recentAvg > earlierAvg + 0.5) trend = 'worsening';
    }
    
    return { averageLevel, trend };
  }

  private calculateConsistencyScore(sessions: SessionData[]): number {
    // Consistencia en mediciones y protocolos
    let consistency = 0.8; // Base score
    
    // Reducir por inconsistencias
    const modalities = sessions.map(s => s.modalities);
    const uniqueModalitySets = new Set(modalities.map(m => m.sort().join(',')));
    
    if (uniqueModalitySets.size > 1) {
      consistency -= 0.1; // Penalizar inconsistencia en modalidades
    }
    
    return Math.max(0, consistency);
  }

  private calculateProtocolAdherence(sessions: SessionData[]): number {
    // Adherencia a protocolos estandarizados
    return 0.85; // Simulación de buena adherencia
  }

  private assessFormulationAccuracy(sessions: SessionData[]): number {
    // Precisión de la formulación predictiva
    return 0.75; // Simulación
  }

  private assessOutcomePrediction(sessions: SessionData[]): number {
    // Precisión en predicción de resultados
    return 0.70; // Simulación
  }

  private validateSMARTGoal(goal: TherapeuticGoal): TherapeuticGoal {
    // Validar que la meta cumpla criterios SMART
    const issues: string[] = [];
    
    if (!goal.measurement || goal.measurement.trim() === '') {
      issues.push('La meta necesita ser medible');
    }
    
    if (!goal.timeBound) {
      issues.push('La meta necesita tener límite de tiempo');
    }
    
    if (goal.targetValue === goal.baseline) {
      issues.push('El objetivo debe ser diferente del baseline');
    }
    
    if (issues.length > 0) {
      console.warn(`Meta no SMART: ${goal.description} - Issues: ${issues.join(', ')}`);
    }
    
    return {
      ...goal,
      achievable: goal.achievable && issues.length === 0
    };
  }

  private mapGoalToResources(goal: TherapeuticGoal): Resource[] {
    const resourceMap: Record<string, Resource> = {
      conductual: {
        id: this.generateId(),
        name: 'Plan de exposición gradual',
        type: 'interno',
        availability: 'disponible',
        utilization: 0
      },
      cognitivo: {
        id: this.generateId(),
        name: 'Material de reestructuración cognitiva',
        type: 'interno',
        availability: 'disponible',
        utilization: 0
      },
      emocional: {
        id: this.generateId(),
        name: 'Técnicas de regulación emocional',
        type: 'interno',
        availability: 'disponible',
        utilization: 0
      },
      social: {
        id: this.generateId(),
        name: 'Oportunidades de práctica social',
        type: 'externo',
        availability: 'limitado',
        utilization: 0
      }
    };
    
    return resourceMap[goal.category] ? [resourceMap[goal.category]] : [];
  }

  // Métodos públicos para acceso a datos
  
  public getSessionHistory(userId: string): SessionData[] {
    return this.sessions.get(userId) || [];
  }

  public getCaseFormulation(): CaseFormulation | null {
    return this.caseFormulation;
  }

  public getEvaluationMetrics(): EvaluationMetrics | null {
    return this.evaluationMetrics;
  }

  public getAssessmentCategories(): AssessmentCategory[] {
    return this.assessmentCategories;
  }
}

export const multimodalEvaluationService = new MultimodalEvaluationService();
