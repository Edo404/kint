// Miglioramento progressivo: senza JavaScript la barra è sempre visibile.
export function initNavReveal(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const opening = document.getElementById('opening');
  if (!nav || !opening) return;
  nav.dataset.reveal = 'hidden';
  new IntersectionObserver(
    ([entry]) => {
      nav.dataset.reveal = entry.isIntersecting ? 'hidden' : 'visible';
    },
    { threshold: 0.6 },
  ).observe(opening);
}
