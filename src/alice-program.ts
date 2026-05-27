import { SProgram } from "./story-api/expanded-entities";
import { Scene } from "./story-api/scene";

export const ProgramState = Object.freeze({
  RUNNING: "running",
  PAUSED: "paused",
  STOPPED: "stopped",
} as const);

export type ProgramState = (typeof ProgramState)[keyof typeof ProgramState];

export const SceneSetupPhase = Object.freeze({
  BINDING: "binding",
  ACTIVATING: "activating",
  READY: "ready",
} as const);

export type SceneSetupPhase = (typeof SceneSetupPhase)[keyof typeof SceneSetupPhase];

export const UserMainMethod = "myFirstMethod";

export type ProgramMethod = (program: AliceProgram) => unknown;

export interface SceneSetupResult {
  readonly sceneName: string | null;
  readonly phases: readonly SceneSetupPhase[];
  readonly activated: boolean;
}

export interface ProgramExecutionResult {
  readonly entryPoint: string;
  readonly scene: SceneSetupResult;
  readonly value: unknown;
  readonly elapsedMs: number;
  readonly state: ProgramState;
}

function firstMapKey<T>(map: ReadonlyMap<string, T>): string | null {
  const iterator = map.keys().next();
  return iterator.done ? null : iterator.value;
}

export class ProgramClock {
  #elapsedMs = 0;
  #running = false;

  get elapsedMs(): number {
    return this.#elapsedMs;
  }

  get isRunning(): boolean {
    return this.#running;
  }

  start(): void {
    this.#running = true;
  }

  pause(): void {
    this.#running = false;
  }

  resume(): void {
    this.#running = true;
  }

  reset(): void {
    this.#elapsedMs = 0;
    this.#running = false;
  }

  advance(deltaMs: number): number {
    if (!this.#running) {
      return this.#elapsedMs;
    }
    if (Number.isFinite(deltaMs) && deltaMs > 0) {
      this.#elapsedMs += deltaMs;
    }
    return this.#elapsedMs;
  }
}

export class AliceProgram {
  readonly runtime = new SProgram();
  readonly #scenes = new Map<string, Scene>();
  readonly #types = new Map<string, unknown>();
  readonly #methods = new Map<string, ProgramMethod>();
  #activeSceneName: string | null = null;

  addScene(name: string, scene: Scene): Scene {
    if (!name.trim()) {
      throw new TypeError("scene name must be a non-empty string");
    }
    this.#scenes.set(name, scene);
    if (this.#activeSceneName === null) {
      this.#activeSceneName = name;
    }
    return scene;
  }

  getScene(name: string): Scene | undefined {
    return this.#scenes.get(name);
  }

  listSceneNames(): string[] {
    return [...this.#scenes.keys()].sort((left, right) => left.localeCompare(right));
  }

  registerType<T>(name: string, type: T): T {
    if (!name.trim()) {
      throw new TypeError("type name must be a non-empty string");
    }
    this.#types.set(name, type);
    return type;
  }

  getType<T>(name: string): T | undefined {
    return this.#types.get(name) as T | undefined;
  }

  listTypeNames(): string[] {
    return [...this.#types.keys()].sort((left, right) => left.localeCompare(right));
  }

  registerMethod(name: string, method: ProgramMethod): ProgramMethod {
    if (!name.trim()) {
      throw new TypeError("method name must be a non-empty string");
    }
    this.#methods.set(name, method);
    return method;
  }

  setEntryPoint(method: ProgramMethod): ProgramMethod {
    return this.registerMethod(UserMainMethod, method);
  }

  setActiveScene(name: string): Scene {
    const scene = this.#scenes.get(name);
    if (!scene) {
      throw new TypeError(`unknown scene: ${name}`);
    }
    this.#activeSceneName = name;
    return scene;
  }

  get activeSceneName(): string | null {
    return this.#activeSceneName;
  }

  get activeScene(): Scene | null {
    return this.#activeSceneName ? this.#scenes.get(this.#activeSceneName) ?? null : null;
  }

  prepareScene(name: string | null = this.#activeSceneName ?? firstMapKey(this.#scenes)): SceneSetupResult {
    if (name === null) {
      return { sceneName: null, phases: [SceneSetupPhase.READY], activated: false };
    }
    const scene = this.#scenes.get(name);
    if (!scene) {
      throw new TypeError(`unknown scene: ${name}`);
    }
    this.#activeSceneName = name;
    this.runtime.setActiveScene(scene);
    scene.activate();
    return {
      sceneName: name,
      phases: [SceneSetupPhase.BINDING, SceneSetupPhase.ACTIVATING, SceneSetupPhase.READY],
      activated: scene.isActive,
    };
  }

  invoke(entryPoint = UserMainMethod): unknown {
    const method = this.#methods.get(entryPoint);
    if (!method) {
      throw new TypeError(`unknown entry point: ${entryPoint}`);
    }
    return method(this);
  }
}

export class ProgramRunner {
  #state: ProgramState = ProgramState.STOPPED;
  #pendingEntryPoint: string | null = null;
  #lastResult: ProgramExecutionResult | null = null;

  constructor(
    readonly program: AliceProgram,
    readonly clock: ProgramClock = new ProgramClock(),
  ) {}

  get state(): ProgramState {
    return this.#state;
  }

  get lastResult(): ProgramExecutionResult | null {
    return this.#lastResult;
  }

  start(entryPoint = UserMainMethod): void {
    if (this.#state === ProgramState.RUNNING) {
      throw new Error("program runner is already running");
    }
    this.#pendingEntryPoint = entryPoint;
    this.#state = ProgramState.RUNNING;
    this.clock.start();
  }

  pause(): void {
    if (this.#state !== ProgramState.RUNNING) {
      return;
    }
    this.#state = ProgramState.PAUSED;
    this.clock.pause();
  }

  resume(): void {
    if (this.#state !== ProgramState.PAUSED) {
      return;
    }
    this.#state = ProgramState.RUNNING;
    this.clock.resume();
  }

  stop(): void {
    this.#pendingEntryPoint = null;
    this.#state = ProgramState.STOPPED;
    this.clock.pause();
  }

  tick(deltaMs = 0): ProgramExecutionResult | null {
    if (this.#state !== ProgramState.RUNNING || this.#pendingEntryPoint === null) {
      return this.#lastResult;
    }
    this.clock.advance(deltaMs);
    const entryPoint = this.#pendingEntryPoint;
    const scene = this.program.prepareScene();
    const value = this.program.invoke(entryPoint);
    this.#pendingEntryPoint = null;
    this.#state = ProgramState.STOPPED;
    this.clock.pause();
    this.#lastResult = {
      entryPoint,
      scene,
      value,
      elapsedMs: this.clock.elapsedMs,
      state: this.#state,
    };
    return this.#lastResult;
  }

  execute(entryPoint = UserMainMethod, deltaMs = 0): ProgramExecutionResult {
    this.start(entryPoint);
    const result = this.tick(deltaMs);
    if (!result) {
      throw new Error("program runner did not produce a result");
    }
    return result;
  }
}
