import type { Lang } from './i18n';

export interface Link { label: string; href: string }
export interface Card { title: string; text: string }

export interface Sector {
  id: string;
  name: string;
  for_whom: string;
  problem: string;
  what_we_do: string;
  key_services: string[];
  linked_services: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  crack: string;
  gold: string;
}

export interface Content {
  lang: Lang;
  meta: {
    title: string;
    description: string;
    og_locale: string;
    og_locale_alternate?: string;
    portfolio_title: string;
    portfolio_description: string;
  };
  ui: {
    skip_to_content: string;
    nav_label: string;
    lang_label: string;
    scroll_hint: string;
    for_whom: string;
    typical_problem: string;
    what_we_do: string;
    key_services: string;
    linked_services: string;
    crack: string;
    gold: string;
    featured: string;
    discover: string;
  };
  nav: { sectors: string; services: string; contact: string; contact_cta: string; portfolio: string };
  opening: { logo_label: string };
  presentation: {
    h1: string;
    subtitle: string;
    paragraph: string;
    cta_primary: Link;
    cta_secondary?: Link;
    kintsugi: Card;
    values: Card[];
  };
  sectors: {
    landings: { id: string; name: string; line: string }[];
    title: string;
    intro: string;
    closing: { text: string };
    items: Sector[];
  };
  services: {
    title: string;
    intro: string;
    featured: { id: string; title: string; text: string };
    items: Service[];
    always_included: { title: string; items: string[] };
    packages: { title: string; items: Array<{ name: string; text: string }>; note: string };
  };
  contact: {
    title: string;
    intro: string;
    call: { title: string; text: string; cta_label: string };
    details: { email: string; address: string; phone?: string; hours?: string; labels: { email: string; address: string; phone: string; hours: string } };
    form: {
      name: string; email: string; phone: string; company: string; sector: string; sector_other: string;
      message: string; privacy_label: string; submit: string; sent: string; error: string;
    };
    faq: { title: string; items: Array<{ q: string; a: string }> };
  };
  footer: { nav_label: string; to_top: string; countries: string; copyright: string; privacy: string; hosting: string };
  privacy: { title: string; intro: string; body: string[] };
  portfolio: { title: string; intro: string };
}

export interface SiteData {
  name: string;
  url: string;
  email: string;
  founding_year: number;
  city: string;
  region: string;
  country_code: string;
  areas_served: string[];
  call_url?: string;
  same_as: string[];
  landings: Landing[];
}

export interface Landing {
  id: string;
  url: string;
  logo: string;
  logo_alt: string;
  logo_width: number;
  logo_height: number;
  accent: string; // colore del bordo in hover
}

export interface Project {
  slug: string;
  name: string;
  client_sector: string;
  services: string[];
  year: number;
  url?: string;
  summary: string;
  results: string[];
  images: Array<{ file: string; alt: string }>;
  publication_allowed: boolean;
}
