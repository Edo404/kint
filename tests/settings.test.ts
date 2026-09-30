import { describe, expect, it } from 'vitest';
import { capPixelRatio, readSettings, type Env } from '../src/gl/settings';

const base: Env = {
  width: 1440,
  height: 900,
  dpr: 2,
  cores: 8,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120',
  search: '',
};

describe('readSettings', () => {
  it('desktop potente', () => {
    const s = readSettings(base);
    expect(s).toMatchObject({
      isMobile: false,
      isRetina: true,
      cpuCoreCount: 8,
      isSmallScreen: false,
      weak: false,
      debugP: null,
      forceHd: false,
      debugPerf: false,
    });
  });

  it('riconosce i telefoni dallo user agent', () => {
    const s = readSettings({ ...base, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile/15E148' });
    expect(s.isMobile).toBe(true);
    expect(s.weak).toBe(true);
  });

  it('schermo piccolo se il lato corto è ≤ 820', () => {
    expect(readSettings({ ...base, width: 820, height: 1180 }).isSmallScreen).toBe(true);
    expect(readSettings({ ...base, width: 1440, height: 821 }).isSmallScreen).toBe(false);
  });

  it('debole con 4 core o meno', () => {
    expect(readSettings({ ...base, cores: 4 }).weak).toBe(true);
    expect(readSettings({ ...base, cores: 5 }).weak).toBe(false);
  });

  it('legge gli override da query string', () => {
    const s = readSettings({ ...base, search: '?p=0.5&USE_HD=1' });
    expect(s.debugP).toBe(0.5);
    expect(s.forceHd).toBe(true);
  });

  it('?perf=1 attiva il riquadro delle prestazioni', () => {
    expect(readSettings({ ...base, search: '?perf=1' }).debugPerf).toBe(true);
    expect(readSettings({ ...base, search: '?perf=0' }).debugPerf).toBe(false);
  });

  it('ignora un p non valido o fuori intervallo', () => {
    expect(readSettings({ ...base, search: '?p=abc' }).debugP).toBeNull();
    expect(readSettings({ ...base, search: '?p=2' }).debugP).toBeNull();
  });
});

describe('capPixelRatio', () => {
  it('non cambia se sotto il tetto', () => {
    expect(capPixelRatio(1.5, 1000, 800, 2560 * 1440)).toBe(1.5);
  });
  it('riduce se larghezza × altezza × pr² supera il tetto', () => {
    const pr = capPixelRatio(1.5, 3840, 2160, 2560 * 1440);
    expect(pr).toBeLessThan(1.5);
    expect(3840 * 2160 * pr * pr).toBeCloseTo(2560 * 1440, 0);
  });
  it('con tetto infinito non cambia', () => {
    expect(capPixelRatio(1.5, 3840, 2160, Infinity)).toBe(1.5);
  });
});
