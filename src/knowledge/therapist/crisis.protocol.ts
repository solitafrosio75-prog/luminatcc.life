// Flujo de protocolo de crisis para el sistema TCC
// Implementa la lógica de activación, pasos y bloqueo de intervenciones

import protocoloCrisis from '../shared/data/protocolo_crisis.json';

export type CrisisState =
    | 'inactivo'
    | 'activado'
    | 'evaluando_riesgo'
    | 'asegurando_seguridad'
    | 'contencion_emocional'
    | 'plan_seguridad'
    | 'red_apoyo'
    | 'finalizado';

export interface CrisisSession {
    estado: CrisisState;
    pasosCompletados: number[];
    fechaActivacion: string;
    motivo: string;
    bloqueo: boolean;
}

// Activación automática desde alertas (ej: BDI-II ítem 9)
export function activarProtocoloCrisis(motivo: string): CrisisSession {
    return {
        estado: 'activado',
        pasosCompletados: [],
        fechaActivacion: new Date().toISOString(),
        motivo,
        bloqueo: true,
    };
}

// Secuencia de pasos según protocolo (inmutable — no muta el objeto de entrada)
export function avanzarPasoCrisis(session: CrisisSession): CrisisSession {
    const pasos = protocoloCrisis.pasos_intervencion;
    const actual = session.pasosCompletados.length;
    if (actual < pasos.length) {
        return {
            ...session,
            pasosCompletados: [...session.pasosCompletados, pasos[actual].paso],
            estado: mapPasoToEstado(pasos[actual].paso),
            bloqueo: true,
        };
    }
    return {
        ...session,
        estado: 'finalizado',
        bloqueo: false,
    };
}

function mapPasoToEstado(paso: number): CrisisState {
    switch (paso) {
        case 1: return 'evaluando_riesgo';
        case 2: return 'asegurando_seguridad';
        case 3: return 'contencion_emocional';
        case 4: return 'plan_seguridad';
        case 5: return 'red_apoyo';
        default: return 'activado';
    }
}

// Bloqueo de otras intervenciones durante crisis activa
export function isBloqueoActivo(session: CrisisSession): boolean {
    return session.bloqueo && session.estado !== 'finalizado';
}

// Integración: activar desde evaluador ético si se detecta crisis
// Ejemplo: if (alerta.level === 'emergency') activarProtocoloCrisis(alerta.message)
