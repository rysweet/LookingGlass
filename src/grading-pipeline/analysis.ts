import type { AliceMethod, AliceProject, AliceStatement } from "../a3p-parser.js";
import { Scene } from "../story-api/scene";
import { SCamera, SGround, SScene } from "../story-api/entities";
import type {
  AstStatementEntry,
  EventRegistration,
  ExecutionLogEntry,
  PipelineGradeInput,
  ProjectAstSummary,
} from "./types.js";

const RE_EVENT_NAME = /(event|listener|activated|when)/i;

export function countNonDefaultEntities(scene: Scene): number {
  let count = 0;
  for (const [, entity] of scene.entities) {
    if (entity instanceof SGround || entity instanceof SScene || entity instanceof SCamera) {
      continue;
    }
    count += 1;
  }
  return count;
}

function nestedStatementGroups(statement: AliceStatement): AliceStatement[][] {
  const groups: AliceStatement[][] = [];
  if (statement.body) groups.push(statement.body);
  if (statement.ifBody) groups.push(statement.ifBody);
  if (statement.elseBody) groups.push(statement.elseBody);
  if (statement.tryBody) groups.push(statement.tryBody);
  if (statement.catchBody) groups.push(statement.catchBody);
  if (statement.defaultCase) groups.push(statement.defaultCase);
  for (const entry of statement.cases ?? []) {
    groups.push(entry.body);
  }
  return groups;
}

function walkStatements(
  statements: readonly AliceStatement[],
  visitor: (statement: AliceStatement, depth: number) => void,
  depth = 1,
): void {
  for (const statement of statements) {
    visitor(statement, depth);
    for (const group of nestedStatementGroups(statement)) {
      walkStatements(group, visitor, depth + 1);
    }
  }
}

function isLoopStatement(statement: AliceStatement): boolean {
  return statement.kind.includes("Loop") || statement.kind.includes("Each");
}

function isVariableStatement(statement: AliceStatement): boolean {
  return statement.kind === "VariableDeclaration" || statement.kind.includes("Variable");
}

function isEventStatement(statement: AliceStatement): boolean {
  return Boolean(statement.event)
    || statement.kind.includes("Event")
    || statement.kind.includes("Listener");
}

function methodKey(method: AliceMethod): string {
  return `${method.name}:${method.returnType}:${method.parameters
    .map((parameter) => `${parameter.name}:${parameter.type}`)
    .join(",")}`;
}

function collectProjectMethods(project: AliceProject): AliceMethod[] {
  const methods: AliceMethod[] = [];
  const seen = new Set<string>();

  const addMethod = (method: AliceMethod): void => {
    const key = methodKey(method);
    if (seen.has(key)) return;
    seen.add(key);
    methods.push(method);
  };

  for (const method of project.methods) {
    addMethod(method);
  }
  for (const type of project.types ?? []) {
    for (const method of type.methods ?? []) {
      addMethod(method);
    }
    for (const constructor of type.constructors ?? []) {
      addMethod(constructor);
    }
  }

  return methods;
}

function extractProjectAst(project: AliceProject): ProjectAstSummary {
  const methods = collectProjectMethods(project);
  const statements: AstStatementEntry[] = [];
  let functionCount = 0;
  let parameterCount = 0;
  let variableCount = 0;
  let loopCount = 0;
  let eventCount = 0;
  let methodCallCount = 0;

  for (const method of methods) {
    if (method.isFunction) functionCount += 1;
    parameterCount += method.parameters.length;
    walkStatements(method.statements, (statement, depth) => {
      statements.push({ methodName: method.name, depth, statement });
      if (isVariableStatement(statement)) variableCount += 1;
      if (isLoopStatement(statement)) loopCount += 1;
      if (isEventStatement(statement)) eventCount += 1;
      if (statement.kind === "MethodCall") methodCallCount += 1;
    });
  }

  return {
    methods,
    statements,
    methodCount: methods.length,
    functionCount,
    parameterCount,
    variableCount,
    loopCount,
    eventCount,
    methodCallCount,
    statementCount: statements.length,
  };
}

function formatMethodCall(statement: AliceStatement): string {
  const objectName = statement.object ?? "this";
  const methodName = statement.method ?? "unknown";
  const args = statement.arguments ?? [];
  return `${objectName}.${methodName}(${args.join(", ")})`;
}

function formatStatementDetail(statement: AliceStatement): string {
  switch (statement.kind) {
    case "MethodCall":
      return formatMethodCall(statement);
    case "VariableDeclaration":
      return `${statement.name ?? "unknown"}:${statement.varType ?? "Object"}`;
    case "IfElse":
      return statement.condition ?? "unknown";
    case "ReturnStatement":
      return statement.expression ?? "unknown";
    default:
      return statement.event
        ?? statement.expression
        ?? statement.method
        ?? statement.name
        ?? statement.kind;
  }
}

function buildExecutionLog(statements: readonly AstStatementEntry[]): ExecutionLogEntry[] {
  return statements.map((entry, index) => ({
    step: index + 1,
    kind: entry.statement.kind,
    detail: formatStatementDetail(entry.statement),
  }));
}

function buildEventRegistrations(statements: readonly AstStatementEntry[]): EventRegistration[] {
  const registrations: EventRegistration[] = [];
  const seen = new Set<string>();

  for (const entry of statements) {
    if (!isEventStatement(entry.statement)) continue;
    const registration = {
      eventType: entry.statement.event ?? entry.statement.kind,
      handlerName: entry.methodName,
    };
    const key = `${registration.eventType}:${registration.handlerName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    registrations.push(registration);
  }

  return registrations;
}

function buildDeclaredMethods(methods: readonly AliceMethod[]): string[] {
  return methods.map((method) => method.name);
}

export function buildGradeInputFromProject(project: AliceProject): PipelineGradeInput {
  const ast = extractProjectAst(project);
  return {
    project,
    ast,
    scene: Scene.fromProject(project),
    executionLog: buildExecutionLog(ast.statements),
    eventRegistrations: buildEventRegistrations(ast.statements),
    declaredMethods: buildDeclaredMethods(ast.methods),
  };
}

export function looksLikeEventHandlerName(name: string): boolean {
  return RE_EVENT_NAME.test(name);
}
