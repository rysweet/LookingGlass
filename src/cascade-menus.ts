import {
  AbstractCode,
  AbstractField,
  AbstractMethod,
  AbstractNode,
  AbstractType,
  ArrayLiteralExpression,
  BlockStatement,
  BooleanLiteral,
  ClassDeclaration,
  ConditionalStatement,
  CountLoop,
  DoubleLiteral,
  EachInArrayTogether,
  EachInIterableTogether,
  FieldAccess,
  ForEachInArrayLoop,
  ForEachInIterableLoop,
  IntegerLiteral,
  LocalAccess,
  LocalDeclarationStatement,
  MethodInvocation,
  NewArrayExpression,
  NewInstanceExpression,
  NullLiteral,
  ParameterAccess,
  StringLiteral,
  ThisExpression,
  TypeLiteral,
  UserLocal,
  type Expression,
  type Statement,
  type TypeRef,
  simpleTypeRef,
} from "./ast-nodes.js";
import { TypeBrowser, cloneTypeRef, typeRefToString } from "./type-browser.js";

export interface CascadeContext {
  desiredType: TypeRef | ClassDeclaration | AbstractType | string | null;
  currentType?: ClassDeclaration | AbstractType | null;
  code?: AbstractCode | null;
  block?: BlockStatement | null;
  statementIndex?: number;
  previousExpression?: Expression | null;
  maxDepth?: number;
}

export interface CascadeMenu {
  label: string;
  options: CascadeOption[];
}

export interface CascadeOption {
  label: string;
  kind: "literal" | "reference" | "member" | "creator";
  expression: Expression;
  expressionType: TypeRef | null;
  submenu: CascadeMenu | null;
}

function attachToOwner(owner: unknown, node: AbstractNode): void {
  (node as unknown as { setParent(parent: unknown): void }).setParent(owner);
}

function describeType(type: TypeRef | ClassDeclaration | AbstractType | string | null): string {
  if (type === null) {
    return "Object";
  }
  if (typeof type === "string") {
    return type;
  }
  if (type instanceof AbstractType) {
    return type.name;
  }
  return typeRefToString(type);
}

function canAccept(browser: TypeBrowser, desired: TypeRef | ClassDeclaration | AbstractType | string | null, expressionType: TypeRef | null): boolean {
  if (!desired || !expressionType) {
    return true;
  }
  return browser.isAssignable(expressionType, desired);
}

function resolveLocals(block: BlockStatement, index: number): UserLocal[] {
  const locals: UserLocal[] = [];
  for (let i = 0; i < Math.min(index, block.body.length); i += 1) {
    const statement = block.body[i];
    if (statement instanceof LocalDeclarationStatement) {
      locals.push(statement.local);
    }
  }
  return locals;
}

function collectParentScopedLocals(statement: Statement | BlockStatement | null): UserLocal[] {
  const locals: UserLocal[] = [];
  let current: AbstractNode | null = statement;
  while (current) {
    if (current instanceof CountLoop) {
      if (current.variable) {
        locals.push(current.variable);
      }
      if (current.constant) {
        locals.push(current.constant);
      }
    } else if (current instanceof ForEachInArrayLoop || current instanceof ForEachInIterableLoop) {
      locals.push(current.item);
    } else if (current instanceof EachInArrayTogether || current instanceof EachInIterableTogether) {
      locals.push(current.item);
    } else if (current instanceof ConditionalStatement) {
      // no-op: conditional itself contributes no locals, but climbing through it mirrors Java lookup.
    }
    current = current.parent;
  }
  return locals;
}

function findOwnerOfBody(code: AbstractCode | null | undefined, body: Statement[]): AbstractNode | null {
  if (!code) {
    return null;
  }
  let match: AbstractNode | null = null;
  code.traverse((node) => {
    if (match) {
      return;
    }
    if (node instanceof ConditionalStatement) {
      if (node.ifBody === body || node.elseBody === body) {
        match = node;
      }
      return;
    }
    if (node instanceof CountLoop || node instanceof ForEachInArrayLoop || node instanceof ForEachInIterableLoop || node instanceof EachInArrayTogether || node instanceof EachInIterableTogether || node instanceof BlockStatement) {
      if ((node as { body: Statement[] }).body === body) {
        match = node;
      }
    }
  });
  return match;
}

function findCurrentType(code: AbstractCode | null | undefined): ClassDeclaration | AbstractType | null {
  return code?.getDeclaringType() as unknown as ClassDeclaration | AbstractType | null;
}

export class ExpressionCascade {
  constructor(private readonly browser: TypeBrowser) {}

  collectAccessibleLocals(context: CascadeContext): UserLocal[] {
    const locals: UserLocal[] = [];
    if (context.block) {
      locals.push(...resolveLocals(context.block, context.statementIndex ?? context.block.body.length));
      const owner = context.block.parent ?? findOwnerOfBody(context.code, context.block.body) ?? context.block;
      locals.push(...collectParentScopedLocals(owner as Statement | BlockStatement));
    }
    const deduped = new Map<string, UserLocal>();
    for (const local of locals) {
      deduped.set(local.name, local);
    }
    return [...deduped.values()];
  }

  buildMenu(context: CascadeContext): CascadeMenu {
    return this.buildMenuInternal(context, context.maxDepth ?? 2);
  }

  listTypeFilteredOptions(context: CascadeContext): CascadeOption[] {
    return this.buildMenu(context).options;
  }

  private buildMenuInternal(context: CascadeContext, depthRemaining: number): CascadeMenu {
    const desiredType = context.desiredType;
    const currentType = context.currentType ?? findCurrentType(context.code) ?? this.browser.resolveType("Object");
    const previousType = context.previousExpression ? this.browser.resolveType(context.previousExpression.getType()) : null;
    const receiverType = previousType ?? currentType;
    const options: CascadeOption[] = [];

    if (!context.previousExpression) {
      for (const local of this.collectAccessibleLocals(context)) {
        const expression = new LocalAccess(local);
        if (canAccept(this.browser, desiredType, expression.getType())) {
          options.push(this.createOption(`${local.name}: ${typeRefToString(local.valueType)}`, "reference", expression, depthRemaining, desiredType));
        }
      }
      const parameters = "parameters" in (context.code ?? {})
        ? ((context.code as { parameters?: Array<{ name: string; paramType: TypeRef }> }).parameters ?? [])
        : [];
      for (const parameter of parameters) {
        const expression = new ParameterAccess(parameter.name, parameter.paramType);
        if (canAccept(this.browser, desiredType, expression.getType())) {
          options.push(this.createOption(`${parameter.name}: ${typeRefToString(parameter.paramType)}`, "reference", expression, depthRemaining, desiredType));
        }
      }
    }

    if (receiverType) {
      const receiverExpression = context.previousExpression ?? new ThisExpression(receiverType.toTypeRef());
      const members = this.browser.listMembers(receiverType.name, true);
      for (const member of members) {
        if (member.kind === "field") {
          const field = member.declaration as AbstractField;
          const expression = new FieldAccess(receiverExpression, field.name, field);
          if (canAccept(this.browser, desiredType, expression.getType())) {
            options.push(this.createOption(member.inherited ? `${field.name} (${member.ownerType})` : field.name, "member", expression, depthRemaining, desiredType));
          }
          continue;
        }
        if (member.kind === "method") {
          const method = member.declaration as AbstractMethod;
          const expression = new MethodInvocation(receiverExpression, method.name, [], method);
          if (canAccept(this.browser, desiredType, expression.getType())) {
            options.push(this.createOption(member.inherited ? `${method.name}() (${member.ownerType})` : `${method.name}()`, "member", expression, depthRemaining, desiredType));
          }
          continue;
        }
      }
    }

    options.push(...this.createValueCreatorOptions(desiredType, depthRemaining));

    return {
      label: context.previousExpression ? describeType(context.previousExpression.getType()) : describeType(desiredType),
      options: options.sort((left, right) => left.label.localeCompare(right.label)),
    };
  }

  private createValueCreatorOptions(
    desiredType: TypeRef | ClassDeclaration | AbstractType | string | null,
    depthRemaining: number,
  ): CascadeOption[] {
    const desiredName = describeType(desiredType);
    const options: CascadeOption[] = [];
    if (["WholeNumber", "DecimalNumber", "Object"].includes(desiredName)) {
      options.push(this.createOption("0", "literal", new IntegerLiteral(0), depthRemaining, desiredType));
    }
    if (["DecimalNumber", "Object"].includes(desiredName)) {
      options.push(this.createOption("0.0", "literal", new DoubleLiteral(0), depthRemaining, desiredType));
    }
    if (["String", "Object"].includes(desiredName)) {
      options.push(this.createOption('"text"', "literal", new StringLiteral("text"), depthRemaining, desiredType));
    }
    if (["Boolean", "Object"].includes(desiredName)) {
      options.push(this.createOption("true", "literal", new BooleanLiteral(true), depthRemaining, desiredType));
      options.push(this.createOption("false", "literal", new BooleanLiteral(false), depthRemaining, desiredType));
    }
    options.push(this.createOption("null", "literal", new NullLiteral(), depthRemaining, desiredType));

    const desiredResolved = this.browser.resolveType(desiredType);
    if (desiredResolved && !desiredResolved.isPrimitive() && desiredResolved.name !== "Object") {
      options.push(this.createOption(`new ${desiredResolved.name}()`, "creator", new NewInstanceExpression(desiredResolved.name, []), depthRemaining, desiredType));
      options.push(this.createOption(`${desiredResolved.name}[]`, "creator", new NewArrayExpression(cloneTypeRef(desiredResolved.toTypeRef()), [], new IntegerLiteral(0)), depthRemaining, simpleTypeRef(desiredResolved.name, true)));
      options.push(this.createOption(`${desiredResolved.name}.class`, "creator", new TypeLiteral(cloneTypeRef(desiredResolved.toTypeRef())), depthRemaining, simpleTypeRef("Type")));
    }

    const desiredRef = desiredResolved?.toTypeRef();
    if (desiredRef?.type === "SimpleTypeRef" && desiredRef.isArray) {
      const componentName = desiredRef.name;
      options.push(this.createOption(`[] ${componentName}`, "creator", new ArrayLiteralExpression([]), depthRemaining, desiredRef));
    }
    return options;
  }

  private createOption(
    label: string,
    kind: CascadeOption["kind"],
    expression: Expression,
    depthRemaining: number,
    desiredType: TypeRef | ClassDeclaration | AbstractType | string | null,
  ): CascadeOption {
    return {
      label,
      kind,
      expression,
      expressionType: expression.getType(),
      submenu: depthRemaining > 0 && expression.getType() && kind !== "literal"
        ? this.buildMenuInternal({ desiredType, previousExpression: expression }, depthRemaining - 1)
        : null,
    };
  }
}
