import { describe, expect, it } from "vitest";
import {
  SCamera,
  SGround,
  SMarker,
  SProp,
  SThing,
  STorus,
  listSceneObjectHierarchyTypes,
} from "../src/scene-object-hierarchy.js";

describe("scene-object-hierarchy", () => {
  it("exposes the expected hierarchy types", () => {
    expect(listSceneObjectHierarchyTypes()).toEqual(expect.arrayContaining([
      "SThing",
      "SModel",
      "SJointedModel",
      "SShape",
      "SGround",
      "SCamera",
      "SMarker",
      "SProp",
    ]));
  });

  it("provides root thing behavior through inherited facade methods", () => {
    const thing = new SThing();
    thing.name = "marker";
    thing.isShowing = false;

    expect(thing.getName()).toBe("marker");
    expect(thing.toString()).toBe("marker");
    expect(thing.isShowing).toBe(false);
  });

  it("supports ground and camera property flows", () => {
    const ground = new SGround();
    const camera = new SCamera();
    ground.opacity = 0.35;
    camera.setFieldOfView(0.75);

    expect(ground.opacity).toBeCloseTo(0.35, 5);
    expect(camera.getFieldOfView()).toBeCloseTo(0.75, 5);
    expect(camera.getHorizontalViewingAngle()).toBeCloseTo(0.75, 5);
  });

  it("supports marker color and prop joint APIs", () => {
    const marker = new SMarker();
    const prop = new SProp();
    marker.colorId = "#00ffcc";

    expect(marker.colorId).toBe("#00ffcc");
    expect(prop.getJoint("ROOT")).toBeDefined();
    expect(prop.getJoint("BODY")).toBeDefined();
  });

  it("inherits shape behavior for torus dimensions", () => {
    const torus = new STorus();
    torus.innerRadius = 0.5;
    torus.outerRadius = 2;

    expect(torus.innerRadius).toBeCloseTo(0.5, 5);
    expect(torus.outerRadius).toBeCloseTo(2, 5);
  });
});
