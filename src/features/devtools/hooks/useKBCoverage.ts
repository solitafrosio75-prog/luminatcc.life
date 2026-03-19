/**
 * useKBCoverage — Hook para calcular la matriz de cobertura KB
 *
 * Lee el registry de tecnicas y el Zustand store de conocimiento
 * para generar una matriz visual de que areas estan disponibles/cargadas.
 */

import { useMemo } from 'react';
import { getRegisteredTechniques } from '../../../knowledge/registry';
import { useKnowledgeStore } from '../../../knowledge/loaders/knowledge.store';
import {
  type KBArea,
  type TechniqueManifest,
  KB_AREA_LABELS,
  SHARED_KB_AREAS,
} from '../../../knowledge/types/technique.types';
import type { CoverageCell, CoverageStats } from '../../../components/kb/kb.types';

// All unique areas across all techniques (for column headers)
function getAllUniqueAreas(techniques: TechniqueManifest[]): KBArea[] {
  const seen = new Set<KBArea>();
  // Shared first
  for (const area of SHARED_KB_AREAS) {
    seen.add(area);
  }
  // Then technique-specific
  for (const tech of techniques) {
    for (const area of Object.keys(tech.areas) as KBArea[]) {
      seen.add(area);
    }
  }
  return Array.from(seen);
}

export function useKBCoverage() {
  const techniques = useMemo(() => getRegisteredTechniques(), []);
  const slots = useKnowledgeStore((s) => s.slots);

  const allAreas = useMemo(() => getAllUniqueAreas(techniques), [techniques]);

  const areaLabels = useMemo(
    () => allAreas.map((a) => KB_AREA_LABELS[a] ?? a),
    [allAreas],
  );

  const { matrix, stats } = useMemo(() => {
    const stats: CoverageStats = { total: 0, available: 0, loaded: 0, errors: 0, idle: 0 };
    const matrix: CoverageCell[][] = [];

    for (const tech of techniques) {
      const row: CoverageCell[] = [];
      for (const area of allAreas) {
        const available = area in (tech.areas ?? {});
        const slot = slots[tech.id]?.[area];
        const status = slot?.status ?? 'idle';
        const label = KB_AREA_LABELS[area] ?? area;

        row.push({ techniqueId: tech.id, area, available, status, label });

        stats.total++;
        if (available) {
          stats.available++;
          if (status === 'loaded') stats.loaded++;
          else if (status === 'error') stats.errors++;
          else stats.idle++;
        }
      }
      matrix.push(row);
    }

    return { matrix, stats };
  }, [techniques, allAreas, slots]);

  return { techniques, matrix, stats, areaLabels, allAreas };
}
