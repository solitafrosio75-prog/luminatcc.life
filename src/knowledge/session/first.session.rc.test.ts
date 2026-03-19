/**
 * first.session.rc.test.ts — Tests del flujo de sesión 1 RC
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * Patrón idéntico a first.session.ac.test.ts con datos RC-específicos.
 */

import { describe, it, expect, vi } from 'vitest';
import { runFirstSessionRC } from './first.session.rc';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';

// ============================================================================
// Mocks — vi.hoisted() se ejecuta ANTES de vi.mock() en el hoisting
// ============================================================================

const { orchestrateSessionMock } = vi.hoisted(() => ({
    orchestrateSessionMock: vi.fn(),
}));

vi.mock('./kb-loader', () => ({
    loadKBData: vi.fn().mockResolvedValue({
        fundamentos_teoricos: {
            mecanismo_de_cambio: 'La RC identifica y modifica pensamientos automáticos distorsionados mediante evidencia.',
        },
    }),
}));

vi.mock('./session.orchestrator', async (importOriginal) => {
    const orig = await importOriginal<typeof import('./session.orchestrator')>();
    return {
        ...orig,
        orchestrateSession: orchestrateSessionMock,
    };
});

// ============================================================================
// Fixtures
// ============================================================================

const pacienteModerado: Patient = {
    profile: {
        id: '1', nombre: 'Carlos', apellido: 'Martínez', fechaNacimiento: '1985-05-15',
        sexo: 'masculino', motivoConsulta: 'Pensamientos negativos recurrentes', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Autocrítica constante.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 18, alertaCritica: false }],
    }],
};

const pacienteRiesgo: Patient = {
    ...pacienteModerado,
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 25, alertaCritica: true }],
    }],
};

const pacienteMinimo: Patient = {
    ...pacienteModerado,
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 8, alertaCritica: false }],
    }],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo sesión 1 RC', () => {
    it('Caso feliz: depresión leve, psicoeducación RC desde KB, tarea de registro de pensamientos', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Iniciar registro de pensamientos y psicoeducación cognitiva',
            recursos: ['psicoeducación modelo cognitivo', 'registro 3 columnas'],
            mensaje: '[empático] Sesión RC en curso.',
            validacionEtica: 'No se detectan restricciones éticas para RC.',
            salida: 'Sesión completada',
        });

        const context: SessionContext = {
            paciente: pacienteModerado,
            ultimaSesion: 1,
            estadoEmocional: 'tristeza',
            fase: 'inicio',
            inventarios: [],
            alertaCrisis: false,
        };
        const result = await runFirstSessionRC(context);

        expect(result.bdiAdmin.puntuacion).toBe(18);
        expect(result.bdiAdmin.alertaCritica).toBe(false);
        expect(result.bdiAdmin.interpretacion).toContain('Depresión leve');
        // Psicoeducación RC cargada desde KB mock
        expect(result.psicoeducacion).toContain('RC identifica y modifica pensamientos automáticos');
        // Tarea RC: registro de pensamientos (no monitoreo de actividad como AC)
        expect(result.tareaAsignada).toContain('3 columnas');
        expect(result.tareaAsignada).toContain('Pensamiento');
        expect(result.presentacion).toContain('Carlos');
        expect(result.salida.decisionTerapeuta).toContain('registro de pensamientos');
    });

    it('Caso de riesgo: crisis activa, orquestador devuelve protocolo de crisis', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Activar protocolo de crisis — Paso 1: Evaluar el riesgo inmediato',
            recursos: ['Teléfono de la Esperanza (España): 717 003 717'],
            mensaje: 'Derivación obligatoria: riesgo suicida',
            validacionEtica: 'Derivación obligatoria: riesgo_suicida_alto',
            salida: 'Protocolo de crisis activado',
            crisisProtocol: {
                crisisSession: {
                    estado: 'activado', pasosCompletados: [], bloqueo: true,
                    fechaActivacion: '2026-03-15', motivo: 'riesgo_suicida_alto',
                },
                currentStepDetail: { paso: 1, accion: 'Evaluar el riesgo inmediato', detalle: '' },
                emergencyResources: [{ recurso: 'Emergencias', contacto: '112' }],
                contraindications: [], warningSignals: [],
            },
        });

        const context: SessionContext = {
            paciente: pacienteRiesgo,
            ultimaSesion: 1,
            estadoEmocional: 'desesperanza',
            fase: 'inicio',
            inventarios: [],
            alertaCrisis: true,
        };
        const result = await runFirstSessionRC(context);

        expect(result.bdiAdmin.alertaCritica).toBe(true);
        expect(result.bdiAdmin.interpretacion).toContain('¡Alerta crítica detectada!');
        expect(result.salida.decisionTerapeuta).toContain('protocolo de crisis');
        expect(result.salida.crisisProtocol).toBeDefined();
        expect(result.salida.crisisProtocol!.crisisSession.bloqueo).toBe(true);
    });

    it('Caso fallback: KB no disponible, usa psicoeducación por defecto', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Iniciar sesión',
            recursos: [], mensaje: 'OK',
            validacionEtica: 'Sin restricciones', salida: 'Sesión completada',
        });

        // Forzar error en loadKBData
        const { loadKBData } = await import('./kb-loader');
        (loadKBData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('KB unavailable'));

        const context: SessionContext = {
            paciente: pacienteMinimo,
            ultimaSesion: 1,
            estadoEmocional: 'neutro',
            fase: 'inicio',
            inventarios: [],
            alertaCrisis: false,
        };
        const result = await runFirstSessionRC(context);

        // Fallback de psicoeducación RC
        expect(result.psicoeducacion).toContain('Reestructuración Cognitiva');
        expect(result.psicoeducacion).toContain('interpretación');
        expect(result.bdiAdmin.interpretacion).toContain('Depresión mínima');
    });
});
