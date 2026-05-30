import { describe, it, expect } from "vitest";
import {
  GroupNode,
  VisualNode,
  CameraNode,
  LightNode,
  Transformable,
  SceneGraph,
} from "../src/scene-graph";
import type { Vec3 } from "../src/story-api/types";

function expectVec3Close(actual: Vec3, expected: Vec3, precision = 4): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
}

describe("Transformable", () => {
  it("all node types are instanceof Transformable", () => {
    expect(new GroupNode("g")).toBeInstanceOf(Transformable);
    expect(new VisualNode("v")).toBeInstanceOf(Transformable);
    expect(new CameraNode("c")).toBeInstanceOf(Transformable);
    expect(new LightNode("l", "point")).toBeInstanceOf(Transformable);
  });

  describe("translate", () => {
    it("moves position by delta", () => {
      const node = new GroupNode("test");
      node.translate({ x: 1, y: 2, z: 3 });
      expectVec3Close(node.localTransform.position, { x: 1, y: 2, z: 3 });
    });

    it("accumulates translations", () => {
      const node = new GroupNode("test");
      node.translate({ x: 1, y: 0, z: 0 });
      node.translate({ x: 0, y: 2, z: 0 });
      expectVec3Close(node.localTransform.position, { x: 1, y: 2, z: 0 });
    });
  });

  describe("rotate", () => {
    it("rotates around Y axis", () => {
      const node = new GroupNode("test");
      node.rotate({ x: 0, y: 1, z: 0 }, Math.PI / 2);
      const q = node.localTransform.orientation;
      expect(q.y).toBeCloseTo(Math.sin(Math.PI / 4), 5);
      expect(q.w).toBeCloseTo(Math.cos(Math.PI / 4), 5);
    });
  });

  describe("scaleBy", () => {
    it("scales by factor", () => {
      const node = new VisualNode("test");
      node.scaleBy({ x: 2, y: 3, z: 4 });
      expectVec3Close(node.localTransform.scale, { x: 2, y: 3, z: 4 });
    });

    it("accumulates scale", () => {
      const node = new VisualNode("test");
      node.scaleBy({ x: 2, y: 2, z: 2 });
      node.scaleBy({ x: 3, y: 3, z: 3 });
      expectVec3Close(node.localTransform.scale, { x: 6, y: 6, z: 6 });
    });
  });

  describe("getWorldTransform", () => {
    it("returns identity for root node", () => {
      const node = new GroupNode("root");
      const wt = node.getWorldTransform();
      expectVec3Close(wt.position, { x: 0, y: 0, z: 0 });
      expectVec3Close(wt.scale, { x: 1, y: 1, z: 1 });
    });

    it("composes parent-child transforms", () => {
      const parent = new GroupNode("parent");
      parent.translate({ x: 10, y: 0, z: 0 });
      const child = new GroupNode("child");
      child.translate({ x: 5, y: 0, z: 0 });
      parent.addChild(child);
      const wt = child.getWorldTransform();
      expectVec3Close(wt.position, { x: 15, y: 0, z: 0 });
    });
  });

  describe("localToWorld / worldToLocal", () => {
    it("round-trips through local and world space", () => {
      const parent = new GroupNode("parent");
      parent.translate({ x: 10, y: 20, z: 30 });
      const child = new VisualNode("child");
      child.translate({ x: 1, y: 2, z: 3 });
      parent.addChild(child);

      const localPoint: Vec3 = { x: 1, y: 1, z: 1 };
      const worldPoint = child.localToWorld(localPoint);
      const backToLocal = child.worldToLocal(worldPoint);
      expectVec3Close(backToLocal, localPoint);
    });

    it("localToWorld of origin equals world position", () => {
      const node = new GroupNode("test");
      node.translate({ x: 5, y: 10, z: 15 });
      const worldOrigin = node.localToWorld({ x: 0, y: 0, z: 0 });
      expectVec3Close(worldOrigin, { x: 5, y: 10, z: 15 });
    });

    it("worldToLocal of world position equals origin", () => {
      const node = new GroupNode("test");
      node.translate({ x: 5, y: 10, z: 15 });
      const localOrigin = node.worldToLocal({ x: 5, y: 10, z: 15 });
      expectVec3Close(localOrigin, { x: 0, y: 0, z: 0 });
    });
  });

  describe("lookAt", () => {
    it("rotates to face a target point", () => {
      const node = new CameraNode("cam");
      node.lookAt({ x: 0, y: 0, z: -10 });
      const q = node.localTransform.orientation;
      expect(Math.abs(q.w)).toBeLessThanOrEqual(1);
    });
  });

  describe("getTransformation", () => {
    it("returns a copy of localTransform", () => {
      const node = new GroupNode("test");
      node.translate({ x: 1, y: 2, z: 3 });
      const t = node.getTransformation();
      expectVec3Close(t.position, { x: 1, y: 2, z: 3 });
      (t.position as { x: number }).x = 999;
      expectVec3Close(node.localTransform.position, { x: 1, y: 2, z: 3 });
    });
  });
});

describe("SceneGraph with Transformable nodes", () => {
  it("builds a complex hierarchy with transforms", () => {
    const sg = new SceneGraph();
    const world = new GroupNode("world");
    sg.root.addChild(world);

    const model = new VisualNode("robot");
    model.translate({ x: 0, y: 1, z: 0 });
    world.addChild(model);

    const arm = new VisualNode("arm");
    arm.translate({ x: 0.5, y: 0, z: 0 });
    arm.rotate({ x: 0, y: 0, z: 1 }, Math.PI / 4);
    model.addChild(arm);

    expect(sg.nodeCount).toBe(4);
    const armWorld = arm.getWorldTransform();
    expectVec3Close(armWorld.position, { x: 0.5, y: 1, z: 0 });
  });

  it("camera and lights are transformable", () => {
    const cam = new CameraNode("mainCam");
    cam.translate({ x: 0, y: 5, z: 10 });
    cam.lookAt({ x: 0, y: 0, z: 0 });

    const light = new LightNode("sun", "directional");
    light.translate({ x: 0, y: 10, z: 0 });

    expect(cam.getWorldTransform().position.z).toBeCloseTo(10);
    expect(light.getWorldTransform().position.y).toBeCloseTo(10);
  });
});
