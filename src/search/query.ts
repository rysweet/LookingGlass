import { AbstractDeclaration, AbstractNode, ClassDeclaration, NamedUserType, type Expression } from "../ast-nodes.js";
import { UsageTracker } from "./usage-tracker.js";
import {
  declarationKind,
  flattenRoots,
  isExpression,
  matchesDeclarationType,
  matchesTerms,
  normalizeTerms,
  scoreName,
  type SearchMatch,
  type SearchQuery,
} from "./shared.js";

export function queryAst<TNode extends AbstractNode = AbstractNode>(
  root: AbstractNode | readonly AbstractNode[],
  predicate: (node: AbstractNode) => node is TNode,
): TNode[];
export function queryAst(
  root: AbstractNode | readonly AbstractNode[],
  predicate: (node: AbstractNode) => boolean,
): AbstractNode[];
export function queryAst(
  root: AbstractNode | readonly AbstractNode[],
  predicate: (node: AbstractNode) => boolean,
): AbstractNode[] {
  const matches: AbstractNode[] = [];
  const seen = new Set<string>();
  for (const node of flattenRoots(root)) {
    node.traverse((candidate) => {
      if (!predicate(candidate) || seen.has(candidate.id)) return;
      seen.add(candidate.id);
      matches.push(candidate);
    });
  }
  return matches;
}

export function searchAst(root: AbstractNode | readonly AbstractNode[], query: SearchQuery): SearchMatch[] {
  const tracker = new UsageTracker(root);
  const matches: SearchMatch[] = [];
  const terms = normalizeTerms(query.text);
  const allowedKinds = query.kinds ? new Set(query.kinds) : null;

  for (const declaration of tracker.listDeclarations()) {
    const kind = declarationKind(declaration);
    if (allowedKinds && !allowedKinds.has(kind)) continue;
    if (terms.length > 0 && !matchesTerms(declaration.name, terms)) continue;
    if (query.typeName && !matchesDeclarationType(declaration, query.typeName)) continue;
    matches.push({
      node: declaration,
      kind,
      score: scoreName(declaration.name, terms) - tracker.findReferences(declaration).references.length / 10,
      enclosingDeclaration: declaration.getFirstAncestorAssignableTo(AbstractDeclaration),
    });
  }

  if (query.typeName) {
    for (const expression of queryAst(root, (node): node is Expression => isExpression(node))) {
      const expressionType = expression.getType();
      const expressionTypeName = expressionType?.type === "SimpleTypeRef" ? expressionType.name : null;
      if (expressionTypeName !== query.typeName) continue;
      if (allowedKinds && !allowedKinds.has("expression")) continue;
      matches.push({ node: expression, kind: "expression", score: 0, enclosingDeclaration: expression.getFirstAncestorAssignableTo(AbstractDeclaration) });
    }
  }

  return matches.sort((left, right) => left.score - right.score);
}

export function searchByType(root: AbstractNode | readonly AbstractNode[], typeName: string): SearchMatch[] {
  return searchAst(root, { typeName, kinds: ["type", "method", "field", "parameter", "local", "expression"] });
}
