import { Document, NodeIO } from '@gltf-transform/core';

const SRC = 'public/models/vase.raw.glb';
const OUT = 'public/models/vase.glb';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1234);
const range = (lo, hi) => lo + (hi - lo) * rand();

const src = await new NodeIO().read(SRC);
const nodes = src.getRoot().listNodes();

const shardNodes = nodes
  .filter((n) => /^shard_\d\d$/.test(n.getName()))
  .sort((a, b) => a.getName().localeCompare(b.getName()));
const seamNodes = nodes.filter((n) => /^seam_\d\d_\d\d$/.test(n.getName()));

if (!shardNodes.length) throw new Error('nessun frammento shard_XX nel modello');

const prim = (node) => node.getMesh().listPrimitives()[0];
const arr = (node, semantic) => Array.from(prim(node).getAttribute(semantic).getArray());

const S = { pos: [], nrm: [], center: [], sPos: [], sAxis: [], sAngle: [], start: [], end: [] };
const endOf = new Map();

for (const node of shardNodes) {
  const idx = Number(node.getName().slice(6));
  const pos = arr(node, 'POSITION');
  const nrm = arr(node, 'NORMAL');
  const n = pos.length / 3;

  let cx = 0, cy = 0, cz = 0;
  for (let k = 0; k < n; k++) {
    cx += pos[3 * k]; cy += pos[3 * k + 1]; cz += pos[3 * k + 2];
  }
  const center = [cx / n, cy / n, cz / n];

  const dir = range(0, 2 * Math.PI);
  const rad = range(1.5, 3.5);
  const scatter = [Math.cos(dir) * rad, Math.sin(dir) * rad, range(-1, 1)];
  let axis = [range(-1, 1), range(-1, 1), range(-1, 1)];
  const len = Math.hypot(...axis) || 1;
  axis = axis.map((v) => v / len);
  const angle = range(Math.PI / 2, 2 * Math.PI);
  const start = range(0, 0.15);
  const end = range(0.55, 0.85);
  endOf.set(idx, end);

  S.pos.push(...pos);
  S.nrm.push(...nrm);
  for (let k = 0; k < n; k++) {
    S.center.push(...center);
    S.sPos.push(...scatter);
    S.sAxis.push(...axis);
    S.sAngle.push(angle);
    S.start.push(start);
    S.end.push(end);
  }
}

const G = { pos: [], nrm: [], uv: [], start: [], end: [] };
for (const node of seamNodes) {
  const [, a, b] = node.getName().match(/^seam_(\d\d)_(\d\d)$/).map(Number);
  if (!endOf.has(a) || !endOf.has(b)) {
    throw new Error(`${node.getName()} cita un frammento inesistente`);
  }
  const start = Math.max(endOf.get(a), endOf.get(b)) - 0.15;
  const end = Math.min(0.95, start + 0.25);
  const pos = arr(node, 'POSITION');
  const n = pos.length / 3;
  G.pos.push(...pos);
  G.nrm.push(...arr(node, 'NORMAL'));
  G.uv.push(...arr(node, 'TEXCOORD_0'));
  for (let k = 0; k < n; k++) {
    G.start.push(start);
    G.end.push(end);
  }
}

const doc = new Document();
const buffer = doc.createBuffer();
const acc = (type, a) =>
  doc.createAccessor().setType(type).setArray(new Float32Array(a)).setBuffer(buffer);
const scene = doc.createScene('vase');
const mat = doc.createMaterial('vase');

const shardPrim = doc
  .createPrimitive()
  .setAttribute('POSITION', acc('VEC3', S.pos))
  .setAttribute('NORMAL', acc('VEC3', S.nrm))
  .setAttribute('_CENTER', acc('VEC3', S.center))
  .setAttribute('_SCATTER_POS', acc('VEC3', S.sPos))
  .setAttribute('_SCATTER_AXIS', acc('VEC3', S.sAxis))
  .setAttribute('_SCATTER_ANGLE', acc('SCALAR', S.sAngle))
  .setAttribute('_START', acc('SCALAR', S.start))
  .setAttribute('_END', acc('SCALAR', S.end))
  .setMaterial(mat);
scene.addChild(doc.createNode('shards').setMesh(doc.createMesh('shards').addPrimitive(shardPrim)));

const seamPrim = doc
  .createPrimitive()
  .setAttribute('POSITION', acc('VEC3', G.pos))
  .setAttribute('NORMAL', acc('VEC3', G.nrm))
  .setAttribute('TEXCOORD_0', acc('VEC2', G.uv))
  .setAttribute('_SEAM_START', acc('SCALAR', G.start))
  .setAttribute('_SEAM_END', acc('SCALAR', G.end))
  .setMaterial(mat);
scene.addChild(doc.createNode('seams').setMesh(doc.createMesh('seams').addPrimitive(seamPrim)));

await new NodeIO().write(OUT, doc);
console.log(`wrote ${OUT}: ${shardNodes.length} shards, ${seamNodes.length} seams`);
