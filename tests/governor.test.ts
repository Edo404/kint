import { describe, expect, it } from 'vitest';
import { PerfGovernor, buildPixelRatioLevels } from '../src/gl/governor';

describe('buildPixelRatioLevels', () => {
  it('limita a 1.5 su schermi densi', () => {
    expect(buildPixelRatioLevels(3, false)).toEqual([1.5, 1.25, 1]);
  });
  it('limita a 1.25 su dispositivi deboli', () => {
    expect(buildPixelRatioLevels(3, true)).toEqual([1.25, 1]);
  });
  it("a dpr 1 c'è un solo livello", () => {
    expect(buildPixelRatioLevels(1, false)).toEqual([1]);
  });
  it('a dpr 1.5 scende senza duplicati', () => {
    expect(buildPixelRatioLevels(1.5, false)).toEqual([1.5, 1.25, 1]);
  });
});

function feed(g: PerfGovernor, dt: number | null, n: number) {
  for (let i = 0; i < n; i++) g.tick(dt);
}

describe('PerfGovernor', () => {
  it('parte dal primo livello', () => {
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: () => {} });
    expect(g.pixelRatio).toBe(2);
  });

  it('non cambia con frame veloci', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, 16, 90);
    expect(calls).toEqual([]);
  });

  it('scende di un livello sotto 45 fps su una finestra piena', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, 30, 30); // ~33 fps
    expect(calls).toEqual([1.5]);
    expect(g.pixelRatio).toBe(1.5);
  });

  it('non scende prima che la finestra sia piena', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, 30, 29);
    expect(calls).toEqual([]);
  });

  it('ignora dt null', () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1.5, 1], onChange: (p) => calls.push(p) });
    feed(g, null, 100);
    expect(calls).toEqual([]);
  });

  it("si ferma all'ultimo livello", () => {
    const calls: number[] = [];
    const g = new PerfGovernor({ levels: [2, 1], onChange: (p) => calls.push(p) });
    feed(g, 40, 120);
    expect(calls).toEqual([1]);
    expect(g.pixelRatio).toBe(1);
  });
});
