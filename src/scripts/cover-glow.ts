// Sezioni coperte: una luce d'oro accende le venature dove passa il puntatore.
// Su telefono (o prima che il mouse entri) la luce segue lo scroll: scende col centro dello schermo
// e ondeggia di lato. Si muove solo un riquadro con transform, non tutta la sezione.
export function initCoverGlow(): void {
  const covers = [...document.querySelectorAll<HTMLElement>('[data-cover]')];
  if (!covers.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  for (const cover of covers) {
    const lit = cover.querySelector<HTMLElement>('[data-cover-lit]');
    if (!lit) continue;
    const place = (x: number, y: number) => {
      lit.style.setProperty('--gx', `${Math.round(x)}px`);
      lit.style.setProperty('--gy', `${Math.round(y)}px`);
    };
    let pointer = false;
    let visible = false;
    let queued = false;

    const fromScroll = () => {
      queued = false;
      if (pointer || !visible) return;
      const r = cover.getBoundingClientRect();
      place(r.width * (0.5 + 0.32 * Math.sin(scrollY / 420)), innerHeight * 0.45 - r.top);
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(fromScroll);
    };

    if (reduce) {
      place(cover.clientWidth / 2, Math.min(cover.clientHeight / 2, 500));
      continue;
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cover.toggleAttribute('data-glow', visible);
      if (visible) queue();
    }).observe(cover);
    addEventListener('scroll', queue, { passive: true });

    if (fine) {
      cover.addEventListener('pointermove', (e) => {
        pointer = true;
        const r = cover.getBoundingClientRect();
        place(e.clientX - r.left, e.clientY - r.top);
      });
      cover.addEventListener('pointerleave', () => {
        pointer = false;
        queue();
      });
    }
  }
}
