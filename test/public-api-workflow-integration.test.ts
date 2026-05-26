import { beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import * as PublicApi from "../src/index.js";

type TypeRef = {
  type: string;
  name?: string;
  raw?: string;
  isArray?: boolean;
  arrayDimensions?: number;
};
type ExpressionInput = Parameters<typeof PublicApi.TweedleCodegen.generateExpression>[0];
type MethodDecl = ReturnType<typeof PublicApi.TweedleParser.parseTweedle>["methods"][number];
type Statement = MethodDecl["body"][number];
type AliceStatementLike = {
  kind: string;
  object?: string;
  method?: string;
  arguments?: string[];
  expression?: string;
  name?: string;
  value?: string;
  body?: AliceStatementLike[];
  ifBody?: AliceStatementLike[];
  elseBody?: AliceStatementLike[];
};
type AliceMethodLike = {
  name: string;
  isFunction: boolean;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  statements: AliceStatementLike[];
};

beforeAll(() => {
  if (typeof globalThis.DOMParser === "undefined") {
    globalThis.DOMParser = new JSDOM().window.DOMParser;
  }
});

function convertTypeRefToName(typeRef: TypeRef): string {
  switch (typeRef.type) {
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return typeRef.raw ?? "Object";
    case "SimpleTypeRef": {
      const dimensions = typeRef.arrayDimensions ?? (typeRef.isArray ? 1 : 0);
      return `${typeRef.name ?? "Object"}${"[]".repeat(dimensions)}`;
    }
    default:
      return "Object";
  }
}

function expressionToSource(expression: ExpressionInput): string {
  return PublicApi.TweedleCodegen.generateExpression(expression);
}

function convertExpressionStatement(expression: ExpressionInput & {
  type: string;
  target?: ExpressionInput;
  methodName?: string;
  arguments?: Array<{ value: ExpressionInput }>;
  value?: ExpressionInput;
}): AliceStatementLike {
  switch (expression.type) {
    case "Assignment":
      return {
        kind: "VariableAssignment",
        name: expressionToSource(expression.target as ExpressionInput),
        value: expressionToSource(expression.value as ExpressionInput),
      };
    case "MethodInvocation":
      return {
        kind: "MethodCall",
        object: expression.target ? expressionToSource(expression.target) : "this",
        method: expression.methodName,
        arguments: (expression.arguments ?? []).map((argument) => expressionToSource(argument.value)),
      };
    default:
      return { kind: "Comment", expression: expressionToSource(expression) };
  }
}

function convertStatement(statement: Statement): AliceStatementLike {
  switch (statement.type) {
    case "Return":
      return {
        kind: "ReturnStatement",
        expression: statement.expression ? expressionToSource(statement.expression as ExpressionInput) : undefined,
      };
    case "ExpressionStatement":
      return convertExpressionStatement(statement.expression as ExpressionInput & {
        type: string;
        target?: ExpressionInput;
        methodName?: string;
        arguments?: Array<{ value: ExpressionInput }>;
        value?: ExpressionInput;
      });
    case "DoInOrder":
      return { kind: "DoInOrder", body: statement.body.map(convertStatement) };
    default:
      return { kind: "Comment", expression: statement.type };
  }
}

function convertMethod(method: MethodDecl): AliceMethodLike {
  return {
    name: method.name,
    isFunction: convertTypeRefToName(method.returnType as TypeRef) !== "void",
    returnType: convertTypeRefToName(method.returnType as TypeRef),
    parameters: method.parameters.map((parameter) => ({
      name: parameter.name,
      type: convertTypeRefToName(parameter.paramType as TypeRef),
    })),
    statements: method.body.map(convertStatement),
  };
}

function addSceneObject(
  project: ReturnType<typeof PublicApi.ProjectTemplate.createProjectFromTemplate>["project"],
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

describe("public API workflow integration", () => {
  it("creates a project, adds entities, writes a method, executes it, and verifies the result via src/index", async () => {
    const archive = PublicApi.ProjectTemplate.createProjectFromTemplate("empty-world", {
      projectName: "PublicApiWorkflowWorld",
    });
    addSceneObject(archive.project, "hero", "org.lgna.story.SBiped", 0, 0);
    addSceneObject(archive.project, "goal", "org.lgna.story.SProp", 2, -1);

    const parsedScript = PublicApi.TweedleParser.parseTweedle(`class WorkflowScript {
      TextString runScenario() {
        hero.state <- "ready";
        goal.state <- hero.state;
        return hero.state .. ":" .. goal.state;
      }
    }`);
    const methods = parsedScript.methods.map(convertMethod);
    archive.project.methods.push(...methods);

    const bytes = await PublicApi.ProjectIo.writeProject(archive);
    const roundTrip = await PublicApi.ProjectIo.readProject(bytes);
    const world = PublicApi.StoryApi.buildStoryWorld(roundTrip.project);
    const result = PublicApi.TweedleVm.executeProject({
      ...roundTrip.project,
      methods,
    });

    expect(world.summary.projectName).toBe("PublicApiWorkflowWorld");
    expect(world.summary.entityNames).toEqual(["hero", "goal"]);
    expect(result.returnValues.get("runScenario")).toBe("ready:ready");
    expect(
      result.execution_log.some(
        (entry) => entry.kind === "VariableAssignment" && entry.detail.includes("goal.state = ready"),
      ),
    ).toBe(true);
  });

  it("serializes a project and exports HTML with the expected structure via src/index", async () => {
    const archive = PublicApi.ProjectTemplate.createProjectFromTemplate("empty-world", {
      projectName: "PublicApiExportWorld",
    });
    addSceneObject(archive.project, "bunny", "org.lgna.story.SBiped", 1, -2);
    addSceneObject(archive.project, "tree", "org.lgna.story.SProp", -2, 1);
    archive.project.methods.push({
      name: "myFirstMethod",
      isFunction: false,
      returnType: "void",
      parameters: [],
      statements: [
        {
          kind: "MethodCall",
          object: "bunny",
          method: "jump",
          arguments: ["2"],
        },
      ],
    });

    const serialized = await PublicApi.ProjectIo.writeProject(archive);
    const roundTrip = await PublicApi.ProjectIo.readProject(serialized);
    const html = PublicApi.ExportHtml.exportProjectToHtml(roundTrip.project, {
      title: "Public API HTML Export",
    });
    const dom = new JSDOM(html);
    const { document } = dom.window;

    expect(document.title).toBe("Public API HTML Export");
    expect(document.querySelector("main.alice-export__layout")).not.toBeNull();
    expect(document.querySelector("[data-alice-scene]")).not.toBeNull();
    expect(document.querySelector(".alice-export__source-panel")).not.toBeNull();
    expect(document.getElementById("alice-project-data")?.textContent).toContain("PublicApiExportWorld");
    expect(document.getElementById("alice-tweedle-source")?.textContent).toContain("myFirstMethod");
    expect(document.querySelectorAll("script[src], link[rel='stylesheet']")).toHaveLength(0);
  });

  it("validates a project, fixes the introduced XML error, and re-validates cleanly via src/index", async () => {
    const archive = PublicApi.ProjectTemplate.createProjectFromTemplate("empty-world", {
      projectName: "PublicApiValidationWorld",
    });
    addSceneObject(archive.project, "groundMarker", "org.lgna.story.SMarker", 0, 0);

    const serialized = await PublicApi.ProjectIo.writeProject(archive);
    const roundTrip = await PublicApi.ProjectIo.readProject(serialized);
    const detachedProject = { ...roundTrip.project };

    const brokenResult = await PublicApi.ProjectValidation.validateProject(detachedProject);
    expect(brokenResult.valid).toBe(false);
    expect(brokenResult.errors.some((error) => error.code === "missing-source-xml")).toBe(true);
    expect(brokenResult.errors.some((error) => error.message.includes("original Alice project XML source"))).toBe(true);

    const fixedResult = await PublicApi.ProjectValidation.validateProjectArchive(roundTrip);

    expect(fixedResult.valid).toBe(true);
    expect(fixedResult.errors).toEqual([]);
  });
});
