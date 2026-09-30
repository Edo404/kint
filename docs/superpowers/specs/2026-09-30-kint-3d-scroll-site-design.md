> **SUPERATO il 2026-09-30** da `docs/superpowers/specs/2026-09-30-kint-stack-and-split-design.md` (Astro, due sotto-progetti). Lasciato come storico.

# kint: sito web con modello 3D guidato dallo scroll (design)

Data: 2026-09-30

## Obiettivo

Sito web con un modello 3D che reagisce allo scroll, con animazioni fluide e il minor peso possibile. Il modello 3D va ancora creato.

## Decisioni

- **Tipo di 3D:** uno o pochi oggetti guidati dallo scroll (non una scena immersiva).
- **Approccio scelto:** Three.js vanilla + GSAP ScrollTrigger + Lenis. Scartati: React Three Fiber (overhead di React non necessario per un solo modello) e sequenza di frame (nessuna interattività reale).

## Architettura

| Livello | Scelta |
|---|---|
| Build | Vite (vanilla JS/TS) |
| 3D | Three.js con import selettivi (tree-shaking, ~150-200 KB gzip) |
| Scroll | Lenis + GSAP ScrollTrigger (~30 KB) |
| Modello | glTF/GLB con compressione Draco o Meshopt, texture KTX2 |
| Stile | CSS nativo, HTML semantico |
| Hosting | Statico con CDN (Netlify, Vercel o Cloudflare Pages) |

Un solo `<canvas>` fisso a schermo intero dietro il contenuto HTML. Testo e sezioni scorrono sopra; lo scroll pilota camera e modello. Contenuto e SEO restano nell'HTML, fuori dal canvas.

## Modello 3D

- Creato in Blender: 10-50k triangoli, materiale PBR semplice, pochi materiali con texture atlas per ridurre le draw call.
- Illuminazione: HDRI leggero o luce baked, senza ombre in tempo reale.
- Export GLB con Draco/Meshopt, texture KTX2, ottimizzazione con `gltf-transform`.
- Budget: sotto 1.5 MB, 60 fps su un telefono di fascia media.
- Da definire prima della modellazione: cosa rappresenta il modello e se ha parti mobili o smontabili (incide sull'animazione).

## Prestazioni

- Rendering on-demand: `requestAnimationFrame` disegna solo durante scroll o animazione, GPU inattiva da fermo.
- Pixel ratio `min(devicePixelRatio, 2)`, 1.5 su dispositivi deboli.
- Controllo del frame rate a runtime: sotto 45 fps si abbassano qualità e pixel ratio.
- HTML e testo subito; modello caricato in modo asincrono con barra di avanzamento e fade.
- Asset con nome hashato, cache lunga, compressione Brotli.
- Budget: pagina sotto 300 KB (modello escluso), modello sotto 1.5 MB, LCP sotto 2.5 s su 4G.

## Animazione e scroll

- Una timeline GSAP con un `ScrollTrigger` per sezione, che controlla posizione e rotazione di modello e camera, ed eventualmente i materiali.
- Lenis smorza lo scroll e GSAP lo legge a ogni frame; solo `transform` e proprietà del modello, senza layout thrash.
- `prefers-reduced-motion`: pose statiche tra le sezioni, senza animazione continua.
- Mobile: scroll nativo, senza hijacking pesante.

## Errori e fallback

- WebGL non supportato: immagine statica del modello (render Blender) al posto del canvas; il sito resta usabile.
- Caricamento del modello fallito: stessa immagine di fallback e messaggio discreto.
- Perdita del contesto WebGL: `webglcontextlost` ripristina la scena senza ricaricare.
- Tab in background: il rendering si ferma.

## Test e verifica

- Lighthouse e DevTools; misure su un telefono reale di fascia media.
- Controllo del peso del bundle in build, con fallimento oltre il budget.
- Prova su Chrome, Safari (iOS incluso) e Firefox.

## Fuori scopo

Scena 3D immersiva, più oggetti interattivi, shader e particelle avanzate, CMS e backend.
