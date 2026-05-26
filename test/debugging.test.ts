import { describe, expect, it } from "vitest";
import type { DebugStatementLocation } from "../src/debugging.js";
import { parseTweedle } from "../src/tweedle-parser.js";
import { TweedleVM } from "../src/tweedle-vm.js";

const debugAst = parseTweedle(`class DebugScene {
  void helper(WholeNumber value) {
    WholeNumber local <- value + 1;
    TextString label <- "ready";
  }

  void run() {
    this.helper(2);
    WholeNumber after <- 7;
  }
}`);

function createSession() {
  return new TweedleVM().createDebugSession(debugAst, {
    entryMethod: "run",
    instanceName: "debugScene",
  });
}

function findStatement(
  statements: readonly DebugStatementLocation[],
  signature: string,
  path: string,
  kind: string,
): DebugStatementLocation {
  const statement = statements.find((entry) => entry.signature === signature && entry.path.join(".") === path && entry.kind === kind);
  expect(statement).toBeDefined();
  return statement!;
}

describe("TweedleVM debugging", () => {
  it("sets and clears breakpoints on statements", () => {
    const session = createSession();
    const helperLabel = findStatement(session.getStatements(), "DebugScene.helper/1", "1", "VariableDeclaration");

    expect(session.setBreakpoint(helperLabel)).toBe(true);
    expect(session.hasBreakpoint(helperLabel)).toBe(true);
    expect(session.getBreakpoints()).toEqual([helperLabel.id]);
    expect(session.clearBreakpoint(helperLabel.id)).toBe(true);
    expect(session.hasBreakpoint(helperLabel)).toBe(false);
  });

  it("manages breakpoints across statement ids, locations, and AST nodes", () => {
    const session = createSession();
    const runCall = findStatement(session.getStatements(), "DebugScene.run/0", "0", "MethodCall");
    const runAfter = findStatement(session.getStatements(), "DebugScene.run/0", "1", "VariableDeclaration");
    const helperLabel = findStatement(session.getStatements(), "DebugScene.helper/1", "1", "VariableDeclaration");

    expect(session.setBreakpoint(runAfter.id)).toBe(true);
    expect(session.setBreakpoint(helperLabel.statement)).toBe(true);
    expect(session.setBreakpoint(runCall)).toBe(true);
    expect(session.setBreakpoint("DebugScene.run/0:missing")).toBe(false);
    expect(session.hasBreakpoint(runCall.id)).toBe(true);
    expect(session.getBreakpoints()).toEqual([helperLabel.id, runAfter.id, runCall.id].sort());
    expect(session.clearBreakpoint(helperLabel.statement)).toBe(true);
    expect(session.clearBreakpoint("DebugScene.run/0:missing")).toBe(false);
    expect(session.getBreakpoints()).toEqual([runAfter.id, runCall.id].sort());
  });

  it("pauses at breakpoints with variable inspection and call stack display", () => {
    const session = createSession();
    const helperLabel = findStatement(session.getStatements(), "DebugScene.helper/1", "1", "VariableDeclaration");
    session.setBreakpoint(helperLabel);

    const snapshot = session.run();

    expect(snapshot.reason).toBe("breakpoint");
    expect(snapshot.statement?.id).toBe(helperLabel.id);
    expect(snapshot.callStack.map((frame) => frame.methodName)).toEqual(["run", "helper"]);
    expect(snapshot.callStack[1]?.receiverName).toBe("debugScene");
    expect(snapshot.variables.locals).toMatchObject({
      value: "2",
      local: "3",
    });
    expect(session.inspectVariables().visible).toMatchObject({
      value: "2",
      local: "3",
      this: {
        name: "debugScene",
        typeName: "DebugScene",
      },
    });
  });

  it("continues from breakpoint to breakpoint before completing", () => {
    const session = createSession();
    const helperLabel = findStatement(session.getStatements(), "DebugScene.helper/1", "1", "VariableDeclaration");
    const runAfter = findStatement(session.getStatements(), "DebugScene.run/0", "1", "VariableDeclaration");
    session.setBreakpoint(helperLabel);
    session.setBreakpoint(runAfter);

    const first = session.continueExecution();
    expect(first.reason).toBe("breakpoint");
    expect(first.statement?.id).toBe(helperLabel.id);
    expect(session.getCurrentStatement()?.id).toBe(helperLabel.id);
    expect(session.getCallStack().map((frame) => frame.methodName)).toEqual(["run", "helper"]);

    const second = session.continueExecution();
    expect(second.reason).toBe("breakpoint");
    expect(second.statement?.id).toBe(runAfter.id);
    expect(second.variables.visible).toMatchObject({
      this: {
        name: "debugScene",
        typeName: "DebugScene",
      },
    });
    expect(session.getCallStack().map((frame) => frame.methodName)).toEqual(["run"]);

    const completed = session.continueExecution();
    expect(completed.reason).toBe("completed");
    expect(completed.isComplete).toBe(true);
    expect(session.getCurrentStatement()).toBeNull();
    expect(session.inspectVariables()).toEqual({ locals: {}, fields: {}, visible: {} });
  });

  it("steps into called methods", () => {
    const session = createSession();

    const first = session.stepInto();
    expect(first.statement?.signature).toBe("DebugScene.run/0");
    expect(first.statement?.kind).toBe("MethodCall");

    const second = session.stepInto();
    expect(second.statement?.signature).toBe("DebugScene.helper/1");
    expect(second.statement?.kind).toBe("VariableDeclaration");
    expect(second.callStack.map((frame) => frame.methodName)).toEqual(["run", "helper"]);
  });

  it("steps over called methods", () => {
    const session = createSession();

    session.stepInto();
    const snapshot = session.stepOver();

    expect(snapshot.statement?.signature).toBe("DebugScene.run/0");
    expect(snapshot.statement?.path.join(".")).toBe("1");
    expect(snapshot.statement?.kind).toBe("VariableDeclaration");
    expect(snapshot.callStack.map((frame) => frame.methodName)).toEqual(["run"]);
  });

  it("steps out to the caller", () => {
    const session = createSession();

    session.stepInto();
    session.stepInto();
    const snapshot = session.stepOut();

    expect(snapshot.statement?.signature).toBe("DebugScene.run/0");
    expect(snapshot.statement?.path.join(".")).toBe("1");
    expect(snapshot.callStack.map((frame) => frame.methodName)).toEqual(["run"]);
  });
});
