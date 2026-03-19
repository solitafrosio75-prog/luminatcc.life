/**
 * exposicion.types.ts — Interfaces para áreas ESPECÍFICAS de Terapia de Exposición
 *
 * 3 áreas propias de EXP:
 * - Jerarquía de Exposición (construcción de jerarquías multimodales)
 * - Prevención de Respuesta (eliminación de conductas de seguridad y evitación)
 * - Proceso de Exposición (protocolo de sesión y monitorización)
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// Jerarquía de Exposición — construcción multimodal (in vivo, imaginaria, interoceptiva)
// ============================================================================

export interface EXPJerarquiaExposicionData extends BaseAreaData {
  area_id: KBArea.EXP_JERARQUIA_EXPOSICION;
  modalidades_exposicion: {
    modalidad: string;
    descripcion: string;
    cuando_usar: string;
    ejemplo: string;
  }[];
  reglas_construccion: string[];
  ejemplo_jerarquia: {
    trastorno: string;
    modalidad: string;
    items: { posicion: number; descripcion: string; usa: number }[];
  }[];
}

// ============================================================================
// Prevención de Respuesta — conductas de seguridad, rituales, evitación
// ============================================================================

export interface EXPPrevencionRespuestaData extends BaseAreaData {
  area_id: KBArea.EXP_PREVENCION_RESPUESTA;
  conceptos_clave: { concepto: string; explicacion: string }[];
  tipos_conducta_seguridad: {
    tipo: string;
    descripcion: string;
    ejemplos: string[];
    estrategia_eliminacion: string;
  }[];
  protocolo_prevencion: string[];
}

// ============================================================================
// Proceso de Exposición — protocolo de sesión
// ============================================================================

export interface EXPProcesoExposicionData extends BaseAreaData {
  area_id: KBArea.EXP_PROCESO_EXPOSICION;
  fases_sesion: {
    fase: string;
    descripcion: string;
    instrucciones_terapeuta: string[];
    duracion_aproximada: string;
  }[];
  criterio_exito: string;
  modelos_teoricos: {
    modelo: string;
    descripcion: string;
    implicacion_clinica: string;
  }[];
  manejo_dificultades: {
    escenario: string;
    respuesta_terapeuta: string;
  }[];
}

// ============================================================================
// Union y exports
// ============================================================================

export type EXPAreaData =
  | EXPJerarquiaExposicionData
  | EXPPrevencionRespuestaData
  | EXPProcesoExposicionData;
