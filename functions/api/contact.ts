import { describe, expect, it } from 'vitest';
import { buildEmailText, buildRawEmail, parseContact, redirectFor } from '../src/lib/contactForm';

const fields = (over: Record<string, string> = {}) => {
  const base: Record<string, string> = {
    lang: 'it', name: 'Mario Rossi', email: 'mario@example.com', phone: '', company: 'Rossi Srl',
    sector: 'ristorazione', message: 'Vorrei un sito.', privacy: 'on', website: '',
  };
  const all = { ...base, ...over };
  return (k: string) => (k in all ? all[k] : null);
};

describe('parseContact', () => {
  it('accetta un modulo valido', () => {
    const r = parseContact(fields());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatchObject({ lang: 'it', name: 'Mario Rossi', email: 'mario@example.com', sector: 'ristorazione' });
  });

  it('scarta gli invii con il campo trappola compilato', () => {
    const r = parseContact(fields({ website: 'http://spam' }));
    expect(r).toMatchObject({ ok: false, reason: 'honeypot' });
  });

  it('richiede nome, email, messaggio e consenso privacy', () => {
    for (const bad of [{ name: '' }, { email: '' }, { message: '  ' }, { privacy: '' }]) {
      expect(parseContact(fields(bad))).toMatchObject({ ok: false, reason: 'invalid' });
    }
  });

  it('rifiuta un\'email malformata', () => {
    expect(parseContact(fields({ email: 'non-una-email' })).ok).toBe(false);
  });

  it('rifiuta i ritorni a capo nei campi di intestazione (header injection)', () => {
    expect(parseContact(fields({ name: 'Mario\r\nBcc: x@y.z' })).ok).toBe(false);
    expect(parseContact(fields({ email: 'a@b.it\r\nBcc: x@y.z' })).ok).toBe(false);
  });

  it('rifiuta testi troppo lunghi', () => {
    expect(parseContact(fields({ message: 'a'.repeat(5001) })).ok).toBe(false);
  });

  it('accetta il settore "other" e rifiuta valori strani', () => {
    expect(parseContact(fields({ sector: 'other' })).ok).toBe(true);
    expect(parseContact(fields({ sector: '<script>' })).ok).toBe(false);
  });

  it('ripiega su it per una lingua sconosciuta', () => {
    const r = parseContact(fields({ lang: 'xx' }));
    expect(r.ok && r.data.lang).toBe('it');
  });
});

describe('redirectFor', () => {
  it('torna al blocco contatti con lo stato', () => {
    expect(redirectFor('fr', 'sent')).toBe('/fr/?sent=1#contatti');
    expect(redirectFor('de', 'error')).toBe('/de/?error=1#contatti');
  });
});

describe('email', () => {
  const data = { lang: 'it' as const, name: 'Mario', email: 'mario@example.com', phone: '+41 79 000 00 00', company: 'Rossi', sector: 'ristorazione', message: 'Ciao è un àccento' };

  it('il testo contiene tutti i campi', () => {
    const t = buildEmailText(data);
    for (const v of ['Mario', 'mario@example.com', '+41 79 000 00 00', 'Rossi', 'ristorazione', 'Ciao è un àccento']) expect(t).toContain(v);
  });

  it('il MIME ha le intestazioni e il corpo in base64', () => {
    const raw = buildRawEmail({ from: 'noreply@kint.ch', to: 'info@kint.ch', replyTo: 'mario@example.com', subject: 'Nuovo contatto dal sito Kint', text: 'Ciao è' });
    expect(raw).toContain('From: noreply@kint.ch\r\n');
    expect(raw).toContain('To: info@kint.ch\r\n');
    expect(raw).toContain('Reply-To: mario@example.com\r\n');
    expect(raw).toContain('Content-Transfer-Encoding: base64');
    const body = raw.split('\r\n\r\n')[1].replace(/\r\n/g, '');
    expect(Buffer.from(body, 'base64').toString('utf8')).toBe('Ciao è');
  });
});
