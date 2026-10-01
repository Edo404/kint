// Fascia "sempre inclusi": copia la lista finché riempie due schermi e la fa scorrere (CSS).
// Le copie sono nascoste ai lettori di schermo; senza JavaScript la lista resta ferma e centrata.
export function initMarquee(): void {
  const box = document.querySelector<HTMLElement>('[data-marquee]');
  const track = box?.querySelector<HTMLElement>('.marquee-track');
  if (!box || !track || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const copies = Math.max(1, Math.ceil(innerWidth / Math.max(1, track.scrollWidth)));
  // Metà della fascia = originale + (copies - 1) copie; l'altra metà è identica, così il giro è senza salti.
  for (let i = 0; i < copies * 2 - 1; i++) {
    const clone = track.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    box.append(clone);
  }
  box.style.setProperty('--marquee-dur', `${copies * 28}s`);
  box.setAttribute('data-running', '');
}
