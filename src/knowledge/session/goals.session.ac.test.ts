/**
 * goals.session.ac.test.ts — Tests del flujo de objetivos (fase 4 AC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 */

import { describe, it, expect, vi } from 'vitest';
import { runGoalsSessionAC, type GoalsSessionInput } from './goals.session.ac';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';

// ============================================================================
// Mocks
// ============================================================================

const { orchestrateSessionMock } = vi.hoisted(() => ({
    orchestrateSessionMock: vi.fn(),
}));

vi.mock('./kb-loader', () => ({
    loadKBData: vi.fn().mockImplementation((_tech: string, area: string) => {
        if (area === 'ac_valores_reforzadores') {
            return Promise.resolve({
                objetivos_terapeuticos: [
                    { objetivo: 'Autonomía (Dominio)', descripcion: 'Recuperar capacidad funcional.' },
                    { objetivo: 'Conexión Social (Placer)', descripcion: 'Restablecer vínculos.' },
                ],
                valores_nucleares: [
                    { valor: 'Persistencia (acción pese a la apatía)', definicion: 'Actuar pese a no sentir motivación.' },
                    { valor: 'Autocompasión', definicion: 'Tratarse con amabilidad.' },
                ],
            });
        }
        if (area === 'ac_areas_vitales') {
            return Promise.resolve({
                areas_vitales: [
                    { nombre: 'Relaciones Interpersonales', descripcion: 'Vínculos sociales.' },
                    { nombre: 'Cuidado Personal y Salud', descripcion: 'Autocuidado.' },
                ],
            });
        }
        return Promise.resolve({});
    }),
}));

vi.mock('./session.orchestrator', async (importOriginal) => {
    const orig = await importOriginal<typeof import('./session.orchestrator')>();
    return { ...orig, orchestrateSession: orchestrateSessionMock };
});

// ============================================================================
// Fixtures
// ============================================================================

const paciente: Patient = {
    profile: {
        id: '5', nombre: 'Elena', apellido: 'Martín', fechaNacimiento: '1995-11-10',
        sexo: 'femenino', motivoConsulta: 'Desmotivación y aislamiento', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Aislamiento creciente.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 22, alertaCritica: false }],
    }],
};

const baseContext: SessionContext = {
    paciente,
    ultimaSesion: 4,
    estadoEmocional: 'tristeza',
    fase: 'inicio',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Establecer objetivos',
    recursos: ['brújula de valores'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo objetivos (fase 4 AC)', () => {
    it('Caso feliz: objetivos SMART bien formulados, score alto', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: GoalsSessionInput = {
            primaryObjective: 'Salir a caminar 30 minutos tres veces por semana para mejorar mi ánimo',
            shortTermGoals: ['Caminar 10 min esta semana', 'Aumentar a 20 min la próxima'],
            measurableIndicator: 'Puntuación del BDI-II baja de 22 a 15',
            startIntensity: 7,
            targetIntensity: 4,
        };

        const result = await runGoalsSessionAC(baseContext, input);

        expect(result.smartValidation.score).toBeGreaterThanOrEqual(4);
        expect(result.smartValidation.specific).toBe(true);
        expect(result.smartValidation.measurable).toBe(true);
        expect(result.smartValidation.achievable).toBe(true);
        expect(result.intensityReduction.percentReduction).toBe(43);
        // Objetivos terapéuticos del KB
        expect(result.therapeuticObjectives.length).toBeGreaterThan(0);
    });

    it('Caso de objetivo irreal: reducción >70%, no achievable', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: GoalsSessionInput = {
            primaryObjective: 'Ser completamente feliz en una semana',
            shortTermGoals: ['Dejar de sentir tristeza mañana'],
            measurableIndicator: 'Sentirme perfecto',
            startIntensity: 9,
            targetIntensity: 1,
        };

        const result = await runGoalsSessionAC(baseContext, input);

        expect(result.smartValidation.achievable).toBe(false);
        expect(result.intensityReduction.percentReduction).toBe(89);
        expect(result.smartValidation.feedback).toContain('Revisar');
    });

    it('Caso mínimo: sin short-term goals, score bajo', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: GoalsSessionInput = {
            primaryObjective: 'Mejorar',
            shortTermGoals: [],
            measurableIndicator: '',
            startIntensity: 0,
            targetIntensity: 0,
        };

        const result = await runGoalsSessionAC(baseContext, input);

        expect(result.smartValidation.score).toBeLessThanOrEqual(2);
        expect(result.smartValidation.specific).toBe(false);
        expect(result.smartValidation.feedback).toContain('reformulación');
    });
});
