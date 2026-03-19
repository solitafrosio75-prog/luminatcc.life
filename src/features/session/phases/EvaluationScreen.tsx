/**
 * Fase 6 — Evaluación del cambio
 *
 * Registro post-intervención. Compara baseline con estado actual.
 * El ChangeEvaluator del sistema sequence puede calcular
 * significancia estadística (RCI, Cohen's d) aquí.
 *
 * En esta versión experimental: captura el estado post,
 * muestra la diferencia, y pregunta qué observó el usuario.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../shared/sessionStore';
import { dispatchEvaluationFlow } from '../hooks/sessionFlowDispatcher';
import { buildSessionContext } from '../hooks/buildSessionContext';

function getMoodLabel(intensity: number): string {
  if (intensity <= 2) return 'Mucho mejor';
  if (intensity <= 4) return 'Bastante mejor';
  if (intensity <= 6) return 'Algo mejor';
  if (intensity <= 7) return 'Igual que antes';
  return 'Todavía intenso';
}

function getChangeLabel(baseline: number, current: number): { text: string; color: string } {
  const diff = baseline - current;
  if (diff >= 4) return { text: 'Cambio muy significativo', color: 'text-emerald-400' };
  if (diff >= 2) return { text: 'Cambio notable', color: 'text-emerald-300' };
  if (diff >= 1) return { text: 'Cambio leve', color: 'text-amber-300' };
  if (diff === 0) return { text: 'Sin cambio observable', color: 'text-slate-400' };
  return { text: 'Mayor activación (normal en exposición)', color: 'text-orange-400' };
}

export function EvaluationScreen() {
  const store = useSessionStore();
  const { intake, goals, selectedTechnique, clinicalProfile, setPhase, advancePhase, setEvaluation, setFlowResult } = store;
  const navigate = useNavigate();

  const baseline = intake.intensityNow ?? 5;
  const [currentIntensity, setCurrentIntensity] = useState(Math.max(baseline - 1, 0));
  const [whatChanged, setWhatChanged] = useState('');
  const [obstaclesFound, setObstaclesFound] = useState('');
  const [wantsToRepeat, setWantsToRepeat] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const change = getChangeLabel(baseline, currentIntensity);

  const handleNext = async () => {
    // Persistir datos de evaluación en el store
    const evalData = { currentIntensity, whatChanged, obstaclesFound, wantsToRepeat };
    setEvaluation(evalData);

    // Ejecutar flujo clínico (AC o RC según perfil clínico)
    setIsProcessing(true);
    try {
      const context = buildSessionContext(store);
      const result = await dispatchEvaluationFlow(context, {
        baselineIntensity: baseline,
        currentIntensity,
        whatChanged,
        obstaclesFound,
        wantsToRepeat,
        selectedTechnique: selectedTechnique ?? 'sin_tecnica',
      }, clinicalProfile);
      setFlowResult('evaluation', result);
    } catch {
      // No bloquear navegación
    } finally {
      setIsProcessing(false);
    }

    setPhase('followup');
    advancePhase();
    navigate('/session/followup');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">¿Cómo estás ahora?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Vamos a comparar cómo llegaste con cómo estás después de trabajar con{' '}
          <em className="text-blue-300">{selectedTechnique?.replace(/_/g, ' ')}</em>.
        </p>
      </div>

      {/* Comparativa baseline → actual */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-6 mb-5">
          <div className="text-center">
            <p className="text-4xl font-light text-slate-500">{baseline}</p>
            <p className="text-xs text-slate-600 mt-1">Al empezar</p>
          </div>
          <div className="flex-1 text-center">
            <p className={`text-sm font-medium ${change.color}`}>{change.text}</p>
            <p className="text-xs text-slate-600 mt-1">
              {baseline > currentIntensity
                ? `↓ ${baseline - currentIntensity} puntos`
                : baseline === currentIntensity
                  ? '— igual'
                  : `↑ ${currentIntensity - baseline} puntos`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-emerald-400">{currentIntensity}</p>
            <p className="text-xs text-slate-600 mt-1">Ahora</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">
            ¿Cómo de intenso lo sientes ahora? ({currentIntensity}/10)
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={currentIntensity}
            onChange={(e) => setCurrentIntensity(Number(e.target.value))}
            className="w-full accent-emerald-500"
            title="Ajusta la intensidad actual de 0 a 10"
          />
          <div className="flex justify-between text-xs text-slate-600">
            <span>0 — Nada</span>
            <span>{getMoodLabel(currentIntensity)}</span>
            <span>10 — Lo peor</span>
          </div>
        </div>
      </div>

      {/* Meta comparativa */}
      {goals.targetIntensity !== undefined && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
          <p className="text-xs text-slate-500 mb-2">Progreso hacia tu objetivo</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-800 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0,
                    ((baseline - currentIntensity) / (baseline - goals.targetIntensity)) * 100
                  ))}%`
                }}
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              Meta: {goals.targetIntensity}/10
            </span>
          </div>
        </div>
      )}

      {/* Qué observó */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          ¿Qué notaste durante o después de la técnica?
        </label>
        <textarea
          value={whatChanged}
          onChange={(e) => setWhatChanged(e.target.value)}
          placeholder="Cualquier cosa: pensamientos, sensaciones corporales, emociones..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Obstáculos */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">
          ¿Hubo algo que dificultó el proceso? (opcional)
        </label>
        <textarea
          value={obstaclesFound}
          onChange={(e) => setObstaclesFound(e.target.value)}
          placeholder="Distracciones, resistencia interna, no me salía..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* ¿Repetiría? */}
      <div className="space-y-3">
        <label className="text-sm text-slate-300 font-medium">
          ¿Querrías volver a usar esta técnica?
        </label>
        <div className="flex gap-3">
          {[
            { val: true, label: 'Sí, la usaría de nuevo' },
            { val: false, label: 'Prefiero probar otra cosa' },
          ].map((opt) => (
            <button
              key={String(opt.val)}
              onClick={() => setWantsToRepeat(opt.val)}
              className={[
                'flex-1 py-2.5 rounded-lg border text-sm transition-colors',
                wantsToRepeat === opt.val
                  ? 'border-blue-500 bg-blue-950 text-blue-200'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={isProcessing}
        onClick={handleNext}
        className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
      >
        {isProcessing ? 'Evaluando progreso...' : 'Ver el plan de seguimiento →'}
      </button>
    </div>
  );
}
