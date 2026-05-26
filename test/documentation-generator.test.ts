import { describe, expect, it } from "vitest";
import type { AliceProject } from "../src/a3p-parser";
import { createCurriculumMetadata } from "../src/curriculum";
import {
  documentFields,
  documentMethods,
  exportCustomTypeApiReference,
  generateLessonPlan,
  generateProjectDocumentation,
  generateProjectReadme,
} from "../src/documentation-generator";

const sampleProject: AliceProject = {
  version: "3.7",
  projectName: "Doc Demo",
  sceneObjects: [
    {
      name: "bunny",
      typeName: "org.lgna.story.SBiped",
      resourceType: "org.lgna.story.resources.biped.BunnyResource",
      position: { x: 0, y: 0, z: 0 },
      orientation: null,
      size: null,
    },
  ],
  methods: [
    {
      name: "myFirstMethod",
      isFunction: false,
      returnType: "void",
      parameters: [{ name: "distance", type: "Number" }],
      statements: [
        {
          kind: "DoInOrder",
          body: [
            { kind: "MethodCall", object: "bunny", method: "hop", arguments: ["distance"] },
            {
              kind: "IfElse",
              condition: "distance > 1",
              ifBody: [{ kind: "MethodCall", object: "bunny", method: "say", arguments: ["\"far\""] }],
              elseBody: [{ kind: "Comment", value: "close" }],
            },
          ],
        },
      ],
    },
    {
      name: "scoreLabel",
      isFunction: true,
      returnType: "TextString",
      parameters: [],
      statements: [
        { kind: "VariableDeclaration", name: "score", varType: "WholeNumber", value: "1" },
        { kind: "ReturnStatement", expression: "\"Score\"" },
      ],
    },
  ],
  types: [
    {
      name: "HelperBunny",
      superTypeName: "org.lgna.story.SBiped",
      fields: [
        {
          name: "energy",
          typeName: "WholeNumber",
          initializer: "5",
        },
      ],
      methods: [
        {
          name: "hopTwice",
          isFunction: false,
          returnType: "void",
          parameters: [],
          statements: [
            {
              kind: "DoInOrder",
              body: [
                { kind: "MethodCall", object: "this", method: "hop", arguments: ["1"] },
                { kind: "MethodCall", object: "this", method: "hop", arguments: ["1"] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("documentation generator", () => {
  it("auto-documents project methods and fields", () => {
    const methods = documentMethods(sampleProject);
    const fields = documentFields(sampleProject);

    expect(methods.map((method) => method.signature)).toEqual([
      "void myFirstMethod(distance: Number)",
      "TextString scoreLabel()",
      "void hopTwice()",
    ]);
    expect(methods[0]?.summary).toContain("DoInOrder");
    expect(methods[1]?.kind).toBe("function");

    expect(fields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "bunny",
        kind: "scene-object",
        resourceType: "org.lgna.story.resources.biped.BunnyResource",
      }),
      expect.objectContaining({
        name: "energy",
        ownerType: "HelperBunny",
        initializer: "5",
      }),
    ]));
  });

  it("generates a README from project structure", () => {
    const readme = generateProjectReadme(sampleProject, createCurriculumMetadata());

    expect(readme).toContain("# Doc Demo");
    expect(readme).toContain("## Project Structure");
    expect(readme).toContain("- bunny: org.lgna.story.SBiped");
    expect(readme).toContain("- Custom type HelperBunny");
    expect(readme).toContain("## Curriculum Alignment");
  });

  it("exports API reference content for custom types", () => {
    const apiReference = exportCustomTypeApiReference(sampleProject);

    expect(apiReference).toContain("# API Reference");
    expect(apiReference).toContain("## HelperBunny");
    expect(apiReference).toContain("- energy: WholeNumber = 5");
    expect(apiReference).toContain("- void hopTwice()");
  });

  it("derives a lesson plan from curriculum metadata", () => {
    const lessonPlan = generateLessonPlan(sampleProject, createCurriculumMetadata());

    expect(lessonPlan.coveredConceptIds).toEqual([
      "condition",
      "function",
      "method",
      "object",
      "scene",
      "sequence",
      "variable",
    ]);
    expect(lessonPlan.recommendedLessonIds).toEqual(["control-flow"]);
    expect(lessonPlan.entries.find((entry) => entry.lessonId === "abstractions")).toMatchObject({
      unlocked: false,
      missingConceptIds: [],
    });
  });

  it("bundles all generated artifacts together", () => {
    const documentation = generateProjectDocumentation(sampleProject, createCurriculumMetadata());

    expect(documentation.methods).toHaveLength(3);
    expect(documentation.fields).toHaveLength(2);
    expect(documentation.readme).toContain("Recommended lessons: control-flow");
    expect(documentation.apiReference).toContain("HelperBunny");
    expect(documentation.lessonPlan.recommendedLessonIds).toEqual(["control-flow"]);
  });
});
