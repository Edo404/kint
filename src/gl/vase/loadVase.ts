import { DataTexture, FloatType, NearestFilter, RGBAFormat } from 'three';
import type { BufferAttribute, BufferGeometry, Group, Material, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { VaseUniforms } from './material';
import { makeShardParams, packShardTexture, shardCentersFromGeometry } from './shardData';

function rename(geometry: BufferGeometry, from: string, to: string): BufferAttribute | undefined {
  const attr = geometry.getAttribute(from) as BufferAttribute | undefined;
  if (attr) {
    geometry.setAttribute(to, attr);
    geometry.deleteAttribute(from);
  }
  return attr;
}

export function loadVase(
  url: string,
  materials: { shards: Material; seams: Material },
  uniforms: VaseUniforms,
): Promise<Group> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const found = { shards: false, seams: false };
        gltf.scene.traverse((obj) => {
          const mesh = obj as Mesh;
          if (!mesh.isMesh) return;
          if (mesh.name === 'shards') {
            const ids = rename(mesh.geometry, '_shard', 'aShard');
            if (!ids) return;
            // Gli attributi possono essere interleaved: si legge con getX(), non con .array.
            const position = mesh.geometry.getAttribute('position');
            const n = ids.count;
            const idArray = new Float32Array(n);
            const posArray = new Float32Array(3 * n);
            let count = 0;
            for (let i = 0; i < n; i++) {
              const id = ids.getX(i);
              idArray[i] = id;
              if (id + 1 > count) count = id + 1;
              posArray[3 * i] = position.getX(i);
              posArray[3 * i + 1] = position.getY(i);
              posArray[3 * i + 2] = position.getZ(i);
            }
            const centers = shardCentersFromGeometry(posArray, idArray, count);
            const texture = new DataTexture(packShardTexture(makeShardParams(centers)), count, 3, RGBAFormat, FloatType);
            texture.minFilter = texture.magFilter = NearestFilter;
            texture.needsUpdate = true;
            uniforms.uShardData.value = texture;
            mesh.material = materials.shards;
            mesh.frustumCulled = false; // gli shader spostano i vertici fuori dal bounding box
            found.shards = true;
          } else if (mesh.name === 'seams') {
            rename(mesh.geometry, '_pair', 'aPair');
            mesh.material = materials.seams;
            mesh.frustumCulled = false;
            found.seams = true;
          }
        });
        if (!found.shards || !found.seams) {
          reject(new Error('il modello non contiene i nodi "shards" e "seams" con i loro attributi'));
          return;
        }
        resolve(gltf.scene);
      },
      undefined,
      reject,
    );
  });
}
