# Gadugi Test Scenarios — Alice TypeScript Web Prototype

End-to-end integration tests for the Alice TypeScript port, written as
gadugi-compatible YAML scenarios. Each scenario launches the `alice-web serve`
process, exercises the HTTP API, and verifies the full request-response cycle
including evidence artifact generation.

These scenarios verify **Java feature parity** — the same capabilities that
Java Alice exposes through its desktop UI, tested here through the web
prototype's REST API.

## Quick Start

```bash
# Build the server first
npm run build:server

# Run all gadugi scenarios
gadugi-agentic-test run gadugi/ --verbose

# Run a single scenario
gadugi-agentic-test run gadugi/01-a3p-open-parse-render.yaml

# Run with a custom port (avoids conflicts)
PORT=13579 gadugi-agentic-test run gadugi/ --verbose
```

## Scenario Overview

| File | Name | Tests | Java Parity Feature |
|---|---|---|---|
| `01-a3p-open-parse-render.yaml` | A3P Open / Parse / Render | Project load → scene query → screenshot | `ProjectImp.open()` → `SceneImp.render()` |
| `02-tweedle-ast-vm-execution.yaml` | Tweedle AST & VM Execution | Launch → run world → verify execution log | `VirtualMachine.execute()` |
| `03-scene-entity-manipulation.yaml` | Scene Entity Manipulation | Add object → verify count → screenshot | `SceneEditor.addModel()` |
| `04-event-system.yaml` | Event System | Register → fire → verify triggers | `EventManager` listeners |
| `05-save-export-roundtrip.yaml` | Save / Export Round-Trip | Edit → save → re-launch → verify | `ProjectImp.save()` |

All scenarios use **level 3** (integration) — they exercise the full server
lifecycle from process launch through HTTP API interaction to evidence
artifact verification.

## Prerequisites

| Requirement | How to Satisfy |
|---|---|
| Server built | `npm run build:server` |
| Node.js ≥ 18 | `node --version` |
| Port available | Default `3000`; override with `PORT` env var or `--port` CLI flag |
| `.a3p` fixture (scenarios 1, 2) | Place a valid `.a3p` file at the path declared in `prerequisites` |

Scenarios 3 and 4 do **not** require a `.a3p` file — they use `POST /api/launch`
without a project, which seeds the scene with default `ground` + `camera`
objects.

## Scenario Schema

Every scenario follows the gadugi outside-in-testing YAML convention:

```yaml
scenario:
  name: "Human-readable scenario name"
  description: |
    Multi-line description of what the scenario tests
    and which Java Alice feature it maps to.
  type: cli
  level: 3
  tags: [alice, integration, ...]

  prerequisites:
    - "Condition that must be true before running"

  environment:
    variables:
      PORT: "${PORT:-3000}"
      EVIDENCE_DIR: "./evidence/scenario-name"

  steps:
    # Execute steps (mutate state)
    - action: launch          # Start the server process
    - action: http_request    # Send HTTP request to API
    - action: send_input      # Send stdin to process (for graceful shutdown)

    # Validate steps (assert state)
    - action: verify_response # Assert HTTP response body/status
    - action: verify_output   # Assert process stdout/stderr
    - action: verify_exit_code # Assert process exit code

  cleanup:
    - action: stop_application
    - action: shell           # Remove evidence artifacts
```

### Action Types

#### Execute Actions

| Action | Purpose | Key Fields |
|---|---|---|
| `launch` | Start `alice-web serve` process | `target`, `args`, `timeout` |
| `http_request` | Send HTTP request to the API | `method`, `url`, `body`, `headers` |
| `send_input` | Write to stdin or send signal to the process | `value`, `signal` |

#### Validate Actions

| Action | Purpose | Key Fields |
|---|---|---|
| `verify_response` | Assert HTTP response properties | `status`, `json_path`, `contains`, `matches` |
| `verify_output` | Assert process stdout content | `contains`, `matches`, `timeout` |
| `verify_exit_code` | Assert process exit code | `expected` |

#### Lifecycle Actions

| Action | Purpose | Key Fields |
|---|---|---|
| `stop_application` | Stop the running server process | `signal`, `timeout` |
| `shell` | Run an arbitrary shell command | `command`, `description` |

> **Note:** `http_request` may not be natively supported by all gadugi
> runners. If unsupported, scenarios should fall back to `shell` actions
> using `curl`. The YAML structure remains the same — only the action
> type changes.

### Health Check Gate

Every scenario begins with a health check polling loop after launch. This
prevents race conditions between server startup and the first API request:

```yaml
- action: http_request
  method: GET
  url: "http://127.0.0.1:${PORT}/api/health"
  retry:
    max_attempts: 3
    interval: 200ms
  description: "Wait for server to be ready"

- action: verify_response
  status: 200
  json_path: "$.status"
  equals: "running"
```

## Scenario Details

### 01 — A3P Open / Parse / Render

**File:** `gadugi/01-a3p-open-parse-render.yaml`

Tests the complete lifecycle of opening an Alice project file: launch the
server with a `.a3p` project path, verify the parser extracts scene objects,
and capture a screenshot.

**Steps:**

1. Launch `alice-web serve --port $PORT --evidence-dir $EVIDENCE_DIR --project $A3P_FILE`
2. Health check gate
3. `POST /api/launch` with project path → verify `status: "launched"`, `projectName` present
4. `GET /api/screenshot` → verify `status: "captured"`, `objectCount >= 2`
5. Send SIGTERM, verify exit code 0

**Validates:**
- `.a3p` ZIP/XML parsing succeeds
- Scene objects are extracted from the project
- Scene renderer produces a screenshot (PNG artifact)
- Server shuts down cleanly after project load

**Prerequisites:**
- Valid `.a3p` file at the configured path

**Evidence artifacts produced:**
- `screenshot.png` — rendered scene image

---

### 02 — Tweedle AST & VM Execution

**File:** `gadugi/02-tweedle-ast-vm-execution.yaml`

Tests the Tweedle virtual machine by launching a project and executing its
methods via `POST /api/world/run`. Verifies that the execution log contains
the expected statement types.

**Steps:**

1. Launch `alice-web serve --port $PORT --evidence-dir $EVIDENCE_DIR --project $A3P_FILE`
2. Health check gate
3. `POST /api/launch` with project → verify launched
4. `POST /api/world/run` → verify `status: "completed"`, `statements_executed >= 1`, `execution_log` is array
5. Send SIGTERM, verify exit code 0

**Validates:**
- Tweedle parser extracts AST from `.a3p` project
- VM executes all methods without errors
- Execution log contains structured `{step, kind, detail}` entries
- `schema_version` matches `eatme.alice-run-world-result/v1`

**Prerequisites:**
- Valid `.a3p` file with at least one Tweedle method

**Evidence artifacts produced:**
- `run-world-result.json` — full execution log with schema version

---

### 03 — Scene Entity Manipulation

**File:** `gadugi/03-scene-entity-manipulation.yaml`

Tests adding objects to the scene and capturing a screenshot. Does not
require a `.a3p` file — the server seeds default `ground` + `camera` on
launch.

**Steps:**

1. Launch `alice-web serve --port $PORT --evidence-dir $EVIDENCE_DIR`
2. Health check gate
3. `POST /api/launch` (no project) → verify `sceneObjectCount: 2` (ground + camera)
4. `POST /api/scene/add-object` with `className: "org.lgna.story.SBiped"`, `name: "bunny"` → verify `status: "added"`, `sceneFieldCountAfter: 3`
5. `POST /api/scene/add-object` with `className: "org.lgna.story.SProp"`, `name: "tree"` → verify `sceneFieldCountAfter: 4`
6. `GET /api/screenshot` → verify `objectCount >= 4`
7. Send SIGTERM, verify exit code 0

**Validates:**
- Default scene seeds ground + camera
- `add-object` increments scene field count
- Object names are assigned correctly (explicit or derived from className)
- Evidence artifact `scene-object-added.json` is written per addition
- Screenshot reflects the updated scene

**Prerequisites:**
- None (no `.a3p` file needed)

**Evidence artifacts produced:**
- `scene-object-added.json` — one per add-object call
- `screenshot.png` — scene with all 4 objects

---

### 04 — Event System

**File:** `gadugi/04-event-system.yaml`

Tests all three event types: `sceneActivated`, `keyPress`, and `proximity`.
Registers handlers, fires events, and verifies the correct handlers trigger.

**Steps:**

1. Launch `alice-web serve --port $PORT --evidence-dir $EVIDENCE_DIR`
2. Health check gate
3. `POST /api/launch` → verify launched
4. Register `sceneActivated` handler → verify `registrationId: "evt-1"`
5. Register `keyPress` handler for `"Space"` → verify `registrationId: "evt-2"`
6. Add two objects (`bunny`, `cat`) for proximity test
7. Register `proximity` handler for `["bunny", "cat"]` with threshold 3.0 → verify `registrationId: "evt-3"`
8. Fire `sceneActivated` → verify `triggered` contains `evt-1`, length 1
9. Fire `keyPress` with `payload.key: "Space"` → verify `triggered` contains `evt-2`
10. Fire `keyPress` with `payload.key: "ArrowUp"` → verify `triggered` is empty
11. Fire `proximity` with `sourceObject: "bunny"` → verify `triggered` contains `evt-3` (both at origin, distance = 0)
12. Send SIGTERM, verify exit code 0

**Validates:**
- Registration assigns sequential IDs (`evt-1`, `evt-2`, …)
- `sceneActivated` triggers unconditionally
- `keyPress` filters by key match
- Non-matching key fires produce empty triggered array
- `proximity` triggers when distance ≤ threshold (0 ≤ 3.0)
- Evidence artifacts written for both register and fire

**Prerequisites:**
- None (no `.a3p` file needed)

**Evidence artifacts produced:**
- `event-register.json` — one per registration (overwritten)
- `event-fire.json` — one per fire (overwritten)

---

### 05 — Save / Export Round-Trip

**File:** `gadugi/05-save-export-roundtrip.yaml`

Tests the full edit-and-save cycle: launch, edit a procedure, save the
project, then re-launch with the saved file and verify edits survived.
Maps Java Alice's `modifyAndWriteA3P` through the server API.

**Steps:**

1. Launch `alice-web serve --port $PORT --evidence-dir $EVIDENCE_DIR`
2. Health check gate
3. `POST /api/launch` → verify launched
4. `POST /api/code/edit-procedure` with `editSpec: "append-comment:gadugi-round-trip-proof"` → verify `status: "proved"`, `edited_project_artifact: "edited-project.a3p"`
5. `POST /api/project/save` → verify `status: "saved"`, `saved_project_artifact` present
6. Send SIGTERM, verify clean exit
7. Re-launch server (no `--project` flag — project path passed via API body)
8. Health check gate
9. `POST /api/launch` with saved project → verify `status: "launched"`
10. Send SIGTERM, verify exit code 0

**Validates:**
- Procedure edit produces proof artifacts
- Project save writes `.a3p` file to evidence directory
- Saved project can be re-opened by a fresh server instance
- Edit → save → re-open round-trip completes without errors

**Prerequisites:**
- None (uses in-memory defaults, no external `.a3p` needed)

**Evidence artifacts produced:**
- `edited-project.a3p` — modified project binary
- `first-lesson-code-editor-action-proof.json` — edit proof
- `project-save/saved-project.a3p` — saved project file
- `project-save/desktop-save-operation-result.json` — save proof

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `EVIDENCE_DIR` | `./evidence/<scenario-name>` | Evidence artifact output directory |
| `A3P_FILE` | _(none)_ | Path to `.a3p` project file (scenarios 1, 2) |
| `NODE_OPTIONS` | _(none)_ | Node.js options (e.g., `--max-old-space-size=32768`) |

### Port Conflicts

Each scenario uses a single port. To run scenarios in parallel, assign
different ports:

```bash
PORT=13579 gadugi-agentic-test run gadugi/01-a3p-open-parse-render.yaml &
PORT=13580 gadugi-agentic-test run gadugi/03-scene-entity-manipulation.yaml &
wait
```

### Evidence Directory

Each scenario writes artifacts to its own subdirectory under `EVIDENCE_DIR`.
The cleanup step removes these artifacts after verification:

```yaml
cleanup:
  - action: stop_application
    signal: SIGTERM
    timeout: 5s
  - action: shell
    command: "rm -rf ${EVIDENCE_DIR}"
    description: "Remove evidence artifacts"
```

To preserve artifacts for debugging, skip cleanup:

```bash
gadugi-agentic-test run gadugi/03-scene-entity-manipulation.yaml --skip-cleanup
```

## API Surface Covered

The five scenarios collectively cover every endpoint in `src/server.ts`:

| Endpoint | Method | Scenario(s) |
|---|---|---|
| `/api/health` | GET | 01, 02, 03, 04, 05 (health gate) |
| `/api/launch` | POST | 01, 02, 03, 04, 05 |
| `/api/scene/add-object` | POST | 03, 04 |
| `/api/code/edit-procedure` | POST | 05 |
| `/api/project/save` | POST | 05 |
| `/api/world/run` | POST | 02 |
| `/api/screenshot` | GET | 01, 03 |
| `/api/events/register` | POST | 04 |
| `/api/events/fire` | POST | 04 |

## Writing New Scenarios

### Template

```yaml
scenario:
  name: "Your Scenario Name"
  description: |
    What this scenario tests and which Java Alice
    feature it maps to.
  type: cli
  level: 3
  tags: [alice, integration, your-feature]

  prerequisites:
    - "npm run build:server has been run"

  environment:
    variables:
      PORT: "${PORT:-3000}"
      EVIDENCE_DIR: "./evidence/your-scenario"

  steps:
    # 1. Launch server
    - action: launch
      target: "node"
      args: ["dist-server/cli.js", "serve",
             "--port", "${PORT}",
             "--evidence-dir", "${EVIDENCE_DIR}"]
      description: "Start alice-web server"
      timeout: 10s

    # 2. Health check gate
    - action: http_request
      method: GET
      url: "http://127.0.0.1:${PORT}/api/health"
      retry:
        max_attempts: 3
        interval: 200ms

    - action: verify_response
      status: 200
      json_path: "$.status"
      equals: "running"

    # 3. Launch the project
    - action: http_request
      method: POST
      url: "http://127.0.0.1:${PORT}/api/launch"
      headers:
        Content-Type: "application/json"
      body: '{}'

    - action: verify_response
      status: 200
      json_path: "$.status"
      equals: "launched"

    # 4. Your test steps here...

    # N. Graceful shutdown
    - action: send_input
      value: ""
      signal: SIGTERM

    - action: verify_exit_code
      expected: 0

  cleanup:
    - action: stop_application
      signal: SIGTERM
      timeout: 5s
    - action: shell
      command: "rm -rf ${EVIDENCE_DIR}"
```

### Conventions

1. **Health check first** — Always poll `/api/health` before the first API
   call. The server binds asynchronously; without a gate, early requests fail
   with `ECONNREFUSED`.

2. **Explicit verify after each request** — Every `http_request` step must be
   followed by a `verify_response` step. This makes failures easy to locate
   in the gadugi output.

3. **Use `json_path` for deep assertions** — Prefer `json_path: "$.status"`
   with `equals:` over `contains:` for structured JSON responses.

4. **Evidence cleanup** — Always include a cleanup step that removes the
   evidence directory. Accumulated artifacts consume disk and cause flaky
   re-runs if stale files from a previous run match assertions.

5. **Localhost only** — All `url` fields use `127.0.0.1`, never `localhost`
   (avoids DNS resolution and IPv6 ambiguity). The server itself binds to
   `127.0.0.1` (see `cli.ts`).

6. **No secrets in YAML** — Scenarios contain only localhost URLs, port
   numbers, and static test data. No credentials, tokens, or external URLs.

## Relationship to Existing Tests

| Test Layer | Location | What It Tests |
|---|---|---|
| Unit tests | `test/*.test.ts` | Individual modules (parser, VM, renderer) |
| **Gadugi scenarios** | **`gadugi/*.yaml`** | **Full server lifecycle through HTTP API** |
| Eatme hooks | `tools/eatme-*` | CLI hook interface for Java harness comparison |

Gadugi scenarios sit between unit tests and the eatme harness. They test the
same HTTP API that eatme validates, but from the outside-in — no knowledge
of internal types, no imports, just HTTP requests and JSON assertions.

## Troubleshooting

### `ECONNREFUSED` on first request

The health check gate isn't waiting long enough. Increase `max_attempts` or
`interval`:

```yaml
retry:
  max_attempts: 20
  interval: 1000ms
```

### Port already in use

Another process (or a previous test run) is occupying the port:

```bash
# Find what's using the port
lsof -i :3000

# Use a different port
PORT=13579 gadugi-agentic-test run gadugi/01-a3p-open-parse-render.yaml
```

### Evidence directory not cleaned up

If a previous run crashed before cleanup, stale artifacts can cause false
passes. Remove manually:

```bash
rm -rf ./evidence/
```

### `.a3p` file not found

Scenarios 01 and 02 require a `.a3p` file. Either:
- Set the `A3P_FILE` environment variable to point to a valid file
- Place a `.a3p` file at the default path listed in the scenario prerequisites

### Screenshot returns `placeholder: true`

The `canvas` npm package requires native dependencies. If the rendering
pipeline fails, the server returns a 1×1 placeholder PNG. The scenario
still passes (it checks `status: "captured"`) but the screenshot won't be
meaningful. Install canvas dependencies:

```bash
# Ubuntu/Debian
sudo apt-get install -y libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
npm rebuild canvas
```

## File Layout

```
gadugi/
  01-a3p-open-parse-render.yaml      # A3P project lifecycle
  02-tweedle-ast-vm-execution.yaml    # Tweedle VM execution
  03-scene-entity-manipulation.yaml   # Scene add-object + screenshot
  04-event-system.yaml                # Event register / fire / proximity
  05-save-export-roundtrip.yaml       # Edit → save → re-open cycle
docs/
  gadugi-test-scenarios.md            # This file
```
