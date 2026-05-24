import { describe, expect, it } from "vitest";
import type { AliceMethod, AliceObject, AliceProject, AliceStatement } from "../src/a3p-parser.js";
import { executeProject } from "../src/tweedle-vm.js";

function object(name: string): AliceObject {
  return {
    name,
    typeName: "org.lgna.story.SBiped",
    resourceType: null,
    position: null,
    orientation: null,
    size: null,
  };
}

function procedure(name: string, statements: AliceStatement[]): AliceMethod {
  return { name, isFunction: false, returnType: "void", parameters: [], statements };
}

function project(methods: AliceMethod[]): AliceProject {
  return {
    version: "3.10",
    projectName: "ParityProject",
    sceneObjects: [object("bunny")],
    methods,
  };
}

function methodCall(objectName: string, method: string): AliceStatement {
  return { kind: "MethodCall", object: objectName, method, arguments: [] };
}

describe("tweedle-vm parity gaps", () => {
  it("dispatches methods using the runtime entity type", () => {
    const result = executeProject({
      version: "3.10",
      projectName: "DispatchProject",
      sceneObjects: [object("pet")],
      methods: [procedure("run", [{ kind: "MethodCall", object: "pet", method: "speak", arguments: [] }])],
      types: [
        {
          name: "Animal",
          methods: [
            { name: "speak", isFunction: false, returnType: "void", parameters: [], statements: [{ kind: "MethodCall", object: "this", method: "animalImpl", arguments: [] }] },
            { name: "animalImpl", isFunction: false, returnType: "void", parameters: [], statements: [{ kind: "MethodCall", object: "pet", method: "growl", arguments: [] }] },
          ],
        },
        {
          name: "org.lgna.story.SBiped",
          superTypeName: "Animal",
          methods: [
            { name: "speak", isFunction: false, returnType: "void", parameters: [], statements: [{ kind: "MethodCall", object: "this", method: "dogImpl", arguments: [] }] },
            { name: "dogImpl", isFunction: false, returnType: "void", parameters: [], statements: [{ kind: "MethodCall", object: "pet", method: "wagTail", arguments: [] }] },
          ],
        },
      ],
    });

    const methodDetails = result.execution_log.filter((entry) => entry.kind === "MethodCall").map((entry) => entry.detail);
    expect(methodDetails.some((detail) => detail.includes("wagTail"))).toBe(true);
    expect(methodDetails.some((detail) => detail.includes("growl"))).toBe(false);
  });

  it("runs field initializers before derived constructors in base-to-derived order", () => {
    const result = executeProject({
      version: "3.10",
      projectName: "ConstructorProject",
      sceneObjects: [{ ...object("pet"), constructorArgs: [] }],
      methods: [procedure("run", [{ kind: "ReturnStatement", expression: "pet.order" }])],
      types: [
        {
          name: "BaseThing",
          fields: [{ name: "order", initializer: '"base-field"' }],
          constructors: [
            { name: "BaseThing", isFunction: false, returnType: "void", parameters: [], statements: [{ kind: "VariableAssignment", name: "this.order", value: 'this.order .. "|base-ctor"' }] },
          ],
        },
        {
          name: "org.lgna.story.SBiped",
          superTypeName: "BaseThing",
          fields: [{ name: "order", initializer: 'this.order .. "|derived-field"' }],
          constructors: [
            { name: "SBiped", isFunction: false, returnType: "void", parameters: [], statements: [{ kind: "VariableAssignment", name: "this.order", value: 'this.order .. "|derived-ctor"' }] },
          ],
        },
      ],
    });

    expect(result.returnValues.get("run")).toBe("base-field|base-ctor|derived-field|derived-ctor");
  });

  it("handles try/catch around thrown exceptions", () => {
    const result = executeProject(project([
      procedure("run", [
        {
          kind: "TryCatch",
          tryBody: [{ kind: "ThrowStatement", expression: '"boom"', varType: "Exception" }],
          catchBody: [methodCall("bunny", "recover")],
          catchType: "Exception",
          catchVariable: "e",
        },
      ]),
    ]));

    expect(result.execution_log.some((entry) => entry.detail.includes("recover"))).toBe(true);
  });

  it("executes doInOrder bodies sequentially", () => {
    const result = executeProject(project([
      procedure("run", [
        {
          kind: "DoInOrder",
          body: [methodCall("bunny", "move"), methodCall("bunny", "turn")],
        },
      ]),
    ]));

    expect(result.execution_log.find((entry) => entry.kind === "DoInOrder")).toBeTruthy();
    expect(result.execution_log.filter((entry) => entry.kind === "MethodCall")).toHaveLength(2);
  });

  it("executes doTogether bodies with isolated parallel semantics", () => {
    const result = executeProject(project([
      procedure("run", [
        { kind: "VariableDeclaration", name: "x", varType: "Boolean", value: "false" },
        { kind: "VariableDeclaration", name: "seen", varType: "TextString", value: '"unset"' },
        {
          kind: "DoTogether",
          body: [
            { kind: "VariableAssignment", name: "x", value: "true" },
            {
              kind: "IfElse",
              condition: "x",
              ifBody: [{ kind: "VariableAssignment", name: "seen", value: '"updated"' }],
              elseBody: [{ kind: "VariableAssignment", name: "seen", value: '"original"' }],
            },
          ],
        },
        { kind: "ReturnStatement", expression: "seen" },
      ]),
    ]));

    expect(result.execution_log.find((entry) => entry.kind === "DoTogether")).toBeTruthy();
    expect(result.returnValues.get("run")).toBe("original");
  });

  it("supports array literals and indexed returns", () => {
    const result = executeProject(project([
      procedure("run", [
        { kind: "VariableDeclaration", name: "values", varType: "WholeNumber[]", value: "[1, 2, 3]" },
        { kind: "ReturnStatement", expression: "values[1]" },
      ]),
    ]));

    expect(result.returnValues.get("run")).toBe("2");
  });

  it("supports new-array creation and indexed assignment", () => {
    const result = executeProject(project([
      procedure("run", [
        { kind: "VariableDeclaration", name: "values", varType: "WholeNumber[]", value: "new WholeNumber[3]" },
        { kind: "VariableAssignment", name: "values[1]", value: "42" },
        { kind: "ReturnStatement", expression: "values[1]" },
      ]),
    ]));

    expect(result.returnValues.get("run")).toBe("42");
  });
});
