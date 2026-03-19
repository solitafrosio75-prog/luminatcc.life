# Plan: Sistema de Base de Conocimiento Multi-Técnica v3.0

## Resumen Ejecutivo

Rediseñar `src/knowledge/` como infraestructura genérica donde **cada técnica terapéutica** (AC, TCC, DBT, etc.) sigue una **plantilla homogénea de 13 áreas**, con un directorio `shared/` para conocimiento transversal y un script de población automatizado.

**Decisión arquitectónica: JSON + Vite dynamic `import()`** (no Dexie) porque:
- Datos estáticos de referencia (solo lectura)
- Vite auto-genera chunks separados por cada `import('./data/X.json')`
- Control de versiones natural con git
- Zod valida en tiempo de carga
- Zustand cachea reactivamente
- Carga bajo demanda: solo lo que la feature necesita

---

## 1. Estructura de Directorios

```
src/knowledge/
├── types/
│   ├── areas.types.ts          ← Interfaces para las 13 áreas
│   ├── technique.types.ts      ← TechniqueManifest, TechniqueId, enums
│   ├── shared.types.ts         ← Tipos para shared/
│   ├── schemas.ts              ← Esquemas Zod para validación runtime
│   └── index.ts                ← Barrel exports
│
├── shared/                     ← Conocimiento transversal
│   ├── data/
│   │   ├── habilidades_entrevista.json
│   │   ├── protocolo_crisis.json
│   │   └── inventarios_generales.json
│   ├── shared.manifest.ts      ← Manifest de áreas shared
│   └── index.ts
│
├── ac/                         ← Activación Conductual
│   ├── data/
│   │   ├── area_01_conocimiento.json
│   │   ├── area_02_objetivos_clinicos.json
│   │   ├── area_03_herramientas_evaluacion.json
│   │   ├── area_04_ejercicios_tareas.json
│   │   ├── area_05_recursos_materiales.json
│   │   ├── area_06_tecnicas_especificas.json
│   │   ├── area_07_estructura_sesiones.json
│   │   ├── area_08_valores_objetivos.json
│   │   ├── area_09_barreras.json
│   │   ├── area_10_habilidades_terapeuta.json
│   │   ├── area_11_areas_vitales.json
│   │   ├── area_12_sintomas_problemas.json
│   │   └── area_13_actividades_por_problema.json
│   ├── ac.manifest.ts          ← Manifest: metadata + 13 lazy loaders
│   └── index.ts
│
├── loaders/
│   ├── knowledge.store.ts      ← Zustand store genérico (multi-técnica)
│   ├── knowledge-loader.ts     ← Loader con caché + dedup + validación Zod
│   └── useKnowledge.ts         ← React hooks genéricos
│
├── preloads.ts                 ← Perfiles de precarga nombrados
├── registry.ts                 ← Registry de todas las técnicas
└── index.ts                    ← API pública
```

**Para agregar una nueva técnica** (ej: TCC general):
1. Crear `src/knowledge/tcc/data/` con 13 JSON siguiendo la plantilla
2. Crear `src/knowledge/tcc/tcc.manifest.ts`
3. Registrar en `registry.ts`
4. Listo — los hooks y store ya funcionan

---

## 2. Enums y Tipos Base

### `types/technique.types.ts`

```typescript
// IDs de técnicas terapéuticas
export type TechniqueId = 'ac' | 'tcc' | 'dbt'; // extender al agregar

// Las 13 áreas estándar (plantilla universal)
export enum KBArea {
  CONOCIMIENTO             = 'area_01_conocimiento',
  OBJETIVOS_CLINICOS       = 'area_02_objetivos_clinicos',
  HERRAMIENTAS_EVALUACION  = 'area_03_herramientas_evaluacion',
  EJERCICIOS_TAREAS        = 'area_04_ejercicios_tareas',
  RECURSOS_MATERIALES      = 'area_05_recursos_materiales',
  TECNICAS_ESPECIFICAS     = 'area_06_tecnicas_especificas',
  ESTRUCTURA_SESIONES      = 'area_07_estructura_sesiones',
  VALORES_OBJETIVOS        = 'area_08_valores_objetivos',
  BARRERAS                 = 'area_09_barreras',
  HABILIDADES_TERAPEUTA    = 'area_10_habilidades_terapeuta',
  AREAS_VITALES            = 'area_11_areas_vitales',
  SINTOMAS_PROBLEMAS       = 'area_12_sintomas_problemas',
  ACTIVIDADES_POR_PROBLEMA = 'area_13_actividades_por_problema',
}

// Áreas del directorio shared/
export enum SharedArea {
  HABILIDADES_ENTREVISTA = 'habilidades_entrevista',
  PROTOCOLO_CRISIS       = 'protocolo_crisis',
  INVENTARIOS_GENERALES  = 'inventarios_generales',
}

// Manifest que cada técnica debe implementar
export interface TechniqueManifest {
  id: TechniqueId;
  nombre: string;
  descripcion: string;
  version: string;
  fuentes_principales: string[];
  areas: Record<KBArea, () => Promise<{ default: AreaData }>>;
}

// Slot de caché en el store
export interface AreaSlot<T = AreaData> {
  data: T | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
  loadedAt: number | null;
}
```

---

## 3. Interfaces de las 13 Áreas

### `types/areas.types.ts`

Cada área tiene una interfaz tipada. Todas comparten `BaseAreaData` para campos comunes:

```typescript
// ── Base común ──
export interface BaseAreaData {
  area_id: KBArea;
  nombre: string;
  descripcion: string;
  fuentes: string[];  // Referencias bibliográficas
}

// ── Área 01: Conocimiento ──
export interface ConocimientoData extends BaseAreaData {
  area_id: KBArea.CONOCIMIENTO;
  fundamentos_teoricos: {
    definicion: string;
    origenes_historicos: { autor: string; aportacion: string }[];
    modelo_explicativo: string;
    mecanismo_de_cambio: string;
  };
  principios_clave: { principio: string; explicacion: string }[];
  evidencia_cientifica: {
    metaanalisis: string[];
    eficacia_comparativa: string;
    poblaciones_estudiadas: string[];
  };
}

// ── Área 02: Objetivos Clínicos ──
export interface ObjetivosClinicosData extends BaseAreaData {
  area_id: KBArea.OBJETIVOS_CLINICOS;
  indicaciones: {
    trastorno: string;
    nivel_evidencia: 'alta' | 'moderada' | 'emergente';
    notas: string;
  }[];
  contraindicaciones: {
    condicion: string;
    razon: string;
    alternativa: string;
  }[];
}

// ── Área 03: Herramientas de Evaluación ──
export interface HerramientasEvaluacionData extends BaseAreaData {
  area_id: KBArea.HERRAMIENTAS_EVALUACION;
  herramientas: {
    id: string;
    nombre: string;
    tipo: 'inventario' | 'registro' | 'escala' | 'formulario';
    proposito: string;
    cuando_usar: string;
    descripcion_formato: string;
    variables?: { nombre: string; tipo: string; instruccion: string }[];
    referencia_shared?: string;  // ← Enlace a inventarios_generales si aplica
  }[];
}

// ── Área 04: Ejercicios y Tareas ──
export interface EjerciciosTareasData extends BaseAreaData {
  area_id: KBArea.EJERCICIOS_TAREAS;
  ejercicios: {
    id: string;
    nombre: string;
    tipo: 'monitoreo' | 'programacion' | 'experimento' | 'tarea_casa';
    objetivo: string;
    instrucciones: string[];
    frecuencia: string;
    ejemplo: string;
  }[];
}

// ── Área 05: Recursos y Materiales ──
export interface RecursosMaterialesData extends BaseAreaData {
  area_id: KBArea.RECURSOS_MATERIALES;
  recursos: {
    id: string;
    tipo: 'manual' | 'formulario' | 'app' | 'libro_autoayuda' | 'audiovisual';
    titulo: string;
    autor: string;
    descripcion: string;
    uso_clinico: string;
  }[];
}

// ── Área 06: Técnicas Específicas ──
export interface TecnicasEspecificasData extends BaseAreaData {
  area_id: KBArea.TECNICAS_ESPECIFICAS;
  tecnicas: {
    id: string;
    nombre: string;
    descripcion: string;
    cuando_usar: string;
    pasos: string[];
    ejemplo_clinico: string;
  }[];
}

// ── Área 07: Estructura de Sesiones ──
export interface EstructuraSesionesData extends BaseAreaData {
  area_id: KBArea.ESTRUCTURA_SESIONES;
  total_sesiones: string;           // "10-12 sesiones"
  frecuencia: string;               // "semanal"
  bloques: {
    nombre: string;
    sesiones: string;               // "1-2"
    objetivos: string[];
    actividades_principales: string[];
  }[];
}

// ── Área 08: Valores y Objetivos ──
export interface ValoresObjetivosData extends BaseAreaData {
  area_id: KBArea.VALORES_OBJETIVOS;
  objetivos_terapeuticos: { objetivo: string; descripcion: string }[];
  valores_nucleares: { valor: string; definicion: string }[];
}

// ── Área 09: Barreras ──
export interface BarrerasData extends BaseAreaData {
  area_id: KBArea.BARRERAS;
  barreras: {
    nombre: string;
    descripcion: string;
    ejemplo_paciente: string;
    estrategia_manejo: string;
  }[];
}

// ── Área 10: Habilidades del Terapeuta ──
export interface HabilidadesTerapeutaData extends BaseAreaData {
  area_id: KBArea.HABILIDADES_TERAPEUTA;
  habilidades: {
    nombre: string;
    descripcion: string;
    importancia: string;
    como_desarrollar: string;
  }[];
}

// ── Área 11: Áreas Vitales ──
export interface AreasVitalesData extends BaseAreaData {
  area_id: KBArea.AREAS_VITALES;
  areas_vitales: {
    nombre: string;
    descripcion: string;
    actividades_ejemplo: string[];
  }[];
}

// ── Área 12: Síntomas y Problemas ──
export interface SintomasProblemasData extends BaseAreaData {
  area_id: KBArea.SINTOMAS_PROBLEMAS;
  trastornos: {
    nombre: string;
    sintomas_principales: string[];
    como_se_manifiesta_en_conducta: string;
    foco_intervencion: string;
  }[];
}

// ── Área 13: Actividades por Problema ──
export interface ActividadesPorProblemaData extends BaseAreaData {
  area_id: KBArea.ACTIVIDADES_POR_PROBLEMA;
  problemas: {
    nombre: string;
    principios_intervencion: string[];
    actividades: {
      nombre: string;
      descripcion: string;
      justificacion: string;
      jerarquia: { nivel: number; actividad: string; dificultad: number }[];
    }[];
  }[];
}

// ── Discriminated Union ──
export type AreaData =
  | ConocimientoData
  | ObjetivosClinicosData
  | HerramientasEvaluacionData
  | EjerciciosTareasData
  | RecursosMaterialesData
  | TecnicasEspecificasData
  | EstructuraSesionesData
  | ValoresObjetivosData
  | BarrerasData
  | HabilidadesTerapeutaData
  | AreasVitalesData
  | SintomasProblemasData
  | ActividadesPorProblemaData;

// ── Type-safe map: dado un KBArea, retorna su tipo exacto ──
export interface AreaDataMap {
  [KBArea.CONOCIMIENTO]:             ConocimientoData;
  [KBArea.OBJETIVOS_CLINICOS]:       ObjetivosClinicosData;
  [KBArea.HERRAMIENTAS_EVALUACION]:  HerramientasEvaluacionData;
  [KBArea.EJERCICIOS_TAREAS]:        EjerciciosTareasData;
  [KBArea.RECURSOS_MATERIALES]:      RecursosMaterialesData;
  [KBArea.TECNICAS_ESPECIFICAS]:     TecnicasEspecificasData;
  [KBArea.ESTRUCTURA_SESIONES]:      EstructuraSesionesData;
  [KBArea.VALORES_OBJETIVOS]:        ValoresObjetivosData;
  [KBArea.BARRERAS]:                 BarrerasData;
  [KBArea.HABILIDADES_TERAPEUTA]:    HabilidadesTerapeutaData;
  [KBArea.AREAS_VITALES]:            AreasVitalesData;
  [KBArea.SINTOMAS_PROBLEMAS]:       SintomasProblemasData;
  [KBArea.ACTIVIDADES_POR_PROBLEMA]: ActividadesPorProblemaData;
}
```

---

## 4. Manifest de AC (Ejemplo de Técnica)

### `ac/ac.manifest.ts`

```typescript
import { KBArea, type TechniqueManifest } from '../types';

export const AC_MANIFEST: TechniqueManifest = {
  id: 'ac',
  nombre: 'Activación Conductual',
  descripcion: 'Tratamiento estructurado para depresión basado en aumento de reforzamiento positivo',
  version: '3.0.0',
  fuentes_principales: [
    'Martell, Dimidjian & Herman-Dunn (2010)',
    'Lejuez, Hopko & Hopko (2001)',
    'Lewinsohn (1974)',
    'Barraca & Pérez-Álvarez (2015)',
  ],
  areas: {
    [KBArea.CONOCIMIENTO]:             () => import('./data/area_01_conocimiento.json'),
    [KBArea.OBJETIVOS_CLINICOS]:       () => import('./data/area_02_objetivos_clinicos.json'),
    [KBArea.HERRAMIENTAS_EVALUACION]:  () => import('./data/area_03_herramientas_evaluacion.json'),
    [KBArea.EJERCICIOS_TAREAS]:        () => import('./data/area_04_ejercicios_tareas.json'),
    [KBArea.RECURSOS_MATERIALES]:      () => import('./data/area_05_recursos_materiales.json'),
    [KBArea.TECNICAS_ESPECIFICAS]:     () => import('./data/area_06_tecnicas_especificas.json'),
    [KBArea.ESTRUCTURA_SESIONES]:      () => import('./data/area_07_estructura_sesiones.json'),
    [KBArea.VALORES_OBJETIVOS]:        () => import('./data/area_08_valores_objetivos.json'),
    [KBArea.BARRERAS]:                 () => import('./data/area_09_barreras.json'),
    [KBArea.HABILIDADES_TERAPEUTA]:    () => import('./data/area_10_habilidades_terapeuta.json'),
    [KBArea.AREAS_VITALES]:            () => import('./data/area_11_areas_vitales.json'),
    [KBArea.SINTOMAS_PROBLEMAS]:       () => import('./data/area_12_sintomas_problemas.json'),
    [KBArea.ACTIVIDADES_POR_PROBLEMA]: () => import('./data/area_13_actividades_por_problema.json'),
  },
};
```

Cada `import()` genera un chunk separado en build. Vite produce:
```
dist/assets/area_01_conocimiento-abc123.js   (~8KB)
dist/assets/area_02_objetivos_clinicos-def456.js  (~3KB)
...
```

---

## 5. Zustand Store Genérico

### `loaders/knowledge.store.ts`

```typescript
// Store de dos niveles: Record<TechniqueId, Record<KBArea, AreaSlot>>
// Una sola instancia maneja TODAS las técnicas

interface KnowledgeState {
  // Cache bidimensional: técnica → área → slot
  slots: Record<string, Record<string, AreaSlot>>;

  // Shared areas
  sharedSlots: Record<string, AreaSlot>;

  // Acciones
  loadArea: (techniqueId: TechniqueId, area: KBArea) => Promise<void>;
  loadAreas: (techniqueId: TechniqueId, areas: KBArea[]) => Promise<void>;
  loadShared: (area: SharedArea) => Promise<void>;
  invalidate: (techniqueId: TechniqueId, area?: KBArea) => void;
  invalidateAll: () => void;

  // Selectores
  getSlot: (techniqueId: TechniqueId, area: KBArea) => AreaSlot;
  getSharedSlot: (area: SharedArea) => AreaSlot;
}
```

**Características clave:**
- **Deduplicación**: si un área ya está `loading`, no lanza otra request
- **Caché en memoria**: una vez loaded, no recarga (hasta `invalidate`)
- **Validación Zod**: al cargar, valida contra el schema correspondiente
- **Error boundaries**: errores capturados por slot, no crashean la app

---

## 6. React Hooks

### `loaders/useKnowledge.ts`

```typescript
// ── Hook principal: un área de una técnica ──
function useKnowledgeArea<A extends KBArea>(
  techniqueId: TechniqueId,
  area: A
): {
  data: AreaDataMap[A] | null;
  isLoading: boolean;
  error: string | null;
}

// ── Múltiples áreas ──
function useKnowledgeAreas(
  techniqueId: TechniqueId,
  areas: KBArea[]
): {
  data: Partial<Record<KBArea, AreaData>>;
  isLoading: boolean;
  allLoaded: boolean;
  errors: Partial<Record<KBArea, string>>;
}

// ── Conocimiento compartido ──
function useSharedKnowledge(area: SharedArea): {
  data: SharedAreaData | null;
  isLoading: boolean;
  error: string | null;
}

// ── Precarga en background (no bloquea render) ──
function useKnowledgePreload(
  techniqueId: TechniqueId,
  areas: KBArea[]
): void
```

**Uso en componentes:**
```typescript
// Feature sabe qué técnica y qué áreas necesita
const { data: ejercicios } = useKnowledgeArea('ac', KBArea.EJERCICIOS_TAREAS);
const { data: crisis } = useSharedKnowledge(SharedArea.PROTOCOLO_CRISIS);
```

---

## 7. Perfiles de Precarga

### `preloads.ts`

```typescript
// Perfiles por contexto clínico (agnósticos a la técnica)
export const PRELOAD_INTERVIEW: KBArea[] = [
  KBArea.HABILIDADES_TERAPEUTA,
  KBArea.HERRAMIENTAS_EVALUACION,
  KBArea.SINTOMAS_PROBLEMAS,
];

export const PRELOAD_PSYCHOEDUCATION: KBArea[] = [
  KBArea.CONOCIMIENTO,
  KBArea.RECURSOS_MATERIALES,
  KBArea.VALORES_OBJETIVOS,
];

export const PRELOAD_ACTIVITY_PLANNING: KBArea[] = [
  KBArea.EJERCICIOS_TAREAS,
  KBArea.TECNICAS_ESPECIFICAS,
  KBArea.ACTIVIDADES_POR_PROBLEMA,
  KBArea.AREAS_VITALES,
];

export const PRELOAD_ASSESSMENT: KBArea[] = [
  KBArea.HERRAMIENTAS_EVALUACION,
  KBArea.SINTOMAS_PROBLEMAS,
];

export const PRELOAD_SESSION_FULL: KBArea[] = [
  KBArea.ESTRUCTURA_SESIONES,
  KBArea.BARRERAS,
  KBArea.HABILIDADES_TERAPEUTA,
  KBArea.TECNICAS_ESPECIFICAS,
];

export const PRELOAD_ALL: KBArea[] = Object.values(KBArea);
```

---

## 8. Shared Knowledge

### `shared/shared.manifest.ts`

```typescript
export const SHARED_MANIFEST = {
  [SharedArea.HABILIDADES_ENTREVISTA]: () => import('./data/habilidades_entrevista.json'),
  [SharedArea.PROTOCOLO_CRISIS]:       () => import('./data/protocolo_crisis.json'),
  [SharedArea.INVENTARIOS_GENERALES]:  () => import('./data/inventarios_generales.json'),
};
```

Los inventarios generales (BDI-II, BAI, etc.) viven en shared. Las herramientas de evaluación de cada técnica los **referencian** con `referencia_shared: 'inventarios_generales'`:

```json
{
  "id": "HE03",
  "nombre": "Inventario de Depresión de Beck (BDI-II)",
  "tipo": "inventario",
  "referencia_shared": "inventarios_generales",
  "...": "..."
}
```

---

## 9. Script de Población

### `scripts/populate-kb.ts`

Script Node.js que:
1. Lee archivos markdown/texto de input organizados por técnica y área
2. Los parsea en la estructura JSON de las 13 áreas
3. Valida contra schemas Zod
4. Genera los JSON en la carpeta correcta

```
scripts/
├── populate-kb.ts           ← Script principal
├── templates/               ← Plantillas JSON vacías para cada área
│   ├── area_01_conocimiento.template.json
│   ├── area_02_objetivos_clinicos.template.json
│   └── ... (13 templates)
└── input/                   ← Contenido fuente por técnica
    ├── ac/
    │   ├── area_01.md
    │   └── ...
    └── tcc/
        ├── area_01.md
        └── ...
```

**Ejecución:**
```bash
# Poblar una técnica completa
npx tsx scripts/populate-kb.ts --technique ac --all

# Poblar una sola área
npx tsx scripts/populate-kb.ts --technique ac --area area_01_conocimiento

# Validar sin escribir
npx tsx scripts/populate-kb.ts --technique ac --validate-only

# Generar templates vacíos para nueva técnica
npx tsx scripts/populate-kb.ts --init tcc
```

---

## 10. Diferencias vs. Sistema Anterior (v2)

| Aspecto | v2 (Anterior) | v3 (Nuevo) |
|---------|-------------|-------------|
| Áreas | 8 + 5 vitales = 13 archivos ad-hoc | 13 áreas estándar (plantilla) |
| Técnicas | Solo AC (hardcoded) | Multi-técnica genérico |
| Loader | `fetch('/knowledge/ac/data/X.json')` runtime | `import('./data/X.json')` Vite (code-split) |
| Types | `ACKnowledgeData = { [key: string]: any }` | Discriminated union type-safe |
| Store | AC-specific (`useACKnowledgeStore`) | Genérico bidimensional |
| Hooks | `useACKnowledgeSingle(area)` | `useKnowledgeArea(technique, area)` |
| Shared | No existía | `shared/` con inventarios generales, crisis |
| Validación | Ninguna | Zod schemas en carga |
| Script | No existía | `populate-kb.ts` con templates |

---

## 11. Orden de Implementación

### Fase 1: Infraestructura de tipos (sin datos)
1. `src/knowledge/types/technique.types.ts` — Enums, TechniqueManifest, AreaSlot
2. `src/knowledge/types/areas.types.ts` — 13 interfaces + BaseAreaData + AreaDataMap
3. `src/knowledge/types/shared.types.ts` — Tipos shared
4. `src/knowledge/types/schemas.ts` — Schemas Zod
5. `src/knowledge/types/index.ts` — Barrel

### Fase 2: Loader genérico + Store + Hooks
6. `src/knowledge/loaders/knowledge-loader.ts` — Loader con caché/dedup
7. `src/knowledge/loaders/knowledge.store.ts` — Zustand bidimensional
8. `src/knowledge/loaders/useKnowledge.ts` — 4 hooks
9. `src/knowledge/preloads.ts` — Perfiles de precarga

### Fase 3: Registry + Manifests
10. `src/knowledge/registry.ts` — Registry multi-técnica
11. `src/knowledge/ac/ac.manifest.ts` — Manifest de AC
12. `src/knowledge/shared/shared.manifest.ts` — Manifest shared
13. `src/knowledge/index.ts` — API pública

### Fase 4: Datos JSON de AC (13 archivos)
14. Migrar/reescribir los 8 JSON originales al nuevo schema de 13 áreas
15. Crear los 5 JSON faltantes (áreas 2, 9, 12 son nuevas)
16. Crear 3 JSON de shared/

### Fase 5: Script de población
17. `scripts/populate-kb.ts` — Script + templates
18. `scripts/templates/` — 13 templates vacíos

### Fase 6: Integración
19. Actualizar `src/features/therapist/` para usar los nuevos hooks
20. Verificar build (`npm run build`) y type-check (`npx tsc --noEmit`)
