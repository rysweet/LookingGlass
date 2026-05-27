import {
  BreakpointManager as RunnerBreakpointManager,
  ExecutionContext,
  ProgramRunner,
  StepController as RunnerStepController,
  WatchExpression,
  type AliceProgramDefinition,
  type ExecutionFrameSnapshot,
  type ExecutionPauseReason,
  type ExecutionSnapshot,
  type ProgramValue,
} from "./program-execution.js";

export type BreakpointKind = "line" | "conditional" | "exception";

export interface DebuggerProgram extends AliceProgramDefinition {
  readonly lines?: Readonly<Record<string, number>>;
}

export interface DebugWatchValue {
  readonly expression: string;
  readonly value: unknown;
  readonly error: string | null;
}

export interface DebuggerSnapshot {
  readonly reason: ExecutionPauseReason | "exception";
  readonly statementId: string | null;
  readonly line: number | null;
  readonly stackFrames: readonly StackFrame[];
  readonly watches: readonly DebugWatchValue[];
  readonly consoleLines: readonly string[];
  readonly complete: boolean;
}

function visibleBindings(stackFrames: readonly StackFrame[]): Record<string, ProgramValue> {
  return stackFrames.reduce<Record<string, ProgramValue>>(
    (bindings, frame) => ({ ...bindings, ...frame.locals }),
    {},
  );
}

export class Breakpoint {
  constructor(
    public readonly kind: BreakpointKind,
    public readonly line: number | null,
    public readonly statementId: string | null = null,
    public readonly condition?: string,
    public readonly exceptionName?: string,
  ) {}

  static line(line: number, statementId?: string): Breakpoint {
    return new Breakpoint("line", line, statementId ?? null);
  }

  static conditional(line: number, condition: string, statementId?: string): Breakpoint {
    return new Breakpoint("conditional", line, statementId ?? null, condition);
  }

  static exception(exceptionName = "*"): Breakpoint {
    return new Breakpoint("exception", null, null, undefined, exceptionName);
  }
}

export class StackFrame {
  constructor(
    public readonly methodName: string,
    public readonly locals: Readonly<Record<string, ProgramValue>>,
  ) {}

  static fromSnapshot(frame: ExecutionFrameSnapshot): StackFrame {
    return new StackFrame(frame.methodName, { ...frame.locals });
  }

  getLocal(name: string): ProgramValue {
    return this.locals[name];
  }

  hasLocal(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.locals, name);
  }
}

export class VariableInspector {
  inspect(frame: StackFrame, name: string): ProgramValue {
    return frame.getLocal(name);
  }

  inspectVisible(stackFrames: readonly StackFrame[], name: string): ProgramValue {
    return visibleBindings(stackFrames)[name];
  }

  inspectAll(stackFrames: readonly StackFrame[]): Record<string, ProgramValue> {
    return visibleBindings(stackFrames);
  }
}

export class WatchList {
  private readonly expressions = new Set<string>();
  private readonly evaluator = new WatchExpression();

  add(expression: string): void {
    this.expressions.add(expression);
  }

  remove(expression: string): boolean {
    return this.expressions.delete(expression);
  }

  list(): string[] {
    return [...this.expressions].sort();
  }

  evaluate(context: ExecutionContext): DebugWatchValue[] {
    return this.list().map((expression) => {
      try {
        return {
          expression,
          value: this.evaluator.evaluate(expression, context),
          error: null,
        };
      } catch (error: unknown) {
        return {
          expression,
          value: undefined,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }
}

export class DebugConsole {
  constructor(private readonly readLines: () => string[]) {}

  getLines(): string[] {
    return [...this.readLines()];
  }

  latest(): string | null {
    const lines = this.readLines();
    return lines.length > 0 ? lines[lines.length - 1] : null;
  }
}

export class StepController {
  private readonly runnerController: RunnerStepController;

  constructor(private readonly runner: ProgramRunner) {
    this.runnerController = new RunnerStepController(runner);
  }

  continue(): ExecutionSnapshot {
    return this.runnerController.continue();
  }

  stepInto(): ExecutionSnapshot {
    return this.runnerController.stepInto();
  }

  stepOver(): ExecutionSnapshot {
    return this.runnerController.stepOver();
  }

  stepOut(): ExecutionSnapshot {
    return this.runnerController.stepOut();
  }

  current(): ExecutionSnapshot {
    return this.runnerController.snapshot("ready");
  }

  isComplete(): boolean {
    return this.current().complete;
  }
}

export class TweedleDebugger {
  readonly watches = new WatchList();
  readonly console: DebugConsole;
  readonly steps: StepController;

  private readonly runner: ProgramRunner;
  private lastSnapshot: ExecutionSnapshot;
  private readonly inspector = new VariableInspector();
  private readonly lineToStatementIds = new Map<number, string[]>();
  private readonly breakpoints = new Map<string, Breakpoint>();
  private readonly exceptionBreakpoints = new Set<string>();

  constructor(private readonly program: DebuggerProgram, now?: () => number) {
    this.runner = new ProgramRunner(program, now);
    this.console = new DebugConsole(() => this.runner.getConsoleLines());
    this.steps = new StepController(this.runner);
    this.lastSnapshot = this.steps.current();
    Object.entries(program.lines ?? {}).forEach(([statementId, line]) => {
      const existing = this.lineToStatementIds.get(line) ?? [];
      existing.push(statementId);
      existing.sort();
      this.lineToStatementIds.set(line, existing);
    });
  }

  private resolveBreakpoint(breakpoint: Breakpoint): Breakpoint {
    if (breakpoint.kind === "exception") {
      return breakpoint;
    }
    const statementId = breakpoint.statementId
      ?? (breakpoint.line !== null ? this.lineToStatementIds.get(breakpoint.line)?.[0] ?? null : null);
    if (!statementId) {
      throw new Error(`No statement found for line ${breakpoint.line ?? "unknown"}`);
    }
    return new Breakpoint(
      breakpoint.kind,
      breakpoint.line ?? this.program.lines?.[statementId] ?? null,
      statementId,
      breakpoint.condition,
      breakpoint.exceptionName,
    );
  }

  setBreakpoint(breakpoint: Breakpoint): Breakpoint {
    const resolved = this.resolveBreakpoint(breakpoint);
    if (resolved.kind === "exception") {
      this.exceptionBreakpoints.add(resolved.exceptionName ?? "*");
      return resolved;
    }
    this.breakpoints.set(resolved.statementId!, resolved);
    this.runner.breakpoints.set(resolved.statementId!, resolved.condition);
    return resolved;
  }

  removeBreakpoint(value: string | number): boolean {
    if (typeof value === "number") {
      const statementId = this.lineToStatementIds.get(value)?.[0];
      return statementId ? this.removeBreakpoint(statementId) : false;
    }
    const breakpoint = this.breakpoints.get(value);
    if (!breakpoint) {
      return false;
    }
    this.breakpoints.delete(value);
    return this.runner.breakpoints.remove(value);
  }

  toggleBreakpoint(line: number, condition?: string): Breakpoint | null {
    const statementId = this.lineToStatementIds.get(line)?.[0] ?? null;
    if (!statementId) {
      return null;
    }
    if (this.breakpoints.has(statementId)) {
      this.removeBreakpoint(statementId);
      return null;
    }
    return this.setBreakpoint(
      condition ? Breakpoint.conditional(line, condition, statementId) : Breakpoint.line(line, statementId),
    );
  }

  getBreakpoints(): Breakpoint[] {
    return [...this.breakpoints.values()].sort((left, right) => {
      const leftLine = left.line ?? Number.MAX_SAFE_INTEGER;
      const rightLine = right.line ?? Number.MAX_SAFE_INTEGER;
      return leftLine - rightLine || (left.statementId ?? "").localeCompare(right.statementId ?? "");
    });
  }

  getStackFrames(snapshot?: ExecutionSnapshot): StackFrame[] {
    return (snapshot ?? this.runner.getSnapshot()).callStack.map(StackFrame.fromSnapshot);
  }

  inspectVariable(name: string, snapshot?: ExecutionSnapshot): ProgramValue {
    return (snapshot ?? this.lastSnapshot).variables[name];
  }

  private contextFrom(snapshot?: ExecutionSnapshot): ExecutionContext {
    return ExecutionContext.fromSnapshot((snapshot ?? this.runner.getSnapshot()).callStack);
  }

  private toSnapshot(snapshot: ExecutionSnapshot): DebuggerSnapshot {
    this.lastSnapshot = snapshot;
    return {
      reason: snapshot.reason,
      statementId: snapshot.statement?.id ?? null,
      line: snapshot.statement ? this.program.lines?.[snapshot.statement.id] ?? null : null,
      stackFrames: this.getStackFrames(snapshot),
      watches: this.watches.evaluate(this.contextFrom(snapshot)),
      consoleLines: this.console.getLines(),
      complete: snapshot.complete,
    };
  }

  getSnapshot(): DebuggerSnapshot {
    return this.toSnapshot(this.steps.current());
  }

  continue(): DebuggerSnapshot {
    return this.toSnapshot(this.steps.continue());
  }

  stepInto(): DebuggerSnapshot {
    return this.toSnapshot(this.steps.stepInto());
  }

  stepOver(): DebuggerSnapshot {
    return this.toSnapshot(this.steps.stepOver());
  }

  stepOut(): DebuggerSnapshot {
    return this.toSnapshot(this.steps.stepOut());
  }

  hasExceptionBreakpoint(exceptionName = "*"): boolean {
    return this.exceptionBreakpoints.has(exceptionName) || this.exceptionBreakpoints.has("*");
  }

  getRunnerBreakpointManager(): RunnerBreakpointManager {
    return this.runner.breakpoints;
  }
}
