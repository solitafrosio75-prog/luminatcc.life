/**
 * KBCoverageMatrix — Matriz visual de cobertura tecnicas x areas
 *
 * Muestra un grid coloreado: verde (cargado), amarillo (disponible),
 * rojo (error), gris (no aplica).
 */

import type { CoverageCell, CoverageStats } from './kb.types';
import type { TechniqueManifest } from '../../knowledge/types/technique.types';

interface KBCoverageMatrixProps {
  techniques: TechniqueManifest[];
  matrix: CoverageCell[][];
  stats: CoverageStats;
  areaLabels: string[];
  onCellClick?: (cell: CoverageCell) => void;
}

const STATUS_COLORS = {
  loaded: 'bg-emerald-600 hover:bg-emerald-500',
  loading: 'bg-blue-600 animate-pulse',
  idle: 'bg-amber-700 hover:bg-amber-600',
  error: 'bg-rose-600 hover:bg-rose-500',
  unavailable: 'bg-slate-800',
} as const;

const STATUS_TOOLTIPS = {
  loaded: 'Cargado',
  loading: 'Cargando...',
  idle: 'Disponible (no cargado)',
  error: 'Error',
  unavailable: 'No aplica',
} as const;

export function KBCoverageMatrix({
  techniques,
  matrix,
  stats,
  areaLabels,
  onCellClick,
}: KBCoverageMatrixProps) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total areas" value={stats.total} />
        <StatCard label="Disponibles" value={stats.available} color="text-amber-400" />
        <StatCard label="Cargadas" value={stats.loaded} color="text-emerald-400" />
        <StatCard label="Errores" value={stats.errors} color="text-rose-400" />
        <StatCard label="Pendientes" value={stats.idle} color="text-slate-400" />
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-400">
        <LegendItem color="bg-emerald-600" label="Cargado" />
        <LegendItem color="bg-amber-700" label="Disponible" />
        <LegendItem color="bg-rose-600" label="Error" />
        <LegendItem color="bg-slate-800" label="N/A" />
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-950 z-10 text-left px-2 py-1 text-slate-500 font-normal">
                Tecnica
              </th>
              {areaLabels.map((label, i) => (
                <th
                  key={i}
                  className="px-0.5 py-1 text-slate-600 font-normal whitespace-nowrap"
                  title={label}
                >
                  <span className="inline-block max-w-[60px] overflow-hidden text-ellipsis">
                    {abbreviate(label)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {techniques.map((tech, rowIdx) => (
              <tr key={tech.id}>
                <td className="sticky left-0 bg-slate-950 z-10 px-2 py-1 text-slate-300 font-medium whitespace-nowrap">
                  {tech.nombre}
                </td>
                {matrix[rowIdx]?.map((cell, colIdx) => {
                  const colorClass = cell.available
                    ? STATUS_COLORS[cell.status]
                    : STATUS_COLORS.unavailable;
                  const tooltip = cell.available
                    ? `${cell.label}: ${STATUS_TOOLTIPS[cell.status]}`
                    : `${cell.label}: No aplica`;

                  return (
                    <td key={colIdx} className="px-0.5 py-0.5">
                      <button
                        onClick={() => cell.available && onCellClick?.(cell)}
                        title={tooltip}
                        className={`w-5 h-5 rounded-sm ${colorClass} transition-colors ${
                          cell.available ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ label, value, color = 'text-slate-200' }: { label: string; value: number; color?: string }) {
  return (
    <div className="border border-slate-800 rounded-lg px-3 py-2 bg-slate-900/50">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function abbreviate(label: string): string {
  // Take first 2 words
  const words = label.split(/\s+/).slice(0, 2);
  return words.join(' ');
}
