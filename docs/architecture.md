# Architecture

The web prototype mirrors the big Alice 3 subsystems, but keeps them in small
TypeScript modules that are easy to test and replace.

## Core subsystems

| Subsystem | Main folders and modules | Job |
| --- | --- | --- |
| Tweedle | `src/tweedle-*`, `src/statement-*`, `src/expression-*` | Parse, type-check, compile, and run Alice code |
| AST | `src/ast-*`, `src/code-generation.ts`, `src/serialization.ts` | Store code as editable program structure |
| Story API | `src/story-api/`, `src/story-api-*`, `src/entity-*` | Represent scenes, objects, methods, and event hooks |
| Renderer | `src/scene-*`, `src/render-*`, `src/scenegraph.ts`, `src/scene-builder.ts` | Turn Alice scenes into browser-rendered 3D output |
| IDE | `src/code-editor.ts`, `src/procedure-editor.ts`, `src/workspace.ts`, `src/run-system.ts` | Drive editing, scene setup, and run workflows |
| Croquet and collaboration | `src/croquet*`, `src/collaboration.ts`, `src/state-synchronization.ts` | Support multi-user and shared state workflows |
| Infrastructure | `src/server.ts`, `src/cli.ts`, `src/network-layer.ts`, `src/project-*`, `src/resource-*`, `src/hooks/*` | File I/O, HTTP API, outbound service adapters, hooks, and outside-in integration |

## Module organization

The repository follows a brick-style layout: one file or one small folder per
responsibility. When a feature grows, the usual move is to add another small
module instead of building one giant file.

A practical rule used in this codebase: keep new modules under roughly **500
lines** when you can. That keeps tests focused and makes code review faster.

## How the pieces fit together

```text
Tweedle source
  ↓
parser and type system
  ↓
AST and code generation
  ↓
Story API scene model
  ↓
renderer and scene manager
  ↓
IDE workflows and REST API
```

The same core scene and language modules are reused by:

- the browser interface
- the REST API server
- the `eatme` curriculum tests
- hook scripts that mimic the Java Alice proof paths

## Barrel re-exports

This repository uses barrel files so callers can import from stable entry
points instead of chasing deep paths.

Two important barrels:

- `src/index.ts` re-exports the main public modules for the whole repository
- `src/story-api/index.ts` re-exports story API entities, scene helpers, and types

That means callers can write imports like this:

```typescript
import { StoryApi, TweedleParser, SceneRenderer } from './src/index.js';
import { Scene, SBiped } from './src/story-api/index.js';
```

Instead of this:

```typescript
import { Scene } from './src/story-api/scene.js';
import { SBiped } from './src/story-api/entities.js';
```

The barrel layer keeps public imports stable while the internal file layout can
still be split into smaller bricks.
