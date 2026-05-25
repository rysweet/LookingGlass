import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT_CAMERA_Y_OFFSET,
  DEFAULT_LAYOUT_CAMERA_Z_OFFSET,
  DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO,
  arrangeSceneEditorCameras,
  clampCameraValue,
  clampPictureValue,
  createObjectOutline,
  createSceneEditorLayout,
  createViewingPerspective,
  resetLayoutSceneView,
} from "../src/scene-layout.js";
import { createBoundingBox, createPosition } from "../src/story-api/types.js";
import type { Position } from "../src/story-api/types.js";

function expectPositionClose(actual: Position, expected: Position): void {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.z).toBeCloseTo(expected.z);
}

describe("scene-layout", () => {
  const bounds = createBoundingBox(createPosition(-1, 0, -2), createPosition(3, 4, 2));

  it("clamps camera and picture plane values to the Java tracker limits", () => {
    expect(clampCameraValue(-5)).toBe(2);
    expect(clampCameraValue(40)).toBe(40);
    expect(clampCameraValue(400)).toBe(100);
    expect(clampPictureValue(0.5)).toBe(1.5);
    expect(clampPictureValue(12)).toBe(12);
    expect(clampPictureValue(120)).toBe(100);
  });

  it("arranges orthographic cameras around the selected bounds using Alice multipliers", () => {
    const cameras = arrangeSceneEditorCameras(bounds, createPosition(1, 12, 20));

    expectPositionClose(cameras.TOP.position, createPosition(1, 42, 0));
    expect(cameras.TOP.picturePlaneHeight).toBeCloseTo(DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO * 4);
    expectPositionClose(cameras.SIDE.position, createPosition(41, 2, 0));
    expect(cameras.SIDE.picturePlaneHeight).toBeCloseTo(DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO * 4);
    expectPositionClose(cameras.FRONT.position, createPosition(1, 2, -40));
    expect(cameras.FRONT.picturePlaneHeight).toBeCloseTo(DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO * 4);
  });

  it("falls back to the default layout direction when the active camera is already at the adjusted target", () => {
    const layout = createViewingPerspective(bounds, createPosition(1, 6, 0));
    const diagonal = Math.sqrt(4 ** 2 + 4 ** 2 + 4 ** 2);
    const fallbackMagnitude = Math.sqrt(DEFAULT_LAYOUT_CAMERA_Y_OFFSET ** 2 + DEFAULT_LAYOUT_CAMERA_Z_OFFSET ** 2);
    const scale = (diagonal * 1.5) / fallbackMagnitude;

    expectPositionClose(layout.target, createPosition(1, 2, 0));
    expectPositionClose(
      layout.position,
      createPosition(1, 6 + DEFAULT_LAYOUT_CAMERA_Y_OFFSET * scale, DEFAULT_LAYOUT_CAMERA_Z_OFFSET * scale),
    );
  });

  it("resets the layout camera above and behind the starting view", () => {
    const layout = resetLayoutSceneView({
      position: createPosition(5, 1, -3),
      target: createPosition(5, 1, -13),
    });

    expectPositionClose(layout.position, createPosition(5, 13, 7));
    expectPositionClose(layout.target, createPosition(5, 1, -13));
  });

  it("builds outlines and handles just outside the selected bounds", () => {
    const outline = createObjectOutline(bounds);
    const layout = createSceneEditorLayout(bounds, createPosition(1, 12, 20));
    const xHandle = layout.handles.find((handle) => handle.axis === "x");
    const yHandle = layout.handles.find((handle) => handle.axis === "y");
    const zHandle = layout.handles.find((handle) => handle.axis === "z");

    expect(outline.corners).toHaveLength(8);
    expect(outline.edges).toHaveLength(12);
    expect(outline.bounds.min.x).toBeLessThan(-1);
    expect(outline.bounds.max.z).toBeGreaterThan(2);
    expect(xHandle?.position.x ?? 0).toBeGreaterThan(layout.outline.bounds.max.x);
    expect(yHandle?.position.y ?? 0).toBeGreaterThan(layout.outline.bounds.max.y);
    expect(zHandle?.position.z ?? 0).toBeGreaterThan(layout.outline.bounds.max.z);
  });
});
