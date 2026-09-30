// Ogni file in functions/ deve esportare almeno un gestore Cloudflare Pages (onRequest, onRequestPost, ...).
// Senza questo controllo un file sbagliato passa inosservato: tsc e i test non guardano functions/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function* walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|js)$/.test(n)) yield p;
  }
}

const errors = [];
let count = 0;
for (const file of walk('functions')) {
  count++;
  const src = readFileSync(file, 'utf8');
  if (!/export\s+(const|async function|function)\s+onRequest(Get|Post|Put|Patch|Delete|Head|Options)?\b/.test(src)) {
    errors.push(`${file}: nessun gestore onRequest* esportato`);
  }
  if (/from ['"]vitest['"]/.test(src)) errors.push(`${file}: contiene codice di test`);
}
if (errors.length) {
  for (const e of errors) console.error('FAIL', e);
  process.exit(1);
}
console.log(`functions ok: ${count} file`);
