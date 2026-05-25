#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-place-object interface.
 * Accepts: --project <path.a3p> --evidence-dir <dir> --json
 * Optional: --class-name <fqcn> --name <fieldName> --resource-type <fqcn>
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { parseA3P, type AliceObject, type AliceTypeDefinition } from "../a3p-parser.js";
import { readProject, writeProject } from "../project-io.js";
import { writeSceneObjectAdded } from "../evidence-writer.js";

interface Args {
  project: string;
  evidenceDir: string;
  json: boolean;
  className: string;
  name?: string;
  resourceType?: string;
}

interface PlacementArtifacts {
  readonly object: AliceObject;
  readonly beforeCount: number;
  readonly afterCount: number;
  readonly placedProjectPath: string;
}

const DEFAULT_CLASS_NAME = "org.lgna.story.SBiped";
const DEFAULT_RESOURCE_TYPE = "org.lgna.story.resources.biped.BunnyResource";

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const parsed: Partial<Args> = {
    className: DEFAULT_CLASS_NAME,
  };

  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    switch (current) {
      case "--project":
        parsed.project = args[++i];
        break;
      case "--evidence-dir":
        parsed.evidenceDir = args[++i];
        break;
      case "--json":
        parsed.json = true;
        break;
      case "--class-name":
        parsed.className = args[++i] || DEFAULT_CLASS_NAME;
        break;
      case "--name":
        parsed.name = args[++i];
        break;
      case "--resource-type":
        parsed.resourceType = args[++i];
        break;
      case "--help":
        printUsageAndExit(0);
        break;
      default:
        if (current?.startsWith("-")) {
          throw new Error(`Unknown option: ${current}`);
        }
    }
  }

  if (!parsed.project) throw new Error("--project is required");
  if (!parsed.evidenceDir) throw new Error("--evidence-dir is required");
  if (!parsed.json) throw new Error("--json is required");
  return parsed as Args;
}

function printUsageAndExit(code: number): never {
  const usage = [
    "Usage: place-object --project <file.a3p> --evidence-dir <dir> --json",
    "       [--class-name <fqcn>] [--name <fieldName>] [--resource-type <fqcn>]",
  ].join("\n");
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

function deriveObjectName(existingNames: readonly string[], requestedName: string | undefined, className: string): string {
  if (requestedName && requestedName.trim()) {
    return requestedName.trim();
  }
  const shortName = className.split(".").pop() ?? "object";
  const base = shortName.charAt(1).toLowerCase() + shortName.slice(2) || "object";
  let candidate = base;
  let counter = 1;
  while (existingNames.includes(candidate)) {
    counter += 1;
    candidate = `${base}${counter}`;
  }
  return candidate;
}

function findSceneType(types: AliceTypeDefinition[] | undefined): AliceTypeDefinition | null {
  return types?.find((type) => type.superTypeName?.includes("SScene"))
    ?? types?.find((type) => type.name === "Scene")
    ?? null;
}

function addObjectToSceneType(types: AliceTypeDefinition[] | undefined, object: AliceObject): void {
  const sceneType = findSceneType(types);
  if (!sceneType) {
    return;
  }
  sceneType.fields = sceneType.fields ?? [];
  if (!sceneType.fields.some((field) => field.name === object.name)) {
    sceneType.fields.push({
      name: object.name,
      typeName: object.typeName,
      resourceType: object.resourceType,
      initializer: object.resourceType,
    });
  }
}

function createPlacedObject(args: Args, existingNames: readonly string[]): AliceObject {
  const name = deriveObjectName(existingNames, args.name, args.className);
  return {
    name,
    typeName: args.className,
    resourceType: args.resourceType ?? DEFAULT_RESOURCE_TYPE,
    position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    size: { width: 1, height: 1, depth: 1 },
  };
}

function writePlacementArtifact(evidenceDir: string, artifacts: PlacementArtifacts): void {
  const placementPath = path.join(evidenceDir, "placement.json");
  fs.writeFileSync(
    placementPath,
    JSON.stringify(
      {
        schema_version: "eatme.alice-object-placement-artifact/v1",
        object_identifier: artifacts.object.name,
        object_class: artifacts.object.typeName,
        resource_type: artifacts.object.resourceType,
        scene_field_count_before: artifacts.beforeCount,
        scene_field_count_after: artifacts.afterCount,
        placed_project_artifact: path.basename(artifacts.placedProjectPath),
      },
      null,
      2,
    ) + "\n",
  );

  const diffPath = path.join(evidenceDir, "scene.diff.json");
  fs.writeFileSync(
    diffPath,
    JSON.stringify(
      {
        schema_version: "eatme.alice-scene-diff/v1",
        added_fields: [artifacts.object.name],
        removed_fields: [],
        changed_fields: [],
      },
      null,
      2,
    ) + "\n",
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  ensureReadableProject(args.project);
  fs.mkdirSync(args.evidenceDir, { recursive: true });

  const archive = await readProject(fs.readFileSync(args.project));
  const beforeCount = archive.project.sceneObjects.length;
  const placedObject = createPlacedObject(
    args,
    archive.project.sceneObjects.map((object) => object.name),
  );

  archive.project.sceneObjects.push(placedObject);
  addObjectToSceneType(archive.project.types, placedObject);

  const placedProjectPath = path.join(args.evidenceDir, "placed-project.a3p");
  fs.writeFileSync(placedProjectPath, await writeProject(archive));

  const reopened = await parseA3P(fs.readFileSync(placedProjectPath));
  const afterCount = reopened.sceneObjects.length;
  if (afterCount <= beforeCount) {
    throw new Error("object placement did not increase scene object count");
  }

  writePlacementArtifact(args.evidenceDir, {
    object: placedObject,
    beforeCount,
    afterCount,
    placedProjectPath,
  });

  writeSceneObjectAdded(args.evidenceDir, {
    objectClassName: placedObject.typeName,
    sceneFieldCountAfter: afterCount,
  });

  console.log(
    JSON.stringify({
      schema_version: "eatme.alice-object-placement-result/v1",
      status: "placed",
      object_identifier: placedObject.name,
      object_class: placedObject.typeName,
      placement_artifact: "placement.json",
      scene_or_project_diff: "scene.diff.json",
    }),
  );
}

main().catch((err) => {
  console.error("object placement failed:", err.message);
  process.exit(1);
});
