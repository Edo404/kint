import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative, sep } from 'node:path';

const PAGE_BUDGET = 300 * 1024;
const MODEL_BUDGET = 1.5 * 1024 * 1024;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}
const gz = (buf) => gzipSync(buf).length;

const html = readFileSync('dist/index.html', 'utf8');
const referenced = new Set(
  [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) =>
    m[1].replace(/^\.?\//, '').replace(/^\//, ''),
  ),
);

let initial = gz(Buffer.from(html));
let failed = false;
const rows = [['index.html', initial, 'iniziale']];

for (const file of walk('dist')) {
  const rel = relative('dist', file).split(sep).join('/');
  if (rel === 'index.html') continue;
  const raw = readFileSync(file);

  if (rel.startsWith('models/')) {
    rows.push([rel, raw.length, 'modello']);
    if (raw.length > MODEL_BUDGET) {
      console.error(`FAIL ${rel}: ${raw.length} B supera ${MODEL_BUDGET} B`);
      failed = true;
    }
  } else if (referenced.has(rel)) {
    initial += gz(raw);
    rows.push([rel, gz(raw), 'iniziale']);
  } else if (/\.(js|css)$/.test(rel)) {
    rows.push([rel, gz(raw), 'lazy (3D)']);
  }
}

for (const [name, size, kind] of rows) console.log(`${String(size).padStart(9)} B  ${kind.padEnd(10)} ${name}`);
console.log(`\nPeso iniziale: ${initial} B / ${PAGE_BUDGET} B`);

if (initial > PAGE_BUDGET) {
  console.error('FAIL: budget della pagina superato');
  failed = true;
}
process.exit(failed ? 1 : 0);
