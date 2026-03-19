/**
 * mindfulness.types.ts — Interfaces para áreas ESPECÍFICAS de Mindfulness
 *
 * Mindfulness terapéutico: prácticas formales (meditación estructurada),
 * prácticas informales (atención plena en la vida diaria) y
 * aplicaciones clínicas por trastorno (MBSR, MBCT, adaptaciones).
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Prácticas Formales — Meditación, body scan, respiración consciente
// ============================================================================

export interface MindfulnessPracticasFormalesData extends BaseAreaData {
  area_id: KBArea.MINDFULNESS_PRACTICAS_FORMALES;
  practicas: {
    id: string;
    nombre: string;
    duracion: string;
    postura: string;
    instrucciones: string[];
    variaciones: string[];
    indicaciones: string[];
    contraindicaciones: string[];
  }[];
  progresion_sugerida: {
    fase: string;
    semanas: string;
    practicas_recomendadas: string[];
    duracion_sesion: string;
  }[];
}

// ============================================================================
// Prácticas Informales — Atención plena en actividades cotidianas
// ============================================================================

export interface MindfulnessPracticasInformalesData extends BaseAreaData {
  area_id: KBArea.MINDFULNESS_PRACTICAS_INFORMALES;
  practicas: {
    id: string;
    nombre: string;
    contexto: string;
    instrucciones_breves: string[];
    frecuencia_sugerida: string;
    adaptaciones: string[];
  }[];
  integracion_cotidiana: {
    principios: string[];
    actividades_ancla: string[];
  };
}

// ============================================================================
// Aplicaciones Clínicas — Protocolos por trastorno (MBSR, MBCT, etc.)
// ============================================================================

export interface MindfulnessAplicacionesClinicasData extends BaseAreaData {
  area_id: KBArea.MINDFULNESS_APLICACIONES_CLINICAS;
  aplicaciones: {
    trastorno: string;
    protocolo: string;
    adaptaciones: string[];
    evidencia: string;
    precauciones: string[];
  }[];
  programas_estructurados: {
    nombre: string;
    autor: string;
    duracion: string;
    estructura: string;
    poblacion_objetivo: string;
  }[];
}

// ============================================================================
// Union de áreas Mindfulness
// ============================================================================

export type MindfulnessAreaData =
  | MindfulnessPracticasFormalesData
  | MindfulnessPracticasInformalesData
  | MindfulnessAplicacionesClinicasData;
