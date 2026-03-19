/**
 * procedure.types.ts — Procedimientos clínicos estructurados (v3 candidate)
 *
 * Esta capa describe intervenciones ejecutables por técnica,
 * aptas para consulta por motores clínicos.
 */

import type { TechniqueId } from './technique.types';
import type { EvidenceLevel, RiskLevel } from './profile.types';

export interface ProcedureInput {
  nombre: string;
  tipo: 'escala' | 'registro' | 'material' | 'contexto' | 'consentimiento' | 'otro';
  obligatorio: boolean;
  detalle?: string;
}

export interface ProcedureStep {
  orden: number;
  accion: string;
  objetivo: string;
  criterio_completitud?: string;
}

export interface ProcedureSafety {
  risk_level: RiskLevel;
  contraindicaciones: string[];
  stop_criteria: string[];
  requiere_supervision: boolean;
  red_flags: string[];
}

export interface ClinicalProcedure {
  procedure_id: string;
  technique_id: TechniqueId;
  nombre: string;
  modalidad: 'individual' | 'grupal' | 'autoaplicada' | 'mixta';

  clinical_goal: string;
  indications: string[];
  expected_outcomes: string[];

  required_inputs: ProcedureInput[];
  steps: ProcedureStep[];
  success_criteria: string[];

  safety: ProcedureSafety;
  evidence_level: EvidenceLevel;
  intensidad: 'baja' | 'media' | 'alta';

  trace_sources: string[];
}

export interface ProcedureCatalog {
  technique_id: TechniqueId;
  version: string;
  reviewed_at: string; // ISO date
  procedures: ClinicalProcedure[];
}
