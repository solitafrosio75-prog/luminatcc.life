// ═══════════════════════════════════════════════════════════════════
// InterventionPlanGenerator.ts — Generador de Propuestas de Intervención
// ═══════════════════════════════════════════════════════════════════
//
// Transforma formulación + conductas clave → plan de intervención
// con objetivos medibles numéricos y técnicas asignadas.
//
// Flujo:
// 1. Recibir formulación + keyBehaviors + datos actuales
// 2. Por cada keyBehavior → generar FinalObjective
// 3. Por cada FinalObjective → generar IntermediateObjectives progresivos
// 4. Por cada Intermediate → asignar técnica + criterio medible
// 5. Ensamblar plan completo como PROPUESTA (status: 'draft')
//
// El plan es siempre una PROPUESTA. El usuario lo valida/ajusta
// en el flujo de co-construcción antes de activarse.
// ═══════════════════════════════════════════════════════════════════

import type {
  IntegratedCaseFormulation,
  FunctionalSequence,
  ConsolidatedChain,
} from './sequenceTypes';

import type { KeyBehavior } from './KeyBehaviorIdentifier';

import type {
  InterventionPlan,
  FinalObjective,
  IntermediateObjective,
  MeasurableCriterion,
  TechniqueAssignment,
  Timeframe,
  ProgressSnapshot,
  TaskMapping,
  MetricType,
  MetricUnit,
  MetricDataSource,
  ObjectiveOrigin,
} from './interventionPlanTypes';

import {
  createEmptyPlan,
  generateObjectiveId,
} from './interventionPlanTypes';

import type { BaselineSnapshot } from './BaselineCollector';

// ─────────────────────────────────────────────
// Tipos de entrada
// ─────────────────────────────────────────────

export interface PlanGenerationInput {
  userId: string;
  formulation: IntegratedCaseFormulation;
  keyBehaviors: KeyBehavior[];
  recentSequences: FunctionalSequence[];
  /** Snapshot formal de línea base (preferido) */
  baselineSnapshot?: BaselineSnapshot;
  /** Técnicas que ya han demostrado ser efectivas */
  effectiveTechniques?: EffectiveTechniqueRecord[];
  /** Límite de objetivos finales (evitar sobrecargar) */
  maxFinalObjectives?: number;
}

/** Formato interno para cálculos */
interface BaselineMetrics {
  avoidanceRate: number;          // 0-100%
  completionRate: number;         // 0-100%
  averageMood: number;            // 1-5
  daysActivePerWeek: number;      // 0-7
  cascadeFrequencyPerWeek: number;
  averageExposureTolerance: number; // minutos
}

interface EffectiveTechniqueRecord {
  technique: string;
  timesUsed: number;
  averageImpact: number;
  bestContext: string;
}

// ═══════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════

/**
 * Genera una propuesta de plan de intervención.
 *
 * El plan generado tiene status 'draft' — requiere
 * co-construcción con el usuario antes de activarse.
 */
export function generateInterventionPlan(input: PlanGenerationInput): InterventionPlan {
  const {
    userId,
    formulation,
    keyBehaviors,
    recentSequences,
    baselineSnapshot,
    effectiveTechniques,
    maxFinalObjectives = 3,
  } = input;

  // Crear plan vacío
  const plan = createEmptyPlan(userId, formulation.version);

  // Preferir snapshot formal, si no hay usar cálculo ad-hoc
  // IMPORTANTE: El snapshot es la fuente de verdad para targets clínicamente válidos
  const currentMetrics = baselineSnapshot
    ? convertBaselineSnapshotToMetrics(baselineSnapshot)
    : calculateCurrentMetrics(recentSequences);

  // Registrar qué baseline se usó (para auditoría)
  if (baselineSnapshot) {
    plan.baselineSnapshotId = baselineSnapshot.id;
  }

  // Limitar conductas clave a las top N
  const topBehaviors = keyBehaviors.slice(0, maxFinalObjectives);

  // Generar un objetivo final por cada conducta clave
  for (const kb of topBehaviors) {
    const chain = formulation.functionalRelationships.consolidatedChains
      .find(c => c.id === kb.sourceChainId);

    if (!chain) continue;

    const finalObjective = generateFinalObjective(
      kb,
      chain,
      currentMetrics,
      effectiveTechniques || [],
      recentSequences,
      formulation
    );

    plan.finalObjectives.push(finalObjective);
    plan.sourceKeyBehaviors.push({
      keyBehaviorId: kb.id,
      name: kb.name,
      priorityScore: kb.priorityScore,
    });
  }

  // Registrar evento de co-construcción
  plan.coConstruction.events.push({
    timestamp: new Date(),
    type: 'plan_proposed',
    systemProposal: `Plan con ${plan.finalObjectives.length} objetivo(s) final(es) generado desde formulación v${formulation.version}`,
  });

  // Actualizar contadores de progreso
  plan.overallProgress.finalsTotal = plan.finalObjectives.length;
  plan.overallProgress.intermediatesTotal = plan.finalObjectives
    .reduce((sum, fo) => sum + fo.intermediateObjectives.length, 0);

  return plan;
}

// ═══════════════════════════════════════════════
// GENERACIÓN DE OBJETIVO FINAL
// ═══════════════════════════════════════════════

function generateFinalObjective(
  kb: KeyBehavior,
  chain: ConsolidatedChain,
  currentMetrics: BaselineMetrics,
  effectiveTechniques: EffectiveTechniqueRecord[],
  recentSequences: FunctionalSequence[],
  formulation: IntegratedCaseFormulation
): FinalObjective {
  const id = generateObjectiveId('fo');

  // Determinar tipo y criterio según valencia de la conducta
  const isProblem = kb.valence === 'problem';

  // Calcular métrica específica para esta conducta clave
  const specificMetrics = calculateKeyBehaviorMetrics(kb, chain, recentSequences);

  // Generar criterio de éxito final
  const successCriterion = generateFinalCriterion(
    isProblem,
    specificMetrics,
    currentMetrics,
    kb
  );

  // Generar descripción legible
  const description = generateFinalDescription(kb, successCriterion, isProblem);
  const technicalDescription = generateTechnicalDescription(kb, successCriterion);

  // Generar objetivos intermedios progresivos
  const intermediateObjectives = generateIntermediateObjectives(
    id,
    kb,
    chain,
    specificMetrics,
    successCriterion,
    effectiveTechniques,
    formulation
  );

  return {
    id,
    description,
    technicalDescription,
    targetKeyBehaviorId: kb.id,
    type: isProblem ? 'reduce_problem' : 'increase_target',
    successCriterion,
    intermediateObjectives,
    status: 'proposed',
    currentProgress: {
      currentValue: successCriterion.baseline,
      progressPercentage: 0,
      trend: 'insufficient_data',
      measuredAt: new Date(),
      rateOfChange: 0,
    },
    origin: {
      proposedBy: 'system',
      derivedFrom: {
        keyBehaviorId: kb.id,
        chainId: kb.sourceChainId,
        formulationInsight: kb.rationale,
      },
      wasModified: false,
    },
  };
}

// ═══════════════════════════════════════════════
// GENERACIÓN DE CRITERIOS MEDIBLES
// ═══════════════════════════════════════════════

function generateFinalCriterion(
  isProblem: boolean,
  specificMetrics: KeyBehaviorSpecificMetrics,
  baselineMetrics: BaselineMetrics,
  kb: KeyBehavior
): MeasurableCriterion {
  if (isProblem) {
    // Objetivo: REDUCIR la conducta problema
    // Métrica principal: tasa de evitación en la categoría
    const currentRate = specificMetrics.categoryAvoidanceRate ?? baselineMetrics.avoidanceRate;

    // Target: reducir al menos al 50% del baseline, mínimo 20%
    const target = Math.max(20, Math.round(currentRate * 0.35));

    return {
      metric: 'avoidance_rate',
      scope: {
        taskCategory: kb.context.typicalCategories[0],
        room: kb.context.typicalRooms[0],
        behaviorType: kb.behaviorType,
        chainId: kb.sourceChainId,
      },
      baseline: Math.round(currentRate),
      target,
      direction: 'decrease',
      unit: 'percentage',
      dataSource: 'automatic_sequences',
      clinicalSignificanceThreshold: 20, // Al menos 20 puntos de diferencia
    };
  } else {
    // Objetivo: INCREMENTAR conducta target
    const currentRate = specificMetrics.categoryCompletionRate ?? baselineMetrics.completionRate;
    const target = Math.min(85, Math.round(currentRate * 1.8 + 15));

    return {
      metric: 'completion_rate',
      scope: {
        taskCategory: kb.context.typicalCategories[0],
        room: kb.context.typicalRooms[0],
      },
      baseline: Math.round(currentRate),
      target,
      direction: 'increase',
      unit: 'percentage',
      dataSource: 'automatic_sequences',
      clinicalSignificanceThreshold: 15,
    };
  }
}

// ═══════════════════════════════════════════════
// GENERACIÓN DE OBJETIVOS INTERMEDIOS
// ═══════════════════════════════════════════════

function generateIntermediateObjectives(
  parentId: string,
  kb: KeyBehavior,
  chain: ConsolidatedChain,
  specificMetrics: KeyBehaviorSpecificMetrics,
  finalCriterion: MeasurableCriterion,
  effectiveTechniques: EffectiveTechniqueRecord[],
  formulation: IntegratedCaseFormulation
): IntermediateObjective[] {
  const intermediates: IntermediateObjective[] = [];
  const isProblem = kb.valence === 'problem';

  // ─── Fase 1: Activación / Contacto inicial ───
  // "Empezar por algo fácil que genere victoria temprana"
  intermediates.push(
    buildIntermediate({
      parentId,
      order: 1,
      description: isProblem
        ? `Completar al menos 1 micro-tarea de ${formatCategory(kb.context.typicalCategories[0])} por semana`
        : `Mantener al menos ${Math.max(1, Math.round(specificMetrics.weeklyCompletions * 1.2))} tareas de ${formatCategory(kb.context.typicalCategories[0])} por semana`,
      technique: selectTechnique(
        'phase_1',
        kb,
        chain,
        effectiveTechniques,
        formulation
      ),
      criterion: {
        metric: 'completion_frequency',
        scope: {
          taskCategory: kb.context.typicalCategories[0],
          room: kb.context.typicalRooms[0],
        },
        baseline: specificMetrics.weeklyCompletions,
        target: isProblem
          ? Math.max(1, specificMetrics.weeklyCompletions + 1)
          : Math.max(1, Math.round(specificMetrics.weeklyCompletions * 1.3)),
        direction: 'increase',
        unit: 'count_per_week',
        dataSource: 'automatic_tasks',
        clinicalSignificanceThreshold: 1,
      },
      timeframeWeeks: 2,
      taskMapping: {
        relevantCategories: kb.context.typicalCategories,
        relevantRooms: kb.context.typicalRooms,
        appropriateDifficulties: ['very_low', 'low'],
        specificity: 'any_in_category',
      },
    })
  );

  // ─── Fase 2: Profundización cognitiva ───
  // "Identificar y cuestionar los pensamientos que mantienen el patrón"
  const hasCognitiveAntecedent = (chain.typicalAntecedents ?? []).some((a) =>
    /cogn|pens|thought/i.test(a.description)
  );

  if (isProblem && hasCognitiveAntecedent) {
    intermediates.push(
      buildIntermediate({
        parentId,
        order: 2,
        description: `Identificar el pensamiento automático antes de evitar en ${formatCategory(kb.context.typicalCategories[0])} al menos 2 veces por semana`,
        technique: selectTechnique(
          'phase_2_cognitive',
          kb,
          chain,
          effectiveTechniques,
          formulation
        ),
        criterion: {
          metric: 'technique_usage',
          scope: {
            technique: 'cognitive_restructuring',
            taskCategory: kb.context.typicalCategories[0],
          },
          baseline: 0,
          target: 2,
          direction: 'increase',
          unit: 'count_per_week',
          dataSource: 'thought_records',
          clinicalSignificanceThreshold: 1,
        },
        timeframeWeeks: 3,
        prerequisites: intermediates.length > 0 ? [intermediates[0].id] : [],
        taskMapping: {
          relevantCategories: kb.context.typicalCategories,
          relevantRooms: kb.context.typicalRooms,
          appropriateDifficulties: ['low', 'medium'],
          specificity: 'any_in_category',
        },
      })
    );
  }

  // ─── Fase 3: Exposición / Incremento gradual ───
  // "Aumentar tolerancia a la tarea problema"
  if (isProblem) {
    const baselineTolerance = specificMetrics.averageToleranceMinutes || 3;
    intermediates.push(
      buildIntermediate({
        parentId,
        order: intermediates.length + 1,
        description: `Aumentar el tiempo dedicado a tareas de ${formatCategory(kb.context.typicalCategories[0])} de ${baselineTolerance} a ${Math.round(baselineTolerance * 2.5)} minutos en promedio`,
        technique: selectTechnique(
          'phase_3_exposure',
          kb,
          chain,
          effectiveTechniques,
          formulation
        ),
        criterion: {
          metric: 'exposure_tolerance',
          scope: {
            taskCategory: kb.context.typicalCategories[0],
            room: kb.context.typicalRooms[0],
          },
          baseline: baselineTolerance,
          target: Math.round(baselineTolerance * 2.5),
          direction: 'increase',
          unit: 'minutes',
          dataSource: 'automatic_tasks',
          clinicalSignificanceThreshold: 3,
        },
        timeframeWeeks: 3,
        prerequisites: intermediates.length > 0 ? [intermediates[0].id] : [],
        taskMapping: {
          relevantCategories: kb.context.typicalCategories,
          relevantRooms: kb.context.typicalRooms,
          appropriateDifficulties: ['low', 'medium'],
          specificity: 'specific_room',
        },
      })
    );
  }

  // ─── Fase 4: Reducción de cascada ───
  // "Evitar que una evitación desencadene más evitaciones"
  if (isProblem && specificMetrics.cascadeRate > 0.2) {
    intermediates.push(
      buildIntermediate({
        parentId,
        order: intermediates.length + 1,
        description: `Reducir las cascadas de evitación de ${Math.round(specificMetrics.cascadeRate * 100)}% al ${Math.round(specificMetrics.cascadeRate * 50)}%`,
        technique: selectTechnique(
          'phase_4_cascade',
          kb,
          chain,
          effectiveTechniques,
          formulation
        ),
        criterion: {
          metric: 'cascade_frequency',
          scope: {
            chainId: kb.sourceChainId,
          },
          baseline: Math.round(specificMetrics.cascadeRate * 100),
          target: Math.round(specificMetrics.cascadeRate * 50),
          direction: 'decrease',
          unit: 'percentage',
          dataSource: 'automatic_sequences',
          clinicalSignificanceThreshold: 10,
        },
        timeframeWeeks: 4,
        prerequisites: intermediates.length > 1 ? [intermediates[1].id] : (intermediates.length > 0 ? [intermediates[0].id] : []),
        taskMapping: {
          relevantCategories: kb.context.typicalCategories,
          relevantRooms: kb.context.typicalRooms,
          appropriateDifficulties: ['low', 'medium', 'high'],
          specificity: 'any_in_category',
        },
      })
    );
  }

  // ─── Fase final: Consolidación ───
  // "Alcanzar y mantener el objetivo final durante 2 semanas"
  const consolidationTarget = calculateConsolidationTarget(finalCriterion);
  intermediates.push(
    buildIntermediate({
      parentId,
      order: intermediates.length + 1,
      description: isProblem
        ? `Mantener la tasa de evitación en ${formatCategory(kb.context.typicalCategories[0])} por debajo del ${consolidationTarget}% durante 2 semanas consecutivas`
        : `Mantener la tasa de completación en ${formatCategory(kb.context.typicalCategories[0])} por encima del ${consolidationTarget}% durante 2 semanas`,
      technique: selectTechnique(
        'phase_consolidation',
        kb,
        chain,
        effectiveTechniques,
        formulation
      ),
      criterion: {
        ...finalCriterion,
        // El intermedio de consolidación tiene el mismo target que el final
        clinicalSignificanceThreshold: finalCriterion.clinicalSignificanceThreshold,
      },
      timeframeWeeks: 2,
      prerequisites: intermediates.length > 0
        ? [intermediates[intermediates.length - 1].id]
        : [],
      taskMapping: {
        relevantCategories: kb.context.typicalCategories,
        relevantRooms: kb.context.typicalRooms,
        appropriateDifficulties: ['low', 'medium', 'high'],
        specificity: 'any_in_category',
      },
    })
  );

  return intermediates;
}

// ═══════════════════════════════════════════════
// SELECCIÓN DE TÉCNICA
// ═══════════════════════════════════════════════

type InterventionPhase =
  | 'phase_1'
  | 'phase_2_cognitive'
  | 'phase_3_exposure'
  | 'phase_4_cascade'
  | 'phase_consolidation';

function selectTechnique(
  phase: InterventionPhase,
  kb: KeyBehavior,
  chain: ConsolidatedChain,
  effectiveTechniques: EffectiveTechniqueRecord[],
  formulation: IntegratedCaseFormulation
): TechniqueAssignment {
  // Buscar si hay técnica ya probada como efectiva para esta categoría
  const provenTechnique = effectiveTechniques.find(t =>
    t.bestContext && kb.context.typicalCategories.some(c => t.bestContext.includes(c))
  );

  switch (phase) {
    case 'phase_1':
      return {
        technique: provenTechnique?.technique || 'behavioral_activation',
        rationale: provenTechnique
          ? `Esta técnica ya te ha funcionado antes (impacto promedio: ${provenTechnique.averageImpact.toFixed(1)})`
          : 'La activación conductual rompe el ciclo de inacción — la acción precede a la motivación',
        targetedFactor: 'Inacción / evitación inicial',
        steps: [
          'Elegir la micro-tarea más pequeña posible en esta categoría',
          'Comprometerse a solo 2 minutos (después puedes parar)',
          'Registrar cómo te sentiste después',
        ],
        priorEffectiveness: provenTechnique
          ? {
              timesUsed: provenTechnique.timesUsed,
              averageImpact: provenTechnique.averageImpact,
              bestContext: provenTechnique.bestContext,
            }
          : undefined,
      };

    case 'phase_2_cognitive':
      return {
        technique: 'cognitive_restructuring',
        rationale: 'Los pensamientos automáticos previos a la evitación mantienen el ciclo — identificarlos es el primer paso para cuestionarlos',
        targetedFactor: 'Pensamientos automáticos pre-evitación',
        steps: [
          'Cuando notes que estás evitando, pausar y preguntarte: ¿qué estoy pensando?',
          'Registrar el pensamiento en el Detective de Pensamientos',
          'Buscar evidencia a favor y en contra del pensamiento',
          'Generar un pensamiento alternativo más equilibrado',
        ],
      };

    case 'phase_3_exposure':
      return {
        technique: 'gradual_exposure',
        rationale: 'La exposición gradual reduce la ansiedad asociada a la tarea — lo que evitas se vuelve menos amenazante con la práctica',
        targetedFactor: 'Ansiedad / malestar anticipatorio',
        steps: [
          'Elegir la versión más fácil de la tarea',
          'Comprometerse a un tiempo concreto (usar temporizador)',
          'Si el malestar es alto, usar "necesito algo más pequeño"',
          'Aumentar gradualmente el tiempo cada semana',
        ],
      };

    case 'phase_4_cascade':
      return {
        technique: 'activity_scheduling',
        rationale: 'Planificar la siguiente acción ANTES de terminar evita la cascada — el plan interrumpe el ciclo automático',
        targetedFactor: 'Efecto cascada de evitación',
        steps: [
          'Después de completar (o intentar) una tarea, elegir inmediatamente la siguiente',
          'Si evitaste, hacer una micro-tarea de otra categoría antes de 30 minutos',
          'Registrar si se produjo cascada o si lograste cortarla',
        ],
      };

    case 'phase_consolidation':
      return {
        technique: provenTechnique?.technique || 'behavioral_activation',
        rationale: 'Mantener los cambios es tan importante como lograrlos — la consolidación previene recaídas',
        targetedFactor: 'Mantenimiento del cambio',
        steps: [
          'Continuar con la rutina establecida',
          'Identificar situaciones de riesgo de recaída',
          'Tener un plan B para días difíciles',
          'Celebrar el progreso sostenido',
        ],
      };
  }
}

// ═══════════════════════════════════════════════
// CÁLCULO DE MÉTRICAS ESPECÍFICAS
// ═══════════════════════════════════════════════

interface KeyBehaviorSpecificMetrics {
  categoryAvoidanceRate: number;   // 0-100
  categoryCompletionRate: number;  // 0-100
  weeklyCompletions: number;
  weeklyAvoidances: number;
  cascadeRate: number;             // 0-1
  averageToleranceMinutes: number;
}

function calculateKeyBehaviorMetrics(
  kb: KeyBehavior,
  chain: ConsolidatedChain,
  recentSequences: FunctionalSequence[]
): KeyBehaviorSpecificMetrics {
  // Filtrar secuencias relevantes a esta conducta clave
  const relevantSeqs = recentSequences.filter(s =>
    kb.context.typicalCategories.includes(s.behavior.context?.taskCategory || '') ||
    kb.context.typicalRooms.includes(s.behavior.context?.taskRoom || '')
  );

  const total = relevantSeqs.length || 1;
  const avoidances = relevantSeqs.filter(s => s.behavior.valence === 'problem').length;
  const completions = relevantSeqs.filter(s => s.behavior.valence === 'target').length;
  const cascades = relevantSeqs.filter(s => s.consequence.shortTerm?.cascadeEffect).length;

  // Calcular semanas de datos
  const oldestDate = relevantSeqs.length > 0
    ? relevantSeqs.reduce((min, s) => s.timestamp < min ? s.timestamp : min, new Date()).getTime()
    : Date.now();
  const weeks = Math.max(1, (Date.now() - oldestDate) / (7 * 24 * 60 * 60 * 1000));

  // Tolerancia promedio (duración de tareas completadas)
  const completedDurations = relevantSeqs
    .filter(s => s.behavior.valence === 'target' && s.behavior.topography?.duration)
    .map(s => s.behavior.topography!.duration!);
  const avgTolerance = completedDurations.length > 0
    ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
    : 3; // Default 3 min si no hay datos

  return {
    categoryAvoidanceRate: (avoidances / total) * 100,
    categoryCompletionRate: (completions / total) * 100,
    weeklyCompletions: completions / weeks,
    weeklyAvoidances: avoidances / weeks,
    cascadeRate: cascades / total,
    averageToleranceMinutes: avgTolerance,
  };
}

function convertBaselineSnapshotToMetrics(snapshot: BaselineSnapshot): BaselineMetrics {
  const avoidanceRecord = snapshot.metrics.find(m => m.metric === 'avoidance_rate');
  const completionRecord = snapshot.metrics.find(m => m.metric === 'completion_rate');
  const cascadeRecord = snapshot.metrics.find(m => m.metric === 'cascade_frequency');
  const moodRecord = snapshot.metrics.find(m => m.metric === 'average_mood_post_task');
  const toleranceRecord = snapshot.metrics.find(m => m.metric === 'exposure_tolerance');
  const daysActiveRecord = snapshot.metrics.find(m => m.metric === 'days_active');

  return {
    avoidanceRate: avoidanceRecord?.statistics.mean ?? 50,
    completionRate: completionRecord?.statistics.mean ?? 30,
    averageMood: moodRecord?.statistics.mean ?? 3,
    daysActivePerWeek: daysActiveRecord?.statistics.mean ?? 3,
    cascadeFrequencyPerWeek: cascadeRecord?.statistics.mean ?? 2,
    averageExposureTolerance: toleranceRecord?.statistics.mean ?? 5,
  };
}

function calculateCurrentMetrics(recentSequences: FunctionalSequence[]): BaselineMetrics {
  const total = recentSequences.length || 1;
  const avoidances = recentSequences.filter(s => s.behavior.valence === 'problem').length;
  const completions = recentSequences.filter(s => s.behavior.valence === 'target').length;
  const cascades = recentSequences.filter(s => s.consequence.shortTerm?.cascadeEffect).length;

  const weeks = Math.max(1, (recentSequences.length > 0
    ? (Date.now() - Math.min(...recentSequences.map(s => s.timestamp.getTime()))) / (7 * 24 * 60 * 60 * 1000)
    : 1));

  const uniqueDays = new Set(recentSequences.map(s =>
    s.timestamp.toISOString().substring(0, 10)
  )).size;

  return {
    avoidanceRate: (avoidances / total) * 100,
    completionRate: (completions / total) * 100,
    averageMood: 3,
    daysActivePerWeek: uniqueDays / weeks,
    cascadeFrequencyPerWeek: cascades / weeks,
    averageExposureTolerance: 5,
  };
}

// ═══════════════════════════════════════════════
// HELPERS DE GENERACIÓN
// ═══════════════════════════════════════════════

interface BuildIntermediateInput {
  parentId: string;
  order: number;
  description: string;
  technique: TechniqueAssignment;
  criterion: MeasurableCriterion;
  timeframeWeeks: number;
  prerequisites?: string[];
  taskMapping: TaskMapping;
}

function buildIntermediate(input: BuildIntermediateInput): IntermediateObjective {
  const id = generateObjectiveId(`io_${input.order}`);

  return {
    id,
    description: input.description,
    order: input.order,
    technique: input.technique,
    successCriterion: input.criterion,
    timeframe: {
      estimatedWeeks: input.timeframeWeeks,
      extensionPolicy: 'auto_extend_with_review',
    },
    prerequisites: input.prerequisites || [],
    status: 'proposed',
    currentProgress: {
      currentValue: input.criterion.baseline,
      progressPercentage: 0,
      trend: 'insufficient_data',
      measuredAt: new Date(),
      rateOfChange: 0,
    },
    taskMapping: input.taskMapping,
    origin: {
      proposedBy: 'system',
      wasModified: false,
    },
    evaluations: [],
  };
}

function calculateConsolidationTarget(finalCriterion: MeasurableCriterion): number {
  if (finalCriterion.direction === 'decrease') {
    // Para reducción: el target de consolidación es ligeramente más permisivo
    return Math.round(finalCriterion.target * 1.15);
  } else {
    // Para incremento: ligeramente menos exigente
    return Math.round(finalCriterion.target * 0.9);
  }
}

function generateFinalDescription(
  kb: KeyBehavior,
  criterion: MeasurableCriterion,
  isProblem: boolean
): string {
  const category = formatCategory(kb.context.typicalCategories[0]);

  if (isProblem) {
    return `Reducir la evitación de tareas de ${category} del ${criterion.baseline}% al ${criterion.target}%`;
  } else {
    return `Aumentar la realización de tareas de ${category} del ${criterion.baseline}% al ${criterion.target}%`;
  }
}

function generateTechnicalDescription(
  kb: KeyBehavior,
  criterion: MeasurableCriterion
): string {
  return `${criterion.metric} [${criterion.scope.taskCategory || 'general'}` +
    `${criterion.scope.room ? '/' + criterion.scope.room : ''}]: ` +
    `${criterion.baseline} → ${criterion.target} ${criterion.unit} ` +
    `(chain: ${kb.sourceChainId}, confidence: ${kb.priorityScore.toFixed(0)})`;
}

function formatCategory(category?: string): string {
  const labels: Record<string, string> = {
    cleaning: 'limpieza',
    organizing: 'organización',
    shopping: 'compras',
    maintenance: 'mantenimiento',
  };
  return category ? (labels[category] || category) : 'general';
}

// ═══════════════════════════════════════════════
// REGENERACIÓN / AJUSTE DE PLAN
// ═══════════════════════════════════════════════

/**
 * Regenera un plan cuando la formulación ha cambiado significativamente.
 * Preserva objetivos que el usuario ya validó, ajusta o añade nuevos.
 */
export function regeneratePlanFromNewFormulation(
  existingPlan: InterventionPlan,
  input: PlanGenerationInput
): InterventionPlan {
  const newPlan = generateInterventionPlan(input);

  // Preservar objetivos que el usuario ya aceptó/modificó
  const preservedObjectives = existingPlan.finalObjectives.filter(fo =>
    fo.status === 'active' || fo.status === 'accepted' || fo.origin.wasModified
  );

  // Merge: mantener preservados, añadir nuevos que no solapen
  for (const preserved of preservedObjectives) {
    const overlaps = newPlan.finalObjectives.some(nfo =>
      nfo.targetKeyBehaviorId === preserved.targetKeyBehaviorId
    );

    if (overlaps) {
      // Reemplazar el nuevo con el preservado
      const idx = newPlan.finalObjectives.findIndex(
        nfo => nfo.targetKeyBehaviorId === preserved.targetKeyBehaviorId
      );
      if (idx !== -1) {
        newPlan.finalObjectives[idx] = preserved;
      }
    } else {
      // Añadir el preservado
      newPlan.finalObjectives.push(preserved);
    }
  }

  newPlan.version = existingPlan.version + 1;
  newPlan.status = 'revising';
  newPlan.coConstruction = {
    ...existingPlan.coConstruction,
    events: [
      ...existingPlan.coConstruction.events,
      {
        timestamp: new Date(),
        type: 'plan_revision_requested',
        systemProposal: 'Plan actualizado por cambio en formulación',
      },
    ],
  };

  return newPlan;
}
