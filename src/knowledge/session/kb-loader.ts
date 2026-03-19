/**
 * kb-loader.ts — Loader de Knowledge Base para funciones puras (no-React)
 *
 * Los session flows son funciones async puras que no pueden usar hooks React.
 * Este módulo carga datos del KB usando los mismos lazy loaders del registry,
 * bypaseando el Zustand store (que es una capa de cache React).
 *
 * Cache in-memory con dedup para evitar cargas duplicadas en la misma sesión.
 */

import { getTechniqueManifest, getSharedManifest } from '../registry';
import type { TechniqueId, KBArea, SharedArea } from '../types/technique.types';

// ============================================================================
// Cache in-memory
// ============================================================================

const cache = new Map<string, unknown>();

// ============================================================================
// API pública
// ============================================================================

/**
 * Carga datos de un área de conocimiento de una técnica específica.
 *
 * @param techniqueId ID de la técnica (e.g., 'ac')
 * @param area Área del KB a cargar (e.g., KBArea.CONOCIMIENTO)
 * @returns Datos del área (tipados con el genérico T)
 * @throws Si la técnica o el área no están registradas
 */
export async function loadKBData<T = unknown>(
    techniqueId: TechniqueId,
    area: KBArea,
): Promise<T> {
    const key = `${techniqueId}::${area}`;
    if (cache.has(key)) return cache.get(key) as T;

    const manifest = getTechniqueManifest(techniqueId);
    if (!manifest) {
        throw new Error(`[kb-loader] Técnica "${techniqueId}" no registrada en el registry`);
    }

    const loader = manifest.areas[area];
    if (!loader) {
        throw new Error(`[kb-loader] Área "${area}" no encontrada en técnica "${techniqueId}"`);
    }

    const mod = await loader();
    const data = mod.default as T;
    cache.set(key, data);
    return data;
}

/**
 * Carga datos de un área transversal (shared).
 *
 * @param area Área compartida (e.g., SharedArea.PROTOCOLO_CRISIS)
 * @returns Datos del área compartida
 * @throws Si el manifest compartido no está registrado o el área no existe
 */
export async function loadSharedData<T = unknown>(
    area: SharedArea,
): Promise<T> {
    const key = `__shared__::${area}`;
    if (cache.has(key)) return cache.get(key) as T;

    const manifest = getSharedManifest();
    const loader = manifest[area];
    if (!loader) {
        throw new Error(`[kb-loader] Área compartida "${area}" no encontrada`);
    }

    const mod = await loader();
    const data = mod.default as T;
    cache.set(key, data);
    return data;
}

/**
 * Limpia la cache completa. Útil para tests y recarga forzada.
 */
export function clearKBCache(): void {
    cache.clear();
}
