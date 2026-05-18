import { describe, it, expect } from "vitest";
import { parseTweedle } from "../src/tweedle-parser.js";
import {
  generateTweedle,
  generateStatement,
  generateExpression,
  TweedleCodegenError,
} from "../src/tweedle-codegen.js";
import type { Statement, Expression } from "../src/tweedle-parser.js";

// ═══════════════════════════════════════════════════════════════════════════
// Codegen for New Tweedle Constructs — TDD tests (written before impl)
//
// Tests for: WhileLoop, TryCatch, SwitchCase, ArrayLiteral codegen
//            + roundtrip (parse → codegen → reparse) verification
// ═══════════════════════════════════════════════════════════════════════════

// ── While Loop Codegen ───────────────────────────────────────────────────

describe("While loop codegen", () => {
  it("generates while loop from AST node", () => {
    const stmt: Statement = {
      type: "WhileLoop",
      condition: { type: "Literal", value: true, literalType: "boolean" },
      body: [],
    } as Statement;
    const output = generateStatement(stmt);
    expect(output).toContain("while");
    expect(output).toContain("true");
    expect(output).toContain("{");
    expect(output).toContain("}");
  });

  it("generates while loop with body statements", () => {
    const stmt: Statement = {
      type: "WhileLoop",
      condition: { type: "Identifier", name: "running" },
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "MethodInvocation",
            target: { type: "This" },
            methodName: "step",
            arguments: [],
          },
        },
      ],
    } as Statement;
    const output = generateStatement(stmt);
    expect(output).toContain("while (running)");
    expect(output).toContain("this.step()");
  });

  it("roundtrip: while loop parse → codegen → reparse", () => {
    const source = `class X {
      void m() {
        while (this.active) {
          this.doWork();
        }
      }
    }`;
    const ast1 = parseTweedle(source);
    const generated = generateTweedle(ast1);
    const ast2 = parseTweedle(generated);
    expect(ast2.methods[0].body[0].type).toBe("WhileLoop");
    const w1 = ast1.methods[0].body[0] as { type: "WhileLoop"; body: unknown[] };
    const w2 = ast2.methods[0].body[0] as { type: "WhileLoop"; body: unknown[] };
    expect(w2.body).toHaveLength(w1.body.length);
  });
});

// ── Try/Catch Codegen ────────────────────────────────────────────────────

describe("TryCatch codegen", () => {
  it("generates try/catch from AST node", () => {
    const stmt: Statement = {
      type: "TryCatch",
      tryBody: [],
      catchType: { type: "SimpleTypeRef", name: "Exception", isArray: false },
      catchVariable: "e",
      catchBody: [],
    } as Statement;
    const output = generateStatement(stmt);
    expect(output).toContain("try");
    expect(output).toContain("catch");
    expect(output).toContain("Exception e");
  });

  it("generates try/catch with body statements", () => {
    const stmt: Statement = {
      type: "TryCatch",
      tryBody: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "MethodInvocation",
            target: { type: "This" },
            methodName: "riskyOp",
            arguments: [],
          },
        },
      ],
      catchType: { type: "SimpleTypeRef", name: "Exception", isArray: false },
      catchVariable: "ex",
      catchBody: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "MethodInvocation",
            target: { type: "This" },
            methodName: "handleError",
            arguments: [],
          },
        },
      ],
    } as Statement;
    const output = generateStatement(stmt);
    expect(output).toContain("try");
    expect(output).toContain("this.riskyOp()");
    expect(output).toContain("catch (Exception ex)");
    expect(output).toContain("this.handleError()");
  });

  it("roundtrip: try/catch parse → codegen → reparse", () => {
    const source = `class X {
      void m() {
        try {
          this.run();
        } catch (Exception e) {
          this.fail();
        }
      }
    }`;
    const ast1 = parseTweedle(source);
    const generated = generateTweedle(ast1);
    const ast2 = parseTweedle(generated);
    expect(ast2.methods[0].body[0].type).toBe("TryCatch");
    const tc = ast2.methods[0].body[0] as {
      type: "TryCatch";
      catchVariable: string;
    };
    expect(tc.catchVariable).toBe("e");
  });
});

// ── Switch/Case Codegen ──────────────────────────────────────────────────

describe("SwitchCase codegen", () => {
  it("generates switch with cases", () => {
    const stmt: Statement = {
      type: "SwitchCase",
      expression: { type: "Identifier", name: "state" },
      cases: [
        {
          value: { type: "Literal", value: 1, literalType: "number" },
          body: [],
        },
        {
          value: { type: "Literal", value: 2, literalType: "number" },
          body: [],
        },
      ],
      defaultCase: null,
    } as Statement;
    const output = generateStatement(stmt);
    expect(output).toContain("switch (state)");
    expect(output).toContain("case 1:");
    expect(output).toContain("case 2:");
  });

  it("generates switch with default", () => {
    const stmt: Statement = {
      type: "SwitchCase",
      expression: { type: "Identifier", name: "x" },
      cases: [],
      defaultCase: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "MethodInvocation",
            target: { type: "This" },
            methodName: "fallback",
            arguments: [],
          },
        },
      ],
    } as Statement;
    const output = generateStatement(stmt);
    expect(output).toContain("switch (x)");
    expect(output).toContain("default:");
    expect(output).toContain("this.fallback()");
  });

  it("roundtrip: switch/case parse → codegen → reparse", () => {
    const source = `class X {
      void m() {
        switch (this.dir) {
          case "left": { this.goLeft(); }
          case "right": { this.goRight(); }
          default: { this.stop(); }
        }
      }
    }`;
    const ast1 = parseTweedle(source);
    const generated = generateTweedle(ast1);
    const ast2 = parseTweedle(generated);
    expect(ast2.methods[0].body[0].type).toBe("SwitchCase");
    const sw = ast2.methods[0].body[0] as {
      type: "SwitchCase";
      cases: unknown[];
      defaultCase: unknown[];
    };
    expect(sw.cases).toHaveLength(2);
    expect(sw.defaultCase).toHaveLength(1);
  });
});

// ── Array Literal Codegen ────────────────────────────────────────────────

describe("ArrayLiteral codegen", () => {
  it("generates array literal expression", () => {
    const expr: Expression = {
      type: "ArrayLiteral",
      elements: [
        { type: "Literal", value: 1, literalType: "number" },
        { type: "Literal", value: 2, literalType: "number" },
        { type: "Literal", value: 3, literalType: "number" },
      ],
    } as Expression;
    const output = generateExpression(expr);
    expect(output).toBe("{1, 2, 3}");
  });

  it("generates empty array literal", () => {
    const expr: Expression = {
      type: "ArrayLiteral",
      elements: [],
    } as Expression;
    const output = generateExpression(expr);
    expect(output).toBe("{}");
  });

  it("roundtrip: array literal in variable declaration", () => {
    const source = `class X {
      void m() {
        WholeNumber[] nums <- {10, 20, 30};
      }
    }`;
    const ast1 = parseTweedle(source);
    const generated = generateTweedle(ast1);
    const ast2 = parseTweedle(generated);
    const decl = ast2.methods[0].body[0] as {
      type: "LocalVariableDeclaration";
      initializer: { type: string; elements: Array<{ value: number }> };
    };
    expect(decl.initializer.type).toBe("ArrayLiteral");
    expect(decl.initializer.elements).toHaveLength(3);
  });
});

// ── Error handling for unknown nodes ─────────────────────────────────────

describe("Codegen error handling for new node types", () => {
  it("throws TweedleCodegenError for genuinely unknown statement type", () => {
    const fakeStmt = { type: "TotallyFakeNode" } as unknown as Statement;
    expect(() => generateStatement(fakeStmt)).toThrow(TweedleCodegenError);
  });

  it("throws TweedleCodegenError for genuinely unknown expression type", () => {
    const fakeExpr = { type: "BogusExpr" } as unknown as Expression;
    expect(() => generateExpression(fakeExpr)).toThrow(TweedleCodegenError);
  });
});
