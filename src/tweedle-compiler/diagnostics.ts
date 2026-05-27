import type { Expression, Statement, TypeRef } from "../tweedle-parser.js";
import { type CompilationUnit, CompilerError, CompilerWarning } from "./core.js";

export function normalizeTypeName(name: string | null | undefined): string {
  if (!name) return "";
  return name.replace(/\[\]/gu, "").trim();
}

export function typeRefName(typeRef: TypeRef): string {
  switch (typeRef.type) {
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return "Function";
    case "SimpleTypeRef": {
      const suffix = typeRef.isArray ? "[]".repeat(typeRef.arrayDimensions ?? 1) : "";
      return `${typeRef.name}${suffix}`;
    }
    default:
      return "Object";
  }
}

export function collectStatementsTypeReferences(statements: readonly Statement[]): string[] {
  const referencedTypes: string[] = [];
  for (const statement of statements) {
    switch (statement.type) {
      case "DoInOrder":
      case "DoTogether":
      case "Block":
        referencedTypes.push(...collectStatementsTypeReferences(statement.body));
        break;
      case "IfElse":
        referencedTypes.push(...collectExpressionTypeReferences(statement.condition));
        referencedTypes.push(...collectStatementsTypeReferences(statement.ifBody));
        referencedTypes.push(...collectStatementsTypeReferences(statement.elseBody ?? []));
        break;
      case "ForEach":
        referencedTypes.push(typeRefName(statement.itemType));
        referencedTypes.push(...collectExpressionTypeReferences(statement.collection));
        referencedTypes.push(...collectStatementsTypeReferences(statement.body));
        break;
      case "CountUpTo":
      case "WhileLoop":
        referencedTypes.push(...collectExpressionTypeReferences(statement.type === "WhileLoop" ? statement.condition : statement.count));
        referencedTypes.push(...collectStatementsTypeReferences(statement.body));
        break;
      case "TryCatch":
        referencedTypes.push(typeRefName(statement.catchType));
        referencedTypes.push(...collectStatementsTypeReferences(statement.tryBody));
        referencedTypes.push(...collectStatementsTypeReferences(statement.catchBody));
        break;
      case "SwitchCase":
        referencedTypes.push(...collectExpressionTypeReferences(statement.expression));
        for (const switchCase of statement.cases) {
          referencedTypes.push(...collectExpressionTypeReferences(switchCase.value));
          referencedTypes.push(...collectStatementsTypeReferences(switchCase.body));
        }
        referencedTypes.push(...collectStatementsTypeReferences(statement.defaultCase ?? []));
        break;
      case "Return":
        referencedTypes.push(...collectExpressionTypeReferences(statement.expression));
        break;
      case "ExpressionStatement":
        referencedTypes.push(...collectExpressionTypeReferences(statement.expression));
        break;
      case "LocalVariableDeclaration":
        referencedTypes.push(typeRefName(statement.varType));
        referencedTypes.push(...collectExpressionTypeReferences(statement.initializer));
        break;
      case "ThisConstructorInvocationStatement":
      case "SuperConstructorInvocationStatement":
        for (const argument of statement.arguments ?? []) referencedTypes.push(...collectExpressionTypeReferences(argument.value));
        break;
      case "DisabledBlock":
      case "Comment":
        break;
      default:
        assertNever(statement);
    }
  }
  return referencedTypes;
}

export function collectExpressionTypeReferences(expression: Expression | null | undefined): string[] {
  if (!expression) return [];
  switch (expression.type) {
    case "Literal":
    case "This":
    case "Super":
    case "Identifier":
      return [];
    case "MemberAccess":
      return collectExpressionTypeReferences(expression.target);
    case "MethodInvocation":
      return [...collectExpressionTypeReferences(expression.target), ...expression.arguments.flatMap((argument) => collectExpressionTypeReferences(argument.value))];
    case "NewInstance":
      return [expression.className, ...expression.arguments.flatMap((argument) => collectExpressionTypeReferences(argument.value))];
    case "NewArray":
      return [typeRefName(expression.elementType), ...expression.elements.flatMap(collectExpressionTypeReferences), ...collectExpressionTypeReferences(expression.size)];
    case "ArrayLiteral":
      return expression.elements.flatMap(collectExpressionTypeReferences);
    case "BinaryOp":
      return [...collectExpressionTypeReferences(expression.left), ...collectExpressionTypeReferences(expression.right)];
    case "UnaryOp":
      return collectExpressionTypeReferences(expression.operand);
    case "Assignment":
      return [...collectExpressionTypeReferences(expression.target), ...collectExpressionTypeReferences(expression.value)];
    case "ArrayAccess":
      return [...collectExpressionTypeReferences(expression.target), ...collectExpressionTypeReferences(expression.index)];
    case "TypeCast":
      return [typeRefName(expression.targetType), ...collectExpressionTypeReferences(expression.expression)];
    case "InstanceOf":
      return [typeRefName(expression.testType), ...collectExpressionTypeReferences(expression.expression)];
    case "Parenthesized":
      return collectExpressionTypeReferences(expression.expression);
    case "LambdaExpression":
      return [];
    default:
      return assertNever(expression);
  }
}

export function collectUnusedVariableWarnings(unit: CompilationUnit, methodName: string, statements: readonly Statement[]): CompilerWarning[] {
  const warnings: CompilerWarning[] = [];
  collectBlockUnusedVariables(unit, methodName, statements, warnings);
  return warnings;
}

function collectBlockUnusedVariables(unit: CompilationUnit, methodName: string, statements: readonly Statement[], warnings: CompilerWarning[]): void {
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    if (statement.type === "LocalVariableDeclaration") {
      const remainingStatements = statements.slice(index + 1);
      if (!statementsUseIdentifier(remainingStatements, statement.name)) {
        warnings.push(new CompilerWarning(`Unused local '${statement.name}' in ${unit.className ?? unit.filePath}.${methodName}`, null, "unused-variable"));
      }
    }
    for (const nested of nestedBodies(statement)) collectBlockUnusedVariables(unit, methodName, nested, warnings);
  }
}

export function collectControlFlowWarnings(unit: CompilationUnit, methodName: string, statements: readonly Statement[]): CompilerWarning[] {
  const warnings: CompilerWarning[] = [];
  collectControlFlowWarningsInBlock(unit, methodName, statements, warnings);
  return warnings;
}

function collectControlFlowWarningsInBlock(unit: CompilationUnit, methodName: string, statements: readonly Statement[], warnings: CompilerWarning[]): void {
  let sawReturn = false;
  for (const statement of statements) {
    if (sawReturn) {
      warnings.push(new CompilerWarning(`Unreachable ${statement.type} in ${unit.className ?? unit.filePath}.${methodName}`, null, "unreachable-code"));
      break;
    }
    for (const nested of nestedBodies(statement)) collectControlFlowWarningsInBlock(unit, methodName, nested, warnings);
    if (statement.type === "Return") sawReturn = true;
  }
}

function nestedBodies(statement: Statement): Statement[][] {
  switch (statement.type) {
    case "DoInOrder":
    case "DoTogether":
    case "Block":
    case "CountUpTo":
    case "WhileLoop":
    case "ForEach":
      return [statement.body];
    case "IfElse":
      return [statement.ifBody, statement.elseBody ?? []];
    case "TryCatch":
      return [statement.tryBody, statement.catchBody];
    case "SwitchCase":
      return [...statement.cases.map((switchCase) => switchCase.body), statement.defaultCase ?? []];
    case "Return":
    case "ExpressionStatement":
    case "LocalVariableDeclaration":
    case "ThisConstructorInvocationStatement":
    case "SuperConstructorInvocationStatement":
    case "DisabledBlock":
    case "Comment":
      return [];
    default:
      return assertNever(statement);
  }
}

function statementsUseIdentifier(statements: readonly Statement[], name: string): boolean {
  return statements.some((statement) => statementUsesIdentifier(statement, name));
}

function statementUsesIdentifier(statement: Statement, name: string): boolean {
  switch (statement.type) {
    case "DoInOrder":
    case "DoTogether":
    case "Block":
    case "CountUpTo":
    case "WhileLoop":
    case "ForEach":
      return statement.type === "ForEach"
        ? statement.itemName === name || expressionUsesIdentifier(statement.collection, name) || statementsUseIdentifier(statement.body, name)
        : statement.type === "CountUpTo"
          ? expressionUsesIdentifier(statement.count, name) || statementsUseIdentifier(statement.body, name)
          : statement.type === "WhileLoop"
            ? expressionUsesIdentifier(statement.condition, name) || statementsUseIdentifier(statement.body, name)
            : statementsUseIdentifier(statement.body, name);
    case "IfElse":
      return expressionUsesIdentifier(statement.condition, name) || statementsUseIdentifier(statement.ifBody, name) || statementsUseIdentifier(statement.elseBody ?? [], name);
    case "TryCatch":
      return statementsUseIdentifier(statement.tryBody, name) || statementsUseIdentifier(statement.catchBody, name);
    case "SwitchCase":
      return expressionUsesIdentifier(statement.expression, name)
        || statement.cases.some((switchCase) => expressionUsesIdentifier(switchCase.value, name) || statementsUseIdentifier(switchCase.body, name))
        || statementsUseIdentifier(statement.defaultCase ?? [], name);
    case "Return":
      return expressionUsesIdentifier(statement.expression, name);
    case "ExpressionStatement":
      return expressionUsesIdentifier(statement.expression, name);
    case "LocalVariableDeclaration":
      return expressionUsesIdentifier(statement.initializer, name);
    case "ThisConstructorInvocationStatement":
    case "SuperConstructorInvocationStatement":
      return (statement.arguments ?? []).some((argument) => expressionUsesIdentifier(argument.value, name));
    case "DisabledBlock":
    case "Comment":
      return false;
    default:
      return assertNever(statement);
  }
}

function expressionUsesIdentifier(expression: Expression | null | undefined, name: string): boolean {
  if (!expression) return false;
  switch (expression.type) {
    case "Identifier":
      return expression.name === name;
    case "MemberAccess":
      return expressionUsesIdentifier(expression.target, name);
    case "MethodInvocation":
      return expressionUsesIdentifier(expression.target, name) || expression.arguments.some((argument) => expressionUsesIdentifier(argument.value, name));
    case "NewInstance":
      return expression.arguments.some((argument) => expressionUsesIdentifier(argument.value, name));
    case "NewArray":
      return expression.elements.some((element) => expressionUsesIdentifier(element, name)) || expressionUsesIdentifier(expression.size, name);
    case "ArrayLiteral":
      return expression.elements.some((element) => expressionUsesIdentifier(element, name));
    case "BinaryOp":
      return expressionUsesIdentifier(expression.left, name) || expressionUsesIdentifier(expression.right, name);
    case "UnaryOp":
      return expressionUsesIdentifier(expression.operand, name);
    case "Assignment":
      return expressionUsesIdentifier(expression.target, name) || expressionUsesIdentifier(expression.value, name);
    case "ArrayAccess":
      return expressionUsesIdentifier(expression.target, name) || expressionUsesIdentifier(expression.index, name);
    case "TypeCast":
    case "InstanceOf":
    case "Parenthesized":
      return expressionUsesIdentifier(expression.expression, name);
    case "Literal":
    case "This":
    case "Super":
    case "LambdaExpression":
      return false;
    default:
      return assertNever(expression);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
