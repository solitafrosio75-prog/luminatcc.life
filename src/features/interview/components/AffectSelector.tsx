/**
 * AffectSelector
 *
 * Selector de estado emocional auto-reportado basado en la escala SUDS
 * (Subjective Units of Distress Scale) adaptada a 5 niveles cualitativos.
 *
 * Aparece después de cada mensaje del terapeuta, antes de que el paciente
 * responda. Su función es doble:
 *   1. Capturar datos afectivos fiables (más precisos que detección textual)
 *   2. Anclar al paciente en su estado presente antes de responder
 *      (técnica de mindfulness momentáneo recomendada en DBT/CBT)
 *
 * El componente es intencionalmente compacto y no intrusivo.
 * La selección es opcional — si el paciente no la hace, el motor
 * cae en detección textual como fallback.
 */

import clsx from 'clsx';
import type { AffectValence } from '../interviewStore';

// ── Escala ────────────────────────────────────────────────────────────────────

const AFFECT_SCALE: {
  value: AffectValence;
  label: string;
  shortLabel: string;
  color: string;
  bgSelected: string;
  borderSelected: string;
}[] = [
  {
    value: 1,
    label: 'Muy mal',
    shortLabel: 'muy mal',
    color: 'text-rose-400',
    bgSelected: 'bg-rose-950/60',
    borderSelected: 'border-rose-700/60',
  },
  {
    value: 2,
    label: 'Mal',
    shortLabel: 'mal',
    color: 'text-orange-400',
    bgSelected: 'bg-orange-950/60',
    borderSelected: 'border-orange-700/60',
  },
  {
    value: 3,
    label: 'Regular',
    shortLabel: 'regular',
    color: 'text-slate-400',
    bgSelected: 'bg-slate-800/60',
    borderSelected: 'border-slate-600/60',
  },
  {
    value: 4,
    label: 'Bien',
    shortLabel: 'bien',
    color: 'text-teal-400',
    bgSelected: 'bg-teal-950/60',
    borderSelected: 'border-teal-700/60',
  },
  {
    value: 5,
    label: 'Muy bien',
    shortLabel: 'muy bien',
    color: 'text-emerald-400',
    bgSelected: 'bg-emerald-950/60',
    borderSelected: 'border-emerald-700/60',
  },
];

// Íconos SVG simples para cada nivel (sin emoji — más sobrio y profesional)
const AFFECT_ICONS: Record<AffectValence, JSX.Element> = {
  1: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 16.5c1-1.5 6-1.5 8 0" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 7.5 Q9 6 10.5 6.5" strokeLinecap="round" />
      <path d="M15 7.5 Q15 6 13.5 6.5" strokeLinecap="round" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 16h6" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  3: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 15.5h6" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  4: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14.5c1 1.5 6 1.5 8 0" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  5: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 13.5c1 2.5 6 2.5 8 0" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AffectSelectorProps {
  value: AffectValence | null;
  onChange: (v: AffectValence) => void;
  /** Si true, muestra la etiqueta de texto junto al ícono seleccionado */
  showLabel?: boolean;
  /** Si true, aparece con animación de entrada (fade + slide) */
  animate?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AffectSelector({ value, onChange, showLabel = true, animate = true }: AffectSelectorProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1.5',
        animate && 'animate-[fadeSlideIn_0.25s_ease-out]',
      )}
      role="group"
      aria-label="¿Cómo te sentís ahora mismo?"
    >
      {/* Etiqueta */}
      <span className="text-[10px] text-slate-700 uppercase tracking-widest shrink-0 select-none mr-1">
        ¿Cómo estás?
      </span>

      {/* Puntos de la escala */}
      {AFFECT_SCALE.map((item) => {
        const isSelected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            title={item.label}
            aria-label={item.label}
            className={clsx(
              'rounded-xl border transition-all duration-200 flex items-center justify-center',
              isSelected
                ? `${item.bgSelected} ${item.borderSelected} ${item.color} scale-110 shadow-sm px-3 py-1.5 gap-1.5`
                : 'bg-slate-900/60 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700 scale-100 w-8 h-8',
            )}
          >
            <span className={isSelected ? 'w-4 h-4' : 'w-5 h-5'}>
              {AFFECT_ICONS[item.value]}
            </span>
            {isSelected && showLabel && (
              <span className="text-[11px] font-medium whitespace-nowrap">{item.shortLabel}</span>
            )}
          </button>
        );
      })}

      {/* Clear si ya hay selección */}
      {value !== null && (
        <button
          type="button"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() => onChange(null as any)}
          className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-slate-500 transition-colors ml-0.5"
          title="Quitar selección"
          aria-label="Quitar selección"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
