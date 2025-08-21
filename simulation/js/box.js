import * as THREE from 'three';

export class Box {
  constructor(x, y, z, barcode, isOpen = false) {
    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);

    const material = new THREE.MeshStandardMaterial({
      color: 0xd2b48c, // cor bege para simular caixa de papelão
      transparent: isOpen,
      opacity: isOpen ? 0.6 : 1
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);

    // Dados extras no mesh
    this.mesh.userData = {
      barcode: barcode,
      isOpen: isOpen,
      scanned: false
    };
  }

  getMesh() {
    return this.mesh;
  }
}
