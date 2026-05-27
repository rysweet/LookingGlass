import {
  describeNode,
  elementsByTagName,
  extractResolvedTypeName,
  getPropertyNode,
  isKnownTypeName,
  normalizeTypeName,
  pushError,
  type ProjectValidationError,
  type ValidationContext,
} from "./shared.js";

interface TypeReferenceTarget {
  owner: Element;
  propertyName: string;
  node: Element;
  allowVoid?: boolean;
}

export function validateTypeReferences(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  for (const target of collectTypeReferenceTargets(context.doc, context.keyMap)) {
    const typeName = extractResolvedTypeName(target.node, context.keyMap);
    if (!typeName) {
      pushError(
        context,
        errors,
        target.node,
        "unresolved-type-reference",
        `${describeNode(target.owner)} ${target.propertyName} does not resolve to a type.`,
      );
      continue;
    }
    if (!target.allowVoid && normalizeTypeName(typeName) === "void") {
      pushError(
        context,
        errors,
        target.node,
        "unresolved-type-reference",
        `${describeNode(target.owner)} ${target.propertyName} cannot use void as a value type.`,
      );
      continue;
    }
    if (!isKnownTypeName(typeName, context)) {
      pushError(
        context,
        errors,
        target.node,
        "unresolved-type-reference",
        `${describeNode(target.owner)} ${target.propertyName} references unknown type ${typeName}.`,
      );
    }
  }
}

function collectTypeReferenceTargets(doc: Document, keyMap: Map<string, Element>): TypeReferenceTarget[] {
  const targets: TypeReferenceTarget[] = [];
  for (const node of elementsByTagName(doc, "node")) {
    const typeName = node.getAttribute("type") ?? "";
    if (typeName === "org.lgna.project.ast.NamedUserType") {
      const superType = getPropertyNode(node, "superType", keyMap);
      if (superType) {
        targets.push({ owner: node, propertyName: "superType", node: superType });
      }
      continue;
    }
    if (typeName === "org.lgna.project.ast.UserField" || typeName === "org.lgna.project.ast.UserParameter") {
      const valueType = getPropertyNode(node, "valueType", keyMap);
      if (valueType) {
        targets.push({ owner: node, propertyName: "valueType", node: valueType });
      }
      continue;
    }
    if (typeName === "org.lgna.project.ast.UserMethod") {
      const returnType = getPropertyNode(node, "returnType", keyMap);
      if (returnType) {
        targets.push({ owner: node, propertyName: "returnType", node: returnType, allowVoid: true });
      }
    }
  }
  return targets;
}

export function validateCircularHierarchies(
  context: ValidationContext,
  errors: ProjectValidationError[],
): void {
  const visited = new Set<string>();
  const stack: string[] = [];
  const active = new Set<string>();
  const reported = new Set<string>();

  const visit = (typeName: string): void => {
    if (visited.has(typeName)) {
      return;
    }
    const info = context.userTypes.get(typeName);
    if (!info) {
      return;
    }
    visited.add(typeName);
    active.add(typeName);
    stack.push(typeName);

    const parent = info.superTypeName;
    if (parent && context.userTypes.has(parent)) {
      if (active.has(parent)) {
        const startIndex = stack.indexOf(parent);
        const cycle = stack.slice(startIndex);
        const cycleLabel = [...cycle, parent].join(" -> ");
        for (const name of cycle) {
          if (reported.has(name)) {
            continue;
          }
          reported.add(name);
          pushError(
            context,
            errors,
            context.userTypes.get(name)?.node ?? info.node,
            "circular-type-hierarchy",
            `circular type hierarchy detected: ${cycleLabel}.`,
          );
        }
      } else {
        visit(parent);
      }
    }

    stack.pop();
    active.delete(typeName);
  };

  for (const typeName of context.userTypes.keys()) {
    visit(typeName);
  }
}
