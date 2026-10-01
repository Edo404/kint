// Barra in alto: sottolinea la voce della sezione che occupa il centro dello schermo.
export function initNavActive(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const set = (id: string | null) =>
    links.forEach((a) => (a.dataset.navLink === id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) set(e.target.id);
        else if (links.some((a) => a.dataset.navLink === e.target.id && a.hasAttribute('aria-current'))) set(null);
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  links.forEach((a) => {
    const s = document.getElementById(a.dataset.navLink!);
    if (s) io.observe(s);
  });
}
