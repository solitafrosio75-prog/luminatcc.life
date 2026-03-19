import { describe, it, expect } from 'vitest';
import {
    deriveClinicalSeverity,
    snapshotFromBDIII,
    snapshotFromPHQ9,
    snapshotFromClinicalProfile,
    type InventorySnapshot,
    type ProfileSnapshot,
} from '../knowledge/therapist/severity.derivator';

describe('deriveClinicalSeverity', () => {
    const now = Date.now();
    const recent = now - 1000 * 60 * 60 * 24; // 1 día atrás
    const stale = now - 1000 * 60 * 60 * 24 * 30; // 30 días atrás

    // ─── Solo inventarios ───────────────────────────────────────────────

    it('BDI-II mínima → severidad leve', () => {
        const inv = [snapshotFromBDIII(10, 'Depresión mínima', recent)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('leve');
        expect(result.confianza).toBe('alta');
    });

    it('BDI-II leve → severidad leve', () => {
        const inv = [snapshotFromBDIII(16, 'Depresión leve', recent)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('leve');
    });

    it('BDI-II moderada → severidad moderada', () => {
        const inv = [snapshotFromBDIII(24, 'Depresión moderada', recent)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('moderada');
    });

    it('BDI-II grave → severidad grave', () => {
        const inv = [snapshotFromBDIII(35, 'Depresión grave', recent)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('grave');
    });

    it('PHQ-9 moderadamente grave → severidad grave', () => {
        const inv = [snapshotFromPHQ9(17, 'Depresión moderadamente grave', recent)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('grave');
    });

    it('PHQ-9 moderada → severidad moderada', () => {
        const inv = [snapshotFromPHQ9(12, 'Depresión moderada', recent)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('moderada');
    });

    // ─── Inventarios caducados ──────────────────────────────────────────

    it('inventario caducado (>14 días) se ignora', () => {
        const inv = [snapshotFromBDIII(35, 'Depresión grave', stale)];
        const result = deriveClinicalSeverity(inv);
        // Sin inventario reciente ni perfil → moderada por defecto
        expect(result.severidad).toBe('moderada');
        expect(result.confianza).toBe('baja');
    });

    // ─── Solo perfil clínico ────────────────────────────────────────────

    it('perfil con impairment severe → severidad grave', () => {
        const profile: ProfileSnapshot = {
            problemFrequency: 'daily',
            problemDuration: 'years',
            baselineFunctionalImpairment: 'severe',
            areasAffected: ['work', 'relationships', 'health', 'sleep'],
            currentPhase: 'exploracion',
        };
        const result = deriveClinicalSeverity([], profile);
        expect(result.severidad).toBe('grave');
        expect(result.confianza).toBe('media');
    });

    it('perfil con impairment minimal → severidad leve', () => {
        const profile: ProfileSnapshot = {
            problemFrequency: 'occasional',
            problemDuration: 'weeks',
            baselineFunctionalImpairment: 'minimal',
            areasAffected: ['work'],
            currentPhase: 'inicio',
        };
        const result = deriveClinicalSeverity([], profile);
        expect(result.severidad).toBe('leve');
    });

    it('perfil con ≥6 áreas afectadas → sube a grave', () => {
        const profile: ProfileSnapshot = {
            problemFrequency: 'daily',
            problemDuration: 'months',
            baselineFunctionalImpairment: 'mild',
            areasAffected: ['work', 'relationships', 'health', 'leisure', 'selfcare', 'sleep'],
            currentPhase: 'exploracion',
        };
        const result = deriveClinicalSeverity([], profile);
        expect(result.severidad).toBe('grave');
    });

    // ─── Combinación inventarios + perfil ────────────────────────────────

    it('inventario leve + perfil grave → sube a grave (perfil solo sube)', () => {
        const inv = [snapshotFromBDIII(15, 'Depresión leve', recent)];
        const profile: ProfileSnapshot = {
            problemFrequency: 'daily',
            problemDuration: 'years',
            baselineFunctionalImpairment: 'severe',
            areasAffected: ['work', 'relationships', 'health', 'leisure', 'selfcare', 'sleep'],
            currentPhase: 'intervencion',
        };
        const result = deriveClinicalSeverity(inv, profile);
        expect(result.severidad).toBe('grave');
        expect(result.confianza).toBe('alta');
    });

    it('inventario grave + perfil leve → mantiene grave (perfil no baja)', () => {
        const inv = [snapshotFromBDIII(35, 'Depresión grave', recent)];
        const profile: ProfileSnapshot = {
            problemFrequency: 'occasional',
            problemDuration: 'weeks',
            baselineFunctionalImpairment: 'minimal',
            areasAffected: ['work'],
            currentPhase: 'inicio',
        };
        const result = deriveClinicalSeverity(inv, profile);
        expect(result.severidad).toBe('grave');
    });

    it('múltiples inventarios → usa el más grave', () => {
        const inv = [
            snapshotFromBDIII(15, 'Depresión leve', recent),
            snapshotFromPHQ9(18, 'Depresión moderadamente grave', recent),
        ];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('grave');
    });

    // ─── Alertas críticas ───────────────────────────────────────────────

    it('ítem 9 ≥ 2 (BDI-II) → fuerza severidad grave + alertas', () => {
        const inv = [snapshotFromBDIII(16, 'Depresión leve', recent, 2)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('grave');
        expect(result.alertasCriticas).toBe(true);
        expect(result.requiereCautelaAdicional).toBe(true);
    });

    it('ítem 9 = 1 (warning) → no fuerza grave', () => {
        const inv = [snapshotFromBDIII(16, 'Depresión leve', recent, 1)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('leve');
        expect(result.alertasCriticas).toBe(false);
    });

    it('ítem 9 = 3 (emergency) → fuerza grave', () => {
        const inv = [snapshotFromPHQ9(8, 'Depresión leve', recent, 3)];
        const result = deriveClinicalSeverity(inv);
        expect(result.severidad).toBe('grave');
        expect(result.alertasCriticas).toBe(true);
    });

    // ─── Sin datos ──────────────────────────────────────────────────────

    it('sin inventarios ni perfil → moderada con confianza baja', () => {
        const result = deriveClinicalSeverity([]);
        expect(result.severidad).toBe('moderada');
        expect(result.confianza).toBe('baja');
    });

    // ─── Helpers ────────────────────────────────────────────────────────

    it('snapshotFromClinicalProfile mapea correctamente', () => {
        const profile = {
            baselineFunctionalImpairment: 'severe',
            currentPhase: 'intervencion',
        };
        const patientRecord = {
            problemFrequency: 'daily',
            problemDuration: 'years',
            affectedAreas: ['work', 'health'],
        };
        const snap = snapshotFromClinicalProfile(profile, patientRecord);
        expect(snap.problemFrequency).toBe('daily');
        expect(snap.baselineFunctionalImpairment).toBe('severe');
    });

    // ─── Trazabilidad ───────────────────────────────────────────────────

    it('incluye fuentes en el resultado', () => {
        const inv = [snapshotFromBDIII(24, 'Depresión moderada', recent)];
        const profile: ProfileSnapshot = {
            problemFrequency: 'daily',
            problemDuration: 'months',
            baselineFunctionalImpairment: 'moderate',
            areasAffected: ['work', 'relationships'],
            currentPhase: 'exploracion',
        };
        const result = deriveClinicalSeverity(inv, profile);
        expect(result.fuentes.length).toBeGreaterThan(0);
        expect(result.fuentes.some(f => f.includes('BDI_II'))).toBe(true);
        expect(result.fuentes.some(f => f.includes('Perfil clínico'))).toBe(true);
        expect(result.detalle).toBeTruthy();
    });
});
