# Tweedle Statement Execution

The statement executor interprets parsed Tweedle statements from Alice `.a3p`
projects and updates server state (object positions, event log). It powers
the `POST /api/world/run` endpoint and the `eatme-run-world` CLI hook.

## Overview

When you call `POST /api/world/run`, the server:

1. Reads the parsed `AliceProject` stored at launch time
2. Seeds an `ExecutionState` from the project's scene objects
3. Walks every `AliceStatement` in every method's `statements` array
4. Dispatches each statement by `kind` — mutating positions or appending to
   the event log
5. Returns the execution result alongside existing response fields

The executor is a **pure module** (`src/statement-executor.ts`) with zero I/O
dependencies. It takes statements and state in, returns results out.

## Quick Start

```bash
# Build and start the server
npm run build:server
node dist-server/cli.js serve \
  --port 3000 \
  --evidence-dir ./evidence \
  --project /path/to/starter.a3p

# Launch the project (parses .a3p and stores AliceProject)
curl -X POST http://localhost:3000/api/launch \
  -H 'Content-Type: application/json' \
  -d '{"project": "/path/to/starter.a3p"}'

# Execute statements
curl -X POST http://localhost:3000/api/world/run
```

## Supported Statement Kinds

| Kind | Behavior |
|------|----------|
| `MethodCall` | Dispatches by method name. `move` → position z+1 (unconditional, ignores arguments). `turn`, `say`, `roll` → event log entry. Unknown methods → event log with `"call"` action. When `object` is `"this"`, logs the call but skips position mutation. |
| `CountLoop` | Executes `body` statements × `count` iterations (capped at 10,000). |
| `IfElse` | Evaluates `condition` string: `"true"` → executes `ifBody`, anything else → executes `elseBody`. |
| `EventListener` | Logs `{action: "registerEvent", event: "..."}` to the event log. No side effects. |
| `ReturnStatement` | Logs `{action: "return", detail: expression}`. Does **not** terminate execution (statements after the return still run). |
| `Comment` | No-op. Skipped silently. |
| `VariableDeclaration` | Logs `{action: "declare", name: "...", detail: "type = value"}`. |
| Unknown | Logs `{action: "skipped", detail: "Unknown kind: ..."}`. Not fatal. |

## API Reference

### `POST /api/world/run`

Executes the Tweedle statements from the launched project.

**Prerequisite:** `POST /api/launch` must be called first with a valid `.a3p`
project.

**Request:** No body required.

**Response:**

```jsonc
{
  // Existing fields (unchanged, backward compatible)
  "schema_version": "eatme.alice-run-world-result/v1",
  "status": "completed",
  "project_name": "myProject",
  "scene_object_count": 3,
  "run_duration_ms": 4,
  "evidenceArtifact": "/path/to/evidence/run-world-result.json",

  // New fields from statement execution
  "statements_executed": 5,
  "event_log": [
    { "action": "move", "object": "bunny", "detail": "z+1 → {x:0,y:0,z:1}" },
    { "action": "call", "object": "this", "method": "say", "detail": "Hello" },
    { "action": "registerEvent", "event": "SceneActivation" },
    { "action": "return", "detail": "42" },
    { "action": "skipped", "detail": "Unknown kind: FooBarStatement" }
  ]
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `statements_executed` | `number` | Total statements dispatched (including nested loop/if bodies). |
| `event_log` | `EventLogEntry[]` | Ordered trace of every side effect produced during execution. |

**Error responses:**

| Status | Body | When |
|--------|------|------|
| `400` | `{"error": "Not launched. Call POST /api/launch first."}` | No prior launch call. |

### Event Log Entry Shape

```typescript
interface EventLogEntry {
  action: string;       // "move", "call", "registerEvent", "return", "declare", "skipped"
  object?: string;      // Scene object name (for MethodCall)
  method?: string;      // Method name (for MethodCall)
  name?: string;        // Variable name (for VariableDeclaration)
  event?: string;       // Event name (for EventListener)
  detail?: string;      // Human-readable detail
}
```

> **Serialization note:** The executor returns `camelCase` properties
> (`statementsExecuted`, `eventLog`). The server maps these to `snake_case`
> (`statements_executed`, `event_log`) in the JSON response to match existing
> field naming conventions.

## CLI Hook: `eatme-run-world`

The `tools/eatme-run-world` hook also executes statements:

```bash
tools/eatme-run-world --project starter.a3p --evidence-dir ./evidence --json
```

**Stdout** (single JSON line):

```json
{
  "schema_version": "eatme.alice-run-world-result/v1",
  "status": "completed",
  "run_selector": "scene.eatmeFirstLessonStep",
  "run_evidence_artifact": "run-world-result.json",
  "statements_executed": 3
}
```

**Evidence artifact** (`run-world-result.json`):

```json
{
  "schema_version": "eatme.alice-run-world-result/v1",
  "status": "completed",
  "project_name": "myProject",
  "scene_object_count": 3,
  "run_duration_ms": 5,
  "statements_executed": 3,
  "event_log": [
    { "action": "move", "object": "bunny", "detail": "z+1 → {x:0,y:0,z:1}" }
  ],
  "errors": []
}
```

## Module API: `statement-executor.ts`

The executor is a standalone module for direct use in tests or
custom integrations.

### Types

```typescript
interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ExecutionObject {
  name: string;
  className: string;
  position: Vec3;
}

interface EventLogEntry {
  action: string;
  object?: string;
  method?: string;
  name?: string;
  event?: string;
  detail?: string;
}

interface ExecutionState {
  objects: Map<string, ExecutionObject>;
  eventLog: EventLogEntry[];
  statementsExecuted: number;
  depth: number;
}

interface ExecutionResult {
  statementsExecuted: number;
  eventLog: EventLogEntry[];
  objects: Map<string, ExecutionObject>;
}
```

### Functions

#### `createExecutionState(sceneObjects: AliceObject[]): ExecutionState`

Seeds the execution state from parsed scene objects. Each object gets a
default position of `{x: 0, y: 0, z: 0}` unless the parser extracted an
explicit position.

```typescript
import { createExecutionState } from "./statement-executor.js";

const state = createExecutionState(parsedProject.sceneObjects);
// state.objects → Map with "ground", "camera", "bunny", etc.
```

#### `executeStatements(stmts: AliceStatement[], state: ExecutionState): ExecutionResult`

Walks the statement array, dispatching each by `kind`. Mutates `state`
in place and returns the result.

```typescript
import { executeStatements, createExecutionState } from "./statement-executor.js";
import type { AliceStatement } from "./a3p-parser.js";

// Note: These are synthetic test statements with named objects.
// Real parser output uses object: "this" for all MethodCall statements
// (see Known Limitations below).
const stmts: AliceStatement[] = [
  { kind: "MethodCall", object: "bunny", method: "move", arguments: [] },
  { kind: "CountLoop", count: 3, body: [
    { kind: "MethodCall", object: "bunny", method: "turn", arguments: [] },
  ]},
];

const state = createExecutionState([
  { name: "bunny", typeName: "org.lgna.story.SBiped", resourceType: null, position: null, orientation: null, size: null },
]);

const result = executeStatements(stmts, state);
console.log(result.statementsExecuted); // 5 (1 move + 3 turns + 1 loop)
console.log(result.eventLog.length);     // 4 (1 move + 3 turns)
console.log(result.objects.get("bunny")?.position); // { x: 0, y: 0, z: 1 }
```

## Security Limits

The executor enforces hard caps to prevent runaway execution:

| Limit | Value | Effect |
|-------|-------|--------|
| Recursion depth | 100 | Nested CountLoop/IfElse beyond depth 100 → skip with log entry |
| Loop iterations | 10,000 | `CountLoop.count` clamped to 10,000 |
| Total statements | 50,000 | Execution halts after 50,000 dispatches |
| Condition eval | String comparison only | `condition === "true"` → true branch; never uses `eval()` |
| Module purity | Zero I/O imports | No `fs`, `path`, `child_process`, or network in executor |
| Object storage | `Map<string, T>` | Immune to prototype pollution |

## Configuration

No configuration is required. The executor uses sensible defaults. The limits
above are compile-time constants in `src/statement-executor.ts`:

```typescript
const MAX_DEPTH = 100;
const MAX_LOOP_ITERATIONS = 10_000;
const MAX_TOTAL_STATEMENTS = 50_000;
```

To change these limits, modify the constants and rebuild:

```bash
npm run build:server
```

## Architecture

```
src/
  statement-executor.ts   ← NEW: Pure executor module
  a3p-parser.ts           ← Existing: Parses .a3p → AliceProject
  server.ts               ← Modified: Wires executor into /api/world/run
  hooks/
    run-world.ts          ← Modified: Wires executor into CLI hook
```

**Data flow:**

```
.a3p file
  → parseA3P()           → AliceProject { methods[].statements[] }
  → createExecutionState() → ExecutionState { objects, eventLog }
  → executeStatements()    → ExecutionResult { statementsExecuted, eventLog, objects }
  → HTTP response / CLI output
```

## Testing

Run the executor tests:

```bash
npm test -- test/statement-executor.test.ts
```

The test suite covers:

| # | Test | Verifies |
|---|------|----------|
| 1 | Empty statements | Returns 0 executed, empty log |
| 2 | MethodCall move | Position z+1 mutation |
| 3 | MethodCall turn | Event log entry |
| 4 | MethodCall say | Event log entry |
| 5 | MethodCall unknown method | Logged as generic "call" |
| 6 | CountLoop | Body executed N times |
| 7 | IfElse true branch | Only ifBody runs |
| 8 | IfElse false branch | Only elseBody runs |
| 9 | EventListener | Registration logged |
| 10 | ReturnStatement | Return value logged |
| 11 | Comment | Silently skipped |
| 12 | Unknown kind | Logged as skipped |
| 13 | Real .a3p project | Parse + execute against actual project file |

### Example Test

```typescript
import { describe, it, expect } from "vitest";
import { createExecutionState, executeStatements } from "../src/statement-executor.js";

describe("statement-executor", () => {
  it("moves an object forward", () => {
    const state = createExecutionState([
      { name: "bunny", typeName: "SBiped", resourceType: null,
        position: null, orientation: null, size: null },
    ]);

    const result = executeStatements(
      [{ kind: "MethodCall", object: "bunny", method: "move", arguments: [] }],
      state,
    );

    expect(result.statementsExecuted).toBe(1);
    expect(result.objects.get("bunny")?.position).toEqual({ x: 0, y: 0, z: 1 });
    expect(result.eventLog).toHaveLength(1);
    expect(result.eventLog[0].action).toBe("move");
  });
});
```

## Known Limitations

1. **Parser emits `object: "this"` for all MethodCall statements.** The `.a3p`
   parser (`a3p-parser.ts`) hardcodes `object: "this"` because the Tweedle AST
   refers to the declaring class, not the scene object. The executor handles
   this by logging `"this"` calls to the event log but skipping position
   mutations (since there is no named object to look up). Test data uses named
   objects like `"bunny"` for clarity; real parser output will not.

2. **Argument parsing is not wired.** The parser emits `arguments: []` for all
   statements. The `move` handler unconditionally applies `z+1` regardless of
   arguments. Direction/distance arguments will be added in a future pass when
   argument expression parsing is implemented.

3. **`doesNotClaim` update required.** The existing `/api/world/run` response
   includes `"full Tweedle VM execution"` in the `doesNotClaim` array. After
   wiring the executor, the implementation should update this to reflect that
   basic statement execution is now supported (though not full VM execution).

## Backward Compatibility

The response from `POST /api/world/run` is **additive only**:

- All existing fields (`schema_version`, `status`, `project_name`,
  `scene_object_count`, `run_duration_ms`, `evidenceArtifact`) remain
  unchanged in name, type, and semantics.
- Two new fields are added: `statements_executed` and `event_log`.
- Existing test assertions that check individual fields continue to pass.
- If no `.a3p` project was loaded (e.g., launched without `--project`),
  `statements_executed` is `0` and `event_log` is `[]`.
