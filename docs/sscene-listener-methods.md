# SScene Listener Convenience Methods

The `SScene` class provides convenience methods for registering and removing
event listeners, matching the Java Alice `SScene` API surface. Each method
delegates to the existing listener infrastructure in `src/story-api-events/`.

**Source:** `src/story-api/expanded-entities-base-core.ts`
**Event types:** `src/story-api-events/shared.ts`

## Overview

The 14 `add*Listener` methods and their 14 corresponding `remove*Listener`
counterparts fall into three categories based on their signatures:

| Category | Methods | Signature | Storage |
|----------|---------|-----------|---------|
| **Simple** | Mouse click on screen, mouse click on object, key press, arrow key, number key, point-of-view change | `(listener)` → `void` | `Set<callback>` |
| **Entity-bound** | Collision start/end, occlusion start/end, while-in-view, while-occlusion | `(entity, listener)` → `void` | `Map<SThing, Set<callback>>` |
| **Proximity** | Proximity enter, proximity exit | `(entity, distance, listener)` → `void` | `Map<SThing, Map<callback, distance>>` |

## Quick Start

```typescript
import { SScene, SBiped, SThing } from './story-api';
import type {
  MouseClickOnScreenEvent,
  MouseClickOnObjectEvent,
  KeyListenerEvent,
  ArrowKeyEvent,
  NumberKeyEvent,
  PointOfViewChangeEvent,
  CollisionTransitionEvent,
  ProximityTransitionEvent,
  OcclusionEvent,
  ViewEvent,
} from './story-api-events/shared';

const scene = new SScene();
const bunny = new SBiped('bunny');
const fox = new SBiped('fox');

// Simple listener — no entity binding
scene.addMouseClickOnScreenListener((event: MouseClickOnScreenEvent) => {
  console.log(`Screen clicked at (${event.screenX}, ${event.screenY})`);
});

// Entity-bound listener — fires when bunny collides with anything
scene.addCollisionStartListener(bunny, (event: CollisionTransitionEvent) => {
  console.log(`${event.left.name} collided with ${event.right.name}`);
});

// Proximity listener — fires when fox enters within distance 3 of bunny
scene.addProximityEnterListener(bunny, 3, (event: ProximityTransitionEvent) => {
  console.log(`${event.source.name} is near ${event.target.name}`);
});
```

## Simple Listeners

Simple listeners take a single callback argument and are not bound to a
specific entity. The callback receives the corresponding event object.

### addMouseClickOnScreenListener / removeMouseClickOnScreenListener

Fires when the user clicks anywhere on the scene viewport.

```typescript
type MouseClickOnScreenCallback = (event: MouseClickOnScreenEvent) => void;

scene.addMouseClickOnScreenListener(listener: MouseClickOnScreenCallback): void;
scene.removeMouseClickOnScreenListener(listener: MouseClickOnScreenCallback): void;
```

**Event type:** `MouseClickOnScreenEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"click" \| "double-click" \| "drag"` | Click variant |
| `screenX` | `number` | Horizontal screen coordinate |
| `screenY` | `number` | Vertical screen coordinate |
| `point` | `Position` | 3D world-space hit point |

**Example:**

```typescript
const onClick = (event: MouseClickOnScreenEvent) => {
  console.log(`Click at screen (${event.screenX}, ${event.screenY})`);
};

scene.addMouseClickOnScreenListener(onClick);
// Later:
scene.removeMouseClickOnScreenListener(onClick);
```

### addMouseClickOnObjectListener / removeMouseClickOnObjectListener

Fires when the user clicks on a specific scene object.

```typescript
type MouseClickOnObjectCallback = (event: MouseClickOnObjectEvent) => void;

scene.addMouseClickOnObjectListener(listener: MouseClickOnObjectCallback): void;
scene.removeMouseClickOnObjectListener(listener: MouseClickOnObjectCallback): void;
```

**Event type:** `MouseClickOnObjectEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"click" \| "double-click" \| "drag"` | Click variant |
| `target` | `SThing \| null` | The clicked entity |
| `targetName` | `string \| null` | Name of the clicked entity |
| `point` | `Position` | 3D world-space hit point |
| `distance` | `number` | Distance from camera to hit point |

**Example:**

```typescript
scene.addMouseClickOnObjectListener((event) => {
  if (event.target) {
    console.log(`Clicked on ${event.targetName} at distance ${event.distance}`);
  }
});
```

### addKeyPressListener / removeKeyPressListener

Fires on any keyboard key press or release.

```typescript
type KeyPressCallback = (event: KeyListenerEvent) => void;

scene.addKeyPressListener(listener: KeyPressCallback): void;
scene.removeKeyPressListener(listener: KeyPressCallback): void;
```

**Event type:** `KeyListenerEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"key-press" \| "key-release"` | Press or release |
| `key` | `string` | Key identifier (e.g. `"Space"`, `"KeyA"`) |
| `modifiers` | `ModifierState` | Shift, ctrl, alt, meta state |
| `shortcuts` | `readonly string[]` | Normalized shortcut strings |
| `pressed` | `boolean` | `true` if pressed, `false` if released |

**Example:**

```typescript
scene.addKeyPressListener((event) => {
  if (event.pressed && event.key === 'Space') {
    console.log('Space pressed!');
  }
});
```

### addArrowKeyPressListener / removeArrowKeyPressListener

Fires only for arrow key presses, with a normalized `direction` field.

```typescript
type ArrowKeyCallback = (event: ArrowKeyEvent) => void;

scene.addArrowKeyPressListener(listener: ArrowKeyCallback): void;
scene.removeArrowKeyPressListener(listener: ArrowKeyCallback): void;
```

**Event type:** `ArrowKeyEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"key-press"` | Always key-press |
| `key` | `string` | Arrow key identifier |
| `direction` | `MoveDirection` | `"FORWARD"`, `"BACKWARD"`, `"LEFT"`, or `"RIGHT"` |
| `modifiers` | `ModifierState` | Modifier key state |

**Example:**

```typescript
scene.addArrowKeyPressListener((event) => {
  console.log(`Arrow key → move ${event.direction}`);
});
```

### addNumberKeyPressListener / removeNumberKeyPressListener

Fires only for number key presses (0–9), with a parsed `number` field.

```typescript
type NumberKeyCallback = (event: NumberKeyEvent) => void;

scene.addNumberKeyPressListener(listener: NumberKeyCallback): void;
scene.removeNumberKeyPressListener(listener: NumberKeyCallback): void;
```

**Event type:** `NumberKeyEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"key-press"` | Always key-press |
| `key` | `string` | Key identifier |
| `number` | `number` | Parsed digit (0–9) |
| `modifiers` | `ModifierState` | Modifier key state |

**Example:**

```typescript
scene.addNumberKeyPressListener((event) => {
  console.log(`Number ${event.number} pressed`);
});
```

### addPointOfViewChangeListener / removePointOfViewChangeListener

Fires when the camera's point of view changes.

```typescript
type PointOfViewChangeCallback = (event: PointOfViewChangeEvent) => void;

scene.addPointOfViewChangeListener(listener: PointOfViewChangeCallback): void;
scene.removePointOfViewChangeListener(listener: PointOfViewChangeCallback): void;
```

**Event type:** `PointOfViewChangeEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"pov-change"` | Always pov-change |
| `previous` | `PointOfView` | Previous camera POV |
| `current` | `PointOfView` | New camera POV |
| `camera` | `SCamera` | The camera that changed |

**Example:**

```typescript
scene.addPointOfViewChangeListener((event) => {
  console.log('Camera moved from', event.previous, 'to', event.current);
});
```

## Entity-Bound Listeners

Entity-bound listeners take a target `SThing` entity as the first argument.
The listener fires only for events involving that entity. Internally, listeners
are stored in a `Map<SThing, Set<callback>>`.

### addCollisionStartListener / removeCollisionStartListener

Fires when the target entity starts colliding with another entity.

```typescript
type CollisionCallback = (event: CollisionTransitionEvent) => void;

scene.addCollisionStartListener(entity: SThing, listener: CollisionCallback): void;
scene.removeCollisionStartListener(entity: SThing, listener: CollisionCallback): void;
```

**Event type:** `CollisionTransitionEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"collision-start" \| "collision-end" \| "while-collision"` | Transition type |
| `left` | `SThing` | First entity in the collision pair |
| `right` | `SThing` | Second entity in the collision pair |
| `pairKey` | `string` | Stable identifier for the pair |

### addCollisionEndListener / removeCollisionEndListener

Fires when the target entity stops colliding with another entity.

```typescript
scene.addCollisionEndListener(entity: SThing, listener: CollisionCallback): void;
scene.removeCollisionEndListener(entity: SThing, listener: CollisionCallback): void;
```

Same event type as `addCollisionStartListener`.

**Example (collision pair):**

```typescript
const onStart = (event: CollisionTransitionEvent) => {
  console.log(`Collision started: ${event.left.name} ↔ ${event.right.name}`);
};
const onEnd = (event: CollisionTransitionEvent) => {
  console.log(`Collision ended: ${event.pairKey}`);
};

scene.addCollisionStartListener(bunny, onStart);
scene.addCollisionEndListener(bunny, onEnd);

// Cleanup
scene.removeCollisionStartListener(bunny, onStart);
scene.removeCollisionEndListener(bunny, onEnd);
```

### addOcclusionStartListener / removeOcclusionStartListener

Fires when an entity becomes occluded (hidden behind another object from the
camera's perspective).

```typescript
type OcclusionCallback = (event: OcclusionEvent) => void;

scene.addOcclusionStartListener(entity: SThing, listener: OcclusionCallback): void;
scene.removeOcclusionStartListener(entity: SThing, listener: OcclusionCallback): void;
```

**Event type:** `OcclusionEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"occluded" \| "revealed" \| "occlusion-start" \| "occlusion-end" \| "while-occlusion"` | Transition type (this listener receives `"occlusion-start"` events) |
| `camera` | `SCamera` | The observing camera |
| `target` | `SThing` | The entity being observed |
| `occluder` | `SThing \| null` | The entity causing occlusion |

### addOcclusionEndListener / removeOcclusionEndListener

Fires when an entity is no longer occluded.

```typescript
scene.addOcclusionEndListener(entity: SThing, listener: OcclusionCallback): void;
scene.removeOcclusionEndListener(entity: SThing, listener: OcclusionCallback): void;
```

Same event type as `addOcclusionStartListener` (this listener receives
`"occlusion-end"` events).

### addWhileInViewListener / removeWhileInViewListener

Fires continuously while an entity is visible in the camera's view frustum.

```typescript
type ViewCallback = (event: ViewEvent) => void;

scene.addWhileInViewListener(entity: SThing, listener: ViewCallback): void;
scene.removeWhileInViewListener(entity: SThing, listener: ViewCallback): void;
```

**Event type:** `ViewEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"view-enter" \| "view-exit" \| "while-in-view"` | View transition type |
| `camera` | `SCamera` | The observing camera |
| `target` | `SThing` | The entity being observed |

### addWhileOcclusionListener / removeWhileOcclusionListener

Fires continuously while an entity remains occluded.

```typescript
scene.addWhileOcclusionListener(entity: SThing, listener: OcclusionCallback): void;
scene.removeWhileOcclusionListener(entity: SThing, listener: OcclusionCallback): void;
```

Same event type as `addOcclusionStartListener` (this listener receives
`"while-occlusion"` events).

**Example (view and occlusion monitoring):**

```typescript
scene.addWhileInViewListener(bunny, (event) => {
  console.log(`${event.target.name} is visible to ${event.camera.name}`);
});

scene.addOcclusionStartListener(bunny, (event) => {
  console.log(`${event.target.name} occluded by ${event.occluder?.name}`);
});

scene.addWhileOcclusionListener(bunny, (event) => {
  console.log(`${event.target.name} still hidden behind ${event.occluder?.name}`);
});
```

## Proximity Listeners

Proximity listeners take a target entity and a distance threshold. The
listener fires when any other entity enters or exits the threshold distance
from the target. Internally stored as `Map<SThing, Map<callback, distance>>`.

### addProximityEnterListener / removeProximityEnterListener

Fires when another entity moves within the specified distance of the target.

```typescript
type ProximityCallback = (event: ProximityTransitionEvent) => void;

scene.addProximityEnterListener(entity: SThing, distance: number, listener: ProximityCallback): void;
scene.removeProximityEnterListener(entity: SThing, listener: ProximityCallback): void;
```

**Event type:** `ProximityTransitionEvent`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"proximity-enter" \| "proximity-exit" \| "while-proximity"` | Transition type |
| `source` | `SThing` | Entity being watched |
| `target` | `SThing` | Entity that entered/exited proximity |
| `pairKey` | `string` | Stable pair identifier |
| `threshold` | `number` | Distance threshold for this watch |
| `distance` | `number` | Current distance between entities |

### addProximityExitListener / removeProximityExitListener

Fires when another entity moves beyond the specified distance from the target.

```typescript
scene.addProximityExitListener(entity: SThing, distance: number, listener: ProximityCallback): void;
scene.removeProximityExitListener(entity: SThing, listener: ProximityCallback): void;
```

Same event type as `addProximityEnterListener`.

> **Note:** The `remove` methods for proximity listeners match by callback
> reference only — you do not pass the distance when removing.

**Example:**

```typescript
const onEnter = (event: ProximityTransitionEvent) => {
  console.log(
    `${event.target.name} entered within ${event.threshold} of ${event.source.name} ` +
    `(actual distance: ${event.distance.toFixed(2)})`
  );
};

scene.addProximityEnterListener(bunny, 5, onEnter);

// Later:
scene.removeProximityEnterListener(bunny, onEnter);
```

## Complete Example

A full interactive scene demonstrating multiple listener types:

```typescript
import { SScene, SBiped, SProp } from './story-api';
import type {
  MouseClickOnObjectEvent,
  KeyListenerEvent,
  CollisionTransitionEvent,
  ProximityTransitionEvent,
} from './story-api-events/shared';

const scene = new SScene('myScene');
const player = new SBiped('player');
const treasure = new SProp('treasure');
const enemy = new SBiped('enemy');

// Click to inspect objects
scene.addMouseClickOnObjectListener((event: MouseClickOnObjectEvent) => {
  if (event.target) {
    console.log(`Inspecting ${event.targetName}`);
  }
});

// WASD movement via key press
scene.addKeyPressListener((event: KeyListenerEvent) => {
  if (!event.pressed) return;
  switch (event.key) {
    case 'KeyW': player.move('FORWARD', 1); break;
    case 'KeyS': player.move('BACKWARD', 1); break;
    case 'KeyA': player.move('LEFT', 1); break;
    case 'KeyD': player.move('RIGHT', 1); break;
  }
});

// Detect picking up treasure
const onCollision = (event: CollisionTransitionEvent) => {
  const other = event.left === player ? event.right : event.left;
  if (other === treasure) {
    console.log('Treasure collected!');
  }
};
scene.addCollisionStartListener(player, onCollision);

// Warn when enemy approaches
const onProximity = (event: ProximityTransitionEvent) => {
  if (event.target === enemy) {
    console.log(`Enemy approaching! Distance: ${event.distance.toFixed(1)}`);
  }
};
scene.addProximityEnterListener(player, 10, onProximity);

// Cleanup when done
scene.removeCollisionStartListener(player, onCollision);
scene.removeProximityEnterListener(player, onProximity);
```

## Listener Lifecycle

1. **Registration:** `add*Listener` stores the callback in the appropriate
   collection (`Set` or `Map<SThing, Set>`). Duplicate adds are no-ops (Set
   semantics).

2. **Dispatch:** The event infrastructure in `story-api-events/` calls
   registered listeners when the corresponding event fires. Simple listeners
   receive every event of that type. Entity-bound listeners are filtered to
   only fire when the bound entity is involved.

3. **Removal:** `remove*Listener` deletes the callback by reference. If the
   callback was not registered, the call is a no-op. For entity-bound and
   proximity listeners, both the entity and callback must match.

4. **Cleanup:** When an entity-bound Map entry's Set becomes empty after
   removal, the Map entry is automatically cleaned up.

## Relationship to Existing Listeners

These convenience methods complement the three listeners already on `SScene`:

| Existing Method | Behavior |
|-----------------|----------|
| `addSceneActivationListener(listener)` | Delegates to `SceneImp` — fires on scene activate/deactivate |
| `addObjectAdditionListener(listener)` | Local `Set<callback>` — fires when entities are added |
| `addTimeListener(listener)` | Local `Set<callback>` — fires on time ticks |

The new methods follow the same patterns: simple listeners use `Set<callback>`,
entity-bound listeners use `Map<SThing, Set<callback>>`, and proximity
listeners use `Map<SThing, Map<callback, distance>>`.

## Java API Parity

These methods match the Java Alice 3 `SScene` event listener API:

| Java Method | TypeScript Method | Status |
|-------------|-------------------|--------|
| `addMouseClickOnScreenListener` | `addMouseClickOnScreenListener` | ✅ |
| `addMouseClickOnObjectListener` | `addMouseClickOnObjectListener` | ✅ |
| `addKeyPressListener` | `addKeyPressListener` | ✅ |
| `addArrowKeyPressListener` | `addArrowKeyPressListener` | ✅ |
| `addNumberKeyPressListener` | `addNumberKeyPressListener` | ✅ |
| `addPointOfViewChangeListener` | `addPointOfViewChangeListener` | ✅ |
| `addCollisionStartListener` | `addCollisionStartListener` | ✅ |
| `addCollisionEndListener` | `addCollisionEndListener` | ✅ |
| `addProximityEnterListener` | `addProximityEnterListener` | ✅ |
| `addProximityExitListener` | `addProximityExitListener` | ✅ |
| `addOcclusionStartListener` | `addOcclusionStartListener` | ✅ |
| `addOcclusionEndListener` | `addOcclusionEndListener` | ✅ |
| `addWhileInViewListener` | `addWhileInViewListener` | ✅ |
| `addWhileOcclusionListener` | `addWhileOcclusionListener` | ✅ |

All 14 methods have corresponding `remove*Listener` counterparts.
