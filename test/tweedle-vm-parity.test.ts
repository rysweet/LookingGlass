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

  it("executes doTogether bodies with deterministic fallback semantics", () => {
    const result = executeProject(project([
      procedure("run", [
        {
          kind: "DoTogether",
          body: [methodCall("bunny", "move"), methodCall("bunny", "say")],
        },
      ]),
    ]));

    expect(result.execution_log.find((entry) => entry.kind === "DoTogether")).toBeTruthy();
    expect(result.execution_log.filter((entry) => entry.kind === "MethodCall")).toHaveLength(2);
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
