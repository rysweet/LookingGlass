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

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function trackTempDir(dir: string): string {
  tempDirs.push(dir);
  return dir;
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

describe("TypeScript source export handoff E2E", () => {
  it("downloads the current Alice project as an inspectable TypeScript handoff archive", async () => {
    const evidenceDir = trackTempDir(makeTempDir("alice-typescript-e2e-"));
    const app = createServer({
      port: 0,
      evidenceDir,
      localApiToken: TEST_LOCAL_API_TOKEN,
    });

    await localPost(app, "/api/launch").send({}).expect(200);
    await localPost(app, "/api/scene/add-object")
      .send({ className: "org.lgna.story.SBiped", name: "bunny" })
      .expect(200);
    await localPost(app, "/api/code/create-procedure")
      .send({ name: "danceTogether" })
      .expect(200);
    await localPost(app, "/api/code/edit-procedure")
      .send({
        procedureSelector: "scene.danceTogether",
        editSpec: "append-statement:wave",
      })
      .expect(200);

    const response = await request(app)
      .get("/api/projects/current/export/typescript")
      .buffer(true)
      .parse(parseBinaryResponse)
      .expect(200);

    const zip = await JSZip.loadAsync(response.body);
    const entryNames = Object.keys(zip.files).sort();
    const allText = (await Promise.all(
      entryNames
        .filter((name) => !zip.files[name].dir)
        .map((name) => zip.files[name].async("string")),
    )).join("\n");

    expect(entryNames).toEqual([...entryNames].sort());
    expect(entryNames).toContain("alice-web-typescript-source/src/project.ts");
    expect(entryNames).toContain("alice-web-typescript-source/src/scene.ts");
    expect(entryNames).toContain("alice-web-typescript-source/src/procedures/danceTogether.ts");
    expect(allText).toContain("bunny");
    expect(allText).toContain("danceTogether");
    expect(allText).toContain("wave");
    expect(allText.match(/wave/g)).toHaveLength(1);
    expect(allText).toContain("UnsupportedAliceRuntimeBehavior");
    expect(allText).not.toMatch(/placeholder|lookingglass/i);
  });
});
