import JSZip from "jszip";
import { ImageData, createCanvas } from "canvas";
import type { AliceProject } from "./a3p-parser.js";
import { writeA3P, type WriteA3POptions } from "./a3p-writer.js";
import {
  createHtmlExportDocument,
  type HtmlExportDocument,
  type HtmlExportOptions,
} from "./export-html.js";
import { assertSafeWritablePath } from "./project-io/path-security.js";
import {
  generateTypeScriptSource,
  type TypeScriptSource,
  type TypeScriptSourceManifest,
} from "./code-generation/typescript-source.js";

export interface ProjectExportResource {
  path: string;
  bytes: Uint8Array | string;
  mimeType?: string;
}

export interface StandaloneHtmlExport {
  title: string;
  html: string;
  document: HtmlExportDocument;
  embeddedResources: Record<string, string>;
}

export interface ScreenshotCaptureOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  label?: string;
  pixels?: Uint8ClampedArray;
}

export interface ScreenshotImage {
  bytes: Uint8Array;
  mimeType: "image/png";
  width: number;
  height: number;
}

export interface VideoExportOptions extends ScreenshotCaptureOptions {
  frameCount?: number;
  fps?: number;
  labels?: string[];
}

export interface VideoFrame extends ScreenshotImage {
  index: number;
  timestampMs: number;
}

export interface VideoExport {
  fps: number;
  frames: VideoFrame[];
}

export interface ProjectPackagingOptions {
  a3p?: WriteA3POptions;
  html?: HtmlExportOptions;
  resources?: ProjectExportResource[];
  dependencies?: string[];
  thumbnail?: ScreenshotCaptureOptions;
}

export interface PackagedProject {
  archive: Uint8Array;
  manifest: {
    projectName: string;
    dependencies: string[];
    resourceCount: number;
    generatedEntries: string[];
  };
  entryNames: string[];
}

export interface TypeScriptSourceArchive {
  archive: Uint8Array;
  manifest: TypeScriptSourceManifest;
  entryNames: string[];
}

export class A3PExporter {
  async export(project: AliceProject, options: WriteA3POptions = {}): Promise<Uint8Array> {
    return writeA3P(project, options);
  }
}

export class HTMLExporter {
  async export(
    project: AliceProject,
    options: HtmlExportOptions & { resources?: ProjectExportResource[] } = {},
  ): Promise<StandaloneHtmlExport> {
    const { resources = [], ...htmlOptions } = options;
    const document = createHtmlExportDocument(project, htmlOptions);
    const embeddedResources = Object.fromEntries(
      resources.map((resource) => [resource.path, resourceToDataUrl(resource)]),
    );
    const html = injectBeforeBodyEnd(
      document.html,
      buildResourceScript(embeddedResources),
    );

    return {
      title: document.title,
      html,
      document,
      embeddedResources,
    };
  }
}

export class ScreenshotCapture {
  async capture(options: ScreenshotCaptureOptions = {}): Promise<ScreenshotImage> {
    const width = normalizeDimension(options.width, 1280);
    const height = normalizeDimension(options.height, 720);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.fillStyle = options.backgroundColor ?? "#1f2937";
    context.fillRect(0, 0, width, height);

    if (options.pixels && options.pixels.length === width * height * 4) {
      context.putImageData(new ImageData(options.pixels, width, height), 0, 0);
    }

    if (options.label?.trim()) {
      context.fillStyle = "rgba(255, 255, 255, 0.92)";
      context.font = `${Math.max(16, Math.round(width / 28))}px sans-serif`;
      context.fillText(options.label.trim(), 24, Math.max(36, Math.round(height / 12)));
    }

    return {
      bytes: new Uint8Array(canvas.toBuffer("image/png")),
      mimeType: "image/png",
      width,
      height,
    };
  }
}

export class VideoExporter {
  constructor(private readonly screenshotCapture = new ScreenshotCapture()) {
  }

  async record(project: AliceProject, options: VideoExportOptions = {}): Promise<VideoExport> {
    const frameCount = Math.max(1, Math.floor(options.frameCount ?? 1));
    const fps = Math.max(1, Math.floor(options.fps ?? 30));
    const frames: VideoFrame[] = [];

    for (let index = 0; index < frameCount; index += 1) {
      const screenshot = await this.screenshotCapture.capture({
        ...options,
        label: options.labels?.[index] ?? `${project.projectName || "Project"} frame ${index + 1}`,
      });
      frames.push({
        ...screenshot,
        index,
        timestampMs: Math.round((index * 1000) / fps),
      });
    }

    return { fps, frames };
  }
}

export class ProjectPackager {
  constructor(
    private readonly a3pExporter = new A3PExporter(),
    private readonly htmlExporter = new HTMLExporter(),
    private readonly screenshotCapture = new ScreenshotCapture(),
  ) {
  }

  async packageProject(
    project: AliceProject,
    options: ProjectPackagingOptions = {},
  ): Promise<PackagedProject> {
    const zip = new JSZip();
    const slug = slugify(project.projectName || "project");
    const resources = (options.resources ?? []).map(validateResourcePath);
    const a3p = await this.a3pExporter.export(project, options.a3p);
    const html = await this.htmlExporter.export(project, {
      ...options.html,
      resources,
    });
    const thumbnail = await this.screenshotCapture.capture(options.thumbnail);

    const generatedEntries = [
      addZipFile(zip, `${slug}.a3p`, a3p),
      addZipFile(zip, `${slug}.html`, html.html),
      addZipFile(zip, "thumbnail.png", thumbnail.bytes),
    ];

    for (const resource of resources) {
      addZipFile(zip, resource.path, normalizeResourceBytes(resource.bytes));
    }

    const dependencies = [...new Set(options.dependencies ?? [])].sort();
    const manifest = {
      projectName: project.projectName || "Project",
      dependencies,
      resourceCount: resources.length,
      generatedEntries,
    };
    addZipFile(zip, "manifest.json", JSON.stringify(manifest, null, 2));

    const archive = await zip.generateAsync({ type: "uint8array" });
    return {
      archive,
      manifest,
      entryNames: Object.keys(zip.files).sort(),
    };
  }
}

export class TypeScriptExporter {
  constructor(
    private readonly generator: (project: AliceProject) => TypeScriptSource = generateTypeScriptSource,
  ) {
  }

  async export(project: AliceProject): Promise<TypeScriptSourceArchive> {
    const generated = this.generator(project);
    validateGeneratedSource(generated);

    const zip = new JSZip();
    const packageEntries = buildTypeScriptPackageEntries(generated);
    for (const entry of packageEntries) {
      addDeterministicZipFile(zip, `alice-web-typescript-source/${entry.path}`, entry.content);
    }

    const archive = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    return {
      archive,
      manifest: generated.manifest,
      entryNames: Object.keys(zip.files).sort(),
    };
  }
}

function buildResourceScript(resources: Record<string, string>): string {
  if (Object.keys(resources).length === 0) {
    return "";
  }
  return `<script id="alice-export-resources" type="application/json">${escapeScriptText(JSON.stringify(resources))}</script>`;
}

function addZipFile(zip: JSZip, path: string, bytes: Uint8Array | string): string {
  const safePath = assertSafeWritablePath(path);
  zip.file(safePath, bytes);
  return safePath;
}

function addDeterministicZipFile(zip: JSZip, path: string, bytes: Uint8Array | string): string {
  const safePath = assertSafeWritablePath(path);
  zip.file(safePath, bytes, {
    createFolders: false,
    date: new Date(0),
  });
  return safePath;
}

function validateGeneratedSource(generated: TypeScriptSource): void {
  if (generated.entries.length === 0) {
    throw new Error("TypeScript source export cannot create an empty archive.");
  }

  const seen = new Set<string>();
  for (const entry of generated.entries) {
    const safePath = assertSafeWritablePath(entry.path);
    if (safePath !== entry.path) {
      throw new Error(`TypeScript source entry path changed during validation: ${entry.path}`);
    }
    if (seen.has(entry.path)) {
      throw new Error(`TypeScript source export contains duplicate entry: ${entry.path}`);
    }
    if (entry.content.trim().length === 0) {
      throw new Error(`TypeScript source export contains empty entry: ${entry.path}`);
    }
    seen.add(entry.path);
  }

  if (generated.manifest.files.length !== generated.entries.length) {
    throw new Error("TypeScript source manifest files must match generated entries.");
  }
  for (const file of generated.manifest.files) {
    if (!seen.has(file)) {
      throw new Error(`TypeScript source manifest references missing entry: ${file}`);
    }
  }
}

function buildTypeScriptPackageEntries(generated: TypeScriptSource): TypeScriptSourceEntry[] {
  const entries: TypeScriptSourceEntry[] = [
    { path: "manifest.json", content: `${JSON.stringify(generated.manifest, null, 2)}\n` },
    { path: "package.json", content: `${JSON.stringify(createTypeScriptPackageJson(generated.manifest), null, 2)}\n` },
    { path: "tsconfig.json", content: `${JSON.stringify(createTypeScriptTsconfig(), null, 2)}\n` },
    { path: "README.md", content: createTypeScriptReadme(generated.manifest) },
    ...generated.entries,
  ];
  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

interface TypeScriptSourceEntry {
  path: string;
  content: string;
}

function createTypeScriptPackageJson(manifest: TypeScriptSourceManifest): Record<string, unknown> {
  return {
    name: "alice-web-typescript-source",
    private: true,
    type: "module",
    description: "Alice web TypeScript source export for an Alice project.",
    scripts: {
      typecheck: "tsc --noEmit",
    },
    devDependencies: {
      typescript: "^5.7.0",
    },
    alice: {
      product: manifest.product,
      runtime: manifest.runtime,
      projectName: manifest.projectName,
      entryPoint: manifest.entryPoint,
    },
  };
}

function createTypeScriptTsconfig(): Record<string, unknown> {
  return {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["src/**/*.ts"],
  };
}

function createTypeScriptReadme(manifest: TypeScriptSourceManifest): string {
  return [
    "# Alice web TypeScript source export",
    "",
    `Project: ${manifest.projectName}`,
    "",
    "This archive contains readable TypeScript source generated from an Alice project.",
    "It is intended for source handoff, review, and type-checking outside the running Alice web server.",
    "",
    "## Contents",
    "",
    "- `manifest.json` describes the deterministic export metadata.",
    "- `src/project.ts` assembles the generated Alice project.",
    "- `src/scene.ts` describes scene objects and runtime call recording.",
    "- `src/procedures/*.ts` contains generated Alice procedure and function source.",
    "- `src/runtime.ts` contains the small local runtime shim and explicit unsupported-behavior error.",
    "",
    "Run `npm install` and `npm run typecheck` in this directory to type-check the generated source.",
    "Unsupported Alice runtime behavior throws `UnsupportedAliceRuntimeBehavior` instead of being silently omitted.",
    "",
  ].join("\n");
}

function validateResourcePath(resource: ProjectExportResource): ProjectExportResource {
  return {
    ...resource,
    path: assertSafeWritablePath(resource.path),
  };
}

function injectBeforeBodyEnd(html: string, injectedMarkup: string): string {
  if (!injectedMarkup) {
    return html;
  }
  return html.includes("</body>")
    ? html.replace("</body>", `${injectedMarkup}</body>`)
    : `${html}${injectedMarkup}`;
}

function resourceToDataUrl(resource: ProjectExportResource): string {
  const mimeType = resource.mimeType ?? inferMimeType(resource.path);
  return `data:${mimeType};base64,${Buffer.from(normalizeResourceBytes(resource.bytes)).toString("base64")}`;
}

function normalizeResourceBytes(bytes: Uint8Array | string): Uint8Array {
  return typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
}

function inferMimeType(path: string): string {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".txt")) return "text/plain;charset=utf-8";
  return "application/octet-stream";
}

function normalizeDimension(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.round(value));
}

function slugify(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "project";
}

function escapeScriptText(value: string): string {
  return value.replace(/<\//g, "<\\/");
}
