/**
 * Fase 1 — Motivo de consulta
 *
 * Equivalente a la primera sesión TCC:
 * "¿Qué te trae aquí hoy? ¿Desde cuándo? ¿Cómo te sientes ahora mismo?"
 *
 * No usamos jerga clínica. Registro abierto + categorización de emoción.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore, type EmotionCategory } from '../../../shared/sessionStore';

const EMOTION_OPTIONS: { id: EmotionCategory; label: string; desc: string }[] = [
  { id: 'anxiety',    label: 'Ansiedad / nerviosismo',   desc: 'Preocupación, tensión, miedo a algo' },
  { id: 'depression', label: 'Tristeza / desmotivación', desc: 'Bajón, falta de ganas, vacío' },
  { id: 'overwhelm',  label: 'Saturación / agobio',      desc: 'Demasiado, no puedo con todo' },
  { id: 'anger',      label: 'Rabia / irritabilidad',    desc: 'Frustración, injusticia, explosiones' },
  { id: 'guilt',      label: 'Culpa',                    desc: 'Sentir que hice algo mal o no fui suficiente' },
  { id: 'shame',      label: 'Vergüenza',                desc: 'Me juzgo, no quiero que me vean así' },
  { id: 'fear',       label: 'Miedo concreto',           desc: 'A algo específico que me paraliza' },
  { id: 'grief',      label: 'Duelo / pérdida',          desc: 'Algo o alguien que ya no está' },
  { id: 'numbness',   label: 'No siento nada',           desc: 'Vacío, desconexión, como apagado' },
];

export function IntakeScreen() {
  const { intake, setIntake, setPhase, advancePhase } = useSessionStore();
  const navigate = useNavigate();

  const [mainComplaint, setMainComplaint] = useState(intake.mainComplaint ?? '');
  const [sinceWhen, setSinceWhen] = useState(intake.sinceWhen ?? '');
  const [emotionCategory, setEmotionCategory] = useState<EmotionCategory | null>(
    intake.emotionCategory ?? null
  );
  const [intensityNow, setIntensityNow] = useState(intake.intensityNow ?? 5);
  const [triggeredBy, setTriggeredBy] = useState(intake.triggeredBy ?? '');

  const canAdvance = mainComplaint.trim().length > 10 && emotionCategory !== null;

  const handleNext = () => {
    setIntake({ mainComplaint, sinceWhen, emotionCategory, intensityNow, triggeredBy });
    setPhase('assessment');
    advancePhase();
    navigate('/session/assessment');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-slate-100">¿Qué te trae aquí hoy?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Cuéntame con tus palabras. No hay respuestas correctas ni incorrectas.
        </p>
      </div>

      {/* Motivo principal */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Cuéntame qué está pasando</label>
        <textarea
          value={mainComplaint}
          onChange={(e) => setMainComplaint(e.target.value)}
          placeholder="Puedes escribir tanto o tan poco como quieras..."
          rows={4}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Tiempo */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">¿Desde cuándo te sientes así? (opcional)</label>
        <input
          type="text"
          value={sinceWhen}
          onChange={(e) => setSinceWhen(e.target.value)}
          placeholder="Ej: hace un mes, desde el verano pasado, varios años..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Categoría emocional */}
      <div className="space-y-3">
        <label className="text-sm text-slate-300">¿Qué emoción se acerca más a lo que sientes?</label>
        <div className="grid grid-cols-1 gap-2">
          {EMOTION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setEmotionCategory(opt.id)}
              className={[
                'text-left px-4 py-3 rounded-lg border transition-colors',
                emotionCategory === opt.id
                  ? 'border-blue-500 bg-blue-950 text-blue-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600',
              ].join(' ')}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Intensidad actual */}
      <div className="space-y-3">
        <label htmlFor="intensityNow" className="text-sm text-slate-300">
          ¿Cómo de intenso lo sientes ahora mismo? ({intensityNow}/10)
        </label>
        <input
          id="intensityNow"
          type="range"
          min={0}
          max={10}
          value={intensityNow}
          onChange={(e) => setIntensityNow(Number(e.target.value))}
          className="w-full accent-blue-500"
          title="Intensidad ahora mismo"
        />
        <div className="flex justify-between text-xs text-slate-600">
          <span>0 — Nada</span>
          <span>10 — Lo peor que he sentido</span>
        </div>
      </div>

      {/* Desencadenante */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">
          ¿Hay algo concreto que lo disparó o empeoró? (opcional)
        </label>
        <input
          type="text"
          value={triggeredBy}
          onChange={(e) => setTriggeredBy(e.target.value)}
          placeholder="Una situación, conversación, momento..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Avanzar */}
      <button
        disabled={!canAdvance}
        onClick={handleNext}
        className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
      >
        Continuar a la evaluación →
      </button>

      {!canAdvance && (
        <p className="text-xs text-slate-600 text-center">
          Necesito que me cuentes algo y selecciones una emoción para continuar.
        </p>
      )}
    </div>
  );
}
