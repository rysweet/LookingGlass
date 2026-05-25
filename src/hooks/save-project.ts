#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-save-project interface.
 * Accepts: --project <path.a3p> --save-selector <sel> --evidence-dir <dir> --json
 * Optional: --target <output.a3p>
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { readProject, writeProject } from "../project-io.js";
import { writeSaveProof, saveProjectResultJson } from "../evidence-writer.js";

interface Args {
  project: string;
  saveSelector: string;
  evidenceDir: string;
  json: boolean;
  target?: string;
}

interface SavedProjectStats {
  readonly path: string;
  readonly size: number;
  readonly resourceCount: number;
  readonly sceneObjectCount: number;
  readonly methodCount: number;
  readonly projectName: string;
}

interface SaveVerification {
  readonly exists: boolean;
  readonly size: number;
  readonly isA3p: boolean;
}

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const parsed: Partial<Args> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--project":
        parsed.project = args[++i];
        break;
      case "--save-selector":
        parsed.saveSelector = args[++i];
        break;
      case "--evidence-dir":
        parsed.evidenceDir = args[++i];
        break;
      case "--target":
        parsed.target = args[++i];
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
  if (!parsed.saveSelector) throw new Error("--save-selector is required");
  if (!parsed.evidenceDir) throw new Error("--evidence-dir is required");
  if (!parsed.json) throw new Error("--json is required");
  return parsed as Args;
}

function printUsageAndExit(code: number): never {
  const usage = [
    "Usage: save-project --project <file.a3p> --save-selector <selector> --evidence-dir <dir> --json",
    "       [--target <output.a3p>]",
  ].join("\n");
  if (code === 0) {
    console.log(usage);
  } else {
    console.error(usage);
  }
  process.exit(code);
}

function chooseOutputPath(args: Args): string {
  return args.target
    ? path.resolve(args.target)
    : path.join(args.evidenceDir, "saved-project.a3p");
}

function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function validateProjectInput(projectPath: string): void {
  if (!projectPath.endsWith(".a3p")) {
    throw new Error("--project must point to an .a3p file");
  }
  if (!fs.existsSync(projectPath)) {
    throw new Error(`project file does not exist: ${projectPath}`);
  }
}

function verifySavedProject(filePath: string): SaveVerification {
  const exists = fs.existsSync(filePath);
  const stat = exists ? fs.statSync(filePath) : null;
  return {
    exists,
    size: stat?.size ?? 0,
    isA3p: filePath.endsWith(".a3p"),
  };
}

function writeSaveSummary(evidenceDir: string, stats: SavedProjectStats, verification: SaveVerification): void {
  const summaryPath = path.join(evidenceDir, "save-summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        schema_version: "eatme.alice-save-summary/v1",
        project_name: stats.projectName,
        saved_file: stats.path,
        saved_file_exists: verification.exists,
        saved_file_size_bytes: verification.size,
        resource_count: stats.resourceCount,
        scene_object_count: stats.sceneObjectCount,
        method_count: stats.methodCount,
        is_a3p: verification.isA3p,
      },
      null,
      2,
    ) + "\n",
  );
}

async function saveProject(args: Args): Promise<SavedProjectStats> {
  validateProjectInput(args.project);
  const archive = await readProject(fs.readFileSync(args.project));
  const output = await writeProject(archive);
  const savedProjectPath = chooseOutputPath(args);
  ensureParentDir(savedProjectPath);
  fs.writeFileSync(savedProjectPath, output);
  const stat = fs.statSync(savedProjectPath);
  return {
    path: savedProjectPath,
    size: stat.size,
    resourceCount: archive.resources.size,
    sceneObjectCount: archive.project.sceneObjects.length,
    methodCount: archive.project.methods.length,
    projectName: archive.project.projectName,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.evidenceDir, { recursive: true });

  const stats = await saveProject(args);
  const verification = verifySavedProject(stats.path);
  if (!verification.exists || verification.size === 0 || !verification.isA3p) {
    throw new Error("save operation did not produce a non-empty .a3p file");
  }

  writeSaveSummary(args.evidenceDir, stats, verification);
  writeSaveProof(args.evidenceDir, {
    savedFilePath: stats.path,
    fileSizeBytes: stats.size,
  });

  const savedProjectName = path.basename(stats.path);
  if (savedProjectName !== "saved-project.a3p") {
    const canonicalPath = path.join(args.evidenceDir, "saved-project.a3p");
    fs.copyFileSync(stats.path, canonicalPath);
  }

  console.log(
    saveProjectResultJson(
      args.saveSelector,
      "saved-project.a3p",
      "desktop-save-operation-result.json",
    ),
  );
}

main().catch((err) => {
  console.error("save project failed:", err.message);
  process.exit(1);
});
