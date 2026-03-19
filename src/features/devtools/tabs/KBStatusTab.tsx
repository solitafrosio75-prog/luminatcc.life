/**
 * KBStatusTab — Dashboard de estado de la base de conocimiento
 *
 * Muestra matriz de cobertura, stats, V3 availability,
 * y boton "Cargar Todo" para testing.
 */

import { useState, useCallback, useMemo } from 'react';
import { useKBCoverage } from '../hooks/useKBCoverage';
import { KBCoverageMatrix } from '../../../components/kb/KBCoverageMatrix';
import { useKnowledgeStore } from '../../../knowledge/loaders/knowledge.store';
import { getV3Techniques, getTechniqueV3Package } from '../../../knowledge/v3/resolver';
import type { KBArea, TechniqueId } from '../../../knowledge/types/technique.types';
import { KBBadge } from '../../../components/kb/KBBadge';
import type { CoverageCell } from '../../../components/kb/kb.types';

export function KBStatusTab() {
  const { techniques, matrix, stats, areaLabels } = useKBCoverage();
  const loadAreas = useKnowledgeStore((s) => s.loadAreas);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [v3Status, setV3Status] = useState<Record<string, 'ok' | 'error' | 'pending'>>({});

  const handleLoadAll = useCallback(async () => {
    setLoadingAll(true);
    setLoadProgress(0);
    for (let i = 0; i < techniques.length; i++) {
      const tech = techniques[i];
      const areas = Object.keys(tech.areas) as KBArea[];
      await loadAreas(tech.id, areas);
      setLoadProgress(((i + 1) / techniques.length) * 100);
    }
    setLoadingAll(false);
  }, [techniques, loadAreas]);

  const handleCheckV3 = useCallback(async () => {
    const v3Techs = getV3Techniques();
    const status: Record<string, 'ok' | 'error' | 'pending'> = {};

    for (const id of v3Techs) {
      status[id] = 'pending';
    }
    setV3Status({ ...status });

    for (const id of v3Techs) {
      try {
        await getTechniqueV3Package(id);
        status[id] = 'ok';
      } catch {
        status[id] = 'error';
      }
      setV3Status({ ...status });
    }
  }, []);

  const handleCellClick = useCallback((cell: CoverageCell) => {
    // Load the specific area on click
    if (cell.available && cell.status === 'idle') {
      loadAreas(cell.techniqueId, [cell.area]);
    }
  }, [loadAreas]);

  const v3Techniques = useMemo(() => {
    try {
      return getV3Techniques();
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">
          Estado de la Base de Conocimiento
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleCheckV3}
            className="px-3 py-1.5 text-xs border border-slate-700 rounded text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          >
            Verificar V3
          </button>
          <button
            onClick={handleLoadAll}
            disabled={loadingAll}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
          >
            {loadingAll ? `Cargando... ${Math.round(loadProgress)}%` : 'Cargar Todo'}
          </button>
        </div>
      </div>

      {/* Loading progress bar */}
      {loadingAll && (
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {/* Coverage Matrix */}
      <KBCoverageMatrix
        techniques={techniques}
        matrix={matrix}
        stats={stats}
        areaLabels={areaLabels}
        onCellClick={handleCellClick}
      />

      {/* V3 Profile/Procedures Status */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
          Perfiles y Procedimientos V3 ({v3Techniques.length} tecnicas)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {v3Techniques.map((id) => {
            const status = v3Status[id];
            return (
              <div
                key={id}
                className="border border-slate-800 rounded-lg px-3 py-2 bg-slate-900/50 flex items-center justify-between"
              >
                <span className="text-sm text-slate-300">{id}</span>
                {status === 'ok' && <KBBadge variant="success">OK</KBBadge>}
                {status === 'error' && <KBBadge variant="error">Error</KBBadge>}
                {status === 'pending' && <KBBadge variant="warning">...</KBBadge>}
                {!status && <KBBadge>Sin verificar</KBBadge>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Technique details */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
          Detalle por Tecnica
        </h3>
        <div className="space-y-2">
          {techniques.map((tech) => {
            const areaCount = Object.keys(tech.areas).length;
            return (
              <div
                key={tech.id}
                className="border border-slate-800 rounded-lg px-4 py-3 bg-slate-900/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-200">{tech.nombre}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {tech.id} v{tech.version}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <KBBadge variant="info">{areaCount} areas</KBBadge>
                    <KBBadge>{tech.fuentes_principales.length} fuentes</KBBadge>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{tech.descripcion}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
