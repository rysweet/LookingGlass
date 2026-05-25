import { beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import {
  ClassDeclaration,
  ExpressionStatement,
  FieldDeclaration,
  MethodDeclaration,
  MethodInvocation,
  ReturnStatement,
  StringLiteral,
  ThisExpression,
  type TypeRef,
} from "../src/ast-nodes.js";
import type { AliceMethod, AliceProject, AliceStatement } from "../src/a3p-parser.js";
import { createProjectFromTemplate } from "../src/project-template.js";
import { readProject, writeProject } from "../src/project-io.js";
import { easeInOut } from "../src/animation.js";
import { generateJavaSource } from "../src/code-generation.js";
import { buildStoryWorld } from "../src/story-api/index.js";
import { parseTweedle, type Expression, type MethodDecl, type Statement } from "../src/tweedle-parser.js";
import { executeProject } from "../src/tweedle-vm.js";
import { generateExpression } from "../src/tweedle-codegen.js";

beforeAll(() => {
  if (typeof globalThis.DOMParser === "undefined") {
    globalThis.DOMParser = new JSDOM().window.DOMParser;
  }
});

function simpleType(name: string, isArray = false): TypeRef {
  return { type: "SimpleTypeRef", name, isArray };
}

function typeRefToName(typeRef: TypeRef): string {
  switch (typeRef.type) {
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return typeRef.raw;
    case "SimpleTypeRef": {
      const dimensions = (typeRef as TypeRef & { arrayDimensions?: number }).arrayDimensions ?? (typeRef.isArray ? 1 : 0);
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

function addSceneObject(project: AliceProject, name: string, typeName: string, x: number, z: number): void {
  project.sceneObjects.push({
    name,
    typeName,
    resourceType: null,
    position: { x, y: 0, z },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    size: { width: 1, height: 1, depth: 1 },
  });
}

describe("comprehensive end-to-end integration", () => {
  it("parses Tweedle, executes the resulting project, animates entities, and verifies final scene state", async () => {
    const archive = createProjectFromTemplate("empty-world", {
      projectName: "AnimatedPipelineWorld",
    });

    addSceneObject(archive.project, "hero", "org.lgna.story.SBiped", 0, 0);
    addSceneObject(archive.project, "goal", "org.lgna.story.SProp", 2, -1);

    const script = parseTweedle(`class AnimatedPipeline {
      TextString runScenario() {
        hero.state <- "ready";
        goal.state <- hero.state;
        return hero.state .. ":" .. goal.state;
      }
    }`);
    archive.project.methods.push(...script.methods.map(convertMethod));

    const bytes = await writeProject(archive);
    const roundTrip = await readProject(bytes);
    const world = buildStoryWorld(roundTrip.project);
    const result = executeProject({
      ...roundTrip.project,
      methods: script.methods.map(convertMethod),
    });

    expect(world.summary.projectName).toBe("AnimatedPipelineWorld");
    expect(world.summary.entityNames).toEqual(["hero", "goal"]);
    expect(result.returnValues.get("runScenario")).toBe("ready:ready");

    const hero = world.scene.getEntity("hero") as unknown as {
      position: { x: number; y: number; z: number };
      move: (direction: string, amount: number, duration?: number, style?: typeof easeInOut) => {
        update: (deltaMs: number) => { complete: boolean };
      } | null;
    };
    const startZ = hero.position.z;
    const move = hero.move("FORWARD", 4, 1.0, easeInOut);

    expect(move).not.toBeNull();
    expect(move?.update(500).complete).toBe(false);
    expect(hero.position.z).toBeLessThan(startZ);
    expect(move?.update(500).complete).toBe(true);
    expect(hero.position.z).toBeCloseTo(startZ - 4, 5);
  });

  it("creates a project with scene entities, serializes it, deserializes it, and preserves project resources", async () => {
    const archive = createProjectFromTemplate("empty-world", {
      projectName: "RoundTripWorld",
    });
    archive.manifest = { author: "integration-test", aliceVersion: archive.project.version };
    archive.thumbnail = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    archive.resources.set("resources/models/hero.obj", new Uint8Array([1, 2, 3]));
    archive.resources.set("resources/audio/fanfare.wav", new Uint8Array([4, 5, 6, 7]));
    addSceneObject(archive.project, "hero", "org.lgna.story.SBiped", 0, 0);
    addSceneObject(archive.project, "cameraMarker", "org.lgna.story.SMarker", 3, 2);

    const bytes = await writeProject(archive);
    const roundTrip = await readProject(bytes);
    const world = buildStoryWorld(roundTrip.project);

    expect(roundTrip.project.projectName).toBe("RoundTripWorld");
    expect(roundTrip.manifest).toMatchObject({ author: "integration-test" });
    expect(roundTrip.thumbnail).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    expect(roundTrip.resources.get("resources/models/hero.obj")).toEqual(new Uint8Array([1, 2, 3]));
    expect(roundTrip.resources.get("resources/audio/fanfare.wav")).toEqual(new Uint8Array([4, 5, 6, 7]));
    expect(world.summary.entityNames).toEqual(["hero", "cameraMarker"]);
    expect(world.summary.objectCount).toBe(2);
  });

  it("builds Java source from AST and matches the expected end-to-end output", () => {
    const ast = new ClassDeclaration(
      "StoryBridge",
      "Object",
      null,
      "@Public",
      [],
      [
        new MethodDeclaration(
          "play",
          { type: "VoidTypeRef" },
          [],
          [
            new ExpressionStatement(
              new MethodInvocation(new ThisExpression(simpleType("StoryBridge")), "say", [
                { name: null, value: new StringLiteral("Hello from Alice") },
              ]),
            ),
            new ReturnStatement(null),
          ],
          false,
          "@Public",
        ),
      ],
      [
        new FieldDeclaration("label", simpleType("String"), new StringLiteral("Bridge"), false, false, "@Private"),
      ],
    );

    expect(generateJavaSource(ast)).toBe(
      "public class StoryBridge {\n"
      + "  private String label = \"Bridge\";\n\n"
      + "  public void play() {\n"
      + "    this.say(\"Hello from Alice\");\n"
      + "    return;\n"
      + "  }\n"
      + "}",
    );
  });
});
