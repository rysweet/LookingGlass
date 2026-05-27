import {
  ClassDeclaration,
  FieldAccess,
  IdentifierExpression,
  InstanceCreation,
  InstanceOfExpression,
  MethodInvocation,
  NamedUserType,
  NewArrayExpression,
  NewInstanceExpression,
  ResourceExpression,
  ReturnStatement,
  SuperExpression,
  ThisExpression,
  TypeCastExpression,
  TypeExpression,
  TypeLiteral,
  UserField,
  UserLocal,
  UserMethod,
  UserParameter,
  type AbstractDeclaration,
  type TypeRef,
} from "../ast-nodes.js";
import { UsageTracker } from "../search.js";
import { assertValidIdentifier } from "../type-browser.js";
import type { RenameResult } from "./types.js";

export function renameDeclaration(
  root: NamedUserType | ClassDeclaration,
  declaration: AbstractDeclaration,
  nextName: string,
): RenameResult {
  assertValidIdentifier(nextName, "new name");
  const previousName = declaration.name;
  if (previousName === nextName) {
    return { declaration, previousName, nextName, referenceCount: 0, typeReferenceCount: 0 };
  }

  const tracker = new UsageTracker(root);
  let referenceCount = 0;
  let typeReferenceCount = 0;

  for (const reference of tracker.findReferences(declaration).references) {
    if (reference instanceof MethodInvocation) {
      reference.methodName = nextName;
      if (reference.method) {
        reference.method.name = nextName;
      }
      referenceCount += 1;
      continue;
    }
    if (reference instanceof FieldAccess) {
      reference.memberName = nextName;
      if (reference.field) {
        reference.field.name = nextName;
      }
      referenceCount += 1;
      continue;
    }
    if (reference instanceof IdentifierExpression) {
      reference.name = nextName;
      referenceCount += 1;
    }
  }

  if (declaration instanceof NamedUserType || declaration instanceof ClassDeclaration) {
    typeReferenceCount = renameTypeReferences(root, previousName, nextName);
  }

  declaration.name = nextName;
  return { declaration, previousName, nextName, referenceCount, typeReferenceCount };
}

function renameTypeReferences(root: NamedUserType | ClassDeclaration, previousName: string, nextName: string): number {
  let changes = 0;
  const rewriteTypeRef = (typeRef: TypeRef | null): void => {
    if (!typeRef) {
      return;
    }
    if (typeRef.type === "SimpleTypeRef" && typeRef.name === previousName) {
      typeRef.name = nextName;
      changes += 1;
    }
    if (typeRef.type === "SimpleTypeRef" && Array.isArray((typeRef as TypeRef & { typeArguments?: TypeRef[] }).typeArguments)) {
      for (const argument of (typeRef as TypeRef & { typeArguments?: TypeRef[] }).typeArguments ?? []) {
        rewriteTypeRef(argument);
      }
    }
  };

  root.traverse((node) => {
    if (node instanceof NamedUserType || node instanceof ClassDeclaration) {
      if (node.superClass === previousName) {
        node.superClass = nextName;
        changes += 1;
      }
      if (node instanceof ClassDeclaration && node.modelType === previousName) {
        node.modelType = nextName;
        changes += 1;
      }
    }
    if (node instanceof UserField) {
      rewriteTypeRef(node.fieldType);
    } else if (node instanceof UserMethod) {
      rewriteTypeRef(node.returnType);
    } else if (node instanceof UserParameter) {
      rewriteTypeRef(node.paramType);
    } else if (node instanceof UserLocal) {
      rewriteTypeRef(node.valueType);
    } else if (node instanceof ThisExpression || node instanceof SuperExpression) {
      rewriteTypeRef(node.currentType);
    } else if (node instanceof TypeExpression || node instanceof TypeLiteral) {
      rewriteTypeRef(node.valueType);
    } else if (node instanceof ResourceExpression) {
      rewriteTypeRef(node.resourceType);
    } else if (node instanceof NewInstanceExpression || node instanceof InstanceCreation) {
      if (node.className === previousName) {
        node.className = nextName;
        changes += 1;
      }
    } else if (node instanceof ReturnStatement) {
      rewriteTypeRef(node.expressionType);
    } else if (node instanceof TypeCastExpression) {
      rewriteTypeRef(node.targetType);
    } else if (node instanceof InstanceOfExpression) {
      rewriteTypeRef(node.testType);
    } else if (node instanceof NewArrayExpression) {
      rewriteTypeRef(node.elementType);
    }
  });

  return changes;
}
