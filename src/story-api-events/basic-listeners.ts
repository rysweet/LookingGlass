import {
  createKeyPressedHandler,
  createMouseClickHandler,
  clonePosition,
  entityKey,
  type KeyListenerEvent,
  type ModifierState,
  type MouseClickOnObjectEvent,
  type SceneActivationEvent,
  SCamera,
  SScene,
  SThing,
} from "./shared.js";
import { getEntityBoundingBox } from "../story-api";

export class SceneActivationListener {
  readonly events: SceneActivationEvent[] = [];
  #scene: SScene | null = null;
  readonly #onEvent?: (event: SceneActivationEvent) => void;
  readonly #listener = (isActive: boolean, activationCount: number): void => {
    if (!this.#scene) return;
    const event: SceneActivationEvent = {
      type: isActive ? "scene-start" : "scene-end",
      scene: this.#scene,
      activationCount,
      isActive,
    };
    this.events.push(event);
    this.#onEvent?.(event);
  };

  constructor(onEvent?: (event: SceneActivationEvent) => void) {
    this.#onEvent = onEvent;
  }

  attach(scene: SScene): void {
    this.detach();
    this.#scene = scene;
    scene.addSceneActivationListener(this.#listener);
  }

  detach(): void {
    if (this.#scene) {
      this.#scene.removeSceneActivationListener(this.#listener);
      this.#scene = null;
    }
  }
}

export class MouseClickOnObjectListener {
  readonly events: MouseClickOnObjectEvent[] = [];
  readonly #handler;
  readonly #onEvent?: (event: MouseClickOnObjectEvent) => void;
  #targets = new Map<string, SThing>();

  constructor(onEvent?: (event: MouseClickOnObjectEvent) => void, options: { doubleClickWindowMs?: number; dragThreshold?: number } = {}) {
    this.#onEvent = onEvent;
    this.#handler = createMouseClickHandler(options);
  }

  mouseDown(point: { x: number; y: number; z: number }, targets: readonly SThing[]): string | null {
    this.#targets = this.#mapTargets(targets);
    return this.#handler.mouseDown(point, this.#toMouseHitTargets(targets));
  }

  mouseUp(point: { x: number; y: number; z: number }, timeMs: number, targets: readonly SThing[]): MouseClickOnObjectEvent | null {
    const targetMap = this.#mapTargets(targets);
    for (const [key, entity] of targetMap) {
      this.#targets.set(key, entity);
    }
    const interaction = this.#handler.mouseUp(point, timeMs, this.#toMouseHitTargets(targets));
    if (!interaction) {
      return null;
    }
    const target = interaction.targetId ? this.#targets.get(interaction.targetId) ?? null : null;
    const event: MouseClickOnObjectEvent = {
      type: interaction.type,
      target,
      targetName: target?.getName() ?? null,
      point: clonePosition(point),
      distance: interaction.distance,
    };
    this.events.push(event);
    this.#onEvent?.(event);
    return event;
  }

  #mapTargets(targets: readonly SThing[]): Map<string, SThing> {
    return new Map(targets.map((target) => [entityKey(target), target]));
  }

  #toMouseHitTargets(targets: readonly SThing[]) {
    return targets.flatMap((target) => {
      const bounds = getEntityBoundingBox(target);
      return bounds ? [{ id: entityKey(target), bounds }] : [];
    });
  }
}

export class KeyListener {
  readonly events: KeyListenerEvent[] = [];
  readonly #handler = createKeyPressedHandler();
  readonly #onEvent?: (event: KeyListenerEvent) => void;

  constructor(onEvent?: (event: KeyListenerEvent) => void) {
    this.#onEvent = onEvent;
  }

  bindShortcut(combo: string, action: string): void {
    this.#handler.bindShortcut(combo, action);
  }

  keyDown(key: string, modifiers: Partial<ModifierState> = {}): KeyListenerEvent {
    const shortcuts = this.#handler.keyDown(key, modifiers);
    const event: KeyListenerEvent = {
      type: "key-press",
      key,
      modifiers: this.#handler.modifiers,
      shortcuts,
      pressed: true,
    };
    this.events.push(event);
    this.#onEvent?.(event);
    return event;
  }

  keyUp(key: string, modifiers: Partial<ModifierState> = {}): KeyListenerEvent {
    this.#handler.keyUp(key, modifiers);
    const event: KeyListenerEvent = {
      type: "key-release",
      key,
      modifiers: this.#handler.modifiers,
      shortcuts: [],
      pressed: false,
    };
    this.events.push(event);
    this.#onEvent?.(event);
    return event;
  }

  isPressed(key: string): boolean {
    return this.#handler.isPressed(key);
  }
}
