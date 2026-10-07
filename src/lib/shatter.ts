// Frattura del logo dell'apertura: un rettangolo spezzato in cocci convessi con tagli successivi.
// Ogni taglio divide il coccio più grande lungo una retta che passa vicino al suo centro, quindi le crepe
// finiscono contro crepe già esistenti (giunzioni a T), come in una ceramica rotta. Seme fisso: forma stabile.
import { rng } from './shard';

export type P = [number, number];

export interface Shatter {
  cells: P[][];
  cracks: [P, P][];
}

const area = (poly: P[]) =>
  Math.abs(poly.reduce((s, [x, y], i) => {
    const [x2, y2] = poly[(i + 1) % poly.length];
    return s + x * y2 - x2 * y;
  }, 0)) / 2;

export const centroid = (poly: P[]): P => {
  const n = poly.length;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
};

// Divide un poligono convesso con la retta per `o` di direzione `d`. Restituisce i due pezzi e la corda.
function split(poly: P[], o: P, d: P): [P[], P[], [P, P]] | null {
  const side = (p: P) => (p[0] - o[0]) * d[1] - (p[1] - o[1]) * d[0];
  const a: P[] = [];
  const b: P[] = [];
  const cut: P[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    (sp >= 0 ? a : b).push(p);
    if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) {
      const t = sp / (sp - sq);
      const x: P = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      a.push(x);
      b.push(x);
      cut.push(x);
    }
  }
  if (a.length < 3 || b.length < 3 || cut.length !== 2) return null;
  return [a, b, [cut[0], cut[1]]];
}

export function shatter(w: number, h: number, pieces: number, seed: number): Shatter {
  const rand = rng(seed);
  let cells: P[][] = [[[0, 0], [w, 0], [w, h], [0, h]]];
  const cracks: [P, P][] = [];
  let guard = 0;
  while (cells.length < pieces && guard++ < 200) {
    cells.sort((p, q) => area(q) - area(p));
    const big = cells[0];
    const [cx, cy] = centroid(big);
    // Tagli più verticali che orizzontali: le lettere restano leggibili.
    const ang = Math.PI / 2 + (rand() - 0.5) * 1.6;
    const o: P = [cx + (rand() - 0.5) * 30, cy + (rand() - 0.5) * 30];
    const r = split(big, o, [Math.cos(ang), Math.sin(ang)]);
    if (!r) continue;
    cells = [r[0], r[1], ...cells.slice(1)];
    cracks.push(r[2]);
  }
  return { cells, cracks };
}

// Crepa con piccoli scarti perpendicolari: la cucitura d'oro non è mai una riga dritta.
export function jaggedCrack([a, b]: [P, P], seed: number, steps = 4, amp = 3): P[] {
  const rand = rng(seed);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: P[] = [a];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const j = (rand() - 0.5) * 2 * amp;
    pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
  }
  pts.push(b);
  return pts;
}

export const polyPoints = (poly: P[]) => poly.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
export const polyArea = area;
