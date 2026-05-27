import { describe, expect, it } from "vitest";
import { SProp, SScene, STextModel } from "../src/story-api";
import { ObjectPropertyEditor } from "../src/object-properties.js";

describe("object-properties", () => {
  it("edits transform color and opacity properties", () => {
    const prop = new SProp();
    const editor = new ObjectPropertyEditor(prop);

    editor.transform.setPositionAxis("x", 5);
    editor.transform.setPositionAxis("y", 2);
    editor.transform.setRotationAxis("y", 0.5);
    editor.transform.setScaleAxis("height", 3);
    editor.color.setPaint("RED");
    editor.opacity.setOpacity(0.5);

    expect(prop.position).toEqual({ x: 5, y: 2, z: 0 });
    expect(prop.orientation.y).toBe(0.5);
    expect(prop.size.height).toBe(3);
    expect(prop.paint).toBe("RED");
    expect(prop.opacity).toBe(0.5);
    expect(editor.snapshot()).toMatchObject({ paint: "RED", opacity: 0.5 });
  });

  it("supports scene ambient colors and text editing previews", () => {
    const scene = new SScene();
    const sceneEditor = new ObjectPropertyEditor(scene);
    sceneEditor.color.setAmbient("SKY_BLUE");

    const text = new STextModel();
    const textEditor = new ObjectPropertyEditor(text);
    textEditor.text.setValue("Hello");
    textEditor.text.insert(5, " world");
    textEditor.text.previewSpeech("think", "Idea", 0.25);

    expect(scene.ambientLightColor).toBe("SKY_BLUE");
    expect(text.value).toBe("Hello world");
    expect(text.lastThoughtText).toBe("Idea");
    expect(textEditor.text.snapshot()).toEqual({
      value: "Hello world",
      spoken: null,
      thought: "Idea",
    });
  });

  it("updates vehicle relationships through the resolver", () => {
    const platform = new SProp();
    platform.setName("platform");
    const hero = new SProp();
    const editor = new ObjectPropertyEditor(hero, (name) => (name === "platform" ? platform : null));

    editor.vehicle.setVehicle("platform");
    expect(hero.vehicle).toBe(platform);
    editor.vehicle.clear();
    expect(hero.vehicle).toBeNull();
  });
});
