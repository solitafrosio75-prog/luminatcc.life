/**
 * das.engine.ts — Motor de scoring de la DAS (Escala de Actitudes Disfuncionales)
 *
 * Funciones PURAS: sin side-effects, sin acceso a stores, sin imports de React.
 * Testeable en aislamiento.
 *
 * Orden de operaciones:
 *   1. checkValidity() — ¿hay suficientes respuestas? ¿patrón de aquiescencia?
 *   2. checkCriticalItems() — La DAS no tiene ítems críticos de riesgo vital
 *   3. Cálculo de total + subescalas
 *   4. Determinación de severity_label
 *   5. generateInsights() — perfil de vulnerabilidad cognitiva
 *
 * Análisis de cambio: Jacobson & Truax (1991)
 * RCI = (score2 - score1) / SEdiff
 * SEdiff = SD * √(2 * (1 - r))
 * Parámetros: SD = 18.0 (estimado Sanz & Vázquez, 1993), r = 0.73 test-retest
 */

import type {
    InventoryDefinition,
    InventoryAdministration,
    InventoryResult,
    InventoryEngine,
    CriticalItemAlert,
    SubscaleResult,
    ChangeAnalysis,
} from '../types/inventory_types';

// ============================================================================
// Parámetros estadísticos DAS para RCI (Jacobson-Truax)
// ============================================================================

/** Desviación estándar estimada (Sanz & Vázquez, 1993, escala 0-4, 35 ítems) */
const DAS_SD = 18.0;

/** Coeficiente de fiabilidad test-retest (Sanz & Vázquez, 1993) */
const DAS_RELIABILITY = 0.73;

/**
 * Error estándar de la diferencia para RCI.
 * SEdiff = SD * √(2 * (1 - r))
 */
const DAS_SE_DIFF = DAS_SD * Math.sqrt(2 * (1 - DAS_RELIABILITY));

/** Umbral |RCI| ≥ 1.96 → cambio fiable al 95% de confianza */
const RCI_THRESHOLD = 1.96;

/**
 * Punto de corte para rango normativo (Jacobson-Truax criterio C).
 * DAS 0-4: < 36 = creencias mayoritariamente adaptativas.
 */
const NORMATIVE_CUTOFF = 36;

/** Mínimo de ítems respondidos para validez (80% de 35 = 28) */
const MIN_VALID_RESPONSES = 28;

/** Umbral de aquiescencia: si 32+ ítems tienen la misma respuesta */
const ACQUIESCENCE_THRESHOLD = 32;

// ============================================================================
// Helpers
// ============================================================================

function getItemValue(
    administration: InventoryAdministration,
    itemId: number,
): number | null {
    const response = administration.responses.find((r) => r.item_id === itemId);
    return response?.value ?? null;
}

function countValidResponses(administration: InventoryAdministration): number {
    return administration.responses.filter((r) => r.value !== null).length;
}

function calculateTotal(administration: InventoryAdministration): number {
    return administration.responses.reduce(
        (sum, r) => sum + (r.value ?? 0),
        0,
    );
}

function checkAcquiescence(administration: InventoryAdministration): boolean {
    const valueCounts = new Map<number, number>();
    for (const r of administration.responses) {
        if (r.value !== null) {
            valueCounts.set(r.value, (valueCounts.get(r.value) ?? 0) + 1);
        }
    }
    for (const count of valueCounts.values()) {
        if (count >= ACQUIESCENCE_THRESHOLD) return true;
    }
    return false;
}

// ============================================================================
// Motor de scoring
// ============================================================================

export const dasEngine: InventoryEngine = {
    /**
     * La DAS no tiene ítems críticos de riesgo vital (como suicidio).
     * Siempre devuelve array vacío.
     */
    checkCriticalItems(
        _administration: InventoryAdministration,
        _definition: InventoryDefinition,
    ): CriticalItemAlert[] {
        return [];
    },

    /**
     * Validez: mínimo 28/35 ítems + ausencia de patrón de aquiescencia.
     */
    checkValidity(
        administration: InventoryAdministration,
        _definition: InventoryDefinition,
    ): { is_valid: boolean; reason?: string } {
        const validCount = countValidResponses(administration);

        if (validCount < MIN_VALID_RESPONSES) {
            return {
                is_valid: false,
                reason:
                    `Solo ${validCount} de 35 ítems respondidos. ` +
                    `Se requieren al menos ${MIN_VALID_RESPONSES} para una puntuación válida.`,
            };
        }

        if (checkAcquiescence(administration)) {
            return {
                is_valid: false,
                reason:
                    `Posible sesgo de aquiescencia: ${ACQUIESCENCE_THRESHOLD}+ ítems con la misma respuesta. ` +
                    `Considerar readministración.`,
            };
        }

        return { is_valid: true };
    },

    /**
     * Scoring completo: total + 7 subescalas clásicas + 2 factores de segundo orden.
     */
    score(
        administration: InventoryAdministration,
        definition: InventoryDefinition,
    ): InventoryResult {
        const now = new Date().toISOString();

        // 1. Validez
        const validity = this.checkValidity(administration, definition);
        if (!validity.is_valid) {
            return {
                administration_id: administration.id,
                inventory_id: definition.id,
                total_score: 0,
                severity_label: 'No válido',
                clinical_note: validity.reason ?? 'Administración no válida.',
                subscale_results: [],
                critical_alerts: [],
                is_valid: false,
                invalidity_reason: validity.reason,
                scored_at: now,
            };
        }

        // 2. Ítems críticos (siempre vacío para DAS)
        const critical_alerts = this.checkCriticalItems(administration, definition);

        // 3. Total
        const total_score = calculateTotal(administration);

        // 4. Severity label
        const matchedLevel = definition.severity_levels.find(
            (l) => total_score >= l.range_min && total_score <= l.range_max,
        );
        const severity_label = matchedLevel?.label ?? 'Sin clasificar';
        const clinical_note =
            matchedLevel?.clinical_implication ?? 'Revisar administración.';

        // 5. Subescalas
        const subscale_results: SubscaleResult[] = [];

        if (definition.subscales) {
            for (const sub of definition.subscales) {
                const itemScores = sub.item_numbers.map((n) =>
                    getItemValue(administration, n),
                );
                const answered = itemScores.filter((v) => v !== null);
                const raw_score = answered.reduce(
                    (sum, v) => sum + (v ?? 0),
                    0,
                );

                // Severity label para la subescala (si tiene niveles definidos)
                let sub_severity: string | undefined;
                if (sub.severity_levels) {
                    const subLevel = sub.severity_levels.find(
                        (l) =>
                            raw_score >= l.range_min &&
                            raw_score <= l.range_max,
                    );
                    sub_severity = subLevel?.label;
                }

                subscale_results.push({
                    id: sub.id,
                    name: sub.name,
                    score: raw_score,
                    raw_score,
                    direction: 'direct',
                    items_answered: answered.length,
                    items_total: sub.item_numbers.length,
                    severity_label: sub_severity,
                });
            }
        }

        return {
            administration_id: administration.id,
            inventory_id: definition.id,
            total_score,
            severity_label,
            clinical_note,
            subscale_results,
            critical_alerts,
            is_valid: true,
            scored_at: now,
        };
    },

    /**
     * Análisis de cambio Jacobson-Truax.
     *
     * DAS: LOWER = BETTER (creencias más adaptativas).
     * raw_change < 0 → mejora (menos creencias disfuncionales).
     *
     * La DAS mide creencias nucleares (trait) — el cambio es más lento
     * que en instrumentos de estado (BDI-II, PHQ-9).
     */
    analyzeChange(
        baseline: InventoryAdministration,
        current: InventoryAdministration,
        _definition: InventoryDefinition,
    ): ChangeAnalysis {
        const baseline_score = calculateTotal(baseline);
        const current_score = calculateTotal(current);
        const raw_change = current_score - baseline_score;

        // RCI = cambio / SEdiff
        const reliable_change_index =
            DAS_SE_DIFF === 0 ? 0 : raw_change / DAS_SE_DIFF;

        const is_reliable_change =
            Math.abs(reliable_change_index) >= RCI_THRESHOLD;

        // Categoría Jacobson-Truax (4 estados)
        let category: ChangeAnalysis['category'];
        let clinical_interpretation: string;

        if (!is_reliable_change) {
            category = 'unchanged';
            clinical_interpretation =
                `El cambio de ${raw_change > 0 ? '+' : ''}${raw_change} puntos ` +
                `(RCI = ${reliable_change_index.toFixed(2)}) no supera el umbral de fiabilidad ` +
                `estadística (1.96). Las creencias nucleares no han cambiado significativamente. ` +
                `Esto es esperable en fases iniciales — la DAS mide creencias estables.`;
        } else if (raw_change < 0) {
            // Mejora (puntuación baja = creencias más adaptativas)
            if (current_score < NORMATIVE_CUTOFF) {
                category = 'recovered';
                clinical_interpretation =
                    `Recuperación cognitiva estadística y clínica ` +
                    `(RCI = ${reliable_change_index.toFixed(2)}). ` +
                    `La puntuación actual (${current_score}) indica creencias ` +
                    `mayoritariamente adaptativas (<${NORMATIVE_CUTOFF}). ` +
                    `Considerar fase de mantenimiento con prevención de recaídas.`;
            } else {
                category = 'improved';
                clinical_interpretation =
                    `Mejora cognitiva estadísticamente fiable ` +
                    `(RCI = ${reliable_change_index.toFixed(2)}): ` +
                    `${Math.abs(raw_change)} puntos de reducción en actitudes disfuncionales. ` +
                    `La puntuación (${current_score}) aún no alcanza rango adaptativo ` +
                    `(<${NORMATIVE_CUTOFF}). Continuar reestructuración cognitiva.`;
            }
        } else {
            category = 'deteriorated';
            clinical_interpretation =
                `Empeoramiento cognitivo estadísticamente fiable ` +
                `(RCI = ${reliable_change_index.toFixed(2)}): ` +
                `+${raw_change} puntos. Las creencias disfuncionales se han intensificado. ` +
                `Revisar adherencia al trabajo cognitivo, factores estresores y ` +
                `posible necesidad de cambio de enfoque terapéutico.`;
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

    /**
     * Genera insights clínicos a partir del perfil de subescalas.
     * Identifica las áreas de mayor vulnerabilidad cognitiva.
     */
    generateInsights(
        result: InventoryResult,
        definition: InventoryDefinition,
    ): string[] {
        const insights: string[] = [];

        if (!result.is_valid) {
            insights.push('Administración no válida. No se generan insights.');
            return insights;
        }

        // Severidad global
        insights.push(
            `Puntuación total DAS: ${result.total_score}/140 — ${result.severity_label}.`,
        );

        // Identificar subescalas con puntuación elevada (>60% del rango)
        const classicSubscales = result.subscale_results.filter(
            (s) =>
                !['logro_perfeccionismo', 'dependencia'].includes(s.id),
        );

        const elevatedSubscales = classicSubscales.filter((s) => {
            const sub = definition.subscales?.find((d) => d.id === s.id);
            if (!sub) return false;
            const maxScore = sub.range_max ?? 20;
            return s.score / maxScore > 0.6;
        });

        if (elevatedSubscales.length > 0) {
            const names = elevatedSubscales.map((s) => s.name).join(', ');
            insights.push(
                `Áreas de mayor vulnerabilidad cognitiva: ${names}.`,
            );
        }

        // Perfil: autónomo vs sociotrópico (factores de segundo orden)
        const factorLogro = result.subscale_results.find(
            (s) => s.id === 'logro_perfeccionismo',
        );
        const factorDependencia = result.subscale_results.find(
            (s) => s.id === 'dependencia',
        );

        if (factorLogro && factorDependencia) {
            const logroPercent = factorLogro.score / 40;
            const depPercent = factorDependencia.score / 44;

            if (logroPercent > depPercent + 0.15) {
                insights.push(
                    'Perfil predominantemente autónomo: vulnerabilidad centrada en logro ' +
                    'y perfeccionismo. Eventos de fracaso o pérdida de control son ' +
                    'los principales disparadores.',
                );
            } else if (depPercent > logroPercent + 0.15) {
                insights.push(
                    'Perfil predominantemente sociotrópico: vulnerabilidad centrada en ' +
                    'dependencia y necesidad de aprobación. Eventos de rechazo o ' +
                    'pérdida interpersonal son los principales disparadores.',
                );
            } else {
                insights.push(
                    'Perfil mixto: vulnerabilidad tanto en logro/perfeccionismo como en ' +
                    'dependencia/aprobación. Ambos tipos de eventos pueden desencadenar ' +
                    'episodios depresivos.',
                );
            }
        }

        return insights;
    },
};
