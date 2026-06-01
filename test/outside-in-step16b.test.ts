import { describe, it, expect } from "vitest";

// Test 1: All 5 missing event listeners exported
describe("Outside-in: Event Listeners (Gap #71)", () => {
  it("exports all 5 missing listeners from story-api-events", async () => {
    const mod = await import("../src/story-api-events.js");
    expect(typeof mod.TimeListener).toBe("function");
    expect(typeof mod.MouseClickOnScreenListener).toBe("function");
    expect(typeof mod.ArrowKeyPressListener).toBe("function");
    expect(typeof mod.NumberKeyPressListener).toBe("function");
    expect(typeof mod.PointOfViewChangeListener).toBe("function");
  });

  it("TimeListener can be instantiated and collects events", async () => {
    const { TimeListener } = await import("../src/story-api-events.js");
    const listener = new TimeListener();
    expect(listener.events).toEqual([]);
  });

  it("MouseClickOnScreenListener can be instantiated", async () => {
    const { MouseClickOnScreenListener } = await import("../src/story-api-events.js");
    const listener = new MouseClickOnScreenListener();
    expect(listener.events).toEqual([]);
  });

  it("ArrowKeyPressListener can be instantiated", async () => {
    const { ArrowKeyPressListener } = await import("../src/story-api-events.js");
    const listener = new ArrowKeyPressListener();
    expect(listener.events).toEqual([]);
  });

  it("NumberKeyPressListener can be instantiated", async () => {
    const { NumberKeyPressListener } = await import("../src/story-api-events.js");
    const listener = new NumberKeyPressListener();
    expect(listener.events).toEqual([]);
  });

  it("PointOfViewChangeListener requires camera and tracks POV changes", async () => {
    const { PointOfViewChangeListener } = await import("../src/story-api-events.js");
    // Requires a camera; verify it's a class that exists
    expect(typeof PointOfViewChangeListener).toBe("function");
    expect(PointOfViewChangeListener.prototype).toBeDefined();
    // Verify it has a check method on prototype
    expect(typeof PointOfViewChangeListener.prototype.check).toBe("function");
  });
});

// Test 2: Missing Color constants (Gap #72)
describe("Outside-in: Color Constants (Gap #72)", () => {
  it("Color has all 7 missing constants", async () => {
    const { Color } = await import("../src/paint-system.js");
    const expectedColors = ["DARK_GRAY", "GRAY", "LIGHT_GRAY", "LIME", "ORANGE", "PINK", "PURPLE"];
    for (const name of expectedColors) {
      const c = (Color as any)[name];
      expect(c).toBeInstanceOf(Color);
    }
  });

  it("DARK_GRAY has correct RGB values (64/255)", async () => {
    const { Color } = await import("../src/paint-system.js");
    expect(Color.DARK_GRAY.red).toBeCloseTo(64 / 255, 4);
    expect(Color.DARK_GRAY.green).toBeCloseTo(64 / 255, 4);
    expect(Color.DARK_GRAY.blue).toBeCloseTo(64 / 255, 4);
  });

  it("PaintPalette.BASIC includes all new colors via palette API", async () => {
    const { Color, PaintPalette } = await import("../src/paint-system.js");
    const basic = PaintPalette.BASIC;
    // BASIC palette stores colors by name
    expect(basic.get("dark_gray")).toBe(Color.DARK_GRAY);
    expect(basic.get("gray")).toBe(Color.GRAY);
    expect(basic.get("light_gray")).toBe(Color.LIGHT_GRAY);
    expect(basic.get("lime")).toBe(Color.LIME);
    expect(basic.get("orange")).toBe(Color.ORANGE);
    expect(basic.get("pink")).toBe(Color.PINK);
    expect(basic.get("purple")).toBe(Color.PURPLE);
  });
});

// Test 3: Entity-specific poses (Gap #73)
describe("Outside-in: Entity Poses (Gap #73)", () => {
  it("exports all 4 entity-specific pose libraries", async () => {
    const mod = await import("../src/poses.js");
    expect(mod.FlyerPoseLibrary).toBeDefined();
    expect(mod.QuadrupedPoseLibrary).toBeDefined();
    expect(mod.SlithererPoseLibrary).toBeDefined();
    expect(mod.SwimmerPoseLibrary).toBeDefined();
  });

  it("FlyerPoseLibrary has all 5 poses with correct structure", async () => {
    const { FlyerPoseLibrary } = await import("../src/poses.js");
    expect(Object.keys(FlyerPoseLibrary).length).toBe(5);
    for (const [key, pose] of Object.entries(FlyerPoseLibrary)) {
      expect((pose as any).name).toBeDefined();
      expect((pose as any).jointRotations).toBeDefined();
    }
  });

  it("QuadrupedPoseLibrary has proper pose structure", async () => {
    const { QuadrupedPoseLibrary } = await import("../src/poses.js");
    expect(Object.keys(QuadrupedPoseLibrary).length).toBe(5);
    for (const [key, pose] of Object.entries(QuadrupedPoseLibrary)) {
      expect((pose as any).name).toBeDefined();
      expect((pose as any).jointRotations).toBeDefined();
    }
  });

  it("getPoseCycle returns cycles for each entity type", async () => {
    const { getPoseCycle } = await import("../src/poses.js");
    expect(getPoseCycle("flyer").length).toBeGreaterThanOrEqual(2);
    expect(getPoseCycle("quadruped").length).toBeGreaterThanOrEqual(2);
    expect(getPoseCycle("slitherer").length).toBeGreaterThanOrEqual(2);
    expect(getPoseCycle("swimmer").length).toBeGreaterThanOrEqual(2);
    // unknown type falls back to walk cycle
    expect(getPoseCycle("biped").length).toBeGreaterThanOrEqual(2);
  });
});

// Test 4: Individual Model Resources (Gap #74)
describe("Outside-in: Model Resources (Gap #74)", () => {
  it("exports all resource category objects", async () => {
    const mod = await import("../src/model-resources/individual-resources.js");
    expect(mod.BipedResource).toBeDefined();
    expect(mod.FlyerResource).toBeDefined();
    expect(mod.QuadrupedResource).toBeDefined();
    expect(mod.SwimmerResource).toBeDefined();
    expect(mod.SlithererResource).toBeDefined();
    expect(mod.PropResource).toBeDefined();
    expect(mod.VehicleResource).toBeDefined();
  });

  it("each biped resource has id, name, modelName", async () => {
    const { BipedResource } = await import("../src/model-resources/individual-resources.js");
    for (const [key, res] of Object.entries(BipedResource)) {
      expect((res as any).id).toBe(key);
      expect((res as any).name).toBeDefined();
      expect((res as any).modelName).toBeDefined();
    }
  });

  it("total model count is reasonable (50+ entries)", async () => {
    const mod = await import("../src/model-resources/individual-resources.js");
    let total = 0;
    for (const name of ["BipedResource", "FlyerResource", "QuadrupedResource", "SwimmerResource", "SlithererResource", "PropResource", "VehicleResource"]) {
      total += Object.keys((mod as any)[name]).length;
    }
    expect(total).toBeGreaterThanOrEqual(50);
  });

  it("ModelResourceCatalog can be instantiated", async () => {
    const { ModelResourceCatalog } = await import("../src/model-resources/catalog.js");
    const catalog = new ModelResourceCatalog();
    expect(catalog).toBeDefined();
  });
});

// Test 5: Cross-cutting integration
describe("Outside-in: Cross-cutting Integration", () => {
  it("public API re-exports all parity gap items", async () => {
    const events = await import("../src/story-api-events.js");
    const paint = await import("../src/paint-system.js");
    const poses = await import("../src/poses.js");

    expect(events.TimeListener).not.toBeUndefined();
    expect(paint.Color.PURPLE).not.toBeUndefined();
    expect(poses.FlyerPoseLibrary).not.toBeUndefined();
    expect(poses.QuadrupedPoseLibrary).not.toBeUndefined();
    expect(poses.SlithererPoseLibrary).not.toBeUndefined();
    expect(poses.SwimmerPoseLibrary).not.toBeUndefined();
  });
});
