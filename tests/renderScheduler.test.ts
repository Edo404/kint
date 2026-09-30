import { describe, expect, it } from 'vitest';
import { RenderScheduler } from '../src/gl/renderScheduler';

function fakeRaf() {
  let queue: Array<(t: number) => void> = [];
  let id = 0;
  return {
    raf: (cb: (t: number) => void) => {
      queue.push(cb);
      return ++id;
    },
    caf: () => {
      queue = [];
    },
    flush(t: number) {
      const q = queue;
      queue = [];
      q.forEach((cb) => cb(t));
    },
    pending: () => queue.length,
  };
}

describe('RenderScheduler', () => {
  it('pianifica un solo frame anche con più richieste', () => {
    const f = fakeRaf();
    const s = new RenderScheduler(() => {}, f.raf, f.caf);
    s.request();
    s.request();
    expect(f.pending()).toBe(1);
  });

  it('non fa nulla finché nessuno lo richiede', () => {
    const f = fakeRaf();
    let draws = 0;
    new RenderScheduler(() => draws++, f.raf, f.caf);
    f.flush(16);
    expect(draws).toBe(0);
  });

  it('passa dt null al primo frame e i millisecondi ai successivi', () => {
    const f = fakeRaf();
    const dts: Array<number | null> = [];
    const s = new RenderScheduler((dt) => dts.push(dt), f.raf, f.caf);
    s.request();
    f.flush(1000);
    s.request();
    f.flush(1016);
    expect(dts).toEqual([null, 16]);
  });

  it('passa dt null dopo una pausa lunga', () => {
    const f = fakeRaf();
    const dts: Array<number | null> = [];
    const s = new RenderScheduler((dt) => dts.push(dt), f.raf, f.caf);
    s.request();
    f.flush(1000);
    s.request();
    f.flush(1300);
    expect(dts).toEqual([null, null]);
  });

  it('ignora le richieste quando la pagina è nascosta', () => {
    const f = fakeRaf();
    let hidden = true;
    const s = new RenderScheduler(() => {}, f.raf, f.caf, () => hidden);
    s.request();
    expect(f.pending()).toBe(0);
    hidden = false;
    s.request();
    expect(f.pending()).toBe(1);
  });

  it('stop annulla il frame pianificato', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.request();
    s.stop();
    f.flush(16);
    expect(draws).toBe(0);
  });

  it('con il ciclo a 30 fps disegna circa ogni 33 ms', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.startLoop(30);
    for (let t = 0; t <= 100; t += 16) f.flush(t);
    // disegna a 0, 33+ e 66+ ms: 3 o 4 volte, non 7
    expect(draws).toBeGreaterThanOrEqual(3);
    expect(draws).toBeLessThanOrEqual(4);
  });

  it('una request durante il ciclo disegna al frame successivo', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.startLoop(30);
    f.flush(0);
    const before = draws;
    s.request();
    f.flush(16);
    expect(draws).toBe(before + 1);
  });

  it('stopLoop ferma il ciclo senza altri frame', () => {
    const f = fakeRaf();
    let draws = 0;
    const s = new RenderScheduler(() => draws++, f.raf, f.caf);
    s.startLoop(30);
    f.flush(0);
    s.stopLoop();
    f.flush(40);
    const after = draws;
    f.flush(80);
    expect(draws).toBe(after);
    expect(f.pending()).toBe(0);
  });
});
