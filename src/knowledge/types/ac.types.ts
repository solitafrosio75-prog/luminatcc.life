/**
 * ac.types.ts — Interfaces para áreas ESPECÍFICAS de Activación Conductual
 *
 * Motor conductual: áreas vitales, valores→reforzadores, actividades por problema.
 * Estas áreas solo aplican a AC y no deben forzarse en otras técnicas.
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Áreas Vitales — dominios de vida para programar actividades
// ============================================================================

export interface ACAreasVitalesData extends BaseAreaData {
  area_id: KBArea.AC_AREAS_VITALES;
  areas_vitales: {
    nombre: string;
    descripcion: string;
    actividades_ejemplo: string[];
  }[];
}

// ============================================================================
// Valores y Reforzadores — valores que guían la activación conductual
// ============================================================================

export interface ACValoresReforzadoresData extends BaseAreaData {
  area_id: KBArea.AC_VALORES_REFORZADORES;
  objetivos_terapeuticos: { objetivo: string; descripcion: string }[];
  valores_nucleares: { valor: string; definicion: string }[];
}

// ============================================================================
// Actividades por Problema — catálogo conductual organizado por problema
// ============================================================================

export interface ACActividadesPorProblemaData extends BaseAreaData {
  area_id: KBArea.AC_ACTIVIDADES_POR_PROBLEMA;
  problemas: {
    nombre: string;
    principios_intervencion: string[];
    actividades: {
      nombre: string;
      descripcion: string;
      justificacion: string;
      jerarquia: { nivel: number; actividad: string; dificultad: number }[];
    }[];
  }[];
}

// ============================================================================
// Union de áreas AC
// ============================================================================

export type ACAreaData =
  | ACAreasVitalesData
  | ACValoresReforzadoresData
  | ACActividadesPorProblemaData;
