/**
 * phq_9.engine.test.ts — Tests del motor de scoring PHQ-9
 *
 * Casos cubiertos:
 *   - Caso feliz: administración completa, scoring correcto
 *   - Caso riesgo: ítem 9 activo → alerta antes del total
 *   - Caso validez: administración con menos de 7 ítems respondidos
 *   - Severidad clínica
 *   - Análisis de cambio
 *
 * Los tests son UNITARIOS: no montan React, no usan stores, no acceden a IndexedDB.
 */

import { describe, it, expect } from 'vitest';
import { phq9Engine } from './phq_9.engine';
import { PHQ_9_DEFINITION } from '../definitions/phq_9.definition';
import type { InventoryAdministration, ItemResponse } from '../types/inventory_types';

function makeAdministration(
    overrides: Partial<InventoryAdministration> = {},
    itemValues: Record<number, number> = {}
): InventoryAdministration {
    const responses: ItemResponse[] = Array.from({ length: 9 }, (_, i) => ({
        item_id: i + 1,
        value: itemValues[i + 1] ?? 0,
        answered_at: new Date().toISOString(),
    }));

    return {
        id: 'test-admin-phq9-001',
        inventory_id: 'phq_9',
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

describe('phq9Engine.checkCriticalItems', () => {
    it('no genera alertas cuando el ítem 9 es 0', () => {
        const admin = makeAdministration({}, { 9: 0 });
        const alerts = phq9Engine.checkCriticalItems(admin, PHQ_9_DEFINITION);
        expect(alerts).toHaveLength(0);
    });

    it('genera alerta "moderate" cuando el ítem 9 es 1', () => {
        const admin = makeAdministration({}, { 9: 1 });
        const alerts = phq9Engine.checkCriticalItems(admin, PHQ_9_DEFINITION);
        expect(alerts[0].urgency).toBe('moderate');
    });

    it('genera alerta "high" cuando el ítem 9 es 2', () => {
        const admin = makeAdministration({}, { 9: 2 });
        const alerts = phq9Engine.checkCriticalItems(admin, PHQ_9_DEFINITION);
        expect(alerts[0].urgency).toBe('high');
    });

    it('genera alerta "critical" cuando el ítem 9 es 3', () => {
        const admin = makeAdministration({}, { 9: 3 });
        const alerts = phq9Engine.checkCriticalItems(admin, PHQ_9_DEFINITION);
        expect(alerts[0].urgency).toBe('critical');
    });
});

describe('phq9Engine.checkValidity', () => {
    it('administración completa (9 ítems) es válida', () => {
        const admin = makeAdministration();
        const validity = phq9Engine.checkValidity(admin, PHQ_9_DEFINITION);
        expect(validity.is_valid).toBe(true);
    });

    it('administración incompleta (<7 ítems) es inválida', () => {
        const admin = makeAdministration();
        admin.responses.slice(0, 3).forEach(r => { r.value = null; r.answered_at = null; });
        const validity = phq9Engine.checkValidity(admin, PHQ_9_DEFINITION);
        expect(validity.is_valid).toBe(false);
        expect(validity.reason).toMatch(/Solo/);
    });
});

describe('phq9Engine.score', () => {
    it('calcula total y severidad correctamente', () => {
        const admin = makeAdministration({}, { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 });
        const result = phq9Engine.score(admin, PHQ_9_DEFINITION);
        expect(result.total_score).toBe(27);
        expect(result.severity_label).not.toBe('Sin clasificar');
        expect(result.is_valid).toBe(true);
    });

    it('devuelve total_score 0 y "No válido" si administración incompleta', () => {
        const admin = makeAdministration();
        admin.responses.slice(0, 3).forEach(r => { r.value = null; r.answered_at = null; });
        const result = phq9Engine.score(admin, PHQ_9_DEFINITION);
        expect(result.total_score).toBe(0);
        expect(result.severity_label).toBe('No válido');
        expect(result.is_valid).toBe(false);
    });
});

describe('phq9Engine.analyzeChange — Jacobson-Truax', () => {
    it('"unchanged" cuando el cambio no supera RCI', () => {
        // Baseline: 10 → Current: 9, cambio = -1
        // RCI = -1 / 3.17 ≈ -0.32 → |RCI| < 1.96 → no fiable
        const baseline = makeAdministration({ id: 'b1' }, { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 }); // total = 10
        const current = makeAdministration({ id: 'c1' }, { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 });  // total = 9

        const result = phq9Engine.analyzeChange(baseline, current, PHQ_9_DEFINITION);
        expect(result.category).toBe('unchanged');
        expect(result.is_reliable_change).toBe(false);
        expect(result.raw_change).toBe(-1);
    });

    it('"improved" con cambio fiable pero sin llegar a rango normativo', () => {
        // Baseline: 20, Current: 12 → cambio = -8
        // RCI = -8 / 3.17 ≈ -2.52 → fiable. current=12 ≥ 10 → improved
        const baseline = makeAdministration({ id: 'b2' }, {
            1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2,
        }); // total = 20
        const current = makeAdministration({ id: 'c2' }, {
            1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1,
        }); // total = 12

        const result = phq9Engine.analyzeChange(baseline, current, PHQ_9_DEFINITION);
        expect(result.is_reliable_change).toBe(true);
        expect(result.category).toBe('improved');
        expect(result.current_score).toBe(12);
        expect(result.clinical_interpretation).toMatch(/Mejora estadísticamente fiable/);
    });

    it('"recovered" cuando el cambio es fiable y current < 10', () => {
        // Baseline: 20, Current: 5 → cambio = -15
        // RCI = -15 / 3.17 ≈ -4.73 → fiable. current=5 < 10 → recovered
        const baseline = makeAdministration({ id: 'b3' }, {
            1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2,
        }); // total = 20
        const current = makeAdministration({ id: 'c3' }, {
            1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
        }); // total = 5

        const result = phq9Engine.analyzeChange(baseline, current, PHQ_9_DEFINITION);
        expect(result.is_reliable_change).toBe(true);
        expect(result.category).toBe('recovered');
        expect(result.current_score).toBe(5);
        expect(result.clinical_interpretation).toMatch(/Recuperación/);
    });

    it('"deteriorated" con empeoramiento fiable', () => {
        // Baseline: 5, Current: 18 → cambio = +13
        // RCI = 13 / 3.17 ≈ 4.10 → fiable, positivo → deteriorated
        const baseline = makeAdministration({ id: 'b4' }, {
            1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
        }); // total = 5
        const current = makeAdministration({ id: 'c4' }, {
            1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2,
        }); // total = 18

        const result = phq9Engine.analyzeChange(baseline, current, PHQ_9_DEFINITION);
        expect(result.is_reliable_change).toBe(true);
        expect(result.category).toBe('deteriorated');
        expect(result.raw_change).toBeGreaterThan(0);
        expect(result.clinical_interpretation).toMatch(/Empeoramiento/);
    });

    it('devuelve reliable_change_index numérico', () => {
        const a = makeAdministration({ id: 'b5' });
        const b = makeAdministration({ id: 'c5' });
        const result = phq9Engine.analyzeChange(a, b, PHQ_9_DEFINITION);
        expect(typeof result.reliable_change_index).toBe('number');
        expect(typeof result.baseline_score).toBe('number');
        expect(typeof result.current_score).toBe('number');
    });
});
