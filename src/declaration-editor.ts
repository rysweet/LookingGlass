import {
  AbstractNode,
  AccessLevel,
  ClassDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  UserParameter,
  type Expression,
  type TypeRef,
  simpleTypeRef,
} from "./ast-nodes.js";
import {
  TypeBrowser,
  TypeBrowserError,
  assertValidIdentifier,
  cloneTypeRef,
  createUniqueName,
  typeRefToString,
} from "./type-browser.js";

export interface MethodSignatureSnapshot {
  name: string;
  returnType: string;
  parameters: Array<{ name: string; type: string; isVarArgs: boolean }>;
}

export interface FieldDeclarationSnapshot {
  name: string;
  fieldType: string;
  hasInitializer: boolean;
  isStatic: boolean;
  isConstant: boolean;
}

export interface TypeSelectionOption {
  name: string;
  assignable: boolean;
}

export interface CreateMethodOptions {
  name: string;
  returnType?: TypeRef;
  parameters?: UserParameter[];
  body?: never[];
  isStatic?: boolean;
}

export interface CreateFieldOptions {
  name: string;
  fieldType?: TypeRef;
  initializer?: Expression | null;
  isStatic?: boolean;
  isConstant?: boolean;
}

function attachToOwner(owner: unknown, node: AbstractNode): void {
  (node as unknown as { setParent(parent: unknown): void }).setParent(owner);
}

function methodSignatureKey(name: string, parameters: readonly UserParameter[]): string {
  return `${name}(${parameters.map((parameter) => typeRefToString(parameter.paramType)).join(",")})`;
}

function fieldByName(type: ClassDeclaration, name: string): FieldDeclaration | undefined {
  return type.fields.find((field) => field.name === name) as FieldDeclaration | undefined;
}

function methodIndex(type: ClassDeclaration, method: MethodDeclaration): number {
  return type.methods.findIndex((candidate) => candidate === method);
}

export class TypeSelector {
  constructor(private readonly browser: TypeBrowser) {}

  options(query = "", assignableTo: TypeRef | string | null = null): TypeSelectionOption[] {
    const desired = assignableTo ? this.browser.resolveType(assignableTo) : null;
    return this.browser.searchTypes({ query }).map((type) => ({
      name: type.name,
      assignable: desired ? this.browser.isAssignable(type, desired) : true,
    }));
  }

  select(name: string): TypeRef {
    const resolved = this.browser.resolveType(name);
    if (!resolved) {
      throw new TypeBrowserError(`unknown type \"${name}\"`);
    }
    return cloneTypeRef(resolved.toTypeRef());
  }
}

export class MethodSignatureEditor {
  constructor(
    private readonly ownerType: ClassDeclaration,
    readonly method: MethodDeclaration,
  ) {}

  snapshot(): MethodSignatureSnapshot {
    return {
      name: this.method.name,
      returnType: typeRefToString(this.method.returnType),
      parameters: this.method.parameters.map((parameter) => ({
        name: parameter.name,
        type: typeRefToString(parameter.paramType),
        isVarArgs: parameter.isVarArgs,
      })),
    };
  }

  rename(name: string): void {
    assertValidIdentifier(name, "method name");
    const original = this.method.name;
    this.method.name = name;
    try {
      this.validateSignature();
    } catch (error) {
      this.method.name = original;
      throw error;
    }
  }

  setReturnType(type: TypeRef): void {
    this.method.returnType = cloneTypeRef(type);
  }

  addParameter(name: string, type: TypeRef, isVarArgs = false): UserParameter {
    assertValidIdentifier(name, "parameter name");
    if (this.method.parameters.some((parameter) => parameter.name === name)) {
      throw new TypeBrowserError(`parameter \"${name}\" already exists`);
    }
    const parameter = new UserParameter(name, cloneTypeRef(type), isVarArgs);
    attachToOwner(this.method, parameter);
    this.method.parameters.push(parameter);
    this.validateSignature();
    return parameter;
  }

  updateParameter(index: number, patch: Partial<{ name: string; type: TypeRef; isVarArgs: boolean }>): void {
    const parameter = this.method.parameters[index];
    if (!parameter) {
      throw new RangeError(`parameter index ${index} is out of bounds`);
    }
    const previous = { name: parameter.name, type: parameter.paramType, isVarArgs: parameter.isVarArgs };
    if (patch.name !== undefined) {
      assertValidIdentifier(patch.name, "parameter name");
      if (this.method.parameters.some((candidate, candidateIndex) => candidateIndex !== index && candidate.name === patch.name)) {
        throw new TypeBrowserError(`parameter \"${patch.name}\" already exists`);
      }
      parameter.name = patch.name;
    }
    if (patch.type) {
      parameter.paramType = cloneTypeRef(patch.type);
    }
    if (patch.isVarArgs !== undefined) {
      parameter.isVarArgs = patch.isVarArgs;
    }
    try {
      this.validateSignature();
    } catch (error) {
      parameter.name = previous.name;
      parameter.paramType = previous.type;
      parameter.isVarArgs = previous.isVarArgs;
      throw error;
    }
  }

  removeParameter(index: number): UserParameter {
    const [removed] = this.method.parameters.splice(index, 1);
    if (!removed) {
      throw new RangeError(`parameter index ${index} is out of bounds`);
    }
    return removed;
  }

  reorderParameter(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.method.parameters.length) {
      throw new RangeError(`parameter index ${fromIndex} is out of bounds`);
    }
    const [parameter] = this.method.parameters.splice(fromIndex, 1);
    const normalizedIndex = Math.max(0, Math.min(toIndex, this.method.parameters.length));
    this.method.parameters.splice(normalizedIndex, 0, parameter);
    this.validateSignature();
  }

  private validateSignature(): void {
    const signature = methodSignatureKey(this.method.name, this.method.parameters);
    const conflict = this.ownerType.methods.find((candidate) => candidate !== this.method && methodSignatureKey(candidate.name, candidate.parameters) === signature);
    if (conflict) {
      throw new TypeBrowserError(`method signature \"${signature}\" already exists`);
    }
  }
}

export class FieldDeclarationEditor {
  constructor(
    private readonly ownerType: ClassDeclaration,
    readonly field: FieldDeclaration,
  ) {}

  snapshot(): FieldDeclarationSnapshot {
    return {
      name: this.field.name,
      fieldType: typeRefToString(this.field.fieldType),
      hasInitializer: this.field.initializer !== null,
      isStatic: this.field.isStatic,
      isConstant: this.field.isConstant,
    };
  }

  rename(name: string): void {
    assertValidIdentifier(name, "field name");
    if (fieldByName(this.ownerType, name) && this.field.name !== name) {
      throw new TypeBrowserError(`field \"${name}\" already exists`);
    }
    this.field.name = name;
  }

  setFieldType(type: TypeRef): void {
    this.field.fieldType = cloneTypeRef(type);
  }

  setInitializer(initializer: Expression | null): void {
    this.field.initializer = initializer;
    if (initializer) {
      attachToOwner(this.field, initializer);
    }
  }

  setStatic(isStatic: boolean): void {
    this.field.isStatic = isStatic;
  }

  setConstant(isConstant: boolean): void {
    this.field.isConstant = isConstant;
  }
}

export class DeclarationEditor {
  readonly typeSelector: TypeSelector;

  constructor(
    readonly type: ClassDeclaration,
    readonly browser = new TypeBrowser([type]),
  ) {
    this.typeSelector = new TypeSelector(this.browser);
  }

  listMethods(): MethodDeclaration[] {
    return [...this.type.methods] as MethodDeclaration[];
  }

  listFields(): FieldDeclaration[] {
    return [...this.type.fields] as FieldDeclaration[];
  }

  createMethod(options: CreateMethodOptions): MethodDeclaration {
    assertValidIdentifier(options.name, "method name");
    const parameters = options.parameters ?? [];
    const signature = methodSignatureKey(options.name, parameters);
    if (this.type.methods.some((method) => methodSignatureKey(method.name, method.parameters) === signature)) {
      throw new TypeBrowserError(`method signature \"${signature}\" already exists`);
    }
    const method = new MethodDeclaration(
      options.name,
      cloneTypeRef(options.returnType ?? { type: "VoidTypeRef" }),
      parameters.map((parameter) => new UserParameter(parameter.name, cloneTypeRef(parameter.paramType), parameter.isVarArgs, parameter.defaultValue)),
      [],
      options.isStatic ?? false,
      null,
      AccessLevel.PUBLIC,
      false,
      false,
    );
    attachToOwner(this.type, method);
    this.type.methods.push(method);
    return method;
  }

  createField(options: CreateFieldOptions): FieldDeclaration {
    assertValidIdentifier(options.name, "field name");
    if (fieldByName(this.type, options.name)) {
      throw new TypeBrowserError(`field \"${options.name}\" already exists`);
    }
    const field = new FieldDeclaration(
      options.name,
      cloneTypeRef(options.fieldType ?? simpleTypeRef("Object")),
      options.initializer ?? null,
      options.isStatic ?? false,
      options.isConstant ?? false,
    );
    attachToOwner(this.type, field);
    this.type.fields.push(field);
    return field;
  }

  removeMethod(methodOrName: MethodDeclaration | string): boolean {
    const index = typeof methodOrName === "string"
      ? this.type.methods.findIndex((method) => method.name === methodOrName)
      : methodIndex(this.type, methodOrName);
    if (index < 0) {
      return false;
    }
    this.type.methods.splice(index, 1);
    return true;
  }

  removeField(fieldOrName: FieldDeclaration | string): boolean {
    const index = typeof fieldOrName === "string"
      ? this.type.fields.findIndex((field) => field.name === fieldOrName)
      : this.type.fields.findIndex((field) => field === fieldOrName);
    if (index < 0) {
      return false;
    }
    this.type.fields.splice(index, 1);
    return true;
  }

  getMethodEditor(name: string): MethodSignatureEditor {
    const method = this.type.methods.find((candidate) => candidate.name === name) as MethodDeclaration | undefined;
    if (!method) {
      throw new TypeBrowserError(`method \"${name}\" not found`);
    }
    return new MethodSignatureEditor(this.type, method);
  }

  getFieldEditor(name: string): FieldDeclarationEditor {
    const field = fieldByName(this.type, name);
    if (!field) {
      throw new TypeBrowserError(`field \"${name}\" not found`);
    }
    return new FieldDeclarationEditor(this.type, field);
  }

  ensureUniqueMethodName(baseName: string): string {
    return createUniqueName(baseName, this.type.methods.map((method) => method.name));
  }

  ensureUniqueFieldName(baseName: string): string {
    return createUniqueName(baseName, this.type.fields.map((field) => field.name));
  }
}
