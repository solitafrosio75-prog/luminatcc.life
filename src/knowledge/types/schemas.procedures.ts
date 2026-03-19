/**
 * schemas.procedures.ts — Zod schemas para procedimientos clínicos (v3 candidate)
 */

import { z } from 'zod';

const evidenceLevelSchema = z.enum(['alta', 'moderada', 'baja', 'emergente', 'consenso']);
const riskLevelSchema = z.enum(['bajo', 'moderado', 'alto', 'critico']);

export const procedureInputSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['escala', 'registro', 'material', 'contexto', 'consentimiento', 'otro']),
  obligatorio: z.boolean(),
  detalle: z.string().optional(),
});

export const procedureStepSchema = z.object({
  orden: z.number().int().positive(),
  accion: z.string().min(1),
  objetivo: z.string().min(1),
  criterio_completitud: z.string().optional(),
});

export const procedureSafetySchema = z.object({
  risk_level: riskLevelSchema,
  contraindicaciones: z.array(z.string().min(1)),
  stop_criteria: z.array(z.string().min(1)).min(1),
  requiere_supervision: z.boolean(),
  red_flags: z.array(z.string().min(1)),
});

export const clinicalProcedureSchema = z.object({
  procedure_id: z.string().min(1),
  technique_id: z.string().min(1),
  nombre: z.string().min(1),
  modalidad: z.enum(['individual', 'grupal', 'autoaplicada', 'mixta']),

  clinical_goal: z.string().min(1),
  indications: z.array(z.string().min(1)).min(1),
  expected_outcomes: z.array(z.string().min(1)).min(1),

  required_inputs: z.array(procedureInputSchema),
  steps: z.array(procedureStepSchema).min(1),
  success_criteria: z.array(z.string().min(1)).min(1),

  safety: procedureSafetySchema,
  evidence_level: evidenceLevelSchema,
  intensidad: z.enum(['baja', 'media', 'alta']),

  trace_sources: z.array(z.string().min(1)).min(1),
});

export const procedureCatalogSchema = z.object({
  technique_id: z.string().min(1),
  version: z.string().min(1),
  reviewed_at: z.string().min(1),
  procedures: z.array(clinicalProcedureSchema).min(1),
});
