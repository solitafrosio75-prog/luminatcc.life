/**
 * phq_9.engine.ts — Motor de scoring del PHQ-9
 *
 * Funciones PURAS: sin side-effects, sin acceso a stores, sin imports de React.
 * Testeable en aislamiento.
 *
 * Orden de operaciones:
 *   1. checkValidity() — ¿hay suficientes respuestas?
 *   2. checkCriticalItems() — ítem 9 (suicidio)
 *   3. Cálculo de total
 *   4. Determinación de severity_label
 *   5. generateInsights()
 *
 * Análisis de cambio: Jacobson & Truax (1991)
 * RCI = (score2 - score1) / SEdiff
 * SEdiff = SD * √(2 * (1 - r))
 * Parámetros normativos PHQ-9: SD = 5.6 (Kroenke et al., 2001), r = 0.84 (Löwe et al., 2004)
 */

import type {
    InventoryDefinition,
    InventoryAdministration,
    InventoryResult,
    InventoryEngine,
    CriticalItemAlert,
    ChangeAnalysis,
} from '../types/inventory_types';
import { PHQ_9_DEFINITION } from '../definitions/phq_9.definition';

// ============================================================================
// Parámetros estadísticos PHQ-9 para RCI (Jacobson-Truax)
// ============================================================================

/** Desviación estándar en muestra clínica (Kroenke et al., 2001) */
const PHQ9_SD = 5.6;

/** Coeficiente de fiabilidad test-retest a 48h (Löwe et al., 2004) */
const PHQ9_RELIABILITY = 0.84;

/**
 * Error estándar de la diferencia para RCI.
 * SEdiff = SD * √(2 * (1 - r))
 */
const PHQ9_SE_DIFF = PHQ9_SD * Math.sqrt(2 * (1 - PHQ9_RELIABILITY));

/** Umbral |RCI| ≥ 1.96 → cambio fiable al 95% de confianza */
const RCI_THRESHOLD = 1.96;

/**
 * Punto de corte para rango normativo (Jacobson-Truax criterio C).
 * PHQ-9: < 10 = sin depresión clínica significativa (Kroenke et al., 2001).
 */
const NORMATIVE_CUTOFF = 10;

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

export const phq9Engine: InventoryEngine = {
    checkCriticalItems(administration, definition) {
        const alerts: CriticalItemAlert[] = [];
        const value = getItemValue(administration, 9);
        if (value === null) return alerts;
        if (value >= 1) {
            let urgency: CriticalItemAlert['urgency'] = 'moderate';
            if (value >= 3) urgency = 'critical';
            else if (value >= 2) urgency = 'high';
            alerts.push({
                item_id: 9,
                value,
                domain_descriptor: 'Pensamientos suicidas o de autolesión',
                urgency,
            });
        }
        return alerts;
    },

    checkValidity(administration, _definition) {
        const validCount = countValidResponses(administration);
        if (validCount < 7) {
            return {
                is_valid: false,
                reason: `Solo ${validCount} de 9 ítems respondidos. Se requieren al menos 7 para una puntuación válida.`,
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
        const critical_alerts = this.checkCriticalItems(administration, definition);
        const total_score = administration.responses.reduce(
            (sum, r) => sum + (r.value ?? 0),
            0
        );
        const matchedLevel = definition.severity_levels.find(
            (l) => total_score >= l.range_min && total_score <= l.range_max
        );
        const severity_label = matchedLevel?.label ?? 'Sin clasificar';
        const clinical_note =
            matchedLevel?.clinical_implication ?? 'Revisar administración.';
        return {
            administration_id: administration.id,
            inventory_id: definition.id,
            total_score,
            severity_label,
            clinical_note,
            subscale_results: [],
            critical_alerts,
            is_valid: true,
            scored_at: now,
        };
    },

    // ──────────────────────────────────────────────────────────────────────────
    // Análisis de cambio — Jacobson-Truax (1991)
    //
    // PHQ-9: LOWER = BETTER (misma dirección que BDI-II)
    // raw_change < 0 → mejora (menos síntomas)
    //
    // Parámetros: SD=5.6 (Kroenke 2001), r=0.84 (Löwe 2004)
    // SEdiff ≈ 3.17, RCI threshold = 1.96
    // Cutoff normativo: < 10 (Kroenke 2001)
    // ──────────────────────────────────────────────────────────────────────────
    analyzeChange(
        baseline: InventoryAdministration,
        current: InventoryAdministration,
        definition: InventoryDefinition
    ): ChangeAnalysis {
        const scoreAdmin = (admin: InventoryAdministration): number =>
            admin.responses.reduce((sum, r) => sum + (r.value ?? 0), 0);

        const baseline_score = scoreAdmin(baseline);
        const current_score = scoreAdmin(current);
        const raw_change = current_score - baseline_score;

        // RCI = cambio / SEdiff
        const reliable_change_index =
            PHQ9_SE_DIFF === 0 ? 0 : raw_change / PHQ9_SE_DIFF;

        const is_reliable_change = Math.abs(reliable_change_index) >= RCI_THRESHOLD;

        // Categoría Jacobson-Truax (4 estados)
        let category: ChangeAnalysis['category'];
        let clinical_interpretation: string;

        if (!is_reliable_change) {
            category = 'unchanged';
            clinical_interpretation =
                `El cambio de ${raw_change > 0 ? '+' : ''}${raw_change} puntos ` +
                `(RCI = ${reliable_change_index.toFixed(2)}) no supera el umbral de fiabilidad estadística (1.96). ` +
                `No se puede concluir cambio clínicamente significativo.`;
        } else if (raw_change < 0) {
            // Mejora (puntuación baja = menos síntomas en PHQ-9)
            if (current_score < NORMATIVE_CUTOFF) {
                category = 'recovered';
                clinical_interpretation =
                    `Recuperación estadística y clínica (RCI = ${reliable_change_index.toFixed(2)}). ` +
                    `La puntuación actual (${current_score}) se encuentra en rango normativo (<${NORMATIVE_CUTOFF}). ` +
                    `Considerar fase de mantenimiento o alta progresiva.`;
            } else {
                category = 'improved';
                clinical_interpretation =
                    `Mejora estadísticamente fiable (RCI = ${reliable_change_index.toFixed(2)}): ` +
                    `${Math.abs(raw_change)} puntos de reducción. ` +
                    `La puntuación (${current_score}) aún no alcanza rango normativo (<${NORMATIVE_CUTOFF}). ` +
                    `Continuar tratamiento y reevaluar.`;
            }
        } else {
            category = 'deteriorated';
            clinical_interpretation =
                `Empeoramiento estadísticamente fiable (RCI = ${reliable_change_index.toFixed(2)}): ` +
                `+${raw_change} puntos. ` +
                `Revisar barreras, adherencia y factores estresores actuales. ` +
                `Si puntuación total ≥ 20, considerar interconsulta psiquiátrica.`;
        }

        return {
            baseline_score,
            current_score,
            raw_change,
            reliable_change_index,
            is_reliable_change,
            category,
            clinical_interpretation,
        };
    },
};
