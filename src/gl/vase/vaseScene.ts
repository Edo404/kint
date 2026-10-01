import { MathUtils, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { PerfGovernor, buildPixelRatioLevels } from '../governor';
import { PerfMeter, createPerfOverlay } from '../perf';
import { RenderScheduler } from '../renderScheduler';
import { needsResize, type Size } from '../viewport';
import { MAX_PIXELS, browserEnv, capPixelRatio, readSettings } from '../settings';
import { loadVase } from './loadVase';
import { anchorFor, opacityAt, scrollProgress } from './math';
import { createVaseMaterials, createVaseUniforms } from './material';

export interface MountOptions {
  opening: Element;
  url: string;
  reducedMotion: boolean;
  onFail: () => void;
}

export async function mountVase(
  canvas: HTMLCanvasElement,
  { opening, url, reducedMotion, onFail }: MountOptions,
): Promise<{ destroy(): void }> {
  const settings = readSettings(browserEnv());
  const levels = buildPixelRatioLevels(window.devicePixelRatio, settings.weak);
  const maxPixels = settings.forceHd ? Infinity : MAX_PIXELS;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.error(err);
    onFail();
    return { destroy() {} };
  }
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;

  const uniforms = createVaseUniforms();
  uniforms.uDrift.value = reducedMotion ? 0 : 1;
  uniforms.uQuality.value = settings.weak ? 0 : 1;
  const materials = createVaseMaterials(uniforms);

  const governor = new PerfGovernor({
    levels,
    onChange: () => {
      applySize(true);
      scheduler.request();
    },
  });

  // Altezza "grande" della finestra (barra di Safari nascosta), letta da un elemento alto 100lvh:
  // il canvas ha la stessa altezza in CSS, quindi non cambia quando la barra entra o esce.
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const viewport = (): Size => ({ w: window.innerWidth, h: probe.offsetHeight || window.innerHeight });

  let size: Size | null = null;
  function applySize(force = false): void {
    const next = viewport();
    if (!force && !needsResize(size, next)) return;
    size = next;
    renderer.setPixelRatio(capPixelRatio(governor.pixelRatio, next.w, next.h, maxPixels));
    renderer.setSize(next.w, next.h, false);
    camera.aspect = next.w / next.h;
    camera.updateProjectionMatrix();
  }

  let vase: Awaited<ReturnType<typeof loadVase>>;
  try {
    vase = await loadVase(url, materials, uniforms);
  } catch (err) {
    console.error(err);
    materials.dispose();
    renderer.dispose();
    onFail();
    return { destroy() {} };
  }
  vase.rotation.x = 0.1;
  scene.add(vase);

  const showPerf = settings.debugPerf ? createPerfOverlay() : null;
  const meter = new PerfMeter();

  const scheduler = new RenderScheduler(
    (dt) => {
      // Nel ciclo a 30 fps il dt è voluto: non è un segnale di lentezza.
      if (!scheduler.looping) governor.tick(dt);
      const { w, h } = size ?? viewport();
      const p =
        settings.debugP ??
        scrollProgress(window.scrollY, document.documentElement.scrollHeight, h);
      const a = anchorFor(w, h, p);
      const halfW = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;

      uniforms.uP.value = p;
      uniforms.uTime.value = performance.now() / 1000;
      uniforms.uOpacity.value = opacityAt(p) * a.opacityMul;
      vase.position.x = a.x * halfW;
      vase.position.y = a.y;
      vase.scale.setScalar(a.scale);
      renderer.render(scene, camera);
      if (showPerf) {
        meter.push(dt);
        showPerf({
          fps: meter.fps,
          frameMs: meter.frameMs,
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          pixelRatio: renderer.getPixelRatio(),
          width: w,
          height: h,
          looping: scheduler.looping,
        });
      }
    },
    (cb) => requestAnimationFrame(cb),
    (id) => cancelAnimationFrame(id),
    () => document.hidden,
  );

  const request = () => scheduler.request();
  const onResize = () => {
    const before = size;
    applySize();
    if (size !== before) scheduler.request();
  };
  const onVisibility = () => {
    if (!document.hidden) scheduler.request();
  };
  const onLost = (e: Event) => e.preventDefault();

  applySize();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', request);

  // Deriva dei frammenti: frame continui (30 fps) solo con l'apertura visibile.
  const io = new IntersectionObserver(([entry]) => {
    if (reducedMotion) return;
    if (entry.isIntersecting) scheduler.startLoop(30);
    else scheduler.stopLoop();
  });
  io.observe(opening);

  scheduler.request();

  return {
    destroy() {
      io.disconnect();
      scheduler.stop();
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', onResize);
      probe.remove();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', request);
      materials.dispose();
      renderer.dispose();
    },
  };
}
