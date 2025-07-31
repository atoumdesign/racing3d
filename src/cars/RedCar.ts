import * as THREE from 'three';

export function RedCar(): THREE.Object3D {
  const car = new THREE.Group();

  // Corpo vermelho
  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  car.add(body);

  // Rodas
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i * 0.9, 0.2, j * 1.5);
      car.add(wheel);
    }
  }

  return car;
}
