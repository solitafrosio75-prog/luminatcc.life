/**
 * Fase 3 — Psicoeducación
 *
 * Explicamos el modelo TCC al usuario usando SU PROPIO ejemplo.
 * No es una lección genérica — es: "mira, lo que tú describes
 * funciona exactamente así según la TCC".
 *
 * El terapeuta real haría un diagrama en papel.
 * Aquí lo construimos visualmente con sus datos.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../shared/sessionStore';
import { dispatchPsychoeducationFlow } from '../hooks/sessionFlowDispatcher';
import { buildSessionContext } from '../hooks/buildSessionContext';

export function PsychoeducationScreen() {
  const store = useSessionStore();
  const { intake, assessment, clinicalProfile, setPsychoeducation, setPhase, advancePhase, setFlowResult } = store;
  const navigate = useNavigate();

  const [modelExplained, setModelExplained] = useState(false);
  const [connectionMade, setConnectionMade] = useState<boolean | null>(null);
  const [patientReaction, setPatientReaction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = async () => {
    setPsychoeducation({ modelExplained: true, connectionMade: connectionMade ?? false, patientReaction });

    // Ejecutar flujo clínico (AC o RC según perfil clínico)
    setIsProcessing(true);
    try {
      const context = buildSessionContext(store);
      const result = await dispatchPsychoeducationFlow(context, {
        modelExplained: true,
        connectionMade: connectionMade ?? false,
        patientReaction,
        abcData: assessment.situationContext ? {
          antecedent: assessment.situationContext ?? '',
          behavior: assessment.behavioralResponse ?? '',
          consequence: assessment.consequences ?? '',
        } : undefined,
      }, clinicalProfile);
      setFlowResult('psychoeducation', result);
    } catch {
      // No bloquear navegación si el flujo falla
    } finally {
      setIsProcessing(false);
    }

    setPhase('goals');
    advancePhase();
    navigate('/session/goals');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">El modelo que vamos a usar</h2>
        <p className="mt-1 text-sm text-slate-400">
          Antes de hacer nada, quiero que entiendas cómo funciona lo que te pasa.
          Con ese mapa, todo lo demás tiene sentido.
        </p>
      </div>

      {/* El modelo ABC con los datos del usuario */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
          Tu situación en el modelo A→B→C
        </p>

        {/* A */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-mono shrink-0 mt-0.5">
            A
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Situación (lo que pasó fuera)</p>
            <p className="text-sm text-slate-300">
              {assessment.situationContext || '—'}
            </p>
          </div>
        </div>

        {/* Flecha */}
        <div className="ml-4 text-slate-700 text-lg">↓</div>

        {/* B — Pensamiento */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 text-sm font-mono shrink-0 mt-0.5">
            B
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Pensamiento automático (lo que pasó dentro)</p>
            <p className="text-sm text-blue-200 italic">
              "{assessment.automaticThought || '—'}"
            </p>
            {assessment.cognitivePatterns && assessment.cognitivePatterns.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {assessment.cognitivePatterns.map((p) => (
                  <span key={p} className="text-xs bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full border border-amber-900">
                    {p.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flecha */}
        <div className="ml-4 text-slate-700 text-lg">↓</div>

        {/* C — Emoción + Conducta */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-mono shrink-0 mt-0.5">
            C
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Emoción + Conducta (lo que sentiste y hiciste)</p>
            <p className="text-sm text-slate-300">
              {intake.emotionCategory} · intensidad {intake.intensityNow}/10
            </p>
            {assessment.behavioralResponse && (
              <p className="text-sm text-slate-400 mt-1">{assessment.behavioralResponse}</p>
            )}
          </div>
        </div>
      </div>

      {/* Explicación del modelo */}
      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-slate-100">La clave del modelo TCC</strong> es que{' '}
            <em className="text-blue-300">no es la situación lo que te hace sentir mal</em>,
            sino el <strong className="text-blue-200">pensamiento automático</strong> que
            aparece entre la situación y tu reacción.
          </p>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Eso tiene una implicación enorme: si el pensamiento puede cambiar,
            la emoción y la conducta también pueden cambiar.
            No estás atrapado en el paso C.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            El trabajo que vamos a hacer juntos va a ir dirigido al paso B.
            Vamos a aprender a identificar esos pensamientos cuando aparecen,
            cuestionarlos, y construir alternativas más equilibradas y realistas.
          </p>
        </div>
      </div>

      {/* Conexión personal */}
      <div className="space-y-3">
        <label className="text-sm text-slate-300 font-medium">
          ¿Tiene sentido para ti este modelo mirando tu propia situación?
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setConnectionMade(true)}
            className={[
              'flex-1 py-2.5 rounded-lg border text-sm transition-colors',
              connectionMade === true
                ? 'border-emerald-600 bg-emerald-950 text-emerald-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600',
            ].join(' ')}
          >
            Sí, lo veo claro
          </button>
          <button
            onClick={() => setConnectionMade(false)}
            className={[
              'flex-1 py-2.5 rounded-lg border text-sm transition-colors',
              connectionMade === false
                ? 'border-amber-600 bg-amber-950 text-amber-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600',
            ].join(' ')}
          >
            Más o menos / tengo dudas
          </button>
        </div>
      </div>

      {/* Reacción libre */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">
          ¿Qué te parece esta forma de verlo? ¿Algo que no encaje? (opcional)
        </label>
        <textarea
          value={patientReaction}
          onChange={(e) => setPatientReaction(e.target.value)}
          placeholder="Cualquier cosa que quieras decir sobre el modelo..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
      >
        Continuar a los objetivos →
      </button>
    </div>
  );
}
