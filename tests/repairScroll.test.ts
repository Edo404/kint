import { describe, expect, it } from 'vitest';
import { cardProgress, pinLayout, pinProgress, LINE_END } from '../src/scripts/repair-scroll';

describe('repair-scroll', () => {
  it('pinLayout: centra il blocco se sta nello schermo sotto la barra', () => {
    expect(pinLayout({ width: 1440, vh: 1000, pinH: 800, gridH: 560 })).toEqual({ top: 140 });
  });
  it('pinLayout: se il titolo non ci sta, ferma la griglia col fondo vicino al bordo', () => {
    expect(pinLayout({ width: 1440, vh: 800, pinH: 900, gridH: 560 })).toEqual({ top: 800 - 900 - 16 });
  });
  it('pinLayout: niente stop sotto le 3 colonne o se la griglia non ci sta', () => {
    expect(pinLayout({ width: 1023, vh: 1000, pinH: 800, gridH: 560 })).toBeNull();
    expect(pinLayout({ width: 1440, vh: 600, pinH: 900, gridH: 560 })).toBeNull();
  });
  it('pinProgress: da 0 a 1 mentre il contenitore scorre per il tratto extra', () => {
    expect(pinProgress(140, 140, 900)).toBe(0);
    expect(pinProgress(140 - 450, 140, 900)).toBe(0.5);
    expect(pinProgress(-5000, 140, 900)).toBe(1);
    expect(pinProgress(600, 140, 900)).toBe(0);
  });
  it('cardProgress: parte con la scheda tutta nello schermo, piena col centro a metà schermo', () => {
    // scheda alta 300 in uno schermo di 800: parte con top 500, piena con top 250
    expect(cardProgress(600, 300, 800)).toBe(0);
    expect(cardProgress(500, 300, 800)).toBe(0);
    expect(cardProgress(375, 300, 800)).toBe(0.5);
    expect(cardProgress(250, 300, 800)).toBe(1);
    expect(cardProgress(-300, 300, 800)).toBe(1);
  });
  it('cardProgress: scheda più alta dello schermo, nessuna divisione per zero', () => {
    const p = cardProgress(0, 900, 800);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });
  it("l'oro arriva prima della fine del tratto, per lasciare il tempo di leggere", () => {
    expect(LINE_END).toBeGreaterThan(0.5);
    expect(LINE_END).toBeLessThan(1);
  });
});
