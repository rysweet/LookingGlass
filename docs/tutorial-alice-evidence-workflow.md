---
title: "Tutorial: Capture and export Alice evidence"
description: Hands-on walkthrough for capturing visible Alice behavior, exporting evidence, and checking artifact metadata.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: tutorial
---

# Tutorial: Capture and export Alice evidence

This walkthrough captures visible behavior from an Alice world, exports a JSON
evidence artifact, and checks the file metadata.

## 1. Start Alice

```bash
npm install
NODE_OPTIONS=--max-old-space-size=32768 npm run build
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

## 2. Open a world

Use the browser file control to open an `.a3p` Alice world. The scene view should
show the world canvas and the Alice controls.

## 3. Capture visible behavior

Make visible behavior appear in the browser scene, then select **Capture visible
behavior**. Alice shows a status message and a summary with the captured object
count.

The capture is structured scene evidence. It is not a video file and does not
use browser media APIs.

## 4. Export evidence

Select **Export evidence**. Alice validates the artifact and downloads a JSON
file such as:

```text
program-alice-evidence.json
```

## 5. Check metadata

Save the downloaded filename in a shell variable:

```bash
export ALICE_EVIDENCE_FILE="$HOME/Downloads/program-alice-evidence.json"
```

Print the key metadata:

```bash
node -e '
const fs = require("fs");
const artifact = JSON.parse(fs.readFileSync(process.env.ALICE_EVIDENCE_FILE, "utf8"));
console.log({
  application: artifact.application.name,
  runtime: artifact.application.runtime,
  format: artifact.format,
  version: artifact.version,
  worldName: artifact.world.name,
  aliceVersion: artifact.world.aliceVersion,
  runId: artifact.run.id,
  capturedAt: artifact.run.capturedAt,
  exportMethod: artifact.export.method,
  filename: artifact.export.filename,
  objectCount: artifact.world.objectCount,
  visibleObjects: artifact.visibleBehavior.objects.length,
  snapshotAvailable: artifact.visibleBehavior.viewport.canvasSnapshot.available
});
'
```

Expected output shape:

```json
{
  "application": "Alice",
  "runtime": "alice-web",
  "format": "alice-visible-behavior-evidence",
  "version": 1,
  "worldName": "Program",
  "aliceVersion": "3.10.0.0",
  "runId": "run-2026-06-22T05-19-37-228Z",
  "capturedAt": "2026-06-22T05:19:37.228Z",
  "exportMethod": "download",
  "filename": "program-alice-evidence.json",
  "objectCount": 2,
  "visibleObjects": 2,
  "snapshotAvailable": false
}
```

The timestamp, run ID, world name, and object count vary by world. The identity,
format, version, export method, and JSON structure stay consistent for valid
Alice evidence.

## 6. Share when available

If **Share evidence** is available, select it to use the native browser share
prompt. If sharing is unavailable, export remains the supported path.

## Related docs

- [Alice evidence workflow usage](./alice-evidence-workflow-usage.md)
- [Alice evidence artifact API](./alice-evidence-artifact-api.md)
- [Alice evidence workflow configuration](./alice-evidence-workflow-configuration.md)
