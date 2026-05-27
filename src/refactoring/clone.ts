import {
  ArithmeticInfixExpression,
  ArrayAccessExpression,
  ArrayInstanceCreation,
  ArrayLength,
  ArrayLiteralExpression,
  AssignmentExpression,
  BinaryOpExpression,
  BitwiseInfixExpression,
  BooleanLiteral,
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
  FieldAccess,
  ForEachInArrayLoop,
  ForEachInIterableLoop,
  ForEachLoop,
  IdentifierExpression,
  InstanceCreation,
  InstanceOfExpression,
  IntegerLiteral,
  JavaConstructor,
  JavaField,
  JavaKeyedArgument,
  JavaMethod,
  LambdaExpression,
  LocalAccess,
  LocalDeclarationStatement,
  LocalVariableDeclarationStatement,
  LogicalComplement,
  ParameterAccess,
  MethodDeclaration,
  MethodInvocation,
  NewArrayExpression,
  NewInstanceExpression,
  NullLiteral,
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
  WhileLoop,
  UserLambda,
  UserLocal,
  UserMethod,
  type AbstractField,
  type AbstractMethod,
  type Expression,
  type Statement,
  type TypeRef,
} from "../ast-nodes.js";
import { cloneTypeRef } from "../type-browser.js";
import { RefactoringError } from "./types.js";

export interface CloneTransform {
  readonly replaceExpression?: (expression: Expression) => Expression | null;
  readonly replaceStatement?: (statement: Statement) => Statement[] | null;
}

export function createUserMethodLike(
  sourceMethod: UserMethod,
  name: string,
  returnType: TypeRef,
  parameters: UserMethod["parameters"],
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

export function createMethodReference(method: AbstractMethod): JavaMethod {
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

export function cloneStatement(statement: Statement, transform: CloneTransform = {}): Statement[] {
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

export function cloneExpression(expression: Expression, transform: CloneTransform = {}): Expression {
  const replacement = transform.replaceExpression?.(expression);
  if (replacement) {
    return replacement;
  }

  if (expression instanceof IntegerLiteral) return new IntegerLiteral(expression.value);
  if (expression instanceof DoubleLiteral) return new DoubleLiteral(expression.value);
  if (expression instanceof StringLiteral) return new StringLiteral(expression.value);
  if (expression instanceof BooleanLiteral) return new BooleanLiteral(expression.value);
  if (expression instanceof NullLiteral) return new NullLiteral();
  if (expression instanceof ThisExpression) return new ThisExpression(expression.currentType ? cloneTypeRef(expression.currentType) : null);
  if (expression instanceof SuperExpression) return new SuperExpression(expression.currentType ? cloneTypeRef(expression.currentType) : null);
  if (expression instanceof LocalAccess) return new LocalAccess(expression.name, cloneTypeRef(expression.local.valueType));
  if (expression instanceof ParameterAccess) return new ParameterAccess(expression.name, cloneTypeRef(expression.parameter.paramType));
  if (expression instanceof IdentifierExpression) return new IdentifierExpression(expression.name);
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
  if (expression instanceof ResourceExpression) return new ResourceExpression(cloneTypeRef(expression.resourceType), expression.resource);
  if (expression instanceof TypeExpression) return new TypeExpression(cloneTypeRef(expression.valueType));
  if (expression instanceof TypeLiteral) return new TypeLiteral(cloneTypeRef(expression.valueType));
  if (expression instanceof LambdaExpression) return new LambdaExpression(new UserLambda(expression.value.name));
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

export function referenceName(expression: Expression): string {
  if (expression instanceof FieldAccess) return expression.memberName;
  if (expression instanceof MethodInvocation) return expression.methodName;
  if (expression instanceof IdentifierExpression) return expression.name;
  return "";
}

export function attachNode(owner: object, node: object | null): void {
  if (node && "setParent" in node && typeof (node as { setParent: (parent: object) => void }).setParent === "function") {
    (node as { setParent: (parent: object) => void }).setParent(owner);
  }
}
