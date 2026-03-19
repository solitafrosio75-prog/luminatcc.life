/**
 * registry.ts — Registry central de todas las técnicas terapéuticas
 *
 * Para agregar una nueva técnica:
 * 1. Crear su directorio en src/knowledge/<id>/
 * 2. Crear <id>.manifest.ts con TechniqueManifest
 * 3. Importar y registrar aquí
 */

import type { TechniqueId, TechniqueManifest } from './types/technique.types';
import type { SharedArea } from './types/technique.types';

// ============================================================================
// Registry de técnicas
// ============================================================================

const TECHNIQUE_REGISTRY = new Map<TechniqueId, TechniqueManifest>();

export function registerTechnique(manifest: TechniqueManifest): void {
  if (TECHNIQUE_REGISTRY.has(manifest.id)) {
    console.warn(`[KB Registry] Técnica "${manifest.id}" ya registrada, reemplazando.`);
  }
  TECHNIQUE_REGISTRY.set(manifest.id, manifest);
}

export function getTechniqueManifest(id: TechniqueId): TechniqueManifest | undefined {
  return TECHNIQUE_REGISTRY.get(id);
}

export function getRegisteredTechniques(): TechniqueManifest[] {
  return Array.from(TECHNIQUE_REGISTRY.values());
}

export function getCoreTechniques(): TechniqueManifest[] {
  return ['ac', 'rc']
    .map((id) => TECHNIQUE_REGISTRY.get(id as TechniqueId))
    .filter((t): t is TechniqueManifest => Boolean(t));
}

// ============================================================================
// Registry de áreas transversales (shared)
// ============================================================================

type SharedManifest = Record<SharedArea, () => Promise<{ default: unknown }>>;

let sharedManifest: SharedManifest | null = null;

export function registerSharedManifest(manifest: SharedManifest): void {
  sharedManifest = manifest;
}

export function getSharedManifest(): SharedManifest {
  if (!sharedManifest) {
    throw new Error('[KB Registry] Shared manifest no registrado. ¿Se importó shared/index.ts?');
  }
  return sharedManifest;
}

// ============================================================================
// Auto-registro — ver registry-init.ts
// ============================================================================
// NOTA: Los imports de side-effect (import './ac', etc.) se movieron a
// registry-init.ts para evitar TDZ circular. Importar registry-init.ts
// desde main.tsx para que las técnicas se registren al arrancar la app.
