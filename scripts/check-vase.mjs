import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { existsSync, statSync } from 'node:fs';

const RAW = 'models-src/vase.raw.glb';
const BUILT = 'public/models/vase.glb';
const MAX_BYTES = 1024 * 1024; // obiettivo 1 MB (limite duro 1.5 MB)
const errors = [];

await MeshoptDecoder.ready;
const builtIO = () => new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

if (existsSync(RAW)) {
  const doc = await new NodeIO().read(RAW);
  const nodes = doc.getRoot().listNodes().map((n) => n.getName());
  const shards = nodes.filter((n) => n.startsWith('shard_')).sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
  shards.forEach((n, i) => {
    if (!/^shard_\d{2,3}$/.test(n) || Number(n.slice(6)) !== i) errors.push(`indice frammento non sequenziale: ${n}`);
  });
  if (shards.length < 24 || shards.length > 200) errors.push(`frammenti: ${shards.length}, attesi 24-200`);
  const known = new Set(shards.map((n) => Number(n.slice(6))));
  for (const n of nodes.filter((x) => x.startsWith('seam_'))) {
    const m = n.match(/^seam_(\d{2,3})_(\d{2,3})$/);
    if (!m) errors.push(`nome giuntura non valido: ${n}`);
    else if (!known.has(Number(m[1])) || !known.has(Number(m[2]))) errors.push(`${n} cita un frammento inesistente`);
  }
  for (const n of shards) {
    const node = doc.getRoot().listNodes().find((x) => x.getName() === n);
    const tris = node.getMesh().listPrimitives()[0].getIndices().getCount() / 3;
    if (tris < 12) errors.push(`${n} è troppo piccolo (${tris} triangoli)`);
  }

  const x = doc.getRoot().getExtras() ?? {};
  if (x.profile) {
    const ratio = x.profile.maxRadius / x.profile.neckRadius;
    if (!(ratio > 2.2)) errors.push(`la sagoma non sembra un vaso: pancia/collo = ${ratio.toFixed(2)} (attesa > 2.2)`);
  }
  if (typeof x.seamIrregularity === 'number' && !(x.seamIrregularity > 1.15)) {
    errors.push(`giunture troppo dritte: irregolarità ${x.seamIrregularity.toFixed(2)} (attesa > 1.15)`);
  }
  if (x.handles !== undefined && x.handles < 2) errors.push('mancano le anse');
} else {
  console.log(`(salto il controllo del grezzo: ${RAW} non presente)`);
}

if (!existsSync(BUILT)) {
  errors.push(`manca ${BUILT}: eseguire npm run vase:build`);
} else {
  const size = statSync(BUILT).size;
  if (size > MAX_BYTES) errors.push(`${BUILT} pesa ${size} B, oltre ${MAX_BYTES} B`);
  const doc = await builtIO().read(BUILT);
  const byName = new Map(doc.getRoot().listNodes().map((n) => [n.getName(), n]));
  const need = {
    shards: ['POSITION', 'NORMAL', '_SHARD'],
    seams: ['POSITION', 'NORMAL', 'TEXCOORD_0', '_PAIR'],
  };
  for (const [name, attrs] of Object.entries(need)) {
    const node = byName.get(name);
    if (!node) {
      errors.push(`manca il nodo "${name}" in ${BUILT}`);
      continue;
    }
    const p = node.getMesh().listPrimitives()[0];
    for (const a of attrs) if (!p.getAttribute(a)) errors.push(`${name}: manca l'attributo ${a}`);
    if (!p.getIndices()) errors.push(`${name}: mancano gli indici`);
  }
  if (!errors.length) console.log(`${BUILT}: ${size} B, contratto rispettato`);
}

if (errors.length) {
  for (const e of errors) console.error('FAIL', e);
  process.exit(1);
}
