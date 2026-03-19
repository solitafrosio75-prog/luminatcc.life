/**
 * act.types.ts — Interfaces para áreas ESPECÍFICAS de ACT
 *
 * Terapia de Aceptación y Compromiso: hexaflex (6 procesos de flexibilidad),
 * técnicas de defusión cognitiva, y clarificación de valores con acción comprometida.
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Hexaflex — Los 6 procesos de flexibilidad/inflexibilidad psicológica
// ============================================================================

export interface ACTHexaflexData extends BaseAreaData {
  area_id: KBArea.ACT_HEXAFLEX;
  procesos: {
    id: string;
    nombre: string;
    polo_inflexible: string;
    polo_flexible: string;
    descripcion: string;
    indicadores_inflexibilidad: string[];
    estrategias: string[];
    ejemplo_clinico: string;
  }[];
}

// ============================================================================
// Defusión Cognitiva — Técnicas para distanciarse del contenido mental
// ============================================================================

export interface ACTDefusionCognitivaData extends BaseAreaData {
  area_id: KBArea.ACT_DEFUSION_COGNITIVA;
  tecnicas_defusion: {
    id: string;
    nombre: string;
    tipo: string; // 'metaforica' | 'experiencial' | 'verbal' | 'corporal'
    objetivo: string;
    instrucciones: string[];
    duracion_aproximada: string;
    indicaciones: string[];
    ejemplo: string;
  }[];
}

// ============================================================================
// Valores y Acción Comprometida — Clarificación de valores + plan de acción
// ============================================================================

export interface ACTValoresAccionData extends BaseAreaData {
  area_id: KBArea.ACT_VALORES_ACCION;
  dominios_valores: {
    dominio: string;
    preguntas_exploracion: string[];
    ejemplo_valores: string[];
  }[];
  herramientas_clarificacion: {
    id: string;
    nombre: string;
    instrucciones: string[];
  }[];
  plan_accion_comprometida: {
    pasos: string[];
    criterio_compromiso: string;
  };
}

// ============================================================================
// Union de áreas ACT
// ============================================================================

export type ACTAreaData =
  | ACTHexaflexData
  | ACTDefusionCognitivaData
  | ACTValoresAccionData;
