export type ProgramValue = number | string | boolean | null | undefined;
export type ExecutionPauseReason = "ready" | "step" | "breakpoint" | "completed";

export type ProgramExpression =
  | ProgramValue
  | { readonly var: string }
  | { readonly add: readonly [ProgramExpression, ProgramExpression] }
  | { readonly sub: readonly [ProgramExpression, ProgramExpression] }
  | { readonly mul: readonly [ProgramExpression, ProgramExpression] }
  | { readonly div: readonly [ProgramExpression, ProgramExpression] };

export type ProgramInstruction =
  | { readonly id: string; readonly kind: "assign"; readonly name: string; readonly value: ProgramExpression }
  | { readonly id: string; readonly kind: "print"; readonly expression: ProgramExpression }
  | { readonly id: string; readonly kind: "call"; readonly method: string; readonly args?: readonly ProgramExpression[]; readonly assignTo?: string }
  | { readonly id: string; readonly kind: "return"; readonly expression?: ProgramExpression };

export interface ProgramMethod {
  readonly name: string;
  readonly parameters?: readonly string[];
  readonly body: readonly ProgramInstruction[];
}

export interface AliceProgramDefinition {
  readonly entry: string;
  readonly methods: readonly ProgramMethod[];
}

export interface ExecutionFrameSnapshot {
  readonly methodName: string;
  readonly locals: Readonly<Record<string, ProgramValue>>;
}

export interface ExecutionEvent {
  readonly statement: ProgramInstruction;
  readonly callStack: readonly ExecutionFrameSnapshot[];
  readonly variables: Readonly<Record<string, ProgramValue>>;
  readonly consoleLines: readonly string[];
  readonly step: number;
}

export interface ExecutionSnapshot {
  readonly reason: ExecutionPauseReason;
  readonly statement: ProgramInstruction | null;
  readonly callStack: readonly ExecutionFrameSnapshot[];
  readonly variables: Readonly<Record<string, ProgramValue>>;
  readonly consoleLines: readonly string[];
  readonly breakpoints: readonly string[];
  readonly complete: boolean;
  readonly step: number;
}

export interface BreakpointDefinition {
  readonly statementId: string;
  readonly condition?: string;
}

export interface ExecutionProfileEntry {
  readonly statementId: string;
  readonly executions: number;
  readonly totalMs: number;
}

interface MutableFrame {
  readonly methodName: string;
  readonly locals: Record<string, ProgramValue>;
}

function cloneFrame(frame: MutableFrame | ExecutionFrameSnapshot): ExecutionFrameSnapshot {
  return {
    methodName: frame.methodName,
    locals: { ...frame.locals },
  };
}

function cloneVariables(variables: Record<string, ProgramValue>): Record<string, ProgramValue> {
  return { ...variables };
}

function isReference(expression: ProgramExpression): expression is { readonly var: string } {
  return typeof expression === "object" && expression !== null && "var" in expression;
}

function evaluateNumeric(left: ProgramValue, right: ProgramValue, operator: (a: number, b: number) => number): number {
  return operator(Number(left ?? 0), Number(right ?? 0));
}

export class ExecutionContext {
  private readonly frames: MutableFrame[] = [];

  pushFrame(methodName: string, locals: Record<string, ProgramValue>): void {
    this.frames.push({ methodName, locals: { ...locals } });
  }

  popFrame(): MutableFrame | undefined {
    return this.frames.pop();
  }

  currentFrame(): MutableFrame | undefined {
    return this.frames[this.frames.length - 1];
  }

  setVariable(name: string, value: ProgramValue): void {
    const frame = this.currentFrame();
    if (!frame) {
      throw new Error(`cannot set variable '${name}' without an active frame`);
    }
    frame.locals[name] = value;
  }

  getVariable(name: string): ProgramValue {
    for (let index = this.frames.length - 1; index >= 0; index -= 1) {
      if (Object.prototype.hasOwnProperty.call(this.frames[index].locals, name)) {
        return this.frames[index].locals[name];
      }
    }
    return undefined;
  }

  visibleBindings(): Record<string, ProgramValue> {
    return this.frames.reduce<Record<string, ProgramValue>>((bindings, frame) => ({ ...bindings, ...frame.locals }), {});
  }

  snapshot(): ExecutionFrameSnapshot[] {
    return this.frames.map((frame) => cloneFrame(frame));
  }

  static fromSnapshot(callStack: readonly ExecutionFrameSnapshot[]): ExecutionContext {
    const context = new ExecutionContext();
    callStack.forEach((frame) => context.pushFrame(frame.methodName, frame.locals));
    return context;
  }
}

export class ConsoleOutput {
  private readonly lines: string[] = [];

  print(value: ProgramValue): void {
    this.lines.push(String(value ?? ""));
  }

  getLines(): string[] {
    return [...this.lines];
  }
}

export class WatchExpression {
  evaluate(expression: string, context: ExecutionContext): unknown {
    const bindings = context.visibleBindings();
    const keys = Object.keys(bindings);
    const values = keys.map((key) => bindings[key]);
    return new Function(...keys, `return (${expression});`)(...values);
  }
}

export class BreakpointManager {
  private readonly breakpoints = new Map<string, string | undefined>();

  set(statementId: string, condition?: string): void {
    this.breakpoints.set(statementId, condition);
  }

  remove(statementId: string): boolean {
    return this.breakpoints.delete(statementId);
  }

  has(statementId: string): boolean {
    return this.breakpoints.has(statementId);
  }

  list(): BreakpointDefinition[] {
    return [...this.breakpoints.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([statementId, condition]) => ({ statementId, condition }));
  }

  shouldPause(event: ExecutionEvent, watches = new WatchExpression()): boolean {
    const condition = this.breakpoints.get(event.statement.id);
    if (!this.breakpoints.has(event.statement.id)) {
      return false;
    }
    if (!condition) {
      return true;
    }
    return Boolean(watches.evaluate(condition, ExecutionContext.fromSnapshot(event.callStack)));
  }
}

export class ExecutionProfiler {
  private readonly totals = new Map<string, { executions: number; totalMs: number }>();

  record(statementId: string, durationMs: number): void {
    const entry = this.totals.get(statementId) ?? { executions: 0, totalMs: 0 };
    entry.executions += 1;
    entry.totalMs += durationMs;
    this.totals.set(statementId, entry);
  }

  getEntries(): ExecutionProfileEntry[] {
    return [...this.totals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([statementId, value]) => ({ statementId, executions: value.executions, totalMs: value.totalMs }));
  }
}

export class ProgramRunner {
  readonly breakpoints = new BreakpointManager();
  readonly console = new ConsoleOutput();
  readonly profiler = new ExecutionProfiler();
  readonly watches = new WatchExpression();

  private readonly methods = new Map<string, ProgramMethod>();
  private readonly events: ExecutionEvent[] = [];
  private readonly stepController: StepController;

  constructor(program: AliceProgramDefinition, private readonly now: () => number = () => Date.now()) {
    for (const method of program.methods) {
      this.methods.set(method.name, method);
    }
    if (!this.methods.has(program.entry)) {
      throw new Error(`unknown entry method: ${program.entry}`);
    }
    const context = new ExecutionContext();
    this.executeMethod(program.entry, [], context);
    this.stepController = new StepController(this);
  }

  run(): ExecutionSnapshot {
    return this.stepController.continue();
  }

  continue(): ExecutionSnapshot {
    return this.stepController.continue();
  }

  stepInto(): ExecutionSnapshot {
    return this.stepController.stepInto();
  }

  stepOver(): ExecutionSnapshot {
    return this.stepController.stepOver();
  }

  stepOut(): ExecutionSnapshot {
    return this.stepController.stepOut();
  }

  getSnapshot(reason: ExecutionPauseReason = this.stepController.isComplete() ? "completed" : "ready"): ExecutionSnapshot {
    return this.stepController.snapshot(reason);
  }

  getConsoleLines(): string[] {
    return this.console.getLines();
  }

  getProfilerEntries(): ExecutionProfileEntry[] {
    return this.profiler.getEntries();
  }

  getCurrentContext(): ExecutionContext {
    return ExecutionContext.fromSnapshot(this.stepController.currentEvent()?.callStack ?? []);
  }

  getEvents(): readonly ExecutionEvent[] {
    return this.events;
  }

  currentEvent(): ExecutionEvent | null {
    return this.stepController.currentEvent();
  }

  private executeMethod(methodName: string, args: readonly ProgramValue[], context: ExecutionContext): ProgramValue {
    const method = this.methods.get(methodName);
    if (!method) {
      throw new Error(`unknown method: ${methodName}`);
    }
    const parameterNames = [...(method.parameters ?? [])];
    const locals = Object.fromEntries(parameterNames.map((name, index) => [name, args[index]])) as Record<string, ProgramValue>;
    context.pushFrame(method.name, locals);
    for (const statement of method.body) {
      this.events.push({
        statement,
        callStack: context.snapshot(),
        variables: cloneVariables(context.visibleBindings()),
        consoleLines: this.console.getLines(),
        step: this.events.length,
      });
      const startedAt = this.now();
      let returnValue: ProgramValue | typeof NO_RETURN = NO_RETURN;
      switch (statement.kind) {
      case "assign":
        context.setVariable(statement.name, this.evaluateExpression(statement.value, context));
        break;
      case "print":
        this.console.print(this.evaluateExpression(statement.expression, context));
        break;
      case "call": {
        const evaluatedArgs = [...(statement.args ?? [])].map((expression) => this.evaluateExpression(expression, context));
        const callResult = this.executeMethod(statement.method, evaluatedArgs, context);
        if (statement.assignTo) {
          context.setVariable(statement.assignTo, callResult);
        }
        break;
      }
      case "return":
        returnValue = statement.expression === undefined ? undefined : this.evaluateExpression(statement.expression, context);
        break;
      default:
        statement satisfies never;
      }
      this.profiler.record(statement.id, Math.max(0, this.now() - startedAt));
      if (returnValue !== NO_RETURN) {
        context.popFrame();
        return returnValue;
      }
    }
    context.popFrame();
    return undefined;
  }

  private evaluateExpression(expression: ProgramExpression, context: ExecutionContext): ProgramValue {
    if (isReference(expression)) {
      return context.getVariable(expression.var);
    }
    if (typeof expression !== "object" || expression === null) {
      return expression;
    }
    if ("add" in expression) {
      const [left, right] = expression.add;
      return evaluateNumeric(this.evaluateExpression(left, context), this.evaluateExpression(right, context), (a, b) => a + b);
    }
    if ("sub" in expression) {
      const [left, right] = expression.sub;
      return evaluateNumeric(this.evaluateExpression(left, context), this.evaluateExpression(right, context), (a, b) => a - b);
    }
    if ("mul" in expression) {
      const [left, right] = expression.mul;
      return evaluateNumeric(this.evaluateExpression(left, context), this.evaluateExpression(right, context), (a, b) => a * b);
    }
    if ("div" in expression) {
      const [left, right] = expression.div;
      return evaluateNumeric(this.evaluateExpression(left, context), this.evaluateExpression(right, context), (a, b) => a / b);
    }
    return undefined;
  }
}

const NO_RETURN = Symbol("no-return");

export class StepController {
  private cursor = -1;

  constructor(private readonly runner: ProgramRunner) {}

  isComplete(): boolean {
    return this.cursor >= this.runner.getEvents().length;
  }

  currentEvent(): ExecutionEvent | null {
    const events = this.runner.getEvents();
    if (this.cursor < 0 || this.cursor >= events.length) {
      return null;
    }
    return events[this.cursor] ?? null;
  }

  continue(): ExecutionSnapshot {
    const events = this.runner.getEvents();
    for (let index = this.cursor + 1; index < events.length; index += 1) {
      if (this.runner.breakpoints.shouldPause(events[index], this.runner.watches)) {
        this.cursor = index;
        return this.snapshot("breakpoint");
      }
    }
    this.cursor = events.length;
    return this.snapshot("completed");
  }

  stepInto(): ExecutionSnapshot {
    const events = this.runner.getEvents();
    const nextIndex = this.cursor + 1;
    if (nextIndex >= events.length) {
      this.cursor = events.length;
      return this.snapshot("completed");
    }
    this.cursor = nextIndex;
    return this.snapshot("step");
  }

  stepOver(): ExecutionSnapshot {
    const current = this.currentEvent();
    if (!current) {
      return this.stepInto();
    }
    const events = this.runner.getEvents();
    const currentDepth = current.callStack.length;
    const currentMethod = current.callStack[currentDepth - 1]?.methodName ?? null;
    for (let index = this.cursor + 1; index < events.length; index += 1) {
      const event = events[index];
      const depth = event.callStack.length;
      const eventMethod = event.callStack[depth - 1]?.methodName ?? null;
      if (depth < currentDepth || (depth === currentDepth && eventMethod === currentMethod)) {
        this.cursor = index;
        return this.snapshot("step");
      }
    }
    this.cursor = events.length;
    return this.snapshot("completed");
  }

  stepOut(): ExecutionSnapshot {
    const current = this.currentEvent();
    if (!current) {
      return this.stepInto();
    }
    const events = this.runner.getEvents();
    const currentDepth = current.callStack.length;
    for (let index = this.cursor + 1; index < events.length; index += 1) {
      if (events[index].callStack.length < currentDepth) {
        this.cursor = index;
        return this.snapshot("step");
      }
    }
    this.cursor = events.length;
    return this.snapshot("completed");
  }

  snapshot(reason: ExecutionPauseReason): ExecutionSnapshot {
    const event = this.currentEvent();
    return {
      reason,
      statement: event?.statement ?? null,
      callStack: event?.callStack ?? [],
      variables: event?.variables ?? {},
      consoleLines: event?.consoleLines ?? this.runner.getConsoleLines(),
      breakpoints: this.runner.breakpoints.list().map((breakpoint) => breakpoint.statementId),
      complete: this.isComplete(),
      step: event?.step ?? this.runner.getEvents().length,
    };
  }
}
