import Lenis from 'lenis';

// Scroll morbido con inerzia (come il sito di riferimento). Solo rotella e trackpad:
// sul touch resta lo scroll nativo del telefono. Con "riduci movimento" non si attiva.
export function initSmoothScroll(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  new Lenis({
    autoRaf: true,
    lerp: 0.09,
    wheelMultiplier: 0.9,
    anchors: { offset: -80 },
    stopInertiaOnNavigate: true,
  });
}
