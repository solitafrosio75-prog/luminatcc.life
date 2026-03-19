/**
 * PatientsTab.tsx
 *
 * Tab "Pacientes" del módulo terapeuta.
 * Muestra todas las carpetas de pacientes registrados.
 * Permite editar datos de registro y ver el reporte de entrevista.
 */

import { useState } from 'react';
import clsx from 'clsx';
import {
  usePatientStore,
  type PatientRegistration,
  type PatientFolder,
  type InterviewReport,
  type LifeArea,
  type ReferralSource,
} from '../patient/patientStore';
import { PatternAnalysisPanel } from './PatternAnalysisPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LIFE_AREA_LABELS: Record<LifeArea, string> = {
  trabajo:    'Trabajo / estudio',
  pareja:     'Pareja / vínculos',
  familia:    'Familia',
  social:     'Vida social',
  salud:      'Salud',
  economico:  'Situación económica',
  academico:  'Rendimiento académico',
  otro:       'Otro',
};

const REFERRAL_LABELS: Record<ReferralSource, string> = {
  autoderivacion:  'Por decisión propia',
  medico:          'Derivado por médico',
  psicologo:       'Derivado por otro psicólogo',
  pareja_familiar: 'Sugerencia de pareja/familiar',
  otro:            'Otro',
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-2">
      {children}
    </p>
  );
}

// ── Subcomponente: vista de reporte ──────────────────────────────────────────

function ReportView({ report }: { report: InterviewReport }) {
  const [view, setView] = useState<'patient' | 'therapist'>('therapist');
  const tv = report.therapistView;
  const pv = report.patientView;

  return (
    <div className="space-y-5">

      {/* Toggle de vista */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {(['therapist', 'patient'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'text-xs px-4 py-1.5 rounded-lg transition-all',
              view === v
                ? 'bg-slate-700/80 text-slate-100'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {v === 'therapist' ? 'Vista terapeuta' : 'Vista paciente'}
          </button>
        ))}
      </div>

      {/* ── Vista Terapeuta ── */}
      {view === 'therapist' && (
        <div className="space-y-5">

          {/* Alertas clínicas */}
          {(tv.clinicalAlerts.riskFlag || tv.clinicalAlerts.crisisAlert ||
            tv.clinicalAlerts.neurovegetative || tv.clinicalAlerts.socialDesirability) && (
            <div className="space-y-2">
              <SectionLabel>Alertas clínicas</SectionLabel>
              {tv.clinicalAlerts.crisisAlert && (
                <div className="px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-xl">
                  <p className="text-xs font-semibold text-red-300">🔴 Ideación suicida activa — Ítem 9 BDI-II (≥ 2)</p>
                  <p className="text-xs text-red-400/80 mt-0.5">Evaluación de riesgo inmediata requerida.</p>
                </div>
              )}
              {!tv.clinicalAlerts.crisisAlert && tv.clinicalAlerts.riskFlag && (
                <div className="px-4 py-3 bg-orange-950/40 border border-orange-900/40 rounded-xl">
                  <p className="text-xs font-semibold text-orange-300">🟠 Ideación suicida pasiva — Ítem 9 BDI-II (= 1)</p>
                  <p className="text-xs text-orange-400/80 mt-0.5">Monitorear. Evaluar factores de protección.</p>
                </div>
              )}
              {tv.clinicalAlerts.neurovegetative && (
                <div className="px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-300">◆ Síntomas neurovegetativos presentes</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ítems de energía, sueño, apetito y fatiga elevados.</p>
                </div>
              )}
            </div>
          )}

          {/* Inventarios */}
          <div>
            <SectionLabel>Inventarios</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {tv.bdi.done && (
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider">BDI-II</p>
                  <p className="text-2xl font-bold text-slate-100 tabular-nums mt-1">{tv.bdi.score}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{tv.bdi.category}</p>
                </div>
              )}
              {tv.gad7?.done && (
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider">GAD-7</p>
                  <p className="text-2xl font-bold text-slate-100 tabular-nums mt-1">{tv.gad7.score}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{tv.gad7.category}</p>
                </div>
              )}
            </div>
          </div>

          {/* Métricas cualitativas */}
          <div>
            <SectionLabel>Métricas de entrevista</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Tono',       v: tv.emotionalTone },
                { l: 'Intensidad', v: `${tv.emotionalIntensity}/5` },
                { l: 'Tendencia',  v: tv.narrativeTrend },
                { l: 'Turnos',     v: String(tv.turnCount) },
              ].map(({ l, v }) => (
                <div key={l} className="bg-slate-800/40 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider">{l}</p>
                  <p className="text-sm text-slate-300 font-medium mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-700 uppercase tracking-wider">Rapport</span>
                <span className="text-[10px] text-slate-700">{tv.rapportScore.toFixed(1)}/5</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full"
                  style={{ width: `${tv.rapportScore * 20}%` }}
                />
              </div>
            </div>
          </div>

          {/* Formulación de caso */}
          {tv.hypothesis && (
            <div>
              <SectionLabel>Hipótesis clínica</SectionLabel>
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-4">
                <p className="text-sm text-slate-300 leading-relaxed">{tv.hypothesis}</p>
              </div>
            </div>
          )}

          {tv.hypothesizedMechanism && (
            <div>
              <SectionLabel>Mecanismo hipotetizado</SectionLabel>
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-300">{tv.hypothesizedMechanism}</p>
                {tv.coreBeliefEvidence.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tv.coreBeliefEvidence.map((e, i) => (
                      <p key={i} className="text-xs text-slate-500 italic">"{e}"</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tv.functionalAnalysis && (
            <div>
              <SectionLabel>Análisis funcional ABC</SectionLabel>
              <div className="space-y-3">
                {[
                  { label: 'Antecedentes', items: tv.functionalAnalysis.antecedents, color: 'text-blue-400' },
                  { label: 'Conductas',    items: tv.functionalAnalysis.behaviors,   color: 'text-amber-400' },
                  { label: 'Consecuencias',items: tv.functionalAnalysis.consequences,color: 'text-orange-400' },
                ].map(({ label, items, color }) => (
                  <div key={label}>
                    <p className={`text-xs font-medium ${color} mb-1`}>{label}</p>
                    <ul className="space-y-0.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-slate-400 flex gap-2">
                          <span className="text-slate-700">·</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tv.learningHistory && (
            <div>
              <SectionLabel>Historia de aprendizaje</SectionLabel>
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3">
                <p className="text-sm text-slate-300 leading-relaxed">{tv.learningHistory}</p>
              </div>
            </div>
          )}

          {tv.session2Suggestions.length > 0 && (
            <div>
              <SectionLabel>Sugerencias para sesión 2</SectionLabel>
              <ul className="space-y-1.5">
                {tv.session2Suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-amber-600 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Temas detectados */}
          {tv.detectedThemes.length > 0 && (
            <div>
              <SectionLabel>Temas narrativos</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {tv.detectedThemes.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-[10px] text-slate-500 capitalize">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vista Paciente ── */}
      {view === 'patient' && (
        <div className="space-y-5">
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-4">
            <p className="text-sm text-slate-300 leading-relaxed">{pv.mainMessage}</p>
          </div>

          {pv.problemList.length > 0 && (
            <div>
              <SectionLabel>Lo que identificamos juntos</SectionLabel>
              <ul className="space-y-1.5">
                {pv.problemList.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-400">
                    <span className="text-amber-600 shrink-0">·</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pv.connectingPattern && (
            <div>
              <SectionLabel>El patrón que conecta todo</SectionLabel>
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-300">{pv.connectingPattern}</p>
              </div>
            </div>
          )}

          {pv.precipitant && (
            <div>
              <SectionLabel>Por qué consultaste ahora</SectionLabel>
              <p className="text-sm text-slate-400">{pv.precipitant}</p>
            </div>
          )}

          {pv.strengths.length > 0 && (
            <div>
              <SectionLabel>Tus fortalezas y recursos</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {pv.strengths.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-950/30 border border-emerald-900/40 rounded-full text-xs text-emerald-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {pv.nextSteps && (
            <div>
              <SectionLabel>Próximos pasos</SectionLabel>
              <p className="text-sm text-slate-400 leading-relaxed">{pv.nextSteps}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Subcomponente: detalle de carpeta ─────────────────────────────────────────

function PatientFolderDetail({
  folder,
  patient,
  onBack,
}: {
  folder: PatientFolder;
  patient: PatientRegistration | null;
  onBack: () => void;
}) {
  const { updatePatient, updateTherapistNotes } = usePatientStore();
  const [view,  setView]  = useState<'datos' | 'reporte' | 'notas' | 'patrones'>('datos');
  const [notes, setNotes] = useState(folder.therapistNotes);
  const [saving, setSaving] = useState(false);

  // Edición de datos del paciente
  const [editAlias,       setEditAlias]       = useState(patient?.alias ?? '');
  const [editGender,      setEditGender]       = useState(patient?.gender ?? '');
  const [editReferral,    setEditReferral]    = useState(patient?.referralNotes ?? '');
  const [editPrevNotes,   setEditPrevNotes]   = useState(patient?.previousTreatmentNotes ?? '');
  const [editMedNotes,    setEditMedNotes]    = useState(patient?.currentMedicationNotes ?? '');
  const [editAreas,       setEditAreas]       = useState<LifeArea[]>(patient?.affectedAreas ?? []);
  const [editSaved,       setEditSaved]       = useState(false);

  function handleSaveNotes() {
    setSaving(true);
    updateTherapistNotes(folder.patientId, notes);
    setTimeout(() => setSaving(false), 800);
  }

  function handleSavePatientData() {
    if (!patient) return;
    updatePatient(patient.patientId, {
      alias:                   editAlias.trim(),
      gender:                  editGender.trim(),
      referralNotes:           editReferral.trim(),
      previousTreatmentNotes:  editPrevNotes.trim(),
      currentMedicationNotes:  editMedNotes.trim(),
      affectedAreas:           editAreas,
    });
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 1500);
  }

  function toggleArea(area: LifeArea) {
    setEditAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  return (
    <div>
      {/* Header de carpeta */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="mt-0.5 text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Volver
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-medium text-slate-200">
              {patient?.alias ?? 'Paciente'}
            </h2>
            <div className={clsx(
              'w-2 h-2 rounded-full',
              folder.interviewReport ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse',
            )} />
          </div>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">{folder.patientId}</p>
          <p className="text-[10px] text-slate-700 mt-0.5">
            Registrado el {formatDate(folder.createdAt)}
            {patient?.age ? ` · ${patient.age} años` : ''}
            {patient?.gender ? ` · ${patient.gender}` : ''}
          </p>
        </div>
        {!folder.interviewReport && (
          <span className="text-[10px] px-2 py-1 bg-amber-950/40 border border-amber-900/30 rounded-full text-amber-600">
            Entrevista pendiente
          </span>
        )}
        {folder.interviewReport && (
          <span className="text-[10px] px-2 py-1 bg-emerald-950/40 border border-emerald-900/30 rounded-full text-emerald-500">
            Entrevista completada
          </span>
        )}
      </div>

      {/* Tabs internas */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit mb-6">
        {(['datos', 'reporte', 'patrones', 'notas'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'text-xs px-4 py-1.5 rounded-lg transition-all capitalize',
              view === v
                ? 'bg-slate-700/80 text-slate-100'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {v === 'datos' ? 'Datos' : v === 'reporte' ? 'Reporte' : 'Notas'}
          </button>
        ))}
      </div>

      {/* ── Datos de registro ── */}
      {view === 'datos' && patient && (
        <div className="space-y-4">
          <SectionLabel>Datos de registro — editables</SectionLabel>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Nombre / alias</label>
              <input
                value={editAlias}
                onChange={(e) => setEditAlias(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-800/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Género</label>
              <input
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-800/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">Derivación</label>
              <p className="text-xs text-slate-500 mb-1">
                {patient.referralSource ? REFERRAL_LABELS[patient.referralSource] : 'No especificado'}
              </p>
              <input
                value={editReferral}
                onChange={(e) => setEditReferral(e.target.value)}
                placeholder="Notas de derivación…"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-800/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">
                Tratamientos previos
                <span className="ml-2 text-slate-700">
                  {patient.previousTreatment === true ? '— Sí'
                    : patient.previousTreatment === false ? '— No'
                    : '— No especificado'}
                </span>
              </label>
              <textarea
                value={editPrevNotes}
                onChange={(e) => setEditPrevNotes(e.target.value)}
                rows={2}
                placeholder="Notas sobre tratamientos anteriores…"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 resize-none focus:outline-none focus:border-amber-800/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">
                Medicación actual
                <span className="ml-2 text-slate-700">
                  {patient.currentMedication === true ? '— Sí'
                    : patient.currentMedication === false ? '— No'
                    : '— No especificado'}
                </span>
              </label>
              <input
                value={editMedNotes}
                onChange={(e) => setEditMedNotes(e.target.value)}
                placeholder="¿Cuál? ¿Dosis?…"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-800/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-2">Áreas afectadas</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(LIFE_AREA_LABELS) as LifeArea[]).map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs border transition-all',
                      editAreas.includes(area)
                        ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700',
                    )}
                  >
                    {LIFE_AREA_LABELS[area]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <p className="text-xs text-slate-700">
              Motivo de contacto inicial: <span className="text-slate-600 italic">"{patient.initialContact.slice(0, 80)}{patient.initialContact.length > 80 ? '…' : ''}"</span>
            </p>
            <button
              onClick={handleSavePatientData}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-xl text-xs font-medium text-white transition-colors"
            >
              {editSaved ? '✓ Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      {/* ── Reporte ── */}
      {view === 'reporte' && (
        folder.interviewReport
          ? <ReportView report={folder.interviewReport} />
          : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <span className="text-slate-600 text-lg">○</span>
              </div>
              <p className="text-sm text-slate-500">La entrevista aún no fue completada</p>
              <p className="text-xs text-slate-700 mt-1">El reporte aparecerá aquí automáticamente cuando se envíe desde el módulo de entrevista.</p>
            </div>
          )
      )}

      {/* ── Notas del terapeuta ── */}
      {view === 'patrones' && (
        <div>
          <PatternAnalysisPanel patientId={folder.patientId} />
        </div>
      )}

      {view === 'notas' && (
        <div className="space-y-3">
          <SectionLabel>Notas clínicas — uso exclusivo del terapeuta</SectionLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            placeholder="Observaciones clínicas, hipótesis de trabajo, notas de sesión…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder:text-slate-700 resize-none focus:outline-none focus:border-amber-800/50"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-xl text-xs font-medium text-white transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar notas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PatientsTab() {
  const { patientFolders, activePatient } = usePatientStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Encontrar el paciente registration para un folder
  function getPatientForFolder(folder: PatientFolder): PatientRegistration | null {
    if (activePatient?.patientId === folder.patientId) return activePatient;
    return null;
  }

  if (selectedId) {
    const folder  = patientFolders.find((f) => f.patientId === selectedId);
    if (folder) {
      return (
        <PatientFolderDetail
          folder={folder}
          patient={getPatientForFolder(folder)}
          onBack={() => setSelectedId(null)}
        />
      );
    }
  }

  if (patientFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <span className="text-2xl text-slate-700">○</span>
        </div>
        <p className="text-sm text-slate-500">No hay pacientes registrados aún</p>
        <p className="text-xs text-slate-700 mt-1.5 max-w-xs">
          Las carpetas de pacientes aparecerán aquí automáticamente cuando se complete el registro desde la pantalla de inicio.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-medium text-slate-200">Carpetas de pacientes</h2>
          <p className="text-xs text-slate-600 mt-0.5">{patientFolders.length} {patientFolders.length === 1 ? 'paciente registrado' : 'pacientes registrados'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {patientFolders.map((folder) => {
          const patient    = getPatientForFolder(folder);
          const hasReport  = !!folder.interviewReport;
          const isActive   = activePatient?.patientId === folder.patientId;

          return (
            <button
              key={folder.patientId}
              onClick={() => setSelectedId(folder.patientId)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900/80 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-2 h-2 rounded-full shrink-0',
                  hasReport ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse',
                )} />
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {patient?.alias ?? folder.patientId}
                    {isActive && (
                      <span className="ml-2 text-[10px] text-amber-600 font-normal">activo</span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">{folder.patientId}</p>
                  {patient && (
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      {patient.age} años · {patient.gender}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={clsx(
                  'text-[10px] px-2 py-0.5 rounded-full border',
                  hasReport
                    ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-500'
                    : 'bg-amber-950/30 border-amber-900/30 text-amber-600',
                )}>
                  {hasReport ? 'Entrevista completa' : 'Pendiente'}
                </span>
                <p className="text-[10px] text-slate-700 mt-1">
                  {formatDate(folder.createdAt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
