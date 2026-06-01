# Parity Gaps #71–#75: Event Listeners, Colors, Poses & Model Resources

Five parity gaps with Java Alice are now closed: five missing event listeners,
seven Color constants with an expanded BASIC palette, entity-specific pose
libraries for all locomotion types, and individual model resource enums matching
Java's class structure.

## Overview

| Gap | What changed | Issue |
|---|---|---|
| [Event listeners](#event-listeners) | `TimeListener`, `MouseClickOnScreenListener`, `ArrowKeyPressListener`, `NumberKeyPressListener`, `PointOfViewChangeListener` | #71 |
| [Color constants](#color-constants) | `DARK_GRAY`, `GRAY`, `LIGHT_GRAY`, `LIME`, `ORANGE`, `PINK`, `PURPLE` + expanded `PaintPalette.BASIC` | #72 |
| [Entity-specific poses](#entity-specific-poses) | Flyer, quadruped, slitherer, swimmer pose libraries with pose cycles | #73 |
| [Individual model resources](#individual-model-resource-enums) | Typed const objects per model class in `model-resources/individual-resources.ts` | #74 |
| [Tests](#testing) | Full test coverage for all new code | #75 |

All new APIs are exported from their respective barrel files and follow the
existing patterns in the codebase.

---

## Event Listeners

Five new listener classes in `src/story-api-events/basic-listeners.ts` close
the remaining gap with Java Alice's event model. Each follows the same pattern
as the existing `SceneActivationListener`, `KeyListener`, and
`MouseClickOnObjectListener` — a class with an `events` array, an optional
callback, and lifecycle methods.

### Imports

```typescript
import {
  TimeListener,
  MouseClickOnScreenListener,
  ArrowKeyPressListener,
  NumberKeyPressListener,
  PointOfViewChangeListener,
} from './story-api-events';

import type {
  TimeEvent,
  MouseClickOnScreenEvent,
  ArrowKeyEvent,
  NumberKeyEvent,
  PointOfViewChangeEvent,
  MoveDirection,
} from './story-api-events';
```

### TimeListener

Wraps `ViewEventHandler` to emit per-frame time events. Each event contains
the elapsed time since the scene started and the delta since the last frame.

> **Implementation note:** `ViewEventHandler` has no subscription mechanism —
> it returns `ViewEvent[]` from `advanceFrame(deltaSeconds)`. `TimeListener`
> must adapt: it wraps the handler so the caller feeds `ViewEvent` data via
> a `feed(viewEvents)` method (or `advanceFrame` proxy), then the listener
> computes `deltaSeconds` from consecutive `timeSeconds` values and emits
> `TimeEvent`s. The `attach`/`detach` pattern below is aspirational — the
> implementation may instead use `listener.feed(viewHandler.advanceFrame(dt))`.
>
> **Naming collision:** `ViewEvent` in `event-handlers.ts` (with types
> `"scene-start" | "scene-end" | "frame" | "time"`) is distinct from
> `ViewEvent` in `story-api-events/shared.ts` (with types
> `"view-enter" | "view-exit" | "while-in-view"`). The `TimeListener`
> implementation must import the one from `event-handlers.ts`. Use a type
> alias (e.g., `import type { ViewEvent as FrameViewEvent }`) if both are
> needed in the same file.

**Event interface:**

```typescript
interface TimeEvent {
  readonly type: 'time';
  readonly elapsedSeconds: number;  // from FrameViewEvent.timeSeconds (accumulated)
  readonly deltaSeconds: number;    // current timeSeconds − previous timeSeconds
  readonly frameIndex: number;      // from FrameViewEvent.frameIndex
}
```

**Usage:**

```typescript
import { ViewEventHandler } from './event-handlers';

const viewHandler = new ViewEventHandler();
const listener = new TimeListener((event) => {
  console.log(`Frame ${event.frameIndex}: ${event.deltaSeconds}s delta`);
});

// Feed ViewEvent data from the handler
viewHandler.startScene('myScene');
listener.feed(viewHandler.advanceFrame(0.016));  // 60fps frame

console.log(listener.events.length);  // 1
console.log(listener.events[0].deltaSeconds);  // 0.016
console.log(listener.events[0].elapsedSeconds);  // 0.016

listener.feed(viewHandler.advanceFrame(0.016));
console.log(listener.events[1].elapsedSeconds);  // 0.032
```

**Java equivalent:** `addTimeListener(TimeListener)`

### MouseClickOnScreenListener

Fires on any mouse click on the screen surface, independent of entity
hit-testing. Reports the screen-space position of the click. Unlike
`MouseClickOnObjectListener`, this listener does not require a target entity.

> **Implementation note:** The underlying `MouseClickHandler.mouseUp()` returns
> `MouseInteraction` with `targetId`/`distance`. `MouseClickOnScreenListener`
> ignores `targetId` and extracts screen coordinates from the Position argument
> (`point.x` → `screenX`, `point.y` → `screenY`). No entity hit-test targets
> are passed.

**Event interface:**

```typescript
interface MouseClickOnScreenEvent {
  readonly type: 'click' | 'double-click' | 'drag';
  readonly screenX: number;  // from point.x passed to mouseDown/mouseUp
  readonly screenY: number;  // from point.y passed to mouseDown/mouseUp
  readonly point: Position;  // the raw Position passed to mouseUp
}
```

**Usage:**

```typescript
const listener = new MouseClickOnScreenListener((event) => {
  console.log(`Clicked at screen (${event.screenX}, ${event.screenY})`);
});

// point.x/y are screen coordinates; z is unused
listener.mouseDown({ x: 100, y: 200, z: 0 });
const event = listener.mouseUp({ x: 100, y: 200, z: 0 }, Date.now());

console.log(event?.type);  // 'click'
console.log(event?.screenX);  // 100
console.log(listener.events.length);  // 1
```

**Java equivalent:** `addMouseClickOnScreenListener(MouseClickOnScreenListener)`

### ArrowKeyPressListener

Filters keyboard events to only arrow keys (ArrowUp, ArrowDown, ArrowLeft,
ArrowRight) and adds a `direction` field matching Java's `MoveDirection` enum.

**Types:**

```typescript
type MoveDirection = 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT';

interface ArrowKeyEvent {
  readonly type: 'key-press';
  readonly key: string;
  readonly direction: MoveDirection;
  readonly modifiers: ModifierState;
}
```

**Direction mapping:**

| Key | Direction |
|---|---|
| `ArrowUp` | `FORWARD` |
| `ArrowDown` | `BACKWARD` |
| `ArrowLeft` | `LEFT` |
| `ArrowRight` | `RIGHT` |

**Usage:**

```typescript
const listener = new ArrowKeyPressListener((event) => {
  console.log(`Arrow: ${event.key} → direction: ${event.direction}`);
  // Move a character based on direction
  character.move(event.direction, 1);
});

// Only arrow keys produce events; non-arrow keys return null
listener.keyDown('ArrowUp');    // → ArrowKeyEvent with direction 'FORWARD'
listener.keyDown('ArrowLeft');  // → ArrowKeyEvent with direction 'LEFT'
listener.keyDown('a');          // → null (filtered out, not pushed to events)
listener.keyDown('Space');      // → null (filtered out)

console.log(listener.events.length);  // 2 (only arrow keys)
```

**Java equivalent:** `addArrowKeyPressListener(ArrowKeyPressListener)` +
`MoveDirection` enum

### NumberKeyPressListener

Filters keyboard events to only digit keys (0–9) and adds a `number` field
with the parsed numeric value.

**Event interface:**

```typescript
interface NumberKeyEvent {
  readonly type: 'key-press';
  readonly key: string;
  readonly number: number;
  readonly modifiers: ModifierState;
}
```

**Usage:**

```typescript
const listener = new NumberKeyPressListener((event) => {
  console.log(`Number pressed: ${event.number}`);
  // Select inventory slot
  selectSlot(event.number);
});

listener.keyDown('5');      // → NumberKeyEvent with number: 5
listener.keyDown('0');      // → NumberKeyEvent with number: 0
listener.keyDown('a');      // → null (filtered out)
listener.keyDown('Enter');  // → null (filtered out)

console.log(listener.events.length);  // 2
console.log(listener.events[0].number);  // 5
```

**Java equivalent:** `addNumberKeyPressListener(NumberKeyPressListener)`

### PointOfViewChangeListener

Monitors a camera for changes to its point of view (position, orientation,
or field of view). Uses `PointOfView.capture(camera)` from `camera-system.ts`
to snapshot the camera state (`position`, `orientation`, `fieldOfView`) and
compares successive snapshots to detect changes.

> **Cross-module dependency:** `PointOfViewChangeEvent` references the
> `PointOfView` class from `camera-system.ts`. The event interface in
> `shared.ts` needs a type-only import: `import type { PointOfView } from
> '../camera-system'`. The listener class in `basic-listeners.ts` needs a
> value import for `PointOfView.capture()`.

**Event interface:**

```typescript
interface PointOfViewChangeEvent {
  readonly type: 'pov-change';
  readonly previous: PointOfView;
  readonly current: PointOfView;
  readonly camera: SCamera;
}
```

**Usage:**

```typescript
import { SCamera } from './story-api';
import { PointOfView } from './camera-system';

const camera = scene.findFirstCamera();
const listener = new PointOfViewChangeListener(camera, (event) => {
  console.log('Camera moved!');
  console.log('  From:', event.previous.position);
  console.log('  To:', event.current.position);
});

// Check for changes (call each frame or after camera operations)
camera.position = { x: 5, y: 0, z: 0 };
listener.check();  // → fires event (position changed)

camera.setFieldOfView(1.2);
listener.check();  // → fires event (FOV changed)

listener.check();  // → no event (nothing changed)

console.log(listener.events.length);  // 2
```

**Java equivalent:** `addPointOfViewChangeListener(PointOfViewChangeListener)`

---

## Color Constants

Seven new static constants on the `Color` class in `src/paint-system.ts`,
matching Java AWT's named color set. All values use the 0–1 float range
consistent with the existing Color constants.

### New Constants

| Constant | RGB (0–1) | Hex | Java AWT equivalent |
|---|---|---|---|
| `Color.DARK_GRAY` | `(0.251, 0.251, 0.251)` | `#404040` | `Color.DARK_GRAY` (Java uses 64/255 ≈ 0.251) |
| `Color.GRAY` | `(0.502, 0.502, 0.502)` | `#808080` | `Color.GRAY` (Java uses 128/255 ≈ 0.502) |
| `Color.LIGHT_GRAY` | `(0.753, 0.753, 0.753)` | `#c0c0c0` | `Color.LIGHT_GRAY` (Java uses 192/255 ≈ 0.753) |
| `Color.LIME` | `(0.5, 1, 0)` | `#80ff00` | Alice-specific (chartreuse) |
| `Color.ORANGE` | `(1, 0.784, 0)` | `#ffc800` | `Color.ORANGE` (Java uses 200/255 ≈ 0.784) |
| `Color.PINK` | `(1, 0.686, 0.686)` | `#ffafaf` | `Color.PINK` (Java uses 175/255 ≈ 0.686) |
| `Color.PURPLE` | `(0.5, 0, 0.5)` | `#800080` | Alice-specific |

### Usage

```typescript
import { Color } from './paint-system';

// Use named constants directly
entity.setPaint(Color.ORANGE);
entity.setPaint(Color.DARK_GRAY);

// Mix with existing constants
const blend = ColorMix.interpolate(Color.PURPLE, Color.PINK, 0.5);

// Convert to other formats
console.log(Color.GRAY.toHex());     // '#808080'
console.log(Color.ORANGE.toRgb());   // { r: 255, g: 200, b: 0, a: 255 }

// All Color operations work
const transparent = Color.LIME.withAlpha(0.5);
console.log(Color.PURPLE.equals(new Color(0.5, 0, 0.5)));  // true
```

### Expanded PaintPalette.BASIC

`PaintPalette.BASIC` now includes all 15 named `Color` statics, up from the
previous 5. The palette maps lowercase names to Color instances.

**Before (5 entries):**

```typescript
PaintPalette.BASIC.names();
// → ['black', 'blue', 'green', 'red', 'white']
```

**After (15 entries):**

```typescript
PaintPalette.BASIC.names();
// → ['black', 'blue', 'cyan', 'dark_gray', 'gray', 'green',
//    'light_gray', 'lime', 'magenta', 'orange', 'pink',
//    'purple', 'red', 'white', 'yellow']
```

**Existing code is unaffected** — `palette.get('red')` still returns
`Color.RED`. The only change is that more colors are available.

```typescript
const palette = PaintPalette.BASIC;
palette.get('orange');     // Color.ORANGE
palette.get('dark_gray');  // Color.DARK_GRAY
palette.get('red');        // Color.RED (unchanged)

// Iterate all colors
for (const [name, color] of palette.entries()) {
  console.log(`${name}: ${color.toHex()}`);
}
```

`PaintPalette.curated()` continues to return `[BASIC, OCEAN, SUNSET]` — no
change to the curated palette list.

---

## Entity-Specific Poses

Four new pose libraries in `src/poses.ts` provide locomotion-type-specific
poses using the actual joints defined in `joint-system.ts` and
`biped-quadruped.ts`. Each library follows the same `PoseDefinition` interface
and `applyPose()` pattern as the existing biped poses.

### Flyer Poses

Wing-based poses using `FlyerJoints` (LEFT/RIGHT_WING_SHOULDER, TAIL_0,
LEFT/RIGHT_HIP).

| Pose | Description | Key joints |
|---|---|---|
| `FLYER_REST_POSE` | Wings folded at sides | LEFT/RIGHT_WING_SHOULDER |
| `FLYER_GLIDE_POSE` | Wings extended horizontally | LEFT/RIGHT_WING_SHOULDER |
| `FLYER_FLAP_UP_POSE` | Wings raised above body | LEFT/RIGHT_WING_SHOULDER |
| `FLYER_FLAP_DOWN_POSE` | Wings pushed below body | LEFT/RIGHT_WING_SHOULDER |
| `FLYER_LAND_POSE` | Wings back, legs extended | LEFT/RIGHT_WING_SHOULDER, LEFT/RIGHT_HIP |

```typescript
import { FLYER_GLIDE_POSE, FLYER_FLAP_UP_POSE, createFlyerFlapCycle, applyPose } from './poses';

// Apply a single pose
applyPose(eagle, FLYER_GLIDE_POSE);

// Get the flapping animation cycle
const flapCycle = createFlyerFlapCycle();
// → [FLYER_REST_POSE, FLYER_FLAP_UP_POSE, FLYER_GLIDE_POSE, FLYER_FLAP_DOWN_POSE]

// Cycle through poses for animation
for (const pose of flapCycle) {
  applyPose(eagle, pose);
}
```

### Quadruped Poses

Four-legged poses using `QuadrupedJoints` (FRONT_LEFT/RIGHT_SHOULDER,
BACK_LEFT/RIGHT_HIP, TAIL_0, HEAD/NECK).

| Pose | Description | Key joints |
|---|---|---|
| `QUADRUPED_STAND_POSE` | Standing on all fours | All leg joints at 0 |
| `QUADRUPED_SIT_POSE` | Back legs folded, front legs straight | BACK_LEFT/RIGHT_HIP |
| `QUADRUPED_TROT_STRIDE_POSE` | Mid-stride, diagonal legs extended | All leg joints |
| `QUADRUPED_TROT_PASS_POSE` | Legs passing neutral | All leg joints |
| `QUADRUPED_TROT_STRIDE_MIRROR_POSE` | Mid-stride, opposite diagonal | All leg joints |

```typescript
import { QUADRUPED_SIT_POSE, createQuadrupedTrotCycle, applyPose } from './poses';

applyPose(dog, QUADRUPED_SIT_POSE);

const trotCycle = createQuadrupedTrotCycle();
// → [QUADRUPED_STAND_POSE, QUADRUPED_TROT_STRIDE_POSE,
//    QUADRUPED_TROT_PASS_POSE, QUADRUPED_TROT_STRIDE_MIRROR_POSE]
```

### Slitherer Poses

Spine-based poses using raw joint name strings matching the existing
`SSlitherer.slither()` code in `biped-quadruped.ts`: `"NECK"`,
`"SPINE_BASE"`, `"SPINE_MIDDLE"`, `"SPINE_UPPER"`. No `SlithererJoints`
constant exists in `joint-system.ts` — poses use string keys directly in
`jointRotations`.

| Pose | Description | Key joints |
|---|---|---|
| `SLITHERER_STRAIGHT_POSE` | Body straight | All spine joints at 0 |
| `SLITHERER_S_CURVE_LEFT_POSE` | S-curve bending left first | Alternating yaw on spine joints |
| `SLITHERER_S_CURVE_RIGHT_POSE` | S-curve bending right first | Alternating yaw on spine joints |

```typescript
import { SLITHERER_S_CURVE_LEFT_POSE, createSlithererCycle, applyPose } from './poses';

applyPose(snake, SLITHERER_S_CURVE_LEFT_POSE);

const slitherCycle = createSlithererCycle();
// → [SLITHERER_STRAIGHT_POSE, SLITHERER_S_CURVE_LEFT_POSE,
//    SLITHERER_STRAIGHT_POSE, SLITHERER_S_CURVE_RIGHT_POSE]
```

### Swimmer Poses

Tail/neck-based poses for aquatic entities using `"TAIL"` and `"NECK"` joint
name strings matching the existing `SSwimmer.swim()`/`dive()` code. Like
slitherer, no `SwimmerJoints` constant exists — uses raw string keys.

> **Note:** `SSwimmer` uses `"TAIL"` while `QuadrupedJoints.TAIL` maps to
> `JointId("TAIL_0")`. These are different joint names — swimmer models use
> `"TAIL"`, quadrupeds use `"TAIL_0"`. The new pose definitions must match the
> joint names expected by each entity type's model hierarchy.

| Pose | Description | Key joints |
|---|---|---|
| `SWIMMER_IDLE_POSE` | Neutral floating position | TAIL, NECK |
| `SWIMMER_TAIL_LEFT_POSE` | Tail swept left | TAIL |
| `SWIMMER_TAIL_RIGHT_POSE` | Tail swept right | TAIL |
| `SWIMMER_DIVE_POSE` | Nose down, tail up | TAIL, NECK |

```typescript
import { SWIMMER_DIVE_POSE, createSwimmerTailCycle, applyPose } from './poses';

applyPose(fish, SWIMMER_DIVE_POSE);

const swimCycle = createSwimmerTailCycle();
// → [SWIMMER_IDLE_POSE, SWIMMER_TAIL_LEFT_POSE,
//    SWIMMER_IDLE_POSE, SWIMMER_TAIL_RIGHT_POSE]
```

### Pose Cycles Summary

| Function | Entity type | Poses in cycle | Locomotion |
|---|---|---|---|
| `createWalkCycle()` | Biped | 4 poses | Walking (existing) |
| `createFlyerFlapCycle()` | Flyer | 4 poses | Wing flapping |
| `createQuadrupedTrotCycle()` | Quadruped | 4 poses | Trotting gait |
| `createSlithererCycle()` | Slitherer | 4 poses | S-curve slithering |
| `createSwimmerTailCycle()` | Swimmer | 4 poses | Tail propulsion |

---

## Individual Model Resource Enums

`src/model-resources/individual-resources.ts` provides typed constant objects
for individual model resources within each Java model class. These match the
Java `*Resource` enum pattern where each model class has an enum with entries
for specific models (e.g., `BipedResource.ALIEN`, `QuadrupedResource.CAT`).

### Structure

Each resource class exports a frozen object whose keys are model identifiers
and values contain the resource definition metadata:

```typescript
interface IndividualModelResource {
  readonly id: string;
  readonly name: string;
  readonly modelName: string;
}
```

### Available Resource Enums

| Constant | Model class | Representative entries |
|---|---|---|
| `BipedResource` | `SBiped` | `ALIEN`, `BUNNY`, `OGRE`, `WITCH`, `ZOMBIE`, … |
| `FlyerResource` | `SFlyer` | `BLUEJAY`, `CHICKEN`, `EAGLE`, `OWL`, `PARROT`, … |
| `QuadrupedResource` | `SQuadruped` | `CAT`, `DOG`, `HORSE`, `LION`, `WOLF`, … |
| `SwimmerResource` | `SSwimmer` | `CLOWNFISH`, `GOLDFISH`, `PUFFERFISH`, `SHARK`, … |
| `FishResource` | `SSwimmer` | `BLUEGILL`, `BASS`, `TROUT`, `SALMON`, … |
| `MarineMammalResource` | `SSwimmer` | `DOLPHIN`, `ORCA`, `SEALION`, `WALRUS`, … |
| `SlithererResource` | `SSlitherer` | `COBRA`, `PYTHON`, `RATTLESNAKE`, `WORM`, … |
| `PropResource` | `SJointedModel` | `BOULDER`, `CHAIR`, `TABLE`, `TREE`, `LAMP`, … |
| `AutomobileResource` | `STransport` | `COMPACT_CAR`, `PICKUP_TRUCK`, `SEDAN`, … |
| `AircraftResource` | `STransport` | `BIPLANE`, `HELICOPTER`, `JET`, … |
| `WatercraftResource` | `STransport` | `CANOE`, `ROWBOAT`, `SPEEDBOAT`, `YACHT`, … |
| `TrainResource` | `STransport` | `FREIGHT_CAR`, `LOCOMOTIVE`, `PASSENGER_CAR`, … |

### Usage

```typescript
import {
  BipedResource,
  QuadrupedResource,
  PropResource,
} from './model-resources';

// Look up a specific resource
const bunny = BipedResource.BUNNY;
console.log(bunny.id);         // 'BUNNY'
console.log(bunny.name);       // 'Bunny'
console.log(bunny.modelName);  // 'Bunny'

// Register with the catalog
import { ModelResourceCatalog, MODEL_CLASS_DATA } from './model-resources';

const catalog = new ModelResourceCatalog();
catalog.register({
  ...QuadrupedResource.CAT,
  category: MODEL_CLASS_DATA.QUADRUPED.category,
  modelClass: 'QUADRUPED',
});

// Enumerate all resources in a class
for (const [key, resource] of Object.entries(BipedResource)) {
  console.log(`${key}: ${resource.name}`);
}

// Type-safe access (TypeScript catches typos)
const dog = QuadrupedResource.DOG;  // ✓ compiles
// const bad = QuadrupedResource.UNICORN;  // ✗ compile error
```

### Registration with ModelResourceCatalog

Individual resources provide `id`, `name`, and `modelName` — the three fields
needed by `ModelResourceCatalog.register()`. You supply the `category` and
`modelClass` from `MODEL_CLASS_DATA`:

```typescript
import { ModelResourceCatalog, MODEL_CLASS_DATA } from './model-resources';
import { BipedResource, FlyerResource } from './model-resources';

const catalog = new ModelResourceCatalog();

// Register a single resource
catalog.register({
  ...BipedResource.BUNNY,
  category: MODEL_CLASS_DATA.BIPED.category,
  modelClass: 'BIPED',
});

// Bulk-register all resources of a class
for (const resource of Object.values(FlyerResource)) {
  catalog.register({
    ...resource,
    category: MODEL_CLASS_DATA.FLYER.category,
    modelClass: 'FLYER',
  });
}

// Browse the gallery tree
const tree = catalog.buildTree();
console.log(tree.children.length);  // folders by category
```

---

## Testing

All new code has corresponding tests.

### Test files

| Test file | What it covers |
|---|---|
| `test/story-api-events.test.ts` | All 5 new listener classes — construction, event generation, filtering, detach |
| `test/paint-system.test.ts` | 7 new Color constants, expanded PaintPalette.BASIC (15 entries) |
| `test/poses.test.ts` | All entity-specific poses and cycle functions |
| `test/model-resources.test.ts` | Individual resource enums — structure, id/name/modelName, catalog registration |

### Running tests

```bash
# Full test suite
npm test

# Specific test file
npx vitest test/story-api-events.test.ts
npx vitest test/paint-system.test.ts
npx vitest test/poses.test.ts
npx vitest test/model-resources.test.ts
```

### Key test scenarios

**Event listeners:**

- `TimeListener` emits events with correct `elapsedSeconds` and `deltaSeconds`
  after `advanceFrame()`
- `MouseClickOnScreenListener` generates click events with screen coordinates
  without entity targeting
- `ArrowKeyPressListener` accepts only arrow keys, maps to correct
  `MoveDirection`, rejects non-arrow keys
- `NumberKeyPressListener` accepts only digits 0–9, rejects letters and
  special keys, parses correct `number` value
- `PointOfViewChangeListener` fires when camera position/orientation/FOV
  changes, stays silent when nothing changes

**Color constants:**

- Each new constant has expected RGB values matching Java AWT
- All constants are `instanceof Color` with `alpha === 1`
- `PaintPalette.BASIC` contains exactly 15 entries
- Existing `palette.get('red')` still returns `Color.RED`
- All standard Color operations (`.toHex()`, `.toRgb()`, `.withAlpha()`,
  `.equals()`) work on new constants

**Entity poses:**

- Each pose has a `name` and non-empty `jointRotations`
- Joint names match the joint constants in `joint-system.ts`
- `applyPose()` correctly sets joint rotations on a `PoseableEntity`
- Each cycle function returns an array of 4 poses
- Cycle poses are frozen (immutable)

**Model resources:**

- Each resource enum is a frozen object
- Every entry has non-empty `id`, `name`, and `modelName` strings
- Resources can be spread into `ModelResourceCatalog.register()` calls
- No duplicate IDs within a resource class

---

## Barrel Exports

All new types and classes are re-exported through the standard barrel files:

### `src/story-api-events.ts`

```typescript
// New event interfaces
export type {
  TimeEvent,
  MouseClickOnScreenEvent,
  ArrowKeyEvent,
  NumberKeyEvent,
  PointOfViewChangeEvent,
  MoveDirection,
} from './story-api-events/shared.js';

// New listener classes
export {
  TimeListener,
  MouseClickOnScreenListener,
  ArrowKeyPressListener,
  NumberKeyPressListener,
  PointOfViewChangeListener,
} from './story-api-events/basic-listeners.js';
```

### `src/model-resources.ts`

```typescript
export {
  BipedResource,
  FlyerResource,
  QuadrupedResource,
  SwimmerResource,
  FishResource,
  MarineMammalResource,
  SlithererResource,
  PropResource,
  AutomobileResource,
  AircraftResource,
  WatercraftResource,
  TrainResource,
} from './model-resources/individual-resources.js';
```

### `src/poses.ts`

New exports are directly in `poses.ts` alongside the existing biped poses —
no barrel indirection needed.

---

## Java Parity Mapping

> **Design Notes for Implementation:**
>
> 1. **TimeListener subscription model:** `ViewEventHandler` has no
>    `addListener`/`removeListener` API. Implementation choices: (a) add a
>    `feed(viewEvents: ViewEvent[])` method so callers push events in, or
>    (b) extend `ViewEventHandler` with a callback registration. Option (a) is
>    simpler and avoids modifying the event-handlers module.
>
> 2. **ArrowKeyPressListener / NumberKeyPressListener return types:** Unlike
>    `KeyListener.keyDown()` which always returns `KeyListenerEvent`, the
>    filtered variants return `ArrowKeyEvent | null` / `NumberKeyEvent | null`.
>    Implementation should handle the null case clearly — non-matching keys
>    are silently ignored and not pushed to `events`.
>
> 3. **Slitherer/Swimmer joint names:** No typed `SlithererJoints` or
>    `SwimmerJoints` constants exist in `joint-system.ts`. The pose definitions
>    use raw string keys matching existing animation code in `biped-quadruped.ts`:
>    slitherer uses `"NECK"`, `"SPINE_BASE"`, `"SPINE_MIDDLE"`, `"SPINE_UPPER"`;
>    swimmer uses `"TAIL"`, `"NECK"` (note: swimmer's `"TAIL"` differs from
>    quadruped's `"TAIL_0"`). Joint name validation only happens at runtime
>    when `applyPose()` sets `jointRotations`. Consider adding typed joint
>    constants in a future PR.
>
> 4. **Color float precision:** Use Java AWT's exact integer RGB values divided
>    by 255 to avoid rounding mismatches. E.g., LIGHT_GRAY should be
>    `new Color(192/255, 192/255, 192/255)`, not `new Color(0.75, 0.75, 0.75)`.

| Java Alice API | TypeScript equivalent | Module |
|---|---|---|
| `addTimeListener(TimeListener)` | `new TimeListener(callback)` | `story-api-events` |
| `addMouseClickOnScreenListener(...)` | `new MouseClickOnScreenListener(callback)` | `story-api-events` |
| `addArrowKeyPressListener(...)` | `new ArrowKeyPressListener(callback)` | `story-api-events` |
| `addNumberKeyPressListener(...)` | `new NumberKeyPressListener(callback)` | `story-api-events` |
| `addPointOfViewChangeListener(...)` | `new PointOfViewChangeListener(camera, callback)` | `story-api-events` |
| `MoveDirection` enum | `MoveDirection` type | `story-api-events` |
| `Color.DARK_GRAY` | `Color.DARK_GRAY` | `paint-system` |
| `Color.GRAY` | `Color.GRAY` | `paint-system` |
| `Color.LIGHT_GRAY` | `Color.LIGHT_GRAY` | `paint-system` |
| `Color.ORANGE` | `Color.ORANGE` | `paint-system` |
| `Color.PINK` | `Color.PINK` | `paint-system` |
| `BipedResource.BUNNY` (etc.) | `BipedResource.BUNNY` | `model-resources` |
| `QuadrupedResource.CAT` (etc.) | `QuadrupedResource.CAT` | `model-resources` |
| `FlyerResource.EAGLE` (etc.) | `FlyerResource.EAGLE` | `model-resources` |
| Biped walk cycle / poses | `createWalkCycle()` | `poses` |
| Quadruped trot / poses | `createQuadrupedTrotCycle()` | `poses` |
| Flyer flap / poses | `createFlyerFlapCycle()` | `poses` |
| Slitherer slither / poses | `createSlithererCycle()` | `poses` |
| Swimmer swim / poses | `createSwimmerTailCycle()` | `poses` |
