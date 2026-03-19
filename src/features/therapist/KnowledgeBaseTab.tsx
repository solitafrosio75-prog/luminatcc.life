/**
 * KnowledgeBaseTab — Biblioteca clínica del Terapeuta TCC.
 *
 * Diseño master-detail:
 *  · Lista izquierda (320px) con cards compactas filtrables por categoría y búsqueda.
 *  · Panel derecho sticky con el contenido completo de la entrada seleccionada.
 *  · Sección inferior para agregar entradas propias con categoría, título, contenido y fuente.
 *
 * Las entradas built-in (isBuiltIn: true) son sólo-lectura y se muestran con un ícono de biblioteca.
 * Las entradas de usuario (isBuiltIn: false) pueden eliminarse y persisten en localStorage.
 */

import { useState } from 'react';
import { useTherapistStore }    from './therapistStore';
import type { KnowledgeCategory, KnowledgeEntry } from './therapistStore';
import { BUILT_IN_KNOWLEDGE }   from './knowledgeData';

// ════════════════════════════════════════════════════════════════════════════════
//  Metadata de categorías
// ════════════════════════════════════════════════════════════════════════════════

const KB_CATS: Record<KnowledgeCategory, { label: string; short: string; badge: string; dot: string }> = {
  distorsiones_cognitivas:  { label: 'Distorsiones Cognitivas',   short: 'Distorsiones',  badge: 'bg-rose-950/50 text-rose-400 border-rose-900/50',     dot: '#f87171' },
  tecnicas_tcc:             { label: 'Técnicas TCC',              short: 'Técnicas',      badge: 'bg-amber-950/50 text-amber-400 border-amber-900/50',   dot: '#fbbf24' },
  modelos_teoricos:         { label: 'Modelos Teóricos',          short: 'Modelos',       badge: 'bg-blue-950/50 text-blue-400 border-blue-900/50',      dot: '#60a5fa' },
  evaluacion:               { label: 'Evaluación',                short: 'Evaluación',    badge: 'bg-purple-950/50 text-purple-400 border-purple-900/50', dot: '#a78bfa' },
  diagnostico:              { label: 'Diagnóstico',               short: 'Diagnóstico',   badge: 'bg-teal-950/50 text-teal-400 border-teal-900/50',      dot: '#2dd4bf' },
  habilidades_terapeuticas: { label: 'Habilidades Terapéuticas',  short: 'Habilidades',   badge: 'bg-pink-950/50 text-pink-400 border-pink-900/50',      dot: '#f472b6' },
  investigacion:            { label: 'Investigación',             short: 'Investigación', badge: 'bg-cyan-950/50 text-cyan-400 border-cyan-900/50',      dot: '#22d3ee' },
  otro:                     { label: 'Otro',                      short: 'Otro',          badge: 'bg-slate-800/50 text-slate-400 border-slate-700/50',   dot: '#94a3b8' },
};

const ALL_CATS = Object.keys(KB_CATS) as KnowledgeCategory[];

// ════════════════════════════════════════════════════════════════════════════════
//  Content renderer — convierte el formato de texto plano en JSX
// ════════════════════════════════════════════════════════════════════════════════

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    const trimmed = line.trim();

    // Blank line → small spacer
    if (trimmed === '') {
      return <div key={i} className="h-2" />;
    }

    // UPPERCASE section header (all caps, at least 4 chars, no lowercase)
    if (/^[A-ZÁÉÍÓÚ\s0-9()Ñ]+$/.test(trimmed) && trimmed.length >= 4 && !/[a-záéíóúñü]/.test(trimmed)) {
      return (
        <p key={i} className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.18em] mt-5 mb-2 first:mt-0 border-b border-slate-800/60 pb-1">
          {trimmed}
        </p>
      );
    }

    // Socratic question → amber italic with left border
    if (trimmed.startsWith('→')) {
      return (
        <p key={i} className="text-xs text-amber-400/90 italic border-l-2 border-amber-800/60 pl-3 my-1 leading-relaxed">
          {trimmed.slice(1).trim()}
        </p>
      );
    }

    // Bullet
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      return (
        <p key={i} className="text-xs text-slate-400 leading-relaxed flex gap-2 my-0.5">
          <span className="text-slate-700 shrink-0 mt-0.5">•</span>
          <span>{trimmed.replace(/^[•\-]\s*/, '')}</span>
        </p>
      );
    }

    // Numbered list item  (1. ...)
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.+)/);
      if (match) {
        return (
          <p key={i} className="text-xs text-slate-400 leading-relaxed flex gap-2 my-0.5">
            <span className="text-slate-600 shrink-0 tabular-nums">{match[1]}.</span>
            <span>{match[2]}</span>
          </p>
        );
      }
    }

    // A) / B) sub-items
    if (/^[A-Z]\)\s/.test(trimmed)) {
      return (
        <p key={i} className="text-xs text-slate-400 leading-relaxed pl-3 my-0.5">
          {trimmed}
        </p>
      );
    }

    // Regular paragraph
    return (
      <p key={i} className="text-xs text-slate-400 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

// ════════════════════════════════════════════════════════════════════════════════
//  Sub-components (outside main to avoid re-mount)
// ════════════════════════════════════════════════════════════════════════════════

function EntryCard({
  entry,
  isSelected,
  onSelect,
  onDelete,
}: {
  entry:      KnowledgeEntry;
  isSelected: boolean;
  onSelect:   () => void;
  onDelete?:  () => void;
}) {
  const cat = KB_CATS[entry.category];
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-3 rounded-lg border transition-all group ${
        isSelected
          ? 'border-amber-800/60 bg-amber-950/25'
          : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.dot }} />
            <span className={`text-[9px] border rounded px-1.5 py-0.5 shrink-0 ${cat.badge}`}>
              {cat.short}
            </span>
            {entry.isBuiltIn && (
              <span className="text-[9px] text-slate-700 shrink-0">◈ biblioteca</span>
            )}
          </div>
          <p className={`text-xs font-medium leading-snug ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
            {entry.title}
          </p>
          <p className="text-[10px] text-slate-600 leading-relaxed mt-1 line-clamp-2">
            {entry.summary}
          </p>
        </div>

        {/* Delete button — user entries only */}
        {!entry.isBuiltIn && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-slate-800 hover:text-rose-500 transition-colors shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
            aria-label={`Eliminar ${entry.title}`}
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[9px] text-slate-700 bg-slate-800/40 rounded px-1.5 py-0.5">
              {tag}
            </span>
          ))}
          {entry.tags.length > 4 && (
            <span className="text-[9px] text-slate-800">+{entry.tags.length - 4}</span>
          )}
        </div>
      )}
    </button>
  );
}

function DetailPanel({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) {
  const cat = KB_CATS[entry.category];
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-full overflow-y-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] border rounded-full px-2.5 py-1 ${cat.badge}`}>
              {cat.label}
            </span>
            {entry.isBuiltIn && (
              <span className="text-[10px] text-slate-600 border border-slate-800 rounded-full px-2 py-0.5">
                ◈ Biblioteca integrada
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-slate-100 leading-tight">{entry.title}</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{entry.summary}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-700 hover:text-slate-400 transition-colors shrink-0 mt-0.5"
          aria-label="Cerrar detalle"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Separator */}
      <div className="border-t border-slate-800/60 mb-5" />

      {/* Content */}
      <div className="space-y-0.5">
        {renderContent(entry.content)}
      </div>

      {/* Source */}
      {entry.source && (
        <div className="mt-6 pt-4 border-t border-slate-800/40">
          <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-1">Referencia</p>
          <p className="text-[11px] text-slate-600 leading-relaxed italic">{entry.source}</p>
        </div>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="mt-4">
          <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-2">Etiquetas</p>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span key={tag} className="text-[10px] text-slate-600 bg-slate-800/50 rounded px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  Add Entry Form
// ════════════════════════════════════════════════════════════════════════════════

const EMPTY_FORM = {
  category:    'distorsiones_cognitivas' as KnowledgeCategory,
  title:       '',
  summary:     '',
  content:     '',
  source:      '',
  tagsRaw:     '',
};

function AddEntryForm({ onAdd }: { onAdd: (entry: Omit<KnowledgeEntry, 'id' | 'isBuiltIn' | 'addedAt'>) => void }) {
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [isOpen,   setIsOpen]   = useState(false);

  function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) return;
    onAdd({
      category: form.category,
      title:    form.title.trim(),
      summary:  form.summary.trim() || form.content.slice(0, 120).trim(),
      content:  form.content.trim(),
      source:   form.source.trim() || undefined,
      tags:     form.tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
    });
    setForm(EMPTY_FORM);
    setIsOpen(false);
  }

  return (
    <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-sm font-light">+</span>
          <span className="text-sm font-medium text-slate-300">Agregar entrada a la biblioteca</span>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-5 bg-slate-900/20 space-y-4 border-t border-slate-800">

          {/* Category */}
          <div>
            <label className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 block">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.category === cat
                      ? KB_CATS[cat].badge
                      : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  {KB_CATS[cat].short}
                </button>
              ))}
            </div>
          </div>

          {/* Title + Summary in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 block">
                Título <span className="text-rose-700">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Pensamiento Dicotómico"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 block">
                Resumen <span className="text-slate-700">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="1-2 oraciones descriptivas"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 block">
              Contenido <span className="text-rose-700">*</span>
              <span className="text-slate-700 ml-2 normal-case tracking-normal">
                — podés pegar texto, apuntes o fragmentos de bibliografía
              </span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder={`DESCRIPCIÓN\nDescripción clínica de la técnica o concepto...\n\nEJEMPLOS\n• Ejemplo 1\n• Ejemplo 2\n\nPREGUNTAS SOCRÁTICAS\n→ ¿Pregunta 1?`}
              rows={10}
              className="w-full resize-y bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-800 focus:outline-none focus:border-amber-900/50 transition-colors font-mono leading-relaxed"
            />
            <p className="text-[10px] text-slate-700 mt-1">
              Formato: SECCIONES EN MAYÚSCULAS · → para preguntas · • para bullets · 1. para listas
            </p>
          </div>

          {/* Source + Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 block">
                Fuente / Referencia <span className="text-slate-700">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="Beck (1979), DSM-5, apuntes propios..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 block">
                Etiquetas <span className="text-slate-700">(separadas por coma)</span>
              </label>
              <input
                type="text"
                value={form.tagsRaw}
                onChange={(e) => setForm((f) => ({ ...f, tagsRaw: e.target.value }))}
                placeholder="ansiedad, Beck, reestructuracion"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={() => { setForm(EMPTY_FORM); setIsOpen(false); }}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.title.trim() || !form.content.trim()}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-amber-800/40 border border-amber-700/40 text-amber-200 hover:bg-amber-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Agregar a la biblioteca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  Main exported component
// ════════════════════════════════════════════════════════════════════════════════

export function KnowledgeBaseTab() {
  const { userKnowledge, addKnowledgeEntry, removeKnowledgeEntry } = useTherapistStore();

  const [search,      setSearch]      = useState('');
  const [activeFilter, setActiveFilter] = useState<KnowledgeCategory | 'all'>('all');
  const [selectedId,  setSelectedId]  = useState<string | null>(BUILT_IN_KNOWLEDGE[0]?.id ?? null);

  // ── Merge built-in + user entries ──────────────────────────────────────────
  const allEntries: KnowledgeEntry[] = [...BUILT_IN_KNOWLEDGE, ...userKnowledge];

  // ── Filter ─────────────────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const filtered = allEntries.filter((e) => {
    const matchCat    = activeFilter === 'all' || e.category === activeFilter;
    const matchSearch = !q
      || e.title.toLowerCase().includes(q)
      || e.summary.toLowerCase().includes(q)
      || e.tags.some((t) => t.includes(q))
      || e.content.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const builtIns  = filtered.filter((e) => e.isBuiltIn);
  const userAdded = filtered.filter((e) => !e.isBuiltIn);
  const selected  = allEntries.find((e) => e.id === selectedId) ?? null;

  // ── Category counts ────────────────────────────────────────────────────────
  const catCounts = ALL_CATS.reduce<Record<KnowledgeCategory, number>>((acc, cat) => {
    acc[cat] = allEntries.filter((e) => e.category === cat).length;
    return acc;
  }, {} as Record<KnowledgeCategory, number>);

  return (
    <div className="space-y-5">

      {/* ── Top bar: search + stats ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-700"
            fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, contenido o etiqueta..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              title="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-[10px] text-slate-700 shrink-0 whitespace-nowrap">
          <span className="text-slate-400">{allEntries.length}</span> entradas
          {' · '}
          <span className="text-slate-500">{BUILT_IN_KNOWLEDGE.length} integradas</span>
          {userKnowledge.length > 0 && (
            <> · <span className="text-amber-600">{userKnowledge.length} propias</span></>
          )}
        </div>
      </div>

      {/* ── Category filter pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border shrink-0 transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-700/70 border-slate-600 text-slate-100'
              : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
          }`}
        >
          Todas ({allEntries.length})
        </button>
        {ALL_CATS.filter((c) => catCounts[c] > 0).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border shrink-0 transition-all ${
              activeFilter === cat
                ? KB_CATS[cat].badge
                : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
            }`}
          >
            {KB_CATS[cat].short} ({catCounts[cat]})
          </button>
        ))}
      </div>

      {/* ── Master-detail layout ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 border-dashed px-6 py-12 text-center">
          <p className="text-sm text-slate-700">Sin resultados para "{search}"</p>
          <p className="text-xs text-slate-800 mt-1">Probá con otra categoría o término de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">

          {/* ── Left: scrollable list ── */}
          <div className="space-y-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto lg:pr-1">

            {/* Built-in group */}
            {builtIns.length > 0 && (
              <div>
                <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-2 px-1">
                  ◈ Biblioteca integrada — {builtIns.length}
                </p>
                <div className="space-y-1.5">
                  {builtIns.map((e) => (
                    <EntryCard
                      key={e.id}
                      entry={e}
                      isSelected={selectedId === e.id}
                      onSelect={() => setSelectedId(e.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* User group */}
            {userAdded.length > 0 && (
              <div>
                <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-2 px-1">
                  ✦ Mi biblioteca — {userAdded.length}
                </p>
                <div className="space-y-1.5">
                  {userAdded.map((e) => (
                    <EntryCard
                      key={e.id}
                      entry={e}
                      isSelected={selectedId === e.id}
                      onSelect={() => setSelectedId(e.id)}
                      onDelete={() => {
                        removeKnowledgeEntry(e.id);
                        if (selectedId === e.id) setSelectedId(builtIns[0]?.id ?? null);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: detail panel ── */}
          <div className="lg:sticky lg:top-6">
            {selected ? (
              <DetailPanel
                entry={selected}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="rounded-xl border border-slate-800/50 border-dashed px-6 py-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 text-lg">
                  ◈
                </div>
                <p className="text-sm text-slate-700">Seleccioná una entrada para ver el detalle.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Add entry form ── */}
      <AddEntryForm onAdd={addKnowledgeEntry} />

    </div>
  );
}
