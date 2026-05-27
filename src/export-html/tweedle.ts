import type { AliceMethod, AliceProject, AliceStatement } from "../a3p-parser.js";
import { createTweedleSource } from "../code-generation.js";

const TYPE_ALIASES: Record<string, string> = {
  WholeNumber: "WholeNumber",
  Integer: "WholeNumber",
  DecimalNumber: "DecimalNumber",
  Double: "DecimalNumber",
  Number: "DecimalNumber",
  Boolean: "Boolean",
  TextString: "TextString",
  String: "TextString",
  void: "void",
};

export function buildEmbeddedTweedleSource(project: AliceProject): string {
  const className = sanitizeIdentifier(project.projectName || "Program", "Program");
  const methods = project.methods.length > 0
    ? project.methods.map((method) => ({
      name: sanitizeIdentifier(method.name, "method"),
      returnType: method.isFunction ? normalizeTweedleType(method.returnType, "Object") : "void",
      parameters: method.parameters.map((parameter) => `${normalizeTweedleType(parameter.type, "Object")} ${sanitizeIdentifier(parameter.name, "value")}`),
      body: renderEmbeddedMethodBody(method),
    }))
    : [{ name: "initializeScene", returnType: "void", parameters: [], body: renderFallbackSceneBody(project) }];
  return createTweedleSource(className, methods);
}

function renderEmbeddedMethodBody(method: AliceMethod): string[] {
  const lines = flattenStatementSummaries(method.statements).map((line) => `// ${line}`);
  if (lines.length === 0) lines.push("// No statements serialized for this method.");
  if (method.isFunction) lines.push(`return ${defaultTweedleValue(method.returnType)};`);
  return lines;
}

function renderFallbackSceneBody(project: AliceProject): string[] {
  return project.sceneObjects.length === 0
    ? ["// No scene objects were serialized into this export."]
    : project.sceneObjects.map((object) => `// scene includes ${object.name} : ${object.typeName}`);
}

function flattenStatementSummaries(statements: readonly AliceStatement[], depth = 0): string[] {
  const prefix = "  ".repeat(depth);
  const lines: string[] = [];
  for (const statement of statements) {
    lines.push(`${prefix}${summarizeStatement(statement)}`);
    for (const nested of nestedStatementGroups(statement)) {
      lines.push(...flattenStatementSummaries(nested, depth + 1));
    }
  }
  return lines;
}

function nestedStatementGroups(statement: AliceStatement): AliceStatement[][] {
  const groups: AliceStatement[][] = [];
  if (statement.body) groups.push(statement.body);
  if (statement.ifBody) groups.push(statement.ifBody);
  if (statement.elseBody) groups.push(statement.elseBody);
  if (statement.tryBody) groups.push(statement.tryBody);
  if (statement.catchBody) groups.push(statement.catchBody);
  if (statement.defaultCase) groups.push(statement.defaultCase);
  for (const switchCase of statement.cases ?? []) groups.push(switchCase.body);
  return groups;
}

function summarizeStatement(statement: AliceStatement): string {
  switch (statement.kind) {
    case "MethodCall": {
      const receiver = statement.object ? `${statement.object}.` : "";
      const args = statement.arguments?.join(", ") ?? "";
      return `${receiver}${statement.method ?? "method"}(${args})`;
    }
    case "CountLoop":
      return `countUpTo ${statement.countExpression ?? statement.count ?? 0}`;
    case "WhileLoop":
      return `while ${statement.condition ?? "condition"}`;
    case "IfElse":
      return `if ${statement.condition ?? "condition"}`;
    case "Return":
      return `return ${statement.expression ?? "value"}`;
    case "VariableDeclaration":
      return `${normalizeTweedleType(statement.varType, "Object")} ${statement.name ?? "value"} <- ${statement.value ?? "null"}`;
    default:
      return `${statement.kind}${statement.expression ? ` ${statement.expression}` : ""}`;
  }
}

function defaultTweedleValue(typeName: string | undefined): string {
  switch (normalizeTweedleType(typeName, "Object")) {
    case "WholeNumber":
    case "DecimalNumber":
      return "0";
    case "Boolean":
      return "false";
    case "TextString":
      return '""';
    default:
      return "null";
  }
}

function normalizeTweedleType(typeName: string | undefined, fallback: string): string {
  const trimmed = typeName?.trim();
  if (!trimmed) return fallback;
  const alias = TYPE_ALIASES[trimmed];
  if (alias) return alias;
  const shortName = trimmed.split(".").pop() ?? trimmed;
  return sanitizeIdentifier(shortName, fallback);
}

function sanitizeIdentifier(name: string, fallback: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+/, "").replace(/_+$/, "");
  if (!sanitized) return fallback;
  return /^[A-Za-z_]/.test(sanitized) ? sanitized : `_${sanitized}`;
}
