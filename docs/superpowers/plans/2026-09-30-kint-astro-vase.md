# Kint: scaffold Astro e vaso 3D (Piano 1 di 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire lo scaffold Vite con un progetto Astro e costruire l'esperienza del vaso in kintsugi (frammenti che si ricompongono e giunture d'oro che crescono scorrendo la pagina), con un modello placeholder generato da script.

**Architecture:** Astro statico. Un solo canvas fisso dietro il DOM; il modulo 3D è un chunk caricato dopo il contenuto. Lo scroll produce `p` (0-1) che entra come uniform in due shader matcap (frammenti e giunture): una draw call ciascuno, animazione calcolata dalla GPU. Rendering on-demand, con un ciclo a 30 fps solo mentre l'apertura è visibile.

**Tech Stack:** Astro, TypeScript, Three.js, Vitest, `@gltf-transform/core` per gli script del modello.

**Specs:** `docs/superpowers/specs/2026-09-30-kint-stack-and-split-design.md` e `docs/superpowers/specs/2026-09-30-kint-vase-experience-design.md`. Il piano del sito (sotto-progetto A) sarà il Piano 2, scritto dopo questo.

## Global Constraints

- Three.js solo con import nominali (mai `import * as THREE`).
- DPR massimo 1.5 (1.25 sui dispositivi deboli); tetto 2560×1440 pixel, disattivabile con `?USE_HD=1`.
- Nessuna luce né ombra in tempo reale; shading matcap.
- Niente GSAP né Lenis: scroll nativo.
- Il contenuto sta nell'HTML del server; il canvas è decorativo (`aria-hidden="true"`); il modulo 3D non blocca il contenuto.
- Zoom consentito; `prefers-reduced-motion` rispettato (nessuna deriva).
- Contratto del GLB: nodi `shard_XX` e `seam_AA_BB`, nessuna texture.
- Budget: pagina (HTML + CSS + JS iniziale) sotto 300 KB gzip, modulo 3D e modello esclusi; modello sotto 1.5 MB.
- Palette: nero `#0a0a0a`, bianco `#f5f3ee`, oro `#c9a24b` (indicativi).
- Ogni task che aggiunge, sposta o rimuove file, cambia un comando npm o un budget aggiorna `CLAUDE.md` e la data in cima nello stesso commit.
- Deviazione dallo spec B: nella v1 i matcap sono generati a runtime con un canvas 2D (0 byte da scaricare). Si sostituiscono con texture WebP quando ci sarà una direzione visiva definitiva.
- Deviazione dallo spec B: nella v1 il GLB del vaso non è compresso con Meshopt (il placeholder pesa pochi KB). Il loader lo supporta già; la compressione si aggiunge quando arriva il modello reale se supera i 500 KB.

## File Structure

```
astro.config.mjs, vitest.config.ts, tsconfig.json, package.json
src/env.d.ts
src/pages/index.astro                   pagina di prova con le sezioni segnaposto
src/styles/tokens.css, global.css
src/gl/support.ts                       hasWebGL, setMode           (spostato)
src/gl/renderScheduler.ts               on-demand + ciclo a fps      (spostato ed esteso)
src/gl/governor.ts                      PerfGovernor                 (spostato, tetto 1.5)
src/gl/settings.ts                      Settings, capPixelRatio
src/gl/boot.ts                          punto d'ingresso lato client
src/gl/vase/math.ts                     funzioni pure di progresso e layout
src/gl/vase/material.ts                 matcap procedurali e shader
src/gl/vase/loadVase.ts                 caricamento del GLB
src/gl/vase/vaseScene.ts                scena, scroll, ciclo di vita
scripts/make-placeholder-vase.mjs, build-vase.mjs, check-vase.mjs, check-budget.mjs
public/vase-fallback.svg
tests/support.test.ts, renderScheduler.test.ts, governor.test.ts, settings.test.ts, vaseMath.test.ts
```

---

### Task 1: Scaffold Astro e migrazione dei moduli esistenti

**Files:**
- Create: `astro.config.mjs`, `vitest.config.ts`, `src/env.d.ts`, `src/pages/index.astro`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`, `src/gl/governor.ts` (spostato), `tests/governor.test.ts`
- Move: `src/support/webgl.ts` → `src/gl/support.ts`; `src/three/renderScheduler.ts` → `src/gl/renderScheduler.ts`; `src/perf/governor.ts` → `src/gl/governor.ts`; `tests/webgl.test.ts` → `tests/support.test.ts`
- Delete: `index.html`, `src/main.ts`, `src/style.css`, `vite.config.ts`, `scripts/copy-basis.mjs`, `public/fallback.svg`

**Interfaces:**
- Produces: `buildPixelRatioLevels(dpr: number, weak: boolean): number[]` con tetto 1.5 (1.25 se `weak`), livelli `[first, 1.25, 1]` filtrati; comandi npm `dev`, `build`, `preview`, `test`.

- [ ] **Step 1: Dipendenze**

Run:
```bash
npm uninstall gsap lenis vite
npm install astro
```
Expected: `astro` in `dependencies`, `gsap`, `lenis` e `vite` rimossi.

- [ ] **Step 2: Spostare i moduli e i test**

Run:
```bash
mkdir -p src/gl
git mv src/support/webgl.ts src/gl/support.ts
git mv src/three/renderScheduler.ts src/gl/renderScheduler.ts
git mv src/perf/governor.ts src/gl/governor.ts
git mv tests/webgl.test.ts tests/support.test.ts
git rm -q index.html src/main.ts src/style.css vite.config.ts scripts/copy-basis.mjs public/fallback.svg
```
Aggiornare gli import nei test: in `tests/support.test.ts` sostituire `'../src/support/webgl'` con `'../src/gl/support'`; in `tests/renderScheduler.test.ts` `'../src/three/renderScheduler'` con `'../src/gl/renderScheduler'`; in `tests/governor.test.ts` `'../src/perf/governor'` con `'../src/gl/governor'`.

- [ ] **Step 3: Scrivere la configurazione**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kint.ch',
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

`src/env.d.ts`:
```ts
/// <reference types="astro/client" />
```

`.gitignore` (sostituire il contenuto):
```
node_modules
dist
.astro
public/models/*.raw.glb
.DS_Store
```

In `package.json` sostituire `scripts`:
```json
"scripts": {
  "dev": "astro dev",
  "build": "tsc --noEmit && astro build",
  "preview": "astro preview",
  "test": "vitest run",
  "vase:placeholder": "node scripts/make-placeholder-vase.mjs && node scripts/build-vase.mjs",
  "vase:build": "node scripts/build-vase.mjs",
  "vase:check": "node scripts/check-vase.mjs",
  "check": "npm test && npm run vase:check && npm run build && node scripts/check-budget.mjs"
}
```

`src/pages/index.astro` (provvisoria):
```astro
---
---
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kint</title>
  </head>
  <body>
    <h1>Kint</h1>
  </body>
</html>
```

- [ ] **Step 4: Aggiornare il test del tetto DPR (deve fallire)**

In `tests/governor.test.ts` sostituire il blocco `describe('buildPixelRatioLevels', ...)` con:
```ts
describe('buildPixelRatioLevels', () => {
  it('limita a 1.5 su schermi densi', () => {
    expect(buildPixelRatioLevels(3, false)).toEqual([1.5, 1.25, 1]);
  });
  it('limita a 1.25 su dispositivi deboli', () => {
    expect(buildPixelRatioLevels(3, true)).toEqual([1.25, 1]);
  });
  it("a dpr 1 c'è un solo livello", () => {
    expect(buildPixelRatioLevels(1, false)).toEqual([1]);
  });
  it('a dpr 1.5 scende senza duplicati', () => {
    expect(buildPixelRatioLevels(1.5, false)).toEqual([1.5, 1.25, 1]);
  });
});
```

Run: `npx vitest run tests/governor.test.ts`
Expected: FAIL sui primi due test (`[2, 1.5, 1.25, 1]` invece di `[1.5, 1.25, 1]`).

- [ ] **Step 5: Correggere l'implementazione**

In `src/gl/governor.ts` sostituire `buildPixelRatioLevels` con:
```ts
export function buildPixelRatioLevels(dpr: number, weak: boolean): number[] {
  const first = Math.min(dpr, weak ? 1.25 : 1.5);
  return [first, 1.25, 1].filter((v, i) => i === 0 || v < first);
}
```

- [ ] **Step 6: Verificare test, tipi e build**

Run: `npm test && npm run build`
Expected: 21 test passano; `tsc` senza errori; `astro build` termina e crea `dist/index.html`. Se `tsc` segnala tipi mancanti di Astro, eseguire `npx astro sync` e ripetere.

- [ ] **Step 7: Aggiornare CLAUDE.md e committare**

Nella sezione «File esistenti» di `CLAUDE.md` sostituire l'elenco con lo stato reale: progetto Astro, moduli in `src/gl/`, comandi `dev`, `build`, `test`. Aggiornare la data.

```bash
git add -A
git commit -m "chore: migrate scaffold to Astro and lower DPR cap to 1.5"
```

---

### Task 2: Settings e tetto ai pixel

**Files:**
- Create: `src/gl/settings.ts`
- Test: `tests/settings.test.ts`

**Interfaces:**
- Produces:
  - `interface Env { width: number; height: number; dpr: number; cores: number; userAgent: string; search: string }`
  - `interface Settings { isMobile: boolean; isRetina: boolean; cpuCoreCount: number; isSmallScreen: boolean; weak: boolean; debugP: number | null; forceHd: boolean }`
  - `readSettings(env: Env): Settings`
  - `capPixelRatio(pr: number, width: number, height: number, maxPixels: number): number`
  - `browserEnv(): Env`
  - `const MAX_PIXELS = 2560 * 1440`

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/settings.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { capPixelRatio, readSettings, type Env } from '../src/gl/settings';

const base: Env = {
  width: 1440,
  height: 900,
  dpr: 2,
  cores: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120',
  search: '',
};

describe('readSettings', () => {
  it('desktop potente', () => {
    const s = readSettings(base);
    expect(s).toMatchObject({
      isMobile: false,
      isRetina: true,
      cpuCoreCount: 8,
      isSmallScreen: false,
      weak: false,
      debugP: null,
      forceHd: false,
    });
  });

  it('riconosce i telefoni dallo user agent', () => {
    const s = readSettings({ ...base, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile/15E148' });
    expect(s.isMobile).toBe(true);
    expect(s.weak).toBe(true);
  });

  it('schermo piccolo se il lato corto è ≤ 820', () => {
    expect(readSettings({ ...base, width: 820, height: 1180 }).isSmallScreen).toBe(true);
    expect(readSettings({ ...base, width: 1440, height: 821 }).isSmallScreen).toBe(false);
  });

  it('debole con 4 core o meno', () => {
    expect(readSettings({ ...base, cores: 4 }).weak).toBe(true);
    expect(readSettings({ ...base, cores: 5 }).weak).toBe(false);
  });

  it('legge gli override da query string', () => {
    const s = readSettings({ ...base, search: '?p=0.5&USE_HD=1' });
    expect(s.debugP).toBe(0.5);
    expect(s.forceHd).toBe(true);
  });

  it('ignora un p non valido o fuori intervallo', () => {
    expect(readSettings({ ...base, search: '?p=abc' }).debugP).toBeNull();
    expect(readSettings({ ...base, search: '?p=2' }).debugP).toBeNull();
  });
});

describe('capPixelRatio', () => {
  it('non cambia se sotto il tetto', () => {
    expect(capPixelRatio(1.5, 1000, 800, 2560 * 1440)).toBe(1.5);
  });
  it('riduce se larghezza × altezza × pr² supera il tetto', () => {
    const pr = capPixelRatio(1.5, 3840, 2160, 2560 * 1440);
    expect(pr).toBeLessThan(1.5);
    expect(3840 * 2160 * pr * pr).toBeCloseTo(2560 * 1440, 0);
  });
  it('con tetto infinito non cambia', () => {
    expect(capPixelRatio(1.5, 3840, 2160, Infinity)).toBe(1.5);
  });
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `npx vitest run tests/settings.test.ts`
Expected: FAIL, modulo `../src/gl/settings` non trovato.

- [ ] **Step 3: Implementare**

`src/gl/settings.ts`:
```ts
export const MAX_PIXELS = 2560 * 1440;

export interface Env {
  width: number;
  height: number;
  dpr: number;
  cores: number;
  userAgent: string;
  search: string;
}

export interface Settings {
  isMobile: boolean;
  isRetina: boolean;
  cpuCoreCount: number;
  isSmallScreen: boolean;
  weak: boolean;
  debugP: number | null;
  forceHd: boolean;
}

export function readSettings(env: Env): Settings {
  const params = new URLSearchParams(env.search);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(env.userAgent);
  const rawP = params.get('p');
  const p = rawP === null ? NaN : Number(rawP);

  return {
    isMobile,
    isRetina: env.dpr >= 2,
    cpuCoreCount: env.cores,
    isSmallScreen: Math.min(env.width, env.height) <= 820,
    weak: env.cores <= 4 || isMobile,
    debugP: Number.isFinite(p) && p >= 0 && p <= 1 ? p : null,
    forceHd: params.get('USE_HD') === '1',
  };
}

export function capPixelRatio(
  pr: number,
  width: number,
  height: number,
  maxPixels: number,
): number {
  const pixels = width * height * pr * pr;
  return pixels > maxPixels ? Math.sqrt(maxPixels / (width * height)) : pr;
}

export function browserEnv(): Env {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
    cores: navigator.hardwareConcurrency ?? 4,
    userAgent: navigator.userAgent,
    search: window.location.search,
  };
}
```

- [ ] **Step 4: Verificare che passi**

Run: `npx vitest run tests/settings.test.ts`
Expected: PASS (9 test).

- [ ] **Step 5: Aggiornare CLAUDE.md e committare**

Aggiungere `src/gl/settings.ts` alla mappa dei file di `CLAUDE.md`.

```bash
git add CLAUDE.md src/gl/settings.ts tests/settings.test.ts
git commit -m "feat: device settings with query overrides and pixel cap"
```

---

### Task 3: Funzioni pure del vaso (progresso, opacità, layout)

**Files:**
- Create: `src/gl/vase/math.ts`
- Test: `tests/vaseMath.test.ts`

**Interfaces:**
- Produces:
  - `clamp01(x: number): number`
  - `smoothstep(e0: number, e1: number, x: number): number` (se `e1 <= e0` restituisce `x >= e1 ? 1 : 0`)
  - `scrollProgress(scrollY: number, docHeight: number, viewHeight: number): number`
  - `shardEase(p: number, start: number, end: number): number`
  - `seamProgress(p: number, start: number, end: number): number` (lineare, stessa gestione del caso degenere)
  - `opacityAt(p: number): number` — da 0.2 (p = 0) a 1 (p ≥ 0.85)
  - `interface Anchor { x: number; scale: number; opacityMul: number }`
  - `anchorFor(width: number, height: number, p: number): Anchor` — `x` in frazione della metà larghezza visibile

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/vaseMath.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  anchorFor,
  clamp01,
  opacityAt,
  scrollProgress,
  seamProgress,
  shardEase,
  smoothstep,
} from '../src/gl/vase/math';

describe('clamp01 / smoothstep', () => {
  it('clamp01', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(3)).toBe(1);
  });
  it('smoothstep agli estremi e al centro', () => {
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
  });
  it('smoothstep con intervallo degenere è un gradino', () => {
    expect(smoothstep(0.5, 0.5, 0.4)).toBe(0);
    expect(smoothstep(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe('scrollProgress', () => {
  it('0 in cima, 1 in fondo', () => {
    expect(scrollProgress(0, 3000, 1000)).toBe(0);
    expect(scrollProgress(2000, 3000, 1000)).toBe(1);
  });
  it('è lineare in mezzo', () => {
    expect(scrollProgress(1000, 3000, 1000)).toBeCloseTo(0.5);
  });
  it('limita i valori fuori intervallo (rimbalzo iOS)', () => {
    expect(scrollProgress(-50, 3000, 1000)).toBe(0);
    expect(scrollProgress(2500, 3000, 1000)).toBe(1);
  });
  it('è 0 se il documento non è più alto della finestra', () => {
    expect(scrollProgress(0, 800, 1000)).toBe(0);
  });
});

describe('shardEase', () => {
  it('0 prima dell\'inizio, 1 dopo la fine', () => {
    expect(shardEase(0.1, 0.2, 0.7)).toBe(0);
    expect(shardEase(0.9, 0.2, 0.7)).toBe(1);
  });
  it('è monotona', () => {
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const e = shardEase(p, 0.1, 0.8);
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
  });
});

describe('seamProgress', () => {
  it('0 prima, 1 dopo, lineare in mezzo', () => {
    expect(seamProgress(0.3, 0.4, 0.6)).toBe(0);
    expect(seamProgress(0.7, 0.4, 0.6)).toBe(1);
    expect(seamProgress(0.5, 0.4, 0.6)).toBeCloseTo(0.5);
  });
});

describe('opacityAt', () => {
  it('0.2 in apertura', () => {
    expect(opacityAt(0)).toBeCloseTo(0.2);
  });
  it('1 da 0.85 in poi', () => {
    expect(opacityAt(0.85)).toBeCloseTo(1);
    expect(opacityAt(1)).toBeCloseTo(1);
  });
  it('sale in modo monotono', () => {
    expect(opacityAt(0.4)).toBeGreaterThan(opacityAt(0.2));
    expect(opacityAt(0.7)).toBeGreaterThan(opacityAt(0.4));
  });
});

describe('anchorFor', () => {
  it('desktop: vaso a destra, poi al centro in chiusura', () => {
    const a = anchorFor(1440, 900, 0.3);
    expect(a.x).toBeCloseTo(0.5);
    expect(a.scale).toBe(1);
    expect(a.opacityMul).toBe(1);
    expect(anchorFor(1440, 900, 1).x).toBeCloseTo(0);
  });
  it('mobile: sempre al centro, opacità ridotta fino alla chiusura', () => {
    const mid = anchorFor(390, 844, 0.5);
    expect(mid.x).toBe(0);
    expect(mid.opacityMul).toBeCloseTo(0.5);
    expect(anchorFor(390, 844, 1).opacityMul).toBeCloseTo(1);
  });
  it('un tablet in verticale è trattato come mobile', () => {
    expect(anchorFor(820, 1180, 0.5).x).toBe(0);
  });
});
```

- [ ] **Step 2: Verificare che fallisca**

Run: `npx vitest run tests/vaseMath.test.ts`
Expected: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

`src/gl/vase/math.ts`:
```ts
export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 <= e0) return x >= e1 ? 1 : 0;
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export function scrollProgress(scrollY: number, docHeight: number, viewHeight: number): number {
  const max = docHeight - viewHeight;
  return max <= 0 ? 0 : clamp01(scrollY / max);
}

export function shardEase(p: number, start: number, end: number): number {
  return smoothstep(start, end, p);
}

export function seamProgress(p: number, start: number, end: number): number {
  if (end <= start) return p >= end ? 1 : 0;
  return clamp01((p - start) / (end - start));
}

export function opacityAt(p: number): number {
  return 0.2 + 0.8 * smoothstep(0, 0.85, p);
}

export interface Anchor {
  x: number;
  scale: number;
  opacityMul: number;
}

export function anchorFor(width: number, height: number, p: number): Anchor {
  const closing = smoothstep(0.92, 1, p);
  if (width >= 900 && width > height) {
    return { x: 0.5 * (1 - closing), scale: 1, opacityMul: 1 };
  }
  return { x: 0, scale: 0.85, opacityMul: 0.5 + 0.5 * closing };
}
```

- [ ] **Step 4: Verificare che passi**

Run: `npx vitest run tests/vaseMath.test.ts`
Expected: PASS (17 test).

- [ ] **Step 5: Aggiornare CLAUDE.md e committare**

Aggiungere `src/gl/vase/math.ts` alla mappa.

```bash
git add CLAUDE.md src/gl/vase/math.ts tests/vaseMath.test.ts
git commit -m "feat: pure vase math (scroll progress, ease, opacity, layout anchor)"
```

---

### Task 4: Ciclo a fps nello scheduler

**Files:**
- Modify: `src/gl/renderScheduler.ts`, `tests/renderScheduler.test.ts`

**Interfaces:**
- Consumes: la classe `RenderScheduler` esistente (`request`, `stop`, costruttore `(draw, raf, caf, isHidden?)`).
- Produces: `startLoop(fps: number): void` e `stopLoop(): void`. Con il ciclo attivo lo scheduler disegna al massimo a `fps` frame al secondo e disegna subito a ogni `request()`. `stop()` ferma anche il ciclo.

- [ ] **Step 1: Aggiungere i test che falliscono**

In `tests/renderScheduler.test.ts`, dentro `describe('RenderScheduler', ...)` aggiungere:
```ts
  it('con il ciclo a 30 fps disegna circa ogni 33 ms', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.startLoop(30);
    for (let t = 0; t <= 100; t += 16) f.flush(t);
    // disegna a 0, 33+ e 66+ ms: 3 o 4 volte, non 7
    expect(draws).toBeGreaterThanOrEqual(3);
    expect(draws).toBeLessThanOrEqual(4);
  });

  it('una request durante il ciclo disegna al frame successivo', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.startLoop(30);
    f.flush(0);
    const before = draws;
    s.request();
    f.flush(16);
    expect(draws).toBe(before + 1);
  });

  it('stopLoop ferma il ciclo senza altri frame', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.startLoop(30);
    f.flush(0);
    s.stopLoop();
    f.flush(40);
    const after = draws;
    f.flush(80);
    expect(draws).toBe(after);
    expect(f.pending()).toBe(0);
  });
```

- [ ] **Step 2: Verificare che falliscano**

Run: `npx vitest run tests/renderScheduler.test.ts`
Expected: i 3 nuovi test FAIL (`startLoop is not a function`), i 6 esistenti PASS.

- [ ] **Step 3: Sostituire l'implementazione**

`src/gl/renderScheduler.ts`:
```ts
export type Raf = (cb: (t: number) => void) => number;
export type Caf = (id: number) => void;

const IDLE_GAP_MS = 250;

export class RenderScheduler {
  private id: number | null = null;
  private last: number | null = null;
  private dirty = false;
  private loopInterval: number | null = null;

  constructor(
    private readonly draw: (dt: number | null) => void,
    private readonly raf: Raf,
    private readonly caf: Caf,
    private readonly isHidden: () => boolean = () => false,
  ) {}

  request(): void {
    this.dirty = true;
    this.schedule();
  }

  startLoop(fps: number): void {
    this.loopInterval = 1000 / fps;
    this.schedule();
  }

  stopLoop(): void {
    this.loopInterval = null;
  }

  stop(): void {
    if (this.id !== null) this.caf(this.id);
    this.id = null;
    this.last = null;
    this.dirty = false;
    this.loopInterval = null;
  }

  private schedule(): void {
    if (this.id !== null || this.isHidden()) return;
    this.id = this.raf(this.frame);
  }

  private frame = (t: number): void => {
    this.id = null;
    if (!this.dirty && this.loopInterval === null) return;

    const due = this.last === null || t - this.last >= (this.loopInterval ?? 0) - 2;
    if (!this.dirty && !due) {
      this.schedule();
      return;
    }

    this.dirty = false;
    const gap = this.last === null ? null : t - this.last;
    this.last = t;
    this.draw(gap === null || gap >= IDLE_GAP_MS ? null : gap);
    if (this.loopInterval !== null) this.schedule();
  };
}
```

- [ ] **Step 4: Verificare che passino**

Run: `npx vitest run tests/renderScheduler.test.ts`
Expected: PASS (9 test, inclusi i 6 originali).

- [ ] **Step 5: Committare**

```bash
git add CLAUDE.md src/gl/renderScheduler.ts tests/renderScheduler.test.ts
git commit -m "feat: fps-capped loop mode for the render scheduler"
```

---

### Task 5: Vaso placeholder secondo il contratto del GLB

**Files:**
- Create: `scripts/make-placeholder-vase.mjs`
- Produces (non versionato): `public/models/vase.raw.glb`

**Interfaces:**
- Produces: `public/models/vase.raw.glb` con 32 nodi mesh `shard_00`…`shard_31` (indice = `j * 8 + i`, 8 spicchi per 4 fasce) e i nodi `seam_AA_BB` tra i frammenti adiacenti. Ogni frammento è un solido chiuso (spessore 0.06) in posizione assemblata; ogni giuntura è un nastro con `TEXCOORD_0` (`u` da 0 a 1 lungo il percorso).

- [ ] **Step 1: Scrivere lo script**

`scripts/make-placeholder-vase.mjs`:
```js
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
```

- [ ] **Step 2: Generare il vaso grezzo**

Run: `node scripts/make-placeholder-vase.mjs`
Expected: stampa `wrote public/models/vase.raw.glb (32 shards)`; `ls -l public/models` mostra il file (decine di KB).

- [ ] **Step 3: Committare**

```bash
git add CLAUDE.md scripts/make-placeholder-vase.mjs
git commit -m "feat: procedural placeholder vase following the GLB contract"
```

---

### Task 6: Build del modello e verifica del contratto

**Files:**
- Create: `scripts/build-vase.mjs`, `scripts/check-vase.mjs`
- Produces (versionato): `public/models/vase.glb`

**Interfaces:**
- Consumes: `public/models/vase.raw.glb` (contratto del Task 5).
- Produces: `public/models/vase.glb` con due soli nodi mesh:
  - `shards`: `POSITION`, `NORMAL`, `_CENTER` (vec3), `_SCATTER_POS` (vec3), `_SCATTER_AXIS` (vec3), `_SCATTER_ANGLE` (float), `_START` (float), `_END` (float).
  - `seams`: `POSITION`, `NORMAL`, `TEXCOORD_0` (`u` lungo il percorso), `_SEAM_START` (float), `_SEAM_END` (float).
- Regole di generazione (seme fisso 1234): `_START` in [0, 0.15], `_END` in [0.55, 0.85]; posizione sparsa in un guscio di raggio 1.5-3.5 sul piano XY, con Z in [-1, 1]; angolo di rotazione tra π/2 e 2π; per ogni giuntura `_SEAM_START = max(end_a, end_b) − 0.15` e `_SEAM_END = min(0.95, _SEAM_START + 0.25)`.

- [ ] **Step 1: Scrivere `scripts/build-vase.mjs`**

```js
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
```

- [ ] **Step 2: Scrivere `scripts/check-vase.mjs`**

```js
import { NodeIO } from '@gltf-transform/core';
import { existsSync, statSync } from 'node:fs';

const RAW = 'public/models/vase.raw.glb';
const BUILT = 'public/models/vase.glb';
const MAX_BYTES = 1.5 * 1024 * 1024;
const errors = [];

if (existsSync(RAW)) {
  const nodes = (await new NodeIO().read(RAW)).getRoot().listNodes().map((n) => n.getName());
  const shards = nodes.filter((n) => n.startsWith('shard_')).sort();
  shards.forEach((n, i) => {
    if (n !== `shard_${String(i).padStart(2, '0')}`) errors.push(`indice frammento non sequenziale: ${n}`);
  });
  if (shards.length < 24 || shards.length > 40) errors.push(`frammenti: ${shards.length}, attesi 24-40`);
  const known = new Set(shards.map((n) => Number(n.slice(6))));
  for (const n of nodes.filter((x) => x.startsWith('seam_'))) {
    const m = n.match(/^seam_(\d\d)_(\d\d)$/);
    if (!m) errors.push(`nome giuntura non valido: ${n}`);
    else if (!known.has(Number(m[1])) || !known.has(Number(m[2]))) errors.push(`${n} cita un frammento inesistente`);
  }
} else {
  console.log(`(salto il controllo del grezzo: ${RAW} non presente)`);
}

if (!existsSync(BUILT)) {
  errors.push(`manca ${BUILT}: eseguire npm run vase:build`);
} else {
  const size = statSync(BUILT).size;
  if (size > MAX_BYTES) errors.push(`${BUILT} pesa ${size} B, oltre ${MAX_BYTES} B`);
  const doc = await new NodeIO().read(BUILT);
  const byName = new Map(doc.getRoot().listNodes().map((n) => [n.getName(), n]));
  const need = {
    shards: ['POSITION', 'NORMAL', '_CENTER', '_SCATTER_POS', '_SCATTER_AXIS', '_SCATTER_ANGLE', '_START', '_END'],
    seams: ['POSITION', 'NORMAL', 'TEXCOORD_0', '_SEAM_START', '_SEAM_END'],
  };
  for (const [name, attrs] of Object.entries(need)) {
    const node = byName.get(name);
    if (!node) {
      errors.push(`manca il nodo "${name}" in ${BUILT}`);
      continue;
    }
    const p = node.getMesh().listPrimitives()[0];
    for (const a of attrs) if (!p.getAttribute(a)) errors.push(`${name}: manca l'attributo ${a}`);
  }
  if (!errors.length) console.log(`${BUILT}: ${size} B, contratto rispettato`);
}

if (errors.length) {
  for (const e of errors) console.error('FAIL', e);
  process.exit(1);
}
```

- [ ] **Step 3: Costruire e verificare**

Run: `npm run vase:build && npm run vase:check`
Expected: `wrote public/models/vase.glb: 32 shards, 56 seams` (32 giunture verticali e 24 orizzontali), poi `contratto rispettato` e uscita 0.

- [ ] **Step 4: Provare che il controllo fallisce davvero**

Run: `mv public/models/vase.glb /tmp/keep.glb; node scripts/check-vase.mjs; echo "exit=$?"; mv /tmp/keep.glb public/models/vase.glb`
Expected: `FAIL manca public/models/vase.glb...` e `exit=1`.

- [ ] **Step 5: Committare**

```bash
git add CLAUDE.md scripts/build-vase.mjs scripts/check-vase.mjs public/models/vase.glb
git commit -m "feat: build vase model with per-shard motion attributes and contract check"
```

---
### Task 7: Matcap procedurali e shader dei frammenti e delle giunture

**Files:**
- Create: `src/gl/vase/material.ts`

**Interfaces:**
- Produces:
  - `interface VaseUniforms { uP: {value: number}; uTime: {value: number}; uDrift: {value: number}; uOpacity: {value: number} }`
  - `createVaseUniforms(): VaseUniforms`
  - `createVaseMaterials(u: VaseUniforms): { shards: MeshMatcapMaterial; seams: MeshMatcapMaterial; dispose(): void }`
- Attributi GLSL attesi dallo shader dei frammenti: `aCenter`, `aScatterPos`, `aScatterAxis`, `aScatterAngle`, `aStart`, `aEnd`; dalle giunture: `aSeamStart`, `aSeamEnd` (il rinomino da `_center`, ecc. avviene nel Task 8).

- [ ] **Step 1: Scrivere `src/gl/vase/material.ts`**

```ts
import { CanvasTexture, DoubleSide, MeshMatcapMaterial, SRGBColorSpace } from 'three';

export interface VaseUniforms {
  uP: { value: number };
  uTime: { value: number };
  uDrift: { value: number };
  uOpacity: { value: number };
}

export function createVaseUniforms(): VaseUniforms {
  return {
    uP: { value: 0 },
    uTime: { value: 0 },
    uDrift: { value: 1 },
    uOpacity: { value: 0.2 },
  };
}

// Matcap generato a runtime: nessun file da scaricare. Sostituibile con una WebP.
function makeMatcap(base: string, light: string, dark: string, sheen: boolean): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;

  const body = g.createRadialGradient(size * 0.38, size * 0.34, size * 0.02, size / 2, size / 2, size * 0.52);
  body.addColorStop(0, light);
  body.addColorStop(0.45, base);
  body.addColorStop(1, dark);
  g.fillStyle = body;
  g.fillRect(0, 0, size, size);

  if (sheen) {
    const spec = g.createRadialGradient(size * 0.34, size * 0.3, 0, size * 0.34, size * 0.3, size * 0.16);
    spec.addColorStop(0, 'rgba(255,250,230,0.95)');
    spec.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = spec;
    g.fillRect(0, 0, size, size);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const DITHER = /* glsl */ `
uniform float uOpacity;
float bayer4(vec2 p) {
  ivec2 i = ivec2(mod(p, 4.0));
  int idx = i.x + i.y * 4;
  float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return (m[idx] + 0.5) / 16.0;
}
`;

const ROTATE = /* glsl */ `
vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
`;

function shardMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap });
  m.customProgramCacheKey = () => 'vase-shards';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute vec3 aCenter;
attribute vec3 aScatterPos;
attribute vec3 aScatterAxis;
attribute float aScatterAngle;
attribute float aStart;
attribute float aEnd;
uniform float uP;
uniform float uTime;
uniform float uDrift;
${ROTATE}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `float e = smoothstep(aStart, aEnd, uP);
vec3 axis = normalize(aScatterAxis);
vec3 objectNormal = rotateAxis(normal, axis, aScatterAngle * (1.0 - e));`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 drift = uDrift * 0.15 * vec3(
  sin(uTime * 0.30 + aCenter.y * 3.0),
  cos(uTime * 0.25 + aCenter.x * 3.0),
  sin(uTime * 0.20 + aCenter.z * 2.0));
vec3 transformed = rotateAxis(position - aCenter, axis, aScatterAngle * (1.0 - e))
  + aCenter + (aScatterPos + drift) * (1.0 - e);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${DITHER}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uOpacity < bayer4(gl_FragCoord.xy)) discard;`,
      );
  };
  return m;
}

function seamMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap, side: DoubleSide });
  m.customProgramCacheKey = () => 'vase-seams';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aSeamStart;
attribute float aSeamEnd;
varying float vU;
varying vec2 vSeam;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vU = uv.x;
vSeam = vec2(aSeamStart, aSeamEnd);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${DITHER}
uniform float uP;
varying float vU;
varying vec2 vSeam;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
float grow = clamp((uP - vSeam.x) / max(vSeam.y - vSeam.x, 0.0001), 0.0, 1.0);
if (grow <= 0.0 || vU > grow) discard;
if (uOpacity < bayer4(gl_FragCoord.xy)) discard;`,
      );
  };
  return m;
}

export function createVaseMaterials(u: VaseUniforms) {
  const terracotta = makeMatcap('#b5623a', '#e0956a', '#3a1a10', false);
  const gold = makeMatcap('#c9a24b', '#f6e2a0', '#4a3512', true);
  const shards = shardMaterial(u, terracotta);
  const seams = seamMaterial(u, gold);
  return {
    shards,
    seams,
    dispose() {
      shards.dispose();
      seams.dispose();
      terracotta.dispose();
      gold.dispose();
    },
  };
}
```

- [ ] **Step 2: Verificare i tipi**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 3: Committare**

Aggiungere `src/gl/vase/material.ts` alla mappa di `CLAUDE.md`.

```bash
git add CLAUDE.md src/gl/vase/material.ts
git commit -m "feat: procedural matcaps and vase shard/seam shaders"
```

(La verifica visiva degli shader avviene nel Task 8, quando c'è una scena da guardare.)

---

### Task 8: Caricamento, scena, scroll e pagina di prova

**Files:**
- Create: `src/gl/vase/loadVase.ts`, `src/gl/vase/vaseScene.ts`, `src/gl/boot.ts`, `src/styles/tokens.css`, `src/styles/global.css`, `public/vase-fallback.svg`
- Modify: `src/pages/index.astro` (sostituzione completa)

**Interfaces:**
- Consumes: `hasWebGL`, `setMode` (`src/gl/support.ts`); `RenderScheduler` (`startLoop`, `stopLoop`, `request`, `stop`); `PerfGovernor`, `buildPixelRatioLevels`; `readSettings`, `browserEnv`, `capPixelRatio`, `MAX_PIXELS`; `scrollProgress`, `opacityAt`, `anchorFor`; `createVaseUniforms`, `createVaseMaterials`.
- Produces:
  - `loadVase(url: string, materials: { shards: Material; seams: Material }): Promise<Group>`: rinomina gli attributi custom (`_center` → `aCenter`, `_scatter_pos` → `aScatterPos`, `_scatter_axis` → `aScatterAxis`, `_scatter_angle` → `aScatterAngle`, `_start` → `aStart`, `_end` → `aEnd`, `_seam_start` → `aSeamStart`, `_seam_end` → `aSeamEnd`) e assegna i materiali ai nodi `shards` e `seams`.
  - `mountVase(canvas: HTMLCanvasElement, opts: { opening: Element; url: string; reducedMotion: boolean; onFail: () => void }): Promise<{ destroy(): void }>`
  - `boot(): void`: punto d'ingresso lato client.

- [ ] **Step 1: `src/gl/vase/loadVase.ts`**

```ts
import type { BufferAttribute, BufferGeometry, Group, Material, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const RENAMES: Record<string, string> = {
  _center: 'aCenter',
  _scatter_pos: 'aScatterPos',
  _scatter_axis: 'aScatterAxis',
  _scatter_angle: 'aScatterAngle',
  _start: 'aStart',
  _end: 'aEnd',
  _seam_start: 'aSeamStart',
  _seam_end: 'aSeamEnd',
};

function renameAttributes(geometry: BufferGeometry): void {
  for (const [from, to] of Object.entries(RENAMES)) {
    const attr = geometry.getAttribute(from) as BufferAttribute | undefined;
    if (attr) {
      geometry.setAttribute(to, attr);
      geometry.deleteAttribute(from);
    }
  }
}

export function loadVase(
  url: string,
  materials: { shards: Material; seams: Material },
): Promise<Group> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const found = { shards: false, seams: false };
        gltf.scene.traverse((obj) => {
          const mesh = obj as Mesh;
          if (!mesh.isMesh) return;
          if (mesh.name === 'shards' || mesh.name === 'seams') {
            renameAttributes(mesh.geometry);
            mesh.material = materials[mesh.name];
            mesh.frustumCulled = false; // gli shader spostano i vertici fuori dal bounding box
            found[mesh.name] = true;
          }
        });
        if (!found.shards || !found.seams) {
          reject(new Error('il modello non contiene i nodi "shards" e "seams"'));
          return;
        }
        resolve(gltf.scene);
      },
      undefined,
      reject,
    );
  });
}
```

- [ ] **Step 2: `src/gl/vase/vaseScene.ts`**

```ts
import { MathUtils, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { PerfGovernor, buildPixelRatioLevels } from '../governor';
import { RenderScheduler } from '../renderScheduler';
import { MAX_PIXELS, browserEnv, capPixelRatio, readSettings } from '../settings';
import { loadVase } from './loadVase';
import { anchorFor, opacityAt, scrollProgress } from './math';
import { createVaseMaterials, createVaseUniforms } from './material';

export interface MountOptions {
  opening: Element;
  url: string;
  reducedMotion: boolean;
  onFail: () => void;
}

export async function mountVase(
  canvas: HTMLCanvasElement,
  { opening, url, reducedMotion, onFail }: MountOptions,
): Promise<{ destroy(): void }> {
  const settings = readSettings(browserEnv());
  const levels = buildPixelRatioLevels(window.devicePixelRatio, settings.weak);
  const maxPixels = settings.forceHd ? Infinity : MAX_PIXELS;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;

  const uniforms = createVaseUniforms();
  uniforms.uDrift.value = reducedMotion ? 0 : 1;
  const materials = createVaseMaterials(uniforms);

  const governor = new PerfGovernor({
    levels,
    onChange: () => {
      applySize();
      scheduler.request();
    },
  });

  function applySize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(capPixelRatio(governor.pixelRatio, w, h, maxPixels));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let vase: Awaited<ReturnType<typeof loadVase>>;
  try {
    vase = await loadVase(url, materials);
  } catch (err) {
    console.error(err);
    materials.dispose();
    renderer.dispose();
    onFail();
    return { destroy() {} };
  }
  vase.rotation.x = 0.1;
  scene.add(vase);

  const scheduler = new RenderScheduler(
    (dt) => {
      governor.tick(dt);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const p =
        settings.debugP ??
        scrollProgress(window.scrollY, document.documentElement.scrollHeight, h);
      const a = anchorFor(w, h, p);
      const halfW = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;

      uniforms.uP.value = p;
      uniforms.uTime.value = performance.now() / 1000;
      uniforms.uOpacity.value = opacityAt(p) * a.opacityMul;
      vase.position.x = a.x * halfW;
      vase.scale.setScalar(a.scale);
      renderer.render(scene, camera);
    },
    (cb) => requestAnimationFrame(cb),
    (id) => cancelAnimationFrame(id),
    () => document.hidden,
  );

  const request = () => scheduler.request();
  const onResize = () => {
    applySize();
    scheduler.request();
  };
  const onVisibility = () => {
    if (!document.hidden) scheduler.request();
  };
  const onLost = (e: Event) => e.preventDefault();

  applySize();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', request);

  // Deriva dei frammenti: frame continui (30 fps) solo con l'apertura visibile.
  const io = new IntersectionObserver(([entry]) => {
    if (reducedMotion) return;
    if (entry.isIntersecting) scheduler.startLoop(30);
    else scheduler.stopLoop();
  });
  io.observe(opening);

  scheduler.request();

  return {
    destroy() {
      io.disconnect();
      scheduler.stop();
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', request);
      materials.dispose();
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 3: `src/gl/boot.ts`**

```ts
import { hasWebGL, setMode } from './support';

export function boot(): void {
  const root = document.documentElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
  const opening = document.getElementById('opening');
  if (!canvas || !opening) return;

  if (!hasWebGL()) {
    setMode(root, 'fallback');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = () =>
    import('./vase/vaseScene').then((m) =>
      m.mountVase(canvas, {
        opening,
        url: `${import.meta.env.BASE_URL}models/vase.glb`,
        reducedMotion,
        onFail: () => setMode(root, 'fallback'),
      }),
    );

  // Il contenuto non dipende dal 3D: si carica a riposo.
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => void start());
  else setTimeout(() => void start(), 200);
}
```

- [ ] **Step 4: Stili e immagine di fallback**

`src/styles/tokens.css`:
```css
:root {
  --black: #0a0a0a;
  --white: #f5f3ee;
  --gold: #c9a24b;
}
```

`src/styles/global.css`:
```css
@import './tokens.css';

* { box-sizing: border-box; }
html { color-scheme: dark; }
body { margin: 0; background: var(--black); color: var(--white); font-family: system-ui, sans-serif; line-height: 1.5; }

#canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; display: block; pointer-events: none; }
[data-mode='fallback'] #canvas { display: none; }

main { position: relative; z-index: 1; }
section { min-height: 100svh; display: flex; align-items: center; padding: 0 8vw; }
.copy { max-width: 28rem; }
.logo-slot { margin: auto; font-size: clamp(3rem, 14vw, 9rem); letter-spacing: .2em; color: var(--gold); }
#closing { justify-content: center; }
.vase-fallback { display: none; max-height: 70svh; }
[data-mode='fallback'] .vase-fallback { display: block; }
```

`public/vase-fallback.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 640" role="img" aria-label="Vaso in terracotta riparato con l'oro">
  <path d="M150 40h100l-8 70c70 50 110 130 110 220 0 110-60 230-152 230S48 440 48 330c0-90 40-170 110-220z" fill="#b5623a"/>
  <g fill="none" stroke="#c9a24b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M158 110l30 90-40 70 55 80-30 90"/>
    <path d="M242 110l-25 80 50 60-45 90 40 100"/>
    <path d="M70 300l90 10 60-30 100 20"/>
  </g>
</svg>
```

- [ ] **Step 5: Pagina di prova `src/pages/index.astro`**

```astro
---
import '../styles/global.css';
---
<html lang="it" data-mode="webgl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kint</title>
  </head>
  <body>
    <canvas id="canvas" aria-hidden="true"></canvas>

    <main>
      <section id="opening">
        <div class="logo-slot" role="img" aria-label="Kint — partner digitale delle piccole imprese">KINT</div>
      </section>
      <section id="kint"><div class="copy"><h1>Il partner digitale delle piccole imprese.</h1><p>Siti belli per le persone. Leggibili dalle AI.</p></div></section>
      <section id="settori"><div class="copy"><h2>Settori</h2><p>Segnaposto: il contenuto arriva con il Piano 2.</p></div></section>
      <section id="servizi"><div class="copy"><h2>Servizi</h2><p>Segnaposto.</p></div></section>
      <section id="contatti"><div class="copy"><h2>Contatti</h2><p>Segnaposto.</p></div></section>
      <section id="closing">
        <img class="vase-fallback" src="/vase-fallback.svg" alt="" width="400" height="640" />
      </section>
    </main>

    <script>
      import { boot } from '../gl/boot';
      boot();
    </script>
  </body>
</html>
```

- [ ] **Step 6: Verificare tipi, test e build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: nessun errore; `dist/` contiene `index.html`, un chunk JS separato per `vaseScene` e `models/vase.glb`.

- [ ] **Step 7: Verifica visiva a diversi valori di `p`**

Run: `npm run dev` e aprire l'URL stampato con il parametro `?p=`.
Expected, per ogni valore:
- `?p=0`: frammenti sparsi, poco opachi, che fluttuano lentamente; nessuna giuntura dorata.
- `?p=0.4`: frammenti più vicini e più opachi; le prime giunture dorate iniziano a comparire.
- `?p=0.7`: vaso quasi ricomposto, molte giunture visibili, alcune ancora incomplete.
- `?p=1`: vaso completo e opaco con tutte le giunture d'oro, al centro dello schermo (desktop).

Poi, senza `?p=`, scorrere la pagina: il vaso deve ricomporsi in modo continuo fino al fondo. La console non deve avere errori (in particolare nessun errore di compilazione dello shader). Se compare un errore GLSL, correggere `material.ts` (il messaggio indica la riga del programma).

- [ ] **Step 8: Aggiornare CLAUDE.md e committare**

Aggiornare la mappa dei file e la sezione «Stato» di `CLAUDE.md` (vaso funzionante con placeholder).

```bash
git add -A
git commit -m "feat: vase scene wired to page scroll with fallback and test page"
```

---

### Task 9: Reduced motion, senza WebGL, budget di peso

**Files:**
- Create: `scripts/check-budget.mjs`

**Interfaces:**
- Consumes: `dist/` prodotto da `npm run build`.
- Produces: `node scripts/check-budget.mjs` esce con 1 se il peso iniziale (HTML + CSS + JS referenziato da `index.html`, in gzip) supera 300 KB o se un file in `dist/models/` supera 1.5 MB.

- [ ] **Step 1: Scrivere `scripts/check-budget.mjs`**

```js
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative, sep } from 'node:path';

const PAGE_BUDGET = 300 * 1024;
const MODEL_BUDGET = 1.5 * 1024 * 1024;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}
const gz = (buf) => gzipSync(buf).length;

const html = readFileSync('dist/index.html', 'utf8');
const referenced = new Set(
  [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) =>
    m[1].replace(/^\.?\//, '').replace(/^\//, ''),
  ),
);

let initial = gz(Buffer.from(html));
let failed = false;
const rows = [['index.html', initial, 'iniziale']];

for (const file of walk('dist')) {
  const rel = relative('dist', file).split(sep).join('/');
  if (rel === 'index.html') continue;
  const raw = readFileSync(file);

  if (rel.startsWith('models/')) {
    rows.push([rel, raw.length, 'modello']);
    if (raw.length > MODEL_BUDGET) {
      console.error(`FAIL ${rel}: ${raw.length} B supera ${MODEL_BUDGET} B`);
      failed = true;
    }
  } else if (referenced.has(rel)) {
    initial += gz(raw);
    rows.push([rel, gz(raw), 'iniziale']);
  } else if (/\.(js|css)$/.test(rel)) {
    rows.push([rel, gz(raw), 'lazy (3D)']);
  }
}

for (const [name, size, kind] of rows) console.log(`${String(size).padStart(9)} B  ${kind.padEnd(10)} ${name}`);
console.log(`\nPeso iniziale: ${initial} B / ${PAGE_BUDGET} B`);

if (initial > PAGE_BUDGET) {
  console.error('FAIL: budget della pagina superato');
  failed = true;
}
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Eseguire il controllo completo**

Run: `npm run check`
Expected: test PASS, `contratto rispettato`, build OK, tabella dei pesi con il chunk 3D marcato `lazy (3D)` e `Peso iniziale: <n> B / 307200 B`, uscita 0. Se il chunk di Three.js risulta tra i file `iniziale`, il modulo 3D è caricato in modo statico: verificare che `boot.ts` usi `import()` dinamico.

- [ ] **Step 3: Provare che il controllo fallisce**

Run: `node -e "require('fs').writeFileSync('dist/models/big.glb', Buffer.alloc(2*1024*1024))"; node scripts/check-budget.mjs; echo "exit=$?"; rm dist/models/big.glb`
Expected: `FAIL models/big.glb ...` e `exit=1`.

- [ ] **Step 4: Verifica manuale di reduced motion, senza WebGL e senza modello**

Run: `npm run dev`.
- **Reduced motion:** in DevTools → Rendering → «Emulate CSS prefers-reduced-motion: reduce», ricaricare. Expected: i frammenti non fluttuano nell'apertura; scorrendo si ricompongono comunque.
- **Senza WebGL:** aggiungere temporaneamente `return false;` come prima riga di `hasWebGL` in `src/gl/support.ts` e ricaricare. Expected: il canvas sparisce, nello spazio di chiusura compare il vaso SVG con le giunture d'oro e il resto della pagina resta usabile. Ripristinare `hasWebGL`.
- **Modello mancante:** rinominare temporaneamente `public/models/vase.glb` e ricaricare. Expected: stesso comportamento del fallback e un errore in console; ripristinare il file.

- [ ] **Step 5: Aggiornare CLAUDE.md e committare**

In `CLAUDE.md`: comandi definitivi (`dev`, `build`, `test`, `check`, `vase:placeholder`, `vase:build`, `vase:check`), mappa dei file completa, sezione «Stato» («Piano 1 completato: vaso con modello placeholder; Piano 2 (sito) da scrivere») e data.

```bash
git add -A
git commit -m "chore: bundle budget check and fallback verification"
```

---

## Self-Review

**Copertura dello spec B:** progresso `p` e tabella di comportamento (Task 3, 6, 8); contratto del GLB, script di build e placeholder (Task 5, 6); shader con deriva, rotazione, opacità con dithering e crescita delle giunture (Task 7); layout desktop/mobile/chiusura (Task 3 `anchorFor`, Task 8); rendering on-demand e ciclo a 30 fps con `IntersectionObserver` (Task 4, 8); reduced motion (Task 8, 9); tier e tetto ai pixel (Task 1, 2, 8); fallback senza WebGL, modello mancante e perdita del contesto (Task 8, 9); test unitari e script di verifica (Task 2-4, 6, 9). Spazio di chiusura: sezione `#closing` nella pagina di prova (Task 8).

**Spec stack:** Astro, DPR 1.5, `Settings`, niente GSAP/Lenis, modulo 3D come chunk separato (Task 1, 8, 9). SMAA non incluso (fuori scopo v1, come da spec). Contenuti, lingue e SEO sono nel Piano 2.

**Placeholder:** nessuno nel codice. Le deviazioni (matcap procedurali, GLB non compresso) sono dichiarate nei vincoli globali. I contenuti della pagina di prova sono segnaposto voluti fino al Piano 2.

**Coerenza dei tipi:** `RenderScheduler` (`request`, `startLoop`, `stopLoop`, `stop`), `PerfGovernor` (`pixelRatio`, `tick`), `Settings`, `capPixelRatio`, `MAX_PIXELS`, `anchorFor` → `{x, scale, opacityMul}`, `VaseUniforms`, `createVaseMaterials` → `{shards, seams, dispose}`, `loadVase(url, materials)` e i nomi degli attributi (`_CENTER` nel GLB → `_center` in three → `aCenter` nello shader) sono coerenti tra i task.

**Rischi da controllare durante l'esecuzione:** compilazione degli shader con la versione di Three installata (i punti di innesto `#include <beginnormal_vertex>`, `<begin_vertex>`, `<clipping_planes_fragment>` esistono in `MeshMatcapMaterial`); tsconfig di Astro con `verbatimModuleSyntax` (usare `import type` per i soli tipi); regex del budget sul formato dell'HTML generato da Astro.
