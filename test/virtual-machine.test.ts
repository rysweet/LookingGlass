import { describe, expect, it } from "vitest";
import { ExpressionEvaluator } from "../src/expression-evaluator.js";
import { StatementExecutor } from "../src/statement-executor.js";
import {
  VirtualMachine,
  type VirtualMachineEnvironment,
  type VirtualMachineListener,
  type VirtualMachineMethod,
  type VirtualMachineProject,
  type VirtualMachineReceiver,
  type VirtualMachineState,
} from "../src/virtual-machine.js";

interface TestReceiver extends VirtualMachineReceiver {}
interface TestState extends VirtualMachineState<TestReceiver> {
  scopes: Map<string, unknown>[];
}
type TestStatement = { kind: string; value?: string };
type TestMethod = VirtualMachineMethod<TestStatement>;
type TestProject = VirtualMachineProject<TestMethod>;
interface TestEnvironment extends VirtualMachineEnvironment<TestReceiver, TestStatement> {}

function createReceiver(name: string, typeName = "Scene"): TestReceiver {
  return { name, typeName, fields: new Map() };
}

function createEnvironment(project: TestProject): TestEnvironment {
  const scene = createReceiver("scene");
  const listenerMap = new Map<string, VirtualMachineListener<TestReceiver, TestStatement>[]>();
  if (project.methods.length > 0) {
    listenerMap.set("whenReady", [{ body: [{ kind: "listener", value: "handled" }], parameterName: "event", self: scene }]);
  }
  return {
    stepCounter: 0,
    log: [],
    returnValues: new Map(),
    objectMap: new Map([[scene.name, scene]]),
    listenerMap,
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

function createVirtualMachine() {
  const dispatches: string[] = [];
  const evaluator = new ExpressionEvaluator<TestState, string, string>((state, expression) => {
    return `${state.currentSelf?.name ?? "global"}:${expression}`;
  });
  const executor = new StatementExecutor<TestStatement, TestState>({
    executeSequence: (statements, state) => {
      for (const statement of statements) {
        state.stepCounter += 1;
        if (statement.value !== undefined) {
          state.returned = true;
          state.returnValue = statement.value;
          state.returnValues.set(statement.kind, statement.value);
        }
      }
    },
  });
  const vm = new VirtualMachine<TestProject, TestReceiver, TestStatement, TestMethod, TestState, TestEnvironment>(
    {
      createExecutionEnvironment: createEnvironment,
      createState,
      resolveRuntimeMethod: (_state, typeName, methodName, argCount) => ({
        name: `${typeName}.${methodName}/${argCount}`,
        parameters: [],
        statements: [{ kind: methodName, value: `${methodName}-return` }],
      }),
      dispatchMethod: (target, args, state, self, declaringTypeName) => {
        dispatches.push(`${declaringTypeName}:${self?.name ?? "none"}:${target.name}:${args.join(",")}`);
        executor.executeSequence(target.statements, state);
        if (state.returnValue !== undefined) {
          state.returnValues.set(target.name, state.returnValue);
        }
      },
      scopeSet: (state, name, value) => {
        state.scopes[state.scopes.length - 1].set(name, value);
      },
    },
    evaluator,
    executor,
  );

  return { vm, dispatches };
}

describe("VirtualMachine", () => {
  it("executeProject records returned values for each method", () => {
    const { vm } = createVirtualMachine();
    const result = vm.executeProject({
      methods: [
        { name: "alpha", parameters: [], statements: [{ kind: "alpha", value: "A" }] },
        { name: "beta", parameters: [], statements: [{ kind: "beta" }] },
      ],
    });

    expect(result.returnValues.get("alpha")).toBe("A");
    expect(result.returnValues.has("beta")).toBe(false);
  });

  it("executeEntryPoint leaves environment untouched when receiver is missing", () => {
    const { vm, dispatches } = createVirtualMachine();
    const execution = vm.executeEntryPoint({ methods: [] }, { receiverName: "missing", entryMethod: "run" });

    expect(dispatches).toEqual([]);
    expect(execution.environment.stepCounter).toBe(0);
    expect(execution.result.returnValues.size).toBe(0);
  });

  it("invoke dispatches through hooks with receiver type metadata", () => {
    const { vm, dispatches } = createVirtualMachine();
    const environment = createEnvironment({ methods: [] });
    const receiver = environment.objectMap.get("scene")!;
    const state = createState(environment, receiver);

    vm.invoke(state, receiver, { name: "Scene.run/2", parameters: [], statements: [{ kind: "run", value: "done" }] }, ["left", "right"]);

    expect(dispatches).toEqual(["Scene:scene:Scene.run/2:left,right"]);
    expect(state.returnValues.get("Scene.run/2")).toBe("done");
  });

  it("dispatchEvent seeds payload only when listeners declare a parameter name", () => {
    const { vm } = createVirtualMachine();
    const environment = createEnvironment({ methods: [{ name: "run", parameters: [], statements: [] }] });
    environment.listenerMap.set("withoutPayload", [{ body: [{ kind: "noop" }], parameterName: null, self: null }]);

    const result = vm.dispatchEvent(environment, "whenReady", { kind: "payload" });
    vm.dispatchEvent(environment, "withoutPayload", { ignored: true });

    expect(result.returnValues.size).toBe(1);
    expect(environment.stepCounter).toBe(2);
  });

  it("evaluateExpressions and field helpers operate on shared receiver state", () => {
    const { vm } = createVirtualMachine();
    const environment = createEnvironment({ methods: [] });
    const receiver = environment.objectMap.get("scene")!;
    const state = createState(environment, receiver);

    vm.setField(receiver, "status", "ready");

    expect(vm.getField(receiver, "status")).toBe("ready");
    expect(vm.evaluateExpressions(state, ["left", "right"])).toEqual(["scene:left", "scene:right"]);
  });
});
