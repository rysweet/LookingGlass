---
title: "Alice evidence workflow usage"
description: Browser workflow for capturing visible Alice behavior and exporting a JSON evidence artifact.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: how-to
---

# Alice evidence workflow usage

Alice can capture visible browser scene behavior into a JSON evidence artifact.
The stable path is a deterministic download. Native browser sharing is available
only when the browser supports sharing files.

## Browser flow

1. Open an Alice world in the browser.
2. Make visible behavior appear in the scene, such as loading objects or moving
   the camera.
3. Select **Capture visible behavior**.
4. Review the evidence status and summary.
5. Select **Export evidence** to download the JSON artifact.

The browser validates the artifact before export. If validation fails, Alice
shows an evidence status message and does not create a success-shaped file.

## Evidence file contents

The exported JSON includes:

| Area | Fields |
| --- | --- |
| Identity | `application.name: "Alice"`, `application.runtime: "alice-web"` |
| Format | `format: "alice-visible-behavior-evidence"`, `version: 1` |
| World | World name, Alice version, object count |
| Run | Run ID and capture timestamp |
| Visible behavior | Status text, viewport metadata, camera metadata, bounded object summaries |
| Export | Download/native-share method, timestamp, filename, MIME type |

Canvas evidence is metadata only. The artifact does not embed screenshots, image
bytes, media files, or `data:` URLs.

## Export

Select **Export evidence** after capture. Alice downloads a safe `.json` file
with Alice identity in the filename, for example:

```text
program-alice-evidence.json
```

Filenames are normalized to lowercase letters, numbers, dots, and hyphens, then
bounded to 120 characters.

## Share

Select **Share evidence** after capture when native sharing is available. Alice
creates a validated JSON file and passes it to the browser share prompt. If the
browser cannot share files, Alice keeps export available and shows a status
message.

Sharing does not upload the file to an Alice server or third-party service.

## Stable browser selectors

| Selector | Purpose |
| --- | --- |
| `[data-testid="alice-evidence-panel"]` | Evidence workflow panel |
| `[data-testid="alice-evidence-status"]` | Evidence status text |
| `[data-testid="alice-evidence-capture-button"]` | Captures visible behavior |
| `[data-testid="alice-evidence-export-button"]` | Downloads the evidence JSON file |
| `[data-testid="alice-evidence-share-button"]` | Uses native browser sharing when available |
| `[data-testid="alice-evidence-summary"]` | Shows captured/exported object details |

## Related docs

- [Alice evidence artifact API](./alice-evidence-artifact-api.md)
- [Alice evidence workflow configuration](./alice-evidence-workflow-configuration.md)
- [Tutorial: Capture and export Alice evidence](./tutorial-alice-evidence-workflow.md)
