import { describe, expect, it } from "vitest";
import {
  AddEntityToSceneCommand,
  AddStatementCommand,
  AddToSelectionCommand,
  BatchCommand,
  ClearSceneCommand,
  CreateMethodCommand,
  DeleteMethodCommand,
  DeleteStatementCommand,
  DuplicateEntityCommand,
  GroupEntitiesCommand,
  MoveStatementCommand,
  RemoveEntityFromSceneCommand,
  RemoveFromSelectionCommand,
  RenameEntityCommand,
  RenameMethodCommand,
  ReplaceStatementCommand,
  SelectionChangeCommand,
  SetCameraViewCommand,
  SetEntityOpacityCommand,
  SetEntityOrientationCommand,
  SetEntityPositionCommand,
  SetEntitySizeCommand,
  SetPropertyCommand,
  SetSceneBackgroundCommand,
  SetScenePropertyCommand,
  SetVehicleCommand,
  SetVisibilityCommand,
  SwapEntityPositionsCommand,
  TogglePropertyCommand,
  UngroupEntitiesCommand,
  type EntityCloneFactory,
  type SelectionModel,
} from "../src/ide-command-operations";
import { UndoRedoManager } from "../src/undo-redo";
import { Scene } from "../src/story-api/scene";
import { SModel, SMovableTurnable, SProp, SThing } from "../src/story-api/entities";

function makeScene(...names: string[]): Scene {
  const scene = new Scene();
  for (const name of names) {
    scene.addEntity(name, new SModel());
  }
  return scene;
}

function makeProcedures(): Map<string, string[]> {
  const procs = new Map<string, string[]>();
  procs.set("myMethod", ["stmt-a", "stmt-b", "stmt-c"]);
  procs.set("helper", ["x", "y"]);
  return procs;
}

describe("ide-command-operations", () => {
  // ---------- Entity Commands ----------

  it("toggles entity visibility with undo", () => {
    const scene = makeScene("rabbit");
    const entity = scene.getEntity("rabbit")!;
    entity.isShowing = true;
    const manager = new UndoRedoManager();

    manager.execute(new SetVisibilityCommand(scene, "rabbit", false));
    expect(entity.isShowing).toBe(false);

    manager.undo();
    expect(entity.isShowing).toBe(true);
  });

  it("throws when visibility target is missing", () => {
    const scene = new Scene();
    expect(() => new SetVisibilityCommand(scene, "ghost", false).execute()).toThrow("not found");
  });

  it("renames an entity in the scene map with undo", () => {
    const scene = makeScene("oldName");
    const entity = scene.getEntity("oldName")!;
    const manager = new UndoRedoManager();

    manager.execute(new RenameEntityCommand(scene, "oldName", "newName"));
    expect(scene.getEntity("oldName")).toBeUndefined();
    expect(scene.getEntity("newName")).toBe(entity);

    manager.undo();
    expect(scene.getEntity("newName")).toBeUndefined();
    expect(scene.getEntity("oldName")).toBe(entity);
  });

  it("prevents rename to an existing name", () => {
    const scene = makeScene("a", "b");
    expect(() => new RenameEntityCommand(scene, "a", "b").execute()).toThrow("already exists");
  });

  it("duplicates an entity using a clone factory", () => {
    const scene = makeScene("original");
    const factory: EntityCloneFactory = {
      clone: () => new SProp(),
    };
    const manager = new UndoRedoManager();

    manager.execute(new DuplicateEntityCommand(scene, "original", "copy", factory));
    expect(scene.getEntity("copy")).toBeDefined();

    manager.undo();
    expect(scene.getEntity("copy")).toBeUndefined();
  });

  it("sets entity opacity with undo", () => {
    const target = { opacity: 1.0 };
    const manager = new UndoRedoManager();

    manager.execute(new SetEntityOpacityCommand(target, "box", 0.5));
    expect(target.opacity).toBe(0.5);

    manager.undo();
    expect(target.opacity).toBe(1.0);
  });

  it("changes vehicle/parent with undo", () => {
    const entity = new SModel();
    const parentA = new SModel();
    const parentB = new SModel();
    entity.vehicle = parentA;
    const manager = new UndoRedoManager();

    manager.execute(new SetVehicleCommand(entity, "entity", parentB));
    expect(entity.vehicle).toBe(parentB);

    manager.undo();
    expect(entity.vehicle).toBe(parentA);
  });

  it("swaps positions of two entities with undo", () => {
    const scene = new Scene();
    const a = new SModel();
    const b = new SModel();
    a.position = { x: 1, y: 2, z: 3 };
    b.position = { x: 4, y: 5, z: 6 };
    scene.addEntity("a", a);
    scene.addEntity("b", b);
    const manager = new UndoRedoManager();

    manager.execute(new SwapEntityPositionsCommand(scene, "a", "b"));
    expect(a.position).toEqual({ x: 4, y: 5, z: 6 });
    expect(b.position).toEqual({ x: 1, y: 2, z: 3 });

    manager.undo();
    expect(a.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(b.position).toEqual({ x: 4, y: 5, z: 6 });
  });

  // ---------- Statement / Method Commands ----------

  it("moves a statement within a method with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new MoveStatementCommand(procs, "myMethod", 0, 2));
    expect(procs.get("myMethod")).toEqual(["stmt-b", "stmt-c", "stmt-a"]);

    manager.undo();
    expect(procs.get("myMethod")).toEqual(["stmt-a", "stmt-b", "stmt-c"]);
  });

  it("deletes a statement with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new DeleteStatementCommand(procs, "myMethod", 1));
    expect(procs.get("myMethod")).toEqual(["stmt-a", "stmt-c"]);

    manager.undo();
    expect(procs.get("myMethod")).toEqual(["stmt-a", "stmt-b", "stmt-c"]);
  });

  it("replaces a statement with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new ReplaceStatementCommand(procs, "myMethod", 1, "new-stmt"));
    expect(procs.get("myMethod")).toEqual(["stmt-a", "new-stmt", "stmt-c"]);

    manager.undo();
    expect(procs.get("myMethod")).toEqual(["stmt-a", "stmt-b", "stmt-c"]);
  });

  it("renames a method with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new RenameMethodCommand(procs, "myMethod", "renamedMethod"));
    expect(procs.has("myMethod")).toBe(false);
    expect(procs.get("renamedMethod")).toEqual(["stmt-a", "stmt-b", "stmt-c"]);

    manager.undo();
    expect(procs.has("renamedMethod")).toBe(false);
    expect(procs.get("myMethod")).toEqual(["stmt-a", "stmt-b", "stmt-c"]);
  });

  // ---------- Selection Commands ----------

  it("changes selection with undo", () => {
    const model: SelectionModel = {
      selected: new Set<string>(),
      select(names) { for (const n of names) (this.selected as Set<string>).add(n); },
      deselect(names) { for (const n of names) (this.selected as Set<string>).delete(n); },
      clear() { (this.selected as Set<string>).clear(); },
    };
    model.select(["a", "b"]);
    const manager = new UndoRedoManager();

    manager.execute(new SelectionChangeCommand(model, new Set(["c"])));
    expect([...model.selected]).toEqual(["c"]);

    manager.undo();
    expect([...model.selected].sort()).toEqual(["a", "b"]);
  });

  // ---------- Scene Commands ----------

  it("sets a scene property with undo", () => {
    const scene = makeScene("rabbit");
    scene.atmosphereColor = "#0000ff";
    const manager = new UndoRedoManager();

    manager.execute(new SetScenePropertyCommand(scene, "atmosphereColor", "#ff0000"));
    expect(scene.atmosphereColor).toBe("#ff0000");

    manager.undo();
    expect(scene.atmosphereColor).toBe("#0000ff");
  });

  it("clears the scene and restores on undo", () => {
    const scene = makeScene("a", "b", "c");
    const manager = new UndoRedoManager();

    manager.execute(new ClearSceneCommand(scene));
    expect([...scene.entities.keys()]).toEqual([]);

    manager.undo();
    expect([...scene.entities.keys()].sort()).toEqual(["a", "b", "c"]);
  });

  // ---------- Camera Commands ----------

  it("sets camera view with undo", () => {
    const camera = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const manager = new UndoRedoManager();

    manager.execute(new SetCameraViewCommand(camera, {
      position: { x: 10, y: 20, z: 30 },
      orientation: { x: 1, y: 0, z: 0, w: 0 },
    }));
    expect(camera.position).toEqual({ x: 10, y: 20, z: 30 });

    manager.undo();
    expect(camera.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(camera.orientation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  // ---------- Generic Commands ----------

  it("sets an arbitrary property with undo", () => {
    const target: Record<string, number> = { health: 100 };
    const manager = new UndoRedoManager();

    manager.execute(new SetPropertyCommand(target, "health", 50, "player"));
    expect(target.health).toBe(50);

    manager.undo();
    expect(target.health).toBe(100);
  });

  it("batch command rolls back on failure", () => {
    const values: string[] = [];
    const batch = new BatchCommand("test-batch", [
      { execute: () => values.push("a"), undo: () => values.pop(), description: "add a" },
      { execute: () => values.push("b"), undo: () => values.pop(), description: "add b" },
      { execute: () => { throw new Error("fail"); }, undo: () => {}, description: "explode" },
    ]);

    expect(() => batch.execute()).toThrow("fail");
    expect(values).toEqual([]);
  });

  it("batch command undoes all on success then undo", () => {
    const values: string[] = [];
    const batch = new BatchCommand("test-batch", [
      { execute: () => values.push("a"), undo: () => values.pop(), description: "add a" },
      { execute: () => values.push("b"), undo: () => values.pop(), description: "add b" },
    ]);
    const manager = new UndoRedoManager();

    manager.execute(batch);
    expect(values).toEqual(["a", "b"]);

    manager.undo();
    expect(values).toEqual([]);
  });

  it("integrates with UndoRedoManager through full undo/redo cycle", () => {
    const scene = makeScene("entity");
    const entity = scene.getEntity("entity")!;
    entity.isShowing = true;
    const manager = new UndoRedoManager();

    manager.execute(new SetVisibilityCommand(scene, "entity", false));
    manager.execute(new RenameEntityCommand(scene, "entity", "renamed"));
    expect(entity.isShowing).toBe(false);
    expect(scene.getEntity("renamed")).toBe(entity);

    manager.undo();
    expect(scene.getEntity("entity")).toBe(entity);

    manager.undo();
    expect(entity.isShowing).toBe(true);

    manager.redo();
    expect(entity.isShowing).toBe(false);
  });

  // ---------- Add / Remove Entity Commands ----------

  it("adds an entity to the scene with undo", () => {
    const scene = new Scene();
    const entity = new SModel();
    const manager = new UndoRedoManager();

    manager.execute(new AddEntityToSceneCommand(scene, "rabbit", entity));
    expect(scene.getEntity("rabbit")).toBe(entity);

    manager.undo();
    expect(scene.getEntity("rabbit")).toBeUndefined();
  });

  it("throws when adding a duplicate entity name", () => {
    const scene = makeScene("rabbit");
    expect(() => new AddEntityToSceneCommand(scene, "rabbit", new SModel()).execute()).toThrow("already exists");
  });

  it("removes an entity from the scene with undo", () => {
    const scene = makeScene("rabbit");
    const entity = scene.getEntity("rabbit")!;
    const manager = new UndoRedoManager();

    manager.execute(new RemoveEntityFromSceneCommand(scene, "rabbit"));
    expect(scene.getEntity("rabbit")).toBeUndefined();

    manager.undo();
    expect(scene.getEntity("rabbit")).toBe(entity);
  });

  it("throws when removing a nonexistent entity", () => {
    const scene = new Scene();
    expect(() => new RemoveEntityFromSceneCommand(scene, "ghost").execute()).toThrow("not found");
  });

  // ---------- Group / Ungroup Commands ----------

  it("groups and ungroups entities", () => {
    const entities = new Map<string, any>([
      ["a", { name: "a" }],
      ["b", { name: "b" }],
    ]);
    const grouping = {
      getEntity: (id: string) => entities.get(id) ?? null,
      createGroup: (name: string, members: string[]) => {
        const group = { name, members };
        entities.set(name, group);
        return group;
      },
      dissolveGroup: (groupName: string) => {
        const group = entities.get(groupName) as any;
        entities.delete(groupName);
        return group?.members ?? [];
      },
    };
    const manager = new UndoRedoManager();

    manager.execute(new GroupEntitiesCommand(grouping as any, "group1", ["a", "b"]));
    expect(entities.has("group1")).toBe(true);

    manager.undo();
    expect(entities.has("group1")).toBe(false);
  });

  it("throws when grouping nonexistent entities", () => {
    const grouping = {
      getEntity: () => null,
      createGroup: () => ({}),
      dissolveGroup: () => [],
    };
    expect(() => new GroupEntitiesCommand(grouping as any, "g", ["missing"]).execute()).toThrow("not found");
  });

  it("ungroups and restores on undo", () => {
    const entities = new Map<string, any>([
      ["group1", { name: "group1", members: ["a", "b"] }],
    ]);
    const grouping = {
      getEntity: (id: string) => entities.get(id) ?? null,
      createGroup: (name: string, members: string[]) => {
        const group = { name, members };
        entities.set(name, group);
        return group;
      },
      dissolveGroup: (groupName: string) => {
        const group = entities.get(groupName) as any;
        entities.delete(groupName);
        return group?.members ?? [];
      },
    };
    const manager = new UndoRedoManager();

    manager.execute(new UngroupEntitiesCommand(grouping as any, "group1"));
    expect(entities.has("group1")).toBe(false);

    manager.undo();
    expect(entities.has("group1")).toBe(true);
  });

  // ---------- Entity Transform Commands ----------

  it("sets entity position with undo", () => {
    const scene = new Scene();
    const entity = new SModel();
    entity.position = { x: 0, y: 0, z: 0 };
    scene.addEntity("obj", entity);
    const manager = new UndoRedoManager();

    manager.execute(new SetEntityPositionCommand(scene, "obj", { x: 10, y: 20, z: 30 }));
    expect(entity.position).toEqual({ x: 10, y: 20, z: 30 });

    manager.undo();
    expect(entity.position).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("sets entity orientation with undo", () => {
    const scene = new Scene();
    const entity = new SModel();
    entity.orientation = { x: 0, y: 0, z: 0, w: 1 };
    scene.addEntity("obj", entity);
    const manager = new UndoRedoManager();

    manager.execute(new SetEntityOrientationCommand(scene, "obj", { x: 1, y: 0, z: 0, w: 0 }));
    expect(entity.orientation).toEqual({ x: 1, y: 0, z: 0, w: 0 });

    manager.undo();
    expect(entity.orientation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it("throws when setting position of non-movable entity", () => {
    const scene = new Scene();
    scene.addEntity("thing", new SThing());
    expect(() => new SetEntityPositionCommand(scene, "thing", { x: 0, y: 0, z: 0 }).execute()).toThrow("does not support");
  });

  it("sets entity size with undo", () => {
    const target = { width: 1, height: 2, depth: 3 };
    const manager = new UndoRedoManager();

    manager.execute(new SetEntitySizeCommand(target, "box", { width: 10, height: 20, depth: 30 }));
    expect(target).toEqual({ width: 10, height: 20, depth: 30 });

    manager.undo();
    expect(target).toEqual({ width: 1, height: 2, depth: 3 });
  });

  // ---------- Create / Delete Method Commands ----------

  it("creates a method with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new CreateMethodCommand(procs, "newMethod", ["stmt-1"]));
    expect(procs.get("newMethod")).toEqual(["stmt-1"]);

    manager.undo();
    expect(procs.has("newMethod")).toBe(false);
  });

  it("throws when creating a duplicate method", () => {
    const procs = makeProcedures();
    expect(() => new CreateMethodCommand(procs, "myMethod").execute()).toThrow("already exists");
  });

  it("deletes a method with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new DeleteMethodCommand(procs, "helper"));
    expect(procs.has("helper")).toBe(false);

    manager.undo();
    expect(procs.get("helper")).toEqual(["x", "y"]);
  });

  it("throws when deleting a nonexistent method", () => {
    const procs = makeProcedures();
    expect(() => new DeleteMethodCommand(procs, "missing").execute()).toThrow("not found");
  });

  // ---------- Add Statement Command ----------

  it("adds a statement to a method with undo", () => {
    const procs = makeProcedures();
    const manager = new UndoRedoManager();

    manager.execute(new AddStatementCommand(procs, "myMethod", "new-stmt", 1));
    expect(procs.get("myMethod")).toEqual(["stmt-a", "new-stmt", "stmt-b", "stmt-c"]);

    manager.undo();
    expect(procs.get("myMethod")).toEqual(["stmt-a", "stmt-b", "stmt-c"]);
  });

  it("appends statement at end when no index given", () => {
    const procs = makeProcedures();
    new AddStatementCommand(procs, "myMethod", "appended").execute();
    expect(procs.get("myMethod")![3]).toBe("appended");
  });

  it("undo removes correct instance when duplicate statements exist", () => {
    const procs = new Map<string, string[]>();
    procs.set("run", ["x", "say()", "y"]);
    const manager = new UndoRedoManager();

    manager.execute(new AddStatementCommand(procs, "run", "say()", 3));
    expect(procs.get("run")).toEqual(["x", "say()", "y", "say()"]);

    manager.undo();
    expect(procs.get("run")).toEqual(["x", "say()", "y"]);
  });

  // ---------- Scene Background Command ----------

  it("sets scene background color with undo", () => {
    const scene = makeScene("rabbit");
    scene.atmosphereColor = "#0000ff";
    const manager = new UndoRedoManager();

    manager.execute(new SetSceneBackgroundCommand(scene, "#ff0000"));
    expect(scene.atmosphereColor).toBe("#ff0000");

    manager.undo();
    expect(scene.atmosphereColor).toBe("#0000ff");
  });

  // ---------- Toggle Property Command ----------

  it("toggles a boolean property with undo", () => {
    const target: Record<string, boolean> = { showGrid: false };
    const manager = new UndoRedoManager();

    manager.execute(new TogglePropertyCommand(target, "showGrid", "grid"));
    expect(target.showGrid).toBe(true);

    manager.undo();
    expect(target.showGrid).toBe(false);
  });

  // ---------- Selection Commands (continued) ----------

  it("adds to selection with undo", () => {
    const model: SelectionModel = {
      selected: new Set<string>(["a"]),
      select(names) { for (const n of names) (this.selected as Set<string>).add(n); },
      deselect(names) { for (const n of names) (this.selected as Set<string>).delete(n); },
      clear() { (this.selected as Set<string>).clear(); },
    };
    const manager = new UndoRedoManager();

    manager.execute(new AddToSelectionCommand(model, ["b", "c"]));
    expect([...model.selected].sort()).toEqual(["a", "b", "c"]);

    manager.undo();
    expect([...model.selected]).toEqual(["a"]);
  });

  it("removes from selection with undo", () => {
    const model: SelectionModel = {
      selected: new Set<string>(["a", "b", "c"]),
      select(names) { for (const n of names) (this.selected as Set<string>).add(n); },
      deselect(names) { for (const n of names) (this.selected as Set<string>).delete(n); },
      clear() { (this.selected as Set<string>).clear(); },
    };
    const manager = new UndoRedoManager();

    manager.execute(new RemoveFromSelectionCommand(model, ["b"]));
    expect([...model.selected].sort()).toEqual(["a", "c"]);

    manager.undo();
    expect([...model.selected].sort()).toEqual(["a", "b", "c"]);
  });
});
