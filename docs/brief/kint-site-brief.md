# KINT — Brief contenuti e specifiche tecniche per il nuovo sito

Destinatario: sessione Claude Code che sviluppa il sito.
Lingua del sito: italiano. Dominio: kint.ch.
Convenzioni: `[TODO: ...]` = dato mancante, non inventarlo. Lascia il placeholder visibile nel codice e segnalalo nel report finale.

---

## 0. Come usare questo file

1. Leggi tutto prima di scrivere codice.
2. I blocchi YAML della sezione 4 sono la **fonte unica dei contenuti** (settori, servizi, FAQ, portfolio). Salvali come dati (JSON/YAML/content collection) e genera da lì sia l'HTML sia i JSON-LD sia `llms.txt`. Nessun contenuto duplicato a mano.
3. Il testo tra virgolette «...» è copy definitivo da usare così com'è. Il testo senza virgolette è istruzione.
4. Stack: mantieni quello attuale (Next.js su Cloudflare) salvo motivi tecnici. Requisito non negoziabile: **tutto il contenuto deve essere presente nell'HTML restituito dal server** (SSG o SSR), leggibile con `curl` senza JavaScript.

---

## 1. Chi è Kint (contesto)

- Web agency di Lugano (Ticino, Svizzera), attiva dal 2020 (confermato).
- Mercati: Italia e Svizzera, serviti entrambi da Lugano (nessuna sede in Italia). Lingue del sito: IT, EN, FR, DE (vedi sezione 10). Target: piccole e medie imprese, microimprese, nuove attività.
- Nome: dal *kintsugi*, l'arte giapponese di riparare la ceramica con l'oro, rendendo la riparazione la parte più bella. Concetto guida: ogni problema è una **crepa** che diventa **oro**.
- Team: background misto tra management, informatica, startup, investimenti e social media.
- Posizionamento: «siti belli per le persone, leggibili e utilizzabili dalle AI». Design, UX e branding davanti; sotto, struttura pensata per essere letta da ChatGPT, Gemini, Claude, Perplexity e altri agenti (dati strutturati, HTML semantico, endpoint leggibili da macchina).
- Il sito stesso è il primo caso di prova: va reso il più AI-ready possibile e misurato (sezione 7).

Nome scritto: nel testo corrente **«Kint»** (maiuscola, coerente ovunque: le AI riconoscono meglio un'entità con nome uniforme). Il wordmark grafico può restare minuscolo `kint`.

---

## 2. Struttura del sito

Rotte:

Il sito è multilingua (IT, EN, FR, DE) con prefisso di lingua. Le rotte qui sotto valgono per ogni lingua (`/it/`, `/en/`, `/fr/`, `/de/`). `/` reindirizza con 301 a `/it/` (lingua di default; niente redirect automatico basato su Accept-Language o IP, che disturba i crawler).

| Rotta (per lingua) | Contenuto |
|---|---|
| `/{lang}/` | Single page con 5 blocchi in sequenza (sotto) |
| `/{lang}/portfolio` | Unica pagina separata: tutti i progetti. **Da costruire ma NON pubblicare** (vedi 4.6) |
| `/{lang}/privacy` | Informativa LPD/GDPR (obbligatoria per il form) — pagina minima |

Blocchi di `/` in ordine, con ancore stabili:

1. **Apertura** — schermo intero, solo logo. Nessun altro testo visibile.
2. **Presentazione** `#kint` — frase grande + sottotitolo + storia kintsugi + 4 valori.
3. **Settori** `#settori` — 9 schede.
4. **Servizi** `#servizi` — 9 servizi + fascia «Sempre inclusi» + 3 pacchetti.
5. **Contatti** `#contatti` — form, recapiti, FAQ.

Navigazione: barra fissa con Settori · Servizi · Contatti + selettore lingua (IT · EN · FR · DE, link reali `<a>` alle URL di lingua, non un menu JS). La voce Portfolio compare solo quando il portfolio è pubblicato (flag `PORTFOLIO_PUBLISHED`, default `false`). Il logo torna a `/{lang}/`.

Ogni scheda settore e servizio ha ancora propria (`#settori-ristorazione`, `#servizi-siti`, ecc.) usando gli `id` dei dati.

---

## 3. Vincoli di design che influiscono su SEO/AI

- Apertura solo-logo: il logo è un SVG inline con `role="img"` e `aria-label="Kint — partner digitale delle piccole imprese"`. Il vero `<h1>` sta nel blocco 2. Non nascondere testo con `display:none` o simili.
- Il contenuto non deve dipendere da interazioni JS: schede, FAQ e pacchetti sono già nel DOM. FAQ con `<details>/<summary>`.
- Interazioni decorative (progressive enhancement, solo dopo che tutto il resto funziona):
  - Clic su un settore → i servizi collegati si evidenziano in oro. Il collegamento sta nei dati (`servizi` per settore) e deve essere leggibile anche senza JS, come testo nella scheda.
  - Motivo crepa → oro nelle schede servizio (SVG/CSS).
- Il selettore di lingua è un'altra cosa e va implementato (link reali, vedi 10).
- **Non implementare** nella v1: switch Italia/Svizzera (nasconde contenuto ai crawler e raddoppia i testi), slider prima/dopo, mockup gadget 3D. Rimandati alla sezione 8.
- Contrasto AA, `prefers-reduced-motion` rispettato, LCP < 2,5 s, CLS < 0,1. Immagini con `alt` descrittivo, formato AVIF/WebP.

---

## 4. Contenuti

### 4.1 Blocco 1 — Apertura

Solo logo, centrato, a schermo intero. Un indicatore di scorrimento discreto (freccia, senza testo o con `aria-label="Scorri"`).

### 4.2 Blocco 2 — Presentazione `#kint`

```yaml
h1: "Il partner digitale delle piccole imprese."
h1_alternative_da_valutare:
  - "Il partner digitale che ripara e valorizza la tua impresa."
  - "Il digitale delle piccole imprese, fatto bene."
sottotitolo: "Siti belli per le persone. Leggibili dalle AI."
paragrafo: >
  Kint costruisce la presenza digitale di piccole imprese in Italia e in Svizzera:
  sito, brand, social, Google e automazioni. Ogni sito è progettato per essere
  usato dai clienti e letto da ChatGPT, Gemini, Claude e dagli altri assistenti AI
  che oggi guidano le scelte di acquisto.
cta_primaria: { label: "Scrivici due righe", href: "#contatti" }
cta_secondaria: { label: "Guarda i progetti", href: "/portfolio" }   # solo se PORTFOLIO_PUBLISHED=true, altrimenti ometterla
```

Sotto, due blocchi brevi nella stessa sezione:

```yaml
kintsugi:
  titolo: "Perché Kint"
  testo: >
    Kint viene dal kintsugi, l'arte giapponese di riparare la ceramica rotta con
    l'oro. Non nasconde la frattura: la valorizza. Facciamo lo stesso con la tua
    presenza online. Un sito vecchio, zero prenotazioni, recensioni senza risposta:
    per noi sono crepe. Le ripariamo e le rendiamo la parte migliore.
valori:
  - titolo: "Trasparenza"
    testo: "Opzioni e costi chiari fin dalla prima call. Vogliamo rendere competitiva la tua impresa, non renderti dipendente da noi."
  - titolo: "Rapidità"
    testo: "Lavoriamo per obiettivi, non per ore. Ricevi anteprime e bozze durante tutto il progetto."
  - titolo: "Responsabilità"
    testo: "Ci prendiamo carico del problema. Se non possiamo risolverlo direttamente, troviamo il professionista giusto."
  - titolo: "Qualità"
    testo: "Non puntiamo al prezzo più basso. Puntiamo a risultati che nel tempo fanno risparmiare."
```

Note: i valori derivano dal vecchio kint.ch. «Servizio 24/7» e «100% sostenibili» sono stati **omessi di proposito** perché non verificabili. Non reintrodurli senza conferma.

### 4.3 Blocco 3 — Settori `#settori`

```yaml
titolo: "Parliamo la lingua del tuo mestiere."
intro: "Ogni settore ha problemi tipici e soluzioni già pensate. Trova il tuo."
chiusura: "Non ti riconosci? Scrivici due righe."   # link a #contatti
```

Ogni scheda: nome, «Per chi», «Il problema tipico», «Cosa facciamo», 3 servizi chiave (linkati alle ancore dei servizi).

```yaml
settori:
  - id: ristorazione
    nome: "Ristorazione e ospitalità"
    per_chi: "Ristoranti, bar, grotti, B&B, piccoli hotel, agriturismi"
    problema: "Il cliente cerca su Google, trova un menu in PDF illeggibile da telefono e non riesce a prenotare. Sceglie un altro locale."
    cosa_facciamo: "Sito veloce con menu aggiornabile, prenotazioni dirette e recensioni sotto controllo."
    servizi_chiave: ["Menu digitale multilingua", "Prenotazioni online e recensioni Google", "Reel e contenuti social"]
    servizi_collegati: [siti, google, social]

  - id: agroalimentare
    nome: "Agroalimentare e cantine"
    per_chi: "Cantine, caseifici, frantoi, birrifici, produttori di prodotti tipici"
    problema: "Il prodotto è eccellente ma si vende solo in fiera e col passaparola. Gli intermediari tengono il margine."
    cosa_facciamo: "Vendita diretta online, confezioni coerenti con il prodotto, materiali per fiere e degustazioni."
    servizi_chiave: ["E-commerce per vendita diretta", "Packaging ed etichette", "Gadget per fiere e degustazioni"]
    servizi_collegati: [siti, brand, gadget]

  - id: artigiani-edilizia
    nome: "Artigiani ed edilizia"
    per_chi: "Idraulici, elettricisti, serramentisti, imprese edili"
    problema: "I clienti chiamano chi trovano per primo su Google. Il tuo sito è assente o non si legge da telefono. Ogni preventivo richiede più telefonate."
    cosa_facciamo: "Sito semplice, richiesta di preventivo via WhatsApp con foto, visibilità su Google nella tua zona."
    servizi_chiave: ["Sito leggibile da smartphone, anche in cantiere", "Preventivo via WhatsApp con foto", "Visibilità su Google nella propria zona"]
    servizi_collegati: [siti, ai-automazioni, google]

  - id: studi-professionali
    nome: "Studi professionali"
    per_chi: "Fiduciarie, avvocati, commercialisti, architetti"
    problema: "La fiducia si decide prima del primo contatto. Un sito datato o assente e nessuna presenza professionale online costano clienti."
    cosa_facciamo: "Sito autorevole con pagina team, profilo LinkedIn curato, appuntamenti prenotabili online."
    servizi_chiave: ["Sito autorevole con pagina team", "Presenza curata su LinkedIn", "Prenotazione appuntamenti online"]
    servizi_collegati: [siti, social, ai-automazioni]

  - id: salute-benessere
    nome: "Salute e benessere"
    per_chi: "Dentisti, fisioterapisti, studi medici, estetica, palestre"
    problema: "L'agenda si gestisce al telefono, gli appuntamenti saltano, le recensioni restano senza risposta."
    cosa_facciamo: "Agenda online, promemoria automatici, gestione delle recensioni."
    servizi_chiave: ["Agenda online", "Promemoria automatici per pazienti e clienti", "Gestione delle recensioni"]
    servizi_collegati: [siti, ai-automazioni, google]

  - id: negozi-retail
    nome: "Negozi e retail"
    per_chi: "Boutique, ottici, gioiellerie, negozi di quartiere"
    problema: "Il negozio è vivo in vetrina ma invisibile online. I clienti della zona non sanno cosa hai."
    cosa_facciamo: "Instagram gestito, ordine online con ritiro in negozio, campagne locali mirate."
    servizi_chiave: ["Instagram gestito", "Click & collect", "Campagne locali mirate"]
    servizi_collegati: [social, siti, pubblicita]

  - id: auto-moto-immobiliare
    nome: "Auto, moto e immobiliare"
    per_chi: "Concessionari, officine, noleggio, agenzie immobiliari"
    problema: "Schede povere si perdono tra i portali. I contatti arrivano, ma poco qualificati."
    cosa_facciamo: "Schede curate di veicoli e immobili, foto e video professionali, pubblicità che porta richieste concrete."
    servizi_chiave: ["Schede veicolo o immobile curate", "Lead da pubblicità a pagamento", "Video e foto professionali"]
    servizi_collegati: [siti, pubblicita, foto-video]

  - id: industria-b2b
    nome: "Industria e B2B"
    per_chi: "Produttori, logistica, aziende familiari"
    problema: "Cataloghi in PDF, processi manuali, presenza in fiera scollegata dal digitale."
    cosa_facciamo: "Catalogo digitale, materiali per le fiere, automazioni AI sui processi ripetitivi."
    servizi_chiave: ["Catalogo digitale", "Materiali e gadget per fiere", "Automazioni AI sui processi"]
    servizi_collegati: [siti, gadget, ai-automazioni]

  - id: nuove-aperture
    nome: "Nuove aperture e startup"
    per_chi: "Nuove attività, startup, spin-off"
    problema: "Si parte da zero: nessun nome riconoscibile, nessuna presenza online, poco tempo e poco budget."
    cosa_facciamo: "Brand, sito, social e Google pronti al giorno del lancio, più un kit gadget di apertura."
    servizi_chiave: ["Brand completo: logo e identità visiva", "Sito, social e Google pronti al lancio", "Kit gadget di apertura"]
    servizi_collegati: [brand, siti, gadget, social]
```

### 4.4 Blocco 4 — Servizi `#servizi`

```yaml
titolo: "Cosa facciamo"
intro: "Ogni servizio ripara una crepa. Ognuno funziona da solo o insieme agli altri."
```

Apri il blocco con un riquadro in evidenza (servizio distintivo):

```yaml
in_evidenza:
  id: ai-ready
  titolo: "Siti per persone e per AI"
  testo: >
    Le persone guardano il design. Gli assistenti AI leggono la struttura.
    Costruiamo entrambe: davanti, design, UX e brand; sotto, dati strutturati,
    HTML semantico e contenuti che ChatGPT, Gemini, Claude e Perplexity possono
    leggere, capire e citare. Non promettiamo posizioni: misuriamo come cambia
    la tua visibilità sulle AI e ti mostriamo i risultati.
```

Servizi (griglia di 9). Ogni scheda: titolo, descrizione, coppia Crepa → Oro.

```yaml
servizi:
  - id: siti
    titolo: "Siti ed e-commerce"
    descrizione: "Siti vetrina, shop online, landing page. Multilingua italiano, tedesco, francese."
    crepa: "Il tuo sito è lento e non si legge da telefono."
    oro: "Un sito veloce e chiaro che porta richieste."

  - id: brand
    titolo: "Brand e grafica"
    descrizione: "Logo, identità visiva, cataloghi, packaging, insegne, stampati."
    crepa: "Logo, biglietti e insegna sembrano di aziende diverse."
    oro: "Un'identità riconoscibile ovunque ti vedano."

  - id: gadget
    titolo: "Gadget e merchandising"
    descrizione: "Abbigliamento da lavoro, kit per fiere, regali aziendali, welcome kit."
    crepa: "Regali aziendali che nessuno ricorda."
    oro: "Oggetti che il cliente tiene, usa e associa a te."

  - id: social
    titolo: "Social media"
    descrizione: "Piano editoriale, post, reel, gestione della community."
    crepa: "Il profilo è fermo da mesi."
    oro: "Contenuti regolari e una community che risponde."

  - id: pubblicita
    titolo: "Pubblicità a pagamento"
    descrizione: "Google Ads, Meta (Facebook e Instagram), LinkedIn, campagne geolocalizzate."
    crepa: "Spendi in pubblicità senza sapere cosa rende."
    oro: "Campagne mirate con risultati misurati."

  - id: ai-automazioni
    titolo: "AI e automazioni"
    descrizione: "Chatbot sul sito, risposte alle recensioni, preventivi automatici, flussi automatizzati."
    crepa: "Ore perse ogni giorno in risposte e preventivi ripetitivi."
    oro: "Chatbot e flussi che lavorano al posto tuo."

  - id: google
    titolo: "Google e visibilità locale"
    descrizione: "Scheda Google Business, SEO locale, strategia per le recensioni."
    crepa: "Nessuno ti trova su Google."
    oro: "Scheda ottimizzata, 5 stelle in vista."

  - id: foto-video
    titolo: "Foto e video"
    descrizione: "Shooting sul posto: il materiale per sito, social e pubblicità."
    crepa: "Foto da telefono e materiale sparso."
    oro: "Uno shooting professionale nel tuo ambiente, usato ovunque."

  - id: ai-ready
    titolo: "Visibilità sulle AI"
    descrizione: "Dati strutturati, contenuti leggibili dalle AI, monitoraggio di come ChatGPT, Gemini, Claude e Perplexity parlano di te."
    crepa: "Gli assistenti AI non ti citano, o dicono cose sbagliate su di te."
    oro: "Informazioni corrette, strutturate e citabili."
```

Fascia trasversale «Sempre inclusi»:

```yaml
sempre_inclusi:
  - "Hosting in Svizzera"
  - "Conformità LPD e GDPR"
  - "Aggiornamenti e manutenzione"
  - "Un referente unico"
```

Pacchetti (nomi, senza prezzi):

```yaml
pacchetti:
  titolo: "Tre modi di lavorare insieme"
  voci:
    - nome: "Riparazione"
      testo: "Un intervento singolo su un punto preciso."
    - nome: "Ricomposizione"
      testo: "Rifacimento completo della tua presenza digitale."
    - nome: "Oro continuo"
      testo: "Abbonamento mensile: manutenzione, contenuti e miglioramenti nel tempo."
  nota: "Prezzo chiaro in call, nessuna sorpresa."
```

Regole di copy:
- Non scrivere «prezzo fisso», «prezzi pubblicati», «online in 10 giorni» come promessa globale. «10 giorni» vale solo per i siti vetrina (confermato valido dal titolare).
- Non creare link a `/prezzi` né a «kint vs localsearch».

### 4.5 Blocco 5 — Contatti `#contatti`

```yaml
titolo: "Scrivici due righe."
intro: "Raccontaci la tua attività. Ti rispondiamo con una proposta chiara."
call:
  titolo: "Prima call: 20 minuti online"
  testo: "Prima della call guardiamo la tua presenza online. Ti diciamo cosa non funziona, cosa si può fare e con quale approccio. Decidi tu se andare avanti."
  # check-up e bozza home prima della call: confermati come offerta valida
  cta: { label: "Prenota la call", href: "[TODO: link Cal.com o simile]" }
recapiti:
  email: "info@kint.ch"
  telefono: "[TODO]"
  sede: "Lugano, Ticino, Svizzera"
  # nessuna sede in Italia: servizio a distanza da Lugano
  orari: "[TODO]"
form:
  endpoint: "[TODO: /api/contact o servizio esterno]"
  campi:
    - { nome: "nome", label: "Nome", obbligatorio: true }
    - { nome: "email", label: "Email", tipo: "email", obbligatorio: true }
    - { nome: "telefono", label: "Telefono", obbligatorio: false }
    - { nome: "azienda", label: "Azienda", obbligatorio: false }
    - { nome: "settore", label: "Settore", tipo: "select", opzioni: "id e nome dei 9 settori + «Altro»" }
    - { nome: "messaggio", label: "Messaggio", tipo: "textarea", obbligatorio: true }
    - { nome: "privacy", label: "Ho letto l'informativa privacy", tipo: "checkbox", obbligatorio: true, link: "/privacy" }
  bottone: "Invia"
  requisiti: "Form HTML reale (<form>, <label> associate, name/autocomplete corretti). Antispam senza CAPTCHA invasivo (honeypot + rate limit)."
```

FAQ (sotto il form, `<details>`):

```yaml
faq:
  - d: "Come ottengo un preventivo?"
    r: "Contattaci con il modulo, per email o al telefono. Dopo un breve confronto sulle tue esigenze ti proponiamo più opzioni tra cui scegliere."
  - d: "Quanto costa un sito o un servizio Kint?"
    r: "Dipende dal progetto. Non vendiamo pacchetti standard per non scadere in lavori generici. Ti diamo un prezzo chiaro in call, prima di iniziare."
  - d: "Dove vi trovate e dove lavorate?"
    r: "La sede è a Lugano, in Ticino. Lavoriamo con imprese in Svizzera e in Italia, anche da remoto."
  - d: "Chi siete?"
    r: "Un team con background diversi: management, informatica, startup, investimenti e social media."
  - d: "Come seguo l'avanzamento del lavoro?"
    r: "Ricevi link di anteprima, bozze grafiche e test durante tutto il progetto. Ogni progetto ha un indirizzo email dedicato @kint.ch e un team che risponde alle tue domande."
  - d: "In quanto tempo è pronto il mio progetto?"
    r: "Ricevi una stima dei tempi insieme al preventivo. Un sito vetrina può essere online in 10 giorni."
  - d: "Che garanzie offrite?"
    r: "Se il risultato non ti soddisfa, ti troviamo un'alternativa esterna senza costi per te."
  - d: "Cosa significa che un sito è AI-ready?"
    r: "Significa che, oltre a essere bello e usabile, è strutturato per essere letto da assistenti come ChatGPT, Gemini e Claude: dati strutturati, HTML semantico, informazioni chiare su servizi e contatti. Così le AI capiscono chi sei e possono citarti correttamente."
  - d: "Dove sono ospitati i dati?"
    r: "L'hosting è in Svizzera. Rispettiamo la LPD svizzera e il GDPR europeo."
```

Footer: «© 2026 Kint · Lugano, Svizzera» · Privacy · Hosting in Svizzera · info@kint.ch. `[TODO: ragione sociale, IVA/IDI, indirizzo completo]`

### 4.6 Pagina `/portfolio`

Titolo H1: «Progetti». Intro: «Attività reali, problemi reali. Ecco cosa abbiamo ricomposto.»
**Stato: costruire, non pubblicare.** Non ci sono ancora progetti. Requisiti:
- Template, dati e pagina completi e funzionanti, con 1–2 progetti fittizi solo in ambiente di sviluppo (mai in produzione).
- Flag `PORTFOLIO_PUBLISHED` (default `false`). Con flag `false`: la rotta risponde 404, non compare in nav, sitemap, `llms.txt`, JSON-LD, footer né CTA; nessun link interno la raggiunge.
- Con flag `true`: la pagina va in sitemap, nav, `llms.txt` e JSON-LD (`CollectionPage` + `ItemList`), e con almeno un progetto reale.
- Il passaggio a `true` deve richiedere una sola modifica di configurazione.

Una sola pagina, elenco di progetti con ancora per progetto (`#slug`). Filtro per settore e servizio come link/parametri, con tutti i progetti già nell'HTML.

Schema dati (ogni progetto):

```yaml
progetto:
  slug: ""
  nome: ""
  cliente_settore: "id da settori"
  servizi: ["id da servizi"]
  anno: 0
  url: ""              # sito del cliente, se pubblico
  sintesi: ""          # max 40 parole: problema → cosa abbiamo fatto
  risultati: []        # solo dati verificati, altrimenti lascia vuoto
  immagini: []         # file + alt descrittivo
  permesso_pubblicazione: true   # senza consenso del cliente il progetto non compare
progetti: []   # [TODO: elenco progetti forniti dal titolare]
```

Se non ci sono ancora progetti: non pubblicare la pagina e non linkarla dalla nav. Non inventare casi.

---

## 5. SEO on-page

```yaml
lang: "it"   # per la versione italiana; le altre lingue: vedi sezione 10
title: "Kint — Partner digitale per piccole imprese in Italia e Svizzera"   # ~60 caratteri
meta_description: "Siti, brand, social, Google e automazioni AI per piccole imprese in Italia e Svizzera. Siti belli per le persone, leggibili da ChatGPT, Gemini e Claude."   # <=155
canonical: "https://kint.ch/it/"
og:
  type: website
  locale: it_IT
  locale_alternate: it_CH
  site_name: "Kint"
robots: "index, follow, max-image-preview:large"
portfolio_title: "Progetti — Kint"
portfolio_description: "I progetti realizzati da Kint per piccole imprese in Italia e Svizzera: siti, brand, social e automazioni."
```

Regole:
- **I siti attuali (workers.dev) hanno `noindex, nofollow`.** In produzione su kint.ch va rimosso. Le versioni di staging devono restare `noindex`; controlla che il flag venga da variabile d'ambiente e non da codice fisso.
- Un solo `<h1>` per pagina. Gerarchia h2 → h3 senza salti.
- Le ancore non sostituiscono le pagine: sitemap con `/` e `/portfolio` (+ `/privacy`).
- Open Graph image 1200×630 con logo.
- Favicon SVG + PNG.
- Niente statistiche di mercato in v1. Quelle del vecchio draft erano solo svizzere e non verificate. Se se ne aggiungono, servono fonti con link e dati italiani e svizzeri `[TODO]`.

---

## 6. AI-agent readiness (specifiche)

### 6.1 Fondamenta (obbligatorie)

1. **HTML completo lato server.** I crawler AI in gran parte non eseguono JavaScript.
2. **HTML semantico:** `header`, `nav`, `main`, `section` con `aria-labelledby`, `article` per le schede, `footer`, `address` per i recapiti, `details/summary` per le FAQ, `ul/li` per gli elenchi. Link con testo descrittivo.
3. **Dati strutturati JSON-LD**, generati dai dati della sezione 4 (non scritti a mano), in `<script type="application/ld+json">` nell'HTML iniziale:
   - `Organization` + `ProfessionalService` (stessa entità, `@id` stabile `https://kint.ch/#organization`)
   - `WebSite` con `publisher` → organization
   - `OfferCatalog` con un `Service` per ogni servizio (senza prezzi), `areaServed` Italia e Svizzera, `audience` per i settori
   - `FAQPage` dalle FAQ
   - `CollectionPage` + `ItemList` di `CreativeWork` per `/portfolio`
   - `BreadcrumbList` su `/portfolio`
4. **robots.txt** permissivo verso i crawler AI di ricerca e assistenti, con `Sitemap:` indicato:
   - Consenti: `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `Claude-SearchBot`, `Claude-User`, `ClaudeBot`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `Applebot-Extended`, `Googlebot`, `Bingbot`.
   - Verifica i nomi ufficiali degli user agent nella documentazione dei fornitori prima di pubblicare: cambiano.
5. **Cloudflare:** controlla che nel pannello non sia attivo il blocco automatico dei bot AI o «AI Labyrinth» per kint.ch. Il default recente di Cloudflare per i nuovi domini è bloccare i crawler AI. Se è attivo, tutto il resto non serve. Documenta l'impostazione nel report finale.
6. **`sitemap.xml`** con `lastmod` reali.
7. **Performance:** HTML leggero, nessun contenuto caricato solo dopo hydration.

### 6.2 Aggiunte a basso costo

- `/llms.txt` (markdown: nome, descrizione in 2 righe, elenco di link ai blocchi e al portfolio con una riga ciascuno) e `/llms-full.txt` (tutti i contenuti in un unico markdown). Generati dai dati.
  Nota: nessun grande fornitore AI ha confermato di usare `llms.txt` per il ranking. Costo quasi nullo, beneficio non dimostrato: non presentarlo ai clienti come garanzia.
- Versione markdown di ogni pagina, servita con `Accept: text/markdown` o a `/index.md` e `/portfolio.md`.
- Testo chiaro e autosufficiente: ogni scheda deve avere senso se estratta da sola (nome dell'entità nel testo, nessun «come sopra»).
- Fatti in chiaro e coerenti in tutto il sito e nei JSON-LD: nome, sede, mercati, servizi, contatti, anno.

### 6.3 Fase 2 (rimandata: NON implementare ora, decidere dopo i risultati dei test)

- Endpoint pubblico di sola lettura `/api/kint.json` con servizi, settori e contatti (stessi dati della sezione 4).
- Endpoint `POST /api/contact` documentato (OpenAPI in `/.well-known/openapi.json`) per permettere ad agenti di inviare una richiesta di contatto, con validazione e rate limit.
- Server MCP o WebMCP per esporre «richiedi una call» e «elenca servizi». Sperimentale: valutare a fine test.
- `potentialAction` (`ContactAction` / `ScheduleAction`) nel JSON-LD.

---

## 7. Verifica e test

Checklist di accettazione:

- [ ] L'output di `curl -s https://kint.ch` contiene h1, tutti i settori, i servizi, le FAQ e i recapiti, senza JS
- [ ] Nessun `noindex` in produzione
- [ ] JSON-LD valido su validator.schema.org e Google Rich Results Test
- [ ] robots.txt e sitemap raggiungibili, nessun blocco Cloudflare sui bot AI
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibilità ≥ 95, SEO 100
- [ ] Un solo h1 per pagina, ancore funzionanti, link interni senza 404
- [ ] Nessun `[TODO]` visibile a schermo in produzione (elencarli tutti nel report)
- [ ] hreflang reciproci corretti tra le 4 lingue (+ `x-default`), canonical per lingua, `<html lang>` corretto
- [ ] Con `PORTFOLIO_PUBLISHED=false`: `/portfolio` dà 404 e non compare in nessun file o link (nav, sitemap, `llms.txt`, JSON-LD)
- [ ] Le 4 lingue hanno le stesse sezioni, le stesse ancore e gli stessi dati strutturati

Test di visibilità sulle AI (misurano l'effetto reale):

1. **Prima del rilascio**: definisci 10 query fisse, es. «web agency per piccole imprese a Lugano», «agenzia digitale per ristoranti in Ticino», «chi è Kint kint.ch», «Kint web agency Lugano servizi».
2. Esegui le query nelle 4 lingue (IT, EN, FR, DE), ognuna con la propria formulazione locale. Eseguile su ChatGPT (con ricerca), Gemini, Claude (con ricerca), Perplexity e Google AI Overviews. Registra in una tabella: data, motore, query, Kint citata sì/no, posizione, correttezza delle informazioni.
3. Ripeti a 2, 4 e 8 settimane dopo l'indicizzazione. L'indicizzazione può richiedere tempo: non concludere prima di 4 settimane.
4. Verifica anche in Google Search Console e Bing Webmaster Tools l'invio della sitemap.

---

## 8. Rimandato o scartato (con motivo)

| Idea | Decisione | Motivo |
|---|---|---|
| Switch Italia/Svizzera con bandierine | Rimandato | Contenuto dietro un toggle JS non è leggibile da crawler e AI. Alternativa: esempi neutri o citare entrambi i mercati nel testo statico |
| Slider prima/dopo | Rimandato | Peso e complessità; ha senso quando ci sono progetti reali da mostrare |
| Mockup gadget 3D | Rimandato | Nessun valore SEO/AI, peso alto |
| Statistiche iniziali | Rimosse | Solo svizzere, non verificate |
| «Prezzo fisso», «prezzi pubblicati», `/prezzi`, «kint vs localsearch» | Rimossi | Decisione del titolare: nessun prezzo pubblico |
| «Servizio 24/7», «100% sostenibili» | Rimossi | Promesse non verificabili |

---

## 9. Dati mancanti (riepilogo `[TODO]`)

Il titolare non ha altri dati oltre a quelli in questo file e nei siti esistenti. Non inventarli e non mostrare `[TODO]` in produzione: ometti la riga o il campo finché il dato non arriva.

- Ragione sociale, indirizzo completo, partita IVA / IDI → nel footer e nei JSON-LD usa solo «Lugano, Svizzera» e `info@kint.ch`
- Telefono, orari → ometti
- Link per prenotare la call → se assente, la CTA porta a `#contatti`
- Profili social e LinkedIn di Kint (per `sameAs`) → il titolare li fornirà; ometti `sameAs` finché mancano
- Endpoint del form contatti → scegli una soluzione semplice (es. Cloudflare Worker + invio email a info@kint.ch) e documentala
- Progetti del portfolio → nessuno per ora (vedi 4.6)

Confermati dal titolare: anno 2020, operatività da Lugano su Italia e Svizzera, check-up e bozza home prima della call, garanzia «alternativa a costo zero», sito vetrina online in 10 giorni.

---

## 10. Multilingua (IT, EN, FR, DE)

Italiano = lingua sorgente. Le altre tre sono traduzioni dai dati della sezione 4.

- **Struttura dati:** una versione per lingua di ogni campo testuale (es. `content/it.yaml`, `en.yaml`, `fr.yaml`, `de.yaml`) con le stesse chiavi e gli stessi `id`. Le ancore restano identiche in tutte le lingue (`#settori`, `#servizi`, `#contatti`, `#servizi-siti`): sono identificatori, non testo.
- **URL:** `/it/`, `/en/`, `/fr/`, `/de/`. `/` → 301 a `/it/`. Nessun redirect per lingua del browser o IP.
- **hreflang:** su ogni pagina, link reciproci `it`, `en`, `fr`, `de` + `x-default` → `/it/`. Ripeti gli hreflang nella sitemap. Canonical autoreferenziale per lingua.
- **`<html lang>`** per lingua; `og:locale`: `it_IT` (alt `it_CH`), `en_GB`, `fr_CH` (alt `fr_FR`), `de_CH` (alt `de_DE`).
- **Metadati e JSON-LD** tradotti per lingua, con `inLanguage`. Stesso `@id` per l'entità Organization in tutte le lingue.
- **`llms.txt`:** un file principale in inglese che linka le 4 versioni; markdown per lingua (`/it/index.md`, ecc.).
- **Traduzione:** non letterale. Adatta i giochi di parole e le frasi idiomatiche. Da rendere con equivalenti naturali, non calchi:
  - «Il partner digitale delle piccole imprese» (usa «small businesses» in EN, «petites entreprises» in FR, «kleine Unternehmen» in DE)
  - Coppie «Crepa → Oro» (mantieni la metafora del kintsugi)
  - «Scrivici due righe» (registro informale ma professionale)
  - Pacchetti: Riparazione / Ricomposizione / Oro continuo → EN: Repair / Reassembly / Ongoing Gold · FR: Réparation / Recomposition / Or continu · DE: Reparatur / Neuaufbau / Laufendes Gold. Il titolare può cambiarli.
- **Non tradurre:** Kint, nomi di prodotti (Google Ads, Meta, LinkedIn, WhatsApp, Cal.com), `info@kint.ch`.
- **Registro:** italiano, francese e tedesco con «tu»/«vous»/«Sie» coerente: IT «tu» (come nel testo attuale), FR «vous», DE «Sie». EN neutro.
- **Mercato svizzero:** in DE e FR usa l'ortografia svizzera (DE: «ss» invece di «ß»; valuta CHF dove serve).
- **Revisione:** le traduzioni generate da AI vanno marcate come da rivedere (`# needs-review` nei file dati) e segnalate nel report finale; il titolare le fa controllare a un madrelingua prima della pubblicazione.
- **Formulario e privacy:** il form e `/{lang}/privacy` esistono in tutte le lingue. Il testo legale della privacy va prima validato con chi lo redige `[TODO]`.
- **Ordine di lavoro:** costruisci e finisci prima la versione italiana, poi genera le altre lingue dai dati, poi verifica la parità di struttura.
