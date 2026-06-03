import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import type { AliceObject } from "../src/a3p-parser.js";
import { SceneGraph, VisualNode } from "../src/scene-graph.js";
import type { RuntimeObject, VMState } from "../src/tweedle-vm-core-types.js";
import { VmSceneBridge } from "../src/vm-scene-bridge.js";

function source(name: string, typeName = "SProp"): AliceObject {
  return {
    name,
    typeName,
    resourceType: null,
    position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    size: { width: 1, height: 1, depth: 1 },
  };
}

function runtimeObject(name: string, typeName = "SProp"): RuntimeObject {
  return {
    name,
    typeName,
    fields: new Map(),
    source: source(name, typeName),
  };
}

function stubState(): VMState {
  return {
    stepCounter: 0,
    depth: 0,
    log: [],
    returned: false,
    returnValue: undefined,
    scopes: [new Map()],
    runtime: {
      globalScope: new Map(),
      classRegistry: new Map(),
      methodTable: new Map(),
      objectTable: new Map(),
    },
    methodMap: new Map(),
    typeMap: new Map(),
    objectMap: new Map(),
    currentSelf: null,
    returnValues: new Map(),
    listenerMap: new Map(),
    sceneBridge: null,
  };
}

const originalGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  HTMLElement: globalThis.HTMLElement,
};

let dom: JSDOM;

beforeAll(() => {
  dom = new JSDOM("<!doctype html><html><body><div id=overlay></div></body></html>");
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
  });
});

afterAll(() => {
  dom.window.close();
  Object.assign(globalThis, originalGlobals);
});

describe("vm-scene-bridge", () => {
  it("registers entities and returns their scene nodes", () => {
    const sceneGraph = new SceneGraph();
    const bunny = new VisualNode("bunny");
    sceneGraph.root.addChild(bunny);

    const bridge = new VmSceneBridge();
    bridge.registerEntity("bunny", bunny);

    expect(bridge.getNodeForEntity("bunny")).toBe(bunny);
    expect(bridge.getNodeForEntity("missing")).toBeNull();
  });

  it("intercepts transform and material methods and updates the scene node", () => {
    const sceneGraph = new SceneGraph();
    const bunny = new VisualNode("bunny");
    sceneGraph.root.addChild(bunny);

    const bridge = new VmSceneBridge();
    bridge.registerEntity("bunny", bunny);
    const state = stubState();
    const entity = runtimeObject("bunny");

    expect(bridge.handleMethodCall(entity, "move", ["FORWARD", 2], state)).toBe(true);
    expect(bunny.worldTransform.position).toEqual({ x: 0, y: 0, z: -2 });

    bridge.handleMethodCall(entity, "turn", ["LEFT", 0.25], state);
    expect(bunny.localTransform.orientation.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(bunny.localTransform.orientation.w).toBeCloseTo(Math.SQRT1_2, 5);

    bridge.handleMethodCall(entity, "resize", [2], state);
    expect(bunny.localTransform.scale).toEqual({ x: 2, y: 2, z: 2 });

    bridge.handleMethodCall(entity, "setColor", ["#ff0000"], state);
    bridge.handleMethodCall(entity, "setOpacity", [0.4], state);
    expect(bunny.color).toEqual({ r: 1, g: 0, b: 0 });
    expect(bunny.opacity).toBeCloseTo(0.4, 5);
  });

  it("creates speech bubble overlays for say calls", () => {
    const sceneGraph = new SceneGraph();
    const bunny = new VisualNode("bunny");
    sceneGraph.root.addChild(bunny);
    bunny.localTransform = {
      ...bunny.localTransform,
      position: { x: 1, y: 2, z: 0 },
    };

    const overlay = document.getElementById("overlay") as HTMLElement;
    const bridge = new VmSceneBridge({ overlayContainer: overlay });
    bridge.registerEntity("bunny", bunny);

    bridge.handleMethodCall(runtimeObject("bunny"), "say", ["hello"], stubState());

    const element = bridge.getSpeechBubbleElement("bunny");
    expect(element).not.toBeNull();
    expect(element?.textContent).toBe("hello");
    expect(element?.dataset.entityId).toBe("bunny");
    expect(element?.style.left).toBe("100px");
    expect(element?.style.top).toBe("-300px");
  });

  it("reparents entities with setVehicle while preserving world position", () => {
    const sceneGraph = new SceneGraph();
    const car = new VisualNode("car");
    const bunny = new VisualNode("bunny");
    car.localTransform = {
      ...car.localTransform,
      position: { x: 10, y: 0, z: 0 },
    };
    bunny.localTransform = {
      ...bunny.localTransform,
      position: { x: 1, y: 0, z: -3 },
    };
    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(bunny);

    const bridge = new VmSceneBridge();
    bridge.registerEntity("car", car);
    bridge.registerEntity("bunny", bunny);

    bridge.handleMethodCall(runtimeObject("bunny"), "setVehicle", [runtimeObject("car")], stubState());

    expect(bunny.parent).toBe(car);
    expect(bunny.worldTransform.position).toEqual({ x: 1, y: 0, z: -3 });
    expect(bunny.localTransform.position.x).toBeCloseTo(-9, 5);
  });
});
