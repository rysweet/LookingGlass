#!/usr/bin/env node
/* v8 ignore file -- exercised through tools/eatme-reopen-project subprocess contract tests. */
import * as fs from "fs";
import * as path from "path";
import { parseA3P } from "../a3p-parser.js";
import { readProject, writeProject } from "../project-io.js";

interface Args {
  savedProject: string;
  reopenSelector: string;
  evidenceDir: string;
  json: boolean;
}

const REOPENED_PROJECT_ARTIFACT = "reopened-project.a3p";
const REOPEN_ARTIFACT = "project-reopen.json";
const REOPENED_STATE_ARTIFACT = "reopened-state.json";
const CANONICAL_SOURCE_SAVED_PROJECT = "project-save/saved-project.a3p";

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const parsed: Partial<Args> = {};
  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--saved-project":
        parsed.savedProject = args[++i];
        break;
      case "--reopen-selector":
        parsed.reopenSelector = args[++i];
        break;
      case "--evidence-dir":
        parsed.evidenceDir = args[++i];
        break;
      case "--json":
        parsed.json = true;
        break;
      case "--help":
        printUsageAndExit(0);
        break;
      default:
        if (args[i]?.startsWith("-")) {
          throw new Error(`Unknown option: ${args[i]}`);
        }
    }
  }
  if (!parsed.savedProject) throw new Error("--saved-project is required");
  if (!parsed.reopenSelector) throw new Error("--reopen-selector is required");
  if (!parsed.evidenceDir) throw new Error("--evidence-dir is required");
  if (!parsed.json) throw new Error("--json is required");
  return parsed as Args;
}

function printUsageAndExit(code: number): never {
  const usage = "Usage: reopen-project --saved-project <file.a3p> --reopen-selector <selector> --evidence-dir <dir> --json";
  if (code === 0) {
    console.log(usage);
  } else {
    console.error(usage);
  }
  process.exit(code);
}

function ensureReadableProject(projectPath: string): void {
  if (!projectPath.endsWith(".a3p")) {
    throw new Error("--saved-project must point to an .a3p file");
  }
  if (!fs.existsSync(projectPath)) {
    throw new Error(`saved project file does not exist: ${projectPath}`);
  }
}

function sourceSavedProjectArtifact(savedProject: string, evidenceDir: string): string {
  const runDir = path.dirname(path.resolve(evidenceDir));
  const relative = path.relative(runDir, path.resolve(savedProject)).split(path.sep).join("/");
  if (relative.startsWith("../") || relative === ".." || path.isAbsolute(relative)) {
    throw new Error("--saved-project must be under the same run evidence directory as --evidence-dir");
  }
  if (!relative.startsWith("project-save/")) {
    throw new Error("--saved-project must come from the same run's project-save evidence directory");
  }
  if (relative !== CANONICAL_SOURCE_SAVED_PROJECT) {
    throw new Error("--saved-project must be the same run's project-save/saved-project.a3p artifact");
  }
  return relative;
}

function methodNames(project: Awaited<ReturnType<typeof parseA3P>>): string[] {
  const sceneMethods = project.types
    ?.find((type) => type.superTypeName?.includes("SScene"))
    ?.methods?.map((method) => method.name) ?? [];
  return Array.from(new Set([...project.methods.map((method) => method.name), ...sceneMethods])).sort();
}

function readJsonIfExists(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function methodNameFromSelector(selector: unknown): string | null {
  if (typeof selector !== "string" || selector.trim() === "") {
    return null;
  }
  return selector.trim().replace(/^(scene|world)\./, "");
}

interface TransformProof {
  readonly objectId: string;
  readonly positionAfter: { x: number; y: number; z: number };
}

function readMovementProof(evidenceDir: string, names: readonly string[]): {
  procedureSelector: string;
  methodName: string;
  movement: Record<string, unknown>;
} {
  const runDir = path.dirname(path.resolve(evidenceDir));
  const candidates = [
    path.join(runDir, "procedure-edit", "first-lesson-code-editor-action-proof.json"),
    path.join(runDir, "edit-procedure", "first-lesson-code-editor-action-proof.json"),
  ];

  for (const candidate of candidates) {
    const proof = readJsonIfExists(candidate);
    const methodName = methodNameFromSelector(proof?.procedure_selector) ?? (
      typeof proof?.method_name === "string" ? proof.method_name : null
    );
    if (methodName && names.includes(methodName)) {
      return {
        procedureSelector: typeof proof?.procedure_selector === "string"
          ? proof.procedure_selector
          : `scene.${methodName}`,
        methodName,
        movement: proof?.movement && typeof proof.movement === "object" && !Array.isArray(proof.movement)
          ? proof.movement as Record<string, unknown>
          : {
            method_name: methodName,
            marker: proof?.marker ?? null,
            edit_spec: proof?.edit_spec ?? null,
          },
      };
    }
  }

  throw new Error("same-run procedure edit proof with a reopened movement procedure is required before reopen proof");
}

function readTransformProof(evidenceDir: string): TransformProof {
  const runDir = path.dirname(path.resolve(evidenceDir));
  const artifact = readJsonIfExists(path.join(runDir, "transform-object", "object-transform.json"));
  if (typeof artifact?.object_id !== "string" || artifact.object_id.trim() === "") {
    throw new Error("same-run transform-object/object-transform.json with object_id is required before reopen proof");
  }
  const transform = artifact.transform;
  const positionAfter = transform && typeof transform === "object" && !Array.isArray(transform)
    ? (transform as Record<string, unknown>).position_after
    : null;
  if (!isPosition(positionAfter)) {
    throw new Error("same-run transform-object/object-transform.json with position_after is required before reopen proof");
  }
  return { objectId: artifact.object_id, positionAfter };
}

function isPosition(value: unknown): value is { x: number; y: number; z: number } {
  return Boolean(
    value
      && typeof value === "object"
      && !Array.isArray(value)
      && typeof (value as { x?: unknown }).x === "number"
      && typeof (value as { y?: unknown }).y === "number"
      && typeof (value as { z?: unknown }).z === "number",
  );
}

function positionsMatch(
  actual: { x: number; y: number; z: number } | null | undefined,
  expected: { x: number; y: number; z: number },
): boolean {
  return actual?.x === expected.x && actual.y === expected.y && actual.z === expected.z;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  ensureReadableProject(args.savedProject);
  fs.mkdirSync(args.evidenceDir, { recursive: true });

  const sourceArtifact = sourceSavedProjectArtifact(args.savedProject, args.evidenceDir);
  const archive = await readProject(fs.readFileSync(args.savedProject));
  const reopenedProjectPath = path.join(args.evidenceDir, REOPENED_PROJECT_ARTIFACT);
  fs.writeFileSync(reopenedProjectPath, await writeProject(archive, { generateThumbnailFromScene: false }));

  const reopened = await parseA3P(fs.readFileSync(reopenedProjectPath));
  if (reopened.sceneObjects.length === 0) {
    throw new Error("reopened project has no scene objects");
  }

  const priorRunArtifact = path.join(path.dirname(path.resolve(args.evidenceDir)), "run-world", "run-world-result.json");
  const priorRunEvidence = fs.existsSync(priorRunArtifact)
    ? "run-world/run-world-result.json"
    : null;

  const names = methodNames(reopened);
  const movementProof = readMovementProof(args.evidenceDir, names);
  const transformProof = readTransformProof(args.evidenceDir);
  const primaryObject = reopened.sceneObjects.find((object) => object.name === transformProof.objectId);
  if (!primaryObject) {
    throw new Error(`reopened project does not contain transformed object: ${transformProof.objectId}`);
  }
  if (!positionsMatch(primaryObject.position, transformProof.positionAfter)) {
    throw new Error(`reopened project transform does not match transform proof for object: ${transformProof.objectId}`);
  }
  const state = {
    schema_version: "eatme.alice-reopened-state/v1",
    object_id: primaryObject.name,
    transform: {
      position: primaryObject.position ?? null,
      orientation: primaryObject.orientation ?? null,
      size: primaryObject.size ?? null,
    },
    procedure_selector: args.reopenSelector,
    movement: {
      ...movementProof.movement,
      procedure_selector: movementProof.procedureSelector,
      method_name: movementProof.methodName,
      present: true,
    },
    project_name: reopened.projectName,
    scene_object_count: reopened.sceneObjects.length,
    object_identities: reopened.sceneObjects.map((object) => ({
      object_id: object.name,
      class_name: object.typeName,
      transform: {
        position: object.position ?? null,
        orientation: object.orientation ?? null,
        size: object.size ?? null,
      },
    })),
    method_names: names,
    movement_procedure_present: true,
    prior_run_evidence_artifact: priorRunEvidence,
  };

  fs.writeFileSync(
    path.join(args.evidenceDir, REOPENED_STATE_ARTIFACT),
    `${JSON.stringify(state, null, 2)}\n`,
  );

  fs.writeFileSync(
    path.join(args.evidenceDir, REOPEN_ARTIFACT),
    `${JSON.stringify({
      schema_version: "eatme.alice-project-reopen-artifact/v1",
      source_saved_project_artifact: sourceArtifact,
      reopen_selector: args.reopenSelector,
      reopened_project_artifact: REOPENED_PROJECT_ARTIFACT,
      reopened_state_artifact: REOPENED_STATE_ARTIFACT,
      state_verification: "passed",
    }, null, 2)}\n`,
  );

  console.log(JSON.stringify({
    schema_version: "eatme.alice-project-reopen-result/v1",
    status: "reopened",
    source_saved_project_artifact: sourceArtifact,
    reopen_selector: args.reopenSelector,
    reopened_project_artifact: REOPENED_PROJECT_ARTIFACT,
    reopen_artifact: REOPEN_ARTIFACT,
    reopened_state_artifact: REOPENED_STATE_ARTIFACT,
    state_verification: "passed",
  }));
}

main().catch((error) => {
  console.error("project reopen failed:", error.message);
  process.exit(1);
});
