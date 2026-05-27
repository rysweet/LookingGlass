import { SProgram } from "./story-api/entities.js";
import { Scene } from "./story-api/scene.js";

export type TransitionEffectName =
  | "CUT"
  | "FADE_TO_BLACK"
  | "CROSSFADE"
  | "WIPE_LEFT"
  | "WIPE_RIGHT";

export interface TransitionEffectSnapshot {
  kind: TransitionEffectName;
  duration: number;
  progress: number;
  overlayOpacity: number;
  mix: number;
  wipeProgress: number;
}

export interface SceneTransitionSnapshot {
  fromName: string | null;
  toName: string;
  effect: TransitionEffectSnapshot;
  activationCount: number;
  inventory: string[];
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDuration(duration: number): number {
  return Number.isFinite(duration) && duration >= 0 ? duration : 0;
}

export class TransitionEffect {
  constructor(
    readonly kind: TransitionEffectName,
    readonly duration = 1,
  ) {}

  static cut(): TransitionEffect {
    return new TransitionEffect("CUT", 0);
  }

  static fadeToBlack(duration = 1): TransitionEffect {
    return new TransitionEffect("FADE_TO_BLACK", duration);
  }

  static crossfade(duration = 1): TransitionEffect {
    return new TransitionEffect("CROSSFADE", duration);
  }

  static wipe(direction: "LEFT" | "RIGHT" = "LEFT", duration = 1): TransitionEffect {
    return new TransitionEffect(direction === "LEFT" ? "WIPE_LEFT" : "WIPE_RIGHT", duration);
  }

  snapshot(progress = 1): TransitionEffectSnapshot {
    const normalizedProgress = clamp(progress);
    const duration = normalizeDuration(this.duration);
    const midpointOpacity = normalizedProgress <= 0.5
      ? normalizedProgress * 2
      : (1 - normalizedProgress) * 2;

    switch (this.kind) {
      case "FADE_TO_BLACK":
        return {
          kind: this.kind,
          duration,
          progress: normalizedProgress,
          overlayOpacity: clamp(midpointOpacity),
          mix: normalizedProgress < 0.5 ? 0 : 1,
          wipeProgress: normalizedProgress,
        };
      case "CROSSFADE":
        return {
          kind: this.kind,
          duration,
          progress: normalizedProgress,
          overlayOpacity: 0,
          mix: normalizedProgress,
          wipeProgress: normalizedProgress,
        };
      case "WIPE_LEFT":
      case "WIPE_RIGHT":
        return {
          kind: this.kind,
          duration,
          progress: normalizedProgress,
          overlayOpacity: 0,
          mix: normalizedProgress,
          wipeProgress: normalizedProgress,
        };
      case "CUT":
      default:
        return {
          kind: this.kind,
          duration,
          progress: normalizedProgress,
          overlayOpacity: 0,
          mix: normalizedProgress >= 1 ? 1 : 0,
          wipeProgress: normalizedProgress >= 1 ? 1 : 0,
        };
    }
  }
}

export class SceneInventory {
  readonly #scenes = new Map<string, Scene>();

  constructor(entries: Iterable<[string, Scene]> | Record<string, Scene> = []) {
    const iterable = Symbol.iterator in Object(entries)
      ? entries as Iterable<[string, Scene]>
      : Object.entries(entries);
    for (const [name, scene] of iterable) {
      this.register(name, scene);
    }
  }

  get size(): number {
    return this.#scenes.size;
  }

  register(name: string, scene: Scene): Scene {
    if (!name.trim()) {
      throw new TypeError("scene name must be a non-empty string");
    }
    this.#scenes.set(name, scene);
    return scene;
  }

  remove(name: string): boolean {
    return this.#scenes.delete(name);
  }

  get(name: string): Scene | null {
    return this.#scenes.get(name) ?? null;
  }

  require(name: string): Scene {
    const scene = this.get(name);
    if (!scene) {
      throw new TypeError(`scene \"${name}\" is not registered`);
    }
    return scene;
  }

  has(name: string): boolean {
    return this.#scenes.has(name);
  }

  list(): Array<{ name: string; scene: Scene; isActive: boolean }> {
    return Array.from(this.#scenes.entries()).map(([name, scene]) => ({
      name,
      scene,
      isActive: scene.isActive,
    }));
  }

  listNames(): string[] {
    return Array.from(this.#scenes.keys());
  }

  nameFor(scene: Scene): string | null {
    for (const [name, candidate] of this.#scenes.entries()) {
      if (candidate === scene) {
        return name;
      }
    }
    return null;
  }
}

export class SceneActivation {
  readonly #counts = new Map<Scene, number>();

  constructor(readonly program = new SProgram()) {}

  get activeScene(): Scene | null {
    return this.program.activeScene;
  }

  activate(scene: Scene): number {
    this.program.setActiveScene(scene);
    const nextCount = (this.#counts.get(scene) ?? 0) + 1;
    this.#counts.set(scene, nextCount);
    return nextCount;
  }

  deactivate(scene: Scene | null = this.activeScene): boolean {
    if (!scene) {
      return false;
    }
    if (this.program.activeScene === scene) {
      this.program.setActiveScene(null);
      return true;
    }
    if (scene.isActive) {
      scene.deactivate();
      return true;
    }
    return false;
  }

  getActivationCount(scene: Scene): number {
    return this.#counts.get(scene) ?? 0;
  }
}

export class SceneTransition {
  constructor(
    readonly inventory = new SceneInventory(),
    readonly activation = new SceneActivation(),
  ) {}

  transitionTo(sceneOrName: Scene | string, effect = TransitionEffect.cut()): SceneTransitionSnapshot {
    const fromScene = this.activation.activeScene;
    const [toName, toScene] = this.resolve(sceneOrName);
    const activationCount = this.activation.activate(toScene);
    return {
      fromName: fromScene ? this.inventory.nameFor(fromScene) : null,
      toName,
      effect: effect.snapshot(1),
      activationCount,
      inventory: this.inventory.listNames(),
    };
  }

  preview(sceneOrName: Scene | string, effect = TransitionEffect.cut(), progress = 0.5): SceneTransitionSnapshot {
    const fromScene = this.activation.activeScene;
    const [toName, toScene] = this.resolve(sceneOrName);
    return {
      fromName: fromScene ? this.inventory.nameFor(fromScene) : null,
      toName,
      effect: effect.snapshot(progress),
      activationCount: this.activation.getActivationCount(toScene),
      inventory: this.inventory.listNames(),
    };
  }

  cutTo(sceneOrName: Scene | string): SceneTransitionSnapshot {
    return this.transitionTo(sceneOrName, TransitionEffect.cut());
  }

  fadeTo(sceneOrName: Scene | string, duration = 1): SceneTransitionSnapshot {
    return this.transitionTo(sceneOrName, TransitionEffect.fadeToBlack(duration));
  }

  dissolveTo(sceneOrName: Scene | string, duration = 1): SceneTransitionSnapshot {
    return this.transitionTo(sceneOrName, TransitionEffect.crossfade(duration));
  }

  wipeTo(sceneOrName: Scene | string, direction: "LEFT" | "RIGHT" = "LEFT", duration = 1): SceneTransitionSnapshot {
    return this.transitionTo(sceneOrName, TransitionEffect.wipe(direction, duration));
  }

  private resolve(sceneOrName: Scene | string): [string, Scene] {
    if (typeof sceneOrName === "string") {
      return [sceneOrName, this.inventory.require(sceneOrName)];
    }
    return [this.inventory.nameFor(sceneOrName) ?? sceneOrName.constructor.name, sceneOrName];
  }
}
