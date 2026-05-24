import { describe, expect, it } from "vitest";
import {
  MoveDirection,
  RollDirection,
  Scene,
  SBiped,
  SCamera,
  SFlyer,
  SJoint,
  SProp,
  SQuadruped,
  SScene,
  STurnable,
  TurnDirection,
} from "../src/story-api";

describe("faithful story-api entity facades", () => {
  it("SThing supports Java-style name methods alongside property access", () => {
    const biped = new SBiped("Alice");
    expect(biped.getName()).toBe("Alice");

    biped.setName("Hero");
    expect(biped.name).toBe("Hero");
  });

  it("SBiped.move changes position using MoveDirection constants", () => {
    const biped = new SBiped("Alice");
    const before = biped.getPosition();

    biped.move(MoveDirection.FORWARD, 2.0);

    const after = biped.getPosition();
    expect(after.z).not.toBe(before.z);
    expect(after.z).toBeLessThan(before.z);
  });

  it("STurnable.turn and roll use Java-style revolutions", () => {
    const thing = new STurnable("Box");

    thing.turn(TurnDirection.LEFT, 0.25);
    const afterTurn = thing.getOrientation();
    thing.roll(RollDirection.RIGHT, 0.125);
    const afterRoll = thing.getOrientation();

    expect(afterTurn.y).toBeCloseTo(Math.sin(Math.PI / 4), 5);
    expect(afterRoll.z).not.toBe(afterTurn.z);
  });

  it("SMovableTurnable moveToward and moveAwayFrom follow target position", () => {
    const flyer = new SFlyer();
    const target = new SProp();
    target.position = { x: 0, y: 0, z: -10 };

    flyer.moveToward(target, 2);
    const towardZ = flyer.position.z;
    flyer.moveAwayFrom(target, 1);

    expect(towardZ).toBeLessThan(0);
    expect(flyer.position.z).toBeGreaterThan(towardZ);
  });

  it("SJointedModel exposes faithful joint entities and convenience getters", () => {
    const biped = new SBiped();
    const flyer = new SFlyer();
    const quadruped = new SQuadruped();

    expect(biped.getJoint("LEFT_SHOULDER")).toBeInstanceOf(SJoint);
    expect(biped.getLeftShoulder()).toMatchObject({ name: "LEFT_SHOULDER", parent: "LEFT_CLAVICLE" });
    expect(biped.getRightHip()).toMatchObject({ name: "RIGHT_HIP", parent: "PELVIS_LOWER_BODY" });
    expect(flyer.getLeftWingShoulder()).toMatchObject({ name: "LEFT_WING_SHOULDER", parent: "SPINE_UPPER" });
    expect(quadruped.getFrontLeftClavicle()).toMatchObject({ name: "FRONT_LEFT_CLAVICLE", parent: "SPINE_UPPER" });
  });

  it("SCamera supports point-of-view movement and field-of-view setters", () => {
    const camera = new SCamera();
    const marker = new SProp();
    marker.position = { x: 3, y: 2, z: -4 };
    marker.orientation = { x: 0, y: 0.7071068, z: 0, w: 0.7071068 };

    camera.moveToPointOfView(marker);
    camera.setFieldOfView(0.5);

    expect(camera.position).toEqual(marker.position);
    expect(camera.orientation).toEqual(marker.orientation);
    expect(camera.getFieldOfView()).toBe(0.5);
  });

  it("SScene and Scene expose Java-style scene facade methods", () => {
    const sceneEntity = new SScene("World");
    sceneEntity.setAtmosphereColor("SKY_BLUE");
    sceneEntity.setFogDensity(0.25);

    const scene = new Scene();
    const hero = new SBiped("Hero");
    scene.setAtmosphereColor("SKY_BLUE");
    scene.setFogDensity(0.25);
    scene.addEntity("hero", hero);

    expect(sceneEntity.getAtmosphereColor()).toBe("SKY_BLUE");
    expect(sceneEntity.getFogDensity()).toBe(0.25);
    expect(scene.getAtmosphereColor()).toBe("SKY_BLUE");
    expect(scene.getFogDensity()).toBe(0.25);
    expect(scene.getEntity("hero")).toBe(hero);
  });
});
