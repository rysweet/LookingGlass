/**
 * TDD tests for expanded command-pattern functionality.
 *
 * Addresses rubber-duck review findings from Step 6:
 * - Non-undoable (fire-and-forget) commands must be enforced by UndoRedoManager
 * - Deferred state capture: state is captured on first execute(), not construction
 * - BatchCommand edge cases: failed batches must not leak into undo history
 * - OperationCommandAdapter: bridges Operation (croquet-operations) → Command (undo-redo)
 */
import { describe, expect, it } from "vitest";
import { UndoRedoManager, type Command } from "../src/undo-redo";
import {
  BatchCommand,
  SetVisibilityCommand,
  RenameEntityCommand,
  SetPropertyCommand,
  TogglePropertyCommand,
  AddEntityToSceneCommand,
  RemoveEntityFromSceneCommand,
  SetEntityPositionCommand,
} from "../src/ide-command-operations";
import { Operation, OperationHistory, CompoundOperation } from "../src/croquet-operations";
import { Scene } from "../src/story-api/scene";
import { SModel } from "../src/story-api/entities";

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/** A command that tracks execution and declares itself non-undoable. */
class NonUndoableTestCommand implements Command {
  readonly undoable = false;
  executed = false;

  get description(): string {
    return "Non-undoable test command";
  }

  execute(): void {
    this.executed = true;
  }

  undo(): void {
    // Non-undoable commands should never have undo called
    throw new Error("undo should not be called on a non-undoable command");
  }
}

/** A command that captures state on first execute(), not construction. */
class DeferredCaptureCommand implements Command {
  private previousValue: number | null = null;
  private capturedOnExecute = false;

  constructor(
    private readonly target: { value: number },
    private readonly newValue: number,
  ) {}

  get description(): string {
    return `Set value to ${this.newValue}`;
  }

  execute(): void {
    if (!this.capturedOnExecute) {
      // Capture state on FIRST execute only
      this.previousValue = this.target.value;
      this.capturedOnExecute = true;
    }
    this.target.value = this.newValue;
  }

  undo(): void {
    if (this.previousValue !== null) {
      this.target.value = this.previousValue;
    }
  }
}

/** A command that fails on execute. */
class FailingCommand implements Command {
  get description(): string {
    return "Failing command";
  }

  execute(): void {
    throw new Error("intentional failure");
  }

  undo(): void {
    // noop
  }
}

/** A fire-and-forget command simulating "Save Project". */
class SaveProjectAction implements Command {
  readonly undoable = false;
  saved = false;

  constructor(private readonly projectName: string) {}

  get description(): string {
    return `Save project "${this.projectName}"`;
  }

  execute(): void {
    this.saved = true;
  }

  undo(): void {
    throw new Error("Cannot undo a save");
  }
}

/** A fire-and-forget command simulating "Start Run". */
class StartRunAction implements Command {
  readonly undoable = false;
  running = false;

  get description(): string {
    return "Start run";
  }

  execute(): void {
    this.running = true;
  }

  undo(): void {
    throw new Error("Cannot undo a run start");
  }
}

/** A fire-and-forget command simulating "Copy to Clipboard". */
class CopyToClipboardAction implements Command {
  readonly undoable = false;
  copiedText: string | null = null;

  constructor(private readonly text: string) {}

  get description(): string {
    return "Copy to clipboard";
  }

  execute(): void {
    this.copiedText = this.text;
  }

  undo(): void {
    throw new Error("Cannot undo clipboard copy");
  }
}

function makeScene(...names: string[]): Scene {
  const scene = new Scene();
  for (const name of names) {
    scene.addEntity(name, new SModel());
  }
  return scene;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ide-command-expanded", () => {
  // ==========================================================================
  // Non-undoable commands — UndoRedoManager enforcement
  // ==========================================================================

  describe("non-undoable commands (fire-and-forget)", () => {
    it("executes a non-undoable command without pushing to undo stack", () => {
      const manager = new UndoRedoManager();
      const cmd = new NonUndoableTestCommand();

      manager.execute(cmd);

      expect(cmd.executed).toBe(true);
      expect(manager.undoCount).toBe(0);
      expect(manager.canUndo).toBe(false);
    });

    it("does not make non-undoable commands redoable", () => {
      const manager = new UndoRedoManager();
      const cmd = new NonUndoableTestCommand();

      manager.execute(cmd);

      expect(manager.canRedo).toBe(false);
      expect(manager.redoCount).toBe(0);
    });

    it("does not clear redo stack for non-undoable commands", () => {
      const manager = new UndoRedoManager();
      const scene = makeScene("entity");
      const entity = scene.getEntity("entity")!;
      entity.isShowing = true;

      // Build up redo state: execute then undo
      manager.execute(new SetVisibilityCommand(scene, "entity", false));
      manager.undo();
      expect(manager.canRedo).toBe(true);
      const redoCountBefore = manager.redoCount;

      // Non-undoable command should NOT clear redo
      manager.execute(new SaveProjectAction("my-project"));

      expect(manager.redoCount).toBe(redoCountBefore);
      expect(manager.canRedo).toBe(true);
    });

    it("does not corrupt stacks when non-undoable command fails", () => {
      const manager = new UndoRedoManager();
      const scene = makeScene("entity");
      const entity = scene.getEntity("entity")!;
      entity.isShowing = true;

      // Set up some undo history
      manager.execute(new SetVisibilityCommand(scene, "entity", false));
      const undoCountBefore = manager.undoCount;

      // A non-undoable command that fails
      const failingNonUndoable: Command & { undoable: false } = {
        undoable: false,
        description: "failing non-undoable",
        execute() { throw new Error("fail"); },
        undo() { throw new Error("should not be called"); },
      };

      expect(() => manager.execute(failingNonUndoable)).toThrow("fail");
      expect(manager.undoCount).toBe(undoCountBefore);
    });

    it("saves a project without polluting undo history", () => {
      const manager = new UndoRedoManager();
      const save = new SaveProjectAction("lesson1");

      manager.execute(save);

      expect(save.saved).toBe(true);
      expect(manager.undoCount).toBe(0);
    });

    it("starts a run without polluting undo history", () => {
      const manager = new UndoRedoManager();
      const run = new StartRunAction();

      manager.execute(run);

      expect(run.running).toBe(true);
      expect(manager.undoCount).toBe(0);
    });

    it("copies to clipboard without polluting undo history", () => {
      const manager = new UndoRedoManager();
      const copy = new CopyToClipboardAction("hello world");

      manager.execute(copy);

      expect(copy.copiedText).toBe("hello world");
      expect(manager.undoCount).toBe(0);
    });

    it("preserves undoable commands alongside non-undoable ones", () => {
      const manager = new UndoRedoManager();
      const scene = makeScene("rabbit");
      const entity = scene.getEntity("rabbit")!;
      entity.isShowing = true;

      // Undoable command
      manager.execute(new SetVisibilityCommand(scene, "rabbit", false));
      expect(manager.undoCount).toBe(1);

      // Non-undoable command
      manager.execute(new SaveProjectAction("test"));
      expect(manager.undoCount).toBe(1); // unchanged

      // Undo still works for the undoable command
      manager.undo();
      expect(entity.isShowing).toBe(true);
      expect(manager.undoCount).toBe(0);
    });
  });

  // ==========================================================================
  // Deferred state capture
  // ==========================================================================

  describe("deferred state capture", () => {
    it("captures state on first execute, not construction", () => {
      const target = { value: 10 };
      const cmd = new DeferredCaptureCommand(target, 99);

      // State changes AFTER construction but BEFORE execute
      target.value = 42;

      const manager = new UndoRedoManager();
      manager.execute(cmd);

      // Value should be 99 after execute
      expect(target.value).toBe(99);

      // Undo should restore to 42 (captured at execute), not 10 (at construction)
      manager.undo();
      expect(target.value).toBe(42);
    });

    it("maintains correct state through execute→undo→redo→undo cycle", () => {
      const target = { value: 10 };
      // State=A(10) at construction

      const cmd = new DeferredCaptureCommand(target, 99);

      // State changes to B(42) before execute
      target.value = 42;

      const manager = new UndoRedoManager();
      manager.execute(cmd);
      // State=C(99) after execute, captured B(42)
      expect(target.value).toBe(99);

      manager.undo();
      // State=B(42)
      expect(target.value).toBe(42);

      manager.redo();
      // State=C(99) again
      expect(target.value).toBe(99);

      manager.undo();
      // State=B(42) again — NOT A(10) and NOT drifted
      expect(target.value).toBe(42);
    });
  });

  // ==========================================================================
  // BatchCommand edge cases
  // ==========================================================================

  describe("BatchCommand edge cases", () => {
    it("failed batch does not leak into undo history via UndoRedoManager", () => {
      const manager = new UndoRedoManager();
      const values: string[] = [];

      const batch = new BatchCommand("failing-batch", [
        { execute: () => values.push("a"), undo: () => values.pop(), description: "add a" },
        { execute: () => { throw new Error("fail"); }, undo: () => {}, description: "boom" },
      ]);

      expect(() => manager.execute(batch)).toThrow("fail");

      // Undo stack should be empty — failed batch was not recorded
      expect(manager.undoCount).toBe(0);
      expect(manager.canUndo).toBe(false);

      // Values should be rolled back
      expect(values).toEqual([]);
    });

    it("undo after failed batch is a no-op", () => {
      const manager = new UndoRedoManager();
      const batch = new BatchCommand("failing-batch", [
        { execute: () => {}, undo: () => {}, description: "ok" },
        { execute: () => { throw new Error("fail"); }, undo: () => {}, description: "boom" },
      ]);

      expect(() => manager.execute(batch)).toThrow("fail");

      // undo should be a safe no-op
      manager.undo();
      expect(manager.undoCount).toBe(0);
    });

    it("handles empty batch", () => {
      const manager = new UndoRedoManager();
      const batch = new BatchCommand("empty", []);

      manager.execute(batch);
      expect(manager.undoCount).toBe(1);

      manager.undo();
      expect(manager.undoCount).toBe(0);
    });

    it("handles nested batches with proper rollback", () => {
      const values: string[] = [];
      const innerBatch = new BatchCommand("inner", [
        { execute: () => values.push("inner-a"), undo: () => values.pop(), description: "inner a" },
        { execute: () => values.push("inner-b"), undo: () => values.pop(), description: "inner b" },
      ]);
      const outerBatch = new BatchCommand("outer", [
        { execute: () => values.push("outer-a"), undo: () => values.pop(), description: "outer a" },
        innerBatch,
        { execute: () => values.push("outer-b"), undo: () => values.pop(), description: "outer b" },
      ]);

      const manager = new UndoRedoManager();
      manager.execute(outerBatch);
      expect(values).toEqual(["outer-a", "inner-a", "inner-b", "outer-b"]);

      manager.undo();
      expect(values).toEqual([]);
    });

    it("nested batch failure rolls back only completed inner steps", () => {
      const values: string[] = [];
      const innerBatch = new BatchCommand("inner", [
        { execute: () => values.push("inner-a"), undo: () => values.pop(), description: "inner a" },
        { execute: () => { throw new Error("inner fail"); }, undo: () => {}, description: "inner boom" },
      ]);
      const outerBatch = new BatchCommand("outer", [
        { execute: () => values.push("outer-a"), undo: () => values.pop(), description: "outer a" },
        innerBatch,
      ]);

      expect(() => new UndoRedoManager().execute(outerBatch)).toThrow();
      // Everything should be rolled back
      expect(values).toEqual([]);
    });
  });

  // ==========================================================================
  // Operation → Command adapter
  // ==========================================================================

  describe("Operation → Command adapter", () => {
    it("adapts an Operation factory into a Command for UndoRedoManager", () => {
      const scene = makeScene("rabbit");
      const entity = scene.getEntity("rabbit")!;
      entity.isShowing = true;

      // Adapter wraps a factory function that creates a fresh Operation
      const operationFactory = () =>
        new Operation("hide-rabbit", {
          execute: () => { entity.isShowing = false; },
          undo: () => { entity.isShowing = true; },
        });

      // Create an adapter manually (this is what OperationCommandAdapter should do)
      let currentOp: Operation | null = null;
      const adapted: Command = {
        description: "hide-rabbit",
        execute() {
          currentOp = operationFactory();
          currentOp.execute();
        },
        undo() {
          currentOp?.undo();
        },
      };

      const manager = new UndoRedoManager();
      manager.execute(adapted);
      expect(entity.isShowing).toBe(false);

      manager.undo();
      expect(entity.isShowing).toBe(true);

      manager.redo();
      expect(entity.isShowing).toBe(false);
    });

    it("adapter creates fresh Operation for each execute/redo cycle", () => {
      let executeCount = 0;
      const factory = () =>
        new Operation("count", {
          execute: () => { executeCount++; },
          undo: () => { executeCount--; },
        });

      let currentOp: Operation | null = null;
      const adapted: Command = {
        description: "count",
        execute() {
          currentOp = factory();
          currentOp.execute();
        },
        undo() {
          currentOp?.undo();
        },
      };

      const manager = new UndoRedoManager();
      manager.execute(adapted);
      expect(executeCount).toBe(1);

      manager.undo();
      expect(executeCount).toBe(0);

      manager.redo();
      expect(executeCount).toBe(1);
    });

    it("CompoundOperation can be wrapped as a Command", () => {
      const scene = makeScene("a", "b");
      const entityA = scene.getEntity("a")!;
      const entityB = scene.getEntity("b")!;
      entityA.isShowing = true;
      entityB.isShowing = true;

      const compoundFactory = () =>
        new CompoundOperation("hide-both", [
          new Operation("hide-a", {
            execute: () => { entityA.isShowing = false; },
            undo: () => { entityA.isShowing = true; },
          }),
          new Operation("hide-b", {
            execute: () => { entityB.isShowing = false; },
            undo: () => { entityB.isShowing = true; },
          }),
        ]);

      let currentOp: CompoundOperation | null = null;
      const adapted: Command = {
        description: "hide-both",
        execute() {
          currentOp = compoundFactory();
          currentOp.execute();
        },
        undo() {
          currentOp?.undo();
        },
      };

      const manager = new UndoRedoManager();
      manager.execute(adapted);
      expect(entityA.isShowing).toBe(false);
      expect(entityB.isShowing).toBe(false);

      manager.undo();
      expect(entityA.isShowing).toBe(true);
      expect(entityB.isShowing).toBe(true);
    });
  });

  // ==========================================================================
  // Existing commands - comprehensive undo/redo/redo cycle
  // ==========================================================================

  describe("full undo/redo cycle for existing commands", () => {
    it("SetPropertyCommand survives execute→undo→redo→undo cycle", () => {
      const target: Record<string, number> = { health: 100 };
      const manager = new UndoRedoManager();

      manager.execute(new SetPropertyCommand(target, "health", 50, "player"));
      expect(target.health).toBe(50);

      manager.undo();
      expect(target.health).toBe(100);

      manager.redo();
      expect(target.health).toBe(50);

      manager.undo();
      expect(target.health).toBe(100);
    });

    it("TogglePropertyCommand toggles correctly through undo/redo", () => {
      const target: Record<string, boolean> = { visible: false };
      const manager = new UndoRedoManager();

      manager.execute(new TogglePropertyCommand(target, "visible", "entity"));
      expect(target.visible).toBe(true);

      manager.undo();
      expect(target.visible).toBe(false);

      manager.redo();
      expect(target.visible).toBe(true);
    });

    it("AddEntity + RemoveEntity interleaved with undo/redo", () => {
      const scene = new Scene();
      const entity = new SModel();
      const manager = new UndoRedoManager();

      manager.execute(new AddEntityToSceneCommand(scene, "rabbit", entity));
      expect(scene.getEntity("rabbit")).toBe(entity);

      manager.execute(new RemoveEntityFromSceneCommand(scene, "rabbit"));
      expect(scene.getEntity("rabbit")).toBeUndefined();

      manager.undo(); // undo remove
      expect(scene.getEntity("rabbit")).toBe(entity);

      manager.undo(); // undo add
      expect(scene.getEntity("rabbit")).toBeUndefined();

      manager.redo(); // redo add
      expect(scene.getEntity("rabbit")).toBe(entity);

      manager.redo(); // redo remove
      expect(scene.getEntity("rabbit")).toBeUndefined();
    });

    it("multiple SetEntityPosition commands preserve correct undo baselines", () => {
      const scene = new Scene();
      const entity = new SModel();
      entity.position = { x: 0, y: 0, z: 0 };
      scene.addEntity("obj", entity);
      const manager = new UndoRedoManager();

      manager.execute(new SetEntityPositionCommand(scene, "obj", { x: 10, y: 0, z: 0 }));
      manager.execute(new SetEntityPositionCommand(scene, "obj", { x: 20, y: 0, z: 0 }));
      manager.execute(new SetEntityPositionCommand(scene, "obj", { x: 30, y: 0, z: 0 }));

      expect(entity.position.x).toBe(30);

      manager.undo();
      expect(entity.position.x).toBe(20);

      manager.undo();
      expect(entity.position.x).toBe(10);

      manager.undo();
      expect(entity.position.x).toBe(0);
    });
  });

  // ==========================================================================
  // OperationHistory and UndoRedoManager interop
  // ==========================================================================

  describe("OperationHistory ↔ UndoRedoManager interop", () => {
    it("both systems track independent undo stacks", () => {
      const opHistory = new OperationHistory();
      const cmdManager = new UndoRedoManager();

      // Use OperationHistory for Operation-based work
      let opValue = 0;
      opHistory.execute(
        new Operation("set-op", {
          execute: () => { opValue = 1; },
          undo: () => { opValue = 0; },
        }),
      );

      // Use UndoRedoManager for Command-based work
      const target: Record<string, number> = { val: 0 };
      cmdManager.execute(new SetPropertyCommand(target, "val", 1, "test"));

      expect(opValue).toBe(1);
      expect(target.val).toBe(1);

      // Undo in each system independently
      opHistory.undo();
      expect(opValue).toBe(0);
      expect(target.val).toBe(1); // unchanged

      cmdManager.undo();
      expect(opValue).toBe(0); // still undone
      expect(target.val).toBe(0);
    });
  });
});
