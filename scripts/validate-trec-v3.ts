/**
 * validate-trec-v3.ts -- Validacion del paquete v3 (TREC)
 *
 * Ejecutar:
 *   npx tsx scripts/validate-trec-v3.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { techniqueProfileSchema } from '../src/knowledge/types/schemas.profile';
import { procedureCatalogSchema } from '../src/knowledge/types/schemas.procedures';

const __dirname = dirname(fileURLToPath(import.meta.url));
const profilePath = resolve(__dirname, '../src/knowledge/trec/profile/trec.profile.json');
const proceduresPath = resolve(__dirname, '../src/knowledge/trec/procedures/trec.procedures.json');

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

let failed = 0;

try {
  techniqueProfileSchema.parse(parseJson(profilePath));
  console.log('✅ trec.profile.json');
} catch (err: any) {
  failed++;
  console.log('❌ trec.profile.json');
  console.log(err?.issues ?? err);
}

try {
  procedureCatalogSchema.parse(parseJson(proceduresPath));
  console.log('✅ trec.procedures.json');
} catch (err: any) {
  failed++;
  console.log('❌ trec.procedures.json');
  console.log(err?.issues ?? err);
}

if (failed > 0) {
  console.log(`\nTREC v3 validation failed: ${failed} archivo(s) con error`);
  process.exit(1);
}

console.log('\nTREC v3 validation: 2/2 ok');
