import { describe, expect, it } from "vitest";
import {
  GestureRecognizer,
  InputBinding,
  InputManager,
  KeyboardState,
  MouseState,
  TouchState,
} from "../src/input-system.js";

describe("input-system", () => {
  it("tracks mouse buttons, position, and wheel deltas", () => {
    const mouse = new MouseState().move(100, 200).press(0).scroll(-120).release(0);

    expect(mouse.snapshot()).toEqual({
      position: { x: 100, y: 200 },
      buttons: [],
      wheelDelta: -120,
    });
    expect(mouse.isPressed(0)).toBe(false);
  });

  it("tracks keyboard keys and modifier state", () => {
    const keyboard = new KeyboardState().keyDown("Shift", { shift: true }).keyDown("A", { shift: true });

    expect(keyboard.isPressed("A")).toBe(true);
    expect(keyboard.snapshot().modifiers.shift).toBe(true);
    keyboard.keyUp("A", { shift: false });
    expect(keyboard.isPressed("A")).toBe(false);
  });

  it("tracks touch points and computes centroids", () => {
    const touches = new TouchState()
      .begin({ id: 1, x: 0, y: 0 })
      .begin({ id: 2, x: 10, y: 20 })
      .update({ id: 2, x: 20, y: 30 });

    expect(touches.list()).toEqual([
      { id: 1, x: 0, y: 0 },
      { id: 2, x: 20, y: 30 },
    ]);
    expect(touches.centroid()).toEqual({ x: 10, y: 15 });
    touches.end(1);
    expect(touches.list()).toHaveLength(1);
  });

  it("recognizes pinch, rotate, and swipe gestures", () => {
    const recognizer = new GestureRecognizer();

    expect(recognizer.recognizePinch(
      [{ id: 1, x: 0, y: 0 }, { id: 2, x: 0, y: 10 }],
      [{ id: 1, x: 0, y: 0 }, { id: 2, x: 0, y: 20 }],
    )).toBe(2);
    expect(recognizer.recognizeRotate(
      [{ id: 1, x: 0, y: 0 }, { id: 2, x: 10, y: 0 }],
      [{ id: 1, x: 0, y: 0 }, { id: 2, x: 0, y: 10 }],
    )).toBeCloseTo(Math.PI / 2, 5);
    expect(recognizer.recognizeSwipe({ x: 10, y: 10 }, { x: 90, y: 25 })).toMatchObject({
      type: "swipe",
      direction: "right",
    });
  });

  it("maps mouse, keyboard, and gesture input to actions", () => {
    const manager = new InputManager()
      .bind(InputBinding.mouse("place-object", 0))
      .bind(InputBinding.key("run-world", "R", { ctrl: true }))
      .bind(InputBinding.gesture("zoom-camera", "pinch"));

    expect(manager.dispatch({ type: "mousemove", x: 5, y: 10 })).toEqual([]);
    expect(manager.dispatch({ type: "mousedown", button: 0 })).toEqual(["place-object"]);
    expect(manager.dispatch({ type: "keydown", key: "R", modifiers: { ctrl: true } })).toEqual(["run-world"]);
    expect(manager.dispatch({ type: "gesture", gesture: { type: "pinch", value: 1.5 } })).toEqual(["zoom-camera"]);
    expect(manager.synthesizeSwipe({ x: 50, y: 12 })).toMatchObject({ direction: "right" });
  });
});
