import * as THREE from 'three';
import { BufferGeometryUtils } from '../../../libs/BufferGeometryUtils.js';

const OrbitControls = require('three-orbit-controls')(THREE);

function createBulbLightGeometry(size, lights) {
  if (lights <= 0) {
    return new THREE.BoxBufferGeometry(0, 0, 0);
  }

  const mesh = Math.ceil(Math.sqrt(lights));
  const stepDepth = size.depth / mesh;
  const stepWidth = size.width / mesh;
  const startDepth = -size.depth / 2 + stepDepth / 2;
  const startWidth = -size.width / 2 + stepWidth / 2;

  const bulbGeometry = new THREE.SphereBufferGeometry(0.05, 6, 6);
  const bulbList = [];
  let lightCounter = 0;
  for (let i = 0; i < mesh && lightCounter < lights; i++) {
    for (let j = 0; j < mesh && lightCounter < lights; j++) {
      let position = new THREE.Vector3();
      position.x = startWidth + i * stepWidth;
      position.z = startDepth + j * stepDepth;

      let copyGeometry = bulbGeometry.clone();
      copyGeometry.translate(position.x, position.y, position.z);
      bulbList.push(copyGeometry);

      lightCounter++;
    }
  }

  return BufferGeometryUtils.mergeBufferGeometries(bulbList);
}

function createBulbLight(size, lights) {
  if (lights <= 0) return;

  const bulbMat = new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: 1,
    color: 0x000000
  });

  const groupGeometry = createBulbLightGeometry(size, lights);
  const bulbLight = new THREE.PointLight(0xffee88, 0.5, lights + 50, 1.5);
  bulbLight.add(new THREE.Mesh(groupGeometry, bulbMat));
  bulbLight.position.set(0, 0, 0);
  bulbLight.castShadow = true;
  return bulbLight;
}

function createHemisphereLight() {
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.7);
  hemiLight.color.setHSL(0.6, 0.1, 0.6);
  hemiLight.position.set(0, 100, 0);
  const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10, 0x000000);
  return { hemiLight, hemiLightHelper };
}

function createRectangleGeometry(size) {
  // Rectangle shape
  const rectLength = size.width;
  const rectWidth = size.depth;
  const rectShape = new THREE.Shape();
  rectShape.moveTo(rectLength / 2, rectWidth / 2);
  rectShape.lineTo(rectLength / 2, -rectWidth / 2);
  rectShape.lineTo(-rectLength / 2, -rectWidth / 2);
  rectShape.lineTo(-rectLength / 2, rectWidth / 2);
  rectShape.lineTo(rectLength / 2, rectWidth / 2);

  const extrusionPath = new THREE.Path();
  const padding = 0.1;
  extrusionPath.moveTo(rectLength / 2 - padding, rectWidth / 2 - padding);
  extrusionPath.lineTo(rectLength / 2 - padding, -rectWidth / 2 + padding);
  extrusionPath.lineTo(-rectLength / 2 + padding, -rectWidth / 2 + padding);
  extrusionPath.lineTo(-rectLength / 2 + padding, rectWidth / 2 - padding);
  extrusionPath.lineTo(rectLength / 2 - padding, rectWidth / 2 - padding);

  rectShape.holes.push(extrusionPath);

  const extrudeSettings = { steps: 2, amount: size.height, bevelEnabled: false };
  return new THREE.ExtrudeGeometry(rectShape, extrudeSettings);
}

export function initCube(id, size, numberOfLights) {
  const element = document.getElementById(id);

  const elementSize = getSize(element);
  const camera = new THREE.PerspectiveCamera(10, elementSize.width / elementSize.height, 1, 1000);
  camera.position.z = 30;
  camera.position.x = 0; //100 * Math.sin( 30 );
  camera.position.y = 30;

  const scene = new THREE.Scene();
  const geometry = new THREE.BoxBufferGeometry(size.width, 0, size.depth);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x050505,
    side: THREE.DoubleSide
  });
  const meshFloor = new THREE.Mesh(geometry, material);

  const controls = new OrbitControls(camera, element);
  controls.enableKeys = false;

  meshFloor.position.y = -size.height;
  scene.add(meshFloor);

  const wallGeometry = createRectangleGeometry(size);
  const meshWall = new THREE.Mesh(wallGeometry, material);
  meshWall.rotation.x = (-90 * Math.PI) / 180;
  meshWall.position.y = -size.height;
  scene.add(meshWall);

  // LIGHTS
  const { hemiLight, hemiLightHelper } = createHemisphereLight();

  scene.add(hemiLight);
  scene.add(hemiLightHelper);

  const bulbLight = createBulbLight(size, numberOfLights);

  if (bulbLight) {
    scene.add(bulbLight);
  }

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(elementSize.width, elementSize.height);
  renderer.render(scene, camera);

  element.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
  animate();

  return { meshFloor, meshWall, bulbLight, controls };

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    const { width, height } = getSize(element);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function getSize(element) {
    return {
      width: element.offsetWidth,
      height: element.parentElement.offsetHeight //Math.abs(window.innerHeight - 200)
    };
  }
}

export function updateLights(meshes, size, numberOfLights = 0) {
  const lightGeometry = createBulbLightGeometry(size, numberOfLights);
  const lightDistance = numberOfLights > 0 ? numberOfLights + 50 : 0;
  const visibleLight = numberOfLights > 0 ? true : false;

  meshes.bulbLight.children[0].geometry.dispose();
  meshes.bulbLight.children[0].geometry = lightGeometry;
  meshes.bulbLight.distance = lightDistance;
  meshes.bulbLight.visible = visibleLight;
}

export function updateGeometry(meshes, size) {
  const { width, depth } = size;
  const floorGeometry = new THREE.BoxBufferGeometry(width, 0, depth);
  const wallGeometry = createRectangleGeometry(size);

  meshes.meshFloor.geometry.dispose();
  meshes.meshFloor.geometry = floorGeometry;

  meshes.meshWall.geometry.dispose();
  meshes.meshWall.geometry = wallGeometry;
}
