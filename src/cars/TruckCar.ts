import * as THREE from 'three';

export function TruckCar(): THREE.Object3D {
  const car = new THREE.Group();

  // Cabine
  const cabGeometry = new THREE.BoxGeometry(2, 0.8, 2.2);
  const cabMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const cab = new THREE.Mesh(cabGeometry, cabMaterial);
  cab.position.set(0, 0.7, -1.2);
  car.add(cab);

  // Baú
  const boxGeometry = new THREE.BoxGeometry(2, 1, 3.5);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, 0.9, 1.1);
  car.add(box);

  // Rodas
  const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i * 0.95, 0.25, j * 2.1);
      car.add(wheel);
    }
  }

  car.name = 'Caminhão';
  return car;
}
