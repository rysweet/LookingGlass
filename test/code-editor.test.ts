import { describe, expect, it } from "vitest";
import {
  BooleanLiteral,
  CommentStatement,
  ConditionalStatement,
  ExpressionStatement,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  ReturnStatement,
  StringLiteral,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { CodeEditor } from "../src/code-editor.js";

describe("code-editor", () => {
  function createMethod(): MethodDeclaration {
    return new MethodDeclaration(
      "demo",
      { type: "VoidTypeRef" },
      [],
      [
        new LocalVariableDeclarationStatement("count", simpleTypeRef("WholeNumber"), new IntegerLiteral(1), false),
        new ConditionalStatement(
          new BooleanLiteral(true),
          [new ExpressionStatement(new StringLiteral("hello"))],
          [new ReturnStatement(null)],
        ),
      ],
      false,
    );
  }

  it("supports insert, remove, and reorder on statement lists", () => {
    const method = createMethod();
    const editor = new CodeEditor(method);

    editor.rootList.insert(1, new CommentStatement("middle"));
    expect(editor.rootList.list().map((statement) => statement.type)).toEqual([
      "LocalVariableDeclaration",
      "Comment",
      "IfElse",
    ]);

    editor.rootList.reorder(2, 0);
    expect(editor.rootList.list().map((statement) => statement.type)).toEqual([
      "IfElse",
      "LocalVariableDeclaration",
      "Comment",
    ]);

    const removed = editor.rootList.remove(2);
    expect(removed).toBeInstanceOf(CommentStatement);
    expect(editor.rootList.length).toBe(2);
  });

  it("creates visual blocks for nested statements", () => {
    const editor = new CodeEditor(createMethod());

    const blocks = editor.getVisualBlocks();
    expect(blocks.map((block) => ({ label: block.label, depth: block.depth, children: block.childListCount }))).toEqual([
      { label: "var count: WholeNumber", depth: 0, children: 0 },
      { label: "if true", depth: 0, children: 2 },
      { label: '"hello"', depth: 1, children: 0 },
      { label: "return", depth: 1, children: 0 },
    ]);
  });

  it("moves statements across drop targets and rejects descendant drops", () => {
    const editor = new CodeEditor(createMethod());
    const conditional = editor.rootList.at(1) as ConditionalStatement;
    const ifList = editor.getStatementLists().find((list) => list.parentStatement === conditional && list.role === "if")!;

    editor.moveStatement({ list: editor.rootList, index: 0 }, { list: ifList, index: 1 });
    expect(editor.rootList.length).toBe(1);
    expect(ifList.list().map((statement) => statement.type)).toEqual([
      "ExpressionStatement",
      "LocalVariableDeclaration",
    ]);

    expect(() => {
      editor.moveStatement({ list: editor.rootList, index: 0 }, { list: ifList, index: 0 });
    }).toThrow(/descendant bodies/);
  });

  it("exposes drop targets for each statement list index", () => {
    const editor = new CodeEditor(createMethod());
    const targets = editor.getDropTargets();

    expect(targets.map((target) => target.label)).toEqual([
      "body@0",
      "body@1",
      "body@2",
      "if@0",
      "if@1",
      "else@0",
      "else@1",
    ]);
  });
});
