import type {
  ClassDeclaration,
  ConstructorDeclaration,
  Expression,
  FieldDeclaration,
  MethodDeclaration,
  Statement,
} from "../ast-nodes.js";

export class AstSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AstSerializationError";
  }
}

export type AstSerializableNode =
  | ClassDeclaration
  | ConstructorDeclaration
  | MethodDeclaration
  | FieldDeclaration
  | Statement
  | Expression;
