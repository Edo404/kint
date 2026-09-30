import type { APIRoute } from 'astro';
import { lastmodFor, loadAll } from '../lib/content';
import { buildEnv, portfolioPublished } from '../lib/flags';
import { alternatesFor, pathFor } from '../lib/i18n';
import { buildSitemap, type SitemapEntry } from '../lib/seoFiles';

export const GET: APIRoute = () => {
  const { available } = loadAll();
  const withPortfolio = portfolioPublished(buildEnv());
  const pages = ['', 'privacy', ...(withPortfolio ? ['portfolio'] : [])];
  const entries: SitemapEntry[] = available.flatMap((lang) =>
    pages.map((page) => ({
      path: pathFor(lang, page),
      lastmod: lastmodFor(lang),
      alternates: alternatesFor(available, page),
    })),
  );
  return new Response(buildSitemap(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
