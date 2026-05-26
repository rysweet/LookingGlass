import { describe, expect, it } from "vitest";
import { StatementExecutor } from "../src/statement-executor.js";

describe("StatementExecutor", () => {
  it("delegates sequences directly to the required hook", () => {
    const calls: string[] = [];
    const executor = new StatementExecutor<string, { scope: string }>({
      executeSequence: (statements, state) => calls.push(`${state.scope}:${statements.join(",")}`),
    });

    executor.executeSequence(["alpha", "beta"], { scope: "root" });

    expect(calls).toEqual(["root:alpha,beta"]);
  });

  it("falls back to executeSequence when scoped execution is not provided", () => {
    const calls: string[] = [];
    const executor = new StatementExecutor<string, { scope: string }>({
      executeSequence: (statements, state) => calls.push(`sequence:${state.scope}:${statements.length}`),
    });

    executor.executeScopedSequence(["branch"], { scope: "inner" });

    expect(calls).toEqual(["sequence:inner:1"]);
  });

  it("wraps single statements in a one-item sequence when no direct handler exists", () => {
    const calls: string[] = [];
    const executor = new StatementExecutor<string, { scope: string }>({
      executeSequence: (statements, state) => calls.push(`sequence:${state.scope}:${statements.join(",")}`),
    });

    executor.executeStatement("only", { scope: "leaf" });

    expect(calls).toEqual(["sequence:leaf:only"]);
  });

  it("prefers explicit scoped and single-statement hooks when present", () => {
    const calls: string[] = [];
    const executor = new StatementExecutor<string, { scope: string }>({
      executeSequence: (statements) => calls.push(`sequence:${statements.length}`),
      executeScopedSequence: (statements, state) => calls.push(`scoped:${state.scope}:${statements.join(",")}`),
      executeStatement: (statement, state) => calls.push(`single:${state.scope}:${statement}`),
    });

    executor.executeScopedSequence(["left", "right"], { scope: "inner" });
    executor.executeStatement("terminal", { scope: "inner" });

    expect(calls).toEqual(["scoped:inner:left,right", "single:inner:terminal"]);
  });
});
