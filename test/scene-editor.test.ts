import { describe, expect, it } from "vitest";
import { GalleryCatalog } from "../src/gallery.js";
import { SceneEditor } from "../src/scene-editor.js";
import { SBiped, SCamera, SProp } from "../src/story-api/index.js";

describe("SceneEditor", () => {
  it("seeds a default ground plane and camera", () => {
    const editor = new SceneEditor();

    expect(editor.getObject("ground")).toBeTruthy();
    expect(editor.getObject("camera")).toBeInstanceOf(SCamera);
  });

  it("places gallery models into the scene and snaps ground models to the floor", () => {
    const editor = new SceneEditor({ gallery: new GalleryCatalog() });

    const placed = editor.placeFromGallery("people/biped", "hero");

    expect(placed).toBeInstanceOf(SBiped);
    expect(editor.selectedName).toBe("hero");
    expect(editor.getProperty("hero", "position")).toEqual({ x: 0, y: 0.9, z: 0 });
  });

  it("edits scene object properties including model relationships", () => {
    const editor = new SceneEditor({ gallery: new GalleryCatalog() });
    editor.placeFromGallery("props/prop", "platform", { position: { x: 0, y: 0, z: 0 } });
    editor.placeFromGallery("people/biped", "hero", { position: { x: 1, y: 0, z: 0 } });

    editor.setProperty("hero", "color", "RED");
    editor.setProperty("hero", "opacity", 0.5);
    editor.setProperty("hero", "vehicle", "platform");

    expect(editor.getProperty("hero", "color")).toBe("RED");
    expect(editor.getProperty("hero", "opacity")).toBe(0.5);
    expect(editor.getProperty("hero", "vehicle")).toBe("platform");
  });

  it("updates camera state for focus, move, and orbit", () => {
    const editor = new SceneEditor({ gallery: new GalleryCatalog() });
    editor.placeFromGallery("props/prop", "crate", {
      position: { x: 3, y: 0, z: 2 },
      size: { width: 2, height: 4, depth: 2 },
    });

    editor.focusCameraOn("crate", 8);
    editor.moveCamera({ x: 1, y: 0, z: -2 });
    const beforeOrbit = editor.getCameraState().position;
    editor.orbitCamera(Math.PI / 2, 0);
    const afterOrbit = editor.getCameraState();

    expect(afterOrbit.target).toEqual({ x: 3, y: 2, z: 2 });
    expect(beforeOrbit).not.toEqual(afterOrbit.position);
  });

  it("can place custom objects without the gallery", () => {
    const editor = new SceneEditor();
    const object = editor.placeObject("marker", "org.lgna.story.SProp", {
      position: { x: 5, y: 1, z: -2 },
      select: false,
    });

    expect(object).toBeInstanceOf(SProp);
    expect(editor.selectedName).toBeNull();
    expect(editor.getProperty("marker", "position")).toEqual({ x: 5, y: 1, z: -2 });
  });
});
