import { describe, it, expect } from "vitest";
import { parseTweedle, TweedleParseError } from "../src/tweedle-parser.js";

// ═══════════════════════════════════════════════════════════════════════════
// New Tweedle Language Constructs — TDD tests (written before implementation)
//
// Tests for: WhileLoop, TryCatch, SwitchCase, ArrayLiteral,
//            doTogether (explicit), string concatenation (explicit)
// ═══════════════════════════════════════════════════════════════════════════

// ── While Loops ──────────────────────────────────────────────────────────

describe("statements – while loop", () => {
  it("parses a basic while loop", () => {
    const ast = parseTweedle(`class X {
      void m() {
        while (this.isRunning) {
          this.step();
        }
      }
    }`);
    const stmt = ast.methods[0].body[0];
    expect(stmt.type).toBe("WhileLoop");
    const loop = stmt as {
      type: "WhileLoop";
      condition: { type: string };
      body: unknown[];
    };
    expect(loop.condition.type).toBe("MemberAccess");
    expect(loop.body).toHaveLength(1);
  });

  it("parses while loop with complex condition", () => {
    const ast = parseTweedle(`class X {
      void m() {
        while (this.count < 10 && this.active) {
          this.count <- this.count + 1;
        }
      }
    }`);
    const stmt = ast.methods[0].body[0];
    expect(stmt.type).toBe("WhileLoop");
    const loop = stmt as {
      type: "WhileLoop";
      condition: { type: string; operator: string };
    };
    expect(loop.condition.type).toBe("BinaryOp");
    expect(loop.condition.operator).toBe("&&");
  });

  it("parses while loop with empty body", () => {
    const ast = parseTweedle(`class X {
      void m() {
        while (true) {}
      }
    }`);
    const stmt = ast.methods[0].body[0];
    expect(stmt.type).toBe("WhileLoop");
    const loop = stmt as { type: "WhileLoop"; body: unknown[] };
    expect(loop.body).toHaveLength(0);
  });

  it("parses nested while loops", () => {
    const ast = parseTweedle(`class X {
      void m() {
        while (this.x > 0) {
          while (this.y > 0) {
            this.y <- this.y - 1;
          }
          this.x <- this.x - 1;
        }
      }
    }`);
    const outer = ast.methods[0].body[0] as {
      type: "WhileLoop";
      body: Array<{ type: string }>;
    };
    expect(outer.type).toBe("WhileLoop");
    expect(outer.body).toHaveLength(2);
    expect(outer.body[0].type).toBe("WhileLoop");
  });
});

// ── Try/Catch ────────────────────────────────────────────────────────────

describe("statements – try/catch", () => {
  it("parses try/catch with exception variable", () => {
    const ast = parseTweedle(`class X {
      void m() {
        try {
          this.riskyOperation();
        } catch (Exception e) {
          this.handleError();
        }
      }
    }`);
    const stmt = ast.methods[0].body[0];
    expect(stmt.type).toBe("TryCatch");
    const tc = stmt as {
      type: "TryCatch";
      tryBody: unknown[];
      catchVariable: string;
      catchType: { type: string; name: string };
      catchBody: unknown[];
    };
    expect(tc.tryBody).toHaveLength(1);
    expect(tc.catchVariable).toBe("e");
    expect(tc.catchType.name).toBe("Exception");
    expect(tc.catchBody).toHaveLength(1);
  });

  it("parses try/catch with empty bodies", () => {
    const ast = parseTweedle(`class X {
      void m() {
        try {} catch (Exception ex) {}
      }
    }`);
    const stmt = ast.methods[0].body[0] as {
      type: "TryCatch";
      tryBody: unknown[];
      catchBody: unknown[];
    };
    expect(stmt.type).toBe("TryCatch");
    expect(stmt.tryBody).toHaveLength(0);
    expect(stmt.catchBody).toHaveLength(0);
  });

  it("parses try/catch with multiple statements in each block", () => {
    const ast = parseTweedle(`class X {
      void m() {
        try {
          this.a();
          this.b();
        } catch (Exception e) {
          this.log();
          this.recover();
        }
      }
    }`);
    const tc = ast.methods[0].body[0] as {
      type: "TryCatch";
      tryBody: unknown[];
      catchBody: unknown[];
    };
    expect(tc.tryBody).toHaveLength(2);
    expect(tc.catchBody).toHaveLength(2);
  });
});

// ── Switch/Case ──────────────────────────────────────────────────────────

describe("statements – switch/case", () => {
  it("parses switch with single case and default", () => {
    const ast = parseTweedle(`class X {
      void m() {
        switch (this.state) {
          case 1: { this.doA(); }
          default: { this.doDefault(); }
        }
      }
    }`);
    const stmt = ast.methods[0].body[0];
    expect(stmt.type).toBe("SwitchCase");
    const sw = stmt as {
      type: "SwitchCase";
      expression: { type: string };
      cases: Array<{ value: unknown; body: unknown[] }>;
      defaultCase: unknown[] | null;
    };
    expect(sw.expression.type).toBe("MemberAccess");
    expect(sw.cases).toHaveLength(1);
    expect(sw.defaultCase).not.toBeNull();
  });

  it("parses switch with multiple cases", () => {
    const ast = parseTweedle(`class X {
      void m() {
        switch (this.direction) {
          case "north": { this.goNorth(); }
          case "south": { this.goSouth(); }
          case "east": { this.goEast(); }
        }
      }
    }`);
    const sw = ast.methods[0].body[0] as {
      type: "SwitchCase";
      cases: Array<{ value: { type: string; value: string }; body: unknown[] }>;
      defaultCase: unknown[] | null;
    };
    expect(sw.type).toBe("SwitchCase");
    expect(sw.cases).toHaveLength(3);
    expect(sw.cases[0].value.value).toBe("north");
    expect(sw.defaultCase).toBeNull();
  });

  it("parses switch with only default", () => {
    const ast = parseTweedle(`class X {
      void m() {
        switch (this.x) {
          default: { this.fallback(); }
        }
      }
    }`);
    const sw = ast.methods[0].body[0] as {
      type: "SwitchCase";
      cases: Array<unknown>;
      defaultCase: unknown[];
    };
    expect(sw.type).toBe("SwitchCase");
    expect(sw.cases).toHaveLength(0);
    expect(sw.defaultCase).toHaveLength(1);
  });
});

// ── Array Literals ───────────────────────────────────────────────────────

describe("type parameters and generics", () => {
  it("parses class type parameters", () => {
    const ast = parseTweedle(`class Box<T> {
      T value;
    }`);
    expect(ast.typeParameters).toEqual(["T"]);
    expect(ast.fields[0].fieldType).toMatchObject({ type: "SimpleTypeRef", name: "T", isArray: false });
  });

  it("parses generic method type parameters", () => {
    const ast = parseTweedle(`class Box<T> {
      <U> U echo(U value) { return value; }
    }`);
    expect(ast.methods[0].typeParameters).toEqual(["U"]);
    expect(ast.methods[0].returnType).toMatchObject({ type: "SimpleTypeRef", name: "U", isArray: false });
  });

  it("parses generic type arguments and sized arrays", () => {
    const ast = parseTweedle(`class X {
      List<TextString> names;
      void m() {
        WholeNumber[] values <- new WholeNumber[3];
      }
    }`);
    expect(ast.fields[0].fieldType).toMatchObject({ type: "SimpleTypeRef", name: "List", isArray: false });
    const fieldType = ast.fields[0].fieldType as { typeArguments?: Array<{ name: string }> };
    expect(fieldType.typeArguments?.[0].name).toBe("TextString");
    const decl = ast.methods[0].body[0] as {
      type: "LocalVariableDeclaration";
      initializer: { type: string; size: { type: string; value: number } | null };
    };
    expect(decl.initializer.type).toBe("NewArray");
    expect(decl.initializer.size?.value).toBe(3);
  });
});

describe("expressions – array literal", () => {
  it("parses array literal with numbers", () => {
    const ast = parseTweedle(`class X {
      void m() {
        WholeNumber[] nums <- {1, 2, 3};
      }
    }`);
    const decl = ast.methods[0].body[0] as {
      type: "LocalVariableDeclaration";
      initializer: {
        type: string;
        elements: Array<{ type: string; value: number }>;
      };
    };
    expect(decl.initializer.type).toBe("ArrayLiteral");
    expect(decl.initializer.elements).toHaveLength(3);
    expect(decl.initializer.elements[0].value).toBe(1);
    expect(decl.initializer.elements[2].value).toBe(3);
  });

  it("parses array literal with strings", () => {
    const ast = parseTweedle(`class X {
      void m() {
        TextString[] names <- {"Alice", "Bob"};
      }
    }`);
    const decl = ast.methods[0].body[0] as {
      type: "LocalVariableDeclaration";
      initializer: {
        type: string;
        elements: Array<{ type: string; value: string }>;
      };
    };
    expect(decl.initializer.type).toBe("ArrayLiteral");
    expect(decl.initializer.elements).toHaveLength(2);
    expect(decl.initializer.elements[0].value).toBe("Alice");
  });

  it("parses empty array literal", () => {
    const ast = parseTweedle(`class X {
      void m() {
        WholeNumber[] nums <- {};
      }
    }`);
    const decl = ast.methods[0].body[0] as {
      type: "LocalVariableDeclaration";
      initializer: { type: string; elements: unknown[] };
    };
    expect(decl.initializer.type).toBe("ArrayLiteral");
    expect(decl.initializer.elements).toHaveLength(0);
  });

  it("parses nested array literal expressions", () => {
    const ast = parseTweedle(`class X {
      void m() {
        WholeNumber[] nums <- {1 + 2, 3 * 4};
      }
    }`);
    const decl = ast.methods[0].body[0] as {
      type: "LocalVariableDeclaration";
      initializer: {
        type: string;
        elements: Array<{ type: string; operator: string }>;
      };
    };
    expect(decl.initializer.type).toBe("ArrayLiteral");
    expect(decl.initializer.elements).toHaveLength(2);
    expect(decl.initializer.elements[0].type).toBe("BinaryOp");
  });
});

// ── Explicit doTogether test (confirming existing behavior) ─────────────

describe("statements – doTogether (explicit coverage)", () => {
  it("doTogether parses and produces correct AST node", () => {
    const ast = parseTweedle(`class X {
      void m() {
        doTogether {
          this.alice.walk();
          this.bob.talk();
          this.cat.jump();
        }
      }
    }`);
    const stmt = ast.methods[0].body[0];
    expect(stmt.type).toBe("DoTogether");
    const dt = stmt as { type: "DoTogether"; body: unknown[] };
    expect(dt.body).toHaveLength(3);
  });
});

// ── Explicit string concatenation test (confirming existing behavior) ───

describe("expressions – string concatenation (explicit coverage)", () => {
  it("string concatenation via + parses as BinaryOp with + operator", () => {
    const ast = parseTweedle(`class X {
      TextString get() {
        return "Hello" + " " + "World";
      }
    }`);
    const ret = ast.methods[0].body[0] as {
      type: "Return";
      expression: { type: string; operator: string };
    };
    expect(ret.expression.type).toBe("BinaryOp");
    expect(ret.expression.operator).toBe("+");
  });

  it("string concatenation via .. parses as BinaryOp with .. operator", () => {
    const ast = parseTweedle(`class X {
      TextString get() {
        return "Hello" .. " World";
      }
    }`);
    const ret = ast.methods[0].body[0] as {
      type: "Return";
      expression: { type: string; operator: string };
    };
    expect(ret.expression.type).toBe("BinaryOp");
    expect(ret.expression.operator).toBe("..");
  });
});

// ── Security: new constructs inherit depth protection ────────────────────

describe("security – new constructs respect depth limits", () => {
  it("deeply nested while loops hit depth guard", () => {
    let src = "class X { void m() { ";
    for (let i = 0; i < 101; i++) src += "while (true) { ";
    for (let i = 0; i < 101; i++) src += "} ";
    src += "} }";
    expect(() => parseTweedle(src)).toThrow(TweedleParseError);
  });
});
