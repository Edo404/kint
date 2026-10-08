// Logo dell'apertura: dove il CSS legato allo scroll non c'è (Safari prima di iOS 26), lo scroll
// riapre i cocci con JavaScript: --sh va da 0 a 1 nei primi 85vh, --shw nei primi 6vh (copia intera che sparisce).
// Stesso effetto delle animazioni sh-out e sh-whole-out in site.css.
export function initShatterScroll(): void {
  const logo = document.querySelector<SVGElement>('[data-shattered]');
  if (!logo || CSS.supports('animation-timeline: scroll()')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  logo.classList.add('sh-js');
  let queued = false;
  const update = () => {
    queued = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    logo.style.setProperty('--sh', Math.min(1, y / (0.85 * vh)).toFixed(3));
    logo.style.setProperty('--shw', Math.min(1, y / (0.06 * vh)).toFixed(3));
  };
  window.addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}
