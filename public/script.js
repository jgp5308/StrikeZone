import * as THREE from "/node_modules/three/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101827);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 2.1, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x24324a, 2));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(4, 10, 6);
keyLight.castShadow = true;
scene.add(keyLight);

const BOARD_COUNT = 39;
const LANE_WIDTH = 4;
const BOARD_WIDTH = LANE_WIDTH / BOARD_COUNT;

const lane = new THREE.Mesh(
  new THREE.BoxGeometry(LANE_WIDTH, 0.2, 36),
  new THREE.MeshStandardMaterial({ color: 0xc68b52, roughness: 0.45 })
);
lane.position.set(0, 0, -10);
lane.receiveShadow = true;
scene.add(lane);

const boardLineMaterial = new THREE.MeshStandardMaterial({
  color: 0x9b673d,
  roughness: 0.8,
});

for (let boardBoundary = 1; boardBoundary < BOARD_COUNT; boardBoundary += 1) {
  const boardLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.012, 35.8),
    boardLineMaterial
  );
  boardLine.position.set(
    -LANE_WIDTH / 2 + boardBoundary * BOARD_WIDTH,
    0.108,
    -10
  );
  scene.add(boardLine);
}

function boardCenter(boardNumber) {
  return (boardNumber - (BOARD_COUNT + 1) / 2) * BOARD_WIDTH;
}

const targetBoardNumbers = [5, 10, 15, 20, 25, 30, 35];
const arrowMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3e5bd,
  roughness: 0.5,
  side: THREE.DoubleSide,
});

function addTargetArrow(boardNumber) {
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.14, 0.16);
  arrowShape.lineTo(0.14, 0.16);
  arrowShape.lineTo(0, -0.2);
  arrowShape.closePath();

  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), arrowMaterial);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(boardCenter(boardNumber), 0.12, -8.5);
  scene.add(arrow);
}

function addApproachDot(boardNumber) {
  const dot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.018, 20),
    arrowMaterial
  );
  dot.position.set(boardCenter(boardNumber), 0.12, 5.9);
  dot.rotation.x = Math.PI / 2;
  scene.add(dot);
}

for (const boardNumber of targetBoardNumbers) {
  addTargetArrow(boardNumber);
  addApproachDot(boardNumber);
}

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(30, 0.2, 50),
  new THREE.MeshStandardMaterial({ color: 0x202b3c, roughness: 0.8 })
);
floor.position.set(0, -0.2, -8);
floor.receiveShadow = true;
scene.add(floor);

const gutterMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
for (const x of [-(LANE_WIDTH / 2 + 0.225), LANE_WIDTH / 2 + 0.225]) {
  const gutter = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 36), gutterMaterial);
  gutter.position.set(x, 0, -10);
  gutter.receiveShadow = true;
  scene.add(gutter);
}

function createPin(x, z) {
  const pin = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 0.9, 24),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.35 })
  );
  body.position.y = 0.55;
  body.castShadow = true;
  pin.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.15, 0.25, 24),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5 })
  );
  neck.position.y = 1.1;
  neck.castShadow = true;
  pin.add(neck);

  pin.position.set(x, 0, z);
  scene.add(pin);
}

for (let row = 0; row < 4; row += 1) {
  for (let column = 0; column <= row; column += 1) {
    createPin((column - row / 2) * 0.55, -24 - row * 0.6);
  }
}

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 32, 20),
  new THREE.MeshStandardMaterial({ color: 0x2864d7, roughness: 0.25, metalness: 0.2 })
);
ball.position.set(0, 0.45, 5.5);
ball.castShadow = true;
scene.add(ball);

let yaw = 0;
let pitch = -0.08;
let isLooking = false;

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  isLooking = document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", (event) => {
  if (!isLooking) return;
  yaw -= event.movementX * 0.002;
  pitch -= event.movementY * 0.002;
  pitch = THREE.MathUtils.clamp(pitch, -0.8, 0.5);
});

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);

function animate() {
  requestAnimationFrame(animate);
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  renderer.render(scene, camera);
}

animate();
