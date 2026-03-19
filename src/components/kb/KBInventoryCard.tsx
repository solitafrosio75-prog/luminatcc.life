/**
 * KBInventoryCard — Tarjeta visual para un instrumento clinico
 */

import { KBBadge } from './KBBadge';

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

interface KBInventoryCardProps {
  instrument: Instrument;
  onPreview?: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  minima: 'text-emerald-400',
  leve: 'text-yellow-400',
  moderada: 'text-amber-400',
  grave: 'text-rose-400',
  severa: 'text-rose-500',
  alta: 'text-rose-400',
  baja: 'text-emerald-400',
  normal: 'text-emerald-400',
};

function getSeverityColor(interpretacion: string): string {
  const lower = interpretacion.toLowerCase();
  for (const [key, color] of Object.entries(SEVERITY_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'text-slate-300';
}

export function KBInventoryCard({ instrument, onPreview }: KBInventoryCardProps) {
  return (
    <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/50 hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          {instrument.siglas && (
            <span className="text-lg font-bold text-blue-400">{instrument.siglas}</span>
          )}
          <h4 className="text-sm font-medium text-slate-200 leading-tight">
            {instrument.nombre}
          </h4>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {instrument.numero_items != null && (
            <KBBadge>{instrument.numero_items} items</KBBadge>
          )}
          {instrument.tiempo_aplicacion && (
            <KBBadge variant="info">{instrument.tiempo_aplicacion}</KBBadge>
          )}
        </div>
      </div>

      {/* Purpose */}
      {instrument.proposito && (
        <p className="text-xs text-slate-400 mb-3">{instrument.proposito}</p>
      )}

      {/* Cut-off points */}
      {instrument.puntos_corte && instrument.puntos_corte.length > 0 && (
        <div className="space-y-1 mb-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Puntos de corte</div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {instrument.puntos_corte.map((pc, i) => (
              <div key={i} className="text-xs flex items-center gap-1.5">
                <span className="text-slate-500 font-mono">{pc.rango}</span>
                <span className={getSeverityColor(pc.interpretacion)}>
                  {pc.interpretacion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview button */}
      {onPreview && (
        <button
          onClick={onPreview}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Ver detalle
        </button>
      )}
    </div>
  );
}
