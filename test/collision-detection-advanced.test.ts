import { describe, expect, it } from "vitest";
import {
  ProximityZoneTracker,
  aabbContainsPoint,
  aabbFromEntity,
  rayAabbIntersection,
  sphereIntersects,
} from "../src/collision-detection";
import { SModel } from "../src/story-api/entities";
import type { BoundingBox } from "../src/story-api/types";

describe("sphereIntersects", () => {
  it("returns true for overlapping and touching spheres", () => {
    expect(
      sphereIntersects(
        { center: { x: 0, y: 0, z: 0 }, radius: 2 },
        { center: { x: 3, y: 0, z: 0 }, radius: 1 },
      ),
    ).toBe(true);
    expect(
      sphereIntersects(
        { center: { x: 0, y: 0, z: 0 }, radius: 2 },
        { center: { x: 4, y: 0, z: 0 }, radius: 2 },
      ),
    ).toBe(true);
  });

  it("returns false for separated spheres", () => {
    expect(
      sphereIntersects(
        { center: { x: 0, y: 0, z: 0 }, radius: 1 },
        { center: { x: 3.1, y: 0, z: 0 }, radius: 2 },
      ),
    ).toBe(false);
  });
});

describe("rayAabbIntersection", () => {
  const box: BoundingBox = {
    min: { x: -1, y: -1, z: -1 },
    max: { x: 1, y: 1, z: 1 },
  };

  it("returns hit distance, point, and normal for a front-face hit", () => {
    const hit = rayAabbIntersection(
      {
        origin: { x: 0, y: 0, z: -5 },
        direction: { x: 0, y: 0, z: 1 },
      },
      box,
    );

    expect(hit).toEqual({
      distance: 4,
      point: { x: 0, y: 0, z: -1 },
      normal: { x: 0, y: 0, z: -1 },
    });
  });

  it("returns null when the ray is parallel and outside the slab", () => {
    expect(
      rayAabbIntersection(
        {
          origin: { x: 3, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
        },
        box,
      ),
    ).toBeNull();
  });

  it("returns an immediate hit when the ray starts inside the box", () => {
    const hit = rayAabbIntersection(
      {
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 1, y: 0, z: 0 },
      },
      box,
    );

    expect(hit).toEqual({
      distance: 0,
      point: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 0, z: 0 },
    });
  });

  it("respects maxDistance clipping", () => {
    expect(
      rayAabbIntersection(
        {
          origin: { x: 0, y: 0, z: -5 },
          direction: { x: 0, y: 0, z: 1 },
          maxDistance: 3,
        },
        box,
      ),
    ).toBeNull();
  });
});

describe("ProximityZoneTracker", () => {
  it("emits enter once, then exit when the target leaves the zone", () => {
    const tracker = new ProximityZoneTracker();
    const hero = { id: "hero", position: { x: 0, y: 0, z: 0 } };

    expect(
      tracker.update(hero, { id: "villain", position: { x: 10, y: 0, z: 0 } }, 3),
    ).toBeNull();

    expect(
      tracker.update(hero, { id: "villain", position: { x: 2, y: 0, z: 0 } }, 3),
    ).toEqual({
      type: "enter",
      sourceId: "hero",
      targetId: "villain",
      distance: 2,
      radius: 3,
    });
    expect(tracker.isInside("hero", "villain")).toBe(true);

    expect(
      tracker.update(hero, { id: "villain", position: { x: 1, y: 0, z: 0 } }, 3),
    ).toBeNull();

    expect(
      tracker.update(hero, { id: "villain", position: { x: 5, y: 0, z: 0 } }, 3),
    ).toEqual({
      type: "exit",
      sourceId: "hero",
      targetId: "villain",
      distance: 5,
      radius: 3,
    });
    expect(tracker.isInside("hero", "villain")).toBe(false);
  });
});

describe("entity collision helpers", () => {
  it("supports ray and point checks against entity AABBs", () => {
    const model = new SModel();
    model.position = { x: 4, y: 1, z: 0 };
    model.size = { width: 2, height: 2, depth: 2 };

    const box = aabbFromEntity(model);
    expect(aabbContainsPoint(box, { x: 4, y: 1, z: 0 })).toBe(true);
    expect(
      rayAabbIntersection(
        {
          origin: { x: 0, y: 1, z: 0 },
          direction: { x: 1, y: 0, z: 0 },
        },
        box,
      ),
    ).toEqual({
      distance: 3,
      point: { x: 3, y: 1, z: 0 },
      normal: { x: -1, y: 0, z: 0 },
    });
  });
});
