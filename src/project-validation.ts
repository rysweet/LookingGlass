import { getA3PSource, type AliceProject } from "./a3p-parser.js";
import type { AliceProjectArchive } from "./project-io.js";

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

type ValidationCode =
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

interface ValidationContext {
  xmlText: string;
  doc: Document;
  keyMap: Map<string, Element>;
  userTypes: Map<string, TypeInfo>;
  availableResources: Set<string>;
  hasResourceInventory: boolean;
}

interface TypeInfo {
  name: string;
  node: Element;
  superTypeName: string | null;
}

interface MethodSignature {
  name: string;
  parameterTypes: string[];
  varArgs: boolean;
}

interface TypeReferenceTarget {
  owner: Element;
  propertyName: string;
  node: Element;
  allowVoid?: boolean;
}

export async function validateProject(
  project: AliceProject,
  options: ProjectValidationOptions = {},
): Promise<ProjectValidationResult> {
  const xmlText = extractXmlText(project, options);
  if (!xmlText) {
    return {
      valid: false,
      errors: [
        {
          code: "missing-source-xml",
          message: "Project validation requires the original Alice project XML source.",
          line: 1,
          column: 1,
        },
      ],
    };
  }

  const doc = await parseXmlString(xmlText);
  const keyMap = indexNodes(doc.documentElement);
  const userTypes = collectUserTypes(doc, keyMap);
  const availableResources = collectAvailableResources(options.archive ?? null);
  const context: ValidationContext = {
    xmlText,
    doc,
    keyMap,
    userTypes,
    availableResources,
    hasResourceInventory: options.archive != null,
  };

  const errors: ProjectValidationError[] = [];
  validateTypeReferences(context, errors);
  validateMethodInvocations(context, errors);
  validateCircularHierarchies(context, errors);
  validateResourceReferences(context, errors);

  return {
    valid: errors.length === 0,
    errors: errors.sort((left, right) => left.line - right.line || left.column - right.column),
  };
}

export async function validateProjectArchive(
  archive: AliceProjectArchive,
): Promise<ProjectValidationResult> {
  return validateProject(archive.project, { archive });
}

function extractXmlText(
  project: AliceProject,
  options: ProjectValidationOptions,
): string | null {
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

async function parseXmlString(xml: string): Promise<Document> {
  if (typeof globalThis.DOMParser !== "undefined") {
    return new globalThis.DOMParser().parseFromString(xml, "application/xml");
  }
  const mod = await import("@xmldom/xmldom");
  return new mod.DOMParser().parseFromString(xml, "application/xml") as unknown as Document;
}

function indexNodes(root: Element): Map<string, Element> {
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

function collectUserTypes(
  doc: Document,
  keyMap: Map<string, Element>,
): Map<string, TypeInfo> {
  const userTypes = new Map<string, TypeInfo>();
  for (const node of elementsByTagName(doc, "node")) {
    if (node.getAttribute("type") !== "org.lgna.project.ast.NamedUserType") {
      continue;
    }
    const name = getPropertyText(node, "name");
    if (!name) {
      continue;
    }
    if (!userTypes.has(name)) {
      userTypes.set(name, {
        name,
        node,
        superTypeName: getSuperTypeName(node, keyMap),
      });
    }
  }
  return userTypes;
}

function collectAvailableResources(archive: XmlArchiveLike | null): Set<string> {
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

function validateTypeReferences(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  for (const target of collectTypeReferenceTargets(context.doc, context.keyMap)) {
    const typeName = extractResolvedTypeName(target.node, context.keyMap);
    if (!typeName) {
      pushError(
        context,
        errors,
        target.node,
        "unresolved-type-reference",
        `${describeNode(target.owner)} ${target.propertyName} does not resolve to a type.`,
      );
      continue;
    }
    if (!target.allowVoid && normalizeTypeName(typeName) === "void") {
      pushError(
        context,
        errors,
        target.node,
        "unresolved-type-reference",
        `${describeNode(target.owner)} ${target.propertyName} cannot use void as a value type.`,
      );
      continue;
    }
    if (!isKnownTypeName(typeName, context)) {
      pushError(
        context,
        errors,
        target.node,
        "unresolved-type-reference",
        `${describeNode(target.owner)} ${target.propertyName} references unknown type ${typeName}.`,
      );
    }
  }
}

function collectTypeReferenceTargets(
  doc: Document,
  keyMap: Map<string, Element>,
): TypeReferenceTarget[] {
  const targets: TypeReferenceTarget[] = [];
  for (const node of elementsByTagName(doc, "node")) {
    const typeName = node.getAttribute("type") ?? "";
    if (typeName === "org.lgna.project.ast.NamedUserType") {
      const superType = getPropertyNode(node, "superType", keyMap);
      if (superType) {
        targets.push({ owner: node, propertyName: "superType", node: superType });
      }
      continue;
    }
    if (typeName === "org.lgna.project.ast.UserField" || typeName === "org.lgna.project.ast.UserParameter") {
      const valueType = getPropertyNode(node, "valueType", keyMap);
      if (valueType) {
        targets.push({ owner: node, propertyName: "valueType", node: valueType });
      }
      continue;
    }
    if (typeName === "org.lgna.project.ast.UserMethod") {
      const returnType = getPropertyNode(node, "returnType", keyMap);
      if (returnType) {
        targets.push({ owner: node, propertyName: "returnType", node: returnType, allowVoid: true });
      }
    }
  }
  return targets;
}

function validateMethodInvocations(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  for (const invocation of elementsByTagName(context.doc, "node")) {
    if (invocation.getAttribute("type") !== "org.lgna.project.ast.MethodInvocation") {
      continue;
    }
    const methodNode = getPropertyNode(invocation, "method", context.keyMap);
    if (!methodNode) {
      pushError(
        context,
        errors,
        invocation,
        "invalid-method-argument-count",
        "method invocation does not resolve its target method.",
      );
      continue;
    }
    const signature = readMethodSignature(methodNode, context.keyMap);
    if (!signature) {
      continue;
    }

    const argumentNodes = getArgumentNodes(invocation, context.keyMap);
    if (!matchesArgumentCount(signature, argumentNodes.length)) {
      pushError(
        context,
        errors,
        invocation,
        "invalid-method-argument-count",
        `method ${signature.name} expects ${describeParameterCount(signature)} but received ${argumentNodes.length}.`,
      );
      continue;
    }

    for (let index = 0; index < Math.min(signature.parameterTypes.length, argumentNodes.length); index += 1) {
      const expectedType = signature.parameterTypes[index]!;
      const actualType = inferExpressionType(argumentNodes[index]!, context);
      if (!actualType) {
        continue;
      }
      if (!isTypeAssignable(expectedType, actualType, context)) {
        pushError(
          context,
          errors,
          argumentNodes[index]!,
          "invalid-method-argument-type",
          `method ${signature.name} argument ${index + 1} expects ${expectedType} but received ${actualType}.`,
        );
      }
    }
  }
}

function validateCircularHierarchies(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  const visited = new Set<string>();
  const stack: string[] = [];
  const active = new Set<string>();
  const reported = new Set<string>();

  const visit = (typeName: string): void => {
    if (visited.has(typeName)) {
      return;
    }
    const info = context.userTypes.get(typeName);
    if (!info) {
      return;
    }
    visited.add(typeName);
    active.add(typeName);
    stack.push(typeName);

    const parent = info.superTypeName;
    if (parent && context.userTypes.has(parent)) {
      if (active.has(parent)) {
        const startIndex = stack.indexOf(parent);
        const cycle = stack.slice(startIndex);
        const cycleLabel = [...cycle, parent].join(" -> ");
        for (const name of cycle) {
          if (reported.has(name)) {
            continue;
          }
          reported.add(name);
          pushError(
            context,
            errors,
            context.userTypes.get(name)?.node ?? info.node,
            "circular-type-hierarchy",
            `circular type hierarchy detected: ${cycleLabel}.`,
          );
        }
      } else {
        visit(parent);
      }
    }

    stack.pop();
    active.delete(typeName);
  };

  for (const typeName of context.userTypes.keys()) {
    visit(typeName);
  }
}

function validateResourceReferences(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  if (!context.hasResourceInventory) {
    return;
  }

  for (const node of elementsByTagName(context.doc, "node")) {
    for (const propertyName of ["texturePath", "resourcePath", "audioPath"]) {
      const property = getProperty(node, propertyName);
      const value = property ? getValueText(property) : null;
      if (!value || !looksLikeArchivePath(value)) {
        continue;
      }
      if (!context.availableResources.has(value)) {
        pushError(
          context,
          errors,
          property ?? node,
          "missing-resource-reference",
          `${describeNode(node)} ${propertyName} references missing resource ${value}.`,
        );
      }
    }

    for (const ref of elementsByTagName(node, "resourceReference")) {
      const resourceName = ref.getAttribute("name")?.trim() ?? "";
      if (resourceName && looksLikeArchivePath(resourceName) && !context.availableResources.has(resourceName)) {
        pushError(
          context,
          errors,
          ref,
          "missing-resource-reference",
          `resource reference points to missing resource ${resourceName}.`,
        );
      }
    }
  }
}

function readMethodSignature(
  methodNode: Element,
  keyMap: Map<string, Element>,
): MethodSignature | null {
  const resolved = resolve(methodNode, keyMap);
  const childMethod = directChild(resolved, "method");
  const childConstructor = directChild(resolved, "constructor");

  if (childMethod || childConstructor) {
    const signatureNode = childMethod ?? childConstructor;
    if (!signatureNode) {
      return null;
    }
    const parameterTypes = directChild(signatureNode, "parameters")
      ? elementsByTagName(signatureNode, "type")
          .map((typeNode) => typeNode.getAttribute("name")?.trim() ?? "")
          .filter((value) => value.length > 0)
      : [];
    const explicitName = childMethod?.getAttribute("name")
      ?? getPropertyText(resolved, "name")
      ?? "method";
    return {
      name: explicitName,
      parameterTypes,
      varArgs: (signatureNode.getAttribute("isVarArgs") ?? "false") === "true",
    };
  }

  const parameterTypes = getCollectionNodesResolved(resolved, "requiredParameters", keyMap)
    .filter((node) => node.getAttribute("type") === "org.lgna.project.ast.UserParameter")
    .map((node) => extractResolvedTypeName(getPropertyNode(node, "valueType", keyMap), keyMap) ?? "java.lang.Object");

  return {
    name: getPropertyText(resolved, "name") ?? "method",
    parameterTypes,
    varArgs: false,
  };
}

function getArgumentNodes(
  invocation: Element,
  keyMap: Map<string, Element>,
): Element[] {
  const required = getCollectionNodesResolved(invocation, "requiredArguments", keyMap);
  const variable = getCollectionNodesResolved(invocation, "variableArguments", keyMap);
  const keyed = getCollectionNodesResolved(invocation, "keyedArguments", keyMap);
  return [...required, ...variable, ...keyed];
}

function matchesArgumentCount(signature: MethodSignature, actualCount: number): boolean {
  if (signature.varArgs) {
    return actualCount >= Math.max(signature.parameterTypes.length - 1, 0);
  }
  return signature.parameterTypes.length === actualCount;
}

function describeParameterCount(signature: MethodSignature): string {
  if (signature.varArgs) {
    return `${Math.max(signature.parameterTypes.length - 1, 0)}+ arguments`;
  }
  return `${signature.parameterTypes.length} arguments`;
}

function inferExpressionType(
  expression: Element,
  context: ValidationContext,
): string | null {
  const resolved = resolve(expression, context.keyMap);
  const typeName = resolved.getAttribute("type") ?? "";
  switch (typeName) {
    case "org.lgna.project.ast.StringLiteral":
      return "java.lang.String";
    case "org.lgna.project.ast.BooleanLiteral":
      return "java.lang.Boolean";
    case "org.lgna.project.ast.DoubleLiteral":
      return "java.lang.Double";
    case "org.lgna.project.ast.FloatLiteral":
      return "java.lang.Float";
    case "org.lgna.project.ast.IntegerLiteral":
      return "java.lang.Integer";
    case "org.lgna.project.ast.LongLiteral":
      return "java.lang.Long";
    case "org.lgna.project.ast.NullLiteral":
      return "null";
    case "org.lgna.project.ast.ThisExpression":
      return findEnclosingTypeName(resolved, context.keyMap);
    case "org.lgna.project.ast.FieldAccess": {
      const fieldNode = getPropertyNode(resolved, "field", context.keyMap);
      return fieldNode ? extractFieldValueType(fieldNode, context.keyMap) : null;
    }
    case "org.lgna.project.ast.ParameterAccess": {
      const parameterNode = getPropertyNode(resolved, "parameter", context.keyMap);
      const valueType = parameterNode ? getPropertyNode(parameterNode, "valueType", context.keyMap) : null;
      return valueType ? extractResolvedTypeName(valueType, context.keyMap) : null;
    }
    case "org.lgna.project.ast.LocalAccess": {
      const localNode = getPropertyNode(resolved, "local", context.keyMap);
      const valueType = localNode ? getPropertyNode(localNode, "valueType", context.keyMap) : null;
      return valueType ? extractResolvedTypeName(valueType, context.keyMap) : null;
    }
    case "org.lgna.project.ast.MethodInvocation": {
      const methodNode = getPropertyNode(resolved, "method", context.keyMap);
      const returnType = methodNode ? getPropertyNode(methodNode, "returnType", context.keyMap) : null;
      return returnType ? extractResolvedTypeName(returnType, context.keyMap) : null;
    }
    case "org.lgna.project.ast.InstanceCreation": {
      const constructorNode = getPropertyNode(resolved, "constructor", context.keyMap);
      const signature = constructorNode ? readMethodSignature(constructorNode, context.keyMap) : null;
      const childConstructor = constructorNode ? directChild(resolve(constructorNode, context.keyMap), "constructor") : null;
      const declaring = childConstructor?.getElementsByTagName("declaringClass")[0]?.getAttribute("name") ?? null;
      return declaring ?? signature?.name ?? null;
    }
    default:
      return null;
  }
}

function isTypeAssignable(
  expectedType: string,
  actualType: string,
  context: ValidationContext,
): boolean {
  if (actualType === "null") {
    return true;
  }
  const expected = normalizeTypeName(expectedType);
  const actual = normalizeTypeName(actualType);
  if (expected === actual) {
    return true;
  }
  if (expected === "java.lang.Object") {
    return true;
  }
  if (expected === actualType || actual === expectedType) {
    return true;
  }
  let current = context.userTypes.get(actual);
  const visited = new Set<string>();
  while (current?.superTypeName && !visited.has(current.name)) {
    visited.add(current.name);
    const parent = normalizeTypeName(current.superTypeName);
    if (parent === expected) {
      return true;
    }
    current = context.userTypes.get(parent);
  }
  return false;
}

function isKnownTypeName(typeName: string, context: ValidationContext): boolean {
  const normalized = normalizeTypeName(typeName);
  return SIMPLE_KNOWN_TYPES.has(typeName)
    || SIMPLE_KNOWN_TYPES.has(normalized)
    || BOXED_TYPE_ALIASES.has(typeName)
    || BOXED_TYPE_ALIASES.has(normalized)
    || context.userTypes.has(typeName)
    || context.userTypes.has(normalized)
    || normalized.includes(".");
}

function normalizeTypeName(typeName: string | null | undefined): string {
  const trimmed = typeName?.trim() ?? "";
  if (!trimmed) {
    return "";
  }
  return BOXED_TYPE_ALIASES.get(trimmed) ?? trimmed;
}

function findEnclosingTypeName(node: Element, keyMap: Map<string, Element>): string | null {
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

function getSuperTypeName(typeNode: Element, keyMap: Map<string, Element>): string | null {
  const superNode = getPropertyNode(typeNode, "superType", keyMap);
  return superNode ? extractResolvedTypeName(superNode, keyMap) : null;
}

function extractFieldValueType(field: Element, keyMap: Map<string, Element>): string | null {
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

function extractResolvedTypeName(
  node: Element | null,
  keyMap: Map<string, Element>,
): string | null {
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

function resolve(node: Element, keyMap: Map<string, Element>): Element {
  const key = node.getAttribute("key");
  return (key ? keyMap.get(key) : null) ?? node;
}

function getProperty(parent: Element, propertyName: string): Element | null {
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

function getPropertyText(parent: Element, propertyName: string): string | null {
  const property = getProperty(parent, propertyName);
  return property ? getValueText(property) : null;
}

function getPropertyNode(
  parent: Element,
  propertyName: string,
  keyMap: Map<string, Element>,
): Element | null {
  const property = getProperty(parent, propertyName);
  if (!property) {
    return null;
  }
  const child = directChild(property, "node");
  return child ? resolve(child, keyMap) : null;
}

function getCollectionNodesResolved(
  parent: Element,
  propertyName: string,
  keyMap: Map<string, Element>,
): Element[] {
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

function directChild(parent: Element, tagName: string): Element | null {
  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const child = parent.childNodes[index];
    if (child.nodeType === 1 && (child as Element).tagName === tagName) {
      return child as Element;
    }
  }
  return null;
}

function elementsByTagName(parent: Document | Element, tagName: string): Element[] {
  const result: Element[] = [];
  const nodes = parent.getElementsByTagName(tagName);
  for (let index = 0; index < nodes.length; index += 1) {
    result.push(nodes[index] as Element);
  }
  return result;
}

function looksLikeArchivePath(value: string): boolean {
  return value.includes("/") || /\.(png|jpg|jpeg|gif|bmp|wav|mp3|obj|dae|a3p)$/iu.test(value);
}

function describeNode(node: Element): string {
  const kind = node.getAttribute("type")?.split(".").pop() ?? node.tagName;
  const name = getPropertyText(node, "name");
  return name ? `${kind} ${name}` : kind;
}

function pushError(
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
