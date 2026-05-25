import type { ExpressionEvaluator } from "./expression-evaluator.js";
import type { StatementExecutor } from "./statement-executor.js";

export interface VirtualMachineState<Receiver extends VirtualMachineReceiver> {
  stepCounter: number;
  returned: boolean;
  returnValue: unknown;
  currentSelf: Receiver | null;
  returnValues: Map<string, unknown>;
}

export interface VirtualMachineMethod<Statement> {
  name: string;
  parameters: Array<{ name: string }>;
  statements: Statement[];
}

export interface VirtualMachineProject<Method> {
  methods: Method[];
}

export interface VirtualMachineReceiver {
  name: string;
  typeName: string;
  fields: Map<string, unknown>;
}

export interface VirtualMachineListener<Receiver extends VirtualMachineReceiver, Statement> {
  body: Statement[];
  parameterName: string | null;
  self: Receiver | null;
}

export interface VirtualMachineEnvironment<Receiver extends VirtualMachineReceiver, Statement> {
  stepCounter: number;
  log: unknown[];
  returnValues: Map<string, unknown>;
  objectMap: Map<string, Receiver>;
  listenerMap: Map<string, VirtualMachineListener<Receiver, Statement>[]>;
}

export interface VirtualMachineHooks<
  Project extends VirtualMachineProject<Method>,
  Receiver extends VirtualMachineReceiver,
  Statement,
  Method extends VirtualMachineMethod<Statement>,
  State extends VirtualMachineState<Receiver>,
  Environment extends VirtualMachineEnvironment<Receiver, Statement>,
> {
  createExecutionEnvironment: (project: Project) => Environment;
  createState: (environment: Environment, currentSelf: Receiver | null, debugRuntime?: unknown) => State;
  resolveRuntimeMethod: (state: State, typeName: string, methodName: string, argCount: number) => Method | null;
  dispatchMethod: (
    target: Method,
    args: string[],
    state: State,
    self?: Receiver | null,
    declaringTypeName?: string | null,
  ) => void;
  scopeSet: (state: State, name: string, value: unknown) => void;
}

export interface EntryPointExecutionOptions {
  receiverName: string;
  entryMethod: string;
  args?: string[];
  debugRuntime?: unknown;
}

export class VirtualMachine<
  Project extends VirtualMachineProject<Method>,
  Receiver extends VirtualMachineReceiver,
  Statement,
  Method extends VirtualMachineMethod<Statement>,
  State extends VirtualMachineState<Receiver>,
  Environment extends VirtualMachineEnvironment<Receiver, Statement>,
> {
  constructor(
    private readonly hooks: VirtualMachineHooks<Project, Receiver, Statement, Method, State, Environment>,
    private readonly expressionEvaluator: ExpressionEvaluator<State, string, unknown>,
    private readonly statementExecutor: StatementExecutor<Statement, State>,
  ) {}

  executeProject(project: Project): { execution_log: Environment["log"]; returnValues: Map<string, unknown> } {
    const environment = this.hooks.createExecutionEnvironment(project);

    for (const method of project.methods) {
      const state = this.hooks.createState(environment, null);
      this.statementExecutor.executeSequence(method.statements, state);
      environment.stepCounter = state.stepCounter;

      if (state.returned && state.returnValue !== undefined) {
        environment.returnValues.set(method.name, state.returnValue);
      }
    }

    return { execution_log: environment.log, returnValues: environment.returnValues };
  }

  executeEntryPoint(
    project: Project,
    options: EntryPointExecutionOptions,
  ): { environment: Environment; result: { execution_log: Environment["log"]; returnValues: Map<string, unknown> } } {
    const environment = this.hooks.createExecutionEnvironment(project);
    const receiver = environment.objectMap.get(options.receiverName) ?? null;

    if (!receiver || !options.entryMethod) {
      return {
        environment,
        result: { execution_log: environment.log, returnValues: environment.returnValues },
      };
    }

    const state = this.hooks.createState(environment, receiver, options.debugRuntime);
    const runtimeMethod = this.hooks.resolveRuntimeMethod(
      state,
      receiver.typeName,
      options.entryMethod,
      options.args?.length ?? 0,
    );

    if (runtimeMethod) {
      this.invoke(state, receiver, runtimeMethod, options.args ?? []);
      environment.stepCounter = state.stepCounter;
    }

    return {
      environment,
      result: { execution_log: environment.log, returnValues: environment.returnValues },
    };
  }

  evaluateExpressions(state: State, expressions: readonly string[]): unknown[] {
    return this.expressionEvaluator.evaluateAll(state, expressions);
  }

  invoke(state: State, receiver: Receiver, method: Method, args: string[]): void {
    this.hooks.dispatchMethod(method, args, state, receiver, receiver.typeName);
  }

  dispatchEvent(
    environment: Environment,
    eventName: string,
    payload: unknown = null,
  ): { execution_log: Environment["log"]; returnValues: Map<string, unknown> } {
    const listeners = environment.listenerMap.get(eventName) ?? [];
    for (const listener of listeners) {
      const state = this.hooks.createState(environment, listener.self);
      if (listener.parameterName) {
        this.hooks.scopeSet(state, listener.parameterName, payload);
      }
      this.statementExecutor.executeSequence(listener.body, state);
      environment.stepCounter = state.stepCounter;
    }
    return { execution_log: environment.log, returnValues: environment.returnValues };
  }

  getField(receiver: Receiver, fieldName: string): unknown {
    return receiver.fields.get(fieldName);
  }

  setField(receiver: Receiver, fieldName: string, value: unknown): void {
    receiver.fields.set(fieldName, value);
  }
}
