import { ZERO_POSITION, type Vec3 } from "../story-api";
import {
  DEFAULT_TRANSFORM,
  addVec3,
  applyInverseTransformToDirection,
  applyInverseTransformToPoint,
  applyTransformToDirection,
  applyTransformToPoint,
  blendTransforms,
  clamp01,
  cloneVec3,
  combineTransforms,
  interpolateTransform,
  scaleVec3,
} from "./math.js";
import type {
  AnimationMarker,
  AnimationStateBindings,
  AnimationStateName,
  BoneAnimationTrack,
  BonePose,
  DeformedVertex,
  MorphTarget,
  RenderAnimationFrameOptions,
  RenderStateAnimationFrameOptions,
  RenderedAnimationFrame,
  SkeletalAnimationClip,
  Skeleton,
  SkinnedVertex,
  VertexBoneWeight,
} from "./types.js";

function normalizeClipTime(clip: SkeletalAnimationClip, timeMs: number): number {
  if (!Number.isFinite(timeMs)) return 0;
  if (clip.loop === false || clip.durationMs <= 0) return Math.min(Math.max(timeMs, 0), Math.max(clip.durationMs, 0));
  const wrapped = timeMs % clip.durationMs;
  return wrapped < 0 ? wrapped + clip.durationMs : wrapped;
}

function sampleTrack(track: BoneAnimationTrack | undefined, clip: SkeletalAnimationClip | undefined, timeMs: number, fallback = DEFAULT_TRANSFORM) {
  if (!track || track.keyframes.length === 0 || !clip) return fallback;
  const frames = [...track.keyframes].sort((left, right) => left.timeMs - right.timeMs);
  const localTime = normalizeClipTime(clip, timeMs);
  const first = { ...fallback, ...frames[0]!.transform } as typeof fallback;
  if (localTime <= frames[0]!.timeMs) return first;
  for (let index = 0; index < frames.length - 1; index += 1) {
    const start = frames[index]!;
    const end = frames[index + 1]!;
    if (localTime <= end.timeMs) {
      const startTransform = { ...fallback, ...start.transform } as typeof fallback;
      const endTransform = { ...fallback, ...end.transform } as typeof fallback;
      const range = end.timeMs - start.timeMs;
      const portion = range <= 0 ? 1 : clamp01((localTime - start.timeMs) / range);
      return interpolateTransform(startTransform, endTransform, portion);
    }
  }
  return { ...fallback, ...frames[frames.length - 1]!.transform } as typeof fallback;
}

function getSortedMarkers(clip: SkeletalAnimationClip): AnimationMarker[] {
  return [...(clip.markers ?? [])].filter((marker) => Number.isFinite(marker.timeMs)).sort((left, right) => left.timeMs - right.timeMs);
}

function getForwardMarkersInRange(markers: readonly AnimationMarker[], startMs: number, endMs: number): AnimationMarker[] {
  return markers.filter((marker) => marker.timeMs > startMs && marker.timeMs <= endMs);
}

function getBackwardMarkersInRange(markers: readonly AnimationMarker[], startMs: number, endMs: number): AnimationMarker[] {
  return markers.filter((marker) => marker.timeMs <= startMs && marker.timeMs > endMs).reverse();
}

export function sampleAnimationMarkers(clip: SkeletalAnimationClip | undefined, previousTimeMs: number, currentTimeMs: number): AnimationMarker[] {
  if (!clip) return [];
  const markers = getSortedMarkers(clip);
  if (markers.length === 0 || !Number.isFinite(previousTimeMs) || !Number.isFinite(currentTimeMs)) return [];
  const delta = currentTimeMs - previousTimeMs;
  if (delta === 0) return [];
  if (clip.loop === false || clip.durationMs <= 0) {
    const start = Math.min(Math.max(previousTimeMs, 0), Math.max(clip.durationMs, 0));
    const end = Math.min(Math.max(currentTimeMs, 0), Math.max(clip.durationMs, 0));
    return delta > 0 ? getForwardMarkersInRange(markers, start, end) : getBackwardMarkersInRange(markers, start, end);
  }
  if (Math.abs(delta) >= clip.durationMs) return delta > 0 ? markers : [...markers].reverse();
  const start = normalizeClipTime(clip, previousTimeMs);
  const end = normalizeClipTime(clip, currentTimeMs);
  if (delta > 0) {
    return end >= start ? getForwardMarkersInRange(markers, start, end) : [...getForwardMarkersInRange(markers, start, clip.durationMs), ...getForwardMarkersInRange(markers, -1, end)];
  }
  return end <= start ? getBackwardMarkersInRange(markers, start, end) : [...getBackwardMarkersInRange(markers, start, -1), ...getBackwardMarkersInRange(markers, clip.durationMs, end)];
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
  return total <= 0 ? [] : filtered.map((weight) => ({ boneIndex: weight.boneIndex, weight: weight.weight / total }));
}

export function applyMorphTargets(baseVertices: readonly Vec3[], morphTargets: readonly MorphTarget[], weights: Readonly<Record<string, number>> = {}): Vec3[] {
  const morphed = baseVertices.map(cloneVec3);
  for (const target of morphTargets) {
    const weight = clamp01(weights[target.name] ?? 0);
    if (weight === 0) continue;
    for (let index = 0; index < morphed.length; index += 1) {
      const delta = target.positionDeltas[index];
      if (delta) morphed[index] = addVec3(morphed[index]!, scaleVec3(delta, weight));
    }
  }
  return morphed;
}

function applyMorphTargetNormals(baseNormals: readonly Vec3[], morphTargets: readonly MorphTarget[], weights: Readonly<Record<string, number>> = {}): Vec3[] {
  const morphed = baseNormals.map(cloneVec3);
  for (const target of morphTargets) {
    const weight = clamp01(weights[target.name] ?? 0);
    if (weight === 0 || !target.normalDeltas) continue;
    for (let index = 0; index < morphed.length; index += 1) {
      const delta = target.normalDeltas[index];
      if (delta) morphed[index] = addVec3(morphed[index]!, scaleVec3(delta, weight));
    }
  }
  return morphed;
}

export function deformSkinnedMesh(vertices: readonly SkinnedVertex[], poses: readonly BonePose[], morphTargets: readonly MorphTarget[] = [], morphWeights: Readonly<Record<string, number>> = {}): DeformedVertex[] {
  const morphedPositions = applyMorphTargets(vertices.map((vertex) => vertex.position), morphTargets, morphWeights);
  const morphedNormals = applyMorphTargetNormals(vertices.map((vertex) => vertex.normal ?? ZERO_POSITION), morphTargets, morphWeights);
  return vertices.map((vertex, index) => {
    const normalizedWeights = normalizeWeights(vertex.weights);
    const sourcePosition = morphedPositions[index]!;
    const sourceNormal = vertex.normal ? morphedNormals[index]! : null;
    if (normalizedWeights.length === 0) return { position: sourcePosition, normal: sourceNormal };
    let blendedPosition: Vec3 = { x: 0, y: 0, z: 0 };
    let blendedNormal: Vec3 | null = sourceNormal ? { x: 0, y: 0, z: 0 } : null;
    for (const weight of normalizedWeights) {
      const pose = poses[weight.boneIndex];
      if (!pose) continue;
      const bindSpacePosition = applyInverseTransformToPoint(pose.bindWorldTransform, sourcePosition);
      const weightedPosition = applyTransformToPoint(pose.worldTransform, bindSpacePosition);
      blendedPosition = addVec3(blendedPosition, scaleVec3(weightedPosition, weight.weight));
      if (sourceNormal && blendedNormal) {
        const bindSpaceNormal = applyInverseTransformToDirection(pose.bindWorldTransform, sourceNormal);
        const weightedNormal = applyTransformToDirection(pose.worldTransform, bindSpaceNormal);
        blendedNormal = addVec3(blendedNormal, scaleVec3(weightedNormal, weight.weight));
      }
    }
    return { position: blendedPosition, normal: blendedNormal };
  });
}

function blendMorphWeightMaps(bindings: AnimationStateBindings, stateWeights: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  const blended: Record<string, number> = {};
  for (const [stateName, stateWeight] of Object.entries(stateWeights)) {
    const binding = bindings[stateName as AnimationStateName];
    if (!binding?.morphWeights || stateWeight <= 0) continue;
    for (const [morphName, morphWeight] of Object.entries(binding.morphWeights)) {
      blended[morphName] = (blended[morphName] ?? 0) + (morphWeight * stateWeight);
    }
  }
  return blended;
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

export function renderAnimationStateFrame(options: RenderStateAnimationFrameOptions): RenderedAnimationFrame {
  const stateWeights = options.stateMachine.getBlendWeights();
  const blendedLocalTransforms = options.skeleton.bones.map((bone) => {
    const transformSamples = Object.entries(stateWeights).map(([stateName, weight]) => {
      const clip = options.bindings[stateName as AnimationStateName]?.skeletalClip;
      const track = clip ? buildTrackMap(clip).get(bone.name) : undefined;
      return { weight, transform: sampleTrack(track, clip, options.timeMs, bone.bindTransform) };
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
  return { poses, vertices: deformSkinnedMesh(options.vertices, poses, options.morphTargets ?? [], morphWeights), stateWeights, morphWeights };
}

