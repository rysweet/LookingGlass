import type {
  AliceFieldDefinition,
  AliceMethod,
  AliceObject,
  AliceProject,
  AliceStatement,
} from "./a3p-parser.js";
import {
  createTweedleRuntimeEnvironment,
  registerRuntimeObject,
  resolveRuntimeClassMethod,
  resolveTopLevelRuntimeMethod,
  type TweedleRuntimeClass,
  type TweedleRuntimeEnvironment,
} from "./tweedle-runtime.js";
import { ExpressionEvaluator } from "./expression-evaluator.js";
import { StatementExecutor } from "./statement-executor.js";
import { VirtualMachine } from "./virtual-machine.js";
import {
  createInitialScoreValues,
  resolveVisibleWorkflowBindings,
  validateAliceWorkflowState,
} from "./alice-workflow-state.js";
import { dispatchMethod, execMethodCall, registerMethodBodyExecutor, resolveRuntimeMethod } from "./tweedle-vm-builtins-dispatch.js";
import { instantiateSceneObjects } from "./tweedle-vm-builtins-runtime.js";
import { execCountLoop, execCountUpTo, execDoInOrder, execDoTogether, execEventListener, execForEach, execIfElse, execReturn, execThrow, execTryCatch, execVariableAssignment, execVariableDeclaration, execWhileLoop } from "./tweedle-vm-core-control.js";
import { AliceWorkflowRuntimeState, DebugRuntime, ExecutionResult, LogEntry, MAX_DEPTH, MAX_TOTAL_STEPS, RuntimeLambda, RuntimeObject, VMEnvironment, VMExecutionOptions, VMState } from "./tweedle-vm-core-types.js";
import { evaluateValue } from "./tweedle-vm-eval-core.js";
import { recordDebugEvent } from "./tweedle-vm-stack-debug.js";
import { popScope, pushScope, scopeSet } from "./tweedle-vm-stack-scope.js";

// ── Public API ─────────────────────────────────────────────────────────

function createExecutionEnvironment(project: AliceProject, executionOptions?: unknown): VMEnvironment {
  const options = (executionOptions as VMExecutionOptions | undefined) ?? {};
  const returnValues = new Map<string, unknown>();
  const log: LogEntry[] = [];
  const listenerMap = new Map<string, RuntimeLambda[]>();
  const runtime = createTweedleRuntimeEnvironment<RuntimeObject>(project);
  const objectMap = instantiateSceneObjects(project, runtime, log, returnValues, listenerMap, options.sceneBridge ?? null);
  const aliceWorkflowRuntime = options.aliceWorkflow
    ? createAliceWorkflowRuntime(options.aliceWorkflow)
    : null;

  return {
    log,
    returnValues,
    runtime,
    methodMap: runtime.methodTable,
    typeMap: runtime.classRegistry,
    objectMap,
    listenerMap,
    sceneBridge: options.sceneBridge ?? null,
    aliceWorkflowRuntime,
    stepCounter: 0,
  };
}


function createState(environment: VMEnvironment, currentSelf: RuntimeObject | null, debugRuntime?: DebugRuntime): VMState {
  const initialScope = environment.aliceWorkflowRuntime
    ? new Map<string, unknown>(environment.aliceWorkflowRuntime.scoreValues)
    : new Map<string, unknown>();
  return {
    stepCounter: environment.stepCounter,
    depth: 0,
    log: environment.log,
    returned: false,
    returnValue: undefined,
    scopes: [initialScope],
    runtime: environment.runtime,
    methodMap: environment.methodMap,
    typeMap: environment.typeMap,
    objectMap: environment.objectMap,
    currentSelf,
    returnValues: environment.returnValues,
    listenerMap: environment.listenerMap,
    sceneBridge: environment.sceneBridge,
    aliceWorkflowRuntime: environment.aliceWorkflowRuntime,
    debugRuntime,
  };
}

const expressionEvaluator = new ExpressionEvaluator<VMState, string, unknown>((state, expression) => evaluateValue(state, expression));

const statementExecutor = new StatementExecutor<AliceStatement, VMState>({
  executeSequence: (statements, state) => runStatements([...statements], state),
  executeScopedSequence: (statements, state) => runScopedStatements([...statements], state),
  executeStatement: (statement, state) => executeOne(statement, state),
});

export const virtualMachine = new VirtualMachine<AliceProject, RuntimeObject, AliceStatement, AliceMethod, VMState, VMEnvironment>({
  createExecutionEnvironment,
  createState: (environment, currentSelf, debugRuntime) =>
    createState(environment, currentSelf, debugRuntime as DebugRuntime | undefined),
  resolveRuntimeMethod,
  dispatchMethod,
  scopeSet,
}, expressionEvaluator, statementExecutor);

/** Execute all methods in an AliceProject, returning a structured execution log. */
export function executeProject(project: AliceProject, options: VMExecutionOptions = {}): ExecutionResult {
  const environment = createExecutionEnvironment(project, options);

  for (const method of project.methods) {
    const state = createState(environment, null);
    statementExecutor.executeSequence(method.statements, state);
    environment.stepCounter = state.stepCounter;

    if (state.returned && state.returnValue !== undefined) {
      environment.returnValues.set(method.name, state.returnValue);
    }
  }
  return buildExecutionResult(environment);
}

export function executeEntryPoint(
  project: AliceProject,
  entryPointOptions: import("./virtual-machine.js").EntryPointExecutionOptions,
  options: VMExecutionOptions = {},
): { environment: VMEnvironment; result: ExecutionResult } {
  const execution = virtualMachine.executeEntryPoint(project, entryPointOptions, options);
  return {
    environment: execution.environment,
    result: buildExecutionResult(execution.environment),
  };
}

// ── Statement execution ────────────────────────────────────────────────

export function runStatements(stmts: AliceStatement[], state: VMState): void {
  for (const stmt of stmts) {
    if (state.returned) break;
    if (state.stepCounter >= MAX_TOTAL_STEPS) break;
    executeOne(stmt, state);
  }
}

export function runScopedStatements(stmts: AliceStatement[], state: VMState): void {
  if (stmts.length === 0) {
    return;
  }
  pushScope(state);
  state.depth++;
  runStatements(stmts, state);
  state.depth--;
  popScope(state);
}

registerMethodBodyExecutor(runStatements);

function executeOne(stmt: AliceStatement, state: VMState): void {
  if (state.returned) return;
  if (state.stepCounter >= MAX_TOTAL_STEPS) return;

  recordDebugEvent(state, stmt);

  if (state.depth >= MAX_DEPTH) {
    state.stepCounter++;
    state.log.push({
      step: state.stepCounter,
      kind: "skipped",
      detail: `Depth cap exceeded (${MAX_DEPTH}) for ${stmt.kind}`,
    });
    return;
  }

  const statementId = state.debugRuntime?.statementLookup.get(stmt)?.id ?? null;
  if (statementId) {
    state.debugRuntime?.activeStatementIds.push(statementId);
  }

  try {
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
      case "CountUpTo":
        execCountUpTo(stmt, state);
        break;
      case "WhileLoop":
        execWhileLoop(stmt, state);
        break;
      case "ForEach":
        execForEach(stmt, state);
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
    advanceAliceWorkflowRuntime(state, 0.1);
  } finally {
    if (statementId) {
      state.debugRuntime?.activeStatementIds.pop();
    }
  }
}

function createAliceWorkflowRuntime(workflow: unknown): AliceWorkflowRuntimeState {
  const validated = validateAliceWorkflowState(workflow);
  const scoreValues = createInitialScoreValues(validated);
  return {
    workflow: validated,
    scoreValues,
    elapsedSeconds: 0,
    visibleWorkflowBindings: resolveVisibleWorkflowBindings(validated, { scoreValues }),
  };
}

function buildExecutionResult(environment: VMEnvironment): ExecutionResult {
  const workflowRuntime = environment.aliceWorkflowRuntime;
  if (!workflowRuntime) {
    return {
      execution_log: environment.log,
      returnValues: environment.returnValues,
      scoreValues: new Map(),
      visibleWorkflowBindings: [],
    };
  }

  workflowRuntime.visibleWorkflowBindings = resolveVisibleWorkflowBindings(workflowRuntime.workflow, {
    scoreValues: workflowRuntime.scoreValues,
    elapsedSeconds: workflowRuntime.elapsedSeconds,
  });
  return {
    execution_log: environment.log,
    returnValues: environment.returnValues,
    scoreValues: new Map(workflowRuntime.scoreValues),
    visibleWorkflowBindings: workflowRuntime.visibleWorkflowBindings,
  };
}

function advanceAliceWorkflowRuntime(state: VMState, deltaSeconds: number): void {
  const workflowRuntime = state.aliceWorkflowRuntime;
  if (!workflowRuntime) {
    return;
  }
  workflowRuntime.elapsedSeconds += deltaSeconds;
  workflowRuntime.visibleWorkflowBindings = resolveVisibleWorkflowBindings(workflowRuntime.workflow, {
    scoreValues: workflowRuntime.scoreValues,
    elapsedSeconds: workflowRuntime.elapsedSeconds,
  });
}
