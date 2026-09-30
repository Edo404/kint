import { describe, expect, it } from 'vitest';
import { PerfMeter, formatPerf } from '../src/gl/perf';

describe('PerfMeter', () => {
  it('ignora i dt nulli e fa la media mobile', () => {
    const m = new PerfMeter(0.5);
    m.push(null);
    expect(m.frameMs).toBeNull();
    m.push(20);
    expect(m.frameMs).toBe(20);
    m.push(40);
    expect(m.frameMs).toBeCloseTo(30);
  });
  it('calcola gli fps dai millisecondi', () => {
    const m = new PerfMeter(1);
    m.push(16.6667);
    expect(m.fps).toBeCloseTo(60, 0);
  });
  it('senza campioni gli fps sono nulli', () => {
    expect(new PerfMeter().fps).toBeNull();
  });
});

describe('formatPerf', () => {
  it('scrive una riga per ogni dato', () => {
    const t = formatPerf({ fps: 58.4, frameMs: 17.1, calls: 2, triangles: 29448, pixelRatio: 1.5, width: 1200, height: 800, looping: true });
    expect(t).toContain('58 fps');
    expect(t).toContain('17.1 ms');
    expect(t).toContain('2 draw call');
    expect(t).toContain('29448 triangoli');
    expect(t).toContain('DPR 1.50');
    expect(t).toContain('1800×1200');
    expect(t).toContain('ciclo 30 fps');
  });
  it('mostra un trattino se non ci sono ancora misure', () => {
    const t = formatPerf({ fps: null, frameMs: null, calls: 0, triangles: 0, pixelRatio: 1, width: 400, height: 800, looping: false });
    expect(t).toContain('- fps');
    expect(t).toContain('on-demand');
  });
});
