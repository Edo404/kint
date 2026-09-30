// Misure per il debug (?perf=1): media mobile dei tempi di frame e riquadro a schermo.
export class PerfMeter {
  frameMs: number | null = null;

  constructor(private readonly alpha = 0.1) {}

  push(dt: number | null): void {
    if (dt === null) return;
    this.frameMs = this.frameMs === null ? dt : this.frameMs + (dt - this.frameMs) * this.alpha;
  }

  get fps(): number | null {
    return this.frameMs ? 1000 / this.frameMs : null;
  }
}

export interface PerfStats {
  fps: number | null;
  frameMs: number | null;
  calls: number;
  triangles: number;
  pixelRatio: number;
  width: number;
  height: number;
  looping: boolean;
}

export function formatPerf(s: PerfStats): string {
  const px = `${Math.round(s.width * s.pixelRatio)}×${Math.round(s.height * s.pixelRatio)}`;
  return [
    `${s.fps === null ? '-' : Math.round(s.fps)} fps · ${s.frameMs === null ? '-' : s.frameMs.toFixed(1)} ms`,
    `${s.calls} draw call · ${s.triangles} triangoli`,
    `DPR ${s.pixelRatio.toFixed(2)} · ${px}`,
    s.looping ? 'ciclo 30 fps (apertura)' : 'on-demand',
  ].join('\n');
}

export function createPerfOverlay(): (stats: PerfStats) => void {
  const el = document.createElement('pre');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:50;margin:0;padding:6px 8px;font:11px/1.35 monospace;color:#c9a24b;background:rgb(0 0 0/.7);pointer-events:none;white-space:pre';
  document.body.appendChild(el);
  return (stats) => {
    el.textContent = formatPerf(stats);
  };
}
