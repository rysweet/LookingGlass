export type NamingConvention = "method" | "field" | "type" | "parameter";

export interface CollisionOptions {
  readonly caseSensitive?: boolean;
  readonly startAt?: number;
}

export interface IdentifierSuggestionOptions {
  readonly convention?: NamingConvention;
  readonly existingNames?: Iterable<string>;
  readonly fallback?: string;
  readonly caseSensitiveCollisions?: boolean;
}

const JAVA_KEYWORDS = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "true",
  "false",
  "null",
]);

function capitalize(value: string): string {
  return value.length > 0 ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value;
}

function decapitalize(value: string): string {
  return value.length > 0 ? `${value[0]!.toLowerCase()}${value.slice(1)}` : value;
}

function splitWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
}

function defaultIdentifier(convention: NamingConvention): string {
  switch (convention) {
    case "method":
      return "method";
    case "field":
      return "field";
    case "type":
      return "GeneratedType";
    case "parameter":
      return "value";
  }
}

function ensureIdentifierStart(value: string, fallback: string): string {
  if (value.length === 0) {
    return fallback;
  }
  return /^[A-Za-z_$]/.test(value) ? value : `_${value}`;
}

function avoidKeyword(value: string, convention: NamingConvention): string {
  if (!JAVA_KEYWORDS.has(value)) {
    return value;
  }
  return convention === "type" ? `${capitalize(value)}Type` : `${value}Value`;
}

export function isValidIdentifierName(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) && !JAVA_KEYWORDS.has(value);
}

export function toCamelCase(value: string, fallback = "value"): string {
  const words = splitWords(value);
  if (words.length === 0) {
    return fallback;
  }
  return `${words[0]!}${words.slice(1).map(capitalize).join("")}`;
}

export function toPascalCase(value: string, fallback = "GeneratedType"): string {
  const words = splitWords(value);
  if (words.length === 0) {
    return fallback;
  }
  return words.map(capitalize).join("");
}

export function applyNamingConvention(value: string, convention: NamingConvention): string {
  const fallback = defaultIdentifier(convention);
  const cased = convention === "type" ? toPascalCase(value, fallback) : toCamelCase(value, fallback);
  const withValidStart = ensureIdentifierStart(cased, fallback);
  return avoidKeyword(withValidStart, convention);
}

export function resolveNameCollision(
  candidate: string,
  existingNames: Iterable<string>,
  options: CollisionOptions = {},
): string {
  const caseSensitive = options.caseSensitive ?? true;
  const startAt = options.startAt ?? 2;
  const normalize = (value: string): string => (caseSensitive ? value : value.toLowerCase());
  const used = new Set(Array.from(existingNames, normalize));
  if (!used.has(normalize(candidate))) {
    return candidate;
  }

  let suffix = startAt;
  while (used.has(normalize(`${candidate}${suffix}`))) {
    suffix += 1;
  }
  return `${candidate}${suffix}`;
}

export function sanitizeJavaIdentifier(value: string, fallback: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_]/g, "_");
  const base = cleaned.length > 0 ? cleaned : fallback;
  const withPrefix = /^[A-Za-z_]/.test(base) ? base : `_${base}`;
  return JAVA_KEYWORDS.has(withPrefix) ? `${withPrefix}_` : withPrefix;
}

export function sanitizePackageName(packageName: string): string {
  return packageName
    .split(".")
    .map((segment, index) => {
      const candidate = applyNamingConvention(segment, "field").toLowerCase();
      return candidate.length > 0 ? candidate : index === 0 ? "alice" : "pkg";
    })
    .join(".");
}

export class IdentifierNameGenerator {
  static readonly SINGLETON = new IdentifierNameGenerator();

  convertConstantNameToMethodName(constantName: string, prefix: string | null = null): string {
    let result = prefix ?? "";
    let isUpperNext = result.length > 0;
    for (const character of constantName) {
      if (character === "_") {
        isUpperNext = true;
      } else {
        result += isUpperNext ? character : character.toLowerCase();
        isUpperNext = false;
      }
    }
    return result;
  }

  createIdentifierNameFromClassName(className: string | null): string | null {
    return className === null ? null : decapitalize(className);
  }

  suggestIdentifierName(value: string, options: IdentifierSuggestionOptions = {}): string {
    const convention = options.convention ?? "field";
    const fallback = options.fallback ?? defaultIdentifier(convention);
    const candidate = applyNamingConvention(value.length > 0 ? value : fallback, convention);
    const validCandidate = isValidIdentifierName(candidate)
      ? candidate
      : sanitizeJavaIdentifier(candidate, fallback);
    return resolveNameCollision(validCandidate, options.existingNames ?? [], {
      caseSensitive: options.caseSensitiveCollisions ?? true,
    });
  }

  suggestMethodName(value: string, existingNames: Iterable<string> = []): string {
    return this.suggestIdentifierName(value, {
      convention: "method",
      existingNames,
      fallback: "method",
    });
  }

  suggestFieldName(value: string, existingNames: Iterable<string> = []): string {
    return this.suggestIdentifierName(value, {
      convention: "field",
      existingNames,
      fallback: "field",
    });
  }

  suggestTypeName(value: string, existingNames: Iterable<string> = []): string {
    return this.suggestIdentifierName(value, {
      convention: "type",
      existingNames,
      fallback: "GeneratedType",
    });
  }

  suggestParameterName(value: string, existingNames: Iterable<string> = []): string {
    return this.suggestIdentifierName(value, {
      convention: "parameter",
      existingNames,
      fallback: "value",
    });
  }
}

export const identifierNameGenerator = IdentifierNameGenerator.SINGLETON;
