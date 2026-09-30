import type { BufferAttribute, BufferGeometry, Group, Material, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const RENAMES: Record<string, string> = {
  _center: 'aCenter',
  _scatter_pos: 'aScatterPos',
  _scatter_axis: 'aScatterAxis',
  _scatter_angle: 'aScatterAngle',
  _start: 'aStart',
  _end: 'aEnd',
  _seam_start: 'aSeamStart',
  _seam_end: 'aSeamEnd',
};

function renameAttributes(geometry: BufferGeometry): void {
  for (const [from, to] of Object.entries(RENAMES)) {
    const attr = geometry.getAttribute(from) as BufferAttribute | undefined;
    if (attr) {
      geometry.setAttribute(to, attr);
      geometry.deleteAttribute(from);
    }
  }
}

export function loadVase(
  url: string,
  materials: { shards: Material; seams: Material },
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
          if (mesh.name === 'shards' || mesh.name === 'seams') {
            renameAttributes(mesh.geometry);
            mesh.material = materials[mesh.name];
            mesh.frustumCulled = false; // gli shader spostano i vertici fuori dal bounding box
            found[mesh.name] = true;
          }
        });
        if (!found.shards || !found.seams) {
          reject(new Error('il modello non contiene i nodi "shards" e "seams"'));
          return;
        }
        resolve(gltf.scene);
      },
      undefined,
      reject,
    );
  });
}
