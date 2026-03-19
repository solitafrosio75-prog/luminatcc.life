// src/stores/activePatient.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActivePatientState {
    patientRecordId: number | null;
    clinicalProfileId: number | null;  // Siempre 1 por ahora, preparado para n
    setActivePatient: (recordId: number, profileId: number) => void;
    clearActivePatient: () => void;
}

export const useActivePatient = create<ActivePatientState>()(
    persist(
        (set) => ({
            patientRecordId: null,
            clinicalProfileId: null,
            setActivePatient: (recordId, profileId) =>
                set({ patientRecordId: recordId, clinicalProfileId: profileId }),
            clearActivePatient: () =>
                set({ patientRecordId: null, clinicalProfileId: null }),
        }),
        { name: 'active-patient' }  // Persiste en localStorage
    )
);
// El `persist` es clave para ADHD UX — si el terapeuta cierra accidentalmente el navegador, no pierde el contexto del paciente activo.

//**Paso 3 — El flujo de selección de paciente**

//Es una pantalla simple que ya puedes construir porque tienes la lista en `PatientRecord`. El flujo es:
//Lista de pacientes
// → Click en paciente
//→ setActivePatient(record.id, profile.id)
//→ Redirige a / session / new  ← aquí empieza el módulo de sesión//