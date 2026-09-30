import type { Project } from './content.types';
import type { Lang } from './i18n';

export const publishable = (projects: Project[]): Project[] => projects.filter((p) => p.publication_allowed === true);

export function portfolioPaths(published: boolean, available: Lang[], projects: Project[]) {
  if (!published) return [];
  if (publishable(projects).length === 0) {
    throw new Error('PORTFOLIO_PUBLISHED=true richiede almeno un progetto con publication_allowed: true');
  }
  return available.map((lang) => ({ params: { lang } }));
}
