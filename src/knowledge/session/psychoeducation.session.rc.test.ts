/**
 * psychoeducation.session.rc.test.ts — Tests del flujo de psicoeducación (fase 3 RC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * Evalúa comprensión del modelo cognitivo de Beck (3 niveles).
 */

import { describe, it, expect, vi } from 'vitest';
import { runPsychoeducationSessionRC, type PsychoeducationRCInput } from './psychoeducation.session.rc';
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
        id: '3', nombre: 'Elena', apellido: 'Ruiz', fechaNacimiento: '1988-11-22',
        sexo: 'femenino', motivoConsulta: 'Autocrítica severa', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Autocrítica.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 20, alertaCritica: false }],
    }],
};

const baseContext: SessionContext = {
    paciente,
    ultimaSesion: 3,
    estadoEmocional: 'tristeza',
    fase: 'inicio',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Continuar psicoeducación',
    recursos: ['modelo cognitivo'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

const mockConocimientoKB = {
    fundamentos_teoricos: {
        definicion: 'La RC identifica y modifica pensamientos automáticos distorsionados.',
        mecanismo_de_cambio: 'Al cambiar la interpretación cognitiva, cambian emociones y conductas.',
        modelo_explicativo: 'Situación → PA → Emoción/Conducta. Tres niveles: PA, supuestos, creencias nucleares.',
    },
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo psicoeducación (fase 3 RC)', () => {
    it('Caso feliz: comprensión strong, conexión con datos cognitivos del paciente', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockResolvedValue(mockConocimientoKB);

        const input: PsychoeducationRCInput = {
            modelExplained: true,
            connectionMade: true,
            patientReaction: 'Entiendo, mis pensamientos no son hechos.',
            cognitiveData: {
                automaticThought: 'Soy un fracaso total',
                emotion: 'tristeza',
                distortion: 'sobregeneralización',
            },
        };

        const result = await runPsychoeducationSessionRC(baseContext, input);

        expect(result.comprehensionLevel).toBe('strong');
        // Contenido cargado desde KB
        expect(result.modelContent.definicion).toContain('RC identifica');
        expect(result.modelContent.mecanismoCambio).toContain('interpretación cognitiva');
        // Conexión con datos del paciente
        expect(result.connectionAssessment).toContain('fracaso total');
        expect(result.connectionAssessment).toContain('tristeza');
        expect(result.connectionAssessment).toContain('sobregeneralización');
        // Next step para strong: avanzar a 7 columnas
        expect(result.nextStepRecommendation).toContain('7 columnas');
        expect(result.nextStepRecommendation).toContain('diálogo socrático');
    });

    it('Caso comprensión partial: modelo explicado pero sin conexión personal', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockResolvedValue(mockConocimientoKB);

        const input: PsychoeducationRCInput = {
            modelExplained: true,
            connectionMade: false,
            patientReaction: 'Lo entiendo en teoría pero no lo veo en mi caso.',
        };

        const result = await runPsychoeducationSessionRC(baseContext, input);

        expect(result.comprehensionLevel).toBe('partial');
        expect(result.connectionAssessment).toContain('no conecta');
        expect(result.connectionAssessment).toContain('Lo entiendo en teoría');
        // Next step para partial: reforzar con ejemplos concretos
        expect(result.nextStepRecommendation).toContain('ejemplos concretos');
    });

    it('Caso fallback: KB no disponible, usa contenido por defecto del modelo cognitivo', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockRejectedValue(new Error('KB unavailable'));

        const input: PsychoeducationRCInput = {
            modelExplained: false,
            connectionMade: false,
            patientReaction: 'No entiendo nada de esto.',
        };

        const result = await runPsychoeducationSessionRC(baseContext, input);

        expect(result.comprehensionLevel).toBe('weak');
        // Fallback content del modelo cognitivo
        expect(result.modelContent.definicion).toContain('Reestructuración Cognitiva');
        expect(result.modelContent.modeloCognitivo).toContain('Situación');
        expect(result.modelContent.modeloCognitivo).toContain('Pensamiento Automático');
        // Next step para weak: analogías simples
        expect(result.nextStepRecommendation).toContain('analogías simples');
    });
});
