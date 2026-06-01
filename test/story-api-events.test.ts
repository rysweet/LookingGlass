import { describe, expect, it } from "vitest";
import {
  ArrowKeyPressListener,
  CollisionEndListener,
  CollisionStartListener,
  KeyListener,
  MouseClickOnObjectListener,
  MouseClickOnScreenListener,
  NumberKeyPressListener,
  OcclusionListener,
  PointOfViewChangeListener,
  ProximityEnterListener,
  ProximityExitListener,
  SceneActivationListener,
  TimeListener,
  TransformationListener,
  ViewEnterListener,
  ViewExitListener,
  WhileCollisionListener,
  WhileProximityListener,
  type ArrowKeyEvent,
  type MoveDirection,
  type MouseClickOnScreenEvent,
  type NumberKeyEvent,
  type PointOfViewChangeEvent,
  type TimeEvent,
} from "../src/story-api-events.js";
import { ViewEventHandler } from "../src/event-handlers.js";
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

  it("emits time events with elapsed and delta seconds via TimeListener", () => {
    const viewHandler = new ViewEventHandler();
    const collected: TimeEvent[] = [];
    const listener = new TimeListener((event) => {
      collected.push(event);
    });

    viewHandler.startScene("testScene");

    // First frame: 16ms
    listener.feed(viewHandler.advanceFrame(0.016));
    expect(listener.events).toHaveLength(1);
    expect(listener.events[0].type).toBe("time");
    expect(listener.events[0].deltaSeconds).toBeCloseTo(0.016, 6);
    expect(listener.events[0].elapsedSeconds).toBeCloseTo(0.016, 6);
    expect(listener.events[0].frameIndex).toBe(1);

    // Second frame: another 16ms
    listener.feed(viewHandler.advanceFrame(0.016));
    expect(listener.events).toHaveLength(2);
    expect(listener.events[1].deltaSeconds).toBeCloseTo(0.016, 6);
    expect(listener.events[1].elapsedSeconds).toBeCloseTo(0.032, 6);
    expect(listener.events[1].frameIndex).toBe(2);

    // Callback was invoked for each event
    expect(collected).toHaveLength(2);
    expect(collected[0].deltaSeconds).toBeCloseTo(0.016, 6);

    // Non-time events in the array are ignored (advanceFrame returns [frame, time])
    // Only "time" type ViewEvents should produce TimeEvents
  });

  it("fires screen click events without entity targeting via MouseClickOnScreenListener", () => {
    const collected: MouseClickOnScreenEvent[] = [];
    const listener = new MouseClickOnScreenListener((event) => {
      collected.push(event);
    });

    // Click at screen coordinates
    listener.mouseDown({ x: 100, y: 200, z: 0 });
    const event = listener.mouseUp({ x: 100, y: 200, z: 0 }, Date.now());

    expect(event).not.toBeNull();
    expect(event!.type).toBe("click");
    expect(event!.screenX).toBe(100);
    expect(event!.screenY).toBe(200);
    expect(event!.point).toEqual({ x: 100, y: 200, z: 0 });
    expect(listener.events).toHaveLength(1);
    expect(collected).toHaveLength(1);

    // Second click at different position
    listener.mouseDown({ x: 50, y: 75, z: 0 });
    const event2 = listener.mouseUp({ x: 50, y: 75, z: 0 }, Date.now());
    expect(event2!.screenX).toBe(50);
    expect(event2!.screenY).toBe(75);
    expect(listener.events).toHaveLength(2);
  });

  it("filters only arrow keys and maps to MoveDirection via ArrowKeyPressListener", () => {
    const collected: ArrowKeyEvent[] = [];
    const listener = new ArrowKeyPressListener((event) => {
      collected.push(event);
    });

    // Arrow keys should produce events
    const up = listener.keyDown("ArrowUp");
    expect(up).not.toBeNull();
    expect(up!.type).toBe("key-press");
    expect(up!.key).toBe("ArrowUp");
    expect(up!.direction).toBe("FORWARD" as MoveDirection);

    const down = listener.keyDown("ArrowDown");
    expect(down!.direction).toBe("BACKWARD" as MoveDirection);

    const left = listener.keyDown("ArrowLeft");
    expect(left!.direction).toBe("LEFT" as MoveDirection);

    const right = listener.keyDown("ArrowRight");
    expect(right!.direction).toBe("RIGHT" as MoveDirection);

    // Non-arrow keys should return null and not be pushed to events
    const letterA = listener.keyDown("a");
    expect(letterA).toBeNull();

    const space = listener.keyDown("Space");
    expect(space).toBeNull();

    const enter = listener.keyDown("Enter");
    expect(enter).toBeNull();

    // Only 4 arrow key events in the events array
    expect(listener.events).toHaveLength(4);
    expect(collected).toHaveLength(4);

    // Modifiers are preserved
    const upWithShift = listener.keyDown("ArrowUp", { shift: true });
    expect(upWithShift!.modifiers.shift).toBe(true);
  });

  it("filters only digit keys 0-9 and parses number via NumberKeyPressListener", () => {
    const collected: NumberKeyEvent[] = [];
    const listener = new NumberKeyPressListener((event) => {
      collected.push(event);
    });

    // Digit keys should produce events
    const five = listener.keyDown("5");
    expect(five).not.toBeNull();
    expect(five!.type).toBe("key-press");
    expect(five!.key).toBe("5");
    expect(five!.number).toBe(5);

    const zero = listener.keyDown("0");
    expect(zero!.number).toBe(0);

    const nine = listener.keyDown("9");
    expect(nine!.number).toBe(9);

    // Non-digit keys should return null
    expect(listener.keyDown("a")).toBeNull();
    expect(listener.keyDown("Enter")).toBeNull();
    expect(listener.keyDown("ArrowUp")).toBeNull();
    expect(listener.keyDown("Numpad1")).toBeNull();

    // Only 3 digit events
    expect(listener.events).toHaveLength(3);
    expect(collected).toHaveLength(3);
    expect(listener.events.map((e) => e.number)).toEqual([5, 0, 9]);
  });

  it("detects camera point-of-view changes via PointOfViewChangeListener", () => {
    const camera = new SCamera();
    camera.position = { x: 0, y: 0, z: 0 };
    camera.orientation = { x: 0, y: 0, z: 0, w: 1 };
    camera.setFieldOfView(Math.PI / 4);

    const collected: PointOfViewChangeEvent[] = [];
    const listener = new PointOfViewChangeListener(camera, (event) => {
      collected.push(event);
    });

    // No change — check should not fire
    listener.check();
    expect(listener.events).toHaveLength(0);

    // Move camera position
    camera.position = { x: 5, y: 0, z: 0 };
    listener.check();
    expect(listener.events).toHaveLength(1);
    expect(listener.events[0].type).toBe("pov-change");
    expect(listener.events[0].camera).toBe(camera);
    expect(listener.events[0].previous.position.x).toBe(0);
    expect(listener.events[0].current.position.x).toBe(5);

    // Change field of view
    camera.setFieldOfView(1.2);
    listener.check();
    expect(listener.events).toHaveLength(2);

    // No change — check again should not fire
    listener.check();
    expect(listener.events).toHaveLength(2);

    // Change orientation
    camera.orientation = { x: 0, y: 0.707, z: 0, w: 0.707 };
    listener.check();
    expect(listener.events).toHaveLength(3);

    // Callback was invoked for each change
    expect(collected).toHaveLength(3);
  });
});
