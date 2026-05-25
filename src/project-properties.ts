export type PropertyConstraintResult = boolean | string | void;
export type PropertyConstraint<T> = (value: T) => PropertyConstraintResult;
export type PropertyEquality<T> = (left: T, right: T) => boolean;
export type PropertyClone<T> = (value: T) => T;
export type PropertyNormalize<T> = (value: T) => T;

export interface PropertyChangeEvent<T> {
  property: InstanceProperty<T>;
  owner: PropertyOwner;
  name: string;
  previousValue: T;
  value: T;
}

export type PropertyListener<T> = (event: PropertyChangeEvent<T>) => void;

export interface PropertyOwner {
  registerProperty(property: InstanceProperty<any>): void;
  getProperties(): Iterable<InstanceProperty<any>>;
  getPropertyNamed(name: string): InstanceProperty<any> | undefined;
  lookupNameFor(property: InstanceProperty<any>): string | undefined;
}

export class PropertyOwnerBase implements PropertyOwner {
  readonly #properties = new Map<string, InstanceProperty<any>>();

  registerProperty(property: InstanceProperty<any>): void {
    const existing = this.#properties.get(property.name);
    if (existing && existing !== property) {
      throw new Error(`Property "${property.name}" is already registered.`);
    }
    this.#properties.set(property.name, property);
  }

  getProperties(): Iterable<InstanceProperty<any>> {
    return this.#properties.values();
  }

  getPropertyNamed(name: string): InstanceProperty<any> | undefined {
    return this.#properties.get(name);
  }

  lookupNameFor(property: InstanceProperty<any>): string | undefined {
    for (const [name, candidate] of this.#properties.entries()) {
      if (candidate === property) {
        return name;
      }
    }
    return undefined;
  }
}

export class PropertyValidationError extends TypeError {
  constructor(
    readonly propertyName: string,
    readonly value: unknown,
    readonly reasons: readonly string[],
  ) {
    super(`Invalid value for property "${propertyName}": ${reasons.join("; ")}`);
    this.name = "PropertyValidationError";
  }
}

export interface InstancePropertyOptions<T> {
  validate?: PropertyConstraint<T>;
  constraints?: Iterable<PropertyConstraint<T>>;
  clone?: PropertyClone<T>;
  equals?: PropertyEquality<T>;
  normalize?: PropertyNormalize<T>;
}

function identityClone<T>(value: T): T {
  return value;
}

function arrayClone<T>(value: readonly T[]): T[] {
  return [...value];
}

function setClone<T>(value: ReadonlySet<T>): Set<T> {
  return new Set(value);
}

function sameArray<T>(
  left: readonly T[],
  right: readonly T[],
  equals: PropertyEquality<T> = Object.is,
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (!equals(left[index], right[index])) {
      return false;
    }
  }
  return true;
}

function sameSet<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean {
  if (left.size !== right.size) {
    return false;
  }
  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }
  return true;
}

function asConstraintMessage(result: PropertyConstraintResult, fallback: string): string | null {
  if (result === false) {
    return fallback;
  }
  if (typeof result === "string") {
    return result;
  }
  return null;
}

export class InstanceProperty<T> {
  readonly #listeners = new Set<PropertyListener<T>>();
  readonly #validate: PropertyConstraint<T> | undefined;
  readonly #constraints: PropertyConstraint<T>[];
  readonly #clone: PropertyClone<T>;
  readonly #equals: PropertyEquality<T>;
  readonly #normalize: PropertyNormalize<T> | undefined;
  #value: T;

  constructor(
    readonly owner: PropertyOwner,
    readonly name: string,
    initialValue: T,
    options: InstancePropertyOptions<T> = {},
  ) {
    this.#validate = options.validate;
    this.#constraints = [...(options.constraints ?? [])];
    this.#clone = options.clone ?? identityClone;
    this.#equals = options.equals ?? Object.is;
    this.#normalize = options.normalize;
    this.#value = this.#prepare(initialValue);
    this.owner.registerProperty(this);
  }

  get value(): T {
    return this.getValue();
  }

  set value(nextValue: T) {
    this.setValue(nextValue);
  }

  getValue(): T {
    return this.#clone(this.#value);
  }

  setValue(nextValue: T): boolean {
    const event = this.commitValue(nextValue);
    if (!event) {
      return false;
    }
    this.emitChange(event);
    return true;
  }

  addListener(listener: PropertyListener<T>): void {
    this.#listeners.add(listener);
  }

  removeListener(listener: PropertyListener<T>): void {
    this.#listeners.delete(listener);
  }

  protected commitValue(nextValue: T): PropertyChangeEvent<T> | null {
    const normalizedNextValue = this.#prepare(nextValue);
    if (this.#equals(this.#value, normalizedNextValue)) {
      return null;
    }
    const previousValue = this.#clone(this.#value);
    this.#value = normalizedNextValue;
    return {
      property: this,
      owner: this.owner,
      name: this.name,
      previousValue,
      value: this.#clone(this.#value),
    };
  }

  protected emitChange(event: PropertyChangeEvent<T>): void {
    for (const listener of this.#listeners) {
      listener(event);
    }
  }

  protected cloneValue(value: T): T {
    return this.#clone(value);
  }

  #prepare(nextValue: T): T {
    const normalizedValue = this.#clone(this.#normalize ? this.#normalize(nextValue) : nextValue);
    const reasons: string[] = [];
    const validationMessage = asConstraintMessage(
      this.#validate?.(normalizedValue),
      `Value for "${this.name}" failed validation.`,
    );
    if (validationMessage) {
      reasons.push(validationMessage);
    }
    for (const constraint of this.#constraints) {
      const message = asConstraintMessage(
        constraint(normalizedValue),
        `Value for "${this.name}" violates a constraint.`,
      );
      if (message) {
        reasons.push(message);
      }
    }
    if (reasons.length > 0) {
      throw new PropertyValidationError(this.name, nextValue, reasons);
    }
    return normalizedValue;
  }
}

export interface IndexedListPropertyChangeEvent<T> extends PropertyChangeEvent<T[]> {
  kind: "add" | "remove" | "set" | "clear";
  index: number;
  added: readonly T[];
  removed: readonly T[];
}

export type IndexedListPropertyListener<T> = (event: IndexedListPropertyChangeEvent<T>) => void;

export interface ListPropertyOptions<T> {
  validate?: PropertyConstraint<T[]>;
  constraints?: Iterable<PropertyConstraint<T[]>>;
  itemConstraints?: Iterable<PropertyConstraint<T>>;
  equals?: PropertyEquality<T>;
}

export class ListProperty<T> extends InstanceProperty<T[]> implements Iterable<T> {
  readonly #indexedListeners = new Set<IndexedListPropertyListener<T>>();
  readonly #itemConstraints: PropertyConstraint<T>[];

  constructor(
    owner: PropertyOwner,
    name: string,
    initialValue: Iterable<T> = [],
    options: ListPropertyOptions<T> = {},
  ) {
    const itemEquals = options.equals ?? Object.is;
    super(owner, name, Array.from(initialValue), {
      validate: options.validate,
      constraints: options.constraints,
      clone: arrayClone,
      normalize: (value) => Array.from(value),
      equals: (left, right) => sameArray(left, right, itemEquals),
    });
    this.#itemConstraints = [...(options.itemConstraints ?? [])];
    this.#validateItems(Array.from(initialValue), 0);
  }

  get size(): number {
    return this.getValue().length;
  }

  get(index: number): T {
    return this.getValue()[index];
  }

  toArray(): T[] {
    return this.getValue();
  }

  addIndexedListener(listener: IndexedListPropertyListener<T>): void {
    this.#indexedListeners.add(listener);
  }

  removeIndexedListener(listener: IndexedListPropertyListener<T>): void {
    this.#indexedListeners.delete(listener);
  }

  add(...items: T[]): number {
    return this.addAt(this.size, ...items);
  }

  addAt(index: number, ...items: T[]): number {
    if (items.length === 0) {
      return this.size;
    }
    this.#assertIndex(index, true);
    this.#validateItems(items, index);
    const next = this.toArray();
    next.splice(index, 0, ...items);
    const change = this.commitValue(next);
    if (!change) {
      return this.size;
    }
    this.emitChange(change);
    this.#emitIndexedChange({
      ...change,
      kind: "add",
      index,
      added: arrayClone(items),
      removed: [],
    });
    return change.value.length;
  }

  set(index: number, ...items: T[]): boolean {
    if (items.length === 0) {
      return false;
    }
    this.#assertIndex(index, false);
    if (index + items.length > this.size) {
      throw new RangeError(`Cannot replace ${items.length} item(s) at index ${index}.`);
    }
    this.#validateItems(items, index);
    const previous = this.toArray().slice(index, index + items.length);
    const next = this.toArray();
    next.splice(index, items.length, ...items);
    const change = this.commitValue(next);
    if (!change) {
      return false;
    }
    this.emitChange(change);
    this.#emitIndexedChange({
      ...change,
      kind: "set",
      index,
      added: arrayClone(items),
      removed: previous,
    });
    return true;
  }

  removeAt(index: number, count = 1): T[] {
    this.#assertIndex(index, false);
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError(`Remove count must be a positive integer, got ${count}.`);
    }
    const next = this.toArray();
    const removed = next.splice(index, count);
    if (removed.length === 0) {
      return [];
    }
    const change = this.commitValue(next);
    if (!change) {
      return [];
    }
    this.emitChange(change);
    this.#emitIndexedChange({
      ...change,
      kind: "remove",
      index,
      added: [],
      removed,
    });
    return removed;
  }

  clear(): boolean {
    const removed = this.toArray();
    if (removed.length === 0) {
      return false;
    }
    const change = this.commitValue([]);
    if (!change) {
      return false;
    }
    this.emitChange(change);
    this.#emitIndexedChange({
      ...change,
      kind: "clear",
      index: 0,
      added: [],
      removed,
    });
    return true;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.toArray()[Symbol.iterator]();
  }

  #emitIndexedChange(event: IndexedListPropertyChangeEvent<T>): void {
    for (const listener of this.#indexedListeners) {
      listener(event);
    }
  }

  #validateItems(items: readonly T[], startIndex: number): void {
    for (const [offset, item] of items.entries()) {
      const reasons: string[] = [];
      for (const constraint of this.#itemConstraints) {
        const message = asConstraintMessage(
          constraint(item),
          `Item ${startIndex + offset} violates a list constraint.`,
        );
        if (message) {
          reasons.push(message);
        }
      }
      if (reasons.length > 0) {
        throw new PropertyValidationError(this.name, item, reasons.map((reason) => `[${startIndex + offset}] ${reason}`));
      }
    }
  }

  #assertIndex(index: number, allowEnd: boolean): void {
    const upperBound = allowEnd ? this.size : this.size - 1;
    if (!Number.isInteger(index) || index < 0 || index > upperBound) {
      throw new RangeError(`Index ${index} is out of bounds for ${this.name}.`);
    }
  }
}

export interface SetPropertyChangeEvent<T> extends PropertyChangeEvent<Set<T>> {
  kind: "add" | "remove" | "clear";
  values: readonly T[];
}

export type SetPropertyListener<T> = (event: SetPropertyChangeEvent<T>) => void;

export interface SetPropertyOptions<T> {
  validate?: PropertyConstraint<Set<T>>;
  constraints?: Iterable<PropertyConstraint<Set<T>>>;
  itemConstraints?: Iterable<PropertyConstraint<T>>;
}

export class SetProperty<T> extends InstanceProperty<Set<T>> implements Iterable<T> {
  readonly #setListeners = new Set<SetPropertyListener<T>>();
  readonly #itemConstraints: PropertyConstraint<T>[];

  constructor(
    owner: PropertyOwner,
    name: string,
    initialValue: Iterable<T> = [],
    options: SetPropertyOptions<T> = {},
  ) {
    const initialSet = new Set(initialValue);
    super(owner, name, initialSet, {
      validate: options.validate,
      constraints: options.constraints,
      clone: setClone,
      normalize: (value) => new Set(value),
      equals: sameSet,
    });
    this.#itemConstraints = [...(options.itemConstraints ?? [])];
    this.#validateItems(initialSet);
  }

  get size(): number {
    return this.getValue().size;
  }

  has(value: T): boolean {
    return this.getValue().has(value);
  }

  toArray(): T[] {
    return [...this.getValue()];
  }

  addSetListener(listener: SetPropertyListener<T>): void {
    this.#setListeners.add(listener);
  }

  removeSetListener(listener: SetPropertyListener<T>): void {
    this.#setListeners.delete(listener);
  }

  add(...values: T[]): number {
    if (values.length === 0) {
      return this.size;
    }
    this.#validateItems(values);
    const next = this.getValue();
    const added: T[] = [];
    for (const value of values) {
      if (!next.has(value)) {
        next.add(value);
        added.push(value);
      }
    }
    if (added.length === 0) {
      return this.size;
    }
    const change = this.commitValue(next);
    if (!change) {
      return this.size;
    }
    this.emitChange(change);
    this.#emitSetChange({ ...change, kind: "add", values: added });
    return change.value.size;
  }

  remove(...values: T[]): T[] {
    if (values.length === 0) {
      return [];
    }
    const next = this.getValue();
    const removed: T[] = [];
    for (const value of values) {
      if (next.delete(value)) {
        removed.push(value);
      }
    }
    if (removed.length === 0) {
      return [];
    }
    const change = this.commitValue(next);
    if (!change) {
      return [];
    }
    this.emitChange(change);
    this.#emitSetChange({ ...change, kind: "remove", values: removed });
    return removed;
  }

  clear(): boolean {
    const removed = this.toArray();
    if (removed.length === 0) {
      return false;
    }
    const change = this.commitValue(new Set<T>());
    if (!change) {
      return false;
    }
    this.emitChange(change);
    this.#emitSetChange({ ...change, kind: "clear", values: removed });
    return true;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.getValue()[Symbol.iterator]();
  }

  #emitSetChange(event: SetPropertyChangeEvent<T>): void {
    for (const listener of this.#setListeners) {
      listener(event);
    }
  }

  #validateItems(values: Iterable<T>): void {
    for (const value of values) {
      const reasons: string[] = [];
      for (const constraint of this.#itemConstraints) {
        const message = asConstraintMessage(
          constraint(value),
          `Set value for "${this.name}" violates a constraint.`,
        );
        if (message) {
          reasons.push(message);
        }
      }
      if (reasons.length > 0) {
        throw new PropertyValidationError(this.name, value, reasons);
      }
    }
  }
}
