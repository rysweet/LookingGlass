---
title: Alice evidence API
description: Current TypeScript API for browser-created Alice visible-behavior evidence artifacts.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: reference
---

# Alice evidence API

Alice browser evidence files are JSON artifacts created from visible scene
behavior. The helpers live in `src/alice-evidence-artifact.ts` and are exported
from the root API as `AliceEvidenceArtifact`.

```typescript
import { AliceEvidenceArtifact } from "./src/index.js";

const artifact = AliceEvidenceArtifact.createAliceEvidenceArtifact(input);
const json = AliceEvidenceArtifact.serializeAliceEvidenceArtifact(artifact);
const parsed = AliceEvidenceArtifact.parseAliceEvidenceArtifact(json);
const summary = AliceEvidenceArtifact.summarizeAliceEvidenceArtifact(parsed);
```

## Artifact identity

Every artifact has these exact identity fields:

| Field | Value |
| --- | --- |
| `format` | `alice-visible-behavior-evidence` |
| `version` | `1` |
| `application.name` | `Alice` |
| `application.runtime` | `alice-web` |

Callers do not pass application identity. `createAliceEvidenceArtifact()` sets
it so generated evidence remains Alice / `alice-web`.

## JSON shape

```json
{
  "format": "alice-visible-behavior-evidence",
  "version": 1,
  "application": {
    "name": "Alice",
    "runtime": "alice-web"
  },
  "world": {
    "name": "Program",
    "aliceVersion": "3.10.0.0",
    "objectCount": 2
  },
  "run": {
    "id": "run-2026-06-22T05-19-37-228Z",
    "capturedAt": "2026-06-22T05:19:37.228Z"
  },
  "visibleBehavior": {
    "statusText": "Loaded \"Program\" (v3.10.0.0) - 2 objects.",
    "viewport": {
      "width": 1280,
      "height": 720,
      "canvasSnapshot": {
        "available": false,
        "reason": "structured-scene-metadata",
        "width": 1280,
        "height": 720,
        "mimeType": "image/png"
      }
    },
    "camera": {
      "mode": "orbit",
      "position": { "x": 0, "y": 1.6, "z": 6 },
      "target": { "x": 0, "y": 1, "z": 0 }
    },
    "objects": [
      {
        "name": "alice",
        "typeName": "org.lgna.story.SBiped",
        "visible": true,
        "position": { "x": 0, "y": 0, "z": 0 }
      }
    ]
  },
  "export": {
    "method": "download",
    "requestedAt": "2026-06-22T05:19:38.000Z",
    "filename": "program-alice-evidence.json",
    "mimeType": "application/json"
  }
}
```

Native sharing uses `export.method: "native-share"` and attaches
`export.share`. `export.share.artifactHash` is a SHA-256 digest of the canonical
serialized artifact before `export.share` is attached.

```json
{
  "available": true,
  "outcome": "prepared",
  "title": "Alice evidence for Program",
  "summary": "Alice alice-web evidence for Program: 1 capture, 2 objects.",
  "artifactHash": "sha256:0123456789abcdef...",
  "preparedAt": "2026-06-22T05:19:39.000Z"
}
```

## Helpers

| Helper | Behavior |
| --- | --- |
| `createAliceEvidenceArtifact(input)` | Normalizes input, sets Alice identity, bounds visible objects, and returns an artifact |
| `validateAliceEvidenceArtifact(value)` | Returns `{ valid, errors }` without throwing |
| `serializeAliceEvidenceArtifact(artifact)` | Validates and emits deterministic pretty JSON with a trailing newline |
| `parseAliceEvidenceArtifact(json)` | Parses JSON and throws `AliceEvidenceArtifactError` if invalid |
| `summarizeAliceEvidenceArtifact(artifact)` | Returns safe plain-text summary fields for UI or logs |
| `prepareAliceEvidenceShare(artifact, input?)` | Replaces stale share metadata, hashes the pre-share artifact, and validates the result |

## Validation rules

| Area | Rule |
| --- | --- |
| Identity | `application.name` is `Alice`; `application.runtime` is `alice-web` |
| Format | `format` is `alice-visible-behavior-evidence`; `version` is `1` |
| World | Name and Alice version are non-empty; object count is positive |
| Run | ID is non-empty; capture time parses as a timestamp |
| Visible behavior | Status, viewport, camera, and at least one object are required |
| Objects | Name, type name, visibility, and finite position values are required |
| Export | Method is `download` or `native-share`; filename is a safe `.json` name; MIME type is `application/json` |
| Share | Outcome is `prepared`, `completed`, or `unavailable`; hash is `sha256:` plus 64 lowercase hex characters |

Artifacts do not include secrets, local absolute paths, full project bytes,
image bytes, screenshots, or `data:` URLs. Browser code renders summaries with
text APIs.

## Related docs

- [Alice evidence export workflow](./alice-evidence-workflow.md)
- [Alice evidence workflow usage](./alice-evidence-workflow-usage.md)
- [Alice identity boundary](./alice-identity-boundary.md)
- [Project IO usage guide](./project-io-usage.md)
