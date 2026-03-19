/**
 * validate-mc.ts — Validación Zod de los 13 JSONs de Modificación de Conducta
 *
 * Ejecutar: npx tsx scripts/validate-mc.ts
 */

import { AREA_SCHEMAS } from '../src/knowledge/types/schemas';
import { KBArea } from '../src/knowledge/types/technique.types';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/knowledge/modificacion_conducta/data');

const FILES: { file: string; area: KBArea }[] = [
  // Compartidas
  { file: 'conocimiento.json',            area: KBArea.CONOCIMIENTO },
  { file: 'objetivos_clinicos.json',       area: KBArea.OBJETIVOS_CLINICOS },
  { file: 'herramientas_evaluacion.json',  area: KBArea.HERRAMIENTAS_EVALUACION },
  { file: 'ejercicios_tareas.json',        area: KBArea.EJERCICIOS_TAREAS },
  { file: 'recursos_materiales.json',      area: KBArea.RECURSOS_MATERIALES },
  { file: 'tecnicas_especificas.json',     area: KBArea.TECNICAS_ESPECIFICAS },
  { file: 'estructura_sesiones.json',      area: KBArea.ESTRUCTURA_SESIONES },
  { file: 'barreras.json',                 area: KBArea.BARRERAS },
  { file: 'habilidades_terapeuta.json',    area: KBArea.HABILIDADES_TERAPEUTA },
  { file: 'sintomas_problemas.json',       area: KBArea.SINTOMAS_PROBLEMAS },
  // Específicas MC
  { file: 'mc_analisis_funcional.json',      area: KBArea.MC_ANALISIS_FUNCIONAL },
  { file: 'mc_programas_reforzamiento.json', area: KBArea.MC_PROGRAMAS_REFORZAMIENTO },
  { file: 'mc_tecnicas_operantes.json',      area: KBArea.MC_TECNICAS_OPERANTES },
];

let passed = 0;
let failed = 0;

for (const { file, area } of FILES) {
  const schema = AREA_SCHEMAS[area];
  if (!schema) {
    console.error(`❌ ${file} — No hay schema para ${area}`);
    failed++;
    continue;
  }
  try {
    const raw = readFileSync(resolve(DATA_DIR, file), 'utf-8');
    const data = JSON.parse(raw);
    schema.parse(data);
    console.log(`✅ ${file}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ ${file}`);
    console.error(err?.issues ?? err);
    failed++;
  }
}

console.log(`\n${passed}/${FILES.length} archivos validados correctamente`);
if (failed > 0) process.exit(1);
