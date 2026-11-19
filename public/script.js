import * as THREE from "/node_modules/three/build/three.module.js";
import { LANE_DESIGN } from "/lane-design.js";

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

const BOARD_COUNT = LANE_DESIGN.boardCount;
const PIN_FRONT_DISTANCE_FEET = LANE_DESIGN.pinFrontDistanceFeet;
const PIN_DECK_BACK_EXTRA_FEET = LANE_DESIGN.pinDeckBackExtraFeet;
const LANE_LENGTH_FEET = PIN_FRONT_DISTANCE_FEET + PIN_DECK_BACK_EXTRA_FEET;
const LANE_LENGTH_WORLD = LANE_LENGTH_FEET * 0.6;
const WORLD_UNITS_PER_FOOT = LANE_LENGTH_WORLD / LANE_LENGTH_FEET;
const BOARD_WIDTH_INCHES = LANE_DESIGN.boardWidthInches;
const LANE_WIDTH_FEET = (BOARD_COUNT * BOARD_WIDTH_INCHES) / 12;
const LANE_WIDTH = LANE_WIDTH_FEET * WORLD_UNITS_PER_FOOT;
const BOARD_WIDTH = LANE_WIDTH / BOARD_COUNT;
const LANE_FRONT_Z = 8;
const LANE_SURFACE_Y = 0.1;
const FOUL_LINE_DEPTH_WORLD = LANE_DESIGN.foulLineDepthWorld;
const LANE_SURFACE_LENGTH_WORLD = LANE_LENGTH_WORLD - FOUL_LINE_DEPTH_WORLD;
const PLAYER_VIEW_HEIGHT_FEET = 4;
const PLAYER_HEIGHT_WORLD = PLAYER_VIEW_HEIGHT_FEET * WORLD_UNITS_PER_FOOT;
camera.position.y = PLAYER_HEIGHT_WORLD;
const PIN_HEIGHT_INCHES = LANE_DESIGN.pinHeightInches;
const PIN_REFERENCE_HEIGHT = 1.66;
const PIN_HEIGHT_WORLD = (PIN_HEIGHT_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const PIN_FRONT_Z = LANE_FRONT_Z - PIN_FRONT_DISTANCE_FEET * WORLD_UNITS_PER_FOOT;
const PIN_SPACING_INCHES = LANE_DESIGN.pinSpacingInches;
const PIN_SPACING_WORLD = (PIN_SPACING_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const BALL_DIAMETER_INCHES = LANE_DESIGN.ballDiameterInches;
const BALL_DIAMETER_WORLD = (BALL_DIAMETER_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const BALL_RADIUS_WORLD = BALL_DIAMETER_WORLD / 2;
const BALL_START_POSITION = new THREE.Vector3(0, LANE_SURFACE_Y + BALL_RADIUS_WORLD, 5.5);
const BALL_FOUL_POSITION = new THREE.Vector3(
  0,
  LANE_SURFACE_Y + BALL_RADIUS_WORLD,
  LANE_FRONT_Z
);
const BALL_LATERAL_SPEED = 2.5;

const lane = new THREE.Mesh(
  new THREE.BoxGeometry(LANE_WIDTH, 0.2, LANE_SURFACE_LENGTH_WORLD),
  new THREE.MeshStandardMaterial({ color: 0xc68b52, roughness: 0.45 })
);
lane.position.set(
  0,
  0,
  LANE_FRONT_Z - FOUL_LINE_DEPTH_WORLD / 2 - LANE_SURFACE_LENGTH_WORLD / 2
);
lane.receiveShadow = true;
scene.add(lane);

const foulLine = new THREE.Mesh(
  new THREE.BoxGeometry(LANE_WIDTH + 0.02, 0.004, FOUL_LINE_DEPTH_WORLD),
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
    new THREE.BoxGeometry(0.012, 0.012, LANE_SURFACE_LENGTH_WORLD),
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

const oilPattern = LANE_DESIGN.oilPattern;
const oilMaterialColor = new THREE.Color(0xf0b44f);
const maxOilMicroliters = 6500;
const oilBandMaterials = [];

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

for (const section of LANE_DESIGN.brownSections) {
  addBrownSections(section.boards, section.startFeet);
}

const targetBoardNumbers = LANE_DESIGN.targetBoardNumbers;
const arrowDistancesFeet = LANE_DESIGN.arrowDistancesFeet;
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
const GUTTER_WIDTH_INCHES = LANE_DESIGN.gutterWidthInches;
const GUTTER_WIDTH_WORLD = (GUTTER_WIDTH_INCHES / 12) * WORLD_UNITS_PER_FOOT;
const GUTTER_START_DROP_INCHES = LANE_DESIGN.gutterStartDropInches;
const GUTTER_MAX_DROP_INCHES = LANE_DESIGN.gutterMaxDropInches;

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

const pins = [];

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
  pin.position.set(x, LANE_SURFACE_Y, z);
  pins.push({
    group: pin,
    origin: new THREE.Vector3(x, LANE_SURFACE_Y, z),
    knocked: false,
    velocity: new THREE.Vector3(),
    spin: 0,
  });
  scene.add(pin);
}

for (let row = 0; row < 4; row += 1) {
  for (let column = 0; column <= row; column += 1) {
    createPin(
      (column - row / 2) * PIN_SPACING_WORLD,
      PIN_FRONT_Z - row * PIN_SPACING_WORLD
    );
  }
}

function sectionOilDensity(section, distanceFeet, boardNumber) {
  const sectionStart = Math.min(section.startFeet, section.endFeet);
  const sectionEnd = Math.max(section.startFeet, section.endFeet);
  if (distanceFeet < sectionStart || distanceFeet > sectionEnd) return 0;

  const sectionCenter = (section.startBoard + section.endBoard) / 2;
  const sectionHalfWidth = (section.endBoard - section.startBoard + 1) / 2;
  const boardDistance = Math.abs(boardNumber - sectionCenter);
  const boardCoverage = THREE.MathUtils.clamp(
    1 - Math.max(0, boardDistance - sectionHalfWidth) / 2,
    0,
    1
  );
  return (section.oilMicroliters / maxOilMicroliters) * boardCoverage;
}

function getOilDensity(x, distanceFeet) {
  const boardNumber = (BOARD_COUNT + 1) / 2 + x / BOARD_WIDTH;
  const sections = [...oilPattern.forward, ...oilPattern.reverse];
  const totalDensity = sections.reduce(
    (density, section) => density + sectionOilDensity(section, distanceFeet, boardNumber),
    0
  );
  return THREE.MathUtils.clamp(totalDensity, 0, 1);
}

function getVisualOilDensity(boardNumber, distanceFeet) {
  if (distanceFeet > 40) return 0;

  const distanceProgress = THREE.MathUtils.clamp(distanceFeet / 40, 0, 1);
  const centerBoard = (BOARD_COUNT + 1) / 2;
  const boardDistance = Math.abs(boardNumber - centerBoard);
  const outerHalfWidth = THREE.MathUtils.lerp(17.5, 11.5, distanceProgress);

  if (boardDistance > outerHalfWidth) return 0;

  const coreProgress = THREE.MathUtils.clamp(distanceFeet / 31, 0, 1);
  const coreHalfWidth = THREE.MathUtils.lerp(10, 5.5, coreProgress);
  return boardDistance <= coreHalfWidth ? 0.9 : 0.28;
}

function createOilHeatmap() {
  for (let distanceIndex = 0; distanceIndex < oilPattern.distanceFeet; distanceIndex += 1) {
    for (let boardNumber = 1; boardNumber <= BOARD_COUNT; boardNumber += 1) {
      const oilDensity = getVisualOilDensity(boardNumber, distanceIndex + 0.5);
      if (oilDensity === 0) continue;

      const material = new THREE.MeshBasicMaterial({
        color: oilMaterialColor,
        transparent: true,
        opacity: 0.04 + oilDensity * 0.1,
        depthWrite: false,
      });
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(BOARD_WIDTH * 1.02, 0.006, WORLD_UNITS_PER_FOOT),
        material
      );
      tile.position.set(
        boardCenter(boardNumber),
        LANE_SURFACE_Y + 0.014,
        LANE_FRONT_Z - (distanceIndex + 0.5) * WORLD_UNITS_PER_FOOT
      );
      tile.renderOrder = 1;
      oilBandMaterials.push({ material, oilDensity });
      scene.add(tile);
    }
  }
}

createOilHeatmap();

const ballMaterial = new THREE.MeshStandardMaterial({
  color: 0x2864d7,
  roughness: 0.25,
  metalness: 0.2,
  emissive: 0x000000,
});
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS_WORLD, 32, 20),
  ballMaterial
);
ball.position.copy(BALL_START_POSITION);
ball.castShadow = true;
scene.add(ball);

const ballHoleMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  roughness: 1,
  metalness: 0,
});

function addBallHole(normal, radius) {
  const surfaceNormal = normal.normalize();
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.012, 20),
    ballHoleMaterial
  );
  hole.position.copy(surfaceNormal).multiplyScalar(BALL_RADIUS_WORLD * 0.997);
  hole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceNormal);
  hole.castShadow = true;
  ball.add(hole);
}

// One thumb hole above two close finger holes, roughly 3 inches lower.
addBallHole(new THREE.Vector3(0, 0.98, 0.18), BALL_RADIUS_WORLD * 0.17);
addBallHole(new THREE.Vector3(-0.16, 0.35, 0.92), BALL_RADIUS_WORLD * 0.12);
addBallHole(new THREE.Vector3(0.16, 0.35, 0.92), BALL_RADIUS_WORLD * 0.12);

const aimRaycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
let isBallTargeted = false;
let savedCameraState = null;

function updateBallHighlight() {
  aimRaycaster.setFromCamera(screenCenter, camera);
  isBallTargeted = aimRaycaster.intersectObject(ball, false).length > 0;
  ballMaterial.emissive.setHex(isBallTargeted ? 0x75b8ff : 0x000000);
  ballMaterial.emissiveIntensity = isBallTargeted ? 1.4 : 0;
}

const rollStatus = document.querySelector("#roll-status");
const aimControls = document.querySelector("#aim-controls");
const oilToggle = document.querySelector("#oil-toggle input");

function updateOilVisualization() {
  const lightBlue = new THREE.Color(0xb9efff);
  const darkBlue = new THREE.Color(0x075985);
  for (const { material, oilDensity } of oilBandMaterials) {
    if (oilToggle.checked) {
      material.color.copy(lightBlue).lerp(darkBlue, oilDensity);
      material.opacity = 0.12 + oilDensity * 0.24;
    } else {
      material.color.copy(oilMaterialColor);
      material.opacity = 0.035 + oilDensity * 0.08;
    }
  }
}

oilToggle.addEventListener("change", updateOilVisualization);
let ballInPlay = false;
let resetTimer = 0;
let rollElapsed = 0;
let hookDirection = 0;
const ballVelocity = new THREE.Vector3();

function setRollStatus(message) {
  rollStatus.textContent = message;
}

function standingPinCount() {
  return pins.reduce((count, pin) => count + (pin.knocked ? 0 : 1), 0);
}

function throwBall() {
  if (ballInPlay || resetTimer > 0) return;

  const direction = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  ballVelocity.copy(direction).multiplyScalar(11);
  const hookThreshold = BOARD_WIDTH * 1.5;
  hookDirection = Math.abs(ball.position.x) > hookThreshold ? -Math.sign(ball.position.x) : 0;
  ballInPlay = true;
  rollElapsed = 0;
  setRollStatus("Rolling…");
}

function enterBallView() {
  savedCameraState = {
    position: camera.position.clone(),
    yaw,
    pitch,
  };
  ball.position.copy(BALL_FOUL_POSITION);
  ball.rotation.set(0, 0, 0);
  camera.position.set(0, BALL_FOUL_POSITION.y + 1.1, LANE_FRONT_Z + 1.4);
  yaw = 0;
  pitch = -0.16;
  isBallView = true;
  aimControls.classList.add("visible");
  setRollStatus("Ball view • Space to throw • Backspace to exit");
}

function exitBallView() {
  if (!isBallView || !savedCameraState) return;
  camera.position.copy(savedCameraState.position);
  yaw = savedCameraState.yaw;
  pitch = savedCameraState.pitch;
  savedCameraState = null;
  isBallView = false;
  aimControls.classList.remove("visible");
  setRollStatus(ballInPlay ? "Rolling…" : "Ready to roll");
}

function knockPin(pin, direction) {
  pin.knocked = true;
  pin.velocity.copy(direction).multiplyScalar(2.2);
  pin.velocity.y = 2.4;
  pin.spin = (pin.group.position.x >= 0 ? 1 : -1) * 5;
}

function finishRoll() {
  ballInPlay = false;
  rollElapsed = 0;
  hookDirection = 0;
  ballVelocity.set(0, 0, 0);
  const knockedDown = pins.length - standingPinCount();
  const result = knockedDown === 10 ? "Strike!" : `${knockedDown} pin${knockedDown === 1 ? "" : "s"} down`;
  setRollStatus(`${result} Resetting…`);
  resetTimer = 2.2;
}

function resetRoll() {
  ball.position.copy(BALL_FOUL_POSITION);
  ball.rotation.set(0, 0, 0);
  for (const pin of pins) {
    pin.knocked = false;
    pin.velocity.set(0, 0, 0);
    pin.group.position.copy(pin.origin);
    pin.group.rotation.set(0, 0, 0);
    pin.group.visible = true;
  }
  setRollStatus("Ready to roll");
}

function updateBall(deltaSeconds) {
  for (const pin of pins) {
    if (!pin.knocked) continue;
    pin.velocity.y -= 7 * deltaSeconds;
    pin.group.position.addScaledVector(pin.velocity, deltaSeconds);
    pin.group.rotation.z += pin.spin * deltaSeconds;
    if (pin.group.position.y < -0.3) pin.group.visible = false;
  }

  if (!ballInPlay) return;

  rollElapsed += deltaSeconds;
  ball.position.addScaledVector(ballVelocity, deltaSeconds);
  ball.rotation.x -= ballVelocity.z * deltaSeconds / BALL_RADIUS_WORLD;
  ball.rotation.z += ballVelocity.x * deltaSeconds / BALL_RADIUS_WORLD;

  const distanceFeet = Math.max(0, (LANE_FRONT_Z - ball.position.z) / WORLD_UNITS_PER_FOOT);
  const oilDensity = getOilDensity(ball.position.x, distanceFeet);
  const dryLaneFactor = 1 - oilDensity;
  const hookAcceleration = dryLaneFactor * (0.8 + Math.min(distanceFeet / oilPattern.distanceFeet, 1) * 1.6);
  ballVelocity.x = THREE.MathUtils.clamp(
    ballVelocity.x + hookDirection * hookAcceleration * deltaSeconds,
    -3.5,
    3.5
  );

  for (const pin of pins) {
    if (pin.knocked) continue;
    const distance = Math.hypot(ball.position.x - pin.group.position.x, ball.position.z - pin.group.position.z);
    if (distance < BALL_RADIUS_WORLD + PIN_HEIGHT_WORLD * 0.16) {
      knockPin(pin, ballVelocity.clone().normalize());
    }
  }

  if (ball.position.z < PIN_FRONT_Z - PIN_SPACING_WORLD * 4 || rollElapsed > 5) finishRoll();
}

function updateBallAim(deltaSeconds) {
  if (!isBallView || ballInPlay) return;

  let horizontalInput = 0;
  if (pressedKeys.has("a")) horizontalInput -= 1;
  if (pressedKeys.has("d")) horizontalInput += 1;
  if (horizontalInput === 0) return;

  const laneEdge = LANE_WIDTH / 2 - BALL_RADIUS_WORLD;
  ball.position.x = THREE.MathUtils.clamp(
    ball.position.x + horizontalInput * BALL_LATERAL_SPEED * deltaSeconds,
    -laneEdge,
    laneEdge
  );
  camera.position.x = ball.position.x;
}

let yaw = 0;
let pitch = -0.08;
let isLooking = false;
let isBallView = false;
const pressedKeys = new Set();
const movementSpeed = 5;

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "backspace") {
    event.preventDefault();
    exitBallView();
    return;
  }
  if (key === " ") {
    event.preventDefault();
    throwBall();
    return;
  }
  if (!["w", "a", "s", "d"].includes(key)) return;
  event.preventDefault();
  pressedKeys.add(key);
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

renderer.domElement.addEventListener("click", () => {
  if (isBallTargeted && !ballInPlay && resetTimer === 0) {
    enterBallView();
    return;
  }
  renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  isLooking = document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", (event) => {
  if (!isLooking || isBallView) return;
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
  if (isBallView) return;

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
  if (resetTimer > 0) {
    resetTimer = Math.max(0, resetTimer - deltaSeconds);
    if (resetTimer === 0) resetRoll();
  }
  updateBall(deltaSeconds);
  updateBallAim(deltaSeconds);
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  updateBallHighlight();
  renderer.render(scene, camera);
}

animate();
