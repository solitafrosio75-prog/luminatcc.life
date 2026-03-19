/**
 * schemas.profile.ts — Zod schemas para perfiles de técnica (v3 candidate)
 */

import { z } from 'zod';

const evidenceLevelSchema = z.enum(['alta', 'moderada', 'baja', 'emergente', 'consenso']);

export const contraindicationSchema = z.object({
  id: z.string().min(1),
  condicion: z.string().min(1),
  tipo: z.enum(['absoluta', 'relativa']),
  razon_clinica: z.string().min(1),
  alternativa_sugerida: z.string().optional(),
});

export const supervisionRequirementSchema = z.object({
  id: z.string().min(1),
  descripcion: z.string().min(1),
  requerido: z.boolean(),
  contexto: z.string().min(1),
});

export const evidenceSummarySchema = z.object({
  nivel_global: evidenceLevelSchema,
  fuerza_recomendacion: z.enum(['fuerte', 'condicional', 'experimental']),
  poblaciones_validadas: z.array(z.string().min(1)).min(1),
  fuentes_clave: z.array(z.string().min(1)).min(1),
  limitaciones: z.array(z.string().min(1)).optional(),
});

export const techniqueProfileSchema = z.object({
  profile_id: z.string().min(1),
  technique_id: z.string().min(1),
  nombre: z.string().min(1),
  version: z.string().min(1),
  reviewed_at: z.string().min(1),
  reviewed_by: z.array(z.string().min(1)).min(1),

  resumen_clinico: z.string().min(1),
  mecanismos_de_cambio: z.array(z.string().min(1)).min(1),
  problemas_diana: z.array(z.string().min(1)).min(1),
  sintomas_diana: z.array(z.string().min(1)).min(1),
  poblaciones_objetivo: z.array(z.string().min(1)).min(1),

  prerequisitos: z.array(z.string().min(1)),
  contraindicaciones: z.array(contraindicationSchema),
  banderas_seguridad: z.array(z.string().min(1)),
  requiere_derivacion_si: z.array(z.string().min(1)),
  supervision: z.array(supervisionRequirementSchema),

  evidencia: evidenceSummarySchema,
  combinable_con: z.array(z.string().min(1)),
  no_recomendada_con: z.array(z.string().min(1)),

  trace_sources: z.array(z.string().min(1)).min(1),
});
