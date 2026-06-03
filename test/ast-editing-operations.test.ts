import { describe, expect, it } from "vitest";
import {
  addMethod,
  copyStatements,
  getValidExpressions,
  insertStatement,
  mergeUserTypes,
  pasteStatements,
  removeMethod,
  renameMethod,
} from "../src/ast-editing-operations.js";
import {
  BooleanLiteral,
  CommentStatement,
  ConditionalStatement,
  CountLoop,
  DoInOrder,
  DoTogether,
  ExpressionStatement,
  FieldAccess,
  ForEachLoop,
  IntegerLiteral,
  LocalAccess,
  LocalVariableDeclarationStatement,
  MethodInvocation,
  NullLiteral,
  ParameterAccess,
  ReturnStatement,
  StringLiteral,
  ThisExpression,
  WhileLoop,
  simpleTypeRef,
  UserParameter,
} from "../src/ast-nodes.js";
import { ClassDeclaration, FieldDeclaration, MethodDeclaration } from "../src/class-system.js";
import { createTypeHierarchy } from "../src/tweedle-type-system.js";
import type { AbstractType as HierarchyType } from "../src/tweedle-type-system.js";
import type { ClassDecl, FieldDecl, MethodDecl, Parameter as RawParameter } from "../src/tweedle-parser.js";

function createEditableType(): ClassDeclaration {
  const describe = new MethodDeclaration("describe", simpleTypeRef("String"), [], [
    new ReturnStatement(new StringLiteral("Actor"), simpleTypeRef("String")),
  ]);
  const echo = new MethodDeclaration("echo", simpleTypeRef("String"), [
    new UserParameter("value", simpleTypeRef("String")),
  ], [
    new ReturnStatement(new StringLiteral("value"), simpleTypeRef("String")),
  ]);
  const run = new MethodDeclaration("run", { type: "VoidTypeRef" }, [
    new UserParameter("prefix", simpleTypeRef("String")),
  ], [
    new LocalVariableDeclarationStatement("suffix", simpleTypeRef("String"), new StringLiteral("!"), false),
    new ExpressionStatement(new StringLiteral("start")),
  ]);
  return new ClassDeclaration("Actor", "Object", [], [describe, echo, run], [
    new FieldDeclaration("title", simpleTypeRef("String"), new StringLiteral("Alice")),
    new FieldDeclaration("enabled", simpleTypeRef("Boolean"), new BooleanLiteral(true)),
  ]);
}

function field(name: string, fieldType = simpleTypeRef("String")): FieldDecl {
  return {
    type: "FieldDeclaration",
    name,
    fieldType,
    initializer: null,
    isStatic: false,
    isConstant: false,
    visibility: null,
  };
}

function method(
  name: string,
  returnType = simpleTypeRef("String"),
  parameters: Array<{ name: string; paramType: ReturnType<typeof simpleTypeRef>; isVarArgs?: boolean }> = [],
): MethodDecl {
  return {
    type: "MethodDeclaration",
    name,
    returnType,
    parameters: parameters.map<RawParameter>((parameter) => ({
      name: parameter.name,
      paramType: parameter.paramType,
      isVarArgs: parameter.isVarArgs ?? false,
      defaultValue: null,
    })),
    body: [],
    isStatic: false,
    visibility: null,
  };
}

function userType(name: string, methods: MethodDecl[], fields: FieldDecl[]): ClassDecl {
  return {
    type: "ClassDeclaration",
    name,
    superClass: null,
    modelType: null,
    visibility: null,
    constructors: [],
    methods,
    fields,
  };
}

function resolveUserType(type: HierarchyType | null) {
  if (!type || type.kind !== "user") {
    throw new Error("Expected a user type.");
  }
  return type;
}

describe("ast-editing-operations", () => {
  it("inserts every supported statement type across multiple positions", () => {
    const statements = [
      new ExpressionStatement(new StringLiteral("call")),
      new ReturnStatement(new StringLiteral("done"), simpleTypeRef("String")),
      new ConditionalStatement(new BooleanLiteral(true), [], []),
      new CountLoop(null, null, new IntegerLiteral(3), []),
      new WhileLoop(new BooleanLiteral(true), []),
      new ForEachLoop(simpleTypeRef("String"), "item", new NullLiteral(), []),
      new LocalVariableDeclarationStatement("name", simpleTypeRef("String"), new StringLiteral("value"), false),
      new DoInOrder([]),
      new DoTogether([]),
      new CommentStatement("note"),
    ];

    statements.forEach((statement, index) => {
      const method = new MethodDeclaration("run", { type: "VoidTypeRef" }, [], [
        new ExpressionStatement(new StringLiteral("first")),
        new ExpressionStatement(new StringLiteral("last")),
      ]);
      const insertionIndex = index % 3 === 0 ? 0 : index % 3 === 1 ? 1 : method.body.length;
      insertStatement(method, insertionIndex, statement);
      expect(method.body[insertionIndex]).toBe(statement);
      expect(statement.parent).toBe(method);
    });
  });

  it("rejects insertion after a guaranteed return", () => {
    const method = new MethodDeclaration("describe", simpleTypeRef("String"), [], [
      new ReturnStatement(new StringLiteral("done"), simpleTypeRef("String")),
    ]);

    expect(() => insertStatement(method, 1, new CommentStatement("never"))).toThrow(/after a guaranteed return/i);
  });

  it("returns type-correct expression completions", () => {
    const type = createEditableType();
    const methodNode = type.findMethod("run")!;

    const expressions = getValidExpressions({
      currentType: type,
      currentCode: methodNode,
      block: methodNode,
      index: 2,
      position: methodNode.body[1],
      availableTypes: [type],
    }, simpleTypeRef("String"));

    expect(expressions.some((expression) => expression instanceof StringLiteral)).toBe(true);
    expect(expressions.some((expression) => expression instanceof ParameterAccess && expression.name === "prefix")).toBe(true);
    expect(expressions.some((expression) => expression instanceof LocalAccess && expression.name === "suffix")).toBe(true);
    expect(expressions.some((expression) => expression instanceof MethodInvocation && expression.methodName === "describe")).toBe(true);
    expect(expressions.some((expression) => expression instanceof FieldAccess && expression.memberName === "title")).toBe(true);
  });

  it("merges added removed and renamed members", () => {
    const existingHierarchy = createTypeHierarchy([
      userType("Actor", [
        method("walk", { type: "VoidTypeRef" }),
        method("say", simpleTypeRef("String"), [new UserParameter("value", simpleTypeRef("String"))]),
        method("wave", { type: "VoidTypeRef" }, [new UserParameter("times", simpleTypeRef("WholeNumber"))]),
      ], [
        field("name"),
        field("score", simpleTypeRef("WholeNumber")),
        field("legacyFlag", simpleTypeRef("DecimalNumber")),
      ]),
    ]);
    const incomingHierarchy = createTypeHierarchy([
      userType("Actor", [
        method("move", { type: "VoidTypeRef" }),
        method("say", simpleTypeRef("String"), [new UserParameter("value", simpleTypeRef("String"))]),
        method("jump", { type: "VoidTypeRef" }),
      ], [
        field("displayName"),
        field("score", simpleTypeRef("WholeNumber")),
        field("enabled", simpleTypeRef("Boolean")),
      ]),
    ]);

    const mergedResult = mergeUserTypes(
      [resolveUserType(existingHierarchy.resolve("Actor"))],
      [resolveUserType(incomingHierarchy.resolve("Actor"))],
    );

    const actor = mergedResult.merged[0]!;
    expect(actor.fields.map((entry) => entry.name)).toEqual(expect.arrayContaining(["displayName", "score", "enabled", "legacyFlag"]));
    expect(actor.methods.map((entry) => entry.name)).toEqual(expect.arrayContaining(["move", "say", "jump", "wave"]));
    expect(actor.fields.find((entry) => entry.name === "legacyFlag")?.deprecated).toBe(true);
    expect(actor.methods.find((entry) => entry.name === "wave")?.deprecated).toBe(true);
    expect(mergedResult.conflicts).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "rename", existingName: "name", incomingName: "displayName" }),
      expect.objectContaining({ reason: "rename", existingName: "walk", incomingName: "move" }),
    ]));
  });

  it("adds removes and renames methods while updating call sites", () => {
    const helper = new MethodDeclaration("helper", { type: "VoidTypeRef" }, [], []);
    const caller = new MethodDeclaration("caller", { type: "VoidTypeRef" }, [], [
      new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Actor")), "helper", [], helper)),
    ]);
    const type = new ClassDeclaration("Actor", "Object", [], [helper, caller], []);

    const added = addMethod(
      type,
      "describe",
      [new UserParameter("value", simpleTypeRef("String"))],
      simpleTypeRef("String"),
      new DoInOrder([new ReturnStatement(new StringLiteral("done"), simpleTypeRef("String"))]),
    );
    expect(type.methods.map((methodNode) => methodNode.name)).toContain("describe");
    expect(added.parent).toBe(type);

    removeMethod(type, "describe");
    expect(type.methods.map((methodNode) => methodNode.name)).not.toContain("describe");

    renameMethod(type, "helper", "assist");
    const invocation = (caller.body[0] as ExpressionStatement).expression as MethodInvocation;
    expect(type.methods.map((methodNode) => methodNode.name)).toContain("assist");
    expect(invocation.methodName).toBe("assist");
    expect(invocation.method?.name).toBe("assist");
  });

  it("copies and pastes statements with fresh node ids", () => {
    const method = new MethodDeclaration("run", { type: "VoidTypeRef" }, [], [
      new ExpressionStatement(new StringLiteral("first")),
      new ConditionalStatement(new BooleanLiteral(true), [new CommentStatement("nested")], []),
    ]);

    const serialized = copyStatements(method.body);
    const pasted = pasteStatements(method, method.body.length, serialized);

    expect(method.body).toHaveLength(4);
    expect(pasted).toHaveLength(2);
    expect(pasted[0]?.id).not.toBe(method.body[0]?.id);
    expect(pasted[1]?.id).not.toBe(method.body[1]?.id);
    const originalNested = (method.body[1] as ConditionalStatement).ifBody[0]!;
    const pastedNested = (pasted[1] as ConditionalStatement).ifBody[0]!;
    expect(pastedNested.id).not.toBe(originalNested.id);
  });
});
