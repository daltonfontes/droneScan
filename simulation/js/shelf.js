import * as THREE from 'three';
import { Box } from './box.js';

let SHELF_AUTO_ID = 1;
let BARCODE_COUNTER = 1;
export function setBarcodeStart(n = 1) {
  BARCODE_COUNTER = n;
}
function nextBarcode() {
  const code = `BOX${String(BARCODE_COUNTER).padStart(3, '0')}`;
  BARCODE_COUNTER++;
  return code;
}

export class Shelf {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number[]} levelHeights
   * @param {number} boxesPerLevel
   * @param {number} scale
   */
  constructor(
    x, y, z,
    levelHeights = [0.8, 2.0, 3.2, 4.4],
    boxesPerLevel = 1,
    scale = 0.2,
    shelfId = null
  ) {
    // Dimensões base da estante (unidades Three)
    const THICK = 0.1;       // espessura tábua/estrutura
    const WIDTH = 2;         // largura interna
    const DEPTH = 1.2;       // profundidade externa
    const BOX_W = 0.8;
    const BOX_H = 0.8;
    const BOARD_CLEAR = 0.02;
    this.id = shelfId ?? SHELF_AUTO_ID++;

    // Escala as alturas
    const Hs = levelHeights.map(h => h * scale);
    const totalHeight = Math.max(...Hs) + THICK * 2;

    this.group = new THREE.Group();
    this.group.position.set(x, y, z);

    this.scanned = false;
    this.material = new THREE.MeshStandardMaterial({ color: 0x5555ff });

    // Estrutura lateral
    const sideGeom = new THREE.BoxGeometry(THICK, totalHeight, DEPTH);
    const leftSide = new THREE.Mesh(sideGeom, this.material);
    const rightSide = new THREE.Mesh(sideGeom, this.material);
    leftSide.position.set(-WIDTH / 2, totalHeight / 2, 0);
    rightSide.position.set(WIDTH / 2, totalHeight / 2, 0);
    this.group.add(leftSide, rightSide);

    // Fundo
    const backGeom = new THREE.BoxGeometry(WIDTH, totalHeight, THICK);
    const back = new THREE.Mesh(backGeom, this.material);
    back.position.set(0, totalHeight / 2, -DEPTH / 2 + THICK / 2);
    this.group.add(back);

    // Tábuas nos níveis
    const shelfGeom = new THREE.BoxGeometry(WIDTH - THICK * 2, THICK, DEPTH - THICK);
    Hs.forEach(h => {
      const shelfMesh = new THREE.Mesh(shelfGeom, this.material);
      shelfMesh.position.set(0, h, 0);
      this.group.add(shelfMesh);
    });

    // Caixas apoiadas nas tábuas
    this.boxes = [];
    Hs.forEach(h => {
      for (let j = 0; j < boxesPerLevel; j++) {
        const isOpen = Math.random() > 0.7;
        const barcode = nextBarcode();

        const xLocal = -WIDTH / 2 + (WIDTH / (boxesPerLevel + 1)) * (j + 1);
        const yLocal = h + THICK / 2 + BOX_H / 2 + BOARD_CLEAR;
        const zLocal = 0;

        // Box(x, y, z, barcode, isOpen)
        const box = new Box(xLocal, yLocal, zLocal, barcode, isOpen);
        const mesh = box.getMesh();

        mesh.userData = { barcode, isOpen, scanned: false };

        this.boxes.push(box);
        this.group.add(mesh);
      }
    });
  }

  getMesh() { return this.group; }
  getBoxes() { return this.boxes.map(b => b.getMesh()); }

  /**
   * Faz o scan de caixas ABERTAS por raio (distância 3D)
   * @param {THREE.Object3D} droneMesh
   * @param {{radius?: number}} opts
   */
  scan(droneMesh, opts = {}) {
    const SCAN_RADIUS = opts.radius ?? 1.6;

    this.boxes.forEach(box => {
      const mesh = box.getMesh();

      // posição de mundo da caixa
      const boxWorld = new THREE.Vector3();
      mesh.getWorldPosition(boxWorld);

      const dist = droneMesh.position.distanceTo(boxWorld);

      if (dist < SCAN_RADIUS && mesh.userData.isOpen && !mesh.userData.scanned) {
        mesh.userData.scanned = true;
        console.log(`Caixa ${mesh.userData.barcode} escaneada! (aberta)`);
        const detail = {
          barcode: mesh.userData.barcode,
          shelfId: this.id,
          isOpen: true,
          scannedAt: Date.now()
        };
        window.dispatchEvent(new CustomEvent('boxScanned', { detail }));
      }
    });

    if (!this.scanned && this.boxes.some(b => b.getMesh().userData.scanned)) {
      this.material.color.set(0x00aa00);
      this.scanned = true;
    }
  }
}
