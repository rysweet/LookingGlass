import { describe, expect, it } from "vitest";
import {
  ArithmeticInfixExpression,
  ClassDeclaration,
  ExpressionStatement,
  FieldDeclaration,
  InstanceCreation,
  IntegerLiteral,
  LocalAccess,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  ParameterAccess,
  ReturnStatement,
  ThisExpression,
  TypeExpression,
  UserParameter,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { extractMethod, renameDeclaration } from "../src/refactoring.js";

describe("refactoring depth", () => {
  it("renames self-referential types across embedded AST type references", () => {
    const parameter = new UserParameter("candidate", simpleTypeRef("Widget"));
    const cloneSelf = new MethodDeclaration(
      "cloneSelf",
      simpleTypeRef("Widget"),
      [parameter],
      [
        new ExpressionStatement(new TypeExpression(simpleTypeRef("Widget"))),
        new LocalVariableDeclarationStatement("copy", simpleTypeRef("Widget"), new InstanceCreation("Widget", []), false),
        new ReturnStatement(new ThisExpression(simpleTypeRef("Widget")), simpleTypeRef("Widget")),
      ],
      false,
    );
    const widget = new ClassDeclaration(
      "Widget",
      "Object",
      "Widget",
      null,
      [],
      [cloneSelf],
      [new FieldDeclaration("peer", simpleTypeRef("Widget"), null, false, false)],
    );

    const result = renameDeclaration(widget, widget, "RenamedWidget");

    expect(result.referenceCount).toBe(0);
    expect(result.typeReferenceCount).toBe(9);
    expect(widget.name).toBe("RenamedWidget");
    expect(widget.modelType).toBe("RenamedWidget");
    expect(widget.fields[0]?.fieldType).toMatchObject({ type: "SimpleTypeRef", name: "RenamedWidget" });
    expect(cloneSelf.returnType).toMatchObject({ type: "SimpleTypeRef", name: "RenamedWidget" });
    expect(parameter.paramType).toMatchObject({ type: "SimpleTypeRef", name: "RenamedWidget" });
    expect((cloneSelf.body[0] as ExpressionStatement).expression).toMatchObject({ valueType: { type: "SimpleTypeRef", name: "RenamedWidget" } });
    expect((cloneSelf.body[1] as LocalVariableDeclarationStatement).local.valueType).toMatchObject({ type: "SimpleTypeRef", name: "RenamedWidget" });
    expect(((cloneSelf.body[1] as LocalVariableDeclarationStatement).initializer as InstanceCreation).className).toBe("RenamedWidget");
    expect((cloneSelf.body[2] as ReturnStatement).expressionType).toMatchObject({ type: "SimpleTypeRef", name: "RenamedWidget" });
    expect(((cloneSelf.body[2] as ReturnStatement).expression as ThisExpression).currentType).toMatchObject({ type: "SimpleTypeRef", name: "RenamedWidget" });
  });

  it("extracts methods with outer parameters and locals while keeping inner locals local", () => {
    const base = new UserParameter("base", simpleTypeRef("WholeNumber"));
    const offset = new LocalVariableDeclarationStatement("offset", simpleTypeRef("WholeNumber"), new IntegerLiteral(2), false);
    const sum = new LocalVariableDeclarationStatement(
      "sum",
      simpleTypeRef("WholeNumber"),
      new ArithmeticInfixExpression("+", new ParameterAccess(base), new LocalAccess(offset.local)),
      false,
    );
    const compute = new MethodDeclaration(
      "compute",
      simpleTypeRef("WholeNumber"),
      [base],
      [offset, sum, new ReturnStatement(new LocalAccess(sum.local), simpleTypeRef("WholeNumber"))],
      false,
    );
    const type = new ClassDeclaration("Mathy", "Object", null, null, [], [compute], []);

    const result = extractMethod(type, compute, { startIndex: 1, endIndex: 3, extractedName: "finishComputation" });

    expect(result.parameterNames).toEqual(["base", "offset"]);
    expect(result.extractedMethod.body[0]).toBeInstanceOf(LocalVariableDeclarationStatement);
    expect(result.extractedMethod.body[1]).toBeInstanceOf(ReturnStatement);
    expect(compute.body).toHaveLength(2);
    expect(compute.body[0]).toBe(offset);
    expect((compute.body[1] as ReturnStatement).expression).toMatchObject({ methodName: "finishComputation" });
    const invocation = (compute.body[1] as ReturnStatement).expression as MethodInvocation;
    expect(invocation.arguments).toHaveLength(2);
    expect(invocation.arguments[0]?.value).toBeInstanceOf(ParameterAccess);
    expect(invocation.arguments[1]?.value).toBeInstanceOf(LocalAccess);
  });
});
