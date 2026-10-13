import { describe, expect, it } from 'vitest';
import { handleOf, socialFor } from '../src/lib/icons';

describe('handleOf', () => {
  it('mostra un profilo senza protocollo, www e barra finale, per qualsiasi dominio', () => {
    expect(handleOf('https://www.linkedin.com/company/kint-ch/')).toBe('linkedin.com/company/kint-ch');
    expect(handleOf('https://www.youtube.com/@kint')).toBe('youtube.com/@kint');
  });
});

describe('socialFor', () => {
  it('dà il nome per i domini noti', () => {
    expect(socialFor('https://www.linkedin.com/company/kint-ch/')).toMatchObject({ name: 'LinkedIn' });
    expect(socialFor('https://www.instagram.com/kint.ch/')).toMatchObject({ name: 'Instagram' });
  });
  it('restituisce null per domini non noti', () => {
    expect(socialFor('https://example.com/kint')).toBeNull();
  });
});
