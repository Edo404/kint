import type { APIRoute } from 'astro';
import { loadAll, loadSite } from '../lib/content';
import { buildEnv, portfolioPublished } from '../lib/flags';
import { buildLlmsTxt } from '../lib/seoFiles';

export const GET: APIRoute = () => {
  const { content, available } = loadAll();
  const body = buildLlmsTxt({ content, available, site: loadSite(), portfolio: portfolioPublished(buildEnv()) });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
