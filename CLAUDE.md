# Kint

Sito con un modello 3D guidato dallo scroll, fluido e leggero. Ultimo aggiornamento: 2026-09-30.

**Stato:** in implementazione secondo `docs/superpowers/plans/2026-09-30-kint-3d-scroll-site.md`. Design in `docs/superpowers/specs/2026-09-30-kint-3d-scroll-site-design.md`. La mappa dei file qui sotto descrive lo stato pianificato: riallineala a ciò che esiste davvero.

## Stack e perché

Vite + TypeScript, Three.js vanilla, GSAP ScrollTrigger, Lenis. Un solo modello non giustifica React Three Fiber: React aggiunge peso e re-render inutili. Non sostituirlo senza un motivo concreto.

## Comandi

- `npm run dev` server di sviluppo
- `npm run build` build in `dist/` (type check + Vite)
- `npm test` test unitari (Vitest)
- `npm run check` test + build + controllo dei budget di peso
- `npm run model:optimize` comprime `public/models/kint.raw.glb` in `kint.glb` (Meshopt)
- `npm run model:placeholder` rigenera il modello placeholder

## Mappa dei file

- `index.html` struttura: `#stage` (canvas), `#fallback`, `#loader`, `#notice`, `#story` con le sezioni `#hero`, `#detail`, `#features`, `#cta`
- `src/main.ts` composizione: scena, scheduler, governor, caricamento del modello, scroll
- `src/support/webgl.ts` rilevamento WebGL e modalità `webgl`/`fallback`
- `src/three/renderScheduler.ts` rendering on-demand
- `src/three/scene.ts` renderer, camera, illuminazione da ambiente
- `src/three/loadModel.ts` GLB con Meshopt e KTX2
- `src/perf/governor.ts` abbassa il pixel ratio sotto 45 fps
- `src/scroll/poses.ts` una posa per sezione (posizione, rotazione, distanza camera)
- `src/scroll/scroll.ts` Lenis + timeline GSAP; modalità reduced-motion
- `scripts/` copia del transcoder KTX2, modello placeholder, controllo budget
- `tests/` test unitari della logica pura

## Regole

- Three.js solo con import nominali, mai `import * as THREE`.
- Rendering on-demand: nessun loop continuo. Ogni cambio di stato chiama `scheduler.request()`.
- Nessuna ombra in tempo reale.
- Contenuto e SEO restano nell'HTML, fuori dal canvas.
- Rispettare sempre `prefers-reduced-motion`: pose statiche, senza interpolazione.
- Su touch lo scroll resta nativo.
- Senza WebGL, o se il modello non si carica, si mostra `public/fallback.svg`.
- L'ordine di `POSES` deve coincidere con quello delle sezioni in `index.html`.

## Budget

- Pagina sotto 300 KB gzip (modello e `basis/` esclusi)
- Modello sotto 1.5 MB
- 60 fps su un telefono di fascia media; LCP sotto 2.5 s su 4G

`npm run check` verifica i pesi. Gli fps e l'LCP si misurano a mano (Lighthouse e dispositivo reale).

## Modello 3D

Il modello finale va creato in Blender (10-50k triangoli, materiale PBR semplice, texture atlas). Fino ad allora c'è un placeholder. Procedura di sostituzione e compressione: `README.md`. Dopo la sostituzione aggiornare le pose in `src/scroll/poses.ts`.

## Manutenzione di questo file

Chi aggiunge, sposta o rimuove un file in `src/` o `scripts/`, cambia un comando npm o modifica un budget aggiorna questo file **nello stesso commit** e la data in cima. Tienilo sotto le 100 righe: si carica nel contesto a ogni sessione. Non duplicare qui ciò che si legge nel codice.
