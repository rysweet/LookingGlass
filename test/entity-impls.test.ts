import { describe, expect, it } from "vitest";
import {
  BoxImp,
  JointImp,
  MarkerImp,
  ModelImp,
  ObjectMarkerImp,
  SphereImp,
  TorusImp,
} from "../src/entity-impls.js";

function rounded(value: number): number {
  return Number(value.toFixed(6));
}

describe("entity-impls", () => {
  it("computes a box bounding box from size and world position", () => {
    const box = new BoxImp("crate");
    box.size = { width: 4, height: 2, depth: 6 };
    box.position = { x: 3, y: 4, z: -2 };
    box.paint = "RED";
    box.opacity = 0.5;

    expect(box.getBoundingBox()).toEqual({
      min: { x: 1, y: 3, z: -5 },
      max: { x: 5, y: 5, z: 1 },
    });
    expect(box.paint).toBe("RED");
    expect(box.opacity).toBe(0.5);
  });

  it("keeps sphere radius and derived size synchronized", () => {
    const sphere = new SphereImp("ball", 1.5);

    expect(sphere.size).toEqual({ width: 3, height: 3, depth: 3 });
    sphere.radius = 2;

    expect(sphere.size).toEqual({ width: 4, height: 4, depth: 4 });
    expect(sphere.getBoundingBox()).toEqual({
      min: { x: -2, y: -2, z: -2 },
      max: { x: 2, y: 2, z: 2 },
    });
  });

  it("computes torus bounds from inner and outer radii", () => {
    const torus = new TorusImp("ring", 0.5, 2.5);
    torus.position = { x: 1, y: 0, z: -1 };

    expect(torus.size).toEqual({ width: 5, height: 2, depth: 5 });
    expect(torus.getBoundingBox()).toEqual({
      min: { x: -1.5, y: -1, z: -3.5 },
      max: { x: 3.5, y: 1, z: 1.5 },
    });
  });

  it("tracks joint hierarchy world transforms and chains", () => {
    const model = new ModelImp("robot");
    const shoulder = new JointImp({ name: "SHOULDER", parent: "ROOT" });
    const hand = new JointImp({ name: "HAND", parent: "SHOULDER" });

    shoulder.position = { x: 1, y: 0, z: 0 };
    hand.position = { x: 0, y: 2, z: 0 };
    shoulder.setJointParent(model);
    hand.setJointParent(shoulder);

    expect(model.enumerateJoints().map((joint) => joint.jointId.name)).toEqual(["HAND", "SHOULDER"]);
    expect(hand.getJointChain().map((joint) => joint.jointId.name)).toEqual(["SHOULDER", "HAND"]);
    expect(hand.getWorldPosition()).toEqual({ x: 1, y: 2, z: 0 });
    expect(shoulder.jointChildren.map((joint) => joint.jointId.name)).toEqual(["HAND"]);
  });

  it("binds resources, preserves sub-meshes, and unions model bounds", () => {
    const model = new ModelImp("dragon");
    model.position = { x: 10, y: 0, z: 0 };
    model.size = { width: 2, height: 2, depth: 2 };
    model.bindResource("dragon.glb", [
      {
        name: "wing",
        bounds: {
          min: { x: -4, y: -1, z: -1 },
          max: { x: -1, y: 2, z: 1 },
        },
      },
    ]);

    expect(model.resourceId).toBe("dragon.glb");
    expect(model.getSubMeshes()).toHaveLength(1);
    expect(model.getBoundingBox()).toEqual({
      min: { x: 6, y: -1, z: -1 },
      max: { x: 11, y: 2, z: 1 },
    });
  });

  it("markers capture and restore transform and appearance state", () => {
    const source = new ObjectMarkerImp("source");
    source.position = { x: 4, y: 1, z: -3 };
    source.orientation = { x: 0, y: 0.7071068, z: 0, w: 0.7071068 };
    source.size = { width: 2, height: 3, depth: 4 };
    source.paint = "BLUE";
    source.opacity = 0.25;

    const marker = new MarkerImp("marker");
    marker.capture(source);

    const target = new BoxImp("target");
    marker.applyTo(target);

    expect(target.position).toEqual({ x: 4, y: 1, z: -3 });
    expect(rounded(target.orientation.y)).toBe(rounded(0.7071068));
    expect(target.size).toEqual({ width: 2, height: 3, depth: 4 });
    expect(target.paint).toBe("BLUE");
    expect(target.opacity).toBe(0.25);
  });
});
