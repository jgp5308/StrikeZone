import * as THREE from "/node_modules/three/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101827);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 0, 8);

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
const LANE_LENGTH_FEET = 60;
const LANE_LENGTH_WORLD = 36;
const WORLD_UNITS_PER_FOOT = LANE_LENGTH_WORLD / LANE_LENGTH_FEET;
const BOARD_WIDTH_INCHES = 1.06;
const LANE_WIDTH_FEET = (BOARD_COUNT * BOARD_WIDTH_INCHES) / 12;
const LANE_WIDTH = LANE_WIDTH_FEET * WORLD_UNITS_PER_FOOT;
const BOARD_WIDTH = LANE_WIDTH / BOARD_COUNT;
const LANE_FRONT_Z = 8;
const LANE_SURFACE_Y = 0.1;
const PLAYER_VIEW_HEIGHT_FEET = 4;
const PLAYER_HEIGHT_WORLD = PLAYER_VIEW_HEIGHT_FEET * WORLD_UNITS_PER_FOOT;
camera.position.y = PLAYER_HEIGHT_WORLD;
const PIN_HEIGHT_INCHES = 15;
const PIN_REFERENCE_HEIGHT = 1.66;
const PIN_HEIGHT_WORLD = (PIN_HEIGHT_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const BALL_DIAMETER_INCHES = 8.59;
const BALL_DIAMETER_WORLD = (BALL_DIAMETER_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const BALL_RADIUS_WORLD = BALL_DIAMETER_WORLD / 2;

const lane = new THREE.Mesh(
  new THREE.BoxGeometry(LANE_WIDTH, 0.2, LANE_LENGTH_WORLD),
  new THREE.MeshStandardMaterial({ color: 0xc68b52, roughness: 0.45 })
);
lane.position.set(0, 0, LANE_FRONT_Z - LANE_LENGTH_WORLD / 2);
lane.receiveShadow = true;
scene.add(lane);

const foulLine = new THREE.Mesh(
  new THREE.BoxGeometry(LANE_WIDTH + 0.02, 0.004, 0.05),
  new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.35 })
);
foulLine.position.set(0, LANE_SURFACE_Y - 0.002, LANE_FRONT_Z);
foulLine.receiveShadow = true;
scene.add(foulLine);

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
    lane.position.z
  );
  scene.add(boardLine);
}

function boardCenter(boardNumber) {
  return (boardNumber - (BOARD_COUNT + 1) / 2) * BOARD_WIDTH;
}

const darkBrownMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b2618,
  roughness: 0.75,
});
const brownSectionLengthFeet = 3;

function addBrownSections(boardNumbers, startFeet) {
  const sectionCenterZ =
    LANE_FRONT_Z - (startFeet + brownSectionLengthFeet / 2) * WORLD_UNITS_PER_FOOT;

  for (const boardNumber of boardNumbers) {
    const brownSection = new THREE.Mesh(
      new THREE.BoxGeometry(
        BOARD_WIDTH * 0.96,
        0.018,
        brownSectionLengthFeet * WORLD_UNITS_PER_FOOT
      ),
      darkBrownMaterial
    );
    brownSection.position.set(boardCenter(boardNumber), 0.12, sectionCenterZ);
    brownSection.receiveShadow = true;
    scene.add(brownSection);
  }
}

addBrownSections([15, 25], 34);
addBrownSections([10, 30], 40);

const targetBoardNumbers = [5, 10, 15, 20, 25, 30, 35];
const arrowDistancesFeet = [12, 13 + 1 / 3, 14 + 2 / 3, 16, 14 + 2 / 3, 13 + 1 / 3, 12];
const arrowMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3e5bd,
  roughness: 0.5,
  side: THREE.DoubleSide,
});

function addTargetArrow(boardNumber, distanceFeet) {
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.1, -0.16);
  arrowShape.lineTo(0.1, -0.16);
  arrowShape.lineTo(0, 0.2);
  arrowShape.closePath();

  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), arrowMaterial);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(
    boardCenter(boardNumber),
    0.12,
    LANE_FRONT_Z - distanceFeet * WORLD_UNITS_PER_FOOT
  );
  scene.add(arrow);
}
for (let arrowIndex = 0; arrowIndex < targetBoardNumbers.length; arrowIndex += 1) {
  addTargetArrow(targetBoardNumbers[arrowIndex], arrowDistancesFeet[arrowIndex]);
}

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(30, 0.2, 50),
  new THREE.MeshStandardMaterial({ color: 0x202b3c, roughness: 0.8 })
);
floor.position.set(0, -0.2, -8);
floor.receiveShadow = true;
scene.add(floor);

const gutterMaterial = new THREE.MeshStandardMaterial({
  color: 0x050505,
  roughness: 0.2,
  metalness: 0.15,
  side: THREE.DoubleSide,
});
const GUTTER_WIDTH_INCHES = 9.25;
const GUTTER_WIDTH_WORLD = (GUTTER_WIDTH_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const GUTTER_START_DROP_INCHES = 0.5;
const GUTTER_MAX_DROP_INCHES = 3.5;

const gutterCrossSectionSegments = 24;
const gutterLengthSegments = 1;
function createGutter(side) {
  const gutterPositions = [];
  const gutterIndices = [];
  const gutterInnerEdgeX = side * (LANE_WIDTH / 2);

  for (let lengthIndex = 0; lengthIndex <= gutterLengthSegments; lengthIndex += 1) {
    const z =
      lane.position.z - LANE_LENGTH_WORLD / 2 +
      (lengthIndex / gutterLengthSegments) * LANE_LENGTH_WORLD;

    for (
      let crossSectionIndex = 0;
      crossSectionIndex <= gutterCrossSectionSegments;
      crossSectionIndex += 1
    ) {
      const across = crossSectionIndex / gutterCrossSectionSegments;
      const depthInches =
        GUTTER_START_DROP_INCHES +
        (GUTTER_MAX_DROP_INCHES - GUTTER_START_DROP_INCHES) *
          Math.sin(Math.PI * across);
      const x = gutterInnerEdgeX + side * across * GUTTER_WIDTH_WORLD;
      const y = LANE_SURFACE_Y - (depthInches / 12) * WORLD_UNITS_PER_FOOT;
      gutterPositions.push(x, y, z);
    }
  }

  for (let lengthIndex = 0; lengthIndex < gutterLengthSegments; lengthIndex += 1) {
    for (
      let crossSectionIndex = 0;
      crossSectionIndex < gutterCrossSectionSegments;
      crossSectionIndex += 1
    ) {
      const current =
        lengthIndex * (gutterCrossSectionSegments + 1) + crossSectionIndex;
      const nextRow = current + gutterCrossSectionSegments + 1;
      gutterIndices.push(current, nextRow, current + 1);
      gutterIndices.push(current + 1, nextRow, nextRow + 1);
    }
  }

  const gutterGeometry = new THREE.BufferGeometry();
  gutterGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(gutterPositions, 3)
  );
  gutterGeometry.setIndex(gutterIndices);
  gutterGeometry.computeVertexNormals();

  const gutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
  gutter.receiveShadow = true;
  scene.add(gutter);
}

createGutter(-1);
createGutter(1);

function createPin(x, z) {
  const pin = new THREE.Group();

  const pinProfile = [
    new THREE.Vector2(0.16, 0),
    new THREE.Vector2(0.2, 0.06),
    new THREE.Vector2(0.23, 0.25),
    new THREE.Vector2(0.24, 0.45),
    new THREE.Vector2(0.21, 0.68),
    new THREE.Vector2(0.16, 0.82),
    new THREE.Vector2(0.12, 0.98),
    new THREE.Vector2(0.13, 1.1),
    new THREE.Vector2(0.18, 1.18),
    new THREE.Vector2(0.19, 1.38),
    new THREE.Vector2(0.17, 1.52),
    new THREE.Vector2(0.1, 1.62),
    new THREE.Vector2(0, 1.66),
  ];

  const body = new THREE.Mesh(
    new THREE.LatheGeometry(pinProfile, 32),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.35 })
  );
  body.castShadow = true;
  pin.add(body);

  const stripeMaterial = new THREE.MeshStandardMaterial({
    color: 0xb51f2a,
    roughness: 0.4,
  });

  for (const stripe of [
    { radius: 0.12, y: 1.0 },
    { radius: 0.13, y: 1.1 },
    { radius: 0.15, y: 1.2 },
  ]) {
    const stripeMesh = new THREE.Mesh(
      new THREE.TorusGeometry(stripe.radius, 0.022, 10, 32),
      stripeMaterial
    );
    stripeMesh.position.y = stripe.y;
    stripeMesh.rotation.x = Math.PI / 2;
    stripeMesh.castShadow = true;
    pin.add(stripeMesh);
  }

  pin.scale.setScalar(PIN_HEIGHT_WORLD / PIN_REFERENCE_HEIGHT);
  pin.position.set(x, 0, z);
  scene.add(pin);
}

for (let row = 0; row < 4; row += 1) {
  for (let column = 0; column <= row; column += 1) {
    createPin((column - row / 2) * 0.55, -24 - row * 0.6);
  }
}

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS_WORLD, 32, 20),
  new THREE.MeshStandardMaterial({ color: 0x2864d7, roughness: 0.25, metalness: 0.2 })
);
ball.position.set(0, 0.1 + BALL_RADIUS_WORLD, 5.5);
ball.castShadow = true;
scene.add(ball);

let yaw = 0;
let pitch = -0.08;
let isLooking = false;
const pressedKeys = new Set();
const movementSpeed = 5;

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (!["w", "a", "s", "d"].includes(key)) return;
  event.preventDefault();
  pressedKeys.add(key);
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

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

function updateMovement(deltaSeconds) {
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const movement = new THREE.Vector3();

  if (pressedKeys.has("w")) movement.add(forward);
  if (pressedKeys.has("s")) movement.sub(forward);
  if (pressedKeys.has("d")) movement.add(right);
  if (pressedKeys.has("a")) movement.sub(right);

  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(movementSpeed * deltaSeconds);
    camera.position.add(movement);
  }

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -6, 6);
  camera.position.z = Math.max(camera.position.z, -27);
}

let lastFrameTime = 0;

function animate(currentTime = 0) {
  requestAnimationFrame(animate);
  const deltaSeconds = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
  lastFrameTime = currentTime;
  updateMovement(deltaSeconds);
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  renderer.render(scene, camera);
}

animate();
