# Kint, sotto-progetto B: il vaso in kintsugi (design)

Data: 2026-09-30. Stack e vincoli globali: `2026-09-30-kint-stack-and-split-design.md`.

## Concetto

Un vaso in terracotta rotto in 24-40 frammenti. Nell'apertura i frammenti fluttuano sparsi e molto opachi. Scorrendo tutto il sito si avvicinano, ruotano verso la posizione finale e diventano sempre più opachi. Le giunture d'oro crescono lungo le fratture mentre i frammenti si uniscono. A fondo pagina il vaso è completo, opaco, con tutte le giunture.

## Progresso

`p = scrollY / (altezza del documento − altezza della finestra)`, limitato a [0, 1]. È l'unico input dello scroll.

| p | Frammenti | Opacità | Giunture d'oro |
|---|---|---|---|
| 0 (apertura) | Sparsi, fluttuano | ~0.2 | Assenti |
| 0 → ~0.85 | Si avvicinano e ruotano verso la posa finale, ciascuno con il proprio ritardo | Sale da 0.2 a 1 | — |
| ~0.35 → ~0.95 | — | — | Ogni giuntura cresce lungo la frattura da un capo all'altro, a partire da quando i due frammenti che unisce sono vicini |
| 1 (fondo) | Posizione finale | 1 | Complete |

## Pipeline del modello

**Contratto del GLB (per il modello reale di Blender e per il placeholder):**
- Un nodo mesh per frammento, chiamato `shard_XX` (XX da 00), solido e chiuso, in posizione assemblata.
- Un nodo mesh per giuntura, chiamato `seam_AA_BB` (AA e BB sono gli indici dei due frammenti uniti). La mesh è un nastro lungo la frattura, i cui vertici hanno UV con `u` da 0 a 1 lungo il percorso.
- Nessuna texture: il colore viene dal matcap.

**Script `scripts/build-vase.mjs`** legge il GLB e produce `public/models/vase.glb` con:
- Una sola geometria per i frammenti e una per le giunture, per avere due draw call in tutto.
- Attributi per vertice dei frammenti: `aScatterPos` (vec3), `aScatterAxis` (vec3), `aScatterAngle` (float), `aStart` e `aEnd` (float, finestra di `p` in cui il frammento si assembla), tutti generati con un seme fisso.
- Attributi per vertice delle giunture: `aSeamStart` e `aSeamEnd`, ricavati da `aEnd` dei due frammenti collegati, più `u` lungo il percorso.
- Compressione Meshopt.

**Placeholder** (finché non c'è il modello reale): uno script genera un vaso di rivoluzione diviso in celle per angolo e altezza, ognuna con spessore, e le giunture lungo i bordi delle celle. Rispetta il contratto, così tutto il resto si prova subito.

## Rendering

- **Frammenti:** materiale matcap (`MeshMatcapMaterial` con `onBeforeCompile`). Il vertex shader calcola posizione e rotazione da `p`: con `e = smoothstep(aStart, aEnd, p)`, `pos = ruota(aScatterAxis, aScatterAngle·(1−e), locale − centro) + centro + aScatterPos·(1−e) + deriva·(1−e)`. La deriva usa `uTime` ed è nulla quando `e = 1` o con movimento ridotto.
- **Giunture:** matcap dorato. Il fragment shader scarta i pixel con `u > (p − aSeamStart) / (aSeamEnd − aSeamStart)`, così la giuntura si "disegna" lungo il percorso.
- **Opacità:** `opacity(p)` sale da 0.2 a 1 fino a p = 0.85. È resa con dithering (soglia a matrice, `discard`), per non avere trasparenza e problemi di ordinamento tra i frammenti.
- **Camera fissa.** Il gruppo del vaso si sposta solo tramite il layout (sotto).

## Layout e leggibilità

- **Desktop:** il testo occupa la parte sinistra (colonna di larghezza massima limitata); il vaso è ancorato a destra. Negli ultimi ~8% di `p` il vaso scivola al centro.
- **Mobile e schermi piccoli:** il vaso è al centro, a opacità ridotta dietro il testo, e sale all'opacità piena solo nell'ultima schermata.
- **Chiusura:** dopo i Contatti c'è uno spazio di circa una schermata con il vaso completo e il logo, prima del footer.
- Il layout è una funzione pura `anchorFor(width, height, p)` che restituisce posizione e scala.

## Rendering on-demand e movimento

- Fuori dall'apertura si disegna solo durante lo scroll (`RenderScheduler.request()` a ogni evento di scroll e resize).
- Mentre l'apertura è visibile la deriva richiede frame continui: si disegna a 30 fps. Un `IntersectionObserver` sull'apertura attiva e ferma il ciclo.
- Con `prefers-reduced-motion`: nessuna deriva; i frammenti si muovono solo con lo scroll.
- Con la scheda in background non si disegna.

## Tier di qualità e resilienza

- `Settings` decide DPR (massimo 1.5, dispositivi deboli 1.25) e tetto a 2560×1440; `PerfGovernor` scende di livello se gli fps calano sotto 45.
- **Senza WebGL, modello non caricato o perdita del contesto non recuperabile:** si mostra un'immagine statica (SVG) del vaso completo con le giunture d'oro, solo nello spazio di chiusura. Il sito resta interamente usabile.
- Il modulo 3D si carica dopo il contenuto (chunk separato, `requestIdleCallback`) e il contenuto non dipende da esso.

## Struttura dei file

```
src/gl/
  settings.ts        Settings e override da query string
  support.ts         hasWebGL, setMode (ex webgl.ts)
  renderScheduler.ts on-demand, con modalità a 30 fps
  governor.ts        PerfGovernor, buildPixelRatioLevels
  vase/
    math.ts          scrollProgress, shardEase, seamProgress, opacityAt, anchorFor
    material.ts      matcap con shader dei frammenti e delle giunture
    loadVase.ts      caricamento del GLB (Meshopt)
    vaseScene.ts     renderer, camera, mesh, collegamento con lo scroll
scripts/
  make-placeholder-vase.mjs
  build-vase.mjs
  check-vase.mjs     valida il contratto dei nomi e il peso
public/textures/matcap-terracotta.webp, matcap-gold.webp
```

## Test e verifica

- **Unitari (Vitest):** `scrollProgress` (limiti e documento più corto della finestra), `shardEase` (0 prima di `aStart`, 1 dopo `aEnd`, monotona), `seamProgress` (nulla finché i frammenti non sono vicini, 1 alla fine), `opacityAt` (0.2 in 0, 1 da 0.85 in poi), `anchorFor` (desktop, mobile, chiusura).
- **Script:** `check-vase.mjs` fallisce se mancano frammenti o giunture nominati correttamente, se una giuntura cita un frammento inesistente o se il file supera il budget.
- **Manuali:** verifica visiva a p = 0, 0.25, 0.5, 0.75, 1 con un parametro `?p=` di debug; prova con reduced motion; prova senza WebGL; misura degli fps su un telefono di fascia media.

## Fuori scopo

Fisica, interazione con il mouse, audio, illuminazione dinamica, SMAA.
