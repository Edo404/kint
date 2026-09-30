import { EmailMessage } from 'cloudflare:email';
import { buildEmailText, buildRawEmail, parseContact, redirectFor } from '../../src/lib/contactForm';

interface Env {
  SEND_EMAIL?: { send(message: unknown): Promise<void> };
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  ALLOWED_ORIGINS?: string;
}

const redirect = (location: string) => new Response(null, { status: 303, headers: { Location: location } });

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? 'https://kint.ch').split(',').map((s) => s.trim());
  if (origin && !allowed.includes(origin)) return new Response('Forbidden', { status: 403 });

  const form = await request.formData();
  const result = parseContact((k) => {
    const v = form.get(k);
    return typeof v === 'string' ? v : null;
  });

  // Il campo trappola risponde come se l'invio fosse riuscito, per non dare indizi ai bot.
  if (!result.ok) return redirect(redirectFor(result.lang, result.reason === 'honeypot' ? 'sent' : 'error'));

  const to = env.CONTACT_TO ?? 'info@kint.ch';
  const from = env.CONTACT_FROM ?? 'noreply@kint.ch';
  try {
    if (!env.SEND_EMAIL) throw new Error('binding SEND_EMAIL non configurato');
    const raw = buildRawEmail({
      from,
      to,
      replyTo: result.data.email,
      subject: 'Nuovo contatto dal sito Kint',
      text: buildEmailText(result.data),
    });
    await env.SEND_EMAIL.send(new EmailMessage(from, to, raw));
  } catch (err) {
    console.error('invio email fallito', err);
    return redirect(redirectFor(result.data.lang, 'error'));
  }
  return redirect(redirectFor(result.data.lang, 'sent'));
};
