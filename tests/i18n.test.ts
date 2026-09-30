import { describe, expect, it } from 'vitest';
import { LANGS, absoluteUrl, alternatesFor, isLang, pathFor } from '../src/lib/i18n';

describe('i18n', () => {
  it('conosce le 4 lingue', () => {
    expect([...LANGS]).toEqual(['it', 'en', 'fr', 'de']);
    expect(isLang('fr')).toBe(true);
    expect(isLang('es')).toBe(false);
  });

  it('costruisce i percorsi', () => {
    expect(pathFor('it')).toBe('/it/');
    expect(pathFor('en', 'portfolio')).toBe('/en/portfolio');
    expect(pathFor('de', '/privacy/')).toBe('/de/privacy');
  });

  it('costruisce URL assoluti', () => {
    expect(absoluteUrl('/it/')).toBe('https://kint.ch/it/');
  });

  it('elenca gli alternate solo per le lingue disponibili, con x-default', () => {
    expect(alternatesFor(['it', 'en'], '')).toEqual([
      { lang: 'it', href: 'https://kint.ch/it/' },
      { lang: 'en', href: 'https://kint.ch/en/' },
      { lang: 'x-default', href: 'https://kint.ch/it/' },
    ]);
  });

  it('senza la lingua di default non emette x-default', () => {
    expect(alternatesFor(['en'], 'privacy').some((a) => a.lang === 'x-default')).toBe(false);
  });
});
