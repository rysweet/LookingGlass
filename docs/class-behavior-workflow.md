# Reusable class behavior workflow

Use reusable class behavior packages to move one modified Alice class from the
current project into another Alice project.

alice-web uses `.alice-class-behavior.json` files. Each package stores one
`AliceTypeDefinition`, which is the same project type data Alice reads and writes
inside `.a3p` projects.

## Contents

- [When to use this workflow](#when-to-use-this-workflow)
- [Scope and dependency limits](#scope-and-dependency-limits)
- [Browser workflow](#browser-workflow)
- [Command line workflow](#command-line-workflow)
- [Conflict handling](#conflict-handling)
- [What is preserved](#what-is-preserved)
- [Safe package handling](#safe-package-handling)
- [Troubleshooting](#troubleshooting)
- [Related documentation](#related-documentation)

## When to use this workflow

Use this workflow when a project contains a reusable modified class and another
project should receive the same behavior. Common examples include:

- a custom character class with helper methods
- a scene object class with setup fields and constructors
- a classroom starter behavior that students reuse across projects

This workflow exports one class behavior at a time. To move a complete project,
use normal `.a3p` save and open workflows instead.

## Scope and dependency limits

The package contains one entry from `AliceProject.types`. It does not include
scene objects, resource files, project-level methods, referenced external types,
or dependent classes.

These values are preserved as data but may not resolve in the receiving project:

- method and constructor statement references
- field initializer references
- superclass names
- field `typeName` and `resourceType` values
- parameter and return type names
- references to the original class name after a renamed import

Use a full project save when a reusable behavior depends on scene placement,
resources, or multiple coordinated classes.

## Browser workflow

### Export a class behavior

1. Open the source project.
2. In **Class Behaviors**, select the reusable class behavior.
3. Choose **Export class behavior**.
5. Save the `.alice-class-behavior.json` file.

Alice downloads a JSON file named after the selected class behavior. For example:

```text
SpinnerBehavior.alice-class-behavior.json
```

### Import a class behavior

1. Open the receiving project.
2. In **Class Behaviors**, choose the import picker.
3. Select a `.alice-class-behavior.json` file.

Alice adds the class behavior to the current project. Save the project to persist
the imported behavior into the `.a3p` file. Browser imports use the default
`rename` conflict strategy.

## Command line workflow

The server API can export the selected class behavior from the current project
and import it into another current project.

Set a local API token and run the Alice server:

```bash
export NODE_OPTIONS=--max-old-space-size=32768
export ALICE_LOCAL_API_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))')"
npm run build:server
npm run serve -- --port 3000 --api-token "$ALICE_LOCAL_API_TOKEN" --evidence-dir ./evidence
```

Open or create the source project, then export `SpinnerBehavior`. Clients must
URL-encode the `:typeName` segment when the class name contains spaces or other
reserved URL characters.

```bash
curl -fS http://127.0.0.1:3000/api/projects/current/classes/SpinnerBehavior/behavior \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -o SpinnerBehavior.alice-class-behavior.json
```

Open or create the receiving project, then import the saved behavior package:

```bash
curl -fS -X POST http://127.0.0.1:3000/api/projects/current/classes/behavior \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @- <<'JSON'
{
  "conflictStrategy": "rename",
  "package": {
    "kind": "alice-web.reusable-class-behavior",
    "version": 1,
    "exportedBy": "alice-web",
    "type": {
      "name": "SpinnerBehavior",
      "superTypeName": "org.lgna.story.SModel",
      "fields": [
        {
          "name": "turnSpeed",
          "typeName": "Double",
          "initializer": "0.25"
        }
      ],
      "constructors": [
        {
          "name": "SpinnerBehavior",
          "isFunction": false,
          "returnType": "SpinnerBehavior",
          "parameters": [],
          "statements": [
            {
              "kind": "expression",
              "expression": "this.turnSpeed = 0.25"
            }
          ]
        }
      ],
      "methods": [
        {
          "name": "spinOnce",
          "isFunction": false,
          "returnType": "void",
          "parameters": [],
          "statements": [
            {
              "kind": "call",
              "object": "this",
              "method": "turn",
              "arguments": ["LEFT", "turnSpeed"]
            }
          ]
        }
      ]
    }
  }
}
JSON
```

When the package is already in a file, the practical client flow is:

```bash
node -e 'const fs=require("fs"); const pkg=JSON.parse(fs.readFileSync("SpinnerBehavior.alice-class-behavior.json","utf8")); fs.writeFileSync("import-request.json", JSON.stringify({ conflictStrategy: "rename", package: pkg }, null, 2));'

curl -fS -X POST http://127.0.0.1:3000/api/projects/current/classes/behavior \
  -H "X-Alice-Local-Api-Token: $ALICE_LOCAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @import-request.json
```

## Conflict handling

Choose a conflict strategy when the receiving project already has a class with
the exported name.

| Strategy | Behavior |
| --- | --- |
| `rename` | Default. Imports the class under the next available name, such as `SpinnerBehavior2`. Only `type.name`, constructor `name`, and constructor `returnType` are updated to the imported class name. Method bodies and other references are not rewritten. |
| `replace` | Replaces the existing class with the imported class. Use this only when the existing class should be overwritten. |
| `merge` | Adds missing fields, methods, and constructors to the existing class. Matching members are replaced by the package version. |
| `reject` | Does not change the project and returns a conflict response. |

Merge matching uses these keys:

| Member kind | Match key |
| --- | --- |
| Field | `field.name` |
| Method | `method.name` |
| Constructor | Position in the constructor list |

Use `reject` when a tool must ask a person to choose. Use `rename` for unattended
imports because it avoids overwriting existing project behavior.

## What is preserved

The reusable class behavior package preserves these fields from
`AliceTypeDefinition`:

| Data | Preserved values |
| --- | --- |
| Class identity | `name` and `superTypeName` |
| Fields | `name`, `typeName`, `resourceType`, and `initializer` |
| Methods | `name`, `isFunction`, `returnType`, `parameters`, and `statements` |
| Constructors | `name`, `returnType`, `parameters`, and `statements` |
| Method bodies | Alice statement arrays, including nested bodies and expressions |

The import writes this data back into the receiving project's `types`
collection. Saving the project stores the imported behavior in the `.a3p` file.

## Safe package handling

Class behavior packages are untrusted JSON data. alice-web:

- parse and validate package contents before the project changes
- preserve package contents as data instead of evaluating, compiling,
  dynamically importing, or running them
- reject unsafe object keys such as `__proto__`, `prototype`, and `constructor`
- reject oversized strings, oversized arrays, and excessive nesting
- show import errors as text, not as HTML

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Export reports that the class is missing | Open the type browser and confirm the class exists in the current project. |
| Import reports an unsupported package version | Export the package again from the current Alice version. |
| Import reports a name conflict | Use `rename`, `replace`, or `merge`, depending on whether the receiving project should keep its existing class. |
| Imported behavior is not present after reopening | Save the receiving project after import, then reopen the saved `.a3p` file. |
| A renamed import still contains references to the old class name | Use `replace` when exact self-references must keep the original class name, or update those statements after import. |
| Imported statements refer to missing resources or types | Add the required resources or dependent types to the receiving project, or move the whole `.a3p` project instead. |

## Related documentation

- [Reuse class behavior between Alice projects](./tutorial-reuse-class-behavior-between-projects.md)
- [Class behavior package API](./class-behavior-package-api.md)
- [Class behavior package configuration](./class-behavior-package-configuration.md)
- [Project IO usage guide](./project-io-usage.md)

Last updated for reusable Alice class behavior packages.
