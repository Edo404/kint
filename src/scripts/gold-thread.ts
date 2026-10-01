// Filo d'oro: una giuntura irregolare che scende dall'apertura al vaso nella chiusura e si disegna
// con lo scroll, con un punto luminoso in testa. Dove passa la testa si aprono piccole crepe laterali.
// Il tracciato è spezzato in tratti: a ogni frame cambia solo il tratto sotto la testa (ridisegno piccolo).
// Con "riduci movimento" il filo è già tutto disegnato e fermo.

import { rng } from '../lib/shard';

const NS = 'http://www.w3.org/2000/svg';
// rng ha un seme fisso: il filo ha sempre la stessa forma.

interface Pt { x: number; y: number }
interface Chunk { y0: number; y1: number; paths: SVGPathElement[]; drawn: number }
interface Branch { y: number; el: SVGPathElement; lit: boolean }

const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');

function makePath(cls: string, pts: Pt[]): SVGPathElement {
  const el = document.createElementNS(NS, 'path');
  el.setAttribute('class', cls);
  el.setAttribute('d', toD(pts));
  el.setAttribute('pathLength', '1');
  return el;
}

// Punto del filo all'altezza y: il filo scende sempre, basta interpolare tra due punti.
export function pointAt(pts: Pt[], y: number): Pt | null {
  if (!pts.length || y < pts[0].y) return null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (y <= b.y) {
      const t = (y - a.y) / Math.max(1, b.y - a.y);
      return { x: a.x + (b.x - a.x) * t, y };
    }
  }
  return pts[pts.length - 1];
}

// Tracciato principale: andamento a onda lenta + scarti brevi, come una crepa ricucita.
// Nell'ultimo tratto converge al centro, dove la chiusura mostra il vaso ricomposto.
export function threadPoints(W: number, y0: number, y1: number, seed = 7): Pt[] {
  const rand = rng(seed);
  const cx = W / 2;
  const amp = Math.min(W * (W < 700 ? 0.3 : 0.34), 460);
  const phase = rand() * Math.PI * 2;
  const pts: Pt[] = [{ x: cx, y: y0 }];
  let y = y0;
  while (y < y1) {
    y = Math.min(y1, y + 55 + rand() * 85);
    const t = (y - y0) / Math.max(1, y1 - y0);
    const toCenter = Math.min(1, Math.max(0, (y1 - y) / 700));
    const wave = Math.sin(t * Math.PI * 7 + phase) * 0.75 + Math.sin(t * Math.PI * 17 + phase * 2) * 0.25;
    pts.push({ x: cx + (wave * amp + (rand() - 0.5) * 46) * toCenter, y });
  }
  return pts;
}

export function initGoldThread(): void {
  const svg = document.querySelector<SVGSVGElement>('[data-thread]');
  const main = svg?.parentElement;
  const chunksG = svg?.querySelector<SVGGElement>('[data-thread-chunks]');
  const branchesG = svg?.querySelector<SVGGElement>('[data-thread-branches]');
  const head = svg?.querySelector<SVGGElement>('[data-thread-head]');
  const start = document.getElementById('kint');
  const end = document.getElementById('closing');
  if (!svg || !main || !chunksG || !branchesG || !head || !start || !end) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pts: Pt[] = [];
  let chunks: Chunk[] = [];
  let branches: Branch[] = [];
  let mainTop = 0;
  let builtW = 0;
  let builtH = 0;
  const topOf = (el: Element) => el.getBoundingClientRect().top + scrollY - mainTop;

  const build = () => {
    const W = main.clientWidth;
    const H = main.offsetHeight;
    builtW = W;
    builtH = H;
    mainTop = main.getBoundingClientRect().top + scrollY;
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const y0 = topOf(start) + 40;
    const y1 = topOf(end) + end.offsetHeight * 0.14;
    pts = threadPoints(W, y0, y1);

    chunksG.replaceChildren();
    chunks = [];
    for (let i = 0; i < pts.length - 1; i += 8) {
      const seg = pts.slice(i, Math.min(pts.length, i + 9));
      const paths = [makePath('thread-glow', seg), makePath('thread-core', seg)];
      paths.forEach((p) => chunksG.append(p));
      chunks.push({ y0: seg[0].y, y1: seg[seg.length - 1].y, paths, drawn: -1 });
    }

    // Crepe laterali: all'inizio di ogni sezione e ogni tanto lungo il filo.
    const rand = rng(11);
    branchesG.replaceChildren();
    branches = [];
    const origins: number[] = [];
    for (const id of ['kint', 'settori', 'servizi', 'contatti']) {
      const s = document.getElementById(id);
      if (s) origins.push(topOf(s) + 120);
    }
    for (let oy = y0 + 420; oy < y1 - 500; oy += 520 + rand() * 380) origins.push(oy);
    const small = W < 700;
    for (const oy of origins) {
      const o = pointAt(pts, oy);
      if (!o) continue;
      const n = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < n; k++) {
        const dir = k % 2 ? 1 : -1;
        const len = (small ? 50 : 90) + rand() * (small ? 60 : 130);
        const steps = 3 + Math.floor(rand() * 2);
        const seg: Pt[] = [o];
        let p = o;
        for (let s = 0; s < steps; s++) {
          p = { x: p.x + dir * (len / steps) * (0.6 + rand() * 0.8), y: p.y + (rand() - 0.35) * (len / steps) };
          seg.push(p);
        }
        const el = makePath('thread-branch', seg);
        branchesG.append(el);
        branches.push({ y: oy, el, lit: false });
      }
    }
    update(true);
  };

  let queued = false;
  const update = (force = false) => {
    queued = false;
    if (!pts.length) return;
    const last = pts[pts.length - 1].y;
    const hy = reduce ? Infinity : scrollY - mainTop + innerHeight * 0.62;
    for (const c of chunks) {
      const f = Math.min(1, Math.max(0, (hy - c.y0) / Math.max(1, c.y1 - c.y0)));
      const q = Math.round(f * 1000) / 1000;
      if (q === c.drawn && !force) continue;
      c.drawn = q;
      c.paths.forEach((p) => p.style.setProperty('stroke-dashoffset', String(1 - q)));
    }
    for (const b of branches) {
      const on = hy > b.y;
      if (on !== b.lit || force) {
        b.lit = on;
        b.el.classList.toggle('is-lit', on);
      }
    }
    const h = !reduce && hy > pts[0].y && hy < last + 240 ? pointAt(pts, Math.min(hy, last)) : null;
    head.style.opacity = h ? '1' : '0';
    if (h) head.setAttribute('transform', `translate(${h.x.toFixed(1)} ${h.y.toFixed(1)})`);
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => update());
  };

  // Ricostruzione quando cambia la larghezza o l'altezza della pagina (font, schede, comparse).
  let timer = 0;
  const rebuildSoon = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (main.clientWidth !== builtW || Math.abs(main.offsetHeight - builtH) > 40) build();
    }, 200);
  };
  build();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', rebuildSoon, { passive: true });
  addEventListener('load', rebuildSoon);
  if ('ResizeObserver' in window) new ResizeObserver(rebuildSoon).observe(main);
  svg.setAttribute('data-ready', '');
}
