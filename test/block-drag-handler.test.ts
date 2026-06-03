// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { BlockDragHandler, createDataTransferStore } from "../src/block-editor/block-drag-handler.js";
import { BlockRenderer } from "../src/block-editor/block-renderer.js";
import { BlockToolbox } from "../src/block-editor/block-toolbox.js";
import {
  CommentStatement,
  ExpressionStatement,
  MethodInvocation,
  StringLiteral,
  ThisExpression,
  simpleTypeRef,
} from "../src/ast-nodes.js";
import { ClassDeclaration, MethodDeclaration } from "../src/class-system.js";
import { DataTransferHelper, type DragEventLike } from "../src/drag-drop-html5-adapter.js";

function dispatchDragEvent(target: HTMLElement, type: string, store = createDataTransferStore()): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    dataTransfer: { value: store },
    clientX: { value: 0 },
    clientY: { value: 0 },
  });
  target.dispatchEvent(event as DragEventLike & Event);
}

function createHarness() {
  const helper = new MethodDeclaration("helper", { type: "VoidTypeRef" }, [], []);
  const procedure = new MethodDeclaration("run", { type: "VoidTypeRef" }, [], [
    new ExpressionStatement(new StringLiteral("first")),
    new ExpressionStatement(new MethodInvocation(new ThisExpression(simpleTypeRef("Actor")), "helper", [], helper)),
  ]);
  const type = new ClassDeclaration("Actor", "Object", [], [helper, procedure], []);

  const root = document.createElement("div");
  const trash = document.createElement("div");
  trash.dataset.dropZone = "trash";
  trash.textContent = "Trash";

  const render = () => {
    root.replaceChildren();
    root.append(new BlockToolbox(procedure, type).render());
    root.append(new BlockRenderer().render(procedure));
    root.append(trash);
  };
  render();

  const handler = new BlockDragHandler({
    procedure,
    currentType: type,
    root,
    trashZone: trash,
    onMutate: render,
  });
  handler.connect();
  document.body.append(root);

  return { procedure, root, trash, teardown: () => handler.disconnect() };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("block-drag-handler", () => {
  it("creates a statement when dragging from the toolbox into the procedure", () => {
    const harness = createHarness();
    const store = createDataTransferStore();
    const toolboxItem = harness.root.querySelector<HTMLElement>("[data-drag-source='toolbox'][data-statement-kind='comment']")!;
    const dropZone = harness.root.querySelector<HTMLElement>(`[data-owner-id='${harness.procedure.id}'][data-insert-index='0']`)!;

    dispatchDragEvent(toolboxItem, "dragstart", store);
    dispatchDragEvent(dropZone, "dragover", store);
    dispatchDragEvent(dropZone, "drop", store);

    expect(harness.procedure.body[0]).toBeInstanceOf(CommentStatement);
    harness.teardown();
  });

  it("reorders existing statements when dragged within the procedure", () => {
    const harness = createHarness();
    const store = createDataTransferStore();
    const statement = harness.root.querySelectorAll<HTMLElement>("[data-drag-source='statement']")[1]!;
    const dropZone = harness.root.querySelector<HTMLElement>(`[data-owner-id='${harness.procedure.id}'][data-insert-index='0']`)!;

    dispatchDragEvent(statement, "dragstart", store);
    dispatchDragEvent(dropZone, "dragover", store);
    dispatchDragEvent(dropZone, "drop", store);

    expect((harness.procedure.body[0] as ExpressionStatement).expression).toBeInstanceOf(MethodInvocation);
    harness.teardown();
  });

  it("deletes a statement when dropped on the trash zone", () => {
    const harness = createHarness();
    const store = createDataTransferStore();
    const statement = harness.root.querySelector<HTMLElement>("[data-drag-source='statement']")!;

    dispatchDragEvent(statement, "dragstart", store);
    dispatchDragEvent(harness.trash, "dragover", store);
    dispatchDragEvent(harness.trash, "drop", store);

    expect(harness.procedure.body).toHaveLength(1);
    harness.teardown();
  });
});
