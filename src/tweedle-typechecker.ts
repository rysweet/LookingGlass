// ═══════════════════════════════════════════════════════════════════════════
// tweedle-typechecker.ts — Type resolution and assignability for Tweedle AST
//
// Provides: TypeEnvironment with resolveType, isAssignableTo, checkMethodCall.
// Pure computation, no I/O, no external dependencies.
// ═══════════════════════════════════════════════════════════════════════════

import type { ClassDecl, TypeRef, MethodDecl } from "./tweedle-parser.js";

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

// ── Built-in Type Registry ───────────────────────────────────────────────

const PRIMITIVES = new Set(["DecimalNumber", "WholeNumber", "TextString", "Boolean"]);

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

// ── Factory ──────────────────────────────────────────────────────────────

export function createTypeEnvironment(classes: ClassDecl[]): TypeEnvironment {
  const registry = new Map<string, ResolvedType>();

  // Register primitives
  for (const name of PRIMITIVES) {
    registry.set(name, {
      name,
      superClass: null,
      isPrimitive: true,
      methods: [],
      classDecl: null,
    });
  }

  // Register built-in class hierarchy
  for (const entry of BUILTIN_HIERARCHY) {
    registry.set(entry.name, {
      name: entry.name,
      superClass: entry.superClass,
      isPrimitive: false,
      methods: [],
      classDecl: null,
    });
  }

  // Register user-defined classes — check for duplicates
  for (const cls of classes) {
    if (registry.has(cls.name)) {
      throw new TweedleTypeError(
        `Duplicate class name '${cls.name}'`,
        cls.name,
        "duplicate class",
      );
    }
    registry.set(cls.name, {
      name: cls.name,
      superClass: cls.superClass,
      isPrimitive: false,
      methods: cls.methods,
      classDecl: cls,
    });
  }

  // Detect inheritance cycles — skip already-verified prefixes
  const verified = new Set<string>();
  for (const cls of classes) {
    const visited = new Set<string>();
    let current: string | null = cls.name;
    while (current !== null && !verified.has(current)) {
      if (visited.has(current)) {
        throw new TweedleTypeError(
          `Inheritance cycle detected involving '${current}'`,
          current,
          "cycle",
        );
      }
      visited.add(current);
      const resolved = registry.get(current);
      current = resolved?.superClass ?? null;
    }
    for (const name of visited) verified.add(name);
  }

  // Pre-build inherited method maps: O(1) method lookup at call time
  const methodIndex = new Map<string, Map<string, MethodDecl>>();
  for (const [name] of registry) {
    const methods = new Map<string, MethodDecl>();
    const chain: string[] = [];
    let cur: string | null = name;
    while (cur !== null) {
      chain.push(cur);
      cur = registry.get(cur)?.superClass ?? null;
    }
    for (let i = chain.length - 1; i >= 0; i--) {
      const r = registry.get(chain[i]);
      if (r) {
        for (const m of r.methods) methods.set(m.name, m);
      }
    }
    methodIndex.set(name, methods);
  }

  const assignableCache = new Map<string, boolean>();

  function computeAssignable(source: string, target: string): boolean {
    if (source === "null") {
      const targetType = registry.get(target);
      if (!targetType) return false;
      return !targetType.isPrimitive;
    }
    if (source === "WholeNumber" && target === "DecimalNumber") return true;

    const sourceType = registry.get(source);
    if (!sourceType || sourceType.isPrimitive) return false;
    if (!registry.has(target)) return false;

    let current: string | null = sourceType.superClass;
    while (current !== null) {
      if (current === target) return true;
      current = registry.get(current)?.superClass ?? null;
    }
    return false;
  }

  return {
    resolveType(name: string): ResolvedType | null {
      return registry.get(name) ?? null;
    },

    isAssignableTo(source: string, target: string): boolean {
      if (source === target) return true;
      const key = `${source}\0${target}`;
      const cached = assignableCache.get(key);
      if (cached !== undefined) return cached;
      const result = computeAssignable(source, target);
      assignableCache.set(key, result);
      return result;
    },

    checkMethodCall(
      className: string,
      methodName: string,
      argTypes: string[],
    ): MethodCallResult {
      const classType = registry.get(className);
      if (!classType) {
        return {
          valid: false,
          errors: [`Unknown class '${className}'`],
          returnType: null,
        };
      }

      const method = methodIndex.get(className)?.get(methodName) ?? null;

      if (!method) {
        return {
          valid: false,
          errors: [`Method '${methodName}' not found on class '${className}'`],
          returnType: null,
        };
      }

      const errors: string[] = [];

      // Check argument count
      if (argTypes.length !== method.parameters.length) {
        errors.push(
          `Expected ${method.parameters.length} argument(s) for '${methodName}', got ${argTypes.length}`,
        );
        return { valid: false, errors, returnType: null };
      }

      // Check argument types
      for (let i = 0; i < argTypes.length; i++) {
        const param = method.parameters[i];
        const paramTypeName =
          param.paramType.type === "SimpleTypeRef"
            ? param.paramType.name
            : param.paramType.type === "VoidTypeRef"
              ? "void"
              : "unknown";

        if (!this.isAssignableTo(argTypes[i], paramTypeName)) {
          errors.push(
            `Argument ${i + 1}: '${argTypes[i]}' is not assignable to '${paramTypeName}'`,
          );
        }
      }

      if (errors.length > 0) {
        return { valid: false, errors, returnType: null };
      }

      return { valid: true, errors: [], returnType: method.returnType };
    },
  };
}
