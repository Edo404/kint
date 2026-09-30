import type { APIRoute } from 'astro';
import { buildEnv, noindex } from '../lib/flags';
import { buildRobots } from '../lib/seoFiles';

export const GET: APIRoute = () =>
  new Response(buildRobots({ noindex: noindex(buildEnv()) }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
