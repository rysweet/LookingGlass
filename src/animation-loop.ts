import type { Orientation, Vec3 } from "./story-api/types.js";

export type AnimationEasing = "linear" | "ease-in-out" | ((t: number) => number);

export interface AnimationDefinition<T> {
  readonly entityId: string;
  readonly durationMs: number;
  readonly from: T;
  readonly to: T;
  readonly interpolate: (from: T, to: T, portion: number) => T;
  readonly apply: (value: T, progress: number) => void;
  readonly easing?: AnimationEasing;
  readonly onStart?: () => void;
  readonly onComplete?: () => void;
}

interface ScheduledAnimation<T> extends AnimationDefinition<T> {
  readonly startTimeMs: number;
  started: boolean;
  readonly resolve: () => void;
}

type StoredAnimation = ScheduledAnimation<unknown>;

export type FrameHandle = number | ReturnType<typeof setTimeout>;

export interface FrameScheduler {
  requestAnimationFrame(callback: (timestampMs: number) => void): FrameHandle;
  cancelAnimationFrame(handle: FrameHandle): void;
  now(): number;
}

export interface AnimationLoopOptions {
  readonly queue?: AnimationQueue;
  readonly render?: (simulationTimeMs: number) => void;
  readonly scheduler?: Partial<FrameScheduler>;
}

const DEFAULT_FRAME_MS = 1000 / 60;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function sanitizeDuration(durationMs: number): number {
  return Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
}

function resolveEasing(easing: AnimationEasing | undefined): (t: number) => number {
  if (typeof easing === "function") {
    return easing;
  }
  if (easing === "ease-in-out") {
    return easeInOut;
  }
  return linear;
}

function normalizeOrientation(value: Orientation): Orientation {
  const length = Math.hypot(value.x, value.y, value.z, value.w);
  if (!Number.isFinite(length) || length === 0) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  return {
    x: value.x / length,
    y: value.y / length,
    z: value.z / length,
    w: value.w / length,
  };
}

function defaultScheduler(): FrameScheduler {
  const request = globalThis.requestAnimationFrame?.bind(globalThis)
    ?? ((callback: (timestampMs: number) => void): FrameHandle => globalThis.setTimeout(() => callback(now()), DEFAULT_FRAME_MS));
  const cancel = globalThis.cancelAnimationFrame?.bind(globalThis)
    ?? ((handle: FrameHandle): void => {
      globalThis.clearTimeout(handle);
    });
  return {
    requestAnimationFrame: request,
    cancelAnimationFrame: cancel,
    now,
  };
}

function now(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function linear(t: number): number {
  return clamp01(t);
}

export function easeInOut(t: number): number {
  const portion = clamp01(t);
  return portion * portion * (3 - (2 * portion));
}

export function interpolateVec3Linear(from: Vec3, to: Vec3, portion: number): Vec3 {
  const t = clamp01(portion);
  return {
    x: from.x + ((to.x - from.x) * t),
    y: from.y + ((to.y - from.y) * t),
    z: from.z + ((to.z - from.z) * t),
  };
}

export function slerpOrientation(from: Orientation, to: Orientation, portion: number): Orientation {
  const t = clamp01(portion);
  let start = normalizeOrientation(from);
  let end = normalizeOrientation(to);
  let dot = (start.x * end.x) + (start.y * end.y) + (start.z * end.z) + (start.w * end.w);

  if (dot < 0) {
    dot = -dot;
    end = { x: -end.x, y: -end.y, z: -end.z, w: -end.w };
  }

  if (dot > 0.9995) {
    return normalizeOrientation({
      x: start.x + ((end.x - start.x) * t),
      y: start.y + ((end.y - start.y) * t),
      z: start.z + ((end.z - start.z) * t),
      w: start.w + ((end.w - start.w) * t),
    });
  }

  const theta0 = Math.acos(clamp01(dot));
  const theta = theta0 * t;
  const sinTheta = Math.sin(theta);
  const sinTheta0 = Math.sin(theta0);
  const s0 = Math.cos(theta) - ((dot * sinTheta) / sinTheta0);
  const s1 = sinTheta / sinTheta0;

  start = normalizeOrientation(start);
  return normalizeOrientation({
    x: (start.x * s0) + (end.x * s1),
    y: (start.y * s0) + (end.y * s1),
    z: (start.z * s0) + (end.z * s1),
    w: (start.w * s0) + (end.w * s1),
  });
}

export class AnimationQueue {
  #currentTimeMs = 0;
  readonly #animations: StoredAnimation[] = [];
  readonly #entityTailTimes = new Map<string, number>();
  #globalTailTimeMs = 0;
  #sequentialDepth = 0;

  get currentTimeMs(): number {
    return this.#currentTimeMs;
  }

  get size(): number {
    return this.#animations.length;
  }

  /** Enter a globally-sequential block (DoInOrder). Nestable. */
  beginSequentialBlock(): void {
    this.#sequentialDepth++;
    this.#globalTailTimeMs = Math.max(this.#globalTailTimeMs, this.#currentTimeMs);
  }

  /** Exit a globally-sequential block. */
  endSequentialBlock(): void {
    this.#sequentialDepth = Math.max(0, this.#sequentialDepth - 1);
  }

  get isSequential(): boolean {
    return this.#sequentialDepth > 0;
  }

  enqueue<T>(animation: AnimationDefinition<T>): Promise<void> {
    const durationMs = sanitizeDuration(animation.durationMs);
    if (durationMs === 0) {
      animation.onStart?.();
      animation.apply(animation.to, 1);
      animation.onComplete?.();
      return Promise.resolve();
    }

    const entityTail = this.#entityTailTimes.get(animation.entityId) ?? this.#currentTimeMs;
    const startTimeMs = this.#sequentialDepth > 0
      ? Math.max(this.#currentTimeMs, entityTail, this.#globalTailTimeMs)
      : Math.max(this.#currentTimeMs, entityTail);
    const endTimeMs = startTimeMs + durationMs;
    this.#entityTailTimes.set(animation.entityId, endTimeMs);
    if (this.#sequentialDepth > 0) {
      this.#globalTailTimeMs = endTimeMs;
    }

    return new Promise<void>((resolve) => {
      this.#animations.push({
        ...animation,
        durationMs,
        startTimeMs,
        started: false,
        resolve,
      } as StoredAnimation);
      this.#animations.sort((left, right) => left.startTimeMs - right.startTimeMs);
    });
  }

  update(currentTimeMs: number): void {
    this.#currentTimeMs = Math.max(0, currentTimeMs);

    for (const animation of [...this.#animations]) {
      if (this.#currentTimeMs < animation.startTimeMs) {
        continue;
      }

      if (!animation.started) {
        animation.started = true;
        animation.onStart?.();
      }

      const elapsedMs = this.#currentTimeMs - animation.startTimeMs;
      const progress = clamp01(elapsedMs / animation.durationMs);
      const eased = resolveEasing(animation.easing)(progress);
      const value = animation.interpolate(animation.from, animation.to, eased);
      animation.apply(value, progress);

      if (progress >= 1) {
        animation.onComplete?.();
        animation.resolve();
        this.#remove(animation);
      }
    }
  }

  advance(deltaMs: number): void {
    this.update(this.#currentTimeMs + Math.max(0, deltaMs));
  }

  clear(): void {
    this.#animations.length = 0;
    this.#entityTailTimes.clear();
    this.#currentTimeMs = 0;
    this.#globalTailTimeMs = 0;
    this.#sequentialDepth = 0;
  }

  #remove(animation: StoredAnimation): void {
    const index = this.#animations.indexOf(animation);
    if (index >= 0) {
      this.#animations.splice(index, 1);
    }

    const hasPendingForEntity = this.#animations.some((candidate) => candidate.entityId === animation.entityId);
    if (!hasPendingForEntity) {
      this.#entityTailTimes.delete(animation.entityId);
    }
  }
}

export class AnimationLoop {
  readonly queue: AnimationQueue;
  readonly #render: (simulationTimeMs: number) => void;
  readonly #scheduler: FrameScheduler;

  #frameHandle: FrameHandle | null = null;
  #lastWallTimeMs: number | null = null;
  #simulationTimeMs = 0;
  #state: "stopped" | "playing" | "paused" = "stopped";

  constructor(options: AnimationLoopOptions = {}) {
    this.queue = options.queue ?? new AnimationQueue();
    this.#render = options.render ?? (() => undefined);
    const scheduler = defaultScheduler();
    this.#scheduler = {
      requestAnimationFrame: options.scheduler?.requestAnimationFrame ?? scheduler.requestAnimationFrame,
      cancelAnimationFrame: options.scheduler?.cancelAnimationFrame ?? scheduler.cancelAnimationFrame,
      now: options.scheduler?.now ?? scheduler.now,
    };
  }

  get state(): "stopped" | "playing" | "paused" {
    return this.#state;
  }

  get simulationTimeMs(): number {
    return this.#simulationTimeMs;
  }

  play(): void {
    if (this.#state === "playing") {
      return;
    }
    if (this.#state === "stopped") {
      this.#simulationTimeMs = 0;
      this.queue.update(0);
    }
    this.#state = "playing";
    this.#lastWallTimeMs = null;
    this.#scheduleNextFrame();
  }

  pause(): void {
    if (this.#frameHandle !== null) {
      this.#scheduler.cancelAnimationFrame(this.#frameHandle);
      this.#frameHandle = null;
    }
    if (this.#state === "playing") {
      this.#state = "paused";
    }
  }

  stop(): void {
    this.pause();
    this.#state = "stopped";
    this.#lastWallTimeMs = null;
    this.#simulationTimeMs = 0;
    this.queue.clear();
    this.#render(this.#simulationTimeMs);
  }

  step(deltaMs = DEFAULT_FRAME_MS): void {
    if (this.#state === "playing") {
      this.pause();
    }
    if (this.#state === "stopped") {
      this.#state = "paused";
    }
    this.#advance(Math.max(0, deltaMs));
  }

  #scheduleNextFrame(): void {
    if (this.#frameHandle !== null || this.#state !== "playing") {
      return;
    }

    this.#frameHandle = this.#scheduler.requestAnimationFrame((timestampMs) => {
      this.#frameHandle = null;
      if (this.#state !== "playing") {
        return;
      }
      const previousWallTime = this.#lastWallTimeMs ?? timestampMs;
      this.#lastWallTimeMs = timestampMs;
      this.#advance(Math.max(0, timestampMs - previousWallTime));
      this.#scheduleNextFrame();
    });
  }

  #advance(deltaMs: number): void {
    this.#simulationTimeMs += deltaMs;
    this.queue.update(this.#simulationTimeMs);
    this.#render(this.#simulationTimeMs);
  }
}
