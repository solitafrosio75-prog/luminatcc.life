/**
 * validate-act-v3.ts -- Validacion del paquete v3 (ACT)
 *
 * Ejecutar:
 *   npx tsx scripts/validate-act-v3.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { techniqueProfileSchema } from '../src/knowledge/types/schemas.profile';
import { procedureCatalogSchema } from '../src/knowledge/types/schemas.procedures';

const __dirname = dirname(fileURLToPath(import.meta.url));
const profilePath = resolve(__dirname, '../src/knowledge/act/profile/act.profile.json');
const proceduresPath = resolve(__dirname, '../src/knowledge/act/procedures/act.procedures.json');

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

let failed = 0;

try {
  techniqueProfileSchema.parse(parseJson(profilePath));
  console.log('✅ act.profile.json');
} catch (err: any) {
  failed++;
  console.log('❌ act.profile.json');
  console.log(err?.issues ?? err);
}

try {
  procedureCatalogSchema.parse(parseJson(proceduresPath));
  console.log('✅ act.procedures.json');
} catch (err: any) {
  failed++;
  console.log('❌ act.procedures.json');
  console.log(err?.issues ?? err);
}

if (failed > 0) {
  console.log(`\nACT v3 validation failed: ${failed} archivo(s) con error`);
  process.exit(1);
}

console.log('\nACT v3 validation: 2/2 ok');
