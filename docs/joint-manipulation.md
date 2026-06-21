---
title: Joint manipulation
description: Alice object joints, biped joints, joint arrays, poses, animation, persistence, and runtime verification.
last_updated: 2026-06-21
review_schedule: quarterly
doc_type: reference
---

# Joint manipulation

Alice web exposes joint manipulation through the TypeScript Story API, the
`JointSystem.JointStateStore`, and local server routes. Product-facing names
remain Alice and `alice-web`; LookingGlass is only the repository nickname.

For a runnable walkthrough, see
[Tutorial: manipulate and verify joints](./tutorial-joint-manipulation.md).

## TypeScript APIs

```typescript
import { JointSystem, StoryApi } from "alice-web";

const alice = new StoryApi.SBiped("alice");

alice.getJointId("PELVIS");
// { name: "PELVIS_LOWER_BODY", parent: "ROOT" }

alice.getJointId("LEFT_TENTACLE");
// undefined

alice.strikePose({
  PELVIS: { position: { x: 0, y: 0.25, z: 0 } },
  LEFT_HAND: { orientation: { x: 0, y: 0, z: 0.707, w: 0.707 } },
});

const jointState = new JointSystem.JointStateStore();

jointState.registerObject({
  objectName: "alice",
  className: "org.lgna.story.SBiped",
  hierarchy: alice.getJointHierarchy(),
});

jointState.applyPose({
  objectName: "alice",
  poseName: "waveStart",
  joints: {
    PELVIS: { position: { x: 0, y: 0.25, z: 0 } },
    LEFT_HAND: { orientation: { x: 0, y: 0, z: 0.707, w: 0.707 } },
  },
});

jointState.queueAnimation({
  objectName: "alice",
  target: { jointArray: "leftArm" },
  durationMs: 750,
  style: "gentle",
  evidenceLabel: "wave-left-arm",
  to: { orientation: { x: 0, y: 0, z: 0.707, w: 0.707 } },
});
```

Read APIs such as `getJoint()`, `getJointId()`, and Java-style accessors return
`undefined` for unknown joints. Mutating APIs such as `strikePose()`,
`JointStateStore.applyPose()`, and animation queueing throw clear errors for
unknown joints and leave state unchanged.

## Biped aliases and arrays

`SBiped` normalizes these aliases when posing or persisting state:

| Alias | Canonical joint |
| --- | --- |
| `PELVIS` | `PELVIS_LOWER_BODY` |
| `SPINE` | `SPINE_BASE` |
| `CHEST` | `SPINE_UPPER` |

`JointStateStore` materializes built-in biped arrays when an `SBiped` is
registered:

| Array | Joints |
| --- | --- |
| `leftArm` | `LEFT_CLAVICLE`, `LEFT_SHOULDER`, `LEFT_ELBOW`, `LEFT_WRIST`, `LEFT_HAND` |
| `rightArm` | `RIGHT_CLAVICLE`, `RIGHT_SHOULDER`, `RIGHT_ELBOW`, `RIGHT_WRIST`, `RIGHT_HAND` |
| `leftLeg` | `LEFT_HIP`, `LEFT_KNEE`, `LEFT_ANKLE`, `LEFT_FOOT` |
| `rightLeg` | `RIGHT_HIP`, `RIGHT_KNEE`, `RIGHT_ANKLE`, `RIGHT_FOOT` |
| `spine` | `SPINE_BASE`, `SPINE_MIDDLE`, `SPINE_UPPER`, `NECK`, `HEAD` |

Joint arrays are persisted metadata. Animation resolves an array from metadata,
so joints do not need existing pose entries before the array can animate.

## HTTP API

Mutating routes use the same local API protection as the rest of the Alice
server: `Content-Type: application/json` and `X-Alice-Local-Api-Token`.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/scene/add-object` | `POST` | Adds normal scene objects; jointed Story API classes such as `SBiped` are registered in joint state automatically |
| `/api/scene/add-jointed-object` | `POST` | Adds a custom object with an explicit joint hierarchy and optional arrays |
| `/api/joints/:objectName` | `GET` | Reads persisted joint state for one object |
| `/api/joints/:objectName/arrays` | `POST` | Defines or replaces a persisted joint array |
| `/api/joints/:objectName/pose` | `POST` | Applies a pose and optionally stores it by name |
| `/api/joints/:objectName/animate` | `POST` | Queues animation for one joint or one joint array |
| `/api/world/run` | `POST` | Executes queued joint animations and reports verification evidence |

Custom object request:

```json
{
  "name": "robotArm",
  "className": "org.lgna.story.SProp",
  "joints": [
    {
      "name": "ROOT",
      "parentName": null,
      "localTransform": {
        "position": { "x": 0, "y": 0, "z": 0 },
        "orientation": { "x": 0, "y": 0, "z": 0, "w": 1 }
      },
      "children": [
        {
          "name": "SHOULDER",
          "parentName": "ROOT",
          "localTransform": {
            "position": { "x": 0, "y": 1, "z": 0 },
            "orientation": { "x": 0, "y": 0, "z": 0, "w": 1 }
          },
          "children": []
        }
      ]
    }
  ],
  "jointArrays": [
    { "name": "arm", "joints": ["SHOULDER"] }
  ]
}
```

Animation request:

```json
{
  "target": { "jointArray": "leftArm" },
  "durationMs": 750,
  "style": "gentle",
  "evidenceLabel": "wave-left-arm",
  "to": {
    "orientation": { "x": 0, "y": 0, "z": 0.707, "w": 0.707 }
  }
}
```

Unknown mutating joints fail with a `400` response and do not alter the sidecar:

```json
{
  "error": "Unknown joint names for alice",
  "objectName": "alice",
  "unknownJoints": ["LEFT_TENTACLE"],
  "availableJoints": ["ROOT", "PELVIS_LOWER_BODY", "LEFT_HIP"]
}
```

## Persistence

Joint state is written as a sidecar under the configured evidence directory:

```text
alice-web/joint-state.json
```

`POST /api/project/save` copies the current sidecar into the save evidence
directory:

```text
project-save/alice-web/joint-state.json
```

The sidecar is not embedded in the `.a3p` archive. That preserves Alice 3
project compatibility while giving the web runtime durable joint metadata.

Sidecar shape:

```json
{
  "schema_version": "alice.joint-state/v1",
  "runtime": "alice-web",
  "objects": {
    "alice": {
      "className": "org.lgna.story.SBiped",
      "joints": {
        "LEFT_HAND": {
          "parentName": "LEFT_WRIST",
          "bindTransform": {
            "position": { "x": 0, "y": 0, "z": 0 },
            "orientation": { "x": 0, "y": 0, "z": 0, "w": 1 }
          },
          "currentTransform": {
            "position": { "x": 0, "y": 0, "z": 0 },
            "orientation": { "x": 0, "y": 0, "z": 0.707, "w": 0.707 }
          }
        }
      },
      "jointArrays": {
        "leftArm": ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"]
      },
      "poses": {
        "waveStart": {
          "PELVIS_LOWER_BODY": { "position": { "x": 0, "y": 0.25, "z": 0 } },
          "LEFT_HAND": { "orientation": { "x": 0, "y": 0, "z": 0.707, "w": 0.707 } }
        }
      },
      "pendingAnimations": []
    }
  }
}
```

## Runtime verification

`POST /api/world/run` executes queued joint animations, applies final transforms
to persisted joint state, clears executed animations, and writes runtime
evidence. When joint animations execute, the run response includes:

```json
{
  "runtime": "alice-web",
  "jointAnimations": [
    {
      "objectName": "alice",
      "target": { "jointArray": "leftArm" },
      "resolvedJoints": ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
      "durationMs": 750,
      "status": "executed",
      "evidenceLabel": "wave-left-arm"
    }
  ],
  "jointVerification": {
    "status": "verified",
    "sidecarArtifact": "evidence/alice-web/joint-state.json",
    "objects": {
      "alice": {
        "verifiedArrays": ["leftArm"],
        "verifiedJoints": ["LEFT_CLAVICLE", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST", "LEFT_HAND"],
        "finalPose": {
          "LEFT_HAND": {
            "orientation": { "x": 0, "y": 0, "z": 0.707, "w": 0.707 }
          }
        }
      }
    }
  }
}
```

## Related docs

- [Tutorial: manipulate and verify joints](./tutorial-joint-manipulation.md)
- [Story API](./story-api.md)
- [Server API](./server-api.md)
- [Animation](./animation.md)
