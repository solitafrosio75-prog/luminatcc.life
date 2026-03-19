/**
 * ds.types.ts — Interfaces para áreas ESPECÍFICAS de Desensibilización Sistemática
 *
 * 3 áreas propias de DS:
 * - Jerarquía de Ansiedad (construcción de jerarquías USA)
 * - Relajación (entrenamiento en respuesta incompatible)
 * - Proceso de Desensibilización (protocolo de sesión)
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Jerarquía de Ansiedad — construcción y uso de jerarquías USA
// ============================================================================

export interface DSJerarquiaAnsiedadData extends BaseAreaData {
  area_id: KBArea.DS_JERARQUIA_ANSIEDAD;
  conceptos_clave: { concepto: string; explicacion: string }[];
  reglas_construccion: string[];
  ejemplo_jerarquia: {
    fobia: string;
    items: { posicion: number; descripcion: string; usa: number }[];
  }[];
}

// ============================================================================
// Relajación — entrenamiento en la respuesta incompatible
// ============================================================================

export interface DSRelajacionData extends BaseAreaData {
  area_id: KBArea.DS_RELAJACION;
  tecnicas_relajacion: {
    id: string;
    nombre: string;
    descripcion: string;
    pasos: string[];
    duracion: string;
    indicaciones: string;
  }[];
  criterio_dominio: string;
}

// ============================================================================
// Proceso de Desensibilización — protocolo de sesión
// ============================================================================

export interface DSProcesoDesensibilizacionData extends BaseAreaData {
  area_id: KBArea.DS_PROCESO_DESENSIBILIZACION;
  fases_sesion: {
    fase: string;
    descripcion: string;
    instrucciones_terapeuta: string[];
    duracion_aproximada: string;
  }[];
  criterio_exito: string;
  manejo_ansiedad: {
    escenario: string;
    respuesta_terapeuta: string;
  }[];
  entrenamiento_sensorial: {
    modalidad: string;
    descripcion: string;
    ejemplo: string;
  }[];
}

// ============================================================================
// Union y exports
// ============================================================================

export type DSAreaData =
  | DSJerarquiaAnsiedadData
  | DSRelajacionData
  | DSProcesoDesensibilizacionData;
