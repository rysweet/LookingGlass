import { describe, expect, it } from "vitest";

import {
  Property,
  PropertyOwnerImp,
  SBiped,
  SBox,
  SProgram,
  SProp,
  Scene,
  applySceneEnvironment,
  boundingBoxSize,
  createOrientation,
  createPosition,
  createSize,
  describeSpeechBubble,
  getEntityBoundingBox,
  getSceneLifecycleState,
  getSpeechBubbleSummary,
  hasJoint,
  isBindingSyncDirection,
  listJointNames,
  requireSceneEntity,
  snapshotScene,
  summarizePropertyChanges,
} from "../src/story-api";

describe("story-api wrapper helpers", () => {
  it("builds default math value objects and derives bounding-box size", () => {
    expect(createPosition()).toEqual({ x: 0, y: 0, z: 0 });
    expect(createOrientation()).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    expect(createSize()).toEqual({ width: 1, height: 1, depth: 1 });

    const box = new SBox();
    box.position = createPosition(1, 2, 3);
    box.setSize(createSize(4, 6, 8));

    expect(boundingBoxSize(getEntityBoundingBox(box)!)).toEqual(
      createSize(4, 6, 8),
    );
  });

  it("surfaces speech-bubble summaries for models", () => {
    const prop = new SProp();
    prop.say("Hello there", 2);

    expect(describeSpeechBubble(prop.speechBubble)).toBe("say:Hello there");
    expect(getSpeechBubbleSummary(prop)).toBe("say:Hello there");
  });

  it("lists joints and resolves membership for jointed models", () => {
    const prop = new SProp();

    expect(listJointNames(prop)).toContain("ROOT");
    expect(hasJoint(prop, "ROOT")).toBe(true);
    expect(hasJoint(prop, "missingJoint")).toBe(false);
  });

  it("applies environment options and snapshots scene state", () => {
    const scene = new Scene();
    scene.addEntity("bunny", new SBiped());

    applySceneEnvironment(scene, {
      atmosphereColor: "#123456",
      fogDensity: 0.25,
      ambientLightColor: "#abcdef",
      fromAboveLightColor: "#fedcba",
      fromBelowLightColor: "#654321",
    });

    expect(snapshotScene(scene)).toEqual({
      entityNames: ["bunny"],
      isActive: false,
      atmosphereColor: "#123456",
      fogDensity: 0.25,
      ambientLightColor: "#abcdef",
      fromAboveLightColor: "#fedcba",
      fromBelowLightColor: "#654321",
    });
  });

  it("requires named entities and enforces expected types", () => {
    const scene = new Scene();
    const bunny = new SBiped();
    scene.addEntity("bunny", bunny);

    expect(requireSceneEntity(scene, "bunny", SBiped)).toBe(bunny);
    expect(() => requireSceneEntity(scene, "ghost")).toThrow(/ghost/);
    expect(() => requireSceneEntity(scene, "bunny", SProp)).toThrow(/SProp/);
  });

  it("summarizes property change history and scene lifecycle helpers", () => {
    class TestOwner extends PropertyOwnerImp {}

    const property = new Property(new TestOwner(), "score", 1);
    const changes: Array<Parameters<Parameters<typeof property.addListener>[0]>[0]> = [];
    property.addListener((change) => changes.push(change));
    property.value = 2;
    property.value = 5;

    expect(summarizePropertyChanges(changes)).toEqual({
      count: 2,
      initialValue: 1,
      currentValue: 5,
      values: [2, 5],
      previousValues: [1, 2],
    });
    expect(isBindingSyncDirection("self")).toBe(true);
    expect(isBindingSyncDirection("sideways")).toBe(false);

    const program = new SProgram();
    const scene = new Scene();
    expect(getSceneLifecycleState(scene)).toEqual({
      isActive: false,
      hasProgram: false,
    });
    program.setActiveScene(scene);
    expect(getSceneLifecycleState(scene)).toEqual({
      isActive: true,
      hasProgram: true,
    });
  });
});
