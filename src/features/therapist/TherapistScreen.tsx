/**
 * TherapistScreen — Dashboard clínico del Terapeuta Perfecto.
 *
 * Cuatro pestañas:
 *   1. Capacidades  — Perfil completo: modelos, técnicas, protocolos, habilidades, personalizadas
 *   2. Sesión       — Estado y métricas por sesión (actual o histórica)
 *   3. Conocimiento — Base de conocimiento clínico: distorsiones, técnicas, aportes del usuario
 *   4. Configurar   — Agregar capacidades, técnicas, herramientas personalizadas
 */

import { useState }     from 'react';
import { useNavigate }  from 'react-router-dom';
import { KnowledgeBaseTab }   from './KnowledgeBaseTab';
import { TechniqueExplorer }  from './TechniqueExplorer';
import { useTherapistStore } from './therapistStore';
import { AFFECT_LABELS }     from '../interview/interviewStore';
import { TECHNIQUE_PROFILES, TECH_CAT_META } from './techniqueData';
import type { AffectEntry, CustomCapability, CustomCapabilityCategory } from './therapistStore';

// ════════════════════════════════════════════════════════════════════════════════
//  Static knowledge base
// ════════════════════════════════════════════════════════════════════════════════

const FOUNDATIONS = [
  {
    id:      'conductual',
    title:   'Modelos Conductuales',
    border:  'border-amber-900/40',
    bg:      'bg-amber-950/15',
    accent:  'text-amber-400',
    dot:     '#d97706',
    authors: ['Pavlov', 'Skinner', 'Bandura'],
    concepts: [
      { name: 'Condicionamiento Clásico',  desc: 'Fobias y ansiedad son respuestas condicionadas, no rasgos del carácter.' },
      { name: 'Condicionamiento Operante', desc: 'Refuerzo negativo (evitación) como motor principal de los trastornos de ansiedad.' },
      { name: 'Aprendizaje Vicario',       desc: 'El entorno y el modelado conforman la conducta. Autoeficacia modificable.' },
    ],
  },
  {
    id:      'cognitivo',
    title:   'Modelos Cognitivos',
    border:  'border-blue-900/40',
    bg:      'bg-blue-950/15',
    accent:  'text-blue-400',
    dot:     '#3b82f6',
    authors: ['Beck', 'Ellis', 'Young'],
    concepts: [
      { name: 'Tríada Cognitiva (Beck)', desc: 'Yo / Mundo / Futuro. Cadena PA → Creencia Intermedia → Creencia Nuclear.' },
      { name: 'TREC (Ellis)',            desc: 'El evento no causa la emoción — la evaluación sí. Creencias irracionales.' },
      { name: 'Esquemas (Young)',        desc: '18 Esquemas Tempranos Desadaptativos. Para trastornos complejos de personalidad.' },
    ],
  },
  {
    id:      'tercera',
    title:   'Tercera Generación',
    border:  'border-purple-900/40',
    bg:      'bg-purple-950/15',
    accent:  'text-purple-400',
    dot:     '#8b5cf6',
    authors: ['Hayes', 'Linehan', 'Kabat-Zinn'],
    concepts: [
      { name: 'ACT (Hayes)',        desc: 'Defusión cognitiva, Aceptación, Valores, Flexibilidad Psicológica.' },
      { name: 'DBT (Linehan)',      desc: 'Dialéctica: aceptar Y exigir cambio. Para desregulación emocional grave.' },
      { name: 'Mindfulness',        desc: 'Observación sin juicio de la experiencia interna como práctica base.' },
    ],
  },
  {
    id:      'conceptualizacion',
    title:   'Conceptualización de Caso',
    border:  'border-teal-900/40',
    bg:      'bg-teal-950/15',
    accent:  'text-teal-400',
    dot:     '#14b8a6',
    authors: ['Análisis funcional permanente'],
    concepts: [
      { name: 'Predisponentes', desc: 'Genética, crianza, aprendizaje temprano — la historia del sistema.' },
      { name: 'Precipitantes',  desc: 'El evento que disparó el problema actual.' },
      { name: 'Perpetuadores',  desc: 'Evitación, refuerzo negativo, creencias disfuncionales que mantienen el problema.' },
    ],
  },
] as const;

const TECHNIQUES = [
  { key: 'exploracion',            color: '#6b7280', label: 'Exploración empática',    desc: 'Escucha activa sin juicio. Refleja el contenido emocional. Valida antes de preguntar.' },
  { key: 'socratica',              color: '#d97706', label: 'Diálogo socrático',       desc: 'Descubrimiento guiado — el paciente llega solo a la conclusión. No se da la respuesta.' },
  { key: 'reestructuracion',       color: '#3b82f6', label: 'Reestructuración cog.',   desc: 'Identificar PA → examinar evidencias A FAVOR y EN CONTRA → pensamiento alternativo balanceado.' },
  { key: 'activacion_conductual',  color: '#10b981', label: 'Activación conductual',   desc: 'Romper el círculo vicioso retirada → menos refuerzo → más retirada. El movimiento precede a la motivación.' },
  { key: 'exposicion',             color: '#f97316', label: 'Exposición gradual (EPR)', desc: 'Jerarquía de estímulos 0-100 SUDS. Extinción en la amígdala. La ansiedad no es peligrosa.' },
  { key: 'defusion_act',           color: '#8b5cf6', label: 'Defusión cognitiva ACT',  desc: 'No debatir el pensamiento — observarlo como evento mental. "Tu mente está diciendo que..."' },
  { key: 'validacion_dbt',         color: '#14b8a6', label: 'Validación radical DBT',  desc: 'Validar completamente la experiencia → desde la aceptación total, introducir el cambio.' },
  { key: 'experimento_conductual', color: '#6366f1', label: 'Experimento conductual',  desc: 'Predicción específica → conducta → observación → conclusión. La evidencia supera al debate.' },
  { key: 'psicoeducacion',         color: '#0ea5e9', label: 'Psicoeducación',          desc: 'Modelo en lenguaje accesible, sin jerga. Máx 3 conceptos. Verificar comprensión siempre.' },
  { key: 'analisis_funcional',     color: '#f43f5e', label: 'Análisis funcional ABC',  desc: 'Antecedente → Conducta → Consecuencia. Identificar refuerzo negativo y beneficios secundarios.' },
];

const PROTOCOLS = [
  { name: 'EPR — Exposición y Prevención de Respuesta', disorder: 'TOC',                     color: '#f97316' },
  { name: 'Activación Conductual',                      disorder: 'Depresión Mayor',          color: '#10b981' },
  { name: 'Terapia de Procesamiento Cognitivo (TPC)',   disorder: 'PTSD / Trauma',            color: '#3b82f6' },
  { name: 'Protocolo Unificado de Barlow',              disorder: 'Transdiagnóstico',         color: '#8b5cf6' },
  { name: 'Terapia de Esquemas de Young',               disorder: 'T. de Personalidad',       color: '#d97706' },
  { name: 'DBT — Terapia Dialéctico-Conductual',        disorder: 'Desregulación emocional',  color: '#14b8a6' },
];

const RELATIONAL_SKILLS = [
  { name: 'Empatía Estratégica',     desc: 'Valida la emoción SIN validar la distorsión cognitiva. "Es lógico que sientas pánico si creés que vas a morir."' },
  { name: 'Aceptación Incondicional',desc: 'Ningún relato desestabiliza. Traumas, impulsos tabú, contradicciones — cero juicio.' },
  { name: 'Autenticidad',            desc: 'Genuino/a, cálido/a, presente. La curiosidad por el paciente es real, no performativa.' },
  { name: 'Directividad Flexible',   desc: 'Dirige la sesión con agenda sin ser autoritario/a. Reencuadra la dispersión suavemente.' },
  { name: 'Habilidad Socrática',     desc: 'La pregunta ingenua: aparenta no saber para que el paciente se escuche a sí mismo.' },
];

const ETHICAL_CAPS = [
  { name: 'Meta terapéutica',         desc: 'El objetivo último: que el paciente deje de necesitar al terapeuta. Transfiere todas las herramientas.' },
  { name: 'Automonitoreo de sesgos',  desc: 'No proyecta sus valores al paciente. Detecta contratransferencia. Busca supervisión ante puntos ciegos.' },
  { name: 'Flexibilidad técnica',     desc: 'Si una técnica no reduce síntomas, se modifica. No hay técnicas sagradas — la evidencia manda.' },
  { name: 'Resiliencia emocional',    desc: 'Capacidad de mantenerse contenido/a ante cualquier relato o situación de crisis extrema.' },
];

const PHASE_LABELS: Record<string, string> = {
  check_in:            'Check-in',
  agenda:              'Agenda',
  homework_review:     'Tarea anterior',
  main_work:           'Trabajo TCC',
  summary:             'Síntesis',
  homework_assignment: 'Tarea',
  closure:             'Cierre',
  crisis:              '⚠ Crisis',
};

const DISTORTION_LABELS: Record<string, string> = {
  catastrofizacion:       'Catastrofización',
  pensamiento_dicotomico: 'Todo o nada',
  abstraccion_selectiva:  'Abstracción selectiva',
  generalizacion:         'Generalización',
  descalificacion:        'Descalificación',
  lectura_mental:         'Lectura mental',
  adivinanza:             'Adivinanza',
  magnificacion:          'Magnificación',
  razonamiento_emocional: 'Razonamiento emocional',
  deberia:                'Pensamiento "debería"',
  etiquetacion:           'Etiquetación',
  personalizacion:        'Personalización',
};

const CATEGORY_META: Record<CustomCapabilityCategory, { label: string; badge: string }> = {
  tecnica:      { label: 'Técnica TCC',           badge: 'bg-amber-950/50 text-amber-400 border-amber-900/50' },
  modelo:       { label: 'Modelo Teórico',         badge: 'bg-blue-950/50 text-blue-400 border-blue-900/50' },
  protocolo:    { label: 'Protocolo',              badge: 'bg-orange-950/50 text-orange-400 border-orange-900/50' },
  habilidad:    { label: 'Habilidad Relacional',   badge: 'bg-rose-950/50 text-rose-400 border-rose-900/50' },
  herramienta:  { label: 'Herramienta',            badge: 'bg-teal-950/50 text-teal-400 border-teal-900/50' },
  conocimiento: { label: 'Conocimiento Clínico',   badge: 'bg-purple-950/50 text-purple-400 border-purple-900/50' },
};

// ════════════════════════════════════════════════════════════════════════════════
//  Shared small components (defined outside to avoid re-mount on render)
// ════════════════════════════════════════════════════════════════════════════════

function SectionHeader({ title, icon, sub }: { title: string; icon: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-lg leading-none">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-slate-200 leading-none">{title}</h3>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-4 space-y-3">
      <p className="text-[10px] text-slate-600 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function NumberStat({ label, value, accent = 'text-slate-200' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}

function RapportBar({ value }: { value: number }) {
  const pct   = (value / 5) * 100;
  const color = value >= 3.5 ? '#10b981' : value >= 2 ? '#d97706' : '#ef4444';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] text-slate-600">0</span>
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value.toFixed(1)}
          <span className="text-sm text-slate-600 font-normal ml-1">/ 5</span>
        </span>
        <span className="text-[10px] text-slate-600">5</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AffectSparkline({ history }: { history: AffectEntry[] }) {
  if (history.length === 0) {
    return <p className="text-xs text-slate-700 py-2">Sin datos afectivos aún.</p>;
  }
  if (history.length === 1) {
    return (
      <p className="text-xs text-slate-400">
        Un punto — {AFFECT_LABELS[history[0].valence]}
      </p>
    );
  }

  const W = 260, H = 52, PAD = 8;
  const pts = history.map((e, i) => ({
    x: PAD + (i / (history.length - 1)) * (W - 2 * PAD),
    y: H - PAD - ((e.valence - 1) / 4) * (H - 2 * PAD),
    v: e.valence,
    label: e.label,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 52 }}>
        {/* Horizontal grid lines for each valence level */}
        {[1, 2, 3, 4, 5].map((v) => {
          const y = H - PAD - ((v - 1) / 4) * (H - 2 * PAD);
          return (
            <line key={v} x1={PAD} y1={y} x2={W - PAD} y2={y}
              stroke="#1e293b" strokeWidth={0.5} />
          );
        })}
        {/* Path */}
        <polyline points={polyline} fill="none" stroke="#d97706"
          strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Data dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={2.5} fill="#d97706" />
            {i === pts.length - 1 && (
              <circle cx={p.x} cy={p.y} r={5} fill="none" stroke="#d97706" strokeWidth={1} opacity={0.5} />
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-slate-700">
        {['muy mal', '', '', '', 'muy bien'].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SessionTechniquePanel — Step-by-step technique guide during active session
// ════════════════════════════════════════════════════════════════════════════════

function SessionTechniquePanel() {
  const store = useTherapistStore();
  const { sessionTechniqueId, sessionTechniqueStep } = store;

  const tech = sessionTechniqueId
    ? TECHNIQUE_PROFILES.find((t) => t.id === sessionTechniqueId) ?? null
    : null;

  if (!tech) return null;

  const totalSteps = tech.steps.length;
  const step       = Math.min(sessionTechniqueStep, totalSteps - 1);
  const current    = tech.steps[step];
  const meta       = TECH_CAT_META[tech.category];

  return (
    <section className="rounded-xl border border-blue-900/40 bg-blue-950/10 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-blue-900/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest text-blue-500 font-semibold">Técnica activa</span>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        <button
          onClick={() => store.setSessionTechnique(null)}
          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"
          aria-label="Cerrar panel de técnica"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Technique name + progress */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 leading-tight">{tech.name}</h3>
            {tech.abbr && <span className="text-[10px] text-slate-600">{tech.abbr}</span>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] text-slate-500">
              Paso <span className="text-slate-300 font-medium tabular-nums">{step + 1}</span> / {totalSteps}
            </span>
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {tech.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => store.setSessionTechniqueStep(i)}
                  className={`transition-all rounded-full ${
                    i === step
                      ? 'w-4 h-2 bg-blue-500'
                      : i < step
                      ? 'w-2 h-2 bg-blue-800'
                      : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Current step */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-900/60 border border-blue-800/60 text-[10px] font-bold text-blue-400 shrink-0">
              {current.n}
            </span>
            <h4 className="text-xs font-semibold text-slate-200 leading-snug">{current.title}</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pl-7">{current.body}</p>

          {current.substeps && (
            <ul className="pl-10 space-y-1">
              {current.substeps.map((sub, i) => (
                <li key={i} className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="text-slate-700 mr-1.5">·</span>{sub}
                </li>
              ))}
            </ul>
          )}

          {current.tip && (
            <div className="ml-7 flex items-start gap-2 rounded-md border border-amber-900/30 bg-amber-950/15 px-3 py-2">
              <span className="text-amber-500 text-[11px] shrink-0 mt-0.5">💡</span>
              <p className="text-[11px] text-amber-400/80 leading-relaxed">{current.tip}</p>
            </div>
          )}

          {current.example && (
            <div className="ml-7 flex items-start gap-2 rounded-md border border-teal-900/30 bg-teal-950/10 px-3 py-2">
              <span className="text-teal-500 text-[11px] shrink-0 mt-0.5">💬</span>
              <p className="text-[11px] text-teal-400/80 leading-relaxed italic">{current.example}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => store.setSessionTechniqueStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Anterior
          </button>

          {step < totalSteps - 1 ? (
            <button
              onClick={() => store.advanceSessionTechniqueStep()}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-blue-900/40 border border-blue-800/50 text-blue-300 hover:bg-blue-900/60 transition-all"
            >
              Siguiente paso
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => store.setSessionTechnique(null)}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/60 transition-all"
            >
              ✓ Técnica completada
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  Main component
// ════════════════════════════════════════════════════════════════════════════════

type Tab = 'capacidades' | 'sesion' | 'conocimiento' | 'tecnicas' | 'configurar';
type SelectedSession = 'current' | number;

export function TherapistScreen() {
  const navigate = useNavigate();
  const store    = useTherapistStore();

  const [activeTab,         setActiveTab]         = useState<Tab>('capacidades');
  const [selectedSession,   setSelectedSession]   = useState<SelectedSession>('current');
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  const [addForm, setAddForm] = useState<{
    category:    CustomCapabilityCategory;
    name:        string;
    description: string;
  }>({ category: 'tecnica', name: '', description: '' });

  // ── Derived: session being viewed ───────────────────────────────────────────
  const pastSession = selectedSession !== 'current'
    ? store.pastSessions.find((s) => s.sessionNumber === selectedSession) ?? null
    : null;

  // ── Handle add capability ────────────────────────────────────────────────────
  function handleAdd() {
    if (!addForm.name.trim()) return;
    store.addCustomCapability({
      category:    addForm.category,
      name:        addForm.name.trim(),
      description: addForm.description.trim(),
    });
    setAddForm((f) => ({ ...f, name: '', description: '' }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  Tab 1: CAPACIDADES
  // ════════════════════════════════════════════════════════════════════════════
  const capacidadesContent = (
    <div className="space-y-10">

      {/* ── Fundamentos teóricos ── */}
      <section>
        <SectionHeader icon="📚" title="Fundamentos Teóricos" sub="4 escuelas integradas" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOUNDATIONS.map((f) => (
            <div key={f.id} className={`rounded-xl border p-5 ${f.border} ${f.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-semibold ${f.accent}`}>{f.title}</h4>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {f.authors.map((a) => (
                    <span key={a} className="text-[9px] text-slate-600 border border-slate-800 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                {f.concepts.map((c) => (
                  <div key={c.name}>
                    <p className="text-xs font-medium text-slate-300">{c.name}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Técnicas TCC ── */}
      <section>
        <SectionHeader icon="⚗" title="Técnicas TCC" sub={`${TECHNIQUES.length} técnicas — click para expandir`} />
        <div className="space-y-1.5">
          {TECHNIQUES.map((t) => {
            const isExpanded = expandedTechnique === t.key;
            const isActive   = store.activeTechnique === t.key;
            return (
              <div
                key={t.key}
                className={`rounded-lg border transition-all ${
                  isActive
                    ? 'border-amber-800/50 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                }`}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => setExpandedTechnique(isExpanded ? null : t.key)}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.color, boxShadow: isActive ? `0 0 6px ${t.color}60` : 'none' }}
                  />
                  <span className="text-sm text-slate-200 flex-1">{t.label}</span>
                  {isActive && (
                    <span className="text-[10px] text-amber-500 border border-amber-900/50 bg-amber-950/30 rounded-full px-2 py-0.5 shrink-0">
                      activa
                    </span>
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-3 h-3 text-slate-600 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-slate-800/50">
                    <p className="text-xs text-slate-400 leading-relaxed pt-2.5">{t.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Protocolos ── */}
      <section>
        <SectionHeader icon="📋" title="Protocolos Basados en Evidencia" sub="Indicación específica por diagnóstico" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROTOCOLS.map((p) => (
            <div key={p.name} className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 flex gap-3">
              <div className="w-1 rounded-full shrink-0 self-stretch" style={{ backgroundColor: p.color }} />
              <div>
                <p className="text-xs font-medium text-slate-200 leading-relaxed">{p.name}</p>
                <p className="text-[10px] text-slate-600 mt-1">{p.disorder}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Habilidades relacionales ── */}
      <section>
        <SectionHeader icon="♥" title="Habilidades Relacionales" sub="La alianza terapéutica como vehículo del cambio" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RELATIONAL_SKILLS.map((s) => (
            <div key={s.name} className="rounded-lg border border-rose-900/30 bg-rose-950/10 px-4 py-3">
              <p className="text-xs font-semibold text-rose-300 mb-1.5">{s.name}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capacidades éticas ── */}
      <section>
        <SectionHeader icon="⚖" title="Capacidades Éticas" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ETHICAL_CAPS.map((c) => (
            <div key={c.name} className="rounded-lg border border-slate-700/40 bg-slate-800/20 px-4 py-3">
              <p className="text-xs font-semibold text-slate-300 mb-1.5">{c.name}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capacidades personalizadas ── */}
      {store.customCapabilities.length > 0 && (
        <section>
          <SectionHeader
            icon="✦"
            title="Capacidades Personalizadas"
            sub={`${store.customCapabilities.length} añadidas`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {store.customCapabilities.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg border px-4 py-3 ${CATEGORY_META[c.category].badge}`}
              >
                <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">
                  {CATEGORY_META[c.category].label}
                </p>
                <p className="text-xs font-semibold">{c.name}</p>
                {c.description && (
                  <p className="text-[11px] opacity-70 leading-relaxed mt-1">{c.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  Tab 2: SESIÓN
  // ════════════════════════════════════════════════════════════════════════════
  const sesionContent = (
    <div className="space-y-6">

      {/* ── Session selector ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-1">Sesión:</span>
        <button
          onClick={() => setSelectedSession('current')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            selectedSession === 'current'
              ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          Actual — #{store.sessionNumber}
        </button>
        {[...store.pastSessions].reverse().map((s) => (
          <button
            key={s.sessionNumber}
            onClick={() => setSelectedSession(s.sessionNumber)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              selectedSession === s.sessionNumber
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
            }`}
          >
            #{s.sessionNumber}
            <span className="ml-1.5 text-[9px] opacity-50">{s.date}</span>
          </button>
        ))}
      </div>

      {selectedSession === 'current' ? (
        /* ── CURRENT SESSION ────────────────────────────────────────────────── */
        <div className="space-y-6">

          {/* Status strip */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'FASE',       value: PHASE_LABELS[store.phase] ?? store.phase, color: 'border-amber-800/50 bg-amber-950/30 text-amber-300' },
              { label: 'TONO',       value: store.emotionalTone, color: 'border-slate-700 bg-slate-800/60 text-slate-300' },
              { label: 'INTENSIDAD', value: `${store.emotionalIntensity}/5`, color: store.emotionalIntensity >= 4 ? 'border-rose-800/50 bg-rose-950/30 text-rose-300' : 'border-slate-700 bg-slate-800/60 text-slate-300' },
            ].map((b) => (
              <div key={b.label} className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 ${b.color}`}>
                <span className="text-[9px] opacity-50 uppercase tracking-widest">{b.label}</span>
                <span className="text-xs font-medium">{b.value}</span>
              </div>
            ))}
            {store.activeTechnique && (
              <div className="flex items-center gap-1.5 border border-blue-800/50 bg-blue-950/30 text-blue-300 rounded-full px-3 py-1.5">
                <span className="text-[9px] opacity-50 uppercase tracking-widest">TÉCNICA</span>
                <span className="text-xs font-medium">{store.activeTechnique.replace(/_/g, ' ')}</span>
              </div>
            )}
            {store.crisisDetected && (
              <div className="flex items-center border border-rose-800/50 bg-rose-950/40 text-rose-400 rounded-full px-3 py-1.5 animate-pulse">
                <span className="text-xs font-bold">⚠ CRISIS ACTIVA</span>
              </div>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <MetricCard title="Vínculo terapéutico — Rapport">
              <RapportBar value={store.rapportScore} />
            </MetricCard>

            <MetricCard title="Trayectoria afectiva">
              <AffectSparkline history={store.affectHistory} />
              {store.lastAffectValence && (
                <p className="text-[10px] text-slate-600">
                  Último reporte:{' '}
                  <span className="text-amber-500">{AFFECT_LABELS[store.lastAffectValence]}</span>
                  {' '}· {store.affectHistory.length} punto{store.affectHistory.length !== 1 ? 's' : ''}
                </p>
              )}
            </MetricCard>

            <MetricCard title="Métricas cuantitativas">
              <div className="grid grid-cols-3 gap-4">
                <NumberStat label="Mensajes"    value={store.messages.length} />
                <NumberStat label="Turnos"      value={store.conversationHistory.filter((m) => m.role === 'user').length} />
                <NumberStat label="Pensamientos" value={store.capturedThoughts.length} />
              </div>
            </MetricCard>

            <MetricCard title="Objetivos de sesión">
              {store.sessionGoals.length === 0 ? (
                <p className="text-xs text-slate-700">No establecidos aún.</p>
              ) : (
                <div className="space-y-2">
                  {store.sessionGoals.map((g) => (
                    <div key={g.id} className="flex items-start gap-2">
                      <span className={`text-xs shrink-0 mt-0.5 ${g.completed ? 'text-emerald-500' : 'text-slate-600'}`}>
                        {g.completed ? '✓' : '○'}
                      </span>
                      <p className={`text-xs leading-relaxed ${g.completed ? 'text-emerald-600 line-through' : 'text-slate-400'}`}>
                        {g.text}
                      </p>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-700 pt-1 border-t border-slate-800 mt-2">
                    {store.sessionGoals.filter((g) => g.completed).length} / {store.sessionGoals.length} completados
                  </p>
                </div>
              )}
            </MetricCard>
          </div>

          {/* Active technique panel */}
          <SessionTechniquePanel />

          {/* Distortions */}
          {store.detectedDistortions.length > 0 && (
            <section>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">
                Distorsiones cognitivas detectadas — {store.detectedDistortions.length}
              </p>
              <div className="space-y-2">
                {store.detectedDistortions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-rose-900/30 bg-rose-950/10 px-3 py-2.5">
                    <span className="text-[10px] text-rose-400 border border-rose-900/40 rounded px-2 py-0.5 shrink-0 whitespace-nowrap mt-0.5">
                      {DISTORTION_LABELS[d.distortion] ?? d.distortion}
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{d.thought}</p>
                    <span className="text-[9px] text-slate-700 shrink-0 whitespace-nowrap">turno {d.turnNumber}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Homework */}
          {store.currentHomework && (
            <section>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">
                Tarea intersesión
              </p>
              <div className="rounded-lg border border-teal-900/30 bg-teal-950/10 px-4 py-3 flex items-start gap-3">
                <span className={`text-sm shrink-0 mt-0.5 ${store.homeworkReviewed ? 'text-emerald-500' : 'text-teal-500'}`}>
                  {store.homeworkReviewed ? '✓' : '⊙'}
                </span>
                <div>
                  <p className="text-xs text-slate-300 leading-relaxed">{store.currentHomework}</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {store.homeworkReviewed ? 'Revisada en esta sesión' : 'Pendiente de revisión'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Phase flow */}
          <section>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">
              Flujo de sesión
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {Object.entries(PHASE_LABELS)
                .filter(([k]) => k !== 'crisis')
                .map(([key, label], i, arr) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] border transition-colors ${
                      store.phase === key
                        ? 'bg-amber-950/50 border-amber-800/50 text-amber-300'
                        : 'border-slate-800 text-slate-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${store.phase === key ? 'bg-amber-500' : 'bg-slate-800'}`} />
                      {label}
                    </div>
                    {i < arr.length - 1 && (
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-slate-800 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                ))}
            </div>
          </section>
        </div>
      ) : pastSession ? (
        /* ── PAST SESSION ───────────────────────────────────────────────────── */
        <div className="space-y-6">

          {/* Summary header */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-5">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">Sesión</p>
                <p className="text-3xl font-bold text-slate-200 tabular-nums">#{pastSession.sessionNumber}</p>
                <p className="text-xs text-slate-500 mt-0.5">{pastSession.date}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">Rapport final</p>
                <p className="text-3xl font-bold tabular-nums"
                  style={{ color: pastSession.rapport >= 3.5 ? '#10b981' : pastSession.rapport >= 2 ? '#d97706' : '#ef4444' }}>
                  {pastSession.rapport.toFixed(1)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">de 5.0</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">Mensajes</p>
                <p className="text-3xl font-bold text-slate-200 tabular-nums">{pastSession.totalMessages}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">Objetivos logrados</p>
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">{pastSession.goalsAchieved}</p>
              </div>
              {pastSession.crisisDetected && (
                <div className="flex items-center">
                  <span className="text-xs text-rose-400 border border-rose-900/50 bg-rose-950/20 rounded-full px-3 py-1.5">
                    ⚠ Crisis detectada
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rapport bar */}
          <MetricCard title="Vínculo terapéutico al cierre">
            <RapportBar value={pastSession.rapport} />
          </MetricCard>

          {/* Techniques used */}
          {pastSession.techniquesUsed.length > 0 && (
            <section>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">
                Técnicas utilizadas
              </p>
              <div className="flex flex-wrap gap-2">
                {pastSession.techniquesUsed.map((t) => {
                  const match = TECHNIQUES.find((tk) => tk.key === t);
                  return (
                    <span
                      key={t}
                      className="text-xs border border-slate-700 text-slate-300 bg-slate-800/40 rounded-full px-3 py-1.5 flex items-center gap-2"
                    >
                      {match && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: match.color }}
                        />
                      )}
                      {match?.label ?? t.replace(/_/g, ' ')}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {pastSession.techniquesUsed.length === 0 && (
            <p className="text-xs text-slate-700">No se registraron técnicas en esta sesión.</p>
          )}
        </div>
      ) : null}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  Tab 3: CONFIGURAR
  // ════════════════════════════════════════════════════════════════════════════
  const configurarContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* ── Add form ── */}
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-4">
          Agregar al perfil clínico
        </p>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-5">

          {/* Category selector */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_META) as CustomCapabilityCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAddForm((f) => ({ ...f, category: cat }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    addForm.category === cat
                      ? CATEGORY_META[cat].badge
                      : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Nombre</label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Ej: Regulación emocional adaptativa"
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">
              Descripción
              <span className="text-slate-700 ml-1">(opcional)</span>
            </label>
            <textarea
              value={addForm.description}
              onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Cuándo aplicar, cómo funciona, referencia teórica..."
              rows={3}
              className="w-full resize-none bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-900/50 transition-colors"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!addForm.name.trim()}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-amber-800/40 border border-amber-700/40 text-amber-200 hover:bg-amber-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Agregar capacidad
          </button>
        </div>

        {/* Quick nav to chat */}
        <div className="mt-4 p-4 rounded-xl border border-slate-800/60 border-dashed bg-slate-900/20">
          <p className="text-xs text-slate-600 mb-2">¿Querés iniciar una sesión de terapia?</p>
          <button
            onClick={() => navigate('/therapist')}
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-2"
          >
            Ir al perfil del terapeuta →
          </button>
        </div>
      </div>

      {/* ── Custom list ── */}
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-4">
          Capacidades agregadas
          {store.customCapabilities.length > 0 && (
            <span className="ml-2 text-amber-500 font-medium">{store.customCapabilities.length}</span>
          )}
        </p>

        {store.customCapabilities.length === 0 ? (
          <div className="rounded-xl border border-slate-800/60 border-dashed px-6 py-10 text-center space-y-2">
            <p className="text-xs text-slate-700">Todavía no hay capacidades personalizadas.</p>
            <p className="text-[11px] text-slate-800">
              Usá el formulario para agregar técnicas, herramientas o conocimientos.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...store.customCapabilities].reverse().map((cap) => (
              <div
                key={cap.id}
                className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 flex items-start gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${CATEGORY_META[cap.category].badge}`}>
                      {CATEGORY_META[cap.category].label}
                    </span>
                    <span className="text-[9px] text-slate-700">
                      {new Date(cap.addedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200">{cap.name}</p>
                  {cap.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{cap.description}</p>
                  )}
                </div>
                <button
                  onClick={() => store.removeCustomCapability(cap.id)}
                  className="text-slate-800 hover:text-rose-500 transition-colors shrink-0 mt-1 opacity-0 group-hover:opacity-100"
                  aria-label={`Eliminar ${cap.name}`}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/60 shrink-0">
        <button
          onClick={() => navigate('/therapist')}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Volver al perfil"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="w-7 h-7 rounded-full bg-amber-900/40 border border-amber-800/40 flex items-center justify-center text-sm shrink-0 select-none">
          ψ
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-slate-200 leading-none">Terapeuta TCC</h1>
          <p className="text-[10px] text-slate-600 mt-0.5">Panel clínico · Sesión #{store.sessionNumber}</p>
        </div>

        {/* Tab switcher — scrollable on small screens */}
        <nav className="flex items-center gap-0.5 bg-slate-900/60 border border-slate-800 rounded-xl p-1 shrink-0 overflow-x-auto">
          {([
            { id: 'capacidades',  label: 'Capacidades'  },
            { id: 'sesion',       label: 'Sesión'        },
            { id: 'conocimiento', label: 'Conocimiento'  },
            { id: 'tecnicas',     label: 'Técnicas'      },
            { id: 'configurar',   label: 'Configurar'    },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-4 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-700/80 text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-7">
          {activeTab === 'capacidades'  && capacidadesContent}
          {activeTab === 'sesion'       && sesionContent}
          {activeTab === 'conocimiento' && <KnowledgeBaseTab />}
          {activeTab === 'tecnicas'     && <TechniqueExplorer />}
          {activeTab === 'configurar'   && configurarContent}
        </div>
      </main>
    </div>
  );
}
