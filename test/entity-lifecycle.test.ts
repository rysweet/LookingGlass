import { describe, expect, it } from "vitest";
import {
  EntityCloner,
  EntityCreator,
  EntityDestroyer,
  EntityFactory,
  EntityRegistry,
  EntitySerializer,
} from "../src/entity-lifecycle.js";
import { Scene } from "../src/story-api/scene.js";
import { SBiped, SCamera, SGround, SProp } from "../src/story-api/entities.js";

describe("entity-lifecycle", () => {
  it("creates common entity types through the factory", () => {
    const factory = new EntityFactory();

    expect(factory.createBiped("hero")).toBeInstanceOf(SBiped);
    expect(factory.createCamera("cam")).toBeInstanceOf(SCamera);
    expect(factory.createGround("ground")).toBeInstanceOf(SGround);
    expect(factory.createProp("crate")).toBeInstanceOf(SProp);
  });

  it("creates entities in a scene and tracks them in the registry", () => {
    const scene = new Scene();
    const registry = new EntityRegistry();
    const creator = new EntityCreator(new EntityFactory(), registry);

    const entity = creator.createEntity(scene, {
      name: "hero",
      typeName: "SBiped",
      position: { x: 1, y: 2, z: 3 },
      isShowing: false,
    });

    expect(scene.getEntity("hero")).toBe(entity);
    expect(registry.get("hero")).toBe(entity);
    expect(registry.getByType("SBiped")).toEqual([entity]);
    expect((entity as SBiped).position).toEqual({ x: 1, y: 2, z: 3 });
    expect(entity.isShowing).toBe(false);
  });

  it("clones entities with independent transform objects", () => {
    const scene = new Scene();
    const registry = new EntityRegistry();
    const creator = new EntityCreator(new EntityFactory(), registry);
    const cloner = new EntityCloner(new EntityFactory(), registry);
    const source = creator.createEntity(scene, {
      name: "crate",
      typeName: "SProp",
      position: { x: 4, y: 5, z: 6 },
      orientation: { x: 0, y: 0.5, z: 0, w: 1 },
      size: { width: 2, height: 3, depth: 4 },
    }) as SProp;

    const clone = cloner.cloneEntity(scene, "crate", "crateCopy") as SProp;
    source.position = { ...source.position, x: 99 };
    source.size = { ...source.size, width: 42 };

    expect(clone).toBeInstanceOf(SProp);
    expect(clone.position).toEqual({ x: 4, y: 5, z: 6 });
    expect(clone.orientation).toEqual({ x: 0, y: 0.5, z: 0, w: 1 });
    expect(clone.size).toEqual({ width: 2, height: 3, depth: 4 });
    expect(registry.get("crateCopy")).toBe(clone);
  });

  it("serializes entity state to json and restores detached entities", () => {
    const serializer = new EntitySerializer();
    const entity = new SProp("tree");
    entity.position = { x: 7, y: 8, z: 9 };
    entity.orientation = { x: 0, y: 0, z: 0, w: 1 };
    entity.size = { width: 1.5, height: 2.5, depth: 3.5 };
    entity.isShowing = false;

    const state = serializer.serializeEntity(entity, "tree", "SProp");
    const json = serializer.toJson(state);
    const restoredState = serializer.fromJson(json) as typeof state;
    const restored = serializer.deserializeEntity(restoredState) as SProp;

    expect(restored.position).toEqual({ x: 7, y: 8, z: 9 });
    expect(restored.orientation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    expect(restored.size).toEqual({ width: 1.5, height: 2.5, depth: 3.5 });
    expect(restored.isShowing).toBe(false);
    expect(restored.getName()).toBe("tree");
  });

  it("destroys entities and unregisters them", () => {
    const scene = new Scene();
    const registry = new EntityRegistry();
    const creator = new EntityCreator(new EntityFactory(), registry);
    const destroyer = new EntityDestroyer(registry);
    creator.createEntity(scene, { name: "ground", typeName: "SGround" });

    const snapshot = destroyer.destroyEntity(scene, "ground");

    expect(snapshot?.name).toBe("ground");
    expect(scene.getEntity("ground")).toBeUndefined();
    expect(registry.get("ground")).toBeNull();
  });
});
