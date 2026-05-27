import type { AbstractDeclaration, Statement, UserMethod } from "../ast-nodes.js";

export interface RenameResult {
  readonly declaration: AbstractDeclaration;
  readonly previousName: string;
  readonly nextName: string;
  readonly referenceCount: number;
  readonly typeReferenceCount: number;
}

export interface ExtractMethodOptions {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly extractedName: string;
  readonly visibility?: string | null;
}

export interface ExtractMethodResult {
  readonly extractedMethod: UserMethod;
  readonly selectedStatements: Statement[];
  readonly parameterNames: string[];
  readonly replacementStatements: Statement[];
}

export interface InlineMethodOptions {
  readonly removeSourceMethod?: boolean;
}

export interface InlineMethodResult {
  readonly mode: "expression" | "statement";
  readonly callSiteCount: number;
  readonly removedSourceMethod: boolean;
}

export class RefactoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefactoringError";
  }
}
