export type Mode = 'webgl' | 'fallback';

type CanvasLike = { getContext(type: string): unknown };

export function hasWebGL(
  doc: { createElement(tag: string): unknown } = document,
): boolean {
  try {
    const canvas = doc.createElement('canvas') as CanvasLike;
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function setMode(
  el: { dataset: Record<string, string | undefined> },
  mode: Mode,
): void {
  el.dataset.mode = mode;
}
