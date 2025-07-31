import * as THREE from 'three';

export function SportCar(): THREE.Object3D {
  const car = new THREE.Group();

  // Corpo baixo e largo
  const bodyGeometry = new THREE.BoxGeometry(2.4, 0.4, 4.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff2222 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.4;
  car.add(body);

  // Capô
  const hoodGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
  const hoodMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
  hood.position.set(0, 0.6, 1.5);
  car.add(hood);

  // Rodas
  const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i * 1.1, 0.2, j * 1.7);
      car.add(wheel);
    }
  }

  car.name = 'Esportivo';
  return car;
}
