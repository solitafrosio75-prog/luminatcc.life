/**
 * goals.session.rc.test.ts — Tests del flujo de objetivos (fase 4 RC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * Validación SMART + alineación con creencias nucleares.
 */

import { describe, it, expect, vi } from 'vitest';
import { runGoalsSessionRC, type GoalsSessionRCInput } from './goals.session.rc';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';

// ============================================================================
// Mocks
// ============================================================================

const { orchestrateSessionMock, loadKBDataMock } = vi.hoisted(() => ({
    orchestrateSessionMock: vi.fn(),
    loadKBDataMock: vi.fn(),
}));

vi.mock('./kb-loader', () => ({
    loadKBData: loadKBDataMock,
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
        id: '4', nombre: 'Pablo', apellido: 'Fernández', fechaNacimiento: '1990-03-20',
        sexo: 'masculino', motivoConsulta: 'Pensamientos de inutilidad', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Creencia de inutilidad.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 24, alertaCritica: false }],
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
    decisionTerapeuta: 'Continuar con establecimiento de objetivos',
    recursos: ['registro cognitivo'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

const mockObjetivosKB = {
    objetivos_terapeuticos: [
        { objetivo: 'Reducir convicción en PA negativos', descripcion: 'Mediante diálogo socrático' },
        { objetivo: 'Identificar supuestos intermedios', descripcion: 'Reglas si-entonces' },
    ],
};

const mockCreenciasKB = {
    categorias: [
        {
            nombre: 'Desamparo',
            descripcion: 'Creencia de no poder lograr nada',
            creencias_ejemplo: ['Soy incompetente', 'No puedo hacer nada bien'],
            supuestos_intermedios: ['Si fallo, confirma que soy inútil'],
            estrategias_modificacion: ['Flecha descendente', 'Registro de logros'],
        },
        {
            nombre: 'Desamor',
            descripcion: 'Creencia de no ser amado',
            creencias_ejemplo: ['Nadie me quiere', 'Soy indigno de amor'],
            supuestos_intermedios: ['Si me rechazan, es porque no valgo'],
            estrategias_modificacion: ['Diálogo socrático con evidencia relacional'],
        },
    ],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo objetivos (fase 4 RC)', () => {
    it('Caso feliz: SMART válido, carga objetivos y creencias desde KB', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockResolvedValueOnce(mockObjetivosKB)     // OBJETIVOS_CLINICOS
            .mockResolvedValueOnce(mockCreenciasKB);     // RC_CREENCIAS_NUCLEARES

        const input: GoalsSessionRCInput = {
            primaryObjective: 'Reducir la convicción en pensamientos de inutilidad del 90% al 50%',
            shortTermGoals: ['Registro diario de PA', 'Diálogo socrático semanal'],
            measurableIndicator: 'Convicción en PA medida con escala 0-100',
            startConviction: 90,
            targetConviction: 50,
            targetedDistortions: ['catastrofización', 'personalización'],
        };

        const result = await runGoalsSessionRC(baseContext, input);

        // SMART validation
        expect(result.smartValidation.score).toBeGreaterThanOrEqual(4);
        expect(result.smartValidation.feedback).toContain('bien formulados');
        // Conviction reduction
        expect(result.convictionReduction.from).toBe(90);
        expect(result.convictionReduction.to).toBe(50);
        expect(result.convictionReduction.percentReduction).toBe(44);
        // Objetivos terapéuticos desde KB
        expect(result.therapeuticObjectives.length).toBeGreaterThan(0);
        expect(result.therapeuticObjectives[0]).toContain('convicción');
        // Targeted distortions pass-through
        expect(result.targetedDistortions).toContain('catastrofización');
    });

    it('Caso SMART parcial: reducción de convicción no realista (>70%)', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockResolvedValueOnce(mockObjetivosKB)
            .mockResolvedValueOnce(mockCreenciasKB);

        const input: GoalsSessionRCInput = {
            primaryObjective: 'Eliminar todos los pensamientos negativos por completo',
            shortTermGoals: ['Dejar de pensar negativamente'],
            measurableIndicator: 'Sin pensamientos negativos',
            startConviction: 95,
            targetConviction: 10,  // 89% de reducción → no realista
            targetedDistortions: ['todo-o-nada'],
        };

        const result = await runGoalsSessionRC(baseContext, input);

        expect(result.smartValidation.achievable).toBe(false);
        expect(result.smartValidation.feedback).toContain('supera el 70%');
        expect(result.smartValidation.score).toBeLessThan(5);
    });

    it('Caso fallback: KB no disponible, retorna objetivos y creencias vacíos', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockRejectedValueOnce(new Error('KB unavailable'))
            .mockRejectedValueOnce(new Error('KB unavailable'));

        const input: GoalsSessionRCInput = {
            primaryObjective: 'Reducir autocrítica excesiva mediante registro de pensamientos',
            shortTermGoals: ['Registro de 3 columnas diario'],
            measurableIndicator: 'Frecuencia de autocrítica por semana',
            startConviction: 80,
            targetConviction: 40,
            targetedDistortions: ['autocrítica'],
        };

        const result = await runGoalsSessionRC(baseContext, input);

        expect(result.therapeuticObjectives).toHaveLength(0);
        expect(result.beliefWorkTargets).toHaveLength(0);
        expect(result.smartValidation.score).toBeGreaterThanOrEqual(3);
        expect(result.salida.decisionTerapeuta).toBe('Continuar con establecimiento de objetivos');
    });
});
