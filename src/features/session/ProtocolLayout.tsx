/**
 * ProtocolLayout — Shell visual del protocolo TCC
 *
 * Muestra en qué fase estás y permite navegar hacia atrás.
 * No permite saltar fases hacia adelante (protocolo secuencial).
 */
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore, type ProtocolPhase } from '../../shared/sessionStore';

const PHASES: { id: ProtocolPhase; label: string; short: string; path: string }[] = [
  { id: 'intake',          label: 'Motivo de consulta',   short: '1', path: '/session/intake' },
  { id: 'assessment',      label: 'Evaluación',           short: '2', path: '/session/assessment' },
  { id: 'psychoeducation', label: 'Psicoeducación',       short: '3', path: '/session/psychoeducation' },
  { id: 'goals',           label: 'Objetivos',            short: '4', path: '/session/goals' },
  { id: 'intervention',    label: 'Intervención',         short: '5', path: '/session/intervention' },
  { id: 'evaluation',      label: 'Evaluación de cambio', short: '6', path: '/session/evaluation' },
  { id: 'followup',        label: 'Seguimiento',          short: '7', path: '/session/followup' },
];

const PHASE_ORDER: ProtocolPhase[] = PHASES.map((p) => p.id);

export function ProtocolLayout() {
  const { currentPhase, resetSession } = useSessionStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentIdx = PHASE_ORDER.indexOf(currentPhase);

  const currentPathPhase = PHASES.find((p) => location.pathname.endsWith(p.id));
  const displayPhase = currentPathPhase?.id ?? currentPhase;
  const displayIdx = PHASE_ORDER.indexOf(displayPhase);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">

      {/* Barra superior — progreso de fases */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">
              TCC Lab — Protocolo Experimental
            </span>
            <button
              onClick={() => { resetSession(); navigate('/'); }}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Nueva sesión
            </button>
          </div>

          {/* Indicadores de fase */}
          <div className="flex items-center gap-1">
            {PHASES.map((phase, idx) => {
              const isDone = idx < displayIdx;
              const isActive = idx === displayIdx;
              const isLocked = idx > currentIdx;

              return (
                <button
                  key={phase.id}
                  disabled={isLocked}
                  onClick={() => !isLocked && navigate(phase.path)}
                  title={phase.label}
                  className={[
                    'flex-1 h-1.5 rounded-full transition-all duration-300',
                    isDone ? 'bg-emerald-500' : '',
                    isActive ? 'bg-blue-500' : '',
                    isLocked ? 'bg-slate-800' : '',
                    !isDone && !isActive && !isLocked ? 'bg-slate-700' : '',
                  ].join(' ')}
                />
              );
            })}
          </div>

          {/* Etiqueta de fase actual */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-blue-400 font-medium">
              {PHASES[displayIdx]?.label ?? ''}
            </span>
            <span className="text-xs text-slate-600">
              {displayIdx + 1} de {PHASES.length}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido de la fase */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
