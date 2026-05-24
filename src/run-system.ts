export type RunStatus = "idle" | "starting" | "running" | "completed" | "error";
export type RunCompletionReason = "completed" | "stopped" | "error";

export interface RunErrorInfo {
  phase: "initialize" | "step" | "dispose";
  cause: unknown;
  frame: number;
}

export interface RunContext {
  readonly frame: number;
  readonly elapsedMs: number;
  readonly signal: AbortSignal;
  readonly speed: number;
}

export interface RunnableProgram {
  initialize?(context: RunContext): void | Promise<void>;
  step(context: RunContext): boolean | void | Promise<boolean | void>;
  dispose?(context: RunContext): void | Promise<void>;
}

export interface RunResult {
  reason: RunCompletionReason;
  frameCount: number;
  elapsedMs: number;
  error: RunErrorInfo | null;
}

export interface RunSystemOptions {
  tickMs?: number;
  speed?: number;
}

export class RunSystemError extends Error {
  constructor(message: string, public readonly info: RunErrorInfo) {
    super(message);
    this.name = "RunSystemError";
  }
}

export class RunSystem {
  private readonly baseTickMs: number;
  private runFactory: (() => RunnableProgram) | null = null;
  private currentProgram: RunnableProgram | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private wakeDelay: (() => void) | null = null;
  private sleepInterrupted = false;
  private abortController: AbortController | null = null;
  private completionPromise: Promise<RunResult> | null = null;
  private completionResolve: ((result: RunResult) => void) | null = null;
  private frame = 0;
  private elapsedMs = 0;
  private stopRequested = false;

  status: RunStatus = "idle";
  speed: number;
  lastError: RunErrorInfo | null = null;
  lastResult: RunResult | null = null;

  constructor(options: RunSystemOptions = {}) {
    this.baseTickMs = Math.max(1, options.tickMs ?? 16);
    this.speed = clampSpeed(options.speed ?? 1);
  }

  get isRunning(): boolean {
    return this.status === "starting" || this.status === "running";
  }

  async start(programOrFactory: RunnableProgram | (() => RunnableProgram)): Promise<void> {
    if (this.isRunning) {
      await this.stop();
    }
    this.runFactory = typeof programOrFactory === "function"
      ? programOrFactory as () => RunnableProgram
      : () => programOrFactory;
    this.currentProgram = this.runFactory();
    this.abortController = new AbortController();
    this.frame = 0;
    this.elapsedMs = 0;
    this.stopRequested = false;
    this.lastError = null;
    this.lastResult = null;
    this.status = "starting";
    this.completionPromise = new Promise<RunResult>((resolve) => {
      this.completionResolve = resolve;
    });

    const context = this.createContext();
    try {
      await this.currentProgram.initialize?.(context);
    } catch (cause) {
      await this.fail("initialize", cause);
      return;
    }
    if (this.stopRequested) {
      await this.finish("stopped");
      return;
    }
    this.status = "running";
    void this.runLoop();
  }

  async restart(): Promise<void> {
    if (!this.runFactory) {
      throw new RunSystemError("Cannot restart before a program has been started", {
        phase: "initialize",
        cause: new Error("missing run factory"),
        frame: this.frame,
      });
    }
    await this.stop();
    await this.start(this.runFactory);
  }

  async stop(): Promise<RunResult | null> {
    if (!this.completionPromise) {
      return null;
    }
    this.stopRequested = true;
    this.abortController?.abort();
    this.wakeIfSleeping();
    return this.completionPromise;
  }

  setSpeed(speed: number): void {
    this.speed = clampSpeed(speed);
  }

  async waitForCompletion(): Promise<RunResult | null> {
    return this.completionPromise ?? this.lastResult;
  }

  private async runLoop(): Promise<void> {
    while (this.currentProgram && !this.stopRequested) {
      try {
        const shouldContinue = await this.currentProgram.step(this.createContext());
        this.frame += 1;
        if (shouldContinue === false) {
          await this.finish("completed");
          return;
        }
      } catch (cause) {
        await this.fail("step", cause);
        return;
      }
      if (this.stopRequested) {
        break;
      }
      const completedDelay = await this.delayForNextStep();
      if (completedDelay) {
        this.elapsedMs += this.currentDelayMs();
      }
    }
    await this.finish("stopped");
  }

  private currentDelayMs(): number {
    return Math.max(1, Math.round(this.baseTickMs / this.speed));
  }

  private async delayForNextStep(): Promise<boolean> {
    this.sleepInterrupted = false;
    return new Promise<boolean>((resolve) => {
      this.wakeDelay = () => resolve(!this.sleepInterrupted);
      this.timer = setTimeout(() => {
        this.timer = null;
        this.wakeDelay = null;
        resolve(true);
      }, this.currentDelayMs());
    });
  }

  private wakeIfSleeping(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      this.sleepInterrupted = true;
    }
    if (this.wakeDelay) {
      const wake = this.wakeDelay;
      this.wakeDelay = null;
      wake();
    }
  }

  private createContext(): RunContext {
    return {
      frame: this.frame,
      elapsedMs: this.elapsedMs,
      signal: this.abortController?.signal ?? new AbortController().signal,
      speed: this.speed,
    };
  }

  private async fail(phase: RunErrorInfo["phase"], cause: unknown): Promise<void> {
    this.lastError = { phase, cause, frame: this.frame };
    this.status = "error";
    await this.disposeCurrentProgram();
    this.resolveCompletion({ reason: "error", frameCount: this.frame, elapsedMs: this.elapsedMs, error: this.lastError });
  }

  private async finish(reason: Exclude<RunCompletionReason, "error">): Promise<void> {
    if (this.status === "completed" || this.status === "error" || this.status === "idle") {
      return;
    }
    await this.disposeCurrentProgram();
    this.status = reason === "completed" ? "completed" : "idle";
    this.resolveCompletion({ reason, frameCount: this.frame, elapsedMs: this.elapsedMs, error: null });
  }

  private async disposeCurrentProgram(): Promise<void> {
    const program = this.currentProgram;
    this.currentProgram = null;
    if (!program) {
      return;
    }
    try {
      await program.dispose?.(this.createContext());
    } catch (cause) {
      this.lastError ??= { phase: "dispose", cause, frame: this.frame };
      this.status = "error";
    }
  }

  private resolveCompletion(result: RunResult): void {
    this.wakeIfSleeping();
    this.abortController = null;
    if (this.lastError && result.reason !== "error") {
      result = { ...result, reason: "error", error: this.lastError };
    }
    this.lastResult = result;
    const resolve = this.completionResolve;
    this.completionResolve = null;
    this.completionPromise = null;
    resolve?.(result);
  }
}

function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new TypeError("speed must be a positive finite number");
  }
  return Math.max(0.25, Math.min(speed, 16));
}
