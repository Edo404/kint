// Genera il modello del vaso: un'anfora in terracotta con due anse, fratturata in molti
// frammenti irregolari, più le giunture d'oro (kintsugi) lungo le fratture.
// Rispetta il contratto: nodi shard_XX e seam_AA_BB, nessuna texture.
import { Document, NodeIO } from '@gltf-transform/core';
import { mkdirSync } from 'node:fs';

const NA = 104; // segmenti angolari del corpo
const NP = 78; // campioni del profilo
const H = 2.4; // altezza del vaso
const T = 0.05; // spessore della parete
const HANDLE_R = 0.05; // raggio del tubo delle anse
const HANDLE_PATH = 40;
const HANDLE_RING = 10;
const BODY_SEEDS = 120;
const HANDLE_SEEDS = 10;
const MAX_SHARDS = 200;
const SEAM_LIFT = 0.004;
const SEED = 20260930;

// ---------- utilità ----------
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);

function hash3(ix, iy, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const fade = (t) => t * t * (3 - 2 * t);
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const pad = (n) => String(n).padStart(2, '0');

function catmullRom(points, samplesPerSegment) {
  const out = [];
  const n = points.length;
  const P = (i) => points[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t, t3 = t2 * t;
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      out.push(
        p0.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)),
      );
    }
  }
  out.push(points[n - 1]);
  return out;
}

function resample(points, count) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.hypot(...points[i].map((v, k) => v - points[i - 1][k])));
  const total = cum[cum.length - 1];
  const out = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const target = (total * i) / (count - 1);
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const t = (target - cum[j]) / ((cum[j + 1] - cum[j]) || 1);
    out.push(points[j].map((v, k) => v + (points[j + 1][k] - v) * t));
  }
  return out;
}

// ---------- geometria: corpo di rotazione (anfora) ----------
// Profilo [altezza 0..1, raggio], dal centro della base fino al bordo della bocca.
const PROFILE = [
  [0, 0], [0, 0.2], [0.02, 0.23], [0.07, 0.3], [0.16, 0.46], [0.3, 0.6], [0.44, 0.64],
  [0.58, 0.57], [0.7, 0.42], [0.78, 0.27], [0.84, 0.21], [0.91, 0.21], [0.95, 0.27], [0.99, 0.36], [1, 0.37],
];
const profile = resample(catmullRom(PROFILE, 24), NP).map(([y, r]) => ({ r, y: (y - 0.5) * H }));

const outerP = [];
const outerN = [];
const innerP = [];
const innerN = [];
const quads = []; // { v:[a,b,c,d], part:'body'|'handle0'|'handle1', centroid }

for (let j = 0; j < NP; j++) {
  const a = profile[Math.max(0, j - 1)];
  const b = profile[Math.min(NP - 1, j + 1)];
  const dr = b.r - a.r, dy = b.y - a.y;
  const l = Math.hypot(dr, dy) || 1;
  const nr = dy / l, ny = -dr / l; // normale esterna nel piano (r, y)
  for (let i = 0; i < NA; i++) {
    const th = (2 * Math.PI * i) / NA;
    const c = Math.cos(th), s = Math.sin(th);
    const P = [profile[j].r * c, profile[j].y, profile[j].r * s];
    const N = [nr * c, ny, nr * s];
    outerP.push(P);
    outerN.push(N);
    innerP.push(sub(P, mul(N, T)));
    innerN.push(mul(N, -1));
  }
}
const vid = (i, j) => j * NA + (((i % NA) + NA) % NA);

for (let j = 0; j < NP - 1; j++) {
  for (let i = 0; i < NA; i++) {
    quads.push({ v: [vid(i, j), vid(i + 1, j), vid(i + 1, j + 1), vid(i, j + 1)], part: 'body' });
  }
}

// ---------- anse: tubi ad arco ----------
const HANDLE_CTRL = [[0.19, 0.88], [0.42, 0.93], [0.72, 0.88], [0.86, 0.76], [0.8, 0.64], [0.55, 0.58]]; // [raggio, altezza 0..1]
for (let h = 0; h < 2; h++) {
  const phi = h * Math.PI;
  const radial = [Math.cos(phi), 0, Math.sin(phi)];
  const binormal = [-Math.sin(phi), 0, Math.cos(phi)];
  const path = resample(catmullRom(HANDLE_CTRL, 12), HANDLE_PATH).map(([r, y]) => add(mul(radial, r), [0, (y - 0.5) * H, 0]));
  const base = outerP.length;
  for (let k = 0; k < HANDLE_PATH; k++) {
    const t = norm(sub(path[Math.min(HANDLE_PATH - 1, k + 1)], path[Math.max(0, k - 1)]));
    const nrm = norm(cross(binormal, t));
    for (let m = 0; m < HANDLE_RING; m++) {
      const a = (2 * Math.PI * m) / HANDLE_RING;
      const dir = add(mul(nrm, Math.cos(a)), mul(binormal, Math.sin(a)));
      outerP.push(add(path[k], mul(dir, HANDLE_R)));
      outerN.push(dir);
      innerP.push(null);
      innerN.push(null);
    }
  }
  const hv = (k, m) => base + k * HANDLE_RING + (((m % HANDLE_RING) + HANDLE_RING) % HANDLE_RING);
  for (let k = 0; k < HANDLE_PATH - 1; k++) {
    for (let m = 0; m < HANDLE_RING; m++) {
      quads.push({ v: [hv(k, m), hv(k, m + 1), hv(k + 1, m + 1), hv(k + 1, m)], part: `handle${h}` });
    }
  }
}

for (const q of quads) q.centroid = mul(q.v.map((id) => outerP[id]).reduce(add), 0.25);

// ---------- semi e assegnazione dei frammenti ----------
function pickSeeds(part, count) {
  const cand = quads.filter((q) => q.part === part);
  const seeds = [];
  for (let s = 0; s < count; s++) {
    let best = null, bestD = -1;
    for (let t = 0; t < 30; t++) {
      const q = cand[Math.floor(rnd() * cand.length)];
      const d = seeds.length ? Math.min(...seeds.map((x) => len(sub(x.pos, q.centroid)))) : 1;
      if (d > bestD) {
        bestD = d;
        best = q;
      }
    }
    seeds.push({ pos: best.centroid, w: rnd() * 0.012, part });
  }
  return seeds;
}
const seeds = [...pickSeeds('body', BODY_SEEDS), ...pickSeeds('handle0', HANDLE_SEEDS), ...pickSeeds('handle1', HANDLE_SEEDS)];

// Distorsione a due ottave: i bordi tra frammenti diventano curvi e irregolari.
function warp(p) {
  const w = (o) =>
    (noise3(p[0] * 5 + o, p[1] * 5 + o * 1.7, p[2] * 5 - o) - 0.5) * 0.14 +
    (noise3(p[0] * 13 - o, p[1] * 13 + o, p[2] * 13 + o * 2.3) - 0.5) * 0.08 +
    (noise3(p[0] * 29 + o, p[1] * 29 - o, p[2] * 29 + o) - 0.5) * 0.04;
  return [p[0] + w(11.3), p[1] + w(27.9), p[2] + w(43.1)];
}
const cellOf = quads.map((q) => {
  const c = warp(q.centroid);
  let best = -1, bestD = Infinity;
  seeds.forEach((s, k) => {
    if (s.part !== q.part) return;
    const d = dot(sub(c, s.pos), sub(c, s.pos)) - s.w;
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  });
  return best;
});

// ---------- adiacenze ----------
const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const edgeQuads = new Map();
quads.forEach((q, qi) => {
  for (let e = 0; e < 4; e++) {
    const a = q.v[e], b = q.v[(e + 1) % 4];
    const k = edgeKey(a, b);
    if (!edgeQuads.has(k)) edgeQuads.set(k, { a, b, quads: [] });
    edgeQuads.get(k).quads.push(qi);
  }
});
const neighbours = quads.map(() => []);
for (const e of edgeQuads.values()) {
  if (e.quads.length === 2) {
    neighbours[e.quads[0]].push(e.quads[1]);
    neighbours[e.quads[1]].push(e.quads[0]);
  }
}

// Componenti connesse per cella; i pezzetti minuscoli si fondono con il vicino.
let shardOf = new Array(quads.length).fill(-1);
function labelComponents() {
  shardOf = new Array(quads.length).fill(-1);
  let n = 0;
  for (let s = 0; s < quads.length; s++) {
    if (shardOf[s] !== -1) continue;
    const stack = [s];
    shardOf[s] = n;
    while (stack.length) {
      const cur = stack.pop();
      for (const nb of neighbours[cur]) {
        if (shardOf[nb] === -1 && cellOf[nb] === cellOf[s]) {
          shardOf[nb] = n;
          stack.push(nb);
        }
      }
    }
    n++;
  }
  return n;
}
let shardCount = labelComponents();
for (let pass = 0; pass < 8; pass++) {
  const size = new Array(shardCount).fill(0);
  shardOf.forEach((s) => size[s]++);
  let changed = false;
  for (let s = 0; s < shardCount; s++) {
    if (size[s] >= 6) continue;
    const votes = new Map();
    quads.forEach((_, qi) => {
      if (shardOf[qi] !== s) return;
      for (const nb of neighbours[qi]) if (shardOf[nb] !== s) votes.set(cellOf[nb], (votes.get(cellOf[nb]) ?? 0) + 1);
    });
    const target = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    if (target) {
      quads.forEach((_, qi) => {
        if (shardOf[qi] === s) cellOf[qi] = target[0];
      });
      changed = true;
    }
  }
  if (!changed) break;
  shardCount = labelComponents();
}
if (shardCount > MAX_SHARDS) throw new Error(`troppi frammenti: ${shardCount}`);

// ---------- costruzione dei frammenti ----------
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('vase');
const shardMat = doc.createMaterial('shard').setBaseColorFactor([0.7, 0.38, 0.23, 1]).setDoubleSided(true);
const seamMat = doc.createMaterial('seam').setBaseColorFactor([0.79, 0.64, 0.29, 1]).setDoubleSided(true);

const shards = Array.from({ length: shardCount }, () => ({ pos: [], nrm: [], kind: [], idx: [], map: new Map() }));

// kind: 0 = superficie esterna, 1 = interna, 2 = parete di frattura (argilla cruda)
function shardVertex(sh, key, p, n, kind) {
  let i = sh.map.get(key);
  if (i === undefined) {
    i = sh.pos.length / 3;
    sh.pos.push(...p);
    sh.nrm.push(...n);
    sh.kind.push(kind);
    sh.map.set(key, i);
  }
  return i;
}

function pushTri(sh, ia, ib, ic, refNormal) {
  const p = (i) => [sh.pos[3 * i], sh.pos[3 * i + 1], sh.pos[3 * i + 2]];
  const c = cross(sub(p(ib), p(ia)), sub(p(ic), p(ia)));
  if (len(c) < 1e-12) return; // triangolo degenere (ai poli)
  if (dot(c, refNormal) < 0) sh.idx.push(ia, ic, ib);
  else sh.idx.push(ia, ib, ic);
}

function addQuadLayer(sh, ids, P, N, layer) {
  const vi = ids.map((id) => shardVertex(sh, `${layer}:${id}`, P[id], N[id], layer));
  const ref = ids.map((id) => N[id]).reduce(add);
  pushTri(sh, vi[0], vi[1], vi[2], ref);
  pushTri(sh, vi[0], vi[2], vi[3], ref);
}

quads.forEach((q, qi) => {
  const sh = shards[shardOf[qi]];
  addQuadLayer(sh, q.v, outerP, outerN, 0);
  if (q.part === 'body') addQuadLayer(sh, q.v, innerP, innerN, 1);
});

// Pareti della frattura (spessore) e del bordo della bocca, solo sul corpo.
let wallCount = 0;
function addWall(sh, a, b, refDir) {
  const p = [outerP[a], outerP[b], innerP[b], innerP[a]];
  const n0 = norm(cross(sub(p[1], p[0]), sub(p[3], p[0])));
  const nn = dot(n0, refDir) < 0 ? mul(n0, -1) : n0;
  const base = sh.pos.length / 3;
  p.forEach((v) => {
    sh.pos.push(...v);
    sh.nrm.push(...nn);
    sh.kind.push(2);
  });
  const c = cross(sub(p[1], p[0]), sub(p[2], p[0]));
  if (dot(c, nn) < 0) sh.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  else sh.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  wallCount++;
}

const seamEdges = new Map(); // "a-b" (frammenti) -> lista di bordi
for (const e of edgeQuads.values()) {
  const isBody = quads[e.quads[0]].part === 'body';
  if (e.quads.length === 1) {
    if (isBody && len(sub(outerP[e.a], outerP[e.b])) > 1e-6) {
      const qi = e.quads[0];
      const mid = mul(add(outerP[e.a], outerP[e.b]), 0.5);
      addWall(shards[shardOf[qi]], e.a, e.b, sub(mid, quads[qi].centroid));
    }
    continue;
  }
  const [qa, qb] = e.quads;
  const sa = shardOf[qa], sb = shardOf[qb];
  if (sa === sb) continue;
  if (len(sub(outerP[e.a], outerP[e.b])) < 1e-6) continue;
  if (isBody) {
    addWall(shards[sa], e.a, e.b, sub(quads[qb].centroid, quads[qa].centroid));
    addWall(shards[sb], e.a, e.b, sub(quads[qa].centroid, quads[qb].centroid));
  }
  const key = `${Math.min(sa, sb)}-${Math.max(sa, sb)}`;
  if (!seamEdges.has(key)) seamEdges.set(key, []);
  seamEdges.get(key).push([e.a, e.b]);
}

const acc = (type, arr, Type = Float32Array) => doc.createAccessor().setType(type).setArray(new Type(arr)).setBuffer(buffer);
shards.forEach((sh, i) => {
  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', acc('VEC3', sh.pos))
    .setAttribute('NORMAL', acc('VEC3', sh.nrm))
    .setAttribute('_KIND', acc('SCALAR', sh.kind))
    .setIndices(acc('SCALAR', sh.idx, Uint32Array))
    .setMaterial(shardMat);
  scene.addChild(doc.createNode(`shard_${pad(i)}`).setMesh(doc.createMesh(`shard_${pad(i)}`).addPrimitive(prim)));
});

// ---------- giunture: nastri d'oro lungo i bordi reali, a spessore variabile ----------
function buildChains(edges) {
  const adj = new Map();
  edges.forEach(([a, b], k) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push({ to: b, k });
    adj.get(b).push({ to: a, k });
  });
  const used = new Set();
  const chains = [];
  const walk = (start) => {
    const chain = [start];
    let cur = start;
    for (;;) {
      const next = (adj.get(cur) ?? []).find((x) => !used.has(x.k));
      if (!next) break;
      used.add(next.k);
      chain.push(next.to);
      cur = next.to;
    }
    return chain;
  };
  for (const [v, list] of adj) {
    if (list.length === 1 && !used.has(list[0].k)) chains.push(walk(v));
  }
  for (const [v] of adj) {
    if ((adj.get(v) ?? []).some((x) => !used.has(x.k))) chains.push(walk(v));
  }
  return chains;
}

function smooth(points, closed, iterations) {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    const cur = pts;
    pts = cur.map((p, i) => {
      if (!closed && (i === 0 || i === cur.length - 1)) return p;
      const a = cur[(i - 1 + cur.length) % cur.length];
      const b = cur[(i + 1) % cur.length];
      return add(add(mul(a, 0.25), mul(p, 0.5)), mul(b, 0.25));
    });
  }
  return pts;
}

let irregSum = 0, irregN = 0, seamCount = 0;
for (const [key, edges] of seamEdges) {
  const [sa, sb] = key.split('-').map(Number);
  const pos = [], nrm = [], uv = [], idx = [];
  for (const chain of buildChains(edges)) {
    if (chain.length < 2) continue;
    const closed = chain[0] === chain[chain.length - 1];
    const pts = smooth(chain.map((v) => outerP[v]), closed, 1);
    const nrms = chain.map((v) => outerN[v]);
    const m = pts.length;

    let pathLen = 0;
    for (let k = 1; k < m; k++) pathLen += len(sub(pts[k], pts[k - 1]));
    if (!closed && pathLen > 0.25) {
      irregSum += pathLen / (len(sub(pts[m - 1], pts[0])) || 1);
      irregN++;
    }

    const noiseSeed = rnd() * 100;
    const base = pos.length / 3;
    for (let k = 0; k < m; k++) {
      const prev = pts[closed ? (k - 1 + m) % m : Math.max(0, k - 1)];
      const next = pts[closed ? (k + 1) % m : Math.min(m - 1, k + 1)];
      const tng = norm(sub(next, prev));
      const n = norm(nrms[k]);
      const side = norm(cross(n, tng));
      const w = 0.011 + 0.03 * Math.pow(noise3(k * 0.22 + noiseSeed, noiseSeed * 0.7, 3.1), 1.5);
      const c = add(pts[k], mul(n, SEAM_LIFT));
      for (const sgn of [1, -1]) {
        pos.push(...add(c, mul(side, (w / 2) * sgn)));
        nrm.push(...n);
        uv.push(k / (m - 1), sgn > 0 ? 1 : 0); // v = coordinata trasversale (bordi del nastro)
      }
    }
    for (let k = 0; k < m - 1; k++) {
      const a = base + 2 * k;
      idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  }
  if (!idx.length) continue;
  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', acc('VEC3', pos))
    .setAttribute('NORMAL', acc('VEC3', nrm))
    .setAttribute('TEXCOORD_0', acc('VEC2', uv))
    .setIndices(acc('SCALAR', idx, Uint32Array))
    .setMaterial(seamMat);
  const name = `seam_${pad(sa)}_${pad(sb)}`;
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  seamCount++;
}

const maxRadius = Math.max(...profile.map((p) => p.r));
const neckRadius = Math.min(...profile.filter((_, i) => i > NP * 0.55 && i < NP * 0.9).map((p) => p.r));
doc.getRoot().setExtras({
  shardCount,
  seamCount,
  seamIrregularity: irregN ? irregSum / irregN : 0,
  profile: { height: H, maxRadius, neckRadius },
  handles: 2,
});

mkdirSync('models-src', { recursive: true });
await new NodeIO().write('models-src/vase.raw.glb', doc);
console.log(
  `wrote models-src/vase.raw.glb: ${shardCount} shards, ${seamCount} seams, ${wallCount} walls, irregolarità giunture ${(irregSum / (irregN || 1)).toFixed(2)}`,
);
