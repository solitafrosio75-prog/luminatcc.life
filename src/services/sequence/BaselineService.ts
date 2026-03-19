// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════
// BaselineService.ts — Orquestación de Recolección y Generación de Plan
// ═══════════════════════════════════════════════════════════════════
//
// Servicio que gestiona el ciclo de vida completo de la línea base:
// 1. Detecta cuándo hay suficientes datos para recopilar baseline
// 2. Llama a collectBaseline() y valida estabilidad
// 3. Persiste el snapshot
// 4. Notifica que el baseline está listo → dispara generación de plan
// 5. Persiste el plan generado
//
// Resuelve el problema C1 del audit: "3 módulos huérfanos"
// ═══════════════════════════════════════════════════════════════════

import { db, type BaselineSnapshotDB } from '../../db/database';
import { createInterventionPlan } from '../../db/operations/interventionPlanOperations';
import type { FunctionalSequence, IntegratedCaseFormulation } from './sequenceTypes';
import type { KeyBehavior } from './KeyBehaviorIdentifier';
import {
  collectBaseline,
  type BaselineSnapshot,
} from './BaselineCollector';
import {
  generateInterventionPlan,
  type PlanGenerationInput,
} from './InterventionPlanGenerator';
import type { InterventionPlan } from './interventionPlanTypes';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export enum BaselineStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  EXPIRED = 'expired',
}

export interface BaselineProgressState {
  status: BaselineStatus;
  /** Cuando se inició la recolección */
  startedAt?: Date;
  /** Cuando estará completa (estimado) */
  completesAt?: Date;
  /** Número de días completados / requeridos */
  daysCompleted?: number;
  /** ¿Está validada? */
  isValid?: boolean;
  /** ¿Expiró? */
  isExpired?: boolean;
}

/**
 * Eventos que dispara el servicio para integración asincrónica
 */
export interface BaselineLifecycleEvent {
  type: 'baseline_started' | 'baseline_ready' | 'baseline_expired' | 'plan_generated';
  userId: string;
  timestamp: Date;
  data?: {
    baselineSnapshotId?: string;
    planId?: string | number;
    formulationVersion?: number;
    completesAt?: Date;
  };
}

// ─────────────────────────────────────────────
// SERVICIO
// ─────────────────────────────────────────────

export class BaselineService {
  /**
   * Inicia el período de recolección de línea base para un usuario.
   * Típicamente se llama inmediatamente después del onboarding.
   *
   * @param userId ID del usuario
   * @param daysRequired Cuántos días recopilar (default: 14)
   */
  static initializeBaselineCollection(
    userId: string,
    daysRequired: number = 14
  ): void {
    // Marcar en BD que la recolección comenzó
    // (se implementa cuando se integre a Dexie)

    // Disparar evento asincrónico para UI
    this.dispatchEvent({
      type: 'baseline_started', 
      userId,
      timestamp: new Date(),
      data: {
        completesAt: new Date(Date.now() + daysRequired * 24 * 60 * 60 * 1000),
      },
    });
  }

  /**
   * Comprueba si el usuario ha completado suficientes datos para recopilar baseline.
   * Se retorna el estado actual y si está listo o no.
   */
  static async checkBaselineReadiness(
    userId: string,
    daysRequired: number = 14,
    recentSequences: FunctionalSequence[] = []
  ): Promise<BaselineProgressState> {
    // Verificar si ya existe un baseline snapshot válido en DB
    const existingSnapshots = await db.baselineSnapshots
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('frozenAt');

    if (existingSnapshots.length > 0) {
      const latest = existingSnapshots[0];
      // Si tiene un snapshot reciente y válido, ya está listo
      const ageDays = (Date.now() - latest.frozenAt.getTime()) / (24 * 60 * 60 * 1000);
      if (ageDays <= 30 && latest.usableForClinicalSignificance) {
        return {
          status: BaselineStatus.READY,
          daysCompleted: daysRequired,
          isValid: true,
        };
      }
      // Si el snapshot expiró, necesita recollectar
      if (ageDays > 30) {
        return {
          status: BaselineStatus.EXPIRED,
          daysCompleted: 0,
          isValid: false,
        };
      }
    }

    // Sin snapshot previo, calcular desde secuencias recientes
    if (recentSequences.length === 0) {
      return { status: BaselineStatus.NOT_STARTED };
    }

    // Calcular span temporal de los datos
    const oldestSeq = recentSequences[recentSequences.length - 1]; // Suponiendo ordenadas
    const newestSeq = recentSequences[0];
    const spanDays = (newestSeq.timestamp.getTime() - oldestSeq.timestamp.getTime()) / (24 * 60 * 60 * 1000);

    // Chequear validez
    const isValid = spanDays >= daysRequired;

    return {
      status: isValid ? BaselineStatus.READY : BaselineStatus.IN_PROGRESS,
      daysCompleted: Math.floor(spanDays),
      isValid,
    };
  }

  /**
   * Cuando el baseline está listo:
   * 1. Llama a collectBaseline()
   * 2. Valida el snapshot
   * 3. Lo persiste
   * 4. Dispara el trigger para generar el plan
   *
   * @returns El snapshot congelado y validado
   */
  static async ensureAndFreezeBaseline(
    userId: string,
    recentSequences: FunctionalSequence[],
    formulation: IntegratedCaseFormulation
  ): Promise<BaselineSnapshot | null> {
    // 1. Recopilar baseline formal
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const snapshot = collectBaseline(
      userId,
      recentSequences,
      startDate,
      endDate,
      formulation,
    );

    if (!snapshot.validity.isValid) {
      console.warn(`[BaselineService] Baseline no válido para ${userId}:`, snapshot.validity);
      return null;
    }

    // 2. Persistir snapshot en Dexie
    // TODO: Agregar tabla 'baselineSnapshots' en database.ts si no existe
    await this.persistBaselineSnapshot(snapshot);

    // 3. Disparar evento
    this.dispatchEvent({
      type: 'baseline_ready',
      userId,
      timestamp: new Date(),
      data: {
        baselineSnapshotId: snapshot.id,
      },
    });

    return snapshot;
  }

  /**
   * Genera un InterventionPlan basado en el baseline congelado.
   * Se llama después de que checkBaselineReadiness indica que está ready.
   */
  static async generatePlanFromBaseline(
    userId: string,
    baselineSnapshot: BaselineSnapshot,
    formulation: IntegratedCaseFormulation,
    keyBehaviors: KeyBehavior[],
    recentSequences: FunctionalSequence[]
  ): Promise<InterventionPlan> {
    const input: PlanGenerationInput = {
      userId,
      formulation,
      keyBehaviors,
      recentSequences,
      baselineSnapshot, // ← Ahora sí se pasa como baseline formal
    };

    const plan = generateInterventionPlan(input);

    // Persistir plan
    await this.persistInterventionPlan(plan);

    // Disparar evento
    this.dispatchEvent({
      type: 'plan_generated',
      userId,
      timestamp: new Date(),
      data: {
        planId: plan.id,
        baselineSnapshotId: baselineSnapshot.id,
        formulationVersion: formulation.version,
      },
    });

    return plan;
  }

  /**
   * Detección de expiración: si pasaron 30+ días sin cambio, invalidar baseline.
   * Se llama periódicamente (ej: al abrir la app).
   */
  static async checkBaselineExpiry(
    userId: string,
    existingSnapshot: BaselineSnapshot,
    maxAgeDays: number = 30
  ): Promise<boolean> {
    const ageDays = (Date.now() - existingSnapshot.frozenAt.getTime()) / (24 * 60 * 60 * 1000);

    if (ageDays > maxAgeDays) {
      // Marcar como expirado
      this.dispatchEvent({
        type: 'baseline_expired',
        userId,
        timestamp: new Date(),
        data: {
          baselineSnapshotId: existingSnapshot.id,
        },
      });
      return true; // Expiró, necesita recollect
    }

    return false;
  }

  // ─────────────────────────────────────────────
  // PERSISTENCIA (stubs — se integra con Dexie)
  // ─────────────────────────────────────────────

  private static async persistBaselineSnapshot(snapshot: BaselineSnapshot): Promise<void> {
    // Almacenar métricas con suficiente detalle para reconstitución
    // metricsData usa Record<string, any> en Dexie (structured clone)
    const metricsData: Record<string, any> = {};
    for (const m of snapshot.metrics) {
      metricsData[m.metric] = {
        metricType: m.metric,
        mean: m.statistics.mean,
        stdDev: m.statistics.standardDeviation,
        min: m.statistics.min,
        max: m.statistics.max,
        dataPoints: m.statistics.validMeasurements,
        validityScore: m.statistics.coefficientOfVariation < 0.5 ? 0.8 : 0.5,
        // Datos extra para reconstitución completa
        statistics: m.statistics,
        scope: m.scope,
        unit: m.unit,
        dataSource: m.dataSource,
      };
    }

    const dbRecord: BaselineSnapshotDB = {
      id: snapshot.id,
      userId: snapshot.userId,
      periodStart: snapshot.period.startDate,
      periodEnd: snapshot.period.endDate,
      metricsData,
      validityData: snapshot.validity as any,
      dataPoints: snapshot.dataPoints,
      frozenAt: snapshot.frozenAt,
      formulationVersion: snapshot.formulationVersion,
      usableForClinicalSignificance: snapshot.usableForClinicalSignificance,
    };
    await db.baselineSnapshots.put(dbRecord);
  }

  /**
   * Reconstituye un BaselineSnapshot desde el registro de DB.
   * Los dailyValues se pierden en la serialización, pero los estadísticos
   * esenciales para Jacobson-Truax (mean, SD, N) se preservan.
   */
  static dbSnapshotToBaseline(dbRecord: BaselineSnapshotDB): BaselineSnapshot {
    const metrics: import('./BaselineCollector').BaselineMetricRecord[] = [];
    for (const [key, rawData] of Object.entries(dbRecord.metricsData)) {
      const data = rawData as any; // metricsData incluye campos extra para reconstitución
      metrics.push({
        metric: key as any,
        scope: data.scope || {},
        statistics: data.statistics || {
          mean: data.mean,
          median: data.mean,
          standardDeviation: data.stdDev,
          min: data.min,
          max: data.max,
          iqr: 0,
          coefficientOfVariation: data.mean !== 0 ? data.stdDev / data.mean : 0,
          trend: { slope: 0, direction: 'stable' as const, isSignificant: false },
          validMeasurements: data.dataPoints,
        },
        dailyValues: [], // No disponibles tras persistencia
        dataSource: data.dataSource || 'automatic_sequences',
        unit: data.unit || 'percentage',
      });
    }

    return {
      id: dbRecord.id,
      userId: dbRecord.userId,
      period: {
        startDate: dbRecord.periodStart,
        endDate: dbRecord.periodEnd,
        durationDays: Math.ceil(
          (dbRecord.periodEnd.getTime() - dbRecord.periodStart.getTime()) / (24 * 60 * 60 * 1000)
        ),
      },
      metrics,
      validity: dbRecord.validityData as any,
      dataPoints: dbRecord.dataPoints,
      frozenAt: dbRecord.frozenAt,
      formulationVersion: dbRecord.formulationVersion,
      usableForClinicalSignificance: dbRecord.usableForClinicalSignificance,
    };
  }

  private static async persistInterventionPlan(plan: InterventionPlan): Promise<void> {
    await createInterventionPlan(plan);
  }

  // ─────────────────────────────────────────────
  // EVENTOS (integración )
  // ─────────────────────────────────────────────

  /**
   * Listeners pueden suscribirse a eventos del servicio.
   * Se usa para integración asincrónica sin acoplamiento fuerte.
   */
  private static listeners: Array<(event: BaselineLifecycleEvent) => void> = [];

  static onBaselineEvent(listener: (event: BaselineLifecycleEvent) => void): void {
    this.listeners.push(listener);
  }

  private static dispatchEvent(event: BaselineLifecycleEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[BaselineService] Error in listener:', err);
      }
    }
  }
}

// ─────────────────────────────────────────────
// INTEGRACIÓN CON EvaluationLifecycleService
// ─────────────────────────────────────────────

/**
 * Uso típico en un orquestador superior (EvaluationLifecycleService):
 *
 * // 1. Iniciar recolección (en onboarding)
 * BaselineService.initializeBaselineCollection(userId);
 *
 * // 2. Cada día, chequear readiness (ej: app startup)
 * const status = await BaselineService.checkBaselineReadiness(
 *   userId,
 *   14,
 *   recentSequences
 * );
 *
 * if (status.status === BaselineStatus.READY) {
 *   // 3. Congelar snapshot
 *   const baseline = await BaselineService.ensureAndFreezeBaseline(
 *     userId,
 *     recentSequences,
 *     formulation
 *   );
 *
 *   if (baseline) {
 *     // 4. Generar plan
 *     const plan = await BaselineService.generatePlanFromBaseline(
 *       userId,
 *       baseline,
 *       formulation,
 *       keyBehaviors,
 *       recentSequences
 *     );
 *     // → Plan listo para co-construcción
 *   }
 * }
 */
