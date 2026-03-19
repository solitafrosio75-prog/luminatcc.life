/**
 * modificacion_conducta.types.ts — Interfaces específicas de Modificación de Conducta
 *
 * 3 áreas MC-específicas:
 * - MC_ANALISIS_FUNCIONAL: análisis funcional ABC
 * - MC_PROGRAMAS_REFORZAMIENTO: economía de fichas, contratos, moldeamiento
 * - MC_TECNICAS_OPERANTES: encadenamiento, desvanecimiento, control de estímulos
 */

import { KBArea } from './technique.types';
import type { BaseAreaData } from './areas.types';

// ============================================================================
// MC — Análisis Funcional de la Conducta
// ============================================================================

export interface MCAnalisisFuncionalData extends BaseAreaData {
  area_id: KBArea.MC_ANALISIS_FUNCIONAL;
  componentes_abc: {
    componente: string;
    definicion: string;
    ejemplos: string[];
    preguntas_evaluacion: string[];
  }[];
  tipos_contingencia: {
    tipo: string;
    descripcion: string;
    efecto_conducta: string;
    ejemplo: string;
  }[];
  guia_formulacion: string[];
}

// ============================================================================
// MC — Programas de Reforzamiento
// ============================================================================

export interface MCProgramasReforzamientoData extends BaseAreaData {
  area_id: KBArea.MC_PROGRAMAS_REFORZAMIENTO;
  programas: {
    id: string;
    nombre: string;
    descripcion: string;
    tipo_reforzamiento: string;
    procedimiento: string[];
    indicaciones: string;
    ejemplo_clinico: string;
  }[];
  tipos_reforzadores: {
    tipo: string;
    descripcion: string;
    ejemplos: string[];
    consideraciones: string;
  }[];
}

// ============================================================================
// MC — Técnicas Operantes
// ============================================================================

export interface MCTecnicasOperantesData extends BaseAreaData {
  area_id: KBArea.MC_TECNICAS_OPERANTES;
  tecnicas: {
    id: string;
    nombre: string;
    principio_base: string;
    descripcion: string;
    pasos: string[];
    cuando_usar: string;
    ejemplo_clinico: string;
  }[];
  consideraciones_eticas: {
    tema: string;
    directriz: string;
  }[];
}

// ============================================================================
// Union
// ============================================================================

export type MCAreaData =
  | MCAnalisisFuncionalData
  | MCProgramasReforzamientoData
  | MCTecnicasOperantesData;
