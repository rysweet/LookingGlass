import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const BUILT_CLI_PATH = path.join(PROJECT_ROOT, "dist-server/cli.js");
const EXPECTED_HOWTO_COUNT = 54;
const RABBITHOLE_BASELINE = "rysweet/RabbitHole origin/develop";
const AUDIT_COMMAND = "alice-howto-parity-audit";
const DEFAULT_INVENTORY_PATH = "data/alice-org-howto-inventory.json";
const DEFAULT_MAPPING_PATH = "data/alice-howto-coverage-map.json";
const PROJECT_FIXTURE_ROOT = path.join(PROJECT_ROOT, ".test-alice-howto-parity-audit");

type CoverageArtifactType = "vitest" | "gadugi" | "scenario" | "other";

interface InventoryEntry {
  readonly id: string;
  readonly title: string;
  readonly source?: string;
}

interface CoverageArtifact {
  readonly type: CoverageArtifactType;
  readonly path: string;
  readonly name: string;
}

interface CoverageMappingEntry {
  readonly id: string;
  readonly artifacts: readonly CoverageArtifact[];
}

interface CoverageMapping {
  readonly baseline: string;
  readonly mappings: readonly CoverageMappingEntry[];
}

interface AuditResult {
  readonly schemaVersion: 1;
  readonly command: "alice-howto-parity-audit";
  readonly passed: boolean;
  readonly baseline: {
    readonly rabbitHole: "rysweet/RabbitHole origin/develop";
  };
  readonly inventory: {
    readonly path: string;
    readonly expectedCount: 54;
    readonly actualCount: number;
    readonly duplicateIds: readonly string[];
  };
  readonly coverage: {
    readonly path: string;
    readonly mappedCount: number;
    readonly missingMappings: readonly string[];
    readonly unknownMappings: readonly string[];
    readonly invalidArtifacts: readonly {
      readonly howToId: string;
      readonly path: string;
      readonly reason: string;
    }[];
  };
  readonly howTos: readonly {
    readonly id: string;
    readonly title: string;
    readonly covered: boolean;
    readonly artifacts: readonly (CoverageArtifact & { readonly exists: boolean })[];
  }[];
  readonly errors: readonly {
    readonly code: string;
    readonly message: string;
    readonly howToId?: string;
    readonly path?: string;
  }[];
}

interface AuditModule {
  readonly EXPECTED_HOWTO_COUNT: 54;
  readonly RABBITHOLE_BASELINE: "rysweet/RabbitHole origin/develop";
  readonly DEFAULT_INVENTORY_PATH: "data/alice-org-howto-inventory.json";
  readonly DEFAULT_MAPPING_PATH: "data/alice-howto-coverage-map.json";
  readonly loadAuditInventory: (filePath: string) => Promise<readonly InventoryEntry[]>;
  readonly loadCoverageMapping: (filePath: string) => Promise<CoverageMapping>;
  readonly runAliceHowToParityAudit: (options: {
    readonly repoRoot: string;
    readonly inventoryPath?: string;
    readonly mappingPath?: string;
  }) => Promise<AuditResult>;
  readonly formatAuditJson: (result: AuditResult) => string;
  readonly formatAuditSummary: (result: AuditResult) => string;
}

const tempDirs: string[] = [];

async function loadAuditModule(): Promise<AuditModule> {
  return await import("../src/alice-howto-parity-audit") as AuditModule;
}

function makeInventory(count = EXPECTED_HOWTO_COUNT): InventoryEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const ordinal = String(index + 1).padStart(2, "0");
    return {
      id: `howto-${ordinal}`,
      title: `Alice HowTo ${ordinal}`,
      source: "Alice.org HowTo",
    };
  });
}

function makeMapping(
  inventory: readonly InventoryEntry[],
  artifactPath = "test/alice-howto-parity-fixture.test.ts",
  artifactType: string = "vitest",
): CoverageMapping {
  return {
    baseline: RABBITHOLE_BASELINE,
    mappings: inventory.map((entry) => ({
      id: entry.id,
      artifacts: [
        {
          type: artifactType as CoverageArtifactType,
          path: artifactPath,
          name: "Alice HowTo executable coverage",
        },
      ],
    })),
  };
}

function makeTempRepo(prefix = "alice-howto-parity-"): {
  readonly repoRoot: string;
  readonly inventoryPath: string;
  readonly mappingPath: string;
  readonly artifactPath: string;
  readonly inventory: InventoryEntry[];
  readonly mapping: CoverageMapping;
} {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(repoRoot);

  const inventory = makeInventory();
  const mapping = makeMapping(inventory);
  const inventoryPath = path.join(repoRoot, DEFAULT_INVENTORY_PATH);
  const mappingPath = path.join(repoRoot, DEFAULT_MAPPING_PATH);
  const artifactPath = path.join(repoRoot, "test/alice-howto-parity-fixture.test.ts");

  writeJson(inventoryPath, inventory);
  writeJson(mappingPath, mapping);
  writeText(artifactPath, [
    'import { describe, expect, it } from "vitest";',
    "",
    'describe("Alice HowTo parity fixture", () => {',
    '  it("is executable coverage", () => {',
    "    expect(true).toBe(true);",
    "  });",
    "});",
    "",
  ].join("\n"));

  return { repoRoot, inventoryPath, mappingPath, artifactPath, inventory, mapping };
}

function makeProjectFixture(
  name: string,
  inventory = makeInventory(),
  mapping = makeMapping(
    inventory,
    path.posix.join(".test-alice-howto-parity-audit", name, "test", "alice-howto-parity-fixture.test.ts"),
  ),
): {
  readonly root: string;
  readonly inventoryPath: string;
  readonly mappingPath: string;
  readonly outputPath: string;
} {
  const root = path.join(PROJECT_FIXTURE_ROOT, name);
  tempDirs.push(root);

  const inventoryPath = path.join(root, "data/inventory.json");
  const mappingPath = path.join(root, "data/mapping.json");
  const artifactPath = path.join(root, "test/alice-howto-parity-fixture.test.ts");
  const outputPath = path.join(root, "artifacts/audit.json");

  writeJson(inventoryPath, inventory);
  writeJson(mappingPath, mapping);
  writeText(artifactPath, [
    'import { describe, expect, it } from "vitest";',
    "",
    'describe("Alice HowTo parity CLI fixture", () => {',
    '  it("is executable coverage", () => {',
    "    expect(true).toBe(true);",
    "  });",
    "});",
    "",
  ].join("\n"));

  return {
    root,
    inventoryPath: path.relative(PROJECT_ROOT, inventoryPath),
    mappingPath: path.relative(PROJECT_ROOT, mappingPath),
    outputPath,
  };
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath: string, value: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function buildServerCli(): void {
  const result = spawnSync("npm", ["run", "build:server"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_OPTIONS: "--max-old-space-size=32768",
    },
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      [
        result.error?.message,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

function runBuiltCli(args: readonly string[]) {
  expect(
    fs.existsSync(BUILT_CLI_PATH),
    "Run npm run build:server before CLI subprocess tests",
  ).toBe(true);

  return spawnSync(process.execPath, [BUILT_CLI_PATH, ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_OPTIONS: "--max-old-space-size=32768",
    },
  });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.rmSync(PROJECT_FIXTURE_ROOT, { recursive: true, force: true });
});

describe("Alice HowTo parity audit data contract", () => {
  it("exports stable audit constants", async () => {
    const audit = await loadAuditModule();

    expect(audit.EXPECTED_HOWTO_COUNT).toBe(EXPECTED_HOWTO_COUNT);
    expect(audit.RABBITHOLE_BASELINE).toBe(RABBITHOLE_BASELINE);
    expect(audit.DEFAULT_INVENTORY_PATH).toBe(DEFAULT_INVENTORY_PATH);
    expect(audit.DEFAULT_MAPPING_PATH).toBe(DEFAULT_MAPPING_PATH);
  });

  it("keeps the default saved Alice.org HowTo inventory at exactly 54 entries", () => {
    const filePath = path.join(PROJECT_ROOT, DEFAULT_INVENTORY_PATH);

    expect(fs.existsSync(filePath)).toBe(true);
    const inventory = readJson(filePath);

    expect(Array.isArray(inventory)).toBe(true);
    expect(inventory).toHaveLength(EXPECTED_HOWTO_COUNT);
    expect(new Set((inventory as InventoryEntry[]).map((entry) => entry.id)).size)
      .toBe(EXPECTED_HOWTO_COUNT);
    for (const entry of inventory as InventoryEntry[]) {
      expect(entry.id.trim()).toBe(entry.id);
      expect(entry.id).not.toBe("");
      expect(entry.title.trim()).not.toBe("");
    }
  });

  it("keeps the default coverage map aligned with the saved inventory", () => {
    const inventoryPath = path.join(PROJECT_ROOT, DEFAULT_INVENTORY_PATH);
    const mappingPath = path.join(PROJECT_ROOT, DEFAULT_MAPPING_PATH);

    expect(fs.existsSync(inventoryPath)).toBe(true);
    expect(fs.existsSync(mappingPath)).toBe(true);

    const inventory = readJson(inventoryPath) as InventoryEntry[];
    const mapping = readJson(mappingPath) as CoverageMapping;
    const inventoryIds = new Set(inventory.map((entry) => entry.id));
    const mappingIds = new Set(mapping.mappings.map((entry) => entry.id));

    expect(mapping.baseline).toBe(RABBITHOLE_BASELINE);
    expect(mapping.mappings).toHaveLength(EXPECTED_HOWTO_COUNT);
    expect([...inventoryIds].filter((id) => !mappingIds.has(id))).toEqual([]);
    expect([...mappingIds].filter((id) => !inventoryIds.has(id))).toEqual([]);

    for (const entry of mapping.mappings) {
      expect(entry.artifacts.length).toBeGreaterThan(0);
      for (const artifact of entry.artifacts) {
        expect(["vitest", "gadugi", "scenario", "other"]).toContain(artifact.type);
        expect(path.isAbsolute(artifact.path)).toBe(false);
        expect(artifact.path.split(/[\\/]/)).not.toContain("..");
        expect(fs.existsSync(path.join(PROJECT_ROOT, artifact.path))).toBe(true);
      }
    }
  });
});

describe("AuditInventoryLoader", () => {
  it("loads exactly 54 unique Alice.org HowTo entries in source order", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();

    const inventory = await audit.loadAuditInventory(fixture.inventoryPath);

    expect(inventory).toHaveLength(EXPECTED_HOWTO_COUNT);
    expect(inventory[0]).toEqual({
      id: "howto-01",
      title: "Alice HowTo 01",
      source: "Alice.org HowTo",
    });
    expect(inventory[53]?.id).toBe("howto-54");
  });

  it("rejects inventory counts other than 54", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    writeJson(fixture.inventoryPath, makeInventory(53));

    await expect(audit.loadAuditInventory(fixture.inventoryPath))
      .rejects
      .toThrow(/54/);
  });

  it("rejects duplicate IDs, empty IDs, and empty titles", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    const inventory = makeInventory();
    inventory[1] = { ...inventory[1], id: inventory[0].id };
    inventory[2] = { ...inventory[2], id: " " };
    inventory[3] = { ...inventory[3], title: " " };
    writeJson(fixture.inventoryPath, inventory);

    await expect(audit.loadAuditInventory(fixture.inventoryPath))
      .rejects
      .toThrow(/duplicate|empty|title/i);
  });

  it("rejects malformed JSON and non-array inventory files", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();

    writeText(fixture.inventoryPath, "{not-json");
    await expect(audit.loadAuditInventory(fixture.inventoryPath))
      .rejects
      .toThrow(/json|parse/i);

    writeJson(fixture.inventoryPath, { entries: makeInventory() });
    await expect(audit.loadAuditInventory(fixture.inventoryPath))
      .rejects
      .toThrow(/array/i);
  });
});

describe("CoverageMappingLoader", () => {
  it("loads the RabbitHole baseline and artifact mappings", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();

    const mapping = await audit.loadCoverageMapping(fixture.mappingPath);

    expect(mapping.baseline).toBe(RABBITHOLE_BASELINE);
    expect(mapping.mappings).toHaveLength(EXPECTED_HOWTO_COUNT);
    expect(mapping.mappings[0]?.artifacts[0]).toEqual({
      type: "vitest",
      path: "test/alice-howto-parity-fixture.test.ts",
      name: "Alice HowTo executable coverage",
    });
  });

  it("rejects a RabbitHole baseline that is not origin/develop", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    writeJson(fixture.mappingPath, {
      ...fixture.mapping,
      baseline: RABBITHOLE_BASELINE.replace("develop", "invalid"),
    });

    await expect(audit.loadCoverageMapping(fixture.mappingPath))
      .rejects
      .toThrow(/rysweet\/RabbitHole origin\/develop/);
  });

  it("rejects malformed mapping JSON and mapping files without mappings", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();

    writeText(fixture.mappingPath, "[");
    await expect(audit.loadCoverageMapping(fixture.mappingPath))
      .rejects
      .toThrow(/json|parse/i);

    writeJson(fixture.mappingPath, { baseline: RABBITHOLE_BASELINE });
    await expect(audit.loadCoverageMapping(fixture.mappingPath))
      .rejects
      .toThrow(/mappings/i);
  });
});

describe("ArtifactReferenceValidator and audit workflow", () => {
  it("passes when all 54 HowTos map to existing executable artifacts", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();

    const result = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    expect(result).toMatchObject({
      schemaVersion: 1,
      command: AUDIT_COMMAND,
      passed: true,
      baseline: { rabbitHole: RABBITHOLE_BASELINE },
      inventory: {
        path: DEFAULT_INVENTORY_PATH,
        expectedCount: EXPECTED_HOWTO_COUNT,
        actualCount: EXPECTED_HOWTO_COUNT,
        duplicateIds: [],
      },
      coverage: {
        path: DEFAULT_MAPPING_PATH,
        mappedCount: EXPECTED_HOWTO_COUNT,
        missingMappings: [],
        unknownMappings: [],
        invalidArtifacts: [],
      },
      errors: [],
    });
    expect(result.howTos).toHaveLength(EXPECTED_HOWTO_COUNT);
    expect(result.howTos.every((entry) => entry.covered)).toBe(true);
    expect(result.howTos[0]?.artifacts[0]).toMatchObject({
      path: "test/alice-howto-parity-fixture.test.ts",
      exists: true,
    });
    expect(JSON.stringify(result)).not.toContain(fixture.repoRoot);
    expect(JSON.stringify(result)).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(JSON.stringify(result)).not.toContain("LookingGlass");
  });

  it("reports a non-54 inventory count as machine-readable failure", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    writeJson(fixture.inventoryPath, makeInventory(53));

    const result = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    expect(result.passed).toBe(false);
    expect(result.inventory.actualCount).toBe(53);
    expect(result.errors.map((error) => error.code)).toContain("INVENTORY_COUNT_MISMATCH");
  });

  it("reports missing and unknown HowTo mappings", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    const inventory = makeInventory();
    const mappings = makeMapping(inventory).mappings.slice(1);
    writeJson(fixture.mappingPath, {
      baseline: RABBITHOLE_BASELINE,
      mappings: [
        ...mappings,
        {
          id: "unknown-howto",
          artifacts: [{
            type: "vitest",
            path: "test/alice-howto-parity-fixture.test.ts",
            name: "Unknown coverage",
          }],
        },
      ],
    });

    const result = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    expect(result.passed).toBe(false);
    expect(result.coverage.missingMappings).toEqual(["howto-01"]);
    expect(result.coverage.unknownMappings).toEqual(["unknown-howto"]);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["MISSING_MAPPING", "UNKNOWN_MAPPING"]),
    );
  });

  it("reports missing files, directories, invalid artifact types, and unsafe paths", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    const inventory = makeInventory();
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "alice-howto-outside-"));
    tempDirs.push(outsideDir);
    const outsideFile = path.join(outsideDir, "outside.test.ts");
    writeText(outsideFile, "export const outside = true;\n");
    fs.symlinkSync(outsideFile, path.join(fixture.repoRoot, "test/escaped-link.test.ts"));

    const unsafeMappings = makeMapping(inventory).mappings.map((entry, index) => {
      if (index === 0) {
        return {
          ...entry,
          artifacts: [{ type: "vitest", path: "test/missing.test.ts", name: "Missing file" }],
        };
      }
      if (index === 1) {
        return {
          ...entry,
          artifacts: [{ type: "vitest", path: "test", name: "Directory target" }],
        };
      }
      if (index === 2) {
        return {
          ...entry,
          artifacts: [{ type: "doc", path: "test/alice-howto-parity-fixture.test.ts", name: "Invalid type" }],
        };
      }
      if (index === 3) {
        return {
          ...entry,
          artifacts: [{ type: "vitest", path: "../outside.test.ts", name: "Traversal path" }],
        };
      }
      if (index === 4) {
        return {
          ...entry,
          artifacts: [{ type: "vitest", path: path.resolve(fixture.artifactPath), name: "Absolute path" }],
        };
      }
      if (index === 5) {
        return {
          ...entry,
          artifacts: [{ type: "vitest", path: "test/escaped-link.test.ts", name: "Escaped symlink" }],
        };
      }
      return entry;
    });
    writeJson(fixture.mappingPath, {
      baseline: RABBITHOLE_BASELINE,
      mappings: unsafeMappings,
    });

    const result = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    expect(result.passed).toBe(false);
    expect(result.coverage.invalidArtifacts.map((artifact) => artifact.path)).toEqual(
      expect.arrayContaining([
        "test/missing.test.ts",
        "test",
        "test/alice-howto-parity-fixture.test.ts",
        "../outside.test.ts",
        path.resolve(fixture.artifactPath),
        "test/escaped-link.test.ts",
      ]),
    );
    expect(result.errors.map((error) => error.code)).toContain("INVALID_ARTIFACT");
  });
});

describe("AuditReporter", () => {
  it("formats stable pretty JSON with no host-specific or point-in-time fields", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    const result = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    const first = audit.formatAuditJson(result);
    const second = audit.formatAuditJson(result);

    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(true);
    expect(first).toContain('\n  "schemaVersion": 1,');
    expect(JSON.parse(first)).toEqual(result);
    expect(first).not.toContain(fixture.repoRoot);
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(first).not.toContain("LookingGlass");
  });

  it("formats concise Alice summaries for passing and failing audits", async () => {
    const audit = await loadAuditModule();
    const fixture = makeTempRepo();
    const passing = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    expect(audit.formatAuditSummary(passing)).toBe([
      "Alice HowTo parity audit: PASS",
      "Inventory: 54/54 Alice.org HowTos",
      "Coverage: 54/54 mapped to executable artifacts",
      "RabbitHole baseline: rysweet/RabbitHole origin/develop",
      "",
    ].join("\n"));

    writeJson(fixture.inventoryPath, makeInventory(53));
    const failing = await audit.runAliceHowToParityAudit({
      repoRoot: fixture.repoRoot,
      inventoryPath: DEFAULT_INVENTORY_PATH,
      mappingPath: DEFAULT_MAPPING_PATH,
    });

    const summary = audit.formatAuditSummary(failing);
    expect(summary).toContain("Alice HowTo parity audit: FAIL\n");
    expect(summary).toContain("Inventory: 53/54 Alice.org HowTos\n");
    expect(summary).toMatch(/Coverage: \d+\/53 mapped to executable artifacts\n/);
    expect(summary).toContain(`Errors: ${failing.errors.length}\n`);
    expect(summary).toContain("RabbitHole baseline: rysweet/RabbitHole origin/develop\n");
    expect(summary).not.toContain("LookingGlass");
  });
});

describe("alice-web alice-howto-parity-audit CLI", () => {
  beforeAll(() => {
    buildServerCli();
  });

  it("parses audit command options without changing the Alice product identity", async () => {
    const { parseArgs } = await import("../src/cli");

    const config = parseArgs([
      "node",
      "cli.js",
      AUDIT_COMMAND,
      "--inventory",
      "custom/inventory.json",
      "--mapping",
      "custom/mapping.json",
      "--output",
      "/tmp/alice-howto-parity-audit.json",
    ]) as unknown as Record<string, unknown>;

    expect(config.command).toBe(AUDIT_COMMAND);
    expect(config.inventoryPath).toBe("custom/inventory.json");
    expect(config.mappingPath).toBe("custom/mapping.json");
    expect(config.outputPath).toBe("/tmp/alice-howto-parity-audit.json");
    expect(JSON.stringify(config)).not.toContain("LookingGlass");
  });

  it("prints help with the audit command and default input paths", () => {
    const result = runBuiltCli(["help"]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(`alice-web ${AUDIT_COMMAND}`);
    expect(result.stdout).toContain(`--inventory <path>`);
    expect(result.stdout).toContain(DEFAULT_INVENTORY_PATH);
    expect(result.stdout).toContain(DEFAULT_MAPPING_PATH);
    expect(result.stdout).not.toContain("LookingGlass");
  });

  it("writes JSON to stdout and summary to stderr when no output path is supplied", () => {
    const fixture = makeProjectFixture("stdout-pass");

    const result = runBuiltCli([
      AUDIT_COMMAND,
      "--inventory",
      fixture.inventoryPath,
      "--mapping",
      fixture.mappingPath,
    ]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const json = JSON.parse(result.stdout) as AuditResult;
    expect(json.passed).toBe(true);
    expect(json.inventory.actualCount).toBe(EXPECTED_HOWTO_COUNT);
    expect(json.coverage.mappedCount).toBe(EXPECTED_HOWTO_COUNT);
    expect(json.baseline.rabbitHole).toBe(RABBITHOLE_BASELINE);
    expect(result.stderr).toContain("Alice HowTo parity audit: PASS");
    expect(result.stderr).toContain(RABBITHOLE_BASELINE);
    expect(fs.existsSync(path.join(PROJECT_ROOT, "alice-howto-parity-audit.json"))).toBe(false);
    expect(fs.existsSync(path.join(PROJECT_ROOT, "data/alice-howto-parity-audit.json"))).toBe(false);
    expect(fs.existsSync(path.join(PROJECT_ROOT, "docs/alice-howto-parity-audit.json"))).toBe(false);
  });

  it("writes JSON to the requested output path and summary to stdout", () => {
    const fixture = makeProjectFixture("output-pass");

    const result = runBuiltCli([
      AUDIT_COMMAND,
      "--inventory",
      fixture.inventoryPath,
      "--mapping",
      fixture.mappingPath,
      "--output",
      fixture.outputPath,
    ]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Alice HowTo parity audit: PASS");
    expect(result.stderr).toBe("");
    const json = readJson(fixture.outputPath) as AuditResult;
    expect(json.passed).toBe(true);
    expect(json.howTos).toHaveLength(EXPECTED_HOWTO_COUNT);
  });

  it("returns non-zero with machine-readable JSON when the inventory count is wrong", () => {
    const inventory = makeInventory(53);
    const fixture = makeProjectFixture("stdout-fail", inventory, makeMapping(
      inventory,
      ".test-alice-howto-parity-audit/stdout-fail/test/alice-howto-parity-fixture.test.ts",
    ));

    const result = runBuiltCli([
      AUDIT_COMMAND,
      "--inventory",
      fixture.inventoryPath,
      "--mapping",
      fixture.mappingPath,
    ]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    const json = JSON.parse(result.stdout) as AuditResult;
    expect(json.passed).toBe(false);
    expect(json.inventory.actualCount).toBe(53);
    expect(json.errors.map((error) => error.code)).toContain("INVENTORY_COUNT_MISMATCH");
    expect(result.stderr).toContain("Alice HowTo parity audit: FAIL");
  });
});
