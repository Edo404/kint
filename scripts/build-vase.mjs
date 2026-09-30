// Unisce i nodi shard_XX e seam_AA_BB del modello sorgente in due sole mesh (due draw call).
// I parametri di movimento non stanno nel file: si generano a runtime da un seme (shardData.ts).
import { Document, NodeIO } from '@gltf-transform/core';

const SRC = 'models-src/vase.raw.glb';
const OUT = 'public/models/vase.glb';

const src = await new NodeIO().read(SRC);
const nodes = src.getRoot().listNodes();

const shardNodes = nodes
  .filter((n) => /^shard_\d{2,3}$/.test(n.getName()))
  .sort((a, b) => Number(a.getName().slice(6)) - Number(b.getName().slice(6)));
const seamNodes = nodes.filter((n) => /^seam_\d{2,3}_\d{2,3}$/.test(n.getName()));
if (!shardNodes.length) throw new Error('nessun frammento shard_XX nel modello');

const prim = (node) => node.getMesh().listPrimitives()[0];
const arr = (node, semantic) => Array.from(prim(node).getAttribute(semantic).getArray());
const indices = (node) => Array.from(prim(node).getIndices().getArray());

const S = { pos: [], nrm: [], id: [], idx: [] };
const known = new Set();
shardNodes.forEach((node, i) => {
  if (Number(node.getName().slice(6)) !== i) throw new Error(`indice frammento non sequenziale: ${node.getName()}`);
  known.add(i);
  const pos = arr(node, 'POSITION');
  const base = S.pos.length / 3;
  S.pos.push(...pos);
  S.nrm.push(...arr(node, 'NORMAL'));
  for (let k = 0; k < pos.length / 3; k++) S.id.push(i);
  for (const ix of indices(node)) S.idx.push(base + ix);
});

const G = { pos: [], nrm: [], uv: [], pair: [], idx: [] };
for (const node of seamNodes) {
  const [, a, b] = node.getName().match(/^seam_(\d{2,3})_(\d{2,3})$/).map(Number);
  if (!known.has(a) || !known.has(b)) throw new Error(`${node.getName()} cita un frammento inesistente`);
  const pos = arr(node, 'POSITION');
  const base = G.pos.length / 3;
  G.pos.push(...pos);
  G.nrm.push(...arr(node, 'NORMAL'));
  G.uv.push(...arr(node, 'TEXCOORD_0'));
  // Coppia di frammenti codificata in un solo float: a * 1024 + b (esatta per id < 1024).
  for (let k = 0; k < pos.length / 3; k++) G.pair.push(a * 1024 + b);
  for (const ix of indices(node)) G.idx.push(base + ix);
}

const doc = new Document();
const buffer = doc.createBuffer();
const acc = (type, a, Type = Float32Array) => doc.createAccessor().setType(type).setArray(new Type(a)).setBuffer(buffer);
const idxType = (n) => (n < 65535 ? Uint16Array : Uint32Array);
const scene = doc.createScene('vase');
const mat = doc.createMaterial('vase');

const shardPrim = doc
  .createPrimitive()
  .setAttribute('POSITION', acc('VEC3', S.pos))
  .setAttribute('NORMAL', acc('VEC3', S.nrm))
  .setAttribute('_SHARD', acc('SCALAR', S.id))
  .setIndices(acc('SCALAR', S.idx, idxType(S.pos.length / 3)))
  .setMaterial(mat);
scene.addChild(doc.createNode('shards').setMesh(doc.createMesh('shards').addPrimitive(shardPrim)));

const seamPrim = doc
  .createPrimitive()
  .setAttribute('POSITION', acc('VEC3', G.pos))
  .setAttribute('NORMAL', acc('VEC3', G.nrm))
  .setAttribute('TEXCOORD_0', acc('VEC2', G.uv))
  .setAttribute('_PAIR', acc('SCALAR', G.pair))
  .setIndices(acc('SCALAR', G.idx, idxType(G.pos.length / 3)))
  .setMaterial(mat);
scene.addChild(doc.createNode('seams').setMesh(doc.createMesh('seams').addPrimitive(seamPrim)));

doc.getRoot().setExtras({ shardCount: shardNodes.length, ...(src.getRoot().getExtras() ?? {}) });

await new NodeIO().write(OUT, doc);
console.log(`wrote ${OUT}: ${shardNodes.length} shards, ${seamNodes.length} seams, ${S.pos.length / 3} + ${G.pos.length / 3} vertices`);
