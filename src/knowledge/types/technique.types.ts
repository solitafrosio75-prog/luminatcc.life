/**
 * technique.types.ts — Tipos de infraestructura del sistema de conocimiento (v2)
 *
 * KBArea es FLEXIBLE: áreas compartidas + áreas específicas por técnica.
 * AC (motor conductual) y RC (motor cognitivo) tienen áreas propias.
 * El manifest usa Partial<Record<KBArea, ...>> para que cada técnica
 * solo registre las áreas que realmente implementa.
 */

// ============================================================================
// IDs de técnicas terapéuticas — extender al agregar nuevas
// ============================================================================

export type TechniqueId = 'ac' | 'rc' | 'dc' | 'exposicion' | 'ds' | 'trec' | 'mc' | 'act' | 'mindfulness';

// ============================================================================
// KBArea — Enum flexible: compartidas + específicas por técnica
// ============================================================================

export enum KBArea {
  // ── Compartidas — infraestructura clínica común a toda técnica ──
  CONOCIMIENTO            = 'conocimiento',
  OBJETIVOS_CLINICOS      = 'objetivos_clinicos',
  HERRAMIENTAS_EVALUACION = 'herramientas_evaluacion',
  EJERCICIOS_TAREAS       = 'ejercicios_tareas',
  RECURSOS_MATERIALES     = 'recursos_materiales',
  TECNICAS_ESPECIFICAS    = 'tecnicas_especificas',
  ESTRUCTURA_SESIONES     = 'estructura_sesiones',
  BARRERAS                = 'barreras',
  HABILIDADES_TERAPEUTA   = 'habilidades_terapeuta',
  SINTOMAS_PROBLEMAS      = 'sintomas_problemas',

  // ── Específicas AC — motor conductual ──
  AC_AREAS_VITALES            = 'ac_areas_vitales',
  AC_VALORES_REFORZADORES     = 'ac_valores_reforzadores',
  AC_ACTIVIDADES_POR_PROBLEMA = 'ac_actividades_por_problema',

  // ── Específicas RC — motor cognitivo ──
  RC_DISTORSIONES_COGNITIVAS   = 'rc_distorsiones_cognitivas',
  RC_REGISTRO_PENSAMIENTOS     = 'rc_registro_pensamientos',
  RC_CREENCIAS_NUCLEARES       = 'rc_creencias_nucleares',
  RC_EXPERIMENTOS_CONDUCTUALES = 'rc_experimentos_conductuales',

  // ── Específicas DS — desensibilización sistemática ──
  DS_JERARQUIA_ANSIEDAD        = 'ds_jerarquia_ansiedad',
  DS_RELAJACION                = 'ds_relajacion',
  DS_PROCESO_DESENSIBILIZACION = 'ds_proceso_desensibilizacion',

  // ── Específicas EXP — terapia de exposición ──
  EXP_JERARQUIA_EXPOSICION  = 'exp_jerarquia_exposicion',
  EXP_PREVENCION_RESPUESTA  = 'exp_prevencion_respuesta',
  EXP_PROCESO_EXPOSICION    = 'exp_proceso_exposicion',

  // ── Específicas MC — modificación de conducta ──
  MC_ANALISIS_FUNCIONAL      = 'mc_analisis_funcional',
  MC_PROGRAMAS_REFORZAMIENTO = 'mc_programas_reforzamiento',
  MC_TECNICAS_OPERANTES      = 'mc_tecnicas_operantes',

  // ── Específicas ACT — terapia de aceptación y compromiso ──
  ACT_HEXAFLEX            = 'act_hexaflex',
  ACT_DEFUSION_COGNITIVA  = 'act_defusion_cognitiva',
  ACT_VALORES_ACCION      = 'act_valores_accion',

  // ── Específicas DC — terapia dialéctico conductual ──
  DC_REGULACION_EMOCIONAL       = 'dc_regulacion_emocional',
  DC_TOLERANCIA_MALESTAR        = 'dc_tolerancia_malestar',
  DC_EFECTIVIDAD_INTERPERSONAL  = 'dc_efectividad_interpersonal',

  // ── Específicas TREC — terapia racional emotiva conductual ──
  TREC_CREENCIAS_IRRACIONALES = 'trec_creencias_irracionales',
  TREC_DISPUTACION            = 'trec_disputacion',
  TREC_MODELO_ABCDE           = 'trec_modelo_abcde',

  // ── Específicas Mindfulness — mindfulness terapéutico ──
  MINDFULNESS_PRACTICAS_FORMALES    = 'mindfulness_practicas_formales',
  MINDFULNESS_PRACTICAS_INFORMALES  = 'mindfulness_practicas_informales',
  MINDFULNESS_APLICACIONES_CLINICAS = 'mindfulness_aplicaciones_clinicas',
}

// ============================================================================
// Agrupaciones de áreas por técnica
// ============================================================================

/** Las 10 áreas compartidas (toda técnica debería tenerlas) */
export const SHARED_KB_AREAS: KBArea[] = [
  KBArea.CONOCIMIENTO,
  KBArea.OBJETIVOS_CLINICOS,
  KBArea.HERRAMIENTAS_EVALUACION,
  KBArea.EJERCICIOS_TAREAS,
  KBArea.RECURSOS_MATERIALES,
  KBArea.TECNICAS_ESPECIFICAS,
  KBArea.ESTRUCTURA_SESIONES,
  KBArea.BARRERAS,
  KBArea.HABILIDADES_TERAPEUTA,
  KBArea.SINTOMAS_PROBLEMAS,
];

/** Áreas de AC = compartidas + 3 conductuales */
export const AC_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.AC_AREAS_VITALES,
  KBArea.AC_VALORES_REFORZADORES,
  KBArea.AC_ACTIVIDADES_POR_PROBLEMA,
];

/** Áreas de RC = compartidas + 4 cognitivas */
export const RC_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.RC_DISTORSIONES_COGNITIVAS,
  KBArea.RC_REGISTRO_PENSAMIENTOS,
  KBArea.RC_CREENCIAS_NUCLEARES,
  KBArea.RC_EXPERIMENTOS_CONDUCTUALES,
];

/** Áreas de DS = compartidas + 3 de desensibilización */
export const DS_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.DS_JERARQUIA_ANSIEDAD,
  KBArea.DS_RELAJACION,
  KBArea.DS_PROCESO_DESENSIBILIZACION,
];

/** Áreas de EXP = compartidas + 3 de exposición */
export const EXP_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.EXP_JERARQUIA_EXPOSICION,
  KBArea.EXP_PREVENCION_RESPUESTA,
  KBArea.EXP_PROCESO_EXPOSICION,
];

/** Áreas de MC = compartidas + 3 de modificación de conducta */
export const MC_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.MC_ANALISIS_FUNCIONAL,
  KBArea.MC_PROGRAMAS_REFORZAMIENTO,
  KBArea.MC_TECNICAS_OPERANTES,
];

/** Áreas de ACT = compartidas + 3 de flexibilidad psicológica */
export const ACT_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.ACT_HEXAFLEX,
  KBArea.ACT_DEFUSION_COGNITIVA,
  KBArea.ACT_VALORES_ACCION,
];

/** Áreas de DC = compartidas + 3 de habilidades DBT */
export const DC_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.DC_REGULACION_EMOCIONAL,
  KBArea.DC_TOLERANCIA_MALESTAR,
  KBArea.DC_EFECTIVIDAD_INTERPERSONAL,
];

/** Áreas de TREC = compartidas + 3 de terapia racional emotiva */
export const TREC_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.TREC_CREENCIAS_IRRACIONALES,
  KBArea.TREC_DISPUTACION,
  KBArea.TREC_MODELO_ABCDE,
];

/** Áreas de Mindfulness = compartidas + 3 de atención plena */
export const MINDFULNESS_KB_AREAS: KBArea[] = [
  ...SHARED_KB_AREAS,
  KBArea.MINDFULNESS_PRACTICAS_FORMALES,
  KBArea.MINDFULNESS_PRACTICAS_INFORMALES,
  KBArea.MINDFULNESS_APLICACIONES_CLINICAS,
];

/** Nombres legibles para UI */
export const KB_AREA_LABELS: Record<KBArea, string> = {
  // Compartidas
  [KBArea.CONOCIMIENTO]:            'Conocimiento y Fundamentos',
  [KBArea.OBJETIVOS_CLINICOS]:      'Objetivos Clínicos',
  [KBArea.HERRAMIENTAS_EVALUACION]: 'Herramientas de Evaluación',
  [KBArea.EJERCICIOS_TAREAS]:       'Ejercicios y Tareas',
  [KBArea.RECURSOS_MATERIALES]:     'Recursos y Materiales',
  [KBArea.TECNICAS_ESPECIFICAS]:    'Técnicas Específicas',
  [KBArea.ESTRUCTURA_SESIONES]:     'Estructura de Sesiones',
  [KBArea.BARRERAS]:                'Barreras',
  [KBArea.HABILIDADES_TERAPEUTA]:   'Habilidades del Terapeuta',
  [KBArea.SINTOMAS_PROBLEMAS]:      'Síntomas y Problemas',
  // AC
  [KBArea.AC_AREAS_VITALES]:            'Áreas Vitales (AC)',
  [KBArea.AC_VALORES_REFORZADORES]:     'Valores y Reforzadores (AC)',
  [KBArea.AC_ACTIVIDADES_POR_PROBLEMA]: 'Actividades por Problema (AC)',
  // RC
  [KBArea.RC_DISTORSIONES_COGNITIVAS]:   'Distorsiones Cognitivas (RC)',
  [KBArea.RC_REGISTRO_PENSAMIENTOS]:     'Registro de Pensamientos (RC)',
  [KBArea.RC_CREENCIAS_NUCLEARES]:       'Creencias Nucleares (RC)',
  [KBArea.RC_EXPERIMENTOS_CONDUCTUALES]: 'Experimentos Conductuales (RC)',
  // DS
  [KBArea.DS_JERARQUIA_ANSIEDAD]:        'Jerarquía de Ansiedad (DS)',
  [KBArea.DS_RELAJACION]:                'Relajación (DS)',
  [KBArea.DS_PROCESO_DESENSIBILIZACION]: 'Proceso de Desensibilización (DS)',
  // EXP
  [KBArea.EXP_JERARQUIA_EXPOSICION]:  'Jerarquía de Exposición (EXP)',
  [KBArea.EXP_PREVENCION_RESPUESTA]:  'Prevención de Respuesta (EXP)',
  [KBArea.EXP_PROCESO_EXPOSICION]:    'Proceso de Exposición (EXP)',
  // MC
  [KBArea.MC_ANALISIS_FUNCIONAL]:      'Análisis Funcional (MC)',
  [KBArea.MC_PROGRAMAS_REFORZAMIENTO]: 'Programas de Reforzamiento (MC)',
  [KBArea.MC_TECNICAS_OPERANTES]:      'Técnicas Operantes (MC)',
  // ACT
  [KBArea.ACT_HEXAFLEX]:            'Hexaflex — Procesos de Flexibilidad (ACT)',
  [KBArea.ACT_DEFUSION_COGNITIVA]:  'Defusión Cognitiva (ACT)',
  [KBArea.ACT_VALORES_ACCION]:      'Valores y Acción Comprometida (ACT)',
  // DC
  [KBArea.DC_REGULACION_EMOCIONAL]:       'Regulación Emocional (DC)',
  [KBArea.DC_TOLERANCIA_MALESTAR]:        'Tolerancia al Malestar (DC)',
  [KBArea.DC_EFECTIVIDAD_INTERPERSONAL]:  'Efectividad Interpersonal (DC)',
  // TREC
  [KBArea.TREC_CREENCIAS_IRRACIONALES]: 'Creencias Irracionales (TREC)',
  [KBArea.TREC_DISPUTACION]:            'Disputación (TREC)',
  [KBArea.TREC_MODELO_ABCDE]:           'Modelo ABC-DE (TREC)',
  // Mindfulness
  [KBArea.MINDFULNESS_PRACTICAS_FORMALES]:    'Prácticas Formales (Mindfulness)',
  [KBArea.MINDFULNESS_PRACTICAS_INFORMALES]:  'Prácticas Informales (Mindfulness)',
  [KBArea.MINDFULNESS_APLICACIONES_CLINICAS]: 'Aplicaciones Clínicas (Mindfulness)',
};

// ============================================================================
// Áreas transversales (shared/) — inventarios, crisis, entrevista
// ============================================================================

export enum SharedArea {
  HABILIDADES_ENTREVISTA = 'habilidades_entrevista',
  PROTOCOLO_CRISIS       = 'protocolo_crisis',
  INVENTARIOS_GENERALES  = 'inventarios_generales',
}

// ============================================================================
// Manifest — cada técnica registra uno
// ============================================================================

export interface TechniqueManifest {
  id: TechniqueId;
  nombre: string;
  descripcion: string;
  version: string;
  fuentes_principales: string[];
  /**
   * Lazy loaders — solo las áreas que esta técnica implementa.
   * Partial porque cada técnica tiene un subconjunto distinto de áreas.
   */
  areas: Partial<Record<KBArea, () => Promise<{ default: unknown }>>>;
}

// ============================================================================
// Slot de caché en el Zustand store
// ============================================================================

export type SlotStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AreaSlot<T = unknown> {
  data: T | null;
  status: SlotStatus;
  error: string | null;
  loadedAt: number | null;
}

/** Crea un slot vacío */
export function createEmptySlot<T = unknown>(): AreaSlot<T> {
  return { data: null, status: 'idle', error: null, loadedAt: null };
}
