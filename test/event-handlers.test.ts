import { describe, expect, it } from "vitest";
import {
  CollisionHandler,
  KeyPressedHandler,
  MouseClickHandler,
  ProximityHandler,
  TimerEventHandler,
  ViewEventHandler,
} from "../src/event-handlers.js";

describe("event-handlers", () => {
  it("detects clicks, double-clicks, drags, and hit targets", () => {
    const handler = new MouseClickHandler(250, 5);
    const targets = [
      {
        id: "button",
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 10, y: 10, z: 1 },
        },
      },
    ];

    handler.mouseDown({ x: 4, y: 4, z: 0 }, targets);
    const click = handler.mouseUp({ x: 4, y: 4, z: 0 }, 100, targets);
    handler.mouseDown({ x: 4, y: 4, z: 0 }, targets);
    const doubleClick = handler.mouseUp({ x: 4, y: 4, z: 0 }, 200, targets);
    handler.mouseDown({ x: 4, y: 4, z: 0 }, targets);
    const drag = handler.mouseUp({ x: 12, y: 4, z: 0 }, 600, targets);

    expect(click).toEqual({ type: "click", targetId: "button", distance: 0 });
    expect(doubleClick).toEqual({ type: "double-click", targetId: "button", distance: 0 });
    expect(drag).toEqual({ type: "drag", targetId: "button", distance: 8 });
  });

  it("tracks pressed keys, modifiers, and shortcut bindings", () => {
    const handler = new KeyPressedHandler();
    handler.bindShortcut("Ctrl+Shift+K", "formatDocument");

    const triggered = handler.keyDown("k", { ctrl: true, shift: true });

    expect(triggered).toEqual(["formatDocument"]);
    expect(handler.isPressed("k")).toBe(true);
    expect(handler.modifiers).toEqual({ alt: false, ctrl: true, meta: false, shift: true });

    handler.keyUp("k", { ctrl: false, shift: false });
    expect(handler.isPressed("k")).toBe(false);
  });

  it("detects AABB and sphere collision pairs", () => {
    const handler = new CollisionHandler();

    expect(handler.getAabbCollisions([
      {
        id: "left",
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
      },
      {
        id: "right",
        bounds: { min: { x: 0.5, y: 0, z: 0 }, max: { x: 2, y: 1, z: 1 } },
      },
      {
        id: "far",
        bounds: { min: { x: 5, y: 5, z: 5 }, max: { x: 6, y: 6, z: 6 } },
      },
    ])).toEqual([{ leftId: "left", rightId: "right" }]);

    expect(handler.getSphereCollisions([
      {
        id: "hero",
        sphere: { center: { x: 0, y: 0, z: 0 }, radius: 1 },
      },
      {
        id: "enemy",
        sphere: { center: { x: 1.5, y: 0, z: 0 }, radius: 1 },
      },
      {
        id: "spectator",
        sphere: { center: { x: 5, y: 0, z: 0 }, radius: 1 },
      },
    ])).toEqual([{ leftId: "hero", rightId: "enemy" }]);
  });

  it("emits proximity enter and exit events exactly once per boundary crossing", () => {
    const handler = new ProximityHandler();
    const hero = { id: "hero", position: { x: 0, y: 0, z: 0 } };

    expect(handler.update(hero, { id: "friend", position: { x: 10, y: 0, z: 0 } }, 3)).toBeNull();
    expect(handler.update(hero, { id: "friend", position: { x: 2, y: 0, z: 0 } }, 3)).toEqual({
      type: "enter",
      sourceId: "hero",
      targetId: "friend",
      distance: 2,
    });
    expect(handler.update(hero, { id: "friend", position: { x: 2, y: 0, z: 0 } }, 3)).toBeNull();
    expect(handler.update(hero, { id: "friend", position: { x: 5, y: 0, z: 0 } }, 3)).toEqual({
      type: "exit",
      sourceId: "hero",
      targetId: "friend",
      distance: 5,
    });
  });

  it("records scene lifecycle, frame, and time events", () => {
    const handler = new ViewEventHandler();

    const start = handler.startScene("demo");
    const [frame, time] = handler.advanceFrame(0.5);
    const end = handler.endScene();

    expect(start).toEqual({ type: "scene-start", sceneName: "demo", timeSeconds: 0, frameIndex: 0 });
    expect(frame).toEqual({ type: "frame", sceneName: "demo", timeSeconds: 0.5, frameIndex: 1 });
    expect(time).toEqual({ type: "time", sceneName: "demo", timeSeconds: 0.5, frameIndex: 1 });
    expect(end).toEqual({ type: "scene-end", sceneName: "demo", timeSeconds: 0.5, frameIndex: 1 });
  });

  it("ticks periodic timers and respects pause or resume", () => {
    const handler = new TimerEventHandler();
    let fired = 0;
    handler.register({ id: "heartbeat", intervalSeconds: 0.5, callback: () => { fired += 1; } });

    expect(handler.tick(0.25)).toBe(0);
    expect(handler.tick(0.25)).toBe(1);
    handler.pause();
    expect(handler.tick(1)).toBe(0);
    handler.resume();
    expect(handler.tick(1)).toBe(2);
    expect(fired).toBe(3);
  });
});
