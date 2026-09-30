import { LANGS, type Lang } from './i18n';

const REQUIRED_STRINGS = [
  'meta.title', 'meta.description', 'meta.og_locale', 'meta.portfolio_title', 'meta.portfolio_description',
  'ui.skip_to_content', 'ui.nav_label', 'ui.lang_label', 'ui.scroll_hint', 'ui.for_whom', 'ui.typical_problem',
  'ui.what_we_do', 'ui.key_services', 'ui.linked_services', 'ui.crack', 'ui.gold', 'ui.featured',
  'nav.sectors', 'nav.services', 'nav.contact', 'nav.portfolio',
  'opening.logo_label',
  'presentation.h1', 'presentation.subtitle', 'presentation.paragraph',
  'presentation.cta_primary.label', 'presentation.cta_primary.href',
  'presentation.kintsugi.title', 'presentation.kintsugi.text',
  'sectors.title', 'sectors.intro', 'sectors.closing.text',
  'services.title', 'services.intro', 'services.featured.id', 'services.featured.title', 'services.featured.text',
  'services.always_included.title', 'services.packages.title', 'services.packages.note',
  'contact.title', 'contact.intro', 'contact.call.title', 'contact.call.text', 'contact.call.cta_label',
  'contact.details.email', 'contact.details.address',
  'contact.details.labels.email', 'contact.details.labels.address', 'contact.details.labels.phone', 'contact.details.labels.hours',
  'contact.form.name', 'contact.form.email', 'contact.form.phone', 'contact.form.company', 'contact.form.sector',
  'contact.form.sector_other', 'contact.form.message', 'contact.form.privacy_label', 'contact.form.submit',
  'contact.form.sent', 'contact.form.error',
  'contact.faq.title', 'footer.copyright', 'footer.privacy', 'footer.hosting',
  'privacy.title', 'privacy.intro', 'portfolio.title', 'portfolio.intro',
];

const REQUIRED_ARRAYS = [
  'presentation.values', 'sectors.items', 'services.items', 'services.always_included.items',
  'services.packages.items', 'contact.faq.items', 'privacy.body',
];

const ITEM_FIELDS: Record<string, string[]> = {
  'presentation.values': ['title', 'text'],
  'sectors.items': ['id', 'name', 'for_whom', 'problem', 'what_we_do'],
  'services.items': ['id', 'title', 'description', 'crack', 'gold'],
  'services.packages.items': ['name', 'text'],
  'contact.faq.items': ['q', 'a'],
};

function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

const isText = (v: unknown): boolean => typeof v === 'string' && v.trim() !== '';

// Elenco delle "forme": un percorso per foglia e la lunghezza di ogni array.
function structure(value: unknown, path = '', out: string[] = []): string[] {
  if (Array.isArray(value)) {
    out.push(`${path}#${value.length}`);
    value.forEach((v) => structure(v, `${path}[]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) structure(v, path ? `${path}.${k}` : k, out);
  } else {
    out.push(path);
  }
  return out;
}

function findTodos(value: unknown, path: string, hits: string[]): void {
  if (typeof value === 'string') {
    if (value.includes('[TODO')) hits.push(path);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findTodos(v, `${path}[${i}]`, hits));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) findTodos(v, path ? `${path}.${k}` : k, hits);
  }
}

function validateOne(lang: Lang, c: unknown, errors: string[]): void {
  for (const p of REQUIRED_STRINGS) {
    if (!isText(get(c, p))) errors.push(`${lang}: campo mancante o vuoto: ${p}`);
  }
  for (const p of REQUIRED_ARRAYS) {
    const v = get(c, p);
    if (!Array.isArray(v) || v.length === 0) errors.push(`${lang}: elenco mancante o vuoto: ${p}`);
  }
  for (const [p, fields] of Object.entries(ITEM_FIELDS)) {
    const arr = get(c, p);
    if (!Array.isArray(arr)) continue;
    arr.forEach((item, i) => {
      for (const f of fields) {
        if (!isText((item as Record<string, unknown>)?.[f])) errors.push(`${lang}: ${p}[${i}].${f} mancante o vuoto`);
      }
    });
  }

  const sectors = (get(c, 'sectors.items') as Array<{ id: string; linked_services?: string[]; key_services?: string[] }>) ?? [];
  const services = (get(c, 'services.items') as Array<{ id: string }>) ?? [];

  const seenSectors = new Set<string>();
  for (const s of sectors) {
    if (seenSectors.has(s.id)) errors.push(`${lang}: id settore duplicato: ${s.id}`);
    seenSectors.add(s.id);
  }
  const seenServices = new Set<string>();
  for (const s of services) {
    if (seenServices.has(s.id)) errors.push(`${lang}: id servizio duplicato: ${s.id}`);
    seenServices.add(s.id);
  }
  for (const s of sectors) {
    if (!Array.isArray(s.key_services) || s.key_services.length === 0) errors.push(`${lang}: il settore ${s.id} non ha servizi chiave`);
    for (const ref of s.linked_services ?? []) {
      if (!seenServices.has(ref)) errors.push(`${lang}: il settore ${s.id} cita un servizio inesistente: ${ref}`);
    }
  }

  const todos: string[] = [];
  findTodos(c, '', todos);
  for (const p of todos) errors.push(`${lang}: [TODO] presente in ${p}`);
}

export function validateContent(all: Partial<Record<Lang, unknown>>): string[] {
  const errors: string[] = [];
  const source = all.it;
  if (!source) {
    return ['manca il contenuto della lingua sorgente: it'];
  }

  for (const lang of LANGS) {
    const c = all[lang];
    if (c) validateOne(lang, c, errors);
  }

  const shape = new Set(structure(source));
  const ids = (c: unknown, p: string) => ((get(c, p) as Array<{ id: string }>) ?? []).map((x) => x.id).join(',');

  for (const lang of LANGS) {
    const c = all[lang];
    if (!c || lang === 'it') continue;

    if (ids(c, 'sectors.items') !== ids(source, 'sectors.items')) errors.push(`${lang}: gli id dei settori non coincidono con quelli di it`);
    if (ids(c, 'services.items') !== ids(source, 'services.items')) errors.push(`${lang}: gli id dei servizi non coincidono con quelli di it`);

    const mine = new Set(structure(c));
    const missing = [...shape].filter((k) => !mine.has(k));
    const extra = [...mine].filter((k) => !shape.has(k));
    if (missing.length || extra.length) {
      errors.push(`${lang}: struttura diversa da it (mancano: ${missing.join(', ') || '-'}; in più: ${extra.join(', ') || '-'})`);
    }
  }
  return errors;
}
