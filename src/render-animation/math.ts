import { lerpSize, lerpVec3, nlerp } from "../animation";
import { IDENTITY_ORIENTATION, UNIT_SIZE, ZERO_POSITION, type Orientation, type Size, type Vec3 } from "../story-api";
import type { AnimationTransform, AnimationTransformOverride } from "./types.js";

export const DEFAULT_TRANSFORM: AnimationTransform = Object.freeze({ translation: ZERO_POSITION, rotation: IDENTITY_ORIENTATION, scale: UNIT_SIZE });

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

export function cloneVec3(value: Vec3): Vec3 { return { x: value.x, y: value.y, z: value.z }; }
function cloneOrientation(value: Orientation): Orientation { return { x: value.x, y: value.y, z: value.z, w: value.w }; }
function cloneSize(value: Size): Size { return { width: value.width, height: value.height, depth: value.depth }; }
export function addVec3(a: Vec3, b: Vec3): Vec3 { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
export function subtractVec3(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
export function scaleVec3(value: Vec3, scalar: number): Vec3 { return { x: value.x * scalar, y: value.y * scalar, z: value.z * scalar }; }
function multiplySize(a: Size, b: Size): Size { return { width: a.width * b.width, height: a.height * b.height, depth: a.depth * b.depth }; }
function applyScale(value: Vec3, scale: Size): Vec3 { return { x: value.x * scale.width, y: value.y * scale.height, z: value.z * scale.depth }; }
function invertScale(value: Vec3, scale: Size): Vec3 { return { x: scale.width === 0 ? 0 : value.x / scale.width, y: scale.height === 0 ? 0 : value.y / scale.height, z: scale.depth === 0 ? 0 : value.z / scale.depth }; }
export function normalizeQuaternion(value: Orientation): Orientation {
  const length = Math.hypot(value.x, value.y, value.z, value.w);
  if (length === 0 || !Number.isFinite(length)) return cloneOrientation(IDENTITY_ORIENTATION);
  return { x: value.x / length, y: value.y / length, z: value.z / length, w: value.w / length };
}
function conjugateQuaternion(value: Orientation): Orientation { const normalized = normalizeQuaternion(value); return { x: -normalized.x, y: -normalized.y, z: -normalized.z, w: normalized.w }; }
function multiplyQuaternionRaw(a: Orientation, b: Orientation): Orientation { return { x: (a.w * b.x) + (a.x * b.w) + (a.y * b.z) - (a.z * b.y), y: (a.w * b.y) - (a.x * b.z) + (a.y * b.w) + (a.z * b.x), z: (a.w * b.z) + (a.x * b.y) - (a.y * b.x) + (a.z * b.w), w: (a.w * b.w) - (a.x * b.x) - (a.y * b.y) - (a.z * b.z) }; }
export function multiplyQuaternion(a: Orientation, b: Orientation): Orientation { return normalizeQuaternion(multiplyQuaternionRaw(a, b)); }
function rotateVec3(value: Vec3, rotation: Orientation): Vec3 { const quaternion = normalizeQuaternion(rotation); const vector = { x: value.x, y: value.y, z: value.z, w: 0 }; const rotated = multiplyQuaternionRaw(multiplyQuaternionRaw(quaternion, vector), conjugateQuaternion(quaternion)); return { x: rotated.x, y: rotated.y, z: rotated.z }; }
function mergeTransform(base: AnimationTransform, override?: AnimationTransformOverride): AnimationTransform { return { translation: override?.translation ? cloneVec3(override.translation) : cloneVec3(base.translation), rotation: override?.rotation ? cloneOrientation(override.rotation) : cloneOrientation(base.rotation), scale: override?.scale ? cloneSize(override.scale) : cloneSize(base.scale) }; }
export function interpolateTransform(a: AnimationTransform, b: AnimationTransform, t: number): AnimationTransform { return { translation: lerpVec3(a.translation, b.translation, t), rotation: nlerp(a.rotation, b.rotation, t), scale: lerpSize(a.scale, b.scale, t) }; }
export function createAnimationTransform(override: AnimationTransformOverride = {}): AnimationTransform { return mergeTransform(DEFAULT_TRANSFORM, override); }
export function combineTransforms(parent: AnimationTransform, child: AnimationTransform): AnimationTransform { const scaledChildTranslation = applyScale(child.translation, parent.scale); return { translation: addVec3(parent.translation, rotateVec3(scaledChildTranslation, parent.rotation)), rotation: multiplyQuaternion(parent.rotation, child.rotation), scale: multiplySize(parent.scale, child.scale) }; }
export function applyTransformToPoint(transform: AnimationTransform, point: Vec3): Vec3 { return addVec3(transform.translation, rotateVec3(applyScale(point, transform.scale), transform.rotation)); }
export function applyInverseTransformToPoint(transform: AnimationTransform, point: Vec3): Vec3 { return invertScale(rotateVec3(subtractVec3(point, transform.translation), conjugateQuaternion(transform.rotation)), transform.scale); }
export function applyTransformToDirection(transform: AnimationTransform, direction: Vec3): Vec3 { return rotateVec3(applyScale(direction, transform.scale), transform.rotation); }
export function applyInverseTransformToDirection(transform: AnimationTransform, direction: Vec3): Vec3 { return invertScale(rotateVec3(direction, conjugateQuaternion(transform.rotation)), transform.scale); }
export function blendTransforms(samples: readonly { readonly transform: AnimationTransform; readonly weight: number }[], fallback: AnimationTransform): AnimationTransform {
  const usable = samples.filter((sample) => sample.weight > 0);
  if (usable.length === 0) return fallback;
  let translation: Vec3 = { x: 0, y: 0, z: 0 };
  let scale: Size = { width: 0, height: 0, depth: 0 };
  let rotation = { x: 0, y: 0, z: 0, w: 0 };
  let totalWeight = 0;
  for (const sample of usable) {
    totalWeight += sample.weight;
    translation = addVec3(translation, scaleVec3(sample.transform.translation, sample.weight));
    scale = { width: scale.width + (sample.transform.scale.width * sample.weight), height: scale.height + (sample.transform.scale.height * sample.weight), depth: scale.depth + (sample.transform.scale.depth * sample.weight) };
    rotation = { x: rotation.x + (sample.transform.rotation.x * sample.weight), y: rotation.y + (sample.transform.rotation.y * sample.weight), z: rotation.z + (sample.transform.rotation.z * sample.weight), w: rotation.w + (sample.transform.rotation.w * sample.weight) };
  }
  if (totalWeight <= 0) return fallback;
  return { translation: scaleVec3(translation, 1 / totalWeight), scale: { width: scale.width / totalWeight, height: scale.height / totalWeight, depth: scale.depth / totalWeight }, rotation: normalizeQuaternion(rotation) };
}
