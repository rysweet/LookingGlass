export * from "./expanded-types";

import type {
  BoundingBox,
  Orientation,
  Position,
  Size,
  SpeechBubbleState,
  TextBubbleEntity,
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

export function boundingBoxSize(box: BoundingBox): Size {
  return {
    width: box.max.x - box.min.x,
    height: box.max.y - box.min.y,
    depth: box.max.z - box.min.z,
  };
}

export function describeSpeechBubble(
  value: SpeechBubbleState | TextBubbleEntity | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  return `${value.kind}:${value.text}`;
}
