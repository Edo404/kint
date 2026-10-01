// Servizi: l'interruttore Crepa / Oro gira tutte le schede tra il problema e la soluzione.
// Le schede partono dalla crepa e passano all'oro da sole la prima volta che entrano in vista
// (non con "riduci movimento"). Senza JavaScript si vedono entrambe le facce.
export function initRepairToggle(): void {
  const toggle = document.querySelector<HTMLElement>('[data-repair-toggle]');
  const grid = document.querySelector<HTMLElement>('[data-repair-grid]');
  if (!toggle || !grid) return;
  const buttons = [...toggle.querySelectorAll<HTMLButtonElement>('[data-repair]')];
  let touched = false;

  const set = (state: string) => {
    grid.dataset.state = state;
    toggle.dataset.state = state;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.repair === state)));
  };

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      touched = true;
      set(b.dataset.repair!);
    }),
  );

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    set('gold');
    return;
  }
  set('crack');
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      window.setTimeout(() => { if (!touched) set('gold'); }, 1400);
    },
    { rootMargin: '0px 0px -40% 0px' },
  );
  io.observe(grid);
}
