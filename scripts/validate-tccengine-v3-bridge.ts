/**
 * validate-tccengine-v3-bridge.ts
 *
 * Smoke test del puente TCCEngine -> Knowledge v3.
 */

import { getV3GuidanceForEngineTechnique } from '../src/services/tccEngineKnowledgeV3Bridge';

async function run(): Promise<void> {
  const techniques = [
    'behavioral_activation',
    'activity_scheduling',
    'micro_tasks',
    'momentum_building',
    'cognitive_restructuring',
    'gradual_exposure',
    'functional_analysis',
    'problem_solving',
    'relaxation',
    'mindfulness_observation',
    'mindful_breathing',
    'body_scan',
    'urge_surfing',
    'present_moment_anchor',
    'worry_time',
    'self_compassion',
    'chain_analysis',
    'distress_tolerance_tipp',
    'emotion_regulation_opposite_action',
    'interpersonal_effectiveness_dear_man',
    'cognitive_defusion',
    'acceptance_willingness',
    'values_clarification',
    'committed_action',
    'self_as_context',
  ];

  let ok = 0;

  for (const technique of techniques) {
    const guidance = await getV3GuidanceForEngineTechnique(technique);
    if (guidance) {
      console.log(`✅ ${technique} -> ${guidance.v3TechniqueId} (${guidance.procedureHints.length} procedures)`);
      ok++;
    } else {
      console.log(`ℹ️ ${technique} -> no v3 mapping`);
    }
  }

  console.log(`\nBridge checks completed. Mapped: ${ok}/${techniques.length}`);
}

run().catch((err) => {
  console.error('Bridge validation error:', err);
  process.exit(1);
});
