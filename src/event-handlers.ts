import type { BoundingBox, Position, Vec3 } from "./story-api/types";
import { distanceBetween } from "./story-api/expanded-math";
import { aabbIntersects, sphereIntersects, type Sphere } from "./collision-detection";

export interface MouseHitTarget {
  readonly id: string;
  readonly bounds: BoundingBox;
}

export interface MouseInteraction {
  readonly type: "click" | "double-click" | "drag";
  readonly targetId: string | null;
  readonly distance: number;
}

export interface ModifierState {
  readonly alt: boolean;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
}

export interface CollisionPair {
  readonly leftId: string;
  readonly rightId: string;
}

export interface AabbCollisionTarget {
  readonly id: string;
  readonly bounds: BoundingBox;
}

export interface SphereCollisionTarget {
  readonly id: string;
  readonly sphere: Sphere;
}

export interface ProximityTarget {
  readonly id: string;
  readonly position: Position;
}

export interface ProximityEvent {
  readonly type: "enter" | "exit";
  readonly sourceId: string;
  readonly targetId: string;
  readonly distance: number;
}

export interface ViewEvent {
  readonly type: "scene-start" | "scene-end" | "frame" | "time";
  readonly sceneName: string;
  readonly timeSeconds: number;
  readonly frameIndex: number;
}

export interface TimerCallback {
  readonly id: string;
  readonly intervalSeconds: number;
  readonly callback: () => void;
}

const DEFAULT_MODIFIERS: ModifierState = {
  alt: false,
  ctrl: false,
  meta: false,
  shift: false,
};

function distance2d(left: Position, right: Position): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return Math.hypot(dx, dy);
}

function cloneModifiers(modifiers: ModifierState): ModifierState {
  return { ...modifiers };
}

function normalizeShortcut(combo: string): string {
  const pieces = combo
    .split("+")
    .map((piece) => piece.trim())
    .filter(Boolean);
  const key = pieces.pop() ?? "";
  const modifiers = pieces
    .map((piece) => piece.toLowerCase())
    .sort((left, right) => left.localeCompare(right));
  return [...modifiers, key.toLowerCase()].join("+");
}

export class MouseClickHandler {
  #mouseDownPoint: Position | null = null;
  #mouseDownTarget: string | null = null;
  #lastClickTimeMs = Number.NEGATIVE_INFINITY;

  constructor(
    readonly doubleClickWindowMs = 300,
    readonly dragThreshold = 4,
  ) {}

  hitTest(point: Position, targets: readonly MouseHitTarget[]): string | null {
    let best: MouseHitTarget | null = null;
    for (const target of targets) {
      if (
        point.x >= target.bounds.min.x
        && point.x <= target.bounds.max.x
        && point.y >= target.bounds.min.y
        && point.y <= target.bounds.max.y
        && (!best || target.bounds.max.z > best.bounds.max.z)
      ) {
        best = target;
      }
    }
    return best?.id ?? null;
  }

  mouseDown(point: Position, targets: readonly MouseHitTarget[] = []): string | null {
    this.#mouseDownPoint = { ...point };
    this.#mouseDownTarget = this.hitTest(point, targets);
    return this.#mouseDownTarget;
  }

  mouseUp(point: Position, timeMs: number, targets: readonly MouseHitTarget[] = []): MouseInteraction | null {
    if (!this.#mouseDownPoint) {
      return null;
    }
    const targetId = this.hitTest(point, targets) ?? this.#mouseDownTarget;
    const distance = distance2d(point, this.#mouseDownPoint);
    const type = distance >= this.dragThreshold
      ? "drag"
      : (timeMs - this.#lastClickTimeMs) <= this.doubleClickWindowMs
        ? "double-click"
        : "click";
    if (type !== "drag") {
      this.#lastClickTimeMs = timeMs;
    }
    this.#mouseDownPoint = null;
    this.#mouseDownTarget = null;
    return { type, targetId, distance };
  }
}

export class KeyPressedHandler {
  readonly #pressed = new Set<string>();
  #modifiers: ModifierState = DEFAULT_MODIFIERS;
  readonly #shortcuts = new Map<string, string>();

  bindShortcut(combo: string, action: string): void {
    this.#shortcuts.set(normalizeShortcut(combo), action);
  }

  keyDown(key: string, modifiers: Partial<ModifierState> = {}): string[] {
    this.#pressed.add(key);
    this.#modifiers = { ...this.#modifiers, ...modifiers };
    const combos = this.#buildCombos(key);
    return combos
      .map((combo) => this.#shortcuts.get(combo))
      .filter((action): action is string => typeof action === "string");
  }

  keyUp(key: string, modifiers: Partial<ModifierState> = {}): void {
    this.#pressed.delete(key);
    this.#modifiers = { ...this.#modifiers, ...modifiers };
  }

  isPressed(key: string): boolean {
    return this.#pressed.has(key);
  }

  get modifiers(): ModifierState {
    return cloneModifiers(this.#modifiers);
  }

  #buildCombos(key: string): string[] {
    const modifiers: string[] = [];
    if (this.#modifiers.ctrl) modifiers.push("ctrl");
    if (this.#modifiers.alt) modifiers.push("alt");
    if (this.#modifiers.meta) modifiers.push("meta");
    if (this.#modifiers.shift) modifiers.push("shift");
    return [normalizeShortcut([...modifiers, key].join("+"))];
  }
}

export class CollisionHandler {
  getAabbCollisions(targets: readonly AabbCollisionTarget[]): CollisionPair[] {
    const collisions: CollisionPair[] = [];
    for (let index = 0; index < targets.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < targets.length; otherIndex += 1) {
        const left = targets[index]!;
        const right = targets[otherIndex]!;
        if (aabbIntersects(left.bounds, right.bounds)) {
          collisions.push({ leftId: left.id, rightId: right.id });
        }
      }
    }
    return collisions;
  }

  getSphereCollisions(targets: readonly SphereCollisionTarget[]): CollisionPair[] {
    const collisions: CollisionPair[] = [];
    for (let index = 0; index < targets.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < targets.length; otherIndex += 1) {
        const left = targets[index]!;
        const right = targets[otherIndex]!;
        if (sphereIntersects(left.sphere, right.sphere)) {
          collisions.push({ leftId: left.id, rightId: right.id });
        }
      }
    }
    return collisions;
  }
}

export class ProximityHandler {
  readonly #insidePairs = new Map<string, boolean>();

  update(left: ProximityTarget, right: ProximityTarget, threshold: number): ProximityEvent | null {
    if (!Number.isFinite(threshold) || threshold < 0) {
      throw new TypeError("threshold must be a non-negative finite number");
    }
    const key = [left.id, right.id].sort().join("::");
    const distance = distanceBetween(left.position, right.position);
    const inside = distance <= threshold;
    const previous = this.#insidePairs.get(key) ?? false;
    if (inside === previous) {
      return null;
    }
    this.#insidePairs.set(key, inside);
    return {
      type: inside ? "enter" : "exit",
      sourceId: left.id,
      targetId: right.id,
      distance,
    };
  }
}

export class ViewEventHandler {
  readonly #events: ViewEvent[] = [];
  #sceneName = "scene";
  #timeSeconds = 0;
  #frameIndex = 0;

  startScene(sceneName: string): ViewEvent {
    this.#sceneName = sceneName;
    this.#timeSeconds = 0;
    this.#frameIndex = 0;
    return this.#record("scene-start");
  }

  endScene(): ViewEvent {
    return this.#record("scene-end");
  }

  advanceFrame(deltaSeconds: number): ViewEvent[] {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new TypeError("deltaSeconds must be a non-negative finite number");
    }
    this.#timeSeconds += deltaSeconds;
    this.#frameIndex += 1;
    return [this.#record("frame"), this.#record("time")];
  }

  get events(): ViewEvent[] {
    return [...this.#events];
  }

  #record(type: ViewEvent["type"]): ViewEvent {
    const event: ViewEvent = {
      type,
      sceneName: this.#sceneName,
      timeSeconds: this.#timeSeconds,
      frameIndex: this.#frameIndex,
    };
    this.#events.push(event);
    return event;
  }
}

export class TimerEventHandler {
  readonly #callbacks = new Map<string, { intervalSeconds: number; callback: () => void; elapsed: number }>();
  #paused = false;

  register(callback: TimerCallback): void {
    if (!Number.isFinite(callback.intervalSeconds) || callback.intervalSeconds <= 0) {
      throw new TypeError("intervalSeconds must be a positive finite number");
    }
    this.#callbacks.set(callback.id, {
      intervalSeconds: callback.intervalSeconds,
      callback: callback.callback,
      elapsed: 0,
    });
  }

  pause(): void {
    this.#paused = true;
  }

  resume(): void {
    this.#paused = false;
  }

  tick(deltaSeconds: number): number {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new TypeError("deltaSeconds must be a non-negative finite number");
    }
    if (this.#paused) {
      return 0;
    }
    let fired = 0;
    for (const entry of this.#callbacks.values()) {
      entry.elapsed += deltaSeconds;
      while (entry.elapsed >= entry.intervalSeconds) {
        entry.elapsed -= entry.intervalSeconds;
        entry.callback();
        fired += 1;
      }
    }
    return fired;
  }
}
