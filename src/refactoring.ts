import {
  AccessLevel,
  ArithmeticInfixExpression,
  ArrayAccessExpression,
  ArrayInstanceCreation,
  ArrayLength,
  ArrayLiteralExpression,
  AssignmentExpression,
  BinaryOpExpression,
  BitwiseInfixExpression,
  BooleanLiteral,
  ClassDeclaration,
  Comment,
  ConditionalInfixExpression,
  ConditionalStatement,
  ConstructorBlockStatement,
  ConstructorDeclaration,
  ConstructorInvocationStatement,
  CountLoop,
  CountUpToStatement,
  DisabledBlockStatement,
  DoInOrder,
  DoTogether,
  DoubleLiteral,
  EachInArrayTogether,
  EachInIterableTogether,
  ExpressionStatement,
  FauxExpression,
  ForEachInArrayLoop,
  ForEachInIterableLoop,
  ForEachLoop,
  LambdaExpression,
  FieldAccess,
  IdentifierExpression,
  InstanceCreation,
  InstanceOfExpression,
  IntegerLiteral,
  JavaConstructor,
  JavaField,
  JavaKeyedArgument,
  JavaMethod,
  LocalAccess,
  LocalDeclarationStatement,
  LocalVariableDeclarationStatement,
  LogicalComplement,
  MethodDeclaration,
  MethodInvocation,
  NamedUserType,
  NewArrayExpression,
  NewInstanceExpression,
  NullLiteral,
  ParameterAccess,
  ParenthesizedExpression,
  RelationalInfixExpression,
  ResourceExpression,
  ReturnStatement,
  ShiftInfixExpression,
  SimpleArgument,
  StringConcatenation,
  StringLiteral,
  SuperConstructorInvocationStatement,
  SuperExpression,
  SwitchCaseStatement,
  ThisConstructorInvocationStatement,
  ThisExpression,
  TryCatchStatement,
  TypeCastExpression,
  TypeExpression,
  TypeLiteral,
  UnaryOpExpression,
  UserField,
  UserLambda,
  UserLocal,
  UserMethod,
  UserParameter,
  WhileLoop,
  type AbstractDeclaration,
  type AbstractExpression,
  type AbstractField,
  type AbstractMethod,
  type Expression,
  type Statement,
  type TypeRef,
} from "./ast-nodes.js";
import { UsageTracker } from "./search.js";
import { assertValidIdentifier, cloneTypeRef } from "./type-browser.js";

export interface RenameResult {
  readonly declaration: AbstractDeclaration;
  readonly previousName: string;
  readonly nextName: string;
  readonly referenceCount: number;
  readonly typeReferenceCount: number;
}

export interface ExtractMethodOptions {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly extractedName: string;
  readonly visibility?: string | null;
}

export interface ExtractMethodResult {
  readonly extractedMethod: UserMethod;
  readonly selectedStatements: Statement[];
  readonly parameterNames: string[];
  readonly replacementStatements: Statement[];
}

export interface InlineMethodOptions {
  readonly removeSourceMethod?: boolean;
}

export interface InlineMethodResult {
  readonly mode: "expression" | "statement";
  readonly callSiteCount: number;
  readonly removedSourceMethod: boolean;
}

interface CloneTransform {
  readonly replaceExpression?: (expression: Expression) => Expression | null;
  readonly replaceStatement?: (statement: Statement) => Statement[] | null;
}

export class RefactoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefactoringError";
  }
}

export function renameDeclaration(
  root: NamedUserType | ClassDeclaration,
  declaration: AbstractDeclaration,
  nextName: string,
): RenameResult {
  assertValidIdentifier(nextName, "new name");
  const previousName = declaration.name;
  if (previousName === nextName) {
    return { declaration, previousName, nextName, referenceCount: 0, typeReferenceCount: 0 };
  }

  const tracker = new UsageTracker(root);
  let referenceCount = 0;
  let typeReferenceCount = 0;

  for (const reference of tracker.findReferences(declaration).references) {
    if (reference instanceof MethodInvocation) {
      reference.methodName = nextName;
      if (reference.method) {
        reference.method.name = nextName;
      }
      referenceCount += 1;
      continue;
    }
    if (reference instanceof FieldAccess) {
      reference.memberName = nextName;
      if (reference.field) {
        reference.field.name = nextName;
      }
      referenceCount += 1;
      continue;
    }
    if (reference instanceof IdentifierExpression) {
      reference.name = nextName;
      referenceCount += 1;
    }
  }

  if (declaration instanceof NamedUserType || declaration instanceof ClassDeclaration) {
    typeReferenceCount = renameTypeReferences(root, previousName, nextName);
  }

  declaration.name = nextName;
  return { declaration, previousName, nextName, referenceCount, typeReferenceCount };
}

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

function renameTypeReferences(root: NamedUserType | ClassDeclaration, previousName: string, nextName: string): number {
  let changes = 0;
  const rewriteTypeRef = (typeRef: TypeRef | null): void => {
    if (!typeRef) {
      return;
    }
    if (typeRef.type === "SimpleTypeRef" && typeRef.name === previousName) {
      typeRef.name = nextName;
      changes += 1;
    }
    if (typeRef.type === "SimpleTypeRef" && Array.isArray((typeRef as TypeRef & { typeArguments?: TypeRef[] }).typeArguments)) {
      for (const argument of (typeRef as TypeRef & { typeArguments?: TypeRef[] }).typeArguments ?? []) {
        rewriteTypeRef(argument);
      }
    }
  };

  root.traverse((node) => {
    if (node instanceof NamedUserType || node instanceof ClassDeclaration) {
      if (node.superClass === previousName) {
        node.superClass = nextName;
        changes += 1;
      }
      if (node instanceof ClassDeclaration && node.modelType === previousName) {
        node.modelType = nextName;
        changes += 1;
      }
    }
    if (node instanceof UserField) {
      rewriteTypeRef(node.fieldType);
    } else if (node instanceof UserMethod) {
      rewriteTypeRef(node.returnType);
    } else if (node instanceof UserParameter) {
      rewriteTypeRef(node.paramType);
    } else if (node instanceof UserLocal) {
      rewriteTypeRef(node.valueType);
    } else if (node instanceof ThisExpression || node instanceof SuperExpression) {
      rewriteTypeRef(node.currentType);
    } else if (node instanceof TypeExpression || node instanceof TypeLiteral) {
      rewriteTypeRef(node.valueType);
    } else if (node instanceof ResourceExpression) {
      rewriteTypeRef(node.resourceType);
    } else if (node instanceof NewInstanceExpression || node instanceof InstanceCreation) {
      if (node.className === previousName) {
        node.className = nextName;
        changes += 1;
      }
    } else if (node instanceof ReturnStatement) {
      rewriteTypeRef(node.expressionType);
    } else if (node instanceof TypeCastExpression) {
      rewriteTypeRef(node.targetType);
    } else if (node instanceof InstanceOfExpression) {
      rewriteTypeRef(node.testType);
    } else if (node instanceof NewArrayExpression) {
      rewriteTypeRef(node.elementType);
    }
  });

  return changes;
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

function createUserMethodLike(
  sourceMethod: UserMethod,
  name: string,
  returnType: TypeRef,
  parameters: UserParameter[],
  body: Statement[],
  visibility: string | null,
): UserMethod {
  if (sourceMethod instanceof MethodDeclaration) {
    return new MethodDeclaration(
      name,
      cloneTypeRef(returnType),
      parameters,
      body,
      sourceMethod.isStatic,
      visibility,
      sourceMethod.accessLevel,
      sourceMethod.isAbstract,
      sourceMethod.isFinal,
    );
  }
  return new UserMethod(
    name,
    cloneTypeRef(returnType),
    parameters,
    body,
    sourceMethod.isStatic,
    visibility,
    sourceMethod.accessLevel,
    sourceMethod.isAbstract,
    sourceMethod.isFinal,
  );
}

function createMethodReference(method: AbstractMethod): JavaMethod {
  return new JavaMethod(
    method.name,
    cloneTypeRef(method.returnType),
    method.parameters.map((parameter) => ({
      name: parameter.name,
      paramType: cloneTypeRef(parameter.paramType),
      isVarArgs: parameter.isVarArgs,
      defaultValue: parameter.defaultValue ? cloneExpression(parameter.defaultValue) : null,
    })),
    method.visibility,
    method.accessLevel,
    method.isStatic,
  );
}

function createFieldReference(field: AbstractField): JavaField {
  return new JavaField(field.name, cloneTypeRef(field.fieldType), field.isStatic, field.visibility, field.accessLevel);
}

function createConstructorReference(constructorDeclaration: AbstractMethod | ConstructorDeclaration | ConstructorInvocationStatement["constructorDeclaration"]): JavaConstructor | null {
  if (!constructorDeclaration) {
    return null;
  }
  return new JavaConstructor(
    constructorDeclaration.name,
    "parameters" in constructorDeclaration
      ? constructorDeclaration.parameters.map((parameter) => ({
        name: parameter.name,
        paramType: cloneTypeRef(parameter.paramType),
        isVarArgs: parameter.isVarArgs,
        defaultValue: parameter.defaultValue ? cloneExpression(parameter.defaultValue) : null,
      }))
      : [],
    constructorDeclaration.visibility,
    constructorDeclaration.accessLevel,
  );
}

function cloneStatement(statement: Statement, transform: CloneTransform = {}): Statement[] {
  const replacement = transform.replaceStatement?.(statement);
  if (replacement) {
    return replacement;
  }

  if (statement instanceof ExpressionStatement) {
    return [new ExpressionStatement(cloneExpression(statement.expression, transform))];
  }
  if (statement instanceof ReturnStatement) {
    return [new ReturnStatement(statement.expression ? cloneExpression(statement.expression, transform) : null, statement.expressionType ? cloneTypeRef(statement.expressionType) : null)];
  }
  if (statement instanceof LocalDeclarationStatement) {
    return [new LocalVariableDeclarationStatement(
      statement.name,
      cloneTypeRef(statement.varType),
      cloneExpression(statement.initializer, transform),
      statement.isConstant,
    )];
  }
  if (statement instanceof ConditionalStatement) {
    return [new ConditionalStatement(
      cloneExpression(statement.condition, transform),
      statement.ifBody.flatMap((child) => cloneStatement(child, transform)),
      statement.elseBody ? statement.elseBody.flatMap((child) => cloneStatement(child, transform)) : null,
    )];
  }
  if (statement instanceof CountUpToStatement) {
    return [new CountUpToStatement(
      cloneExpression(statement.count, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof CountLoop) {
    return [new CountLoop(
      statement.variable ? new UserLocal(statement.variable.name, cloneTypeRef(statement.variable.valueType), statement.variable.isFinal) : null,
      statement.constant ? new UserLocal(statement.constant.name, cloneTypeRef(statement.constant.valueType), statement.constant.isFinal) : null,
      cloneExpression(statement.count, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof ForEachLoop) {
    return [new ForEachLoop(
      cloneTypeRef(statement.itemType),
      statement.itemName,
      cloneExpression(statement.collection, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof ForEachInArrayLoop) {
    return [new ForEachInArrayLoop(
      cloneTypeRef(statement.itemType),
      statement.itemName,
      cloneExpression(statement.collection, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof ForEachInIterableLoop) {
    return [new ForEachInIterableLoop(
      cloneTypeRef(statement.itemType),
      statement.itemName,
      cloneExpression(statement.collection, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof EachInArrayTogether) {
    return [new EachInArrayTogether(
      cloneTypeRef(statement.item.valueType),
      statement.item.name,
      cloneExpression(statement.collection, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof EachInIterableTogether) {
    return [new EachInIterableTogether(
      cloneTypeRef(statement.item.valueType),
      statement.item.name,
      cloneExpression(statement.collection, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof WhileLoop) {
    return [new WhileLoop(
      cloneExpression(statement.condition, transform),
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof DoInOrder) {
    return [new DoInOrder(statement.body.flatMap((child) => cloneStatement(child, transform)))];
  }
  if (statement instanceof DoTogether) {
    return [new DoTogether(statement.body.flatMap((child) => cloneStatement(child, transform)))];
  }
  if (statement instanceof TryCatchStatement) {
    return [new TryCatchStatement(
      statement.tryBody.flatMap((child) => cloneStatement(child, transform)),
      cloneTypeRef(statement.catchType),
      statement.catchVariable,
      statement.catchBody.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof SwitchCaseStatement) {
    return [new SwitchCaseStatement(
      cloneExpression(statement.expression, transform),
      statement.cases.map((switchCase) => ({
        value: cloneExpression(switchCase.value, transform),
        body: switchCase.body.flatMap((child) => cloneStatement(child, transform)),
      })),
      statement.defaultCase ? statement.defaultCase.flatMap((child) => cloneStatement(child, transform)) : null,
    )];
  }
  if (statement instanceof ConstructorBlockStatement) {
    const invocation = cloneStatement(statement.constructorInvocationStatement, transform)[0];
    if (!(invocation instanceof ConstructorInvocationStatement)) {
      throw new RefactoringError("Constructor block clone expected a constructor invocation statement.");
    }
    return [new ConstructorBlockStatement(
      invocation,
      statement.body.flatMap((child) => cloneStatement(child, transform)),
    )];
  }
  if (statement instanceof ThisConstructorInvocationStatement) {
    return [new ThisConstructorInvocationStatement(
      createConstructorReference(statement.constructorDeclaration),
      statement.arguments.map((argument) => cloneArgument(argument, transform)),
    )];
  }
  if (statement instanceof SuperConstructorInvocationStatement) {
    return [new SuperConstructorInvocationStatement(
      createConstructorReference(statement.constructorDeclaration),
      statement.arguments.map((argument) => cloneArgument(argument, transform)),
    )];
  }
  if (statement instanceof ConstructorInvocationStatement) {
    return [new ConstructorInvocationStatement(
      createConstructorReference(statement.constructorDeclaration),
      statement.arguments.map((argument) => cloneArgument(argument, transform)),
    )];
  }
  if (statement instanceof Comment) {
    return [new Comment(statement.text)];
  }
  if (statement instanceof DisabledBlockStatement) {
    return [new DisabledBlockStatement(statement.raw)];
  }
  throw new RefactoringError(`Unsupported statement for refactoring clone: ${statement.constructor.name}`);
}

function cloneExpression(expression: Expression, transform: CloneTransform = {}): Expression {
  const replacement = transform.replaceExpression?.(expression);
  if (replacement) {
    return replacement;
  }

  if (expression instanceof IntegerLiteral) {
    return new IntegerLiteral(expression.value);
  }
  if (expression instanceof DoubleLiteral) {
    return new DoubleLiteral(expression.value);
  }
  if (expression instanceof StringLiteral) {
    return new StringLiteral(expression.value);
  }
  if (expression instanceof BooleanLiteral) {
    return new BooleanLiteral(expression.value);
  }
  if (expression instanceof NullLiteral) {
    return new NullLiteral();
  }
  if (expression instanceof ThisExpression) {
    return new ThisExpression(expression.currentType ? cloneTypeRef(expression.currentType) : null);
  }
  if (expression instanceof SuperExpression) {
    return new SuperExpression(expression.currentType ? cloneTypeRef(expression.currentType) : null);
  }
  if (expression instanceof LocalAccess) {
    return new LocalAccess(expression.name, cloneTypeRef(expression.local.valueType));
  }
  if (expression instanceof ParameterAccess) {
    return new ParameterAccess(expression.name, cloneTypeRef(expression.parameter.paramType));
  }
  if (expression instanceof IdentifierExpression) {
    return new IdentifierExpression(expression.name);
  }
  if (expression instanceof FieldAccess) {
    return new FieldAccess(
      cloneExpression(expression.target, transform),
      expression.memberName,
      expression.field ? createFieldReference(expression.field) : null,
    );
  }
  if (expression instanceof MethodInvocation) {
    return new MethodInvocation(
      expression.target ? cloneExpression(expression.target, transform) : null,
      expression.methodName,
      expression.arguments.map((argument) => cloneArgument(argument, transform)),
      expression.method ? createMethodReference(expression.method) : null,
    );
  }
  if (expression instanceof NewInstanceExpression) {
    return new NewInstanceExpression(expression.className, expression.arguments.map((argument) => cloneArgument(argument, transform)));
  }
  if (expression instanceof InstanceCreation) {
    return new InstanceCreation(
      expression.className,
      expression.arguments.map((argument) => cloneArgument(argument, transform)),
      createConstructorReference(expression.constructorDeclaration),
    );
  }
  if (expression instanceof ArrayInstanceCreation) {
    return new ArrayInstanceCreation(
      cloneTypeRef(expression.elementType),
      expression.elements.map((element) => cloneExpression(element, transform)),
      expression.size ? cloneExpression(expression.size, transform) : null,
      [...expression.lengths],
    );
  }
  if (expression instanceof NewArrayExpression) {
    return new NewArrayExpression(
      cloneTypeRef(expression.elementType),
      expression.elements.map((element) => cloneExpression(element, transform)),
      expression.size ? cloneExpression(expression.size, transform) : null,
    );
  }
  if (expression instanceof ArrayLiteralExpression) {
    return new ArrayLiteralExpression(expression.elements.map((element) => cloneExpression(element, transform)));
  }
  if (expression instanceof StringConcatenation) {
    return new StringConcatenation(cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof ArithmeticInfixExpression) {
    return new ArithmeticInfixExpression(expression.operator, cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof RelationalInfixExpression) {
    return new RelationalInfixExpression(expression.operator, cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof ConditionalInfixExpression) {
    return new ConditionalInfixExpression(expression.operator, cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof BitwiseInfixExpression) {
    return new BitwiseInfixExpression(expression.operator, cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof ShiftInfixExpression) {
    return new ShiftInfixExpression(expression.operator, cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof BinaryOpExpression) {
    return new BinaryOpExpression(expression.operator, cloneExpression(expression.left, transform), cloneExpression(expression.right, transform));
  }
  if (expression instanceof LogicalComplement) {
    return new LogicalComplement(cloneExpression(expression.operand, transform));
  }
  if (expression instanceof UnaryOpExpression) {
    return new UnaryOpExpression(expression.operator, cloneExpression(expression.operand, transform));
  }
  if (expression instanceof AssignmentExpression) {
    return new AssignmentExpression(cloneExpression(expression.target, transform), cloneExpression(expression.value, transform));
  }
  if (expression instanceof ArrayAccessExpression) {
    return new ArrayAccessExpression(cloneExpression(expression.target, transform), cloneExpression(expression.index, transform));
  }
  if (expression instanceof ArrayLength) {
    return new ArrayLength(cloneExpression(expression.array, transform));
  }
  if (expression instanceof TypeCastExpression) {
    return new TypeCastExpression(cloneExpression(expression.expression, transform), cloneTypeRef(expression.targetType));
  }
  if (expression instanceof InstanceOfExpression) {
    return new InstanceOfExpression(cloneExpression(expression.expression, transform), cloneTypeRef(expression.testType));
  }
  if (expression instanceof ParenthesizedExpression) {
    return new ParenthesizedExpression(cloneExpression(expression.expression, transform));
  }
  if (expression instanceof ResourceExpression) {
    return new ResourceExpression(cloneTypeRef(expression.resourceType), expression.resource);
  }
  if (expression instanceof TypeExpression) {
    return new TypeExpression(cloneTypeRef(expression.valueType));
  }
  if (expression instanceof TypeLiteral) {
    return new TypeLiteral(cloneTypeRef(expression.valueType));
  }
  if (expression instanceof LambdaExpression) {
    return new LambdaExpression(new UserLambda(expression.value.name));
  }
  if (expression instanceof FauxExpression) {
    return new FauxExpression(expression.raw, expression.getType() ? cloneTypeRef(expression.getType()!) : null);
  }
  throw new RefactoringError(`Unsupported expression for refactoring clone: ${(expression as Expression & { constructor: { name: string } }).constructor.name}`);
}

function cloneArgument(argument: SimpleArgument | JavaKeyedArgument, transform: CloneTransform): { name: string | null; value: Expression } {
  return {
    name: argument.name,
    value: cloneExpression(argument.value, transform),
  };
}

function referenceName(expression: Expression): string {
  if (expression instanceof FieldAccess) {
    return expression.memberName;
  }
  if (expression instanceof MethodInvocation) {
    return expression.methodName;
  }
  if (expression instanceof IdentifierExpression) {
    return expression.name;
  }
  return "";
}

function attachNode(owner: object, node: object | null): void {
  if (node && "setParent" in node && typeof (node as { setParent: (parent: object) => void }).setParent === "function") {
    (node as { setParent: (parent: object) => void }).setParent(owner);
  }
}
