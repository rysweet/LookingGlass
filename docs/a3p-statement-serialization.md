# A3P Statement Serialization — Round-Trip Read/Write

The A3P writer (`src/a3p-writer/document.ts`) and reader
(`src/a3p-parser/scene.ts`) provide full round-trip serialization of all
supported `AliceStatement` kinds through the `.a3p` project XML. Statements
written by the writer parse back through the reader with matching kind, body,
arguments, and nested children.

## Overview

| Component | File | Role |
|-----------|------|------|
| Writer | `src/a3p-writer/document.ts` | Serializes `AliceStatement[]` → Alice AST XML nodes |
| Reader | `src/a3p-parser/scene.ts` | Parses Alice AST XML nodes → `AliceStatement[]` |
| Types | `src/a3p-parser/types.ts` | `AliceStatement` interface definition |
| Tests | `test/a3p-roundtrip-statements.test.ts` | 16 round-trip tests covering all kinds |

The writer emits XML using Alice AST Java class names (e.g.,
`org.lgna.project.ast.DoInOrder`). The reader extracts data from these XML
nodes back into the `AliceStatement` TypeScript model. Together they form a
write→read round-trip for method bodies in `.a3p` projects.

## Supported Statement Kinds

The round-trip serializer supports these 11 `AliceStatement.kind` values:

| Kind | Alice AST XML Type | Key Properties |
|------|-------------------|----------------|
| `Comment` | `Comment` | `text`, `isEnabled` |
| `MethodCall` | `ExpressionStatement` → `MethodInvocation` | caller via `FieldAccess`, method via `JavaMethod`, `requiredArguments` |
| `DoInOrder` | `DoInOrder` | `body` (BlockStatement) |
| `DoTogether` | `DoTogether` | `body` (BlockStatement) |
| `WhileLoop` | `WhileLoop` | `conditional` (expression), `body` |
| `ForEachLoop` | `ForEachInArrayLoop` | `item` (UserLocal), `array`, `body` |
| `EachInArrayTogether` | `EachInArrayTogether` | `item` (UserLocal), `array`, `body` |
| `CountLoop` | `CountLoop` | `variable` (UserLocal), `constant`, `count`, `body` |
| `IfElse` | `ConditionalStatement` | `booleanExpressionBodyPairs`, `elseBody` |
| `ReturnStatement` | `ReturnStatement` | `expression` (StringLiteral) |
| `VariableDeclaration` | `LocalDeclarationStatement` | `local` (UserLocal), `initializer` |

Unrecognized statement kinds are silently skipped by the writer. The reader
returns them with `kind` set to the last segment of the Java class name
(e.g., `"AbstractStatementWithBody"` → kind `"AbstractStatementWithBody"`).

> **Out of scope:** The `AliceStatement` type also has fields for
> `TryCatch` (`tryBody`/`catchBody`), `Switch` (`cases`/`defaultCase`),
> and `EventListener` (`event`). These kinds are not round-tripped by
> this serializer — they pass through the reader's generic fallback
> handler and are skipped by the writer.

## Quick Start

### Writing Statements to XML

```typescript
import { buildProjectXml } from "./a3p-writer/document.js";
import type { AliceProject } from "./a3p-parser.js";

const project: AliceProject = {
  version: "1.0",
  projectName: "MyProject",
  sceneObjects: [],
  methods: [{
    name: "myFirstMethod",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      { kind: "Comment", expression: "Setup" },
      { kind: "MethodCall", object: "bunny", method: "move", arguments: ["FORWARD", "1.0"] },
      { kind: "DoInOrder", body: [
        { kind: "MethodCall", object: "bunny", method: "turn", arguments: ["LEFT", "0.5"] },
        { kind: "MethodCall", object: "bunny", method: "say", arguments: ["Hello!"] },
      ]},
      { kind: "CountLoop", count: 3, body: [
        { kind: "MethodCall", object: "bunny", method: "hop", arguments: [] },
      ]},
    ],
  }],
};

const xml = buildProjectXml(project, null);
// xml contains full Alice AST XML with all statements serialized
```

### Reading Statements from XML

```typescript
import { parseA3P } from "./a3p-parser.js";

const project = await parseA3P(a3pBuffer);
for (const method of project.methods) {
  console.log(`${method.name}: ${method.statements.length} statements`);
  for (const stmt of method.statements) {
    console.log(`  ${stmt.kind}: ${JSON.stringify(stmt)}`);
  }
}
```

### Round-Trip Verification

```typescript
import { buildProjectXml } from "./a3p-writer/document.js";
import { parseA3P } from "./a3p-parser.js";

// Write
const xml = buildProjectXml(project, null);

// Re-read (via a3p archive round-trip)
const restored = await parseA3P(archiveWithXml);

// Verify
for (let i = 0; i < project.methods[0].statements.length; i++) {
  const original = project.methods[0].statements[i];
  const parsed = restored.methods[0].statements[i];
  assert(original.kind === parsed.kind);
}
```

## Statement Serialization Details

### Comment

**Writer:** Creates a `Comment` node with `text` and `isEnabled` properties.

```xml
<node type="org.lgna.project.ast.Comment" uuid="...">
  <property name="text">
    <value type="java.lang.String">move bunny forward</value>
  </property>
  <property name="isEnabled">
    <value type="java.lang.Boolean">true</value>
  </property>
</node>
```

**Reader:** Extracts `text` property → `{ kind: "Comment", expression: "move bunny forward" }`.

### MethodCall

**Writer:** Creates an `ExpressionStatement` containing a `MethodInvocation`.
The caller object is serialized as a `FieldAccess` node. The method reference
uses a `JavaMethod` node (not `UserMethod`, to avoid confusing `indexNodes()`).
Arguments are `SimpleArgument` nodes wrapping `StringLiteral` expressions.

```xml
<node type="org.lgna.project.ast.ExpressionStatement" uuid="...">
  <property name="expression">
    <node type="org.lgna.project.ast.MethodInvocation" uuid="...">
      <property name="expression">
        <node type="org.lgna.project.ast.FieldAccess" uuid="...">
          <property name="field">
            <node type="org.lgna.project.ast.UserField" uuid="...">
              <property name="name">
                <value type="java.lang.String">bunny</value>
              </property>
            </node>
          </property>
        </node>
      </property>
      <property name="method">
        <node type="org.lgna.project.ast.JavaMethod" uuid="...">
          <method name="move"/>
        </node>
      </property>
      <property name="requiredArguments">
        <collection type="java.util.ArrayList">
          <!-- SimpleArgument nodes with StringLiteral expressions -->
        </collection>
      </property>
    </node>
  </property>
</node>
```

**Reader:** Resolves the caller via `FieldAccess` → `field` → `name`. Extracts
method name from both `UserMethod` and `JavaMethod` node types. Walks
`requiredArguments` collection to extract argument values.

**Result:** `{ kind: "MethodCall", object: "bunny", method: "move", arguments: ["FORWARD", "1.0"] }`

### DoInOrder / DoTogether

**Writer:** Creates a node of the corresponding Alice AST type with a `body`
property containing a `BlockStatement` whose `statements` collection holds the
child statements (recursively serialized).

```xml
<node type="org.lgna.project.ast.DoInOrder" uuid="...">
  <property name="body">
    <node type="org.lgna.project.ast.BlockStatement" uuid="...">
      <property name="statements">
        <collection type="java.util.ArrayList">
          <!-- child statement nodes -->
        </collection>
      </property>
      <property name="isEnabled">
        <value type="java.lang.Boolean">true</value>
      </property>
    </node>
  </property>
  <property name="isEnabled">
    <value type="java.lang.Boolean">true</value>
  </property>
</node>
```

**Reader:** Extracts child statements from `body` → `BlockStatement` →
`statements` collection.

**Result:** `{ kind: "DoInOrder", body: [/* nested statements */] }`

### WhileLoop

**Writer:** Creates a `WhileLoop` node with `conditional` (StringLiteral
expression) and `body` (BlockStatement) properties.

**Reader:** Extracts condition from `conditional` property expression text,
and body from the `body` BlockStatement.

**Result:** `{ kind: "WhileLoop", condition: "true", body: [/* statements */] }`

> **Note:** The `AliceStatement` model stores conditions as strings. This is
> lossy for complex boolean expressions — they are serialized as their text
> representation.

### ForEachLoop / EachInArrayTogether

**Writer:** Creates `ForEachInArrayLoop` or `EachInArrayTogether` node with:
- `item` property → `UserLocal` node with name and type
- `array` property → `StringLiteral` expression for the collection name
- `body` → `BlockStatement` with nested statements

**Reader:** Extracts item name/type from `UserLocal`, collection from `array`
expression, and child statements from `body`.

**Result:** `{ kind: "ForEachLoop", itemName: "animal", itemType: "SBiped", collection: "animals", body: [...] }`

### CountLoop

**Writer:** Creates a `CountLoop` node with:
- `variable` → `UserLocal` with name and `Integer` type
- `constant` → `IntegerLiteral` with the count value
- `count` → `IntegerLiteral` (duplicate for compatibility)
- `body` → `BlockStatement` with nested statements

**Reader:** Extracts count from `constant` or `count` property, parses as
integer with fallback to 1.

**Result:** `{ kind: "CountLoop", count: 3, body: [/* statements */] }`

### IfElse (ConditionalStatement)

**Writer:** Uses Alice's native `booleanExpressionBodyPairs` structure:

```xml
<node type="org.lgna.project.ast.ConditionalStatement" uuid="...">
  <property name="booleanExpressionBodyPairs">
    <collection type="java.util.ArrayList">
      <node type="org.lgna.project.ast.BooleanExpressionBodyPair" uuid="...">
        <property name="expression">
          <node type="org.lgna.project.ast.StringLiteral" uuid="...">
            <property name="value">
              <value type="java.lang.String">isHappy</value>
            </property>
          </node>
        </property>
        <property name="body">
          <node type="org.lgna.project.ast.BlockStatement" uuid="...">
            <!-- if-body statements -->
          </node>
        </property>
      </node>
    </collection>
  </property>
  <property name="elseBody">
    <node type="org.lgna.project.ast.BlockStatement" uuid="...">
      <!-- else-body statements -->
    </node>
  </property>
</node>
```

**Reader:** Extracts condition from the first `BooleanExpressionBodyPair`'s
expression, if-body from its body, and else-body from the `elseBody` property.

**Result:** `{ kind: "IfElse", condition: "isHappy", ifBody: [...], elseBody: [...] }`

### ReturnStatement

**Writer:** Creates a `ReturnStatement` with `expression` → `StringLiteral`.

**Reader:** Extracts expression text from the `expression` property.

**Result:** `{ kind: "ReturnStatement", expression: "42" }`

### VariableDeclaration

**Writer:** Creates a `LocalDeclarationStatement` with:
- `local` → `UserLocal` node with variable name and type
- `initializer` → `StringLiteral` expression

**Reader:** Extracts name and type from the `UserLocal` node, value from the
initializer expression.

**Result:** `{ kind: "VariableDeclaration", name: "speed", varType: "Number", value: "1.5" }`

## syncMethodSignature Behavior

The `syncMethodSignature()` function updates an existing method node's body to
match the desired `AliceMethod`. It handles four cases:

| Existing Body | Desired Statements | Behavior |
|---------------|-------------------|----------|
| Missing | Non-empty | Creates `BlockStatement` body node, populates with statements |
| Missing | Empty | No-op (skipped) |
| Present | Non-empty | Clears existing statements, writes new ones |
| Present | Empty | Clears existing statements (body becomes empty) |

This ensures that:
1. Methods gain a body when statements are added for the first time
2. Stale statements are cleared when a method's body is emptied
3. Existing body structure is preserved when statements change

> **Implementation note:** Before this feature, `syncMethodSignature()`
> returned early whenever the body was missing or statements were empty,
> which silently dropped new statements and left stale bodies intact.
> The updated logic addresses both gaps.

## Expression Serialization

All expression values (conditions, return values, variable initializers,
arguments) are serialized as `StringLiteral` nodes. This is a deliberate
simplification matching the `AliceStatement` model, where all expression
values are represented as strings.

| Expression Type | Written As | Round-Trip Fidelity |
|----------------|-----------|---------------------|
| String values | `StringLiteral` | ✅ Exact |
| Integer values | `IntegerLiteral` (CountLoop only) | ✅ Exact |
| Boolean conditions | `StringLiteral` with text | ⚠️ Text only |
| Complex expressions | `StringLiteral` summary | ⚠️ Lossy |
| Field/method access | Not round-tripped as expression | ⚠️ Name only |

For complex expressions in real Alice projects (arithmetic, method calls,
field accesses), the reader extracts a text summary. The writer can only
reproduce expressions from the string representation, which limits fidelity
for anything beyond string and integer literals.

## Recursive Nesting

Statements with body properties (`DoInOrder`, `DoTogether`, `WhileLoop`,
`ForEachLoop`, `EachInArrayTogether`, `CountLoop`, `IfElse`) support
recursive nesting. The writer calls `appendSupportedStatements()` recursively
for each body, and the reader calls `extractStatements()` recursively
when parsing bodies.

Example — nested DoInOrder inside CountLoop:

```typescript
{
  kind: "CountLoop",
  count: 5,
  body: [{
    kind: "DoInOrder",
    body: [
      { kind: "Comment", expression: "step 1" },
      { kind: "MethodCall", object: "bunny", method: "hop", arguments: [] },
    ],
  }],
}
```

There is no explicit recursion depth limit in the statement serializer. In
practice, Alice projects rarely exceed 5–10 levels of nesting.

## Testing

### Round-Trip Test Suite

The test file `test/a3p-roundtrip-statements.test.ts` contains 16 tests:

| # | Test | Verifies |
|---|------|----------|
| 1 | Comment round-trip | Comment text preserved |
| 2 | MethodCall round-trip | Object, method, arguments preserved |
| 3 | MethodCall no arguments | Empty argument list preserved |
| 4 | DoInOrder round-trip | Body statements preserved |
| 5 | DoTogether round-trip | Body statements preserved |
| 6 | WhileLoop round-trip | Condition + body preserved |
| 7 | ForEachLoop round-trip | Item name/type + collection + body preserved |
| 8 | EachInArrayTogether round-trip | Item name/type + collection + body preserved |
| 9 | CountLoop round-trip | Count + body preserved |
| 10 | IfElse round-trip | Condition + ifBody + elseBody preserved |
| 11 | ReturnStatement round-trip | Expression preserved |
| 12 | VariableDeclaration round-trip | Name + type + value preserved |
| 13 | Mixed statements | Multiple kinds in one method |
| 14 | Nested bodies | DoInOrder inside CountLoop |
| 15 | Empty method body | Zero statements preserved |
| 16 | syncMethodSignature creates body | Body created when missing |

Run the tests:

```bash
npx vitest run test/a3p-roundtrip-statements.test.ts
```

### Test Pattern

Each round-trip test follows this structure:

```typescript
it("round-trips <Kind> statements", async () => {
  // 1. Build a project with the target statement kind
  const project = makeProject([
    { kind: "MethodCall", object: "bunny", method: "move", arguments: ["FORWARD"] },
  ]);

  // 2. Write to XML
  const xml = buildProjectXml(project, null);

  // 3. Re-read via parseA3P (the full parser pipeline)
  const archive = await parseA3P(await makeArchive(xml));

  // 4. Assert round-trip fidelity
  const stmt = archive.methods[0].statements[0];
  expect(stmt.kind).toBe("MethodCall");
  expect(stmt.object).toBe("bunny");
  expect(stmt.method).toBe("move");
  expect(stmt.arguments).toContain("FORWARD");
});
```

## Relationship to Existing Modules

| Module | Role | Relationship |
|--------|------|-------------|
| `a3p-parser.ts` | Entry point for `.a3p` parsing | Delegates to `scene.ts` for statement extraction |
| `a3p-parser/scene.ts` | XML → `AliceStatement[]` | Reader: `parseStatement()` + helpers |
| `a3p-parser/dom.ts` | Reader XML DOM utilities | `getPropertyNode()`, `getPropertyText()`, `resolve()` used by reader |
| `a3p-writer/document.ts` | `AliceProject` → XML | Writer: `appendSupportedStatements()` + `syncMethodSignature()` |
| `a3p-writer/xml-tools.ts` | Writer XML DOM utilities | `parseXmlString()`, `generateUuid()`, `ensureXmlTools()` used by writer |
| `serialization.ts` | JSON/XML text serialization | Separate concern — operates on `AliceProject` model, not `.a3p` XML |
| `project-io.ts` | Full `.a3p` archive I/O | Uses writer for XML generation in `writeProject()` |

**Data flow:**

```
Write path:  AliceProject → buildProjectXml() → appendSupportedStatements() → XML nodes
Read path:   XML nodes → parseStatement() → extractStatements() → AliceStatement[]
```

## Key Design Decisions

### JavaMethod over UserMethod for Method References

The writer uses `JavaMethod` (not `UserMethod`) for method references inside
`MethodInvocation` nodes. This prevents `indexNodes()` (in `dom.ts`) from
picking up serialized method references as real method declarations, which
caused false positives in the method index and broke E2E tests.

### Alice's Native IfElse Structure

`ConditionalStatement` is serialized using Alice's
`booleanExpressionBodyPairs` collection structure rather than a simplified
`condition`/`ifBody` attribute pair. This ensures compatibility with Alice
desktop and real `.a3p` files.

### DOM API for XML Construction

All XML generation uses the DOM API (`createElement`, `setAttribute`,
`createTextNode`) rather than string interpolation. This automatically handles
XML escaping for special characters in statement data.

### String-Based Expression Model

The `AliceStatement` interface stores all expression values as strings. The
serializer follows this constraint — conditions, return values, and
initializers are `StringLiteral` nodes. This is intentionally lossy for
complex expressions but matches the model's design.

## Limitations

- **Expression fidelity is lossy.** Complex expressions (arithmetic, method
  calls, field accesses, boolean logic) are reduced to their string
  representation. The writer can only reproduce `StringLiteral` and
  `IntegerLiteral` nodes from these strings.

- **Only `FieldAccess` callers are resolved.** Method calls on `this`,
  local variables (`LocalAccess`), or static types (`TypeExpression`) may
  resolve to `"this"` or a fallback name rather than the original caller.

- **`JavaMethod` name extraction only.** The reader extracts method names
  from `UserMethod.name` and `JavaMethod.name` properties. Methods
  referenced via `<method name="...">` elements on `JavaMethod` nodes are
  also handled. Other method reference patterns may return `"unknown"`.

- **No schema validation.** The writer does not validate that the resulting
  XML is a complete, valid Alice AST. It produces structurally correct nodes
  for the supported statement kinds but does not verify cross-references
  (e.g., that a `FieldAccess` references an existing field).

- **No streaming.** Statement serialization operates on the full in-memory
  DOM. This is fine for typical Alice projects but has no incremental mode.

## Security

| Concern | Severity | Mitigation |
|---------|----------|------------|
| XML injection via statement data | None | DOM API auto-escapes all text content |
| Statement recursion → stack overflow | Low | Alice projects rarely exceed 10 levels; no synthetic limit imposed |
| Stale body preservation | Fixed | `syncMethodSignature()` clears bodies when statements are empty |
| indexNodes collision | Fixed | Writer uses `JavaMethod` not `UserMethod` for method references |
