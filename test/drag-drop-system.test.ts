import { describe, expect, it } from "vitest";
import {
  DragFeedback,
  DragHistory,
  DragSource,
  DropPolicy,
  DropTarget,
} from "../src/drag-drop-system";

describe("drag-drop-system", () => {
  it("creates drag proxies from sources", () => {
    const source = new DragSource({
      id: "block-say",
      type: "statement",
      label: "Say",
      payload: () => ({ kind: "say", text: "hello" }),
    });

    const proxy = source.beginDrag({ x: 10, y: 20 });

    expect(proxy.sourceId).toBe("block-say");
    expect(proxy.sourceType).toBe("statement");
    expect(proxy.payload).toEqual({ kind: "say", text: "hello" });
    expect(proxy.position).toEqual({ x: 10, y: 20 });
  });

  it("validates drop compatibility and records accepted drops", () => {
    const policy = new DropPolicy();
    policy.allow("statement", "code-editor");
    const target = new DropTarget<{ kind: string }>({ id: "editor", type: "code-editor", accepts: ["statement"] });
    const proxy = new DragSource({ id: "loop", type: "statement", payload: { kind: "loop" } }).beginDrag();

    expect(target.hover(proxy, policy)).toBe(true);
    expect(target.drop(proxy, policy)).toBe(true);
    expect(target.hoverCount).toBe(1);
    expect(target.received.map((entry) => entry.payload)).toEqual([{ kind: "loop" }]);
  });

  it("rejects drops that violate the policy", () => {
    const policy = new DropPolicy();
    policy.allow("gallery-item", "scene-editor");
    const target = new DropTarget({ id: "editor", type: "code-editor", accepts: ["statement"] });
    const proxy = new DragSource({ id: "bunny", type: "gallery-item", payload: { model: "Bunny" } }).beginDrag();

    expect(target.hover(proxy, policy)).toBe(false);
    expect(target.drop(proxy, policy)).toBe(false);
    expect(target.received).toEqual([]);
  });

  it("tracks drag feedback ghost and highlights", () => {
    const feedback = new DragFeedback();
    const proxy = new DragSource({ id: "say", type: "statement", label: "Say", payload: { kind: "say" } }).beginDrag({ x: 5, y: 5 });

    expect(feedback.begin(proxy)).toEqual({
      ghost: { label: "Say", position: { x: 5, y: 5 }, opacity: 0.7 },
      highlightedTargetId: null,
    });

    proxy.moveTo({ x: 25, y: 40 });
    feedback.move(proxy);
    feedback.highlight("editor-drop-zone");
    expect(feedback.snapshot()).toEqual({
      ghost: { label: "Say", position: { x: 25, y: 40 }, opacity: 0.7 },
      highlightedTargetId: "editor-drop-zone",
    });
    expect(feedback.clear()).toEqual({ ghost: null, highlightedTargetId: null });
  });

  it("supports undo and redo for drag operations", () => {
    const history = new DragHistory();
    const operations: string[] = [];
    history.record({
      description: "drop block",
      undo: () => operations.push("undo"),
      redo: () => operations.push("redo"),
    });

    expect(history.canUndo).toBe(true);
    expect(history.undo()).toBe(true);
    expect(history.canRedo).toBe(true);
    expect(history.redo()).toBe(true);
    expect(operations).toEqual(["undo", "redo"]);
  });
});
