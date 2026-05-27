import {
  DEFAULT_STYLE,
  ParallelAnimation,
  PropertyAnimation as CorePropertyAnimation,
  lerpScalar,
  lerpSize,
  lerpVec3,
  nlerp,
  type AnimationClip,
  type AnimationClipState,
  type AnimationStyleLike,
  type ValueAnimationState,
} from "./animation";
import {
  type MoveDirection,
  type Orientation,
  type Position,
  type RollDirection,
  type Size,
  type Vec3,
} from "./story-api";
import {
  IDENTITY_ORIENTATION,
  distanceBetween,
  normalizeVec3,
  orientationFromLookDirection,
  quaternionFromAxisAngle,
  quaternionMultiply,
  rotateVector,
  scaleVec3,
  subtractVec3,
  vectorFromMoveDirection,
} from "./story-api/expanded-math";
import { SCamera, SGround, SJointedModel, SMarker, SModel, SMovableTurnable } from "./scene-object-hierarchy";

type PositionTarget = Position | { position: Position };
type Positionable = SMovableTurnable | SMarker | SModel | SCamera;
type Orientable = Positionable;
type Sizable = SModel | SMarker;
type OpacityCapable = SModel | SMarker | SGround;

function requireDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError(`durationMs must be a finite non-negative number, got ${durationMs}`);
  }
  return durationMs;
}

function hasPosition(value: unknown): value is { position: Position } {
  return !!value && typeof value === "object" && "position" in (value as Record<string, unknown>);
}

function targetPositionOf(target: PositionTarget): Position {
  return hasPosition(target) ? target.position : target;
}

function interpolatePaint(from: string, to: string, portion: number): string {
  const hex = /^#?([\da-f]{6})$/i;
  const fromMatch = hex.exec(from.trim());
  const toMatch = hex.exec(to.trim());
  if (!fromMatch || !toMatch) {
    return portion < 1 ? from : to;
  }
  const parse = (value: string): [number, number, number] => [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
  const [fromR, fromG, fromB] = parse(fromMatch[1]);
  const [toR, toG, toB] = parse(toMatch[1]);
  const channel = (left: number, right: number) => Math.round(lerpScalar(left, right, portion));
  return `#${channel(fromR, toR).toString(16).padStart(2, "0")}${channel(fromG, toG).toString(16).padStart(2, "0")}${channel(fromB, toB).toString(16).padStart(2, "0")}`;
}

class ImmediateAnimation implements AnimationClip {
  #complete = false;

  constructor(
    readonly durationMs: number,
    private readonly apply: () => void,
    private readonly resetEffect?: () => void,
  ) {
    requireDuration(durationMs);
    this.apply();
    this.#complete = durationMs === 0;
  }

  get elapsedMs(): number {
    return this.#complete ? this.durationMs : 0;
  }

  get progress(): number {
    return this.#complete ? 1 : 0;
  }

  get complete(): boolean {
    return this.#complete;
  }

  get isComplete(): boolean {
    return this.#complete;
  }

  update(deltaMs: number): AnimationClipState {
    if (!this.#complete && deltaMs >= 0) {
      this.#complete = true;
    }
    return {
      elapsedMs: this.elapsedMs,
      durationMs: this.durationMs,
      progress: this.progress,
      complete: this.complete,
    };
  }

  reset(): void {
    this.resetEffect?.();
    this.#complete = false;
  }
}

class WrappedValueAnimation<T> {
  constructor(
    readonly durationMs: number,
    readonly style: AnimationStyleLike,
    private readonly clip: CorePropertyAnimation<T>,
  ) {}

  get value(): T { return this.clip.value; }
  get elapsedMs(): number { return this.clip.elapsedMs; }
  get progress(): number { return this.clip.progress; }
  get complete(): boolean { return this.clip.complete; }
  get isComplete(): boolean { return this.clip.isComplete; }
  update(deltaMs: number): ValueAnimationState<T> { return this.clip.update(deltaMs); }
  reset(): void { this.clip.reset(); }
}

function createPropertyAnimation<T>(
  from: T,
  to: T,
  durationMs: number,
  style: AnimationStyleLike,
  interpolate: (from: T, to: T, portion: number) => T,
  setValue: (value: T) => void,
): CorePropertyAnimation<T> {
  return new CorePropertyAnimation<T>({
    from,
    to,
    durationMs: Math.max(requireDuration(durationMs), 1),
    easing: style,
    interpolate,
    setValue,
  });
}

function facingOrientation(entity: { position: Position }, target: PositionTarget): Orientation {
  return orientationFromLookDirection(subtractVec3(targetPositionOf(target), entity.position));
}

function uprightOrientation(orientation: Orientation): Orientation {
  const forward = rotateVector(orientation, { x: 0, y: 0, z: -1 });
  return orientationFromLookDirection({ x: forward.x, y: 0, z: forward.z });
}

export class MoveAnimation extends WrappedValueAnimation<Position> {
  constructor(
    readonly entity: Positionable,
    readonly direction: MoveDirection | Vec3,
    readonly amount: number,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const delta = scaleVec3(vectorFromMoveDirection(direction), amount);
    const from = entity.position;
    const to = { x: from.x + delta.x, y: from.y + delta.y, z: from.z + delta.z };
    super(durationMs, style, createPropertyAnimation(from, to, durationMs, style, lerpVec3, (value) => {
      entity.position = value;
    }));
  }
}

export class TurnAnimation extends WrappedValueAnimation<Orientation> {
  constructor(
    readonly entity: Orientable,
    readonly axis: Vec3,
    readonly revolutions: number,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const from = entity.orientation;
    const delta = quaternionFromAxisAngle(axis.x, axis.y, axis.z, revolutions * Math.PI * 2);
    const to = quaternionMultiply(delta, from);
    super(durationMs, style, createPropertyAnimation(from, to, durationMs, style, nlerp, (value) => {
      entity.orientation = value;
    }));
  }
}

export class RollAnimation extends TurnAnimation {
  constructor(
    entity: Orientable,
    readonly direction: RollDirection,
    revolutions: number,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    super(entity, { x: 0, y: 0, z: 1 }, direction === "LEFT" ? revolutions : -revolutions, durationMs, style);
  }
}

export class MoveTowardAnimation extends WrappedValueAnimation<Position> {
  constructor(
    readonly entity: Positionable,
    readonly target: PositionTarget,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
    readonly amount: number = distanceBetween(entity.position, targetPositionOf(target)),
  ) {
    const from = entity.position;
    const offset = subtractVec3(targetPositionOf(target), from);
    const direction = normalizeVec3(offset);
    const to = {
      x: from.x + direction.x * amount,
      y: from.y + direction.y * amount,
      z: from.z + direction.z * amount,
    };
    super(durationMs, style, createPropertyAnimation(from, to, durationMs, style, lerpVec3, (value) => {
      entity.position = value;
    }));
  }
}

export class MoveAwayFromAnimation extends WrappedValueAnimation<Position> {
  constructor(
    readonly entity: Positionable,
    readonly target: PositionTarget,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
    readonly amount: number = distanceBetween(entity.position, targetPositionOf(target)),
  ) {
    const from = entity.position;
    const offset = subtractVec3(from, targetPositionOf(target));
    const direction = normalizeVec3(offset);
    const to = {
      x: from.x + direction.x * amount,
      y: from.y + direction.y * amount,
      z: from.z + direction.z * amount,
    };
    super(durationMs, style, createPropertyAnimation(from, to, durationMs, style, lerpVec3, (value) => {
      entity.position = value;
    }));
  }
}

export class TurnToFaceAnimation extends WrappedValueAnimation<Orientation> {
  constructor(
    readonly entity: Orientable,
    readonly target: PositionTarget,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const from = entity.orientation;
    const to = facingOrientation(entity, target);
    super(durationMs, style, createPropertyAnimation(from, to, durationMs, style, nlerp, (value) => {
      entity.orientation = value;
    }));
  }
}

export class OrientToUprightAnimation extends WrappedValueAnimation<Orientation> {
  constructor(
    readonly entity: Orientable,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const from = entity.orientation;
    const to = uprightOrientation(from);
    super(durationMs, style, createPropertyAnimation(from, to, durationMs, style, nlerp, (value) => {
      entity.orientation = value;
    }));
  }
}

export class StraightenOutJointsAnimation implements AnimationClip {
  readonly style: AnimationStyleLike;
  readonly durationMs: number;
  readonly #clip: ParallelAnimation;

  constructor(
    readonly entity: SJointedModel,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    this.style = style;
    this.durationMs = Math.max(requireDuration(durationMs), 1);
    this.#clip = new ParallelAnimation(entity.getJoints().map((joint) => createPropertyAnimation(
      joint.orientation,
      IDENTITY_ORIENTATION,
      this.durationMs,
      style,
      nlerp,
      (value) => {
        joint.orientation = value;
      },
    )));
  }

  get elapsedMs(): number { return this.#clip.elapsedMs; }
  get progress(): number { return this.#clip.progress; }
  get complete(): boolean { return this.#clip.complete; }
  get isComplete(): boolean { return this.#clip.isComplete; }
  update(deltaMs: number): AnimationClipState { return this.#clip.update(deltaMs); }
  reset(): void { this.#clip.reset(); }
}

export class PlaceAnimation implements AnimationClip {
  readonly durationMs: number;
  readonly style: AnimationStyleLike;
  readonly #clip: ImmediateAnimation;

  constructor(
    readonly entity: Positionable,
    readonly target: PositionTarget,
    durationMs = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    this.durationMs = requireDuration(durationMs);
    this.style = style;
    const previous = entity.position;
    this.#clip = new ImmediateAnimation(this.durationMs, () => {
      entity.position = targetPositionOf(target);
    }, () => {
      entity.position = previous;
    });
  }

  get elapsedMs(): number { return this.#clip.elapsedMs; }
  get progress(): number { return this.#clip.progress; }
  get complete(): boolean { return this.#clip.complete; }
  get isComplete(): boolean { return this.#clip.isComplete; }
  update(deltaMs: number): AnimationClipState { return this.#clip.update(deltaMs); }
  reset(): void { this.#clip.reset(); }
}

export class ResizeAnimation extends WrappedValueAnimation<Size> {
  constructor(
    readonly entity: Sizable,
    readonly targetSize: Size,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const from = entity.size;
    super(durationMs, style, createPropertyAnimation(from, targetSize, durationMs, style, lerpSize, (value) => {
      entity.size = value;
    }));
  }
}

export class SetPaintAnimation extends WrappedValueAnimation<string> {
  constructor(
    readonly entity: SModel,
    readonly paint: string,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const from = entity.color;
    super(durationMs, style, createPropertyAnimation(from, paint, durationMs, style, interpolatePaint, (value) => {
      entity.color = value;
    }));
  }
}

export class SetOpacityAnimation extends WrappedValueAnimation<number> {
  constructor(
    readonly entity: OpacityCapable,
    readonly opacity: number,
    durationMs: number,
    style: AnimationStyleLike = DEFAULT_STYLE,
  ) {
    const from = entity.opacity;
    super(durationMs, style, createPropertyAnimation(from, opacity, durationMs, style, lerpScalar, (value) => {
      entity.opacity = value;
    }));
  }
}
