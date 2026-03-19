/**
 * SessionStartScreen — Punto de entrada al protocolo
 *
 * Detecta si hay un paciente activo registrado:
 *   - Sin paciente → redirige a /patient/register
 *   - Con paciente, entrevista no completada → redirige a /interview
 *   - Con paciente, entrevista completada → muestra opciones de sesión
 */
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../shared/sessionStore';
import { usePatientStore } from '../patient/patientStore';
import { PatientDashboardterapisth} from '../therapist/PatientDashboardterapisth';
import {InterviewScreen } from '../interview/InterviewScreen';
import { PatientDashboard } from '../patient/PatientDashboard';



import clsx from 'clsx'


export function SessionStartScreen() {
  const { startSession, sessionStarted, currentPhase } = useSessionStore();
  const { activePatient, clearActivePatient } = usePatientStore();
  const navigate = useNavigate();

  const PHASE_PATH: Record<string, string> = {
    intake: '/session/intake',
    assessment: '/session/assessment',
    psychoeducation: '/session/psychoeducation',
    goals: '/session/goals',
    intervention: '/session/intervention',
    evaluation: '/session/evaluation',
    followup: '/session/followup',
    InterviewScreen: '/interview',
    PatientDashboard: '/PatientDashboard',
    PatientDashboardterapisth: '/therapist/PatientDashboardterapisth',
  };

  const handleStart = () => {
    startSession();
    navigate('/session/intake');
  };

  const handleContinue = () => {
    navigate(PHASE_PATH[currentPhase] ?? '/session/intake');
  };

  // ── Redirecciones por estado de paciente ──────────────────────────────────
  const handleNewPatient = () => {
    clearActivePatient();
    navigate('/assessment');
  };

  const handleGoToInterview = () => {
    navigate('/interview');
  };

  // ── Saludo según el estado ────────────────────────────────────────────────
  const patientName = activePatient?.alias ?? '';
  const hasPatient = !!activePatient;
  const interviewDone = activePatient?.interviewCompleted ?? false;
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Identificador del proyecto */}
        <div>
          <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">
            TCC Lab · Protocolo Experimental
          </span>
          <h1 className="mt-3 text-3xl font-light text-slate-100">
            {hasPatient
              ? `Hola, ${patientName}`
              : 'Un espacio para trabajar lo que te pesa'}
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            {hasPatient && !interviewDone
              ? 'Tu registro está listo. Podés continuar con la entrevista inicial cuando quieras.'
              : hasPatient && interviewDone
                ? 'Tu entrevista inicial está completada. Podés iniciar una sesión de trabajo o revisar el reporte.'
                : 'Seguiremos los mismos pasos que haría un terapeuta TCC contigo, adaptados a este formato digital. Es experimental — no es terapia, pero está construido con la misma lógica.'}
          </p>
        </div>

        {/* Banner de paciente activo */}
        {hasPatient && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-left">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Paciente activo</p>
              <p className="text-sm text-slate-200 font-medium">{patientName}</p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">{activePatient?.patientId}</p>
            </div>
            <div className={clsx(
              'w-2 h-2 rounded-full',
              interviewDone ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse',
            )} />
          </div>
        )}

        {/* Pasos del protocolo — visibles antes de empezar */}
        <div className="text-left space-y-2">
          {[
            ['1', 'Motivo de consulta', '¿Qué te trae aquí hoy?'],
            ['2', 'Evaluación', 'Entendemos qué pasa y por qué'],
            ['3', 'Psicoeducación', 'El modelo que usaremos juntos'],
            ['4', 'Objetivos', 'Qué queremos lograr y cómo medirlo'],
            ['5', 'Intervención', 'Las técnicas elegidas para ti'],
            ['6', 'Evaluación del cambio', '¿Cómo estás ahora vs antes?'],
            ['7', 'Seguimiento', 'Mantener lo ganado, prevenir recaídas'],
          ].map(([num, title, desc]) => (
            <div key={num} className="flex gap-3 items-start py-2 border-b border-slate-900">
              <span className="text-xs font-mono text-slate-600 mt-0.5 w-4 shrink-0">{num}</span>
              <div>
                <span className="text-sm text-slate-300 font-medium">{title}</span>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones — árbol de decisión por estado */}
        <div className="space-y-3">
          {!hasPatient && (
            <button
              onClick={handleNewPatient}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 px-6 rounded-xl text-sm font-medium transition-colors"
            >
              Registrarme y comenzar →
            </button>
          )}

          {hasPatient && !interviewDone && (
            <>
              <button
                onClick={handleGoToInterview}
                className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 px-6 rounded-xl text-sm font-medium transition-colors"
              >
                Ir a la entrevista inicial →
              </button>
              <button
                onClick={handleNewPatient}
                className="w-full text-slate-600 hover:text-slate-400 py-2 text-xs transition-colors"
              >
                Soy otra persona — registrarme de nuevo
              </button>
            </>
          )}

          {hasPatient && interviewDone && (
            <>
              {sessionStarted ? (
                <button
                  onClick={handleContinue}
                  className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 px-6 rounded-xl text-sm font-medium transition-colors"
                >
                  Continuar sesión →
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 px-6 rounded-xl text-sm font-medium transition-colors"
                >
                  Iniciar sesión de trabajo →
                </button>
              )}
              <button
                onClick={handleNewPatient}
                className="w-full text-slate-600 hover:text-slate-400 py-2 text-xs transition-colors"
              >
                Soy otra persona — registrarme de nuevo
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-slate-700">
          Todo lo que escribas se guarda solo en este dispositivo.
        </p>

        {/* Módulos Experimentales */}

              

        <div className="mt-8 text-center">
          <h3 className="text-sm text-slate-500 mb-4">Módulos Experimentales</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => navigate('/emotional-chat')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Chat Emocional
            </button>
            <button
              onClick={() => navigate('/emotional-dashboard')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Dashboard Emocional
            </button>
            <button
              onClick={() => navigate('/multimodal-evaluation')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Evaluación Multimodal
            </button>
            <button
              onClick={() => navigate('/primer-encuentro')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Primer Encuentro
            </button>
            <button
              onClick={() => navigate('/interview')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Entrevista
            </button>
            <button
              onClick={() => navigate('/therapist')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Perfil Terapeuta
            </button>
            <button
              onClick={() => navigate('/therapist-screen')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Pantalla Terapeuta
            </button>
            <button
              onClick={() => navigate('/ac')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Activación Conductual
            </button>
            <button
              onClick={() => navigate('/historial')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Historial
            </button>

            <button
              onClick={() => navigate('/therapist/knowledge')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Base de Conocimiento
            </button>

            <button
              onClick={() => navigate('/session/protocol-layout')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Protocolo de Sesión
            </button>

            <button
              onClick={() => navigate('/tabs/InventoryViewerTab ')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Inventario
            </button>

          

            
            <button
              onClick={() => navigate('/PatientRegisterScreen')}
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Registro de Paciente
            </button>

            <button 
              onClick={() => navigate('/PatientDashboard') }
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Dashboard de Paciente
            </button>

            <button onClick={() => navigate('/therapist/PatientDashboardterapisth') }
              className="text-slate-600 hover:text-slate-400 underline transition-colors py-1"
            >
              Dashboard del Terapeuta
            </button>           

      </div>
      </div>
    </div>
    </div>      


  );}       
