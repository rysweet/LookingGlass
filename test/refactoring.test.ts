import { describe, expect, it } from "vitest";
import {
  ArithmeticInfixExpression,
  ClassDeclaration,
  ExpressionStatement,
  IntegerLiteral,
  MethodDeclaration,
  MethodInvocation,
  ParameterAccess,
  ReturnStatement,
  StringLiteral,
  UserParameter,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { extractMethod, inlineMethodBody, renameDeclaration } from "../src/refactoring.js";

function buildRenameFixture(): ClassDeclaration {
  const helper = new MethodDeclaration("helper", { type: "VoidTypeRef" }, [], [], false);
  const caller = new MethodDeclaration(
    "caller",
    { type: "VoidTypeRef" },
    [],
    [new ExpressionStatement(new MethodInvocation(null, "helper", [], helper))],
    false,
  );
  return new ClassDeclaration("Renamer", "Object", null, null, [], [helper, caller], []);
}

describe("refactoring", () => {
  it("renames method declarations and their invocations", () => {
    const ast = buildRenameFixture();
    const helper = ast.methods[0]!;
    const result = renameDeclaration(ast, helper, "assist");

    expect(result.referenceCount).toBe(1);
    expect(helper.name).toBe("assist");
    expect((ast.methods[1]!.body[0] as ExpressionStatement).expression).toMatchObject({ methodName: "assist" });
  });

  it("extracts a helper method with captured parameters", () => {
    const name = new UserParameter("name", simpleTypeRef("String"));
    const greet = new MethodDeclaration(
      "greet",
      { type: "VoidTypeRef" },
      [name],
      [new ExpressionStatement(new MethodInvocation(null, "say", [{ name: null, value: new ParameterAccess(name) }]))],
      false,
    );
    const type = new ClassDeclaration("Greeter", "Object", null, null, [], [greet], []);

    const result = extractMethod(type, greet, { startIndex: 0, endIndex: 1, extractedName: "sayName" });

    expect(result.parameterNames).toEqual(["name"]);
    expect(type.methods.map((method) => method.name)).toEqual(["greet", "sayName"]);
    expect((greet.body[0] as ExpressionStatement).expression).toMatchObject({ methodName: "sayName" });
  });

  it("inlines expression-bodied helper methods", () => {
    const value = new UserParameter("value", simpleTypeRef("WholeNumber"));
    const plusOne = new MethodDeclaration(
      "plusOne",
      simpleTypeRef("WholeNumber"),
      [value],
      [new ReturnStatement(new ArithmeticInfixExpression("+", new ParameterAccess(value), new IntegerLiteral(1)), simpleTypeRef("WholeNumber"))],
      false,
    );
    const caller = new MethodDeclaration(
      "answer",
      simpleTypeRef("WholeNumber"),
      [],
      [new ReturnStatement(new MethodInvocation(null, "plusOne", [{ name: null, value: new IntegerLiteral(41) }], plusOne), simpleTypeRef("WholeNumber"))],
      false,
    );
    const type = new ClassDeclaration("Mathy", "Object", null, null, [], [plusOne, caller], []);

    const result = inlineMethodBody(type, plusOne);

    expect(result.mode).toBe("expression");
    expect(result.callSiteCount).toBe(1);
    expect(type.methods.map((method) => method.name)).toEqual(["answer"]);
    expect((caller.body[0] as ReturnStatement).expression).toBeInstanceOf(ArithmeticInfixExpression);
  });

  it("inlines void helper bodies into statement lists", () => {
    const name = new UserParameter("name", simpleTypeRef("String"));
    const helper = new MethodDeclaration(
      "announce",
      { type: "VoidTypeRef" },
      [name],
      [new ExpressionStatement(new MethodInvocation(null, "say", [{ name: null, value: new ParameterAccess(name) }]))],
      false,
    );
    const caller = new MethodDeclaration(
      "run",
      { type: "VoidTypeRef" },
      [],
      [new ExpressionStatement(new MethodInvocation(null, "announce", [{ name: null, value: new StringLiteral("Ada") }], helper))],
      false,
    );
    const type = new ClassDeclaration("Announcer", "Object", null, null, [], [helper, caller], []);

    const result = inlineMethodBody(type, helper);

    expect(result.mode).toBe("statement");
    expect(caller.body).toHaveLength(1);
    expect((caller.body[0] as ExpressionStatement).expression).toBeInstanceOf(MethodInvocation);
    expect(((caller.body[0] as ExpressionStatement).expression as MethodInvocation).arguments[0]?.value).toBeInstanceOf(StringLiteral);
  });
});
