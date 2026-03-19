/**
 * scl_90_r.engine.test.ts — Tests del motor de scoring SCL-90-R
 *
 * Cubre: validez, ítems críticos, scoring por dimensiones (promedios),
 * índices globales (GSI, TSP, PSDI), análisis de cambio e insights.
 */

import { describe, it, expect } from 'vitest';
import { scl90rEngine } from './scl_90_r.engine';
import { SCL_90_R_DEFINITION } from '../definitions/scl_90_r.definition';
import type {
    InventoryAdministration,
    ItemResponse,
} from '../types/inventory_types';

// ============================================================================
// Helpers de construcción de administraciones
// ============================================================================

/** IDs de todos los ítems del SCL-90-R (1-90) */
const ALL_ITEM_IDS = Array.from({ length: 90 }, (_, i) => i + 1);

/**
 * Crea una administración con distribución variada que evita aquiescencia.
 * Usa un patrón de +1/-1 en los últimos 12 ítems para mantener el máximo de
 * idénticos por debajo del umbral de 80.
 */
function createUniformAdmin(
    value: number,
    id = 'admin-uniform',
): InventoryAdministration {
    const values = Array(90).fill(value);

    // Variar 12 ítems para evitar aquiescencia (max 78 idénticos < 80 umbral)
    if (value >= 1 && value <= 3) {
        for (let i = 78; i < 90; i += 2) {
            values[i] = value - 1;
            values[i + 1] = value + 1;
        }
    } else if (value === 0) {
        for (let i = 78; i < 90; i++) {
            values[i] = 1;
        }
    } else if (value === 4) {
        for (let i = 78; i < 90; i++) {
            values[i] = 3;
        }
    }

    const responses: ItemResponse[] = ALL_ITEM_IDS.map((itemId, i) => ({
        item_id: itemId,
        value: values[i],
    }));
    return {
        id,
        inventory_id: 'scl_90_r',
        patient_id: 'patient-1',
        session_number: 1,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
    };
}

/**
 * Crea una administración con valores personalizados por ítem ID.
 * El fill pattern alterna entre 0 y 1 para evitar aquiescencia
 * (max 45 idénticas < 80 umbral).
 */
function createCustomAdmin(
    itemValues: Array<{ id: number; value: number }>,
    id = 'admin-custom',
    fillValue = 0,
): InventoryAdministration {
    const valueMap = new Map(itemValues.map((iv) => [iv.id, iv.value]));
    const responses: ItemResponse[] = ALL_ITEM_IDS.map((itemId, i) => ({
        item_id: itemId,
        // Si el ítem tiene un valor personalizado, usarlo.
        // Si no, alternar entre fillValue y fillValue+1 (o 0/1) para evitar aquiescencia.
        value: valueMap.has(itemId)
            ? valueMap.get(itemId)!
            : (i % 2 === 0 ? fillValue : Math.min(fillValue + 1, 4)),
    }));
    return {
        id,
        inventory_id: 'scl_90_r',
        patient_id: 'patient-1',
        session_number: 1,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
    };
}

/** Crea una administración parcial (N ítems respondidos) */
function createPartialAdmin(
    count: number,
    value = 2,
    id = 'admin-partial',
): InventoryAdministration {
    const responses: ItemResponse[] = ALL_ITEM_IDS.slice(0, count).map(
        (itemId) => ({
            item_id: itemId,
            value,
        }),
    );
    return {
        id,
        inventory_id: 'scl_90_r',
        patient_id: 'patient-1',
        session_number: 1,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
    };
}

/** Ítems de la dimensión Depresión */
const DEP_ITEMS = [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79];
/** Ítems de la dimensión Ansiedad */
const ANS_ITEMS = [2, 17, 23, 33, 39, 57, 72, 78, 80, 86];
/** Ítems de la dimensión Somatizaciones */
const SOM_ITEMS = [1, 4, 12, 27, 40, 42, 48, 49, 52, 53, 56, 58];

// ============================================================================
// Tests
// ============================================================================

describe('SCL-90-R Engine', () => {
    // ── checkCriticalItems ──────────────────────────────────────────────────
    describe('checkCriticalItems', () => {
        it('detecta ítem 15 (ideación suicida) ≥ 1', () => {
            const admin = createCustomAdmin([{ id: 15, value: 1 }]);
            const alerts = scl90rEngine.checkCriticalItems(
                admin,
                SCL_90_R_DEFINITION,
            );
            const suicideAlerts = alerts.filter((a) => a.item_id === 15);
            expect(suicideAlerts.length).toBeGreaterThan(0);
            expect(suicideAlerts[0].urgency).toBe('moderate');
        });

        it('detecta ítem 15 = 3 como emergencia', () => {
            const admin = createCustomAdmin([{ id: 15, value: 3 }]);
            const alerts = scl90rEngine.checkCriticalItems(
                admin,
                SCL_90_R_DEFINITION,
            );
            const emergencyAlerts = alerts.filter(
                (a) => a.item_id === 15 && a.urgency === 'critical',
            );
            expect(emergencyAlerts.length).toBeGreaterThan(0);
        });

        it('detecta ítem 59 (pensamientos de muerte) ≥ 2', () => {
            const admin = createCustomAdmin([{ id: 59, value: 2 }]);
            const alerts = scl90rEngine.checkCriticalItems(
                admin,
                SCL_90_R_DEFINITION,
            );
            const deathAlerts = alerts.filter((a) => a.item_id === 59);
            expect(deathAlerts.length).toBeGreaterThan(0);
        });

        it('detecta ítem 16 (alucinaciones auditivas) ≥ 2', () => {
            const admin = createCustomAdmin([{ id: 16, value: 2 }]);
            const alerts = scl90rEngine.checkCriticalItems(
                admin,
                SCL_90_R_DEFINITION,
            );
            const psychAlerts = alerts.filter((a) => a.item_id === 16);
            expect(psychAlerts.length).toBeGreaterThan(0);
        });

        it('no genera alertas si ítems críticos = 0', () => {
            const admin = createCustomAdmin([
                { id: 15, value: 0 },
                { id: 59, value: 0 },
                { id: 16, value: 0 },
            ]);
            const alerts = scl90rEngine.checkCriticalItems(
                admin,
                SCL_90_R_DEFINITION,
            );
            expect(alerts.length).toBe(0);
        });
    });

    // ── checkValidity ───────────────────────────────────────────────────────
    describe('checkValidity', () => {
        it('válido con 90 respuestas', () => {
            const admin = createUniformAdmin(2);
            const result = scl90rEngine.checkValidity(
                admin,
                SCL_90_R_DEFINITION,
            );
            expect(result.is_valid).toBe(true);
        });

        it('válido con 72 respuestas (mínimo)', () => {
            const admin = createPartialAdmin(72);
            const result = scl90rEngine.checkValidity(
                admin,
                SCL_90_R_DEFINITION,
            );
            expect(result.is_valid).toBe(true);
        });

        it('inválido con 71 respuestas', () => {
            const admin = createPartialAdmin(71);
            const result = scl90rEngine.checkValidity(
                admin,
                SCL_90_R_DEFINITION,
            );
            expect(result.is_valid).toBe(false);
            expect(result.reason).toContain('71 de 90');
        });

        it('detecta sesgo de aquiescencia (80+ idénticas)', () => {
            // 82 respuestas con valor 2 + 8 con valor 3
            const values = ALL_ITEM_IDS.map((id) => ({
                id,
                value: id <= 82 ? 2 : 3,
            }));
            const admin = createCustomAdmin(values);
            const result = scl90rEngine.checkValidity(
                admin,
                SCL_90_R_DEFINITION,
            );
            expect(result.is_valid).toBe(false);
            expect(result.reason).toContain('aquiescencia');
        });

        it('no detecta aquiescencia con 79 idénticas', () => {
            const values = ALL_ITEM_IDS.map((id) => ({
                id,
                value: id <= 79 ? 2 : 3,
            }));
            const admin = createCustomAdmin(values);
            const result = scl90rEngine.checkValidity(
                admin,
                SCL_90_R_DEFINITION,
            );
            expect(result.is_valid).toBe(true);
        });
    });

    // ── score ───────────────────────────────────────────────────────────────
    describe('score', () => {
        it('administración inválida devuelve is_valid false', () => {
            const admin = createPartialAdmin(10);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            expect(result.is_valid).toBe(false);
            expect(result.severity_label).toBe('No válido');
            expect(result.total_score).toBe(0);
        });

        it('todo a 0 → sin riesgo, GSI = 0', () => {
            const admin = createUniformAdmin(0);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            expect(result.is_valid).toBe(true);
            expect(result.severity_label).toBe('Sin riesgo psicopatológico');
            // GSI ≈ 12/90 ≈ 0.13 (los 12 items variados suman 12)
            const gsi = result.subscale_results.find((s) => s.id === 'gsi');
            expect(gsi).toBeDefined();
            expect(gsi!.score).toBeLessThan(0.5);
        });

        it('todo a 4 → riesgo elevado', () => {
            const admin = createUniformAdmin(4);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            expect(result.is_valid).toBe(true);
            expect(result.severity_label).toBe('Riesgo psicopatológico elevado');
            const gsi = result.subscale_results.find((s) => s.id === 'gsi');
            expect(gsi!.score).toBeGreaterThan(3);
        });

        it('calcula 9 dimensiones + 3 índices = 12 subscale_results', () => {
            const admin = createUniformAdmin(2);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            // 9 dimensiones + GSI + TSP + PSDI = 12
            expect(result.subscale_results.length).toBe(12);
        });

        it('dimensiones son PROMEDIOS, no sumas', () => {
            // Poner todos los ítems SOM a 2, resto a 0
            const values = SOM_ITEMS.map((id) => ({ id, value: 2 }));
            const admin = createCustomAdmin(values);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const som = result.subscale_results.find((s) => s.id === 'som');
            expect(som).toBeDefined();
            // Promedio SOM = 2*12 / 12 = 2.0
            expect(som!.score).toBe(2);
            // raw_score = suma
            expect(som!.raw_score).toBe(24);
        });

        it('GSI = suma total / nº respuestas', () => {
            const admin = createUniformAdmin(1);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const gsi = result.subscale_results.find((s) => s.id === 'gsi');
            expect(gsi).toBeDefined();
            // 78 items a 1 + 6 items a 0 + 6 items a 2 = 78+0+12 = 90
            // GSI = 90/90 = 1.0
            expect(gsi!.score).toBe(1);
        });

        it('TSP cuenta ítems > 0', () => {
            // 45 items a 1, 45 items a 0
            const values = ALL_ITEM_IDS.map((id) => ({
                id,
                value: id <= 45 ? 1 : 0,
            }));
            const admin = createCustomAdmin(values);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const tsp = result.subscale_results.find((s) => s.id === 'tsp');
            expect(tsp).toBeDefined();
            expect(tsp!.score).toBe(45);
        });

        it('PSDI = suma total / TSP', () => {
            // Todos los 90 ítems a 3 (variados para evitar aquiescencia)
            const admin = createUniformAdmin(3);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const psdi = result.subscale_results.find((s) => s.id === 'psdi');
            expect(psdi).toBeDefined();
            // Todos respondidos > 0, así que PSDI = suma/TSP ≈ 3
            expect(psdi!.score).toBeGreaterThan(2.5);
        });

        it('detecta riesgo por ≥2 dimensiones ≥ T65 (aunque GSI < T65)', () => {
            // Elevar solo DEP y ANS a 3, resto a 0
            const elevatedItems = [
                ...DEP_ITEMS.map((id) => ({ id, value: 3 })),
                ...ANS_ITEMS.map((id) => ({ id, value: 3 })),
            ];
            const admin = createCustomAdmin(elevatedItems);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);

            // Verificar que DEP y ANS tienen severity_label con "RIESGO"
            const dep = result.subscale_results.find((s) => s.id === 'dep');
            const ans = result.subscale_results.find((s) => s.id === 'ans');
            expect(dep?.severity_label).toContain('RIESGO');
            expect(ans?.severity_label).toContain('RIESGO');
        });

        it('incluye alertas críticas en clinical_note', () => {
            const admin = createCustomAdmin([{ id: 15, value: 3 }]);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            expect(result.clinical_note).toContain('ALERTAS CRÍTICAS');
        });
    });

    // ── analyzeChange ───────────────────────────────────────────────────────
    describe('analyzeChange', () => {
        it('sin cambio → unchanged', () => {
            const admin1 = createUniformAdmin(2, 'baseline');
            const admin2 = createUniformAdmin(2, 'current');
            const change = scl90rEngine.analyzeChange(
                admin1,
                admin2,
                SCL_90_R_DEFINITION,
            );
            expect(change.category).toBe('unchanged');
            expect(change.is_reliable_change).toBe(false);
        });

        it('mejora grande bajo cutoff → recovered', () => {
            // GSI alto → GSI bajo (< 1.32)
            const admin1 = createUniformAdmin(3, 'baseline'); // GSI ≈ 3
            // GSI bajo: todos a 0 → GSI ≈ 0.13
            const admin2 = createUniformAdmin(0, 'current');
            const change = scl90rEngine.analyzeChange(
                admin1,
                admin2,
                SCL_90_R_DEFINITION,
            );
            expect(change.category).toBe('recovered');
            expect(change.is_reliable_change).toBe(true);
            expect(change.raw_change).toBeLessThan(0);
        });

        it('empeoramiento fiable → deteriorated', () => {
            const admin1 = createUniformAdmin(0, 'baseline');
            const admin2 = createUniformAdmin(3, 'current');
            const change = scl90rEngine.analyzeChange(
                admin1,
                admin2,
                SCL_90_R_DEFINITION,
            );
            expect(change.category).toBe('deteriorated');
            expect(change.is_reliable_change).toBe(true);
            expect(change.raw_change).toBeGreaterThan(0);
        });

        it('devuelve GSI promedio (no suma total) como scores', () => {
            const admin1 = createUniformAdmin(2, 'baseline');
            const admin2 = createUniformAdmin(1, 'current');
            const change = scl90rEngine.analyzeChange(
                admin1,
                admin2,
                SCL_90_R_DEFINITION,
            );
            // Los scores deben ser GSI promedio, no sumas brutas
            expect(change.baseline_score).toBeLessThan(5); // GSI, no 180
            expect(change.current_score).toBeLessThan(5);
        });
    });

    // ── generateInsights ────────────────────────────────────────────────────
    describe('generateInsights', () => {
        it('genera insights para administración válida', () => {
            const admin = createUniformAdmin(2);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const insights = scl90rEngine.generateInsights!(
                result,
                SCL_90_R_DEFINITION,
            );
            expect(insights.length).toBeGreaterThan(0);
            expect(insights[0]).toContain('Índice Global de Severidad');
        });

        it('incluye TSP (amplitud) y PSDI (estilo respuesta)', () => {
            const admin = createUniformAdmin(2);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const insights = scl90rEngine.generateInsights!(
                result,
                SCL_90_R_DEFINITION,
            );
            const tspInsight = insights.find((i) => i.includes('Amplitud'));
            const psdiInsight = insights.find((i) => i.includes('PSDI'));
            expect(tspInsight).toBeDefined();
            expect(psdiInsight).toBeDefined();
        });

        it('detecta comorbilidad DEP-ANS', () => {
            // Elevar DEP y ANS
            const elevatedItems = [
                ...DEP_ITEMS.map((id) => ({ id, value: 4 })),
                ...ANS_ITEMS.map((id) => ({ id, value: 4 })),
            ];
            const admin = createCustomAdmin(elevatedItems);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const insights = scl90rEngine.generateInsights!(
                result,
                SCL_90_R_DEFINITION,
            );
            const comorbInsight = insights.find((i) =>
                i.includes('comórbido'),
            );
            expect(comorbInsight).toBeDefined();
        });

        it('devuelve mensaje para administración no válida', () => {
            const admin = createPartialAdmin(10);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const insights = scl90rEngine.generateInsights!(
                result,
                SCL_90_R_DEFINITION,
            );
            expect(insights[0]).toContain('no válida');
        });

        it('alerta si hay ítems críticos activados', () => {
            const admin = createCustomAdmin([{ id: 15, value: 3 }]);
            const result = scl90rEngine.score(admin, SCL_90_R_DEFINITION);
            const insights = scl90rEngine.generateInsights!(
                result,
                SCL_90_R_DEFINITION,
            );
            const alertInsight = insights.find((i) => i.includes('alerta'));
            expect(alertInsight).toBeDefined();
        });
    });

    // ── SCL_90_R_DEFINITION structure ────────────────────────────────────────
    describe('SCL_90_R_DEFINITION', () => {
        it('tiene 90 ítems', () => {
            expect(SCL_90_R_DEFINITION.items.length).toBe(90);
        });

        it('cada ítem tiene 5 opciones (Likert 0-4)', () => {
            for (const item of SCL_90_R_DEFINITION.items) {
                expect(item.options.length).toBe(5);
                expect(item.options[0].value).toBe(0);
                expect(item.options[4].value).toBe(4);
            }
        });

        it('tiene 9 subescalas', () => {
            expect(SCL_90_R_DEFINITION.subscales?.length).toBe(9);
        });

        it('los IDs de ítems de las subescalas no se solapan', () => {
            const seen = new Set<number>();
            for (const sub of SCL_90_R_DEFINITION.subscales ?? []) {
                for (const n of sub.item_numbers) {
                    expect(seen.has(n)).toBe(false);
                    seen.add(n);
                }
            }
        });

        it('las 9 subescalas + 7 adicionales = 90 ítems', () => {
            const subscaleItems = new Set<number>();
            for (const sub of SCL_90_R_DEFINITION.subscales ?? []) {
                for (const n of sub.item_numbers) {
                    subscaleItems.add(n);
                }
            }
            // 7 ítems adicionales
            const additionalItems = SCL_90_R_DEFINITION.items.filter(
                (item) => !item.subscale_ids || item.subscale_ids.length === 0,
            );
            expect(subscaleItems.size + additionalItems.length).toBe(90);
        });

        it('ítems críticos incluyen suicidio y alucinaciones', () => {
            const domains = SCL_90_R_DEFINITION.critical_items.map(
                (c) => c.domain,
            );
            expect(domains).toContain('suicidio');
            expect(domains).toContain('psicosis');
        });

        it('technique_relevance incluye ac, rc y exposicion', () => {
            expect(
                SCL_90_R_DEFINITION.technique_relevance?.ac,
            ).toBeDefined();
            expect(
                SCL_90_R_DEFINITION.technique_relevance?.rc,
            ).toBeDefined();
            expect(
                SCL_90_R_DEFINITION.technique_relevance?.exposicion,
            ).toBeDefined();
        });

        it('todos los ítems tienen IDs únicos del 1 al 90', () => {
            const ids = SCL_90_R_DEFINITION.items.map((i) => i.id).sort(
                (a, b) => a - b,
            );
            expect(ids.length).toBe(90);
            expect(ids[0]).toBe(1);
            expect(ids[89]).toBe(90);
            // Sin duplicados
            const unique = new Set(ids);
            expect(unique.size).toBe(90);
        });

        it('composición de dimensiones coincide con la clave SCL-90-R', () => {
            const expectedComposition: Record<string, number[]> = {
                som: [1, 4, 12, 27, 40, 42, 48, 49, 52, 53, 56, 58],
                obs: [3, 9, 10, 28, 38, 45, 46, 51, 55, 65],
                si: [6, 21, 34, 36, 37, 41, 61, 69, 73],
                dep: [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79],
                ans: [2, 17, 23, 33, 39, 57, 72, 78, 80, 86],
                hos: [11, 24, 63, 67, 74, 81],
                fob: [13, 25, 47, 50, 70, 75, 82],
                par: [8, 18, 43, 68, 76, 83],
                psic: [7, 16, 35, 62, 77, 84, 85, 87, 88, 90],
            };

            for (const sub of SCL_90_R_DEFINITION.subscales ?? []) {
                expect(sub.item_numbers.sort((a, b) => a - b)).toEqual(
                    expectedComposition[sub.id].sort((a, b) => a - b),
                );
            }
        });
    });
});
