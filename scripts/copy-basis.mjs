import { cpSync, mkdirSync } from 'node:fs';

const from = 'node_modules/three/examples/jsm/libs/basis';
const to = 'public/basis';
mkdirSync(to, { recursive: true });
for (const f of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
  cpSync(`${from}/${f}`, `${to}/${f}`);
}
console.log('basis transcoder copied to', to);
