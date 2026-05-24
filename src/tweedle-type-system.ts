// ═══════════════════════════════════════════════════════════════════════════
// tweedle-type-system.ts — Full type hierarchy with assignability checks
//
// Provides: TypeHierarchy with discriminated-union type nodes (AbstractType),
// assignability, and overload-aware method resolution.
// Pure computation, no I/O, no external dependencies beyond tweedle-parser.
// ═══════════════════════════════════════════════════════════════════════════

import type { ClassDecl, FieldDecl, MethodDecl, Parameter, TypeRef } from "./tweedle-parser.js";

export class TweedleTypeError extends Error {
  constructor(
    message: string,
    public readonly typeName: string,
    public readonly detail: string,
  ) {
    super(message);
    this.name = "TweedleTypeError";
  }
}

export type TypeKind = "primitive" | "java" | "user" | "array" | "type_parameter";

export interface PrimitiveType {
  readonly kind: "primitive";
  readonly name: string;
  isAssignableTo(target: AbstractType): boolean;
}

export interface JavaType {
  readonly kind: "java";
  readonly name: string;
  readonly superType: JavaType | null;
  isAssignableTo(target: AbstractType): boolean;
}

export interface UserType {
  readonly kind: "user";
  readonly name: string;
  readonly superType: JavaType | UserType | null;
  readonly classDecl: ClassDecl;
  readonly methods: MethodDecl[];
  readonly fields: FieldDecl[];
  readonly enumValues?: readonly string[];
  readonly typeParameters?: readonly string[];
  isAssignableTo(target: AbstractType): boolean;
}

export interface ArrayType {
  readonly kind: "array";
  readonly name: string;
  readonly elementType: AbstractType;
  readonly dimensionCount: number;
  readonly superType: JavaType | null;
  isAssignableTo(target: AbstractType): boolean;
}

export interface TypeParameterType {
  readonly kind: "type_parameter";
  readonly name: string;
  readonly scope: "class" | "method";
  isAssignableTo(target: AbstractType): boolean;
}

export type AbstractType = PrimitiveType | JavaType | UserType | ArrayType | TypeParameterType;

export interface ResolvedMethod {
  readonly method: MethodDecl;
  readonly ownerType: UserType;
  readonly score: number;
  readonly usesVarArgs: boolean;
  readonly usesDefaultValues: boolean;
}

export interface TypeHierarchy {
  resolve(name: string): AbstractType | null;
  allTypes(): AbstractType[];
  isAssignableTo(source: AbstractType, target: AbstractType): boolean;
  supertypesOf(type: AbstractType): AbstractType[];
  resolveMethod(receiver: AbstractType, methodName: string, argTypes: AbstractType[]): ResolvedMethod | null;
}

const PRIMITIVE_NAMES = new Set([
  "DecimalNumber",
  "WholeNumber",
  "TextString",
  "Boolean",
]);

interface BuiltinEntry {
  name: string;
  superClass: string | null;
}

const BUILTIN_HIERARCHY: BuiltinEntry[] = [
  { name: "SThing", superClass: null },
  { name: "SGround", superClass: "SThing" },
  { name: "SScene", superClass: "SThing" },
  { name: "STurnable", superClass: "SThing" },
  { name: "SMovableTurnable", superClass: "STurnable" },
  { name: "SCamera", superClass: "SMovableTurnable" },
  { name: "SModel", superClass: "SMovableTurnable" },
  { name: "SJointedModel", superClass: "SModel" },
  { name: "SBiped", superClass: "SJointedModel" },
  { name: "SFlyer", superClass: "SJointedModel" },
  { name: "SQuadruped", superClass: "SJointedModel" },
  { name: "SProp", superClass: "SJointedModel" },
];

export function createTypeHierarchy(classes: ClassDecl[]): TypeHierarchy {
  const typeMap = new Map<string, AbstractType>();
  const arrayTypeCache = new Map<string, ArrayType>();
  const publicTypes: AbstractType[] = [];

  for (const name of PRIMITIVE_NAMES) {
    const primitive: PrimitiveType = {
      kind: "primitive",
      name,
      isAssignableTo: null!,
    };
    typeMap.set(name, primitive);
    publicTypes.push(primitive);
  }

  for (const entry of BUILTIN_HIERARCHY) {
    const javaType: JavaType = {
      kind: "java",
      name: entry.name,
      superType: null!,
      isAssignableTo: null!,
    };
    typeMap.set(entry.name, javaType);
    publicTypes.push(javaType);
  }

  for (const entry of BUILTIN_HIERARCHY) {
    (typeMap.get(entry.name) as JavaType & { superType: JavaType | null }).superType =
      entry.superClass ? (typeMap.get(entry.superClass) as JavaType) : null;
  }

  const nullType: JavaType = {
    kind: "java",
    name: "null",
    superType: null,
    isAssignableTo: null!,
  };
  typeMap.set("null", nullType);

  for (const cls of classes) {
    if (typeMap.has(cls.name)) {
      throw new TweedleTypeError(`Type '${cls.name}' is already defined`, cls.name, "duplicate class");
    }
    const userType: UserType = {
      kind: "user",
      name: cls.name,
      superType: null!,
      classDecl: cls,
      methods: cls.methods,
      fields: cls.fields,
      enumValues: cls.enumValues?.map((value) => value.name) ?? undefined,
      typeParameters: cls.typeParameters,
      isAssignableTo: null!,
    };
    typeMap.set(cls.name, userType);
    publicTypes.push(userType);
  }

  const verified = new Set<string>();
  for (const cls of classes) {
    const visited = new Set<string>();
    let current: string | null = cls.name;
    while (current !== null && !verified.has(current)) {
      if (visited.has(current)) {
        throw new TweedleTypeError(`Inheritance cycle detected involving '${current}'`, current, "cycle");
      }
      visited.add(current);
      const currentType = typeMap.get(current);
      if (!currentType) {
        break;
      }
      current = currentType.kind === "user" ? currentType.classDecl.superClass : null;
    }
    for (const name of visited) {
      verified.add(name);
    }
  }

  for (const cls of classes) {
    if (!cls.superClass) {
      (typeMap.get(cls.name) as UserType & { superType: JavaType | UserType | null }).superType = null;
      continue;
    }
    const parent = typeMap.get(cls.superClass);
    if (!parent || parent.kind === "primitive" || parent.kind === "array" || parent.kind === "type_parameter") {
      throw new TweedleTypeError(
        `Unknown superclass '${cls.superClass}' for '${cls.name}'`,
        cls.name,
        "unknown superclass",
      );
    }
    (typeMap.get(cls.name) as UserType & { superType: JavaType | UserType | null }).superType = parent;
  }

  function resolveNamedType(name: string): AbstractType | null {
    const existing = typeMap.get(name);
    if (existing) {
      return existing;
    }
    const arrayMatch = name.match(/^(.*?)(\[\])+$/);
    if (!arrayMatch) {
      return null;
    }
    const elementName = name.replace(/(\[\])+$/, "");
    const dimensionCount = (name.match(/\[\]/g) ?? []).length;
    const cacheKey = `${elementName}:${dimensionCount}`;
    const cached = arrayTypeCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const elementType = resolveNamedType(elementName);
    if (!elementType) {
      return null;
    }
    const arrayType: ArrayType = {
      kind: "array",
      name,
      elementType,
      dimensionCount,
      superType: null,
      isAssignableTo: null!,
    };
    (arrayType as ArrayType & { isAssignableTo: (target: AbstractType) => boolean }).isAssignableTo =
      (target: AbstractType) => hierarchyIsAssignableTo(arrayType, target);
    arrayTypeCache.set(cacheKey, arrayType);
    return arrayType;
  }

  function resolveTypeParameter(ownerType: UserType | null, method: MethodDecl | null, name: string): AbstractType | null {
    if (method?.typeParameters?.includes(name)) {
      const typeParameter: TypeParameterType = { kind: "type_parameter", name, scope: "method", isAssignableTo: null! };
      (typeParameter as TypeParameterType & { isAssignableTo: (target: AbstractType) => boolean }).isAssignableTo =
        (target: AbstractType) => hierarchyIsAssignableTo(typeParameter, target);
      return typeParameter;
    }
    if (ownerType?.typeParameters?.includes(name)) {
      const typeParameter: TypeParameterType = { kind: "type_parameter", name, scope: "class", isAssignableTo: null! };
      (typeParameter as TypeParameterType & { isAssignableTo: (target: AbstractType) => boolean }).isAssignableTo =
        (target: AbstractType) => hierarchyIsAssignableTo(typeParameter, target);
      return typeParameter;
    }
    return null;
  }

  function hierarchyIsAssignableTo(source: AbstractType, target: AbstractType): boolean {
    if (source === target) {
      return true;
    }
    if (source.name === "null") {
      return target.kind !== "primitive";
    }
    if (target.kind === "type_parameter" || source.kind === "type_parameter") {
      return true;
    }
    if (source.name === "WholeNumber" && target.name === "DecimalNumber") {
      return true;
    }
    if (source.kind === "array" || target.kind === "array") {
      if (source.kind !== "array" || target.kind !== "array") {
        return false;
      }
      return source.dimensionCount === target.dimensionCount
        && hierarchyIsAssignableTo(source.elementType, target.elementType);
    }
    if (source.kind === "primitive") {
      return false;
    }
    let current: JavaType | UserType | null = source.superType;
    while (current) {
      if (current === target) {
        return true;
      }
      current = current.superType;
    }
    return false;
  }

  for (const type of typeMap.values()) {
    (type as AbstractType & { isAssignableTo: (target: AbstractType) => boolean }).isAssignableTo =
      (target: AbstractType) => hierarchyIsAssignableTo(type, target);
  }

  function supertypesOf(type: AbstractType): AbstractType[] {
    if (type.kind === "primitive") {
      return type.name === "WholeNumber" ? [type, resolveNamedType("DecimalNumber")!] : [type];
    }
    if (type.kind === "array" || type.kind === "type_parameter") {
      return [type];
    }

    const chain: AbstractType[] = [];
    let current: JavaType | UserType | null = type;
    while (current) {
      chain.push(current);
      current = current.superType;
    }
    return chain;
  }

  function resolveTypeRef(typeRef: TypeRef, ownerType: UserType | null = null, method: MethodDecl | null = null): AbstractType | null {
    if (typeRef.type !== "SimpleTypeRef") {
      return null;
    }
    const genericParameter = resolveTypeParameter(ownerType, method, typeRef.name);
    if (genericParameter) {
      return genericParameter;
    }
    const dimensions = typeRef.arrayDimensions ?? (typeRef.isArray ? 1 : 0);
    const baseName = typeRef.name;
    return resolveNamedType(`${baseName}${"[]".repeat(dimensions)}`);
  }

  function parameterBounds(parameters: Parameter[]): { minimum: number; maximum: number } {
    let minimum = 0;
    let maximum = parameters.length;
    let hasVarArgs = false;

    for (const parameter of parameters) {
      if (parameter.isVarArgs) {
        hasVarArgs = true;
      } else if (!parameter.defaultValue) {
        minimum += 1;
      }
    }

    if (hasVarArgs) {
      maximum = Number.POSITIVE_INFINITY;
    }

    return { minimum, maximum };
  }

  function inheritanceDistance(source: AbstractType, target: AbstractType): number {
    if (source === target) {
      return 0;
    }
    if (target.kind === "type_parameter") {
      return 3;
    }
    if (source.name === "WholeNumber" && target.name === "DecimalNumber") {
      return 1;
    }
    if (source.name === "null") {
      return target.kind === "primitive" ? Number.POSITIVE_INFINITY : 2;
    }
    if (!hierarchyIsAssignableTo(source, target)) {
      return Number.POSITIVE_INFINITY;
    }
    if (source.kind === "array" && target.kind === "array") {
      return source.dimensionCount === target.dimensionCount
        ? inheritanceDistance(source.elementType, target.elementType) + 1
        : Number.POSITIVE_INFINITY;
    }
    if (source.kind === "primitive" || source.kind === "type_parameter") {
      return Number.POSITIVE_INFINITY;
    }

    let distance = 1;
    let current: JavaType | UserType | null = source.superType;
    while (current) {
      if (current === target) {
        return distance;
      }
      distance += 1;
      current = current.superType;
    }
    return Number.POSITIVE_INFINITY;
  }

  function resolveMethod(receiver: AbstractType, methodName: string, argTypes: AbstractType[]): ResolvedMethod | null {
    const owners = supertypesOf(receiver).filter((type): type is UserType => type.kind === "user");
    const candidates: ResolvedMethod[] = [];

    owners.forEach((ownerType, ownerDepth) => {
      for (const method of ownerType.methods) {
        if (method.name !== methodName) {
          continue;
        }

        const bounds = parameterBounds(method.parameters);
        if (argTypes.length < bounds.minimum || argTypes.length > bounds.maximum) {
          continue;
        }

        let score = ownerDepth * 100;
        let valid = true;
        let usesVarArgs = false;
        let usesDefaultValues = false;

        for (let index = 0; index < argTypes.length; index++) {
          const directParameter = method.parameters[index];
          const parameter = directParameter ?? method.parameters[method.parameters.length - 1];
          if (!parameter) {
            valid = false;
            break;
          }

          if (parameter.isVarArgs && index >= method.parameters.length - 1) {
            usesVarArgs = true;
          }

          const parameterType = resolveTypeRef(parameter.paramType, ownerType, method);
          if (!parameterType) {
            valid = false;
            break;
          }

          const distance = inheritanceDistance(argTypes[index], parameterType);
          if (!Number.isFinite(distance)) {
            valid = false;
            break;
          }
          score += distance;
        }

        if (!valid) {
          continue;
        }

        if (argTypes.length < method.parameters.length) {
          for (let index = argTypes.length; index < method.parameters.length; index++) {
            const parameter = method.parameters[index];
            if (parameter.isVarArgs) {
              usesVarArgs = true;
              continue;
            }
            if (!parameter.defaultValue) {
              valid = false;
              break;
            }
            usesDefaultValues = true;
            score += 2;
          }
        }

        if (!valid) {
          continue;
        }

        if (usesVarArgs) {
          score += 4;
        }

        candidates.push({ method, ownerType, score, usesVarArgs, usesDefaultValues });
      }
    });

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((left, right) => left.score - right.score);
    const [best, second] = candidates;
    if (second && second.score === best.score) {
      return null;
    }
    return best;
  }

  return {
    resolve(name: string): AbstractType | null {
      return resolveNamedType(name);
    },
    allTypes(): AbstractType[] {
      return [...publicTypes];
    },
    isAssignableTo: hierarchyIsAssignableTo,
    supertypesOf,
    resolveMethod,
  };
}
