/**
 * Fase 2 — Evaluación psicológica
 *
 * Equivalente al análisis funcional ABC clásico:
 * Antecedente → Comportamiento → Consecuencia
 * + pensamiento automático + patrones cognitivos detectados
 *
 * El motor DeepFunctionalAnalysis y TCCEngine están disponibles
 * aquí para enriquecer el análisis una vez el usuario escribe.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../shared/sessionStore';
import { dispatchAssessmentFlow } from '../hooks/sessionFlowDispatcher';
import { buildSessionContext } from '../hooks/buildSessionContext';

const COGNITIVE_PATTERNS = [
  { id: 'all_or_nothing',    label: 'Todo o nada',          desc: '"Si no es perfecto, no vale"' },
  { id: 'catastrophizing',   label: 'Catastrofización',     desc: '"Va a salir todo muy mal"' },
  { id: 'mind_reading',      label: 'Lectura de mente',     desc: '"Sé lo que están pensando de mí"' },
  { id: 'personalization',   label: 'Personalización',      desc: '"Es culpa mía"' },
  { id: 'overgeneralization', label: 'Sobregeneralización', desc: '"Siempre me pasa lo mismo"' },
  { id: 'should_statements', label: 'Reglas rígidas',       desc: '"Debería poder con esto"' },
  { id: 'emotional_reasoning', label: 'Razonamiento emocional', desc: '"Me siento mal, por tanto algo está mal"' },
  { id: 'magnification',     label: 'Magnificación',        desc: 'Exagero los errores, minimizo los logros' },
];

export function AssessmentScreen() {
  const store = useSessionStore();
  const { intake, assessment, clinicalProfile, setAssessment, setPhase, advancePhase, setFlowResult } = store;
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [situationContext, setSituationContext] = useState(assessment.situationContext ?? '');
  const [automaticThought, setAutomaticThought] = useState(assessment.automaticThought ?? '');
  const [behavioralResponse, setBehavioralResponse] = useState(assessment.behavioralResponse ?? '');
  const [consequences, setConsequences] = useState(assessment.consequences ?? '');
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(
    assessment.cognitivePatterns ?? []
  );
  const [functionalImpact, setFunctionalImpact] = useState(assessment.functionalImpact ?? '');

  const togglePattern = (id: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const canAdvance = automaticThought.trim().length > 5 && situationContext.trim().length > 5;

  const handleNext = async () => {
    const assessmentData = {
      situationContext,
      automaticThought,
      behavioralResponse,
      consequences,
      cognitivePatterns: selectedPatterns,
      avoidanceBehaviors: [] as string[],
      functionalImpact,
      baselineIntensity: intake.intensityNow ?? 5,
    };

    setAssessment(assessmentData);

    // Ejecutar flujo clínico (AC o RC según perfil clínico)
    setIsProcessing(true);
    try {
      const context = buildSessionContext(store);
      const result = await dispatchAssessmentFlow(context, {
        ...assessmentData,
        emotionCategory: intake.emotionCategory ?? undefined,
      }, clinicalProfile);
      setFlowResult('assessment', result);
    } catch {
      // El flujo falla silenciosamente — no bloquea la navegación
    } finally {
      setIsProcessing(false);
    }

    setPhase('psychoeducation');
    advancePhase();
    navigate('/session/psychoeducation');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">Entendamos qué está pasando</h2>
        <p className="mt-1 text-sm text-slate-400">
          Vamos a mirar la situación más de cerca: qué ocurre, qué piensas, y qué haces.
        </p>
      </div>

      {/* Referencia del motivo */}
      {intake.mainComplaint && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
          <p className="text-xs text-slate-500 mb-1">Lo que me contaste:</p>
          <p className="text-sm text-slate-300 italic">"{intake.mainComplaint}"</p>
        </div>
      )}

      {/* A — Situación/Antecedente */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          A · La situación
        </label>
        <p className="text-xs text-slate-500">
          ¿Dónde estabas? ¿Qué estaba pasando cuando empezaste a sentirte así?
        </p>
        <textarea
          value={situationContext}
          onChange={(e) => setSituationContext(e.target.value)}
          placeholder="Describe la situación concreta..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* B — Pensamiento automático */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          B · El primer pensamiento
        </label>
        <p className="text-xs text-slate-500">
          ¿Qué fue lo primero que te pasó por la cabeza en ese momento?
          No tiene que ser lógico — solo el pensamiento que apareció.
        </p>
        <textarea
          value={automaticThought}
          onChange={(e) => setAutomaticThought(e.target.value)}
          placeholder="El pensamiento tal como llegó..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Patrones cognitivos */}
      <div className="space-y-3">
        <label className="text-sm text-slate-300 font-medium">
          ¿Reconoces alguno de estos patrones en ese pensamiento?
        </label>
        <p className="text-xs text-slate-500">Puedes seleccionar varios, o ninguno.</p>
        <div className="grid grid-cols-1 gap-2">
          {COGNITIVE_PATTERNS.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePattern(p.id)}
              className={[
                'text-left px-4 py-2.5 rounded-lg border transition-colors',
                selectedPatterns.includes(p.id)
                  ? 'border-amber-600 bg-amber-950 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600',
              ].join(' ')}
            >
              <span className="text-sm font-medium">{p.label}</span>
              <span className="text-xs text-slate-500 ml-2">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* C — Conducta */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          C · Lo que hiciste (o evitaste hacer)
        </label>
        <p className="text-xs text-slate-500">
          ¿Cómo reaccionaste? ¿Qué hiciste, dejaste de hacer, o evitaste?
        </p>
        <textarea
          value={behavioralResponse}
          onChange={(e) => setBehavioralResponse(e.target.value)}
          placeholder="Mi reacción fue..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Consecuencias */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          ¿Qué pasó después? ¿Cómo te quedaste?
        </label>
        <textarea
          value={consequences}
          onChange={(e) => setConsequences(e.target.value)}
          placeholder="Las consecuencias a corto y medio plazo..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Impacto funcional */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300 font-medium">
          ¿Cómo está afectando esto a tu vida diaria? (opcional)
        </label>
        <textarea
          value={functionalImpact}
          onChange={(e) => setFunctionalImpact(e.target.value)}
          placeholder="En el trabajo, relaciones, rutina, descanso..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <button
        disabled={!canAdvance || isProcessing}
        onClick={handleNext}
        className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
      >
        {isProcessing ? 'Procesando evaluación...' : 'Continuar a la psicoeducación →'}
      </button>
    </div>
  );
}
