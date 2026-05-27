import { describe, expect, it } from "vitest";
import {
  ASTClipboard,
  ASTEditorHistory,
  ASTEditorState,
  BlockEditor,
  ExpressionSlot,
  InlineEditor,
  StatementInsertionPoint,
} from "../src/ast-editor.js";

describe("ast-editor", () => {
  it("tracks cursor selection and edit mode", () => {
    const state = new ASTEditorState([0, 1]);
    state.setSelection([0, 1], [0, 2]);
    state.setEditMode("drag");
    state.moveCursor([3]);

    expect(state.cursorPath).toEqual([3]);
    expect(state.selection).toEqual({ anchorPath: [0, 1], focusPath: [0, 2] });
    expect(state.isPathSelected([0, 2])).toBe(true);
    expect(state.editMode).toBe("drag");
  });

  it("inserts statements at bounded insertion points", () => {
    const point = new StatementInsertionPoint<string>([1, 2], 10);
    expect(point.clamp(2)).toBe(2);
    expect(point.insertInto(["alpha", "beta"], "gamma")).toEqual(["alpha", "beta", "gamma"]);
  });

  it("fills and clears expression slots with type validation", () => {
    const slot = new ExpressionSlot("condition", "Condition", ["Boolean"]);
    slot.fill(true, "Boolean");
    expect(slot.isFilled).toBe(true);
    expect(slot.value).toBe(true);
    expect(() => slot.fill("nope", "String")).toThrow(/does not accept/i);
    slot.clear();
    expect(slot.isFilled).toBe(false);
  });

  it("edits blocks with insert move replace and remove operations", () => {
    const editor = new BlockEditor([{ id: 1 }, { id: 2 }]);
    editor.insert(1, { id: 3 });
    editor.move(2, 0);
    const replaced = editor.replace(1, { id: 4 });
    const removed = editor.remove(2);

    expect(editor.statements).toEqual([{ id: 2 }, { id: 4 }]);
    expect(replaced).toEqual({ id: 1 });
    expect(removed).toEqual({ id: 3 });
  });

  it("supports inline literal name and type edits", () => {
    const editor = new InlineEditor();
    expect(editor.editLiteral("Alice")).toBe('"Alice"');
    expect(editor.editName(" 1 invalid name ")).toBe("_1_invalid_name");
    expect(editor.editType("  SModel   subclass ")).toBe("SModel subclass");
  });

  it("records undo and redo snapshots for AST edits", () => {
    const history = new ASTEditorHistory<{ statements: string[] }>(2);
    history.record({ statements: ["before"] }, { statements: ["after"] }, "replace statement");

    expect(history.canUndo).toBe(true);
    expect(history.peekUndoDescription()).toBe("replace statement");
    expect(history.undo()).toEqual({ statements: ["before"] });
    expect(history.canRedo).toBe(true);
    expect(history.redo()).toEqual({ statements: ["after"] });
  });

  it("copies and cuts AST fragments without leaking mutations", () => {
    const clipboard = new ASTClipboard<{ statements: string[] }>();
    const fragment = { statements: ["walk", "turn"] };

    clipboard.copy(fragment);
    fragment.statements[0] = "mutated";
    expect(clipboard.paste()).toEqual({ statements: ["walk", "turn"] });

    clipboard.cut({ statements: ["jump"] });
    expect(clipboard.consume()).toEqual({ statements: ["jump"] });
    expect(clipboard.hasFragment).toBe(false);
  });
});
