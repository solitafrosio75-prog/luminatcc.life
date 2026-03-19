/**
 * bads.engine.test.ts — Tests del motor de scoring BADS
 *
 * Casos cubiertos:
 *   - Caso feliz: administración completa, scoring/subescalas correctos
 *   - Caso validez: administración con menos de 20 ítems respondidos
 *   - Subescalas: activación, evitación/rumiación, deterioro trabajo, deterioro social
 *   - Severidad clínica
 *   - Análisis de cambio (placeholder)
 *
 * Los tests son UNITARIOS: no montan React, no usan stores, no acceden a IndexedDB.
 */

import { describe, it, expect } from 'vitest';
import { badsEngine } from './bads.engine';
import { BADS_DEFINITION } from '../definitions/bads.definition';
import type { InventoryAdministration, ItemResponse } from '../types/inventory_types';

function makeAdministration(
    overrides: Partial<InventoryAdministration> = {},
    itemValues: Record<number, number> = {}
): InventoryAdministration {
    const responses: ItemResponse[] = Array.from({ length: 25 }, (_, i) => ({
        item_id: i + 1,
        value: itemValues[i + 1] ?? 0,
        answered_at: new Date().toISOString(),
    }));

    return {
        id: 'test-admin-bads-001',
        inventory_id: 'bads',
        patient_id: 'patient-001',
        session_id: 'session-001',
        session_number: 1,
        phase: 'baseline',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
        ...overrides,
    };
}

describe('badsEngine.checkValidity', () => {
    it('administración completa (25 ítems) es válida', () => {
        const admin = makeAdministration();
        const validity = badsEngine.checkValidity(admin, BADS_DEFINITION);
        expect(validity.is_valid).toBe(true);
    });

    it('administración incompleta (<20 ítems) es inválida', () => {
        const admin = makeAdministration();
        admin.responses.slice(0, 6).forEach(r => { r.value = null; r.answered_at = null; });
        const validity = badsEngine.checkValidity(admin, BADS_DEFINITION);
        expect(validity.is_valid).toBe(false);
        expect(validity.reason).toMatch(/Solo/);
    });
});

describe('badsEngine.score', () => {
    it('calcula subescalas y total correctamente', () => {
        const admin = makeAdministration({}, {
            1: 5, 2: 5, 10: 5, 11: 5, // activación
            3: 0, 8: 0, 9: 0, 12: 0, 13: 0, 15: 0, 16: 0, 17: 0, // evitación/rumiación
            4: 0, 5: 0, 14: 0, 18: 0, // deterioro trabajo
            6: 0, 7: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0 // deterioro social
        });
        const result = badsEngine.score(admin, BADS_DEFINITION);
        expect(result.subscale_results).toHaveLength(4);
        expect(result.total_score).toBeGreaterThan(0);
        expect(result.severity_label).toBe('Activación conductual');
        expect(result.is_valid).toBe(true);
    });

    it('devuelve total_score 0 y "No válido" si administración incompleta', () => {
        const admin = makeAdministration();
        admin.responses.slice(0, 6).forEach(r => { r.value = null; r.answered_at = null; });
        const result = badsEngine.score(admin, BADS_DEFINITION);
        expect(result.total_score).toBe(0);
        expect(result.severity_label).toBe('No válido');
        expect(result.is_valid).toBe(false);
    });
});

describe('badsEngine.analyzeChange', () => {
    it('"unchanged" cuando el delta total < MID (15 pts)', () => {
        // Baseline y current con diferencia de solo ~10 pts → bajo MID
        const baseline = makeAdministration({ id: 'b1' });
        const current = makeAdministration({ id: 'c1' }, {
            1: 1, 2: 1, 10: 1, 11: 1, // +4 en activación directa
            // Ítems inversos a 0 → 6 pts c/u. Cambio: 6 pts extra
        });
        const result = badsEngine.analyzeChange(baseline, current, BADS_DEFINITION);
        expect(result.category).toBe('unchanged');
        expect(result.is_reliable_change).toBe(false);
        expect(result.clinical_interpretation).toMatch(/no alcanza/i);
    });

    it('"improved" cuando el delta total >= MID (positivo)', () => {
        // Baseline: todo a 0 → total bajo
        // Current: activación alta, evitación baja → total alto
        const baseline = makeAdministration({ id: 'b2' });
        const current = makeAdministration({ id: 'c2' }, {
            // Activación directa: 4 ítems × 5 = 20
            1: 5, 2: 5, 10: 5, 11: 5,
            // Evitación inversa (0 = bueno → 6 pts c/u): 8 ítems × 6 = 48
            3: 0, 8: 0, 9: 0, 12: 0, 13: 0, 15: 0, 16: 0, 17: 0,
        });
        const result = badsEngine.analyzeChange(baseline, current, BADS_DEFINITION);
        expect(result.category).toBe('improved');
        expect(result.is_reliable_change).toBe(true);
        expect(result.raw_change).toBeGreaterThanOrEqual(15);
        expect(result.clinical_interpretation).toMatch(/Mejora clínicamente relevante/);
        expect(result.clinical_interpretation).toMatch(/Subescalas con mejora/);
    });

    it('"deteriorated" cuando el delta total <= -MID', () => {
        // Baseline: activación alta
        const baseline = makeAdministration({ id: 'b3' }, {
            1: 5, 2: 5, 10: 5, 11: 5,
            3: 0, 8: 0, 9: 0, 12: 0, 13: 0, 15: 0, 16: 0, 17: 0,
        });
        // Current: todo a 0 → total bajo (activación 0, evitación invertida = 6×items)
        const current = makeAdministration({ id: 'c3' });
        const result = badsEngine.analyzeChange(baseline, current, BADS_DEFINITION);
        expect(result.category).toBe('deteriorated');
        expect(result.is_reliable_change).toBe(true);
        expect(result.raw_change).toBeLessThan(0);
        expect(result.clinical_interpretation).toMatch(/Empeoramiento clínicamente relevante/);
    });

    it('incluye detalle de subescalas con empeoramiento en la interpretación', () => {
        // Baseline: buena activación
        const baseline = makeAdministration({ id: 'b4' }, {
            1: 5, 2: 5, 10: 5, 11: 5,
        });
        // Current: activación baja
        const current = makeAdministration({ id: 'c4' }, {
            1: 0, 2: 0, 10: 0, 11: 0,
        });
        const result = badsEngine.analyzeChange(baseline, current, BADS_DEFINITION);
        expect(result.clinical_interpretation).toMatch(/Subescalas con empeoramiento/);
        expect(result.clinical_interpretation).toMatch(/Activación/);
    });

    it('devuelve baseline_score y current_score numéricos', () => {
        const admin1 = makeAdministration({ id: 'b5' });
        const admin2 = makeAdministration({ id: 'c5' });
        const result = badsEngine.analyzeChange(admin1, admin2, BADS_DEFINITION);
        expect(typeof result.baseline_score).toBe('number');
        expect(typeof result.current_score).toBe('number');
        expect(typeof result.raw_change).toBe('number');
    });
});
