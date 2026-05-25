import { beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import type { AliceMethod, AliceProject, AliceStatement } from "../src/a3p-parser.js";
import { parseA3P } from "../src/a3p-parser.js";
import { createProjectFromTemplate } from "../src/project-template.js";
import { writeProject } from "../src/project-io.js";
import { buildStoryWorld } from "../src/story-api/index.js";
import { generateExpression } from "../src/tweedle-codegen.js";
import { parseTweedle, type Expression, type MethodDecl, type Statement, type TypeRef } from "../src/tweedle-parser.js";
import { executeProject } from "../src/tweedle-vm.js";

beforeAll(() => {
  if (typeof globalThis.DOMParser === "undefined") {
    globalThis.DOMParser = new JSDOM().window.DOMParser;
  }
});

function typeRefToName(typeRef: TypeRef): string {
  switch (typeRef.type) {
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return typeRef.raw;
    case "SimpleTypeRef": {
      const dimensions = typeRef.arrayDimensions ?? (typeRef.isArray ? 1 : 0);
      return `${typeRef.name}${"[]".repeat(dimensions)}`;
    }
  }
}

function expressionToSource(expression: Expression): string {
  return generateExpression(expression);
}

function convertExpressionStatement(expression: Expression): AliceStatement {
  switch (expression.type) {
    case "Assignment":
      return {
        kind: "VariableAssignment",
        name: expressionToSource(expression.target),
        value: expressionToSource(expression.value),
      };
    case "MethodInvocation":
      return {
        kind: "MethodCall",
        object: expression.target ? expressionToSource(expression.target) : "this",
        method: expression.methodName,
        arguments: expression.arguments.map((argument) => expressionToSource(argument.value)),
      };
    default:
      return { kind: "Comment", expression: expressionToSource(expression) };
  }
}

function convertStatement(statement: Statement): AliceStatement {
  switch (statement.type) {
    case "Return":
      return {
        kind: "ReturnStatement",
        expression: statement.expression ? expressionToSource(statement.expression) : undefined,
      };
    case "ExpressionStatement":
      return convertExpressionStatement(statement.expression);
    case "DoInOrder":
      return { kind: "DoInOrder", body: statement.body.map(convertStatement) };
    default:
      return { kind: "Comment", expression: statement.type };
  }
}

function convertMethod(method: MethodDecl): AliceMethod {
  return {
    name: method.name,
    isFunction: typeRefToName(method.returnType) !== "void",
    returnType: typeRefToName(method.returnType),
    parameters: method.parameters.map((parameter) => ({
      name: parameter.name,
      type: typeRefToName(parameter.paramType),
    })),
    statements: method.body.map(convertStatement),
  };
}

function addSceneObject(project: AliceProject, name: string, typeName: string): void {
  project.sceneObjects.push({
    name,
    typeName,
    resourceType: null,
    position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    size: { width: 1, height: 1, depth: 1 },
  });
}

describe("full pipeline integration", () => {
  it("creates a project, adds entities, parses Tweedle methods, executes them, and preserves changed entity state", async () => {
    const archive = createProjectFromTemplate("empty-world", {
      projectName: "PipelineWorld",
    });

    addSceneObject(archive.project, "bunny", "org.lgna.story.SBiped");
    addSceneObject(archive.project, "prop", "org.lgna.story.SProp");

    const script = parseTweedle(`class PipelineScript {
      TextString runPipeline() {
        bunny.mood <- "hopped";
        prop.state <- bunny.mood;
        return prop.state;
      }

      TextString verifyPipeline() {
        return bunny.mood .. ":" .. prop.state;
      }
    }`);

    archive.project.methods.push(...script.methods.map(convertMethod));

    const bytes = await writeProject(archive);
    const parsedProject = await parseA3P(bytes);
    const world = buildStoryWorld(parsedProject);

    expect(world.summary.projectName).toBe("PipelineWorld");
    expect(world.summary.objectCount).toBe(2);
    expect(world.summary.entityNames).toEqual(["bunny", "prop"]);
    expect(parsedProject.methods.map((method) => method.name)).toEqual([
      "runPipeline",
      "verifyPipeline",
    ]);

    const executableProject: AliceProject = {
      ...parsedProject,
      methods: script.methods.map(convertMethod),
    };
    const result = executeProject(executableProject);

    expect(result.returnValues.get("runPipeline")).toBe("hopped");
    expect(result.returnValues.get("verifyPipeline")).toBe("hopped:hopped");
    expect(
      result.execution_log.some(
        (entry) => entry.kind === "VariableAssignment" && entry.detail.includes("bunny.mood = hopped"),
      ),
    ).toBe(true);
    expect(
      result.execution_log.some(
        (entry) => entry.kind === "VariableAssignment" && entry.detail.includes("prop.state = hopped"),
      ),
    ).toBe(true);
  });
});
