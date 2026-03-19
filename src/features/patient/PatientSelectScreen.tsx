/**
 * PatientSelectScreen — "¿Quién sos vos?"
 *
 * Pantalla de selección para pacientes ya registrados.
 * Lee los perfiles desde IndexedDB (Dexie) y los carga en el store activo.
 * Si no hay pacientes registrados, redirige directamente al registro.
 *
 * Estética: consistente con LandingScreen (dark, teal + amber).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/database';
import type { PatientRecord } from '../../db/database';
import { usePatientStore } from './patientStore';
import type { PatientRegistration } from './patientStore';

// ─── Palette (mismos tokens que LandingScreen) ──────────────────────────────
const C = {
  bg:          '#070b14',
  surface:     'rgba(15, 23, 42, 0.7)',
  border:      'rgba(100, 160, 180, 0.12)',
  borderAmber: 'rgba(212, 160, 84, 0.2)',
  teal:        '#5eaab5',
  tealMuted:   '#3d7a85',
  tealDim:     'rgba(94, 170, 181, 0.08)',
  amber:       '#d4a054',
  amberHover:  '#e8b86a',
  amberDim:    'rgba(212, 160, 84, 0.06)',
  textPrimary: '#e2e8f0',
  textSecond:  '#94a3b8',
  textMuted:   '#64748b',
};

// ─── Conversión PatientRecord (Dexie) → PatientRegistration (Zustand) ──────
function toPatientRegistration(r: PatientRecord): PatientRegistration {
  const toMs = (d: Date | null | undefined): number | null =>
    d instanceof Date ? d.getTime() : null;

  return {
    patientId:                r.patientId,
    createdAt:                r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt),
    lastUpdatedAt:            r.lastUpdatedAt instanceof Date ? r.lastUpdatedAt.getTime() : Number(r.lastUpdatedAt),
    alias:                    r.alias,
    birthDate:                r.birthDate,
    age:                      r.age,
    gender:                   r.gender,
    phone:                    r.phone ?? '',
    email:                    r.email ?? '',
    initialContact:           r.initialContact,
    referralSource:           r.referralSource as PatientRegistration['referralSource'],
    referralNotes:            r.referralNotes,
    previousTreatment:        r.previousTreatment,
    previousTreatmentNotes:   r.previousTreatmentNotes,
    currentMedication:        r.currentMedication,
    currentMedicationNotes:   r.currentMedicationNotes,
    affectedAreas:            r.affectedAreas as PatientRegistration['affectedAreas'],
    livingWith:               (r.livingWith as PatientRegistration['livingWith']) ?? null,
    workStatus:               (r.workStatus as PatientRegistration['workStatus']) ?? null,
    socialSupportLevel:       (r.socialSupportLevel as PatientRegistration['socialSupportLevel']) ?? null,
    emergencyContactName:     r.emergencyContactName ?? '',
    emergencyContactPhone:    r.emergencyContactPhone ?? '',
    isFirstTherapy:           r.isFirstTherapy ?? null,
    previousTherapyNotes:     r.previousTherapyNotes ?? '',
    psychiatricTreatment:     r.psychiatricTreatment ?? null,
    psychiatricNotes:         r.psychiatricNotes ?? '',
    familyMentalHealth:       r.familyMentalHealth ?? null,
    familyMentalHealthNotes:  r.familyMentalHealthNotes ?? '',
    mainReasonCategories:     (r.mainReasonCategories as PatientRegistration['mainReasonCategories']) ?? [],
    mainReasonText:           r.mainReasonText ?? '',
    symptomGroups:            (r.symptomGroups as PatientRegistration['symptomGroups']) ?? [],
    distressLevel:            r.distressLevel ?? null,
    mainGoal:                 (r.mainGoal as PatientRegistration['mainGoal']) ?? null,
    mainGoalText:             r.mainGoalText ?? '',
    safetyCheckPassed:        r.safetyCheckPassed ?? false,
    safetyCheckAt:            toMs(r.safetyCheckAt),
    interviewCompleted:       r.interviewCompleted,
    interviewCompletedAt:     toMs(r.interviewCompletedAt),
    interviewReportSentAt:    null,
  };
}

// ─── Helpers visuales ───────────────────────────────────────────────────────
function getInitial(alias: string): string {
  return alias.trim().charAt(0).toUpperCase();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Componente ─────────────────────────────────────────────────────────────
export function PatientSelectScreen() {
  const navigate = useNavigate();
  const { setActivePatient } = usePatientStore();

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    db.patientRecords.orderBy('createdAt').reverse().toArray().then((records) => {
      setPatients(records);
      setLoading(false);
      // Si no hay nadie registrado → ir directo al registro
      if (records.length === 0) {
        navigate('/patient/register', { replace: true });
      }
    });
  }, [navigate]);

  async function handleSelect(record: PatientRecord) {
    setSelecting(record.patientId);
    const registration = toPatientRegistration(record);
    setActivePatient(registration);
    navigate('/patient/patient-dashboard');
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.bg }}
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: C.teal, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: C.bg }}
    >
      {/* Encabezado */}
      <div className="text-center mb-10 max-w-sm">
        <h1
          className="text-3xl font-light tracking-tight mb-2"
          style={{ fontFamily: "'Fraunces', serif", color: C.textPrimary }}
        >
          Hola de nuevo
        </h1>
        <p className="text-sm" style={{ color: C.textSecond }}>
          Elegí tu perfil para continuar tu proceso.
        </p>
      </div>

      {/* Lista de pacientes */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {patients.map((p) => {
          const isSelecting = selecting === p.patientId;
          return (
            <button
              key={p.patientId}
              onClick={() => handleSelect(p)}
              disabled={!!selecting}
              className="group flex items-center gap-4 w-full text-left rounded-2xl px-5 py-4 transition-all duration-200"
              style={{
                background: C.amberDim,
                border: `1px solid ${C.borderAmber}`,
                opacity: selecting && !isSelecting ? 0.4 : 1,
              }}
              onMouseEnter={e => {
                if (!selecting) {
                  e.currentTarget.style.borderColor = C.amber;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.borderAmber;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                style={{ background: 'rgba(212, 160, 84, 0.15)', color: C.amber }}
              >
                {getInitial(p.alias)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: C.textPrimary }}>
                  {p.alias}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                  Desde {formatDate(p.createdAt)}
                </p>
              </div>

              {/* Acción */}
              {isSelecting ? (
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                  style={{ borderColor: C.amber, borderTopColor: 'transparent' }}
                />
              ) : (
                <svg
                  className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ color: C.textMuted }}
                >
                  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer — registrarse como nuevo */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={() => navigate('/patient/register')}
          className="text-sm transition-colors"
          style={{ color: C.textMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textSecond)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          No estoy en la lista → Registrarme
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-xs flex items-center gap-1 transition-colors"
          style={{ color: C.textMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textSecond)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L6.06 8l3.72 3.72a.75.75 0 010 1.06z" />
          </svg>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
