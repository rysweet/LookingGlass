import { describe, expect, it } from "vitest";
import { ExpressionEvaluator } from "../src/expression-evaluator.js";
import { StatementExecutor } from "../src/statement-executor.js";
import { VirtualMachine, type VirtualMachineEnvironment, type VirtualMachineListener, type VirtualMachineMethod, type VirtualMachineProject, type VirtualMachineReceiver, type VirtualMachineState } from "../src/virtual-machine.js";

interface TestReceiver extends VirtualMachineReceiver {}
interface TestState extends VirtualMachineState<TestReceiver> {
  scopes: Map<string, unknown>[];
}
type TestStatement = { kind: string; value?: string };
type TestMethod = VirtualMachineMethod<TestStatement>;
type TestProject = VirtualMachineProject<TestMethod>;
interface TestEnvironment extends VirtualMachineEnvironment<TestReceiver, TestStatement> {}

function createReceiver(name: string): TestReceiver {
  return { name, typeName: "TestType", fields: new Map() };
}

function createEnvironment(project: TestProject): TestEnvironment {
  const receiver = createReceiver("scene");
  const listeners = new Map<string, VirtualMachineListener<TestReceiver, TestStatement>[]>();
  if (project.methods.length > 0) {
    listeners.set("whenReady", [{ body: [{ kind: "EventBody" }], parameterName: "event", self: receiver }]);
  }
  return {
    stepCounter: 0,
    log: [],
    returnValues: new Map(),
    objectMap: new Map([[receiver.name, receiver]]),
    listenerMap: listeners,
  };
}

function createState(environment: TestEnvironment, currentSelf: TestReceiver | null): TestState {
  return {
    stepCounter: environment.stepCounter,
    returned: false,
    returnValue: undefined,
    currentSelf,
    returnValues: environment.returnValues,
    scopes: [new Map()],
  };
}

describe("virtual machine infrastructure", () => {
  it("ExpressionEvaluator evaluates batches of expressions", () => {
    const evaluator = new ExpressionEvaluator<{ values: string[] }, string, string>((state, expression) => `${expression}:${state.values.length}`);

    expect(evaluator.evaluateAll({ values: ["a", "b"] }, ["left", "right"])).toEqual(["left:2", "right:2"]);
  });

  it("StatementExecutor delegates sequence, scoped, and single-statement execution", () => {
    const calls: string[] = [];
    const executor = new StatementExecutor<TestStatement, TestState>({
      executeSequence: (statements) => calls.push(`sequence:${statements.length}`),
      executeScopedSequence: (statements) => calls.push(`scoped:${statements.length}`),
      executeStatement: (statement) => calls.push(`single:${statement.kind}`),
    });
    const state = createState(createEnvironment({ methods: [] }), null);

    executor.executeSequence([{ kind: "A" }, { kind: "B" }], state);
    executor.executeScopedSequence([{ kind: "Scoped" }], state);
    executor.executeStatement({ kind: "One" }, state);

    expect(calls).toEqual(["sequence:2", "scoped:1", "single:One"]);
  });

  it("VirtualMachine dispatches entry-point methods and exposes field access helpers", () => {
    const invoked: string[] = [];
    const evaluator = new ExpressionEvaluator<TestState, string, unknown>((_state, expression) => expression.toUpperCase());
    const executor = new StatementExecutor<TestStatement, TestState>({
      executeSequence: (statements, state) => {
        for (const statement of statements) {
          state.stepCounter += 1;
          state.returnValue = statement.value ?? statement.kind;
          state.returned = true;
        }
      },
    });
    const vm = new VirtualMachine<TestProject, TestReceiver, TestStatement, TestMethod, TestState, TestEnvironment>({
      createExecutionEnvironment: createEnvironment,
      createState,
      resolveRuntimeMethod: (_state, _typeName, methodName) => ({ name: methodName, parameters: [], statements: [{ kind: "Return", value: "done" }] }),
      dispatchMethod: (target, args, state, self) => {
        invoked.push(`${self?.name}.${target.name}(${args.join(",")})`);
        executor.executeSequence(target.statements, state);
        state.returnValues.set(target.name, state.returnValue);
      },
      scopeSet: (state, name, value) => state.scopes[state.scopes.length - 1].set(name, value),
    }, evaluator, executor);

    const execution = vm.executeEntryPoint({ methods: [{ name: "run", parameters: [], statements: [] }] }, {
      receiverName: "scene",
      entryMethod: "run",
      args: ["value"],
    });
    const receiver = execution.environment.objectMap.get("scene")!;
    vm.setField(receiver, "status", "ready");

    expect(invoked).toEqual(["scene.run(value)"]);
    expect(execution.result.returnValues.get("run")).toBe("done");
    expect(vm.getField(receiver, "status")).toBe("ready");
    expect(vm.evaluateExpressions(createState(execution.environment, receiver), ["left", "right"])).toEqual(["LEFT", "RIGHT"]);
  });

  it("VirtualMachine dispatchEvent seeds payload into listener scope", () => {
    const seenPayloads: unknown[] = [];
    const evaluator = new ExpressionEvaluator<TestState, string, unknown>((_state, expression) => expression);
    const executor = new StatementExecutor<TestStatement, TestState>({
      executeSequence: (_statements, state) => {
        seenPayloads.push(state.scopes[state.scopes.length - 1].get("event"));
        state.stepCounter += 1;
      },
    });
    const vm = new VirtualMachine<TestProject, TestReceiver, TestStatement, TestMethod, TestState, TestEnvironment>({
      createExecutionEnvironment: createEnvironment,
      createState,
      resolveRuntimeMethod: () => null,
      dispatchMethod: () => undefined,
      scopeSet: (state, name, value) => state.scopes[state.scopes.length - 1].set(name, value),
    }, evaluator, executor);

    const environment = createEnvironment({ methods: [{ name: "run", parameters: [], statements: [] }] });
    const result = vm.dispatchEvent(environment, "whenReady", { kind: "scene-ready" });

    expect(seenPayloads).toEqual([{ kind: "scene-ready" }]);
    expect(result.execution_log).toBe(environment.log);
  });
});
