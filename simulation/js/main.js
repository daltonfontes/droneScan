import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Drone } from './drone.js';
import { createScene } from './scene.js';
import { Shelf, setBarcodeStart } from './shelf.js';

const scene = createScene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(40, 20, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const FRONT_OFFSET = 1.5;
const drone = new Drone();
drone.getMesh().position.set(-20, 5, FRONT_OFFSET);
scene.add(drone.getMesh());

const levelHeights = [0.5, 6, 10, 15, 20, 30, 50, 11.44];
const shelves = [];
setBarcodeStart(1);
for (let i = 0; i < 8; i++) {
  const shelf = new Shelf(i * 4 - 14, 0, 0, levelHeights, 1);
  scene.add(shelf.getMesh());
  shelves.push(shelf);
}

const waypoints = [];
let currentWaypoint = 0;

const tmp = new THREE.Vector3();
shelves.forEach(shelf => {
  shelf.getBoxes().forEach(boxMesh => {
    boxMesh.getWorldPosition(tmp);
    waypoints.push({
      x: tmp.x,
      y: tmp.y,
      z: tmp.z + FRONT_OFFSET
    });
  });
});

const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  console.log('[DashWS] connected');
  ws.send(JSON.stringify({ type: 'hello', role: 'sim' }));
  ws.send(JSON.stringify({
    type: 'reset',
    reason: 'sim_restart',
    ts: Date.now()
  }));
};

window.addEventListener('boxScanned', (e) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'scan', payload: e.detail }));
  }
});

ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'waypoint') {
      waypoints.push({ x: msg.x, y: msg.y, z: msg.z });
      console.log('Waypoint recebido do hub:', msg);
    }
  } catch { }
};

const speed = 0.03;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const droneMesh = drone.getMesh();
  const time = clock.getElapsedTime();

  if (currentWaypoint < waypoints.length) {
    const target = waypoints[currentWaypoint];
    droneMesh.position.x += (target.x - droneMesh.position.x) * speed;
    droneMesh.position.y += (target.y - droneMesh.position.y) * speed;
    droneMesh.position.z += (target.z - droneMesh.position.z) * speed;

    droneMesh.lookAt(new THREE.Vector3(target.x, target.y, target.z));

    if (
      Math.abs(droneMesh.position.x - target.x) < 0.05 &&
      Math.abs(droneMesh.position.y - target.y) < 0.05 &&
      Math.abs(droneMesh.position.z - target.z) < 0.05
    ) {
      currentWaypoint++;
    }
  }

  if (droneMesh.position.y < 0.5) droneMesh.position.y = 0.5;

  shelves.forEach(shelf => shelf.scan(droneMesh));

  droneMesh.position.y += Math.sin(time * 2) * 0.005;

  renderer.render(scene, camera);
}
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(20, 30, 10);
dirLight.castShadow = true;
scene.add(dirLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
