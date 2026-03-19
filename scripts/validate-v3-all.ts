/**
 * validate-v3-all.ts — Validacion agregada de todos los paquetes v3 disponibles
 *
 * Ejecutar:
 *   npx tsx scripts/validate-v3-all.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { techniqueProfileSchema } from '../src/knowledge/types/schemas.profile';
import { procedureCatalogSchema } from '../src/knowledge/types/schemas.procedures';

const __dirname = dirname(fileURLToPath(import.meta.url));

type V3Pair = {
  label: string;
  profile: string;
  procedures: string;
};

const targets: V3Pair[] = [
  {
    label: 'RC',
    profile: '../src/knowledge/rc/profile/rc.profile.json',
    procedures: '../src/knowledge/rc/procedures/rc.procedures.json',
  },
  {
    label: 'AC',
    profile: '../src/knowledge/ac/profile/ac.profile.json',
    procedures: '../src/knowledge/ac/procedures/ac.procedures.json',
  },
  {
    label: 'DS',
    profile: '../src/knowledge/ds/profile/ds.profile.json',
    procedures: '../src/knowledge/ds/procedures/ds.procedures.json',
  },
  {
    label: 'EXPOSICION',
    profile: '../src/knowledge/exposicion/profile/exposicion.profile.json',
    procedures: '../src/knowledge/exposicion/procedures/exposicion.procedures.json',
  },
  {
    label: 'MC',
    profile: '../src/knowledge/modificacion_conducta/profile/mc.profile.json',
    procedures: '../src/knowledge/modificacion_conducta/procedures/mc.procedures.json',
  },
  {
    label: 'DC',
    profile: '../src/knowledge/dialectico_conductual/profile/dc.profile.json',
    procedures: '../src/knowledge/dialectico_conductual/procedures/dc.procedures.json',
  },
  {
    label: 'TREC',
    profile: '../src/knowledge/trec/profile/trec.profile.json',
    procedures: '../src/knowledge/trec/procedures/trec.procedures.json',
  },
  {
    label: 'ACT',
    profile: '../src/knowledge/act/profile/act.profile.json',
    procedures: '../src/knowledge/act/procedures/act.procedures.json',
  },
  {
    label: 'MINDFULNESS',
    profile: '../src/knowledge/mindfulness/profile/mindfulness.profile.json',
    procedures: '../src/knowledge/mindfulness/procedures/mindfulness.procedures.json',
  },
  {
    label: 'TRANSVERSAL_REGULACION',
    profile: '../src/knowledge/transversal_regulacion/profile/transversal_regulacion.profile.json',
    procedures: '../src/knowledge/transversal_regulacion/procedures/transversal_regulacion.procedures.json',
  },
];

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

let failed = 0;
let passed = 0;

for (const target of targets) {
  const profilePath = resolve(__dirname, target.profile);
  const proceduresPath = resolve(__dirname, target.procedures);

  try {
    techniqueProfileSchema.parse(parseJson(profilePath));
    console.log(`✅ ${target.label} profile`);
    passed++;
  } catch (err: any) {
    failed++;
    console.log(`❌ ${target.label} profile`);
    console.log(err?.issues ?? err);
  }

  try {
    procedureCatalogSchema.parse(parseJson(proceduresPath));
    console.log(`✅ ${target.label} procedures`);
    passed++;
  } catch (err: any) {
    failed++;
    console.log(`❌ ${target.label} procedures`);
    console.log(err?.issues ?? err);
  }
}

console.log(`\nV3 validation summary: ${passed}/${passed + failed} checks ok`);

if (failed > 0) {
  process.exit(1);
}
