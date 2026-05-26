import { describe, expect, it } from "vitest";
import { ExpressionEvaluator } from "../src/expression-evaluator.js";

describe("ExpressionEvaluator", () => {
  it("delegates single-expression evaluation to the supplied implementation", () => {
    const calls: Array<{ state: { factor: number }; expression: number }> = [];
    const evaluator = new ExpressionEvaluator<{ factor: number }, number, number>((state, expression) => {
      calls.push({ state, expression });
      return state.factor * expression;
    });

    expect(evaluator.evaluate({ factor: 3 }, 4)).toBe(12);
    expect(calls).toEqual([{ state: { factor: 3 }, expression: 4 }]);
  });

  it("evaluateAll preserves input order while reusing evaluate logic", () => {
    const evaluator = new ExpressionEvaluator<{ prefix: string }, string, string>(
      (state, expression) => `${state.prefix}:${expression}`,
    );

    expect(evaluator.evaluateAll({ prefix: "vm" }, ["left", "right", "tail"])).toEqual([
      "vm:left",
      "vm:right",
      "vm:tail",
    ]);
  });

  it("evaluateAll returns an empty array for empty input", () => {
    const evaluator = new ExpressionEvaluator<{}, string, string>((_state, expression) => expression.toUpperCase());

    expect(evaluator.evaluateAll({}, [])).toEqual([]);
  });
});
