/**
 * tccEngineKnowledgeV3Bridge.ts
 *
 * Puente entre tecnicas del motor TCC legacy y paquetes v3 de knowledge.
 */

import type { ClinicalProcedure } from '../knowledge/types';
import type { TechniqueId } from '../knowledge/types/technique.types';
import { getTechniqueV3Package } from '../knowledge/v3/resolver';
import { getTransversalRegulacionPackage } from '../knowledge/transversal_regulacion/resolver';

export interface EngineV3Guidance {
  v3TechniqueId: string;
  techniqueName: string;
  mappingStrategy: 'direct' | 'approximate';
  mappingNote?: string;
  procedureHints: Array<{
    procedureId: string;
    name: string;
    goal: string;
    intensity: string;
  }>;
  safetyFlags: string[];
}

export const ENGINE_TO_V3_MAP: Record<string, TechniqueId | null> = {
  behavioral_activation: 'ac',
  activity_scheduling: 'ac',
  micro_tasks: 'ac',
  momentum_building: 'ac',

  cognitive_restructuring: 'rc',
  behavioral_experiment: 'rc',
  socratic_questioning: 'rc',
  thought_record_abc: 'rc',

  gradual_exposure: 'exposicion',
  response_prevention: 'exposicion',

  functional_analysis: 'mc',
  problem_solving: 'mc',

  relaxation: 'ds',
  relaxation_breathing: 'ds',
  relaxation_progressive_muscle: 'ds',

  // Mindfulness: tecnica independiente
  mindfulness_observation: 'mindfulness',
  mindful_breathing: 'mindfulness',
  body_scan: 'mindfulness',
  urge_surfing: 'mindfulness',
  present_moment_anchor: 'mindfulness',

  // DBT (dialectico-conductual): tecnicas ya presentes en el motor
  self_compassion: 'dc',
  worry_time: 'dc',

  // Aliases DBT para futuras recomendaciones del motor
  chain_analysis: 'dc',
  distress_tolerance_tipp: 'dc',
  emotion_regulation_opposite_action: 'dc',
  interpersonal_effectiveness_dear_man: 'dc',

  // ACT aliases para futuras recomendaciones del motor
  cognitive_defusion: 'act',
  acceptance_willingness: 'act',
  values_clarification: 'act',
  committed_action: 'act',
  self_as_context: 'act',

  // Guidance transversal dedicado: fallback para aliases no-clusterizados.
  radical_acceptance: null,
  grounding_5_4_3_2_1: null,
};

const TRANSVERSAL_TECHNIQUES = new Set<string>([
  'radical_acceptance',
  'grounding_5_4_3_2_1',
]);

const packageCache = new Map<TechniqueId, Awaited<ReturnType<typeof getTechniqueV3Package>>>();
type ProcedureHintSource = Pick<
  ClinicalProcedure,
  'procedure_id' | 'nombre' | 'clinical_goal' | 'intensidad'
>;

function pickTopProcedures(procedures: ProcedureHintSource[], limit = 3) {
  return procedures
    .slice()
    .sort((a, b) => {
      const intensityRank = { alta: 0, media: 1, baja: 2 };
      return intensityRank[a.intensidad] - intensityRank[b.intensidad];
    })
    .slice(0, limit)
    .map((p) => ({
      procedureId: p.procedure_id,
      name: p.nombre,
      goal: p.clinical_goal,
      intensity: p.intensidad,
    }));
}

async function getCachedPackage(techniqueId: TechniqueId) {
  const cached = packageCache.get(techniqueId);
  if (cached) return cached;

  const loaded = await getTechniqueV3Package(techniqueId);
  packageCache.set(techniqueId, loaded);
  return loaded;
}

/**
 * Devuelve guidance v3 para una tecnica del engine legacy.
 * Si no hay mapeo, devuelve null para mantener compatibilidad.
 */
export async function getV3GuidanceForEngineTechnique(
  engineTechnique: string,
): Promise<EngineV3Guidance | null> {
  if (TRANSVERSAL_TECHNIQUES.has(engineTechnique)) {
    try {
      const pkg = await getTransversalRegulacionPackage();
      return {
        v3TechniqueId: 'transversal_regulacion',
        techniqueName: pkg.profile.nombre,
        mappingStrategy: 'direct',
        mappingNote: `Guidance transversal aplicado a tecnica legacy "${engineTechnique}".`,
        procedureHints: pickTopProcedures(pkg.procedures.procedures, 3),
        safetyFlags: pkg.profile.banderas_seguridad.slice(0, 3),
      };
    } catch {
      return null;
    }
  }

  const v3TechniqueId = ENGINE_TO_V3_MAP[engineTechnique];
  if (!v3TechniqueId) return null;

  try {
    const pkg = await getCachedPackage(v3TechniqueId);
    return {
      v3TechniqueId,
      techniqueName: pkg.profile.nombre,
      mappingStrategy: 'direct',
      procedureHints: pickTopProcedures(pkg.procedures.procedures, 3),
      safetyFlags: pkg.profile.banderas_seguridad.slice(0, 3),
    };
  } catch {
    return null;
  }
}
