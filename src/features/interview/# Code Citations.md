# Code Citations

## License: MIT
https://github.com/mrozilla/gatsby-starter-apollo-lambda/blob/020e1f794e59449ebb432f53cfdb96522fee49cb/src/pages/app.js

```
Bien, `ds` ya está en `TechniqueId`. Ahora tengo todo el contexto. Voy a construir el script completo. Necesito instalar el SDK de Anthropic:Estoy en modo Ask (solo lectura), no puedo ejecutar comandos ni crear archivos. Te doy el script completo para que lo implementes:

---

**Paso 1**: Instalar el SDK de Anthropic:
```powershell
cd C:\Users\Sol\Desktop\tcc-lab
npm install @anthropic-ai/sdk
```

**Paso 2**: Crear la carpeta y el script:

```powershell
mkdir scripts\generate-kb
```

**Paso 3**: Crear `scripts/generate-kb/index.ts`:

```typescript
/**
 * generate-kb/index.ts — Pipeline: PDFs → texto → Claude → JSONs validados con Zod
 *
 * Uso:
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *   npx tsx scripts/generate-kb/index.ts --technique ds --biblio-dir "C:/Users/Sol/Desktop/biblioteca"
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  conocimientoSchema,
  objetivosClinicosSchema,
  herramientasEvaluacionSchema,
  ejerciciosTareasSchema,
  recursosMaterialesSchema,
  tecnicasEspecificasSchema,
  estructuraSesionesSchema,
  barrerasSchema,
  habilidadesTerapeutaSchema,
  sintomasProblemasSchema,
} from '../../src/knowledge/types/schemas.js';

// ── Config ───────────────────────────────────────────────────────────────────

const TECHNIQUE_META: Record<string, {
  nombre: string;
  descripcion: string;
  fuentes_principales: string[];
  pdfPatterns: string[];        // substrings para filtrar PDFs relevantes
  specificAreas: SpecificAreaConfig[];
}> = {
  ds: {
    nombre: 'Desensibilización Sistemática',
    descripcion: 'Técnica de contra-condicionamiento basada en inhibición recíproca (Wolpe): emparejamiento de relajación progresiva con exposición imaginaria graduada a estímulos ansiógenos',
    fuentes_principales: [
      'Wolpe, J. (1958). Psychotherapy by Reciprocal Inhibition',
      'Wolpe, J. (1973). The Practice of Behavior Therapy',
      'Jacobson, E. (1938). Progressive Relaxation',
      'Labrador, F. J. (2008). Técnicas de modificación de conducta',
      'Caballo, V. E. (2007). Manual de técnicas de terapia y modificación de conducta',
    ],
    pdfPatterns: [
      'wolpe', 'inhibicion reciproca', 'relajacion', 'jacobson',
      'tecnicas de modificacion de conducta', 'tecnicas de conducta',
      'labrador', 'caballo', 'modificacion de conducta',
    ],
    specificAreas: [
      {
        areaId: 'ds_jerarquia_ansiedad',
        enumValue: 'DS_JERARQUIA_ANSIEDAD',
        label: 'Jerarquía de Ansiedad (DS)',
        schema: z.object({
          area_id: z.literal('ds_jerarquia_ansiedad'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          construccion: z.object({
            definicion: z.string(),
            escala: z.string(),
            reglas: z.array(z.string()),
            pasos: z.array(z.string()),
          }),
          ejemplos_jerarquias: z.array(z.object({
            fobia: z.string(),
            items: z.array(z.object({
              nivel: z.number(),
              descripcion: z.string(),
              usa: z.number(),
            })),
          })),
        }),
        prompt: `Genera datos sobre la CONSTRUCCIÓN DE JERARQUÍAS DE ANSIEDAD en DS:
          - Definición y propósito de la jerarquía
          - Escala USA (Unidades Subjetivas de Ansiedad, 0-100)  
          - Reglas: saltos máximos de 10-15 USA, mínimo 10 ítems, incluir ítem neutro
          - Pasos para construir una jerarquía con el paciente
          - 2-3 ejemplos completos de jerarquías (fobia social, agorafobia, fobia específica) con 7-10 ítems cada una`,
      },
      {
        areaId: 'ds_relajacion',
        enumValue: 'DS_RELAJACION',
        label: 'Protocolo de Relajación (DS)',
        schema: z.object({
          area_id: z.literal('ds_relajacion'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          protocolo_jacobson: z.object({
            descripcion: z.string(),
            grupos_musculares: z.array(z.object({
              grupo: z.string(),
              instruccion_tension: z.string(),
              duracion_tension_seg: z.number(),
              instruccion_distension: z.string(),
              duracion_distension_seg: z.number(),
            })),
            criterio_dominio: z.string(),
          }),
          respuestas_alternativas: z.array(z.object({
            nombre: z.string(),
            descripcion: z.string(),
            cuando_usar: z.string(),
          })),
        }),
        prompt: `Genera datos sobre el PROTOCOLO DE RELAJACIÓN para DS:
          - Relajación Progresiva de Jacobson: los 16 grupos musculares con instrucciones exactas
            de tensión (qué hacer, cuántos segundos) y distensión (cuántos segundos)
          - Criterio de dominio: relajación profunda en menos de 5 minutos
          - Respuestas incompatibles alternativas: respiración diafragmática, visualización, hipnosis ligera`,
      },
      {
        areaId: 'ds_proceso_desensibilizacion',
        enumValue: 'DS_PROCESO_DESENSIBILIZACION',
        label: 'Proceso de Desensibilización (DS)',
        schema: z.object({
          area_id: z.literal('ds_proceso_desensibilizacion'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          protocolo_sesion: z.object({
            fases: z.array(z.object({
              fase: z.string(),
              duracion: z.string(),
              instrucciones: z.array(z.string()),
            })),
            criterio_superacion_item: z.string(),
            manejo_ansiedad: z.object({
              senal_paciente: z.string(),
              procedimiento_terapeuta: z.array(z.string()),
            }),
          }),
          inmersion_sensorial: z.object({
            canales: z.array(z.object({
              canal: z.string(),
              descripcion: z.string(),
              ejemplo_guion: z.string(),
            })),
          }),
          variantes: z.array(z.object({
            nombre: z.string(),
            descripcion: z.string(),
            indicaciones: z.string(),
          })),
        }),
        prompt: `Genera datos sobre el PROCESO DE DESENSIBILIZACIÓN en sesión:
          - Fases de la sesión de DS: inducción relajación, presentación ítem, evaluación, avance/retroceso
          - Criterio de superación: imaginarlo 2-3 veces sin ansiedad
          - Manejo cuando el paciente señala ansiedad: cortar imagen, volver a relajación, retroceder
          - Inmersión sensorial: canales visual, auditivo, táctil, olfativo con ejemplo de guion
          - Variantes: DS in vivo, DS en grupo, DS automatizada, DS con RV`,
      },
    ],
  },
};

interface SpecificAreaConfig {
  areaId: string;
  enumValue: string;
  label: string;
  schema: z.ZodType;
  prompt: string;
}

// ── Shared area configs ─────────────────────────────────────────────────────

const SHARED_AREA_CONFIGS: {
  areaId: string;
  filename: string;
  schema: z.ZodType;
  prompt: string;
}[] = [
  {
    areaId: 'conocimiento', filename: 'conocimiento.json',
    schema: conocimientoSchema,
    prompt: `Extrae de la bibliografía los FUNDAMENTOS TEÓRICOS de esta técnica:
      - Definición precisa, base teórica, mecanismo principal
      - Orígenes históricos: autor real, año real, aportación verificable (3-6 hitos)
      - Modelo explicativo: cómo la técnica explica el problema que trata
      - Mecanismo de cambio: cómo produce el cambio terapéutico
      - 4-6 principios clave (conceptos técnicos, no genéricos)
      - Evidencia: 2-4 metaanálisis reales con hallazgos concretos
      - Eficacia comparativa y poblaciones estudiadas`,
  },
  {
    areaId: 'objetivos_clinicos', filename: 'objetivos_clinicos.json',
    schema: objetivosClinicosSchema,
    prompt: `Extrae INDICACIONES y CONTRAINDICACIONES:
      - 5-10 indicaciones con trastorno, nivel de evidencia (alta/moderada/emergente), notas clínicas
      - 3-6 contraindicaciones con condición, razón del riesgo, alternativa terapéutica`,
  },
  {
    areaId: 'herramientas_evaluacion', filename: 'herramientas_evaluacion.json',
    schema: herramientasEvaluacionSchema,
    prompt: `Extrae HERRAMIENTAS DE EVALUACIÓN usadas con esta técnica:
      - 4-8 instrumentos con id (prefijo HE + secuencial), nombre, tipo, propósito
      - Cuándo usar, formato, variables si aplica
      - Para instrumentos genéricos usar referencia_shared`,
  },
  {
    areaId: 'ejercicios_tareas', filename: 'ejercicios_tareas.json',
    schema: ejerciciosTareasSchema,
    prompt: `Extrae EJERCICIOS Y TAREAS terapéuticas:
      - 4-8 ejercicios con id (prefijo ET + secuencial), nombre, tipo, objetivo
      - Instrucciones paso a paso (4-6 pasos concretos), frecuencia, ejemplo detallado`,
  },
  {
    areaId: 'recursos_materiales', filename: 'recursos_materiales.json',
    schema: recursosMaterialesSchema,
    prompt: `Extrae RECURSOS Y MATERIALES de apoyo:
      - 5-10 recursos con id (prefijo RM + secuencial), tipo, título, autor
      - Descripción y uso clínico concreto`,
  },
  {
    areaId: 'tecnicas_especificas', filename: 'tecnicas_especificas.json',
    schema: tecnicasEspecificasSchema,
    prompt: `Extrae TÉCNICAS ESPECÍFICAS de intervención:
      - 4-8 técnicas con id (prefijo TE + secuencial), nombre, descripción clínica
      - Cuándo usar, pasos procedimentales (4-6), ejemplo/viñeta clínica`,
  },
  {
    areaId: 'estructura_sesiones', filename: 'estructura_sesiones.json',
    schema: estructuraSesionesSchema,
    prompt: `Extrae la ESTRUCTURA DE SESIONES / plan de tratamiento:
      - Total de sesiones (rango), frecuencia
      - 3-5 bloques temáticos cubriendo todo el tratamiento
      - Cada bloque: nombre, rango de sesiones, objetivos (3-5), actividades principales (4-6)`,
  },
  {
    areaId: 'barreras', filename: 'barreras.json',
    schema: barrerasSchema,
    prompt: `Extrae BARRERAS Y OBSTÁCULOS frecuentes:
      - 4-8 barreras con nombre, descripción del mecanismo
      - Ejemplo de frase del paciente (en primera persona, entre comillas)
      - Estrategia de manejo con pasos concretos`,
  },
  {
    areaId: 'habilidades_terapeuta', filename: 'habilidades_terapeuta.json',
    schema: habilidadesTerapeutaSchema,
    prompt: `Extrae HABILIDADES DEL TERAPEUTA necesarias:
      - 4-8 habilidades con nombre, descripción, importancia para ESTA técnica
      - Cómo desarrollar cada habilidad (acciones concretas)`,
  },
  {
    areaId: 'sintomas_problemas', filename: 'sintomas_problemas.json',
    schema: sintomasProblemasSchema,
    prompt: `Extrae SÍNTOMAS Y PROBLEMAS tratables con esta técnica:
      - 2-5 trastornos con nombre, síntomas principales (basados en DSM/CIE)
      - Cómo se manifiesta en conducta observable
      - Foco de intervención con esta técnica`,
  },
];

// ── PDF extraction ──────────────────────────────────────────────────────────

async function extractPDFs(biblioDir: string, patterns: string[]): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  
  // Buscar PDFs recursivamente
  const allPdfs = await findPDFs(biblioDir);
  
  // Filtrar por patterns relevantes
  const relevant = allPdfs.filter((p) => {
    const name = path.basename(p).toLowerCase();
    return patterns.some((pat) => name.includes(pat.toLowerCase()));
  });

  console.log(`\n📚 PDFs relevantes encontrados: ${relevant.length}`);
  relevant.forEach((p) => console.log(`   → ${path.basename(p)}`));

  // Extraer texto
  const texts: string[] = [];
  for (const pdfPath of relevant) {
    try {
      const buffer = await fs.readFile(pdfPath);
      const { text } = await pdfParse(buffer);
      const truncated = text.slice(0, 80_000); // ~20k tokens por PDF
      texts.push(`\n\n=== FUENTE: ${path.basename(pdfPath)} ===\n\n${truncated}`);
      console.log(`   ✓ ${path.basename(pdfPath)} (${text.length} chars → ${truncated.length} usados)`);
    } catch (err) {
      console.warn(`   ✗ Error en ${path.basename(pdfPath)}: ${err}`);
    }
  }

  // Buscar también .txt en documentos/
  const docsDir = path.join(biblioDir, 'bibliografia', 'documentos');
  try {
    const docs = await fs.readdir(docsDir);
    const relevantTxts = docs.filter((d) =>
      d.endsWith('.txt') && patterns.some((p) => d.toLowerCase().includes(p.toLowerCase()))
    );
    for (const txt of relevantTxts) {
      const content = await fs.readFile(path.join(docsDir, txt), 'utf-8');
      texts.push(`\n\n=== DOCUMENTO: ${txt} ===\n\n${content}`);
      console.log(`   ✓ ${txt} (${content.length} chars)`);
    }
  } catch { /* no docs dir */ }

  return texts.join('\n');
}

async function findPDFs(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findPDFs(full));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      results.push(full);
    }
  }
  return results;
}

// ── LLM call ────────────────────────────────────────────────────────────────

const client = new Anthropic();

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-
```


## License: MIT
https://github.com/mrozilla/gatsby-starter-apollo-lambda/blob/020e1f794e59449ebb432f53cfdb96522fee49cb/src/pages/app.js

```
Bien, `ds` ya está en `TechniqueId`. Ahora tengo todo el contexto. Voy a construir el script completo. Necesito instalar el SDK de Anthropic:Estoy en modo Ask (solo lectura), no puedo ejecutar comandos ni crear archivos. Te doy el script completo para que lo implementes:

---

**Paso 1**: Instalar el SDK de Anthropic:
```powershell
cd C:\Users\Sol\Desktop\tcc-lab
npm install @anthropic-ai/sdk
```

**Paso 2**: Crear la carpeta y el script:

```powershell
mkdir scripts\generate-kb
```

**Paso 3**: Crear `scripts/generate-kb/index.ts`:

```typescript
/**
 * generate-kb/index.ts — Pipeline: PDFs → texto → Claude → JSONs validados con Zod
 *
 * Uso:
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *   npx tsx scripts/generate-kb/index.ts --technique ds --biblio-dir "C:/Users/Sol/Desktop/biblioteca"
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  conocimientoSchema,
  objetivosClinicosSchema,
  herramientasEvaluacionSchema,
  ejerciciosTareasSchema,
  recursosMaterialesSchema,
  tecnicasEspecificasSchema,
  estructuraSesionesSchema,
  barrerasSchema,
  habilidadesTerapeutaSchema,
  sintomasProblemasSchema,
} from '../../src/knowledge/types/schemas.js';

// ── Config ───────────────────────────────────────────────────────────────────

const TECHNIQUE_META: Record<string, {
  nombre: string;
  descripcion: string;
  fuentes_principales: string[];
  pdfPatterns: string[];        // substrings para filtrar PDFs relevantes
  specificAreas: SpecificAreaConfig[];
}> = {
  ds: {
    nombre: 'Desensibilización Sistemática',
    descripcion: 'Técnica de contra-condicionamiento basada en inhibición recíproca (Wolpe): emparejamiento de relajación progresiva con exposición imaginaria graduada a estímulos ansiógenos',
    fuentes_principales: [
      'Wolpe, J. (1958). Psychotherapy by Reciprocal Inhibition',
      'Wolpe, J. (1973). The Practice of Behavior Therapy',
      'Jacobson, E. (1938). Progressive Relaxation',
      'Labrador, F. J. (2008). Técnicas de modificación de conducta',
      'Caballo, V. E. (2007). Manual de técnicas de terapia y modificación de conducta',
    ],
    pdfPatterns: [
      'wolpe', 'inhibicion reciproca', 'relajacion', 'jacobson',
      'tecnicas de modificacion de conducta', 'tecnicas de conducta',
      'labrador', 'caballo', 'modificacion de conducta',
    ],
    specificAreas: [
      {
        areaId: 'ds_jerarquia_ansiedad',
        enumValue: 'DS_JERARQUIA_ANSIEDAD',
        label: 'Jerarquía de Ansiedad (DS)',
        schema: z.object({
          area_id: z.literal('ds_jerarquia_ansiedad'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          construccion: z.object({
            definicion: z.string(),
            escala: z.string(),
            reglas: z.array(z.string()),
            pasos: z.array(z.string()),
          }),
          ejemplos_jerarquias: z.array(z.object({
            fobia: z.string(),
            items: z.array(z.object({
              nivel: z.number(),
              descripcion: z.string(),
              usa: z.number(),
            })),
          })),
        }),
        prompt: `Genera datos sobre la CONSTRUCCIÓN DE JERARQUÍAS DE ANSIEDAD en DS:
          - Definición y propósito de la jerarquía
          - Escala USA (Unidades Subjetivas de Ansiedad, 0-100)  
          - Reglas: saltos máximos de 10-15 USA, mínimo 10 ítems, incluir ítem neutro
          - Pasos para construir una jerarquía con el paciente
          - 2-3 ejemplos completos de jerarquías (fobia social, agorafobia, fobia específica) con 7-10 ítems cada una`,
      },
      {
        areaId: 'ds_relajacion',
        enumValue: 'DS_RELAJACION',
        label: 'Protocolo de Relajación (DS)',
        schema: z.object({
          area_id: z.literal('ds_relajacion'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          protocolo_jacobson: z.object({
            descripcion: z.string(),
            grupos_musculares: z.array(z.object({
              grupo: z.string(),
              instruccion_tension: z.string(),
              duracion_tension_seg: z.number(),
              instruccion_distension: z.string(),
              duracion_distension_seg: z.number(),
            })),
            criterio_dominio: z.string(),
          }),
          respuestas_alternativas: z.array(z.object({
            nombre: z.string(),
            descripcion: z.string(),
            cuando_usar: z.string(),
          })),
        }),
        prompt: `Genera datos sobre el PROTOCOLO DE RELAJACIÓN para DS:
          - Relajación Progresiva de Jacobson: los 16 grupos musculares con instrucciones exactas
            de tensión (qué hacer, cuántos segundos) y distensión (cuántos segundos)
          - Criterio de dominio: relajación profunda en menos de 5 minutos
          - Respuestas incompatibles alternativas: respiración diafragmática, visualización, hipnosis ligera`,
      },
      {
        areaId: 'ds_proceso_desensibilizacion',
        enumValue: 'DS_PROCESO_DESENSIBILIZACION',
        label: 'Proceso de Desensibilización (DS)',
        schema: z.object({
          area_id: z.literal('ds_proceso_desensibilizacion'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          protocolo_sesion: z.object({
            fases: z.array(z.object({
              fase: z.string(),
              duracion: z.string(),
              instrucciones: z.array(z.string()),
            })),
            criterio_superacion_item: z.string(),
            manejo_ansiedad: z.object({
              senal_paciente: z.string(),
              procedimiento_terapeuta: z.array(z.string()),
            }),
          }),
          inmersion_sensorial: z.object({
            canales: z.array(z.object({
              canal: z.string(),
              descripcion: z.string(),
              ejemplo_guion: z.string(),
            })),
          }),
          variantes: z.array(z.object({
            nombre: z.string(),
            descripcion: z.string(),
            indicaciones: z.string(),
          })),
        }),
        prompt: `Genera datos sobre el PROCESO DE DESENSIBILIZACIÓN en sesión:
          - Fases de la sesión de DS: inducción relajación, presentación ítem, evaluación, avance/retroceso
          - Criterio de superación: imaginarlo 2-3 veces sin ansiedad
          - Manejo cuando el paciente señala ansiedad: cortar imagen, volver a relajación, retroceder
          - Inmersión sensorial: canales visual, auditivo, táctil, olfativo con ejemplo de guion
          - Variantes: DS in vivo, DS en grupo, DS automatizada, DS con RV`,
      },
    ],
  },
};

interface SpecificAreaConfig {
  areaId: string;
  enumValue: string;
  label: string;
  schema: z.ZodType;
  prompt: string;
}

// ── Shared area configs ─────────────────────────────────────────────────────

const SHARED_AREA_CONFIGS: {
  areaId: string;
  filename: string;
  schema: z.ZodType;
  prompt: string;
}[] = [
  {
    areaId: 'conocimiento', filename: 'conocimiento.json',
    schema: conocimientoSchema,
    prompt: `Extrae de la bibliografía los FUNDAMENTOS TEÓRICOS de esta técnica:
      - Definición precisa, base teórica, mecanismo principal
      - Orígenes históricos: autor real, año real, aportación verificable (3-6 hitos)
      - Modelo explicativo: cómo la técnica explica el problema que trata
      - Mecanismo de cambio: cómo produce el cambio terapéutico
      - 4-6 principios clave (conceptos técnicos, no genéricos)
      - Evidencia: 2-4 metaanálisis reales con hallazgos concretos
      - Eficacia comparativa y poblaciones estudiadas`,
  },
  {
    areaId: 'objetivos_clinicos', filename: 'objetivos_clinicos.json',
    schema: objetivosClinicosSchema,
    prompt: `Extrae INDICACIONES y CONTRAINDICACIONES:
      - 5-10 indicaciones con trastorno, nivel de evidencia (alta/moderada/emergente), notas clínicas
      - 3-6 contraindicaciones con condición, razón del riesgo, alternativa terapéutica`,
  },
  {
    areaId: 'herramientas_evaluacion', filename: 'herramientas_evaluacion.json',
    schema: herramientasEvaluacionSchema,
    prompt: `Extrae HERRAMIENTAS DE EVALUACIÓN usadas con esta técnica:
      - 4-8 instrumentos con id (prefijo HE + secuencial), nombre, tipo, propósito
      - Cuándo usar, formato, variables si aplica
      - Para instrumentos genéricos usar referencia_shared`,
  },
  {
    areaId: 'ejercicios_tareas', filename: 'ejercicios_tareas.json',
    schema: ejerciciosTareasSchema,
    prompt: `Extrae EJERCICIOS Y TAREAS terapéuticas:
      - 4-8 ejercicios con id (prefijo ET + secuencial), nombre, tipo, objetivo
      - Instrucciones paso a paso (4-6 pasos concretos), frecuencia, ejemplo detallado`,
  },
  {
    areaId: 'recursos_materiales', filename: 'recursos_materiales.json',
    schema: recursosMaterialesSchema,
    prompt: `Extrae RECURSOS Y MATERIALES de apoyo:
      - 5-10 recursos con id (prefijo RM + secuencial), tipo, título, autor
      - Descripción y uso clínico concreto`,
  },
  {
    areaId: 'tecnicas_especificas', filename: 'tecnicas_especificas.json',
    schema: tecnicasEspecificasSchema,
    prompt: `Extrae TÉCNICAS ESPECÍFICAS de intervención:
      - 4-8 técnicas con id (prefijo TE + secuencial), nombre, descripción clínica
      - Cuándo usar, pasos procedimentales (4-6), ejemplo/viñeta clínica`,
  },
  {
    areaId: 'estructura_sesiones', filename: 'estructura_sesiones.json',
    schema: estructuraSesionesSchema,
    prompt: `Extrae la ESTRUCTURA DE SESIONES / plan de tratamiento:
      - Total de sesiones (rango), frecuencia
      - 3-5 bloques temáticos cubriendo todo el tratamiento
      - Cada bloque: nombre, rango de sesiones, objetivos (3-5), actividades principales (4-6)`,
  },
  {
    areaId: 'barreras', filename: 'barreras.json',
    schema: barrerasSchema,
    prompt: `Extrae BARRERAS Y OBSTÁCULOS frecuentes:
      - 4-8 barreras con nombre, descripción del mecanismo
      - Ejemplo de frase del paciente (en primera persona, entre comillas)
      - Estrategia de manejo con pasos concretos`,
  },
  {
    areaId: 'habilidades_terapeuta', filename: 'habilidades_terapeuta.json',
    schema: habilidadesTerapeutaSchema,
    prompt: `Extrae HABILIDADES DEL TERAPEUTA necesarias:
      - 4-8 habilidades con nombre, descripción, importancia para ESTA técnica
      - Cómo desarrollar cada habilidad (acciones concretas)`,
  },
  {
    areaId: 'sintomas_problemas', filename: 'sintomas_problemas.json',
    schema: sintomasProblemasSchema,
    prompt: `Extrae SÍNTOMAS Y PROBLEMAS tratables con esta técnica:
      - 2-5 trastornos con nombre, síntomas principales (basados en DSM/CIE)
      - Cómo se manifiesta en conducta observable
      - Foco de intervención con esta técnica`,
  },
];

// ── PDF extraction ──────────────────────────────────────────────────────────

async function extractPDFs(biblioDir: string, patterns: string[]): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  
  // Buscar PDFs recursivamente
  const allPdfs = await findPDFs(biblioDir);
  
  // Filtrar por patterns relevantes
  const relevant = allPdfs.filter((p) => {
    const name = path.basename(p).toLowerCase();
    return patterns.some((pat) => name.includes(pat.toLowerCase()));
  });

  console.log(`\n📚 PDFs relevantes encontrados: ${relevant.length}`);
  relevant.forEach((p) => console.log(`   → ${path.basename(p)}`));

  // Extraer texto
  const texts: string[] = [];
  for (const pdfPath of relevant) {
    try {
      const buffer = await fs.readFile(pdfPath);
      const { text } = await pdfParse(buffer);
      const truncated = text.slice(0, 80_000); // ~20k tokens por PDF
      texts.push(`\n\n=== FUENTE: ${path.basename(pdfPath)} ===\n\n${truncated}`);
      console.log(`   ✓ ${path.basename(pdfPath)} (${text.length} chars → ${truncated.length} usados)`);
    } catch (err) {
      console.warn(`   ✗ Error en ${path.basename(pdfPath)}: ${err}`);
    }
  }

  // Buscar también .txt en documentos/
  const docsDir = path.join(biblioDir, 'bibliografia', 'documentos');
  try {
    const docs = await fs.readdir(docsDir);
    const relevantTxts = docs.filter((d) =>
      d.endsWith('.txt') && patterns.some((p) => d.toLowerCase().includes(p.toLowerCase()))
    );
    for (const txt of relevantTxts) {
      const content = await fs.readFile(path.join(docsDir, txt), 'utf-8');
      texts.push(`\n\n=== DOCUMENTO: ${txt} ===\n\n${content}`);
      console.log(`   ✓ ${txt} (${content.length} chars)`);
    }
  } catch { /* no docs dir */ }

  return texts.join('\n');
}

async function findPDFs(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findPDFs(full));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      results.push(full);
    }
  }
  return results;
}

// ── LLM call ────────────────────────────────────────────────────────────────

const client = new Anthropic();

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-
```


## License: MIT
https://github.com/mrozilla/gatsby-starter-apollo-lambda/blob/020e1f794e59449ebb432f53cfdb96522fee49cb/src/pages/app.js

```
Bien, `ds` ya está en `TechniqueId`. Ahora tengo todo el contexto. Voy a construir el script completo. Necesito instalar el SDK de Anthropic:Estoy en modo Ask (solo lectura), no puedo ejecutar comandos ni crear archivos. Te doy el script completo para que lo implementes:

---

**Paso 1**: Instalar el SDK de Anthropic:
```powershell
cd C:\Users\Sol\Desktop\tcc-lab
npm install @anthropic-ai/sdk
```

**Paso 2**: Crear la carpeta y el script:

```powershell
mkdir scripts\generate-kb
```

**Paso 3**: Crear `scripts/generate-kb/index.ts`:

```typescript
/**
 * generate-kb/index.ts — Pipeline: PDFs → texto → Claude → JSONs validados con Zod
 *
 * Uso:
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *   npx tsx scripts/generate-kb/index.ts --technique ds --biblio-dir "C:/Users/Sol/Desktop/biblioteca"
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  conocimientoSchema,
  objetivosClinicosSchema,
  herramientasEvaluacionSchema,
  ejerciciosTareasSchema,
  recursosMaterialesSchema,
  tecnicasEspecificasSchema,
  estructuraSesionesSchema,
  barrerasSchema,
  habilidadesTerapeutaSchema,
  sintomasProblemasSchema,
} from '../../src/knowledge/types/schemas.js';

// ── Config ───────────────────────────────────────────────────────────────────

const TECHNIQUE_META: Record<string, {
  nombre: string;
  descripcion: string;
  fuentes_principales: string[];
  pdfPatterns: string[];        // substrings para filtrar PDFs relevantes
  specificAreas: SpecificAreaConfig[];
}> = {
  ds: {
    nombre: 'Desensibilización Sistemática',
    descripcion: 'Técnica de contra-condicionamiento basada en inhibición recíproca (Wolpe): emparejamiento de relajación progresiva con exposición imaginaria graduada a estímulos ansiógenos',
    fuentes_principales: [
      'Wolpe, J. (1958). Psychotherapy by Reciprocal Inhibition',
      'Wolpe, J. (1973). The Practice of Behavior Therapy',
      'Jacobson, E. (1938). Progressive Relaxation',
      'Labrador, F. J. (2008). Técnicas de modificación de conducta',
      'Caballo, V. E. (2007). Manual de técnicas de terapia y modificación de conducta',
    ],
    pdfPatterns: [
      'wolpe', 'inhibicion reciproca', 'relajacion', 'jacobson',
      'tecnicas de modificacion de conducta', 'tecnicas de conducta',
      'labrador', 'caballo', 'modificacion de conducta',
    ],
    specificAreas: [
      {
        areaId: 'ds_jerarquia_ansiedad',
        enumValue: 'DS_JERARQUIA_ANSIEDAD',
        label: 'Jerarquía de Ansiedad (DS)',
        schema: z.object({
          area_id: z.literal('ds_jerarquia_ansiedad'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          construccion: z.object({
            definicion: z.string(),
            escala: z.string(),
            reglas: z.array(z.string()),
            pasos: z.array(z.string()),
          }),
          ejemplos_jerarquias: z.array(z.object({
            fobia: z.string(),
            items: z.array(z.object({
              nivel: z.number(),
              descripcion: z.string(),
              usa: z.number(),
            })),
          })),
        }),
        prompt: `Genera datos sobre la CONSTRUCCIÓN DE JERARQUÍAS DE ANSIEDAD en DS:
          - Definición y propósito de la jerarquía
          - Escala USA (Unidades Subjetivas de Ansiedad, 0-100)  
          - Reglas: saltos máximos de 10-15 USA, mínimo 10 ítems, incluir ítem neutro
          - Pasos para construir una jerarquía con el paciente
          - 2-3 ejemplos completos de jerarquías (fobia social, agorafobia, fobia específica) con 7-10 ítems cada una`,
      },
      {
        areaId: 'ds_relajacion',
        enumValue: 'DS_RELAJACION',
        label: 'Protocolo de Relajación (DS)',
        schema: z.object({
          area_id: z.literal('ds_relajacion'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          protocolo_jacobson: z.object({
            descripcion: z.string(),
            grupos_musculares: z.array(z.object({
              grupo: z.string(),
              instruccion_tension: z.string(),
              duracion_tension_seg: z.number(),
              instruccion_distension: z.string(),
              duracion_distension_seg: z.number(),
            })),
            criterio_dominio: z.string(),
          }),
          respuestas_alternativas: z.array(z.object({
            nombre: z.string(),
            descripcion: z.string(),
            cuando_usar: z.string(),
          })),
        }),
        prompt: `Genera datos sobre el PROTOCOLO DE RELAJACIÓN para DS:
          - Relajación Progresiva de Jacobson: los 16 grupos musculares con instrucciones exactas
            de tensión (qué hacer, cuántos segundos) y distensión (cuántos segundos)
          - Criterio de dominio: relajación profunda en menos de 5 minutos
          - Respuestas incompatibles alternativas: respiración diafragmática, visualización, hipnosis ligera`,
      },
      {
        areaId: 'ds_proceso_desensibilizacion',
        enumValue: 'DS_PROCESO_DESENSIBILIZACION',
        label: 'Proceso de Desensibilización (DS)',
        schema: z.object({
          area_id: z.literal('ds_proceso_desensibilizacion'),
          nombre: z.string().min(1),
          descripcion: z.string().min(1),
          fuentes: z.array(z.string()),
          protocolo_sesion: z.object({
            fases: z.array(z.object({
              fase: z.string(),
              duracion: z.string(),
              instrucciones: z.array(z.string()),
            })),
            criterio_superacion_item: z.string(),
            manejo_ansiedad: z.object({
              senal_paciente: z.string(),
              procedimiento_terapeuta: z.array(z.string()),
            }),
          }),
          inmersion_sensorial: z.object({
            canales: z.array(z.object({
              canal: z.string(),
              descripcion: z.string(),
              ejemplo_guion: z.string(),
            })),
          }),
          variantes: z.array(z.object({
            nombre: z.string(),
            descripcion: z.string(),
            indicaciones: z.string(),
          })),
        }),
        prompt: `Genera datos sobre el PROCESO DE DESENSIBILIZACIÓN en sesión:
          - Fases de la sesión de DS: inducción relajación, presentación ítem, evaluación, avance/retroceso
          - Criterio de superación: imaginarlo 2-3 veces sin ansiedad
          - Manejo cuando el paciente señala ansiedad: cortar imagen, volver a relajación, retroceder
          - Inmersión sensorial: canales visual, auditivo, táctil, olfativo con ejemplo de guion
          - Variantes: DS in vivo, DS en grupo, DS automatizada, DS con RV`,
      },
    ],
  },
};

interface SpecificAreaConfig {
  areaId: string;
  enumValue: string;
  label: string;
  schema: z.ZodType;
  prompt: string;
}

// ── Shared area configs ─────────────────────────────────────────────────────

const SHARED_AREA_CONFIGS: {
  areaId: string;
  filename: string;
  schema: z.ZodType;
  prompt: string;
}[] = [
  {
    areaId: 'conocimiento', filename: 'conocimiento.json',
    schema: conocimientoSchema,
    prompt: `Extrae de la bibliografía los FUNDAMENTOS TEÓRICOS de esta técnica:
      - Definición precisa, base teórica, mecanismo principal
      - Orígenes históricos: autor real, año real, aportación verificable (3-6 hitos)
      - Modelo explicativo: cómo la técnica explica el problema que trata
      - Mecanismo de cambio: cómo produce el cambio terapéutico
      - 4-6 principios clave (conceptos técnicos, no genéricos)
      - Evidencia: 2-4 metaanálisis reales con hallazgos concretos
      - Eficacia comparativa y poblaciones estudiadas`,
  },
  {
    areaId: 'objetivos_clinicos', filename: 'objetivos_clinicos.json',
    schema: objetivosClinicosSchema,
    prompt: `Extrae INDICACIONES y CONTRAINDICACIONES:
      - 5-10 indicaciones con trastorno, nivel de evidencia (alta/moderada/emergente), notas clínicas
      - 3-6 contraindicaciones con condición, razón del riesgo, alternativa terapéutica`,
  },
  {
    areaId: 'herramientas_evaluacion', filename: 'herramientas_evaluacion.json',
    schema: herramientasEvaluacionSchema,
    prompt: `Extrae HERRAMIENTAS DE EVALUACIÓN usadas con esta técnica:
      - 4-8 instrumentos con id (prefijo HE + secuencial), nombre, tipo, propósito
      - Cuándo usar, formato, variables si aplica
      - Para instrumentos genéricos usar referencia_shared`,
  },
  {
    areaId: 'ejercicios_tareas', filename: 'ejercicios_tareas.json',
    schema: ejerciciosTareasSchema,
    prompt: `Extrae EJERCICIOS Y TAREAS terapéuticas:
      - 4-8 ejercicios con id (prefijo ET + secuencial), nombre, tipo, objetivo
      - Instrucciones paso a paso (4-6 pasos concretos), frecuencia, ejemplo detallado`,
  },
  {
    areaId: 'recursos_materiales', filename: 'recursos_materiales.json',
    schema: recursosMaterialesSchema,
    prompt: `Extrae RECURSOS Y MATERIALES de apoyo:
      - 5-10 recursos con id (prefijo RM + secuencial), tipo, título, autor
      - Descripción y uso clínico concreto`,
  },
  {
    areaId: 'tecnicas_especificas', filename: 'tecnicas_especificas.json',
    schema: tecnicasEspecificasSchema,
    prompt: `Extrae TÉCNICAS ESPECÍFICAS de intervención:
      - 4-8 técnicas con id (prefijo TE + secuencial), nombre, descripción clínica
      - Cuándo usar, pasos procedimentales (4-6), ejemplo/viñeta clínica`,
  },
  {
    areaId: 'estructura_sesiones', filename: 'estructura_sesiones.json',
    schema: estructuraSesionesSchema,
    prompt: `Extrae la ESTRUCTURA DE SESIONES / plan de tratamiento:
      - Total de sesiones (rango), frecuencia
      - 3-5 bloques temáticos cubriendo todo el tratamiento
      - Cada bloque: nombre, rango de sesiones, objetivos (3-5), actividades principales (4-6)`,
  },
  {
    areaId: 'barreras', filename: 'barreras.json',
    schema: barrerasSchema,
    prompt: `Extrae BARRERAS Y OBSTÁCULOS frecuentes:
      - 4-8 barreras con nombre, descripción del mecanismo
      - Ejemplo de frase del paciente (en primera persona, entre comillas)
      - Estrategia de manejo con pasos concretos`,
  },
  {
    areaId: 'habilidades_terapeuta', filename: 'habilidades_terapeuta.json',
    schema: habilidadesTerapeutaSchema,
    prompt: `Extrae HABILIDADES DEL TERAPEUTA necesarias:
      - 4-8 habilidades con nombre, descripción, importancia para ESTA técnica
      - Cómo desarrollar cada habilidad (acciones concretas)`,
  },
  {
    areaId: 'sintomas_problemas', filename: 'sintomas_problemas.json',
    schema: sintomasProblemasSchema,
    prompt: `Extrae SÍNTOMAS Y PROBLEMAS tratables con esta técnica:
      - 2-5 trastornos con nombre, síntomas principales (basados en DSM/CIE)
      - Cómo se manifiesta en conducta observable
      - Foco de intervención con esta técnica`,
  },
];

// ── PDF extraction ──────────────────────────────────────────────────────────

async function extractPDFs(biblioDir: string, patterns: string[]): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  
  // Buscar PDFs recursivamente
  const allPdfs = await findPDFs(biblioDir);
  
  // Filtrar por patterns relevantes
  const relevant = allPdfs.filter((p) => {
    const name = path.basename(p).toLowerCase();
    return patterns.some((pat) => name.includes(pat.toLowerCase()));
  });

  console.log(`\n📚 PDFs relevantes encontrados: ${relevant.length}`);
  relevant.forEach((p) => console.log(`   → ${path.basename(p)}`));

  // Extraer texto
  const texts: string[] = [];
  for (const pdfPath of relevant) {
    try {
      const buffer = await fs.readFile(pdfPath);
      const { text } = await pdfParse(buffer);
      const truncated = text.slice(0, 80_000); // ~20k tokens por PDF
      texts.push(`\n\n=== FUENTE: ${path.basename(pdfPath)} ===\n\n${truncated}`);
      console.log(`   ✓ ${path.basename(pdfPath)} (${text.length} chars → ${truncated.length} usados)`);
    } catch (err) {
      console.warn(`   ✗ Error en ${path.basename(pdfPath)}: ${err}`);
    }
  }

  // Buscar también .txt en documentos/
  const docsDir = path.join(biblioDir, 'bibliografia', 'documentos');
  try {
    const docs = await fs.readdir(docsDir);
    const relevantTxts = docs.filter((d) =>
      d.endsWith('.txt') && patterns.some((p) => d.toLowerCase().includes(p.toLowerCase()))
    );
    for (const txt of relevantTxts) {
      const content = await fs.readFile(path.join(docsDir, txt), 'utf-8');
      texts.push(`\n\n=== DOCUMENTO: ${txt} ===\n\n${content}`);
      console.log(`   ✓ ${txt} (${content.length} chars)`);
    }
  } catch { /* no docs dir */ }

  return texts.join('\n');
}

async function findPDFs(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findPDFs(full));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      results.push(full);
    }
  }
  return results;
}

// ── LLM call ────────────────────────────────────────────────────────────────

const client = new Anthropic();

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-
```

