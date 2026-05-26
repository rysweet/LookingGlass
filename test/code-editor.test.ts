import { describe, expect, it } from "vitest";
import {
  BooleanLiteral,
  CommentStatement,
  ConditionalStatement,
  ConstructorBlockStatement,
  CountUpToStatement,
  DisabledBlockStatement,
  DoTogether,
  ExpressionStatement,
  FieldAccess,
  IntegerLiteral,
  LocalVariableDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  ReturnStatement,
  StringLiteral,
  SuperConstructorInvocationStatement,
  SwitchCaseStatement,
  ThisConstructorInvocationStatement,
  ThisExpression,
  TryCatchStatement,
  WhileLoop,
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

  function createConstructorBody(): ConstructorBlockStatement {
    return new ConstructorBlockStatement(
      new SuperConstructorInvocationStatement(null),
      [new CommentStatement("body")],
    );
  }

  function createComplexMethod(): MethodDeclaration {
    return new MethodDeclaration(
      "complex",
      { type: "VoidTypeRef" },
      [],
      [
        new CountUpToStatement(new IntegerLiteral(3), [
          new DoTogether([
            new ExpressionStatement(new MethodInvocation(
              new ThisExpression(simpleTypeRef("Scene")),
              "step",
              [{ name: null, value: new StringLiteral("left") }],
            )),
          ]),
        ]),
        new TryCatchStatement(
          [new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Scene")), "run", []))],
          simpleTypeRef("Exception"),
          "problem",
          [new DisabledBlockStatement("broken();")],
        ),
        new SwitchCaseStatement(
          new FieldAccess(new ThisExpression(simpleTypeRef("Scene")), "mode"),
          [
            {
              value: new StringLiteral("day"),
              body: [new WhileLoop(new BooleanLiteral(true), [new CommentStatement("loop")])],
            },
          ],
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
    expect(blocks[1].path).toEqual(["body", "1"]);
    expect(blocks[2].listPath).toEqual(["body", "1:if"]);
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
    expect(targets[3].path).toEqual(["body", "1:if"]);
  });

  it("keeps constructor invocations pinned outside the editable body list", () => {
    const constructorBody = createConstructorBody();
    const editor = new CodeEditor(constructorBody);

    expect(editor.getLeadingConstructorInvocation()).toBe(constructorBody.constructorInvocationStatement);
    expect(editor.rootList.list().map((statement) => statement.type)).toEqual(["Comment"]);

    editor.setLeadingConstructorInvocation(new ThisConstructorInvocationStatement(null));

    expect(editor.getLeadingConstructorInvocation()).toBeInstanceOf(ThisConstructorInvocationStatement);
    expect(editor.rootList.list().map((statement) => statement.type)).toEqual(["Comment"]);
  });

  it("rejects constructor invocations inside editable statement lists", () => {
    const editor = new CodeEditor(createMethod());

    expect(() => editor.rootList.insert(0, new SuperConstructorInvocationStatement(null))).toThrow(/constructor headers/);
    expect(() => editor.setLeadingConstructorInvocation(new ThisConstructorInvocationStatement(null))).toThrow(/constructor bodies/);
  });

  it("builds a nested method body visual model with list paths", () => {
    const editor = new CodeEditor(createComplexMethod());
    const model = editor.getMethodBodyVisualModel();

    expect(model.lists.map((list) => list.path.join(">"))).toEqual([
      "body",
      "body>0:body",
      "body>0:body>0:body",
      "body>1:try",
      "body>1:catch",
      "body>2:case:0",
      "body>2:case:0>0:body",
      "body>2:default",
    ]);
    expect(model.blocks.map((block) => block.label)).toEqual([
      "count 3",
      "do together",
      'This.step("left")',
      "try / catch problem",
      "This.run()",
      "disabled: broken();",
      "switch This.mode",
      "while true",
      "// loop",
      "return",
    ]);
  });

  it("finds statement locations and supports targeted replacement and enablement", () => {
    const editor = new CodeEditor(createComplexMethod());
    const switchStatement = editor.rootList.at(2);
    const catchList = editor.findStatementList(["body", "1:catch"]);

    expect(editor.findStatementLocation(switchStatement)).toEqual({ list: editor.rootList, index: 2 });

    const replaced = editor.replaceStatement({ list: catchList, index: 0 }, new CommentStatement("rescued"));
    expect(replaced).toBeInstanceOf(DisabledBlockStatement);
    expect(catchList.at(0)).toBeInstanceOf(CommentStatement);

    expect(editor.setStatementEnabled({ list: editor.rootList, index: 2 }, false)).toBe(false);
    expect(editor.getVisualBlocks().find((block) => block.path.join(">") === "body>2")?.enabled).toBe(false);
  });

  it("clamps direct list insertions to the nearest valid index", () => {
    const editor = new CodeEditor(createMethod());

    expect(editor.rootList.insert(-5, new CommentStatement("first"))).toBe(0);
    expect(editor.rootList.insert(99, new CommentStatement("last"))).toBe(3);
    expect(editor.rootList.list().map((statement) => statement.type)).toEqual([
      "Comment",
      "LocalVariableDeclaration",
      "IfElse",
      "Comment",
    ]);
  });

  it("normalizes same-list moves that target later indices", () => {
    const editor = new CodeEditor(createMethod());

    editor.moveStatement({ list: editor.rootList, index: 0 }, { list: editor.rootList, index: 2 });

    expect(editor.rootList.list().map((statement) => statement.type)).toEqual([
      "IfElse",
      "LocalVariableDeclaration",
    ]);
  });

  it("returns null for detached statements and throws for unknown list paths", () => {
    const editor = new CodeEditor(createMethod());
    const detached = new CommentStatement("detached");

    expect(editor.findStatementLocation(detached)).toBeNull();
    expect(() => editor.findStatementList(["body", "missing:list"])).toThrow(/unknown statement list path/);
  });

  it("rejects replacing nested statements with constructor invocations", () => {
    const editor = new CodeEditor(createMethod());
    const conditional = editor.rootList.at(1) as ConditionalStatement;
    const ifList = editor.getStatementLists().find((list) => list.parentStatement === conditional && list.role === "if")!;

    expect(() => editor.replaceStatement({ list: ifList, index: 0 }, new ThisConstructorInvocationStatement(null))).toThrow(/constructor headers/);
    expect(ifList.at(0)).toBeInstanceOf(ExpressionStatement);
  });

  const insertionCases = [
    { label: "clamps oversized insertStatement indices to the end", index: 99, expected: ["LocalVariableDeclaration", "IfElse", "Comment"] },
    { label: "clamps negative insertStatement indices to the start", index: -3, expected: ["Comment", "LocalVariableDeclaration", "IfElse"] },
    { label: "inserts into the middle when the target index is in bounds", index: 1, expected: ["LocalVariableDeclaration", "Comment", "IfElse"] },
  ] as const;

  for (const testCase of insertionCases) {
    it(testCase.label, () => {
      const editor = new CodeEditor(createMethod());
      editor.insertStatement({ list: editor.rootList, index: testCase.index }, new CommentStatement("inserted"));
      expect(editor.rootList.list().map((statement) => statement.type)).toEqual(testCase.expected);
    });
  }

  const reorderCases = [
    { label: "reorders forward within the root list", from: 0, to: 2, expected: ["IfElse", "LocalVariableDeclaration"] },
    { label: "reorders backward within the root list", from: 1, to: 0, expected: ["IfElse", "LocalVariableDeclaration"] },
    { label: "keeps order stable when reordering to the same index", from: 1, to: 1, expected: ["LocalVariableDeclaration", "IfElse"] },
  ] as const;

  for (const testCase of reorderCases) {
    it(testCase.label, () => {
      const editor = new CodeEditor(createMethod());
      editor.rootList.reorder(testCase.from, testCase.to);
      expect(editor.rootList.list().map((statement) => statement.type)).toEqual(testCase.expected);
    });
  }

  const descriptorCases = [
    { path: ["body"] as const, role: "body", length: 2 },
    { path: ["body", "1:if"] as const, role: "if", length: 1 },
    { path: ["body", "1:else"] as const, role: "else", length: 1 },
  ];

  for (const testCase of descriptorCases) {
    it(`describes statement list ${testCase.path.join(">")}`, () => {
      const editor = new CodeEditor(createMethod());
      const descriptor = editor.findStatementList(testCase.path).describe();
      expect(descriptor.role).toBe(testCase.role);
      expect(descriptor.length).toBe(testCase.length);
      expect(descriptor.path).toEqual([...testCase.path]);
    });
  }

  const enabledCases = [
    { label: "disables the first root statement", index: 0, enabled: false },
    { label: "re-enables the first root statement", index: 0, enabled: true },
    { label: "disables the conditional statement", index: 1, enabled: false },
  ] as const;

  for (const testCase of enabledCases) {
    it(testCase.label, () => {
      const editor = new CodeEditor(createMethod());
      if (testCase.enabled) {
        editor.setStatementEnabled({ list: editor.rootList, index: testCase.index }, false);
      }
      expect(editor.setStatementEnabled({ list: editor.rootList, index: testCase.index }, testCase.enabled)).toBe(testCase.enabled);
      expect(editor.rootList.at(testCase.index).isEnabled).toBe(testCase.enabled);
    });
  }

  it("creates nested drop targets after moving a statement into the if body", () => {
    const editor = new CodeEditor(createMethod());
    const conditional = editor.rootList.at(1) as ConditionalStatement;
    const ifList = editor.getStatementLists().find((list) => list.parentStatement === conditional && list.role === "if")!;

    editor.moveStatement({ list: editor.rootList, index: 0 }, { list: ifList, index: 1 });

    expect(editor.getDropTargets().map((target) => target.label)).toEqual([
      "body@0",
      "body@1",
      "if@0",
      "if@1",
      "if@2",
      "else@0",
      "else@1",
    ]);
  });
});
