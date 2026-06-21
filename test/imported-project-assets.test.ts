import { describe, expect, it } from "vitest";
import type { AliceProject } from "../src/a3p-parser";
import {
  MAX_IMPORTED_ASSET_BYTES,
  applyTextureBinding,
  importProjectAsset,
  type ImportedProjectAsset,
} from "../src/imported-project-assets";

function createProject(): AliceProject {
  return {
    version: "3.10.0.0",
    projectName: "AssetWorkflow",
    sceneObjects: [
      {
        name: "box",
        typeName: "org.lgna.story.SBox",
        resourceType: null,
        position: null,
        orientation: null,
        size: null,
      },
    ],
    methods: [],
    importedAssets: [],
  };
}

function bytes(length = 4): Uint8Array {
  return new Uint8Array(Array.from({ length }, (_value, index) => index + 1));
}

function importedTexture(overrides: Partial<ImportedProjectAsset> = {}): ImportedProjectAsset {
  return {
    id: "project/textures/checker.png",
    kind: "texture",
    name: "Checker",
    fileName: "checker.png",
    resourcePath: "resources/textures/checker.png",
    contentType: "image/png",
    byteLength: 4,
    ...overrides,
  };
}

describe("imported project asset helpers", () => {
  it("imports a model with sanitized Alice project and archive identifiers", () => {
    const project = createProject();
    const resources = new Map<string, Uint8Array>();

    const asset = importProjectAsset({
      project,
      resources,
      kind: "model",
      fileName: "Moon Rover.GLB",
      displayName: "  Moon Rover  ",
      bytes: bytes(),
    });

    expect(asset).toEqual({
      id: "project/models/moon-rover.glb",
      kind: "model",
      name: "Moon Rover",
      fileName: "moon-rover.glb",
      resourcePath: "resources/models/moon-rover.glb",
      contentType: "model/gltf-binary",
      byteLength: 4,
    });
    expect(project.importedAssets).toEqual([asset]);
    expect(resources.get("resources/models/moon-rover.glb")).toEqual(bytes());
  });

  it("imports textures, defaults display names, and avoids resource ID collisions", () => {
    const project = createProject();
    const resources = new Map<string, Uint8Array>();

    const first = importProjectAsset({
      project,
      resources,
      kind: "texture",
      fileName: "Checker.PNG",
      bytes: bytes(2),
    });
    const second = importProjectAsset({
      project,
      resources,
      kind: "texture",
      fileName: "checker.png",
      displayName: "Second Checker",
      bytes: bytes(3),
    });

    expect(first).toMatchObject({
      id: "project/textures/checker.png",
      name: "Checker",
      fileName: "checker.png",
      resourcePath: "resources/textures/checker.png",
      contentType: "image/png",
      byteLength: 2,
    });
    expect(second).toMatchObject({
      id: "project/textures/checker-2.png",
      name: "Second Checker",
      fileName: "checker-2.png",
      resourcePath: "resources/textures/checker-2.png",
      contentType: "image/png",
      byteLength: 3,
    });
    expect(project.importedAssets?.map((asset) => asset.id)).toEqual([
      "project/textures/checker.png",
      "project/textures/checker-2.png",
    ]);
  });

  it.each([
    ["../bad.glb", /unsafe filename/i],
    ["folder/bad.glb", /unsafe filename/i],
    ["bad\u0000name.glb", /unsafe filename/i],
    ["?.glb", /empty asset name/i],
    ["model.obj", /unsupported model/i],
    ["texture.gif", /unsupported texture/i],
  ])("rejects invalid uploaded filenames: %s", (fileName, message) => {
    const project = createProject();
    const resources = new Map<string, Uint8Array>();

    expect(() => importProjectAsset({
      project,
      resources,
      kind: fileName.endsWith(".gif") ? "texture" : "model",
      fileName,
      bytes: bytes(),
    })).toThrow(message);
    expect(project.importedAssets).toEqual([]);
    expect(resources.size).toBe(0);
  });

  it("rejects empty and oversized uploads before mutating project state", () => {
    const project = createProject();
    const resources = new Map<string, Uint8Array>();

    expect(() => importProjectAsset({
      project,
      resources,
      kind: "texture",
      fileName: "checker.png",
      bytes: new Uint8Array(),
    })).toThrow(/empty/i);

    expect(() => importProjectAsset({
      project,
      resources,
      kind: "texture",
      fileName: "large.png",
      bytes: new Uint8Array(MAX_IMPORTED_ASSET_BYTES + 1),
    })).toThrow(/too large/i);

    expect(project.importedAssets).toEqual([]);
    expect(resources.size).toBe(0);
  });

  it("applies and replaces a surface texture binding on a scene object", () => {
    const project = createProject();
    project.importedAssets = [
      importedTexture(),
      importedTexture({
        id: "project/textures/grid.webp",
        name: "Grid",
        fileName: "grid.webp",
        resourcePath: "resources/textures/grid.webp",
        contentType: "image/webp",
      }),
    ];

    const first = applyTextureBinding(project, {
      objectName: "box",
      textureResourceId: "project/textures/checker.png",
      target: "surface",
    });
    const second = applyTextureBinding(project, {
      objectName: "box",
      textureResourceId: "project/textures/grid.webp",
      target: "surface",
    });

    expect(first.materialBindings).toEqual([
      { target: "surface", textureResourceId: "project/textures/checker.png" },
    ]);
    expect(second.materialBindings).toEqual([
      { target: "surface", textureResourceId: "project/textures/grid.webp" },
    ]);
    expect(project.sceneObjects[0].materialBindings).toEqual(second.materialBindings);
  });

  it("rejects texture binding requests for missing objects, unknown assets, and unsupported targets", () => {
    const project = createProject();
    project.importedAssets = [importedTexture()];

    expect(() => applyTextureBinding(project, {
      objectName: "missing",
      textureResourceId: "project/textures/checker.png",
      target: "surface",
    })).toThrow(/scene object/i);

    expect(() => applyTextureBinding(project, {
      objectName: "box",
      textureResourceId: "project/textures/missing.png",
      target: "surface",
    })).toThrow(/texture asset/i);

    expect(() => applyTextureBinding(project, {
      objectName: "box",
      textureResourceId: "project/textures/checker.png",
      target: "emissive",
    })).toThrow(/unsupported material target/i);
  });
});
