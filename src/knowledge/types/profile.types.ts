/**
 * profile.types.ts — Perfil clínico estructurado por técnica (v3 candidate)
 *
 * Esta capa describe la técnica como unidad clínica computable:
 * aplicabilidad, seguridad, evidencia y requisitos de uso.
 */

import type { TechniqueId } from './technique.types';

export type EvidenceLevel = 'alta' | 'moderada' | 'baja' | 'emergente' | 'consenso';

export type RiskLevel = 'bajo' | 'moderado' | 'alto' | 'critico';

export interface Contraindication {
  id: string;
  condicion: string;
  tipo: 'absoluta' | 'relativa';
  razon_clinica: string;
  alternativa_sugerida?: string;
}

export interface SupervisionRequirement {
  id: string;
  descripcion: string;
  requerido: boolean;
  contexto: string;
}

export interface EvidenceSummary {
  nivel_global: EvidenceLevel;
  fuerza_recomendacion: 'fuerte' | 'condicional' | 'experimental';
  poblaciones_validadas: string[];
  fuentes_clave: string[];
  limitaciones?: string[];
}

export interface TechniqueProfile {
  profile_id: string;
  technique_id: TechniqueId;
  nombre: string;
  version: string;
  reviewed_at: string; // ISO date
  reviewed_by: string[];

  resumen_clinico: string;
  mecanismos_de_cambio: string[];
  problemas_diana: string[];
  sintomas_diana: string[];
  poblaciones_objetivo: string[];

  prerequisitos: string[];
  contraindicaciones: Contraindication[];
  banderas_seguridad: string[];
  requiere_derivacion_si: string[];
  supervision: SupervisionRequirement[];

  evidencia: EvidenceSummary;
  combinable_con: string[];
  no_recomendada_con: string[];

  trace_sources: string[];
}
