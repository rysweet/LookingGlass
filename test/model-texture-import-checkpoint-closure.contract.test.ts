import { describe, expect, it } from "vitest";
import * as CameraWorkflow from "../src/camera-workflow.js";
import * as ModelTextureWorkflow from "../src/model-texture-camera-joint-export-workflow.js";
import { readProject } from "../src/project-io.js";
import type { AliceProject } from "../src/a3p-parser.js";
import { createMinimalProject } from "./test-utils.js";

const GLTF_BYTES = new TextEncoder().encode(JSON.stringify({
  asset: { version: "2.0", generator: "alice-web parity red test" },
  scenes: [{ nodes: [] }],
  scene: 0,
}));
const PNG_BYTES = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axp3WQAAAAASUVORK5CYII=",
  "base64",
));

type ReopenedParityProject = AliceProject & {
  importedAssets?: Array<Record<string, unknown>>;
  textureAssignments?: Array<Record<string, unknown>>;
  cameraWorkflow?: CameraWorkflow.CameraWorkflowState;
};

function createImportProject(): AliceProject {
  const project = createMinimalProject();
  project.projectName = "Model texture checkpoint";
  project.sceneObjects.push({
    name: "robot",
    typeName: "org.lgna.story.SModel",
    resourceType: null,
    position: { x: 0, y: 0, z: 0 },
    orientation: null,
    size: { width: 1, height: 1, depth: 1 },
  });
  return project;
}

describe("model-texture-import-checkpoint closure workflow", () => {
  it("reopens exported A3P checkpoints with imported model, texture, camera marker, and assignment metadata intact", async () => {
    const initial = ModelTextureWorkflow.createWorkflowState({ project: createImportProject() });
    const withModel = await ModelTextureWorkflow.importModelAsset(initial, {
      fileName: "robot.gltf",
      bytes: GLTF_BYTES,
      objectName: "robot",
    });
    const withTexture = await ModelTextureWorkflow.importTextureAsset(withModel, {
      fileName: "robot.png",
      bytes: PNG_BYTES,
    });
    const withAssignment = ModelTextureWorkflow.assignTextureToModel(withTexture, {
      objectName: "robot",
      texturePath: "resources/textures/robot.png",
      materialName: "body",
    });
    const camera = CameraWorkflow.saveCameraMarker(
      CameraWorkflow.applyCameraPreset(CameraWorkflow.createDefaultCameraWorkflowState(), "isometric"),
      { name: "Checkpoint view" },
    );
    const ready = ModelTextureWorkflow.setCameraWorkflowState(withAssignment, camera);

    const exported = await ModelTextureWorkflow.exportA3pArchive(ready);
    const reopened = await readProject(exported);
    const project = reopened.project as ReopenedParityProject;

    expect(reopened.resources.get("resources/models/robot.gltf")).toEqual(GLTF_BYTES);
    expect(reopened.resources.get("resources/textures/robot.png")).toEqual(PNG_BYTES);
    expect(project.importedAssets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "project/models/robot.gltf",
        kind: "model",
        resourcePath: "resources/models/robot.gltf",
      }),
      expect.objectContaining({
        id: "project/textures/robot.png",
        kind: "texture",
        resourcePath: "resources/textures/robot.png",
      }),
    ]));
    expect(project.sceneObjects.find((object) => object.name === "robot")).toMatchObject({
      modelResourceId: "project/models/robot.gltf",
      materialBindings: [
        {
          target: "surface",
          textureResourceId: "project/textures/robot.png",
        },
      ],
    });
    expect(project.textureAssignments).toEqual([
      {
        objectName: "robot",
        texturePath: "resources/textures/robot.png",
        materialName: "body",
      },
    ]);
    expect(project.cameraWorkflow).toMatchObject({
      camera: { activePreset: "isometric" },
      markers: [expect.objectContaining({ name: "Checkpoint view" })],
    });
  });
});
