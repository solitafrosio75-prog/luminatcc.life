/**
 * Fase 4 — Establecimiento de objetivos
 *
 * En TCC real, terapeuta y paciente negocian objetivos SMART.
 * Aquí guiamos al usuario para formular objetivos medibles
 * y registramos el baseline numérico que usaremos en evaluación.
 *
 * El TCCEngine recibirá estos objetivos para seleccionar técnicas.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../shared/sessionStore';
import { dispatchGoalsFlow } from '../hooks/sessionFlowDispatcher';
import { buildSessionContext } from '../hooks/buildSessionContext';

export function GoalsScreen() {
  const store = useSessionStore();
  const { intake, assessment, clinicalProfile, goals, setGoals, setPhase, advancePhase, setFlowResult } = store;
  const navigate = useNavigate();

  const [primaryObjective, setPrimaryObjective] = useState(goals.primaryObjective ?? '');
  const [shortTermGoals, setShortTermGoals] = useState<string[]>(
    goals.shortTermGoals?.length ? goals.shortTermGoals : ['', '']
  );
  const [measurableIndicator, setMeasurableIndicator] = useState(
    goals.measurableIndicator ?? ''
  );
  const [targetIntensity, setTargetIntensity] = useState(goals.targetIntensity ?? 3);

  const baselineIntensity = intake.intensityNow ?? assessment.baselineIntensity ?? 5;

  const updateShortTerm = (idx: number, val: string) => {
    const updated = [...shortTermGoals];
    updated[idx] = val;
    setShortTermGoals(updated);
  };

  const addShortTerm = () => {
    if (shortTermGoals.length < 4) setShortTermGoals([...shortTermGoals, '']);
  };

  const canAdvance = primaryObjective.trim().length > 10 && measurableIndicator.trim().length > 5;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = async () => {
    const goalsData = {
      primaryObjective,
      shortTermGoals: shortTermGoals.filter((g) => g.trim().length > 0),
      measurableIndicator,
      startIntensity: baselineIntensity,
      targetIntensity,
    };

    setGoals(goalsData);

    // Ejecutar flujo clínico (AC o RC según perfil clínico)
    setIsProcessing(true);
    try {
      const context = buildSessionContext(store);
      const result = await dispatchGoalsFlow(
        context, goalsData, clinicalProfile, assessment.cognitivePatterns ?? undefined,
      );
      setFlowResult('goals', result);
    } catch {
      // No bloquear navegación
    } finally {
      setIsProcessing(false);
    }

    setPhase('intervention');
    advancePhase();
    navigate('/session/intervention');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">¿Hacia dónde queremos ir?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Vamos a definir juntos qué queremos lograr y cómo sabremos que lo logramos.
        </p>
      </div>

      {/* Objetivo principal */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">Objetivo principal</label>
        <p className="text-xs text-slate-500">
          Que sea concreto y alcanzable. No "sentirme bien" sino
          "poder ir al trabajo sin que la ansiedad me paralice".
        </p>
        <textarea
          value={primaryObjective}
          onChange={(e) => setPrimaryObjective(e.target.value)}
          placeholder="Mi objetivo principal es..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Objetivos intermedios */}
      <div className="space-y-3">
        <label className="text-sm text-slate-300 font-medium">
          Pasos intermedios (próximas 2-4 semanas)
        </label>
        <p className="text-xs text-slate-500">
          Pequeños objetivos que nos llevan al principal.
        </p>
        {shortTermGoals.map((goal, idx) => (
          <input
            key={idx}
            type="text"
            value={goal}
            onChange={(e) => updateShortTerm(idx, e.target.value)}
            placeholder={`Paso ${idx + 1}...`}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        ))}
        {shortTermGoals.length < 4 && (
          <button
            onClick={addShortTerm}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            + Añadir otro paso
          </button>
        )}
      </div>

      {/* Indicador de éxito */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          ¿Cómo sabremos que estás mejorando?
        </label>
        <p className="text-xs text-slate-500">
          Algo observable. "Seré capaz de...", "Podré hacer... sin que...", "Cuando ocurra X, yo..."
        </p>
        <textarea
          value={measurableIndicator}
          onChange={(e) => setMeasurableIndicator(e.target.value)}
          placeholder="Sabremos que estoy mejorando cuando..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Baseline vs meta */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Línea base → Meta</p>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-light text-red-400">{baselineIntensity}</p>
            <p className="text-xs text-slate-500 mt-1">Ahora</p>
          </div>
          <div className="flex-1 text-slate-700 text-center text-xl">→</div>
          <div className="text-center flex-1">
            <p className="text-3xl font-light text-emerald-400">{targetIntensity}</p>
            <p className="text-xs text-slate-500 mt-1">Meta</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="target-intensity" className="text-xs text-slate-400">
            ¿A qué nivel de intensidad querrías llegar? ({targetIntensity}/10)
          </label>
          <input
            id="target-intensity"
            type="range"
            min={0}
            max={Math.max(baselineIntensity - 1, 1)}
            value={targetIntensity}
            onChange={(e) => setTargetIntensity(Number(e.target.value))}
            title="Target intensity level"
            className="w-full accent-emerald-500"
          />
          <p className="text-xs text-slate-600">
            Una reducción de {baselineIntensity - targetIntensity} puntos es un objetivo realista.
          </p>
        </div>
      </div>

      <button
        disabled={!canAdvance || isProcessing}
        onClick={handleNext}
        className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
      >
        {isProcessing ? 'Validando objetivos...' : 'Elegir técnicas de intervención →'}
      </button>
    </div>
  );
}
