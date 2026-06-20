# Getting started

Use this guide when you want a clean local setup for the Alice browser app and
REST API server.

## What you need

- Node.js
- npm
- A checkout of this repository

## Install dependencies

```bash
npm install
```

## Build the browser app

```bash
npm run build
```

## Run tests

```bash
npm test
```

## Start the browser development server

```bash
npm run dev
```

Vite prints the local URL after it starts.

## Start the REST API server

First build the server bundle:

```bash
npm run build:server
```

Then start it with the built-in CLI:

```bash
export ALICE_LOCAL_API_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"
npm run serve -- --api-token "$ALICE_LOCAL_API_TOKEN"
```

The default CLI port is `3000`.

## Start the server for `eatme`

The `eatme` web-platform tests use `http://localhost:3099` unless you set a
different API URL. This command starts Alice on that port:

```bash
npm run serve -- --port 3099 --evidence-dir ./evidence --api-token "$ALICE_LOCAL_API_TOKEN"
```

Check that the server is up:

```bash
curl http://127.0.0.1:3099/api/health
```

Expected response shape:

```json
{
  "status": "running",
  "launched": false,
  "runtime": "alice-web"
}
```

The `runtime` value is the Alice web runtime identity.

## Common local commands

| Task | Command |
| --- | --- |
| Install packages | `npm install` |
| Build browser app | `npm run build` |
| Build API server | `npm run build:server` |
| Run tests | `npm test` |
| Start browser dev server | `npm run dev` |
| Start API server | `npm run serve -- --api-token "$ALICE_LOCAL_API_TOKEN"` |
| Start API server on eatme's default port | `npm run serve -- --port 3099 --evidence-dir ./evidence --api-token "$ALICE_LOCAL_API_TOKEN"` |
