import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  ExpressionStatement,
  FieldDeclaration,
  IdentifierExpression,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { UsageTracker } from "../src/search.js";

describe("search depth", () => {
  it("prefers local declarations over fields for bare identifier references", () => {
    const field = new FieldDeclaration("count", simpleTypeRef("WholeNumber"), new IntegerLiteral(0), false, false);
    const local = new LocalVariableDeclarationStatement("count", simpleTypeRef("WholeNumber"), new IntegerLiteral(1), false);
    const method = new MethodDeclaration(
      "caller",
      { type: "VoidTypeRef" },
      [],
      [local, new ExpressionStatement(new IdentifierExpression("count"))],
      false,
    );
    const ast = new ClassDeclaration("Counter", "Object", null, null, [], [method], [field]);
    const tracker = new UsageTracker(ast);

    expect(tracker.findReferences(local.local).references).toHaveLength(1);
    expect(tracker.findReferences(field).references).toHaveLength(0);
  });

  it("resolves inherited method references across root types", () => {
    const helper = new MethodDeclaration("assist", { type: "VoidTypeRef" }, [], [], false);
    const base = new ClassDeclaration("BaseCounter", "Object", null, null, [], [helper], []);
    const caller = new MethodDeclaration(
      "caller",
      { type: "VoidTypeRef" },
      [],
      [new ExpressionStatement(new MethodInvocation(null, "assist", [], null))],
      false,
    );
    const child = new ClassDeclaration("AdvancedCounter", "BaseCounter", null, null, [], [caller], []);
    const tracker = new UsageTracker([base, child]);

    const result = tracker.findReferences(helper);

    expect(result.references).toHaveLength(1);
    expect(result.references[0]).toBeInstanceOf(MethodInvocation);
    expect(tracker.groupReferences(helper).map((group) => group.declaration.name)).toEqual(["caller"]);
  });
});
