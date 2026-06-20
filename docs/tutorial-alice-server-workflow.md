# Tutorial: Verify a local Alice server

This tutorial walks through building the API server, starting it on
the `eatme` default port, checking the runtime identity, creating a project, and
saving evidence artifacts.

## What you need

- Node.js
- npm
- curl
- A checkout of `rysweet/alice-web-prototype`

## 1. Build the server

```bash
npm install
NODE_OPTIONS=--max-old-space-size=32768 npm run build:server
```

## 2. Start Alice

Start the local server on port `3099`, which is the default port used by the
`eatme` web-platform scenarios:

```bash
export ALICE_LOCAL_API_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"
npm run serve -- --port 3099 --evidence-dir ./evidence --api-token "$ALICE_LOCAL_API_TOKEN"
```

Keep this terminal open. Use a second terminal for the API requests below. In
that second terminal, export the same local token value:

```bash
export ALICE_LOCAL_API_TOKEN="<same value used to start alice-web>"
```

The installed or linked equivalent is `alice-web serve --port 3099 --evidence-dir ./evidence --api-token "$ALICE_LOCAL_API_TOKEN"`.

## 3. Check the runtime identity

```bash
curl http://127.0.0.1:3099/api/health
```

Expected response shape:

```json
{
  "status": "running",
  "launched": false,
  "pid": 12345,
  "uptime": 1.25,
  "runtime": "alice-web"
}
```

The `pid` and `uptime` values are different on every run. The stable identity
field is `runtime`.

## 4. Create a project

Create a project from the Snow template:

```bash
curl -X POST http://127.0.0.1:3099/api/project/new \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"templateId":"snow","projectName":"WinterStory"}'
```

Expected response shape:

```json
{
  "schema_version": "eatme.alice-project-new-result/v1",
  "status": "created",
  "templateId": "snow",
  "projectName": "WinterStory",
  "projectPath": "evidence/project-new/WinterStory.a3p",
  "sceneObjectCount": 4,
  "a3pSizeBytes": 1284
}
```

The `eatme.alice-*` schema namespace stays unchanged because it is the external
test harness contract.

## 5. Save the project

```bash
curl -X POST http://127.0.0.1:3099/api/project/save \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"saveSelector":"scene.myFirstMethod"}'
```

The evidence directory now contains Alice-generated proof artifacts and
`.a3p` project output:

```text
evidence/
`-- project-save/
    |-- desktop-save-operation-result.json
    `-- saved-project.a3p
```

Use [Alice identity boundary](./alice-identity-boundary.md) for the complete product, CLI, runtime, storage-key, env-var, API header, and metadata contract.
