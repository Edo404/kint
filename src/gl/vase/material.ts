import { CanvasTexture, DoubleSide, MeshMatcapMaterial, SRGBColorSpace, type DataTexture } from 'three';
import { SEAM_LEAD, SEAM_MAX, SEAM_SPAN } from './shardData';

export interface VaseUniforms {
  uP: { value: number };
  uTime: { value: number };
  uDrift: { value: number };
  uOpacity: { value: number };
  uShardData: { value: DataTexture | null };
  uQuality: { value: number }; // 1 = completo, 0 = leggero (dispositivi deboli)
}

export function createVaseUniforms(): VaseUniforms {
  return {
    uP: { value: 0 },
    uTime: { value: 0 },
    uDrift: { value: 1 },
    uOpacity: { value: 0.2 },
    uShardData: { value: null },
    uQuality: { value: 1 },
  };
}

interface MatcapOptions {
  base: string;
  light: string;
  dark: string;
  // Riflesso freddo di rimbalzo in basso, come luce riflessa dall'ambiente.
  bounce?: string;
  // Fasce chiare orizzontali, come un riflesso metallico.
  bands?: boolean;
  sheen?: boolean;
}

// Matcap generato a runtime: nessun file da scaricare. Sostituibile con una WebP.
function makeMatcap({ base, light, dark, bounce, bands, sheen }: MatcapOptions): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;

  const body = g.createRadialGradient(size * 0.38, size * 0.34, size * 0.02, size / 2, size / 2, size * 0.52);
  body.addColorStop(0, light);
  body.addColorStop(0.45, base);
  body.addColorStop(1, dark);
  g.fillStyle = body;
  g.fillRect(0, 0, size, size);

  if (bounce) {
    const b = g.createRadialGradient(size * 0.62, size * 0.92, size * 0.02, size * 0.62, size * 0.92, size * 0.42);
    b.addColorStop(0, bounce);
    b.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = b;
    g.fillRect(0, 0, size, size);
  }

  if (bands) {
    const v = g.createLinearGradient(0, 0, 0, size);
    v.addColorStop(0, 'rgba(255,240,190,0.0)');
    v.addColorStop(0.28, 'rgba(255,240,190,0.28)');
    v.addColorStop(0.42, 'rgba(60,40,10,0.30)');
    v.addColorStop(0.62, 'rgba(255,235,170,0.22)');
    v.addColorStop(1, 'rgba(40,25,5,0.25)');
    g.fillStyle = v;
    g.fillRect(0, 0, size, size);
  }

  if (sheen) {
    const spec = g.createRadialGradient(size * 0.34, size * 0.3, 0, size * 0.34, size * 0.3, size * 0.16);
    spec.addColorStop(0, 'rgba(255,250,230,0.95)');
    spec.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = spec;
    g.fillRect(0, 0, size, size);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const DITHER = /* glsl */ `
uniform float uOpacity;
// Rumore a gradiente interleaved: retinatura meno geometrica di una matrice di Bayer.
float bayer4(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
`;

const NOISE = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash11(float x) {
  return fract(sin(x * 91.3458) * 47453.5453);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.,0.,0.)), f.x), mix(hash13(i + vec3(0.,1.,0.)), hash13(i + vec3(1.,1.,0.)), f.x), f.y),
    mix(mix(hash13(i + vec3(0.,0.,1.)), hash13(i + vec3(1.,0.,1.)), f.x), mix(hash13(i + vec3(0.,1.,1.)), hash13(i + vec3(1.,1.,1.)), f.x), f.y),
    f.z);
}
`;

const ROTATE = /* glsl */ `
vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
`;

const f = (n: number) => n.toFixed(4);

// Parametri per frammento (texture N×3): riga 0 = centro.xyz + angolo, riga 1 = dispersione.xyz + inizio,
// riga 2 = asse.xyz + fine. Vedi shardData.ts.
function shardMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap, side: DoubleSide });
  m.customProgramCacheKey = () => 'vase-shards-v3';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aShard;
attribute float aKind;
uniform sampler2D uShardData;
uniform float uP;
uniform float uTime;
uniform float uDrift;
varying float vKind;
varying float vShardId;
varying vec3 vLocal;
${ROTATE}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `int sid = int(aShard + 0.5);
vec4 d0 = texelFetch(uShardData, ivec2(sid, 0), 0);
vec4 d1 = texelFetch(uShardData, ivec2(sid, 1), 0);
vec4 d2 = texelFetch(uShardData, ivec2(sid, 2), 0);
float e = smoothstep(d1.w, d2.w, uP);
vec3 axis = normalize(d2.xyz);
vec3 objectNormal = rotateAxis(normal, axis, d0.w * (1.0 - e));`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 drift = uDrift * 0.15 * vec3(
  sin(uTime * 0.30 + d0.y * 3.0),
  cos(uTime * 0.25 + d0.x * 3.0),
  sin(uTime * 0.20 + d0.z * 2.0));
vec3 transformed = rotateAxis(position - d0.xyz, axis, d0.w * (1.0 - e))
  + d0.xyz + (d1.xyz + drift) * (1.0 - e);
vKind = aKind;
vShardId = aShard;
vLocal = position;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${DITHER}
${NOISE}
uniform float uQuality;
varying float vKind;
varying float vShardId;
varying vec3 vLocal;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uOpacity < bayer4(gl_FragCoord.xy)) discard;`,
      )
      // Grana della superficie: piccola perturbazione della normale usata per il matcap.
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
float nBig = 0.65 * vnoise(vLocal * 3.0 + vShardId * 7.13) + 0.35 * vnoise(vLocal * 7.0 + 11.0);
float nFine = vnoise(vLocal * 14.0 + 3.7);
if (uQuality > 0.5) {
  normal = normalize(normal + (nFine - 0.5) * 0.10 * vec3(0.8, 0.6, 0.4));
}`,
      )
      // Colore dell'argilla: tinta per frammento, macchie chiare e scure, fasce di cottura.
      .replace(
        '#include <opaque_fragment>',
        `float h = hash11(vShardId);
float band = 0.5 + 0.5 * sin(vLocal.y * 7.0 + nBig * 4.0);
float lum = 0.72 + 0.55 * nBig + 0.16 * (h - 0.5) + 0.10 * (band - 0.5);
if (uQuality > 0.5) lum += 0.10 * (nFine - 0.5);
// Tre toni di argilla (ocra, ruggine, bruno caldo) distribuiti tra i frammenti.
vec3 ochre = vec3(1.10, 0.98, 0.78);
vec3 rust = vec3(1.02, 0.84, 0.76);
vec3 umber = vec3(0.95, 0.88, 0.82);
vec3 clay = (h < 0.34 ? mix(ochre, rust, h * 2.94) : (h < 0.67 ? mix(rust, umber, (h - 0.34) * 3.03) : mix(umber, ochre, (h - 0.67) * 3.03))) * lum;
float chalk = smoothstep(0.58, 0.85, nBig);
float soot = smoothstep(0.36, 0.12, nBig);
clay = mix(clay, clay * vec3(1.14, 1.08, 1.0) + 0.05, chalk * 0.75);
clay = mix(clay, clay * vec3(0.58, 0.52, 0.50), soot * 0.85);
if (vKind > 1.5) {
  clay = vec3(1.16, 0.98, 0.80) * (0.92 + 0.16 * nFine); // argilla cruda alla frattura
} else if (vKind > 0.5) {
  clay *= vec3(0.62, 0.52, 0.48); // interno più scuro
}
outgoingLight *= clay;
#include <opaque_fragment>`,
      );
  };
  return m;
}

// Le giunture stanno sul vaso assemblato e si "disegnano" lungo il percorso quando
// i due frammenti che uniscono sono vicini alla posizione finale.
function seamMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap, side: DoubleSide });
  m.customProgramCacheKey = () => 'vase-seams-v3';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aPair;
uniform sampler2D uShardData;
varying float vU;
varying float vV;
varying float vPairH;
varying vec2 vSeam;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
float pa = floor((aPair + 0.5) / 1024.0);
float pb = aPair - pa * 1024.0;
float endA = texelFetch(uShardData, ivec2(int(pa + 0.5), 2), 0).w;
float endB = texelFetch(uShardData, ivec2(int(pb + 0.5), 2), 0).w;
float seamStart = max(endA, endB) - ${f(SEAM_LEAD)};
vSeam = vec2(seamStart, min(${f(SEAM_MAX)}, seamStart + ${f(SEAM_SPAN)}));
vU = uv.x;
vV = uv.y;
vPairH = fract(aPair * 0.6180339);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${DITHER}
${NOISE}
uniform float uP;
uniform float uQuality;
varying float vU;
varying float vV;
varying float vPairH;
varying vec2 vSeam;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
float grow = clamp((uP - vSeam.x) / max(vSeam.y - vSeam.x, 0.0001), 0.0, 1.0);
if (grow <= 0.0 || vU > grow) discard;
if (uOpacity < bayer4(gl_FragCoord.xy)) discard;`,
      )
      // Oro vivo: variazione lungo la giuntura, bordi più scuri, centro più luminoso, qualche scintilla.
      .replace(
        '#include <opaque_fragment>',
        `float edge = abs(vV * 2.0 - 1.0);
float gn = vnoise(vec3(vU * 18.0, vPairH * 50.0, 1.7));
float shade = 0.82 + 0.34 * gn;
shade *= 1.0 - 0.38 * smoothstep(0.5, 1.0, edge);
shade *= 1.0 + 0.14 * (1.0 - edge);
if (uQuality > 0.5) {
  shade += 0.5 * pow(hash13(vec3(floor(vU * 90.0), vPairH * 100.0, 3.0)), 14.0);
}
outgoingLight *= vec3(1.0, 0.97, 0.88) * shade;
#include <opaque_fragment>`,
      );
  };
  return m;
}

export function createVaseMaterials(u: VaseUniforms) {
  const terracotta = makeMatcap({
    base: '#b5623a',
    light: '#e9a07a',
    dark: '#2b130c',
    bounce: 'rgba(120,110,125,0.32)',
  });
  const gold = makeMatcap({
    base: '#c9a24b',
    light: '#fff0b8',
    dark: '#3d2a0c',
    bands: true,
    sheen: true,
  });
  const shards = shardMaterial(u, terracotta);
  const seams = seamMaterial(u, gold);
  return {
    shards,
    seams,
    dispose() {
      shards.dispose();
      seams.dispose();
      terracotta.dispose();
      gold.dispose();
      u.uShardData.value?.dispose();
    },
  };
}
