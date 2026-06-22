# Class behavior package configuration

Reusable class behavior import and export use the current Alice server and
Project IO settings. There is no separate feature flag or config file.

## Contents

- [Server settings](#server-settings)
- [Browser settings](#browser-settings)
- [Package limits](#package-limits)
- [Identity requirements](#identity-requirements)
- [Security behavior](#security-behavior)
- [Development memory setting](#development-memory-setting)
- [Related documentation](#related-documentation)

## Server settings

Run the Alice server with the normal local settings:

```bash
export NODE_OPTIONS=--max-old-space-size=32768
export ALICE_LOCAL_API_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"
npm run build:server
npm run serve -- \
  --port 3000 \
  --evidence-dir ./evidence \
  --api-token "$ALICE_LOCAL_API_TOKEN" \
  --project ./fixtures/starter.a3p
```

| Setting | Required | Effect on class behavior packages |
| --- | --- | --- |
| `--port <port>` | no | Chooses the localhost port for the export and import routes |
| `--evidence-dir <dir>` | no | Used by related save and proof workflows; class behavior downloads are returned to the client |
| `--api-token <token>` | yes for guarded local requests | Requires `X-Alice-Local-Api-Token` on export and import requests |
| `--project <file.a3p>` | no | Provides the first current project when the server is started with a project file |
| `NODE_OPTIONS=--max-old-space-size=32768` | no | Recommended for large local validation runs |

The routes use the current project only. They do not accept arbitrary project
paths, remote URLs, or project IDs in the request body.

## Browser settings

No browser configuration is required.

The browser workflow uses:

- the type browser selection for export
- a file picker for `.alice-class-behavior.json` import
- the same conflict strategies as the HTTP API
- text rendering for imported names and error messages

Imported packages are parsed as JSON data. The browser must not execute package
contents.

## Package limits

alice-web enforces these fixed limits before changing project state:

| Limit | Value |
| --- | --- |
| Package JSON | 256 KiB |
| Individual string value | 8,192 characters |
| Fields per class | 200 |
| Methods per class | 200 |
| Constructors per class | 200 |
| Parameters per method or constructor | 200 |
| Statements per statement array | 200 |
| Nested package data depth | 32 |

When a package exceeds a limit, the import must fail before changing the project.

Names for types, fields, methods, constructors, and parameters must start with a
letter or underscore and then use only letters, numbers, or underscores.

## Identity requirements

Package identity must use Alice / `alice-web` values:

```json
{
  "kind": "alice-web.reusable-class-behavior",
  "version": 1,
  "exportedBy": "alice-web"
}
```

Generated filenames use the selected class name plus the package extension:

```text
SpinnerBehavior.alice-class-behavior.json
```

Filenames are sanitized for download headers. The package identity is not taken
from repository nicknames, local directory names, or machine settings.

## Security behavior

Class behavior packages are untrusted input.

alice-web applies these rules before import:

- parse JSON with validation before changing project state
- reject unsupported `kind`, `version`, or `exportedBy` values
- reject unsafe object keys: `__proto__`, `prototype`, and `constructor`
- reject unsafe names, oversized values, oversized arrays, and excessive nesting
- render class names and errors as text in the browser
- avoid logging full method bodies
- preserve method bodies as data instead of evaluating them

Use `reject` conflict handling when an automated workflow must avoid any
overwrite or rename.

## Development memory setting

Large local test runs should use the saved Node.js heap setting:

```bash
export NODE_OPTIONS=--max-old-space-size=32768
npm test
npm run build
npm run build:server
```

This setting helps local validation. Package parsing and import do not read
`NODE_OPTIONS`.

## Related documentation

- [Reusable class behavior workflow](./class-behavior-workflow.md)
- [Class behavior package API](./class-behavior-package-api.md)
- [Reuse class behavior between Alice projects](./tutorial-reuse-class-behavior-between-projects.md)
- [Project IO configuration](./project-io-configuration.md)

Last updated for reusable Alice class behavior packages.
