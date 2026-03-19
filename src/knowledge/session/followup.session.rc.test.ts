/**
 * followup.session.rc.test.ts — Tests del flujo de seguimiento (fase 7 RC)
 *
 * Mockea orchestrateSession(), loadKBData() y loadSharedData() para tests unitarios puros.
 * Cierre del ciclo terapéutico RC con plan de práctica cognitiva.
 */

import { describe, it, expect, vi } from 'vitest';
import { runFollowUpSessionRC, type FollowUpRCInput } from './followup.session.rc';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';

// ============================================================================
// Mocks
// ============================================================================

const { orchestrateSessionMock, loadKBDataMock, loadSharedDataMock } = vi.hoisted(() => ({
    orchestrateSessionMock: vi.fn(),
    loadKBDataMock: vi.fn(),
    loadSharedDataMock: vi.fn(),
}));

vi.mock('./kb-loader', () => ({
    loadKBData: loadKBDataMock,
    loadSharedData: loadSharedDataMock,
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
        id: '7', nombre: 'Andrea', apellido: 'Morales', fechaNacimiento: '1991-06-18',
        sexo: 'femenino', motivoConsulta: 'Pensamientos catastróficos', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Catastrofización crónica.' },
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
    ultimaSesion: 7,
    estadoEmocional: 'motivacion',
    fase: 'cierre',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Seguimiento RC completado',
    recursos: [],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

const mockEjerciciosKB = {
    ejercicios: [
        { id: 'EJ01', nombre: 'Registro de pensamientos 3 columnas', tipo: 'autoregistro', objetivo: 'Identificar PA', frecuencia: 'Diario' },
        { id: 'EJ02', nombre: 'Diálogo socrático guiado', tipo: 'reestructuracion', objetivo: 'Cuestionar PA', frecuencia: 'Semanal' },
        { id: 'EJ03', nombre: 'Registro de pensamientos 7 columnas', tipo: 'registro', objetivo: 'Reestructuración completa', frecuencia: '3 veces/semana' },
        { id: 'EJ04', nombre: 'Experimento conductual', tipo: 'experimento', objetivo: 'Poner a prueba creencias', frecuencia: 'Quincenal' },
    ],
};

const mockEstructuraKB = {
    bloques: [
        { nombre: 'Evaluación y psicoeducación', sesiones: '1-3', objetivos: ['Establecer alianza', 'Psicoeducación'], actividades_principales: ['BDI-II', 'Modelo cognitivo'] },
        { nombre: 'Reestructuración activa', sesiones: '4-8', objetivos: ['Modificar PA distorsionados'], actividades_principales: ['Registro', 'Diálogo socrático'] },
        { nombre: 'Consolidación', sesiones: '9-12', objetivos: ['Trabajo con supuestos intermedios'], actividades_principales: ['Experimentos conductuales'] },
    ],
};

const mockProtocoloCrisis = {
    senales_alarma: ['Ideación suicida', 'Aislamiento severo', 'Empeoramiento súbito'],
    recursos_emergencia: [
        { recurso: 'Emergencias', contacto: '112' },
        { recurso: 'Teléfono de la Esperanza', contacto: '717 003 717' },
    ],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo seguimiento (fase 7 RC)', () => {
    it('Caso feliz: resumen con reducción de convicción, plan de práctica desde KB', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockResolvedValueOnce(mockEjerciciosKB)    // EJERCICIOS_TAREAS
            .mockResolvedValueOnce(mockEstructuraKB);    // ESTRUCTURA_SESIONES
        loadSharedDataMock.mockResolvedValue(mockProtocoloCrisis);

        const input: FollowUpRCInput = {
            sessionSummary: {
                mainComplaint: 'Pensamientos catastróficos',
                baselineConviction: 90,
                currentConviction: 55,
                baselineIntensity: 8,
                currentIntensity: 4,
                selectedTechnique: 'diálogo socrático',
                primaryObjective: 'Reducir convicción en PA catastróficos',
                distortionsIdentified: 5,
                comprehensionLevel: 'strong',
            },
        };

        const result = await runFollowUpSessionRC(baseContext, input);

        // Resumen de sesión
        expect(result.sessionSummary).toContain('90%');
        expect(result.sessionSummary).toContain('55%');
        expect(result.sessionSummary).toContain('reducción de convicción');
        // Plan de práctica desde KB (filtrado: autoregistro, registro, reestructuracion)
        expect(result.practicePlan.length).toBeGreaterThan(0);
        expect(result.practicePlan.length).toBeLessThanOrEqual(3);
        expect(result.practicePlan.some(p => p.ejercicio.includes('3 columnas'))).toBe(true);
        // Señales de alarma desde protocolo_crisis compartido
        expect(result.warningSignals).toContain('Ideación suicida');
        // Recursos de emergencia
        expect(result.emergencyResources.some(r => r.contacto === '112')).toBe(true);
        // Guía para próxima sesión
        expect(result.nextSessionGuidance).toContain('Reestructuración activa');
    });

    it('Caso aumento de convicción: resumen refleja empeoramiento', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockResolvedValueOnce(mockEjerciciosKB)
            .mockResolvedValueOnce(mockEstructuraKB);
        loadSharedDataMock.mockResolvedValue(mockProtocoloCrisis);

        const input: FollowUpRCInput = {
            sessionSummary: {
                mainComplaint: 'Autocrítica',
                baselineConviction: 70,
                currentConviction: 80,  // empeoró
                baselineIntensity: 6,
                currentIntensity: 7,
                selectedTechnique: 'registro de 7 columnas',
                primaryObjective: 'Reducir autocrítica',
                distortionsIdentified: 2,
                comprehensionLevel: 'partial',
            },
        };

        const result = await runFollowUpSessionRC(baseContext, input);

        expect(result.sessionSummary).toContain('aumento de convicción');
        expect(result.sessionSummary).toContain('70%');
        expect(result.sessionSummary).toContain('80%');
    });

    it('Caso fallback: todos los KB fallan, usa fallbacks por defecto', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockRejectedValue(new Error('KB unavailable'));
        loadSharedDataMock.mockRejectedValue(new Error('Shared KB unavailable'));

        const input: FollowUpRCInput = {
            sessionSummary: {
                mainComplaint: 'Tristeza',
                baselineConviction: 80,
                currentConviction: 80,  // estable
                baselineIntensity: 5,
                currentIntensity: 5,
                selectedTechnique: 'diálogo socrático',
                primaryObjective: 'Mejorar estado de ánimo',
                distortionsIdentified: 1,
                comprehensionLevel: 'weak',
            },
        };

        const result = await runFollowUpSessionRC(baseContext, input);

        // Fallback plan de práctica
        expect(result.practicePlan).toHaveLength(1);
        expect(result.practicePlan[0].ejercicio).toContain('3 columnas');
        // Fallback señales de alarma
        expect(result.warningSignals.length).toBeGreaterThan(0);
        expect(result.warningSignals.some(s => s.toLowerCase().includes('suicida'))).toBe(true);
        // Fallback recursos de emergencia
        expect(result.emergencyResources.some(r => r.contacto === '112')).toBe(true);
        // Fallback guía de sesión
        expect(result.nextSessionGuidance).toContain('evolución clínica');
        // Resumen estable
        expect(result.sessionSummary).toContain('estable');
    });
});
