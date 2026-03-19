import { describe, it, expect } from 'vitest';
import { adaptTherapeuticLanguage } from '../knowledge/therapist/adaptador.comunicacion';
import type { SelectorContext } from '../knowledge/therapist/relational.selector';
import type { SeverityDerivation } from '../knowledge/therapist/severity.derivator';

describe('adaptTherapeuticLanguage', () => {
    const baseCtx: SelectorContext = {
        fase: 'exploracion',
        estadoEmocional: 'tristeza',
        tipoRespuesta: 'emocional',
    };
    const mensaje = 'Parece que has tenido una semana difícil.';

    it('acepta severidad como string simple', () => {
        const result = adaptTherapeuticLanguage(mensaje, baseCtx, 'leve');
        expect(result.severidad).toBe('leve');
        expect(result.mensaje).toContain('empático y de acompañamiento');
        expect(result.mensaje).toContain('no-directivo');
        expect(result.mensaje).not.toContain('[Intervención');
    });

    it('severidad moderada → prefijo adaptada', () => {
        const result = adaptTherapeuticLanguage(mensaje, baseCtx, 'moderada');
        expect(result.mensaje).toContain('[Intervención adaptada]');
    });

    it('severidad grave → prefijo cautelosa', () => {
        const result = adaptTherapeuticLanguage(mensaje, baseCtx, 'grave');
        expect(result.mensaje).toContain('[Intervención cautelosa]');
        expect(result.requiereCautela).toBe(true);
    });

    it('acepta SeverityDerivation completa', () => {
        const derivation: SeverityDerivation = {
            severidad: 'grave',
            confianza: 'alta',
            fuentes: ['BDI_II (Depresión grave, total=35)'],
            detalle: 'Severidad basada en inventarios.',
            alertasCriticas: true,
            requiereCautelaAdicional: true,
        };
        const result = adaptTherapeuticLanguage(mensaje, baseCtx, derivation);
        expect(result.severidad).toBe('grave');
        expect(result.requiereCautela).toBe(true);
        expect(result.mensaje).toContain('CAUTELA MÁXIMA');
        expect(result.derivacionDetalle).toContain('inventarios');
    });

    it('desesperanza → tono cauteloso y validante', () => {
        const ctx: SelectorContext = { ...baseCtx, estadoEmocional: 'desesperanza' };
        const result = adaptTherapeuticLanguage(mensaje, ctx, 'moderada');
        expect(result.tono).toBe('cauteloso y validante');
    });

    it('ansiedad → tono calmante', () => {
        const ctx: SelectorContext = { ...baseCtx, estadoEmocional: 'ansiedad' };
        const result = adaptTherapeuticLanguage(mensaje, ctx, 'leve');
        expect(result.tono).toBe('calmante y tranquilizador');
    });

    it('fase intervencion → directivo', () => {
        const ctx: SelectorContext = { ...baseCtx, fase: 'intervencion' };
        const result = adaptTherapeuticLanguage(mensaje, ctx, 'moderada');
        expect(result.directividad).toBe('directivo');
    });

    it('fase cierre → motivacional', () => {
        const ctx: SelectorContext = { ...baseCtx, fase: 'cierre' };
        const result = adaptTherapeuticLanguage(mensaje, ctx, 'leve');
        expect(result.directividad).toBe('motivacional');
    });

    it('retorna AdaptedMessage con todos los campos', () => {
        const result = adaptTherapeuticLanguage(mensaje, baseCtx, 'moderada');
        expect(result).toHaveProperty('mensaje');
        expect(result).toHaveProperty('tono');
        expect(result).toHaveProperty('directividad');
        expect(result).toHaveProperty('severidad');
        expect(result).toHaveProperty('requiereCautela');
    });
});
