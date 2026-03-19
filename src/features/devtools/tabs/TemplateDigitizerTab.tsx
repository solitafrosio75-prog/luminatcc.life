/**
 * TemplateDigitizerTab — Constructor de plantillas clinicas
 *
 * Two-column layout: builder a la izquierda, preview a la derecha.
 * Usa useTemplateStore para estado y persistencia.
 */

import { useEffect } from 'react';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { KBTemplateFormPreview } from '../../../components/kb/KBTemplateFormPreview';
import { KBBadge } from '../../../components/kb/KBBadge';
import type { FormFieldType, TemplateKind } from '../../../components/kb/kb.types';
import { BUILT_IN_TEMPLATES } from '../../../components/kb/kb.types';
import { useState } from 'react';

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Numero' },
  { value: 'likert_1_5', label: 'Likert 1-5' },
  { value: 'checkbox', label: 'Casilla' },
  { value: 'date', label: 'Fecha' },
];

const TEMPLATE_KINDS: { value: TemplateKind; label: string }[] = [
  { value: 'formulario', label: 'Formulario' },
  { value: 'registro', label: 'Registro' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'cuestionario', label: 'Cuestionario' },
];

export function TemplateDigitizerTab() {
  const store = useTemplateStore();
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    store.loadFromStorage();
  }, []);

  const allTemplates = [...BUILT_IN_TEMPLATES, ...store.customTemplates];
  const templateToPreview = previewTemplate
    ? allTemplates.find((t) => t.id === previewTemplate) ?? null
    : null;

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    store.addBuilderField({
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
    });
    setNewFieldLabel('');
    setNewFieldRequired(false);
  };

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500';
  const selectClass =
    'bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-200">
        Digitalizador de Plantillas
      </h2>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left: Builder */}
        <div className="flex-1 space-y-4">
          {/* Template metadata */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30 space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Nueva plantilla</h3>

            <input
              type="text"
              value={store.builderName}
              onChange={(e) => store.setBuilderName(e.target.value)}
              placeholder="Nombre de la plantilla"
              className={inputClass}
            />

            <div className="flex gap-3">
              <select
                value={store.builderKind}
                onChange={(e) => store.setBuilderKind(e.target.value as TemplateKind)}
                className={selectClass}
              >
                {TEMPLATE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>

              <input
                type="text"
                value={store.builderTechniques}
                onChange={(e) => store.setBuilderTechniques(e.target.value)}
                placeholder="Tecnicas (ac, rc, trec...)"
                className={`${inputClass} flex-1`}
              />
            </div>

            <textarea
              value={store.builderDescription}
              onChange={(e) => store.setBuilderDescription(e.target.value)}
              placeholder="Descripcion de la plantilla"
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Field builder */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30 space-y-3">
            <h3 className="text-sm font-medium text-slate-300">
              Campos ({store.builderFields.length})
            </h3>

            {/* Existing fields */}
            {store.builderFields.length > 0 && (
              <div className="space-y-1">
                {store.builderFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{field.label}</span>
                      <KBBadge>{field.type}</KBBadge>
                      {field.required && <KBBadge variant="warning">req</KBBadge>}
                    </div>
                    <button
                      onClick={() => store.removeBuilderField(field.id)}
                      className="text-xs text-rose-500 hover:text-rose-400"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add field form */}
            <div className="flex gap-2 items-end">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                placeholder="Nombre del campo"
                className={`${inputClass} flex-1`}
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as FormFieldType)}
                className={selectClass}
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800"
                />
                Req
              </label>
              <button
                onClick={handleAddField}
                className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => store.buildAndSave()}
              disabled={!store.builderName.trim() || store.builderFields.length === 0}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar plantilla
            </button>
            <button
              onClick={() => store.clearBuilder()}
              className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-96 shrink-0 space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Preview</h3>

          {store.builderFields.length > 0 ? (
            <KBTemplateFormPreview
              title={store.builderName || 'Sin titulo'}
              fields={store.builderFields}
              readOnly
            />
          ) : (
            <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-sm text-slate-500">
              Agrega campos para ver el preview
            </div>
          )}
        </div>
      </div>

      {/* Existing templates */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
          Plantillas existentes ({allTemplates.length})
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {allTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-slate-800 rounded-lg p-3 bg-slate-900/50 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-medium text-slate-200">{tpl.name}</h4>
                <div className="flex gap-1">
                  <KBBadge>{tpl.kind}</KBBadge>
                  {tpl.isBuiltIn && <KBBadge variant="info">built-in</KBBadge>}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">{tpl.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{tpl.fields.length} campos</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTemplate(tpl.id === previewTemplate ? null : tpl.id)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {previewTemplate === tpl.id ? 'Cerrar' : 'Preview'}
                  </button>
                  <button
                    onClick={() => store.exportAsJSON(tpl)}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Exportar
                  </button>
                  {!tpl.isBuiltIn && (
                    <button
                      onClick={() => store.removeTemplate(tpl.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {/* Inline preview */}
              {previewTemplate === tpl.id && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <KBTemplateFormPreview fields={tpl.fields} readOnly />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
