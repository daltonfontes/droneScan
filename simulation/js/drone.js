import * as THREE from 'three';

export class Drone {
  constructor() {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(-20, 5, -5);

    this.mesh.lookAt(new THREE.Vector3(-20, 5, 0));
  }
  getMesh() { return this.mesh; }
}
