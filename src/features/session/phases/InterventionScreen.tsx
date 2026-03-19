/**
 * Fase 5 — Intervención
 *
 * Aquí se invocan los motores reales extraídos de homeflow:
 * TCCEngine recibe el contexto completo del usuario y devuelve
 * las técnicas recomendadas ordenadas por relevancia.
 *
 * NOTA EXPERIMENTAL: En esta versión, la selección de técnica
 * es el punto de partida. La ejecución detallada de cada técnica
 * se añadirá iterativamente en el lab.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../shared/sessionStore';
import {
  selectIntervention,
  getCurrentTimeSlot,
  type InterventionSuggestion,
  TCC_TECHNIQUES_INFO,
} from '../../../services/TCCEngine';
import {
  getV3GuidanceForEngineTechnique,
  type EngineV3Guidance,
} from '../../../services/tccEngineKnowledgeV3Bridge';

// Mapa de técnicas → descripción en lenguaje cercano
const TECHNIQUE_INFO: Record<string, { label: string; desc: string; howTo?: string; evidence?: string }> = {
  cognitive_restructuring: {
    label: 'Cuestionar el pensamiento',
    desc: 'Examinamos el pensamiento automático para ver si es tan cierto y tan absoluto como parece.',
    howTo: 'Identificas el pensamiento → buscas evidencias a favor y en contra → construyes una versión más equilibrada.',
    evidence: 'La técnica con más evidencia en TCC para ansiedad y depresión.',
  },
  gradual_exposure: {
    label: 'Exposición gradual',
    desc: 'Enfrentamos poco a poco lo que evitas. Empezamos por lo más fácil y subimos el nivel.',
    howTo: 'Haces una lista de situaciones difíciles (del 0 al 10) → empiezas por las más bajas → vas subiendo.',
    evidence: 'Tratamiento de primera línea para fobias, ansiedad social y TOC.',
  },
  behavioral_activation: {
    label: 'Activación conductual',
    desc: 'Cuando no tienes ganas de hacer nada, hacer cosas es la medicina — no la consecuencia de sentirse bien.',
    howTo: 'Planificas actividades pequeñas y concretas. La motivación viene después de actuar, no antes.',
    evidence: 'Eficaz para depresión y desmotivación crónica.',
  },
  problem_solving: {
    label: 'Resolución de problemas',
    desc: 'Cuando el problema es real, lo atacamos con un método claro paso a paso.',
    howTo: 'Defines el problema → generas opciones → evalúas pros y contras → eliges y actúas.',
    evidence: 'Eficaz para estrés, situaciones de vida complejas.',
  },
  relaxation: {
    label: 'Técnicas de relajación',
    desc: 'Reducimos la activación fisiológica del sistema nervioso. Útil cuando el cuerpo está en modo alarma.',
    howTo: 'Respiración diafragmática, relajación muscular progresiva, ejercicios de grounding.',
    evidence: 'Complemento eficaz en ansiedad y estrés crónico.',
  },
  self_compassion: {
    label: 'Autocompasión',
    desc: 'Tratarte con la misma amabilidad que le darías a un amigo que está pasando por lo mismo.',
    howTo: 'Reconoces el sufrimiento → lo normalizas (le pasa a todo el mundo) → te hablas con amabilidad.',
    evidence: 'Reduce rumiación, autocrítica destructiva y vergüenza.',
  },
  functional_analysis: {
    label: 'Análisis funcional',
    desc: 'Entender QUÉ FUNCIÓN cumple la conducta problemática — qué estás ganando o evitando con ella.',
    howTo: 'Miras antecedentes → conducta → consecuencias → identificas el reforzador.',
    evidence: 'Base del modelo conductual, esencial para conductas de evitación.',
  },
  thought_defusion: {
    label: 'Defusión cognitiva',
    desc: 'Separarte de tus pensamientos: tenerlos sin que te dominen. "Tengo el pensamiento de que..."',
    howTo: 'Observas el pensamiento como si fuera una hoja que pasa en un río, no como una verdad.',
    evidence: 'Técnica central de ACT (terapia de aceptación y compromiso).',
  },
  micro_tasks: {
    label: 'Micro-tareas',
    desc: 'Cuando todo parece imposible, empezamos por el paso más pequeño imaginable.',
    howTo: 'Divides cualquier acción en pasos tan pequeños que es difícil decir que no.',
    evidence: 'Eficaz para bloqueo, procrastinación y estados de baja energía.',
  },
};

// Selección de técnica basada en emoción y patrones (lógica simplificada del TCCEngine)
function selectTechniques(
  emotionCategory: string | null,
  patterns: string[],
  baselineIntensity: number
): string[] {
  const map: Record<string, string[]> = {
    anxiety: ['cognitive_restructuring', 'gradual_exposure', 'relaxation', 'cognitive_defusion'],
    depression: ['behavioral_activation', 'cognitive_restructuring', 'self_compassion', 'micro_tasks'],
    overwhelm: ['micro_tasks', 'problem_solving', 'relaxation', 'behavioral_activation'],
    anger: ['cognitive_restructuring', 'relaxation', 'functional_analysis', 'problem_solving'],
    guilt: ['cognitive_restructuring', 'self_compassion', 'functional_analysis'],
    shame: ['self_compassion', 'cognitive_restructuring', 'cognitive_defusion'],
    fear: ['gradual_exposure', 'cognitive_restructuring', 'relaxation'],
    grief: ['self_compassion', 'behavioral_activation', 'cognitive_restructuring'],
    numbness: ['behavioral_activation', 'micro_tasks', 'self_compassion'],
  };

  const base = map[emotionCategory ?? ''] ?? ['cognitive_restructuring', 'relaxation'];

  // Si hay muchos patrones cognitivos, sube reestructuración al top
  const hasManyCognitivePatterns = patterns.length >= 2;
  if (hasManyCognitivePatterns && !base[0].includes('cognitive')) {
    return ['cognitive_restructuring', ...base.filter((t) => t !== 'cognitive_restructuring')];
  }

  // Si intensidad muy alta, añade relajación primero
  if (baselineIntensity >= 8 && base[0] !== 'relaxation') {
    return ['relaxation', ...base.filter((t) => t !== 'relaxation')];
  }

  return base;
}

export function InterventionScreen() {
  const {
    userId,
    intake,
    assessment,
    goals,
    interventionObjectiveId,
    clinicalProfile,
    setSelectedTechnique,
    setPhase,
    advancePhase,
  } = useSessionStore();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [engineSuggestion, setEngineSuggestion] = useState<InterventionSuggestion | null>(null);
  const [selectedV3Guidance, setSelectedV3Guidance] = useState<EngineV3Guidance | null>(null);

  useEffect(() => {
    let mounted = true;

    const runEngine = async () => {
      const intensity = intake.intensityNow ?? 5;
      const mood = intensity >= 8 ? 'very_bad' : intensity >= 6 ? 'bad' : intensity >= 4 ? 'neutral' : 'good';
      const energy = intensity >= 8 ? 'very_low' : intensity >= 6 ? 'low' : intensity >= 4 ? 'medium' : 'high';
      const route = intensity >= 8 ? 'overwhelmed' : (assessment.cognitivePatterns?.length ?? 0) > 0 ? 'hardtostart' : 'tengoalgodeenergia';

      try {
        const suggestion = await selectIntervention({
          userId,
          currentMood: mood,
          currentEnergy: energy,
          currentRoute: route,
          timeOfDay: getCurrentTimeSlot(),
          detectedBarriers: assessment.cognitivePatterns ?? [],
          recentThought: assessment.automaticThought ?? '',
          availableMinutes: 10,
          objectiveId: interventionObjectiveId ?? undefined,
          clinicalProfile: clinicalProfile
            ? {
                primaryTechnique: clinicalProfile.primaryTechnique,
                profile: clinicalProfile.profile,
                rationale: clinicalProfile.rationale,
              }
            : undefined,
        } as any);

        if (mounted) {
          setEngineSuggestion(suggestion);
        }
      } catch {
        if (mounted) {
          setEngineSuggestion(null);
        }
      }
    };

    runEngine();

    return () => {
      mounted = false;
    };
  }, [
    userId,
    intake.intensityNow,
    assessment.cognitivePatterns,
    assessment.automaticThought,
    interventionObjectiveId,
    clinicalProfile,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadGuidance = async () => {
      if (!selected) {
        setSelectedV3Guidance(null);
        return;
      }

      const guidance = await getV3GuidanceForEngineTechnique(selected);
      if (mounted) {
        setSelectedV3Guidance(guidance);
      }
    };

    loadGuidance();

    return () => {
      mounted = false;
    };
  }, [selected]);

  const fallbackTechniques = selectTechniques(
    intake.emotionCategory ?? null,
    assessment.cognitivePatterns ?? [],
    intake.intensityNow ?? 5,
  );

  const recommendedTechniques = engineSuggestion
    ? [engineSuggestion.technique, ...engineSuggestion.alternativeTechniques]
    : fallbackTechniques;

  const displayedTechniques = showAll
    ? (Object.keys(TCC_TECHNIQUES_INFO) as string[])
    : recommendedTechniques.slice(0, 4);

  const handleNext = () => {
    if (!selected) return;
    setSelectedTechnique(selected);
    setPhase('evaluation');
    advancePhase();
    navigate('/session/evaluation');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">Técnicas para trabajar</h2>
        <p className="mt-1 text-sm text-slate-400">
          Basándome en lo que me contaste, estas son las técnicas más adecuadas para ti.
          Elige con cuál quieres empezar hoy.
        </p>
      </div>

      {/* Contexto del motor */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Emoción: <strong className="text-slate-300">{intake.emotionCategory}</strong></span>
        <span>Intensidad: <strong className="text-slate-300">{intake.intensityNow}/10</strong></span>
        {assessment.cognitivePatterns && assessment.cognitivePatterns.length > 0 && (
          <span>
            Patrones: <strong className="text-slate-300">{assessment.cognitivePatterns.length} detectados</strong>
          </span>
        )}
        <span>Objetivo: <strong className="text-slate-300">{intake.intensityNow} → {goals.targetIntensity}</strong></span>
        {clinicalProfile && (
          <span>
            Perfil BDI-II: <strong className="text-slate-300">{clinicalProfile.profile}</strong>
            {' → '}<strong className="text-slate-300">{clinicalProfile.primaryTechnique === 'rc' ? 'RC' : 'AC'}</strong>
          </span>
        )}
        {engineSuggestion?.confidence !== undefined && (
          <span>
            Confianza motor: <strong className="text-slate-300">{Math.round(engineSuggestion.confidence * 100)}%</strong>
          </span>
        )}
      </div>

      {engineSuggestion?.validationMessage && (
        <div className="rounded-lg border border-blue-900 bg-blue-950/40 px-4 py-3">
          <p className="text-xs text-blue-200">{engineSuggestion.validationMessage}</p>
          {engineSuggestion.reason && (
            <p className="text-xs text-blue-300/80 mt-1">{engineSuggestion.reason}</p>
          )}
        </div>
      )}

      {/* Técnicas recomendadas */}
      <div className="space-y-3">
        {displayedTechniques.map((id) => {
          const supplementalInfo = TECHNIQUE_INFO[id];
          const engineInfo = TCC_TECHNIQUES_INFO[id as keyof typeof TCC_TECHNIQUES_INFO];
          if (!supplementalInfo && !engineInfo) return null;

          const info = {
            label: supplementalInfo?.label ?? engineInfo?.name ?? id,
            desc: supplementalInfo?.desc ?? engineInfo?.description ?? 'Técnica clínica recomendada por el motor.',
            howTo:
              supplementalInfo?.howTo ??
              'Sigue la guía paso a paso de la técnica y registra cómo cambia tu nivel de malestar.',
            evidence:
              supplementalInfo?.evidence ??
              'Recomendación generada por el motor clínico según barreras, emoción, contexto e historial.',
          };
          const isRecommended = recommendedTechniques.includes(id);

          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={[
                'w-full text-left p-4 rounded-xl border transition-all',
                selected === id
                  ? 'border-blue-500 bg-blue-950'
                  : isRecommended
                    ? 'border-slate-700 bg-slate-900 hover:border-slate-500'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-100">{info.label}</span>
                    {isRecommended && (
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                        recomendada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{info.desc}</p>
                </div>
                <div className={[
                  'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors',
                  selected === id ? 'border-blue-400 bg-blue-400' : 'border-slate-600',
                ].join(' ')} />
              </div>

              {/* Detalle al seleccionar */}
              {selected === id && (
                <div className="mt-3 pt-3 border-t border-blue-900 space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cómo funciona</p>
                    <p className="text-xs text-slate-300">{info.howTo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Evidencia</p>
                    <p className="text-xs text-slate-400">{info.evidence}</p>
                  </div>

                  {selectedV3Guidance?.procedureHints && selectedV3Guidance.procedureHints.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Procedimientos sugeridos (v3)</p>
                      <ul className="space-y-1">
                        {selectedV3Guidance.procedureHints.map((hint) => (
                          <li key={hint.procedureId} className="text-xs text-slate-300">
                            <span className="text-slate-100">{hint.name}</span>: {hint.goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedV3Guidance?.safetyFlags && selectedV3Guidance.safetyFlags.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Banderas de seguridad</p>
                      <p className="text-xs text-amber-300">{selectedV3Guidance.safetyFlags.join(' · ')}</p>
                    </div>
                  )}

                  {selectedV3Guidance?.mappingNote && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nota de mapeo</p>
                      <p className="text-xs text-slate-400">{selectedV3Guidance.mappingNote}</p>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors w-full text-center py-2"
          >
            Ver todas las técnicas disponibles
          </button>
        )}
      </div>

      <button
        disabled={!selected}
        onClick={handleNext}
        className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
      >
        Empezar con esta técnica →
      </button>

      <p className="text-xs text-slate-600 text-center">
        En siguientes sesiones podrás trabajar las demás técnicas recomendadas.
      </p>
    </div>
  );
}
