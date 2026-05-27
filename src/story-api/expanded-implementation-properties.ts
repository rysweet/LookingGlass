import {
  IDENTITY_ORIENTATION,
  UNIT_SIZE,
  ZERO_POSITION,
  cloneOrientation,
  clonePosition,
  cloneSize,
  interpolateNumber,
  interpolatePosition,
  interpolateSize,
  isFiniteOrientation,
  isFinitePosition,
  isFiniteSize,
  normalizeQuaternion,
  sameOrientation,
  samePosition,
  sameSize,
} from "./expanded-math";
import {
  DEFAULT_STYLE,
  PropertyAnimation,
  type AnimationObserver,
  type AnimationStyleLike,
} from "../animation";
import type { Orientation, Position, Size } from "./expanded-types";
import { notifyImmediateObserver } from "./expanded-implementation-animation-utils";
import type { EntityImp } from "./expanded-implementation-entities-core";
import type { ProgramImp } from "./expanded-implementation-entities-scene";

export interface ImplementableEntity {
  readonly imp: EntityImp;
}

export interface SceneLifecycleHost {
  readonly isActive: boolean;
  readonly program: ProgramImp | null;
}

export interface SceneActivationController extends SceneLifecycleHost {
  activate(): void;
  deactivate(): void;
  bindProgram(program: ProgramImp | null): void;
}

export interface EntityMarker {
  readonly position?: Position;
  readonly orientation?: Orientation;
  readonly size?: Size;
  readonly scale?: Size;
  readonly paint?: string;
  readonly color?: string;
  readonly opacity?: number;
}

export interface PropertyChange<T> {
  readonly property: Property<T>;
  readonly previousValue: T;
  readonly value: T;
}

export type PropertyListener<T> = (change: PropertyChange<T>) => void;
export type ActivationListener = (imp: EntityImp, isActive: boolean) => void;
export type BindingSyncDirection = "self" | "other" | "none";
export type SceneActivationListener = (isActive: boolean, activationCount: number) => void;

export interface PropertyOptions<T> {
  validate?: (value: T) => boolean;
  clone?: (value: T) => T;
  equals?: (left: T, right: T) => boolean;
  interpolate?: (left: T, right: T, portion: number) => T;
}

const identityClone = <T>(value: T): T => value;

export abstract class PropertyOwnerImp {
  get program(): ProgramImp | null {
    return null;
  }

  adjustDurationIfNecessary(duration: number): number {
    if (!Number.isFinite(duration) || duration <= 0) {
      return 0;
    }
    const simulationSpeedFactor = this.program?.simulationSpeedFactor ?? Number.NaN;
    return Number.isFinite(simulationSpeedFactor) && simulationSpeedFactor > 0
      ? duration / simulationSpeedFactor
      : duration;
  }
}

export class Property<T> {
  readonly #listeners = new Set<PropertyListener<T>>();
  readonly #bindings = new Set<Property<T>>();
  readonly #validate: (value: T) => boolean;
  readonly #clone: (value: T) => T;
  readonly #equals: (left: T, right: T) => boolean;
  readonly #interpolate?: (left: T, right: T, portion: number) => T;
  #value: T;

  constructor(
    readonly owner: PropertyOwnerImp,
    readonly name: string,
    initialValue: T,
    options: PropertyOptions<T> = {},
  ) {
    this.#validate = options.validate ?? (() => true);
    this.#clone = options.clone ?? identityClone;
    this.#equals = options.equals ?? Object.is;
    this.#interpolate = options.interpolate;
    this.#value = this.#clone(initialValue);
  }

  get value(): T {
    return this.#clone(this.#value);
  }

  set value(nextValue: T) {
    this.setValue(nextValue);
  }

  addListener(listener: PropertyListener<T>): void {
    this.#listeners.add(listener);
  }

  removeListener(listener: PropertyListener<T>): void {
    this.#listeners.delete(listener);
  }

  isBoundTo(other: Property<T>): boolean {
    return this.#bindings.has(other);
  }

  bindBidirectional(other: Property<T>, initialSync: BindingSyncDirection = "self"): void {
    if (other === this || this.#bindings.has(other)) {
      return;
    }
    this.#bindings.add(other);
    other.#bindings.add(this);
    if (initialSync === "self") {
      other.#commit(this.#clone(this.#value), true, new Set<Property<T>>([this]));
    } else if (initialSync === "other") {
      this.#commit(other.value, true, new Set<Property<T>>([other]));
    }
  }

  unbindBidirectional(other: Property<T>): void {
    this.#bindings.delete(other);
    other.#bindings.delete(this);
  }

  animateValue(
    nextValue: T,
    duration = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
    observer?: AnimationObserver,
  ): PropertyAnimation<T> | null {
    const adjustedDuration = this.owner.adjustDurationIfNecessary(duration);
    if (adjustedDuration <= 0 || !this.#interpolate) {
      this.setValue(nextValue);
      notifyImmediateObserver(observer);
      return null;
    }
    return new PropertyAnimation<T>({
      from: this.value,
      to: nextValue,
      durationMs: adjustedDuration * 1000,
      easing: style,
      interpolate: this.#interpolate,
      setValue: (value) => {
        this.setValue(value);
      },
      observer,
    });
  }

  setValue(nextValue: T): boolean {
    return this.#commit(nextValue, true, new Set<Property<T>>());
  }

  setValueSilently(nextValue: T): boolean {
    return this.#commit(nextValue, false, new Set<Property<T>>());
  }

  #commit(nextValue: T, notify: boolean, visited: Set<Property<T>>): boolean {
    if (visited.has(this)) {
      return false;
    }
    visited.add(this);

    if (!this.#validate(nextValue)) {
      return false;
    }

    const normalizedNextValue = this.#clone(nextValue);
    const previousValue = this.#clone(this.#value);
    const changed = !this.#equals(this.#value, normalizedNextValue);

    if (changed) {
      this.#value = normalizedNextValue;
      if (notify) {
        const change: PropertyChange<T> = {
          property: this,
          previousValue,
          value: this.#clone(normalizedNextValue),
        };
        for (const listener of this.#listeners) {
          listener(change);
        }
      }
    }

    let propagated = false;
    for (const binding of this.#bindings) {
      propagated = binding.#commit(this.#clone(normalizedNextValue), notify, visited) || propagated;
    }

    return changed || propagated;
  }
}

export class BooleanProperty extends Property<boolean> {
  constructor(owner: PropertyOwnerImp, name: string, initialValue = false) {
    super(owner, name, initialValue, { validate: (value) => typeof value === "boolean" });
  }
}

export class NumberProperty extends Property<number> {
  readonly #min: number | null;
  readonly #max: number | null;

  constructor(
    owner: PropertyOwnerImp,
    name: string,
    initialValue: number,
    bounds: { min?: number; max?: number } = {},
  ) {
    super(owner, name, initialValue, {
      validate: Number.isFinite,
      interpolate: interpolateNumber,
    });
    this.#min = Number.isFinite(bounds.min) ? bounds.min! : null;
    this.#max = Number.isFinite(bounds.max) ? bounds.max! : null;
  }

  override setValue(nextValue: number): boolean {
    return super.setValue(this.#clamp(nextValue));
  }

  override setValueSilently(nextValue: number): boolean {
    return super.setValueSilently(this.#clamp(nextValue));
  }

  override animateValue(
    nextValue: number,
    duration = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
    observer?: AnimationObserver,
  ): PropertyAnimation<number> | null {
    return super.animateValue(this.#clamp(nextValue), duration, style, observer);
  }

  #clamp(value: number): number {
    let nextValue = value;
    if (this.#min !== null) {
      nextValue = Math.max(this.#min, nextValue);
    }
    if (this.#max !== null) {
      nextValue = Math.min(this.#max, nextValue);
    }
    return nextValue;
  }
}

export class StringProperty<T extends string | null = string> extends Property<T> {
  constructor(owner: PropertyOwnerImp, name: string, initialValue: T, allowNull = false) {
    super(owner, name, initialValue, {
      validate: (value) => (allowNull && value === null) || typeof value === "string",
    });
  }
}

export class PositionProperty extends Property<Position> {
  constructor(owner: PropertyOwnerImp, name: string, initialValue = ZERO_POSITION) {
    super(owner, name, initialValue, {
      validate: isFinitePosition,
      clone: clonePosition,
      equals: samePosition,
      interpolate: interpolatePosition,
    });
  }
}

export class OrientationProperty extends Property<Orientation> {
  constructor(owner: PropertyOwnerImp, name: string, initialValue = IDENTITY_ORIENTATION) {
    super(owner, name, initialValue, {
      validate: isFiniteOrientation,
      clone: cloneOrientation,
      equals: sameOrientation,
      interpolate: (left, right, portion) => normalizeQuaternion({
        x: interpolateNumber(left.x, right.x, portion),
        y: interpolateNumber(left.y, right.y, portion),
        z: interpolateNumber(left.z, right.z, portion),
        w: interpolateNumber(left.w, right.w, portion),
      }),
    });
  }
}

export class SizeProperty extends Property<Size> {
  constructor(owner: PropertyOwnerImp, name: string, initialValue = UNIT_SIZE) {
    super(owner, name, initialValue, {
      validate: isFiniteSize,
      clone: cloneSize,
      equals: sameSize,
      interpolate: interpolateSize,
    });
  }
}

export class ReferenceProperty<T> extends Property<T> {
  constructor(owner: PropertyOwnerImp, name: string, initialValue: T) {
    super(owner, name, initialValue, {
      clone: identityClone,
      equals: (left, right) => left === right,
    });
  }
}
