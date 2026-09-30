import { describe, expect, it } from 'vitest';
import { AI_BOTS, buildLlmsFull, buildLlmsTxt, buildMarkdown, buildRobots, buildSitemap } from '../src/lib/seoFiles';

const content: any = {
  lang: 'it',
  meta: { description: 'Descrizione' },
  nav: { portfolio: 'Portfolio' },
  ui: { for_whom: 'Per chi', typical_problem: 'Problema tipico', what_we_do: 'Cosa facciamo', key_services: 'Servizi chiave', crack: 'Crepa', gold: 'Oro' },
  presentation: {
    h1: 'Il partner digitale', subtitle: 'Sottotitolo', paragraph: 'Paragrafo',
    kintsugi: { title: 'Perché Kint', text: 'Testo kintsugi' },
    values: [{ title: 'Trasparenza', text: 'Chiari' }],
  },
  sectors: {
    title: 'Settori', intro: 'Intro', closing: { text: 'Non ti riconosci?' },
    items: [{ id: 's1', name: 'Ristorazione', for_whom: 'Ristoranti', problem: 'Problema', what_we_do: 'Sito', key_services: ['Menu'], linked_services: ['siti'] }],
  },
  services: {
    title: 'Servizi', intro: 'Intro servizi',
    featured: { id: 'f', title: 'Persone e AI', text: 'Testo evidenza' },
    items: [{ id: 'siti', title: 'Siti ed e-commerce', description: 'Descr', crack: 'Lento', gold: 'Veloce' }],
    always_included: { title: 'Sempre inclusi', items: ['Hosting in Svizzera'] },
    packages: { title: 'Tre modi', items: [{ name: 'Riparazione', text: 'Singolo' }], note: 'Nota' },
  },
  contact: {
    title: 'Contatti', intro: 'Intro contatti',
    call: { title: 'Prima call', text: 'Testo call', cta_label: 'Prenota' },
    details: { email: 'info@kint.ch', address: 'Lugano', labels: { email: 'Email', address: 'Sede', phone: 'Tel', hours: 'Orari' } },
    faq: { title: 'FAQ', items: [{ q: 'Quanto costa?', a: 'Dipende.' }] },
  },
};
const site: any = { name: 'Kint', url: 'https://kint.ch', email: 'info@kint.ch', city: 'Lugano', region: 'Ticino', country_code: 'CH' };

describe('buildRobots', () => {
  it('consente i crawler AI e indica la sitemap', () => {
    const r = buildRobots({ noindex: false });
    for (const bot of AI_BOTS) expect(r).toContain(`User-agent: ${bot}`);
    expect(r).toContain('Sitemap: https://kint.ch/sitemap.xml');
    expect(r).not.toMatch(/Disallow: \/\s*$/m);
  });
  it('su staging blocca tutto', () => {
    const r = buildRobots({ noindex: true });
    expect(r).toContain('User-agent: *');
    expect(r).toContain('Disallow: /');
    expect(r).not.toContain('Sitemap:');
  });
  it('include i nomi ufficiali principali', () => {
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot']) {
      expect(AI_BOTS).toContain(bot);
    }
  });
});

describe('buildSitemap', () => {
  const xml = buildSitemap([
    {
      path: '/it/',
      lastmod: '2026-09-30',
      alternates: [
        { lang: 'it', href: 'https://kint.ch/it/' },
        { lang: 'en', href: 'https://kint.ch/en/' },
        { lang: 'x-default', href: 'https://kint.ch/it/' },
      ],
    },
  ]);
  it('contiene loc, lastmod e alternate', () => {
    expect(xml).toContain('<loc>https://kint.ch/it/</loc>');
    expect(xml).toContain('<lastmod>2026-09-30</lastmod>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://kint.ch/en/"/>');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });
});

describe('buildMarkdown', () => {
  const md = buildMarkdown(content, site);
  it('contiene h1, settori, servizi e FAQ', () => {
    expect(md).toContain('# Il partner digitale');
    expect(md).toContain('Ristorazione');
    expect(md).toContain('Siti ed e-commerce');
    expect(md).toContain('Quanto costa?');
    expect(md).toContain('info@kint.ch');
  });
  it('ogni scheda è autosufficiente: cita il nome Kint', () => {
    expect(md).toContain('Kint');
  });
});

describe('buildLlmsTxt', () => {
  const base = { content: { it: content }, available: ['it'] as any, site };
  it('è in inglese e linka la versione markdown di ogni lingua', () => {
    const t = buildLlmsTxt({ ...base, portfolio: false });
    expect(t.startsWith('# Kint')).toBe(true);
    expect(t).toContain('https://kint.ch/it/index.md');
  });
  it('senza portfolio non lo nomina', () => {
    expect(buildLlmsTxt({ ...base, portfolio: false }).toLowerCase()).not.toContain('portfolio');
  });
  it('con portfolio lo elenca', () => {
    expect(buildLlmsTxt({ ...base, portfolio: true })).toContain('https://kint.ch/it/portfolio');
  });
});

describe('buildLlmsFull', () => {
  it('concatena i contenuti di tutte le lingue disponibili', () => {
    const t = buildLlmsFull({ content: { it: content }, available: ['it'] as any, site });
    expect(t).toContain('# Il partner digitale');
    expect(t).toContain('Quanto costa?');
  });
});
