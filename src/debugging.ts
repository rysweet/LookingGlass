import type { AliceMethod, AliceProject, AliceStatement } from "./a3p-parser.js";

export type DebugPauseReason = "ready" | "step" | "breakpoint" | "completed";

export interface DebugStatementLocation {
  id: string;
  ownerName: string;
  methodName: string;
  signature: string;
  kind: string;
  path: readonly string[];
  parentId: string | null;
  statement: AliceStatement;
}

export interface DebugVariableSnapshot {
  locals: Readonly<Record<string, unknown>>;
  fields: Readonly<Record<string, unknown>>;
  visible: Readonly<Record<string, unknown>>;
}

export interface DebugCallFrame {
  id: string;
  ownerName: string | null;
  methodName: string;
  signature: string;
  receiverName: string | null;
  receiverTypeName: string | null;
  locals: Readonly<Record<string, unknown>>;
  fields: Readonly<Record<string, unknown>>;
}

export interface DebugTraceEvent {
  statement: DebugStatementLocation;
  ancestorStatementIds: readonly string[];
  callStack: readonly DebugCallFrame[];
  variables: DebugVariableSnapshot;
  step: number;
  executionLogSize: number;
}

export interface DebugExecutionLike {
  execution_log: readonly { step: number; kind: string; detail: string }[];
  returnValues: ReadonlyMap<string, unknown>;
}

export interface DebugTrace {
  statements: readonly DebugStatementLocation[];
  events: readonly DebugTraceEvent[];
  result: DebugExecutionLike;
}

export interface DebugSnapshot {
  reason: DebugPauseReason;
  statement: DebugStatementLocation | null;
  callStack: readonly DebugCallFrame[];
  variables: DebugVariableSnapshot;
  isComplete: boolean;
  step: number;
  executionLogSize: number;
  breakpoints: readonly string[];
  returnValues: ReadonlyMap<string, unknown>;
}

type StatementReference = DebugStatementLocation | AliceStatement | string;

const EMPTY_RECORD = Object.freeze({}) as Readonly<Record<string, unknown>>;
const EMPTY_VARIABLES: DebugVariableSnapshot = Object.freeze({
  locals: EMPTY_RECORD,
  fields: EMPTY_RECORD,
  visible: EMPTY_RECORD,
});

function methodSignature(ownerName: string, method: AliceMethod): string {
  return `${ownerName}.${method.name}/${method.parameters.length}`;
}

function nestedStatementGroups(statement: AliceStatement): Array<{ label: string; statements: AliceStatement[] }> {
  const groups: Array<{ label: string; statements: AliceStatement[] }> = [];
  if (statement.body && statement.body.length > 0) {
    groups.push({ label: "body", statements: statement.body });
  }
  if (statement.ifBody && statement.ifBody.length > 0) {
    groups.push({ label: "if", statements: statement.ifBody });
  }
  if (statement.elseBody && statement.elseBody.length > 0) {
    groups.push({ label: "else", statements: statement.elseBody });
  }
  if (statement.tryBody && statement.tryBody.length > 0) {
    groups.push({ label: "try", statements: statement.tryBody });
  }
  if (statement.catchBody && statement.catchBody.length > 0) {
    groups.push({ label: "catch", statements: statement.catchBody });
  }
  statement.cases?.forEach((testCase, index) => {
    if (testCase.body.length > 0) {
      groups.push({ label: `case${index}`, statements: testCase.body });
    }
  });
  if (statement.defaultCase && statement.defaultCase.length > 0) {
    groups.push({ label: "default", statements: statement.defaultCase });
  }
  return groups;
}

function collectMethodStatements(
  ownerName: string,
  method: AliceMethod,
  statements: AliceStatement[],
  catalog: DebugStatementLocation[],
  parentId: string | null,
  pathPrefix: readonly string[] = [],
): void {
  const signature = methodSignature(ownerName, method);
  statements.forEach((statement, index) => {
    const path = [...pathPrefix, String(index)];
    const location: DebugStatementLocation = {
      id: `${signature}:${path.join(".")}`,
      ownerName,
      methodName: method.name,
      signature,
      kind: statement.kind,
      path,
      parentId,
      statement,
    };
    catalog.push(location);
    for (const group of nestedStatementGroups(statement)) {
      collectMethodStatements(ownerName, method, group.statements, catalog, location.id, [...path, group.label]);
    }
  });
}

function collectOwnerMethods(ownerName: string, methods: AliceMethod[], catalog: DebugStatementLocation[]): void {
  for (const method of methods) {
    collectMethodStatements(ownerName, method, method.statements, catalog, null);
  }
}

export function collectProjectDebugStatements(project: AliceProject): DebugStatementLocation[] {
  const catalog: DebugStatementLocation[] = [];
  collectOwnerMethods(project.projectName, project.methods, catalog);
  for (const type of project.types ?? []) {
    collectOwnerMethods(type.name, [...(type.methods ?? []), ...(type.constructors ?? [])], catalog);
  }
  return catalog;
}

export class BreakpointManager {
  private readonly ids = new Set<string>();

  constructor(private readonly resolveId: (reference: StatementReference) => string | null) {}

  set(reference: StatementReference): boolean {
    const id = this.resolveId(reference);
    if (!id) {
      return false;
    }
    this.ids.add(id);
    return true;
  }

  clear(reference: StatementReference): boolean {
    const id = this.resolveId(reference);
    if (!id) {
      return false;
    }
    return this.ids.delete(id);
  }

  has(reference: StatementReference): boolean {
    const id = this.resolveId(reference);
    return id ? this.ids.has(id) : false;
  }

  list(): string[] {
    return [...this.ids].sort();
  }
}

export class TweedleDebugSession {
  private readonly statementIds = new Map<string, DebugStatementLocation>();
  private readonly statementObjects = new WeakMap<AliceStatement, string>();
  private readonly breakpoints: BreakpointManager;
  private cursor = -1;

  constructor(private readonly trace: DebugTrace) {
    for (const statement of trace.statements) {
      this.statementIds.set(statement.id, statement);
      this.statementObjects.set(statement.statement, statement.id);
    }
    this.breakpoints = new BreakpointManager((reference) => this.resolveStatementId(reference));
  }

  getStatements(): readonly DebugStatementLocation[] {
    return this.trace.statements;
  }

  getCurrentStatement(): DebugStatementLocation | null {
    return this.currentEvent()?.statement ?? null;
  }

  getCallStack(): readonly DebugCallFrame[] {
    return this.currentEvent()?.callStack ?? [];
  }

  inspectVariables(): DebugVariableSnapshot {
    return this.currentEvent()?.variables ?? EMPTY_VARIABLES;
  }

  getBreakpoints(): readonly string[] {
    return this.breakpoints.list();
  }

  hasBreakpoint(reference: StatementReference): boolean {
    return this.breakpoints.has(reference);
  }

  setBreakpoint(reference: StatementReference): boolean {
    return this.breakpoints.set(reference);
  }

  clearBreakpoint(reference: StatementReference): boolean {
    return this.breakpoints.clear(reference);
  }

  isComplete(): boolean {
    return this.cursor >= this.trace.events.length;
  }

  getResult(): DebugExecutionLike {
    return this.trace.result;
  }

  getCurrentSnapshot(reason: DebugPauseReason = this.isComplete() ? "completed" : "ready"): DebugSnapshot {
    return this.snapshot(reason);
  }

  continueExecution(): DebugSnapshot {
    return this.run();
  }

  run(): DebugSnapshot {
    if (this.isComplete()) {
      return this.snapshot("completed");
    }
    const nextIndex = this.findNextIndex(this.cursor + 1, (event) => this.breakpoints.has(event.statement.id));
    if (nextIndex === null) {
      this.cursor = this.trace.events.length;
      return this.snapshot("completed");
    }
    this.cursor = nextIndex;
    return this.snapshot("breakpoint");
  }

  stepInto(): DebugSnapshot {
    if (this.isComplete()) {
      return this.snapshot("completed");
    }
    const nextIndex = this.cursor + 1;
    if (nextIndex >= this.trace.events.length) {
      this.cursor = this.trace.events.length;
      return this.snapshot("completed");
    }
    this.cursor = nextIndex;
    return this.snapshot("step");
  }

  stepOver(): DebugSnapshot {
    const current = this.currentEvent();
    if (!current) {
      return this.stepInto();
    }
    const currentDepth = current.callStack.length;
    const currentFrameId = current.callStack[current.callStack.length - 1]?.id ?? null;
    const nextIndex = this.findNextIndex(this.cursor + 1, (event) => {
      if (event.callStack.length < currentDepth) {
        return true;
      }
      if (event.callStack.length !== currentDepth || !currentFrameId) {
        return false;
      }
      const nextFrameId = event.callStack[event.callStack.length - 1]?.id ?? null;
      return nextFrameId === currentFrameId && !event.ancestorStatementIds.includes(current.statement.id);
    });
    if (nextIndex === null) {
      this.cursor = this.trace.events.length;
      return this.snapshot("completed");
    }
    this.cursor = nextIndex;
    return this.snapshot("step");
  }

  stepOut(): DebugSnapshot {
    const current = this.currentEvent();
    if (!current) {
      return this.stepInto();
    }
    const currentDepth = current.callStack.length;
    const nextIndex = this.findNextIndex(this.cursor + 1, (event) => event.callStack.length < currentDepth);
    if (nextIndex === null) {
      this.cursor = this.trace.events.length;
      return this.snapshot("completed");
    }
    this.cursor = nextIndex;
    return this.snapshot("step");
  }

  private currentEvent(): DebugTraceEvent | null {
    if (this.cursor < 0 || this.cursor >= this.trace.events.length) {
      return null;
    }
    return this.trace.events[this.cursor] ?? null;
  }

  private resolveStatementId(reference: StatementReference): string | null {
    if (typeof reference === "string") {
      return this.statementIds.has(reference) ? reference : null;
    }
    if ("id" in reference && typeof reference.id === "string") {
      return this.statementIds.has(reference.id) ? reference.id : null;
    }
    return this.statementObjects.get(reference) ?? null;
  }

  private findNextIndex(start: number, predicate: (event: DebugTraceEvent) => boolean): number | null {
    for (let index = start; index < this.trace.events.length; index++) {
      if (predicate(this.trace.events[index])) {
        return index;
      }
    }
    return null;
  }

  private snapshot(reason: DebugPauseReason): DebugSnapshot {
    const event = this.currentEvent();
    return {
      reason,
      statement: event?.statement ?? null,
      callStack: event?.callStack ?? [],
      variables: event?.variables ?? EMPTY_VARIABLES,
      isComplete: this.isComplete(),
      step: event?.step ?? this.trace.result.execution_log.length,
      executionLogSize: event?.executionLogSize ?? this.trace.result.execution_log.length,
      breakpoints: this.breakpoints.list(),
      returnValues: this.trace.result.returnValues,
    };
  }
}
