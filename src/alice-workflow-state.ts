export const ALICE_WORKFLOW_STATE_SCHEMA_VERSION = "alice-web.workflow-state/v1";

export type AliceWorkflowStateErrorCode =
  | "duplicate-name"
  | "invalid-binding"
  | "invalid-name"
  | "invalid-score-value"
  | "invalid-schema-version"
  | "missing-binding-source"
  | "unexpected-field";

export type VisibleWorkflowBindingKind = "score" | "time";
export type VisibleWorkflowBindingTarget = "world-overlay";
export type ScoreWorkflowFormat = "integer" | "number";
export type TimeWorkflowFormat = "seconds-one-decimal";
export type VisibleWorkflowBindingFormat = ScoreWorkflowFormat | TimeWorkflowFormat;

export interface ScorekeeperDefinition {
  name: string;
  initialValue: number;
}

export interface TimekeeperDefinition {
  name: string;
}

export interface VisibleWorkflowBinding {
  id: string;
  kind: VisibleWorkflowBindingKind;
  sourceName: string;
  target: VisibleWorkflowBindingTarget;
  label: string;
  format: VisibleWorkflowBindingFormat;
}

export interface AliceWorkflowState {
  schemaVersion: typeof ALICE_WORKFLOW_STATE_SCHEMA_VERSION;
  scorekeepers: ScorekeeperDefinition[];
  timekeepers: TimekeeperDefinition[];
  visibleBindings: VisibleWorkflowBinding[];
}

export interface ScorekeeperInput {
  name: string;
  initialValue?: number;
}

export interface TimekeeperInput {
  name: string;
}

export interface VisibleWorkflowBindingInput {
  id: string;
  kind: VisibleWorkflowBindingKind;
  sourceName: string;
  target: string;
  label: string;
  format?: VisibleWorkflowBindingFormat;
}

export interface ResolvedVisibleWorkflowBinding extends Omit<VisibleWorkflowBinding, "format"> {
  value: number;
  text: string;
}

export interface ResolveVisibleWorkflowBindingInput {
  scoreValues?: ReadonlyMap<string, number> | Readonly<Record<string, number>>;
  elapsedSeconds?: number;
}

const STATE_KEYS = new Set(["schemaVersion", "scorekeepers", "timekeepers", "visibleBindings"]);
const SCOREKEEPER_KEYS = new Set(["name", "initialValue"]);
const TIMEKEEPER_KEYS = new Set(["name"]);
const BINDING_KEYS = new Set(["id", "kind", "sourceName", "target", "label", "format"]);
const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_IDENTIFIER_LENGTH = 80;
const MAX_LABEL_LENGTH = 120;

export class AliceWorkflowStateError extends Error {
  readonly code: AliceWorkflowStateErrorCode;
  readonly path: string;

  constructor(code: AliceWorkflowStateErrorCode, path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "AliceWorkflowStateError";
    this.code = code;
    this.path = path;
  }
}

export function createDefaultAliceWorkflowState(): AliceWorkflowState {
  return {
    schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
    scorekeepers: [],
    timekeepers: [],
    visibleBindings: [],
  };
}

export function validateAliceWorkflowState(state: unknown): AliceWorkflowState {
  assertRecord(state, "aliceWorkflow");
  rejectUnexpectedKeys(state, STATE_KEYS, "aliceWorkflow");

  if (state.schemaVersion !== ALICE_WORKFLOW_STATE_SCHEMA_VERSION) {
    throw new AliceWorkflowStateError(
      "invalid-schema-version",
      "aliceWorkflow.schemaVersion",
      `must be ${ALICE_WORKFLOW_STATE_SCHEMA_VERSION}`,
    );
  }
  if (!Array.isArray(state.scorekeepers)) {
    throw new AliceWorkflowStateError("unexpected-field", "aliceWorkflow.scorekeepers", "must be an array");
  }
  if (!Array.isArray(state.timekeepers)) {
    throw new AliceWorkflowStateError("unexpected-field", "aliceWorkflow.timekeepers", "must be an array");
  }
  if (!Array.isArray(state.visibleBindings)) {
    throw new AliceWorkflowStateError("unexpected-field", "aliceWorkflow.visibleBindings", "must be an array");
  }

  const scorekeepers = state.scorekeepers.map((scorekeeper, index) =>
    validateScorekeeper(scorekeeper, `aliceWorkflow.scorekeepers[${index}]`));
  const timekeepers = state.timekeepers.map((timekeeper, index) =>
    validateTimekeeper(timekeeper, `aliceWorkflow.timekeepers[${index}]`));

  assertUniqueWorkflowNames(scorekeepers, timekeepers);

  const visibleBindings = state.visibleBindings.map((binding, index) =>
    validateVisibleBinding(binding, `aliceWorkflow.visibleBindings[${index}]`, scorekeepers, timekeepers));
  assertUniqueBindingIds(visibleBindings);

  return {
    schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
    scorekeepers,
    timekeepers,
    visibleBindings,
  };
}

export function addScorekeeper(state: AliceWorkflowState, input: ScorekeeperInput): AliceWorkflowState {
  const current = validateAliceWorkflowState(state);
  const nextScorekeeper = validateScorekeeper(
    {
      name: input.name,
      initialValue: input.initialValue ?? 0,
    },
    `aliceWorkflow.scorekeepers[${current.scorekeepers.length}]`,
  );
  return validateAliceWorkflowState({
    ...current,
    scorekeepers: [...current.scorekeepers, nextScorekeeper],
  });
}

export function addTimekeeper(state: AliceWorkflowState, input: TimekeeperInput): AliceWorkflowState {
  const current = validateAliceWorkflowState(state);
  const nextTimekeeper = validateTimekeeper(
    { name: input.name },
    `aliceWorkflow.timekeepers[${current.timekeepers.length}]`,
  );
  return validateAliceWorkflowState({
    ...current,
    timekeepers: [...current.timekeepers, nextTimekeeper],
  });
}

export function bindVisibleWorkflowState(
  state: AliceWorkflowState,
  input: VisibleWorkflowBindingInput,
): AliceWorkflowState {
  const current = validateAliceWorkflowState(state);
  const bindingIndex = current.visibleBindings.length;
  const nextBinding = validateVisibleBinding(
    {
      ...input,
      format: input.format ?? defaultBindingFormat(input.kind),
    },
    `aliceWorkflow.visibleBindings[${bindingIndex}]`,
    current.scorekeepers,
    current.timekeepers,
  );

  return validateAliceWorkflowState({
    ...current,
    visibleBindings: [...current.visibleBindings, nextBinding],
  });
}

export function resolveVisibleWorkflowBindings(
  state: AliceWorkflowState,
  input: ResolveVisibleWorkflowBindingInput = {},
): ResolvedVisibleWorkflowBinding[] {
  const workflow = validateAliceWorkflowState(state);
  const scoreValues = input.scoreValues ?? {};
  const elapsedSeconds = input.elapsedSeconds ?? 0;
  if (typeof elapsedSeconds !== "number" || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new AliceWorkflowStateError(
      "invalid-score-value",
      "aliceWorkflow.timekeepers.elapsedSeconds",
      "elapsed time must be a non-negative finite number",
    );
  }

  return workflow.visibleBindings.map((binding) => {
    const value = binding.kind === "score"
      ? readScoreValue(workflow, binding.sourceName, scoreValues)
      : elapsedSeconds;
    return {
      id: binding.id,
      kind: binding.kind,
      sourceName: binding.sourceName,
      target: binding.target,
      label: binding.label,
      value,
      text: `${binding.label}: ${formatBindingValue(value, binding.format)}`,
    };
  });
}

export function createInitialScoreValues(state: AliceWorkflowState): Map<string, number> {
  const workflow = validateAliceWorkflowState(state);
  return new Map(workflow.scorekeepers.map((scorekeeper) => [scorekeeper.name, scorekeeper.initialValue]));
}

export function resolveScorekeeperSourceName(state: AliceWorkflowState, candidateName: string): string | null {
  const workflow = validateAliceWorkflowState(state);
  const trimmed = candidateName.trim();
  if (workflow.scorekeepers.some((scorekeeper) => scorekeeper.name === trimmed)) {
    return trimmed;
  }
  const memberName = trimmed.split(".").at(-1) ?? trimmed;
  return workflow.scorekeepers.some((scorekeeper) => scorekeeper.name === memberName)
    ? memberName
    : null;
}

function validateScorekeeper(value: unknown, path: string): ScorekeeperDefinition {
  assertRecord(value, path);
  rejectUnexpectedKeys(value, SCOREKEEPER_KEYS, path);
  return {
    name: validateName(value.name, `${path}.name`),
    initialValue: validateFiniteNumber(value.initialValue, `${path}.initialValue`),
  };
}

function validateTimekeeper(value: unknown, path: string): TimekeeperDefinition {
  assertRecord(value, path);
  rejectUnexpectedKeys(value, TIMEKEEPER_KEYS, path);
  return {
    name: validateName(value.name, `${path}.name`),
  };
}

function validateVisibleBinding(
  value: unknown,
  path: string,
  scorekeepers: readonly ScorekeeperDefinition[],
  timekeepers: readonly TimekeeperDefinition[],
): VisibleWorkflowBinding {
  assertRecord(value, path);
  rejectUnexpectedKeys(value, BINDING_KEYS, path);

  const kind = value.kind;
  if (kind !== "score" && kind !== "time") {
    throw new AliceWorkflowStateError("invalid-binding", `${path}.kind`, "must be score or time");
  }
  const target = value.target;
  if (target !== "world-overlay") {
    throw new AliceWorkflowStateError("invalid-binding", `${path}.target`, "must be world-overlay");
  }
  const sourceName = validateName(value.sourceName, `${path}.sourceName`);
  if (kind === "score" && !scorekeepers.some((scorekeeper) => scorekeeper.name === sourceName)) {
    throw new AliceWorkflowStateError("missing-binding-source", `${path}.sourceName`, `unknown scorekeeper ${sourceName}`);
  }
  if (kind === "time" && !timekeepers.some((timekeeper) => timekeeper.name === sourceName)) {
    throw new AliceWorkflowStateError("missing-binding-source", `${path}.sourceName`, `unknown timekeeper ${sourceName}`);
  }
  const format = value.format ?? defaultBindingFormat(kind);
  validateBindingFormat(kind, format, `${path}.format`);

  return {
    id: validateBindingId(value.id, `${path}.id`),
    kind,
    sourceName,
    target,
    label: validateLabel(value.label, `${path}.label`),
    format,
  };
}

function validateBindingFormat(
  kind: VisibleWorkflowBindingKind,
  value: unknown,
  path: string,
): asserts value is VisibleWorkflowBindingFormat {
  const valid = kind === "score"
    ? value === "integer" || value === "number"
    : value === "seconds-one-decimal";
  if (!valid) {
    throw new AliceWorkflowStateError("invalid-binding", path, `format does not match ${kind}`);
  }
}

function defaultBindingFormat(kind: VisibleWorkflowBindingKind): VisibleWorkflowBindingFormat {
  return kind === "score" ? "integer" : "seconds-one-decimal";
}

function assertUniqueWorkflowNames(
  scorekeepers: readonly ScorekeeperDefinition[],
  timekeepers: readonly TimekeeperDefinition[],
): void {
  const names = new Set<string>();
  for (let index = 0; index < scorekeepers.length; index += 1) {
    const name = scorekeepers[index].name;
    if (names.has(name)) {
      throw new AliceWorkflowStateError("duplicate-name", `aliceWorkflow.scorekeepers[${index}].name`, `duplicate name ${name}`);
    }
    names.add(name);
  }
  for (let index = 0; index < timekeepers.length; index += 1) {
    const name = timekeepers[index].name;
    if (names.has(name)) {
      throw new AliceWorkflowStateError("duplicate-name", `aliceWorkflow.timekeepers[${index}].name`, `duplicate name ${name}`);
    }
    names.add(name);
  }
}

function assertUniqueBindingIds(bindings: readonly VisibleWorkflowBinding[]): void {
  const ids = new Set<string>();
  for (let index = 0; index < bindings.length; index += 1) {
    const id = bindings[index].id;
    if (ids.has(id)) {
      throw new AliceWorkflowStateError("invalid-binding", `aliceWorkflow.visibleBindings[${index}].id`, `duplicate binding id ${id}`);
    }
    ids.add(id);
  }
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AliceWorkflowStateError("unexpected-field", path, "must be an object");
  }
}

function rejectUnexpectedKeys(value: Record<string, unknown>, allowedKeys: ReadonlySet<string>, path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new AliceWorkflowStateError("unexpected-field", `${path}.${key}`, `unexpected key ${key}`);
    }
  }
}

function validateName(value: unknown, path: string): string {
  return validateIdentifier(value, path);
}

function validateIdentifier(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new AliceWorkflowStateError("invalid-name", path, "must be a string");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_IDENTIFIER_LENGTH || !NAME_PATTERN.test(trimmed)) {
    throw new AliceWorkflowStateError(
      "invalid-name",
      path,
      `must be ${MAX_IDENTIFIER_LENGTH} characters or fewer and use Alice identifier characters`,
    );
  }
  return trimmed;
}

function validateBindingId(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new AliceWorkflowStateError("invalid-binding", path, "must be a string");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_IDENTIFIER_LENGTH || !/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw new AliceWorkflowStateError(
      "invalid-binding",
      path,
      `must be ${MAX_IDENTIFIER_LENGTH} characters or fewer and use safe binding id characters`,
    );
  }
  return trimmed;
}

function validateLabel(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new AliceWorkflowStateError("invalid-binding", path, "must be a string");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LABEL_LENGTH) {
    throw new AliceWorkflowStateError("invalid-binding", path, `must be ${MAX_LABEL_LENGTH} characters or fewer`);
  }
  return trimmed;
}

function validateFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AliceWorkflowStateError("invalid-score-value", path, "must be a finite numeric value");
  }
  return value;
}

function readScoreValue(
  workflow: AliceWorkflowState,
  sourceName: string,
  scoreValues: ReadonlyMap<string, number> | Readonly<Record<string, number>>,
): number {
  const configured = workflow.scorekeepers.find((scorekeeper) => scorekeeper.name === sourceName);
  if (!configured) {
    throw new AliceWorkflowStateError(
      "missing-binding-source",
      "aliceWorkflow.visibleBindings.sourceName",
      `unknown scorekeeper ${sourceName}`,
    );
  }
  const value = hasMapGetter(scoreValues)
    ? scoreValues.get(sourceName)
    : (scoreValues as Readonly<Record<string, number>>)[sourceName];
  if (value === undefined) {
    return configured.initialValue;
  }

  function hasMapGetter(
    value: ReadonlyMap<string, number> | Readonly<Record<string, number>>,
  ): value is ReadonlyMap<string, number> {
    return typeof (value as { get?: unknown }).get === "function";
  }
  return validateFiniteNumber(value, `aliceWorkflow.scorekeepers.${sourceName}`);
}

function formatBindingValue(value: number, format: VisibleWorkflowBindingFormat): string {
  switch (format) {
    case "integer":
      return String(Math.trunc(value));
    case "number":
      return String(value);
    case "seconds-one-decimal":
      return value > 0 && value < 0.05 ? "0.1" : value.toFixed(1);
    default:
      return assertNever(format);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled workflow value: ${String(value)}`);
}
