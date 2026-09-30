# Kint

Sito aziendale di Kint (web agency, Lugano) in IT/EN/FR/DE, con un vaso 3D in kintsugi che si ricompone scorrendo la pagina. Ultimo aggiornamento: 2026-09-30.

## Stato

Piano 1 (scaffold Astro + vaso 3D con modello placeholder) completato. Piano 2 (sito: contenuti YAML, 5 blocchi, 4 lingue, SEO/JSON-LD, form) scritto, da eseguire. Da fare anche: modello reale del vaso in Blender, logo SVG, verifica su telefono reale e con `prefers-reduced-motion`.

Documenti (leggerli prima di lavorare):
- `docs/brief/kint-site-brief.md` contenuti, requisiti SEO/AI, multilingua. Fonte unica dei testi.
- `docs/superpowers/specs/2026-09-30-kint-stack-and-split-design.md` stack, budget, migrazione, ordine di lavoro.
- `docs/superpowers/specs/2026-09-30-kint-site-design.md` sotto-progetto A (sito).
- `docs/superpowers/specs/2026-09-30-kint-vase-experience-design.md` sotto-progetto B (vaso 3D).
- `docs/superpowers/plans/2026-09-30-kint-astro-vase.md` Piano 1: scaffold Astro e vaso (9 task).
- `docs/superpowers/plans/2026-09-30-kint-site.md` Piano 2: sito, contenuti, 4 lingue, SEO, form (11 task).
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

- Progetto Astro statico. `src/pages/index.astro` è una **pagina di prova** con sezioni segnaposto (contenuti veri nel Piano 2). Stili in `src/styles/` (`tokens.css` con la palette, `global.css`).
- `src/gl/`: `support.ts` (WebGL e modalità fallback), `renderScheduler.ts` (on-demand + ciclo a fps), `governor.ts` (DPR massimo 1.5), `settings.ts` (override `?p=0..1` per fissare il progresso, `?USE_HD=1`), `boot.ts` (ingresso client, carica il 3D come chunk separato a riposo).
- `src/gl/vase/`: `math.ts` (progresso, easing, opacità, layout), `material.ts` (matcap procedurali + shader), `loadVase.ts`, `vaseScene.ts` (scena, scroll, ciclo di vita).
- Modello: sorgente `models-src/vase.raw.glb` (contratto nello spec B: nodi `shard_XX` e `seam_AA_BB`); `scripts/build-vase.mjs` produce `public/models/vase.glb`; `scripts/check-vase.mjs` verifica contratto e peso. Il vaso attuale è un **placeholder** generato da `scripts/make-placeholder-vase.mjs`.
- Sito (Piano 2, in corso): `src/lib/i18n.ts` (lingue, percorsi, hreflang), `flags.ts` (`PORTFOLIO_PUBLISHED`, `NOINDEX`; vedi `.env.example`), `content.types.ts` e `contentSchema.ts` (validatore dei contenuti YAML: struttura, id, parità tra lingue, nessun `[TODO]`).
- Comandi: `npm run dev`, `build`, `test`, `check` (test + contratto + build + budget), `vase:placeholder`, `vase:build`, `vase:check`.
- Da sapere: i matcap sono generati a runtime (nessuna texture); il GLB non è compresso con Meshopt (il loader lo supporta); la trasparenza è un dithering a soglia (a opacità intermedie si vede la trama).

## Manutenzione di questo file

Chi aggiunge, sposta o rimuove file, cambia un comando npm, un budget o una decisione di stack aggiorna questo file **nello stesso commit** e la data in cima. Tienilo sotto le 100 righe: si carica nel contesto a ogni sessione. Non duplicare ciò che si legge nel codice o negli spec.
