import * as THREE from 'three';

export function UnoCar(): THREE.Object3D {
  const car = new THREE.Group();

  // Corpo quadrado (Fiat Uno)
  const bodyGeometry = new THREE.BoxGeometry(1.8, 0.7, 3.6);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.7;
  car.add(body);

  // Janelas
  const windowGeometry = new THREE.BoxGeometry(1.6, 0.4, 2.2);
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x99d9ea, transparent: true, opacity: 0.7 });
  const windows = new THREE.Mesh(windowGeometry, windowMaterial);
  windows.position.set(0, 1.1, 0);
  car.add(windows);

  // Rodas
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i * 0.75, 0.2, j * 1.2);
      car.add(wheel);
    }
  }

  car.name = 'Fiat Uno';
  return car;
}
