import * as THREE from 'three';

export function TaxiCar(): THREE.Object3D {
  const car = new THREE.Group();

  // Corpo amarelo
  const bodyGeometry = new THREE.BoxGeometry(2, 0.6, 4.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffe600 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  car.add(body);

  // Faixa preta
  const stripeGeometry = new THREE.BoxGeometry(2, 0.1, 4.2);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  stripe.position.y = 0.85;
  car.add(stripe);

  // Rodas
  const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(i * 0.9, 0.25, j * 1.5);
      car.add(wheel);
    }
  }

  // Letreiro
  const signGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.4);
  const signMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(0, 1.1, 0);
  car.add(sign);

  car.name = 'Taxi';
  return car;
}
