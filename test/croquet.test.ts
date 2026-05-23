import { describe, expect, it, vi } from "vitest";
import {
  ActionOperation,
  BooleanState,
  BooleanStateOperation,
  Composite,
  DialogComposite,
  DoubleState,
  EnumCodec,
  IntegerCodec,
  IntegerState,
  InternalActionOperation,
  ItemSelectionState,
  KeyPressedTrigger,
  LazyOperation,
  ListData,
  ListSelectionState,
  MutableDataSingleSelectListState,
  SimulatedActionTrigger,
  SimpleComposite,
  StringCodec,
  StringState,
  TabComposite,
  TreeData,
  WizardDialogComposite,
} from "../src/croquet";
import { AddEntityCommand, UndoRedoManager } from "../src/undo-redo";
import { Scene } from "../src/story-api/scene";
import { SProp } from "../src/story-api/entities";

describe("croquet state framework", () => {
  it("tracks typed state changes and undo redo", () => {
    const manager = new UndoRedoManager();
    const state = new StringState("draft", {
      name: "title",
      undoRedo: manager,
    });
    const changes: string[] = [];
    const phases: string[] = [];

    state.addChangingListener((change) => {
      phases.push(`changing:${change.previousValue}->${change.value}`);
    });
    state.addListener((change) => {
      changes.push(`${change.previousValue}->${change.value}`);
    });

    state.value = "published";
    manager.undo();
    manager.redo();

    expect(state.value).toBe("published");
    expect(changes).toEqual([
      "draft->published",
      "published->draft",
      "draft->published",
    ]);
    expect(phases[0]).toBe("changing:draft->published");
  });

  it("round trips primitive and enum codecs", () => {
    enum PublishMode {
      Draft = "draft",
      Review = "review",
    }

    const stringCodec = new StringCodec();
    const integerCodec = new IntegerCodec();
    const enumCodec = new EnumCodec(Object.values(PublishMode), {
      localization: { draft: "Draft", review: "Review" },
    });

    expect(stringCodec.decode(stringCodec.encode("Alice"))).toBe("Alice");
    expect(integerCodec.decode(integerCodec.encode(42))).toBe(42);
    expect(enumCodec.decode(enumCodec.encode(PublishMode.Review))).toBe(PublishMode.Review);
    expect(enumCodec.appendRepresentation(PublishMode.Draft)).toBe("Draft");
  });

  it("enforces boolean integer and double contracts", () => {
    expect(() => new IntegerState(1.5)).toThrow(TypeError);
    expect(() => new DoubleState(Number.NaN)).toThrow(TypeError);
    expect(() => new BooleanState(true).setValue(true)).not.toThrow();
  });

  it("supports single and multi selection state helpers", () => {
    const codec = new StringCodec();
    const itemState = new ItemSelectionState<string>("beta", {
      name: "item",
      itemCodec: codec,
      items: ["alpha", "beta", "gamma"],
    });
    const betaSelected = itemState.getItemSelectedState("beta");
    const alphaOperation = itemState.getItemSelectionOperation("alpha");
    const trigger = new KeyPressedTrigger("a", { ctrlKey: true });

    alphaOperation.fire(trigger);
    expect(itemState.value).toBe("alpha");
    expect(betaSelected.value).toBe(false);
    expect(trigger.chord).toBe("Ctrl+a");

    const listData = new ListData(codec, ["alpha", "beta", "gamma"]);
    const multiState = new ListSelectionState<string>(["alpha"], {
      name: "multi",
      itemCodec: codec,
      data: listData,
    });
    multiState.selectItem("gamma");
    expect(multiState.selectedIndexes).toEqual([0, 2]);
    listData.internalRemoveItem("alpha");
    expect(multiState.selectedItems).toEqual(["gamma"]);
  });

  it("reconciles mutable single select state with backing list data", () => {
    const state = new MutableDataSingleSelectListState<string>(
      new StringCodec(),
      ["one", "two", "three"],
      "two",
      { name: "numbers" },
    );
    const events: string[] = [];

    state.data.addListener((event) => {
      events.push(`${event.type}:${event.items.join(",")}`);
    });

    state.moveItem(2, 0);
    state.removeItem("two");

    expect(state.data.toArray()).toEqual(["three", "one"]);
    expect(state.value).toBeNull();
    expect(events).toEqual(["move:three", "remove:two"]);
  });

  it("routes operation commands through undo redo", () => {
    const scene = new Scene();
    const manager = new UndoRedoManager();
    const operation = new ActionOperation(
      () => new AddEntityCommand(scene, "tree", new SProp()),
      { name: "addTree", undoRedo: manager },
    );

    operation.execute();
    expect(scene.getEntity("tree")).toBeInstanceOf(SProp);
    manager.undo();
    expect(scene.getEntity("tree")).toBeUndefined();
  });

  it("supports internal boolean and lazy operations with triggers", () => {
    const enabled = new BooleanState(false, { name: "flag" });
    const sourceTrigger = SimulatedActionTrigger.create({ test: true });
    const lazyFactory = vi.fn(() =>
      new InternalActionOperation(
        "lazy.fire",
        () => {
          enabled.setValue(true, sourceTrigger);
          return undefined;
        },
        { name: "lazyFire" },
      ),
    );
    const lazyOperation = new LazyOperation(lazyFactory, { name: "lazy" });
    const toggleOperation = new BooleanStateOperation(enabled, undefined, { name: "toggleFlag" });

    lazyOperation.fire();
    toggleOperation.fire(new KeyPressedTrigger("Space"));

    expect(lazyFactory).toHaveBeenCalledTimes(1);
    expect(enabled.value).toBe(false);
  });

  it("manages list and tree data events", () => {
    const listData = new ListData(new StringCodec(), ["root"]);
    const listEvents: string[] = [];
    listData.addListener((event) => {
      listEvents.push(`${event.type}:${event.items.join(",")}`);
    });
    listData.add("child");
    listData.move(1, 0);
    listData.clear();

    const tree = new TreeData<string>();
    const treeEvents: string[] = [];
    tree.addListener((event) => {
      treeEvents.push(event.type);
    });
    const root = tree.addRoot("scene");
    const camera = tree.addChild(root, "camera");
    tree.updateNode(camera, "activeCamera");
    tree.reorderNode(camera, 0);
    tree.removeNode(camera);

    expect(listEvents).toEqual(["add:child", "move:child", "clear:"]);
    expect(tree.flatten().map((node) => node.value)).toEqual(["scene"]);
    expect(treeEvents).toEqual(["add", "add", "update", "move", "remove"]);
  });

  it("creates composite views and dialog wizard lifecycle", () => {
    const activation: string[] = [];
    const base = new Composite("scene-editor", {
      createView: () => ({ kind: "base-view" }),
    });
    base.addActivationListener((active) => activation.push(`base:${active}`));
    expect(base.getView()).toEqual({ kind: "base-view" });

    class LoggingSimpleComposite extends SimpleComposite<{ kind: string }> {
      protected override handleActivated(): void {
        activation.push("simple:activated");
      }

      protected override handleDeactivated(): void {
        activation.push("simple:deactivated");
      }
    }

    const simple = new LoggingSimpleComposite("simple", {
      createView: () => ({ kind: "simple-view" }),
    });
    simple.activate();
    simple.deactivate();

    const tab = new TabComposite("tab", {
      createView: () => ({ kind: "tab-view" }),
      closeable: true,
    });
    tab.customizeTitleComponentAppearance((appearance) => {
      appearance.tooltip = "Editor";
      appearance.classes.push("active");
    });

    const dialog = new DialogComposite<{ kind: string }, string>("dialog", {
      createView: () => ({ kind: "dialog-view" }),
    });
    dialog.open();
    dialog.accept("saved");

    const wizard = new WizardDialogComposite<{ kind: string }, string>(
      "wizard",
      ["intro", "details", "finish"],
      { createView: () => ({ kind: "wizard-view" }) },
    );
    wizard.open();
    wizard.nextOperation.fire();
    wizard.nextOperation.fire();
    wizard.finishOperation.fire();

    expect(tab.isCloseable).toBe(true);
    expect(tab.titleAppearance.tooltip).toBe("Editor");
    expect(dialog.lastResult).toBe("saved");
    expect(dialog.wasAccepted).toBe(true);
    expect(wizard.lastResult).toBe("finish");
    expect(wizard.visitedSteps).toEqual(new Set([0, 1, 2]));
    expect(activation).toContain("simple:activated");
    expect(activation).toContain("simple:deactivated");
  });
});
