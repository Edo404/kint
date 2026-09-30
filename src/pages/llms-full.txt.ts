import type { APIRoute } from 'astro';
import { loadAll, loadSite } from '../lib/content';
import { buildLlmsFull } from '../lib/seoFiles';

export const GET: APIRoute = () => {
  const { content, available } = loadAll();
  return new Response(buildLlmsFull({ content, available, site: loadSite() }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
