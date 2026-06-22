import express, { type ErrorRequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { ServerContext } from "../context.js";
import { createInitialServerState } from "../state.js";
import { registerProjectRoutes } from "./project-routes.js";

const packageData = {
  kind: "alice-web.reusable-class-behavior",
  version: 1,
  exportedBy: "alice-web",
  type: {
    name: "Reusable Spinner",
    superTypeName: "org.lgna.story.SModel",
    fields: [],
    constructors: [],
    methods: [],
  },
};

function createApp(projectService: Record<string, unknown>) {
  const app = express();
  const state = createInitialServerState();
  app.use(express.json({ limit: "2mb" }));
  registerProjectRoutes(app, {
    state,
    projectService,
    templateService: {
      listTemplates: vi.fn(() => []),
      createProject: vi.fn(),
    },
  } as unknown as ServerContext);
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = typeof error.status === "number" ? error.status : 500;
    res.status(status).json({
      error: error instanceof Error ? error.message : String(error),
      ...(typeof error.code === "string" ? { code: error.code } : {}),
      ...(typeof error.existingName === "string" ? { existingName: error.existingName } : {}),
    });
  };
  app.use(errorHandler);
  return { app, state };
}

describe("project routes class behavior package workflow", () => {
  it("exports one reusable class behavior from the current Alice project with safe download headers", async () => {
    const exportClassBehaviorPackage = vi.fn(() => packageData);
    const { app, state } = createApp({ exportClassBehaviorPackage });

    const response = await request(app)
      .get(`/api/projects/current/classes/${encodeURIComponent("Reusable Spinner")}/behavior`)
      .expect(200);

    expect(exportClassBehaviorPackage).toHaveBeenCalledWith(state, "Reusable Spinner");
    expect(response.header["content-type"]).toMatch(/^application\/json\b/);
    expect(response.header["cache-control"]).toBe("no-store");
    expect(response.header["content-disposition"]).toBe(
      'attachment; filename="Reusable-Spinner.alice-class-behavior.json"',
    );
    expect(response.body).toEqual(packageData);
  });

  it("imports one package into the current Alice project and returns the typed import result", async () => {
    const importResult = {
      schema_version: "alice-web.class-behavior-import-result/v1",
      status: "imported",
      originalName: "Reusable Spinner",
      importedName: "Reusable Spinner",
      conflictStrategy: "replace",
      renamed: false,
      replaced: true,
      merged: false,
    };
    const importClassBehaviorPackage = vi.fn(() => importResult);
    const { app, state } = createApp({ importClassBehaviorPackage });

    const response = await request(app)
      .post("/api/projects/current/classes/behavior")
      .send({ package: packageData, conflictStrategy: "replace" })
      .expect(200);

    expect(importClassBehaviorPackage).toHaveBeenCalledWith(state, packageData, {
      conflictStrategy: "replace",
    });
    expect(response.header["cache-control"]).toBe("no-store");
    expect(response.body).toEqual(importResult);
  });

  it("returns a typed conflict response for reject conflicts without a success-shaped body", async () => {
    const conflict = Object.assign(new Error("Class behavior already exists: Reusable Spinner"), {
      status: 409,
      code: "class-behavior-conflict",
      existingName: "Reusable Spinner",
    });
    const importClassBehaviorPackage = vi.fn(() => {
      throw conflict;
    });
    const { app } = createApp({ importClassBehaviorPackage });

    const response = await request(app)
      .post("/api/projects/current/classes/behavior")
      .send({ package: packageData, conflictStrategy: "reject" })
      .expect(409);

    expect(response.body).toEqual({
      error: "Class behavior already exists: Reusable Spinner",
      code: "class-behavior-conflict",
      existingName: "Reusable Spinner",
    });
    expect(response.body).not.toHaveProperty("status", "imported");
  });

  it("rejects malformed import bodies before mutating the current project", async () => {
    const importClassBehaviorPackage = vi.fn();
    const { app } = createApp({ importClassBehaviorPackage });

    const response = await request(app)
      .post("/api/projects/current/classes/behavior")
      .send({ conflictStrategy: "rename" })
      .expect(400);

    expect(response.body).toMatchObject({
      code: "invalid-class-behavior-package",
    });
    expect(importClassBehaviorPackage).not.toHaveBeenCalled();
  });
});
