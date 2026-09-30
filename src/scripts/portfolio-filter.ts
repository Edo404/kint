// Tutti i progetti sono già nell'HTML: il filtro li nasconde in base ai parametri ?sector= e ?service=.
export function initPortfolioFilter(): void {
  const params = new URLSearchParams(window.location.search);
  const sector = params.get('sector');
  const service = params.get('service');
  if (!sector && !service) return;
  document.querySelectorAll<HTMLElement>('[data-project]').forEach((el) => {
    const okSector = !sector || el.dataset.sector === sector;
    const okService = !service || (el.dataset.services ?? '').split(' ').includes(service);
    el.hidden = !(okSector && okService);
  });
}
