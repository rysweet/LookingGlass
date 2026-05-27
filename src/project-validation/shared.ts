import { getA3PSource, type AliceProject } from "../a3p-parser.js";
import type { AliceProjectArchive } from "../project-io.js";

const ORIGINAL_XML_MARKER = "__original_xml__";
const SIMPLE_KNOWN_TYPES = new Set([
  "void",
  "Object",
  "String",
  "Boolean",
  "Number",
  "Integer",
  "Double",
  "Float",
  "Long",
  "Short",
  "Byte",
  "Character",
]);
const BOXED_TYPE_ALIASES = new Map<string, string>([
  ["boolean", "java.lang.Boolean"],
  ["Boolean", "java.lang.Boolean"],
  ["java.lang.Boolean", "java.lang.Boolean"],
  ["int", "java.lang.Integer"],
  ["Integer", "java.lang.Integer"],
  ["java.lang.Integer", "java.lang.Integer"],
  ["double", "java.lang.Double"],
  ["Double", "java.lang.Double"],
  ["java.lang.Double", "java.lang.Double"],
  ["float", "java.lang.Float"],
  ["Float", "java.lang.Float"],
  ["java.lang.Float", "java.lang.Float"],
  ["long", "java.lang.Long"],
  ["Long", "java.lang.Long"],
  ["java.lang.Long", "java.lang.Long"],
  ["short", "java.lang.Short"],
  ["Short", "java.lang.Short"],
  ["java.lang.Short", "java.lang.Short"],
  ["byte", "java.lang.Byte"],
  ["Byte", "java.lang.Byte"],
  ["java.lang.Byte", "java.lang.Byte"],
  ["char", "java.lang.Character"],
  ["Character", "java.lang.Character"],
  ["java.lang.Character", "java.lang.Character"],
  ["String", "java.lang.String"],
  ["java.lang.String", "java.lang.String"],
  ["Object", "java.lang.Object"],
  ["java.lang.Object", "java.lang.Object"],
  ["Number", "java.lang.Number"],
  ["java.lang.Number", "java.lang.Number"],
]);

type XmlArchiveLike = Pick<AliceProjectArchive, "resources" | "resourceEntries">;

export type ValidationCode =
  | "missing-source-xml"
  | "unresolved-type-reference"
  | "circular-type-hierarchy"
  | "invalid-method-argument-count"
  | "invalid-method-argument-type"
  | "missing-resource-reference";

export interface ProjectValidationError {
  code: ValidationCode;
  message: string;
  line: number;
  column: number;
}

export interface ProjectValidationResult {
  valid: boolean;
  errors: ProjectValidationError[];
}

export interface ProjectValidationOptions {
  archive?: XmlArchiveLike | null;
  xmlText?: string | null;
}

export interface ValidationContext {
  xmlText: string;
  doc: Document;
  keyMap: Map<string, Element>;
  userTypes: Map<string, TypeInfo>;
  availableResources: Set<string>;
  hasResourceInventory: boolean;
}

export interface TypeInfo {
  name: string;
  node: Element;
  superTypeName: string | null;
}

export function extractXmlText(project: AliceProject, options: ProjectValidationOptions): string | null {
  if (options.xmlText) {
    return options.xmlText;
  }
  const source = getA3PSource(project);
  if (source?.xmlText) {
    return source.xmlText;
  }
  const stored = options.archive?.resources.get(ORIGINAL_XML_MARKER);
  if (!stored) {
    return null;
  }
  const decoded = new TextDecoder().decode(stored);
  const match = decoded.match(/^<!--\s+([^>]+?)\s+-->\n/u);
  return match ? decoded.slice(match[0].length) : decoded;
}

export async function parseXmlString(xml: string): Promise<Document> {
  if (typeof globalThis.DOMParser !== "undefined") {
    return new globalThis.DOMParser().parseFromString(xml, "application/xml");
  }
  const mod = await import("@xmldom/xmldom");
  return new mod.DOMParser().parseFromString(xml, "application/xml") as unknown as Document;
}

export function indexNodes(root: Element): Map<string, Element> {
  const keyMap = new Map<string, Element>();
  const nodes = root.getElementsByTagName("node");
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const key = node.getAttribute("key");
    if (!key) {
      continue;
    }
    const existing = keyMap.get(key);
    if (!existing || shouldReplaceIndexedNode(existing, node)) {
      keyMap.set(key, node);
    }
  }
  const rootKey = root.getAttribute("key");
  if (rootKey) {
    keyMap.set(rootKey, root);
  }
  return keyMap;
}

function shouldReplaceIndexedNode(existing: Element, candidate: Element): boolean {
  return nodeHasStructure(candidate) || !nodeHasStructure(existing);
}

function nodeHasStructure(node: Element): boolean {
  return node.hasAttribute("type") || node.childNodes.length > 0;
}

export function collectUserTypes(doc: Document, keyMap: Map<string, Element>): Map<string, TypeInfo> {
  const userTypes = new Map<string, TypeInfo>();
  for (const node of elementsByTagName(doc, "node")) {
    if (node.getAttribute("type") !== "org.lgna.project.ast.NamedUserType") {
      continue;
    }
    const name = getPropertyText(node, "name");
    if (!name || userTypes.has(name)) {
      continue;
    }
    userTypes.set(name, {
      name,
      node,
      superTypeName: getSuperTypeName(node, keyMap),
    });
  }
  return userTypes;
}

export function collectAvailableResources(archive: XmlArchiveLike | null): Set<string> {
  const resources = new Set<string>();
  if (!archive) {
    return resources;
  }
  for (const path of archive.resources.keys()) {
    if (path !== ORIGINAL_XML_MARKER) {
      resources.add(path);
    }
  }
  for (const entry of archive.resourceEntries) {
    resources.add(entry.path);
  }
  return resources;
}

export function isKnownTypeName(typeName: string, context: ValidationContext): boolean {
  const normalized = normalizeTypeName(typeName);
  return SIMPLE_KNOWN_TYPES.has(typeName)
    || SIMPLE_KNOWN_TYPES.has(normalized)
    || BOXED_TYPE_ALIASES.has(typeName)
    || BOXED_TYPE_ALIASES.has(normalized)
    || context.userTypes.has(typeName)
    || context.userTypes.has(normalized)
    || normalized.includes(".");
}

export function normalizeTypeName(typeName: string | null | undefined): string {
  const trimmed = typeName?.trim() ?? "";
  if (!trimmed) {
    return "";
  }
  return BOXED_TYPE_ALIASES.get(trimmed) ?? trimmed;
}

export function getSuperTypeName(typeNode: Element, keyMap: Map<string, Element>): string | null {
  const superNode = getPropertyNode(typeNode, "superType", keyMap);
  return superNode ? extractResolvedTypeName(superNode, keyMap) : null;
}

export function extractFieldValueType(field: Element, keyMap: Map<string, Element>): string | null {
  const valueTypeNode = getPropertyNode(field, "valueType", keyMap);
  if (!valueTypeNode) {
    return null;
  }
  const resolved = resolve(valueTypeNode, keyMap);
  if (resolved.getAttribute("type") === "org.lgna.project.ast.NamedUserType") {
    return getPropertyText(resolved, "name") ?? null;
  }
  return extractResolvedTypeName(resolved, keyMap);
}

export function extractResolvedTypeName(node: Element | null, keyMap: Map<string, Element>): string | null {
  if (!node) {
    return null;
  }
  const resolved = resolve(node, keyMap);
  const typeElement = directChild(resolved, "type");
  if (typeElement?.getAttribute("name")) {
    return typeElement.getAttribute("name")?.trim() ?? null;
  }
  const childMethod = directChild(resolved, "method");
  if (childMethod) {
    return childMethod.getAttribute("declaringClass")?.trim() ?? null;
  }
  const directClass = directChild(resolved, "declaringClass")?.getAttribute("name");
  if (directClass) {
    return directClass.trim();
  }
  const classProperty = getPropertyText(resolved, "class");
  if (classProperty) {
    return classProperty;
  }
  if (resolved.getAttribute("type") === "org.lgna.project.ast.NamedUserType") {
    return getPropertyText(resolved, "name");
  }
  return null;
}

export function findEnclosingTypeName(node: Element, keyMap: Map<string, Element>): string | null {
  let current: Node | null = node;
  while (current) {
    if (current.nodeType === 1) {
      const element = current as Element;
      if (element.tagName === "node" && element.getAttribute("type") === "org.lgna.project.ast.NamedUserType") {
        return getPropertyText(resolve(element, keyMap), "name");
      }
    }
    current = current.parentNode;
  }
  return null;
}

export function resolve(node: Element, keyMap: Map<string, Element>): Element {
  const key = node.getAttribute("key");
  return (key ? keyMap.get(key) : null) ?? node;
}

export function getProperty(parent: Element, propertyName: string): Element | null {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const child = parent.childNodes[index];
    if (
      child.nodeType === 1
      && (child as Element).tagName === "property"
      && (child as Element).getAttribute("name") === propertyName
    ) {
      return child as Element;
    }
  }
  return null;
}

function getValueText(property: Element): string | null {
  const valueNode = directChild(property, "value");
  return valueNode?.textContent?.trim() ?? null;
}

export function getPropertyText(parent: Element, propertyName: string): string | null {
  const property = getProperty(parent, propertyName);
  return property ? getValueText(property) : null;
}

export function getPropertyNode(parent: Element, propertyName: string, keyMap: Map<string, Element>): Element | null {
  const property = getProperty(parent, propertyName);
  if (!property) {
    return null;
  }
  const child = directChild(property, "node");
  return child ? resolve(child, keyMap) : null;
}

export function getCollectionNodesResolved(parent: Element, propertyName: string, keyMap: Map<string, Element>): Element[] {
  const property = getProperty(parent, propertyName);
  if (!property) {
    return [];
  }
  const collection = directChild(property, "collection");
  if (!collection) {
    return [];
  }
  const nodes: Element[] = [];
  for (let index = 0; index < collection.childNodes.length; index += 1) {
    const child = collection.childNodes[index];
    if (child.nodeType === 1 && (child as Element).tagName === "node") {
      nodes.push(resolve(child as Element, keyMap));
    }
  }
  return nodes;
}

export function directChild(parent: Element, tagName: string): Element | null {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const child = parent.childNodes[index];
    if (child.nodeType === 1 && (child as Element).tagName === tagName) {
      return child as Element;
    }
  }
  return null;
}

export function elementsByTagName(parent: Document | Element, tagName: string): Element[] {
  const result: Element[] = [];
  const nodes = parent.getElementsByTagName(tagName);
  for (let index = 0; index < nodes.length; index += 1) {
    result.push(nodes[index] as Element);
  }
  return result;
}

export function looksLikeArchivePath(value: string): boolean {
  return value.includes("/") || /\.(png|jpg|jpeg|gif|bmp|wav|mp3|obj|dae|a3p)$/iu.test(value);
}

export function describeNode(node: Element): string {
  const kind = node.getAttribute("type")?.split(".").pop() ?? node.tagName;
  const name = getPropertyText(node, "name");
  return name ? `${kind} ${name}` : kind;
}

export function pushError(
  context: ValidationContext,
  errors: ProjectValidationError[],
  node: Element,
  code: ValidationCode,
  message: string,
): void {
  const { line, column } = findLocation(context.xmlText, node);
  errors.push({ code, message, line, column });
}

function findLocation(xmlText: string, node: Element): { line: number; column: number } {
  const anchors = [
    node.getAttribute("uuid") ? `uuid="${node.getAttribute("uuid")}"` : null,
    node.getAttribute("key") ? `key="${node.getAttribute("key")}"` : null,
    node.tagName === "property" && node.getAttribute("name")
      ? `property name="${node.getAttribute("name")}"`
      : null,
    node.getAttribute("type") ? `type="${node.getAttribute("type")}"` : null,
  ].filter((value): value is string => Boolean(value));

  let index = -1;
  for (const anchor of anchors) {
    index = xmlText.indexOf(anchor);
    if (index >= 0) {
      break;
    }
  }
  if (index < 0) {
    return { line: 1, column: 1 };
  }
  let line = 1;
  let column = 1;
  for (let position = 0; position < index; position += 1) {
    if (xmlText[position] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}
