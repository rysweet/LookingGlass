import { beforeAll, describe, expect, it } from "vitest";
import type { AliceMethod, AliceObject, AliceProject, AliceStatement } from "../src/a3p-parser.js";
import { readProject, writeProject, type AliceProjectArchive } from "../src/project-io.js";
import { parseTweedle } from "../src/tweedle-parser.js";
import { executeProject } from "../src/tweedle-vm.js";
import { createMinimalProject } from "./test-utils.js";

beforeAll(async () => {
  if (typeof globalThis.DOMParser === "undefined" || typeof globalThis.XMLSerializer === "undefined") {
    const { JSDOM } = await import("jsdom");
    const window = new JSDOM().window;
    globalThis.DOMParser = window.DOMParser;
    globalThis.XMLSerializer = window.XMLSerializer;
  }
});

function measureAverageMs(iterations: number, action: () => void): number {
  const started = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    action();
  }
  return (performance.now() - started) / iterations;
}

async function measureAverageAsyncMs(iterations: number, action: () => Promise<void>): Promise<number> {
  const started = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    await action();
  }
  return (performance.now() - started) / iterations;
}

function createParserSource(methodCount: number): string {
  const methods = Array.from({ length: methodCount }, (_, index) => `  void method${index}() { }`).join("\n");
  return `class BenchmarkProgram {\n${methods}\n}`;
}

function createVmProject(statementCount: number): AliceProject {
  const sceneObjects: AliceObject[] = [{
    name: "bunny",
    typeName: "org.lgna.story.SBiped",
    resourceType: null,
    position: null,
    orientation: null,
    size: null,
  }];
  const statements: AliceStatement[] = Array.from({ length: statementCount }, (_, index) => ({
    kind: "MethodCall",
    object: "bunny",
    method: `move${index}`,
    arguments: [],
  }));
  const methods: AliceMethod[] = [{
    name: "myFirstMethod",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements,
  }];
  return {
    version: "3.10.0.0",
    projectName: "BenchmarkProject",
    sceneObjects,
    methods,
  };
}

function createBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = (index * 31) % 256;
  }
  return bytes;
}

function createArchive(resourceSize: number): AliceProjectArchive {
  const project = createMinimalProject();
  project.sceneObjects = [{
    name: "ground",
    typeName: "org.lgna.story.SGround",
    resourceType: null,
    position: null,
    orientation: null,
    size: null,
  }];
  project.methods = [{
    name: "myFirstMethod",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [{ kind: "MethodCall", object: "ground", method: "appear", arguments: [] }],
  }];

  const resourcePath = "resources/bin/payload.bin";
  const resourceBytes = createBytes(resourceSize);
  return {
    project,
    manifest: { aliceVersion: "3.10.0.0", benchmark: true },
    resources: new Map([[resourcePath, resourceBytes]]),
    resourceEntries: [{ path: resourcePath, kind: "other", size: resourceBytes.length }],
    thumbnail: null,
    versionInfo: {
      originalAliceVersion: null,
      detectedAliceVersion: "3.10.0.0",
      manifestVersion: "3.10.0.0",
      xmlVersion: null,
      versionSource: "default",
      migrated: false,
      migrationSteps: [],
    },
  };
}

describe("performance benchmarks", () => {
  it("parser parses 100 methods in under 100 ms", () => {
    const source = createParserSource(100);
    const warmup = parseTweedle(source);
    expect(warmup.methods).toHaveLength(100);

    const averageMs = measureAverageMs(10, () => {
      parseTweedle(source);
    });

    expect(averageMs).toBeLessThan(100);
  });

  it("vm executes 1000 statements in under 200 ms", () => {
    const project = createVmProject(1000);
    const warmup = executeProject(project);
    expect(warmup.execution_log.filter((entry) => entry.kind === "MethodCall")).toHaveLength(1000);

    const averageMs = measureAverageMs(5, () => {
      executeProject(project);
    });

    expect(averageMs).toBeLessThan(200);
  });

  it("serializer round-trips a 50 KB project in under 500 ms", async () => {
    const archive = createArchive(50 * 1024);
    const warmupBytes = await writeProject(createArchive(50 * 1024));
    const warmupRoundTrip = await readProject(warmupBytes);
    expect(warmupRoundTrip.resources.get("resources/bin/payload.bin")?.length).toBe(50 * 1024);

    const averageMs = await measureAverageAsyncMs(3, async () => {
      const bytes = await writeProject(createArchive(50 * 1024));
      const roundTripped = await readProject(bytes);
      expect(roundTripped.resources.get("resources/bin/payload.bin")?.length).toBe(50 * 1024);
    });

    expect(averageMs).toBeLessThan(500);
  });
});
