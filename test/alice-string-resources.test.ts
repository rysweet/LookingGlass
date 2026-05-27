import { describe, expect, it } from "vitest";

import {
  ErrorMessageFormatter,
  ExpressionRenderer,
  MethodSignatureFormatter,
  PseudocodeRenderer,
  StringFormatter,
  StringResourceBundle,
} from "../src/alice-string-resources.js";

describe("alice-string-resources", () => {
  it("formats placeholders and falls back through locale variants", () => {
    const formatter = new StringFormatter();
    const bundle = new StringResourceBundle({
      en: {
        greeting: "Hello, {name}!",
        loop: "Repeat {0} times",
      },
      es: {
        greeting: "Hola, {name}!",
      },
    });

    expect(formatter.format("{{greeting}} {0}", ["Alice"])).toBe("{greeting} Alice");
    expect(bundle.has("es-MX", "greeting")).toBe(true);
    expect(bundle.get("es-MX", "greeting", { name: "Alicia" })).toBe("Hola, Alicia!");
    expect(bundle.get("fr-CA", "greeting", { name: "Alice" })).toBe("Hello, Alice!");
    expect(bundle.get("fr", "missing")).toBe("missing");
    expect(bundle.getLocale("es-MX")).toEqual({ greeting: "Hola, {name}!" });
    expect(bundle.get("en", "loop", [3])).toBe("Repeat 3 times");
  });

  it("renders expressions and method signatures in readable form", () => {
    const expression = {
      type: "MethodInvocation",
      target: {
        type: "FieldAccess",
        target: { type: "ThisExpression" },
        fieldName: "rabbit",
      },
      methodName: "move",
      arguments: [
        {
          type: "ArithmeticInfixExpression",
          operator: "+",
          left: 1,
          right: 2,
        },
        { type: "IdentifierExpression", name: "meters" },
      ],
    };

    expect(ExpressionRenderer.render(expression)).toBe(
      "this.rabbit.move(1 + 2, meters)",
    );
    expect(
      MethodSignatureFormatter.format({
        accessLevel: "public",
        isStatic: true,
        declaringType: "Scene",
        name: "move",
        parameters: [
          { name: "direction", type: "Direction" },
          { name: "details", type: "Detail[]", variadic: true },
          { name: "duration", type: "number", optional: true },
        ],
        returnType: "void",
      }),
    ).toBe(
      "public static Scene.move(direction: Direction, ...details: Detail[], duration?: number): void",
    );
  });

  it("renders structured pseudocode for common control-flow nodes", () => {
    const pseudocode = PseudocodeRenderer.render({
      type: "ConditionalStatement",
      condition: {
        type: "RelationalInfixExpression",
        operator: ">",
        left: { type: "IdentifierExpression", name: "score" },
        right: 10,
      },
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "MethodInvocation",
            methodName: "celebrate",
            arguments: [],
          },
        },
      ],
      elseBody: [
        {
          type: "CountLoop",
          count: 2,
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "MethodInvocation",
                methodName: "practice",
                arguments: ["again"],
              },
            },
          ],
        },
        {
          type: "ReturnStatement",
          expression: { type: "IdentifierExpression", name: "score" },
        },
      ],
    });

    expect(pseudocode).toBe([
      "if score > 10:",
      "  celebrate()",
      "else:",
      "  repeat 2 times:",
      '    practice("again")',
      "  return score",
    ].join("\n"));
  });

  it("formats user-facing error messages with source context", () => {
    const message = ErrorMessageFormatter.format({
      context: "When the world starts",
      line: 4,
      column: 9,
      pointerWidth: 5,
      message: "Unknown method movee",
      sourceLine: "rabbit.movee(1)",
      suggestion: 'Did you mean "move"?',
    });

    expect(message).toBe([
      "Problem in When the world starts (line 4, column 9): Unknown method movee",
      "> rabbit.movee(1)",
      "          ^^^^^",
      'Try: Did you mean "move"?',
    ].join("\n"));
  });
});
