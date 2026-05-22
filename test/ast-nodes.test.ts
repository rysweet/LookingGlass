import { describe, expect, it } from "vitest";
import { parseTweedle } from "../src/tweedle-parser.js";
import {
  ClassDeclaration,
  ConditionalStatement,
  ExpressionStatement,
  FieldAccess,
  FieldDeclaration,
  ForEachLoop,
  MethodDeclaration,
  MethodInvocation,
  ReturnStatement,
  StringLiteral,
  ThisExpression,
} from "../src/ast-nodes.js";

describe("ast-nodes hierarchy", () => {
  it("hydrates parser output into declaration node classes", () => {
    const ast = parseTweedle(`class Scene {
      SThing camera <- this.vehicle;
      void move() {
        this.say("hi");
      }
    }`) as unknown as ClassDeclaration;

    expect(ast).toBeInstanceOf(ClassDeclaration);
    expect(ast.fields[0]).toBeInstanceOf(FieldDeclaration);
    expect(ast.methods[0]).toBeInstanceOf(MethodDeclaration);
    expect(ast.fields[0].parent).toBe(ast);
    expect(ast.methods[0].parent).toBe(ast);
  });

  it("hydrates expression and statement subclasses with parent links", () => {
    const ast = parseTweedle(`class Scene {
      void move(Boolean condition, SThing[] items) {
        if (condition) {
          this.say("hi");
        } else {
          return;
        }
        forEach (SThing item in items) {
          return item;
        }
      }
    }`) as unknown as ClassDeclaration;

    const method = ast.methods[0];
    const conditional = method.body[0];
    const loop = method.body[1];

    expect(conditional).toBeInstanceOf(ConditionalStatement);
    expect(loop).toBeInstanceOf(ForEachLoop);
    if (!(conditional instanceof ConditionalStatement)) {
      throw new Error("Expected a ConditionalStatement");
    }
    if (!(loop instanceof ForEachLoop)) {
      throw new Error("Expected a ForEachLoop");
    }

    const thenStatement = conditional.ifBody[0];
    expect(thenStatement).toBeInstanceOf(ExpressionStatement);
    if (!(thenStatement instanceof ExpressionStatement)) {
      throw new Error("Expected an ExpressionStatement");
    }

    const invocation = thenStatement.expression;
    expect(invocation).toBeInstanceOf(MethodInvocation);
    if (!(invocation instanceof MethodInvocation)) {
      throw new Error("Expected a MethodInvocation");
    }
    expect(invocation.target).toBeInstanceOf(ThisExpression);
    expect(invocation.arguments[0].value).toBeInstanceOf(StringLiteral);
    expect(invocation.parent).toBe(thenStatement);
    expect(invocation.arguments[0].value.parent).toBe(invocation);

    const elseReturn = conditional.elseBody?.[0];
    expect(elseReturn).toBeInstanceOf(ReturnStatement);
    expect(elseReturn?.parent).toBe(conditional);

    const loopReturn = loop.body[0];
    expect(loopReturn).toBeInstanceOf(ReturnStatement);
    expect(loop.collection.parent).toBe(loop);
  });

  it("maps member access to the FieldAccess class while preserving the legacy type tag", () => {
    const ast = parseTweedle(`class Scene {
      void move() {
        this.camera.turn();
      }
    }`) as unknown as ClassDeclaration;

    const statement = ast.methods[0].body[0];
    expect(statement).toBeInstanceOf(ExpressionStatement);
    if (!(statement instanceof ExpressionStatement)) {
      throw new Error("Expected an ExpressionStatement");
    }
    const invocation = statement.expression;
    expect(invocation).toBeInstanceOf(MethodInvocation);
    if (!(invocation instanceof MethodInvocation)) {
      throw new Error("Expected a MethodInvocation");
    }
    expect(invocation.target).toBeInstanceOf(FieldAccess);
    expect(invocation.target?.type).toBe("MemberAccess");
    expect(invocation.target?.parent).toBe(invocation);
  });

  it("supports traversal and ancestor lookup across the hydrated hierarchy", () => {
    const ast = parseTweedle(`class Scene {
      void move() {
        this.say("hi");
      }
    }`) as unknown as ClassDeclaration;

    const nodes: string[] = [];
    ast.traverse((node) => {
      if ("type" in node) {
        nodes.push(String(node.type));
      }
    });

    expect(nodes).toContain("ClassDeclaration");
    expect(nodes).toContain("MethodDeclaration");
    expect(nodes).toContain("ExpressionStatement");
    expect(nodes).toContain("MethodInvocation");

    const statement = ast.methods[0].body[0];
    expect(statement).toBeInstanceOf(ExpressionStatement);
    if (!(statement instanceof ExpressionStatement)) {
      throw new Error("Expected an ExpressionStatement");
    }
    const invocation = statement.expression;
    expect(invocation).toBeInstanceOf(MethodInvocation);
    if (!(invocation instanceof MethodInvocation)) {
      throw new Error("Expected a MethodInvocation");
    }
    expect(invocation.getFirstAncestorAssignableTo(MethodDeclaration)).toBe(ast.methods[0]);
    expect(invocation.getRoot()).toBe(ast);
  });
});
