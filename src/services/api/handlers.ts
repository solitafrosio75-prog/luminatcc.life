// Handlers mock para endpoints clínicos TCC-Lab
import {
    SessionCreateRequestSchema,
    SessionCreateResponseSchema,
    SessionGetResponseSchema,
    TechniqueCreateRequestSchema,
    TechniqueCreateResponseSchema,
    HomeworkCreateRequestSchema,
    HomeworkCreateResponseSchema,
    ReferencesGetResponseSchema,
} from '../../knowledge/schemas/endpoints.zod';

// Referencias bibliográficas — stub vacío hasta que se integre la fuente de datos
const references: unknown[] = [];

// POST /session
export function createSession(req: unknown) {
    const parsed = SessionCreateRequestSchema.safeParse(req);
    if (!parsed.success) return { error: 'Datos inválidos', detalles: parsed.error.issues };
    return SessionCreateResponseSchema.parse({
        sessionId: 'mock-session-001',
        resumen: 'Sesión creada correctamente',
        estado: 'activa',
    });
}

// GET /session/{id}
export function getSession(id: string) {
    // Mock: retorna datos simulados
    return SessionGetResponseSchema.parse({
        sessionId: id,
        plan: {},
        tecnicas: [],
        tareas: [],
        referencias: references.slice(0, 2),
        auditoria: {},
    });
}

// POST /technique
export function createTechnique(req: unknown) {
    const parsed = TechniqueCreateRequestSchema.safeParse(req);
    if (!parsed.success) return { error: 'Datos inválidos', detalles: parsed.error.issues };
    return TechniqueCreateResponseSchema.parse({
        registroId: 'mock-technique-001',
        estado: 'registrada',
    });
}

// POST /homework
export function createHomework(req: unknown) {
    const parsed = HomeworkCreateRequestSchema.safeParse(req);
    if (!parsed.success) return { error: 'Datos inválidos', detalles: parsed.error.issues };
    return HomeworkCreateResponseSchema.parse({
        tareaId: 'mock-homework-001',
        estado: 'asignada',
    });
}

// GET /references
export function getReferences() {
    return ReferencesGetResponseSchema.parse({
        referencias: references,
    });
}

// Para migrar a backend real: reemplazar mocks por lógica de persistencia y consulta.
