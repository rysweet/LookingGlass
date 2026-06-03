// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ProcedureBlockView } from "../src/block-editor/procedure-block-view.js";
import { createDataTransferStore } from "../src/block-editor/block-drag-handler.js";
import { CommentStatement, type Statement } from "../src/ast-nodes.js";
import { ClassDeclaration, MethodDeclaration } from "../src/class-system.js";
import type { DragEventLike } from "../src/drag-drop-html5-adapter.js";

function dispatchDragEvent(target: HTMLElement, type: string, store = createDataTransferStore()): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    dataTransfer: { value: store },
    clientX: { value: 0 },
    clientY: { value: 0 },
  });
  target.dispatchEvent(event as DragEventLike & Event);
}

describe("block-editor integration", () => {
  it("renders a procedure and inserts a toolbox block through drag and drop", () => {
    document.body.innerHTML = "";
    const procedure = new MethodDeclaration("run", { type: "VoidTypeRef" }, [], []);
    const type = new ClassDeclaration("Actor", "Object", [], [procedure], []);
    const view = new ProcedureBlockView(procedure, type);
    view.mount(document.body);

    const store = createDataTransferStore();
    const toolboxItem = view.element.querySelector<HTMLElement>("[data-drag-source='toolbox'][data-statement-kind='comment']")!;
    const dropZone = view.element.querySelector<HTMLElement>(`[data-owner-id='${procedure.id}'][data-insert-index='0']`)!;

    dispatchDragEvent(toolboxItem, "dragstart", store);
    dispatchDragEvent(dropZone, "dragover", store);
    dispatchDragEvent(dropZone, "drop", store);

    expect(procedure.body[0]).toBeInstanceOf(CommentStatement);
    expect(view.element.querySelectorAll(".alice-block").length).toBeGreaterThan(0);
    expect(view.element.textContent).toContain("Trash");
  });
});
