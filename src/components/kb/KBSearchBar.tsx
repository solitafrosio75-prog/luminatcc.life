/**
 * KBSearchBar — Barra de busqueda transversal en la KB
 *
 * Busca en areas ya cargadas en el Zustand store.
 * Muestra resultados con tecnica, area y snippet.
 */

import { useState, useMemo, useCallback } from 'react';
import { useKnowledgeStore } from '../../knowledge/loaders/knowledge.store';
import { KB_AREA_LABELS, type KBArea, type TechniqueId } from '../../knowledge/types/technique.types';
import { getRegisteredTechniques } from '../../knowledge/registry';
import type { SearchResult } from './kb.types';
import { KBBadge } from './KBBadge';

interface KBSearchBarProps {
  onSelect: (result: SearchResult) => void;
}

export function KBSearchBar({ onSelect }: KBSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const slots = useKnowledgeStore((s) => s.slots);
  const loadAreas = useKnowledgeStore((s) => s.loadAreas);

  const techniques = useMemo(() => getRegisteredTechniques(), []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const hits: SearchResult[] = [];

    for (const [techId, areas] of Object.entries(slots)) {
      for (const [areaId, slot] of Object.entries(areas)) {
        if (slot.status !== 'loaded' || !slot.data) continue;

        const json = JSON.stringify(slot.data).toLowerCase();
        if (!json.includes(q)) continue;

        // Find matching field
        const matchField = findMatchField(slot.data as Record<string, unknown>, q);
        const snippet = extractSnippet(json, q);

        hits.push({
          techniqueId: techId as TechniqueId,
          area: areaId as KBArea,
          matchField,
          snippet,
        });
      }
    }

    return hits.slice(0, 20);
  }, [query, slots]);

  const loadedCount = useMemo(() => {
    let count = 0;
    for (const areas of Object.values(slots)) {
      for (const slot of Object.values(areas)) {
        if (slot.status === 'loaded') count++;
      }
    }
    return count;
  }, [slots]);

  const handleLoadAll = useCallback(async () => {
    for (const tech of techniques) {
      const areas = Object.keys(tech.areas) as KBArea[];
      await loadAreas(tech.id, areas);
    }
  }, [techniques, loadAreas]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Buscar en la base de conocimiento..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              x
            </button>
          )}
        </div>
        <button
          onClick={handleLoadAll}
          className="text-xs px-3 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors shrink-0"
          title={`${loadedCount} areas cargadas. Click para cargar todas.`}
        >
          Cargar todo ({loadedCount})
        </button>
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">
              Sin resultados en {loadedCount} areas cargadas
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.techniqueId}-${r.area}-${i}`}
                onClick={() => {
                  onSelect(r);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <KBBadge>{r.techniqueId}</KBBadge>
                  <span className="text-xs text-slate-400">
                    {KB_AREA_LABELS[r.area] ?? r.area}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{r.snippet}</p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// ── Helpers ──

function findMatchField(data: Record<string, unknown>, query: string): string {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.toLowerCase().includes(query)) {
      return key;
    }
  }
  return 'data';
}

function extractSnippet(json: string, query: string): string {
  const idx = json.indexOf(query);
  if (idx < 0) return '';
  const start = Math.max(0, idx - 40);
  const end = Math.min(json.length, idx + query.length + 60);
  return '...' + json.slice(start, end).replace(/[{}[\]"]/g, ' ').trim() + '...';
}
