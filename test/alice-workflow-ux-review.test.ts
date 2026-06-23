import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "..");

type Checkpoint = {
  id: string;
  title: string;
  aliceWorkflowArea: string;
  automatedEvidence: string[];
  humanReviewPrompts: string[];
  outputTarget: string;
};

async function loadUxReviewModule() {
  const modulePath = "../src/server/alice-workflow-ux-review";
  return import(/* @vite-ignore */ modulePath) as Promise<{
    ALICE_WORKFLOW_UX_REVIEW_SCHEMA_VERSION: string;
    ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET: string;
    ALICE_WORKFLOW_UX_REVIEW_CHECKPOINTS: Checkpoint[];
    findAliceWorkflowUxReviewCheckpoint(id: Checkpoint["id"]): Checkpoint;
  }>;
}

describe("Alice workflow UX review checkpoints", () => {
  it("defines one durable checkpoint for each human-reviewed Alice workflow area", async () => {
    const {
      ALICE_WORKFLOW_UX_REVIEW_SCHEMA_VERSION,
      ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET,
      ALICE_WORKFLOW_UX_REVIEW_CHECKPOINTS,
    } = await loadUxReviewModule();

    expect(ALICE_WORKFLOW_UX_REVIEW_SCHEMA_VERSION).toBe("alice-web.workflow-ux-review/v1");
    expect(ALICE_WORKFLOW_UX_REVIEW_OUTPUT_TARGET).toBe("github-issue-or-pr-comment");
    expect(ALICE_WORKFLOW_UX_REVIEW_CHECKPOINTS.map((checkpoint) => checkpoint.id)).toEqual([
      "scene-editor",
      "code-editor",
      "camera",
      "joints",
      "player-export",
    ]);

    for (const checkpoint of ALICE_WORKFLOW_UX_REVIEW_CHECKPOINTS) {
      expect(checkpoint.title.trim()).not.toBe("");
      expect(checkpoint.aliceWorkflowArea.trim()).not.toBe("");
      expect(checkpoint.outputTarget).toBe("github-issue-or-pr-comment");
      expect(checkpoint.automatedEvidence.length).toBeGreaterThan(0);
      expect(checkpoint.humanReviewPrompts.length).toBeGreaterThanOrEqual(3);

      for (const path of checkpoint.automatedEvidence) {
        expect(path).not.toMatch(/^\/|(^|\/)\.\.(\/|$)/);
        expect(existsSync(resolve(repoRoot, path)), `${checkpoint.id} evidence exists: ${path}`).toBe(true);
      }
    }
  });

  it("looks up checkpoints by stable id and rejects unknown ids", async () => {
    const { findAliceWorkflowUxReviewCheckpoint } = await loadUxReviewModule();

    expect(findAliceWorkflowUxReviewCheckpoint("camera").aliceWorkflowArea).toBe("Camera");
    expect(() => findAliceWorkflowUxReviewCheckpoint("unknown")).toThrow(/Unknown Alice workflow UX review checkpoint/);
  });

  it("provides a GitHub issue template for recording human review outcomes", async () => {
    const template = readFileSync(resolve(repoRoot, ".github/ISSUE_TEMPLATE/alice-workflow-ux-review.yml"), "utf8");

    expect(template).toContain("name: Alice workflow UX review");
    for (const id of ["scene-editor", "code-editor", "camera", "joints", "player-export"]) {
      expect(template).toContain(`- ${id}`);
    }
    for (const field of ["review-steps", "observations", "verdict", "follow-up"]) {
      expect(template).toContain(`id: ${field}`);
    }
    expect(template).toContain("do not commit generated review reports to the repository");
  });

  it("documents the checkpoint process without creating point-in-time reports", () => {
    const docs = readFileSync(resolve(repoRoot, "docs/alice-workflow-ux-review.md"), "utf8");

    expect(docs).toContain("Alice workflow UX review checkpoints");
    expect(docs).toContain("src/server/alice-workflow-ux-review.ts");
    expect(docs).toContain("GitHub issues or PR comments");
    expect(docs).toContain("Do not add point-in-time review reports");
    expect(docs).not.toContain("generated report path");
  });
});
