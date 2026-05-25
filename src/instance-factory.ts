import {
  AbstractMethod,
  AbstractType,
  Expression,
  FieldAccess,
  InstanceCreation,
  LocalAccess,
  MethodInvocation,
  ParameterAccess,
  ThisExpression,
  TypeRef,
  UserField,
  UserParameter,
  simpleTypeRef,
  typeRefName,
} from "./ast-nodes";

export interface InstanceFactoryContext {
  currentType?: AbstractType | TypeRef | null;
}

export interface InstanceFactory {
  isValid(context?: InstanceFactoryContext): boolean;
  getValueType(): TypeRef | null;
  createTransientExpression(): Expression;
  createExpression(): Expression;
  getRepr(): string;
}

abstract class AbstractInstanceFactory implements InstanceFactory {
  abstract getValueType(): TypeRef | null;
  abstract createExpression(): Expression;
  abstract getRepr(): string;

  createTransientExpression(): Expression {
    return this.createExpression();
  }

  isValid(_context?: InstanceFactoryContext): boolean {
    return this.getValueType() !== null;
  }
}

export class ThisInstanceFactory extends AbstractInstanceFactory {
  constructor(private readonly currentType: TypeRef | null = null) {
    super();
  }

  override getValueType(): TypeRef | null {
    return this.currentType;
  }

  override createExpression(): Expression {
    return new ThisExpression(this.currentType);
  }

  override getRepr(): string {
    return "this";
  }
}

export class ThisFieldAccessFactory extends AbstractInstanceFactory {
  constructor(
    private readonly field: UserField,
    private readonly currentType: TypeRef | null = null,
  ) {
    super();
  }

  getField(): UserField {
    return this.field;
  }

  override isValid(context?: InstanceFactoryContext): boolean {
    const currentType = context?.currentType ?? this.currentType;
    const declaringType = this.field.getDeclaringType();
    return !declaringType || !currentType || declaringType.isAssignableFrom(currentType);
  }

  override getValueType(): TypeRef | null {
    return this.field.getValueType();
  }

  override createExpression(): Expression {
    return new FieldAccess(new ThisExpression(this.currentType), this.field.name, this.field);
  }

  override getRepr(): string {
    return `this.${this.field.name}`;
  }
}

export class GlobalFirstInstanceSceneFactory extends AbstractInstanceFactory {
  constructor(private readonly sceneField: UserField) {
    super();
  }

  override getValueType(): TypeRef | null {
    return this.sceneField.getValueType();
  }

  override createExpression(): Expression {
    const declaringType = this.sceneField.getDeclaringType()?.toTypeRef() ?? simpleTypeRef("Object");
    return new FieldAccess(new ThisExpression(declaringType), this.sceneField.name, this.sceneField);
  }

  override getRepr(): string {
    return this.sceneField.name;
  }
}

export class LocalAccessFactory extends AbstractInstanceFactory {
  constructor(private readonly access: LocalAccess) {
    super();
  }

  override getValueType(): TypeRef | null {
    return this.access.getType();
  }

  override createExpression(): Expression {
    return new LocalAccess(this.access.local);
  }

  override getRepr(): string {
    return this.access.name;
  }
}

export class ParameterAccessFactory extends AbstractInstanceFactory {
  constructor(private readonly access: ParameterAccess) {
    super();
  }

  getParameter(): UserParameter {
    return this.access.parameter;
  }

  override getValueType(): TypeRef | null {
    return this.access.getType();
  }

  override createExpression(): Expression {
    return new ParameterAccess(this.access.parameter);
  }

  override getRepr(): string {
    return this.access.name;
  }
}

export class ChainedFieldAccessFactory extends AbstractInstanceFactory {
  constructor(
    private readonly targetFactory: InstanceFactory,
    private readonly fieldName: string,
    private readonly field: UserField | null = null,
  ) {
    super();
  }

  override isValid(context?: InstanceFactoryContext): boolean {
    return this.targetFactory.isValid(context);
  }

  override getValueType(): TypeRef | null {
    return this.field?.getValueType() ?? null;
  }

  override createExpression(): Expression {
    return new FieldAccess(this.targetFactory.createExpression(), this.fieldName, this.field);
  }

  override getRepr(): string {
    return `${this.targetFactory.getRepr()}.${this.fieldName}`;
  }
}

export class ChainedMethodInvocationFactory extends AbstractInstanceFactory {
  constructor(
    private readonly targetFactory: InstanceFactory,
    private readonly methodName: string,
    private readonly method: AbstractMethod | null = null,
    private readonly argumentsList: Expression[] = [],
  ) {
    super();
  }

  override isValid(context?: InstanceFactoryContext): boolean {
    return this.targetFactory.isValid(context);
  }

  override getValueType(): TypeRef | null {
    return this.method?.getReturnType() ?? null;
  }

  override createExpression(): Expression {
    return new MethodInvocation(
      this.targetFactory.createExpression(),
      this.methodName,
      this.argumentsList.map((value) => ({ name: null, value })),
      this.method,
    );
  }

  override getRepr(): string {
    return `${this.targetFactory.getRepr()}.${this.methodName}()`;
  }
}

export class TypeSelectionInstanceFactory extends AbstractInstanceFactory {
  constructor(
    private readonly selectedType: AbstractType | TypeRef | string,
  ) {
    super();
  }

  override getValueType(): TypeRef | null {
    if (typeof this.selectedType === "string") {
      return simpleTypeRef(this.selectedType);
    }
    return this.selectedType instanceof AbstractType ? this.selectedType.toTypeRef() : this.selectedType;
  }

  override createExpression(): Expression {
    const typeRef = this.getValueType();
    return new InstanceCreation(typeRefName(typeRef) ?? "Object", []);
  }

  override getRepr(): string {
    return typeRefName(this.getValueType()) ?? "Object";
  }
}

export function createFactoryFromTypeSelection(type: AbstractType | TypeRef | string): InstanceFactory {
  return new TypeSelectionInstanceFactory(type);
}

export function resolveInstanceFactory(expression: Expression): InstanceFactory | null {
  if (expression instanceof ThisExpression) {
    return new ThisInstanceFactory(expression.getType());
  }
  if (expression instanceof FieldAccess) {
    if (expression.target instanceof ThisExpression && expression.field instanceof UserField) {
      return new ThisFieldAccessFactory(expression.field, expression.target.getType());
    }
    const targetFactory = resolveInstanceFactory(expression.target);
    return targetFactory ? new ChainedFieldAccessFactory(targetFactory, expression.memberName, expression.field as UserField | null) : null;
  }
  if (expression instanceof MethodInvocation) {
    if (!expression.target) {
      return null;
    }
    const targetFactory = resolveInstanceFactory(expression.target);
    return targetFactory
      ? new ChainedMethodInvocationFactory(targetFactory, expression.methodName, expression.method, expression.arguments.map((argument) => argument.value))
      : null;
  }
  if (expression instanceof LocalAccess) {
    return new LocalAccessFactory(expression);
  }
  if (expression instanceof ParameterAccess) {
    return new ParameterAccessFactory(expression);
  }
  if (expression instanceof InstanceCreation) {
    return createFactoryFromTypeSelection(expression.getType());
  }
  return null;
}
