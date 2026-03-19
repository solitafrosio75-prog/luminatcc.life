/**
 * Fase 7 — Seguimiento y prevención de recaídas
 *
 * Cierre de la sesión + plan de mantenimiento.
 * En TCC real: qué practicar, señales de alerta, cuándo volver.
 *
 * Aquí generamos un resumen de la sesión y un plan de acción
 * concreto para los próximos días.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../shared/sessionStore';
import {
  dispatchFollowUpFlow,
  type FollowUpFlowResult,
  type AssessmentSessionResult,
  type CognitiveAssessmentResult,
  type PsychoeducationSessionResult,
  type PsychoeducationRCResult,
} from '../hooks/sessionFlowDispatcher';
import { buildSessionContext } from '../hooks/buildSessionContext';

const TECHNIQUE_PRACTICE: Record<string, { frequency: string; tip: string; warning: string }> = {
  cognitive_restructuring: {
    frequency: 'Cuando aparezca el pensamiento automático — inmediatamente',
    tip: 'Lleva un pequeño diario. Anotarlo por escrito es mucho más efectivo que hacerlo mentalmente.',
    warning: 'Si el pensamiento vuelve con fuerza después de semanas de mejora, es señal de revisitar esta fase.',
  },
  gradual_exposure: {
    frequency: '2-3 veces por semana. Sin prisa, sin saltar niveles.',
    tip: 'Si un nivel te da más de 7/10, quédate ahí más tiempo antes de subir.',
    warning: 'Si empiezas a evitar los ejercicios de exposición, es la señal más importante de que necesitas apoyo.',
  },
  behavioral_activation: {
    frequency: 'Diario. Al menos una actividad planificada cada día.',
    tip: 'No esperes tener ganas. La activación viene después de actuar, no antes.',
    warning: 'Si llevas más de 3 días sin hacer ninguna actividad, reactiva el plan.',
  },
  problem_solving: {
    frequency: 'Cuando aparezca el problema. No rumiar — abordar.',
    tip: 'Separa el tiempo de pensar del tiempo de actuar.',
    warning: 'Si el mismo problema lleva semanas sin solución, busca perspectiva externa.',
  },
  relaxation: {
    frequency: 'Diario, preferiblemente misma hora. Y cuando notes tensión.',
    tip: 'La relajación se aprende con práctica repetida, no sirve solo en momentos de crisis.',
    warning: 'Si la activación fisiológica es muy intensa o frecuente, considera apoyo profesional.',
  },
  self_compassion: {
    frequency: 'Cada vez que te hables de forma autocrítica destructiva.',
    tip: 'Pregúntate: ¿qué le diría a un amigo que está pasando exactamente lo mismo?',
    warning: 'La autocrítica muy intensa sostenida en el tiempo merece atención profesional.',
  },
  functional_analysis: {
    frequency: 'Cuando repitas una conducta problemática. Antes y después.',
    tip: 'Fíjate especialmente en las consecuencias a corto plazo — son el motor del mantenimiento.',
    warning: 'Si la conducta problemática tiene función de escape del malestar, puede intensificarse sin apoyo.',
  },
  thought_defusion: {
    frequency: 'Varias veces al día. Cada vez que un pensamiento te "enganche".',
    tip: 'Añade "Noto que tengo el pensamiento de que..." delante de cada pensamiento difícil.',
    warning: 'Si los pensamientos se vuelven intrusivos y frecuentes, consulta con un profesional.',
  },
  micro_tasks: {
    frequency: 'Diario. Divide cualquier tarea que bloquee.',
    tip: 'El primer paso tiene que ser tan pequeño que la resistencia se disuelva.',
    warning: 'Si el bloqueo persiste más de dos semanas, puede haber algo más profundo debajo.',
  },
};

export function FollowUpScreen() {
  const store = useSessionStore();
  const { intake, assessment, goals, selectedTechnique, evaluation, clinicalProfile, flowResults, resetSession, setFlowResult } = store;
  const navigate = useNavigate();

  const practice = selectedTechnique ? TECHNIQUE_PRACTICE[selectedTechnique] : null;
  const baseline = intake.intensityNow ?? 5;
  const target = goals.targetIntensity ?? 3;
  const reduction = baseline - target;

  // Resultado del flujo de followup (cargado en useEffect)
  const [flowResult, setLocalFlowResult] = useState<FollowUpFlowResult | null>(null);

  // Ejecutar flujo de followup al montar (read-only, compila resumen + plan)
  useEffect(() => {
    // Resolver trapsIdentified de forma compatible AC/RC
    const assessmentFlow = flowResults.assessment;
    const trapsCount =
      (assessmentFlow as AssessmentSessionResult)?.trapsIdentified?.length
      ?? (assessmentFlow as CognitiveAssessmentResult)?.distortionMatches?.length
      ?? 0;

    const psychoeducationFlow = flowResults.psychoeducation as
      (PsychoeducationSessionResult | PsychoeducationRCResult) | undefined;

    const context = buildSessionContext(store);
    dispatchFollowUpFlow(context, {
      sessionSummary: {
        mainComplaint: intake.mainComplaint ?? 'Sin datos',
        baselineIntensity: baseline,
        currentIntensity: evaluation.currentIntensity ?? baseline,
        selectedTechnique: selectedTechnique?.replace(/_/g, ' ') ?? 'Sin técnica',
        primaryObjective: goals.primaryObjective ?? 'Sin objetivo',
        trapsIdentified: trapsCount,
        comprehensionLevel: psychoeducationFlow?.comprehensionLevel ?? 'unknown',
      },
    }, clinicalProfile, assessment.cognitivePatterns ?? undefined).then((result) => {
      setLocalFlowResult(result);
      setFlowResult('followup', result);
    }).catch(() => {
      // Fallback silencioso
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewSession = () => {
    resetSession();
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">Cierre de sesión</h2>
        <p className="mt-1 text-sm text-slate-400">
          Has completado el protocolo. Aquí está tu plan para los próximos días.
        </p>
      </div>

      {/* Resumen de la sesión */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Resumen de la sesión</p>

        <div className="space-y-3">
          {[
            ['Emoción trabajada', intake.emotionCategory],
            ['Intensidad inicial', `${baseline}/10`],
            ['Pensamiento identificado', assessment.automaticThought ?? '—'],
            ['Técnica seleccionada', selectedTechnique?.replace(/_/g, ' ') ?? '—'],
            ['Objetivo principal', goals.primaryObjective ?? '—'],
            ['Meta de intensidad', `${target}/10 (reducción de ${reduction} puntos)`],
          ].map(([label, value]) => (
            <div key={label as string} className="flex gap-3">
              <span className="text-xs text-slate-500 w-40 shrink-0">{label}</span>
              <span className="text-xs text-slate-300">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan de práctica */}
      {practice && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-200">Plan de práctica para esta semana</h3>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Con qué frecuencia</p>
              <p className="text-sm text-slate-300">{practice.frequency}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Consejo clave</p>
              <p className="text-sm text-slate-300">{practice.tip}</p>
            </div>
          </div>

          <div className="bg-amber-950 border border-amber-900 rounded-lg p-4">
            <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Señal de alerta</p>
            <p className="text-sm text-amber-300">{practice.warning}</p>
          </div>
        </div>
      )}

      {/* Objetivos a corto plazo */}
      {goals.shortTermGoals && goals.shortTermGoals.filter(Boolean).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-200">Tus próximos pasos</h3>
          <div className="space-y-2">
            {goals.shortTermGoals.filter(Boolean).map((goal, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="text-xs font-mono text-slate-600 mt-0.5">{idx + 1}</span>
                <p className="text-sm text-slate-300">{goal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan de práctica del KB (si disponible) */}
      {flowResult?.practicePlan && flowResult.practicePlan.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-200">
            Plan de práctica (protocolo {clinicalProfile?.primaryTechnique === 'rc' ? 'RC' : 'AC'})
          </h3>
          <div className="space-y-2">
            {flowResult.practicePlan.map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <p className="text-sm text-slate-200 font-medium">{item.ejercicio}</p>
                <p className="text-xs text-slate-400 mt-1">{item.objetivo}</p>
                <p className="text-xs text-slate-500 mt-1">{item.frecuencia}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recordatorio de recursos — enriquecido con KB */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <p className="text-xs text-slate-500 mb-2">Importante</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Este laboratorio es experimental y no reemplaza la terapia profesional.
          Si el malestar es intenso, persistente, o incluye pensamientos de hacerte daño,
          contacta con un profesional de salud mental.
        </p>
        {flowResult?.emergencyResources && flowResult.emergencyResources.length > 0 ? (
          <div className="mt-2 space-y-1">
            {flowResult.emergencyResources.map((r, idx) => (
              <p key={idx} className="text-xs text-slate-600">
                {r.recurso}: <span className="text-slate-400 font-medium">{r.contacto}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 mt-2">
            España: Teléfono de la Esperanza 717 003 717 · emergencias 112
          </p>
        )}
      </div>

      {/* Acciones finales */}
      <div className="space-y-3 pb-8">
        <button
          onClick={handleNewSession}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
        >
          Empezar nueva sesión
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full text-slate-500 hover:text-slate-300 py-2 text-sm transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
