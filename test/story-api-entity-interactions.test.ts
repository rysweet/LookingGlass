import { describe, expect, it } from "vitest";
import { SProp, STurnable } from "../src/story-api";

const expectPositionCloseTo = (
  actual: { x: number; y: number; z: number },
  expected: { x: number; y: number; z: number },
): void => {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
};

describe("story-api entity interaction math", () => {
  it("moveToward follows the normalized vector toward the target", () => {
    const mover = new SProp();
    const target = new SProp();
    target.position = { x: 3, y: 4, z: -12 };

    mover.moveToward(target, 5);

    expectPositionCloseTo(mover.position, {
      x: 15 / 13,
      y: 20 / 13,
      z: -60 / 13,
    });
    expect(mover.getDistanceTo(target)).toBeCloseTo(8, 6);
  });

  it("moveAwayFrom mirrors moveToward along the same line", () => {
    const mover = new SProp();
    const target = new SProp();
    target.position = { x: 3, y: 4, z: -12 };

    mover.moveAwayFrom(target, 5);

    expectPositionCloseTo(mover.position, {
      x: -15 / 13,
      y: -20 / 13,
      z: 60 / 13,
    });
    expect(mover.getDistanceTo(target)).toBeCloseTo(18, 6);
  });

  it("pointAt rotates the entity so isFacing matches the target direction", () => {
    const viewer = new STurnable();
    const target = new SProp();
    const opposite = new SProp();
    target.position = { x: 5, y: 2, z: -5 };
    opposite.position = { x: -5, y: -2, z: 5 };

    viewer.pointAt(target);

    expect(viewer.isFacing(target)).toBe(true);
    expect(viewer.isFacing(opposite)).toBe(false);
    expect(viewer.getDistanceTo(target)).toBeCloseTo(Math.sqrt(54), 6);
  });

  it("getDistanceTo is symmetric and isFacing uses the front half-space", () => {
    const viewer = new STurnable();
    const front = new SProp();
    const side = new SProp();
    front.position = { x: 0, y: 0, z: -5 };
    side.position = { x: 5, y: 0, z: 0 };

    expect(viewer.getDistanceTo(front)).toBeCloseTo(front.getDistanceTo(viewer), 6);
    expect(viewer.getDistanceTo(front)).toBeCloseTo(5, 6);
    expect(viewer.isFacing(front)).toBe(true);
    expect(viewer.isFacing(side)).toBe(false);
  });
});
