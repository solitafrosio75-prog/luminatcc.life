/**
 * interviewKnowledgeV3Service.ts
 *
 * Construye contexto breve de tecnica v3 para enriquecer prompts
 * de la primera entrevista sin acoplar UI a detalles de KB.
 */

import type { TechniqueId } from '../knowledge/types/technique.types';
import { getTechniqueV3Package } from '../knowledge/v3/resolver';

const THEME_TO_TECHNIQUE: Record<string, TechniqueId> = {
  ansiedad: 'exposicion',
  autoestima: 'rc',
  perdida: 'ac',
  relaciones: 'ac',
  trabajo: 'ac',
  familia: 'ac',
};

const packageCache = new Map<TechniqueId, Awaited<ReturnType<typeof getTechniqueV3Package>>>();

function chooseTechniqueFromThemes(themes: string[]): TechniqueId {
  for (const theme of themes) {
    const mapped = THEME_TO_TECHNIQUE[theme];
    if (mapped) return mapped;
  }
  return 'rc';
}

async function getCachedTechniquePackage(techniqueId: TechniqueId) {
  const cached = packageCache.get(techniqueId);
  if (cached) return cached;

  const loaded = await getTechniqueV3Package(techniqueId);
  packageCache.set(techniqueId, loaded);
  return loaded;
}

/**
 * Genera una guia corta para prompt clinico de entrevista.
 * Si hay error de carga, devuelve string vacio para fallback seguro.
 */
export async function buildInterviewTechniqueContext(themes: string[]): Promise<string> {
  try {
    const techniqueId = chooseTechniqueFromThemes(themes);
    const pkg = await getCachedTechniquePackage(techniqueId);

    const procedures = pkg.procedures.procedures
      .slice(0, 3)
      .map((p) => `- ${p.nombre}: ${p.clinical_goal}`)
      .join('\n');

    return [
      `Tecnica sugerida por narrativa: ${pkg.profile.nombre} (${techniqueId}).`,
      `Problemas diana relevantes: ${pkg.profile.problemas_diana.slice(0, 4).join(', ')}.`,
      'Procedimientos iniciales sugeridos:',
      procedures,
      `Alertas de seguridad base: ${pkg.profile.banderas_seguridad.slice(0, 3).join(', ')}.`,
    ].join('\n');
  } catch {
    return '';
  }
}
