// ═══════════════════════════════════════════════════════════════════════════
// tweedle-typechecker.ts — Type resolution and assignability for Tweedle AST
//
// Provides: TypeEnvironment with resolveType, isAssignableTo, checkMethodCall.
// Pure computation, no I/O, no external dependencies.
// ═══════════════════════════════════════════════════════════════════════════

import type { ClassDecl, TypeRef, MethodDecl } from "./tweedle-parser.js";
import {
  createTypeHierarchy,
  type AbstractType,
  type UserType,
} from "./tweedle-type-system.js";

// ── Error Class ──────────────────────────────────────────────────────────

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

// ── Public Types ─────────────────────────────────────────────────────────

export interface ResolvedType {
  name: string;
  superClass: string | null;
  isPrimitive: boolean;
  methods: MethodDecl[];
  classDecl: ClassDecl | null;
}

export interface MethodCallResult {
  valid: boolean;
  errors: string[];
  returnType: TypeRef | null;
}

export interface TypeEnvironment {
  resolveType(name: string): ResolvedType | null;
  isAssignableTo(source: string, target: string): boolean;
  checkMethodCall(
    className: string,
    methodName: string,
    argTypes: string[],
  ): MethodCallResult;
}

// ── Factory ──────────────────────────────────────────────────────────────

function toResolvedType(type: AbstractType): ResolvedType {
  return {
    name: type.name,
    superClass: (type.kind === "java" || type.kind === "user") ? type.superType?.name ?? null : null,
    isPrimitive: type.kind === "primitive",
    methods: type.kind === "user" ? type.methods : [],
    classDecl: type.kind === "user" ? type.classDecl : null,
  };
}

function hasMethodNamed(receiver: AbstractType, methodName: string): boolean {
  for (const type of receiver.kind === "user" || receiver.kind === "java" ? [receiver, ...collectSupertypes(receiver)] : [receiver]) {
    if (type.kind === "user" && type.methods.some((method) => method.name === methodName)) {
      return true;
    }
  }
  return false;
}

function collectSupertypes(type: UserType | AbstractType): AbstractType[] {
  if (type.kind !== "user" && type.kind !== "java") {
    return [];
  }
  const chain: AbstractType[] = [];
  let current: AbstractType | null = type.superType;
  while (current) {
    chain.push(current);
    current = current.kind === "user" || current.kind === "java" ? current.superType : null;
  }
  return chain;
}

export function createTypeEnvironment(classes: ClassDecl[]): TypeEnvironment {
  let hierarchy: ReturnType<typeof createTypeHierarchy>;
  try {
    hierarchy = createTypeHierarchy(classes);
  } catch (error) {
    if (error instanceof Error && "typeName" in error && "detail" in error) {
      throw new TweedleTypeError(error.message, String((error as { typeName: unknown }).typeName), String((error as { detail: unknown }).detail));
    }
    throw error;
  }

  return {
    resolveType(name: string): ResolvedType | null {
      const type = hierarchy.resolve(name);
      return type ? toResolvedType(type) : null;
    },

    isAssignableTo(source: string, target: string): boolean {
      const sourceType = hierarchy.resolve(source);
      const targetType = hierarchy.resolve(target);
      return !!sourceType && !!targetType && hierarchy.isAssignableTo(sourceType, targetType);
    },

    checkMethodCall(
      className: string,
      methodName: string,
      argTypes: string[],
    ): MethodCallResult {
      const receiver = hierarchy.resolve(className);
      if (!receiver) {
        return {
          valid: false,
          errors: [`Unknown class '${className}'`],
          returnType: null,
        };
      }

      const resolvedArgs: AbstractType[] = [];
      const errors: string[] = [];
      for (const argType of argTypes) {
        const resolvedArg = hierarchy.resolve(argType);
        if (!resolvedArg) {
          errors.push(`Unknown argument type '${argType}'`);
        } else {
          resolvedArgs.push(resolvedArg);
        }
      }
      if (errors.length > 0) {
        return { valid: false, errors, returnType: null };
      }

      const resolved = hierarchy.resolveMethod(receiver, methodName, resolvedArgs);
      if (!resolved) {
        if (!hasMethodNamed(receiver, methodName)) {
          return {
            valid: false,
            errors: [`Method '${methodName}' not found on class '${className}'`],
            returnType: null,
          };
        }
        return {
          valid: false,
          errors: [`No overload of '${methodName}' on '${className}' accepts (${argTypes.join(", ")})`],
          returnType: null,
        };
      }

      return { valid: true, errors: [], returnType: resolved.method.returnType };
    },
  };
}
