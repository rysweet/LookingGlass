export interface DragPosition {
  readonly x: number;
  readonly y: number;
}

export interface DragProxyOptions<T = unknown> {
  readonly id?: string;
  readonly sourceId: string;
  readonly sourceType: string;
  readonly payload: T;
  readonly label?: string;
  readonly position?: DragPosition;
  readonly opacity?: number;
}

export interface DragSourceOptions<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly label?: string;
  readonly payload: T | (() => T);
}

export interface DropTargetOptions<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly accepts?: readonly string[];
  readonly onDrop?: (proxy: DragProxy<T>) => void;
}

export interface DragFeedbackSnapshot {
  readonly ghost: { label: string; position: DragPosition; opacity: number } | null;
  readonly highlightedTargetId: string | null;
}

export interface DragOperationRecord {
  readonly description: string;
  readonly undo: () => void;
  readonly redo: () => void;
}

let nextProxyId = 0;

function createProxyId(): string {
  nextProxyId += 1;
  return `drag-${nextProxyId}`;
}

function clonePosition(position: DragPosition): DragPosition {
  return { ...position };
}

export class DragProxy<T = unknown> {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceType: string;
  readonly payload: T;
  readonly label: string;
  opacity: number;
  position: DragPosition;

  constructor(options: DragProxyOptions<T>) {
    this.id = options.id ?? createProxyId();
    this.sourceId = options.sourceId;
    this.sourceType = options.sourceType;
    this.payload = options.payload;
    this.label = options.label ?? options.sourceType;
    this.position = clonePosition(options.position ?? { x: 0, y: 0 });
    this.opacity = options.opacity ?? 0.7;
  }

  moveTo(position: DragPosition): DragPosition {
    this.position = clonePosition(position);
    return this.position;
  }
}

export class DragSource<T = unknown> {
  constructor(private readonly options: DragSourceOptions<T>) {}

  beginDrag(position: DragPosition = { x: 0, y: 0 }): DragProxy<T> {
    const payload = typeof this.options.payload === "function"
      ? (this.options.payload as () => T)()
      : this.options.payload;
    return new DragProxy<T>({
      sourceId: this.options.id,
      sourceType: this.options.type,
      payload,
      label: this.options.label,
      position,
    });
  }
}

interface DropTargetLike {
  readonly type: string;
  accepts(sourceType: string): boolean;
}

export class DropPolicy {
  private readonly rules = new Map<string, Set<string>>();

  allow(sourceType: string, targetType: string): void {
    const allowed = this.rules.get(targetType) ?? new Set<string>();
    allowed.add(sourceType);
    this.rules.set(targetType, allowed);
  }

  validate(proxy: DragProxy<unknown>, target: DropTargetLike): boolean {
    const explicitlyAllowed = this.rules.get(target.type);
    if (explicitlyAllowed) {
      return explicitlyAllowed.has(proxy.sourceType);
    }
    return target.accepts(proxy.sourceType);
  }
}

export class DropTarget<T = unknown> {
  private readonly acceptedTypes: Set<string>;
  private readonly onDrop?: (proxy: DragProxy<T>) => void;
  readonly id: string;
  readonly type: string;
  hoverCount = 0;
  readonly received: DragProxy<T>[] = [];

  constructor(options: DropTargetOptions<T>) {
    this.id = options.id;
    this.type = options.type;
    this.acceptedTypes = new Set(options.accepts ?? []);
    this.onDrop = options.onDrop;
  }

  accepts(sourceType: string): boolean {
    return this.acceptedTypes.size === 0 || this.acceptedTypes.has(sourceType);
  }

  hover(proxy: DragProxy<unknown>, policy: DropPolicy): boolean {
    const accepted = policy.validate(proxy, this);
    if (accepted) {
      this.hoverCount += 1;
    }
    return accepted;
  }

  drop(proxy: DragProxy<T>, policy: DropPolicy): boolean {
    if (!policy.validate(proxy, this)) {
      return false;
    }
    this.received.push(proxy);
    this.onDrop?.(proxy);
    return true;
  }
}

export class DragFeedback {
  private ghost: { label: string; position: DragPosition; opacity: number } | null = null;
  private targetId: string | null = null;

  begin(proxy: DragProxy<unknown>): DragFeedbackSnapshot {
    this.ghost = {
      label: proxy.label,
      position: clonePosition(proxy.position),
      opacity: proxy.opacity,
    };
    return this.snapshot();
  }

  move(proxy: DragProxy<unknown>): DragFeedbackSnapshot {
    if (this.ghost) {
      this.ghost = {
        ...this.ghost,
        position: clonePosition(proxy.position),
      };
    }
    return this.snapshot();
  }

  highlight(targetId: string | null): DragFeedbackSnapshot {
    this.targetId = targetId;
    return this.snapshot();
  }

  clear(): DragFeedbackSnapshot {
    this.ghost = null;
    this.targetId = null;
    return this.snapshot();
  }

  snapshot(): DragFeedbackSnapshot {
    return {
      ghost: this.ghost ? { ...this.ghost, position: clonePosition(this.ghost.position) } : null,
      highlightedTargetId: this.targetId,
    };
  }
}

export class DragHistory {
  private readonly done: DragOperationRecord[] = [];
  private readonly undone: DragOperationRecord[] = [];

  record(operation: DragOperationRecord): void {
    this.done.push(operation);
    this.undone.length = 0;
  }

  undo(): boolean {
    const operation = this.done.pop();
    if (!operation) {
      return false;
    }
    operation.undo();
    this.undone.push(operation);
    return true;
  }

  redo(): boolean {
    const operation = this.undone.pop();
    if (!operation) {
      return false;
    }
    operation.redo();
    this.done.push(operation);
    return true;
  }

  get canUndo(): boolean {
    return this.done.length > 0;
  }

  get canRedo(): boolean {
    return this.undone.length > 0;
  }
}

export type DragSessionState = "idle" | "dragging" | "dropped" | "cancelled";

/**
 * Manages a drag-and-drop lifecycle with explicit state transitions.
 * Prevents illegal transitions (move before begin, double-drop, etc.).
 */
export class DragSession<T = unknown> {
  private _state: DragSessionState = "idle";
  private _proxy: DragProxy<T> | null = null;

  get state(): DragSessionState {
    return this._state;
  }

  get proxy(): DragProxy<T> | null {
    return this._proxy;
  }

  /** Start a drag. If already dragging, cancels the current drag first. */
  begin(source: DragSource<T>, position: DragPosition = { x: 0, y: 0 }): DragProxy<T> {
    if (this._state === "dragging") {
      this._proxy = null;
    }
    this._proxy = source.beginDrag(position);
    this._state = "dragging";
    return this._proxy;
  }

  /** Move the proxy. Returns null if not dragging. */
  move(position: DragPosition): DragProxy<T> | null {
    if (this._state !== "dragging" || !this._proxy) return null;
    this._proxy.moveTo(position);
    return this._proxy;
  }

  /** Attempt to drop on a target. Stays "dragging" on failed/rejected drop. */
  drop(target: DropTarget<T>, policy: DropPolicy): boolean {
    if (this._state !== "dragging" || !this._proxy) return false;
    const result = target.drop(this._proxy, policy);
    if (result) {
      this._state = "dropped";
      this._proxy = null;
    }
    return result;
  }

  /** Cancel the current drag. No-op if not dragging. */
  cancel(): void {
    if (this._state === "dragging") {
      this._state = "cancelled";
      this._proxy = null;
    }
  }

  /** Reset to idle so a new drag can begin. */
  reset(): void {
    this._state = "idle";
    this._proxy = null;
  }
}
