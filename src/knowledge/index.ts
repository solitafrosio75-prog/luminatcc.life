/**
 * knowledge/index.ts — API pública del sistema de conocimiento (v2)
 *
 * Importar este módulo registra automáticamente todas las técnicas y shared.
 */

// Registrar técnicas y shared (side-effect imports en registry.ts)
import './registry';

// Re-export tipos
export {
  KBArea,
  SharedArea,
  KB_AREA_LABELS,
  SHARED_KB_AREAS,
  AC_KB_AREAS,
  RC_KB_AREAS,
  DS_KB_AREAS,
  EXP_KB_AREAS,
  MC_KB_AREAS,
  ACT_KB_AREAS,
  DC_KB_AREAS,
  TREC_KB_AREAS,
  MINDFULNESS_KB_AREAS,
} from './types';

export type {
  TechniqueId,
  TechniqueManifest,
  AreaSlot,
  AreaData,
  AreaDataMap,
  SharedAreaData,
  SharedAreaDataMap,
  ACAreaData,
  RCAreaData,
  DSAreaData,
  EXPAreaData,
  MCAreaData,
  ACTAreaData,
  DCAreaData,
  TRECAreaData,
  MindfulnessAreaData,
} from './types';

// Re-export hooks
export {
  useKnowledgeArea,
  useKnowledgeAreas,
  useSharedKnowledge,
  useKnowledgePreload,
} from './loaders/useKnowledge';

// Re-export store
export { useKnowledgeStore } from './loaders/knowledge.store';

// Re-export registry
export {
  getTechniqueManifest,
  getRegisteredTechniques,
  getCoreTechniques,
} from './registry';

// Re-export v3 resolver (profile + procedures por tecnica)
export {
  getV3Techniques,
  isTechniqueV3Ready,
  getTechniqueV3Package,
  preloadTechniqueV3Packages,
} from './v3/resolver';

export type {
  V3TechniqueId,
  TechniqueV3Package,
} from './v3/resolver';

// ── Inventarios administrables ─────────────────────────────────────────────
export {
  BDI_II_DEFINITION,
  bdiIIEngine,
  INVENTORY_REGISTRY,
  getInventoryDefinition,
  getAvailableInventoryIds,
} from './inventories';

export type {
  InventoryDefinition,
  InventoryAdministration,
  InventoryResult,
  InventoryEngine,
  CriticalItemAlert,
  ChangeAnalysis,
  ChangeCategory,
  ItemResponse,
  AdministrationStatus,
} from './inventories';

// Re-export preloads
export {
  PRELOAD_ASSESSMENT,
  PRELOAD_INTERVIEW,
  PRELOAD_PSYCHOEDUCATION,
  PRELOAD_SESSION_FULL,
  PRELOAD_AC_PLANNING,
  PRELOAD_RC_COGNITIVE,
  PRELOAD_DS_DESENSIBILIZACION,
  PRELOAD_EXP_EXPOSICION,
  PRELOAD_MC_MODIFICACION,
  PRELOAD_ACT_FLEXIBILIDAD,
  PRELOAD_DC_HABILIDADES,
  PRELOAD_TREC_RACIONAL,
  PRELOAD_MINDFULNESS_PRACTICA,
} from './preloads';

// ── Módulo Paciente y flujos clínicos ─────────────────────────────────────
export * from './patient/patient.types';
export * from './patient/change.analysis';
// patient.store.ts eliminado — dependía de sqlite.ts (Node-only, código muerto en browser)
export * from './session/session.orchestrator';
export * from './session/first.session.ac';
export * from './session/intermediate.session.ac';
// ...agregar exports de terapeuta y procedimientos cuando estén listos...
