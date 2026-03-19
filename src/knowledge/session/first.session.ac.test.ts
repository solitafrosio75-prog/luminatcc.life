/**
 * first.session.ac.test.ts — Tests del flujo de sesión 1 AC
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * Usa vi.hoisted() para declarar mocks accesibles desde vi.mock factories,
 * ya que vi.mock se hoistea antes de cualquier declaración del módulo.
 */

import { describe, it, expect, vi } from 'vitest';
import { runFirstSessionAC } from './first.session.ac';
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
            mecanismo_de_cambio: 'La AC rompe el ciclo actuando directamente sobre la conducta.',
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
        id: '1', nombre: 'Ana', apellido: 'García', fechaNacimiento: '1990-01-01',
        sexo: 'femenino', motivoConsulta: 'Estado de ánimo bajo', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Tristeza persistente.' },
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
        administraciones: [{ fecha: '2026-03-01', puntuacion: 22, alertaCritica: true }],
    }],
};

const pacienteInconsistente: Patient = {
    ...pacienteModerado,
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 10, alertaCritica: false, validez: 'inconsistente' }],
    }],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo sesión 1 AC', () => {
    it('Caso feliz: depresión moderada, sin alerta, psicoeducación desde KB', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Iniciar monitoreo y psicoeducación',
            recursos: ['psicoeducación', 'monitoreo actividad'],
            mensaje: '[empático, acogedor] Sesión en curso.',
            validacionEtica: 'No se detectan restricciones éticas para AC.',
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
        const result = await runFirstSessionAC(context);

        expect(result.bdiAdmin.puntuacion).toBe(18);
        expect(result.bdiAdmin.alertaCritica).toBe(false);
        expect(result.bdiAdmin.interpretacion).toContain('Depresión leve');
        // Psicoeducación cargada desde KB mock
        expect(result.psicoeducacion).toContain('AC rompe el ciclo');
        // Salida del orquestador (mockeado)
        expect(result.salida.decisionTerapeuta).toContain('monitoreo');
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
        const result = await runFirstSessionAC(context);

        expect(result.bdiAdmin.alertaCritica).toBe(true);
        expect(result.salida.decisionTerapeuta).toContain('protocolo de crisis');
        expect(result.salida.crisisProtocol).toBeDefined();
        expect(result.salida.crisisProtocol!.crisisSession.bloqueo).toBe(true);
    });

    it('Caso de validez: respuestas inconsistentes, BDI bajo', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Iniciar monitoreo',
            recursos: [], mensaje: 'OK',
            validacionEtica: 'Sin restricciones', salida: 'Sesión completada',
        });

        const context: SessionContext = {
            paciente: pacienteInconsistente,
            ultimaSesion: 1,
            estadoEmocional: 'neutro',
            fase: 'inicio',
            inventarios: [],
            alertaCrisis: false,
        };
        const result = await runFirstSessionAC(context);

        expect(result.bdiAdmin.interpretacion).toContain('Depresión mínima');
        expect(result.presentacion).toContain('Ana');
    });
});
