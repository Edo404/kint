// Forme per le sezioni "coperte": bordo frastagliato come un coccio rotto e polvere d'oro sulla lacca.
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

// Lacca nera con polvere d'oro (nashiji): scaglie minuscole e irregolari sparse, un po' più fitte a nuvole.
// Immagine SVG da usare come sfondo ripetuto; colore e opacità dal CSS.
export function flakeTile(seed: number, size = 640): string {
  const rand = rng(seed);
  const flakes: string[] = [];
  // tre "nuvole" dove la polvere si addensa, il resto è sparso
  const clouds = [0, 1, 2].map(() => ({ x: rand() * size, y: rand() * size }));
  for (let k = 0; k < 300; k++) {
    let x = rand() * size;
    let y = rand() * size;
    if (k % 3 === 0) {
      const c = clouds[k % clouds.length];
      x = (c.x + (rand() - 0.5) * size * 0.35 + size) % size;
      y = (c.y + (rand() - 0.5) * size * 0.35 + size) % size;
    }
    const r = 0.5 + rand() * rand() * 2.2;
    const a = rand() * Math.PI * 2;
    // scaglia: quadrilatero schiacciato e ruotato
    const pt = (t: number, k2: number) => `${(x + Math.cos(a + t) * r * k2).toFixed(1)} ${(y + Math.sin(a + t) * r * k2).toFixed(1)}`;
    flakes.push(`<path d="M${pt(0, 1)}L${pt(1.9, 0.55)}L${pt(Math.PI, 0.9)}L${pt(4.6, 0.5)}Z" fill-opacity="${(0.3 + rand() * 0.7).toFixed(1)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g fill="#e5be62">${flakes.join('')}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
