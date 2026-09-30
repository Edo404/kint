import { CanvasTexture, DoubleSide, MeshMatcapMaterial, SRGBColorSpace, type DataTexture } from 'three';
import { SEAM_LEAD, SEAM_MAX, SEAM_SPAN } from './shardData';

export interface VaseUniforms {
  uP: { value: number };
  uTime: { value: number };
  uDrift: { value: number };
  uOpacity: { value: number };
  uShardData: { value: DataTexture | null };
}

export function createVaseUniforms(): VaseUniforms {
  return {
    uP: { value: 0 },
    uTime: { value: 0 },
    uDrift: { value: 1 },
    uOpacity: { value: 0.2 },
    uShardData: { value: null },
  };
}

// Matcap generato a runtime: nessun file da scaricare. Sostituibile con una WebP.
function makeMatcap(base: string, light: string, dark: string, sheen: boolean): CanvasTexture {
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
  m.customProgramCacheKey = () => 'vase-shards-v2';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aShard;
uniform sampler2D uShardData;
uniform float uP;
uniform float uTime;
uniform float uDrift;
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
  + d0.xyz + (d1.xyz + drift) * (1.0 - e);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${DITHER}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uOpacity < bayer4(gl_FragCoord.xy)) discard;`,
      );
  };
  return m;
}

// Le giunture stanno sul vaso assemblato e si "disegnano" lungo il percorso quando
// i due frammenti che uniscono sono vicini alla posizione finale.
function seamMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap, side: DoubleSide });
  m.customProgramCacheKey = () => 'vase-seams-v2';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aPair;
uniform sampler2D uShardData;
varying float vU;
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
vU = uv.x;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${DITHER}
uniform float uP;
varying float vU;
varying vec2 vSeam;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
float grow = clamp((uP - vSeam.x) / max(vSeam.y - vSeam.x, 0.0001), 0.0, 1.0);
if (grow <= 0.0 || vU > grow) discard;
if (uOpacity < bayer4(gl_FragCoord.xy)) discard;`,
      );
  };
  return m;
}

export function createVaseMaterials(u: VaseUniforms) {
  const terracotta = makeMatcap('#b5623a', '#e0956a', '#3a1a10', false);
  const gold = makeMatcap('#c9a24b', '#f6e2a0', '#4a3512', true);
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
