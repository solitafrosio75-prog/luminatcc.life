/**
 * assessment.session.rc.test.ts — Tests del flujo de evaluación cognitiva (fase 2 RC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * RC usa conceptualización cognitiva (no análisis funcional ABC como AC).
 */

import { describe, it, expect, vi } from 'vitest';
import { runAssessmentSessionRC, type CognitiveAssessmentInput } from './assessment.session.rc';
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
        id: '2', nombre: 'Laura', apellido: 'Sánchez', fechaNacimiento: '1992-07-10',
        sexo: 'femenino', motivoConsulta: 'Pensamientos catastróficos', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Catastrofización.' },
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
    ultimaSesion: 2,
    estadoEmocional: 'ansiedad',
    fase: 'inicio',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Continuar evaluación cognitiva',
    recursos: ['registro de pensamientos'],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

// Mock KB data
const mockDistorsionesKB = {
    distorsiones: [
        {
            id: 'DC01', nombre: 'Catastrofización', definicion: 'Anticipar lo peor',
            ejemplo: 'Va a salir todo mal', pregunta_socratica: '¿Cuál es la evidencia de que lo peor ocurrirá?',
        },
        {
            id: 'DC02', nombre: 'Pensamiento todo-o-nada', definicion: 'Ver en blanco y negro',
            ejemplo: 'Si no es perfecto, es un fracaso', pregunta_socratica: '¿Existen puntos intermedios?',
        },
        {
            id: 'DC03', nombre: 'Lectura del pensamiento', definicion: 'Asumir que sé lo que otros piensan',
            ejemplo: 'Piensa que soy incompetente', pregunta_socratica: '¿Cómo sabes lo que piensa?',
        },
    ],
};

const mockHerramientasKB = {
    herramientas: [
        { id: 'HE01', nombre: 'Registro de pensamientos 3 columnas', tipo: 'autoregistro', proposito: 'Identificar PA', cuando_usar: 'Sesiones 1-3' },
        { id: 'HE02', nombre: 'BDI-II', tipo: 'inventario', proposito: 'Evaluar depresión', cuando_usar: 'Semanal' },
        { id: 'HE03', nombre: 'Registro de 7 columnas', tipo: 'registro', proposito: 'Reestructuración completa', cuando_usar: 'Desde sesión 4' },
        { id: 'HE04', nombre: 'Guía de diálogo socrático', tipo: 'guia_terapeuta', proposito: 'Guiar cuestionamiento', cuando_usar: 'Todas las sesiones' },
    ],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo evaluación cognitiva (fase 2 RC)', () => {
    it('Caso feliz: detecta distorsiones del catálogo KB y genera conceptualización', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockResolvedValueOnce(mockDistorsionesKB)    // RC_DISTORSIONES_COGNITIVAS
            .mockResolvedValueOnce(mockHerramientasKB);    // HERRAMIENTAS_EVALUACION

        const input: CognitiveAssessmentInput = {
            situationContext: 'Presentación en el trabajo',
            automaticThought: 'Voy a hacer el ridículo y todos se van a dar cuenta',
            emotionalResponse: 'Ansiedad intensa',
            emotionIntensity: 85,
            cognitiveDistortions: ['catastrofización', 'lectura del pensamiento'],
            beliefConviction: 90,
            behavioralConsequence: 'Evita la presentación pidiendo día libre',
        };

        const result = await runAssessmentSessionRC(baseContext, input);

        // Distorsiones matcheadas desde KB
        expect(result.distortionMatches.length).toBeGreaterThan(0);
        expect(result.distortionMatches.some(d => d.nombre === 'Catastrofización')).toBe(true);
        expect(result.distortionMatches[0].pregunta_socratica).toBeDefined();
        // Conceptualización cognitiva (no ABC como AC)
        expect(result.conceptualization.automaticThought).toContain('ridículo');
        expect(result.conceptualization.convictionLevel).toBe(90);
        expect(result.conceptualization.emotionIntensity).toBe(85);
        // Herramientas del KB (autoregistro + inventario + registro)
        expect(result.evaluationTools.length).toBeGreaterThan(0);
        expect(result.evaluationTools.some(h => h.nombre.includes('3 columnas'))).toBe(true);
        // Nota clínica
        expect(result.clinicalNote).toContain('Convicción en PA: 90/100');
        expect(result.clinicalNote).toContain('Catastrofización');
    });

    it('Caso sin distorsiones reconocidas: conceptualización sin matches KB', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockResolvedValueOnce(mockDistorsionesKB)
            .mockResolvedValueOnce(mockHerramientasKB);

        const input: CognitiveAssessmentInput = {
            situationContext: 'Discusión con la pareja',
            automaticThought: 'No me valora como persona',
            emotionalResponse: 'Tristeza',
            emotionIntensity: 60,
            cognitiveDistortions: ['esquema_no_catalogado'],
            beliefConviction: 70,
            behavioralConsequence: 'Se retira y deja de hablar',
        };

        const result = await runAssessmentSessionRC(baseContext, input);

        expect(result.distortionMatches).toHaveLength(0);
        expect(result.clinicalNote).toContain('Sin distorsiones cognitivas formalmente identificadas');
        expect(result.conceptualization.convictionLevel).toBe(70);
    });

    it('Caso fallback: KB no disponible, funciona con arrays vacíos', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock
            .mockRejectedValueOnce(new Error('KB unavailable'))   // distorsiones
            .mockRejectedValueOnce(new Error('KB unavailable'));   // herramientas

        const input: CognitiveAssessmentInput = {
            situationContext: 'Quedarse solo en casa',
            automaticThought: 'Nadie se preocupa por mí',
            emotionalResponse: 'Tristeza profunda',
            emotionIntensity: 75,
            cognitiveDistortions: ['personalización'],
            beliefConviction: 85,
            behavioralConsequence: 'Se queda en cama todo el día',
        };

        const result = await runAssessmentSessionRC(baseContext, input);

        expect(result.distortionMatches).toHaveLength(0);
        expect(result.evaluationTools).toHaveLength(0);
        expect(result.conceptualization.automaticThought).toContain('Nadie');
        expect(result.salida.decisionTerapeuta).toBe('Continuar evaluación cognitiva');
    });
});
