import { describe, expect, it } from "vitest";
import {
  type Size,
  SBiped,
  SProp,
  Scene,
} from "../src/story-api";

describe("story-api implementation layer", () => {
  it("Property listeners observe entity property changes", () => {
    const prop = new SProp();
    const sizeProperty = prop.imp.getProperty<Size>("size");
    const changes: Array<{ previousValue: Size; value: Size }> = [];

    expect(sizeProperty).toBeDefined();
    sizeProperty!.addListener((change) => {
      changes.push({
        previousValue: change.previousValue,
        value: change.value,
      });
    });

    prop.size = { width: 2, height: 3, depth: 4 };

    expect(changes).toEqual([
      {
        previousValue: { width: 1, height: 1, depth: 1 },
        value: { width: 2, height: 3, depth: 4 },
      },
    ]);
  });

  it("scene activation lifecycle propagates to entity implementations", () => {
    const scene = new Scene();
    const bunny = new SBiped();

    scene.addEntity("bunny", bunny);
    expect(bunny.imp.isActive).toBe(false);

    scene.activate();
    expect(bunny.imp.isActive).toBe(true);

    scene.deactivate();
    expect(bunny.imp.isActive).toBe(false);
  });

  it("adding an entity to an active scene auto-activates it", () => {
    const scene = new Scene();
    scene.activate();

    const prop = new SProp();
    scene.addEntity("tree", prop);

    expect(prop.imp.isActive).toBe(true);
  });

  it("removing an entity deactivates it", () => {
    const scene = new Scene();
    const prop = new SProp();

    scene.addEntity("tree", prop);
    scene.activate();
    expect(prop.imp.isActive).toBe(true);

    scene.removeEntity("tree");
    expect(prop.imp.isActive).toBe(false);
  });

  it("vehicle assignment links entity implementations and prevents cycles", () => {
    const parent = new SProp();
    const child = new SProp();

    child.vehicle = parent;
    expect(child.vehicle).toBe(parent);
    expect(child.imp.vehicle).toBe(parent.imp);

    expect(() => {
      parent.vehicle = child;
    }).toThrow(/cycle/);
  });

  it("markers capture and restore transform state", () => {
    const bunny = new SBiped();
    bunny.position = { x: 1, y: 2, z: 3 };
    bunny.orientation = { x: 0, y: 0.5, z: 0, w: 0.5 };
    bunny.size = { width: 2, height: 2, depth: 2 };

    const marker = bunny.imp.createMarker();

    bunny.position = { x: 9, y: 9, z: 9 };
    bunny.orientation = { x: 0, y: 0, z: 0, w: 1 };
    bunny.size = { width: 5, height: 5, depth: 5 };

    bunny.imp.applyMarker(marker);

    expect(bunny.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(bunny.orientation).toEqual({ x: 0, y: 0.5, z: 0, w: 0.5 });
    expect(bunny.size).toEqual({ width: 2, height: 2, depth: 2 });
  });

  it("jointed models expose a traversable hierarchy", () => {
    const bunny = new SBiped();
    const hierarchy = bunny.getJointHierarchy();

    expect(hierarchy[0].name).toBe("ROOT");
    expect(hierarchy[0].children[0].name).toBe("PELVIS");
    expect(bunny.getJoint("LEFT_HAND")).toEqual({
      name: "LEFT_HAND",
      parent: "LEFT_ELBOW",
    });
  });

  it("binds properties bidirectionally and propagates changes both ways", () => {
    const left = new SProp();
    const right = new SProp();
    const leftSize = left.imp.getProperty<Size>("size")!;
    const rightSize = right.imp.getProperty<Size>("size")!;

    leftSize.bindBidirectional(rightSize);
    left.size = { width: 2, height: 3, depth: 4 };
    expect(right.size).toEqual({ width: 2, height: 3, depth: 4 });

    right.size = { width: 5, height: 6, depth: 7 };
    expect(left.size).toEqual({ width: 5, height: 6, depth: 7 });
  });

  it("supports entity-level property binding helpers", () => {
    const leader = new SBiped();
    const follower = new SBiped();

    expect(leader.imp.bindProperty("position", follower.imp, "position")).toBe(true);
    leader.position = { x: 1, y: 2, z: 3 };

    expect(follower.position).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("propagates through binding chains without looping", () => {
    const first = new SProp();
    const second = new SProp();
    const third = new SProp();

    const firstSize = first.imp.getProperty<Size>("size")!;
    const secondSize = second.imp.getProperty<Size>("size")!;
    const thirdSize = third.imp.getProperty<Size>("size")!;

    firstSize.bindBidirectional(secondSize);
    secondSize.bindBidirectional(thirdSize);

    first.size = { width: 9, height: 8, depth: 7 };

    expect(second.size).toEqual({ width: 9, height: 8, depth: 7 });
    expect(third.size).toEqual({ width: 9, height: 8, depth: 7 });
  });

  it("unbinds properties and stops further propagation", () => {
    const left = new SProp();
    const right = new SProp();
    const leftSize = left.imp.getProperty<Size>("size")!;
    const rightSize = right.imp.getProperty<Size>("size")!;

    leftSize.bindBidirectional(rightSize);
    left.imp.unbindProperty("size", right.imp, "size");
    left.size = { width: 4, height: 4, depth: 4 };

    expect(right.size).toEqual({ width: 1, height: 1, depth: 1 });
  });
});
