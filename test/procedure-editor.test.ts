import { describe, expect, it } from "vitest";
import {
  CommentStatement,
  DoInOrder,
  ExpressionStatement,
  MethodDeclaration,
  ReturnStatement,
  StringLiteral,
} from "../src/ast-nodes.js";
import { ProcedureEditor } from "../src/procedure-editor.js";

function createMethod(): MethodDeclaration {
  return new MethodDeclaration(
    "demo",
    { type: "VoidTypeRef" },
    [],
    [
      new CommentStatement("setup"),
      new DoInOrder([
        new ExpressionStatement(new StringLiteral("step one")),
        new ExpressionStatement(new StringLiteral("step two")),
      ]),
      new ReturnStatement(null),
    ],
    false,
  );
}

describe("procedure-editor", () => {
  it("inserts and deletes statements at the cursor", () => {
    const editor = new ProcedureEditor(createMethod());
    editor.setCursor(["body"], 1);

    editor.statementInsertion.insertAtCursor(new CommentStatement("inserted"));
    expect(editor.listStatementTypes()).toEqual(["Comment", "Comment", "DoInOrder", "Return"]);

    editor.setCursor(["body"], 1);
    const removed = editor.statementDeletion.deleteAtCursor();
    expect(removed).toBeInstanceOf(CommentStatement);
    expect(editor.listStatementTypes()).toEqual(["Comment", "DoInOrder", "Return"]);
  });

  it("reorders statements up and down", () => {
    const editor = new ProcedureEditor(createMethod());

    expect(editor.statementReordering.moveUp(["body"], 2)).toBe(1);
    expect(editor.listStatementTypes()).toEqual(["Comment", "Return", "DoInOrder"]);
    expect(editor.statementReordering.moveDown(["body"], 0)).toBe(1);
    expect(editor.listStatementTypes()).toEqual(["Return", "Comment", "DoInOrder"]);
  });

  it("collapses nested blocks in previews", () => {
    const editor = new ProcedureEditor(createMethod());

    editor.blockCollapsing.collapse(["body", "1:body"]);
    expect(editor.procedurePreview.snapshot().steps).toEqual([
      "// setup",
      "do in order",
      "return",
    ]);

    editor.blockCollapsing.expand(["body", "1:body"]);
    expect(editor.procedurePreview.snapshot().steps).toEqual([
      "// setup",
      "do in order",
      '"step one"',
      '"step two"',
      "return",
    ]);
  });

  it("supports direct path insertion and preview snapshots", () => {
    const editor = new ProcedureEditor(createMethod());

    editor.statementInsertion.insert(
      ["body", "1:body"],
      1,
      new ExpressionStatement(new StringLiteral("middle")),
    );

    expect(editor.listStatementTypes(["body", "1:body"])).toEqual([
      "ExpressionStatement",
      "ExpressionStatement",
      "ExpressionStatement",
    ]);
    expect(editor.procedurePreview.snapshot()).toMatchObject({
      steps: [
        "// setup",
        "do in order",
        '"step one"',
        '"middle"',
        '"step two"',
        "return",
      ],
      totalBlocks: 6,
    });
  });
});
