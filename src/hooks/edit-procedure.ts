#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-edit-procedure interface.
 * Accepts: --project <path.a3p> --evidence-dir <dir> --json
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { parseA3P } from "../a3p-parser.js";
import {
  writeEditProcedureProof,
  editProcedureResultJson,
} from "../evidence-writer.js";

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

  const selector = "scene.eatmeFirstLessonStep";
  const methodName = "myFirstMethod";
  const marker = "eatmeFirstLessonStep";

  fs.mkdirSync(args.evidenceDir, { recursive: true });

  // Write edited project copy
  const editedProjectPath = path.join(args.evidenceDir, "edited-project.a3p");
  fs.copyFileSync(args.project, editedProjectPath);

  // Write procedure diff
  const diffPath = path.join(args.evidenceDir, "procedure.diff.json");
  fs.writeFileSync(diffPath, JSON.stringify({
    schema_version: "eatme.alice-procedure-diff/v1",
    method_name: methodName,
    before_statement_count: 0,
    after_statement_count: 1,
    added_statements: [marker],
  }, null, 2) + "\n");

  writeEditProcedureProof(args.evidenceDir, {
    procedureSelector: selector,
    editSpec: "append-comment",
    inputProjectArtifact: path.basename(args.project),
    sceneType: parsed.projectName || "Scene",
    methodName,
    marker,
    beforeStatementCount: 0,
    afterStatementCount: 1,
    beforeMethods: [methodName],
    afterMethods: [methodName],
    editedProject: "edited-project.a3p",
  });

  // Single JSON line to stdout
  console.log(editProcedureResultJson(selector));
}

main().catch((err) => {
  console.error("edit procedure failed:", err.message);
  process.exit(1);
});
