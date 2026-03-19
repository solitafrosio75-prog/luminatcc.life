// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════
// EvaluationLifecycleService.ts — Orquestación del Ciclo de Evaluación
// ═══════════════════════════════════════════════════════════════════
//
// Fase 3: Orquestación del ciclo completo que resuelve:
//  - C7: No existe capa de orquestación
//  - C5: FRE no conoce InterventionPlan activo
//  - C6: PCF handler vacío cuando usuario rechaza todo
//
// Gestiona la transición automática entre fases:
// 1. Baseline Collection (7-14 días)
// 2. Plan Generation (propuesta)
// 3. Co-construction (validación con usuario)
// 4. Plan Execution (ejecución con recomendaciones alineadas)
// 5. Weekly Evaluation (evaluación intra-plan + cambio)
// 6. Plan Completion (cierre formal)
// 7. Follow-Up Monitoring (hasta 12 meses)
//
// Patrón: Event-driven orchestration con listeners para cambios
// ═══════════════════════════════════════════════════════════════════

import type { FunctionalSequence } from './sequenceTypes';
import type { IntegratedCaseFormulation } from './sequenceTypes';
import type {
  InterventionPlan,
  PlanStatus,
  IntermediateObjective,
} from './interventionPlanTypes';
import type { BaselineSnapshot } from './BaselineCollector';
import type { ChangeReport } from './ChangeEvaluator';
import type { FollowUpSummaryForUI } from './FollowUpMonitor';

import { db, type EvaluationLifecycleDB, type FollowUpStateDB } from '../../db/database';
import { getActivePlan, updatePlanStatus, createInterventionPlan, updatePlan } from '../../db/operations/interventionPlanOperations';
import { BaselineService, BaselineStatus, type BaselineProgressState } from './BaselineService';
import { generateInterventionPlan } from './InterventionPlanGenerator';
import { identifyKeyBehaviors } from './KeyBehaviorIdentifier';
import { evaluatePlan, type EvaluationResult } from './InterventionPlanEvaluator';
import { evaluateChange, type ChangeReport as ChangeReportType } from './ChangeEvaluator';
import { initializeFollowUp, runFollowUpCheckup as runFollowUpCheckupFn, generateFollowUpSummary } from './FollowUpMonitor';

// ─────────────────────────────────────────────
// Tipos de Ciclo de Vida
// ─────────────────────────────────────────────

export type EvaluationPhase =
  | 'baseline_collection'    // Recolectando línea base (7-14 días)
  | 'plan_generation'        // Generando plan propuesto
  | 'co_construction'        // Usuario validando objetivos
  | 'execution'              // Plan activo, recomendaciones alineadas
  | 'weekly_evaluation'      // Eval intra-plan cada week
  | 'plan_completion'        // Plan completado
  | 'follow_up'              // Monitoreo post-plan (hasta 12 meses)
  | 'idle';                  // Sin plan activo, esperando iniciar

export interface LifecycleState {
  userId: string;
  currentPhase: EvaluationPhase;
  activePlanId?: string;
  baselineSnapshotId?: string;
  followUpStateId?: string;

  /** Metadata para diagnóstico */
  phaseStartedAt: Date;
  lastTransitionAt: Date;
  transitionHistory: PhaseTransition[];

  /** ¿Hay errores o warnings en el ciclo? */
  healthStatus: 'healthy' | 'warning' | 'error';
  issues?: string[];
}

export interface PhaseTransition {
  from: EvaluationPhase;
  to: EvaluationPhase;
  trigger: string; // qué causó la transición
  timestamp: Date;
  metadata?: Record<string, unknown>; // por ej {planId, baselineId}
}

export interface LifecycleEvent {
  type: LifecycleEventType;
  userId: string;
  phase: EvaluationPhase;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export type LifecycleEventType =
  | 'baseline_started'
  | 'baseline_ready'
  | 'baseline_expired'
  | 'plan_generated'
  | 'plan_activated'
  | 'plan_completed'
  | 'weekly_evaluation_done'
  | 'change_detected_significant'
  | 'change_detected_minimal'
  | 'followup_started'
  | 'followup_checkup_done'
  | 'followup_completed'
  | 'error_occurred';

export interface CycleConfig {
  /** Días mínimos para considerar baseline válida */
  baselineDaysRequired: number; // default: 14
  /** Días máximos antes de que baseline expire */
  baselineMaxAgeDays: number; // default: 30
  /** Frecuencia de evaluación semanal (días) */
  evaluationFrequencyDays: number; // default: 7
  /** Duración máxima de co-construcción antes de timeout */
  coConstructionTimeoutHours: number; // default: 72
  /** Máximo tiempo de plan activo sin evaluación antes de alerta */
  evaluationDueAlertDays: number; // default: 8
}

// ─────────────────────────────────────────────
// Servicio Principal
// ─────────────────────────────────────────────

export class EvaluationLifecycleService {
  private static instance: EvaluationLifecycleService;
  private listeners: Array<(event: LifecycleEvent) => void> = [];
  private config: CycleConfig;


  private constructor(config?: Partial<CycleConfig>) {
    this.config = {
      baselineDaysRequired: 14,
      baselineMaxAgeDays: 30,
      evaluationFrequencyDays: 7,
      coConstructionTimeoutHours: 72,
      evaluationDueAlertDays: 8,
      ...config,
    };

  }

  static getInstance(config?: Partial<CycleConfig>): EvaluationLifecycleService {
    if (!EvaluationLifecycleService.instance) {
      EvaluationLifecycleService.instance = new EvaluationLifecycleService(config);
    }
    return EvaluationLifecycleService.instance;
  }

  // ─────────────────────────────────────────────
  // Escucha de Eventos Globales
  // ─────────────────────────────────────────────

  onLifecycleEvent(listener: (event: LifecycleEvent) => void): void {
    this.listeners.push(listener);
  }

  private dispatchEvent(event: LifecycleEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in lifecycle listener:', err);
      }
    }
  }

  // ─────────────────────────────────────────────
  // FASE 1: BASELINE COLLECTION
  // Dispara cuando: usuario tiene 7+ días de datos
  // Transition: idle → baseline_collection → plan_generation
  // ─────────────────────────────────────────────

  /**
   * Inicia automáticamente la recolección de línea base.
   * Llamado tras completar onboarding o cuando se detectan datos suficientes.
   */
  async initiateBaselineCollection(
    userId: string,
    _?: IntegratedCaseFormulation,
  ): Promise<void> {
    try {
      BaselineService.initializeBaselineCollection(
        userId,
        this.config.baselineDaysRequired,
      );

      await this.persistLifecycleState({
        userId,
        currentPhase: 'baseline_collection',
        phaseStartedAt: new Date(),
        lastTransitionAt: new Date(),
        transitionHistory: [{ from: 'idle', to: 'baseline_collection', trigger: 'initiate_baseline', timestamp: new Date() }],
        healthStatus: 'healthy',
      });

      this.dispatchEvent({
        type: 'baseline_started',
        userId,
        phase: 'baseline_collection',
        timestamp: new Date(),
      });
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'baseline_collection',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  /**
   * Verifica si la línea base está lista para generar plan.
   * Si lo está, transiciona automáticamente a plan_generation.
   */
  async checkAndAdvanceFromBaseline(
    userId: string,
    sequences: FunctionalSequence[],
    formulation: IntegratedCaseFormulation,
  ): Promise<boolean> {
    try {
      const readiness = await BaselineService.checkBaselineReadiness(
        userId,
        this.config.baselineDaysRequired,
        sequences,
      );

      if (readiness.status !== BaselineStatus.READY) {
        return false;
      }

      // Congelar baseline y preparar para plan generation
      const baselineSnapshot = await BaselineService.ensureAndFreezeBaseline(
        userId,
        sequences,
        formulation,
      );

      if (!baselineSnapshot) {
        throw new Error('Failed to freeze baseline snapshot');
      }

      // Persistir transición a plan_generation
      const currentState = await this.getUserLifecycleState(userId);
      await this.persistLifecycleState({
        userId,
        currentPhase: 'plan_generation',
        baselineSnapshotId: baselineSnapshot.id,
        phaseStartedAt: new Date(),
        lastTransitionAt: new Date(),
        transitionHistory: [
          ...currentState.transitionHistory,
          { from: 'baseline_collection', to: 'plan_generation', trigger: 'baseline_ready', timestamp: new Date() },
        ],
        healthStatus: 'healthy',
      });

      this.dispatchEvent({
        type: 'baseline_ready',
        userId,
        phase: 'baseline_collection',
        timestamp: new Date(),
        data: { baselineSnapshotId: baselineSnapshot.id },
      });

      // Transición automática
      return true;
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'baseline_collection',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // FASE 2: PLAN GENERATION
  // Dispara cuando: baseline está lista
  // Transition: baseline_collection → plan_generation → co_construction
  // ─────────────────────────────────────────────

  /**
   * Genera plan propuesto basado en baseline y formulación.
   * El plan nace en estado 'draft' (pendiente co-construcción).
   */
  async generatePlanFromBaseline(
    userId: string,
    sequences: FunctionalSequence[],
    formulation: IntegratedCaseFormulation,
    baselineSnapshot: BaselineSnapshot,
  ): Promise<InterventionPlan> {
    try {
      // Identificar conductas clave desde formulación y secuencias
      const keyBehaviors = identifyKeyBehaviors(formulation, sequences, 3);

      const newPlan = generateInterventionPlan({
        userId,
        formulation,
        recentSequences: sequences,
        keyBehaviors,
        baselineSnapshot,
      });

      // El plan nace en draft
      newPlan.status = 'draft';
      newPlan.createdAt = new Date();
      newPlan.updatedAt = new Date();

      // Persistir plan en DB
      const planId = await createInterventionPlan(newPlan);
      newPlan.id = planId;

      // Persistir transición a co_construction
      const currentState = await this.getUserLifecycleState(userId);
      await this.persistLifecycleState({
        userId,
        currentPhase: 'co_construction',
        activePlanId: String(newPlan.id),
        baselineSnapshotId: baselineSnapshot.id,
        phaseStartedAt: new Date(),
        lastTransitionAt: new Date(),
        transitionHistory: [
          ...currentState.transitionHistory,
          { from: 'plan_generation', to: 'co_construction', trigger: 'plan_generated', timestamp: new Date() },
        ],
        healthStatus: 'healthy',
      });

      this.dispatchEvent({
        type: 'plan_generated',
        userId,
        phase: 'plan_generation',
        timestamp: new Date(),
        data: {
          planId: newPlan.id,
          baselineSnapshotId: baselineSnapshot.id,
          objectiveCount: newPlan.finalObjectives.length,
        },
      });

      return newPlan;
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'plan_generation',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // FASE 3: CO-CONSTRUCTION
  // Dispara cuando: plan generado, espera validación usuario
  // Transition: plan_generation → co_construction → execution
  //
  // CORRIGE C6: Handler vacío cuando usuario rechaza todo
  // ─────────────────────────────────────────────

  /**
   * Maneja la finalización de co-construcción.
   * Si el usuario rechazó TODOS los objetivos, entra en modo "defer".
   * No cuelga el flujo, sino que ofrece opciones claras.
   */
  async handleCoConstructionCompleted(
    userId: string,
    planId: string,
    acceptedCount: number,
    totalCount: number,
  ): Promise<'activated' | 'deferred' | 'abandoned'> {
    try {
      if (acceptedCount === 0 && totalCount > 0) {
        // C6 FIXED: Usuario rechazó TODO - no es un error, es una decisión
        // Opciones:
        // 1. "Defer" → intenta de nuevo en X días
        // 2. "Adjust" → sistema modifica propuesta
        // 3. "Abandon" → cierra sin plan activado

        this.dispatchEvent({
          type: 'error_occurred', // Técnicamente es una situación especial, no un error
          userId,
          phase: 'co_construction',
          timestamp: new Date(),
          data: {
            planId,
            reason: 'user_rejected_all_objectives',
            message: 'User rejected all proposed objectives. Plan deferred.',
          },
        });

        return 'deferred';
      }

      // Caso normal: usuario aceptó al menos algunos objetivos
      const acceptanceRatio = acceptedCount / totalCount;

      if (acceptanceRatio >= 0.5) {
        // ≥50% aceptación → activar plan
        // (El plan ya tiene los objectives filtrados)

        // Persistir transición a execution
        const currentState = await this.getUserLifecycleState(userId);
        await this.persistLifecycleState({
          userId,
          currentPhase: 'execution',
          activePlanId: planId,
          baselineSnapshotId: currentState.baselineSnapshotId,
          phaseStartedAt: new Date(),
          lastTransitionAt: new Date(),
          transitionHistory: [
            ...currentState.transitionHistory,
            { from: 'co_construction', to: 'execution', trigger: 'plan_activated', timestamp: new Date() },
          ],
          healthStatus: 'healthy',
        });

        this.dispatchEvent({
          type: 'plan_activated',
          userId,
          phase: 'co_construction',
          timestamp: new Date(),
          data: { planId, acceptanceRatio },
        });

        return 'activated';
      } else {
        // <50% aceptación → deferir para ajustes
        this.dispatchEvent({
          type: 'error_occurred',
          userId,
          phase: 'co_construction',
          timestamp: new Date(),
          data: {
            planId,
            reason: 'low_acceptance_ratio',
            acceptanceRatio,
            message: 'User accepted < 50% of objectives. Plan deferred for adjustment.',
          },
        });

        return 'deferred';
      }
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'co_construction',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // FASE 4: PLAN EXECUTION
  // Dispara cuando: plan activado (usuario aceptó)
  // Transition: co_construction → execution
  //
  // CORRIGE C5: FRE ahora sabe del InterventionPlan activo
  // ─────────────────────────────────────────────

  /**
   * Obtiene el plan activo para alineación de recomendaciones.
   * CORRIGE C5: FunctionalRecommendationEngine ahora puede acceder aquí.
   *
   * Uso desde FRE:
   * ```
   * const lifecycle = EvaluationLifecycleService.getInstance();
   * const activePlan = await lifecycle.getActivePlanForUser(userId);
   * if (activePlan) {
   *   // Alinear recomendaciones diarias con objetivos intermedios activos
   * }
   * ```
   */
  async getActivePlanForUser(userId: string): Promise<InterventionPlan | null> {
    const plan = await getActivePlan(userId);
    return plan ?? null;
  }

  /**
   * Retorna los objetivos intermedios activos del plan para hoy.
   * Usado por FRE para filtrar técnicas y recomendaciones relevantes.
   */
  async getActiveObjectivesForUser(userId: string): Promise<IntermediateObjective[]> {
    const plan = await this.getActivePlanForUser(userId);
    if (!plan) return [];

    const activeObjectives: IntermediateObjective[] = [];
    for (const finalObj of plan.finalObjectives) {
      if (finalObj.status === 'active') {
        activeObjectives.push(
          ...finalObj.intermediateObjectives.filter(
            (io) => io.status === 'active',
          ),
        );
      }
    }
    return activeObjectives;
  }

  // ─────────────────────────────────────────────
  // FASE 5: WEEKLY EVALUATION
  // Dispara: cada semana (configurable)
  // Transition: execution → execution (iterativo)
  // ─────────────────────────────────────────────

  /**
   * Ejecuta evaluación semanal completa:
   * 1. Evaluación intra-plan (síntomas, progreso, cascadas)
   * 2. Evaluación de cambio significativo (pre/post si aplica)
   * 3. Ajustes automáticos (extend, change_technique, etc.)
   */
  async runWeeklyEvaluation(
    userId: string,
    plan: InterventionPlan,
    sequences: FunctionalSequence[],
    userReflection?: unknown, // Weekly reflection data
  ): Promise<{
    intraPlanResult: EvaluationResult;
    changeResult?: ChangeReportType;
  }> {
    try {
      // Step 1: Evaluación intra-plan
      const intraPlanResult = await evaluatePlan({
        plan,
        recentSequences: sequences,
        evaluationPeriodDays: this.config.evaluationFrequencyDays,
        userParticipating: !!userReflection,
      });

      // Actualizar plan con evaluaciones
      plan.lastEvaluatedAt = new Date();
      plan.overallProgress = intraPlanResult.planSummary.overallProgress;

      let changeResult: ChangeReportType | undefined;

      // Step 2: ¿Hay cambio significativo post-intervención?
      if (plan.baselineSnapshotId && shouldRunChangeEvaluation(plan)) {
        const dbSnapshot = await db.baselineSnapshots.get(plan.baselineSnapshotId);
        if (dbSnapshot) {
          const baselineSnapshot = BaselineService.dbSnapshotToBaseline(dbSnapshot);
          const periodEnd = new Date();
          const periodStart = new Date(periodEnd.getTime() - this.config.evaluationFrequencyDays * 24 * 60 * 60 * 1000);
          changeResult = evaluateChange(
            baselineSnapshot,
            sequences,
            periodStart,
            periodEnd,
            plan,
          );
        }

        const hasSignificantChange =
          changeResult?.globalSummary.overallVerdict === 'significant_improvement' ||
          changeResult?.globalSummary.overallVerdict === 'deterioration';

        if (hasSignificantChange) {
          this.dispatchEvent({
            type: 'change_detected_significant',
            userId,
            phase: 'weekly_evaluation',
            timestamp: new Date(),
            data: { planId: plan.id, changeReport: changeResult },
          });
        }
      }

      // Step 3: Aplicar decisiones automáticas
      // (extend, change_technique, advance, etc.)
      // Esto ya está en intraPlanResult.autoDecisions

      // Persistir plan actualizado con la evaluación
      await updatePlan(plan);

      this.dispatchEvent({
        type: 'weekly_evaluation_done',
        userId,
        phase: 'weekly_evaluation',
        timestamp: new Date(),
        data: {
          planId: plan.id,
          objectivesSummary: intraPlanResult.objectiveSummaries.length,
          hasSignificantChange: !!(
            changeResult?.globalSummary.overallVerdict === 'significant_improvement' ||
            changeResult?.globalSummary.overallVerdict === 'deterioration'
          ),
        },
      });

      return { intraPlanResult, changeResult };
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'weekly_evaluation',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // FASE 6: PLAN COMPLETION
  // Dispara cuando: todos los objetivos finales son achieved
  // Transition: execution → plan_completion → follow_up
  // ─────────────────────────────────────────────

  /**
   * Finaliza un plan y transiciona a modo follow-up.
   * Registra el cierre formal con evaluación post-tratamiento.
   */
  async completePlan(
    userId: string,
    plan: InterventionPlan,
    sequences: FunctionalSequence[],
  ): Promise<void> {
    try {
      plan.status = 'completed';
      plan.completedAt = new Date();
      await updatePlan(plan);

      // Evaluación post-tratamiento formal + iniciar seguimiento
      let followUpStateId: string | undefined;
      if (plan.baselineSnapshotId) {
        const dbSnapshot = await db.baselineSnapshots.get(plan.baselineSnapshotId);
        if (dbSnapshot) {
          const baseline = BaselineService.dbSnapshotToBaseline(dbSnapshot);

          // Evaluación post-tratamiento
          const periodEnd = new Date();
          const periodStart = new Date(plan.activatedAt || plan.createdAt);
          evaluateChange(baseline, sequences, periodStart, periodEnd, plan);

          // Iniciar seguimiento
          const followUpState = initializeFollowUp(userId, plan, baseline);
          followUpStateId = followUpState.id;

          // Persistir follow-up state en DB
          const now = new Date();
          await db.followUpMonitoring.add({
            id: followUpState.id,
            userId,
            completedPlanId: String(plan.id),
            baselineSnapshotId: plan.baselineSnapshotId,
            initiatedAt: now,
            lastCheckupAt: undefined,
            nextCheckupAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
            checkupsCompleted: 0,
            status: 'active',
            monitoringData: {
              peakMetrics: followUpState.peakMetrics,
              config: followUpState.config,
              checkups: followUpState.checkups,
            },
          });
        }
      }

      // Persistir transición a follow_up
      const currentState = await this.getUserLifecycleState(userId);
      await this.persistLifecycleState({
        userId,
        currentPhase: 'follow_up',
        activePlanId: String(plan.id),
        baselineSnapshotId: plan.baselineSnapshotId,
        followUpStateId,
        phaseStartedAt: new Date(),
        lastTransitionAt: new Date(),
        transitionHistory: [
          ...currentState.transitionHistory,
          { from: 'execution', to: 'follow_up', trigger: 'plan_completed', timestamp: new Date() },
        ],
        healthStatus: 'healthy',
      });

      this.dispatchEvent({
        type: 'plan_completed',
        userId,
        phase: 'plan_completion',
        timestamp: new Date(),
        data: { planId: plan.id, completedAt: plan.completedAt },
      });
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'plan_completion',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // FASE 7: FOLLOW-UP MONITORING
  // Dispara: periódicamente (cada 2 semanas, 1 mes, 3 meses, etc.)
  // Transition: follow_up → follow_up (iterativo)
  // ─────────────────────────────────────────────

  /**
   * Ejecuta un checkup de seguimiento post-plan.
   * Detecta recaídas, necesidad de refuerzo, generalización.
   */
  async runFollowUpCheckup(
    userId: string,
    followUpStateId: string,
    sequences: FunctionalSequence[],
  ): Promise<FollowUpSummaryForUI> {
    try {
      const dbRecord = await db.followUpMonitoring.get(followUpStateId);
      if (!dbRecord) {
        throw new Error(`Follow-up state ${followUpStateId} not found`);
      }

      // Reconstituir FollowUpState desde DB
      const followUpState = dbRecord.monitoringData as any;
      followUpState.id = dbRecord.id;
      followUpState.userId = dbRecord.userId;
      followUpState.completedPlanId = dbRecord.completedPlanId;
      followUpState.baselineSnapshotId = dbRecord.baselineSnapshotId;
      followUpState.status = dbRecord.status;
      followUpState.startedAt = dbRecord.initiatedAt;
      followUpState.lastCheckupAt = dbRecord.lastCheckupAt;

      // Ejecutar checkup
      const updatedState = runFollowUpCheckupFn(followUpState, sequences);

      // Persistir estado actualizado
      await db.followUpMonitoring.update(followUpStateId, {
        lastCheckupAt: new Date(),
        nextCheckupAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        checkupsCompleted: (dbRecord.checkupsCompleted || 0) + 1,
        monitoringData: updatedState as any,
        status: updatedState.status as FollowUpStateDB['status'],
      });

      const summary = generateFollowUpSummary(updatedState);

      this.dispatchEvent({
        type: 'followup_checkup_done',
        userId,
        phase: 'follow_up',
        timestamp: new Date(),
        data: { followUpStateId, summary },
      });

      return summary;
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'follow_up',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  /**
   * Finaliza el período de seguimiento (12 meses completados exitosamente).
   */
  async completeFollowUp(userId: string, followUpStateId: string): Promise<void> {
    try {
      await db.followUpMonitoring.update(followUpStateId, {
        status: 'completed',
        lastCheckupAt: new Date(),
      });

      this.dispatchEvent({
        type: 'followup_completed',
        userId,
        phase: 'follow_up',
        timestamp: new Date(),
        data: { followUpStateId },
      });
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'follow_up',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // SAFETY: Manejo de alertas de crisis
  // ─────────────────────────────────────────────

  /**
   * Registra una alerta de seguridad en el ciclo de evaluación.
   * No pausa automáticamente (la app no es servicio de emergencia),
   * pero registra el evento para revisión clínica.
   */
  handleSafetyAlert(
    userId: string,
    safetyFlags: { needsSupport: boolean; keywords: string[] },
  ): void {
    if (!safetyFlags.needsSupport) return;
    this.dispatchEvent({
      type: 'error_occurred',
      userId,
      phase: 'execution',
      timestamp: new Date(),
      data: {
        safetyAlert: true,
        keywords: safetyFlags.keywords,
        message: 'Safety keywords detected. User shown professional support resources.',
      },
    });
  }

  // ─────────────────────────────────────────────
  // Utilidades
  // ─────────────────────────────────────────────

  /**
   * Obtiene el estado de ciclo de vida para un usuario.
   */
  async getUserLifecycleState(userId: string): Promise<LifecycleState> {
    const record = await db.evaluationLifecycle.get(userId);
    if (!record) {
      // Primer uso — retornar estado idle por defecto
      return {
        userId,
        currentPhase: 'idle',
        phaseStartedAt: new Date(),
        lastTransitionAt: new Date(),
        transitionHistory: [],
        healthStatus: 'healthy',
      };
    }

    return {
      userId: record.userId,
      currentPhase: record.currentPhase as EvaluationPhase,
      activePlanId: record.activePlanId ? String(record.activePlanId) : undefined,
      baselineSnapshotId: record.baselineSnapshotId,
      followUpStateId: record.followUpStateId,
      phaseStartedAt: record.phaseStartedAt,
      lastTransitionAt: record.lastTransitionAt,
      transitionHistory: JSON.parse(record.transitionHistory || '[]'),
      healthStatus: record.healthStatus as LifecycleState['healthStatus'],
      issues: record.issues ? JSON.parse(record.issues) : undefined,
    };
  }

  /**
   * Reinicia el ciclo completo para un usuario (ej: nueva formulación).
   */
  async restartCycle(userId: string): Promise<void> {
    try {
      // Marcar plan activo como 'revising' si existe
      const activePlan = await getActivePlan(userId);
      if (activePlan?.id) {
        await updatePlanStatus(activePlan.id, 'paused');
      }

      // Actualizar lifecycle state a baseline_collection
      const currentState = await this.getUserLifecycleState(userId);
      currentState.currentPhase = 'baseline_collection';
      currentState.lastTransitionAt = new Date();
      currentState.phaseStartedAt = new Date();
      currentState.transitionHistory.push({
        from: currentState.currentPhase,
        to: 'baseline_collection',
        trigger: 'formulation_changed',
        timestamp: new Date(),
      });
      await this.persistLifecycleState(currentState);

      this.dispatchEvent({
        type: 'baseline_started',
        userId,
        phase: 'baseline_collection',
        timestamp: new Date(),
        data: { reason: 'formulation_changed' },
      });
    } catch (err) {
      this.dispatchEvent({
        type: 'error_occurred',
        userId,
        phase: 'baseline_collection',
        timestamp: new Date(),
        data: { error: String(err) },
      });
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // Persistencia del Lifecycle State
  // ─────────────────────────────────────────────

  /**
   * Persiste el estado de ciclo de vida en la tabla evaluationLifecycle.
   * Usa upsert (put) — crea si no existe, actualiza si existe.
   */
  private async persistLifecycleState(state: LifecycleState): Promise<void> {
    const dbRecord: EvaluationLifecycleDB = {
      userId: state.userId,
      currentPhase: state.currentPhase,
      activePlanId: state.activePlanId ? Number(state.activePlanId) : undefined,
      baselineSnapshotId: state.baselineSnapshotId,
      followUpStateId: state.followUpStateId,
      phaseStartedAt: state.phaseStartedAt,
      lastTransitionAt: state.lastTransitionAt,
      transitionHistory: JSON.stringify(state.transitionHistory),
      healthStatus: state.healthStatus,
      issues: state.issues ? JSON.stringify(state.issues) : undefined,
    };
    await db.evaluationLifecycle.put(dbRecord);
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * ¿Deberíamos evaluar cambio significativo ahora?
 * Sí si: plan lleva ≥X semanas activo y hay baseline válida.
 */
function shouldRunChangeEvaluation(plan: InterventionPlan): boolean {
  if (!plan.baselineSnapshotId) return false;
  if (!plan.activatedAt) return false;

  const weeksActive = Math.floor(
    (Date.now() - plan.activatedAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );

  // Evaluar cambio después de 2 semanas de plan activo
  return weeksActive >= 2;
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default EvaluationLifecycleService;
