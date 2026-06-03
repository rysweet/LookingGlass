// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "../src/block-editor/block-renderer.js";
import {
  BooleanLiteral,
  CommentStatement,
  ConditionalStatement,
  ExpressionStatement,
  MethodInvocation,
  ReturnStatement,
  StringLiteral,
  ThisExpression,
  WhileLoop,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { ClassDeclaration, FieldDeclaration, MethodDeclaration } from "../src/class-system.js";
import { LocalVariableDeclarationStatement } from "../src/ast-nodes.js";

function createProcedure(): MethodDeclaration {
  const wave = new MethodDeclaration("wave", { type: "VoidTypeRef" }, [], []);
  const run = new MethodDeclaration("run", { type: "VoidTypeRef" }, [], [
    new LocalVariableDeclarationStatement("message", simpleTypeRef("String"), new StringLiteral("hi"), false),
    new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Actor")), "wave", [], wave)),
    new ConditionalStatement(
      new BooleanLiteral(true),
      [new ReturnStatement(new StringLiteral("done"), simpleTypeRef("String"))],
      [new CommentStatement("else branch")],
    ),
    new WhileLoop(new BooleanLiteral(false), [new CommentStatement("loop body")]),
  ]);
  new ClassDeclaration("Actor", "Object", [], [wave, run], [
    new FieldDeclaration("name", simpleTypeRef("String"), new StringLiteral("alice")),
  ]);
  return run;
}

describe("block-renderer", () => {
  it("renders a procedure with nested HTML blocks", () => {
    const renderer = new BlockRenderer();
    const procedure = createProcedure();

    const element = renderer.render(procedure);

    expect(element.className).toContain("alice-block-renderer");
    expect(element.querySelectorAll(".alice-block").length).toBeGreaterThanOrEqual(6);
    expect(element.querySelectorAll(".alice-block-drop-indicator").length).toBeGreaterThan(0);
    expect(element.textContent).toContain("let message");
  });

  it("applies category classes and color coding", () => {
    const renderer = new BlockRenderer();
    const procedure = createProcedure();

    const element = renderer.render(procedure);

    const declaration = element.querySelector<HTMLElement>(".alice-block--declaration")!;
    const methodCall = element.querySelector<HTMLElement>(".alice-block--method")!;
    const control = element.querySelector<HTMLElement>(".alice-block--control")!;
    const comment = element.querySelector<HTMLElement>(".alice-block--comment")!;

    expect(declaration.style.getPropertyValue("--alice-block-color")).toBe("#3B82F6");
    expect(methodCall.style.getPropertyValue("--alice-block-color")).toBe("#8B5CF6");
    expect(control.style.getPropertyValue("--alice-block-color")).toBe("#F59E0B");
    expect(comment.style.getPropertyValue("--alice-block-color")).toBe("#6B7280");
  });

  it("renders nested blocks with indentation", () => {
    const renderer = new BlockRenderer();
    const procedure = createProcedure();

    const element = renderer.render(procedure);
    const nested = element.querySelector<HTMLElement>(".alice-block__nested")!;

    expect(nested).toBeTruthy();
    expect(nested.style.marginLeft).toBe("20px");
    expect(element.textContent).toContain("if");
    expect(element.textContent).toContain("else");
  });
});
