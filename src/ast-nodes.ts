let nextAstNodeId = 0;

export type TypeRef =
  | { type: "SimpleTypeRef"; name: string; isArray: boolean }
  | { type: "VoidTypeRef" }
  | { type: "LambdaTypeRef"; raw: string };

export type Parameter = {
  name: string;
  paramType: TypeRef;
  isVarArgs: boolean;
  defaultValue: Expression | null;
};

export type Argument = {
  name: string | null;
  value: Expression;
};

export abstract class AbstractNode {
  #id = `ast-${nextAstNodeId++}`;
  #parent: AbstractNode | null = null;

  get id(): string {
    return this.#id;
  }

  get parent(): AbstractNode | null {
    return this.#parent;
  }

  protected setParent(parent: AbstractNode | null): void {
    this.#parent = parent;
  }

  protected attachNode<T extends AbstractNode | null>(node: T): T {
    if (node) {
      node.setParent(this);
    }
    return node;
  }

  protected attachNodes<T extends AbstractNode>(nodes: T[]): T[] {
    for (const node of nodes) {
      node.setParent(this);
    }
    return nodes;
  }

  getRoot(): AbstractNode {
    let current: AbstractNode = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  getFirstAncestorAssignableTo<T extends AbstractNode>(
    ctor: new (...args: never[]) => T,
    includeSelf = false,
  ): T | null {
    let current: AbstractNode | null = includeSelf ? this : this.parent;
    while (current) {
      if (current instanceof ctor) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  traverse(visitor: (node: AbstractNode) => void): void {
    visitor(this);
    for (const child of this.getChildNodes()) {
      child.traverse(visitor);
    }
  }

  protected getChildNodes(): AbstractNode[] {
    return [];
  }
}

export abstract class AbstractDeclaration extends AbstractNode {
  constructor(
    public name: string,
    public visibility: string | null = null,
  ) {
    super();
  }
}

export abstract class AbstractMethod extends AbstractDeclaration {
  constructor(
    name: string,
    public returnType: TypeRef,
    public parameters: Parameter[],
    public body: Statement[],
    public isStatic: boolean,
    visibility: string | null = null,
  ) {
    super(name, visibility);
    for (const parameter of parameters) {
      this.attachNode(parameter.defaultValue);
    }
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    const nodes: AbstractNode[] = [];
    for (const parameter of this.parameters) {
      if (parameter.defaultValue) {
        nodes.push(parameter.defaultValue);
      }
    }
    nodes.push(...this.body);
    return nodes;
  }
}

export abstract class AbstractField extends AbstractDeclaration {
  constructor(
    name: string,
    public fieldType: TypeRef,
    public initializer: Expression | null,
    public isStatic: boolean,
    public isConstant: boolean,
    visibility: string | null = null,
  ) {
    super(name, visibility);
    this.attachNode(initializer);
  }

  protected override getChildNodes(): AbstractNode[] {
    return this.initializer ? [this.initializer] : [];
  }
}

export abstract class AbstractStatement extends AbstractNode {
  abstract readonly type: string;
}

export abstract class AbstractExpression extends AbstractNode {
  abstract readonly type: string;
}

export class ClassDeclaration extends AbstractDeclaration {
  readonly type = "ClassDeclaration" as const;

  constructor(
    name: string,
    public superClass: string | null,
    public modelType: string | null,
    visibility: string | null,
    public constructors: ConstructorDeclaration[],
    public methods: MethodDeclaration[],
    public fields: FieldDeclaration[],
  ) {
    super(name, visibility);
    this.attachNodes(constructors);
    this.attachNodes(methods);
    this.attachNodes(fields);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.constructors, ...this.methods, ...this.fields];
  }
}

export class ConstructorDeclaration extends AbstractDeclaration {
  readonly type = "ConstructorDeclaration" as const;

  constructor(
    name: string,
    public parameters: Parameter[],
    public body: Statement[],
    visibility: string | null = null,
  ) {
    super(name, visibility);
    for (const parameter of parameters) {
      this.attachNode(parameter.defaultValue);
    }
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    const nodes: AbstractNode[] = [];
    for (const parameter of this.parameters) {
      if (parameter.defaultValue) {
        nodes.push(parameter.defaultValue);
      }
    }
    nodes.push(...this.body);
    return nodes;
  }
}

export class MethodDeclaration extends AbstractMethod {
  readonly type = "MethodDeclaration" as const;
}

export class FieldDeclaration extends AbstractField {
  readonly type = "FieldDeclaration" as const;
}

export class DoInOrderStatement extends AbstractStatement {
  readonly type = "DoInOrder" as const;

  constructor(public body: Statement[]) {
    super();
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.body];
  }
}

export class DoTogetherStatement extends AbstractStatement {
  readonly type = "DoTogether" as const;

  constructor(public body: Statement[]) {
    super();
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.body];
  }
}

export class ConditionalStatement extends AbstractStatement {
  readonly type = "IfElse" as const;

  constructor(
    public condition: Expression,
    public ifBody: Statement[],
    public elseBody: Statement[] | null,
  ) {
    super();
    this.attachNode(condition);
    this.attachNodes(ifBody);
    if (elseBody) {
      this.attachNodes(elseBody);
    }
  }

  protected override getChildNodes(): AbstractNode[] {
    return [
      this.condition,
      ...this.ifBody,
      ...(this.elseBody ?? []),
    ];
  }
}

export class ForEachLoop extends AbstractStatement {
  readonly type = "ForEach" as const;

  constructor(
    public itemType: TypeRef,
    public itemName: string,
    public collection: Expression,
    public body: Statement[],
  ) {
    super();
    this.attachNode(collection);
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.collection, ...this.body];
  }
}

export class CountUpToStatement extends AbstractStatement {
  readonly type = "CountUpTo" as const;

  constructor(
    public count: Expression,
    public body: Statement[],
  ) {
    super();
    this.attachNode(count);
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.count, ...this.body];
  }
}

export class WhileLoopStatement extends AbstractStatement {
  readonly type = "WhileLoop" as const;

  constructor(
    public condition: Expression,
    public body: Statement[],
  ) {
    super();
    this.attachNode(condition);
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.condition, ...this.body];
  }
}

export class TryCatchStatement extends AbstractStatement {
  readonly type = "TryCatch" as const;

  constructor(
    public tryBody: Statement[],
    public catchType: TypeRef,
    public catchVariable: string,
    public catchBody: Statement[],
  ) {
    super();
    this.attachNodes(tryBody);
    this.attachNodes(catchBody);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.tryBody, ...this.catchBody];
  }
}

export class SwitchCaseStatement extends AbstractStatement {
  readonly type = "SwitchCase" as const;

  constructor(
    public expression: Expression,
    public cases: Array<{ value: Expression; body: Statement[] }>,
    public defaultCase: Statement[] | null,
  ) {
    super();
    this.attachNode(expression);
    for (const switchCase of cases) {
      this.attachNode(switchCase.value);
      this.attachNodes(switchCase.body);
    }
    if (defaultCase) {
      this.attachNodes(defaultCase);
    }
  }

  protected override getChildNodes(): AbstractNode[] {
    const nodes: AbstractNode[] = [this.expression];
    for (const switchCase of this.cases) {
      nodes.push(switchCase.value, ...switchCase.body);
    }
    if (this.defaultCase) {
      nodes.push(...this.defaultCase);
    }
    return nodes;
  }
}

export class ReturnStatement extends AbstractStatement {
  readonly type = "Return" as const;

  constructor(public expression: Expression | null) {
    super();
    this.attachNode(expression);
  }

  protected override getChildNodes(): AbstractNode[] {
    return this.expression ? [this.expression] : [];
  }
}

export class ExpressionStatement extends AbstractStatement {
  readonly type = "ExpressionStatement" as const;

  constructor(public expression: Expression) {
    super();
    this.attachNode(expression);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.expression];
  }
}

export class LocalVariableDeclarationStatement extends AbstractStatement {
  readonly type = "LocalVariableDeclaration" as const;

  constructor(
    public name: string,
    public varType: TypeRef,
    public initializer: Expression,
    public isConstant: boolean,
  ) {
    super();
    this.attachNode(initializer);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.initializer];
  }
}

export class BlockStatement extends AbstractStatement {
  readonly type = "Block" as const;

  constructor(public body: Statement[]) {
    super();
    this.attachNodes(body);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.body];
  }
}

export class DisabledBlockStatement extends AbstractStatement {
  readonly type = "DisabledBlock" as const;

  constructor(public raw: string) {
    super();
  }
}

export class CommentStatement extends AbstractStatement {
  readonly type = "Comment" as const;

  constructor(public text: string) {
    super();
  }
}

abstract class AbstractLiteral<TValue> extends AbstractExpression {
  readonly type = "Literal" as const;

  constructor(
    public value: TValue,
    public literalType: "number" | "string" | "boolean" | "null",
  ) {
    super();
  }
}

export class IntegerLiteral extends AbstractLiteral<number> {
  constructor(value: number) {
    super(value, "number");
  }
}

export class DoubleLiteral extends AbstractLiteral<number> {
  constructor(value: number) {
    super(value, "number");
  }
}

export class StringLiteral extends AbstractLiteral<string> {
  constructor(value: string) {
    super(value, "string");
  }
}

export class BooleanLiteral extends AbstractLiteral<boolean> {
  constructor(value: boolean) {
    super(value, "boolean");
  }
}

export class NullLiteral extends AbstractLiteral<null> {
  constructor() {
    super(null, "null");
  }
}

export class ThisExpression extends AbstractExpression {
  readonly type = "This" as const;
}

export class SuperExpression extends AbstractExpression {
  readonly type = "Super" as const;
}

export class IdentifierExpression extends AbstractExpression {
  readonly type = "Identifier" as const;

  constructor(public name: string) {
    super();
  }
}

export class FieldAccess extends AbstractExpression {
  readonly type = "MemberAccess" as const;

  constructor(
    public target: Expression,
    public memberName: string,
  ) {
    super();
    this.attachNode(target);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.target];
  }
}

export class MethodInvocation extends AbstractExpression {
  readonly type = "MethodInvocation" as const;
  #arguments: Argument[];

  constructor(
    public target: Expression | null,
    public methodName: string,
    args: Argument[],
  ) {
    super();
    this.#arguments = args;
    Object.defineProperty(this, "arguments", {
      enumerable: true,
      get: () => this.#arguments,
    });
    this.attachNode(target);
    for (const argument of args) {
      this.attachNode(argument.value);
    }
  }

  protected override getChildNodes(): AbstractNode[] {
    return [
      ...(this.target ? [this.target] : []),
      ...this.#arguments.map((argument) => argument.value),
    ];
  }
}

export interface MethodInvocation {
  arguments: Argument[];
}

export class NewInstanceExpression extends AbstractExpression {
  readonly type = "NewInstance" as const;
  #arguments: Argument[];

  constructor(
    public className: string,
    args: Argument[],
  ) {
    super();
    this.#arguments = args;
    Object.defineProperty(this, "arguments", {
      enumerable: true,
      get: () => this.#arguments,
    });
    for (const argument of args) {
      this.attachNode(argument.value);
    }
  }

  protected override getChildNodes(): AbstractNode[] {
    return this.#arguments.map((argument) => argument.value);
  }
}

export interface NewInstanceExpression {
  arguments: Argument[];
}

export class NewArrayExpression extends AbstractExpression {
  readonly type = "NewArray" as const;

  constructor(
    public elementType: TypeRef,
    public elements: Expression[],
    public size: Expression | null,
  ) {
    super();
    this.attachNodes(elements);
    this.attachNode(size);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.elements, ...(this.size ? [this.size] : [])];
  }
}

export class ArrayLiteralExpression extends AbstractExpression {
  readonly type = "ArrayLiteral" as const;

  constructor(public elements: Expression[]) {
    super();
    this.attachNodes(elements);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [...this.elements];
  }
}

export class BinaryOpExpression extends AbstractExpression {
  readonly type = "BinaryOp" as const;

  constructor(
    public operator: string,
    public left: Expression,
    public right: Expression,
  ) {
    super();
    this.attachNode(left);
    this.attachNode(right);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.left, this.right];
  }
}

export class UnaryOpExpression extends AbstractExpression {
  readonly type = "UnaryOp" as const;

  constructor(
    public operator: string,
    public operand: Expression,
  ) {
    super();
    this.attachNode(operand);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.operand];
  }
}

export class AssignmentExpression extends AbstractExpression {
  readonly type = "Assignment" as const;

  constructor(
    public target: Expression,
    public value: Expression,
  ) {
    super();
    this.attachNode(target);
    this.attachNode(value);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.target, this.value];
  }
}

export class ArrayAccessExpression extends AbstractExpression {
  readonly type = "ArrayAccess" as const;

  constructor(
    public target: Expression,
    public index: Expression,
  ) {
    super();
    this.attachNode(target);
    this.attachNode(index);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.target, this.index];
  }
}

export class TypeCastExpression extends AbstractExpression {
  readonly type = "TypeCast" as const;

  constructor(
    public expression: Expression,
    public targetType: TypeRef,
  ) {
    super();
    this.attachNode(expression);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.expression];
  }
}

export class InstanceOfExpression extends AbstractExpression {
  readonly type = "InstanceOf" as const;

  constructor(
    public expression: Expression,
    public testType: TypeRef,
  ) {
    super();
    this.attachNode(expression);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.expression];
  }
}

export class ParenthesizedExpression extends AbstractExpression {
  readonly type = "Parenthesized" as const;

  constructor(public expression: Expression) {
    super();
    this.attachNode(expression);
  }

  protected override getChildNodes(): AbstractNode[] {
    return [this.expression];
  }
}

export type Statement =
  | DoInOrderStatement
  | DoTogetherStatement
  | ConditionalStatement
  | ForEachLoop
  | CountUpToStatement
  | WhileLoopStatement
  | TryCatchStatement
  | SwitchCaseStatement
  | ReturnStatement
  | ExpressionStatement
  | LocalVariableDeclarationStatement
  | BlockStatement
  | DisabledBlockStatement
  | CommentStatement;

export type Expression =
  | IntegerLiteral
  | DoubleLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | ThisExpression
  | SuperExpression
  | IdentifierExpression
  | FieldAccess
  | MethodInvocation
  | NewInstanceExpression
  | NewArrayExpression
  | ArrayLiteralExpression
  | BinaryOpExpression
  | UnaryOpExpression
  | AssignmentExpression
  | ArrayAccessExpression
  | TypeCastExpression
  | InstanceOfExpression
  | ParenthesizedExpression;

export type ClassDecl = ClassDeclaration;
export type ConstructorDecl = ConstructorDeclaration;
export type MethodDecl = MethodDeclaration;
export type FieldDecl = FieldDeclaration;

export type RawStatement =
  | { type: "DoInOrder"; body: RawStatement[] }
  | { type: "DoTogether"; body: RawStatement[] }
  | { type: "IfElse"; condition: RawExpression; ifBody: RawStatement[]; elseBody: RawStatement[] | null }
  | { type: "ForEach"; itemType: TypeRef; itemName: string; collection: RawExpression; body: RawStatement[] }
  | { type: "CountUpTo"; count: RawExpression; body: RawStatement[] }
  | { type: "WhileLoop"; condition: RawExpression; body: RawStatement[] }
  | { type: "TryCatch"; tryBody: RawStatement[]; catchType: TypeRef; catchVariable: string; catchBody: RawStatement[] }
  | { type: "SwitchCase"; expression: RawExpression; cases: Array<{ value: RawExpression; body: RawStatement[] }>; defaultCase: RawStatement[] | null }
  | { type: "Return"; expression: RawExpression | null }
  | { type: "ExpressionStatement"; expression: RawExpression }
  | { type: "LocalVariableDeclaration"; name: string; varType: TypeRef; initializer: RawExpression; isConstant: boolean }
  | { type: "Block"; body: RawStatement[] }
  | { type: "DisabledBlock"; raw: string }
  | { type: "Comment"; text: string };

export type RawExpression =
  | { type: "Literal"; value: number | string | boolean | null; literalType: "number" | "string" | "boolean" | "null" }
  | { type: "This" }
  | { type: "Super" }
  | { type: "Identifier"; name: string }
  | { type: "MemberAccess"; target: RawExpression; memberName: string }
  | { type: "MethodInvocation"; target: RawExpression | null; methodName: string; arguments: RawArgument[] }
  | { type: "NewInstance"; className: string; arguments: RawArgument[] }
  | { type: "NewArray"; elementType: TypeRef; elements: RawExpression[]; size: RawExpression | null }
  | { type: "ArrayLiteral"; elements: RawExpression[] }
  | { type: "BinaryOp"; operator: string; left: RawExpression; right: RawExpression }
  | { type: "UnaryOp"; operator: string; operand: RawExpression }
  | { type: "Assignment"; target: RawExpression; value: RawExpression }
  | { type: "ArrayAccess"; target: RawExpression; index: RawExpression }
  | { type: "TypeCast"; expression: RawExpression; targetType: TypeRef }
  | { type: "InstanceOf"; expression: RawExpression; testType: TypeRef }
  | { type: "Parenthesized"; expression: RawExpression };

export type RawParameter = {
  name: string;
  paramType: TypeRef;
  isVarArgs: boolean;
  defaultValue: RawExpression | null;
};

export type RawArgument = {
  name: string | null;
  value: RawExpression;
};

export type RawConstructorDecl = {
  type: "ConstructorDeclaration";
  name: string;
  parameters: RawParameter[];
  body: RawStatement[];
  visibility: string | null;
};

export type RawMethodDecl = {
  type: "MethodDeclaration";
  name: string;
  returnType: TypeRef;
  parameters: RawParameter[];
  body: RawStatement[];
  isStatic: boolean;
  visibility: string | null;
};

export type RawFieldDecl = {
  type: "FieldDeclaration";
  name: string;
  fieldType: TypeRef;
  initializer: RawExpression | null;
  isStatic: boolean;
  isConstant: boolean;
  visibility: string | null;
};

export type RawClassDecl = {
  type: "ClassDeclaration";
  name: string;
  superClass: string | null;
  modelType: string | null;
  visibility: string | null;
  constructors: RawConstructorDecl[];
  methods: RawMethodDecl[];
  fields: RawFieldDecl[];
};

function hydrateArgument(argument: RawArgument): Argument {
  return {
    name: argument.name,
    value: hydrateExpression(argument.value),
  };
}

function hydrateParameter(parameter: RawParameter): Parameter {
  return {
    name: parameter.name,
    paramType: parameter.paramType,
    isVarArgs: parameter.isVarArgs,
    defaultValue: parameter.defaultValue ? hydrateExpression(parameter.defaultValue) : null,
  };
}

export function hydrateExpression(expression: RawExpression): Expression {
  switch (expression.type) {
    case "Literal":
      switch (expression.literalType) {
        case "number": {
          const value = expression.value as number;
          return Number.isInteger(value)
            ? new IntegerLiteral(value)
            : new DoubleLiteral(value);
        }
        case "string":
          return new StringLiteral(expression.value as string);
        case "boolean":
          return new BooleanLiteral(expression.value as boolean);
        case "null":
          return new NullLiteral();
      }
      throw new Error(`Unsupported literal type: ${JSON.stringify(expression)}`);
    case "This":
      return new ThisExpression();
    case "Super":
      return new SuperExpression();
    case "Identifier":
      return new IdentifierExpression(expression.name);
    case "MemberAccess":
      return new FieldAccess(hydrateExpression(expression.target), expression.memberName);
    case "MethodInvocation":
      return new MethodInvocation(
        expression.target ? hydrateExpression(expression.target) : null,
        expression.methodName,
        expression.arguments.map(hydrateArgument),
      );
    case "NewInstance":
      return new NewInstanceExpression(
        expression.className,
        expression.arguments.map(hydrateArgument),
      );
    case "NewArray":
      return new NewArrayExpression(
        expression.elementType,
        expression.elements.map(hydrateExpression),
        expression.size ? hydrateExpression(expression.size) : null,
      );
    case "ArrayLiteral":
      return new ArrayLiteralExpression(expression.elements.map(hydrateExpression));
    case "BinaryOp":
      return new BinaryOpExpression(
        expression.operator,
        hydrateExpression(expression.left),
        hydrateExpression(expression.right),
      );
    case "UnaryOp":
      return new UnaryOpExpression(expression.operator, hydrateExpression(expression.operand));
    case "Assignment":
      return new AssignmentExpression(
        hydrateExpression(expression.target),
        hydrateExpression(expression.value),
      );
    case "ArrayAccess":
      return new ArrayAccessExpression(
        hydrateExpression(expression.target),
        hydrateExpression(expression.index),
      );
    case "TypeCast":
      return new TypeCastExpression(hydrateExpression(expression.expression), expression.targetType);
    case "InstanceOf":
      return new InstanceOfExpression(hydrateExpression(expression.expression), expression.testType);
    case "Parenthesized":
      return new ParenthesizedExpression(hydrateExpression(expression.expression));
  }
  throw new Error(`Unsupported expression node: ${JSON.stringify(expression)}`);
}

export function hydrateStatement(statement: RawStatement): Statement {
  switch (statement.type) {
    case "DoInOrder":
      return new DoInOrderStatement(statement.body.map(hydrateStatement));
    case "DoTogether":
      return new DoTogetherStatement(statement.body.map(hydrateStatement));
    case "IfElse":
      return new ConditionalStatement(
        hydrateExpression(statement.condition),
        statement.ifBody.map(hydrateStatement),
        statement.elseBody ? statement.elseBody.map(hydrateStatement) : null,
      );
    case "ForEach":
      return new ForEachLoop(
        statement.itemType,
        statement.itemName,
        hydrateExpression(statement.collection),
        statement.body.map(hydrateStatement),
      );
    case "CountUpTo":
      return new CountUpToStatement(
        hydrateExpression(statement.count),
        statement.body.map(hydrateStatement),
      );
    case "WhileLoop":
      return new WhileLoopStatement(
        hydrateExpression(statement.condition),
        statement.body.map(hydrateStatement),
      );
    case "TryCatch":
      return new TryCatchStatement(
        statement.tryBody.map(hydrateStatement),
        statement.catchType,
        statement.catchVariable,
        statement.catchBody.map(hydrateStatement),
      );
    case "SwitchCase":
      return new SwitchCaseStatement(
        hydrateExpression(statement.expression),
        statement.cases.map((switchCase) => ({
          value: hydrateExpression(switchCase.value),
          body: switchCase.body.map(hydrateStatement),
        })),
        statement.defaultCase ? statement.defaultCase.map(hydrateStatement) : null,
      );
    case "Return":
      return new ReturnStatement(statement.expression ? hydrateExpression(statement.expression) : null);
    case "ExpressionStatement":
      return new ExpressionStatement(hydrateExpression(statement.expression));
    case "LocalVariableDeclaration":
      return new LocalVariableDeclarationStatement(
        statement.name,
        statement.varType,
        hydrateExpression(statement.initializer),
        statement.isConstant,
      );
    case "Block":
      return new BlockStatement(statement.body.map(hydrateStatement));
    case "DisabledBlock":
      return new DisabledBlockStatement(statement.raw);
    case "Comment":
      return new CommentStatement(statement.text);
  }
  throw new Error(`Unsupported statement node: ${JSON.stringify(statement)}`);
}

export function hydrateConstructorDecl(constructorDecl: RawConstructorDecl): ConstructorDeclaration {
  return new ConstructorDeclaration(
    constructorDecl.name,
    constructorDecl.parameters.map(hydrateParameter),
    constructorDecl.body.map(hydrateStatement),
    constructorDecl.visibility,
  );
}

export function hydrateMethodDecl(methodDecl: RawMethodDecl): MethodDeclaration {
  return new MethodDeclaration(
    methodDecl.name,
    methodDecl.returnType,
    methodDecl.parameters.map(hydrateParameter),
    methodDecl.body.map(hydrateStatement),
    methodDecl.isStatic,
    methodDecl.visibility,
  );
}

export function hydrateFieldDecl(fieldDecl: RawFieldDecl): FieldDeclaration {
  return new FieldDeclaration(
    fieldDecl.name,
    fieldDecl.fieldType,
    fieldDecl.initializer ? hydrateExpression(fieldDecl.initializer) : null,
    fieldDecl.isStatic,
    fieldDecl.isConstant,
    fieldDecl.visibility,
  );
}

export function hydrateClassDecl(classDecl: RawClassDecl): ClassDeclaration {
  return new ClassDeclaration(
    classDecl.name,
    classDecl.superClass,
    classDecl.modelType,
    classDecl.visibility,
    classDecl.constructors.map(hydrateConstructorDecl),
    classDecl.methods.map(hydrateMethodDecl),
    classDecl.fields.map(hydrateFieldDecl),
  );
}
