/** 3D position in Alice's Y-up coordinate system. */
export interface Position {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Quaternion orientation. */
export interface Orientation {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

/** Axis-aligned size or scale triple. */
export interface Size {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** Identifies a joint in a jointed model's skeleton hierarchy. */
export interface JointId {
  readonly name: string;
  readonly parent?: string;
}

/** 3D vector for math contexts (bounding boxes, transforms). */
export type Vec3 = Position;

/** Axis-aligned bounding box with min/max corners. */
export interface BoundingBox {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** Local transform snapshot for an entity or joint. */
export interface TransformSnapshot {
  readonly position: Vec3;
  readonly orientation: Orientation;
}

/** Node in a skeleton joint hierarchy tree. */
export interface JointNode {
  readonly name: string;
  readonly parentName: string | null;
  readonly children: JointNode[];
  readonly localTransform: TransformSnapshot;
}

/** Captured text bubble state for say()/think(). */
export interface SpeechBubbleState {
  readonly kind: "say" | "think";
  readonly text: string;
  readonly duration: number;
}

/** Concrete bubble entity data created by say()/think(). */
export interface TextBubbleEntity {
  readonly id: string;
  readonly kind: "say" | "think";
  readonly text: string;
  readonly duration: number;
  readonly anchor: Position;
  readonly size: Size;
}

export const MoveDirection = Object.freeze({
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP: "UP",
  DOWN: "DOWN",
} as const);
export type MoveDirection = (typeof MoveDirection)[keyof typeof MoveDirection];

export const TurnDirection = Object.freeze({
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const);
export type TurnDirection = (typeof TurnDirection)[keyof typeof TurnDirection];

export const RollDirection = Object.freeze({
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const);
export type RollDirection = (typeof RollDirection)[keyof typeof RollDirection];

export const SpatialRelation = Object.freeze({
  ABOVE: "ABOVE",
  BELOW: "BELOW",
  LEFT_OF: "LEFT_OF",
  RIGHT_OF: "RIGHT_OF",
  IN_FRONT_OF: "IN_FRONT_OF",
  BEHIND: "BEHIND",
} as const);
export type SpatialRelation = (typeof SpatialRelation)[keyof typeof SpatialRelation];

const MOVE_DIRECTIONS = new Set<string>(Object.values(MoveDirection));
const TURN_DIRECTIONS = new Set<string>(Object.values(TurnDirection));
const ROLL_DIRECTIONS = new Set<string>(Object.values(RollDirection));
const SPATIAL_RELATIONS = new Set<string>(Object.values(SpatialRelation));

export const ZERO_POSITION: Position = Object.freeze({ x: 0, y: 0, z: 0 });
export const IDENTITY_ORIENTATION: Orientation = Object.freeze({ x: 0, y: 0, z: 0, w: 1 });
export const UNIT_SIZE: Size = Object.freeze({ width: 1, height: 1, depth: 1 });

export function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y, z: position.z };
}

export function cloneOrientation(orientation: Orientation): Orientation {
  return { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
}

export function cloneSize(size: Size): Size {
  return { width: size.width, height: size.height, depth: size.depth };
}

export function cloneBoundingBox(box: BoundingBox): BoundingBox {
  return { min: clonePosition(box.min), max: clonePosition(box.max) };
}

export function cloneSpeechBubbleState(value: SpeechBubbleState): SpeechBubbleState {
  return { kind: value.kind, text: value.text, duration: value.duration };
}

export function cloneTextBubbleEntity(value: TextBubbleEntity): TextBubbleEntity {
  return {
    id: value.id,
    kind: value.kind,
    text: value.text,
    duration: value.duration,
    anchor: clonePosition(value.anchor),
    size: cloneSize(value.size),
  };
}

export function createJointId(name: string, parent?: string): JointId {
  return parent ? { name, parent } : { name };
}

export function isPosition(value: unknown): value is Position {
  return isFiniteNumberRecord(value, ["x", "y", "z"]);
}

export function isOrientation(value: unknown): value is Orientation {
  return isFiniteNumberRecord(value, ["x", "y", "z", "w"]);
}

export function isSize(value: unknown): value is Size {
  return isFiniteNumberRecord(value, ["width", "height", "depth"]);
}

export function isBoundingBox(value: unknown): value is BoundingBox {
  return isObjectRecord(value)
    && isPosition(value.min)
    && isPosition(value.max);
}

export function isJointId(value: unknown): value is JointId {
  return isObjectRecord(value)
    && typeof value.name === "string"
    && (value.parent === undefined || typeof value.parent === "string");
}

export function isJointNode(value: unknown): value is JointNode {
  return isObjectRecord(value)
    && typeof value.name === "string"
    && (value.parentName === null || typeof value.parentName === "string")
    && Array.isArray(value.children)
    && value.children.every(isJointNode)
    && isObjectRecord(value.localTransform)
    && isPosition(value.localTransform.position)
    && isOrientation(value.localTransform.orientation);
}

export function isSpeechBubbleState(value: unknown): value is SpeechBubbleState {
  return isObjectRecord(value)
    && (value.kind === "say" || value.kind === "think")
    && typeof value.text === "string"
    && Number.isFinite(value.duration);
}

export function isTextBubbleEntity(value: unknown): value is TextBubbleEntity {
  return isObjectRecord(value)
    && typeof value.id === "string"
    && (value.kind === "say" || value.kind === "think")
    && typeof value.text === "string"
    && Number.isFinite(value.duration)
    && isPosition(value.anchor)
    && isSize(value.size);
}

export function isMoveDirection(value: unknown): value is MoveDirection {
  return typeof value === "string" && MOVE_DIRECTIONS.has(value);
}

export function isTurnDirection(value: unknown): value is TurnDirection {
  return typeof value === "string" && TURN_DIRECTIONS.has(value);
}

export function isRollDirection(value: unknown): value is RollDirection {
  return typeof value === "string" && ROLL_DIRECTIONS.has(value);
}

export function isSpatialRelation(value: unknown): value is SpatialRelation {
  return typeof value === "string" && SPATIAL_RELATIONS.has(value);
}

export function positionsEqual(left: Position, right: Position): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}

export function orientationsEqual(left: Orientation, right: Orientation): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z && left.w === right.w;
}

export function sizesEqual(left: Size, right: Size): boolean {
  return left.width === right.width && left.height === right.height && left.depth === right.depth;
}

export function speechBubbleStatesEqual(
  left: SpeechBubbleState | null | undefined,
  right: SpeechBubbleState | null | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }
  return left.kind === right.kind && left.text === right.text && left.duration === right.duration;
}

export function textBubbleEntitiesEqual(
  left: TextBubbleEntity | null | undefined,
  right: TextBubbleEntity | null | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }
  return left.id === right.id
    && left.kind === right.kind
    && left.text === right.text
    && left.duration === right.duration
    && positionsEqual(left.anchor, right.anchor)
    && sizesEqual(left.size, right.size);
}

export function centerBoundingBox(box: BoundingBox): Position {
  return {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
}

export function boundingBoxContains(box: BoundingBox, point: Position): boolean {
  return point.x >= box.min.x
    && point.x <= box.max.x
    && point.y >= box.min.y
    && point.y <= box.max.y
    && point.z >= box.min.z
    && point.z <= box.max.z;
}

export function mergeBoundingBoxes(boxes: readonly BoundingBox[]): BoundingBox | null {
  if (boxes.length === 0) {
    return null;
  }
  let minX = boxes[0].min.x;
  let minY = boxes[0].min.y;
  let minZ = boxes[0].min.z;
  let maxX = boxes[0].max.x;
  let maxY = boxes[0].max.y;
  let maxZ = boxes[0].max.z;
  for (const box of boxes.slice(1)) {
    minX = Math.min(minX, box.min.x);
    minY = Math.min(minY, box.min.y);
    minZ = Math.min(minZ, box.min.z);
    maxX = Math.max(maxX, box.max.x);
    maxY = Math.max(maxY, box.max.y);
    maxZ = Math.max(maxZ, box.max.z);
  }
  return { min: { x: minX, y: minY, z: minZ }, max: { x: maxX, y: maxY, z: maxZ } };
}

export function translateBoundingBox(box: BoundingBox, delta: Position): BoundingBox {
  return {
    min: { x: box.min.x + delta.x, y: box.min.y + delta.y, z: box.min.z + delta.z },
    max: { x: box.max.x + delta.x, y: box.max.y + delta.y, z: box.max.z + delta.z },
  };
}

export function flattenJointHierarchy(nodes: readonly JointNode[]): JointNode[] {
  const flattened: JointNode[] = [];
  const visit = (entries: readonly JointNode[]): void => {
    for (const entry of entries) {
      flattened.push(entry);
      visit(entry.children);
    }
  };
  visit(nodes);
  return flattened;
}

function isFiniteNumberRecord(value: unknown, keys: readonly string[]): boolean {
  return isObjectRecord(value)
    && keys.every((key) => Number.isFinite(value[key]));
}

function isObjectRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}
