/**
 * LandingScreen — Pantalla de entrada pública de TCC Lab
 *
 * Primera impresión del sistema. Diseñada para transmitir:
 *  - Rigor científico (estructura, evidencia, metodología)
 *  - Confianza y calidez (tono empático, colores cálidos sobre base oscura)
 *  - Capacidad real (feature cards con protocolo TCC)
 *
 * Estética: "Scientific Editorial" — Fraunces serif + Commissioner sans
 * Paleta: Slate-950 base + teal clinical + amber warmth
 */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { usePatientStore } from '../patient/patientStore';

// ─── Palette tokens ──────────────────────────────────────────────
const C = {
  bg:          '#070b14',
  surface:     'rgba(15, 23, 42, 0.7)',
  surfaceLit:  'rgba(20, 30, 52, 0.85)',
  border:      'rgba(100, 160, 180, 0.12)',
  borderAmber: 'rgba(212, 160, 84, 0.2)',
  teal:        '#5eaab5',
  tealMuted:   '#3d7a85',
  tealDim:     'rgba(94, 170, 181, 0.08)',
  amber:       '#d4a054',
  amberHover:  '#e8b86a',
  amberDim:    'rgba(212, 160, 84, 0.06)',
  textPrimary: '#e2e8f0',
  textSecond:  '#94a3b8',
  textMuted:   '#64748b',
  textDim:     '#475569',
};

// ─── Feature data ────────────────────────────────────────────────
const PROTOCOL_STEPS = [
  {
    num: '01',
    title: 'Evaluación estructurada',
    desc: 'Inventarios validados (BDI-II, PHQ-9, DAS) aplicados en el momento justo del protocolo.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Formulación de caso',
    desc: 'Modelo cognitivo-conductual aplicado: situación → pensamiento → emoción → conducta.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Intervención guiada',
    desc: 'Técnicas TCC seleccionadas por perfil: activación conductual, reestructuración, exposición.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Seguimiento con datos',
    desc: 'Evolución sesión a sesión con métricas reales. Sin adivinanzas — con evidencia.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const EVIDENCE_BADGES = [
  { label: 'Protocolo Beck', detail: 'Terapia Cognitiva' },
  { label: 'Martell et al.', detail: 'Activación Conductual' },
  { label: 'BDI-II / PHQ-9', detail: 'Inventarios validados' },
  { label: 'DSM-5', detail: 'Criterios diagnósticos' },
];

// ─── Animated counter hook ───────────────────────────────────────
function useCountUp(target: number, duration = 1800, delay = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return count;
}

// ─── Component ───────────────────────────────────────────────────
export function LandingScreen() {
  const navigate = useNavigate();
  const { activePatient } = usePatientStore();
  const hasPatient = !!activePatient;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const statInventories = useCountUp(5, 1600, 600);
  const statPhases = useCountUp(7, 1400, 800);
  const statItems = useCountUp(134, 2000, 1000);

  return (
    <div
      style={{ background: C.bg, fontFamily: "'Commissioner', sans-serif" }}
      className="min-h-screen overflow-x-hidden"
    >
      {/* ── Ambient background ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* Teal gradient orb — top right */}
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: `radial-gradient(circle, ${C.teal} 0%, transparent 70%)` }}
        />
        {/* Amber gradient orb — bottom left */}
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: `radial-gradient(circle, ${C.amber} 0%, transparent 70%)` }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(${C.teal} 1px, transparent 1px),
              linear-gradient(90deg, ${C.teal} 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Navigation bar ─────────────────────────────────────── */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${C.tealDim}, ${C.amberDim})`,
              border: `1px solid ${C.border}`,
            }}
          >
            <span
              style={{ fontFamily: "'Fraunces', serif", color: C.teal }}
              className="text-base font-semibold"
            >
              T
            </span>
          </div>
          <span
            style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
            className="text-lg tracking-tight"
          >
            tcc<span style={{ color: C.teal }}>·</span>lab
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/therapist-screen')}
            className="text-sm px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5"
            style={{ color: C.tealMuted, border: `1px solid ${C.border}` }}
            onMouseEnter={e => {
              e.currentTarget.style.color = C.teal;
              e.currentTarget.style.borderColor = C.tealMuted;
              e.currentTarget.style.background = C.tealDim;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = C.tealMuted;
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
            </svg>
            Soy terapeuta
          </button>
          <button
            onClick={() => navigate(hasPatient ? '/patient/patient-dashboard' : '/patient/login')}
            className="text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5"
            style={{
              background: C.amber,
              color: '#1a1408',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.amberHover)}
            onMouseLeave={e => (e.currentTarget.style.background = C.amber)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {hasPatient ? activePatient.alias : 'Soy paciente'}
          </button>
        </div>
      </nav>

      {/* ── Hero section ───────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
          }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px" style={{ background: C.teal }} />
            <span
              className="text-xs uppercase tracking-[0.2em] font-medium"
              style={{ color: C.tealMuted }}
            >
              Protocolo experimental basado en evidencia
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
            className="text-4xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight max-w-4xl"
          >
            Terapia cognitivo-conductual{' '}
            <span
              className="italic font-light"
              style={{ color: C.teal }}
            >
              con la estructura
            </span>{' '}
            que la ciencia{' '}
            <span
              className="relative inline-block"
            >
              demanda
              <span
                className="absolute bottom-1 left-0 w-full h-[2px] opacity-40"
                style={{ background: `linear-gradient(90deg, ${C.amber}, transparent)` }}
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl"
            style={{ color: C.textSecond }}
          >
            TCC Lab digitaliza el protocolo terapéutico real — evaluación, formulación,
            intervención y seguimiento — con inventarios validados y lógica clínica integrada.
            <span style={{ color: C.textMuted }}>{' '}No es una app de bienestar. Es una herramienta clínica.</span>
          </p>

          {/* CTA — dual role access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 max-w-2xl">
            {/* Patient access */}
            <div
              className="relative rounded-2xl p-6 text-left transition-all duration-300"
              style={{
                background: C.amberDim,
                border: `1px solid ${C.borderAmber}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `rgba(212, 160, 84, 0.12)` }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.5" className="w-5 h-5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </div>
              <h3
                className="text-lg font-medium mb-1"
                style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
              >
                Soy paciente
              </h3>

              {hasPatient ? (
                <>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: C.textSecond }}>
                    Hola de nuevo, <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activePatient.alias}</span>.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate('/patient/patient-dashboard')}
                      className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{ background: C.amber, color: '#1a1408' }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.amberHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = C.amber)}
                    >
                      Ir a mi panel
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate('/patient/register')}
                      className="text-xs py-1.5 transition-colors"
                      style={{ color: C.textMuted }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.textSecond)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                    >
                      No soy {activePatient.alias} — registrarme
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: C.textSecond }}>
                    ¿Ya tenés un proceso iniciado o es tu primera vez?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate('/patient/login')}
                      className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{ background: C.amber, color: '#1a1408' }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.amberHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = C.amber)}
                    >
                      Soy paciente
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate('/patient/register')}
                      className="group flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm transition-all duration-200"
                      style={{ color: C.amber, border: `1px solid ${C.borderAmber}` }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = C.amber;
                        e.currentTarget.style.background = C.amberDim;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.borderAmber;
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Quiero comenzar
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Therapist access */}
            <button
              onClick={() => navigate('/therapist-screen')}
              className="group relative rounded-2xl p-6 text-left transition-all duration-300"
              style={{
                background: C.tealDim,
                border: `1px solid ${C.border}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.tealMuted;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 30px rgba(94, 170, 181, 0.08)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `rgba(94, 170, 181, 0.1)` }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="1.5" className="w-5 h-5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3
                className="text-lg font-medium mb-1"
                style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
              >
                Soy terapeuta
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: C.textSecond }}>
                Accedé al panel clínico, base de conocimiento e inventarios.
              </p>
              <span
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2"
                style={{ color: C.teal }}
              >
                Ingresar
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                </svg>
              </span>
            </button>
          </div>

          {/* Secondary link */}
          <div className="mt-6">
            <button
              onClick={() => {
                document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm transition-all duration-200"
              style={{ color: C.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.color = C.textSecond)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
            >
              Ver metodología ↓
            </button>
          </div>
        </div>

        {/* ── Stats strip ────────────────────────────────────────── */}
        <div
          className="grid grid-cols-3 gap-6 mt-20 pt-10"
          style={{
            borderTop: `1px solid ${C.border}`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
          }}
        >
          {[
            { value: statInventories, label: 'Inventarios clínicos', suffix: '' },
            { value: statPhases, label: 'Fases del protocolo', suffix: '' },
            { value: statItems, label: 'Ítems de evaluación', suffix: '+' },
          ].map(({ value, label, suffix }) => (
            <div key={label}>
              <span
                className="text-3xl md:text-4xl font-light tabular-nums"
                style={{ fontFamily: "'Fraunces', serif", color: C.teal }}
              >
                {value}{suffix}
              </span>
              <p className="mt-1 text-xs uppercase tracking-wider" style={{ color: C.textMuted }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Protocol features ──────────────────────────────────── */}
      <section
        id="methodology"
        className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20"
      >
        <div
          className="flex items-center gap-3 mb-4"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.8s ease 0.6s',
          }}
        >
          <div className="w-8 h-px" style={{ background: C.amber }} />
          <span
            className="text-xs uppercase tracking-[0.2em] font-medium"
            style={{ color: C.amber }}
          >
            El protocolo
          </span>
        </div>
        <h2
          style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
          className="text-2xl md:text-4xl font-light tracking-tight mb-12"
        >
          Cada paso tiene un propósito clínico
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          {PROTOCOL_STEPS.map((step, i) => (
            <div
              key={step.num}
              className="group relative rounded-2xl p-6 transition-all duration-300"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.7 + i * 0.1}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.borderAmber;
                e.currentTarget.style.background = C.surfaceLit;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.surface;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="text-xs font-mono tracking-wider"
                  style={{ color: C.tealMuted }}
                >
                  {step.num}
                </span>
                <div style={{ color: C.tealMuted }} className="transition-colors group-hover:text-[#5eaab5]">
                  {step.icon}
                </div>
              </div>
              <h3
                className="text-lg font-medium mb-2"
                style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textSecond }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Evidence badges ────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.5" className="w-5 h-5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3
              className="text-sm uppercase tracking-[0.15em] font-medium"
              style={{ color: C.amber }}
            >
              Fundamentos científicos
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EVIDENCE_BADGES.map((badge) => (
              <div
                key={badge.label}
                className="rounded-xl px-4 py-3 text-center"
                style={{
                  background: C.amberDim,
                  border: `1px solid ${C.borderAmber}`,
                }}
              >
                <p className="text-sm font-medium" style={{ color: C.textPrimary }}>
                  {badge.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                  {badge.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: C.textSecond }}>
            TCC Lab implementa los protocolos de Aaron Beck, Martell, Jacobson y Dimidjian
            con fidelidad al manual. Cada evaluación usa instrumentos con validación psicométrica
            publicada. Los datos quedan en tu dispositivo — nunca se envían a servidores externos.
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20 text-center">
        <h2
          style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
          className="text-3xl md:text-5xl font-light tracking-tight"
        >
          Tu proceso, con{' '}
          <span className="italic" style={{ color: C.teal }}>
            estructura
          </span>
        </h2>
        <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: C.textSecond }}>
          No necesitás saber nada de TCC para empezar. El protocolo te guía
          paso a paso, como lo haría un terapeuta en sesión.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          {hasPatient ? (
            <button
              onClick={() => navigate('/patient/patient-dashboard')}
              className="group inline-flex items-center gap-2 text-base px-7 py-3.5 rounded-xl font-medium transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${C.amber}, #c4903e)`,
                color: '#1a1408',
                boxShadow: `0 0 40px ${C.amberDim}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 0 50px rgba(212, 160, 84, 0.18)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = `0 0 40px ${C.amberDim}`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Ir al panel de {activePatient.alias}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/patient/login')}
                className="group inline-flex items-center gap-2 text-base px-7 py-3.5 rounded-xl font-medium transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${C.amber}, #c4903e)`,
                  color: '#1a1408',
                  boxShadow: `0 0 40px ${C.amberDim}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 0 50px rgba(212, 160, 84, 0.18)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = `0 0 40px ${C.amberDim}`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Soy paciente
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/patient/register')}
                className="group inline-flex items-center gap-2 text-base px-7 py-3.5 rounded-xl font-medium transition-all duration-300"
                style={{
                  color: C.amber,
                  border: `1px solid ${C.borderAmber}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.amber;
                  e.currentTarget.style.background = C.amberDim;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.borderAmber;
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Quiero comenzar
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/therapist-screen')}
            className="group inline-flex items-center gap-2 text-base px-7 py-3.5 rounded-xl font-medium transition-all duration-300"
            style={{
              color: C.teal,
              border: `1px solid ${C.border}`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.tealMuted;
              e.currentTarget.style.background = C.tealDim;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Soy terapeuta
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Experimental modules ──────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
        <details className="group">
          <summary
            className="flex items-center gap-3 cursor-pointer select-none list-none"
            style={{ color: C.textDim }}
          >
            <div className="w-6 h-px" style={{ background: C.border }} />
            <span className="text-xs uppercase tracking-[0.15em] font-medium">
              Módulos experimentales
            </span>
            <svg
              className="w-3.5 h-3.5 transition-transform group-open:rotate-180"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" />
            </svg>
          </summary>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-6"
          >
            {[
              { label: 'Chat Emocional', path: '/emotional-chat' },
              { label: 'Dashboard Emocional', path: '/emotional-dashboard' },
              { label: 'Evaluación Multimodal', path: '/multimodal-evaluation' },
              { label: 'Entrevista Clínica', path: '/interview' },
              { label: 'Perfil Terapeuta', path: '/therapist' },
              { label: 'Pantalla Terapeuta', path: '/therapist-screen' },
              { label: 'Base de Conocimiento', path: '/therapist/knowledge' },
              { label: 'Registro de Paciente', path: '/patient/register' },
              { label: 'Dashboard Paciente', path: '/patient/patient-dashboard' },
              { label: 'Dashboard Terapeuta', path: '/therapist/patient-dashboard' },
              { label: 'Protocolo de Sesión', path: '/session' },
              { label: 'Hub de Sesión', path: '/home' },
              { label: 'DevTools', path: '/dev' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="text-left text-xs px-3 py-2.5 rounded-lg transition-all duration-200"
                style={{
                  color: C.textMuted,
                  border: `1px solid transparent`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = C.textSecond;
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.surface;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = C.textMuted;
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        className="relative z-10 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{ fontFamily: "'Fraunces', serif", color: C.textMuted }}
            className="text-sm"
          >
            tcc<span style={{ color: C.tealMuted }}>·</span>lab
          </span>
          <span className="text-xs" style={{ color: C.textDim }}>
            — Protocolo experimental
          </span>
        </div>
        <p className="text-xs" style={{ color: C.textDim }}>
          Herramienta clínica experimental. No sustituye la atención profesional.
          Todos los datos se almacenan localmente.
        </p>
      </footer>
    </div>
  );
}
