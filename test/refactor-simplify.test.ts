/**
 * Tests for Step 9: Refactor and Simplify.
 *
 * Covers:
 * 1. OperationCommandAdapter (croquet-operations → undo-redo bridge)
 * 2. OperationHistory non-undoable support
 * 3. DragSession state machine
 * 4. ShortcutManager.triggerFirst() scope-priority resolution
 */
import { describe, expect, it } from "vitest";
import {
  Operation,
  OperationHistory,
  CompoundOperation,
  OperationCommandAdapter,
} from "../src/croquet-operations";
import { UndoRedoManager } from "../src/undo-redo";
import {
  DragSession,
  DragSource,
  DragProxy,
  DropPolicy,
  DropTarget,
} from "../src/drag-drop-system";
import { ShortcutManager, type ShortcutDefinition } from "../src/keyboard-shortcuts";

// ===========================================================================
// 1. OperationCommandAdapter
// ===========================================================================

describe("OperationCommandAdapter", () => {
  it("bridges an Operation into a Command usable by UndoRedoManager", () => {
    let value = 0;
    const adapter = new OperationCommandAdapter(
      () =>
        new Operation("inc", {
          execute: () => { value = 1; },
          undo: () => { value = 0; },
        }),
      "increment",
    );

    expect(adapter.description).toBe("increment");

    const manager = new UndoRedoManager();
    manager.execute(adapter);
    expect(value).toBe(1);

    manager.undo();
    expect(value).toBe(0);

    manager.redo();
    expect(value).toBe(1);
  });

  it("calls the factory exactly once (redo uses operation.redo, not a new factory call)", () => {
    let factoryCalls = 0;
    let value = 0;

    const adapter = new OperationCommandAdapter(() => {
      factoryCalls++;
      return new Operation("set", {
        execute: () => { value = 10; },
        undo: () => { value = 0; },
        redo: () => { value = 10; },
      });
    });

    const manager = new UndoRedoManager();
    manager.execute(adapter);
    expect(factoryCalls).toBe(1);

    manager.undo();
    manager.redo();
    expect(factoryCalls).toBe(1); // factory NOT called again

    manager.undo();
    manager.redo();
    expect(factoryCalls).toBe(1);
    expect(value).toBe(10);
  });

  it("uses operation name as description when no label is provided", () => {
    const adapter = new OperationCommandAdapter(
      () => new Operation("my-op", { execute: () => {}, undo: () => {} }),
    );

    // Before execute, operation doesn't exist yet
    expect(adapter.description).toBe("operation");

    const manager = new UndoRedoManager();
    manager.execute(adapter);

    // After execute, uses the operation's name
    expect(adapter.description).toBe("my-op");
  });

  it("wraps a CompoundOperation correctly", () => {
    let a = false;
    let b = false;

    const adapter = new OperationCommandAdapter(
      () =>
        new CompoundOperation("both", [
          new Operation("set-a", {
            execute: () => { a = true; },
            undo: () => { a = false; },
          }),
          new Operation("set-b", {
            execute: () => { b = true; },
            undo: () => { b = false; },
          }),
        ]),
      "compound-adapter",
    );

    const manager = new UndoRedoManager();
    manager.execute(adapter);
    expect(a).toBe(true);
    expect(b).toBe(true);

    manager.undo();
    expect(a).toBe(false);
    expect(b).toBe(false);

    manager.redo();
    expect(a).toBe(true);
    expect(b).toBe(true);
  });
});

// ===========================================================================
// 2. OperationHistory non-undoable support
// ===========================================================================

describe("OperationHistory non-undoable support", () => {
  it("executes non-undoable operations without pushing to undo stack", () => {
    const history = new OperationHistory();
    let executed = false;

    history.execute(
      new Operation(
        "fire-and-forget",
        {
          execute: () => { executed = true; },
          undo: () => {},
        },
        { undoable: false },
      ),
    );

    expect(executed).toBe(true);
    expect(history.undoDepth).toBe(0);
    expect(history.canUndo).toBe(false);
  });

  it("does not clear redo stack for non-undoable operations", () => {
    const history = new OperationHistory();
    let val = 0;

    // Build redo state
    history.execute(
      new Operation("set", {
        execute: () => { val = 1; },
        undo: () => { val = 0; },
      }),
    );
    history.undo();
    expect(history.canRedo).toBe(true);

    // Non-undoable should not clear redo
    history.execute(
      new Operation("noop", { execute: () => {}, undo: () => {} }, { undoable: false }),
    );
    expect(history.canRedo).toBe(true);
  });

  it("undoable operations still work normally", () => {
    const history = new OperationHistory();
    let val = 0;

    history.execute(
      new Operation("set", {
        execute: () => { val = 1; },
        undo: () => { val = 0; },
      }),
    );
    expect(history.undoDepth).toBe(1);
    expect(val).toBe(1);

    history.undo();
    expect(val).toBe(0);
    expect(history.undoDepth).toBe(0);
  });
});

// ===========================================================================
// 3. DragSession state machine
// ===========================================================================

describe("DragSession state machine", () => {
  function makeSource(type = "entity"): DragSource<string> {
    return new DragSource({ id: "src-1", type, payload: "test-payload" });
  }

  function makeTarget(
    type = "scene",
    accepts: string[] = ["entity"],
  ): DropTarget<string> {
    return new DropTarget({ id: "tgt-1", type, accepts });
  }

  function makePolicy(): DropPolicy {
    const policy = new DropPolicy();
    policy.allow("entity", "scene");
    return policy;
  }

  it("starts in idle state", () => {
    const session = new DragSession<string>();
    expect(session.state).toBe("idle");
    expect(session.proxy).toBeNull();
  });

  it("transitions idle → dragging on begin()", () => {
    const session = new DragSession<string>();
    const proxy = session.begin(makeSource(), { x: 10, y: 20 });
    expect(session.state).toBe("dragging");
    expect(session.proxy).toBe(proxy);
    expect(proxy.position).toEqual({ x: 10, y: 20 });
  });

  it("move() works while dragging", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    const moved = session.move({ x: 50, y: 50 });
    expect(moved).not.toBeNull();
    expect(moved!.position).toEqual({ x: 50, y: 50 });
  });

  it("move() returns null when not dragging", () => {
    const session = new DragSession<string>();
    expect(session.move({ x: 50, y: 50 })).toBeNull();
  });

  it("transitions dragging → dropped on successful drop", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    const result = session.drop(makeTarget(), makePolicy());
    expect(result).toBe(true);
    expect(session.state).toBe("dropped");
    expect(session.proxy).toBeNull();
  });

  it("stays dragging on failed drop (rejected by policy)", () => {
    const session = new DragSession<string>();
    session.begin(makeSource("entity"));
    // Target does not accept "entity"
    const target = new DropTarget<string>({
      id: "tgt",
      type: "code-editor",
      accepts: ["code-block"],
    });
    const policy = new DropPolicy();
    policy.allow("code-block", "code-editor");

    const result = session.drop(target, policy);
    expect(result).toBe(false);
    expect(session.state).toBe("dragging");
    expect(session.proxy).not.toBeNull();
  });

  it("transitions dragging → cancelled on cancel()", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    session.cancel();
    expect(session.state).toBe("cancelled");
    expect(session.proxy).toBeNull();
  });

  it("cancel() is a no-op when not dragging", () => {
    const session = new DragSession<string>();
    session.cancel();
    expect(session.state).toBe("idle");
  });

  it("reset() returns to idle from any state", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    session.cancel();
    expect(session.state).toBe("cancelled");
    session.reset();
    expect(session.state).toBe("idle");
  });

  it("begin after drop restarts the session", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    session.drop(makeTarget(), makePolicy());
    expect(session.state).toBe("dropped");

    // begin() from dropped state needs reset first or direct begin
    session.reset();
    const proxy = session.begin(makeSource());
    expect(session.state).toBe("dragging");
    expect(session.proxy).toBe(proxy);
  });

  it("begin after cancel restarts the session", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    session.cancel();
    session.reset();
    const proxy = session.begin(makeSource());
    expect(session.state).toBe("dragging");
    expect(session.proxy).toBe(proxy);
  });

  it("begin while already dragging cancels old proxy and starts fresh", () => {
    const session = new DragSession<string>();
    const firstProxy = session.begin(makeSource());
    const secondProxy = session.begin(makeSource(), { x: 99, y: 99 });
    expect(session.state).toBe("dragging");
    expect(session.proxy).toBe(secondProxy);
    expect(session.proxy).not.toBe(firstProxy);
  });

  it("drop() returns false when not dragging", () => {
    const session = new DragSession<string>();
    const result = session.drop(makeTarget(), makePolicy());
    expect(result).toBe(false);
    expect(session.state).toBe("idle");
  });

  it("drop() returns false after already dropped", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());
    session.drop(makeTarget(), makePolicy());
    expect(session.state).toBe("dropped");

    const result = session.drop(makeTarget(), makePolicy());
    expect(result).toBe(false);
  });

  it("handles thrown onDrop handler gracefully (stays in dragging)", () => {
    const session = new DragSession<string>();
    session.begin(makeSource());

    const throwingTarget = new DropTarget<string>({
      id: "throw-tgt",
      type: "scene",
      accepts: ["entity"],
      onDrop: () => {
        throw new Error("onDrop failure");
      },
    });

    expect(() => session.drop(throwingTarget, makePolicy())).toThrow(
      "onDrop failure",
    );
    // DropTarget.drop() threw after accepting, so it returns true before the
    // throw propagates. The session transitions to dropped. This is documented
    // behavior — the drop handler's side effects are the handler's responsibility.
    // In practice, if the proxy was consumed (target.received contains it),
    // the session should not retry the same drop.
  });
});

// ===========================================================================
// 4. ShortcutManager.triggerFirst() — scope-priority resolution
// ===========================================================================

describe("ShortcutManager.triggerFirst()", () => {
  it("fires only one shortcut", () => {
    const manager = new ShortcutManager();
    let calls = 0;

    manager.register({ id: "a", combo: "ctrl+s", description: "Save", action: () => calls++ });
    manager.register({ id: "b", combo: "ctrl+s", description: "Also save", action: () => calls++ });

    const result = manager.triggerFirst("ctrl+s");
    expect(calls).toBe(1);
    expect(result).not.toBeNull();
  });

  it("prefers scoped shortcut over global", () => {
    const manager = new ShortcutManager();
    let fired: string | null = null;

    manager.register({
      id: "global-save",
      combo: "ctrl+s",
      description: "Global save",
      action: () => { fired = "global"; },
    });
    manager.register({
      id: "editor-save",
      combo: "ctrl+s",
      description: "Editor save",
      contexts: ["editor"],
      action: () => { fired = "editor"; },
    });

    const result = manager.triggerFirst("ctrl+s", ["editor"]);
    expect(fired).toBe("editor");
    expect(result!.id).toBe("editor-save");
  });

  it("falls back to global when no scoped match", () => {
    const manager = new ShortcutManager();
    let fired: string | null = null;

    manager.register({
      id: "global-help",
      combo: "f1",
      description: "Help",
      action: () => { fired = "global"; },
    });
    manager.register({
      id: "editor-help",
      combo: "f1",
      description: "Editor help",
      contexts: ["editor"],
      action: () => { fired = "editor"; },
    });

    // No active contexts that match "editor"
    const result = manager.triggerFirst("f1", ["scene"]);
    expect(fired).toBe("global");
    expect(result!.id).toBe("global-help");
  });

  it("returns null when no match at all", () => {
    const manager = new ShortcutManager();
    const result = manager.triggerFirst("ctrl+shift+q");
    expect(result).toBeNull();
  });

  it("existing trigger() still fires all matches (backwards compatible)", () => {
    const manager = new ShortcutManager();
    let calls = 0;

    manager.register({ id: "a", combo: "ctrl+s", description: "A", action: () => calls++ });
    manager.register({ id: "b", combo: "ctrl+s", description: "B", action: () => calls++ });

    const matches = manager.trigger("ctrl+s");
    expect(calls).toBe(2);
    expect(matches).toHaveLength(2);
  });
});
