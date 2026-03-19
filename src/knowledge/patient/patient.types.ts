// Tipos principales del Módulo Paciente para TCC-Lab
// Rigurosamente alineados con el plan clínico y la trazabilidad

export interface PatientProfile {
    id: string; // UUID
    nombre: string;
    apellido: string;
    fechaNacimiento: string; // ISO
    sexo: 'masculino' | 'femenino' | 'otro';
    motivoConsulta: string;
    contacto?: {
        email?: string;
        telefono?: string;
    };
    fechaIngreso: string; // ISO
}

export interface ClinicalHistory {
    antecedentesPersonales: string[];
    antecedentesFamiliares: string[];
    historiaProblema: string;
    tratamientosPrevios?: string[];
    medicacionActual?: string[];
    eventosVitales?: string[];
}

export interface CaseFormulation {
    analisisFuncional: string;
    hipotesis: string;
    diagnosticoFuncional: string;
    factoresMantenimiento?: string[];
    riesgos?: string[];
}

export interface TreatmentPlan {
    objetivos: string[];
    tecnicas: string[];
    cronograma: Array<{
        sesion: number;
        fecha: string; // ISO
        objetivo: string;
        tecnica: string;
    }>;
}

export interface SessionRecord {
    sesion: number;
    fecha: string; // ISO
    notas: string;
    tareasAsignadas: string[];
    tareasCumplidas: string[];
    incidencias?: string[];
}

export interface InventoryTimeline {
    inventario: 'BDI-II' | 'BADS' | 'PHQ-9';
    administraciones: Array<{
        fecha: string; // ISO
        puntuacion: number;
        subescalas?: Record<string, number>;
        alertaCritica?: boolean;
        validez?: 'válido' | 'inconsistente' | 'simulación' | 'deseabilidad';
    }>;
}

// Modelo completo de paciente
export interface Patient {
    profile: PatientProfile;
    history: ClinicalHistory;
    formulation: CaseFormulation;
    plan: TreatmentPlan;
    sesiones: SessionRecord[];
    inventarios: InventoryTimeline[];
}
