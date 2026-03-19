/**
 * v3/resolver.ts — Capa de resolucion unificada para paquetes v3
 *
 * API para motores clinicos: carga profile + procedures por tecnica,
 * valida contrato con Zod y entrega objeto tipado.
 */

import type { TechniqueId } from '../types/technique.types';
import type { ProcedureCatalog } from '../types/procedure.types';
import type { TechniqueProfile } from '../types/profile.types';

import { techniqueProfileSchema } from '../types/schemas.profile';
import { procedureCatalogSchema } from '../types/schemas.procedures';

export type V3TechniqueId = 'ac' | 'rc' | 'act' | 'mindfulness';

export interface TechniqueV3Package {
  techniqueId: V3TechniqueId;
  profile: TechniqueProfile;
  procedures: ProcedureCatalog;
  loadedAt: string;
}

type JsonLoader = () => Promise<{ default: unknown }>;

const V3_PROFILE_LOADERS: Record<V3TechniqueId, JsonLoader> = {
  ac: () => import('../ac/profile/ac.profile.json'),
  rc: () => import('../rc/profile/rc.profile.json'),
  act: () => import('../act/profile/act.profile.json'),
  mindfulness: () => import('../mindfulness/profile/mindfulness.profile.json'),
};

const V3_PROCEDURE_LOADERS: Record<V3TechniqueId, JsonLoader> = {
  ac: () => import('../ac/procedures/ac.procedures.json'),
  rc: () => import('../rc/procedures/rc.procedures.json'),
  act: () => import('../act/procedures/act.procedures.json'),
  mindfulness: () => import('../mindfulness/procedures/mindfulness.procedures.json'),
};

const V3_TECHNIQUES: V3TechniqueId[] = ['ac', 'rc', 'act', 'mindfulness'];

function isV3TechniqueId(techniqueId: TechniqueId): techniqueId is V3TechniqueId {
  return V3_TECHNIQUES.includes(techniqueId as V3TechniqueId);
}

function assertTechniqueCoherence(
  techniqueId: V3TechniqueId,
  profile: { technique_id: string },
  procedures: {
    technique_id: string;
    procedures: Array<{ procedure_id: string; technique_id: string }>;
  },
): void {
  if (profile.technique_id !== techniqueId) {
    throw new Error(
      `[KB v3] Inconsistencia: profile.technique_id="${profile.technique_id}" y requested="${techniqueId}"`,
    );
  }

  if (procedures.technique_id !== techniqueId) {
    throw new Error(
      `[KB v3] Inconsistencia: procedures.technique_id="${procedures.technique_id}" y requested="${techniqueId}"`,
    );
  }

  for (const procedure of procedures.procedures) {
    if (procedure.technique_id !== techniqueId) {
      throw new Error(
        `[KB v3] Inconsistencia en procedure "${procedure.procedure_id}": technique_id="${procedure.technique_id}"`,
      );
    }
  }
}

/** Lista de tecnicas actualmente migradas a v3. */
export function getV3Techniques(): V3TechniqueId[] {
  return [...V3_TECHNIQUES];
}

/** Indica si una tecnica tiene paquete v3 disponible. */
export function isTechniqueV3Ready(techniqueId: TechniqueId): techniqueId is V3TechniqueId {
  return isV3TechniqueId(techniqueId);
}

/**
 * Carga y valida profile + procedures de una tecnica v3.
 * Lanza error si la tecnica no esta migrada o si falla la validacion.
 */
export async function getTechniqueV3Package(
  techniqueId: TechniqueId,
): Promise<TechniqueV3Package> {
  if (!isV3TechniqueId(techniqueId)) {
    throw new Error(
      `[KB v3] La tecnica "${techniqueId}" no tiene paquete v3 migrado. Disponibles: ${V3_TECHNIQUES.join(', ')}`,
    );
  }

  const [profileModule, proceduresModule] = await Promise.all([
    V3_PROFILE_LOADERS[techniqueId](),
    V3_PROCEDURE_LOADERS[techniqueId](),
  ]);

  const parsedProfile = techniqueProfileSchema.parse(profileModule.default);
  const parsedProcedures = procedureCatalogSchema.parse(proceduresModule.default);

  assertTechniqueCoherence(techniqueId, parsedProfile, parsedProcedures);

  const profile = parsedProfile as TechniqueProfile;
  const procedures = parsedProcedures as ProcedureCatalog;

  return {
    techniqueId,
    profile,
    procedures,
    loadedAt: new Date().toISOString(),
  };
}

/** Precarga y valida multiples tecnicas v3 en paralelo. */
export async function preloadTechniqueV3Packages(
  techniques: V3TechniqueId[] = V3_TECHNIQUES,
): Promise<Record<V3TechniqueId, TechniqueV3Package>> {
  const entries = await Promise.all(
    techniques.map(async (techniqueId) => {
      const pkg = await getTechniqueV3Package(techniqueId);
      return [techniqueId, pkg] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<V3TechniqueId, TechniqueV3Package>;
}
