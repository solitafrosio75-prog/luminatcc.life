/**
 * bdi_ii.engine.ts — Motor de scoring del BDI-II
 *
 * Funciones PURAS: sin side-effects, sin acceso a stores, sin imports de React.
 * Todas las funciones reciben sus datos completos como argumentos.
 * Testeables en aislamiento sin montar ningún componente.
 *
 * Orden de operaciones obligatorio en score():
 *   1. checkValidity()  — ¿hay suficientes respuestas?
 *   2. checkCriticalItems() — ¿ítem 9 activo? → alerta ANTES del total
 *   3. Cálculo de total
 *   4. Determinación de severity_label
 *   5. generateInsights()
 *
 * Análisis de cambio: Jacobson & Truax (1991)
 * RCI = (score2 - score1) / SEdiff
 * SEdiff = SE * √2 = SD * √(2 * (1 - r))  donde r = fiabilidad test-retest
 * Parámetros normativos BDI-II (Sanz 2003): SD = 9.7, r = 0.93
 */

import type {
  InventoryDefinition,
  InventoryAdministration,
  InventoryResult,
  CriticalItemAlert,
  ChangeAnalysis,
  InventoryEngine,
  ItemResponse,
} from '../types/inventory_types';

// ============================================================================
// Parámetros estadísticos BDI-II (Sanz & Vázquez, 1998; Sanz, 2003)
// ============================================================================

/** Desviación estándar en muestra clínica española (Sanz, 2003) */
const BDI_II_SD = 9.7;

/** Coeficiente de fiabilidad test-retest (Beck et al., 1996) */
const BDI_II_RELIABILITY = 0.93;

/**
 * Error estándar de la diferencia para RCI de Jacobson-Truax.
 * SEdiff = SD * √(2 * (1 - r))
 */
const BDI_II_SE_DIFF = BDI_II_SD * Math.sqrt(2 * (1 - BDI_II_RELIABILITY));

/** Umbral |RCI| ≥ 1.96 → cambio fiable al 95% de confianza */
const RCI_THRESHOLD = 1.96;

/**
 * Punto de corte para "rango normativo" en Jacobson-Truax (criterio C).
 * BDI-II: < 14 = rango de depresión mínima (funcionamiento normativo).
 */
const NORMATIVE_CUTOFF = 14;

/** Mínimo de ítems respondidos para que la puntuación sea válida (≥ 17 de 21) */
const MIN_VALID_RESPONSES = 17;

// ============================================================================
// Helpers internos (no exportados)
// ============================================================================

/**
 * Extrae la puntuación de un ítem en una administración.
 * Devuelve null si el ítem no fue respondido.
 */
function getItemValue(
  administration: InventoryAdministration,
  itemId: number
): number | null {
  const response = administration.responses.find((r) => r.item_id === itemId);
  return response?.value ?? null;
}

/**
 * Cuenta cuántos ítems tienen respuesta válida (valor no null).
 */
function countValidResponses(administration: InventoryAdministration): number {
  return administration.responses.filter((r) => r.value !== null).length;
}

/**
 * Determina la urgencia de una alerta crítica según el valor del ítem.
 * BDI-II ítem 9:
 *   1 = pensamientos sin intención → 'moderate'
 *   2 = deseos de hacerse daño    → 'high'
 *   3 = intención con oportunidad → 'critical'
 */
function getUrgencyForItem9(value: number): CriticalItemAlert['urgency'] {
  if (value >= 3) return 'critical';
  if (value >= 2) return 'high';
  return 'moderate';
}

// ============================================================================
// Motor BDI-II
// ============================================================================

export const bdiIIEngine: InventoryEngine = {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. checkCriticalItems — SIEMPRE antes de calcular el total
  // ──────────────────────────────────────────────────────────────────────────
  checkCriticalItems(
    administration: InventoryAdministration,
    definition: InventoryDefinition
  ): CriticalItemAlert[] {
    // Agrupar critical_items por item_number para deduplicar:
    // si hay múltiples entradas para el mismo ítem (ej: item 9 con thresholds 1,2,3),
    // solo emitimos la alerta del threshold más alto que el valor alcance.
    const byItem = new Map<number, typeof definition.critical_items>();
    for (const ci of definition.critical_items) {
      const list = byItem.get(ci.item_number) ?? [];
      list.push(ci);
      byItem.set(ci.item_number, list);
    }

    const alerts: CriticalItemAlert[] = [];

    for (const [criticalId, entries] of byItem) {
      const value = getItemValue(administration, criticalId);
      if (value === null) continue;

      const item = definition.items.find((i) => i.id === criticalId);
      if (!item) continue;

      // Encontrar el threshold más alto que el valor alcance
      const matchingEntries = entries
        .filter((ci) => value >= (ci.threshold ?? 1))
        .sort((a, b) => (b.threshold ?? 1) - (a.threshold ?? 1));

      if (matchingEntries.length === 0) continue;

      alerts.push({
        item_id: criticalId,
        value,
        domain_descriptor: item.domain_descriptor,
        urgency:
          criticalId === 9
            ? getUrgencyForItem9(value)
            : value >= 3
            ? 'critical'
            : value >= 2
            ? 'high'
            : 'moderate',
      });
    }

    return alerts;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. checkValidity — ¿suficientes ítems respondidos?
  // ──────────────────────────────────────────────────────────────────────────
  checkValidity(
    administration: InventoryAdministration,
    _definition: InventoryDefinition
  ): { is_valid: boolean; reason?: string } {
    const validCount = countValidResponses(administration);

    if (validCount < MIN_VALID_RESPONSES) {
      return {
        is_valid: false,
        reason:
          `Solo ${validCount} de 21 ítems respondidos. ` +
          `Se requieren al menos ${MIN_VALID_RESPONSES} para una puntuación válida.`,
      };
    }

    return { is_valid: true };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. score — Cálculo completo (llama a checkCriticalItems y checkValidity)
  // ──────────────────────────────────────────────────────────────────────────
  score(
    administration: InventoryAdministration,
    definition: InventoryDefinition
  ): InventoryResult {
    const now = new Date().toISOString();

    // Paso 1: validez
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

    // Paso 2: ítems críticos — ANTES del total
    const critical_alerts = this.checkCriticalItems(administration, definition);

    // Paso 3: suma de puntuaciones (ítems sin respuesta se puntúan como 0)
    const total_score = administration.responses.reduce(
      (sum, r) => sum + (r.value ?? 0),
      0
    );

    // Paso 4: severity label según niveles de severidad
    const matchedLevel = definition.severity_levels.find(
      (sl) => total_score >= sl.range_min && total_score <= sl.range_max
    );

    const severity_label = matchedLevel?.label ?? 'Sin clasificar';
    const clinical_note =
      matchedLevel?.clinical_implication ??
      'Puntuación fuera de rango. Revisar administración.';

    // Paso 5: generar insights (necesita el result parcial)
    const partialResult: InventoryResult = {
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

    return partialResult;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. analyzeChange — Jacobson-Truax (1991)
  // ──────────────────────────────────────────────────────────────────────────
  analyzeChange(
    baseline: InventoryAdministration,
    current: InventoryAdministration,
    definition: InventoryDefinition
  ): ChangeAnalysis {
    // Calcular puntuaciones (sin el output completo, solo el total)
    const scoreAdmin = (admin: InventoryAdministration): number =>
      admin.responses.reduce((sum, r) => sum + (r.value ?? 0), 0);

    const baseline_score = scoreAdmin(baseline);
    const current_score = scoreAdmin(current);
    const raw_change = current_score - baseline_score;

    // RCI = cambio / SEdiff
    const reliable_change_index =
      BDI_II_SE_DIFF === 0 ? 0 : raw_change / BDI_II_SE_DIFF;

    const is_reliable_change = Math.abs(reliable_change_index) >= RCI_THRESHOLD;

    // Categoría Jacobson-Truax
    let category: ChangeAnalysis['category'];
    let clinical_interpretation: string;

    if (!is_reliable_change) {
      category = 'unchanged';
      clinical_interpretation =
        `El cambio de ${raw_change > 0 ? '+' : ''}${raw_change} puntos ` +
        `(RCI = ${reliable_change_index.toFixed(2)}) no supera el umbral de fiabilidad estadística (1.96). ` +
        `No se puede concluir cambio clínicamente significativo.`;
    } else if (raw_change < 0) {
      // Mejora (puntuación baja = menos síntomas en BDI-II)
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
          `La puntuación (${current_score}) aún no alcanza rango normativo. ` +
          `Continuar y revisar en próximas sesiones.`;
      }
    } else {
      category = 'deteriorated';
      clinical_interpretation =
        `Empeoramiento estadísticamente fiable (RCI = ${reliable_change_index.toFixed(2)}): ` +
        `+${raw_change} puntos. ` +
        `Revisar barreras, adherencia y factores estresores actuales. ` +
        `Si puntuación total ≥ 29, considerar derivación urgente.`;
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

  // ──────────────────────────────────────────────────────────────────────────
  // 5. generateInsights — Observaciones clínicas orientativas
  //
  // Referencia clínica:
  //   - Ítems 4 (pérdida_de_placer) + 12 (pérdida_de_interés) = anhedonia.
  //     Anhedonia alta → priorizar AC sobre RC (Dimidjian et al., 2006).
  //   - Ítems 15,16,18,19,20,21 = perfil neurovegetativo (somático).
  //     Predominio neurovegetativo → interconsulta psiquiátrica.
  // ──────────────────────────────────────────────────────────────────────────
  generateInsights(
    result: InventoryResult,
    _definition: InventoryDefinition,
    administration?: InventoryAdministration
  ): string[] {
    const insights: string[] = [];

    if (!result.is_valid) {
      insights.push('Administración incompleta: no es posible generar observaciones.');
      return insights;
    }

    // ── 1. Alerta prioritaria por ítem 9 — siempre primero ──
    if (result.critical_alerts.length > 0) {
      const alert = result.critical_alerts[0];
      insights.push(
        `⚠️ ALERTA PRIORITARIA: Ideación suicida detectada (valor ${alert.value}/3). ` +
          `Aplicar protocolo de evaluación de riesgo antes de continuar la sesión.`
      );
    }

    // ── 2. Insights según severidad total ──
    if (result.total_score >= 29) {
      insights.push(
        'Nivel grave: priorizar actividades de mínimo esfuerzo y máximo valor reforzador. ' +
          'Evitar programar múltiples actividades en la misma sesión.'
      );
      insights.push(
        'Considerar consulta con psiquiatría para evaluación de tratamiento combinado.'
      );
    } else if (result.total_score >= 20) {
      insights.push(
        'Nivel moderado: la graduación de actividades es especialmente importante. ' +
          'Revisar si hay evitación conductual activa en áreas vitales clave.'
      );
    } else if (result.total_score >= 14) {
      insights.push(
        'Nivel leve: buen momento para reforzar la activación conductual. ' +
          'Identificar actividades de alta frecuencia y bajo coste energético.'
      );
    } else {
      insights.push(
        'Sintomatología mínima. Reforzar los avances y revisar plan de mantenimiento.'
      );
    }

    // ── 3. Análisis por ítems individuales (requiere administración) ──
    if (administration) {
      const getVal = (id: number): number | null => {
        const r: ItemResponse | undefined = administration.responses.find(
          (resp) => resp.item_id === id
        );
        return r?.value ?? null;
      };

      // ── 3a. ANHEDONIA: ítems 4 (pérdida de placer) + 12 (pérdida de interés) ──
      // Beck (1996): la anhedonia es el predictor más fuerte de mala respuesta a RC sola.
      // Dimidjian et al. (2006): AC iguala a medicación en depresión severa con anhedonia,
      // superando a la RC. Si ambos ítems ≥ 2 → priorizar AC.
      const item4 = getVal(4);
      const item12 = getVal(12);

      if (item4 !== null && item12 !== null) {
        const anhedoniaScore = item4 + item12;
        if (anhedoniaScore >= 4) {
          insights.push(
            'ANHEDONIA MARCADA: Ítems 4 (placer) y 12 (interés) ambos elevados (suma ≥ 4). ' +
              'Priorizar AC sobre RC: programar actividades con potencial reforzador ' +
              '(saboreo consciente, actividades novedosas, "actuar como si"). ' +
              'La reestructuración cognitiva tiene menor eficacia cuando predomina la anhedonia ' +
              '(Dimidjian et al., 2006).'
          );
        } else if (anhedoniaScore >= 2) {
          insights.push(
            'Anhedonia moderada (ítems 4+12). ' +
              'AC como primera línea; incluir actividades de placer gradual en el plan.'
          );
        }
      }

      // ── 3b. PERFIL NEUROVEGETATIVO: ítems 15,16,18,19,20,21 ──
      // Cuando la carga somática domina, sugiere componente biológico que puede
      // beneficiarse de medicación. En AC, empezar con microtareas.
      const NEURO_ITEM_IDS = [15, 16, 18, 19, 20, 21];
      const neuroValues = NEURO_ITEM_IDS
        .map((id) => getVal(id))
        .filter((v): v is number => v !== null);

      if (neuroValues.length >= 4) {
        const neuroSum = neuroValues.reduce((a, b) => a + b, 0);
        const neuroMax = neuroValues.length * 3;
        const neuroRatio = neuroSum / neuroMax;

        if (neuroRatio >= 0.67) {
          insights.push(
            `PERFIL NEUROVEGETATIVO PREDOMINANTE: ${neuroSum}/${neuroMax} en ítems somáticos ` +
              '(energía, sueño, apetito, concentración, fatiga, interés sexual). ' +
              'Sugiere componente biológico significativo. ' +
              'Interconsulta psiquiátrica recomendada para valorar medicación. ' +
              'En AC, empezar con microtareas de muy baja exigencia energética.'
          );
        } else if (neuroRatio >= 0.5) {
          insights.push(
            `Carga neurovegetativa moderada (${neuroSum}/${neuroMax} en ítems somáticos). ` +
              'Considerar higiene del sueño y programación de actividad física gradual.'
          );
        }
      }

      // ── 3c. PERFIL COGNITIVO: subescala cognitivo-afectiva BDI-II ──
      // Beck, Steer & Brown (1996): La subescala cognitivo-afectiva incluye
      // ítems que reflejan la tríada cognitiva de Beck:
      //   - Visión negativa de sí mismo: 7 (autodisgusto), 8 (autocrítica), 14 (inutilidad)
      //   - Visión negativa del pasado/mundo: 3 (fracaso), 5 (culpa)
      //   - Visión negativa del futuro: 1 (tristeza), 2 (pesimismo)
      //
      // Cuando estos ítems dominan Y anhedonia (4+12) es baja:
      //   → Perfil cognitivo → Priorizar RC sobre AC (Cuijpers et al., 2019).
      //   → RC tiene ventaja en prevención de recaídas (Hollon et al., 2005).
      const COGNITIVE_CORE_ITEMS = [1, 2, 3, 5, 7, 8, 14];
      const cognitiveValues = COGNITIVE_CORE_ITEMS
        .map((id) => getVal(id))
        .filter((v): v is number => v !== null);

      if (cognitiveValues.length >= 5) {
        const cognitiveSum = cognitiveValues.reduce((a, b) => a + b, 0);
        const cognitiveMax = cognitiveValues.length * 3;
        const cognitiveRatio = cognitiveSum / cognitiveMax;

        // Solo recomendar RC si anhedonia NO domina
        const anhedoniaLow = (item4 !== null && item12 !== null)
          ? (item4 + item12) < 3
          : true; // sin datos de anhedonia: no bloquear

        if (cognitiveRatio >= 0.5 && anhedoniaLow) {
          insights.push(
            `PERFIL COGNITIVO PREDOMINANTE: ${cognitiveSum}/${cognitiveMax} en ítems ` +
              'cognitivo-afectivos (tristeza, pesimismo, culpa, autocrítica, inutilidad). ' +
              'Anhedonia baja (ítems 4+12 < 3). ' +
              'Priorizar Reestructuración Cognitiva (RC) como componente principal: ' +
              'registro de pensamientos, diálogo socrático, análisis de evidencia. ' +
              'La AC puede complementar como segunda línea. ' +
              '(Cuijpers et al., 2019; Beck, Steer & Brown, 1996).'
          );
        } else if (cognitiveRatio >= 0.4 && anhedoniaLow) {
          insights.push(
            `Carga cognitivo-afectiva moderada (${cognitiveSum}/${cognitiveMax}). ` +
              'Considerar integrar componente de RC (registro de pensamientos) ' +
              'junto con AC como enfoque mixto.'
          );
        }
      }
    }

    return insights.filter(Boolean);
  },
};

// ============================================================================
// Detección de perfil clínico — AC vs RC vs Mixto vs Neurovegetativo
// ============================================================================

/**
 * Perfil clínico derivado del BDI-II para selección de técnica.
 *
 * - 'cognitive': subescala cognitivo-afectiva dominante, anhedonia baja → RC
 * - 'behavioral': anhedonia dominante (ítems 4+12 ≥ 4) → AC
 * - 'neurovegetative': ítems somáticos dominantes → AC + derivación psiquiátrica
 * - 'mixed': sin dominancia clara → AC (opción clínicamente segura)
 */
export type BDIClinicalProfile = 'cognitive' | 'behavioral' | 'mixed' | 'neurovegetative';

export interface BDIProfileAnalysis {
    profile: BDIClinicalProfile;
    cognitiveScore: number;
    cognitiveMax: number;
    anhedoniaScore: number;
    neurovegetativeRatio: number;
    primaryTechnique: 'ac' | 'rc';
    rationale: string;
}

/**
 * Detecta el perfil clínico del paciente a partir de una administración BDI-II.
 *
 * Algoritmo de decisión (jerarquía):
 *   1. neurovegetativeRatio ≥ 0.67 → neurovegetative → AC + psiquiatría
 *   2. anhedoniaScore ≥ 4 → behavioral → AC (Dimidjian et al., 2006)
 *   3. cognitiveRatio ≥ 0.5 AND anhedonia < 3 → cognitive → RC (Cuijpers et al., 2019)
 *   4. Default → mixed → AC (opción segura)
 *
 * @param administration Administración completa del BDI-II con responses
 * @returns Perfil clínico + técnica recomendada + justificación
 */
export function detectClinicalProfile(
    administration: InventoryAdministration
): BDIProfileAnalysis {
    const getVal = (id: number): number | null => {
        const r = administration.responses.find((resp) => resp.item_id === id);
        return r?.value ?? null;
    };

    // Subescala cognitivo-afectiva: ítems 1,2,3,5,7,8,14
    const COGNITIVE_ITEMS = [1, 2, 3, 5, 7, 8, 14];
    const cogVals = COGNITIVE_ITEMS.map(getVal).filter((v): v is number => v !== null);
    const cognitiveScore = cogVals.reduce((a, b) => a + b, 0);
    const cognitiveMax = cogVals.length * 3;
    const cognitiveRatio = cognitiveMax > 0 ? cognitiveScore / cognitiveMax : 0;

    // Anhedonia: ítems 4 + 12
    const item4 = getVal(4) ?? 0;
    const item12 = getVal(12) ?? 0;
    const anhedoniaScore = item4 + item12;

    // Perfil neurovegetativo: ítems 15,16,18,19,20,21
    const NEURO_ITEMS = [15, 16, 18, 19, 20, 21];
    const neuroVals = NEURO_ITEMS.map(getVal).filter((v): v is number => v !== null);
    const neuroSum = neuroVals.reduce((a, b) => a + b, 0);
    const neuroMax = neuroVals.length * 3;
    const neurovegetativeRatio = neuroMax > 0 ? neuroSum / neuroMax : 0;

    // Decisión jerárquica
    if (neurovegetativeRatio >= 0.67) {
        return {
            profile: 'neurovegetative',
            cognitiveScore, cognitiveMax, anhedoniaScore, neurovegetativeRatio,
            primaryTechnique: 'ac',
            rationale: 'Perfil neurovegetativo predominante. AC con microtareas + interconsulta psiquiátrica.',
        };
    }

    if (anhedoniaScore >= 4) {
        return {
            profile: 'behavioral',
            cognitiveScore, cognitiveMax, anhedoniaScore, neurovegetativeRatio,
            primaryTechnique: 'ac',
            rationale: 'Anhedonia marcada (ítems 4+12 ≥ 4). Priorizar AC sobre RC (Dimidjian et al., 2006).',
        };
    }

    if (cognitiveRatio >= 0.5 && anhedoniaScore < 3) {
        return {
            profile: 'cognitive',
            cognitiveScore, cognitiveMax, anhedoniaScore, neurovegetativeRatio,
            primaryTechnique: 'rc',
            rationale: 'Perfil cognitivo predominante, anhedonia baja. Priorizar RC (Cuijpers et al., 2019).',
        };
    }

    return {
        profile: 'mixed',
        cognitiveScore, cognitiveMax, anhedoniaScore, neurovegetativeRatio,
        primaryTechnique: 'ac',
        rationale: 'Perfil mixto sin dominancia clara. AC como primera línea (opción clínicamente segura).',
    };
}
