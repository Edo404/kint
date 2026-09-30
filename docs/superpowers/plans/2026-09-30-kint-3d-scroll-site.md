# Kint 3D Scroll Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire un sito con un modello 3D guidato dallo scroll, fluido e leggero, con fallback statico quando WebGL non è disponibile.

**Architecture:** Un solo `<canvas>` fisso dietro il contenuto HTML. Three.js (import selettivi) disegna un modello GLB compresso con Meshopt. Il rendering è on-demand: un `RenderScheduler` disegna solo quando qualcosa cambia. Lenis smorza lo scroll e una timeline GSAP con ScrollTrigger interpola una "posa" (posizione/rotazione del modello e distanza della camera) tra le sezioni. Un `PerfGovernor` abbassa il pixel ratio se gli fps calano.

**Tech Stack:** Vite, TypeScript, Three.js, GSAP (ScrollTrigger), Lenis, glTF Transform (CLI), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-30-kint-3d-scroll-site-design.md`

## Global Constraints

- Build: Vite, vanilla TypeScript, nessun framework UI.
- Three.js solo con import nominali (mai `import * as THREE`), per il tree-shaking.
- Budget pagina: sotto 300 KB (modello escluso, contati in gzip); modello sotto 1.5 MB; LCP sotto 2.5 s su 4G.
- Pixel ratio: `min(devicePixelRatio, 2)`, 1.5 su dispositivi deboli; degradazione a runtime sotto 45 fps.
- Rendering on-demand: nessun loop continuo, nessuna ombra in tempo reale.
- Sotto `prefers-reduced-motion`: pose statiche tra le sezioni, nessuna animazione continua.
- Mobile: scroll nativo, nessun hijacking pesante.
- WebGL assente o modello non caricato: mostrare l'immagine statica di fallback, il sito resta usabile.
- Modello: GLB con compressione Meshopt, texture KTX2 quando presenti.
- Contenuto e SEO nell'HTML semantico, fuori dal canvas.
- `CLAUDE.md` (già presente) è la documentazione del progetto: ogni task che aggiunge, sposta o rimuove file in `src/` o `scripts/`, cambia un comando npm o un budget, aggiorna `CLAUDE.md` e la data in cima nello stesso commit.

## File Structure

```
package.json, tsconfig.json, vite.config.ts, .gitignore, index.html
public/fallback.svg                 immagine di fallback
public/models/kint.glb              modello (placeholder finché non c'è quello di Blender)
scripts/copy-basis.mjs              copia il transcoder KTX2 in public/basis
scripts/make-placeholder-model.mjs  genera il modello placeholder
scripts/check-budget.mjs            verifica i budget di peso su dist/
src/main.ts                         composizione di tutto
src/style.css                       stile e modalità fallback
src/support/webgl.ts                rilevamento WebGL e modalità
src/three/renderScheduler.ts        rendering on-demand
src/three/scene.ts                  renderer, camera, luci
src/three/loadModel.ts              caricamento GLB
src/perf/governor.ts                degradazione del pixel ratio
src/scroll/poses.ts                 pose per sezione e applicazione allo stato
src/scroll/scroll.ts                Lenis + GSAP ScrollTrigger
tests/*.test.ts
```

---

### Task 1: Scaffold del progetto

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`, `src/style.css`, `src/main.ts`, `public/fallback.svg`, `scripts/copy-basis.mjs`

**Interfaces:**
- Produces: script npm `dev`, `build`, `test`, `preview`; la struttura DOM (`#stage`, `#fallback`, `#loader`, `#loader-bar`, `#notice`, `#story` con le sezioni `#hero`, `#detail`, `#features`, `#cta`).

- [ ] **Step 1: Inizializzare e installare le dipendenze**

Run (dalla radice del repo):
```bash
npm init -y
npm install three gsap lenis
npm install -D vite typescript vitest @types/three @gltf-transform/core @gltf-transform/cli
```
Expected: `node_modules/` creato, nessun errore.

- [ ] **Step 2: Scrivere `package.json` degli script**

Sostituire la sezione `scripts` e aggiungere `"type": "module"` in `package.json`:
```json
{
  "name": "kint",
  "private": true,
  "type": "module",
  "scripts": {
    "predev": "node scripts/copy-basis.mjs",
    "dev": "vite",
    "prebuild": "node scripts/copy-basis.mjs",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "model:placeholder": "node scripts/make-placeholder-model.mjs && gltf-transform meshopt public/models/kint.raw.glb public/models/kint.glb",
    "model:optimize": "gltf-transform meshopt public/models/kint.raw.glb public/models/kint.glb",
    "check": "npm test && npm run build && node scripts/check-budget.mjs"
  }
}
```
Mantenere `dependencies` e `devDependencies` scritte da npm.

- [ ] **Step 3: Scrivere `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Scrivere `vite.config.ts`, `.gitignore` e lo script del transcoder**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 400 },
  test: { include: ['tests/**/*.test.ts'] },
});
```

`.gitignore`:
```
node_modules
dist
public/basis
public/models/*.raw.glb
.DS_Store
```

`scripts/copy-basis.mjs`:
```js
import { cpSync, mkdirSync } from 'node:fs';

const from = 'node_modules/three/examples/jsm/libs/basis';
const to = 'public/basis';
mkdirSync(to, { recursive: true });
for (const f of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
  cpSync(`${from}/${f}`, `${to}/${f}`);
}
console.log('basis transcoder copied to', to);
```

- [ ] **Step 5: Scrivere `index.html`, `public/fallback.svg`, `src/style.css`, `src/main.ts`**

`index.html`:
```html
<!doctype html>
<html lang="it" data-mode="webgl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kint</title>
    <meta name="description" content="Kint" />
  </head>
  <body>
    <canvas id="stage" aria-hidden="true"></canvas>
    <img id="fallback" src="/fallback.svg" alt="Il modello Kint" width="640" height="640" />
    <div id="loader" role="status" aria-label="Caricamento"><div id="loader-bar"></div></div>
    <p id="notice" hidden></p>

    <main id="story">
      <section id="hero">
        <div class="copy">
          <h1>Kint</h1>
          <p>Un oggetto da guardare da vicino. Scorri per scoprirlo.</p>
        </div>
      </section>
      <section id="detail" class="right">
        <div class="copy">
          <h2>Ogni dettaglio</h2>
          <p>Superfici, proporzioni e materiali pensati per essere osservati da ogni lato.</p>
        </div>
      </section>
      <section id="features">
        <div class="copy">
          <h2>Leggero per natura</h2>
          <p>Un solo modello, un solo canvas, nessun peso inutile.</p>
        </div>
      </section>
      <section id="cta" class="right">
        <div class="copy">
          <h2>Inizia da qui</h2>
          <p><a href="#hero">Torna all'inizio</a></p>
        </div>
      </section>
    </main>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`public/fallback.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
  <polygon points="320,80 520,320 320,560 120,320" fill="#c9ccd6"/>
  <polygon points="320,80 520,320 320,320" fill="#e6e8ef"/>
  <polygon points="320,560 120,320 320,320" fill="#8e93a3"/>
</svg>
```

`src/style.css`:
```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #0b0b0f; color: #ececf1; font-family: system-ui, sans-serif; }

#stage { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; display: block; }
#fallback { display: none; position: fixed; inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 0; opacity: .9; }
[data-mode='fallback'] #stage { display: none; }
[data-mode='fallback'] #fallback { display: block; }

#story { position: relative; z-index: 1; }
section { min-height: 100svh; display: flex; align-items: center; padding: 0 8vw; }
section.right { justify-content: flex-end; }
.copy { max-width: 28rem; }
h1 { font-size: clamp(3rem, 12vw, 8rem); margin: 0 0 1rem; line-height: 1; }
h2 { font-size: clamp(2rem, 6vw, 3.5rem); margin: 0 0 1rem; }
a { color: inherit; }

#loader { position: fixed; left: 0; right: 0; top: 0; height: 3px; z-index: 5; transition: opacity .4s; }
#loader.done { opacity: 0; pointer-events: none; }
#loader-bar { height: 100%; background: #ececf1; transform: scaleX(0); transform-origin: left; }
#notice { position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); z-index: 5; margin: 0; font-size: .9rem; opacity: .8; }
```

`src/main.ts` (provvisorio, sostituito nel Task 7):
```ts
import './style.css';
```

- [ ] **Step 6: Verificare che build e test partano**

Run: `npm run build`
Expected: `tsc` senza errori e `vite build` termina con `dist/` creato.

Run: `npm test`
Expected: vitest esce con "No test files found" e codice 1 è accettabile solo per questo task; dal Task 2 i test esistono.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + TypeScript project with page structure"
```

---

### Task 2: Rilevamento WebGL e modalità fallback

**Files:**
- Create: `src/support/webgl.ts`
- Test: `tests/webgl.test.ts`

**Interfaces:**
- Produces:
  - `hasWebGL(doc?: { createElement(tag: string): unknown }): boolean`
  - `type Mode = 'webgl' | 'fallback'`
  - `setMode(el: { dataset: Record<string, string | undefined> }, mode: Mode): void` — imposta `el.dataset.mode`.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/webgl.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { hasWebGL, setMode } from '../src/support/webgl';

const docWith = (ctx: (type: string) => unknown) => ({
  createElement: () => ({ getContext: ctx }),
});

describe('hasWebGL', () => {
  it('è true se webgl2 è disponibile', () => {
    expect(hasWebGL(docWith((t) => (t === 'webgl2' ? {} : null)))).toBe(true);
  });
  it('è true se solo webgl è disponibile', () => {
    expect(hasWebGL(docWith((t) => (t === 'webgl' ? {} : null)))).toBe(true);
  });
  it('è false se nessun contesto è disponibile', () => {
    expect(hasWebGL(docWith(() => null))).toBe(false);
  });
  it('è false se getContext lancia', () => {
    expect(
      hasWebGL(
        docWith(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBe(false);
  });
});

describe('setMode', () => {
  it('scrive la modalità in dataset.mode', () => {
    const el = { dataset: {} as Record<string, string | undefined> };
    setMode(el, 'fallback');
    expect(el.dataset.mode).toBe('fallback');
  });
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `npx vitest run tests/webgl.test.ts`
Expected: FAIL, modulo `../src/support/webgl` non trovato.

- [ ] **Step 3: Implementare**

`src/support/webgl.ts`:
```ts
export type Mode = 'webgl' | 'fallback';

type CanvasLike = { getContext(type: string): unknown };

export function hasWebGL(
  doc: { createElement(tag: string): unknown } = document,
): boolean {
  try {
    const canvas = doc.createElement('canvas') as CanvasLike;
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function setMode(
  el: { dataset: Record<string, string | undefined> },
  mode: Mode,
): void {
  el.dataset.mode = mode;
}
```

- [ ] **Step 4: Verificare che passi**

Run: `npx vitest run tests/webgl.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/support/webgl.ts tests/webgl.test.ts
git commit -m "feat: WebGL detection and fallback mode switch"
```

---

### Task 3: RenderScheduler (rendering on-demand)

**Files:**
- Create: `src/three/renderScheduler.ts`
- Test: `tests/renderScheduler.test.ts`

**Interfaces:**
- Produces:
  - `type Raf = (cb: (t: number) => void) => number`, `type Caf = (id: number) => void`
  - `class RenderScheduler { constructor(draw: (dt: number | null) => void, raf: Raf, caf: Caf, isHidden?: () => boolean); request(): void; stop(): void }`
  - `dt` è `null` sul primo frame dopo una pausa (intervallo dal frame precedente ≥ 250 ms) e sul primissimo frame; altrimenti sono i millisecondi dal frame precedente.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/renderScheduler.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { RenderScheduler } from '../src/three/renderScheduler';

function fakeRaf() {
  let queue: Array<(t: number) => void> = [];
  let id = 0;
  return {
    raf: (cb: (t: number) => void) => {
      queue.push(cb);
      return ++id;
    },
    caf: () => {
      queue = [];
    },
    flush(t: number) {
      const q = queue;
      queue = [];
      q.forEach((cb) => cb(t));
    },
    pending: () => queue.length,
  };
}

describe('RenderScheduler', () => {
  it('pianifica un solo frame anche con più richieste', () => {
    const f = fakeRaf();
    const s = new RenderScheduler(() => {}, f.raf, f.caf);
    s.request();
    s.request();
    expect(f.pending()).toBe(1);
  });

  it('non fa nulla finché nessuno lo richiede', () => {
    const f = fakeRaf();
    let draws = 0;
    new RenderScheduler(() => draws++, f.raf, f.caf);
    f.flush(16);
    expect(draws).toBe(0);
  });

  it('passa dt null al primo frame e i millisecondi ai successivi', () => {
    const f = fakeRaf();
    const dts: Array<number | null> = [];
    const s = new RenderScheduler((dt) => dts.push(dt), f.raf, f.caf);
    s.request();
    f.flush(1000);
    s.request();
    f.flush(1016);
    expect(dts).toEqual([null, 16]);
  });

  it('passa dt null dopo una pausa lunga', () => {
    const f = fakeRaf();
    const dts: Array<number | null> = [];
    const s = new RenderScheduler((dt) => dts.push(dt), f.raf, f.caf);
    s.request();
    f.flush(1000);
    s.request();
    f.flush(1300);
    expect(dts).toEqual([null, null]);
  });

  it('ignora le richieste quando la pagina è nascosta', () => {
    const f = fakeRaf();
    let hidden = true;
    const s = new RenderScheduler(() => {}, f.raf, f.caf, () => hidden);
    s.request();
    expect(f.pending()).toBe(0);
    hidden = false;
    s.request();
    expect(f.pending()).toBe(1);
  });

  it('stop annulla il frame pianificato', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.request();
    s.stop();
    f.flush(16);
    expect(draws).toBe(0);
  });
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `npx vitest run tests/renderScheduler.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

`src/three/renderScheduler.ts`:
```ts
export type Raf = (cb: (t: number) => void) => number;
export type Caf = (id: number) => void;

const IDLE_GAP_MS = 250;

export class RenderScheduler {
  private id: number | null = null;
  private last: number | null = null;

  constructor(
    private readonly draw: (dt: number | null) => void,
    private readonly raf: Raf,
    private readonly caf: Caf,
    private readonly isHidden: () => boolean = () => false,
  ) {}

  request(): void {
    if (this.id !== null || this.isHidden()) return;
    this.id = this.raf(this.frame);
  }

  stop(): void {
    if (this.id !== null) this.caf(this.id);
    this.id = null;
    this.last = null;
  }

  private frame = (t: number): void => {
    this.id = null;
    const gap = this.last === null ? null : t - this.last;
    this.last = t;
    this.draw(gap === null || gap >= IDLE_GAP_MS ? null : gap);
  };
}
```

- [ ] **Step 4: Verificare che passi**

Run: `npx vitest run tests/renderScheduler.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/three/renderScheduler.ts tests/renderScheduler.test.ts
git commit -m "feat: on-demand render scheduler"
```

---

### Task 4: PerfGovernor (degradazione del pixel ratio)

**Files:**
- Create: `src/perf/governor.ts`
- Test: `tests/governor.test.ts`

**Interfaces:**
- Produces:
  - `buildPixelRatioLevels(dpr: number, weak: boolean): number[]` — livelli decrescenti, il primo è `min(dpr, weak ? 1.5 : 2)`.
  - `class PerfGovernor { constructor(opts: { levels: number[]; onChange: (pixelRatio: number) => void; minFps?: number; windowSize?: number }); tick(dt: number | null): void; readonly pixelRatio: number }`
  - Default: `minFps = 45`, `windowSize = 30`. `tick(null)` viene ignorato.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/governor.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PerfGovernor, buildPixelRatioLevels } from '../src/perf/governor';

describe('buildPixelRatioLevels', () => {
  it('limita a 2 su schermi densi', () => {
    expect(buildPixelRatioLevels(3, false)).toEqual([2, 1.5, 1.25, 1]);
  });
  it('limita a 1.5 su dispositivi deboli', () => {
    expect(buildPixelRatioLevels(3, true)).toEqual([1.5, 1.25, 1]);
  });
  it('a dpr 1 c\'è un solo livello', () => {
    expect(buildPixelRatioLevels(1, false)).toEqual([1]);
  });
  it('a dpr 1.5 scende senza duplicati', () => {
    expect(buildPixelRatioLevels(1.5, false)).toEqual([1.5, 1.25, 1]);
  });
});

function feed(g: PerfGovernor, dt: number | null, n: number) {
  for (let i = 0; i < n; i++) g.tick(dt);
}

describe('PerfGovernor', () => {
  it('parte dal primo livello', () => {
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: () => {} });
    expect(g.pixelRatio).toBe(2);
  });

  it('non cambia con frame veloci', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, 16, 90);
    expect(calls).toEqual([]);
  });

  it('scende di un livello sotto 45 fps su una finestra piena', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, 30, 30); // ~33 fps
    expect(calls).toEqual([1.5]);
    expect(g.pixelRatio).toBe(1.5);
  });

  it('non scende prima che la finestra sia piena', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, 30, 29);
    expect(calls).toEqual([]);
  });

  it('ignora dt null', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, null, 100);
    expect(calls).toEqual([]);
  });

  it('si ferma all\'ultimo livello', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1], onChange: (p) => calls.push(p) });
    feed(g, 40, 120);
    expect(calls).toEqual([1]);
    expect(g.pixelRatio).toBe(1);
  });
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `npx vitest run tests/governor.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

`src/perf/governor.ts`:
```ts
export function buildPixelRatioLevels(dpr: number, weak: boolean): number[] {
  const first = Math.min(dpr, weak ? 1.5 : 2);
  return [first, 1.5, 1.25, 1].filter((v, i) => i === 0 || v < first);
}

export interface GovernorOptions {
  levels: number[];
  onChange: (pixelRatio: number) => void;
  minFps?: number;
  windowSize?: number;
}

export class PerfGovernor {
  private samples: number[] = [];
  private level = 0;
  private readonly minFps: number;
  private readonly windowSize: number;

  constructor(private readonly opts: GovernorOptions) {
    this.minFps = opts.minFps ?? 45;
    this.windowSize = opts.windowSize ?? 30;
  }

  get pixelRatio(): number {
    return this.opts.levels[this.level];
  }

  tick(dt: number | null): void {
    if (dt === null) return;
    this.samples.push(dt);
    if (this.samples.length < this.windowSize) return;

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    if (1000 / avg < this.minFps && this.level < this.opts.levels.length - 1) {
      this.level++;
      this.opts.onChange(this.pixelRatio);
    }
  }
}
```

- [ ] **Step 4: Verificare che passi**

Run: `npx vitest run tests/governor.test.ts`
Expected: PASS (10 test).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/perf/governor.ts tests/governor.test.ts
git commit -m "feat: performance governor lowering pixel ratio under 45 fps"
```

---

### Task 5: Pose per sezione e applicazione allo stato

**Files:**
- Create: `src/scroll/poses.ts`
- Test: `tests/poses.test.ts`

**Interfaces:**
- Produces:
  - `interface Pose { section: string; position: [number, number, number]; rotation: [number, number, number]; cameraZ: number }`
  - `interface PoseState { x: number; y: number; z: number; rx: number; ry: number; rz: number; camZ: number }`
  - `const POSES: Pose[]` (sezioni `hero`, `detail`, `features`, `cta`, in quest'ordine)
  - `poseToState(p: Pose): PoseState`
  - `validatePoses(poses: Pose[], sectionIds: string[]): string[]` — lista di errori, vuota se valido.
  - `applyState(state: PoseState, model: { position: { set(x: number, y: number, z: number): unknown }; rotation: { set(x: number, y: number, z: number): unknown } }, camera: { position: { z: number } }): void`

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/poses.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { POSES, applyState, poseToState, validatePoses, type Pose } from '../src/scroll/poses';

const IDS = ['hero', 'detail', 'features', 'cta'];

describe('POSES', () => {
  it('è valido rispetto alle sezioni della pagina', () => {
    expect(validatePoses(POSES, IDS)).toEqual([]);
  });
});

describe('validatePoses', () => {
  const ok: Pose = { section: 'hero', position: [0, 0, 0], rotation: [0, 0, 0], cameraZ: 5 };

  it('segnala una sezione inesistente', () => {
    expect(validatePoses([{ ...ok, section: 'nope' }], IDS)).toContain('sezione sconosciuta: nope');
  });
  it('segnala i duplicati', () => {
    expect(validatePoses([ok, ok], IDS)).toContain('sezione duplicata: hero');
  });
  it('segnala valori non finiti', () => {
    const bad = { ...ok, position: [NaN, 0, 0] as Pose['position'] };
    expect(validatePoses([bad], IDS)).toContain('valori non finiti in hero');
  });
  it('segnala cameraZ non positiva', () => {
    expect(validatePoses([{ ...ok, cameraZ: 0 }], IDS)).toContain('cameraZ deve essere > 0 in hero');
  });
  it('segnala l\'ordine diverso da quello della pagina', () => {
    const a = { ...ok, section: 'detail' };
    expect(validatePoses([a, ok], IDS)).toContain('ordine diverso dalla pagina: hero dopo detail');
  });
});

describe('poseToState / applyState', () => {
  it('converte una posa in stato', () => {
    const s = poseToState({ section: 'hero', position: [1, 2, 3], rotation: [4, 5, 6], cameraZ: 7 });
    expect(s).toEqual({ x: 1, y: 2, z: 3, rx: 4, ry: 5, rz: 6, camZ: 7 });
  });

  it('applica lo stato a modello e camera', () => {
    const calls: Record<string, number[]> = {};
    const model = {
      position: { set: (...a: number[]) => (calls.p = a) },
      rotation: { set: (...a: number[]) => (calls.r = a) },
    };
    const camera = { position: { z: 0 } };
    applyState({ x: 1, y: 2, z: 3, rx: 4, ry: 5, rz: 6, camZ: 7 }, model, camera);
    expect(calls.p).toEqual([1, 2, 3]);
    expect(calls.r).toEqual([4, 5, 6]);
    expect(camera.position.z).toBe(7);
  });
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `npx vitest run tests/poses.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

`src/scroll/poses.ts`:
```ts
export interface Pose {
  section: string;
  position: [number, number, number];
  rotation: [number, number, number];
  cameraZ: number;
}

export interface PoseState {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  camZ: number;
}

// Una posa per sezione, nell'ordine della pagina. Il modello sta sul lato
// opposto al testo: nelle sezioni con classe "right" va a sinistra.
export const POSES: Pose[] = [
  { section: 'hero', position: [0, 0, 0], rotation: [0.2, 0, 0], cameraZ: 6 },
  { section: 'detail', position: [-1.4, 0, 0], rotation: [0.4, Math.PI * 0.75, 0], cameraZ: 4 },
  { section: 'features', position: [1.4, 0.2, 0], rotation: [-0.2, Math.PI * 1.5, 0.2], cameraZ: 4.5 },
  { section: 'cta', position: [-1.2, 0, 0], rotation: [0.1, Math.PI * 2, 0], cameraZ: 5.5 },
];

export function poseToState(p: Pose): PoseState {
  return {
    x: p.position[0],
    y: p.position[1],
    z: p.position[2],
    rx: p.rotation[0],
    ry: p.rotation[1],
    rz: p.rotation[2],
    camZ: p.cameraZ,
  };
}

export function validatePoses(poses: Pose[], sectionIds: string[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  let lastIndex = -1;

  for (const p of poses) {
    const index = sectionIds.indexOf(p.section);
    if (index === -1) errors.push(`sezione sconosciuta: ${p.section}`);
    if (seen.has(p.section)) errors.push(`sezione duplicata: ${p.section}`);
    seen.add(p.section);

    if (index !== -1 && index < lastIndex) {
      errors.push(`ordine diverso dalla pagina: ${p.section} dopo ${sectionIds[lastIndex]}`);
    }
    if (index !== -1) lastIndex = Math.max(lastIndex, index);

    if (![...p.position, ...p.rotation, p.cameraZ].every(Number.isFinite)) {
      errors.push(`valori non finiti in ${p.section}`);
    }
    if (!(p.cameraZ > 0)) errors.push(`cameraZ deve essere > 0 in ${p.section}`);
  }
  return errors;
}

type Vec3Like = { set(x: number, y: number, z: number): unknown };

export function applyState(
  s: PoseState,
  model: { position: Vec3Like; rotation: Vec3Like },
  camera: { position: { z: number } },
): void {
  model.position.set(s.x, s.y, s.z);
  model.rotation.set(s.rx, s.ry, s.rz);
  camera.position.z = s.camZ;
}
```

- [ ] **Step 4: Verificare che passi**

Run: `npx vitest run tests/poses.test.ts`
Expected: PASS (8 test).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/scroll/poses.ts tests/poses.test.ts
git commit -m "feat: per-section poses with validation"
```

---

### Task 6: Modello placeholder e loader del GLB

**Files:**
- Create: `scripts/make-placeholder-model.mjs`, `src/three/loadModel.ts`, `public/models/kint.glb` (generato)

**Interfaces:**
- Produces: `loadModel(url: string, renderer: WebGLRenderer, onProgress: (ratio: number) => void): Promise<Group>` — decodifica Meshopt e KTX2 (transcoder in `${import.meta.env.BASE_URL}basis/`).

Il modello finale verrà creato in Blender (vedi il README al Task 9); il placeholder è un ottaedro con normali, generato da script, per poter costruire e provare tutto il resto.

- [ ] **Step 1: Scrivere lo script del placeholder**

`scripts/make-placeholder-model.mjs`:
```js
import { Document, NodeIO } from '@gltf-transform/core';
import { mkdirSync } from 'node:fs';

const S = 1.2;
const positions = [];
const normals = [];
const indices = [];

for (const sx of [1, -1]) {
  for (const sy of [1, -1]) {
    for (const sz of [1, -1]) {
      let tri = [
        [sx * S, 0, 0],
        [0, sy * S, 0],
        [0, 0, sz * S],
      ];
      const [a, b, c] = tri;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      if (n[0] * centroid[0] + n[1] * centroid[1] + n[2] * centroid[2] < 0) {
        tri = [a, c, b];
        n = n.map((x) => -x);
      }
      const len = Math.hypot(...n);
      n = n.map((x) => x / len);
      const base = positions.length / 3;
      for (const p of tri) {
        positions.push(...p);
        normals.push(...n);
      }
      indices.push(base, base + 1, base + 2);
    }
  }
}

const doc = new Document();
const buffer = doc.createBuffer();
const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer);
const normal = doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer);
const index = doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer);

const material = doc
  .createMaterial('kint')
  .setBaseColorFactor([0.85, 0.87, 0.95, 1])
  .setMetallicFactor(0.6)
  .setRoughnessFactor(0.3);

const prim = doc
  .createPrimitive()
  .setAttribute('POSITION', position)
  .setAttribute('NORMAL', normal)
  .setIndices(index)
  .setMaterial(material);

const mesh = doc.createMesh('kint').addPrimitive(prim);
const node = doc.createNode('kint').setMesh(mesh);
doc.createScene('scene').addChild(node);

mkdirSync('public/models', { recursive: true });
await new NodeIO().write('public/models/kint.raw.glb', doc);
console.log('wrote public/models/kint.raw.glb');
```

- [ ] **Step 2: Generare e comprimere il modello**

Run: `npm run model:placeholder`
Expected: stampa `wrote public/models/kint.raw.glb`, poi glTF Transform scrive `public/models/kint.glb`. Verificare con `ls -l public/models` che `kint.glb` esista e pesi pochi KB.

- [ ] **Step 3: Scrivere il loader**

`src/three/loadModel.ts`:
```ts
import type { Group, WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export function loadModel(
  url: string,
  renderer: WebGLRenderer,
  onProgress: (ratio: number) => void,
): Promise<Group> {
  const ktx2 = new KTX2Loader()
    .setTranscoderPath(`${import.meta.env.BASE_URL}basis/`)
    .detectSupport(renderer);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx2);

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        ktx2.dispose();
        resolve(gltf.scene);
      },
      (e) => {
        if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
      },
      (err) => {
        ktx2.dispose();
        reject(err);
      },
    );
  });
}
```

- [ ] **Step 4: Verificare i tipi**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md scripts/make-placeholder-model.mjs src/three/loadModel.ts public/models/kint.glb
git commit -m "feat: placeholder GLB generator and Meshopt/KTX2 model loader"
```

---

### Task 7: Scena e composizione (rendering, performance, resilienza)

**Files:**
- Create: `src/three/scene.ts`
- Modify: `src/main.ts` (sostituzione completa)

**Interfaces:**
- Consumes: `hasWebGL`, `setMode` (Task 2); `RenderScheduler` (Task 3); `PerfGovernor`, `buildPixelRatioLevels` (Task 4); `POSES`, `poseToState`, `applyState`, `PoseState` (Task 5); `loadModel` (Task 6).
- Produces:
  - `createScene(canvas: HTMLCanvasElement, pixelRatio: number): { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera; resize(): void; setPixelRatio(pr: number): void }`
  - `main.ts` espone lo `state: PoseState` condiviso e `scheduler.request` per il Task 8.

- [ ] **Step 1: Scrivere la scena**

`src/three/scene.ts`:
```ts
import { ACESFilmicToneMapping, PMREMGenerator, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function createScene(canvas: HTMLCanvasElement, pixelRatio: number) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;

  // Illuminazione da ambiente procedurale: niente file da scaricare, niente
  // ombre in tempo reale. Sostituibile con un HDRI leggero se serve.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setPixelRatio(pr: number): void {
    renderer.setPixelRatio(pr);
    resize();
  }

  resize();
  return { renderer, scene, camera, resize, setPixelRatio };
}
```

- [ ] **Step 2: Scrivere `src/main.ts`**

```ts
import './style.css';
import type { Object3D } from 'three';
import { hasWebGL, setMode } from './support/webgl';
import { RenderScheduler } from './three/renderScheduler';
import { PerfGovernor, buildPixelRatioLevels } from './perf/governor';
import { createScene } from './three/scene';
import { loadModel } from './three/loadModel';
import { POSES, applyState, poseToState, type PoseState } from './scroll/poses';

const root = document.documentElement;

async function start(): Promise<void> {
  if (!hasWebGL()) {
    setMode(root, 'fallback');
    return;
  }

  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  const loaderEl = document.getElementById('loader') as HTMLElement;
  const bar = document.getElementById('loader-bar') as HTMLElement;
  const notice = document.getElementById('notice') as HTMLElement;

  const weak = (navigator.hardwareConcurrency ?? 4) <= 4;
  const levels = buildPixelRatioLevels(window.devicePixelRatio, weak);
  const { renderer, scene, camera, resize, setPixelRatio } = createScene(canvas, levels[0]);

  const state: PoseState = poseToState(POSES[0]);
  let model: Object3D | null = null;

  const governor = new PerfGovernor({
    levels,
    onChange: (pr) => {
      setPixelRatio(pr);
      scheduler.request();
    },
  });

  const scheduler = new RenderScheduler(
    (dt) => {
      governor.tick(dt);
      if (model) applyState(state, model, camera);
      renderer.render(scene, camera);
    },
    (cb) => requestAnimationFrame(cb),
    (id) => cancelAnimationFrame(id),
    () => document.hidden,
  );

  window.addEventListener('resize', () => {
    resize();
    scheduler.request();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduler.request();
  });
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => scheduler.request());

  try {
    model = await loadModel(
      `${import.meta.env.BASE_URL}models/kint.glb`,
      renderer,
      (ratio) => {
        bar.style.transform = `scaleX(${ratio})`;
      },
    );
    scene.add(model);
    scheduler.request();
    loaderEl.classList.add('done');
  } catch (err) {
    console.error(err);
    setMode(root, 'fallback');
    notice.hidden = false;
    notice.textContent = 'Impossibile caricare il modello 3D.';
    loaderEl.classList.add('done');
    scheduler.stop();
    renderer.dispose();
  }
}

void start();
```

- [ ] **Step 3: Verificare tipi, test e build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: nessun errore, tutti i test passano, `dist/` creato.

- [ ] **Step 4: Verifica visiva**

Run: `npm run dev`, aprire l'URL stampato.
Expected: il modello (ottaedro) compare al centro sullo sfondo scuro, la barra di caricamento si dissolve, il testo scorre sopra. Non c'è ancora animazione. Nella console del browser non ci sono errori.

Prova del fallback: in DevTools rinominare temporaneamente `public/models/kint.glb` e ricaricare.
Expected: compaiono `fallback.svg` e il messaggio "Impossibile caricare il modello 3D."; ripristinare il file.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/three/scene.ts src/main.ts
git commit -m "feat: scene, on-demand rendering, perf governor and fallbacks wired in main"
```

---

### Task 8: Scroll fluido e timeline per sezione

**Files:**
- Create: `src/scroll/scroll.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `Pose`, `PoseState`, `POSES`, `poseToState`, `validatePoses` (Task 5); `state` e `scheduler.request` da `main.ts` (Task 7).
- Produces: `initScroll(opts: { state: PoseState; poses: Pose[]; request: () => void; reducedMotion: boolean }): () => void` — restituisce una funzione di teardown.

- [ ] **Step 1: Scrivere `src/scroll/scroll.ts`**

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { poseToState, type Pose, type PoseState } from './poses';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollOptions {
  state: PoseState;
  poses: Pose[];
  request: () => void;
  reducedMotion: boolean;
}

export function initScroll({ state, poses, request, reducedMotion }: ScrollOptions): () => void {
  Object.assign(state, poseToState(poses[0]));

  if (reducedMotion) {
    // Pose statiche: si cambia posa quando la sezione entra, senza interpolare.
    const triggers = poses.map((p) =>
      ScrollTrigger.create({
        trigger: `#${p.section}`,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (!self.isActive) return;
          Object.assign(state, poseToState(p));
          request();
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }

  // Scroll morbido su desktop; su touch Lenis lascia lo scroll nativo.
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const tl = gsap.timeline({
    defaults: { ease: 'none', duration: 1 },
    scrollTrigger: {
      trigger: '#story',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
    onUpdate: request,
  });
  for (let i = 1; i < poses.length; i++) {
    tl.to(state, poseToState(poses[i]));
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
```

- [ ] **Step 2: Collegare lo scroll in `src/main.ts`**

Aggiungere l'import e la validazione delle pose, poi l'inizializzazione dopo il caricamento del modello.

Aggiungere agli import in cima:
```ts
import { initScroll } from './scroll/scroll';
import { validatePoses } from './scroll/poses';
```
(unire `validatePoses` all'import già presente da `./scroll/poses`).

Nel blocco `try`, dopo `scene.add(model);` e prima di `scheduler.request();`, inserire:
```ts
    const sectionIds = [...document.querySelectorAll('#story > section')].map((s) => s.id);
    const problems = validatePoses(POSES, sectionIds);
    if (problems.length) console.warn('Pose non valide:', problems);

    initScroll({
      state,
      poses: POSES,
      request: () => scheduler.request(),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
```

- [ ] **Step 3: Verificare tipi, test e build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: nessun errore.

- [ ] **Step 4: Verifica visiva**

Run: `npm run dev`.
Expected: scorrendo, il modello ruota e si sposta sul lato opposto al testo in ogni sezione; lo scroll con la rotellina è morbido (Lenis); tornando su l'animazione si inverte; nella console non ci sono warning "Pose non valide".

Prova reduced motion: in DevTools, Rendering → "Emulate CSS prefers-reduced-motion: reduce", ricaricare.
Expected: il modello cambia posa a scatto quando una sezione entra, senza interpolazione.

Prova on-demand: nel pannello Performance registrare 5 secondi senza scrollare.
Expected: nessun frame di rendering mentre la pagina è ferma.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/scroll/scroll.ts src/main.ts
git commit -m "feat: Lenis smooth scroll with GSAP ScrollTrigger pose timeline and reduced-motion mode"
```

---

### Task 9: Controllo dei budget di peso e documentazione del modello

**Files:**
- Create: `scripts/check-budget.mjs`, `README.md`

**Interfaces:**
- Consumes: la cartella `dist/` prodotta da `npm run build`.
- Produces: `node scripts/check-budget.mjs` esce con codice 1 se la pagina supera 300 KB (gzip, modello e `basis/` esclusi) o se un GLB supera 1.5 MB.

- [ ] **Step 1: Scrivere lo script**

`scripts/check-budget.mjs`:
```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative, sep } from 'node:path';

const PAGE_BUDGET = 300 * 1024;
const MODEL_BUDGET = 1.5 * 1024 * 1024;
const TEXT = /\.(js|css|html|svg|json)$/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let page = 0;
let failed = false;
const rows = [];

for (const file of walk('dist')) {
  const rel = relative('dist', file).split(sep).join('/');
  const raw = readFileSync(file);

  if (rel.startsWith('models/')) {
    rows.push([rel, raw.length, 'modello']);
    if (raw.length > MODEL_BUDGET) {
      console.error(`FAIL ${rel}: ${raw.length} B supera ${MODEL_BUDGET} B`);
      failed = true;
    }
  } else if (rel.startsWith('basis/')) {
    rows.push([rel, raw.length, 'transcoder KTX2 (lazy)']);
  } else {
    const size = TEXT.test(rel) ? gzipSync(raw).length : raw.length;
    page += size;
    rows.push([rel, size, 'pagina']);
  }
}

for (const [name, size, kind] of rows) console.log(`${String(size).padStart(9)} B  ${kind.padEnd(22)} ${name}`);
console.log(`\nPagina: ${page} B / ${PAGE_BUDGET} B`);

if (page > PAGE_BUDGET) {
  console.error('FAIL: budget della pagina superato');
  failed = true;
}
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Eseguire il controllo**

Run: `npm run check`
Expected: test PASS, build OK, tabella dei pesi e riga `Pagina: <n> B / 307200 B`, codice di uscita 0. Se `Pagina` supera il budget, verificare che non ci siano `import * as THREE` e ridurre gli import.

- [ ] **Step 3: Provare che il controllo fallisce davvero**

Run: `node -e "require('fs').writeFileSync('dist/models/big.glb', Buffer.alloc(2*1024*1024))" && node scripts/check-budget.mjs; echo "exit=$?"; rm dist/models/big.glb`
Expected: stampa `FAIL models/big.glb ...` e `exit=1`.

- [ ] **Step 4: Scrivere `README.md`**

```markdown
# Kint

Sito con un modello 3D guidato dallo scroll. Stack: Vite, TypeScript, Three.js, GSAP ScrollTrigger, Lenis.

## Comandi

- `npm run dev` avvia il server di sviluppo
- `npm run build` build di produzione in `dist/`
- `npm test` test unitari
- `npm run check` test, build e controllo dei budget di peso

## Sostituire il modello placeholder

1. Modellare in Blender: 10-50k triangoli, materiale PBR semplice, pochi materiali con una texture atlas, nessuna ombra baked in tempo reale.
2. Esportare in glTF Binary (`.glb`) come `public/models/kint.raw.glb`.
3. Comprimere: `npm run model:optimize` (Meshopt). Per le texture in KTX2 serve il binario `toktx` (KTX-Software); poi
   `npx gltf-transform etc1s public/models/kint.glb public/models/kint.glb`
   (o `uastc` per le texture con più dettaglio).
4. Verificare che pesi meno di 1.5 MB con `npm run check`.
5. Aggiornare le pose in `src/scroll/poses.ts` in base a come è orientato il modello.

## Budget

Pagina sotto 300 KB (gzip, modello escluso), modello sotto 1.5 MB, 60 fps su un telefono di fascia media, LCP sotto 2.5 s su 4G. Misurare con Lighthouse e su un dispositivo reale.

## Fallback

Senza WebGL, o se il modello non si carica, la pagina mostra `public/fallback.svg`. Sostituirla con un render del modello finale.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md scripts/check-budget.mjs README.md
git commit -m "chore: bundle budget check and README with model authoring guide"
```

---

## Self-Review

**Copertura dello spec:**
- Stack (Vite, Three.js tree-shaken, Lenis, GSAP, GLB Meshopt/KTX2, hosting statico): Task 1, 6, 8. L'hosting statico non richiede codice: `dist/` è caricabile su qualunque CDN.
- Un solo canvas fisso, HTML semantico per SEO: Task 1 (struttura), 7.
- Modello (Blender, budget, pipeline): Task 6 (placeholder), Task 9 (README con la guida). Il modello finale è un lavoro esterno a questo piano.
- Rendering on-demand: Task 3, 7. Pixel ratio e governor: Task 4, 7. Caricamento asincrono con progresso: Task 6, 7. Budget: Task 9.
- Timeline GSAP per sezione, Lenis, reduced motion, mobile nativo: Task 5, 8.
- Fallback per WebGL assente / modello fallito / perdita contesto / tab in background: Task 2, 7.
- Test e verifica: unit test nei Task 2-5; verifiche manuali nei Task 7-8; budget nel Task 9. La misura Lighthouse e su telefono reale resta manuale (README).
- Cache lunga e Brotli: dipendono dalla configurazione dell'hosting (Vite genera già nomi con hash); vanno impostate al deploy.

**Placeholder:** nessuno. Le pose sono valori iniziali da rifinire con il modello definitivo (indicato nel README).

**Coerenza dei tipi:** `PoseState`, `Pose`, `poseToState`, `applyState`, `validatePoses`, `RenderScheduler.request/stop`, `PerfGovernor.tick`, `buildPixelRatioLevels(dpr, weak)`, `createScene`, `loadModel`, `initScroll` hanno le stesse firme dove definiti e dove usati.
