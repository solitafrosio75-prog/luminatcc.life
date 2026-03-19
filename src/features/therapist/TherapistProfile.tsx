/**
 * TherapistProfile — Pantalla de presentación del Terapeuta Perfecto TCC.
 *
 * Muestra:
 * - Tarjeta de identidad clínica (quién es el terapeuta)
 * - Las 4 facultades principales organizadas en cards
 * - Grid de técnicas disponibles con indicador de técnica activa
 * - Historial de sesiones pasadas (desde pastSessions)
 * - CTA para iniciar o continuar sesión
 */

import { useNavigate } from 'react-router-dom';
import { useTherapistStore } from './therapistStore';
import { AFFECT_LABELS } from '../interview/interviewStore';
import type { PastSession } from './therapistStore';

// ── Datos de las 4 facultades ──────────────────────────────────────────────────

const FACULTIES = [
  {
    icon: '♥',
    title: 'Facultades de Relación',
    borderBg: 'border-rose-900/40 bg-rose-950/20',
    accent:   'text-rose-400',
    items: [
      'Empatía estratégica — valida sin reforzar la distorsión',
      'Calidez y aceptación incondicional',
      'Autenticidad — curiosidad genuina por el paciente',
      'Directividad flexible con agenda terapéutica',
    ],
  },
  {
    icon: '⚗',
    title: 'Maestría Técnica',
    borderBg: 'border-amber-900/40 bg-amber-950/20',
    accent:   'text-amber-400',
    items: [
      'Modelos conductistas: Pavlov · Skinner · Bandura',
      'Modelos cognitivos: Beck · Ellis · Young',
      'Protocolos específicos: EPR · AC · TPC · Barlow',
      'Tercera generación: ACT · DBT · Mindfulness',
    ],
  },
  {
    icon: '🔬',
    title: 'Facultades Analíticas',
    borderBg: 'border-teal-900/40 bg-teal-950/20',
    accent:   'text-teal-400',
    items: [
      'Análisis funcional ABC permanente en tiempo real',
      'Conceptualización: predisponentes / precipitantes / perpetuadores',
      'Habilidad socrática: descubrimiento guiado, nunca dirección',
      'Hipótesis → experimento → verificación',
    ],
  },
  {
    icon: '⚖',
    title: 'Facultades Éticas',
    borderBg: 'border-slate-700/40 bg-slate-800/20',
    accent:   'text-slate-400',
    items: [
      'Meta última: que el paciente deje de necesitar al terapeuta',
      'Monitorización de sesgos y contratransferencia',
      'Flexibilidad técnica — ninguna técnica es sagrada',
      'Resiliencia emocional ante cualquier relato',
    ],
  },
] as const;

// ── Técnica config ─────────────────────────────────────────────────────────────

const TECHNIQUE_CONFIG: Record<string, { label: string; activeBadge: string }> = {
  exploracion:            { label: 'Exploración empática',   activeBadge: 'bg-slate-800 text-slate-300 border-slate-600' },
  socratica:              { label: 'Diálogo socrático',      activeBadge: 'bg-amber-950/60 text-amber-400 border-amber-700/60' },
  reestructuracion:       { label: 'Reestructuración cog.',  activeBadge: 'bg-blue-950/60 text-blue-400 border-blue-700/60' },
  activacion_conductual:  { label: 'Activación conductual',  activeBadge: 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60' },
  exposicion:             { label: 'Exposición gradual',     activeBadge: 'bg-orange-950/60 text-orange-400 border-orange-700/60' },
  defusion_act:           { label: 'Defusión ACT',           activeBadge: 'bg-purple-950/60 text-purple-400 border-purple-700/60' },
  validacion_dbt:         { label: 'Validación DBT',         activeBadge: 'bg-teal-950/60 text-teal-400 border-teal-700/60' },
  experimento_conductual: { label: 'Experimento conductual', activeBadge: 'bg-indigo-950/60 text-indigo-400 border-indigo-700/60' },
  psicoeducacion:         { label: 'Psicoeducación',         activeBadge: 'bg-sky-950/60 text-sky-400 border-sky-700/60' },
  analisis_funcional:     { label: 'Análisis funcional ABC', activeBadge: 'bg-rose-950/60 text-rose-400 border-rose-700/60' },
};

// ── Phase labels ───────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  check_in:            'Check-in inicial',
  agenda:              'Agenda de sesión',
  homework_review:     'Revisión de tarea',
  main_work:           'Trabajo terapéutico',
  summary:             'Síntesis e integración',
  homework_assignment: 'Asignación de tarea',
  closure:             'Cierre de sesión',
  crisis:              '⚠ Crisis',
};

// ── SessionCard ────────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: PastSession }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
          Sesión #{session.sessionNumber}
        </span>
        <span className="text-[10px] text-slate-600">{session.date}</span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span>
          Rapport: <strong className="text-slate-300">{session.rapport.toFixed(1)}/5</strong>
        </span>
        <span>
          Mensajes: <strong className="text-slate-300">{session.totalMessages}</strong>
        </span>
        <span>
          Objetivos: <strong className="text-slate-300">{session.goalsAchieved}</strong>
        </span>
        {session.crisisDetected && (
          <span className="text-rose-400 font-medium">crisis activa</span>
        )}
      </div>

      {session.techniquesUsed.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {session.techniquesUsed.map((t) => {
            const conf = TECHNIQUE_CONFIG[t];
            return conf ? (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400"
              >
                {conf.label}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TherapistProfile() {
  const navigate = useNavigate();

  const {
    sessionNumber,
    pastSessions,
    phase,
    activeTechnique,
    rapportScore,
    messages,
    sessionGoals,
    crisisDetected,
    lastAffectValence,
  } = useTherapistStore();

  const hasActiveSession  = messages.length > 0;
  const currentAffectLabel = lastAffectValence ? AFFECT_LABELS[lastAffectValence] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Header ── */}
      <header className="border-b border-slate-800/60 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">TCC Lab</p>
            <h1 className="text-xl font-semibold text-slate-100">Terapeuta Cognitivo-Conductual</h1>
            <p className="text-xs text-slate-500 mt-0.5">Modelo del Científico-Practicante</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/therapist/knowledge')}
              className="text-xs bg-cyan-900/30 border border-cyan-700/40 text-cyan-200 px-4 py-2 rounded-lg hover:bg-cyan-900/50 transition-colors font-medium"
            >
              Panel Knowledge
            </button>
            <button
              onClick={() => navigate('/therapist-screen')}
              className="text-xs bg-amber-800/40 border border-amber-700/40 text-amber-200 px-4 py-2 rounded-lg hover:bg-amber-800/60 transition-colors font-medium"
            >
              {hasActiveSession ? 'Continuar sesión' : 'Iniciar sesión'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* ── Identity card ── */}
        <section className="rounded-xl border border-amber-900/30 bg-amber-950/10 px-6 py-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-amber-900/40 border border-amber-800/40 flex items-center justify-center text-xl shrink-0 select-none">
              ψ
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-amber-200">
                El Terapeuta Perfecto — Científico-Practicante
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Integra la precisión de un neurocientífico, la agudeza analítica de un detective
                y la calidez de un mentor humano. Su objetivo último: que el paciente se convierta
                en su propio terapeuta.
              </p>

              {/* Status strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                <span>
                  Sesión:{' '}
                  <span className="text-amber-500 font-medium">#{sessionNumber}</span>
                </span>
                <span>
                  Fase:{' '}
                  <span className="text-slate-300">{PHASE_LABELS[phase] ?? phase}</span>
                </span>
                {activeTechnique && (
                  <span>
                    Técnica:{' '}
                    <span className="text-slate-300">
                      {TECHNIQUE_CONFIG[activeTechnique]?.label ?? activeTechnique}
                    </span>
                  </span>
                )}
                <span>
                  Rapport:{' '}
                  <span className="text-slate-300">{rapportScore.toFixed(1)}/5</span>
                </span>
                {currentAffectLabel && (
                  <span>
                    Afecto:{' '}
                    <span className="text-slate-300">{currentAffectLabel}</span>
                  </span>
                )}
                {crisisDetected && (
                  <span className="text-rose-400 font-semibold">⚠ CRISIS</span>
                )}
              </div>

              {/* Active session goals */}
              {sessionGoals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sessionGoals.map((g) => (
                    <span
                      key={g.id}
                      className={[
                        'text-[11px] px-2.5 py-1 rounded-full border',
                        g.completed
                          ? 'border-emerald-800/40 text-emerald-500 bg-emerald-950/30 line-through'
                          : 'border-slate-700 text-slate-400 bg-slate-800/40',
                      ].join(' ')}
                    >
                      {g.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 4 Faculty cards ── */}
        <section>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-4">
            Facultades clínicas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FACULTIES.map((f) => (
              <div key={f.title} className={`rounded-lg border p-5 space-y-3 ${f.borderBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${f.accent}`}>{f.icon}</span>
                  <h4 className="text-sm font-semibold text-slate-200">{f.title}</h4>
                </div>
                <ul className="space-y-1.5">
                  {f.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed"
                    >
                      <span className={`mt-0.5 shrink-0 ${f.accent}`}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Technique grid ── */}
        <section>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-4">
            Repertorio técnico
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TECHNIQUE_CONFIG).map(([key, { label, activeBadge }]) => {
              const isActive = activeTechnique === key;
              return (
                <span
                  key={key}
                  className={[
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    isActive
                      ? `${activeBadge} scale-105 shadow-sm`
                      : 'border-slate-800 text-slate-600 bg-slate-900/40',
                  ].join(' ')}
                >
                  {label}
                  {isActive && (
                    <span className="ml-1.5 text-[9px] opacity-70">activa</span>
                  )}
                </span>
              );
            })}
          </div>
        </section>

        {/* ── Session history ── */}
        {pastSessions.length > 0 && (
          <section>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-4">
              Historial de sesiones
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...pastSessions].reverse().map((s) => (
                <SessionCard key={s.sessionNumber} session={s} />
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
          <button
            onClick={() => navigate('/therapist-screen')}
            className="flex-1 py-3.5 text-sm font-medium rounded-xl bg-amber-800/40 border border-amber-700/40 text-amber-200 hover:bg-amber-800/60 transition-colors"
          >
            {hasActiveSession
              ? `Continuar sesión #${sessionNumber}`
              : `Iniciar sesión #${sessionNumber}`}
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3.5 text-sm text-slate-500 border border-slate-800 rounded-xl hover:text-slate-300 hover:border-slate-700 transition-colors"
          >
            Volver al inicio
          </button>
        </section>
      </main>
    </div>
  );
}
