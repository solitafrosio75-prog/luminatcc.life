/**
 * InventoryViewerTab — Visor interactivo de inventarios clinicos
 *
 * Seccion 1: Inventarios generales (shared)
 * Seccion 2: Herramientas de evaluacion por tecnica
 */

import { useState, useMemo, useCallback } from 'react';
import { useSharedKnowledge, useKnowledgeArea } from '../../../knowledge/loaders/useKnowledge';
import { SharedArea, KBArea, type TechniqueId } from '../../../knowledge/types/technique.types';
import { getRegisteredTechniques } from '../../../knowledge/registry';
import { KBInventoryCard } from '../../../components/kb/KBInventoryCard';
import { KBAreaDataViewer } from '../../../components/kb/KBAreaDataViewer';

interface Instrument {
  id?: string;
  nombre: string;
  siglas?: string;
  numero_items?: number;
  tiempo_aplicacion?: string;
  proposito?: string;
  puntos_corte?: Array<{ rango: string; interpretacion: string }>;
  [key: string]: unknown;
}

export function InventoryViewerTab() {
  const { data: inventariosData, isLoading: loadingShared } = useSharedKnowledge(
    SharedArea.INVENTARIOS_GENERALES,
  );

  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueId | null>(null);
  const [detailArea, setDetailArea] = useState<{ tech: TechniqueId; area: KBArea } | null>(null);

  const techniques = useMemo(() => getRegisteredTechniques(), []);

  const inventarios = useMemo(() => {
    if (!inventariosData) return [];
    const data = inventariosData as unknown as Record<string, unknown>;
    return (data.inventarios as Instrument[]) ?? [];
  }, [inventariosData]);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-slate-200">
        Inventarios y Herramientas de Evaluacion
      </h2>

      {/* Section 1: General inventories */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
          Inventarios Generales (Compartidos)
        </h3>

        {loadingShared ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-slate-800 rounded-lg" />
            <div className="h-24 bg-slate-800 rounded-lg" />
          </div>
        ) : inventarios.length === 0 ? (
          <p className="text-sm text-slate-500">No se encontraron inventarios.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {inventarios.map((inv, i) => (
              <KBInventoryCard key={inv.id ?? i} instrument={inv} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Per-technique evaluation tools */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
          Herramientas por Tecnica
        </h3>

        {/* Technique selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {techniques.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTechnique(t.id);
                setDetailArea({ tech: t.id, area: KBArea.HERRAMIENTAS_EVALUACION });
              }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                selectedTechnique === t.id
                  ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                  : 'border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {t.nombre}
            </button>
          ))}
        </div>

        {/* Evaluation tools viewer */}
        {detailArea && (
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
            <KBAreaDataViewer
              key={`${detailArea.tech}-${detailArea.area}`}
              techniqueId={detailArea.tech}
              area={detailArea.area}
            />
          </div>
        )}
      </section>
    </div>
  );
}
