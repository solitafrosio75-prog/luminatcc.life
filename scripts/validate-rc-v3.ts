/**
 * validate-rc-v3.ts — Validacion del primer paquete v3 (RC)
 *
 * Ejecutar:
 *   npx tsx scripts/validate-rc-v3.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { techniqueProfileSchema } from '../src/knowledge/types/schemas.profile';
import { procedureCatalogSchema } from '../src/knowledge/types/schemas.procedures';

const __dirname = dirname(fileURLToPath(import.meta.url));
const profilePath = resolve(__dirname, '../src/knowledge/rc/profile/rc.profile.json');
const proceduresPath = resolve(__dirname, '../src/knowledge/rc/procedures/rc.procedures.json');

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

let failed = 0;

try {
  techniqueProfileSchema.parse(parseJson(profilePath));
  console.log('✅ rc.profile.json');
} catch (err: any) {
  failed++;
  console.log('❌ rc.profile.json');
  console.log(err?.issues ?? err);
}

try {
  procedureCatalogSchema.parse(parseJson(proceduresPath));
  console.log('✅ rc.procedures.json');
} catch (err: any) {
  failed++;
  console.log('❌ rc.procedures.json');
  console.log(err?.issues ?? err);
}

if (failed > 0) {
  console.log(`\nRC v3 validation failed: ${failed} archivo(s) con error`);
  process.exit(1);
}

console.log('\nRC v3 validation: 2/2 ok');
