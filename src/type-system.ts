import { createTypeHierarchy } from "./tweedle-type-system.js";
import type { TypeRef as AstTypeRef } from "./ast-nodes.js";
import type { ClassDecl, TypeRef as TweedleTypeRef } from "./tweedle-parser.js";
import type {
  AbstractType as HierarchyType,
  ResolvedMethod as HierarchyResolvedMethod,
} from "./tweedle-type-system.js";

export type AnyTypeRef = AstTypeRef | TweedleTypeRef;
export type AnyTypeInput = { name: string } | AnyTypeRef | string | null;

export interface AssignabilityAdapter<T> {
  resolveType(input: AnyTypeInput): T | null;
  getName(type: T): string;
  getSuperType(type: T): T | null;
  isPrimitive(type: T): boolean;
}

export interface TweedleTypeAuthority {
  resolveType(input: AnyTypeInput): HierarchyType | null;
  isAssignable(source: AnyTypeInput, target: AnyTypeInput): boolean;
  hasMethodNamed(receiver: AnyTypeInput, methodName: string): boolean;
  resolveMethodDispatch(
    receiver: AnyTypeInput,
    methodName: string,
    argTypes: AnyTypeInput[],
  ): HierarchyResolvedMethod | null;
}

const NUMERIC_TYPE_NAMES = new Set([
  "Number",
  "WholeNumber",
  "Integer",
  "Long",
  "Short",
  "Byte",
  "DecimalNumber",
  "Double",
  "Float",
]);

function isTypeRef(value: AnyTypeInput): value is AnyTypeRef {
  return typeof value === "object"
    && value !== null
    && "type" in value
    && (
      value.type === "SimpleTypeRef"
      || value.type === "VoidTypeRef"
      || value.type === "LambdaTypeRef"
    );
}

function typeRefArrayDimensions(typeRef: AnyTypeRef): number {
  if (typeRef.type !== "SimpleTypeRef") {
    return 0;
  }
  if ("arrayDimensions" in typeRef && typeof typeRef.arrayDimensions === "number") {
    return typeRef.arrayDimensions;
  }
  return typeRef.isArray ? 1 : 0;
}

function toFallbackTypeRef(input: AnyTypeInput): AnyTypeRef | null {
  if (input === null) {
    return null;
  }
  if (isTypeRef(input)) {
    return input;
  }

  const name = resolveTypeInputName(input);
  if (!name) {
    return null;
  }
  if (name === "void") {
    return { type: "VoidTypeRef" };
  }

  const arrayMatch = name.match(/^(.*?)(\[\])+$/);
  if (arrayMatch) {
    return {
      type: "SimpleTypeRef",
      name: arrayMatch[1],
      isArray: true,
      arrayDimensions: (name.match(/\[\]/g) ?? []).length,
    };
  }

  return { type: "SimpleTypeRef", name, isArray: false };
}

export function resolveTypeInputName(input: AnyTypeInput): string | null {
  if (input === null) {
    return null;
  }
  if (typeof input === "string") {
    return input;
  }
  if (isTypeRef(input)) {
    switch (input.type) {
      case "SimpleTypeRef":
        return `${input.name}${"[]".repeat(typeRefArrayDimensions(input))}`;
      case "VoidTypeRef":
        return "void";
      case "LambdaTypeRef":
        return input.raw;
    }
  }
  return typeof input.name === "string" ? input.name : null;
}

export function typeRefsAssignable(expected: AnyTypeRef | null, actual: AnyTypeRef | null): boolean {
  if (expected === null || actual === null) {
    return true;
  }
  if (expected.type === "VoidTypeRef" || actual.type === "VoidTypeRef") {
    return expected.type === actual.type;
  }
  if (expected.type === "LambdaTypeRef" || actual.type === "LambdaTypeRef") {
    return expected.type === actual.type && resolveTypeInputName(expected) === resolveTypeInputName(actual);
  }

  const expectedDimensions = typeRefArrayDimensions(expected);
  const actualDimensions = typeRefArrayDimensions(actual);
  if (expected.name === actual.name && expectedDimensions === actualDimensions) {
    return true;
  }
  if (expected.name === "Object" && expectedDimensions === 0) {
    return true;
  }
  return NUMERIC_TYPE_NAMES.has(expected.name)
    && NUMERIC_TYPE_NAMES.has(actual.name)
    && expectedDimensions === actualDimensions;
}

export function isTypeAssignable<T>(
  source: AnyTypeInput,
  target: AnyTypeInput,
  adapter: AssignabilityAdapter<T>,
): boolean {
  const sourceType = adapter.resolveType(source);
  const targetType = adapter.resolveType(target);
  if (!sourceType || !targetType) {
    return typeRefsAssignable(toFallbackTypeRef(target), toFallbackTypeRef(source));
  }

  const sourceName = adapter.getName(sourceType);
  const targetName = adapter.getName(targetType);
  if (sourceName === targetName) {
    return true;
  }
  if (sourceName === "null") {
    return !adapter.isPrimitive(targetType);
  }
  if (sourceName === "WholeNumber" && targetName === "DecimalNumber") {
    return true;
  }

  let current = adapter.getSuperType(sourceType);
  while (current) {
    if (adapter.getName(current) === targetName) {
      return true;
    }
    current = adapter.getSuperType(current);
  }
  return false;
}

export function createTweedleTypeAuthority(classes: ClassDecl[]): TweedleTypeAuthority {
  const hierarchy = createTypeHierarchy(classes);

  const resolveType = (input: AnyTypeInput): HierarchyType | null => {
    const name = resolveTypeInputName(input);
    return name ? hierarchy.resolve(name) : null;
  };

  const getSuperType = (type: HierarchyType): HierarchyType | null => {
    if (type.kind === "user" || type.kind === "java") {
      return type.superType;
    }
    return null;
  };

  const adapter: AssignabilityAdapter<HierarchyType> = {
    resolveType,
    getName: (type) => type.name,
    getSuperType,
    isPrimitive: (type) => type.kind === "primitive",
  };

  return {
    resolveType,
    isAssignable(source: AnyTypeInput, target: AnyTypeInput): boolean {
      return isTypeAssignable(source, target, adapter);
    },
    hasMethodNamed(receiver: AnyTypeInput, methodName: string): boolean {
      let current = resolveType(receiver);
      while (current) {
        if (current.kind === "user" && current.methods.some((method) => method.name === methodName)) {
          return true;
        }
        current = getSuperType(current);
      }
      return false;
    },
    resolveMethodDispatch(
      receiver: AnyTypeInput,
      methodName: string,
      argTypes: AnyTypeInput[],
    ): HierarchyResolvedMethod | null {
      const receiverType = resolveType(receiver);
      if (!receiverType) {
        return null;
      }
      const resolvedArgs: HierarchyType[] = [];
      for (const argType of argTypes) {
        const resolved = resolveType(argType);
        if (!resolved) {
          return null;
        }
        resolvedArgs.push(resolved);
      }
      return hierarchy.resolveMethod(receiverType, methodName, resolvedArgs);
    },
  };
}
