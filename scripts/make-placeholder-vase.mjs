import { Document, NodeIO } from '@gltf-transform/core';
import { mkdirSync } from 'node:fs';

const NA = 8; // spicchi
const NH = 4; // fasce
const H = 2; // altezza del vaso
const T = 0.06; // spessore della parete
const SEAM_OFFSET = 0.004;
const SEAM_WIDTH = 0.02;
const STEPS = 6;

const radius = (y) => 0.28 + 0.5 * Math.sin(Math.PI * Math.pow(y, 0.7));
const pt = (a, y, r) => [Math.cos(a) * r, (y - 0.5) * H, Math.sin(a) * r];
const pad = (n) => String(n).padStart(2, '0');

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};

function pushTri(pos, nrm, a, b, c, cen) {
  let n = cross(sub(b, a), sub(c, a));
  const mid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  if (dot(n, sub(mid, cen)) < 0) {
    [b, c] = [c, b];
    n = n.map((v) => -v);
  }
  n = norm(n);
  for (const p of [a, b, c]) {
    pos.push(...p);
    nrm.push(...n);
  }
}

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('vase');
const shardMat = doc.createMaterial('shard').setBaseColorFactor([0.7, 0.38, 0.23, 1]);
const seamMat = doc.createMaterial('seam').setBaseColorFactor([0.79, 0.64, 0.29, 1]).setDoubleSided(true);

const acc = (type, arr) =>
  doc.createAccessor().setType(type).setArray(new Float32Array(arr)).setBuffer(buffer);

function addNode(name, prim) {
  const mesh = doc.createMesh(name).addPrimitive(prim);
  scene.addChild(doc.createNode(name).setMesh(mesh));
}

// Frammenti: celle solide (prismi curvi) per angolo e altezza.
for (let j = 0; j < NH; j++) {
  for (let i = 0; i < NA; i++) {
    const a0 = (2 * Math.PI * i) / NA;
    const a1 = (2 * Math.PI * (i + 1)) / NA;
    const y0 = j / NH;
    const y1 = (j + 1) / NH;
    const r0 = radius(y0);
    const r1 = radius(y1);

    const O = { a: pt(a0, y0, r0), b: pt(a1, y0, r0), c: pt(a1, y1, r1), d: pt(a0, y1, r1) };
    const I = {
      a: pt(a0, y0, r0 - T),
      b: pt(a1, y0, r0 - T),
      c: pt(a1, y1, r1 - T),
      d: pt(a0, y1, r1 - T),
    };
    const all = [...Object.values(O), ...Object.values(I)];
    const cen = all
      .reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0])
      .map((v) => v / all.length);

    const faces = [
      [O.a, O.b, O.c, O.d], // esterna
      [I.a, I.d, I.c, I.b], // interna
      [O.a, O.d, I.d, I.a], // lato a0
      [O.b, I.b, I.c, O.c], // lato a1
      [O.a, I.a, I.b, O.b], // base
      [O.d, O.c, I.c, I.d], // cima
    ];

    const pos = [];
    const nrm = [];
    for (const [p, q, r, s] of faces) {
      pushTri(pos, nrm, p, q, r, cen);
      pushTri(pos, nrm, p, r, s, cen);
    }
    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', acc('VEC3', pos))
      .setAttribute('NORMAL', acc('VEC3', nrm))
      .setMaterial(shardMat);
    addNode(`shard_${pad(j * NA + i)}`, prim);
  }
}

// Giunture: nastri sulla superficie esterna, lungo i bordi tra celle adiacenti.
function seam(nameA, nameB, points, sides) {
  const pos = [];
  const nrm = [];
  const uv = [];
  const n = points.length;
  const vert = (k, sgn) => {
    const p = points[k];
    const s = sides[k];
    pos.push(p[0] + s[0] * sgn * SEAM_WIDTH * 0.5, p[1] + s[1] * sgn * SEAM_WIDTH * 0.5, p[2] + s[2] * sgn * SEAM_WIDTH * 0.5);
    nrm.push(...norm([p[0], 0, p[2]]));
    uv.push(k / (n - 1), 0);
  };
  for (let k = 0; k < n - 1; k++) {
    vert(k, -1); vert(k, 1); vert(k + 1, 1);
    vert(k, -1); vert(k + 1, 1); vert(k + 1, -1);
  }
  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', acc('VEC3', pos))
    .setAttribute('NORMAL', acc('VEC3', nrm))
    .setAttribute('TEXCOORD_0', acc('VEC2', uv))
    .setMaterial(seamMat);
  addNode(`seam_${pad(nameA)}_${pad(nameB)}`, prim);
}

for (let j = 0; j < NH; j++) {
  for (let i = 0; i < NA; i++) {
    const idx = j * NA + i;
    const y0 = j / NH;
    const y1 = (j + 1) / NH;
    const a0 = (2 * Math.PI * i) / NA;
    const a1 = (2 * Math.PI * (i + 1)) / NA;

    // bordo verticale a a1, tra (i,j) e (i+1,j)
    const right = j * NA + ((i + 1) % NA);
    const vp = [];
    const vs = [];
    for (let k = 0; k <= STEPS; k++) {
      const y = y0 + ((y1 - y0) * k) / STEPS;
      vp.push(pt(a1, y, radius(y) + SEAM_OFFSET));
      vs.push([-Math.sin(a1), 0, Math.cos(a1)]);
    }
    seam(idx, right, vp, vs);

    // bordo orizzontale a y1, tra (i,j) e (i,j+1)
    if (j + 1 < NH) {
      const up = (j + 1) * NA + i;
      const hp = [];
      const hs = [];
      for (let k = 0; k <= STEPS; k++) {
        const a = a0 + ((a1 - a0) * k) / STEPS;
        hp.push(pt(a, y1, radius(y1) + SEAM_OFFSET));
        hs.push([0, 1, 0]);
      }
      seam(idx, up, hp, hs);
    }
  }
}

mkdirSync('public/models', { recursive: true });
await new NodeIO().write('public/models/vase.raw.glb', doc);
console.log(`wrote public/models/vase.raw.glb (${NA * NH} shards)`);
