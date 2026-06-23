import { describe, it, expect, beforeAll, afterAll } from "vitest";
import JSZip from "jszip";
import { createServer } from "../src/server";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { Express } from "express";
import request from "supertest";
import type { Response as SupertestResponse } from "superagent";
import { writeA3P } from "../src/a3p-writer.js";
import { readProject } from "../src/project-io.js";
import { createMinimalProject } from "./test-utils.js";

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

describe("POST /api/code/create-procedure", () => {
  let app: Express;
  let evidenceDir: string;

  beforeAll(() => {
    evidenceDir = path.resolve(__dirname, `../.test-create-procedure-${Date.now()}`);
    fs.mkdirSync(evidenceDir, { recursive: true });
    app = createServer({ port: 0, evidenceDir });
  });

  afterAll(() => {
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  });

  it("creates a simple procedure", async () => {
    const res = await request(app)
      .post("/api/code/create-procedure")
      .send({ name: "walkForward" })
      .expect(200);
    expect(res.body.status).toBe("created");
    expect(res.body.name).toBe("walkForward");
    expect(res.body.kind).toBe("procedure");
  });

  it("creates a procedure with parameters", async () => {
    const res = await request(app)
      .post("/api/code/create-procedure")
      .send({
        name: "moveToPosition",
        parameters: [
          { name: "x", type: "DecimalNumber" },
          { name: "y", type: "DecimalNumber" },
          { name: "z", type: "DecimalNumber", defaultValue: "0.0" },
        ],
      })
      .expect(200);
    expect(res.body.parameters).toHaveLength(3);
    expect(res.body.parameters[2].defaultValue).toBe("0.0");
  });

  it("rejects missing name", async () => {
    await request(app)
      .post("/api/code/create-procedure")
      .send({})
      .expect(400);
  });

  it("rejects empty name", async () => {
    await request(app)
      .post("/api/code/create-procedure")
      .send({ name: "" })
      .expect(400);
  });

  it("rejects duplicate name", async () => {
    await request(app)
      .post("/api/code/create-procedure")
      .send({ name: "myFirstMethod" })
      .expect(400);
  });

  it("rejects parameter without name", async () => {
    await request(app)
      .post("/api/code/create-procedure")
      .send({ name: "badParams", parameters: [{ type: "Number" }] })
      .expect(400);
  });
});

describe("POST /api/code/create-function", () => {
  let app: Express;
  let evidenceDir: string;

  beforeAll(() => {
    evidenceDir = path.resolve(__dirname, `../.test-create-function-${Date.now()}`);
    fs.mkdirSync(evidenceDir, { recursive: true });
    app = createServer({ port: 0, evidenceDir });
  });

  afterAll(() => {
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  });

  it("creates a function with return type", async () => {
    const res = await request(app)
      .post("/api/code/create-function")
      .send({ name: "getDistance", returnType: "DecimalNumber" })
      .expect(200);
    expect(res.body.status).toBe("created");
    expect(res.body.kind).toBe("function");
    expect(res.body.returnType).toBe("DecimalNumber");
  });

  it("creates a function with parameters", async () => {
    const res = await request(app)
      .post("/api/code/create-function")
      .send({
        name: "calculateArea",
        returnType: "DecimalNumber",
        parameters: [
          { name: "width", type: "DecimalNumber" },
          { name: "height", type: "DecimalNumber" },
        ],
      })
      .expect(200);
    expect(res.body.parameters).toHaveLength(2);
  });

  it("rejects missing returnType", async () => {
    await request(app)
      .post("/api/code/create-function")
      .send({ name: "noReturn" })
      .expect(400);
  });

  it("rejects missing name", async () => {
    await request(app)
      .post("/api/code/create-function")
      .send({ returnType: "Boolean" })
      .expect(400);
  });

  it("rejects duplicate name with existing procedure", async () => {
    await request(app)
      .post("/api/code/create-procedure")
      .send({ name: "sharedName" })
      .expect(200);
    await request(app)
      .post("/api/code/create-function")
      .send({ name: "sharedName", returnType: "Boolean" })
      .expect(400);
  });

  it("uses reopened same-name procedure metadata instead of stale created function metadata", async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "alice-reopen-method-metadata-"));
    try {
      const metadataApp = createServer({
        port: 0,
        evidenceDir: projectDir,
        allowedProjectDirs: [projectDir],
      });
      await request(metadataApp).post("/api/launch").send({}).expect(200);
      await request(metadataApp)
        .post("/api/code/create-function")
        .send({
          name: "foo",
          returnType: "DecimalNumber",
          parameters: [{ name: "oldDistance", type: "DecimalNumber" }],
        })
        .expect(200);

      const reopenedProject = createMinimalProject();
      reopenedProject.projectName = "Reopened Procedure Metadata";
      const sceneType = reopenedProject.types?.find((type) => type.superTypeName?.includes("SScene"));
      expect(sceneType).toBeDefined();
      if (!sceneType) throw new Error("expected minimal project to include Scene type");
      sceneType.methods = [{
        name: "foo",
        isFunction: false,
        returnType: "void",
        parameters: [{ name: "count", type: "WholeNumber" }],
        statements: [],
      }];
      const reopenedPath = path.join(projectDir, "reopened-procedure-foo.a3p");
      fs.writeFileSync(reopenedPath, await writeA3P(reopenedProject));

      await request(metadataApp)
        .post("/api/project/reopen")
        .send({ project: reopenedPath })
        .expect(200);

      const savedPath = path.join(projectDir, "saved-procedure-foo.a3p");
      await request(metadataApp)
        .post("/api/project/save")
        .send({ targetPath: savedPath })
        .expect(200);

      const savedProject = (await readProject(fs.readFileSync(savedPath))).project;
      const savedSceneType = savedProject.types?.find((type) => type.superTypeName?.includes("SScene"));
      const savedFoo = savedSceneType?.methods?.find((method) => method.name === "foo");
      expect(savedFoo).toMatchObject({
        isFunction: false,
        returnType: "void",
        parameters: [{ name: "count", type: "WholeNumber" }],
      });

      const exportRes = await request(metadataApp)
        .get("/api/projects/current/export/typescript")
        .buffer(true)
        .parse(parseBinaryResponse)
        .expect(200);
      const zip = await JSZip.loadAsync(exportRes.body);
      const exportedText = (await Promise.all(
        Object.values(zip.files)
          .filter((entry) => !entry.dir)
          .map((entry) => entry.async("string")),
      )).join("\n");
      expect(exportedText).toContain("foo");
      expect(exportedText).toContain("count");
      expect(exportedText).not.toContain("oldDistance");
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
