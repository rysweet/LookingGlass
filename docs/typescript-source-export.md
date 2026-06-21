# TypeScript source export

This reference describes the Alice TypeScript source export feature. It turns
the current Alice project into a downloadable source handoff: readable `.ts`
files, project metadata, a minimal package, and a ZIP archive that can be
inspected outside the running Alice server.

## Identity

Alice is the product and runtime identity. The archive, package metadata,
manifest, README, API response headers, and generated source use Alice /
`alice-web` branding.

LookingGlass is only the repository/project nickname. It can appear in
repository-level documentation, but it must not be used as the product name,
package name, API identity, archive metadata, or generated source identity.

## Server route

```http
GET /api/projects/current/export/typescript
```

Example download:

```bash
curl -fS http://127.0.0.1:3000/api/projects/current/export/typescript \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -o alice-web-typescript-source.zip
```

The route exports the same current project state used by save and run flows. If
a session starts from an `.a3p` file and then receives live API edits, the export
includes both the parsed project data and live server-side scene/code edits.

Successful responses are ZIP downloads:

```http
HTTP/1.1 200 OK
Content-Type: application/zip
Content-Disposition: attachment; filename="alice-web-typescript-source.zip"
Cache-Control: no-store
```

If no project has been launched or created, the route returns the normal server
error shape:

```json
{ "error": "Not launched. Call POST /api/launch first before exporting the current project." }
```

## Archive layout

Every entry is rooted under `alice-web-typescript-source/`. Entries are written
with normalized POSIX paths. The exporter rejects empty archives, duplicate
entries, absolute paths, backslashes, Windows drive paths, and traversal
segments.

```text
alice-web-typescript-source/
  README.md
  manifest.json
  package.json
  tsconfig.json
  src/
    project.ts
    runtime.ts
    scene.ts
    procedures/
      myFirstMethod.ts
```

| Entry | Purpose |
| --- | --- |
| `README.md` | Human-readable handoff guide for the generated package |
| `manifest.json` | Machine-readable Alice export metadata |
| `package.json` | Minimal `alice-web-typescript-source` package metadata |
| `tsconfig.json` | Strict TypeScript compile settings for the generated source |
| `src/project.ts` | Project-level constants and assembly helpers |
| `src/scene.ts` | Scene object declarations and initial scene structure |
| `src/procedures/*.ts` | Generated procedure/function source |
| `src/runtime.ts` | Small typed runtime shim and `UnsupportedAliceRuntimeBehavior` |

The archive does not contain local filesystem paths, environment variables,
request headers, access tokens, stack traces, or machine metadata.

## Manifest contract

`manifest.json` is deterministic for the same project state and exporter
version. Dynamic values such as wall-clock timestamps are not included.

```json
{
  "schemaVersion": "alice-web.typescript-source-manifest/v1",
  "product": "alice-web",
  "runtime": "Alice",
  "projectName": "WinterStory",
  "entryPoint": "src/project.ts",
  "files": [
    "src/project.ts",
    "src/runtime.ts",
    "src/scene.ts",
    "src/procedures/myFirstMethod.ts"
  ],
  "sourceFileCount": 4,
  "sceneObjectCount": 3,
  "procedureCount": 1,
  "unsupportedBehaviorCount": 0
}
```

## Generated source style

Generated TypeScript is readable first. It uses stable names, explicit exports,
quoted string data, and sanitized identifiers.

Alice names that are not valid TypeScript identifiers are converted to safe
identifiers. Collisions are resolved deterministically:

| Alice name | Generated identifier |
| --- | --- |
| `bunny` | `bunny` |
| `ice skater` | `iceSkater` |
| `123 robot` | `object123Robot` |
| `class` | `classObject` |
| `class!` when `class` already exists | `classObject2` |

Unsupported statements remain explicit. Generated source imports
`UnsupportedAliceRuntimeBehavior` and throws it for behavior that is not
represented accurately in the TypeScript handoff. This lets the generated
package compile while failing visibly if unsupported Alice runtime behavior is
executed.

## Programmatic APIs

In-process tools that already have an `AliceProject` can use the pure
code-generation API:

```typescript
import {
  generateTypeScriptSource,
  type TypeScriptSourceEntry,
  type TypeScriptSourceManifest,
} from "./src/code-generation.js";

const source = generateTypeScriptSource(project);

for (const entry of source.entries) {
  console.log(entry.path, entry.content.length);
}
```

`generateTypeScriptSource(project)` does not read or write the file system,
mutate server state, inspect environment variables, perform network requests,
execute generated code, or depend on Express.

The source model is packaged by `TypeScriptExporter`:

```typescript
import { TypeScriptExporter } from "./src/project-export.js";

const result = await new TypeScriptExporter().export(project);

console.log(result.archive);  // Uint8Array
console.log(result.manifest); // TypeScriptSourceManifest
```

The server-facing orchestration method returns download metadata:

```typescript
const exported = await projectService.exportTypeScript(state);

response
  .status(200)
  .setHeader("Content-Type", exported.contentType)
  .setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`)
  .setHeader("Cache-Control", "no-store")
  .send(exported.archive);
```

## Configuration

The feature has no separate feature flag. It uses the active Alice server
configuration:

| Configuration | Effect |
| --- | --- |
| `--project <file.a3p>` | Seeds the current project before export when launch uses the configured project |
| `--evidence-dir <dir>` | Used by related save/run evidence flows; the TypeScript export response is downloaded by the client and is not written automatically |
| `--api-token <token>` / `ALICE_LOCAL_API_TOKEN` | Protects CLI-served export requests through `X-Alice-Local-Api-Token` for guarded methods |
| `NODE_OPTIONS=--max-old-space-size=32768` | Recommended for local build/test/export validation on large projects |

## E2E scenario contract

`gadugi/06-typescript-source-export.yaml` verifies the full handoff rather than
checking route existence only. It starts the built server, creates a project,
applies live scene and code edits, downloads the ZIP, opens the archive, and
asserts source contents plus Alice / `alice-web` identity.
