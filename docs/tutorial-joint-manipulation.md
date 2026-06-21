---
title: Tutorial: manipulate and verify joints
description: Create object joints, pose a biped, animate a joint array, persist state, and verify runtime evidence.
last_updated: 2026-06-21
review_schedule: quarterly
doc_type: tutorial
---

# Tutorial: manipulate and verify joints

This walkthrough uses Alice web server APIs to create a custom jointed object,
pose an `SBiped`, animate a biped joint array, persist state to
`alice-web/joint-state.json`, and verify the runtime effects through
`/api/world/run`.

For the full contract, see [Joint manipulation](./joint-manipulation.md).

## Prerequisites

```bash
npm install
export NODE_OPTIONS=--max-old-space-size=32768
npm run build:server
```

Start the local server:

```bash
export ALICE_LOCAL_API_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"

npm run serve -- \
  --port 3000 \
  --evidence-dir ./evidence \
  --api-token "$ALICE_LOCAL_API_TOKEN"
```

## 1. Create an Alice project

```bash
curl -X POST http://127.0.0.1:3000/api/project/new \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"templateId":"blank","projectName":"JointParity"}'
```

## 2. Add a biped

```bash
curl -X POST http://127.0.0.1:3000/api/scene/add-object \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"className":"org.lgna.story.SBiped","name":"alice"}'
```

Read the registered biped joint state:

```bash
curl http://127.0.0.1:3000/api/joints/alice
```

The response includes canonical biped joints and built-in arrays such as
`leftArm`.

## 3. Add a custom jointed object

```bash
curl -X POST http://127.0.0.1:3000/api/scene/add-jointed-object \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
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
            "children": [
              {
                "name": "CLAW",
                "parentName": "SHOULDER",
                "localTransform": {
                  "position": { "x": 0, "y": 1, "z": 0 },
                  "orientation": { "x": 0, "y": 0, "z": 0, "w": 1 }
                },
                "children": []
              }
            ]
          }
        ]
      }
    ],
    "jointArrays": [
      { "name": "gripper", "joints": ["CLAW"] }
    ]
  }'
```

Alice writes `./evidence/alice-web/joint-state.json` after the object is added.

## 4. Define or update a joint array

Custom arrays are persisted metadata and can be animated before any pose exists
for the same joints.

```bash
curl -X POST http://127.0.0.1:3000/api/joints/robotArm/arrays \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"arm","joints":["SHOULDER","CLAW"]}'
```

## 5. Pose the biped

```bash
curl -X POST http://127.0.0.1:3000/api/joints/alice/pose \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "poseName": "waveStart",
    "joints": {
      "PELVIS": { "position": { "x": 0, "y": 0.25, "z": 0 } },
      "LEFT_HAND": { "orientation": { "x": 0, "y": 0, "z": 0.707, "w": 0.707 } }
    }
  }'
```

The persisted pose stores `PELVIS` as canonical `PELVIS_LOWER_BODY`.

## 6. Queue a joint-array animation

```bash
curl -X POST http://127.0.0.1:3000/api/joints/alice/animate \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "target": { "jointArray": "leftArm" },
    "durationMs": 750,
    "style": "gentle",
    "evidenceLabel": "wave-left-arm",
    "to": {
      "orientation": { "x": 0, "y": 0, "z": 0.707, "w": 0.707 }
    }
  }'
```

The response lists the concrete joints resolved from `leftArm`.

## 7. Run and verify

```bash
curl -X POST http://127.0.0.1:3000/api/world/run \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

The run response includes `jointAnimations` and `jointVerification` when queued
joint animations execute. The same evidence is written to
`./evidence/run-world-result.json`, and the final joint transforms are written to
`./evidence/alice-web/joint-state.json`.

## 8. Save with sidecar persistence

```bash
curl -X POST http://127.0.0.1:3000/api/project/save \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"saveSelector":"scene.myFirstMethod"}'
```

The project save writes the normal `.a3p` archive and copies joint state to:

```text
./evidence/project-save/alice-web/joint-state.json
```

## Troubleshooting

| Problem | Meaning | Fix |
| --- | --- | --- |
| `Unknown joint names for alice` | A mutating request referenced a joint that is not in the registered hierarchy | Use `GET /api/joints/alice` and retry with a listed joint or supported alias |
| `Unknown joint array for alice` | Animation targeted an array name that is not persisted for the object | Define the array or use a built-in array such as `leftArm` |
| `Missing or invalid local API token` | A mutating route was called without the local token | Include `X-Alice-Local-Api-Token` |

## Related docs

- [Joint manipulation](./joint-manipulation.md)
- [Server API](./server-api.md)
- [Story API](./story-api.md)
- [Animation](./animation.md)
