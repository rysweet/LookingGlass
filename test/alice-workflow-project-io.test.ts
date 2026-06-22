import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { writeA3P } from "../src/a3p-writer/archive.js";
import {
  ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
  addScorekeeper,
  addTimekeeper,
  bindVisibleWorkflowState,
  createDefaultAliceWorkflowState,
} from "../src/alice-workflow-state.js";
import { createEmptyWorldProject } from "../src/project-template.js";
import { readProject, writeProject } from "../src/project-io.js";
import type { AliceProjectArchive } from "../src/project-io.js";

function createManifestWorkflow() {
  return {
    schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
    scorekeepers: [{ name: "score", initialValue: 7 }],
    timekeepers: [{ name: "elapsedTime" }],
    visibleBindings: [
      {
        id: "score-label",
        kind: "score",
        sourceName: "score",
        target: "world-overlay",
        label: "Score",
        format: "integer",
      },
      {
        id: "time-label",
        kind: "time",
        sourceName: "elapsedTime",
        target: "world-overlay",
        label: "Time",
        format: "seconds-one-decimal",
      },
    ],
  } as const;
}

describe("Project IO scorekeeper and timekeeper persistence", () => {
  it("hydrates manifest aliceWorkflow into validated archive workflow state", async () => {
    const manifestWorkflow = createManifestWorkflow();
    const bytes = await writeA3P(createEmptyWorldProject({ projectName: "ScoreTimeWorld" }), {
      manifest: {
        aliceVersion: "3.10.0.0",
        aliceWorkflow: manifestWorkflow,
      },
    });

    const archive = await readProject(bytes);

    expect(archive.aliceWorkflow).toEqual(manifestWorkflow);
    expect(archive.aliceWorkflow).not.toBe(archive.manifest?.aliceWorkflow);
  });

  it("writes aliceWorkflow state into manifest.json and preserves unrelated manifest fields", async () => {
    let aliceWorkflow = createDefaultAliceWorkflowState();
    aliceWorkflow = addScorekeeper(aliceWorkflow, { name: "score", initialValue: 4 });
    aliceWorkflow = addTimekeeper(aliceWorkflow, { name: "elapsedTime" });
    aliceWorkflow = bindVisibleWorkflowState(aliceWorkflow, {
      id: "score-label",
      kind: "score",
      sourceName: "score",
      target: "world-overlay",
      label: "Score",
      format: "integer",
    });

    const baseArchive = await readProject(
      await writeA3P(createEmptyWorldProject({ projectName: "ScoreTimeWorld" }), {
        manifest: { aliceVersion: "3.10.0.0", author: "Alice" },
      }),
    );
    const archive: AliceProjectArchive = {
      ...baseArchive,
      manifest: { aliceVersion: "3.10.0.0", author: "Alice" },
      aliceWorkflow,
    };

    const bytes = await writeProject(archive);
    const zip = await JSZip.loadAsync(bytes);
    const manifest = JSON.parse(await zip.file("manifest.json")?.async("string") ?? "{}");

    expect(manifest).toMatchObject({
      aliceVersion: "3.10.0.0",
      author: "Alice",
      aliceWorkflow,
    });
    expect((await readProject(bytes)).aliceWorkflow).toEqual(aliceWorkflow);
  });

  it("rejects invalid workflow manifest values during project read", async () => {
    const bytes = await writeA3P(createEmptyWorldProject({ projectName: "ScoreTimeWorld" }), {
      manifest: {
        aliceVersion: "3.10.0.0",
        aliceWorkflow: {
          schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
          scorekeepers: [{ name: "score", initialValue: "10" }],
          timekeepers: [],
          visibleBindings: [],
        },
      },
    });

    await expect(readProject(bytes)).rejects.toMatchObject({
      code: "invalid-manifest",
    });
  });
});
