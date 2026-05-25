import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AliceMethod, AliceProject, AliceStatement } from "./a3p-parser.js";
import { createTweedleSource } from "./code-generation.js";

export interface HtmlExportViewport {
  width: number;
  height: number;
}

export interface HtmlExportOptions {
  title?: string;
  previewMode?: boolean;
  tweedleSource?: string;
  viewport?: Partial<HtmlExportViewport>;
}

export interface HtmlExportDocument {
  title: string;
  previewMode: boolean;
  tweedleSource: string;
  html: string;
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_STANDALONE_VIEWPORT: HtmlExportViewport = { width: 1280, height: 720 };
const DEFAULT_PREVIEW_VIEWPORT: HtmlExportViewport = { width: 960, height: 540 };
const TYPE_ALIASES: Record<string, string> = {
  WholeNumber: "WholeNumber",
  Integer: "WholeNumber",
  DecimalNumber: "DecimalNumber",
  Double: "DecimalNumber",
  Number: "DecimalNumber",
  Boolean: "Boolean",
  TextString: "TextString",
  String: "TextString",
  void: "void",
};

let cachedThreeModuleSource: string | null = null;

export function exportProjectToHtml(
  project: AliceProject,
  options: HtmlExportOptions = {},
): string {
  return createHtmlExportDocument(project, options).html;
}

export function createHtmlExportDocument(
  project: AliceProject,
  options: HtmlExportOptions = {},
): HtmlExportDocument {
  const previewMode = options.previewMode ?? false;
  const viewport = normalizeViewport(
    options.viewport,
    previewMode ? DEFAULT_PREVIEW_VIEWPORT : DEFAULT_STANDALONE_VIEWPORT,
  );
  const title =
    options.title?.trim() ||
    `${project.projectName || "Alice Project"} — Alice HTML Export`;
  const tweedleSource =
    options.tweedleSource?.trim() || buildEmbeddedTweedleSource(project);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="alice-web-prototype export-html">
  <title>${escapeHtml(title)}</title>
  <style>${buildInlineStyles()}</style>
</head>
<body class="alice-export ${previewMode ? "alice-export--preview" : "alice-export--standalone"}" data-preview-mode="${String(previewMode)}" style="--alice-export-width:${viewport.width}px; --alice-export-height:${viewport.height}px;">
  <main class="alice-export__layout">
    <section class="alice-export__viewer-panel">
      <header class="alice-export__header">
        <div>
          <p class="alice-export__eyebrow">${previewMode ? "IDE preview" : "Standalone HTML export"}</p>
          <h1 class="alice-export__title">${escapeHtml(title)}</h1>
          <p class="alice-export__subtitle">${escapeHtml(project.projectName || "Alice Project")} • ${project.sceneObjects.length} scene objects • self-contained single file</p>
        </div>
        <span class="alice-export__badge">Three.js embedded</span>
      </header>
      <div class="alice-export__scene-shell">
        <div class="alice-export__scene" data-alice-scene aria-label="Alice project preview"></div>
      </div>
      <p class="alice-export__status" data-alice-status>Initializing embedded Three.js scene…</p>
      <p class="alice-export__details" data-alice-details>Embedded Tweedle source is available below for offline viewing.</p>
    </section>
    <section class="alice-export__source-panel">
      <header class="alice-export__source-header">
        <h2>Tweedle source</h2>
        <span class="alice-export__source-badge">Embedded script</span>
      </header>
      <pre class="alice-export__tweedle" data-alice-tweedle></pre>
    </section>
  </main>
  <script id="alice-export-config" type="application/json">${escapeJsonForScript({ title, previewMode, viewport })}</script>
  <script id="alice-project-data" type="application/json">${escapeJsonForScript(project)}</script>
  <script id="alice-tweedle-source" type="application/alice+tweedle">${escapeScriptText(tweedleSource)}</script>
  <script id="alice-embedded-three-source" type="text/plain">${escapeScriptText(getThreeModuleSource())}</script>
  <script type="module">${buildBootstrapScript()}</script>
</body>
</html>`;

  return {
    title,
    previewMode,
    tweedleSource,
    html,
  };
}

export function buildEmbeddedTweedleSource(project: AliceProject): string {
  const className = sanitizeIdentifier(project.projectName || "Program", "Program");
  const methods = project.methods.length > 0
    ? project.methods.map((method) => ({
      name: sanitizeIdentifier(method.name, "method"),
      returnType: method.isFunction
        ? normalizeTweedleType(method.returnType, "Object")
        : "void",
      parameters: method.parameters.map((parameter) => `${normalizeTweedleType(parameter.type, "Object")} ${sanitizeIdentifier(parameter.name, "value")}`),
      body: renderEmbeddedMethodBody(method),
    }))
    : [{
      name: "initializeScene",
      returnType: "void",
      parameters: [],
      body: renderFallbackSceneBody(project),
    }];

  return createTweedleSource(className, methods);
}

function renderEmbeddedMethodBody(method: AliceMethod): string[] {
  const lines = flattenStatementSummaries(method.statements).map((line) => `// ${line}`);
  if (lines.length === 0) {
    lines.push("// No statements serialized for this method.");
  }
  if (method.isFunction) {
    lines.push(`return ${defaultTweedleValue(method.returnType)};`);
  }
  return lines;
}

function renderFallbackSceneBody(project: AliceProject): string[] {
  if (project.sceneObjects.length === 0) {
    return ["// No scene objects were serialized into this export."];
  }
  return project.sceneObjects.map((object) => `// scene includes ${object.name} : ${object.typeName}`);
}

function flattenStatementSummaries(
  statements: readonly AliceStatement[],
  depth = 0,
): string[] {
  const prefix = "  ".repeat(depth);
  const lines: string[] = [];
  for (const statement of statements) {
    lines.push(`${prefix}${summarizeStatement(statement)}`);
    for (const nested of nestedStatementGroups(statement)) {
      lines.push(...flattenStatementSummaries(nested, depth + 1));
    }
  }
  return lines;
}

function nestedStatementGroups(statement: AliceStatement): AliceStatement[][] {
  const groups: AliceStatement[][] = [];
  if (statement.body) groups.push(statement.body);
  if (statement.ifBody) groups.push(statement.ifBody);
  if (statement.elseBody) groups.push(statement.elseBody);
  if (statement.tryBody) groups.push(statement.tryBody);
  if (statement.catchBody) groups.push(statement.catchBody);
  if (statement.defaultCase) groups.push(statement.defaultCase);
  for (const switchCase of statement.cases ?? []) {
    groups.push(switchCase.body);
  }
  return groups;
}

function summarizeStatement(statement: AliceStatement): string {
  switch (statement.kind) {
    case "MethodCall": {
      const receiver = statement.object ? `${statement.object}.` : "";
      const args = statement.arguments?.join(", ") ?? "";
      return `${receiver}${statement.method ?? "method"}(${args})`;
    }
    case "CountLoop":
      return `countUpTo ${statement.countExpression ?? statement.count ?? 0}`;
    case "WhileLoop":
      return `while ${statement.condition ?? "condition"}`;
    case "IfElse":
      return `if ${statement.condition ?? "condition"}`;
    case "Return":
      return `return ${statement.expression ?? "value"}`;
    case "VariableDeclaration":
      return `${normalizeTweedleType(statement.varType, "Object")} ${statement.name ?? "value"} <- ${statement.value ?? "null"}`;
    default:
      return `${statement.kind}${statement.expression ? ` ${statement.expression}` : ""}`;
  }
}

function defaultTweedleValue(typeName: string | undefined): string {
  switch (normalizeTweedleType(typeName, "Object")) {
    case "WholeNumber":
    case "DecimalNumber":
      return "0";
    case "Boolean":
      return "false";
    case "TextString":
      return '""';
    default:
      return "null";
  }
}

function normalizeTweedleType(typeName: string | undefined, fallback: string): string {
  const trimmed = typeName?.trim();
  if (!trimmed) {
    return fallback;
  }
  const alias = TYPE_ALIASES[trimmed];
  if (alias) {
    return alias;
  }
  const shortName = trimmed.split(".").pop() ?? trimmed;
  return sanitizeIdentifier(shortName, fallback);
}

function normalizeViewport(
  viewport: Partial<HtmlExportViewport> | undefined,
  fallback: HtmlExportViewport,
): HtmlExportViewport {
  return {
    width: normalizeDimension(viewport?.width, fallback.width),
    height: normalizeDimension(viewport?.height, fallback.height),
  };
}

function normalizeDimension(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.round(value));
}

function sanitizeIdentifier(name: string, fallback: string): string {
  const sanitized = name
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+/, "")
    .replace(/_+$/, "");
  if (!sanitized) {
    return fallback;
  }
  return /^[A-Za-z_]/.test(sanitized) ? sanitized : `_${sanitized}`;
}

function getThreeModuleSource(): string {
  if (cachedThreeModuleSource !== null) {
    return cachedThreeModuleSource;
  }
  const threeModulePath = resolve(
    MODULE_DIR,
    "../node_modules/three/build/three.module.js",
  );
  cachedThreeModuleSource = readFileSync(threeModulePath, "utf8");
  return cachedThreeModuleSource;
}

function buildInlineStyles(): string {
  return `
:root {
  color-scheme: light dark;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0f172a;
}
body {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  color: #e5eefb;
}
body[data-preview-mode="true"] {
  background: #f5f7fb;
  color: #18212f;
}
* {
  box-sizing: border-box;
}
.alice-export__layout {
  width: min(100%, 1600px);
  margin: 0 auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(320px, 1fr);
  gap: 1.5rem;
}
.alice-export--preview .alice-export__layout {
  grid-template-columns: 1fr;
  max-width: calc(var(--alice-export-width) + 3rem);
}
.alice-export__viewer-panel,
.alice-export__source-panel {
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
}
body[data-preview-mode="true"] .alice-export__viewer-panel,
body[data-preview-mode="true"] .alice-export__source-panel {
  background: #ffffff;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}
.alice-export__viewer-panel {
  padding: 1.5rem;
}
.alice-export__source-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.alice-export__header,
.alice-export__source-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.alice-export__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #93c5fd;
}
body[data-preview-mode="true"] .alice-export__eyebrow {
  color: #2563eb;
}
.alice-export__title,
.alice-export__source-header h2 {
  margin: 0;
  font-size: clamp(1.5rem, 2vw, 2.2rem);
}
.alice-export__subtitle {
  margin: 0.5rem 0 0;
  color: rgba(226, 232, 240, 0.78);
}
body[data-preview-mode="true"] .alice-export__subtitle {
  color: #475569;
}
.alice-export__badge,
.alice-export__source-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  background: rgba(59, 130, 246, 0.18);
  color: #bfdbfe;
}
body[data-preview-mode="true"] .alice-export__badge,
body[data-preview-mode="true"] .alice-export__source-badge {
  background: #dbeafe;
  color: #1d4ed8;
}
.alice-export__scene-shell {
  margin-top: 1.25rem;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #020617;
}
.alice-export__scene {
  width: 100%;
  min-height: var(--alice-export-height);
}
.alice-export__scene canvas {
  display: block;
  width: 100%;
  height: auto;
}
.alice-export__status,
.alice-export__details {
  margin: 1rem 0 0;
  color: rgba(226, 232, 240, 0.82);
}
body[data-preview-mode="true"] .alice-export__status,
body[data-preview-mode="true"] .alice-export__details {
  color: #475569;
}
.alice-export__source-header {
  padding: 1.25rem 1.25rem 0;
}
.alice-export__tweedle {
  margin: 1rem 0 0;
  padding: 1.25rem;
  min-height: 320px;
  overflow: auto;
  border-radius: 0 0 20px 20px;
  background: rgba(2, 6, 23, 0.72);
  color: #e2e8f0;
  font: 500 0.95rem/1.55 "Fira Code", "Cascadia Code", Consolas, monospace;
  white-space: pre-wrap;
}
body[data-preview-mode="true"] .alice-export__tweedle {
  background: #f8fafc;
  color: #0f172a;
}
@media (max-width: 1100px) {
  .alice-export__layout {
    grid-template-columns: 1fr;
  }
}
`;
}

function buildBootstrapScript(): string {
  return `const readText = (id) => document.getElementById(id)?.textContent ?? "";
const config = JSON.parse(readText("alice-export-config") || "{}");
const project = JSON.parse(readText("alice-project-data") || "{}");
const sceneHost = document.querySelector("[data-alice-scene]");
const status = document.querySelector("[data-alice-status]");
const details = document.querySelector("[data-alice-details]");
const tweedleOutput = document.querySelector("[data-alice-tweedle]");
if (tweedleOutput) {
  tweedleOutput.textContent = readText("alice-tweedle-source");
}
const writeText = (node, message) => {
  if (node instanceof HTMLElement) {
    node.textContent = message;
  }
};
const embeddedThreeSource = readText("alice-embedded-three-source");
const threeUrl = URL.createObjectURL(new Blob([embeddedThreeSource], { type: "text/javascript" }));
try {
  const THREE = await import(threeUrl);
  if (!(sceneHost instanceof HTMLElement)) {
    throw new Error("Missing scene host");
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: Boolean(config.previewMode),
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  sceneHost.replaceChildren(renderer.domElement);

  const nextViewport = () => ({
    width: Number(config.viewport?.width) || Math.max(sceneHost.clientWidth || 960, 1),
    height: Number(config.viewport?.height) || Math.max(sceneHost.clientHeight || 540, 1),
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.previewMode ? 0xf5f7fb : 0x0b1120);

  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 1000);
  camera.position.set(12, 9, 16);
  camera.lookAt(0, 1, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(10, 18, 12);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const fillLight = new THREE.HemisphereLight(0xffffff, 0x2d6a4f, 0.6);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(60, 30, 0x8b949e, 0x3d444d);
  grid.position.y = 0;
  scene.add(grid);

  const createObjectMesh = (object) => {
    const sizeSpec = object.size || {};
    const width = Math.max(Number(sizeSpec.width) || 1, 0.5);
    const height = Math.max(Number(sizeSpec.height) || 1, 0.5);
    const depth = Math.max(Number(sizeSpec.depth) || 1, 0.5);
    const typeName = String(object.typeName || "");
    let geometry;
    if (typeName.includes("SBall") || typeName.includes("Sphere")) {
      geometry = new THREE.SphereGeometry(Math.max(width, height, depth) / 2, 24, 24);
    } else if (typeName.includes("SCylinder")) {
      geometry = new THREE.CylinderGeometry(width / 2, width / 2, height, 24);
    } else if (typeName.includes("SCone")) {
      geometry = new THREE.ConeGeometry(width / 2, height, 24);
    } else {
      geometry = new THREE.BoxGeometry(width, height, depth);
    }

    let color = 0x8888cc;
    if (typeName.includes("SProp")) {
      color = 0xb5651d;
    } else if (typeName.includes("SModel") || typeName.includes("SJointedModel")) {
      color = 0xcc7722;
    } else if (typeName.includes("SCamera")) {
      color = 0x64748b;
    }

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08 }),
    );
    const position = object.position || {};
    mesh.position.set(
      Number(position.x) || 0,
      Number(position.y) || height / 2,
      Number(position.z) || 0,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const sceneObjects = Array.isArray(project.sceneObjects) ? project.sceneObjects : [];
  const visibleObjects = sceneObjects.filter((object) => {
    const typeName = String(object.typeName || "");
    return !typeName.includes("SGround") && !typeName.includes("SCamera");
  });

  for (const object of visibleObjects) {
    scene.add(createObjectMesh(object));
  }

  const bounds = new THREE.Box3().setFromObject(scene);
  const center = bounds.isEmpty()
    ? new THREE.Vector3(0, 1, 0)
    : bounds.getCenter(new THREE.Vector3());
  const sizeVector = bounds.isEmpty()
    ? new THREE.Vector3(8, 4, 8)
    : bounds.getSize(new THREE.Vector3());
  const radius = Math.max(sizeVector.x, sizeVector.y, sizeVector.z, 6);
  camera.position.set(
    center.x + radius,
    center.y + radius * 0.7,
    center.z + radius * 1.1,
  );
  camera.lookAt(center);

  const render = () => {
    const viewport = nextViewport();
    renderer.setSize(viewport.width, viewport.height, false);
    camera.aspect = viewport.width / viewport.height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  render();
  if (!config.previewMode) {
    window.addEventListener("resize", render);
  }

  writeText(
    status,
    "Loaded " + String(project.projectName || "Alice Project") + " into an embedded Three.js scene.",
  );
  writeText(
    details,
    String(visibleObjects.length) + " scene objects and embedded Tweedle source are available offline.",
  );
} catch (error) {
  console.error(error);
  writeText(
    status,
    "Preview unavailable: " + (error instanceof Error ? error.message : String(error)),
  );
  writeText(
    details,
    "This export remains self-contained; open it in a WebGL-capable browser.",
  );
} finally {
  URL.revokeObjectURL(threeUrl);
}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function escapeScriptText(value: string): string {
  return value.replace(/<\//g, "<\\/");
}
