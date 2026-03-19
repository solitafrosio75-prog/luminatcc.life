/**
 * techniqueData.ts — Perfiles clínicos estructurados de técnicas TCC / Ingeniería Conductual.
 *
 * Cada TechniqueProfile es un objeto completamente tipado con:
 *  · definition + mechanism  — qué es y por qué funciona
 *  · steps[]                 — guía paso a paso con perlas clínicas y ejemplos
 *  · evaluation              — criterios, instrumentos y tiempos de evaluación
 *  · resources[]             — hojas de registro, escalas, protocolos
 *  · indications[]           — cuándo usarla
 *  · contraindications[]     — cuándo NO usarla
 *  · outcomes[]              — resultados objetivos por dominio
 *  · organizingVars[]        — variables moduladoras orgánicas
 *  · visual                  — tipo de diagrama para el panel gráfico
 *
 * Referencias base: Cooper et al. (2007) ABA · Beck (1979) · Barlow (2007) ·
 * D'Zurilla & Goldfried (1971) · Hayes (1999) · Linehan (1993)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type TechniqueCategory =
  | 'analisis_conductual'
  | 'reestructuracion_cognitiva'
  | 'exposicion'
  | 'activacion_conductual'
  | 'regulacion_emocional'
  | 'ingenieria_conductual'
  | 'mindfulness_aceptacion'
  | 'relajacion'
  | 'resolucion_problemas'
  | 'habilidades';

export type TechniqueTradition =
  | 'TCC' | 'ACT' | 'DBT' | 'ABA' | 'Conductual' | 'Mindfulness' | 'Tercera Generación';

export type TechniqueVisual =
  | 'abc_flow'
  | 'exposure_ladder'
  | 'thought_record'
  | 'ba_schedule'
  | 'problem_solving_flow'
  | 'cost_benefit_matrix'
  | 'shaping_chain'
  | 'chain_analysis';

export interface TechniqueStep {
  n:          number;
  title:      string;
  body:       string;
  tip?:       string;      // Perla clínica / error frecuente
  example?:   string;      // Ejemplo clínico
  substeps?:  string[];    // Sub-pasos si aplica
}

export interface TechniqueResource {
  type: 'hoja_registro' | 'escala' | 'checklist' | 'protocolo' | 'cuestionario';
  name: string;
  abbr?: string;
  desc: string;
}

export interface OutcomeVar {
  domain: string;
  items:  string[];
}

export interface OrganismicVar {
  category: string;
  items:    string[];
}

export interface TechniqueEvaluation {
  process:     string;
  criteria:    string[];
  instruments: TechniqueResource[];
  timeline:    string;
  followUp?:   string;
}

export interface TechniqueProfile {
  id:               string;
  name:             string;
  abbr?:            string;
  tagline:          string;
  category:         TechniqueCategory;
  traditions:       TechniqueTradition[];
  difficulty:       1 | 2 | 3;
  sessionCount:     string;
  summary:          string;
  tags:             string[];
  definition:       string;
  mechanism:        string;
  steps:            TechniqueStep[];
  evaluation:       TechniqueEvaluation;
  resources:        TechniqueResource[];
  indications:      string[];
  contraindications: string[];
  outcomes:         OutcomeVar[];
  organizingVars:   OrganismicVar[];
  references:       string[];
  visual?:          TechniqueVisual;
  status:           'complete' | 'draft';
}

// ── Category metadata (for UI) ────────────────────────────────────────────────

export const TECH_CAT_META: Record<TechniqueCategory, { label: string; color: string; badge: string }> = {
  analisis_conductual:    { label: 'Análisis Conductual',   color: '#d97706', badge: 'bg-amber-950/50 text-amber-400 border-amber-900/50' },
  reestructuracion_cognitiva: { label: 'Reestructuración Cog.', color: '#3b82f6', badge: 'bg-blue-950/50 text-blue-400 border-blue-900/50' },
  exposicion:             { label: 'Exposición',             color: '#f97316', badge: 'bg-orange-950/50 text-orange-400 border-orange-900/50' },
  activacion_conductual:  { label: 'Activación Conductual', color: '#10b981', badge: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' },
  regulacion_emocional:   { label: 'Regulación Emocional',  color: '#ec4899', badge: 'bg-pink-950/50 text-pink-400 border-pink-900/50' },
  ingenieria_conductual:  { label: 'Ingeniería Conductual', color: '#8b5cf6', badge: 'bg-purple-950/50 text-purple-400 border-purple-900/50' },
  mindfulness_aceptacion: { label: 'Mindfulness / ACT',     color: '#14b8a6', badge: 'bg-teal-950/50 text-teal-400 border-teal-900/50' },
  relajacion:             { label: 'Relajación',             color: '#06b6d4', badge: 'bg-cyan-950/50 text-cyan-400 border-cyan-900/50' },
  resolucion_problemas:   { label: 'Resolución de Problemas',color: '#6366f1', badge: 'bg-indigo-950/50 text-indigo-400 border-indigo-900/50' },
  habilidades:            { label: 'Habilidades',            color: '#f43f5e', badge: 'bg-rose-950/50 text-rose-400 border-rose-900/50' },
};

// ════════════════════════════════════════════════════════════════════════════════
//  TÉCNICAS
// ════════════════════════════════════════════════════════════════════════════════

export const TECHNIQUE_PROFILES: TechniqueProfile[] = [

  // ── 01 ─────────────────────────────────────────────────────────────────────
  {
    id:           'afc',
    name:         'Análisis Funcional de la Conducta',
    abbr:         'AFC',
    tagline:      'Toda conducta tiene una función. El cambio real comienza cuando se identifica el para qué.',
    category:     'analisis_conductual',
    traditions:   ['ABA', 'Conductual', 'TCC'],
    difficulty:   2,
    sessionCount: '2-3 sesiones de evaluación + continuo',
    summary:      'Procedimiento diagnóstico central del análisis conductual que identifica las variables ambientales y orgánicas que controlan una conducta-problema, determinando su función. No describe el QUÉ de la conducta sino el POR QUÉ se mantiene.',
    tags:         ['ABC', 'función', 'refuerzo', 'antecedente', 'consecuencia', 'ABA', 'ingeniería conductual', 'línea base', 'hipótesis funcional'],

    definition: `El AFC es el procedimiento de evaluación funcional central del análisis conductual aplicado (ABA). Su objetivo es identificar la relación funcional entre una conducta y las variables ambientales y orgánicas que la controlan, determinando qué consecuencias MANTIENEN la conducta (no qué la originó).

El AFC parte de una premisa fundamental: la topografía (forma) de una conducta es irrelevante para su tratamiento — lo que importa es su FUNCIÓN. Dos conductas idénticas en apariencia pueden estar mantenidas por funciones completamente diferentes y requerir intervenciones opuestas.

Las cuatro funciones conductuales reconocidas por la literatura son: (1) acceso a atención social, (2) escape/evitación de estímulos aversivos, (3) acceso a tangibles o actividades preferidas, y (4) estimulación sensorial automática.`,

    mechanism: `El AFC se fundamenta en el modelo de condicionamiento operante de Skinner (1938): las conductas son seleccionadas por sus consecuencias. Una conducta aumenta en frecuencia si genera consecuencias reforzantes (refuerzo positivo: obtiene algo; refuerzo negativo: elimina algo aversivo) y disminuye si genera consecuencias aversivas (castigo).

Modelo operativo A-B-C-CE:
• A (Antecedente): estímulo discriminativo que señala disponibilidad del refuerzo
• B (Behavior/Conducta): la respuesta observable y medible
• C inmediata: consecuencia que refuerza o castiga la conducta
• CE (Consecuencia demorada): impacto a largo plazo

Las Setting Events u Operaciones de Establecimiento (Michaels, 1993) modifican temporalmente el valor reforzante de las consecuencias. Ejemplo: privación de sueño aumenta el valor reforzante de la evitación de tareas; dolor físico aumenta el refuerzo de la atención social.

La identificación de la función no se logra observando la conducta aislada — se logra manipulando experimentalmente antecedentes y consecuencias para ver qué cambia la frecuencia.`,

    steps: [
      {
        n: 1,
        title: 'Definición Operacional de la Conducta',
        body: 'Describir la conducta-problema en términos observables, medibles y sin ambigüedad interpretativa. La definición operacional permite que dos observadores independientes lleguen al mismo resultado al medir.',
        tip: 'NO: "es agresivo" — SÍ: "golpea con la palma abierta a otra persona en el torso o cabeza". NO: "está ansioso" — SÍ: "abandona la sala o evita el contacto visual durante más de 5 minutos consecutivos".',
        example: 'Conducta-problema: "Jaime lanza objetos (libros, lápices, tazas) de peso menor a 500g hacia otras personas cuando se le solicita una tarea académica, con una frecuencia de 2-4 veces por sesión de 45 minutos."',
        substeps: [
          'Identificar la topografía: qué hace exactamente (forma de la conducta)',
          'Medir parámetros: frecuencia (nº de ocurrencias), duración (segundos/minutos), intensidad (fuerza/impacto), latencia (tiempo desde el antecedente hasta la conducta)',
          'Establecer criterios de inicio y fin del episodio conductual',
          'Verificar con dos observadores independientes (acuerdo inter-observador > 80%)',
        ],
      },
      {
        n: 2,
        title: 'Registro de Línea de Base',
        body: 'Recopilar datos de la conducta ANTES de cualquier intervención, en condiciones naturales. La línea de base es el punto de referencia para evaluar el efecto de la intervención.',
        tip: 'La línea de base requiere al menos 3-5 mediciones estables (sin tendencia ni variabilidad excesiva) antes de iniciar intervención. Una línea de base inestable imposibilita saber si la intervención funcionó.',
        example: 'Registro ABC durante 2 semanas: 3 episodios el lunes (tarea de matemáticas), 0 el martes (tiempo libre), 4 el miércoles (tarea de lectura). Patrón ya visible.',
        substeps: [
          'Hoja ABC: registrar cada episodio con fecha, hora, antecedente inmediato, descripción de la conducta, consecuencia inmediata',
          'Scatter Plot: grilla temporal (horas × días) marcando si ocurrió o no la conducta — identifica patrones horarios/contextuales',
          'Registrar setting events del día: privación de sueño, cambios en rutina, conflictos previos, estado de salud',
          'Calcular media diaria/semanal y representar gráficamente',
        ],
      },
      {
        n: 3,
        title: 'Análisis de Antecedentes',
        body: 'Identificar sistemáticamente los estímulos que preceden y "disparan" la conducta. Distinguir entre antecedentes inmediatos (estímulos discriminativos) y remotos (setting events que alteran la probabilidad).',
        tip: 'Los setting events son el factor más subestimado. Un paciente que normalmente tolera las críticas puede reaccionar con evitación intensa si llegó con dolor de cabeza o sin dormir — esto no es "inconsistencia" sino un setting event modificando la función.',
        example: 'Antecedentes inmediatos identificados: presentación de tarea académica difícil, corrección de errores frente a otros, solicitud de esperar su turno. Setting events: días con menos de 6h de sueño, ayuno de más de 4h, mañanas después de conflicto familiar.',
        substeps: [
          'Antecedentes inmediatos: ¿Qué estímulo específico precede la conducta? (personas, demandas, transiciones, materiales)',
          'Setting events biológicos: estado de salud, privación de sueño, alimentación, medicación',
          'Setting events sociales: conflictos previos, cambios en el entorno, personas presentes/ausentes',
          'Setting events contextuales: ruido, temperatura, cambios en rutina',
          'Preguntar: "¿En qué situaciones NUNCA ocurre esta conducta?" — identifica condiciones que la inhiben',
        ],
      },
      {
        n: 4,
        title: 'Análisis de Consecuencias',
        body: 'Identificar qué ocurre INMEDIATAMENTE después de la conducta (dentro de los primeros 30 segundos). Las consecuencias relevantes son las que mantienen la conducta, no las deseadas o intencionales.',
        tip: 'El mayor error clínico: confundir consecuencias INTENCIONALES con consecuencias FUNCIONALES. Un "castigo" que no reduce la conducta no es funcionalmente un castigo — es un refuerzo disfrazado. Si la conducta continúa, algo en el entorno la está reforzando.',
        example: 'Tras lanzar el objeto, el terapeuta interrumpe la tarea y dedica atención a calmarlo (refuerzo positivo: atención) Y la tarea es retirada (refuerzo negativo: escape). La conducta está doblemente reforzada.',
        substeps: [
          'Consecuencias inmediatas: ¿qué obtiene (atención, escape, tangible, sensación)?',
          'Consecuencias naturales vs. programadas: ¿qué haría el entorno sin intervención terapéutica?',
          'Evaluar si las consecuencias actúan como R+ (aumentan conducta), R- (aumentan conducta por escape) o castigo (reducen conducta)',
          'Verificar: ¿la conducta aumentó, se mantuvo o redujo con las consecuencias actuales? Los datos responden.',
        ],
      },
      {
        n: 5,
        title: 'Identificación de la Función Conductual',
        body: 'Determinar qué necesidad satisface la conducta o qué condición aversiva evita. Las cuatro funciones básicas son: atención, escape, acceso a tangibles y estimulación automática.',
        tip: 'Una conducta puede tener MÚLTIPLES funciones (escape de la tarea Y obtención de atención simultáneamente). El AFC debe identificar todas las funciones activas para diseñar una intervención completa.',
        substeps: [
          'Atención (+): la conducta ocurre cuando hay poco contacto social y/o cuando genera atención del entorno',
          'Escape (−): la conducta ocurre ante demandas/estímulos aversivos y resulta en su eliminación o reducción',
          'Acceso a tangibles (+): la conducta ocurre cuando un objeto o actividad deseada está restringida',
          'Estimulación automática: la conducta ocurre en todas las condiciones, incluso en ausencia de otras personas (función sensorial interna)',
        ],
      },
      {
        n: 6,
        title: 'Formulación de la Hipótesis Funcional',
        body: 'Redactar formalmente la relación funcional identificada. La hipótesis es el mapa que guía el tratamiento.',
        example: 'Hipótesis: "La conducta de lanzar objetos de Jaime ocurre principalmente en contextos de demanda académica difícil (antecedente), especialmente los días con privación de sueño (setting event), y es mantenida por refuerzo negativo (escape de la tarea) y refuerzo positivo contingente de atención individualizada (C inmediata). La función predominante es escape."',
        tip: 'Una buena hipótesis funcional es falsificable: predice en qué condiciones aumentará y en cuáles disminuirá la conducta. Si es demasiado vaga para hacer predicciones, no sirve como guía de intervención.',
      },
      {
        n: 7,
        title: 'Verificación Experimental de la Hipótesis',
        body: 'Manipular experimentalmente antecedentes o consecuencias para confirmar o refutar la hipótesis. Si la hipótesis es correcta, modificar el A o el C debe cambiar la frecuencia de B.',
        tip: 'En clínica ambulatoria, la verificación suele ser analógica o cuasiexperimental (no el análisis funcional experimental puro de Iwata). Basta con modificar sistemáticamente una variable por vez y registrar el efecto.',
        substeps: [
          'Condición de escape: presentar y retirar la tarea ante la conducta → ¿aumenta la conducta?',
          'Condición de atención: ignorar la conducta vs. dar atención → ¿cambia la frecuencia?',
          'Condición de acceso: restringir el tangible → ¿aumenta la conducta antes del acceso?',
          'Condición de control (no intervención): conducta en línea de base',
        ],
      },
      {
        n: 8,
        title: 'Diseño de la Intervención Basada en la Función',
        body: 'Construir un plan de intervención que modifique los antecedentes, las consecuencias O ambos, siempre basado en la función identificada. NUNCA tratar la topografía — siempre la función.',
        tip: 'Error clásico: usar extinción (no reforzar la conducta) sin enseñar una conducta alternativa funcionalmente equivalente. La extinción sin CAE genera una "explosión de extinción" (aumento inicial de la conducta) y suele fallar.',
        substeps: [
          'Modificación de antecedentes: reducir el valor reforzante del escape (graduar la dificultad, apoyos preventivos)',
          'Enseñanza de Conducta Alternativa Equivalente (CAE): una conducta socialmente aceptable que obtiene el MISMO refuerzo',
          'Modificación de consecuencias: extinción de la función inadaptada + refuerzo diferencial de la CAE',
          'Refuerzo diferencial: DRI (de conducta incompatible), DRA (de conducta alternativa), DRO (de otra conducta)',
          'Planes de generalización: aplicar en diferentes contextos y personas',
        ],
      },
      {
        n: 9,
        title: 'Implementación y Monitoreo',
        body: 'Ejecutar el plan de intervención con registro sistemático continuo. Los datos de monitoreo son la única evidencia de que la intervención funciona.',
        tip: 'La implementación inconsistente es el factor de fracaso más frecuente. Si el plan no puede aplicarse con >80% de fidelidad, revisar la complejidad del plan antes de concluir que la intervención no funciona.',
        substeps: [
          'Mantener registro ABC durante la intervención (mismo formato que línea de base)',
          'Calcular y graficar frecuencia semanalmente',
          'Verificar fidelidad de implementación (¿se está aplicando como fue diseñada?)',
          'Reuniones semanales de supervisión para ajustes',
        ],
      },
      {
        n: 10,
        title: 'Evaluación de Resultados y Ajuste',
        body: 'Comparar los datos de intervención con la línea de base. Criterio mínimo de éxito: reducción del 50% en la conducta-problema Y aumento sostenido de la CAE.',
        substeps: [
          'Comparar gráficamente línea de base vs. intervención',
          'Si no hay reducción en 2-3 semanas: revisar hipótesis funcional, verificar fidelidad de implementación',
          'Si hay reducción: programar generalización y retirada gradual de apoyos artificiales',
          'Seguimiento a 1, 3 y 6 meses',
        ],
      },
    ],

    evaluation: {
      process: 'Monitoreo continuo con registro ABC a lo largo de toda la intervención. Los datos son el único árbitro de efectividad — no la impresión clínica ni el reporte subjetivo del paciente.',
      criteria: [
        'Reducción ≥50% en frecuencia/duración de la conducta-problema vs. línea de base',
        'Aumento sostenido (≥2 semanas) de la Conducta Alternativa Equivalente (CAE)',
        'Hipótesis funcional confirmada: modificar el antecedente o consecuencia hipotizado cambia la conducta',
        'Generalización: reducción mantenida en al menos 2 contextos distintos al de intervención',
        'Mantenimiento: reducción sostenida a las 4 semanas de retiro del plan activo',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'ABC Chart',                   abbr: 'ABC',  desc: 'Hoja de registro de Antecedente-Conducta-Consecuencia para observación directa. Una fila por episodio conductual.' },
        { type: 'hoja_registro', name: 'Scatter Plot',                              desc: 'Grilla temporal (horas × días) para identificar distribución temporal de la conducta. Revela patrones contextuales.' },
        { type: 'cuestionario',  name: 'Functional Analysis Screening Tool', abbr: 'FAST', desc: 'Cuestionario de 27 ítems para identificar la función conductual probable mediante reporte de terceros. Rápido, no requiere observación directa.' },
        { type: 'escala',        name: 'Motivation Assessment Scale',  abbr: 'MAS',  desc: 'Escala Likert de 16 ítems (Durand & Crimmins, 1988) que evalúa las 4 funciones conductuales básicas.' },
        { type: 'cuestionario',  name: 'Questions About Behavioral Function', abbr: 'QABF', desc: 'Cuestionario de 25 ítems que evalúa atención, escape, tangibles, no-social y físico/dolor.' },
        { type: 'hoja_registro', name: 'Gráfico de frecuencia/duración',         desc: 'Representación visual de las mediciones a lo largo del tiempo (línea de base + intervención).' },
      ],
      timeline: 'Línea de base: 1-2 semanas. Evaluación funcional: 1-2 sesiones adicionales. Resultados de la intervención: visibles en 2-4 semanas si la hipótesis funcional es correcta.',
      followUp: 'Seguimiento a 1, 3 y 6 meses post-intervención con registro esporádico. Criterio de mantenimiento: conducta ≤20% de la línea de base.',
    },

    resources: [
      { type: 'hoja_registro', name: 'ABC Chart completo',           desc: 'Plantilla de registro con columnas para fecha, hora, setting event, antecedente, topografía, consecuencia y función hipotética.' },
      { type: 'hoja_registro', name: 'Scatter Plot semanal',         desc: 'Grilla de 7 días × 16 franjas horarias. Colorear la celda si ocurrió la conducta.' },
      { type: 'hoja_registro', name: 'Gráfico de línea de base',     desc: 'Eje X: días de observación. Eje Y: frecuencia. Línea vertical separa LB de intervención.' },
      { type: 'hoja_registro', name: 'Resumen de hipótesis funcional', desc: 'Template: "La conducta [X] ocurre principalmente en [A] y es mantenida por [C], cumpliendo la función de [función]."' },
      { type: 'protocolo',     name: 'Plan de intervención conductual', desc: 'Documento que especifica modificaciones de antecedentes, extinción de la función inadaptada, enseñanza de CAE y criterios de éxito.' },
    ],

    indications: [
      'Cualquier conducta-problema repetitiva que no responde a intervención psicoeducativa o cognitiva',
      'Conductas autolesivas, agresión física o verbal, conductas disruptivas',
      'Comportamientos de evitación mantenidos por refuerzo negativo (TOC, fobias, agorafobia)',
      'Depresión con evitación como conducta dominante',
      'TDAH con conductas disruptivas en contextos específicos',
      'Trastorno del Espectro Autista (especialmente conductas repetitivas y autolesión)',
      'PREVIO a cualquier plan de modificación conductual — es el paso diagnóstico previo',
      'Cuando intervenciones anteriores fracasaron sin explicación clara',
      'Conductas mantenidas por consecuencias sociales (atención, escape de demandas)',
    ],

    contraindications: [
      'Crisis aguda: primero contención, luego evaluación funcional',
      'Síntomas exclusivamente internos sin correlato conductual observable (pensamientos intrusivos sin conducta)',
      'Conducta de muy baja frecuencia (< 1 vez por semana) — insuficientes datos para análisis',
      'Contexto ambulatorio sin acceso a observadores en el entorno natural (requiere adaptación del método)',
      'Paciente sin capacidad de colaborar en el registro si se requiere autoobservación',
    ],

    outcomes: [
      {
        domain: 'Conductual',
        items: [
          'Reducción medible (%) en frecuencia de la conducta-problema vs. línea de base',
          'Reducción en duración e intensidad de los episodios',
          'Aumento en frecuencia de la Conducta Alternativa Equivalente (CAE)',
          'Generalización de la reducción a contextos no trabajados directamente',
        ],
      },
      {
        domain: 'Funcional / Sistémico',
        items: [
          'Reducción del impacto de la conducta en las relaciones interpersonales',
          'Menor interferencia en actividades académicas, laborales o sociales',
          'Reducción del estrés en cuidadores/entorno',
        ],
      },
      {
        domain: 'Terapéutico',
        items: [
          'Hipótesis funcional validada que guía decisiones de tratamiento',
          'Marco de comprensión compartido entre paciente, terapeuta y familia',
          'Base para diseño de intervención individualizada basada en evidencia',
        ],
      },
    ],

    organizingVars: [
      {
        category: 'Biológicas',
        items: [
          'Estado de salud general y dolor crónico (aumentan refuerzo negativo del escape)',
          'Privación de sueño (disminuye tolerancia a la frustración, aumenta la función de escape)',
          'Estado nutricional / privación alimentaria (setting event que aumenta valor reforzante de tangibles)',
          'Medicación psicoactiva (puede modificar sensibilidad al refuerzo o umbral de respuesta)',
          'Ciclo menstrual / fluctuaciones hormonales',
          'Estado de activación autonómica basal (hiperarousal aumenta sensibilidad a antecedentes)',
        ],
      },
      {
        category: 'Cognitivas',
        items: [
          'Creencias sobre la conducta ("si hago X, obtengo Y" — expectativas de refuerzo)',
          'Autoeficacia percibida (baja autoeficacia aumenta función de escape ante desafíos)',
          'Regulación de la atención (dificultades de atención modifican la discriminación de antecedentes)',
          'Nivel de comprensión de las contingencias (conciencia del paciente sobre la función)',
        ],
      },
      {
        category: 'Emocionales',
        items: [
          'Nivel de arousal emocional basal (umbral para respuesta conductual)',
          'Labilidad emocional (variabilidad que complica la estabilidad de la función)',
          'Tolerancia a la frustración (baja TF amplifica la función de escape ante demandas)',
          'Regulación emocional general (la disregulación actúa como setting event universal)',
        ],
      },
      {
        category: 'Históricas (Historia de Reforzamiento)',
        items: [
          'Patrón previo de reforzamiento de la conducta-problema en el entorno natural',
          'Condicionamiento temprano (refuerzo intermitente — el más resistente a la extinción)',
          'Historia de castigo (puede haber supresión temporal de la topografía sin cambio de función)',
          'Experiencias de aprendizaje vicario relevantes',
        ],
      },
      {
        category: 'Contextuales / Relacionales',
        items: [
          'Densidad de refuerzo en el entorno (ambientes con poco refuerzo positivo aumentan función de atención)',
          'Relaciones interpersonales clave (quién es el mediador del refuerzo principal)',
          'Clima familiar/laboral/escolar',
          'Cambios recientes en el entorno (setting events relacionales)',
        ],
      },
    ],

    references: [
      'Iwata, B.A. et al. (1982/1994). Toward a functional analysis of self-injury. JABA.',
      'Cooper, J.O., Heron, T.E. & Heward, W.L. (2007). Applied Behavior Analysis (2nd ed.).',
      'Haynes, S.N. & O\'Brien, W. (1990). Functional analysis in behavior therapy. Clinical Psychology Review.',
      'Sturmey, P. (1996). Functional Analysis in Clinical Psychology. Wiley.',
      'Miltenberger, R.G. (2001). Behavior Modification: Principles and Procedures (2nd ed.).',
      'Carr, E.G. (1977). The motivation of self-injurious behavior: A review of some hypotheses. Psychological Bulletin.',
    ],

    visual: 'abc_flow',
    status: 'complete',
  },

  // ── 02 ─────────────────────────────────────────────────────────────────────
  {
    id:           'reestructuracion',
    name:         'Reestructuración Cognitiva',
    abbr:         'RC',
    tagline:      'El evento no determina la emoción — la evaluación del evento sí.',
    category:     'reestructuracion_cognitiva',
    traditions:   ['TCC'],
    difficulty:   2,
    sessionCount: '4-8 sesiones para dominio',
    summary:      'Técnica central de la TCC que entrena al paciente a identificar pensamientos automáticos negativos (PAN), examinar la evidencia que los apoya y los contradice, y generar pensamientos alternativos más balanceados que reduzcan el malestar emocional.',
    tags:         ['pensamiento automático', 'evidencia', 'creencia', 'Beck', 'registro de pensamientos', '5 columnas', 'distorsión cognitiva'],

    definition: `La RC es el procedimiento técnico mediante el cual se identifican, evalúan y modifican los pensamientos automáticos negativos (PAN) y las creencias disfuncionales que generan y mantienen el malestar emocional. Se basa en el modelo cognitivo de Beck (1979): entre el evento y la respuesta emocional existe siempre una evaluación cognitiva (el pensamiento), y es esa evaluación — no el evento en sí — lo que determina la emoción y la conducta.

La herramienta principal es el Registro de Pensamientos (RP), que en su versión estándar de 5 columnas incluye: situación, emoción (0-100), pensamiento automático, evidencias pro/contra, y pensamiento alternativo + re-evaluación emocional.`,

    mechanism: `Modelo cognitivo de Beck (1979): los eventos activan pensamientos automáticos (rápidos, involuntarios, plausibles para el paciente) que filtran la experiencia a través de creencias intermedias (reglas, actitudes, suposiciones) y creencias nucleares (esquemas sobre el yo, los otros y el futuro — la tríada cognitiva).

La RC opera en tres niveles:
1. Pensamientos Automáticos: accesibles a la conciencia, modificables mediante examen de evidencia
2. Creencias Intermedias: "si X entonces Y", "debería..." — más estables, requieren más sesiones
3. Creencias Nucleares / Esquemas: "soy incompetente", "el mundo es peligroso" — muy estables, requieren terapia de esquemas (Young)

El mecanismo de cambio es el "descubrimiento guiado": el terapeuta NO proporciona la respuesta alternativa — guía al paciente mediante preguntas socráticas para que él mismo llegue a una perspectiva más balanceada.`,

    steps: [
      {
        n: 1,
        title: 'Psicoeducación del Modelo Cognitivo',
        body: 'Explicar el modelo A-B-C cognitivo: el evento (A) activa un pensamiento (B) que genera la emoción y conducta (C). Usar un ejemplo neutro primero, luego un ejemplo del paciente.',
        tip: 'Verificar comprensión del modelo con una situación real del paciente ANTES de pasar al registro. Muchos pacientes entienden el concepto verbalmente pero no aplican la distinción situación/pensamiento/emoción.',
        example: 'Ejemplo neutro: "Imaginá que alguien no te saluda al pasar. Pensamiento A: \'Me ignora a propósito\' → emoción: enojo. Pensamiento B: \'Debe estar distraído\' → emoción: ninguna."',
      },
      {
        n: 2,
        title: 'Identificación de la Situación Activante',
        body: 'Describir concretamente el evento o situación que disparó el malestar. Especificar quién, qué, dónde, cuándo.',
        tip: 'Los pacientes frecuentemente reportan una emoción como "situación" ("me sentí angustiado"). Redirigir: "¿Qué pasó ANTES de que te sintieras así? ¿Dónde estabas?"',
      },
      {
        n: 3,
        title: 'Identificación y Cuantificación de la Emoción',
        body: 'Nombrar la emoción específica (no "mal" ni "raro") y cuantificar su intensidad de 0 a 100. Esta puntuación es el criterio de cambio post-intervención.',
        tip: 'Distinguir emociones primarias (tristeza, miedo, enojo) de pensamientos disfrazados de emociones ("me siento un fracasado" = pensamiento, no emoción).',
      },
      {
        n: 4,
        title: 'Identificación del Pensamiento Automático',
        body: 'Identificar el pensamiento específico que cruzó por la mente en el momento de mayor malestar. Buscar el "pensamiento caliente" — el que genera más emoción.',
        tip: 'Preguntas útiles: "¿Qué pasó por tu mente en ese momento?", "¿Qué significa para vos lo que pasó?", "¿Qué dice sobre vos, los demás o el futuro?"',
        substeps: [
          'Si el paciente dice "no sé lo que pensé", usar imaginería: "Cerrá los ojos y volvé a esa situación. ¿Qué ves? ¿Qué te decís?"',
          'Identificar la distorsión cognitiva (filtro mental, catastrofización, lectura mental, etc.)',
          'Evaluar el nivel de creencia en el pensamiento (0-100) — separado de la emoción',
        ],
      },
      {
        n: 5,
        title: 'Búsqueda de Evidencias a FAVOR del Pensamiento',
        body: 'Listar las evidencias concretas y objetivas que apoyan el pensamiento automático. Tomarse el pensamiento en serio — no descartarlo de entrada.',
        tip: 'Empezar por las evidencias A FAVOR es contraintuitivo pero crucial: valida la experiencia del paciente y evita que la RC parezca una negación o minimización de sus problemas.',
      },
      {
        n: 6,
        title: 'Búsqueda de Evidencias EN CONTRA del Pensamiento',
        body: 'Listar evidencias concretas que contradicen, complican o matizan el pensamiento automático. Incluir hechos ignorados, excepciones y perspectivas alternativas.',
        substeps: [
          '¿Hay información que estás ignorando?',
          '¿Ha habido excepciones a este patrón?',
          '¿Qué diría un amigo objetivo sobre esta situación?',
          '¿Si esto le pasara a otra persona, lo verías igual?',
          '¿Estás confundiendo una posibilidad con una certeza?',
        ],
      },
      {
        n: 7,
        title: 'Generación del Pensamiento Alternativo Balanceado',
        body: 'Construir un pensamiento que integre TODAS las evidencias (pro y contra) de manera honesta. No es un pensamiento positivo — es un pensamiento más completo y justo.',
        tip: 'El pensamiento alternativo debe ser creíble para el paciente (nivel de creencia ≥30-40%). Un pensamiento "perfecto" que el paciente no puede creer no tiene valor terapéutico.',
        example: '"Aunque no obtuve el resultado que esperaba en este examen (evidencia A favor del PA), también es cierto que aprobé 4 de 5 materias este año y obtuve buenas devoluciones de otros profesores (evidencias en contra). Lo más justo es decir: fallé este examen específico, no que soy un fracasado."',
      },
      {
        n: 8,
        title: 'Re-evaluación Emocional',
        body: 'Volver a puntuar la emoción identificada en el paso 3 con el nuevo pensamiento. El objetivo no es llegar a 0 — es una reducción significativa y realista.',
        tip: 'Si no hay reducción emocional tras el pensamiento alternativo, significa que: (a) el pensamiento alternativo no fue suficientemente creíble, (b) hay un pensamiento más "caliente" sin identificar todavía, o (c) la RC no es la técnica adecuada para este caso.',
      },
    ],

    evaluation: {
      process: 'El Registro de Pensamientos completado es la medida de proceso. Se evalúa la calidad del pensamiento alternativo (¿es balanceado? ¿creíble?), la reducción emocional y la capacidad del paciente de aplicarlo de forma autónoma.',
      criteria: [
        'Reducción ≥30% en intensidad emocional tras completar el registro',
        'El paciente puede identificar autónomamente los PAN fuera de sesión',
        'Reducción en cuestionarios de depresión/ansiedad (BDI, BAI) a las 6-8 semanas',
        'El paciente reporta uso espontáneo del RP ante situaciones estresantes',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Registro de Pensamientos de 5 columnas', desc: 'Situación / Emoción (0-100) / Pensamiento Automático / Evidencias / Pensamiento Alternativo + Re-evaluación' },
        { type: 'hoja_registro', name: 'Registro de Pensamientos de 7 columnas', desc: 'Agrega columnas para distorsión cognitiva identificada y resultado conductual.' },
        { type: 'escala', name: 'Inventario de Depresión de Beck', abbr: 'BDI-II', desc: '21 ítems. Monitorea cambio en síntomas depresivos cada 2 semanas.' },
        { type: 'escala', name: 'Inventario de Ansiedad de Beck', abbr: 'BAI', desc: '21 ítems. Monitorea cambio en síntomas de ansiedad.' },
      ],
      timeline: 'Primeras mejoras visibles: 3-4 semanas. Dominio de la técnica autónoma: 6-10 semanas.',
    },

    resources: [
      { type: 'hoja_registro', name: 'Registro de Pensamientos 5 col.', desc: 'Tabla imprimible con las 5 columnas del RP estándar.' },
      { type: 'hoja_registro', name: 'Lista de distorsiones cognitivas', desc: 'Tarjeta de referencia rápida con las 18 distorsiones para uso del paciente.' },
      { type: 'hoja_registro', name: 'Termómetro emocional', desc: 'Escala visual 0-100 para facilitar la cuantificación de emociones.' },
    ],

    indications: [
      'Depresión mayor (tratamiento de primera línea)',
      'Trastornos de ansiedad: TAG, fobia social, TOC, trastorno de pánico',
      'Baja autoestima y autocrítica excesiva',
      'Perfeccionismo clínico',
      'Ira y hostilidad crónica',
      'Reacciones de duelo complicado',
      'Rumiación crónica',
    ],

    contraindications: [
      'Psicosis activa o pensamiento desorganizado (contraindicación relativa)',
      'Deterioro cognitivo severo que impida el registro reflexivo',
      'Crisis aguda o disociación — primero estabilizar',
      'Pacientes que usan la RC para intelectualizar y evitar la experiencia emocional',
    ],

    outcomes: [
      {
        domain: 'Cognitivo',
        items: ['Reducción en frecuencia e intensidad de PAN', 'Mayor flexibilidad cognitiva', 'Reducción de distorsiones cognitivas identificadas en registros'],
      },
      {
        domain: 'Emocional',
        items: ['Reducción de síntomas depresivos (BDI)', 'Reducción de ansiedad (BAI)', 'Mayor capacidad de regulación emocional'],
      },
      {
        domain: 'Conductual / Funcional',
        items: ['Mayor aproximación a situaciones evitadas', 'Mejor funcionamiento interpersonal, laboral, académico'],
      },
    ],

    organizingVars: [
      {
        category: 'Cognitivas',
        items: ['Nivel de metacognición: capacidad de observar los propios pensamientos', 'Insight sobre el modelo cognitivo', 'Rigidez vs. flexibilidad cognitiva basal'],
      },
      {
        category: 'Emocionales',
        items: ['Intensidad emocional basal (emociones muy intensas dificultan el registro en el momento)', 'Tolerancia a la angustia (muy baja → evita completar el RP)', 'Alexitimia (dificultad para identificar emociones)'],
      },
      {
        category: 'Contextuales',
        items: ['Apoyo social disponible para practicar entre sesiones', 'Carga de estresores actuales (demasiados complica la identificación de situaciones específicas)'],
      },
    ],

    references: [
      'Beck, A.T. et al. (1979). Cognitive Therapy of Depression. Guilford.',
      'Beck, J.S. (1995). Cognitive Therapy: Basics and Beyond. Guilford.',
      'Burns, D.D. (1980). Feeling Good: The New Mood Therapy.',
      'Greenberger, D. & Padesky, C. (1995). Mind Over Mood. Guilford.',
    ],

    visual: 'thought_record',
    status: 'complete',
  },

  // ── 03 ─────────────────────────────────────────────────────────────────────
  {
    id:           'exposicion',
    name:         'Exposición Gradual con Prevención de Respuesta',
    abbr:         'EPR',
    tagline:      'La ansiedad no es peligrosa. La evitación es el problema, no la solución.',
    category:     'exposicion',
    traditions:   ['TCC', 'Conductual'],
    difficulty:   2,
    sessionCount: '8-20 sesiones',
    summary:      'Tratamiento de primera línea para trastornos de ansiedad basado en la exposición sistemática y graduada a los estímulos temidos mientras se previene la conducta de escape o evitación, logrando extinción del miedo condicionado e inhibición del aprendizaje.',
    tags:         ['ansiedad', 'fobia', 'TOC', 'SUDS', 'jerarquía', 'extinción', 'habituación', 'inhibición aprendizaje', 'EPR'],

    definition: `La EPR combina dos procedimientos: (1) Exposición: contacto sistemático y prolongado con el estímulo temido, y (2) Prevención de Respuesta: bloqueo activo de la conducta de escape, evitación o rituales que normalmente reducen la ansiedad de forma inmediata.

El objetivo NO es eliminar el miedo — es aprender que el miedo (a) disminuye solo con el tiempo sin necesidad de escape (habituación), y (b) las consecuencias temidas no ocurren o son tolerables (violación de expectativa).`,

    mechanism: `Dos mecanismos complementarios explicados por la investigación:

1. Habituación (modelo clásico, Wolpe 1958): el sistema nervioso autónomo se habitúa a la presencia del estímulo si la exposición es suficientemente prolongada y no se produce escape. La ansiedad sube, llega a un pico y disminuye por sí sola.

2. Inhibición del Aprendizaje (Craske et al. 2014 — modelo actual): la exposición crea un nuevo recuerdo inhibitorio ("el estímulo X no predice peligro") que compite con el recuerdo condicionado de miedo. La generalización y el desafío de expectativas específicas son cruciales para maximizar este mecanismo.

La Prevención de Respuesta es indispensable porque los rituales/escape producen reducción inmediata de la ansiedad (refuerzo negativo) que REFUERZA la evitación y mantiene el trastorno.`,

    steps: [
      {
        n: 1,
        title: 'Psicoeducación sobre Ansiedad y Evitación',
        body: 'Explicar el modelo de mantenimiento de la ansiedad: la ansiedad es adaptativa, el ciclo evitación-alivio-refuerzo es el problema. Normalizar la ansiedad como señal, no como peligro.',
        example: '"La ansiedad es un sistema de alarma. Como toda alarma, puede ser demasiado sensible. El problema no es que suene — el problema es que cada vez que suena, salís corriendo, y entonces la alarma nunca aprende que no hay incendio."',
      },
      {
        n: 2,
        title: 'Construcción de la Jerarquía de Exposición',
        body: 'Listar situaciones relacionadas con el miedo y ordenarlas de menor a mayor ansiedad usando la escala SUDS (Subjective Units of Distress Scale, 0-100). Necesitar al menos 8-12 ítems bien distribuidos.',
        tip: 'El ítem de inicio debe generar SUDS 20-30 — suficiente para ser una exposición real pero no tan alto que sea insuperable. Verificar que los ítems sean accesibles, no hipotéticos.',
        substeps: [
          'Listar todos los estímulos, situaciones y objetos que disparan ansiedad (sin ordenar aún)',
          'Calificar cada uno con SUDS (0-100) en el estado actual',
          'Ordenar de menor a mayor',
          'Verificar distribución: que no haya saltos muy grandes entre ítems adyacentes',
        ],
      },
      {
        n: 3,
        title: 'Definir las Conductas de Evitación a Prevenir',
        body: 'Identificar TODAS las conductas de seguridad: escape conductual (salir del lugar), evitación cognitiva (distracción), señales de seguridad (objetos, personas), micro-rituales, reaseguración.',
        tip: 'Las señales de seguridad (llevar siempre el celular "por si acaso", ir acompañado) son evitación encubierta y deben ser identificadas y eliminadas gradualmente. Si se toleran, la exposición pierde efecto.',
      },
      {
        n: 4,
        title: 'Exposición Graduada y Sistemática',
        body: 'Comenzar por el ítem más bajo de la jerarquía. Mantenerse en contacto con el estímulo hasta que la ansiedad descienda al menos un 50% o a SUDS ≤30. No pasar al siguiente ítem hasta dominar el actual.',
        tip: 'La duración de la exposición depende del tiempo de habituación individual — puede ser 20 minutos o 90 minutos. El criterio es la reducción de SUDS, no el tiempo. Una exposición corta sin habituación refuerza la evitación.',
        substeps: [
          'Acordar con el paciente el ítem del día',
          'Medir SUDS pre-exposición',
          'Iniciar exposición — registrar SUDS cada 5-10 minutos',
          'Mantener hasta SUDS ≤30 o reducción ≥50%',
          'Procesar post-exposición: ¿ocurrió lo que temías? ¿La ansiedad bajó sola?',
        ],
      },
      {
        n: 5,
        title: 'Prevención de Respuesta',
        body: 'Durante la exposición, bloquear activamente las conductas de escape, rituales y señales de seguridad identificadas. Acordar el protocolo con el paciente de antemano.',
        tip: 'La Prevención de Respuesta es la parte más difícil y más importante. Un paciente que hace la exposición CON señales de seguridad aprende que toleró la situación "gracias" a la señal de seguridad, no que el estímulo es inofensivo.',
      },
      {
        n: 6,
        title: 'Exposición Intersesión (Tarea)',
        body: 'Asignar práctica diaria entre sesiones. La exposición en consulta es solo el andamiaje — la generalización real ocurre en el entorno natural.',
        tip: 'La práctica diaria triplica la velocidad de recuperación comparada con exposición sólo en sesión (Foa & Kozak, 1986). Sin tarea, los resultados son más lentos y menos estables.',
      },
      {
        n: 7,
        title: 'Generalización y Prevención de Recaída',
        body: 'Trabajar con ítems altos de la jerarquía. Variar contextos, momentos del día, personas presentes. Planificar respuesta ante retornos del miedo (normales y predecibles).',
        tip: 'Un retorno del miedo después del tratamiento NO es una recaída — es un fenómeno esperado. Enseñar al paciente que la solución es retomar la exposición, no la evitación.',
      },
    ],

    evaluation: {
      process: 'Curvas de SUDS intra-sesión (registradas cada 5-10 minutos). Avance en la jerarquía semana a semana. Reducción en conductas de evitación.',
      criteria: [
        'SUDS máximo intra-sesión disminuye progresivamente entre sesiones (habituación entre sesiones)',
        'Avance continuo en la jerarquía de exposición',
        'Reducción en escalas de ansiedad (BAI, DASS-21, escalas específicas por trastorno)',
        'Reducción en conductas de evitación en el entorno natural',
      ],
      instruments: [
        { type: 'escala', name: 'SUDS — Escala subjetiva de malestar', desc: 'Escala continua 0-100 registrada durante la exposición. Permite graficar curvas de habituación.' },
        { type: 'hoja_registro', name: 'Registro de exposición', desc: 'Fecha / Situación / SUDS pre / SUDS máximo / SUDS final / Observaciones.' },
        { type: 'hoja_registro', name: 'Jerarquía de exposición', desc: 'Lista ordenada por SUDS con casilla de verificación por ítem dominado.' },
        { type: 'escala', name: 'Inventario de Ansiedad de Beck', abbr: 'BAI', desc: '21 ítems. Administrar cada 2 semanas.' },
      ],
      timeline: 'Primeras mejoras notables: 3-4 semanas. Respuesta completa: 8-16 semanas según trastorno y severidad.',
    },

    resources: [
      { type: 'hoja_registro', name: 'Jerarquía de exposición + SUDS', desc: 'Lista con ítems, SUDS inicial, SUDS post-primera exposición, SUDS dominado.' },
      { type: 'hoja_registro', name: 'Registro de curva de ansiedad intra-sesión', desc: 'Grilla temporal con SUDS cada 5 minutos. Permite visualizar la habituación.' },
      { type: 'hoja_registro', name: 'Registro de exposición diaria', desc: 'Tarea diaria: situación, duración, SUDS máximo, SUDS final, lo que aprendiste.' },
      { type: 'protocolo', name: 'Protocolo EPR para TOC', desc: 'Formato específico para TOC con registro de obsesión, ritual prevenido y resultado.' },
    ],

    indications: [
      'Fobias específicas (primera línea, alta eficacia)',
      'Trastorno de pánico con o sin agorafobia',
      'Fobia social / Trastorno de ansiedad social',
      'TOC (con Prevención de Respuesta obligatoria)',
      'PTSD (Exposición Prolongada, protocolo de Foa)',
      'Hipocondría / Ansiedad por salud',
      'Ansiedad de rendimiento',
    ],

    contraindications: [
      'Crisis suicida activa — priorizar estabilización',
      'Disociación severa — requiere estabilización previa con DBT/EMDR',
      'Motivación insuficiente — la exposición requiere tolerancia activa al malestar',
      'Enfermedad cardiovascular severa (consultar médico antes de exposición interoceptiva)',
      'Trauma complejo sin preparación adecuada (riesgo de retraumatización)',
    ],

    outcomes: [
      { domain: 'Ansioso', items: ['Reducción en SUDS máximo intra-sesión', 'Reducción en escalas de ansiedad (BAI)', 'Reducción en conductas de evitación'] },
      { domain: 'Funcional', items: ['Mayor aproximación a situaciones evitadas', 'Retorno a actividades inhibidas por la ansiedad', 'Menor dependencia de señales de seguridad'] },
    ],

    organizingVars: [
      { category: 'Biológicas', items: ['Umbral de activación del sistema nervioso autónomo', 'Velocidad individual de habituación', 'Respuesta fisiológica al estrés (variabilidad de FC)'] },
      { category: 'Cognitivas', items: ['Expectativas de catástrofe (más altas = mayor resistencia a la exposición)', 'Creencias sobre la ansiedad (intolerable vs. pasajera)', 'Sensibilidad a la ansiedad'] },
      { category: 'Motivacionales', items: ['Motivación para tolerar el malestar a corto plazo', 'Comprensión del racional de la EPR', 'Historia previa con la evitación (más larga = más resistente)'] },
    ],

    references: [
      'Foa, E.B. & Kozak, M.J. (1986). Emotional processing of fear. Psychological Bulletin.',
      'Craske, M.G. et al. (2014). Maximizing exposure therapy: An inhibitory learning approach. Behaviour Research and Therapy.',
      'Barlow, D.H. (2002). Anxiety and Its Disorders (2nd ed.). Guilford.',
    ],

    visual: 'exposure_ladder',
    status: 'complete',
  },

  // ── 04 ─────────────────────────────────────────────────────────────────────
  {
    id:           'activacion_conductual',
    name:         'Activación Conductual',
    abbr:         'AC',
    tagline:      'El movimiento precede a la motivación. No esperés sentirte bien para actuar.',
    category:     'activacion_conductual',
    traditions:   ['Conductual', 'TCC'],
    difficulty:   1,
    sessionCount: '6-16 sesiones',
    summary:      'Intervención conductual para la depresión que rompe el círculo vicioso de inactividad-disforia aumentando el contacto con refuerzo positivo natural mediante la programación y monitoreo sistemático de actividades placenteras, de logro y consistentes con valores.',
    tags:         ['depresion', 'Lewinsohn', 'Martell', 'actividades', 'refuerzo', 'valores', 'monitoreo', 'BADS', 'BA'],

    definition: `La AC es una intervención conductual basada en el modelo de Lewinsohn (1974): la depresión se mantiene por una tasa baja de refuerzo positivo contingente a la conducta, generalmente como resultado de la pérdida de fuentes de refuerzo (duelo, desempleo) o de la evitación activa de situaciones.

El modelo de Martell et al. (2001) amplía el marco: la evitación es la variable central de mantenimiento. Los pacientes evitan situaciones por miedo al fracaso, al juicio, o simplemente porque "no tienen ganas" — y esa evitación profundiza la disforia, generando un círculo vicioso.

La AC actúa desde afuera hacia adentro: aumentar conductas produce cambio emocional. Esto es contraintuitivo para el paciente (espera sentirse mejor para actuar) y es el punto pedagógico más importante de la técnica.`,

    mechanism: `El círculo vicioso de la depresión:
Estado de ánimo bajo → Reducción de actividades → Menos refuerzo positivo → Mayor estado de ánimo bajo → Más reducción de actividades...

La evitación a corto plazo reduce el displacer (refuerzo negativo) pero a largo plazo elimina el contacto con reforzadores positivos naturales y confirma la creencia de incapacidad.

La AC interrumpe el ciclo en la conducta (único punto directamente modificable) aumentando la exposición a actividades que producen:
• Placer/disfrute (activación hedónica)
• Sensación de logro/competencia (activación de mastery)
• Conexión con valores personales (activación basada en valores — Martell)`,

    steps: [
      {
        n: 1,
        title: 'Psicoeducación del Modelo Conductual de la Depresión',
        body: 'Explicar el círculo vicioso inactividad-disforia. Introducir la idea de que la acción precede al estado de ánimo — no al revés.',
        example: '"¿Esperás sentirte motivado para ducharte? O ¿te duchás y después te sentís un poco mejor? La AC aplica esa misma lógica a actividades más amplias."',
      },
      {
        n: 2,
        title: 'Registro de Actividades y Estado de Ánimo',
        body: 'Durante 1-2 semanas, el paciente registra qué hace hora a hora y puntúa su estado de ánimo (0-10) y su sensación de placer/logro (P/L).',
        tip: 'El registro revela el patrón de evitación concreto y las actividades que sí generan leve mejoría (por pequeña que sea — esas son el punto de partida). No comenzar activación antes de tener datos de registro.',
      },
      {
        n: 3,
        title: 'Identificación de Actividades Reforzantes y Valores',
        body: 'Identificar: (a) actividades que el paciente disfrutaba antes y dejó de hacer, (b) actividades de logro, (c) actividades consistentes con sus valores (qué tipo de persona quiere ser).',
        tip: 'Para pacientes con anhedonia severa: explorar actividades previas a la depresión, no actuales. La anhedonia hace que ninguna actividad "suene bien" — eso es síntoma, no preferencia real.',
      },
      {
        n: 4,
        title: 'Programación Gradual de Actividades',
        body: 'Acordar actividades específicas, con día, hora y lugar definidos. Comenzar por actividades de dificultad muy baja — incluso ridículamente pequeñas. El éxito en pasos pequeños construye autoeficacia.',
        tip: 'Si el paciente propone 10 actividades, empezar por 1-2. Los planes ambiciosos fracasan y confirman la creencia "soy un fracasado". Mejor: 1 actividad realizada = éxito = base para la siguiente.',
        substeps: [
          'Especificar: qué actividad, cuándo, dónde, con quién (si aplica)',
          'Anticipar obstáculos: "¿Qué podría impedir que hagas esto?" y planificar respuesta',
          'Acordar criterio de éxito conductual (hice la actividad) — NO emocional (disfruté la actividad)',
        ],
      },
      {
        n: 5,
        title: 'Monitoreo de Ejecución y Re-evaluación',
        body: 'En la sesión siguiente, revisar el registro: ¿se realizaron las actividades programadas? Si no, ¿qué obstáculo apareció? Ajustar el plan.',
        tip: 'Si una actividad programada no se realizó: analizar el obstáculo conductualmente (no como "falta de voluntad"). ¿Fue demasiado difícil? ¿Había un antecedente que la impidió? ¿La actividad era demasiado ambiciosa?',
      },
      {
        n: 6,
        title: 'Aumentar Gradualmente Dificultad y Variedad',
        body: 'Conforme el paciente recupera funcionamiento, ampliar progresivamente la variedad y dificultad de las actividades. Comenzar a incluir actividades con componente social y actividades de logro.',
      },
    ],

    evaluation: {
      process: 'Registro diario de actividades y estado de ánimo. Progresión semana a semana en número y variedad de actividades realizadas.',
      criteria: [
        'Aumento en el número de actividades placenteras y de logro por semana',
        'Mejoría en BDI-II (reducción ≥10 puntos en 8 semanas)',
        'Reducción en conductas de evitación identificadas en el registro',
        'Paciente reporta conexión entre actividad y leve mejoría de ánimo',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Registro de actividades + ánimo', desc: 'Tabla horaria diaria: actividad, ánimo (0-10), placer (P 0-5), logro (L 0-5).' },
        { type: 'escala', name: 'Behavioral Activation for Depression Scale', abbr: 'BADS', desc: '25 ítems. Mide niveles de activación y evitación. Útil para monitoreo semanal.' },
        { type: 'escala', name: 'BDI-II', desc: 'Inventario de Depresión de Beck, 21 ítems.' },
      ],
      timeline: 'Primeras mejoras en humor: 2-4 semanas. Respuesta completa: 8-16 semanas.',
    },

    resources: [
      { type: 'hoja_registro', name: 'Agenda de actividades semanal', desc: 'Cuadrante semanal dividido por franjas horarias para planificación y registro.' },
      { type: 'hoja_registro', name: 'Lista de actividades de placer y logro', desc: 'Lista prearmada de 50+ actividades para ayudar a pacientes con anhedonia severa a identificar opciones.' },
    ],

    indications: ['Depresión mayor (especialmente con predominio de anhedonia y retirada social)', 'Distimia / Depresión persistente', 'Depresión post-episódica', 'Como componente de protocolos transdiagnósticos'],
    contraindications: ['Crisis suicida activa', 'Manía o hipomanía (contraindicado — la activación puede desencadenar o agravar el episodio)', 'Ansiedad severa sin trabajo previo de exposición'],

    outcomes: [
      { domain: 'Conductual', items: ['Aumento en frecuencia de actividades de placer y logro', 'Reducción en conductas de evitación', 'Retorno a actividades sociales y ocupacionales'] },
      { domain: 'Emocional', items: ['Reducción de síntomas depresivos (BDI)', 'Mayor frecuencia de afecto positivo', 'Reducción del aislamiento'] },
    ],

    organizingVars: [
      { category: 'Biológicas', items: ['Severidad de la anhedonia (muy severa → inicio más lento)', 'Hipersomnia/insomnio (afecta disponibilidad de horarios para actividades)'] },
      { category: 'Motivacionales', items: ['Aceptación del modelo conductual ("tengo que actuar antes de sentirme bien")', 'Motivación para el cambio', 'Historia de actividades reforzantes previas'] },
      { category: 'Sociales', items: ['Red de apoyo social disponible', 'Obligaciones que estructuran la semana (trabajo, hijos)', 'Accesibilidad de actividades (económicas, físicas)'] },
    ],

    references: [
      'Lewinsohn, P.M. (1974). A behavioral approach to depression.',
      'Martell, C.R., Addis, M.E. & Jacobson, N.S. (2001). Depression in Context. Norton.',
      'Dimidjian, S. et al. (2006). Randomized trial of behavioral activation. Journal of Consulting and Clinical Psychology.',
    ],

    visual: 'ba_schedule',
    status: 'complete',
  },

  // ── 05 ─────────────────────────────────────────────────────────────────────
  {
    id:           'resolucion_problemas',
    name:         'Resolución Sistemática de Problemas',
    abbr:         'RSP',
    tagline:      'No resolver el problema bien — resolverlo con un proceso confiable.',
    category:     'resolucion_problemas',
    traditions:   ['TCC', 'Conductual'],
    difficulty:   1,
    sessionCount: '3-6 sesiones',
    summary:      'Protocolo estructurado en 5 pasos (D\'Zurilla & Goldfried, 1971) que entrena habilidades de afrontamiento activo ante problemas, reduciendo la evitación, el pensamiento catastrófico y la parálisis decisional.',
    tags:         ['D\'Zurilla', 'Goldfried', 'decisión', 'problema', 'orientación', 'solución', 'brainstorming'],

    definition: `La RSP es un protocolo conductual-cognitivo que descompone el proceso de resolución de problemas en pasos explícitos y entrenables, reduciendo la interferencia emocional y cognitiva (catastrofización, pensamiento dicotómico, evitación) que impide el afrontamiento efectivo.

D'Zurilla & Goldfried (1971) distinguen dos componentes: (1) Orientación hacia el problema: la actitud y creencias sobre los problemas — si el paciente cree que los problemas son intolerables o insolubles, el proceso falla antes de empezar. (2) Las habilidades de resolución propiamente dichas: definición, generación, evaluación, decisión e implementación.`,

    mechanism: `Los problemas generan malestar emocional que a su vez dificulta el pensamiento claro. La RSP actúa como "cortafuegos cognitivo": al seguir el protocolo, el paciente reduce la interferencia emocional y aplica un proceso sistemático que aumenta la probabilidad de encontrar soluciones viables.

Mecanismos:
• Externalización: poner el problema en papel lo hace más manejable
• Descomposición: problemas complejos reducidos a componentes manejables
• Generación divergente (brainstorming): suspender el juicio amplía el espacio de soluciones
• Evaluación sistemática: reduce la influencia de sesgos cognitivos en la toma de decisiones`,

    steps: [
      {
        n: 1,
        title: 'Orientación hacia el Problema',
        body: 'Evaluar y modificar la actitud hacia los problemas. Un problema es una brecha entre la situación actual y un objetivo deseado — es neutral, no es una señal de fracaso personal.',
        tip: 'Si el paciente tiene una orientación negativa fuerte ("los problemas son amenazas, soy incapaz de resolverlos"), esta fase puede requerir RC específica antes de continuar con el protocolo.',
      },
      {
        n: 2,
        title: 'Definición y Formulación del Problema',
        body: 'Describir el problema en términos concretos y operacionales. Separar hechos de interpretaciones. Formular el objetivo deseado de manera realista.',
        substeps: [
          'Reunir información relevante: ¿qué, quién, cuándo, dónde, cuánto?',
          'Separar hechos de supuestos e interpretaciones',
          'Formular el objetivo: "Quiero lograr X" (no "Quiero que Y cambie")',
          'Identificar obstáculos concretos entre la situación actual y el objetivo',
        ],
      },
      {
        n: 3,
        title: 'Generación de Alternativas (Brainstorming)',
        body: 'Generar la mayor cantidad posible de soluciones SIN evaluar ni criticar durante la generación. La regla del brainstorming: cantidad antes que calidad.',
        tip: 'Suspender el juicio es la instrucción más difícil. Los pacientes con depresión o ansiedad tienden a criticar cada idea en el momento de generarla. Insistir: "ahora solo generar, no evaluar".',
      },
      {
        n: 4,
        title: 'Toma de Decisiones',
        body: 'Evaluar cada alternativa usando una matriz de consecuencias: consecuencias a corto y largo plazo, para uno mismo y para los demás, positivas y negativas. Seleccionar la opción con mejor relación costo-beneficio.',
      },
      {
        n: 5,
        title: 'Implementación y Verificación',
        body: 'Planificar la implementación de la solución elegida con pasos concretos. Implementar. Evaluar el resultado: ¿se logró el objetivo? Si no, volver al paso 2 o 3 con la nueva información.',
        tip: 'Si la solución no funcionó, eso no significa que el proceso falló — significa que se recolectó nueva información que permite redefinir el problema o generar nuevas alternativas. Reencuadrar el "fracaso" como dato.',
      },
    ],

    evaluation: {
      process: 'Calidad de la definición del problema (específica vs. vaga). Número de alternativas generadas. Calidad de la evaluación de consecuencias.',
      criteria: ['Paciente puede aplicar los 5 pasos de forma autónoma', 'Reducción en conductas de evitación ante problemas', 'Reducción en puntuación de escala de resolución de problemas (SPSI-R)'],
      instruments: [
        { type: 'escala', name: 'Social Problem Solving Inventory-Revised', abbr: 'SPSI-R', desc: '52 ítems. Evalúa orientación hacia el problema, estilos de resolución.' },
        { type: 'hoja_registro', name: 'Hoja de resolución de problemas', desc: 'Template con los 5 pasos del protocolo.' },
      ],
      timeline: 'Dominio del protocolo: 3-6 sesiones. Aplicación autónoma: después de práctica con 3-5 problemas reales.',
    },

    resources: [
      { type: 'hoja_registro', name: 'Hoja de los 5 pasos RSP', desc: 'Plantilla con espacios para cada paso del protocolo.' },
      { type: 'hoja_registro', name: 'Matriz de evaluación de alternativas', desc: 'Tabla: alternativa × consecuencias (CP/CL, yo/otros, pos/neg) con puntuación.' },
    ],

    indications: ['Depresión (especialmente con evitación de problemas)', 'Ansiedad generalizada con preocupación sobre problemas irresolubles', 'Parálisis decisional', 'Estrés por acumulación de problemas no resueltos', 'Como habilidad de afrontamiento en prevención de recaída'],
    contraindications: ['Problemas cuya solución requiere primero trabajo emocional (duelo, trauma) — la RSP se implementa cuando el paciente está emocionalmente estabilizado'],

    outcomes: [
      { domain: 'Conductual', items: ['Reducción en evitación de problemas', 'Mayor frecuencia de intentos de resolución activa'] },
      { domain: 'Cognitivo', items: ['Reducción del pensamiento catastrófico sobre problemas', 'Mayor orientación positiva hacia los problemas'] },
    ],

    organizingVars: [
      { category: 'Cognitivas', items: ['Orientación previa hacia el problema (negativa vs. positiva)', 'Capacidad de generar alternativas (pensamiento divergente)'] },
      { category: 'Emocionales', items: ['Intensidad emocional al momento del problema (alta intensidad → reduce capacidad de seguir el protocolo)'] },
    ],

    references: [
      "D'Zurilla, T.J. & Goldfried, M.R. (1971). Problem solving and behavior modification. Journal of Abnormal Psychology.",
      "D'Zurilla, T.J. & Nezu, A.M. (2007). Problem-Solving Therapy: A Positive Approach to Clinical Intervention. Springer.",
    ],

    visual: 'problem_solving_flow',
    status: 'complete',
  },

  // ── 06 ─────────────────────────────────────────────────────────────────────
  {
    id:           'moldeamiento',
    name:         'Moldeamiento y Encadenamiento',
    abbr:         'MOL',
    tagline:      'Ningún comportamiento complejo aparece de golpe — se construye paso a paso.',
    category:     'ingenieria_conductual',
    traditions:   ['ABA', 'Conductual'],
    difficulty:   2,
    sessionCount: 'Continuo — semanas a meses',
    summary:      'Procedimientos de ingeniería conductual para instalar conductas complejas nuevas mediante el refuerzo diferencial de aproximaciones sucesivas (moldeamiento) o la enseñanza de cadenas conductuales eslabón por eslabón (encadenamiento).',
    tags:         ['shaping', 'chaining', 'refuerzo diferencial', 'aproximaciones', 'ABA', 'ingeniería conductual', 'conducta compleja'],

    definition: `Moldeamiento (Shaping): proceso de instalación de una conducta nueva que el organismo no emite mediante el refuerzo diferencial de aproximaciones sucesivas a la conducta-meta. Se refuerza la conducta más cercana al objetivo que el organismo es capaz de emitir, y se va desplazando el criterio de refuerzo en dirección a la meta.

Encadenamiento (Chaining): procedimiento para enseñar secuencias conductuales complejas descomponiendo la cadena en eslabones individuales y enseñándolos en orden (adelante, atrás o con la cadena total).`,

    mechanism: `Moldeamiento: el refuerzo positivo diferencial selecciona variaciones conductuales que se acercan al objetivo. Las variaciones más alejadas se extinguen; las más cercanas se refuerzan. La variabilidad conductual natural del organismo es la "materia prima" del moldeamiento.

Encadenamiento: cada eslabón de la cadena actúa simultáneamente como estímulo discriminativo para el siguiente eslabón Y como reforzador condicionado del eslabón anterior. El refuerzo primario sólo aparece al final de la cadena.`,

    steps: [
      { n: 1, title: 'Definición operacional de la conducta-meta', body: 'Describir la conducta final deseada con precisión. ¿Qué aspecto tiene cuando está completa?', tip: 'Cuanto más precisa la definición, más fácil identificar si el paciente está o no emitiendo la conducta.' },
      { n: 2, title: 'Análisis de tareas', body: 'Para encadenamiento: descomponer la conducta compleja en todos sus pasos constituyentes en el orden correcto.', substeps: ['Listar cada sub-conducta necesaria', 'Verificar el orden lógico/funcional', 'Identificar los estímulos discriminativos de cada eslabón'] },
      { n: 3, title: 'Identificación del punto de partida', body: 'Para moldeamiento: identificar la conducta más cercana a la meta que el paciente emite actualmente. Para encadenamiento: decidir si enseñar hacia adelante, hacia atrás o la cadena completa.' },
      { n: 4, title: 'Implementación con refuerzo diferencial', body: 'Reforzar inmediatamente las aproximaciones que se acercan al criterio actual. Ignorar (extinguir) las que se alejan.', tip: 'El error más frecuente: mover el criterio demasiado rápido antes de que la conducta actual esté bien establecida. Criterio para avanzar: la conducta actual ocurre en ≥80% de las oportunidades.' },
      { n: 5, title: 'Desvanecimiento de apoyos y generalización', body: 'Una vez instalada la conducta, reducir gradualmente los apoyos artificiales (prompts, consecuencias programadas) para que la conducta quede bajo control de contingencias naturales.' },
    ],

    evaluation: {
      process: 'Registro de frecuencia/calidad de cada aproximación. Monitoreo del avance por criterio.',
      criteria: ['La conducta-meta se emite con ≥80% de frecuencia sin apoyos artificiales', 'Generalización a contextos no entrenados', 'Mantenimiento a 4 semanas post-intervención'],
      instruments: [
        { type: 'hoja_registro', name: 'Análisis de tareas', desc: 'Lista de todos los eslabones con casilla de verificación por criterio alcanzado.' },
        { type: 'hoja_registro', name: 'Gráfico de progreso por eslabón', desc: 'Muestra qué pasos están dominados y cuáles están en progreso.' },
      ],
      timeline: 'Variable según complejidad: semanas para conductas simples, meses para secuencias complejas.',
    },

    resources: [
      { type: 'hoja_registro', name: 'Análisis de tareas imprimible', desc: 'Template para descomponer cualquier conducta compleja en eslabones.' },
      { type: 'protocolo', name: 'Guía de moldeamiento paso a paso', desc: 'Protocolo de referencia con criterios de avance y manejo de estancamientos.' },
    ],

    indications: [
      'Instalar conductas nuevas que el paciente nunca ha emitido (habilidades sociales complejas, hábitos)',
      'Rehabilitación conductual post-episodio agudo',
      'TEA: enseñanza de habilidades adaptativas',
      'TDAH: instalación de rutinas y habilidades organizativas',
      'Fobia social: desarrollo de habilidades de interacción de cero',
      'Depresión severa: reinicio de conductas abandonadas de forma gradual',
    ],
    contraindications: ['Conductas que el paciente ya emite — usar en ese caso refuerzo diferencial directo sin moldeamiento'],

    outcomes: [
      { domain: 'Conductual', items: ['La conducta-meta se emite regularmente', 'Generalización a múltiples contextos', 'La conducta se mantiene bajo contingencias naturales'] },
    ],

    organizingVars: [
      { category: 'Biológicas / Cognitivas', items: ['Capacidad de aprendizaje por condicionamiento operante', 'Nivel de desarrollo cognitivo (afecta comprensión de contingencias)', 'Sensibilidad al refuerzo empleado'] },
    ],

    references: [
      'Skinner, B.F. (1938). The Behavior of Organisms. Appleton-Century-Crofts.',
      'Cooper, J.O., Heron, T.E. & Heward, W.L. (2007). Applied Behavior Analysis (2nd ed.).',
    ],

    visual: 'shaping_chain',
    status: 'complete',
  },

  // ── 07 ──────────────────────────────────────────────────────────────────────
  {
    id: 'experimento_conductual', name: 'Experimento Conductual', abbr: 'EC',
    tagline: 'La evidencia empírica supera al debate verbal.',
    category: 'reestructuracion_cognitiva', traditions: ['TCC'], difficulty: 2, sessionCount: '1-3 sesiones por experimento',
    summary: 'Diseño de experiencias concretas para probar empíricamente la validez de un pensamiento o creencia mediante la observación directa de resultados. La evidencia de primera persona tiene mayor poder de cambio que cualquier argumento verbal en sesión.',
    tags: ['evidencia', 'prediccion', 'creencia', 'hipotesis', 'verificacion', 'Beck'],
    definition: 'El experimento conductual traduce una creencia disfuncional en una hipótesis científicamente testeable, diseña una situación real donde el paciente puede observar si esa hipótesis se confirma o refuta, y utiliza el resultado observado para revisar la creencia.',
    mechanism: 'Aprendizaje experiencial directo: la evidencia observada en primera persona tiene mayor poder de cambio que cualquier argumento verbal. Activa el "sistema experiencial" de procesamiento emocional-cognitivo que el debate racional difícilmente alcanza (Teasdale, 1997).',
    steps: [
      {
        n: 1, title: 'Identificar y cuantificar la creencia diana',
        body: 'Formular la creencia en lenguaje preciso y medir su nivel de credibilidad (0-100 %). Esta línea base es el referente de comparación post-experimento.',
        tip: 'Pedir al paciente que formule la creencia en sus propias palabras, sin simplificarla. La precisión aquí determina la calidad del experimento.',
        example: '"Si me tiembla la voz al hablar en público, todos pensarán que soy incompetente." Credibilidad: 90 %.',
      },
      {
        n: 2, title: 'Operacionalizar como hipótesis testeable',
        body: 'Convertir la creencia vaga en una predicción específica, observable y con criterios cuantificables de confirmación/refutación.',
        example: 'Predicción: "El 80 % de los 20 asistentes notará el temblor de voz y me evaluará como incompetente." Criterio de refutación: que menos del 40 % lo note o que las evaluaciones promedio sean ≥3/5.',
      },
      {
        n: 3, title: 'Diseñar el experimento',
        body: 'Planificar con detalle la situación donde se probará la predicción: qué conducta se ejecutará, cuándo, dónde, qué datos se recogerán y cómo (encuesta, observación directa, registro propio).',
        tip: 'Evitar el "experimento sin dientes": si el diseño no puede refutar la predicción, no es un experimento. El paciente debe poder imaginar tanto el resultado confirmatorio como el refutatorio.',
      },
      {
        n: 4, title: 'Ejecutar la conducta planificada',
        body: 'Llevar a cabo exactamente la conducta acordada. El paciente registra inmediatamente después lo que observó, sin interpretarlo aún.',
        tip: 'El terapeuta puede acompañar la primera ejecución (exposición asistida) cuando la ansiedad anticipatoria sea muy alta.',
      },
      {
        n: 5, title: 'Registrar los resultados objetivamente',
        body: 'Recopilar los datos del experimento: qué ocurrió concretamente, qué observaron otros, cuántos/cuánto. Separar hechos de interpretaciones.',
      },
      {
        n: 6, title: 'Revisar la creencia a la luz de la evidencia',
        body: 'Comparar el resultado observado con la predicción original. Medir el nivel de credibilidad de la creencia post-experimento. Formular una creencia alternativa más ajustada a los datos.',
        example: '"Solo 2 de 20 personas me preguntaron si estaba nervioso; las evaluaciones promedio fueron 4.1/5." → Credibilidad post: 35 %. Creencia revisada: "Puedo tener temblor de voz y aun así comunicarme con eficacia."',
      },
    ],
    evaluation: {
      process: 'Comparación del nivel de credibilidad de la creencia antes y después de cada experimento. Seguimiento de generalización a creencias relacionadas.',
      criteria: [
        'Reducción ≥30 puntos en credibilidad de la creencia diana post-experimento',
        'Paciente articula una creencia alternativa basada en evidencia',
        'Generalización: reducción en credibilidad de creencias relacionadas',
        'Paciente diseña experimentos autónomamente en sesiones posteriores',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Formulario de experimento conductual', abbr: 'FEC', desc: '6 columnas: creencia diana (%), predicción, diseño, resultado observado, creencia revisada (%).' },
        { type: 'escala', name: 'Encuesta de observación entre pares', desc: 'Cuestionario breve completado por observadores para proveer evidencia objetiva.' },
      ],
      timeline: 'Un experimento por semana entre sesiones. Revisión en siguiente sesión. Ciclos repetidos hasta generalización.',
      followUp: 'A los 3 meses: verificar si la creencia revisada se mantuvo y si el paciente sigue utilizando la estrategia autónomamente.',
    },
    resources: [
      { type: 'hoja_registro', name: 'Formulario de experimento conductual', desc: 'Template de 6 columnas: creencia / credibilidad pre / predicción / diseño / resultado / credibilidad post.' },
      { type: 'hoja_registro', name: 'Encuesta de observación entre pares', desc: 'Cuestionario breve para que observadores externos provean datos objetivos sobre el comportamiento del paciente.' },
      { type: 'protocolo', name: 'Guía de diseño de experimentos conductuales', desc: 'Checklist para asegurar que el experimento sea genuinamente testeable y ético.' },
    ],
    indications: [
      'Creencias muy arraigadas resistentes al debate verbal',
      'Ansiedad social con predicciones catastróficas específicas (temblor, balbuceo, enrojecimiento)',
      'Perfeccionismo con predicciones de fracaso ante ejecución imperfecta',
      'Hipocondría con predicciones de enfermedad observable',
      'Como técnica de mantenimiento en el alta: prueba de que el cambio fue real',
    ],
    contraindications: [
      'Situaciones donde el experimento crea riesgo real para el paciente o terceros',
      'Pacientes con disociación activa — la experiencia puede ser procesada de forma fragmentada',
      'Como primera técnica en pacientes con alianza terapéutica baja — requiere confianza para exponerse al riesgo de "confirmar la creencia"',
    ],
    outcomes: [
      { domain: 'Cognitivo', items: ['Reducción en nivel de credibilidad de creencias disfuncionales', 'Mayor flexibilidad cognitiva sustentada en evidencia propia', 'Generalización a creencias relacionadas'] },
      { domain: 'Conductual', items: ['Aumento en conductas de aproximación previamente evitadas', 'Reducción de conductas de seguridad que mantenían la creencia'] },
    ],
    organizingVars: [
      { category: 'Motivacionales', items: ['Disposición a probar la creencia (miedo a "quedar expuesto")', 'Historia de experimentos previos fallidos que reforzaron la creencia'] },
      { category: 'Cognitivas', items: ['Nivel de rigidez de la creencia', 'Capacidad de distinguir predicción de resultado observado'] },
    ],
    references: [
      'Bennett-Levy, J. et al. (2004). Oxford Guide to Behavioural Experiments in Cognitive Therapy. Oxford University Press.',
      'Teasdale, J.D. (1997). The relationship between cognition and emotion: The mind-in-place in mood disorders. En D.M. Clark & C.G. Fairburn (Eds.), Science and practice of cognitive behaviour therapy. Oxford University Press.',
    ],
    visual: 'cost_benefit_matrix', status: 'complete',
  },

  // ── 08 ──────────────────────────────────────────────────────────────────────
  {
    id: 'relajacion_jacobson', name: 'Relajación Progresiva de Jacobson', abbr: 'RPJ',
    tagline: 'El cuerpo no puede estar relajado y ansioso al mismo tiempo.',
    category: 'relajacion', traditions: ['Conductual', 'TCC'], difficulty: 1, sessionCount: '4-8 sesiones de entrenamiento',
    summary: 'Entrenamiento sistemático en la discriminación entre tensión y relajación muscular para producir un estado generalizado de baja activación fisiológica que inhibe la respuesta de ansiedad.',
    tags: ['relajacion', 'muscular', 'tension', 'Jacobson', 'ansiedad', 'fisiologia', 'Wolpe', 'inhibicion reciproca'],
    definition: 'La RPJ entrena la capacidad de tensar y relajar sistemáticamente los principales grupos musculares, desarrollando la discriminación interoceptiva entre tensión y relajación. Con la práctica, el estado de relajación profunda se vuelve accesible voluntariamente en tiempos progresivamente menores.',
    mechanism: 'Inhibición recíproca (Wolpe, 1958): la relajación muscular profunda es incompatible fisiológicamente con la respuesta de ansiedad. El entrenamiento repetido produce generalización condicionada — la relajación se convierte en una respuesta condicionada accesible ante señales internas de tensión.',
    steps: [
      {
        n: 1, title: 'Psicoeducación sobre la respuesta tensión-relajación',
        body: 'Explicar la relación entre el estrés emocional y la tensión muscular crónica, y cómo la relajación muscular reduce el arousal general del sistema nervioso.',
        tip: 'Usar el "escaneo corporal" como ejercicio inicial: pedir al paciente que note zonas de tensión habitual (cuello, hombros, mandíbula) antes de comenzar el entrenamiento.',
        example: '"¿Sabés esa sensación de mandíbula apretada al final de un día difícil? Eso es tensión crónica. El objetivo es aprender a soltar eso voluntariamente."',
      },
      {
        n: 2, title: 'Preparación del ambiente y posición',
        body: 'Posición cómoda (silla reclinable o posición supina en colchoneta). Luz tenue o apagada. Teléfono en silencio. Ropa cómoda. Ojos cerrados. Descanso inicial de 2 minutos respirando profundo.',
      },
      {
        n: 3, title: 'Secuencia de ciclos tensión-relajación (16 grupos)',
        body: 'Para cada grupo muscular: tensar con el 50-70 % de la fuerza máxima durante 5-7 segundos → soltar abruptamente → observar la sensación de relajación 20-30 segundos antes del siguiente grupo.',
        substeps: [
          'Mano y antebrazo dominante (cerrar el puño)',
          'Bíceps dominante (doblar el codo)',
          'Mano y antebrazo no dominante',
          'Bíceps no dominante',
          'Frente (levantar las cejas)',
          'Ojos y nariz (cerrar fuerte los ojos)',
          'Mejillas y mandíbula (sonrisa forzada)',
          'Cuello anterior (apretar el mentón al pecho)',
          'Cuello posterior (empujar la cabeza hacia atrás)',
          'Hombros (elevar hacia las orejas)',
          'Espalda superior (juntar omóplatos)',
          'Pecho (respiración profunda y sostener)',
          'Abdomen (contraer)',
          'Muslos (contraer)',
          'Pantorrillas (pies en punta)',
          'Pies (doblar los dedos hacia adentro)',
        ],
        tip: 'No sobrepasar el 70 % de tensión — el objetivo es el contraste, no el dolor. En sesiones iniciales, trabajar 8 grupos; cuando domina, pasar a 16.',
      },
      {
        n: 4, title: 'Progresión a relajación abreviada (4 grupos)',
        body: 'Una vez dominada la secuencia de 16 grupos (semanas 3-4), condensar en 4 grupos mayores: brazos bilaterales · cara y cuello · pecho y abdomen · piernas y pies. Objetivo: lograr relajación profunda en 5-10 minutos.',
        tip: 'Añadir una "palabra clave" (p.ej. "calma") que el paciente pronuncia internamente al soltar. Con el tiempo, la palabra sola podrá inducir relajación parcial.',
      },
      {
        n: 5, title: 'Relajación sin tensión y práctica autónoma',
        body: 'Fase final: relajar grupos musculares sin tensarlos previamente, usando solo la atención a la sensación y la respiración. Práctica diaria de 20-30 min. Usar en situaciones de ansiedad real como técnica de regulación.',
        example: 'Paciente con ansiedad en reuniones de trabajo: aplica relajación abreviada en el baño durante 3 minutos antes de entrar a la sala.',
      },
    ],
    evaluation: {
      process: 'Registro diario del nivel de tensión/ansiedad antes y después de cada práctica. Evaluación semanal con escalas.',
      criteria: [
        'Reducción ≥50 % en puntuación de ansiedad post-práctica vs. pre-práctica',
        'Dominio de versión abreviada en ≤10 minutos de práctica',
        'Capacidad de aplicar relajación parcial en situaciones cotidianas de ansiedad leve-moderada',
        'Reducción sostenida en puntuaciones de ansiedad rasgo (BAI/STAI)',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Diario de práctica de relajación', desc: 'Fecha / duración / ansiedad pre (0-10) / ansiedad post (0-10) / grupo muscular más difícil / observaciones.' },
        { type: 'escala', name: 'Inventario de Ansiedad de Beck', abbr: 'BAI', desc: '21 ítems. Síntomas físicos de ansiedad. Sensible al cambio en técnicas de relajación.' },
        { type: 'escala', name: 'STAI — Ansiedad Estado/Rasgo', abbr: 'STAI', desc: 'Escala estado: cambio agudo. Escala rasgo: cambio sostenido en el patrón de ansiedad.' },
      ],
      timeline: 'Dominio inicial (16 grupos → 4 grupos): 4-6 semanas de práctica diaria. Evaluación de generalización: 8-12 semanas.',
      followUp: 'A los 6 meses: verificar si el paciente mantiene práctica autónoma y sigue usando la técnica en situaciones de ansiedad real.',
    },
    resources: [
      { type: 'protocolo', name: 'Guía de audio RPJ — 16 grupos', desc: 'Grabación guiada de 30 min para práctica autónoma domiciliaria.' },
      { type: 'protocolo', name: 'Guía de audio RPJ abreviada — 4 grupos', desc: 'Versión condensada de 10 min para etapas avanzadas del entrenamiento.' },
      { type: 'hoja_registro', name: 'Diario de práctica de relajación', desc: 'Registro diario: tensión pre/post, duración, observaciones.' },
      { type: 'escala', name: 'BAI — Inventario de Ansiedad de Beck', abbr: 'BAI', desc: 'Para evaluar el impacto del entrenamiento en síntomas de ansiedad.' },
    ],
    indications: [
      'Trastornos de ansiedad generalizada como técnica de manejo de síntomas',
      'Insomnio de inicio (práctica nocturna)',
      'Cefalea tensional y migraña (profilaxis)',
      'Hipertensión esencial leve-moderada (como coadyuvante)',
      'Módulo de habilidades de regulación emocional en DBT',
      'Preparación para exposición graduada en fobias',
    ],
    contraindications: [
      'Lesiones musculares o articulares activas en los grupos a tensar',
      'PTSD con trauma físico — la conciencia interoceptiva puede ser activante de flashbacks',
      'Epilepsia (algunos estados de relajación profunda pueden bajar el umbral convulsivo)',
    ],
    outcomes: [
      { domain: 'Fisiológico', items: ['Reducción de frecuencia cardíaca y presión arterial durante práctica', 'Reducción de tensión muscular medida electromiográficamente', 'Mejora en latencia y calidad de sueño'] },
      { domain: 'Subjetivo', items: ['Reducción en puntuaciones de ansiedad estado (BAI, STAI-E)', 'Aumento en sensación de control sobre la activación corporal'] },
    ],
    organizingVars: [
      { category: 'Biológicas', items: ['Nivel basal de arousal del sistema nervioso autónomo', 'Condición muscular general y presencia de contracturas', 'Conciencia interoceptiva previa'] },
      { category: 'Cognitivas / Motivacionales', items: ['Adherencia a la práctica diaria (predictor clave del resultado)', 'Expectativas sobre la relajación (paradoja del esfuerzo: "debo relajarme" puede generar ansiedad)'] },
    ],
    references: [
      'Jacobson, E. (1938). Progressive Relaxation. University of Chicago Press.',
      'Wolpe, J. (1958). Psychotherapy by Reciprocal Inhibition. Stanford University Press.',
      'Bernstein, D.A. & Borkovec, T.D. (1973). Progressive Relaxation Training. Research Press.',
    ],
    status: 'complete',
  },

  // ── 09 ──────────────────────────────────────────────────────────────────────
  {
    id: 'defusion_act', name: 'Defusión Cognitiva', abbr: 'DEF',
    tagline: 'No debatir el pensamiento — verlo como lo que es: un evento mental, no una realidad.',
    category: 'mindfulness_aceptacion', traditions: ['ACT', 'Tercera Generación'], difficulty: 2, sessionCount: '4-8 sesiones',
    summary: 'Técnica ACT que transforma la relación del paciente con sus pensamientos: de la fusión cognitiva (el pensamiento = la realidad) a la observación distanciada del pensamiento como evento mental transitorio, sin necesidad de suprimirlo ni refutarlo.',
    tags: ['ACT', 'Hayes', 'fusion', 'observacion', 'pensamiento', 'mindfulness', 'metafora', 'flexibilidad psicologica'],
    definition: 'La defusión NO cuestiona el contenido del pensamiento (como la reestructuración cognitiva). Modifica la RELACIÓN del paciente con el pensamiento: de literalidad (el pensamiento es un hecho) a perspectiva (el pensamiento es un evento mental que el observador puede notar sin obedecerlo).',
    mechanism: 'En fusión cognitiva, los pensamientos son tratados como hechos que regulan la conducta directamente ("soy un fracasado" → no intento). La defusión crea distancia psicológica sin requerir debate ni supresión: el pensamiento puede seguir presente pero pierde su función reguladora directa sobre la conducta.',
    steps: [
      {
        n: 1, title: 'Psicoeducación — fusión vs. defusión',
        body: 'Distinguir el estado de fusión ("el pensamiento = la realidad") del estado de defusión ("tengo un pensamiento"). Usar analogía: leer una novela vs. ser el personaje.',
        example: '"Fusión: \'soy un fracasado\'. Defusión: \'mi mente está teniendo el pensamiento de que soy un fracasado\'. El contenido es el mismo. La relación con él es completamente diferente."',
      },
      {
        n: 2, title: 'Técnicas de defusión — menú estructurado',
        body: 'Explorar un menú de técnicas y que el paciente encuentre las que funcionan para él.',
        substeps: [
          'Nombrar el proceso: "Mi mente me está diciendo que..." / "Estoy teniendo el pensamiento de que..."',
          'Agradecer a la mente: "Gracias, mente. Veo ese pensamiento."',
          'Metáfora del autobús: los pensamientos son pasajeros ruidosos; vos sos el conductor — podés seguir conduciendo aunque griten',
          'Metáfora de hojas en el río: los pensamientos son hojas que flotan — observarlas pasar sin aferrarlas',
          'Repetición de la palabra problemática 30 veces en voz alta hasta que pierda significado (deliteralización)',
          'Cantar el pensamiento con una melodía ridícula (Cumpleaños feliz)',
          'Escribir el pensamiento en papel y llevarlo encima sin obedecerlo',
        ],
        tip: 'No presentar todas las técnicas de una vez. Explorar dos o tres y dejar que el paciente elija la que más distancia le da del pensamiento específico.',
      },
      {
        n: 3, title: 'Identificar los "ganchos" individuales del paciente',
        body: 'Mapa personalizado de los pensamientos donde la fusión es más alta. Clasificarlos por tema (fracaso, abandono, peligro) y por nivel de fusión (CFQ para cuantificar).',
        tip: 'Los pensamientos más fusionados suelen ser los más "razonables" (los que el paciente defiende como verdades) — precisamente ahí la defusión es más necesaria.',
      },
      {
        n: 4, title: 'Práctica en momentos de alta fusión',
        body: 'Aplicar la técnica de defusión elegida en tiempo real cuando aparezca el pensamiento problemático. El objetivo no es sentirse mejor — es ver el pensamiento como pensamiento y actuar según valores.',
        example: 'Paciente con miedo al rechazo: antes de enviar un correo difícil, nota "mi mente dice que me van a ignorar", visualiza esa frase en una hoja flotando en el río, y envía el correo de todas formas.',
      },
      {
        n: 5, title: 'Defusión al servicio de los valores',
        body: 'Conectar la práctica de defusión con la pregunta ACT central: "Si este pensamiento tuviera menos poder sobre vos, ¿qué harías que hoy no estás pudiendo hacer?" La defusión libera espacio para la acción valiosa.',
        tip: 'Si la defusión se usa solo para sentirse mejor (reducir malestar), puede convertirse en otra forma de evitación experiencial. El criterio de éxito es la acción en línea con valores, no la ausencia del pensamiento.',
      },
    ],
    evaluation: {
      process: 'Nivel de fusión (0-100 %) antes y después de aplicar la técnica. Evaluación de la conducta resultante: ¿actuó según sus valores o según el pensamiento?',
      criteria: [
        'Reducción ≥30 puntos en nivel de fusión post-defusión',
        'Paciente puede describir el pensamiento en perspectiva ("tengo el pensamiento de X") sin debatir su contenido',
        'Mayor proporción de acciones guiadas por valores vs. acciones guiadas por pensamientos',
        'Reducción en puntuación CFQ entre pre y post-tratamiento',
      ],
      instruments: [
        { type: 'escala', name: 'Cognitive Fusion Questionnaire', abbr: 'CFQ', desc: '7 ítems. Mide nivel de fusión cognitiva general. Sensible al cambio en intervenciones ACT.' },
        { type: 'hoja_registro', name: 'Registro de defusión diaria', desc: 'Pensamiento / Nivel de fusión pre (0-100) / Técnica usada / Nivel de fusión post / Acción tomada.' },
        { type: 'escala', name: 'Acceptance and Action Questionnaire-II', abbr: 'AAQ-II', desc: '7 ítems. Mide flexibilidad psicológica / evitación experiencial. Indicador global del progreso ACT.' },
      ],
      timeline: '4-6 semanas de práctica diaria para consolidar la habilidad. CFQ al inicio y al final del módulo.',
      followUp: 'A los 3 meses: ¿sigue el paciente usando defusión autónomamente? ¿Hay generalización a nuevos pensamientos problemáticos?',
    },
    resources: [
      { type: 'hoja_registro', name: 'Registro de defusión diaria', desc: 'Pensamiento / Fusión pre (0-100) / Técnica / Fusión post / Acción en línea con valores.' },
      { type: 'escala', name: 'CFQ — Cognitive Fusion Questionnaire', abbr: 'CFQ', desc: 'Medida de fusión cognitiva. Sensible al cambio. Útil como evaluación pre/post.' },
      { type: 'hoja_registro', name: 'Tarjetas de defusión (flashcards)', desc: 'Tarjetas portátiles con frases de defusión personalizadas para uso in vivo.' },
    ],
    indications: [
      'Pensamientos intrusivos en TOC — sin debatir su contenido (no "¿es verdad que haré daño?", sino "noto que mi mente tiene ese pensamiento")',
      'Rumiación crónica resistente a la reestructuración cognitiva',
      'Ansiedad con pensamientos catastrofistas muy arraigados',
      'Cuando la RC fracasa o el paciente la usa para intelectualizar (debate interminable)',
      'Depresión con autocrítica severa fusionada ("soy un fracasado")',
    ],
    contraindications: [
      'Pacientes que necesitan validar la realidad de un pensamiento (p.ej.: pensamientos sobre situaciones de abuso real — no deben "defusionarse" sino procesarse)',
      'Pacientes que interpretan la defusión como "no importa lo que piense" — riesgo de desenganche de responsabilidad',
    ],
    outcomes: [
      { domain: 'Cognitivo', items: ['Reducción en nivel de fusión cognitiva (CFQ)', 'Mayor capacidad de observar pensamientos como eventos mentales'] },
      { domain: 'Conductual', items: ['Mayor proporción de acciones guiadas por valores vs. pensamientos', 'Reducción de conductas de evitación motivadas por pensamientos fusionados'] },
      { domain: 'Flexibilidad psicológica', items: ['Aumento en AAQ-II', 'Capacidad de tolerar pensamientos desagradables sin que regulen la conducta'] },
    ],
    organizingVars: [
      { category: 'Cognitivas', items: ['Nivel basal de fusión cognitiva (CFQ pre)', 'Historia de debates mentales infructuosos sobre el pensamiento', 'Capacidad de perspectiva (self-as-context ACT)'] },
      { category: 'Motivacionales', items: ['Claridad de valores ACT — sin valores claros, la defusión pierde dirección', 'Experiencia previa con mindfulness (facilita la práctica)'] },
    ],
    references: [
      "Hayes, S.C., Strosahl, K. & Wilson, K.G. (1999). Acceptance and Commitment Therapy. Guilford.",
      'Luoma, J.B., Hayes, S.C. & Walser, R. (2007). Learning ACT. New Harbinger.',
      'Gillanders, D.T. et al. (2014). The development and initial validation of the Cognitive Fusion Questionnaire. Behavior Therapy, 45(1), 83-101.',
    ],
    status: 'complete',
  },

  // ── 10 ──────────────────────────────────────────────────────────────────────
  {
    id: 'economia_fichas', name: 'Economía de Fichas', abbr: 'EF',
    tagline: 'Crear un sistema de contingencias explícito cuando el entorno natural no refuerza suficientemente.',
    category: 'ingenieria_conductual', traditions: ['ABA', 'Conductual'], difficulty: 3, sessionCount: 'Implementación continua (semanas a meses)',
    summary: 'Sistema formal de contingencias que usa reforzadores condicionados generalizados (fichas, puntos, estrellas) intercambiables por reforzadores primarios, para instalar y mantener conductas adaptativas cuando el refuerzo natural es escaso, demorado o inaccesible.',
    tags: ['fichas', 'puntos', 'refuerzo condicionado', 'ABA', 'contingencia', 'token economy', 'Ayllon', 'Azrin'],
    definition: 'La economía de fichas es un sistema de manejo conductual basado en el condicionamiento operante. Las fichas (reforzadores condicionados generalizados) se entregan contingentemente a la conducta objetivo y se canjean por reforzadores de respaldo elegidos por el usuario. El sistema hace explícitas y predecibles las contingencias del entorno.',
    mechanism: 'Las fichas adquieren valor reforzante mediante su asociación repetida con reforzadores primarios (condicionamiento clásico de segundo orden). Ventajas operativas sobre el refuerzo directo: pueden administrarse inmediatamente post-conducta (reduciendo la demora reforzante), acumularse para reforzadores mayores, y aplicarse cuando el reforzador primario no está disponible en el momento.',
    steps: [
      {
        n: 1, title: 'Definición operacional de las conductas objetivo',
        body: 'Especificar con precisión observable qué conductas serán reforzadas: topografía, frecuencia mínima y criterio de éxito. Empezar con 2-4 conductas objetivo, no más.',
        example: 'No: "portarse bien". Sí: "completar las 3 tareas escolares antes de las 18:00 sin requerir recordatorio" = 1 ficha; "comer la cena completa en ≤30 minutos" = 1 ficha.',
        tip: 'Incluir al menos una conducta de dificultad baja al inicio para asegurar éxito inmediato y establecer el valor de la ficha.',
      },
      {
        n: 2, title: 'Seleccionar fichas y menú de reforzadores de respaldo',
        body: 'Elegir fichas concretas y visualmente atractivas (monedas, pegatinas, puntos en tabla). Construir un menú jerárquico de reforzadores de respaldo con diferentes costos en fichas, basado en las preferencias reales del usuario.',
        tip: 'El sistema fracasa si los reforzadores de respaldo no son genuinamente motivadores. Actualizar el menú mensualmente para evitar la saciación. Verificar reforzadores mediante entrevista de preferencia — no asumir.',
        example: 'Menú: 5 fichas = 30 min de videojuegos; 15 fichas = salida al parque; 30 fichas = película elegida por el niño.',
      },
      {
        n: 3, title: 'Establecer la tasa de cambio y las reglas del sistema',
        body: 'Definir cuántas fichas vale cada conducta y cada reforzador de respaldo. Establecer las reglas de forma escrita y comprensible. Aclarar si existe "multa" por conductas problema (cost-response) — usar con cautela.',
        tip: 'Iniciar con tasas bajas (ganar muchas fichas fácilmente) para instalar la conducta objetivo. Aumentar el criterio gradualmente (principio de DRH: refuerzo diferencial de tasas altas).',
      },
      {
        n: 4, title: 'Entrenamiento de implementadores',
        body: 'Si el sistema lo aplican padres, docentes o personal, entrenarlos en: contingencia exacta (cuándo dar la ficha), consistencia (siempre y solo cuando se cumple el criterio), y manejo de protestas sin retroceder.',
        tip: 'La inconsistencia es el error más frecuente y el que más daña el sistema. Una ficha entregada "por compasión" fuera de criterio puede requerir días para recalibrar el sistema.',
      },
      {
        n: 5, title: 'Implementar, monitorear y ajustar',
        body: 'Iniciar el sistema y registrar diariamente: fichas ganadas, conductas reforzadas, reforzadores canjeados. Revisar semanalmente con el usuario/familia y ajustar tasas, menú o criterios si la conducta no mejora.',
        example: 'Si el niño no está ganando fichas regularmente, el criterio puede ser demasiado exigente. Si gana fichas pero el comportamiento no mejora, revisar si los reforzadores de respaldo son genuinamente motivadores.',
      },
      {
        n: 6, title: 'Desvanecimiento planificado hacia refuerzo natural',
        body: 'Reducir gradualmente el sistema de fichas transfiriendo el control a reforzadores naturales del entorno: alabanza social, autoevaluación positiva, consecuencias naturales. El objetivo es que la conducta se mantenga sin el sistema artificial.',
        tip: 'El desvanecimiento prematuro es la causa más frecuente de recaída. Reducir la densidad del refuerzo gradualmente (lean fading) y solo cuando la conducta ya es estable.',
      },
    ],
    evaluation: {
      process: 'Tasa de conducta objetivo por día/semana (gráfica de frecuencia). Número de fichas ganadas vs. disponibles (índice de adherencia al sistema).',
      criteria: [
        'Aumento ≥50 % en frecuencia de la conducta objetivo en las primeras 2 semanas',
        'Conducta objetivo se mantiene con criterio cada vez más exigente (moldeamiento)',
        'Mantenimiento de la conducta al reducir progresivamente la densidad de refuerzo',
        'Generalización: la conducta se mantiene en al menos un contexto sin el sistema de fichas',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Tablero de fichas semanal', desc: 'Registro visual de fichas ganadas y canjeadas por semana. Incluir gráfica de tendencia.' },
        { type: 'checklist', name: 'Checklist de fidelidad de implementación', desc: 'Evalúa si los implementadores entregan fichas correctamente (contingencia, inmediatez, consistencia).' },
        { type: 'hoja_registro', name: 'Gráfica de frecuencia de conducta', desc: 'Frecuencia diaria de la conducta objetivo. Herramienta de toma de decisiones para ajuste del sistema.' },
      ],
      timeline: 'Primeras mejoras visibles: 1-2 semanas. Sistema estable: 4-8 semanas. Desvanecimiento: 8-16 semanas.',
      followUp: 'A los 3 meses de desvanecimiento: ¿se mantiene la conducta objetivo sin el sistema? ¿Qué reforzadores naturales la sostienen?',
    },
    resources: [
      { type: 'hoja_registro', name: 'Tablero de fichas semanal', desc: 'Template visual para registrar fichas ganadas y canjeadas por día de la semana.' },
      { type: 'hoja_registro', name: 'Menú de reforzadores de respaldo', desc: 'Lista de opciones canjeables con su costo en fichas. Actualizar mensualmente.' },
      { type: 'checklist', name: 'Checklist de fidelidad para implementadores', desc: 'Evaluación semanal de la consistencia y precisión de entrega de fichas.' },
      { type: 'protocolo', name: 'Guía de entrenamiento para padres/docentes', desc: 'Protocolo de 2 sesiones para entrenar a los implementadores del sistema.' },
    ],
    indications: [
      'TEA: instalación de conductas de comunicación, autocuidado y conducta en aula',
      'TDAH: sistema de manejo conductual en casa y escuela (combinado con medicación si indica)',
      'Conductas de estudio y hábitos académicos en niños y adolescentes',
      'Rehabilitación en unidades hospitalarias (conducta en ward)',
      'Depresión severa con abulia extrema: sistema de incentivo para activación conductual cuando la motivación intrínseca está muy suprimida',
    ],
    contraindications: [
      'Pacientes que perciben el sistema como infantilizante o manipulador — puede dañar la alianza terapéutica',
      'Cuando los reforzadores de respaldo disponibles en el entorno no son genuinamente reforzantes',
      'Entornos donde la consistencia de implementación no puede garantizarse (aumenta la variabilidad, debilita el aprendizaje)',
    ],
    outcomes: [
      { domain: 'Conductual', items: ['Aumento en frecuencia de conductas adaptativas objetivo', 'Reducción de conductas problema incompatibles con las conductas objetivo', 'Generalización a nuevos contextos'] },
      { domain: 'Funcional', items: ['Mejora en rendimiento académico (si aplica)', 'Reducción de conflictos en el entorno por conductas problema'] },
    ],
    organizingVars: [
      { category: 'Biológicas', items: ['Sensibilidad al refuerzo del individuo (afectada en depresión, TDAH, TEA)', 'Nivel de saciación de reforzadores disponibles'] },
      { category: 'Contextuales', items: ['Disponibilidad y variedad de reforzadores de respaldo en el entorno', 'Fidelidad de implementación por cuidadores o personal', 'Apoyo familiar al sistema'] },
    ],
    references: [
      'Ayllon, T. & Azrin, N. (1968). The Token Economy: A Motivational System for Therapy and Rehabilitation. Appleton-Century-Crofts.',
      'Cooper, J.O., Heron, T.E. & Heward, W.L. (2007). Applied Behavior Analysis (2nd ed.). Pearson.',
      'Kazdin, A.E. (1982). The Token Economy: A Decade Later. Journal of Applied Behavior Analysis, 15(3), 431-445.',
    ],
    status: 'complete',
  },

  // ── 11 ──────────────────────────────────────────────────────────────────────
  {
    id: 'inoculacion_estres', name: 'Inoculación de Estrés', abbr: 'SIT',
    tagline: 'Preparar al sistema cognitivo-conductual antes de que el estresor golpee.',
    category: 'regulacion_emocional', traditions: ['TCC', 'Conductual'], difficulty: 3, sessionCount: '8-15 sesiones',
    summary: 'Programa multicomponente de Meichenbaum (1985) que combina psicoeducación, adquisición de habilidades cognitivas y conductuales, y exposición graduada a estresores, para construir resiliencia ante situaciones de alta demanda.',
    tags: ['estres', 'Meichenbaum', 'afrontamiento', 'resiliencia', 'inoculacion', 'multicomponente', 'ensayo cognitivo'],
    definition: 'La inoculación de estrés opera por analogía con la inoculación médica: se expone al organismo a dosis controladas del estresor para que desarrolle "anticuerpos" cognitivos, emocionales y conductuales antes de la exposición completa. Es un programa trifásico: conceptualización → adquisición de habilidades → aplicación y consolidación.',
    mechanism: 'Combina múltiples mecanismos: (1) reestructuración cognitiva de la evaluación del estresor, (2) adquisición de habilidades de afrontamiento específicas, (3) habituación a través de la exposición graduada, (4) aumento de la autoeficacia por el dominio progresivo. El efecto neto es una reducción en la evaluación de amenaza y un aumento en la percepción de recursos propios.',
    steps: [
      {
        n: 1, title: 'Evaluación y conceptualización del estrés',
        body: 'Identificar el tipo de estresores (agudos, crónicos, situacionales), la cadena de respuesta del paciente (cognición → emoción → conducta → consecuencia), y los recursos de afrontamiento actuales. Desarrollar una conceptualización compartida.',
        tip: 'Usar la metáfora del termostato: el estrés no es el problema — el problema es que el termostato está calibrado demasiado sensible. La SIT recalibra el termostato.',
      },
      {
        n: 2, title: 'Psicoeducación — el modelo transaccional del estrés',
        body: 'Explicar el modelo de Lazarus: el estrés surge de la transacción entre la evaluación primaria (¿es esto una amenaza?) y la evaluación secundaria (¿tengo recursos para manejarlo?). La intervención actúa en ambas evaluaciones.',
        example: '"La misma situación — hablar en público — es un placer para algunos y un terror para otros. La diferencia no está en el evento sino en cómo lo evaluamos y qué creemos sobre nuestra capacidad de manejarlo."',
      },
      {
        n: 3, title: 'Adquisición de habilidades cognitivas',
        body: 'Reestructuración de pensamientos automáticos ante el estresor. Entrenamiento en autoinstrucciones de afrontamiento (frases preparatorias, durante el estresor, después del estresor). Solución de problemas para aspectos modificables del estresor.',
        substeps: [
          'Preparación: "Voy a tener un plan. Puedo manejar esto."',
          'Durante el estresor: "Paso a paso. Esto es manejable. Respira."',
          'Pico de activación: "Puedo tolerar este nivel de ansiedad. Ya pasé por esto antes."',
          'Post-estresor: "Lo hice. Qué funcionó y qué ajusto para la próxima vez."',
        ],
      },
      {
        n: 4, title: 'Adquisición de habilidades conductuales',
        body: 'Entrenamiento en técnicas de relajación (RPJ, respiración diafragmática), habilidades sociales para estresores interpersonales, gestión del tiempo para estresores de sobrecarga.',
        tip: 'Las habilidades conductuales no reemplazan a las cognitivas — se aplican juntas. Un paciente que puede relajarse pero sigue catastrofizando no está completamente equipado.',
      },
      {
        n: 5, title: 'Exposición graduada imaginaria y en vivo',
        body: 'Practicar las habilidades adquiridas en condiciones progresivamente más demandantes: primero en imaginería dirigida (el terapeuta guía al paciente por el estresor en imaginación aplicando habilidades), luego role-play, luego situaciones reales de baja intensidad, finalmente el estresor real de alta intensidad.',
        example: 'Para un soldado con ansiedad en combate: primero visualizar la situación de combate mientras aplica autoinstrucciones; luego simulacros de baja intensidad; luego exposición real progresiva.',
      },
      {
        n: 6, title: 'Generalización, mantenimiento y prevención de recaída',
        body: 'Identificar nuevos estresores donde aplicar las habilidades. Desarrollar un plan de mantenimiento autónomo. Preparar al paciente para que no interprete las recaídas como fracasos sino como oportunidades para afinar las habilidades.',
        tip: 'La SIT tiene el objetivo explícito de que el paciente se convierta en su propio terapeuta. El criterio de alta es la capacidad de aplicar el modelo sin asistencia.',
      },
    ],
    evaluation: {
      process: 'Evaluación del nivel de estrés percibido, estrategias de afrontamiento y síntomas asociados antes, durante y al final del programa.',
      criteria: [
        'Reducción ≥40 % en puntuaciones de estrés percibido (PSS)',
        'Uso espontáneo de autoinstrucciones de afrontamiento en situaciones de estrés real',
        'Capacidad de exposición a estresores previamente evitados con malestar tolerable',
        'Mantenimiento de habilidades a los 3 meses de seguimiento',
      ],
      instruments: [
        { type: 'escala', name: 'Perceived Stress Scale', abbr: 'PSS', desc: '10 ítems. Mide el nivel de estrés percibido en el último mes. Sensible al cambio en programas de manejo del estrés.' },
        { type: 'escala', name: 'Inventario de Estrategias de Afrontamiento', abbr: 'CSI', desc: 'Evalúa el repertorio de estrategias de afrontamiento y la predominancia de estilos adaptativos vs. desadaptativos.' },
        { type: 'hoja_registro', name: 'Diario de afrontamiento', desc: 'Estresor / Evaluación primaria / Evaluación secundaria / Estrategia usada / Resultado.' },
      ],
      timeline: 'Fase 1 (conceptualización): 2-3 sesiones. Fase 2 (adquisición): 4-6 sesiones. Fase 3 (aplicación): 2-6 sesiones. Total: 8-15 sesiones.',
      followUp: 'A los 6 meses: nivel de estrés percibido (PSS), uso autónomo de habilidades, calidad de vida.',
    },
    resources: [
      { type: 'hoja_registro', name: 'Diario de afrontamiento', desc: 'Registrar estresores, evaluaciones y estrategias usadas diariamente.' },
      { type: 'protocolo', name: 'Tarjetas de autoinstrucciones de afrontamiento', desc: 'Frases personalizadas para las fases preparación / durante / pico / post-estresor.' },
      { type: 'escala', name: 'PSS — Perceived Stress Scale', abbr: 'PSS', desc: 'Evaluación pre/post del nivel de estrés percibido.' },
    ],
    indications: [
      'Ansiedad ante situaciones específicas de alta demanda (exámenes, hablar en público, procedimientos médicos)',
      'Personal de servicios de emergencia, militares, personal sanitario — preparación preventiva',
      'Estrés crónico laboral o familiar',
      'Manejo del dolor crónico (componente de afrontamiento)',
      'Ansiedad ante procedimientos invasivos (cirugía, quimioterapia)',
    ],
    contraindications: [
      'Crisis aguda activa — requiere intervención en crisis primero',
      'Trastorno de estrés postraumático con disociación — la exposición imaginaria puede ser retraumatizante sin protocolo específico',
      'Trastorno de personalidad severo sin estabilización previa',
    ],
    outcomes: [
      { domain: 'Cognitivo', items: ['Reducción en evaluación de amenaza ante estresores conocidos', 'Aumento en autoeficacia de afrontamiento', 'Repertorio de autoinstrucciones adaptativas'] },
      { domain: 'Conductual', items: ['Uso activo de estrategias de afrontamiento vs. evitación', 'Reducción de conductas de escape ante estresores'] },
      { domain: 'Fisiológico', items: ['Reducción en reactividad autonómica ante el estresor (FC, cortisol)', 'Mayor tiempo para retornar a línea base post-estresor'] },
    ],
    organizingVars: [
      { category: 'Cognitivas', items: ['Estilo atribucional ante el fracaso', 'Autoeficacia basal de afrontamiento', 'Historia de éxito/fracaso ante estresores similares'] },
      { category: 'Contextuales', items: ['Predictibilidad del estresor (facilita la preparación)', 'Apoyo social disponible durante la exposición a estresores'] },
    ],
    references: [
      'Meichenbaum, D. (1985). Stress Inoculation Training. Pergamon Press.',
      'Lazarus, R.S. & Folkman, S. (1984). Stress, Appraisal, and Coping. Springer.',
      'Saunders, T. et al. (1996). The effect of stress inoculation training on anxiety and performance. Journal of Occupational Health Psychology, 1(2), 170-186.',
    ],
    status: 'complete',
  },

  // ── 12 ──────────────────────────────────────────────────────────────────────
  {
    id: 'mindfulness_mbsr', name: 'Mindfulness — MBSR', abbr: 'MBSR',
    tagline: 'Atención plena, sin juicio, al momento presente tal como es.',
    category: 'mindfulness_aceptacion', traditions: ['Mindfulness', 'Tercera Generación'], difficulty: 2, sessionCount: '8 semanas (programa estándar)',
    summary: 'Programa de 8 semanas de Kabat-Zinn (1990) que entrena la atención sostenida al momento presente con actitud de no-juicio. Reduce el sufrimiento secundario (la reactividad al malestar) y mejora la regulación emocional a través de la metacognición contemplativa.',
    tags: ['mindfulness', 'Kabat-Zinn', 'meditacion', 'atencion', 'conciencia', 'momento presente', 'no-juicio', 'MBSR'],
    definition: 'Mindfulness es la conciencia que surge de prestar atención intencionalmente, en el momento presente, y sin juzgar la experiencia que se despliega momento a momento (Kabat-Zinn, 1994). El programa MBSR usa meditación formal e informal para entrenar esta capacidad y aplicarla al manejo del dolor crónico, el estrés y la enfermedad.',
    mechanism: 'Múltiples mecanismos: (1) metacognición — observar pensamientos como eventos mentales en lugar de hechos, (2) descentramiento — tomar perspectiva del contenido mental, (3) exposición — permanecer con la experiencia aversiva sin huir, (4) regulación atencional — entrenamiento del control ejecutivo de la atención. El sufrimiento secundario (el sufrimiento sobre el sufrimiento) se reduce porque el paciente deja de "luchar" con su experiencia interna.',
    steps: [
      {
        n: 1, title: 'Semana 1 — Piloto automático y atención plena básica',
        body: 'Introducción al concepto de piloto automático: cómo vivimos gran parte del tiempo "sin estar presentes". Primera práctica formal: exploración corporal (body scan) de 45 minutos.',
        tip: 'El body scan no es relajación — es atención deliberada al cuerpo. Normalizar que la mente "se vaya" 100 veces: notar eso es el ejercicio.',
      },
      {
        n: 2, title: 'Semana 2 — Mente y cuerpo: percepción y reactividad',
        body: 'Cómo la percepción filtra la experiencia y genera reactividad automática. Continuar body scan y añadir yoga mindful suave. Observar cómo reaccionamos automáticamente a eventos desagradables.',
        example: '"Esta semana, cuando notes una reacción automática (irritación, ansiedad, urgencia) — haz una pausa de 3 respiraciones antes de responder."',
      },
      {
        n: 3, title: 'Semana 3 — Reunir la mente dispersa: meditación de la respiración',
        body: 'Aprender la meditación de la respiración sentada como ancla al momento presente. La respiración como "hogar" al que siempre se puede volver. Práctica formal de 30-45 minutos diarios.',
        tip: 'Cada vez que la mente se va y vuelve ES el entrenamiento — no es el fracaso. La analogía del músculo: el retorno fortalece la atención igual que el levantamiento fortalece el bíceps.',
      },
      {
        n: 4, title: 'Semana 4 — Reconocer el patrón de estrés y responder hábilmente',
        body: 'Mapa de los patrones de reactividad automática: cómo el estrés se instala en el cuerpo, la mente y las conductas. Práctica del espacio de respiración de 3 minutos (3-minute breathing space) como intervención de urgencia.',
        substeps: [
          '1 min — ¿Qué está ocurriendo ahora? (pensamientos, emociones, sensaciones)',
          '1 min — Focalizar la atención en la respiración',
          '1 min — Expandir la atención al cuerpo completo',
        ],
      },
      {
        n: 5, title: 'Semana 5 — Permitir y soltar: working with difficulties',
        body: 'Dirigir intencionalmente la atención hacia la experiencia aversiva (dolor, ansiedad, tristeza) con curiosidad en lugar de evitación. Aprender a "ablandarse" alrededor del malestar en lugar de contraerse.',
        tip: '"Ablandarse, abrirse, permitir" — estas tres palabras como mantra para momentos de resistencia intensa al malestar.',
      },
      {
        n: 6, title: 'Semana 6 — Los pensamientos no son hechos',
        body: 'Los pensamientos son eventos mentales — no realidades objetivas. Relación con el pensamiento: notar, nombrar, desengancharse. Meditación de la montaña: estabilidad independientemente del clima mental.',
        example: '"Estoy pensando que no puedo con esto" vs. "No puedo con esto." La diferencia entre la fusión y el desenganche.',
      },
      {
        n: 7, title: 'Semana 7 — ¿Cómo me cuido mejor?',
        body: 'Identificar actividades que nutren y agotan. Construcción de un plan de autocuidado personalizado. Extender mindfulness a actividades cotidianas (comer, caminar, escuchar).',
        tip: 'Mindfulness informal: integrar momentos breves de atención plena en la rutina diaria (primer café del día, ducha, lavado de platos). La práctica informal puede ser tan potente como la formal.',
      },
      {
        n: 8, title: 'Semana 8 — Integración y mantenimiento',
        body: 'Revisión de todo lo aprendido. Plan de práctica autónoma post-programa. La pregunta central: ¿cómo seguís practicando mindfulness de aquí en adelante? Cierre del grupo.',
        example: '"No termina aquí — empieza aquí. Esta semana es el inicio de una práctica de por vida, no el final de un curso."',
      },
    ],
    evaluation: {
      process: 'Evaluación de atención plena y variables relacionadas al inicio, semana 4 y final del programa. Seguimiento a 3 y 12 meses.',
      criteria: [
        'Aumento en puntuación FFMQ entre pre y post-programa',
        'Reducción en puntuaciones de estrés percibido (PSS)',
        'Práctica formal sostenida de ≥20 min/día en ≥5 días por semana',
        'Paciente puede describir al menos 3 situaciones donde aplicó mindfulness informal con efecto regulador',
      ],
      instruments: [
        { type: 'escala', name: 'Five Facet Mindfulness Questionnaire', abbr: 'FFMQ', desc: '39 ítems. Mide 5 facetas del mindfulness: observar, describir, actuar con conciencia, no juzgar, no reaccionar.' },
        { type: 'escala', name: 'PSS — Perceived Stress Scale', abbr: 'PSS', desc: 'Medida de estrés percibido. Sensible al cambio en programas MBSR.' },
        { type: 'hoja_registro', name: 'Diario de práctica mindfulness', desc: 'Práctica formal (min/día) / práctica informal / observaciones sobre la calidad de la atención.' },
      ],
      timeline: '8 semanas de programa estructurado + práctica diaria. Seguimiento a 3, 6 y 12 meses.',
      followUp: 'A los 12 meses: ¿mantiene práctica formal? ¿Ha integrado mindfulness informal en su rutina? Nivel de bienestar y estrés.',
    },
    resources: [
      { type: 'protocolo', name: 'Guía de meditaciones MBSR — audio', desc: 'Body scan (45 min), meditación sentada (30 min), espacio de 3 minutos, meditación caminando.' },
      { type: 'hoja_registro', name: 'Diario de práctica semanal', desc: 'Registro de práctica formal e informal con espacio para observaciones.' },
      { type: 'escala', name: 'FFMQ — Five Facet Mindfulness Questionnaire', abbr: 'FFMQ', desc: 'Medida de atención plena. Evaluación pre/post y seguimiento.' },
    ],
    indications: [
      'Dolor crónico — indicación original del programa MBSR',
      'Estrés crónico (laboral, cuidadores, médico)',
      'Depresión recurrente en remisión (como MBCT — Mindfulness-Based Cognitive Therapy)',
      'Ansiedad generalizada',
      'Psoriasis, fibromialgia y otras condiciones médicas con componente de estrés',
      'Como complemento a cualquier terapia orientada a la tercera generación',
    ],
    contraindications: [
      'Psicosis activa o episodio maníaco activo',
      'PTSD con disociación activa — la atención al cuerpo puede ser activante sin protocolo específico',
      'Depresión mayor severa con anhedonia total — primero activación conductual',
      'Baja motivación para práctica diaria — el programa requiere compromiso de 45 min/día',
    ],
    outcomes: [
      { domain: 'Atención', items: ['Aumento en capacidad de atención sostenida', 'Reducción en mente errante (mind-wandering) en tareas cotidianas'] },
      { domain: 'Emocional', items: ['Reducción en reactividad emocional ante eventos aversivos', 'Mayor tiempo de retorno a la línea base emocional post-estresor'] },
      { domain: 'Funcional / Médico', items: ['Reducción en intensidad subjetiva del dolor crónico', 'Mejora en calidad de vida en enfermedades crónicas'] },
    ],
    organizingVars: [
      { category: 'Motivacionales', items: ['Disposición a la práctica diaria de 45 minutos', 'Apertura a la experiencia contemplativa', 'Historia previa de práctica meditativa'] },
      { category: 'Cognitivas', items: ['Capacidad de metacognición (observar la propia mente)', 'Nivel basal de fusión cognitiva'] },
    ],
    references: [
      'Kabat-Zinn, J. (1990). Full Catastrophe Living. Delacorte.',
      'Kabat-Zinn, J. (1994). Wherever You Go, There You Are. Hyperion.',
      'Baer, R.A. et al. (2006). Using self-report assessment methods to explore facets of mindfulness. Assessment, 13(1), 27-45.',
    ],
    status: 'complete',
  },

  // ── 13 ──────────────────────────────────────────────────────────────────────
  {
    id: 'entrenamiento_asertividad', name: 'Entrenamiento en Asertividad', abbr: 'EA',
    tagline: 'Comunicar lo que pensás y sentís respetando tus derechos y los del otro.',
    category: 'habilidades', traditions: ['TCC', 'Conductual'], difficulty: 2, sessionCount: '6-12 sesiones',
    summary: 'Programa estructurado que entrena la expresión directa, honesta y apropiada de pensamientos, sentimientos y necesidades, como alternativa adaptativa a los estilos pasivo y agresivo de comunicación. Basado en el concepto de derechos asertivos y el ensayo conductual.',
    tags: ['asertividad', 'comunicacion', 'derechos', 'role-play', 'pasividad', 'agresividad', 'Alberti', 'Caballo'],
    definition: 'La asertividad es la habilidad de expresar pensamientos, sentimientos y necesidades de forma directa, honesta y apropiada al contexto, sin violar los derechos propios (como en la pasividad) ni los derechos del otro (como en la agresividad). No es un rasgo de personalidad — es una habilidad aprendida.',
    mechanism: 'La pasividad y la agresividad se mantienen por refuerzo negativo: la pasividad evita el conflicto inmediato; la agresividad obtiene lo que se quiere a corto plazo. El entrenamiento en asertividad provee un repertorio alternativo que obtiene resultados similares a largo plazo sin los costos interpersonales y emocionales asociados.',
    steps: [
      {
        n: 1, title: 'Psicoeducación — derechos asertivos y estilos de comunicación',
        body: 'Presentar el modelo tripartito: pasividad (cedo mis derechos) · agresividad (violo los derechos del otro) · asertividad (respeto los derechos de ambos). Revisar los derechos asertivos básicos (decir no, expresar desacuerdo, pedir lo que necesito).',
        example: '"Tengo derecho a decir \'no\' sin sentirme culpable. Tengo derecho a expresar mis opiniones aunque no estén de acuerdo. Tengo derecho a cometer errores."',
        tip: 'Normalizar que la asertividad puede sentirse inicialmente como agresividad para personas con patrón pasivo histórico — la sensación disminuye con la práctica.',
      },
      {
        n: 2, title: 'Mapeo del estilo de comunicación personal',
        body: 'Identificar en qué situaciones el paciente tiende a ser pasivo, agresivo o asertivo. Construir una jerarquía de situaciones de mayor a menor dificultad asertiva.',
        substeps: [
          'Decir no a peticiones (a conocidos / a extraños / a figuras de autoridad)',
          'Expresar desacuerdo ante otros',
          'Hacer peticiones directas',
          'Iniciar, mantener o terminar conversaciones',
          'Manejar críticas (recibirlas y darlas)',
          'Defender derechos ante situaciones injustas',
        ],
      },
      {
        n: 3, title: 'Modelado y análisis de conducta asertiva',
        body: 'El terapeuta modela respuestas asertivas a las situaciones de la jerarquía. El paciente identifica los componentes verbales y no verbales de la asertividad: contacto visual, tono de voz, postura, contenido del mensaje.',
        tip: 'Los componentes no verbales son frecuentemente más importantes que el contenido verbal. Un "no" dicho con voz apologética y mirada al suelo no es asertividad.',
      },
      {
        n: 4, title: 'Role-play y ensayo conductual en sesión',
        body: 'Practicar conductas asertivas en situaciones de la jerarquía usando role-play. El terapeuta da retroalimentación específica y positiva. Repetir hasta que la conducta se ejecute con fluidez y el nivel de ansiedad sea tolerable.',
        example: 'Terapeuta (rol: jefe): "¿Podés quedarte hasta las 22 hs esta noche?" Paciente ensaya: "Entiendo que la situación es urgente. Hoy no me es posible quedarme hasta esa hora — puedo terminar a las 20 hs. ¿Alcanza?"',
        tip: 'Empezar con situaciones de baja dificultad de la jerarquía. El éxito en situaciones fáciles construye la autoeficacia para las difíciles.',
      },
      {
        n: 5, title: 'Exposición gradual in vivo',
        body: 'Asignar entre sesiones práctica in vivo comenzando por situaciones de baja dificultad de la jerarquía. Revisar en sesión siguiente: qué salió bien, qué fue difícil, qué ajustar.',
        tip: 'El objetivo no es que la situación salga perfecta — es que el paciente ejecute la conducta asertiva aunque el resultado no sea ideal. La asertividad no garantiza que el otro ceda, pero reduce la culpa y el resentimiento propios.',
      },
      {
        n: 6, title: 'Manejo de respuestas negativas y mantenimiento',
        body: 'Preparar al paciente para que el interlocutor no siempre responda positivamente. Ensayar el manejo de presión, manipulación y respuestas agresivas del interlocutor (técnicas: "banco de niebla", "disco rayado"). Plan de mantenimiento a largo plazo.',
        substeps: [
          'Banco de niebla: "Puede que tengas razón en eso" (sin ceder la posición)',
          'Disco rayado: repetir la posición asertiva calmadamente cuantas veces sea necesario',
          'Pregunta asertiva: "¿Por qué específicamente te parece mal?" (invita al interlocutor a ser concreto)',
        ],
      },
    ],
    evaluation: {
      process: 'Evaluación de habilidades asertivas y ansiedad social pre/post con escalas. Registro de conductas asertivas en situaciones reales.',
      criteria: [
        'Reducción ≥40 % en puntuación de ansiedad social ante situaciones asertivas',
        'Paciente ejecuta conducta asertiva en ≥70 % de las situaciones de la jerarquía in vivo',
        'Reducción en culpa post-conducta asertiva',
        'Mantenimiento de conductas asertivas a los 3 meses',
      ],
      instruments: [
        { type: 'escala', name: 'Inventario de Asertividad de Rathus', abbr: 'RAS', desc: '30 ítems. Medida de asertividad global. Útil como pre/post y para identificar áreas deficitarias.' },
        { type: 'escala', name: 'Escala de Ansiedad Social de Liebowitz', abbr: 'LSAS', desc: 'Ansiedad y evitación en 24 situaciones sociales. Sensible al cambio en entrenamiento asertivo.' },
        { type: 'hoja_registro', name: 'Registro de situaciones asertivas', desc: 'Situación / Estilo usado / Resultado / Nivel de satisfacción / Próxima vez haría diferente.' },
      ],
      timeline: '6-8 semanas de práctica in vivo gradual. Evaluación post-tratamiento y seguimiento a 3 meses.',
      followUp: 'A los 6 meses: ¿el paciente sigue siendo asertivo en situaciones que antes evitaba? ¿Hay generalización a nuevos contextos?',
    },
    resources: [
      { type: 'hoja_registro', name: 'Registro de situaciones asertivas', desc: 'Situación / Estilo usado / Resultado / Nivel de satisfacción con la conducta propia.' },
      { type: 'escala', name: 'Inventario de Asertividad de Rathus', abbr: 'RAS', desc: 'Medida de asertividad global. Pre/post. Identifica áreas deficitarias específicas.' },
      { type: 'hoja_registro', name: 'Lista de derechos asertivos personalizados', desc: 'Derechos asertivos identificados y formulados por el propio paciente para uso cotidiano.' },
    ],
    indications: [
      'Ansiedad social con evitación de situaciones de demanda interpersonal',
      'Depresión con patrón pasivo instalado que mantiene falta de refuerzo social',
      'Dificultades en relaciones de pareja y trabajo asociadas a comunicación pasiva o agresiva',
      'Trastorno de personalidad por dependencia (como componente del tratamiento)',
      'Sobrecarga del cuidador: dificultad para establecer límites',
    ],
    contraindications: [
      'Situaciones de violencia doméstica activa — la asertividad puede aumentar el riesgo',
      'Culturas donde la asertividad directa es inapropiada o peligrosa — adaptar el contenido',
    ],
    outcomes: [
      { domain: 'Conductual', items: ['Aumento en frecuencia de conductas asertivas en situaciones de la jerarquía', 'Reducción de conductas de sumisión y evitación interpersonal'] },
      { domain: 'Emocional', items: ['Reducción en ansiedad social (LSAS)', 'Reducción en culpa post-negativa y resentimiento post-pasividad'] },
      { domain: 'Interpersonal', items: ['Mejora en calidad de relaciones interpersonales', 'Aumento en satisfacción con los resultados de interacciones importantes'] },
    ],
    organizingVars: [
      { category: 'Historia de aprendizaje', items: ['Modelado parental de estilo pasivo o agresivo', 'Historia de consecuencias negativas ante intentos de asertividad', 'Experiencia de abuso o violencia que condicionó la pasividad'] },
      { category: 'Cognitivas', items: ['Creencias sobre los derechos propios ("no merezco pedir")', 'Predicciones catastróficas sobre las consecuencias de ser asertivo ("me van a rechazar")'] },
    ],
    references: [
      'Alberti, R.E. & Emmons, M.L. (1970). Your Perfect Right. Impact Publishers.',
      'Caballo, V.E. (1993). Manual de evaluación y entrenamiento de las habilidades sociales. Siglo XXI.',
      'Linehan, M.M. (2003). DBT Skills Training Manual. Guilford. [módulo de efectividad interpersonal]',
    ],
    status: 'complete',
  },

  // ── 14 ──────────────────────────────────────────────────────────────────────
  {
    id: 'analisis_cadena_dbt', name: 'Análisis de Cadena DBT', abbr: 'ACD',
    tagline: 'Mapear eslabón por eslabón cómo se llega al comportamiento problema — para interrumpirlo en cualquier punto.',
    category: 'analisis_conductual', traditions: ['DBT', 'TCC'], difficulty: 3, sessionCount: 'Recurrente — una o más por sesión',
    summary: 'Herramienta central de la DBT (Linehan, 1993) que descompone un comportamiento problema en todos sus eslabones causales — desde las vulnerabilidades previas hasta las consecuencias — para identificar múltiples puntos de intervención y construir soluciones específicas para cada eslabón.',
    tags: ['DBT', 'Linehan', 'cadena conductual', 'analisis funcional', 'comportamiento problema', 'eslabones', 'solucion'],
    definition: 'El análisis de cadena es un análisis funcional minucioso y colaborativo que mapea la secuencia completa de eventos que llevaron a un comportamiento problema específico: vulnerabilidades del organismo → evento precipitante → eslabones de pensamiento/emoción/conducta/acción → comportamiento problema → consecuencias a corto y largo plazo.',
    mechanism: 'El comportamiento problema raramente es el resultado de un único factor — es el producto final de una cadena de eslabones donde cualquier ruptura podría haberlo prevenido. El análisis de cadena hace explícita esta cadena, reduce la vergüenza y el auto-juicio (el paciente ve que "tenía sentido" dada la cadena), e identifica los puntos de intervención más accesibles.',
    steps: [
      {
        n: 1, title: 'Identificar el comportamiento problema con precisión',
        body: 'Definir operacionalmente qué fue el comportamiento problema: topografía exacta, intensidad, duración, contexto. Evitar descripciones vagas ("me puse mal") — ir a la conducta específica observable ("me hice una cortada en el antebrazo izquierdo a las 23 hs").',
        tip: 'El nivel de precisión en este paso determina la utilidad de todo el análisis. Si el BP es vago, el mapa lo será también.',
      },
      {
        n: 2, title: 'Identificar el evento precipitante (EP)',
        body: 'Encontrar el momento exacto en que comenzó la cadena: el evento del entorno que "disparó" la secuencia. Puede ser una situación, una conversación, una sensación física, un pensamiento intrusivo.',
        example: '"El análisis empezó en serio cuando me dijo que cancelaba la cita." — Este es el EP. Todo lo anterior (vulnerabilidades del día) es contexto; el EP es el gatillo.',
        tip: 'Distinguir EP de vulnerabilidades: la discusión fue el EP; haber dormido 3 horas era la vulnerabilidad que hizo que el EP tuviera tanto impacto.',
      },
      {
        n: 3, title: 'Mapear las vulnerabilidades del organismo',
        body: 'Las condiciones previas que aumentaron la sensibilidad al EP: falta de sueño, dolor físico, hambre, consumo de sustancias, aislamiento social, emociones previas sin resolver, eventos estresantes recientes.',
        tip: 'Las vulnerabilidades no excusan el comportamiento — explican su intensidad. Este paso reduce el auto-juicio ("tuve razón en explotar") y abre la discusión sobre la regulación de vulnerabilidades (PLEASE en DBT).',
      },
      {
        n: 4, title: 'Trazar la cadena de eslabones',
        body: 'Mapear cronológicamente cada pensamiento, emoción, sensación física y conducta que conectó el EP con el comportamiento problema. Cada eslabón surge del anterior — la cadena es causal.',
        substeps: [
          'EP → pensamiento A → emoción A → conducta A (p.ej. alejarse)',
          '→ pensamiento B → emoción B (más intensa) → conducta B (p.ej. beber)',
          '→ pensamiento C → emoción C → COMPORTAMIENTO PROBLEMA',
        ],
        example: 'EP: cancelación de cita → "Me importo nada a nadie" (PA) → vergüenza/ira → llamar y no contestar → "Confirma que no me importa" → desesperanza → automutilación.',
      },
      {
        n: 5, title: 'Análisis de consecuencias a corto y largo plazo',
        body: 'Mapear qué ocurrió después del comportamiento problema: qué se ganó a corto plazo (función del comportamiento — alivio, atención, escape del dolor), y qué se perdió a largo plazo.',
        tip: 'El comportamiento problema siempre tiene una función — no es "sin sentido". Identificar la función es esencial para encontrar comportamientos alternativos que cumplan la misma función con menos costo.',
      },
      {
        n: 6, title: 'Generar soluciones para cada eslabón',
        body: 'Para cada eslabón de la cadena, identificar qué habilidad DBT u otro recurso podría haberlo interrumpido. Construir un plan de soluciones específico y concreto para usar en la próxima situación similar.',
        substeps: [
          'Reducir vulnerabilidades: PLEASE (sueño, ejercicio, alimentación, sustancias, enfermedad)',
          'En el EP: habilidades de tolerancia al malestar (TIP, ACCEPTS, STOP)',
          'En los eslabones de cognición: reestructuración, defusión',
          'En eslabones de emoción: regulación emocional (PLEASE, Opuesto a la emoción)',
          'En el momento previo al BP: habilidades de supervivencia en crisis (Pared de fuego)',
        ],
        tip: 'No basta con "hacer algo diferente" — el plan debe ser específico: "cuando vuelva a sentir X en situación Y, haré Z exactamente."',
      },
    ],
    evaluation: {
      process: 'Frecuencia del comportamiento problema por semana como indicador primario. Calidad del análisis de cadena (especificidad, identificación de eslabones y soluciones) como indicador de proceso.',
      criteria: [
        'Reducción sostenida en frecuencia del comportamiento problema',
        'Paciente puede realizar análisis de cadena autónomamente con precisión adecuada',
        'Implementación de al menos una solución alternativa en situaciones similares',
        'Reducción en vergüenza y auto-juicio asociados al comportamiento problema',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Formulario de análisis de cadena DBT', abbr: 'FAC', desc: 'Template estructurado: BP / EP / Vulnerabilidades / Cadena de eslabones / Consecuencias / Soluciones.' },
        { type: 'hoja_registro', name: 'Diario de comportamiento problema', desc: 'Registro semanal de frecuencia, intensidad y breve descripción del BP. Herramienta de monitoreo.' },
        { type: 'checklist', name: 'Checklist de habilidades DBT aplicadas', desc: 'Listado de habilidades DBT con registro de cuáles se intentaron en la semana y su efecto.' },
      ],
      timeline: 'Análisis de cadena en cada sesión donde hubo BP. Evaluación de frecuencia del BP mensualmente.',
      followUp: 'Continuo mientras el BP esté activo. El criterio de éxito es la reducción sostenida del BP durante al menos 3 meses consecutivos.',
    },
    resources: [
      { type: 'hoja_registro', name: 'Formulario de análisis de cadena DBT', abbr: 'FAC', desc: 'Template de 6 secciones: BP / EP / Vulnerabilidades / Cadena / Consecuencias / Soluciones.' },
      { type: 'hoja_registro', name: 'Diario de conducta semanal DBT', desc: 'Card de seguimiento semanal de conductas problema y uso de habilidades.' },
      { type: 'protocolo', name: 'Protocolo PLEASE — Regulación de vulnerabilidades', desc: 'Physical illness · Licit drugs · Eating · Avoid mood-altering substances · Sleep · Exercise. Checklist de autocuidado diario.' },
    ],
    indications: [
      'Trastorno de Personalidad Límite (TPL) — indicación central de DBT',
      'Conductas autolesivas no suicidas (NSSI)',
      'Conductas suicidas — análisis de cadena de cada intento o ideación',
      'Adicciones — análisis de cadena de cada episodio de consumo',
      'Atracones en trastornos de la conducta alimentaria',
    ],
    contraindications: [
      'Crisis activa — primero contención, luego análisis',
      'Alta vergüenza o disociación durante el análisis — requiere habilidades de tolerancia al malestar previas',
    ],
    outcomes: [
      { domain: 'Conductual', items: ['Reducción en frecuencia e intensidad del comportamiento problema', 'Aumento en uso de comportamientos alternativos funcionales'] },
      { domain: 'Cognitivo-Emocional', items: ['Reducción en vergüenza y auto-juicio asociados al BP', 'Mayor comprensión de la función del comportamiento problema'] },
      { domain: 'Habilidades', items: ['Capacidad de realizar análisis de cadena autónomamente', 'Repertorio de soluciones específicas para eslabones de la cadena'] },
    ],
    organizingVars: [
      { category: 'Biológicas', items: ['Nivel basal de sensibilidad emocional (temperatura emocional alta)', 'Vulnerabilidades fisiológicas activas (sueño, dolor, sustancias)'] },
      { category: 'Históricas', items: ['Patrón de conductas problema con función similar (historia de NSSI, consumo, atracón)', 'Entorno invalidante que reforzó respuestas extremas'] },
      { category: 'Relacionales', items: ['Calidad de la alianza terapéutica (el análisis requiere apertura y confianza)', 'Sistemas de apoyo social disponibles entre sesiones'] },
    ],
    references: [
      'Linehan, M.M. (1993). Cognitive-Behavioral Treatment of Borderline Personality Disorder. Guilford.',
      'Linehan, M.M. (2014). DBT Skills Training Manual (2nd ed.). Guilford.',
      'Rizvi, S.L. & Ritschel, L.A. (2014). Mastering the art of chain analysis in dialectical behavior therapy. Cognitive and Behavioral Practice, 21(3), 335-349.',
    ],
    visual: 'chain_analysis', status: 'complete',
  },

  // ── Técnica 15: Registro Diario de Pensamientos ──────────────────────────────
  {
    id:           'registro_pensamientos',
    name:         'Registro Diario de Pensamientos',
    abbr:         'RDP',
    tagline:      'Atrapar, examinar y reencuadrar pensamientos automáticos en papel',
    category:     'reestructuracion_cognitiva',
    traditions:   ['TCC'],
    difficulty:   2,
    sessionCount: '2–4 sesiones de entrenamiento + uso continuo',
    summary:      'Herramienta escrita central de la TCC de Beck: el cliente registra situación, emoción, pensamiento automático, evidencias a favor/en contra y respuesta racional alternativa.',
    tags:         ['pensamientos automáticos', 'reestructuración', 'autorregistro', 'Beck', 'triple columna', 'diario'],
    definition:
      'El Registro Diario de Pensamientos (RDP) es un formulario estructurado que guía al paciente para capturar episodios de malestar emocional e identificar los pensamientos automáticos subyacentes. En su versión completa (5–7 columnas), incluye: Situación, Emoción(es), Pensamiento automático, Evidencias a favor, Evidencias en contra, Respuesta alternativa racional y Resultado emocional. Es el instrumento pedagógico central del modelo cognitivo de Beck.',
    mechanism:
      'Actúa sobre el sesgo de confirmación y el procesamiento automático-rápido (Sistema 1): al requerir escritura deliberada, activa el Sistema 2 (analítico), interrumpe la fusión cognitiva y permite evaluar los pensamientos como hipótesis en lugar de hechos. Genera distancia metacognitiva, entrena la monitorización de estados internos y provee datos empíricos para la reestructuración en sesión.',
    steps: [
      {
        n: 1, title: 'Psicoeducación del modelo cognitivo',
        body: 'Explicar el triángulo situación → pensamiento → emoción/conducta. Usar un ejemplo personal relevante del paciente para anclar el concepto.',
        tip: 'Evitar el término "distorsión" en las primeras sesiones; preferir "interpretación automática" — reduce defensividad.',
        example: '"Cuando llegaste tarde y tu jefe no dijo nada, ¿qué pasó por tu cabeza en ese momento?"',
      },
      {
        n: 2, title: 'Demostración en sesión (versión 3 columnas)',
        body: 'Trabajar juntos un episodio reciente con el formato simplificado: Situación | Pensamiento automático | Emoción (%). Completar en pizarra o papel compartido.',
        tip: 'Empezar con 3 columnas antes de introducir la versión completa — la curva de aprendizaje es crítica para la adherencia.',
        example: 'Situación: "Me quedé mirando el techo a las 2 am" → PA: "No voy a poder con todo" → Emoción: Ansiedad 80%',
      },
      {
        n: 3, title: 'Identificación de pensamientos automáticos (PA)',
        body: 'Enseñar señales de activación de PA: cambio abrupto de humor, imagen o frase que "aparece sola", sensación física repentina. Practicar la pregunta: "¿Qué pasó por tu mente justo antes de sentirte así?"',
        substeps: [
          'Distinguir PA de emociones (los PA son proposiciones, las emociones son estados)',
          'Identificar el "pensamiento más cargado" cuando hay varios',
          'Notar si el PA es imagen o memoria vívida, no solo frase verbal',
        ],
        tip: 'Los PA de pacientes deprimidos suelen ser sobre pérdida/fracaso; los de ansiedad sobre peligro/amenaza futura.',
      },
      {
        n: 4, title: 'Evaluación de evidencias',
        body: 'Guiar al paciente a generar evidencias empíricas —no contra-argumentos lógicos— tanto a favor como en contra del PA. La columna "en contra" suele requerir trabajo socrático.',
        substeps: [
          'Evidencias a favor: hechos concretos que apoyan el pensamiento',
          'Evidencias en contra: datos objetivos, excepciones, perspectiva de terceros',
          'Ponderar: ¿cuánto peso tiene cada columna?',
        ],
        tip: 'Evitar la trampa de producir una lista de "contra-evidencias" positivas vacías — cada evidencia debe ser verificable empíricamente.',
        example: 'PA: "Soy un mal padre" → A favor: "Llegué tarde 3 veces esta semana" → En contra: "Fui a su función escolar, ayudo con tareas cada noche, conoce mi trabajo"',
      },
      {
        n: 5, title: 'Formulación de respuesta alternativa',
        body: 'Construir con el paciente una respuesta más equilibrada que integre ambas columnas de evidencias. No debe ser positiva forzada, sino realista y matizada.',
        tip: 'La respuesta alternativa efectiva suele empezar con "Es cierto que… y también es cierto que…" — valida la experiencia sin negarlo.',
        example: '"Es cierto que esta semana estuve ausente más de lo que quería. Y también es cierto que cuando estoy presente, me involucro activamente. Puedo mejorar sin concluir que soy un mal padre."',
      },
      {
        n: 6, title: 'Re-evaluación emocional',
        body: 'Solicitar al paciente que re-evalúe la intensidad de la emoción original (0–100) después de completar el registro. El cambio —aunque sea parcial— refuerza la utilidad del ejercicio.',
        tip: 'Un descenso de 15–20 puntos ya es clínicamente significativo y vale la pena celebrar. No esperar que la emoción desaparezca.',
      },
      {
        n: 7, title: 'Asignación como tarea intersesión',
        body: 'Indicar al paciente que complete al menos 2–3 registros entre sesiones, idealmente cerca en tiempo al episodio. Revisar en la siguiente sesión como prioridad.',
        substeps: [
          'Proporcionar hojas impresas o acceso a app (MoodTools, Therapist Aid, etc.)',
          'Acordar el momento diario de revisión (ej. antes de dormir)',
          'Anticipar obstáculos: "¿Qué podría dificultar hacerlo esta semana?"',
        ],
        tip: 'El mayor predictor de no-adherencia es el tiempo: si el paciente espera para completar el registro, los PA se diluyen. Enseñar el registro rápido en el celular.',
      },
    ],
    evaluation: {
      process:  'Evaluar la calidad del pensamiento alternativo (¿es equilibrado o solo positivo?), la especificidad de las evidencias y el cambio en intensidad emocional.',
      criteria: [
        'PA identificados con lenguaje proposicional claro (no emociones)',
        'Columna de evidencias con al menos 3 datos concretos por lado',
        'Respuesta alternativa no maximamente positiva sino matizada',
        'Re-evaluación emocional ≥10 puntos de descenso en la mayoría de registros',
        'Adherencia: ≥2 registros por semana sin prompting',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Registro Diario de Pensamientos (7 col.)', desc: 'Formulario completo con las 7 columnas de Beck — descargable de Therapist Aid o Centre for Clinical Interventions.' },
        { type: 'escala', name: 'Inventario de Depresión de Beck-II', abbr: 'BDI-II', desc: 'Monitoriza cambios semanales en cogniciones depresogénicas.' },
        { type: 'escala', name: 'Inventario de Ansiedad de Beck', abbr: 'BAI', desc: 'Complementa el BDI cuando hay comorbilidad ansiosa.' },
        { type: 'cuestionario', name: 'Dysfunctional Attitude Scale', abbr: 'DAS', desc: 'Mide creencias disfuncionales subyacentes (supuestos y esquemas).' },
      ],
      timeline:  'Entrenamiento en sesiones 2–4; uso continuo como tarea; revisión breve en cada sesión posterior.',
      followUp:  'A los 3 meses evaluar si el paciente puede completar el proceso mentalmente (internalización) sin necesitar el papel.',
    },
    resources: [
      { type: 'hoja_registro', name: 'RDP 3 Columnas (inicio)', desc: 'Versión simplificada para introducir el método: Situación | PA | Emoción.' },
      { type: 'hoja_registro', name: 'RDP 7 Columnas (completo)', desc: 'Versión estándar de Beck con evaluación de evidencias y respuesta alternativa.' },
      { type: 'cuestionario', name: 'Lista de Distorsiones Cognitivas', desc: 'Hoja de referencia con los 15 tipos de distorsiones para que el paciente las identifique en sus PA.' },
      { type: 'protocolo', name: 'Guía de Entrenamiento en 4 Sesiones', desc: 'Protocolo estructurado para enseñar el RDP progresivamente: 3 col. → 5 col. → 7 col.' },
    ],
    indications: [
      'Depresión mayor como intervención de primera línea',
      'Trastornos de ansiedad con rumiación cognitiva prominente',
      'TOC como complemento de EPR para evaluar las cogniciones obsesivas',
      'Baja autoestima con autocrítica automática',
      'Dificultad para conectar situaciones externas con estados emocionales internos',
    ],
    contraindications: [
      'Pacientes en fase activa de psicosis o con pensamiento muy desorganizado',
      'Baja alfabetización o dificultades cognitivas severas (adaptar a formato verbal/audio)',
      'Fase de crisis aguda — estabilizar antes de iniciar trabajo cognitivo',
      'Resistencia muy alta al enfoque racional — considerar ACT/validación primero',
      'Perfeccionismo extremo que convierte el registro en fuente de autoexigencia adicional (monitorizar)',
    ],
    outcomes: [
      { domain: 'Cognitivo', items: ['Reducción en frecuencia e intensidad de PA', 'Incremento en flexibilidad cognitiva (DAS)', 'Mayor capacidad de decentering / perspectiva metacognitiva'] },
      { domain: 'Emocional', items: ['Descenso en BDI-II y BAI', 'Reducción de intensidad emocional en episodios cotidianos', 'Mayor tolerancia a emociones negativas al comprenderlas'] },
      { domain: 'Conductual', items: ['Menor evitación de situaciones asociadas a PA', 'Incremento en conductas de aproximación', 'Mayor automonitorización como habilidad generalizada'] },
    ],
    organizingVars: [
      { category: 'Cognitivas', items: ['Nivel de insight sobre el modelo cognitivo', 'Tendencia a la rumiación (facilita la identificación de PA pero puede obstaculizar la distancia)', 'Capacidad de introspección y alfabetización emocional'] },
      { category: 'Biológicas', items: ['Severidad depresiva (BDI >28 puede requerir simplificación del método)', 'Fatiga cognitiva que dificulta el procesamiento de múltiples columnas'] },
      { category: 'Relacionales', items: ['Calidad de la alianza (el RDP revela contenidos íntimos que requieren confianza)', 'Apoyo del entorno para la realización de tareas'] },
    ],
    references: [
      'Beck, A.T., Rush, A.J., Shaw, B.F. & Emery, G. (1979). Cognitive Therapy of Depression. Guilford.',
      'Beck, J.S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford.',
      'Burns, D.D. (1980). Feeling Good: The New Mood Therapy. William Morrow.',
      'Greenberger, D. & Padesky, C.A. (2015). Mind Over Mood (2nd ed.). Guilford.',
    ],
    visual: 'thought_record', status: 'complete',
  },

  // ── Técnica 16: Regulación Emocional DBT ─────────────────────────────────────
  {
    id:           'regulacion_emocional_dbt',
    name:         'Regulación Emocional (Módulo DBT)',
    abbr:         'RE-DBT',
    tagline:      'Entender, reducir vulnerabilidad y cambiar emociones intensas',
    category:     'regulacion_emocional',
    traditions:   ['DBT'],
    difficulty:   2,
    sessionCount: '6–12 sesiones (módulo completo en grupo DBT estándar)',
    summary:      'Módulo DBT que enseña a identificar funciones de las emociones, reducir vulnerabilidad biológica mediante hábitos saludables (PLEASE) y cambiar emociones usando acción opuesta.',
    tags:         ['DBT', 'regulación emocional', 'acción opuesta', 'PLEASE', 'Linehan', 'validación', 'olas emocionales'],
    definition:
      'El módulo de Regulación Emocional de DBT (Linehan, 1993) agrupa un conjunto de habilidades orientadas a comprender las emociones, reducir la vulnerabilidad emocional y cambiar emociones no deseadas. Sus componentes nucleares son: (a) psicoeducación de las funciones adaptativas de las emociones, (b) reducción de vulnerabilidad con el acrónimo PLEASE (trata enfermedades físicas, come equilibrado, evita sustancias, duerme bien, haz ejercicio), (c) acumulación de emociones positivas a corto y largo plazo, (d) acción opuesta para cambiar emociones que no se ajustan a los hechos, y (e) resolución de problemas cuando la emoción sí se ajusta a los hechos.',
    mechanism:
      'Actúa en tres niveles: (1) Cognitivo — la psicoeducación reduce la fusión con la emoción al comprenderla como fenómeno adaptativo universal; (2) Fisiológico — el protocolo PLEASE baja la temperatura emocional basal reduciendo las condiciones biológicas de vulnerabilidad; (3) Conductual — la Acción Opuesta interrumpe el ciclo emoción → conducta que la refuerza (ej. aislarse refuerza la tristeza), reemplazándolo por conductas incompatibles con la emoción no deseada.',
    steps: [
      {
        n: 1, title: 'Psicoeducación: funciones adaptativas de las emociones',
        body: 'Enseñar que las emociones tienen función evolutiva: comunican, motivan acción, señalan valores. Usar el modelo de "ola emocional" — ninguna emoción dura para siempre si no se alimenta.',
        tip: 'La metáfora de la ola es poderosa: "Puedes surfearla o luchar contra ella — si luchas, te ahoga más rápido."',
        example: '"El miedo me hace escapar del peligro. La culpa me señala que violé mis valores. ¿Qué te está señalando tu tristeza ahora?"',
      },
      {
        n: 2, title: 'Identificar y nombrar emociones',
        body: 'Entrenar en el modelo multi-componente de la emoción: evento disparador → interpretación → respuesta fisiológica → impulso de acción → expresión. Usar hojas de registro de emociones DBT.',
        substeps: [
          'Distinguir emoción primaria (automática) de emoción secundaria (reacción a la emoción)',
          'Nombrar con precisión: "tristeza" vs "decepción" vs "melancolía" generan estrategias distintas',
          'Identificar el impulso de acción asociado (la emoción "quiere" hacer algo)',
        ],
        tip: 'Muchos pacientes etiquetan estados corporales (tensión, agitación) como emociones. Entrenar la discriminación primero.',
      },
      {
        n: 3, title: 'PLEASE — Reducción de vulnerabilidad biológica',
        body: 'Revisar y trabajar cada componente del acrónimo PLEASE como base de la regulación emocional. La metáfora: "Es imposible regular emociones con un cerebro en llamas."',
        substeps: [
          'P/L — Trata enfermedades físicas / Evita sustancias alteradoras del estado de ánimo',
          'E — Come de manera Equilibrada (sin saltarse comidas ni atracones)',
          'A — Abstente de sustancias que alteran el humor',
          'S — Sueño saludable: horario regular, higiene del sueño',
          'E — Ejercicio: mínimo 30 min actividad aeróbica, 5 días/semana',
        ],
        tip: 'El PLEASE no es "bienestar general" — es reducción directa de vulnerabilidad emocional. Conectar cada componente con episodios del paciente.',
        example: '"La semana que no dormiste bien y saltaste comidas, ¿cómo fue tu temperatura emocional? ¿Y la semana que hiciste ejercicio?"',
      },
      {
        n: 4, title: 'Acumulación de emociones positivas (corto plazo)',
        body: 'Ayudar al paciente a identificar e incrementar actividades placenteras diarias. Usar lista de actividades agradables adaptada culturalmente. El objetivo es balancear el déficit de emociones positivas.',
        substeps: [
          'Listar actividades que solían generar placer (antes de la depresión/crisis)',
          'Planificar al menos 1 actividad placentera por día',
          'Practicar mindfulness pleno durante la actividad (atención total al momento)',
        ],
        tip: 'Distinguir del modelo de activación conductual: aquí el énfasis está en experimentar la emoción positiva, no solo en el comportamiento.',
      },
      {
        n: 5, title: 'Acción Opuesta (Opposite Action)',
        body: 'Habilidad central: identificar la emoción, verificar si se ajusta a los hechos (¿es proporcional?, ¿el peligro es real?), y si NO se ajusta, actuar en dirección opuesta al impulso.',
        substeps: [
          'Identificar la emoción y su impulso de acción asociado',
          'Evaluar: ¿esta emoción se ajusta a los hechos del contexto actual?',
          'Si NO se ajusta (ej. miedo a una situación segura, vergüenza sin transgresión real):',
          '→ Actuar opuesto al impulso: acercarse (en lugar de evitar), mantener la cabeza alta (en lugar de esconder)',
          'Repetir la acción opuesta COMPLETAMENTE — no a medias',
        ],
        tip: 'La Acción Opuesta debe ser total. "Acercarse tímidamente" mientras se siente miedo no es opuesto suficiente — la postura, la voz, la expresión también cuentan.',
        example: 'Emoción: vergüenza → Impulso: esconderse, aislarse → Acción Opuesta: compartir el episodio con alguien de confianza, mantener contacto visual.',
      },
      {
        n: 6, title: 'Resolución de problemas (cuando la emoción SÍ se ajusta)',
        body: 'Si la emoción ES proporcional y adaptativa (ej. miedo real, tristeza por pérdida genuina), la estrategia no es cambiarla sino resolver la situación que la genera.',
        tip: 'Error frecuente: aplicar Acción Opuesta a emociones válidas. Si el miedo es real, necesitas resolución de problemas, no supresión emocional.',
      },
      {
        n: 7, title: 'Mindfulness de la emoción actual (surfear la ola)',
        body: 'Cuando la emoción es intensa pero no hay acción útil disponible, practicar observar la emoción sin juzgarla, sin actuar desde ella y sin suprimirla. Metáfora del surf: cabalgar la ola hasta que pase.',
        substeps: [
          'Observar la emoción como fenómeno físico (dónde en el cuerpo, qué forma tiene)',
          'Recordar: la emoción no es peligrosa aunque sea intensa',
          'No actuar desde el impulso — simplemente observar',
        ],
        tip: 'El mindfulness de la emoción reduce la intensidad emocional secundaria (la emoción por tener la emoción), aunque no elimine la emoción primaria.',
      },
    ],
    evaluation: {
      process:  'Monitorizar frecuencia e intensidad emocional, uso de habilidades PLEASE y episodios de acción opuesta completada.',
      criteria: [
        'Paciente puede nombrar emociones con precisión y multi-componente',
        'Adherencia a ≥3 componentes PLEASE por semana',
        'Al menos 1 acción opuesta completada por semana en situaciones relevantes',
        'Reducción en conductas disfuncionales de regulación (autolesión, abuso de sustancias, conductas impulsivas)',
        'Incremento en emociones positivas en registro diario',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Hoja de Registro de Emociones DBT', desc: 'Formato estándar DBT: emoción, disparador, interpretación, sensaciones, impulso, acción, acción opuesta.' },
        { type: 'checklist', name: 'Tarjeta Diaria DBT (Diary Card)', desc: 'Monitoreo diario de uso de habilidades, intensidad emocional y conductas problema.' },
        { type: 'escala', name: 'Difficulties in Emotion Regulation Scale', abbr: 'DERS', desc: 'Evalúa múltiples dimensiones de desregulación emocional (Gratz & Roemer, 2004).' },
        { type: 'escala', name: 'Emotional Reactivity Scale', abbr: 'ERS', desc: 'Mide sensibilidad, intensidad y persistencia emocional.' },
      ],
      timeline:  'Módulo grupal DBT estándar: 6–8 semanas. En individual: integrado según presentación del paciente.',
      followUp:  'Revisar la Diary Card semanalmente; evaluar DERS a los 3 y 6 meses para medir cambios en desregulación.',
    },
    resources: [
      { type: 'hoja_registro', name: 'Hoja de Registro de Emociones DBT', desc: 'Modelo de registro multi-componente para trabajar cada episodio emocional.' },
      { type: 'checklist', name: 'Diary Card DBT', desc: 'Registro diario de emociones, habilidades usadas y conductas problema.' },
      { type: 'hoja_registro', name: 'Ficha PLEASE', desc: 'Checklist semanal de los 5 componentes de reducción de vulnerabilidad biológica.' },
      { type: 'protocolo', name: 'Lista de Actividades Agradables DBT', desc: 'Lista adaptada culturalmente de 100+ actividades placenteras para acumulación de emociones positivas.' },
    ],
    indications: [
      'Trastorno Límite de la Personalidad (TLP) como parte del protocolo DBT completo',
      'Desregulación emocional significativa en depresión, ansiedad y TEPT',
      'Conductas de regulación disfuncionales (autolesiones, atracones, consumo)',
      'Alta sensibilidad emocional temperamental ("piel fina emocional")',
      'Pacientes que han trabajado habilidades de tolerancia al malestar y están listos para regulación activa',
    ],
    contraindications: [
      'Sin un mínimo de skills de tolerancia al malestar — la regulación activa puede generar más frustración',
      'Psicosis activa o manía — estabilización farmacológica primero',
      'Negación total de la emoción como estrategia rígida (necesita trabajo de validación primero)',
    ],
    outcomes: [
      { domain: 'Emocional', items: ['Reducción en DERS (desregulación emocional)', 'Mayor vocabulario emocional y granularidad afectiva', 'Reducción en intensidad y duración de episodios emocionales'] },
      { domain: 'Conductual', items: ['Reducción en conductas de regulación disfuncional (autolesión, consumo)', 'Mayor frecuencia de acciones opuestas completadas', 'Incremento en actividades placenteras'] },
      { domain: 'Biológico', items: ['Mejoras en higiene del sueño y hábitos PLEASE', 'Reducción en respuesta fisiológica de alerta (HR, cortisol)'] },
    ],
    organizingVars: [
      { category: 'Temperamentales', items: ['Alta sensibilidad emocional constitucional (amplifica tanto el aprendizaje como la dificultad)', 'Impulsividad que interfiere con la implementación de acción opuesta'] },
      { category: 'Históricas', items: ['Entorno invalidante que castigó la expresión emocional (genera vergüenza secundaria)', 'Historia de trauma que condiciona respuestas emocionales desproporcionadas'] },
      { category: 'Relacionales', items: ['Calidad de la alianza terapéutica como regulador externo', 'Redes de apoyo disponibles para co-regulación'] },
    ],
    references: [
      'Linehan, M.M. (1993). Skills Training Manual for Treating Borderline Personality Disorder. Guilford.',
      'Linehan, M.M. (2014). DBT Skills Training Manual (2nd ed.). Guilford.',
      'Gratz, K.L. & Roemer, L. (2004). Multidimensional assessment of emotion regulation and dysregulation. Journal of Psychopathology and Behavioral Assessment, 26(1), 41–54.',
      'McKay, M., Wood, J.C. & Brantley, J. (2007). The Dialectical Behavior Therapy Skills Workbook. New Harbinger.',
    ],
    status: 'complete',
  },

  // ── Técnica 17: Respiración Diafragmática ─────────────────────────────────────
  {
    id:           'respiracion_diafragmatica',
    name:         'Respiración Diafragmática Controlada',
    abbr:         'RDC',
    tagline:      'Activar el sistema nervioso parasimpático mediante el control voluntario de la respiración',
    category:     'relajacion',
    traditions:   ['Conductual', 'TCC'],
    difficulty:   1,
    sessionCount: '1–2 sesiones de entrenamiento + práctica diaria',
    summary:      'Técnica de control respiratorio que reduce la activación autonómica mediante respiración lenta y diafragmática, contrarrestando la hiperventilación asociada a la ansiedad.',
    tags:         ['respiración', 'relajación', 'ansiedad', 'activación autonómica', 'parasimpático', 'hiperventilación', 'pánico'],
    definition:
      'La Respiración Diafragmática Controlada (RDC) es una técnica de regulación fisiológica que entrena al paciente en el uso del diafragma —en lugar de los músculos torácicos superficiales— para respirar de forma lenta, profunda y rítmica. La frecuencia objetivo es típicamente 6 respiraciones por minuto (ciclos de 4–6 s inhalación / 4–6 s exhalación), lo que maximiza la variabilidad de la frecuencia cardíaca (HRV) y activa el nervio vago. Es la intervención de primera línea para el control del pánico, la ansiedad de ejecución y la hiperventilación crónica.',
    mechanism:
      'La respiración torácica rápida activa el sistema nervioso simpático (SNS) vía hiperventilación: reduce la pCO₂, produce vasoconstricción cerebral y periférica, y genera sensaciones físicas que el paciente con pánico catastrofiza. La respiración diafragmática lenta: (1) aumenta la pCO₂ normalizando el balance ácido-base, (2) activa los barorreceptores aórticos que estimulan el nervio vago, (3) incrementa la HRV —marcador de flexibilidad autonómica— y (4) interrumpe el ciclo ansiedad → hiperventilación → más ansiedad.',
    steps: [
      {
        n: 1, title: 'Psicoeducación: el ciclo respiración-ansiedad',
        body: 'Explicar cómo la hiperventilación produce los síntomas físicos de la ansiedad (mareo, hormigueo, presión torácica, palpitaciones) y cómo esto crea un ciclo autoperpetuante en el pánico.',
        tip: 'Para pacientes con trastorno de pánico, hacer una breve demostración de hiperventilación voluntaria (30 s de respiración rápida) para que el paciente reconozca sus propios síntomas como respiratorios, no peligrosos.',
        example: '"Cuando respiras muy rápido, bajas el CO₂ en sangre. Eso produce exactamente lo que sientes: mareo, hormigueo, sensación de irrealidad. No es peligroso — es química."',
      },
      {
        n: 2, title: 'Instrucción postural',
        body: 'Posición sentada erguida o decúbito supino. Colocar una mano en el abdomen (a nivel del ombligo) y otra en el tórax. El objetivo es que solo se mueva la mano abdominal durante la inhalación.',
        substeps: [
          'Cabeza y cuello relajados, hombros caídos (no encogidos)',
          'Mano en pecho → debe permanecer quieta',
          'Mano en abdomen → debe elevarse durante la inhalación, descender durante la exhalación',
        ],
        tip: 'Los pacientes con ansiedad crónica tienen un patrón torácico tan automatizado que inicialmente moverán el pecho. Es normal — necesita práctica deliberada.',
      },
      {
        n: 3, title: 'Práctica del ritmo 4-4 (inicio)',
        body: 'Inhalación lenta por la nariz contando 4 segundos → Exhalación lenta por la boca/nariz contando 4 segundos. Sin pausa al inicio. Repetir durante 5 minutos.',
        tip: 'El ritmo debe ser cómodo. Si el paciente siente que "le falta aire", está luchando contra el ritmo — reducir a 3-3 primero.',
      },
      {
        n: 4, title: 'Progresión al ritmo 4-6 (optimización)',
        body: 'Una vez dominado el 4-4, extender la exhalación a 6 segundos (ratio inhalación/exhalación de 1:1.5 o 1:2). La exhalación prolongada activa más intensamente el nervio vago.',
        substeps: [
          'Inhalación: 4 s por nariz',
          'Pausa suave (opcional): 1–2 s',
          'Exhalación: 6 s lenta por boca (como si soplara a través de una pajita)',
        ],
        tip: '"Frunce un poco los labios al exhalar — eso ralentiza automáticamente el flujo de aire y facilita el control del ritmo."',
        example: 'El ritmo óptimo para maximizar HRV es ~6 respiraciones/min = ciclos de 10 s. Adaptar según confort del paciente.',
      },
      {
        n: 5, title: 'Práctica sin apoyo de manos',
        body: 'Una vez que el movimiento diafragmático es automático, practicar sin las manos en el abdomen. Objetivo: el patrón sea activable en cualquier situación (reunión, transporte, evaluación).',
        tip: 'El criterio de maestría no es la técnica perfecta en casa, sino poder activarla discretamente en situaciones de alta activación.',
      },
      {
        n: 6, title: 'Integración situacional',
        body: 'Practicar la respiración durante situaciones de activación moderada (antes de llamadas difíciles, en sala de espera, etc.) para generalizar la habilidad.',
        substeps: [
          'Identificar las 3 situaciones de mayor activación del paciente',
          'Acordar usar RDC 2 minutos ANTES de cada una (prevención)',
          'Usar también durante la exposición como habilidad de afrontamiento (con cuidado de no convertirla en evitación)',
        ],
        tip: 'En el contexto de exposición, la RDC se usa para mantener la activación en un rango manejable, no para eliminarla — demasiada reducción de ansiedad puede interferir con el aprendizaje inhibitorio.',
      },
    ],
    evaluation: {
      process:  'Evaluar la calidad del patrón respiratorio (diafragmático vs torácico), el ritmo logrado y la capacidad de activar la habilidad en situaciones reales.',
      criteria: [
        'Patrón diafragmático sostenido: mano abdominal se eleva, mano torácica quieta',
        'Ritmo ≤8 respiraciones/min mantenido por 5 minutos',
        'Activación en situaciones de estrés real (no solo en sesión)',
        'Reducción en síntomas de hiperventilación (hormigueo, mareo) durante crisis de ansiedad',
        'Práctica diaria ≥5 min reportada en autorregistro',
      ],
      instruments: [
        { type: 'hoja_registro', name: 'Diario de Práctica de Respiración', desc: 'Registro de frecuencia de práctica, contexto, nivel de ansiedad pre/post (0–10).' },
        { type: 'escala', name: 'Nijmegen Questionnaire', abbr: 'NQ', desc: 'Cuestionario de síntomas de hiperventilación — útil para establecer baseline y seguimiento.' },
        { type: 'protocolo', name: 'Medición de HRV', desc: 'Apps como Elite HRV o dispositivos wearables pueden objetivar el efecto de la práctica sobre la variabilidad cardíaca.' },
      ],
      timeline:  'Entrenamiento en 1–2 sesiones; práctica diaria de 5–10 min durante al menos 3 semanas para automatización.',
      followUp:  'A las 4 semanas evaluar: ¿usa la técnica en situaciones reales? ¿Mantiene práctica sin supervisión?',
    },
    resources: [
      { type: 'hoja_registro', name: 'Diario de Práctica de Respiración', desc: 'Registro de sesiones de práctica con nivel de ansiedad pre/post.' },
      { type: 'protocolo', name: 'Audio-guía de Respiración 4-6', desc: 'Archivo de audio con guía de ritmo (disponible en Insight Timer, Calm, o grabado por el terapeuta).' },
      { type: 'checklist', name: 'Ficha de Ritmos de Respiración', desc: 'Guía visual de los diferentes ritmos (4-4, 4-6, 4-8) con sus indicaciones clínicas.' },
    ],
    indications: [
      'Trastorno de Pánico — intervención de primera línea junto a EPR',
      'Ansiedad generalizada con hiperventilación crónica',
      'Ansiedad de ejecución (hablar en público, exámenes, actuaciones)',
      'TEPT como parte de estabilización antes de procesamiento traumático',
      'Cualquier protocolo de relajación o manejo del estrés',
      'Antes y durante procedimientos médicos estresantes',
    ],
    contraindications: [
      'EPOC u otras condiciones respiratorias obstructivas (adaptar con supervisión médica)',
      'Trastorno de Pánico con miedo extremo a sensaciones respiratorias — puede generar hipervigilancia interoceptiva; usar con precaución o después de psicoeducación',
      'Cuando se usa para evitar el contacto con la ansiedad en exposición (monitorizar si interfiere con aprendizaje inhibitorio)',
    ],
    outcomes: [
      { domain: 'Fisiológico', items: ['Reducción en frecuencia cardíaca en reposo', 'Incremento en HRV', 'Normalización de pCO₂ y reducción de síntomas de hiperventilación'] },
      { domain: 'Emocional', items: ['Reducción en intensidad de ansiedad situacional', 'Menor interferencia de síntomas físicos en situaciones de evaluación'] },
      { domain: 'Conductual', items: ['Reducción del evitación de situaciones disparadoras de ansiedad', 'Mayor sensación de auto-eficacia en el manejo de la ansiedad'] },
    ],
    organizingVars: [
      { category: 'Biológicas', items: ['Sensibilidad interoceptiva basal (alta sensibilidad facilita conciencia del ritmo)', 'Condiciones respiratorias comórbidas que limitan el control voluntario'] },
      { category: 'Psicológicas', items: ['Nivel de sensibilidad a la ansiedad (miedo al miedo) — puede generar hipervigilancia con la técnica', 'Capacidad de concentración sostenida para el entrenamiento del ritmo'] },
      { category: 'Contextuales', items: ['Disponibilidad de tiempo y espacio para práctica regular', 'Acceso a tecnología para apps de HRV o audios guía'] },
    ],
    references: [
      'Barlow, D.H. & Craske, M.G. (2007). Mastery of Your Anxiety and Panic (MAP-4). Oxford University Press.',
      'Lehrer, P.M. & Gevirtz, R. (2014). Heart rate variability biofeedback: How and why does it work? Frontiers in Psychology, 5, 756.',
      'Ley, R. (1988). Hyperventilation and lactate infusion in the production of panic attacks. Clinical Psychology Review, 8(1), 1–18.',
      'Clark, D.M. (1986). A cognitive approach to panic. Behaviour Research and Therapy, 24(4), 461–470.',
    ],
    status: 'complete',
  },

  // ── Técnica 18: Valores y Acción Comprometida (ACT) ──────────────────────────
  {
    id:           'valores_act',
    name:         'Clarificación de Valores y Acción Comprometida',
    abbr:         'VAC',
    tagline:      'Vivir en dirección a lo que importa, incluso en presencia de malestar',
    category:     'mindfulness_aceptacion',
    traditions:   ['ACT', 'Tercera Generación'],
    difficulty:   2,
    sessionCount: '3–6 sesiones nucleares, integrado en toda la terapia ACT',
    summary:      'Núcleo del hexaflex ACT: ayuda al paciente a distinguir valores (direcciones de vida) de metas (eventos logrados), identificar sus valores genuinos y comprometerse con acciones consistentes con ellos, incluso cuando el malestar está presente.',
    tags:         ['ACT', 'valores', 'acción comprometida', 'hexaflex', 'Hayes', 'dirección de vida', 'aceptación', 'flexibilidad psicológica'],
    definition:
      'En ACT (Hayes, Strosahl & Wilson, 1999), los Valores son direcciones libremente elegidas de vida que dan sentido y propósito — no son metas que se alcanzan sino cualidades de acción que se habitan. La Acción Comprometida es el compromiso de actuar en la dirección de los valores elegidos, incluso en presencia de pensamientos, emociones y sensaciones físicas difíciles. Juntos constituyen dos de los seis procesos del Hexaflex ACT y son el puente entre la aceptación interna y el cambio conductual externo.',
    mechanism:
      'La clarificación de valores opera a través de varios mecanismos: (1) Proporciona motivación intrínseca que no depende de la ausencia de malestar — el paciente puede moverse "hacia algo" en lugar de "alejarse del dolor"; (2) Genera contexto motivacional que hace tolerable el malestar necesario para la acción (análogo al efecto analgésico del propósito); (3) Activa el yo-como-contexto: el paciente se define por sus valores, no por sus síntomas; (4) Interrumpe la evitación experiencial al proveer razones para moverse hacia lo que importa a pesar del malestar.',
    steps: [
      {
        n: 1, title: 'Distinción valores vs. metas',
        body: 'Establecer la diferencia clave: una meta se completa (casarse), un valor se habita (ser un compañero amoroso). Los valores son como una brújula que indica dirección, no como un destino al que se llega.',
        tip: '"Si te conviertes en un compañero amoroso en este matrimonio y luego tu pareja muere, ¿sigues pudiendo vivir ese valor?" — esta pregunta ayuda a distinguir el valor de la relación.',
        example: '"Terminar la carrera" es una meta. "Aprender con curiosidad y contribuir al conocimiento" es un valor. La meta puede fallarse; el valor puede habitarse en cualquier momento.',
      },
      {
        n: 2, title: 'Identificación de dominios de vida',
        body: 'Explorar los principales dominios de vida con el Bull\'s Eye (Diana de Valores) o el cuestionario VLQ. Dominios típicos: relaciones íntimas, familia, amigos, trabajo/carrera, educación, salud, espiritualidad, comunidad, ocio, ciudadanía.',
        substeps: [
          'Completar el cuestionario VLQ o la Diana de Valores para todos los dominios',
          'Identificar los 3–5 dominios más importantes para el paciente',
          'Notar la brecha entre importancia del dominio y consistencia de acción actual',
        ],
        tip: 'No todos los dominios tienen la misma relevancia. Enfocarse en los que el paciente identifica como centrales, no en los que "debería" valorar.',
      },
      {
        n: 3, title: 'Clarificación profunda de valores en dominios clave',
        body: 'Para cada dominio prioritario, explorar qué tipo de persona quiere ser el paciente en esa área. Usar el ejercicio del "Epitafio" o del "Funeral Imaginado" para acceder a valores profundos.',
        substeps: [
          'Ejercicio del Epitafio: "Si vivieras plenamente tus valores en esta área, ¿qué dirían de ti?"',
          'Distinguir valores propios de valores introyectados (de padres, cultura, deber)',
          'Explorar si los valores actuales son auténticos o evitación disfrazada ("valoro la tranquilidad" = ¿valor genuino o evitación del conflicto?)',
        ],
        tip: 'Los valores genuinos suelen ir acompañados de una sensación de vitalidad o significado, incluso cuando son difíciles. Los valores introyectados generan culpa o "deber".',
        example: 'Ejercicio del Funeral: "Imagina que estás en tu funeral dentro de 20 años. Alguien que te conoció bien habla de cómo viviste. ¿Qué querrías que dijera sobre cómo fuiste como padre/amigo/profesional?"',
      },
      {
        n: 4, title: 'Detección de barreras (fusión y evitación)',
        body: 'Explorar qué pensamientos, emociones o sensaciones aparecen cuando el paciente trata de actuar en dirección a sus valores. Estas barreras serán el objeto de trabajo en los módulos de defusión y aceptación.',
        substeps: [
          '"¿Qué aparece entre tú y vivir este valor?" — pensamiento, emoción, situación',
          'Identificar si la barrera es cognitiva (fusión) o emocional (evitación experiencial)',
          'Notar la historia que la mente cuenta sobre por qué no es posible',
        ],
        tip: 'El objetivo no es eliminar las barreras sino cambiar la relación con ellas: "¿Estás dispuesto a llevar ese malestar contigo mientras te mueves hacia lo que importa?"',
      },
      {
        n: 5, title: 'Metas y acciones comprometidas',
        body: 'Traducir valores en metas concretas y acciones específicas de los próximos 7 días. Usar el modelo SMART adaptado a ACT: la meta es un paso en la dirección del valor, no el valor mismo.',
        substeps: [
          'Definir 1–2 metas de corto plazo por valor prioritario',
          'Especificar la acción comprometida de esta semana: ¿qué, cuándo, cómo?',
          'Anticipar barreras y planificar respuesta: "Si aparece X, haré Y en lugar de evitar"',
          'Formular el compromiso: "Me comprometo a [acción específica] como un paso hacia [valor]"',
        ],
        tip: 'Las acciones comprometidas pequeñas y concretas son más efectivas que grandes planes. "Llamar a mi madre 10 minutos esta semana" > "Ser más cercano con mi familia".',
        example: 'Valor: "Ser un amigo presente" → Meta: "Retomar el contacto con Carlos" → Acción comprometida: "Enviarle un mensaje hoy preguntando cómo está, sin expectativa de respuesta inmediata."',
      },
      {
        n: 6, title: 'Revisión y ajuste del rumbo',
        body: 'En cada sesión, revisar las acciones comprometidas: ¿se completaron? ¿qué barreras aparecieron? ¿qué aprendió el paciente? Ajustar el plan sin juzgar el "fracaso" — es información sobre las barreras.',
        tip: '"No cumplir la acción comprometida no es fracaso — es datos. ¿Qué barrera apareció? ¿Cómo puedes llevarla contigo la próxima vez en lugar de dejarla en el mando?"',
      },
    ],
    evaluation: {
      process:  'Monitorizar la consistencia entre valores declarados y conductas observables, y la capacidad de moverse hacia valores en presencia de malestar.',
      criteria: [
        'Paciente articula ≥3 valores genuinos con lenguaje propio (no fórmulas)',
        'Identifica claramente la diferencia entre valores y metas',
        'Completa acciones comprometidas semanales en ≥2 dominios prioritarios',
        'Informa moverse hacia valores incluso cuando hay malestar presente',
        'Reducción en VLQ de la brecha importancia-consistencia en dominios clave',
      ],
      instruments: [
        { type: 'cuestionario', name: 'Valued Living Questionnaire', abbr: 'VLQ', desc: 'Evalúa importancia y consistencia de acción en 10 dominios de vida (Wilson & Groom, 2002).' },
        { type: 'hoja_registro', name: 'Diana de Valores (Bull\'s Eye)', desc: 'Representación visual de la distancia entre valores declarados y conducta actual en 4 cuadrantes.' },
        { type: 'hoja_registro', name: 'Hoja de Acciones Comprometidas', desc: 'Registro semanal de compromisos de acción por dominio de valor, con seguimiento de barreras.' },
        { type: 'cuestionario', name: 'Acceptance and Action Questionnaire-II', abbr: 'AAQ-II', desc: 'Mide flexibilidad psicológica / evitación experiencial — indicador de resultado central en ACT.' },
      ],
      timeline:  'Evaluación inicial de valores (VLQ + Diana) en sesión 1–2 del módulo. Revisión mensual durante la terapia.',
      followUp:  'A los 6 meses: ¿los valores son estables? ¿han surgido nuevos valores? ¿las acciones comprometidas son más autónomas?',
    },
    resources: [
      { type: 'cuestionario', name: 'VLQ — Valued Living Questionnaire', desc: 'Cuestionario de 10 dominios con escalas de importancia y consistencia de acción.' },
      { type: 'hoja_registro', name: 'Diana de Valores', desc: 'Herramienta visual para representar la brecha entre valores y conducta actual.' },
      { type: 'hoja_registro', name: 'Planilla de Acciones Comprometidas', desc: 'Formulario semanal para planificar acciones concretas en dirección a cada valor.' },
      { type: 'protocolo', name: 'Ejercicio del Funeral / Epitafio', desc: 'Guía del ejercicio experiencial para acceder a valores profundos mediante perspectiva temporal futura.' },
    ],
    indications: [
      'Como módulo central en cualquier terapia ACT',
      'Depresión con pérdida de sentido y anhedonia (alternativa a la activación conductual pura)',
      'Ansiedad crónica y evitación experiencial generalizada',
      'Crisis de identidad, crisis del ciclo vital, duelo de identidad',
      'Pacientes con alta adherencia a reglas sociales y desconexión de valores propios',
      'Complemento al tratamiento de adicciones (valores como ancla motivacional)',
    ],
    contraindications: [
      'Fase aguda de crisis o psicosis — la clarificación de valores requiere estabilidad mínima',
      'Sin trabajo previo de defusión cuando hay muy alta fusión cognitiva con pensamientos sobre los valores',
      'Contextos culturales donde el concepto de "valores individuales" es ajeno — adaptar a valores relacionales/comunitarios',
    ],
    outcomes: [
      { domain: 'Psicológico', items: ['Incremento en flexibilidad psicológica (AAQ-II)', 'Mayor sentido de vida y propósito (puede evaluarse con PIL)', 'Reducción en evitación experiencial'] },
      { domain: 'Conductual', items: ['Mayor consistencia entre valores y conducta (VLQ)', 'Incremento en conductas orientadas a metas significativas', 'Reducción en conductas de evitación'] },
      { domain: 'Bienestar', items: ['Mejora en satisfacción vital general', 'Incremento en emociones positivas relacionadas con el significado', 'Mayor sensación de autenticidad y coherencia'] },
    ],
    organizingVars: [
      { category: 'Culturales', items: ['Tradición cultural que valora el colectivo vs el individuo (puede requerir reencuadrar "valores" como relacionales)', 'Identidad religiosa que ya provee un marco de valores (facilita o puede crear conflicto)'] },
      { category: 'Históricas', items: ['Entorno que suprimió la expresión de preferencias propias (desconexión profunda de valores genuinos)', 'Historia de trauma que disociá al paciente de su sentido del futuro'] },
      { category: 'Cognitivas', items: ['Alto nivel de fusión cognitiva que convierte los valores en reglas rígidas', 'Dificultad para la perspectiva temporal futura (común en depresión severa)'] },
    ],
    references: [
      'Hayes, S.C., Strosahl, K.D. & Wilson, K.G. (1999). Acceptance and Commitment Therapy. Guilford.',
      'Hayes, S.C., Strosahl, K.D. & Wilson, K.G. (2011). Acceptance and Commitment Therapy (2nd ed.). Guilford.',
      'Wilson, K.G. & Murrell, A.R. (2004). Values work in acceptance and commitment therapy. In S.C. Hayes et al. (Eds.), Mindfulness and Acceptance. Guilford.',
      'Luoma, J.B., Hayes, S.C. & Walser, R.D. (2007). Learning ACT. New Harbinger.',
    ],
    status: 'complete',
  },

];
