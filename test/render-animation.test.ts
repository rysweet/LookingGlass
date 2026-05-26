import { describe, expect, it } from "vitest";
import {
  AnimationStateMachine,
  createAnimationTransform,
  renderAnimationFrame,
  renderAnimationStateFrame,
  sampleSkeletalAnimation,
  type MorphTarget,
  type Skeleton,
  type SkeletalAnimationClip,
  type SkinnedVertex,
} from "../src/render-animation";

function expectVec3Close(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }, precision = 6): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
}

const skeleton: Skeleton = {
  bones: [
    {
      name: "root",
      parentIndex: null,
      bindTransform: createAnimationTransform(),
    },
    {
      name: "hand",
      parentIndex: 0,
      bindTransform: createAnimationTransform({ translation: { x: 0, y: 1, z: 0 } }),
    },
  ],
};

const vertices: readonly SkinnedVertex[] = [
  {
    position: { x: 0, y: 0, z: 0 },
    weights: [{ boneIndex: 0, weight: 1 }],
  },
  {
    position: { x: 0, y: 1, z: 0 },
    weights: [{ boneIndex: 1, weight: 1 }],
  },
];

describe("render animation", () => {
  it("samples skeletal keyframes through the bone hierarchy", () => {
    const clip: SkeletalAnimationClip = {
      name: "walk",
      durationMs: 1000,
      loop: false,
      tracks: [
        {
          boneName: "root",
          keyframes: [
            { timeMs: 0, transform: { translation: { x: 0, y: 0, z: 0 } } },
            { timeMs: 1000, transform: { translation: { x: 2, y: 0, z: 0 } } },
          ],
        },
      ],
    };

    const poses = sampleSkeletalAnimation(skeleton, clip, 500);

    expectVec3Close(poses[0]!.worldTransform.translation, { x: 1, y: 0, z: 0 });
    expectVec3Close(poses[1]!.worldTransform.translation, { x: 1, y: 1, z: 0 });
  });

  it("blends morph targets before skin deformation", () => {
    const morphTargets: readonly MorphTarget[] = [
      {
        name: "smile",
        positionDeltas: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      },
      {
        name: "blink",
        positionDeltas: [
          { x: 0, y: 0, z: -0.5 },
          { x: 0, y: 0, z: 0 },
        ],
      },
    ];

    const frame = renderAnimationFrame({
      skeleton,
      vertices,
      timeMs: 0,
      morphTargets,
      morphWeights: { smile: 0.5, blink: 1 },
    });

    expectVec3Close(frame.vertices[0]!.position, { x: 0, y: 0, z: -0.5 });
    expectVec3Close(frame.vertices[1]!.position, { x: 0, y: 1.5, z: 0 });
  });

  it("deforms a skinned mesh using sampled bone transforms", () => {
    const clip: SkeletalAnimationClip = {
      name: "reach",
      durationMs: 1000,
      loop: false,
      tracks: [
        {
          boneName: "root",
          keyframes: [
            { timeMs: 0, transform: { translation: { x: 0, y: 0, z: 0 } } },
            { timeMs: 1000, transform: { translation: { x: 2, y: 0, z: 0 } } },
          ],
        },
        {
          boneName: "hand",
          keyframes: [
            { timeMs: 0, transform: { translation: { x: 0, y: 1, z: 0 } } },
            { timeMs: 1000, transform: { translation: { x: 1, y: 1, z: 0 } } },
          ],
        },
      ],
    };

    const frame = renderAnimationFrame({
      skeleton,
      vertices,
      clip,
      timeMs: 500,
    });

    expectVec3Close(frame.vertices[0]!.position, { x: 1, y: 0, z: 0 });
    expectVec3Close(frame.vertices[1]!.position, { x: 1.5, y: 1, z: 0 });
  });

  it("blends idle walking and talking states through the animation state machine", () => {
    const idleClip: SkeletalAnimationClip = {
      name: "idle",
      durationMs: 1000,
      loop: true,
      tracks: [],
    };
    const walkingClip: SkeletalAnimationClip = {
      name: "walking",
      durationMs: 1000,
      loop: true,
      tracks: [
        {
          boneName: "root",
          keyframes: [
            { timeMs: 0, transform: { translation: { x: 0, y: 0, z: 0 } } },
            { timeMs: 1000, transform: { translation: { x: 2, y: 0, z: 0 } } },
          ],
        },
      ],
    };
    const talkingClip: SkeletalAnimationClip = {
      name: "talking",
      durationMs: 1000,
      loop: true,
      tracks: [
        {
          boneName: "root",
          keyframes: [
            { timeMs: 0, transform: { translation: { x: 0, y: 0, z: 0 } } },
            { timeMs: 1000, transform: { translation: { x: 0, y: 1, z: 0 } } },
          ],
        },
      ],
    };
    const morphTargets: readonly MorphTarget[] = [{
      name: "mouthOpen",
      positionDeltas: [
        { x: 0, y: 0.2, z: 0 },
        { x: 0, y: 0.4, z: 0 },
      ],
    }];
    const stateMachine = new AnimationStateMachine("idle");
    const bindings = {
      idle: { skeletalClip: idleClip, morphWeights: { mouthOpen: 0 } },
      walking: { skeletalClip: walkingClip, morphWeights: { mouthOpen: 0 } },
      talking: { skeletalClip: talkingClip, morphWeights: { mouthOpen: 1 } },
    } as const;

    stateMachine.trigger("walking");
    stateMachine.update(100);
    const walkingBlend = renderAnimationStateFrame({
      skeleton,
      vertices,
      timeMs: 500,
      stateMachine,
      bindings,
      morphTargets,
    });

    expect(walkingBlend.stateWeights.idle).toBeCloseTo(0.5, 6);
    expect(walkingBlend.stateWeights.walking).toBeCloseTo(0.5, 6);
    expectVec3Close(walkingBlend.vertices[0]!.position, { x: 0.5, y: 0, z: 0 });

    stateMachine.update(100);
    stateMachine.trigger("talking");
    stateMachine.update(75);
    const talkingBlend = renderAnimationStateFrame({
      skeleton,
      vertices,
      timeMs: 500,
      stateMachine,
      bindings,
      morphTargets,
    });

    expect(talkingBlend.stateWeights.walking).toBeCloseTo(0.5, 6);
    expect(talkingBlend.stateWeights.talking).toBeCloseTo(0.5, 6);
    expect(talkingBlend.morphWeights.mouthOpen).toBeCloseTo(0.5, 6);
    expectVec3Close(talkingBlend.vertices[0]!.position, { x: 0.5, y: 0.35, z: 0 });
  });
});
