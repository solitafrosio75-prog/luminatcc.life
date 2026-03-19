/**
 * generate-app-report.cjs
 *
 * Genera el informe técnico completo de TCC-Lab en formato DOCX.
 * Uso: node docs/generate-app-report.cjs
 */

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

// ── Design tokens ──────────────────────────────────────────────────────────────
const PAGE_W = 12240;
const MARGIN = 1440;
const CW = PAGE_W - 2 * MARGIN; // content width 9360
const ACCENT = "1A5276";
const ACCENT_LIGHT = "D4E6F1";
const GRAY = "F2F3F4";
const GREEN = "27AE60";
const GREEN_LIGHT = "D5F5E3";
const AMBER = "F39C12";
const AMBER_LIGHT = "FDEBD0";
const RED_LIGHT = "FADBD8";
const PURPLE = "8E44AD";
const PURPLE_LIGHT = "E8DAEF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellM = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Helpers ────────────────────────────────────────────────────────────────────

function hCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: ACCENT, type: ShadingType.CLEAR }, margins: cellM,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
  });
}
function cell(text, width, opts = {}) {
  const shading = opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined;
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, shading, margins: cellM,
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, bold: opts.bold, color: opts.color, italics: opts.italics })],
      alignment: opts.align,
    })],
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 200, before: opts.before ?? 0, line: opts.line ?? 276 },
    alignment: opts.align,
    children: [new TextRun({
      text, font: opts.font ?? "Arial", size: opts.size ?? 22,
      bold: opts.bold, italics: opts.italics, color: opts.color,
    })],
  });
}
function heading(text, level) {
  return new Paragraph({
    heading: level, spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 260, after: 160 },
    children: [new TextRun({ text, font: "Arial", bold: true, color: ACCENT,
      size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22 })],
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: `\u2022  ${text}`, font: "Arial", size: 20, bold: opts.bold, color: opts.color })],
  });
}
function codeBlock(lines) {
  return lines.map(l => new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: l, font: "Consolas", size: 18, color: "2C3E50" })],
    shading: { fill: GRAY, type: ShadingType.CLEAR },
  }));
}
function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "─".repeat(70), font: "Arial", size: 16, color: "CCCCCC" })],
  });
}
function emptyPara() { return new Paragraph({ spacing: { after: 80 }, children: [] }); }
function smallTable(rows, colWidths) {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    rows: rows.map((r, ri) => new TableRow({
      children: r.map((c, ci) => ri === 0 ? hCell(c, colWidths[ci]) : cell(c, colWidths[ci], { fill: ri % 2 === 0 ? GRAY : undefined })),
    })),
  });
}

// ── Document assembly ──────────────────────────────────────────────────────────

const children = [];

// ════════════════════════════════════════════════════════════════════════════════
// PORTADA
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  emptyPara(), emptyPara(), emptyPara(), emptyPara(), emptyPara(), emptyPara(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
    children: [new TextRun({ text: "TCC-Lab", font: "Arial", size: 56, bold: true, color: ACCENT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Laboratorio Experimental de Terapia Cognitivo-Conductual", font: "Arial", size: 24, color: "5D6D7E" })] }),
  divider(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Informe Tecnico Integral", font: "Arial", size: 36, bold: true, color: "2C3E50" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
    children: [new TextRun({ text: "Arquitectura, Modulos, Servicios y Vision de Producto", font: "Arial", size: 22, color: "7F8C8D" })] }),
  // Metadata table
  new Table({ width: { size: 5000, type: WidthType.DXA }, rows: [
    ["Version", "0.1.0 (Marzo 2026)"], ["Stack", "React 18 + TypeScript 5 + Vite 7"],
    ["Datos clinicos", "141 JSON / 9 tecnicas / 15,317 lineas"],
    ["Codigo fuente", "47,706 lineas TS/TSX + 23,466 en servicios"],
    ["Base de datos", "IndexedDB (Dexie.js) — 16 tablas clinicas"],
    ["IA", "Claude (Anthropic) via proxy seguro"],
    ["Fecha", "9 de Marzo de 2026"],
  ].map(([k, v]) => new TableRow({ children: [
    new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, margins: cellM,
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: k, font: "Arial", size: 20, bold: true, color: "5D6D7E" })] })] }),
    new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, margins: cellM,
      children: [new Paragraph({ children: [new TextRun({ text: v, font: "Arial", size: 20, color: "2C3E50" })] })] }),
  ] })) }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// ÍNDICE
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("Indice", HeadingLevel.HEADING_1),
  ...[
    "1.  Presentacion: Por Que TCC-Lab",
    "2.  Vision de Producto y Futuro",
    "3.  Arquitectura General",
    "4.  Stack Tecnologico",
    "5.  Estructura del Proyecto",
    "6.  Modulo: Protocolo de Sesion (7 Fases)",
    "7.  Modulo: Entrevista Clinica",
    "8.  Modulo: Terapeuta Perfecto",
    "9.  Modulo: Primer Encuentro",
    "10. Modulo: Sistema Emocional",
    "11. Servicios Clinicos (Capa de Logica)",
    "12. Base de Datos Clinica (Dexie/IndexedDB)",
    "13. Base de Conocimiento (KB)",
    "14. Integracion con IA (Claude/Anthropic)",
    "15. Sistema de Crisis",
    "16. DevTools y Herramientas de Desarrollo",
    "17. Estado de Madurez por Modulo",
    "18. Guia para Nuevos Desarrolladores",
    "19. Glosario",
  ].map(t => para(t, { size: 22, color: ACCENT })),
  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 1. PRESENTACIÓN
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("1. Presentacion: Por Que TCC-Lab", HeadingLevel.HEADING_1),

  para("La Terapia Cognitivo-Conductual (TCC) es el tratamiento psicologico con mayor evidencia cientifica para trastornos de ansiedad, depresion, TOC, PTSD y una amplia variedad de condiciones clinicas. Sin embargo, el acceso a terapeutas TCC capacitados es limitado: hay listas de espera de meses, costos elevados, y una brecha enorme entre la demanda de salud mental y la oferta de profesionales entrenados."),

  para("TCC-Lab nace de una pregunta concreta: es posible trasladar la estructura del protocolo TCC real — el mismo que sigue un terapeuta en consultorio — a un formato digital interactivo que pueda servir como herramienta de apoyo, entrenamiento y eventualmente intervencion asistida?"),

  heading("El problema que queremos resolver", HeadingLevel.HEADING_2),

  bullet("Acceso: Millones de personas no pueden acceder a un terapeuta TCC. Las listas de espera promedian 3-6 meses en sistemas publicos."),
  bullet("Estructura: Las apps de salud mental existentes son genericas (meditacion, journaling) sin seguir un protocolo clinico con evidencia."),
  bullet("Continuidad: Entre sesion y sesion, el paciente no tiene herramientas estructuradas para practicar lo que aprendio."),
  bullet("Formacion: Los terapeutas en formacion necesitan entender el flujo completo del protocolo TCC antes de practicar con pacientes reales."),
  bullet("Medicion: No existe una forma sencilla de medir el cambio clinico real (baseline vs. progreso) fuera del consultorio."),

  heading("A quien va dirigido", HeadingLevel.HEADING_2),

  para("TCC-Lab tiene tres publicos objetivo, cada uno con necesidades diferentes:"),

  smallTable([
    ["Publico", "Necesidad", "Que le ofrece TCC-Lab"],
    ["Terapeutas en formacion", "Entender el protocolo TCC completo", "Simulador interactivo de las 7 fases con IA clinica"],
    ["Terapeutas en ejercicio", "Herramienta de apoyo entre sesiones", "Asignacion de tareas, registro ABC, seguimiento de progreso"],
    ["Personas sin acceso a terapia", "Estructura terapeutica accesible", "Protocolo guiado con deteccion emocional y tecnicas adaptadas"],
  ], [2200, 3000, 4160]),

  heading("Que NO es TCC-Lab", HeadingLevel.HEADING_2),

  para("Es fundamental aclarar que TCC-Lab no es un reemplazo de la terapia profesional. Es un laboratorio experimental — una herramienta de investigacion y apoyo que implementa el protocolo con rigor clinico pero en un formato que aun esta en desarrollo. La app no diagnostica, no prescribe, y siempre derivara a profesionales cuando detecte situaciones de riesgo.", { italics: true }),

  heading("Principios de diseno", HeadingLevel.HEADING_2),

  bullet("Clinicamente riguroso: Cada decision de diseno se basa en protocolos TCC con evidencia (Beck, Ellis, Hayes, Linehan)."),
  bullet("Intencionalmente minimal: Sin gamificacion, sin dashboard colorido, sin navegacion libre. Solo el loop terapeutico puro.", { bold: true }),
  bullet("Privacidad absoluta: Todo se almacena localmente (IndexedDB). No hay servidor, no hay red, no hay datos que salgan del dispositivo."),
  bullet("El paciente primero: El lenguaje es coloquial, no clinico. 'Que te trae aqui hoy?' en vez de 'Describa su motivo de consulta'."),
  bullet("Medicion real: El cambio se mide con escalas clinicas estandar (SUDs 0-100, BDI-II, BAI) y comparacion baseline vs progreso."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 2. VISIÓN
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("2. Vision de Producto y Futuro", HeadingLevel.HEADING_1),

  para("TCC-Lab no se define por lo que es hoy sino por lo que esta construyendo hacia el futuro. La arquitectura actual es deliberadamente extensible para soportar las siguientes evoluciones:"),

  heading("2.1 Motor Clinico Inteligente", HeadingLevel.HEADING_2),
  para("La Base de Conocimiento (141 JSONs, 9 tecnicas, 38 areas) existe para alimentar un motor de decision clinica. El objetivo: que la aplicacion pueda analizar el estado emocional del paciente, sus patrones ABC acumulados, su historial de efectividad de tecnicas, y sugerir automaticamente la intervencion mas adecuada. El TCCEngine.ts (1,401 lineas) y el TCCDecisionTree.ts (898 lineas) son los primeros prototipos de este motor. A futuro: un sistema que diga 'El paciente muestra evitacion recurrente ante situaciones sociales. Sugiero exposicion gradual, paso 3 de la jerarquia, con previa psicoeducacion sobre el ciclo de ansiedad'."),

  heading("2.2 Asistente IA Contextualizado (RAG sobre la KB)", HeadingLevel.HEADING_2),
  para("La KB no es solo un repositorio estatico: esta disenada para servir como contexto de un sistema RAG (Retrieval-Augmented Generation). Cuando el terapeuta o el paciente hagan una pregunta clinica, el sistema buscara en la KB la informacion relevante y la inyectara como contexto al modelo de IA. Esto ya funciona parcialmente en interviewKnowledgeV3Service.ts, que mapea temas narrativos a tecnicas y enriquece el prompt con procedimientos y alertas de seguridad."),

  heading("2.3 Formulacion de Caso Automatizada", HeadingLevel.HEADING_2),
  para("El CaseFormulationSynthesizer (731 lineas) ya sintetiza secuencias funcionales ABC acumuladas en un mapa de conductas, cadenas consolidadas, perfil cognitivo, ciclo de mantenimiento, y un analisis 'dice vs. hace'. A futuro: una conceptualizacion del caso completa generada automaticamente que el terapeuta pueda revisar y ajustar."),

  heading("2.4 Sistema de Evaluacion de Cambio Clinico", HeadingLevel.HEADING_2),
  para("El ChangeEvaluator (868 lineas) ya implementa Reliable Change Index (RCI) y significacion clinica. El EvaluationLifecycleService (952 lineas) orquesta el ciclo completo: baseline -> intervencion -> evaluacion -> seguimiento. A futuro: graficos de progreso que muestren al paciente su evolucion medida cientificamente, no percepciones subjetivas."),

  heading("2.5 Personalizacion Adaptativa", HeadingLevel.HEADING_2),
  para("El TechniqueEffectivenessCache en la base de datos almacena que tecnicas reducen mas los SUDs para ESTE paciente especifico, en que momentos del dia, para que emociones. El TemporalPatternAnalysis (759 lineas) detecta patrones horarios. A futuro: la app aprende del paciente y se adapta. Si la respiracion diafragmatica funciona mejor por la manana y la reestructuracion cognitiva por la tarde, lo recomienda asi."),

  heading("2.6 Expansion de Tecnicas", HeadingLevel.HEADING_2),
  para("El TechniqueId union type ya prevee 'tcc', 'dbt' como futuros IDs. La KB tiene 9 tecnicas completas con 13 areas cada una. Agregar una nueva tecnica requiere crear JSONs + manifest, sin modificar el motor. El sistema es inherentemente extensible a cualquier terapia estructurada."),

  heading("2.7 Plataforma para Investigacion Clinica", HeadingLevel.HEADING_2),
  para("Todo registro en la base de datos es inmutable (append-only). La estructura de 5 capas permite exportar datasets anonimizados para investigacion: cuantos registros ABC, que distorsiones son mas frecuentes, que tecnicas tienen mejor efecto, que patrones temporales emergen. TCC-Lab podria convertirse en una plataforma de investigacion clinica a escala."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 3. ARQUITECTURA GENERAL
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("3. Arquitectura General", HeadingLevel.HEADING_1),

  para("TCC-Lab sigue una arquitectura de capas claramente separadas. Cada capa tiene una responsabilidad unica y se comunica con las adyacentes a traves de interfaces tipadas."),

  heading("3.1 Diagrama de Capas", HeadingLevel.HEADING_2),

  smallTable([
    ["Capa", "Ubicacion", "Responsabilidad"],
    ["UI (Pantallas)", "src/features/*/", "Componentes React por modulo: session, interview, therapist, devtools"],
    ["Componentes compartidos", "src/components/", "EmotionalChat, Dashboard, KB viewers, Navigation"],
    ["Hooks", "src/hooks/, src/features/*/", "useEmotionalConnection, useInterview, useTherapist, useKnowledge*"],
    ["Servicios clinicos", "src/services/", "TCCEngine, EmpathyEngine, TextAnalysis, TemporalPatterns (23,466 lineas)"],
    ["Servicios de secuencia", "src/services/sequence/", "Baseline, CaseFormulation, ChangeEvaluator, FollowUp, InterventionPlan"],
    ["Estado global", "src/shared/", "sessionStore (Zustand+persist), appStore (Zustand)"],
    ["Base de Conocimiento", "src/knowledge/", "141 JSONs + registry + store + hooks + tipos Zod"],
    ["Base de Datos", "src/db/", "Dexie.js sobre IndexedDB — 16 tablas clinicas, 5 capas"],
    ["Proxy IA", "vite.config.ts", "Middleware dev que proxea /api/empathy y /api/chat a Claude"],
    ["Mock engine", "mockClinicalEngine.ts", "Respuestas simuladas para desarrollo sin API key"],
  ], [2200, 2800, 4360]),

  heading("3.2 Flujo de Datos", HeadingLevel.HEADING_2),

  para("El flujo principal sigue el patron unidireccional tipico de React:"),
  emptyPara(),
  ...codeBlock([
    "  Usuario (input texto/seleccion)  ",
    "       |                           ",
    "       v                           ",
    "  Hook clinico (useInterview, useTherapist)  ",
    "       |                           ",
    "       +---> Zustand store (estado sesion/afecto/fase)  ",
    "       |                           ",
    "       +---> Servicio clinico (TCCEngine, EmpathyEngine)  ",
    "       |         |                 ",
    "       |         +---> KB (import() dinamico → JSON)  ",
    "       |         +---> DB (Dexie/IndexedDB)  ",
    "       |         +---> IA (Claude via /api/chat proxy)  ",
    "       |                           ",
    "       v                           ",
    "  React render (actualizacion UI)  ",
  ]),

  heading("3.3 Principios Arquitectonicos", HeadingLevel.HEADING_2),

  bullet("Feature-first: Cada modulo (session, interview, therapist) es autocontenido con sus propios componentes, hooks y store."),
  bullet("Code-splitting: Cada JSON de la KB es un chunk separado de Vite. Los DevTools se cargan con lazy()."),
  bullet("Offline-first: IndexedDB local, sin servidor. La unica llamada de red es al proxy de Claude para IA."),
  bullet("Inmutabilidad clinica: Los registros ABC, pensamientos automaticos y goals NUNCA se editan. Las correcciones crean nuevos registros con amendedFrom."),
  bullet("Type-safety extremo: Zod valida datos JSON en runtime; TypeScript garantiza tipos en compile-time."),
  bullet("Zero gamification: Sin puntos, sin badges, sin streaks. El diseno es deliberadamente sobrio para no trivializar el proceso clinico."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 4. STACK
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("4. Stack Tecnologico", HeadingLevel.HEADING_1),

  smallTable([
    ["Tecnologia", "Version", "Rol"],
    ["React", "18.3", "UI declarativa con hooks"],
    ["TypeScript", "5.3", "Type-safety en compile-time"],
    ["Vite", "7.3", "Bundler + dev server + proxy IA + code-splitting"],
    ["Zustand", "4.4", "Estado global (sessionStore, interviewStore, therapistStore, knowledgeStore)"],
    ["Dexie.js", "4.0", "ORM sobre IndexedDB — 16 tablas clinicas"],
    ["Zod", "4.3", "Validacion de esquemas JSON de la KB en runtime"],
    ["React Router", "6.21", "Routing: /, /session/*, /interview, /therapist, /dev"],
    ["Tailwind CSS", "3.4", "Utilidades CSS — dark theme (slate-950)"],
    ["Lucide React", "0.263", "Iconografia clinica"],
    ["date-fns", "3.0", "Manipulacion de fechas (patrones temporales)"],
    ["jsPDF", "4.2", "Exportacion de reportes clinicos a PDF"],
    ["Claude (Anthropic)", "Sonnet/Haiku", "Motor de IA via proxy seguro en vite.config.ts"],
    ["Vitest", "4.0", "Framework de testing (configurado, tests pendientes)"],
  ], [2200, 1200, 5960]),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 5. ESTRUCTURA DEL PROYECTO
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("5. Estructura del Proyecto", HeadingLevel.HEADING_1),
  para("El proyecto se organiza por funcionalidad (feature-first), no por tipo de archivo:"),
  emptyPara(),
  ...codeBlock([
    "src/",
    "  App.tsx                    # Router principal — 15 rutas",
    "  main.tsx                   # Entry point + KB bootstrap",
    "  index.css                  # Tailwind base",
    "",
    "  features/                  # Modulos de funcionalidad",
    "    session/                 # Protocolo TCC 7 fases",
    "      ProtocolLayout.tsx     # Shell con barra de progreso",
    "      SessionStartScreen.tsx # Pantalla de inicio",
    "      phases/                # 7 pantallas de fase",
    "        IntakeScreen.tsx     # Fase 1: Motivo de consulta",
    "        AssessmentScreen.tsx # Fase 2: Evaluacion ABC",
    "        PsychoeducationScreen.tsx",
    "        GoalsScreen.tsx      # Fase 4: Objetivos SMART",
    "        InterventionScreen.tsx # Fase 5: Tecnicas",
    "        EvaluationScreen.tsx # Fase 6: Cambio clinico",
    "        FollowUpScreen.tsx   # Fase 7: Seguimiento",
    "",
    "    interview/               # Primera entrevista clinica",
    "      InterviewScreen.tsx    # Chat + inventarios + rapport",
    "      useInterview.ts        # Motor clinico (787 lineas)",
    "      interviewStore.ts      # Zustand — estado entrevista",
    "      components/            # AffectSelector, ChatBubble, etc",
    "",
    "    therapist/               # Modulo terapeuta TCC",
    "      TherapistScreen.tsx    # Dashboard 4 pestanas",
    "      useTherapist.ts        # Motor clinico (577 lineas)",
    "      therapistIdentity.ts   # System prompt inmutable",
    "      KnowledgeControlPanel  # Panel KB con 5 tabs",
    "",
    "    primerEncuentro/         # Primer contacto con IA",
    "    crisis/                  # Tipos de intervencion crisis",
    "    devtools/                # DevTools (lazy-loaded)",
    "",
    "  services/                  # Logica clinica (23,466 lineas)",
    "    TCCEngine.ts             # Motor central de intervenciones",
    "    TCCDecisionTree.ts       # Arbol de decisiones",
    "    EmpathyEngine.ts         # Respuestas empaticas via Claude",
    "    TextAnalysisService.ts   # NLP basico para deteccion",
    "    EmotionDetectionService  # Deteccion de emociones",
    "    PersonalAnalyticsService # Metricas de progreso",
    "    sequence/                # Sistema de secuencias ABC",
    "      CaseFormulationSynthesizer.ts",
    "      ChangeEvaluator.ts     # RCI + significacion clinica",
    "      EvaluationLifecycleService.ts",
    "      InterventionPlanGenerator.ts",
    "      FollowUpMonitor.ts",
    "      BaselineCollector.ts",
    "",
    "  knowledge/                 # Base de Conocimiento v3",
    "    ac/, rc/, ds/, ...       # 9 tecnicas con 13 areas c/u",
    "    shared/                  # Conocimiento transversal",
    "    types/                   # Tipos + Zod schemas",
    "    loaders/                 # Store + hooks",
    "    v3/                      # Profiles + procedures",
    "",
    "  db/                        # Base de datos clinica",
    "    database.ts              # 16 tablas Dexie/IndexedDB",
    "    types.ts                 # SUDs, emociones, tecnicas",
    "",
    "  shared/                    # Estado global",
    "    sessionStore.ts          # Protocolo 7 fases",
    "    store.ts                 # AppState general",
  ]),

  emptyPara(),

  smallTable([
    ["Directorio", "Lineas TS/TSX", "Archivos", "Descripcion"],
    ["src/services/", "23,466", "36", "Logica clinica y analitica"],
    ["src/features/", "15,678", "39", "Modulos UI por funcionalidad"],
    ["src/knowledge/", "3,715", "34+141 JSON", "Base de conocimiento terapeutico"],
    ["src/components/", "2,392", "12", "Componentes compartidos"],
    ["src/db/", "1,561", "3", "Base de datos y tipos"],
    ["src/hooks/", "529", "2", "Hooks globales (emocional)"],
    ["src/shared/", "260", "2", "Stores Zustand globales"],
    ["TOTAL", "47,706", "147 TS + 141 JSON", "Aplicacion completa"],
  ], [2000, 1500, 1500, 4360]),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 6. PROTOCOLO DE SESIÓN
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("6. Modulo: Protocolo de Sesion (7 Fases)", HeadingLevel.HEADING_1),

  para("El nucleo de TCC-Lab es la implementacion del protocolo TCC real de 7 fases. Cada fase tiene su propia pantalla, su recopilacion de datos y su logica de avance. No se permite saltar fases hacia adelante — el protocolo es secuencial, igual que en consultorio."),

  heading("6.1 Las 7 Fases", HeadingLevel.HEADING_2),

  smallTable([
    ["Fase", "Ruta", "Objetivo clinico", "Datos recopilados"],
    ["1. Intake", "/session/intake", "Motivo de consulta", "Queja principal, emocion, intensidad 0-10, desencadenante"],
    ["2. Assessment", "/session/assessment", "Evaluacion ABC", "Pensamiento automatico, situacion, conducta, consecuencias, patrones"],
    ["3. Psychoeducation", "/session/psychoeducation", "Explicar modelo TCC", "Comprension del modelo, reaccion del paciente"],
    ["4. Goals", "/session/goals", "Objetivos SMART", "Objetivo principal, metas cortas, indicador medible, baseline, target"],
    ["5. Intervention", "/session/intervention", "Aplicar tecnicas", "Tecnica seleccionada, SUDs pre/post, completitud"],
    ["6. Evaluation", "/session/evaluation", "Medir cambio", "Comparacion baseline vs actual, progreso percibido"],
    ["7. Follow-up", "/session/followup", "Prevenir recaidas", "Tecnicas en uso, signos de recaida, plan de prevencion"],
  ], [1800, 2000, 2200, 3360]),

  heading("6.2 Arquitectura del Modulo", HeadingLevel.HEADING_2),

  bullet("ProtocolLayout.tsx: Shell visual con barra de progreso (7 segmentos coloreados). Usa <Outlet /> de React Router."),
  bullet("SessionStartScreen.tsx: Punto de entrada. Muestra los 7 pasos y permite empezar o continuar sesion."),
  bullet("sessionStore.ts (Zustand + persist): Almacena IntakeData, AssessmentData, PsychoeducationData, GoalsData. Persiste en localStorage."),
  bullet("Navegacion: Las fases completadas se marcan en verde. La fase actual en azul. Las futuras estan bloqueadas (gris)."),

  heading("6.3 Modelo de Datos de Sesion", HeadingLevel.HEADING_2),

  para("El sessionStore define tipos estrictos para cada fase. Por ejemplo, IntakeData tiene: mainComplaint (string), sinceWhen (string), emotionCategory (9 categorias: anxiety, depression, anger, guilt, shame, overwhelm, numbness, fear, grief), intensityNow (0-10 adaptado de SUDs), y triggeredBy (desencadenante)."),

  para("AssessmentData captura el analisis funcional ABC completo: automaticThought, situationContext (A), behavioralResponse (B), consequences (C), cognitivePatterns (array de patrones detectados), avoidanceBehaviors, functionalImpact, y baselineIntensity."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 7. ENTREVISTA
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("7. Modulo: Entrevista Clinica", HeadingLevel.HEADING_1),

  para("El modulo de entrevista es el sistema mas sofisticado de TCC-Lab. Implementa una primera entrevista clinica completa con 5 sistemas coordinados que operan en paralelo:"),

  heading("7.1 Los 5 Sistemas", HeadingLevel.HEADING_2),

  smallTable([
    ["Sistema", "Descripcion", "Estado actual"],
    ["Motor de cobertura Beck", "5 areas (symptoms/history/functioning/personal/strengths) con estado pending/partial/done", "Funcional"],
    ["Detector de inventarios", "3 condiciones: rapport >= 1.5 AND (afecto <= 2 OR intensidad >= 2) AND 2+ areas Beck", "Funcional"],
    ["Chips socraticos", "4 opciones contextuales generadas por IA en cada turno, separadas por delimitador ---", "Funcional"],
    ["Selector afectivo", "Escala 1-5 (muy mal a muy bien) que sobreescribe la deteccion textual de tono", "Funcional"],
    ["Prompt dinamico", "System prompt reconstruido en cada turno con mapa Beck, fase, rapport, tono, inventarios", "Funcional"],
  ], [2600, 4760, 2000]),

  heading("7.2 Flujo de la Entrevista", HeadingLevel.HEADING_2),

  bullet("Fase opening: Bienvenida empatica, opciones de baja demanda cognitiva."),
  bullet("Fase exploration: Exploracion guiada por chips socraticos, cobertura de 5 areas Beck."),
  bullet("Fase inventory: Cuando se cumplen 3 condiciones, auto-trigger de BDI-II y luego BAI."),
  bullet("Fase beck_integration: Integracion de resultados con la narrativa del paciente."),
  bullet("Fase crisis_containment: Override de maxima prioridad si se detectan keywords de crisis."),

  heading("7.3 Inventarios Clinicos", HeadingLevel.HEADING_2),

  para("Los inventarios BDI-II (Beck Depression Inventory) y BAI (Beck Anxiety Inventory) se presentan como overlays modales con 21 items cada uno, escala 0-3. El puntaje se clasifica: Minimo (0-13), Leve (14-19), Moderado (20-28), Severo (29-63). Los resultados se integran al reporte clinico final."),

  heading("7.4 Reporte Clinico", HeadingLevel.HEADING_2),

  para("Al completar la entrevista, ReportModal.tsx genera un reporte con: hipotesis funcional, datos del BDI-II y BAI, areas Beck cubiertas, historia de afecto del paciente, y alertas clinicas. Exportable con exportSession.ts."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 8. TERAPEUTA
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("8. Modulo: Terapeuta Perfecto", HeadingLevel.HEADING_1),

  para("El modulo Terapeuta implementa un agente conversacional con identidad clinica completa. No es un chatbot generico — tiene un system prompt de 90 lineas (therapistIdentity.ts) que codifica la epistemologia, los modelos de referencia, los protocolos y el estilo relacional de un terapeuta TCC real."),

  heading("8.1 Identidad Clinica (System Prompt)", HeadingLevel.HEADING_2),

  para("La identidad del terapeuta se define en 7 secciones inmutables:"),

  smallTable([
    ["Seccion", "Contenido"],
    ["I. Cimiento epistemologico", "Metodo cientifico: hipotesis -> experimento -> verificacion. La TCC es falsificable."],
    ["II. Modelos internalizados", "Pavlov, Skinner, Bandura, Beck, Ellis, Young, Hayes (ACT), Linehan (DBT), Mindfulness"],
    ["III. Conceptualizacion de caso", "Factores predisponentes, precipitantes y perpetuadores. Sin conceptualizacion = parches."],
    ["IV. Habilidad socratica", "Descubrimiento guiado. Pregunta ingenua. 7 preguntas clave clinicas."],
    ["V. Relacion terapeutica", "Empatia estrategica, aceptacion incondicional, autenticidad, directividad flexible."],
    ["VI. Analisis funcional", "A -> B -> C en tiempo real. Refuerzo negativo, beneficios secundarios, creencia nuclear."],
    ["VII. Etica y meta", "Que el paciente deje de necesitar al terapeuta. Transferencia de herramientas."],
  ], [3000, 6360]),

  heading("8.2 Fases de Sesion del Terapeuta", HeadingLevel.HEADING_2),

  para("El terapeuta sigue 8 fases de sesion: check_in -> agenda -> homework_review -> main_work -> summary -> homework_assignment -> closure. Fase crisis como override. Cada fase tiene su propio fragmento de system prompt y las 10 tecnicas TCC disponibles (exploracion, socratica, reestructuracion, AC, exposicion, defusion ACT, validacion DBT, experimento conductual, psicoeducacion, analisis funcional)."),

  heading("8.3 Dashboard Clinico (TherapistScreen)", HeadingLevel.HEADING_2),

  para("El TherapistScreen tiene 4 pestanas: (1) Capacidades — perfil completo con 3 pilares (conductual, cognitivo, tercera generacion), 21 tecnicas detalladas; (2) Sesion — metricas en tiempo real; (3) Conocimiento — base de conocimiento clinico; (4) Configurar — capacidades personalizadas."),

  heading("8.4 KnowledgeControlPanel (5 Tabs)", HeadingLevel.HEADING_2),

  para("Panel avanzado con: Resumen (5 areas de conocimiento), Distorsiones (12 distorsiones cognitivas con ejemplos), Tecnicas (catalogo completo), Sesion (datos clinicos en tiempo real), y Areas KB (navegador de la base de conocimiento con visor de datos JSON)."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 9-10. PRIMER ENCUENTRO + SISTEMA EMOCIONAL
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("9. Modulo: Primer Encuentro", HeadingLevel.HEADING_1),

  para("PrimerEncuentroScreen implementa el protocolo de primera sesion con 5 momentos clinicos, deteccion emocional en tiempo real, validacion de protocolo y respuestas en streaming via Claude a traves del proxy seguro /api/chat. Portado desde un prototipo HTML con correcciones y adaptacion a React/TypeScript. Los 5 momentos son: (1) saludo y encuadre, (2) exploracion del motivo, (3) profundizacion emocional, (4) cierre empático, (5) derivacion o plan."),

  heading("10. Modulo: Sistema Emocional", HeadingLevel.HEADING_1),

  para("Un sistema completo de inteligencia emocional que opera como capa transversal:"),

  smallTable([
    ["Componente", "Archivo", "Funcion"],
    ["EmotionalConnectionController", "services/", "Orquestador: coordina deteccion, empatia, trust, personalizacion"],
    ["EmotionDetectionService", "services/", "Deteccion de emociones desde texto (NLP basico)"],
    ["EmpathyEngine", "services/", "Genera respuestas empaticas via Claude /api/empathy"],
    ["TrustBuildingService", "services/", "Modelo de confianza progresiva (trust level)"],
    ["PersonalizationService", "services/", "Adapta estilo de comunicacion a preferencias del usuario"],
    ["FirstImpressionService", "services/", "Optimiza la primera interaccion para engagement"],
    ["EmotionalChatInterface", "components/", "UI de chat con deteccion emocional en tiempo real"],
    ["EmotionalDashboard", "components/", "Visualizacion de estado y tendencias emocionales"],
    ["MultimodalEvaluationDemo", "components/", "Demo de evaluacion multimodal (texto, voz, video)"],
    ["useEmotionalConnection", "hooks/", "Hook React que expone toda la API del sistema emocional"],
    ["useEmotionalState", "hooks/", "Hook para acceder al estado emocional actual"],
  ], [3000, 1800, 4560]),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 11. SERVICIOS CLÍNICOS
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("11. Servicios Clinicos (Capa de Logica)", HeadingLevel.HEADING_1),

  para("La capa de servicios (23,466 lineas) contiene toda la logica clinica independiente de la UI. Esta disenada para ser reutilizable por cualquier componente React o futuro backend."),

  heading("11.1 Servicios Principales", HeadingLevel.HEADING_2),

  smallTable([
    ["Servicio", "Lineas", "Responsabilidad"],
    ["TCCEngine.ts", "1,401", "Motor central: analiza contexto y sugiere tecnica optima"],
    ["TCCDecisionTree.ts", "898", "Arbol de decisiones: barreras -> emociones -> tecnicas"],
    ["DeepFunctionalAnalysis.ts", "1,028", "Analisis funcional profundo de conductas"],
    ["MultimodalEvaluationService.ts", "1,041", "Evaluacion multimodal (texto, voz, video)"],
    ["PersonalAnalyticsService.ts", "873", "Metricas de progreso semanal/mensual"],
    ["TemporalPatternAnalysis.ts", "759", "Patrones horarios y recomendaciones temporales"],
    ["EmotionTechniqueMapping.ts", "686", "Mapeo emocion -> tecnica con scoring"],
    ["BehavioralExperimentService.ts", "610", "Gestion de experimentos conductuales"],
    ["TextAnalysisService.ts", "638", "NLP basico: deteccion de patrones textuales"],
    ["EmpathyEngine.ts", "557", "Respuestas empaticas via Claude"],
    ["MicroSessionService.ts", "557", "Sesiones breves (5-10 min)"],
    ["PersonalizationService.ts", "512", "Adaptacion a preferencias del usuario"],
    ["tccTechniques.ts", "537", "Catalogo de 27 tecnicas TCC con metadata"],
    ["userPatternsLearning.ts", "482", "Aprendizaje de patrones del usuario"],
  ], [3200, 900, 5260]),

  heading("11.2 Sistema de Secuencias (services/sequence/)", HeadingLevel.HEADING_2),

  para("El sistema de secuencias es la capa analitica mas profunda de TCC-Lab. Opera sobre secuencias funcionales ABC acumuladas para construir la formulacion del caso:"),

  smallTable([
    ["Servicio", "Lineas", "Fase del proceso"],
    ["BaselineCollector.ts", "707", "Recoleccion de linea base"],
    ["BaselineService.ts", "424", "Lifecycle de baseline (estabilizacion)"],
    ["KeyBehaviorIdentifier.ts", "567", "Identificacion de conductas clave"],
    ["SequenceDetector.ts", "791", "Deteccion de secuencias A->B->C"],
    ["SequenceEnricher.ts", "556", "Enriquecimiento con contexto temporal/emocional"],
    ["CaseFormulationSynthesizer.ts", "731", "Sintesis: mapa conductas, cadenas, ciclo mantenimiento"],
    ["InterventionPlanGenerator.ts", "841", "Generacion de plan de intervencion personalizado"],
    ["InterventionPlanEvaluator.ts", "798", "Evaluacion periodica del plan"],
    ["ChangeEvaluator.ts", "868", "RCI + significacion clinica vs baseline"],
    ["EvaluationLifecycleService.ts", "952", "Orquestacion del ciclo completo"],
    ["FollowUpMonitor.ts", "740", "Monitoreo de seguimiento post-intervencion"],
    ["MetricEngine.ts", "418", "Motor de metricas clinicas"],
    ["ValidationDecisionEngine.ts", "447", "Decisiones de validacion automaticas"],
    ["FunctionalNormsService.ts", "110", "Normas funcionales desde baselines"],
    ["FunctionalRecommendationEngine.ts", "494", "Recomendaciones basadas en formulacion"],
  ], [3400, 900, 5060]),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 12. BASE DE DATOS
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("12. Base de Datos Clinica (Dexie/IndexedDB)", HeadingLevel.HEADING_1),

  para("TCC-Lab usa Dexie.js sobre IndexedDB para almacenamiento 100% local. No hay servidor, no hay red, no hay datos que salgan del dispositivo. La base de datos se organiza en 5 capas:"),

  heading("12.1 Las 5 Capas", HeadingLevel.HEADING_2),

  smallTable([
    ["Capa", "Tablas", "Principio"],
    ["1. Identidad y contexto", "ClinicalProfile, SymptomEntry", "Un solo perfil (id=1). Sintomas append-only."],
    ["2. Sesion y protocolo", "Session, PsychoeducationLog", "La sesion es la unidad central. Todo tiene sessionId."],
    ["3. Registros clinicos", "ABCRecord, AutomaticThoughtRecord, CognitiveRestructuringRecord, TherapeuticGoal, GoalProgressEntry, TechniqueExecution, ExposureHierarchy, FollowUpEntry", "INMUTABLES. Correcciones = nuevo registro con amendedFrom."],
    ["4. Aprendizaje", "TechniqueEffectivenessCache, BaselineSnapshotDB", "Cache calculado. Se regenera desde capa 3."],
    ["5. Historial", "Conversation, ConversationMessage", "Conversaciones completas append-only."],
  ], [2200, 4360, 2800]),

  heading("12.2 Registros Clinicos Clave", HeadingLevel.HEADING_2),

  para("El registro mas importante es ABCRecord — captura el analisis funcional completo: Antecedente (situacion, emocion, SUDs, trigger), Conducta (tipo, duracion, intensidad, si fue planificada), y Consecuencia (inmediata y diferida, alivio obtenido, tipo de refuerzo). Incluye cognitiveDistortionsDetected (de las 12 distorsiones de Beck/Burns) y un campo analysis con funcion de la conducta, factores mantenedores, y conducta alternativa."),

  para("TechniqueExecution registra cada practica: tecnica usada, SUDs al inicio y al final, emocion, hora del dia, dia de la semana, duracion, completitud, y rating de efectividad. Esto alimenta la Capa 4 (cache de efectividad) que calcula automaticamente que tecnicas funcionan mejor para este paciente."),

  heading("12.3 Escalas Clinicas (types.ts)", HeadingLevel.HEADING_2),

  bullet("SUDs (0-100): Escala estandar de malestar subjetivo. Funciones: categorizeSUDs(), isClinicallySignificant(), interpretSUDsChange()."),
  bullet("ClinicalEmotion: 12 emociones clinicas (anxiety, sadness, anger, guilt, shame, fear, disgust, hopelessness, frustration, loneliness, emptiness, overwhelm)."),
  bullet("CognitiveDistortion: Las 12 distorsiones de Beck/Burns con labels, descripciones y ejemplos en espanol."),
  bullet("TCCTechnique: 27 tecnicas TCC con label, descripcion, bestFor (emociones), estimatedMinutes, y evidenceLevel (strong/moderate/emerging)."),
  bullet("BehaviorType: 8 tipos de conducta (avoidance, escape, compulsion, rumination, safety_behavior, adaptive...)."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 13. BASE DE CONOCIMIENTO
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("13. Base de Conocimiento (KB)", HeadingLevel.HEADING_1),

  para("La KB es el nucleo de datos clinicos. Almacena todo el saber terapeutico en 141 archivos JSON organizados en 9 tecnicas con 13 areas cada una, mas conocimiento transversal compartido. Para un informe detallado de la KB, ver el documento complementario 'TCC-Lab_Base_de_Conocimiento_Informe.docx'."),

  heading("13.1 Resumen de la KB", HeadingLevel.HEADING_2),

  smallTable([
    ["Metrica", "Valor"],
    ["Tecnicas terapeuticas", "9 (AC, RC, DS, Exposicion, MC, ACT, DC, TREC, Mindfulness)"],
    ["Areas por tecnica (KBArea enum)", "38 valores (10 compartidas + 28 especificas)"],
    ["Archivos JSON data/", "121"],
    ["Archivos JSON profiles + procedures", "20"],
    ["Archivos JSON shared", "3 (inventarios, crisis, habilidades entrevista)"],
    ["Total archivos JSON", "141"],
    ["Lineas de datos JSON", "15,317"],
    ["Schemas Zod de validacion", "38 + 3 compartidos"],
    ["Hooks React", "4 (useKnowledgeArea, useKnowledgeAreas, useSharedKnowledge, useKnowledgePreload)"],
    ["Perfiles de precarga", "11 contextos clinicos"],
  ], [3500, 5860]),

  heading("13.2 Arquitectura de la KB", HeadingLevel.HEADING_2),

  bullet("Datos (JSON): Contenido clinico puro en src/knowledge/<tecnica>/data/*.json."),
  bullet("Manifests: Declaracion de tecnica con lazy loaders: () => import('./data/area_XX.json')."),
  bullet("Registry: TECHNIQUE_REGISTRY (Map) donde cada tecnica se inscribe al inicio."),
  bullet("Types + Schemas: 38 interfaces TypeScript + 38 Zod schemas para validacion runtime."),
  bullet("Store (Zustand): Cache bidimensional slots[tecnica][area] con dedup de imports en vuelo."),
  bullet("Hooks: useKnowledgeArea('ac', KBArea.CONOCIMIENTO) devuelve tipo exacto via AreaDataMap."),
  bullet("V3 (Profiles): Capa paralela que carga profile + procedures JSON para consulta de alto nivel."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 14. IA
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("14. Integracion con IA (Claude/Anthropic)", HeadingLevel.HEADING_1),

  para("TCC-Lab usa Claude (Anthropic) como motor de IA para generar respuestas clinicamente coherentes. La integracion sigue un patron de seguridad estricto:"),

  heading("14.1 Proxy Seguro (vite.config.ts)", HeadingLevel.HEADING_2),

  para("El API key de Anthropic NUNCA se incluye en el bundle del cliente. En desarrollo, vite.config.ts implementa un middleware que:"),

  bullet("Proxea /api/empathy (no-streaming) y /api/chat (streaming) a la API de Anthropic."),
  bullet("Fuerza el modelo: claude-3-5-haiku para empathy, claude-sonnet-4 para chat clinico."),
  bullet("Rate limiting: maximo 10 requests por minuto por endpoint."),
  bullet("Validacion: max 10 mensajes por request, max 2000 chars por mensaje, solo roles user/assistant."),
  bullet("Hard cap: 300 tokens maximos por respuesta para control de costos."),

  heading("14.2 Flujo de IA en la Entrevista", HeadingLevel.HEADING_2),

  para("En cada turno del paciente, useInterview.ts construye un system prompt dinamico con: (1) fase actual, (2) mapa Beck (5 areas con estado), (3) rapport score, (4) tono emocional detectado, (5) inventarios pendientes/completados, (6) alertas clinicas, y (7) contexto de tecnica V3 desde la KB. El modelo responde con texto + 4 opciones socraticas separadas por ---."),

  heading("14.3 Mock Engine", HeadingLevel.HEADING_2),

  para("mockClinicalEngine.ts provee respuestas simuladas para desarrollo sin API key. Intercepta fetch a /api/chat y /api/empathy y devuelve respuestas clinicamente coherentes seleccionadas por fase Beck y keywords detectadas en el texto del paciente. Se instala automaticamente al iniciar la app (main.tsx)."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 15. CRISIS
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("15. Sistema de Crisis", HeadingLevel.HEADING_1),

  para("TCC-Lab implementa un sistema de deteccion y contencion de crisis con 7 fases:"),

  smallTable([
    ["Fase", "Descripcion"],
    ["1. Detection", "Keywords de riesgo: suicid*, matarme, no quiero vivir, autolesion, etc."],
    ["2. Grounding", "Tecnicas activas: 5-4-3-2-1, respiracion, body scan, ice water"],
    ["3. Assessment", "Evaluacion: plan concreto?, acceso a medios?, factores protectores?, voluntad de seguridad?"],
    ["4. Safety Planning", "Plan de seguridad: senales de advertencia, estrategias internas, contactos, distractores"],
    ["5. Resource Connection", "Conexion con recursos profesionales de emergencia"],
    ["6. Stabilized", "Usuario estabilizado, retorno gradual"],
    ["7. Escalated", "Escalado a servicios de emergencia"],
  ], [2800, 6560]),

  para("CrisisSeverity tiene 4 niveles: mild, moderate, severe, imminent. SafetyPlan incluye: warning signs internos/externos, coping strategies, social distractions, professional contacts, y lethal means restriction. Todo se almacena con trazabilidad completa."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 16. DEVTOOLS
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("16. DevTools y Herramientas de Desarrollo", HeadingLevel.HEADING_1),

  para("Dashboard de desarrollo accesible en /dev (lazy-loaded, chunk separado). 4 pestanas:"),

  smallTable([
    ["Pestana", "Componente", "Funcion"],
    ["Navegador KB", "KBNavigatorTab.tsx", "Explorar tecnicas y areas con KBAreaBrowser + KBAreaDataViewer"],
    ["Inventarios", "InventoryViewerTab.tsx", "Buscar y visualizar inventarios de evaluacion"],
    ["Digitalizador", "TemplateDigitizerTab.tsx", "Formulario para digitalizar inventarios clinicos"],
    ["Estado KB", "KBStatusTab.tsx", "Cobertura de la KB con KBCoverageMatrix + metricas"],
  ], [2000, 3000, 4360]),

  para("Componentes compartidos en src/components/kb/: KBAreaBrowser, KBAreaDataViewer, KBBadge, KBCoverageMatrix, KBInventoryCard, KBSearchBar, KBTemplateFormPreview — reutilizados entre DevTools y KnowledgeControlPanel."),

  heading("Comandos de Desarrollo", HeadingLevel.HEADING_2),

  smallTable([
    ["Comando", "Descripcion"],
    ["npm run dev", "Servidor Vite con proxy IA en puerto 5175"],
    ["npm run build", "tsc + Vite production build"],
    ["npx tsc --noEmit", "Type-check sin emitir JS"],
    ["npm run kb:validate", "Validar todos los JSONs de la KB con Zod"],
    ["npm run kb:audit", "Auditoria completa de la base de conocimiento"],
    ["npm test", "Vitest (configurado, tests pendientes)"],
  ], [3000, 6360]),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 17. MADUREZ
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("17. Estado de Madurez por Modulo", HeadingLevel.HEADING_1),

  para("No todos los modulos tienen el mismo nivel de completitud. Este mapa ayuda a priorizar el desarrollo:"),

  new Table({
    width: { size: CW, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [hCell("Modulo", 3500), hCell("Estado", 1200), hCell("Descripcion", 4660)] }),
      ...([
        ["Base de Conocimiento (KB)", "Completo", GREEN_LIGHT, "141 JSONs, 38 schemas Zod, 4 hooks, 11 preloads, DevTools"],
        ["Protocolo de Sesion (7 fases)", "Funcional", GREEN_LIGHT, "7 pantallas, store persistido, navegacion secuencial"],
        ["Entrevista Clinica", "Funcional", GREEN_LIGHT, "5 sistemas coordinados, BDI/BAI, reporte, chips socraticos"],
        ["Terapeuta Perfecto", "Funcional", GREEN_LIGHT, "Identidad, 8 fases, dashboard, KnowledgeControlPanel"],
        ["Base de Datos (Dexie)", "Estructura", AMBER_LIGHT, "16 tablas definidas, helpers de sesion, tipos completos"],
        ["Servicios clinicos", "Prototipos", AMBER_LIGHT, "23,466 lineas de logica, muchas con @ts-nocheck"],
        ["Sistema Emocional", "Demo", AMBER_LIGHT, "Controller + 5 servicios + 2 hooks, UI de demo"],
        ["Sistema de Crisis", "Tipos", RED_LIGHT, "Tipos completos, implementacion pendiente"],
        ["Primer Encuentro", "Portado", AMBER_LIGHT, "Funcional pero portado de HTML, necesita refactor"],
        ["Testing", "Pendiente", RED_LIGHT, "Vitest configurado, 0 tests escritos"],
        ["DevTools", "Completo", GREEN_LIGHT, "4 tabs, componentes compartidos, lazy-loaded"],
      ]).map(([mod, estado, fill, desc]) => new TableRow({ children: [
        cell(mod, 3500, { bold: true }),
        cell(estado, 1200, { fill, align: AlignmentType.CENTER, bold: true }),
        cell(desc, 4660),
      ] })),
    ],
  }),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 18. GUÍA
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("18. Guia para Nuevos Desarrolladores", HeadingLevel.HEADING_1),

  heading("18.1 Para empezar", HeadingLevel.HEADING_2),
  bullet("Clonar el repo y correr npm install."),
  bullet("Copiar .env.example a .env con tu ANTHROPIC_API_KEY (o trabajar con el mock engine sin key)."),
  bullet("npm run dev — el servidor Vite arranca en localhost:5175."),
  bullet("Navegar a / para ver la pantalla de inicio con los 7 pasos del protocolo."),
  bullet("Navegar a /dev para ver los DevTools de la base de conocimiento."),

  heading("18.2 Convenciones del proyecto", HeadingLevel.HEADING_2),
  bullet("Feature-first: cada modulo en src/features/<nombre>/ con su propio store, hook y componentes."),
  bullet("Dark theme: todo el CSS usa la paleta slate de Tailwind (slate-950 como fondo base)."),
  bullet("Hooks clinicos: useInterview, useTherapist son los motores. No poner logica clinica en componentes."),
  bullet("Inmutabilidad de datos: nunca editar registros clinicos. Crear nuevos con amendedFrom."),
  bullet("KB hooks: usar useKnowledgeArea('ac', KBArea.X) — nunca string literals, siempre el enum KBArea."),
  bullet("Validacion: Zod en runtime, TypeScript en compile-time. Ambos son obligatorios para datos de KB."),
  bullet("@ts-nocheck: muchos servicios lo tienen porque fueron escritos rapido. Remover progresivamente."),

  heading("18.3 Agregar una nueva tecnica a la KB", HeadingLevel.HEADING_2),
  bullet("1. Crear directorio src/knowledge/<id>/ con data/, index.ts, <id>.manifest.ts."),
  bullet("2. Crear 13 archivos JSON (uno por area compartida + especificas)."),
  bullet("3. Registrar en registry-init.ts: import './<id>';"),
  bullet("4. Extender TechniqueId en technique.types.ts."),
  bullet("5. Validar: npm run kb:validate."),

  heading("18.4 Agregar una nueva fase al protocolo", HeadingLevel.HEADING_2),
  bullet("1. Crear pantalla en src/features/session/phases/<NuevaFase>Screen.tsx."),
  bullet("2. Agregar tipo a ProtocolPhase en sessionStore.ts."),
  bullet("3. Agregar datos a SessionState y la accion set<NuevaFase>."),
  bullet("4. Agregar ruta en App.tsx dentro del <Route path='/session'>."),
  bullet("5. Agregar metadata en ProtocolLayout.tsx PHASES array."),

  new Paragraph({ children: [new PageBreak()] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// 19. GLOSARIO
// ════════════════════════════════════════════════════════════════════════════════

children.push(
  heading("19. Glosario", HeadingLevel.HEADING_1),

  smallTable([
    ["Termino", "Definicion"],
    ["TCC", "Terapia Cognitivo-Conductual. Modelo psicologico basado en la relacion pensamiento-emocion-conducta."],
    ["SUDs", "Subjective Units of Distress. Escala 0-100 para medir intensidad de malestar subjetivo."],
    ["ABC", "Antecedente-Conducta-Consecuencia. Analisis funcional de la conducta."],
    ["BDI-II", "Beck Depression Inventory. 21 items, escala 0-63. Gold standard para depresion."],
    ["BAI", "Beck Anxiety Inventory. 21 items, escala 0-63. Mide ansiedad somatica y cognitiva."],
    ["SMART", "Specific, Measurable, Achievable, Relevant, Time-bound. Criterios para objetivos terapeuticos."],
    ["Rapport", "Calidad de la relacion terapeutica. Score numerico en la entrevista."],
    ["Distorsion cognitiva", "Patron de pensamiento automatico disfuncional (12 tipos: Beck/Burns)."],
    ["Exposicion gradual", "Tecnica de enfrentamiento progresivo a estimulos temidos."],
    ["ACT", "Acceptance and Commitment Therapy. Tercera generacion: defusion, valores, flexibilidad."],
    ["DBT", "Dialectical Behavior Therapy. Linehan. Regulacion emocional + tolerancia al malestar."],
    ["RCI", "Reliable Change Index. Metodo estadistico para determinar si el cambio es real o ruido."],
    ["Formulacion de caso", "Mapa integrado: predisponentes + precipitantes + perpetuadores + protectores."],
    ["Code-splitting", "Tecnica de Vite: cada JSON de la KB es un chunk separado cargado bajo demanda."],
    ["Zustand", "Libreria de estado global para React. Ligera, sin boilerplate."],
    ["Dexie.js", "ORM para IndexedDB. Permite queries sobre datos locales en el navegador."],
    ["Zod", "Libreria de validacion de schemas. Valida los JSONs de la KB en runtime."],
    ["RAG", "Retrieval-Augmented Generation. Usar datos locales (KB) como contexto para la IA."],
    ["Chunk", "Fragmento de JavaScript generado por Vite. Cada JSON es un chunk separado."],
  ], [2800, 6560]),
);

// ════════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ════════════════════════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: {
      heading1: { run: { font: "Arial", bold: true, size: 32, color: ACCENT } },
      heading2: { run: { font: "Arial", bold: true, size: 26, color: ACCENT } },
      heading3: { run: { font: "Arial", bold: true, size: 22, color: ACCENT } },
    },
    paragraphStyles: [{
      id: "Normal", name: "Normal", run: { font: "Arial", size: 22 },
      paragraph: { spacing: { after: 200, line: 276 } },
    }],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        size: { width: PAGE_W, height: 15840 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "TCC-Lab — Informe Tecnico Integral  |  ", font: "Arial", size: 16, color: "999999" }),
                     new TextRun({ text: "Marzo 2026", font: "Arial", size: 16, color: "999999", bold: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Pagina ", font: "Arial", size: 16, color: "999999" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }),
          ],
        })],
      }),
    },
    children,
  }],
});

// ── Write ──────────────────────────────────────────────────────────────────────

const OUTPUT = "docs/TCC-Lab_Informe_Tecnico_Integral.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT, buf);
  console.log(`Documento generado: ${OUTPUT} (${Math.round(buf.length / 1024)} KB)`);
});
