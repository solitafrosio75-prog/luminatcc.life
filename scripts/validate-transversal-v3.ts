/**
 * validate-transversal-v3.ts — Validacion del paquete transversal_regulacion v3
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { techniqueProfileSchema } from '../src/knowledge/types/schemas.profile';
import { procedureCatalogSchema } from '../src/knowledge/types/schemas.procedures';

const __dirname = dirname(fileURLToPath(import.meta.url));
const profilePath = resolve(__dirname, '../src/knowledge/transversal_regulacion/profile/transversal_regulacion.profile.json');
const proceduresPath = resolve(__dirname, '../src/knowledge/transversal_regulacion/procedures/transversal_regulacion.procedures.json');

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

let failed = 0;

try {
  const profile = techniqueProfileSchema.parse(parseJson(profilePath));
  if (profile.technique_id !== 'transversal_regulacion') {
    throw new Error('technique_id invalido en profile');
  }
  console.log('✅ transversal_regulacion.profile.json');
} catch (err: any) {
  failed++;
  console.log('❌ transversal_regulacion.profile.json');
  console.log(err?.issues ?? err?.message ?? err);
}

try {
  const procedures = procedureCatalogSchema.parse(parseJson(proceduresPath));
  if (procedures.technique_id !== 'transversal_regulacion') {
    throw new Error('technique_id invalido en procedures');
  }
  console.log('✅ transversal_regulacion.procedures.json');
} catch (err: any) {
  failed++;
  console.log('❌ transversal_regulacion.procedures.json');
  console.log(err?.issues ?? err?.message ?? err);
}

if (failed > 0) {
  console.log(`\nTransversal v3 validation failed: ${failed} archivo(s) con error`);
  process.exit(1);
}

console.log('\nTransversal v3 validation: 2/2 ok');
