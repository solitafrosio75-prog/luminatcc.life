import { create } from 'zustand';
import {
    Patient,
    PatientProfile,
    ClinicalHistory,
    SessionRecord,
    InventoryTimeline,
} from './patient.types';
import { generateChangeAnalysesBDI, ChangeAnalysis } from './change.analysis';
import {
    createPatient,
    getPatientById,
    updatePatient,
    createClinicalHistory,
    createSessionRecord,
    createInventoryTimeline,
} from '../../db/sqlite';

// ──────────────────────────────────────────────────────────────────────────────
// Adaptadores: traducen entre el modelo de dominio y el contrato plano de la DB
// ──────────────────────────────────────────────────────────────────────────────

function adaptPatientForDB(p: Patient): Parameters<typeof createPatient>[0] {
    return {
        id: p.profile.id,
        nombre: p.profile.nombre,
        apellido: p.profile.apellido,
        fechaNacimiento: p.profile.fechaNacimiento,
        sexo: p.profile.sexo,
        motivoConsulta: p.profile.motivoConsulta,
        contacto: p.profile.contacto,
        fechaIngreso: p.profile.fechaIngreso,
    };
}

function adaptHistoryForDB(
    history: ClinicalHistory,
    patientId: string,
): Parameters<typeof createClinicalHistory>[0] {
    return {
        id: `ch_${patientId}_${Date.now()}`,
        antecedentesPersonales: history.antecedentesPersonales,
        antecedentesFamiliares: history.antecedentesFamiliares,
        historiaProblema: history.historiaProblema,
        tratamientosPrevios: history.tratamientosPrevios,
        medicacionActual: history.medicacionActual,
        eventosVitales: history.eventosVitales,
        patientId,
    };
}

function adaptSessionForDB(
    record: SessionRecord,
    patientId: string,
): Parameters<typeof createSessionRecord>[0] {
    return {
        id: `sr_${patientId}_${record.sesion}_${Date.now()}`,
        sesion: record.sesion,
        fecha: record.fecha,
        notas: record.notas,
        tareasAsignadas: record.tareasAsignadas,
        patientId,
    };
}

function adaptInventoryForDB(
    timeline: InventoryTimeline,
    patientId: string,
): Parameters<typeof createInventoryTimeline>[0] {
    return {
        id: `it_${patientId}_${timeline.inventario}_${Date.now()}`,
        inventario: timeline.inventario,
        fecha: timeline.administraciones[timeline.administraciones.length - 1]?.fecha ?? '',
        resultado: timeline.administraciones,
        patientId,
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// Paciente vacío por defecto para inicialización sin datos previos
// ──────────────────────────────────────────────────────────────────────────────

const EMPTY_PROFILE: PatientProfile = {
    id: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    sexo: 'otro',
    motivoConsulta: '',
    fechaIngreso: '',
};

const EMPTY_HISTORY: ClinicalHistory = {
    antecedentesPersonales: [],
    antecedentesFamiliares: [],
    historiaProblema: '',
};

// ──────────────────────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────────────────────

interface PatientStore {
    patient: Patient | null;
    loadPatient: (id: string) => void;
    setProfile: (profile: PatientProfile) => void;
    setHistory: (history: ClinicalHistory) => void;
    addSession: (record: SessionRecord) => void;
    addInventory: (timeline: InventoryTimeline) => void;
    updateTaskStatus: (sesion: number, tarea: string, cumplida: boolean) => void;
    getChangeAnalysesBDI: () => ChangeAnalysis[];
    reset: () => void;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
    patient: null,

    loadPatient: (id) => {
        const dbRow = getPatientById(id);
        if (!dbRow) return;
        // La DB devuelve un row plano; reconstruimos el modelo de dominio mínimo
        // El resto de las sub-entidades (history, sesiones, etc.) se cargarían
        // con queries adicionales si fuera necesario.
        const patient: Patient = {
            profile: {
                id: (dbRow as any).id ?? '',
                nombre: (dbRow as any).nombre ?? '',
                apellido: (dbRow as any).apellido ?? '',
                fechaNacimiento: (dbRow as any).fechaNacimiento ?? '',
                sexo: (dbRow as any).sexo ?? 'otro',
                motivoConsulta: (dbRow as any).motivoConsulta ?? '',
                contacto: (dbRow as any).contacto,
                fechaIngreso: (dbRow as any).fechaIngreso ?? '',
            },
            history: EMPTY_HISTORY,
            formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
            plan: { objetivos: [], tecnicas: [], cronograma: [] },
            sesiones: [],
            inventarios: [],
        };
        set({ patient });
    },

    setProfile: (profile) => {
        set((state) => {
            const newPatient: Patient = state.patient
                ? { ...state.patient, profile }
                : {
                      profile,
                      history: EMPTY_HISTORY,
                      formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
                      plan: { objetivos: [], tecnicas: [], cronograma: [] },
                      sesiones: [],
                      inventarios: [],
                  };
            createPatient(adaptPatientForDB(newPatient));
            return { patient: newPatient };
        });
    },

    setHistory: (history) => {
        set((state) => {
            const newPatient: Patient = state.patient
                ? { ...state.patient, history }
                : {
                      profile: EMPTY_PROFILE,
                      history,
                      formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
                      plan: { objetivos: [], tecnicas: [], cronograma: [] },
                      sesiones: [],
                      inventarios: [],
                  };
            updatePatient(newPatient.profile.id, { historia: JSON.stringify(history) } as any);
            createClinicalHistory(adaptHistoryForDB(history, newPatient.profile.id));
            return { patient: newPatient };
        });
    },

    addSession: (record) => {
        set((state) => {
            if (!state.patient) return { patient: null };
            createSessionRecord(adaptSessionForDB(record, state.patient.profile.id));
            const newSesiones = [...state.patient.sesiones, record];
            return { patient: { ...state.patient, sesiones: newSesiones } };
        });
    },

    addInventory: (timeline) => {
        set((state) => {
            if (!state.patient) return { patient: null };
            createInventoryTimeline(adaptInventoryForDB(timeline, state.patient.profile.id));
            const newInventarios = [...state.patient.inventarios, timeline];
            return { patient: { ...state.patient, inventarios: newInventarios } };
        });
    },

    updateTaskStatus: (sesion, tarea, cumplida) => {
        set((state) => {
            if (!state.patient) return { patient: null };
            const sesiones = state.patient.sesiones.map((s) => {
                if (s.sesion !== sesion) return s;
                if (cumplida) {
                    return {
                        ...s,
                        tareasCumplidas: [...s.tareasCumplidas, tarea],
                        tareasAsignadas: s.tareasAsignadas.filter((t) => t !== tarea),
                    };
                } else {
                    return {
                        ...s,
                        tareasAsignadas: [...s.tareasAsignadas, tarea],
                        tareasCumplidas: s.tareasCumplidas.filter((t) => t !== tarea),
                    };
                }
            });
            return { patient: { ...state.patient, sesiones } };
        });
    },

    getChangeAnalysesBDI: () => {
        const patient = get().patient;
        if (!patient) return [];
        const timeline = patient.inventarios.find((i) => i.inventario === 'BDI-II');
        if (!timeline) return [];
        return generateChangeAnalysesBDI(
            timeline.administraciones.map((a) => ({ fecha: a.fecha, puntuacion: a.puntuacion })),
        );
    },

    reset: () => set({ patient: null }),
}));
