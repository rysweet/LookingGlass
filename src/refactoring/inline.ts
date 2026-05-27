import {
  ClassDeclaration,
  ConstructorDeclaration,
  ExpressionStatement,
  MethodInvocation,
  NamedUserType,
  ReturnStatement,
  ThisExpression,
  UserMethod,
  type AbstractDeclaration,
  type AbstractExpression,
  type Expression,
  type Statement,
} from "../ast-nodes.js";
import {
  attachNode,
  cloneExpression,
  cloneStatement,
  referenceName,
  type CloneTransform,
} from "./clone.js";
import { RefactoringError, type InlineMethodOptions, type InlineMethodResult } from "./types.js";

export function inlineMethodBody(
  declaringType: NamedUserType | ClassDeclaration,
  method: UserMethod,
  options: InlineMethodOptions = {},
): InlineMethodResult {
  if (hasRecursiveSelfCall(declaringType, method)) {
    throw new RefactoringError("Inline method does not support recursive methods.");
  }

  const expressionTemplate = getInlineExpressionTemplate(method);
  const mode = expressionTemplate ? "expression" : "statement";
  if (!expressionTemplate && method.returnType.type !== "VoidTypeRef") {
    throw new RefactoringError("Non-void methods can only be inlined when the body is a single return statement.");
  }
  if (!expressionTemplate && method.body.some((statement) => statement instanceof ReturnStatement)) {
    throw new RefactoringError("Void inline method does not support explicit return statements.");
  }

  let callSiteCount = 0;
  const replaceExpression = (expression: Expression): Expression | null => {
    if (!(expression instanceof MethodInvocation) || !matchesInvocation(expression, declaringType, method)) {
      return null;
    }
    if (!expressionTemplate) {
      return null;
    }
    callSiteCount += 1;
    const replacements = buildInvocationReplacementMap(method, expression);
    return cloneExpression(expressionTemplate, {
      replaceExpression: (candidate) => substituteExpression(candidate, replacements, expression.target),
    });
  };
  const replaceStatement = (statement: Statement): Statement[] | null => {
    if (!(statement instanceof ExpressionStatement) || !(statement.expression instanceof MethodInvocation)) {
      return null;
    }
    const invocation = statement.expression;
    if (!matchesInvocation(invocation, declaringType, method) || expressionTemplate) {
      return null;
    }
    callSiteCount += 1;
    const replacements = buildInvocationReplacementMap(method, invocation);
    return method.body.flatMap((bodyStatement) => cloneStatement(bodyStatement, {
      replaceExpression: (candidate) => substituteExpression(candidate, replacements, invocation.target),
    }));
  };

  rewriteTypeBodies(declaringType, { replaceExpression, replaceStatement });
  if (callSiteCount === 0) {
    throw new RefactoringError("No call sites matched the requested method.");
  }

  const removeSourceMethod = options.removeSourceMethod !== false;
  if (removeSourceMethod) {
    const index = declaringType.methods.indexOf(method);
    if (index >= 0) {
      declaringType.methods.splice(index, 1);
    }
  }

  return { mode, callSiteCount, removedSourceMethod: removeSourceMethod };
}

function getInlineExpressionTemplate(method: UserMethod): Expression | null {
  if (method.body.length !== 1) {
    return null;
  }
  const statement = method.body[0];
  return statement instanceof ReturnStatement && statement.expression ? statement.expression : null;
}

function hasRecursiveSelfCall(declaringType: NamedUserType | ClassDeclaration, method: UserMethod): boolean {
  return method.body.some((statement) => containsInvocation(statement, (invocation) => matchesInvocation(invocation, declaringType, method)));
}

function containsInvocation(statement: Statement, predicate: (invocation: MethodInvocation) => boolean): boolean {
  let found = false;
  (statement as unknown as { traverse(visitor: (node: AbstractDeclaration | AbstractExpression | Statement) => void): void }).traverse((node) => {
    if (!found && node instanceof MethodInvocation && predicate(node)) {
      found = true;
    }
  });
  return found;
}

function matchesInvocation(
  invocation: MethodInvocation,
  declaringType: NamedUserType | ClassDeclaration,
  method: UserMethod,
): boolean {
  if (invocation.method === method) {
    return true;
  }
  if (invocation.methodName !== method.name || invocation.arguments.length !== method.parameters.length) {
    return false;
  }
  if (!invocation.target || invocation.target instanceof ThisExpression) {
    return true;
  }
  const targetType = invocation.target.getType();
  return targetType?.type === "SimpleTypeRef" && targetType.name === declaringType.name;
}

function buildInvocationReplacementMap(method: UserMethod, invocation: MethodInvocation): Map<string, () => Expression> {
  const replacements = new Map<string, () => Expression>();
  const positionalArguments = invocation.arguments.filter((argument) => argument.name === null);
  const namedArguments = new Map(
    invocation.arguments
      .filter((argument) => argument.name !== null)
      .map((argument) => [argument.name!, argument.value]),
  );

  method.parameters.forEach((parameter, index) => {
    const argument = positionalArguments[index]?.value
      ?? namedArguments.get(parameter.name)
      ?? parameter.defaultValue;
    if (!argument) {
      throw new RefactoringError(`Missing argument for parameter '${parameter.name}'.`);
    }
    replacements.set(parameter.name, () => cloneExpression(argument));
  });
  return replacements;
}

function substituteExpression(
  expression: Expression,
  replacements: Map<string, () => Expression>,
  targetExpression: Expression | null,
): Expression | null {
  if (expression instanceof ThisExpression && targetExpression) {
    return cloneExpression(targetExpression);
  }
  const replacementFactory = replacements.get(referenceName(expression));
  return replacementFactory ? replacementFactory() : null;
}

function rewriteTypeBodies(type: NamedUserType | ClassDeclaration, transform: CloneTransform): void {
  for (const field of type.fields) {
    if (field.initializer) {
      field.initializer = cloneExpression(field.initializer, transform);
      attachNode(field, field.initializer);
    }
  }
  for (const constructorDeclaration of type.constructors) {
    rewriteStatementArray(constructorDeclaration, constructorDeclaration.body, transform);
  }
  for (const method of type.methods) {
    rewriteStatementArray(method, method.body, transform);
  }
}

function rewriteStatementArray(owner: UserMethod | ConstructorDeclaration, statements: Statement[], transform: CloneTransform): void {
  const rewritten = statements.flatMap((statement) => cloneStatement(statement, transform));
  statements.splice(0, statements.length, ...rewritten);
  rewritten.forEach((statement) => attachNode(owner, statement));
}
