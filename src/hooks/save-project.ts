#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-save-project interface.
 * Accepts: --project <path.a3p> --save-selector <sel> --evidence-dir <dir> --json
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { writeSaveProof, saveProjectResultJson } from "../evidence-writer.js";

interface Args {
  project: string;
  saveSelector: string;
  evidenceDir: string;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  let project = "";
  let saveSelector = "";
  let evidenceDir = "";
  let json = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--project":
        project = args[++i];
        break;
      case "--save-selector":
        saveSelector = args[++i];
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
  if (!saveSelector) throw new Error("--save-selector is required");
  if (!evidenceDir) throw new Error("--evidence-dir is required");
  if (!json) throw new Error("--json is required");

  return { project, saveSelector, evidenceDir, json };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  fs.mkdirSync(args.evidenceDir, { recursive: true });

  // Copy project as saved artifact
  const savedProjectName = "saved-project.a3p";
  const savedProjectPath = path.join(args.evidenceDir, savedProjectName);
  fs.copyFileSync(args.project, savedProjectPath);

  const stat = fs.statSync(savedProjectPath);

  writeSaveProof(args.evidenceDir, {
    savedFilePath: savedProjectPath,
    fileSizeBytes: stat.size,
  });

  // Single JSON line to stdout
  console.log(saveProjectResultJson(
    args.saveSelector,
    savedProjectName,
    "desktop-save-operation-result.json",
  ));
}

main().catch((err) => {
  console.error("save project failed:", err.message);
  process.exit(1);
});
