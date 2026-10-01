import { describe, expect, it } from 'vitest';
import { pointAt, threadPoints } from '../src/scripts/gold-thread';

describe('threadPoints', () => {
  const pts = threadPoints(1440, 100, 9000);
  it('scende sempre e arriva alla fine', () => {
    for (let i = 1; i < pts.length; i++) expect(pts[i].y).toBeGreaterThan(pts[i - 1].y);
    expect(pts[0].y).toBe(100);
    expect(pts[pts.length - 1].y).toBe(9000);
  });
  it('resta nello schermo e finisce al centro, sul vaso', () => {
    for (const p of pts) expect(p.x).toBeGreaterThan(0), expect(p.x).toBeLessThan(1440);
    expect(pts[pts.length - 1].x).toBeCloseTo(720, 0);
  });
  it('ha sempre la stessa forma', () => {
    expect(threadPoints(1440, 100, 9000)).toEqual(pts);
  });
});

describe('pointAt', () => {
  const pts = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 50, y: 200 }];
  it('interpola tra due punti', () => {
    expect(pointAt(pts, 50)).toEqual({ x: 50, y: 50 });
    expect(pointAt(pts, 150)).toEqual({ x: 75, y: 150 });
  });
  it('prima dell\'inizio non c\'è punto, dopo la fine resta sull\'ultimo', () => {
    expect(pointAt(pts, -1)).toBeNull();
    expect(pointAt(pts, 999)).toEqual({ x: 50, y: 200 });
  });
});
