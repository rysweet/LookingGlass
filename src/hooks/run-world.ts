#!/usr/bin/env node
/**
 * CLI hook matching Java Alice's tools/eatme-run-world interface.
 * Accepts: --project <path.a3p> --evidence-dir <dir> --json
 * Optional: --entry-method <name>
 * Outputs: single JSON line to stdout, writes evidence artifacts.
 */
import * as fs from "fs";
import * as path from "path";
import { parseA3P } from "../a3p-parser.js";
import { executeProject } from "../tweedle-vm.js";

interface Args {
  project: string;
  evidenceDir: string;
  json: boolean;
  entryMethod?: string;
}

interface RunSummary {
  readonly selector: string;
  readonly statementsExecuted: number;
  readonly returnValues: Record<string, unknown>;
}

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const parsed: Partial<Args> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--project":
        parsed.project = args[++i];
        break;
      case "--evidence-dir":
        parsed.evidenceDir = args[++i];
        break;
      case "--entry-method":
        parsed.entryMethod = args[++i];
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
    "Usage: run-world --project <file.a3p> --evidence-dir <dir> --json",
    "       [--entry-method <name>]",
  ].join("\n");
  if (code === 0) {
    console.log(usage);
  } else {
    console.error(usage);
  }
  process.exit(code);
}

function chooseSelector(entryMethod: string | undefined, parsedMethodNames: readonly string[]): string {
  if (entryMethod && entryMethod.trim()) {
    return `scene.${entryMethod.trim()}`;
  }
  const preferred = parsedMethodNames.find((name) => /first|run|main/i.test(name));
  return `scene.${preferred ?? "eatmeFirstLessonStep"}`;
}

function filterReturnValues(entries: Map<string, unknown>, entryMethod?: string): Record<string, unknown> {
  const selected = Object.fromEntries(entries);
  if (!entryMethod) {
    return selected;
  }
  return entryMethod in selected ? { [entryMethod]: selected[entryMethod] } : selected;
}

function summarizeExecution(
  selector: string,
  executionLog: ReturnType<typeof executeProject>["execution_log"],
  returnValues: Map<string, unknown>,
  entryMethod?: string,
): RunSummary {
  return {
    selector,
    statementsExecuted: executionLog.length,
    returnValues: filterReturnValues(returnValues, entryMethod),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.evidenceDir, { recursive: true });

  const projectData = fs.readFileSync(args.project);
  const parsed = await parseA3P(projectData);
  const selector = chooseSelector(args.entryMethod, parsed.methods.map((method) => method.name));
  const runStart = Date.now();
  const vmResult = executeProject(parsed);
  const runDuration = Date.now() - runStart;
  const summary = summarizeExecution(selector, vmResult.execution_log, vmResult.returnValues, args.entryMethod);

  const runEvidencePath = path.join(args.evidenceDir, "run-world-result.json");
  fs.writeFileSync(
    runEvidencePath,
    JSON.stringify(
      {
        schema_version: "eatme.alice-run-world-result/v1",
        status: "completed",
        run_selector: summary.selector,
        project_name: parsed.projectName,
        scene_object_count: parsed.sceneObjects.length,
        statements_executed: summary.statementsExecuted,
        execution_log: vmResult.execution_log,
        return_values: summary.returnValues,
        run_duration_ms: runDuration,
        errors: [],
        doesNotClaim: [
          "visible rendering correctness",
          "desktop run-button proof",
        ],
      },
      null,
      2,
    ) + "\n",
  );

  console.log(
    JSON.stringify({
      schema_version: "eatme.alice-run-world-result/v1",
      status: "completed",
      run_selector: summary.selector,
      statements_executed: summary.statementsExecuted,
      execution_log: vmResult.execution_log,
      run_evidence_artifact: "run-world-result.json",
    }),
  );
}

main().catch((err) => {
  console.error("run world failed:", err.message);
  process.exit(1);
});
