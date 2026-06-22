---
title: "Alice evidence workflow configuration"
description: Configuration defaults and operational rules for browser-created Alice evidence files.
last_updated: 2026-06-22
review_schedule: quarterly
doc_type: reference
---

# Alice evidence workflow configuration

The Alice evidence workflow runs in the browser. It does not require server
storage, uploads, authentication changes, telemetry, or database configuration.

## Required setup

Use the existing project scripts:

```bash
npm install
NODE_OPTIONS=--max-old-space-size=32768 npm run build
npm run dev
```

## Browser defaults

| Setting | Value |
| --- | --- |
| Evidence panel | Alice browser sidebar |
| Required user action | Capture, export, and share each require a button selection |
| Stable export path | JSON download |
| Optional share path | Native browser file sharing |
| MIME type | `application/json` |
| File extension | `.json` |
| Max filename length | 120 characters |
| Object evidence limit | 200 objects |
| Blob URL lifecycle | Revoked after download starts |

World names, object names, run IDs, timestamps, and filenames are treated as
user-controlled text and rendered with text content.

## Captured data limits

Alice captures bounded visible-scene evidence:

| Evidence area | Captured |
| --- | --- |
| World | Name, Alice version, object count |
| Run | Generated run ID and capture timestamp |
| Viewport | Width, height, snapshot availability metadata |
| Camera | Mode, position, target |
| Objects | Name, type name, visibility, position |

Alice does not capture secrets, environment values, absolute paths, hostnames,
dependency versions, full project dumps, screenshots, image bytes, or media
files.

## Validation commands

Use the configured project validation with the saved Node memory preference:

```bash
NODE_OPTIONS=--max-old-space-size=32768 npm run build
NODE_OPTIONS=--max-old-space-size=32768 npm run build:server
NODE_OPTIONS=--max-old-space-size=32768 npm test
NODE_OPTIONS=--max-old-space-size=32768 npm run test:gadugi
NODE_OPTIONS=--max-old-space-size=32768 npm run test:e2e
NODE_OPTIONS=--max-old-space-size=32768 npm run test:coverage
```

If a pre-commit configuration file is present, run `pre-commit run --all-files`
before handoff.

## Related docs

- [Alice evidence workflow usage](./alice-evidence-workflow-usage.md)
- [Alice evidence artifact API](./alice-evidence-artifact-api.md)
- [Tutorial: Capture and export Alice evidence](./tutorial-alice-evidence-workflow.md)
