import { describe, expect, it } from "vitest";
import {
  getJoint,
  getOpacity,
  getOrientation,
  getPaint,
  getPosition,
  getVehicle,
  isShowing,
  move,
  moveAndOrientTo,
  moveAwayFrom,
  moveTo,
  moveToward,
  orientToUpright,
  resize,
  say,
  setJointRotation,
  setOpacity,
  setPaint,
  setSize,
  straightenOutJoints,
  think,
  turnToFace,
} from "../src/story-api-methods.js";
import { SBiped, SProp, SThingMarker, STurnable } from "../src/story-api/index.js";

function expectPositionCloseTo(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }): void {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
}

describe("story-api-methods", () => {
  it("wraps movement and orientation helpers around existing story-api entities", () => {
    const mover = new SProp();
    const target = new SProp();
    const viewer = new STurnable();
    target.position = { x: 3, y: 4, z: -12 };

    move(mover, "FORWARD", 2);
    expect(getPosition(mover)).toEqual({ x: 0, y: 0, z: -2 });

    moveToward(mover, target, 5);
    expectPositionCloseTo(getPosition(mover), {
      x: 15 / Math.sqrt(125),
      y: 20 / Math.sqrt(125),
      z: -2 - (50 / Math.sqrt(125)),
    });

    moveAwayFrom(mover, target, 5);
    expectPositionCloseTo(getPosition(mover), { x: 0, y: 0, z: -2 });

    moveTo(mover, target);
    expect(getPosition(mover)).toEqual(target.position);

    turnToFace(viewer, target);
    expect(viewer.isFacing(target)).toBe(true);
    viewer.orientation = { x: 0, y: 0, z: 0.6, w: 0.8 };
    orientToUpright(viewer);
    expect(getOrientation(viewer).z).toBeCloseTo(0, 6);
  });

  it("applies appearance helpers and preserves bound paint or color state", () => {
    const prop = new SProp();

    setPaint(prop, "RED");
    setOpacity(prop, 0.25);
    setSize(prop, { width: 2, height: 3, depth: 4 });
    const clip = resize(prop, 2);

    expect(clip).toBeNull();
    expect(getPaint(prop)).toBe("RED");
    expect(prop.color).toBe("RED");
    expect(getOpacity(prop)).toBe(0.25);
    expect(prop.size).toEqual({ width: 4, height: 6, depth: 8 });
  });

  it("returns bubble display state for say and think helpers", () => {
    const speaker = new SProp();

    const spoken = say(speaker, "Hello there", 1.5);
    expect(spoken.state).toEqual({ kind: "say", text: "Hello there", duration: 1.5 });
    expect(spoken.bubble).toMatchObject({ kind: "say", text: "Hello there", duration: 1.5 });
    expect(spoken.clip?.durationMs).toBe(1500);
    spoken.clip!.update(1500);
    expect(speaker.speechBubble).toBeNull();
    expect(speaker.speechBubbleEntity).toBeNull();

    const thought = think(speaker, "Maybe later", 0.5);
    expect(thought.state).toEqual({ kind: "think", text: "Maybe later", duration: 0.5 });
    expect(thought.bubble).toMatchObject({ kind: "think", text: "Maybe later", duration: 0.5 });
    expect(speaker.lastSpokenText).toBe("Hello there");
    expect(speaker.lastThoughtText).toBe("Maybe later");
  });

  it("exposes joint helpers and restores original joint rotations", () => {
    const biped = new SBiped("hero");
    const head = getJoint(biped, "HEAD");

    expect(head?.name).toBe("HEAD");
    setJointRotation(biped, "HEAD", { x: 0, y: 0.5, z: 0, w: 0.5 });
    expect(head?.orientation).toEqual({ x: 0, y: 0.5, z: 0, w: 0.5 });

    straightenOutJoints(biped);
    expect(head?.orientation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it("provides accessors for vehicle visibility and marker placement", () => {
    const vehicle = new SProp();
    const passenger = new SProp();
    const marker = new SThingMarker();
    const target = new SThingMarker();

    passenger.vehicle = vehicle;
    passenger.isShowing = false;
    target.position = { x: 2, y: 3, z: -4 };
    target.orientation = { x: 0, y: 0.70710678, z: 0, w: 0.70710678 };

    expect(getVehicle(passenger)).toBe(vehicle);
    expect(isShowing(passenger)).toBe(false);

    moveAndOrientTo(marker, target);
    expect(marker.position).toEqual(target.position);
    expect(marker.orientation).toEqual(target.orientation);
  });
});
