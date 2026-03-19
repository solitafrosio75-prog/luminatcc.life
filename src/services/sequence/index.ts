// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════
// Sistema de Planes de Intervención
// ═══════════════════════════════════════════════════════════════════
//
// Fase 4 del proceso de evaluación conductual:
// "Propuesta de intervención basada en el paso anterior"
//
// Exporta todos los componentes necesarios para trabajar con planes
// de intervención: tipos, generador, evaluador, servicios y operaciones DB.
//
// ═══════════════════════════════════════════════════════════════════

// ─── TIPOS ───
export * from './interventionPlanTypes';

// ─── GENERADOR ───
export {
  generateInterventionPlan,
  regeneratePlanFromNewFormulation,
  type PlanGenerationInput,
} from './InterventionPlanGenerator';

// ─── EVALUADOR ───
export {
  evaluatePlan,
  type EvaluationInput,
  type EvaluationResult,
  type ObjectiveSummary,
  type PlanSummary,
  type AutoDecision,
} from './InterventionPlanEvaluator';

// ─── OPERACIONES DB ───
export {
  // CRUD básico
  createInterventionPlan,
  getActivePlan,
  getLatestPlan,
  getPlanById,
  getAllPlans,
  updatePlan,
  updatePlanStatus,
  
  // Evaluaciones
  saveObjectiveEvaluation,
  getObjectiveEvaluations,
  
  // Queries
  getActiveObjectives,
  getObjectivesByType,
  hasActivePlan,
  countPlansByStatus,
  
  // Gestión
  archivePlan,
  deletePlan,
  
  // Estadísticas
  getUserPlanStats,
} from '../../db/operations/interventionPlanOperations';

// ─── SERVICIO DE ALTO NIVEL ───
export {
  // Generación
  generatePlanForUser,
  regeneratePlan,
  
  // Evaluación
  evaluateUserPlan,
  
  // Gestión
  activatePlan,
  pausePlan,
  resumePlan,
  completePlan,
  abandonPlan,
  
  // Queries
  getCurrentPlan,
  shouldEvaluatePlan,
  getPlanStats,
  needsNewPlan,
} from '../../features/evaluation/services/InterventionPlanService';

// ─── RECOLECCIÓN DE LÍNEA BASE ───
export {
  collectBaseline,
  getBaselineValue,
  getBaselineDailyValues,
  type BaselineSnapshot,
  type BaselineMetricRecord,
  type MetricStatistics,
  type DailyMetricValue,
  type BaselineValidity,
  type BaselineIssue,
  type BaselineConfig,
} from './BaselineCollector';

// ─── EVALUACIÓN DE CAMBIO (Significación Clínica) ───
export {
  evaluateChange,
  type ChangeReport,
  type MetricComparison,
  type ReliableChangeResult,
  type ClinicalSignificanceResult,
  type ChangeCategory,
  type EffectSizeResult,
  type ObjectiveComparison,
  type GlobalChangeSummary,
} from './ChangeEvaluator';

// --- NORMAS FUNCIONALES (I7) ---
export {
  computeFunctionalNormsFromBaselines,
  resolveFunctionalNorms,
  type FunctionalNormsOptions,
} from './FunctionalNormsService';

// ─── MONITOREO DE SEGUIMIENTO ───
export {
  initializeFollowUp,
  runFollowUpCheckup,
  generateFollowUpSummary,
  type FollowUpState,
  type FollowUpStatus,
  type PeakMetricRecord,
  type FollowUpCheckup,
  type FollowUpMetricResult,
  type FollowUpAlert,
  type CheckupVerdict,
  type MaintenanceRecommendation,
  type FollowUpConfig,
  type FollowUpSummaryForUI,
} from './FollowUpMonitor';

// --- SERVICIO DE BASELINE (Fase 2) ---
export {
  BaselineService,
  BaselineStatus,
  type BaselineProgressState,
  type BaselineLifecycleEvent,
} from './BaselineService';

// --- SERVICIO DE ORQUESTACIÓN (Fase 3) ---
export {
  EvaluationLifecycleService,
  type EvaluationPhase,
  type LifecycleState,
  type PhaseTransition,
  type LifecycleEvent,
  type LifecycleEventType,
  type CycleConfig,
} from './EvaluationLifecycleService';