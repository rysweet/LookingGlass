import { describe, expect, it } from "vitest";
import {
  BooleanState,
  Composite,
  IntegerState,
  Operation,
  StringState,
} from "../src/croquet";
import { AddEntityCommand, UndoRedoManager } from "../src/undo-redo";
import { Scene } from "../src/story-api/scene";
import { SProp } from "../src/story-api/entities";

describe("croquet state framework", () => {
  it("State listeners observe value changes and undo/redo", () => {
    const manager = new UndoRedoManager();
    const state = new StringState("draft", {
      name: "title",
      undoRedo: manager,
    });
    const changes: string[] = [];

    state.addListener((change) => {
      changes.push(`${change.previousValue}->${change.value}`);
    });

    state.value = "published";
    expect(state.value).toBe("published");

    manager.undo();
    expect(state.value).toBe("draft");

    manager.redo();
    expect(state.value).toBe("published");
    expect(changes).toEqual([
      "draft->published",
      "published->draft",
      "draft->published",
    ]);
  });

  it("typed states enforce their contracts", () => {
    expect(() => new IntegerState(1.5)).toThrow(TypeError);
    expect(() => new BooleanState(true).setValue(true as unknown as boolean)).not.toThrow();
    expect(() => new IntegerState(1).setValue(2.5)).toThrow(TypeError);
  });

  it("Operation routes commands through undo/redo", () => {
    const scene = new Scene();
    const manager = new UndoRedoManager();
    const operation = new Operation(
      () => new AddEntityCommand(scene, "tree", new SProp()),
      { name: "addTree", undoRedo: manager },
    );

    operation.execute();
    expect(scene.getEntity("tree")).toBeInstanceOf(SProp);

    manager.undo();
    expect(scene.getEntity("tree")).toBeUndefined();
  });

  it("disabled operations do not execute", () => {
    const scene = new Scene();
    const operation = new Operation(
      () => new AddEntityCommand(scene, "tree", new SProp()),
      { name: "addTree", enabled: false },
    );

    operation.execute();
    expect(scene.getEntity("tree")).toBeUndefined();

    operation.isEnabled = true;
    operation.execute();
    expect(scene.getEntity("tree")).toBeInstanceOf(SProp);
  });

  it("Composite groups states and operations with activation lifecycle", () => {
    const composite = new Composite("scene-editor");
    const nameState = composite.registerState(
      "name",
      new StringState("scene", { name: "sceneName" }),
    );
    const saveOperation = composite.registerOperation(
      "save",
      new Operation(() => undefined, { name: "save" }),
    );
    const activationStates: boolean[] = [];

    composite.addActivationListener((active) => {
      activationStates.push(active);
    });

    composite.activate();
    composite.deactivate();

    expect(composite.getState("name")).toBe(nameState);
    expect(composite.getOperation("save")).toBe(saveOperation);
    expect(composite.contains(nameState)).toBe(true);
    expect(composite.contains(saveOperation)).toBe(true);
    expect(activationStates).toEqual([true, false]);
  });
});
