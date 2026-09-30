import { DEFAULT_LANG, isLang, pathFor, type Lang } from './i18n';

export interface ContactInput {
  lang: Lang;
  name: string;
  email: string;
  phone: string;
  company: string;
  sector: string;
  message: string;
}

export type ContactResult =
  | { ok: true; data: ContactInput }
  | { ok: false; reason: 'honeypot' | 'invalid'; lang: Lang };

const MAX = { name: 120, email: 254, phone: 40, company: 160, sector: 60, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECTOR = /^(other|[a-z0-9-]{1,60})$/;
const HAS_BREAK = /[\r\n]/;

export function parseContact(get: (key: string) => string | null): ContactResult {
  const rawLang = get('lang') ?? '';
  const lang: Lang = isLang(rawLang) ? rawLang : DEFAULT_LANG;
  const value = (k: keyof typeof MAX) => (get(k) ?? '').trim();

  if ((get('website') ?? '').trim() !== '') return { ok: false, reason: 'honeypot', lang };

  const data: ContactInput = {
    lang,
    name: value('name'),
    email: value('email'),
    phone: value('phone'),
    company: value('company'),
    sector: value('sector') || 'other',
    message: value('message'),
  };

  const invalid =
    !data.name || !data.email || !data.message ||
    !get('privacy') ||
    !EMAIL.test(data.email) ||
    !SECTOR.test(data.sector) ||
    [data.name, data.email, data.phone, data.company, data.sector].some((v) => HAS_BREAK.test(v)) ||
    (Object.keys(MAX) as Array<keyof typeof MAX>).some((k) => data[k].length > MAX[k]);

  return invalid ? { ok: false, reason: 'invalid', lang } : { ok: true, data };
}

export function redirectFor(lang: Lang, status: 'sent' | 'error'): string {
  return `${pathFor(lang)}?${status === 'sent' ? 'sent=1' : 'error=1'}#contatti`;
}

export function buildEmailText(d: ContactInput): string {
  return [
    `Lingua: ${d.lang}`,
    `Nome: ${d.name}`,
    `Email: ${d.email}`,
    `Telefono: ${d.phone || '-'}`,
    `Azienda: ${d.company || '-'}`,
    `Settore: ${d.sector}`,
    '',
    d.message,
    '',
  ].join('\n');
}

const b64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/(.{76})/g, '$1\r\n');
};

export function buildRawEmail(o: { from: string; to: string; replyTo: string; subject: string; text: string }): string {
  return [
    `From: ${o.from}`,
    `To: ${o.to}`,
    `Reply-To: ${o.replyTo}`,
    `Subject: ${o.subject}`,
    `Message-ID: <${crypto.randomUUID()}@kint.ch>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(o.text),
  ].join('\r\n');
}
