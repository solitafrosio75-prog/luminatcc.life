/**
 * assessment.session.ac.test.ts — Tests del flujo de evaluación (fase 2 AC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 */

import { describe, it, expect, vi } from 'vitest';
import { runAssessmentSessionAC, type AssessmentSessionInput } from './assessment.session.ac';
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
        herramientas: [
            { id: 'HE01', nombre: 'Línea Base de Actividad', tipo: 'registro', proposito: '', cuando_usar: 'Sesiones 1-2' },
            { id: 'HE02', nombre: 'BDI-II', tipo: 'inventario', proposito: '', cuando_usar: 'Semanal' },
            { id: 'HE03', nombre: 'Agenda P/D', tipo: 'formulario', proposito: '', cuando_usar: 'Desde sesión 3' },
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
        id: '3', nombre: 'Marta', apellido: 'López', fechaNacimiento: '1988-02-20',
        sexo: 'femenino', motivoConsulta: 'Ansiedad y evitación', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Evitación social.' },
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
    ultimaSesion: 2,
    estadoEmocional: 'tristeza',
    fase: 'inicio',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Continuar evaluación',
    recursos: ['registro ABC'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo evaluación funcional (fase 2 AC)', () => {
    it('Caso feliz: detecta TRAPs y carga herramientas del KB', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: AssessmentSessionInput = {
            situationContext: 'Reunión de trabajo con jefe',
            automaticThought: 'No voy a poder hacerlo bien',
            behavioralResponse: 'Evita la reunión fingiendo estar enfermo',
            consequences: 'Alivio temporal, pero culpa después',
            cognitivePatterns: ['catastrofización', 'adivinación del futuro'],
            avoidanceBehaviors: ['evitar reuniones', 'no contestar llamadas'],
            functionalImpact: 'Problemas en el trabajo, aislamiento creciente',
            baselineIntensity: 7,
        };

        const result = await runAssessmentSessionAC(baseContext, input);

        expect(result.trapsIdentified.length).toBeGreaterThan(0);
        expect(result.trapsIdentified[0]).toContain('TRAP');
        expect(result.abcAnalysis.functionalPattern).toContain('evitación');
        // Herramientas del KB (solo registro + inventario)
        expect(result.evaluationTools).toHaveLength(2);
        expect(result.evaluationTools[0].nombre).toContain('Línea Base');
        expect(result.clinicalNote).toContain('baseline: 7/10');
    });

    it('Caso sin evitación: no detecta TRAPs, patrón de afrontamiento activo', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: AssessmentSessionInput = {
            situationContext: 'Discusión con la pareja',
            automaticThought: 'Necesito hablar de esto',
            behavioralResponse: 'Propone una conversación calmada',
            consequences: 'Resolución parcial del conflicto',
            cognitivePatterns: [],
            avoidanceBehaviors: [],
            functionalImpact: 'Leve tensión emocional',
            baselineIntensity: 4,
        };

        const result = await runAssessmentSessionAC(baseContext, input);

        expect(result.trapsIdentified).toHaveLength(0);
        expect(result.abcAnalysis.functionalPattern).toContain('afrontamiento activo');
        expect(result.clinicalNote).toContain('baseline: 4/10');
    });

    it('Caso sin datos KB: funciona con fallback vacío', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        // Forzar error en loadKBData para este test
        const { loadKBData } = await import('./kb-loader');
        (loadKBData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('KB unavailable'));

        const input: AssessmentSessionInput = {
            situationContext: 'Quedarse solo en casa',
            automaticThought: 'Nadie se preocupa por mí',
            behavioralResponse: 'Se queda en cama todo el día',
            consequences: 'Alivio de no interactuar',
            cognitivePatterns: ['personalización'],
            avoidanceBehaviors: ['aislarse'],
            functionalImpact: 'Deterioro social severo',
            baselineIntensity: 8,
        };

        const result = await runAssessmentSessionAC(baseContext, input);

        expect(result.evaluationTools).toHaveLength(0);
        expect(result.trapsIdentified.length).toBeGreaterThan(0);
        expect(result.salida.decisionTerapeuta).toBe('Continuar evaluación');
    });
});
