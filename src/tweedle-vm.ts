import type { AliceProject, AliceMethod, AliceStatement } from "./a3p-parser.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface LogEntry {
  step: number;
  kind: string;
  detail: string;
}

export interface ExecutionResult {
  execution_log: LogEntry[];
  returnValues: Map<string, unknown>;
}

// ── Safety caps ────────────────────────────────────────────────────────

const MAX_TOTAL_STEPS = 50_000;
const MAX_LOOP_ITERATIONS = 10_000;
const MAX_DEPTH = 100;
const MAX_VARIABLES_PER_SCOPE = 1_000;

// ── Internal state ─────────────────────────────────────────────────────

interface VMState {
  stepCounter: number;
  depth: number;
  log: LogEntry[];
  returned: boolean;
  returnValue: unknown;
  scopes: Map<string, string>[];
  methodMap: Map<string, AliceMethod>;
  returnValues: Map<string, unknown>;
}

// ── Scope helpers ──────────────────────────────────────────────────────

function pushScope(state: VMState): void {
  state.scopes.push(new Map());
}

function popScope(state: VMState): void {
  if (state.scopes.length > 1) {
    state.scopes.pop();
  }
}

/** Walk scopes innermost→outermost, return first match or undefined. */
function scopeLookup(state: VMState, name: string): string | undefined {
  for (let i = state.scopes.length - 1; i >= 0; i--) {
    if (state.scopes[i].has(name)) {
      return state.scopes[i].get(name)!;
    }
  }
  return undefined;
}

/** Write to the innermost (current) scope frame, respecting per-frame cap. */
function scopeSet(state: VMState, name: string, value: string): void {
  const current = state.scopes[state.scopes.length - 1];
  if (current.has(name) || current.size < MAX_VARIABLES_PER_SCOPE) {
    current.set(name, value);
  }
}

/** Update the nearest scope containing `name`. Returns false if undeclared. */
function scopeAssign(state: VMState, name: string, value: string): boolean {
  for (let i = state.scopes.length - 1; i >= 0; i--) {
    if (state.scopes[i].has(name)) {
      state.scopes[i].set(name, value);
      return true;
    }
  }
  return false;
}

/** If `expr` matches a variable name, return its value; otherwise return expr as-is. */
function resolveValue(state: VMState, expr: string): string {
  const val = scopeLookup(state, expr);
  return val !== undefined ? val : expr;
}

// ── Public API ─────────────────────────────────────────────────────────

/** Execute all methods in an AliceProject, returning a structured execution log. */
export function executeProject(project: AliceProject): ExecutionResult {
  const returnValues = new Map<string, unknown>();
  const log: LogEntry[] = [];
  let stepCounter = 0;

  const methodMap = new Map<string, AliceMethod>();
  for (const m of project.methods) {
    methodMap.set(m.name, m);
  }

  for (const method of project.methods) {
    const state: VMState = {
      stepCounter,
      depth: 0,
      log,
      returned: false,
      returnValue: undefined,
      scopes: [new Map()],
      methodMap,
      returnValues,
    };

    runStatements(method.statements, state);
    stepCounter = state.stepCounter;

    if (state.returned && state.returnValue !== undefined) {
      returnValues.set(method.name, state.returnValue);
    }
  }

  return { execution_log: log, returnValues };
}

// ── Statement execution ────────────────────────────────────────────────

function runStatements(stmts: AliceStatement[], state: VMState): void {
  for (const stmt of stmts) {
    if (state.returned) break;
    if (state.stepCounter >= MAX_TOTAL_STEPS) break;
    executeOne(stmt, state);
  }
}

function executeOne(stmt: AliceStatement, state: VMState): void {
  if (state.returned) return;
  if (state.stepCounter >= MAX_TOTAL_STEPS) return;

  if (state.depth >= MAX_DEPTH) {
    state.stepCounter++;
    state.log.push({
      step: state.stepCounter,
      kind: "skipped",
      detail: `Depth cap exceeded (${MAX_DEPTH}) for ${stmt.kind}`,
    });
    return;
  }

  switch (stmt.kind) {
    case "MethodCall":
      execMethodCall(stmt, state);
      break;
    case "CountLoop":
      execCountLoop(stmt, state);
      break;
    case "IfElse":
      execIfElse(stmt, state);
      break;
    case "ReturnStatement":
      execReturn(stmt, state);
      break;
    case "VariableDeclaration":
      execVariableDeclaration(stmt, state);
      break;
    case "VariableAssignment":
      execVariableAssignment(stmt, state);
      break;
    case "EventListener":
      execEventListener(stmt, state);
      break;
    case "Comment":
      // Comments produce no log entries — intentionally skipped
      break;
    default:
      state.stepCounter++;
      state.log.push({
        step: state.stepCounter,
        kind: "skipped",
        detail: `Unknown statement kind: ${stmt.kind}`,
      });
      break;
  }
}

// ── Statement handlers ─────────────────────────────────────────────────

function execMethodCall(stmt: AliceStatement, state: VMState): void {
  const objectName = stmt.object ?? "this";
  const method = stmt.method ?? "unknown";
  const args = stmt.arguments ?? [];
  const argsStr = `(${args.join(", ")})`;

  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "MethodCall",
    detail: `${objectName}.${method}${argsStr}`,
  });

  // Dispatch to user-defined method when object is "this"
  if (objectName === "this") {
    const target = state.methodMap.get(method);
    if (target) {
      dispatchMethod(target, args, state);
    }
  }
}

function dispatchMethod(
  target: AliceMethod,
  args: string[],
  state: VMState,
): void {
  // Resolve args in caller's scope before creating callee scope
  const resolvedArgs: string[] = [];
  for (let i = 0; i < target.parameters.length && i < args.length; i++) {
    resolvedArgs.push(resolveValue(state, args[i]));
  }

  // Save and reset return state for callee
  const callerReturned = state.returned;
  const callerReturnValue = state.returnValue;
  state.returned = false;
  state.returnValue = undefined;

  pushScope(state);
  for (let i = 0; i < resolvedArgs.length; i++) {
    scopeSet(state, target.parameters[i].name, resolvedArgs[i]);
  }

  state.depth++;
  runStatements(target.statements, state);
  state.depth--;

  // Capture callee return value
  if (state.returned && state.returnValue !== undefined) {
    state.returnValues.set(target.name, state.returnValue);
  }

  popScope(state);

  // Restore caller return state
  state.returned = callerReturned;
  state.returnValue = callerReturnValue;
}

function execCountLoop(stmt: AliceStatement, state: VMState): void {
  const count = Math.min(Math.max(stmt.count ?? 0, 0), MAX_LOOP_ITERATIONS);
  const body = stmt.body ?? [];

  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "CountLoop",
    detail: `repeat ${count} times`,
  });

  if (count === 0 || body.length === 0) return;

  pushScope(state);
  state.depth++;
  for (let i = 0; i < count; i++) {
    if (state.returned) break;
    if (state.stepCounter >= MAX_TOTAL_STEPS) break;
    runStatements(body, state);
  }
  state.depth--;
  popScope(state);
}

function execIfElse(stmt: AliceStatement, state: VMState): void {
  const conditionRaw = stmt.condition ?? "unknown";
  const conditionValue = evaluateCondition(conditionRaw, state);

  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "IfElse",
    detail: `condition "${conditionRaw}" → ${conditionValue}`,
  });

  const branch = conditionValue
    ? (stmt.ifBody ?? [])
    : (stmt.elseBody ?? []);

  if (branch.length === 0) return;

  pushScope(state);
  state.depth++;
  runStatements(branch, state);
  state.depth--;
  popScope(state);
}

function evaluateCondition(condition: string, state: VMState): boolean {
  if (condition === "true") return true;
  if (condition === "false") return false;

  // Variable lookup via scoped resolution
  const val = scopeLookup(state, condition);
  if (val !== undefined) {
    if (val === "true") return true;
    if (val === "false") return false;
  }

  // Unknown conditions default to true (per spec)
  return true;
}

function execReturn(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const expr = stmt.expression ?? "undefined";

  state.log.push({
    step: state.stepCounter,
    kind: "ReturnStatement",
    detail: `return ${expr}`,
  });

  state.returned = true;
  state.returnValue = resolveValue(state, expr);
}

function execVariableDeclaration(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const name = stmt.name ?? "unknown";
  const varType = stmt.varType ?? "Object";
  const value = stmt.value ?? "";

  state.log.push({
    step: state.stepCounter,
    kind: "VariableDeclaration",
    detail: `${name}: ${varType} = ${value}`,
  });

  scopeSet(state, name, value);
}

function execVariableAssignment(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const name = stmt.name ?? "unknown";
  const value = stmt.value ?? "";

  state.log.push({
    step: state.stepCounter,
    kind: "VariableAssignment",
    detail: `${name} = ${value}`,
  });

  // Only update if variable exists in some scope; no-op if undeclared
  scopeAssign(state, name, value);
}

function execEventListener(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const event = stmt.event ?? "unknown";

  state.log.push({
    step: state.stepCounter,
    kind: "EventListener",
    detail: `register "${event}"`,
  });
  // Registered but not dispatched during VM run (per spec)
}
