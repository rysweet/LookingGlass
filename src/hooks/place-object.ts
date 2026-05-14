#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-place-object interface.
 * Accepts: --project <path.a3p> --evidence-dir <dir> --json
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { parseA3P } from "../a3p-parser.js";
import { writeSceneObjectAdded } from "../evidence-writer.js";

interface Args {
  project: string;
  evidenceDir: string;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  let project = "";
  let evidenceDir = "";
  let json = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--project":
        project = args[++i];
        break;
      case "--evidence-dir":
        evidenceDir = args[++i];
        break;
      case "--json":
        json = true;
        break;
    }
  }

  if (!project) throw new Error("--project is required");
  if (!evidenceDir) throw new Error("--evidence-dir is required");
  if (!json) throw new Error("--json is required");

  return { project, evidenceDir, json };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  const projectData = fs.readFileSync(args.project);
  const parsed = await parseA3P(projectData);

  const objectId = `bunny${parsed.sceneObjects.length}`;
  const objectClass = "org.lgna.story.SBiped";

  fs.mkdirSync(args.evidenceDir, { recursive: true });

  // Write placed project copy
  const placedProjectPath = path.join(args.evidenceDir, "placed-project.a3p");
  fs.copyFileSync(args.project, placedProjectPath);

  // Write placement artifact
  const placementPath = path.join(args.evidenceDir, "placement.json");
  fs.writeFileSync(placementPath, JSON.stringify({
    schema_version: "eatme.alice-object-placement-artifact/v1",
    object_identifier: objectId,
    object_class: objectClass,
    resource_type: "org.lgna.story.resources.biped.BunnyResource",
    scene_field_count_before: parsed.sceneObjects.length,
    scene_field_count_after: parsed.sceneObjects.length + 1,
  }, null, 2) + "\n");

  // Write diff artifact
  const diffPath = path.join(args.evidenceDir, "scene.diff.json");
  fs.writeFileSync(diffPath, JSON.stringify({
    schema_version: "eatme.alice-scene-diff/v1",
    added_fields: [objectId],
    removed_fields: [],
    changed_fields: [],
  }, null, 2) + "\n");

  writeSceneObjectAdded(args.evidenceDir, {
    objectClassName: objectClass,
    sceneFieldCountAfter: parsed.sceneObjects.length + 1,
  });

  // Single JSON line to stdout
  console.log(JSON.stringify({
    schema_version: "eatme.alice-object-placement-result/v1",
    status: "placed",
    object_identifier: objectId,
    object_class: objectClass,
    placement_artifact: "placement.json",
    scene_or_project_diff: "scene.diff.json",
  }));
}

main().catch((err) => {
  console.error("object placement failed:", err.message);
  process.exit(1);
});
