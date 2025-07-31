import { useRef } from 'react';
import * as THREE from 'three';

export function useBasicPhysics() {
  const carState = useRef({
    velocity: new THREE.Vector3(),
    acceleration: new THREE.Vector3(),
    maxSpeed: 0.5,
    friction: 0.02,
  });

  function updatePhysics(car: THREE.Object3D, controls: any) {
    // Aceleração
    const forward = controls.forward ? 1 : 0;
    const backward = controls.backward ? -1 : 0;
    const steerLeft = controls.left ? 1 : 0;
    const steerRight = controls.right ? -1 : 0;


    // Corrigir: ré deve ser negativa
    carState.current.acceleration.set(0, 0, (forward + backward) * 0.03);
    carState.current.velocity.add(carState.current.acceleration);
    carState.current.velocity.multiplyScalar(1 - carState.current.friction);
    if (carState.current.velocity.length() > carState.current.maxSpeed) {
      carState.current.velocity.setLength(carState.current.maxSpeed);
    }

    // Rotação
    if (steerLeft || steerRight) {
      // Inverter direção do giro se estiver de ré
      const direction = carState.current.velocity.z < 0 ? -1 : 1;
      car.rotation.y += (steerLeft + steerRight) * 0.04 * carState.current.velocity.length() * direction;
    }

    // Move carro
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion);
    car.position.add(direction.multiplyScalar(carState.current.velocity.z));
  }

  return { carState, updatePhysics };
}
