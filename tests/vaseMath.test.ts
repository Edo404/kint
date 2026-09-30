import { describe, expect, it } from 'vitest';
import {
  anchorFor,
  clamp01,
  opacityAt,
  scrollProgress,
  seamProgress,
  shardEase,
  smoothstep,
} from '../src/gl/vase/math';

describe('clamp01 / smoothstep', () => {
  it('clamp01', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(3)).toBe(1);
  });
  it('smoothstep agli estremi e al centro', () => {
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
  });
  it('smoothstep con intervallo degenere è un gradino', () => {
    expect(smoothstep(0.5, 0.5, 0.4)).toBe(0);
    expect(smoothstep(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe('scrollProgress', () => {
  it('0 in cima, 1 in fondo', () => {
    expect(scrollProgress(0, 3000, 1000)).toBe(0);
    expect(scrollProgress(2000, 3000, 1000)).toBe(1);
  });
  it('è lineare in mezzo', () => {
    expect(scrollProgress(1000, 3000, 1000)).toBeCloseTo(0.5);
  });
  it('limita i valori fuori intervallo (rimbalzo iOS)', () => {
    expect(scrollProgress(-50, 3000, 1000)).toBe(0);
    expect(scrollProgress(2500, 3000, 1000)).toBe(1);
  });
  it('è 0 se il documento non è più alto della finestra', () => {
    expect(scrollProgress(0, 800, 1000)).toBe(0);
  });
});

describe('shardEase', () => {
  it("0 prima dell'inizio, 1 dopo la fine", () => {
    expect(shardEase(0.1, 0.2, 0.7)).toBe(0);
    expect(shardEase(0.9, 0.2, 0.7)).toBe(1);
  });
  it('è monotona', () => {
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const e = shardEase(p, 0.1, 0.8);
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
  });
});

describe('seamProgress', () => {
  it('0 prima, 1 dopo, lineare in mezzo', () => {
    expect(seamProgress(0.3, 0.4, 0.6)).toBe(0);
    expect(seamProgress(0.7, 0.4, 0.6)).toBe(1);
    expect(seamProgress(0.5, 0.4, 0.6)).toBeCloseTo(0.5);
  });
});

describe('opacityAt', () => {
  it('0.2 in apertura', () => {
    expect(opacityAt(0)).toBeCloseTo(0.2);
  });
  it('1 da 0.85 in poi', () => {
    expect(opacityAt(0.85)).toBeCloseTo(1);
    expect(opacityAt(1)).toBeCloseTo(1);
  });
  it('sale in modo monotono', () => {
    expect(opacityAt(0.4)).toBeGreaterThan(opacityAt(0.2));
    expect(opacityAt(0.7)).toBeGreaterThan(opacityAt(0.4));
  });
});

describe('anchorFor', () => {
  it('il vaso è sempre al centro, su desktop e su mobile', () => {
    for (const p of [0, 0.3, 0.7, 1]) {
      expect(anchorFor(1440, 900, p).x).toBe(0);
      expect(anchorFor(390, 844, p).x).toBe(0);
    }
  });
  it('dietro i contenuti è attenuato al 60% e in chiusura torna pieno', () => {
    expect(anchorFor(1440, 900, 0.3).opacityMul).toBeCloseTo(0.6);
    expect(anchorFor(1440, 900, 1).opacityMul).toBeCloseTo(1);
    expect(anchorFor(390, 844, 0.5).opacityMul).toBeCloseTo(0.6);
    expect(anchorFor(390, 844, 1).opacityMul).toBeCloseTo(1);
  });
  it("su schermi stretti il vaso è un po' più piccolo", () => {
    expect(anchorFor(1440, 900, 0.5).scale).toBe(1);
    expect(anchorFor(390, 844, 0.5).scale).toBeCloseTo(0.85);
  });
  it('in chiusura il vaso si alza per lasciare spazio al logo', () => {
    expect(anchorFor(1440, 900, 0.3).y).toBe(0);
    expect(anchorFor(1440, 900, 1).y).toBeCloseTo(0.3);
    expect(anchorFor(390, 844, 1).y).toBeCloseTo(0.3);
  });
});
