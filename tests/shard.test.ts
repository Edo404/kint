import { describe, expect, it } from 'vitest';
import { edgePath, jaggedEdge, shardClip, veinTile } from '../src/lib/shard';

describe('jaggedEdge', () => {
  const e = jaggedEdge(3, 28);
  it('va da 0% a 100% senza tornare indietro e resta nella profondità', () => {
    expect(e[0].x).toBe(0);
    expect(e[e.length - 1].x).toBe(100);
    for (let i = 1; i < e.length; i++) expect(e[i].x).toBeGreaterThan(e[i - 1].x);
    for (const p of e) expect(p.y).toBeGreaterThanOrEqual(0), expect(p.y).toBeLessThanOrEqual(28);
  });
  it('è deterministico', () => expect(jaggedEdge(3, 28)).toEqual(e));
});

describe('shardClip / edgePath', () => {
  it('chiude il poligono con il bordo basso misurato dal fondo', () => {
    const c = shardClip([{ x: 0, y: 5 }, { x: 100, y: 10 }], [{ x: 0, y: 3 }, { x: 100, y: 4 }]);
    expect(c).toBe('polygon(0% 5px, 100% 10px, 100% calc(100% - 4px), 0% calc(100% - 3px))');
  });
  it('capovolge il bordo basso nella cucitura', () => {
    expect(edgePath([{ x: 0, y: 5 }, { x: 100, y: 10 }], 28, true, 100)).toBe('M0 23 L100 18');
  });
});

describe('veinTile', () => {
  it('produce un url SVG codificato', () => {
    const v = veinTile(1);
    expect(v.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(v)).toContain('<path');
  });
});
