/**
 * evaluation.session.rc.test.ts — Tests del flujo de evaluación de progreso (fase 6 RC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * Evalúa cambio de convicción en PA (escala 0-100) en vez de SUDs.
 */

import { describe, it, expect, vi } from 'vitest';
import { runEvaluationSessionRC, type EvaluationRCInput } from './evaluation.session.rc';
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
        id: '5', nombre: 'Miguel', apellido: 'Torres', fechaNacimiento: '1987-09-05',
        sexo: 'masculino', motivoConsulta: 'Pensamientos de fracaso', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Creencia de fracaso.' },
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
    ultimaSesion: 6,
    estadoEmocional: 'ansiedad',
    fase: 'intervencion',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Evaluar progreso',
    recursos: [],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

const mockBarrerasKB = {
    barreras: [
        {
            nombre: 'Resistencia al cambio', descripcion: 'El paciente se resiste a modificar creencias',
            ejemplo_paciente: 'Pero yo siempre he pensado así', estrategia_manejo: 'Explorar ventajas/desventajas de mantener la creencia',
        },
        {
            nombre: 'Intelectualización', descripcion: 'Entiende racionalmente pero no emocionalmente',
            ejemplo_paciente: 'Sé que es irracional pero lo sigo creyendo', estrategia_manejo: 'Experimentos conductuales para generar evidencia emocional',
        },
    ],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo evaluación de progreso (fase 6 RC)', () => {
    it('Caso feliz: reducción significativa de convicción (≥30 pts), técnica efectiva', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockResolvedValue(mockBarrerasKB);

        const input: EvaluationRCInput = {
            baselineConviction: 90,
            currentConviction: 55,   // reducción de 35 puntos → significativa
            baselineIntensity: 8,
            currentIntensity: 4,
            whatChanged: 'Aprendí a cuestionar mis pensamientos automáticos',
            obstaclesFound: '',
            wantsToRepeat: true,
            selectedTechnique: 'diálogo socrático',
        };

        const result = await runEvaluationSessionRC(baseContext, input);

        expect(result.convictionChange.significance).toBe('significant');
        expect(result.convictionChange.difference).toBe(35);
        expect(result.convictionChange.interpretation).toContain('significativa');
        expect(result.convictionChange.interpretation).toContain('consolidándose');
        // Técnica efectiva
        expect(result.techniqueEffectiveness).toContain('diálogo socrático');
        expect(result.techniqueEffectiveness).toContain('efectividad');
        expect(result.techniqueEffectiveness).toContain('continuar');
        // Recommendation: mantener y avanzar
        expect(result.adjustmentRecommendation).toContain('supuestos intermedios');
        // SUDs change
        expect(result.sudsChange.difference).toBe(4);
    });

    it('Caso empeoramiento: convicción aumentó, recomienda revisión urgente', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockResolvedValue(mockBarrerasKB);

        const input: EvaluationRCInput = {
            baselineConviction: 70,
            currentConviction: 85,   // aumento de 15 puntos → worsened
            baselineIntensity: 6,
            currentIntensity: 8,
            whatChanged: 'Me di cuenta de que tenía razón en mis pensamientos',
            obstaclesFound: 'resistencia al cambio',
            wantsToRepeat: false,
            selectedTechnique: 'registro de 7 columnas',
        };

        const result = await runEvaluationSessionRC(baseContext, input);

        expect(result.convictionChange.significance).toBe('worsened');
        expect(result.convictionChange.interpretation).toContain('Aumento');
        // Técnica no efectiva
        expect(result.techniqueEffectiveness).toContain('creencia nuclear');
        // Recomendación urgente
        expect(result.adjustmentRecommendation).toContain('Revisión urgente');
        expect(result.adjustmentRecommendation).toContain('esquema nuclear');
        // Barreras matcheadas desde KB
        expect(result.barrierMatches.length).toBeGreaterThan(0);
        expect(result.barrierMatches[0].nombre).toContain('Resistencia');
        expect(result.barrierMatches[0].estrategia_manejo).toContain('ventajas/desventajas');
    });

    it('Caso fallback: sin obstáculos y KB no disponible', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockRejectedValue(new Error('KB unavailable'));

        const input: EvaluationRCInput = {
            baselineConviction: 80,
            currentConviction: 65,   // reducción de 15 → minimal
            baselineIntensity: 7,
            currentIntensity: 5,
            whatChanged: 'Algo mejor',
            obstaclesFound: '',
            wantsToRepeat: null,
            selectedTechnique: 'descatastrofización',
        };

        const result = await runEvaluationSessionRC(baseContext, input);

        expect(result.convictionChange.significance).toBe('minimal');
        expect(result.barrierMatches).toHaveLength(0);
        expect(result.adjustmentRecommendation).toContain('barreras');
        expect(result.salida.decisionTerapeuta).toBe('Evaluar progreso');
    });
});
