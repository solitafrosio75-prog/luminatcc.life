/**
 * validate-knowledge-all.ts — Validacion de knowledge v2 legacy + shared
 *
 * IMPORTANTE:
 * - Este script NO valida paquetes clinicos v3 (profile/procedures).
 * - Para cobertura v3 usar: scripts/validate-v3-all.ts
 *
 * Ejecutar:
 *   npx tsx scripts/validate-knowledge-all.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AREA_SCHEMAS, SHARED_SCHEMAS } from '../src/knowledge/types/schemas';
import { KBArea, SharedArea } from '../src/knowledge/types/technique.types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_ROOT = resolve(__dirname, '../src/knowledge');

type AreaSpec = { file: string; area: KBArea };
type SharedSpec = { file: string; area: SharedArea };

const SHARED_FILES: SharedSpec[] = [
  { file: 'inventarios_generales.json', area: SharedArea.INVENTARIOS_GENERALES },
  { file: 'protocolo_crisis.json', area: SharedArea.PROTOCOLO_CRISIS },
  { file: 'habilidades_entrevista.json', area: SharedArea.HABILIDADES_ENTREVISTA },
];

const AC_FILES: AreaSpec[] = [
  { file: 'area_01_conocimiento.json', area: KBArea.CONOCIMIENTO },
  { file: 'area_02_objetivos_clinicos.json', area: KBArea.OBJETIVOS_CLINICOS },
  { file: 'area_03_herramientas_evaluacion.json', area: KBArea.HERRAMIENTAS_EVALUACION },
  { file: 'area_04_ejercicios_tareas.json', area: KBArea.EJERCICIOS_TAREAS },
  { file: 'area_05_recursos_materiales.json', area: KBArea.RECURSOS_MATERIALES },
  { file: 'area_06_tecnicas_especificas.json', area: KBArea.TECNICAS_ESPECIFICAS },
  { file: 'area_07_estructura_sesiones.json', area: KBArea.ESTRUCTURA_SESIONES },
  { file: 'area_09_barreras.json', area: KBArea.BARRERAS },
  { file: 'area_10_habilidades_terapeuta.json', area: KBArea.HABILIDADES_TERAPEUTA },
  { file: 'area_12_sintomas_problemas.json', area: KBArea.SINTOMAS_PROBLEMAS },
  { file: 'area_11_areas_vitales.json', area: KBArea.AC_AREAS_VITALES },
  { file: 'area_08_valores_objetivos.json', area: KBArea.AC_VALORES_REFORZADORES },
  { file: 'area_13_actividades_por_problema.json', area: KBArea.AC_ACTIVIDADES_POR_PROBLEMA },
];

const RC_FILES: AreaSpec[] = [
  { file: 'conocimiento.json', area: KBArea.CONOCIMIENTO },
  { file: 'objetivos_clinicos.json', area: KBArea.OBJETIVOS_CLINICOS },
  { file: 'herramientas_evaluacion.json', area: KBArea.HERRAMIENTAS_EVALUACION },
  { file: 'ejercicios_tareas.json', area: KBArea.EJERCICIOS_TAREAS },
  { file: 'recursos_materiales.json', area: KBArea.RECURSOS_MATERIALES },
  { file: 'tecnicas_especificas.json', area: KBArea.TECNICAS_ESPECIFICAS },
  { file: 'estructura_sesiones.json', area: KBArea.ESTRUCTURA_SESIONES },
  { file: 'barreras.json', area: KBArea.BARRERAS },
  { file: 'habilidades_terapeuta.json', area: KBArea.HABILIDADES_TERAPEUTA },
  { file: 'sintomas_problemas.json', area: KBArea.SINTOMAS_PROBLEMAS },
  { file: 'rc_distorsiones_cognitivas.json', area: KBArea.RC_DISTORSIONES_COGNITIVAS },
  { file: 'rc_registro_pensamientos.json', area: KBArea.RC_REGISTRO_PENSAMIENTOS },
  { file: 'rc_creencias_nucleares.json', area: KBArea.RC_CREENCIAS_NUCLEARES },
  { file: 'rc_experimentos_conductuales.json', area: KBArea.RC_EXPERIMENTOS_CONDUCTUALES },
];

const DS_FILES: AreaSpec[] = [
  { file: 'conocimiento.json', area: KBArea.CONOCIMIENTO },
  { file: 'objetivos_clinicos.json', area: KBArea.OBJETIVOS_CLINICOS },
  { file: 'herramientas_evaluacion.json', area: KBArea.HERRAMIENTAS_EVALUACION },
  { file: 'ejercicios_tareas.json', area: KBArea.EJERCICIOS_TAREAS },
  { file: 'recursos_materiales.json', area: KBArea.RECURSOS_MATERIALES },
  { file: 'tecnicas_especificas.json', area: KBArea.TECNICAS_ESPECIFICAS },
  { file: 'estructura_sesiones.json', area: KBArea.ESTRUCTURA_SESIONES },
  { file: 'barreras.json', area: KBArea.BARRERAS },
  { file: 'habilidades_terapeuta.json', area: KBArea.HABILIDADES_TERAPEUTA },
  { file: 'sintomas_problemas.json', area: KBArea.SINTOMAS_PROBLEMAS },
  { file: 'ds_jerarquia_ansiedad.json', area: KBArea.DS_JERARQUIA_ANSIEDAD },
  { file: 'ds_relajacion.json', area: KBArea.DS_RELAJACION },
  { file: 'ds_proceso_desensibilizacion.json', area: KBArea.DS_PROCESO_DESENSIBILIZACION },
];

const EXP_FILES: AreaSpec[] = [
  { file: 'conocimiento.json', area: KBArea.CONOCIMIENTO },
  { file: 'objetivos_clinicos.json', area: KBArea.OBJETIVOS_CLINICOS },
  { file: 'herramientas_evaluacion.json', area: KBArea.HERRAMIENTAS_EVALUACION },
  { file: 'ejercicios_tareas.json', area: KBArea.EJERCICIOS_TAREAS },
  { file: 'recursos_materiales.json', area: KBArea.RECURSOS_MATERIALES },
  { file: 'tecnicas_especificas.json', area: KBArea.TECNICAS_ESPECIFICAS },
  { file: 'estructura_sesiones.json', area: KBArea.ESTRUCTURA_SESIONES },
  { file: 'barreras.json', area: KBArea.BARRERAS },
  { file: 'habilidades_terapeuta.json', area: KBArea.HABILIDADES_TERAPEUTA },
  { file: 'sintomas_problemas.json', area: KBArea.SINTOMAS_PROBLEMAS },
  { file: 'exp_jerarquia_exposicion.json', area: KBArea.EXP_JERARQUIA_EXPOSICION },
  { file: 'exp_prevencion_respuesta.json', area: KBArea.EXP_PREVENCION_RESPUESTA },
  { file: 'exp_proceso_exposicion.json', area: KBArea.EXP_PROCESO_EXPOSICION },
];

const MC_FILES: AreaSpec[] = [
  { file: 'conocimiento.json', area: KBArea.CONOCIMIENTO },
  { file: 'objetivos_clinicos.json', area: KBArea.OBJETIVOS_CLINICOS },
  { file: 'herramientas_evaluacion.json', area: KBArea.HERRAMIENTAS_EVALUACION },
  { file: 'ejercicios_tareas.json', area: KBArea.EJERCICIOS_TAREAS },
  { file: 'recursos_materiales.json', area: KBArea.RECURSOS_MATERIALES },
  { file: 'tecnicas_especificas.json', area: KBArea.TECNICAS_ESPECIFICAS },
  { file: 'estructura_sesiones.json', area: KBArea.ESTRUCTURA_SESIONES },
  { file: 'barreras.json', area: KBArea.BARRERAS },
  { file: 'habilidades_terapeuta.json', area: KBArea.HABILIDADES_TERAPEUTA },
  { file: 'sintomas_problemas.json', area: KBArea.SINTOMAS_PROBLEMAS },
  { file: 'mc_analisis_funcional.json', area: KBArea.MC_ANALISIS_FUNCIONAL },
  { file: 'mc_programas_reforzamiento.json', area: KBArea.MC_PROGRAMAS_REFORZAMIENTO },
  { file: 'mc_tecnicas_operantes.json', area: KBArea.MC_TECNICAS_OPERANTES },
];

function parseJson(path: string): unknown {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

function validateTechnique(name: string, dir: string, files: AreaSpec[]): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  console.log(`\n=== ${name} ===`);
  for (const { file, area } of files) {
    const schema = AREA_SCHEMAS[area];
    if (!schema) {
      console.log(`❌ ${file} — schema faltante para ${area}`);
      failed++;
      continue;
    }

    try {
      schema.parse(parseJson(resolve(dir, file)));
      console.log(`✅ ${file}`);
      passed++;
    } catch (err: any) {
      console.log(`❌ ${file}`);
      console.log(err?.issues ?? err);
      failed++;
    }
  }

  return { passed, failed };
}

function validateShared(): { passed: number; failed: number } {
  const dir = resolve(KNOWLEDGE_ROOT, 'shared', 'data');
  let passed = 0;
  let failed = 0;

  console.log('\n=== SHARED ===');
  for (const { file, area } of SHARED_FILES) {
    const schema = SHARED_SCHEMAS[area];
    if (!schema) {
      console.log(`❌ ${file} — schema faltante para shared:${area}`);
      failed++;
      continue;
    }

    try {
      schema.parse(parseJson(resolve(dir, file)));
      console.log(`✅ ${file}`);
      passed++;
    } catch (err: any) {
      console.log(`❌ ${file}`);
      console.log(err?.issues ?? err);
      failed++;
    }
  }

  return { passed, failed };
}

const groups = [
  () => validateShared(),
  () => validateTechnique('AC', resolve(KNOWLEDGE_ROOT, 'ac', 'data'), AC_FILES),
  () => validateTechnique('RC', resolve(KNOWLEDGE_ROOT, 'rc', 'data'), RC_FILES),
  () => validateTechnique('DS', resolve(KNOWLEDGE_ROOT, 'ds', 'data'), DS_FILES),
  () => validateTechnique('EXPOSICION', resolve(KNOWLEDGE_ROOT, 'exposicion', 'data'), EXP_FILES),
  () => validateTechnique('MC', resolve(KNOWLEDGE_ROOT, 'modificacion_conducta', 'data'), MC_FILES),
];

let totalPassed = 0;
let totalFailed = 0;

for (const run of groups) {
  const { passed, failed } = run();
  totalPassed += passed;
  totalFailed += failed;
}

console.log(`\nTOTAL V2 LEGACY: ${totalPassed}/${totalPassed + totalFailed} archivos validados`);
if (totalFailed > 0) process.exit(1);
