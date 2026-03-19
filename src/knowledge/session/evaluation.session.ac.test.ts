/**
 * evaluation.session.ac.test.ts — Tests del flujo de evaluación de progreso (fase 6 AC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 */

import { describe, it, expect, vi } from 'vitest';
import { runEvaluationSessionAC, type EvaluationSessionInput } from './evaluation.session.ac';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';

// ============================================================================
// Mocks
// ============================================================================

const { orchestrateSessionMock } = vi.hoisted(() => ({
    orchestrateSessionMock: vi.fn(),
}));

vi.mock('./kb-loader', () => ({
    loadKBData: vi.fn().mockResolvedValue({
        barreras: [
            {
                nombre: 'Evitación por baja energía',
                descripcion: 'Paciente reporta no tener energía para actividades.',
                ejemplo_paciente: 'No puedo salir.',
                estrategia_manejo: 'Reducir a microtarea.',
            },
            {
                nombre: 'Rumiación que bloquea la acción',
                descripcion: 'Ciclos de pensamiento repetitivo impiden acción.',
                ejemplo_paciente: 'Paso horas pensando.',
                estrategia_manejo: 'Implementar Hora de Preocuparse.',
            },
        ],
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
        id: '6', nombre: 'Pedro', apellido: 'Sánchez', fechaNacimiento: '1980-04-25',
        sexo: 'masculino', motivoConsulta: 'Depresión', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Depresión mayor.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 25, alertaCritica: false }],
    }],
};

const baseContext: SessionContext = {
    paciente,
    ultimaSesion: 6,
    estadoEmocional: 'tristeza',
    fase: 'intervencion',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Evaluar progreso',
    recursos: ['feedback'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo evaluación de progreso (fase 6 AC)', () => {
    it('Caso de mejora significativa: ≥3 puntos SUDs', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: EvaluationSessionInput = {
            baselineIntensity: 8,
            currentIntensity: 4,
            whatChanged: 'Empecé a caminar y llamar a amigos',
            obstaclesFound: '',
            wantsToRepeat: true,
            selectedTechnique: 'Programación de actividades P/D',
        };

        const result = await runEvaluationSessionAC(baseContext, input);

        expect(result.changeAnalysis.significance).toBe('significant');
        expect(result.changeAnalysis.difference).toBe(4);
        expect(result.changeAnalysis.interpretation).toContain('significativa');
        expect(result.techniqueEffectiveness).toContain('efectividad positiva');
        expect(result.adjustmentRecommendation).toContain('Mantener');
        expect(result.barrierMatches).toHaveLength(0);
    });

    it('Caso sin cambio: recomienda reformular plan', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: EvaluationSessionInput = {
            baselineIntensity: 6,
            currentIntensity: 6,
            whatChanged: 'Nada ha cambiado',
            obstaclesFound: 'No tengo energía para las actividades',
            wantsToRepeat: false,
            selectedTechnique: 'Monitoreo de actividad',
        };

        const result = await runEvaluationSessionAC(baseContext, input);

        expect(result.changeAnalysis.significance).toBe('no-change');
        expect(result.adjustmentRecommendation).toContain('Reformular');
        expect(result.techniqueEffectiveness).toContain('no ha generado cambio');
        // Barrier match por "energía"
        expect(result.barrierMatches.length).toBeGreaterThan(0);
        expect(result.barrierMatches[0].nombre).toContain('energía');
    });

    it('Caso de empeoramiento: revisión urgente', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: EvaluationSessionInput = {
            baselineIntensity: 5,
            currentIntensity: 8,
            whatChanged: 'Me siento peor, problemas familiares',
            obstaclesFound: 'Rumiación constante sobre mis problemas',
            wantsToRepeat: null,
            selectedTechnique: 'Experimentos conductuales',
        };

        const result = await runEvaluationSessionAC(baseContext, input);

        expect(result.changeAnalysis.significance).toBe('worsened');
        expect(result.changeAnalysis.difference).toBe(-3);
        expect(result.adjustmentRecommendation).toContain('urgente');
        expect(result.techniqueEffectiveness).toContain('empeoramiento');
        // Barrier match por "rumiación"
        expect(result.barrierMatches.length).toBeGreaterThan(0);
        expect(result.barrierMatches[0].nombre).toContain('Rumiación');
    });
});
