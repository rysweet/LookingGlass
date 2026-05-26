import { lerpSize, lerpVec3, nlerp } from "./animation";
import {
  IDENTITY_ORIENTATION,
  UNIT_SIZE,
  ZERO_POSITION,
  type Orientation,
  type Size,
  type Vec3,
} from "./story-api";

export interface AnimationTransform {
  readonly translation: Vec3;
  readonly rotation: Orientation;
  readonly scale: Size;
}

export interface AnimationTransformOverride {
  readonly translation?: Vec3;
  readonly rotation?: Orientation;
  readonly scale?: Size;
}

export interface BoneDefinition {
  readonly name: string;
  readonly parentIndex: number | null;
  readonly bindTransform: AnimationTransform;
}

export interface Skeleton {
  readonly bones: readonly BoneDefinition[];
}

export interface BoneKeyframe {
  readonly timeMs: number;
  readonly transform: AnimationTransformOverride;
}

export interface BoneAnimationTrack {
  readonly boneName: string;
  readonly keyframes: readonly BoneKeyframe[];
}

export interface AnimationMarker {
  readonly name: string;
  readonly timeMs: number;
}

export interface SkeletalAnimationClip {
  readonly name: string;
  readonly durationMs: number;
  readonly tracks: readonly BoneAnimationTrack[];
  readonly loop?: boolean;
  readonly markers?: readonly AnimationMarker[];
}

export interface VertexBoneWeight {
  readonly boneIndex: number;
  readonly weight: number;
}

export interface SkinnedVertex {
  readonly position: Vec3;
  readonly normal?: Vec3;
  readonly weights: readonly VertexBoneWeight[];
}

export interface MorphTarget {
  readonly name: string;
  readonly positionDeltas: readonly Vec3[];
  readonly normalDeltas?: readonly Vec3[];
}

export interface BonePose {
  readonly bone: BoneDefinition;
  readonly localTransform: AnimationTransform;
  readonly worldTransform: AnimationTransform;
  readonly bindWorldTransform: AnimationTransform;
}

export interface DeformedVertex {
  readonly position: Vec3;
  readonly normal: Vec3 | null;
}

export type AnimationStateName = "idle" | "walking" | "talking";

export interface AnimationTransition {
  readonly from: AnimationStateName | "*";
  readonly to: AnimationStateName;
  readonly durationMs: number;
}

export interface StateAnimationBinding {
  readonly skeletalClip?: SkeletalAnimationClip;
  readonly morphWeights?: Readonly<Record<string, number>>;
}

export type AnimationStateBindings = Partial<Record<AnimationStateName, StateAnimationBinding>>;

export interface RenderAnimationFrameOptions {
  readonly skeleton: Skeleton;
  readonly vertices: readonly SkinnedVertex[];
  readonly timeMs: number;
  readonly clip?: SkeletalAnimationClip;
  readonly morphTargets?: readonly MorphTarget[];
  readonly morphWeights?: Readonly<Record<string, number>>;
}

export interface RenderStateAnimationFrameOptions {
  readonly skeleton: Skeleton;
  readonly vertices: readonly SkinnedVertex[];
  readonly timeMs: number;
  readonly stateMachine: AnimationStateMachine;
  readonly bindings: AnimationStateBindings;
  readonly morphTargets?: readonly MorphTarget[];
}

export interface RenderedAnimationFrame {
  readonly poses: readonly BonePose[];
  readonly vertices: readonly DeformedVertex[];
  readonly stateWeights: Readonly<Record<string, number>>;
  readonly morphWeights: Readonly<Record<string, number>>;
}

const DEFAULT_TRANSFORM: AnimationTransform = Object.freeze({
  translation: ZERO_POSITION,
  rotation: IDENTITY_ORIENTATION,
  scale: UNIT_SIZE,
});

const DEFAULT_TRANSITIONS: readonly AnimationTransition[] = Object.freeze([
  { from: "idle", to: "walking", durationMs: 200 },
  { from: "walking", to: "idle", durationMs: 220 },
  { from: "idle", to: "talking", durationMs: 120 },
  { from: "talking", to: "idle", durationMs: 160 },
  { from: "walking", to: "talking", durationMs: 150 },
  { from: "talking", to: "walking", durationMs: 180 },
]);

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

function cloneVec3(value: Vec3): Vec3 {
  return { x: value.x, y: value.y, z: value.z };
}

function cloneOrientation(value: Orientation): Orientation {
  return { x: value.x, y: value.y, z: value.z, w: value.w };
}

function cloneSize(value: Size): Size {
  return { width: value.width, height: value.height, depth: value.depth };
}

function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtractVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scaleVec3(value: Vec3, scalar: number): Vec3 {
  return { x: value.x * scalar, y: value.y * scalar, z: value.z * scalar };
}

function multiplySize(a: Size, b: Size): Size {
  return {
    width: a.width * b.width,
    height: a.height * b.height,
    depth: a.depth * b.depth,
  };
}

function applyScale(value: Vec3, scale: Size): Vec3 {
  return {
    x: value.x * scale.width,
    y: value.y * scale.height,
    z: value.z * scale.depth,
  };
}

function invertScale(value: Vec3, scale: Size): Vec3 {
  return {
    x: scale.width === 0 ? 0 : value.x / scale.width,
    y: scale.height === 0 ? 0 : value.y / scale.height,
    z: scale.depth === 0 ? 0 : value.z / scale.depth,
  };
}

function normalizeQuaternion(value: Orientation): Orientation {
  const length = Math.hypot(value.x, value.y, value.z, value.w);
  if (length === 0 || !Number.isFinite(length)) {
    return cloneOrientation(IDENTITY_ORIENTATION);
  }
  return {
    x: value.x / length,
    y: value.y / length,
    z: value.z / length,
    w: value.w / length,
  };
}

function conjugateQuaternion(value: Orientation): Orientation {
  const normalized = normalizeQuaternion(value);
  return { x: -normalized.x, y: -normalized.y, z: -normalized.z, w: normalized.w };
}

function multiplyQuaternionRaw(a: Orientation, b: Orientation): Orientation {
  return {
    x: (a.w * b.x) + (a.x * b.w) + (a.y * b.z) - (a.z * b.y),
    y: (a.w * b.y) - (a.x * b.z) + (a.y * b.w) + (a.z * b.x),
    z: (a.w * b.z) + (a.x * b.y) - (a.y * b.x) + (a.z * b.w),
    w: (a.w * b.w) - (a.x * b.x) - (a.y * b.y) - (a.z * b.z),
  };
}

function multiplyQuaternion(a: Orientation, b: Orientation): Orientation {
  return normalizeQuaternion(multiplyQuaternionRaw(a, b));
}

function rotateVec3(value: Vec3, rotation: Orientation): Vec3 {
  const quaternion = normalizeQuaternion(rotation);
  const vector = { x: value.x, y: value.y, z: value.z, w: 0 };
  const rotated = multiplyQuaternionRaw(multiplyQuaternionRaw(quaternion, vector), conjugateQuaternion(quaternion));
  return { x: rotated.x, y: rotated.y, z: rotated.z };
}

function mergeTransform(base: AnimationTransform, override?: AnimationTransformOverride): AnimationTransform {
  return {
    translation: override?.translation ? cloneVec3(override.translation) : cloneVec3(base.translation),
    rotation: override?.rotation ? cloneOrientation(override.rotation) : cloneOrientation(base.rotation),
    scale: override?.scale ? cloneSize(override.scale) : cloneSize(base.scale),
  };
}

function interpolateTransform(a: AnimationTransform, b: AnimationTransform, t: number): AnimationTransform {
  return {
    translation: lerpVec3(a.translation, b.translation, t),
    rotation: nlerp(a.rotation, b.rotation, t),
    scale: lerpSize(a.scale, b.scale, t),
  };
}

export function createAnimationTransform(override: AnimationTransformOverride = {}): AnimationTransform {
  return mergeTransform(DEFAULT_TRANSFORM, override);
}

export function combineTransforms(parent: AnimationTransform, child: AnimationTransform): AnimationTransform {
  const scaledChildTranslation = applyScale(child.translation, parent.scale);
  return {
    translation: addVec3(parent.translation, rotateVec3(scaledChildTranslation, parent.rotation)),
    rotation: multiplyQuaternion(parent.rotation, child.rotation),
    scale: multiplySize(parent.scale, child.scale),
  };
}

function applyTransformToPoint(transform: AnimationTransform, point: Vec3): Vec3 {
  return addVec3(transform.translation, rotateVec3(applyScale(point, transform.scale), transform.rotation));
}

function applyInverseTransformToPoint(transform: AnimationTransform, point: Vec3): Vec3 {
  return invertScale(rotateVec3(subtractVec3(point, transform.translation), conjugateQuaternion(transform.rotation)), transform.scale);
}

function applyTransformToDirection(transform: AnimationTransform, direction: Vec3): Vec3 {
  return rotateVec3(applyScale(direction, transform.scale), transform.rotation);
}

function applyInverseTransformToDirection(transform: AnimationTransform, direction: Vec3): Vec3 {
  return invertScale(rotateVec3(direction, conjugateQuaternion(transform.rotation)), transform.scale);
}

function normalizeClipTime(clip: SkeletalAnimationClip, timeMs: number): number {
  if (!Number.isFinite(timeMs)) {
    return 0;
  }
  if (clip.loop === false || clip.durationMs <= 0) {
    return Math.min(Math.max(timeMs, 0), Math.max(clip.durationMs, 0));
  }
  const wrapped = timeMs % clip.durationMs;
  return wrapped < 0 ? wrapped + clip.durationMs : wrapped;
}

function sampleTrack(track: BoneAnimationTrack | undefined, clip: SkeletalAnimationClip | undefined, timeMs: number, fallback: AnimationTransform): AnimationTransform {
  if (!track || track.keyframes.length === 0 || !clip) {
    return fallback;
  }
  const frames = [...track.keyframes].sort((left, right) => left.timeMs - right.timeMs);
  const localTime = normalizeClipTime(clip, timeMs);
  const first = mergeTransform(fallback, frames[0]!.transform);
  if (localTime <= frames[0]!.timeMs) {
    return first;
  }
  for (let index = 0; index < frames.length - 1; index += 1) {
    const start = frames[index]!;
    const end = frames[index + 1]!;
    if (localTime <= end.timeMs) {
      const startTransform = mergeTransform(fallback, start.transform);
      const endTransform = mergeTransform(fallback, end.transform);
      const range = end.timeMs - start.timeMs;
      const portion = range <= 0 ? 1 : clamp01((localTime - start.timeMs) / range);
      return interpolateTransform(startTransform, endTransform, portion);
    }
  }
  return mergeTransform(fallback, frames[frames.length - 1]!.transform);
}

function getSortedMarkers(clip: SkeletalAnimationClip): AnimationMarker[] {
  return [...(clip.markers ?? [])]
    .filter((marker) => Number.isFinite(marker.timeMs))
    .sort((left, right) => left.timeMs - right.timeMs);
}

function getForwardMarkersInRange(markers: readonly AnimationMarker[], startMs: number, endMs: number): AnimationMarker[] {
  return markers.filter((marker) => marker.timeMs > startMs && marker.timeMs <= endMs);
}

function getBackwardMarkersInRange(markers: readonly AnimationMarker[], startMs: number, endMs: number): AnimationMarker[] {
  return markers.filter((marker) => marker.timeMs <= startMs && marker.timeMs > endMs).reverse();
}

export function sampleAnimationMarkers(
  clip: SkeletalAnimationClip | undefined,
  previousTimeMs: number,
  currentTimeMs: number,
): AnimationMarker[] {
  if (!clip) {
    return [];
  }
  const markers = getSortedMarkers(clip);
  if (markers.length === 0 || !Number.isFinite(previousTimeMs) || !Number.isFinite(currentTimeMs)) {
    return [];
  }
  const delta = currentTimeMs - previousTimeMs;
  if (delta === 0) {
    return [];
  }
  if (clip.loop === false || clip.durationMs <= 0) {
    const start = Math.min(Math.max(previousTimeMs, 0), Math.max(clip.durationMs, 0));
    const end = Math.min(Math.max(currentTimeMs, 0), Math.max(clip.durationMs, 0));
    return delta > 0
      ? getForwardMarkersInRange(markers, start, end)
      : getBackwardMarkersInRange(markers, start, end);
  }
  if (Math.abs(delta) >= clip.durationMs) {
    return delta > 0 ? markers : [...markers].reverse();
  }

  const start = normalizeClipTime(clip, previousTimeMs);
  const end = normalizeClipTime(clip, currentTimeMs);
  if (delta > 0) {
    return end >= start
      ? getForwardMarkersInRange(markers, start, end)
      : [...getForwardMarkersInRange(markers, start, clip.durationMs), ...getForwardMarkersInRange(markers, -1, end)];
  }
  return end <= start
    ? getBackwardMarkersInRange(markers, start, end)
    : [...getBackwardMarkersInRange(markers, start, -1), ...getBackwardMarkersInRange(markers, clip.durationMs, end)];
}

function buildTrackMap(clip: SkeletalAnimationClip | undefined): Map<string, BoneAnimationTrack> {
  return new Map((clip?.tracks ?? []).map((track) => [track.boneName, track]));
}

export function sampleSkeletalAnimation(skeleton: Skeleton, clip: SkeletalAnimationClip | undefined, timeMs: number): BonePose[] {
  const trackMap = buildTrackMap(clip);
  const poses: BonePose[] = [];
  for (let index = 0; index < skeleton.bones.length; index += 1) {
    const bone = skeleton.bones[index]!;
    const localTransform = sampleTrack(trackMap.get(bone.name), clip, timeMs, bone.bindTransform);
    const parentPose = bone.parentIndex == null ? null : poses[bone.parentIndex] ?? null;
    const worldTransform = parentPose ? combineTransforms(parentPose.worldTransform, localTransform) : localTransform;
    const bindWorldTransform = parentPose ? combineTransforms(parentPose.bindWorldTransform, bone.bindTransform) : bone.bindTransform;
    poses.push({ bone, localTransform, worldTransform, bindWorldTransform });
  }
  return poses;
}

function normalizeWeights(weights: readonly VertexBoneWeight[]): readonly VertexBoneWeight[] {
  const filtered = weights.filter((weight) => weight.weight > 0 && Number.isFinite(weight.weight));
  const total = filtered.reduce((sum, weight) => sum + weight.weight, 0);
  if (total <= 0) {
    return [];
  }
  return filtered.map((weight) => ({ boneIndex: weight.boneIndex, weight: weight.weight / total }));
}

export function applyMorphTargets(
  baseVertices: readonly Vec3[],
  morphTargets: readonly MorphTarget[],
  weights: Readonly<Record<string, number>> = {},
): Vec3[] {
  const morphed = baseVertices.map(cloneVec3);
  for (const target of morphTargets) {
    const weight = clamp01(weights[target.name] ?? 0);
    if (weight === 0) {
      continue;
    }
    for (let index = 0; index < morphed.length; index += 1) {
      const delta = target.positionDeltas[index];
      if (!delta) {
        continue;
      }
      morphed[index] = addVec3(morphed[index]!, scaleVec3(delta, weight));
    }
  }
  return morphed;
}

function applyMorphTargetNormals(
  baseNormals: readonly Vec3[],
  morphTargets: readonly MorphTarget[],
  weights: Readonly<Record<string, number>> = {},
): Vec3[] {
  const morphed = baseNormals.map(cloneVec3);
  for (const target of morphTargets) {
    const weight = clamp01(weights[target.name] ?? 0);
    if (weight === 0 || !target.normalDeltas) {
      continue;
    }
    for (let index = 0; index < morphed.length; index += 1) {
      const delta = target.normalDeltas[index];
      if (!delta) {
        continue;
      }
      morphed[index] = addVec3(morphed[index]!, scaleVec3(delta, weight));
    }
  }
  return morphed;
}

export function deformSkinnedMesh(
  vertices: readonly SkinnedVertex[],
  poses: readonly BonePose[],
  morphTargets: readonly MorphTarget[] = [],
  morphWeights: Readonly<Record<string, number>> = {},
): DeformedVertex[] {
  const morphedPositions = applyMorphTargets(vertices.map((vertex) => vertex.position), morphTargets, morphWeights);
  const morphedNormals = applyMorphTargetNormals(
    vertices.map((vertex) => vertex.normal ?? ZERO_POSITION),
    morphTargets,
    morphWeights,
  );
  return vertices.map((vertex, index) => {
    const normalizedWeights = normalizeWeights(vertex.weights);
    const sourcePosition = morphedPositions[index]!;
    const sourceNormal = vertex.normal ? morphedNormals[index]! : null;
    if (normalizedWeights.length === 0) {
      return {
        position: sourcePosition,
        normal: sourceNormal,
      };
    }

    let blendedPosition: Vec3 = { x: 0, y: 0, z: 0 };
    let blendedNormal: Vec3 | null = sourceNormal ? { x: 0, y: 0, z: 0 } : null;
    for (const weight of normalizedWeights) {
      const pose = poses[weight.boneIndex];
      if (!pose) {
        continue;
      }
      const bindSpacePosition = applyInverseTransformToPoint(pose.bindWorldTransform, sourcePosition);
      const weightedPosition = applyTransformToPoint(pose.worldTransform, bindSpacePosition);
      blendedPosition = addVec3(blendedPosition, scaleVec3(weightedPosition, weight.weight));
      if (sourceNormal && blendedNormal) {
        const bindSpaceNormal = applyInverseTransformToDirection(pose.bindWorldTransform, sourceNormal);
        const weightedNormal = applyTransformToDirection(pose.worldTransform, bindSpaceNormal);
        blendedNormal = addVec3(blendedNormal, scaleVec3(weightedNormal, weight.weight));
      }
    }

    return {
      position: blendedPosition,
      normal: blendedNormal,
    };
  });
}

function blendTransforms(samples: readonly { readonly transform: AnimationTransform; readonly weight: number }[], fallback: AnimationTransform): AnimationTransform {
  const usable = samples.filter((sample) => sample.weight > 0);
  if (usable.length === 0) {
    return fallback;
  }

  let translation: Vec3 = { x: 0, y: 0, z: 0 };
  let scale: Size = { width: 0, height: 0, depth: 0 };
  let rotation = { x: 0, y: 0, z: 0, w: 0 };
  let totalWeight = 0;

  for (const sample of usable) {
    totalWeight += sample.weight;
    translation = addVec3(translation, scaleVec3(sample.transform.translation, sample.weight));
    scale = {
      width: scale.width + (sample.transform.scale.width * sample.weight),
      height: scale.height + (sample.transform.scale.height * sample.weight),
      depth: scale.depth + (sample.transform.scale.depth * sample.weight),
    };
    rotation = {
      x: rotation.x + (sample.transform.rotation.x * sample.weight),
      y: rotation.y + (sample.transform.rotation.y * sample.weight),
      z: rotation.z + (sample.transform.rotation.z * sample.weight),
      w: rotation.w + (sample.transform.rotation.w * sample.weight),
    };
  }

  if (totalWeight <= 0) {
    return fallback;
  }

  return {
    translation: scaleVec3(translation, 1 / totalWeight),
    scale: {
      width: scale.width / totalWeight,
      height: scale.height / totalWeight,
      depth: scale.depth / totalWeight,
    },
    rotation: normalizeQuaternion(rotation),
  };
}

function blendMorphWeightMaps(bindings: AnimationStateBindings, stateWeights: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  const blended: Record<string, number> = {};
  for (const [stateName, stateWeight] of Object.entries(stateWeights)) {
    const binding = bindings[stateName as AnimationStateName];
    if (!binding?.morphWeights || stateWeight <= 0) {
      continue;
    }
    for (const [morphName, morphWeight] of Object.entries(binding.morphWeights)) {
      blended[morphName] = (blended[morphName] ?? 0) + (morphWeight * stateWeight);
    }
  }
  return blended;
}

function stateWeightsOf(state: AnimationStateName): Readonly<Record<string, number>> {
  return { [state]: 1 };
}

export function renderAnimationFrame(options: RenderAnimationFrameOptions): RenderedAnimationFrame {
  const poses = sampleSkeletalAnimation(options.skeleton, options.clip, options.timeMs);
  const morphWeights = options.morphWeights ?? {};
  return {
    poses,
    vertices: deformSkinnedMesh(options.vertices, poses, options.morphTargets ?? [], morphWeights),
    stateWeights: options.clip ? { [options.clip.name]: 1 } : {},
    morphWeights,
  };
}

interface ActiveTransitionState {
  readonly from: AnimationStateName;
  readonly to: AnimationStateName;
  readonly durationMs: number;
  readonly elapsedMs: number;
}

export class AnimationStateMachine {
  readonly #transitions: readonly AnimationTransition[];
  #state: AnimationStateName;
  #transition: ActiveTransitionState | null = null;

  constructor(initialState: AnimationStateName = "idle", transitions: readonly AnimationTransition[] = DEFAULT_TRANSITIONS) {
    this.#state = initialState;
    this.#transitions = transitions;
  }

  getCurrentState(): AnimationStateName {
    return this.#transition?.to ?? this.#state;
  }

  getBlendWeights(): Readonly<Record<string, number>> {
    if (!this.#transition) {
      return stateWeightsOf(this.#state);
    }
    const progress = this.#transition.durationMs <= 0
      ? 1
      : clamp01(this.#transition.elapsedMs / this.#transition.durationMs);
    return {
      [this.#transition.from]: 1 - progress,
      [this.#transition.to]: progress,
    };
  }

  trigger(nextState: AnimationStateName): void {
    const sourceState = this.getCurrentState();
    if (sourceState === nextState) {
      return;
    }
    const transition = this.#transitions.find((candidate) =>
      (candidate.from === sourceState || candidate.from === "*") && candidate.to === nextState,
    );
    if (!transition || transition.durationMs <= 0) {
      this.#state = nextState;
      this.#transition = null;
      return;
    }
    this.#state = sourceState;
    this.#transition = { from: sourceState, to: nextState, durationMs: transition.durationMs, elapsedMs: 0 };
  }

  update(deltaMs: number): void {
    if (!this.#transition) {
      return;
    }
    const nextElapsed = this.#transition.elapsedMs + Math.max(deltaMs, 0);
    if (nextElapsed >= this.#transition.durationMs) {
      this.#state = this.#transition.to;
      this.#transition = null;
      return;
    }
    this.#transition = { ...this.#transition, elapsedMs: nextElapsed };
  }
}

export function renderAnimationStateFrame(options: RenderStateAnimationFrameOptions): RenderedAnimationFrame {
  const stateWeights = options.stateMachine.getBlendWeights();
  const blendedLocalTransforms = options.skeleton.bones.map((bone) => {
    const transformSamples = Object.entries(stateWeights).map(([stateName, weight]) => {
      const clip = options.bindings[stateName as AnimationStateName]?.skeletalClip;
      const track = clip ? buildTrackMap(clip).get(bone.name) : undefined;
      return {
        weight,
        transform: sampleTrack(track, clip, options.timeMs, bone.bindTransform),
      };
    });
    return blendTransforms(transformSamples, bone.bindTransform);
  });

  const poses: BonePose[] = [];
  for (let index = 0; index < options.skeleton.bones.length; index += 1) {
    const bone = options.skeleton.bones[index]!;
    const parentPose = bone.parentIndex == null ? null : poses[bone.parentIndex] ?? null;
    const localTransform = blendedLocalTransforms[index]!;
    const worldTransform = parentPose ? combineTransforms(parentPose.worldTransform, localTransform) : localTransform;
    const bindWorldTransform = parentPose ? combineTransforms(parentPose.bindWorldTransform, bone.bindTransform) : bone.bindTransform;
    poses.push({ bone, localTransform, worldTransform, bindWorldTransform });
  }

  const morphWeights = blendMorphWeightMaps(options.bindings, stateWeights);
  return {
    poses,
    vertices: deformSkinnedMesh(options.vertices, poses, options.morphTargets ?? [], morphWeights),
    stateWeights,
    morphWeights,
  };
}
