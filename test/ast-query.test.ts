import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  CountUpToStatement,
  ExpressionStatement,
  FieldDeclaration,
  FieldAccess,
  IntegerLiteral,
  MethodDeclaration,
  MethodInvocation,
  StringLiteral,
  ThisExpression,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import {
  AstQuery,
  countNodesByType,
  findCircularReferences,
  findFieldAccesses,
  findMethodInvocationsOnType,
  findStatementsOfType,
} from "../src/ast-query.js";

function buildQueryFixture(): ClassDeclaration {
  const count = new FieldDeclaration("count", simpleTypeRef("WholeNumber"), new IntegerLiteral(0), false, false);
  const name = new FieldDeclaration("name", simpleTypeRef("String"), null, false, false);
  const helper = new MethodDeclaration(
    "helper",
    { type: "VoidTypeRef" },
    [],
    [new ExpressionStatement(new FieldAccess(new ThisExpression(simpleTypeRef("Counter")), "count", count))],
    false,
  );
  const announce = new MethodDeclaration(
    "announce",
    { type: "VoidTypeRef" },
    [],
    [new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Narrator")), "say", [{ name: null, value: new StringLiteral("hi") }]))],
    false,
  );
  const caller = new MethodDeclaration(
    "caller",
    { type: "VoidTypeRef" },
    [],
    [
      new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Counter")), "helper", [], helper)),
      new ExpressionStatement(new FieldAccess(new ThisExpression(simpleTypeRef("Counter")), "name", name)),
      new CountUpToStatement(new IntegerLiteral(3), [
        new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Counter")), "helper", [], helper)),
      ]),
    ],
    false,
  );
  return new ClassDeclaration("Counter", "Object", null, null, [], [helper, announce, caller], [count, name]);
}

function buildCircularFixture(): ClassDeclaration {
  const score = new FieldDeclaration("score", simpleTypeRef("WholeNumber"), new IntegerLiteral(0), false, false);
  const callBeta = new MethodInvocation(new ThisExpression(simpleTypeRef("Cycle")), "beta", []);
  const callAlpha = new MethodInvocation(new ThisExpression(simpleTypeRef("Cycle")), "alpha", []);
  const alpha = new MethodDeclaration(
    "alpha",
    { type: "VoidTypeRef" },
    [],
    [new ExpressionStatement(callBeta), new ExpressionStatement(new FieldAccess(new ThisExpression(simpleTypeRef("Cycle")), "score", score))],
    false,
  );
  const beta = new MethodDeclaration(
    "beta",
    { type: "VoidTypeRef" },
    [],
    [new ExpressionStatement(callAlpha)],
    false,
  );
  callBeta.method = beta;
  callAlpha.method = alpha;
  return new ClassDeclaration("Cycle", "Object", null, null, [], [alpha, beta], [score]);
}

describe("ast-query", () => {
  it("finds all method invocations on a given type", () => {
    const ast = buildQueryFixture();
    const query = new AstQuery(ast);

    expect(query.findMethodInvocationsOnType("Counter").map((invocation) => invocation.methodName)).toEqual([
      "helper",
      "helper",
    ]);
    expect(findMethodInvocationsOnType(ast, "Narrator").map((invocation) => invocation.methodName)).toEqual([
      "say",
    ]);
  });

  it("finds all field accesses", () => {
    const ast = buildQueryFixture();

    expect(findFieldAccesses(ast).map((access) => access.memberName)).toEqual(["count", "name"]);
    expect(findFieldAccesses(ast).every((access) => access instanceof FieldAccess)).toBe(true);
  });

  it("finds all statements of a given type", () => {
    const ast = buildQueryFixture();

    expect(findStatementsOfType(ast, CountUpToStatement)).toHaveLength(1);
    expect(findStatementsOfType(ast, ExpressionStatement)).toHaveLength(5);
  });

  it("counts nodes by type", () => {
    const ast = buildQueryFixture();

    expect(countNodesByType(ast)).toMatchObject({
      ClassDeclaration: 1,
      CountUpToStatement: 1,
      FieldAccess: 2,
      MethodInvocation: 3,
    });
  });

  it("finds circular references between declarations", () => {
    const ast = buildCircularFixture();

    const cycles = findCircularReferences(ast);

    expect(cycles).toHaveLength(1);
    expect([...cycles[0]!.names].sort()).toEqual(["alpha", "beta"]);
  });
});
