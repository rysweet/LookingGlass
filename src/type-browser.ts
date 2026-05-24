import {
  AbstractConstructor,
  AbstractField,
  AbstractMethod,
  AbstractNode,
  AbstractType,
  AccessLevel,
  ClassDeclaration,
  ConstructorDeclaration,
  FieldDeclaration,
  FieldModifierFinalVolatileOrNeither,
  JavaType,
  ManagementLevel,
  MethodDeclaration,
  UserParameter,
  type Expression,
  type Statement,
  type TypeRef,
  simpleTypeRef,
  typeRefName,
  typeRefsAssignable,
} from "./ast-nodes.js";
import { decodeAstNode, encodeAstNode } from "./ast-serialization.js";

export interface TypeSearchOptions {
  query?: string;
  assignableTo?: ClassDeclaration | AbstractType | TypeRef | string | null;
  includeBuiltins?: boolean;
}

export interface TypeHierarchyNode {
  type: AbstractType;
  depth: number;
  children: TypeHierarchyNode[];
}

export interface TypeMemberDescriptor {
  kind: "constructor" | "field" | "method";
  name: string;
  ownerType: string;
  inherited: boolean;
  declaration: AbstractConstructor | AbstractField | AbstractMethod;
  returnType: TypeRef | null;
  parameterTypes: TypeRef[];
}

export interface TypeImportStrategy {
  onTypeConflict?: "merge" | "rename" | "replace";
  onMemberConflict?: "rename" | "skip" | "replace";
}

export interface TypeImportMemberPlan {
  kind: "constructor" | "field" | "method";
  action: "add" | "rename" | "skip" | "replace";
  sourceName: string;
  targetName: string;
  conflictWith: string | null;
}

export interface TypeImportPlan {
  importedTypeName: string;
  targetTypeName: string;
  action: "add-type" | "merge-type" | "rename-type" | "replace-type";
  memberPlans: TypeImportMemberPlan[];
  warnings: string[];
}

export class TypeBrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TypeBrowserError";
  }
}

const DEFAULT_JAVA_TYPES: Array<{ name: string; superType: string | null; primitive?: boolean }> = [
  { name: "Object", superType: null },
  { name: "String", superType: "Object" },
  { name: "Boolean", superType: "Object" },
  { name: "WholeNumber", superType: "Object", primitive: true },
  { name: "DecimalNumber", superType: "Object", primitive: true },
  { name: "Type", superType: "Object" },
  { name: "SThing", superType: "Object" },
  { name: "SGround", superType: "SThing" },
  { name: "SScene", superType: "SThing" },
  { name: "STurnable", superType: "SThing" },
  { name: "SMovableTurnable", superType: "STurnable" },
  { name: "SCamera", superType: "SMovableTurnable" },
  { name: "SModel", superType: "SMovableTurnable" },
  { name: "SJointedModel", superType: "SModel" },
  { name: "SBiped", superType: "SJointedModel" },
  { name: "SFlyer", superType: "SJointedModel" },
  { name: "SQuadruped", superType: "SJointedModel" },
  { name: "SProp", superType: "SJointedModel" },
];

function attachToOwner(owner: unknown, node: AbstractNode): void {
  (node as unknown as { setParent(parent: unknown): void }).setParent(owner);
}

function cloneNode<T extends Statement | Expression>(node: T): T {
  const cloned = decodeAstNode(encodeAstNode(node));
  if (cloned instanceof ClassDeclaration) {
    throw new TypeBrowserError("expected statement or expression clone");
  }
  return cloned as T;
}

export function cloneTypeRef(typeRef: TypeRef): TypeRef {
  switch (typeRef.type) {
    case "SimpleTypeRef":
      return { ...typeRef };
    case "VoidTypeRef":
      return { type: "VoidTypeRef" };
    case "LambdaTypeRef":
      return { ...typeRef };
  }
}

function cloneExpression(expression: Expression | null): Expression | null {
  return expression ? cloneNode(expression) : null;
}

function cloneParameter(parameter: UserParameter): UserParameter {
  return new UserParameter(
    parameter.name,
    cloneTypeRef(parameter.paramType),
    parameter.isVarArgs,
    cloneExpression(parameter.defaultValue),
    parameter.visibility,
  );
}

export function cloneMethodDeclaration(method: AbstractMethod): MethodDeclaration {
  const userMethod = method as MethodDeclaration;
  return new MethodDeclaration(
    method.name,
    cloneTypeRef(method.returnType),
    method.parameters.map(cloneParameter),
    method.body.map((statement) => cloneNode(statement)),
    method.isStatic,
    method.visibility,
    method.accessLevel,
    userMethod.isAbstract ?? false,
    userMethod.isFinal ?? false,
  );
}

export function cloneFieldDeclaration(field: AbstractField): FieldDeclaration {
  const userField = field as FieldDeclaration;
  return new FieldDeclaration(
    field.name,
    cloneTypeRef(field.fieldType),
    cloneExpression(field.initializer),
    field.isStatic,
    field.isConstant,
    field.visibility,
    field.accessLevel,
    userField.finalVolatileOrNeither ?? FieldModifierFinalVolatileOrNeither.NEITHER,
    userField.isTransient ?? false,
    userField.managementLevel ?? ManagementLevel.NONE,
    userField.isDeletionAllowed ?? true,
  );
}

export function cloneConstructorDeclaration(constructorDeclaration: AbstractConstructor): ConstructorDeclaration {
  return new ConstructorDeclaration(
    constructorDeclaration.name,
    constructorDeclaration.parameters.map(cloneParameter),
    constructorDeclaration.body.map((statement) => cloneNode(statement)),
    constructorDeclaration.visibility,
  );
}

export function cloneClassDeclaration(type: ClassDeclaration, nameOverride?: string): ClassDeclaration {
  return new ClassDeclaration(
    nameOverride ?? type.name,
    type.superClass,
    type.modelType,
    type.visibility,
    type.constructors.map((ctor) => cloneConstructorDeclaration(ctor)),
    type.methods.map((method) => cloneMethodDeclaration(method)),
    type.fields.map((field) => cloneFieldDeclaration(field)),
  );
}

function signatureForMethod(method: AbstractMethod): string {
  return `${method.name}(${method.parameters.map((parameter) => typeRefToString(parameter.paramType)).join(",")})`;
}

function signatureForConstructor(constructorDeclaration: AbstractConstructor): string {
  return `constructor(${constructorDeclaration.parameters.map((parameter) => typeRefToString(parameter.paramType)).join(",")})`;
}

function signatureForField(field: AbstractField): string {
  return field.name;
}

export function typeRefToString(typeRef: TypeRef | null): string {
  if (!typeRef) {
    return "null";
  }
  switch (typeRef.type) {
    case "SimpleTypeRef":
      return `${typeRef.name}${typeRef.isArray ? "[]" : ""}`;
    case "VoidTypeRef":
      return "void";
    case "LambdaTypeRef":
      return typeRef.raw;
  }
}

export function isValidIdentifier(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

export function assertValidIdentifier(value: string, kind = "identifier"): void {
  if (!isValidIdentifier(value)) {
    throw new TypeBrowserError(`${kind} must be a valid Java identifier`);
  }
}

export function createUniqueName(baseName: string, existingNames: Iterable<string>): string {
  const existing = new Set(existingNames);
  if (!existing.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (existing.has(`${baseName}${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}${suffix}`;
}

function ensureBuiltinType(name: string, superType: string | null, primitive = false): JavaType {
  const type = JavaType.getInstance(name)!;
  type.superTypeName = superType;
  type.primitive = primitive;
  return type;
}

function defaultTypes(): AbstractType[] {
  return DEFAULT_JAVA_TYPES.map((entry) => ensureBuiltinType(entry.name, entry.superType, entry.primitive ?? false));
}

function toTypeName(type: ClassDeclaration | AbstractType | TypeRef | string | null): string | null {
  if (type === null) {
    return null;
  }
  if (typeof type === "string") {
    return type;
  }
  if (type instanceof AbstractType) {
    return type.name;
  }
  return typeRefName(type);
}

export class TypeBrowser {
  private readonly userTypes = new Map<string, ClassDeclaration>();
  private readonly builtinTypes = new Map<string, AbstractType>();

  constructor(types: ClassDeclaration[] = [], builtins: AbstractType[] = defaultTypes()) {
    for (const builtin of builtins) {
      this.builtinTypes.set(builtin.name, builtin);
    }
    for (const type of types) {
      this.registerType(type);
    }
  }

  allTypes(includeBuiltins = true): AbstractType[] {
    const types = includeBuiltins
      ? [...this.builtinTypes.values(), ...this.userTypes.values()]
      : [...this.userTypes.values()];
    return [...types].sort((left, right) => left.name.localeCompare(right.name)) as AbstractType[];
  }

  resolveType(nameOrType: ClassDeclaration | AbstractType | TypeRef | string | null): AbstractType | null {
    const name = toTypeName(nameOrType);
    if (!name) {
      return null;
    }
    return (this.userTypes.get(name) as unknown as AbstractType | undefined)
      ?? this.builtinTypes.get(name)
      ?? JavaType.getInstance(name);
  }

  registerType(type: ClassDeclaration): void {
    assertValidIdentifier(type.name, "type name");
    if (this.userTypes.has(type.name) || this.builtinTypes.has(type.name)) {
      throw new TypeBrowserError(`type \"${type.name}\" already exists`);
    }
    attachToOwner(null, type);
    this.userTypes.set(type.name, type);
  }

  unregisterType(name: string): boolean {
    return this.userTypes.delete(name);
  }

  createType(name: string, superTypeName: string | null = null, modelType: string | null = null): ClassDeclaration {
    assertValidIdentifier(name, "type name");
    if (this.userTypes.has(name) || this.builtinTypes.has(name)) {
      throw new TypeBrowserError(`type \"${name}\" already exists`);
    }
    const created = new ClassDeclaration(name, superTypeName, modelType, null, [], [], []);
    this.registerType(created);
    return created;
  }

  searchTypes(options: TypeSearchOptions = {}): AbstractType[] {
    const query = options.query?.trim().toLowerCase() ?? "";
    const desiredType = this.resolveType(options.assignableTo ?? null);
    return this.allTypes(options.includeBuiltins !== false).filter((type) => {
      if (desiredType && !this.isAssignable(type, desiredType)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return type.name.toLowerCase().includes(query);
    });
  }

  isAssignable(
    source: ClassDeclaration | AbstractType | TypeRef | string | null,
    target: ClassDeclaration | AbstractType | TypeRef | string | null,
  ): boolean {
    const sourceType = this.resolveType(source);
    const targetType = this.resolveType(target);
    if (!sourceType || !targetType) {
      return typeRefsAssignable(
        target instanceof AbstractType ? target.toTypeRef() : typeof target === "string" ? simpleTypeRef(target) : target,
        source instanceof AbstractType ? source.toTypeRef() : typeof source === "string" ? simpleTypeRef(source) : source,
      );
    }
    if (sourceType.name === targetType.name) {
      return true;
    }
    if (sourceType.name === "WholeNumber" && targetType.name === "DecimalNumber") {
      return true;
    }
    let current: AbstractType | null = this.getResolvedSuperType(sourceType);
    while (current) {
      if (current.name === targetType.name) {
        return true;
      }
      current = this.getResolvedSuperType(current);
    }
    return false;
  }

  getResolvedSuperType(type: AbstractType | null): AbstractType | null {
    if (!type) {
      return null;
    }
    if (type instanceof ClassDeclaration) {
      return type.superClass ? this.resolveType(type.superClass) : null;
    }
    const superType = type.getSuperType();
    if (!superType) {
      return null;
    }
    return this.resolveType(superType.name) ?? superType;
  }

  listHierarchy(rootName?: string): TypeHierarchyNode[] {
    const types = this.allTypes(true);
    const includedNames = rootName
      ? new Set(this.collectDescendantNames(this.resolveType(rootName)))
      : new Set(types.map((type) => type.name));
    const nodes = new Map<string, TypeHierarchyNode>();
    for (const type of types) {
      if (includedNames.has(type.name)) {
        nodes.set(type.name, { type, depth: 0, children: [] });
      }
    }
    const roots: TypeHierarchyNode[] = [];
    for (const node of nodes.values()) {
      const parent = this.getResolvedSuperType(node.type);
      const parentNode = parent ? nodes.get(parent.name) : undefined;
      if (parentNode) {
        node.depth = parentNode.depth + 1;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortNode = (node: TypeHierarchyNode): void => {
      node.children.sort((left, right) => left.type.name.localeCompare(right.type.name));
      for (const child of node.children) {
        child.depth = node.depth + 1;
        sortNode(child);
      }
    };
    roots.sort((left, right) => left.type.name.localeCompare(right.type.name));
    for (const root of roots) {
      sortNode(root);
    }
    return roots;
  }

  listMembers(typeName: string | AbstractType, includeInherited = true): TypeMemberDescriptor[] {
    const type = typeof typeName === "string" ? this.resolveType(typeName) : typeName;
    if (!type) {
      throw new TypeBrowserError(`unknown type \"${typeof typeName === "string" ? typeName : typeName.name}\"`);
    }
    const results: TypeMemberDescriptor[] = [];
    const visited = new Set<string>();
    let current: AbstractType | null = type;
    while (current) {
      const inherited = current.name !== type.name;
      for (const constructorDeclaration of current.getDeclaredConstructors()) {
        const key = `constructor:${signatureForConstructor(constructorDeclaration)}`;
        if (!visited.has(key)) {
          visited.add(key);
          results.push({
            kind: "constructor",
            name: constructorDeclaration.name,
            ownerType: current.name,
            inherited,
            declaration: constructorDeclaration,
            returnType: simpleTypeRef(current.name),
            parameterTypes: constructorDeclaration.parameters.map((parameter) => cloneTypeRef(parameter.paramType)),
          });
        }
      }
      for (const field of current.getDeclaredFields()) {
        const key = `field:${signatureForField(field)}`;
        if (!visited.has(key)) {
          visited.add(key);
          results.push({
            kind: "field",
            name: field.name,
            ownerType: current.name,
            inherited,
            declaration: field,
            returnType: cloneTypeRef(field.fieldType),
            parameterTypes: [],
          });
        }
      }
      for (const method of current.getDeclaredMethods()) {
        const key = `method:${signatureForMethod(method)}`;
        if (!visited.has(key)) {
          visited.add(key);
          results.push({
            kind: "method",
            name: method.name,
            ownerType: current.name,
            inherited,
            declaration: method,
            returnType: cloneTypeRef(method.returnType),
            parameterTypes: method.parameters.map((parameter) => cloneTypeRef(parameter.paramType)),
          });
        }
      }
      current = includeInherited ? this.getResolvedSuperType(current) : null;
    }
    return results;
  }

  createImportWizard(importedType: ClassDeclaration): ImportTypeWizard {
    return new ImportTypeWizard(this, importedType);
  }

  private collectDescendantNames(root: AbstractType | null): string[] {
    if (!root) {
      return [];
    }
    const descendants = new Set<string>([root.name]);
    let added = true;
    while (added) {
      added = false;
      for (const type of this.allTypes(true)) {
        const superType = this.getResolvedSuperType(type);
        if (superType && descendants.has(superType.name) && !descendants.has(type.name)) {
          descendants.add(type.name);
          added = true;
        }
      }
    }
    return [...descendants];
  }
}

export class ImportTypeWizard {
  constructor(
    private readonly browser: TypeBrowser,
    private readonly importedType: ClassDeclaration,
  ) {}

  plan(strategy: TypeImportStrategy = {}): TypeImportPlan {
    const typeConflict = this.browser.resolveType(this.importedType.name);
    const typeAction = strategy.onTypeConflict ?? "merge";
    const memberAction = strategy.onMemberConflict ?? "rename";
    if (!typeConflict || !(typeConflict instanceof ClassDeclaration)) {
      return {
        importedTypeName: this.importedType.name,
        targetTypeName: this.importedType.name,
        action: "add-type",
        memberPlans: this.buildAddPlans(this.importedType),
        warnings: [],
      };
    }
    if (typeAction === "replace") {
      return {
        importedTypeName: this.importedType.name,
        targetTypeName: this.importedType.name,
        action: "replace-type",
        memberPlans: this.buildAddPlans(this.importedType),
        warnings: [`replacing existing type \"${this.importedType.name}\"`],
      };
    }
    if (typeAction === "rename") {
      const renamed = createUniqueName(this.importedType.name, this.browser.allTypes(true).map((type) => type.name));
      return {
        importedTypeName: this.importedType.name,
        targetTypeName: renamed,
        action: "rename-type",
        memberPlans: this.buildAddPlans(this.importedType),
        warnings: [`renaming imported type to \"${renamed}\"`],
      };
    }
    return {
      importedTypeName: this.importedType.name,
      targetTypeName: typeConflict.name,
      action: "merge-type",
      memberPlans: this.buildMergePlans(typeConflict, memberAction),
      warnings: [],
    };
  }

  apply(strategy: TypeImportStrategy = {}): ClassDeclaration {
    const plan = this.plan(strategy);
    switch (plan.action) {
      case "add-type": {
        const cloned = cloneClassDeclaration(this.importedType, plan.targetTypeName);
        this.browser.registerType(cloned);
        return cloned;
      }
      case "rename-type": {
        const cloned = cloneClassDeclaration(this.importedType, plan.targetTypeName);
        this.browser.registerType(cloned);
        return cloned;
      }
      case "replace-type": {
        this.browser.unregisterType(plan.targetTypeName);
        const cloned = cloneClassDeclaration(this.importedType, plan.targetTypeName);
        this.browser.registerType(cloned);
        return cloned;
      }
      case "merge-type": {
        const targetType = this.browser.resolveType(plan.targetTypeName);
        if (!(targetType instanceof ClassDeclaration)) {
          throw new TypeBrowserError(`cannot merge into non-user type \"${plan.targetTypeName}\"`);
        }
        this.applyMergePlan(targetType, plan);
        return targetType;
      }
    }
  }

  private buildAddPlans(type: ClassDeclaration): TypeImportMemberPlan[] {
    return [
      ...type.constructors.map((ctor) => ({
        kind: "constructor" as const,
        action: "add" as const,
        sourceName: signatureForConstructor(ctor),
        targetName: signatureForConstructor(ctor),
        conflictWith: null,
      })),
      ...type.fields.map((field) => ({
        kind: "field" as const,
        action: "add" as const,
        sourceName: field.name,
        targetName: field.name,
        conflictWith: null,
      })),
      ...type.methods.map((method) => ({
        kind: "method" as const,
        action: "add" as const,
        sourceName: signatureForMethod(method),
        targetName: signatureForMethod(method),
        conflictWith: null,
      })),
    ];
  }

  private buildMergePlans(targetType: ClassDeclaration, onConflict: "rename" | "skip" | "replace"): TypeImportMemberPlan[] {
    const memberPlans: TypeImportMemberPlan[] = [];
    const fieldNames = new Set(targetType.fields.map((field) => field.name));
    for (const field of this.importedType.fields) {
      const existing = targetType.fields.find((candidate) => candidate.name === field.name) ?? null;
      memberPlans.push({
        kind: "field",
        action: existing ? (onConflict === "rename" ? "rename" : onConflict) : "add",
        sourceName: field.name,
        targetName: existing && onConflict === "rename" ? createUniqueName(field.name, fieldNames) : field.name,
        conflictWith: existing?.name ?? null,
      });
      fieldNames.add(memberPlans[memberPlans.length - 1].targetName);
    }

    const methodSignatures = new Set(targetType.methods.map((method) => signatureForMethod(method)));
    for (const method of this.importedType.methods) {
      const signature = signatureForMethod(method);
      const existing = targetType.methods.find((candidate) => signatureForMethod(candidate) === signature) ?? null;
      const renamed = existing && onConflict === "rename"
        ? `${createUniqueName(method.name, targetType.methods.map((candidate) => candidate.name))}(${method.parameters.map((parameter) => typeRefToString(parameter.paramType)).join(",")})`
        : signature;
      memberPlans.push({
        kind: "method",
        action: existing ? (onConflict === "rename" ? "rename" : onConflict) : "add",
        sourceName: signature,
        targetName: renamed,
        conflictWith: existing ? signature : null,
      });
      methodSignatures.add(renamed);
    }

    const constructorSignatures = new Set(targetType.constructors.map((ctor) => signatureForConstructor(ctor)));
    for (const ctor of this.importedType.constructors) {
      const signature = signatureForConstructor(ctor);
      const existing = targetType.constructors.find((candidate) => signatureForConstructor(candidate) === signature) ?? null;
      memberPlans.push({
        kind: "constructor",
        action: existing ? onConflict : "add",
        sourceName: signature,
        targetName: signature,
        conflictWith: existing ? signature : null,
      });
      constructorSignatures.add(signature);
    }
    return memberPlans;
  }

  private applyMergePlan(targetType: ClassDeclaration, plan: TypeImportPlan): void {
    for (const memberPlan of plan.memberPlans) {
      if (memberPlan.action === "skip") {
        continue;
      }
      if (memberPlan.kind === "field") {
        const source = this.importedType.fields.find((field) => field.name === memberPlan.sourceName);
        if (!source) {
          continue;
        }
        const clone = cloneFieldDeclaration(source);
        clone.name = memberPlan.targetName;
        this.applyFieldPlan(targetType, clone, memberPlan);
        continue;
      }
      if (memberPlan.kind === "method") {
        const source = this.importedType.methods.find((method) => signatureForMethod(method) === memberPlan.sourceName);
        if (!source) {
          continue;
        }
        const clone = cloneMethodDeclaration(source);
        if (memberPlan.action === "rename") {
          clone.name = memberPlan.targetName.slice(0, memberPlan.targetName.indexOf("("));
        }
        this.applyMethodPlan(targetType, clone, memberPlan);
        continue;
      }
      const source = this.importedType.constructors.find((ctor) => signatureForConstructor(ctor) === memberPlan.sourceName);
      if (!source) {
        continue;
      }
      const clone = cloneConstructorDeclaration(source);
      this.applyConstructorPlan(targetType, clone, memberPlan);
    }
  }

  private applyFieldPlan(targetType: ClassDeclaration, field: FieldDeclaration, plan: TypeImportMemberPlan): void {
    const existingIndex = targetType.fields.findIndex((candidate) => candidate.name === plan.conflictWith);
    if (plan.action === "replace" && existingIndex >= 0) {
      attachToOwner(targetType, field);
      targetType.fields.splice(existingIndex, 1, field);
      return;
    }
    attachToOwner(targetType, field);
    targetType.fields.push(field);
  }

  private applyMethodPlan(targetType: ClassDeclaration, method: MethodDeclaration, plan: TypeImportMemberPlan): void {
    const existingIndex = targetType.methods.findIndex((candidate) => signatureForMethod(candidate) === plan.conflictWith);
    if (plan.action === "replace" && existingIndex >= 0) {
      attachToOwner(targetType, method);
      targetType.methods.splice(existingIndex, 1, method);
      return;
    }
    attachToOwner(targetType, method);
    targetType.methods.push(method);
  }

  private applyConstructorPlan(targetType: ClassDeclaration, constructorDeclaration: ConstructorDeclaration, plan: TypeImportMemberPlan): void {
    const existingIndex = targetType.constructors.findIndex((candidate) => signatureForConstructor(candidate) === plan.conflictWith);
    if (plan.action === "replace" && existingIndex >= 0) {
      attachToOwner(targetType, constructorDeclaration);
      targetType.constructors.splice(existingIndex, 1, constructorDeclaration);
      return;
    }
    attachToOwner(targetType, constructorDeclaration);
    targetType.constructors.push(constructorDeclaration);
  }
}

export function createDefaultClassDeclaration(name: string, superType = "Object"): ClassDeclaration {
  assertValidIdentifier(name, "type name");
  return new ClassDeclaration(
    name,
    superType,
    null,
    null,
    [new ConstructorDeclaration(name, [], [])],
    [new MethodDeclaration("initialize", { type: "VoidTypeRef" }, [], [], false, null, AccessLevel.PUBLIC, false, false)],
    [new FieldDeclaration("enabled", simpleTypeRef("Boolean"), null, false, false)],
  );
}
