export interface Size {
  w: number;
  h: number;
}

// Su iPhone la barra di Safari entra ed esce ai primi scroll e cambia l'altezza di ~80-110 px:
// ridimensionare il canvas WebGL a ogni evento fa "scattare" lo sfondo. Sotto questa soglia si ignora.
export const TOOLBAR_SLACK = 160;

export function needsResize(prev: Size | null, next: Size, slack = TOOLBAR_SLACK): boolean {
  if (!prev) return true;
  if (next.w !== prev.w) return true;
  return Math.abs(next.h - prev.h) > slack;
}
