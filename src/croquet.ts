import {
  CompositeCommand,
  type Command,
  type UndoRedoManager,
} from "./undo-redo";

export interface Codec<T> {
  readonly name: string;
  encode(value: T): string;
  decode(serialized: string): T;
  appendRepresentation(value: T): string;
}

export type ItemCodec<T> = Codec<T>;

export interface ActionTrigger {
  readonly type: string;
  readonly timestamp: number;
  readonly source?: unknown;
}

export class SimulatedActionTrigger implements ActionTrigger {
  readonly type: string = "simulated";
  readonly timestamp: number;

  constructor(
    public readonly source?: unknown,
    timestamp = Date.now(),
  ) {
    this.timestamp = timestamp;
  }

  static create(source?: unknown): SimulatedActionTrigger {
    return new SimulatedActionTrigger(source);
  }
}

export class KeyPressedTrigger extends SimulatedActionTrigger {
  readonly type = "keyPressed";

  constructor(
    public readonly key: string,
    public readonly options: {
      readonly code?: string;
      readonly altKey?: boolean;
      readonly ctrlKey?: boolean;
      readonly metaKey?: boolean;
      readonly shiftKey?: boolean;
      readonly source?: unknown;
      readonly timestamp?: number;
    } = {},
  ) {
    super(options.source, options.timestamp);
  }

  get code(): string {
    return this.options.code ?? this.key;
  }

  get altKey(): boolean {
    return this.options.altKey ?? false;
  }

  get ctrlKey(): boolean {
    return this.options.ctrlKey ?? false;
  }

  get metaKey(): boolean {
    return this.options.metaKey ?? false;
  }

  get shiftKey(): boolean {
    return this.options.shiftKey ?? false;
  }

  get chord(): string {
    return [
      this.ctrlKey ? "Ctrl" : null,
      this.altKey ? "Alt" : null,
      this.shiftKey ? "Shift" : null,
      this.metaKey ? "Meta" : null,
      this.code,
    ]
      .filter((part): part is string => part !== null)
      .join("+");
  }
}

export interface StateChange<T> {
  readonly state: State<T>;
  readonly previousValue: T;
  readonly value: T;
  readonly trigger?: ActionTrigger;
}

export type StateListener<T> = (change: StateChange<T>) => void;

export interface StateOptions<T> {
  readonly name?: string;
  readonly undoRedo?: UndoRedoManager;
  readonly validate?: (value: T) => boolean;
  readonly clone?: (value: T) => T;
  readonly equals?: (left: T, right: T) => boolean;
  readonly codec?: Codec<T>;
}

export interface OperationOptions {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly undoRedo?: UndoRedoManager;
}

export type OperationResult = Command | Command[] | void;
export type OperationHandler = (trigger: ActionTrigger) => OperationResult;

export interface OperationFireEvent {
  readonly operation: Operation;
  readonly trigger: ActionTrigger;
  readonly result: OperationResult;
}

export type OperationListener = (event: OperationFireEvent) => void;

export interface ViewLifecycleEvent<TView> {
  readonly composite: Composite<TView>;
  readonly view: TView;
}

export type ListDataEventType = "add" | "remove" | "move" | "set" | "clear" | "reset";

export interface ListDataEvent<T> {
  readonly source: ListData<T>;
  readonly type: ListDataEventType;
  readonly items: readonly T[];
  readonly index?: number;
  readonly fromIndex?: number;
  readonly toIndex?: number;
  readonly previousItems?: readonly T[];
}

export type ListDataListener<T> = (event: ListDataEvent<T>) => void;

export type TreeDataEventType = "add" | "remove" | "move" | "update" | "reset";

export interface TreeDataEvent<T> {
  readonly source: TreeData<T>;
  readonly type: TreeDataEventType;
  readonly node: TreeNode<T> | null;
  readonly parent?: TreeNode<T> | null;
  readonly previousParent?: TreeNode<T> | null;
  readonly index?: number;
  readonly previousIndex?: number;
  readonly previousValue?: T;
}

export type TreeDataListener<T> = (event: TreeDataEvent<T>) => void;

const identityClone = <T>(value: T): T => value;

function arrayClone<T>(value: readonly T[]): readonly T[] {
  return [...value];
}

function arrayEquals<T>(
  left: readonly T[],
  right: readonly T[],
  equals: (leftValue: T, rightValue: T) => boolean,
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => equals(value, right[index]));
}

function normalizeIndex(index: number, length: number, allowEnd = true): number {
  const upperBound = allowEnd ? length : Math.max(0, length - 1);
  return Math.max(0, Math.min(index, upperBound));
}

function codecEquals<T>(codec?: Codec<T>): (left: T, right: T) => boolean {
  return (left, right) => {
    if (Object.is(left, right)) {
      return true;
    }
    if (!codec) {
      return false;
    }
    return codec.encode(left) === codec.encode(right);
  };
}

class StateCommand<T> implements Command {
  constructor(
    private readonly state: State<T>,
    private readonly previousValue: T,
    private readonly nextValue: T,
    private readonly trigger?: ActionTrigger,
  ) {}

  get description(): string {
    return `Set ${this.state.name}`;
  }

  execute(): void {
    this.state.applyValue(this.nextValue, this.trigger);
  }

  undo(): void {
    this.state.applyValue(this.previousValue, this.trigger);
  }
}

class NullableCodec<T> implements Codec<T | null> {
  readonly name: string;

  constructor(private readonly baseCodec: Codec<T>) {
    this.name = `${baseCodec.name}?`;
  }

  encode(value: T | null): string {
    return value === null ? "__null__" : this.baseCodec.encode(value);
  }

  decode(serialized: string): T | null {
    return serialized === "__null__" ? null : this.baseCodec.decode(serialized);
  }

  appendRepresentation(value: T | null): string {
    return value === null ? "null" : this.baseCodec.appendRepresentation(value);
  }
}

class ArrayCodec<T> implements Codec<readonly T[]> {
  readonly name: string;

  constructor(private readonly itemCodec: Codec<T>) {
    this.name = `${itemCodec.name}[]`;
  }

  encode(value: readonly T[]): string {
    return JSON.stringify(value.map((item) => this.itemCodec.encode(item)));
  }

  decode(serialized: string): readonly T[] {
    return (JSON.parse(serialized) as string[]).map((item) => this.itemCodec.decode(item));
  }

  appendRepresentation(value: readonly T[]): string {
    return `[${value.map((item) => this.itemCodec.appendRepresentation(item)).join(", ")}]`;
  }
}

class JsonCodec<T> implements Codec<T> {
  readonly name: string;

  constructor(name = "json") {
    this.name = name;
  }

  encode(value: T): string {
    return JSON.stringify(value);
  }

  decode(serialized: string): T {
    return JSON.parse(serialized) as T;
  }

  appendRepresentation(value: T): string {
    return typeof value === "string" ? value : JSON.stringify(value);
  }
}

function createDefaultCodec<T>(): Codec<T> {
  return new JsonCodec<T>();
}

function createLookupCodec<T>(
  name: string,
  lookup: () => readonly T[],
  keyOf: (value: T) => string,
): Codec<T> {
  return {
    name,
    encode: (value) => keyOf(value),
    decode: (serialized) => {
      const match = lookup().find((candidate) => keyOf(candidate) === serialized);
      if (match === undefined) {
        throw new TypeError(`invalid ${name} encoding: ${serialized}`);
      }
      return match;
    },
    appendRepresentation: (value) => keyOf(value),
  };
}

const booleanCodec: Codec<boolean> = {
  name: "boolean",
  encode: (value) => (value ? "true" : "false"),
  decode: (serialized) => {
    if (serialized !== "true" && serialized !== "false") {
      throw new TypeError(`invalid boolean encoding: ${serialized}`);
    }
    return serialized === "true";
  },
  appendRepresentation: (value) => String(value),
};

const doubleCodec: Codec<number> = {
  name: "double",
  encode: (value) => {
    if (!Number.isFinite(value)) {
      throw new TypeError(`cannot encode non-finite double ${value}`);
    }
    return JSON.stringify(value);
  },
  decode: (serialized) => {
    const value = Number.parseFloat(serialized);
    if (!Number.isFinite(value)) {
      throw new TypeError(`invalid double encoding: ${serialized}`);
    }
    return value;
  },
  appendRepresentation: (value) => `${value}`,
};

export class StringCodec implements Codec<string> {
  readonly name = "string";

  encode(value: string): string {
    return JSON.stringify(value);
  }

  decode(serialized: string): string {
    return JSON.parse(serialized) as string;
  }

  appendRepresentation(value: string): string {
    return value;
  }
}

export class IntegerCodec implements Codec<number> {
  readonly name = "integer";

  encode(value: number): string {
    if (!Number.isInteger(value)) {
      throw new TypeError(`cannot encode non-integer ${value}`);
    }
    return `${value}`;
  }

  decode(serialized: string): number {
    const value = Number.parseInt(serialized, 10);
    if (!Number.isInteger(value) || `${value}` !== serialized.trim()) {
      throw new TypeError(`invalid integer encoding: ${serialized}`);
    }
    return value;
  }

  appendRepresentation(value: number): string {
    return `${value}`;
  }
}

export class EnumCodec<T extends string | number> implements Codec<T> {
  readonly name: string;
  private readonly decodeMap = new Map<string, T>();

  constructor(
    private readonly values: readonly T[],
    private readonly options: {
      readonly name?: string;
      readonly localization?: Partial<Record<`${T}`, string>>;
    } = {},
  ) {
    this.name = options.name ?? "enum";
    for (const value of values) {
      this.decodeMap.set(`${value}`, value);
    }
  }

  encode(value: T): string {
    if (!this.decodeMap.has(`${value}`)) {
      throw new TypeError(`unknown enum value: ${value}`);
    }
    return `${value}`;
  }

  decode(serialized: string): T {
    const value = this.decodeMap.get(serialized);
    if (value === undefined) {
      throw new TypeError(`invalid enum encoding: ${serialized}`);
    }
    return value;
  }

  appendRepresentation(value: T): string {
    return this.options.localization?.[`${value}`] ?? `${value}`;
  }
}

export class State<T> {
  private readonly listeners = new Set<StateListener<T>>();
  private readonly changingListeners = new Set<StateListener<T>>();
  private readonly validateValue: (value: T) => boolean;
  private readonly cloneValue: (value: T) => T;
  private readonly valuesEqual: (left: T, right: T) => boolean;
  protected currentValue: T;

  constructor(initialValue: T, private readonly options: StateOptions<T> = {}) {
    this.validateValue = options.validate ?? (() => true);
    this.cloneValue = options.clone ?? identityClone;
    this.valuesEqual = options.equals ?? codecEquals(options.codec);
    if (!this.validateValue(initialValue)) {
      throw new TypeError(`invalid initial value for ${this.name}`);
    }
    this.currentValue = this.cloneValue(initialValue);
  }

  get name(): string {
    return this.options.name ?? "state";
  }

  get codec(): Codec<T> | undefined {
    return this.options.codec;
  }

  get value(): T {
    return this.cloneValue(this.currentValue);
  }

  set value(nextValue: T) {
    this.setValue(nextValue);
  }

  get hasCodec(): boolean {
    return this.codec !== undefined;
  }

  addListener(listener: StateListener<T>): void {
    this.listeners.add(listener);
  }

  removeListener(listener: StateListener<T>): void {
    this.listeners.delete(listener);
  }

  addChangingListener(listener: StateListener<T>): void {
    this.changingListeners.add(listener);
  }

  removeChangingListener(listener: StateListener<T>): void {
    this.changingListeners.delete(listener);
  }

  setValue(nextValue: T, trigger?: ActionTrigger): void {
    if (!this.validateValue(nextValue)) {
      throw new TypeError(`invalid value for ${this.name}`);
    }
    const normalizedNextValue = this.cloneValue(nextValue);
    if (this.valuesEqual(this.currentValue, normalizedNextValue)) {
      return;
    }
    const previousValue = this.cloneValue(this.currentValue);
    if (this.options.undoRedo) {
      this.options.undoRedo.execute(
        new StateCommand(this, previousValue, normalizedNextValue, trigger),
      );
      return;
    }
    this.applyValue(normalizedNextValue, trigger);
  }

  applyValue(nextValue: T, trigger?: ActionTrigger): void {
    if (!this.validateValue(nextValue)) {
      throw new TypeError(`invalid value for ${this.name}`);
    }
    const normalizedNextValue = this.cloneValue(nextValue);
    if (this.valuesEqual(this.currentValue, normalizedNextValue)) {
      return;
    }
    const previousValue = this.cloneValue(this.currentValue);
    const changingEvent: StateChange<T> = {
      state: this,
      previousValue,
      value: this.cloneValue(normalizedNextValue),
      trigger,
    };
    for (const listener of this.changingListeners) {
      listener(changingEvent);
    }
    this.currentValue = normalizedNextValue;
    const changedEvent: StateChange<T> = {
      state: this,
      previousValue,
      value: this.cloneValue(normalizedNextValue),
      trigger,
    };
    for (const listener of this.listeners) {
      listener(changedEvent);
    }
  }

  serializeValue(value = this.currentValue): string {
    if (!this.codec) {
      throw new Error(`${this.name} does not have an associated codec`);
    }
    return this.codec.encode(value);
  }

  restoreValue(serialized: string, trigger?: ActionTrigger): void {
    if (!this.codec) {
      throw new Error(`${this.name} does not have an associated codec`);
    }
    this.setValue(this.codec.decode(serialized), trigger);
  }

  appendRepresentation(value = this.currentValue): string {
    return this.codec?.appendRepresentation(value) ?? `${value}`;
  }
}

export class StringState extends State<string> {
  textForBlankCondition: string | null = null;

  constructor(initialValue = "", options: Omit<StateOptions<string>, "validate" | "codec"> = {}) {
    super(initialValue, {
      ...options,
      codec: new StringCodec(),
      validate: (value) => typeof value === "string",
    });
  }

  get isBlank(): boolean {
    return this.value.trim().length === 0;
  }
}

export class BooleanState extends State<boolean> {
  private trueText = "true";
  private falseText = "false";

  constructor(initialValue = false, options: Omit<StateOptions<boolean>, "validate" | "codec"> = {}) {
    super(initialValue, {
      ...options,
      codec: booleanCodec,
      validate: (value) => typeof value === "boolean",
    });
  }

  toggle(trigger?: ActionTrigger): void {
    this.setValue(!this.value, trigger);
  }

  getTextFor(value: boolean): string {
    return value ? this.trueText : this.falseText;
  }

  setTextForBothTrueAndFalse(text: string): void {
    this.trueText = text;
    this.falseText = text;
  }

  setTextForTrueAndTextForFalse(trueText: string, falseText: string): void {
    this.trueText = trueText;
    this.falseText = falseText;
  }
}

export class IntegerState extends State<number> {
  constructor(initialValue = 0, options: Omit<StateOptions<number>, "validate" | "codec"> = {}) {
    super(initialValue, {
      ...options,
      codec: new IntegerCodec(),
      validate: Number.isInteger,
    });
  }
}

export class DoubleState extends State<number> {
  constructor(initialValue = 0, options: Omit<StateOptions<number>, "validate" | "codec"> = {}) {
    super(initialValue, {
      ...options,
      codec: doubleCodec,
      validate: Number.isFinite,
    });
  }
}

export class Operation {
  readonly enabledState: BooleanState;
  private readonly listeners = new Set<OperationListener>();
  private readonly chainedOperations: Array<{
    readonly operation: Operation;
    readonly createTrigger?: (event: OperationFireEvent) => ActionTrigger;
  }> = [];

  constructor(
    private readonly action: OperationHandler = () => undefined,
    private readonly options: OperationOptions = {},
  ) {
    this.enabledState = new BooleanState(options.enabled ?? true, {
      name: `${this.name}.enabled`,
    });
  }

  get name(): string {
    return this.options.name ?? "operation";
  }

  get isEnabled(): boolean {
    return this.enabledState.value;
  }

  set isEnabled(value: boolean) {
    this.enabledState.value = value;
  }

  addListener(listener: OperationListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: OperationListener): void {
    this.listeners.delete(listener);
  }

  thenTrigger(
    operation: Operation,
    createTrigger?: (event: OperationFireEvent) => ActionTrigger,
  ): this {
    this.chainedOperations.push({ operation, createTrigger });
    return this;
  }

  protected perform(trigger: ActionTrigger): OperationResult {
    return this.action(trigger);
  }

  fire(trigger: ActionTrigger = SimulatedActionTrigger.create(this)): OperationResult {
    if (!this.isEnabled) {
      return undefined;
    }
    const result = this.perform(trigger);
    this.handleResult(result);
    const event: OperationFireEvent = { operation: this, trigger, result };
    for (const listener of this.listeners) {
      listener(event);
    }
    for (const chainedOperation of this.chainedOperations) {
      chainedOperation.operation.fire(chainedOperation.createTrigger?.(event) ?? trigger);
    }
    return result;
  }

  execute(trigger?: ActionTrigger): OperationResult {
    return this.fire(trigger);
  }

  protected handleResult(result: OperationResult): void {
    if (!result) {
      return;
    }
    if (Array.isArray(result)) {
      if (result.length === 0) {
        return;
      }
      const command = result.length === 1 ? result[0] : new CompositeCommand(result);
      this.executeCommand(command);
      return;
    }
    this.executeCommand(result);
  }

  protected executeCommand(command: Command): void {
    if (this.options.undoRedo) {
      this.options.undoRedo.execute(command);
      return;
    }
    command.execute();
  }
}

export class ActionOperation extends Operation {
  constructor(action: OperationHandler, options: OperationOptions = {}) {
    super(action, options);
  }
}

export class InternalActionOperation extends ActionOperation {
  readonly owner?: Composite<unknown>;

  constructor(
    public readonly key: string,
    action: OperationHandler,
    options: OperationOptions & { readonly owner?: Composite<unknown> } = {},
  ) {
    super(action, {
      ...options,
      name: options.name ?? key,
    });
    this.owner = options.owner;
  }
}

export class BooleanStateOperation extends Operation {
  constructor(
    private readonly state: BooleanState,
    private readonly targetValue?: boolean,
    options: OperationOptions = {},
  ) {
    super(() => undefined, {
      ...options,
      name: options.name ?? `${state.name}.toggle`,
    });
  }

  protected override perform(trigger: ActionTrigger): OperationResult {
    this.state.setValue(this.targetValue ?? !this.state.value, trigger);
    return undefined;
  }
}

export class LazyOperation extends Operation {
  private resolvedOperation: Operation | null = null;

  constructor(
    private readonly factory: () => Operation,
    options: OperationOptions = {},
  ) {
    super(() => undefined, options);
  }

  resolve(): Operation {
    if (!this.resolvedOperation) {
      this.resolvedOperation = this.factory();
      this.enabledState.applyValue(this.resolvedOperation.isEnabled);
      this.resolvedOperation.enabledState.addListener(({ value }) => {
        this.enabledState.applyValue(value);
      });
    }
    return this.resolvedOperation;
  }

  override get isEnabled(): boolean {
    return this.resolvedOperation ? this.resolvedOperation.isEnabled : super.isEnabled;
  }

  override set isEnabled(value: boolean) {
    super.isEnabled = value;
    if (this.resolvedOperation) {
      this.resolvedOperation.isEnabled = value;
    }
  }

  override fire(trigger: ActionTrigger = SimulatedActionTrigger.create(this)): OperationResult {
    if (!super.isEnabled) {
      return undefined;
    }
    return this.resolve().fire(trigger);
  }
}

export class ListData<T> implements Iterable<T> {
  private readonly items: T[];
  private readonly listeners = new Set<ListDataListener<T>>();

  constructor(
    readonly itemCodec: Codec<T> = createDefaultCodec<T>(),
    initialItems: readonly T[] = [],
    readonly preferenceKey = itemCodec.name,
  ) {
    this.items = [...initialItems];
  }

  addListener(listener: ListDataListener<T>): void {
    this.listeners.add(listener);
  }

  removeListener(listener: ListDataListener<T>): void {
    this.listeners.delete(listener);
  }

  contains(item: T): boolean {
    return this.indexOf(item) !== -1;
  }

  filter(predicate: (item: T, index: number, items: readonly T[]) => boolean): T[] {
    const snapshot = this.toArray();
    return snapshot.filter((item, index) => predicate(item, index, snapshot));
  }

  getItemAt(index: number): T {
    const item = this.items[index];
    if (item === undefined) {
      throw new RangeError(`index ${index} out of bounds`);
    }
    return item;
  }

  getItemCount(): number {
    return this.items.length;
  }

  indexOf(item: T): number {
    const encoded = this.itemCodec.encode(item);
    return this.items.findIndex((candidate) => this.itemCodec.encode(candidate) === encoded);
  }

  internalAddItem(index: number, item: T): void {
    const normalizedIndex = normalizeIndex(index, this.items.length, true);
    this.items.splice(normalizedIndex, 0, item);
    this.emit({
      source: this,
      type: "add",
      items: [item],
      index: normalizedIndex,
    });
  }

  add(item: T): void {
    this.internalAddItem(this.items.length, item);
  }

  addAt(index: number, item: T): void {
    this.internalAddItem(index, item);
  }

  internalRemoveItem(item: T): void {
    const index = this.indexOf(item);
    if (index === -1) {
      return;
    }
    this.removeAt(index);
  }

  remove(item: T): boolean {
    const index = this.indexOf(item);
    if (index === -1) {
      return false;
    }
    this.removeAt(index);
    return true;
  }

  removeAt(index: number): T | undefined {
    if (index < 0 || index >= this.items.length) {
      return undefined;
    }
    const [removed] = this.items.splice(index, 1);
    this.emit({
      source: this,
      type: "remove",
      items: removed === undefined ? [] : [removed],
      index,
    });
    return removed;
  }

  setAt(index: number, item: T): void {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(`index ${index} out of bounds`);
    }
    const previousItem = this.items[index];
    if (previousItem !== undefined && this.itemCodec.encode(previousItem) === this.itemCodec.encode(item)) {
      this.items[index] = item;
      return;
    }
    this.items[index] = item;
    this.emit({
      source: this,
      type: "set",
      items: [item],
      index,
      previousItems: previousItem === undefined ? [] : [previousItem],
    });
  }

  move(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.items.length) {
      throw new RangeError(`fromIndex ${fromIndex} out of bounds`);
    }
    const [item] = this.items.splice(fromIndex, 1);
    if (item === undefined) {
      return;
    }
    const normalizedToIndex = normalizeIndex(toIndex, this.items.length, true);
    this.items.splice(normalizedToIndex, 0, item);
    this.emit({
      source: this,
      type: "move",
      items: [item],
      fromIndex,
      toIndex: normalizedToIndex,
    });
  }

  sort(compare: (left: T, right: T) => number): void {
    const desiredOrder = this.toArray().sort(compare);
    desiredOrder.forEach((item, targetIndex) => {
      const currentIndex = this.indexOf(item);
      if (currentIndex !== targetIndex) {
        this.move(currentIndex, targetIndex);
      }
    });
  }

  internalSetAllItems(items: readonly T[]): void {
    const previousItems = this.toArray();
    this.items.splice(0, this.items.length, ...items);
    this.emit({
      source: this,
      type: "reset",
      items: this.toArray(),
      previousItems,
    });
  }

  clear(): void {
    if (this.items.length === 0) {
      return;
    }
    const previousItems = this.toArray();
    this.items.length = 0;
    this.emit({
      source: this,
      type: "clear",
      items: [],
      previousItems,
    });
  }

  toArray(): T[] {
    return [...this.items];
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }

  private emit(event: ListDataEvent<T>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export class MutableListData<T> extends ListData<T> {
  constructor(
    itemCodec: Codec<T> = createDefaultCodec<T>(),
    initialItems: readonly T[] = [],
    preferenceKey = itemCodec.name,
  ) {
    super(itemCodec, initialItems, preferenceKey);
  }
}

let nextTreeNodeId = 0;

export class TreeNode<T> {
  readonly id = `tree-node-${nextTreeNodeId++}`;
  parent: TreeNode<T> | null = null;
  readonly children: TreeNode<T>[] = [];

  constructor(public value: T) {}

  get index(): number {
    if (!this.parent) {
      return -1;
    }
    return this.parent.children.indexOf(this);
  }
}

export class TreeData<T> {
  readonly roots: TreeNode<T>[] = [];
  private readonly listeners = new Set<TreeDataListener<T>>();

  addListener(listener: TreeDataListener<T>): void {
    this.listeners.add(listener);
  }

  removeListener(listener: TreeDataListener<T>): void {
    this.listeners.delete(listener);
  }

  createNode(value: T): TreeNode<T> {
    return new TreeNode(value);
  }

  getChildren(parent: TreeNode<T> | null = null): readonly TreeNode<T>[] {
    return [...(parent ? parent.children : this.roots)];
  }

  filter(
    predicate: (node: TreeNode<T>, index: number, parent: TreeNode<T> | null) => boolean,
  ): TreeNode<T>[] {
    const matches: TreeNode<T>[] = [];
    const visit = (nodes: readonly TreeNode<T>[], parent: TreeNode<T> | null): void => {
      nodes.forEach((node, index) => {
        if (predicate(node, index, parent)) {
          matches.push(node);
        }
        visit(node.children, node);
      });
    };
    visit(this.roots, null);
    return matches;
  }

  addRoot(value: T | TreeNode<T>, index = this.roots.length): TreeNode<T> {
    const node = value instanceof TreeNode ? value : this.createNode(value);
    if (node.parent) {
      this.removeNode(node);
    }
    const normalizedIndex = normalizeIndex(index, this.roots.length, true);
    this.roots.splice(normalizedIndex, 0, node);
    node.parent = null;
    this.emit({ source: this, type: "add", node, parent: null, index: normalizedIndex });
    return node;
  }

  addRootAt(index: number, value: T | TreeNode<T>): TreeNode<T> {
    return this.addRoot(value, index);
  }

  addChild(parent: TreeNode<T>, value: T | TreeNode<T>, index = parent.children.length): TreeNode<T> {
    const node = value instanceof TreeNode ? value : this.createNode(value);
    if (this.isAncestorOf(node, parent)) {
      throw new Error("Cannot create a tree cycle");
    }
    if (node.parent || this.roots.includes(node)) {
      this.removeNode(node);
    }
    const normalizedIndex = normalizeIndex(index, parent.children.length, true);
    parent.children.splice(normalizedIndex, 0, node);
    node.parent = parent;
    this.emit({ source: this, type: "add", node, parent, index: normalizedIndex });
    return node;
  }

  addChildAt(parent: TreeNode<T>, index: number, value: T | TreeNode<T>): TreeNode<T> {
    return this.addChild(parent, value, index);
  }

  updateNode(node: TreeNode<T>, value: T): void {
    const previousValue = node.value;
    node.value = value;
    this.emit({ source: this, type: "update", node, previousValue });
  }

  removeNode(node: TreeNode<T>): void {
    const parent = node.parent;
    const siblings = parent ? parent.children : this.roots;
    const previousIndex = siblings.indexOf(node);
    if (previousIndex === -1) {
      return;
    }
    siblings.splice(previousIndex, 1);
    node.parent = null;
    this.emit({
      source: this,
      type: "remove",
      node,
      previousParent: parent,
      previousIndex,
    });
  }

  moveNode(node: TreeNode<T>, parent: TreeNode<T> | null, index?: number): void {
    if (parent && this.isAncestorOf(node, parent)) {
      throw new Error("Cannot create a tree cycle");
    }
    const previousParent = node.parent;
    const previousSiblings = previousParent ? previousParent.children : this.roots;
    const previousIndex = previousSiblings.indexOf(node);
    if (previousIndex === -1) {
      throw new Error("Node is not attached to this tree");
    }
    previousSiblings.splice(previousIndex, 1);
    const nextSiblings = parent ? parent.children : this.roots;
    const normalizedIndex = normalizeIndex(index ?? nextSiblings.length, nextSiblings.length, true);
    nextSiblings.splice(normalizedIndex, 0, node);
    node.parent = parent;
    this.emit({
      source: this,
      type: "move",
      node,
      parent,
      previousParent,
      index: normalizedIndex,
      previousIndex,
    });
  }

  reorderNode(node: TreeNode<T>, index: number): void {
    this.moveNode(node, node.parent, index);
  }

  sortChildren(
    parent: TreeNode<T> | null,
    compare: (left: TreeNode<T>, right: TreeNode<T>) => number,
  ): void {
    const siblings = parent ? parent.children : this.roots;
    const desiredOrder = [...siblings].sort(compare);
    desiredOrder.forEach((node, targetIndex) => {
      if (siblings[targetIndex] !== node) {
        this.moveNode(node, parent, targetIndex);
      }
    });
  }

  sort(compare: (left: TreeNode<T>, right: TreeNode<T>) => number): void {
    this.sortChildren(null, compare);
  }

  clear(): void {
    this.roots.length = 0;
    this.emit({ source: this, type: "reset", node: null });
  }

  traverse(visitor: (node: TreeNode<T>) => void): void {
    const visit = (node: TreeNode<T>): void => {
      visitor(node);
      for (const child of node.children) {
        visit(child);
      }
    };
    for (const root of this.roots) {
      visit(root);
    }
  }

  flatten(): TreeNode<T>[] {
    const nodes: TreeNode<T>[] = [];
    this.traverse((node) => nodes.push(node));
    return nodes;
  }

  getPath(node: TreeNode<T>): TreeNode<T>[] {
    const path: TreeNode<T>[] = [];
    let current: TreeNode<T> | null = node;
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  private isAncestorOf(candidateAncestor: TreeNode<T>, node: TreeNode<T> | null): boolean {
    let current = node;
    while (current) {
      if (current === candidateAncestor) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private emit(event: TreeDataEvent<T>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export interface ItemSelectionStateOptions<T>
  extends Omit<StateOptions<T | null>, "codec" | "equals"> {
  readonly itemCodec: Codec<T>;
  readonly items?: Iterable<T>;
}

export class ItemSelectionState<T> extends State<T | null> {
  private readonly itemSelectedStates = new Map<string, BooleanState>();
  private readonly selectionOperations = new Map<string, Operation>();
  protected availableItems: T[];
  readonly itemCodec: Codec<T>;

  constructor(
    initialValue: T | null,
    options: ItemSelectionStateOptions<T>,
  ) {
    const nullableCodec = new NullableCodec(options.itemCodec);
    super(initialValue, {
      ...options,
      codec: nullableCodec,
      equals: (left, right) => nullableCodec.encode(left) === nullableCodec.encode(right),
    });
    this.itemCodec = options.itemCodec;
    this.availableItems = [...(options.items ?? [])];
    this.addListener(({ value }) => {
      this.syncItemSelectedStates(value);
    });
  }

  get items(): readonly T[] {
    return [...this.availableItems];
  }

  get selectedIndex(): number {
    if (this.currentValue === null) {
      return -1;
    }
    const encoded = this.itemCodec.encode(this.currentValue);
    return this.availableItems.findIndex((candidate) => this.itemCodec.encode(candidate) === encoded);
  }

  get selectedItem(): T | null {
    return this.value;
  }

  setItems(items: Iterable<T>): void {
    this.availableItems = [...items];
    if (this.currentValue === null) {
      return;
    }
    const matchingItem = this.findMatchingItem(this.currentValue);
    if (matchingItem === null) {
      this.clearSelection();
      return;
    }
    this.currentValue = matchingItem;
    this.syncItemSelectedStates(matchingItem);
  }

  containsItem(item: T): boolean {
    return this.findMatchingItem(item) !== null;
  }

  select(item: T, trigger?: ActionTrigger): void {
    const matchingItem = this.findMatchingItem(item);
    if (matchingItem === null && this.availableItems.length > 0) {
      throw new Error(`item ${this.itemCodec.appendRepresentation(item)} is not in the selection model`);
    }
    this.setValue(matchingItem ?? item, trigger);
  }

  selectIndex(index: number, trigger?: ActionTrigger): void {
    if (index === -1) {
      this.clearSelection(trigger);
      return;
    }
    const item = this.availableItems[index];
    if (item === undefined) {
      throw new RangeError(`index ${index} out of bounds`);
    }
    this.select(item, trigger);
  }

  clearSelection(trigger?: ActionTrigger): void {
    this.setValue(null, trigger);
  }

  serializeSelection(): string {
    return this.serializeValue();
  }

  restoreSelection(serialized: string, trigger?: ActionTrigger): void {
    this.restoreValue(serialized, trigger);
    if (this.currentValue === null) {
      return;
    }
    const matchingItem = this.findMatchingItem(this.currentValue);
    if (matchingItem !== null) {
      this.currentValue = matchingItem;
      this.syncItemSelectedStates(matchingItem);
    }
  }

  isSelected(item: T): boolean {
    return this.currentValue !== null && this.itemCodec.encode(this.currentValue) === this.itemCodec.encode(item);
  }

  getItemSelectedState(item: T): BooleanState {
    const key = this.itemCodec.encode(item);
    const existing = this.itemSelectedStates.get(key);
    if (existing) {
      return existing;
    }
    const state = new BooleanState(this.isSelected(item), {
      name: `${this.name}.${key}.selected`,
    });
    state.addListener(({ value, trigger }) => {
      if (value) {
        this.select(item, trigger);
      } else if (this.isSelected(item)) {
        this.clearSelection(trigger);
      }
    });
    this.itemSelectedStates.set(key, state);
    return state;
  }

  getItemSelectionOperation(item: T): Operation {
    const key = this.itemCodec.encode(item);
    const existing = this.selectionOperations.get(key);
    if (existing) {
      return existing;
    }
    const operation = new InternalActionOperation(
      key,
      (trigger) => {
        this.select(item, trigger);
        return undefined;
      },
      { name: `${this.name}.select.${key}` },
    );
    this.selectionOperations.set(key, operation);
    return operation;
  }

  private findMatchingItem(item: T): T | null {
    const encoded = this.itemCodec.encode(item);
    return (
      this.availableItems.find((candidate) => this.itemCodec.encode(candidate) === encoded) ?? null
    );
  }

  private syncItemSelectedStates(value: T | null): void {
    const selectedKey = value === null ? null : this.itemCodec.encode(value);
    for (const [key, state] of this.itemSelectedStates) {
      state.applyValue(selectedKey !== null && selectedKey === key);
    }
  }
}

export interface ListSelectionStateOptions<T>
  extends Omit<StateOptions<readonly T[]>, "codec" | "clone" | "equals"> {
  readonly itemCodec: Codec<T>;
  readonly data?: ListData<T>;
}

export class ListSelectionState<T> extends State<readonly T[]> {
  readonly itemCodec: Codec<T>;
  readonly data?: ListData<T>;

  constructor(
    initialValues: readonly T[],
    options: ListSelectionStateOptions<T>,
  ) {
    const codec = new ArrayCodec(options.itemCodec);
    super(initialValues, {
      ...options,
      codec,
      clone: arrayClone,
      equals: (left, right) => arrayEquals(left, right, codecEquals(options.itemCodec)),
    });
    this.itemCodec = options.itemCodec;
    this.data = options.data;
    this.data?.addListener(() => this.reconcileSelection());
  }

  get selectedItems(): readonly T[] {
    return this.value;
  }

  get selectedIndexes(): readonly number[] {
    if (!this.data) {
      return [];
    }
    return this.value
      .map((item) => this.data!.indexOf(item))
      .filter((index) => index >= 0);
  }

  isSelected(item: T): boolean {
    const encoded = this.itemCodec.encode(item);
    return this.value.some((candidate) => this.itemCodec.encode(candidate) === encoded);
  }

  setSelectedIndexes(indexes: readonly number[], trigger?: ActionTrigger): void {
    if (!this.data) {
      throw new Error("ListSelectionState requires data to select by index");
    }
    const nextValues = indexes
      .map((index) => this.data!.getItemAt(index))
      .filter((value, index, values) => values.indexOf(value) === index);
    this.setValue(nextValues, trigger);
  }

  selectItem(item: T, trigger?: ActionTrigger): void {
    if (this.isSelected(item)) {
      return;
    }
    this.setValue([...this.value, item], trigger);
  }

  toggleItem(item: T, trigger?: ActionTrigger): void {
    if (this.isSelected(item)) {
      this.setValue(
        this.value.filter((candidate) => this.itemCodec.encode(candidate) !== this.itemCodec.encode(item)),
        trigger,
      );
      return;
    }
    this.selectItem(item, trigger);
  }

  clearSelection(trigger?: ActionTrigger): void {
    this.setValue([], trigger);
  }

  private reconcileSelection(): void {
    if (!this.data) {
      return;
    }
    const nextValues = this.value.filter((item) => this.data!.contains(item));
    if (!arrayEquals(nextValues, this.value, codecEquals(this.itemCodec))) {
      this.applyValue(nextValues);
    }
  }
}

export class MutableDataSingleSelectListState<T> extends ItemSelectionState<T> {
  readonly data: ListData<T>;

  constructor(
    itemCodec: Codec<T>,
    initialItems: readonly T[] = [],
    initialValue: T | null = null,
    options: Omit<ItemSelectionStateOptions<T>, "itemCodec" | "items"> = {},
  ) {
    const data = new ListData(itemCodec, initialItems, options.name ?? itemCodec.name);
    super(initialValue, {
      ...options,
      itemCodec,
      items: data,
    });
    this.data = data;
    this.data.addListener(() => {
      this.setItems(this.data);
      this.reconcileSelection();
    });
  }

  get selectedIndex(): number {
    return this.value === null ? -1 : this.data.indexOf(this.value);
  }

  setSelectedIndex(index: number, trigger?: ActionTrigger): void {
    if (index === -1) {
      this.clearSelection(trigger);
      return;
    }
    this.select(this.data.getItemAt(index), trigger);
  }

  addItem(item: T, index = this.data.getItemCount()): void {
    this.data.internalAddItem(index, item);
  }

  removeItem(item: T): void {
    this.data.internalRemoveItem(item);
  }

  moveItem(fromIndex: number, toIndex: number): void {
    this.data.move(fromIndex, toIndex);
  }

  setAllItems(items: readonly T[]): void {
    this.data.internalSetAllItems(items);
  }

  private reconcileSelection(): void {
    if (this.value === null) {
      return;
    }
    if (this.data.contains(this.value)) {
      return;
    }
    const fallbackIndex = Math.min(this.selectedIndex, this.data.getItemCount() - 1);
    if (fallbackIndex >= 0) {
      this.applyValue(this.data.getItemAt(fallbackIndex));
    } else {
      this.applyValue(null);
    }
  }
}

export interface ViewGroup {
  readonly childViews: readonly ViewController<any>[];
  removeChild(view: ViewController<any>): boolean;
}

export class ViewController<TModel = unknown> {
  private parent?: ViewGroup;

  constructor(public readonly model: TModel) {}

  get parentView(): ViewGroup | undefined {
    return this.parent;
  }

  get isAttached(): boolean {
    return this.parent !== undefined;
  }

  attachTo(parent: ViewGroup): void {
    if (this.parent === parent) {
      return;
    }
    this.detach();
    this.parent = parent;
    this.handleAddedTo(parent);
  }

  detach(): void {
    if (!this.parent) {
      return;
    }
    const parent = this.parent;
    this.parent = undefined;
    this.handleRemovedFrom(parent);
  }

  protected handleAddedTo(_parent: ViewGroup): void {}

  protected handleRemovedFrom(_parent: ViewGroup): void {}
}

export class CompositeView<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends ViewController<TComposite> {
  constructor(composite: TComposite) {
    super(composite);
  }

  get composite(): TComposite {
    return this.model;
  }

  handleCompositePreActivation(): void {}

  handleCompositePostDeactivation(): void {}
}

export interface PanelOptions {
  readonly refreshOnAttach?: boolean;
}

export class Panel<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends CompositeView<TComposite> implements ViewGroup {
  private readonly children: ViewController<any>[] = [];
  private refreshNeeded = true;
  private refreshing = false;

  constructor(
    composite: TComposite = null as TComposite,
    private readonly options: PanelOptions = {},
  ) {
    super(composite);
  }

  get childViews(): readonly ViewController<any>[] {
    return [...this.children];
  }

  appendChild(view: ViewController<any>, index = this.children.length): void {
    if (view.parentView) {
      view.parentView.removeChild(view);
    }
    const insertionIndex = normalizeIndex(index, this.children.length);
    this.children.splice(insertionIndex, 0, view);
    view.attachTo(this);
    this.refreshLater();
  }

  removeChild(view: ViewController<any>): boolean {
    const index = this.children.indexOf(view);
    if (index === -1) {
      return false;
    }
    this.children.splice(index, 1);
    view.detach();
    this.refreshLater();
    return true;
  }

  removeAllChildren(): void {
    for (const child of [...this.children]) {
      this.removeChild(child);
    }
  }

  forgetAndRemoveAllChildren(): void {
    this.removeAllChildren();
  }

  refreshLater(): void {
    this.refreshNeeded = true;
  }

  refreshIfNecessary(): void {
    if (!this.refreshNeeded || this.refreshing) {
      return;
    }
    this.refreshing = true;
    try {
      this.internalRefresh();
      this.refreshNeeded = false;
    } finally {
      this.refreshing = false;
    }
  }

  protected internalRefresh(): void {}

  protected override handleAddedTo(parent: ViewGroup): void {
    if (this.options.refreshOnAttach) {
      this.refreshIfNecessary();
    }
    super.handleAddedTo(parent);
  }
}

export type Axis = "page" | "line";

export class AxisPanel<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends Panel<TComposite> {
  constructor(
    public readonly axis: Axis,
    composite: TComposite = null as TComposite,
    children: readonly ViewController<any>[] = [],
  ) {
    super(composite);
    for (const child of children) {
      this.appendChild(child);
    }
  }
}

export class PageAxisPanel<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends AxisPanel<TComposite> {
  constructor(
    composite: TComposite = null as TComposite,
    children: readonly ViewController<any>[] = [],
  ) {
    super("page", composite, children);
  }
}

export class LineAxisPanel<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends AxisPanel<TComposite> {
  constructor(
    composite: TComposite = null as TComposite,
    children: readonly ViewController<any>[] = [],
  ) {
    super("line", composite, children);
  }
}

export type BorderRegion = "pageStart" | "pageEnd" | "lineStart" | "lineEnd" | "center";

export class BorderPanel<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends Panel<TComposite> {
  private readonly regions = new Map<BorderRegion, ViewController<any>>();

  setRegion(region: BorderRegion, view: ViewController<any> | null): void {
    const previous = this.regions.get(region);
    if (previous) {
      super.removeChild(previous);
      this.regions.delete(region);
    }
    if (view) {
      this.regions.set(region, view);
      this.appendChild(view);
    }
  }

  getRegion(region: BorderRegion): ViewController<any> | undefined {
    return this.regions.get(region);
  }

  clearRegion(region: BorderRegion): void {
    this.setRegion(region, null);
  }
}

export class ScrollPane<
  TComposite extends Composite<any> | null = Composite<any> | null,
> extends Panel<TComposite> {
  constructor(
    composite: TComposite = null as TComposite,
    content: ViewController<any> | null = null,
  ) {
    super(composite);
    if (content) {
      this.setContent(content);
    }
  }

  get contentView(): ViewController<any> | null {
    return this.childViews[0] ?? null;
  }

  setContent(view: ViewController<any> | null): void {
    this.removeAllChildren();
    if (view) {
      this.appendChild(view);
    }
  }
}

export interface CompositeOptions<TView> {
  readonly createView?: (composite: Composite<TView>) => TView;
}

export class Composite<TView = unknown> {
  private readonly states = new Map<string, State<unknown>>();
  private readonly operations = new Map<string, Operation>();
  private readonly activationListeners = new Set<(active: boolean) => void>();
  private readonly viewListeners = new Set<(event: ViewLifecycleEvent<TView>) => void>();
  private readonly subComposites = new Set<Composite<any>>();
  private active = false;
  private createdView = false;
  private viewInstance?: TView;

  constructor(
    public readonly name: string,
    private readonly options: CompositeOptions<TView> = {},
  ) {}

  get isActive(): boolean {
    return this.active;
  }

  get hasView(): boolean {
    return this.createdView;
  }

  registerState<T>(name: string, state: State<T>): State<T> {
    this.states.set(name, state as State<unknown>);
    return state;
  }

  registerOperation(name: string, operation: Operation): Operation {
    this.operations.set(name, operation);
    return operation;
  }

  getState<T>(name: string): State<T> | undefined {
    return this.states.get(name) as State<T> | undefined;
  }

  getOperation(name: string): Operation | undefined {
    return this.operations.get(name);
  }

  contains(candidate: State<unknown> | Operation): boolean {
    return [...this.states.values(), ...this.operations.values()].includes(candidate);
  }

  addActivationListener(listener: (active: boolean) => void): void {
    this.activationListeners.add(listener);
  }

  removeActivationListener(listener: (active: boolean) => void): void {
    this.activationListeners.delete(listener);
  }

  addViewListener(listener: (event: ViewLifecycleEvent<TView>) => void): void {
    this.viewListeners.add(listener);
  }

  removeViewListener(listener: (event: ViewLifecycleEvent<TView>) => void): void {
    this.viewListeners.delete(listener);
  }

  protected createView(): TView {
    if (!this.options.createView) {
      throw new Error(`No view factory provided for ${this.name}`);
    }
    return this.options.createView(this);
  }

  protected registerSubComposite<C extends Composite<any>>(subComposite: C): C {
    if (subComposite === (this as unknown as Composite<any>)) {
      throw new Error("A composite cannot manage itself as a sub composite");
    }
    this.subComposites.add(subComposite);
    if (this.active && this.getManagedSubComposites().includes(subComposite)) {
      subComposite.activate();
    }
    return subComposite;
  }

  protected unregisterSubComposite(subComposite: Composite<any>): void {
    if (!this.subComposites.delete(subComposite)) {
      return;
    }
    if (subComposite.isActive) {
      subComposite.deactivate();
    }
  }

  protected getManagedSubComposites(): readonly Composite<any>[] {
    return [...this.subComposites];
  }

  getView(): TView {
    if (!this.createdView) {
      this.viewInstance = this.createView();
      this.createdView = true;
      const event: ViewLifecycleEvent<TView> = {
        composite: this,
        view: this.viewInstance,
      };
      for (const listener of this.viewListeners) {
        listener(event);
      }
      this.handleViewCreated(this.viewInstance);
    }
    return this.viewInstance as TView;
  }

  getScrollPaneIfExists(): ScrollPane<Composite<TView>> | null {
    const view = this.getView();
    return view instanceof ScrollPane ? view as ScrollPane<Composite<TView>> : null;
  }

  getRootComponent(): TView | ScrollPane<Composite<TView>> {
    return this.getScrollPaneIfExists() ?? this.getView();
  }

  releaseView(): void {
    if (!this.createdView) {
      return;
    }
    if (this.viewInstance instanceof Panel) {
      this.viewInstance.forgetAndRemoveAllChildren();
    }
    if (this.viewInstance instanceof ViewController) {
      this.viewInstance.detach();
    }
    this.createdView = false;
    this.viewInstance = undefined;
  }

  activate(): void {
    const view = this.getView();
    if (this.active) {
      return;
    }
    this.active = true;
    if (view instanceof CompositeView) {
      view.handleCompositePreActivation();
    }
    this.handlePreActivation();
    for (const composite of this.getManagedSubComposites()) {
      composite.activate();
    }
    this.handleActivated();
    this.notifyActivationListeners(true);
  }

  deactivate(): void {
    if (!this.active) {
      return;
    }
    this.active = false;
    const managedComposites = [...this.getManagedSubComposites()].reverse();
    for (const composite of managedComposites) {
      composite.deactivate();
    }
    this.handlePostDeactivation();
    if (this.viewInstance instanceof CompositeView) {
      this.viewInstance.handleCompositePostDeactivation();
    }
    this.handleDeactivated();
    this.notifyActivationListeners(false);
  }

  protected handleViewCreated(_view: TView): void {}

  protected handlePreActivation(): void {}

  protected handleActivated(): void {}

  protected handlePostDeactivation(): void {}

  protected handleDeactivated(): void {}

  private notifyActivationListeners(active: boolean): void {
    for (const listener of this.activationListeners) {
      listener(active);
    }
  }
}

export class SimpleComposite<TView = unknown> extends Composite<TView> {}

export interface TabTitleAppearance {
  closeable: boolean;
  potentiallyCloseable: boolean;
  classes: string[];
  tooltip?: string;
}

export interface TabCompositeOptions<TView> extends CompositeOptions<TView> {
  readonly closeable?: boolean;
  readonly potentiallyCloseable?: boolean;
  readonly tabs?: readonly TabComposite<any>[];
  readonly selectedTabIndex?: number;
}

export class TabComposite<TView = unknown> extends SimpleComposite<TView> {
  readonly titleAppearance: TabTitleAppearance;
  readonly tabsData: MutableListData<TabComposite<any>>;
  readonly selectedTabState: ItemSelectionState<TabComposite<any>>;

  constructor(
    name: string,
    options: TabCompositeOptions<TView> = {},
  ) {
    super(name, options);
    this.titleAppearance = {
      closeable: options.closeable ?? false,
      potentiallyCloseable: options.potentiallyCloseable ?? options.closeable ?? false,
      classes: [],
    };
    const tabCodec = createLookupCodec<TabComposite<any>>(
      `${name}.tab`,
      () => this.tabsData?.toArray() ?? [],
      (tab) => tab.name,
    );
    this.tabsData = new MutableListData<TabComposite<any>>(tabCodec, [], `${name}.tabs`);
    this.selectedTabState = new ItemSelectionState<TabComposite<any>>(null, {
      name: `${name}.selectedTab`,
      itemCodec: tabCodec,
      items: this.tabsData,
    });
    this.tabsData.addListener(() => {
      this.selectedTabState.setItems(this.tabsData);
      if (this.selectedTab === null && this.tabsData.getItemCount() > 0) {
        this.selectedTabState.selectIndex(0);
      }
    });
    this.selectedTabState.addListener(({ previousValue, value }) => {
      if (!this.isActive) {
        return;
      }
      previousValue?.deactivate();
      value?.activate();
    });
    for (const tab of options.tabs ?? []) {
      this.addTab(tab);
    }
    if (
      options.selectedTabIndex !== undefined
      && options.selectedTabIndex >= 0
      && options.selectedTabIndex < this.tabsData.getItemCount()
    ) {
      this.selectedTabState.selectIndex(options.selectedTabIndex);
    } else if (this.tabsData.getItemCount() > 0 && this.selectedTab === null) {
      this.selectedTabState.selectIndex(0);
    }
  }

  protected override getManagedSubComposites(): readonly Composite<any>[] {
    return this.selectedTab ? [this.selectedTab] : [];
  }

  get isCloseable(): boolean {
    return this.titleAppearance.closeable;
  }

  get isPotentiallyCloseable(): boolean {
    return this.titleAppearance.potentiallyCloseable;
  }

  get tabs(): readonly TabComposite<any>[] {
    return this.tabsData.toArray();
  }

  get selectedTab(): TabComposite<any> | null {
    return this.selectedTabState.selectedItem;
  }

  get selectedTabIndex(): number {
    return this.selectedTabState.selectedIndex;
  }

  addTab(tab: TabComposite<any>, index = this.tabsData.getItemCount()): void {
    this.registerSubComposite(tab);
    this.tabsData.addAt(index, tab);
  }

  removeTab(tab: TabComposite<any>): boolean {
    const index = this.tabsData.indexOf(tab);
    if (index === -1) {
      return false;
    }
    const wasSelected = this.selectedTab === tab;
    const replacementIndex = wasSelected
      ? Math.min(index, this.tabsData.getItemCount() - 2)
      : this.selectedTabIndex;
    this.tabsData.removeAt(index);
    this.unregisterSubComposite(tab);
    if (wasSelected) {
      if (replacementIndex >= 0) {
        this.selectedTabState.selectIndex(replacementIndex);
      } else {
        this.selectedTabState.clearSelection();
      }
    }
    return true;
  }

  moveTab(fromIndex: number, toIndex: number): void {
    this.tabsData.move(fromIndex, toIndex);
  }

  sortTabs(compare: (left: TabComposite<any>, right: TabComposite<any>) => number): void {
    this.tabsData.sort(compare);
  }

  filterTabs(
    predicate: (tab: TabComposite<any>, index: number, tabs: readonly TabComposite<any>[]) => boolean,
  ): TabComposite<any>[] {
    return this.tabsData.filter(predicate);
  }

  selectTab(tab: TabComposite<any>, trigger?: ActionTrigger): void {
    this.selectedTabState.select(tab, trigger);
  }

  selectTabAt(index: number, trigger?: ActionTrigger): void {
    this.selectedTabState.selectIndex(index, trigger);
  }

  ensureSelectedTabInitialized(): unknown | null {
    return this.selectedTab?.getView() ?? null;
  }

  customizeTitleComponentAppearance(
    customizer: (appearance: TabTitleAppearance) => void,
  ): void {
    customizer(this.titleAppearance);
  }
}

export class DialogComposite<TView = unknown, TResult = unknown> extends SimpleComposite<TView> {
  readonly isOpenState = new BooleanState(false, { name: `${this.name}.open` });
  lastResult: TResult | null = null;
  wasAccepted = false;
  readonly acceptOperation: ActionOperation;
  readonly cancelOperation: ActionOperation;

  constructor(name: string, options: CompositeOptions<TView> = {}) {
    super(name, options);
    this.acceptOperation = this.registerOperation(
      "accept",
      new ActionOperation(() => {
        this.accept();
        return undefined;
      }, { name: `${name}.accept` }),
    ) as ActionOperation;
    this.cancelOperation = this.registerOperation(
      "cancel",
      new ActionOperation(() => {
        this.cancel();
        return undefined;
      }, { name: `${name}.cancel` }),
    ) as ActionOperation;
  }

  get isOpen(): boolean {
    return this.isOpenState.value;
  }

  open(): TView {
    this.isOpenState.value = true;
    this.activate();
    return this.getView();
  }

  close(result: TResult | null = this.lastResult): TResult | null {
    this.lastResult = result;
    this.isOpenState.value = false;
    this.deactivate();
    return this.lastResult;
  }

  accept(result: TResult | null = this.lastResult): TResult | null {
    this.wasAccepted = true;
    return this.close(result);
  }

  cancel(): void {
    this.wasAccepted = false;
    this.close(null);
  }
}

export class WizardDialogComposite<TView = unknown, TStep = string> extends DialogComposite<TView, TStep> {
  private readonly steps: TStep[];
  readonly currentStepIndexState: IntegerState;
  readonly nextOperation: ActionOperation;
  readonly backOperation: ActionOperation;
  readonly finishOperation: ActionOperation;
  readonly visitedSteps = new Set<number>();

  constructor(
    name: string,
    steps: readonly TStep[] = [],
    options: CompositeOptions<TView> = {},
  ) {
    super(name, options);
    this.steps = [...steps];
    this.currentStepIndexState = this.registerState(
      "currentStepIndex",
      new IntegerState(0, { name: `${name}.currentStepIndex` }),
    ) as IntegerState;
    this.nextOperation = this.registerOperation(
      "next",
      new ActionOperation(() => {
        this.goNext();
        return undefined;
      }, { name: `${name}.next` }),
    ) as ActionOperation;
    this.backOperation = this.registerOperation(
      "back",
      new ActionOperation(() => {
        this.goBack();
        return undefined;
      }, { name: `${name}.back` }),
    ) as ActionOperation;
    this.finishOperation = this.registerOperation(
      "finish",
      new ActionOperation(() => {
        this.accept(this.currentStep ?? null);
        return undefined;
      }, { name: `${name}.finish` }),
    ) as ActionOperation;
    this.currentStepIndexState.addListener(() => this.updateOperationState());
    this.reset();
  }

  get stepCount(): number {
    return this.steps.length;
  }

  get currentStep(): TStep | null {
    return this.steps[this.currentStepIndexState.value] ?? null;
  }

  addStep(step: TStep): void {
    this.steps.push(step);
    this.updateOperationState();
  }

  reset(): void {
    this.visitedSteps.clear();
    if (this.steps.length > 0) {
      this.currentStepIndexState.applyValue(0);
      this.visitedSteps.add(0);
    }
    this.updateOperationState();
  }

  override open(): TView {
    this.reset();
    return super.open();
  }

  canGoBack(): boolean {
    return this.currentStepIndexState.value > 0;
  }

  canGoNext(): boolean {
    return this.currentStepIndexState.value < this.steps.length - 1;
  }

  goNext(): void {
    if (!this.canGoNext()) {
      return;
    }
    const nextIndex = this.currentStepIndexState.value + 1;
    this.currentStepIndexState.value = nextIndex;
    this.visitedSteps.add(nextIndex);
    this.updateOperationState();
  }

  goBack(): void {
    if (!this.canGoBack()) {
      return;
    }
    this.currentStepIndexState.value -= 1;
    this.updateOperationState();
  }

  private updateOperationState(): void {
    this.backOperation.isEnabled = this.canGoBack();
    this.nextOperation.isEnabled = this.canGoNext();
    this.finishOperation.isEnabled = this.steps.length > 0 && !this.canGoNext();
  }
}
