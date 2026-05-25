# Scene Graph — Composite Hierarchy with Transform Operations

The scene graph (`src/scene-graph.ts`) is the TypeScript port of Java Alice's
`core/scenegraph` Composite hierarchy. It provides a tree of typed nodes —
`GroupNode`, `VisualNode`, `CameraNode`, `LightNode` — each with local
transforms (position, orientation, scale) and parent-chain world-transform
computation. The scene graph sits between the Story API entity model and the
Three.js rendering layer, giving the engine a renderer-agnostic spatial tree.

## Overview

| Export | Kind | Purpose |
|---|---|---|
| `SceneGraphNode` | abstract class | Base node: id, name, parent, children, local transform |
| `GroupNode` | class | Non-visual container (Composite branch) |
| `VisualNode` | class | Renderable geometry: mesh ref, color, opacity, visible |
| `CameraNode` | class | Camera parameters: fov, near, far, aspect |
| `LightNode` | class | Light parameters: type, color, intensity |
| `Transform` | interface | `{ position: Vec3; orientation: Orientation; scale: Vec3 }` |
| `Color3` | interface | `{ r: number; g: number; b: number }` (floats 0–1) |
| `LightType` | type | `"ambient" \| "directional" \| "point"` |
| `quaternionMultiply` | function | Compose two quaternions (parent × child order) |
| `quaternionFromAxisAngle` | function | Create quaternion from axis + angle |
| `quaternionToAxisAngle` | function | Decompose quaternion to axis + angle |
| `rotateVec3ByQuaternion` | function | Rotate a Vec3 by a quaternion |
| `quaternionIdentity` | constant | `{ x: 0, y: 0, z: 0, w: 1 }` |
| `SceneGraph` | class | Root container, node lookup, traversal utilities |

## Quick Start

```typescript
import {
  SceneGraph, GroupNode, VisualNode, CameraNode, LightNode,
} from './scene-graph';

// Build a simple scene graph
const graph = new SceneGraph();

const root = graph.root;                         // pre-created GroupNode
const room = new GroupNode('room');
root.addChild(room);

const table = new VisualNode('table');
table.localTransform = {
  position: { x: 0, y: 0.5, z: 0 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 2, y: 1, z: 1 },
};
table.color = { r: 0.6, g: 0.3, b: 0.1 };
table.meshRef = 'models/table.glb';
room.addChild(table);

const cam = new CameraNode('mainCamera');
cam.fov = 60;
cam.localTransform = {
  position: { x: 0, y: 5, z: 20 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
root.addChild(cam);

const sun = new LightNode('sun', 'directional');
sun.color = { r: 1, g: 1, b: 0.9 };
sun.intensity = 0.8;
sun.localTransform = {
  position: { x: 5, y: 10, z: 7 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
root.addChild(sun);

// Query world transform (walks parent chain)
const worldPos = table.worldTransform.position;
// { x: 0, y: 0.5, z: 0 } — same as local here because room has identity transform

// Traversal
graph.traverse((node) => {
  console.log(`${node.name} (id: ${node.id})`);
});
// root (id: 0)
// room (id: 1)
// table (id: 2)
// mainCamera (id: 3)
// sun (id: 4)
```

### Integration with Story API

```typescript
import { SBiped } from './story-api/entities';
import { SceneGraph, VisualNode } from './scene-graph';

// Story API provides the entity model (game logic layer)
const bunny = new SBiped();
bunny.position = { x: 3, y: 0, z: -2 };
bunny.orientation = { x: 0, y: 0, z: 0, w: 1 };

// Scene graph provides the spatial hierarchy (rendering layer)
const graph = new SceneGraph();
const bunnyNode = new VisualNode('bunny');
bunnyNode.localTransform = {
  position: bunny.position,
  orientation: bunny.orientation,
  scale: { x: 1, y: 1, z: 1 },
};
graph.root.addChild(bunnyNode);
```

## Value Types

### Transform

```typescript
interface Transform {
  readonly position: Vec3;
  readonly orientation: Orientation;
  readonly scale: Vec3;
}
```

Default (identity transform):
```typescript
{
  position: { x: 0, y: 0, z: 0 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
}
```

`Vec3` and `Orientation` are re-exported from `src/story-api/types.ts`.
Scale uses `Vec3` (same shape as `Position`); multiplicative identity `{1,1,1}`.

### Color3

```typescript
interface Color3 {
  readonly r: number;  // 0–1
  readonly g: number;  // 0–1
  readonly b: number;  // 0–1
}
```

Matches Three.js float conventions. Use for `VisualNode.color` and
`LightNode.color`.

### LightType

```typescript
type LightType = 'ambient' | 'directional' | 'point';
```

Three concrete types matching Java Alice's scene graph. The `"hemisphere"` type
from `scene-builder.ts` is a rendering-layer concept and not part of the core
scene graph.

## Node Hierarchy

```
SceneGraphNode (abstract)
├── GroupNode            — non-visual container
├── VisualNode           — renderable mesh
├── CameraNode           — camera parameters
└── LightNode            — light parameters
```

All nodes inherit Composite tree operations (addChild, removeChild, children)
and Transformable capabilities (localTransform, worldTransform) from
`SceneGraphNode`.

### SceneGraphNode (abstract base)

Every node has:

| Property | Type | Description |
|---|---|---|
| `id` | `number` (readonly) | Module-level auto-increment; unique across all nodes in all graphs |
| `name` | `string` | User-provided name |
| `parent` | `SceneGraphNode \| null` (readonly) | Parent reference, `null` for root |
| `children` | `readonly SceneGraphNode[]` | Snapshot of child list |
| `localTransform` | `Transform` | Local-space transform (get/set) |
| `worldTransform` | `Transform` (readonly) | Computed world transform (walks parent chain) |

#### Tree Operations

```typescript
// Add a child (removes from previous parent if re-parented)
node.addChild(child: SceneGraphNode): void

// Remove a child by reference
node.removeChild(child: SceneGraphNode): boolean

// Check parentage
node.hasChild(child: SceneGraphNode): boolean

// Depth-first pre-order traversal from this node
node.traverse(callback: (node: SceneGraphNode) => void): void

// Find first descendant matching a predicate
node.find(predicate: (node: SceneGraphNode) => boolean): SceneGraphNode | null

// Find all descendants matching a predicate
node.findAll(predicate: (node: SceneGraphNode) => boolean): SceneGraphNode[]
```

#### Re-parenting

Calling `parent.addChild(child)` when `child` already has a parent
automatically removes `child` from its previous parent. This prevents a node
from appearing in multiple places in the tree:

```typescript
const groupA = new GroupNode('a');
const groupB = new GroupNode('b');
const item = new VisualNode('item');

groupA.addChild(item);
console.log(item.parent?.name); // "a"

groupB.addChild(item);          // silently removes from groupA
console.log(item.parent?.name); // "b"
console.log(groupA.children);   // []
```

#### Cycle Prevention

Adding an ancestor as a child throws:

```typescript
const parent = new GroupNode('parent');
const child = new GroupNode('child');
parent.addChild(child);

child.addChild(parent); // Error: "Cannot add ancestor as child — cycle detected"
```

### GroupNode

Non-visual container for organizing the tree. No additional properties beyond
`SceneGraphNode`.

```typescript
const room = new GroupNode('room');
const furniture = new GroupNode('furniture');
room.addChild(furniture);
```

### VisualNode

Renderable geometry node.

| Property | Type | Default | Description |
|---|---|---|---|
| `meshRef` | `string \| null` | `null` | Model path/name for mesh resolution |
| `color` | `Color3` | `{ r: 1, g: 1, b: 1 }` | Base color |
| `opacity` | `number` | `1.0` | Opacity 0–1, clamped |
| `visible` | `boolean` | `true` | Visibility flag |

```typescript
const chair = new VisualNode('chair');
chair.meshRef = 'props/chair';
chair.color = { r: 0.8, g: 0.4, b: 0.1 };
chair.opacity = 0.9;
chair.visible = true;
```

### CameraNode

Camera parameters for the scene view.

| Property | Type | Default | Description |
|---|---|---|---|
| `fov` | `number` | `60` | Field of view in degrees |
| `near` | `number` | `0.1` | Near clipping plane |
| `far` | `number` | `1000` | Far clipping plane |
| `aspect` | `number` | `16/9` | Aspect ratio |

```typescript
const cam = new CameraNode('playerCam');
cam.fov = 75;
cam.near = 0.5;
cam.far = 500;
cam.localTransform = {
  position: { x: 0, y: 3, z: 10 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
```

### LightNode

Light parameters for scene illumination.

| Property | Type | Default | Description |
|---|---|---|---|
| `lightType` | `LightType` (readonly) | *(set at construction)* | `"ambient"`, `"directional"`, or `"point"` |
| `color` | `Color3` | `{ r: 1, g: 1, b: 1 }` | Light color |
| `intensity` | `number` | `1.0` | Light intensity, clamped 0–10 |

The light type is set at construction and cannot be changed:

```typescript
const ambient = new LightNode('ambient', 'ambient');
ambient.color = { r: 0.4, g: 0.4, b: 0.5 };
ambient.intensity = 0.5;

const spot = new LightNode('spotlight', 'point');
spot.localTransform = {
  position: { x: -3, y: 5, z: 0 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
spot.intensity = 2.0;
```

## SceneGraph Container

The `SceneGraph` class manages the tree root, provides node lookup by id/name,
and offers whole-tree utilities.

### Constructor

```typescript
const graph = new SceneGraph();
```

Creates a scene graph with a pre-built root `GroupNode` named `"root"` (id 0).

### Properties

| Property | Type | Description |
|---|---|---|
| `root` | `GroupNode` (readonly) | The root node of the tree |
| `nodeCount` | `number` (readonly) | Total nodes including root |

### Methods

```typescript
// Look up any node by its auto-generated id
graph.getNodeById(id: number): SceneGraphNode | null

// Look up nodes by name (names are not unique — returns array)
graph.getNodesByName(name: string): SceneGraphNode[]

// Depth-first pre-order traversal of entire tree
graph.traverse(callback: (node: SceneGraphNode) => void): void

// Find first node matching predicate
graph.find(predicate: (node: SceneGraphNode) => boolean): SceneGraphNode | null

// Find all nodes matching predicate
graph.findAll(predicate: (node: SceneGraphNode) => boolean): SceneGraphNode[]

// Remove a node (and all descendants) from the tree
graph.removeNode(node: SceneGraphNode): boolean

// Remove all children from root (id counter is NOT reset)
graph.clear(): void
```

### Node Lookup by Type

Use `find`/`findAll` with `instanceof` checks:

```typescript
import { CameraNode, LightNode, VisualNode } from './scene-graph';

// All cameras in the scene
const cameras = graph.findAll(n => n instanceof CameraNode) as CameraNode[];

// All visible meshes
const visible = graph.findAll(
  n => n instanceof VisualNode && n.visible
) as VisualNode[];

// First directional light
const sun = graph.find(
  n => n instanceof LightNode && n.lightType === 'directional'
) as LightNode | null;
```

## Transform Operations

### Local Transform

Each node's `localTransform` describes its position, orientation, and scale
relative to its parent:

```typescript
const node = new VisualNode('box');
node.localTransform = {
  position: { x: 3, y: 0, z: -5 },
  orientation: { x: 0, y: 0.707, z: 0, w: 0.707 }, // 90° Y rotation
  scale: { x: 2, y: 1, z: 1 },
};
```

Setting `localTransform` replaces the entire transform (no partial updates).
To change only position, spread the existing transform:

```typescript
node.localTransform = {
  ...node.localTransform,
  position: { x: 10, y: 0, z: 0 },
};
```

### World Transform

`worldTransform` computes the effective transform in world space by walking the
parent chain from root to node, composing transforms at each level:

```
worldTransform = root.local * ... * parent.local * node.local
```

**Composition rules:**

- **Position:** Parent rotation and scale are applied to child position, then
  parent position is added.
- **Orientation:** Quaternion multiply: `parentWorld * childLocal` (parent-first).
- **Scale:** Component-wise multiply: `parentWorld.scale * childLocal.scale`.

World transforms are computed on-demand (no caching). For deep trees, the cost
is O(depth) per access.

```typescript
const arm = new GroupNode('arm');
arm.localTransform = {
  position: { x: 2, y: 0, z: 0 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const hand = new VisualNode('hand');
hand.localTransform = {
  position: { x: 1, y: 0, z: 0 },
  orientation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 0.5, y: 0.5, z: 0.5 },
};
arm.addChild(hand);
graph.root.addChild(arm);

// hand.worldTransform.position → { x: 3, y: 0, z: 0 }
// hand.worldTransform.scale    → { x: 0.5, y: 0.5, z: 0.5 }
```

### Quaternion Math Utilities

The module exports helpers for common quaternion operations:

```typescript
import {
  quaternionMultiply,
  quaternionIdentity,
  quaternionFromAxisAngle,
  quaternionToAxisAngle,
  rotateVec3ByQuaternion,
} from './scene-graph';

// Compose two rotations (parent-first)
const combined = quaternionMultiply(parentQ, childQ);

// Create rotation from axis-angle
const rot90Y = quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI / 2);

// Rotate a vector
const rotated = rotateVec3ByQuaternion({ x: 1, y: 0, z: 0 }, rot90Y);
// → approximately { x: 0, y: 0, z: -1 }
```

## Traversal

All traversals use **depth-first pre-order** (parent visited before children),
matching the standard scene-graph convention and Java Alice's behavior.

```typescript
graph.traverse((node) => {
  // Walk parent chain to compute depth
  let depth = 0;
  let cur = node.parent;
  while (cur) { depth++; cur = cur.parent; }
  const indent = '  '.repeat(depth);
  console.log(`${indent}${node.name} [${node.constructor.name}]`);
});

// Output for the example above:
// root [GroupNode]
//   room [GroupNode]
//     table [VisualNode]
//   mainCamera [CameraNode]
//   sun [LightNode]
```

The per-node `traverse()` method works identically but starts from that node
instead of root.

## Validation

Nodes validate inputs on set:

| Input | Validation | Behavior on invalid |
|---|---|---|
| Transform position/scale | `Number.isFinite` on all components | Silently ignored (keeps previous value) |
| Transform orientation | `Number.isFinite` on x, y, z, w | Silently ignored |
| `VisualNode.opacity` | `Number.isFinite`, clamped 0–1 | Clamped to range; NaN/Infinity ignored |
| `LightNode.intensity` | `Number.isFinite`, clamped 0–10 | Clamped to range; NaN/Infinity ignored |
| `CameraNode.fov` | `Number.isFinite`, must be > 0 | Silently ignored |
| `CameraNode.near/far` | `Number.isFinite`, must be > 0, near < far | Silently ignored |
| `addChild(self)` | Identity check | Error thrown |
| `addChild(ancestor)` | Cycle detection | Error thrown |

This matches the Story API entity validation pattern (silently reject invalid
values, throw on structural violations).

> **Opacity clamping divergence:** `VisualNode.opacity` is clamped to 0–1 in the
> scene graph, but `SModel.opacity` in the Story API only rejects non-finite
> values — it does not clamp. This is a deliberate improvement at the rendering
> layer. Implementers bridging the two should be aware that a Story API entity
> may hold an opacity outside 0–1, which the scene graph will silently clamp.

## Error Handling

All errors are standard `Error` instances:

- `"Cannot add node as its own child"` — `node.addChild(node)`
- `"Cannot add ancestor as child — cycle detected"` — creating a cycle
- `"Cannot remove root node"` — `graph.removeNode(graph.root)`

## Testing

```bash
npx vitest run test/scene-graph.test.ts
```

Tests cover:

- **Tree structure:** addChild, removeChild, re-parenting, children snapshot
- **Cycle prevention:** self-add throws, ancestor-add throws
- **Node IDs:** auto-increment, unique across all node types
- **Local transforms:** get/set round-trip, identity default, validation rejects NaN/Infinity
- **World transforms:** identity chain, single parent offset, multi-level composition
- **Quaternion composition:** parent × child multiply order, rotation of vectors
- **Scale composition:** component-wise multiply through parent chain
- **GroupNode:** acts as pure container, no extra properties
- **VisualNode:** meshRef, color, opacity (clamps 0–1), visible defaults and setters
- **CameraNode:** fov, near, far, aspect defaults and validation
- **LightNode:** lightType immutable after construction, color, intensity clamping
- **SceneGraph container:** root exists at construction, getNodeById, getNodesByName
- **Traversal:** depth-first pre-order, per-node and whole-graph, find/findAll
- **clear():** removes all children, node IDs keep incrementing (no reset)
- **removeNode:** removes subtree, returns false for unknown node

## Architecture

```
Story API (entity model)     Scene Graph (spatial tree)     Three.js (rendering)
─────────────────────────    ─────────────────────────────  ──────────────────────
SBiped, SProp, SCamera  →   VisualNode, CameraNode, etc.  →  THREE.Mesh, THREE.Camera
Scene (flat CRUD)        →   SceneGraph (tree hierarchy)   →  THREE.Scene
Position, Orientation    →   Transform (pos + orient + scale) → THREE.Object3D.matrix
```

The scene graph is renderer-agnostic — it does not import Three.js. The
`scene-builder.ts` module remains the bridge that reads scene graph state and
produces Three.js objects. This separation allows the scene graph to be tested
without a DOM or WebGL context.

## File Layout

```
src/
  scene-graph.ts           — All scene graph types, nodes, container, math utils
  story-api/
    types.ts               — Vec3, Orientation (re-used by scene graph)
    entities.ts            — Entity hierarchy (SThing → SBiped, etc.)
test/
  scene-graph.test.ts      — Unit tests for scene graph module
docs/
  scene-graph.md           — This document
```
