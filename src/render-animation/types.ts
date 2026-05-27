import type { Orientation, Size, Vec3 } from "../story-api";

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

export interface Skeleton { readonly bones: readonly BoneDefinition[]; }
export interface BoneKeyframe { readonly timeMs: number; readonly transform: AnimationTransformOverride; }
export interface BoneAnimationTrack { readonly boneName: string; readonly keyframes: readonly BoneKeyframe[]; }
export interface AnimationMarker { readonly name: string; readonly timeMs: number; }
export interface SkeletalAnimationClip { readonly name: string; readonly durationMs: number; readonly tracks: readonly BoneAnimationTrack[]; readonly loop?: boolean; readonly markers?: readonly AnimationMarker[]; }
export interface VertexBoneWeight { readonly boneIndex: number; readonly weight: number; }
export interface SkinnedVertex { readonly position: Vec3; readonly normal?: Vec3; readonly weights: readonly VertexBoneWeight[]; }
export interface MorphTarget { readonly name: string; readonly positionDeltas: readonly Vec3[]; readonly normalDeltas?: readonly Vec3[]; }
export interface BonePose { readonly bone: BoneDefinition; readonly localTransform: AnimationTransform; readonly worldTransform: AnimationTransform; readonly bindWorldTransform: AnimationTransform; }
export interface DeformedVertex { readonly position: Vec3; readonly normal: Vec3 | null; }
export type AnimationStateName = "idle" | "walking" | "talking";
export interface AnimationTransition { readonly from: AnimationStateName | "*"; readonly to: AnimationStateName; readonly durationMs: number; }
export interface StateAnimationBinding { readonly skeletalClip?: SkeletalAnimationClip; readonly morphWeights?: Readonly<Record<string, number>>; }
export type AnimationStateBindings = Partial<Record<AnimationStateName, StateAnimationBinding>>;
export interface RenderAnimationFrameOptions { readonly skeleton: Skeleton; readonly vertices: readonly SkinnedVertex[]; readonly timeMs: number; readonly clip?: SkeletalAnimationClip; readonly morphTargets?: readonly MorphTarget[]; readonly morphWeights?: Readonly<Record<string, number>>; }
export interface RenderStateAnimationFrameOptions { readonly skeleton: Skeleton; readonly vertices: readonly SkinnedVertex[]; readonly timeMs: number; readonly stateMachine: AnimationStateMachine; readonly bindings: AnimationStateBindings; readonly morphTargets?: readonly MorphTarget[]; }
export interface RenderedAnimationFrame { readonly poses: readonly BonePose[]; readonly vertices: readonly DeformedVertex[]; readonly stateWeights: Readonly<Record<string, number>>; readonly morphWeights: Readonly<Record<string, number>>; }

export interface AnimationStateMachine {
  getBlendWeights(): Readonly<Record<string, number>>;
}
