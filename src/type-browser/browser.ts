import { AbstractType, ClassDeclaration, JavaType, type TypeRef } from "../ast-nodes.js";
import { isTypeAssignable, resolveTypeInputName } from "../type-system.js";
import { ImportTypeWizard } from "./import-wizard.js";
import {
  assertValidIdentifier,
  attachToOwner,
  cloneTypeRef,
  defaultTypes,
  signatureForConstructor,
  signatureForMethod,
  typeRefToString,
  type TypeHierarchyNode,
  type TypeMemberDescriptor,
  type TypeSearchOptions,
  TypeBrowserError,
} from "./shared.js";

function signatureForField(field: { name: string }): string {
  return field.name;
}

function toTypeName(type: ClassDeclaration | AbstractType | TypeRef | string | null): string | null {
  return resolveTypeInputName(type);
}

export class TypeBrowser {
  private readonly userTypes = new Map<string, ClassDeclaration>();
  private readonly builtinTypes = new Map<string, AbstractType>();

  constructor(types: ClassDeclaration[] = [], builtins: AbstractType[] = defaultTypes()) {
    for (const builtin of builtins) this.builtinTypes.set(builtin.name, builtin);
    for (const type of types) this.registerType(type);
  }

  allTypes(includeBuiltins = true): AbstractType[] {
    const types = includeBuiltins ? [...this.builtinTypes.values(), ...this.userTypes.values()] : [...this.userTypes.values()];
    return [...types].sort((left, right) => left.name.localeCompare(right.name)) as AbstractType[];
  }

  resolveType(nameOrType: ClassDeclaration | AbstractType | TypeRef | string | null): AbstractType | null {
    const name = toTypeName(nameOrType);
    if (!name) return null;
    return (this.userTypes.get(name) as unknown as AbstractType | undefined) ?? this.builtinTypes.get(name) ?? JavaType.getInstance(name);
  }

  registerType(type: ClassDeclaration): void {
    assertValidIdentifier(type.name, "type name");
    if (this.userTypes.has(type.name) || this.builtinTypes.has(type.name)) {
      throw new TypeBrowserError(`type \"${type.name}\" already exists`);
    }
    attachToOwner(null, type);
    this.userTypes.set(type.name, type);
  }

  unregisterType(name: string): boolean { return this.userTypes.delete(name); }

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
      if (desiredType && !this.isAssignable(type, desiredType)) return false;
      return !query || type.name.toLowerCase().includes(query);
    });
  }

  isAssignable(source: ClassDeclaration | AbstractType | TypeRef | string | null, target: ClassDeclaration | AbstractType | TypeRef | string | null): boolean {
    return isTypeAssignable(source, target, {
      resolveType: (input) => this.resolveType(input as ClassDeclaration | AbstractType | TypeRef | string | null),
      getName: (type) => type.name,
      getSuperType: (type) => this.getResolvedSuperType(type),
      isPrimitive: (type) => type.isPrimitive(),
    });
  }

  getResolvedSuperType(type: AbstractType | null): AbstractType | null {
    if (!type) return null;
    if (type instanceof ClassDeclaration) {
      return type.superClass ? this.resolveType(type.superClass) : null;
    }
    const superType = type.getSuperType();
    return superType ? this.resolveType(superType.name) ?? superType : null;
  }

  listHierarchy(rootName?: string): TypeHierarchyNode[] {
    const types = this.allTypes(true);
    const includedNames = rootName ? new Set(this.collectDescendantNames(this.resolveType(rootName))) : new Set(types.map((type) => type.name));
    const nodes = new Map<string, TypeHierarchyNode>();
    for (const type of types) {
      if (includedNames.has(type.name)) nodes.set(type.name, { type, depth: 0, children: [] });
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
    for (const root of roots) sortNode(root);
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
        if (visited.has(key)) continue;
        visited.add(key);
        results.push({
          kind: "constructor",
          name: constructorDeclaration.name,
          ownerType: current.name,
          inherited,
          declaration: constructorDeclaration,
          returnType: { type: "SimpleTypeRef", name: current.name, isArray: false },
          parameterTypes: constructorDeclaration.parameters.map((parameter) => cloneTypeRef(parameter.paramType)),
        });
      }
      for (const field of current.getDeclaredFields()) {
        const key = `field:${signatureForField(field)}`;
        if (visited.has(key)) continue;
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
      for (const method of current.getDeclaredMethods()) {
        const key = `method:${signatureForMethod(method)}`;
        if (visited.has(key)) continue;
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
      current = includeInherited ? this.getResolvedSuperType(current) : null;
    }
    return results;
  }

  createImportWizard(importedType: ClassDeclaration): ImportTypeWizard {
    return new ImportTypeWizard(this, importedType);
  }

  private collectDescendantNames(root: AbstractType | null): string[] {
    if (!root) return [];
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
