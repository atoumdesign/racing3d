import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export async function loadGLTFTrack(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      gltf => {
        const track = gltf.scene;
        resolve(track);
      },
      undefined,
      err => reject(err)
    );
  });
}

// Futuramente, loaders para outros formatos podem ser adicionados aqui (OBJ, FBX, etc)
