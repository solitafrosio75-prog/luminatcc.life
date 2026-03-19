/**
 * buildSessionContext — Construye un SessionContext desde los datos del sessionStore
 *
 * Los session flows necesitan un SessionContext con un Patient completo.
 * En el entorno del lab, el "paciente" es el propio usuario; este helper
 * construye un Patient mínimo a partir de los datos capturados en el store.
 *
 * SUDs (0-10) se usa como proxy de severidad — el BDI-II real se integra
 * cuando el sistema de inventarios del store esté conectado.
 */

import type { Patient } from '../../../knowledge/patient/patient.types';
import type { SessionContext } from '../../../knowledge/session/session.orchestrator';
import type { SessionState, ProtocolPhase } from '../../../shared/sessionStore';
import type { TechniqueId } from '../../../knowledge/types/technique.types';

// Mapeo fase del protocolo UI → fase del orquestador
const PHASE_MAP: Record<ProtocolPhase, SessionContext['fase']> = {
    intake: 'inicio',
    assessment: 'inicio',
    psychoeducation: 'inicio',
    goals: 'inicio',
    intervention: 'intervencion',
    evaluation: 'intervencion',
    followup: 'intervencion',
};

// Mapeo emoción del store → estado emocional del orquestador
function mapEmotionToEstado(emotion: string | null | undefined): SessionContext['estadoEmocional'] {
    switch (emotion) {
        case 'depression': return 'tristeza';
        case 'anxiety': return 'ansiedad';
        case 'anger': return 'ira';
        case 'fear': return 'ansiedad';
        case 'grief': return 'tristeza';
        case 'guilt':
        case 'shame':
        case 'overwhelm': return 'desesperanza';
        case 'numbness': return 'tristeza';
        default: return 'neutro';
    }
}

/**
 * Construye un SessionContext completo a partir del estado del sessionStore.
 *
 * Crea un Patient mínimo usando:
 * - userId como id del paciente
 * - intake.mainComplaint como motivo de consulta
 * - intake.intensityNow como proxy de puntuación BDI-II (SUDs * 6.3 ≈ BDI range)
 */
export function buildSessionContext(state: Pick<SessionState,
    'userId' | 'currentPhase' | 'intake' | 'assessment' | 'clinicalProfile'
>): SessionContext {
    const intensity = state.intake.intensityNow ?? 5;

    // Proxy: SUDs 0-10 → BDI-II 0-63 (multiplicar por 6.3)
    const bdiiProxy = Math.round(intensity * 6.3);
    const alertaCritica = intensity >= 8; // SUDs ≥ 8 → alerta crítica

    const patient: Patient = {
        profile: {
            id: state.userId,
            nombre: 'Paciente',
            apellido: 'Lab',
            fechaNacimiento: '1990-01-01',
            sexo: 'otro',
            motivoConsulta: state.intake.mainComplaint ?? 'Consulta de laboratorio',
            fechaIngreso: new Date().toISOString().split('T')[0],
        },
        history: {
            antecedentesPersonales: [],
            antecedentesFamiliares: [],
            historiaProblema: state.intake.mainComplaint ?? '',
        },
        formulation: {
            analisisFuncional: state.assessment?.situationContext ?? '',
            hipotesis: '',
            diagnosticoFuncional: '',
        },
        plan: { objetivos: [], tecnicas: [], cronograma: [] },
        sesiones: [],
        inventarios: [{
            inventario: 'BDI-II',
            administraciones: [{
                fecha: new Date().toISOString().split('T')[0],
                puntuacion: bdiiProxy,
                alertaCritica,
            }],
        }],
    };

    // Derivar técnica activa desde perfil clínico (default: 'ac')
    const techniqueId: TechniqueId = state.clinicalProfile?.primaryTechnique === 'rc' ? 'rc' : 'ac';

    return {
        paciente: patient,
        ultimaSesion: 1,
        estadoEmocional: mapEmotionToEstado(state.intake.emotionCategory),
        fase: PHASE_MAP[state.currentPhase] ?? 'inicio',
        inventarios: [],
        alertaCrisis: alertaCritica,
        techniqueId,
    };
}
