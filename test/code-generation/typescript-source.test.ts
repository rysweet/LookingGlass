import { describe, expect, it } from "vitest";
import type { AliceProject } from "../../src/a3p-parser.js";
import {
  UnsupportedAliceRuntimeBehavior,
  generateTypeScriptSource,
} from "../../src/code-generation/typescript-source.js";
import { createMinimalProject } from "../test-utils.js";

function createExportFixture(): AliceProject {
  const project = createMinimalProject();
  project.projectName = "Dance Demo";
  project.sceneObjects.push(
    {
      name: "bunny",
      typeName: "org.lgna.story.SBiped",
      resourceType: "BUNNY",
      position: { x: 1, y: 2, z: 3 },
      orientation: null,
      size: { width: 1, height: 2, depth: 1 },
    },
    {
      name: "class",
      typeName: "org.lgna.story.SCamera",
      resourceType: null,
      position: { x: 0, y: 1, z: 2 },
      orientation: null,
      size: null,
    },
    {
      name: "class!",
      typeName: "org.lgna.story.SGround",
      resourceType: null,
      position: null,
      orientation: null,
      size: null,
    },
  );
  project.methods.push({
    name: "my first method",
    isFunction: false,
    returnType: "void",
    parameters: [{ name: "target object", type: "Object" }],
    statements: [
      { kind: "MethodCall", object: "bunny", method: "jump", arguments: ["1"] },
      {
        kind: "CountLoop",
        count: 2,
        body: [{ kind: "MethodCall", object: "bunny", method: "turn", arguments: ["LEFT"] }],
      },
    ],
  });
  project.methods.push({
    name: "unsupportedTogether",
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements: [
      {
        kind: "DoTogether",
        body: [{ kind: "MethodCall", object: "bunny", method: "say", arguments: ["hi"] }],
      },
    ],
  });
  return project;
}

function entryContent(project: AliceProject, path: string): string {
  const entry = generateTypeScriptSource(project).entries.find((candidate) => candidate.path === path);
  if (!entry) {
    throw new Error(`Missing generated entry: ${path}`);
  }
  return entry.content;
}

describe("generateTypeScriptSource", () => {
  it("emits a deterministic Alice/alice-web TypeScript source manifest and stable entry list", () => {
    const project = createExportFixture();
    const first = generateTypeScriptSource(project);
    const second = generateTypeScriptSource(project);

    expect(first).toEqual(second);
    expect(first.manifest).toMatchObject({
      schemaVersion: "alice-web.typescript-source-manifest/v1",
      product: "alice-web",
      runtime: "Alice",
      projectName: "Dance Demo",
      entryPoint: "src/project.ts",
    });
    expect(first.manifest.files).toEqual(first.entries.map((entry) => entry.path));
    expect(first.entries.map((entry) => entry.path)).toEqual([
      "src/project.ts",
      "src/runtime.ts",
      "src/scene.ts",
      "src/procedures/myFirstMethod.ts",
      "src/procedures/unsupportedTogether.ts",
    ]);
    expect(first.entries.every((entry) => entry.content.trim().length > 0)).toBe(true);
  });

  it("generates inspectable project, scene, object, procedure, and function TypeScript", () => {
    const project = createExportFixture();
    const projectSource = entryContent(project, "src/project.ts");
    const sceneSource = entryContent(project, "src/scene.ts");
    const procedureSource = entryContent(project, "src/procedures/myFirstMethod.ts");

    expect(projectSource).toContain("export const projectName = \"Dance Demo\";");
    expect(projectSource).toContain("export function createAliceProject()");
    expect(projectSource).toContain("createScene()");
    expect(sceneSource).toContain("export interface AliceSceneObject");
    expect(sceneSource).toContain("export function createScene()");
    expect(sceneSource).toContain("bunny");
    expect(sceneSource).toContain("org.lgna.story.SBiped");
    expect(sceneSource).toContain("position: { x: 1, y: 2, z: 3 }");
    expect(procedureSource).toContain("export async function myFirstMethod");
    expect(procedureSource).toContain("targetObject");
    expect(procedureSource).toContain("await scene.objects.bunny.jump(1)");
    expect(procedureSource).toContain("for (let index = 0; index < 2; index += 1)");
    expect(procedureSource).not.toMatch(/placeholder|todo|not implemented/i);
  });

  it("sanitizes reserved words and disambiguates colliding Alice identifiers deterministically", () => {
    const sceneSource = entryContent(createExportFixture(), "src/scene.ts");

    expect(sceneSource).toContain("classObject");
    expect(sceneSource).toContain("classObject2");
    expect(sceneSource).not.toContain(" class:");
    expect(sceneSource).not.toContain(" class!:");
  });

  it("marks unsupported runtime behavior with an explicit named error in generated source", () => {
    const runtimeSource = entryContent(createExportFixture(), "src/runtime.ts");
    const unsupportedProcedure = entryContent(createExportFixture(), "src/procedures/unsupportedTogether.ts");

    expect(UnsupportedAliceRuntimeBehavior.name).toBe("UnsupportedAliceRuntimeBehavior");
    expect(runtimeSource).toContain("export class UnsupportedAliceRuntimeBehavior extends Error");
    expect(unsupportedProcedure).toContain("throw new UnsupportedAliceRuntimeBehavior");
    expect(unsupportedProcedure).toContain("DoTogether");
    expect(unsupportedProcedure).not.toMatch(/placeholder|silently ignored|TODO/i);
  });

  it("rejects empty or malformed project names instead of emitting misleading source", () => {
    const project = createMinimalProject();
    project.projectName = "   ";

    expect(() => generateTypeScriptSource(project)).toThrow(/project name/i);
  });
});
