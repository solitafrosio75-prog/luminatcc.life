/**
 * Script para extraer criterios DSM-5 relevantes para TCC y derivación psiquiátrica
 * Fuente: archivo TXT generado desde el PDF DSM-5
 *
 * Uso: node extract-dsm5-criteria.ts <ruta_al_txt>
 *
 * Filtra por palabras clave y genera un JSON con los criterios encontrados.
 */

import * as fs from 'fs';
import * as path from 'path';


// Lee y parsea glosario.txt
function parseGlossary(glosarioPath: string) {
    const content = fs.readFileSync(glosarioPath, 'utf-8');
    const lines = content.split('\n');
    const glossary: { term: string; definition: string }[] = [];
    let currentTerm = '';
    let currentDef = '';
    for (const line of lines) {
        // Detecta término: línea que empieza con mayúscula y termina en punto, puede ser multi-palabra
        const match = line.trim().match(/^([A-ZÁÉÍÓÚÑ][\w áéíóúñÁÉÍÓÚÑ-]*)\.(.*)$/);
        if (match) {
            if (currentTerm) {
                glossary.push({ term: currentTerm, definition: currentDef.trim() });
            }
            currentTerm = match[1].trim();
            currentDef = match[2].trim();
        } else if (currentTerm) {
            currentDef += ' ' + line.trim();
        }
    }
    if (currentTerm) {
        glossary.push({ term: currentTerm, definition: currentDef.trim() });
    }
    return glossary;
}

// Recibe ruta al glosario
const glosarioPath = process.argv[3];
const glossaryDSM5 = glosarioPath ? parseGlossary(glosarioPath) : [];
const keywords = glossaryDSM5.map(term => term.term);
const glossaryLookup = Object.fromEntries(glossaryDSM5.map(term => [term.term.toLowerCase(), term]));

interface ExtractedCriterion {
    line: string;
    keyword: string;
    category: string;
    definition?: string;
    reference?: string;
}

function extractAllGlossary(glosarioPath: string): ExtractedCriterion[] {
    const glossary = parseGlossary(glosarioPath);
    return glossary.map(entry => ({
        line: entry.definition,
        keyword: entry.term,
        category: 'clínico',
        definition: entry.definition,
        reference: undefined,
    }));
}

if (typeof import.meta !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
    const glosarioPath = process.argv[2];
    if (!glosarioPath) {
        console.error('Uso: node extract-dsm5-criteria.ts <ruta_al_glosario>');
        process.exit(1);
    }

    const glossary = parseGlossary(glosarioPath);
    const outPath = path.join(path.dirname(glosarioPath), 'glosario.json');
    fs.writeFileSync(outPath, JSON.stringify(glossary, null, 2), 'utf-8');
    console.log(`Términos exportados: ${glossary.length}`);
    console.log(`Archivo generado: ${outPath}`);
}
