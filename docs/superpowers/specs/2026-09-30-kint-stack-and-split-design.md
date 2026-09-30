# Kint: stack, sotto-progetti e migrazione (design d'insieme)

Data: 2026-09-30

Questo documento sostituisce `2026-09-30-kint-3d-scroll-site-design.md` e il piano `docs/superpowers/plans/2026-09-30-kint-3d-scroll-site.md`, che restano nel repo come storico. Fonti: `docs/brief/kint-site-brief.md` (contenuti e requisiti del sito) e il documento «Stack tecnologico» di lusion.co (tecniche da riprodurre, non testi né identità).

## Obiettivo

Sito aziendale di Kint (web agency, Lugano) in 4 lingue, leggibile dall'HTML del server senza JavaScript, con un'esperienza 3D leggera: un vaso in terracotta rotto i cui frammenti fluttuano nell'apertura e si ricompongono, con giunture d'oro (kintsugi), man mano che si scorre tutto il sito.

## Sotto-progetti

| | Spec | Contenuto |
|---|---|---|
| **A. Sito** | `2026-09-30-kint-site-design.md` | Astro, contenuti YAML, 4 lingue, blocchi 1-5, SEO, JSON-LD, `llms.txt`, form, privacy, flag portfolio |
| **B. Vaso** | `2026-09-30-kint-vase-experience-design.md` | Modello a frammenti, shader, animazione a scroll, tier di qualità, fallback |

Ordine: 0) scaffold Astro e migrazione dei moduli esistenti; 1) B con frammenti placeholder; 2) A in italiano integrando B; 3) EN, FR, DE; 4) verifica finale di SEO, AI-readiness e prestazioni. Ogni sotto-progetto ha il proprio piano.

## Stack

| Livello | Scelta |
|---|---|
| Sito | Astro, output statico, hosting Cloudflare Pages |
| Contenuti | Content collections di Astro da `content/{it,en,fr,de}.yaml` (stessi id e chiavi) |
| 3D | Three.js con versione fissata, un solo canvas `#canvas` fisso dietro il DOM, modulo caricato come chunk separato |
| Shading | Matcap (terracotta e oro), nessuna luce né ombra in tempo reale |
| Animazione e scroll | Nessun GSAP né Lenis: lo scroll nativo produce il progresso `p` che pilota gli shader |
| Renderer | `antialias: true` (MSAA nativo) finché una misura non giustifica SMAA in post; DPR massimo 1.5; tetto a 2560×1440 pixel |
| Impostazioni | Oggetto `Settings` (`isMobile`, `isRetina`, `cpuCoreCount`, `IS_SMALL_SCREEN` con lato corto ≤ 820 px), override da query string per il debug |
| Prestazioni a runtime | Rendering on-demand, `PerfGovernor` come rete di sicurezza |
| Modello | glTF con compressione Meshopt |
| Font | woff2 locali con `font-display: swap` |
| Test | Vitest per la logica pura |
| Consegna | Asset con nome hash e cache `immutable`, code splitting |

## Vincoli globali

- Tutto il contenuto è nell'HTML restituito dal server. Il canvas è decorativo (`aria-hidden`).
- Zoom consentito: mai `user-scalable=no`. Contrasto AA. `prefers-reduced-motion` rispettato.
- Budget: pagina sotto 300 KB gzip (modulo 3D e modello esclusi, misurati a parte); modello sotto 1.5 MB (obiettivo 500 KB); LCP sotto 2.5 s; CLS sotto 0.1; Lighthouse mobile Performance ≥ 90, Accessibilità ≥ 95, SEO 100.
- Palette: oro, nero, bianco. Logo: SVG fornito dopo; per ora uno spazio riservato.
- Nessun dato `[TODO]` del brief va mostrato in produzione: si omette il campo.

## Migrazione del lavoro già fatto (Task 1-4)

- **Restano:** `src/support/webgl.ts`, `src/three/renderScheduler.ts`, `src/perf/governor.ts` e i relativi test, perché sono TypeScript senza dipendenze dal framework. I file si spostano nella cartella `src/gl/` del nuovo progetto.
- **Da modificare:** `buildPixelRatioLevels` passa da tetto 2 a tetto 1.5 (tetto 1.25 sui dispositivi deboli), con i test aggiornati.
- **Da sostituire:** lo scaffold Vite (`index.html`, `src/main.ts`, `src/style.css`, `vite.config.ts`, script di `package.json`) con un progetto Astro. Vite resta come bundler interno di Astro.
- **Scartati:** GSAP e Lenis, `RoomEnvironment`, le pose per sezione, il modello placeholder a ottaedro, il transcoder KTX2.
- **Da riscrivere:** `CLAUDE.md`, per riflettere il nuovo stack e la nuova mappa dei file.

## Fuori scopo (v1)

Switch Italia/Svizzera, slider prima/dopo, mockup di gadget 3D, audio, video, endpoint per agenti e MCP (fase 2 del brief), pagina portfolio pubblicata, SMAA (finché non serve).

## Rischi

- **Modello reale:** il vaso fratturato va creato in Blender; finché non c'è si usa un placeholder procedurale. Il contratto del file è nello spec B.
- **Traduzioni:** generate da AI, marcate `# needs-review` finché non le rivede un madrelingua.
- **Leggibilità del testo sopra il 3D:** il vaso resta a bassa opacità e sul lato opposto al testo; da verificare su dispositivi reali.
