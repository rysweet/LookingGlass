import { describe, expect, it } from "vitest";
import {
  BooleanLiteral,
  ClassDeclaration,
  CommentStatement,
  ConditionalStatement,
  ConstructorDeclaration,
  DisabledBlockStatement,
  DoubleLiteral,
  ExpressionStatement,
  IdentifierExpression,
  IntegerLiteral,
  MethodDeclaration,
  MethodInvocation,
  NewArrayExpression,
  StringLiteral,
  SwitchCaseStatement,
  ThisExpression,
  type TypeRef,
} from "../src/ast-nodes.js";
import {
  AstSerializationError,
  decodeAstNode,
  decodeClassDeclaration,
  encodeAstNode,
  encodeClassDeclaration,
} from "../src/ast-serialization.js";

function simpleType(name: string, isArray = false): TypeRef {
  return { type: "SimpleTypeRef", name, isArray };
}

function normalizeXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").trim();
}

describe("ast-serialization", () => {
  it("round-trips complex class declarations through XML", () => {
    const ast = new ClassDeclaration(
      "Scene",
      "SScene",
      "SceneModel",
      "@Public",
      [
        new ConstructorDeclaration(
          "Scene",
          [
            {
              name: "speed",
              paramType: simpleType("DecimalNumber"),
              isVarArgs: false,
              defaultValue: new DoubleLiteral(1.5),
            },
          ],
          [new CommentStatement("ready")],
          "@Public",
        ),
      ],
      [
        new MethodDeclaration(
          "move",
          { type: "VoidTypeRef" },
          [],
          [
            new ConditionalStatement(
              new BooleanLiteral(true),
              [
                new ExpressionStatement(
                  new MethodInvocation(new ThisExpression(), "say", [
                    { name: null, value: new StringLiteral("hi") },
                  ]),
                ),
              ],
              [new DisabledBlockStatement("later")],
            ),
            new SwitchCaseStatement(
              new IdentifierExpression("choice"),
              [{ value: new IntegerLiteral(1), body: [new CommentStatement("one")] }],
              [new CommentStatement("fallback")],
            ),
          ],
          false,
          "@Public",
        ),
      ],
      [],
    );

    const xml = encodeClassDeclaration(ast);
    const decoded = decodeClassDeclaration(xml);

    expect(normalizeXml(encodeClassDeclaration(decoded))).toBe(normalizeXml(xml));
    expect(decoded.methods[0].parent).toBe(decoded);
    expect(decoded.methods[0].body[0]).toBeInstanceOf(ConditionalStatement);
  });

  it("preserves integer-vs-double literal kinds", () => {
    const integerXml = encodeAstNode(new IntegerLiteral(1));
    const doubleXml = encodeAstNode(new DoubleLiteral(1));

    expect(decodeAstNode(integerXml)).toBeInstanceOf(IntegerLiteral);
    expect(decodeAstNode(doubleXml)).toBeInstanceOf(DoubleLiteral);
  });

  it("encodes and decodes standalone expressions", () => {
    const xml = encodeAstNode(
      new MethodInvocation(new ThisExpression(), "say", [
        { name: null, value: new StringLiteral("hello") },
      ]),
    );

    const decoded = decodeAstNode(xml);
    expect(decoded).toBeInstanceOf(MethodInvocation);
    expect((decoded as MethodInvocation).arguments[0].value).toBeInstanceOf(StringLiteral);
  });

  it("preserves array type references and nested expressions", () => {
    const xml = encodeAstNode(
      new NewArrayExpression(simpleType("WholeNumber", true), [new IntegerLiteral(1)], null),
    );
    const decoded = decodeAstNode(xml);

    expect(decoded).toBeInstanceOf(NewArrayExpression);
    expect((decoded as NewArrayExpression).elementType).toEqual(simpleType("WholeNumber", true));
  });

  it("rejects malformed XML roots", () => {
    expect(() => decodeClassDeclaration("<not-ast />")).toThrow(AstSerializationError);
  });
});
