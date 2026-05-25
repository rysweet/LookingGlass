export * from "./expanded-types";

import type {
  BoundingBox,
  JointNode,
  MoveDirection,
  Orientation,
  Position,
  RollDirection,
  Size,
  SpatialRelation,
  SpeechBubbleState,
  TextBubbleEntity,
  TurnDirection,
} from "./expanded-types";
import {
  IDENTITY_ORIENTATION,
  SpatialRelation as SpatialRelationValues,
  UNIT_SIZE,
  ZERO_POSITION,
  centerBoundingBox,
  cloneBoundingBox,
  clonePosition,
  cloneSize,
  flattenJointHierarchy,
  isMoveDirection,
  isRollDirection,
  isSpatialRelation,
  isTurnDirection,
  mergeBoundingBoxes,
  speechBubbleStatesEqual,
  textBubbleEntitiesEqual,
  translateBoundingBox,
} from "./expanded-types";

export function createPosition(x = 0, y = 0, z = 0): Position {
  return { x, y, z };
}

export function createOrientation(x = 0, y = 0, z = 0, w = 1): Orientation {
  return { x, y, z, w };
}

export function createSize(width = 1, height = 1, depth = 1): Size {
  return { width, height, depth };
}

export function createBoundingBox(min = ZERO_POSITION, max = ZERO_POSITION): BoundingBox {
  return { min: clonePosition(min), max: clonePosition(max) };
}

export function boundingBoxSize(box: BoundingBox): Size {
  return {
    width: box.max.x - box.min.x,
    height: box.max.y - box.min.y,
    depth: box.max.z - box.min.z,
  };
}

export function boundingBoxCenter(box: BoundingBox): Position {
  return centerBoundingBox(box);
}

export function cloneBoundingBoxValue(box: BoundingBox | null | undefined): BoundingBox | null {
  return box ? cloneBoundingBox(box) : null;
}

export function expandBoundingBox(box: BoundingBox, padding: number): BoundingBox {
  const offset = Number.isFinite(padding) ? padding : 0;
  return {
    min: createPosition(box.min.x - offset, box.min.y - offset, box.min.z - offset),
    max: createPosition(box.max.x + offset, box.max.y + offset, box.max.z + offset),
  };
}

export function offsetBoundingBox(box: BoundingBox, delta: Position): BoundingBox {
  return translateBoundingBox(box, delta);
}

export function combineBoundingBoxes(boxes: readonly BoundingBox[]): BoundingBox | null {
  return mergeBoundingBoxes(boxes);
}

export function boundingBoxesIntersect(left: BoundingBox, right: BoundingBox): boolean {
  return left.min.x <= right.max.x
    && left.max.x >= right.min.x
    && left.min.y <= right.max.y
    && left.max.y >= right.min.y
    && left.min.z <= right.max.z
    && left.max.z >= right.min.z;
}

export function describeSpeechBubble(
  value: SpeechBubbleState | TextBubbleEntity | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  return `${value.kind}:${value.text}`;
}

export function getSpeechBubbleText(
  value: SpeechBubbleState | TextBubbleEntity | null | undefined,
): string | null {
  return value?.text ?? null;
}

export function createSpeechBubbleState(
  kind: "say" | "think",
  text: string,
  duration = 0,
): SpeechBubbleState {
  return { kind, text, duration };
}

export function createTextBubbleEntity(
  id: string,
  kind: "say" | "think",
  text: string,
  duration = 0,
  anchor: Position = ZERO_POSITION,
  size: Size = UNIT_SIZE,
): TextBubbleEntity {
  return {
    id,
    kind,
    text,
    duration,
    anchor: clonePosition(anchor),
    size: cloneSize(size),
  };
}

export function speechBubbleEquals(
  left: SpeechBubbleState | TextBubbleEntity | null | undefined,
  right: SpeechBubbleState | TextBubbleEntity | null | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }
  if ("id" in left || "id" in right) {
    return textBubbleEntitiesEqual(left as TextBubbleEntity, right as TextBubbleEntity);
  }
  return speechBubbleStatesEqual(left as SpeechBubbleState, right as SpeechBubbleState);
}

export function createDefaultTransform(): { position: Position; orientation: Orientation; size: Size } {
  return {
    position: clonePosition(ZERO_POSITION),
    orientation: { ...IDENTITY_ORIENTATION },
    size: cloneSize(UNIT_SIZE),
  };
}

export function parseMoveDirection(value: string, fallback: MoveDirection = "FORWARD"): MoveDirection {
  return isMoveDirection(value) ? value : fallback;
}

export function parseTurnDirection(value: string, fallback: TurnDirection = "LEFT"): TurnDirection {
  return isTurnDirection(value) ? value : fallback;
}

export function parseRollDirection(value: string, fallback: RollDirection = "LEFT"): RollDirection {
  return isRollDirection(value) ? value : fallback;
}

export function parseSpatialRelation(value: string, fallback: SpatialRelation = "ABOVE"): SpatialRelation {
  return isSpatialRelation(value) ? value : fallback;
}

export function listSpatialRelations(): SpatialRelation[] {
  return Object.values(SpatialRelationValues);
}

export function invertSpatialRelation(relation: SpatialRelation): SpatialRelation {
  switch (relation) {
    case "ABOVE":
      return "BELOW";
    case "BELOW":
      return "ABOVE";
    case "LEFT_OF":
      return "RIGHT_OF";
    case "RIGHT_OF":
      return "LEFT_OF";
    case "IN_FRONT_OF":
      return "BEHIND";
    case "BEHIND":
      return "IN_FRONT_OF";
  }
}

export function summarizeJointHierarchy(nodes: readonly JointNode[]): Array<{
  readonly name: string;
  readonly parentName: string | null;
  readonly childCount: number;
}> {
  return flattenJointHierarchy(nodes).map((node) => ({
    name: node.name,
    parentName: node.parentName,
    childCount: node.children.length,
  }));
}
