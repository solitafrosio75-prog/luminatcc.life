/**
 * validate-exposicion.ts — Script para validar todos los JSONs de Exposición contra sus schemas Zod
 */
import { AREA_SCHEMAS } from '../src/knowledge/types/schemas';
import { KBArea } from '../src/knowledge/types/technique.types';
import { readFileSync } from 'fs';
import { join } from 'path';

const EXP_DATA_DIR = join(import.meta.dirname, '..', 'src', 'knowledge', 'exposicion', 'data');

const EXP_FILES: { file: string; area: KBArea }[] = [
  // Compartidas
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
  // Específicas EXP
  { file: 'exp_jerarquia_exposicion.json', area: KBArea.EXP_JERARQUIA_EXPOSICION },
  { file: 'exp_prevencion_respuesta.json', area: KBArea.EXP_PREVENCION_RESPUESTA },
  { file: 'exp_proceso_exposicion.json', area: KBArea.EXP_PROCESO_EXPOSICION },
];

let passed = 0;
let failed = 0;

for (const { file, area } of EXP_FILES) {
  const schema = AREA_SCHEMAS[area];
  if (!schema) {
    console.log(`⚠️  ${file}: No schema found for area ${area}`);
    failed++;
    continue;
  }

  try {
    const raw = JSON.parse(readFileSync(join(EXP_DATA_DIR, file), 'utf-8'));
    const result = schema.safeParse(raw);
    if (result.success) {
      console.log(`✅ ${file}`);
      passed++;
    } else {
      console.log(`❌ ${file}:`);
      console.log(JSON.stringify(result.error.issues, null, 2));
      failed++;
    }
  } catch (e: any) {
    console.log(`❌ ${file}: ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed}/${passed + failed} archivos validados correctamente`);
if (failed > 0) process.exit(1);
