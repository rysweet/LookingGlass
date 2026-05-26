import { describe, expect, it } from "vitest";
import { BoxImp } from "../src/entity-impls.js";
import {
  DragAdapter,
  HandleManager,
  LinearDragHandle,
  LinearScaleHandle,
  RotationRingHandle,
  SnapGrid,
  describeHandleSet,
} from "../src/interaction-system.js";

describe("interaction-system", () => {
  it("snaps positions, angles, and scales to configured increments", () => {
    const grid = new SnapGrid(0.5, Math.PI / 4, 0.25);

    expect(grid.snapPosition({ x: 1.24, y: 0.26, z: -0.24 })).toEqual({
      x: 1,
      y: 0.5,
      z: 0,
    });
    expect(grid.snapAngle(Math.PI / 5)).toBeCloseTo(Math.PI / 4, 6);
    expect(grid.snapScale({ width: 1.12, height: 0.63, depth: 2.01 })).toEqual({
      width: 1,
      height: 0.75,
      depth: 2,
    });
  });

  it("projects pointer movement into linear translation along an axis", () => {
    const target = new BoxImp("crate");
    const handle = new LinearDragHandle("x", target, new SnapGrid(0.5, Math.PI / 8, 0.25));

    handle.beginDrag({ x: 0, y: 0, z: 0 });
    const distance = handle.drag({ x: 0.74, y: 0.1, z: 0 });

    expect(distance).toBeCloseTo(0.74, 6);
    expect(target.position).toEqual({ x: 0.5, y: 0, z: 0 });
    expect(handle.distanceTravelled).toBeCloseTo(0.74, 6);
  });

  it("scales models along a selected axis", () => {
    const target = new BoxImp("crate");
    target.size = { width: 1, height: 2, depth: 3 };
    const handle = new LinearScaleHandle("z", target, new SnapGrid(0.5, Math.PI / 8, 0.25));

    handle.beginDrag({ x: 0, y: 0, z: 0 });
    handle.drag({ x: 0, y: 0, z: 0.6 });

    expect(target.size).toEqual({ width: 1, height: 2, depth: 3.5 });
  });

  it("rotates targets around an axis with snapping", () => {
    const target = new BoxImp("crate");
    const handle = new RotationRingHandle("y", target, new SnapGrid(0.5, Math.PI / 4, 0.25));

    handle.beginDrag({ x: 0, y: 0, z: 0 });
    const radians = handle.drag({ x: 0.2, y: 0.1, z: 0 });

    expect(radians).toBeCloseTo(Math.PI / 4, 6);
    expect(target.orientation.y).not.toBe(0);
    expect(handle.accumulatedRadians).toBeCloseTo(Math.PI / 4, 6);
  });

  it("maps mouse coordinates into world space and tracks drag lifecycles", () => {
    const target = new BoxImp("crate");
    const handle = new LinearDragHandle("x", target);
    const adapter = new DragAdapter(800, 600, 0.01);

    const start = adapter.startDrag(handle, { x: 400, y: 300 });
    const update = adapter.updateDrag({ x: 460, y: 300 });
    const end = adapter.endDrag();

    expect(start).toEqual({
      started: { x: 0, y: 0, z: 0 },
      current: { x: 0, y: 0, z: 0 },
      delta: { x: 0, y: 0, z: 0 },
    });
    expect(update.current).toEqual({ x: 0.6, y: 0, z: 0 });
    expect(update.delta).toEqual({ x: 0.6, y: 0, z: 0 });
    expect(end?.current).toEqual({ x: 0.6, y: 0, z: 0 });
    expect(target.position.x).toBeCloseTo(0.6, 6);
  });

  it("creates, shows, and hides a full handle set for a selection", () => {
    const manager = new HandleManager(new SnapGrid());
    const target = new BoxImp("crate");

    manager.select(target);
    manager.show();
    const shown = describeHandleSet(manager.handles);
    manager.hide();
    const hidden = describeHandleSet(manager.handles);

    expect(manager.handles).toHaveLength(9);
    expect(shown.every((entry) => entry.endsWith("visible"))).toBe(true);
    expect(hidden.every((entry) => entry.endsWith("hidden"))).toBe(true);
  });
});
