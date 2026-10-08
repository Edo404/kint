// Servizi: lo scroll ripara le schede. La linea tratteggiata di ogni scheda si riempie d'oro piano piano
// (variabile --p da 0 a 1) e quando è piena il testo passa da Crepa a Oro; risalendo torna indietro.
// - 3 colonne e griglia che sta nello schermo: titolo e griglia restano fermi (position: sticky) per un tratto
//   di scroll in più, e tutte le schede si riparano insieme.
// - Altrimenti (tablet, mobile, schermi bassi): ogni scheda si ripara da sola mentre sale verso metà schermo.
// Con "riduci movimento" o senza JavaScript si vede subito l'oro.
const NAV = 80; // spazio della barra in alto (la pillola finisce a ~68px)
const EDGE = 16; // margine dal fondo quando il titolo non ci sta
const EXTRA = 0.9; // tratto di scroll in più, in altezze di schermo
export const LINE_END = 0.75; // quota del tratto in cui la linea è piena; il resto serve a leggere l'oro

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Posizione `top` della parte ferma, o null se lo stop non si usa. */
export function pinLayout({ width, vh, pinH, gridH }: { width: number; vh: number; pinH: number; gridH: number }): { top: number } | null {
  if (width < 1024 || gridH + NAV + EDGE > vh) return null;
  if (pinH + NAV <= vh) return { top: Math.round(NAV + (vh - NAV - pinH) / 2) };
  return { top: vh - pinH - EDGE };
}

/** Avanzamento dello stop: `trackTop` è il bordo alto del contenitore, `extra` il tratto in più. */
export const pinProgress = (trackTop: number, top: number, extra: number) => clamp01((top - trackTop) / extra);

/** Avanzamento di una scheda: dal 90% al 50% dell'altezza dello schermo. */
export const cardProgress = (cardTop: number, vh: number) => clamp01((0.9 * vh - cardTop) / (0.4 * vh));

export function initRepairScroll(): void {
  const track = document.querySelector<HTMLElement>('[data-repair-track]');
  const pin = document.querySelector<HTMLElement>('[data-repair-pin]');
  const grid = document.querySelector<HTMLElement>('[data-repair-grid]');
  if (!track || !pin || !grid) return;
  const cards = [...grid.querySelectorAll<HTMLElement>('.service')];

  const paint = (card: HTMLElement, line: number) => {
    card.style.setProperty('--p', line.toFixed(3));
    card.dataset.state = line >= 1 ? 'gold' : 'crack';
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cards.forEach((c) => paint(c, 1));
    return;
  }

  let layout: { top: number } | null = null;
  let extra = 0;

  const measure = () => {
    const vh = window.innerHeight;
    layout = pinLayout({ width: window.innerWidth, vh, pinH: pin.offsetHeight, gridH: grid.offsetHeight });
    extra = Math.round(vh * EXTRA);
    track.classList.toggle('is-pinned', !!layout);
    track.style.setProperty('--pin-top', layout ? `${layout.top}px` : '');
    track.style.setProperty('--pin-extra', layout ? `${extra}px` : '');
  };

  const update = () => {
    if (layout) {
      const line = clamp01(pinProgress(track.getBoundingClientRect().top, layout.top, extra) / LINE_END);
      cards.forEach((c) => paint(c, line));
    } else {
      const vh = window.innerHeight;
      cards.forEach((c) => paint(c, cardProgress(c.getBoundingClientRect().top, vh)));
    }
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  measure();
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    schedule();
  });
  new ResizeObserver(() => {
    measure();
    schedule();
  }).observe(pin);
}
