import * as THREE from "three";
import type { AliceProject, AliceObject } from "./a3p-parser";

/** Color palette for different object types. */
const TYPE_COLORS: Record<string, number> = {
  "org.lgna.story.SGround": 0x4a7c3f,
  "org.lgna.story.SCamera": 0x666666,
};

const PROP_COLOR = 0xb5651d;
const MODEL_COLOR = 0xcc7722;
const DEFAULT_COLOR = 0x8888cc;

/** Build a Three.js scene from parsed Alice project data. */
export function buildScene(project: AliceProject): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // light sky blue

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 7);
  directional.castShadow = true;
  scene.add(directional);

  // Camera – Alice default is looking roughly along -Z, raised up
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 20);
  camera.lookAt(0, 0, 0);

  // Add objects
  for (const obj of project.sceneObjects) {
    const mesh = createMeshForObject(obj);
    if (mesh) scene.add(mesh);
  }

  return { scene, camera };
}

function createMeshForObject(obj: AliceObject): THREE.Object3D | null {
  const typeName = obj.typeName;

  if (typeName.includes("SGround")) {
    return createGround(obj);
  }
  if (typeName.includes("SCamera")) {
    return null; // handled by the Three.js camera
  }
  if (typeName.includes("SProp") || typeName.includes("SModel") || typeName.includes("SJointedModel")) {
    return createPropPlaceholder(obj);
  }

  // Fallback: generic placeholder
  return createGenericPlaceholder(obj);
}

function createGround(obj: AliceObject): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(200, 200);
  const mat = new THREE.MeshLambertMaterial({ color: TYPE_COLORS["org.lgna.story.SGround"] });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = obj.name;
  return mesh;
}

function createPropPlaceholder(obj: AliceObject): THREE.Mesh {
  const w = obj.size?.width ?? 1;
  const h = obj.size?.height ?? 1;
  const d = obj.size?.depth ?? 1;

  const geo = new THREE.BoxGeometry(w, h, d);
  const color = obj.typeName.includes("SProp") ? PROP_COLOR : MODEL_COLOR;
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  applyTransform(mesh, obj);
  mesh.name = obj.name;
  return mesh;
}

function createGenericPlaceholder(obj: AliceObject): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.5, 16, 16);
  const mat = new THREE.MeshLambertMaterial({ color: DEFAULT_COLOR });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  applyTransform(mesh, obj);
  mesh.name = obj.name;
  return mesh;
}

function applyTransform(mesh: THREE.Object3D, obj: AliceObject): void {
  if (obj.position) {
    // Alice Y is up, same as Three.js default
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
  }
  if (obj.orientation) {
    mesh.quaternion.set(obj.orientation.x, obj.orientation.y, obj.orientation.z, obj.orientation.w);
  }
}
