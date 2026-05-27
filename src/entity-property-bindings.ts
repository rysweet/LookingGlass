import {
  DEFAULT_STYLE,
  PropertyAnimation as CorePropertyAnimation,
  lerpScalar,
  lerpSize,
  lerpVec3,
  nlerp,
  type AnimationStyleLike,
  type ValueAnimationState,
} from "./animation";
import type { SThing } from "./scene-object-hierarchy";
import type { Property as BaseProperty, PropertyChange as BasePropertyChange } from "./story-api/expanded-implementation";
import {
  cloneBoundingBox,
  cloneOrientation,
  clonePosition,
  cloneSize,
  isBoundingBox,
  isOrientation,
  isPosition,
  isSize,
  orientationsEqual,
  positionsEqual,
  sizesEqual,
  type BoundingBox,
  type Orientation,
  type Position,
  type Size,
} from "./story-api/expanded-types";

export interface PropertyConstraint<T> {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly clamp?: (value: T) => T;
}

export interface PropertyChangeEvent<T> {
  readonly property: EntityProperty<T> | DerivedProperty<T>;
  readonly oldValue: T;
  readonly newValue: T;
  readonly source: SThing;
}

export type PropertyListener<T> = (event: PropertyChangeEvent<T>) => void;

function applyConstraint<T>(value: T, constraint?: PropertyConstraint<T>): T {
  if (!constraint) {
    return value;
  }
  let nextValue = constraint.clamp ? constraint.clamp(value) : value;
  if (typeof nextValue === "number") {
    if (Number.isFinite(constraint.min)) {
      nextValue = Math.max(constraint.min!, nextValue) as T;
    }
    if (Number.isFinite(constraint.max)) {
      nextValue = Math.min(constraint.max!, nextValue as number) as T;
    }
    if (Number.isFinite(constraint.step) && constraint.step! > 0) {
      const min = Number.isFinite(constraint.min) ? constraint.min! : 0;
      nextValue = (Math.round(((nextValue as number) - min) / constraint.step!) * constraint.step! + min) as T;
      if (Number.isFinite(constraint.min)) {
        nextValue = Math.max(constraint.min!, nextValue as number) as T;
      }
      if (Number.isFinite(constraint.max)) {
        nextValue = Math.min(constraint.max!, nextValue as number) as T;
      }
    }
  }
  return nextValue;
}

function interpolateKnownValue<T>(from: T, to: T, portion: number): T {
  if (typeof from === "number" && typeof to === "number") {
    return lerpScalar(from, to, portion) as T;
  }
  if (isPosition(from) && isPosition(to)) {
    return lerpVec3(from, to, portion) as T;
  }
  if (isOrientation(from) && isOrientation(to)) {
    return nlerp(from, to, portion) as T;
  }
  if (isSize(from) && isSize(to)) {
    return lerpSize(from, to, portion) as T;
  }
  if (isBoundingBox(from) && isBoundingBox(to)) {
    return {
      min: lerpVec3(from.min, to.min, portion),
      max: lerpVec3(from.max, to.max, portion),
    } as T;
  }
  return (portion < 1 ? from : to) as T;
}

function valuesEqual<T>(left: T, right: T): boolean {
  if (left === right) {
    return true;
  }
  if (isPosition(left) && isPosition(right)) {
    return positionsEqual(left, right);
  }
  if (isOrientation(left) && isOrientation(right)) {
    return orientationsEqual(left, right);
  }
  if (isSize(left) && isSize(right)) {
    return sizesEqual(left, right);
  }
  if (isBoundingBox(left) && isBoundingBox(right)) {
    return positionsEqual(left.min, right.min) && positionsEqual(left.max, right.max);
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

export class EntityProperty<T> {
  readonly #property: BaseProperty<T>;
  readonly #listeners = new Map<PropertyListener<T>, (change: BasePropertyChange<T>) => void>();

  constructor(
    readonly entity: SThing,
    readonly name: string,
    readonly constraint?: PropertyConstraint<T>,
  ) {
    const property = entity.imp.getProperty<T>(name);
    if (!property) {
      throw new TypeError(`${entity.constructor.name} does not expose a ${name} property`);
    }
    this.#property = property;
  }

  get rawProperty(): BaseProperty<T> {
    return this.#property;
  }

  get value(): T {
    return this.#property.value;
  }

  set value(nextValue: T) {
    this.#property.setValue(applyConstraint(nextValue, this.constraint));
  }

  addListener(listener: PropertyListener<T>): void {
    const wrapped = (change: BasePropertyChange<T>) => {
      listener({
        property: this,
        oldValue: change.previousValue,
        newValue: change.value,
        source: this.entity,
      });
    };
    this.#listeners.set(listener, wrapped);
    this.#property.addListener(wrapped);
  }

  removeListener(listener: PropertyListener<T>): void {
    const wrapped = this.#listeners.get(listener);
    if (!wrapped) {
      return;
    }
    this.#property.removeListener(wrapped);
    this.#listeners.delete(listener);
  }
}

export class PropertyAnimation<T> {
  readonly #clip: CorePropertyAnimation<T>;

  constructor(
    readonly property: EntityProperty<T>,
    readonly targetValue: T,
    readonly durationMs: number,
    readonly style: AnimationStyleLike = DEFAULT_STYLE,
    interpolate: (from: T, to: T, portion: number) => T = interpolateKnownValue,
  ) {
    const target = applyConstraint(targetValue, property.constraint);
    this.#clip = new CorePropertyAnimation<T>({
      from: property.value,
      to: target,
      durationMs,
      easing: style,
      interpolate,
      setValue: (value) => {
        property.value = value;
      },
    });
  }

  get value(): T {
    return this.#clip.value;
  }

  get elapsedMs(): number {
    return this.#clip.elapsedMs;
  }

  get progress(): number {
    return this.#clip.progress;
  }

  get complete(): boolean {
    return this.#clip.complete;
  }

  get isComplete(): boolean {
    return this.#clip.isComplete;
  }

  update(deltaMs: number): ValueAnimationState<T> {
    return this.#clip.update(deltaMs);
  }

  reset(): void {
    this.#clip.reset();
  }
}

export class DerivedProperty<T> {
  readonly #listeners = new Set<PropertyListener<T>>();
  #value: T;

  constructor(
    readonly name: string,
    readonly dependencies: readonly EntityProperty<any>[],
    private readonly compute: () => T,
  ) {
    this.#value = compute();
    for (const dependency of dependencies) {
      dependency.addListener(() => this.recompute());
    }
  }

  get source(): SThing {
    return this.dependencies[0]!.entity;
  }

  get value(): T {
    return this.#value;
  }

  addListener(listener: PropertyListener<T>): void {
    this.#listeners.add(listener);
  }

  removeListener(listener: PropertyListener<T>): void {
    this.#listeners.delete(listener);
  }

  recompute(): T {
    const previous = this.#value;
    const next = this.compute();
    if (valuesEqual(previous, next)) {
      return next;
    }
    this.#value = next;
    for (const listener of this.#listeners) {
      listener({
        property: this,
        oldValue: previous,
        newValue: next,
        source: this.source,
      });
    }
    return next;
  }
}
