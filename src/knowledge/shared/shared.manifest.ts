/**
 * shared.manifest.ts — Manifest de conocimiento transversal
 *
 * Inventarios generales, protocolo de crisis, habilidades de entrevista.
 * Estos datos se comparten entre todas las técnicas.
 */

import { SharedArea } from '../types/technique.types';

export const SHARED_MANIFEST: Record<SharedArea, () => Promise<{ default: unknown }>> = {
  [SharedArea.HABILIDADES_ENTREVISTA]: () => import('./data/habilidades_entrevista.json'),
  [SharedArea.PROTOCOLO_CRISIS]:       () => import('./data/protocolo_crisis.json'),
  [SharedArea.INVENTARIOS_GENERALES]:  () => import('./data/inventarios_generales.json'),
};
