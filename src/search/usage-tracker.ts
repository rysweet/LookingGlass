import {
  AbstractCode,
  AbstractConstructor,
  AbstractDeclaration,
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
  WhileLoop,
  type Expression,
  type Statement,
} from "../ast-nodes.js";
import { resolveFieldAccess, resolveIdentifier, resolveMethodInvocation } from "./resolvers.js";
import {
  EMPTY_SCOPE,
  SearchResult,
  childScope,
  flattenRoots,
  isExpression,
  isSupportedDeclaration,
  matchesTerms,
  normalizeTerms,
  scoreName,
  type ReferenceGroup,
  type Scope,
} from "./shared.js";

export class UsageTracker {
  readonly #results = new Map<AbstractDeclaration, SearchResult>();
  readonly #declarations: AbstractDeclaration[] = [];
  readonly #typeIndex = new Map<string, NamedUserType | ClassDeclaration>();
  readonly #rootNodes: AbstractNode[];

  constructor(root: AbstractNode | readonly AbstractNode[]) {
    this.#rootNodes = flattenRoots(root);
    for (const declaration of queryDeclarations(this.#rootNodes)) {
      if (isSupportedDeclaration(declaration)) {
        this.ensureResult(declaration);
        if (declaration instanceof NamedUserType || declaration instanceof ClassDeclaration) {
          this.#typeIndex.set(declaration.name, declaration);
        }
      }
    }
    for (const node of this.#rootNodes) this.walkNode(node, EMPTY_SCOPE);
  }

  listDeclarations(): AbstractDeclaration[] { return [...this.#declarations]; }

  findReferences<TDeclaration extends AbstractDeclaration>(declaration: TDeclaration): SearchResult<TDeclaration> {
    return this.ensureResult(declaration) as SearchResult<TDeclaration>;
  }

  groupReferences(declaration: AbstractDeclaration): ReferenceGroup[] {
    const groups = new Map<AbstractDeclaration, Expression[]>();
    for (const reference of this.findReferences(declaration).references) {
      const owner = reference.getFirstAncestorAssignableTo(AbstractCode) ?? reference.getFirstAncestorAssignableTo(NamedUserType);
      if (!owner) continue;
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
      if (!this.#declarations.includes(declaration)) this.#declarations.push(declaration);
    }
    return result;
  }

  private addReference(declaration: AbstractDeclaration | null, expression: Expression): void {
    if (declaration && isSupportedDeclaration(declaration)) this.ensureResult(declaration).addReference(expression);
  }

  private walkNode(node: AbstractNode, scope: Scope): void {
    if (node instanceof NamedUserType || node instanceof ClassDeclaration) return this.walkType(node, scope);
    if (node instanceof AbstractMethod || node instanceof AbstractConstructor) this.walkCode(node, scope.currentType);
  }

  private walkType(type: NamedUserType | ClassDeclaration, scope: Scope): void {
    const typeScope: Scope = { currentType: type, currentCode: null, parameters: new Map(), locals: new Map() };
    for (const field of type.fields) if (field.initializer) this.walkExpression(field.initializer, typeScope);
    for (const constructorDeclaration of type.constructors) this.walkCode(constructorDeclaration, type);
    for (const method of type.methods) this.walkCode(method, type);
    void scope;
  }

  private walkCode(code: AbstractCode, currentType: NamedUserType | ClassDeclaration | null): void {
    const codeNode = code as AbstractCode & { parameters?: any[]; body?: Statement[] };
    const parameters = new Map(codeNode.parameters?.map((parameter) => [parameter.name, parameter]) ?? []);
    this.walkStatements(codeNode.body ?? [], { currentType, currentCode: code, parameters, locals: new Map() });
  }

  private walkStatements(statements: readonly Statement[], scope: Scope): void {
    for (const statement of statements) {
      if (statement instanceof LocalDeclarationStatement) {
        this.walkExpression(statement.initializer, scope);
        scope.locals.set(statement.local.name, statement.local);
      } else {
        this.walkStatement(statement, scope);
      }
    }
  }

  private walkStatement(statement: Statement, scope: Scope): void {
    if (statement instanceof ExpressionStatement) return this.walkExpression(statement.expression, scope);
    if (statement instanceof ReturnStatement) return statement.expression ? this.walkExpression(statement.expression, scope) : undefined;
    if (statement instanceof ConditionalStatement) {
      this.walkExpression(statement.condition, scope);
      this.walkStatements(statement.ifBody, childScope(scope));
      if (statement.elseBody) this.walkStatements(statement.elseBody, childScope(scope));
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
      if (statement.variable) bodyScope.locals.set(statement.variable.name, statement.variable);
      if (statement.constant) bodyScope.locals.set(statement.constant.name, statement.constant);
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
      if (statement.defaultCase) this.walkStatements(statement.defaultCase, childScope(scope));
      return;
    }
    if (statement instanceof ConstructorInvocationStatement) {
      for (const argument of statement.arguments) this.walkExpression(argument.value, scope);
      return;
    }
    if (statement instanceof ConstructorBlockStatement) {
      this.walkStatement(statement.constructorInvocationStatement, scope);
      this.walkStatements(statement.body, childScope(scope));
      return;
    }
    if ("body" in statement && Array.isArray(statement.body)) this.walkStatements(statement.body, childScope(scope));
  }

  private walkExpression(expression: Expression, scope: Scope): void {
    if (expression instanceof LocalAccess) {
      this.addReference(expression.local, expression);
      if (!this.#results.has(expression.local)) this.addReference(scope.locals.get(expression.name) ?? null, expression);
      return;
    }
    if (expression instanceof ParameterAccess) {
      this.addReference(expression.parameter, expression);
      if (!this.#results.has(expression.parameter)) this.addReference(scope.parameters.get(expression.name) ?? null, expression);
      return;
    }
    if (expression instanceof IdentifierExpression) return this.addReference(resolveIdentifier(expression.name, scope, this.#typeIndex), expression);
    if (expression instanceof FieldAccess) {
      this.walkExpression(expression.target, scope);
      this.addReference(resolveFieldAccess(expression, scope, this.#typeIndex), expression);
      return;
    }
    if (expression instanceof MethodInvocation) {
      if (expression.target) this.walkExpression(expression.target, scope);
      for (const argument of expression.arguments) this.walkExpression(argument.value, scope);
      this.addReference(resolveMethodInvocation(expression, scope, this.#typeIndex), expression);
      return;
    }
    if (expression instanceof InstanceCreation) {
      for (const argument of expression.arguments) this.walkExpression(argument.value, scope);
      return;
    }
    if (expression instanceof NewArrayExpression) {
      for (const element of expression.elements) this.walkExpression(element, scope);
      if (expression.size) this.walkExpression(expression.size, scope);
      return;
    }
    if (expression instanceof ParenthesizedExpression || expression instanceof TypeCastExpression || expression instanceof InstanceOfExpression) {
      this.walkExpression(expression.expression, scope);
      return;
    }
    if (expression instanceof ResourceExpression || expression instanceof TypeExpression || expression instanceof TypeLiteral) return;
    if ("left" in expression && isExpression(expression.left) && "right" in expression && isExpression(expression.right)) {
      this.walkExpression(expression.left, scope);
      this.walkExpression(expression.right, scope);
      return;
    }
    if ("operand" in expression && isExpression(expression.operand)) return this.walkExpression(expression.operand, scope);
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

function queryDeclarations(root: readonly AbstractNode[]): AbstractDeclaration[] {
  const matches: AbstractDeclaration[] = [];
  const seen = new Set<string>();
  for (const node of root) {
    node.traverse((candidate) => {
      if (!(candidate instanceof AbstractDeclaration) || seen.has(candidate.id)) return;
      seen.add(candidate.id);
      matches.push(candidate);
    });
  }
  return matches;
}

