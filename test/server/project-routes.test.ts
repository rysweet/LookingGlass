import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { Express } from "express";
import request, { type Response as SupertestResponse } from "supertest";
import { createServer } from "../../src/server.js";
import { LOCAL_API_TOKEN_HEADER } from "../../src/server/security.js";

const TEST_LOCAL_API_TOKEN = "test-local-api-token";

const tempDirs: string[] = [];

function trackTempDir(dir: string): string {
  tempDirs.push(dir);
  return dir;
}

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createTestServer(evidenceDir = trackTempDir(makeTempDir("alice-typescript-route-"))): Express {
  return createServer({
    port: 0,
    evidenceDir,
    localApiToken: TEST_LOCAL_API_TOKEN,
  });
}

function localPost(app: Express, apiPath: string) {
  return request(app)
    .post(apiPath)
    .set(LOCAL_API_TOKEN_HEADER, TEST_LOCAL_API_TOKEN);
}

function parseBinaryResponse(
  res: SupertestResponse,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  res.on("end", () => callback(null, Buffer.concat(chunks)));
  res.on("error", callback);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("GET /api/projects/current/export/typescript", () => {
  it("returns a no-store Alice-branded TypeScript source ZIP for the current project", async () => {
    const app = createTestServer();
    await localPost(app, "/api/launch").send({}).expect(200);
    await localPost(app, "/api/scene/add-object")
      .send({ className: "org.lgna.story.SBiped", name: "bunny" })
      .expect(200);
    await localPost(app, "/api/code/edit-procedure")
      .send({
        procedureSelector: "scene.myFirstMethod",
        editSpec: "append-statement:jump",
      })
      .expect(200);

    const response = await request(app)
      .get("/api/projects/current/export/typescript")
      .buffer(true)
      .parse(parseBinaryResponse)
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/^application\/zip\b/);
    expect(response.headers["content-disposition"]).toMatch(
      /^attachment; filename="?alice-web-typescript-source\.zip"?$/,
    );
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(Buffer.isBuffer(response.body)).toBe(true);

    const zip = await JSZip.loadAsync(response.body);
    const entryNames = Object.keys(zip.files).sort();
    expect(entryNames).toContain("alice-web-typescript-source/manifest.json");
    expect(entryNames).toContain("alice-web-typescript-source/package.json");
    expect(entryNames).toContain("alice-web-typescript-source/tsconfig.json");
    expect(entryNames).toContain("alice-web-typescript-source/README.md");
    expect(entryNames).toContain("alice-web-typescript-source/src/project.ts");
    expect(entryNames).toContain("alice-web-typescript-source/src/scene.ts");
    expect(entryNames.every((name) => name.startsWith("alice-web-typescript-source/"))).toBe(true);

    const manifest = JSON.parse(
      await zip.file("alice-web-typescript-source/manifest.json")!.async("string"),
    );
    const packageJson = JSON.parse(
      await zip.file("alice-web-typescript-source/package.json")!.async("string"),
    );
    const sceneSource = await zip.file("alice-web-typescript-source/src/scene.ts")!.async("string");
    const projectSource = await zip.file("alice-web-typescript-source/src/project.ts")!.async("string");

    expect(manifest).toMatchObject({
      schemaVersion: "alice-web.typescript-source-manifest/v1",
      product: "alice-web",
      runtime: "Alice",
      projectName: "Program",
    });
    expect(packageJson.name).toBe("alice-web-typescript-source");
    expect(packageJson.description).toMatch(/Alice web TypeScript source export/i);
    expect(sceneSource).toContain("bunny");
    expect(projectSource).toContain("createAliceProject");
    expect(JSON.stringify({ manifest, packageJson, sceneSource, projectSource })).not.toMatch(/lookingglass/i);
  });

  it("returns a client error instead of an empty archive when no current project exists", async () => {
    const app = createTestServer();

    const response = await request(app)
      .get("/api/projects/current/export/typescript")
      .expect(400);

    expect(response.body.error).toMatch(/launch|current project/i);
    expect(response.headers["content-type"]).toMatch(/^application\/json\b/);
  });
});
