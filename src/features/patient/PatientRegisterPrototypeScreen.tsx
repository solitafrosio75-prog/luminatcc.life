import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

type Occupation =
  | 'estudiante'
  | 'empleado'
  | 'desempleado'
  | 'autonomo'
  | 'hogar'
  | 'otro';

type InterferenceArea =
  | 'familia'
  | 'trabajo_estudio'
  | 'social'
  | 'salud_autocuidado'
  | 'ocio';

type SymptomGroup = 'cognitive' | 'physiological' | 'behavioral';

type PrototypeState = {
  preferredName: string;
  age: string;
  occupation: Occupation | null;
  firstTherapy: boolean | null;
  mainConcern: string;
  affectedAreas: InterferenceArea[];
  symptomSelections: Record<SymptomGroup, string[]>;
  distressToday: number;
  mainGoal: string;
};

const STEPS = [
  { id: 'identity', label: 'Sobre vos', kicker: 'Paso 1' },
  { id: 'interference', label: 'Impacto hoy', kicker: 'Paso 2' },
  { id: 'symptoms', label: 'Lo que notas', kicker: 'Paso 3' },
  { id: 'baseline', label: 'Punto de partida', kicker: 'Paso 4' },
] as const;

const OCCUPATIONS: { key: Occupation; label: string }[] = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'empleado', label: 'Empleado/a' },
  { key: 'autonomo', label: 'Autonomo/a' },
  { key: 'desempleado', label: 'Desempleado/a' },
  { key: 'hogar', label: 'Tareas del hogar' },
  { key: 'otro', label: 'Otra situacion' },
];

const INTERFERENCE_AREAS: { key: InterferenceArea; label: string; hint: string }[] = [
  { key: 'familia', label: 'Relaciones familiares', hint: 'Conflictos, distancia, sobrecarga o tension en casa.' },
  { key: 'trabajo_estudio', label: 'Trabajo / estudios', hint: 'Rendimiento, concentracion, asistencia o exigencia.' },
  { key: 'social', label: 'Vida social', hint: 'Aislamiento, incomodidad o menor contacto con otros.' },
  { key: 'salud_autocuidado', label: 'Salud / autocuidado', hint: 'Sueno, energia, alimentacion o rutina de cuidado.' },
  { key: 'ocio', label: 'Ocio y tiempo libre', hint: 'Menos disfrute, motivacion o interes por actividades.' },
];

const SYMPTOM_OPTIONS: Record<SymptomGroup, { label: string; items: string[] }> = {
  cognitive: {
    label: 'Cognitivo',
    items: ['Pensamientos recurrentes', 'Dificultad para concentrarme', 'Autocritica', 'Preocupacion constante'],
  },
  physiological: {
    label: 'Fisico',
    items: ['Tension muscular', 'Cambios en el sueno', 'Opresion en el pecho', 'Cansancio o agotamiento'],
  },
  behavioral: {
    label: 'Conductual',
    items: ['Evito lugares o situaciones', 'Deje actividades', 'Me aisle mas', 'Me cuesta arrancar'],
  },
};

const INITIAL_STATE: PrototypeState = {
  preferredName: '',
  age: '',
  occupation: null,
  firstTherapy: null,
  mainConcern: '',
  affectedAreas: [],
  symptomSelections: {
    cognitive: [],
    physiological: [],
    behavioral: [],
  },
  distressToday: 5,
  mainGoal: '',
};

function InputShell({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {required && <span className="text-emerald-700">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function SurfaceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-2xl border px-4 py-3 text-left text-sm transition-all',
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-[0_16px_40px_rgba(15,118,110,0.12)]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

function PrototypePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-2 text-sm transition-colors',
        active
          ? 'border-teal-700 bg-teal-900 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
      )}
    >
      {children}
    </button>
  );
}

function getTechniqueSeed(state: PrototypeState) {
  const cognitiveCount = state.symptomSelections.cognitive.length;
  const physiologicalCount = state.symptomSelections.physiological.length;
  const behavioralCount = state.symptomSelections.behavioral.length;

  if (behavioralCount >= cognitiveCount && behavioralCount >= physiologicalCount) {
    return 'ac';
  }
  if (cognitiveCount >= behavioralCount && cognitiveCount >= physiologicalCount) {
    return 'rc';
  }
  return 'exposicion';
}

function getDistressLabel(value: number) {
  if (value <= 3) return 'Leve';
  if (value <= 6) return 'Moderado';
  if (value <= 8) return 'Alto';
  return 'Muy alto';
}

export function PatientRegisterPrototypeScreen() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<PrototypeState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const selectedSymptomsCount = Object.values(form.symptomSelections).reduce((sum, list) => sum + list.length, 0);
  const techniqueSeed = getTechniqueSeed(form);

  function setField<K extends keyof PrototypeState>(key: K, value: PrototypeState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArea(area: InterferenceArea) {
    setForm((prev) => ({
      ...prev,
      affectedAreas: prev.affectedAreas.includes(area)
        ? prev.affectedAreas.filter((item) => item !== area)
        : [...prev.affectedAreas, area],
    }));
  }

  function toggleSymptom(group: SymptomGroup, item: string) {
    setForm((prev) => {
      const current = prev.symptomSelections[group];
      const next = current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item];

      return {
        ...prev,
        symptomSelections: {
          ...prev.symptomSelections,
          [group]: next,
        },
      };
    });
  }

  function validateCurrentStep() {
    const nextErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!form.preferredName.trim()) nextErrors.preferredName = 'Decinos como queres que te llamemos.';
      if (!form.age.trim()) {
        nextErrors.age = 'La edad ayuda a contextualizar la entrevista.';
      } else {
        const parsedAge = Number(form.age);
        if (!Number.isInteger(parsedAge) || parsedAge < 12 || parsedAge > 110) {
          nextErrors.age = 'Ingresa una edad valida.';
        }
      }
      if (form.firstTherapy === null) nextErrors.firstTherapy = 'Necesitamos saber si ya tuviste terapia antes.';
      if (form.mainConcern.trim().length < 20) {
        nextErrors.mainConcern = 'Contalo con un poco mas de detalle.';
      }
    }

    if (stepIndex === 1 && form.affectedAreas.length === 0) {
      nextErrors.affectedAreas = 'Selecciona al menos un area donde hoy se note el impacto.';
    }

    if (stepIndex === 2 && selectedSymptomsCount === 0) {
      nextErrors.symptoms = 'Marca al menos una manifestacion para orientar la primera entrevista.';
    }

    if (stepIndex === 3 && form.mainGoal.trim().length < 20) {
      nextErrors.mainGoal = 'Escribi un objetivo breve pero concreto.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    if (stepIndex === STEPS.length - 1) {
      setCompleted(true);
      return;
    }
    setErrors({});
    setStepIndex((prev) => prev + 1);
  }

  function handleBack() {
    setErrors({});
    setCompleted(false);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function resetPrototype() {
    setForm(INITIAL_STATE);
    setErrors({});
    setCompleted(false);
    setStepIndex(0);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_32%),linear-gradient(180deg,_#eef6f4_0%,_#f8fafc_48%,_#edf2f7_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <section className="flex-1 rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">
                  Prototipo de intake
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  Entrevista clinica estructurada
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Version de prueba para validar tono, orden de preguntas y sensacion de avance
                  antes de conectar persistencia, esquemas y motor.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/patient/register')}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300"
                >
                  Ver registro actual
                </button>
                <button
                  type="button"
                  onClick={resetPrototype}
                  className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
                >
                  Reiniciar prototipo
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-teal-100 bg-teal-50/70 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-teal-900">
                <span>{STEPS[stepIndex].kicker}</span>
                <span>{stepIndex + 1} / {STEPS.length}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-700 via-emerald-600 to-lime-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-4">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={clsx(
                      'rounded-2xl border px-3 py-3 transition-colors',
                      index === stepIndex
                        ? 'border-teal-700 bg-white text-slate-900'
                        : index < stepIndex
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-transparent bg-white/60 text-slate-500',
                    )}
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em]">{step.kicker}</p>
                    <p className="mt-1 text-sm font-medium">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {!completed && (
              <div className="rounded-[28px] border border-slate-200 bg-[#fcfcfa] p-5 md:p-6">
                {stepIndex === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sobre vos</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        Empezamos con algunos datos simples para que la conversacion se sienta mas
                        personal y mejor orientada.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputShell
                        label="Como queres que te llamemos"
                        hint="Puede ser tu nombre, un apodo o la forma en la que te resulte mas comoda."
                        required
                        error={errors.preferredName}
                      >
                        <input
                          value={form.preferredName}
                          onChange={(event) => setField('preferredName', event.target.value)}
                          placeholder="Ej. Sol, Sofia, S."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-teal-700"
                        />
                      </InputShell>

                      <InputShell
                        label="Edad"
                        hint="Nos sirve como referencia de contexto vital."
                        required
                        error={errors.age}
                      >
                        <input
                          value={form.age}
                          onChange={(event) => setField('age', event.target.value.replace(/[^\d]/g, ''))}
                          placeholder="Ej. 29"
                          inputMode="numeric"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-teal-700"
                        />
                      </InputShell>
                    </div>

                    <InputShell
                      label="Ocupacion principal"
                      hint="Este campo podria quedar opcional en la implementacion final."
                    >
                      <div className="flex flex-wrap gap-2">
                        {OCCUPATIONS.map((occupation) => (
                          <PrototypePill
                            key={occupation.key}
                            active={form.occupation === occupation.key}
                            onClick={() =>
                              setField('occupation', form.occupation === occupation.key ? null : occupation.key)
                            }
                          >
                            {occupation.label}
                          </PrototypePill>
                        ))}
                      </div>
                    </InputShell>

                    <InputShell
                      label="Es tu primera vez en terapia"
                      required
                      error={errors.firstTherapy}
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <SurfaceButton
                          active={form.firstTherapy === true}
                          onClick={() => setField('firstTherapy', true)}
                        >
                          <p className="font-medium">Si, seria la primera vez</p>
                          <p className="mt-1 text-xs text-slate-500">Nos ayuda a usar un lenguaje mas explicativo.</p>
                        </SurfaceButton>
                        <SurfaceButton
                          active={form.firstTherapy === false}
                          onClick={() => setField('firstTherapy', false)}
                        >
                          <p className="font-medium">No, ya hice terapia antes</p>
                          <p className="mt-1 text-xs text-slate-500">Podemos asumir un poco mas de familiaridad con el proceso.</p>
                        </SurfaceButton>
                      </div>
                    </InputShell>

                    <InputShell
                      label="Que te trae hoy"
                      hint="No hace falta que este perfecto. Solo una descripcion honesta para empezar."
                      required
                      error={errors.mainConcern}
                    >
                      <textarea
                        value={form.mainConcern}
                        onChange={(event) => setField('mainConcern', event.target.value)}
                        rows={4}
                        placeholder="Ej. Me siento agotada, me cuesta concentrarme y estoy evitando varias cosas."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-teal-700"
                      />
                    </InputShell>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Mapa de interferencia</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        La idea no es etiquetarte. Solo queremos ver en que partes de tu vida se esta
                        sintiendo mas el peso del problema hoy.
                      </p>
                    </div>

                    <InputShell
                      label="En que areas sentis mas impacto"
                      hint="Podes elegir mas de una. Las tarjetas estan pensadas para movil."
                      required
                      error={errors.affectedAreas}
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        {INTERFERENCE_AREAS.map((area) => (
                          <SurfaceButton
                            key={area.key}
                            active={form.affectedAreas.includes(area.key)}
                            onClick={() => toggleArea(area.key)}
                          >
                            <p className="font-medium">{area.label}</p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">{area.hint}</p>
                          </SurfaceButton>
                        ))}
                      </div>
                    </InputShell>
                  </div>
                )}

                {stepIndex === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Foco sintomatologico</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        Este paso ayuda a diferenciar si hoy predomina mas lo cognitivo, lo fisico o lo
                        conductual, sin hacer todavia inferencias fuertes.
                      </p>
                    </div>

                    {errors.symptoms && <p className="text-sm text-rose-600">{errors.symptoms}</p>}

                    <div className="grid gap-4 lg:grid-cols-3">
                      {(Object.keys(SYMPTOM_OPTIONS) as SymptomGroup[]).map((group) => (
                        <div key={group} className="rounded-[26px] border border-slate-200 bg-white p-4">
                          <div className="mb-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cluster</p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">
                              {SYMPTOM_OPTIONS[group].label}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {SYMPTOM_OPTIONS[group].items.map((item) => (
                              <PrototypePill
                                key={item}
                                active={form.symptomSelections[group].includes(item)}
                                onClick={() => toggleSymptom(group, item)}
                              >
                                {item}
                              </PrototypePill>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stepIndex === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Punto de partida</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        Cerramos con una linea base simple para saber desde donde arrancamos y hacia que
                        cambio queres moverte.
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Nivel de malestar general hoy</p>
                          <p className="mt-1 text-xs text-slate-500">Escala orientativa de 0 a 10.</p>
                        </div>
                        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                          {form.distressToday} / 10 · {getDistressLabel(form.distressToday)}
                        </div>
                      </div>
                      <div className="mt-5">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={form.distressToday}
                          onChange={(event) => setField('distressToday', Number(event.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                        />
                        <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          <span>Leve</span>
                          <span>Moderado</span>
                          <span>Intenso</span>
                        </div>
                      </div>
                    </div>

                    <InputShell
                      label="Objetivo principal para estas sesiones"
                      hint="En la implementacion final esto seria un buen candidato para validacion en Zod."
                      required
                      error={errors.mainGoal}
                    >
                      <textarea
                        value={form.mainGoal}
                        onChange={(event) => setField('mainGoal', event.target.value)}
                        rows={5}
                        placeholder="Ej. Poder volver a sostener mi rutina sin sentirme tan desbordada."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-teal-700"
                      />
                    </InputShell>
                  </div>
                )}
              </div>
            )}

            {completed && (
              <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                      Resumen del prototipo
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      Asi podria verse el payload inicial del intake
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      No se guarda nada. Esto solo sirve para revisar si el flujo y la estructura base
                      tienen sentido antes de implementar Zod, Dexie y activacion del motor.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetPrototype}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
                  >
                    Volver a empezar
                  </button>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[24px] border border-white bg-white p-4">
                    <pre className="overflow-x-auto text-xs leading-6 text-slate-700">
{JSON.stringify(
  {
    identity: {
      preferredName: form.preferredName,
      age: Number(form.age),
      occupation: form.occupation,
      firstTherapy: form.firstTherapy,
    },
    intake: {
      mainConcern: form.mainConcern,
      affectedAreas: form.affectedAreas,
      symptomSelections: form.symptomSelections,
      distressToday: form.distressToday,
      mainGoal: form.mainGoal,
    },
    engineSeeds: {
      techniqueSeed,
      symptomCount: selectedSymptomsCount,
      interferenceLoad: form.affectedAreas.length,
    },
  },
  null,
  2,
)}
                    </pre>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Lectura rapida</p>
                      <div className="mt-3 space-y-3 text-sm text-slate-700">
                        <p><span className="font-medium text-slate-900">Paciente:</span> {form.preferredName || 'Sin nombre'}</p>
                        <p><span className="font-medium text-slate-900">Carga actual:</span> {form.distressToday}/10</p>
                        <p><span className="font-medium text-slate-900">Areas marcadas:</span> {form.affectedAreas.length}</p>
                        <p><span className="font-medium text-slate-900">Manifestaciones:</span> {selectedSymptomsCount}</p>
                        <p><span className="font-medium text-slate-900">Seed tecnico:</span> {techniqueSeed.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Decision de producto</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Si este prototipo te cierra, el siguiente paso es reemplazar validacion manual por
                        esquema Zod y definir una tabla `patientIntakes` separada de `patientRecords`.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl text-sm leading-7 text-slate-500">
                Gracias por compartir esto. La version final podria guardar borradores, reanudar pasos y
                derivar seeds clinicos de baja confianza para la entrevista.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={stepIndex === 0 && !completed}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm transition-colors',
                    stepIndex === 0 && !completed
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
                  )}
                >
                  Atras
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-full bg-teal-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
                >
                  {stepIndex === STEPS.length - 1 ? 'Ver resumen del prototipo' : 'Continuar'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full rounded-[32px] border border-slate-200 bg-[#0f172a] p-5 text-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.25)] lg:w-[360px] lg:sticky lg:top-8 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.28em] text-teal-300">Panel de revision</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Que estamos probando</h2>
          <div className="mt-6 space-y-5 text-sm leading-7 text-slate-300">
            <div>
              <p className="font-medium text-white">Objetivo UX</p>
              <p>Reducir abrume inicial y convertir el registro en una conversacion guiada.</p>
            </div>
            <div>
              <p className="font-medium text-white">Objetivo tecnico</p>
              <p>Separar ficha de paciente, snapshot de intake y seeds iniciales para el motor.</p>
            </div>
            <div>
              <p className="font-medium text-white">Criterios a validar</p>
              <ul className="mt-2 space-y-2 text-slate-300">
                <li>Orden de pasos y tono de las preguntas.</li>
                <li>Si las tarjetas funcionan mejor que checkboxes clasicos.</li>
                <li>Cuanto pedir como obligatorio en el primer contacto.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Estado actual</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <p>Paso: {STEPS[stepIndex].label}</p>
              <p>Areas elegidas: {form.affectedAreas.length}</p>
              <p>Sintomas marcados: {selectedSymptomsCount}</p>
              <p>Malestar: {form.distressToday}/10</p>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-teal-500/20 bg-teal-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-teal-300">Semilla para motor</p>
            <p className="mt-2 text-lg font-semibold text-white">{techniqueSeed.toUpperCase()}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Heuristica simple de prototipo basada en cluster sintomatico predominante.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
