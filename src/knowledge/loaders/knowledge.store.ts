/**
 * knowledge.store.ts — Zustand store genérico para la base de conocimiento
 *
 * Cache bidimensional: Record<TechniqueId, Record<KBArea, AreaSlot>>
 * Una sola instancia maneja TODAS las técnicas + shared.
 */

import { create } from 'zustand';
import type { TechniqueId, AreaSlot } from '../types/technique.types';
import type { KBArea } from '../types/technique.types';
import { SharedArea, createEmptySlot } from '../types/technique.types';
import { AREA_SCHEMAS, SHARED_SCHEMAS } from '../types/schemas';
import { getTechniqueManifest, getSharedManifest } from '../registry';

// ============================================================================
// State interface
// ============================================================================

interface KnowledgeState {
  /** Cache: técnica → área → slot */
  slots: Record<string, Record<string, AreaSlot>>;
  /** Cache: shared área → slot */
  sharedSlots: Record<string, AreaSlot>;

  // Acciones
  loadArea: (techniqueId: TechniqueId, area: KBArea) => Promise<void>;
  loadAreas: (techniqueId: TechniqueId, areas: KBArea[]) => Promise<void>;
  loadShared: (area: SharedArea) => Promise<void>;
  invalidate: (techniqueId: TechniqueId, area?: KBArea) => void;
  invalidateAll: () => void;

  // Selectores
  getSlot: (techniqueId: TechniqueId, area: KBArea) => AreaSlot;
  getSharedSlot: (area: SharedArea) => AreaSlot;
}

// ============================================================================
// Inflight deduplication — evita imports duplicados
// ============================================================================

const inflight = new Map<string, Promise<void>>();

function inflightKey(technique: string, area: string): string {
  return `${technique}::${area}`;
}

// ============================================================================
// Store
// ============================================================================

export const useKnowledgeStore = create<KnowledgeState>()((set, get) => ({
  slots: {},
  sharedSlots: {},

  // ── Cargar un área de una técnica ──
  loadArea: async (techniqueId, area) => {
    const key = inflightKey(techniqueId, area);

    // Ya está loaded o loading → skip
    const current = get().slots[techniqueId]?.[area];
    if (current?.status === 'loaded' || current?.status === 'loading') return;

    // Dedup: si hay un import en vuelo para esta misma key, esperar
    if (inflight.has(key)) {
      await inflight.get(key);
      return;
    }

    // Marcar como loading
    set((s) => ({
      slots: {
        ...s.slots,
        [techniqueId]: {
          ...s.slots[techniqueId],
          [area]: { data: null, status: 'loading' as const, error: null, loadedAt: null },
        },
      },
    }));

    const promise = (async () => {
      try {
        const manifest = getTechniqueManifest(techniqueId);
        if (!manifest) throw new Error(`Técnica "${techniqueId}" no registrada`);

        const loader = manifest.areas[area];
        if (!loader) throw new Error(`Área "${area}" no definida en técnica "${techniqueId}"`);

        const module = await loader();
        const raw = module.default;

        // Validar con Zod (schema puede no existir si área nueva sin schema)
        const schema = AREA_SCHEMAS[area];
        const parsed = schema ? schema.parse(raw) : raw;

        set((s) => ({
          slots: {
            ...s.slots,
            [techniqueId]: {
              ...s.slots[techniqueId],
              [area]: { data: parsed, status: 'loaded' as const, error: null, loadedAt: Date.now() },
            },
          },
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        console.error(`[KB] Error cargando ${techniqueId}/${area}:`, err);
        set((s) => ({
          slots: {
            ...s.slots,
            [techniqueId]: {
              ...s.slots[techniqueId],
              [area]: { data: null, status: 'error' as const, error: msg, loadedAt: null },
            },
          },
        }));
      } finally {
        inflight.delete(key);
      }
    })();

    inflight.set(key, promise);
    await promise;
  },

  // ── Cargar múltiples áreas en paralelo ──
  loadAreas: async (techniqueId, areas) => {
    await Promise.all(areas.map((area) => get().loadArea(techniqueId, area)));
  },

  // ── Cargar un área shared ──
  loadShared: async (area) => {
    const key = inflightKey('__shared__', area);
    const current = get().sharedSlots[area];
    if (current?.status === 'loaded' || current?.status === 'loading') return;

    if (inflight.has(key)) {
      await inflight.get(key);
      return;
    }

    set((s) => ({
      sharedSlots: {
        ...s.sharedSlots,
        [area]: { data: null, status: 'loading' as const, error: null, loadedAt: null },
      },
    }));

    const promise = (async () => {
      try {
        const sharedManifest = getSharedManifest();
        const loader = sharedManifest[area];
        if (!loader) throw new Error(`Shared área "${area}" no definida`);

        const module = await loader();
        const raw = module.default;

        const schema = SHARED_SCHEMAS[area];
        const parsed = schema.parse(raw);

        set((s) => ({
          sharedSlots: {
            ...s.sharedSlots,
            [area]: { data: parsed, status: 'loaded' as const, error: null, loadedAt: Date.now() },
          },
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        console.error(`[KB] Error cargando shared/${area}:`, err);
        set((s) => ({
          sharedSlots: {
            ...s.sharedSlots,
            [area]: { data: null, status: 'error' as const, error: msg, loadedAt: null },
          },
        }));
      } finally {
        inflight.delete(key);
      }
    })();

    inflight.set(key, promise);
    await promise;
  },

  // ── Invalidar caché ──
  invalidate: (techniqueId, area) => {
    if (area) {
      set((s) => ({
        slots: {
          ...s.slots,
          [techniqueId]: {
            ...s.slots[techniqueId],
            [area]: createEmptySlot(),
          },
        },
      }));
    } else {
      // Invalida toda la técnica
      set((s) => {
        const { [techniqueId]: _, ...rest } = s.slots;
        return { slots: rest };
      });
    }
  },

  invalidateAll: () => set({ slots: {}, sharedSlots: {} }),

  // ── Selectores ──
  getSlot: (techniqueId, area) => {
    return get().slots[techniqueId]?.[area] ?? createEmptySlot();
  },

  getSharedSlot: (area) => {
    return get().sharedSlots[area] ?? createEmptySlot();
  },
}));
