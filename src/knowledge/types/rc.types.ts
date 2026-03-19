/**
 * rc.types.ts — Interfaces para áreas ESPECÍFICAS de Reestructuración Cognitiva
 *
 * Motor cognitivo: distorsiones, registro de pensamientos, creencias nucleares,
 * experimentos conductuales cognitivos.
 * Estas áreas solo aplican a RC y no deben forzarse en técnicas conductuales.
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Distorsiones Cognitivas — catálogo de errores de pensamiento
// ============================================================================

export interface RCDistorsionesCognitivasData extends BaseAreaData {
  area_id: KBArea.RC_DISTORSIONES_COGNITIVAS;
  distorsiones: {
    id: string;
    nombre: string;
    definicion: string;
    ejemplo: string;
    pregunta_socratica: string;
  }[];
}

// ============================================================================
// Registro de Pensamientos — formatos de autoregistro cognitivo
// ============================================================================

export interface RCRegistroPensamientosData extends BaseAreaData {
  area_id: KBArea.RC_REGISTRO_PENSAMIENTOS;
  formatos: {
    id: string;
    nombre: string;
    columnas: { nombre: string; descripcion: string; instruccion: string }[];
    cuando_usar: string;
    ejemplo_completo: Record<string, string>;
  }[];
}

// ============================================================================
// Creencias Nucleares — esquemas, creencias intermedias y nucleares
// ============================================================================

export interface RCCreenciasNuclearesData extends BaseAreaData {
  area_id: KBArea.RC_CREENCIAS_NUCLEARES;
  categorias: {
    nombre: string;
    descripcion: string;
    creencias_ejemplo: string[];
    supuestos_intermedios: string[];
    estrategias_modificacion: string[];
  }[];
}

// ============================================================================
// Experimentos Conductuales — pruebas empíricas de creencias
// ============================================================================

export interface RCExperimentosConductualesData extends BaseAreaData {
  area_id: KBArea.RC_EXPERIMENTOS_CONDUCTUALES;
  experimentos: {
    id: string;
    nombre: string;
    creencia_objetivo: string;
    hipotesis: string;
    procedimiento: string[];
    criterio_evaluacion: string;
    ejemplo_clinico: string;
  }[];
}

// ============================================================================
// Union de áreas RC
// ============================================================================

export type RCAreaData =
  | RCDistorsionesCognitivasData
  | RCRegistroPensamientosData
  | RCCreenciasNuclearesData
  | RCExperimentosConductualesData;
