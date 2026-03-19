/**
 * KBAreaDataViewer — Renderiza el contenido JSON de un area de conocimiento
 *
 * Carga lazy via useKnowledgeArea(), muestra loading/error states,
 * y renderiza contenido con switch en area_id para vistas especializadas.
 */

import { useKnowledgeArea } from '../../knowledge/loaders/useKnowledge';
import type { KBArea, TechniqueId } from '../../knowledge/types/technique.types';
import { KB_AREA_LABELS } from '../../knowledge/types/technique.types';
import { KBBadge } from './KBBadge';

interface KBAreaDataViewerProps {
  techniqueId: TechniqueId;
  area: KBArea;
}

export function KBAreaDataViewer({ techniqueId, area }: KBAreaDataViewerProps) {
  const { data, isLoading, error } = useKnowledgeArea(techniqueId, area);
  const label = KB_AREA_LABELS[area] ?? area;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-6 bg-slate-800 rounded w-2/3" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-rose-800 rounded-lg bg-rose-950/30">
        <p className="text-rose-400 text-sm font-medium">Error cargando {label}</p>
        <p className="text-rose-500 text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-slate-500 text-sm">
        Sin datos para {label}
      </div>
    );
  }

  const record = data as unknown as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {getString(record, 'nombre') || label}
          </h2>
          {getString(record, 'descripcion') && (
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {getString(record, 'descripcion')}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <KBBadge>{techniqueId}</KBBadge>
          <KBBadge variant="info">{getString(record, 'area_id') || area}</KBBadge>
        </div>
      </div>

      {/* Sources */}
      {hasArray(record, 'fuentes') && (
        <Section title="Fuentes">
          <ul className="space-y-1">
            {(record.fuentes as string[]).map((f, i) => (
              <li key={i} className="text-xs text-slate-500 pl-3 border-l border-slate-800">
                {f}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Render all remaining keys generically */}
      {Object.entries(record)
        .filter(([key]) => !['area_id', 'nombre', 'descripcion', 'fuentes'].includes(key))
        .map(([key, value]) => (
          <Section key={key} title={formatKey(key)}>
            <DataNode value={value} depth={0} />
          </Section>
        ))}
    </div>
  );
}

// ============================================================================
// Subcomponentes de renderizado
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">
        {title}
      </h3>
      <div className="pl-1">{children}</div>
    </div>
  );
}

/** Renderizador recursivo generico para JSON arbitrario */
function DataNode({ value, depth }: { value: unknown; depth: number }) {
  if (value === null || value === undefined) {
    return <span className="text-slate-600 text-sm italic">null</span>;
  }

  if (typeof value === 'string') {
    // Long strings as block, short ones inline
    if (value.length > 100) {
      return <p className="text-sm text-slate-300 leading-relaxed">{value}</p>;
    }
    return <span className="text-sm text-slate-300">{value}</span>;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return (
      <span className="text-sm font-mono text-emerald-400">
        {String(value)}
      </span>
    );
  }

  if (Array.isArray(value)) {
    // Array of strings → compact list
    if (value.every((v) => typeof v === 'string')) {
      return (
        <ul className="space-y-0.5">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-slate-600 shrink-0 mt-0.5">-</span>
              <span>{item as string}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Array of objects → cards
    if (depth < 3) {
      return (
        <div className="space-y-3">
          {value.map((item, i) => (
            <div
              key={i}
              className="border border-slate-800 rounded-lg p-3 bg-slate-900/40"
            >
              <DataNode value={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }

    // Too deep → JSON
    return <JsonBlock value={value} />;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    if (depth >= 3) {
      return <JsonBlock value={value} />;
    }

    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => {
          const isSimple = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
          if (isSimple) {
            return (
              <div key={k} className="flex items-start gap-2">
                <span className="text-xs text-slate-500 font-medium shrink-0 min-w-[120px]">
                  {formatKey(k)}:
                </span>
                <DataNode value={v} depth={depth + 1} />
              </div>
            );
          }
          return (
            <div key={k}>
              <div className="text-xs text-slate-500 font-medium mb-1">
                {formatKey(k)}
              </div>
              <div className="pl-3 border-l border-slate-800">
                <DataNode value={v} depth={depth + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <JsonBlock value={value} />;
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded p-2 overflow-x-auto max-h-60">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

function hasArray(obj: Record<string, unknown>, key: string): boolean {
  return Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0;
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
