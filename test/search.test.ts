import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  ExpressionStatement,
  FieldDeclaration,
  FieldAccess,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  ParameterAccess,
  ReturnStatement,
  ThisExpression,
  UserParameter,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { UsageTracker, queryAst, searchAst } from "../src/search.js";

function buildSearchFixture(): ClassDeclaration {
  const field = new FieldDeclaration("count", simpleTypeRef("WholeNumber"), new IntegerLiteral(0), false, false);
  const value = new UserParameter("value", simpleTypeRef("WholeNumber"));
  const helper = new MethodDeclaration(
    "helper",
    simpleTypeRef("WholeNumber"),
    [value],
    [new ReturnStatement(new ParameterAccess(value), simpleTypeRef("WholeNumber"))],
    false,
  );
  const caller = new MethodDeclaration(
    "caller",
    { type: "VoidTypeRef" },
    [],
    [
      new LocalVariableDeclarationStatement("localCount", simpleTypeRef("WholeNumber"), new IntegerLiteral(1), false),
      new ExpressionStatement(new FieldAccess(new ThisExpression(simpleTypeRef("Counter")), "count", field)),
      new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Counter")), "helper", [{ name: null, value: new IntegerLiteral(3) }], helper)),
    ],
    false,
  );
  return new ClassDeclaration("Counter", "Object", null, null, [], [helper, caller], [field]);
}

describe("search", () => {
  it("supports generic AST queries", () => {
    const ast = buildSearchFixture();
    const methods = queryAst(ast, (node): node is MethodDeclaration => node instanceof MethodDeclaration);
    expect(methods.map((method) => method.name)).toEqual(["helper", "caller"]);
  });

  it("tracks references and groups them by enclosing declaration", () => {
    const ast = buildSearchFixture();
    const tracker = new UsageTracker(ast);
    const helper = ast.methods[0]!;
    const result = tracker.findReferences(helper);

    expect(result.references).toHaveLength(1);
    expect(result.references[0]).toBeInstanceOf(MethodInvocation);
    expect(tracker.groupReferences(helper)).toHaveLength(1);
    expect(tracker.groupReferences(helper)[0]?.declaration.name).toBe("caller");
  });

  it("tracks field usages and declaration-name searches", () => {
    const ast = buildSearchFixture();
    const tracker = new UsageTracker(ast);
    const field = ast.fields[0]!;
    expect(tracker.findReferences(field).references).toHaveLength(1);
    expect(tracker.searchDeclarations("count").map((result) => result.getName())).toContain("count");
  });

  it("searches declarations and expressions by type", () => {
    const ast = buildSearchFixture();
    const matches = searchAst(ast, { typeName: "WholeNumber" });
    expect(matches.some((match) => "name" in match.node && match.node.name === "helper")).toBe(true);
    expect(matches.some((match) => match.kind === "expression")).toBe(true);
  });
});
