/**
 * scl_90_r.engine.ts — Motor de scoring del SCL-90-R
 *
 * Funciones PURAS: sin side-effects, sin acceso a stores, sin imports de React.
 * Testeable en aislamiento.
 *
 * Orden de operaciones:
 *   1. checkValidity()     — ¿hay suficientes respuestas? ¿patrón aquiescente?
 *   2. checkCriticalItems() — ítems 15 (suicidio), 59 (muerte), 16 (alucinaciones)
 *   3. Cálculo de 9 dimensiones (promedios)
 *   4. Cálculo de 3 índices globales: GSI, TSP, PSDI
 *   5. Determinación de severity_label (basado en GSI)
 *   6. generateInsights()  — perfil sintomático y dimensiones elevadas
 *
 * Particularidad SCL-90-R:
 *   - Las dimensiones se puntúan como PROMEDIOS (suma ÷ nº respondidos), no sumas.
 *   - El GSI usa TODOS los ítems (90), no solo los de las 9 dimensiones.
 *   - Los 7 ítems adicionales (19, 44, 59, 60, 64, 66, 89) cuentan para GSI/TSP/PSDI
 *     pero no pertenecen a ninguna dimensión.
 *
 * Baremos: Góngora & Castro Solano (2019), población general AMBA, N=2873.
 *   T=65 (riesgo) → GSI ≈ 1.32
 *   T=50 (media)  → GSI ≈ 0.58
 *
 * Análisis de cambio: Jacobson & Truax (1991) sobre GSI promedio.
 *   SD(GSI) = 0.50, r = 0.86, SEdiff ≈ 0.265, RCI threshold = 1.96.
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
// Parámetros estadísticos SCL-90-R para RCI (Jacobson-Truax)
// ============================================================================

/** Desviación estándar del GSI promedio (Góngora & Castro Solano, 2019) */
const GSI_SD = 0.50;

/** Fiabilidad test-retest (Derogatis, 1994) */
const GSI_RELIABILITY = 0.86;

/** SEdiff = SD * √(2 * (1 - r)) */
const GSI_SE_DIFF = GSI_SD * Math.sqrt(2 * (1 - GSI_RELIABILITY));

/** Umbral RCI ≥ 1.96 → cambio fiable (95%) */
const RCI_THRESHOLD = 1.96;

/** Punto de corte clínico: GSI promedio = T65 (baremo argentino) */
const CLINICAL_CUTOFF_GSI = 1.32;

/** Mínimo de ítems respondidos para validez (80% de 90 = 72) */
const MIN_VALID_RESPONSES = 72;

/** Umbral de aquiescencia: si 80+ ítems tienen la misma respuesta */
const ACQUIESCENCE_THRESHOLD = 80;

/**
 * Baremos de conversión promedio bruto → T score para GSI.
 * Fuente: Góngora & Castro Solano (2019), pob. general AMBA, N=2873.
 * Interpolación lineal entre puntos.
 */
const GSI_BAREMO: Array<{ gsi: number; t: number }> = [
    { gsi: 0.00, t: 20 },
    { gsi: 0.07, t: 40 },
    { gsi: 0.58, t: 50 },
    { gsi: 1.08, t: 60 },
    { gsi: 1.32, t: 65 },
    { gsi: 1.58, t: 70 },
    { gsi: 2.06, t: 80 },
    { gsi: 2.59, t: 90 },
];

/**
 * Baremos por dimensión: promedio bruto → T score.
 * Fuente: Góngora & Castro Solano (2019), pob. general AMBA, N=2873.
 */
const DIMENSION_BAREMOS: Record<string, Array<{ raw: number; t: number }>> = {
    som:  [{ raw: 0, t: 30 }, { raw: 0.58, t: 50 }, { raw: 1.08, t: 60 }, { raw: 1.42, t: 65 }, { raw: 1.67, t: 70 }, { raw: 2.17, t: 80 }, { raw: 2.75, t: 90 }],
    obs:  [{ raw: 0, t: 30 }, { raw: 0.10, t: 40 }, { raw: 0.80, t: 50 }, { raw: 1.50, t: 60 }, { raw: 1.90, t: 65 }, { raw: 2.20, t: 70 }, { raw: 2.90, t: 80 }, { raw: 4.00, t: 90 }],
    si:   [{ raw: 0, t: 30 }, { raw: 0.67, t: 50 }, { raw: 1.22, t: 60 }, { raw: 1.50, t: 65 }, { raw: 1.89, t: 70 }, { raw: 2.44, t: 80 }, { raw: 3.00, t: 90 }],
    dep:  [{ raw: 0, t: 30 }, { raw: 0.77, t: 50 }, { raw: 1.38, t: 60 }, { raw: 1.65, t: 65 }, { raw: 2.00, t: 70 }, { raw: 2.62, t: 80 }, { raw: 3.23, t: 90 }],
    ans:  [{ raw: 0, t: 30 }, { raw: 0.60, t: 50 }, { raw: 1.20, t: 60 }, { raw: 1.45, t: 65 }, { raw: 1.80, t: 70 }, { raw: 2.40, t: 80 }, { raw: 3.00, t: 90 }],
    hos:  [{ raw: 0, t: 30 }, { raw: 0.67, t: 50 }, { raw: 1.17, t: 60 }, { raw: 1.45, t: 65 }, { raw: 1.83, t: 70 }, { raw: 2.33, t: 80 }, { raw: 3.00, t: 90 }],
    fob:  [{ raw: 0, t: 30 }, { raw: 0.43, t: 50 }, { raw: 0.86, t: 60 }, { raw: 1.00, t: 65 }, { raw: 1.29, t: 70 }, { raw: 1.86, t: 80 }, { raw: 2.29, t: 90 }],
    par:  [{ raw: 0, t: 30 }, { raw: 0.67, t: 50 }, { raw: 1.33, t: 60 }, { raw: 1.50, t: 65 }, { raw: 1.83, t: 70 }, { raw: 2.50, t: 80 }, { raw: 3.17, t: 90 }],
    psic: [{ raw: 0, t: 30 }, { raw: 0.40, t: 50 }, { raw: 0.90, t: 60 }, { raw: 1.10, t: 65 }, { raw: 1.40, t: 70 }, { raw: 1.90, t: 80 }, { raw: 2.50, t: 90 }],
};

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

/**
 * Calcula el promedio de los ítems dados que tienen respuesta.
 * Si no hay ítems respondidos devuelve 0.
 */
function calculateDimensionAverage(
    administration: InventoryAdministration,
    itemNumbers: number[],
): { average: number; sum: number; answered: number; total: number } {
    let sum = 0;
    let answered = 0;
    for (const itemNum of itemNumbers) {
        const val = getItemValue(administration, itemNum);
        if (val !== null) {
            sum += val;
            answered++;
        }
    }
    return {
        average: answered > 0 ? sum / answered : 0,
        sum,
        answered,
        total: itemNumbers.length,
    };
}

/**
 * Suma total de TODOS los ítems respondidos (para GSI y PSDI).
 */
function calculateTotalSum(administration: InventoryAdministration): number {
    return administration.responses.reduce(
        (sum, r) => sum + (r.value ?? 0),
        0,
    );
}

/**
 * TSP: Total de Síntomas Positivos = conteo de ítems con valor > 0.
 */
function calculateTSP(administration: InventoryAdministration): number {
    return administration.responses.filter(
        (r) => r.value !== null && r.value > 0,
    ).length;
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

/**
 * Interpolación lineal en tabla de baremos.
 */
function interpolateT(
    baremo: Array<{ raw?: number; gsi?: number; t: number }>,
    rawValue: number,
): number {
    const keyField = baremo[0].gsi !== undefined ? 'gsi' : 'raw';

    // Encontrar los dos puntos entre los que cae rawValue
    for (let i = 0; i < baremo.length - 1; i++) {
        const low = (baremo[i] as Record<string, number>)[keyField];
        const high = (baremo[i + 1] as Record<string, number>)[keyField];
        if (rawValue >= low && rawValue <= high) {
            const tLow = baremo[i].t;
            const tHigh = baremo[i + 1].t;
            if (high === low) return tLow;
            const fraction = (rawValue - low) / (high - low);
            return Math.round(tLow + fraction * (tHigh - tLow));
        }
    }

    // Fuera de rango: devolver extremo más cercano
    const firstVal = (baremo[0] as Record<string, number>)[keyField];
    if (rawValue < firstVal) return baremo[0].t;
    return baremo[baremo.length - 1].t;
}

// ============================================================================
// Motor de scoring
// ============================================================================

export const scl90rEngine: InventoryEngine = {
    /**
     * Verifica ítems críticos del SCL-90-R:
     * - Ítem 15: Ideación suicida (dimensión DEP)
     * - Ítem 59: Pensamientos de muerte (adicional)
     * - Ítem 16: Alucinaciones auditivas (dimensión PSIC)
     */
    checkCriticalItems(
        administration: InventoryAdministration,
        definition: InventoryDefinition,
    ): CriticalItemAlert[] {
        const alerts: CriticalItemAlert[] = [];

        for (const critDef of definition.critical_items) {
            const value = getItemValue(administration, critDef.item_number);
            if (value !== null && value >= critDef.threshold) {
                const item = definition.items.find(
                    (i) => i.id === critDef.item_number,
                );
                alerts.push({
                    item_id: critDef.item_number,
                    value,
                    domain_descriptor:
                        item?.domain_descriptor ?? critDef.domain,
                    urgency:
                        critDef.alert_level === 'emergency'
                            ? 'critical'
                            : critDef.alert_level === 'urgent'
                              ? 'high'
                              : 'moderate',
                });
            }
        }

        return alerts;
    },

    /**
     * Validez: mínimo 72/90 ítems + ausencia de patrón de aquiescencia.
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
                    `Solo ${validCount} de 90 ítems respondidos. ` +
                    `Se requieren al menos ${MIN_VALID_RESPONSES} para una puntuación válida.`,
            };
        }

        if (checkAcquiescence(administration)) {
            return {
                is_valid: false,
                reason:
                    `Posible sesgo de aquiescencia: ${ACQUIESCENCE_THRESHOLD}+ ítems con la misma ` +
                    `respuesta. Considerar readministración.`,
            };
        }

        return { is_valid: true };
    },

    /**
     * Scoring completo del SCL-90-R:
     *   - 9 dimensiones clínicas (promedios)
     *   - 3 índices globales: GSI, TSP, PSDI
     *   - Conversión a puntuaciones T (baremo argentino)
     *   - Determinación de riesgo psicopatológico
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

        // 2. Ítems críticos
        const critical_alerts = this.checkCriticalItems(
            administration,
            definition,
        );

        // 3. Calcular 9 dimensiones (promedios)
        const subscale_results: SubscaleResult[] = [];

        if (definition.subscales) {
            for (const sub of definition.subscales) {
                const dimResult = calculateDimensionAverage(
                    administration,
                    sub.item_numbers,
                );

                // T score por dimensión
                const dimBaremo = DIMENSION_BAREMOS[sub.id];
                const tScore = dimBaremo
                    ? interpolateT(dimBaremo, dimResult.average)
                    : undefined;

                subscale_results.push({
                    id: sub.id,
                    name: sub.name,
                    score: parseFloat(dimResult.average.toFixed(2)),
                    raw_score: dimResult.sum,
                    direction: 'direct',
                    items_answered: dimResult.answered,
                    items_total: dimResult.total,
                    severity_label: tScore !== undefined
                        ? (tScore >= 65
                            ? `T=${tScore} (RIESGO)`
                            : `T=${tScore}`)
                        : undefined,
                });
            }
        }

        // 4. Índices globales
        const validResponses = countValidResponses(administration);
        const totalSum = calculateTotalSum(administration);
        const tsp = calculateTSP(administration);

        // GSI = suma total / nº respuestas dadas
        const gsi = validResponses > 0 ? totalSum / validResponses : 0;

        // PSDI = suma total / TSP (si TSP > 0)
        const psdi = tsp > 0 ? totalSum / tsp : 0;

        // T scores para índices
        const gsiT = interpolateT(GSI_BAREMO, gsi);

        // Añadir índices como subscale_results especiales
        subscale_results.push(
            {
                id: 'gsi',
                name: 'Índice Global de Severidad (GSI)',
                score: parseFloat(gsi.toFixed(2)),
                raw_score: totalSum,
                items_answered: validResponses,
                items_total: 90,
                severity_label: gsiT >= 65 ? `T=${gsiT} (RIESGO)` : `T=${gsiT}`,
            },
            {
                id: 'tsp',
                name: 'Total de Síntomas Positivos (TSP)',
                score: tsp,
                raw_score: tsp,
                items_answered: validResponses,
                items_total: 90,
                severity_label: `${tsp}/90 síntomas`,
            },
            {
                id: 'psdi',
                name: 'Índice Positivo de Malestar (PSDI)',
                score: parseFloat(psdi.toFixed(2)),
                raw_score: totalSum,
                items_answered: tsp,
                items_total: validResponses,
                severity_label: psdi > 2.5
                    ? 'Tiende a exagerar malestar'
                    : psdi < 1.2 && tsp > 30
                      ? 'Tiende a minimizar malestar'
                      : 'Estilo de respuesta adecuado',
            },
        );

        // 5. Severity label global (basado en GSI T score)
        // Criterio de riesgo: T ≥ 65 en GSI O ≥ 2 escalas clínicas ≥ T65
        const elevatedDimensions = subscale_results.filter(
            (s) =>
                !['gsi', 'tsp', 'psdi'].includes(s.id) &&
                s.severity_label?.includes('RIESGO'),
        );

        const isAtRiskByGSI = gsiT >= 65;
        const isAtRiskByDimensions = elevatedDimensions.length >= 2;
        const isAtRisk = isAtRiskByGSI || isAtRiskByDimensions;

        let severity_label: string;
        let clinical_note: string;

        if (isAtRisk) {
            if (gsiT >= 70) {
                severity_label = 'Riesgo psicopatológico elevado';
                clinical_note =
                    `GSI = ${gsi.toFixed(2)} (T=${gsiT}). Distrés psicológico severo. ` +
                    `${elevatedDimensions.length} dimensiones elevadas: ` +
                    `${elevatedDimensions.map((d) => d.name).join(', ')}. ` +
                    'Evaluación clínica urgente recomendada.';
            } else {
                severity_label = 'Riesgo psicopatológico';
                clinical_note =
                    `GSI = ${gsi.toFixed(2)} (T=${gsiT}). ` +
                    (isAtRiskByGSI
                        ? 'GSI supera punto de corte de riesgo (T≥65). '
                        : '') +
                    (isAtRiskByDimensions
                        ? `${elevatedDimensions.length} dimensiones ≥ T65: ` +
                          `${elevatedDimensions.map((d) => d.name).join(', ')}. `
                        : '') +
                    'Profundizar en entrevista clínica.';
            }
        } else if (gsiT >= 60) {
            severity_label = 'Malestar leve';
            clinical_note =
                `GSI = ${gsi.toFixed(2)} (T=${gsiT}). Malestar por encima de la media ` +
                'pero sin alcanzar riesgo psicopatológico. Monitorizar.';
        } else {
            severity_label = 'Sin riesgo psicopatológico';
            clinical_note =
                `GSI = ${gsi.toFixed(2)} (T=${gsiT}). Sintomatología dentro del rango normativo.`;
        }

        // Añadir alertas críticas a la nota
        if (critical_alerts.length > 0) {
            clinical_note +=
                ' ⚠️ ALERTAS CRÍTICAS: ' +
                critical_alerts
                    .map(
                        (a) =>
                            `Ítem ${a.item_id} (${a.domain_descriptor}) = ${a.value} [${a.urgency}]`,
                    )
                    .join('; ') +
                '.';
        }

        // total_score = suma bruta total (para compatibilidad con InventoryResult)
        return {
            administration_id: administration.id,
            inventory_id: definition.id,
            total_score: totalSum,
            severity_label,
            clinical_note,
            subscale_results,
            critical_alerts,
            is_valid: true,
            scored_at: now,
        };
    },

    /**
     * Análisis de cambio Jacobson-Truax sobre GSI promedio.
     *
     * SCL-90-R: LOWER GSI = BETTER (menos sintomatología).
     * raw_change < 0 → mejora.
     */
    analyzeChange(
        baseline: InventoryAdministration,
        current: InventoryAdministration,
        _definition: InventoryDefinition,
    ): ChangeAnalysis {
        // Calculamos GSI para cada administración
        const baselineValid = countValidResponses(baseline);
        const currentValid = countValidResponses(current);
        const baselineSum = calculateTotalSum(baseline);
        const currentSum = calculateTotalSum(current);

        const baselineGSI =
            baselineValid > 0 ? baselineSum / baselineValid : 0;
        const currentGSI = currentValid > 0 ? currentSum / currentValid : 0;

        const raw_change = currentGSI - baselineGSI;

        // RCI sobre GSI
        const reliable_change_index =
            GSI_SE_DIFF === 0 ? 0 : raw_change / GSI_SE_DIFF;

        const is_reliable_change =
            Math.abs(reliable_change_index) >= RCI_THRESHOLD;

        let category: ChangeAnalysis['category'];
        let clinical_interpretation: string;

        if (!is_reliable_change) {
            category = 'unchanged';
            clinical_interpretation =
                `El cambio en GSI de ${raw_change > 0 ? '+' : ''}${raw_change.toFixed(2)} ` +
                `(RCI = ${reliable_change_index.toFixed(2)}) no supera el umbral de fiabilidad ` +
                `estadística (1.96). La sintomatología no ha cambiado significativamente.`;
        } else if (raw_change < 0) {
            if (currentGSI < CLINICAL_CUTOFF_GSI) {
                category = 'recovered';
                clinical_interpretation =
                    `Recuperación estadística y clínica ` +
                    `(RCI = ${reliable_change_index.toFixed(2)}). ` +
                    `GSI actual (${currentGSI.toFixed(2)}) por debajo del punto de corte ` +
                    `de riesgo (${CLINICAL_CUTOFF_GSI}). ` +
                    'El paciente ha salido del rango de riesgo psicopatológico.';
            } else {
                category = 'improved';
                clinical_interpretation =
                    `Mejora estadísticamente fiable ` +
                    `(RCI = ${reliable_change_index.toFixed(2)}): ` +
                    `reducción de ${Math.abs(raw_change).toFixed(2)} en GSI. ` +
                    `GSI actual (${currentGSI.toFixed(2)}) aún sobre el punto de corte ` +
                    `(${CLINICAL_CUTOFF_GSI}). Continuar tratamiento.`;
            }
        } else {
            category = 'deteriorated';
            clinical_interpretation =
                `Empeoramiento estadísticamente fiable ` +
                `(RCI = ${reliable_change_index.toFixed(2)}): ` +
                `aumento de +${raw_change.toFixed(2)} en GSI. ` +
                'La sintomatología se ha intensificado. Revisar plan de tratamiento, ' +
                'factores estresores y posible necesidad de interconsulta.';
        }

        return {
            baseline_score: parseFloat(baselineGSI.toFixed(2)),
            current_score: parseFloat(currentGSI.toFixed(2)),
            raw_change: parseFloat(raw_change.toFixed(2)),
            reliable_change_index: parseFloat(
                reliable_change_index.toFixed(2),
            ),
            is_reliable_change,
            category,
            clinical_interpretation,
        };
    },

    /**
     * Genera insights clínicos del perfil SCL-90-R.
     * Identifica dimensiones elevadas, estilo de respuesta y comorbilidades.
     */
    generateInsights(
        result: InventoryResult,
        _definition: InventoryDefinition,
    ): string[] {
        const insights: string[] = [];

        if (!result.is_valid) {
            insights.push(
                'Administración no válida. No se generan insights.',
            );
            return insights;
        }

        // GSI global
        const gsiResult = result.subscale_results.find(
            (s) => s.id === 'gsi',
        );
        const tspResult = result.subscale_results.find(
            (s) => s.id === 'tsp',
        );
        const psdiResult = result.subscale_results.find(
            (s) => s.id === 'psdi',
        );

        if (gsiResult) {
            insights.push(
                `Índice Global de Severidad: ${gsiResult.score} (${gsiResult.severity_label}).`,
            );
        }

        // TSP - amplitud
        if (tspResult) {
            const pct = ((tspResult.score / 90) * 100).toFixed(0);
            insights.push(
                `Amplitud sintomática: ${tspResult.score}/90 síntomas presentes (${pct}%).`,
            );
        }

        // PSDI - estilo de respuesta
        if (psdiResult) {
            insights.push(
                `Estilo de respuesta (PSDI): ${psdiResult.score} — ${psdiResult.severity_label}.`,
            );
        }

        // Dimensiones elevadas (T ≥ 65)
        const clinicalDimensions = result.subscale_results.filter(
            (s) =>
                !['gsi', 'tsp', 'psdi'].includes(s.id) &&
                s.severity_label?.includes('RIESGO'),
        );

        if (clinicalDimensions.length > 0) {
            const names = clinicalDimensions
                .map((d) => `${d.name} (${d.score})`)
                .join(', ');
            insights.push(`Dimensiones en riesgo (T≥65): ${names}.`);
        } else {
            insights.push(
                'Ninguna dimensión clínica alcanza umbral de riesgo (T≥65).',
            );
        }

        // Perfil de comorbilidad
        const depResult = result.subscale_results.find(
            (s) => s.id === 'dep',
        );
        const ansResult = result.subscale_results.find(
            (s) => s.id === 'ans',
        );

        if (
            depResult?.severity_label?.includes('RIESGO') &&
            ansResult?.severity_label?.includes('RIESGO')
        ) {
            insights.push(
                'Perfil comórbido depresión-ansiedad. Considerar protocolo integrado ' +
                'AC + técnicas de manejo de ansiedad.',
            );
        }

        // Alertas de ítems críticos
        if (result.critical_alerts.length > 0) {
            insights.push(
                `⚠️ ${result.critical_alerts.length} alerta(s) crítica(s) detectada(s). ` +
                'Explorar en entrevista antes de proceder con psicoeducación o tareas.',
            );
        }

        return insights;
    },
};
