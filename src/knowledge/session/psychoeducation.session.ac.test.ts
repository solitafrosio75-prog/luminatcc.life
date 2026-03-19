/**
 * psychoeducation.session.ac.test.ts — Tests del flujo de psicoeducación (fase 3 AC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 */

import { describe, it, expect, vi } from 'vitest';
import { runPsychoeducationSessionAC, type PsychoeducationSessionInput } from './psychoeducation.session.ac';
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
        fundamentos_teoricos: {
            definicion: 'La AC es un tratamiento estructurado para la depresión.',
            mecanismo_de_cambio: 'La AC rompe el ciclo actuando directamente sobre la conducta.',
            modelo_explicativo: 'Evento adverso → reducción actividad → menor reforzamiento → peor ánimo.',
        },
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
        id: '4', nombre: 'Carlos', apellido: 'Ruiz', fechaNacimiento: '1992-07-15',
        sexo: 'masculino', motivoConsulta: 'Apatía', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Apatía y aislamiento.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 15, alertaCritica: false }],
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
    recursos: ['modelo AC'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo psicoeducación (fase 3 AC)', () => {
    it('Comprensión fuerte: modelo explicado + conexión hecha con datos ABC', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: PsychoeducationSessionInput = {
            modelExplained: true,
            connectionMade: true,
            patientReaction: 'Ahora entiendo por qué me siento peor cuando me aíslo',
            abcData: {
                antecedent: 'Quedarse solo en casa',
                behavior: 'Aislarse todo el fin de semana',
                consequence: 'Peor estado de ánimo el lunes',
            },
        };

        const result = await runPsychoeducationSessionAC(baseContext, input);

        expect(result.comprehensionLevel).toBe('strong');
        expect(result.connectionAssessment).toContain('conectó su situación');
        expect(result.nextStepRecommendation).toContain('valores');
        // Contenido desde KB mock
        expect(result.modelContent.mecanismoCambio).toContain('AC rompe el ciclo');
        expect(result.modelContent.definicion).toContain('tratamiento estructurado');
    });

    it('Comprensión parcial: modelo explicado pero sin conexión', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: PsychoeducationSessionInput = {
            modelExplained: true,
            connectionMade: false,
            patientReaction: 'Lo entiendo a nivel teórico pero no lo veo en mi caso',
        };

        const result = await runPsychoeducationSessionAC(baseContext, input);

        expect(result.comprehensionLevel).toBe('partial');
        expect(result.connectionAssessment).toContain('no conecta su experiencia');
        expect(result.nextStepRecommendation).toContain('Reforzar');
    });

    it('Comprensión débil: ni modelo ni conexión', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: PsychoeducationSessionInput = {
            modelExplained: false,
            connectionMade: false,
            patientReaction: 'No estoy seguro de entender qué tiene que ver con lo que me pasa',
        };

        const result = await runPsychoeducationSessionAC(baseContext, input);

        expect(result.comprehensionLevel).toBe('weak');
        expect(result.nextStepRecommendation).toContain('Repetir');
        expect(result.nextStepRecommendation).toContain('analogías');
    });
});
