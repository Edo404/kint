// Modulo di contatto: dopo il POST il server risponde con un redirect a /<lang>/?sent=1#contatti (o ?error=1).
// - inviato: i campi lasciano il posto alla conferma (classe .is-sent) e il focus passa lì, così la legge anche
//   un lettore di schermo;
// - errore: compare il messaggio sopra il bottone, i campi restano;
// - mentre si invia il bottone è occupato e non si può premere due volte.
export function initFormStatus(): void {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  const sent = form.querySelector<HTMLElement>('[data-form-sent]');
  const error = form.querySelector<HTMLElement>('[data-form-error]');
  if (params.get('sent') === '1' && sent) {
    form.classList.add('is-sent');
    // il salto all'ancora #contatti azzera il focus: lo si dà a pagina caricata
    const focusDone = () => sent.focus({ preventScroll: true });
    if (document.readyState === 'complete') focusDone();
    else window.addEventListener('load', () => window.setTimeout(focusDone, 0), { once: true });
  }
  if (params.get('error') === '1' && error) error.hidden = false;

  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
  if (!submit) return;
  // 'submit' parte solo se la validazione del browser è passata
  form.addEventListener('submit', () => {
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
  });
  // tornando indietro dalla cache della pagina il bottone non deve restare bloccato
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    submit.removeAttribute('aria-busy');
    submit.disabled = false;
  });
}
