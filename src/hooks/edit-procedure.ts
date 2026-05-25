#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-edit-procedure interface.
 * Accepts: --project <path.a3p> --evidence-dir <dir> --json
 * Optional: --procedure-selector <selector> --edit-spec <spec>
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { parseA3P, type AliceMethod } from "../a3p-parser.js";
import { readProject, writeProject } from "../project-io.js";
import {
  editProcedureResultJson,
  writeEditProcedureProof,
} from "../evidence-writer.js";

interface Args {
  project: string;
  evidenceDir: string;
  json: boolean;
  procedureSelector: string;
  editSpec: string;
}

const DEFAULT_SELECTOR = "scene.eatmeFirstLessonStep";
const DEFAULT_EDIT_SPEC = "append-comment:eatmeFirstLessonStep";

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const parsed: Partial<Args> = {
    procedureSelector: DEFAULT_SELECTOR,
    editSpec: DEFAULT_EDIT_SPEC,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--project":
        parsed.project = args[++i];
        break;
      case "--evidence-dir":
        parsed.evidenceDir = args[++i];
        break;
      case "--procedure-selector":
        parsed.procedureSelector = args[++i] || DEFAULT_SELECTOR;
        break;
      case "--edit-spec":
        parsed.editSpec = args[++i] || DEFAULT_EDIT_SPEC;
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
  const usage = [
    "Usage: edit-procedure --project <file.a3p> --evidence-dir <dir> --json",
    "       [--procedure-selector scene.method] [--edit-spec append-comment:<text>]",
  ].join("\n");
  if (code === 0) {
    console.log(usage);
  } else {
    console.error(usage);
  }
  process.exit(code);
}

function selectorToMethodName(selector: string): string {
  return selector.startsWith("scene.") ? selector.slice("scene.".length) : selector;
}

function markerFromEditSpec(editSpec: string): string {
  return editSpec.startsWith("append-comment:")
    ? editSpec.slice("append-comment:".length)
    : editSpec;
}

function ensureMethod(methods: AliceMethod[], methodName: string, marker: string): { method: AliceMethod; beforeStatementCount: number } {
  let method = methods.find((candidate) => candidate.name === methodName) ?? null;
  if (!method) {
    method = {
      name: methodName,
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [],
    };
    methods.push(method);
  }

  const beforeStatementCount = method.statements.length;
  method.statements.push({ kind: "Comment", expression: marker });
  return { method, beforeStatementCount };
}

function writeProcedureDiff(
  evidenceDir: string,
  methodName: string,
  beforeStatementCount: number,
  afterStatementCount: number,
  marker: string,
): void {
  const diffPath = path.join(evidenceDir, "procedure.diff.json");
  fs.writeFileSync(
    diffPath,
    JSON.stringify(
      {
        schema_version: "eatme.alice-procedure-diff/v1",
        method_name: methodName,
        before_statement_count: beforeStatementCount,
        after_statement_count: afterStatementCount,
        added_statements: [marker],
      },
      null,
      2,
    ) + "\n",
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.evidenceDir, { recursive: true });

  const archive = await readProject(fs.readFileSync(args.project));
  const selector = args.procedureSelector;
  const methodName = selectorToMethodName(selector);
  const marker = markerFromEditSpec(args.editSpec);
  const sceneMethods = archive.project.methods;
  const beforeMethods = sceneMethods.map((method) => method.name);
  const { method, beforeStatementCount } = ensureMethod(sceneMethods, methodName, marker);
  const afterStatementCount = method.statements.length;

  const editedProjectPath = path.join(args.evidenceDir, "edited-project.a3p");
  fs.writeFileSync(editedProjectPath, await writeProject(archive));

  const reopened = await parseA3P(fs.readFileSync(editedProjectPath));
  const afterMethods = reopened.methods.map((candidate) => candidate.name);

  writeProcedureDiff(args.evidenceDir, methodName, beforeStatementCount, afterStatementCount, marker);
  writeEditProcedureProof(args.evidenceDir, {
    procedureSelector: selector,
    editSpec: args.editSpec,
    inputProjectArtifact: path.basename(args.project),
    sceneType: reopened.projectName || "Scene",
    methodName,
    marker,
    beforeStatementCount,
    afterStatementCount,
    beforeMethods,
    afterMethods,
    editedProject: "edited-project.a3p",
  });

  console.log(editProcedureResultJson(selector));
}

main().catch((err) => {
  console.error("edit procedure failed:", err.message);
  process.exit(1);
});
