import { MethodDeclaration, type Statement } from "./ast-nodes.js";
import { CodeEditor, type StatementListModel, type StatementListPath } from "./code-editor.js";

export interface CursorPosition {
  path: StatementListPath;
  index: number;
}

export interface ProcedurePreviewSnapshot {
  steps: string[];
  collapsedPaths: StatementListPath[];
  cursor: CursorPosition;
  totalBlocks: number;
}

function copyPath(path: StatementListPath): StatementListPath {
  return [...path];
}

function pathKey(path: StatementListPath): string {
  return path.join(">");
}

function isDescendantPath(path: StatementListPath, possibleAncestor: StatementListPath): boolean {
  return path.length > possibleAncestor.length
    && possibleAncestor.every((segment, index) => path[index] === segment);
}

export class BlockCollapsing {
  readonly #collapsed = new Set<string>();

  collapse(path: StatementListPath): void {
    this.#collapsed.add(pathKey(path));
  }

  expand(path: StatementListPath): void {
    this.#collapsed.delete(pathKey(path));
  }

  toggle(path: StatementListPath): boolean {
    const key = pathKey(path);
    if (this.#collapsed.has(key)) {
      this.#collapsed.delete(key);
      return false;
    }
    this.#collapsed.add(key);
    return true;
  }

  isCollapsed(path: StatementListPath): boolean {
    return this.#collapsed.has(pathKey(path));
  }

  isVisible(path: StatementListPath): boolean {
    for (const collapsedPath of this.listCollapsedPaths()) {
      if (isDescendantPath(path, collapsedPath)) {
        return false;
      }
    }
    return true;
  }

  listCollapsedPaths(): StatementListPath[] {
    return Array.from(this.#collapsed).map((entry) => entry.split(">"));
  }
}

export class StatementInsertion {
  constructor(private readonly editor: ProcedureEditor) {}

  insert(path: StatementListPath, index: number, statement: Statement): number {
    return this.editor.insert(path, index, statement);
  }

  insertAtCursor(statement: Statement): number {
    return this.editor.insertAtCursor(statement);
  }
}

export class StatementDeletion {
  constructor(private readonly editor: ProcedureEditor) {}

  remove(path: StatementListPath, index: number): Statement {
    return this.editor.remove(path, index);
  }

  deleteAtCursor(): Statement {
    return this.editor.deleteAtCursor();
  }
}

export class StatementReordering {
  constructor(private readonly editor: ProcedureEditor) {}

  moveUp(path: StatementListPath, index: number): number {
    return this.editor.moveUp(path, index);
  }

  moveDown(path: StatementListPath, index: number): number {
    return this.editor.moveDown(path, index);
  }
}

export class ProcedurePreview {
  constructor(private readonly editor: ProcedureEditor) {}

  snapshot(): ProcedurePreviewSnapshot {
    const blocks = this.editor.codeEditor.getVisualBlocks()
      .filter((block) => this.editor.blockCollapsing.isVisible(block.path));
    return {
      steps: blocks.map((block) => block.label),
      collapsedPaths: this.editor.blockCollapsing.listCollapsedPaths(),
      cursor: this.editor.cursor,
      totalBlocks: this.editor.codeEditor.getVisualBlocks().length,
    };
  }
}

export class ProcedureEditor {
  readonly codeEditor: CodeEditor;
  readonly statementInsertion: StatementInsertion;
  readonly statementDeletion: StatementDeletion;
  readonly statementReordering: StatementReordering;
  readonly blockCollapsing = new BlockCollapsing();
  readonly procedurePreview: ProcedurePreview;

  #cursor: CursorPosition;

  constructor(readonly method: MethodDeclaration) {
    this.codeEditor = new CodeEditor(method);
    this.statementInsertion = new StatementInsertion(this);
    this.statementDeletion = new StatementDeletion(this);
    this.statementReordering = new StatementReordering(this);
    this.procedurePreview = new ProcedurePreview(this);
    this.#cursor = { path: ["body"], index: this.codeEditor.rootList.length };
  }

  get cursor(): CursorPosition {
    return {
      path: copyPath(this.#cursor.path),
      index: this.#cursor.index,
    };
  }

  setCursor(path: StatementListPath, index: number): void {
    const list = this.findList(path);
    this.#cursor = {
      path: copyPath(path),
      index: Math.max(0, Math.min(index, list.length)),
    };
  }

  findList(path: StatementListPath = ["body"]): StatementListModel {
    return this.codeEditor.findStatementList(path);
  }

  listStatementTypes(path: StatementListPath = ["body"]): string[] {
    return this.findList(path).list().map((statement) => statement.type);
  }

  insert(path: StatementListPath, index: number, statement: Statement): number {
    const list = this.findList(path);
    return list.insert(index, statement);
  }

  insertAtCursor(statement: Statement): number {
    const insertedAt = this.insert(this.#cursor.path, this.#cursor.index, statement);
    this.#cursor = {
      path: copyPath(this.#cursor.path),
      index: insertedAt + 1,
    };
    return insertedAt;
  }

  remove(path: StatementListPath, index: number): Statement {
    return this.findList(path).remove(index);
  }

  deleteAtCursor(): Statement {
    const list = this.findList(this.#cursor.path);
    if (list.length === 0) {
      throw new RangeError("no statements exist at the current cursor");
    }
    const index = Math.min(this.#cursor.index, list.length - 1);
    const removed = list.remove(index);
    this.#cursor = {
      path: copyPath(this.#cursor.path),
      index: Math.min(index, list.length),
    };
    return removed;
  }

  moveUp(path: StatementListPath, index: number): number {
    if (index <= 0) {
      return 0;
    }
    return this.findList(path).reorder(index, index - 1);
  }

  moveDown(path: StatementListPath, index: number): number {
    const list = this.findList(path);
    if (index >= list.length - 1) {
      return list.length - 1;
    }
    return list.reorder(index, index + 2);
  }
}
