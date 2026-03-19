/**
 * useKnowledge.ts — React hooks para consumir la base de conocimiento
 *
 * API pública:
 *   useKnowledgeArea(technique, area)   → un área, type-safe
 *   useKnowledgeAreas(technique, areas) → múltiples áreas
 *   useSharedKnowledge(area)            → conocimiento transversal
 *   useKnowledgePreload(technique, areas) → precarga en background
 */

import { useEffect, useMemo } from 'react';
import { useKnowledgeStore } from './knowledge.store';
import type { KBArea, SharedArea, TechniqueId } from '../types/technique.types';
import type { AreaDataMap } from '../types/areas.types';
import type { SharedAreaDataMap } from '../types/shared.types';

// ============================================================================
// Hook principal: un área de una técnica (type-safe)
// ============================================================================

export function useKnowledgeArea<A extends KBArea>(
  techniqueId: TechniqueId,
  area: A,
): {
  data: AreaDataMap[A] | null;
  isLoading: boolean;
  error: string | null;
} {
  const loadArea = useKnowledgeStore((s) => s.loadArea);
  const slot = useKnowledgeStore((s) => s.getSlot(techniqueId, area));

  useEffect(() => {
    if (slot.status === 'idle') {
      loadArea(techniqueId, area);
    }
  }, [techniqueId, area, slot.status, loadArea]);

  return {
    data: slot.data as AreaDataMap[A] | null,
    isLoading: slot.status === 'loading',
    error: slot.error,
  };
}

// ============================================================================
// Múltiples áreas
// ============================================================================

export function useKnowledgeAreas(
  techniqueId: TechniqueId,
  areas: KBArea[],
): {
  data: Partial<Record<KBArea, unknown>>;
  isLoading: boolean;
  allLoaded: boolean;
  errors: Partial<Record<KBArea, string>>;
} {
  const loadAreas = useKnowledgeStore((s) => s.loadAreas);
  const getSlot = useKnowledgeStore((s) => s.getSlot);

  // Cargar áreas idle al montar
  useEffect(() => {
    const idle = areas.filter((a) => getSlot(techniqueId, a).status === 'idle');
    if (idle.length > 0) {
      loadAreas(techniqueId, idle);
    }
  }, [techniqueId, areas, getSlot, loadAreas]);

  // Leer slots desde el store (reactivo por referencia de `slots`)
  const slots = useKnowledgeStore((s) => s.slots);

  return useMemo(() => {
    const data: Partial<Record<KBArea, unknown>> = {};
    const errors: Partial<Record<KBArea, string>> = {};
    let anyLoading = false;
    let allLoaded = true;

    for (const area of areas) {
      const slot = slots[techniqueId]?.[area];
      if (slot?.data) data[area] = slot.data;
      if (slot?.error) errors[area] = slot.error;
      if (slot?.status === 'loading') anyLoading = true;
      if (slot?.status !== 'loaded') allLoaded = false;
    }

    return { data, isLoading: anyLoading, allLoaded, errors };
  }, [slots, techniqueId, areas]);
}

// ============================================================================
// Conocimiento compartido
// ============================================================================

export function useSharedKnowledge<A extends SharedArea>(
  area: A,
): {
  data: SharedAreaDataMap[A] | null;
  isLoading: boolean;
  error: string | null;
} {
  const loadShared = useKnowledgeStore((s) => s.loadShared);
  const slot = useKnowledgeStore((s) => s.getSharedSlot(area));

  useEffect(() => {
    if (slot.status === 'idle') {
      loadShared(area);
    }
  }, [area, slot.status, loadShared]);

  return {
    data: slot.data as SharedAreaDataMap[A] | null,
    isLoading: slot.status === 'loading',
    error: slot.error,
  };
}

// ============================================================================
// Precarga en background (fire-and-forget, no bloquea render)
// ============================================================================

export function useKnowledgePreload(
  techniqueId: TechniqueId,
  areas: KBArea[],
): void {
  const loadAreas = useKnowledgeStore((s) => s.loadAreas);

  useEffect(() => {
    // requestIdleCallback para no bloquear el thread principal
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => loadAreas(techniqueId, areas));
      return () => cancelIdleCallback(id);
    }
    // Fallback: setTimeout con delay
    const id = setTimeout(() => loadAreas(techniqueId, areas), 100);
    return () => clearTimeout(id);
  }, [techniqueId, areas, loadAreas]);
}
