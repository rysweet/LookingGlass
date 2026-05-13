# Eatme Integration — TypeScript Web Prototype

The alice-web-prototype can produce the same proof artifact JSON files that
Java Alice produces, allowing the eatme harness to validate it as a comparison
target alongside the original Java Alice.

## Quick Start

```bash
cd alice-web-prototype
npm install
npm run build:server

# Start the eatme-compatible API server
node dist-server/cli.js serve \
  --port 3000 \
  --evidence-dir ./evidence \
  --project /path/to/starter.a3p
```

## CLI Usage

```
alice-web serve [options]

Options:
  --port <number>           Port to listen on (default: 3000)
  --evidence-dir <path>     Directory for proof artifact JSON files
  --project <path>          Path to a starter .a3p project file
```

## API Endpoints

### `GET /api/health`
Returns process status. Used by eatme for `process_started` assertion.

### `POST /api/launch`
Start/initialize the prototype with a project.
```json
{ "project": "/path/to/starter.a3p" }
```

### `POST /api/scene/add-object`
Add an object to the scene. Writes `scene-object-added.json` to evidence dir.
```json
{ "className": "org.lgna.story.SBiped", "name": "bunny" }
```

### `POST /api/code/edit-procedure`
Simulate editing a procedure. Writes `first-lesson-code-editor-action-proof.json`.
```json
{
  "procedureSelector": "scene.myFirstMethod",
  "editSpec": "append-comment:eatme first lesson edit proof"
}
```

### `POST /api/project/save`
Save the project. Writes save proof artifacts.
```json
{ "saveSelector": "scene.myFirstMethod" }
```

### `GET /api/screenshot`
Capture a screenshot of the viewport (placeholder in headless mode).

## Proof Artifact Schemas

All artifacts match the exact JSON schemas that Java Alice produces:

| Artifact | Schema Version |
|---|---|
| `scene-object-added.json` | `eatme.alice-scene-object-added/v1` |
| `first-lesson-code-editor-action-proof.json` | `eatme.alice-first-lesson-code-editor-action-proof/v1` |
| `edited-project.a3p` | (binary .a3p project file) |
| `desktop-save-operation-result.json` | `eatme.alice-desktop-save-operation-result/v1` |

## Eatme Comparison Target

A `typescript` target entry has been added to
`eatme-test/assets/alice-comparison-targets.yaml`.

To use:
```bash
export ALICE_TYPESCRIPT_HOME=/path/to/alice-web-prototype
export ALICE_TYPESCRIPT_API_URL=http://localhost:3000
```

## Architecture

```
src/
  evidence-writer.ts  — Writes JSON proof artifacts matching Java schemas
  server.ts           — Express HTTP API server
  cli.ts              — CLI entry point (alice-web serve ...)
  a3p-parser.ts       — .a3p ZIP/XML parser (existing)
  scene-builder.ts    — Three.js scene builder (existing)
```
