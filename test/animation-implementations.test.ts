import { describe, expect, it } from "vitest";
import { TraditionalStyle } from "../src/animation.js";
import {
  MoveAnimation,
  MoveAwayFromAnimation,
  MoveTowardAnimation,
  OrientToUprightAnimation,
  PlaceAnimation,
  ResizeAnimation,
  RollAnimation,
  SetOpacityAnimation,
  SetPaintAnimation,
  StraightenOutJointsAnimation,
  TurnAnimation,
  TurnToFaceAnimation,
} from "../src/animation-implementations.js";
import { SMarker, SProp } from "../src/scene-object-hierarchy.js";

describe("animation-implementations", () => {
  it("moves, turns, and rolls entities with interpolated transforms", () => {
    const entity = new SProp();
    const move = new MoveAnimation(entity, "FORWARD", 4, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);
    const turn = new TurnAnimation(entity, { x: 0, y: 1, z: 0 }, 0.25, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);
    const roll = new RollAnimation(entity, "LEFT", 0.125, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);

    expect(move.update(500).value.z).toBeCloseTo(-2, 5);
    expect(entity.position.z).toBeCloseTo(-2, 5);
    const turned = turn.update(1000).value;
    const rolled = roll.update(1000).value;
    expect(turned.y).not.toBe(0);
    expect(rolled.z).not.toBe(0);
  });

  it("moves toward and away from targets and can place instantly", () => {
    const entity = new SProp();
    const target = new SMarker();
    target.position = { x: 3, y: 0, z: 4 };

    const toward = new MoveTowardAnimation(entity, target, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY, 2.5);
    toward.update(1000);
    expect(entity.position.x).toBeCloseTo(1.5, 5);
    expect(entity.position.z).toBeCloseTo(2, 5);

    const away = new MoveAwayFromAnimation(entity, target, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY, 2.5);
    away.update(1000);
    expect(entity.position.x).toBeCloseTo(0, 5);
    expect(entity.position.z).toBeCloseTo(0, 5);

    const place = new PlaceAnimation(entity, { x: 9, y: 1, z: -2 });
    expect(entity.position).toEqual({ x: 9, y: 1, z: -2 });
    place.reset();
    expect(entity.position.x).toBeCloseTo(0, 10);
    expect(entity.position.y).toBeCloseTo(0, 10);
    expect(entity.position.z).toBeCloseTo(0, 10);
  });

  it("turns to face targets and orients entities upright", () => {
    const entity = new SProp();
    const target = new SMarker();
    target.position = { x: 0, y: 2, z: -5 };

    new TurnToFaceAnimation(entity, target, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY).update(1000);
    const faced = entity.orientation;
    expect(faced.x).not.toBe(0);

    new RollAnimation(entity, "RIGHT", 0.125, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY).update(1000);
    const rolled = entity.orientation;
    new OrientToUprightAnimation(entity, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY).update(1000);
    expect(entity.orientation.z).not.toBe(rolled.z);
  });

  it("straightens joints and animates size, paint, and opacity", () => {
    const entity = new SProp();
    entity.color = "#000000";
    const root = entity.getJoint("ROOT");
    root!.orientation = { x: 0.2, y: 0.3, z: 0.4, w: 0.5 };

    const joints = new StraightenOutJointsAnimation(entity, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);
    joints.update(1000);
    expect(root!.orientation).toEqual({ x: 0, y: 0, z: 0, w: 1 });

    const resize = new ResizeAnimation(entity, { width: 4, height: 5, depth: 6 }, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);
    const repaint = new SetPaintAnimation(entity, "#ffffff", 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);
    const fade = new SetOpacityAnimation(entity, 0.2, 1000, TraditionalStyle.BEGIN_AND_END_ABRUPTLY);

    resize.update(1000);
    repaint.update(500);
    fade.update(1000);

    expect(entity.size).toEqual({ width: 4, height: 5, depth: 6 });
    expect(entity.color).toBe("#808080");
    expect(entity.opacity).toBeCloseTo(0.2, 5);
  });
});
