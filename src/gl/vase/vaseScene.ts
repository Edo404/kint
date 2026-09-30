import { MathUtils, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { PerfGovernor, buildPixelRatioLevels } from '../governor';
import { PerfMeter, createPerfOverlay } from '../perf';
import { RenderScheduler } from '../renderScheduler';
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
      applySize();
      scheduler.request();
    },
  });

  function applySize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(capPixelRatio(governor.pixelRatio, w, h, maxPixels));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
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
      const w = window.innerWidth;
      const h = window.innerHeight;
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
    applySize();
    scheduler.request();
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
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', request);
      materials.dispose();
      renderer.dispose();
    },
  };
}
