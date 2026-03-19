/**
 * areas.types.ts — Interfaces para áreas COMPARTIDAS de conocimiento
 *
 * Estas 10 áreas son comunes a todas las técnicas terapéuticas.
 * Las áreas específicas de cada técnica están en ac.types.ts, rc.types.ts, etc.
 *
 * Cada interfaz usa un area_id discriminante para type-safety.
 */

import { KBArea } from './technique.types';
import type { ACAreasVitalesData, ACValoresReforzadoresData, ACActividadesPorProblemaData } from './ac.types';
import type { RCDistorsionesCognitivasData, RCRegistroPensamientosData, RCCreenciasNuclearesData, RCExperimentosConductualesData } from './rc.types';
import type { DSJerarquiaAnsiedadData, DSRelajacionData, DSProcesoDesensibilizacionData } from './ds.types';
import type { EXPJerarquiaExposicionData, EXPPrevencionRespuestaData, EXPProcesoExposicionData } from './exposicion.types';
import type { MCAnalisisFuncionalData, MCProgramasReforzamientoData, MCTecnicasOperantesData } from './modificacion_conducta.types';
import type { ACTHexaflexData, ACTDefusionCognitivaData, ACTValoresAccionData } from './act.types';
import type { DCRegulacionEmocionalData, DCToleranciaMalestarData, DCEfectividadInterpersonalData } from './dc.types';
import type { TRECCreenciasIrracionalesData, TRECDisputacionData, TRECModeloABCDEData } from './trec.types';
import type { MindfulnessPracticasFormalesData, MindfulnessPracticasInformalesData, MindfulnessAplicacionesClinicasData } from './mindfulness.types';

// ============================================================================
// Base común a todas las áreas
// ============================================================================

export interface BaseAreaData {
  area_id: KBArea;
  nombre: string;
  descripcion: string;
  fuentes: string[];
}

// ============================================================================
// Conocimiento — Fundamentos teóricos y evidencia
// ============================================================================

export interface ConocimientoData extends BaseAreaData {
  area_id: KBArea.CONOCIMIENTO;
  fundamentos_teoricos: {
    definicion: string;
    origenes_historicos: { autor: string; aportacion: string }[];
    modelo_explicativo: string;
    mecanismo_de_cambio: string;
  };
  principios_clave: { principio: string; explicacion: string }[];
  evidencia_cientifica: {
    metaanalisis: string[];
    eficacia_comparativa: string;
    poblaciones_estudiadas: string[];
  };
}

// ============================================================================
// Objetivos Clínicos — Indicaciones y contraindicaciones
// ============================================================================

export interface ObjetivosClinicosData extends BaseAreaData {
  area_id: KBArea.OBJETIVOS_CLINICOS;
  indicaciones: {
    trastorno: string;
    nivel_evidencia: 'alta' | 'moderada' | 'emergente';
    notas: string;
  }[];
  contraindicaciones: {
    condicion: string;
    razon: string;
    alternativa: string;
  }[];
}

// ============================================================================
// Herramientas de Evaluación
// ============================================================================

export interface HerramientasEvaluacionData extends BaseAreaData {
  area_id: KBArea.HERRAMIENTAS_EVALUACION;
  herramientas: {
    id: string;
    nombre: string;
    tipo: string; // Libre por técnica: 'inventario'|'registro' en AC, 'autoregistro'|'escala' en RC
    proposito: string;
    cuando_usar: string;
    descripcion_formato: string;
    variables?: { nombre: string; tipo: string; instruccion: string }[];
    referencia_shared?: string;
  }[];
}

// ============================================================================
// Ejercicios y Tareas
// ============================================================================

export interface EjerciciosTareasData extends BaseAreaData {
  area_id: KBArea.EJERCICIOS_TAREAS;
  ejercicios: {
    id: string;
    nombre: string;
    tipo: string; // Libre: 'monitoreo'|'programacion' en AC, 'registro_pensamiento'|'dialogo_socratico' en RC
    objetivo: string;
    instrucciones: string[];
    frecuencia: string;
    ejemplo: string;
  }[];
}

// ============================================================================
// Recursos y Materiales
// ============================================================================

export interface RecursosMaterialesData extends BaseAreaData {
  area_id: KBArea.RECURSOS_MATERIALES;
  recursos: {
    id: string;
    tipo: string;
    titulo: string;
    autor: string;
    descripcion: string;
    uso_clinico: string;
  }[];
}

// ============================================================================
// Técnicas Específicas
// ============================================================================

export interface TecnicasEspecificasData extends BaseAreaData {
  area_id: KBArea.TECNICAS_ESPECIFICAS;
  tecnicas: {
    id: string;
    nombre: string;
    descripcion: string;
    cuando_usar: string;
    pasos: string[];
    ejemplo_clinico: string;
  }[];
}

// ============================================================================
// Estructura de Sesiones
// ============================================================================

export interface EstructuraSesionesData extends BaseAreaData {
  area_id: KBArea.ESTRUCTURA_SESIONES;
  total_sesiones: string;
  frecuencia: string;
  bloques: {
    nombre: string;
    sesiones: string;
    objetivos: string[];
    actividades_principales: string[];
  }[];
}

// ============================================================================
// Barreras
// ============================================================================

export interface BarrerasData extends BaseAreaData {
  area_id: KBArea.BARRERAS;
  barreras: {
    nombre: string;
    descripcion: string;
    ejemplo_paciente: string;
    estrategia_manejo: string;
  }[];
}

// ============================================================================
// Habilidades del Terapeuta
// ============================================================================

export interface HabilidadesTerapeutaData extends BaseAreaData {
  area_id: KBArea.HABILIDADES_TERAPEUTA;
  habilidades: {
    nombre: string;
    descripcion: string;
    importancia: string;
    como_desarrollar: string;
  }[];
}

// ============================================================================
// Síntomas y Problemas
// ============================================================================

export interface SintomasProblemasData extends BaseAreaData {
  area_id: KBArea.SINTOMAS_PROBLEMAS;
  trastornos: {
    nombre: string;
    sintomas_principales: string[];
    como_se_manifiesta_en_conducta: string;
    foco_intervencion: string;
  }[];
}

// ============================================================================
// Discriminated Union — todos los tipos de área (compartidas + específicas)
// ============================================================================

export type AreaData =
  // Compartidas
  | ConocimientoData
  | ObjetivosClinicosData
  | HerramientasEvaluacionData
  | EjerciciosTareasData
  | RecursosMaterialesData
  | TecnicasEspecificasData
  | EstructuraSesionesData
  | BarrerasData
  | HabilidadesTerapeutaData
  | SintomasProblemasData
  // AC
  | ACAreasVitalesData
  | ACValoresReforzadoresData
  | ACActividadesPorProblemaData
  // RC
  | RCDistorsionesCognitivasData
  | RCRegistroPensamientosData
  | RCCreenciasNuclearesData
  | RCExperimentosConductualesData
  // DS
  | DSJerarquiaAnsiedadData
  | DSRelajacionData
  | DSProcesoDesensibilizacionData
  // EXP
  | EXPJerarquiaExposicionData
  | EXPPrevencionRespuestaData
  | EXPProcesoExposicionData
  // MC
  | MCAnalisisFuncionalData
  | MCProgramasReforzamientoData
  | MCTecnicasOperantesData
  // ACT
  | ACTHexaflexData
  | ACTDefusionCognitivaData
  | ACTValoresAccionData
  // DC
  | DCRegulacionEmocionalData
  | DCToleranciaMalestarData
  | DCEfectividadInterpersonalData
  // TREC
  | TRECCreenciasIrracionalesData
  | TRECDisputacionData
  | TRECModeloABCDEData
  // Mindfulness
  | MindfulnessPracticasFormalesData
  | MindfulnessPracticasInformalesData
  | MindfulnessAplicacionesClinicasData;

// ============================================================================
// Type-safe map: KBArea → tipo exacto de su data
// ============================================================================

export interface AreaDataMap {
  // Compartidas
  [KBArea.CONOCIMIENTO]:            ConocimientoData;
  [KBArea.OBJETIVOS_CLINICOS]:      ObjetivosClinicosData;
  [KBArea.HERRAMIENTAS_EVALUACION]: HerramientasEvaluacionData;
  [KBArea.EJERCICIOS_TAREAS]:       EjerciciosTareasData;
  [KBArea.RECURSOS_MATERIALES]:     RecursosMaterialesData;
  [KBArea.TECNICAS_ESPECIFICAS]:    TecnicasEspecificasData;
  [KBArea.ESTRUCTURA_SESIONES]:     EstructuraSesionesData;
  [KBArea.BARRERAS]:                BarrerasData;
  [KBArea.HABILIDADES_TERAPEUTA]:   HabilidadesTerapeutaData;
  [KBArea.SINTOMAS_PROBLEMAS]:      SintomasProblemasData;
  // AC
  [KBArea.AC_AREAS_VITALES]:            ACAreasVitalesData;
  [KBArea.AC_VALORES_REFORZADORES]:     ACValoresReforzadoresData;
  [KBArea.AC_ACTIVIDADES_POR_PROBLEMA]: ACActividadesPorProblemaData;
  // RC
  [KBArea.RC_DISTORSIONES_COGNITIVAS]:   RCDistorsionesCognitivasData;
  [KBArea.RC_REGISTRO_PENSAMIENTOS]:     RCRegistroPensamientosData;
  [KBArea.RC_CREENCIAS_NUCLEARES]:       RCCreenciasNuclearesData;
  [KBArea.RC_EXPERIMENTOS_CONDUCTUALES]: RCExperimentosConductualesData;
  // DS
  [KBArea.DS_JERARQUIA_ANSIEDAD]:        DSJerarquiaAnsiedadData;
  [KBArea.DS_RELAJACION]:                DSRelajacionData;
  [KBArea.DS_PROCESO_DESENSIBILIZACION]: DSProcesoDesensibilizacionData;
  // EXP
  [KBArea.EXP_JERARQUIA_EXPOSICION]:  EXPJerarquiaExposicionData;
  [KBArea.EXP_PREVENCION_RESPUESTA]:  EXPPrevencionRespuestaData;
  [KBArea.EXP_PROCESO_EXPOSICION]:    EXPProcesoExposicionData;
  // MC
  [KBArea.MC_ANALISIS_FUNCIONAL]:      MCAnalisisFuncionalData;
  [KBArea.MC_PROGRAMAS_REFORZAMIENTO]: MCProgramasReforzamientoData;
  [KBArea.MC_TECNICAS_OPERANTES]:      MCTecnicasOperantesData;
  // ACT
  [KBArea.ACT_HEXAFLEX]:            ACTHexaflexData;
  [KBArea.ACT_DEFUSION_COGNITIVA]:  ACTDefusionCognitivaData;
  [KBArea.ACT_VALORES_ACCION]:      ACTValoresAccionData;
  // DC
  [KBArea.DC_REGULACION_EMOCIONAL]:       DCRegulacionEmocionalData;
  [KBArea.DC_TOLERANCIA_MALESTAR]:        DCToleranciaMalestarData;
  [KBArea.DC_EFECTIVIDAD_INTERPERSONAL]:  DCEfectividadInterpersonalData;
  // TREC
  [KBArea.TREC_CREENCIAS_IRRACIONALES]: TRECCreenciasIrracionalesData;
  [KBArea.TREC_DISPUTACION]:            TRECDisputacionData;
  [KBArea.TREC_MODELO_ABCDE]:           TRECModeloABCDEData;
  // Mindfulness
  [KBArea.MINDFULNESS_PRACTICAS_FORMALES]:    MindfulnessPracticasFormalesData;
  [KBArea.MINDFULNESS_PRACTICAS_INFORMALES]:  MindfulnessPracticasInformalesData;
  [KBArea.MINDFULNESS_APLICACIONES_CLINICAS]: MindfulnessAplicacionesClinicasData;
}
