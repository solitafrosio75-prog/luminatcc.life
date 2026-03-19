/**
 * audit-knowledge-full.ts -- Auditoria integral de knowledge
 *
 * Cubre, en este orden:
 * 1) TypeScript compile
 * 2) v2 legacy + shared
 * 3) v3 package integrity
 * 4) v3 resolver
 * 5) engine->v3 bridge mappings
 *
 * Ejecutar:
 *   npx tsx scripts/audit-knowledge-full.ts
 */

import { spawnSync } from 'node:child_process';

type Step = {
  id: string;
  label: string;
  command: string;
  args: string[];
};

type StepResult = {
  step: Step;
  ok: boolean;
  exitCode: number;
};

const steps: Step[] = [
  {
    id: 'compile',
    label: 'TypeScript compile',
    command: 'npx',
    args: ['tsc', '--noEmit'],
  },
  {
    id: 'v2-legacy',
    label: 'Knowledge v2 legacy + shared',
    command: 'npx',
    args: ['tsx', 'scripts/validate-knowledge-all.ts'],
  },
  {
    id: 'v3-packages',
    label: 'Knowledge v3 packages',
    command: 'npx',
    args: ['tsx', 'scripts/validate-v3-all.ts'],
  },
  {
    id: 'v3-resolver',
    label: 'Knowledge v3 resolver',
    command: 'npx',
    args: ['tsx', 'scripts/validate-v3-resolver.ts'],
  },
  {
    id: 'engine-bridge',
    label: 'Engine -> v3 bridge',
    command: 'npx',
    args: ['tsx', 'scripts/validate-tccengine-v3-bridge.ts'],
  },
];

function runStep(step: Step): StepResult {
  console.log(`\n=== ${step.label} ===`);
  console.log(`$ ${step.command} ${step.args.join(' ')}`);

  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: true,
  });

  const exitCode = result.status ?? 1;
  const ok = exitCode === 0;

  console.log(ok ? `✅ ${step.label}` : `❌ ${step.label} (exit ${exitCode})`);

  return { step, ok, exitCode };
}

function printSummary(results: StepResult[]): void {
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;

  console.log('\n================ AUDIT SUMMARY ================');
  for (const r of results) {
    const marker = r.ok ? 'PASS' : 'FAIL';
    console.log(`${marker.padEnd(5)} | ${r.step.id.padEnd(12)} | ${r.step.label}`);
  }
  console.log(`\nTOTAL: ${passed}/${total} checks passed`);
  console.log('===============================================\n');
}

function main(): void {
  console.log('Starting full knowledge audit...');

  const results: StepResult[] = [];
  for (const step of steps) {
    const stepResult = runStep(step);
    results.push(stepResult);

    if (!stepResult.ok) {
      printSummary(results);
      process.exit(stepResult.exitCode || 1);
    }
  }

  printSummary(results);
  process.exit(0);
}

main();
