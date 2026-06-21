import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { parseA3P, type AliceObject, type AliceProject } from "./a3p-parser";
import { buildScene } from "./scene-builder";
import { disposeSceneResources } from "./scene-disposal";
import { detectWebXRCapabilities, type WebXREvidence } from "./webxr-capabilities";
import { type WebXRInputSourceState, type WebXRInputState } from "./webxr-input";
import {
  createWebXRLocomotion,
  resolveWebXRInteraction,
  type WebXRLocomotion,
  type WebXRLocomotionMode,
  type WebXRMovementHit,
  type WebXRObjectHit,
} from "./webxr-locomotion";
import {
  createWebXRSessionController,
  type WebXRSessionController,
  type WebXRSessionState,
} from "./webxr-session";
import { renderWebXRStatus, type WebXRButtonState } from "./webxr-ui";

function requireElement<T extends HTMLElement>(id: string, ctor: abstract new (...args: never[]) => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof ctor)) {
    throw new Error(`Missing required element #${id}`);
  }
  return element;
}

const fileInput = requireElement("file-input", HTMLInputElement);
const objectList = requireElement("object-list", HTMLUListElement);
const status = requireElement("status", HTMLElement);
const webXRStatus = requireElement("webxr-status", HTMLElement);
const canvas = requireElement("viewport", HTMLCanvasElement);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const raycaster = new THREE.Raycaster();
const locomotion: WebXRLocomotion = createWebXRLocomotion({ mode: "combined" });
const webXRAffordances = new Map<string, THREE.Group>();

let currentScene: THREE.Scene | null = null;
let currentCamera: THREE.PerspectiveCamera | null = null;
let currentUserRig: THREE.Group | null = null;
let controls: OrbitControls | null = null;
let lastProject: AliceProject | null = null;
let webXRController: WebXRSessionController | null = null;
let webXREvidence: readonly WebXREvidence[] = [];
let webXRInvalidTargetMessage: string | undefined;
let lastAnimationTime = 0;

function describeObject(obj: AliceObject): string {
  const shortType = obj.typeName.split(".").pop() ?? obj.typeName;
  const resource = obj.resourceType ? ` [${obj.resourceType.split(".").pop()}]` : "";
  return `${obj.name} (${shortType})${resource}`;
}

function describeProject(project: AliceProject): string {
  return `Loaded "${project.projectName}" (v${project.version}) - ${project.sceneObjects.length} objects`;
}

function setStatusMessage(message: string): void {
  status.textContent = message;
  status.dataset.state = "ready";
}

function setErrorMessage(error: unknown): void {
  status.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  status.dataset.state = "error";
}

function clearObjectList(): void {
  objectList.innerHTML = "";
}

function renderObjectList(project: AliceProject): void {
  clearObjectList();
  for (const object of project.sceneObjects) {
    const item = document.createElement("li");
    item.textContent = describeObject(object);
    objectList.appendChild(item);
  }
}

function resizeRenderer(): void {
  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);
  renderer.setSize(width, height, false);
  if (currentCamera) {
    currentCamera.aspect = width / height;
    currentCamera.updateProjectionMatrix();
  }
}

function disposeControls(): void {
  controls?.dispose();
  controls = null;
}

function removeAffordances(): void {
  for (const affordance of webXRAffordances.values()) {
    affordance.removeFromParent();
  }
  webXRAffordances.clear();
}

function resetWebXRController(): void {
  if (webXRController?.state === "active") {
    void webXRController.end().catch((error: unknown) => {
      console.error("Alice WebXR session cleanup failed", error);
    });
  }
  webXRController = null;
  removeAffordances();
}

function applyScene(project: AliceProject): void {
  resetWebXRController();
  const { scene, camera, cameraConfig } = buildScene(project);
  disposeSceneResources(currentScene);
  currentScene = scene;
  currentCamera = camera;

  currentUserRig = new THREE.Group();
  currentUserRig.name = "Alice WebXR user rig";
  currentUserRig.position.set(0, 0, 0);
  currentUserRig.add(camera);
  scene.add(currentUserRig);

  resizeRenderer();

  disposeControls();
  controls = new OrbitControls(camera, canvas);
  controls.target.set(cameraConfig.target.x, cameraConfig.target.y, cameraConfig.target.z);
  controls.minDistance = cameraConfig.minDistance;
  controls.maxDistance = cameraConfig.maxDistance;
  controls.maxPolarAngle = cameraConfig.maxPolarAngle;
  controls.enableDamping = cameraConfig.enableDamping;

  webXRController = createWebXRSessionController({
    renderer,
    scene,
    camera,
    userRig: currentUserRig,
    orbitControls: controls,
    navigator: navigator as unknown as Parameters<typeof createWebXRSessionController>[0]["navigator"],
    logger: console,
    onSelect: (event) => resolveSelectInteraction(event.inputSource),
  });
  webXRController.onStateChange((state) => renderWebXRPanel(state));
  void refreshCapabilityStatus();
}

function renderFrame(time: number, frame?: unknown): void {
  const deltaSeconds = lastAnimationTime === 0 ? 0 : Math.min(0.1, Math.max(0, (time - lastAnimationTime) / 1000));
  lastAnimationTime = time;

  controls?.update();
  if (webXRController?.state === "active" && currentUserRig) {
    const input = webXRController.updateInput(frame);
    syncWebXRAffordances(input);
    const movement = locomotion.update(input, deltaSeconds);
    if (movement.type === "movement") {
      currentUserRig.position.x += movement.deltaMeters.x;
      currentUserRig.position.y += movement.deltaMeters.y;
      currentUserRig.position.z += movement.deltaMeters.z;
    }
    webXREvidence = [...webXREvidence.filter((item) => item.code !== "non-finite-pose"), ...input.evidence, ...movement.evidence];
  }

  if (currentScene && currentCamera) {
    renderer.render(currentScene, currentCamera);
  }
}

async function readSelectedFile(input: HTMLInputElement): Promise<File | null> {
  return input.files?.[0] ?? null;
}

async function loadProjectFromFile(file: File): Promise<AliceProject> {
  const buffer = await file.arrayBuffer();
  return parseA3P(buffer);
}

async function handleFileSelection(): Promise<void> {
  const file = await readSelectedFile(fileInput);
  if (!file) {
    return;
  }

  status.textContent = `Loading ${file.name}...`;
  clearObjectList();

  try {
    const project = await loadProjectFromFile(file);
    lastProject = project;
    renderObjectList(project);
    applyScene(project);
    setStatusMessage(describeProject(project));
  } catch (error) {
    console.error(error);
    setErrorMessage(error);
  }
}

function describeLastProject(): string {
  if (!lastProject) {
    return "No project loaded";
  }
  return `${lastProject.projectName}: ${lastProject.sceneObjects.length} objects`;
}

function installWindowHandlers(): void {
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r" && lastProject) {
      event.preventDefault();
      renderObjectList(lastProject);
      applyScene(lastProject);
      setStatusMessage(`Reloaded ${describeLastProject()}`);
    }
  });
}

function installInputHandlers(): void {
  fileInput.addEventListener("change", () => {
    void handleFileSelection();
  });
}

function renderWebXRPanel(state: WebXRSessionState = webXRController?.state ?? "idle"): void {
  const buttonState: WebXRButtonState = state === "active"
    ? "exit"
    : !currentScene || webXREvidence.some((item) => item.severity === "unsupported")
      ? "disabled"
      : "enter";
  const message = currentScene
    ? state === "active"
      ? "Alice VR is active."
      : "Alice VR is available when browser capabilities allow it."
    : "Load an Alice scene to check VR support.";
  const elements = renderWebXRStatus(webXRStatus, {
    status: state,
    buttonState,
    message,
    locomotionMode: locomotion.mode,
    invalidTargetMessage: webXRInvalidTargetMessage,
    evidence: webXREvidence,
  });
  elements.button.addEventListener("click", () => {
    void handleVRButtonClick();
  });
}

async function refreshCapabilityStatus(): Promise<void> {
  const report = await detectWebXRCapabilities({
    isSecureContext,
    navigator: navigator as unknown as NonNullable<Parameters<typeof detectWebXRCapabilities>[0]>["navigator"],
  });
  webXREvidence = report.evidence;
  renderWebXRPanel(report.status === "unsupported" ? "unsupported" : webXRController?.state ?? "idle");
}

async function handleVRButtonClick(): Promise<void> {
  if (!webXRController) {
    webXREvidence = [{
      code: "webxr-unavailable",
      severity: "unsupported",
      message: "Load an Alice scene before entering VR.",
    }];
    renderWebXRPanel("unsupported");
    return;
  }

  if (webXRController.state === "active") {
    await webXRController.end();
    renderWebXRPanel("ended");
    return;
  }

  const result = await webXRController.start();
  webXREvidence = result.evidence;
  renderWebXRPanel(result.status === "active" ? "active" : result.status);
}

function sourceAffordance(source: WebXRInputSourceState): THREE.Group {
  const existing = webXRAffordances.get(source.id);
  if (existing) {
    return existing;
  }

  const group = new THREE.Group();
  group.name = `Alice WebXR input ${source.id}`;
  group.userData.aliceWebXRAffordance = true;

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -3),
  ]);
  const ray = new THREE.Line(rayGeometry, new THREE.LineBasicMaterial({ color: 0x66ccff }));
  ray.name = "target-ray";
  group.add(ray);

  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  grip.name = "grip";
  group.add(grip);

  currentScene?.add(group);
  webXRAffordances.set(source.id, group);
  return group;
}

function applyPose(object: THREE.Object3D, matrix: readonly number[] | undefined): void {
  if (!matrix || matrix.length !== 16 || !matrix.every(Number.isFinite)) {
    object.visible = false;
    return;
  }
  object.visible = true;
  object.matrix.fromArray([...matrix]);
  object.matrix.decompose(object.position, object.quaternion, object.scale);
}

function syncWebXRAffordances(input: WebXRInputState): void {
  const activeIds = new Set(input.sources.map((source) => source.id));
  for (const [id, affordance] of webXRAffordances.entries()) {
    if (!activeIds.has(id)) {
      affordance.removeFromParent();
      webXRAffordances.delete(id);
    }
  }

  for (const source of input.sources) {
    const affordance = sourceAffordance(source);
    const ray = affordance.getObjectByName("target-ray");
    const grip = affordance.getObjectByName("grip");
    if (ray) {
      applyPose(ray, source.targetRay?.matrix);
    }
    if (grip) {
      applyPose(grip, source.grip?.matrix);
    }
  }
}

function findAliceUserData(object: THREE.Object3D, predicate: (userData: Record<string, unknown>) => boolean): Record<string, unknown> | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (predicate(current.userData)) {
      return current.userData;
    }
    current = current.parent;
  }
  return null;
}

function rayFromPose(source: WebXRInputSourceState): THREE.Ray | null {
  const matrix = source.targetRay?.matrix;
  if (!matrix || matrix.length !== 16 || !matrix.every(Number.isFinite)) {
    return null;
  }
  const origin = new THREE.Vector3(matrix[12], matrix[13], matrix[14]);
  const direction = new THREE.Vector3(-matrix[8], -matrix[9], -matrix[10]).normalize();
  if (direction.lengthSq() === 0) {
    return null;
  }
  return new THREE.Ray(origin, direction);
}

function collectInteractionHits(source: WebXRInputSourceState): { objectHits: WebXRObjectHit[]; movementHits: WebXRMovementHit[] } {
  if (!currentScene) {
    return { objectHits: [], movementHits: [] };
  }
  const ray = rayFromPose(source);
  if (!ray) {
    return { objectHits: [], movementHits: [] };
  }

  raycaster.ray.copy(ray);
  const intersections = raycaster.intersectObjects(currentScene.children, true);
  const objectHits: WebXRObjectHit[] = [];
  const movementHits: WebXRMovementHit[] = [];

  for (const hit of intersections) {
    if (findAliceUserData(hit.object, (userData) => Boolean(userData.aliceWebXRAffordance))) {
      continue;
    }
    const pickable = findAliceUserData(hit.object, (userData) => Boolean(userData.aliceWebXRPickable));
    if (pickable) {
      objectHits.push({
        objectName: String(pickable.aliceObjectName ?? (hit.object.name || "Alice object")),
        distanceMeters: hit.distance,
        point: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
        pickable: true,
      });
    }
    const movementSurface = findAliceUserData(hit.object, (userData) => Boolean(userData.aliceWebXRMovementSurface));
    if (movementSurface) {
      movementHits.push({
        surfaceName: String(movementSurface.aliceWebXRSurfaceName ?? (hit.object.name || "ground")),
        distanceMeters: hit.distance,
        position: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
      });
    }
  }

  return { objectHits, movementHits };
}

function resolveSelectInteraction(inputSource: unknown): void {
  const input = webXRController?.input;
  if (!input || !currentUserRig) {
    return;
  }
  const source = input.sources.find((candidate) => candidate.id === sourceId(inputSource)) ?? input.sources[0];
  if (!source) {
    return;
  }

  const hits = collectInteractionHits(source);
  const result = resolveWebXRInteraction({
    mode: locomotion.mode,
    objectHits: hits.objectHits,
    movementHits: hits.movementHits,
    movementSurfaceNames: locomotion.config.movementSurfaceNames,
    clickMoveMaxDistanceMeters: locomotion.config.clickMoveMaxDistanceMeters,
    clickMoveStepMeters: locomotion.config.clickMoveStepMeters,
    verticalMovement: locomotion.config.verticalMovement,
    currentRigPosition: currentUserRig.position,
  });

  webXREvidence = result.evidence.length > 0 ? [...webXREvidence, ...result.evidence] : webXREvidence;
  webXRInvalidTargetMessage = result.type === "invalid-target" ? "That selection is not a valid movement target." : undefined;
  if (result.type === "movement") {
    currentUserRig.position.set(result.target.position.x, result.target.position.y, result.target.position.z);
  }
  if (result.type === "object-interaction") {
    window.dispatchEvent(new CustomEvent("alice-webxr-object-interaction", {
      detail: { objectName: result.objectName, point: result.point },
    }));
  }
  renderWebXRPanel(webXRController?.state ?? "idle");
}

function sourceId(inputSource: unknown): string {
  const source = inputSource as { handedness?: string; targetRayMode?: string; profiles?: readonly string[] } | undefined;
  return `${source?.handedness || "none"}:${source?.targetRayMode || "unknown"}:${source?.profiles?.[0] || "generic"}`;
}

function initializeApplication(): void {
  resizeRenderer();
  installWindowHandlers();
  installInputHandlers();
  renderer.setAnimationLoop(renderFrame);
  renderWebXRPanel();
  setStatusMessage("Choose an .a3p file to begin.");
  void refreshCapabilityStatus();
}

initializeApplication();
