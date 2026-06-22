---
title: "Alice evidence artifact API"
description: TypeScript and JSON contract for browser-created Alice visible-behavior evidence artifacts.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: reference
---

# Alice evidence artifact API

Alice browser evidence files are JSON artifacts created from visible scene
behavior. They are designed for reliable browser export and test verification,
not media capture or tamper-proof proof.

## TypeScript module

The pure browser-safe helpers live in `src/alice-evidence-artifact.ts` and are
also exported from the root Alice API as `AliceEvidenceArtifact`.

```typescript
import { AliceEvidenceArtifact } from "alice-web";

const artifact = AliceEvidenceArtifact.createAliceEvidenceArtifact(input);
const json = AliceEvidenceArtifact.serializeAliceEvidenceArtifact(artifact);
const result = AliceEvidenceArtifact.validateAliceEvidenceArtifact(JSON.parse(json));
```

`validateAliceEvidenceArtifact` returns `{ valid: boolean; errors: string[] }`.
Callers should check `valid` before exporting or trusting metadata.

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

Optional native sharing uses the same core shape with
`export.method: "native-share"` and `export.share`:

```json
{
  "available": true,
  "outcome": "prepared"
}
```

Share outcomes are `prepared`, `completed`, or `unavailable`.

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
| Size | Object evidence is bounded to 200 entries |

The artifact does not include secrets, absolute paths, hostnames, environment
values, full project data, image bytes, screenshots, or `data:` URLs.

## Serialization

`serializeAliceEvidenceArtifact` emits deterministic pretty JSON with two-space
indentation and one trailing newline. This makes downloaded files easy to inspect
and stable in tests.

## Related docs

- [Alice evidence workflow usage](./alice-evidence-workflow-usage.md)
- [Alice evidence workflow configuration](./alice-evidence-workflow-configuration.md)
- [Tutorial: Capture and export Alice evidence](./tutorial-alice-evidence-workflow.md)
