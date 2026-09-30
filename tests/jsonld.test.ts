import { describe, expect, it } from 'vitest';
import { buildJsonLd } from '../src/lib/jsonld';

const content: any = {
  lang: 'it',
  meta: { description: 'Descrizione' },
  sectors: {
    items: [
      { id: 's1', name: 'Ristorazione', linked_services: ['siti'] },
      { id: 's2', name: 'Studi', linked_services: ['siti', 'social'] },
    ],
  },
  services: {
    title: 'Cosa facciamo',
    items: [
      { id: 'siti', title: 'Siti', description: 'Descr siti' },
      { id: 'social', title: 'Social', description: 'Descr social' },
    ],
  },
  contact: {
    faq: { title: 'FAQ', items: [{ q: 'Domanda?', a: 'Risposta.' }, { q: 'Altra?', a: 'Sì.' }] },
  },
};
const site: any = {
  name: 'Kint', url: 'https://kint.ch', email: 'info@kint.ch', founding_year: 2020,
  city: 'Lugano', region: 'Ticino', country_code: 'CH', areas_served: ['IT', 'CH'], same_as: [],
};

const [org, web, faq] = buildJsonLd({ content, site, lang: 'it' }) as any[];

describe('buildJsonLd', () => {
  it('restituisce Organization, WebSite e FAQPage', () => {
    expect(org['@type']).toEqual(['Organization', 'ProfessionalService']);
    expect(web['@type']).toBe('WebSite');
    expect(faq['@type']).toBe('FAQPage');
  });

  it("usa un @id stabile per l'organizzazione", () => {
    expect(org['@id']).toBe('https://kint.ch/#organization');
    expect(web.publisher['@id']).toBe('https://kint.ch/#organization');
  });

  it('descrive sede, anno e aree servite', () => {
    expect(org.address).toMatchObject({ addressLocality: 'Lugano', addressRegion: 'Ticino', addressCountry: 'CH' });
    expect(org.foundingDate).toBe('2020');
    expect(org.areaServed.map((a: any) => a.name)).toEqual(['Italy', 'Switzerland']);
  });

  it('elenca un Service per ogni servizio, senza prezzi', () => {
    const offers = org.hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(2);
    expect(offers[0].itemOffered['@type']).toBe('Service');
    expect(JSON.stringify(org)).not.toMatch(/price/i);
  });

  it('collega ogni servizio ai settori che lo usano', () => {
    const siti = org.hasOfferCatalog.itemListElement[0].itemOffered;
    expect(siti.audience.map((a: any) => a.audienceType)).toEqual(['Ristorazione', 'Studi']);
    const social = org.hasOfferCatalog.itemListElement[1].itemOffered;
    expect(social.audience.map((a: any) => a.audienceType)).toEqual(['Studi']);
  });

  it('non emette sameAs né telefono se mancano i dati', () => {
    expect('sameAs' in org).toBe(false);
    expect('telephone' in org).toBe(false);
  });

  it('emette sameAs quando ci sono profili', () => {
    const [withSocial] = buildJsonLd({ content, site: { ...site, same_as: ['https://www.linkedin.com/company/kint'] }, lang: 'it' }) as any[];
    expect(withSocial.sameAs).toEqual(['https://www.linkedin.com/company/kint']);
  });

  it('traduce le FAQ e imposta la lingua', () => {
    expect(faq.inLanguage).toBe('it');
    expect(faq.mainEntity).toHaveLength(2);
    expect(faq.mainEntity[0]).toMatchObject({ '@type': 'Question', name: 'Domanda?', acceptedAnswer: { '@type': 'Answer', text: 'Risposta.' } });
  });

  it("l'id del WebSite è per lingua", () => {
    expect(web['@id']).toBe('https://kint.ch/it/#website');
    expect(web.inLanguage).toBe('it');
  });
});

import { buildPortfolioJsonLd } from '../src/lib/jsonld';

describe('buildPortfolioJsonLd', () => {
  const projects: any[] = [
    { slug: 'alfa', name: 'Alfa', client_sector: 's1', services: ['siti'], year: 2026, url: 'https://alfa.example', summary: 'Sintesi', results: [], images: [], publication_allowed: true },
  ];
  const blocks = buildPortfolioJsonLd({ content: { ...content, portfolio: { title: 'Progetti', intro: 'Intro' }, meta: { ...content.meta, portfolio_description: 'Desc' } }, lang: 'it', projects }) as any[];

  it('emette CollectionPage con ItemList e BreadcrumbList', () => {
    expect(blocks[0]['@type']).toBe('CollectionPage');
    expect(blocks[0].mainEntity['@type']).toBe('ItemList');
    expect(blocks[0].mainEntity.itemListElement[0].item['@type']).toBe('CreativeWork');
    expect(blocks[1]['@type']).toBe('BreadcrumbList');
    expect(blocks[1].itemListElement).toHaveLength(2);
  });
});
