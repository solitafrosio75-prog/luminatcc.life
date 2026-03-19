import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTechniqueV3Package,
  getV3Techniques,
  type TechniqueV3Package,
  type V3TechniqueId,
} from '../../knowledge/v3/resolver';
import { KBAreaBrowser } from '../../components/kb/KBAreaBrowser';
import { KBAreaDataViewer } from '../../components/kb/KBAreaDataViewer';
import type { KBArea, TechniqueId } from '../../knowledge/types/technique.types';

type PanelTab = 'consulta' | 'tecnicas' | 'plantillas' | 'formularios' | 'areas';
type PrintScope = 'current' | PanelTab;
type Audience = 'therapist' | 'developer';
type TemplateKind = 'inventario' | 'cuestionario' | 'registro' | 'formulario';
type FormFieldType = 'text' | 'textarea' | 'number' | 'likert_1_5' | 'checkbox' | 'date';

interface TechniqueDraft {
  id: string;
  name: string;
  orientation: string;
  summary: string;
  createdAt: string;
  createdBy: Audience;
}

interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
}

interface TemplateItem {
  id: string;
  name: string;
  kind: TemplateKind;
  techniqueIds: string[];
  description: string;
  fields: FormField[];
  isBuiltIn: boolean;
  createdAt: string;
}

interface AuditCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface SearchRow {
  id: string;
  techniqueId: V3TechniqueId;
  type: 'profile' | 'procedure';
  title: string;
  snippet: string;
  procedureId?: string;
}

const STORAGE_TECHNIQUES = 'tcc-lab:knowledge:technique-drafts:v1';
const STORAGE_TEMPLATES = 'tcc-lab:knowledge:templates:v1';

const TAB_META: Record<PanelTab, { label: string; desc: string }> = {
  consulta: {
    label: 'Consulta',
    desc: 'Busqueda clinica por tecnica, perfil y procedimientos.',
  },
  tecnicas: {
    label: 'Tecnicas',
    desc: 'Alta rapida de nuevas tecnicas en estado borrador.',
  },
  plantillas: {
    label: 'Plantillas',
    desc: 'Inventarios, cuestionarios y registros digitalizados.',
  },
  formularios: {
    label: 'Formularios',
    desc: 'Constructor simple para crear y guardar nuevas plantillas.',
  },
  areas: {
    label: 'Áreas KB',
    desc: 'Navegador de las 13 áreas de conocimiento por técnica.',
  },
};

const BUILT_IN_TEMPLATES: TemplateItem[] = [
  {
    id: 'bdi-ii',
    name: 'Inventario de Depresion BDI-II',
    kind: 'inventario',
    techniqueIds: ['ac', 'rc', 'act'],
    description: 'Auto-reporte para severidad de sintomas depresivos.',
    fields: [
      { id: 'fecha', label: 'Fecha de aplicacion', type: 'date', required: true },
      { id: 'total', label: 'Puntaje total BDI-II', type: 'number', required: true },
      { id: 'observaciones', label: 'Observaciones clinicas', type: 'textarea', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'bai',
    name: 'Inventario de Ansiedad BAI',
    kind: 'inventario',
    techniqueIds: ['exposicion', 'mindfulness', 'trec'],
    description: 'Escala breve para sintomas de ansiedad.',
    fields: [
      { id: 'fecha', label: 'Fecha de aplicacion', type: 'date', required: true },
      { id: 'total', label: 'Puntaje total BAI', type: 'number', required: true },
      { id: 'riesgo', label: 'Riesgo percibido por el paciente', type: 'likert_1_5', required: false },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'registro-pensamientos',
    name: 'Registro de Pensamientos',
    kind: 'registro',
    techniqueIds: ['rc', 'trec'],
    description: 'Plantilla para situacion, pensamiento automatico y alternativa.',
    fields: [
      { id: 'situacion', label: 'Situacion', type: 'textarea', required: true },
      { id: 'pensamiento', label: 'Pensamiento automatico', type: 'textarea', required: true },
      { id: 'emocion', label: 'Intensidad emocional (1-5)', type: 'likert_1_5', required: true },
      { id: 'alternativa', label: 'Pensamiento alternativo', type: 'textarea', required: true },
    ],
    isBuiltIn: true,
    createdAt: '2026-03-07T00:00:00.000Z',
  },
];

function readLocalList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalList<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-slate-700 text-slate-400 bg-slate-900">
      {children}
    </span>
  );
}

function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function slugifyTechniqueId(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function getTechniquePaths(techniqueId: string) {
  const id = techniqueId.trim().toLowerCase();
  const base = `src/knowledge/${id}`;
  return {
    base,
    profileDir: `${base}/profile`,
    proceduresDir: `${base}/procedures`,
    profileFile: `${base}/profile/${id}.profile.json`,
    proceduresFile: `${base}/procedures/${id}.procedures.json`,
  };
}

function toProcedureInputs(fields: FormField[]) {
  return fields.map((field) => ({
    nombre: field.label,
    tipo: 'registro',
    obligatorio: field.required,
    detalle: `Campo tipo ${field.type}`,
  }));
}

function buildProfileFromDraft(draft: TechniqueDraft) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    profile_id: `${draft.id}_profile_v3`,
    technique_id: draft.id,
    nombre: draft.name,
    version: '0.1.0-draft',
    reviewed_at: today,
    reviewed_by: ['panel_knowledge'],
    resumen_clinico: draft.summary,
    mecanismos_de_cambio: [
      'pendiente_definir_en_revision_clinica',
    ],
    problemas_diana: [
      'pendiente_definir',
    ],
    sintomas_diana: [
      'pendiente_definir',
    ],
    poblaciones_objetivo: [
      'adultos',
    ],
    prerequisitos: [
      'consentimiento_informado',
      'encuadre_terapeutico',
    ],
    contraindicaciones: [],
    banderas_seguridad: [
      'revisar_riesgo_clinico_previo_a_aplicacion',
    ],
    requiere_derivacion_si: [
      'riesgo_alto',
    ],
    supervision: [
      {
        id: `${draft.id}_sup_01`,
        descripcion: 'Recomendado revisar en supervision antes de uso intensivo.',
        requerido: true,
        contexto: draft.orientation,
      },
    ],
    evidencia: {
      nivel_global: 'emergente',
      fuerza_recomendacion: 'experimental',
      poblaciones_validadas: [],
      fuentes_clave: [],
      limitaciones: [
        'borrador_generado_desde_panel',
      ],
    },
    combinable_con: [],
    no_recomendada_con: [],
    trace_sources: [
      'ui:knowledge-control-panel',
    ],
  };
}

function buildProceduresFromDraft(draft: TechniqueDraft, templates: TemplateItem[]) {
  const today = new Date().toISOString().slice(0, 10);
  const relatedTemplates = templates.filter((tpl) => tpl.techniqueIds.includes(draft.id));

  const procedures = relatedTemplates.map((tpl, index) => ({
    procedure_id: `${draft.id}_proc_${String(index + 1).padStart(2, '0')}`,
    technique_id: draft.id,
    nombre: tpl.name,
    modalidad: 'individual',
    clinical_goal: tpl.description,
    indications: [`uso_con_${tpl.kind}`],
    expected_outcomes: ['registro_clinico_estructurado'],
    required_inputs: toProcedureInputs(tpl.fields),
    steps: [
      {
        orden: 1,
        accion: 'Presentar formulario y resolver dudas.',
        objetivo: 'Asegurar comprension de la consigna.',
      },
      {
        orden: 2,
        accion: 'Completar campos del formulario en sesion o tarea.',
        objetivo: 'Obtener datos clinicos comparables.',
      },
      {
        orden: 3,
        accion: 'Revisar resultados junto al paciente.',
        objetivo: 'Definir proximo ajuste de intervencion.',
      },
    ],
    success_criteria: ['formulario_completo', 'revision_clinica_realizada'],
    safety: {
      risk_level: 'bajo',
      contraindicaciones: [],
      stop_criteria: ['malestar_extremo_durante_aplicacion'],
      requiere_supervision: true,
      red_flags: ['datos_incompatibles_con_riesgo_bajo'],
    },
    evidence_level: 'consenso',
    intensidad: 'baja',
    trace_sources: ['ui:knowledge-control-panel'],
  }));

  if (procedures.length === 0) {
    procedures.push({
      procedure_id: `${draft.id}_proc_01`,
      technique_id: draft.id,
      nombre: `Procedimiento inicial de ${draft.name}`,
      modalidad: 'individual',
      clinical_goal: 'Aplicacion inicial en entorno supervisado.',
      indications: ['casos_piloto'],
      expected_outcomes: ['evidencia_preliminar_de_utilidad'],
      required_inputs: [],
      steps: [
        {
          orden: 1,
          accion: 'Definir objetivo operativo de la sesion.',
          objetivo: 'Delimitar alcance de la intervencion.',
        },
        {
          orden: 2,
          accion: 'Aplicar tecnica en formato breve.',
          objetivo: 'Observar respuesta inicial.',
        },
      ],
      success_criteria: ['aplicacion_completa'],
      safety: {
        risk_level: 'bajo',
        contraindicaciones: [],
        stop_criteria: ['aparicion_de_bandera_roja'],
        requiere_supervision: true,
        red_flags: ['empeoramiento_clinico'],
      },
      evidence_level: 'emergente',
      intensidad: 'baja',
      trace_sources: ['ui:knowledge-control-panel'],
    });
  }

  return {
    technique_id: draft.id,
    version: '0.1.0-draft',
    reviewed_at: today,
    procedures,
  };
}

function buildIntegrationReadme(draft: TechniqueDraft, templates: TemplateItem[]): string {
  const paths = getTechniquePaths(draft.id);
  const relatedTemplates = templates.filter((tpl) => tpl.techniqueIds.includes(draft.id));
  const templateNames = relatedTemplates.length > 0
    ? relatedTemplates.map((tpl) => `- ${tpl.name} (${tpl.kind})`).join('\n')
    : '- Sin plantillas asociadas aun.';

  return [
    `# Integracion tecnica: ${draft.name}`,
    '',
    `ID tecnico: \`${draft.id}\``,
    `Orientacion: ${draft.orientation}`,
    `Creado desde panel: ${new Date(draft.createdAt).toLocaleString()}`,
    '',
    '## Archivos exportados',
    `- \`${draft.id}.profile.json\``,
    `- \`${draft.id}.procedures.json\``,
    `- \`${draft.id}.integration-checklist.md\``,
    `- \`${draft.id}.resolver.patch.txt\``,
    `- \`${draft.id}.db-types.patch.txt\``,
    '',
    '## Ubicacion sugerida en el repo',
    `- Carpeta base: \`${paths.base}\``,
    `- Profile: \`${paths.profileFile}\``,
    `- Procedures: \`${paths.proceduresFile}\``,
    '',
    '## Resumen clinico',
    draft.summary,
    '',
    '## Plantillas relacionadas',
    templateNames,
    '',
    '## Checklist de integracion en repo',
    `- [ ] Crear carpeta \`${paths.base}/\` si no existe.`,
    `- [ ] Ubicar \`${draft.id}.profile.json\` en \`${paths.profileDir}/\`.`,
    `- [ ] Ubicar \`${draft.id}.procedures.json\` en \`${paths.proceduresDir}/\`.`,
    '- [ ] Registrar loader en `src/knowledge/v3/resolver.ts` (profile + procedures).',
    '- [ ] Revisar alias/mapeo en `src/services/tccEngineKnowledgeV3Bridge.ts`.',
    '- [ ] Integrar catalogo/pesos en `src/services/TCCEngine.ts`.',
    '- [ ] Aplicar snippet de `db-types.patch` en `src/db/types.ts` (union + TECHNIQUE_INFO).',
    '- [ ] Validar mapping emocional en `src/services/EmotionTechniqueMapping.ts`.',
    '- [ ] Validar analisis temporal en `src/services/TemporalPatternAnalysis.ts`.',
    '- [ ] Actualizar tipos/catologos en `src/db/types.ts`.',
    '- [ ] Verificar visibilidad UI en `src/features/session/phases/InterventionScreen.tsx`.',
    '- [ ] Ejecutar `npm run kb:audit` y guardar evidencia de salida.',
    '',
    '## Nota',
    'Este checklist se genero desde el Panel Knowledge para acelerar incorporacion de nuevas tecnicas.',
    '',
  ].join('\n');
}

function buildResolverPatchSnippet(draft: TechniqueDraft): string {
  return [
    `# Resolver patch snippet for technique: ${draft.id}`,
    '# File target: src/knowledge/v3/resolver.ts',
    '# Note: merge manually to avoid overriding existing techniques.',
    '',
    '1) Update V3TechniqueId union:',
    "export type V3TechniqueId = /* existentes */ | '" + draft.id + "';",
    '',
    '2) Add profile loader entry inside V3_PROFILE_LOADERS:',
    draft.id + ": () => import('../" + draft.id + "/profile/" + draft.id + ".profile.json'),",
    '',
    '3) Add procedures loader entry inside V3_PROCEDURE_LOADERS:',
    draft.id + ": () => import('../" + draft.id + "/procedures/" + draft.id + ".procedures.json'),",
    '',
    '4) Add technique id to V3_TECHNIQUES array:',
    "const V3_TECHNIQUES: V3TechniqueId[] = [/* existentes */, '" + draft.id + "'];",
    '',
    '5) Run validation:',
    '- npm run kb:audit',
    '',
  ].join('\n');
}

function buildDbTypesPatchSnippet(draft: TechniqueDraft): string {
  const key = slugifyTechniqueId(draft.id);
  const label = draft.name.replace(/'/g, "");
  const description = (draft.summary || `Tecnica ${label} en estado inicial de integracion.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
    .replace(/'/g, '');

  return [
    `# DB types patch snippet for technique: ${draft.id}`,
    '# File target: src/db/types.ts',
    '# Note: adjust bestFor and estimatedMinutes based on validacion clinica.',
    '',
    '1) Add new literal in TCCTechnique union:',
    `| '${key}'               // ${label}`,
    '',
    '2) Add entry in TECHNIQUE_INFO:',
    `${key}: {`,
    `  label: '${label}',`,
    `  description: '${description}',`,
    "  bestFor: ['anxiety', 'overwhelm'],",
    '  estimatedMinutes: 20,',
    "  evidenceLevel: 'emerging',",
    '},',
    '',
    '3) Optional follow-up:',
    '- Review aliases in services and UI catalogs if needed.',
    '- Run: npm run kb:audit',
    '',
  ].join('\n');
}

export function KnowledgeControlPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PanelTab>('consulta');
  const [printScope, setPrintScope] = useState<PrintScope>('current');
  const [audience, setAudience] = useState<Audience>('therapist');

  const [v3Packages, setV3Packages] = useState<TechniqueV3Package[]>([]);
  const [isLoadingV3, setIsLoadingV3] = useState(true);
  const [v3Error, setV3Error] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [techniqueFilter, setTechniqueFilter] = useState<'all' | V3TechniqueId>('all');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<TechniqueDraft[]>([]);
  const [draftName, setDraftName] = useState('');
  const [draftId, setDraftId] = useState('');
  const [draftOrientation, setDraftOrientation] = useState('');
  const [draftSummary, setDraftSummary] = useState('');

  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>([]);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateKind, setNewTemplateKind] = useState<TemplateKind>('formulario');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateTechniques, setNewTemplateTechniques] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);
  const [auditChecks, setAuditChecks] = useState<AuditCheck[]>([]);
  const [auditRanAt, setAuditRanAt] = useState<string | null>(null);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  // ── Áreas KB tab state ──
  const [selectedKBTechnique, setSelectedKBTechnique] = useState<TechniqueId | null>(null);
  const [selectedKBArea, setSelectedKBArea] = useState<KBArea | null>(null);

  const draftPaths = useMemo(() => {
    const id = draftId.trim().toLowerCase();
    if (!id) return null;
    return getTechniquePaths(id);
  }, [draftId]);

  useEffect(() => {
    setDrafts(readLocalList<TechniqueDraft>(STORAGE_TECHNIQUES, []));
    setCustomTemplates(readLocalList<TemplateItem>(STORAGE_TEMPLATES, []));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      setIsLoadingV3(true);
      setV3Error(null);
      try {
        const techniques = getV3Techniques();
        const loaded = await Promise.all(techniques.map((id) => getTechniqueV3Package(id)));
        if (!cancelled) {
          setV3Packages(loaded);
        }
      } catch (error) {
        if (!cancelled) {
          setV3Error(error instanceof Error ? error.message : 'No se pudo cargar knowledge v3.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingV3(false);
        }
      }
    }

    void loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  const allTemplates = useMemo(
    () => [...BUILT_IN_TEMPLATES, ...customTemplates],
    [customTemplates],
  );

  const searchableRows = useMemo<SearchRow[]>(() => {
    return v3Packages.flatMap((pkg) => {
      const profileRow = {
        id: `${pkg.techniqueId}:profile`,
        techniqueId: pkg.techniqueId,
        type: 'profile' as const,
        title: pkg.profile.nombre,
        snippet: pkg.profile.resumen_clinico,
      };

      const procedureRows = pkg.procedures.procedures.map((procedure) => ({
        id: `${pkg.techniqueId}:${procedure.procedure_id}`,
        techniqueId: pkg.techniqueId,
        type: 'procedure' as const,
        title: procedure.nombre,
        snippet: `${procedure.clinical_goal} | intensidad ${procedure.intensidad}`,
        procedureId: procedure.procedure_id,
      }));

      return [profileRow, ...procedureRows];
    });
  }, [v3Packages]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchableRows.filter((row) => {
      const matchesTechnique = techniqueFilter === 'all' || row.techniqueId === techniqueFilter;
      const matchesQuery =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        row.snippet.toLowerCase().includes(q) ||
        row.techniqueId.toLowerCase().includes(q);
      return matchesTechnique && matchesQuery;
    });
  }, [query, searchableRows, techniqueFilter]);

  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.id === selectedRowId) ?? null,
    [filteredRows, selectedRowId],
  );

  const selectedPackage = useMemo(
    () => (selectedRow ? v3Packages.find((pkg) => pkg.techniqueId === selectedRow.techniqueId) ?? null : null),
    [selectedRow, v3Packages],
  );

  const selectedProcedure = useMemo(() => {
    if (!selectedRow || selectedRow.type !== 'procedure' || !selectedPackage || !selectedRow.procedureId) {
      return null;
    }
    return selectedPackage.procedures.procedures.find((p) => p.procedure_id === selectedRow.procedureId) ?? null;
  }, [selectedRow, selectedPackage]);

  const selectedTemplate = useMemo(
    () => allTemplates.find((tpl) => tpl.id === selectedTemplateId) ?? null,
    [allTemplates, selectedTemplateId],
  );

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedRowId(null);
      return;
    }

    const stillVisible = selectedRowId && filteredRows.some((row) => row.id === selectedRowId);
    if (!stillVisible && selectedRowId) {
      setSelectedRowId(null);
    }
  }, [filteredRows, selectedRowId]);

  function handleCloseDetailModal() {
    setSelectedRowId(null);
  }

  function handleCloseTemplateModal() {
    setSelectedTemplateId(null);
  }

  function handleMoveTemplate(direction: -1 | 1) {
    if (allTemplates.length === 0) return;

    const currentIndex = allTemplates.findIndex((tpl) => tpl.id === selectedTemplateId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + allTemplates.length) % allTemplates.length;
    setSelectedTemplateId(allTemplates[nextIndex].id);
  }

  function handleMoveSelectedRow(direction: -1 | 1) {
    if (filteredRows.length === 0) return;

    const currentIndex = filteredRows.findIndex((row) => row.id === selectedRowId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + filteredRows.length) % filteredRows.length;
    setSelectedRowId(filteredRows[nextIndex].id);
  }

  useEffect(() => {
    if (tab !== 'consulta' || !selectedRowId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseDetailModal();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        handleMoveSelectedRow(1);
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        handleMoveSelectedRow(-1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tab, selectedRowId, filteredRows]);

  useEffect(() => {
    if (!selectedTemplateId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseTemplateModal();
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        handleMoveTemplate(1);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        handleMoveTemplate(-1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedTemplateId, allTemplates]);

  function resetDraftForm() {
    setDraftName('');
    setDraftId('');
    setDraftOrientation('');
    setDraftSummary('');
  }

  function handleCreateDraft() {
    const id = draftId.trim().toLowerCase();
    const name = draftName.trim();
    if (!id || !name) return;

    const next: TechniqueDraft = {
      id,
      name,
      orientation: draftOrientation.trim() || 'No definida',
      summary: draftSummary.trim() || 'Sin resumen inicial.',
      createdAt: new Date().toISOString(),
      createdBy: audience,
    };

    const updated = [next, ...drafts.filter((d) => d.id !== id)];
    setDrafts(updated);
    writeLocalList(STORAGE_TECHNIQUES, updated);
    resetDraftForm();
  }

  function handleDeleteDraft(id: string) {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    writeLocalList(STORAGE_TECHNIQUES, updated);
  }

  function handleAddField() {
    const label = newFieldLabel.trim();
    if (!label) return;

    const field: FormField = {
      id: `field-${Date.now()}`,
      label,
      type: newFieldType,
      required: newFieldRequired,
    };

    setBuilderFields((prev) => [...prev, field]);
    setNewFieldLabel('');
    setNewFieldRequired(false);
    setNewFieldType('text');
  }

  function handleRemoveField(id: string) {
    setBuilderFields((prev) => prev.filter((f) => f.id !== id));
  }

  function handleSaveTemplate() {
    const name = newTemplateName.trim();
    if (!name || builderFields.length === 0) return;

    const techniqueIds = newTemplateTechniques
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const next: TemplateItem = {
      id: `tpl-${Date.now()}`,
      name,
      kind: newTemplateKind,
      techniqueIds,
      description: newTemplateDescription.trim() || 'Plantilla creada por terapeuta.',
      fields: builderFields,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [next, ...customTemplates];
    setCustomTemplates(updated);
    writeLocalList(STORAGE_TEMPLATES, updated);

    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateTechniques('');
    setNewTemplateKind('formulario');
    setBuilderFields([]);
  }

  function handleDeleteTemplate(id: string) {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    writeLocalList(STORAGE_TEMPLATES, updated);
  }

  function handleAutogenerateDraftId() {
    const generated = slugifyTechniqueId(draftName);
    if (!generated) return;
    setDraftId(generated);
  }

  function handleExportDraftPackage(draft: TechniqueDraft) {
    const profile = buildProfileFromDraft(draft);
    const procedures = buildProceduresFromDraft(draft, allTemplates);
    downloadJsonFile(`${draft.id}.profile.json`, profile);
    downloadJsonFile(`${draft.id}.procedures.json`, procedures);
  }

  function handleExportDraftReadme(draft: TechniqueDraft) {
    const readme = buildIntegrationReadme(draft, allTemplates);
    downloadTextFile(`${draft.id}.integration-checklist.md`, readme, 'text/markdown');
  }

  function handleExportResolverPatch(draft: TechniqueDraft) {
    const patch = buildResolverPatchSnippet(draft);
    downloadTextFile(`${draft.id}.resolver.patch.txt`, patch, 'text/plain');
  }

  function handleExportDbTypesPatch(draft: TechniqueDraft) {
    const patch = buildDbTypesPatchSnippet(draft);
    downloadTextFile(`${draft.id}.db-types.patch.txt`, patch, 'text/plain');
  }

  function handleExportDraftBundle(draft: TechniqueDraft) {
    handleExportDraftPackage(draft);
    handleExportDraftReadme(draft);
    handleExportResolverPatch(draft);
    handleExportDbTypesPatch(draft);
  }

  async function handleCopyAuditCommand() {
    try {
      await navigator.clipboard.writeText('npm run kb:audit');
      setAuditMessage('Comando copiado: npm run kb:audit');
    } catch {
      setAuditMessage('No se pudo copiar automaticamente. Usa manualmente: npm run kb:audit');
    }
  }

  function runPanelAudit() {
    const checks: AuditCheck[] = [];

    checks.push({
      id: 'v3-loaded',
      label: 'Carga de paquetes v3',
      ok: !isLoadingV3 && !v3Error && v3Packages.length > 0,
      detail: !isLoadingV3 && !v3Error
        ? `${v3Packages.length} tecnicas v3 disponibles.`
        : v3Error ?? 'Carga pendiente o sin datos.',
    });

    const draftIds = drafts.map((d) => d.id);
    const hasUniqueDraftIds = new Set(draftIds).size === draftIds.length;
    checks.push({
      id: 'draft-ids-unique',
      label: 'IDs de tecnicas borrador unicos',
      ok: hasUniqueDraftIds,
      detail: hasUniqueDraftIds ? 'No se detectaron duplicados.' : 'Hay IDs duplicados en borradores.',
    });

    const invalidDraftIds = drafts.filter((d) => !/^[a-z0-9_]+$/.test(d.id));
    checks.push({
      id: 'draft-id-format',
      label: 'Formato de ID tecnico',
      ok: invalidDraftIds.length === 0,
      detail: invalidDraftIds.length === 0
        ? 'Todos los IDs cumplen `a-z0-9_`.'
        : `IDs invalidos: ${invalidDraftIds.map((d) => d.id).join(', ')}`,
    });

    const templatesWithoutFields = customTemplates.filter((t) => t.fields.length === 0);
    checks.push({
      id: 'template-fields',
      label: 'Plantillas personalizadas con campos',
      ok: templatesWithoutFields.length === 0,
      detail: templatesWithoutFields.length === 0
        ? 'Todas las plantillas custom tienen estructura.'
        : `Plantillas sin campos: ${templatesWithoutFields.map((t) => t.name).join(', ')}`,
    });

    checks.push({
      id: 'export-ready',
      label: 'Borradores exportables a v3',
      ok: drafts.length > 0,
      detail: drafts.length > 0
        ? `Listos para exportar: ${drafts.length}`
        : 'Crea al menos un borrador para exportar profile/procedures.',
    });

    setAuditChecks(checks);
    setAuditRanAt(new Date().toLocaleString());
    setAuditMessage('Auditoria del panel completada.');
  }

  function handlePrintPanel() {
    if (printScope === 'current') {
      window.print();
      return;
    }

    const previousTab = tab;
    setTab(printScope);

    // Espera un frame de render para imprimir la seccion seleccionada.
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        setTab(previousTab);
      }, 0);
    }, 120);
  }

  return (
    <div className="knowledge-print-root min-h-screen bg-slate-950 text-slate-100">
      <style>{`
        @media print {
          .knowledge-print-root {
            background: #ffffff !important;
            color: #111111 !important;
            min-height: auto !important;
          }

          .knowledge-print-root .no-print {
            display: none !important;
          }

          .knowledge-print-root .print-card {
            border: 1px solid #d1d5db !important;
            background: #ffffff !important;
            color: #111111 !important;
            break-inside: avoid;
          }

          .knowledge-print-root input,
          .knowledge-print-root textarea,
          .knowledge-print-root select,
          .knowledge-print-root button {
            border-color: #d1d5db !important;
            color: #111111 !important;
            background: #ffffff !important;
          }
        }
      `}</style>
      <header className="border-b border-slate-800 px-5 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">TCC Lab</p>
            <h1 className="text-xl font-semibold">Panel de Control Knowledge</h1>
            <p className="text-xs text-slate-500 mt-1">
              Consulta clinica, administracion de tecnicas y gestion de plantillas.
            </p>
          </div>

          <div className="no-print flex items-center gap-2">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              aria-label="Seleccion de modo de acceso"
              className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-2"
            >
              <option value="therapist">Modo terapeuta</option>
              <option value="developer">Modo developer</option>
            </select>
            <select
              value={printScope}
              onChange={(e) => setPrintScope(e.target.value as PrintScope)}
              aria-label="Modo de impresion"
              className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-2"
            >
              <option value="current">Imprimir: seccion actual</option>
              <option value="consulta">Imprimir: consulta</option>
              <option value="tecnicas">Imprimir: tecnicas</option>
              <option value="plantillas">Imprimir: plantillas</option>
              <option value="formularios">Imprimir: formularios</option>
            </select>
            <button
              onClick={handlePrintPanel}
              className="text-xs px-3 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-900"
            >
              Imprimir
            </button>
            <button
              onClick={() => navigate('/therapist')}
              className="text-xs px-3 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-900"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-5">
        <section className="no-print grid grid-cols-1 md:grid-cols-5 gap-2">
          {(Object.keys(TAB_META) as PanelTab[]).map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={[
                  'text-left rounded-lg border px-3 py-3 transition-colors',
                  active
                    ? 'border-cyan-700 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900',
                ].join(' ')}
              >
                <p className="text-sm font-medium">{TAB_META[key].label}</p>
                <p className="text-[11px] text-slate-500 mt-1">{TAB_META[key].desc}</p>
              </button>
            );
          })}
        </section>

        {tab === 'consulta' && (
          <section className="print-card rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
            <div className="no-print flex flex-col lg:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por tecnica, nombre o problema objetivo..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              <select
                value={techniqueFilter}
                onChange={(e) => setTechniqueFilter(e.target.value as 'all' | V3TechniqueId)}
                aria-label="Filtro por tecnica"
                className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <option value="all">Todas las tecnicas</option>
                {getV3Techniques().map((id) => (
                  <option key={id} value={id}>{id.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {isLoadingV3 && <p className="text-sm text-slate-500">Cargando knowledge v3...</p>}
            {v3Error && <p className="text-sm text-rose-400">{v3Error}</p>}

            {!isLoadingV3 && !v3Error && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Resultados: {filteredRows.length}</p>
                <div className="max-h-[460px] overflow-auto space-y-2 pr-1">
                  {filteredRows.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => setSelectedRowId(row.id)}
                      className={[
                        'print-card w-full text-left rounded-lg border p-3 transition-colors',
                        selectedRowId === row.id
                          ? 'border-cyan-600 bg-cyan-950/20'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-medium text-slate-100">{row.title}</h3>
                        <div className="flex items-center gap-1">
                          <Badge>{row.techniqueId}</Badge>
                          <Badge>{row.type}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{row.snippet}</p>
                    </button>
                  ))}
                </div>

              </div>
            )}
          </section>
        )}

        {tab === 'consulta' && selectedRow && selectedPackage && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
            <div
              className="absolute inset-0"
              onClick={handleCloseDetailModal}
              aria-hidden="true"
            />

            <article
              role="dialog"
              aria-modal="true"
              aria-label="Detalle de tecnica"
              className="relative z-10 w-full max-w-3xl max-h-[88vh] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Lectura detallada: {selectedRow.title}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Badge>{selectedRow.techniqueId}</Badge>
                    <Badge>{selectedRow.type}</Badge>
                  </div>
                  <button
                    onClick={handleCloseDetailModal}
                    className="text-xs px-2.5 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {selectedRow.type === 'profile' && (
                <div className="space-y-2 text-xs text-slate-300">
                  <p><span className="text-slate-500">Resumen:</span> {selectedPackage.profile.resumen_clinico}</p>
                  <p><span className="text-slate-500">Mecanismos:</span> {selectedPackage.profile.mecanismos_de_cambio.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Problemas diana:</span> {selectedPackage.profile.problemas_diana.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Sintomas diana:</span> {selectedPackage.profile.sintomas_diana.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Prerequisitos:</span> {selectedPackage.profile.prerequisitos.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Banderas de seguridad:</span> {selectedPackage.profile.banderas_seguridad.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Evidencia:</span> {selectedPackage.profile.evidencia.nivel_global} ({selectedPackage.profile.evidencia.fuerza_recomendacion})</p>
                </div>
              )}

              {selectedRow.type === 'procedure' && selectedProcedure && (
                <div className="space-y-2 text-xs text-slate-300">
                  <p><span className="text-slate-500">Objetivo clinico:</span> {selectedProcedure.clinical_goal}</p>
                  <p><span className="text-slate-500">Modalidad:</span> {selectedProcedure.modalidad}</p>
                  <p><span className="text-slate-500">Indicaciones:</span> {selectedProcedure.indications.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Resultados esperados:</span> {selectedProcedure.expected_outcomes.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Criterios de exito:</span> {selectedProcedure.success_criteria.join(', ') || 'No definido'}</p>
                  <p><span className="text-slate-500">Seguridad:</span> riesgo {selectedProcedure.safety.risk_level}, supervision {selectedProcedure.safety.requiere_supervision ? 'si' : 'no'}</p>
                  <div>
                    <p className="text-slate-500 mb-1">Pasos:</p>
                    <div className="space-y-1">
                      {selectedProcedure.steps.map((step) => (
                        <p key={`${selectedProcedure.procedure_id}-${step.orden}`}>
                          {step.orden}. {step.accion} - {step.objetivo}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          </div>
        )}

        {tab === 'tecnicas' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="no-print rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Nueva tecnica (borrador)</h2>
              <p className="text-xs text-slate-500">
                Flujo rapido para terapeuta/developer. Luego puedes pasarla al pipeline formal v3.
              </p>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Nombre de la tecnica"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleAutogenerateDraftId}
                className="text-xs px-3 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 w-fit"
              >
                Autogenerar ID desde nombre
              </button>
              <input
                value={draftId}
                onChange={(e) => setDraftId(e.target.value)}
                placeholder="ID tecnico (ej: metacognitiva_breve)"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              {draftPaths && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                  <p className="text-[11px] text-slate-400 font-medium">Rutas sugeridas en el repo</p>
                  <p className="text-[11px] text-slate-500">{draftPaths.profileFile}</p>
                  <p className="text-[11px] text-slate-500">{draftPaths.proceduresFile}</p>
                </div>
              )}
              <input
                value={draftOrientation}
                onChange={(e) => setDraftOrientation(e.target.value)}
                placeholder="Orientacion o modelo (ej: tercera_generacion)"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              <textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                placeholder="Resumen clinico"
                className="w-full min-h-24 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleCreateDraft}
                className="text-xs px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600"
              >
                Guardar borrador
              </button>
            </article>

            <article className="print-card rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Borradores guardados</h2>
              {audience === 'developer' && (
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 space-y-2">
                  <p className="text-xs font-medium text-slate-200">Auditoria y publicacion</p>
                  <p className="text-[11px] text-slate-500">
                    Ejecuta checks del panel y usa el comando real para auditoria completa del repo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={runPanelAudit}
                      className="text-xs px-3 py-2 rounded bg-indigo-700 hover:bg-indigo-600"
                    >
                      Ejecutar auditoria del panel
                    </button>
                    <button
                      onClick={handleCopyAuditCommand}
                      className="text-xs px-3 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Copiar comando kb:audit
                    </button>
                  </div>
                  {auditMessage && <p className="text-[11px] text-slate-400">{auditMessage}</p>}
                  {auditRanAt && <p className="text-[11px] text-slate-500">Ultima corrida: {auditRanAt}</p>}
                  {auditChecks.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {auditChecks.map((check) => (
                        <div key={check.id} className="text-[11px] rounded border border-slate-800 bg-slate-900/70 px-2 py-1.5">
                          <p className={check.ok ? 'text-emerald-400' : 'text-rose-400'}>
                            {check.ok ? 'OK' : 'FALLA'} - {check.label}
                          </p>
                          <p className="text-slate-500 mt-0.5">{check.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="max-h-[400px] overflow-auto space-y-2 pr-1">
                {drafts.length === 0 && (
                  <p className="text-xs text-slate-500">Sin borradores por ahora.</p>
                )}
                {drafts.map((draft) => (
                  <div key={draft.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-100 font-medium">{draft.name}</p>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="text-[11px] text-rose-400 hover:text-rose-300"
                      >
                        Eliminar
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">ID: {draft.id}</p>
                    <p className="text-xs text-slate-400 mt-1">{draft.summary}</p>
                    <div className="mt-2 flex gap-1">
                      <Badge>{draft.orientation}</Badge>
                      <Badge>{draft.createdBy}</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleExportDraftPackage(draft)}
                          className="text-[11px] px-2.5 py-1.5 rounded border border-cyan-700/50 text-cyan-300 hover:bg-cyan-950/30"
                        >
                          Exportar JSON v3
                        </button>
                        <button
                          onClick={() => handleExportDraftReadme(draft)}
                          className="text-[11px] px-2.5 py-1.5 rounded border border-amber-700/50 text-amber-300 hover:bg-amber-950/30"
                        >
                          Exportar README integracion
                        </button>
                        <button
                          onClick={() => handleExportResolverPatch(draft)}
                          className="text-[11px] px-2.5 py-1.5 rounded border border-indigo-700/50 text-indigo-300 hover:bg-indigo-950/30"
                        >
                          Exportar resolver.patch
                        </button>
                        <button
                          onClick={() => handleExportDbTypesPatch(draft)}
                          className="text-[11px] px-2.5 py-1.5 rounded border border-fuchsia-700/50 text-fuchsia-300 hover:bg-fuchsia-950/30"
                        >
                          Exportar db-types.patch
                        </button>
                        <button
                          onClick={() => handleExportDraftBundle(draft)}
                          className="text-[11px] px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white"
                        >
                          Exportar paquete completo
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {tab === 'plantillas' && (
          <section className="print-card rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Biblioteca de plantillas</h2>
            <p className="text-xs text-slate-500">
              Incluye plantillas base digitalizadas y formularios personalizados guardados.
            </p>

            <div className="max-h-[520px] overflow-auto space-y-2 pr-1">
              {allTemplates.map((tpl) => (
                <article key={tpl.id} className="print-card rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-slate-100">{tpl.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className="no-print text-[11px] px-2 py-1 rounded border border-cyan-700/50 text-cyan-300 hover:bg-cyan-950/30"
                      >
                        Abrir
                      </button>
                      <Badge>{tpl.kind}</Badge>
                      {tpl.isBuiltIn ? <Badge>base</Badge> : <Badge>custom</Badge>}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">{tpl.description}</p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {tpl.techniqueIds.length > 0 ? (
                      tpl.techniqueIds.map((id) => <Badge key={`${tpl.id}:${id}`}>{id}</Badge>)
                    ) : (
                      <Badge>sin tecnica asociada</Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2">Campos: {tpl.fields.length}</p>

                  {!tpl.isBuiltIn && (
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="no-print text-[11px] text-rose-400 hover:text-rose-300 mt-2"
                    >
                      Eliminar plantilla
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'formularios' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="no-print rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Constructor de formulario</h2>
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nombre del formulario"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              <select
                value={newTemplateKind}
                onChange={(e) => setNewTemplateKind(e.target.value as TemplateKind)}
                aria-label="Tipo de plantilla"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <option value="formulario">Formulario</option>
                <option value="cuestionario">Cuestionario</option>
                <option value="registro">Registro</option>
                <option value="inventario">Inventario</option>
              </select>
              <input
                value={newTemplateTechniques}
                onChange={(e) => setNewTemplateTechniques(e.target.value)}
                placeholder="Tecnicas relacionadas (separadas por coma)"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />
              <textarea
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Descripcion de uso clinico"
                className="w-full min-h-24 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
              />

              <div className="border border-slate-800 rounded-lg p-3 space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Agregar campo</p>
                <input
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Etiqueta del campo"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as FormFieldType)}
                    aria-label="Tipo de campo"
                    className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="text">Texto corto</option>
                    <option value="textarea">Texto largo</option>
                    <option value="number">Numero</option>
                    <option value="likert_1_5">Escala 1-5</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="date">Fecha</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                    />
                    Campo obligatorio
                  </label>
                </div>
                <button
                  onClick={handleAddField}
                  className="text-xs px-3 py-2 rounded bg-blue-700 hover:bg-blue-600"
                >
                  Agregar campo
                </button>
              </div>

              <button
                onClick={handleSaveTemplate}
                className="text-xs px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600"
              >
                Guardar como plantilla
              </button>
            </article>

            <article className="print-card rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Vista previa del formulario</h2>
              {builderFields.length === 0 ? (
                <p className="text-xs text-slate-500">Aun no agregaste campos.</p>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-auto pr-1">
                  {builderFields.map((field) => (
                    <div key={field.id} className="rounded border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-slate-100">{field.label}</p>
                        <button
                          onClick={() => handleRemoveField(field.id)}
                          className="no-print text-[11px] text-rose-400 hover:text-rose-300"
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="mt-1 flex gap-1">
                        <Badge>{field.type}</Badge>
                        {field.required ? <Badge>obligatorio</Badge> : <Badge>opcional</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        )}

        {/* ── 5ᵃ tab: Áreas KB ── */}
        {tab === 'areas' && (
          <section className="print-card rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: '60vh' }}>
              {/* Selector izquierdo: técnica + área */}
              <div className="w-full lg:w-[420px] flex-shrink-0">
                <KBAreaBrowser
                  selectedTechnique={selectedKBTechnique}
                  selectedArea={selectedKBArea}
                  onSelectTechnique={(id) => {
                    setSelectedKBTechnique(id);
                    setSelectedKBArea(null);
                  }}
                  onSelectArea={(techId, area) => {
                    setSelectedKBTechnique(techId);
                    setSelectedKBArea(area);
                  }}
                />
              </div>

              {/* Visor derecho: contenido del área seleccionada */}
              <div className="flex-1 min-w-0">
                {selectedKBTechnique && selectedKBArea ? (
                  <KBAreaDataViewer
                    techniqueId={selectedKBTechnique}
                    area={selectedKBArea}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    <p>Selecciona una técnica y un área para ver su contenido.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {tab === 'plantillas' && selectedTemplate && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
            <div
              className="absolute inset-0"
              onClick={handleCloseTemplateModal}
              aria-hidden="true"
            />

            <article
              role="dialog"
              aria-modal="true"
              aria-label="Detalle de plantilla"
              className="relative z-10 w-full max-w-3xl max-h-[88vh] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Plantilla: {selectedTemplate.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    {Math.max(1, allTemplates.findIndex((tpl) => tpl.id === selectedTemplate.id) + 1)} / {allTemplates.length}
                  </span>
                  <button
                    onClick={() => handleMoveTemplate(-1)}
                    className="text-xs px-2.5 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                    aria-label="Plantilla anterior"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handleMoveTemplate(1)}
                    className="text-xs px-2.5 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                    aria-label="Plantilla siguiente"
                  >
                    Siguiente
                  </button>
                  <Badge>{selectedTemplate.kind}</Badge>
                  {selectedTemplate.isBuiltIn ? <Badge>base</Badge> : <Badge>custom</Badge>}
                  <button
                    onClick={handleCloseTemplateModal}
                    className="text-xs px-2.5 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p><span className="text-slate-500">Descripcion:</span> {selectedTemplate.description}</p>
                <p>
                  <span className="text-slate-500">Tecnicas relacionadas:</span>{' '}
                  {selectedTemplate.techniqueIds.length > 0 ? selectedTemplate.techniqueIds.join(', ') : 'Sin tecnica asociada'}
                </p>
                <p><span className="text-slate-500">Total de campos:</span> {selectedTemplate.fields.length}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Campos de la plantilla</p>
                <div className="space-y-2">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.id} className="rounded border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-slate-100">{field.label}</p>
                        <div className="flex items-center gap-1">
                          <Badge>{field.type}</Badge>
                          {field.required ? <Badge>obligatorio</Badge> : <Badge>opcional</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        )}
      </main>
    </div>
  );
}
