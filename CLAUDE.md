# Kint

Sito aziendale di Kint (web agency, Lugano) in IT/EN/FR/DE, con un vaso 3D in kintsugi che si ricompone scorrendo la pagina. Ultimo aggiornamento: 2026-09-30.

## Stato

Design completato. Piano 1 (scaffold Astro + vaso 3D) scritto e in esecuzione; Piano 2 (sito, contenuti, lingue, SEO) da scrivere dopo il vaso. Task 1 del Piano 1 completato: scaffold migrato ad Astro.

Documenti (leggerli prima di lavorare):
- `docs/brief/kint-site-brief.md` contenuti, requisiti SEO/AI, multilingua. Fonte unica dei testi.
- `docs/superpowers/specs/2026-09-30-kint-stack-and-split-design.md` stack, budget, migrazione, ordine di lavoro.
- `docs/superpowers/specs/2026-09-30-kint-site-design.md` sotto-progetto A (sito).
- `docs/superpowers/specs/2026-09-30-kint-vase-experience-design.md` sotto-progetto B (vaso 3D).
- `docs/superpowers/plans/2026-09-30-kint-astro-vase.md` Piano 1: scaffold Astro e vaso (9 task).
- Il primo spec e il primo piano (`...-3d-scroll-site...`) sono superati: solo storico.

## Stack (deciso)

Astro statico su Cloudflare Pages, contenuti YAML per lingua, Three.js (versione fissata) con un solo canvas fisso, matcap, scroll nativo (niente GSAP né Lenis), glTF con Meshopt, Vitest. Tecniche prese dal documento «Stack tecnologico» di lusion.co: si riproducono i pattern, non testi né identità.

## Regole

- Tutto il contenuto è nell'HTML del server, leggibile con `curl` senza JavaScript. Il canvas è decorativo.
- Three.js solo con import nominali. Rendering on-demand; unica eccezione la deriva dei frammenti nell'apertura (30 fps, solo se visibile).
- DPR massimo 1.5 e tetto 2560×1440 pixel. Nessuna luce né ombra in tempo reale.
- Zoom consentito, contrasto AA, `prefers-reduced-motion` rispettato.
- Palette: oro, nero, bianco (valori indicativi nello spec del sito). Logo SVG in arrivo: spazio riservato.
- Non inventare dati: i `[TODO]` del brief si omettono in produzione e si elencano nel report.
- Portfolio: costruito ma non pubblicato (`PORTFOLIO_PUBLISHED=false`).

## Budget

Pagina sotto 300 KB gzip (modulo 3D e modello esclusi), modello sotto 1.5 MB, LCP sotto 2.5 s, Lighthouse mobile Performance ≥ 90, Accessibilità ≥ 95, SEO 100.

## File e comandi (stato reale)

- Progetto Astro statico: `astro.config.mjs`, `src/pages/index.astro` (per ora provvisoria), `tsconfig.json`, `vitest.config.ts`.
- `src/gl/support.ts` (`hasWebGL`, `setMode`), `src/gl/renderScheduler.ts` (rendering on-demand), `src/gl/governor.ts` (`PerfGovernor`, DPR massimo 1.5): logica pura con test in `tests/`.
- Comandi: `npm run dev`, `npm run build` (tsc + astro build), `npm test`. Gli script del vaso (`vase:*`) e `npm run check` arrivano con il Piano 1.

## Manutenzione di questo file

Chi aggiunge, sposta o rimuove file, cambia un comando npm, un budget o una decisione di stack aggiorna questo file **nello stesso commit** e la data in cima. Tienilo sotto le 100 righe: si carica nel contesto a ogni sessione. Non duplicare ciò che si legge nel codice o negli spec.
