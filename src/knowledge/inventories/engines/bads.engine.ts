/**
 * bads.engine.ts — Motor de scoring del BADS
 *
 * Funciones PURAS: sin side-effects, sin acceso a stores, sin imports de React.
 * Todas las funciones reciben sus datos completos como argumentos.
 * Testeable en aislamiento.
 *
 * Orden de operaciones:
 *   1. checkValidity() — ¿hay suficientes respuestas?
 *   2. checkCriticalItems() — (no hay ítems críticos en BADS estándar)
 *   3. Cálculo de subescalas (directa/inversa)
 *   4. Cálculo de total
 *   5. Determinación de severity_label
 *   6. generateInsights()
 */

import type {
    InventoryDefinition,
    InventoryAdministration,
    InventoryResult,
    InventoryEngine,
    SubscaleResult,
} from '../types/inventory_types';
import { BADS_DEFINITION } from '../definitions/bads.definition';

// ============================================================================
// Helpers internos
// ============================================================================

function getItemValue(
    administration: InventoryAdministration,
    itemId: number
): number | null {
    const response = administration.responses.find((r) => r.item_id === itemId);
    return response?.value ?? null;
}

function countValidResponses(administration: InventoryAdministration): number {
    return administration.responses.filter((r) => r.value !== null).length;
}

// Subescalas y dirección
const SUBSCALE_INFO: Record<string, { items: number[]; direction: 'direct' | 'inverse' }> = {
    activacion: { items: [1, 2, 10, 11], direction: 'direct' },
    evitacion_rumiacion: { items: [3, 8, 9, 12, 13, 15, 16, 17], direction: 'inverse' },
    deterioro_trabajo: { items: [4, 5, 14, 18], direction: 'inverse' },
    deterioro_social: { items: [6, 7, 19, 20, 21, 22, 23, 24, 25], direction: 'inverse' },
};

function scoreSubscale(
    administration: InventoryAdministration,
    itemIds: number[],
    direction: 'direct' | 'inverse'
): number {
    return itemIds.reduce((sum, itemId) => {
        const value = getItemValue(administration, itemId);
        if (value === null) return sum;
        return sum + (direction === 'direct' ? value : 6 - value);
    }, 0);
}

// ============================================================================
// Motor BADS
// ============================================================================

export const badsEngine: InventoryEngine = {
    checkCriticalItems(_admin, _def) {
        // BADS estándar no tiene ítems críticos
        return [];
    },

    checkValidity(administration, _definition) {
        const validCount = countValidResponses(administration);
        if (validCount < 20) {
            return {
                is_valid: false,
                reason: `Solo ${validCount} de 25 ítems respondidos. Se requieren al menos 20 para una puntuación válida.`,
            };
        }
        return { is_valid: true };
    },

    score(administration, definition) {
        const now = new Date().toISOString();
        const validity = this.checkValidity(administration, definition);
        if (!validity.is_valid) {
            return {
                administration_id: administration.id,
                inventory_id: definition.id,
                total_score: 0,
                severity_label: 'No válido',
                clinical_note: validity.reason ?? 'Administración incompleta.',
                subscale_results: [],
                critical_alerts: [],
                is_valid: false,
                invalidity_reason: validity.reason,
                scored_at: now,
            };
        }
        // Subescalas
        const subscale_results: SubscaleResult[] = Object.entries(SUBSCALE_INFO).map(
            ([id, info]) => ({
                id,
                score: scoreSubscale(administration, info.items, info.direction),
                direction: info.direction,
            })
        );
        // Total
        const total_score = subscale_results.reduce((sum, s) => sum + s.score, 0);
        // Severidad (no hay niveles estándar, solo rango)
        const severity_label =
            total_score >= 0 && total_score <= 150
                ? 'Activación conductual'
                : 'Fuera de rango';
        const clinical_note =
            severity_label === 'Activación conductual'
                ? 'A mayor puntuación, mayor activación y menor evitación.'
                : 'Revisar administración.';
        return {
            administration_id: administration.id,
            inventory_id: definition.id,
            total_score,
            severity_label,
            clinical_note,
            subscale_results,
            critical_alerts: [],
            is_valid: true,
            scored_at: now,
        };
    },

    analyzeChange(baseline, current, definition) {
        // ── Calcular subescalas para baseline y current ──
        const subscaleLabels: Record<string, string> = {
            activacion: 'Activación',
            evitacion_rumiacion: 'Evitación/Rumiación',
            deterioro_trabajo: 'Deterioro trabajo/estudios',
            deterioro_social: 'Deterioro social',
        };

        const subscaleDeltas = Object.entries(SUBSCALE_INFO).map(([id, info]) => {
            const bScore = scoreSubscale(baseline, info.items, info.direction as 'direct' | 'inverse');
            const cScore = scoreSubscale(current, info.items, info.direction as 'direct' | 'inverse');
            return {
                id,
                name: subscaleLabels[id] ?? id,
                baseline: bScore,
                current: cScore,
                delta: cScore - bScore,
            };
        });

        const baseline_score = subscaleDeltas.reduce((s, d) => s + d.baseline, 0);
        const current_score = subscaleDeltas.reduce((s, d) => s + d.current, 0);
        const raw_change = current_score - baseline_score;

        // ── Clasificación por MID (Minimal Important Difference) ──
        // BADS: HIGHER = BETTER → raw_change positivo = mejora
        const mid = definition.clinical_change?.minimal_important_difference ?? 15;
        const absDelta = Math.abs(raw_change);

        let category: 'improved' | 'unchanged' | 'deteriorated';
        let is_reliable_change: boolean;

        if (absDelta < mid) {
            category = 'unchanged';
            is_reliable_change = false;
        } else if (raw_change > 0) {
            category = 'improved';
            is_reliable_change = true;
        } else {
            category = 'deteriorated';
            is_reliable_change = true;
        }

        // ── Interpretación clínica con detalle por subescala ──
        const parts: string[] = [];

        parts.push(
            `Cambio total: ${raw_change > 0 ? '+' : ''}${raw_change} puntos ` +
            `(${baseline_score} → ${current_score}, MID = ${mid}).`
        );

        if (category === 'unchanged') {
            parts.push(
                `El cambio no alcanza el umbral de diferencia mínima clínicamente importante (${mid} pts).`
            );
        } else if (category === 'improved') {
            parts.push(
                'Mejora clínicamente relevante en activación conductual.'
            );
        } else {
            parts.push(
                'Empeoramiento clínicamente relevante. Revisar barreras y adherencia al plan de activación.'
            );
        }

        const improved = subscaleDeltas.filter(d => d.delta > 0);
        const worsened = subscaleDeltas.filter(d => d.delta < 0);

        if (improved.length > 0) {
            parts.push(
                'Subescalas con mejora: ' +
                improved.map(d => `${d.name} (+${d.delta})`).join(', ') + '.'
            );
        }
        if (worsened.length > 0) {
            parts.push(
                'Subescalas con empeoramiento: ' +
                worsened.map(d => `${d.name} (${d.delta})`).join(', ') + '.'
            );
        }

        return {
            category,
            clinical_interpretation: parts.join(' '),
            baseline_score,
            current_score,
            raw_change,
            is_reliable_change,
        };
    },
};
