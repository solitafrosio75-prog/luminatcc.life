/**
 * inventory_types.ts — Sistema unificado de inventarios administrables
 *
 * Contrato único para los 3 inventarios (BDI-II, BADS, PHQ-9).
 * Todos los engines, definiciones y tests compilan contra estos tipos.
 *
 * Principios:
 * 1. Separación DEFINICIÓN (estática) ↔ ADMINISTRACIÓN (instancia)
 * 2. Campos opcionales donde no todos los inventarios los necesitan
 * 3. Nombres de campo = lo que el runtime realmente lee/escribe
 * 4. Los ítems son descriptores de contenido clínico, NO texto literal
 *    del instrumento (por restricciones de copyright)
 */

// ============================================================================
// DEFINICIÓN DEL INSTRUMENTO — lo que "es" el inventario (estático)
// ============================================================================

/** Identificadores de inventarios administrables */
export type AdminInventoryId = 'bdi_ii' | 'bads' | 'phq_9' | 'das' | 'scl_90_r';

/** Formato de respuesta de cada ítem */
export type ResponseFormat =
  | 'likert_0_3'
  | 'likert_0_4'
  | 'likert_0_6'
  | 'likert_0_3_freq'
  | 'boolean'
  | 'custom';

/** Dirección de puntuación */
export type ScoringDirection = 'direct' | 'inverse';

/** Opción de respuesta para un ítem */
export interface ResponseOption {
  value: number;
  label: string;
}

/** Nivel de severidad interpretable */
export interface SeverityLevel {
  label: string;
  range_min: number;
  range_max: number;
  color_code?: string;
  clinical_implication?: string;
  action_suggested?: string;
}

/** Ítem crítico — requiere atención especial independientemente del total */
export interface CriticalItem {
  item_number: number;
  domain: string;
  /** Descriptor semántico extendido del dominio (complementa `domain`) */
  domain_descriptor?: string;
  threshold: number;
  alert_level: 'warning' | 'urgent' | 'emergency';
  protocol_action: string;
  protocol_ref?: string;
}

/** Subescala del instrumento */
export interface Subscale {
  id: string;
  name: string;
  item_numbers: number[];
  scoring_direction?: ScoringDirection;
  range_min?: number;
  range_max?: number;
  severity_levels?: SeverityLevel[];
  clinical_meaning?: string;
  cutoffs?: Array<{ min: number; max: number; label: string; clinical_note: string }>;
}

/** Criterio de validez de respuestas */
export interface ValidityCriterion {
  id: string;
  name: string;
  detection_rule: string;
  threshold_description: string;
  action_if_detected: string;
}

/** Regla de cambio clínicamente significativo */
export interface ClinicalChangeRule {
  method: string;
  description: string;
  reliable_change_index?: number;
  clinical_cutoff?: number;
  minimal_important_difference?: number;
}

/** Definición de un ítem individual */
export interface InventoryItem {
  id: number;
  domain_descriptor: string;
  options: ResponseOption[];
  scoring_direction?: ScoringDirection;
  is_critical?: boolean;
  subscale?: string;
  subscale_ids?: string[];
  critical_threshold?: number;
  clinical_note?: string;
}

/** Definición completa de un instrumento administrable */
export interface InventoryDefinition {
  id: AdminInventoryId;
  name: string;
  acronym: string;
  version: string;
  purpose: string;
  authors?: string;
  year?: number;
  target_population?: string;
  administration_time?: string;
  total_items?: number;
  response_format?: ResponseFormat;

  instructions_patient?: string;
  instructions_clinician?: string;

  items: InventoryItem[];
  subscales?: Subscale[];

  score_range?: { min: number; max: number };
  severity_levels: SeverityLevel[];
  critical_items: CriticalItem[];

  validity_criteria?: ValidityCriterion[];
  clinical_change?: ClinicalChangeRule;

  recommended_frequency?: string;
  recommended_sessions?: string;
  complementary_instruments?: AdminInventoryId[];
  technique_relevance?: Record<string, string>;

  trace_sources?: string[];
  sources?: string[];
  copyright_note?: string;
}

// ============================================================================
// INSTANCIA DE APLICACIÓN — una administración concreta a un paciente
// ============================================================================

/** Respuesta individual a un ítem */
export interface ItemResponse {
  item_id: number;
  value: number | null;
  answered_at?: string | null;
  response_time_ms?: number;
}

/** Estado de una administración */
export type AdministrationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

/** Instancia de una administración de un inventario */
export interface InventoryAdministration {
  id: string;
  inventory_id: string;
  patient_id: string;
  session_id?: string;
  session_number: number;
  phase?: string;
  status: AdministrationStatus | string;
  started_at: string;
  completed_at: string | null;
  responses: ItemResponse[];
}

// ============================================================================
// RESULTADOS — output de los motores de scoring
// ============================================================================

/** Alerta generada por un ítem crítico */
export interface CriticalItemAlert {
  item_id: number;
  value: number;
  domain_descriptor: string;
  urgency: 'moderate' | 'high' | 'critical';
}

/** Resultado de una subescala */
export interface SubscaleResult {
  id: string;
  name?: string;
  score: number;
  raw_score?: number;
  direction?: string;
  items_answered?: number;
  items_total?: number;
  severity_label?: string;
}

/** Resultado completo de scoring */
export interface InventoryResult {
  administration_id: string;
  inventory_id: string;
  total_score: number;
  severity_label: string;
  clinical_note: string;
  subscale_results: SubscaleResult[];
  critical_alerts: CriticalItemAlert[];
  is_valid: boolean;
  invalidity_reason?: string;
  scored_at: string;
}

/** Análisis de cambio entre administraciones */
export interface ChangeAnalysis {
  category: 'recovered' | 'improved' | 'unchanged' | 'deteriorated';
  clinical_interpretation: string;
  baseline_score?: number;
  current_score?: number;
  raw_change?: number;
  reliable_change_index?: number;
  is_reliable_change?: boolean;
}

/** Categoría de cambio */
export type ChangeCategory = ChangeAnalysis['category'];

// ============================================================================
// MOTOR DE SCORING — funciones puras que procesan las respuestas
// ============================================================================

/**
 * Interfaz para el motor de puntuación de cada inventario.
 * Función pura: recibe administración + definición, devuelve resultados.
 */
export interface InventoryEngine {
  checkCriticalItems(
    administration: InventoryAdministration,
    definition: InventoryDefinition
  ): CriticalItemAlert[];

  checkValidity(
    administration: InventoryAdministration,
    definition: InventoryDefinition
  ): { is_valid: boolean; reason?: string };

  score(
    administration: InventoryAdministration,
    definition: InventoryDefinition
  ): InventoryResult;

  analyzeChange(
    baseline: InventoryAdministration,
    current: InventoryAdministration,
    definition: InventoryDefinition
  ): ChangeAnalysis;

  generateInsights?(
    result: InventoryResult,
    definition: InventoryDefinition,
    administration?: InventoryAdministration
  ): string[];
}
