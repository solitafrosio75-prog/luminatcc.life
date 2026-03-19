// ============================================================================
// CaseFormulationSynthesizer.ts - Construye la formulacion del caso
// ============================================================================
//
// Este es el corazon analitico del sistema. Toma N secuencias
// funcionales acumuladas y las sintetiza en:
// 1. Mapa de conductas (que hace el usuario)
// 2. Cadenas consolidadas (patrones A->B->C recurrentes)
// 3. Perfil cognitivo (distorsiones predominantes)
// 4. Ciclo de mantenimiento (que sostiene el problema)
// 5. Progreso vs linea base
// 6. Dice vs Hace
// ============================================================================

import {
  FunctionalSequence,
  ConsolidatedChain,
  ChainInteraction,
  IntegratedCaseFormulation,
  ProblemBehaviorEntry,
  TargetBehaviorEntry,
  MaintainingFactor,
  ProtectiveFactor,
  type BehaviorType,
  type BehaviorFunction,
  type CognitivePattern,
  type Trend,
  type ReinforcementType,
  type TCCTechnique,
} from './sequenceTypes';

import { areSequencesSimilar } from './SequenceEnricher';

export interface BaselineData {
  completionRate: number;
  avoidanceRate: number;
  averageMood: number;
  cycleStrength: number;
}

export interface DeclaredProfile {
  mainDifficulty: string;
  reportedEnergyPeakTime: string;
  typicalAntecedents: string[];
  avoidanceBehaviors: string[];
  postAvoidanceFeelings: string[];
  generalization: string;
}

export function synthesizeFormulation(
  userId: string,
  sequences: FunctionalSequence[],
  previousVersion: number,
  baseline?: BaselineData,
  declaredProfile?: DeclaredProfile
): IntegratedCaseFormulation {
  const userSequences = sequences.filter((s) => s.userId === userId);
  if (userSequences.length === 0) return createEmptyFormulation(userId, previousVersion + 1);

  const behaviorMap = buildBehaviorMap(userSequences);
  const clusters = groupSequencesIntoClusters(userSequences);
  const chains = buildConsolidatedChains(clusters);
  const chainInteractions = analyzeChainInteractions(chains, userSequences);
  const cognitiveProfile = buildCognitiveProfile(userSequences);
  const maintenanceCycle = synthesizeMaintenanceCycle(chains, cognitiveProfile, userSequences);
  const progress = calculateProgress(userSequences, chains, baseline);
  const declaredVsDetected = declaredProfile
    ? compareDeclaredVsDetected(userSequences, declaredProfile)
    : { comparisons: [] };

  return {
    userId,
    version: previousVersion + 1,
    generatedAt: new Date(),
    sequencesProcessed: userSequences.length,
    totalSequences: userSequences.length,
    behaviorMap,
    functionalRelationships: { consolidatedChains: chains, chainInteractions },
    cognitiveProfile,
    maintenanceCycle,
    progress,
    declaredVsDetected,
  };
}

function buildBehaviorMap(sequences: FunctionalSequence[]): {
  problemBehaviors: ProblemBehaviorEntry[];
  targetBehaviors: TargetBehaviorEntry[];
} {
  const problems = sequences.filter((s) => s.behavior.valence === 'problem');
  const targets = sequences.filter((s) => s.behavior.valence === 'target');

  const problemBehaviors: ProblemBehaviorEntry[] = groupByBehaviorType(problems).map((group) => {
    const contexts = [
      ...new Set(
        group.sequences
          .map((s) => {
            const parts: string[] = [];
            if (s.behavior.context?.taskRoom) parts.push(s.behavior.context.taskRoom);
            if (s.antecedent.timeOfDay) parts.push(s.antecedent.timeOfDay);
            return parts.join(' ');
          })
          .filter(Boolean)
      ),
    ].slice(0, 5);

    const intensities = group.sequences
      .map((s) => s.behavior.topography?.intensity)
      .filter((i): i is 1 | 2 | 3 | 4 | 5 => i != null);

    return {
      id: `problem_${group.type}`,
      description: describeBehaviorType(group.type, 'problem'),
      type: group.type,
      frequency: { current: `${group.sequences.length} veces`, trend: calculateTrendFromSequences(group.sequences) },
      sequenceCount: group.sequences.length,
      averageIntensity:
        intensities.length > 0
          ? intensities.reduce((a, b) => a + (b ?? 0), 0) / intensities.length
          : 3,
      contexts,
    };
  });

  const targetBehaviors: TargetBehaviorEntry[] = groupByBehaviorType(targets).map((group) => {
    const bestContexts = [
      ...new Set(
        group.sequences
          .filter((s) => {
            const immediate = getImmediateObject(s);
            return Boolean(
              immediate?.emotionalChange &&
                immediate.emotionalChange.to != null &&
                immediate.emotionalChange.from != null &&
                immediate.emotionalChange.to > immediate.emotionalChange.from
            );
          })
          .map((s) => {
            const parts: string[] = [];
            if (s.behavior.context?.taskRoom) parts.push(s.behavior.context.taskRoom);
            if (s.antecedent.timeOfDay) parts.push(s.antecedent.timeOfDay);
            return parts.join(' ');
          })
          .filter(Boolean)
      ),
    ].slice(0, 5);

    return {
      id: `target_${group.type}`,
      description: describeBehaviorType(group.type, 'target'),
      type: group.type,
      frequency: { current: `${group.sequences.length} veces`, trend: calculateTrendFromSequences(group.sequences) },
      sequenceCount: group.sequences.length,
      bestContexts,
    };
  });

  return {
    problemBehaviors: problemBehaviors.sort((a, b) => b.sequenceCount - a.sequenceCount),
    targetBehaviors: targetBehaviors.sort((a, b) => b.sequenceCount - a.sequenceCount),
  };
}

interface SequenceCluster {
  id: string;
  sequences: FunctionalSequence[];
  centroid: {
    behaviorType: BehaviorType;
    timeSlot: string;
    emotionalState?: string;
    taskCategory?: string;
  };
}

function groupSequencesIntoClusters(sequences: FunctionalSequence[]): SequenceCluster[] {
  const clusters: SequenceCluster[] = [];
  let clusterCounter = 0;

  const sorted = [...sequences].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const seq of sorted) {
    let bestCluster: SequenceCluster | null = null;
    let bestMatchCount = 0;

    for (const cluster of clusters) {
      const matchCount = cluster.sequences.filter((existing) => areSequencesSimilar(existing, seq)).length;
      if (matchCount > bestMatchCount && matchCount >= cluster.sequences.length * 0.5) {
        bestCluster = cluster;
        bestMatchCount = matchCount;
      }
    }

    if (bestCluster) {
      bestCluster.sequences.push(seq);
    } else {
      clusterCounter++;
      clusters.push({
        id: `cluster_${clusterCounter}`,
        sequences: [seq],
        centroid: {
          behaviorType: toBehaviorType(seq.behavior.type),
          timeSlot: seq.antecedent.timeOfDay || 'afternoon',
          emotionalState: seq.antecedent.internalState?.emotionalState,
          taskCategory: seq.behavior.context?.taskCategory,
        },
      });
    }
  }

  return clusters;
}

function buildConsolidatedChains(clusters: SequenceCluster[]): ConsolidatedChain[] {
  return clusters
    .filter((c) => c.sequences.length >= 3)
    .map((cluster) => {
      const seqs = cluster.sequences;
      const now = new Date();

      const antecedentMap = new Map<string, { count: number; source: string }>();
      for (const seq of seqs) {
        for (const trigger of seq.antecedent.triggers || []) {
          const key = trigger.description;
          const existing = antecedentMap.get(key);
          if (existing) existing.count++;
          else antecedentMap.set(key, { count: 1, source: trigger.source });
        }
        if (seq.antecedent.internalState?.emotionalState) {
          const key = `Estado: ${seq.antecedent.internalState.emotionalState}`;
          const existing = antecedentMap.get(key);
          if (existing) existing.count++;
          else antecedentMap.set(key, { count: 1, source: 'detected' });
        }
      }

      const typicalAntecedents = [...antecedentMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([desc, data]) => ({ description: desc, frequency: data.count, source: data.source as any }));

      const functionCounts = new Map<BehaviorFunction, number>();
      for (const seq of seqs) {
        const fn = seq.behavior.detectedFunction?.primary;
        if (fn) functionCounts.set(fn, (functionCounts.get(fn) || 0) + 1);
      }
      const topFunction = [...functionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'escape_discomfort';

      const reinforcementCounts = new Map<string, number>();
      for (const seq of seqs) {
        const rt = seq.consequence.reinforcement?.type;
        if (rt) reinforcementCounts.set(rt, (reinforcementCounts.get(rt) || 0) + 1);
      }
      const topReinforcement = (
        [...reinforcementCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'negative_reinforcement'
      ) as ReinforcementType;

      const consequenceDescriptions = seqs
        .map((s) => getImmediateObject(s)?.description)
        .filter((d): d is string => Boolean(d));
      const immediateConsequence = consequenceDescriptions[0] || 'No determinada';

      const trend = calculateTrendFromSequences(seqs);
      const reliefFreq = seqs.filter((s) => Boolean(getImmediateObject(s)?.relief)).length / seqs.length;
      const strengthScore = Math.round(
        seqs.length * 5 + reliefFreq * 30 + (trend === 'worsening' ? 20 : trend === 'stable' ? 10 : 0)
      );

      return {
        userId: seqs[0].userId,
        createdAt: now,
        updatedAt: now,
        name: generateChainName(cluster.centroid, topFunction),
        typicalAntecedents,
        typicalBehavior: {
          description: describeBehaviorType(cluster.centroid.behaviorType, 'problem'),
          type: cluster.centroid.behaviorType,
          function: topFunction,
        },
        typicalConsequences: {
          immediate: immediateConsequence,
          reinforcementType: topReinforcement,
          longTermEffect: inferLongTermEffect(topReinforcement, trend),
        },
        metrics: {
          occurrences: seqs.length,
          firstSeen: new Date(seqs[0].timestamp),
          lastSeen: new Date(seqs[seqs.length - 1].timestamp),
          trend,
          strengthScore: Math.min(100, strengthScore),
        },
        breakingPoints: identifyBreakingPoints(seqs),
        sequenceIds: seqs.map((s) => s.id).filter((id): id is number => typeof id === 'number'),
        averageConfidence: seqs.reduce((sum, s) => sum + s.confidence.score, 0) / seqs.length,
      } satisfies ConsolidatedChain;
    })
    .sort((a, b) => b.metrics.strengthScore - a.metrics.strengthScore);
}

function analyzeChainInteractions(chains: ConsolidatedChain[], allSequences: FunctionalSequence[]): ChainInteraction[] {
  const interactions: ChainInteraction[] = [];
  const hourMs = 60 * 60 * 1000;

  for (let i = 0; i < chains.length; i++) {
    for (let j = i + 1; j < chains.length; j++) {
      const chainA = chains[i];
      const chainB = chains[j];
      let aBeforeB = 0;
      let cooccur = 0;

      for (const seqA of allSequences.filter((s) => chainA.sequenceIds.includes(s.id || -1))) {
        for (const seqB of allSequences.filter((s) => chainB.sequenceIds.includes(s.id || -1))) {
          const diff = new Date(seqB.timestamp).getTime() - new Date(seqA.timestamp).getTime();
          if (diff > 0 && diff < 3 * hourMs) aBeforeB++;
          else if (Math.abs(diff) < hourMs) cooccur++;
        }
      }

      const totalPairs = Math.min(chainA.sequenceIds.length, chainB.sequenceIds.length);
      if (totalPairs < 3) continue;

      if (aBeforeB > totalPairs * 0.3) {
        interactions.push({
          fromChainId: chainA.id?.toString() || chainA.name || 'chain_a',
          toChainId: chainB.id?.toString() || chainB.name || 'chain_b',
          relationship: 'triggers',
          description: `"${chainA.name || 'Cadena A'}" frecuentemente precede a "${chainB.name || 'Cadena B'}"`,
          confidence: Math.min(90, Math.round((aBeforeB / totalPairs) * 100)),
        });
      }
      if (cooccur > totalPairs * 0.3) {
        interactions.push({
          fromChainId: chainA.id?.toString() || chainA.name || 'chain_a',
          toChainId: chainB.id?.toString() || chainB.name || 'chain_b',
          relationship: 'cooccurs',
          description: `"${chainA.name || 'Cadena A'}" y "${chainB.name || 'Cadena B'}" ocurren juntas`,
          confidence: Math.min(90, Math.round((cooccur / totalPairs) * 100)),
        });
      }
    }
  }
  return interactions;
}

function buildCognitiveProfile(sequences: FunctionalSequence[]) {
  const patternCounts = new Map<CognitivePattern, { count: number; linkedChains: Set<string>; reframes: number }>();
  for (const seq of sequences) {
    for (const pattern of seq.antecedent.cognitivePatterns || []) {
      const existing = patternCounts.get(pattern);
      if (existing) {
        existing.count++;
        if (seq.cycleAnalysis?.belongsToPatternId) existing.linkedChains.add(seq.cycleAnalysis.belongsToPatternId);
        if (seq.source.type === 'thought_record' && getImmediateObject(seq)?.emotionalChange?.relief) existing.reframes++;
      } else {
        patternCounts.set(pattern, { count: 1, linkedChains: new Set(), reframes: 0 });
      }
    }
  }

  const predominantPatterns = [...patternCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      linkedChainIds: [...data.linkedChains],
      successfulReframes: data.reframes,
      trend: 'stable' as Trend,
    }));

  return { predominantPatterns, inferredBeliefs: inferBeliefsFromPatterns(predominantPatterns) };
}

function inferBeliefsFromPatterns(
  patterns: Array<{ pattern: CognitivePattern; frequency: number }>
): Array<{ belief: string; supportingPatterns: CognitivePattern[]; confidence: number }> {
  const beliefs: Array<{ belief: string; supportingPatterns: CognitivePattern[]; confidence: number }> = [];
  const patternSet = new Set(patterns.map((p) => p.pattern));
  if (patternSet.has('all_or_nothing') && patternSet.has('should_statements')) {
    beliefs.push({ belief: 'Si no lo hago perfecto, no vale la pena hacerlo', supportingPatterns: ['all_or_nothing', 'should_statements'], confidence: 60 });
  }
  if (patternSet.has('fortune_telling') && patternSet.has('magnification')) {
    beliefs.push({ belief: 'Las cosas siempre van a salir mal, es demasiado', supportingPatterns: ['fortune_telling', 'magnification'], confidence: 55 });
  }
  if (patternSet.has('labeling') || patternSet.has('personalization')) {
    beliefs.push({ belief: 'El problema soy yo, no la situacion', supportingPatterns: ['labeling', 'personalization'].filter((p) => patternSet.has(p as CognitivePattern)) as CognitivePattern[], confidence: 50 });
  }
  if (patternSet.has('emotional_reasoning')) {
    beliefs.push({ belief: 'Si me siento incapaz, es porque soy incapaz', supportingPatterns: ['emotional_reasoning'], confidence: 45 });
  }
  return beliefs;
}

function synthesizeMaintenanceCycle(
  chains: ConsolidatedChain[],
  cognitiveProfile: ReturnType<typeof buildCognitiveProfile>,
  sequences: FunctionalSequence[]
) {
  const problemChains = chains.filter(
    (c) => c.typicalBehavior?.type !== 'completion' && c.typicalBehavior?.type !== 'approach'
  );
  const maintainingFactors: MaintainingFactor[] = [];

  const avoidanceChains = problemChains.filter(
    (c) => c.typicalConsequences?.reinforcementType === 'negative_reinforcement'
  );
  if (avoidanceChains.length > 0) {
    maintainingFactors.push({
      factor: 'Evitacion reforzada por alivio inmediato',
      type: 'behavioral',
      weight: Math.min(
        100,
        avoidanceChains.reduce((sum, c) => sum + (c.metrics?.strengthScore ?? 0), 0) /
          avoidanceChains.length
      ),
      addressedBy: 'exposure_gradual',
    });
  }
  if (cognitiveProfile.predominantPatterns.length > 0) {
    const topPattern = cognitiveProfile.predominantPatterns[0];
    maintainingFactors.push({
      factor: `Pensamiento ${describePattern(topPattern.pattern)} recurrente`,
      type: 'cognitive',
      weight: Math.min(90, topPattern.frequency * 10),
      addressedBy: 'cognitive_restructuring',
    });
  }
  const cascadeSeqs = sequences.filter((s) => s.consequence.shortTerm?.cascadeEffect);
  if (cascadeSeqs.length > 3) {
    maintainingFactors.push({
      factor: 'Efecto cascada: una evitacion genera mas evitacion',
      type: 'emotional',
      weight: Math.min(80, cascadeSeqs.length * 5),
      addressedBy: 'behavioral_activation',
    });
  }

  const protectiveFactors: ProtectiveFactor[] = [];
  const targetSeqs = sequences.filter((s) => s.behavior.valence === 'target');
  if (targetSeqs.length > 0) {
    protectiveFactors.push({
      factor: `${targetSeqs.length} conductas de afrontamiento registradas`,
      source: 'behavioral_data',
      impact: Math.min(80, targetSeqs.length * 3),
    });
  }

  const strength = maintainingFactors.length
    ? Math.round(maintainingFactors.reduce((sum, f) => sum + f.weight, 0) / maintainingFactors.length)
    : 0;

  return {
    narrative: buildMaintenanceNarrative(maintainingFactors, protectiveFactors),
    strength,
    trend: calculateOverallTrend(sequences),
    maintainingFactors: maintainingFactors.sort((a, b) => b.weight - a.weight),
    protectiveFactors,
  };
}

function calculateProgress(sequences: FunctionalSequence[], chains: ConsolidatedChain[], baseline?: BaselineData) {
  const totalSeqs = sequences.length;
  const targetSeqs = sequences.filter((s) => s.behavior.valence === 'target');
  const problemSeqs = sequences.filter((s) => s.behavior.valence === 'problem');
  const currentCompletionRate = totalSeqs > 0 ? targetSeqs.length / totalSeqs : 0;
  const currentAvoidanceRate = totalSeqs > 0 ? problemSeqs.length / totalSeqs : 0;
  const moodValues = sequences
    .map((s) => s.antecedent.internalState?.reportedMood)
    .filter((m): m is 1 | 2 | 3 | 4 | 5 => m != null);
  const currentAvgMood = moodValues.length
    ? moodValues.reduce((a, b) => a + (b ?? 0), 0) / moodValues.length
    : 3;
  const avgCycleStrength = chains.length
    ? chains.reduce((sum, c) => sum + (c.metrics?.strengthScore ?? 0), 0) / chains.length
    : 50;

  const techniqueMap = new Map<TCCTechnique, { used: number; helped: number }>();
  for (const seq of sequences) {
    const intervention = seq.cycleAnalysis?.interventionApplied;
    if (!intervention) continue;
    const existing = techniqueMap.get(intervention.technique) || { used: 0, helped: 0 };
    existing.used++;
    if (intervention.result === 'helped') existing.helped++;
    techniqueMap.set(intervention.technique, existing);
  }

  const effectiveTechniques = [...techniqueMap.entries()]
    .map(([technique, data]) => ({
      technique,
      timesUsed: data.used,
      averageImpact: data.used > 0 ? (data.helped / data.used) * 100 : 0,
      bestContext: '',
    }))
    .sort((a, b) => b.averageImpact - a.averageImpact);

  const attentionNeeded: Array<{ area: string; reason: string; suggestedAction: string }> = [];
  if (currentAvoidanceRate > 0.6) {
    attentionNeeded.push({
      area: 'Alta tasa de evitacion',
      reason: `${Math.round(currentAvoidanceRate * 100)}% de las interacciones son evitacion`,
      suggestedAction: 'Reducir dificultad de tareas y aumentar micro-tareas',
    });
  }

  return {
    overallTrend: calculateOverallTrend(sequences),
    vsBaseline: {
      taskCompletion: { baseline: baseline?.completionRate ?? 0, current: currentCompletionRate },
      avoidanceRate: { baseline: baseline?.avoidanceRate ?? 0, current: currentAvoidanceRate },
      averageMood: { baseline: baseline?.averageMood ?? 3, current: currentAvgMood },
      cycleStrength: { baseline: baseline?.cycleStrength ?? 50, current: avgCycleStrength },
    },
    effectiveTechniques,
    attentionNeeded,
  };
}

function compareDeclaredVsDetected(sequences: FunctionalSequence[], profile: DeclaredProfile) {
  const comparisons: Array<{ aspect: string; declared: string; detected: string; alignment: 'aligned' | 'partial' | 'divergent'; insight: string }> = [];
  const timeSlotCounts = new Map<string, number>();
  for (const seq of sequences.filter((s) => s.behavior.valence === 'target')) {
    const ts = seq.antecedent.timeOfDay || 'unknown';
    timeSlotCounts.set(ts, (timeSlotCounts.get(ts) || 0) + 1);
  }
  const detectedPeakTime = [...timeSlotCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'no determinado';
  if (profile.reportedEnergyPeakTime) {
    const match = profile.reportedEnergyPeakTime === detectedPeakTime;
    comparisons.push({
      aspect: 'Mejor momento del dia',
      declared: profile.reportedEnergyPeakTime,
      detected: detectedPeakTime,
      alignment: match ? 'aligned' : 'divergent',
      insight: match ? 'Tu percepcion coincide con los datos' : `Declaraste que tu mejor momento es ${profile.reportedEnergyPeakTime}, pero los datos muestran mas completaciones por ${detectedPeakTime}`,
    });
  }
  return { comparisons };
}

function createEmptyFormulation(userId: string, version: number): IntegratedCaseFormulation {
  return {
    userId,
    version,
    generatedAt: new Date(),
    sequencesProcessed: 0,
    totalSequences: 0,
    behaviorMap: { problemBehaviors: [], targetBehaviors: [] },
    functionalRelationships: { consolidatedChains: [], chainInteractions: [] },
    cognitiveProfile: { predominantPatterns: [], inferredBeliefs: [] },
    maintenanceCycle: { narrative: 'Aun no hay suficientes datos para generar una formulacion.', strength: 0, trend: 'stable', maintainingFactors: [], protectiveFactors: [] },
    progress: {
      overallTrend: 'stable',
      vsBaseline: {
        taskCompletion: { baseline: 0, current: 0 },
        avoidanceRate: { baseline: 0, current: 0 },
        averageMood: { baseline: 3, current: 3 },
        cycleStrength: { baseline: 50, current: 50 },
      },
      effectiveTechniques: [],
      attentionNeeded: [],
    },
    declaredVsDetected: { comparisons: [] },
  };
}

interface BehaviorGroup {
  type: BehaviorType;
  sequences: FunctionalSequence[];
}

function groupByBehaviorType(sequences: FunctionalSequence[]): BehaviorGroup[] {
  const groups = new Map<BehaviorType, FunctionalSequence[]>();
  for (const seq of sequences) {
    const behaviorType = toBehaviorType(seq.behavior.type);
    const existing = groups.get(behaviorType) || [];
    existing.push(seq);
    groups.set(behaviorType, existing);
  }
  return [...groups.entries()].map(([type, seqs]) => ({ type, sequences: seqs }));
}

function describeBehaviorType(type: BehaviorType, valence: string): string {
  const descriptions: Record<BehaviorType, Record<string, string>> = {
    avoidance: { problem: 'Evitacion de tareas', target: 'Enfrentamiento de tareas evitadas' },
    procrastination: { problem: 'Postergacion', target: 'Inicio inmediato' },
    escape: { problem: 'Abandono de tareas', target: 'Persistencia en tareas' },
    compulsion: { problem: 'Conducta compulsiva', target: 'Control de impulsos' },
    completion: { problem: 'Completar en exceso', target: 'Completar tareas' },
    partial_completion: { problem: 'Completar parcialmente', target: 'Avanzar parcialmente' },
    approach: { problem: 'Aproximacion inadecuada', target: 'Aproximacion gradual' },
    coping: { problem: 'Afrontamiento inadecuado', target: 'Afrontamiento adaptativo' },
    other: { problem: 'Otra conducta problema', target: 'Otra conducta objetivo' },
  };
  return descriptions[type]?.[valence] || `${type} (${valence})`;
}

function calculateTrendFromSequences(sequences: FunctionalSequence[]): Trend {
  if (sequences.length < 4) return 'stable';
  const sorted = [...sequences].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);
  const firstSpan = (new Date(firstHalf[firstHalf.length - 1].timestamp).getTime() - new Date(firstHalf[0].timestamp).getTime()) / (24 * 60 * 60 * 1000) || 1;
  const secondSpan = (new Date(secondHalf[secondHalf.length - 1].timestamp).getTime() - new Date(secondHalf[0].timestamp).getTime()) / (24 * 60 * 60 * 1000) || 1;
  const firstRate = firstHalf.length / firstSpan;
  const secondRate = secondHalf.length / secondSpan;
  if (sequences[0].behavior.valence === 'problem') {
    if (secondRate < firstRate * 0.7) return 'improving';
    if (secondRate > firstRate * 1.3) return 'worsening';
  } else {
    if (secondRate > firstRate * 1.3) return 'improving';
    if (secondRate < firstRate * 0.7) return 'worsening';
  }
  return 'stable';
}

function calculateOverallTrend(sequences: FunctionalSequence[]): Trend {
  const problems = sequences.filter((s) => s.behavior.valence === 'problem');
  const targets = sequences.filter((s) => s.behavior.valence === 'target');
  const problemTrend = problems.length ? calculateTrendFromSequences(problems) : 'stable';
  const targetTrend = targets.length ? calculateTrendFromSequences(targets) : 'stable';
  if (problemTrend === 'improving' || targetTrend === 'improving') return 'improving';
  if (problemTrend === 'worsening') return 'worsening';
  return 'stable';
}

function identifyBreakingPoints(sequences: FunctionalSequence[]) {
  const breakingPoints: ConsolidatedChain['breakingPoints'] = [];
  const withIntervention = sequences.filter((s) => s.cycleAnalysis?.interventionApplied);
  const techniqueResults = new Map<TCCTechnique, { tried: number; helped: number }>();
  for (const seq of withIntervention) {
    const intervention = seq.cycleAnalysis!.interventionApplied!;
    const existing = techniqueResults.get(intervention.technique) || { tried: 0, helped: 0 };
    existing.tried++;
    if (intervention.result === 'helped') existing.helped++;
    techniqueResults.set(intervention.technique, existing);
  }
  for (const [technique, results] of techniqueResults) {
    breakingPoints.push({
      where: 'at_trigger',
      intervention: `Usar ${technique}`,
      technique,
      timesTriedByUser: results.tried,
      effectiveness: results.tried > 0 ? Math.round((results.helped / results.tried) * 100) : 0,
    });
  }
  return breakingPoints;
}

function generateChainName(centroid: SequenceCluster['centroid'], topFunction: BehaviorFunction): string {
  const functionNames: Record<BehaviorFunction, string> = {
    escape_discomfort: 'por malestar',
    avoid_failure: 'por miedo al fracaso',
    avoid_judgment: 'por miedo al juicio',
    maintain_control: 'por necesidad de control',
    reduce_anxiety: 'por ansiedad',
    preserve_energy: 'por conservar energia',
    delay_decision: 'por indecision',
    seek_comfort: 'buscando confort',
    protect_self_esteem: 'protegiendo autoestima',
  };
  const timeNames: Record<string, string> = {
    early_morning: 'matutina',
    morning: 'de manana',
    afternoon: 'vespertina',
    evening: 'nocturna',
    night: 'nocturna tardia',
  };
  const behaviorNames: Record<string, string> = {
    avoidance: 'Evitacion',
    escape: 'Escape',
    procrastination: 'Postergacion',
    completion: 'Completacion',
    approach: 'Aproximacion',
    coping: 'Afrontamiento',
  };
  const behavior = behaviorNames[centroid.behaviorType] || centroid.behaviorType;
  const time = timeNames[centroid.timeSlot] || '';
  const reason = functionNames[topFunction] || '';
  return `${behavior} ${time} ${reason}`.trim();
}

function inferLongTermEffect(reinforcement: ReinforcementType, trend: Trend): string {
  if (reinforcement === 'negative_reinforcement') {
    return trend === 'worsening'
      ? 'El ciclo se esta fortaleciendo - cada evitacion hace la siguiente mas probable'
      : trend === 'improving'
        ? 'El ciclo se esta debilitando - las evitaciones son menos frecuentes'
        : 'El ciclo se mantiene - alivio inmediato sigue reforzando la evitacion';
  }
  if (reinforcement === 'positive_reinforcement') return 'El logro refuerza positivamente la conducta de aproximacion';
  return 'Efecto a largo plazo no determinado';
}

function describePattern(pattern: CognitivePattern): string {
  const names: Record<CognitivePattern, string> = {
    all_or_nothing: 'todo-o-nada',
    fortune_telling: 'adivinacion negativa',
    catastrophizing: 'catastrofizacion',
    magnification: 'magnificacion',
    should_statements: 'de deberia',
    emotional_reasoning: 'razonamiento emocional',
    mind_reading: 'lectura de mente',
    mental_filter: 'filtro mental',
    disqualifying_positive: 'descalificar lo positivo',
    personalization: 'personalizacion',
    labeling: 'etiquetado',
    overgeneralization: 'sobregeneralizacion',
  };
  return names[pattern] || pattern;
}

function buildMaintenanceNarrative(maintaining: MaintainingFactor[], protective: ProtectiveFactor[]): string {
  if (!maintaining.length) return 'No se han identificado factores de mantenimiento claros todavia.';
  const topFactor = maintaining[0];
  let narrative = `El principal factor que mantiene el patron es: ${topFactor.factor}.`;
  if (maintaining.length > 1) narrative += ` Tambien influyen: ${maintaining.slice(1).map((f) => f.factor.toLowerCase()).join(', ')}.`;
  if (protective.length > 0) narrative += ` A favor: ${protective[0].factor.toLowerCase()}.`;
  return narrative;
}

function getImmediateObject(
  seq: FunctionalSequence
): { relief?: boolean; description?: string; emotionalChange?: { from?: number; to?: number; relief: boolean } } | undefined {
  if (!seq.consequence.immediate || typeof seq.consequence.immediate === 'string') return undefined;
  return seq.consequence.immediate;
}

function toBehaviorType(type: BehaviorType | undefined): BehaviorType {
  return type || 'other';
}
