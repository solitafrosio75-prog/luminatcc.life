/**
 * intermediate.session.rc.test.ts — Tests del flujo de sesión intermedia (sesión 5 RC)
 *
 * Mockea orchestrateSession() y loadKBData() para tests unitarios puros.
 * RC revisa registros de pensamiento y distorsiones recurrentes (no TRAPs/TRACs como AC).
 */

import { describe, it, expect, vi } from 'vitest';
import { runIntermediateSessionRC } from './intermediate.session.rc';
import { Patient } from '../patient/patient.types';
import type { SessionContext } from './session.orchestrator';
import type { ChangeAnalysis } from '../patient/change.analysis';

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
        id: '6', nombre: 'Lucía', apellido: 'Gómez', fechaNacimiento: '1993-04-12',
        sexo: 'femenino', motivoConsulta: 'Distorsiones cognitivas recurrentes', fechaIngreso: '2026-03-01',
    },
    history: { antecedentesPersonales: [], antecedentesFamiliares: [], historiaProblema: 'Patrón de catastrofización.' },
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
    ultimaSesion: 5,
    estadoEmocional: 'ansiedad',
    fase: 'intervencion',
    inventarios: [],
    alertaCrisis: false,
};

const mockOutput = {
    decisionTerapeuta: 'Continuar sesión intermedia',
    recursos: [],
    mensaje: 'OK',
    validacionEtica: 'Sin restricciones',
    salida: 'Sesión completada',
};

const mockBarrerasKB = {
    barreras: [
        {
            nombre: 'Intelectualización', descripcion: 'Entiende racionalmente pero no cambia',
            ejemplo_paciente: 'Sé que es irracional', estrategia_manejo: 'Usar experimentos conductuales',
        },
        {
            nombre: 'Evitación cognitiva', descripcion: 'Evita pensar en el pensamiento automático',
            ejemplo_paciente: 'Prefiero no pensar en eso', estrategia_manejo: 'Exposición gradual a pensamientos difíciles',
        },
    ],
};

// ============================================================================
// Tests
// ============================================================================

describe('Flujo sesión intermedia (sesión 5 RC)', () => {
    it('Caso feliz: mejora detectada, distorsiones revisadas, barreras matcheadas', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockResolvedValue(mockBarrerasKB);

        const changeAnalyses: ChangeAnalysis[] = [{
            inventario: 'BDI-II',
            baseline: 24,
            followup: 18,
            diferencia: -6,
            tendencia: 'mejora',
            cambioClinico: 'significativo',
            criterioJacobsonTruax: false,
        }];

        const pensamientos = [
            'Voy a fracasar en la presentación',
            'Nadie me toma en serio',
        ];

        const distorsionesRecurrentes = ['catastrofización', 'lectura del pensamiento'];
        const barreras = ['intelectualización'];

        const result = await runIntermediateSessionRC(
            baseContext, changeAnalyses, pensamientos, distorsionesRecurrentes, barreras
        );

        // Revisión de registros
        expect(result.revisionTareas).toContain('2 registros');
        // BDI comparación
        expect(result.bdiComparacion.baseline).toBe(24);
        expect(result.bdiComparacion.followup).toBe(18);
        expect(result.bdiComparacion.tendencia).toBe('mejora');
        // Pensamientos revisados con diálogo socrático
        expect(result.pensamientosRevisados.length).toBe(2);
        expect(result.pensamientosRevisados[0]).toContain('diálogo socrático');
        // Distorsiones recurrentes
        expect(result.distorsionesRecurrentes).toContain('catastrofización');
        // Ajuste de técnica: mejora → avanzar a supuestos intermedios
        expect(result.ajusteTecnica).toContain('Evolución positiva');
        expect(result.ajusteTecnica).toContain('supuestos intermedios');
        // Barreras KB matcheadas
        expect(result.barrerasKBMatch.length).toBeGreaterThan(0);
        expect(result.barrerasKBMatch[0].nombre).toContain('Intelectualización');
        expect(result.barrerasKBMatch[0].estrategia_manejo).toContain('experimentos conductuales');
    });

    it('Caso empeoramiento: recomienda retroceder a psicoeducación', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockResolvedValue(mockBarrerasKB);

        const changeAnalyses: ChangeAnalysis[] = [{
            inventario: 'BDI-II',
            baseline: 18,
            followup: 28,
            diferencia: 10,
            tendencia: 'empeora',
            cambioClinico: 'significativo',
            criterioJacobsonTruax: false,
        }];

        const pensamientos = ['Todo es mi culpa'];
        const distorsionesRecurrentes = ['personalización'];
        const barreras: string[] = [];

        const result = await runIntermediateSessionRC(
            baseContext, changeAnalyses, pensamientos, distorsionesRecurrentes, barreras
        );

        expect(result.bdiComparacion.tendencia).toBe('empeora');
        expect(result.ajusteTecnica).toContain('Empeoramiento detectado');
        expect(result.ajusteTecnica).toContain('psicoeducación');
        expect(result.ajusteTecnica).toContain('esquema nuclear');
    });

    it('Caso fallback: KB no disponible, múltiples distorsiones → escalar a 7 columnas', async () => {
        orchestrateSessionMock.mockResolvedValue(mockOutput);
        loadKBDataMock.mockRejectedValue(new Error('KB unavailable'));

        const changeAnalyses: ChangeAnalysis[] = [{
            inventario: 'BDI-II',
            baseline: 22,
            followup: 20,
            diferencia: -2,
            tendencia: 'estable',
            cambioClinico: 'no-significativo',
            criterioJacobsonTruax: false,
        }];

        const pensamientos = ['Soy inútil', 'Todo sale mal', 'No vale la pena'];
        const distorsionesRecurrentes = ['sobregeneralización', 'personalización', 'catastrofización'];
        const barreras = ['evitación'];

        const result = await runIntermediateSessionRC(
            baseContext, changeAnalyses, pensamientos, distorsionesRecurrentes, barreras
        );

        // Sin KB → barreras no matcheadas
        expect(result.barrerasKBMatch).toHaveLength(0);
        // 3+ distorsiones recurrentes → escalar técnica
        expect(result.ajusteTecnica).toContain('7 columnas');
        expect(result.ajusteTecnica).toContain('experimentos conductuales');
        expect(result.salida.decisionTerapeuta).toBe('Continuar sesión intermedia');
    });
});
