import type {
  AliceMethod,
  AliceObject,
  AliceProject,
  AliceStatement,
} from "../a3p-parser.js";

const SCHEMA_VERSION = "alice-web.typescript-source-manifest/v1";
const PRODUCT_ID = "alice-web";
const RUNTIME_ID = "Alice";
const ENTRY_POINT = "src/project.ts";
const INDENT = "  ";

const RESERVED_WORDS = new Set([
  "arguments",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

export interface TypeScriptSourceEntry {
  path: string;
  content: string;
}

export interface TypeScriptSourceManifest {
  schemaVersion: typeof SCHEMA_VERSION;
  product: typeof PRODUCT_ID;
  runtime: typeof RUNTIME_ID;
  projectName: string;
  entryPoint: typeof ENTRY_POINT;
  files: string[];
  sourceFileCount: number;
  sceneObjectCount: number;
  procedureCount: number;
  unsupportedBehaviorCount: number;
}

export interface TypeScriptSource {
  manifest: TypeScriptSourceManifest;
  entries: TypeScriptSourceEntry[];
}

export interface UnsupportedAliceRuntimeBehaviorDetails {
  feature: string;
  aliceSelector: string;
  message: string;
}

export class UnsupportedAliceRuntimeBehavior extends Error {
  readonly feature: string;
  readonly aliceSelector: string;

  constructor(details: UnsupportedAliceRuntimeBehaviorDetails) {
    super(details.message);
    this.name = "UnsupportedAliceRuntimeBehavior";
    this.feature = details.feature;
    this.aliceSelector = details.aliceSelector;
  }
}

interface IdentifierMaps {
  objects: Map<string, string>;
  methods: Map<string, string>;
}

interface RenderContext {
  objectIdentifiers: Map<string, string>;
  parameterIdentifiers: Map<string, string>;
  objectMethods: Map<string, Set<string>>;
  unsupportedBehaviorCount: number;
}

export function generateTypeScriptSource(project: AliceProject): TypeScriptSource {
  const projectName = normalizeProjectName(project.projectName);
  const methods = sortedMethods(project.methods);
  const identifiers = buildIdentifierMaps(project.sceneObjects, methods);
  const objectMethods = collectObjectMethodNames(project, identifiers.objects);
  const procedureEntries = methods.map((method) => ({
    path: `src/procedures/${identifiers.methods.get(method.name)}.ts`,
    content: renderProcedure(method, identifiers, objectMethods),
  }));
  const unsupportedBehaviorCount = procedureEntries.reduce(
    (count, entry) => count + countUnsupportedThrows(entry.content),
    0,
  );

  const entries: TypeScriptSourceEntry[] = [
    { path: ENTRY_POINT, content: renderProject(projectName, methods, identifiers.methods) },
    { path: "src/runtime.ts", content: renderRuntime() },
    { path: "src/scene.ts", content: renderScene(project.sceneObjects, objectMethods, identifiers.objects) },
    ...procedureEntries,
  ];

  const manifest: TypeScriptSourceManifest = {
    schemaVersion: SCHEMA_VERSION,
    product: PRODUCT_ID,
    runtime: RUNTIME_ID,
    projectName,
    entryPoint: ENTRY_POINT,
    files: entries.map((entry) => entry.path),
    sourceFileCount: entries.length,
    sceneObjectCount: project.sceneObjects.length,
    procedureCount: methods.length,
    unsupportedBehaviorCount,
  };

  return { manifest, entries };
}

function normalizeProjectName(projectName: string): string {
  const normalized = projectName.trim();
  if (!normalized) {
    throw new Error("Alice project name must be a non-empty string before TypeScript export.");
  }
  return normalized;
}

function sortedMethods(methods: AliceMethod[]): AliceMethod[] {
  return [...methods].sort((left, right) => left.name.localeCompare(right.name));
}

function buildIdentifierMaps(objects: AliceObject[], methods: AliceMethod[]): IdentifierMaps {
  return {
    objects: assignUniqueIdentifiers(objects.map((object) => object.name), "object"),
    methods: assignUniqueIdentifiers(methods.map((method) => method.name), "procedure"),
  };
}

function assignUniqueIdentifiers(names: string[], fallbackPrefix: string): Map<string, string> {
  const used = new Set<string>();
  const identifiers = new Map<string, string>();
  for (const name of names) {
    const baseIdentifier = sanitizeIdentifier(name, fallbackPrefix);
    let identifier = baseIdentifier;
    let suffix = 2;
    while (used.has(identifier)) {
      identifier = `${baseIdentifier}${suffix}`;
      suffix += 1;
    }
    used.add(identifier);
    identifiers.set(name, identifier);
  }
  return identifiers;
}

function sanitizeIdentifier(value: string, fallbackPrefix: string): string {
  const parts = value
    .trim()
    .split(/[^A-Za-z0-9]+/u)
    .filter(Boolean);
  const joined = parts
    .map((part, index) => index === 0 ? lowerFirst(part) : upperFirst(part))
    .join("");
  const fallback = `${fallbackPrefix}${upperFirst(fallbackPrefix)}`;
  let identifier = joined || fallback;
  if (/^[0-9]/u.test(identifier)) {
    identifier = `${fallbackPrefix}${upperFirst(identifier)}`;
  }
  if (RESERVED_WORDS.has(identifier)) {
    identifier = `${identifier}${upperFirst(fallbackPrefix)}`;
  }
  return identifier;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function upperFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function collectObjectMethodNames(
  project: AliceProject,
  objectIdentifiers: Map<string, string>,
): Map<string, Set<string>> {
  const objectMethods = new Map<string, Set<string>>();
  for (const objectIdentifier of objectIdentifiers.values()) {
    objectMethods.set(objectIdentifier, new Set<string>());
  }

  const visit = (statements: AliceStatement[]): void => {
    for (const statement of statements) {
      if (statement.kind === "MethodCall" && statement.object && statement.method) {
        const objectIdentifier = objectIdentifiers.get(statement.object);
        if (objectIdentifier) {
          objectMethods.get(objectIdentifier)?.add(sanitizeMethodName(statement.method));
        }
      }
      visitNestedStatements(statement, visit);
    }
  };

  for (const method of project.methods) {
    visit(method.statements ?? []);
  }
  return objectMethods;
}

function visitNestedStatements(
  statement: AliceStatement,
  visit: (statements: AliceStatement[]) => void,
): void {
  for (const nested of [
    statement.body,
    statement.ifBody,
    statement.elseBody,
    statement.tryBody,
    statement.catchBody,
    statement.defaultCase ?? undefined,
  ]) {
    if (Array.isArray(nested)) {
      visit(nested);
    }
  }
  for (const branch of statement.cases ?? []) {
    visit(branch.body);
  }
}

function sanitizeMethodName(value: string): string {
  return sanitizeIdentifier(value, "method");
}

function renderProject(
  projectName: string,
  methods: AliceMethod[],
  methodIdentifiers: Map<string, string>,
): string {
  const imports = methods
    .map((method) => {
      const methodIdentifier = methodIdentifiers.get(method.name)!;
      return `import { ${methodIdentifier} } from "./procedures/${methodIdentifier}.js";`;
    });
  const procedureEntries = methods
    .map((method) => `${INDENT}${methodIdentifiers.get(method.name)!},`)
    .join("\n");
  return [
    "import { createScene } from \"./scene.js\";",
    ...imports,
    "",
    `export const projectName = ${quote(projectName)};`,
    `export const product = ${quote(PRODUCT_ID)};`,
    `export const runtime = ${quote(RUNTIME_ID)};`,
    "",
    "export const procedures = {",
    procedureEntries,
    "} as const;",
    "",
    "export function createAliceProject() {",
    `${INDENT}return {`,
    `${INDENT}${INDENT}projectName,`,
    `${INDENT}${INDENT}product,`,
    `${INDENT}${INDENT}runtime,`,
    `${INDENT}${INDENT}scene: createScene(),`,
    `${INDENT}${INDENT}procedures,`,
    `${INDENT}};`,
    "}",
    "",
  ].join("\n");
}

function renderRuntime(): string {
  return [
    "export type AliceRuntimeValue = string | number | boolean | null;",
    "export type AliceRuntimeAction = (...args: readonly AliceRuntimeValue[]) => Promise<void>;",
    "",
    "export interface AliceRuntimeObjectDescriptor {",
    `${INDENT}aliceName: string;`,
    `${INDENT}className: string;`,
    `${INDENT}resourceType: string | null;`,
    `${INDENT}position: { x: number; y: number; z: number } | null;`,
    `${INDENT}orientation: { x: number; y: number; z: number; w: number } | null;`,
    `${INDENT}size: { width: number; height: number; depth: number } | null;`,
    "}",
    "",
    "export interface AliceRuntimeCall {",
    `${INDENT}object: string;`,
    `${INDENT}method: string;`,
    `${INDENT}arguments: readonly AliceRuntimeValue[];`,
    "}",
    "",
    "export interface AliceRuntimeObject extends AliceRuntimeObjectDescriptor {",
    `${INDENT}calls: AliceRuntimeCall[];`,
    `${INDENT}invoke(method: string, args: readonly AliceRuntimeValue[]): Promise<void>;`,
    "}",
    "",
    "export interface AliceRuntimeScene {",
    `${INDENT}objects: Record<string, AliceRuntimeObject>;`,
    `${INDENT}call(object: string, method: string, args: readonly AliceRuntimeValue[]): Promise<void>;`,
    "}",
    "",
    "export interface UnsupportedAliceRuntimeBehaviorDetails {",
    `${INDENT}feature: string;`,
    `${INDENT}aliceSelector: string;`,
    `${INDENT}message: string;`,
    "}",
    "",
    "export class UnsupportedAliceRuntimeBehavior extends Error {",
    `${INDENT}readonly feature: string;`,
    `${INDENT}readonly aliceSelector: string;`,
    "",
    `${INDENT}constructor(details: UnsupportedAliceRuntimeBehaviorDetails) {`,
    `${INDENT}${INDENT}super(details.message);`,
    `${INDENT}${INDENT}this.name = "UnsupportedAliceRuntimeBehavior";`,
    `${INDENT}${INDENT}this.feature = details.feature;`,
    `${INDENT}${INDENT}this.aliceSelector = details.aliceSelector;`,
    `${INDENT}}`,
    "}",
    "",
    "export function createAliceObject<TMethod extends string>(",
    `${INDENT}descriptor: AliceRuntimeObjectDescriptor,`,
    `${INDENT}methodNames: readonly TMethod[],`,
    "): AliceRuntimeObject & Record<TMethod, AliceRuntimeAction> {",
    `${INDENT}const calls: AliceRuntimeCall[] = [];`,
    `${INDENT}const runtimeObject: AliceRuntimeObject = {`,
    `${INDENT}${INDENT}...descriptor,`,
    `${INDENT}${INDENT}calls,`,
    `${INDENT}${INDENT}async invoke(method, args) {`,
    `${INDENT}${INDENT}${INDENT}calls.push({ object: descriptor.aliceName, method, arguments: [...args] });`,
    `${INDENT}${INDENT}},`,
    `${INDENT}};`,
    `${INDENT}const actions = runtimeObject as AliceRuntimeObject & Record<TMethod, AliceRuntimeAction>;`,
    `${INDENT}for (const methodName of methodNames) {`,
    `${INDENT}${INDENT}actions[methodName] = async (...args) => runtimeObject.invoke(methodName, args);`,
    `${INDENT}}`,
    `${INDENT}return actions;`,
    "}",
    "",
  ].join("\n");
}

function renderScene(
  objects: AliceObject[],
  objectMethods: Map<string, Set<string>>,
  objectIdentifiers: Map<string, string>,
): string {
  const objectEntries = [...objects]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((object) => renderSceneObjectEntry(object, objectIdentifiers.get(object.name)!));
  const runtimeObjectEntries = [...objects]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((object) => {
      const identifier = objectIdentifiers.get(object.name)!;
      const methodNames = [...(objectMethods.get(identifier) ?? [])].sort();
      return `${INDENT}${INDENT}${identifier}: createAliceObject(sceneObjects.${identifier}, ${renderStringTuple(methodNames)}),`;
    });

  return [
    "import { createAliceObject, UnsupportedAliceRuntimeBehavior, type AliceRuntimeAction, type AliceRuntimeObject } from \"./runtime.js\";",
    "",
    "export interface AliceSceneObject {",
    `${INDENT}aliceName: string;`,
    `${INDENT}className: string;`,
    `${INDENT}resourceType: string | null;`,
    `${INDENT}position: { x: number; y: number; z: number } | null;`,
    `${INDENT}orientation: { x: number; y: number; z: number; w: number } | null;`,
    `${INDENT}size: { width: number; height: number; depth: number } | null;`,
    "}",
    "",
    "export interface AliceScene {",
    `${INDENT}objects: {`,
    ...[...objects]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((object) => {
        const identifier = objectIdentifiers.get(object.name)!;
        const methodNames = [...(objectMethods.get(identifier) ?? [])].sort();
        return `${INDENT}${INDENT}${identifier}: AliceRuntimeObject & Record<${renderStringUnion(methodNames)}, AliceRuntimeAction>;`;
      }),
    `${INDENT}};`,
    "}",
    "",
    "export const sceneObjects = {",
    ...objectEntries,
    "} as const satisfies Record<string, AliceSceneObject>;",
    "",
    "export function createScene(): AliceScene {",
    `${INDENT}const objects = {`,
    ...runtimeObjectEntries,
    `${INDENT}};`,
    `${INDENT}return {`,
    `${INDENT}${INDENT}objects,`,
    `${INDENT}${INDENT}async call(object, method, args) {`,
    `${INDENT}${INDENT}${INDENT}const target = objects[object as keyof typeof objects];`,
    `${INDENT}${INDENT}${INDENT}if (target) {`,
    `${INDENT}${INDENT}${INDENT}${INDENT}await target.invoke(method, args);`,
    `${INDENT}${INDENT}${INDENT}${INDENT}return;`,
    `${INDENT}${INDENT}${INDENT}}`,
    `${INDENT}${INDENT}${INDENT}throw new UnsupportedAliceRuntimeBehavior({ feature: "unknown receiver", aliceSelector: object, message: \`Alice receiver "\${object}" is unavailable in this TypeScript source export.\` });`,
    `${INDENT}${INDENT}},`,
    `${INDENT}};`,
    "}",
    "",
  ].join("\n");
}

function renderSceneObjectEntry(object: AliceObject, identifier: string): string {
  return [
    `${INDENT}${identifier}: {`,
    `${INDENT}${INDENT}aliceName: ${quote(object.name)},`,
    `${INDENT}${INDENT}className: ${quote(object.typeName)},`,
    `${INDENT}${INDENT}resourceType: ${nullableString(object.resourceType)},`,
    `${INDENT}${INDENT}position: ${renderVector3(object.position)},`,
    `${INDENT}${INDENT}orientation: ${renderOrientation(object.orientation)},`,
    `${INDENT}${INDENT}size: ${renderSize(object.size)},`,
    `${INDENT}},`,
  ].join("\n");
}

function renderVector3(value: AliceObject["position"]): string {
  if (!value) return "null";
  return `{ x: ${numberLiteral(value.x)}, y: ${numberLiteral(value.y)}, z: ${numberLiteral(value.z)} }`;
}

function renderOrientation(value: AliceObject["orientation"]): string {
  if (!value) return "null";
  return `{ x: ${numberLiteral(value.x)}, y: ${numberLiteral(value.y)}, z: ${numberLiteral(value.z)}, w: ${numberLiteral(value.w)} }`;
}

function renderSize(value: AliceObject["size"]): string {
  if (!value) return "null";
  return `{ width: ${numberLiteral(value.width)}, height: ${numberLiteral(value.height)}, depth: ${numberLiteral(value.depth)} }`;
}

function numberLiteral(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

function nullableString(value: string | null | undefined): string {
  return value === null || value === undefined ? "null" : quote(value);
}

function renderStringTuple(values: string[]): string {
  if (values.length === 0) return "[] as const";
  return `[${values.map(quote).join(", ")}] as const`;
}

function renderStringUnion(values: string[]): string {
  if (values.length === 0) return "never";
  return values.map(quote).join(" | ");
}

function renderProcedure(
  method: AliceMethod,
  identifiers: IdentifierMaps,
  objectMethods: Map<string, Set<string>>,
): string {
  const methodIdentifier = identifiers.methods.get(method.name)!;
  const parameterIdentifiers = assignUniqueIdentifiers(
    method.parameters.map((parameter) => parameter.name),
    "parameter",
  );
  const context: RenderContext = {
    objectIdentifiers: identifiers.objects,
    parameterIdentifiers,
    objectMethods,
    unsupportedBehaviorCount: 0,
  };
  const parameters = method.parameters
    .map((parameter) => `${parameterIdentifiers.get(parameter.name)!}: ${mapAliceType(parameter.type)}`)
    .join(", ");
  const signatureParameters = parameters ? `scene: AliceScene, ${parameters}` : "scene: AliceScene";
  const bodyLines = renderStatements(method.statements ?? [], context, `scene.${method.name}`, 1);
  const body = bodyLines.length > 0 ? bodyLines : [`${INDENT}return;`];

  return [
    "import type { AliceScene } from \"../scene.js\";",
    "import { UnsupportedAliceRuntimeBehavior } from \"../runtime.js\";",
    "",
    `export async function ${methodIdentifier}(${signatureParameters}): Promise<${method.isFunction ? mapAliceType(method.returnType) : "void"}> {`,
    ...body,
    "}",
    "",
  ].join("\n");
}

function mapAliceType(typeName: string | null | undefined): string {
  switch (typeName) {
    case "Boolean":
    case "boolean":
      return "boolean";
    case "DecimalNumber":
    case "Double":
    case "Integer":
    case "WholeNumber":
    case "number":
      return "number";
    case "TextString":
    case "String":
    case "string":
      return "string";
    case "void":
    case undefined:
    case null:
      return "void";
    default:
      return "unknown";
  }
}

function renderStatements(
  statements: AliceStatement[],
  context: RenderContext,
  selector: string,
  depth: number,
): string[] {
  return statements.flatMap((statement, index) => renderStatement(statement, context, `${selector}[${index}]`, depth));
}

function renderStatement(
  statement: AliceStatement,
  context: RenderContext,
  selector: string,
  depth: number,
): string[] {
  switch (statement.kind) {
    case "MethodCall":
      return [renderMethodCall(statement, context, depth)];
    case "CountLoop":
      return renderCountLoop(statement, context, selector, depth);
    case "IfElse":
      return renderIfElse(statement, context, selector, depth);
    case "Return":
      return [`${indent(depth)}return${statement.expression || statement.value ? ` ${renderExpression(statement.expression ?? statement.value, context)}` : ""};`];
    default:
      return [renderUnsupportedThrow(statement.kind, selector, depth)];
  }
}

function renderMethodCall(
  statement: AliceStatement,
  context: RenderContext,
  depth: number,
): string {
  const objectName = requireString(statement.object, "MethodCall.object");
  const methodName = sanitizeMethodName(requireString(statement.method, "MethodCall.method"));
  const args = (statement.arguments ?? []).map((argument) => renderExpression(argument, context)).join(", ");
  const objectIdentifier = context.objectIdentifiers.get(objectName);
  if (objectIdentifier) {
    context.objectMethods.get(objectIdentifier)?.add(methodName);
    return `${indent(depth)}await scene.objects.${objectIdentifier}.${methodName}(${args});`;
  }
  return `${indent(depth)}await scene.call(${quote(objectName)}, ${quote(methodName)}, [${args}]);`;
}

function renderCountLoop(
  statement: AliceStatement,
  context: RenderContext,
  selector: string,
  depth: number,
): string[] {
  const count = statement.countExpression
    ? renderExpression(statement.countExpression, context)
    : numberLiteral(statement.count ?? 0);
  const lines = [`${indent(depth)}for (let index = 0; index < ${count}; index += 1) {`];
  lines.push(...renderStatements(statement.body ?? [], context, selector, depth + 1));
  lines.push(`${indent(depth)}}`);
  return lines;
}

function renderIfElse(
  statement: AliceStatement,
  context: RenderContext,
  selector: string,
  depth: number,
): string[] {
  const condition = renderBooleanExpression(statement.condition, context);
  if (!condition) {
    return [renderUnsupportedThrow("IfElse condition expression", selector, depth)];
  }
  const lines = [`${indent(depth)}if (${condition}) {`];
  lines.push(...renderStatements(statement.ifBody ?? [], context, `${selector}.if`, depth + 1));
  if ((statement.elseBody ?? []).length > 0) {
    lines.push(`${indent(depth)}} else {`);
    lines.push(...renderStatements(statement.elseBody ?? [], context, `${selector}.else`, depth + 1));
  }
  lines.push(`${indent(depth)}}`);
  return lines;
}

function renderUnsupportedThrow(feature: string, selector: string, depth: number): string {
  return `${indent(depth)}throw new UnsupportedAliceRuntimeBehavior({ feature: ${quote(feature)}, aliceSelector: ${quote(selector)}, message: ${quote(`Alice ${feature} behavior is unsupported by this TypeScript source export.`)} });`;
}

function renderExpression(value: unknown, context: RenderContext): string {
  if (typeof value === "number") return numberLiteral(value);
  if (typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  const text = String(value).trim();
  const parameter = context.parameterIdentifiers.get(text);
  if (parameter) return parameter;
  if (/^-?(?:\d+|\d*\.\d+)$/u.test(text)) return text;
  if (text === "true" || text === "false" || text === "null") return text;
  if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
    try {
      return quote(JSON.parse(text.replace(/^'/u, "\"").replace(/'$/u, "\"")) as string);
    } catch {
      return quote(text.slice(1, -1));
    }
  }
  return quote(text);
}

function renderBooleanExpression(value: unknown, context: RenderContext): string | null {
  if (typeof value === "boolean") return String(value);
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "true" || text === "false") return text;
  const parameter = context.parameterIdentifiers.get(text);
  return parameter ? `Boolean(${parameter})` : null;
}

function requireString(value: string | undefined, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Cannot generate TypeScript source: ${fieldName} must be a non-empty string.`);
  }
  return value;
}

function countUnsupportedThrows(content: string): number {
  return content.split("throw new UnsupportedAliceRuntimeBehavior").length - 1;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function indent(depth: number): string {
  return INDENT.repeat(depth);
}
