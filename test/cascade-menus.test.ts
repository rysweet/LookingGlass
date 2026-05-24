import { describe, expect, it } from "vitest";
import {
  ArrayLiteralExpression,
  BlockStatement,
  ClassDeclaration,
  FieldDeclaration,
  ForEachLoop,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  StringLiteral,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { ExpressionCascade } from "../src/cascade-menus.js";
import { TypeBrowser } from "../src/type-browser.js";

function createActorType(): { type: ClassDeclaration; method: MethodDeclaration; loopBody: BlockStatement } {
  const loop = new ForEachLoop(
    simpleTypeRef("String"),
    "item",
    new ArrayLiteralExpression([new StringLiteral("a")]),
    [new LocalVariableDeclarationStatement("count", simpleTypeRef("WholeNumber"), new IntegerLiteral(1), false)],
  );
  const method = new MethodDeclaration("act", { type: "VoidTypeRef" }, [], [loop], false);
  const type = new ClassDeclaration(
    "Actor",
    "SThing",
    null,
    null,
    [],
    [method, new MethodDeclaration("say", simpleTypeRef("String"), [], [], false)],
    [
      new FieldDeclaration("name", simpleTypeRef("String"), new StringLiteral("alice"), false, false),
      new FieldDeclaration("score", simpleTypeRef("WholeNumber"), new IntegerLiteral(10), false, false),
    ],
  );
  return { type, method, loopBody: new BlockStatement(loop.body) };
}

describe("cascade-menus", () => {
  it("collects accessible locals from block and loop scopes", () => {
    const { type, method } = createActorType();
    const browser = new TypeBrowser([type]);
    const cascade = new ExpressionCascade(browser);
    const loop = method.body[0] as ForEachLoop;
    const block = new BlockStatement(loop.body);

    const locals = cascade.collectAccessibleLocals({
      desiredType: simpleTypeRef("WholeNumber"),
      code: method,
      block,
      statementIndex: 1,
    });

    expect(locals.map((local) => local.name).sort()).toEqual(["count", "item"]);
  });

  it("filters options by desired type and includes member references", () => {
    const { type, method } = createActorType();
    const browser = new TypeBrowser([type]);
    const cascade = new ExpressionCascade(browser);
    const loop = method.body[0] as ForEachLoop;
    const menu = cascade.buildMenu({
      desiredType: simpleTypeRef("WholeNumber"),
      currentType: type,
      code: method,
      block: new BlockStatement(loop.body),
      statementIndex: 1,
    });

    const labels = menu.options.map((option) => option.label);
    expect(labels).toContain("count: WholeNumber");
    expect(labels).toContain("score");
    expect(labels).not.toContain("name");
  });

  it("builds cascading menus for type-compatible members and creators", () => {
    const { type } = createActorType();
    const browser = new TypeBrowser([type]);
    const cascade = new ExpressionCascade(browser);
    const menu = cascade.buildMenu({ desiredType: simpleTypeRef("String"), currentType: type, maxDepth: 1 });

    const labels = menu.options.map((option) => option.label);
    expect(labels).toContain('"text"');
    expect(labels).toContain("name");
    expect(labels).toContain("say()");

    const sayOption = menu.options.find((option) => option.label === "say()")!;
    expect(sayOption.submenu).not.toBeNull();
  });
});
