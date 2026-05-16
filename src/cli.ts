#!/usr/bin/env node
import { createServer } from "./server.js";

function parseArgs(argv: string[]): {
  command: string;
  port: number;
  evidenceDir: string;
  project?: string;
} {
  const args = argv.slice(2);
  const command = args[0] ?? "serve";

  let port = 3000;
  let evidenceDir = "./evidence";
  let project: string | undefined;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--port":
        port = parseInt(args[++i], 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          console.error("--port must be a valid port number");
          process.exit(1);
        }
        break;
      case "--evidence-dir":
        evidenceDir = args[++i];
        break;
      case "--project":
        project = args[++i];
        break;
      default:
        if (args[i].startsWith("-")) {
          console.error(`Unknown option: ${args[i]}`);
          console.error(
            "Usage: alice-web serve --port 3000 --evidence-dir /path/to/evidence --project /path/to/starter.a3p",
          );
          process.exit(1);
        }
    }
  }

  return { command, port, evidenceDir, project };
}

async function main(): Promise<void> {
  const { command, port, evidenceDir, project } = parseArgs(process.argv);

  if (command !== "serve") {
    console.error(`Unknown command: ${command}`);
    console.error("Available commands: serve");
    process.exit(1);
  }

  const app = createServer({ port, evidenceDir, projectPath: project });
  const server = app.listen(port, "127.0.0.1", () => {
    console.log(
      JSON.stringify({
        status: "listening",
        port,
        evidenceDir,
        project: project ?? null,
        pid: process.pid,
        runtime: "typescript-web-prototype",
      }),
    );
  });

  // Graceful shutdown
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down...`);
      server.close(() => process.exit(0));
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
