// Geometria del logotipo "kint." (stile del logo RISTOkint): Manrope 600 a 200px, spaziatura -4,
// contorno dello stesso colore largo 12 con giunzioni tonde, che arrotonda spigoli ed estremità.
// Misure dell'inchiostro prese nel browser con il font del sito (origine del testo in 0, linea di base BASE):
// sinistra 8, destra 349, alto -152, basso +6. Punto: diametro 0.29em, a 12 unità dalla t, poggiato sul fondo.
export const MARK = {
  font: 200,
  weight: 600,
  spacing: -4,
  stroke: 12,
  base: 158,
  dot: { cx: 390, cy: 135, r: 29 },
  viewBox: { x: 6, y: 4, w: 415, h: 162 },
} as const;

export const markViewBox = `${MARK.viewBox.x} ${MARK.viewBox.y} ${MARK.viewBox.w} ${MARK.viewBox.h}`;
