import {
  AbstractCode,
  AbstractConstructor,
  AbstractDeclaration,
  AbstractField,
  AbstractMethod,
  AbstractNode,
  ClassDeclaration,
  ConditionalStatement,
  ConstructorBlockStatement,
  ConstructorInvocationStatement,
  CountLoop,
  EachInArrayTogether,
  EachInIterableTogether,
  ExpressionStatement,
  FieldAccess,
  ForEachInArrayLoop,
  ForEachInIterableLoop,
  ForEachLoop,
  IdentifierExpression,
  InstanceCreation,
  InstanceOfExpression,
  LocalAccess,
  LocalDeclarationStatement,
  MethodInvocation,
  NamedUserType,
  NewArrayExpression,
  ParameterAccess,
  ParenthesizedExpression,
  ResourceExpression,
  ReturnStatement,
  SwitchCaseStatement,
  TryCatchStatement,
  TypeCastExpression,
  TypeExpression,
  TypeLiteral,
  UserField,
  UserLocal,
  UserMethod,
  UserParameter,
  WhileLoop,
  type Expression,
  type Statement,
} from "./ast-nodes.js";

export type SearchKind = "type" | "method" | "field" | "parameter" | "local" | "expression";

export interface SearchQuery {
  readonly text?: string | readonly string[];
  readonly typeName?: string | null;
  readonly kinds?: readonly SearchKind[];
}

export interface SearchMatch<TNode extends AbstractNode = AbstractNode> {
  readonly node: TNode;
  readonly kind: SearchKind;
  readonly score: number;
  readonly enclosingDeclaration: AbstractDeclaration | null;
}

export interface ReferenceGroup {
  readonly declaration: AbstractDeclaration;
  readonly references: Expression[];
}

interface Scope {
  readonly currentType: NamedUserType | ClassDeclaration | null;
  readonly currentCode: AbstractCode | null;
  readonly parameters: Map<string, UserParameter>;
  readonly locals: Map<string, UserLocal>;
}

const EMPTY_SCOPE: Scope = {
  currentType: null,
  currentCode: null,
  parameters: new Map(),
  locals: new Map(),
};

export class SearchResult<TDeclaration extends AbstractDeclaration = AbstractDeclaration> {
  readonly references: Expression[] = [];

  constructor(public readonly declaration: TDeclaration) {}

  getName(): string {
    return this.declaration.name;
  }

  addReference(reference: Expression): void {
    this.references.push(reference);
  }
}

export function queryAst<TNode extends AbstractNode = AbstractNode>(
  root: AbstractNode | readonly AbstractNode[],
  predicate: (node: AbstractNode) => node is TNode,
): TNode[];
export function queryAst(
  root: AbstractNode | readonly AbstractNode[],
  predicate: (node: AbstractNode) => boolean,
): AbstractNode[];
export function queryAst(
  root: AbstractNode | readonly AbstractNode[],
  predicate: (node: AbstractNode) => boolean,
): AbstractNode[] {
  const matches: AbstractNode[] = [];
  const seen = new Set<string>();
  for (const node of flattenRoots(root)) {
    node.traverse((candidate) => {
      if (!predicate(candidate) || seen.has(candidate.id)) {
        return;
      }
      seen.add(candidate.id);
      matches.push(candidate);
    });
  }
  return matches;
}

export function searchAst(
  root: AbstractNode | readonly AbstractNode[],
  query: SearchQuery,
): SearchMatch[] {
  const tracker = new UsageTracker(root);
  const matches: SearchMatch[] = [];
  const terms = normalizeTerms(query.text);
  const allowedKinds = query.kinds ? new Set(query.kinds) : null;

  for (const declaration of tracker.listDeclarations()) {
    const kind = declarationKind(declaration);
    if (allowedKinds && !allowedKinds.has(kind)) {
      continue;
    }
    if (terms.length > 0 && !matchesTerms(declaration.name, terms)) {
      continue;
    }
    if (query.typeName && !matchesDeclarationType(declaration, query.typeName)) {
      continue;
    }
    matches.push({
      node: declaration,
      kind,
      score: scoreName(declaration.name, terms) - tracker.findReferences(declaration).references.length / 10,
      enclosingDeclaration: declaration.getFirstAncestorAssignableTo(AbstractDeclaration),
    });
  }

  if (query.typeName) {
    for (const expression of queryAst(root, (node): node is Expression => isExpression(node))) {
      const expressionType = expression.getType();
      const expressionTypeName = expressionType?.type === "SimpleTypeRef" ? expressionType.name : null;
      if (expressionTypeName !== query.typeName) {
        continue;
      }
      if (allowedKinds && !allowedKinds.has("expression")) {
        continue;
      }
      matches.push({
        node: expression,
        kind: "expression",
        score: 0,
        enclosingDeclaration: expression.getFirstAncestorAssignableTo(AbstractDeclaration),
      });
    }
  }

  return matches.sort((left, right) => left.score - right.score);
}

export function searchByType(
  root: AbstractNode | readonly AbstractNode[],
  typeName: string,
): SearchMatch[] {
  return searchAst(root, { typeName, kinds: ["type", "method", "field", "parameter", "local", "expression"] });
}

export class UsageTracker {
  readonly #results = new Map<AbstractDeclaration, SearchResult>();
  readonly #declarations: AbstractDeclaration[] = [];
  readonly #typeIndex = new Map<string, NamedUserType | ClassDeclaration>();
  readonly #rootNodes: AbstractNode[];

  constructor(root: AbstractNode | readonly AbstractNode[]) {
    this.#rootNodes = flattenRoots(root);
    for (const declaration of queryAst(this.#rootNodes, (node): node is AbstractDeclaration => node instanceof AbstractDeclaration)) {
      if (isSupportedDeclaration(declaration)) {
        this.ensureResult(declaration);
        if (declaration instanceof NamedUserType || declaration instanceof ClassDeclaration) {
          this.#typeIndex.set(declaration.name, declaration);
        }
      }
    }
    for (const node of this.#rootNodes) {
      this.walkNode(node, EMPTY_SCOPE);
    }
  }

  listDeclarations(): AbstractDeclaration[] {
    return [...this.#declarations];
  }

  findReferences<TDeclaration extends AbstractDeclaration>(declaration: TDeclaration): SearchResult<TDeclaration> {
    return this.ensureResult(declaration) as SearchResult<TDeclaration>;
  }

  groupReferences(declaration: AbstractDeclaration): ReferenceGroup[] {
    const groups = new Map<AbstractDeclaration, Expression[]>();
    for (const reference of this.findReferences(declaration).references) {
      const owner = reference.getFirstAncestorAssignableTo(AbstractCode) ?? reference.getFirstAncestorAssignableTo(NamedUserType);
      if (!owner) {
        continue;
      }
      const bucket = groups.get(owner) ?? [];
      bucket.push(reference);
      groups.set(owner, bucket);
    }
    return [...groups.entries()].map(([owner, references]) => ({ declaration: owner, references }));
  }

  searchDeclarations(text: string | readonly string[]): SearchResult[] {
    const terms = normalizeTerms(text);
    return this.listDeclarations()
      .map((declaration) => this.findReferences(declaration))
      .filter((result) => matchesTerms(result.getName(), terms))
      .sort((left, right) => scoreName(left.getName(), terms) - scoreName(right.getName(), terms));
  }

  private ensureResult<TDeclaration extends AbstractDeclaration>(declaration: TDeclaration): SearchResult<TDeclaration> {
    let result = this.#results.get(declaration) as SearchResult<TDeclaration> | undefined;
    if (!result) {
      result = new SearchResult(declaration);
      this.#results.set(declaration, result);
      if (!this.#declarations.includes(declaration)) {
        this.#declarations.push(declaration);
      }
    }
    return result;
  }

  private addReference(declaration: AbstractDeclaration | null, expression: Expression): void {
    if (!declaration || !isSupportedDeclaration(declaration)) {
      return;
    }
    this.ensureResult(declaration).addReference(expression);
  }

  private walkNode(node: AbstractNode, scope: Scope): void {
    if (node instanceof NamedUserType || node instanceof ClassDeclaration) {
      this.walkType(node, scope);
      return;
    }
    if (node instanceof AbstractMethod || node instanceof AbstractConstructor) {
      this.walkCode(node, scope.currentType);
    }
  }

  private walkType(type: NamedUserType | ClassDeclaration, scope: Scope): void {
    const typeScope: Scope = {
      currentType: type,
      currentCode: null,
      parameters: new Map(),
      locals: new Map(),
    };

    for (const field of type.fields) {
      if (field.initializer) {
        this.walkExpression(field.initializer, typeScope);
      }
    }
    for (const constructorDeclaration of type.constructors) {
      this.walkCode(constructorDeclaration, type);
    }
    for (const method of type.methods) {
      this.walkCode(method, type);
    }

    void scope;
  }

  private walkCode(code: AbstractCode, currentType: NamedUserType | ClassDeclaration | null): void {
    const codeNode = code as AbstractCode & { parameters?: UserParameter[]; body?: Statement[] };
    const parameters = new Map<string, UserParameter>();
    for (const parameter of codeNode.parameters ?? []) {
      parameters.set(parameter.name, parameter);
    }
    const scope: Scope = {
      currentType,
      currentCode: code,
      parameters,
      locals: new Map(),
    };
    this.walkStatements(codeNode.body ?? [], scope);
  }

  private walkStatements(statements: readonly Statement[], scope: Scope): void {
    for (const statement of statements) {
      if (statement instanceof LocalDeclarationStatement) {
        this.walkExpression(statement.initializer, scope);
        scope.locals.set(statement.local.name, statement.local);
        continue;
      }
      this.walkStatement(statement, scope);
    }
  }

  private walkStatement(statement: Statement, scope: Scope): void {
    if (statement instanceof ExpressionStatement) {
      this.walkExpression(statement.expression, scope);
      return;
    }
    if (statement instanceof ReturnStatement) {
      if (statement.expression) {
        this.walkExpression(statement.expression, scope);
      }
      return;
    }
    if (statement instanceof ConditionalStatement) {
      this.walkExpression(statement.condition, scope);
      this.walkStatements(statement.ifBody, childScope(scope));
      if (statement.elseBody) {
        this.walkStatements(statement.elseBody, childScope(scope));
      }
      return;
    }
    if (statement instanceof WhileLoop) {
      this.walkExpression(statement.condition, scope);
      this.walkStatements(statement.body, childScope(scope));
      return;
    }
    if (statement instanceof CountLoop) {
      this.walkExpression(statement.count, scope);
      const bodyScope = childScope(scope);
      if (statement.variable) {
        bodyScope.locals.set(statement.variable.name, statement.variable);
      }
      if (statement.constant) {
        bodyScope.locals.set(statement.constant.name, statement.constant);
      }
      this.walkStatements(statement.body, bodyScope);
      return;
    }
    if (statement instanceof ForEachLoop || statement instanceof ForEachInArrayLoop || statement instanceof ForEachInIterableLoop) {
      this.walkExpression(statement.collection, scope);
      const bodyScope = childScope(scope);
      bodyScope.locals.set(statement.item.name, statement.item);
      this.walkStatements(statement.body, bodyScope);
      return;
    }
    if (statement instanceof EachInArrayTogether || statement instanceof EachInIterableTogether) {
      this.walkExpression(statement.collection, scope);
      const bodyScope = childScope(scope);
      bodyScope.locals.set(statement.item.name, statement.item);
      this.walkStatements(statement.body, bodyScope);
      return;
    }
    if (statement instanceof TryCatchStatement) {
      this.walkStatements(statement.tryBody, childScope(scope));
      this.walkStatements(statement.catchBody, childScope(scope));
      return;
    }
    if (statement instanceof SwitchCaseStatement) {
      this.walkExpression(statement.expression, scope);
      for (const switchCase of statement.cases) {
        this.walkExpression(switchCase.value, scope);
        this.walkStatements(switchCase.body, childScope(scope));
      }
      if (statement.defaultCase) {
        this.walkStatements(statement.defaultCase, childScope(scope));
      }
      return;
    }
    if (statement instanceof ConstructorInvocationStatement) {
      for (const argument of statement.arguments) {
        this.walkExpression(argument.value, scope);
      }
      return;
    }
    if (statement instanceof ConstructorBlockStatement) {
      this.walkStatement(statement.constructorInvocationStatement, scope);
      this.walkStatements(statement.body, childScope(scope));
      return;
    }
    if ("body" in statement && Array.isArray(statement.body)) {
      this.walkStatements(statement.body, childScope(scope));
    }
  }

  private walkExpression(expression: Expression, scope: Scope): void {
    if (expression instanceof LocalAccess) {
      this.addReference(expression.local, expression);
      if (!this.#results.has(expression.local)) {
        this.addReference(scope.locals.get(expression.name) ?? null, expression);
      }
      return;
    }
    if (expression instanceof ParameterAccess) {
      this.addReference(expression.parameter, expression);
      if (!this.#results.has(expression.parameter)) {
        this.addReference(scope.parameters.get(expression.name) ?? null, expression);
      }
      return;
    }
    if (expression instanceof IdentifierExpression) {
      this.addReference(resolveIdentifier(expression.name, scope, this.#typeIndex), expression);
      return;
    }
    if (expression instanceof FieldAccess) {
      this.walkExpression(expression.target, scope);
      this.addReference(resolveFieldAccess(expression, scope, this.#typeIndex), expression);
      return;
    }
    if (expression instanceof MethodInvocation) {
      if (expression.target) {
        this.walkExpression(expression.target, scope);
      }
      for (const argument of expression.arguments) {
        this.walkExpression(argument.value, scope);
      }
      this.addReference(resolveMethodInvocation(expression, scope, this.#typeIndex), expression);
      return;
    }
    if (expression instanceof InstanceCreation) {
      for (const argument of expression.arguments) {
        this.walkExpression(argument.value, scope);
      }
      return;
    }
    if (expression instanceof NewArrayExpression) {
      for (const element of expression.elements) {
        this.walkExpression(element, scope);
      }
      if (expression.size) {
        this.walkExpression(expression.size, scope);
      }
      return;
    }
    if (expression instanceof ParenthesizedExpression || expression instanceof TypeCastExpression || expression instanceof InstanceOfExpression) {
      this.walkExpression(expression.expression, scope);
      return;
    }
    if (expression instanceof ResourceExpression || expression instanceof TypeExpression || expression instanceof TypeLiteral) {
      return;
    }
    if ("left" in expression && isExpression(expression.left) && "right" in expression && isExpression(expression.right)) {
      this.walkExpression(expression.left, scope);
      this.walkExpression(expression.right, scope);
      return;
    }
    if ("operand" in expression && isExpression(expression.operand)) {
      this.walkExpression(expression.operand, scope);
      return;
    }
    if ("target" in expression && isExpression(expression.target) && "value" in expression && isExpression(expression.value)) {
      this.walkExpression(expression.target, scope);
      this.walkExpression(expression.value, scope);
      return;
    }
    if ("target" in expression && isExpression(expression.target) && "index" in expression && isExpression(expression.index)) {
      this.walkExpression(expression.target, scope);
      this.walkExpression(expression.index, scope);
    }
  }
}

function flattenRoots(root: AbstractNode | readonly AbstractNode[]): AbstractNode[] {
  return Array.isArray(root) ? Array.from(root) : [root as AbstractNode];
}

function childScope(scope: Scope): Scope {
  return {
    currentType: scope.currentType,
    currentCode: scope.currentCode,
    parameters: new Map(scope.parameters),
    locals: new Map(scope.locals),
  };
}

function normalizeTerms(text: string | readonly string[] | undefined): string[] {
  if (!text) {
    return [];
  }
  const rawTerms: readonly string[] = typeof text === "string" ? text.split(/\s+/u) : text;
  return rawTerms
    .map((term: string) => term.trim().toLowerCase())
    .filter((term: string) => term.length > 0);
}

function matchesTerms(name: string, terms: readonly string[]): boolean {
  if (terms.length === 0) {
    return true;
  }
  const lowered = name.toLowerCase();
  return terms.every((term) => lowered.includes(term));
}

function scoreName(name: string, terms: readonly string[]): number {
  if (terms.length === 0) {
    return 0;
  }
  const lowered = name.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (lowered === term) {
      score -= 2;
    }
    if (lowered.includes(term)) {
      score -= 1;
    }
    if (lowered.startsWith(term)) {
      score -= 1;
    }
  }
  return score;
}

function declarationKind(declaration: AbstractDeclaration): SearchKind {
  if (declaration instanceof NamedUserType || declaration instanceof ClassDeclaration) {
    return "type";
  }
  if (declaration instanceof UserMethod) {
    return "method";
  }
  if (declaration instanceof UserField) {
    return "field";
  }
  if (declaration instanceof UserParameter) {
    return "parameter";
  }
  return "local";
}

function matchesDeclarationType(declaration: AbstractDeclaration, typeName: string): boolean {
  if (declaration instanceof UserField) {
    return declaration.fieldType.type === "SimpleTypeRef" && declaration.fieldType.name === typeName;
  }
  if (declaration instanceof UserMethod) {
    return declaration.returnType.type === "SimpleTypeRef" && declaration.returnType.name === typeName;
  }
  if (declaration instanceof UserParameter) {
    return declaration.paramType.type === "SimpleTypeRef" && declaration.paramType.name === typeName;
  }
  if (declaration instanceof UserLocal) {
    return declaration.valueType.type === "SimpleTypeRef" && declaration.valueType.name === typeName;
  }
  return declaration.name === typeName;
}

function resolveIdentifier(
  name: string,
  scope: Scope,
  typeIndex: Map<string, NamedUserType | ClassDeclaration>,
): AbstractDeclaration | null {
  return scope.locals.get(name)
    ?? scope.parameters.get(name)
    ?? findFieldInHierarchy(scope.currentType, name, typeIndex)
    ?? findTypeInHierarchy(scope.currentType, name, typeIndex)
    ?? null;
}

function resolveFieldAccess(
  expression: FieldAccess,
  scope: Scope,
  typeIndex: Map<string, NamedUserType | ClassDeclaration>,
): AbstractDeclaration | null {
  if (expression.field && isSupportedDeclaration(expression.field)) {
    return expression.field;
  }
  const targetType = expression.target.getType();
  const targetTypeName = targetType?.type === "SimpleTypeRef"
    ? targetType.name
    : scope.currentType?.name;
  return targetTypeName
    ? findFieldInHierarchy(typeIndex.get(targetTypeName) ?? scope.currentType, expression.memberName, typeIndex)
    : null;
}

function resolveMethodInvocation(
  expression: MethodInvocation,
  scope: Scope,
  typeIndex: Map<string, NamedUserType | ClassDeclaration>,
): AbstractDeclaration | null {
  if (expression.method && isSupportedDeclaration(expression.method)) {
    return expression.method;
  }
  const targetType = expression.target?.getType() ?? null;
  const targetTypeName = targetType?.type === "SimpleTypeRef"
    ? targetType.name
    : scope.currentType?.name;
  if (!targetTypeName) {
    return null;
  }
  return findMethodInHierarchy(
    typeIndex.get(targetTypeName) ?? scope.currentType,
    expression.methodName,
    expression.arguments.length,
    typeIndex,
  );
}

function findFieldInHierarchy(
  type: NamedUserType | ClassDeclaration | null | undefined,
  name: string,
  typeIndex: Map<string, NamedUserType | ClassDeclaration>,
): UserField | null {
  if (!type) {
    return null;
  }
  const own = type.fields.find((field) => field.name === name) ?? null;
  if (own) {
    return own;
  }
  return type.superClass ? findFieldInHierarchy(typeIndex.get(type.superClass) ?? null, name, typeIndex) : null;
}

function findMethodInHierarchy(
  type: NamedUserType | ClassDeclaration | null | undefined,
  name: string,
  argumentCount: number,
  typeIndex: Map<string, NamedUserType | ClassDeclaration>,
): UserMethod | null {
  if (!type) {
    return null;
  }
  const own = type.methods.find((method) => method.name === name && method.parameters.length === argumentCount) ?? null;
  if (own) {
    return own;
  }
  return type.superClass ? findMethodInHierarchy(typeIndex.get(type.superClass) ?? null, name, argumentCount, typeIndex) : null;
}

function findTypeInHierarchy(
  type: NamedUserType | ClassDeclaration | null,
  name: string,
  typeIndex: Map<string, NamedUserType | ClassDeclaration>,
): NamedUserType | ClassDeclaration | null {
  if (type?.name === name) {
    return type;
  }
  return typeIndex.get(name) ?? null;
}

function isSupportedDeclaration(declaration: AbstractDeclaration): declaration is NamedUserType | ClassDeclaration | UserMethod | UserField | UserParameter | UserLocal {
  return declaration instanceof NamedUserType
    || declaration instanceof ClassDeclaration
    || declaration instanceof UserMethod
    || declaration instanceof UserField
    || declaration instanceof UserParameter
    || declaration instanceof UserLocal;
}

function isExpression(node: AbstractNode): node is Expression {
  return typeof (node as Expression & { getType?: unknown }).getType === "function"
    && !(node instanceof AbstractDeclaration);
}
