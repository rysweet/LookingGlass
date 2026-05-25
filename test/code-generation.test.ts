import { describe, expect, it } from "vitest";
import {
  ClassDeclaration,
  CommentStatement,
  ExpressionStatement,
  FieldDeclaration,
  IdentifierExpression,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  ReturnStatement,
  StringLiteral,
  ThisExpression,
  type TypeRef,
} from "../src/ast-nodes.js";
import {
  createTweedleSource,
  generateJavaHtml,
  generateJavaSource,
} from "../src/code-generation.js";

function simpleType(name: string, isArray = false): TypeRef {
  return { type: "SimpleTypeRef", name, isArray };
}

describe("code-generation", () => {
  it("generates formatted Java source from AST nodes", () => {
    const ast = new ClassDeclaration(
      "Greeter",
      "Object",
      null,
      "@Public",
      [],
      [
        new MethodDeclaration(
          "greet",
          { type: "VoidTypeRef" },
          [],
          [
            new CommentStatement("Say hello"),
            new ExpressionStatement(
              new MethodInvocation(new ThisExpression(simpleType("Greeter")), "say", [
                { name: null, value: new StringLiteral("Hello <Alice>") },
              ]),
            ),
          ],
          false,
          "@Public",
        ),
        new MethodDeclaration(
          "answer",
          simpleType("WholeNumber"),
          [],
          [
            new LocalVariableDeclarationStatement("value", simpleType("WholeNumber"), new IntegerLiteral(42), false),
            new ReturnStatement(new IdentifierExpression("value")),
          ],
          false,
          "@Public",
        ),
      ],
      [
        new FieldDeclaration("title", simpleType("String"), new StringLiteral("Coder"), false, false, "@Private"),
      ],
    );

    expect(generateJavaSource(ast)).toBe(`public class Greeter {\n  private String title = "Coder";\n\n  public void greet() {\n    // Say hello\n    this.say("Hello <Alice>");\n  }\n\n  public int answer() {\n    int value = 42;\n    return value;\n  }\n}`);
  });

  it("renders HTML with escaped source and keyword highlighting", () => {
    const ast = new ClassDeclaration(
      "Greeter",
      "Object",
      null,
      "@Public",
      [],
      [new MethodDeclaration("greet", { type: "VoidTypeRef" }, [], [new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleType("Greeter")), "say", [{ name: null, value: new StringLiteral("<hi>") }]))], false, "@Public")],
      [],
    );

    const html = generateJavaHtml(ast);

    expect(html).toContain('<pre class="alice-code"><code>');
    expect(html).toContain('<span class="keyword">public</span>');
    expect(html).toContain('<span class="keyword">class</span>');
    expect(html).toContain('&lt;hi&gt;');
  });

  it("creates Tweedle source for parser-facing tests", () => {
    const source = createTweedleSource("Runner", [
      {
        name: "myFirstMethod",
        body: [
          "doInOrder {",
          "  bunny.hop();",
          "}",
        ],
      },
    ]);

    expect(source).toBe(`class Runner {\n  void myFirstMethod() {\n    doInOrder {\n      bunny.hop();\n    }\n  }\n}`);
  });
});
