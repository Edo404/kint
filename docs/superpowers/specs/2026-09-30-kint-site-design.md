# Kint, sotto-progetto A: il sito (design)

Data: 2026-09-30. Stack e vincoli globali: `2026-09-30-kint-stack-and-split-design.md`. Vaso 3D: `2026-09-30-kint-vase-experience-design.md`.

**Fonte dei contenuti e dei requisiti:** `docs/brief/kint-site-brief.md`. Questo spec non ne duplica i testi: dice come si costruiscono e cosa aggiunge o precisa. In caso di dubbio prevale il brief, tranne per lo stack (Astro invece di Next.js, per peso e HTML statico) e per il posizionamento del canvas.

## Rotte

Per ogni lingua (`/it/`, `/en/`, `/fr/`, `/de/`): `/{lang}/` (single page con 5 blocchi), `/{lang}/portfolio` (costruita, risponde 404 finché `PORTFOLIO_PUBLISHED=false`), `/{lang}/privacy`. `/` reindirizza con 301 a `/it/`, senza redirect per lingua o IP. Lingua sorgente: italiano; EN, FR, DE si generano dopo, dai dati.

Blocchi con ancore stabili: apertura, `#kint`, `#settori`, `#servizi`, `#contatti`, poi lo spazio di chiusura con il vaso completo e il logo, e il footer. Ancore per scheda: `#settori-<id>`, `#servizi-<id>`.

## Contenuti come dati

- Un file per lingua in `src/content/{it,en,fr,de}.yaml`, con le stesse chiavi e gli stessi `id`. I blocchi YAML del brief (sezione 4) sono il punto di partenza per l'italiano.
- Un validatore verifica che le 4 lingue abbiano le stesse chiavi, sezioni e ancore, e che i `servizi_collegati` dei settori puntino a servizi esistenti.
- Da questi dati si generano HTML, JSON-LD, `llms.txt`, `llms-full.txt` e le versioni markdown delle pagine. Nessun contenuto duplicato a mano.
- I campi mancanti del brief (telefono, orari, ragione sociale, IVA, profili social, link per la call) si omettono in produzione; la CTA della call porta a `#contatti`. L'elenco dei `[TODO]` va nel report finale.
- Le traduzioni generate da AI portano `# needs-review` nel file.

## Struttura della pagina

- **Apertura:** schermo intero con solo il logo (SVG inline, `role="img"`, `aria-label` come nel brief) e un indicatore di scorrimento. Il logo è uno spazio riservato finché non arriva l'SVG. Il vero `<h1>` sta nel blocco `#kint`.
- **Presentazione, Settori, Servizi, Contatti:** come da brief (sezioni 4.2-4.5), con HTML semantico (`section` con `aria-labelledby`, `article` per le schede, `address`, `details/summary` per le FAQ). Tutto è nel DOM senza JavaScript.
- **Navigazione:** barra fissa con Settori · Servizi · Contatti e selettore lingua con link reali `<a>`. Il logo torna a `/{lang}/`. La voce Portfolio compare solo con il flag attivo.
- **Chiusura e footer:** spazio di circa una schermata con il vaso completo, poi footer «© 2026 Kint · Lugano, Svizzera», Privacy, Hosting in Svizzera, `info@kint.ch`.
- **Interazioni decorative** (miglioramento progressivo): clic su un settore evidenzia in oro i servizi collegati; la coppia Crepa → Oro delle schede servizio ha un motivo di crepa in SVG/CSS. Il collegamento settore-servizio resta leggibile come testo anche senza JavaScript.
- **Layout con il vaso:** testo in una colonna a sinistra su desktop, con il vaso a destra (vedi spec B). Su mobile testo a tutta larghezza sopra il vaso.

## Stile

- Palette: oro, nero, bianco. Assunzione: fondo nero, testo bianco, oro per accenti, crepe e giunture. Il bianco come fondo si riserva a eventuali superfici chiare; sul bianco il testo oro non passa il contrasto AA e si usa il nero.
- Valori indicativi da confermare con il logo: nero `#0a0a0a`, bianco `#f5f3ee`, oro `#c9a24b`. Sono definiti come variabili CSS in un solo file.
- Font: woff2 locali, `font-display: swap`. La scelta dei caratteri è rimandata al logo.

## SEO e AI-readiness

Come da brief (sezioni 5 e 6.1-6.2), generati dai dati:
- Un solo `<h1>` per pagina, gerarchia h2 → h3 senza salti; `<html lang>`, title e meta description per lingua; canonical autoreferenziale.
- hreflang reciproci `it`, `en`, `fr`, `de` + `x-default` → `/it/`, anche nella sitemap. `og:locale`: `it_IT` (alt `it_CH`), `en_GB`, `fr_CH` (alt `fr_FR`), `de_CH` (alt `de_DE`).
- JSON-LD: `Organization` + `ProfessionalService` con `@id` stabile `https://kint.ch/#organization`, `WebSite`, `OfferCatalog` con un `Service` per servizio (senza prezzi), `FAQPage`, `inLanguage`; `CollectionPage` + `ItemList` e `BreadcrumbList` solo con il portfolio pubblicato. `sameAs` omesso finché mancano i profili.
- `robots.txt` permissivo verso i crawler AI di ricerca e assistenti, con i nomi ufficiali degli user agent verificati prima della pubblicazione; `sitemap.xml` con `lastmod` reali; `/llms.txt` in inglese che linka le 4 lingue, `/llms-full.txt`, versioni markdown per lingua.
- Flag `noindex` da variabile d'ambiente, mai fisso nel codice; attivo su staging, assente in produzione. Cloudflare: verificare che il blocco automatico dei bot AI non sia attivo su kint.ch e documentarlo nel report finale.
- Nessuna statistica di mercato in v1.

## Form e privacy

- Form HTML reale con `label` associate, `name` e `autocomplete` corretti, campi come nel brief e `select` dei settori generato dai dati (+ «Altro»). Antispam con honeypot e rate limit, senza CAPTCHA.
- Endpoint: Cloudflare Worker che invia l'email a `info@kint.ch`; la soluzione è documentata in `README.md`. Il form funziona come richiesta `POST` anche senza JavaScript.
- `/{lang}/privacy`: pagina minima. Il testo legale va validato con chi lo redige prima della pubblicazione (`[TODO]` nel report).

## Portfolio

Template, dati e pagina completi con flag `PORTFOLIO_PUBLISHED` (default `false`). Con flag falso: 404, e nessuna traccia in nav, sitemap, `llms.txt`, JSON-LD, footer o CTA. Con flag vero: tutto compare, con almeno un progetto reale; il passaggio richiede una sola modifica di configurazione. In sviluppo si usano 1-2 progetti fittizi, mai in produzione.

## Struttura del progetto (Astro)

```
src/
  pages/             index.astro (redirect), [lang]/index.astro, [lang]/portfolio.astro, [lang]/privacy.astro,
                     llms.txt.ts, llms-full.txt.ts, robots.txt.ts, [lang]/index.md.ts
  content/           it.yaml, en.yaml, fr.yaml, de.yaml, portfolio.yaml
  components/        Opening, Presentation, Sectors, Services, Contact, Faq, Nav, LangSwitch, Footer, Closing
  lib/               i18n, jsonld, seo, contentSchema (validatore)
  gl/                vedi spec B
  styles/            tokens.css, global.css
functions/ o worker/ endpoint del form
```

## Test e accettazione

Checklist del brief (sezione 7), con questi controlli automatizzabili:
- Build e validazione dei contenuti: le 4 lingue con le stesse chiavi, ancore e dati strutturati.
- `curl` della pagina italiana: contiene h1, tutti i settori, i servizi, le FAQ e i recapiti, senza JavaScript.
- Con `PORTFOLIO_PUBLISHED=false`: `/portfolio` dà 404 e non compare in nessun file o link.
- Nessun `[TODO]` nell'HTML prodotto; nessun `noindex` in produzione; un solo h1; link interni senza 404; JSON-LD valido.
- Lighthouse mobile: Performance ≥ 90, Accessibilità ≥ 95, SEO 100 (misura manuale su build di produzione).
- Test di visibilità sulle AI dopo il rilascio (brief, sezione 7): 10 query nelle 4 lingue, ripetute a 2, 4 e 8 settimane.

## Fuori scopo (v1)

Endpoint `/api/kint.json`, OpenAPI e MCP (fase 2 del brief); switch Italia/Svizzera; slider prima/dopo; mockup gadget 3D; portfolio pubblicato.

## Domande aperte

- Logo SVG (spazio riservato) e caratteri tipografici.
- Conferma dei valori dei colori.
- Titolo `h1` tra le tre alternative del brief (di default quello principale).
- Elenco dei progetti del portfolio e profili social.
