// Selettore della lingua (<details>): si chiude con Esc o con un clic fuori.
export function initLangMenu(): void {
  document.querySelectorAll<HTMLDetailsElement>('[data-lang-menu]').forEach((menu) => {
    document.addEventListener('click', (e) => {
      if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
    });
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      menu.querySelector('summary')?.focus();
    });
  });
}
