/**
 * das.engine.test.ts — Tests del motor de scoring DAS
 *
 * Cubre: validez, scoring total, subescalas, análisis de cambio,
 * aquiescencia, insights y perfil cognitivo.
 */

import { describe, it, expect } from 'vitest';
import { dasEngine } from './das.engine';
import { DAS_DEFINITION } from '../definitions/das.definition';
import type {
    InventoryAdministration,
    ItemResponse,
} from '../types/inventory_types';

// ============================================================================
// Helpers de construcción de administraciones
// ============================================================================

/**
 * Crea una administración con distribución variada que logra un total objetivo.
 * Evita el sesgo de aquiescencia (no más de 31 respuestas idénticas).
 *
 * Estrategia: llena la mayoría con `baseValue` y varía los últimos 5 ítems
 * con ±1 para evitar que 32+ sean idénticos, manteniendo la suma objetivo.
 */
function createUniformAdmin(
    value: number,
    id = 'admin-uniform',
): InventoryAdministration {
    // Crear distribución variada que suma lo mismo que 35*value
    const values = Array(35).fill(value);
    // Variar 5 ítems para evitar aquiescencia (max 30 idénticos < 32 umbral).
    // Pares de +1/-1 mantienen la suma, excepto en bordes (0, 4).
    if (value >= 1 && value <= 3) {
        // 5 ítems variados: +1 en 2, -1 en 3 (neto = -1, sum ≈ 35*value - 1)
        // Actually use balanced pairs: +1 on 3, -1 on 3 → neto 0, 29 same
        values[29] = value - 1;
        values[30] = value + 1;
        values[31] = value - 1;
        values[32] = value + 1;
        values[33] = value - 1;
        values[34] = value + 1;
        // 29 same + 3*(v-1) + 3*(v+1) = 29v + 3v-3 + 3v+3 = 35v → exact same sum
    } else if (value === 0) {
        // Can't go below 0. Put 6 items at 1 → sum = 6 (not 0)
        values[29] = 1;
        values[30] = 1;
        values[31] = 1;
        values[32] = 1;
        values[33] = 1;
        values[34] = 1;
        // 29 zeros + 6 ones → max same = 29 < 32 ✓, sum = 6
    } else if (value === 4) {
        // Can't go above 4. Put 6 items at 3 → sum = 29*4 + 6*3 = 116+18 = 134
        values[29] = 3;
        values[30] = 3;
        values[31] = 3;
        values[32] = 3;
        values[33] = 3;
        values[34] = 3;
        // 29 fours + 6 threes → max same = 29 < 32 ✓, sum = 134
    }

    const responses: ItemResponse[] = values.map((v, i) => ({
        item_id: i + 1,
        value: v,
    }));
    return {
        id,
        inventory_id: 'das',
        patient_id: 'patient-1',
        session_number: 1,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
    };
}

/** Crea una administración con respuestas personalizadas */
function createCustomAdmin(
    values: number[],
    id = 'admin-custom',
): InventoryAdministration {
    const responses: ItemResponse[] = values.map((v, i) => ({
        item_id: i + 1,
        value: v,
    }));
    return {
        id,
        inventory_id: 'das',
        patient_id: 'patient-1',
        session_number: 1,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
    };
}

/** Crea una administración con N respuestas (parcial) */
function createPartialAdmin(
    count: number,
    value = 2,
    id = 'admin-partial',
): InventoryAdministration {
    const responses: ItemResponse[] = Array.from(
        { length: count },
        (_, i) => ({
            item_id: i + 1,
            value,
        }),
    );
    return {
        id,
        inventory_id: 'das',
        patient_id: 'patient-1',
        session_number: 1,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses,
    };
}

// ============================================================================
// Tests
// ============================================================================

describe('DAS Engine', () => {
    // ── checkCriticalItems ──────────────────────────────────────────────────
    describe('checkCriticalItems', () => {
        it('siempre devuelve array vacío (DAS no tiene ítems críticos)', () => {
            const admin = createUniformAdmin(4);
            const alerts = dasEngine.checkCriticalItems(admin, DAS_DEFINITION);
            expect(alerts).toEqual([]);
        });
    });

    // ── checkValidity ───────────────────────────────────────────────────────
    describe('checkValidity', () => {
        it('válido con 35 respuestas', () => {
            const admin = createUniformAdmin(2);
            const result = dasEngine.checkValidity(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(true);
        });

        it('válido con 28 respuestas (mínimo)', () => {
            const admin = createPartialAdmin(28);
            const result = dasEngine.checkValidity(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(true);
        });

        it('inválido con 27 respuestas', () => {
            const admin = createPartialAdmin(27);
            const result = dasEngine.checkValidity(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(false);
            expect(result.reason).toContain('27 de 35');
        });

        it('inválido con 0 respuestas', () => {
            const admin = createPartialAdmin(0);
            const result = dasEngine.checkValidity(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(false);
        });

        it('detecta sesgo de aquiescencia (32+ respuestas idénticas)', () => {
            // 33 respuestas con valor 3 + 2 con valor 1
            const values = [...Array(33).fill(3), 1, 1];
            const admin = createCustomAdmin(values);
            const result = dasEngine.checkValidity(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(false);
            expect(result.reason).toContain('aquiescencia');
        });

        it('no detecta aquiescencia con variación suficiente', () => {
            // 31 respuestas con valor 3 + 4 con otros valores
            const values = [...Array(31).fill(3), 0, 1, 2, 4];
            const admin = createCustomAdmin(values);
            const result = dasEngine.checkValidity(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(true);
        });
    });

    // ── score ───────────────────────────────────────────────────────────────
    describe('score', () => {
        it('puntuación cercana a mínima → Mínimo', () => {
            const admin = createUniformAdmin(0);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            // 29 zeros + 6 ones = 6
            expect(result.total_score).toBe(6);
            expect(result.severity_label).toBe('Mínimo');
            expect(result.is_valid).toBe(true);
        });

        it('puntuación cercana a máxima → Severo', () => {
            const admin = createUniformAdmin(4);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            // 29 fours + 6 threes = 116+18 = 134
            expect(result.total_score).toBe(134);
            expect(result.severity_label).toBe('Severo');
        });

        it('respuesta neutra → Leve', () => {
            const admin = createUniformAdmin(2);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            // 31 twos + 2 ones + 2 threes = 62+2+6 = 70
            expect(result.total_score).toBe(70);
            expect(result.severity_label).toBe('Leve');
        });

        it('administración inválida devuelve is_valid false', () => {
            const admin = createPartialAdmin(10);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            expect(result.is_valid).toBe(false);
            expect(result.severity_label).toBe('No válido');
            expect(result.total_score).toBe(0);
        });

        it('calcula subescalas clásicas correctamente', () => {
            // Items 1-5 (aprobación) = 4 cada uno = 20
            // Items 6-10 (amor) = 3 cada uno = 15
            // Items 11-15 (logro) = 2 cada uno = 10
            // Items 16-20 (perfeccionismo) = 1 cada uno = 5
            // Items 21-25 (derechos) = 0 cada uno = 0
            // Items 26-29 (omnipotencia) = 2 cada uno = 8
            // Items 30-35 (autonomía) = 3 cada uno = 18
            const values = [
                4, 4, 4, 4, 4,       // aprobación
                3, 3, 3, 3, 3,       // amor
                2, 2, 2, 2, 2,       // logro
                1, 1, 1, 1, 1,       // perfeccionismo
                0, 0, 0, 0, 0,       // derechos
                2, 2, 2, 2,          // omnipotencia
                3, 3, 3, 3, 3, 3,    // autonomía
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);

            expect(result.total_score).toBe(76);
            expect(result.severity_label).toBe('Moderado');

            // Verificar subescalas clásicas
            const aprobacion = result.subscale_results.find(
                (s) => s.id === 'aprobacion',
            );
            expect(aprobacion?.score).toBe(20);

            const amor = result.subscale_results.find(
                (s) => s.id === 'amor',
            );
            expect(amor?.score).toBe(15);

            const logro = result.subscale_results.find(
                (s) => s.id === 'logro',
            );
            expect(logro?.score).toBe(10);

            const perfeccionismo = result.subscale_results.find(
                (s) => s.id === 'perfeccionismo',
            );
            expect(perfeccionismo?.score).toBe(5);

            const derechos = result.subscale_results.find(
                (s) => s.id === 'derechos',
            );
            expect(derechos?.score).toBe(0);

            const omnipotencia = result.subscale_results.find(
                (s) => s.id === 'omnipotencia',
            );
            expect(omnipotencia?.score).toBe(8);

            const autonomia = result.subscale_results.find(
                (s) => s.id === 'autonomia',
            );
            expect(autonomia?.score).toBe(18);
        });

        it('calcula factores de segundo orden correctamente', () => {
            const values = [
                4, 4, 4, 4, 4,       // aprobación
                3, 3, 3, 3, 3,       // amor
                2, 2, 2, 2, 2,       // logro (factor 1)
                1, 1, 1, 1, 1,       // perfeccionismo (factor 1)
                0, 0, 0, 0, 0,       // derechos
                2, 2, 2, 2,          // omnipotencia
                3, 3, 3, 3, 3, 3,    // autonomía (item 30 en dependencia)
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);

            // Factor 1: Logro/Perfeccionismo = ítems 11-20
            // items 11-15 = 2*5 = 10, items 16-20 = 1*5 = 5 → total 15
            const factorLogro = result.subscale_results.find(
                (s) => s.id === 'logro_perfeccionismo',
            );
            expect(factorLogro?.score).toBe(15);

            // Factor 2: Dependencia = ítems 1-10,30
            // items 1-5 = 4*5 = 20, items 6-10 = 3*5 = 15, item 30 = 3 → total 38
            const factorDep = result.subscale_results.find(
                (s) => s.id === 'dependencia',
            );
            expect(factorDep?.score).toBe(38);
        });

        it('contiene información de ítems respondidos por subescala', () => {
            // Use a custom admin to avoid acquiescence (mix of 1s and 3s)
            const values = [
                1, 3, 1, 3, 1,       // aprobación (5 items)
                3, 1, 3, 1, 3,       // amor
                1, 3, 1, 3, 1,       // logro
                3, 1, 3, 1, 3,       // perfeccionismo
                1, 3, 1, 3, 1,       // derechos
                3, 1, 3, 1,          // omnipotencia (4 items)
                3, 1, 3, 1, 3, 1,    // autonomía (6 items)
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);

            const aprobacion = result.subscale_results.find(
                (s) => s.id === 'aprobacion',
            );
            expect(aprobacion?.items_answered).toBe(5);
            expect(aprobacion?.items_total).toBe(5);

            const omnipotencia = result.subscale_results.find(
                (s) => s.id === 'omnipotencia',
            );
            expect(omnipotencia?.items_total).toBe(4);
        });

        it('critical_alerts siempre vacío', () => {
            const admin = createUniformAdmin(4);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            expect(result.critical_alerts).toEqual([]);
        });

        it('severity levels cubren todo el rango 0-140', () => {
            const testScores = [0, 35, 36, 70, 71, 105, 106, 140];
            for (const targetScore of testScores) {
                // Distribute score across items
                const perItem = Math.floor(targetScore / 35);
                const remainder = targetScore - perItem * 35;
                const values = Array(35).fill(perItem);
                // Add remainder to first items
                for (let i = 0; i < remainder; i++) {
                    values[i] = perItem + 1;
                }
                const admin = createCustomAdmin(values);
                const result = dasEngine.score(admin, DAS_DEFINITION);
                expect(result.severity_label).not.toBe('Sin clasificar');
            }
        });
    });

    // ── analyzeChange ───────────────────────────────────────────────────────
    describe('analyzeChange', () => {
        it('sin cambio: misma puntuación → unchanged', () => {
            const admin1 = createUniformAdmin(2, 'baseline');
            const admin2 = createUniformAdmin(2, 'current');
            const change = dasEngine.analyzeChange(
                admin1,
                admin2,
                DAS_DEFINITION,
            );
            expect(change.category).toBe('unchanged');
            expect(change.raw_change).toBe(0);
            expect(change.is_reliable_change).toBe(false);
        });

        it('cambio pequeño (no fiable) → unchanged', () => {
            // 70 → 60 = -10 puntos. SEdiff ≈ 13.23 → RCI ≈ -0.76 < 1.96
            const admin1 = createUniformAdmin(2, 'baseline'); // 70
            const values2 = Array(35).fill(2);
            // Reducir 10 puntos
            for (let i = 0; i < 10; i++) values2[i] = 1;
            const admin2 = createCustomAdmin(values2, 'current'); // 60
            const change = dasEngine.analyzeChange(
                admin1,
                admin2,
                DAS_DEFINITION,
            );
            expect(change.category).toBe('unchanged');
            expect(change.is_reliable_change).toBe(false);
        });

        it('mejora grande → improved (si aún > cutoff)', () => {
            // 140 → 80 = -60 puntos. RCI = -60/13.23 ≈ -4.54 → fiable
            // 80 > 36 (cutoff) → improved (no recovered)
            const admin1 = createUniformAdmin(4, 'baseline'); // 140
            const values2 = Array(35).fill(2);
            // Ajustar para llegar a ~80
            for (let i = 0; i < 10; i++) values2[i] = 3;
            const admin2 = createCustomAdmin(values2, 'current'); // 80
            const change = dasEngine.analyzeChange(
                admin1,
                admin2,
                DAS_DEFINITION,
            );
            expect(change.category).toBe('improved');
            expect(change.is_reliable_change).toBe(true);
            expect(change.raw_change).toBeLessThan(0);
        });

        it('mejora grande → recovered (si < cutoff)', () => {
            // 105 → 20 = -85 puntos. 20 < 36 → recovered
            const admin1 = createUniformAdmin(3, 'baseline'); // 105
            const values2 = Array(35).fill(0);
            // Ajustar: 20 total → ~0.57 por ítem
            for (let i = 0; i < 20; i++) values2[i] = 1;
            const admin2 = createCustomAdmin(values2, 'current'); // 20
            const change = dasEngine.analyzeChange(
                admin1,
                admin2,
                DAS_DEFINITION,
            );
            expect(change.category).toBe('recovered');
            expect(change.is_reliable_change).toBe(true);
            expect(change.current_score).toBeLessThan(36);
        });

        it('empeoramiento fiable → deteriorated', () => {
            // 35 → 105 = +70 puntos
            const admin1 = createUniformAdmin(1, 'baseline'); // 35
            const admin2 = createUniformAdmin(3, 'current'); // 105
            const change = dasEngine.analyzeChange(
                admin1,
                admin2,
                DAS_DEFINITION,
            );
            expect(change.category).toBe('deteriorated');
            expect(change.is_reliable_change).toBe(true);
            expect(change.raw_change).toBeGreaterThan(0);
        });

        it('devuelve todos los campos del ChangeAnalysis', () => {
            const admin1 = createUniformAdmin(3, 'baseline');
            const admin2 = createUniformAdmin(1, 'current');
            const change = dasEngine.analyzeChange(
                admin1,
                admin2,
                DAS_DEFINITION,
            );
            expect(change).toHaveProperty('baseline_score');
            expect(change).toHaveProperty('current_score');
            expect(change).toHaveProperty('raw_change');
            expect(change).toHaveProperty('reliable_change_index');
            expect(change).toHaveProperty('is_reliable_change');
            expect(change).toHaveProperty('category');
            expect(change).toHaveProperty('clinical_interpretation');
            // createUniformAdmin(3) → 29*3 + 3*2 + 3*4 = 87+6+12 = 105
            // createUniformAdmin(1) → 29*1 + 3*0 + 3*2 = 29+0+6 = 35
            expect(change.baseline_score).toBe(105);
            expect(change.current_score).toBe(35);
            expect(change.raw_change).toBe(-70);
        });
    });

    // ── generateInsights ────────────────────────────────────────────────────
    describe('generateInsights', () => {
        it('genera insights para administración válida', () => {
            // Use custom admin with variation (mix of 2s and 4s to avoid acquiescence)
            const values = [
                4, 2, 4, 2, 4,       // 16
                2, 4, 2, 4, 2,       // 14
                4, 2, 4, 2, 4,       // 16
                2, 4, 2, 4, 2,       // 14
                4, 2, 4, 2, 4,       // 16
                2, 4, 2, 4,          // 12
                2, 4, 2, 4, 2, 4,    // 18 → total = 106
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            const insights = dasEngine.generateInsights!(
                result,
                DAS_DEFINITION,
            );
            expect(insights.length).toBeGreaterThan(0);
            expect(insights[0]).toContain('106/140');
        });

        it('identifica perfil sociotrópico (alta dependencia)', () => {
            // Alta dependencia (items 1-10, 30) + bajo logro (items 11-20)
            const values = [
                4, 4, 4, 4, 4,       // aprobación (4*5=20)
                4, 4, 4, 4, 4,       // amor (4*5=20)
                0, 0, 0, 0, 0,       // logro (0)
                0, 0, 0, 0, 0,       // perfeccionismo (0)
                2, 2, 2, 2, 2,       // derechos
                2, 2, 2, 2,          // omnipotencia
                4, 2, 2, 2, 2, 2,    // autonomía (item 30=4, rest=2)
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            const insights = dasEngine.generateInsights!(
                result,
                DAS_DEFINITION,
            );
            const profileInsight = insights.find((i) =>
                i.includes('sociotrópico'),
            );
            expect(profileInsight).toBeDefined();
        });

        it('identifica perfil autónomo (alto logro/perfeccionismo)', () => {
            // Bajo en dependencia + alto en logro/perfeccionismo
            const values = [
                0, 0, 0, 0, 0,       // aprobación (0)
                0, 0, 0, 0, 0,       // amor (0)
                4, 4, 4, 4, 4,       // logro (20)
                4, 4, 4, 4, 4,       // perfeccionismo (20)
                2, 2, 2, 2, 2,       // derechos
                2, 2, 2, 2,          // omnipotencia
                0, 2, 2, 2, 2, 2,    // autonomía (item 30=0)
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            const insights = dasEngine.generateInsights!(
                result,
                DAS_DEFINITION,
            );
            const profileInsight = insights.find((i) =>
                i.includes('autónomo'),
            );
            expect(profileInsight).toBeDefined();
        });

        it('devuelve mensaje apropiado para administración no válida', () => {
            const admin = createPartialAdmin(10);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            const insights = dasEngine.generateInsights!(
                result,
                DAS_DEFINITION,
            );
            expect(insights[0]).toContain('no válida');
        });

        it('identifica áreas de vulnerabilidad elevada', () => {
            const values = [
                4, 4, 4, 4, 4,       // aprobación → 20/20 = 100% → elevada
                0, 0, 0, 0, 0,       // amor → 0
                0, 0, 0, 0, 0,       // logro → 0
                0, 0, 0, 0, 0,       // perfeccionismo → 0
                0, 0, 0, 0, 0,       // derechos → 0
                0, 0, 0, 0,          // omnipotencia → 0
                0, 0, 0, 0, 0, 0,    // autonomía → 0
            ];
            const admin = createCustomAdmin(values);
            const result = dasEngine.score(admin, DAS_DEFINITION);
            const insights = dasEngine.generateInsights!(
                result,
                DAS_DEFINITION,
            );
            const vulnInsight = insights.find((i) =>
                i.includes('vulnerabilidad'),
            );
            expect(vulnInsight).toContain('Aprobación');
        });
    });

    // ── DAS_DEFINITION structure ────────────────────────────────────────────
    describe('DAS_DEFINITION', () => {
        it('tiene 35 ítems', () => {
            expect(DAS_DEFINITION.items.length).toBe(35);
        });

        it('cada ítem tiene 5 opciones (Likert 0-4)', () => {
            for (const item of DAS_DEFINITION.items) {
                expect(item.options.length).toBe(5);
                expect(item.options[0].value).toBe(0);
                expect(item.options[4].value).toBe(4);
            }
        });

        it('tiene 9 subescalas (7 clásicas + 2 factores)', () => {
            expect(DAS_DEFINITION.subscales?.length).toBe(9);
        });

        it('los ítems de subescalas clásicas cubren todos los 35 ítems', () => {
            const classicIds = ['aprobacion', 'amor', 'logro', 'perfeccionismo', 'derechos', 'omnipotencia', 'autonomia'];
            const coveredItems = new Set<number>();
            for (const sub of DAS_DEFINITION.subscales ?? []) {
                if (classicIds.includes(sub.id)) {
                    for (const n of sub.item_numbers) {
                        coveredItems.add(n);
                    }
                }
            }
            expect(coveredItems.size).toBe(35);
            for (let i = 1; i <= 35; i++) {
                expect(coveredItems.has(i)).toBe(true);
            }
        });

        it('severity levels cubren todo el rango 0-140 sin gaps', () => {
            const levels = DAS_DEFINITION.severity_levels;
            expect(levels[0].range_min).toBe(0);
            expect(levels[levels.length - 1].range_max).toBe(140);
            for (let i = 1; i < levels.length; i++) {
                expect(levels[i].range_min).toBe(levels[i - 1].range_max + 1);
            }
        });

        it('technique_relevance incluye rc y ac', () => {
            expect(DAS_DEFINITION.technique_relevance?.rc).toBeDefined();
            expect(DAS_DEFINITION.technique_relevance?.ac).toBeDefined();
        });
    });
});
