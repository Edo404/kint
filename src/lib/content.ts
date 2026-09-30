import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { validateContent } from './contentSchema';
import type { Content, SiteData } from './content.types';
import { LANGS, type Lang } from './i18n';

const DIR = join(process.cwd(), 'src', 'content');
let cache: { content: Partial<Record<Lang, Content>>; available: Lang[] } | null = null;

const read = (name: string) => parse(readFileSync(join(DIR, name), 'utf8'));

export function loadAll() {
  if (cache) return cache;
  const content: Partial<Record<Lang, Content>> = {};
  for (const lang of LANGS) {
    if (existsSync(join(DIR, `${lang}.yaml`))) content[lang] = read(`${lang}.yaml`) as Content;
  }
  const errors = validateContent(content);
  if (errors.length) throw new Error(`Contenuti non validi:\n- ${errors.join('\n- ')}`);
  cache = { content, available: LANGS.filter((l) => content[l]) };
  return cache;
}

export function loadSite(): SiteData {
  return read('site.yaml') as SiteData;
}

export function lastmodFor(lang: Lang): string {
  return statSync(join(DIR, `${lang}.yaml`)).mtime.toISOString().slice(0, 10);
}
