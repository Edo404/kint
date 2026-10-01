// Settori: la lista diventa una serie di schede (tab). Scegliere un settore mostra la sua scheda
// ed evidenzia nei Servizi quelli collegati. Senza JavaScript le schede sono tutte visibili.
export function initSectorExplorer(): void {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root) return;
  const list = root.querySelector<HTMLElement>('[data-explorer-list]');
  const tabs = [...root.querySelectorAll<HTMLAnchorElement>('[data-explorer-tab]')];
  const panels = new Map([...root.querySelectorAll<HTMLElement>('[data-sector]')].map((p) => [p.dataset.sector!, p]));
  const services = document.querySelectorAll<HTMLElement>('[data-service]');
  if (!list || !tabs.length) return;

  list.setAttribute('role', 'tablist');
  list.querySelectorAll('li').forEach((li) => li.setAttribute('role', 'presentation'));

  const select = (id: string, opts: { focus?: boolean; highlight?: boolean } = {}) => {
    tabs.forEach((t) => {
      const on = t.dataset.explorerTab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && opts.focus) t.focus();
    });
    panels.forEach((p, key) => {
      const on = key === id;
      p.toggleAttribute('data-active', on);
      p.setAttribute('aria-hidden', String(!on));
      p.toggleAttribute('inert', !on);
    });
    if (opts.highlight) {
      const linked = (panels.get(id)?.dataset.linked ?? '').split(' ');
      services.forEach((s) => s.toggleAttribute('data-highlight', linked.includes(s.dataset.service ?? '')));
    }
  };

  tabs.forEach((t, i) => {
    const id = t.dataset.explorerTab!;
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', `settori-${id}`);
    panels.get(id)?.setAttribute('role', 'tabpanel');
    panels.get(id)?.setAttribute('aria-labelledby', t.id);
    t.addEventListener('click', (e) => {
      e.preventDefault();
      select(id, { highlight: true });
    });
    t.addEventListener('keydown', (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : step ? (i + step + tabs.length) % tabs.length : -1;
      if (to < 0) return;
      e.preventDefault();
      select(tabs[to].dataset.explorerTab!, { focus: true, highlight: true });
      tabs[to].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  });

  // Un link #settori-<id> (da fuori o dall'indirizzo) apre direttamente quella scheda.
  const fromHash = () => {
    const id = location.hash.replace('#settori-', '');
    if (location.hash.startsWith('#settori-') && panels.has(id)) select(id, { highlight: true });
  };
  select(tabs[0].dataset.explorerTab!);
  fromHash();
  window.addEventListener('hashchange', fromHash);
  root.setAttribute('data-ready', '');
}
