/**
 * resolver.test.ts — Tests del resolver AC v3
 *
 * Casos cubiertos:
 *   - Carga correcta de profile + procedures
 *   - Coherencia de technique_id
 *   - Cache (segunda llamada devuelve mismo objeto)
 *   - Helpers: getACProfile, getACProcedures, getACProcedureById, getACProceduresByIndication
 *   - clearACCache invalida cache
 *
 * Tests UNITARIOS: sin React, sin stores, sin IndexedDB.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getACPackage,
    getACProfile,
    getACProcedures,
    getACProcedureById,
    getACProceduresByIndication,
    clearACCache,
} from './resolver';

beforeEach(() => {
    clearACCache();
});

describe('getACPackage', () => {
    it('carga profile y procedures con technique_id "ac"', async () => {
        const pkg = await getACPackage();
        expect(pkg.profile.technique_id).toBe('ac');
        expect(pkg.procedures.technique_id).toBe('ac');
        expect(pkg.loadedAt).toBeTruthy();
    });

    it('profile tiene campos clínicos esenciales', async () => {
        const pkg = await getACPackage();
        expect(pkg.profile.nombre).toBeTruthy();
        expect(pkg.profile.resumen_clinico).toBeTruthy();
        expect(pkg.profile.contraindicaciones.length).toBeGreaterThan(0);
    });

    it('procedures contiene al menos un procedimiento', async () => {
        const pkg = await getACPackage();
        expect(pkg.procedures.procedures.length).toBeGreaterThan(0);
    });

    it('todos los procedures tienen technique_id "ac"', async () => {
        const pkg = await getACPackage();
        for (const proc of pkg.procedures.procedures) {
            expect(proc.technique_id).toBe('ac');
        }
    });

    it('segunda llamada devuelve objeto cacheado (misma referencia)', async () => {
        const pkg1 = await getACPackage();
        const pkg2 = await getACPackage();
        expect(pkg1).toBe(pkg2);
    });
});

describe('getACProfile', () => {
    it('devuelve el perfil clínico AC directamente', async () => {
        const profile = await getACProfile();
        expect(profile.technique_id).toBe('ac');
        expect(profile.profile_id).toBeTruthy();
    });
});

describe('getACProcedures', () => {
    it('devuelve el catálogo de procedures AC', async () => {
        const catalog = await getACProcedures();
        expect(catalog.technique_id).toBe('ac');
        expect(catalog.procedures.length).toBeGreaterThan(0);
    });
});

describe('getACProcedureById', () => {
    it('encuentra procedure existente por ID', async () => {
        const catalog = await getACProcedures();
        const firstId = catalog.procedures[0].procedure_id;
        const proc = await getACProcedureById(firstId);
        expect(proc).toBeDefined();
        expect(proc!.procedure_id).toBe(firstId);
    });

    it('devuelve undefined para ID inexistente', async () => {
        const proc = await getACProcedureById('procedure_que_no_existe');
        expect(proc).toBeUndefined();
    });
});

describe('getACProceduresByIndication', () => {
    it('filtra procedures por indicación clínica', async () => {
        const results = await getACProceduresByIndication('depresion');
        expect(results.length).toBeGreaterThan(0);
        for (const proc of results) {
            const match = proc.indications.some((ind) =>
                ind.toLowerCase().includes('depresion'),
            );
            expect(match).toBe(true);
        }
    });

    it('devuelve array vacío si la indicación no coincide', async () => {
        const results = await getACProceduresByIndication('tricotilomania_extrema_inventada');
        expect(results).toHaveLength(0);
    });
});

describe('clearACCache', () => {
    it('invalida cache (nueva carga tras clear)', async () => {
        const pkg1 = await getACPackage();
        clearACCache();
        const pkg2 = await getACPackage();
        expect(pkg1).not.toBe(pkg2);
        expect(pkg2.profile.technique_id).toBe('ac');
    });
});
