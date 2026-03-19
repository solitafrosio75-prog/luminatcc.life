/**
 * PatientDashboard — "Refugio Cálido"
 *
 * Pantalla principal del paciente. Tema cálido (light) que contrasta
 * con la interfaz clínica oscura del terapeuta.
 * Tipografía: Fraunces (display) + Commissioner (body).
 *
 * Styling: Tailwind utility-first, matching project patterns.
 * Dynamic runtime colors use minimal `style` props (same pattern as PatientRegisterScreen).
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, ChevronRight, ChevronDown, CheckCircle2,
  BookOpen, ClipboardList, Heart, Wind, Leaf, PenLine, Phone,
  TrendingUp, FileText, X, Activity,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { usePatientStore } from './patientStore';
import './patient-dashboard.css';
/* ════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════ */
 
interface SessionSummary {
  id: string;
  date: string;
  number: number;
  summary: string;
  techniques: string[];
  homework: string[];
  moodPre: number;
  moodPost: number;
}
 
interface PatientTask {
  id: string;
  title: string;
  description: string;
  technique: string;
  assignedDate: string;
  dueDate?: string;
  completed: boolean;
  completedDate?: string;
}
 
interface AutoRegistro {
  id: string;
  type: 'pensamiento' | 'actividad' | 'emocion' | 'exposicion' | 'abc';
  title: string;
  description: string;
  assignedDate: string;
  completed: boolean;
  completedDate?: string;
}
 
interface MoodEntry {
  date: string;
  value: number;
}
 
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
 
/* ════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════ */
 
const getTimeOfDay = (h: number): TimeOfDay =>
  h >= 6 && h < 12 ? 'morning' :
  h >= 12 && h < 19 ? 'afternoon' :
  h >= 19 && h < 22 ? 'evening' : 'night';
 
const TIME_THEMES = {
  morning: {
    greeting: 'Buenos días',
    emoji: '🌅',
    gradient: 'linear-gradient(135deg, #FFF8E7 0%, #FCECD4 40%, #FBF8F3 100%)',
    accentColor: '#D4956A',
  },
  afternoon: {
    greeting: 'Buenas tardes',
    emoji: '☀️',
    gradient: 'linear-gradient(135deg, #EFF6F0 0%, #E0EDE3 40%, #FBF8F3 100%)',
    accentColor: '#5B8C6F',
  },
  evening: {
    greeting: 'Buenas tardes',
    emoji: '🌇',
    gradient: 'linear-gradient(135deg, #F5EDE4 0%, #EBD9C8 40%, #FBF8F3 100%)',
    accentColor: '#C4875A',
  },
  night: {
    greeting: 'Buenas noches',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg, #EBE8F2 0%, #DCD8EA 40%, #F4F2F8 100%)',
    accentColor: '#8B7BAA',
  },
} as const;
 
const MOOD_OPTIONS = [
  { value: 1, label: 'Muy mal', color: '#C4594A', bg: '#FBEDEB' },
  { value: 2, label: 'Mal', color: '#D4956A', bg: '#FBF0E5' },
  { value: 3, label: 'Regular', color: '#B0A69C', bg: '#F0EBE4' },
  { value: 4, label: 'Bien', color: '#7BAF8F', bg: '#E8F2EC' },
  { value: 5, label: 'Muy bien', color: '#5B8C6F', bg: '#DFF0E4' },
];
 
const REG_ICONS: Record<AutoRegistro['type'], { Icon: typeof FileText; color: string }> = {
  pensamiento: { Icon: PenLine, color: '#5B8C6F' },
  actividad:   { Icon: Activity, color: '#D4956A' },
  emocion:     { Icon: Heart, color: '#C4594A' },
  exposicion:  { Icon: TrendingUp, color: '#7B6BA0' },
  abc:         { Icon: FileText, color: '#5B8C6F' },
};
 
const WELLNESS_TOOLS = [
  { id: 'breathing', name: 'Respiración guiada', desc: 'Técnica 4-7-8 para calmar la ansiedad', Icon: Wind, color: '#5B8C6F' },
  { id: 'grounding', name: 'Técnica de anclaje', desc: '5-4-3-2-1: conecta con el presente', Icon: Leaf, color: '#7B6BA0' },
  { id: 'journal', name: 'Diario rápido', desc: 'Escribe brevemente cómo fue tu día', Icon: PenLine, color: '#D4956A' },
];
 
/* ── Mock data (replace with real stores/API) ────────── */
 
const MOCK_PATIENT = { alias: 'María', nextSession: '2026-03-20T10:00:00', treatmentStart: '2026-03-01' };
 
const MOCK_SESSIONS: SessionSummary[] = [
  {
    id: 's3', date: '2026-03-13T10:00:00', number: 3,
    summary: 'Continuamos con la identificación de pensamientos automáticos negativos. Se introdujo el registro de pensamientos con columnas de evidencia. Progreso notable en detectar distorsiones cognitivas.',
    techniques: ['Registro de pensamientos', 'Reestructuración cognitiva'],
    homework: ['Completar 3 registros de pensamientos', 'Practicar respiración 4-7-8'],
    moodPre: 6, moodPost: 4,
  },
  {
    id: 's2', date: '2026-03-06T10:00:00', number: 2,
    summary: 'Se realizó el modelo ABC para identificar patrones de evitación. Psicoeducación sobre la relación pensamiento-emoción-conducta.',
    techniques: ['Modelo ABC', 'Psicoeducación', 'Activación conductual'],
    homework: ['Registro diario de actividades', 'Leer material sobre distorsiones'],
    moodPre: 7, moodPost: 5,
  },
  {
    id: 's1', date: '2026-03-01T10:00:00', number: 1,
    summary: 'Sesión inicial: establecimiento de alianza terapéutica, evaluación con BDI-II y GAD-7. Se identificaron las áreas principales de trabajo.',
    techniques: ['Entrevista clínica', 'BDI-II', 'GAD-7'],
    homework: ['Leer psicoeducación sobre TCC'],
    moodPre: 8, moodPost: 6,
  },
];
 
const MOCK_TASKS: PatientTask[] = [
  {
    id: 't1', title: 'Registro de pensamientos automáticos',
    description: 'Cada vez que notes un cambio fuerte en tu estado de ánimo, anota: (1) la situación, (2) qué pensaste, (3) qué emoción sentiste y su intensidad (0-10), (4) evidencia a favor y en contra del pensamiento, (5) un pensamiento alternativo. Intenta completar al menos 3 registros esta semana.',
    technique: 'Reestructuración cognitiva', assignedDate: '2026-03-13', dueDate: '2026-03-20', completed: false,
  },
  {
    id: 't2', title: 'Respiración 4-7-8 antes de dormir',
    description: 'Practica la técnica de respiración cada noche: inspira contando hasta 4, mantén contando hasta 7, exhala contando hasta 8. Repite 4 ciclos. Registra cómo te sentiste antes y después.',
    technique: 'Relajación', assignedDate: '2026-03-13', completed: false,
  },
  {
    id: 't3', title: 'Registro diario de actividades',
    description: 'Anota las actividades que realizas y puntúa de 0 a 10: (a) el nivel de placer, (b) el nivel de dominio o logro que sentiste.',
    technique: 'Activación conductual', assignedDate: '2026-03-06', dueDate: '2026-03-13', completed: true, completedDate: '2026-03-12',
  },
];
 
const MOCK_REGISTROS: AutoRegistro[] = [
  { id: 'r1', type: 'pensamiento', title: 'Registro de pensamientos', description: 'Situación → Pensamiento → Emoción → Evidencia → Alternativa', assignedDate: '2026-03-13', completed: false },
  { id: 'r2', type: 'emocion', title: 'Escala de estado de ánimo', description: 'Registro diario de tu estado emocional (0-10)', assignedDate: '2026-03-13', completed: false },
  { id: 'r3', type: 'actividad', title: 'Registro de actividades', description: 'Actividad → Placer (0-10) → Dominio (0-10)', assignedDate: '2026-03-06', completed: true, completedDate: '2026-03-12' },
];
 
const MOCK_MOOD: MoodEntry[] = [
  { date: '2026-03-03', value: 2 }, { date: '2026-03-04', value: 2 },
  { date: '2026-03-05', value: 3 }, { date: '2026-03-06', value: 3 },
  { date: '2026-03-07', value: 2 }, { date: '2026-03-08', value: 3 },
  { date: '2026-03-09', value: 3 }, { date: '2026-03-10', value: 4 },
  { date: '2026-03-11', value: 3 }, { date: '2026-03-12', value: 4 },
  { date: '2026-03-13', value: 4 }, { date: '2026-03-14', value: 3 },
  { date: '2026-03-15', value: 4 }, { date: '2026-03-16', value: 4 },
];
 
/* ════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════ */
 
function SectionLabel({ title, icon: Icon, count }: {
  title: string;
  icon: typeof Calendar;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-[#5B8C6F] shrink-0" />
      <h2 className="font-display text-sm font-semibold text-[#2A2520] tracking-tight">
        {title}
      </h2>
      {count !== undefined && (
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E8F2EC] text-[#5B8C6F]">
          {count}
        </span>
      )}
    </div>
  );
}
 
/* ── Mood sparkline (SVG) — only style on SVG attrs ──── */
function MoodSparkline({ data }: { data: MoodEntry[] }) {
  if (data.length < 2) return null;
 
  const W = 300, H = 80;
  const pad = { t: 10, r: 10, b: 22, l: 10 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
 
  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * iW,
    y: pad.t + iH - ((d.value - 1) / 4) * iH,
    label: format(parseISO(d.date), 'd', { locale: es }),
  }));
 
  let line = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    line += ` C ${prev.x + (curr.x - prev.x) * 0.4},${prev.y} ${prev.x + (curr.x - prev.x) * 0.6},${curr.y} ${curr.x},${curr.y}`;
  }
  const area = `${line} L ${pts[pts.length - 1].x},${H - pad.b} L ${pts[0].x},${H - pad.b} Z`;
 
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[100px]">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B8C6F" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#5B8C6F" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <path d={line} fill="none" stroke="#5B8C6F" strokeWidth="2" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#5B8C6F" stroke="white" strokeWidth="2" />
          {i % 3 === 0 && (
            <text x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#B0A69C" className="font-body">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
 
/* ── Session history modal ────────────────────────────── */
function SessionHistoryModal({ sessions, onClose }: {
  sessions: SessionSummary[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-lg p-6 pd-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-[#2A2520]">
            Historial de sesiones
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={20} className="text-[#B0A69C]" />
          </button>
        </div>
 
        <div className="space-y-4">
          {sessions.map(s => (
            <div key={s.id} className="p-4 rounded-lg border border-[#F0EBE4] bg-[#FBF8F3]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-display text-sm font-semibold text-[#2A2520]">
                  Sesión {s.number}
                </p>
                <p className="text-xs text-[#B0A69C]">
                  {format(parseISO(s.date), "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-[#7A7068] mb-3">{s.summary}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {s.techniques.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#E8F2EC] text-[#5B8C6F]">
                    {t}
                  </span>
                ))}
              </div>
              {s.homework.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#F0EBE4]">
                  <p className="text-xs font-medium text-[#B0A69C] mb-1">Tareas asignadas:</p>
                  <ul className="space-y-0.5">
                    {s.homework.map((hw, i) => (
                      <li key={i} className="text-xs text-[#7A7068]">• {hw}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-[#B0A69C] mt-2">
                <span>Estado de ánimo: {s.moodPre} → {s.moodPost}</span>
                {s.moodPost < s.moodPre && (
                  <span className="font-medium text-[#5B8C6F]">↓ mejoría</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
/* ════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════ */
 
export default function PatientDashboard() {
  const { activePatient } = usePatientStore();
  const [now, setNow] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
 
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
 
  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedDate: !t.completed ? format(new Date(), 'yyyy-MM-dd') : undefined }
          : t,
      ),
    );
  }, []);
 
  const timeOfDay = getTimeOfDay(now.getHours());
  const theme = TIME_THEMES[timeOfDay];
  const lastSession = MOCK_SESSIONS[0];
  const pendingTasks = tasks.filter(t => !t.completed);
  const pendingRegistros = MOCK_REGISTROS.filter(r => !r.completed);
  const patientAlias = activePatient?.alias ?? MOCK_PATIENT.alias;
  const treatmentStart = activePatient?.createdAt
    ? new Date(activePatient.createdAt).toISOString().slice(0, 10)
    : MOCK_PATIENT.treatmentStart;
  const daysInTherapy = differenceInDays(now, parseISO(treatmentStart));
  const daysToNext = differenceInDays(parseISO(MOCK_PATIENT.nextSession), now);
 
  return (
    <div className="patient-dashboard font-body min-h-screen text-[#2A2520]">
 
      {/* ─── HEADER ─────────────────────────────────────── */}
      <header className="px-6 pt-8 pb-6 mb-2" style={{ background: theme.gradient }}>
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{theme.emoji}</span>
              <span className="text-[10px] font-mono text-[#B0A69C] uppercase tracking-widest">
                {format(now, 'HH:mm')}
              </span>
            </div>
 
            <h1 className="font-display text-3xl font-light text-[#2A2520] mb-1">
              {theme.greeting},{' '}
              <span className="font-semibold">{patientAlias}</span>
            </h1>
 
            <p className="text-sm text-[#7A7068] capitalize">
              {format(now, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
 
            <div
              className="h-px w-16 mt-3 rounded-full"
              style={{ background: `linear-gradient(to right, ${theme.accentColor}, transparent)` }}
            />
          </div>
 
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[#E8F2EC] border border-[#5B8C6F]/20 flex items-center justify-center text-lg shrink-0 select-none">
            <span className="font-display font-semibold text-[#5B8C6F]">
              {MOCK_PATIENT.alias[0]}
            </span>
          </div>
        </div>
      </header>
 
      {/* ─── MAIN CONTENT ───────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pb-24 space-y-5">
 
        {/* ── Mood Check-in ─────────────────────────────── */}
        <div className="rounded-xl border border-[#F0EBE4] bg-white shadow-sm p-5 pd-fade-up pd-delay-1">
          <p className="text-[10px] text-[#B0A69C] uppercase tracking-widest mb-3">
            ¿Cómo te sientes hoy?
          </p>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedMood(opt.value)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border',
                  selectedMood === opt.value ? 'scale-105 shadow-sm' : 'hover:scale-[1.02]',
                )}
                style={{
                  background: selectedMood === opt.value ? opt.bg : 'transparent',
                  color: selectedMood === opt.value ? opt.color : '#B0A69C',
                  borderColor: selectedMood === opt.value ? opt.color + '40' : '#F0EBE4',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {selectedMood && (
            <p className="text-xs mt-2.5 text-center text-[#5B8C6F] font-medium">
              Registrado — gracias por compartir
            </p>
          )}
        </div>
 
        {/* ── Sessions row ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Last session */}
          <div className="rounded-xl border border-[#F0EBE4] bg-white shadow-sm p-5 space-y-3 pd-fade-up pd-delay-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E8F2EC] flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-[#5B8C6F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#B0A69C] uppercase tracking-widest">Última sesión</p>
                <p className="font-display text-sm font-semibold text-[#2A2520] truncate">
                  Sesión {lastSession.number} — {format(parseISO(lastSession.date), "d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
 
            <p className="text-sm leading-relaxed text-[#7A7068] line-clamp-3">
              {lastSession.summary}
            </p>
 
            <div className="flex flex-wrap gap-1.5">
              {lastSession.techniques.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-[#E8F2EC] text-[#5B8C6F]">
                  {t}
                </span>
              ))}
            </div>
 
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs font-medium text-[#5B8C6F] hover:text-[#4A7A5E] flex items-center gap-1 transition-colors"
            >
              Ver historial completo
              <ChevronRight size={14} />
            </button>
          </div>
 
          {/* Next session */}
          <div className="rounded-xl border border-[#D4956A]/20 bg-[#D4956A]/5 shadow-sm p-5 space-y-3 pd-fade-up pd-delay-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0DBC8] flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[#D4956A]" />
              </div>
              <div>
                <p className="text-[10px] text-[#B0A69C] uppercase tracking-widest">Próxima sesión</p>
                <p className="font-display text-sm font-semibold text-[#2A2520]">
                  {format(parseISO(MOCK_PATIENT.nextSession), "EEEE d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
 
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-[#D4956A]">
                <Clock size={14} />
                {format(parseISO(MOCK_PATIENT.nextSession), 'HH:mm')}
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F0DBC8] text-[#D4956A] pd-pulse">
                en {daysToNext} {daysToNext === 1 ? 'día' : 'días'}
              </span>
            </div>
 
            <div className="p-3 rounded-lg border border-[#E8E2DA]/60 bg-[#FBF8F3]">
              <p className="text-xs font-medium text-[#7A7068] mb-1.5">Preparación para la sesión:</p>
              <ul className="space-y-1">
                {lastSession.homework.map((hw, i) => (
                  <li key={i} className="text-xs text-[#B0A69C] flex items-start gap-1.5">
                    <span className="text-[#D4956A]">•</span>
                    {hw}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
 
        {/* ── Tasks + Registros row ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks */}
          <div className="rounded-xl border border-[#F0EBE4] bg-white shadow-sm p-5 pd-fade-up pd-delay-4">
            <SectionLabel title="Mis Tareas" icon={ClipboardList} count={pendingTasks.length} />
 
            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div key={task.id}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="pd-check mt-0.5"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        className="w-full text-left"
                      >
                        <p className={clsx(
                          'text-sm font-medium transition-colors',
                          task.completed ? 'text-[#B0A69C] line-through' : 'text-[#2A2520]',
                        )}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0DBC8] text-[#D4956A]">
                            {task.technique}
                          </span>
                          {task.dueDate && !task.completed && (
                            <span className="text-xs text-[#B0A69C]">
                              {format(parseISO(task.dueDate), "d MMM", { locale: es })}
                            </span>
                          )}
                        </div>
                      </button>
                      {expandedTask === task.id && (
                        <p className="text-xs leading-relaxed text-[#7A7068] mt-2.5 pb-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      className={clsx(
                        'text-[#B0A69C] transition-transform duration-200 shrink-0 mt-1',
                        expandedTask === task.id && 'rotate-180',
                      )}
                    />
                  </div>
                  {idx < tasks.length - 1 && (
                    <div className="h-px ml-10 mt-3 bg-[#F0EBE4]" />
                  )}
                </div>
              ))}
            </div>
          </div>
 
          {/* Autoregistros */}
          <div className="rounded-xl border border-[#F0EBE4] bg-white shadow-sm p-5 pd-fade-up pd-delay-5">
            <SectionLabel title="Mis Registros" icon={FileText} count={pendingRegistros.length} />
 
            <div className="space-y-2.5">
              {MOCK_REGISTROS.map(reg => {
                const { Icon: RegIcon, color } = REG_ICONS[reg.type];
                return (
                  <div
                    key={reg.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      reg.completed
                        ? 'border-[#F0EBE4] bg-transparent'
                        : 'border-[#E8E2DA] bg-[#FBF8F3] cursor-pointer hover:shadow-sm',
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: color + '15' }}
                    >
                      <RegIcon size={16} style={{ color }} />
                    </div>
 
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-sm font-medium', reg.completed ? 'text-[#B0A69C] line-through' : 'text-[#2A2520]')}>
                        {reg.title}
                      </p>
                      <p className="text-xs text-[#B0A69C] truncate">{reg.description}</p>
                    </div>
 
                    {reg.completed ? (
                      <CheckCircle2 size={18} className="text-[#5B8C6F] shrink-0" />
                    ) : (
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#5B8C6F] hover:bg-[#4A7A5E] text-white transition-colors shrink-0">
                        Completar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
 
        {/* ── Progress + Wellness row ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Progress */}
          <div className="rounded-xl border border-[#F0EBE4] bg-white shadow-sm p-5 pd-fade-up pd-delay-6">
            <SectionLabel title="Mi Progreso" icon={TrendingUp} />
            <MoodSparkline data={MOCK_MOOD} />
 
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#F0EBE4]">
              <div className="text-center">
                <p className="font-display text-2xl font-semibold text-[#5B8C6F]">{MOCK_SESSIONS.length}</p>
                <p className="text-[10px] text-[#B0A69C] uppercase tracking-widest">Sesiones</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-semibold text-[#5B8C6F]">
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </p>
                <p className="text-[10px] text-[#B0A69C] uppercase tracking-widest">Tareas</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-semibold text-[#D4956A]">{daysInTherapy}</p>
                <p className="text-[10px] text-[#B0A69C] uppercase tracking-widest">Días</p>
              </div>
            </div>
 
            <div className="mt-4 p-3 rounded-lg bg-[#E8F2EC] text-center">
              <p className="text-xs text-[#5B8C6F]">
                Tu tendencia de ánimo muestra una evolución positiva.
              </p>
            </div>
          </div>
 
          {/* Wellness tools */}
          <div className="rounded-xl border border-[#F0EBE4] bg-white shadow-sm p-5 pd-fade-up pd-delay-7">
            <SectionLabel title="Herramientas" icon={Heart} />
 
            <div className="space-y-2.5">
              {WELLNESS_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => tool.id === 'breathing' && setShowBreathing(!showBreathing)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#F0EBE4] bg-[#FBF8F3] hover:shadow-sm transition-all text-left"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: tool.color + '15' }}
                  >
                    <tool.Icon size={16} style={{ color: tool.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2A2520]">{tool.name}</p>
                    <p className="text-xs text-[#B0A69C]">{tool.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#B0A69C] shrink-0" />
                </button>
              ))}
            </div>
 
            {/* Breathing exercise */}
            {showBreathing && (
              <div className="mt-4 pt-4 border-t border-[#F0EBE4]">
                <div className="flex flex-col items-center py-4">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#5B8C6F] pd-breathe" />
                    <div className="relative w-6 h-6 rounded-full bg-[#5B8C6F] opacity-80" />
                  </div>
                  <p className="font-display text-sm font-medium text-[#5B8C6F] mt-4">
                    Respira con el círculo
                  </p>
                  <p className="text-xs text-[#B0A69C] mt-1">
                    4s inspira · 7s mantén · 8s exhala
                  </p>
                  <button
                    onClick={() => setShowBreathing(false)}
                    className="text-xs text-[#B0A69C] hover:text-[#7A7068] mt-3 px-3 py-1 rounded-lg bg-[#FBF8F3] transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
 
      </main>
 
      {/* ─── CRISIS FOOTER ──────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 px-4 text-center bg-gradient-to-t from-[#FBF8F3] via-[#FBF8F3]/90 to-transparent">
        <button className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full bg-[#FBEDEB] text-[#C4594A] border border-[#C4594A]/15 transition-all hover:shadow-md">
          <Phone size={13} />
          ¿Necesitas ayuda? Línea de crisis: 024
        </button>
      </footer>
 
      {/* ─── SESSION HISTORY MODAL ──────────────────────── */}
      {showHistory && (
        <SessionHistoryModal sessions={MOCK_SESSIONS} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

export { PatientDashboard };