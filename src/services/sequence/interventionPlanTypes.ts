// ═══════════════════════════════════════════════════════════════════
// interventionPlanTypes.ts — Tipos del Plan de Intervención
// ═══════════════════════════════════════════════════════════════════
//
// Fase 4 del proceso de evaluación conductual (Ruiz, Díaz & Villalobos):
// "Propuesta de intervención basada en el paso anterior"
//
// Estructura jerárquica:
//   InterventionPlan
//     └── FinalObjective (meta última, define fin de intervención)
//           └── IntermediateObjective (sub-metas progresivas)
//                 ├── MeasurableCriterion (métrica numérica)
//                 ├── TechniqueAssignment (técnica TCC asignada)
//                 └── EvaluationSchedule (cuándo evaluar)
//
// Co-construcción:
//   El sistema PROPONE, el usuario VALIDA/AJUSTA.
//   Cada objetivo tiene tracking de origin y modifications.
//
// Referencia: Manual TCC, Cap. 2, pp. 131-136
// ═══════════════════════════════════════════════════════════════════

import type { KeyBehavior } from './KeyBehaviorIdentifier';

// ─────────────────────────────────────────────
// Plan de Intervención (documento completo)
// ─────────────────────────────────────────────

export interface InterventionPlan {
  id?: number;
  userId: string;

  /** Versión del plan (se incrementa en cada revisión mayor) */
  version: number;

  /** Estado del plan */
  status: PlanStatus;

  /** Objetivos finales (metas últimas del usuario) */
  finalObjectives: FinalObjective[];

  /** Formulación que originó este plan */
  sourceFormulationVersion: number;

  /** Snapshot de línea base usado para generar targets (si aplica) */
  baselineSnapshotId?: string;

  /** Conductas clave que fundamentan el plan */
  sourceKeyBehaviors: KeyBehaviorReference[];

  /** Historial de co-construcción */
  coConstruction: CoConstructionLog;

  /** Evaluación global del progreso */
  overallProgress: PlanProgress;

  /** Configuración de evaluación */
  evaluationConfig: EvaluationConfig;

  /** Timestamps */
  createdAt: Date;
  activatedAt?: Date;
  lastEvaluatedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export type PlanStatus =
  | 'draft'          // Propuesto por sistema, pendiente validación
  | 'co_constructing' // En proceso de ajuste con el usuario
  | 'active'         // Validado y en ejecución
  | 'paused'         // Pausado por el usuario o por protección clínica
  | 'revising'       // En revisión por cambio en formulación
  | 'completed'      // Todos los objetivos finales alcanzados
  | 'abandoned';     // Usuario decidió abandonar

// ─────────────────────────────────────────────
// Objetivo Final (Meta última)
// ─────────────────────────────────────────────
// "Las metas últimas son aquellas que una vez conseguidas
//  darán por finalizada la intervención" — Gavino, 1997

export interface FinalObjective {
  id: string;

  /** Descripción legible para el usuario */
  description: string;

  /** Descripción técnica interna */
  technicalDescription: string;

  /** Conducta clave que aborda */
  targetKeyBehaviorId: string;

  /** Tipo: reducir problema o incrementar conducta objetivo */
  type: 'reduce_problem' | 'increase_target' | 'build_skill';

  /** Criterio de éxito numérico concreto */
  successCriterion: MeasurableCriterion;

  /** Objetivos intermedios (sub-metas progresivas) */
  intermediateObjectives: IntermediateObjective[];

  /** Estado */
  status: ObjectiveStatus;

  /** Progreso actual hacia el criterio final */
  currentProgress: ProgressSnapshot;

  /** Origen del objetivo */
  origin: ObjectiveOrigin;
}

export type ObjectiveStatus =
  | 'proposed'       // Sistema lo propuso, usuario no ha visto
  | 'negotiating'    // Usuario quiere ajustarlo
  | 'accepted'       // Usuario aceptó
  | 'active'         // En ejecución (al menos 1 intermedio activo)
  | 'achieved'       // Criterio de éxito cumplido
  | 'not_achieved'   // Revisión: no se cumplió en el plazo
  | 'adjusted'       // Se modificó (el original se archiva)
  | 'removed';       // Usuario o sistema decidió quitarlo

// ─────────────────────────────────────────────
// Objetivo Intermedio (Sub-meta)
// ─────────────────────────────────────────────
// "Objetivos cuya consecución permite el acercamiento
//  progresivo a la meta final" — Ruiz, Díaz & Villalobos

export interface IntermediateObjective {
  id: string;

  /** Descripción legible */
  description: string;

  /** Orden dentro del objetivo final (1 = primero) */
  order: number;

  /** Técnica TCC asignada */
  technique: TechniqueAssignment;

  /** Criterio de éxito numérico */
  successCriterion: MeasurableCriterion;

  /** Plazo para conseguirlo */
  timeframe: Timeframe;

  /** Prerrequisitos (IDs de otros intermedios que deben completarse antes) */
  prerequisites: string[];

  /** Estado */
  status: ObjectiveStatus;

  /** Progreso actual */
  currentProgress: ProgressSnapshot;

  /** Relación con tareas concretas de HomeFlow */
  taskMapping: TaskMapping;

  /** Origen */
  origin: ObjectiveOrigin;

  /** Evaluaciones realizadas */
  evaluations: ObjectiveEvaluation[];
}

// ─────────────────────────────────────────────
// Criterio Medible (Numérico concreto)
// ─────────────────────────────────────────────

export interface MeasurableCriterion {
  /** Qué medimos */
  metric: MetricType;

  /** Alcance de la medición */
  scope: MetricScope;

  /** Valor de línea base (de dónde partimos) */
  baseline: number;

  /** Valor objetivo (a dónde queremos llegar) */
  target: number;

  /** Dirección del cambio esperado */
  direction: 'increase' | 'decrease';

  /** Unidad de medida */
  unit: MetricUnit;

  /** ¿Cómo se recolecta la medida? */
  dataSource: MetricDataSource;

  /** Umbral de significación clínica (% de cambio mínimo para considerar mejora) */
  clinicalSignificanceThreshold: number;
}

export type MetricType =
  | 'avoidance_rate'          // % de tareas evitadas/rechazadas vs presentadas
  | 'completion_rate'         // % de tareas completadas vs intentadas
  | 'completion_frequency'    // Nº de tareas completadas por período
  | 'avoidance_frequency'     // Nº de evitaciones por período
  | 'cascade_frequency'       // Nº de cascadas de evitación por período
  | 'average_mood_post_task'  // Mood promedio después de completar tarea
  | 'mood_improvement'        // Diferencia promedio mood before/after
  | 'technique_usage'         // Nº de veces que usa técnica TCC por período
  | 'technique_effectiveness' // % de veces que técnica mejora mood
  | 'exposure_tolerance'      // Tiempo promedio en tarea antes de abandonar (minutos)
  | 'chain_strength'          // Fuerza del ciclo de mantenimiento (0-100)
  | 'cognitive_reframe_success' // % de reestructuraciones que reducen intensidad emocional
  | 'days_active'             // Días con al menos 1 tarea completada por período
  | 'downsizing_rate';        // % de tareas donde usó "necesito algo más pequeño"

export interface MetricScope {
  /** Categoría de tarea (si aplica) */
  taskCategory?: string;
  /** Habitación (si aplica) */
  room?: string;
  /** Tipo de conducta específico */
  behaviorType?: string;
  /** Técnica específica */
  technique?: string;
  /** Cadena consolidada específica */
  chainId?: number;
}

export type MetricUnit =
  | 'percentage'          // 0-100%
  | 'count_per_week'      // N por semana
  | 'count_per_day'       // N por día
  | 'minutes'             // Minutos
  | 'score_1_5'           // Escala 1-5
  | 'score_0_100'         // Escala 0-100
  | 'days_per_week';      // Días por semana

export type MetricDataSource =
  | 'automatic_sequences'   // Calculado desde FunctionalSequences
  | 'automatic_tasks'       // Calculado desde TaskCompletions
  | 'automatic_barriers'    // Calculado desde BarrierLogs
  | 'weekly_reflection'     // Reportado por usuario en reflexión semanal
  | 'daily_checkin'         // Reportado en check-in diario
  | 'thought_records'       // Calculado desde ThoughtRecords
  | 'hybrid';              // Combinación automático + reporte

// ─────────────────────────────────────────────
// Técnica asignada
// ─────────────────────────────────────────────

export interface TechniqueAssignment {
  /** Técnica TCC */
  technique: string; // TCCTechnique from database.ts

  /** Razón por la que se asigna esta técnica */
  rationale: string;

  /** Factor de mantenimiento que aborda */
  targetedFactor: string;

  /** Pasos concretos para el usuario */
  steps: string[];

  /** Evidencia de efectividad previa (si existe) */
  priorEffectiveness?: {
    timesUsed: number;
    averageImpact: number;
    bestContext: string;
  };
}

// ─────────────────────────────────────────────
// Temporalidad
// ─────────────────────────────────────────────

export interface Timeframe {
  /** Duración estimada en semanas */
  estimatedWeeks: number;

  /** Fecha de inicio */
  startDate?: Date;

  /** Fecha límite (soft — no punitiva) */
  targetDate?: Date;

  /** ¿Se puede extender? Siempre sí, pero con re-evaluación */
  extensionPolicy: 'auto_extend_with_review' | 'review_required';
}

// ─────────────────────────────────────────────
// Progreso
// ─────────────────────────────────────────────

export interface ProgressSnapshot {
  /** Valor actual de la métrica */
  currentValue: number;

  /** % de avance hacia el target (0-100) */
  progressPercentage: number;

  /** Tendencia reciente */
  trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';

  /** Fecha de esta medición */
  measuredAt: Date;

  /** Velocidad de cambio (unidades por semana) */
  rateOfChange: number;

  /** Proyección: ¿cuándo alcanzaría el objetivo al ritmo actual? */
  projectedCompletionDate?: Date;
}

export interface PlanProgress {
  /** % de objetivos intermedios completados */
  intermediatesCompleted: number;
  intermediatesTotal: number;

  /** % de objetivos finales alcanzados */
  finalsAchieved: number;
  finalsTotal: number;

  /** Tendencia global */
  overallTrend: 'improving' | 'stable' | 'worsening' | 'mixed';

  /** Semanas activas */
  weeksActive: number;

  /** Adherencia: % de evaluaciones completadas */
  evaluationAdherence: number;
}

// ────────────────────────────────────────────────
// Evaluación de objetivos
// ─────────────────────────────────────────────

export interface ObjectiveEvaluation {
  /** Fecha de evaluación */
  evaluatedAt: Date;

  /** Valor medido */
  measuredValue: number;

  /** ¿Se alcanzó el criterio? */
  criterionMet: boolean;

  /** Veredicto */
  verdict: EvaluationVerdict;

  /** Decisión tomada */
  decision: EvaluationDecision;

  /** Contexto (qué pasó esa semana) */
  contextNotes?: string;

  /** ¿El usuario participó en esta evaluación? */
  userParticipated: boolean;
}

export type EvaluationVerdict =
  | 'achieved'           // Criterio cumplido
  | 'progressing'        // Mejorando, no cumplido aún
  | 'stalled'            // Sin cambio significativo
  | 'regressing'         // Empeorando
  | 'insufficient_data'; // No hay datos suficientes

export type EvaluationDecision =
  | 'continue'                   // Seguir con el objetivo actual
  | 'advance_next_intermediate'  // Avanzar al siguiente objetivo intermedio
  | 'advance_achieved'           // Objetivo final alcanzado, cerrar
  | 'extend_timeframe'           // Dar más tiempo
  | 'adjust_target_easier'       // Hacer el objetivo más fácil
  | 'adjust_target_harder'       // Hacer el objetivo más ambicioso
  | 'change_technique'           // Cambiar la técnica asignada
  | 'pause_objective'            // Pausar (e.g. por crisis)
  | 'remove_objective';          // Quitar objetivo

// ─────────────────────────────────────────────
// Co-construcción
// ─────────────────────────────────────────────

export interface CoConstructionLog {
  /** Eventos de co-construcción */
  events: CoConstructionEvent[];

  /** ¿El usuario ha validado el plan actual? */
  userValidated: boolean;
  validatedAt?: Date;

  /** Número de revisiones que ha hecho el usuario */
  userRevisionCount: number;
}

export interface CoConstructionEvent {
  timestamp: Date;
  type: CoConstructionEventType;
  objectiveId?: string;

  /** Qué propuso el sistema */
  systemProposal?: string;
  /** Qué eligió/ajustó el usuario */
  userChoice?: string;
  /** Razón del ajuste */
  reason?: string;
}

export type CoConstructionEventType =
  | 'plan_proposed'              // Sistema propuso plan completo
  | 'plan_accepted'              // Usuario aceptó plan tal cual
  | 'objective_accepted'         // Usuario aceptó un objetivo
  | 'objective_modified'         // Usuario modificó un objetivo
  | 'objective_rejected'         // Usuario rechazó un objetivo
  | 'objective_added_by_user'    // Usuario añadió objetivo propio
  | 'target_adjusted'            // Usuario ajustó valor target
  | 'technique_changed'          // Usuario pidió cambiar técnica
  | 'plan_revision_requested'    // Usuario pidió revisar plan
  | 'evaluation_participated'    // Usuario participó en evaluación
  | 'user_deferred_all';         // Usuario aplazó todos los objetivos

// ─────────────────────────────────────────────
// Configuración de evaluación
// ─────────────────────────────────────────────

export interface EvaluationConfig {
  /** Frecuencia de evaluación */
  frequency: 'weekly' | 'biweekly';

  /** ¿Integrada en weekly_reflection? */
  integratedInReflection: boolean;

  /** Máximo de objetivos a evaluar por sesión (carga cognitiva) */
  maxObjectivesPerSession: number;

  /** ¿Mostrar números exactos al usuario o solo tendencia? */
  showExactMetrics: boolean;

  /** ¿Permitir auto-extensión de plazos? */
  autoExtendOnProgress: boolean;
}

// ─────────────────────────────────────────────
// Origen y referencia
// ─────────────────────────────────────────────

export interface ObjectiveOrigin {
  /** Quién lo propuso */
  proposedBy: 'system' | 'user';

  /** Si fue sistema: de qué dato lo derivó */
  derivedFrom?: {
    keyBehaviorId?: string;
    chainId?: number;
    maintenanceFactorId?: string;
    formulationInsight?: string;
  };

  /** ¿Fue modificado respecto a la propuesta original? */
  wasModified: boolean;

  /** Propuesta original (si fue modificado) */
  originalProposal?: string;
}

export interface KeyBehaviorReference {
  keyBehaviorId: string;
  name: string;
  priorityScore: number;
}

// ─────────────────────────────────────────────
// Task mapping
// ─────────────────────────────────────────────

export interface TaskMapping {
  /** Categorías de tarea que avanzan este objetivo */
  relevantCategories: string[];

  /** Habitaciones relevantes */
  relevantRooms: string[];

  /** Niveles de dificultad apropiados para el estado actual */
  appropriateDifficulties: ('very_low' | 'low' | 'medium' | 'high')[];

  /** ¿Se necesita tarea específica o cualquiera de la categoría? */
  specificity: 'any_in_category' | 'specific_room' | 'specific_task';
}

// ─────────────────────────────────────────────
// Helpers de creación
// ─────────────────────────────────────────────

export function createEmptyPlan(userId: string, formulationVersion: number): InterventionPlan {
  return {
    userId,
    version: 1,
    status: 'draft',
    finalObjectives: [],
    sourceFormulationVersion: formulationVersion,
    sourceKeyBehaviors: [],
    coConstruction: {
      events: [],
      userValidated: false,
      userRevisionCount: 0,
    },
    overallProgress: {
      intermediatesCompleted: 0,
      intermediatesTotal: 0,
      finalsAchieved: 0,
      finalsTotal: 0,
      overallTrend: 'stable',
      weeksActive: 0,
      evaluationAdherence: 0,
    },
    evaluationConfig: {
      frequency: 'weekly',
      integratedInReflection: true,
      maxObjectivesPerSession: 2,
      showExactMetrics: true,
      autoExtendOnProgress: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateObjectiveId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
