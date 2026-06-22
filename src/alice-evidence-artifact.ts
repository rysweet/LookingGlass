export const ALICE_EVIDENCE_FORMAT = "alice-visible-behavior-evidence" as const;
export const ALICE_EVIDENCE_VERSION = 1 as const;
export const ALICE_EVIDENCE_MIME_TYPE = "application/json" as const;

const MAX_VISIBLE_OBJECTS = 200;
const MAX_FILENAME_LENGTH = 120;

export type AliceEvidenceExportMethod = "download" | "native-share";
export type AliceEvidenceShareOutcome = "prepared" | "completed" | "unavailable";

export interface AliceEvidenceVector {
  x: number;
  y: number;
  z: number;
}

export interface AliceEvidenceCanvasSnapshot {
  available: boolean;
  reason?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface AliceEvidenceVisibleObject {
  name: string;
  typeName: string;
  visible: boolean;
  position: AliceEvidenceVector;
}

export interface AliceEvidenceVisibleBehavior {
  statusText: string;
  viewport: {
    width: number;
    height: number;
    canvasSnapshot: AliceEvidenceCanvasSnapshot;
  };
  camera: {
    mode: string;
    position: AliceEvidenceVector;
    target: AliceEvidenceVector;
  };
  objects: AliceEvidenceVisibleObject[];
}

export interface AliceEvidenceArtifact {
  format: typeof ALICE_EVIDENCE_FORMAT;
  version: typeof ALICE_EVIDENCE_VERSION;
  application: {
    name: "Alice";
    runtime: "alice-web";
  };
  world: {
    name: string;
    aliceVersion: string;
    objectCount: number;
  };
  run: {
    id: string;
    capturedAt: string;
  };
  visibleBehavior: AliceEvidenceVisibleBehavior;
  export: {
    method: AliceEvidenceExportMethod;
    requestedAt: string;
    filename: string;
    mimeType: typeof ALICE_EVIDENCE_MIME_TYPE;
    share?: {
      available: boolean;
      outcome: AliceEvidenceShareOutcome;
    };
  };
}

export interface AliceEvidenceArtifactInput {
  world: {
    name: string;
    aliceVersion: string;
    objectCount: number;
  };
  run: {
    id: string;
    capturedAt: string;
  };
  visibleBehavior: AliceEvidenceVisibleBehavior;
  export: {
    method: AliceEvidenceExportMethod;
    requestedAt: string;
    filename: string;
    mimeType?: string;
    share?: {
      available: boolean;
      outcome: AliceEvidenceShareOutcome;
    };
  };
}

export interface AliceEvidenceValidationResult {
  valid: boolean;
  errors: string[];
}

export function createAliceEvidenceArtifact(input: AliceEvidenceArtifactInput): AliceEvidenceArtifact {
  return {
    format: ALICE_EVIDENCE_FORMAT,
    version: ALICE_EVIDENCE_VERSION,
    application: {
      name: "Alice",
      runtime: "alice-web",
    },
    world: {
      name: stringValue(input.world.name),
      aliceVersion: stringValue(input.world.aliceVersion),
      objectCount: finiteNonNegativeInteger(input.world.objectCount),
    },
    run: {
      id: stringValue(input.run.id),
      capturedAt: stringValue(input.run.capturedAt),
    },
    visibleBehavior: {
      statusText: stringValue(input.visibleBehavior.statusText),
      viewport: {
        width: finitePositiveInteger(input.visibleBehavior.viewport.width),
        height: finitePositiveInteger(input.visibleBehavior.viewport.height),
        canvasSnapshot: sanitizeCanvasSnapshot(input.visibleBehavior.viewport.canvasSnapshot),
      },
      camera: {
        mode: stringValue(input.visibleBehavior.camera.mode),
        position: sanitizeVector(input.visibleBehavior.camera.position),
        target: sanitizeVector(input.visibleBehavior.camera.target),
      },
      objects: input.visibleBehavior.objects.slice(0, MAX_VISIBLE_OBJECTS).map(sanitizeVisibleObject),
    },
    export: {
      method: input.export.method,
      requestedAt: stringValue(input.export.requestedAt),
      filename: sanitizeAliceEvidenceFilename(input.export.filename),
      mimeType: ALICE_EVIDENCE_MIME_TYPE,
      ...(input.export.share ? {
        share: {
          available: Boolean(input.export.share.available),
          outcome: input.export.share.outcome,
        },
      } : {}),
    },
  };
}

export function serializeAliceEvidenceArtifact(artifact: AliceEvidenceArtifact): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export function validateAliceEvidenceArtifact(value: unknown): AliceEvidenceValidationResult {
  const errors: string[] = [];
  const artifact = recordValue(value);

  if (!artifact) {
    return { valid: false, errors: ["Alice evidence artifact must be an object."] };
  }

  expectEqual(artifact.format, ALICE_EVIDENCE_FORMAT, "format", errors);
  expectEqual(artifact.version, ALICE_EVIDENCE_VERSION, "version", errors);

  const application = nestedRecord(artifact.application, "application", errors);
  if (application) {
    expectEqual(application.name, "Alice", "application.name", errors);
    expectEqual(application.runtime, "alice-web", "application.runtime", errors);
  }

  const world = nestedRecord(artifact.world, "world", errors);
  if (world) {
    expectNonEmptyString(world.name, "world.name", errors);
    expectNonEmptyString(world.aliceVersion, "world.aliceVersion", errors);
    expectPositiveInteger(world.objectCount, "world.objectCount", errors);
  }

  const run = nestedRecord(artifact.run, "run", errors);
  if (run) {
    expectNonEmptyString(run.id, "run.id", errors);
    expectIsoTimestamp(run.capturedAt, "run.capturedAt", errors);
  }

  const visibleBehavior = nestedRecord(artifact.visibleBehavior, "visibleBehavior", errors);
  if (visibleBehavior) {
    expectNonEmptyString(visibleBehavior.statusText, "visibleBehavior.statusText", errors);
    validateViewport(visibleBehavior.viewport, errors);
    validateCamera(visibleBehavior.camera, errors);
    validateVisibleObjects(visibleBehavior.objects, errors);
  }

  const exported = nestedRecord(artifact.export, "export", errors);
  if (exported) {
    if (exported.method !== "download" && exported.method !== "native-share") {
      errors.push("export.method must be download or native-share.");
    }
    expectIsoTimestamp(exported.requestedAt, "export.requestedAt", errors);
    expectEqual(exported.mimeType, ALICE_EVIDENCE_MIME_TYPE, "export.mimeType", errors);
    if (typeof exported.filename !== "string" || exported.filename !== sanitizeAliceEvidenceFilename(exported.filename)) {
      errors.push("export.filename must be a conservative .json filename.");
    }
    if (exported.share !== undefined) {
      const share = nestedRecord(exported.share, "export.share", errors);
      if (share) {
        if (typeof share.available !== "boolean") {
          errors.push("export.share.available must be a boolean.");
        }
        if (!["prepared", "completed", "unavailable"].includes(String(share.outcome))) {
          errors.push("export.share.outcome must be prepared, completed, or unavailable.");
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function sanitizeAliceEvidenceFilename(value: string): string {
  const withoutExtension = value.replace(/\.json$/i, "");
  const normalized = withoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = (normalized || "alice-evidence").slice(0, MAX_FILENAME_LENGTH - ".json".length);
  return `${base.replace(/[.-]+$/g, "") || "alice-evidence"}.json`;
}

function sanitizeVisibleObject(object: AliceEvidenceVisibleObject): AliceEvidenceVisibleObject {
  return {
    name: stringValue(object.name),
    typeName: stringValue(object.typeName),
    visible: Boolean(object.visible),
    position: sanitizeVector(object.position),
  };
}

function sanitizeCanvasSnapshot(snapshot: AliceEvidenceCanvasSnapshot): AliceEvidenceCanvasSnapshot {
  return {
    available: Boolean(snapshot.available),
    ...(snapshot.reason ? { reason: stringValue(snapshot.reason) } : {}),
    ...(snapshot.width ? { width: finitePositiveInteger(snapshot.width) } : {}),
    ...(snapshot.height ? { height: finitePositiveInteger(snapshot.height) } : {}),
    ...(snapshot.mimeType ? { mimeType: stringValue(snapshot.mimeType) } : {}),
  };
}

function sanitizeVector(vector: AliceEvidenceVector): AliceEvidenceVector {
  return {
    x: finiteNumber(vector.x),
    y: finiteNumber(vector.y),
    z: finiteNumber(vector.z),
  };
}

function stringValue(value: string): string {
  return value.trim();
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : 0;
}

function finitePositiveInteger(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 1;
}

function finiteNonNegativeInteger(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nestedRecord(value: unknown, label: string, errors: string[]): Record<string, unknown> | null {
  const record = recordValue(value);
  if (!record) {
    errors.push(`${label} must be an object.`);
  }
  return record;
}

function expectEqual(actual: unknown, expected: unknown, label: string, errors: string[]): void {
  if (actual !== expected) {
    errors.push(`${label} must be ${String(expected)}.`);
  }
}

function expectNonEmptyString(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${label} must be a non-empty string.`);
  }
}

function expectIsoTimestamp(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    errors.push(`${label} must be an ISO timestamp.`);
  }
}

function expectPositiveInteger(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    errors.push(`${label} must be a positive integer.`);
  }
}

function validateViewport(value: unknown, errors: string[]): void {
  const viewport = nestedRecord(value, "visibleBehavior.viewport", errors);
  if (!viewport) {
    return;
  }
  expectPositiveInteger(viewport.width, "visibleBehavior.viewport.width", errors);
  expectPositiveInteger(viewport.height, "visibleBehavior.viewport.height", errors);
  const snapshot = nestedRecord(viewport.canvasSnapshot, "visibleBehavior.viewport.canvasSnapshot", errors);
  if (snapshot && typeof snapshot.available !== "boolean") {
    errors.push("visibleBehavior.viewport.canvasSnapshot.available must be a boolean.");
  }
}

function validateCamera(value: unknown, errors: string[]): void {
  const camera = nestedRecord(value, "visibleBehavior.camera", errors);
  if (!camera) {
    return;
  }
  expectNonEmptyString(camera.mode, "visibleBehavior.camera.mode", errors);
  validateVector(camera.position, "visibleBehavior.camera.position", errors);
  validateVector(camera.target, "visibleBehavior.camera.target", errors);
}

function validateVisibleObjects(value: unknown, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("visible behavior must include at least one visible object.");
    return;
  }
  for (const [index, objectValue] of value.entries()) {
    const object = nestedRecord(objectValue, `visibleBehavior.objects[${index}]`, errors);
    if (!object) {
      continue;
    }
    expectNonEmptyString(object.name, `visibleBehavior.objects[${index}].name`, errors);
    expectNonEmptyString(object.typeName, `visibleBehavior.objects[${index}].typeName`, errors);
    if (typeof object.visible !== "boolean") {
      errors.push(`visibleBehavior.objects[${index}].visible must be a boolean.`);
    }
    validateVector(object.position, `visibleBehavior.objects[${index}].position`, errors);
  }
}

function validateVector(value: unknown, label: string, errors: string[]): void {
  const vector = nestedRecord(value, label, errors);
  if (!vector) {
    return;
  }
  for (const axis of ["x", "y", "z"]) {
    if (typeof vector[axis] !== "number" || !Number.isFinite(vector[axis])) {
      errors.push(`${label}.${axis} must be a finite number.`);
    }
  }
}
