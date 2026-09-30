import { describe, expect, it } from 'vitest';
import {
  SEAM_MAX,
  makeShardParams,
  packShardTexture,
  seamWindow,
  shardCentersFromGeometry,
} from '../src/gl/vase/shardData';

const centers: Array<[number, number, number]> = Array.from({ length: 40 }, (_, i) => [i * 0.1, i * -0.05, 0.2]);

describe('makeShardParams', () => {
  it('è deterministico per lo stesso seme e cambia con un altro', () => {
    const a = makeShardParams(centers, 7);
    const b = makeShardParams(centers, 7);
    const c = makeShardParams(centers, 8);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('rispetta gli intervalli previsti', () => {
    for (const p of makeShardParams(centers, 1)) {
      expect(p.start).toBeGreaterThanOrEqual(0);
      expect(p.start).toBeLessThanOrEqual(0.15);
      expect(p.end).toBeGreaterThanOrEqual(0.55);
      expect(p.end).toBeLessThanOrEqual(0.85);
      expect(p.angle).toBeGreaterThanOrEqual(Math.PI / 2);
      expect(p.angle).toBeLessThanOrEqual(2 * Math.PI);
      const r = Math.hypot(p.scatter[0], p.scatter[1]);
      expect(r).toBeGreaterThanOrEqual(1.5);
      expect(r).toBeLessThanOrEqual(3.5);
      expect(Math.abs(p.scatter[2])).toBeLessThanOrEqual(1);
      expect(Math.hypot(...p.axis)).toBeCloseTo(1, 5);
    }
  });

  it('conserva i centri dei frammenti', () => {
    const params = makeShardParams(centers, 1);
    expect(params).toHaveLength(centers.length);
    expect(params[3].center).toEqual(centers[3]);
  });
});

describe('seamWindow', () => {
  it('parte poco prima che arrivi il frammento più lento e non supera SEAM_MAX', () => {
    const w = seamWindow(0.6, 0.8);
    expect(w.start).toBeCloseTo(0.74);
    expect(w.end).toBeLessThanOrEqual(SEAM_MAX);
    expect(w.end).toBeGreaterThan(w.start);
  });
  it('è simmetrica rispetto ai due frammenti', () => {
    expect(seamWindow(0.6, 0.8)).toEqual(seamWindow(0.8, 0.6));
  });
});

describe('shardCentersFromGeometry', () => {
  it('fa la media delle posizioni dei vertici di ciascun frammento', () => {
    const positions = [0, 0, 0, 2, 0, 0, 10, 10, 10, 12, 10, 10];
    const ids = [0, 0, 1, 1];
    expect(shardCentersFromGeometry(positions, ids, 2)).toEqual([
      [1, 0, 0],
      [11, 10, 10],
    ]);
  });
});

describe('packShardTexture', () => {
  it('scrive tre texel RGBA per frammento nell\'ordine centro, dispersione, asse', () => {
    const params = makeShardParams(centers.slice(0, 2), 3);
    const data = packShardTexture(params);
    expect(data).toHaveLength(2 * 3 * 4);
    const stride = 2 * 4; // larghezza della texture = numero di frammenti
    const texel = (row: number, col: number) => Array.from(data.slice(row * stride + col * 4, row * stride + col * 4 + 4));
    expect(texel(0, 1)).toEqual([...params[1].center, params[1].angle].map((v) => Math.fround(v)));
    expect(texel(1, 1)).toEqual([...params[1].scatter, params[1].start].map((v) => Math.fround(v)));
    expect(texel(2, 0)).toEqual([...params[0].axis, params[0].end].map((v) => Math.fround(v)));
  });
});
