// Telefono: i puntini aprono l'elenco delle sezioni sotto la barra.
// Si chiude scegliendo una voce, con Esc, con un clic fuori o aprendo il selettore della lingua.
export function initNavMenu(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const button = nav?.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = nav?.querySelector<HTMLElement>('[data-nav-menu]');
  if (!nav || !button || !menu) return;
  const lang = nav.querySelector<HTMLDetailsElement>('[data-lang-menu]');

  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    nav.toggleAttribute('data-menu-open', open);
    if (open && lang) lang.open = false;
  };
  const isOpen = () => button.getAttribute('aria-expanded') === 'true';

  button.addEventListener('click', () => set(!isOpen()));
  menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) set(false); });
  document.addEventListener('click', (e) => { if (isOpen() && !nav.contains(e.target as Node)) set(false); });
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !isOpen()) return;
    set(false);
    button.focus();
  });
  lang?.addEventListener('toggle', () => { if (lang.open) set(false); });
}
