// Forme per le sezioni "coperte": bordo frastagliato come un coccio rotto e trama di venature d'oro.
// Tutto è deterministico (seme fisso): stessa forma a ogni build, niente differenze tra lingue.

export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface EdgePt { x: number; y: number } // x in %, y in px dal bordo (0 = filo esterno)

// Bordo da coccio: segmenti dritti a lunghezza e profondità irregolare, da 0% a 100%.
export function jaggedEdge(seed: number, depth = 28): EdgePt[] {
  const rand = rng(seed);
  const pts: EdgePt[] = [{ x: 0, y: depth * (0.3 + rand() * 0.5) }];
  let x = 0;
  while (x < 100) {
    x = Math.min(100, x + 3 + rand() * 9);
    pts.push({ x, y: depth * (0.08 + rand() * 0.92) });
  }
  return pts;
}

const r = (n: number) => Math.round(n * 100) / 100;

// clip-path della sezione: bordo alto e bordo basso frastagliati, lati dritti.
export function shardClip(top: EdgePt[], bottom: EdgePt[]): string {
  const t = top.map((p) => `${r(p.x)}% ${r(p.y)}px`);
  const b = [...bottom].reverse().map((p) => `${r(p.x)}% calc(100% - ${r(p.y)}px)`);
  return `polygon(${[...t, ...b].join(', ')})`;
}

// Tracciato SVG del bordo (viewBox 0 0 w depth): la cucitura d'oro sul taglio.
// w = 1440 tiene lo spessore del tratto quasi uniforme quando l'SVG si allarga a tutta pagina.
export function edgePath(pts: EdgePt[], depth: number, flip = false, w = 1440): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r((p.x * w) / 100)} ${r(flip ? depth - p.y : p.y)}`).join(' ');
}

// Trama di venature d'oro (immagine SVG da usare come sfondo ripetuto, colore e opacità dal CSS).
export function veinTile(seed: number, size = 900): string {
  const rand = rng(seed);
  const paths: string[] = [];
  for (let k = 0; k < 9; k++) {
    let x = rand() * size;
    let y = rand() * size;
    let a = rand() * Math.PI * 2;
    const d: string[] = [`M${x.toFixed(0)} ${y.toFixed(0)}`];
    const steps = 6 + Math.floor(rand() * 8);
    for (let s = 0; s < steps; s++) {
      a += (rand() - 0.5) * 1.1;
      const len = 20 + rand() * 60;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      d.push(`L${x.toFixed(0)} ${y.toFixed(0)}`);
    }
    paths.push(`<path d="${d.join('')}" stroke-width="${(0.6 + rand() * 1.1).toFixed(1)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g fill="none" stroke="#e5be62" stroke-linecap="round" stroke-linejoin="round">${paths.join('')}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
