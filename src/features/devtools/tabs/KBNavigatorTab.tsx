/**
 * KBNavigatorTab — Navegador completo de la base de conocimiento
 *
 * Compone: KBSearchBar + KBAreaBrowser + KBAreaDataViewer
 * Split layout: browser izquierda, viewer derecha.
 */

import { useState, useCallback } from 'react';
import type { KBArea, TechniqueId } from '../../../knowledge/types/technique.types';
import { KBSearchBar } from '../../../components/kb/KBSearchBar';
import { KBAreaBrowser } from '../../../components/kb/KBAreaBrowser';
import { KBAreaDataViewer } from '../../../components/kb/KBAreaDataViewer';
import type { SearchResult } from '../../../components/kb/kb.types';

export function KBNavigatorTab() {
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueId | null>(null);
  const [selectedArea, setSelectedArea] = useState<KBArea | null>(null);

  const handleSelectArea = useCallback((techniqueId: TechniqueId, area: KBArea) => {
    setSelectedTechnique(techniqueId);
    setSelectedArea(area);
  }, []);

  const handleSelectTechnique = useCallback((id: TechniqueId) => {
    setSelectedTechnique(id);
    setSelectedArea(null);
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSelectedTechnique(result.techniqueId);
    setSelectedArea(result.area);
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header + Search */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">
          Navegador de Conocimiento
        </h2>
        <KBSearchBar onSelect={handleSearchSelect} />
      </div>

      {/* Two-pane layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Browser */}
        <div className="w-[480px] shrink-0 overflow-y-auto border border-slate-800 rounded-lg p-4 bg-slate-900/30">
          <KBAreaBrowser
            selectedTechnique={selectedTechnique}
            selectedArea={selectedArea}
            onSelectTechnique={handleSelectTechnique}
            onSelectArea={handleSelectArea}
          />
        </div>

        {/* Right: Viewer */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-lg p-4 bg-slate-900/30">
          {selectedTechnique && selectedArea ? (
            <KBAreaDataViewer
              key={`${selectedTechnique}-${selectedArea}`}
              techniqueId={selectedTechnique}
              area={selectedArea}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              <div className="text-center space-y-2">
                <div className="text-4xl opacity-30">📖</div>
                <p>Selecciona una tecnica y un area para ver su contenido</p>
                <p className="text-xs text-slate-600">
                  O usa la barra de busqueda para encontrar contenido especifico
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
