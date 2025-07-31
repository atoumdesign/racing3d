import { useRef, useMemo } from 'react';
import * as THREE from 'three';

export type CameraType = 'traseira' | 'frontal' | 'cinematica' | 'topo';


export function useFollowCamera(targetRef: React.RefObject<THREE.Object3D>, cameraType: CameraType) {
  // Garante que a instância da câmera é única por componente
  const camera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cam.position.set(0, 5, -10);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  // Ref para sempre acessar o cameraType mais recente
  const cameraTypeRef = useRef(cameraType);
  cameraTypeRef.current = cameraType;

  function updateCamera(cam: THREE.PerspectiveCamera, target: THREE.Object3D) {
    let offset;
    switch (cameraTypeRef.current) {
      case 'frontal':
        // Posição na frente do carro, olhando para frente
        offset = new THREE.Vector3(0, 2, 5).applyQuaternion(target.quaternion);
        cam.position.copy(target.position.clone().add(offset));
        // Olhar para um ponto à frente do carro
        const lookAtFront = new THREE.Vector3(0, 2, 15).applyQuaternion(target.quaternion).add(target.position);
        cam.lookAt(lookAtFront);
        break;
      case 'cinematica':
        offset = new THREE.Vector3(0, 8, -18).applyQuaternion(target.quaternion); // Mais alto e atrás
        cam.position.copy(target.position.clone().add(offset));
        cam.lookAt(target.position);
        break;
      case 'topo':
        offset = new THREE.Vector3(0, 25, 0); // Topo
        cam.position.copy(target.position.clone().add(offset));
        cam.lookAt(target.position);
        break;
      case 'traseira':
      default:
        offset = new THREE.Vector3(0, 5, -10).applyQuaternion(target.quaternion); // Atrás padrão
        cam.position.copy(target.position.clone().add(offset));
        cam.lookAt(target.position);
        break;
    }
  }

  return { camera, updateCamera };
}
