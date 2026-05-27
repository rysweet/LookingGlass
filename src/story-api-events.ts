import { rayAabbIntersection } from "./collision-detection";
import {
  CollisionHandler,
  KeyPressedHandler,
  MouseClickHandler,
  type ModifierState,
} from "./event-handlers";
import { VisibilityQuery } from "./entity-queries";
import {
  SCamera,
  SMovableTurnable,
  SScene,
  SThing,
  type Orientation,
  type Position,
  type Property,
  type PropertyChange,
  type Size,
  getEntityBoundingBox,
} from "./story-api";
import { distanceBetween, normalizeVec3, subtractVec3 } from "./story-api/expanded-math";

export interface SceneActivationEvent {
  readonly type: "scene-start" | "scene-end";
  readonly scene: SScene;
  readonly activationCount: number;
  readonly isActive: boolean;
}

export interface MouseClickOnObjectEvent {
  readonly type: "click" | "double-click" | "drag";
  readonly target: SThing | null;
  readonly targetName: string | null;
  readonly point: Position;
  readonly distance: number;
}

export interface KeyListenerEvent {
  readonly type: "key-press" | "key-release";
  readonly key: string;
  readonly modifiers: ModifierState;
  readonly shortcuts: readonly string[];
  readonly pressed: boolean;
}

export interface CollisionTransitionEvent {
  readonly type: "collision-start" | "collision-end" | "while-collision";
  readonly left: SThing;
  readonly right: SThing;
  readonly pairKey: string;
}

export interface ProximityWatch {
  readonly source: SThing;
  readonly target: SThing;
  readonly threshold: number;
}

export interface ProximityTransitionEvent {
  readonly type: "proximity-enter" | "proximity-exit" | "while-proximity";
  readonly source: SThing;
  readonly target: SThing;
  readonly pairKey: string;
  readonly threshold: number;
  readonly distance: number;
}

export interface OcclusionEvent {
  readonly type: "occluded" | "revealed";
  readonly camera: SCamera;
  readonly target: SThing;
  readonly occluder: SThing | null;
}

export interface TransformationEvent<T = Position | Orientation | Size> {
  readonly type: "transformation";
  readonly entity: SThing;
  readonly property: "position" | "orientation" | "size";
  readonly previousValue: T;
  readonly value: T;
}

export interface ViewEvent {
  readonly type: "view-enter" | "view-exit";
  readonly camera: SCamera;
  readonly target: SThing;
}

interface PairState {
  readonly left: SThing;
  readonly right: SThing;
  readonly pairKey: string;
}

interface ProximityState {
  readonly source: SThing;
  readonly target: SThing;
  readonly pairKey: string;
  readonly threshold: number;
  readonly distance: number;
}

const collisionHandler = new CollisionHandler();
const visibilityQuery = new VisibilityQuery();
const entityIds = new WeakMap<SThing, string>();
let nextEntityId = 1;

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
}

function cloneSize(size: Size): Size {
  return { width: size.width, height: size.height, depth: size.depth };
}

function cloneTransformValue(value: Position | Orientation | Size): Position | Orientation | Size {
  if ("width" in value) {
    return cloneSize(value);
  }
  if ("w" in value) {
    return cloneOrientation(value);
  }
  return clonePosition(value);
}

function entityKey(entity: SThing): string {
  const named = entity.getName();
  if (named && named.trim().length > 0) {
    return `name:${named}`;
  }
  let key = entityIds.get(entity);
  if (!key) {
    key = `entity:${nextEntityId++}`;
    entityIds.set(entity, key);
  }
  return key;
}

function pairKey(left: SThing, right: SThing): string {
  return [entityKey(left), entityKey(right)].sort().join("::");
}

function positionOf(entity: SThing): Position {
  if (entity instanceof SMovableTurnable) {
    return clonePosition(entity.position);
  }
  const bounds = getEntityBoundingBox(entity);
  if (bounds) {
    return {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
      z: (bounds.min.z + bounds.max.z) / 2,
    };
  }
  return { x: 0, y: 0, z: 0 };
}

function collectCollisionPairs(entities: readonly SThing[]): Map<string, PairState> {
  const targets = entities.flatMap((entity) => {
    const bounds = getEntityBoundingBox(entity);
    return bounds ? [{ id: entityKey(entity), bounds }] : [];
  });
  const byId = new Map(entities.map((entity) => [entityKey(entity), entity]));
  const pairs = new Map<string, PairState>();
  for (const collision of collisionHandler.getAabbCollisions(targets)) {
    const left = byId.get(collision.leftId);
    const right = byId.get(collision.rightId);
    if (!left || !right) {
      continue;
    }
    const key = pairKey(left, right);
    pairs.set(key, { left, right, pairKey: key });
  }
  return pairs;
}

function collectProximityPairs(watches: readonly ProximityWatch[]): Map<string, ProximityState> {
  const active = new Map<string, ProximityState>();
  for (const watch of watches) {
    if (!Number.isFinite(watch.threshold) || watch.threshold < 0) {
      throw new TypeError("threshold must be a non-negative finite number");
    }
    const distance = distanceBetween(positionOf(watch.source), positionOf(watch.target));
    if (distance <= watch.threshold) {
      const key = pairKey(watch.source, watch.target);
      active.set(key, {
        source: watch.source,
        target: watch.target,
        pairKey: key,
        threshold: watch.threshold,
        distance,
      });
    }
  }
  return active;
}

function targetBounds(entity: SThing) {
  return getEntityBoundingBox(entity);
}

function findOccluder(camera: SCamera, target: SThing, occluders: readonly SThing[]): SThing | null {
  if (!visibilityQuery.visibleFrom(camera, target)) {
    return null;
  }
  const targetPosition = positionOf(target);
  const cameraPosition = clonePosition(camera.position);
  const direction = subtractVec3(targetPosition, cameraPosition);
  const distance = distanceBetween(cameraPosition, targetPosition);
  if (distance === 0) {
    return null;
  }
  const rayDirection = normalizeVec3(direction);
  let nearest: { entity: SThing; distance: number } | null = null;
  for (const occluder of occluders) {
    if (occluder === target || !occluder.isShowing) {
      continue;
    }
    const bounds = targetBounds(occluder);
    if (!bounds) {
      continue;
    }
    const hit = rayAabbIntersection({ origin: cameraPosition, direction: rayDirection, maxDistance: distance }, bounds);
    if (!hit || hit.distance >= distance) {
      continue;
    }
    if (!nearest || hit.distance < nearest.distance) {
      nearest = { entity: occluder, distance: hit.distance };
    }
  }
  return nearest?.entity ?? null;
}

function transformProperty<T>(entity: SThing, name: "position" | "orientation" | "size"): Property<T> | null {
  return entity.imp.getProperty<T>(name) ?? null;
}

export class SceneActivationListener {
  readonly events: SceneActivationEvent[] = [];
  #scene: SScene | null = null;
  readonly #onEvent?: (event: SceneActivationEvent) => void;
  readonly #listener = (isActive: boolean, activationCount: number): void => {
    if (!this.#scene) {
      return;
    }
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
  readonly #handler: MouseClickHandler;
  readonly #onEvent?: (event: MouseClickOnObjectEvent) => void;
  #targets = new Map<string, SThing>();

  constructor(onEvent?: (event: MouseClickOnObjectEvent) => void, options: { doubleClickWindowMs?: number; dragThreshold?: number } = {}) {
    this.#onEvent = onEvent;
    this.#handler = new MouseClickHandler(options.doubleClickWindowMs, options.dragThreshold);
  }

  mouseDown(point: Position, targets: readonly SThing[]): string | null {
    this.#targets = this.#mapTargets(targets);
    return this.#handler.mouseDown(point, this.#toMouseHitTargets(targets));
  }

  mouseUp(point: Position, timeMs: number, targets: readonly SThing[]): MouseClickOnObjectEvent | null {
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
  readonly #handler = new KeyPressedHandler();
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

export class CollisionStartListener {
  readonly events: CollisionTransitionEvent[] = [];
  readonly #active = new Map<string, PairState>();
  readonly #onEvent?: (event: CollisionTransitionEvent) => void;

  constructor(onEvent?: (event: CollisionTransitionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(entities: readonly SThing[]): CollisionTransitionEvent[] {
    const current = collectCollisionPairs(entities);
    const events: CollisionTransitionEvent[] = [];
    for (const [key, pair] of current) {
      if (this.#active.has(key)) {
        continue;
      }
      const event: CollisionTransitionEvent = { type: "collision-start", ...pair };
      this.events.push(event);
      this.#onEvent?.(event);
      events.push(event);
    }
    this.#active.clear();
    for (const [key, pair] of current) {
      this.#active.set(key, pair);
    }
    return events;
  }
}

export class CollisionEndListener {
  readonly events: CollisionTransitionEvent[] = [];
  readonly #active = new Map<string, PairState>();
  readonly #onEvent?: (event: CollisionTransitionEvent) => void;

  constructor(onEvent?: (event: CollisionTransitionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(entities: readonly SThing[]): CollisionTransitionEvent[] {
    const current = collectCollisionPairs(entities);
    const events: CollisionTransitionEvent[] = [];
    for (const [key, pair] of this.#active) {
      if (current.has(key)) {
        continue;
      }
      const event: CollisionTransitionEvent = { type: "collision-end", ...pair };
      this.events.push(event);
      this.#onEvent?.(event);
      events.push(event);
    }
    this.#active.clear();
    for (const [key, pair] of current) {
      this.#active.set(key, pair);
    }
    return events;
  }
}

export class WhileCollisionListener {
  readonly events: CollisionTransitionEvent[] = [];
  readonly #onEvent?: (event: CollisionTransitionEvent) => void;

  constructor(onEvent?: (event: CollisionTransitionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(entities: readonly SThing[]): CollisionTransitionEvent[] {
    const events = [...collectCollisionPairs(entities).values()].map((pair) => ({ type: "while-collision" as const, ...pair }));
    this.events.push(...events);
    events.forEach((event) => this.#onEvent?.(event));
    return events;
  }
}

export class ProximityEnterListener {
  readonly events: ProximityTransitionEvent[] = [];
  readonly #active = new Map<string, ProximityState>();
  readonly #onEvent?: (event: ProximityTransitionEvent) => void;

  constructor(onEvent?: (event: ProximityTransitionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(watches: readonly ProximityWatch[]): ProximityTransitionEvent[] {
    const current = collectProximityPairs(watches);
    const events: ProximityTransitionEvent[] = [];
    for (const [key, proximity] of current) {
      if (this.#active.has(key)) {
        continue;
      }
      const event: ProximityTransitionEvent = { type: "proximity-enter", ...proximity };
      this.events.push(event);
      this.#onEvent?.(event);
      events.push(event);
    }
    this.#active.clear();
    for (const [key, proximity] of current) {
      this.#active.set(key, proximity);
    }
    return events;
  }
}

export class ProximityExitListener {
  readonly events: ProximityTransitionEvent[] = [];
  readonly #active = new Map<string, ProximityState>();
  readonly #onEvent?: (event: ProximityTransitionEvent) => void;

  constructor(onEvent?: (event: ProximityTransitionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(watches: readonly ProximityWatch[]): ProximityTransitionEvent[] {
    const current = collectProximityPairs(watches);
    const events: ProximityTransitionEvent[] = [];
    for (const [key, proximity] of this.#active) {
      if (current.has(key)) {
        continue;
      }
      const event: ProximityTransitionEvent = { type: "proximity-exit", ...proximity };
      this.events.push(event);
      this.#onEvent?.(event);
      events.push(event);
    }
    this.#active.clear();
    for (const [key, proximity] of current) {
      this.#active.set(key, proximity);
    }
    return events;
  }
}

export class WhileProximityListener {
  readonly events: ProximityTransitionEvent[] = [];
  readonly #onEvent?: (event: ProximityTransitionEvent) => void;

  constructor(onEvent?: (event: ProximityTransitionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(watches: readonly ProximityWatch[]): ProximityTransitionEvent[] {
    const events = [...collectProximityPairs(watches).values()].map((proximity) => ({ type: "while-proximity" as const, ...proximity }));
    this.events.push(...events);
    events.forEach((event) => this.#onEvent?.(event));
    return events;
  }
}

export class OcclusionListener {
  readonly events: OcclusionEvent[] = [];
  readonly #occluded = new Map<string, SThing | null>();
  readonly #onEvent?: (event: OcclusionEvent) => void;

  constructor(onEvent?: (event: OcclusionEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(camera: SCamera, targets: readonly SThing[], occluders: readonly SThing[]): OcclusionEvent[] {
    const events: OcclusionEvent[] = [];
    for (const target of targets) {
      const key = entityKey(target);
      const previous = this.#occluded.get(key) ?? null;
      const current = findOccluder(camera, target, occluders);
      if (!previous && current) {
        const event: OcclusionEvent = { type: "occluded", camera, target, occluder: current };
        this.events.push(event);
        this.#onEvent?.(event);
        events.push(event);
      } else if (previous && !current) {
        const event: OcclusionEvent = { type: "revealed", camera, target, occluder: null };
        this.events.push(event);
        this.#onEvent?.(event);
        events.push(event);
      }
      this.#occluded.set(key, current);
    }
    return events;
  }
}

export class TransformationListener {
  readonly events: TransformationEvent[] = [];
  readonly #onEvent?: (event: TransformationEvent) => void;
  readonly #subscriptions = new Map<SThing, Array<{ property: Property<unknown>; listener: (change: PropertyChange<unknown>) => void }>>();

  constructor(onEvent?: (event: TransformationEvent) => void) {
    this.#onEvent = onEvent;
  }

  attach(entity: SThing): void {
    this.detach(entity);
    const subscriptions: Array<{ property: Property<unknown>; listener: (change: PropertyChange<unknown>) => void }> = [];
    for (const propertyName of ["position", "orientation", "size"] as const) {
      const property = transformProperty<unknown>(entity, propertyName);
      if (!property) {
        continue;
      }
      const listener = (change: PropertyChange<unknown>): void => {
        const event: TransformationEvent = {
          type: "transformation",
          entity,
          property: propertyName,
          previousValue: cloneTransformValue(change.previousValue as Position | Orientation | Size),
          value: cloneTransformValue(change.value as Position | Orientation | Size),
        };
        this.events.push(event);
        this.#onEvent?.(event);
      };
      property.addListener(listener);
      subscriptions.push({ property, listener });
    }
    if (subscriptions.length > 0) {
      this.#subscriptions.set(entity, subscriptions);
    }
  }

  detach(entity: SThing): void {
    const subscriptions = this.#subscriptions.get(entity);
    if (!subscriptions) {
      return;
    }
    for (const { property, listener } of subscriptions) {
      property.removeListener(listener);
    }
    this.#subscriptions.delete(entity);
  }
}

export class ViewEnterListener {
  readonly events: ViewEvent[] = [];
  readonly #visible = new Set<string>();
  readonly #onEvent?: (event: ViewEvent) => void;

  constructor(onEvent?: (event: ViewEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(camera: SCamera, targets: readonly SThing[]): ViewEvent[] {
    const currentVisible = new Set<string>();
    const events: ViewEvent[] = [];
    for (const target of targets) {
      if (!visibilityQuery.visibleFrom(camera, target)) {
        continue;
      }
      const key = entityKey(target);
      currentVisible.add(key);
      if (this.#visible.has(key)) {
        continue;
      }
      const event: ViewEvent = { type: "view-enter", camera, target };
      this.events.push(event);
      this.#onEvent?.(event);
      events.push(event);
    }
    this.#visible.clear();
    currentVisible.forEach((key) => this.#visible.add(key));
    return events;
  }
}

export class ViewExitListener {
  readonly events: ViewEvent[] = [];
  readonly #visible = new Set<string>();
  readonly #onEvent?: (event: ViewEvent) => void;

  constructor(onEvent?: (event: ViewEvent) => void) {
    this.#onEvent = onEvent;
  }

  update(camera: SCamera, targets: readonly SThing[]): ViewEvent[] {
    const currentVisible = new Set<string>();
    for (const target of targets) {
      if (visibilityQuery.visibleFrom(camera, target)) {
        currentVisible.add(entityKey(target));
      }
    }
    const events: ViewEvent[] = [];
    for (const target of targets) {
      const key = entityKey(target);
      if (!this.#visible.has(key) || currentVisible.has(key)) {
        continue;
      }
      const event: ViewEvent = { type: "view-exit", camera, target };
      this.events.push(event);
      this.#onEvent?.(event);
      events.push(event);
    }
    this.#visible.clear();
    currentVisible.forEach((key) => this.#visible.add(key));
    return events;
  }
}
