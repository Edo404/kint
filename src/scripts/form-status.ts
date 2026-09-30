// Dopo il POST il server risponde con un redirect a /<lang>/?sent=1#contatti (o ?error=1).
export function initFormStatus(): void {
  const params = new URLSearchParams(window.location.search);
  const sent = document.querySelector<HTMLElement>('[data-form-sent]');
  const error = document.querySelector<HTMLElement>('[data-form-error]');
  if (params.get('sent') === '1' && sent) sent.hidden = false;
  if (params.get('error') === '1' && error) error.hidden = false;
}
