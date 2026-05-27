import { describe, expect, it } from "vitest";
import {
  CURRENT_SCENE_VERSION,
  SceneBuilder,
  SceneComparator,
  SceneMigration,
  SceneSerializer,
  SceneSnapshot,
  SceneValidator,
  type SceneState,
} from "../src/scene-management.js";

describe("scene-management", () => {
  it("builds scene state with entity metadata", () => {
    const builder = new SceneBuilder();
    builder.addEntity({ name: "ground", typeName: "SGround" });
    builder.addEntity({
      name: "hero",
      typeName: "SBiped",
      parentName: "ground",
      position: { x: 1, y: 0, z: -2 },
    });

    const state = builder.captureState();

    expect(builder.getScene().getEntity("hero")).toBeDefined();
    expect(state.version).toBe(CURRENT_SCENE_VERSION);
    expect(state.entities.find((entity) => entity.name === "hero")).toMatchObject({
      parentName: "ground",
      typeName: "SBiped",
      position: { x: 1, y: 0, z: -2 },
    });
  });

  it("validates orphaned entities and parent cycles", () => {
    const validator = new SceneValidator();
    const state: SceneState = {
      version: CURRENT_SCENE_VERSION,
      entities: [
        {
          name: "a",
          typeName: "SProp",
          resourceType: null,
          isShowing: true,
          position: null,
          orientation: null,
          size: null,
          extras: {},
          parentName: "missing",
        },
        {
          name: "b",
          typeName: "SProp",
          resourceType: null,
          isShowing: true,
          position: null,
          orientation: null,
          size: null,
          extras: {},
          parentName: "c",
        },
        {
          name: "c",
          typeName: "SProp",
          resourceType: null,
          isShowing: true,
          position: null,
          orientation: null,
          size: null,
          extras: {},
          parentName: "b",
        },
      ],
    };

    const issues = validator.validate(state);

    expect(issues.map((issue) => issue.code)).toEqual(["orphan", "cycle", "cycle"]);
  });

  it("serializes, deserializes, and hydrates a scene state", () => {
    const builder = new SceneBuilder();
    builder.addEntity({ name: "camera", typeName: "SCamera" });
    builder.addEntity({ name: "crate", typeName: "SProp", parentName: "camera" });
    const serializer = new SceneSerializer();

    const json = serializer.serialize(builder.captureState());
    const restored = serializer.deserialize(json);
    const hydrated = serializer.hydrate(restored);

    expect(restored.entities.map((entity) => entity.name)).toEqual(["camera", "crate"]);
    expect(hydrated.scene.getEntity("crate")).toBeDefined();
    expect(hydrated.registry.get("camera")).toBe(hydrated.scene.getEntity("camera"));
  });

  it("captures deep-copy snapshots", () => {
    const builder = new SceneBuilder();
    builder.addEntity({ name: "crate", typeName: "SProp" });
    const snapshotter = new SceneSnapshot();

    const original = builder.captureState();
    const snapshot = snapshotter.capture(original);
    const mutableSnapshot = snapshot as unknown as { entities: Array<{ name: string }> };
    mutableSnapshot.entities[0]!.name = "mutated";

    expect(original.entities[0]!.name).toBe("crate");
  });

  it("diffs added removed and changed entities", () => {
    const comparator = new SceneComparator();
    const left: SceneState = {
      version: 1,
      entities: [
        {
          name: "a",
          typeName: "SProp",
          resourceType: null,
          isShowing: true,
          position: null,
          orientation: null,
          size: null,
          extras: {},
          parentName: null,
        },
        {
          name: "b",
          typeName: "SProp",
          resourceType: null,
          isShowing: true,
          position: { x: 0, y: 0, z: 0 },
          orientation: null,
          size: null,
          extras: {},
          parentName: null,
        },
      ],
    };
    const right: SceneState = {
      version: 2,
      entities: [
        {
          name: "b",
          typeName: "SProp",
          resourceType: null,
          isShowing: true,
          position: { x: 1, y: 0, z: 0 },
          orientation: null,
          size: null,
          extras: {},
          parentName: null,
        },
        {
          name: "c",
          typeName: "SBiped",
          resourceType: null,
          isShowing: true,
          position: null,
          orientation: null,
          size: null,
          extras: {},
          parentName: null,
        },
      ],
    };

    const diff = comparator.diff(left, right);

    expect(diff.added).toEqual(["c"]);
    expect(diff.removed).toEqual(["a"]);
    expect(diff.changed).toEqual(["b"]);
    expect(diff.unchanged).toEqual([]);
    expect(diff.versionChanged).toBe(true);
  });

  it("migrates legacy scene state to the current format", () => {
    const migration = new SceneMigration();
    const upgraded = migration.upgrade({
      version: 1,
      entities: [{ name: "legacy", className: "SBiped", visible: false }],
    });

    expect(upgraded.version).toBe(CURRENT_SCENE_VERSION);
    expect(upgraded.entities[0]).toMatchObject({
      name: "legacy",
      typeName: "SBiped",
      isShowing: false,
      parentName: null,
    });
  });
});
