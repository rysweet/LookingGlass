# Tweedle VM: Scoping, Variables, Parameters & Function Dispatch

The Tweedle VM (`src/tweedle-vm.ts`) supports block-level variable scoping,
variable assignment, parameter binding on function calls, and return value
propagation across user-defined method dispatch. These features power
Lessons 5–7 (Functions, Variables, Parameters) grading.

## Overview

Building on the base VM (see [statement-execution.md](./statement-execution.md)),
the expanded VM adds:

| Feature | Summary |
|---------|---------|
| **Scope stack** | Block-scoped variables via a stack of `Map<string,string>` frames. `CountLoop` and `IfElse` push/pop scope frames. |
| **VariableAssignment** | New statement kind that updates an existing variable in the nearest enclosing scope. |
| **Parameter binding** | When a user-defined method is called with arguments, positional args are bound to declared parameters in a new scope frame. |
| **Function dispatch** | `MethodCall` with `object === "this"` dispatches to user-defined methods in the same project when the method name matches. |
| **Return value propagation** | Return values from dispatched functions are stored in the project-level `returnValues` map. |

## Quick Start

```typescript
import { executeProject } from "./tweedle-vm.js";
import type { AliceProject } from "./a3p-parser.js";

const project: AliceProject = {
  version: "3.10",
  projectName: "ScopingDemo",
  sceneObjects: [],
  methods: [
    {
      name: "greet",
      isFunction: true,
      returnType: "String",
      parameters: [{ name: "whom", type: "String" }],
      statements: [
        { kind: "ReturnStatement", expression: "whom" },
      ],
    },
    {
      name: "myFirstMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [
        // Declare a variable
        { kind: "VariableDeclaration", name: "target", varType: "String", value: "Alice" },
        // Call greet(target) — dispatches to user-defined "greet" method
        { kind: "MethodCall", object: "this", method: "greet", arguments: ["target"] },
      ],
    },
  ],
};

const result = executeProject(project);
// result.returnValues.get("greet") → "Alice"
```

## Scope Stack

### How It Works

The VM maintains a stack of `Map<string, string>` frames (the `scopes` array).
Every method starts with a single root frame. When execution enters a
`CountLoop` or `IfElse` block, a new frame is pushed. When the block exits,
the frame is popped.

```
scopes: [
  Map { "x" => "10" },           // root (method-level)
  Map { "i" => "0" },            // CountLoop body frame
  Map { "temp" => "hello" },     // nested IfElse frame (innermost)
]
```

### Variable Lookup

Lookup walks from the innermost (top of stack) frame outward to the root.
The first frame containing the variable name wins.

```typescript
// Given scopes: [ { x: "10" }, { x: "20" } ]
// scopeLookup("x") → "20"  (innermost wins)

// Given scopes: [ { x: "10" }, { y: "5" } ]
// scopeLookup("x") → "10"  (found in root)
// scopeLookup("y") → "5"   (found in inner)
// scopeLookup("z") → undefined  (not found)
```

### Variable Declaration (`VariableDeclaration`)

Writes to the **innermost** (current) scope frame. If a variable with the
same name already exists in that frame, its value is updated. The
`MAX_VARIABLES_PER_SCOPE` cap (1,000) is enforced **per frame**.

```typescript
// Statement:
{ kind: "VariableDeclaration", name: "score", varType: "Number", value: "100" }

// Log entry:
{ step: 1, kind: "VariableDeclaration", detail: "score: Number = 100" }
```

### Variable Assignment (`VariableAssignment`)

Updates an existing variable in the **nearest enclosing scope** that contains
it. If the variable is not declared in any scope frame, the assignment is a
no-op and a log entry is emitted.

```typescript
// Statement:
{ kind: "VariableAssignment", name: "score", value: "200" }

// Log entry (success):
{ step: 2, kind: "VariableAssignment", detail: "score = 200" }

// Log entry (undeclared):
{ step: 2, kind: "VariableAssignment", detail: "score = 200 (undeclared, ignored)" }
```

**AliceStatement fields for VariableAssignment:**

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `"VariableAssignment"` | Statement discriminator |
| `name` | `string` | Variable name to assign |
| `value` | `string` | New value |

### Block Scope Lifecycle

```
method entry:  scopes = [ rootFrame ]

  CountLoop entry:  scopes = [ rootFrame, loopFrame ]
    VariableDeclaration "i" → written to loopFrame
    IfElse entry:  scopes = [ rootFrame, loopFrame, ifFrame ]
      VariableDeclaration "temp" → written to ifFrame
    IfElse exit:   scopes = [ rootFrame, loopFrame ]
    // "temp" is gone — ifFrame was popped

  CountLoop exit:  scopes = [ rootFrame ]
  // "i" is gone — loopFrame was popped
```

### Shadowing

A variable declared in an inner scope shadows the same name in an outer scope.
Assignment targets the nearest frame containing the name.

```typescript
const project = {
  // ...
  methods: [{
    name: "shadowDemo",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      { kind: "VariableDeclaration", name: "x", varType: "Number", value: "outer" },
      {
        kind: "CountLoop",
        count: 1,
        body: [
          // Declares a NEW "x" in the loop's scope frame
          { kind: "VariableDeclaration", name: "x", varType: "Number", value: "inner" },
          // Assignment targets the loop frame's "x" (nearest match)
          { kind: "VariableAssignment", name: "x", value: "modified" },
        ],
      },
      // After loop exits, loop frame is popped — outer "x" is still "outer"
    ],
  }],
};
```

### Condition Evaluation with Scoped Lookup

`IfElse` condition evaluation uses the scoped lookup:

1. `"true"` literal → `true`
2. `"false"` literal → `false`
3. Variable name → scoped lookup (innermost→outermost), then truthy check
4. Unknown → defaults to `true`

```typescript
// VariableDeclaration { name: "flag", value: "false" }
// IfElse { condition: "flag", ifBody: [...], elseBody: [...] }
//
// scopeLookup("flag") → "false" → takes elseBody
```

## Parameter Binding

### How It Works

When `executeProject` processes each `AliceMethod`, the method's `parameters`
array is available for binding. When a user-defined method is dispatched
(see [Function Dispatch](#function-dispatch)), the caller's arguments are
bound positionally to the callee's declared parameters.

```
Caller:   greet("Alice", "Bob")
Callee:   parameters: [{ name: "whom", type: "String" }, { name: "other", type: "String" }]

Binding:  whom = "Alice", other = "Bob"
```

**Argument resolution:** Each argument string is resolved against the caller's
scope. If it matches a variable name, the variable's value is used. Otherwise
the literal string is passed.

```typescript
// Caller scope: { target: "Alice" }
// MethodCall { method: "greet", arguments: ["target", "hello"] }
//
// Resolved args: ["Alice", "hello"]
//   "target" → scopeLookup finds "Alice"
//   "hello"  → no variable match, used as literal
```

**Arity mismatch:** Extra arguments are ignored. Missing arguments default
to `""` (empty string).

### Parameter Scope

Parameters are pre-populated into the callee method's root scope frame
before the method body executes. They behave like regular variables and
can be reassigned.

```typescript
// Method "greet" with parameter "whom":
//   Root scope starts as: Map { "whom" => "Alice" }
//   VariableAssignment { name: "whom", value: "Bob" }  → updates to "Bob"
```

## Function Dispatch

### Dispatch Rules

When a `MethodCall` statement is executed, the VM checks:

1. `object` is `"this"` (or absent/undefined)
2. `method` name matches an `AliceMethod.name` in the project's `methods[]`

If **both** conditions are true, the VM dispatches to the user-defined method
instead of just logging the call. If either condition is false, the call is
logged as before (no behavior change from base VM).

### Execution Flow

```
execMethodCall("this.greet(target)")
  1. Resolve arguments: ["target"] → ["Alice"] (via scoped lookup)
  2. Find "greet" in project methods[]
  3. Push depth counter (MAX_DEPTH=100 enforced)
  4. Create new VMState for callee:
     - Fresh scope stack with root frame
     - Pre-populate parameters: { whom: "Alice" }
     - Inherit stepCounter (shared across all dispatch)
  5. Execute callee's statements
  6. Pop depth counter
  7. If callee returned a value → store in returnValues map
  8. Log the MethodCall as before (with "(dispatch)" annotation)
```

### Log Entry for Dispatched Calls

Dispatched function calls include a `(dispatch)` annotation in the detail:

```typescript
// Non-dispatched (external/unknown):
{ step: 1, kind: "MethodCall", detail: "this.move()" }

// Dispatched (user-defined):
{ step: 1, kind: "MethodCall", detail: "this.greet(target) (dispatch)" }
```

### Return Value Propagation

When a dispatched method executes a `ReturnStatement`, its return value is
stored in the project-level `returnValues` map keyed by the **callee's**
method name.

```typescript
const result = executeProject(project);

// Method "greet" returned "Alice"
result.returnValues.get("greet"); // → "Alice"
```

**Important:** Return values are stored in the `returnValues` map, but they
do **not** automatically create variables in the caller's scope. The caller
does not receive the return value as an assignable expression. This is a
deliberate simplification — expression evaluation is out of scope.

```typescript
// This does NOT happen:
// caller scope: { result: returnValueFromGreet }
//
// Instead, the return value is only in:
// executionResult.returnValues.get("greet")
```

### Nested Dispatch

User-defined methods can call other user-defined methods. The VM tracks
depth to prevent infinite recursion:

```typescript
// Method A calls Method B which calls Method C
// Depth: 0 → 1 → 2
// MAX_DEPTH = 100 prevents stack overflow
```

The `stepCounter` is shared across all dispatch levels. `MAX_TOTAL_STEPS`
(50,000) catches mutual recursion that stays within the depth limit but
produces excessive work.

## Complete Example

```typescript
import { executeProject } from "./tweedle-vm.js";
import type { AliceProject } from "./a3p-parser.js";

const project: AliceProject = {
  version: "3.10",
  projectName: "FullDemo",
  sceneObjects: [],
  methods: [
    // A function that takes a parameter and returns it
    {
      name: "double",
      isFunction: true,
      returnType: "Number",
      parameters: [{ name: "n", type: "Number" }],
      statements: [
        { kind: "ReturnStatement", expression: "n" },
      ],
    },
    // Main method that declares variables and calls the function
    {
      name: "myFirstMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [
        // Declare a variable
        { kind: "VariableDeclaration", name: "count", varType: "Number", value: "5" },
        // Block scope in a loop
        {
          kind: "CountLoop",
          count: 2,
          body: [
            // This variable only exists inside the loop
            { kind: "VariableDeclaration", name: "temp", varType: "Number", value: "1" },
            // Assignment updates the existing variable
            { kind: "VariableAssignment", name: "count", value: "10" },
          ],
        },
        // "temp" is no longer accessible here (loop scope was popped)
        // "count" is now "10" (assignment targeted the root scope)

        // Call user-defined function with variable argument
        { kind: "MethodCall", object: "this", method: "double", arguments: ["count"] },

        // Call to unknown method — logged normally, no dispatch
        { kind: "MethodCall", object: "bunny", method: "move", arguments: [] },
      ],
    },
  ],
};

const result = executeProject(project);

// Execution log shows all steps across both methods:
// 1. double is executed first (methods[] order)
//    - ReturnStatement: return n → resolveValue("n") = "n" (literal, no param binding at top-level)
//    - returnValues["double"] = "n"
// 2. myFirstMethod runs:
//    - VariableDeclaration: count = 5
//    - CountLoop: repeat 2 times
//    - VariableDeclaration: temp = 1 (iteration 1)
//    - VariableAssignment: count = 10 (iteration 1)
//    - VariableDeclaration: temp = 1 (iteration 2)
//    - VariableAssignment: count = 10 (iteration 2)
//    - MethodCall: this.double(count) (dispatch) → dispatches to "double" with args ["10"]
//    - ReturnStatement (inside dispatch): return n → returnValues["double"] = "10"
//    - MethodCall: bunny.move() — logged normally

console.log(result.returnValues.get("double")); // "10"
```

## API Reference

### Types

```typescript
interface LogEntry {
  step: number;    // 1-indexed sequential counter (shared across dispatch)
  kind: string;    // Statement kind
  detail: string;  // Human-readable description
}

interface ExecutionResult {
  execution_log: LogEntry[];
  returnValues: Map<string, unknown>;
}
```

### `executeProject(project: AliceProject): ExecutionResult`

Entry point. Signature is **unchanged** from the base VM. Iterates
`project.methods[]` in order, executing each method's statements.

The `methods[]` array is made available to the internal VM state so that
`MethodCall` dispatch can look up user-defined methods by name.

**Parameters:**
- `project` — An `AliceProject` from `parseA3P()` or hand-built for testing.

**Returns:** `ExecutionResult` with the combined execution log and return
values.

### Statement Kinds (expanded)

| Kind | Fields | Behavior |
|------|--------|----------|
| `MethodCall` | `object`, `method`, `arguments` | If `object` is `"this"` and `method` matches a project method → dispatch with parameter binding. Otherwise → log only. |
| `CountLoop` | `count`, `body` | Push scope frame, repeat body, pop scope frame. |
| `IfElse` | `condition`, `ifBody`, `elseBody` | Push scope frame, evaluate condition via scoped lookup, execute branch, pop scope frame. |
| `ReturnStatement` | `expression` | Resolve expression via scoped lookup, set returned flag. |
| `VariableDeclaration` | `name`, `varType`, `value` | Write to innermost scope frame. |
| `VariableAssignment` | `name`, `value` | Update nearest enclosing scope containing `name`. No-op if undeclared. |
| `EventListener` | `event` | Logged, not dispatched. |
| `Comment` | — | Silently skipped. |

### Log Detail Formats (expanded)

| Kind | Detail format | Example |
|------|---------------|---------|
| `MethodCall` | `"{object}.{method}({args})"` | `"this.greet(target) (dispatch)"` |
| `VariableAssignment` | `"{name} = {value}"` | `"score = 200"` |
| `VariableAssignment` (undeclared) | `"{name} = {value} (undeclared, ignored)"` | `"z = 5 (undeclared, ignored)"` |

All other kinds retain their existing detail formats from the base VM.

### Internal Helpers (not exported)

These functions are internal to `tweedle-vm.ts`. They are documented here
for maintainer reference.

| Helper | Signature | Purpose |
|--------|-----------|---------|
| `scopeLookup` | `(name: string, scopes: Map[]) → string \| undefined` | Walk innermost→outermost, return first match. |
| `scopeSet` | `(name: string, value: string, scopes: Map[]) → void` | Write to innermost frame (with cap check). |
| `scopeAssign` | `(name: string, value: string, scopes: Map[]) → boolean` | Update nearest frame containing `name`. Returns false if undeclared. |
| `resolveValue` | `(arg: string, scopes: Map[]) → string` | If `arg` matches a variable, return its value; otherwise return `arg` as literal. |
| `pushScope` | `(scopes: Map[]) → void` | Push a new empty `Map<string,string>` frame. |
| `popScope` | `(scopes: Map[]) → void` | Pop the innermost frame (never pops root). |

## Security Limits

All existing caps are preserved. The scope stack adds one nuance:

| Limit | Value | Scope |
|-------|-------|-------|
| `MAX_VARIABLES_PER_SCOPE` | 1,000 | **Per individual scope frame** (not globally). Each `CountLoop`/`IfElse` body frame has its own 1,000-variable cap. |
| `MAX_DEPTH` | 100 | Incremented on `CountLoop` entry, `IfElse` entry, **and function dispatch**. A dispatched call at depth 99 that enters a loop will hit the cap. |
| `MAX_TOTAL_STEPS` | 50,000 | Shared across all dispatch levels. A mutually recursive pair of methods will exhaust this cap. |

**No `eval()`, no dynamic code construction, no prototype pollution.**
All scope frames are fresh `Map` instances. Argument resolution is string
comparison and `Map.get()` only.

## Configuration

No new configuration is required. The existing compile-time constants
in `src/tweedle-vm.ts` govern all limits:

```typescript
const MAX_TOTAL_STEPS  = 50_000;
const MAX_LOOP_ITERATIONS = 10_000;
const MAX_DEPTH        = 100;
const MAX_VARIABLES_PER_SCOPE = 1_000;
```

## Testing

### New Tests (9 tests added)

Run the full suite:

```bash
npm test -- test/tweedle-vm.test.ts
```

| # | Test | Verifies |
|---|------|----------|
| 1 | Block scope cleanup | Variables declared inside `CountLoop` are gone after loop exits |
| 2 | Variable shadowing | Inner scope `x` shadows outer `x`; outer `x` unchanged after pop |
| 3 | Assignment targets correct scope | `VariableAssignment` updates the nearest enclosing frame |
| 4 | Assignment to undeclared variable | No-op, logged with `(undeclared, ignored)` |
| 5 | Parameter binding (0 params) | Dispatch with no args, callee scope is empty |
| 6 | Parameter binding (1 param) | Single arg resolved and bound to parameter name |
| 7 | Parameter binding (N params) | Multiple args positionally bound |
| 8 | Return value propagation | Dispatched function's return stored in `returnValues` |
| 9 | Cross-method return capture | Method A dispatches to B; B's return value in `returnValues` |

### Example: Block Scope Cleanup

```typescript
it("cleans up loop-scoped variables after loop exits", () => {
  const p = project([], [
    procedure("scopeTest", [
      { kind: "VariableDeclaration", name: "outer", varType: "String", value: "yes" },
      {
        kind: "CountLoop",
        count: 1,
        body: [
          { kind: "VariableDeclaration", name: "inner", varType: "String", value: "temp" },
        ],
      },
      // After the loop, "inner" is out of scope.
      // An IfElse checking "inner" will not find it → defaults to true.
      {
        kind: "IfElse",
        condition: "inner",
        ifBody: [{ kind: "MethodCall", object: "this", method: "a", arguments: [] }],
        elseBody: [{ kind: "MethodCall", object: "this", method: "b", arguments: [] }],
      },
    ]),
  ]);

  const result = executeProject(p);
  // "inner" is not found in scope → condition defaults to true → ifBody
  const ifEntry = result.execution_log.find(e => e.kind === "IfElse");
  expect(ifEntry?.detail).toContain("true");
});
```

### Example: Parameter Binding

```typescript
it("binds arguments to parameters on dispatch", () => {
  const p = project([], [
    {
      name: "echo",
      isFunction: true,
      returnType: "String",
      parameters: [{ name: "msg", type: "String" }],
      statements: [
        { kind: "ReturnStatement", expression: "msg" },
      ],
    },
    procedure("caller", [
      { kind: "VariableDeclaration", name: "greeting", varType: "String", value: "hello" },
      { kind: "MethodCall", object: "this", method: "echo", arguments: ["greeting"] },
    ]),
  ]);

  const result = executeProject(p);
  // "greeting" resolves to "hello" → passed to echo's "msg" parameter
  // echo returns "msg" → resolves to "hello" via scope lookup
  expect(result.returnValues.get("echo")).toBe("hello");
});
```

### Example: Cross-Method Return Capture

```typescript
it("captures return values from dispatched methods", () => {
  const p = project([], [
    {
      name: "computeScore",
      isFunction: true,
      returnType: "Number",
      parameters: [{ name: "base", type: "Number" }],
      statements: [
        { kind: "ReturnStatement", expression: "base" },
      ],
    },
    procedure("gameLoop", [
      { kind: "VariableDeclaration", name: "pts", varType: "Number", value: "42" },
      { kind: "MethodCall", object: "this", method: "computeScore", arguments: ["pts"] },
    ]),
  ]);

  const result = executeProject(p);
  expect(result.returnValues.get("computeScore")).toBe("42");
});
```

## Backward Compatibility

- **`executeProject` signature:** Unchanged. Takes `AliceProject`, returns
  `ExecutionResult`.
- **Existing tests:** All 47 pre-existing tests pass without modification.
- **Log format:** Identical `LogEntry` shape. Existing log entries are
  unchanged; new statement kinds produce new entries only when those kinds
  appear in the project.
- **`returnValues`:** Same `Map<string, unknown>`. Additional entries may
  appear from dispatched function calls.
- **`execReturn` change:** `ReturnStatement` now resolves expressions via
  `resolveValue` (scoped lookup). Existing tests use literal strings like
  `"42"` which have no variable match, so they pass through unchanged.

> **Design-spec note:** The design specification does not explicitly list
> `execReturn` as a modified component. However, scoped resolution of
> return expressions is required for parameter binding to work (a method
> returning a parameter name must resolve to the parameter's value, not
> the literal name). This is an implicit requirement of the function
> dispatch design.

## Architecture

```
src/tweedle-vm.ts
  │
  ├── executeProject()        ← public entry point (unchanged signature)
  │     └── passes methods[] into VMState for dispatch lookup
  │
  ├── VMState                 ← internal state
  │     ├── scopes: Map<string,string>[]   (was: variables: Map)
  │     ├── methods: AliceMethod[]         (new: for dispatch lookup)
  │     ├── stepCounter, depth, log, returned, returnValue
  │     └── (all other fields unchanged)
  │
  ├── Scope helpers           ← new internal functions
  │     ├── scopeLookup()
  │     ├── scopeSet()
  │     ├── scopeAssign()
  │     ├── resolveValue()
  │     ├── pushScope()
  │     └── popScope()
  │
  ├── Statement handlers      ← modified/new
  │     ├── execMethodCall()          (modified: dispatch logic)
  │     ├── execCountLoop()           (modified: push/pop scope)
  │     ├── execIfElse()              (modified: push/pop scope)
  │     ├── execVariableDeclaration() (modified: uses scopeSet)
  │     ├── execVariableAssignment()  (new handler)
  │     ├── evaluateCondition()       (modified: uses scopeLookup)
  │     ├── execReturn()              (modified: uses resolveValue on expression)
  │     └── execEventListener()       (unchanged)
  │
  └── executeMethod()         ← new internal function
        └── creates child VMState, binds params, runs statements
```

## Related Documentation

- [statement-execution.md](./statement-execution.md) — Base VM docs, HTTP API, CLI hook
- [tweedle-parser.md](./tweedle-parser.md) — `.a3p` parsing and `AliceStatement` types
- [event-system.md](./event-system.md) — Event listener registration model
