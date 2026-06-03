import { JSDOM } from "jsdom";
import * as Alice from "../src/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

export { Alice, fs, path };

export type TutorialStatus = "PASS" | "FAIL" | "PARTIAL";

export interface TutorialReport {
  tutorial: string;
  script: string[];
  result: TutorialStatus;
  output: string[];
  gaps: string[];
  wouldBlock: boolean;
}

const HERE = path.dirname(new URL(import.meta.url).pathname);
export const ARTIFACT_DIR = path.join(HERE, "artifacts");
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

let domReady = false;

export function ensureDomGlobals(): void {
  if (domReady) {
    return;
  }
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.window = dom.window as unknown as typeof globalThis.window;
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
  globalThis.CustomEvent = dom.window.CustomEvent as typeof CustomEvent;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Event = dom.window.Event as typeof Event;
  globalThis.EventTarget = dom.window.EventTarget as typeof EventTarget;
  if (typeof globalThis.requestAnimationFrame === "undefined") {
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      return globalThis.setTimeout(() => callback(Date.now()), 16) as unknown as number;
    }) as typeof requestAnimationFrame;
  }
  if (typeof globalThis.cancelAnimationFrame === "undefined") {
    globalThis.cancelAnimationFrame = ((handle: number) => {
      globalThis.clearTimeout(handle);
    }) as typeof cancelAnimationFrame;
  }
  domReady = true;
}

export function createBaseArchive(projectName: string) {
  ensureDomGlobals();
  return Alice.ProjectTemplate.createProjectFromTemplate("empty-world", { projectName });
}

export function typeNameForEntityCategory(category: string): string {
  switch (category.toUpperCase()) {
    case "BIPED":
      return "org.lgna.story.SBiped";
    case "QUADRUPED":
      return "org.lgna.story.SQuadruped";
    case "FLYER":
      return "org.lgna.story.SFlyer";
    case "SWIMMER":
    case "FISH":
    case "MARINE_MAMMAL":
      return "org.lgna.story.SSwimmer";
    case "SLITHERER":
      return "org.lgna.story.SSlitherer";
    case "PROP":
      return "org.lgna.story.SProp";
    default:
      return "org.lgna.story.SProp";
  }
}

export function sceneObject(
  name: string,
  typeName: string,
  position = { x: 0, y: 0, z: 0 },
  orientation = { x: 0, y: 0, z: 0, w: 1 },
  size = { width: 1, height: 1, depth: 1 },
  resourceType: string | null = null,
) {
  return {
    name,
    typeName,
    resourceType,
    position: { ...position },
    orientation: { ...orientation },
    size: { ...size },
  };
}

export async function saveArchiveToFile(fileName: string, archive: {
  project: unknown;
  manifest: Record<string, unknown> | null;
  resources: Map<string, Uint8Array>;
  resourceEntries: unknown[];
  thumbnail: Uint8Array | null;
  versionInfo: unknown;
}) {
  ensureDomGlobals();
  const bytes = await Alice.ProjectIo.writeProject(archive as Parameters<typeof Alice.ProjectIo.writeProject>[0]);
  const filePath = path.join(ARTIFACT_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(bytes));
  const roundTrip = await Alice.ProjectIo.readProject(new Uint8Array(fs.readFileSync(filePath)));
  return { filePath, bytes: bytes.length, roundTrip };
}

export function yQuarterTurnQuaternion() {
  return Alice.SceneGraph.quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI / 2);
}

export function approximatelyEqual(left: number, right: number, epsilon = 1e-4): boolean {
  return Math.abs(left - right) <= epsilon;
}

export function vec3String(value: { x: number; y: number; z: number }): string {
  return `{x:${value.x.toFixed(3)}, y:${value.y.toFixed(3)}, z:${value.z.toFixed(3)}}`;
}

export function quatString(value: { x: number; y: number; z: number; w: number }): string {
  return `{x:${value.x.toFixed(3)}, y:${value.y.toFixed(3)}, z:${value.z.toFixed(3)}, w:${value.w.toFixed(3)}}`;
}

export function printReport(report: TutorialReport): void {
  console.log(JSON.stringify(report, null, 2));
}
