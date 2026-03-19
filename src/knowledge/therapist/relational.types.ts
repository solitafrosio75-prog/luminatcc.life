/**
 * Submódulo Relacional — Tipos principales
 * Objetivo: el sistema sabe CÓMO comunicarse con el paciente
 *
 * Fuentes de datos:
 * - habilidades_entrevista.json (SharedArea) — habilidades transversales de entrevista
 * - area_10_habilidades_terapeuta.json (AC v2) — competencias específicas del terapeuta AC
 */

import type { HabilidadEntrevista } from '../types/shared.types';

// ============================================================================
// Estilos y niveles de comunicación
// ============================================================================

export type CommunicationStyle =
    | 'directivo'
    | 'no-directivo'
    | 'empático'
    | 'educativo'
    | 'motivacional'
    | 'exploratorio'
    | 'validante';

export type ValidationLevel =
    | 'mínima'    // Reconocimiento superficial
    | 'moderada'  // Reconocimiento explícito de emociones
    | 'profunda'; // Validación de significado, contexto y experiencia

/** Categorías de habilidades de entrevista (de habilidades_entrevista.json) */
export type CategoriaEntrevista = HabilidadEntrevista['categoria'];

// ============================================================================
// Habilidades del terapeuta AC (de area_10_habilidades_terapeuta.json)
// ============================================================================

export interface HabilidadTerapeutaAC {
    nombre: string;
    descripcion: string;
    importancia: string;
    como_desarrollar: string;
}

export interface HabilidadesTerapeutaACData {
    area_id: string;
    nombre: string;
    descripcion: string;
    fuentes: string[];
    habilidades: HabilidadTerapeutaAC[];
}

// ============================================================================
// Catálogo unificado de habilidades
// ============================================================================

/** Habilidad normalizada del catálogo relacional unificado */
export interface RelationalSkill {
    /** Identificador único generado (slug del nombre) */
    id: string;
    nombre: string;
    descripcion: string;
    /** 'entrevista' (SharedArea) o 'terapeuta_ac' (AC v2) */
    fuente: 'entrevista' | 'terapeuta_ac';
    /** Categoría de entrevista (solo para habilidades de entrevista) */
    categoria?: CategoriaEntrevista;
    /** Ejemplo de uso (solo para habilidades de entrevista) */
    ejemplo?: string;
    /** Cuándo aplicar esta habilidad */
    cuando_usar?: string;
    /** Importancia clínica (solo para habilidades AC) */
    importancia?: string;
}

// ============================================================================
// Respuesta terapéutica
// ============================================================================

export interface TherapeuticResponse {
    /** Mensaje generado para el paciente */
    mensaje: string;
    /** Estilo de comunicación aplicado */
    estilo: CommunicationStyle;
    /** Nivel de validación aplicado */
    validacion: ValidationLevel;
    /** Habilidad seleccionada del catálogo unificado */
    habilidad?: RelationalSkill;
    /** Contexto clínico relevante */
    contexto?: string;
}

// ============================================================================
// Mapeo categoría → estilo de comunicación por defecto
// ============================================================================

export const CATEGORIA_ESTILO_MAP: Record<CategoriaEntrevista, CommunicationStyle> = {
    escucha: 'empático',
    reflejo: 'validante',
    pregunta: 'exploratorio',
    rapport: 'validante',
    confrontacion: 'directivo',
    motivacional: 'motivacional',
    exploratorio: 'exploratorio',
};
