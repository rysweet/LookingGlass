import express from "express";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { AliceProjectArchive } from "../../project-io.js";
import { writeProject } from "../../project-io.js";
import type { ServerContext } from "../context.js";
import { evidenceService } from "../evidence-service.js";
import { buildCurrentProject, createInitialServerState } from "../state.js";
import { registerSceneRoutes } from "./scene-routes.js";

const transform = {
  position: { x: 1.5, y: 0, z: -2 },
  orientation: { x: 0, y: 0.13052619222, z: 0, w: 0.991444861374 },
  size: { width: 1.25, height: 1.25, depth: 1.25 },
};

describe("scene transform route", () => {
  it("records transform evidence and writes transformed object state into saved project XML", async () => {
    const evidenceDir = path.join(process.cwd(), "target/test-work/scene-route-transform-evidence");
    fs.rmSync(evidenceDir, { recursive: true, force: true });
    const app = express();
    const state = createInitialServerState();
    app.use(express.json());
    registerSceneRoutes(app, {
      state,
      evidenceDir,
      evidenceService,
    } as ServerContext);

    await request(app)
      .post("/api/scene/add-object")
      .send({ className: "org.lgna.story.SBiped", name: "bunny" })
      .expect(200);

    const response = await request(app)
      .post("/api/scene/transform-object")
      .send({ objectName: "bunny", ...transform })
      .expect(200);

    expect(response.body).toMatchObject({
      status: "transformed",
      objectName: "bunny",
      ...transform,
    });
    expect(fs.existsSync(response.body.evidenceArtifact)).toBe(true);
    expect(JSON.parse(fs.readFileSync(response.body.evidenceArtifact, "utf8"))).toMatchObject({
      status: "transformed",
      objectName: "bunny",
      ...transform,
    });

    const project = buildCurrentProject(state);
    expect(project.sceneObjects.find((object) => object.name === "bunny")).toMatchObject(transform);

    const savedXml = await projectXmlFromArchive({
      project,
      manifest: null,
      resources: new Map(),
      resourceEntries: [],
      thumbnail: null,
      versionInfo: {
        originalAliceVersion: project.version,
        detectedAliceVersion: project.version,
        manifestVersion: null,
        xmlVersion: null,
        versionSource: "default",
        migrated: false,
        migrationSteps: [],
      },
    });
    for (const expected of [
      "setPositionRelativeToVehicle",
      "setOrientationRelativeToVehicle",
      "setSize",
      "1.5",
      "-2",
      "0.13052619222",
      "0.991444861374",
      "1.25",
    ]) {
      expect(savedXml).toContain(expected);
    }
  });

  it("rejects transform requests without finite numeric transform values", async () => {
    const app = express();
    app.use(express.json());
    registerSceneRoutes(app, {
      state: createInitialServerState(),
      evidenceDir: path.join(process.cwd(), "target/test-work/scene-route-transform-validation"),
      evidenceService,
    } as ServerContext);

    await request(app)
      .post("/api/scene/transform-object")
      .send({ objectName: "bunny", position: { x: 1, y: "bad", z: 0 } })
      .expect(400, { error: "position.y must be a finite number" });

    await request(app)
      .post("/api/scene/transform-object")
      .send({ objectName: "bunny", orientation: { x: 0, y: 0, z: 0, w: 0 } })
      .expect(400, { error: "orientation must be a normalized non-zero quaternion" });

    await request(app)
      .post("/api/scene/transform-object")
      .send({ objectName: "bunny", size: { width: 1, height: 0, depth: 1 } })
      .expect(400, { error: "size dimensions must be positive" });
  });
});

async function projectXmlFromArchive(archive: AliceProjectArchive): Promise<string> {
  const bytes = await writeProject(archive, { generateThumbnailFromScene: false });
  const zip = await JSZip.loadAsync(bytes);
  const entry = zip.file("programType.xml") ?? zip.file("program.xml");
  if (!entry) throw new Error("saved project XML not found");
  return entry.async("string");
}
