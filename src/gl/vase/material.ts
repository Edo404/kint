import { CanvasTexture, DoubleSide, MeshMatcapMaterial, SRGBColorSpace } from 'three';

export interface VaseUniforms {
  uP: { value: number };
  uTime: { value: number };
  uDrift: { value: number };
  uOpacity: { value: number };
}

export function createVaseUniforms(): VaseUniforms {
  return {
    uP: { value: 0 },
    uTime: { value: 0 },
    uDrift: { value: 1 },
    uOpacity: { value: 0.2 },
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
float bayer4(vec2 p) {
  ivec2 i = ivec2(mod(p, 4.0));
  int idx = i.x + i.y * 4;
  float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return (m[idx] + 0.5) / 16.0;
}
`;

const ROTATE = /* glsl */ `
vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
`;

function shardMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap });
  m.customProgramCacheKey = () => 'vase-shards';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute vec3 aCenter;
attribute vec3 aScatterPos;
attribute vec3 aScatterAxis;
attribute float aScatterAngle;
attribute float aStart;
attribute float aEnd;
uniform float uP;
uniform float uTime;
uniform float uDrift;
${ROTATE}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `float e = smoothstep(aStart, aEnd, uP);
vec3 axis = normalize(aScatterAxis);
vec3 objectNormal = rotateAxis(normal, axis, aScatterAngle * (1.0 - e));`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 drift = uDrift * 0.15 * vec3(
  sin(uTime * 0.30 + aCenter.y * 3.0),
  cos(uTime * 0.25 + aCenter.x * 3.0),
  sin(uTime * 0.20 + aCenter.z * 2.0));
vec3 transformed = rotateAxis(position - aCenter, axis, aScatterAngle * (1.0 - e))
  + aCenter + (aScatterPos + drift) * (1.0 - e);`,
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

function seamMaterial(u: VaseUniforms, matcap: CanvasTexture): MeshMatcapMaterial {
  const m = new MeshMatcapMaterial({ matcap, side: DoubleSide });
  m.customProgramCacheKey = () => 'vase-seams';
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aSeamStart;
attribute float aSeamEnd;
varying float vU;
varying vec2 vSeam;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vU = uv.x;
vSeam = vec2(aSeamStart, aSeamEnd);`,
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
    },
  };
}
