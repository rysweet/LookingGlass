import {
  CompositeCommand,
  type Command,
  type UndoRedoManager,
} from "./undo-redo";

export interface StateChange<T> {
  readonly state: State<T>;
  readonly previousValue: T;
  readonly value: T;
}

export type StateListener<T> = (change: StateChange<T>) => void;

interface StateOptions<T> {
  readonly name?: string;
  readonly undoRedo?: UndoRedoManager;
  readonly validate?: (value: T) => boolean;
  readonly clone?: (value: T) => T;
  readonly equals?: (left: T, right: T) => boolean;
}

const identityClone = <T>(value: T): T => value;

class StateCommand<T> implements Command {
  constructor(
    private readonly state: State<T>,
    private readonly previousValue: T,
    private readonly nextValue: T,
  ) {}

  get description(): string {
    return `Set ${this.state.name}`;
  }

  execute(): void {
    this.state.applyValue(this.nextValue);
  }

  undo(): void {
    this.state.applyValue(this.previousValue);
  }
}

export class State<T> {
  private readonly _listeners = new Set<StateListener<T>>();
  private readonly _validate: (value: T) => boolean;
  private readonly _clone: (value: T) => T;
  private readonly _equals: (left: T, right: T) => boolean;
  private _value: T;

  constructor(initialValue: T, private readonly _options: StateOptions<T> = {}) {
    this._validate = _options.validate ?? (() => true);
    this._clone = _options.clone ?? identityClone;
    this._equals = _options.equals ?? Object.is;

    if (!this._validate(initialValue)) {
      throw new TypeError(`invalid initial value for ${this.name}`);
    }

    this._value = this._clone(initialValue);
  }

  get name(): string {
    return this._options.name ?? "state";
  }

  get value(): T {
    return this._clone(this._value);
  }

  set value(nextValue: T) {
    this.setValue(nextValue);
  }

  addListener(listener: StateListener<T>): void {
    this._listeners.add(listener);
  }

  removeListener(listener: StateListener<T>): void {
    this._listeners.delete(listener);
  }

  setValue(nextValue: T): void {
    if (!this._validate(nextValue)) {
      throw new TypeError(`invalid value for ${this.name}`);
    }

    const normalizedNextValue = this._clone(nextValue);
    if (this._equals(this._value, normalizedNextValue)) {
      return;
    }

    const previousValue = this._clone(this._value);
    if (this._options.undoRedo) {
      this._options.undoRedo.execute(
        new StateCommand(this, previousValue, normalizedNextValue),
      );
      return;
    }

    this.applyValue(normalizedNextValue);
  }

  applyValue(nextValue: T): void {
    if (!this._validate(nextValue)) {
      throw new TypeError(`invalid value for ${this.name}`);
    }

    const normalizedNextValue = this._clone(nextValue);
    if (this._equals(this._value, normalizedNextValue)) {
      return;
    }

    const previousValue = this._clone(this._value);
    this._value = normalizedNextValue;

    const change: StateChange<T> = {
      state: this,
      previousValue,
      value: this._clone(normalizedNextValue),
    };
    for (const listener of this._listeners) {
      listener(change);
    }
  }
}

export class StringState extends State<string> {
  constructor(initialValue = "", options: Omit<StateOptions<string>, "validate"> = {}) {
    super(initialValue, {
      ...options,
      validate: (value) => typeof value === "string",
    });
  }
}

export class BooleanState extends State<boolean> {
  constructor(initialValue = false, options: Omit<StateOptions<boolean>, "validate"> = {}) {
    super(initialValue, {
      ...options,
      validate: (value) => typeof value === "boolean",
    });
  }
}

export class IntegerState extends State<number> {
  constructor(initialValue = 0, options: Omit<StateOptions<number>, "validate"> = {}) {
    super(initialValue, {
      ...options,
      validate: Number.isInteger,
    });
  }
}

type OperationResult = Command | Command[] | void;

export interface OperationOptions {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly undoRedo?: UndoRedoManager;
}

export class Operation {
  readonly enabledState: BooleanState;

  constructor(
    private readonly action: () => OperationResult,
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

  fire(): void {
    this.execute();
  }

  execute(): void {
    if (!this.isEnabled) {
      return;
    }

    const result = this.action();
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

  private executeCommand(command: Command): void {
    if (this.options.undoRedo) {
      this.options.undoRedo.execute(command);
      return;
    }
    command.execute();
  }
}

export class Composite {
  private readonly _states = new Map<string, State<unknown>>();
  private readonly _operations = new Map<string, Operation>();
  private readonly _activationListeners = new Set<(active: boolean) => void>();
  private _isActive = false;

  constructor(public readonly name: string) {}

  get isActive(): boolean {
    return this._isActive;
  }

  registerState<T>(name: string, state: State<T>): State<T> {
    this._states.set(name, state as State<unknown>);
    return state;
  }

  registerOperation(name: string, operation: Operation): Operation {
    this._operations.set(name, operation);
    return operation;
  }

  getState<T>(name: string): State<T> | undefined {
    return this._states.get(name) as State<T> | undefined;
  }

  getOperation(name: string): Operation | undefined {
    return this._operations.get(name);
  }

  contains(candidate: State<unknown> | State<any> | Operation): boolean {
    return this._states.has(this.findStateKey(candidate)) || this._operations.has(this.findOperationKey(candidate));
  }

  addActivationListener(listener: (active: boolean) => void): void {
    this._activationListeners.add(listener);
  }

  removeActivationListener(listener: (active: boolean) => void): void {
    this._activationListeners.delete(listener);
  }

  activate(): void {
    if (this._isActive) {
      return;
    }
    this._isActive = true;
    this.notifyActivation();
  }

  deactivate(): void {
    if (!this._isActive) {
      return;
    }
    this._isActive = false;
    this.notifyActivation();
  }

  private notifyActivation(): void {
    for (const listener of this._activationListeners) {
      listener(this._isActive);
    }
  }

  private findStateKey(candidate: State<unknown> | State<any> | Operation): string {
    for (const [key, value] of this._states) {
      if (value === candidate) {
        return key;
      }
    }
    return "";
  }

  private findOperationKey(candidate: State<unknown> | State<any> | Operation): string {
    for (const [key, value] of this._operations) {
      if (value === candidate) {
        return key;
      }
    }
    return "";
  }
}
