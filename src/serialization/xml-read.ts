import {
  DOMParser,
  type Document as XmlDocument,
  type Element as XmlElement,
} from "@xmldom/xmldom";
import type { AliceMethod, AliceObject, AliceProject, AliceStatement } from "../a3p-parser.js";
import type { BoundingBox, JointNode } from "../story-api/types.js";
import { SerializationError } from "./types.js";

export function deserializeFromXml(xml: string): AliceProject {
  let doc: XmlDocument;
  try {
    doc = new DOMParser().parseFromString(xml, "text/xml");
  } catch (error: unknown) {
    throw new SerializationError(`Malformed XML: ${error instanceof Error ? error.message : String(error)}`, "xml");
  }

  const root = doc.documentElement;
  if (!root || root.nodeName !== "alice-project") {
    throw new SerializationError(`Expected root element 'alice-project', got '${root?.nodeName ?? "none"}'`, "xml");
  }

  const version = root.getAttribute("version");
  const projectName = root.getAttribute("projectName");
  if (!version) throw new SerializationError("Missing version attribute", "xml");
  if (!projectName) throw new SerializationError("Missing projectName attribute", "xml");

  const sceneObjectsEl = getChild(root, "scene-objects");
  const methodsEl = getChild(root, "methods");
  if (!sceneObjectsEl) throw new SerializationError("Missing required element: scene-objects", "xml");
  if (!methodsEl) throw new SerializationError("Missing required element: methods", "xml");

  const project: AliceProject = {
    version,
    projectName,
    sceneObjects: getChildren(sceneObjectsEl, "scene-object").map(deserializeSceneObject),
    methods: getChildren(methodsEl, "method").map(deserializeMethod),
  };

  const jointHierarchyEl = getChild(root, "joint-hierarchy");
  if (jointHierarchyEl) project.jointHierarchy = getChildren(jointHierarchyEl, "joint").map(deserializeJoint);
  const boxesEl = getChild(root, "bounding-boxes");
  if (boxesEl) {
    project.boundingBoxes = {};
    for (const boxEl of getChildren(boxesEl, "bounding-box")) {
      project.boundingBoxes[boxEl.getAttribute("name")!] = deserializeBoundingBoxEl(boxEl);
    }
  }
  const refsEl = getChild(root, "texture-refs");
  if (refsEl) {
    project.textureRefs = getChildren(refsEl, "texture-ref").map((element) => element.getAttribute("path")!);
  }
  return project;
}

function deserializeSceneObject(el: XmlElement): AliceObject {
  const posEl = getChild(el, "position");
  const oriEl = getChild(el, "orientation");
  const sizeEl = getChild(el, "size");
  return {
    name: el.getAttribute("name")!,
    typeName: el.getAttribute("typeName")!,
    resourceType: el.getAttribute("resourceType"),
    position: posEl ? { x: Number(posEl.getAttribute("x")), y: Number(posEl.getAttribute("y")), z: Number(posEl.getAttribute("z")) } : null,
    orientation: oriEl ? { x: Number(oriEl.getAttribute("x")), y: Number(oriEl.getAttribute("y")), z: Number(oriEl.getAttribute("z")), w: Number(oriEl.getAttribute("w")) } : null,
    size: sizeEl ? { width: Number(sizeEl.getAttribute("width")), height: Number(sizeEl.getAttribute("height")), depth: Number(sizeEl.getAttribute("depth")) } : null,
  };
}

function deserializeMethod(el: XmlElement): AliceMethod {
  const paramsEl = getChild(el, "parameters");
  const statementsEl = getChild(el, "statements");
  return {
    name: el.getAttribute("name")!,
    isFunction: el.getAttribute("isFunction") === "true",
    returnType: el.getAttribute("returnType")!,
    parameters: paramsEl ? getChildren(paramsEl, "parameter").map((parameter) => ({ name: parameter.getAttribute("name")!, type: parameter.getAttribute("type")! })) : [],
    statements: statementsEl ? getChildren(statementsEl, "statement").map(deserializeStatementEl) : [],
  };
}

function deserializeStatementEl(el: XmlElement): AliceStatement {
  const statement: AliceStatement = { kind: el.getAttribute("kind")! };
  const assign = <K extends keyof AliceStatement>(key: K, value: AliceStatement[K] | null): void => {
    if (value !== null) statement[key] = value;
  };
  assign("object", el.getAttribute("object"));
  assign("method", el.getAttribute("method"));
  assign("count", el.getAttribute("count") !== null ? Number(el.getAttribute("count")) : null);
  assign("condition", el.getAttribute("condition"));
  assign("expression", el.getAttribute("expression"));
  assign("name", el.getAttribute("name"));
  assign("varType", el.getAttribute("varType"));
  assign("value", el.getAttribute("value"));
  assign("event", el.getAttribute("event"));

  const argsEl = getChild(el, "arguments");
  if (argsEl) statement.arguments = getChildren(argsEl, "argument").map((arg) => arg.getAttribute("value")!);
  const bodyEl = getChild(el, "body");
  if (bodyEl) statement.body = getChildren(bodyEl, "statement").map(deserializeStatementEl);
  const ifBodyEl = getChild(el, "if-body");
  if (ifBodyEl) statement.ifBody = getChildren(ifBodyEl, "statement").map(deserializeStatementEl);
  const elseBodyEl = getChild(el, "else-body");
  if (elseBodyEl) statement.elseBody = getChildren(elseBodyEl, "statement").map(deserializeStatementEl);
  return statement;
}

function deserializeJoint(el: XmlElement): JointNode {
  const transformEl = getChild(el, "local-transform")!;
  const posEl = getChild(transformEl, "position")!;
  const oriEl = getChild(transformEl, "orientation")!;
  const childrenEl = getChild(el, "children");
  return {
    name: el.getAttribute("name")!,
    parentName: el.getAttribute("parentName"),
    localTransform: {
      position: { x: Number(posEl.getAttribute("x")), y: Number(posEl.getAttribute("y")), z: Number(posEl.getAttribute("z")) },
      orientation: { x: Number(oriEl.getAttribute("x")), y: Number(oriEl.getAttribute("y")), z: Number(oriEl.getAttribute("z")), w: Number(oriEl.getAttribute("w")) },
    },
    children: childrenEl ? getChildren(childrenEl, "joint").map(deserializeJoint) : [],
  };
}

function deserializeBoundingBoxEl(el: XmlElement): BoundingBox {
  const minEl = getChild(el, "min")!;
  const maxEl = getChild(el, "max")!;
  return {
    min: { x: Number(minEl.getAttribute("x")), y: Number(minEl.getAttribute("y")), z: Number(minEl.getAttribute("z")) },
    max: { x: Number(maxEl.getAttribute("x")), y: Number(maxEl.getAttribute("y")), z: Number(maxEl.getAttribute("z")) },
  };
}

function getChild(parent: XmlElement, tagName: string): XmlElement | null {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const node = parent.childNodes[index];
    if (node.nodeType === 1 && node.nodeName === tagName) {
      return node as XmlElement;
    }
  }
  return null;
}

function getChildren(parent: XmlElement, tagName: string): XmlElement[] {
  const result: XmlElement[] = [];
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const node = parent.childNodes[index];
    if (node.nodeType === 1 && node.nodeName === tagName) {
      result.push(node as XmlElement);
    }
  }
  return result;
}
