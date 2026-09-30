import type { Content, SiteData } from './content.types';
import { SITE, absoluteUrl, pathFor, type Lang } from './i18n';

export const ORG_ID = `${SITE}/#organization`;
const CONTEXT = 'https://schema.org';
const COUNTRY_NAMES: Record<string, string> = { IT: 'Italy', CH: 'Switzerland' };

interface Input {
  content: Content;
  site: SiteData;
  lang: Lang;
}

export function buildJsonLd({ content, site, lang }: Input): object[] {
  const home = absoluteUrl(pathFor(lang));
  const areaServed = site.areas_served.map((code) => ({
    '@type': 'Country',
    name: COUNTRY_NAMES[code] ?? code,
  }));

  const offers = content.services.items.map((s) => {
    const audience = content.sectors.items
      .filter((sector) => sector.linked_services.includes(s.id))
      .map((sector) => ({ '@type': 'Audience', audienceType: sector.name }));
    return {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        '@id': `${home}#servizi-${s.id}`,
        name: s.title,
        description: s.description,
        provider: { '@id': ORG_ID },
        areaServed,
        audience,
      },
    };
  });

  const organization: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORG_ID,
    name: site.name,
    url: site.url,
    email: site.email,
    foundingDate: String(site.founding_year),
    description: content.meta.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: site.country_code,
    },
    areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: content.services.title,
      itemListElement: offers,
    },
  };
  if (site.same_as.length) organization.sameAs = site.same_as;

  const website = {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': `${home}#website`,
    name: site.name,
    url: home,
    inLanguage: lang,
    publisher: { '@id': ORG_ID },
  };

  const faq = {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    inLanguage: lang,
    url: home,
    mainEntity: content.contact.faq.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return [organization, website, faq];
}
