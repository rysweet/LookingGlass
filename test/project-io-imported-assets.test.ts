import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import type { AliceProject } from "../src/a3p-parser";
import { readProject, writeProject, type AliceProjectArchive } from "../src/project-io";

const MODEL_BYTES = new Uint8Array([0x67, 0x6c, 0x54, 0x46]);
const TEXTURE_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function createArchive(): AliceProjectArchive {
  const project: AliceProject = {
    version: "3.10.0.0",
    projectName: "AssetWorkflow",
    sceneObjects: [
      {
        name: "moonRover",
        typeName: "org.lgna.story.SModel",
        resourceType: null,
        position: null,
        orientation: null,
        size: null,
        modelResourceId: "project/models/moon-rover.glb",
      },
      {
        name: "box",
        typeName: "org.lgna.story.SBox",
        resourceType: null,
        position: null,
        orientation: null,
        size: null,
        materialBindings: [
          { target: "surface", textureResourceId: "project/textures/checker.png" },
        ],
      },
    ],
    methods: [],
    types: [],
    importedAssets: [
      {
        id: "project/models/moon-rover.glb",
        kind: "model",
        name: "Moon Rover",
        fileName: "moon-rover.glb",
        resourcePath: "resources/models/moon-rover.glb",
        contentType: "model/gltf-binary",
        byteLength: MODEL_BYTES.length,
      },
      {
        id: "project/textures/checker.png",
        kind: "texture",
        name: "Checker",
        fileName: "checker.png",
        resourcePath: "resources/textures/checker.png",
        contentType: "image/png",
        byteLength: TEXTURE_BYTES.length,
      },
    ],
  };

  return {
    project,
    manifest: { aliceVersion: "3.10.0.0" },
    resources: new Map<string, Uint8Array>([
      ["resources/models/moon-rover.glb", MODEL_BYTES],
      ["resources/textures/checker.png", TEXTURE_BYTES],
    ]),
    resourceEntries: [],
    thumbnail: null,
    versionInfo: {
      originalAliceVersion: "3.10.0.0",
      detectedAliceVersion: "3.10.0.0",
      manifestVersion: "3.10.0.0",
      xmlVersion: "3.10.0.0",
      versionSource: "manifest",
      migrated: false,
      migrationSteps: [],
    },
  };
}

describe("Project IO imported asset persistence", () => {
  it("writes imported asset descriptors, bindings, and bytes into an .a3p archive", async () => {
    const bytes = await writeProject(createArchive());
    const zip = await JSZip.loadAsync(bytes);

    expect(zip.file("resources/models/moon-rover.glb")).not.toBeNull();
    expect(zip.file("resources/textures/checker.png")).not.toBeNull();

    const xml = await zip.file("programType.xml")?.async("text");
    expect(xml).toContain("<imported-assets>");
    expect(xml).toContain('id="project/models/moon-rover.glb"');
    expect(xml).toContain('resourcePath="resources/textures/checker.png"');
    expect(xml).toContain('modelResourceId="project/models/moon-rover.glb"');
    expect(xml).toContain('textureResourceId="project/textures/checker.png"');
  });

  it("round-trips imported assets and surface bindings through readProject and writeProject", async () => {
    const roundTripped = await readProject(await writeProject(createArchive()));

    expect(roundTripped.project.importedAssets).toEqual([
      {
        id: "project/models/moon-rover.glb",
        kind: "model",
        name: "Moon Rover",
        fileName: "moon-rover.glb",
        resourcePath: "resources/models/moon-rover.glb",
        contentType: "model/gltf-binary",
        byteLength: MODEL_BYTES.length,
      },
      {
        id: "project/textures/checker.png",
        kind: "texture",
        name: "Checker",
        fileName: "checker.png",
        resourcePath: "resources/textures/checker.png",
        contentType: "image/png",
        byteLength: TEXTURE_BYTES.length,
      },
    ]);
    expect(roundTripped.resources.get("resources/models/moon-rover.glb")).toEqual(MODEL_BYTES);
    expect(roundTripped.resources.get("resources/textures/checker.png")).toEqual(TEXTURE_BYTES);
    expect(roundTripped.project.sceneObjects.find((object) => object.name === "moonRover")?.modelResourceId)
      .toBe("project/models/moon-rover.glb");
    expect(roundTripped.project.sceneObjects.find((object) => object.name === "box")?.materialBindings)
      .toEqual([{ target: "surface", textureResourceId: "project/textures/checker.png" }]);
  });

  it("loads older projects with an empty importedAssets array", async () => {
    const archive = createArchive();
    delete archive.project.importedAssets;
    archive.project.sceneObjects = [];
    archive.resources.clear();

    const roundTripped = await readProject(await writeProject(archive));

    expect(roundTripped.project.importedAssets).toEqual([]);
  });
});
