import { describe, expect, it } from 'vitest';
import { TOOLBAR_SLACK, needsResize } from '../src/gl/viewport';

describe('needsResize', () => {
  it('alla prima misura ridimensiona sempre', () => {
    expect(needsResize(null, { w: 390, h: 844 })).toBe(true);
  });
  it('ignora la barra di Safari che entra o esce (solo altezza, poca differenza)', () => {
    expect(needsResize({ w: 390, h: 664 }, { w: 390, h: 750 })).toBe(false);
    expect(needsResize({ w: 390, h: 750 }, { w: 390, h: 664 })).toBe(false);
  });
  it('ridimensiona se cambia la larghezza (rotazione, finestra desktop)', () => {
    expect(needsResize({ w: 390, h: 844 }, { w: 844, h: 390 })).toBe(true);
    expect(needsResize({ w: 1200, h: 800 }, { w: 1180, h: 800 })).toBe(true);
  });
  it("ridimensiona se l'altezza cambia molto", () => {
    expect(needsResize({ w: 1200, h: 800 }, { w: 1200, h: 800 + TOOLBAR_SLACK + 1 })).toBe(true);
  });
  it('non fa nulla se la misura non cambia', () => {
    expect(needsResize({ w: 390, h: 844 }, { w: 390, h: 844 })).toBe(false);
  });
});
