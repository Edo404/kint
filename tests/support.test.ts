import { describe, expect, it } from 'vitest';
import { hasWebGL, setMode } from '../src/gl/support';

const docWith = (ctx: (type: string) => unknown) => ({
  createElement: () => ({ getContext: ctx }),
});

describe('hasWebGL', () => {
  it('è true se webgl2 è disponibile', () => {
    expect(hasWebGL(docWith((t) => (t === 'webgl2' ? {} : null)))).toBe(true);
  });
  it('è false se è disponibile solo WebGL 1 (Three.js richiede WebGL 2)', () => {
    expect(hasWebGL(docWith((t) => (t === 'webgl' ? {} : null)))).toBe(false);
  });
  it('è false se nessun contesto è disponibile', () => {
    expect(hasWebGL(docWith(() => null))).toBe(false);
  });
  it('è false se getContext lancia', () => {
    expect(
      hasWebGL(
        docWith(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBe(false);
  });
});

describe('setMode', () => {
  it('scrive la modalità in dataset.mode', () => {
    const el = { dataset: {} as Record<string, string | undefined> };
    setMode(el, 'fallback');
    expect(el.dataset.mode).toBe('fallback');
  });
});
