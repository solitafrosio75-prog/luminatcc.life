/**
 * inventories/index.ts — API pública del subsistema de inventarios administrables
 *
 * Exporta tipos, definiciones y motores de todos los inventarios disponibles.
 * Separación: definición estática + motor de scoring (puro) + tipos de administración.
 *
 * La persistencia de instancias (InventoryAdministration) es responsabilidad
 * del Módulo Paciente (store Zustand), no de este módulo.
 */

// ── Tipos ──────────────────────────────────────────────────────────────────
export type {
  AdminInventoryId,
  ResponseFormat,
  ScoringDirection,
  ResponseOption,
  SeverityLevel,
  CriticalItem,
  Subscale,
  ValidityCriterion,
  ClinicalChangeRule,
  InventoryItem,
  InventoryDefinition,
  AdministrationStatus,
  ItemResponse,
  InventoryAdministration,
  CriticalItemAlert,
  SubscaleResult,
  InventoryResult,
  ChangeCategory,
  ChangeAnalysis,
  InventoryEngine,
} from './types/inventory_types';

// ── Definiciones ───────────────────────────────────────────────────────────
export { BDI_II_DEFINITION } from './definitions/bdi_ii_definition';
export { BADS_DEFINITION } from './definitions/bads.definition';
export { PHQ_9_DEFINITION } from './definitions/phq_9.definition';
export { DAS_DEFINITION } from './definitions/das.definition';
export { SCL_90_R_DEFINITION } from './definitions/scl_90_r.definition';

// ── Motores ────────────────────────────────────────────────────────────────
export { bdiIIEngine } from './engines/bdi_ii.engine';
export { badsEngine } from './engines/bads.engine';
export { phq9Engine } from './engines/phq_9.engine';
export { dasEngine } from './engines/das.engine';
export { scl90rEngine } from './engines/scl_90_r.engine';

// ── Registry de inventarios disponibles ───────────────────────────────────

import type { InventoryDefinition } from './types/inventory_types';
import { BDI_II_DEFINITION } from './definitions/bdi_ii_definition';
import { BADS_DEFINITION } from './definitions/bads.definition';
import { PHQ_9_DEFINITION } from './definitions/phq_9.definition';
import { DAS_DEFINITION } from './definitions/das.definition';
import { SCL_90_R_DEFINITION } from './definitions/scl_90_r.definition';

/**
 * Mapa de todos los inventarios registrados.
 * Clave: inventory_id (ej: "bdi_ii")
 */
export const INVENTORY_REGISTRY: Record<string, InventoryDefinition> = {
  bdi_ii: BDI_II_DEFINITION,
  bads: BADS_DEFINITION,
  phq_9: PHQ_9_DEFINITION,
  das: DAS_DEFINITION,
  scl_90_r: SCL_90_R_DEFINITION,
};

/**
 * Devuelve la definición de un inventario por ID.
 * Devuelve undefined si el inventario no está registrado.
 */
export function getInventoryDefinition(id: string): InventoryDefinition | undefined {
  return INVENTORY_REGISTRY[id];
}

/**
 * Lista de IDs de inventarios disponibles.
 */
export function getAvailableInventoryIds(): string[] {
  return Object.keys(INVENTORY_REGISTRY);
}
