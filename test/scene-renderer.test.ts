import { describe, expect, it } from "vitest";
import { renderSceneToPng } from "../src/scene-renderer.js";
import type { AliceProject } from "../src/a3p-parser.js";

function createProject(): AliceProject {
  return {
    version: "3.10.0.0",
    projectName: "Render Test",
    sceneObjects: [
      {
        name: "ground",
        typeName: "org.lgna.story.SGround",
        resourceType: null,
        position: { x: 0, y: 0, z: 0 },
        orientation: null,
        size: { width: 10, height: 1, depth: 10 },
      },
      {
        name: "camera",
        typeName: "org.lgna.story.SCamera",
        resourceType: null,
        position: { x: 0, y: 3, z: 8 },
        orientation: null,
        size: { width: 1, height: 1, depth: 1 },
      },
      {
        name: "tree",
        typeName: "org.lgna.story.SProp",
        resourceType: "org.lgna.story.resources.prop.TreeResource",
        position: { x: 1, y: 0, z: -2 },
        orientation: null,
        size: { width: 1.5, height: 3, depth: 1.25 },
      },
      {
        name: "hero",
        typeName: "org.lgna.story.SBiped",
        resourceType: null,
        position: { x: -1, y: 0, z: 2 },
        orientation: null,
        size: { width: 1, height: 2, depth: 1 },
      },
    ],
    methods: [{ name: "myFirstMethod", isFunction: false, returnType: "void", parameters: [], statements: [] }],
  };
}

describe("renderSceneToPng", () => {
  it("renders a PNG and excludes ground/camera from counted scene objects", async () => {
    const result = await renderSceneToPng(createProject(), { width: 320, height: 200 });

    expect(result.objectCount).toBe(2);
    expect(result.sceneDescription).toContain("tree(SProp)");
    expect(result.sceneDescription).toContain("hero(SBiped)");
    expect(result.sceneDescription).not.toContain("ground");
    expect(result.sceneDescription).not.toContain("camera");
    expect(result.png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  it("describes empty scenes when only infrastructure objects are present", async () => {
    const project = createProject();
    project.sceneObjects = project.sceneObjects.filter((object) => object.typeName.includes("SGround") || object.typeName.includes("SCamera"));

    const result = await renderSceneToPng(project);

    expect(result.objectCount).toBe(0);
    expect(result.sceneDescription).toBe("empty scene");
  });
});
