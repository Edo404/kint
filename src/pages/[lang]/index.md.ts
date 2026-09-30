import type { APIRoute } from 'astro';
import { loadAll, loadSite } from '../../lib/content';
import type { Lang } from '../../lib/i18n';
import { buildMarkdown } from '../../lib/seoFiles';

export function getStaticPaths() {
  return loadAll().available.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = ({ params }) => {
  const c = loadAll().content[params.lang as Lang]!;
  return new Response(buildMarkdown(c, loadSite()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
