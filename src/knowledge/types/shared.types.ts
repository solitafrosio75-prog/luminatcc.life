/**
 * shared.types.ts — Tipos para conocimiento transversal (shared/)
 *
 * Inventarios generales, protocolo de crisis, habilidades de entrevista, etc.
 * Estos datos se comparten entre técnicas y no se duplican.
 */

import type { SharedArea } from './technique.types';

// ============================================================================
// Inventarios Generales (BDI-II, BAI, SCL-90, etc.)
// ============================================================================

export interface InventarioGeneral {
  id: string;
  nombre: string;
  siglas: string;
  autor: string;
  proposito: string;
  poblacion_objetivo: string;
  numero_items: number;
  tiempo_aplicacion: string;
  escalas: string[];
  puntos_corte?: { rango: string; interpretacion: string }[];
  notas: string;
}

export interface InventariosGeneralesData {
  area_id: SharedArea.INVENTARIOS_GENERALES;
  nombre: string;
  descripcion: string;
  inventarios: InventarioGeneral[];
}

// ============================================================================
// Protocolo de Crisis
// ============================================================================

export interface ProtocoloCrisisData {
  area_id: SharedArea.PROTOCOLO_CRISIS;
  nombre: string;
  descripcion: string;
  senales_alarma: string[];
  pasos_intervencion: { paso: number; accion: string; detalle: string }[];
  recursos_emergencia: { recurso: string; contacto: string }[];
  contraindicaciones: string[];
}

// ============================================================================
// Habilidades de Entrevista (transversal, Cormier et al.)
// ============================================================================

export interface HabilidadEntrevista {
  nombre: string;
  /** Categoría de la habilidad relacional.
   *  'motivacional' y 'exploratorio' se usan en habilidades de entrevista extendidas
   *  (ej: entrevista motivacional, exploración de valores). */
  categoria: 'escucha' | 'pregunta' | 'reflejo' | 'confrontacion' | 'rapport' | 'motivacional' | 'exploratorio';
  descripcion: string;
  ejemplo: string;
  cuando_usar: string;
}

export interface HabilidadesEntrevistaData {
  area_id: SharedArea.HABILIDADES_ENTREVISTA;
  nombre: string;
  descripcion: string;
  fuentes: string[];
  habilidades: HabilidadEntrevista[];
}

// ============================================================================
// Union y Map
// ============================================================================

export type SharedAreaData =
  | InventariosGeneralesData
  | ProtocoloCrisisData
  | HabilidadesEntrevistaData;

export interface SharedAreaDataMap {
  [SharedArea.INVENTARIOS_GENERALES]: InventariosGeneralesData;
  [SharedArea.PROTOCOLO_CRISIS]:      ProtocoloCrisisData;
  [SharedArea.HABILIDADES_ENTREVISTA]: HabilidadesEntrevistaData;
}
