/**
 * KBTemplateFormPreview — Renderiza una plantilla como formulario interactivo
 *
 * Modo readOnly: campos deshabilitados (preview visual).
 * Modo editable: campos activos (para uso futuro en sesion).
 */

import type { FormField } from './kb.types';

interface KBTemplateFormPreviewProps {
  title?: string;
  fields: FormField[];
  readOnly?: boolean;
}

export function KBTemplateFormPreview({
  title,
  fields,
  readOnly = true,
}: KBTemplateFormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-lg">
        Sin campos definidos
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/50 p-4">
      {title && (
        <h4 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">
          {title}
        </h4>
      )}
      <div className="space-y-4">
        {fields.map((field) => (
          <FieldRenderer key={field.id} field={field} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}

// ── Field renderers ──

function FieldRenderer({ field, readOnly }: { field: FormField; readOnly: boolean }) {
  const labelEl = (
    <label className="block text-xs font-medium text-slate-400 mb-1">
      {field.label}
      {field.required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );

  const baseInputClass =
    'w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  switch (field.type) {
    case 'text':
      return (
        <div>
          {labelEl}
          <input
            type="text"
            disabled={readOnly}
            placeholder={field.label}
            className={baseInputClass}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {labelEl}
          <textarea
            disabled={readOnly}
            placeholder={field.label}
            rows={3}
            className={`${baseInputClass} resize-y`}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {labelEl}
          <input
            type="number"
            disabled={readOnly}
            placeholder="0"
            className={`${baseInputClass} max-w-[120px]`}
          />
        </div>
      );

    case 'date':
      return (
        <div>
          {labelEl}
          <input
            type="date"
            disabled={readOnly}
            className={`${baseInputClass} max-w-[200px]`}
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={readOnly}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
          />
          <label className="text-sm text-slate-300">
            {field.label}
            {field.required && <span className="text-rose-400 ml-0.5">*</span>}
          </label>
        </div>
      );

    case 'likert_1_5':
      return (
        <div>
          {labelEl}
          <div className="flex gap-3 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  disabled={readOnly}
                  className="w-4 h-4 border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500">{n}</span>
              </label>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div>
          {labelEl}
          <input
            type="text"
            disabled={readOnly}
            placeholder={field.label}
            className={baseInputClass}
          />
        </div>
      );
  }
}
