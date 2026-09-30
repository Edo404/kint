import { hasWebGL, setMode } from './support';

export function boot(): void {
  const root = document.documentElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
  const opening = document.getElementById('opening');
  if (!canvas || !opening) return;

  if (!hasWebGL()) {
    setMode(root, 'fallback');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = () =>
    import('./vase/vaseScene').then((m) =>
      m.mountVase(canvas, {
        opening,
        url: `${import.meta.env.BASE_URL}models/vase.glb`,
        reducedMotion,
        onFail: () => setMode(root, 'fallback'),
      }),
    );

  // Il contenuto non dipende dal 3D: si carica a riposo.
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => void start());
  else setTimeout(() => void start(), 200);
}
