/**
 * intermediate.session.ac.test.ts — Tests del flujo de sesión 5 AC
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * Usa vi.hoisted() para declarar mocks accesibles desde vi.mock factories,
 * ya que vi.mock se hoistea antes de cualquier declaración del módulo.
 */

import { describe, it, expect, vi } from 'vitest';
import { runIntermediateSessionAC } from './intermediate.session.ac';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';
import type { ChangeAnalysis } from '../patient/change.analysis';

// ============================================================================
// Mocks — vi.hoisted() se ejecuta ANTES de vi.mock() en el hoisting
// ============================================================================

const { orchestrateSessionMock } = vi.hoisted(() => ({
    orchestrateSessionMock: vi.fn(),
}));

vi.mock('./kb-loader', () => ({
    loadKBData: vi.fn().mockResolvedValue({
        barreras: [
            {
                nombre: 'Evitación por baja energía',
                descripcion: 'Paciente reporta no tener energía.',
                ejemplo_paciente: 'No puedo salir a caminar.',
                estrategia_manejo: 'Validar cansancio, reducir a microtarea.',
            },
            {
                nombre: 'Rumiación que bloquea la acción',
                descripcion: 'Ciclos de pensamiento repetitivo.',
                ejemplo_paciente: 'Paso horas pensando.',
                estrategia_manejo: 'Implementar Hora de Preocuparse.',
            },
        ],
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

const pacienteProgreso: Patient = {
    profile: {
        id: '2', nombre: 'Luis', apellido: 'Pérez', fechaNacimiento: '1985-05-05',
        sexo: 'masculino', motivoConsulta: 'Desmotivación', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Desmotivación persistente.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [
            { fecha: '2026-03-01', puntuacion: 25 },
            { fecha: '2026-03-08', puntuacion: 18 },
        ],
    }],
};

const pacienteEmpeora: Patient = {
    ...pacienteProgreso,
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [
            { fecha: '2026-03-01', puntuacion: 18 },
            { fecha: '2026-03-08', puntuacion: 25 },
        ],
    }],
};

const traps = ['TRAP1', 'TRAP2'];

const changeProgreso: ChangeAnalysis[] = [
    { inventario: 'BDI-II', baseline: 25, followup: 18, diferencia: -7, tendencia: 'mejora', cambioClinico: 'significativo', criterioJacobsonTruax: true },
];

const changeEmpeora: ChangeAnalysis[] = [
    { inventario: 'BDI-II', baseline: 18, followup: 25, diferencia: 7, tendencia: 'empeora', cambioClinico: 'no-significativo', criterioJacobsonTruax: false },
];

const changeEstancado: ChangeAnalysis[] = [
    { inventario: 'BDI-II', baseline: 20, followup: 20, diferencia: 0, tendencia: 'estable', cambioClinico: 'no-significativo', criterioJacobsonTruax: false },
];

// ============================================================================
// Tests
// ============================================================================

describe('Flujo sesión 5 AC', () => {
    it('Caso de progreso: BDI-II baja, salida del orquestador real', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Ajustar plan según tendencia',
            recursos: ['psicoeducación', 'monitoreo actividad', 'feedback'],
            mensaje: '[empático, directivo] Reforzar monitoreo y ajustar plan',
            validacionEtica: 'No se detectan restricciones éticas para AC.',
            salida: 'Sesión completada',
        });

        const context: SessionContext = {
            paciente: pacienteProgreso,
            ultimaSesion: 5,
            estadoEmocional: 'tristeza',
            fase: 'intervencion',
            inventarios: changeProgreso,
            alertaCrisis: false,
        };
        const result = await runIntermediateSessionAC(context, changeProgreso, traps, ['energía']);

        expect(result.bdiComparacion.tendencia).toBe('mejora');
        expect(result.bdiComparacion.cambioClinico).toBe('significativo');
        expect(result.ajusteActividades).toContain('Se mantiene programación');
        expect(result.tracs).toHaveLength(2);
        expect(result.salida.decisionTerapeuta).toContain('Ajustar plan');
    });

    it('Caso de empeoramiento: reforzar programación + barreras KB match', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Reforzar programación de actividades',
            recursos: ['psicoeducación', 'monitoreo actividad'],
            mensaje: '[empático] Ajustar actividades',
            validacionEtica: 'Sin restricciones.',
            salida: 'Sesión completada',
        });

        const context: SessionContext = {
            paciente: pacienteEmpeora,
            ultimaSesion: 5,
            estadoEmocional: 'desesperanza',
            fase: 'intervencion',
            inventarios: changeEmpeora,
            alertaCrisis: false,
        };
        const result = await runIntermediateSessionAC(context, changeEmpeora, traps, ['rumiación']);

        expect(result.bdiComparacion.tendencia).toBe('empeora');
        expect(result.ajusteActividades).toContain('Se refuerza programación');
        expect(result.barrerasKBMatch.length).toBeGreaterThan(0);
        expect(result.barrerasKBMatch[0].nombre).toContain('Rumiación');
    });

    it('Caso de estancamiento: mantener programación, sin barreras match', async () => {
        orchestrateSessionMock.mockResolvedValue({
            decisionTerapeuta: 'Revisar barreras',
            recursos: ['monitoreo actividad'],
            mensaje: 'OK',
            validacionEtica: 'Sin restricciones.',
            salida: 'Sesión completada',
        });

        const context: SessionContext = {
            paciente: pacienteProgreso,
            ultimaSesion: 5,
            estadoEmocional: 'tristeza',
            fase: 'intervencion',
            inventarios: changeEstancado,
            alertaCrisis: false,
        };
        const result = await runIntermediateSessionAC(context, changeEstancado, traps, []);

        expect(result.bdiComparacion.tendencia).toBe('estable');
        expect(result.ajusteActividades).toContain('Se mantiene programación');
        expect(result.barrerasKBMatch).toHaveLength(0);
    });
});
