// FAQ: apertura e chiusura morbide come sulle sotto-landing (altezza 0 → piena e opacità 0 → 1,
// 0.4 s, cubic-bezier(.2,.8,.2,1)); se ne apre una alla volta. Senza JavaScript o con "riduci movimento"
// resta il <details> nativo, che si apre di scatto.
const DURATION = 400;
const EASING = 'cubic-bezier(.2,.8,.2,1)';

export function initFaq(): void {
  const items = [...document.querySelectorAll<HTMLDetailsElement>('.faq details')];
  if (!items.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const running = new WeakMap<HTMLDetailsElement, Animation>();
  // da qui icona e colore seguono .is-open, che cambia subito anche in chiusura
  document.querySelectorAll('.faq').forEach((f) => f.classList.add('is-animated'));

  const animate = (d: HTMLDetailsElement, open: boolean) => {
    const body = d.querySelector<HTMLElement>('.faq-a');
    if (!body) return;
    // altezza attuale prima di fermare un'animazione in corso: un secondo clic riparte da lì
    // (a details chiuso Chrome dà comunque un'altezza al contenuto nascosto: lì si parte da 0)
    const from = d.open ? body.getBoundingClientRect().height : 0;
    running.get(d)?.cancel();
    if (open) d.open = true;
    d.classList.toggle('is-open', open);
    const to = open ? body.scrollHeight : 0;
    const anim = body.animate(
      [
        { height: `${from}px`, opacity: open ? 0 : 1 },
        { height: `${to}px`, opacity: open ? 1 : 0 },
      ],
      { duration: DURATION, easing: EASING },
    );
    running.set(d, anim);
    anim.onfinish = () => {
      running.delete(d);
      if (!open) d.open = false;
    };
  };

  items.forEach((d) => {
    d.classList.toggle('is-open', d.open);
    d.querySelector('summary')?.addEventListener('click', (e) => {
      e.preventDefault();
      const opening = !d.classList.contains('is-open');
      if (opening) items.forEach((o) => o !== d && o.classList.contains('is-open') && animate(o, false));
      animate(d, opening);
    });
  });
}
