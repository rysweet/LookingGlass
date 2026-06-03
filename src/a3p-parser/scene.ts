import {
  extractResolvedTypeName,
  getCollectionNodesResolved,
  getProperty,
  getPropertyNode,
  getPropertyText,
  directChild,
  resolve,
} from "./dom.js";
import { extractStatements } from "./statements.js";
import type {
  AliceFieldDefinition,
  AliceMethod,
  AliceObject,
  AliceTypeDefinition,
} from "./types.js";
import { attachA3PMethodSource, snapshotAliceStatements } from "./types.js";

export function extractSceneObjects(namedUserTypes: Element[], keyMap: Map<string, Element>): AliceObject[] {
  const objects: AliceObject[] = [];
  const sceneType = findSceneType(namedUserTypes, keyMap);
  if (!sceneType) return objects;

  const fieldNodes = getCollectionNodesResolved(sceneType, "fields", keyMap)
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.UserField");

  for (const field of fieldNodes) {
    const object = parseUserField(field, keyMap);
    if (object) objects.push(object);
  }

  enrichFromMethods(sceneType, objects, keyMap);
  return objects;
}

export function extractTypes(namedUserTypes: Element[], keyMap: Map<string, Element>): AliceTypeDefinition[] {
  const types: AliceTypeDefinition[] = [];
  const seen = new Set<string>();

  for (const node of namedUserTypes) {
    const identity = node.getAttribute("key") ?? node.getAttribute("uuid") ?? `${types.length}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    const name = getPropertyText(node, "name");
    if (!name) continue;

    const methodNodes = getCollectionNodesResolved(node, "methods", keyMap)
      .filter((child) => child.getAttribute("type") === "org.lgna.project.ast.UserMethod");
    const constructorNodes = getCollectionNodesResolved(node, "constructors", keyMap)
      .filter((child) => child.getAttribute("type") === "org.lgna.project.ast.NamedUserConstructor");

    types.push({
      name,
      superTypeName: getSuperTypeName(node, keyMap),
      methods: extractMethods(methodNodes, keyMap, { includeMain: true }),
      constructors: extractConstructors(constructorNodes, keyMap, name),
      fields: extractFieldDefinitions(node, keyMap),
    });
  }

  return types;
}

function extractConstructors(constructorNodes: Element[], keyMap: Map<string, Element>, typeName: string): AliceMethod[] {
  return constructorNodes.map((node) => {
    const method = {
      name: typeName,
      isFunction: false,
      returnType: typeName,
      parameters: extractParameters(node, keyMap),
      statements: extractStatements(node, keyMap),
    };
    attachStatementSource(method);
    return method;
  });
}

function extractFieldDefinitions(typeNode: Element, keyMap: Map<string, Element>): AliceFieldDefinition[] {
  const fields: AliceFieldDefinition[] = [];
  const fieldNodes = getCollectionNodesResolved(typeNode, "fields", keyMap)
    .filter((child) => child.getAttribute("type") === "org.lgna.project.ast.UserField");

  for (const field of fieldNodes) {
    const name = getPropertyText(field, "name");
    if (!name) continue;
    fields.push({
      name,
      typeName: extractFieldValueType(field, keyMap),
      resourceType: extractResourceType(field, keyMap),
      initializer: summarizeInitializer(field, keyMap),
    });
  }

  return fields;
}

function summarizeInitializer(field: Element, keyMap: Map<string, Element>): string | null {
  const initializer = getPropertyNode(field, "initializer", keyMap);
  if (!initializer) return null;
  const resourceType = extractResourceType(field, keyMap);
  if (resourceType) return resourceType;
  return initializer.getAttribute("type")?.split(".").pop() ?? null;
}

function findSceneType(namedUserTypes: Element[], keyMap: Map<string, Element>): Element | null {
  for (const node of namedUserTypes) {
    const superType = getSuperTypeName(node, keyMap);
    if (superType && superType.includes("SScene")) return node;
  }
  return null;
}

function getSuperTypeName(typeNode: Element, keyMap: Map<string, Element>): string | null {
  const superNode = getPropertyNode(typeNode, "superType", keyMap);
  return superNode ? extractResolvedTypeName(superNode, keyMap) : null;
}

function extractFieldValueType(field: Element, keyMap: Map<string, Element>): string | null {
  const valueTypeNode = getPropertyNode(field, "valueType", keyMap);
  if (!valueTypeNode) return null;

  const resolved = resolve(valueTypeNode, keyMap);
  if (resolved.getAttribute("type") === "org.lgna.project.ast.NamedUserType") {
    const userTypeName = getPropertyText(resolved, "name");
    const superTypeName = getSuperTypeName(resolved, keyMap);
    return superTypeName ?? userTypeName ?? null;
  }

  return extractResolvedTypeName(resolved, keyMap);
}

function extractResourceType(field: Element, keyMap: Map<string, Element>): string | null {
  const initializer = getPropertyNode(field, "initializer", keyMap);
  if (!initializer) return null;
  const refs = initializer.getElementsByTagName("resourceReference");
  if (refs.length === 0) return null;

  const reference = refs[0];
  const resourceName = reference.getAttribute("name");
  if (resourceName?.includes(".")) {
    return resourceName;
  }

  const declaringClass = directChild(reference, "declaringClass")?.getAttribute("name");
  return declaringClass ?? resourceName ?? null;
}

function parseUserField(field: Element, keyMap: Map<string, Element>): AliceObject | null {
  const name = getPropertyText(field, "name");
  if (!name) return null;

  let typeName = extractFieldValueType(field, keyMap) ?? "unknown";
  const valueTypeNode = getPropertyNode(field, "valueType", keyMap);
  if (valueTypeNode?.getAttribute("type") === "org.lgna.project.ast.NamedUserType") {
    const superTypeName = getSuperTypeName(valueTypeNode, keyMap);
    if (superTypeName) {
      typeName = superTypeName;
    }
  }

  const resourceType = extractResourceType(field, keyMap);
  return { name, typeName, resourceType, position: null, orientation: null, size: null };
}

function enrichFromMethods(sceneType: Element, objects: AliceObject[], keyMap: Map<string, Element>): void {
  const byName = new Map<string, AliceObject>();
  for (const object of objects) byName.set(object.name, object);

  const allMethods = sceneType.getElementsByTagName("node");
  for (let i = 0; i < allMethods.length; i++) {
    const node = allMethods[i];
    if (node.getAttribute("type") !== "org.lgna.project.ast.MethodInvocation") continue;

    const methodNode = getPropertyNode(node, "method", keyMap);
    if (!methodNode) continue;
    const methodElement = directChild(methodNode, "method");
    if (!methodElement) continue;

    const methodName = methodElement.getAttribute("name") ?? "";
    const expressionProperty = getProperty(node, "expression");
    const fieldName = resolveFieldAccessName(expressionProperty, keyMap);
    if (!fieldName) continue;

    const object = byName.get(fieldName);
    if (!object) continue;

    const doubles = extractDoubleArgs(node);
    if (methodName === "setPositionRelativeToVehicle" && doubles.length >= 3) {
      object.position = { x: doubles[0], y: doubles[1], z: doubles[2] };
    } else if (methodName === "setOrientationRelativeToVehicle" && doubles.length >= 4) {
      object.orientation = { x: doubles[0], y: doubles[1], z: doubles[2], w: doubles[3] };
    } else if (methodName === "setSize" && doubles.length >= 3) {
      object.size = { width: doubles[0], height: doubles[1], depth: doubles[2] };
    }
  }
}

function resolveFieldAccessName(property: Element | null, keyMap: Map<string, Element>): string | null {
  if (!property) return null;
  let expressionNode = directChild(property, "node");
  if (!expressionNode) return null;
  expressionNode = resolve(expressionNode, keyMap);
  if (expressionNode.getAttribute("type") !== "org.lgna.project.ast.FieldAccess") return null;
  const fieldNode = getPropertyNode(expressionNode, "field", keyMap);
  return fieldNode ? getPropertyText(fieldNode, "name") : null;
}

function extractDoubleArgs(methodInvocation: Element): number[] {
  const doubles: number[] = [];
  const requiredArguments = getProperty(methodInvocation, "requiredArguments");
  if (!requiredArguments) return doubles;

  const allNodes = requiredArguments.getElementsByTagName("node");
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    if (node.getAttribute("type") === "org.lgna.project.ast.DoubleLiteral") {
      const value = getPropertyText(node, "value");
      if (value !== null) doubles.push(parseFloat(value));
    }
  }
  return doubles;
}

export function extractMethods(
  methodNodes: Element[],
  keyMap: Map<string, Element>,
  options: { includeMain: boolean },
): AliceMethod[] {
  const methods: AliceMethod[] = [];

  for (const node of methodNodes) {
    const name = getPropertyText(node, "name");
    if (!name) continue;
    if (!options.includeMain && name === "main") continue;

    const returnType = extractReturnType(node, keyMap);
    const method = {
      name,
      isFunction: returnType !== "void" && returnType !== "",
      returnType,
      parameters: extractParameters(node, keyMap),
      statements: extractStatements(node, keyMap),
    };
    attachStatementSource(method);
    methods.push(method);
  }

  return methods;
}

function attachStatementSource(method: AliceMethod): void {
  attachA3PMethodSource(method, {
    statementsSnapshot: snapshotAliceStatements(method.statements),
  });
}

function extractReturnType(methodNode: Element, keyMap: Map<string, Element>): string {
  const returnTypeNode = getPropertyNode(methodNode, "returnType", keyMap);
  if (!returnTypeNode) return "void";
  return extractResolvedTypeName(returnTypeNode, keyMap) ?? "void";
}

function extractParameters(methodNode: Element, keyMap: Map<string, Element>): Array<{ name: string; type: string }> {
  const parameters: Array<{ name: string; type: string }> = [];
  const paramNodes = getCollectionNodesResolved(methodNode, "requiredParameters", keyMap)
    .filter((child) => child.getAttribute("type") === "org.lgna.project.ast.UserParameter");

  for (const resolved of paramNodes) {
    const name = getPropertyText(resolved, "name") ?? "unknown";
    const typeNode = getPropertyNode(resolved, "valueType", keyMap);
    parameters.push({
      name,
      type: typeNode ? extractResolvedTypeName(typeNode, keyMap) ?? "Object" : "Object",
    });
  }

  return parameters;
}
