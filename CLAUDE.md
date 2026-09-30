# Kint

Sito aziendale di Kint (web agency, Lugano) in IT/EN/FR/DE, con un vaso 3D in kintsugi che si ricompone scorrendo la pagina. Ultimo aggiornamento: 2026-09-30.

## Stato

Piani 1 (scaffold Astro + vaso 3D) e 2 (sito, 4 lingue, SEO, form) completati. Restano, fuori dal codice: modello reale del vaso in Blender, logo SVG e caratteri, dati mancanti del brief (vedi `README.md`), revisione delle traduzioni e del testo legale della privacy, deploy su Cloudflare (Email Routing, rate limit, verifica blocco bot AI), verifica su telefono reale e con `prefers-reduced-motion`, Lighthouse.

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
- Modello del vaso: anfora con due anse fratturata in 140 frammenti (Voronoi con distorsione a rumore, bordi levigati lungo la superficie per togliere gli scalini della griglia) e giunture d'oro irregolari a spessore variabile. `scripts/make-vase.mjs` lo genera in `models-src/vase.raw.glb` (contratto: nodi `shard_XX` e `seam_AA_BB`, anche a 3 cifre); `scripts/build-vase.mjs` lo fonde in `public/models/vase.glb` (mesh `shards` con attributo `_SHARD`, mesh `seams` con `_PAIR` = a*1024+b, indici condivisi); `scripts/check-vase.mjs` verifica contratto, peso (< 1 MB, il file è compresso con Meshopt: ~350 KB), sagoma (pancia/collo > 2.2), anse e irregolarità delle giunture (> 1.15). Per un modello reale di Blender basta rispettare lo stesso contratto (fino a 200 frammenti). `?perf=1` mostra fps, draw call e triangoli a schermo per misurare su un dispositivo.
- Colore del vaso (in `material.ts`): tinta per frammento (ocra, ruggine, bruno), macchie chiare/scure e fasce di cottura con rumore a due ottave, grana con perturbazione della normale, interno più scuro e pareti di frattura in argilla cruda (attributo `_KIND`), oro con variazione lungo la giuntura, bordi scuri e scintille (`uv.y` = coordinata trasversale). `uQuality` = 0 sui dispositivi deboli disattiva grana, seconda variazione fine e scintille.
- I parametri di movimento per frammento non stanno nel file: `src/gl/vase/shardData.ts` li genera a runtime da un seme e li passa agli shader in una texture N×3 (`loadVase.ts`, `material.ts`). Gli attributi del loader possono essere interleaved: leggerli con `getX(i)`, mai con `.array`.
- Comandi: `npm run dev`, `build`, `test`, `check` (test + contratto + build + budget + HTML), `vase:placeholder`, `vase:build`, `vase:check`. Variabili: `PORTFOLIO_PUBLISHED`, `NOINDEX` (vedi `.env.example`). Dopo aver aggiunto una lingua o un file in `src/content/` riavviare `npm run dev` (la cache dei contenuti resta all'avvio).
- Da sapere: i matcap sono generati a runtime (nessuna texture); il GLB non è compresso con Meshopt (il loader lo supporta); l'opacità non usa trasparenza né retinatura: il colore sfuma verso il nero di sfondo (`FADE_BG` in `material.ts`); se cambia il colore di sfondo della pagina va aggiornato anche lì. Il vaso è sempre al centro come sfondo, attenuato al 60% dietro i contenuti e pieno nella chiusura (`anchorFor`).

## Manutenzione di questo file

Chi aggiunge, sposta o rimuove file, cambia un comando npm, un budget o una decisione di stack aggiorna questo file **nello stesso commit** e la data in cima. Tienilo sotto le 100 righe: si carica nel contesto a ogni sessione. Non duplicare ciò che si legge nel codice o negli spec.
