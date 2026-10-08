import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const noindex = process.env.NOINDEX === 'true';
const portfolioOn = process.env.PORTFOLIO_PUBLISHED === 'true';
const ALL = ['it', 'en', 'fr', 'de'];
const site = parse(readFileSync('src/content/site.yaml', 'utf8'));
const langs = ALL.filter((l) => existsSync(`src/content/${l}.yaml`));
const errors = [];
const fail = (m) => errors.push(m);

const decode = (s) =>
  s.replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// I tag in linea (parola in oro dentro un titolo) non spezzano il testo; gli altri valgono come spazio.
const textOf = (html) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<\/?(?:span|a|em|strong)(?=[\s>])[^>]*>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const read = (p) => readFileSync(p, 'utf8');

function* walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

for (const lang of langs) {
  const c = parse(read(`src/content/${lang}.yaml`));
  const file = `dist/${lang}/index.html`;
  if (!existsSync(file)) { fail(`manca ${file}`); continue; }
  const html = read(file);
  const text = textOf(html);
  const tag = (s) => `${lang}: ${s}`;

  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(tag('deve esserci un solo <h1>'));
  if (!html.includes(`<html lang="${lang}"`)) fail(tag('attributo lang errato su <html>'));
  if (html.includes('[TODO')) fail(tag('[TODO] visibile nell\'HTML'));
  if (!html.includes(`<link rel="canonical" href="https://kint.ch/${lang}/">`)) fail(tag('canonical mancante o errato'));
  if (noindex !== /<meta name="robots" content="noindex/.test(html)) fail(tag(noindex ? 'noindex atteso' : 'noindex presente in produzione'));

  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (!desc || decode(desc).length > 160) fail(tag(`meta description assente o oltre 160 caratteri (${decode(desc).length})`));

  for (const l of [...langs, 'x-default']) {
    if (!html.includes(`hreflang="${l}"`)) fail(tag(`hreflang mancante: ${l}`));
  }

  const must = [
    c.presentation.h1, c.presentation.subtitle, c.contact.details.email,
    ...c.sectors.landings.map((l) => l.name),
    ...c.services.items.map((s) => s.title),
    ...c.contact.faq.items.map((f) => f.q),
  ];
  for (const m of must) if (!text.includes(m)) fail(tag(`testo assente dall'HTML: "${m}"`));
  for (const l of c.sectors.landings) {
    if (!html.includes(`id="settori-${l.id}"`)) fail(tag(`ancora mancante: settori-${l.id}`));
    const url = site.landings?.find((x) => x.id === l.id)?.url;
    if (!url || !html.includes(`href="${url}"`)) fail(tag(`link alla sotto-landing mancante: ${l.id}`));
  }
  for (const s of c.services.items) if (!html.includes(`id="servizi-${s.id}"`)) fail(tag(`ancora mancante: servizi-${s.id}`));
  for (const id of ['kint', 'settori', 'servizi', 'contatti']) if (!html.includes(`id="${id}"`)) fail(tag(`ancora mancante: ${id}`));

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try { return JSON.parse(m[1]); } catch { fail(tag('JSON-LD non valido')); return null; }
  }).filter(Boolean);
  const types = blocks.flatMap((b) => [b['@type']].flat());
  for (const t of ['Organization', 'WebSite', 'FAQPage']) if (!types.includes(t)) fail(tag(`JSON-LD senza ${t}`));
  const faq = blocks.find((b) => b['@type'] === 'FAQPage');
  if (faq && faq.mainEntity.length !== c.contact.faq.items.length) fail(tag('FAQ nel JSON-LD diverse da quelle della pagina'));
  const org = blocks.find((b) => b['@id'] === 'https://kint.ch/#organization');
  if (org && org.hasOfferCatalog.itemListElement.length !== c.services.items.length) fail(tag('servizi nel JSON-LD diversi da quelli della pagina'));

  if (!existsSync(`dist/${lang}/privacy/index.html`)) fail(tag('manca la pagina privacy'));
  if (!existsSync(`dist/${lang}/index.md`)) fail(tag('manca la versione markdown'));

  const hasPortfolio = existsSync(`dist/${lang}/portfolio/index.html`);
  if (hasPortfolio !== portfolioOn) fail(tag(portfolioOn ? 'portfolio atteso ma assente' : 'portfolio presente con il flag spento'));
  if (!portfolioOn && /href="\/[a-z]{2}\/portfolio/.test(html)) fail(tag('link al portfolio con il flag spento'));
}

// File globali
const sitemap = existsSync('dist/sitemap.xml') ? read('dist/sitemap.xml') : '';
const llms = existsSync('dist/llms.txt') ? read('dist/llms.txt') : '';
const robots = existsSync('dist/robots.txt') ? read('dist/robots.txt') : '';
if (!sitemap) fail('manca sitemap.xml');
if (!llms) fail('manca llms.txt');
if (!robots) fail('manca robots.txt');
const pagesPerLang = 2 + (portfolioOn ? 1 : 0);
if ((sitemap.match(/<url>/g) ?? []).length !== langs.length * pagesPerLang) fail('numero di <url> nella sitemap inatteso');
if (!portfolioOn) {
  if (/portfolio/i.test(sitemap)) fail('portfolio nella sitemap');
  if (/portfolio/i.test(llms)) fail('portfolio in llms.txt');
}
if (noindex ? !robots.includes('Disallow: /') : robots.includes('Disallow: /\n') && !robots.includes('Allow: /')) fail('robots.txt incoerente con NOINDEX');

// Link interni senza 404
for (const file of walk('dist')) {
  if (!file.endsWith('.html')) continue;
  const html = read(file);
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const p = m[1];
    if (p.startsWith('//') || p === '/api/contact') continue;
    if (!(existsSync(`dist${p}`) && statSync(`dist${p}`).isFile()) && !existsSync(`dist${p.replace(/\/$/, '')}/index.html`)) {
      fail(`link interno rotto in ${file.replace(/\\/g, '/')}: ${p}`);
    }
  }
}

if (errors.length) {
  for (const e of [...new Set(errors)]) console.error('FAIL', e);
  process.exit(1);
}
console.log(`HTML ok: ${langs.join(', ')} · portfolio ${portfolioOn ? 'pubblicato' : 'non pubblicato'} · ${noindex ? 'noindex' : 'indicizzabile'}`);
