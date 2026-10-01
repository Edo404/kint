// Filo dei capitoli: riempimento proporzionale allo scroll tra l'inizio di #kint e la fine di #contatti,
// capitolo acceso = l'ultimo il cui inizio ha superato metà schermo. Le posizioni si misurano solo al resize.
export function initChapterRail(): void {
  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const fill = rail?.querySelector<HTMLElement>('[data-rail-fill]');
  if (!rail || !fill) return;
  const marks = [...rail.querySelectorAll<HTMLElement>('[data-rail-mark]')];
  const sections = marks.map((m) => document.getElementById(m.dataset.railMark!));
  if (sections.some((s) => !s)) return;

  let tops: number[] = [];
  let start = 0;
  let end = 1;
  const measure = () => {
    tops = sections.map((s) => s!.getBoundingClientRect().top + scrollY);
    const last = sections[sections.length - 1]!;
    start = tops[0] - innerHeight * 0.5;
    end = last.getBoundingClientRect().bottom + scrollY - innerHeight;
  };

  let queued = false;
  let current = -2;
  const update = () => {
    queued = false;
    const y = scrollY;
    const p = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)));
    fill.style.transform = `scaleY(${p})`;
    const mid = y + innerHeight * 0.5;
    let idx = -1;
    tops.forEach((t, i) => { if (mid >= t) idx = i; });
    rail.toggleAttribute('data-visible', y > tops[0] - innerHeight * 0.6);
    if (idx === current) return;
    current = idx;
    marks.forEach((m, i) => {
      m.toggleAttribute('data-done', i < idx);
      m.toggleAttribute('data-current', i === idx);
    });
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  measure();
  update();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { measure(); queue(); }, { passive: true });
  // Font e comparse cambiano le altezze dopo il primo calcolo.
  addEventListener('load', () => { measure(); queue(); });
}
