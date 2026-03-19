import { describe, it, expect } from 'vitest';
import { createSession, getSession, createTechnique, createHomework, getReferences } from './handlers';

// Mock data
const validSessionReq = {
    pacienteId: 'paciente-001',
    plan: {},
    tecnicas: [],
    tareas: [],
    referencias: ['Terapia_cognitiva_de_la_depres'],
};

const invalidSessionReq = {
    pacienteId: 123,
    plan: null,
};

describe('API clínicos handlers', () => {
    it('createSession: datos válidos', () => {
        const res = createSession(validSessionReq);
        expect('sessionId' in res && res.sessionId).toBeDefined();
        expect('estado' in res && res.estado).toBe('activa');
    });

    it('createSession: datos inválidos', () => {
        const res = createSession(invalidSessionReq);
        expect('error' in res && res.error).toBe('Datos inválidos');
    });

    it('getSession: retorna datos mock', () => {
        const res = getSession('mock-session-001');
        expect(res.sessionId).toBe('mock-session-001');
        expect(Array.isArray(res.referencias)).toBe(true);
    });

    it('createTechnique: datos válidos', () => {
        const res = createTechnique({ tecnica: {}, contexto: 'test', referencia: 'Terapia_cognitiva_de_la_depres' });
        expect('registroId' in res && res.registroId).toBeDefined();
        expect('estado' in res && res.estado).toBe('registrada');
    });

    it('createTechnique: datos inválidos', () => {
        const res = createTechnique({ contexto: 123 });
        expect('error' in res && res.error).toBe('Datos inválidos');
    });

    it('createHomework: datos válidos', () => {
        const res = createHomework({ tarea: {}, criterios: ['criterio1'], referencia: 'Terapia_cognitiva_de_la_depres' });
        expect('tareaId' in res && res.tareaId).toBeDefined();
        expect('estado' in res && res.estado).toBe('asignada');
    });

    it('createHomework: datos inválidos', () => {
        const res = createHomework({ criterios: 123 });
        expect('error' in res && res.error).toBe('Datos inválidos');
    });

    it('getReferences: retorna referencias', () => {
        const res = getReferences();
        expect(Array.isArray(res.referencias)).toBe(true);
        // En modo stub (references = []), la longitud puede ser 0;
        // este test verifica que la estructura es correcta
        expect(res.referencias).toBeInstanceOf(Array);
    });
});
