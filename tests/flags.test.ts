import { describe, expect, it } from 'vitest';
import { noindex, portfolioPublished } from '../src/lib/flags';

describe('flags', () => {
  it('il portfolio è spento di default', () => {
    expect(portfolioPublished({})).toBe(false);
    expect(portfolioPublished({ PORTFOLIO_PUBLISHED: 'false' })).toBe(false);
    expect(portfolioPublished({ PORTFOLIO_PUBLISHED: 'true' })).toBe(true);
  });
  it('noindex è spento di default', () => {
    expect(noindex({})).toBe(false);
    expect(noindex({ NOINDEX: 'true' })).toBe(true);
  });
});
