import fs from 'node:fs';
import path from 'node:path';

type Item = {
  id: string;
  nombre: string;
};

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(')
    .trim();
}

function parseMd(content: string): Item[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items: Item[] = [];
  let pendingId: string | null = null;

  for (const line of lines) {
    if (/^CIE-9-MC/i.test(line)) {
      continue;
    }

    const match = line.match(/^(\d{3}(?:\.\d+)?)\s*(.*)$/);
    if (!match) {
      if (pendingId) {
        items.push({
          id: pendingId,
          nombre: normalizeText(line),
        });
        pendingId = null;
      }
      continue;
    }

    const id = match[1];
    const maybeName = normalizeText(match[2]);

    if (maybeName.length === 0) {
      pendingId = id;
      continue;
    }

    items.push({
      id,
      nombre: maybeName,
    });
    pendingId = null;
  }

  return items;
}

function printUsage() {
  console.log('Uso: npm run md:to-json -- <archivo-entrada.md> [archivo-salida.json]');
}

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  printUsage();
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
if (!fs.existsSync(inputPath)) {
  console.error(`No existe el archivo de entrada: ${inputPath}`);
  process.exit(1);
}

const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : path.join(path.dirname(inputPath), `${path.parse(inputPath).name}.json`);

const raw = fs.readFileSync(inputPath, 'utf8');
const items = parseMd(raw);

const payload = {
  source: path.relative(process.cwd(), inputPath).replace(/\\/g, '/'),
  generatedAt: new Date().toISOString(),
  total: items.length,
  items,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`Generado: ${outputPath}`);
console.log(`Registros: ${items.length}`);