import { z } from 'zod';

export const SessionCreateRequestSchema = z.object({
    pacienteId: z.string(),
    plan: z.any(),
    tecnicas: z.array(z.any()),
    tareas: z.array(z.any()),
    referencias: z.array(z.string()),
});

export const SessionCreateResponseSchema = z.object({
    sessionId: z.string(),
    resumen: z.string(),
    estado: z.string(),
});

export const SessionGetResponseSchema = z.object({
    sessionId: z.string(),
    plan: z.any(),
    tecnicas: z.array(z.any()),
    tareas: z.array(z.any()),
    referencias: z.array(z.any()),
    auditoria: z.any(),
});

export const TechniqueCreateRequestSchema = z.object({
    tecnica: z.any(),
    contexto: z.string(),
    referencia: z.string(),
});

export const TechniqueCreateResponseSchema = z.object({
    registroId: z.string(),
    estado: z.string(),
});

export const HomeworkCreateRequestSchema = z.object({
    tarea: z.any(),
    criterios: z.array(z.string()),
    referencia: z.string(),
});

export const HomeworkCreateResponseSchema = z.object({
    tareaId: z.string(),
    estado: z.string(),
});

export const ReferencesGetResponseSchema = z.object({
    referencias: z.array(z.any()),
});
