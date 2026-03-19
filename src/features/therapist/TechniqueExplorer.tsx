/**
 * TechniqueExplorer — Panel de referencia clínica para técnicas TCC /
 * Ingeniería Conductual.
 *
 * Diseño master-detail:
 *   • Columna izquierda — listado filtrable de TechniqueCards
 *   • Columna derecha   — panel de detalle con 6 sub-pestañas:
 *       Descripción · Paso a Paso · Evaluación · Recursos · Variables · Gráfico
 *
 * Todos los sub-componentes SVG están definidos FUERA del componente principal
 * para evitar re-montajes en cada render.
 */

import { useState, useMemo } from 'react';
import {
  TECHNIQUE_PROFILES,
  TECH_CAT_META,
  type TechniqueProfile,
  type TechniqueCategory,
  type TechniqueVisual,
} from './techniqueData';
import { useTherapistStore } from './therapistStore';

// ── Sub-tab type ─────────────────────────────────────────────────────────────

type DetailTab = 'descripcion' | 'pasos' | 'evaluacion' | 'recursos' | 'variables' | 'grafico';

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'descripcion', label: 'Descripción' },
  { id: 'pasos',       label: 'Paso a Paso' },
  { id: 'evaluacion',  label: 'Evaluación' },
  { id: 'recursos',    label: 'Recursos' },
  { id: 'variables',   label: 'Variables' },
  { id: 'grafico',     label: 'Gráfico' },
];

// ── Resource type labels & colors ────────────────────────────────────────────

const RES_META: Record<string, { label: string; cls: string }> = {
  hoja_registro: { label: 'Hoja de registro', cls: 'text-green-400  border-green-800  bg-green-950/30'  },
  escala:        { label: 'Escala',            cls: 'text-blue-400   border-blue-800   bg-blue-950/30'   },
  checklist:     { label: 'Checklist',         cls: 'text-amber-400  border-amber-800  bg-amber-950/30'  },
  protocolo:     { label: 'Protocolo',         cls: 'text-purple-400 border-purple-800 bg-purple-950/30' },
  cuestionario:  { label: 'Cuestionario',      cls: 'text-rose-400   border-rose-800   bg-rose-950/30'   },
};

// ── Difficulty dots ──────────────────────────────────────────────────────────

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-0.5" title={`Dificultad técnica: ${level}/3`}>
      {([1, 2, 3] as const).map((d) => (
        <span
          key={d}
          className={`inline-block w-2 h-2 rounded-full ${d <= level ? 'bg-amber-400' : 'bg-slate-700'}`}
        />
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SVG Visual Aids
// ═══════════════════════════════════════════════════════════════════════════════

function AbcFlowDiagram() {
  return (
    <svg viewBox="0 0 560 330" width="100%" role="img" aria-label="Diagrama de flujo ABC — Análisis Funcional">
      <rect width="560" height="330" fill="#0f172a" rx="12" />
      <text x="280" y="26" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Modelo ABC — Análisis Funcional de la Conducta
      </text>

      {/* A */}
      <rect x="18"  y="60" width="145" height="82" rx="10" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="90"  y="88"  textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="700">A — Antecedente</text>
      <text x="90"  y="106" textAnchor="middle" fill="#93c5fd" fontSize="10">Situación / Estímulo</text>
      <text x="90"  y="122" textAnchor="middle" fill="#93c5fd" fontSize="10">disparador del contexto</text>

      {/* Arrow A→B */}
      <defs>
        <marker id="arr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#475569" />
        </marker>
      </defs>
      <line x1="163" y1="101" x2="208" y2="101" stroke="#475569" strokeWidth="2" markerEnd="url(#arr)" />

      {/* B */}
      <rect x="213" y="60" width="134" height="82" rx="10" fill="#1a3a2a" stroke="#10b981" strokeWidth="1.5" />
      <text x="280" y="88"  textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">B — Cognición</text>
      <text x="280" y="106" textAnchor="middle" fill="#6ee7b7" fontSize="10">Pensamiento automático</text>
      <text x="280" y="122" textAnchor="middle" fill="#6ee7b7" fontSize="10">Emoción / Evaluación</text>

      {/* Arrow B→C */}
      <line x1="347" y1="101" x2="392" y2="101" stroke="#475569" strokeWidth="2" markerEnd="url(#arr)" />

      {/* C */}
      <rect x="397" y="60" width="145" height="82" rx="10" fill="#3a1a2a" stroke="#f43f5e" strokeWidth="1.5" />
      <text x="469" y="88"  textAnchor="middle" fill="#fb7185" fontSize="12" fontWeight="700">C — Consecuencia</text>
      <text x="469" y="106" textAnchor="middle" fill="#fda4af" fontSize="10">Conducta observable</text>
      <text x="469" y="122" textAnchor="middle" fill="#fda4af" fontSize="10">Resultado conductual</text>

      {/* Feedback loop */}
      <path d="M 540 148 Q 560 205 280 225 Q 75 225 20 148"
        fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="6,3" />
      <polygon points="20,148 13,158 27,158" fill="#475569" />
      <text x="280" y="220" textAnchor="middle" fill="#64748b" fontSize="10">
        ← Retroalimentación — modifica respuestas futuras →
      </text>

      {/* Organismic variables */}
      <rect x="198" y="255" width="164" height="54" rx="8"
        fill="#1a1a3a" stroke="#818cf8" strokeWidth="1" strokeDasharray="4,2" />
      <text x="280" y="275" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="600">
        Variables Organísmicas
      </text>
      <text x="280" y="293" textAnchor="middle" fill="#c7d2fe" fontSize="9">
        Historia · biología · repertorio · estados internos
      </text>
      <line x1="280" y1="255" x2="280" y2="142" stroke="#818cf8" strokeWidth="1" strokeDasharray="4,2" />
    </svg>
  );
}

function ExposureHierarchy() {
  const steps = [
    { label: 'SUD 10 — Ver foto del estímulo temido',       sud: 10,  color: '#22c55e' },
    { label: 'SUD 30 — Estímulo en video',                  sud: 30,  color: '#84cc16' },
    { label: 'SUD 50 — Estímulo en habitación contigua',    sud: 50,  color: '#eab308' },
    { label: 'SUD 65 — Estímulo en misma habitación',       sud: 65,  color: '#f97316' },
    { label: 'SUD 80 — Estímulo a 1 m de distancia',        sud: 80,  color: '#ef4444' },
    { label: 'SUD 90 — Contacto con protección',            sud: 90,  color: '#dc2626' },
    { label: 'SUD 100 — Contacto directo · sin escapatoria', sud: 100, color: '#991b1b' },
  ];
  return (
    <svg viewBox="0 0 560 295" width="100%" role="img" aria-label="Jerarquía de exposición — Escala SUD">
      <rect width="560" height="295" fill="#0f172a" rx="12" />
      <text x="280" y="24" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Jerarquía de Exposición — Escala SUD (0-100)
      </text>
      {steps.map((s, i) => {
        const y = 38 + i * 33;
        const barW = (s.sud / 100) * 390;
        return (
          <g key={i}>
            <rect x="20" y={y} width={barW} height="24" rx="4" fill={s.color} opacity="0.18" />
            <rect x="20" y={y} width="4"    height="24" rx="2" fill={s.color} />
            <text x="32"  y={y + 16} fill="#e2e8f0"   fontSize="10">{s.label}</text>
            <text x="420" y={y + 16} fill={s.color}   fontSize="11" fontWeight="700">{s.sud}</text>
          </g>
        );
      })}
      <text x="20" y="285" fill="#64748b" fontSize="9">
        SUD = Subjective Units of Distress · 0 = sin malestar · 100 = máximo malestar imaginable
      </text>
    </svg>
  );
}

function ThoughtRecord5Col() {
  const cols = [
    { h: 'Situación',              ex: '¿Qué pasó?\n¿Cuándo?'                  },
    { h: 'Emoción\n(0-100%)',      ex: 'Triste 80 %\nAnsioso 60 %'             },
    { h: 'Pensamiento\nAutomático', ex: '«Soy un\nfracasado»'                  },
    { h: 'Evidencias\na favor / en contra', ex: 'A favor: sí fallé\nEn contra: logré antes' },
    { h: 'Pensamiento\nAlternativo', ex: 'Cometí un\nerror; no soy\nun fracasado' },
  ];
  return (
    <svg viewBox="0 0 560 260" width="100%" role="img" aria-label="Registro de pensamientos de 5 columnas">
      <rect width="560" height="260" fill="#0f172a" rx="12" />
      <text x="280" y="24" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Registro de Pensamientos — 5 Columnas (Beck)
      </text>
      {cols.map((col, i) => {
        const x = 16 + i * 106;
        return (
          <g key={i}>
            <rect x={x} y="38" width="100" height="205" rx="6"
              fill={i % 2 === 0 ? '#1e293b' : '#0f172a'} stroke="#334155" strokeWidth="1" />
            <rect x={x} y="38" width="100" height="36" rx="6" fill="#1d4ed8" opacity="0.3" />
            {col.h.split('\n').map((line, li) => (
              <text key={li} x={x + 50} y={54 + li * 14} textAnchor="middle"
                fill="#93c5fd" fontSize="9.5" fontWeight="600">{line}</text>
            ))}
            {col.ex.split('\n').map((line, li) => (
              <text key={li} x={x + 50} y={100 + li * 13} textAnchor="middle"
                fill="#64748b" fontSize="8.5" fontStyle="italic">{line}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function BaWeeklySchedule() {
  const days  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const slots = ['Mañana', 'Tarde', 'Noche'];
  const acts  = [
    ['Caminar 20m', '',          'Llamar amigo'],
    ['',            'Leer libro', ''            ],
    ['Yoga 15m',   '',            'Diario'      ],
    ['',            'Caminar 20m','',            ],
    ['',            '',           'Película'    ],
    ['Parque',     '',            ''             ],
    ['',            'Descanso',   'Planificar'   ],
  ];
  return (
    <svg viewBox="0 0 560 255" width="100%" role="img" aria-label="Agenda de activación conductual semanal">
      <rect width="560" height="255" fill="#0f172a" rx="12" />
      <text x="280" y="22" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Agenda de Activación Conductual — Semana Tipo
      </text>
      {days.map((d, i) => (
        <text key={d} x={82 + i * 69} y="42" textAnchor="middle"
          fill="#60a5fa" fontSize="10" fontWeight="600">{d}</text>
      ))}
      {slots.map((slot, si) => {
        const y = 50 + si * 60;
        return (
          <g key={slot}>
            <text x="6" y={y + 32} fill="#475569" fontSize="8.5"
              transform={`rotate(-45,6,${y + 32})`}>{slot}</text>
            {days.map((_, di) => {
              const act = acts[di][si];
              return (
                <g key={di}>
                  <rect x={46 + di * 69} y={y} width="64" height="52" rx="4"
                    fill={act ? '#1e3a5f' : '#1e293b'} stroke="#334155" strokeWidth="0.5" />
                  {act && (
                    <text x={46 + di * 69 + 32} y={y + 28} textAnchor="middle"
                      fill="#93c5fd" fontSize="8.5">{act}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function ProblemSolvingFlow() {
  const nodes = [
    { label: '1. Orientación\npositiva',      x: 100, y: 45,  color: '#1d4ed8' },
    { label: '2. Definición\ny formulación',  x: 100, y: 130, color: '#0369a1' },
    { label: '3. Generación\nde alternativas',x: 100, y: 215, color: '#0f766e' },
    { label: '4. Toma de\ndecisiones',        x: 370, y: 215, color: '#15803d' },
    { label: '5. Implementar\ny verificar',   x: 370, y: 130, color: '#b45309' },
    { label: '¿Resuelto?',                    x: 370, y: 45,  color: '#7c3aed' },
  ];
  return (
    <svg viewBox="0 0 560 290" width="100%" role="img" aria-label="Flujo D'Zurilla — Resolución de problemas">
      <rect width="560" height="290" fill="#0f172a" rx="12" />
      <text x="280" y="24" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Modelo D'Zurilla — Resolución de Problemas
      </text>
      <defs>
        <marker id="arr2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
      {/* vertical left */}
      <line x1="100" y1="105" x2="100" y2="128" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr2)" />
      <line x1="100" y1="190" x2="100" y2="213" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr2)" />
      {/* horizontal bottom */}
      <line x1="162" y1="240" x2="308" y2="240" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr2)" />
      {/* vertical right */}
      <line x1="370" y1="210" x2="370" y2="168" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr2)" />
      <line x1="370" y1="125" x2="370" y2="83"  stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr2)" />
      {/* yes → exit */}
      <line x1="432" y1="68" x2="510" y2="68" stroke="#22c55e" strokeWidth="1.5" />
      <text x="436" y="62" fill="#22c55e" fontSize="9">Sí ✓</text>
      <text x="512" y="72" fill="#22c55e" fontSize="9">Fin</text>
      {/* no → loop back */}
      <path d="M 308 68 Q 230 12 138 68" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x="215" y="26" fill="#ef4444" fontSize="9">No → reiniciar</text>
      {nodes.map((n) => (
        <g key={n.label}>
          <rect x={n.x - 62} y={n.y} width="124" height="60" rx="8"
            fill={n.color} opacity="0.28" stroke={n.color} strokeWidth="1.5" />
          {n.label.split('\n').map((l, li) => (
            <text key={li} x={n.x} y={n.y + 24 + li * 15} textAnchor="middle"
              fill="#e2e8f0" fontSize="10">{l}</text>
          ))}
        </g>
      ))}
    </svg>
  );
}

function ShapingChain() {
  const levels = [
    { label: 'Línea base\n(conducta inicial)',    color: '#8b5cf6' },
    { label: 'Aprox. básica\n(paso 2)',           color: '#3b82f6' },
    { label: 'Aprox. media\n(paso 3)',            color: '#10b981' },
    { label: 'Aprox. cercana\n(paso 4)',          color: '#f97316' },
    { label: 'Respuesta\nterminal',               color: '#f59e0b' },
  ];
  return (
    <svg viewBox="0 0 560 280" width="100%" role="img" aria-label="Diagrama de moldeamiento — aproximaciones sucesivas">
      <rect width="560" height="280" fill="#0f172a" rx="12" />
      <text x="280" y="22" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Moldeamiento — Aproximaciones Sucesivas al Criterio
      </text>
      <text x="16" y="170" fill="#64748b" fontSize="9"
        transform="rotate(-90,16,170)">Criterio de refuerzo</text>
      {levels.map((lv, i) => {
        const x  = 48 + i * 100;
        const h  = 40 + i * 32;
        const y  = 242 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width="82" height={h} rx="4"
              fill={lv.color} opacity="0.22" stroke={lv.color} strokeWidth="1.5" />
            {lv.label.split('\n').map((l, li) => (
              <text key={li} x={x + 41} y={y - 12 + li * 12} textAnchor="middle"
                fill={lv.color} fontSize="8.5">{l}</text>
            ))}
            <text x={x + 41} y={y + h - 8} textAnchor="middle" fill={lv.color} fontSize="14">★</text>
          </g>
        );
      })}
      <line x1="38" y1="245" x2="540" y2="245" stroke="#334155" strokeWidth="1" />
      <text x="280" y="265" textAnchor="middle" fill="#64748b" fontSize="9">
        Tiempo / sesiones de entrenamiento →
      </text>
    </svg>
  );
}

function ChainAnalysisDiagram() {
  return (
    <svg viewBox="0 0 560 300" width="100%" role="img" aria-label="Análisis de Cadena DBT — cadena de comportamiento">
      <defs>
        <marker id="arrCA" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
      <rect width="560" height="300" fill="#0f172a" rx="12" />
      <text x="280" y="24" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Análisis de Cadena DBT — Cadena de Comportamiento
      </text>

      {/* ── Row 1: chain nodes ─────────────────────────────────── */}
      {/* Vulnerability */}
      <rect x="14"  y="44" width="84" height="65" rx="7" fill="#2e1065" stroke="#7c3aed" strokeWidth="1.5" />
      <text x="56"  y="66"  textAnchor="middle" fill="#c4b5fd" fontSize="9"  fontWeight="700">Factor de</text>
      <text x="56"  y="78"  textAnchor="middle" fill="#c4b5fd" fontSize="9"  fontWeight="700">Vulnerabilidad</text>
      <text x="56"  y="100" textAnchor="middle" fill="#8b5cf6" fontSize="7.5">Biológica / Ambiental</text>

      <line x1="98"  y1="76" x2="116" y2="76" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrCA)" />

      {/* Prompting Event */}
      <rect x="116" y="44" width="84" height="65" rx="7" fill="#0c2340" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="158" y="66"  textAnchor="middle" fill="#93c5fd" fontSize="9"  fontWeight="700">Evento</text>
      <text x="158" y="78"  textAnchor="middle" fill="#93c5fd" fontSize="9"  fontWeight="700">Disparador</text>
      <text x="158" y="100" textAnchor="middle" fill="#60a5fa" fontSize="7.5">Prompting Event</text>

      <line x1="200" y1="76" x2="218" y2="76" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrCA)" />

      {/* Link 1 */}
      <rect x="218" y="44" width="70" height="65" rx="7" fill="#052e16" stroke="#22c55e" strokeWidth="1.5" />
      <text x="253" y="66"  textAnchor="middle" fill="#86efac" fontSize="9"  fontWeight="700">Enlace 1</text>
      <text x="253" y="79"  textAnchor="middle" fill="#4ade80" fontSize="8">Pensamiento</text>
      <text x="253" y="91"  textAnchor="middle" fill="#4ade80" fontSize="8">automático</text>

      <line x1="288" y1="76" x2="306" y2="76" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrCA)" />

      {/* Link 2 */}
      <rect x="306" y="44" width="70" height="65" rx="7" fill="#1c1405" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="341" y="66"  textAnchor="middle" fill="#fde68a" fontSize="9"  fontWeight="700">Enlace 2</text>
      <text x="341" y="79"  textAnchor="middle" fill="#fbbf24" fontSize="8">Emoción</text>
      <text x="341" y="91"  textAnchor="middle" fill="#fbbf24" fontSize="8">intensa</text>

      <line x1="376" y1="76" x2="394" y2="76" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrCA)" />

      {/* Problem Behavior */}
      <rect x="394" y="38" width="88" height="77" rx="7" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
      <text x="438" y="60"  textAnchor="middle" fill="#fca5a5" fontSize="9"  fontWeight="700">CONDUCTA</text>
      <text x="438" y="73"  textAnchor="middle" fill="#fca5a5" fontSize="9"  fontWeight="700">PROBLEMA</text>
      <text x="438" y="90"  textAnchor="middle" fill="#ef4444" fontSize="7.5">⚠ Target behavior</text>
      <text x="438" y="103" textAnchor="middle" fill="#ef4444" fontSize="7.5">a intervenir</text>

      {/* ── Arrow down to consequences ─────────────────────────── */}
      <line x1="438" y1="116" x2="438" y2="153" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrCA)" />

      {/* Short-term consequences */}
      <rect x="348" y="153" width="178" height="58" rx="7" fill="#1c1400" stroke="#f97316" strokeWidth="1.5" />
      <text x="437" y="171" textAnchor="middle" fill="#fdba74" fontSize="8.5" fontWeight="700">Consecuencias C/P (+ corto plazo)</text>
      <text x="437" y="184" textAnchor="middle" fill="#9ca3af" fontSize="8">Alivio inmediato del malestar</text>
      <text x="437" y="196" textAnchor="middle" fill="#9ca3af" fontSize="8">(refuerzo negativo → mantiene ciclo)</text>

      <line x1="438" y1="212" x2="438" y2="238" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrCA)" />

      {/* Long-term consequences */}
      <rect x="348" y="238" width="178" height="50" rx="7" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
      <text x="437" y="256" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="700">Consecuencias L/P (+ largo plazo)</text>
      <text x="437" y="269" textAnchor="middle" fill="#64748b" fontSize="8">Deterioro funcional / relacional</text>
      <text x="437" y="281" textAnchor="middle" fill="#64748b" fontSize="8">Mantenimiento del problema</text>

      {/* ── Intervention annotation ────────────────────────────── */}
      <text x="178" y="175" textAnchor="middle" fill="#0d9488" fontSize="9"  fontStyle="italic">Cada eslabón =</text>
      <text x="178" y="188" textAnchor="middle" fill="#0d9488" fontSize="9"  fontStyle="italic">punto de intervención</text>
      <line x1="178" y1="196" x2="214" y2="196" stroke="#0d9488" strokeWidth="1" strokeDasharray="3,3" />
      <text x="178" y="218" textAnchor="middle" fill="#475569" fontSize="8">→ Análisis de soluciones</text>
      <text x="178" y="230" textAnchor="middle" fill="#475569" fontSize="8">por eslabón identificado</text>
    </svg>
  );
}

function CostBenefitMatrix() {
  return (
    <svg viewBox="0 0 560 255" width="100%" role="img" aria-label="Matriz costo-beneficio — experimento conductual">
      <rect width="560" height="255" fill="#0f172a" rx="12" />
      <text x="280" y="22" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">
        Matriz Costo-Beneficio — Experimento Conductual
      </text>
      {/* quadrants */}
      <rect x="18"  y="36" width="250" height="98" rx="6" fill="#1e293b" stroke="#334155" />
      <rect x="292" y="36" width="250" height="98" rx="6" fill="#1e293b" stroke="#334155" />
      <rect x="18"  y="148" width="250" height="90" rx="6" fill="#1e293b" stroke="#334155" />
      <rect x="292" y="148" width="250" height="90" rx="6" fill="#1e293b" stroke="#334155" />
      {/* column headers */}
      <text x="143" y="54" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="700">BENEFICIOS</text>
      <text x="417" y="54" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="700">COSTOS</text>
      {/* row headers */}
      <text x="18" y="92"  fill="#64748b" fontSize="9" fontWeight="600">  Mantener creencia</text>
      <text x="18" y="190" fill="#64748b" fontSize="9" fontWeight="600">  Conducta alternativa</text>
      {/* axis label */}
      <text x="280" y="248" textAnchor="middle" fill="#64748b" fontSize="9">
        Comparar filas para elegir la acción con mayor balance coste/beneficio
      </text>
    </svg>
  );
}

// ── Visual router ────────────────────────────────────────────────────────────

function VisualAid({ visual }: { visual: TechniqueVisual }) {
  switch (visual) {
    case 'abc_flow':            return <AbcFlowDiagram />;
    case 'exposure_ladder':     return <ExposureHierarchy />;
    case 'thought_record':      return <ThoughtRecord5Col />;
    case 'ba_schedule':         return <BaWeeklySchedule />;
    case 'problem_solving_flow': return <ProblemSolvingFlow />;
    case 'shaping_chain':       return <ShapingChain />;
    case 'cost_benefit_matrix': return <CostBenefitMatrix />;
    case 'chain_analysis':      return <ChainAnalysisDiagram />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Technique card (left list)
// ═══════════════════════════════════════════════════════════════════════════════

function TechniqueCard({
  tech, selected, onSelect,
}: {
  tech: TechniqueProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = TECH_CAT_META[tech.category];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        selected
          ? 'bg-amber-500/10 border-amber-500/40'
          : 'bg-slate-800/60 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>
          {meta.label}
        </span>
        <DifficultyDots level={tech.difficulty} />
      </div>

      <p className={`font-semibold text-sm leading-snug ${selected ? 'text-amber-300' : 'text-slate-200'}`}>
        {tech.name}
        {tech.abbr && <span className="ml-1.5 text-xs text-slate-500 font-normal">({tech.abbr})</span>}
        {tech.status === 'draft' && (
          <span className="ml-2 text-[9px] text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded-full">
            borrador
          </span>
        )}
      </p>

      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tech.tagline}</p>

      <div className="flex flex-wrap gap-1 mt-1.5">
        {tech.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[9px] text-slate-500 border border-slate-700/60 px-1.5 py-0.5 rounded-full">
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Detail panels
// ═══════════════════════════════════════════════════════════════════════════════

function DescripcionPanel({ tech }: { tech: TechniqueProfile }) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Definición</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{tech.definition}</p>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Mecanismo de cambio</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{tech.mechanism}</p>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Resumen clínico</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{tech.summary}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 mb-1">Sesiones estimadas</p>
          <p className="text-sm font-semibold text-slate-200">{tech.sessionCount}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 mb-1">Dificultad</p>
          <DifficultyDots level={tech.difficulty} />
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 mb-1.5">Tradiciones</p>
          <div className="flex flex-wrap gap-1">
            {tech.traditions.map((t) => (
              <span key={t} className="text-[9px] text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {tech.references.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Referencias clave</h4>
          <ul className="space-y-1">
            {tech.references.map((r, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2 leading-relaxed">
                <span className="text-slate-600 mt-0.5 shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PasosPanel({ tech }: { tech: TechniqueProfile }) {
  return (
    <div className="space-y-5">
      {tech.steps.map((step) => (
        <div key={step.n} className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30
            flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-amber-400">{step.n}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-200 mb-1">{step.title}</p>
            <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>

            {step.substeps && step.substeps.length > 0 && (
              <ul className="mt-2 space-y-1">
                {step.substeps.map((s, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0">›</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}

            {step.example && (
              <div className="mt-2 bg-slate-800/50 border-l-2 border-amber-500/40 pl-3 py-2 rounded-r-lg">
                <p className="text-[10px] text-amber-400/80 font-medium mb-0.5">Ejemplo clínico</p>
                <p className="text-xs text-slate-400 italic">{step.example}</p>
              </div>
            )}

            {step.tip && (
              <div className="mt-2 flex gap-2 items-start bg-blue-950/20 border border-blue-900/30
                rounded-lg px-2.5 py-2">
                <span className="text-blue-400 text-sm shrink-0">💡</span>
                <p className="text-xs text-blue-300/80">{step.tip}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EvaluacionPanel({ tech }: { tech: TechniqueProfile }) {
  const { evaluation } = tech;
  return (
    <div className="space-y-5">
      {evaluation.process && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Proceso de evaluación
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">{evaluation.process}</p>
        </div>
      )}

      {evaluation.criteria.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Criterios de éxito
          </h4>
          <ul className="space-y-1.5">
            {evaluation.criteria.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-green-400 shrink-0 mt-0.5 text-xs">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.instruments.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Instrumentos de medición
          </h4>
          <div className="space-y-2">
            {evaluation.instruments.map((inst, i) => {
              const m = RES_META[inst.type];
              return (
                <div key={i} className={`px-3 py-2 rounded-lg border ${m?.cls ?? 'border-slate-700 text-slate-300'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{inst.name}{inst.abbr && ` (${inst.abbr})`}</p>
                    <span className="text-[9px] uppercase tracking-wide opacity-60">{m?.label ?? inst.type}</span>
                  </div>
                  <p className="text-xs opacity-75 mt-0.5">{inst.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {evaluation.timeline && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Línea temporal de evaluación
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">{evaluation.timeline}</p>
        </div>
      )}

      {evaluation.followUp && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Seguimiento
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">{evaluation.followUp}</p>
        </div>
      )}
    </div>
  );
}

function RecursosPanel({ tech }: { tech: TechniqueProfile }) {
  if (tech.resources.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">Sin recursos específicos registrados para esta técnica.</p>
    );
  }
  return (
    <div className="space-y-3">
      {tech.resources.map((r, i) => {
        const m = RES_META[r.type];
        return (
          <div key={i} className={`p-3 rounded-lg border ${m?.cls ?? 'border-slate-700 text-slate-300'}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">{r.name}{r.abbr && ` (${r.abbr})`}</p>
              <span className="text-[9px] uppercase tracking-wide opacity-60">{m?.label ?? r.type}</span>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">{r.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

function VariablesPanel({ tech }: { tech: TechniqueProfile }) {
  return (
    <div className="space-y-5">
      {/* Indications / contraindications */}
      <div className="grid grid-cols-1 gap-4">
        {tech.indications.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-2">
              Indicaciones — cuándo usar esta técnica
            </h4>
            <ul className="space-y-1">
              {tech.indications.map((ind, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2 leading-relaxed">
                  <span className="text-green-500 shrink-0 mt-0.5 text-xs">+</span>
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tech.contraindications.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">
              Contraindicaciones — cuándo NO usar
            </h4>
            <ul className="space-y-1">
              {tech.contraindications.map((c, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2 leading-relaxed">
                  <span className="text-red-500 shrink-0 mt-0.5 text-xs">−</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Outcome variables */}
      {tech.outcomes.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Variables de resultado objetivo
          </h4>
          <div className="space-y-2">
            {tech.outcomes.map((o, i) => (
              <div key={i} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
                <p className="text-sm font-semibold text-amber-300/90 mb-1">{o.domain}</p>
                <ul className="space-y-0.5">
                  {o.items.map((item, j) => (
                    <li key={j} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-amber-600 shrink-0">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organismic / modulating variables */}
      {tech.organizingVars.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">
            Variables Organísmicas Moduladoras
          </h4>
          <div className="space-y-2">
            {tech.organizingVars.map((v, i) => (
              <div key={i} className="bg-slate-800/40 rounded-lg p-3 border border-purple-900/30">
                <p className="text-xs font-semibold text-purple-300 mb-1">{v.category}</p>
                <ul className="space-y-0.5">
                  {v.items.map((item, j) => (
                    <li key={j} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-purple-600 shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GraficoPanel({ tech }: { tech: TechniqueProfile }) {
  if (!tech.visual) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl border border-slate-800
        text-slate-500 text-sm">
        Sin visualización disponible para esta técnica.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <VisualAid visual={tech.visual} />
      <p className="text-xs text-slate-600 text-center">
        Esquema orientativo — no reemplaza el juicio clínico.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main export
// ═══════════════════════════════════════════════════════════════════════════════

export function TechniqueExplorer() {
  const store       = useTherapistStore();
  const [search,     setSearch]    = useState('');
  const [filterCat,  setFilterCat] = useState<TechniqueCategory | 'all'>('all');
  const [filterDiff, setFilterDiff] = useState<0 | 1 | 2 | 3>(0);
  const [selected,   setSelected]  = useState<TechniqueProfile>(TECHNIQUE_PROFILES[0]);
  const [detailTab,  setDetailTab] = useState<DetailTab>('descripcion');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TECHNIQUE_PROFILES.filter((t) => {
      const matchQ    = !q || t.name.toLowerCase().includes(q)
        || t.tagline.toLowerCase().includes(q)
        || t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchCat  = filterCat === 'all' || t.category === filterCat;
      const matchDiff = filterDiff === 0 || t.difficulty === filterDiff;
      return matchQ && matchCat && matchDiff;
    });
  }, [search, filterCat, filterDiff]);

  const categories = Object.entries(TECH_CAT_META) as [
    TechniqueCategory,
    (typeof TECH_CAT_META)[TechniqueCategory],
  ][];

  function selectTech(t: TechniqueProfile) {
    setSelected(t);
    setDetailTab('descripcion');
  }

  return (
    <div className="flex gap-5" style={{ minHeight: '72vh' }}>

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 flex flex-col gap-3">

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar técnica o etiqueta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2
              text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button"
            onClick={() => setFilterCat('all')}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              filterCat === 'all'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}>
            Todas
          </button>
          {categories.map(([id, meta]) => (
            <button key={id} type="button"
              onClick={() => setFilterCat(filterCat === id ? 'all' : id)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                filterCat === id ? meta.badge : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}>
              {meta.label}
            </button>
          ))}
        </div>

        {/* Difficulty pills */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-medium shrink-0">Dificultad:</span>
          {([0, 1, 2, 3] as const).map((d) => (
            <button key={d} type="button"
              onClick={() => setFilterDiff(filterDiff === d ? 0 : d)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                filterDiff === d
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}>
              {d === 0 ? 'Todas' : '●'.repeat(d)}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-[10px] text-slate-600">
          {filtered.length} de {TECHNIQUE_PROFILES.length} técnicas
        </p>

        {/* Technique list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 px-2 py-4">Sin resultados para la búsqueda.</p>
          )}
          {filtered.map((t) => (
            <TechniqueCard
              key={t.id}
              tech={t}
              selected={selected.id === t.id}
              onSelect={() => selectTech(t)}
            />
          ))}
        </div>
      </aside>

      {/* ── Right detail panel ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="shrink-0 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              TECH_CAT_META[selected.category].badge
            }`}>
              {TECH_CAT_META[selected.category].label}
            </span>
            <DifficultyDots level={selected.difficulty} />
            <span className="text-[10px] text-slate-500">{selected.sessionCount} ses.</span>
            {selected.traditions.map((t) => (
              <span key={t} className="text-[9px] text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-100 leading-tight">
                {selected.name}
                {selected.abbr && (
                  <span className="ml-2 text-base font-normal text-slate-500">({selected.abbr})</span>
                )}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">{selected.tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => store.setSessionTechnique(
                store.sessionTechniqueId === selected.id ? null : selected.id
              )}
              className={`shrink-0 mt-1 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                store.sessionTechniqueId === selected.id
                  ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-blue-900/30 border-blue-800/40 text-blue-300 hover:bg-blue-900/50'
              }`}
              title={store.sessionTechniqueId === selected.id
                ? 'Desactivar técnica de sesión'
                : 'Activar como guía de sesión actual'}
            >
              {store.sessionTechniqueId === selected.id ? (
                <>
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  En sesión
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                  Usar en sesión
                </>
              )}
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  detailTab === tab.id
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium'
                    : 'border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {detailTab === 'descripcion' && <DescripcionPanel  tech={selected} />}
          {detailTab === 'pasos'       && <PasosPanel        tech={selected} />}
          {detailTab === 'evaluacion'  && <EvaluacionPanel   tech={selected} />}
          {detailTab === 'recursos'    && <RecursosPanel     tech={selected} />}
          {detailTab === 'variables'   && <VariablesPanel    tech={selected} />}
          {detailTab === 'grafico'     && <GraficoPanel      tech={selected} />}
        </div>
      </main>
    </div>
  );
}
