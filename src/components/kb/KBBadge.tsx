/**
 * KBBadge — Etiqueta visual reutilizable para la UI de conocimiento
 */

import type { ReactNode } from 'react';

interface KBBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const VARIANT_CLASSES: Record<NonNullable<KBBadgeProps['variant']>, string> = {
  default: 'border-slate-700 text-slate-400 bg-slate-900',
  success: 'border-emerald-700 text-emerald-400 bg-emerald-950',
  warning: 'border-amber-700 text-amber-400 bg-amber-950',
  error:   'border-rose-700 text-rose-400 bg-rose-950',
  info:    'border-blue-700 text-blue-400 bg-blue-950',
};

export function KBBadge({ children, variant = 'default' }: KBBadgeProps) {
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${VARIANT_CLASSES[variant]}`}>
      {children}
    </span>
  );
}
