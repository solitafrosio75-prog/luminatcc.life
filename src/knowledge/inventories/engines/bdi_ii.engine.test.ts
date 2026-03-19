/**
 * bdi_ii.engine.test.ts — Tests del motor de scoring BDI-II
 *
 * Casos cubiertos:
 *   - Caso feliz: administración completa, scoring correcto
 *   - Caso riesgo: ítem 9 activo → alerta antes del total
 *   - Caso validez: administración con menos de 17 ítems respondidos
 *   - Análisis de cambio: recuperación, mejora, sin cambio, deterioro
 *
 * Los tests son UNITARIOS: no montan React, no usan stores, no acceden a IndexedDB.
 */

import { describe, it, expect } from 'vitest';
import { bdiIIEngine, detectClinicalProfile } from './bdi_ii.engine';
import { BDI_II_DEFINITION } from '../definitions/bdi_ii_definition';
import type { InventoryAdministration, ItemResponse } from '../types/inventory_types';

// ============================================================================
// Factories de datos de test
// ============================================================================

/** Crea una administración con todas las puntuaciones en `value` (0-3) */
function makeAdministration(
  overrides: Partial<InventoryAdministration> = {},
  itemValues: Record<number, number> = {}
): InventoryAdministration {
  const responses: ItemResponse[] = Array.from({ length: 21 }, (_, i) => ({
    item_id: i + 1,
    value: itemValues[i + 1] ?? 0,
    answered_at: new Date().toISOString(),
  }));

  return {
    id: 'test-admin-001',
    inventory_id: 'bdi_ii',
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

/** Crea administración con solo N ítems respondidos (resto null) */
function makeIncompleteAdministration(respondedCount: number): InventoryAdministration {
  const responses: ItemResponse[] = Array.from({ length: 21 }, (_, i) => ({
    item_id: i + 1,
    value: i < respondedCount ? 0 : null,
    answered_at: i < respondedCount ? new Date().toISOString() : null,
  }));

  return {
    id: 'test-admin-incomplete',
    inventory_id: 'bdi_ii',
    patient_id: 'patient-001',
    session_id: 'session-001',
    session_number: 1,
    phase: 'baseline',
    status: 'in_progress',
    started_at: new Date().toISOString(),
    completed_at: null,
    responses,
  };
}

// ============================================================================
// Tests: checkCriticalItems
// ============================================================================

describe('bdiIIEngine.checkCriticalItems', () => {
  it('no genera alertas cuando el ítem 9 es 0', () => {
    const admin = makeAdministration({}, { 9: 0 });
    const alerts = bdiIIEngine.checkCriticalItems(admin, BDI_II_DEFINITION);
    expect(alerts).toHaveLength(0);
  });

  it('genera alerta "moderate" cuando el ítem 9 es 1', () => {
    const admin = makeAdministration({}, { 9: 1 });
    const alerts = bdiIIEngine.checkCriticalItems(admin, BDI_II_DEFINITION);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].urgency).toBe('moderate');
    expect(alerts[0].item_id).toBe(9);
    expect(alerts[0].value).toBe(1);
  });

  it('genera alerta "high" cuando el ítem 9 es 2', () => {
    const admin = makeAdministration({}, { 9: 2 });
    const alerts = bdiIIEngine.checkCriticalItems(admin, BDI_II_DEFINITION);
    expect(alerts[0].urgency).toBe('high');
  });

  it('genera alerta "critical" cuando el ítem 9 es 3', () => {
    const admin = makeAdministration({}, { 9: 3 });
    const alerts = bdiIIEngine.checkCriticalItems(admin, BDI_II_DEFINITION);
    expect(alerts[0].urgency).toBe('critical');
  });

  it('no genera alerta si el ítem 9 no fue respondido (null)', () => {
    const admin = makeAdministration();
    // Forzar null en ítem 9
    const item9 = admin.responses.find((r) => r.item_id === 9)!;
    item9.value = null;
    item9.answered_at = null;

    const alerts = bdiIIEngine.checkCriticalItems(admin, BDI_II_DEFINITION);
    expect(alerts).toHaveLength(0);
  });
});

// ============================================================================
// Tests: checkValidity
// ============================================================================

describe('bdiIIEngine.checkValidity', () => {
  it('administración completa (21 ítems) es válida', () => {
    const admin = makeAdministration();
    const result = bdiIIEngine.checkValidity(admin, BDI_II_DEFINITION);
    expect(result.is_valid).toBe(true);
  });

  it('administración con 17 ítems respondidos es válida (límite mínimo)', () => {
    const admin = makeIncompleteAdministration(17);
    const result = bdiIIEngine.checkValidity(admin, BDI_II_DEFINITION);
    expect(result.is_valid).toBe(true);
  });

  it('administración con 16 ítems respondidos es inválida', () => {
    const admin = makeIncompleteAdministration(16);
    const result = bdiIIEngine.checkValidity(admin, BDI_II_DEFINITION);
    expect(result.is_valid).toBe(false);
    expect(result.reason).toContain('16');
  });

  it('administración vacía (0 respuestas) es inválida', () => {
    const admin = makeIncompleteAdministration(0);
    const result = bdiIIEngine.checkValidity(admin, BDI_II_DEFINITION);
    expect(result.is_valid).toBe(false);
  });
});

// ============================================================================
// Tests: score — puntuaciones y etiquetas de severidad
// ============================================================================

describe('bdiIIEngine.score — puntuaciones y severidad', () => {
  it('todos los ítems a 0 → puntuación 0, "Depresión mínima"', () => {
    const admin = makeAdministration();
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(0);
    expect(result.severity_label).toBe('Depresión mínima');
    expect(result.is_valid).toBe(true);
  });

  it('puntuación 13 → severidad "Depresión mínima"', () => {
    // Distribuir 13 puntos entre varios ítems (sin activar ítem 9)
    const values: Record<number, number> = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 1 };
    const admin = makeAdministration({}, values);
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(13);
    expect(result.severity_label).toBe('Depresión mínima');
  });

  it('puntuación 14 → severidad "Depresión leve"', () => {
    const values: Record<number, number> = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 };
    const admin = makeAdministration({}, values);
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(14);
    expect(result.severity_label).toBe('Depresión leve');
  });

  it('puntuación 20 → severidad "Depresión moderada"', () => {
    const values: Record<number, number> = {
      1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2,
    };
    const admin = makeAdministration({}, values);
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(20);
    expect(result.severity_label).toBe('Depresión moderada');
  });

  it('puntuación 29 → severidad "Depresión grave"', () => {
    // 9 ítems a 3 + 2 ítems a 1 = 29
    const values: Record<number, number> = {
      1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 10: 3, 11: 1, 12: 1,
    };
    const admin = makeAdministration({}, values);
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(29);
    expect(result.severity_label).toBe('Depresión grave');
  });

  it('puntuación 63 (máximo) → severidad "Depresión grave"', () => {
    const values: Record<number, number> = {};
    for (let i = 1; i <= 21; i++) values[i] = 3;
    const admin = makeAdministration({}, values);
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(63);
    expect(result.severity_label).toBe('Depresión grave');
  });

  it('administración inválida devuelve is_valid=false y total=0', () => {
    const admin = makeIncompleteAdministration(10);
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.is_valid).toBe(false);
    expect(result.total_score).toBe(0);
  });
});

// ============================================================================
// Tests: score — ítems críticos dentro del resultado
// ============================================================================

describe('bdiIIEngine.score — ítems críticos en resultado', () => {
  it('ítem 9 = 0 → critical_alerts vacío', () => {
    const admin = makeAdministration({}, { 9: 0 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.critical_alerts).toHaveLength(0);
  });

  it('ítem 9 = 2 → critical_alerts tiene una alerta "high"', () => {
    const admin = makeAdministration({}, { 9: 2 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.critical_alerts).toHaveLength(1);
    expect(result.critical_alerts[0].urgency).toBe('high');
  });

  it('alerta crítica existe aunque puntuación total sea baja', () => {
    // Todos a 0 excepto ítem 9 = 1: total = 1, pero alerta presente
    const admin = makeAdministration({}, { 9: 1 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    expect(result.total_score).toBe(1);
    expect(result.critical_alerts).toHaveLength(1);
    expect(result.severity_label).toBe('Depresión mínima');
  });
});

// ============================================================================
// Tests: analyzeChange — Jacobson-Truax
// ============================================================================

describe('bdiIIEngine.analyzeChange', () => {
  it('"unchanged" cuando el cambio no supera RCI', () => {
    const baseline = makeAdministration({ id: 'b1' }, { 1: 3, 2: 3, 3: 3 }); // total = 9
    const current  = makeAdministration({ id: 'c1' }, { 1: 2, 2: 3, 3: 3 }); // total = 8, cambio = -1

    const result = bdiIIEngine.analyzeChange(baseline, current, BDI_II_DEFINITION);
    expect(result.category).toBe('unchanged');
    expect(result.is_reliable_change).toBe(false);
    expect(result.raw_change).toBe(-1);
  });

  it('"improved" con cambio fiable pero sin llegar a rango normativo', () => {
    // Baseline: 35, Current: 20 → cambio = -15
    const baseline: Record<number, number> = {};
    const currentVals: Record<number, number> = {};
    // Distribuir 35 puntos en baseline sin usar ítem 9
    for (let i = 1; i <= 11; i++) baseline[i] = 3;
    baseline[12] = 2;
    // Current: 20 puntos
    for (let i = 1; i <= 6; i++) currentVals[i] = 3;
    currentVals[7] = 2;

    const b = makeAdministration({ id: 'b2' }, baseline);
    const c = makeAdministration({ id: 'c2' }, currentVals);

    const result = bdiIIEngine.analyzeChange(b, c, BDI_II_DEFINITION);
    // RCI = -15 / SE_DIFF. SE_DIFF = 9.7 * sqrt(2 * 0.07) ≈ 3.63 → |RCI| ≈ 4.13 > 1.96
    expect(result.is_reliable_change).toBe(true);
    expect(result.category).toBe('improved'); // current = 20, no < 14
    expect(result.raw_change).toBe(-15);
  });

  it('"recovered" cuando el cambio es fiable y current < 14', () => {
    // Baseline: 35, Current: 5 → cambio = -30
    const baselineVals: Record<number, number> = {};
    for (let i = 1; i <= 11; i++) baselineVals[i] = 3;
    baselineVals[12] = 2;

    const currentVals: Record<number, number> = { 1: 2, 2: 1, 3: 2 }; // total = 5

    const b = makeAdministration({ id: 'b3' }, baselineVals);
    const c = makeAdministration({ id: 'c3' }, currentVals);

    const result = bdiIIEngine.analyzeChange(b, c, BDI_II_DEFINITION);
    expect(result.is_reliable_change).toBe(true);
    expect(result.category).toBe('recovered');
    expect(result.current_score).toBe(5);
  });

  it('"deteriorated" con empeoramiento fiable', () => {
    // Baseline: 10, Current: 35 → cambio = +25
    const baselineVals: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 };
    const currentVals: Record<number, number> = {};
    for (let i = 1; i <= 11; i++) currentVals[i] = 3;
    currentVals[12] = 2;

    const b = makeAdministration({ id: 'b4' }, baselineVals);
    const c = makeAdministration({ id: 'c4' }, currentVals);

    const result = bdiIIEngine.analyzeChange(b, c, BDI_II_DEFINITION);
    expect(result.is_reliable_change).toBe(true);
    expect(result.category).toBe('deteriorated');
    expect(result.raw_change).toBeGreaterThan(0);
  });
});

// ============================================================================
// Tests: generateInsights
// ============================================================================

describe('bdiIIEngine.generateInsights', () => {
  it('alerta de ideación suicida aparece primero en insights', () => {
    const admin = makeAdministration({}, { 9: 2 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    expect(insights[0]).toContain('ALERTA PRIORITARIA');
  });

  it('puntuación mínima genera insight de mantenimiento', () => {
    const admin = makeAdministration();
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION);
    expect(insights.some((i) => i.toLowerCase().includes('mínima') || i.toLowerCase().includes('mínimo'))).toBe(true);
  });

  it('administración inválida retorna insight de error, no de clínica', () => {
    const invalid = makeIncompleteAdministration(5);
    const result = bdiIIEngine.score(invalid, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION);
    expect(insights[0]).toContain('incompleta');
  });

  // ── Anhedonia (ítems 4 + 12) ──

  it('detecta ANHEDONIA MARCADA cuando ítems 4 y 12 ambos ≥ 2', () => {
    const admin = makeAdministration({}, { 4: 3, 12: 3, 1: 2, 2: 2 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    const anhedoniaInsight = insights.find(i => i.includes('ANHEDONIA MARCADA'));
    expect(anhedoniaInsight).toBeDefined();
    expect(anhedoniaInsight).toContain('Priorizar AC sobre RC');
    expect(anhedoniaInsight).toContain('Dimidjian');
  });

  it('detecta anhedonia moderada cuando ítems 4+12 suman 2-3', () => {
    const admin = makeAdministration({}, { 4: 1, 12: 1 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    const anhedoniaInsight = insights.find(i => i.toLowerCase().includes('anhedonia moderada'));
    expect(anhedoniaInsight).toBeDefined();
    expect(anhedoniaInsight).toContain('AC como primera línea');
  });

  it('no genera insight de anhedonia si ítems 4+12 suman 0-1', () => {
    const admin = makeAdministration({}, { 4: 0, 12: 1 });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    expect(insights.every(i => !i.toLowerCase().includes('anhedonia'))).toBe(true);
  });

  // ── Perfil neurovegetativo (ítems 15,16,18,19,20,21) ──

  it('detecta PERFIL NEUROVEGETATIVO PREDOMINANTE con ítems somáticos altos', () => {
    // 6 ítems neurovegetativos a 3 (max): ratio = 18/18 = 1.0 > 0.67
    const admin = makeAdministration({}, {
      15: 3, 16: 3, 18: 3, 19: 3, 20: 3, 21: 3,
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    const neuroInsight = insights.find(i => i.includes('PERFIL NEUROVEGETATIVO PREDOMINANTE'));
    expect(neuroInsight).toBeDefined();
    expect(neuroInsight).toContain('Interconsulta psiquiátrica');
    expect(neuroInsight).toContain('microtareas');
  });

  it('detecta carga neurovegetativa moderada con ratio ≥ 0.5', () => {
    // 6 ítems neurovegetativos: 3 a valor 2, 3 a valor 1 → 9/18 = 0.5
    const admin = makeAdministration({}, {
      15: 2, 16: 2, 18: 2, 19: 1, 20: 1, 21: 1,
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    const neuroInsight = insights.find(i => i.includes('Carga neurovegetativa moderada'));
    expect(neuroInsight).toBeDefined();
    expect(neuroInsight).toContain('higiene del sueño');
  });

  it('no genera insight neurovegetativo sin administración', () => {
    // Sin administration → no debería haber insights de ítems individuales
    const admin = makeAdministration({}, {
      15: 3, 16: 3, 18: 3, 19: 3, 20: 3, 21: 3,
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION);
    expect(insights.every(i => !i.includes('NEUROVEGETATIVO'))).toBe(true);
    expect(insights.every(i => !i.includes('ANHEDONIA'))).toBe(true);
  });

  // ── Combinado: anhedonia + neurovegetativo ──

  it('genera ambos insights cuando coexisten anhedonia + perfil neurovegetativo', () => {
    const admin = makeAdministration({}, {
      4: 3, 12: 3,                            // anhedonia marcada
      15: 3, 16: 3, 18: 3, 19: 3, 20: 3, 21: 3, // neurovegetativo
      1: 3, 2: 3,                              // tristeza/pesimismo para subir total
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    expect(insights.some(i => i.includes('ANHEDONIA MARCADA'))).toBe(true);
    expect(insights.some(i => i.includes('PERFIL NEUROVEGETATIVO PREDOMINANTE'))).toBe(true);
  });

  // ── Perfil cognitivo (ítems 1,2,3,5,7,8,14) ──

  it('detecta PERFIL COGNITIVO PREDOMINANTE con ítems cognitivo-afectivos altos y anhedonia baja', () => {
    // Ítems cognitivos altos (1,2,3,5,7,8,14 a valor 2-3), anhedonia baja (4,12 a 0-1)
    const admin = makeAdministration({}, {
      1: 3, 2: 3, 3: 2, 5: 3, 7: 2, 8: 3, 14: 2,  // cognitivo: 18/21 ≈ 0.86
      4: 0, 12: 1,                                     // anhedonia: 1 < 3
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    const cogInsight = insights.find(i => i.includes('PERFIL COGNITIVO PREDOMINANTE'));
    expect(cogInsight).toBeDefined();
    expect(cogInsight).toContain('Reestructuración Cognitiva');
    expect(cogInsight).toContain('Cuijpers');
  });

  it('detecta carga cognitivo-afectiva moderada con ratio ≥ 0.4', () => {
    // Ítems cognitivos moderados: 9/21 ≈ 0.43, anhedonia baja
    const admin = makeAdministration({}, {
      1: 2, 2: 1, 3: 1, 5: 2, 7: 1, 8: 1, 14: 1,  // cognitivo: 9/21 ≈ 0.43
      4: 0, 12: 0,                                     // anhedonia: 0
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    const cogInsight = insights.find(i => i.includes('Carga cognitivo-afectiva moderada'));
    expect(cogInsight).toBeDefined();
    expect(cogInsight).toContain('RC');
  });

  it('NO detecta perfil cognitivo cuando anhedonia es alta (4+12 ≥ 3)', () => {
    // Ítems cognitivos altos PERO anhedonia también alta
    const admin = makeAdministration({}, {
      1: 3, 2: 3, 3: 3, 5: 3, 7: 3, 8: 3, 14: 3,  // cognitivo: 21/21 = 1.0
      4: 2, 12: 2,                                     // anhedonia: 4 ≥ 3 → bloquea RC
    });
    const result = bdiIIEngine.score(admin, BDI_II_DEFINITION);
    const insights = bdiIIEngine.generateInsights!(result, BDI_II_DEFINITION, admin);
    // Debe generar ANHEDONIA, no PERFIL COGNITIVO
    expect(insights.some(i => i.includes('ANHEDONIA MARCADA'))).toBe(true);
    expect(insights.every(i => !i.includes('PERFIL COGNITIVO PREDOMINANTE'))).toBe(true);
  });
});

// ============================================================================
// Tests: detectClinicalProfile — Selección de técnica AC vs RC
// ============================================================================

describe('detectClinicalProfile — perfil clínico para selección de técnica', () => {
  it('perfil cognitivo: ítems cognitivos altos + anhedonia baja → RC', () => {
    const admin = makeAdministration({}, {
      1: 3, 2: 3, 3: 2, 5: 3, 7: 2, 8: 3, 14: 2,  // cog: 18/21 ≈ 0.86
      4: 0, 12: 1,                                     // anhedonia: 1 < 3
    });
    const result = detectClinicalProfile(admin);
    expect(result.profile).toBe('cognitive');
    expect(result.primaryTechnique).toBe('rc');
    expect(result.rationale).toContain('cognitivo');
    expect(result.rationale).toContain('Cuijpers');
  });

  it('perfil conductual: anhedonia alta → AC', () => {
    const admin = makeAdministration({}, {
      4: 3, 12: 3,      // anhedonia: 6 ≥ 4
      1: 1, 2: 1,        // cognitivo bajo
    });
    const result = detectClinicalProfile(admin);
    expect(result.profile).toBe('behavioral');
    expect(result.primaryTechnique).toBe('ac');
    expect(result.rationale).toContain('Dimidjian');
  });

  it('perfil neurovegetativo: ítems somáticos dominantes → AC + psiquiatría', () => {
    const admin = makeAdministration({}, {
      15: 3, 16: 3, 18: 3, 19: 3, 20: 3, 21: 3,  // neuro: 18/18 = 1.0 ≥ 0.67
    });
    const result = detectClinicalProfile(admin);
    expect(result.profile).toBe('neurovegetative');
    expect(result.primaryTechnique).toBe('ac');
    expect(result.rationale).toContain('psiquiátrica');
  });

  it('perfil mixto: sin dominancia clara → AC (default seguro)', () => {
    const admin = makeAdministration({}, {
      1: 1, 2: 1, 3: 1, 5: 1, 7: 1, 8: 1, 14: 1,  // cog: 7/21 ≈ 0.33 < 0.5
      4: 1, 12: 1,                                      // anhedonia: 2 < 4
      15: 1, 16: 1, 18: 1,                              // neuro bajo
    });
    const result = detectClinicalProfile(admin);
    expect(result.profile).toBe('mixed');
    expect(result.primaryTechnique).toBe('ac');
    expect(result.rationale).toContain('mixto');
  });

  it('neurovegetativo tiene prioridad sobre conductual y cognitivo', () => {
    // Todos los perfiles altos: neuro domina por jerarquía
    const admin = makeAdministration({}, {
      1: 3, 2: 3, 3: 3, 5: 3, 7: 3, 8: 3, 14: 3,     // cog: 21/21 = 1.0
      4: 3, 12: 3,                                        // anhedonia: 6
      15: 3, 16: 3, 18: 3, 19: 3, 20: 3, 21: 3,         // neuro: 18/18 = 1.0
    });
    const result = detectClinicalProfile(admin);
    expect(result.profile).toBe('neurovegetative');  // neuro tiene prioridad
    expect(result.primaryTechnique).toBe('ac');
  });
});
