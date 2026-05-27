import type JSZip from "jszip";
import type { BoundingBox, JointNode } from "../story-api/types";
import { getPropertyText } from "./dom.js";

const MAX_JOINT_DEPTH = 64;
const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tga", ".webp",
]);

interface JointData {
  name: string;
  parentName: string | null;
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

function safeFloat(text: string | null, fallback = 0): number {
  const value = parseFloat(text ?? String(fallback));
  return Number.isFinite(value) ? value : fallback;
}

export function extractJointHierarchy(jointNodes: Element[]): JointNode[] {
  const joints: JointData[] = [];

  for (const node of jointNodes) {
    const name = getPropertyText(node, "jointName");
    if (!name) continue;

    joints.push({
      name,
      parentName: getPropertyText(node, "parent") ?? null,
      position: {
        x: safeFloat(getPropertyText(node, "positionX")),
        y: safeFloat(getPropertyText(node, "positionY")),
        z: safeFloat(getPropertyText(node, "positionZ")),
      },
      orientation: {
        x: safeFloat(getPropertyText(node, "orientationX")),
        y: safeFloat(getPropertyText(node, "orientationY")),
        z: safeFloat(getPropertyText(node, "orientationZ")),
        w: safeFloat(getPropertyText(node, "orientationW"), 1),
      },
    });
  }

  const childrenMap = new Map<string, JointData[]>();
  const roots: JointData[] = [];

  for (const joint of joints) {
    if (joint.parentName) {
      const siblings = childrenMap.get(joint.parentName) ?? [];
      siblings.push(joint);
      childrenMap.set(joint.parentName, siblings);
    } else {
      roots.push(joint);
    }
  }

  const buildNode = (data: JointData, depth: number): JointNode => ({
    name: data.name,
    parentName: data.parentName,
    children: depth < MAX_JOINT_DEPTH
      ? (childrenMap.get(data.name) ?? []).map((child) => buildNode(child, depth + 1))
      : [],
    localTransform: {
      position: data.position,
      orientation: data.orientation,
    },
  });

  return roots.map((root) => buildNode(root, 1));
}

export function extractBoundingBoxes(resourceInfoNodes: Element[]): Record<string, BoundingBox> {
  const boxes: Record<string, BoundingBox> = {};

  for (const node of resourceInfoNodes) {
    const name = getPropertyText(node, "resourceName");
    if (!name) continue;

    boxes[name] = {
      min: {
        x: safeFloat(getPropertyText(node, "boundingBoxMinX")),
        y: safeFloat(getPropertyText(node, "boundingBoxMinY")),
        z: safeFloat(getPropertyText(node, "boundingBoxMinZ")),
      },
      max: {
        x: safeFloat(getPropertyText(node, "boundingBoxMaxX")),
        y: safeFloat(getPropertyText(node, "boundingBoxMaxY")),
        z: safeFloat(getPropertyText(node, "boundingBoxMaxZ")),
      },
    };
  }

  return boxes;
}

function isSafeTexturePath(path: string): boolean {
  if (path.includes("..") || path.startsWith("/") || path.includes("\0")) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(path)) return false;
  const dotIndex = path.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return IMAGE_EXTENSIONS.has(path.substring(dotIndex).toLowerCase());
}

export function extractTextureRefs(textureNodes: Element[], zip: JSZip): string[] {
  const refs = new Set<string>();

  for (const node of textureNodes) {
    const texturePath = getPropertyText(node, "texturePath");
    if (texturePath && isSafeTexturePath(texturePath)) refs.add(texturePath);
  }

  for (const zipPath of Object.keys(zip.files)) {
    if (zip.files[zipPath].dir) continue;
    if (isSafeTexturePath(zipPath)) refs.add(zipPath);
  }

  return [...refs].sort();
}
