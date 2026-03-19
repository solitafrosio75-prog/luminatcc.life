/**
 * PatientRegisterScreen.tsx
 *
 * Pantalla de registro multi-fase con estética "Clinical Warmth".
 * 4 fases progresivas + safety gate separado (overlay modal).
 *
 * Fase 1: "Sobre vos"          — alias, birthDate, gender
 * Safety Gate (overlay)         — chequeo de riesgo inmediato
 * Fase 2: "Tu día a día"       — convivencia, trabajo, apoyo social
 * Fase 3: "Tu salud"           — historia clínica breve
 * Fase 4: "¿Cómo te sentís?"   — motivo, síntomas, malestar, objetivo (opcional)
 *
 * Al completar: genera PAC-ID, persiste en Zustand + IndexedDB, navega a /patient/patient-dashboard.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  usePatientStore,
  type LifeArea,
  type ReferralSource,
  type LivingSituation,
  type WorkStatus,
  type SocialSupport,
  type MainReasonCategory,
  type SymptomGroup,
  type MainGoal,
} from './patientStore';
import { db } from '../../db/database';
import {
  User, Heart, Activity, Sparkles, ChevronLeft, ChevronRight,
  Phone, Mail, UserCheck, ShieldAlert, AlertTriangle, Check,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION DATA
// ═══════════════════════════════════════════════════════════════════════════════

const GENDER_OPTIONS = [
  { key: 'mujer',     label: 'Mujer' },
  { key: 'hombre',    label: 'Hombre' },
  { key: 'no_binario', label: 'No binario' },
  { key: 'prefiero_no_decir', label: 'Prefiero no decir' },
] as const;

const LIVING_OPTIONS: { key: LivingSituation; label: string }[] = [
  { key: 'solo',       label: 'Solo/a' },
  { key: 'pareja',     label: 'En pareja' },
  { key: 'familia',    label: 'Con familia' },
  { key: 'compartido', label: 'Compañeros/as' },
  { key: 'otro',       label: 'Otro' },
];

const WORK_OPTIONS: { key: WorkStatus; label: string }[] = [
  { key: 'empleado',    label: 'Trabajando' },
  { key: 'estudiante',  label: 'Estudiando' },
  { key: 'ambos',       label: 'Ambos' },
  { key: 'desempleado', label: 'Sin empleo' },
  { key: 'jubilado',    label: 'Jubilado/a' },
  { key: 'licencia',    label: 'Con licencia' },
];

const SUPPORT_OPTIONS: { key: SocialSupport; label: string; desc: string; color: string }[] = [
  { key: 'fuerte',   label: 'Sí, tengo personas en quienes apoyarme', desc: '', color: '#5cb885' },
  { key: 'moderado', label: 'Más o menos, no siempre',                desc: '', color: '#d4a054' },
  { key: 'escaso',   label: 'Me siento bastante solo/a',              desc: '', color: '#d45454' },
];

const REFERRAL_OPTIONS: { key: ReferralSource; label: string }[] = [
  { key: 'autoderivacion',  label: 'Por decisión propia' },
  { key: 'medico',          label: 'Derivado por médico' },
  { key: 'psicologo',       label: 'Derivado por otro profesional' },
  { key: 'pareja_familiar', label: 'Sugerencia de alguien cercano' },
  { key: 'otro',            label: 'Otro' },
];

const REASON_OPTIONS: { key: MainReasonCategory; label: string; icon: string }[] = [
  { key: 'ansiedad',    label: 'Ansiedad o nervios',        icon: '⚡' },
  { key: 'animo',       label: 'Bajo ánimo o tristeza',     icon: '🌧' },
  { key: 'relaciones',  label: 'Relaciones',                icon: '🤝' },
  { key: 'autoestima',  label: 'Autoestima',                icon: '🪞' },
  { key: 'duelo',       label: 'Pérdida o duelo',           icon: '🕊' },
  { key: 'estres',      label: 'Estrés o agotamiento',      icon: '🔥' },
  { key: 'otro',        label: 'Otro',                      icon: '💬' },
];

const LIFE_AREAS: { key: LifeArea; label: string }[] = [
  { key: 'trabajo',    label: 'Trabajo / estudio' },
  { key: 'pareja',     label: 'Pareja / vínculos' },
  { key: 'familia',    label: 'Familia' },
  { key: 'social',     label: 'Vida social' },
  { key: 'salud',      label: 'Salud' },
  { key: 'economico',  label: 'Economía' },
  { key: 'academico',  label: 'Rendimiento académico' },
  { key: 'otro',       label: 'Otro' },
];

const SYMPTOM_OPTIONS: { key: SymptomGroup; label: string }[] = [
  { key: 'animo_bajo',       label: 'Me cuesta salir de la cama' },
  { key: 'nerviosismo',      label: 'Estoy nervioso/a todo el tiempo' },
  { key: 'problemas_sueno',  label: 'Duermo mal' },
  { key: 'irritabilidad',    label: 'Me irrito fácilmente' },
  { key: 'aislamiento',      label: 'Me aíslo de la gente' },
  { key: 'cansancio',        label: 'Estoy agotado/a' },
  { key: 'concentracion',    label: 'No me puedo concentrar' },
  { key: 'apetito',          label: 'Cambió mi apetito' },
  { key: 'culpa',            label: 'Me siento culpable' },
  { key: 'desesperanza',     label: 'Siento que nada va a mejorar' },
];

const GOAL_OPTIONS: { key: MainGoal; label: string }[] = [
  { key: 'sentirme_mejor',     label: 'Sentirme mejor en general' },
  { key: 'entender_que_pasa',  label: 'Entender qué me pasa' },
  { key: 'herramientas',       label: 'Tener herramientas para manejarme' },
  { key: 'relaciones',         label: 'Mejorar mis relaciones' },
  { key: 'habitos',            label: 'Cambiar hábitos que me hacen mal' },
  { key: 'otro',               label: 'Otro' },
];

const DISTRESS_FACES = ['😌', '🙂', '😐', '😕', '😟', '😣', '😰', '😥', '😫', '😭', '🆘'];

const STEP_META = [
  { icon: User,     label: 'Sobre vos',          num: 1 },
  { icon: Heart,    label: 'Tu día a día',        num: 2 },
  { icon: Activity, label: 'Tu salud',            num: 3 },
  { icon: Sparkles, label: '¿Cómo te sentís?',    num: 4 },
];

const CRISIS_LINES = [
  { country: 'Argentina', name: 'Centro de Asistencia al Suicida', number: '135', note: 'Línea gratuita 24h' },
  { country: 'Argentina', name: 'Línea de atención en crisis', number: '(011) 5275-1135', note: '' },
  { country: 'España',    name: 'Línea de Conducta Suicida',       number: '024', note: 'Línea gratuita 24h' },
  { country: 'México',    name: 'SAPTEL',                          number: '(55) 5259-8121', note: '' },
  { country: 'Emergencias', name: '', number: '911 / 112', note: 'Línea de emergencias' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-1 w-full max-w-xs mx-auto mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex-1 flex items-center gap-1">
            <div
              className={clsx(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                done    && 'bg-gradient-to-r from-amber-600 to-emerald-500',
                active  && 'bg-amber-500',
                !done && !active && 'bg-[#2a2520]',
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

function WarmChip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-xl text-sm border transition-all duration-200',
        selected
          ? 'bg-amber-950/50 border-amber-700/40 text-amber-200 shadow-[0_0_12px_rgba(212,160,84,0.15)]'
          : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.1)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.25)] hover:text-[#b0a290]',
        className,
      )}
    >
      {children}
    </button>
  );
}

function WarmToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { v: true,  label: 'Sí' },
        { v: false, label: 'No' },
      ].map(({ v, label }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(v)}
          className={clsx(
            'px-5 py-2 rounded-xl text-sm border transition-all duration-200',
            value === v
              ? 'bg-amber-950/50 border-amber-700/40 text-amber-200'
              : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.1)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.25)]',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children, hint, required }: { children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <div className="space-y-0.5">
      <label className="block text-sm text-[#b0a290] font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
        {required && <span className="text-amber-500/70 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-[#5a5249]">{hint}</p>}
    </div>
  );
}

function WarmInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-xl px-4 py-3 text-sm transition-all duration-200',
          'bg-[#1e1b16]/60 border text-[#e8e0d4] placeholder:text-[#5a5249]',
          'focus:outline-none',
          error
            ? 'border-[#d45454]/50 focus:border-[#d45454]'
            : 'border-[rgba(180,130,60,0.12)] focus:border-amber-700/50 focus:shadow-[0_0_8px_rgba(212,160,84,0.1)]',
        )}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
      {error && <p className="text-xs text-[#d45454] mt-1.5">{error}</p>}
    </div>
  );
}

function WarmTextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={clsx(
        'w-full rounded-xl px-4 py-3 text-sm resize-none transition-all duration-200',
        'bg-[#1e1b16]/60 border border-[rgba(180,130,60,0.12)] text-[#e8e0d4] placeholder:text-[#5a5249]',
        'focus:outline-none focus:border-amber-700/50 focus:shadow-[0_0_8px_rgba(212,160,84,0.1)]',
      )}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function PatientRegisterScreen() {
  const navigate = useNavigate();
  const { registerPatient } = usePatientStore();

  // ── Step management ──────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0); // 0-3 (4 phases) + 4 = completion
  const [safetyGateOpen, setSafetyGateOpen] = useState(false);
  const [safetyGatePassed, setSafetyGatePassed] = useState(false);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Phase 1: Sobre vos ──────────────────────────────────────────────────
  const [alias, setAlias] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [genderCustom, setGenderCustom] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // ── Phase 2: Tu día a día ───────────────────────────────────────────────
  const [livingWith, setLivingWith] = useState<LivingSituation | null>(null);
  const [workStatus, setWorkStatus] = useState<WorkStatus | null>(null);
  const [socialSupport, setSocialSupport] = useState<SocialSupport | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // ── Phase 3: Tu salud ───────────────────────────────────────────────────
  const [referralSource, setReferralSource] = useState<ReferralSource | null>(null);
  const [referralNotes, setReferralNotes] = useState('');
  const [isFirstTherapy, setIsFirstTherapy] = useState<boolean | null>(null);
  const [previousTherapyNotes, setPreviousTherapyNotes] = useState('');
  const [psychiatricTreatment, setPsychiatricTreatment] = useState<boolean | null>(null);
  const [psychiatricNotes, setPsychiatricNotes] = useState('');
  const [currentMedication, setCurrentMedication] = useState<boolean | null>(null);
  const [currentMedicationNotes, setCurrentMedicationNotes] = useState('');
  const [familyMentalHealth, setFamilyMentalHealth] = useState<boolean | null>(null);
  const [familyMentalHealthNotes, setFamilyMentalHealthNotes] = useState('');

  // ── Phase 4: ¿Cómo te sentís? ──────────────────────────────────────────
  const [mainReasons, setMainReasons] = useState<MainReasonCategory[]>([]);
  const [mainReasonText, setMainReasonText] = useState('');
  const [affectedAreas, setAffectedAreas] = useState<LifeArea[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomGroup[]>([]);
  const [distress, setDistress] = useState(5);
  const [mainGoal, setMainGoal] = useState<MainGoal | null>(null);
  const [mainGoalText, setMainGoalText] = useState('');

  // ── Errors ──────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Helpers ─────────────────────────────────────────────────────────────
  const resolvedGender = gender === 'otro' ? genderCustom : gender;

  function toggleArea(area: LifeArea) {
    setAffectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area],
    );
  }
  function toggleSymptom(s: SymptomGroup) {
    setSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  }
  function toggleReason(r: MainReasonCategory) {
    setMainReasons(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r],
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────
  function validatePhase1(): boolean {
    const e: Record<string, string> = {};
    if (!alias.trim()) e.alias = 'Necesitamos saber cómo llamarte';
    if (!birthDate) {
      e.birthDate = 'Necesitamos tu fecha de nacimiento';
    } else {
      const birth = new Date(birthDate);
      const today = new Date();
      if (birth >= today) e.birthDate = 'La fecha debe ser anterior a hoy';
      const age = today.getFullYear() - birth.getFullYear();
      if (age < 12 || age > 110) e.birthDate = 'Verificá la fecha ingresada';
    }
    if (!resolvedGender.trim()) e.gender = 'Seleccioná o escribí tu género';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      if (!validatePhase1()) return;
      // Show safety gate after Phase 1
      if (!safetyGatePassed) {
        setSafetyGateOpen(true);
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(s => s + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, safetyGatePassed, alias, birthDate, gender, genderCustom]);

  function handleBack() {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }

  function handleSafetyNo() {
    setSafetyGatePassed(true);
    setSafetyGateOpen(false);
    setCurrentStep(1); // Advance to Phase 2
  }

  function handleSafetyYes() {
    setShowCrisisResources(true);
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSaving(true);
    try {
      const patient = registerPatient({
        alias: alias.trim(),
        birthDate,
        gender: resolvedGender.trim(),
        phone: phone.trim(),
        email: email.trim(),
        initialContact: mainReasonText.trim() || (mainReasons.length > 0 ? mainReasons.map(r => REASON_OPTIONS.find(o => o.key === r)?.label).filter(Boolean).join(', ') : 'Registro sin motivo especificado'),
        referralSource,
        referralNotes: referralNotes.trim(),
        previousTreatment: isFirstTherapy === null ? null : !isFirstTherapy,
        previousTreatmentNotes: previousTherapyNotes.trim(),
        currentMedication,
        currentMedicationNotes: currentMedicationNotes.trim(),
        affectedAreas,
        livingWith,
        workStatus,
        socialSupportLevel: socialSupport,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        isFirstTherapy,
        previousTherapyNotes: previousTherapyNotes.trim(),
        psychiatricTreatment,
        psychiatricNotes: psychiatricNotes.trim(),
        familyMentalHealth,
        familyMentalHealthNotes: familyMentalHealthNotes.trim(),
        mainReasonCategories: mainReasons,
        mainReasonText: mainReasonText.trim(),
        symptomGroups: symptoms,
        distressLevel: mainReasons.length > 0 ? distress * 10 : null, // 0-10 UI → 0-100 SUDs
        mainGoal,
        mainGoalText: mainGoalText.trim(),
        safetyCheckPassed: safetyGatePassed,
        safetyCheckAt: safetyGatePassed ? Date.now() : null,
      });

      // Persist to IndexedDB
      await db.patientRecords.add({
        patientId: patient.patientId,
        createdAt: new Date(patient.createdAt),
        lastUpdatedAt: new Date(patient.lastUpdatedAt),
        alias: patient.alias,
        birthDate: patient.birthDate,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        initialContact: patient.initialContact,
        referralSource: patient.referralSource,
        referralNotes: patient.referralNotes,
        previousTreatment: patient.previousTreatment,
        previousTreatmentNotes: patient.previousTreatmentNotes,
        currentMedication: patient.currentMedication,
        currentMedicationNotes: patient.currentMedicationNotes,
        affectedAreas: patient.affectedAreas,
        interviewCompleted: false,
        interviewCompletedAt: null,
        livingWith: patient.livingWith,
        workStatus: patient.workStatus,
        socialSupportLevel: patient.socialSupportLevel,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        mainReasonCategories: patient.mainReasonCategories,
        mainReasonText: patient.mainReasonText,
        symptomGroups: patient.symptomGroups,
        distressLevel: patient.distressLevel,
        mainGoal: patient.mainGoal,
        mainGoalText: patient.mainGoalText,
        safetyCheckPassed: patient.safetyCheckPassed,
        safetyCheckAt: patient.safetyCheckAt ? new Date(patient.safetyCheckAt) : null,
        isFirstTherapy: patient.isFirstTherapy,
        previousTherapyNotes: patient.previousTherapyNotes,
        psychiatricTreatment: patient.psychiatricTreatment,
        psychiatricNotes: patient.psychiatricNotes,
        familyMentalHealth: patient.familyMentalHealth,
        familyMentalHealthNotes: patient.familyMentalHealthNotes,
      });

      navigate('/patient/patient-dashboard');
    } catch {
      setSaving(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE RENDERERS
  // ═════════════════════════════════════════════════════════════════════════

  function renderPhase1() {
    return (
      <div className="space-y-6 animate-fadeSlideIn">
        <div>
          <h2 className="text-2xl text-[#e8e0d4]" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            Empecemos por lo básico
          </h2>
          <p className="mt-1.5 text-sm text-[#8a7e6e]">
            Solo necesitamos saber cómo llamarte y un par de datos.
          </p>
        </div>

        <div className="space-y-5">
          {/* Alias */}
          <div className="space-y-2">
            <FieldLabel required>¿Cómo querés que te llamemos?</FieldLabel>
            <WarmInput
              value={alias}
              onChange={setAlias}
              placeholder="Tu nombre o como prefieras"
              error={errors.alias}
            />
          </div>

          {/* Birth date */}
          <div className="space-y-2">
            <FieldLabel required hint="Para calcular tu edad automáticamente">¿Cuándo naciste?</FieldLabel>
            <WarmInput
              value={birthDate}
              onChange={setBirthDate}
              type="date"
              error={errors.birthDate}
            />
          </div>

          {/* Phone + Email — row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel hint="Para poder contactarte">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500/60" />
                  Celular
                </span>
              </FieldLabel>
              <WarmInput
                value={phone}
                onChange={setPhone}
                placeholder="11 1234-5678"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel hint="Opcional">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500/60" />
                  Email
                </span>
              </FieldLabel>
              <WarmInput
                value={email}
                onChange={setEmail}
                placeholder="tu@email.com"
                type="email"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <FieldLabel required>Género</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map(({ key, label }) => (
                <WarmChip
                  key={key}
                  selected={gender === key}
                  onClick={() => setGender(gender === key ? '' : key)}
                >
                  {label}
                </WarmChip>
              ))}
              <WarmChip
                selected={gender === 'otro'}
                onClick={() => setGender(gender === 'otro' ? '' : 'otro')}
              >
                Otro
              </WarmChip>
            </div>
            {gender === 'otro' && (
              <WarmInput
                value={genderCustom}
                onChange={setGenderCustom}
                placeholder="Escribí como querés identificarte"
                error={errors.gender}
              />
            )}
            {errors.gender && gender !== 'otro' && (
              <p className="text-xs text-[#d45454]">{errors.gender}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderPhase2() {
    return (
      <div className="space-y-6 animate-fadeSlideIn">
        <div>
          <h2 className="text-2xl text-[#e8e0d4]" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            Contanos un poco sobre tu vida cotidiana
          </h2>
          <p className="mt-1.5 text-sm text-[#8a7e6e]">
            Esto nos ayuda a entender mejor tu situación. No hay respuestas correctas.
          </p>
        </div>

        <div className="space-y-6">
          {/* Living situation */}
          <div className="space-y-2">
            <FieldLabel>¿Con quién vivís?</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {LIVING_OPTIONS.map(({ key, label }) => (
                <WarmChip
                  key={key}
                  selected={livingWith === key}
                  onClick={() => setLivingWith(livingWith === key ? null : key)}
                >
                  {label}
                </WarmChip>
              ))}
            </div>
          </div>

          {/* Work status */}
          <div className="space-y-2">
            <FieldLabel>¿En qué estás ahora?</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {WORK_OPTIONS.map(({ key, label }) => (
                <WarmChip
                  key={key}
                  selected={workStatus === key}
                  onClick={() => setWorkStatus(workStatus === key ? null : key)}
                >
                  {label}
                </WarmChip>
              ))}
            </div>
          </div>

          {/* Social support */}
          <div className="space-y-2">
            <FieldLabel>¿Sentís que tenés gente que te acompaña?</FieldLabel>
            <div className="space-y-2">
              {SUPPORT_OPTIONS.map(({ key, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSocialSupport(socialSupport === key ? null : key)}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3',
                    socialSupport === key
                      ? 'bg-amber-950/40 border-amber-700/30 text-[#e8e0d4]'
                      : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.1)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.2)]',
                  )}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color, boxShadow: socialSupport === key ? `0 0 8px ${color}60` : 'none' }}
                  />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Referral source */}
          <div className="space-y-2">
            <FieldLabel hint="Opcional">¿Cómo llegaste hasta acá?</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {REFERRAL_OPTIONS.map(({ key, label }) => (
                <WarmChip
                  key={key}
                  selected={referralSource === key}
                  onClick={() => setReferralSource(referralSource === key ? null : key)}
                >
                  {label}
                </WarmChip>
              ))}
            </div>
            {(referralSource === 'medico' || referralSource === 'psicologo') && (
              <WarmInput
                value={referralNotes}
                onChange={setReferralNotes}
                placeholder="¿Por quién? (opcional)"
              />
            )}
          </div>

          {/* Emergency contact */}
          <div className="space-y-3">
            <FieldLabel hint="Por si necesitamos contactar a alguien de tu confianza">
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-500/60" />
                Contacto de confianza
              </span>
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <WarmInput
                value={emergencyContactName}
                onChange={setEmergencyContactName}
                placeholder="Nombre"
              />
              <WarmInput
                value={emergencyContactPhone}
                onChange={setEmergencyContactPhone}
                placeholder="Teléfono"
                type="tel"
              />
            </div>
            <p className="text-[10px] text-[#5a5249] leading-relaxed">
              Solo lo usaríamos en una situación de emergencia y con tu consentimiento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderPhase3() {
    return (
      <div className="space-y-6 animate-fadeSlideIn">
        <div>
          <h2 className="text-2xl text-[#e8e0d4]" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            Un poco sobre tu historia de salud
          </h2>
          <p className="mt-1.5 text-sm text-[#8a7e6e]">
            Esto queda entre vos y el profesional. Podés completarlo después si preferís.
          </p>
        </div>

        <div className="space-y-6">
          {/* First therapy */}
          <div className="space-y-2">
            <FieldLabel>¿Es tu primera vez en terapia?</FieldLabel>
            <WarmToggle value={isFirstTherapy} onChange={setIsFirstTherapy} />
            {isFirstTherapy === false && (
              <div className="mt-2">
                <WarmTextArea
                  value={previousTherapyNotes}
                  onChange={setPreviousTherapyNotes}
                  placeholder="¿Podés contarnos brevemente cómo fue esa experiencia?"
                />
              </div>
            )}
          </div>

          {/* Psychiatric treatment */}
          <div className="space-y-2">
            <FieldLabel>¿Estás viendo un psiquiatra actualmente?</FieldLabel>
            <WarmToggle value={psychiatricTreatment} onChange={setPsychiatricTreatment} />
            {psychiatricTreatment === true && (
              <div className="mt-2">
                <WarmInput
                  value={psychiatricNotes}
                  onChange={setPsychiatricNotes}
                  placeholder="¿Quién? (opcional)"
                />
              </div>
            )}
          </div>

          {/* Current medication */}
          <div className="space-y-2">
            <FieldLabel>¿Tomás alguna medicación actualmente?</FieldLabel>
            <WarmToggle value={currentMedication} onChange={setCurrentMedication} />
            {currentMedication === true && (
              <div className="mt-2">
                <WarmInput
                  value={currentMedicationNotes}
                  onChange={setCurrentMedicationNotes}
                  placeholder="¿Cuál? ¿Dosis? (opcional)"
                />
              </div>
            )}
          </div>

          {/* Family mental health */}
          <div className="space-y-2">
            <FieldLabel hint="Opcional — podés elegir no responder">¿Hay antecedentes de salud mental en tu familia?</FieldLabel>
            <div className="flex gap-2">
              {[
                { v: true,  label: 'Sí' },
                { v: false, label: 'No' },
              ].map(({ v, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFamilyMentalHealth(familyMentalHealth === v ? null : v)}
                  className={clsx(
                    'px-5 py-2 rounded-xl text-sm border transition-all duration-200',
                    familyMentalHealth === v
                      ? 'bg-amber-950/50 border-amber-700/40 text-amber-200'
                      : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.1)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.25)]',
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFamilyMentalHealth(null)}
                className={clsx(
                  'px-5 py-2 rounded-xl text-sm border transition-all duration-200',
                  'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.1)] text-[#5a5249] hover:border-[rgba(180,130,60,0.25)]',
                )}
              >
                Prefiero no responder
              </button>
            </div>
            {familyMentalHealth === true && (
              <div className="mt-2">
                <WarmTextArea
                  value={familyMentalHealthNotes}
                  onChange={setFamilyMentalHealthNotes}
                  placeholder="Si querés, contanos brevemente (opcional)"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderPhase4() {
    return (
      <div className="space-y-6 animate-fadeSlideIn">
        <div>
          <h2 className="text-2xl text-[#e8e0d4]" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            ¿Qué te trajo hasta acá?
          </h2>
          <p className="mt-1.5 text-sm text-[#8a7e6e]">
            Esto nos ayuda a prepararnos mejor. Si preferís contarlo en persona, podés saltear este paso.
          </p>
        </div>

        <div className="space-y-6">
          {/* Main reason — multi-select */}
          <div className="space-y-2">
            <FieldLabel hint="Podés seleccionar más de uno">¿Qué te trajo a buscar ayuda?</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {REASON_OPTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleReason(key)}
                  className={clsx(
                    'text-left px-4 py-3 rounded-xl border transition-all duration-200',
                    mainReasons.includes(key)
                      ? 'bg-amber-950/50 border-amber-700/30 text-[#e8e0d4] shadow-[0_0_12px_rgba(212,160,84,0.1)]'
                      : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.08)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.2)]',
                  )}
                >
                  <span className="text-base mr-2">{icon}</span>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
            {mainReasons.includes('otro') && (
              <WarmInput
                value={mainReasonText}
                onChange={setMainReasonText}
                placeholder="Contanos brevemente"
              />
            )}
          </div>

          {/* Affected areas */}
          <div className="space-y-2">
            <FieldLabel hint="Podés seleccionar más de una">¿En qué áreas sentís más impacto?</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {LIFE_AREAS.map(({ key, label }) => (
                <WarmChip
                  key={key}
                  selected={affectedAreas.includes(key)}
                  onClick={() => toggleArea(key)}
                >
                  {label}
                </WarmChip>
              ))}
            </div>
          </div>

          {/* Symptom groups */}
          <div className="space-y-2">
            <FieldLabel hint="Seleccioná todo lo que aplique">¿Reconocés alguno de estos?</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {SYMPTOM_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSymptom(key)}
                  className={clsx(
                    'text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200',
                    symptoms.includes(key)
                      ? 'bg-amber-950/40 border-amber-700/30 text-amber-100'
                      : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.08)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.2)]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Distress slider */}
          <div className="space-y-3">
            <FieldLabel>¿Cuánto malestar sentís en este momento?</FieldLabel>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[#5a5249]">Nada</span>
                <span className="text-3xl">{DISTRESS_FACES[distress]}</span>
                <span className="text-xs text-[#5a5249]">Muchísimo</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={distress}
                onChange={(e) => setDistress(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #5cb885 0%, #d4a054 50%, #d45454 100%)`,
                  accentColor: '#d4a054',
                }}
              />
              <div className="text-center">
                <span className="text-lg font-medium text-[#e8e0d4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {distress}
                </span>
                <span className="text-xs text-[#5a5249] ml-1">/ 10</span>
              </div>
            </div>
          </div>

          {/* Main goal */}
          <div className="space-y-2">
            <FieldLabel>¿Qué te gustaría lograr?</FieldLabel>
            <div className="space-y-2">
              {GOAL_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMainGoal(mainGoal === key ? null : key)}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200',
                    mainGoal === key
                      ? 'bg-amber-950/40 border-amber-700/30 text-[#e8e0d4]'
                      : 'bg-[#1e1b16]/60 border-[rgba(180,130,60,0.08)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.2)]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {mainGoal === 'otro' && (
              <WarmInput
                value={mainGoalText}
                onChange={setMainGoalText}
                placeholder="¿Qué te gustaría lograr?"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCompletion() {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 animate-fadeSlideIn">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,84,0.2), rgba(92,184,133,0.2))',
            boxShadow: '0 0 30px rgba(212,160,84,0.15)',
          }}
        >
          <Check className="w-8 h-8 text-emerald-400" />
        </div>

        <div>
          <h2
            className="text-2xl text-[#e8e0d4]"
            style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
          >
            Listo, {alias.trim() || 'ya'}
          </h2>
          <p className="mt-2 text-sm text-[#8a7e6e] leading-relaxed max-w-sm">
            Gracias por tomarte el tiempo. El siguiente paso es una entrevista breve donde
            vamos a conversar con más calma sobre tu situación.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className={clsx(
            'w-full max-w-xs py-3.5 rounded-2xl text-sm font-medium transition-all duration-300',
            saving
              ? 'bg-[#2a2520] text-[#5a5249] cursor-not-allowed'
              : 'text-white shadow-[0_0_20px_rgba(212,160,84,0.2)]',
          )}
          style={!saving ? {
            background: 'linear-gradient(135deg, #b8862e, #d4a054)',
          } : undefined}
        >
          {saving ? 'Guardando...' : 'Comenzar entrevista →'}
        </button>

        <p className="text-[10px] text-[#5a5249] px-8">
          Toda la información se guarda localmente en tu dispositivo.
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SAFETY GATE OVERLAY
  // ═════════════════════════════════════════════════════════════════════════

  function renderSafetyGate() {
    if (!safetyGateOpen) return null;

    if (showCrisisResources) {
      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(12, 15, 23, 0.97)' }}
        >
          <div className="w-full max-w-md space-y-6 animate-fadeSlideIn">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-[#d45454]/10">
                <Phone className="w-7 h-7 text-[#d45454]" />
              </div>
              <h2
                className="text-xl text-[#e8e0d4]"
                style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
              >
                No estás solo/a
              </h2>
              <p className="text-sm text-[#8a7e6e] leading-relaxed">
                Si estás en peligro o pensás en hacerte daño, por favor contactá
                a alguna de estas líneas de ayuda. Están disponibles las 24 horas.
              </p>
            </div>

            <div className="space-y-2">
              {CRISIS_LINES.map(({ country, name, number, note }) => (
                <a
                  key={number}
                  href={`tel:${number.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#d45454]/20 bg-[#d45454]/5 hover:bg-[#d45454]/10 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#d45454] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#e8e0d4] font-medium">{number}</div>
                    <div className="text-xs text-[#8a7e6e]">
                      {country}{name ? ` · ${name}` : ''}{note ? ` · ${note}` : ''}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <p className="text-xs text-[#5a5249] text-center leading-relaxed">
              Si estás en peligro inmediato, llamá al <strong className="text-[#d45454]">911</strong> o
              pedile a alguien cercano que te acompañe a la guardia más cercana.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(12, 15, 23, 0.95)' }}
      >
        <div className="w-full max-w-md space-y-8 animate-fadeSlideIn text-center">
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-amber-950/30">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <h2
              className="text-xl text-[#e8e0d4]"
              style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
            >
              Antes de seguir, algo importante
            </h2>
            <p className="text-sm text-[#b0a290] leading-relaxed max-w-sm mx-auto">
              ¿En este momento sentís que corrés peligro o que podrías hacerte daño?
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSafetyYes}
              className="w-full py-3.5 rounded-2xl text-sm font-medium border border-[#d45454]/30 bg-[#d45454]/10 text-[#d45454] hover:bg-[#d45454]/20 transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Sí, necesito ayuda ahora
            </button>
            <button
              type="button"
              onClick={handleSafetyNo}
              className="w-full py-3.5 rounded-2xl text-sm font-medium border border-amber-700/30 bg-amber-950/30 text-amber-200 hover:bg-amber-950/50 transition-colors"
            >
              No, puedo continuar
            </button>
          </div>

          <p className="text-[10px] text-[#5a5249]">
            Esta pregunta es un chequeo de seguridad estándar. Tu respuesta es confidencial.
          </p>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═════════════════════════════════════════════════════════════════════════

  const isCompletion = currentStep === 4;
  const canGoBack = currentStep > 0 && !isCompletion;
  const isPhase4 = currentStep === 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8" style={{ backgroundColor: '#0c0f17' }}>
      <div className="w-full max-w-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Top badge ── */}
        {!isCompletion && (
          <div className="text-center mb-6">
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-[#5a5249]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              TCC Lab · Registro
            </span>
          </div>
        )}

        {/* ── Step indicator ── */}
        {!isCompletion && (
          <StepIndicator currentStep={currentStep} totalSteps={4} />
        )}

        {/* ── Phase label ── */}
        {!isCompletion && (
          <div className="flex items-center gap-2 mb-6">
            {(() => {
              const StepIcon = STEP_META[currentStep]?.icon ?? User;
              return <StepIcon className="w-4 h-4 text-amber-500/70" />;
            })()}
            <span className="text-xs text-[#5a5249] uppercase tracking-wider">
              Paso {STEP_META[currentStep]?.num ?? 1} de 4
              {isPhase4 && <span className="ml-2 text-[#5a5249]/60">· opcional</span>}
            </span>
          </div>
        )}

        {/* ── Phase content ── */}
        <div className="min-h-[400px]">
          {currentStep === 0 && renderPhase1()}
          {currentStep === 1 && renderPhase2()}
          {currentStep === 2 && renderPhase3()}
          {currentStep === 3 && renderPhase4()}
          {currentStep === 4 && renderCompletion()}
        </div>

        {/* ── Navigation footer ── */}
        {!isCompletion && (
          <div className="mt-8 space-y-3">
            <div className="flex gap-3">
              {canGoBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-3 rounded-2xl text-sm border border-[rgba(180,130,60,0.12)] text-[#8a7e6e] hover:border-[rgba(180,130,60,0.25)] hover:text-[#b0a290] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isPhase4) {
                    // Phase 4 → Completion
                    setCurrentStep(4);
                  } else {
                    handleNext();
                  }
                }}
                className={clsx(
                  'flex-1 py-3 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2',
                  'text-white',
                )}
                style={{
                  background: 'linear-gradient(135deg, #b8862e, #d4a054)',
                  boxShadow: '0 0 16px rgba(212,160,84,0.15)',
                }}
              >
                {isPhase4 ? 'Finalizar registro' : 'Continuar'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Skip Phase 4 */}
            {isPhase4 && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="w-full text-center text-xs text-[#5a5249] hover:text-[#8a7e6e] transition-colors py-2"
              >
                Prefiero contarlo en persona — saltear este paso
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Safety gate overlay ── */}
      {renderSafetyGate()}
    </div>
  );
}
export default PatientRegisterScreen;