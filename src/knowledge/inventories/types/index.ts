// inventories/types/index.ts — Barrel exports del sistema de inventarios

export type {
  // Primitivos
  AdminInventoryId,
  ResponseFormat,
  ScoringDirection,
  ResponseOption,
  // Definición estática
  SeverityLevel,
  CriticalItem,
  Subscale,
  ValidityCriterion,
  ClinicalChangeRule,
  InventoryItem,
  InventoryDefinition,
  // Administración dinámica
  AdministrationStatus,
  ItemResponse,
  InventoryAdministration,
  // Resultados
  CriticalItemAlert,
  SubscaleResult,
  InventoryResult,
  // Análisis de cambio
  ChangeCategory,
  ChangeAnalysis,
  // Motor
  InventoryEngine,
} from './inventory_types';
