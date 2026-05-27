import {
  ClassDeclaration,
  ExpressionStatement,
  LocalAccess,
  LocalDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  NamedUserType,
  ParameterAccess,
  ReturnStatement,
  ThisExpression,
  UserLocal,
  UserMethod,
  UserParameter,
  type Expression,
  type Statement,
} from "../ast-nodes.js";
import { UsageTracker } from "../search.js";
import { assertValidIdentifier, cloneTypeRef } from "../type-browser.js";
import {
  attachNode,
  cloneStatement,
  createMethodReference,
  createUserMethodLike,
  referenceName,
} from "./clone.js";
import { RefactoringError, type ExtractMethodOptions, type ExtractMethodResult } from "./types.js";

export function extractMethod(
  declaringType: NamedUserType | ClassDeclaration,
  sourceMethod: UserMethod,
  options: ExtractMethodOptions,
): ExtractMethodResult {
  assertValidIdentifier(options.extractedName, "extracted method name");
  if (options.startIndex < 0 || options.endIndex > sourceMethod.body.length || options.startIndex >= options.endIndex) {
    throw new RefactoringError("Selected statement range is out of bounds.");
  }

  const selectedStatements = sourceMethod.body.slice(options.startIndex, options.endIndex);
  const returnStatements = selectedStatements.filter((statement): statement is ReturnStatement => statement instanceof ReturnStatement);
  if (returnStatements.length > 1 || (returnStatements.length === 1 && selectedStatements[selectedStatements.length - 1] !== returnStatements[0])) {
    throw new RefactoringError("Extract method only supports a single trailing return statement.");
  }

  const dependencies = collectExternalDependencies(sourceMethod, selectedStatements);
  const extractedParameters = dependencies.map((dependency) => new UserParameter(
    dependency.name,
    cloneTypeRef(dependency instanceof UserParameter ? dependency.paramType : dependency.valueType),
  ));
  const parameterReplacementMap = new Map<string, () => Expression>(
    extractedParameters.map((parameter) => [
      parameter.name,
      () => new ParameterAccess(parameter.name, cloneTypeRef(parameter.paramType)),
    ]),
  );

  const extractedBody = selectedStatements.flatMap((statement) => cloneStatement(statement, {
    replaceExpression: (expression) => {
      const replacement = parameterReplacementMap.get(referenceName(expression));
      return replacement ? replacement() : null;
    },
  }));

  const extractedMethod = createUserMethodLike(
    sourceMethod,
    options.extractedName,
    returnStatements[0]?.expressionType ?? returnStatements[0]?.expression?.getType() ?? { type: "VoidTypeRef" },
    extractedParameters,
    extractedBody,
    options.visibility ?? sourceMethod.visibility,
  );
  attachNode(declaringType, extractedMethod);

  const callArguments = dependencies.map((dependency) => ({
    name: null,
    value: dependency instanceof UserParameter
      ? new ParameterAccess(dependency.name, cloneTypeRef(dependency.paramType))
      : new LocalAccess(dependency.name, cloneTypeRef(dependency.valueType)),
  }));
  const callExpression = new MethodInvocation(
    sourceMethod.isStatic ? null : new ThisExpression({ type: "SimpleTypeRef", name: declaringType.name, isArray: false }),
    options.extractedName,
    callArguments,
    createMethodReference(extractedMethod),
  );
  const replacementStatements = returnStatements.length === 1
    ? [new ReturnStatement(callExpression, extractedMethod.returnType)]
    : [new ExpressionStatement(callExpression)];

  sourceMethod.body.splice(options.startIndex, options.endIndex - options.startIndex, ...replacementStatements);
  replacementStatements.forEach((statement) => attachNode(sourceMethod, statement));

  const methodIndex = declaringType.methods.indexOf(sourceMethod);
  declaringType.methods.splice(methodIndex + 1, 0, extractedMethod);

  return {
    extractedMethod,
    selectedStatements,
    parameterNames: extractedParameters.map((parameter) => parameter.name),
    replacementStatements,
  };
}

function collectExternalDependencies(sourceMethod: UserMethod, selectedStatements: readonly Statement[]): Array<UserParameter | UserLocal> {
  const tracker = new UsageTracker(sourceMethod);
  const localsDeclaredInside = new Set<UserLocal>(
    selectedStatements
      .filter((statement): statement is LocalDeclarationStatement => statement instanceof LocalDeclarationStatement)
      .map((statement) => statement.local),
  );
  const dependencies: Array<UserParameter | UserLocal> = [];
  const includeIfReferenced = (candidate: UserParameter | UserLocal): void => {
    if (candidate instanceof UserLocal && localsDeclaredInside.has(candidate)) {
      return;
    }
    const hasSelectedReference = tracker.findReferences(candidate).references.some((reference) => isReferenceWithinStatements(reference, selectedStatements));
    if (hasSelectedReference && !dependencies.includes(candidate)) {
      dependencies.push(candidate);
    }
  };

  for (const parameter of sourceMethod.parameters) {
    includeIfReferenced(parameter);
  }
  sourceMethod.traverse((node) => {
    if (node instanceof UserLocal) {
      includeIfReferenced(node);
    }
  });
  return dependencies;
}

function isReferenceWithinStatements(reference: Expression, statements: readonly Statement[]): boolean {
  let current: object | null = reference;
  while (current && "parent" in current) {
    if (statements.includes(current as Statement)) {
      return true;
    }
    current = (current as { parent: object | null }).parent;
  }
  return false;
}
