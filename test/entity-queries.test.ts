import { describe, expect, it } from "vitest";
import {
  BoundingBoxQuery,
  CollisionQuery,
  DirectionQuery,
  DistanceQuery,
  IsAboveQuery,
  IsBehindQuery,
  IsBelowQuery,
  IsInFrontOfQuery,
  IsWithinThresholdQuery,
  VisibilityQuery,
} from "../src/entity-queries.js";
import { SCamera, SProp } from "../src/story-api/index.js";

describe("entity queries", () => {
  it("computes distance, direction, and relative position queries", () => {
    const a = new SProp("a");
    const b = new SProp("b");
    a.position = { x: 0, y: 0, z: 0 };
    b.position = { x: 0, y: 3, z: -4 };

    const distance = new DistanceQuery();
    expect(distance.between(a, b)).toBeCloseTo(5, 6);

    const direction = new DirectionQuery().fromAToB(a, b);
    expect(direction.x).toBeCloseTo(0, 6);
    expect(direction.y).toBeCloseTo(0.6, 6);
    expect(direction.z).toBeCloseTo(-0.8, 6);

    expect(new IsAboveQuery().evaluate(b, a)).toBe(true);
    expect(new IsBelowQuery().evaluate(a, b)).toBe(true);
    expect(new IsInFrontOfQuery().evaluate(b, a)).toBe(true);
    expect(new IsBehindQuery().evaluate(a, b)).toBe(true);
    expect(new IsWithinThresholdQuery().evaluate(a, b, 5)).toBe(true);
    expect(new IsWithinThresholdQuery().evaluate(a, b, 4.9)).toBe(false);
  });

  it("checks bounding boxes and collisions", () => {
    const left = new SProp("left");
    const right = new SProp("right");
    left.size = { width: 2, height: 2, depth: 2 };
    right.size = { width: 2, height: 2, depth: 2 };
    left.position = { x: 0, y: 0, z: 0 };
    right.position = { x: 0.5, y: 0, z: 0 };

    const bounds = new BoundingBoxQuery().worldBounds(left);
    expect(bounds).toEqual({
      min: { x: -1, y: -1, z: -1 },
      max: { x: 1, y: 1, z: 1 },
    });
    expect(new CollisionQuery().evaluate(left, right)).toBe(true);

    right.position = { x: 5, y: 0, z: 0 };
    expect(new CollisionQuery().evaluate(left, right)).toBe(false);
  });

  it("determines whether an entity is visible from a camera", () => {
    const camera = new SCamera();
    camera.position = { x: 0, y: 0, z: 0 };
    camera.orientation = { x: 0, y: 0, z: 0, w: 1 };
    camera.nearClippingPlaneDistance = 0.1;
    camera.farClippingPlaneDistance = 10;
    camera.horizontalViewingAngle = Math.PI / 2;
    camera.verticalViewingAngle = Math.PI / 2;

    const visible = new SProp("visible");
    visible.position = { x: 0, y: 0, z: -5 };

    const offscreen = new SProp("offscreen");
    offscreen.position = { x: 10, y: 0, z: -5 };

    const hidden = new SProp("hidden");
    hidden.position = { x: 0, y: 0, z: -3 };
    hidden.isShowing = false;

    const query = new VisibilityQuery();
    expect(query.visibleFrom(camera, visible)).toBe(true);
    expect(query.visibleFrom(camera, offscreen)).toBe(false);
    expect(query.visibleFrom(camera, hidden)).toBe(false);
  });
});
