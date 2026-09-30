export const MAX_PIXELS = 2560 * 1440;

export interface Env {
  width: number;
  height: number;
  dpr: number;
  cores: number;
  userAgent: string;
  search: string;
}

export interface Settings {
  isMobile: boolean;
  isRetina: boolean;
  cpuCoreCount: number;
  isSmallScreen: boolean;
  weak: boolean;
  debugP: number | null;
  forceHd: boolean;
  debugPerf: boolean;
}

export function readSettings(env: Env): Settings {
  const params = new URLSearchParams(env.search);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(env.userAgent);
  const rawP = params.get('p');
  const p = rawP === null ? NaN : Number(rawP);

  return {
    isMobile,
    isRetina: env.dpr >= 2,
    cpuCoreCount: env.cores,
    isSmallScreen: Math.min(env.width, env.height) <= 820,
    weak: env.cores <= 4 || isMobile,
    debugP: Number.isFinite(p) && p >= 0 && p <= 1 ? p : null,
    forceHd: params.get('USE_HD') === '1',
    debugPerf: params.get('perf') === '1',
  };
}

export function capPixelRatio(
  pr: number,
  width: number,
  height: number,
  maxPixels: number,
): number {
  const pixels = width * height * pr * pr;
  return pixels > maxPixels ? Math.sqrt(maxPixels / (width * height)) : pr;
}

export function browserEnv(): Env {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
    cores: navigator.hardwareConcurrency ?? 4,
    userAgent: navigator.userAgent,
    search: window.location.search,
  };
}
