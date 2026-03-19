/**
 * dc.types.ts — Interfaces para áreas ESPECÍFICAS de Terapia Dialéctico Conductual
 *
 * DBT (Linehan): regulación emocional, tolerancia al malestar y
 * efectividad interpersonal. Los 3 módulos de habilidades core de DBT
 * (el 4to, mindfulness, se cubre por la técnica mindfulness transversal).
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Regulación Emocional — Habilidades para entender y modular emociones
// ============================================================================

export interface DCRegulacionEmocionalData extends BaseAreaData {
  area_id: KBArea.DC_REGULACION_EMOCIONAL;
  modelo_emocion: {
    componentes: string[];
    funcion_emociones: string;
  };
  habilidades: {
    id: string;
    nombre: string;
    acronimo?: string;
    objetivo: string;
    pasos: string[];
    cuando_usar: string;
    ejemplo_clinico: string;
  }[];
}

// ============================================================================
// Tolerancia al Malestar — Habilidades de crisis y aceptación radical
// ============================================================================

export interface DCToleranciaMalestarData extends BaseAreaData {
  area_id: KBArea.DC_TOLERANCIA_MALESTAR;
  habilidades_crisis: {
    id: string;
    nombre: string;
    acronimo: string;
    componentes: { letra: string; significado: string; instruccion: string }[];
    intensidad: string;
    duracion: string;
  }[];
  habilidades_aceptacion: {
    id: string;
    nombre: string;
    descripcion: string;
    ejercicio: string;
  }[];
}

// ============================================================================
// Efectividad Interpersonal — DEAR MAN, GIVE, FAST
// ============================================================================

export interface DCEfectividadInterpersonalData extends BaseAreaData {
  area_id: KBArea.DC_EFECTIVIDAD_INTERPERSONAL;
  modelos: {
    id: string;
    nombre: string;
    acronimo: string;
    objetivo: string;
    componentes: { letra: string; significado: string; ejemplo: string }[];
  }[];
  factores_contextuales: {
    factor: string;
    descripcion: string;
    como_evaluar: string;
  }[];
}

// ============================================================================
// Union de áreas DC
// ============================================================================

export type DCAreaData =
  | DCRegulacionEmocionalData
  | DCToleranciaMalestarData
  | DCEfectividadInterpersonalData;
