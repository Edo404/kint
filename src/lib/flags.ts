export type Env = Record<string, string | boolean | undefined>;

export const portfolioPublished = (env: Env): boolean => String(env.PORTFOLIO_PUBLISHED) === 'true';
export const noindex = (env: Env): boolean => String(env.NOINDEX) === 'true';

// Lettura dell'ambiente a build time (Node) con ripiego su import.meta.env.
export function buildEnv(): Env {
  return { ...(import.meta.env as Env), ...(process.env as Env) };
}
