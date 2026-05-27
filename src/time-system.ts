export interface ClockSnapshot {
  readonly elapsedSeconds: number;
  readonly deltaSeconds: number;
  readonly fixedDeltaSeconds: number;
  readonly pendingFixedSteps: number;
  readonly interpolationAlpha: number;
}

export interface TimerTickResult {
  readonly fired: number;
  readonly remainingSeconds: number;
  readonly complete: boolean;
  readonly running: boolean;
}

export interface TimeManagerUpdateResult {
  readonly deltaSeconds: number;
  readonly clock: ClockSnapshot;
  readonly consumedFixedSteps: number;
  readonly firedTimers: Array<{ timer: Timer; fired: number }>;
  readonly executedTasks: ScheduledTask[];
}

export interface AnimationClockSnapshot {
  readonly elapsedSeconds: number;
  readonly deltaSeconds: number;
  readonly durationSeconds: number;
  readonly progress: number;
  readonly paused: boolean;
  readonly complete: boolean;
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative finite number`);
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive finite number`);
  }
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampSpeed(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError("speed must be a positive finite number");
  }
  return Math.max(0.01, Math.min(value, 64));
}

export class Clock {
  elapsedSeconds = 0;
  deltaSeconds = 0;
  readonly fixedDeltaSeconds: number;
  #accumulatorSeconds = 0;

  constructor(fixedDeltaSeconds = 1 / 60) {
    assertPositiveFinite(fixedDeltaSeconds, "fixedDeltaSeconds");
    this.fixedDeltaSeconds = fixedDeltaSeconds;
  }

  get pendingFixedSteps(): number {
    return Math.floor(this.#accumulatorSeconds / this.fixedDeltaSeconds);
  }

  get interpolationAlpha(): number {
    return (this.#accumulatorSeconds / this.fixedDeltaSeconds) - this.pendingFixedSteps;
  }

  tick(deltaSeconds: number): ClockSnapshot {
    assertNonNegativeFinite(deltaSeconds, "deltaSeconds");
    this.deltaSeconds = deltaSeconds;
    this.elapsedSeconds += deltaSeconds;
    this.#accumulatorSeconds += deltaSeconds;
    return this.snapshot();
  }

  consumeFixedSteps(limit = Number.POSITIVE_INFINITY): number {
    const boundedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : this.pendingFixedSteps;
    const consumed = Math.min(this.pendingFixedSteps, boundedLimit);
    this.#accumulatorSeconds -= consumed * this.fixedDeltaSeconds;
    return consumed;
  }

  reset(): void {
    this.elapsedSeconds = 0;
    this.deltaSeconds = 0;
    this.#accumulatorSeconds = 0;
  }

  snapshot(): ClockSnapshot {
    return {
      elapsedSeconds: this.elapsedSeconds,
      deltaSeconds: this.deltaSeconds,
      fixedDeltaSeconds: this.fixedDeltaSeconds,
      pendingFixedSteps: this.pendingFixedSteps,
      interpolationAlpha: this.interpolationAlpha,
    };
  }
}

export class Timer {
  readonly durationSeconds: number;
  readonly repeat: boolean;
  readonly #callback?: () => void;
  remainingSeconds: number;
  running: boolean;
  complete = false;

  constructor(durationSeconds: number, options: { repeat?: boolean; callback?: () => void; autoStart?: boolean } = {}) {
    assertPositiveFinite(durationSeconds, "durationSeconds");
    this.durationSeconds = durationSeconds;
    this.repeat = options.repeat ?? false;
    this.#callback = options.callback;
    this.remainingSeconds = durationSeconds;
    this.running = options.autoStart ?? true;
  }

  static countdown(durationSeconds: number, callback?: () => void): Timer {
    return new Timer(durationSeconds, { callback });
  }

  static oneShot(durationSeconds: number, callback?: () => void): Timer {
    return new Timer(durationSeconds, { callback });
  }

  static repeating(intervalSeconds: number, callback?: () => void): Timer {
    return new Timer(intervalSeconds, { repeat: true, callback });
  }

  start(): void {
    if (this.complete && !this.repeat) {
      this.reset();
    }
    this.running = true;
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    this.complete = true;
    this.remainingSeconds = 0;
  }

  reset(): void {
    this.remainingSeconds = this.durationSeconds;
    this.complete = false;
    this.running = true;
  }

  tick(deltaSeconds: number): TimerTickResult {
    assertNonNegativeFinite(deltaSeconds, "deltaSeconds");
    if (!this.running || deltaSeconds === 0) {
      return this.snapshot(0);
    }

    let fired = 0;
    let remainingDelta = deltaSeconds;
    while (remainingDelta > 0 && this.running) {
      if (remainingDelta < this.remainingSeconds) {
        this.remainingSeconds -= remainingDelta;
        remainingDelta = 0;
        break;
      }

      remainingDelta -= this.remainingSeconds;
      fired += 1;
      this.#callback?.();
      if (this.repeat) {
        this.remainingSeconds = this.durationSeconds;
      } else {
        this.remainingSeconds = 0;
        this.running = false;
        this.complete = true;
      }
    }

    if (!this.repeat && this.remainingSeconds === 0) {
      this.complete = true;
    }
    return this.snapshot(fired);
  }

  snapshot(fired = 0): TimerTickResult {
    return {
      fired,
      remainingSeconds: this.remainingSeconds,
      complete: this.complete,
      running: this.running,
    };
  }
}

export class ScheduledTask {
  readonly action: () => void;
  delaySeconds: number;
  remainingSeconds: number;
  executed = false;
  cancelled = false;

  constructor(delaySeconds: number, action: () => void) {
    assertNonNegativeFinite(delaySeconds, "delaySeconds");
    this.delaySeconds = delaySeconds;
    this.remainingSeconds = delaySeconds;
    this.action = action;
  }

  get pending(): boolean {
    return !this.executed && !this.cancelled;
  }

  tick(deltaSeconds: number): boolean {
    assertNonNegativeFinite(deltaSeconds, "deltaSeconds");
    if (!this.pending) {
      return false;
    }
    this.remainingSeconds = Math.max(0, this.remainingSeconds - deltaSeconds);
    if (this.remainingSeconds > 0) {
      return false;
    }
    this.executed = true;
    this.action();
    return true;
  }

  cancel(): void {
    this.cancelled = true;
  }

  reschedule(delaySeconds = this.delaySeconds): void {
    assertNonNegativeFinite(delaySeconds, "delaySeconds");
    this.delaySeconds = delaySeconds;
    this.remainingSeconds = delaySeconds;
    this.executed = false;
    this.cancelled = false;
  }
}

export class TimeManager {
  readonly clock: Clock;
  paused = false;
  speed: number;
  readonly #timers = new Set<Timer>();
  readonly #tasks = new Set<ScheduledTask>();

  constructor(options: { fixedDeltaSeconds?: number; speed?: number } = {}) {
    this.clock = new Clock(options.fixedDeltaSeconds);
    this.speed = clampSpeed(options.speed ?? 1);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  setSpeed(speed: number): void {
    this.speed = clampSpeed(speed);
  }

  registerTimer(timer: Timer): Timer {
    this.#timers.add(timer);
    return timer;
  }

  schedule(task: ScheduledTask): ScheduledTask {
    this.#tasks.add(task);
    return task;
  }

  update(deltaSeconds: number): TimeManagerUpdateResult {
    assertNonNegativeFinite(deltaSeconds, "deltaSeconds");
    const adjustedDelta = this.paused ? 0 : deltaSeconds * this.speed;
    const clock = this.clock.tick(adjustedDelta);
    const consumedFixedSteps = this.clock.consumeFixedSteps();
    const firedTimers: Array<{ timer: Timer; fired: number }> = [];
    for (const timer of this.#timers) {
      const result = timer.tick(adjustedDelta);
      if (result.fired > 0) {
        firedTimers.push({ timer, fired: result.fired });
      }
    }
    const executedTasks: ScheduledTask[] = [];
    for (const task of this.#tasks) {
      if (task.tick(adjustedDelta)) {
        executedTasks.push(task);
      }
      if (!task.pending) {
        this.#tasks.delete(task);
      }
    }
    return {
      deltaSeconds: adjustedDelta,
      clock,
      consumedFixedSteps,
      firedTimers,
      executedTasks,
    };
  }
}

export class AnimationClock {
  readonly durationSeconds: number;
  elapsedSeconds = 0;
  deltaSeconds = 0;
  paused = false;
  playbackRate: number;

  constructor(durationSeconds: number, playbackRate = 1) {
    assertNonNegativeFinite(durationSeconds, "durationSeconds");
    this.durationSeconds = durationSeconds;
    this.playbackRate = clampSpeed(playbackRate);
  }

  get progress(): number {
    if (this.durationSeconds === 0) {
      return 1;
    }
    return clampProgress(this.elapsedSeconds / this.durationSeconds);
  }

  get complete(): boolean {
    return this.progress >= 1;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = clampSpeed(rate);
  }

  seek(elapsedSeconds: number): void {
    assertNonNegativeFinite(elapsedSeconds, "elapsedSeconds");
    this.elapsedSeconds = Math.min(elapsedSeconds, this.durationSeconds);
    this.deltaSeconds = 0;
  }

  reset(): void {
    this.elapsedSeconds = 0;
    this.deltaSeconds = 0;
    this.paused = false;
  }

  tick(deltaSeconds: number): AnimationClockSnapshot {
    assertNonNegativeFinite(deltaSeconds, "deltaSeconds");
    if (this.paused || this.complete) {
      this.deltaSeconds = 0;
      return this.snapshot();
    }
    const scaledDelta = deltaSeconds * this.playbackRate;
    const remaining = Math.max(0, this.durationSeconds - this.elapsedSeconds);
    this.deltaSeconds = Math.min(scaledDelta, remaining);
    this.elapsedSeconds = Math.min(this.durationSeconds, this.elapsedSeconds + scaledDelta);
    return this.snapshot();
  }

  snapshot(): AnimationClockSnapshot {
    return {
      elapsedSeconds: this.elapsedSeconds,
      deltaSeconds: this.deltaSeconds,
      durationSeconds: this.durationSeconds,
      progress: this.progress,
      paused: this.paused,
      complete: this.complete,
    };
  }
}
