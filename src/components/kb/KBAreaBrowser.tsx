/**
 * KBAreaBrowser — Selector de tecnica + area para navegar la KB
 *
 * Two-column layout: tecnicas a la izquierda, areas a la derecha.
 * Usado por DevTools y por la nueva 5a tab del KnowledgeControlPanel.
 */

import { useMemo } from 'react';
import { getRegisteredTechniques } from '../../knowledge/registry';
import {
  type KBArea,
  type TechniqueId,
  type TechniqueManifest,
  KB_AREA_LABELS,
  SHARED_KB_AREAS,
} from '../../knowledge/types/technique.types';
import { KBBadge } from './KBBadge';

interface KBAreaBrowserProps {
  selectedTechnique: TechniqueId | null;
  selectedArea: KBArea | null;
  onSelectTechnique: (id: TechniqueId) => void;
  onSelectArea: (techniqueId: TechniqueId, area: KBArea) => void;
}

export function KBAreaBrowser({
  selectedTechnique,
  selectedArea,
  onSelectTechnique,
  onSelectArea,
}: KBAreaBrowserProps) {
  const techniques = useMemo(() => getRegisteredTechniques(), []);

  const selectedManifest = useMemo(
    () => techniques.find((t) => t.id === selectedTechnique) ?? null,
    [techniques, selectedTechnique],
  );

  const { sharedAreas, specificAreas } = useMemo(() => {
    if (!selectedManifest) return { sharedAreas: [], specificAreas: [] };
    const allAreas = Object.keys(selectedManifest.areas) as KBArea[];
    const sharedSet = new Set(SHARED_KB_AREAS as KBArea[]);
    return {
      sharedAreas: allAreas.filter((a) => sharedSet.has(a)),
      specificAreas: allAreas.filter((a) => !sharedSet.has(a)),
    };
  }, [selectedManifest]);

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Column 1: Techniques */}
      <div className="w-64 shrink-0 flex flex-col gap-1 overflow-y-auto pr-2">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 px-2">
          Tecnicas ({techniques.length})
        </h3>
        {techniques.map((t) => (
          <TechniqueCard
            key={t.id}
            manifest={t}
            isSelected={selectedTechnique === t.id}
            onClick={() => onSelectTechnique(t.id)}
          />
        ))}
      </div>

      {/* Column 2: Areas */}
      <div className="flex-1 overflow-y-auto">
        {!selectedManifest ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Selecciona una tecnica para ver sus areas
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Shared areas */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                Areas compartidas ({sharedAreas.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {sharedAreas.map((area) => (
                  <AreaCard
                    key={area}
                    area={area}
                    isSelected={selectedArea === area}
                    onClick={() => onSelectArea(selectedManifest.id, area)}
                  />
                ))}
              </div>
            </div>

            {/* Technique-specific areas */}
            {specificAreas.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                  Especificas de {selectedManifest.nombre} ({specificAreas.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {specificAreas.map((area) => (
                    <AreaCard
                      key={area}
                      area={area}
                      isSelected={selectedArea === area}
                      isSpecific
                      onClick={() => onSelectArea(selectedManifest.id, area)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function TechniqueCard({
  manifest,
  isSelected,
  onClick,
}: {
  manifest: TechniqueManifest;
  isSelected: boolean;
  onClick: () => void;
}) {
  const areaCount = Object.keys(manifest.areas).length;
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-950/40 text-blue-200'
          : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{manifest.nombre}</span>
        <KBBadge>{areaCount}</KBBadge>
      </div>
      <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">
        {manifest.id} v{manifest.version}
      </div>
    </button>
  );
}

function AreaCard({
  area,
  isSelected,
  isSpecific = false,
  onClick,
}: {
  area: KBArea;
  isSelected: boolean;
  isSpecific?: boolean;
  onClick: () => void;
}) {
  const label = KB_AREA_LABELS[area] ?? area;
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 rounded-lg border transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
          : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600'
      }`}
    >
      <div className="text-sm font-medium leading-tight">{label}</div>
      {isSpecific && (
        <div className="mt-1">
          <KBBadge variant="info">especifica</KBBadge>
        </div>
      )}
    </button>
  );
}
