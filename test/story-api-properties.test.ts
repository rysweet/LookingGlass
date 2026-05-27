import { describe, expect, it } from "vitest";
import {
  BooleanProperty,
  OpacityProperty,
  OrientationProperty,
  PaintProperty,
  PositionProperty,
  SizeProperty,
  TextProperty,
  VehicleProperty,
  createColorPaint,
  createTextValue,
  createTexturePaint,
} from "../src/story-api-properties";

describe("story-api-properties", () => {
  it("interpolates color paints and texture paints", () => {
    const property = new PaintProperty("paint", createColorPaint("#000000"));

    expect(property.sample(createColorPaint("#ffffff"), 0.5)).toEqual(createColorPaint("#808080"));
    expect(property.sample(createTexturePaint("brick", 1), 0.25)).toEqual(createTexturePaint("brick", 0.25));
  });

  it("supports vector arithmetic for position properties", () => {
    const property = new PositionProperty("position", { x: 1, y: 2, z: 3 });

    property.translate({ x: 2, y: -1, z: 4 });
    expect(property.value).toEqual({ x: 3, y: 1, z: 7 });
    expect(property.distanceTo({ x: 6, y: 5, z: 7 })).toBeCloseTo(5, 6);
    expect(property.sample({ x: 5, y: 3, z: 9 }, 0.5)).toEqual({ x: 4, y: 2, z: 8 });
  });

  it("normalizes quaternions and spherical-interpolates orientations", () => {
    const property = new OrientationProperty("orientation", { x: 0, y: 0, z: 0, w: 2 });
    const halfway = property.sample({ x: 0, y: 0, z: 1, w: 0 }, 0.5);

    expect(property.value).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    expect(halfway.x).toBe(0);
    expect(halfway.y).toBe(0);
    expect(halfway.z).toBeCloseTo(Math.SQRT1_2, 10);
    expect(halfway.w).toBeCloseTo(Math.SQRT1_2, 10);
  });

  it("scales size properties proportionally", () => {
    const property = new SizeProperty("size", { width: 2, height: 3, depth: 4 });

    property.scaleProportionally(1.5);

    expect(property.value).toEqual({ width: 3, height: 4.5, depth: 6 });
    expect(property.sample({ width: 5, height: 6, depth: 7 }, 0.5)).toEqual({ width: 4, height: 5.25, depth: 6.5 });
  });

  it("clamps opacity between zero and one", () => {
    const property = new OpacityProperty("opacity", 2);

    expect(property.value).toBe(1);
    property.fadeBy(-1.4);
    expect(property.value).toBe(0);
    property.setValue(0.35);
    expect(property.value).toBe(0.35);
  });

  it("interpolates text style while deferring text replacement until completion", () => {
    const property = new TextProperty("speech", createTextValue("hello", "Arial", 12, "#000000"));

    expect(property.sample(createTextValue("goodbye", "Verdana", 20, "#ffffff"), 0.5)).toEqual({
      text: "hello",
      fontFamily: "Arial",
      fontSize: 16,
      color: "#808080",
    });

    property.setText("updated");
    property.setStyle({ fontFamily: "Verdana", fontSize: 24, color: "#ff0000" });
    expect(property.value).toEqual(createTextValue("updated", "Verdana", 24, "#ff0000"));
  });

  it("toggles boolean properties for visibility-style flags", () => {
    const property = new BooleanProperty("isShowing", true);

    expect(property.toggle()).toBe(false);
    expect(property.toggle()).toBe(true);
  });

  it("tracks and clears vehicle references", () => {
    const property = new VehicleProperty("vehicle");
    const vehicle = { id: "parent-1", name: "cameraRig", typeName: "SCamera" };

    property.attach(vehicle);
    expect(property.value).toEqual(vehicle);
    property.detach();
    expect(property.value).toBeNull();
  });
});
