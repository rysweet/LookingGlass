import type { BoundingBox, Position } from "./story-api/types.js";
import { boundingBoxCenter, boundingBoxSize, createPosition, expandBoundingBox } from "./story-api/types.js";

export type SceneLayoutCameraOption = "STARTING_CAMERA_VIEW" | "LAYOUT_SCENE_VIEW" | "TOP" | "SIDE" | "FRONT";

export interface SceneLayoutCamera {
  option: SceneLayoutCameraOption;
  position: Position;
  target: Position;
  forward: Position;
  up: Position;
  picturePlaneHeight?: number;
}

export interface SceneLayoutHandle {
  axis: "x" | "y" | "z";
  position: Position;
  direction: Position;
  length: number;
  color: string;
}

export interface SceneObjectOutline {
  bounds: BoundingBox;
  corners: Position[];
  edges: ReadonlyArray<readonly [number, number]>;
}

export interface SceneCameraAnchor {
  position: Position;
  target?: Position;
  up?: Position;
}

export interface SceneLayoutArrangement {
  cameras: Record<SceneLayoutCameraOption, SceneLayoutCamera>;
  handles: SceneLayoutHandle[];
  outline: SceneObjectOutline;
}

export const DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO = 16 / 9;
export const DEFAULT_LAYOUT_CAMERA_Y_OFFSET = 12;
export const DEFAULT_LAYOUT_CAMERA_Z_OFFSET = 10;
export const DEFAULT_LAYOUT_CAMERA_FALLBACK_ANGLE = -40;

const CAMERA_CLAMP_MIN = 2;
const CAMERA_CLAMP_MAX = 100;
const PICTURE_CLAMP_MIN = 1.5;
const PICTURE_CLAMP_MAX = 100;
const HANDLE_LENGTH_MIN = 0.75;
const HANDLE_LENGTH_MAX = 4;
const OUTLINE_PADDING_MIN = 0.1;
const OUTLINE_PADDING_FACTOR = 0.05;
const WORLD_UP = createPosition(0, 1, 0);
const CAMERA_DEFAULT_UP = createPosition(0, 0, 1);

export function clampCameraValue(value: number): number {
  return clamp(value, CAMERA_CLAMP_MIN, CAMERA_CLAMP_MAX, CAMERA_CLAMP_MIN);
}

export function clampPictureValue(value: number): number {
  return clamp(value, PICTURE_CLAMP_MIN, PICTURE_CLAMP_MAX, PICTURE_CLAMP_MIN);
}

export function arrangeSceneEditorCameras(
  bounds: BoundingBox,
  currentCameraPosition: Position,
  startingCamera: SceneCameraAnchor = { position: currentCameraPosition },
): Record<SceneLayoutCameraOption, SceneLayoutCamera> {
  const target = boundingBoxCenter(bounds);
  const startingTarget = startingCamera.target ?? target;

  return {
    STARTING_CAMERA_VIEW: createCamera("STARTING_CAMERA_VIEW", startingCamera.position, startingTarget, startingCamera.up),
    LAYOUT_SCENE_VIEW: createViewingPerspective(bounds, currentCameraPosition),
    TOP: createTopCamera(bounds),
    SIDE: createSideCamera(bounds),
    FRONT: createFrontCamera(bounds),
  };
}

export function createViewingPerspective(bounds: BoundingBox, currentCameraPosition: Position): SceneLayoutCamera {
  const size = boundingBoxSize(bounds);
  const target = boundingBoxCenter(bounds);
  const diagonal = Math.max(boxDiagonal(size), 4);
  const adjustedY = target.y + Math.max(size.height, diagonal * 0.5);
  const adjustedTarget = createPosition(target.x, adjustedY, target.z);
  const adjustedCamera = createPosition(
    currentCameraPosition.x,
    Math.max(currentCameraPosition.y, adjustedY),
    currentCameraPosition.z,
  );

  let direction = subtract(adjustedCamera, adjustedTarget);
  if (isZeroVector(direction)) {
    direction = createPosition(0, DEFAULT_LAYOUT_CAMERA_Y_OFFSET, DEFAULT_LAYOUT_CAMERA_Z_OFFSET);
  }
  direction = normalize(direction, createPosition(0, 1, 1));

  const position = add(adjustedTarget, scale(direction, diagonal * 1.5));
  return createCamera("LAYOUT_SCENE_VIEW", position, target, WORLD_UP);
}

export function resetLayoutSceneView(startingCamera: SceneCameraAnchor): SceneLayoutCamera {
  const position = createPosition(
    startingCamera.position.x,
    startingCamera.position.y + DEFAULT_LAYOUT_CAMERA_Y_OFFSET,
    startingCamera.position.z + DEFAULT_LAYOUT_CAMERA_Z_OFFSET,
  );
  const target = startingCamera.target ?? createPosition(
    startingCamera.position.x,
    startingCamera.position.y,
    startingCamera.position.z - DEFAULT_LAYOUT_CAMERA_Z_OFFSET,
  );
  return createCamera("LAYOUT_SCENE_VIEW", position, target, startingCamera.up);
}

export function createTopCamera(bounds: BoundingBox): SceneLayoutCamera {
  const size = boundingBoxSize(bounds);
  const target = boundingBoxCenter(bounds);
  const yOffset = size.height !== 0 ? clampCameraValue(size.height * 10) : 10;
  return {
    option: "TOP",
    position: createPosition(target.x, target.y + yOffset, target.z),
    target,
    forward: createPosition(0, -1, 0),
    up: createPosition(0, 0, 1),
    picturePlaneHeight: clampPictureValue(
      Math.max(size.depth, DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO * size.width),
    ),
  };
}

export function createSideCamera(bounds: BoundingBox): SceneLayoutCamera {
  const size = boundingBoxSize(bounds);
  const target = boundingBoxCenter(bounds);
  const xOffset = size.width !== 0 ? clampCameraValue(size.width * 10) : 10;
  return {
    option: "SIDE",
    position: createPosition(target.x + xOffset, target.y, target.z),
    target,
    forward: createPosition(-1, 0, 0),
    up: createPosition(0, 1, 0),
    picturePlaneHeight: clampPictureValue(
      Math.max(size.depth, DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO * size.height),
    ),
  };
}

export function createFrontCamera(bounds: BoundingBox): SceneLayoutCamera {
  const size = boundingBoxSize(bounds);
  const target = boundingBoxCenter(bounds);
  const zOffset = size.depth !== 0 ? clampCameraValue(size.depth * 10) : 10;
  return {
    option: "FRONT",
    position: createPosition(target.x, target.y, target.z - zOffset),
    target,
    forward: createPosition(0, 0, 1),
    up: createPosition(0, 1, 0),
    picturePlaneHeight: clampPictureValue(
      Math.max(size.width, DEFAULT_SCENE_LAYOUT_WIDTH_TO_HEIGHT_RATIO * size.height),
    ),
  };
}

export function createObjectOutline(bounds: BoundingBox, padding?: number): SceneObjectOutline {
  const size = boundingBoxSize(bounds);
  const maxDimension = Math.max(size.width, size.height, size.depth, 1);
  const expanded = expandBoundingBox(
    bounds,
    Math.max(padding ?? maxDimension * OUTLINE_PADDING_FACTOR, OUTLINE_PADDING_MIN),
  );
  const { min, max } = expanded;
  return {
    bounds: expanded,
    corners: [
      createPosition(min.x, min.y, min.z),
      createPosition(max.x, min.y, min.z),
      createPosition(max.x, max.y, min.z),
      createPosition(min.x, max.y, min.z),
      createPosition(min.x, min.y, max.z),
      createPosition(max.x, min.y, max.z),
      createPosition(max.x, max.y, max.z),
      createPosition(min.x, max.y, max.z),
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ],
  };
}

export function createTransformHandles(bounds: BoundingBox, padding?: number): SceneLayoutHandle[] {
  const outline = createObjectOutline(bounds, padding);
  const center = boundingBoxCenter(outline.bounds);
  const size = boundingBoxSize(outline.bounds);
  const maxDimension = Math.max(size.width, size.height, size.depth, 1);
  const length = clamp(maxDimension * 0.35, HANDLE_LENGTH_MIN, HANDLE_LENGTH_MAX, HANDLE_LENGTH_MIN);
  const offset = Math.max(length * 0.25, 0.25);

  return [
    {
      axis: "x",
      position: createPosition(outline.bounds.max.x + offset, center.y, center.z),
      direction: createPosition(1, 0, 0),
      length,
      color: "#ff6b6b",
    },
    {
      axis: "y",
      position: createPosition(center.x, outline.bounds.max.y + offset, center.z),
      direction: createPosition(0, 1, 0),
      length,
      color: "#51cf66",
    },
    {
      axis: "z",
      position: createPosition(center.x, center.y, outline.bounds.max.z + offset),
      direction: createPosition(0, 0, 1),
      length,
      color: "#339af0",
    },
  ];
}

export function createSceneEditorLayout(
  bounds: BoundingBox,
  currentCameraPosition: Position,
  startingCamera: SceneCameraAnchor = { position: currentCameraPosition },
): SceneLayoutArrangement {
  const outline = createObjectOutline(bounds);
  return {
    cameras: arrangeSceneEditorCameras(bounds, currentCameraPosition, startingCamera),
    handles: createTransformHandles(bounds),
    outline,
  };
}

function createCamera(
  option: SceneLayoutCameraOption,
  position: Position,
  target: Position,
  preferredUp: Position | undefined,
): SceneLayoutCamera {
  const forward = normalize(subtract(target, position), createPosition(0, 0, -1));
  const up = orthonormalizeUp(forward, preferredUp ?? CAMERA_DEFAULT_UP);
  return {
    option,
    position: clone(position),
    target: clone(target),
    forward,
    up,
  };
}

function orthonormalizeUp(forward: Position, preferredUp: Position): Position {
  const right = normalize(cross(forward, preferredUp), createPosition(1, 0, 0));
  return normalize(cross(right, forward), CAMERA_DEFAULT_UP);
}

function boxDiagonal(size: { width: number; height: number; depth: number }): number {
  return Math.sqrt(size.width ** 2 + size.height ** 2 + size.depth ** 2);
}

function add(left: Position, right: Position): Position {
  return createPosition(left.x + right.x, left.y + right.y, left.z + right.z);
}

function subtract(left: Position, right: Position): Position {
  return createPosition(left.x - right.x, left.y - right.y, left.z - right.z);
}

function scale(vector: Position, factor: number): Position {
  return createPosition(vector.x * factor, vector.y * factor, vector.z * factor);
}

function cross(left: Position, right: Position): Position {
  return createPosition(
    left.y * right.z - left.z * right.y,
    left.z * right.x - left.x * right.z,
    left.x * right.y - left.y * right.x,
  );
}

function normalize(vector: Position, fallback: Position): Position {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  if (!Number.isFinite(magnitude) || magnitude === 0) {
    return clone(fallback);
  }
  return createPosition(vector.x / magnitude, vector.y / magnitude, vector.z / magnitude);
}

function isZeroVector(vector: Position): boolean {
  return vector.x === 0 && vector.y === 0 && vector.z === 0;
}

function clone(position: Position): Position {
  return createPosition(position.x, position.y, position.z);
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}
