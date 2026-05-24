import type {
  AliceFieldDefinition,
  AliceMethod,
  AliceObject,
  AliceProject,
  AliceStatement,
  AliceTypeDefinition,
} from "./a3p-parser.js";

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

interface RuntimeObject {
  name: string;
  typeName: string;
  fields: Map<string, unknown>;
  source: AliceObject;
}

interface RuntimeType {
  name: string;
  superTypeName: string | null;
  methods: AliceMethod[];
  constructors: AliceMethod[];
  fields: AliceFieldDefinition[];
}

interface VMException {
  typeName: string;
  value: unknown;
}

interface VMState {
  stepCounter: number;
  depth: number;
  log: LogEntry[];
  returned: boolean;
  returnValue: unknown;
  scopes: Map<string, unknown>[];
  methodMap: Map<string, AliceMethod[]>;
  typeMap: Map<string, RuntimeType>;
  objectMap: Map<string, RuntimeObject>;
  currentSelf: RuntimeObject | null;
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
function scopeLookup(state: VMState, name: string): unknown {
  for (let i = state.scopes.length - 1; i >= 0; i--) {
    if (state.scopes[i].has(name)) {
      return state.scopes[i].get(name);
    }
  }
  return undefined;
}

/** Write to the innermost (current) scope frame, respecting per-frame cap. */
function scopeSet(state: VMState, name: string, value: unknown): void {
  const current = state.scopes[state.scopes.length - 1];
  if (current.has(name) || current.size < MAX_VARIABLES_PER_SCOPE) {
    current.set(name, value);
  }
}

/** Update the nearest scope containing `name`. Returns false if undeclared. */
function scopeAssign(state: VMState, name: string, value: unknown): boolean {
  const arrayAccess = parseArrayAccessExpression(name);
  if (arrayAccess) {
    const target = evaluateValue(state, arrayAccess.target);
    const index = toArrayIndex(evaluateValue(state, arrayAccess.index));
    if (Array.isArray(target) && index !== null) {
      target[index] = value;
      return true;
    }
    return false;
  }

  const fieldPath = parseFieldPathExpression(name);
  if (fieldPath) {
    const owner = resolveObjectForPath(state, fieldPath.root);
    if (owner) {
      owner.fields.set(fieldPath.member, value);
      return true;
    }
  }

  for (let i = state.scopes.length - 1; i >= 0; i--) {
    if (state.scopes[i].has(name)) {
      state.scopes[i].set(name, value);
      return true;
    }
  }
  return false;
}

function evaluateValue(state: VMState, expr: unknown): unknown {
  if (typeof expr !== "string") {
    return expr;
  }

  const trimmed = expr.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return unescapeQuotedString(trimmed.slice(1, -1));
  }
  if (trimmed === "null") {
    return null;
  }
  if (trimmed === "true" || trimmed === "false") {
    return trimmed;
  }

  const binaryValue = evaluateBinaryExpression(state, trimmed);
  if (binaryValue !== undefined) {
    return binaryValue;
  }

  const newInstance = parseNewInstanceExpression(trimmed);
  if (newInstance) {
    return instantiateAnonymousObject(state, newInstance.className, newInstance.args);
  }

  const arrayAccess = parseArrayAccessExpression(trimmed);
  if (arrayAccess) {
    const target = evaluateValue(state, arrayAccess.target);
    const index = toArrayIndex(evaluateValue(state, arrayAccess.index));
    if (Array.isArray(target) && index !== null) {
      return target[index];
    }
    return trimmed;
  }

  const fieldPath = parseFieldPathExpression(trimmed);
  if (fieldPath) {
    const owner = resolveObjectForPath(state, fieldPath.root);
    if (owner && owner.fields.has(fieldPath.member)) {
      return owner.fields.get(fieldPath.member);
    }
  }

  const scopedValue = scopeLookup(state, trimmed);
  if (scopedValue !== undefined) {
    return scopedValue;
  }

  const newArraySizeExpr = parseNewArraySizeExpression(trimmed);
  if (newArraySizeExpr !== null) {
    const size = toArrayIndex(evaluateValue(state, newArraySizeExpr));
    if (size !== null) {
      return Array.from({ length: size }, () => null);
    }
  }

  const arrayLiteral = parseArrayLiteralExpression(trimmed);
  if (arrayLiteral) {
    return arrayLiteral.map((element) => evaluateArrayElement(state, element));
  }

  return trimmed;
}

function evaluateArrayElement(state: VMState, expr: string): unknown {
  const trimmed = expr.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return unescapeQuotedString(trimmed.slice(1, -1));
  }
  return evaluateValue(state, trimmed);
}

function unescapeQuotedString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function parseArrayAccessExpression(expr: string): { target: string; index: string } | null {
  const match = expr.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/);
  if (!match) {
    return null;
  }
  return { target: match[1], index: match[2].trim() };
}

function parseNewArraySizeExpression(expr: string): string | null {
  const match = expr.match(/^new\s+[A-Za-z_][A-Za-z0-9_.]*\[(.+)\]$/);
  return match ? match[1].trim() : null;
}

function parseNewInstanceExpression(expr: string): { className: string; args: string[] } | null {
  const match = expr.match(/^new\s+([A-Za-z_][A-Za-z0-9_.]*)\((.*)\)$/);
  if (!match) {
    return null;
  }
  return { className: match[1], args: match[2].trim() ? splitTopLevel(match[2].trim()) : [] };
}

function parseFieldPathExpression(expr: string): { root: string; member: string } | null {
  const match = expr.match(/^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)$/);
  return match ? { root: match[1], member: match[2] } : null;
}

function resolveObjectForPath(state: VMState, root: string): RuntimeObject | null {
  if (root === "this") {
    return state.currentSelf;
  }
  return state.objectMap.get(root) ?? null;
}

function evaluateBinaryExpression(state: VMState, expr: string): unknown {
  const precedence = [
    ["||"],
    ["&&"],
    ["==", "!=", "<=", ">=", "<", ">"],
    [".."],
    ["+", "-"],
    ["*", "/", "%"],
  ];
  for (const operators of precedence) {
    const split = splitByOperators(expr, operators);
    if (!split) {
      continue;
    }
    const left = evaluateValue(state, split.left);
    const right = evaluateValue(state, split.right);
    return applyBinaryOperator(split.operator, left, right);
  }
  return undefined;
}

function splitByOperators(source: string, operators: string[]): { left: string; operator: string; right: string } | null {
  let depth = 0;
  let quote: string | null = null;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const prev = index > 0 ? source[index - 1] : "";
    if (quote) {
      if (char === quote && prev !== "\\") {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(" || char === "[" || char === "{") {
      depth += 1;
      continue;
    }
    if (char === ")" || char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth !== 0) {
      continue;
    }
    for (const operator of operators) {
      if (source.startsWith(operator, index)) {
        return {
          left: source.slice(0, index).trim(),
          operator,
          right: source.slice(index + operator.length).trim(),
        };
      }
    }
  }
  return null;
}

function applyBinaryOperator(operator: string, left: unknown, right: unknown): unknown {
  switch (operator) {
    case "||":
      return Boolean(left === true || left === "true" || right === true || right === "true");
    case "&&":
      return Boolean((left === true || left === "true") && (right === true || right === "true"));
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "<":
      return numericValue(left) < numericValue(right);
    case ">":
      return numericValue(left) > numericValue(right);
    case "<=":
      return numericValue(left) <= numericValue(right);
    case ">=":
      return numericValue(left) >= numericValue(right);
    case "..":
      return `${valueToString(left)}${valueToString(right)}`;
    case "+": {
      const leftNumber = maybeNumber(left);
      const rightNumber = maybeNumber(right);
      return leftNumber !== null && rightNumber !== null
        ? String(leftNumber + rightNumber)
        : `${valueToString(left)}${valueToString(right)}`;
    }
    case "-":
      return String(numericValue(left) - numericValue(right));
    case "*":
      return String(numericValue(left) * numericValue(right));
    case "/":
      return String(numericValue(left) / numericValue(right));
    case "%":
      return String(numericValue(left) % numericValue(right));
    default:
      return undefined;
  }
}

function maybeNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericValue(value: unknown): number {
  return maybeNumber(value) ?? 0;
}

function instantiateAnonymousObject(state: VMState, className: string, args: string[]): RuntimeObject {
  const runtimeObject: RuntimeObject = {
    name: `${className}#${state.objectMap.size + 1}`,
    typeName: className,
    fields: new Map(),
    source: { name: className, typeName: className, resourceType: null, position: null, orientation: null, size: null },
  };
  initializeRuntimeObject(runtimeObject, state, args);
  return runtimeObject;
}

function parseArrayLiteralExpression(expr: string): string[] | null {
  if (
    !((expr.startsWith("[") && expr.endsWith("]")) ||
      (expr.startsWith("{") && expr.endsWith("}")))
  ) {
    return null;
  }
  const inner = expr.slice(1, -1).trim();
  if (!inner) {
    return [];
  }
  return splitTopLevel(inner);
}

function splitTopLevel(source: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const prev = i > 0 ? source[i - 1] : "";

    if (quote) {
      current += ch;
      if (ch === quote && prev !== "\\") {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === "[" || ch === "{" || ch === "(") {
      depth++;
      current += ch;
      continue;
    }

    if (ch === "]" || ch === "}" || ch === ")") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}

function toArrayIndex(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) {
    return null;
  }
  return numeric;
}

function valueToString(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => valueToString(entry)).join(", ")}]`;
  }
  if (value instanceof Map) {
    return `{${[...value.entries()].map(([key, entry]) => `${key}: ${valueToString(entry)}`).join(", ")}}`;
  }
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  return String(value);
}

function buildRuntimeTypes(project: AliceProject): Map<string, RuntimeType> {
  const typeMap = new Map<string, RuntimeType>();
  for (const type of project.types ?? []) {
    typeMap.set(type.name, {
      name: type.name,
      superTypeName: type.superTypeName ?? null,
      methods: [...(type.methods ?? [])],
      constructors: [...(type.constructors ?? [])],
      fields: [...(type.fields ?? [])],
    });
  }
  return typeMap;
}

function instantiateSceneObjects(
  project: AliceProject,
  typeMap: Map<string, RuntimeType>,
  log: LogEntry[],
  returnValues: Map<string, unknown>,
  methodMap: Map<string, AliceMethod[]>,
): Map<string, RuntimeObject> {
  const objectMap = new Map<string, RuntimeObject>();
  for (const source of project.sceneObjects) {
    const runtimeObject: RuntimeObject = {
      name: source.name,
      typeName: source.typeName,
      fields: new Map(),
      source,
    };
    objectMap.set(source.name, runtimeObject);
  }

  let bootstrapStep = 0;
  for (const runtimeObject of objectMap.values()) {
    const state: VMState = {
      stepCounter: bootstrapStep,
      depth: 0,
      log,
      returned: false,
      returnValue: undefined,
      scopes: [new Map()],
      methodMap,
      typeMap,
      objectMap,
      currentSelf: runtimeObject,
      returnValues,
    };
    initializeRuntimeObject(runtimeObject, state, sourceArgs(runtimeObject.source));
    bootstrapStep = state.stepCounter;
  }

  return objectMap;
}

function sourceArgs(source: AliceObject): string[] {
  return [...(source.constructorArgs ?? [])];
}

function initializeRuntimeObject(runtimeObject: RuntimeObject, state: VMState, args: string[]): void {
  const typeChain = collectTypeChain(runtimeObject.typeName, state.typeMap);
  for (const type of typeChain) {
    for (const field of type.fields) {
      runtimeObject.fields.set(field.name, field.initializer ? evaluateValue(state, field.initializer) : null);
    }
    const constructor = selectConstructor(type, args.length);
    if (constructor) {
      dispatchMethod(constructor, args, state, runtimeObject, type.name);
    }
  }
}

function collectTypeChain(typeName: string, typeMap: Map<string, RuntimeType>): RuntimeType[] {
  const chain: RuntimeType[] = [];
  let current = typeMap.get(typeName) ?? null;
  while (current) {
    chain.unshift(current);
    current = current.superTypeName ? typeMap.get(current.superTypeName) ?? null : null;
  }
  return chain;
}

function selectConstructor(type: RuntimeType, argCount: number): AliceMethod | null {
  for (const constructor of type.constructors) {
    if (constructor.parameters.length === argCount) {
      return constructor;
    }
  }
  return type.constructors[0] ?? null;
}

function cloneScopes(scopes: Map<string, unknown>[]): Map<string, unknown>[] {
  return scopes.map((scope) => new Map(scope));
}

function cloneObjectMap(objectMap: Map<string, RuntimeObject>): Map<string, RuntimeObject> {
  const clone = new Map<string, RuntimeObject>();
  for (const [name, runtimeObject] of objectMap.entries()) {
    clone.set(name, {
      ...runtimeObject,
      fields: new Map(runtimeObject.fields),
    });
  }
  return clone;
}

function mergeStateFromBranch(
  state: VMState,
  originalScopes: Map<string, unknown>[],
  originalObjects: Map<string, RuntimeObject>,
  branchState: VMState,
): void {
  for (let index = 0; index < originalScopes.length; index++) {
    const originalScope = originalScopes[index];
    const targetScope = state.scopes[index];
    const branchScope = branchState.scopes[index];
    if (!targetScope || !branchScope) {
      continue;
    }
    for (const [name, originalValue] of originalScope.entries()) {
      if (branchScope.has(name)) {
        const branchValue = branchScope.get(name);
        if (branchValue !== originalValue) {
          targetScope.set(name, branchValue);
        }
      }
    }
  }
  for (const [name, runtimeObject] of branchState.objectMap.entries()) {
    const targetObject = state.objectMap.get(name);
    const originalObject = originalObjects.get(name);
    if (!targetObject || !originalObject) {
      continue;
    }
    for (const [fieldName, fieldValue] of runtimeObject.fields.entries()) {
      if (originalObject.fields.get(fieldName) !== fieldValue) {
        targetObject.fields.set(fieldName, fieldValue);
      }
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────

/** Execute all methods in an AliceProject, returning a structured execution log. */
export function executeProject(project: AliceProject): ExecutionResult {
  const returnValues = new Map<string, unknown>();
  const log: LogEntry[] = [];
  let stepCounter = 0;

  const methodMap = new Map<string, AliceMethod[]>();
  for (const method of project.methods) {
    const methods = methodMap.get(method.name) ?? [];
    methods.push(method);
    methodMap.set(method.name, methods);
  }

  const typeMap = buildRuntimeTypes(project);
  const objectMap = instantiateSceneObjects(project, typeMap, log, returnValues, methodMap);

  for (const method of project.methods) {
    const state: VMState = {
      stepCounter,
      depth: 0,
      log,
      returned: false,
      returnValue: undefined,
      scopes: [new Map()],
      methodMap,
      typeMap,
      objectMap,
      currentSelf: null,
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

function runScopedStatements(stmts: AliceStatement[], state: VMState): void {
  if (stmts.length === 0) {
    return;
  }
  pushScope(state);
  state.depth++;
  runStatements(stmts, state);
  state.depth--;
  popScope(state);
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
    case "DoInOrder":
      execDoInOrder(stmt, state);
      break;
    case "DoTogether":
      execDoTogether(stmt, state);
      break;
    case "CountLoop":
      execCountLoop(stmt, state);
      break;
    case "IfElse":
      execIfElse(stmt, state);
      break;
    case "TryCatch":
      execTryCatch(stmt, state);
      break;
    case "ThrowStatement":
      execThrow(stmt, state);
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
  const methodName = stmt.method ?? "unknown";
  const args = stmt.arguments ?? [];
  const argsStr = `(${args.join(", ")})`;

  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "MethodCall",
    detail: `${objectName}.${methodName}${argsStr}`,
  });

  const targetObject = objectName === "this" ? state.currentSelf : state.objectMap.get(objectName) ?? null;
  const runtimeMethod = targetObject ? resolveRuntimeMethod(state, targetObject.typeName, methodName, args.length) : null;
  if (runtimeMethod) {
    dispatchMethod(runtimeMethod, args, state, targetObject, targetObject?.typeName ?? null);
    return;
  }

  if (objectName === "this") {
    const topLevelMethod = resolveTopLevelMethod(state, methodName, args.length);
    if (topLevelMethod) {
      dispatchMethod(topLevelMethod, args, state, state.currentSelf, null);
    }
  }
}

function resolveRuntimeMethod(state: VMState, typeName: string, methodName: string, argCount: number): AliceMethod | null {
  let current = state.typeMap.get(typeName) ?? null;
  while (current) {
    for (const method of current.methods) {
      if (method.name === methodName && method.parameters.length === argCount) {
        return method;
      }
    }
    current = current.superTypeName ? state.typeMap.get(current.superTypeName) ?? null : null;
  }
  return null;
}

function resolveTopLevelMethod(state: VMState, methodName: string, argCount: number): AliceMethod | null {
  const methods = state.methodMap.get(methodName) ?? [];
  for (const method of methods) {
    if (method.parameters.length === argCount) {
      return method;
    }
  }
  return methods[0] ?? null;
}

function dispatchMethod(
  target: AliceMethod,
  args: string[],
  state: VMState,
  self: RuntimeObject | null = state.currentSelf,
  declaringTypeName: string | null = null,
): void {
  const resolvedArgs: unknown[] = [];
  for (let i = 0; i < target.parameters.length && i < args.length; i++) {
    resolvedArgs.push(evaluateValue(state, args[i]));
  }

  const callerReturned = state.returned;
  const callerReturnValue = state.returnValue;
  const callerSelf = state.currentSelf;
  state.returned = false;
  state.returnValue = undefined;
  state.currentSelf = self;

  pushScope(state);
  for (let i = 0; i < resolvedArgs.length; i++) {
    scopeSet(state, target.parameters[i].name, resolvedArgs[i]);
  }

  state.depth++;
  runStatements(target.statements, state);
  state.depth--;

  if (state.returned && state.returnValue !== undefined) {
    state.returnValues.set(target.name, state.returnValue);
  }

  popScope(state);
  state.currentSelf = callerSelf;
  state.returned = callerReturned;
  state.returnValue = callerReturnValue;

  if (declaringTypeName) {
    state.currentSelf = callerSelf;
  }
}

function execDoInOrder(stmt: AliceStatement, state: VMState): void {
  const body = stmt.body ?? [];

  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "DoInOrder",
    detail: `run ${body.length} statements in order`,
  });

  runScopedStatements(body, state);
}

function execDoTogether(stmt: AliceStatement, state: VMState): void {
  const body = stmt.body ?? [];

  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "DoTogether",
    detail: `run ${body.length} statements together`,
  });

  if (body.length === 0) {
    return;
  }

  const scopeSnapshot = cloneScopes(state.scopes);
  const objectSnapshot = cloneObjectMap(state.objectMap);
  const branchStates: VMState[] = [];

  for (const branchStatement of body) {
    const branchObjectMap = cloneObjectMap(objectSnapshot);
    const branchState: VMState = {
      stepCounter: state.stepCounter,
      depth: state.depth,
      log: state.log,
      returned: false,
      returnValue: undefined,
      scopes: cloneScopes(scopeSnapshot),
      methodMap: state.methodMap,
      typeMap: state.typeMap,
      objectMap: branchObjectMap,
      currentSelf: state.currentSelf ? (branchObjectMap.get(state.currentSelf.name) ?? null) : null,
      returnValues: state.returnValues,
    };
    runScopedStatements([branchStatement], branchState);
    branchStates.push(branchState);
    state.stepCounter = Math.max(state.stepCounter, branchState.stepCounter);
  }

  for (const branchState of branchStates) {
    mergeStateFromBranch(state, scopeSnapshot, objectSnapshot, branchState);
    if (branchState.returned && !state.returned) {
      state.returned = true;
      state.returnValue = branchState.returnValue;
    }
  }
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

function execTryCatch(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  state.log.push({
    step: state.stepCounter,
    kind: "TryCatch",
    detail: `catch ${stmt.catchType ?? "Exception"} as ${stmt.catchVariable ?? "error"}`,
  });

  try {
    runScopedStatements(stmt.tryBody ?? [], state);
  } catch (error) {
    if (!isVMException(error)) {
      throw error;
    }
    const catchType = stmt.catchType ?? "Exception";
    if (catchType !== error.typeName && catchType !== "Exception") {
      throw error;
    }
    pushScope(state);
    scopeSet(state, stmt.catchVariable ?? "error", error.value);
    state.depth++;
    runStatements(stmt.catchBody ?? [], state);
    state.depth--;
    popScope(state);
  }
}

function execThrow(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const value = evaluateValue(state, stmt.expression ?? "error");
  state.log.push({
    step: state.stepCounter,
    kind: "ThrowStatement",
    detail: `throw ${valueToString(value)}`,
  });
  throw { typeName: stmt.varType ?? "Exception", value } satisfies VMException;
}

function isVMException(error: unknown): error is VMException {
  return typeof error === "object" && error !== null && "typeName" in error && "value" in error;
}

function evaluateCondition(condition: string, state: VMState): boolean {
  if (condition === "true") return true;
  if (condition === "false") return false;

  const value = evaluateValue(state, condition);
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;

  // Unknown conditions default to true (per spec)
  return true;
}

function execReturn(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const expr = stmt.expression ?? "undefined";
  const value = evaluateValue(state, expr);

  state.log.push({
    step: state.stepCounter,
    kind: "ReturnStatement",
    detail: `return ${valueToString(value)}`,
  });

  state.returned = true;
  state.returnValue = value;
}

function execVariableDeclaration(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const name = stmt.name ?? "unknown";
  const varType = stmt.varType ?? "Object";
  const value = evaluateValue(state, stmt.value ?? "");

  state.log.push({
    step: state.stepCounter,
    kind: "VariableDeclaration",
    detail: `${name}: ${varType} = ${valueToString(value)}`,
  });

  scopeSet(state, name, value);
}

function execVariableAssignment(stmt: AliceStatement, state: VMState): void {
  state.stepCounter++;
  const name = stmt.name ?? "unknown";
  const value = evaluateValue(state, stmt.value ?? "");

  state.log.push({
    step: state.stepCounter,
    kind: "VariableAssignment",
    detail: `${name} = ${valueToString(value)}`,
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
