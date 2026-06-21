import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { parseA3P, type AliceObject, type AliceProject } from "./a3p-parser";
import { writeA3P } from "./a3p-writer/browser";
import {
  applyCameraPreset,
  createDefaultCameraWorkflowState,
  deleteCameraMarker,
  moveCamera,
  restoreCameraMarker,
  saveCameraMarker,
  setCameraMode,
  type CameraMarker,
  type CameraPreset,
  type CameraWorkflowState,
} from "./camera-workflow";
import {
  applyTextureBinding,
  importedAssetName,
  importProjectAsset,
} from "./imported-project-assets";
import { buildScene } from "./scene-builder";
import { disposeSceneResources } from "./scene-disposal";

function requireElement<T extends HTMLElement>(id: string, ctor: abstract new (...args: never[]) => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof ctor)) {
    throw new Error(`Missing required element #${id}`);
  }
  return element;
}

const fileInput = requireElement("file-input", HTMLInputElement);
const importModelInput = requireElement("import-model-input", HTMLInputElement);
const importedModelList = requireElement("imported-model-list", HTMLUListElement);
const importTextureInput = requireElement("import-texture-input", HTMLInputElement);
const importedTextureList = requireElement("imported-texture-list", HTMLUListElement);
const createShapeButton = requireElement("create-shape-button", HTMLButtonElement);
const applyTextureButton = requireElement("apply-texture-button", HTMLButtonElement);
const selectedObjectMaterial = requireElement("selected-object-material", HTMLElement);
const saveProjectButton = requireElement("save-project-button", HTMLButtonElement);
const objectList = requireElement("object-list", HTMLUListElement);
const status = requireElement("status", HTMLElement);
const canvas = requireElement("viewport", HTMLCanvasElement);
const cameraStatus = requireElement("camera-status", HTMLElement);
const cameraMode = requireElement("camera-mode", HTMLElement);
const cameraPosition = requireElement("camera-position", HTMLElement);
const cameraPreset = requireElement("camera-preset", HTMLSelectElement);
const cameraMoveForward = requireElement("camera-move-forward", HTMLButtonElement);
const cameraFirstPersonToggle = requireElement("camera-first-person-toggle", HTMLButtonElement);
const cameraMarkerName = requireElement("camera-marker-name", HTMLInputElement);
const cameraSaveMarker = requireElement("camera-save-marker", HTMLButtonElement);
const cameraMarkerList = requireElement("camera-marker-list", HTMLUListElement);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

let currentScene: THREE.Scene | null = null;
let currentCamera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let lastProject: AliceProject | null = null;
let selectedObjectName: string | null = null;
let boxCounter = 0;
const importedResourceBytes = new Map<string, Uint8Array>();
let cameraWorkflow: CameraWorkflowState = createDefaultCameraWorkflowState();

function describeObject(obj: AliceObject): string {
  const shortType = obj.typeName.split(".").pop() ?? obj.typeName;
  const resource = obj.resourceType ? ` [${obj.resourceType.split(".").pop()}]` : "";
  return `${obj.name} (${shortType})${resource}`;
}

function describeProject(project: AliceProject): string {
  return `Loaded "${project.projectName}" (v${project.version}) – ${project.sceneObjects.length} objects`;
}

function setStatusMessage(message: string): void {
  status.textContent = message;
  status.dataset.state = "ready";
}

function setErrorMessage(error: unknown): void {
  status.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  status.dataset.state = "error";
}

function setCameraStatusMessage(message: string): void {
  cameraStatus.textContent = message;
}

function clearObjectList(): void {
  objectList.innerHTML = "";
}

function renderObjectList(project: AliceProject): void {
  clearObjectList();
  for (const object of project.sceneObjects) {
    const item = document.createElement("li");
    item.tabIndex = 0;
    item.textContent = describeObject(object);
    item.addEventListener("click", () => selectObject(project, object.name));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectObject(project, object.name);
      }
    });
    objectList.appendChild(item);
  }
}

function renderImportedAssets(project: AliceProject): void {
  importedModelList.replaceChildren();
  importedTextureList.replaceChildren();

  for (const asset of project.importedAssets ?? []) {
    const item = document.createElement("li");
    item.textContent = asset.name;
    if (asset.kind === "model") {
      importedModelList.appendChild(item);
    } else {
      importedTextureList.appendChild(item);
    }
  }
}

function renderSelectedObjectMaterial(project: AliceProject): void {
  if (!selectedObjectName) {
    selectedObjectMaterial.textContent = "No object selected";
    return;
  }

  const object = project.sceneObjects.find((candidate) => candidate.name === selectedObjectName);
  if (!object) {
    selectedObjectName = null;
    selectedObjectMaterial.textContent = "No object selected";
    return;
  }

  const surfaceBinding = object.materialBindings?.find((binding) => binding.target === "surface");
  selectedObjectMaterial.textContent = surfaceBinding
    ? `${object.name}: ${importedAssetName(project, surfaceBinding.textureResourceId)}`
    : `${object.name}: no texture`;
}

function renderProjectState(project: AliceProject): void {
  renderObjectList(project);
  renderImportedAssets(project);
  renderSelectedObjectMaterial(project);
}

function selectObject(project: AliceProject, objectName: string): void {
  selectedObjectName = objectName;
  renderSelectedObjectMaterial(project);
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

function applyScene(project: AliceProject): void {
  const { scene, camera, cameraConfig } = buildScene(project);
  disposeSceneResources(currentScene);
  currentScene = scene;
  currentCamera = camera;
  resizeRenderer();

  disposeControls();
  controls = new OrbitControls(camera, canvas);
  controls.target.set(cameraConfig.target.x, cameraConfig.target.y, cameraConfig.target.z);
  controls.minDistance = cameraConfig.minDistance;
  controls.maxDistance = cameraConfig.maxDistance;
  controls.maxPolarAngle = cameraConfig.maxPolarAngle;
  controls.enableDamping = cameraConfig.enableDamping;
  applyCameraWorkflowToViewport();
}

function formatCameraVector(vector: { x: number; y: number; z: number }): string {
  return `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}`;
}

function applyCameraWorkflowToViewport(): void {
  if (!currentCamera) {
    return;
  }

  const camera = cameraWorkflow.camera;
  currentCamera.position.set(camera.position.x, camera.position.y, camera.position.z);
  currentCamera.up.set(camera.up.x, camera.up.y, camera.up.z);
  currentCamera.fov = camera.fieldOfViewDegrees;
  currentCamera.lookAt(camera.target.x, camera.target.y, camera.target.z);
  currentCamera.updateProjectionMatrix();

  if (controls) {
    controls.target.set(camera.target.x, camera.target.y, camera.target.z);
    controls.enabled = camera.mode === "orbit";
    controls.update();
  }
}

function renderCameraMarkers(): void {
  cameraMarkerList.replaceChildren();
  for (const marker of cameraWorkflow.markers) {
    cameraMarkerList.appendChild(createCameraMarkerListItem(marker));
  }
}

function createCameraMarkerListItem(marker: CameraMarker): HTMLLIElement {
  const item = document.createElement("li");
  const label = document.createElement("span");
  label.textContent = marker.name;

  const restoreButton = document.createElement("button");
  restoreButton.type = "button";
  restoreButton.className = "secondary";
  restoreButton.textContent = "Restore";
  restoreButton.addEventListener("click", () => {
    updateCameraWorkflow(
      () => restoreCameraMarker(cameraWorkflow, marker.id),
      `Camera marker "${marker.name}" restored.`,
    );
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "secondary";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    updateCameraWorkflow(
      () => deleteCameraMarker(cameraWorkflow, marker.id),
      `Camera marker "${marker.name}" deleted.`,
    );
  });

  item.append(label, restoreButton, deleteButton);
  return item;
}

function renderCameraWorkflow(): void {
  const camera = cameraWorkflow.camera;
  cameraMode.textContent = camera.mode;
  cameraPosition.textContent = formatCameraVector(camera.position);
  cameraPreset.value = camera.activePreset ?? "";
  cameraFirstPersonToggle.textContent = camera.mode === "first-person"
    ? "Return to orbit"
    : "Toggle first-person";
  renderCameraMarkers();
  applyCameraWorkflowToViewport();
}

function updateCameraWorkflow(
  updater: () => CameraWorkflowState,
  successMessage: string,
): void {
  try {
    cameraWorkflow = updater();
    renderCameraWorkflow();
    setCameraStatusMessage(successMessage);
  } catch (error) {
    console.error(error);
    setCameraStatusMessage(`Camera error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function animate(): void {
  requestAnimationFrame(animate);
  controls?.update();
  if (currentScene && currentCamera) {
    renderer.render(currentScene, currentCamera);
  }
}

async function readSelectedFile(input: HTMLInputElement): Promise<File | null> {
  const file = input.files?.[0] ?? null;
  return file;
}

async function loadProjectFromFile(file: File): Promise<AliceProject> {
  const buffer = await file.arrayBuffer();
  return parseA3P(buffer);
}

function ensureEditableProject(): AliceProject {
  if (!lastProject) {
    lastProject = {
      version: "3.10.0.0",
      projectName: "Alice Imported Assets",
      sceneObjects: [],
      methods: [],
      importedAssets: [],
    };
  }
  lastProject.importedAssets ??= [];
  return lastProject;
}

async function handleFileSelection(): Promise<void> {
  const file = await readSelectedFile(fileInput);
  if (!file) {
    return;
  }

  status.textContent = `Loading ${file.name}…`;
  clearObjectList();

  try {
    const project = await loadProjectFromFile(file);
    lastProject = project;
    selectedObjectName = null;
    renderProjectState(project);
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

async function importSelectedAsset(input: HTMLInputElement, kind: "model" | "texture"): Promise<void> {
  const file = await readSelectedFile(input);
  if (!file) {
    return;
  }

  try {
    const project = ensureEditableProject();
    const asset = importProjectAsset({
      project,
      resources: importedResourceBytes,
      kind,
      fileName: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    renderProjectState(project);
    applyScene(project);
    setStatusMessage(`Imported Alice ${kind} "${asset.name}".`);
  } catch (error) {
    console.error(error);
    setErrorMessage(error);
  } finally {
    input.value = "";
  }
}

function createBox(): void {
  const project = ensureEditableProject();
  const name = nextBoxName(project);
  project.sceneObjects.push({
    name,
    typeName: "org.lgna.story.SBox",
    resourceType: null,
    position: { x: 0, y: 0.5, z: 0 },
    orientation: null,
    size: { width: 1, height: 1, depth: 1 },
  });
  selectedObjectName = name;
  renderProjectState(project);
  applyScene(project);
  setStatusMessage(`Created Alice box "${name}".`);
}

function nextBoxName(project: AliceProject): string {
  while (project.sceneObjects.some((object) => object.name === (boxCounter === 0 ? "box" : `box${boxCounter + 1}`))) {
    boxCounter += 1;
  }
  const name = boxCounter === 0 ? "box" : `box${boxCounter + 1}`;
  boxCounter += 1;
  return name;
}

function applyImportedTextureToSelectedObject(): void {
  if (!lastProject || !selectedObjectName) {
    setErrorMessage(new Error("Select an Alice scene object before applying a texture."));
    return;
  }

  const texture = lastProject.importedAssets?.find((asset) => asset.kind === "texture");
  if (!texture) {
    setErrorMessage(new Error("Import an Alice texture before applying it."));
    return;
  }

  try {
    applyTextureBinding(lastProject, {
      objectName: selectedObjectName,
      textureResourceId: texture.id,
      target: "surface",
    });
    renderProjectState(lastProject);
    applyScene(lastProject);
    setStatusMessage(`Applied Alice texture "${texture.name}".`);
  } catch (error) {
    console.error(error);
    setErrorMessage(error);
  }
}

async function saveCurrentProject(): Promise<void> {
  if (!lastProject) {
    setErrorMessage(new Error("No Alice project is ready to save."));
    return;
  }

  try {
    const bytes = await writeA3P(lastProject, { resources: importedResourceBytes });
    const downloadBytes = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(downloadBytes).set(bytes);
    const blob = new Blob([downloadBytes], {
      type: "application/vnd.alice.a3p",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${safeProjectFilename(lastProject.projectName)}.a3p`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(`Saved Alice project "${lastProject.projectName}".`);
  } catch (error) {
    console.error(error);
    setErrorMessage(error);
  }
}

function safeProjectFilename(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "alice-project";
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

  importModelInput.addEventListener("change", () => {
    void importSelectedAsset(importModelInput, "model");
  });

  importTextureInput.addEventListener("change", () => {
    void importSelectedAsset(importTextureInput, "texture");
  });

  createShapeButton.addEventListener("click", createBox);

  applyTextureButton.addEventListener("click", applyImportedTextureToSelectedObject);

  saveProjectButton.addEventListener("click", () => {
    void saveCurrentProject();
  });

  cameraMoveForward.addEventListener("click", () => {
    updateCameraWorkflow(
      () => moveCamera(cameraWorkflow, { forward: 1 }),
      "Camera moved forward.",
    );
  });

  cameraPreset.addEventListener("change", () => {
    const preset = cameraPreset.value as CameraPreset;
    updateCameraWorkflow(
      () => applyCameraPreset(cameraWorkflow, preset),
      `Camera view set to ${preset}.`,
    );
  });

  cameraFirstPersonToggle.addEventListener("click", () => {
    const nextMode = cameraWorkflow.camera.mode === "first-person" ? "orbit" : "first-person";
    updateCameraWorkflow(
      () => setCameraMode(cameraWorkflow, nextMode),
      nextMode === "first-person"
        ? "First-person camera mode enabled."
        : "Orbit camera mode enabled.",
    );
  });

  cameraSaveMarker.addEventListener("click", () => {
    const requestedName = cameraMarkerName.value;
    updateCameraWorkflow(
      () => saveCameraMarker(cameraWorkflow, { name: requestedName }),
      `Camera marker "${requestedName.trim()}" saved.`,
    );
    cameraMarkerName.value = "";
  });
}

function initializeApplication(): void {
  resizeRenderer();
  installWindowHandlers();
  installInputHandlers();
  renderCameraWorkflow();
  renderProjectState(ensureEditableProject());
  animate();
  setStatusMessage("Choose an .a3p file to begin.");
  setCameraStatusMessage("Camera ready.");
}

initializeApplication();
