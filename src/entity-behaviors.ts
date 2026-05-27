import type { AnimationClip } from "./animation";
import {
  type ModelImp,
  type MoveDirection,
  type Orientation,
  type Position,
  type RollDirection,
  type Size,
  SModel,
  SMovableTurnable,
  SThing,
  STurnable,
  cloneSpeechBubbleState,
  cloneTextBubbleEntity,
  getEntityBoundingBox,
} from "./story-api";
import {
  addVec3,
  distanceBetween,
  interpolateNumber,
  interpolatePosition,
  interpolateSize,
  normalizeQuaternion,
  normalizeVec3,
  orientationFromLookDirection,
  quaternionFromAxisAngle,
  quaternionMultiply,
  revolutionsToRadians,
  rotateVector,
  scaleVec3,
  subtractVec3,
  vectorFromMoveDirection,
} from "./story-api/expanded-math";
import type { SpeechBubbleState, TextBubbleEntity, TurnDirection, Vec3 } from "./story-api/expanded-types";

export interface TransformStep {
  readonly index: number;
  readonly progress: number;
  readonly position: Position;
  readonly orientation: Orientation;
}

export interface SizeStep {
  readonly index: number;
  readonly progress: number;
  readonly size: Size;
}

export interface AppearanceStep {
  readonly index: number;
  readonly progress: number;
  readonly opacity: number;
  readonly color: string;
}

export interface SpeechStep {
  readonly index: number;
  readonly progress: number;
  readonly visible: boolean;
  readonly state: SpeechBubbleState | null;
  readonly bubble: TextBubbleEntity | null;
}

type PositionedThing = SThing & { position: Position };
type OrientedThing = SThing & { orientation: Orientation };

interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const NAMED_COLORS = new Map<string, string>([
  ["BLACK", "#000000"],
  ["BLUE", "#0000FF"],
  ["CYAN", "#00FFFF"],
  ["GRAY", "#808080"],
  ["GREEN", "#00FF00"],
  ["MAGENTA", "#FF00FF"],
  ["RED", "#FF0000"],
  ["WHITE", "#FFFFFF"],
  ["YELLOW", "#FFFF00"],
]);

function clampSteps(steps: number): number {
  return Math.max(1, Math.floor(steps));
}

function progressOf(index: number, steps: number): number {
  return index / steps;
}

function clonePosition(value: Position): Position {
  return { x: value.x, y: value.y, z: value.z };
}

function cloneOrientation(value: Orientation): Orientation {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}

function cloneSize(value: Size): Size {
  return { width: value.width, height: value.height, depth: value.depth };
}

function positionOf(entity: SThing): Position {
  if ("position" in entity) {
    return clonePosition((entity as PositionedThing).position);
  }
  const box = getEntityBoundingBox(entity);
  if (box) {
    return {
      x: (box.min.x + box.max.x) / 2,
      y: (box.min.y + box.max.y) / 2,
      z: (box.min.z + box.max.z) / 2,
    };
  }
  return { x: 0, y: 0, z: 0 };
}

function orientationOf(entity: SThing): Orientation {
  return "orientation" in entity
    ? cloneOrientation((entity as OrientedThing).orientation)
    : { x: 0, y: 0, z: 0, w: 1 };
}

function transformStep(index: number, steps: number, position: Position, orientation: Orientation): TransformStep {
  return {
    index,
    progress: progressOf(index, steps),
    position: clonePosition(position),
    orientation: cloneOrientation(orientation),
  };
}

function sizeStep(index: number, steps: number, size: Size): SizeStep {
  return {
    index,
    progress: progressOf(index, steps),
    size: cloneSize(size),
  };
}

function appearanceStep(index: number, steps: number, opacity: number, color: string): AppearanceStep {
  return {
    index,
    progress: progressOf(index, steps),
    opacity,
    color,
  };
}

function speechStep(index: number, steps: number, modelImp: ModelImp): SpeechStep {
  const state = modelImp.speechBubble.value;
  const bubble = modelImp.speechBubbleEntity.value;
  return {
    index,
    progress: progressOf(index, steps),
    visible: bubble !== null,
    state: state ? cloneSpeechBubbleState(state) : null,
    bubble: bubble ? cloneTextBubbleEntity(bubble) : null,
  };
}

function interpolateOrientation(from: Orientation, to: Orientation, portion: number): Orientation {
  return normalizeQuaternion({
    x: interpolateNumber(from.x, to.x, portion),
    y: interpolateNumber(from.y, to.y, portion),
    z: interpolateNumber(from.z, to.z, portion),
    w: interpolateNumber(from.w, to.w, portion),
  });
}

function parseColor(value: string): RgbColor | null {
  const normalized = value.trim();
  const resolved = NAMED_COLORS.get(normalized.toUpperCase()) ?? normalized;
  const shortHexMatch = /^#([\da-f]{3})$/i.exec(resolved);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split("").map((channel) => parseInt(channel + channel, 16));
    return { r, g, b };
  }
  const longHexMatch = /^#([\da-f]{6})$/i.exec(resolved);
  if (longHexMatch) {
    return {
      r: parseInt(longHexMatch[1].slice(0, 2), 16),
      g: parseInt(longHexMatch[1].slice(2, 4), 16),
      b: parseInt(longHexMatch[1].slice(4, 6), 16),
    };
  }
  const rgbMatch = /^rgba?\(([^)]+)\)$/i.exec(resolved);
  if (!rgbMatch) {
    return null;
  }
  const [r, g, b] = rgbMatch[1].split(",").slice(0, 3).map((channel) => Number(channel.trim()));
  if (![r, g, b].every(Number.isFinite)) {
    return null;
  }
  return { r, g, b };
}

function formatColor(color: RgbColor): string {
  const toHex = (value: number): string => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function interpolateColor(from: string, to: string, portion: number): string {
  const left = parseColor(from);
  const right = parseColor(to);
  if (!left || !right) {
    return portion >= 1 ? to : from;
  }
  return formatColor({
    r: interpolateNumber(left.r, right.r, portion),
    g: interpolateNumber(left.g, right.g, portion),
    b: interpolateNumber(left.b, right.b, portion),
  });
}

function basisForDirection(entity: SMovableTurnable, direction: MoveDirection | Vec3): Vec3 {
  return typeof direction === "string"
    ? rotateVector(entity.orientation, vectorFromMoveDirection(direction))
    : normalizeVec3(direction);
}

function applySpeech(model: SModel, kind: "say" | "think", text: string, durationSeconds: number, slices: number): SpeechStep[] {
  const modelImp = model.imp as ModelImp;
  const clip: AnimationClip | null = kind === "say"
    ? modelImp.say(text, durationSeconds)
    : modelImp.think(text, durationSeconds);
  const steps = clampSteps(slices);
  const timeline = [speechStep(0, steps, modelImp)];
  if (!clip) {
    return timeline;
  }
  const deltaMs = clip.durationMs / steps;
  for (let index = 1; index <= steps; index += 1) {
    clip.update(deltaMs);
    timeline.push(speechStep(index, steps, modelImp));
  }
  return timeline;
}

export class MovementBehavior {
  walk(entity: SMovableTurnable, direction: MoveDirection | Vec3, distance: number, steps = 4): TransformStep[] {
    const count = clampSteps(steps);
    const startPosition = clonePosition(entity.position);
    const orientation = cloneOrientation(entity.orientation);
    const offset = scaleVec3(normalizeVec3(basisForDirection(entity, direction)), distance);
    const targetPosition = addVec3(startPosition, offset);
    const transforms: TransformStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      transforms.push(transformStep(index, count, interpolatePosition(startPosition, targetPosition, progressOf(index, count)), orientation));
    }
    entity.position = clonePosition(targetPosition);
    return transforms;
  }

  run(entity: SMovableTurnable, direction: MoveDirection | Vec3, distance: number, steps = 3): TransformStep[] {
    return this.walk(entity, direction, distance, steps);
  }

  turn(entity: STurnable, direction: TurnDirection, amount: number, steps = 4): TransformStep[] {
    const count = clampSteps(steps);
    const signedAmount = direction === "LEFT" ? amount : -amount;
    const stepDelta = quaternionFromAxisAngle(0, 1, 0, revolutionsToRadians(signedAmount / count));
    const position = positionOf(entity);
    let current = cloneOrientation(entity.orientation);
    const transforms: TransformStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      current = quaternionMultiply(stepDelta, current);
      transforms.push(transformStep(index, count, position, current));
    }
    entity.orientation = cloneOrientation(current);
    return transforms;
  }

  roll(entity: STurnable, direction: RollDirection, amount: number, steps = 4): TransformStep[] {
    const count = clampSteps(steps);
    const signedAmount = direction === "LEFT" ? amount : -amount;
    const stepDelta = quaternionFromAxisAngle(0, 0, 1, revolutionsToRadians(signedAmount / count));
    const position = positionOf(entity);
    let current = cloneOrientation(entity.orientation);
    const transforms: TransformStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      current = quaternionMultiply(stepDelta, current);
      transforms.push(transformStep(index, count, position, current));
    }
    entity.orientation = cloneOrientation(current);
    return transforms;
  }
}

export class ResizeBehavior {
  grow(entity: SModel, factor: number, steps = 4): SizeStep[] {
    const count = clampSteps(steps);
    const start = cloneSize(entity.size);
    const target = {
      width: start.width * factor,
      height: start.height * factor,
      depth: start.depth * factor,
    };
    const sizes: SizeStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      sizes.push(sizeStep(index, count, interpolateSize(start, target, progressOf(index, count))));
    }
    entity.size = target;
    return sizes;
  }

  shrink(entity: SModel, factor: number, steps = 4): SizeStep[] {
    const safeFactor = factor === 0 ? 1 : factor;
    return this.grow(entity, 1 / safeFactor, steps);
  }
}

export class AppearanceBehavior {
  fade(entity: SModel, targetOpacity: number, steps = 4): AppearanceStep[] {
    const count = clampSteps(steps);
    const startOpacity = entity.opacity;
    const color = entity.color;
    const states: AppearanceStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      const opacity = interpolateNumber(startOpacity, targetOpacity, progressOf(index, count));
      states.push(appearanceStep(index, count, opacity, color));
    }
    entity.opacity = targetOpacity;
    return states;
  }

  colorShift(entity: SModel, targetColor: string, steps = 4): AppearanceStep[] {
    const count = clampSteps(steps);
    const startColor = entity.color;
    const opacity = entity.opacity;
    const states: AppearanceStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      states.push(appearanceStep(index, count, opacity, interpolateColor(startColor, targetColor, progressOf(index, count))));
    }
    entity.color = targetColor;
    return states;
  }
}

export class SpeechBehavior {
  say(entity: SModel, text: string, durationSeconds = 0, steps = 4): SpeechStep[] {
    return applySpeech(entity, "say", text, durationSeconds, steps);
  }

  think(entity: SModel, text: string, durationSeconds = 0, steps = 4): SpeechStep[] {
    return applySpeech(entity, "think", text, durationSeconds, steps);
  }
}

export class PointAtBehavior {
  track(entity: STurnable, target: SThing, steps = 4): TransformStep[] {
    const count = clampSteps(steps);
    const startOrientation = cloneOrientation(entity.orientation);
    const position = positionOf(entity);
    const delta = subtractVec3(positionOf(target), position);
    if (distanceBetween(delta, { x: 0, y: 0, z: 0 }) === 0) {
      return [transformStep(1, 1, position, startOrientation)];
    }
    const targetOrientation = orientationFromLookDirection(delta);
    const transforms: TransformStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      transforms.push(transformStep(index, count, position, interpolateOrientation(startOrientation, targetOrientation, progressOf(index, count))));
    }
    entity.orientation = cloneOrientation(targetOrientation);
    return transforms;
  }
}

export class MoveTowardBehavior {
  approach(entity: SMovableTurnable, target: SThing, speed: number, steps = 4): TransformStep[] {
    const count = clampSteps(steps);
    const transforms: TransformStep[] = [];
    let current = clonePosition(entity.position);
    const orientation = cloneOrientation(entity.orientation);
    for (let index = 1; index <= count; index += 1) {
      const destination = positionOf(target);
      const delta = subtractVec3(destination, current);
      const remaining = distanceBetween(destination, current);
      const stepDistance = Math.min(Math.max(speed, 0), remaining);
      current = stepDistance === 0
        ? current
        : addVec3(current, scaleVec3(normalizeVec3(delta), stepDistance));
      transforms.push(transformStep(index, count, current, orientation));
    }
    entity.position = clonePosition(current);
    return transforms;
  }
}

export class TurnToFaceBehavior {
  track(entity: STurnable, target: SThing, steps = 4): TransformStep[] {
    const count = clampSteps(steps);
    const startOrientation = cloneOrientation(entity.orientation);
    const position = positionOf(entity);
    const delta = subtractVec3(positionOf(target), position);
    const planarDelta = { x: delta.x, y: 0, z: delta.z };
    if (distanceBetween(planarDelta, { x: 0, y: 0, z: 0 }) === 0) {
      return [transformStep(1, 1, position, startOrientation)];
    }
    const targetOrientation = orientationFromLookDirection(planarDelta);
    const transforms: TransformStep[] = [];
    for (let index = 1; index <= count; index += 1) {
      transforms.push(transformStep(index, count, position, interpolateOrientation(startOrientation, targetOrientation, progressOf(index, count))));
    }
    entity.orientation = cloneOrientation(targetOrientation);
    return transforms;
  }
}

export class PlaceBehavior {
  snapToEntity(entity: SMovableTurnable, target: SThing): TransformStep {
    const position = positionOf(target);
    const orientation = orientationOf(target);
    entity.position = clonePosition(position);
    entity.orientation = cloneOrientation(orientation);
    return transformStep(1, 1, position, orientation);
  }

  snapToTransform(entity: SMovableTurnable, position: Position, orientation: Orientation = entity.orientation): TransformStep {
    entity.position = clonePosition(position);
    entity.orientation = cloneOrientation(orientation);
    return transformStep(1, 1, position, orientation);
  }
}
