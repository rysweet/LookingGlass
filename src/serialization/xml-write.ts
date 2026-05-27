import {
  DOMImplementation,
  XMLSerializer,
  type Document as XmlDocument,
  type Element as XmlElement,
} from "@xmldom/xmldom";
import type { AliceMethod, AliceObject, AliceProject, AliceStatement } from "../a3p-parser.js";
import type { BoundingBox, JointNode } from "../story-api/types.js";

export function serializeToXml(project: AliceProject): string {
  const implementation = new DOMImplementation();
  const doc = implementation.createDocument(null, "alice-project");
  const root = doc.documentElement!;

  root.setAttribute("version", project.version);
  root.setAttribute("projectName", project.projectName);

  const sceneObjectsElement = doc.createElement("scene-objects");
  for (const object of project.sceneObjects) {
    sceneObjectsElement.appendChild(serializeSceneObject(doc, object));
  }
  root.appendChild(sceneObjectsElement);

  const methodsElement = doc.createElement("methods");
  for (const method of project.methods) {
    methodsElement.appendChild(serializeMethod(doc, method));
  }
  root.appendChild(methodsElement);

  if (project.jointHierarchy !== undefined) {
    const jointHierarchyElement = doc.createElement("joint-hierarchy");
    for (const joint of project.jointHierarchy) {
      jointHierarchyElement.appendChild(serializeJoint(doc, joint));
    }
    root.appendChild(jointHierarchyElement);
  }
  if (project.boundingBoxes !== undefined) {
    const boxesElement = doc.createElement("bounding-boxes");
    for (const [name, box] of Object.entries(project.boundingBoxes)) {
      boxesElement.appendChild(serializeBoundingBox(doc, name, box));
    }
    root.appendChild(boxesElement);
  }
  if (project.textureRefs !== undefined) {
    const refsElement = doc.createElement("texture-refs");
    for (const path of project.textureRefs) {
      const refElement = doc.createElement("texture-ref");
      refElement.setAttribute("path", path);
      refsElement.appendChild(refElement);
    }
    root.appendChild(refsElement);
  }

  return new XMLSerializer().serializeToString(root);
}

function serializeSceneObject(doc: XmlDocument, object: AliceObject): XmlElement {
  const element = doc.createElement("scene-object");
  element.setAttribute("name", object.name);
  element.setAttribute("typeName", object.typeName);
  if (object.resourceType !== null) element.setAttribute("resourceType", object.resourceType);

  if (object.position !== null) {
    const position = doc.createElement("position");
    position.setAttribute("x", String(object.position.x));
    position.setAttribute("y", String(object.position.y));
    position.setAttribute("z", String(object.position.z));
    element.appendChild(position);
  }
  if (object.orientation !== null) {
    const orientation = doc.createElement("orientation");
    orientation.setAttribute("x", String(object.orientation.x));
    orientation.setAttribute("y", String(object.orientation.y));
    orientation.setAttribute("z", String(object.orientation.z));
    orientation.setAttribute("w", String(object.orientation.w));
    element.appendChild(orientation);
  }
  if (object.size !== null) {
    const size = doc.createElement("size");
    size.setAttribute("width", String(object.size.width));
    size.setAttribute("height", String(object.size.height));
    size.setAttribute("depth", String(object.size.depth));
    element.appendChild(size);
  }
  return element;
}

function serializeMethod(doc: XmlDocument, method: AliceMethod): XmlElement {
  const element = doc.createElement("method");
  element.setAttribute("name", method.name);
  element.setAttribute("isFunction", String(method.isFunction));
  element.setAttribute("returnType", method.returnType);

  const paramsElement = doc.createElement("parameters");
  for (const parameter of method.parameters) {
    const parameterElement = doc.createElement("parameter");
    parameterElement.setAttribute("name", parameter.name);
    parameterElement.setAttribute("type", parameter.type);
    paramsElement.appendChild(parameterElement);
  }
  element.appendChild(paramsElement);

  const statementsElement = doc.createElement("statements");
  for (const statement of method.statements) {
    statementsElement.appendChild(serializeStatement(doc, statement));
  }
  element.appendChild(statementsElement);
  return element;
}

function serializeStatement(doc: XmlDocument, statement: AliceStatement): XmlElement {
  const element = doc.createElement("statement");
  element.setAttribute("kind", statement.kind);
  if (statement.object !== undefined) element.setAttribute("object", statement.object);
  if (statement.method !== undefined) element.setAttribute("method", statement.method);
  if (statement.count !== undefined) element.setAttribute("count", String(statement.count));
  if (statement.condition !== undefined) element.setAttribute("condition", statement.condition);
  if (statement.expression !== undefined) element.setAttribute("expression", statement.expression);
  if (statement.name !== undefined) element.setAttribute("name", statement.name);
  if (statement.varType !== undefined) element.setAttribute("varType", statement.varType);
  if (statement.value !== undefined) element.setAttribute("value", statement.value);
  if (statement.event !== undefined) element.setAttribute("event", statement.event);

  if (statement.arguments !== undefined) {
    const argumentsElement = doc.createElement("arguments");
    for (const argument of statement.arguments) {
      const argumentElement = doc.createElement("argument");
      argumentElement.setAttribute("value", argument);
      argumentsElement.appendChild(argumentElement);
    }
    element.appendChild(argumentsElement);
  }
  if (statement.body !== undefined) {
    const bodyElement = doc.createElement("body");
    for (const child of statement.body) bodyElement.appendChild(serializeStatement(doc, child));
    element.appendChild(bodyElement);
  }
  if (statement.ifBody !== undefined) {
    const ifElement = doc.createElement("if-body");
    for (const child of statement.ifBody) ifElement.appendChild(serializeStatement(doc, child));
    element.appendChild(ifElement);
  }
  if (statement.elseBody !== undefined) {
    const elseElement = doc.createElement("else-body");
    for (const child of statement.elseBody) elseElement.appendChild(serializeStatement(doc, child));
    element.appendChild(elseElement);
  }
  return element;
}

function serializeJoint(doc: XmlDocument, joint: JointNode): XmlElement {
  const element = doc.createElement("joint");
  element.setAttribute("name", joint.name);
  if (joint.parentName !== null) element.setAttribute("parentName", joint.parentName);
  const transformElement = doc.createElement("local-transform");
  const positionElement = doc.createElement("position");
  positionElement.setAttribute("x", String(joint.localTransform.position.x));
  positionElement.setAttribute("y", String(joint.localTransform.position.y));
  positionElement.setAttribute("z", String(joint.localTransform.position.z));
  transformElement.appendChild(positionElement);
  const orientationElement = doc.createElement("orientation");
  orientationElement.setAttribute("x", String(joint.localTransform.orientation.x));
  orientationElement.setAttribute("y", String(joint.localTransform.orientation.y));
  orientationElement.setAttribute("z", String(joint.localTransform.orientation.z));
  orientationElement.setAttribute("w", String(joint.localTransform.orientation.w));
  transformElement.appendChild(orientationElement);
  element.appendChild(transformElement);
  const childrenElement = doc.createElement("children");
  for (const child of joint.children) childrenElement.appendChild(serializeJoint(doc, child));
  element.appendChild(childrenElement);
  return element;
}

function serializeBoundingBox(doc: XmlDocument, name: string, box: BoundingBox): XmlElement {
  const element = doc.createElement("bounding-box");
  element.setAttribute("name", name);
  const minElement = doc.createElement("min");
  minElement.setAttribute("x", String(box.min.x));
  minElement.setAttribute("y", String(box.min.y));
  minElement.setAttribute("z", String(box.min.z));
  element.appendChild(minElement);
  const maxElement = doc.createElement("max");
  maxElement.setAttribute("x", String(box.max.x));
  maxElement.setAttribute("y", String(box.max.y));
  maxElement.setAttribute("z", String(box.max.z));
  element.appendChild(maxElement);
  return element;
}
