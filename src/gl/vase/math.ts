export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 <= e0) return x >= e1 ? 1 : 0;
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export function scrollProgress(scrollY: number, docHeight: number, viewHeight: number): number {
  const max = docHeight - viewHeight;
  return max <= 0 ? 0 : clamp01(scrollY / max);
}

export function shardEase(p: number, start: number, end: number): number {
  return smoothstep(start, end, p);
}

export function seamProgress(p: number, start: number, end: number): number {
  if (end <= start) return p >= end ? 1 : 0;
  return clamp01((p - start) / (end - start));
}

export function opacityAt(p: number): number {
  return 0.2 + 0.8 * smoothstep(0, 0.85, p);
}

export interface Anchor {
  x: number;
  scale: number;
  opacityMul: number;
}

export function anchorFor(width: number, height: number, p: number): Anchor {
  const closing = smoothstep(0.92, 1, p);
  if (width >= 900 && width > height) {
    return { x: 0.5 * (1 - closing), scale: 1, opacityMul: 1 };
  }
  return { x: 0, scale: 0.85, opacityMul: 0.5 + 0.5 * closing };
}
