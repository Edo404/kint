import { describe, expect, it } from 'vitest';
import { jaggedCrack, polyArea, shatter } from '../src/lib/shatter';

describe('shatter', () => {
  const s = shatter(480, 200, 9, 4);
  it('produce il numero di cocci richiesto, uno in meno di crepe', () => {
    expect(s.cells).toHaveLength(9);
    expect(s.cracks).toHaveLength(8);
  });
  it('i cocci coprono tutto il rettangolo senza buchi', () => {
    const total = s.cells.reduce((t, c) => t + polyArea(c), 0);
    expect(total).toBeCloseTo(480 * 200, 0);
  });
  it('è deterministico', () => expect(shatter(480, 200, 9, 4)).toEqual(s));
});

describe('jaggedCrack', () => {
  it('parte e finisce agli estremi della crepa', () => {
    const c = jaggedCrack([[0, 0], [100, 0]], 1, 4, 3);
    expect(c[0]).toEqual([0, 0]);
    expect(c[c.length - 1]).toEqual([100, 0]);
    expect(c).toHaveLength(5);
    for (const [, y] of c) expect(Math.abs(y)).toBeLessThanOrEqual(3);
  });
});
