import type { AnimationClip, AnimationObserver, AnimationStyleLike } from "./animation";
import {
  ModelImp,
  type JointId,
  type MoveDirection,
  type Orientation,
  type Position,
  type Property,
  SJoint,
  SJointedModel,
  SMarker,
  SModel,
  SMovableTurnable,
  SThing,
  STurnable,
  type Size,
  type SpeechBubbleState,
  type TextBubbleEntity,
  type Vec3,
  cloneSpeechBubbleState,
  cloneTextBubbleEntity,
} from "./story-api";
import { getVehicle as getEntityVehicle } from "./vehicle-system";

export interface BubbleDisplayResult {
  readonly clip: AnimationClip | null;
  readonly state: SpeechBubbleState | null;
  readonly bubble: TextBubbleEntity | null;
}

function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

function cloneOrientation(orientation: Orientation): Orientation {
  return { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
}

function cloneBubbleDisplay(model: SModel, clip: AnimationClip | null): BubbleDisplayResult {
  return {
    clip,
    state: model.speechBubble ? cloneSpeechBubbleState(model.speechBubble) : null,
    bubble: model.speechBubbleEntity ? cloneTextBubbleEntity(model.speechBubbleEntity) : null,
  };
}

function requireProperty<T>(entity: SThing, name: string): Property<T> {
  const property = entity.imp.getProperty<T>(name);
  if (!property) {
    throw new TypeError(`${entity.constructor.name} does not expose a ${name} property`);
  }
  return property;
}

function requireTurnable(entity: SThing): STurnable {
  if (!(entity instanceof STurnable)) {
    throw new TypeError(`${entity.constructor.name} does not support orientation methods`);
  }
  return entity;
}

function requireMovableTurnable(entity: SThing): SMovableTurnable {
  if (!(entity instanceof SMovableTurnable)) {
    throw new TypeError(`${entity.constructor.name} does not support movement methods`);
  }
  return entity;
}

function requireModel(entity: SThing): SModel {
  if (!(entity instanceof SModel)) {
    throw new TypeError(`${entity.constructor.name} does not support appearance or bubble methods`);
  }
  return entity;
}

function requireMarker(entity: SThing): SMarker {
  if (!(entity instanceof SMarker)) {
    throw new TypeError(`${entity.constructor.name} does not support marker movement methods`);
  }
  return entity;
}

function requireJoint(entity: SThing, joint: string | JointId): SJoint {
  const model = getJointedModel(entity);
  const resolved = model.getJointEntity(joint);
  if (!resolved) {
    const jointName = typeof joint === "string" ? joint : joint.name;
    throw new TypeError(`${entity.constructor.name} does not define joint ${jointName}`);
  }
  return resolved;
}

export function move(
  entity: SThing,
  direction: MoveDirection | Vec3,
  amount: number,
  duration = 0,
  style?: AnimationStyleLike,
  observer?: AnimationObserver,
): AnimationClip | null {
  return requireMovableTurnable(entity).move(direction, amount, duration, style, observer);
}

export function moveToward(entity: SThing, target: SThing, amount: number): void {
  requireMovableTurnable(entity).moveToward(target, amount);
}

export function moveAwayFrom(entity: SThing, target: SThing, amount: number): void {
  requireMovableTurnable(entity).moveAwayFrom(target, amount);
}

export function moveTo(entity: SThing, target: SThing): void {
  requireMovableTurnable(entity).moveTo(target);
}

export function turnToFace(entity: SThing, target: SThing): void {
  requireTurnable(entity).turnToFace(target);
}

export function orientToUpright(entity: SThing): void {
  requireTurnable(entity).orientToUpright();
}

export function setPaint(entity: SThing, paint: string): void {
  if (typeof paint !== "string" || paint.trim().length === 0) {
    throw new TypeError("paint must be a non-empty string");
  }
  requireProperty<string>(entity, "paint").setValue(paint);
}

export function setOpacity(entity: SThing, opacity: number): void {
  if (!Number.isFinite(opacity)) {
    throw new TypeError("opacity must be a finite number");
  }
  requireProperty<number>(entity, "opacity").setValue(opacity);
}

export function setSize(entity: SThing, size: Size): void {
  const model = requireModel(entity);
  model.setSize(size);
}

export function resize(
  entity: SThing,
  factor: number,
  duration = 0,
  style?: AnimationStyleLike,
  observer?: AnimationObserver,
): AnimationClip | null {
  const model = requireModel(entity);
  return model.resize(factor, duration, style, observer);
}

export function say(entity: SThing, text: string, duration = 0): BubbleDisplayResult {
  const model = requireModel(entity);
  const clip = (model.imp as ModelImp).say(text, duration);
  return cloneBubbleDisplay(model, clip);
}

export function think(entity: SThing, text: string, duration = 0): BubbleDisplayResult {
  const model = requireModel(entity);
  const clip = (model.imp as ModelImp).think(text, duration);
  return cloneBubbleDisplay(model, clip);
}

export function getJointedModel(entity: SThing): SJointedModel {
  if (!(entity instanceof SJointedModel)) {
    throw new TypeError(`${entity.constructor.name} does not support joint methods`);
  }
  return entity;
}

export function getJoint(entity: SThing, joint: string | JointId): SJoint | undefined {
  return getJointedModel(entity).getJointEntity(joint);
}

export function setJointRotation(entity: SThing, joint: string | JointId, orientation: Orientation): SJoint {
  const resolvedJoint = requireJoint(entity, joint);
  resolvedJoint.orientation = cloneOrientation(orientation);
  return resolvedJoint;
}

export function straightenOutJoints(entity: SThing): void {
  getJointedModel(entity).straightenOutJoints();
}

export function getPosition(entity: SThing): Position {
  return clonePosition(requireProperty<Position>(entity, "position").value);
}

export function getOrientation(entity: SThing): Orientation {
  return cloneOrientation(requireProperty<Orientation>(entity, "orientation").value);
}

export function getPaint(entity: SThing): string {
  return requireProperty<string>(entity, "paint").value;
}

export function getOpacity(entity: SThing): number {
  return requireProperty<number>(entity, "opacity").value;
}

export function getVehicle(entity: SThing): SThing | null {
  return getEntityVehicle(entity);
}

export function isShowing(entity: SThing): boolean {
  return entity.isShowing;
}

export function moveAndOrientTo(entity: SThing, target: SThing): void {
  requireMarker(entity).moveAndOrientTo(target);
}
