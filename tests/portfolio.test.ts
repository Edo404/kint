import { describe, expect, it } from 'vitest';
import { portfolioPaths, publishable } from '../src/lib/portfolio';

const project = (over = {}) => ({
  slug: 'a', name: 'A', client_sector: 's1', services: ['siti'], year: 2026,
  summary: 'x', results: [], images: [], publication_allowed: true, ...over,
});

describe('portfolioPaths', () => {
  it('con il flag spento non genera nessuna rotta', () => {
    expect(portfolioPaths(false, ['it', 'en'], [project()])).toEqual([]);
    expect(portfolioPaths(false, ['it'], [])).toEqual([]);
  });
  it('con il flag acceso genera una rotta per lingua', () => {
    expect(portfolioPaths(true, ['it', 'en'], [project()])).toEqual([{ params: { lang: 'it' } }, { params: { lang: 'en' } }]);
  });
  it('acceso senza progetti pubblicabili è un errore', () => {
    expect(() => portfolioPaths(true, ['it'], [])).toThrow(/almeno un progetto/);
    expect(() => portfolioPaths(true, ['it'], [project({ publication_allowed: false })])).toThrow(/almeno un progetto/);
  });
});

describe('publishable', () => {
  it('esclude i progetti senza consenso', () => {
    expect(publishable([project(), project({ slug: 'b', publication_allowed: false })])).toHaveLength(1);
  });
});
