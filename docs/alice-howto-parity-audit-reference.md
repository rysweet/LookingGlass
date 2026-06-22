---
title: "Alice HowTo parity audit reference"
description: CLI, data, output, and TypeScript API contract for the Alice HowTo parity audit.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: reference
---

# Alice HowTo parity audit reference

This reference defines the command, input files, JSON output, and TypeScript API
for the Alice HowTo parity audit.

The audit checks the saved Alice.org HowTo inventory against executable
alice-web coverage. It uses `rysweet/RabbitHole origin/develop` as the
RabbitHole baseline.

## Contents

- [Command](#command)
- [Options](#options)
- [Exit codes](#exit-codes)
- [Input files](#input-files)
- [JSON output](#json-output)
- [Validation rules](#validation-rules)
- [TypeScript API](#typescript-api)
- [CI usage](#ci-usage)

## Command

The CLI contract is:

```bash
alice-web alice-howto-parity-audit [options]
```

For a local checkout:

```bash
npm run build:server
node dist-server/cli.js alice-howto-parity-audit [options]
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `--inventory <path>` | `data/alice-org-howto-inventory.json` | Saved Alice.org HowTo inventory JSON |
| `--mapping <path>` | `data/alice-howto-coverage-map.json` | Mapping from HowTo IDs to executable coverage artifacts |
| `--output <path>` | none | JSON output path chosen by the caller; prefer temporary or CI artifact paths |
| `--help` | none | Print command help |

When `--output` is omitted, JSON is written to stdout and the human summary is
written to stderr. When `--output` is present, JSON is written to that path and
the summary is written to stdout.

## Exit codes

The command follows the existing `alice-web` CLI convention:

| Exit code | Meaning |
| --- | --- |
| `0` | Help printed, or the audit passed |
| `1` | The audit found parity problems, or the command could not complete because inputs, options, or output paths were invalid |

When the command can run the audit, the JSON `passed` field and `errors` array
identify parity failures. Invalid command usage may print only to stderr and may
not produce audit JSON.

## Input files

### `data/alice-org-howto-inventory.json`

The inventory file contains exactly 54 saved Alice.org HowTo entries:

```json
[
  {
    "id": "events-when-key-is-typed",
    "title": "When a key is typed",
    "source": "Alice.org HowTo"
  }
]
```

Required fields:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Non-empty, unique, stable identifier |
| `title` | string | Non-empty Alice.org HowTo title |

Optional fields may describe the saved source, category, or local notes. The
audit preserves unknown fields in memory but does not require them.

### `data/alice-howto-coverage-map.json`

The coverage-map data contract contains one entry for every inventory ID:

```json
{
  "baseline": "rysweet/RabbitHole origin/develop",
  "mappings": [
    {
      "id": "events-when-key-is-typed",
      "artifacts": [
        {
          "type": "vitest",
          "path": "test/event-system.test.ts",
          "name": "keyboard event behavior"
        },
        {
          "type": "gadugi",
          "path": "gadugi/04-event-system.yaml",
          "name": "Event System"
        }
      ]
    }
  ]
}
```

Required mapping fields:

| Field | Type | Rule |
| --- | --- | --- |
| `baseline` | string | Must equal `rysweet/RabbitHole origin/develop` |
| `mappings` | array | One mapping for every inventory ID |
| `mappings[].id` | string | Must match an inventory ID |
| `mappings[].artifacts` | array | Must contain at least one artifact |
| `artifacts[].type` | string | `vitest`, `gadugi`, `scenario`, or `other` |
| `artifacts[].path` | string | Repository-relative executable file path |
| `artifacts[].name` | string | Human-readable coverage label |

## JSON output

The command emits stable, pretty-printed JSON:

```json
{
  "schemaVersion": 1,
  "command": "alice-howto-parity-audit",
  "passed": true,
  "baseline": {
    "rabbitHole": "rysweet/RabbitHole origin/develop"
  },
  "inventory": {
    "path": "data/alice-org-howto-inventory.json",
    "expectedCount": 54,
    "actualCount": 54,
    "duplicateIds": []
  },
  "coverage": {
    "path": "data/alice-howto-coverage-map.json",
    "mappedCount": 54,
    "missingMappings": [],
    "unknownMappings": [],
    "invalidArtifacts": []
  },
  "howTos": [
    {
      "id": "events-when-key-is-typed",
      "title": "When a key is typed",
      "covered": true,
      "artifacts": [
        {
          "type": "vitest",
          "path": "test/event-system.test.ts",
          "name": "keyboard event behavior",
          "exists": true
        }
      ]
    }
  ],
  "errors": []
}
```

Output rules:

- Paths are repository-relative.
- Entry order follows the inventory file.
- The output does not include absolute host paths, environment variables, file
  contents, stack traces, or timestamps.
- `passed` is `true` only when all validation rules pass.

## Validation rules

The audit fails when any of these checks fail:

| Area | Rule |
| --- | --- |
| Inventory count | The inventory must contain exactly 54 entries |
| Inventory IDs | IDs must be non-empty and unique |
| Inventory titles | Titles must be non-empty |
| Mapping coverage | Every inventory ID must have a mapping |
| Mapping keys | Mapping IDs must exist in the inventory |
| Artifact count | Every mapping must contain at least one artifact |
| Artifact type | Type must be `vitest`, `gadugi`, `scenario`, or `other` |
| Artifact path | Path must be repository-relative and stay inside the repository |
| Artifact target | Path must point to an existing file, not a directory |
| Symlinks | Symlink resolution must not escape the repository |
| Output path | When supplied, the path must resolve to a writable file target |
| Baseline | RabbitHole baseline must equal `rysweet/RabbitHole origin/develop` |

## TypeScript API

The public audit module surface is `src/alice-howto-parity-audit.ts`.

### `runAliceHowToParityAudit(options)`

Runs the full audit and returns an `AuditResult`.

```typescript
import { runAliceHowToParityAudit } from "./alice-howto-parity-audit.js";

const result = await runAliceHowToParityAudit({
  repoRoot: process.cwd(),
  inventoryPath: "data/alice-org-howto-inventory.json",
  mappingPath: "data/alice-howto-coverage-map.json",
});

if (!result.passed) {
  process.exitCode = 1;
}
```

```typescript
interface AuditOptions {
  repoRoot: string;
  inventoryPath?: string;
  mappingPath?: string;
}
```

### `loadAuditInventory(path)`

Loads and validates inventory JSON. It rejects malformed JSON, non-array input,
duplicate IDs, empty IDs, empty titles, and counts other than 54.

```typescript
const inventory = await loadAuditInventory("data/alice-org-howto-inventory.json");
```

### `loadCoverageMapping(path)`

Loads and validates the mapping JSON shape. Full cross-checking against the
inventory happens in `runAliceHowToParityAudit`.

```typescript
const mapping = await loadCoverageMapping("data/alice-howto-coverage-map.json");
```

### `formatAuditJson(result)`

Formats an `AuditResult` as stable pretty JSON with a trailing newline.

```typescript
const json = formatAuditJson(result);
```

### `formatAuditSummary(result)`

Formats the terminal summary.

```typescript
const summary = formatAuditSummary(result);
```

### Result types

```typescript
type CoverageArtifactType = "vitest" | "gadugi" | "scenario" | "other";

interface AuditResult {
  schemaVersion: 1;
  command: "alice-howto-parity-audit";
  passed: boolean;
  baseline: {
    rabbitHole: "rysweet/RabbitHole origin/develop";
  };
  inventory: {
    path: string;
    expectedCount: 54;
    actualCount: number;
    duplicateIds: string[];
  };
  coverage: {
    path: string;
    mappedCount: number;
    missingMappings: string[];
    unknownMappings: string[];
    invalidArtifacts: InvalidArtifact[];
  };
  howTos: HowToAuditEntry[];
  errors: AuditError[];
}

interface HowToAuditEntry {
  id: string;
  title: string;
  covered: boolean;
  artifacts: CoverageArtifact[];
}

interface CoverageArtifact {
  type: CoverageArtifactType;
  path: string;
  name: string;
  exists: boolean;
}

interface InvalidArtifact {
  howToId: string;
  path: string;
  reason: string;
}

interface AuditError {
  code: string;
  message: string;
  howToId?: string;
  path?: string;
}
```

## CI usage

Use the audit as a CI gate and upload its JSON file as an artifact:

```bash
export NODE_OPTIONS=--max-old-space-size=32768
npm ci
npm run build:server
node dist-server/cli.js alice-howto-parity-audit \
  --output "$RUNNER_TEMP/alice-howto-parity-audit.json"
```

The JSON file is suitable for CI artifacts and PR comments. Keep generated audit
JSON out of the repository.

Related guide: [Alice HowTo parity audit](./alice-howto-parity-audit.md).
