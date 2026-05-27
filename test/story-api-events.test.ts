import { describe, expect, it } from "vitest";
import {
  CollisionEndListener,
  CollisionStartListener,
  KeyListener,
  MouseClickOnObjectListener,
  OcclusionListener,
  ProximityEnterListener,
  ProximityExitListener,
  SceneActivationListener,
  TransformationListener,
  ViewEnterListener,
  ViewExitListener,
  WhileCollisionListener,
  WhileProximityListener,
} from "../src/story-api-events.js";
import { SCamera, SBox, SScene } from "../src/story-api/index.js";

describe("story-api-events", () => {
  it("listens for scene activation mouse clicks and key presses", () => {
    const scene = new SScene();
    const sceneListener = new SceneActivationListener();
    sceneListener.attach(scene);
    scene.imp.activate();
    scene.imp.deactivate();
    expect(sceneListener.events.map((event) => event.type)).toEqual(["scene-start", "scene-end"]);
    expect(sceneListener.events.map((event) => event.activationCount)).toEqual([1, 1]);

    const hero = new SBox();
    hero.setName("hero");
    const mouseListener = new MouseClickOnObjectListener();
    mouseListener.mouseDown({ x: 0, y: 0, z: 0 }, [hero]);
    const click = mouseListener.mouseUp({ x: 0, y: 0, z: 0 }, 100, [hero]);
    expect(click).toMatchObject({ type: "click", targetName: "hero", distance: 0 });
    expect(click?.target).toBe(hero);

    const keyListener = new KeyListener();
    keyListener.bindShortcut("Ctrl+K", "commandPalette");
    const press = keyListener.keyDown("k", { ctrl: true });
    const release = keyListener.keyUp("k", { ctrl: false });
    expect(press).toEqual({
      type: "key-press",
      key: "k",
      modifiers: { alt: false, ctrl: true, meta: false, shift: false },
      shortcuts: ["commandPalette"],
      pressed: true,
    });
    expect(release.type).toBe("key-release");
    expect(keyListener.isPressed("k")).toBe(false);
  });

  it("detects collision and proximity lifecycle events", () => {
    const left = new SBox();
    const right = new SBox();
    left.setName("left");
    right.setName("right");
    left.position = { x: 0, y: 0, z: 0 };
    right.position = { x: 0.4, y: 0, z: 0 };

    const start = new CollisionStartListener();
    const during = new WhileCollisionListener();
    const end = new CollisionEndListener();
    expect(start.update([left, right])).toHaveLength(1);
    expect(during.update([left, right])).toEqual([
      expect.objectContaining({ type: "while-collision", left, right }),
    ]);
    end.update([left, right]);
    right.position = { x: 5, y: 0, z: 0 };
    expect(end.update([left, right])).toEqual([
      expect.objectContaining({ type: "collision-end", left, right }),
    ]);

    const near = new SBox();
    const far = new SBox();
    near.setName("near");
    far.setName("far");
    near.position = { x: 0, y: 0, z: 0 };
    far.position = { x: 1, y: 0, z: 0 };
    const watch = { source: near, target: far, threshold: 1.5 };

    const enter = new ProximityEnterListener();
    const whileNear = new WhileProximityListener();
    const exit = new ProximityExitListener();
    expect(enter.update([watch])).toEqual([
      expect.objectContaining({ type: "proximity-enter", source: near, target: far, distance: 1 }),
    ]);
    expect(whileNear.update([watch])).toEqual([
      expect.objectContaining({ type: "while-proximity", source: near, target: far, distance: 1 }),
    ]);
    exit.update([watch]);
    far.position = { x: 4, y: 0, z: 0 };
    expect(exit.update([{ ...watch, threshold: 1.5 }])).toEqual([
      expect.objectContaining({ type: "proximity-exit", source: near, target: far, threshold: 1.5 }),
    ]);
  });

  it("tracks occlusion transformation and view enter or exit events", () => {
    const camera = new SCamera();
    camera.position = { x: 0, y: 0, z: 0 };
    camera.orientation = { x: 0, y: 0, z: 0, w: 1 };
    camera.nearClippingPlaneDistance = 0.1;
    camera.farClippingPlaneDistance = 20;
    camera.horizontalViewingAngle = Math.PI / 2;
    camera.verticalViewingAngle = Math.PI / 2;

    const target = new SBox();
    const occluder = new SBox();
    target.setName("target");
    occluder.setName("occluder");
    target.position = { x: 0, y: 0, z: -5 };
    occluder.position = { x: 0, y: 0, z: -2 };
    occluder.size = { width: 2, height: 2, depth: 2 };

    const occlusion = new OcclusionListener();
    expect(occlusion.update(camera, [target], [occluder])).toEqual([
      expect.objectContaining({ type: "occluded", target, occluder }),
    ]);
    occluder.position = { x: 10, y: 0, z: -2 };
    expect(occlusion.update(camera, [target], [occluder])).toEqual([
      expect.objectContaining({ type: "revealed", target, occluder: null }),
    ]);

    const transformation = new TransformationListener();
    transformation.attach(target);
    target.position = { x: 1, y: 2, z: -5 };
    target.orientation = { x: 0, y: 0.70710678, z: 0, w: 0.70710678 };
    target.size = { width: 2, height: 3, depth: 4 };
    expect(transformation.events.map((event) => event.property)).toEqual(["position", "orientation", "size"]);
    transformation.detach(target);
    target.position = { x: 2, y: 2, z: -5 };
    expect(transformation.events).toHaveLength(3);

    const enter = new ViewEnterListener();
    target.position = { x: 10, y: 0, z: -5 };
    expect(enter.update(camera, [target])).toEqual([]);
    target.position = { x: 0, y: 0, z: -5 };
    expect(enter.update(camera, [target])).toEqual([
      expect.objectContaining({ type: "view-enter", target }),
    ]);

    const exit = new ViewExitListener();
    exit.update(camera, [target]);
    target.position = { x: 10, y: 0, z: -5 };
    expect(exit.update(camera, [target])).toEqual([
      expect.objectContaining({ type: "view-exit", target }),
    ]);
  });
});
