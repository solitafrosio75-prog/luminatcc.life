// types/index.ts — Barrel exports para el sistema de tipos de conocimiento

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
  createEmptySlot,
} from './technique.types';

export type {
  TechniqueId,
  TechniqueManifest,
  AreaSlot,
  SlotStatus,
} from './technique.types';

// Áreas compartidas
export type {
  BaseAreaData,
  AreaData,
  AreaDataMap,
  ConocimientoData,
  ObjetivosClinicosData,
  HerramientasEvaluacionData,
  EjerciciosTareasData,
  RecursosMaterialesData,
  TecnicasEspecificasData,
  EstructuraSesionesData,
  BarrerasData,
  HabilidadesTerapeutaData,
  SintomasProblemasData,
} from './areas.types';

// Áreas AC
export type {
  ACAreasVitalesData,
  ACValoresReforzadoresData,
  ACActividadesPorProblemaData,
  ACAreaData,
} from './ac.types';

// Áreas RC
export type {
  RCDistorsionesCognitivasData,
  RCRegistroPensamientosData,
  RCCreenciasNuclearesData,
  RCExperimentosConductualesData,
  RCAreaData,
} from './rc.types';

// Áreas DS
export type {
  DSJerarquiaAnsiedadData,
  DSRelajacionData,
  DSProcesoDesensibilizacionData,
  DSAreaData,
} from './ds.types';

// Áreas EXP
export type {
  EXPJerarquiaExposicionData,
  EXPPrevencionRespuestaData,
  EXPProcesoExposicionData,
  EXPAreaData,
} from './exposicion.types';

// Áreas MC
export type {
  MCAnalisisFuncionalData,
  MCProgramasReforzamientoData,
  MCTecnicasOperantesData,
  MCAreaData,
} from './modificacion_conducta.types';

// Áreas ACT
export type {
  ACTHexaflexData,
  ACTDefusionCognitivaData,
  ACTValoresAccionData,
  ACTAreaData,
} from './act.types';

// Áreas DC
export type {
  DCRegulacionEmocionalData,
  DCToleranciaMalestarData,
  DCEfectividadInterpersonalData,
  DCAreaData,
} from './dc.types';

// Áreas TREC
export type {
  TRECCreenciasIrracionalesData,
  TRECDisputacionData,
  TRECModeloABCDEData,
  TRECAreaData,
} from './trec.types';

// Áreas Mindfulness
export type {
  MindfulnessPracticasFormalesData,
  MindfulnessPracticasInformalesData,
  MindfulnessAplicacionesClinicasData,
  MindfulnessAreaData,
} from './mindfulness.types';

// Transversales
export type {
  SharedAreaData,
  SharedAreaDataMap,
  InventariosGeneralesData,
  ProtocoloCrisisData,
  HabilidadesEntrevistaData,
  InventarioGeneral,
  HabilidadEntrevista,
} from './shared.types';

// Perfil de técnica (v3 candidate)
export type {
  EvidenceLevel,
  RiskLevel,
  Contraindication,
  SupervisionRequirement,
  EvidenceSummary,
  TechniqueProfile,
} from './profile.types';

// Procedimientos clínicos (v3 candidate)
export type {
  ProcedureInput,
  ProcedureStep,
  ProcedureSafety,
  ClinicalProcedure,
  ProcedureCatalog,
} from './procedure.types';

export { AREA_SCHEMAS, SHARED_SCHEMAS } from './schemas';
export {
  techniqueProfileSchema,
  contraindicationSchema,
  supervisionRequirementSchema,
  evidenceSummarySchema,
} from './schemas.profile';
export {
  procedureInputSchema,
  procedureStepSchema,
  procedureSafetySchema,
  clinicalProcedureSchema,
  procedureCatalogSchema,
} from './schemas.procedures';
