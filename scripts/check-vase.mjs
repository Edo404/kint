import { NodeIO } from '@gltf-transform/core';
import { existsSync, statSync } from 'node:fs';

const RAW = 'public/models/vase.raw.glb';
const BUILT = 'public/models/vase.glb';
const MAX_BYTES = 1.5 * 1024 * 1024;
const errors = [];

if (existsSync(RAW)) {
  const nodes = (await new NodeIO().read(RAW)).getRoot().listNodes().map((n) => n.getName());
  const shards = nodes.filter((n) => n.startsWith('shard_')).sort();
  shards.forEach((n, i) => {
    if (n !== `shard_${String(i).padStart(2, '0')}`) errors.push(`indice frammento non sequenziale: ${n}`);
  });
  if (shards.length < 24 || shards.length > 40) errors.push(`frammenti: ${shards.length}, attesi 24-40`);
  const known = new Set(shards.map((n) => Number(n.slice(6))));
  for (const n of nodes.filter((x) => x.startsWith('seam_'))) {
    const m = n.match(/^seam_(\d\d)_(\d\d)$/);
    if (!m) errors.push(`nome giuntura non valido: ${n}`);
    else if (!known.has(Number(m[1])) || !known.has(Number(m[2]))) errors.push(`${n} cita un frammento inesistente`);
  }
} else {
  console.log(`(salto il controllo del grezzo: ${RAW} non presente)`);
}

if (!existsSync(BUILT)) {
  errors.push(`manca ${BUILT}: eseguire npm run vase:build`);
} else {
  const size = statSync(BUILT).size;
  if (size > MAX_BYTES) errors.push(`${BUILT} pesa ${size} B, oltre ${MAX_BYTES} B`);
  const doc = await new NodeIO().read(BUILT);
  const byName = new Map(doc.getRoot().listNodes().map((n) => [n.getName(), n]));
  const need = {
    shards: ['POSITION', 'NORMAL', '_CENTER', '_SCATTER_POS', '_SCATTER_AXIS', '_SCATTER_ANGLE', '_START', '_END'],
    seams: ['POSITION', 'NORMAL', 'TEXCOORD_0', '_SEAM_START', '_SEAM_END'],
  };
  for (const [name, attrs] of Object.entries(need)) {
    const node = byName.get(name);
    if (!node) {
      errors.push(`manca il nodo "${name}" in ${BUILT}`);
      continue;
    }
    const p = node.getMesh().listPrimitives()[0];
    for (const a of attrs) if (!p.getAttribute(a)) errors.push(`${name}: manca l'attributo ${a}`);
  }
  if (!errors.length) console.log(`${BUILT}: ${size} B, contratto rispettato`);
}

if (errors.length) {
  for (const e of errors) console.error('FAIL', e);
  process.exit(1);
}
