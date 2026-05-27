import {
  AbstractCode,
  AbstractDeclaration,
  AbstractNode,
  ClassDeclaration,
  NamedUserType,
  UserField,
  UserLocal,
  UserMethod,
  UserParameter,
  type Expression,
} from "../ast-nodes.js";

export type SearchKind = "type" | "method" | "field" | "parameter" | "local" | "expression";

export interface SearchQuery {
  readonly text?: string | readonly string[];
  readonly typeName?: string | null;
  readonly kinds?: readonly SearchKind[];
}

export interface SearchMatch<TNode extends AbstractNode = AbstractNode> {
  readonly node: TNode;
  readonly kind: SearchKind;
  readonly score: number;
  readonly enclosingDeclaration: AbstractDeclaration | null;
}

export interface ReferenceGroup {
  readonly declaration: AbstractDeclaration;
  readonly references: Expression[];
}

export interface Scope {
  readonly currentType: NamedUserType | ClassDeclaration | null;
  readonly currentCode: AbstractCode | null;
  readonly parameters: Map<string, UserParameter>;
  readonly locals: Map<string, UserLocal>;
}

export const EMPTY_SCOPE: Scope = {
  currentType: null,
  currentCode: null,
  parameters: new Map(),
  locals: new Map(),
};

export class SearchResult<TDeclaration extends AbstractDeclaration = AbstractDeclaration> {
  readonly references: Expression[] = [];

  constructor(public readonly declaration: TDeclaration) {}

  getName(): string {
    return this.declaration.name;
  }

  addReference(reference: Expression): void {
    this.references.push(reference);
  }
}

export function flattenRoots(root: AbstractNode | readonly AbstractNode[]): AbstractNode[] {
  return Array.isArray(root) ? Array.from(root) : [root as AbstractNode];
}

export function childScope(scope: Scope): Scope {
  return {
    currentType: scope.currentType,
    currentCode: scope.currentCode,
    parameters: new Map(scope.parameters),
    locals: new Map(scope.locals),
  };
}

export function normalizeTerms(text: string | readonly string[] | undefined): string[] {
  if (!text) return [];
  const rawTerms: readonly string[] = typeof text === "string" ? text.split(/\s+/u) : text;
  return rawTerms.map((term) => term.trim().toLowerCase()).filter((term) => term.length > 0);
}

export function matchesTerms(name: string, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const lowered = name.toLowerCase();
  return terms.every((term) => lowered.includes(term));
}

export function scoreName(name: string, terms: readonly string[]): number {
  if (terms.length === 0) return 0;
  const lowered = name.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (lowered === term) score -= 2;
    if (lowered.includes(term)) score -= 1;
    if (lowered.startsWith(term)) score -= 1;
  }
  return score;
}

export function declarationKind(declaration: AbstractDeclaration): SearchKind {
  if (declaration instanceof NamedUserType || declaration instanceof ClassDeclaration) return "type";
  if (declaration instanceof UserMethod) return "method";
  if (declaration instanceof UserField) return "field";
  if (declaration instanceof UserParameter) return "parameter";
  return "local";
}

export function matchesDeclarationType(declaration: AbstractDeclaration, typeName: string): boolean {
  if (declaration instanceof UserField) return declaration.fieldType.type === "SimpleTypeRef" && declaration.fieldType.name === typeName;
  if (declaration instanceof UserMethod) return declaration.returnType.type === "SimpleTypeRef" && declaration.returnType.name === typeName;
  if (declaration instanceof UserParameter) return declaration.paramType.type === "SimpleTypeRef" && declaration.paramType.name === typeName;
  if (declaration instanceof UserLocal) return declaration.valueType.type === "SimpleTypeRef" && declaration.valueType.name === typeName;
  return declaration.name === typeName;
}

export function isSupportedDeclaration(declaration: AbstractDeclaration): declaration is NamedUserType | ClassDeclaration | UserMethod | UserField | UserParameter | UserLocal {
  return declaration instanceof NamedUserType
    || declaration instanceof ClassDeclaration
    || declaration instanceof UserMethod
    || declaration instanceof UserField
    || declaration instanceof UserParameter
    || declaration instanceof UserLocal;
}

export function isExpression(node: AbstractNode): node is Expression {
  return typeof (node as Expression & { getType?: unknown }).getType === "function" && !(node instanceof AbstractDeclaration);
}
