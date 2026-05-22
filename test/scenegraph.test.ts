import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { AliceProject, AliceObject } from "../src/a3p-parser.js";
import { buildScene } from "../src/scene-builder.js";
import {
  BoxGeometry,
  Composite,
  Model,
  PlaneGeometry,
  Transformable,
  Visual,
  createModel,
} from "../src/scenegraph.js";

function decomposeTranslation(matrix: THREE.Matrix4): THREE.Vector3 {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  return position;
}

function makeObject(
  overrides: Partial<AliceObject> & { name: string; typeName: string },
): AliceObject {
  return {
    resourceType: null,
    position: null,
    orientation: null,
    size: null,
    ...overrides,
  };
}

function makeProject(objects: AliceObject[]): AliceProject {
  return {
    version: "3.6.0.0",
    projectName: "ParityScene",
    sceneObjects: objects,
    methods: [],
  };
}

describe("scenegraph hierarchy", () => {
  it("supports parent-child add/remove relationships", () => {
    const root = new Composite("root");
    const group = new Transformable("group");
    const child = new Model("child");

    root.add(group);
    group.add(child);

    expect(root.hasChild(group)).toBe(true);
    expect(group.hasChild(child)).toBe(true);
    expect(child.parent).toBe(group);
    expect(child.isDescendantOf(root)).toBe(true);

    expect(group.remove(child)).toBe(true);
    expect(child.parent).toBeNull();
    expect(group.hasChild(child)).toBe(false);
  });

  it("computes absolute transformations from the parent chain", () => {
    const root = new Transformable("root").setTranslation(1, 2, 3);
    const child = new Transformable("child").setTranslation(4, 0, -2);
    root.add(child);

    const translation = decomposeTranslation(child.absoluteMatrix);
    expect(translation.x).toBeCloseTo(5);
    expect(translation.y).toBeCloseTo(2);
    expect(translation.z).toBeCloseTo(1);
  });

  it("keeps visual and geometry concerns separated", () => {
    const visual = new Visual("visual");
    visual.addGeometry(new BoxGeometry(2, 4, 6));
    visual.addGeometry(new PlaneGeometry(10, 10));

    const bounds = visual.bounds;
    expect(bounds).not.toBeNull();
    expect(bounds!.min.x).toBeCloseTo(-5);
    expect(bounds!.max.z).toBeCloseTo(5);

    const threeObject = visual.toThreeObject();
    expect(threeObject.children).toHaveLength(2);
  });

  it("prevents cycles when reparenting components", () => {
    const root = new Transformable("root");
    const child = new Transformable("child");
    const grandChild = new Transformable("grandChild");
    root.add(child);
    child.add(grandChild);

    expect(() => grandChild.add(root)).toThrow(/cycle/i);
  });
});

describe("scenegraph integration with scene-builder", () => {
  it("returns a sceneGraph rooted in Transformable models", () => {
    const project = makeProject([
      makeObject({ name: "ground", typeName: "org.lgna.story.SGround" }),
      makeObject({
        name: "bunny",
        typeName: "org.lgna.story.SQuadruped",
        position: { x: 3, y: 0, z: -1 },
        size: { width: 2, height: 1, depth: 4 },
      }),
    ]);

    const result = buildScene(project);

    expect(result.sceneGraph).toBeInstanceOf(Transformable);
    expect(result.sceneGraph.children).toHaveLength(2);
    expect(result.sceneGraph.children[0]).toBeInstanceOf(Model);
    const bunny = result.sceneGraph.children[1] as Model;
    expect(bunny.visual.geometries[0]).toBeInstanceOf(BoxGeometry);

    const translation = decomposeTranslation(bunny.absoluteMatrix);
    expect(translation.x).toBeCloseTo(3);
    expect(translation.z).toBeCloseTo(-1);
  });

  it("creates reusable models through the helper factory", () => {
    const model = createModel({
      name: "tree",
      geometry: new BoxGeometry(1, 3, 1),
      color: 0x00aa00,
      position: { x: 1, y: 2, z: 3 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
    });

    expect(model).toBeInstanceOf(Model);
    expect(model.visual.appearance.color).toBe(0x00aa00);
    expect(model.visual.parent).toBe(model);

    const translation = decomposeTranslation(model.absoluteMatrix);
    expect(translation.toArray()).toEqual([1, 2, 3]);
  });
});
