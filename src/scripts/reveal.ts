// Comparsa allo scroll: aggiunge .is-in agli elementi [data-inview] quando entrano nella vista.
// Senza JavaScript (niente classe .js su <html>) tutto è già visibile: vedi sections.css.
export function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-inview]');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}
