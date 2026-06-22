import { describe, expect, it } from "vitest";
import {
  ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
  AliceWorkflowStateError,
  addScorekeeper,
  addTimekeeper,
  bindVisibleWorkflowState,
  createDefaultAliceWorkflowState,
  resolveVisibleWorkflowBindings,
  validateAliceWorkflowState,
  type AliceWorkflowState,
} from "../src/alice-workflow-state.js";
import { ProjectRunner } from "../src/project-runner.js";
import { TweedleCompiler } from "../src/tweedle-compiler.js";

function createBoundWorkflow(): AliceWorkflowState {
  let workflow = createDefaultAliceWorkflowState();
  workflow = addScorekeeper(workflow, { name: "score" });
  workflow = addTimekeeper(workflow, { name: "elapsedTime" });
  workflow = bindVisibleWorkflowState(workflow, {
    id: "score-label",
    kind: "score",
    sourceName: "score",
    target: "world-overlay",
    label: "Score",
    format: "integer",
  });
  workflow = bindVisibleWorkflowState(workflow, {
    id: "time-label",
    kind: "time",
    sourceName: "elapsedTime",
    target: "world-overlay",
    label: "Time",
    format: "seconds-one-decimal",
  });
  return workflow;
}

function expectWorkflowError(action: () => unknown, code: string, path: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(AliceWorkflowStateError);
    expect(error).toMatchObject({ code, path });
    return;
  }
  throw new Error(`Expected Alice workflow validation error ${code}`);
}

describe("Alice score and time workflow state", () => {
  it("creates empty scorekeeper, timekeeper, and visible binding state by default", () => {
    expect(ALICE_WORKFLOW_STATE_SCHEMA_VERSION).toBe("alice-web.workflow-state/v1");
    expect(createDefaultAliceWorkflowState()).toEqual({
      schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
      scorekeepers: [],
      timekeepers: [],
      visibleBindings: [],
    });
  });

  it("adds immutable scorekeepers with default and configured finite numeric values", () => {
    const initial = createDefaultAliceWorkflowState();
    const defaultScore = addScorekeeper(initial, { name: "  score  " });
    const configuredScore = addScorekeeper(defaultScore, {
      name: "bonus",
      initialValue: 12.5,
    });

    expect(initial.scorekeepers).toEqual([]);
    expect(defaultScore.scorekeepers).toEqual([{ name: "score", initialValue: 0 }]);
    expect(configuredScore.scorekeepers).toEqual([
      { name: "score", initialValue: 0 },
      { name: "bonus", initialValue: 12.5 },
    ]);
    expect(configuredScore).not.toBe(defaultScore);
  });

  it("adds immutable timekeepers with zero-based elapsed world time and no configured value", () => {
    const initial = createDefaultAliceWorkflowState();
    const workflow = addTimekeeper(initial, { name: "  elapsedTime  " });

    expect(initial.timekeepers).toEqual([]);
    expect(workflow.timekeepers).toEqual([{ name: "elapsedTime" }]);
    expect(workflow.timekeepers[0]).not.toHaveProperty("initialValue");
  });

  it("binds score and time values to visible Alice text with deterministic formats", () => {
    const workflow = createBoundWorkflow();

    expect(resolveVisibleWorkflowBindings(workflow)).toEqual([
      {
        id: "score-label",
        kind: "score",
        sourceName: "score",
        target: "world-overlay",
        label: "Score",
        value: 0,
        text: "Score: 0",
      },
      {
        id: "time-label",
        kind: "time",
        sourceName: "elapsedTime",
        target: "world-overlay",
        label: "Time",
        value: 0,
        text: "Time: 0.0",
      },
    ]);

    expect(resolveVisibleWorkflowBindings(workflow, {
      scoreValues: { score: 10 },
      elapsedSeconds: 1.24,
    })).toEqual([
      expect.objectContaining({ id: "score-label", value: 10, text: "Score: 10" }),
      expect.objectContaining({ id: "time-label", value: 1.24, text: "Time: 1.2" }),
    ]);
  });

  it("validates workflow state into defensive deep copies", () => {
    const workflow = createBoundWorkflow();
    const validated = validateAliceWorkflowState(workflow);

    expect(validated).toEqual(workflow);
    expect(validated).not.toBe(workflow);
    expect(validated.scorekeepers).not.toBe(workflow.scorekeepers);
    expect(validated.timekeepers).not.toBe(workflow.timekeepers);
    expect(validated.visibleBindings).not.toBe(workflow.visibleBindings);
  });

  it("rejects invalid score values, numeric strings, duplicate names, and timekeeper value fields", () => {
    const workflow = createDefaultAliceWorkflowState();

    expectWorkflowError(
      () => addScorekeeper(workflow, { name: "score", initialValue: Number.NaN }),
      "invalid-score-value",
      "aliceWorkflow.scorekeepers[0].initialValue",
    );
    expectWorkflowError(
      () => validateAliceWorkflowState({
        schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
        scorekeepers: [{ name: "score", initialValue: "10" }],
        timekeepers: [],
        visibleBindings: [],
      }),
      "invalid-score-value",
      "aliceWorkflow.scorekeepers[0].initialValue",
    );
    expectWorkflowError(
      () => addTimekeeper(addScorekeeper(workflow, { name: "score" }), { name: "score" }),
      "duplicate-name",
      "aliceWorkflow.timekeepers[0].name",
    );
    expectWorkflowError(
      () => validateAliceWorkflowState({
        schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
        scorekeepers: [],
        timekeepers: [{ name: "elapsedTime", initialValue: 5 }],
        visibleBindings: [],
      }),
      "unexpected-field",
      "aliceWorkflow.timekeepers[0].initialValue",
    );
  });

  it("rejects invalid visible bindings before rendering or persistence", () => {
    const workflow = addScorekeeper(createDefaultAliceWorkflowState(), { name: "score" });

    expectWorkflowError(
      () => bindVisibleWorkflowState(workflow, {
        id: "score-label",
        kind: "score",
        sourceName: "missingScore",
        target: "world-overlay",
        label: "Score",
      }),
      "missing-binding-source",
      "aliceWorkflow.visibleBindings[0].sourceName",
    );
    expectWorkflowError(
      () => bindVisibleWorkflowState(workflow, {
        id: "score-label",
        kind: "score",
        sourceName: "score",
        target: "raw-dom",
        label: "Score",
      }),
      "invalid-binding",
      "aliceWorkflow.visibleBindings[0].target",
    );
    expectWorkflowError(
      () => bindVisibleWorkflowState(workflow, {
        id: "score-label",
        kind: "score",
        sourceName: "score",
        target: "world-overlay",
        label: "Score",
        format: "seconds-one-decimal",
      }),
      "invalid-binding",
      "aliceWorkflow.visibleBindings[0].format",
    );
  });

  it("rejects unexpected and dangerous manifest keys", () => {
    expectWorkflowError(
      () => validateAliceWorkflowState({
        schemaVersion: ALICE_WORKFLOW_STATE_SCHEMA_VERSION,
        scorekeepers: [],
        timekeepers: [],
        visibleBindings: [],
        nickname: "not workflow state",
      }),
      "unexpected-field",
      "aliceWorkflow.nickname",
    );
    expectWorkflowError(
      () => validateAliceWorkflowState(JSON.parse(`{
        "schemaVersion": "alice-web.workflow-state/v1",
        "scorekeepers": [],
        "timekeepers": [],
        "visibleBindings": [],
        "__proto__": { "polluted": true }
      }`)),
      "unexpected-field",
      "aliceWorkflow.__proto__",
    );
  });

  it("resolves visible state as text-only values without HTML fields", () => {
    let workflow = createDefaultAliceWorkflowState();
    workflow = addScorekeeper(workflow, { name: "score" });
    workflow = bindVisibleWorkflowState(workflow, {
      id: "score-label",
      kind: "score",
      sourceName: "score",
      target: "world-overlay",
      label: "Score <img src=x onerror=alert(1)>",
      format: "integer",
    });

    const visible = resolveVisibleWorkflowBindings(workflow, {
      scoreValues: { score: 3 },
    });

    expect(visible).toEqual([
      expect.objectContaining({
        text: "Score <img src=x onerror=alert(1)>: 3",
      }),
    ]);
    expect(visible[0]).not.toHaveProperty("html");
  });
});

describe("ProjectRunner scorekeeper and timekeeper workflow integration", () => {
  it("publishes score and elapsed time bindings while a world run evaluates Alice numeric assignments", async () => {
    const workflow = createBoundWorkflow();
    const unit = new TweedleCompiler().compile(`class ScoreWorld {
      WholeNumber score <- 0;

      void main() {
        this.score <- this.score + 10;
      }
    }`, "ScoreWorld.tweedle");

    expect(unit.errors).toEqual([]);

    const runner = new ProjectRunner({
      tickMs: 16,
      aliceWorkflow: workflow,
    });
    const result = await runner.run({
      units: [unit],
      entryPoint: "ScoreWorld.main",
      aliceWorkflow: workflow,
    });

    expect(result.success).toBe(true);
    expect(result.scoreValues.get("score")).toBe(10);
    expect(result.visibleWorkflowBindings).toEqual([
      expect.objectContaining({ id: "score-label", text: "Score: 10", value: 10 }),
      expect.objectContaining({ id: "time-label", text: expect.stringMatching(/^Time: (?!0\.0$)\d+\.\d$/) }),
    ]);
    expect(result.executionTimeMs).toBeGreaterThan(0);
  });
});
