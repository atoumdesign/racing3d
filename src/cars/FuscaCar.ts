import * as THREE from 'three';

export function FuscaCar(): THREE.Object3D {
  const car = new THREE.Group();

  // Corpo arredondado (fusca)
  const bodyGeometry = new THREE.CapsuleGeometry(1, 2, 8, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.1;
  car.add(body);

  // Rodas
  const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i * 0.85, 0.3, j * 1.1);
      car.add(wheel);
    }
  }

  // Detalhe do vidro
  const glassGeometry = new THREE.CapsuleGeometry(0.7, 0.7, 8, 16);
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x99d9ea, transparent: true, opacity: 0.7 });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.set(0, 1.5, 0);
  car.add(glass);

  car.name = 'Fusca';
  return car;
}
