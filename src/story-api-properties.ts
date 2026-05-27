import { easeIn, easeInOut, easeOut, lerpScalar, lerpSize, lerpVec3, linear } from "./animation";
import {
  BooleanProperty as BaseBooleanProperty,
  NumberProperty,
  OrientationProperty as BaseOrientationProperty,
  PositionProperty as BasePositionProperty,
  Property,
  PropertyOwnerImp,
  ReferenceProperty,
  SizeProperty as BaseSizeProperty,
} from "./story-api/expanded-implementation";
import {
  IDENTITY_ORIENTATION,
  UNIT_SIZE,
  ZERO_POSITION,
  cloneOrientation,
  clonePosition,
  cloneSize,
} from "./story-api/expanded-types";
import type { Orientation, Position, Size } from "./story-api/types";

export interface ColorPaint {
  readonly kind: "color";
  readonly color: string;
}

export interface TexturePaint {
  readonly kind: "texture";
  readonly texture: string;
  readonly mix: number;
  readonly tint?: string;
}

export type PaintValue = ColorPaint | TexturePaint;

export interface TextValue {
  readonly text: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly color: string;
}

export interface VehicleReference {
  readonly id: string;
  readonly name?: string;
  readonly typeName?: string;
}

const DEFAULT_TEXT_VALUE: TextValue = Object.freeze({
  text: "",
  fontFamily: "Arial",
  fontSize: 16,
  color: "#ffffff",
});

class StoryPropertyOwner extends PropertyOwnerImp {
}

function createOwner(): PropertyOwnerImp {
  return new StoryPropertyOwner();
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

function clampPortion(value: number): number {
  return clamp01(value);
}

function sanitizeHexColor(value: string): string {
  const normalized = value.trim().toLowerCase();
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized;
  }
  throw new TypeError(`expected a #rgb or #rrggbb color, got ${value}`);
}

function parseHexColor(value: string): { r: number; g: number; b: number } {
  const normalized = sanitizeHexColor(value);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function formatHexColor(value: { r: number; g: number; b: number }): string {
  const clampChannel = (channel: number) => Math.min(Math.max(Math.round(channel), 0), 255);
  return `#${[value.r, value.g, value.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function lerpColor(from: string, to: string, portion: number): string {
  const left = parseHexColor(from);
  const right = parseHexColor(to);
  return formatHexColor({
    r: lerpScalar(left.r, right.r, clampPortion(portion)),
    g: lerpScalar(left.g, right.g, clampPortion(portion)),
    b: lerpScalar(left.b, right.b, clampPortion(portion)),
  });
}

function clonePaintValue(value: PaintValue): PaintValue {
  return value.kind === "color"
    ? { kind: "color", color: sanitizeHexColor(value.color) }
    : {
      kind: "texture",
      texture: value.texture,
      mix: clamp01(value.mix),
      ...(value.tint ? { tint: sanitizeHexColor(value.tint) } : {}),
    };
}

function paintEquals(left: PaintValue, right: PaintValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function interpolatePaintValue(from: PaintValue, to: PaintValue, portion: number): PaintValue {
  const clamped = clampPortion(portion);
  if (from.kind === "color" && to.kind === "color") {
    return { kind: "color", color: lerpColor(from.color, to.color, clamped) };
  }
  if (from.kind === "texture" && to.kind === "texture" && from.texture === to.texture) {
    return {
      kind: "texture",
      texture: to.texture,
      mix: lerpScalar(from.mix, to.mix, clamped),
      ...(from.tint || to.tint ? { tint: lerpColor(from.tint ?? "#ffffff", to.tint ?? "#ffffff", clamped) } : {}),
    };
  }
  return {
    kind: "texture",
    texture: to.kind === "texture" ? to.texture : "generated-color-overlay",
    mix: clamped,
    ...(to.kind === "texture" && to.tint ? { tint: sanitizeHexColor(to.tint) } : {}),
  };
}

function normalizeQuaternion(value: Orientation): Orientation {
  const magnitude = Math.hypot(value.x, value.y, value.z, value.w);
  if (magnitude === 0 || !Number.isFinite(magnitude)) {
    return cloneOrientation(IDENTITY_ORIENTATION);
  }
  return {
    x: value.x / magnitude,
    y: value.y / magnitude,
    z: value.z / magnitude,
    w: value.w / magnitude,
  };
}

export function slerpQuaternion(from: Orientation, to: Orientation, portion: number): Orientation {
  const clamped = clampPortion(portion);
  let left = normalizeQuaternion(from);
  let right = normalizeQuaternion(to);
  let dot = left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;

  if (dot < 0) {
    dot = -dot;
    right = { x: -right.x, y: -right.y, z: -right.z, w: -right.w };
  }

  if (dot > 0.9995) {
    return normalizeQuaternion({
      x: lerpScalar(left.x, right.x, clamped),
      y: lerpScalar(left.y, right.y, clamped),
      z: lerpScalar(left.z, right.z, clamped),
      w: lerpScalar(left.w, right.w, clamped),
    });
  }

  const theta0 = Math.acos(Math.min(Math.max(dot, -1), 1));
  const theta = theta0 * clamped;
  const sinTheta0 = Math.sin(theta0);
  const sinTheta = Math.sin(theta);
  const scaleLeft = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
  const scaleRight = sinTheta / sinTheta0;

  left = normalizeQuaternion(left);
  return normalizeQuaternion({
    x: left.x * scaleLeft + right.x * scaleRight,
    y: left.y * scaleLeft + right.y * scaleRight,
    z: left.z * scaleLeft + right.z * scaleRight,
    w: left.w * scaleLeft + right.w * scaleRight,
  });
}

function cloneTextValue(value: TextValue): TextValue {
  return {
    text: value.text,
    fontFamily: value.fontFamily,
    fontSize: value.fontSize,
    color: sanitizeHexColor(value.color),
  };
}

function textEquals(left: TextValue, right: TextValue): boolean {
  return left.text === right.text
    && left.fontFamily === right.fontFamily
    && left.fontSize === right.fontSize
    && sanitizeHexColor(left.color) === sanitizeHexColor(right.color);
}

function interpolateTextValue(from: TextValue, to: TextValue, portion: number): TextValue {
  const clamped = clampPortion(portion);
  return {
    text: clamped >= 1 ? to.text : from.text,
    fontFamily: clamped >= 1 ? to.fontFamily : from.fontFamily,
    fontSize: lerpScalar(from.fontSize, to.fontSize, clamped),
    color: lerpColor(from.color, to.color, clamped),
  };
}

export function createColorPaint(color: string): ColorPaint {
  return { kind: "color", color: sanitizeHexColor(color) };
}

export function createTexturePaint(texture: string, mix = 1, tint?: string): TexturePaint {
  return {
    kind: "texture",
    texture,
    mix: clamp01(mix),
    ...(tint ? { tint: sanitizeHexColor(tint) } : {}),
  };
}

export function createTextValue(text: string, fontFamily = "Arial", fontSize = 16, color = "#ffffff"): TextValue {
  return {
    text,
    fontFamily,
    fontSize,
    color: sanitizeHexColor(color),
  };
}

export class PaintProperty extends Property<PaintValue> {
  constructor(name = "paint", initialValue: PaintValue = createColorPaint("#ffffff"), owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, clonePaintValue(initialValue), {
      validate: (value) => typeof value === "object" && value !== null && (value.kind === "color" || value.kind === "texture"),
      clone: clonePaintValue,
      equals: paintEquals,
      interpolate: interpolatePaintValue,
    });
  }

  sample(target: PaintValue, portion: number): PaintValue {
    return interpolatePaintValue(this.value, clonePaintValue(target), portion);
  }

  setColor(color: string): boolean {
    return this.setValue(createColorPaint(color));
  }

  setTexture(texture: string, mix = 1, tint?: string): boolean {
    return this.setValue(createTexturePaint(texture, mix, tint));
  }
}

export class PositionProperty extends BasePositionProperty {
  constructor(name = "position", initialValue: Position = ZERO_POSITION, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, clonePosition(initialValue));
  }

  sample(target: Position, portion: number): Position {
    return lerpVec3(this.value, clonePosition(target), clampPortion(portion));
  }

  translate(delta: Position): Position {
    const next = {
      x: this.value.x + delta.x,
      y: this.value.y + delta.y,
      z: this.value.z + delta.z,
    };
    this.setValue(next);
    return this.value;
  }

  subtract(delta: Position): Position {
    return this.translate({ x: -delta.x, y: -delta.y, z: -delta.z });
  }

  distanceTo(target: Position): number {
    const current = this.value;
    return Math.hypot(target.x - current.x, target.y - current.y, target.z - current.z);
  }
}

export class OrientationProperty extends BaseOrientationProperty {
  constructor(name = "orientation", initialValue: Orientation = IDENTITY_ORIENTATION, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, normalizeQuaternion(initialValue));
  }

  setValue(nextValue: Orientation): boolean {
    return super.setValue(normalizeQuaternion(nextValue));
  }

  setValueSilently(nextValue: Orientation): boolean {
    return super.setValueSilently(normalizeQuaternion(nextValue));
  }

  sample(target: Orientation, portion: number): Orientation {
    return slerpQuaternion(this.value, normalizeQuaternion(target), portion);
  }
}

export class SizeProperty extends BaseSizeProperty {
  constructor(name = "size", initialValue: Size = UNIT_SIZE, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, cloneSize(initialValue));
  }

  sample(target: Size, portion: number): Size {
    return lerpSize(this.value, cloneSize(target), clampPortion(portion));
  }

  scaleProportionally(factor: number): Size {
    const current = this.value;
    const next = {
      width: current.width * factor,
      height: current.height * factor,
      depth: current.depth * factor,
    };
    this.setValue(next);
    return this.value;
  }
}

export class OpacityProperty extends NumberProperty {
  constructor(name = "opacity", initialValue = 1, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, clamp01(initialValue), { min: 0, max: 1 });
  }

  fadeBy(delta: number): number {
    this.setValue(this.value + delta);
    return this.value;
  }
}

export class TextProperty extends Property<TextValue> {
  constructor(name = "text", initialValue: TextValue = DEFAULT_TEXT_VALUE, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, cloneTextValue(initialValue), {
      validate: (value) => typeof value.text === "string"
        && typeof value.fontFamily === "string"
        && Number.isFinite(value.fontSize)
        && value.fontSize > 0
        && typeof value.color === "string",
      clone: cloneTextValue,
      equals: textEquals,
      interpolate: interpolateTextValue,
    });
  }

  sample(target: TextValue, portion: number): TextValue {
    return interpolateTextValue(this.value, cloneTextValue(target), portion);
  }

  setText(text: string): boolean {
    return this.setValue({ ...this.value, text });
  }

  setStyle(style: Partial<Omit<TextValue, "text">>): boolean {
    return this.setValue({
      ...this.value,
      ...style,
      ...(style.color ? { color: sanitizeHexColor(style.color) } : {}),
    });
  }
}

export class BooleanProperty extends BaseBooleanProperty {
  constructor(name = "isShowing", initialValue = false, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, initialValue);
  }

  toggle(): boolean {
    this.setValue(!this.value);
    return this.value;
  }
}

export class VehicleProperty extends ReferenceProperty<VehicleReference | null> {
  constructor(name = "vehicle", initialValue: VehicleReference | null = null, owner: PropertyOwnerImp = createOwner()) {
    super(owner, name, initialValue);
  }

  attach(vehicle: VehicleReference): boolean {
    return this.setValue(vehicle);
  }

  detach(): boolean {
    return this.setValue(null);
  }
}

export function applyAnimationStyle(style: "BEGIN_GENTLY" | "END_GENTLY" | "BEGIN_AND_END_GENTLY" | "NONE", portion: number): number {
  switch (style) {
    case "BEGIN_GENTLY":
      return easeIn(clampPortion(portion));
    case "END_GENTLY":
      return easeOut(clampPortion(portion));
    case "BEGIN_AND_END_GENTLY":
      return easeInOut(clampPortion(portion));
    case "NONE":
    default:
      return linear(clampPortion(portion));
  }
}
