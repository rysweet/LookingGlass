import { describe, expect, it } from "vitest";
import {
  AppearanceBehavior,
  MoveTowardBehavior,
  MovementBehavior,
  PlaceBehavior,
  PointAtBehavior,
  ResizeBehavior,
  SpeechBehavior,
  TurnToFaceBehavior,
} from "../src/entity-behaviors.js";
import { SProp } from "../src/story-api/index.js";
import { rotateVector } from "../src/story-api/expanded-math.js";

function expectPositionClose(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }): void {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
}

describe("entity behaviors", () => {
  it("walks, runs, turns, and rolls with per-step transforms", () => {
    const actor = new SProp("actor");
    const movement = new MovementBehavior();

    const walk = movement.walk(actor, "FORWARD", 4, 4);
    expect(walk).toHaveLength(4);
    expectPositionClose(walk[0].position, { x: 0, y: 0, z: -1 });
    expectPositionClose(walk[3].position, { x: 0, y: 0, z: -4 });
    expectPositionClose(actor.position, { x: 0, y: 0, z: -4 });

    const run = movement.run(actor, { x: 1, y: 0, z: 0 }, 6, 3);
    expect(run).toHaveLength(3);
    expectPositionClose(run[2].position, { x: 6, y: 0, z: -4 });
    expectPositionClose(actor.position, { x: 6, y: 0, z: -4 });

    const turn = movement.turn(actor, "LEFT", 0.25, 2);
    expect(turn).toHaveLength(2);
    const turnedForward = rotateVector(actor.orientation, { x: 0, y: 0, z: -1 });
    expect(Math.abs(turnedForward.x)).toBeGreaterThan(0.99);
    expect(Math.abs(turnedForward.z)).toBeLessThan(0.01);

    const roll = movement.roll(actor, "RIGHT", 0.25, 2);
    expect(roll).toHaveLength(2);
    expect(actor.orientation.z).not.toBeCloseTo(0, 6);
  });

  it("grows, shrinks, fades, and shifts color", () => {
    const model = new SProp("model");
    model.size = { width: 2, height: 4, depth: 6 };
    model.color = "#000000";
    model.opacity = 1;

    const resize = new ResizeBehavior();
    const grown = resize.grow(model, 1.5, 3);
    expect(grown).toHaveLength(3);
    expect(grown[2].size).toEqual({ width: 3, height: 6, depth: 9 });

    const shrunken = resize.shrink(model, 3, 3);
    expect(shrunken[2].size).toEqual({ width: 1, height: 2, depth: 3 });
    expect(model.size).toEqual({ width: 1, height: 2, depth: 3 });

    const appearance = new AppearanceBehavior();
    const fade = appearance.fade(model, 0.25, 4);
    expect(fade[0].opacity).toBeCloseTo(0.8125, 6);
    expect(fade[3].opacity).toBeCloseTo(0.25, 6);

    const colorShift = appearance.colorShift(model, "#3366CC", 3);
    expect(colorShift[0].color).toBe("#112244");
    expect(colorShift[2].color).toBe("#3366CC");
    expect(model.color).toBe("#3366CC");
  });

  it("animates speech bubbles for say and think", () => {
    const speaker = new SProp("speaker");
    const speech = new SpeechBehavior();

    const sayTimeline = speech.say(speaker, "Hello there", 1, 4);
    expect(sayTimeline[0].visible).toBe(true);
    expect(sayTimeline[0].bubble?.text).toBe("Hello there");
    expect(sayTimeline.at(-1)?.visible).toBe(false);
    expect(speaker.lastSpokenText).toBe("Hello there");

    const thinkTimeline = speech.think(speaker, "Plan first", 1, 2);
    expect(thinkTimeline[0].state?.kind).toBe("think");
    expect(thinkTimeline.at(-1)?.bubble).toBeNull();
    expect(speaker.lastThoughtText).toBe("Plan first");
  });

  it("tracks targets, approaches them with speed control, and snaps placement", () => {
    const actor = new SProp("actor");
    const target = new SProp("target");
    target.position = { x: 5, y: 2, z: -5 };

    const pointAt = new PointAtBehavior();
    const pointSteps = pointAt.track(actor, target, 4);
    expect(pointSteps).toHaveLength(4);
    expect(actor.isFacing(target)).toBe(true);

    const mover = new SProp("mover");
    const moveToward = new MoveTowardBehavior();
    const approachSteps = moveToward.approach(mover, target, 3, 3);
    expect(approachSteps[0].position.z).toBeLessThan(0);
    expect(mover.getDistanceTo(target)).toBeCloseTo(0, 6);

    const turnToFace = new TurnToFaceBehavior();
    const turnSteps = turnToFace.track(mover, target, 3);
    expect(turnSteps).toHaveLength(1);
    const planarForward = rotateVector(mover.orientation, { x: 0, y: 0, z: -1 });
    expect(planarForward.y).toBeCloseTo(0, 6);

    const place = new PlaceBehavior();
    const snapped = place.snapToEntity(actor, target);
    expectPositionClose(snapped.position, target.position);
    expect(actor.orientation).toEqual(target.orientation);

    const explicit = place.snapToTransform(actor, { x: -2, y: 1, z: 3 }, { x: 0, y: 0.7071068, z: 0, w: 0.7071068 });
    expectPositionClose(explicit.position, { x: -2, y: 1, z: 3 });
    expect(actor.orientation.y).toBeCloseTo(0.7071068, 6);
  });
});
