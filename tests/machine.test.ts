import { describe, expect, it } from 'vitest';
import { DOT_WIDTH, KINT_ASCII, dotLabel } from '../src/lib/machine';

describe('dotLabel', () => {
  it('riempie di puntini fino alla larghezza fissa', () => {
    const l = dotLabel('Nome');
    expect(l).toBe('NOME .........');
    expect(l).toHaveLength(DOT_WIDTH);
  });
  it('lascia uno spazio dopo le etichette troppo lunghe', () => {
    expect(dotLabel('Fondazione e storia')).toBe('FONDAZIONE E STORIA ');
  });
  it('rispetta le lettere accentate', () => {
    expect(dotLabel('Città', 10)).toBe('CITTÀ ....');
  });
});

describe('KINT_ASCII', () => {
  it('ha righe tutte della stessa larghezza', () => {
    const widths = KINT_ASCII.map(({ k, int, dot }) => [...k, ...int, ...dot].length);
    expect(new Set(widths).size).toBe(1);
  });
});
