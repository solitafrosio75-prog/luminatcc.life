/**
 * trec.types.ts — Interfaces para áreas ESPECÍFICAS de TREC
 *
 * Terapia Racional Emotiva Conductual (Ellis): taxonomía de creencias
 * irracionales, técnicas de disputación y el modelo ABC→DE extendido.
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Creencias Irracionales — Taxonomía de Ellis (demandas + derivaciones)
// ============================================================================

export interface TRECCreenciasIrracionalesData extends BaseAreaData {
  area_id: KBArea.TREC_CREENCIAS_IRRACIONALES;
  clasificacion_ellis: {
    demandas: string[];
    derivaciones: string[];
  };
  creencias_irracionales: {
    id: string;
    nombre: string;
    tipo: string; // 'demanda' | 'evaluacion_global' | 'baja_tolerancia' | 'catastrofizacion'
    descripcion: string;
    alternativa_racional: string;
    ejemplo: string;
    preguntas_deteccion: string[];
  }[];
}

// ============================================================================
// Disputación — Técnicas empíricas, lógicas, pragmáticas y filosóficas
// ============================================================================

export interface TRECDisputacionData extends BaseAreaData {
  area_id: KBArea.TREC_DISPUTACION;
  tipos_disputacion: {
    id: string;
    tipo: string; // 'empirica' | 'logica' | 'pragmatica' | 'filosofica'
    descripcion: string;
    preguntas_tipo: string[];
    ejemplo_dialogo: { terapeuta: string; paciente: string }[];
  }[];
  estrategias_avanzadas: {
    nombre: string;
    cuando_usar: string;
    procedimiento: string[];
  }[];
}

// ============================================================================
// Modelo ABC-DE — Registro extendido con disputación y nueva filosofía
// ============================================================================

export interface TRECModeloABCDEData extends BaseAreaData {
  area_id: KBArea.TREC_MODELO_ABCDE;
  componentes: {
    letra: string;
    nombre: string;
    descripcion: string;
    preguntas_guia: string[];
  }[];
  formatos_registro: {
    id: string;
    nombre: string;
    columnas: string[];
    ejemplo_completo: Record<string, string>;
    cuando_usar: string;
  }[];
}

// ============================================================================
// Union de áreas TREC
// ============================================================================

export type TRECAreaData =
  | TRECCreenciasIrracionalesData
  | TRECDisputacionData
  | TRECModeloABCDEData;
