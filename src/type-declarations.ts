export enum TypeModifier {
  PUBLIC = "public",
  PRIVATE = "private",
  STATIC = "static",
  ABSTRACT = "abstract",
}

export type TypeMemberKind = "field" | "method" | "constructor";

function assertIdentifier(value: string, label: string): string {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
}

function uniqueModifiers(modifiers: Iterable<TypeModifier>): TypeModifier[] {
  return [...new Set(modifiers)];
}

function formatGenericParameters(parameters: readonly GenericTypeParameter[]): string {
  return parameters.length === 0 ? "" : `<${parameters.map((parameter) => parameter.describe()).join(", ")}>`;
}

export class GenericTypeParameter {
  constructor(
    public readonly name: string,
    public readonly upperBound: string | null = null,
    public readonly defaultTypeName: string | null = null,
  ) {
    assertIdentifier(name, "type parameter");
  }

  describe(): string {
    const bound = this.upperBound ? ` extends ${this.upperBound}` : "";
    const fallback = this.defaultTypeName ? ` = ${this.defaultTypeName}` : "";
    return `${this.name}${bound}${fallback}`;
  }
}

export interface TypeMemberOptions {
  readonly typeName?: string | null;
  readonly parameterTypes?: readonly string[];
  readonly modifiers?: Iterable<TypeModifier>;
  readonly genericParameters?: readonly GenericTypeParameter[];
  readonly documentation?: string | null;
}

export class TypeMember {
  public readonly typeName: string | null;
  public readonly parameterTypes: readonly string[];
  public readonly genericParameters: readonly GenericTypeParameter[];
  public readonly documentation: string | null;
  private readonly modifierSet: Set<TypeModifier>;

  constructor(
    public readonly kind: TypeMemberKind,
    public readonly name: string,
    options: TypeMemberOptions = {},
  ) {
    assertIdentifier(name, `${kind} name`);
    this.typeName = options.typeName ?? (kind === "method" ? "void" : null);
    this.parameterTypes = [...(options.parameterTypes ?? [])];
    this.genericParameters = [...(options.genericParameters ?? [])];
    this.documentation = options.documentation ?? null;
    this.modifierSet = new Set(uniqueModifiers(options.modifiers ?? [TypeModifier.PUBLIC]));
  }

  get modifiers(): readonly TypeModifier[] {
    return [...this.modifierSet];
  }

  hasModifier(modifier: TypeModifier): boolean {
    return this.modifierSet.has(modifier);
  }

  signature(): string {
    const genericPrefix = formatGenericParameters(this.genericParameters);
    switch (this.kind) {
      case "field":
        return `${genericPrefix}${this.name}: ${this.typeName ?? "unknown"}`;
      case "method":
        return `${genericPrefix}${this.name}(${this.parameterTypes.join(", ")}): ${this.typeName ?? "void"}`;
      case "constructor":
        return `${genericPrefix}${this.name}(${this.parameterTypes.join(", ")})`;
    }
  }

  clone(): TypeMember {
    return new TypeMember(this.kind, this.name, {
      typeName: this.typeName,
      parameterTypes: this.parameterTypes,
      modifiers: this.modifiers,
      genericParameters: this.genericParameters,
      documentation: this.documentation,
    });
  }
}

interface TypeDeclarationOptions {
  readonly modifiers?: Iterable<TypeModifier>;
  readonly genericParameters?: readonly GenericTypeParameter[];
}

class TypeDeclarationBase {
  protected readonly members: TypeMember[] = [];
  public readonly modifiers: readonly TypeModifier[];
  public readonly genericParameters: readonly GenericTypeParameter[];

  constructor(
    public readonly name: string,
    options: TypeDeclarationOptions = {},
  ) {
    assertIdentifier(name, "type name");
    this.modifiers = uniqueModifiers(options.modifiers ?? [TypeModifier.PUBLIC]);
    this.genericParameters = [...(options.genericParameters ?? [])];
  }

  protected addMember(member: TypeMember): void {
    if (this.members.some((existing) => existing.signature() === member.signature())) {
      throw new Error(`Duplicate member signature on ${this.name}: ${member.signature()}`);
    }
    this.members.push(member.clone());
  }

  listMembers(kind?: TypeMemberKind): readonly TypeMember[] {
    const members = kind ? this.members.filter((member) => member.kind === kind) : this.members;
    return members.map((member) => member.clone());
  }

  findMember(name: string, kind?: TypeMemberKind): TypeMember | null {
    const member = this.members.find((candidate) => candidate.name === name && (kind === undefined || candidate.kind === kind));
    return member ? member.clone() : null;
  }

  protected describeHeader(keyword: string): string {
    return `${keyword} ${this.name}${formatGenericParameters(this.genericParameters)}`;
  }
}

export interface UserTypeDeclarationOptions extends TypeDeclarationOptions {
  readonly superTypeName?: string | null;
  readonly interfaceNames?: readonly string[];
}

export class UserTypeDeclaration extends TypeDeclarationBase {
  public readonly superTypeName: string | null;
  public readonly interfaceNames: readonly string[];

  constructor(name: string, options: UserTypeDeclarationOptions = {}) {
    super(name, options);
    this.superTypeName = options.superTypeName ?? null;
    this.interfaceNames = [...(options.interfaceNames ?? [])];
  }

  addField(name: string, typeName: string, modifiers: Iterable<TypeModifier> = [TypeModifier.PUBLIC]): this {
    this.addMember(new TypeMember("field", name, { typeName, modifiers }));
    return this;
  }

  addMethod(
    name: string,
    returnType: string,
    parameterTypes: readonly string[] = [],
    modifiers: Iterable<TypeModifier> = [TypeModifier.PUBLIC],
    genericParameters: readonly GenericTypeParameter[] = [],
  ): this {
    this.addMember(new TypeMember("method", name, {
      typeName: returnType,
      parameterTypes,
      modifiers,
      genericParameters,
    }));
    return this;
  }

  addConstructor(parameterTypes: readonly string[] = [], modifiers: Iterable<TypeModifier> = [TypeModifier.PUBLIC]): this {
    this.addMember(new TypeMember("constructor", this.name, { parameterTypes, modifiers }));
    return this;
  }

  describe(): string {
    const extendsClause = this.superTypeName ? ` extends ${this.superTypeName}` : "";
    const implementsClause = this.interfaceNames.length > 0 ? ` implements ${this.interfaceNames.join(", ")}` : "";
    return `${this.describeHeader("class")}${extendsClause}${implementsClause}`;
  }
}

export interface BuiltInTypeDeclarationOptions extends TypeDeclarationOptions {
  readonly storyQualifiedName?: string | null;
  readonly resourceTypeName?: string | null;
  readonly interfaceNames?: readonly string[];
}

export class BuiltInTypeDeclaration extends TypeDeclarationBase {
  public readonly storyQualifiedName: string | null;
  public readonly resourceTypeName: string | null;
  public readonly interfaceNames: readonly string[];

  constructor(name: string, options: BuiltInTypeDeclarationOptions = {}) {
    super(name, options);
    this.storyQualifiedName = options.storyQualifiedName ?? null;
    this.resourceTypeName = options.resourceTypeName ?? null;
    this.interfaceNames = [...(options.interfaceNames ?? [])];
  }

  get isAbstract(): boolean {
    return this.modifiers.includes(TypeModifier.ABSTRACT);
  }

  describe(): string {
    const interfaceClause = this.interfaceNames.length > 0 ? ` implements ${this.interfaceNames.join(", ")}` : "";
    const backing = this.storyQualifiedName ? ` mapped-to ${this.storyQualifiedName}` : "";
    return `${this.describeHeader("builtin")}${interfaceClause}${backing}`;
  }
}

export class EnumDeclaration extends TypeDeclarationBase {
  private readonly literals: string[] = [];

  constructor(name: string, literals: readonly string[] = []) {
    super(name, { modifiers: [TypeModifier.PUBLIC] });
    literals.forEach((literal) => this.addLiteral(literal));
  }

  addLiteral(literal: string): this {
    assertIdentifier(literal, "enum literal");
    if (!this.literals.includes(literal)) {
      this.literals.push(literal);
    }
    return this;
  }

  values(): readonly string[] {
    return [...this.literals];
  }

  hasLiteral(literal: string): boolean {
    return this.literals.includes(literal);
  }

  ordinalOf(literal: string): number {
    return this.literals.indexOf(literal);
  }

  describe(): string {
    return `${this.describeHeader("enum")} { ${this.literals.join(", ")} }`;
  }
}

export interface InterfaceDeclarationOptions extends TypeDeclarationOptions {
  readonly extendedInterfaces?: readonly string[];
}

export class InterfaceDeclaration extends TypeDeclarationBase {
  public readonly extendedInterfaces: readonly string[];

  constructor(name: string, options: InterfaceDeclarationOptions = {}) {
    super(name, {
      modifiers: options.modifiers ?? [TypeModifier.PUBLIC, TypeModifier.ABSTRACT],
      genericParameters: options.genericParameters,
    });
    this.extendedInterfaces = [...(options.extendedInterfaces ?? [])];
  }

  addMethod(
    name: string,
    returnType: string,
    parameterTypes: readonly string[] = [],
    genericParameters: readonly GenericTypeParameter[] = [],
  ): this {
    this.addMember(new TypeMember("method", name, {
      typeName: returnType,
      parameterTypes,
      modifiers: [TypeModifier.PUBLIC, TypeModifier.ABSTRACT],
      genericParameters,
    }));
    return this;
  }

  isSatisfiedBy(candidate: { readonly name: string; listMembers(kind?: TypeMemberKind): readonly TypeMember[] }): boolean {
    return this.listMembers("method").every((required) => candidate.listMembers("method")
      .some((member) => member.signature() === required.signature()));
  }

  describe(): string {
    const extendsClause = this.extendedInterfaces.length > 0 ? ` extends ${this.extendedInterfaces.join(", ")}` : "";
    return `${this.describeHeader("interface")}${extendsClause}`;
  }
}
