/**
 * schemas.ts — Esquemas Zod para validación runtime de datos de conocimiento
 *
 * Incluye schemas para áreas compartidas, AC-específicas, RC-específicas y transversales.
 * Los campos 'tipo' de herramientas, ejercicios y recursos son z.string()
 * para permitir valores distintos por técnica.
 */

import { z } from 'zod';
import { KBArea, SharedArea } from './technique.types';

// ============================================================================
// Base schema
// ============================================================================

const baseAreaSchema = z.object({
  area_id: z.nativeEnum(KBArea),
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  fuentes: z.array(z.string()),
});

// ============================================================================
// Áreas compartidas
// ============================================================================

export const conocimientoSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.CONOCIMIENTO),
  fundamentos_teoricos: z.object({
    definicion: z.string().min(1),
    origenes_historicos: z.array(z.object({ autor: z.string(), aportacion: z.string() })),
    modelo_explicativo: z.string(),
    mecanismo_de_cambio: z.string(),
  }),
  principios_clave: z.array(z.object({ principio: z.string(), explicacion: z.string() })),
  evidencia_cientifica: z.object({
    metaanalisis: z.array(z.string()),
    eficacia_comparativa: z.string(),
    poblaciones_estudiadas: z.array(z.string()),
  }),
});

export const objetivosClinicosSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.OBJETIVOS_CLINICOS),
  indicaciones: z.array(z.object({
    trastorno: z.string(),
    nivel_evidencia: z.enum(['alta', 'moderada', 'emergente']),
    notas: z.string(),
  })),
  contraindicaciones: z.array(z.object({
    condicion: z.string(),
    razon: z.string(),
    alternativa: z.string(),
  })),
});

export const herramientasEvaluacionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.HERRAMIENTAS_EVALUACION),
  herramientas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    tipo: z.string(),
    proposito: z.string(),
    cuando_usar: z.string(),
    descripcion_formato: z.string(),
    variables: z.array(z.object({ nombre: z.string(), tipo: z.string(), instruccion: z.string() })).optional(),
    referencia_shared: z.string().optional(),
  })),
});

export const ejerciciosTareasSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.EJERCICIOS_TAREAS),
  ejercicios: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    tipo: z.string(),
    objetivo: z.string(),
    instrucciones: z.array(z.string()),
    frecuencia: z.string(),
    ejemplo: z.string(),
  })),
});

export const recursosMaterialesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.RECURSOS_MATERIALES),
  recursos: z.array(z.object({
    id: z.string(),
    tipo: z.string(),
    titulo: z.string(),
    autor: z.string(),
    descripcion: z.string(),
    uso_clinico: z.string(),
  })),
});

export const tecnicasEspecificasSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.TECNICAS_ESPECIFICAS),
  tecnicas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    descripcion: z.string(),
    cuando_usar: z.string(),
    pasos: z.array(z.string()),
    ejemplo_clinico: z.string(),
  })),
});

export const estructuraSesionesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.ESTRUCTURA_SESIONES),
  total_sesiones: z.string(),
  frecuencia: z.string(),
  bloques: z.array(z.object({
    nombre: z.string(),
    sesiones: z.string(),
    objetivos: z.array(z.string()),
    actividades_principales: z.array(z.string()),
  })),
});

export const barrerasSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.BARRERAS),
  barreras: z.array(z.object({
    nombre: z.string(),
    descripcion: z.string(),
    ejemplo_paciente: z.string(),
    estrategia_manejo: z.string(),
  })),
});

export const habilidadesTerapeutaSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.HABILIDADES_TERAPEUTA),
  habilidades: z.array(z.object({
    nombre: z.string(),
    descripcion: z.string(),
    importancia: z.string(),
    como_desarrollar: z.string(),
  })),
});

export const sintomasProblemasSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.SINTOMAS_PROBLEMAS),
  trastornos: z.array(z.object({
    nombre: z.string(),
    sintomas_principales: z.array(z.string()),
    como_se_manifiesta_en_conducta: z.string(),
    foco_intervencion: z.string(),
  })),
});

// ============================================================================
// Áreas específicas AC (motor conductual)
// ============================================================================

export const acAreasVitalesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.AC_AREAS_VITALES),
  areas_vitales: z.array(z.object({
    nombre: z.string(),
    descripcion: z.string(),
    actividades_ejemplo: z.array(z.string()),
  })),
});

export const acValoresReforzadoresSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.AC_VALORES_REFORZADORES),
  objetivos_terapeuticos: z.array(z.object({ objetivo: z.string(), descripcion: z.string() })),
  valores_nucleares: z.array(z.object({ valor: z.string(), definicion: z.string() })),
});

export const acActividadesPorProblemaSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.AC_ACTIVIDADES_POR_PROBLEMA),
  problemas: z.array(z.object({
    nombre: z.string(),
    principios_intervencion: z.array(z.string()),
    actividades: z.array(z.object({
      nombre: z.string(),
      descripcion: z.string(),
      justificacion: z.string(),
      jerarquia: z.array(z.object({ nivel: z.number(), actividad: z.string(), dificultad: z.number() })),
    })),
  })),
});

// ============================================================================
// Áreas específicas RC (motor cognitivo)
// ============================================================================

export const rcDistorsionesCognitivasSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.RC_DISTORSIONES_COGNITIVAS),
  distorsiones: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    definicion: z.string(),
    ejemplo: z.string(),
    pregunta_socratica: z.string(),
  })),
});

export const rcRegistroPensamientosSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.RC_REGISTRO_PENSAMIENTOS),
  formatos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    columnas: z.array(z.object({ nombre: z.string(), descripcion: z.string(), instruccion: z.string() })),
    cuando_usar: z.string(),
    ejemplo_completo: z.record(z.string(), z.string()),
  })),
});

export const rcCreenciasNuclearesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.RC_CREENCIAS_NUCLEARES),
  categorias: z.array(z.object({
    nombre: z.string(),
    descripcion: z.string(),
    creencias_ejemplo: z.array(z.string()),
    supuestos_intermedios: z.array(z.string()),
    estrategias_modificacion: z.array(z.string()),
  })),
});

export const rcExperimentosConductualesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.RC_EXPERIMENTOS_CONDUCTUALES),
  experimentos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    creencia_objetivo: z.string(),
    hipotesis: z.string(),
    procedimiento: z.array(z.string()),
    criterio_evaluacion: z.string(),
    ejemplo_clinico: z.string(),
  })),
});

// ============================================================================
// Áreas específicas DS (desensibilización sistemática)
// ============================================================================

export const dsJerarquiaAnsiedadSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.DS_JERARQUIA_ANSIEDAD),
  conceptos_clave: z.array(z.object({ concepto: z.string(), explicacion: z.string() })),
  reglas_construccion: z.array(z.string()),
  ejemplo_jerarquia: z.array(z.object({
    fobia: z.string(),
    items: z.array(z.object({ posicion: z.number(), descripcion: z.string(), usa: z.number() })),
  })),
});

export const dsRelajacionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.DS_RELAJACION),
  tecnicas_relajacion: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    descripcion: z.string(),
    pasos: z.array(z.string()),
    duracion: z.string(),
    indicaciones: z.string(),
  })),
  criterio_dominio: z.string(),
});

export const dsProcesoDesensibilizacionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.DS_PROCESO_DESENSIBILIZACION),
  fases_sesion: z.array(z.object({
    fase: z.string(),
    descripcion: z.string(),
    instrucciones_terapeuta: z.array(z.string()),
    duracion_aproximada: z.string(),
  })),
  criterio_exito: z.string(),
  manejo_ansiedad: z.array(z.object({
    escenario: z.string(),
    respuesta_terapeuta: z.string(),
  })),
  entrenamiento_sensorial: z.array(z.object({
    modalidad: z.string(),
    descripcion: z.string(),
    ejemplo: z.string(),
  })),
});

// ============================================================================
// Áreas específicas EXP (terapia de exposición)
// ============================================================================

export const expJerarquiaExposicionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.EXP_JERARQUIA_EXPOSICION),
  modalidades_exposicion: z.array(z.object({
    modalidad: z.string(),
    descripcion: z.string(),
    cuando_usar: z.string(),
    ejemplo: z.string(),
  })),
  reglas_construccion: z.array(z.string()),
  ejemplo_jerarquia: z.array(z.object({
    trastorno: z.string(),
    modalidad: z.string(),
    items: z.array(z.object({ posicion: z.number(), descripcion: z.string(), usa: z.number() })),
  })),
});

export const expPrevencionRespuestaSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.EXP_PREVENCION_RESPUESTA),
  conceptos_clave: z.array(z.object({ concepto: z.string(), explicacion: z.string() })),
  tipos_conducta_seguridad: z.array(z.object({
    tipo: z.string(),
    descripcion: z.string(),
    ejemplos: z.array(z.string()),
    estrategia_eliminacion: z.string(),
  })),
  protocolo_prevencion: z.array(z.string()),
});

export const expProcesoExposicionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.EXP_PROCESO_EXPOSICION),
  fases_sesion: z.array(z.object({
    fase: z.string(),
    descripcion: z.string(),
    instrucciones_terapeuta: z.array(z.string()),
    duracion_aproximada: z.string(),
  })),
  criterio_exito: z.string(),
  modelos_teoricos: z.array(z.object({
    modelo: z.string(),
    descripcion: z.string(),
    implicacion_clinica: z.string(),
  })),
  manejo_dificultades: z.array(z.object({
    escenario: z.string(),
    respuesta_terapeuta: z.string(),
  })),
});

// ============================================================================
// Áreas específicas MC (modificación de conducta)
// ============================================================================

export const mcAnalisisFuncionalSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.MC_ANALISIS_FUNCIONAL),
  componentes_abc: z.array(z.object({
    componente: z.string(),
    definicion: z.string(),
    ejemplos: z.array(z.string()),
    preguntas_evaluacion: z.array(z.string()),
  })),
  tipos_contingencia: z.array(z.object({
    tipo: z.string(),
    descripcion: z.string(),
    efecto_conducta: z.string(),
    ejemplo: z.string(),
  })),
  guia_formulacion: z.array(z.string()),
});

export const mcProgramasReforzamientoSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.MC_PROGRAMAS_REFORZAMIENTO),
  programas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    descripcion: z.string(),
    tipo_reforzamiento: z.string(),
    procedimiento: z.array(z.string()),
    indicaciones: z.string(),
    ejemplo_clinico: z.string(),
  })),
  tipos_reforzadores: z.array(z.object({
    tipo: z.string(),
    descripcion: z.string(),
    ejemplos: z.array(z.string()),
    consideraciones: z.string(),
  })),
});

export const mcTecnicasOperantesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.MC_TECNICAS_OPERANTES),
  tecnicas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    principio_base: z.string(),
    descripcion: z.string(),
    pasos: z.array(z.string()),
    cuando_usar: z.string(),
    ejemplo_clinico: z.string(),
  })),
  consideraciones_eticas: z.array(z.object({
    tema: z.string(),
    directriz: z.string(),
  })),
});

// ============================================================================
// Áreas específicas ACT (flexibilidad psicológica)
// ============================================================================

export const actHexaflexSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.ACT_HEXAFLEX),
  procesos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    polo_inflexible: z.string(),
    polo_flexible: z.string(),
    descripcion: z.string(),
    indicadores_inflexibilidad: z.array(z.string()),
    estrategias: z.array(z.string()),
    ejemplo_clinico: z.string(),
  })),
});

export const actDefusionCognitivaSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.ACT_DEFUSION_COGNITIVA),
  tecnicas_defusion: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    tipo: z.string(),
    objetivo: z.string(),
    instrucciones: z.array(z.string()),
    duracion_aproximada: z.string(),
    indicaciones: z.array(z.string()),
    ejemplo: z.string(),
  })),
});

export const actValoresAccionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.ACT_VALORES_ACCION),
  dominios_valores: z.array(z.object({
    dominio: z.string(),
    preguntas_exploracion: z.array(z.string()),
    ejemplo_valores: z.array(z.string()),
  })),
  herramientas_clarificacion: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    instrucciones: z.array(z.string()),
  })),
  plan_accion_comprometida: z.object({
    pasos: z.array(z.string()),
    criterio_compromiso: z.string(),
  }),
});

// ============================================================================
// Áreas específicas DC (terapia dialéctico conductual)
// ============================================================================

export const dcRegulacionEmocionalSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.DC_REGULACION_EMOCIONAL),
  modelo_emocion: z.object({
    componentes: z.array(z.string()),
    funcion_emociones: z.string(),
  }),
  habilidades: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    acronimo: z.string().optional(),
    objetivo: z.string(),
    pasos: z.array(z.string()),
    cuando_usar: z.string(),
    ejemplo_clinico: z.string(),
  })),
});

export const dcToleranciaMalestarSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.DC_TOLERANCIA_MALESTAR),
  habilidades_crisis: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    acronimo: z.string(),
    componentes: z.array(z.object({ letra: z.string(), significado: z.string(), instruccion: z.string() })),
    intensidad: z.string(),
    duracion: z.string(),
  })),
  habilidades_aceptacion: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    descripcion: z.string(),
    ejercicio: z.string(),
  })),
});

export const dcEfectividadInterpersonalSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.DC_EFECTIVIDAD_INTERPERSONAL),
  modelos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    acronimo: z.string(),
    objetivo: z.string(),
    componentes: z.array(z.object({ letra: z.string(), significado: z.string(), ejemplo: z.string() })),
  })),
  factores_contextuales: z.array(z.object({
    factor: z.string(),
    descripcion: z.string(),
    como_evaluar: z.string(),
  })),
});

// ============================================================================
// Áreas específicas TREC (terapia racional emotiva conductual)
// ============================================================================

export const trecCreenciasIrracionalesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.TREC_CREENCIAS_IRRACIONALES),
  clasificacion_ellis: z.object({
    demandas: z.array(z.string()),
    derivaciones: z.array(z.string()),
  }),
  creencias_irracionales: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    tipo: z.string(),
    descripcion: z.string(),
    alternativa_racional: z.string(),
    ejemplo: z.string(),
    preguntas_deteccion: z.array(z.string()),
  })),
});

export const trecDisputacionSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.TREC_DISPUTACION),
  tipos_disputacion: z.array(z.object({
    id: z.string(),
    tipo: z.string(),
    descripcion: z.string(),
    preguntas_tipo: z.array(z.string()),
    ejemplo_dialogo: z.array(z.object({ terapeuta: z.string(), paciente: z.string() })),
  })),
  estrategias_avanzadas: z.array(z.object({
    nombre: z.string(),
    cuando_usar: z.string(),
    procedimiento: z.array(z.string()),
  })),
});

export const trecModeloABCDESchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.TREC_MODELO_ABCDE),
  componentes: z.array(z.object({
    letra: z.string(),
    nombre: z.string(),
    descripcion: z.string(),
    preguntas_guia: z.array(z.string()),
  })),
  formatos_registro: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    columnas: z.array(z.string()),
    ejemplo_completo: z.record(z.string(), z.string()),
    cuando_usar: z.string(),
  })),
});

// ============================================================================
// Áreas específicas Mindfulness (mindfulness terapéutico)
// ============================================================================

export const mindfulnessPracticasFormalesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.MINDFULNESS_PRACTICAS_FORMALES),
  practicas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    duracion: z.string(),
    postura: z.string(),
    instrucciones: z.array(z.string()),
    variaciones: z.array(z.string()),
    indicaciones: z.array(z.string()),
    contraindicaciones: z.array(z.string()),
  })),
  progresion_sugerida: z.array(z.object({
    fase: z.string(),
    semanas: z.string(),
    practicas_recomendadas: z.array(z.string()),
    duracion_sesion: z.string(),
  })),
});

export const mindfulnessPracticasInformalesSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.MINDFULNESS_PRACTICAS_INFORMALES),
  practicas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    contexto: z.string(),
    instrucciones_breves: z.array(z.string()),
    frecuencia_sugerida: z.string(),
    adaptaciones: z.array(z.string()),
  })),
  integracion_cotidiana: z.object({
    principios: z.array(z.string()),
    actividades_ancla: z.array(z.string()),
  }),
});

export const mindfulnessAplicacionesClinicasSchema = baseAreaSchema.extend({
  area_id: z.literal(KBArea.MINDFULNESS_APLICACIONES_CLINICAS),
  aplicaciones: z.array(z.object({
    trastorno: z.string(),
    protocolo: z.string(),
    adaptaciones: z.array(z.string()),
    evidencia: z.string(),
    precauciones: z.array(z.string()),
  })),
  programas_estructurados: z.array(z.object({
    nombre: z.string(),
    autor: z.string(),
    duracion: z.string(),
    estructura: z.string(),
    poblacion_objetivo: z.string(),
  })),
});

// ============================================================================
// Map de área → schema (Partial: solo las áreas que existen tienen schema)
// ============================================================================

export const AREA_SCHEMAS: Partial<Record<KBArea, z.ZodType>> = {
  // Compartidas
  [KBArea.CONOCIMIENTO]:            conocimientoSchema,
  [KBArea.OBJETIVOS_CLINICOS]:      objetivosClinicosSchema,
  [KBArea.HERRAMIENTAS_EVALUACION]: herramientasEvaluacionSchema,
  [KBArea.EJERCICIOS_TAREAS]:       ejerciciosTareasSchema,
  [KBArea.RECURSOS_MATERIALES]:     recursosMaterialesSchema,
  [KBArea.TECNICAS_ESPECIFICAS]:    tecnicasEspecificasSchema,
  [KBArea.ESTRUCTURA_SESIONES]:     estructuraSesionesSchema,
  [KBArea.BARRERAS]:                barrerasSchema,
  [KBArea.HABILIDADES_TERAPEUTA]:   habilidadesTerapeutaSchema,
  [KBArea.SINTOMAS_PROBLEMAS]:      sintomasProblemasSchema,
  // AC
  [KBArea.AC_AREAS_VITALES]:            acAreasVitalesSchema,
  [KBArea.AC_VALORES_REFORZADORES]:     acValoresReforzadoresSchema,
  [KBArea.AC_ACTIVIDADES_POR_PROBLEMA]: acActividadesPorProblemaSchema,
  // RC
  [KBArea.RC_DISTORSIONES_COGNITIVAS]:   rcDistorsionesCognitivasSchema,
  [KBArea.RC_REGISTRO_PENSAMIENTOS]:     rcRegistroPensamientosSchema,
  [KBArea.RC_CREENCIAS_NUCLEARES]:       rcCreenciasNuclearesSchema,
  [KBArea.RC_EXPERIMENTOS_CONDUCTUALES]: rcExperimentosConductualesSchema,
  // DS
  [KBArea.DS_JERARQUIA_ANSIEDAD]:        dsJerarquiaAnsiedadSchema,
  [KBArea.DS_RELAJACION]:                dsRelajacionSchema,
  [KBArea.DS_PROCESO_DESENSIBILIZACION]: dsProcesoDesensibilizacionSchema,
  // EXP
  [KBArea.EXP_JERARQUIA_EXPOSICION]:  expJerarquiaExposicionSchema,
  [KBArea.EXP_PREVENCION_RESPUESTA]:  expPrevencionRespuestaSchema,
  [KBArea.EXP_PROCESO_EXPOSICION]:    expProcesoExposicionSchema,
  // MC
  [KBArea.MC_ANALISIS_FUNCIONAL]:      mcAnalisisFuncionalSchema,
  [KBArea.MC_PROGRAMAS_REFORZAMIENTO]: mcProgramasReforzamientoSchema,
  [KBArea.MC_TECNICAS_OPERANTES]:      mcTecnicasOperantesSchema,
  // ACT
  [KBArea.ACT_HEXAFLEX]:            actHexaflexSchema,
  [KBArea.ACT_DEFUSION_COGNITIVA]:  actDefusionCognitivaSchema,
  [KBArea.ACT_VALORES_ACCION]:      actValoresAccionSchema,
  // DC
  [KBArea.DC_REGULACION_EMOCIONAL]:       dcRegulacionEmocionalSchema,
  [KBArea.DC_TOLERANCIA_MALESTAR]:        dcToleranciaMalestarSchema,
  [KBArea.DC_EFECTIVIDAD_INTERPERSONAL]:  dcEfectividadInterpersonalSchema,
  // TREC
  [KBArea.TREC_CREENCIAS_IRRACIONALES]: trecCreenciasIrracionalesSchema,
  [KBArea.TREC_DISPUTACION]:            trecDisputacionSchema,
  [KBArea.TREC_MODELO_ABCDE]:           trecModeloABCDESchema,
  // Mindfulness
  [KBArea.MINDFULNESS_PRACTICAS_FORMALES]:    mindfulnessPracticasFormalesSchema,
  [KBArea.MINDFULNESS_PRACTICAS_INFORMALES]:  mindfulnessPracticasInformalesSchema,
  [KBArea.MINDFULNESS_APLICACIONES_CLINICAS]: mindfulnessAplicacionesClinicasSchema,
};

// ============================================================================
// Schemas para transversales (shared/)
// ============================================================================

export const inventariosGeneralesSchema = z.object({
  area_id: z.literal(SharedArea.INVENTARIOS_GENERALES),
  nombre: z.string(),
  descripcion: z.string(),
  inventarios: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    siglas: z.string(),
    autor: z.string(),
    proposito: z.string(),
    poblacion_objetivo: z.string(),
    numero_items: z.number(),
    tiempo_aplicacion: z.string(),
    escalas: z.array(z.string()),
    puntos_corte: z.array(z.object({ rango: z.string(), interpretacion: z.string() })).optional(),
    notas: z.string(),
  })),
});

export const protocoloCrisisSchema = z.object({
  area_id: z.literal(SharedArea.PROTOCOLO_CRISIS),
  nombre: z.string(),
  descripcion: z.string(),
  senales_alarma: z.array(z.string()),
  pasos_intervencion: z.array(z.object({ paso: z.number(), accion: z.string(), detalle: z.string() })),
  recursos_emergencia: z.array(z.object({ recurso: z.string(), contacto: z.string() })),
  contraindicaciones: z.array(z.string()),
});

export const habilidadesEntrevistaSchema = z.object({
  area_id: z.literal(SharedArea.HABILIDADES_ENTREVISTA),
  nombre: z.string(),
  descripcion: z.string(),
  fuentes: z.array(z.string()),
  habilidades: z.array(z.object({
    nombre: z.string(),
    categoria: z.enum(['escucha', 'pregunta', 'reflejo', 'confrontacion', 'rapport']),
    descripcion: z.string(),
    ejemplo: z.string(),
    cuando_usar: z.string(),
  })),
});

export const SHARED_SCHEMAS: Record<SharedArea, z.ZodType> = {
  [SharedArea.INVENTARIOS_GENERALES]:  inventariosGeneralesSchema,
  [SharedArea.PROTOCOLO_CRISIS]:       protocoloCrisisSchema,
  [SharedArea.HABILIDADES_ENTREVISTA]: habilidadesEntrevistaSchema,
};
