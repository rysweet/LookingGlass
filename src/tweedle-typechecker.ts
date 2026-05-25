// ═══════════════════════════════════════════════════════════════════════════
// tweedle-typechecker.ts — Type resolution and assignability for Tweedle AST
//
// Provides: TypeEnvironment with resolveType, isAssignableTo, checkMethodCall.
// Pure computation, no I/O, no external dependencies.
// ═══════════════════════════════════════════════════════════════════════════

import type { ClassDecl, TypeRef, MethodDecl } from "./tweedle-parser.js";
import { createTweedleTypeAuthority } from "./type-system.js";
import type { AbstractType } from "./tweedle-type-system.js";

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

export function createTypeEnvironment(classes: ClassDecl[]): TypeEnvironment {
  let authority: ReturnType<typeof createTweedleTypeAuthority>;
  try {
    authority = createTweedleTypeAuthority(classes);
  } catch (error) {
    if (error instanceof Error && "typeName" in error && "detail" in error) {
      throw new TweedleTypeError(error.message, String((error as { typeName: unknown }).typeName), String((error as { detail: unknown }).detail));
    }
    throw error;
  }

  return {
    resolveType(name: string): ResolvedType | null {
      const type = authority.resolveType(name);
      return type ? toResolvedType(type) : null;
    },

    isAssignableTo(source: string, target: string): boolean {
      return authority.isAssignable(source, target);
    },

    checkMethodCall(
      className: string,
      methodName: string,
      argTypes: string[],
    ): MethodCallResult {
      const receiver = authority.resolveType(className);
      if (!receiver) {
        return {
          valid: false,
          errors: [`Unknown class '${className}'`],
          returnType: null,
        };
      }

      const errors: string[] = [];
      for (const argType of argTypes) {
        if (!authority.resolveType(argType)) {
          errors.push(`Unknown argument type '${argType}'`);
        }
      }
      if (errors.length > 0) {
        return { valid: false, errors, returnType: null };
      }

      const resolved = authority.resolveMethodDispatch(className, methodName, argTypes);
      if (!resolved) {
        if (!authority.hasMethodNamed(className, methodName)) {
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
