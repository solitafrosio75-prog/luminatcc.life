/**
 * followup.session.ac.test.ts — Tests del flujo de seguimiento (fase 7 AC)
 *
 * Mockea orchestrateSession(), loadKBData() y loadSharedData() para tests unitarios puros.
 */

import { describe, it, expect, vi } from 'vitest';
import { runFollowUpSessionAC, type FollowUpSessionInput } from './followup.session.ac';
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
        if (area === 'ejercicios_tareas') {
            return Promise.resolve({
                ejercicios: [
                    { id: 'ET01', nombre: 'Monitoreo de Actividad', tipo: 'monitoreo', objetivo: 'Línea base', frecuencia: 'Diario 7 días' },
                    { id: 'ET02', nombre: 'Programación P/D', tipo: 'programacion', objetivo: 'Romper inercia', frecuencia: 'Semanal' },
                    { id: 'ET03', nombre: 'Descomposición de Tareas', tipo: 'descomposicion', objetivo: 'Evitar abrumo', frecuencia: 'Según necesidad' },
                ],
            });
        }
        if (area === 'estructura_sesiones') {
            return Promise.resolve({
                bloques: [
                    { nombre: 'Evaluación y Psicoeducación', sesiones: '1-2', objetivos: ['Evaluar', 'Psicoeducar'], actividades_principales: [] },
                    { nombre: 'Valores y Programación Inicial', sesiones: '3-4', objetivos: ['Identificar valores'], actividades_principales: [] },
                    { nombre: 'Graduación y Manejo de Barreras', sesiones: '5-8', objetivos: ['Graduar actividades'], actividades_principales: [] },
                ],
            });
        }
        return Promise.resolve({});
    }),
    loadSharedData: vi.fn().mockResolvedValue({
        senales_alarma: [
            'Puntuación BDI-II ítem 9 >= 2',
            'Verbalización de deseos de muerte',
            'Aumento súbito de aislamiento',
        ],
        recursos_emergencia: [
            { recurso: 'Teléfono de la Esperanza', contacto: '717 003 717' },
            { recurso: 'Emergencias', contacto: '112' },
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
        id: '7', nombre: 'Laura', apellido: 'Fernández', fechaNacimiento: '1993-09-03',
        sexo: 'femenino', motivoConsulta: 'Estado de ánimo bajo', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Tristeza persistente.' },
    formulation: { analisisFuncional: '', hipotesis: '', diagnosticoFuncional: '' },
    plan: { objetivos: [], tecnicas: [], cronograma: [] },
    sesiones: [],
    inventarios: [{
        inventario: 'BDI-II',
        administraciones: [{ fecha: '2026-03-01', puntuacion: 20, alertaCritica: false }],
    }],
};

const mockOutput = {
    decisionTerapeuta: 'Planificar seguimiento',
    recursos: ['plan de práctica'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo seguimiento (fase 7 AC)', () => {
    it('Caso de mejora: genera resumen, plan de práctica y recursos', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: FollowUpSessionInput = {
            sessionSummary: {
                mainComplaint: 'Estado de ánimo bajo',
                baselineIntensity: 7,
                currentIntensity: 4,
                selectedTechnique: 'Programación P/D',
                primaryObjective: 'Aumentar actividades placenteras',
                trapsIdentified: 2,
                comprehensionLevel: 'strong',
            },
        };

        const context: SessionContext = {
            paciente,
            ultimaSesion: 5,
            estadoEmocional: 'tristeza',
            fase: 'intervencion',
            inventarios: [],
            alertaCrisis: false,
        };

        const result = await runFollowUpSessionAC(context, input);

        // Resumen compilado
        expect(result.sessionSummary).toContain('mejora');
        expect(result.sessionSummary).toContain('7/10 → 4/10');
        // Plan de práctica del KB
        expect(result.practicePlan.length).toBeGreaterThan(0);
        expect(result.practicePlan[0].ejercicio).toContain('Monitoreo');
        // Señales de alarma del protocolo de crisis
        expect(result.warningSignals.length).toBeGreaterThan(0);
        expect(result.warningSignals[0]).toContain('BDI-II');
        // Recursos de emergencia
        expect(result.emergencyResources.length).toBeGreaterThan(0);
        expect(result.emergencyResources[0].contacto).toBe('717 003 717');
        // Guía siguiente sesión del KB estructura
        expect(result.nextSessionGuidance).toContain('Graduación');
    });

    it('Caso de empeoramiento: resumen refleja tendencia negativa', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: FollowUpSessionInput = {
            sessionSummary: {
                mainComplaint: 'Depresión severa',
                baselineIntensity: 5,
                currentIntensity: 8,
                selectedTechnique: 'Monitoreo de actividad',
                primaryObjective: 'Reducir aislamiento',
                trapsIdentified: 0,
                comprehensionLevel: 'weak',
            },
        };

        const context: SessionContext = {
            paciente,
            ultimaSesion: 2,
            estadoEmocional: 'desesperanza',
            fase: 'inicio',
            inventarios: [],
            alertaCrisis: false,
        };

        const result = await runFollowUpSessionAC(context, input);

        expect(result.sessionSummary).toContain('empeoramiento');
        expect(result.sessionSummary).toContain('5/10 → 8/10');
        // Guía de sesión 2 (bloque Evaluación y Psicoeducación)
        expect(result.nextSessionGuidance).toContain('Evaluación');
    });

    it('Caso estable: tendencia sin cambio', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);

        const input: FollowUpSessionInput = {
            sessionSummary: {
                mainComplaint: 'Ansiedad leve',
                baselineIntensity: 5,
                currentIntensity: 5,
                selectedTechnique: 'Experimentos conductuales',
                primaryObjective: 'Enfrentar situaciones temidas',
                trapsIdentified: 1,
                comprehensionLevel: 'partial',
            },
        };

        const context: SessionContext = {
            paciente,
            ultimaSesion: 3,
            estadoEmocional: 'tristeza',
            fase: 'inicio',
            inventarios: [],
            alertaCrisis: false,
        };

        const result = await runFollowUpSessionAC(context, input);

        expect(result.sessionSummary).toContain('estable');
        expect(result.sessionSummary).toContain('5/10 → 5/10');
    });
});
