import {
  IDENTITY_ORIENTATION,
  UNIT_SCALE,
  UNIT_SIZE,
  ZERO_POSITION,
  addVec3,
  interpolateNumber,
  interpolatePosition,
  isFiniteSize,
  magnitudeVec3,
  normalizeVec3,
  orientationFromLookDirection,
  quaternionFromAxisAngle,
  quaternionMultiply,
  relationOffset,
  revolutionsToRadians,
  rotateVector,
  samePosition,
  sameSize,
  scaleVec3,
  subtractVec3,
  vectorFromMoveDirection,
} from "./expanded-math";
import {
  DEFAULT_STYLE,
  ParallelAnimation,
  PropertyAnimation,
  type AnimationClip,
  type AnimationObserver,
  type AnimationStyleLike,
} from "../animation";
import {
  cloneTextBubbleEntity,
  type MoveDirection,
  type Orientation,
  type Position,
  type RollDirection,
  type Size,
  type SpatialRelation,
  type SpeechBubbleState,
  type TextBubbleEntity,
  type TurnDirection,
  type Vec3,
} from "./expanded-types";
import {
  NumberProperty,
  OrientationProperty,
  PositionProperty,
  Property,
  SizeProperty,
  StringProperty,
  type ImplementableEntity,
} from "./expanded-implementation-properties";
import { notifyImmediateObserver } from "./expanded-implementation-animation-utils";
import { EntityImp } from "./expanded-implementation-entities-core";

const nonEmptyString = (value: string): boolean => typeof value === "string" && value.trim().length > 0;
let textBubbleId = 0;

function sameTextBubbleEntity(left: TextBubbleEntity | null, right: TextBubbleEntity | null): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.id === right.id
    && left.kind === right.kind
    && left.text === right.text
    && left.duration === right.duration
    && samePosition(left.anchor, right.anchor)
    && sameSize(left.size, right.size)
  );
}

export class TransformableImp extends EntityImp {
  readonly position = this.registerProperty(new PositionProperty(this, "position", ZERO_POSITION));
  readonly orientation = this.registerProperty(new OrientationProperty(this, "orientation", IDENTITY_ORIENTATION));
  readonly paint = this.registerProperty(new StringProperty<string>(this, "paint", "WHITE"));

  move(
    direction: MoveDirection | Vec3,
    amount: number,
    duration = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
    observer?: AnimationObserver,
  ): PropertyAnimation<Position> | null {
    if (!Number.isFinite(amount)) {
      throw new TypeError("amount must be a finite number");
    }
    const basis = typeof direction === "string"
      ? rotateVector(this.getAbsoluteOrientation(), vectorFromMoveDirection(direction))
      : normalizeVec3(direction);
    const offset = scaleVec3(normalizeVec3(basis), amount);
    const from = this.getAbsolutePosition();
    const to = addVec3(from, offset);
    const adjustedDuration = this.adjustDurationIfNecessary(duration);
    if (adjustedDuration <= 0) {
      this.setAbsolutePosition(to);
      notifyImmediateObserver(observer);
      return null;
    }
    return new PropertyAnimation<Position>({
      from,
      to,
      durationMs: adjustedDuration * 1000,
      easing: style,
      interpolate: interpolatePosition,
      setValue: (value) => {
        this.setAbsolutePosition(value);
      },
      observer,
    });
  }

  moveToward(target: EntityImp, amount: number): void {
    if (!Number.isFinite(amount)) {
      throw new TypeError("amount must be a finite number");
    }
    const delta = subtractVec3(target.getAbsolutePosition(), this.getAbsolutePosition());
    const movement = magnitudeVec3(delta) > 0
      ? scaleVec3(normalizeVec3(delta), amount)
      : { x: 0, y: 0, z: amount };
    this.setAbsolutePosition(addVec3(this.getAbsolutePosition(), movement));
  }

  moveAwayFrom(target: EntityImp, amount: number): void {
    this.moveToward(target, -amount);
  }

  moveTo(target: EntityImp): void {
    this.setAbsolutePosition(target.getAbsolutePosition());
  }

  moveAndOrientTo(target: EntityImp): void {
    this.moveTo(target);
    this.setAbsoluteOrientation(target.getAbsoluteOrientation());
  }

  place(relation: SpatialRelation, target: EntityImp, offset = 0): void {
    const targetPosition = target.getAbsolutePosition();
    const targetSize = target.getProperty<Size>("size")?.value ?? UNIT_SIZE;
    const selfSize = this.getProperty<Size>("size")?.value ?? UNIT_SIZE;
    const relationDistance = (() => {
      switch (relation) {
        case "ABOVE":
        case "BELOW":
          return (targetSize.height + selfSize.height) / 2 + offset;
        case "LEFT_OF":
        case "RIGHT_OF":
          return (targetSize.width + selfSize.width) / 2 + offset;
        case "IN_FRONT_OF":
        case "BEHIND":
          return (targetSize.depth + selfSize.depth) / 2 + offset;
      }
    })();
    this.setAbsolutePosition(addVec3(targetPosition, relationOffset(relation, relationDistance)));
  }

  turn(
    direction: TurnDirection,
    amount: number,
    duration = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
    observer?: AnimationObserver,
  ): PropertyAnimation<Orientation> | null {
    if (!Number.isFinite(amount)) {
      throw new TypeError("amount must be a finite number");
    }
    const signed = direction === "LEFT" ? amount : -amount;
    const delta = quaternionFromAxisAngle(0, 1, 0, revolutionsToRadians(signed));
    return this.orientation.animateValue(quaternionMultiply(delta, this.orientation.value), duration, style, observer);
  }

  roll(
    direction: RollDirection,
    amount: number,
    duration = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
    observer?: AnimationObserver,
  ): PropertyAnimation<Orientation> | null {
    if (!Number.isFinite(amount)) {
      throw new TypeError("amount must be a finite number");
    }
    const signed = direction === "LEFT" ? amount : -amount;
    const delta = quaternionFromAxisAngle(0, 0, 1, revolutionsToRadians(signed));
    return this.orientation.animateValue(quaternionMultiply(delta, this.orientation.value), duration, style, observer);
  }

  orientTo(target: EntityImp): void {
    this.setAbsoluteOrientation(target.getAbsoluteOrientation());
  }

  orientToUpright(): void {
    const forward = rotateVector(this.getAbsoluteOrientation(), { x: 0, y: 0, z: -1 });
    const planarForward = { x: forward.x, y: 0, z: forward.z };
    this.setAbsoluteOrientation(orientationFromLookDirection(planarForward));
  }

  pointAt(target: EntityImp): void {
    const direction = subtractVec3(target.getAbsolutePosition(), this.getAbsolutePosition());
    if (magnitudeVec3(direction) === 0) {
      return;
    }
    this.setAbsoluteOrientation(orientationFromLookDirection(direction));
  }

  turnToFace(target: EntityImp): void {
    const direction = subtractVec3(target.getAbsolutePosition(), this.getAbsolutePosition());
    const planarDirection = { x: direction.x, y: 0, z: direction.z };
    if (magnitudeVec3(planarDirection) === 0) {
      return;
    }
    this.setAbsoluteOrientation(orientationFromLookDirection(planarDirection));
  }

  isFacing(target: EntityImp): boolean {
    const forward = rotateVector(this.getAbsoluteOrientation(), { x: 0, y: 0, z: -1 });
    const towardTarget = normalizeVec3(subtractVec3(target.getAbsolutePosition(), this.getAbsolutePosition()));
    return magnitudeVec3(towardTarget) === 0 || (forward.x * towardTarget.x + forward.y * towardTarget.y + forward.z * towardTarget.z) > 0;
  }
}

export class ModelImp extends TransformableImp {
  readonly size = this.registerProperty(new SizeProperty(this, "size", UNIT_SIZE));
  readonly scale = this.registerProperty(new SizeProperty(this, "scale", UNIT_SCALE));
  readonly color = this.registerProperty(new StringProperty<string>(this, "color", "WHITE"));
  readonly opacity = this.registerProperty(new NumberProperty(this, "opacity", 1));
  readonly speechBubble = this.registerProperty(
    new Property<SpeechBubbleState | null>(this, "speechBubble", null, {
      clone: (value) => (value ? { ...value } : null),
      equals: (left, right) => JSON.stringify(left) === JSON.stringify(right),
    }),
  );
  readonly speechBubbleEntity = this.registerProperty(
    new Property<TextBubbleEntity | null>(this, "speechBubbleEntity", null, {
      clone: (value) => (value ? cloneTextBubbleEntity(value) : null),
      equals: sameTextBubbleEntity,
    }),
  );
  readonly speechBubbleProgress = this.registerProperty(new NumberProperty(this, "speechBubbleProgress", 0, { min: 0, max: 1 }));
  readonly lastSpokenText = this.registerProperty(new StringProperty<string | null>(this, "lastSpokenText", null, true));
  readonly lastThoughtText = this.registerProperty(new StringProperty<string | null>(this, "lastThoughtText", null, true));

  constructor(owner: ImplementableEntity) {
    super(owner);
    this.paint.bindBidirectional(this.color, "self");
  }

  setWidth(width: number): void {
    if (!Number.isFinite(width) || width <= 0) {
      throw new TypeError("width must be a positive finite number");
    }
    const size = this.size.value;
    this.size.setValue({ ...size, width });
  }

  setHeight(height: number): void {
    if (!Number.isFinite(height) || height <= 0) {
      throw new TypeError("height must be a positive finite number");
    }
    const size = this.size.value;
    this.size.setValue({ ...size, height });
  }

  setDepth(depth: number): void {
    if (!Number.isFinite(depth) || depth <= 0) {
      throw new TypeError("depth must be a positive finite number");
    }
    const size = this.size.value;
    this.size.setValue({ ...size, depth });
  }

  setScale(scale: Size): void {
    this.scale.setValue(scale);
    this.size.setValue(scale);
  }

  setSize(size: Size): void {
    if (!isFiniteSize(size) || size.width <= 0 || size.height <= 0 || size.depth <= 0) {
      throw new TypeError("size must contain positive finite dimensions");
    }
    this.size.setValue(size);
  }

  setColor(color: string): void {
    if (!nonEmptyString(color)) {
      throw new TypeError("color must be a non-empty string");
    }
    this.color.setValue(color);
  }

  setOpacity(opacity: number): void {
    if (!Number.isFinite(opacity)) {
      throw new TypeError("opacity must be a finite number");
    }
    this.opacity.setValue(opacity);
  }

  resize(
    factor: number,
    duration = 0,
    style: AnimationStyleLike = DEFAULT_STYLE,
    observer?: AnimationObserver,
  ): ParallelAnimation | null {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new TypeError("factor must be a positive finite number");
    }
    const nextSize = {
      width: this.size.value.width * factor,
      height: this.size.value.height * factor,
      depth: this.size.value.depth * factor,
    };
    const nextScale = {
      width: this.scale.value.width * factor,
      height: this.scale.value.height * factor,
      depth: this.scale.value.depth * factor,
    };
    const sizeAnimation = this.size.animateValue(nextSize, duration, style);
    const scaleAnimation = this.scale.animateValue(nextScale, duration, style);
    if (!sizeAnimation || !scaleAnimation) {
      notifyImmediateObserver(observer);
      return null;
    }
    return new ParallelAnimation([sizeAnimation, scaleAnimation], observer);
  }

  resizeWidth(factor: number): void {
    this.setWidth(this.size.value.width * factor);
  }

  resizeHeight(factor: number): void {
    this.setHeight(this.size.value.height * factor);
  }

  resizeDepth(factor: number): void {
    this.setDepth(this.size.value.depth * factor);
  }

  #createBubbleEntity(kind: "say" | "think", text: string, duration: number): TextBubbleEntity {
    const bounds = this.getBoundingBox();
    const anchor = bounds
      ? {
          x: (bounds.min.x + bounds.max.x) / 2,
          y: bounds.max.y,
          z: bounds.min.z,
        }
      : this.getAbsolutePosition();
    const lineCount = Math.max(1, Math.ceil(Math.max(text.length, 1) / 24));
    return {
      id: `bubble-${++textBubbleId}`,
      kind,
      text,
      duration,
      anchor,
      size: {
        width: Math.max(0.5, Math.min(6, Math.max(text.length, 1) * 0.12)),
        height: 0.3 + lineCount * 0.2,
        depth: 0.05,
      },
    };
  }

  #animateSpeechBubble(
    kind: "say" | "think",
    text: string,
    duration: number,
    lastText: Property<string | null>,
  ): AnimationClip | null {
    if (typeof text !== "string") {
      throw new TypeError("text must be a string");
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("duration must be a non-negative finite number");
    }
    lastText.setValue(text);
    this.speechBubbleProgress.setValue(0);
    this.speechBubble.setValue({ kind, text, duration });
    this.speechBubbleEntity.setValue(this.#createBubbleEntity(kind, text, duration));

    const adjustedDuration = this.adjustDurationIfNecessary(duration);
    if (adjustedDuration <= 0) {
      this.speechBubbleProgress.setValue(1);
      return null;
    }

    return new PropertyAnimation<number>({
      from: 0,
      to: 1,
      durationMs: adjustedDuration * 1000,
      easing: DEFAULT_STYLE,
      interpolate: interpolateNumber,
      setValue: (value) => {
        this.speechBubbleProgress.setValue(value);
        if (value >= 1) {
          this.speechBubble.setValue(null);
          this.speechBubbleEntity.setValue(null);
        }
      },
    });
  }

  say(text: string, duration = 0): AnimationClip | null {
    return this.#animateSpeechBubble("say", text, duration, this.lastSpokenText);
  }

  think(text: string, duration = 0): AnimationClip | null {
    return this.#animateSpeechBubble("think", text, duration, this.lastThoughtText);
  }
}

export class GroundImp extends EntityImp {
  readonly paint = this.registerProperty(new StringProperty<string>(this, "paint", "GRASS"));
  readonly opacity = this.registerProperty(new NumberProperty(this, "opacity", 1));
}

export class MarkerImp extends TransformableImp {
  readonly size = this.registerProperty(new SizeProperty(this, "size", UNIT_SIZE));
  readonly color = this.registerProperty(new StringProperty<string>(this, "color", "YELLOW"));
  readonly opacity = this.registerProperty(new NumberProperty(this, "opacity", 1));

  constructor(owner: ImplementableEntity) {
    super(owner);
    this.paint.setValueSilently("YELLOW");
    this.color.bindBidirectional(this.paint, "self");
  }
}

export class ObjectMarkerImp extends MarkerImp {}
export class CameraMarkerImp extends MarkerImp {}
export class TargetImp extends TransformableImp {}
export class SunImp extends TransformableImp {}

export class CameraImp extends TransformableImp {
  readonly nearClippingPlaneDistance = this.registerProperty(new NumberProperty(this, "nearClippingPlaneDistance", 0.1, { min: 0.0001 }));
  readonly farClippingPlaneDistance = this.registerProperty(new NumberProperty(this, "farClippingPlaneDistance", 1000, { min: 0.0001 }));
  readonly horizontalViewingAngle = this.registerProperty(new NumberProperty(this, "horizontalViewingAngle", Math.PI / 3, { min: 0.0001 }));
  readonly verticalViewingAngle = this.registerProperty(new NumberProperty(this, "verticalViewingAngle", Math.PI / 3, { min: 0.0001 }));

  moveAndOrientToAGoodVantagePointOf(target: EntityImp, distance = 8): void {
    const targetPosition = target.getAbsolutePosition();
    this.setAbsolutePosition({ x: targetPosition.x, y: targetPosition.y + distance / 4, z: targetPosition.z + distance });
    this.pointAt(target);
  }
}
