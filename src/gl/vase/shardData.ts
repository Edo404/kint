export type Vec3 = [number, number, number];

export interface ShardParams {
  center: Vec3;
  scatter: Vec3;
  axis: Vec3;
  angle: number;
  start: number;
  end: number;
}

// La giuntura comincia SEAM_LEAD prima che arrivi il frammento più lento e dura SEAM_SPAN.
export const SEAM_LEAD = 0.06;
export const SEAM_SPAN = 0.22;
export const SEAM_MAX = 0.95;

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Parametri di movimento di ogni frammento: deterministici, generati a runtime dal seme.
export function makeShardParams(centers: Vec3[], seed = 1234): ShardParams[] {
  const rand = mulberry32(seed);
  const range = (lo: number, hi: number) => lo + (hi - lo) * rand();

  return centers.map((center) => {
    const dir = range(0, 2 * Math.PI);
    const rad = range(1.5, 3.5);
    const scatter: Vec3 = [Math.cos(dir) * rad, Math.sin(dir) * rad, range(-1, 1)];
    const raw: Vec3 = [range(-1, 1), range(-1, 1), range(-1, 1)];
    const len = Math.hypot(...raw) || 1;
    return {
      center,
      scatter,
      axis: [raw[0] / len, raw[1] / len, raw[2] / len],
      angle: range(Math.PI / 2, 2 * Math.PI),
      start: range(0, 0.15),
      end: range(0.55, 0.85),
    };
  });
}

export function seamWindow(endA: number, endB: number): { start: number; end: number } {
  const start = Math.max(endA, endB) - SEAM_LEAD;
  return { start, end: Math.min(SEAM_MAX, start + SEAM_SPAN) };
}

export function shardCentersFromGeometry(
  positions: ArrayLike<number>,
  ids: ArrayLike<number>,
  count: number,
): Vec3[] {
  const sum = Array.from({ length: count }, () => [0, 0, 0, 0]);
  for (let i = 0; i < ids.length; i++) {
    const s = sum[ids[i]];
    s[0] += positions[3 * i];
    s[1] += positions[3 * i + 1];
    s[2] += positions[3 * i + 2];
    s[3] += 1;
  }
  return sum.map((s) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : [0, 0, 0]) as Vec3);
}

// Texture RGBA float, larghezza = numero di frammenti, altezza 3:
//   riga 0: centro.xyz, angolo   riga 1: dispersione.xyz, inizio   riga 2: asse.xyz, fine
export function packShardTexture(params: ShardParams[]): Float32Array {
  const n = params.length;
  const data = new Float32Array(n * 3 * 4);
  params.forEach((p, i) => {
    data.set([...p.center, p.angle], (0 * n + i) * 4);
    data.set([...p.scatter, p.start], (1 * n + i) * 4);
    data.set([...p.axis, p.end], (2 * n + i) * 4);
  });
  return data;
}
