const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TableOfContents,
} = require("docx");

// ── Constants ──
const PAGE_W = 12240;
const MARGIN = 1440;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9360
const ACCENT = "1A5276";
const ACCENT_LIGHT = "D4E6F1";
const GRAY = "F2F3F4";
const GREEN = "27AE60";
const GREEN_LIGHT = "D5F5E3";
const AMBER = "F39C12";
const AMBER_LIGHT = "FDEBD0";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
  });
}

function cell(text, width, opts = {}) {
  const fill = opts.fill || undefined;
  const shading = fill ? { fill, type: ShadingType.CLEAR } : undefined;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading,
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, bold: opts.bold, color: opts.color })],
      alignment: opts.align,
    })],
  });
}

function codeCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "2C3E50", type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Consolas", size: 18, color: "E8F8F5" })] })],
  });
}

function heading(level, text) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, font: "Arial" })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: opts.bold, italics: opts.italic, color: opts.color })],
  });
}

function multiPara(runs) {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, ...r })),
  });
}

// ── Techniques data ──
const techniques = [
  { id: "ac", name: "Activacion Conductual", specific: 3, areas: ["AC_AREAS_VITALES", "AC_VALORES_REFORZADORES", "AC_ACTIVIDADES_POR_PROBLEMA"] },
  { id: "rc", name: "Reestructuracion Cognitiva", specific: 4, areas: ["RC_DISTORSIONES_COGNITIVAS", "RC_REGISTRO_PENSAMIENTOS", "RC_CREENCIAS_NUCLEARES", "RC_EXPERIMENTOS_CONDUCTUALES"] },
  { id: "ds", name: "Desensibilizacion Sistematica", specific: 3, areas: ["DS_JERARQUIA_ANSIEDAD", "DS_RELAJACION", "DS_PROCESO_DESENSIBILIZACION"] },
  { id: "exposicion", name: "Terapia de Exposicion", specific: 3, areas: ["EXP_JERARQUIA_EXPOSICION", "EXP_PREVENCION_RESPUESTA", "EXP_PROCESO_EXPOSICION"] },
  { id: "mc", name: "Modificacion de Conducta", specific: 3, areas: ["MC_ANALISIS_FUNCIONAL", "MC_PROGRAMAS_REFORZAMIENTO", "MC_TECNICAS_OPERANTES"] },
  { id: "dc", name: "Terapia Dialectico Conductual", specific: 3, areas: ["DC_REGULACION_EMOCIONAL", "DC_TOLERANCIA_MALESTAR", "DC_EFECTIVIDAD_INTERPERSONAL"] },
  { id: "trec", name: "Terapia Racional Emotiva Conductual", specific: 3, areas: ["TREC_CREENCIAS_IRRACIONALES", "TREC_DISPUTACION", "TREC_MODELO_ABCDE"] },
  { id: "act", name: "Terapia de Aceptacion y Compromiso", specific: 3, areas: ["ACT_HEXAFLEX", "ACT_DEFUSION_COGNITIVA", "ACT_VALORES_ACCION"] },
  { id: "mindfulness", name: "Mindfulness Terapeutico", specific: 3, areas: ["MINDFULNESS_PRACTICAS_FORMALES", "MINDFULNESS_PRACTICAS_INFORMALES", "MINDFULNESS_APLICACIONES_CLINICAS"] },
];

const sharedAreas = [
  "Conocimiento y Fundamentos", "Objetivos Clinicos", "Herramientas de Evaluacion",
  "Ejercicios y Tareas", "Recursos y Materiales", "Tecnicas Especificas",
  "Estructura de Sesiones", "Barreras", "Habilidades del Terapeuta", "Sintomas y Problemas",
];

// ── Build document ──
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2C3E50" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "34495E" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: "numbers2", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: "numbers3", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ],
  },
  sections: [
    // ── COVER PAGE ──
    {
      properties: {
        page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      children: [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "TCC-Lab", font: "Arial", size: 56, bold: true, color: ACCENT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Base de Conocimiento (KB)", font: "Arial", size: 40, color: "2C3E50" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
          spacing: { after: 400 },
          children: [new TextRun({ text: " ", size: 10 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Informe Tecnico para Equipo de Desarrollo", font: "Arial", size: 28, color: "7F8C8D" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Arquitectura, Estructura de Datos y Guia de Integracion", font: "Arial", size: 22, color: "95A5A6" })],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Table({
          width: { size: 5000, type: WidthType.DXA },
          columnWidths: [2000, 3000],
          alignment: AlignmentType.CENTER,
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Version:", font: "Arial", size: 20, color: "7F8C8D" })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "3.0.0 (Marzo 2026)", font: "Arial", size: 20, bold: true })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Stack:", font: "Arial", size: 20, color: "7F8C8D" })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "React + TypeScript + Vite", font: "Arial", size: 20, bold: true })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Datos:", font: "Arial", size: 20, color: "7F8C8D" })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "141 JSON / 9 tecnicas / 15,317 lineas", font: "Arial", size: 20, bold: true })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Fecha:", font: "Arial", size: 20, color: "7F8C8D" })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "9 de Marzo de 2026", font: "Arial", size: 20, bold: true })] })] }),
            ]}),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },

    // ── TABLE OF CONTENTS ──
    {
      properties: {
        page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 4 } },
            children: [
              new TextRun({ text: "TCC-Lab  |  Informe Base de Conocimiento", font: "Arial", size: 16, color: "999999" }),
            ],
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
      children: [
        heading(HeadingLevel.HEADING_1, "Indice"),
        new TableOfContents("Tabla de Contenidos", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 1. RESUMEN EJECUTIVO
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "1. Resumen Ejecutivo"),
        para("La Base de Conocimiento (KB) es el nucleo de datos clinicos de TCC-Lab. Almacena todo el saber terapeutico que la aplicacion necesita para asistir al terapeuta durante las sesiones: desde fundamentos teoricos de cada tecnica hasta ejercicios concretos, inventarios de evaluacion, estructura de sesiones y protocolos de crisis."),
        para("El sistema KB fue disenado con tres principios fundamentales:"),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Extensibilidad: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "agregar una nueva tecnica terapeutica requiere crear un directorio, un manifest y archivos JSON, sin modificar el motor.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Code-splitting: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "cada archivo JSON se carga bajo demanda mediante import() dinamico de Vite, generando chunks separados. Solo se descarga el conocimiento que el terapeuta necesita.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 },
          children: [new TextRun({ text: "Type-safety: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "cada area tiene un schema Zod que valida los datos en runtime y un tipo TypeScript que garantiza seguridad en compile-time. Los hooks devuelven tipos exactos, no unknown.", font: "Arial", size: 22 })] }),

        // Tabla resumen numerico
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2340, 2340, 2340, 2340],
          rows: [
            new TableRow({ children: [
              headerCell("Metrica", 2340), headerCell("Cantidad", 2340), headerCell("Metrica", 2340), headerCell("Cantidad", 2340),
            ]}),
            new TableRow({ children: [
              cell("Tecnicas terapeuticas", 2340), cell("9", 2340, { bold: true, align: AlignmentType.CENTER }),
              cell("Archivos JSON (data/)", 2340), cell("121", 2340, { bold: true, align: AlignmentType.CENTER }),
            ]}),
            new TableRow({ children: [
              cell("Areas compartidas", 2340), cell("10", 2340, { bold: true, align: AlignmentType.CENTER }),
              cell("Archivos JSON (profiles)", 2340), cell("10", 2340, { bold: true, align: AlignmentType.CENTER }),
            ]}),
            new TableRow({ children: [
              cell("Areas especificas (total)", 2340), cell("28", 2340, { bold: true, align: AlignmentType.CENTER }),
              cell("Archivos JSON (procedures)", 2340), cell("10", 2340, { bold: true, align: AlignmentType.CENTER }),
            ]}),
            new TableRow({ children: [
              cell("Valores KBArea enum", 2340), cell("38", 2340, { bold: true, align: AlignmentType.CENTER }),
              cell("Lineas de datos JSON", 2340), cell("15,317", 2340, { bold: true, align: AlignmentType.CENTER }),
            ]}),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 2. OBJETIVO Y VISION FUTURA
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "2. Objetivo y Vision Futura"),
        heading(HeadingLevel.HEADING_2, "2.1 Objetivo Actual"),
        para("La KB sirve como fuente unica de verdad (single source of truth) para todo el contenido clinico de la aplicacion. Cuando un componente necesita saber, por ejemplo, cuales son las distorsiones cognitivas de RC, que ejercicios asignar en AC, o que inventario usar para evaluar depresion, consulta la KB en lugar de tener esa informacion hardcodeada."),
        para("Esto permite que los datos clinicos sean mantenidos independientemente del codigo de la interfaz. Un psicologo puede revisar y actualizar el contenido JSON sin tocar React."),

        heading(HeadingLevel.HEADING_2, "2.2 Vision a Futuro"),
        para("El sistema KB esta disenado para evolucionar en estas direcciones:"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Motor clinico inteligente: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "Un motor que consulte la KB para generar sugerencias contextuales al terapeuta durante la sesion (p.ej. 'El paciente muestra evitacion, se sugiere Activacion Conductual con ejercicio X').", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Asistente IA: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "Un chatbot que use la KB como contexto (RAG) para responder preguntas clinicas del terapeuta en tiempo real.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Personalizacion por paciente: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "Cruzar datos del paciente con la KB para seleccionar automaticamente la tecnica y los ejercicios mas adecuados.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Nuevas tecnicas: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "El TechniqueId union type ya prevee 'tcc' y 'dbt' como futuros IDs. Agregar una tecnica es crear 13 JSONs + 1 manifest.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 120 },
          children: [new TextRun({ text: "Versionado de contenido: ", font: "Arial", size: 22, bold: true }), new TextRun({ text: "El campo version en cada manifest permite actualizar datos clinicos sin romper compatibilidad.", font: "Arial", size: 22 })] }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 3. ARQUITECTURA GENERAL
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "3. Arquitectura General"),
        para("La KB se organiza en capas claramente separadas. Cada capa tiene una responsabilidad unica y se comunica con las adyacentes a traves de interfaces tipadas."),

        heading(HeadingLevel.HEADING_2, "3.1 Diagrama de Capas"),
        // Architecture layers table
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2200, 3100, 4060],
          rows: [
            new TableRow({ children: [
              headerCell("Capa", 2200), headerCell("Archivos", 3100), headerCell("Responsabilidad", 4060),
            ]}),
            new TableRow({ children: [
              cell("Datos (JSON)", 2200, { bold: true }), cell("src/knowledge/<id>/data/*.json", 3100), cell("Contenido clinico puro: fundamentos, ejercicios, inventarios, etc.", 4060),
            ]}),
            new TableRow({ children: [
              cell("Manifests", 2200, { bold: true }), cell("src/knowledge/<id>/<id>.manifest.ts", 3100), cell("Declaracion de la tecnica: nombre, version, fuentes, y lazy loaders para cada area.", 4060),
            ]}),
            new TableRow({ children: [
              cell("Registry", 2200, { bold: true }), cell("registry.ts + registry-init.ts", 3100), cell("Registro central (Map) donde cada tecnica se inscribe al inicio. API: getRegisteredTechniques(), getTechniqueManifest().", 4060),
            ]}),
            new TableRow({ children: [
              cell("Types + Schemas", 2200, { bold: true }), cell("src/knowledge/types/*.ts", 3100), cell("Interfaces TypeScript + schemas Zod para validacion runtime. 38 areas tipadas.", 4060),
            ]}),
            new TableRow({ children: [
              cell("Store (Zustand)", 2200, { bold: true }), cell("loaders/knowledge.store.ts", 3100), cell("Cache bidimensional slots[tecnica][area]. Dedup de imports en vuelo. Acciones: loadArea, loadShared, invalidate.", 4060),
            ]}),
            new TableRow({ children: [
              cell("Hooks (React)", 2200, { bold: true }), cell("loaders/useKnowledge.ts", 3100), cell("4 hooks: useKnowledgeArea, useKnowledgeAreas, useSharedKnowledge, useKnowledgePreload.", 4060),
            ]}),
            new TableRow({ children: [
              cell("Preloads", 2200, { bold: true }), cell("preloads.ts", 3100), cell("Perfiles de precarga por contexto clinico (entrevista, evaluacion, sesion completa, etc.).", 4060),
            ]}),
            new TableRow({ children: [
              cell("V3 (Profiles)", 2200, { bold: true }), cell("v3/resolver.ts", 3100), cell("Capa paralela que carga profile + procedures JSON para consulta de alto nivel.", 4060),
            ]}),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "3.2 Flujo de Datos"),
        para("El flujo completo cuando un componente React necesita datos de la KB es:"),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "El componente llama useKnowledgeArea('ac', KBArea.CONOCIMIENTO).", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "El hook lee el slot del Zustand store. Si status === 'idle', dispara loadArea().", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "loadArea() busca el manifest de 'ac' en TECHNIQUE_REGISTRY, obtiene el loader: () => import('./data/area_01_conocimiento.json').", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Vite resuelve el import() dinamico, descarga el chunk JSON separado.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "El store valida el JSON con el schema Zod correspondiente (conocimientoSchema).", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "Si valida, almacena en slots['ac']['conocimiento'] con status 'loaded'.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers2", level: 0 }, spacing: { after: 120 },
          children: [new TextRun({ text: "El hook re-renderiza el componente con data tipada como ConocimientoData.", font: "Arial", size: 22 })] }),

        para("Deduplicacion: si dos componentes piden la misma area simultaneamente, el Map<string, Promise> inflight evita un segundo import(). El segundo esperara la Promise del primero.", { italic: true, color: "7F8C8D" }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 4. ESTRUCTURA DE ARCHIVOS
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "4. Estructura de Archivos"),
        heading(HeadingLevel.HEADING_2, "4.1 Arbol de Directorios"),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [CONTENT_W],
          rows: [
            new TableRow({ children: [
              new TableCell({
                borders, width: { size: CONTENT_W, type: WidthType.DXA },
                shading: { fill: "1C2833", type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 200, right: 200 },
                children: [
                  ...[
                    "src/knowledge/",
                    "  types/                    # Tipos TS + schemas Zod (3,715 lineas)",
                    "    technique.types.ts       # KBArea enum, TechniqueId, TechniqueManifest",
                    "    schemas.ts               # 38 schemas Zod para validacion runtime",
                    "    areas.types.ts           # Interfaces + AreaDataMap (discriminated union)",
                    "    shared.types.ts          # InventariosGeneralesData, ProtocoloCrisisData...",
                    "    ac.types.ts, rc.types.ts, ...  # Tipos especificos por tecnica",
                    "    profile.types.ts         # TechniqueProfile (V3)",
                    "    procedure.types.ts       # ProcedureCatalog (V3)",
                    "  loaders/",
                    "    knowledge.store.ts       # Zustand store con cache bidimensional",
                    "    useKnowledge.ts          # 4 React hooks publicos",
                    "  registry.ts               # TECHNIQUE_REGISTRY (Map) + API",
                    "  registry-init.ts           # Bootstrap: import side-effects",
                    "  preloads.ts               # 11 perfiles de precarga por contexto",
                    "  v3/resolver.ts            # Carga profiles + procedures",
                    "  ac/                       # (1 de 9 tecnicas, todas siguen esta estructura)",
                    "    index.ts                 # registerTechnique(AC_MANIFEST)",
                    "    ac.manifest.ts           # Manifest con 13 lazy loaders",
                    "    data/                    # 13 archivos JSON",
                    "      area_01_conocimiento.json",
                    "      area_02_objetivos_clinicos.json",
                    "      ...area_13_actividades_por_problema.json",
                    "    profile/ac.profile.json  # Perfil V3",
                    "    procedures/ac.procedures.json  # Procedimientos V3",
                    "  rc/, ds/, exposicion/, mc/, dc/, trec/, act/, mindfulness/",
                    "  shared/                   # Conocimiento transversal",
                    "    data/inventarios_generales.json",
                    "    data/protocolo_crisis.json",
                    "    data/habilidades_entrevista.json",
                  ].map(line => new Paragraph({
                    spacing: { after: 20 },
                    children: [new TextRun({ text: line, font: "Consolas", size: 17, color: "ABB2B9" })],
                  })),
                ],
              }),
            ]}),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "4.2 Estructura de una Tecnica"),
        para("Cada tecnica sigue exactamente el mismo patron. Tomando 'ac' (Activacion Conductual) como ejemplo:"),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({ children: [headerCell("Archivo", 3500), headerCell("Proposito", 5860)] }),
            new TableRow({ children: [codeCell("ac/index.ts", 3500), cell("Side-effect: importa el manifest y llama registerTechnique(AC_MANIFEST). Se ejecuta desde registry-init.ts.", 5860)] }),
            new TableRow({ children: [codeCell("ac/ac.manifest.ts", 3500), cell("Declara id, nombre, descripcion, version, fuentes_principales, y un objeto areas con lazy loaders para cada KBArea.", 5860)] }),
            new TableRow({ children: [codeCell("ac/data/*.json (x13)", 3500), cell("Un JSON por area. Cada uno tiene area_id (discriminante), nombre, descripcion, fuentes, y campos especificos del area.", 5860)] }),
            new TableRow({ children: [codeCell("ac/profile/*.json", 3500), cell("Perfil V3: metadatos de alto nivel (modalidad terapeutica, poblacion, indicaciones, etc.).", 5860)] }),
            new TableRow({ children: [codeCell("ac/procedures/*.json", 3500), cell("Procedimientos V3: catalogo de procedimientos clinicos estructurados.", 5860)] }),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 5. TECNICAS Y AREAS
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "5. Tecnicas y Areas de Conocimiento"),

        heading(HeadingLevel.HEADING_2, "5.1 Las 9 Tecnicas Terapeuticas"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1000, 3500, 1600, 1200, 2060],
          rows: [
            new TableRow({ children: [
              headerCell("ID", 1000), headerCell("Nombre", 3500), headerCell("Areas Esp.", 1600),
              headerCell("Total", 1200), headerCell("Version", 2060),
            ]}),
            ...techniques.map(t => new TableRow({ children: [
              cell(t.id, 1000, { bold: true }), cell(t.name, 3500),
              cell(String(t.specific), 1600, { align: AlignmentType.CENTER }),
              cell(String(10 + t.specific), 1200, { align: AlignmentType.CENTER, bold: true }),
              cell("2.0.0", 2060, { align: AlignmentType.CENTER }),
            ]})),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "5.2 Las 10 Areas Compartidas"),
        para("Estas areas son comunes a todas las tecnicas. Cada tecnica tiene su propia version del contenido (p.ej. 'Conocimiento' de AC habla de activacion conductual, mientras que 'Conocimiento' de TREC habla del modelo ABC-DE):"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [500, 3000, 5860],
          rows: [
            new TableRow({ children: [headerCell("#", 500), headerCell("Area", 3000), headerCell("Contenido", 5860)] }),
            ...sharedAreas.map((a, i) => {
              const descs = [
                "Fundamentos teoricos, origenes historicos, modelo explicativo, evidencia cientifica, principios clave.",
                "Indicaciones por trastorno (con nivel de evidencia: alta/moderada/emergente), contraindicaciones y alternativas.",
                "Inventarios, escalas, autoregistros. Cada herramienta con proposito, cuando usar, formato. Referencia a shared/ si aplica.",
                "Ejercicios terapeuticos con instrucciones paso a paso, frecuencia, objetivo y ejemplo clinico concreto.",
                "Libros, manuales, videos, apps recomendadas. Cada recurso con uso clinico especifico.",
                "Tecnicas propias de la orientacion con pasos detallados, cuando usar y ejemplo clinico.",
                "Bloques de sesiones (fases), total sesiones recomendadas, frecuencia, objetivos y actividades por bloque.",
                "Barreras comunes (resistencia, falta de motivacion, etc.) con ejemplo del paciente y estrategia de manejo.",
                "Habilidades que el terapeuta necesita desarrollar, importancia y como desarrollarlas.",
                "Trastornos abordados con sintomas principales, manifestacion conductual y foco de intervencion.",
              ];
              return new TableRow({ children: [
                cell(String(i + 1), 500, { align: AlignmentType.CENTER }),
                cell(a, 3000, { bold: true }),
                cell(descs[i], 5860),
              ]});
            }),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "5.3 Areas Especificas por Tecnica"),
        para("Ademas de las 10 compartidas, cada tecnica tiene 3-4 areas que capturan su conocimiento distintivo:"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1200, 2720, 2720, 2720],
          rows: [
            new TableRow({ children: [
              headerCell("Tecnica", 1200), headerCell("Area Especifica 1", 2720),
              headerCell("Area Especifica 2", 2720), headerCell("Area Especifica 3", 2720),
            ]}),
            ...techniques.map(t => new TableRow({ children: [
              cell(t.id.toUpperCase(), 1200, { bold: true }),
              ...t.areas.slice(0, 3).map(a => cell(a.replace(/_/g, " "), 2720, { fill: GRAY })),
            ]})),
          ],
        }),
        para("RC tiene una 4a area especifica: RC_EXPERIMENTOS_CONDUCTUALES.", { italic: true, color: "7F8C8D" }),

        heading(HeadingLevel.HEADING_2, "5.4 Conocimiento Transversal (Shared)"),
        para("Tres areas compartidas entre todas las tecnicas, almacenadas en src/knowledge/shared/:"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2500, 2000, 4860],
          rows: [
            new TableRow({ children: [headerCell("SharedArea", 2500), headerCell("Enum", 2000), headerCell("Contenido", 4860)] }),
            new TableRow({ children: [
              cell("Inventarios Generales", 2500, { bold: true }), codeCell("INVENTARIOS_GENERALES", 2000),
              cell("BDI-II, BAI, PHQ-9, STAI, SCL-90-R, BHS. Cada uno con siglas, items, tiempo, puntos de corte por severidad.", 4860),
            ]}),
            new TableRow({ children: [
              cell("Protocolo de Crisis", 2500, { bold: true }), codeCell("PROTOCOLO_CRISIS", 2000),
              cell("Senales de alarma, pasos de intervencion, recursos de emergencia, contraindicaciones.", 4860),
            ]}),
            new TableRow({ children: [
              cell("Habilidades Entrevista", 2500, { bold: true }), codeCell("HABILIDADES_ENTREVISTA", 2000),
              cell("Habilidades por categoria (escucha, pregunta, reflejo, confrontacion, rapport). Basado en Cormier et al.", 4860),
            ]}),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 6. SISTEMA DE TIPOS
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "6. Sistema de Tipos y Validacion"),

        heading(HeadingLevel.HEADING_2, "6.1 Tipos Principales"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2800, 3200, 3360],
          rows: [
            new TableRow({ children: [headerCell("Tipo", 2800), headerCell("Ubicacion", 3200), headerCell("Proposito", 3360)] }),
            new TableRow({ children: [codeCell("TechniqueId", 2800), cell("technique.types.ts", 3200), cell("Union type: 'ac' | 'rc' | 'dc' | ... (9 valores)", 3360)] }),
            new TableRow({ children: [codeCell("KBArea", 2800), cell("technique.types.ts", 3200), cell("Enum con 38 valores (10 compartidos + 28 especificos)", 3360)] }),
            new TableRow({ children: [codeCell("SharedArea", 2800), cell("technique.types.ts", 3200), cell("Enum con 3 valores transversales", 3360)] }),
            new TableRow({ children: [codeCell("TechniqueManifest", 2800), cell("technique.types.ts", 3200), cell("Interface: id, nombre, version, fuentes, areas (Partial<Record<KBArea, loader>>)", 3360)] }),
            new TableRow({ children: [codeCell("AreaDataMap", 2800), cell("areas.types.ts", 3200), cell("Interface-map: KBArea -> tipo exacto de datos. Permite type-safe hooks.", 3360)] }),
            new TableRow({ children: [codeCell("AreaSlot<T>", 2800), cell("technique.types.ts", 3200), cell("Cache entry: { data, status, error, loadedAt }. Status: idle | loading | loaded | error.", 3360)] }),
            new TableRow({ children: [codeCell("SlotStatus", 2800), cell("technique.types.ts", 3200), cell("Union: 'idle' | 'loading' | 'loaded' | 'error'", 3360)] }),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "6.2 Validacion con Zod"),
        para("Cada area tiene un schema Zod en schemas.ts que valida la estructura del JSON al cargarlo. Si un JSON no cumple el schema, el store marca el slot con status 'error' y el mensaje de Zod."),
        para("El schema base (baseAreaSchema) requiere: area_id (discriminante), nombre, descripcion, fuentes[]. Cada area extiende este base con campos especificos. Ejemplo simplificado:"),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [CONTENT_W],
          rows: [new TableRow({ children: [
            new TableCell({
              borders, width: { size: CONTENT_W, type: WidthType.DXA },
              shading: { fill: "1C2833", type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 200, right: 200 },
              children: [
                ...[
                  "const conocimientoSchema = baseAreaSchema.extend({",
                  "  area_id: z.literal(KBArea.CONOCIMIENTO),",
                  "  fundamentos_teoricos: z.object({",
                  "    definicion: z.string().min(1),",
                  "    origenes_historicos: z.array(z.object({",
                  "      autor: z.string(), aportacion: z.string()",
                  "    })),",
                  "    modelo_explicativo: z.string(),",
                  "    mecanismo_de_cambio: z.string(),",
                  "  }),",
                  "  principios_clave: z.array(z.object({ ... })),",
                  "  evidencia_cientifica: z.object({ ... }),",
                  "});",
                ].map(line => new Paragraph({
                  spacing: { after: 10 },
                  children: [new TextRun({ text: line, font: "Consolas", size: 17, color: "ABB2B9" })],
                })),
              ],
            }),
          ]}),
          ],
        }),

        para("El mapa AREA_SCHEMAS: Partial<Record<KBArea, z.ZodType>> conecta cada enum con su schema correspondiente. Partial porque areas nuevas pueden no tener schema aun.", { after: 200 }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 7. API DE HOOKS
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "7. API de Hooks (Consumo desde React)"),
        para("Los hooks son la interfaz publica para que los componentes React accedan a la KB. Todos viven en useKnowledge.ts."),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [3500, 2800, 3060],
          rows: [
            new TableRow({ children: [headerCell("Hook", 3500), headerCell("Retorna", 2800), headerCell("Uso", 3060)] }),
            new TableRow({ children: [
              codeCell("useKnowledgeArea(id, area)", 3500),
              cell("{ data: T | null, isLoading, error }", 2800),
              cell("Un area, type-safe via AreaDataMap[A]", 3060),
            ]}),
            new TableRow({ children: [
              codeCell("useKnowledgeAreas(id, areas[])", 3500),
              cell("{ data, isLoading, allLoaded, errors }", 2800),
              cell("Multiples areas en paralelo", 3060),
            ]}),
            new TableRow({ children: [
              codeCell("useSharedKnowledge(area)", 3500),
              cell("{ data: T | null, isLoading, error }", 2800),
              cell("Datos transversales (shared/)", 3060),
            ]}),
            new TableRow({ children: [
              codeCell("useKnowledgePreload(id, areas[])", 3500),
              cell("void", 2800),
              cell("Precarga en background via requestIdleCallback", 3060),
            ]}),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "7.1 Ejemplo de Uso"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [CONTENT_W],
          rows: [new TableRow({ children: [
            new TableCell({
              borders, width: { size: CONTENT_W, type: WidthType.DXA },
              shading: { fill: "1C2833", type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 200, right: 200 },
              children: [
                ...[
                  "// Cargar un area especifica (type-safe)",
                  "const { data, isLoading } = useKnowledgeArea('ac', KBArea.CONOCIMIENTO);",
                  "// data es de tipo ConocimientoData | null",
                  "",
                  "// Cargar inventarios compartidos",
                  "const { data: inv } = useSharedKnowledge(SharedArea.INVENTARIOS_GENERALES);",
                  "// inv es de tipo InventariosGeneralesData | null",
                  "",
                  "// Precargar areas para una sesion",
                  "useKnowledgePreload('ac', PRELOAD_SESSION_FULL);",
                ].map(line => new Paragraph({
                  spacing: { after: 10 },
                  children: [new TextRun({ text: line, font: "Consolas", size: 17, color: line.startsWith("//") ? "7DCEA0" : "ABB2B9" })],
                })),
              ],
            }),
          ]}),
          ],
        }),

        heading(HeadingLevel.HEADING_2, "7.2 Perfiles de Precarga"),
        para("preloads.ts define 11 perfiles de precarga para distintos contextos clinicos. Ejemplo:"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [3800, 5560],
          rows: [
            new TableRow({ children: [headerCell("Perfil", 3800), headerCell("Areas que precarga", 5560)] }),
            new TableRow({ children: [codeCell("PRELOAD_INTERVIEW", 3800), cell("Habilidades terapeuta, herramientas evaluacion, sintomas/problemas", 5560)] }),
            new TableRow({ children: [codeCell("PRELOAD_ASSESSMENT", 3800), cell("Herramientas evaluacion, sintomas/problemas", 5560)] }),
            new TableRow({ children: [codeCell("PRELOAD_SESSION_FULL", 3800), cell("Estructura sesiones, barreras, habilidades terapeuta, tecnicas especificas", 5560)] }),
            new TableRow({ children: [codeCell("PRELOAD_AC_PLANNING", 3800), cell("Ejercicios, tecnicas + 3 areas especificas AC", 5560)] }),
            new TableRow({ children: [codeCell("PRELOAD_RC_COGNITIVE", 3800), cell("Ejercicios, tecnicas + 4 areas especificas RC", 5560)] }),
          ],
        }),
        para("Hay perfiles equivalentes para DS, EXP, MC, ACT, DC, TREC y Mindfulness.", { italic: true, color: "7F8C8D" }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 8. REGISTRY Y BOOTSTRAP
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "8. Registry y Bootstrap"),

        heading(HeadingLevel.HEADING_2, "8.1 Patron Registry"),
        para("El TECHNIQUE_REGISTRY es un Map<TechniqueId, TechniqueManifest> que actua como catalogo central. Cada tecnica se registra llamando registerTechnique(manifest) al importar su index.ts."),
        para("La API publica del registry incluye:"),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "getRegisteredTechniques()", font: "Consolas", size: 20 }), new TextRun({ text: " — devuelve todas las tecnicas registradas.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "getTechniqueManifest(id)", font: "Consolas", size: 20 }), new TextRun({ text: " — busca una tecnica por ID.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: "getSharedManifest()", font: "Consolas", size: 20 }), new TextRun({ text: " — devuelve los loaders de datos transversales.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 },
          children: [new TextRun({ text: "getCoreTechniques()", font: "Consolas", size: 20 }), new TextRun({ text: " — AC y RC como tecnicas nucleares.", font: "Arial", size: 22 })] }),

        heading(HeadingLevel.HEADING_2, "8.2 Bootstrap (registry-init.ts)"),
        para("Los side-effect imports se separaron del registry.ts en un archivo dedicado registry-init.ts para evitar un error de TDZ (Temporal Dead Zone) en ES modules. Este archivo se importa desde main.tsx para garantizar que todas las tecnicas estan registradas antes de que React monte la app."),
        para("Razon tecnica: en ES modules, los import son hoisted antes de que el cuerpo del modulo se ejecute. Si los side-effect imports vivieran en registry.ts, se resolverian antes de que const TECHNIQUE_REGISTRY = new Map() se ejecute, causando un ReferenceError.", { italic: true, color: "7F8C8D" }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 9. COMO AGREGAR UNA NUEVA TECNICA
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "9. Guia: Como Agregar una Nueva Tecnica"),
        para("Para agregar una nueva tecnica (p.ej. 'tcc' - Terapia Cognitivo Conductual clasica), seguir estos pasos:"),

        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Extender TechniqueId: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "En technique.types.ts, agregar 'tcc' al union type.", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Crear directorio: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "src/knowledge/tcc/ con subcarpetas data/, profile/, procedures/.", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Crear el manifest: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "tcc/tcc.manifest.ts exportando TCC_MANIFEST con id, nombre, version, fuentes, y el objeto areas con los lazy import().", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Crear index.ts: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Importar registerTechnique y llamar registerTechnique(TCC_MANIFEST).", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Crear los JSONs: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Minimo las 10 areas compartidas. Opcionalmente agregar areas especificas (definir nuevos valores en KBArea enum, tipos en tcc.types.ts, schemas en schemas.ts).", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Registrar en bootstrap: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Agregar import './tcc' en registry-init.ts.", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "V3 (opcional): ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "Crear profile/ y procedures/ JSONs. Agregar loaders en v3/resolver.ts.", font: "Arial", size: 22 }),
          ] }),
        new Paragraph({ numbering: { reference: "numbers3", level: 0 }, spacing: { after: 100 },
          children: [
            new TextRun({ text: "Validar: ", font: "Arial", size: 22, bold: true }),
            new TextRun({ text: "npx tsc --noEmit && npm run build. Verificar que no hay errores de tipo ni de Zod.", font: "Arial", size: 22 }),
          ] }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 10. DEVTOOLS
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "10. Herramientas de Desarrollo (DevTools)"),
        para("Se implemento un panel DevTools accesible en la ruta /dev de la aplicacion. Esta lazy-loaded (no afecta el bundle principal) y proporciona 4 herramientas:"),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2200, 7160],
          rows: [
            new TableRow({ children: [headerCell("Tab", 2200), headerCell("Funcionalidad", 7160)] }),
            new TableRow({ children: [
              cell("Navegador KB", 2200, { bold: true }),
              cell("Explorador de las 9 tecnicas con selector de area. Carga y renderiza el JSON de cualquier area en tiempo real. Incluye barra de busqueda cross-technique.", 7160),
            ]}),
            new TableRow({ children: [
              cell("Inventarios", 2200, { bold: true }),
              cell("Visualizador de inventarios clinicos (BDI-II, BAI, etc.) con puntos de corte colorizados por severidad. Permite consultar herramientas de evaluacion por tecnica.", 7160),
            ]}),
            new TableRow({ children: [
              cell("Digitalizador", 2200, { bold: true }),
              cell("Constructor de plantillas y formularios clinicos. Permite definir campos (texto, numero, likert, fecha, checkbox), previsualizar en vivo, y exportar como JSON.", 7160),
            ]}),
            new TableRow({ children: [
              cell("Estado KB", 2200, { bold: true }),
              cell("Dashboard de cobertura: matriz 9x13+ color-coded (verde=cargado, ambar=disponible, gris=N/A). Estadisticas globales. Verificacion V3.", 7160),
            ]}),
          ],
        }),

        para("Adicionalmente, el panel existente KnowledgeControlPanel (/therapist/knowledge) recibio una 5a tab 'Areas KB' que usa los mismos componentes compartidos para navegar las areas directamente."),

        heading(HeadingLevel.HEADING_2, "10.1 Componentes Compartidos"),
        para("Los componentes reutilizables viven en src/components/kb/:"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [3200, 6160],
          rows: [
            new TableRow({ children: [headerCell("Componente", 3200), headerCell("Descripcion", 6160)] }),
            new TableRow({ children: [codeCell("KBAreaBrowser", 3200), cell("Selector de tecnica + area en dos columnas. Agrupa areas en compartidas y especificas.", 6160)] }),
            new TableRow({ children: [codeCell("KBAreaDataViewer", 3200), cell("Renderizador generico de JSON de area. Usa useKnowledgeArea() internamente.", 6160)] }),
            new TableRow({ children: [codeCell("KBSearchBar", 3200), cell("Busqueda en slots ya cargados del Zustand store. Boton 'Cargar todo'.", 6160)] }),
            new TableRow({ children: [codeCell("KBCoverageMatrix", 3200), cell("Grilla de cobertura con celdas color-coded y estadisticas.", 6160)] }),
            new TableRow({ children: [codeCell("KBInventoryCard", 3200), cell("Tarjeta de instrumento clinico con severidad coloreada.", 6160)] }),
            new TableRow({ children: [codeCell("KBBadge", 3200), cell("Badge reutilizable con variantes (default, success, warning, error, info).", 6160)] }),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 11. COMANDOS Y VALIDACION
        // ══════════════════════════════════════════════════════════════
        heading(HeadingLevel.HEADING_1, "11. Comandos de Desarrollo"),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [4000, 5360],
          rows: [
            new TableRow({ children: [headerCell("Comando", 4000), headerCell("Proposito", 5360)] }),
            new TableRow({ children: [codeCell("npm run build", 4000), cell("Build de produccion (tsc + Vite). Verifica tipos y genera chunks.", 5360)] }),
            new TableRow({ children: [codeCell("npx tsc --noEmit", 4000), cell("Solo verificacion de tipos TypeScript sin emitir archivos.", 5360)] }),
            new TableRow({ children: [codeCell("npm run dev", 4000), cell("Servidor de desarrollo con HMR.", 5360)] }),
            new TableRow({ children: [codeCell("npx tsx scripts/populate-kb.ts --validate ac", 4000), cell("Validar datos KB de una tecnica especifica con Zod.", 5360)] }),
            new TableRow({ children: [codeCell("npx tsx scripts/populate-kb.ts --init <id>", 4000), cell("Inicializar estructura de una nueva tecnica (13 JSONs template + manifest).", 5360)] }),
          ],
        }),

        heading(HeadingLevel.HEADING_1, "12. Glosario"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2800, 6560],
          rows: [
            new TableRow({ children: [headerCell("Termino", 2800), headerCell("Definicion", 6560)] }),
            new TableRow({ children: [cell("KB", 2800, { bold: true }), cell("Knowledge Base. El sistema completo de datos clinicos.", 6560)] }),
            new TableRow({ children: [cell("Area", 2800, { bold: true }), cell("Unidad tematica de conocimiento (p.ej. 'Conocimiento', 'Barreras'). Cada area = 1 JSON.", 6560)] }),
            new TableRow({ children: [cell("Manifest", 2800, { bold: true }), cell("Declaracion de una tecnica: metadatos + lazy loaders para sus areas.", 6560)] }),
            new TableRow({ children: [cell("Slot", 2800, { bold: true }), cell("Entrada de cache en el Zustand store. Tiene data, status, error, loadedAt.", 6560)] }),
            new TableRow({ children: [cell("V3", 2800, { bold: true }), cell("Capa de profiles + procedures. Complementa la KB de areas con datos de alto nivel.", 6560)] }),
            new TableRow({ children: [cell("Shared", 2800, { bold: true }), cell("Datos transversales no especificos de una tecnica (inventarios, crisis, entrevista).", 6560)] }),
            new TableRow({ children: [cell("Preload", 2800, { bold: true }), cell("Precarga de areas en background via requestIdleCallback.", 6560)] }),
            new TableRow({ children: [cell("TDZ", 2800, { bold: true }), cell("Temporal Dead Zone. Error de ES modules cuando una const se accede antes de inicializarse.", 6560)] }),
            new TableRow({ children: [cell("Inflight dedup", 2800, { bold: true }), cell("Patron que evita imports duplicados usando Map<string, Promise>.", 6560)] }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = "docs/TCC-Lab_Base_de_Conocimiento_Informe.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`Documento generado: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
});
