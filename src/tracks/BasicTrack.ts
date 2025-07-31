import * as THREE from 'three';

export function BasicTrack(): THREE.Object3D {
  const track = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(50, 50);
  const material = new THREE.MeshStandardMaterial({ color: 0x228822 });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  track.add(plane);
  return track;
}
