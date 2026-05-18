/**
 * Outside-in integration test: IDE operations working together.
 * Simulates real user workflows: create project → add entity → undo/redo
 * → copy/paste → set preferences → save.
 *
 * Initial run discovered 4 API-usage issues that a first-time consumer
 * would hit (wrong arg count, wrong property name, missing XML source).
 * All fixed below.
 */
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { ProjectManager } from "../src/project-manager";
import { UndoRedoManager, AddEntityCommand, RemoveEntityCommand, MoveEntityCommand, CompositeCommand } from "../src/undo-redo";
import { Clipboard } from "../src/clipboard";
import { Preferences, DEFAULT_PREFERENCES } from "../src/preferences";
import { Scene } from "../src/story-api/scene";
import { SModel, SMovableTurnable } from "../src/story-api/entities";
import type { AliceObject } from "../src/a3p-parser";

const SYNTHETIC_XML = `<?xml version="1.0" encoding="UTF-8"?>
<node type="org.alice.stageide.ast.declaration.AddManagedFieldComposite">
  <property name="sceneObjects"><collection type="java.util.ArrayList"/></property>
  <property name="methods"><collection type="java.util.ArrayList"/></property>
</node>`;

async function buildSyntheticZip(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("version.txt", "3.6.0.0");
  zip.file("programType.xml", SYNTHETIC_XML);
  zip.file("manifest.json", JSON.stringify({ projectName: "Test", createdBy: "test" }));
  return zip.generateAsync({ type: "uint8array" });
}

describe("Outside-In: IDE operations integration", () => {
  it("Scenario 1: full user workflow — create, edit, undo, copy, preferences, save", async () => {
    // 1. User opens preferences (uses gridVisible, not showGrid)
    const prefs = new Preferences();
    prefs.set("theme", "dark");
    prefs.set("gridVisible", false);
    expect(prefs.get("theme")).toBe("dark");
    expect(prefs.get("gridVisible")).toBe(false);

    // 2. User opens a project from synthetic .a3p data
    const pm = new ProjectManager();
    const zipData = await buildSyntheticZip();
    await pm.open(zipData, "test.a3p");
    expect(pm.isOpen).toBe(true);
    expect(pm.isDirty).toBe(false);

    // 3. User sets up undo manager and scene
    const undoMgr = new UndoRedoManager();
    const scene = new Scene();

    // 4. User adds an entity via command (3-arg constructor: scene, name, entity)
    const entity = new SModel("Bunny", "bunny");
    const addCmd = new AddEntityCommand(scene, "Bunny", entity);
    undoMgr.execute(addCmd);
    expect(scene.getEntity("Bunny")).toBe(entity);
    expect(undoMgr.canUndo).toBe(true);
    pm.markDirty();
    expect(pm.isDirty).toBe(true);

    // 5. User undoes the add
    undoMgr.undo();
    expect(scene.getEntity("Bunny")).toBeUndefined();
    expect(undoMgr.canRedo).toBe(true);

    // 6. User redoes the add
    undoMgr.redo();
    expect(scene.getEntity("Bunny")).toBe(entity);

    // 7. User copies an AliceObject representation to clipboard
    const clipboard = new Clipboard();
    const aliceObj: AliceObject = {
      name: "Bunny",
      typeName: "org.lgna.story.SModel",
      resourceType: "bunny",
      position: { x: 0, y: 0, z: 0 },
      orientation: null,
      size: null,
    };
    clipboard.copyEntity(aliceObj);
    expect(clipboard.hasEntity).toBe(true);

    // 8. User pastes the entity (should get unique name since "Bunny" is in scene)
    const pasted = clipboard.pasteEntity(scene);
    expect(pasted).not.toBeNull();
    expect(pasted!.name).toBe("Bunny_copy");

    // Add a scene entity for the pasted object
    const pastedEntity = new SModel("Bunny_copy", "bunny");
    const addPastedCmd = new AddEntityCommand(scene, "Bunny_copy", pastedEntity);
    undoMgr.execute(addPastedCmd);
    expect(scene.getEntity("Bunny_copy")).toBe(pastedEntity);

    // 9. User saves
    const data = await pm.save();
    expect(data).toBeInstanceOf(Uint8Array);
    expect(pm.isDirty).toBe(false);

    // 10. User closes
    pm.close();
    expect(pm.isOpen).toBe(false);
  });

  it("Scenario 2: preferences round-trip and validation edge cases", () => {
    const prefs = new Preferences();

    // Set several preferences (gridVisible, not showGrid)
    prefs.set("theme", "dark");
    prefs.set("autoSaveInterval", 120);
    prefs.set("cameraFov", 90);
    prefs.set("gridVisible", false);

    // Serialize
    const json = prefs.toJSON();

    // Deserialize into new instance
    const restored = Preferences.fromJSON(json);
    expect(restored.get("theme")).toBe("dark");
    expect(restored.get("autoSaveInterval")).toBe(120);
    expect(restored.get("cameraFov")).toBe(90);
    expect(restored.get("gridVisible")).toBe(false);

    // Reset single key
    restored.reset("theme");
    expect(restored.get("theme")).toBe(DEFAULT_PREFERENCES.theme);

    // Validate edge: cameraFov clamping
    prefs.set("cameraFov", 0);
    expect(prefs.get("cameraFov")).toBe(1);
    prefs.set("cameraFov", 200);
    expect(prefs.get("cameraFov")).toBe(179);
  });

  it("Scenario 3: undo/redo with composite commands", () => {
    const scene = new Scene();
    const undoMgr = new UndoRedoManager();

    // Add multiple entities at once via composite (1-arg constructor: Command[])
    const e1 = new SModel("Cat", "cat");
    const e2 = new SModel("Dog", "dog");
    const composite = new CompositeCommand([
      new AddEntityCommand(scene, "Cat", e1),
      new AddEntityCommand(scene, "Dog", e2),
    ]);

    undoMgr.execute(composite);
    expect(scene.getEntity("Cat")).toBe(e1);
    expect(scene.getEntity("Dog")).toBe(e2);

    // Undo composite — both should disappear
    undoMgr.undo();
    expect(scene.getEntity("Cat")).toBeUndefined();
    expect(scene.getEntity("Dog")).toBeUndefined();

    // Redo
    undoMgr.redo();
    expect(scene.getEntity("Cat")).toBe(e1);
    expect(scene.getEntity("Dog")).toBe(e2);

    // Clear
    undoMgr.clear();
    expect(undoMgr.canUndo).toBe(false);
    expect(undoMgr.canRedo).toBe(false);
  });

  it("Scenario 4: clipboard code copy/paste (edge case)", () => {
    const clipboard = new Clipboard();

    // Copy code
    clipboard.copyCode("this.bunny.move(1, 0, 0);");
    expect(clipboard.hasCode).toBe(true);
    expect(clipboard.hasEntity).toBe(false);
    expect(clipboard.pasteCode()).toBe("this.bunny.move(1, 0, 0);");

    // Copy entity overwrites code
    const entity = new SModel("TestModel", "test");
    clipboard.copyEntity(entity);
    expect(clipboard.hasEntity).toBe(true);
    expect(clipboard.hasCode).toBe(false);
    expect(clipboard.pasteCode()).toBeNull();

    // Clear
    clipboard.clear();
    expect(clipboard.hasEntity).toBe(false);
    expect(clipboard.hasCode).toBe(false);
  });

  it("Scenario 5: project manager recent files tracking", async () => {
    const pm = new ProjectManager();

    // Build synthetic zip that has XML (required for save round-trip)
    const zipData1 = await buildSyntheticZip();
    await pm.open(zipData1, "project1.a3p");
    expect(pm.recentFiles.length).toBe(1);
    expect(pm.recentFiles[0].fileName).toBe("project1.a3p");

    // Save to get valid data, then open as second project
    const saved1 = await pm.save();
    pm.close();

    const zipData2 = await buildSyntheticZip();
    await pm.open(zipData2, "project2.a3p");
    expect(pm.recentFiles.length).toBe(2);
    expect(pm.recentFiles[0].fileName).toBe("project2.a3p");

    // Re-open first — should move to front (LRU)
    await pm.open(saved1, "project1.a3p");
    expect(pm.recentFiles[0].fileName).toBe("project1.a3p");

    pm.close();
  });
});
