# Event System & Object Interaction

The event system (`src/server.ts`) provides registration and firing of Alice
event listeners — scene activation, key press, and proximity detection — through
two HTTP endpoints. It powers interactive behaviors in the TypeScript web
prototype, matching the event model that Java Alice exposes.

> **See also:** [SScene listener convenience methods](./sscene-listener-methods.md) —
> the programmatic TypeScript API for registering event listeners directly on `SScene`.

## Overview

When you register an event via `POST /api/events/register`, the server stores
a typed registration with an auto-assigned ID (`evt-1`, `evt-2`, …). When you
fire an event via `POST /api/events/fire`, the server evaluates all matching
registrations and returns which ones triggered.

Three event types are supported:

| Event Type | Trigger Condition | Typical Use |
|---|---|---|
| `sceneActivated` | Always triggers when fired | Scene initialization listeners |
| `keyPress` | Fires when `payload.key` matches registration `key` | Keyboard interaction |
| `proximity` | Fires when two objects are within `threshold` distance | Collision / interaction zones |

The server must be launched (`POST /api/launch`) before registering or firing
events. All event operations return 400 if the server has not been launched.

## Quick Start

```bash
# Build and start the server
npm run build:server
export ALICE_LOCAL_API_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"
node dist-server/cli.js serve \
  --port 3000 \
  --evidence-dir ./evidence \
  --api-token "$ALICE_LOCAL_API_TOKEN" \
  --project /path/to/starter.a3p

# Launch the project
curl -X POST http://localhost:3000/api/launch \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"project": "/path/to/starter.a3p"}'

# Register a scene activation event
curl -X POST http://localhost:3000/api/events/register \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated", "handlerName": "initScene"}'

# Fire the scene activation
curl -X POST http://localhost:3000/api/events/fire \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated"}'
```

Response:

```json
{
  "triggered": [
    {
      "id": "evt-1",
      "eventType": "sceneActivated",
      "handlerName": "initScene"
    }
  ],
  "evidenceArtifact": "./evidence/event-fire.json"
}
```

## API Reference

### `POST /api/events/register`

Register an event listener. Returns a unique registration ID.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `eventType` | `string` | Yes | One of `sceneActivated`, `keyPress`, `proximity` |
| `handlerName` | `string` | No | Human-readable handler name (defaults to `"handler"`) |
| `targetObjects` | `string[]` | For `proximity` | Object names for proximity detection (exactly 2, must exist in scene) |
| `key` | `string` | For `keyPress` | Key identifier for `keyPress` events (e.g. `"Space"`, `"ArrowUp"`) |
| `threshold` | `number` | No | Distance threshold for `proximity` events (default: `2.0`, must be >0 and ≤1000) |

**Success response (200):**

```json
{
  "registrationId": "evt-1",
  "eventType": "sceneActivated",
  "handlerName": "initScene",
  "evidenceArtifact": "/path/to/evidence/event-register.json"
}
```

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | Server not launched | `{"error": "not launched"}` |
| 400 | Missing `eventType` | `{"error": "eventType is required"}` |
| 400 | Unknown event type | `{"error": "unknown eventType: <type>"}` |
| 400 | `keyPress` without `key` | `{"error": "key is required for keyPress events"}` |
| 400 | `proximity` without valid `targetObjects` | `{"error": "proximity requires targetObjects with exactly 2 entries"}` |
| 400 | `proximity` target object not in scene | `{"error": "unknown object: <name>"}` |
| 400 | `threshold` out of range | `{"error": "threshold must be > 0 and <= 1000"}` |
| 400 | Registration cap reached | `{"error": "registration limit reached (1000)"}` |

**Evidence artifact:** Writes `event-register.json` to the evidence directory.

```json
{
  "schema_version": "eatme.alice-event-register/v1",
  "timestamp": 1715000000000,
  "registration_id": "evt-1",
  "event_type": "sceneActivated",
  "handler_name": "initScene",
  "total_registrations": 1
}
```

### `POST /api/events/fire`

Fire an event. Evaluates all matching registrations and returns which ones
triggered.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `eventType` | `string` | Yes | One of `sceneActivated`, `keyPress`, `proximity` |
| `payload` | `object` | No | Event-specific payload (see below) |

**Payload by event type:**

| Event Type | Payload Fields | Example |
|---|---|---|
| `sceneActivated` | _(none needed)_ | `{}` |
| `keyPress` | `key: string` | `{"key": "Space"}` |
| `proximity` | `sourceObject: string` (optional) | `{"sourceObject": "bunny"}` |

When `sourceObject` is provided for `proximity`, only registrations where one of
`targetObjects` matches are evaluated. When omitted, **all** proximity
registrations are evaluated.

**Success response (200):**

```json
{
  "triggered": [
    {
      "id": "evt-1",
      "eventType": "sceneActivated",
      "handlerName": "initScene"
    }
  ],
  "evidenceArtifact": "/path/to/evidence/event-fire.json"
}
```

The `triggered` array contains every registration that matched. It may be
empty if no registrations match the fired event.

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | Server not launched | `{"error": "not launched"}` |
| 400 | Missing `eventType` | `{"error": "eventType is required"}` |
| 400 | Unknown event type | `{"error": "unknown eventType: <type>"}` |

**Evidence artifact:** Writes `event-fire.json` to the evidence directory.

```json
{
  "schema_version": "eatme.alice-event-fire/v1",
  "timestamp": 1715000000000,
  "event_type": "sceneActivated",
  "registrations_evaluated": 1,
  "triggered_count": 1,
  "triggered": ["evt-1"]
}
```

## Event Type Details

### Scene Activated

The simplest event type. Every `sceneActivated` registration triggers
unconditionally when a `sceneActivated` event is fired.

```bash
# Register
curl -X POST http://localhost:3000/api/events/register \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated", "handlerName": "initWorld"}'

# Fire — always triggers all sceneActivated registrations
curl -X POST http://localhost:3000/api/events/fire \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated"}'
```

### Key Press

Registers a handler for a specific keyboard key. When fired, only registrations
whose `key` matches `payload.key` will trigger.

```bash
# Register for Space key
curl -X POST http://localhost:3000/api/events/register \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "keyPress", "handlerName": "onJump", "key": "Space"}'

# Fire Space — triggers onJump
curl -X POST http://localhost:3000/api/events/fire \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "keyPress", "payload": {"key": "Space"}}'

# Fire ArrowUp — does NOT trigger onJump
curl -X POST http://localhost:3000/api/events/fire \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "keyPress", "payload": {"key": "ArrowUp"}}'
```

### Proximity

Detects when two scene objects are within a distance threshold of each other.
Uses Euclidean distance in 3D space.

**Registration** requires `targetObjects` — an array of exactly two object
names that must exist in the scene. The optional `threshold` defaults to `2.0`.

**Firing** with `payload.sourceObject` checks all proximity registrations
where one of the `targetObjects` matches the source, computing the Euclidean
distance between the two target objects' positions:

```
distance = √((x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²)
```

If `distance ≤ threshold`, the registration triggers.

```bash
# Add objects to the scene first
curl -X POST http://localhost:3000/api/scene/add-object \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"className": "org.lgna.story.SBiped", "name": "bunny"}'

curl -X POST http://localhost:3000/api/scene/add-object \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"className": "org.lgna.story.SBiped", "name": "cat"}'

# Register proximity detection between bunny and cat
curl -X POST http://localhost:3000/api/events/register \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "eventType": "proximity",
    "handlerName": "onMeet",
    "targetObjects": ["bunny", "cat"],
    "threshold": 3.0
  }'

# Fire proximity — evaluates distance between bunny and cat
curl -X POST http://localhost:3000/api/events/fire \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "proximity", "payload": {"sourceObject": "bunny"}}'
```

Both objects start at position `{x: 0, y: 0, z: 0}` by default, so their
distance is 0 and the registration triggers immediately.

## Object Positions

Scene objects track 3D position as `{x, y, z}`. Default-seeded objects
(`ground`, `camera`) and newly added objects all start at `{x: 0, y: 0, z: 0}`.

> **Note:** There is currently no API endpoint to update object positions.
> All objects start at the origin, so proximity events will always trigger
> (distance = 0). A future `POST /api/scene/set-position` endpoint can
> extend this when position-setting is needed for tests.

Position is used exclusively by the proximity event system for distance
calculations. The position field is part of the internal `SceneObject` type:

```typescript
interface SceneObject {
  name: string;
  className: string;
  position: { x: number; y: number; z: number };
}
```

## Multiple Registrations

You can register multiple handlers for the same event type. Each gets a unique
ID and is evaluated independently:

```bash
# Register two sceneActivated handlers
curl -X POST http://localhost:3000/api/events/register \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated", "handlerName": "setupLights"}'
# → {"registrationId": "evt-1", ..., "handlerName": "setupLights", "evidenceArtifact": "..."}

curl -X POST http://localhost:3000/api/events/register \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated", "handlerName": "setupCamera"}'
# → {"registrationId": "evt-2", ..., "handlerName": "setupCamera", "evidenceArtifact": "..."}

# Fire — both trigger
curl -X POST http://localhost:3000/api/events/fire \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sceneActivated"}'
# → {"triggered": [
#      {"id": "evt-1", "eventType": "sceneActivated", "handlerName": "setupLights"},
#      {"id": "evt-2", "eventType": "sceneActivated", "handlerName": "setupCamera"}
#    ], "evidenceArtifact": "..."}
```

## Registration Limits

A maximum of 1000 event registrations are allowed per server session to prevent
memory exhaustion. Attempting to register beyond this cap returns 400:

```json
{"error": "registration limit reached (1000)"}
```

## Proof Artifact Schemas

Two evidence artifacts are produced, following the same `writeAtomically` +
`schema_version` pattern as all other evidence files:

| Artifact | Schema Version | Written By |
|---|---|---|
| `event-register.json` | `eatme.alice-event-register/v1` | `POST /api/events/register` |
| `event-fire.json` | `eatme.alice-event-fire/v1` | `POST /api/events/fire` |

## Error Handling

All event endpoints enforce the same validation pattern:

1. **Launch check** — 400 `"not launched"` if `POST /api/launch` hasn't been called
2. **Required fields** — 400 if `eventType` is missing
3. **Type whitelist** — 400 if `eventType` is not one of the three supported types
4. **Type-specific fields** — 400 if `key` missing for `keyPress`, or `targetObjects` invalid for `proximity`
5. **Object existence** — 400 if `proximity` `targetObjects` reference unknown scene objects
6. **Threshold bounds** — 400 if `threshold` is ≤0 or >1000 (register only)
7. **Capacity** — 400 if registration count exceeds 1000 (register only)
