import { afterEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import request from "supertest";
import { createServer } from "../src/server";
import { LOCAL_API_TOKEN_HEADER } from "../src/server/security";
import { readProject } from "../src/project-io";

const TEST_LOCAL_API_TOKEN = "test-local-api-token";
const MODEL_BASE64 = Buffer.from([0x67, 0x6c, 0x54, 0x46]).toString("base64");
const TEXTURE_BASE64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alice-asset-routes-"));
  tempDirs.push(dir);
  return dir;
}

function createTestServer() {
  return createServer({
    port: 0,
    evidenceDir: makeTempDir(),
    localApiToken: TEST_LOCAL_API_TOKEN,
  });
}

function localPost(app: ReturnType<typeof createServer>, route: string) {
  return request(app)
    .post(route)
    .set(LOCAL_API_TOKEN_HEADER, TEST_LOCAL_API_TOKEN);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("imported asset REST routes", () => {
  it("requires the Alice local API token for importing and applying assets", async () => {
    const app = createTestServer();

    await request(app)
      .post("/api/assets/import-model")
      .send({ fileName: "moon-rover.glb", contentBase64: MODEL_BASE64 })
      .expect(401);
    await request(app)
      .post("/api/assets/import-texture")
      .send({ fileName: "checker.png", contentBase64: TEXTURE_BASE64 })
      .expect(401);
    await request(app)
      .post("/api/scene/apply-texture")
      .send({
        objectName: "box",
        textureResourceId: "project/textures/checker.png",
        target: "surface",
      })
      .expect(401);
  });

  it("imports a model and a texture, applies the texture, and saves the assets", async () => {
    const app = createTestServer();
    await localPost(app, "/api/project/new")
      .send({ templateId: "blank", projectName: "AssetWorkflow" })
      .expect(200);
    await localPost(app, "/api/scene/add-object")
      .send({ className: "org.lgna.story.SBox", name: "box" })
      .expect(200);

    const model = await localPost(app, "/api/assets/import-model")
      .send({
        fileName: "Moon Rover.GLB",
        displayName: "Moon Rover",
        contentBase64: MODEL_BASE64,
      })
      .expect(200);
    expect(model.body).toEqual({
      status: "imported",
      asset: {
        id: "project/models/moon-rover.glb",
        kind: "model",
        name: "Moon Rover",
        fileName: "moon-rover.glb",
        resourcePath: "resources/models/moon-rover.glb",
        contentType: "model/gltf-binary",
        byteLength: 4,
      },
    });

    const texture = await localPost(app, "/api/assets/import-texture")
      .send({
        fileName: "Checker.PNG",
        displayName: "Checker",
        contentBase64: TEXTURE_BASE64,
      })
      .expect(200);
    expect(texture.body).toEqual({
      status: "imported",
      asset: {
        id: "project/textures/checker.png",
        kind: "texture",
        name: "Checker",
        fileName: "checker.png",
        resourcePath: "resources/textures/checker.png",
        contentType: "image/png",
        byteLength: 4,
      },
    });

    const applied = await localPost(app, "/api/scene/apply-texture")
      .send({
        objectName: "box",
        textureResourceId: "project/textures/checker.png",
        target: "surface",
      })
      .expect(200);
    expect(applied.body).toEqual({
      status: "applied",
      objectName: "box",
      materialBindings: [
        { target: "surface", textureResourceId: "project/textures/checker.png" },
      ],
    });

    const saved = await localPost(app, "/api/project/save")
      .send({ saveSelector: "asset-workflow" })
      .expect(200);
    const savedProject = path.join(
      path.dirname(saved.body.evidenceArtifact),
      saved.body.saved_project_artifact,
    );
    const archive = await readProject(fs.readFileSync(savedProject));

    expect(archive.project.importedAssets?.map((asset) => asset.id)).toEqual([
      "project/models/moon-rover.glb",
      "project/textures/checker.png",
    ]);
    expect(archive.project.sceneObjects.find((object) => object.name === "box")?.materialBindings)
      .toEqual([{ target: "surface", textureResourceId: "project/textures/checker.png" }]);
    expect(archive.resources.has("resources/models/moon-rover.glb")).toBe(true);
    expect(archive.resources.has("resources/textures/checker.png")).toBe(true);
  });

  it.each([
    ["/api/assets/import-model", { fileName: "model.obj", contentBase64: MODEL_BASE64 }, /unsupported/i],
    ["/api/assets/import-model", { fileName: "../bad.glb", contentBase64: MODEL_BASE64 }, /unsafe/i],
    ["/api/assets/import-texture", { fileName: "checker.gif", contentBase64: TEXTURE_BASE64 }, /unsupported/i],
    ["/api/assets/import-texture", { fileName: "checker.png", contentBase64: "not base64" }, /base64/i],
    ["/api/assets/import-texture", { fileName: "checker.png", contentBase64: "" }, /empty/i],
  ])("rejects invalid asset import requests for %s", async (route, body, errorPattern) => {
    const app = createTestServer();

    const response = await localPost(app, route).send(body).expect(400);

    expect(response.body).toEqual({ error: expect.stringMatching(errorPattern) });
  });

  it("returns explicit errors for texture binding failures", async () => {
    const app = createTestServer();
    await localPost(app, "/api/project/new")
      .send({ templateId: "blank", projectName: "AssetWorkflow" })
      .expect(200);
    await localPost(app, "/api/scene/add-object")
      .send({ className: "org.lgna.story.SBox", name: "box" })
      .expect(200);
    await localPost(app, "/api/assets/import-texture")
      .send({
        fileName: "checker.png",
        contentBase64: TEXTURE_BASE64,
      })
      .expect(200);

    await localPost(app, "/api/scene/apply-texture")
      .send({
        objectName: "missing",
        textureResourceId: "project/textures/checker.png",
        target: "surface",
      })
      .expect(404);
    await localPost(app, "/api/scene/apply-texture")
      .send({
        objectName: "box",
        textureResourceId: "project/textures/missing.png",
        target: "surface",
      })
      .expect(400);
    await localPost(app, "/api/scene/apply-texture")
      .send({
        objectName: "box",
        textureResourceId: "project/textures/checker.png",
        target: "emissive",
      })
      .expect(400);
  });
});
