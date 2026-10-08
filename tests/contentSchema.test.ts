import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/lib/contentSchema';

function make(lang: string, over: (c: any) => void = () => {}) {
  const c: any = {
    lang,
    meta: { title: 't', description: 'd', og_locale: 'it_IT', portfolio_title: 'p', portfolio_description: 'pd' },
    ui: {
      skip_to_content: 'a', nav_label: 'a', lang_label: 'a', scroll_hint: 'a', for_whom: 'a',
      typical_problem: 'a', what_we_do: 'a', key_services: 'a', linked_services: 'a', crack: 'a', gold: 'a', featured: 'a', discover: 'a',
    },
    nav: { sectors: 'a', services: 'a', contact: 'a', contact_cta: 'a', portfolio: 'a' },
    opening: { logo_label: 'a' },
    presentation: {
      h1: 'a', subtitle: 'a', paragraph: 'a',
      cta_primary: { label: 'a', href: '#contatti' },
      kintsugi: { title: 'a', text: 'a' },
      values: [{ title: 'a', text: 'a' }],
    },
    sectors: {
      title: 'a', intro: 'a', closing: { text: 'a' },
      landings: [{ id: 'l1', name: 'a', line: 'a' }],
      items: [{ id: 's1', name: 'a', for_whom: 'a', problem: 'a', what_we_do: 'a', key_services: ['x', 'y', 'z'], linked_services: ['v1'] }],
    },
    services: {
      title: 'a', intro: 'a',
      featured: { id: 'f', title: 'a', text: 'a' },
      items: [{ id: 'v1', title: 'a', description: 'a', crack: 'a', gold: 'a' }],
      always_included: { title: 'a', items: ['a'] },
      packages: { title: 'a', items: [{ name: 'a', text: 'a' }], note: 'a' },
    },
    contact: {
      title: 'a', intro: 'a',
      call: { title: 'a', text: 'a', cta_label: 'a' },
      details: { email: 'info@kint.ch', address: 'a', labels: { email: 'a', address: 'a', phone: 'a', hours: 'a' } },
      form: { name: 'a', email: 'a', phone: 'a', company: 'a', sector: 'a', sector_other: 'a', message: 'a', privacy_label: 'a', submit: 'a', sent: 'a', error: 'a' },
      faq: { title: 'a', items: [{ q: 'a', a: 'a' }] },
    },
    footer: { nav_label: 'a', to_top: 'a', countries: 'a', copyright: 'a', privacy: 'a', hosting: 'a' },
    privacy: { title: 'a', intro: 'a', body: ['a'] },
    portfolio: { title: 'a', intro: 'a' },
  };
  over(c);
  return c;
}

describe('validateContent', () => {
  it('accetta un contenuto valido', () => {
    expect(validateContent({ it: make('it') })).toEqual([]);
  });

  it('richiede l\'italiano', () => {
    expect(validateContent({ en: make('en') })).toContain('manca il contenuto della lingua sorgente: it');
  });

  it('segnala un campo obbligatorio vuoto', () => {
    const errors = validateContent({ it: make('it', (c) => (c.presentation.h1 = '')) });
    expect(errors).toContain('it: campo mancante o vuoto: presentation.h1');
  });

  it('segnala un servizio collegato inesistente', () => {
    const errors = validateContent({ it: make('it', (c) => (c.sectors.items[0].linked_services = ['nope'])) });
    expect(errors).toContain('it: il settore s1 cita un servizio inesistente: nope');
  });

  it('segnala id duplicati', () => {
    const errors = validateContent({
      it: make('it', (c) => c.services.items.push({ ...c.services.items[0] })),
    });
    expect(errors).toContain('it: id servizio duplicato: v1');
  });

  it('vieta i [TODO] nei contenuti', () => {
    const errors = validateContent({ it: make('it', (c) => (c.contact.intro = 'Chiama [TODO: numero]')) });
    expect(errors.some((e) => e.includes('[TODO') && e.includes('contact.intro'))).toBe(true);
  });

  it('richiede la parità di struttura e di id tra le lingue', () => {
    const errors = validateContent({
      it: make('it'),
      en: make('en', (c) => {
        c.sectors.items[0].id = 'other';
        c.sectors.items[0].linked_services = ['v1'];
      }),
    });
    expect(errors).toContain('en: gli id dei settori non coincidono con quelli di it');
  });

  it('segnala una chiave in più o in meno rispetto all\'italiano', () => {
    const errors = validateContent({
      it: make('it'),
      fr: make('fr', (c) => delete c.presentation.kintsugi),
    });
    expect(errors.some((e) => e.startsWith('fr: struttura diversa da it'))).toBe(true);
  });

  it('segnala una lingua con un numero diverso di FAQ', () => {
    const errors = validateContent({
      it: make('it'),
      de: make('de', (c) => c.contact.faq.items.push({ q: 'b', a: 'b' })),
    });
    expect(errors.some((e) => e.startsWith('de: struttura diversa da it'))).toBe(true);
  });

  it('le chiavi facoltative possono mancare in una lingua', () => {
    const errors = validateContent({
      it: make('it', (c) => (c.meta.og_locale_alternate = 'it_CH')),
      en: make('en'),
    });
    expect(errors).toEqual([]);
  });
});
