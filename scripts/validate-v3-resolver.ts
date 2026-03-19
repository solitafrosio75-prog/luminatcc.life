/**
 * validate-v3-resolver.ts — Smoke test de la API unificada v3
 *
 * Ejecutar:
 *   npx tsx scripts/validate-v3-resolver.ts
 */

import {
  getTechniqueV3Package,
  getV3Techniques,
} from '../src/knowledge/v3/resolver';

async function run(): Promise<void> {
  const techniques = getV3Techniques();

  let failed = 0;
  let passed = 0;

  for (const techniqueId of techniques) {
    try {
      const pkg = await getTechniqueV3Package(techniqueId);
      const proceduresCount = pkg.procedures.procedures.length;
      console.log(`✅ ${techniqueId}: profile + ${proceduresCount} procedures`);
      passed++;
    } catch (err: any) {
      failed++;
      console.log(`❌ ${techniqueId}`);
      console.log(err?.message ?? err);
    }
  }

  console.log(`\nV3 resolver summary: ${passed}/${passed + failed} tecnicas ok`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal resolver error:', err);
  process.exit(1);
});
