import { afterEach, describe, expect, it, vi } from "vitest";
import type { AliceProject } from "../src/a3p-parser";
import {
  WorkspaceManager,
  restoreWorkspace,
  type SerializedWorkspace,
} from "../src/workspace";

function createProject(projectName: string): AliceProject {
  return {
    version: "3.10.0.0",
    projectName,
    sceneObjects: [],
    methods: [],
  };
}

describe("workspace depth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes restored windows while preserving raw duplicate window ids", () => {
    const serialized: SerializedWorkspace = {
      version: 1,
      currentWindowId: "missing-window",
      windows: [
        {
          windowId: " main ",
          title: "   ",
          project: createProject("Recovered Story"),
          perspectiveId: "" as never,
          selection: {
            kind: "scene-object",
            id: "camera",
            path: ["scene", 7 as never, "camera"],
            metadata: { source: "restore" },
          },
          createdAt: Number.NaN,
          updatedAt: 99,
        },
        {
          windowId: "main",
          title: "Duplicate",
          project: createProject("Duplicate Story"),
          perspectiveId: "events",
          selection: null,
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    };

    const restored = restoreWorkspace(serialized, {
      defaultPerspectiveId: "events",
    });

    expect(restored.listWindows().map((window) => window.windowId)).toEqual([
      " main ",
      "main",
    ]);
    expect(restored.current).toEqual({
      windowId: " main ",
      title: "Recovered Story",
      project: createProject("Recovered Story"),
      perspectiveId: "events",
      selection: {
        kind: "scene-object",
        id: "camera",
        path: ["scene", "camera"],
        metadata: { source: "restore" },
      },
      createdAt: 99,
      updatedAt: 99,
    });
  });

  it("clones patch inputs and returned state while preserving createdAt", () => {
    const workspace = new WorkspaceManager();
    workspace.openWindow({
      windowId: "main",
      project: createProject("Original Story"),
      timestamp: 10,
    });

    const project = createProject("Updated Story");
    project.sceneObjects.push({ name: "ground" } as never);
    const selection = {
      kind: "method",
      id: "jump",
      path: ["methods", "jump"],
      metadata: { cursor: { line: 1 } },
    };

    vi.spyOn(Date, "now").mockReturnValue(250);
    workspace.updateProject(project);
    const updated = workspace.updateSelection(selection);

    project.projectName = "Mutated Outside Workspace";
    selection.path.push("tail");
    (selection.metadata.cursor as { line: number }).line = 99;
    updated.project!.projectName = "Mutated Returned Copy";
    updated.selection!.path = [];

    expect(workspace.current).toEqual({
      windowId: "main",
      title: "Original Story",
      project: {
        version: "3.10.0.0",
        projectName: "Updated Story",
        sceneObjects: [{ name: "ground" }],
        methods: [],
      },
      perspectiveId: "scene-setup",
      selection: {
        kind: "method",
        id: "jump",
        path: ["methods", "jump"],
        metadata: { cursor: { line: 1 } },
      },
      createdAt: 10,
      updatedAt: 250,
    });
  });
});
