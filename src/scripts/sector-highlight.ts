export function initSectorHighlight(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-sector]');
  const services = document.querySelectorAll<HTMLElement>('[data-service]');
  let active: string | null = null;

  const apply = (id: string | null) => {
    active = id;
    const linked = id
      ? (document.querySelector<HTMLElement>(`[data-sector="${id}"]`)?.dataset.linked ?? '').split(' ')
      : [];
    cards.forEach((c) => c.toggleAttribute('data-active', c.dataset.sector === id));
    services.forEach((s) => s.toggleAttribute('data-highlight', linked.includes(s.dataset.service ?? '')));
  };

  const toggle = (card: HTMLElement) => apply(active === card.dataset.sector ? null : (card.dataset.sector ?? null));

  cards.forEach((card) => {
    card.tabIndex = 0;
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) return; // i link ai servizi funzionano normalmente
      toggle(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(card);
      }
    });
  });
}
