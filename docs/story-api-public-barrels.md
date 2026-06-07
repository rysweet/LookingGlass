---
title: Story API Public Barrel Topology
description: Planned public import contract and module ownership rules for the export-only Story API barrels.
last_updated: 2026-06-07
review_schedule: as-needed
doc_type: reference
---

# Story API Public Barrel Topology

> **PLANNED - implementation pending**
>
> This document describes the target public barrel topology for the Story API
> refactor. Until that refactor lands, `src/story-api/index.ts` may still contain
> helper implementation logic and `src/story-api/world.ts` may not exist yet.

The root public barrel (`src/index.ts`) and Story API public barrel
(`src/story-api/index.ts`) will be export-only modules. They will expose the same
public API as before, but implementation logic will live in focused sibling
modules.

This keeps public imports stable while reducing the chance that public barrels
become part of runtime dependency cycles.

## Contents

- [Quick start](#quick-start)
- [Public import contract](#public-import-contract)
- [Module topology](#module-topology)
- [World helper API](#world-helper-api)
- [Configuration](#configuration)
- [Maintaining the topology](#maintaining-the-topology)
- [Examples](#examples)

## Quick start

Existing imports continue to work:

```typescript
import { StoryApi } from "../src/index.js";
import { Scene, SBiped, buildStoryWorld } from "../src/story-api";
import { describeStoryWorld } from "../src/story-api/index.js";
```

Directory imports such as `../src/story-api` are valid in the repository's
TypeScript/Vite setup, which uses `moduleResolution: "bundler"`. Raw Node ESM
consumers should import the explicit file path instead:

```typescript
import { buildStoryWorld } from "../src/story-api/index.js";
```

The root namespace import is unchanged:

```typescript
import { StoryApi } from "../src/index.js";

const transform = StoryApi.createDefaultStoryTransform();

console.log(transform.position);
// Output: { x: 0, y: 0, z: 0 }
```

The direct Story API import is unchanged:

```typescript
import { Scene, SBiped } from "../src/story-api";

const scene = new Scene();
scene.addEntity("bunny", new SBiped());

console.log(scene.getEntity("bunny") instanceof SBiped);
// Output: true
```

## Public import contract

| Import surface | Public contract | Implementation rule |
| --- | --- | --- |
| `src/index.ts` | Exposes `StoryApi` as one root namespace export among the repository's other root namespace exports | Export declarations only |
| `src/story-api` | Exposes all public Story API names through repository bundler directory resolution | Re-export from `index.ts` only |
| `src/story-api/index.ts` | Exposes all names from `entities`, `implementation`, `scene`, `types`, and `world` | Export declarations only after the refactor lands |

The refactor must preserve the existing consumer contract. Named exports from
`src/story-api` and `src/story-api/index.ts` remain identical.

## Module topology

```text
src/
  index.ts
    export * as A3pParser from "./a3p-parser";
    ...
    export * as StoryApi from "./story-api";
    ...

  story-api/
    index.ts
      export * from "./entities";
      export * from "./implementation";
      export * from "./scene";
      export * from "./types";
      export * from "./world";

    entities.ts        Entity classes and entity diagnostics helpers
    implementation.ts  Runtime implementation summaries and lifecycle helpers
    scene.ts           Scene container helpers and project-to-scene bridge
    types.ts           Value types and value helper functions
    world.ts           Story-world aggregation, summary, diagnostics, and compatibility helpers
```

`src/story-api/world.ts` will own the helper logic that used to live in the
Story API barrel. It will import directly from sibling implementation modules:

```typescript
import type { AliceProject } from "../a3p-parser";
import { collectEntityDiagnostics, describeEntity } from "./entities";
import { createSceneFromProject, describeScene, listSceneEntities, snapshotScene } from "./scene";
import type { Scene, SceneSnapshot } from "./scene";
import { createDefaultTransform } from "./types";
import type { Position, Size } from "./types";
```

It must not import from `./index`, `../index`, or `../story-api`.

## World helper API

The world helper API will be exported from `src/story-api/world.ts` and
re-exported unchanged from `src/story-api/index.ts`, `src/story-api`, and the
root `StoryApi` namespace.

### Interfaces

```typescript
interface StoryWorldSummary {
  readonly projectName: string;
  readonly objectCount: number;
  readonly methodCount: number;
  readonly entityNames: string[];
  readonly snapshot: SceneSnapshot;
}

interface StoryEntitySummary {
  readonly name: string;
  readonly typeName: string;
  readonly diagnostics: ReturnType<typeof collectEntityDiagnostics>;
}
```

### Constants

| Export | Value | Notes |
| --- | --- | --- |
| `STORY_API_MODULES` | `["entities", "implementation", "scene", "types"]` | Compatibility list preserved for callers that display or compare Story API module groups. `world` is intentionally excluded because it is a helper ownership module, not an original Story API module group. |

### Functions

| Export | Signature | Behavior |
| --- | --- | --- |
| `listStoryApiModules` | `(): readonly string[]` | Returns `STORY_API_MODULES` |
| `createDefaultStoryTransform` | `(): { position: Position; size: Size }` | Returns the default position and size from `createDefaultTransform()` |
| `summarizeSceneEntities` | `(scene: Scene): StoryEntitySummary[]` | Lists scene entities with constructor names and diagnostics |
| `buildStoryWorld` | `(project: AliceProject): { scene: Scene; summary: StoryWorldSummary }` | Builds a `Scene` and returns its summary |
| `summarizeStoryWorld` | `(project: AliceProject, scene?: Scene): StoryWorldSummary` | Summarizes project name, object count, method count, entity names, and scene snapshot |
| `describeStoryWorld` | `(project: AliceProject, scene?: Scene): string` | Returns `<project>: <n> objects, <n> methods` |
| `projectCanBuildStoryWorld` | `(project: AliceProject): boolean` | Checks that `sceneObjects` and `methods` are arrays |
| `requireStoryWorld` | `(project: AliceProject): StoryWorldSummary` | Returns a summary or throws `TypeError` when the project cannot build a world |
| `collectStoryWorldDiagnostics` | `(project: AliceProject, scene?: Scene): { world: StoryWorldSummary; entities: StoryEntitySummary[] }` | Combines world and entity diagnostics |
| `listStoryWorldEntityNames` | `(project: AliceProject): string[]` | Returns project scene object names |
| `describeStoryScene` | `(project: AliceProject): string` | Builds a scene and returns `describeScene(scene)` |
| `describeStoryEntities` | `(project: AliceProject): string[]` | Builds a scene and returns `describeEntity()` for each entity |
| `projectUsesStoryApiType` | `(project: AliceProject, typeName: string): boolean` | Checks scene object types and user type declarations |
| `countStoryApiUserTypes` | `(project: AliceProject): number` | Counts user type declarations, returning `0` when absent |
| `createStorySceneSnapshot` | `(project: AliceProject): SceneSnapshot` | Builds a scene and snapshots it |
| `compareStoryWorlds` | `(left: AliceProject, right: AliceProject): { projectNameChanged: boolean; objectCountDelta: number; methodCountDelta: number }` | Compares project name, scene object count, and method count |
| `hasStoryWorldEntities` | `(project: AliceProject): boolean` | Returns whether the project has scene objects |
| `getStoryWorldMethodNames` | `(project: AliceProject): string[]` | Returns method names |
| `summarizeStoryWorldMethods` | `(project: AliceProject): string` | Returns method names joined by comma, or `<no methods>` |

## Configuration

The barrel topology has no runtime configuration. It will not read environment
variables, feature flags, files, network resources, or process state.

When validating changes that touch public exports in this repository, run the
existing checks with the repository memory setting:

```bash
NODE_OPTIONS=--max-old-space-size=32768 npm run build
```

Use the same `NODE_OPTIONS` value for type checks, tests, and export comparison
scripts when those checks are run locally.

## Maintaining the topology

Keep these rules true after the refactor lands:

1. `src/index.ts` stays export-only.
2. `src/story-api/index.ts` stays export-only.
3. Story API helper logic goes in focused sibling modules, not in public barrels.
4. Helper modules import from sibling implementation modules, not from public barrels.
5. Public export names remain stable unless a breaking API change is intentional and documented.

Allowed Story API barrel content:

```typescript
export * from "./entities";
export * from "./implementation";
export * from "./scene";
export * from "./types";
export * from "./world";
```

Do not add helper declarations, constants, initialization, validation, logging,
or side effects to either public barrel after the refactor lands.

## Examples

### Build and summarize a story world

```typescript
import type { AliceProject } from "../src/a3p-parser";
import { buildStoryWorld, collectStoryWorldDiagnostics, describeStoryWorld } from "../src/story-api";

export function summarizeProject(project: AliceProject): string {
  const { scene, summary } = buildStoryWorld(project);
  const diagnostics = collectStoryWorldDiagnostics(project, scene);

  return [
    describeStoryWorld(project, scene),
    `entities=${diagnostics.entities.length}`,
    `first=${summary.entityNames[0] ?? "<none>"}`,
  ].join("; ");
}
```

### Use the root namespace export

```typescript
import type { AliceProject } from "../src/a3p-parser";
import { StoryApi } from "../src/index.js";

export function listProjectEntityNames(project: AliceProject): string[] {
  return StoryApi.listStoryWorldEntityNames(project);
}
```

### Compare two parsed projects

```typescript
import type { AliceProject } from "../src/a3p-parser";
import { compareStoryWorlds } from "../src/story-api/index.js";

export function changedSceneObjectCount(before: AliceProject, after: AliceProject): boolean {
  return compareStoryWorlds(before, after).objectCountDelta !== 0;
}
```

## Related documentation

- [Story API](./story-api.md) documents the scene and entity model.
- [Architecture](./architecture.md) explains the broader module boundaries.
- [Testing](./testing.md) documents the repository check workflow.
