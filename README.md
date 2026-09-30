# Kint

Sito di Kint (web agency, Lugano) in IT, EN, FR e DE, con un vaso 3D in kintsugi che si ricompone scorrendo la pagina. Astro statico, Three.js, contenuti in YAML.

## Comandi

- `npm run dev` server di sviluppo
- `npm run build` build in `dist/`
- `npm test` test unitari
- `npm run check` test, contratto del modello, build, budget di peso e controllo dell'HTML prodotto
- `npm run vase:placeholder` / `vase:build` / `vase:check` modello del vaso

## Contenuti e lingue

I testi stanno in `src/content/{it,en,fr,de}.yaml` (stesse chiavi e stessi id: lo verifica `validateContent` a ogni build). L'italiano è la lingua sorgente; le altre sono traduzioni marcate `# needs-review` finché un madrelingua non le controlla. HTML, JSON-LD, sitemap, `llms.txt` e le versioni markdown si generano da questi file. Dati dell'organizzazione: `src/content/site.yaml`.

Una lingua è pubblicata solo se il suo file YAML esiste.

## Variabili d'ambiente

| Variabile | Effetto |
|---|---|
| `PORTFOLIO_PUBLISHED=true` | Pubblica `/{lang}/portfolio` e lo inserisce in nav, footer, sitemap e `llms.txt`. Richiede almeno un progetto con `publication_allowed: true` in `src/content/portfolio.yaml`. |
| `NOINDEX=true` | Staging: `noindex, nofollow` e `robots.txt` con `Disallow: /`. In produzione non impostare. |

## Deploy su Cloudflare Pages

1. Build: `npm run build`, cartella di output `dist`.
2. Il redirect `/` → `/it/` (301) sta in `public/_redirects`.
3. Form di contatto: `functions/api/contact.ts` invia l'email con Cloudflare Email Routing (`wrangler.toml`, binding `SEND_EMAIL`). Attivare Email Routing su kint.ch e verificare `info@kint.ch` come destinazione. Controllare i nomi del binding nella documentazione Cloudflare.
4. Antispam: il modulo ha un campo trappola e un controllo dell'origine. Aggiungere in Cloudflare una regola di rate limiting su `POST /api/contact` (non si può configurare dal codice).
5. **Cloudflare e crawler AI:** nel pannello, per kint.ch, verificare che non siano attivi il blocco automatico dei bot AI né «AI Labyrinth». Se lo sono, `robots.txt` e tutto il resto non servono. Annotare l'impostazione trovata.
6. Verificare i nomi degli user agent in `src/lib/seoFiles.ts` (`AI_BOTS`) con la documentazione dei fornitori: cambiano.
7. Dopo il primo deploy: inviare la sitemap a Google Search Console e Bing Webmaster Tools.

## Sostituire il logo

`src/components/Logo.astro` contiene un logo segnaposto. Sostituire l'`<svg>` con quello definitivo mantenendo `role="img"` e `aria-label` (nell'apertura) e `aria-hidden` (nella chiusura).

## Sostituire il modello del vaso

Vedi `CLAUDE.md` e lo spec del vaso: il file sorgente è `models-src/vase.raw.glb` (nodi `shard_XX` e `seam_AA_BB`), poi `npm run vase:build` e `npm run vase:check`.

## Dati mancanti (non inventati, omessi dal sito)

- Ragione sociale, indirizzo completo, partita IVA / IDI
- Telefono e orari
- Link per prenotare la call (senza, la CTA porta al modulo)
- Profili social e LinkedIn (`same_as` in `site.yaml`)
- Progetti del portfolio
- Testo legale della privacy: validarlo con chi lo redige (quello attuale è provvisorio)
- Traduzioni EN, FR e DE: farle rivedere da un madrelingua
- Logo SVG definitivo e caratteri tipografici

## Dopo il rilascio

Test di visibilità sulle AI (brief, sezione 7): 10 query nelle 4 lingue su ChatGPT, Gemini, Claude, Perplexity e Google AI Overviews; ripetere a 2, 4 e 8 settimane dall'indicizzazione. Lighthouse mobile: Performance ≥ 90, Accessibilità ≥ 95, SEO 100 (misura manuale su un dispositivo reale).
