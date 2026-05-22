import { describe, expect, it } from "vitest";
import {
  ArrayAccessExpression,
  CommentStatement,
  ExpressionStatement,
  IdentifierExpression,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  NewArrayExpression,
  ReturnStatement,
  hydrateClassDecl,
  type RawClassDecl,
} from "../src/ast-nodes.js";
import { generateStatement } from "../src/tweedle-codegen.js";

describe("AST parity nodes", () => {
  it("hydrates comment statements into dedicated AST nodes", () => {
    const raw: RawClassDecl = {
      type: "ClassDeclaration",
      name: "Scene",
      superClass: null,
      modelType: null,
      visibility: null,
      constructors: [],
      fields: [],
      methods: [
        {
          type: "MethodDeclaration",
          name: "setup",
          returnType: { type: "VoidTypeRef" },
          parameters: [],
          isStatic: false,
          visibility: null,
          body: [{ type: "Comment", text: "set up the scene" }],
        },
      ],
    };

    const ast = hydrateClassDecl(raw);
    const statement = ast.methods[0].body[0];

    expect(statement).toBeInstanceOf(CommentStatement);
    expect(statement.parent).toBe(ast.methods[0]);
    expect(generateStatement({ type: "Comment", text: "set up the scene" })).toBe("// set up the scene");
  });

  it("preserves parent links for array creation and array access nodes", () => {
    const raw: RawClassDecl = {
      type: "ClassDeclaration",
      name: "Scene",
      superClass: null,
      modelType: null,
      visibility: null,
      constructors: [],
      fields: [],
      methods: [
        {
          type: "MethodDeclaration",
          name: "setup",
          returnType: { type: "VoidTypeRef" },
          parameters: [],
          isStatic: false,
          visibility: null,
          body: [
            {
              type: "LocalVariableDeclaration",
              name: "values",
              varType: { type: "SimpleTypeRef", name: "WholeNumber", isArray: true },
              isConstant: false,
              initializer: {
                type: "NewArray",
                elementType: { type: "SimpleTypeRef", name: "WholeNumber", isArray: false },
                elements: [{ type: "Literal", value: 1, literalType: "number" }],
                size: null,
              },
            },
            {
              type: "Return",
              expression: {
                type: "ArrayAccess",
                target: { type: "Identifier", name: "values" },
                index: { type: "Literal", value: 0, literalType: "number" },
              },
            },
          ],
        },
      ],
    };

    const ast = hydrateClassDecl(raw);
    const declaration = ast.methods[0].body[0];
    const ret = ast.methods[0].body[1];

    expect(declaration).toBeInstanceOf(LocalVariableDeclarationStatement);
    expect(ret).toBeInstanceOf(ReturnStatement);
    if (!(declaration instanceof LocalVariableDeclarationStatement)) {
      throw new Error("Expected LocalVariableDeclarationStatement");
    }
    if (!(ret instanceof ReturnStatement) || !(ret.expression instanceof ArrayAccessExpression)) {
      throw new Error("Expected array access return statement");
    }

    expect(declaration.initializer).toBeInstanceOf(NewArrayExpression);
    expect(declaration.initializer.parent).toBe(declaration);
    expect(ret.expression.parent).toBe(ret);
    expect(ret.expression.target).toBeInstanceOf(IdentifierExpression);
    expect(ret.expression.index).toBeInstanceOf(IntegerLiteral);
  });
});
