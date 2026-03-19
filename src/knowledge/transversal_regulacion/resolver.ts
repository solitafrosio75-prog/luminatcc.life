/**
 * resolver.ts — Carga y validacion del paquete transversal_regulacion v3
 */

import { techniqueProfileSchema } from '../types/schemas.profile';
import { procedureCatalogSchema } from '../types/schemas.procedures';

type ParsedProfile = ReturnType<typeof techniqueProfileSchema.parse>;
type ParsedCatalog = ReturnType<typeof procedureCatalogSchema.parse>;

export interface TransversalRegulacionPackage {
  profile: ParsedProfile;
  procedures: ParsedCatalog;
}

let cache: TransversalRegulacionPackage | null = null;

export async function getTransversalRegulacionPackage(): Promise<TransversalRegulacionPackage> {
  if (cache) return cache;

  const [profileModule, proceduresModule] = await Promise.all([
    import('./profile/transversal_regulacion.profile.json'),
    import('./procedures/transversal_regulacion.procedures.json'),
  ]);

  const profile = techniqueProfileSchema.parse(profileModule.default);
  const procedures = procedureCatalogSchema.parse(proceduresModule.default);

  if (profile.technique_id !== 'transversal_regulacion') {
    throw new Error('[KB v3] profile transversal_regulacion con technique_id invalido');
  }

  if (procedures.technique_id !== 'transversal_regulacion') {
    throw new Error('[KB v3] procedures transversal_regulacion con technique_id invalido');
  }

  cache = { profile, procedures };
  return cache;
}
