#!/usr/bin/env node
import { promises as fs, realpathSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  DEFAULT_INVENTORY_PATH,
  DEFAULT_MAPPING_PATH,
  formatAuditJson,
  formatAuditSummary,
  runAliceHowToParityAudit,
} from "./alice-howto-parity-audit.js";
import { createServer } from "./server.js";

export interface CliConfig {
  readonly command: "serve" | "help" | "print-config" | "alice-howto-parity-audit";
  readonly port: number;
  readonly evidenceDir: string;
  readonly project?: string;
  readonly localApiToken?: string;
  readonly inventoryPath?: string;
  readonly mappingPath?: string;
  readonly outputPath?: string;
}

const DEFAULT_PORT = 3000;
const DEFAULT_EVIDENCE_DIR = "./evidence";
const USAGE = [
  "Usage:",
  "  alice-web serve [--port <1-65535>] [--evidence-dir <dir>] [--project <file.a3p>] [--api-token <token>]",
  "  alice-web print-config [--port <1-65535>] [--evidence-dir <dir>] [--project <file.a3p>] [--api-token <token>]",
  `  alice-web alice-howto-parity-audit [--inventory <path>] [--mapping <path>] [--output <path>]`,
  "  alice-web help",
  "",
  "Alice HowTo parity audit defaults:",
  `  --inventory <path>  ${DEFAULT_INVENTORY_PATH}`,
  `  --mapping <path>    ${DEFAULT_MAPPING_PATH}`,
].join("\n");

export function parseArgs(argv: string[]): CliConfig {
  const args = argv.slice(2);
  const commandToken = args[0] ?? "serve";
  const command = normalizeCommand(commandToken);

  let port = DEFAULT_PORT;
  let evidenceDir = DEFAULT_EVIDENCE_DIR;
  let project: string | undefined;
  let localApiToken: string | undefined;
  let inventoryPath: string = DEFAULT_INVENTORY_PATH;
  let mappingPath: string = DEFAULT_MAPPING_PATH;
  let outputPath: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const current = args[i];
    switch (current) {
      case "--port":
        port = parsePort(args[++i]);
        break;
      case "--evidence-dir":
        evidenceDir = parseEvidenceDir(args[++i]);
        break;
      case "--project":
        project = parseProjectPath(args[++i]);
        break;
      case "--api-token":
        localApiToken = parseApiToken(args[++i]);
        break;
      case "--inventory":
        if (command !== "alice-howto-parity-audit") {
          throw new Error("--inventory is only valid for alice-howto-parity-audit");
        }
        inventoryPath = parseRequiredPath(args[++i], "--inventory");
        break;
      case "--mapping":
        if (command !== "alice-howto-parity-audit") {
          throw new Error("--mapping is only valid for alice-howto-parity-audit");
        }
        mappingPath = parseRequiredPath(args[++i], "--mapping");
        break;
      case "--output":
        if (command !== "alice-howto-parity-audit") {
          throw new Error("--output is only valid for alice-howto-parity-audit");
        }
        outputPath = parseRequiredPath(args[++i], "--output");
        break;
      case "--help":
      case "-h":
        return { command: "help", port, evidenceDir, project, localApiToken, inventoryPath, mappingPath, outputPath };
      default:
        if (current?.startsWith("-")) {
          throw new Error(`Unknown option: ${current}`);
        }
    }
  }

  return { command, port, evidenceDir, project, localApiToken, inventoryPath, mappingPath, outputPath };
}

function normalizeCommand(value: string): CliConfig["command"] {
  if (value === "--help" || value === "-h") {
    return "help";
  }
  if (value === "serve" || value === "print-config" || value === "help" || value === "alice-howto-parity-audit") {
    return value;
  }
  throw new Error(`Unknown command: ${value}`);
}

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("--port must be a valid port number");
  }
  return parsed;
}

function parseEvidenceDir(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error("--evidence-dir requires a directory path");
  }
  return value;
}

function parseProjectPath(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error("--project requires a file path");
  }
  if (!value.endsWith(".a3p")) {
    throw new Error("--project must point to an .a3p file");
  }
  return value;
}

function parseApiToken(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error("--api-token requires a non-empty token");
  }
  return value;
}

function parseRequiredPath(value: string | undefined, option: string): string {
  if (!value || !value.trim()) {
    throw new Error(`${option} requires a path`);
  }
  return value;
}

export function formatConfig(config: CliConfig): string {
  return JSON.stringify(
    {
      command: config.command,
      port: config.port,
      evidenceDir: path.resolve(config.evidenceDir),
      project: config.project ? path.resolve(config.project) : null,
      runtime: "alice-web",
    },
    null,
    2,
  );
}

export function printUsage(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(`${USAGE}\n`);
}

async function run(config: CliConfig): Promise<void> {
  switch (config.command) {
    case "help":
      printUsage(process.stdout);
      return;
    case "print-config":
      console.log(formatConfig(config));
      return;
    case "alice-howto-parity-audit":
      await runHowToParityAudit(config);
      return;
    case "serve":
      await serve(config);
      return;
  }
}

async function runHowToParityAudit(config: CliConfig): Promise<void> {
  const result = await runAliceHowToParityAudit({
    repoRoot: process.cwd(),
    inventoryPath: config.inventoryPath ?? DEFAULT_INVENTORY_PATH,
    mappingPath: config.mappingPath ?? DEFAULT_MAPPING_PATH,
  });
  const json = formatAuditJson(result);
  const summary = formatAuditSummary(result);

  if (config.outputPath) {
    const outputPath = path.resolve(config.outputPath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, json, "utf-8");
    process.stdout.write(summary);
  } else {
    process.stdout.write(json);
    process.stderr.write(summary);
  }

  if (!result.passed) {
    process.exitCode = 1;
  }
}

async function serve(config: CliConfig): Promise<void> {
  const app = createServer({
    port: config.port,
    evidenceDir: config.evidenceDir,
    projectPath: config.project,
    localApiToken: config.localApiToken,
  });
  const server = app.listen(config.port, "127.0.0.1", () => {
    console.log(
      JSON.stringify({
        status: "listening",
        port: config.port,
        evidenceDir: config.evidenceDir,
        project: config.project ?? null,
        pid: process.pid,
        runtime: "alice-web",
      }),
    );
  });

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down...`);
      server.close(() => process.exit(0));
    });
  }
}

async function main(): Promise<void> {
  try {
    await run(parseArgs(process.argv));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    printUsage(process.stderr);
    process.exit(1);
  }
}

function isDirectExecution(): boolean {
  const entryPoint = process.argv[1];
  if (!entryPoint) {
    return false;
  }

  try {
    return realpathSync(entryPoint) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return path.resolve(entryPoint) === fileURLToPath(import.meta.url);
  }
}

if (isDirectExecution()) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
