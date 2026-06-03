import { describe, expect, it } from "vitest";
import type { AliceMethod, AliceObject, AliceProject, AliceStatement, AliceTypeDefinition } from "../src/a3p-parser.js";
import { createVmSceneRuntime } from "../src/vm-scene-bridge.js";

function object(name: string, typeName = "SProp", position = { x: 0, y: 0, z: 0 }): AliceObject {
  return {
    name,
    typeName,
    resourceType: null,
    position,
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    size: { width: 1, height: 1, depth: 1 },
  };
}

function methodCall(objectName: string, method: string, args: string[] = []): AliceStatement {
  return {
    kind: "MethodCall",
    object: objectName,
    method,
    arguments: args,
  };
}

function procedure(name: string, statements: AliceStatement[]): AliceMethod {
  return {
    name,
    isFunction: false,
    returnType: "void",
    parameters: [],
    statements,
  };
}

function project(sceneObjects: AliceObject[], methods: AliceMethod[], types: AliceTypeDefinition[] = []): AliceProject {
  return {
    version: "3.10",
    projectName: "VmSceneIntegration",
    sceneObjects,
    methods,
    types,
  };
}

describe("vm scene integration", () => {
  it("creates scene nodes and applies VM move and turn statements through the bridge", () => {
    const runtime = createVmSceneRuntime(project(
      [object("bunny"), object("car")],
      [procedure("run", [
        methodCall("bunny", "move", ["FORWARD", "2", "1"]),
        methodCall("bunny", "turn", ["LEFT", "0.25", "1"]),
        methodCall("car", "move", ["RIGHT", "4", "1"]),
      ])],
    ));

    const result = runtime.executeProject();
    const bunny = runtime.bridge.getNodeForEntity("bunny");
    const car = runtime.bridge.getNodeForEntity("car");

    expect(runtime.entityNodes.size).toBe(2);
    expect(result.execution_log.filter((entry) => entry.kind === "MethodCall")).toHaveLength(3);
    expect(bunny?.worldTransform.position).toEqual({ x: 0, y: 0, z: 0 });

    runtime.animationLoop.step(500);
    expect(bunny?.worldTransform.position.z).toBeCloseTo(-1, 5);
    expect(car?.worldTransform.position.x).toBeCloseTo(2, 5);

    runtime.animationLoop.step(500);
    expect(bunny?.worldTransform.position.z).toBeCloseTo(-2, 5);
    expect(car?.worldTransform.position.x).toBeCloseTo(4, 5);

    runtime.animationLoop.step(1000);
    expect(bunny?.worldTransform.orientation.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(bunny?.worldTransform.orientation.w).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it("starts the animation loop for runWorld and pauses it on stop", () => {
    const worldType: AliceTypeDefinition = {
      name: "World",
      methods: [procedure("run", [methodCall("this", "move", ["FORWARD", "1", "1"])])],
      constructors: [],
      fields: [],
    };

    const runtime = createVmSceneRuntime(project(
      [object("world", "World")],
      [],
      [worldType],
    ));

    runtime.runWorld({ receiverName: "world", entryMethod: "run" });
    expect(runtime.animationLoop.state).toBe("playing");

    runtime.stop();
    expect(runtime.animationLoop.state).toBe("paused");
  });
});
