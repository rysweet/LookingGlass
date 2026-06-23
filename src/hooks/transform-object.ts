#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { readProject, writeProject } from "../project-io.js";
import type { AliceObject } from "../a3p-parser.js";

interface Args {
  project: string;
  evidenceDir: string;
  json: boolean;
  objectId?: string;
}

const TRANSFORM_ARTIFACT = "object-transform.json";
const TRANSFORMED_PROJECT_ARTIFACT = "transformed-object-project.a3p";

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const parsed: Partial<Args> = {};
  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--project":
        parsed.project = args[++i];
        break;
      case "--evidence-dir":
        parsed.evidenceDir = args[++i];
        break;
      case "--object-id":
      case "--object-identifier":
      case "--object":
        parsed.objectId = args[++i];
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
  if (!parsed.project) throw new Error("--project is required");
  if (!parsed.evidenceDir) throw new Error("--evidence-dir is required");
  if (!parsed.json) throw new Error("--json is required");
  return parsed as Args;
}

function printUsageAndExit(code: number): never {
  const usage = "Usage: transform-object --project <file.a3p> --evidence-dir <dir> --json [--object-id <name>]";
  if (code === 0) {
    console.log(usage);
  } else {
    console.error(usage);
  }
  process.exit(code);
}

function ensureReadableProject(projectPath: string): void {
  if (!projectPath.endsWith(".a3p")) {
    throw new Error("--project must point to an .a3p file");
  }
  if (!fs.existsSync(projectPath)) {
    throw new Error(`project file does not exist: ${projectPath}`);
  }
}

function selectObject(objects: readonly AliceObject[], objectId: string | undefined): AliceObject {
  const selected = objectId
    ? objects.find((object) => object.name === objectId)
    : objects.find((object) => !/ground|camera/i.test(object.name)) ?? objects[0];
  if (!selected) {
    throw new Error("project has no scene object to transform");
  }
  return selected;
}

function transformObject(object: AliceObject): { before: unknown; after: NonNullable<AliceObject["position"]> } {
  const before = object.position ?? null;
  const base = object.position ?? { x: 0, y: 0, z: 0 };
  const after = { x: base.x + 1, y: base.y, z: base.z };
  object.position = after;
  return { before, after };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  ensureReadableProject(args.project);
  fs.mkdirSync(args.evidenceDir, { recursive: true });

  const archive = await readProject(fs.readFileSync(args.project));
  const object = selectObject(archive.project.sceneObjects, args.objectId);
  const transform = transformObject(object);
  const transformedProjectPath = path.join(args.evidenceDir, TRANSFORMED_PROJECT_ARTIFACT);
  fs.writeFileSync(transformedProjectPath, await writeProject(archive, { generateThumbnailFromScene: false }));

  fs.writeFileSync(
    path.join(args.evidenceDir, TRANSFORM_ARTIFACT),
    `${JSON.stringify({
      schema_version: "eatme.alice-object-transform-artifact/v1",
      object_id: object.name,
      transform: {
        position_before: transform.before,
        position_after: transform.after,
      },
      transformed_project_artifact: TRANSFORMED_PROJECT_ARTIFACT,
    }, null, 2)}\n`,
  );

  console.log(JSON.stringify({
    schema_version: "eatme.alice-object-transform-result/v1",
    status: "transformed",
    object_id: object.name,
    transform_artifact: TRANSFORM_ARTIFACT,
    transformed_project_artifact: TRANSFORMED_PROJECT_ARTIFACT,
  }));
}

main().catch((error) => {
  console.error("object transform failed:", error.message);
  process.exit(1);
});
