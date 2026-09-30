import type { Content, SiteData } from './content.types';
import { SITE, absoluteUrl, pathFor, type Alternate, type Lang } from './i18n';

// Verificare i nomi ufficiali nella documentazione dei fornitori prima di pubblicare: cambiano.
export const AI_BOTS = [
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot',
  'Claude-SearchBot', 'Claude-User', 'ClaudeBot',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended',
  'Googlebot', 'Bingbot',
];

export function buildRobots({ noindex }: { noindex: boolean }): string {
  if (noindex) return 'User-agent: *\nDisallow: /\n';
  const bots = AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n');
  return `${bots}\nUser-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
}

export interface SitemapEntry {
  path: string;
  lastmod: string;
  alternates: Alternate[];
}

export function buildSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const alts = e.alternates
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`)
        .join('\n');
      return `  <url>\n    <loc>${absoluteUrl(e.path)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n${alts}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export function buildMarkdown(c: Content, site: SiteData): string {
  const p = c.presentation;
  const lines: string[] = [
    `# ${p.h1}`,
    '',
    `**${site.name}** — ${p.subtitle}`,
    '',
    p.paragraph,
    '',
    `## ${p.kintsugi.title}`,
    '',
    p.kintsugi.text,
    '',
    ...p.values.flatMap((v) => [`- **${v.title}.** ${v.text}`]),
    '',
    `## ${c.sectors.title}`,
    '',
    c.sectors.intro,
    '',
  ];
  for (const s of c.sectors.items) {
    lines.push(
      `### ${s.name}`,
      '',
      `- ${c.ui.for_whom}: ${s.for_whom}`,
      `- ${c.ui.typical_problem}: ${s.problem}`,
      `- ${c.ui.what_we_do}: ${s.what_we_do}`,
      `- ${c.ui.key_services}: ${s.key_services.join('; ')}`,
      '',
    );
  }
  lines.push(`## ${c.services.title}`, '', c.services.intro, '', `### ${c.services.featured.title}`, '', c.services.featured.text, '');
  for (const s of c.services.items) {
    lines.push(`### ${s.title}`, '', s.description, '', `- ${c.ui.crack}: ${s.crack}`, `- ${c.ui.gold}: ${s.gold}`, '');
  }
  lines.push(
    `### ${c.services.always_included.title}`, '',
    ...c.services.always_included.items.map((i) => `- ${i}`), '',
    `### ${c.services.packages.title}`, '',
    ...c.services.packages.items.map((i) => `- **${i.name}.** ${i.text}`), '',
    c.services.packages.note, '',
    `## ${c.contact.title}`, '', c.contact.intro, '',
    `### ${c.contact.call.title}`, '', c.contact.call.text, '',
    `- ${c.contact.details.labels.email}: ${c.contact.details.email}`,
    `- ${c.contact.details.labels.address}: ${c.contact.details.address}`,
  );
  if (c.contact.details.phone) lines.push(`- ${c.contact.details.labels.phone}: ${c.contact.details.phone}`);
  if (c.contact.details.hours) lines.push(`- ${c.contact.details.labels.hours}: ${c.contact.details.hours}`);
  lines.push('', `### ${c.contact.faq.title}`, '');
  for (const f of c.contact.faq.items) lines.push(`**${f.q}**`, '', f.a, '');
  return `${lines.join('\n')}\n`;
}

const LANG_NAMES: Record<Lang, string> = { it: 'Italiano', en: 'English', fr: 'Français', de: 'Deutsch' };

interface LlmsInput {
  content: Partial<Record<Lang, Content>>;
  available: Lang[];
  site: SiteData;
}

export function buildLlmsTxt({ available, site, portfolio }: LlmsInput & { portfolio: boolean }): string {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.name} is a web agency based in ${site.city}, ${site.region}, Switzerland, serving small businesses in Italy and Switzerland: websites, brand, social media, Google visibility and AI automations. Websites that are beautiful for people and readable by AI assistants.`,
    '',
    '## Pages',
    '',
  ];
  for (const lang of available) {
    lines.push(`- [${LANG_NAMES[lang]}](${absoluteUrl(pathFor(lang))}): main page`);
    lines.push(`- [${LANG_NAMES[lang]} (markdown)](${absoluteUrl(pathFor(lang, 'index.md'))}): full content as markdown`);
    lines.push(`- [${LANG_NAMES[lang]} privacy](${absoluteUrl(pathFor(lang, 'privacy'))}): privacy notice`);
    if (portfolio) lines.push(`- [${LANG_NAMES[lang]} portfolio](${absoluteUrl(pathFor(lang, 'portfolio'))}): projects`);
  }
  lines.push('', '## Optional', '', `- [Full content](${SITE}/llms-full.txt): all pages in one markdown file`, `- Contact: ${site.email}`, '');
  return lines.join('\n');
}

export function buildLlmsFull({ content, available, site }: LlmsInput): string {
  return available
    .map((lang) => `<!-- ${LANG_NAMES[lang]} -->\n\n${buildMarkdown(content[lang]!, site)}`)
    .join('\n---\n\n');
}
