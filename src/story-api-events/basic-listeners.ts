import {
  createKeyPressedHandler,
  createMouseClickHandler,
  clonePosition,
  entityKey,
  type ArrowKeyEvent,
  type FrameViewEvent,
  type KeyListenerEvent,
  type ModifierState,
  type MouseClickOnObjectEvent,
  type MouseClickOnScreenEvent,
  type MoveDirection,
  type NumberKeyEvent,
  type PointOfViewChangeEvent,
  type SceneActivationEvent,
  type TimeEvent,
  PointOfView,
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

const ARROW_KEY_DIRECTION_MAP: Readonly<Record<string, MoveDirection>> = {
  ArrowUp: "FORWARD",
  ArrowDown: "BACKWARD",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
};

const DIGIT_KEYS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export class TimeListener {
  readonly events: TimeEvent[] = [];
  readonly #onEvent?: (event: TimeEvent) => void;
  #previousElapsed = 0;

  constructor(onEvent?: (event: TimeEvent) => void) {
    this.#onEvent = onEvent;
  }

  feed(viewEvents: readonly FrameViewEvent[]): void {
    for (const ve of viewEvents) {
      if (ve.type !== "time") continue;
      const delta = ve.timeSeconds - this.#previousElapsed;
      const event: TimeEvent = {
        type: "time",
        elapsedSeconds: ve.timeSeconds,
        deltaSeconds: delta,
        frameIndex: ve.frameIndex,
      };
      this.#previousElapsed = ve.timeSeconds;
      this.events.push(event);
      this.#onEvent?.(event);
    }
  }
}

export class MouseClickOnScreenListener {
  readonly events: MouseClickOnScreenEvent[] = [];
  readonly #handler;
  readonly #onEvent?: (event: MouseClickOnScreenEvent) => void;

  constructor(onEvent?: (event: MouseClickOnScreenEvent) => void, options: { doubleClickWindowMs?: number; dragThreshold?: number } = {}) {
    this.#onEvent = onEvent;
    this.#handler = createMouseClickHandler(options);
  }

  mouseDown(point: { x: number; y: number; z: number }): void {
    this.#handler.mouseDown(point);
  }

  mouseUp(point: { x: number; y: number; z: number }, timeMs: number): MouseClickOnScreenEvent | null {
    const interaction = this.#handler.mouseUp(point, timeMs);
    if (!interaction) return null;
    const event: MouseClickOnScreenEvent = {
      type: interaction.type,
      screenX: point.x,
      screenY: point.y,
      point: clonePosition(point),
    };
    this.events.push(event);
    this.#onEvent?.(event);
    return event;
  }
}

export class ArrowKeyPressListener {
  readonly events: ArrowKeyEvent[] = [];
  readonly #handler = createKeyPressedHandler();
  readonly #onEvent?: (event: ArrowKeyEvent) => void;

  constructor(onEvent?: (event: ArrowKeyEvent) => void) {
    this.#onEvent = onEvent;
  }

  keyDown(key: string, modifiers: Partial<ModifierState> = {}): ArrowKeyEvent | null {
    const direction = ARROW_KEY_DIRECTION_MAP[key];
    if (!direction) return null;
    this.#handler.keyDown(key, modifiers);
    const event: ArrowKeyEvent = {
      type: "key-press",
      key,
      direction,
      modifiers: this.#handler.modifiers,
    };
    this.events.push(event);
    this.#onEvent?.(event);
    return event;
  }
}

export class NumberKeyPressListener {
  readonly events: NumberKeyEvent[] = [];
  readonly #handler = createKeyPressedHandler();
  readonly #onEvent?: (event: NumberKeyEvent) => void;

  constructor(onEvent?: (event: NumberKeyEvent) => void) {
    this.#onEvent = onEvent;
  }

  keyDown(key: string, modifiers: Partial<ModifierState> = {}): NumberKeyEvent | null {
    if (!DIGIT_KEYS.has(key)) return null;
    this.#handler.keyDown(key, modifiers);
    const event: NumberKeyEvent = {
      type: "key-press",
      key,
      number: Number.parseInt(key, 10),
      modifiers: this.#handler.modifiers,
    };
    this.events.push(event);
    this.#onEvent?.(event);
    return event;
  }
}

export class PointOfViewChangeListener {
  readonly events: PointOfViewChangeEvent[] = [];
  readonly #camera: SCamera;
  readonly #onEvent?: (event: PointOfViewChangeEvent) => void;
  #previous: PointOfView;

  constructor(camera: SCamera, onEvent?: (event: PointOfViewChangeEvent) => void) {
    this.#camera = camera;
    this.#onEvent = onEvent;
    this.#previous = PointOfView.capture(camera);
  }

  check(): void {
    const current = PointOfView.capture(this.#camera);
    if (this.#povEquals(this.#previous, current)) return;
    const event: PointOfViewChangeEvent = {
      type: "pov-change",
      previous: this.#previous,
      current,
      camera: this.#camera,
    };
    this.#previous = current;
    this.events.push(event);
    this.#onEvent?.(event);
  }

  #povEquals(a: PointOfView, b: PointOfView): boolean {
    const eps = 1e-9;
    return (
      Math.abs(a.position.x - b.position.x) <= eps
      && Math.abs(a.position.y - b.position.y) <= eps
      && Math.abs(a.position.z - b.position.z) <= eps
      && Math.abs(a.orientation.x - b.orientation.x) <= eps
      && Math.abs(a.orientation.y - b.orientation.y) <= eps
      && Math.abs(a.orientation.z - b.orientation.z) <= eps
      && Math.abs(a.orientation.w - b.orientation.w) <= eps
      && Math.abs(a.fieldOfView - b.fieldOfView) <= eps
    );
  }
}
