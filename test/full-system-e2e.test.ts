import { beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import type { AliceMethod, AliceProject } from "../src/a3p-parser";
import {
  addScorekeeper,
  addTimekeeper,
  bindVisibleWorkflowState,
  createDefaultAliceWorkflowState,
  resolveVisibleWorkflowBindings,
} from "../src/alice-workflow-state.js";
import { ProjectManager } from "../src/project-manager";
import {
  buildGradeInputFromProject,
  gradeDimensions,
  gradeLesson,
} from "../src/grading-pipeline";
import { executeProject } from "../src/tweedle-vm";

beforeAll(() => {
  if (typeof globalThis.DOMParser === "undefined") {
    const window = new JSDOM().window;
    globalThis.DOMParser = window.DOMParser;
  }
});

function addSceneObject(
  project: AliceProject,
  name: string,
  typeName: string,
  x: number,
  z: number,
): void {
  project.sceneObjects.push({
    name,
    typeName,
    resourceType: null,
    position: { x, y: 0, z },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    size: { width: 1, height: 1, depth: 1 },
  });
}

function createExecutableMethods(): AliceMethod[] {
  return [
    {
      name: "bootstrapListeners",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [
        {
          kind: "EventListener",
          event: "SceneActivated",
          body: [
            {
              kind: "MethodCall",
              object: "hero",
              method: "say",
              arguments: ['"Ready to play"'],
            },
          ],
        },
      ],
    },
    {
      name: "awardPoints",
      isFunction: false,
      returnType: "void",
      parameters: [{ name: "amount", type: "WholeNumber" }],
      statements: [
        {
          kind: "VariableAssignment",
          name: "hero.score",
          value: "amount",
        },
      ],
    },
    {
      name: "runScenario",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [
        {
          kind: "VariableDeclaration",
          name: "steps",
          varType: "WholeNumber",
          value: "2",
        },
        {
          kind: "VariableDeclaration",
          name: "score",
          varType: "WholeNumber",
          value: "5",
        },
        {
          kind: "MethodCall",
          object: "hero",
          method: "move",
          arguments: ["FORWARD", "1.0"],
        },
        {
          kind: "CountLoop",
          count: 2,
          body: [
            {
              kind: "MethodCall",
              object: "hero",
              method: "turn",
              arguments: ["LEFT", "0.25"],
            },
            {
              kind: "IfElse",
              condition: "steps > 1 && score == 5 || false",
              ifBody: [
                {
                  kind: "VariableAssignment",
                  name: "hero.state",
                  value: '"ready"',
                },
                {
                  kind: "MethodCall",
                  object: "this",
                  method: "awardPoints",
                  arguments: ["score"],
                },
              ],
              elseBody: [
                {
                  kind: "VariableAssignment",
                  name: "hero.state",
                  value: '"waiting"',
                },
              ],
            },
          ],
        },
        {
          kind: "VariableAssignment",
          name: "goal.status",
          value: '"started"',
        },
      ],
    },
    {
      name: "reportState",
      isFunction: true,
      returnType: "TextString",
      parameters: [],
      statements: [
        {
          kind: "ReturnStatement",
          expression: 'hero.state .. ":" .. hero.score .. ":" .. goal.status',
        },
      ],
    },
  ];
}

describe("full system end-to-end", () => {
  it("creates, serializes, parses, executes, and grades a complete Alice project", async () => {
    const projectManager = new ProjectManager();
    const archive = projectManager.create();
    archive.project.projectName = "FullSystemWorld";

    addSceneObject(archive.project, "hero", "org.lgna.story.SBiped", 0, 0);
    addSceneObject(archive.project, "goal", "org.lgna.story.SProp", 3, -2);
    addSceneObject(archive.project, "guide", "org.lgna.story.SProp", -2, 1);

    const executableMethods = createExecutableMethods();
    archive.project.methods.push(...executableMethods);

    const a3pBytes = await projectManager.saveAs("full-system-world.a3p");

    const reopened = new ProjectManager();
    await reopened.open(a3pBytes, "full-system-world.a3p");
    const parsedProject = reopened.currentArchive!.project;

    expect(parsedProject.projectName).toBe("FullSystemWorld");
    expect(parsedProject.sceneObjects.map((object) => object.name)).toEqual([
      "hero",
      "goal",
      "guide",
    ]);
    expect(parsedProject.methods.map((method) => method.name)).toEqual([
      "bootstrapListeners",
      "awardPoints",
      "runScenario",
      "reportState",
    ]);

    const executableProject: AliceProject = {
      ...parsedProject,
      methods: executableMethods,
    };
    const execution = executeProject(executableProject);

    expect(execution.returnValues.get("reportState")).toBe("ready:5:started");
    expect(
      execution.execution_log.some(
        (entry) =>
          entry.kind === "VariableAssignment"
          && entry.detail.includes("hero.state = ready"),
      ),
    ).toBe(true);
    expect(
      execution.execution_log.some(
        (entry) =>
          entry.kind === "VariableAssignment"
          && entry.detail.includes("hero.score = 5"),
      ),
    ).toBe(true);

    const gradingInput = {
      ...buildGradeInputFromProject(executableProject),
      executionLog: execution.execution_log,
    };
    const dimensionResults = gradeDimensions(gradingInput);
    const lessonResults = Array.from({ length: 8 }, (_, index) =>
      gradeLesson(index + 1, gradingInput),
    );

    expect(dimensionResults.every((result) => result.passed)).toBe(true);
    expect(lessonResults.every((result) => result.passed)).toBe(true);
  });

  it("creates score and time variables, binds visible state, runs the world, and observes changed values", async () => {
    const projectManager = new ProjectManager();
    const archive = projectManager.create();
    archive.project.projectName = "ScoreTimeWorld";

    addSceneObject(archive.project, "hero", "org.lgna.story.SBiped", 0, 0);
    archive.project.methods.push({
      name: "runScoreTime",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [
        {
          kind: "VariableDeclaration",
          name: "score",
          varType: "WholeNumber",
          value: "0",
        },
        {
          kind: "VariableAssignment",
          name: "score",
          value: "score + 10",
        },
        {
          kind: "MethodCall",
          object: "hero",
          method: "say",
          arguments: ['"score changed"'],
        },
      ],
    });

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
    archive.aliceWorkflow = workflow;

    const initialVisible = resolveVisibleWorkflowBindings(workflow);
    expect(initialVisible).toEqual([
      expect.objectContaining({ id: "score-label", text: "Score: 0" }),
      expect.objectContaining({ id: "time-label", text: "Time: 0.0" }),
    ]);

    const a3pBytes = await projectManager.saveAs("score-time-world.a3p");
    const reopened = new ProjectManager();
    await reopened.open(a3pBytes, "score-time-world.a3p");

    expect(reopened.currentArchive?.aliceWorkflow).toEqual(workflow);

    const execution = executeProject(reopened.currentArchive!.project, {
      aliceWorkflow: reopened.currentArchive!.aliceWorkflow,
    });

    expect(execution.scoreValues.get("score")).toBe(10);
    expect(execution.visibleWorkflowBindings).toEqual([
      expect.objectContaining({ id: "score-label", text: "Score: 10", value: 10 }),
      expect.objectContaining({ id: "time-label", text: expect.stringMatching(/^Time: (?!0\.0$)\d+\.\d$/) }),
    ]);
  });
});
