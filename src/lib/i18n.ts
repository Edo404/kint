export const SITE = 'https://kint.ch';
export const LANGS = ['it', 'en', 'fr', 'de'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'it';

export function isLang(x: string): x is Lang {
  return (LANGS as readonly string[]).includes(x);
}

export function pathFor(lang: Lang, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${lang}/${clean}` : `/${lang}/`;
}

export function absoluteUrl(path: string): string {
  return `${SITE}${path}`;
}

export interface Alternate {
  lang: Lang | 'x-default';
  href: string;
}

export function alternatesFor(available: Lang[], path = ''): Alternate[] {
  const out: Alternate[] = LANGS.filter((l) => available.includes(l)).map((lang) => ({
    lang,
    href: absoluteUrl(pathFor(lang, path)),
  }));
  if (available.includes(DEFAULT_LANG)) {
    out.push({ lang: 'x-default', href: absoluteUrl(pathFor(DEFAULT_LANG, path)) });
  }
  return out;
}
