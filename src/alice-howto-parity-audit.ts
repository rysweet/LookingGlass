import { promises as fs } from "fs";
import * as path from "path";

export const EXPECTED_HOWTO_COUNT = 54 as const;
export const RABBITHOLE_BASELINE = "rysweet/RabbitHole origin/develop" as const;
export const DEFAULT_INVENTORY_PATH = "data/alice-org-howto-inventory.json" as const;
export const DEFAULT_MAPPING_PATH = "data/alice-howto-coverage-map.json" as const;
export const AUDIT_COMMAND = "alice-howto-parity-audit" as const;

export type CoverageArtifactType = "vitest" | "gadugi" | "scenario" | "other";

export interface InventoryEntry {
  readonly id: string;
  readonly title: string;
  readonly source?: string;
  readonly [key: string]: unknown;
}

export interface CoverageArtifact {
  readonly type: CoverageArtifactType;
  readonly path: string;
  readonly name: string;
}

export interface CoverageMappingEntry {
  readonly id: string;
  readonly artifacts: readonly CoverageArtifact[];
}

export interface CoverageMapping {
  readonly baseline: string;
  readonly mappings: readonly CoverageMappingEntry[];
}

export interface AuditOptions {
  readonly repoRoot: string;
  readonly inventoryPath?: string;
  readonly mappingPath?: string;
}

export interface AuditArtifact extends CoverageArtifact {
  readonly exists: boolean;
}

export interface InvalidArtifact {
  readonly howToId: string;
  readonly path: string;
  readonly reason: string;
}

export interface HowToAuditEntry {
  readonly id: string;
  readonly title: string;
  readonly covered: boolean;
  readonly artifacts: readonly AuditArtifact[];
}

export interface AuditError {
  readonly code: string;
  readonly message: string;
  readonly howToId?: string;
  readonly path?: string;
}

export interface AuditResult {
  readonly schemaVersion: 1;
  readonly command: typeof AUDIT_COMMAND;
  readonly passed: boolean;
  readonly baseline: {
    readonly rabbitHole: typeof RABBITHOLE_BASELINE;
  };
  readonly inventory: {
    readonly path: string;
    readonly expectedCount: typeof EXPECTED_HOWTO_COUNT;
    readonly actualCount: number;
    readonly duplicateIds: readonly string[];
  };
  readonly coverage: {
    readonly path: string;
    readonly mappedCount: number;
    readonly missingMappings: readonly string[];
    readonly unknownMappings: readonly string[];
    readonly invalidArtifacts: readonly InvalidArtifact[];
  };
  readonly howTos: readonly HowToAuditEntry[];
  readonly errors: readonly AuditError[];
}

const ALLOWED_ARTIFACT_TYPES = new Set<string>(["vitest", "gadugi", "scenario", "other"]);

export async function loadAuditInventory(filePath: string): Promise<readonly InventoryEntry[]> {
  const { entries, errors } = await readInventory(filePath);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }
  return entries;
}

export async function loadCoverageMapping(filePath: string): Promise<CoverageMapping> {
  const json = await readJsonFile(filePath, "coverage mapping");
  if (!isRecord(json)) {
    throw new Error(`Coverage mapping must be a JSON object: ${filePath}`);
  }
  if (json.baseline !== RABBITHOLE_BASELINE) {
    throw new Error(`Coverage mapping baseline must be ${RABBITHOLE_BASELINE}`);
  }
  if (!Array.isArray(json.mappings)) {
    throw new Error(`Coverage mapping must include a mappings array: ${filePath}`);
  }

  const errors: string[] = [];
  const seen = new Set<string>();
  const mappings = json.mappings.map((entry, index): CoverageMappingEntry | undefined => {
    if (!isRecord(entry)) {
      errors.push(`Coverage mapping entry ${index + 1} must be an object`);
      return undefined;
    }
    const id = typeof entry.id === "string" ? entry.id : "";
    if (!id.trim()) {
      errors.push(`Coverage mapping entry ${index + 1} has an empty HowTo ID`);
    } else if (id !== id.trim()) {
      errors.push(`Coverage mapping entry ${index + 1} has a HowTo ID with surrounding whitespace`);
    } else if (seen.has(id)) {
      errors.push(`Coverage mapping contains duplicate HowTo ID: ${id}`);
    } else {
      seen.add(id);
    }

    if (!Array.isArray(entry.artifacts)) {
      errors.push(`Coverage mapping entry ${id || index + 1} must include an artifacts array`);
      return undefined;
    }

    const artifacts = entry.artifacts.map((artifact, artifactIndex): CoverageArtifact | undefined => {
      if (!isRecord(artifact)) {
        errors.push(`Artifact ${artifactIndex + 1} for ${id || `entry ${index + 1}`} must be an object`);
        return undefined;
      }
      const type = typeof artifact.type === "string" ? artifact.type : "";
      const artifactPath = typeof artifact.path === "string" ? artifact.path : "";
      const name = typeof artifact.name === "string" ? artifact.name : "";
      if (!type.trim()) {
        errors.push(`Artifact ${artifactIndex + 1} for ${id || `entry ${index + 1}`} must include a type`);
      }
      if (!artifactPath.trim()) {
        errors.push(`Artifact ${artifactIndex + 1} for ${id || `entry ${index + 1}`} must include a path`);
      }
      if (!name.trim()) {
        errors.push(`Artifact ${artifactIndex + 1} for ${id || `entry ${index + 1}`} must include a name`);
      }
      return {
        type: type as CoverageArtifactType,
        path: artifactPath,
        name,
      };
    }).filter((artifact): artifact is CoverageArtifact => artifact !== undefined);

    return { id, artifacts };
  }).filter((entry): entry is CoverageMappingEntry => entry !== undefined);

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return {
    baseline: RABBITHOLE_BASELINE,
    mappings,
  };
}

export async function runAliceHowToParityAudit(options: AuditOptions): Promise<AuditResult> {
  const repoRoot = path.resolve(options.repoRoot);
  const inventoryPath = options.inventoryPath ?? DEFAULT_INVENTORY_PATH;
  const mappingPath = options.mappingPath ?? DEFAULT_MAPPING_PATH;
  const inventoryFilePath = resolveRepoPath(repoRoot, inventoryPath);
  const mappingFilePath = resolveRepoPath(repoRoot, mappingPath);

  const inventory = await readInventory(inventoryFilePath);
  const mapping = await loadCoverageMapping(mappingFilePath);
  const errors: AuditError[] = [...inventory.errors];
  const inventoryIds = new Set(inventory.entries.map((entry) => entry.id));
  const mappingById = new Map(mapping.mappings.map((entry) => [entry.id, entry]));
  const missingMappings = inventory.entries
    .filter((entry) => !mappingById.has(entry.id))
    .map((entry) => entry.id);
  const unknownMappings = mapping.mappings
    .filter((entry) => !inventoryIds.has(entry.id))
    .map((entry) => entry.id);
  const invalidArtifacts: InvalidArtifact[] = [];

  for (const id of missingMappings) {
    errors.push({
      code: "MISSING_MAPPING",
      message: `Alice.org HowTo ${id} has no coverage mapping`,
      howToId: id,
    });
  }

  for (const id of unknownMappings) {
    errors.push({
      code: "UNKNOWN_MAPPING",
      message: `Coverage mapping references unknown Alice.org HowTo ${id}`,
      howToId: id,
    });
  }

  const artifactValidityByHowTo = new Map<string, InvalidArtifact[]>();
  const artifactResultsByHowTo = new Map<string, AuditArtifact[]>();
  for (const entry of mapping.mappings) {
    const artifactResults: AuditArtifact[] = [];
    const entryInvalidArtifacts: InvalidArtifact[] = [];
    if (entry.artifacts.length === 0) {
      const invalid = {
        howToId: entry.id,
        path: "",
        reason: "Coverage mapping must include at least one artifact",
      };
      entryInvalidArtifacts.push(invalid);
      invalidArtifacts.push(invalid);
    }

    for (const artifact of entry.artifacts) {
      const validation = await validateArtifactReference(repoRoot, artifact);
      artifactResults.push({
        type: artifact.type,
        path: artifact.path,
        name: artifact.name,
        exists: validation.exists,
      });
      if (validation.reason) {
        const invalid = {
          howToId: entry.id,
          path: artifact.path,
          reason: validation.reason,
        };
        entryInvalidArtifacts.push(invalid);
        invalidArtifacts.push(invalid);
      }
    }

    artifactResultsByHowTo.set(entry.id, artifactResults);
    artifactValidityByHowTo.set(entry.id, entryInvalidArtifacts);
  }

  for (const invalid of invalidArtifacts) {
    errors.push({
      code: "INVALID_ARTIFACT",
      message: `Coverage artifact for ${invalid.howToId} is invalid: ${invalid.reason}`,
      howToId: invalid.howToId,
      path: invalid.path,
    });
  }

  const howTos = inventory.entries.map((entry): HowToAuditEntry => {
    const artifacts = artifactResultsByHowTo.get(entry.id) ?? [];
    const invalidForEntry = artifactValidityByHowTo.get(entry.id) ?? [];
    return {
      id: entry.id,
      title: entry.title,
      covered: artifacts.length > 0 && invalidForEntry.length === 0,
      artifacts,
    };
  });

  const mappedCount = howTos.filter((entry) => entry.covered).length;

  return {
    schemaVersion: 1,
    command: AUDIT_COMMAND,
    passed: errors.length === 0,
    baseline: {
      rabbitHole: RABBITHOLE_BASELINE,
    },
    inventory: {
      path: inventoryPath,
      expectedCount: EXPECTED_HOWTO_COUNT,
      actualCount: inventory.entries.length,
      duplicateIds: inventory.duplicateIds,
    },
    coverage: {
      path: mappingPath,
      mappedCount,
      missingMappings,
      unknownMappings,
      invalidArtifacts,
    },
    howTos,
    errors,
  };
}

export function formatAuditJson(result: AuditResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function formatAuditSummary(result: AuditResult): string {
  const lines = [
    `Alice HowTo parity audit: ${result.passed ? "PASS" : "FAIL"}`,
    `Inventory: ${result.inventory.actualCount}/${result.inventory.expectedCount} Alice.org HowTos`,
    `Coverage: ${result.coverage.mappedCount}/${result.inventory.actualCount} mapped to executable artifacts`,
  ];
  if (!result.passed) {
    lines.push(`Errors: ${result.errors.length}`);
  }
  lines.push(`RabbitHole baseline: ${RABBITHOLE_BASELINE}`);
  return `${lines.join("\n")}\n`;
}

async function readInventory(filePath: string): Promise<{
  readonly entries: readonly InventoryEntry[];
  readonly duplicateIds: readonly string[];
  readonly errors: readonly AuditError[];
}> {
  const json = await readJsonFile(filePath, "Alice.org HowTo inventory");
  if (!Array.isArray(json)) {
    throw new Error(`Alice.org HowTo inventory must be a JSON array: ${filePath}`);
  }

  const errors: AuditError[] = [];
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  const entries = json.map((entry, index): InventoryEntry => {
    if (!isRecord(entry)) {
      errors.push({
        code: "INVALID_INVENTORY_ENTRY",
        message: `Inventory entry ${index + 1} must be an object`,
      });
      return { id: "", title: "" };
    }

    const id = typeof entry.id === "string" ? entry.id : "";
    const title = typeof entry.title === "string" ? entry.title : "";
    if (!id.trim()) {
      errors.push({
        code: "INVALID_INVENTORY_ENTRY",
        message: `Inventory entry ${index + 1} has an empty ID`,
      });
    } else if (id !== id.trim()) {
      errors.push({
        code: "INVALID_INVENTORY_ENTRY",
        message: `Inventory entry ${index + 1} has an ID with surrounding whitespace`,
        howToId: id,
      });
    } else if (seen.has(id)) {
      duplicateIds.push(id);
      errors.push({
        code: "DUPLICATE_INVENTORY_ID",
        message: `Inventory contains duplicate Alice.org HowTo ID: ${id}`,
        howToId: id,
      });
    } else {
      seen.add(id);
    }

    if (!title.trim()) {
      errors.push({
        code: "INVALID_INVENTORY_ENTRY",
        message: `Inventory entry ${id || index + 1} has an empty title`,
        howToId: id || undefined,
      });
    }

    return {
      ...entry,
      id,
      title,
    } as InventoryEntry;
  });

  if (entries.length !== EXPECTED_HOWTO_COUNT) {
    errors.push({
      code: "INVENTORY_COUNT_MISMATCH",
      message: `Alice.org HowTo inventory must contain exactly ${EXPECTED_HOWTO_COUNT} entries; found ${entries.length}`,
    });
  }

  return { entries, duplicateIds, errors };
}

async function readJsonFile(filePath: string, label: string): Promise<unknown> {
  let text: string;
  try {
    text = await fs.readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Unable to read ${label} file: ${filePath}: ${formatError(error)}`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Unable to parse ${label} JSON: ${filePath}: ${formatError(error)}`);
  }
}

async function validateArtifactReference(repoRoot: string, artifact: CoverageArtifact): Promise<{
  readonly exists: boolean;
  readonly reason?: string;
}> {
  if (!ALLOWED_ARTIFACT_TYPES.has(artifact.type)) {
    return { exists: false, reason: `Artifact type must be one of vitest, gadugi, scenario, or other` };
  }
  if (!artifact.path.trim()) {
    return { exists: false, reason: "Artifact path must be non-empty" };
  }
  if (path.isAbsolute(artifact.path)) {
    return { exists: false, reason: "Artifact path must be repository-relative" };
  }
  if (artifact.path.split(/[\\/]/).includes("..")) {
    return { exists: false, reason: "Artifact path must not contain traversal segments" };
  }

  const absolutePath = path.resolve(repoRoot, artifact.path);
  if (!isInside(repoRoot, absolutePath)) {
    return { exists: false, reason: "Artifact path must stay inside the repository" };
  }

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch (error) {
    const code = isNodeError(error) ? error.code : undefined;
    if (code === "ENOENT") {
      return { exists: false, reason: "Artifact file does not exist" };
    }
    throw new Error(`Unable to inspect coverage artifact ${artifact.path}: ${formatError(error)}`);
  }

  if (!stat.isFile()) {
    return { exists: false, reason: "Artifact path must point to a file" };
  }

  const [realRepoRoot, realArtifactPath] = await Promise.all([
    fs.realpath(repoRoot),
    fs.realpath(absolutePath),
  ]);
  if (!isInside(realRepoRoot, realArtifactPath)) {
    return { exists: false, reason: "Artifact symlink target must stay inside the repository" };
  }

  return { exists: true };
}

function resolveRepoPath(repoRoot: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
