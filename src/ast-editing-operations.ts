import {
  AbstractCode,
  AbstractNode,
  CommentStatement,
  ConditionalStatement,
  CountLoop,
  DoInOrder,
  DoTogether,
  DoubleLiteral,
  ExpressionStatement,
  FieldAccess,
  ForEachInArrayLoop,
  ForEachInIterableLoop,
  ForEachLoop,
  IntegerLiteral,
  LocalAccess,
  LocalDeclarationStatement,
  MethodDeclaration,
  MethodInvocation,
  NamedUserType,
  NullLiteral,
  ParameterAccess,
  ReturnStatement,
  StringLiteral,
  ThisExpression,
  UserLocal,
  UserParameter,
  WhileLoop,
  BooleanLiteral,
  type Expression,
  type Parameter,
  type Statement,
  type TypeRef,
  toUserParameter,
} from "./ast-nodes.js";
import { decodeAstNode, encodeAstNode } from "./ast-serialization.js";
import type { ClassDecl, FieldDecl, MethodDecl } from "./tweedle-parser.js";
import type {
  AbstractType as HierarchyAbstractType,
  UserType as HierarchyUserType,
} from "./tweedle-type-system.js";
import { renameDeclaration } from "./refactoring.js";
import { typeRefsAssignable } from "./type-system.js";
import { assertValidIdentifier, cloneTypeRef } from "./type-browser.js";

export type StatementNode = Statement;
export type ExpressionNode = Expression;
export type BlockNode = AbstractNode & { body: StatementNode[] };
export type MethodNode = MethodDeclaration;
export type EditableUserType = NamedUserType;

type CodeOwner = AbstractCode & { parameters: UserParameter[]; body: StatementNode[] };

export interface ExpressionContext {
  readonly currentType?: EditableUserType | null;
  readonly currentCode?: CodeOwner | null;
  readonly position?: AbstractNode | null;
  readonly block?: BlockNode | null;
  readonly index?: number;
  readonly availableTypes?: readonly EditableUserType[];
}

export interface SerializedAST {
  readonly format: "alice/ast-statements";
  readonly nodes: readonly string[];
}

export interface MergeConflict {
  readonly typeName: string;
  readonly memberKind: "field" | "method";
  readonly existingName: string;
  readonly incomingName: string;
  readonly reason: "rename" | "signature-conflict";
}

export type DeprecatedFieldDecl = FieldDecl & {
  readonly deprecated?: true;
  readonly deprecationReason?: string;
};

export type DeprecatedMethodDecl = MethodDecl & {
  readonly deprecated?: true;
  readonly deprecationReason?: string;
};

export interface MergedUserType extends Omit<HierarchyUserType, "classDecl" | "methods" | "fields"> {
  readonly classDecl: ClassDecl;
  readonly methods: DeprecatedMethodDecl[];
  readonly fields: DeprecatedFieldDecl[];
}

export interface MergeResult {
  readonly merged: MergedUserType[];
  readonly conflicts: MergeConflict[];
}

export function insertStatement(block: BlockNode, index: number, statement: StatementNode): void {
  assertBodyOwner(block);
  if (!isSupportedStatement(statement)) {
    throw new Error(`Unsupported statement type \"${statement.type}\".`);
  }
  if (index < 0 || index > block.body.length) {
    throw new Error(`Insertion index ${index} is out of bounds.`);
  }
  const terminalIndex = findTerminalStatementIndex(block.body);
  if (terminalIndex >= 0 && index > terminalIndex) {
    throw new Error("Cannot insert a statement after a guaranteed return.");
  }
  statement.setParent(block);
  block.body.splice(index, 0, statement);
}

export function removeStatement(block: BlockNode, index: number): StatementNode {
  assertBodyOwner(block);
  if (index < 0 || index >= block.body.length) {
    throw new Error(`Removal index ${index} is out of bounds.`);
  }
  const [removed] = block.body.splice(index, 1);
  removed.setParent(null);
  return removed;
}

export function moveStatement(block: BlockNode, fromIndex: number, toIndex: number): void {
  const statement = removeStatement(block, fromIndex);
  const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  insertStatement(block, Math.max(0, Math.min(adjustedIndex, block.body.length)), statement);
}

export function getValidExpressions(context: ExpressionContext, expectedType: TypeRef): ExpressionNode[] {
  const currentType = resolveCurrentType(context);
  const currentCode = resolveCurrentCode(context);
  const typeMap = createTypeMap(context.availableTypes ?? [], currentType);
  const candidates: ExpressionNode[] = [];

  candidates.push(...literalCandidates(expectedType));

  if (currentType) {
    const thisExpression = new ThisExpression(currentType.toTypeRef());
    if (isExpressionCompatible(expectedType, thisExpression)) {
      candidates.push(thisExpression);
    }
  }

  const scopedValues = collectScopedValues(context, currentCode);
  for (const parameter of scopedValues.parameters) {
    const access = new ParameterAccess(parameter);
    if (isExpressionCompatible(expectedType, access)) {
      candidates.push(access);
    }
  }
  for (const local of scopedValues.locals) {
    const access = new LocalAccess(local);
    if (isExpressionCompatible(expectedType, access)) {
      candidates.push(access);
    }
  }

  const receivers = collectReceivers(currentType, scopedValues, typeMap);
  for (const receiver of receivers) {
    for (const field of allFieldsForType(receiver.type, typeMap)) {
      const fieldAccess = new FieldAccess(cloneExpression(receiver.expression), field.name, field);
      if (isExpressionCompatible(expectedType, fieldAccess)) {
        candidates.push(fieldAccess);
      }
    }

    for (const method of allMethodsForType(receiver.type, typeMap)) {
      if (!typeRefsAssignable(expectedType, method.returnType)) {
        continue;
      }
      const invocation = new MethodInvocation(
        cloneExpression(receiver.expression),
        method.name,
        method.parameters.map((parameter) => ({
          name: null,
          value: parameter.defaultValue ? cloneExpression(parameter.defaultValue) : defaultExpressionForType(parameter.paramType, currentType),
        })),
        method,
      );
      if (isExpressionCompatible(expectedType, invocation)) {
        candidates.push(invocation);
      }
    }
  }

  return dedupeExpressions(candidates);
}

export function mergeUserTypes(existing: HierarchyUserType[], incoming: HierarchyUserType[]): MergeResult {
  const conflicts: MergeConflict[] = [];
  const existingMap = new Map(existing.map((type) => [type.name, type] as const));
  const incomingMap = new Map(incoming.map((type) => [type.name, type] as const));
  const merged: MergedUserType[] = [];

  for (const name of new Set([...existingMap.keys(), ...incomingMap.keys()])) {
    const existingType = existingMap.get(name);
    const incomingType = incomingMap.get(name);
    if (existingType && incomingType) {
      merged.push(mergeSingleUserType(existingType, incomingType, conflicts));
      continue;
    }
    if (incomingType) {
      merged.push(cloneMergedType(incomingType));
      continue;
    }
    if (existingType) {
      merged.push(cloneMergedType(existingType));
    }
  }

  return { merged, conflicts };
}

export function addMethod(
  type: EditableUserType,
  name: string,
  params: Parameter[],
  returnType: TypeRef,
  body: BlockNode,
): MethodNode {
  assertValidIdentifier(name, "method name");
  const signature = methodSignature(name, params.map((parameter) => parameter.paramType));
  if (type.methods.some((method) => methodSignature(method.name, method.parameters.map((parameter) => parameter.paramType)) === signature)) {
    throw new Error(`Method \"${signature}\" already exists.`);
  }
  const method = new MethodDeclaration(
    name,
    cloneTypeRef(returnType),
    params.map((parameter) => cloneParameter(parameter)),
    body.body.map((statement) => cloneStatement(statement)),
    false,
  );
  method.setParent(type);
  type.methods.push(method);
  return method;
}

export function removeMethod(type: EditableUserType, methodName: string): void {
  const index = type.methods.findIndex((method) => method.name === methodName);
  if (index < 0) {
    throw new Error(`Method \"${methodName}\" was not found.`);
  }
  const [removed] = type.methods.splice(index, 1);
  removed?.setParent(null);
}

export function renameMethod(type: EditableUserType, oldName: string, newName: string): void {
  assertValidIdentifier(newName, "new method name");
  const method = type.methods.find((entry) => entry.name === oldName);
  if (!method) {
    throw new Error(`Method \"${oldName}\" was not found.`);
  }
  if (oldName === newName) {
    return;
  }
  const duplicate = type.methods.find((entry) => entry !== method && entry.name === newName);
  if (duplicate) {
    throw new Error(`Method \"${newName}\" already exists.`);
  }
  renameDeclaration(type, method, newName);
}

export function copyStatements(statements: StatementNode[]): SerializedAST {
  return {
    format: "alice/ast-statements",
    nodes: statements.map((statement) => encodeAstNode(statement)),
  };
}

export function pasteStatements(block: BlockNode, index: number, serialized: SerializedAST): StatementNode[] {
  if (serialized.format !== "alice/ast-statements") {
    throw new Error(`Unsupported AST clipboard format \"${serialized.format}\".`);
  }
  const pasted = serialized.nodes.map((payload) => decodeAstNode(payload) as StatementNode);
  pasted.forEach((statement, statementIndex) => insertStatement(block, index + statementIndex, statement));
  return pasted;
}

function assertBodyOwner(block: BlockNode): void {
  if (!("body" in block) || !Array.isArray(block.body)) {
    throw new Error("Target node does not own a statement body.");
  }
}

function isSupportedStatement(statement: StatementNode): boolean {
  return statement instanceof ExpressionStatement
    || statement instanceof ReturnStatement
    || statement instanceof ConditionalStatement
    || statement instanceof CountLoop
    || statement instanceof WhileLoop
    || statement instanceof ForEachLoop
    || statement instanceof ForEachInArrayLoop
    || statement instanceof ForEachInIterableLoop
    || statement instanceof LocalDeclarationStatement
    || statement instanceof DoInOrder
    || statement instanceof DoTogether
    || statement instanceof CommentStatement;
}

function findTerminalStatementIndex(statements: readonly StatementNode[]): number {
  return statements.findIndex((statement) => statement.isEnabledNonComment() && statement.containsAReturnForEveryPath());
}

function resolveCurrentType(context: ExpressionContext): EditableUserType | null {
  if (context.currentType) {
    return context.currentType;
  }
  const declaringType = context.currentCode?.getDeclaringType();
  if (declaringType instanceof NamedUserType) {
    return declaringType;
  }
  const anchor = context.position ?? context.block ?? context.currentCode ?? null;
  return anchor?.getFirstAncestorAssignableTo(NamedUserType, true) ?? null;
}

function resolveCurrentCode(context: ExpressionContext): CodeOwner | null {
  if (context.currentCode) {
    return context.currentCode;
  }
  const anchor = context.position ?? context.block ?? null;
  const owner = anchor?.getFirstAncestorAssignableTo(AbstractCode, true) ?? null;
  return owner && "parameters" in owner && Array.isArray(owner.parameters) && "body" in owner && Array.isArray(owner.body)
    ? owner as CodeOwner
    : null;
}

function literalCandidates(expectedType: TypeRef): ExpressionNode[] {
  if (expectedType.type !== "SimpleTypeRef") {
    return [];
  }
  if (expectedType.name === "Boolean") {
    return [new BooleanLiteral(true), new BooleanLiteral(false)];
  }
  if (isNumericType(expectedType.name)) {
    return [new IntegerLiteral(0), new IntegerLiteral(1), new DoubleLiteral(0.5)];
  }
  if (isTextType(expectedType.name)) {
    return [new StringLiteral(""), new StringLiteral("text")];
  }
  return [new NullLiteral()];
}

function isTextType(name: string): boolean {
  return name === "String" || name === "TextString";
}

function isNumericType(name: string): boolean {
  return [
    "WholeNumber",
    "DecimalNumber",
    "Integer",
    "Long",
    "Short",
    "Byte",
    "Float",
    "Double",
    "Number",
  ].includes(name);
}

function isExpressionCompatible(expectedType: TypeRef, expression: ExpressionNode): boolean {
  if (expression instanceof NullLiteral) {
    return acceptsNull(expectedType);
  }
  return typeRefsAssignable(expectedType, expression.getType());
}

function acceptsNull(expectedType: TypeRef): boolean {
  return expectedType.type === "SimpleTypeRef" && !isNumericType(expectedType.name) && expectedType.name !== "Boolean";
}

function collectScopedValues(
  context: ExpressionContext,
  currentCode: CodeOwner | null,
): { parameters: UserParameter[]; locals: ReturnType<typeof collectVisibleLocals> } {
  const parameters = currentCode?.parameters.map((parameter) => cloneParameter(parameter)) ?? [];
  return {
    parameters,
    locals: collectVisibleLocals(context, currentCode),
  };
}

function collectVisibleLocals(context: ExpressionContext, currentCode: CodeOwner | null): UserLocal[] {
  const visible = new Map<string, UserLocal>();
  const anchor = context.position ?? context.block ?? currentCode ?? null;

  let ancestor: AbstractNode | null = anchor;
  while (ancestor) {
    if (ancestor instanceof CountLoop) {
      if (ancestor.variable) {
        visible.set(ancestor.variable.name, new UserLocal(ancestor.variable.name, cloneTypeRef(ancestor.variable.valueType), ancestor.variable.isFinal));
      }
      if (ancestor.constant) {
        visible.set(ancestor.constant.name, new UserLocal(ancestor.constant.name, cloneTypeRef(ancestor.constant.valueType), ancestor.constant.isFinal));
      }
    }
    if (ancestor instanceof ForEachLoop || ancestor instanceof ForEachInArrayLoop || ancestor instanceof ForEachInIterableLoop) {
      visible.set(ancestor.item.name, new UserLocal(ancestor.item.name, cloneTypeRef(ancestor.item.valueType), ancestor.item.isFinal));
    }
    ancestor = ancestor.parent;
  }

  const block = context.block ?? currentCode;
  const limit = Math.max(0, Math.min(context.index ?? block?.body.length ?? 0, block?.body.length ?? 0));
  const sourceStatements = block?.body.slice(0, limit) ?? currentCode?.body ?? [];
  for (const statement of sourceStatements) {
    if (statement instanceof LocalDeclarationStatement) {
      visible.set(statement.local.name, new UserLocal(statement.local.name, cloneTypeRef(statement.local.valueType), statement.local.isFinal));
    }
  }

  return [...visible.values()];
}

function collectReceivers(
  currentType: EditableUserType | null,
  scopedValues: { parameters: UserParameter[]; locals: UserLocal[] },
  typeMap: Map<string, EditableUserType>,
): Array<{ expression: ExpressionNode; type: EditableUserType }> {
  const receivers: Array<{ expression: ExpressionNode; type: EditableUserType }> = [];
  if (currentType) {
    receivers.push({ expression: new ThisExpression(currentType.toTypeRef()), type: currentType });
  }

  for (const parameter of scopedValues.parameters) {
    const type = resolveEditableType(typeMap, parameter.paramType);
    if (type) {
      receivers.push({ expression: new ParameterAccess(parameter), type });
    }
  }
  for (const local of scopedValues.locals) {
    const type = resolveEditableType(typeMap, local.valueType);
    if (type) {
      receivers.push({ expression: new LocalAccess(local), type });
    }
  }
  return receivers;
}

function createTypeMap(types: readonly EditableUserType[], currentType: EditableUserType | null): Map<string, EditableUserType> {
  const map = new Map<string, EditableUserType>();
  for (const type of types) {
    map.set(type.name, type);
  }
  if (currentType) {
    map.set(currentType.name, currentType);
  }
  return map;
}

function resolveEditableType(typeMap: Map<string, EditableUserType>, typeRef: TypeRef): EditableUserType | null {
  return typeRef.type === "SimpleTypeRef" ? typeMap.get(typeRef.name) ?? null : null;
}

function allFieldsForType(type: EditableUserType, typeMap: Map<string, EditableUserType>) {
  const fields = [];
  const seen = new Set<string>();
  for (const current of walkTypeHierarchy(type, typeMap)) {
    for (const field of current.fields) {
      if (!seen.has(field.name)) {
        seen.add(field.name);
        fields.push(field);
      }
    }
  }
  return fields;
}

function allMethodsForType(type: EditableUserType, typeMap: Map<string, EditableUserType>) {
  const methods = [];
  const seen = new Set<string>();
  for (const current of walkTypeHierarchy(type, typeMap)) {
    for (const method of current.methods) {
      const signature = methodSignature(method.name, method.parameters.map((parameter) => parameter.paramType));
      if (!seen.has(signature)) {
        seen.add(signature);
        methods.push(method);
      }
    }
  }
  return methods;
}

function walkTypeHierarchy(type: EditableUserType, typeMap: Map<string, EditableUserType>): EditableUserType[] {
  const chain: EditableUserType[] = [];
  let current: EditableUserType | null = type;
  const seen = new Set<string>();
  while (current && !seen.has(current.name)) {
    seen.add(current.name);
    chain.push(current);
    current = current.superClass ? typeMap.get(current.superClass) ?? null : null;
  }
  return chain;
}

function defaultExpressionForType(typeRef: TypeRef, currentType: EditableUserType | null): ExpressionNode {
  if (typeRef.type !== "SimpleTypeRef") {
    return new NullLiteral();
  }
  if (typeRef.name === currentType?.name) {
    return new ThisExpression(currentType.toTypeRef());
  }
  if (typeRef.name === "Boolean") {
    return new BooleanLiteral(false);
  }
  if (isNumericType(typeRef.name)) {
    return typeRef.name === "DecimalNumber" || typeRef.name === "Double" || typeRef.name === "Float"
      ? new DoubleLiteral(0)
      : new IntegerLiteral(0);
  }
  if (isTextType(typeRef.name)) {
    return new StringLiteral("");
  }
  return new NullLiteral();
}

function dedupeExpressions(expressions: ExpressionNode[]): ExpressionNode[] {
  const unique = new Map<string, ExpressionNode>();
  for (const expression of expressions) {
    const key = expressionFingerprint(expression);
    if (!unique.has(key)) {
      unique.set(key, expression);
    }
  }
  return [...unique.values()];
}

function expressionFingerprint(expression: ExpressionNode): string {
  if (expression instanceof StringLiteral) {
    return `string:${expression.value}`;
  }
  if (expression instanceof IntegerLiteral || expression instanceof DoubleLiteral) {
    return `number:${expression.value}`;
  }
  if (expression instanceof BooleanLiteral) {
    return `boolean:${expression.value}`;
  }
  if (expression instanceof NullLiteral) {
    return "null";
  }
  if (expression instanceof ThisExpression) {
    return `this:${expression.currentType?.type === "SimpleTypeRef" ? expression.currentType.name : "unknown"}`;
  }
  if (expression instanceof LocalAccess || expression instanceof ParameterAccess) {
    return `${expression.constructor.name}:${expression.name}`;
  }
  if (expression instanceof FieldAccess) {
    return `field:${expression.target.constructor.name}:${expression.memberName}`;
  }
  if (expression instanceof MethodInvocation) {
    return `method:${expression.target?.constructor.name ?? "implicit"}:${expression.methodName}:${expression.arguments.length}`;
  }
  return encodeAstNode(expression);
}

function mergeSingleUserType(
  existing: HierarchyUserType,
  incoming: HierarchyUserType,
  conflicts: MergeConflict[],
): MergedUserType {
  const mergedFields = mergeFields(existing.name, existing.fields, incoming.fields, conflicts);
  const mergedMethods = mergeMethods(existing.name, existing.methods, incoming.methods, conflicts);
  const classDecl = structuredClone(incoming.classDecl);
  classDecl.fields = mergedFields;
  classDecl.methods = mergedMethods;
  return {
    kind: incoming.kind,
    name: incoming.name,
    superType: incoming.superType,
    classDecl,
    methods: mergedMethods,
    fields: mergedFields,
    enumValues: incoming.enumValues,
    typeParameters: incoming.typeParameters,
    isAssignableTo(target: HierarchyAbstractType): boolean {
      return incoming.isAssignableTo(target);
    },
  };
}

function cloneMergedType(type: HierarchyUserType): MergedUserType {
  const classDecl = structuredClone(type.classDecl);
  classDecl.fields = type.fields.map((field) => structuredClone(field));
  classDecl.methods = type.methods.map((method) => structuredClone(method));
  return {
    kind: type.kind,
    name: type.name,
    superType: type.superType,
    classDecl,
    methods: classDecl.methods,
    fields: classDecl.fields,
    enumValues: type.enumValues,
    typeParameters: type.typeParameters,
    isAssignableTo(target: HierarchyAbstractType): boolean {
      return type.isAssignableTo(target);
    },
  };
}

function mergeFields(
  typeName: string,
  existing: readonly FieldDecl[],
  incoming: readonly FieldDecl[],
  conflicts: MergeConflict[],
): DeprecatedFieldDecl[] {
  const merged: DeprecatedFieldDecl[] = [];
  const matchedExisting = new Set<number>();

  for (const incomingField of incoming) {
    const sameNameIndex = existing.findIndex((field) => field.name === incomingField.name);
    if (sameNameIndex >= 0) {
      matchedExisting.add(sameNameIndex);
      if (!sameFieldSignature(existing[sameNameIndex]!, incomingField)) {
        conflicts.push({
          typeName,
          memberKind: "field",
          existingName: existing[sameNameIndex]!.name,
          incomingName: incomingField.name,
          reason: "signature-conflict",
        });
      }
      merged.push(structuredClone(incomingField));
      continue;
    }

    const renameIndex = existing.findIndex((field, index) => !matchedExisting.has(index) && sameFieldShape(field, incomingField));
    if (renameIndex >= 0) {
      matchedExisting.add(renameIndex);
      conflicts.push({
        typeName,
        memberKind: "field",
        existingName: existing[renameIndex]!.name,
        incomingName: incomingField.name,
        reason: "rename",
      });
      merged.push(structuredClone(incomingField));
      continue;
    }

    merged.push(structuredClone(incomingField));
  }

  existing.forEach((field, index) => {
    if (!matchedExisting.has(index)) {
      merged.push(markFieldDeprecated(field));
    }
  });

  return merged;
}

function mergeMethods(
  typeName: string,
  existing: readonly MethodDecl[],
  incoming: readonly MethodDecl[],
  conflicts: MergeConflict[],
): DeprecatedMethodDecl[] {
  const merged: DeprecatedMethodDecl[] = [];
  const matchedExisting = new Set<number>();

  for (const incomingMethod of incoming) {
    const sameSignatureIndex = existing.findIndex((method) => sameNamedMethodSignature(method, incomingMethod));
    if (sameSignatureIndex >= 0) {
      matchedExisting.add(sameSignatureIndex);
      if (!sameMethodSignature(existing[sameSignatureIndex]!, incomingMethod)) {
        conflicts.push({
          typeName,
          memberKind: "method",
          existingName: existing[sameSignatureIndex]!.name,
          incomingName: incomingMethod.name,
          reason: "signature-conflict",
        });
      }
      merged.push(structuredClone(incomingMethod));
      continue;
    }

    const renameIndex = existing.findIndex((method, index) => !matchedExisting.has(index) && sameMethodShape(method, incomingMethod));
    if (renameIndex >= 0) {
      matchedExisting.add(renameIndex);
      conflicts.push({
        typeName,
        memberKind: "method",
        existingName: existing[renameIndex]!.name,
        incomingName: incomingMethod.name,
        reason: "rename",
      });
      merged.push(structuredClone(incomingMethod));
      continue;
    }

    merged.push(structuredClone(incomingMethod));
  }

  existing.forEach((method, index) => {
    if (!matchedExisting.has(index)) {
      merged.push(markMethodDeprecated(method));
    }
  });

  return merged;
}

function markFieldDeprecated(field: FieldDecl): DeprecatedFieldDecl {
  return {
    ...structuredClone(field),
    deprecated: true,
    deprecationReason: "Missing from incoming type definition.",
  };
}

function markMethodDeprecated(method: MethodDecl): DeprecatedMethodDecl {
  return {
    ...structuredClone(method),
    deprecated: true,
    deprecationReason: "Missing from incoming type definition.",
  };
}

function sameFieldSignature(left: FieldDecl, right: FieldDecl): boolean {
  return left.name === right.name && sameFieldShape(left, right);
}

function sameFieldShape(left: FieldDecl, right: FieldDecl): boolean {
  return typeRefFingerprint(left.fieldType) === typeRefFingerprint(right.fieldType)
    && left.isStatic === right.isStatic
    && left.isConstant === right.isConstant;
}

function sameNamedMethodSignature(left: MethodDecl, right: MethodDecl): boolean {
  return left.name === right.name && sameMethodShape(left, right, { includeReturnType: false });
}

function sameMethodSignature(left: MethodDecl, right: MethodDecl): boolean {
  return left.name === right.name && sameMethodShape(left, right, { includeReturnType: true });
}

function sameMethodShape(
  left: MethodDecl,
  right: MethodDecl,
  options: { includeReturnType?: boolean } = {},
): boolean {
  return left.parameters.length === right.parameters.length
    && left.parameters.every((parameter, index) => typeRefFingerprint(parameter.paramType) === typeRefFingerprint(right.parameters[index]!.paramType))
    && left.isStatic === right.isStatic
    && (!options.includeReturnType || typeRefFingerprint(left.returnType) === typeRefFingerprint(right.returnType));
}

function typeRefFingerprint(typeRef: TypeRef): string {
  switch (typeRef.type) {
    case "SimpleTypeRef":
      return `${typeRef.name}${typeRef.isArray ? "[]" : ""}`;
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return typeRef.raw;
  }
}

function cloneParameter(parameter: Parameter | UserParameter): UserParameter {
  const normalized = parameter instanceof UserParameter ? parameter : toUserParameter(parameter);
  return new UserParameter(
    normalized.name,
    cloneTypeRef(normalized.paramType),
    normalized.isVarArgs,
    normalized.defaultValue ? cloneExpression(normalized.defaultValue) : null,
    normalized.visibility,
  );
}

function cloneStatement(statement: StatementNode): StatementNode {
  return decodeAstNode(encodeAstNode(statement)) as StatementNode;
}

function cloneExpression(expression: ExpressionNode): ExpressionNode {
  return decodeAstNode(encodeAstNode(expression)) as ExpressionNode;
}

function methodSignature(name: string, parameters: readonly TypeRef[]): string {
  return `${name}(${parameters.map(typeRefFingerprint).join(",")})`;
}
