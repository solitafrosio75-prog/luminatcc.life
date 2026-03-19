/**
 * crisis.protocol.test.ts — Tests del protocolo de crisis
 *
 * Casos cubiertos:
 *   - Activación crea sesión de crisis correcta
 *   - avanzarPasoCrisis() NO muta el original (inmutabilidad)
 *   - Progresión completa por los 6 pasos hasta 'finalizado'
 *   - isBloqueoActivo() durante y después de crisis
 *   - Acumulación correcta de pasosCompletados
 */

import { describe, it, expect } from 'vitest';
import {
    activarProtocoloCrisis,
    avanzarPasoCrisis,
    isBloqueoActivo,
} from './crisis.protocol';

describe('activarProtocoloCrisis', () => {
    it('crea sesión de crisis con estado activado y bloqueo', () => {
        const session = activarProtocoloCrisis('riesgo suicida detectado');

        expect(session.estado).toBe('activado');
        expect(session.pasosCompletados).toEqual([]);
        expect(session.bloqueo).toBe(true);
        expect(session.motivo).toBe('riesgo suicida detectado');
        expect(session.fechaActivacion).toBeTruthy();
    });
});

describe('avanzarPasoCrisis — inmutabilidad', () => {
    it('NO muta el objeto original al avanzar un paso', () => {
        const original = activarProtocoloCrisis('test');
        const originalPasos = [...original.pasosCompletados];
        const originalEstado = original.estado;

        const next = avanzarPasoCrisis(original);

        // Original NO fue mutado
        expect(original.pasosCompletados).toEqual(originalPasos);
        expect(original.estado).toBe(originalEstado);
        expect(original.pasosCompletados.length).toBe(0);

        // Nuevo objeto SÍ tiene el paso
        expect(next.pasosCompletados).toEqual([1]);
        expect(next.estado).toBe('evaluando_riesgo');
        expect(next.bloqueo).toBe(true);

        // Son objetos distintos
        expect(next).not.toBe(original);
    });
});

describe('avanzarPasoCrisis — progresión completa', () => {
    it('progresa por los 6 pasos y finaliza', () => {
        let session = activarProtocoloCrisis('test progresión');

        // Paso 1: Evaluar riesgo
        session = avanzarPasoCrisis(session);
        expect(session.pasosCompletados).toEqual([1]);
        expect(session.estado).toBe('evaluando_riesgo');
        expect(session.bloqueo).toBe(true);

        // Paso 2: Seguridad inmediata
        session = avanzarPasoCrisis(session);
        expect(session.pasosCompletados).toEqual([1, 2]);
        expect(session.estado).toBe('asegurando_seguridad');

        // Paso 3: Contención emocional
        session = avanzarPasoCrisis(session);
        expect(session.pasosCompletados).toEqual([1, 2, 3]);
        expect(session.estado).toBe('contencion_emocional');

        // Paso 4: Plan de seguridad
        session = avanzarPasoCrisis(session);
        expect(session.pasosCompletados).toEqual([1, 2, 3, 4]);
        expect(session.estado).toBe('plan_seguridad');

        // Paso 5: Red de apoyo
        session = avanzarPasoCrisis(session);
        expect(session.pasosCompletados).toEqual([1, 2, 3, 4, 5]);
        expect(session.estado).toBe('red_apoyo');

        // Paso 6: Seguimiento post-crisis
        session = avanzarPasoCrisis(session);
        expect(session.pasosCompletados).toEqual([1, 2, 3, 4, 5, 6]);
        // Paso 6 no tiene case en mapPasoToEstado → 'activado' (default)
        expect(session.bloqueo).toBe(true);

        // Paso más allá: finalizar
        session = avanzarPasoCrisis(session);
        expect(session.estado).toBe('finalizado');
        expect(session.bloqueo).toBe(false);
    });

    it('pasosCompletados se acumula sin perder pasos anteriores', () => {
        let session = activarProtocoloCrisis('acumulación');
        for (let i = 0; i < 4; i++) {
            session = avanzarPasoCrisis(session);
        }
        expect(session.pasosCompletados).toHaveLength(4);
        expect(session.pasosCompletados).toEqual([1, 2, 3, 4]);
    });
});

describe('isBloqueoActivo', () => {
    it('retorna true durante crisis activa', () => {
        const session = activarProtocoloCrisis('test bloqueo');
        expect(isBloqueoActivo(session)).toBe(true);
    });

    it('retorna true durante pasos intermedios', () => {
        let session = activarProtocoloCrisis('test');
        session = avanzarPasoCrisis(session);
        session = avanzarPasoCrisis(session);
        expect(isBloqueoActivo(session)).toBe(true);
    });

    it('retorna false cuando la crisis ha finalizado', () => {
        let session = activarProtocoloCrisis('test');
        // Avanzar hasta finalizar
        for (let i = 0; i < 7; i++) {
            session = avanzarPasoCrisis(session);
        }
        expect(session.estado).toBe('finalizado');
        expect(isBloqueoActivo(session)).toBe(false);
    });
});
