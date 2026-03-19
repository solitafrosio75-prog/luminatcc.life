import type {
  ConsolidatedChain,
  ChainInteraction,
  FunctionalSequence,
  IntegratedCaseFormulation,
  BehaviorType,
} from './sequenceTypes';

export interface KeyBehavior {
  id: string;
  sourceChainId: number;
  name: string;
  rationale: string;
  behaviorType: string;
  valence: 'problem' | 'target';
  context: {
    typicalTimeSlots: string[];
    typicalCategories: string[];
    typicalRooms: string[];
    typicalTriggers: string[];
  };
  priorityScore: number;
  criteria: {
    easeOfModification: CriterionScore;
    chainPosition: CriterionScore;
    generalizationPotential: CriterionScore;
    userDistress: CriterionScore;
  };
  downstreamChains: number[];
  targetableWith: TaskTarget[];
  validation: {
    status: 'proposed' | 'confirmed' | 'rejected' | 'pending';
    confirmedAt?: Date;
    userAdjustments?: string;
  };
}

export interface CriterionScore {
  score: number;
  weight: number;
  weighted: number;
  evidence: string[];
}

export interface TaskTarget {
  taskCategory: string;
  room?: string;
  recommendedDifficulty: 'very_low' | 'low' | 'medium' | 'high';
  interventionRationale: string;
}

const GODOY_WEIGHTS = {
  easeOfModification: 0.4,
  chainPosition: 0.3,
  generalizationPotential: 0.2,
  userDistress: 0.1,
} as const;

export function identifyKeyBehaviors(
  formulation: IntegratedCaseFormulation,
  recentSequences: FunctionalSequence[],
  maxResults = 5
): KeyBehavior[] {
  const consolidatedChains = formulation.functionalRelationships.consolidatedChains || [];
  const chainInteractions = formulation.functionalRelationships.chainInteractions || [];
  if (!consolidatedChains.length) return [];

  const candidates: KeyBehavior[] = [];
  for (const chain of consolidatedChains) {
    const candidate = evaluateChainAsKeyBehavior(
      chain,
      consolidatedChains,
      chainInteractions,
      recentSequences,
      formulation
    );
    if (candidate) candidates.push(candidate);
  }

  candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  return candidates.slice(0, maxResults);
}

function evaluateChainAsKeyBehavior(
  chain: ConsolidatedChain,
  allChains: ConsolidatedChain[],
  interactions: ChainInteraction[],
  recentSequences: FunctionalSequence[],
  formulation: IntegratedCaseFormulation
): KeyBehavior | null {
  if (chain.metrics.occurrences < 3 || typeof chain.id !== 'number') return null;

  const chainSequences = recentSequences.filter((s) => chain.sequenceIds.includes(s.id || -1));
  const valence = inferChainValence(chain, formulation, chainSequences);

  const easeOfModification = scoreEaseOfModification(chain, chainSequences, formulation);
  const chainPosition = scoreChainPosition(chain, allChains, interactions);
  const generalizationPotential = scoreGeneralizationPotential(chain, interactions, allChains, chainSequences);
  const userDistress = scoreUserDistress(chain, chainSequences);

  const priorityScore =
    easeOfModification.weighted +
    chainPosition.weighted +
    generalizationPotential.weighted +
    userDistress.weighted;

  const downstreamChains = findDownstreamChains(chain, interactions, allChains);
  const targetableWith = generateTaskTargets(chain, valence, chainSequences);

  return {
    id: `kb_${chain.id}`,
    sourceChainId: chain.id,
    name: chain.name || chain.label || chain.chainKey || `Cadena ${chain.id}`,
    rationale: buildRationale(easeOfModification, chainPosition, generalizationPotential, userDistress),
    behaviorType: chain.typicalBehavior?.type || 'other',
    valence,
    context: {
      typicalTimeSlots: extractTimeSlots(chain, chainSequences),
      typicalCategories: extractCategories(chain, chainSequences),
      typicalRooms: extractRooms(chain, chainSequences),
      typicalTriggers: (chain.typicalAntecedents || []).map((a) => a.description),
    },
    priorityScore,
    criteria: {
      easeOfModification,
      chainPosition,
      generalizationPotential,
      userDistress,
    },
    downstreamChains,
    targetableWith,
    validation: { status: 'proposed' },
  };
}

function scoreEaseOfModification(
  chain: ConsolidatedChain,
  chainSequences: FunctionalSequence[],
  formulation: IntegratedCaseFormulation
): CriterionScore {
  let score = 50;
  const evidence: string[] = [];

  if ((chain.breakingPoints || []).length > 0) {
    score += 15;
    evidence.push(`${chain.breakingPoints!.length} punto(s) de ruptura identificado(s)`);
  }

  const categories = extractCategories(chain, chainSequences);
  const relatedSuccesses = chainSequences.filter(
    (s) =>
      s.behavior.valence === 'target' &&
      Boolean(s.behavior.context?.taskCategory && categories.includes(s.behavior.context.taskCategory))
  );
  if (relatedSuccesses.length > 0) {
    const boost = Math.min(20, relatedSuccesses.length * 5);
    score += boost;
    evidence.push(`${relatedSuccesses.length} exito(s) reciente(s) en categoria relacionada`);
  }

  const downsized = chainSequences.filter((s) => s.source.type === 'task_downsized').length;
  if (chainSequences.length > 0 && downsized / chainSequences.length > 0.3) {
    score += 10;
    evidence.push('Ya aparecen intentos de version reducida');
  }

  const firstSeen = chain.metrics.firstSeen ? new Date(chain.metrics.firstSeen) : undefined;
  const lastSeen = chain.metrics.lastSeen ? new Date(chain.metrics.lastSeen) : undefined;
  const chainAgeDays =
    firstSeen && lastSeen ? (lastSeen.getTime() - firstSeen.getTime()) / (24 * 60 * 60 * 1000) : 90;
  if (chainAgeDays < 14) {
    score += 10;
    evidence.push('Patron reciente y mas maleable');
  } else if (chainAgeDays > 60) {
    score -= 10;
    evidence.push('Patron consolidado, mas resistente al cambio');
  }

  const effectiveTechniques = (formulation.progress?.effectiveTechniques || []).filter((t) =>
    categories.some((c) => t.bestContext?.toLowerCase().includes(c.toLowerCase()))
  );
  if (effectiveTechniques.length > 0) {
    score += 10;
    evidence.push(`Tecnicas efectivas previas: ${effectiveTechniques.map((t) => t.technique).join(', ')}`);
  }

  if ((chain.metrics.strengthScore || 0) >= 70) {
    score -= 10;
    evidence.push('Cadena fuerte, con inercia alta');
  } else if ((chain.metrics.strengthScore || 0) <= 35) {
    score += 8;
    evidence.push('Cadena con fuerza baja o moderada');
  }

  score = clamp(score, 0, 100);
  return toCriterion(score, GODOY_WEIGHTS.easeOfModification, evidence);
}

function scoreChainPosition(
  chain: ConsolidatedChain,
  allChains: ConsolidatedChain[],
  interactions: ChainInteraction[]
): CriterionScore {
  let score = 30;
  const evidence: string[] = [];

  const triggersOthers = interactions.filter((i) =>
    i.relationship === 'triggers' && matchesChainRef(i.fromChainId, chain)
  );
  if (triggersOthers.length > 0) {
    score += Math.min(40, triggersOthers.length * 15);
    evidence.push(`Dispara ${triggersOthers.length} cadena(s)`);
  }

  const triggeredByOthers = interactions.filter((i) =>
    i.relationship === 'triggers' && matchesChainRef(i.toChainId, chain)
  );
  if (triggeredByOthers.length > 0) {
    score -= triggeredByOthers.length * 10;
    evidence.push(`Recibe disparo de ${triggeredByOthers.length} cadena(s)`);
  }

  if (triggersOthers.length > 0 && triggeredByOthers.length === 0) {
    score += 20;
    evidence.push('Posible cadena raiz');
  }

  const chainTimeSlots = extractTimeSlots(chain, []);
  const earlierThanOthers = allChains.filter((other) => {
    if (other.id === chain.id) return false;
    return isTemporallyEarlier(chainTimeSlots, extractTimeSlots(other, []));
  });
  if (earlierThanOthers.length > 0) {
    score += Math.min(15, earlierThanOthers.length * 5);
    evidence.push(`Tiende a ocurrir antes que ${earlierThanOthers.length} cadenas`);
  }

  const cooccurrences = interactions.filter(
    (i) =>
      i.relationship === 'cooccurs' &&
      (matchesChainRef(i.fromChainId, chain) || matchesChainRef(i.toChainId, chain))
  );
  if (cooccurrences.length > 1) {
    score += 10;
    evidence.push(`Nodo central por coocurrencia (${cooccurrences.length})`);
  }

  score = clamp(score, 0, 100);
  return toCriterion(score, GODOY_WEIGHTS.chainPosition, evidence);
}

function scoreGeneralizationPotential(
  chain: ConsolidatedChain,
  interactions: ChainInteraction[],
  allChains: ConsolidatedChain[],
  chainSequences: FunctionalSequence[]
): CriterionScore {
  let score = 30;
  const evidence: string[] = [];

  const downstream = findDownstreamChains(chain, interactions, allChains);
  if (downstream.length > 0) {
    score += Math.min(30, downstream.length * 12);
    evidence.push(`Impactaria ${downstream.length} cadena(s) downstream`);
  }

  const categories = extractCategories(chain, chainSequences);
  const rooms = extractRooms(chain, chainSequences);
  if (categories.length > 1) {
    score += 15;
    evidence.push(`Cruza ${categories.length} categorias`);
  }
  if (rooms.length > 1) {
    score += 10;
    evidence.push(`Aparece en ${rooms.length} espacios`);
  }

  const chainFunction = chain.typicalBehavior?.function;
  const chainsWithSameFunction = allChains.filter(
    (other) => other.id !== chain.id && other.typicalBehavior?.function === chainFunction
  );
  if (chainFunction && chainsWithSameFunction.length >= 2) {
    score += 15;
    evidence.push(`${chainsWithSameFunction.length + 1} cadenas comparten funcion`);
  }

  const hasGenericTriggers = (chain.typicalAntecedents || []).some((a) => {
    const d = a.description.toLowerCase();
    return d.includes('hora') || d.includes('energia') || d.includes('emoc') || d.includes('estado');
  });
  if (hasGenericTriggers) {
    score += 10;
    evidence.push('Triggers genericos con alta transferibilidad');
  }

  score = clamp(score, 0, 100);
  return toCriterion(score, GODOY_WEIGHTS.generalizationPotential, evidence);
}

function scoreUserDistress(
  chain: ConsolidatedChain,
  chainSequences: FunctionalSequence[]
): CriterionScore {
  let score = 40;
  const evidence: string[] = [];

  if (chain.metrics.occurrences >= 10) {
    score += 20;
    evidence.push('Frecuencia alta');
  } else if (chain.metrics.occurrences >= 5) {
    score += 10;
    evidence.push('Frecuencia moderada');
  }

  const trend = chain.metrics.trend;
  if (trend === 'worsening') {
    score += 15;
    evidence.push('Tendencia en empeoramiento');
  } else if (trend === 'improving') {
    score -= 10;
    evidence.push('Tendencia de mejora');
  }

  const cascadeCount = chainSequences.filter((s) => s.consequence.shortTerm?.cascadeEffect).length;
  if (cascadeCount > 0) {
    score += 15;
    evidence.push('Presenta efecto cascada');
  }

  const reinforcementType = chain.typicalConsequences?.reinforcementType || '';
  if (reinforcementType.includes('negative')) {
    score += 10;
    evidence.push('Alivio por evitacion refuerza el patron');
  }

  score = clamp(score, 0, 100);
  return toCriterion(score, GODOY_WEIGHTS.userDistress, evidence);
}

function findDownstreamChains(
  chain: ConsolidatedChain,
  interactions: ChainInteraction[],
  allChains: ConsolidatedChain[]
): number[] {
  if (typeof chain.id !== 'number') return [];
  const downstream = new Set<number>();
  const queue = [chain.id];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const currentChain = allChains.find((c) => c.id === current);
    if (!currentChain) continue;
    const triggeredRefs = interactions
      .filter((i) => i.relationship === 'triggers' && matchesChainRef(i.fromChainId, currentChain))
      .map((i) => i.toChainId);

    for (const ref of triggeredRefs) {
      const nextId = resolveRefToChainId(ref, allChains);
      if (nextId !== undefined && !visited.has(nextId)) {
        downstream.add(nextId);
        queue.push(nextId);
      }
    }
  }

  return Array.from(downstream);
}

function generateTaskTargets(
  chain: ConsolidatedChain,
  valence: 'problem' | 'target',
  chainSequences: FunctionalSequence[]
): TaskTarget[] {
  const targets: TaskTarget[] = [];
  const categories = extractCategories(chain, chainSequences);
  const rooms = extractRooms(chain, chainSequences);

  if (valence === 'problem') {
    for (const cat of categories.slice(0, 3)) {
      targets.push({
        taskCategory: cat,
        room: rooms[0],
        recommendedDifficulty: 'very_low',
        interventionRationale: `Micro tarea en ${cat} para romper la evitacion de forma gradual`,
      });
      targets.push({
        taskCategory: cat,
        room: rooms[0],
        recommendedDifficulty: 'medium',
        interventionRationale: `Version completa en ${cat} para consolidar el cambio`,
      });
    }
  } else {
    for (const cat of categories.slice(0, 2)) {
      targets.push({
        taskCategory: cat,
        room: rooms[0],
        recommendedDifficulty: 'low',
        interventionRationale: `Reforzar patron adaptativo en ${cat}`,
      });
    }
  }

  return targets;
}

function extractTimeSlots(chain: ConsolidatedChain, seqs: FunctionalSequence[]): string[] {
  const fromSeqs = Array.from(
    new Set(
      seqs
        .map((s) => s.antecedent.timeOfDay)
        .filter((slot): slot is NonNullable<FunctionalSequence['antecedent']['timeOfDay']> => slot != null)
    )
  );
  if (fromSeqs.length > 0) return fromSeqs;
  return (chain.typicalAntecedents || [])
    .map((a) => a.description.toLowerCase())
    .filter((d) => d.includes('morning') || d.includes('afternoon') || d.includes('night') || d.includes('evening'));
}

function extractCategories(chain: ConsolidatedChain, seqs: FunctionalSequence[]): string[] {
  const set = new Set<string>();
  if (chain.typicalBehavior?.description) {
    // no-op but keeps legacy hook
  }
  for (const s of seqs) {
    if (s.behavior.context?.taskCategory) set.add(s.behavior.context.taskCategory);
  }
  return Array.from(set);
}

function extractRooms(chain: ConsolidatedChain, seqs: FunctionalSequence[]): string[] {
  const set = new Set<string>();
  if (chain.typicalBehavior?.description) {
    // no-op but keeps legacy hook
  }
  for (const s of seqs) {
    if (s.behavior.context?.taskRoom) set.add(s.behavior.context.taskRoom);
  }
  return Array.from(set);
}

function isTemporallyEarlier(slotsA: string[], slotsB: string[]): boolean {
  const order: Record<string, number> = {
    early_morning: 1,
    morning: 2,
    midday: 3,
    afternoon: 4,
    evening: 5,
    night: 6,
    late_night: 7,
  };
  const avgA = slotsA.reduce((sum, s) => sum + (order[s] || 4), 0) / (slotsA.length || 1);
  const avgB = slotsB.reduce((sum, s) => sum + (order[s] || 4), 0) / (slotsB.length || 1);
  return avgA < avgB - 0.5;
}

function buildRationale(
  ease: CriterionScore,
  position: CriterionScore,
  generalization: CriterionScore,
  distress: CriterionScore
): string {
  const ranked = [
    { name: 'facilidad', criterion: ease },
    { name: 'posicion en cadena', criterion: position },
    { name: 'generalizacion', criterion: generalization },
    { name: 'malestar', criterion: distress },
  ].sort((a, b) => b.criterion.weighted - a.criterion.weighted);

  const top = ranked[0];
  const topEvidence = top.criterion.evidence[0] || 'cumple criterio prioritario';
  const parts: string[] = [];

  if (top.name === 'facilidad') {
    parts.push(`Es una conducta accesible para intervenir: ${topEvidence.toLowerCase()}.`);
  } else if (top.name === 'posicion en cadena') {
    parts.push(`Aparece temprano en la secuencia: ${topEvidence.toLowerCase()}.`);
  } else if (top.name === 'generalizacion') {
    parts.push(`Cambiarla puede impactar varias areas: ${topEvidence.toLowerCase()}.`);
  } else {
    parts.push(`Representa una carga relevante para el usuario: ${topEvidence.toLowerCase()}.`);
  }

  if (generalization.score >= 60 && top.name !== 'generalizacion') {
    parts.push('Ademas, ofrece buen potencial de efecto domino.');
  }

  return parts.join(' ');
}

function inferChainValence(
  chain: ConsolidatedChain,
  formulation: IntegratedCaseFormulation,
  chainSequences: FunctionalSequence[]
): 'problem' | 'target' {
  const targetTypes = new Set((formulation.behaviorMap?.targetBehaviors || []).map((b) => b.type));
  const problemTypes = new Set((formulation.behaviorMap?.problemBehaviors || []).map((b) => b.type));
  const type = chain.typicalBehavior?.type;
  if (type && targetTypes.has(type)) return 'target';
  if (type && problemTypes.has(type)) return 'problem';

  const targetCount = chainSequences.filter((s) => s.behavior.valence === 'target').length;
  const problemCount = chainSequences.filter((s) => s.behavior.valence === 'problem').length;
  if (targetCount > problemCount) return 'target';

  if (isTargetLike(type)) return 'target';
  return 'problem';
}

function isTargetLike(type: BehaviorType | undefined): boolean {
  return type === 'completion' || type === 'approach' || type === 'coping' || type === 'partial_completion';
}

function toCriterion(score: number, weight: number, evidence: string[]): CriterionScore {
  return {
    score,
    weight,
    weighted: score * weight,
    evidence,
  };
}

function matchesChainRef(ref: string, chain: ConsolidatedChain): boolean {
  const normalized = ref.trim();
  return (
    normalized === String(chain.id || '') ||
    normalized === (chain.name || '') ||
    normalized === (chain.label || '') ||
    normalized === (chain.chainKey || '')
  );
}

function resolveRefToChainId(ref: string, allChains: ConsolidatedChain[]): number | undefined {
  const direct = Number(ref);
  if (Number.isFinite(direct)) return direct;
  const found = allChains.find(
    (c) => ref === c.name || ref === c.label || ref === c.chainKey
  );
  return found?.id;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function prepareKeyBehaviorForValidation(kb: KeyBehavior): {
  title: string;
  narrative: string;
  actionPrompt: string;
} {
  const isAvoidance = kb.behaviorType === 'avoidance' || kb.behaviorType === 'escape';

  const title = isAvoidance ? 'He notado un patron importante' : 'Algo que estas haciendo bien';
  const narrative = isAvoidance
    ? `Parece que ${kb.name.toLowerCase()} influye en otros aspectos. ${kb.rationale} ¿Te gustaria que enfoquemos recomendaciones aqui?`
    : `${kb.name} te esta funcionando bien. ${kb.rationale} ¿Quieres reforzar este patron?`;
  const actionPrompt = isAvoidance
    ? 'Empezariamos con un paso muy pequeno y manejable'
    : 'Mantener lo que ya funciona tambien es avance terapeutico';

  return { title, narrative, actionPrompt };
}
