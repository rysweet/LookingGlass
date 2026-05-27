export type ASTEditMode = "navigate" | "select" | "insert" | "replace" | "drag";

export interface ASTSelection {
  anchorPath: number[];
  focusPath: number[];
}

export class ASTEditorState {
  private _cursorPath: number[];
  private _selection: ASTSelection | null;
  private _editMode: ASTEditMode;

  constructor(cursorPath: number[] = [], selection: ASTSelection | null = null, editMode: ASTEditMode = "select") {
    this._cursorPath = [...cursorPath];
    this._selection = selection ? clone(selection) : null;
    this._editMode = editMode;
  }

  get cursorPath(): number[] {
    return [...this._cursorPath];
  }

  get selection(): ASTSelection | null {
    return this._selection ? clone(this._selection) : null;
  }

  get editMode(): ASTEditMode {
    return this._editMode;
  }

  moveCursor(path: number[]): void {
    this._cursorPath = [...path];
  }

  setSelection(anchorPath: number[], focusPath: number[] = anchorPath): void {
    this._selection = {
      anchorPath: [...anchorPath],
      focusPath: [...focusPath],
    };
  }

  clearSelection(): void {
    this._selection = null;
  }

  setEditMode(mode: ASTEditMode): void {
    this._editMode = mode;
  }

  isPathSelected(path: number[]): boolean {
    return this._selection !== null
      && (pathsEqual(path, this._selection.anchorPath) || pathsEqual(path, this._selection.focusPath));
  }
}

export class StatementInsertionPoint<T = unknown> {
  readonly blockPath: number[];
  readonly index: number;

  constructor(blockPath: number[], index: number) {
    this.blockPath = [...blockPath];
    this.index = index;
  }

  clamp(length: number): number {
    return Math.max(0, Math.min(this.index, length));
  }

  insertInto(block: T[], statement: T): T[] {
    const next = [...block];
    next.splice(this.clamp(next.length), 0, clone(statement));
    return next;
  }
}

export class ExpressionSlot<T = unknown> {
  private _value: T | null;
  private _typeName: string | null;

  constructor(
    readonly id: string,
    readonly label: string,
    readonly acceptedTypes: string[] = [],
    initialValue: T | null = null,
    initialTypeName: string | null = null,
  ) {
    this._value = initialValue === null ? null : clone(initialValue);
    this._typeName = initialTypeName;
  }

  get value(): T | null {
    return this._value === null ? null : clone(this._value);
  }

  get typeName(): string | null {
    return this._typeName;
  }

  get isFilled(): boolean {
    return this._value !== null;
  }

  fill(value: T, typeName: string | null = null): void {
    if (typeName && this.acceptedTypes.length > 0 && !this.acceptedTypes.includes(typeName)) {
      throw new Error(`Slot ${this.id} does not accept ${typeName}`);
    }
    this._value = clone(value);
    this._typeName = typeName;
  }

  clear(): void {
    this._value = null;
    this._typeName = null;
  }
}

export class BlockEditor<T = unknown> {
  private _statements: T[];

  constructor(statements: T[] = []) {
    this._statements = clone(statements);
  }

  get statements(): T[] {
    return clone(this._statements);
  }

  insert(pointOrIndex: StatementInsertionPoint<T> | number, statement: T): T[] {
    const point = typeof pointOrIndex === "number"
      ? new StatementInsertionPoint<T>([], pointOrIndex)
      : pointOrIndex;
    this._statements = point.insertInto(this._statements, statement);
    return this.statements;
  }

  replace(index: number, statement: T): T | null {
    if (index < 0 || index >= this._statements.length) {
      return null;
    }
    const previous = this._statements[index];
    this._statements[index] = clone(statement);
    return clone(previous);
  }

  remove(index: number): T | null {
    if (index < 0 || index >= this._statements.length) {
      return null;
    }
    const [removed] = this._statements.splice(index, 1);
    return clone(removed);
  }

  move(fromIndex: number, toIndex: number): T[] {
    if (fromIndex < 0 || fromIndex >= this._statements.length) {
      return this.statements;
    }
    const next = [...this._statements];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
    this._statements = next;
    return this.statements;
  }

  dragDrop(fromIndex: number, toIndex: number): T[] {
    return this.move(fromIndex, toIndex);
  }

  clear(): void {
    this._statements = [];
  }
}

export class InlineEditor {
  editLiteral(value: string | number | boolean | null): string {
    if (typeof value === "string") {
      return JSON.stringify(value);
    }
    if (value === null) {
      return "null";
    }
    return String(value);
  }

  editName(name: string): string {
    const normalized = name
      .trim()
      .replace(/\s+/gu, "_")
      .replace(/[^A-Za-z0-9_]/gu, "_");
    if (normalized.length === 0) {
      throw new Error("Name cannot be empty");
    }
    return /^\d/iu.test(normalized) ? `_${normalized}` : normalized;
  }

  editType(typeName: string): string {
    const normalized = typeName.trim().replace(/\s+/gu, " ");
    if (normalized.length === 0) {
      throw new Error("Type name cannot be empty");
    }
    return normalized;
  }

  edit(field: "literal" | "name" | "type", value: string | number | boolean | null): string {
    switch (field) {
      case "literal":
        return this.editLiteral(value);
      case "name":
        return this.editName(String(value));
      case "type":
        return this.editType(String(value));
    }
  }
}

interface ASTHistoryEntry<T> {
  before: T;
  after: T;
  description: string;
}

export class ASTEditorHistory<T = unknown> {
  private _undoStack: ASTHistoryEntry<T>[] = [];
  private _redoStack: ASTHistoryEntry<T>[] = [];

  constructor(private readonly limit = 100) {
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  get undoDepth(): number {
    return this._undoStack.length;
  }

  get redoDepth(): number {
    return this._redoStack.length;
  }

  record(before: T, after: T, description = "edit"): void {
    this._undoStack.push({ before: clone(before), after: clone(after), description });
    if (this._undoStack.length > this.limit) {
      this._undoStack.shift();
    }
    this._redoStack = [];
  }

  undo(): T | null {
    const entry = this._undoStack.pop();
    if (!entry) {
      return null;
    }
    this._redoStack.push(entry);
    return clone(entry.before);
  }

  redo(): T | null {
    const entry = this._redoStack.pop();
    if (!entry) {
      return null;
    }
    this._undoStack.push(entry);
    return clone(entry.after);
  }

  peekUndoDescription(): string | null {
    return this._undoStack.at(-1)?.description ?? null;
  }

  clear(): void {
    this._undoStack = [];
    this._redoStack = [];
  }
}

export class ASTClipboard<T = unknown> {
  private _fragment: T | null = null;
  private _operation: "copy" | "cut" | null = null;

  get hasFragment(): boolean {
    return this._fragment !== null;
  }

  get operation(): "copy" | "cut" | null {
    return this._operation;
  }

  copy(fragment: T): void {
    this._fragment = clone(fragment);
    this._operation = "copy";
  }

  cut(fragment: T): void {
    this._fragment = clone(fragment);
    this._operation = "cut";
  }

  paste(): T | null {
    return this._fragment === null ? null : clone(this._fragment);
  }

  consume(): T | null {
    const pasted = this.paste();
    if (this._operation === "cut") {
      this.clear();
    }
    return pasted;
  }

  clear(): void {
    this._fragment = null;
    this._operation = null;
  }
}

function pathsEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
